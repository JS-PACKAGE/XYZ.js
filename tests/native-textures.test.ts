import { describe, expect, it } from 'vitest';
import {
  NativeTexture2D,
  nativeTextureLayout,
} from '../packages/assets/src/native-texture.js';
import type { NativeTextureFormat } from '../packages/assets/src/native-texture.js';
import { Texture } from '../packages/assets/src/index.js';
import { decodeKTX2, decodeKTX2Native } from '../packages/core/src/ktx2.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import type { Mesh } from '../packages/core/src/mesh.js';

function container(
  format: number,
  width: number,
  height: number,
  levels: readonly Uint8Array[],
  compression = 0,
  lengths = levels.map((level) => level.length),
): Uint8Array {
  let offset = 80 + levels.length * 24;
  const bytes = new Uint8Array(
    offset + levels.reduce((sum, level) => sum + level.length, 0),
  );
  bytes.set([
    0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const view = new DataView(bytes.buffer);
  for (const [position, value] of [
    [12, format],
    [16, 1],
    [20, width],
    [24, height],
    [36, 1],
    [40, levels.length],
    [44, compression],
  ])
    view.setUint32(position!, value!, true);
  for (let i = 0; i < levels.length; i++) {
    view.setBigUint64(80 + i * 24, BigInt(offset), true);
    view.setBigUint64(88 + i * 24, BigInt(levels[i]!.length), true);
    view.setBigUint64(96 + i * 24, BigInt(lengths[i]!), true);
    bytes.set(levels[i]!, offset);
    offset += levels[i]!.length;
  }
  return bytes;
}

function texture(
  format: NativeTextureFormat,
  width: number,
  height: number,
  count = 1,
): NativeTexture2D {
  return new NativeTexture2D({
    format,
    width,
    height,
    levels: Array.from({ length: count }, (_, i) => {
      const w = Math.max(1, Math.floor(width / 2 ** i)),
        h = Math.max(1, Math.floor(height / 2 ** i));
      return {
        width: w,
        height: h,
        data: new Uint8Array(nativeTextureLayout(format, w, h).byteLength),
      };
    }),
  });
}

describe('native texture payload contract', () => {
  it('rounds rectangular and tiny mips to complete format blocks', () => {
    expect(nativeTextureLayout('bc1-rgba-unorm', 5, 7)).toEqual({
      bytesPerRow: 16,
      rows: 2,
      byteLength: 32,
    });
    expect(nativeTextureLayout('astc-10x6-unorm-srgb', 11, 7)).toEqual({
      bytesPerRow: 32,
      rows: 2,
      byteLength: 64,
    });
    expect(
      texture('bc3-rgba-unorm', 5, 7, 3).levels.map((level) => [
        level.width,
        level.height,
        level.data.length,
      ]),
    ).toEqual([
      [5, 7, 64],
      [2, 3, 16],
      [1, 1, 16],
    ]);
    expect(texture('rgba8unorm', 3, 5, 3).byteLength).toBe(72);
  });

  it('owns input byte snapshots and rejects image-only access without breaking Texture borrowing', () => {
    const input = new Uint8Array([10, 20, 30, 40]);
    const native = new NativeTexture2D({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      levels: [{ width: 1, height: 1, data: input }],
    });
    input.fill(0);
    expect(Array.from(native.levels[0]!.data)).toEqual([10, 20, 30, 40]);
    expect(native).toBeInstanceOf(Texture);
    expect(() => native.image).toThrow(/no decoded image/);
    native.destroy();
    native.destroy();
    expect(native.destroyed).toBe(true);
  });

  it('rejects invalid block bytes, mip dimensions, excess tails and resource limits', () => {
    expect(() => texture('bc1-rgba-unorm', 0, 4)).toThrow();
    expect(() => texture('rgba8unorm', 8193, 1)).toThrow(/budget/);
    expect(() => texture('rgba8unorm', 1.5, 1)).toThrow(/budget/);
    expect(() => texture('rgba8unorm', 1, 1, 2)).toThrow(/mip chain/);
    expect(
      () =>
        new NativeTexture2D({
          format: 'bc1-rgba-unorm',
          width: 4,
          height: 4,
          levels: [{ width: 4, height: 4, data: new Uint8Array(7) }],
        }),
    ).toThrow(/block layout/);
    expect(
      () =>
        new NativeTexture2D({
          format: 'bc1-rgba-unorm',
          width: 4,
          height: 4,
          levels: [
            { width: 4, height: 4, data: new Uint8Array(8) },
            { width: 1, height: 1, data: new Uint8Array(8) },
          ],
        }),
    ).toThrow(/mip 1/);
    expect(() => texture('rgba8unorm', 4096, 2049)).toThrow(
      /byte resource budget/,
    );
  });

  it('validates independent mip filters and ordered finite LOD bounds', () => {
    const native = texture('rgba8unorm', 1, 1);
    expect(
      () =>
        new PBRMaterial({
          texture: native,
          textureSampler: { lodMinClamp: 2, lodMaxClamp: 1 },
        }),
    ).toThrow(/LOD/);
    expect(
      () =>
        new PBRMaterial({
          texture: native,
          textureSampler: { lodMaxClamp: Infinity },
        }),
    ).toThrow(/LOD/);
    expect(
      () =>
        new PBRMaterial({
          texture: native,
          textureSampler: { mipmapFilter: 'invalid' as 'linear' },
        }),
    ).toThrow(/filters/);
  });
});

describe('native KTX2 decoding', () => {
  it('preserves all compressed mips and takes ownership independent of the file', async () => {
    const levels = [
      new Uint8Array(32).fill(1),
      new Uint8Array(8).fill(2),
      new Uint8Array(8).fill(3),
      new Uint8Array(8).fill(4),
    ];
    const file = container(134, 8, 8, levels);
    const native = await decodeKTX2Native(file);
    file.fill(0);
    expect(native.format).toBe('bc1-rgba-unorm-srgb');
    expect(
      native.levels.map((level) => [
        level.width,
        level.height,
        Array.from(level.data),
      ]),
    ).toEqual(
      levels.map((data, i) => [
        Math.max(1, 8 / 2 ** i),
        Math.max(1, 8 / 2 ** i),
        Array.from(data),
      ]),
    );
    expect(native.byteLength).toBe(56);
  });

  it('keeps decoded RGBA default separate from the opt-in mip chain', async () => {
    const base = new Uint8Array(16).fill(128),
      tail = new Uint8Array([255, 0, 0, 255]);
    const file = container(37, 2, 2, [base, tail]);
    expect((await decodeKTX2(file)).data).toEqual(base);
    expect((await decodeKTX2Native(file)).levels[1]!.data).toEqual(tail);
  });

  it('inflates every ZLIB compressed level and rejects false declared block sizes', async () => {
    const levels = [
      new Uint8Array(8).fill(5),
      new Uint8Array(8).fill(6),
      new Uint8Array(8).fill(7),
    ];
    const zipped = await Promise.all(
      levels.map(
        async (level) =>
          new Uint8Array(
            await new Response(
              new Blob([level])
                .stream()
                .pipeThrough(new CompressionStream('deflate')),
            ).arrayBuffer(),
          ),
      ),
    );
    expect(
      (
        await decodeKTX2Native(container(133, 4, 4, zipped, 3, [8, 8, 8]))
      ).levels.map((level) => level.data),
    ).toEqual(levels);
    await expect(
      decodeKTX2Native(container(133, 4, 4, zipped, 3, [8, 7, 8])),
    ).rejects.toThrow(/inflated byte length/);
  });

  it('rejects unsupported payloads without a real transcoder and validates every transcoded mip', async () => {
    const file = container(0, 4, 4, [new Uint8Array(8), new Uint8Array(8)], 1);
    await expect(decodeKTX2Native(file)).rejects.toThrow(
      /native KTX2 transcoder/,
    );
    const native = await decodeKTX2Native(file, () => ({
      format: 'bc1-rgba-unorm',
      width: 4,
      height: 4,
      levels: [
        { width: 4, height: 4, data: new Uint8Array(8).fill(9) },
        { width: 2, height: 2, data: new Uint8Array(8).fill(10) },
      ],
    }));
    expect(Array.from(native.levels[1]!.data)).toEqual(Array(8).fill(10));
    await expect(
      decodeKTX2Native(file, () => ({
        format: 'rgba8unorm',
        width: 4,
        height: 4,
        levels: [{ width: 4, height: 4, data: new Uint8Array(64) }],
      })),
    ).rejects.toThrow(/every mip/);
    await expect(
      decodeKTX2Native(container(133, 4, 4, [new Uint8Array(9)])),
    ).rejects.toThrow(/block layout/);
    await expect(
      decodeKTX2Native(
        container(133, 1, 1, [new Uint8Array(8), new Uint8Array(8)]),
      ),
    ).rejects.toThrow(/too many mip/);
  });
});

it('loads native KTX2 glTF materials without bitmap decoding, preserves mip sampling, and disposes ownership', async () => {
  const uri = (bytes: Uint8Array): string =>
    `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}`;
  const vertices = new Float32Array([
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1,
  ]);
  const image = container(133, 4, 4, [
    new Uint8Array(8).fill(3),
    new Uint8Array(8).fill(4),
  ]);
  const document = {
    asset: { version: '2.0' },
    extensionsRequired: ['KHR_texture_basisu'],
    buffers: [{ byteLength: 60, uri: uri(new Uint8Array(vertices.buffer)) }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 24 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' },
    ],
    images: [{ uri: uri(image), mimeType: 'image/ktx2' }],
    textures: [
      { extensions: { KHR_texture_basisu: { source: 0 } }, sampler: 0 },
    ],
    samplers: [{ minFilter: 9984, magFilter: 9728 }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
    meshes: [
      {
        primitives: [
          { attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 },
        ],
      },
    ],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
  const asset = await new GLTFLoader().parse(
    JSON.stringify(document),
    undefined,
    { nativeTextures: true },
  );
  const material = ([...[...asset.scene.children][0]!.children][0] as Mesh)
    .material as PBRMaterial;
  expect(material.texture).toBeInstanceOf(NativeTexture2D);
  expect(
    (material.texture as NativeTexture2D).levels.map((level) => level.data[0]),
  ).toEqual([3, 4]);
  expect(material.textureSampler?.minFilter).toBe('nearest');
  expect(material.textureSampler?.mipmapFilter).toBe('nearest');
  expect(material.textureSampler?.lodMaxClamp).toBe(32);
  asset.dispose();
  expect(material.texture.destroyed).toBe(true);
});
