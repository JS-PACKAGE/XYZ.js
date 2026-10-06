import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseModel,
  preflight,
  ingest,
  mipChain,
  encodeKTX2,
  packBuffers,
  recipeSupportsExtension,
} from '../scripts/asset-recipe-lib.mjs';
import { decodeKTX2Native } from '../packages/core/src/ktx2.ts';

const document = () => ({
  asset: { version: '2.0' },
  accessors: [
    { type: 'VEC3', count: 3, bufferView: 0 },
    { type: 'VEC2', count: 3, bufferView: 1 },
  ],
  meshes: [
    {
      primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 }],
    },
  ],
  materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
  textures: [{ source: 0 }],
});
function glb(json, bin = Buffer.from([1, 2, 3, 4])) {
  const text = Buffer.from(JSON.stringify(json)),
    padding = (4 - (text.length % 4)) % 4;
  const bytes = Buffer.alloc(28 + text.length + padding + bin.length);
  bytes.writeUInt32LE(0x46546c67);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(text.length + padding, 12);
  bytes.writeUInt32LE(0x4e4f534a, 16);
  text.copy(bytes, 20);
  bytes.fill(32, 20 + text.length, 20 + text.length + padding);
  const offset = 20 + text.length + padding;
  bytes.writeUInt32LE(bin.length, offset);
  bytes.writeUInt32LE(0x004e4942, offset + 4);
  bin.copy(bytes, offset + 8);
  return bytes;
}

describe('headless asset recipe compatibility', () => {
  it('rejects GLB payload length corruption rather than reading outside its chunk', () => {
    const bytes = glb({ asset: { version: '2.0' } });
    expect([...parseModel(bytes).binary]).toEqual([1, 2, 3, 4]);
    bytes.writeUInt32LE(bytes.length, 12);
    expect(() => parseModel(bytes)).toThrow('chunk range');
  });
  it('rejects non-triangle topology and absent texture UVs before output publication', () => {
    const model = document();
    model.meshes[0].primitives[0].mode = 5;
    expect(() => preflight(model)).toThrow('TRIANGLES');
    delete model.meshes[0].primitives[0].mode;
    delete model.meshes[0].primitives[0].attributes.TEXCOORD_0;
    expect(() => preflight(model)).toThrow('TEXCOORD_0');
  });
  it('requires the UV stream selected by a per-slot transform override', () => {
    const model = document();
    model.materials[0].pbrMetallicRoughness.baseColorTexture.extensions = {
      KHR_texture_transform: { texCoord: 1, offset: [0.5, 0] },
    };
    expect(() => preflight(model)).toThrow('TEXCOORD_1');
    model.meshes[0].primitives[0].attributes.TEXCOORD_1 = 1;
    model.materials[0].normalTexture = { index: 0, texCoord: 2 };
    expect(() => preflight(model)).toThrow('texture texCoord');
  });
  it('rejects required external codecs and a Basis texture without plain fallback', () => {
    const model = document();
    model.extensionsRequired = ['KHR_draco_mesh_compression'];
    expect(() => preflight(model)).toThrow('not included');
    delete model.extensionsRequired;
    model.textures[0] = { extensions: { KHR_texture_basisu: { source: 1 } } };
    expect(() => preflight(model)).toThrow('no Basis codec');
  });
  it('accepts scalar finish extensions and checks mapped variant material UVs', () => {
    const model = document();
    model.extensionsRequired = [
      'KHR_materials_variants',
      'KHR_materials_anisotropy',
      'KHR_materials_iridescence',
      'KHR_materials_dispersion',
    ];
    expect(model.extensionsRequired.every(recipeSupportsExtension)).toBe(true);
    model.extensions = {
      KHR_materials_variants: { variants: [{ name: 'finish' }] },
    };
    model.materials.push({
      extensions: {
        KHR_materials_anisotropy: { anisotropyStrength: 0.5 },
        KHR_materials_iridescence: { iridescenceFactor: 0.4 },
        KHR_materials_transmission: { transmissionFactor: 0.6 },
        KHR_materials_dispersion: { dispersion: 0.2 },
      },
      emissiveTexture: { index: 0, texCoord: 1 },
    });
    model.meshes[0].primitives[0].extensions = {
      KHR_materials_variants: {
        mappings: [{ material: 1, variants: [0] }],
      },
    };
    expect(() => preflight(model)).toThrow('TEXCOORD_1');
    model.meshes[0].primitives[0].attributes.TEXCOORD_1 = 1;
    expect(() => preflight(model)).not.toThrow();
    model.meshes[0].primitives[0].extensions.KHR_materials_variants.mappings[0].material = 2;
    expect(() => preflight(model)).toThrow('variant material');
  });
  it.each([
    ['KHR_materials_anisotropy', 'anisotropyTexture'],
    ['KHR_materials_iridescence', 'iridescenceTexture'],
    ['KHR_materials_iridescence', 'iridescenceThicknessTexture'],
  ])(
    'accepts %s %s and validates its independent transformed UV selection',
    (name, slot) => {
      const model = document();
      const info = {
        index: 0,
        extensions: {
          KHR_texture_transform: { texCoord: 1, offset: [0.2, 0.3] },
        },
      };
      model.materials[0].extensions = { [name]: { [slot]: info } };
      expect(() => preflight(model)).toThrow('TEXCOORD_1');
      model.meshes[0].primitives[0].attributes.TEXCOORD_1 = 1;
      expect(() => preflight(model)).not.toThrow();
    },
  );
  it('requires transmission for dispersion just like the runtime loader', () => {
    const model = document();
    model.materials[0].extensions = {
      KHR_materials_dispersion: { dispersion: 0.2 },
    };
    expect(() => preflight(model)).toThrow('Dispersion requires');
  });
  it('rejects unlit materials using physically based extensions', () => {
    const model = document();
    model.materials[0].extensions = {
      KHR_materials_unlit: {},
      KHR_materials_clearcoat: { clearcoatFactor: 1 },
    };
    expect(() => preflight(model)).toThrow('Unlit');
  });
  it('includes odd edge pixels in native mip levels and survives the real KTX2 decoder', async () => {
    const rgba = [0, 0, 0, 255, 90, 30, 0, 255, 180, 60, 0, 255];
    const levels = mipChain(3, 1, rgba);
    const texture = await decodeKTX2Native(encodeKTX2(levels));
    try {
      expect(texture.format).toBe('rgba8unorm');
      expect(
        texture.levels.map((level) => [
          level.width,
          level.height,
          [...level.data],
        ]),
      ).toEqual([
        [3, 1, rgba],
        [1, 1, [90, 30, 0, 255]],
      ]);
    } finally {
      texture.destroy();
    }
  });
  it('filters sRGB in linear light and prevents transparent colors bleeding into straight-alpha mips', () => {
    const color = mipChain(2, 1, [0, 0, 0, 255, 255, 255, 255, 255], {
      kind: 'srgb',
      alpha: 'straight',
    });
    expect([...color[1].data]).toEqual([188, 188, 188, 255]);
    const alpha = mipChain(2, 1, [255, 0, 0, 255, 0, 0, 255, 0], {
      kind: 'srgb',
      alpha: 'straight',
    });
    expect([...alpha[1].data]).toEqual([255, 0, 0, 128]);
  });
  it('keeps the nearest attainable cutout coverage without importing hidden transparent colors', async () => {
    const alpha = [
      255, 255, 255, 255, 255, 0, 255, 0, 255, 255, 0, 0, 255, 0, 0, 0,
    ];
    const rgba = alpha.flatMap((a) => (a ? [255, 48, 16, a] : [0, 0, 255, a]));
    const levels = mipChain(4, 4, rgba, {
      kind: 'linear',
      alpha: 'straight',
      alphaCoverageCutoff: 0.8,
    });
    const texture = await decodeKTX2Native(encodeKTX2(levels));
    try {
      const mip = texture.levels[1].data;
      let covered = 0;
      for (let i = 0; i < mip.length; i += 4) {
        if (mip[i + 3] / 255 >= 0.8) {
          covered++;
          expect([...mip.subarray(i, i + 3)]).toEqual([255, 48, 16]);
        } else expect([...mip.subarray(i, i + 4)]).toEqual([0, 0, 0, 0]);
      }
      // Three tied mip texels cannot represent the source's 9/16 coverage exactly.
      expect(covered).toBe(3);
      expect(texture.levels[2].data[3] / 255).toBeGreaterThanOrEqual(0.8);
    } finally {
      texture.destroy();
    }
  });
  it('renormalizes averaged normal vectors rather than shortening their lighting magnitude', () => {
    const levels = mipChain(2, 1, [255, 128, 128, 255, 128, 255, 128, 255], {
      kind: 'normal',
      alpha: 'opaque',
    });
    const normal = [...levels[1].data]
      .slice(0, 3)
      .map((v) => (v / 255) * 2 - 1);
    expect(Math.hypot(...normal)).toBeCloseTo(1, 2);
    expect(normal[0]).toBeCloseTo(normal[1], 3);
  });
  it('rejects an out-of-range view during payload packing', () => {
    const model = {
      bufferViews: [{ buffer: 0, byteOffset: 2, byteLength: 4 }],
    };
    expect(() => packBuffers(model, [Buffer.alloc(4)])).toThrow(
      'out of bounds',
    );
  });
  it('cannot acquire resources through a symlink escaping the authoring directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'xyz-recipe-test-'));
    try {
      await writeFile(
        join(directory, 'outside.bin'),
        Buffer.from([1, 2, 3, 4]),
      );
      const authoring = join(directory, 'inside');
      const { mkdir } = await import('node:fs/promises');
      await mkdir(authoring);
      await symlink(
        join(directory, 'outside.bin'),
        join(authoring, 'escape.bin'),
      );
      await writeFile(
        join(authoring, 'source.gltf'),
        JSON.stringify({
          asset: { version: '2.0' },
          buffers: [{ byteLength: 4, uri: 'escape.bin' }],
        }),
      );
      await expect(ingest(join(authoring, 'source.gltf'))).rejects.toThrow(
        'escapes',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
