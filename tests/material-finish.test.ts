import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetError, Texture } from '../packages/assets/src/index.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import {
  MaterialAsset,
  PBRMaterial,
  PBR_FINISH_FLOATS,
  fillPBRFinish,
  pbrEmissiveSlot,
} from '../packages/core/src/pbr-material.js';

function bitmap() {
  return { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function installImages() {
  vi.stubGlobal(
    'ImageData',
    class {
      constructor(
        readonly data: Uint8ClampedArray,
        readonly width: number,
        readonly height: number,
      ) {}
    },
  );
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => bitmap()),
  );
}

function embedded(bytes: Uint8Array): string {
  let text = '';
  for (const value of bytes) text += String.fromCharCode(value);
  return `data:application/octet-stream;base64,${btoa(text)}`;
}

/** One triangle with UVs and two materials, optionally mapped by KHR_materials_variants. */
function variantModel(
  materials: Record<string, unknown>[],
  primitiveExtensions?: Record<string, unknown>,
  documentExtensions?: Record<string, unknown>,
) {
  const bytes = new Uint8Array(60),
    view = new DataView(bytes.buffer);
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1].forEach((value, i) =>
    view.setFloat32(i * 4, value, true),
  );
  return {
    asset: { version: '2.0' },
    ...(documentExtensions ? { extensions: documentExtensions } : {}),
    buffers: [{ byteLength: 60, uri: embedded(bytes) }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 24 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' },
    ],
    materials,
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, TEXCOORD_0: 1 },
            material: 0,
            ...(primitiveExtensions ? { extensions: primitiveExtensions } : {}),
          },
        ],
      },
    ],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
}

const variantDocument = {
  KHR_materials_variants: { variants: [{ name: 'red' }, { name: 'blue' }] },
};
const variantPrimitive = {
  KHR_materials_variants: {
    mappings: [
      { material: 1, variants: [0] },
      { material: 2, variants: [1] },
    ],
  },
};

async function loadVariants() {
  installImages();
  return new GLTFLoader().parse(
    JSON.stringify(
      variantModel(
        [
          { pbrMetallicRoughness: { baseColorFactor: [0, 1, 0, 1] } },
          { pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1] } },
          { pbrMetallicRoughness: { baseColorFactor: [0, 0, 1, 1] } },
        ],
        variantPrimitive,
        variantDocument,
      ),
    ),
  );
}

function firstMesh(asset: { scene: { children: unknown[] } }): Mesh {
  const found: Mesh[] = [];
  const visit = (node: { children?: unknown[] }): void => {
    if (node instanceof Mesh) found.push(node);
    for (const child of node.children ?? []) visit(child as never);
  };
  visit(asset.scene as never);
  return found[0];
}

describe('PBR finish', () => {
  const texture = new Texture(bitmap());

  it('is an exact no-op by default and shares one frozen default', () => {
    const a = new PBRMaterial({ texture });
    const b = new PBRMaterial({ texture, finish: {} });
    expect(a.finish).toBe(b.finish);
    expect(Object.isFrozen(a.finish)).toBe(true);
    const packed = new Float32Array(PBR_FINISH_FLOATS).fill(9);
    fillPBRFinish(a, packed, 0);
    // Strengths are zero; only iridescence IOR, subsurface color and radius carry non-zero defaults.
    expect([...packed]).toEqual([
      0,
      0,
      0,
      Math.fround(1.3),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      0.5,
    ]);
  });

  it('packs every authored factor at its documented slot', () => {
    const material = new PBRMaterial({
      texture,
      finish: {
        anisotropy: 0.1,
        anisotropyRotation: 0.2,
        iridescence: 0.3,
        iridescenceIor: 1.4,
        iridescenceThickness: 0.5,
        subsurface: 0.6,
        subsurfaceColor: [0.7, 0.8, 0.9],
        subsurfaceRadius: 0.25,
        dispersion: 2,
        heightScale: 0.05,
        wetness: 0.15,
        snow: 0.35,
        dirt: 0.45,
        damage: 0.55,
        detailStrength: 0.65,
        triplanar: 0.75,
        layerBlend: 0.85,
        lightmapStrength: 0.95,
      },
    });
    const packed = new Float32Array(PBR_FINISH_FLOATS + 2);
    fillPBRFinish(material, packed, 1);
    expect(Array.from(packed.subarray(1, 21), (v) => +v.toFixed(2))).toEqual([
      0.1, 0.2, 0.3, 1.4, 0.5, 0.6, 2, 0.05, 0.15, 0.35, 0.45, 0.55, 0.65, 0.75,
      0.85, 0.95, 0.7, 0.8, 0.9, 0.25,
    ]);
    expect(packed[0]).toBe(0);
    expect(packed[21]).toBe(0);
  });

  it.each([
    [{ anisotropy: 1.5 }, RangeError],
    [{ iridescenceIor: 0.9 }, RangeError],
    [{ dispersion: -1 }, RangeError],
    [{ subsurfaceColor: [1, 1] }, RangeError],
    [{ wetness: Number.NaN }, RangeError],
    [{ glossy: 1 }, TypeError],
  ])('rejects invalid finish %j', (finish, error) => {
    expect(() => new PBRMaterial({ texture, finish: finish as never })).toThrow(
      error,
    );
  });

  it('lets a lightmap own the emissive sampler without sampling the emissive map', () => {
    const emissive = new Texture(bitmap());
    const baked = new Texture(bitmap());
    expect(
      pbrEmissiveSlot(new PBRMaterial({ texture, emissiveTexture: emissive })),
    ).toMatchObject({ texture: emissive, mode: 1 });
    const both = new PBRMaterial({
      texture,
      emissiveTexture: emissive,
      lightmap: baked,
      lightmapSampler: { magFilter: 'nearest' },
    });
    expect(pbrEmissiveSlot(both)).toMatchObject({ texture: baked, mode: 2 });
    expect(pbrEmissiveSlot(both).sampler).toEqual({ magFilter: 'nearest' });
    expect(pbrEmissiveSlot(new PBRMaterial({ texture })).mode).toBe(0);
    expect(() => new PBRMaterial({ texture, lightmap: {} as never })).toThrow(
      TypeError,
    );
  });
});

describe('MaterialAsset', () => {
  it('owns decoded images, borrows supplied textures and releases once', async () => {
    installImages();
    const borrowed = new Texture(bitmap());
    const asset = await MaterialAsset.fromImages(
      {
        base: new Blob(['a']),
        normal: new Blob(['b']),
        occlusion: borrowed,
      },
      { roughness: 0.2, finish: { wetness: 0.5 } },
    );
    const material = asset.material;
    expect(material.roughness).toBe(0.2);
    expect(material.finish.wetness).toBe(0.5);
    expect(material.occlusionTexture).toBe(borrowed);
    const owned = [material.texture, material.normalTexture!];
    asset.destroy();
    asset.destroy();
    expect(asset.destroyed).toBe(true);
    expect(owned.map((t) => t.destroyed)).toEqual([true, true]);
    expect(borrowed.destroyed).toBe(false);
  });

  it('destroys already decoded images when a later map fails', async () => {
    const decoded: ImageBitmap[] = [];
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async (source: Blob) => {
        if (source.size === 3) throw new Error('bad image');
        const next = bitmap();
        decoded.push(next);
        return next;
      }),
    );
    await expect(
      MaterialAsset.fromImages({
        base: new Blob(['a']),
        normal: new Blob(['bad']),
      }),
    ).rejects.toBeInstanceOf(AssetError);
    expect(decoded).toHaveLength(1);
    expect(decoded[0].close).toHaveBeenCalledTimes(1);
  });

  it('does not destroy borrowed textures of a create() asset', () => {
    const base = new Texture(bitmap());
    const asset = MaterialAsset.create({ texture: base });
    asset.destroy();
    expect(base.destroyed).toBe(false);
  });

  it('rejects a missing base image', async () => {
    installImages();
    await expect(MaterialAsset.fromImages({} as never)).rejects.toBeInstanceOf(
      AssetError,
    );
  });
});

describe('Mesh material replacement', () => {
  const texture = new Texture(bitmap());
  const geometry = new Geometry({
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 0, 1]),
    indices: new Uint32Array([0, 1, 2]),
  });

  it('swaps to another material and rejects non-materials', () => {
    const first = new TextureMaterial({ texture });
    const second = new PBRMaterial({ texture });
    const mesh = new Mesh({ geometry, material: first });
    mesh.material = second;
    expect(mesh.material).toBe(second);
    expect(() => {
      mesh.material = {} as never;
    }).toThrow(TypeError);
    expect(mesh.material).toBe(second);
  });
});

describe('glTF material variants', () => {
  it('selects, switches and restores per-variant materials', async () => {
    const asset = await loadVariants();
    const mesh = firstMesh(asset);
    const base = mesh.material as PBRMaterial;
    expect(asset.variants.map((v) => v.name)).toEqual(['red', 'blue']);
    expect(base.color).toEqual([0, 1, 0]);

    asset.selectVariant('red');
    expect((mesh.material as PBRMaterial).color).toEqual([1, 0, 0]);
    asset.selectVariant('blue');
    expect((mesh.material as PBRMaterial).color).toEqual([0, 0, 1]);
    asset.selectVariant(undefined);
    expect(mesh.material).toBe(base);
    asset.dispose();
  });

  it('rejects unknown names without changing the current material', async () => {
    const asset = await loadVariants();
    const mesh = firstMesh(asset);
    asset.selectVariant('red');
    const red = mesh.material;
    expect(() => asset.selectVariant('green')).toThrow(AssetError);
    expect(mesh.material).toBe(red);
    asset.dispose();
    expect(() => asset.selectVariant('red')).toThrow(AssetError);
  });

  it('exposes no variants for a plain model', async () => {
    installImages();
    const asset = await new GLTFLoader().parse(
      JSON.stringify(variantModel([{}])),
    );
    expect(asset.variants).toEqual([]);
    expect(() => asset.selectVariant('red')).toThrow(AssetError);
    asset.selectVariant(undefined);
    asset.dispose();
  });

  it.each([
    ['an out-of-range variant', { mappings: [{ material: 0, variants: [5] }] }],
    [
      'an out-of-range material',
      { mappings: [{ material: 9, variants: [0] }] },
    ],
    ['an empty variant list', { mappings: [{ material: 0, variants: [] }] }],
  ])('rejects %s', async (_label, extension) => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          variantModel(
            [{}],
            { KHR_materials_variants: extension },
            { KHR_materials_variants: { variants: [{ name: 'a' }] } },
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(AssetError);
  });
});

describe('glTF finish extensions', () => {
  async function loadMaterial(extensions: Record<string, unknown>) {
    installImages();
    const asset = await new GLTFLoader().parse(
      JSON.stringify(variantModel([{ extensions }])),
    );
    return { asset, material: firstMesh(asset).material as PBRMaterial };
  }

  it('maps anisotropy, iridescence and dispersion into the finish', async () => {
    const { asset, material } = await loadMaterial({
      KHR_materials_anisotropy: {
        anisotropyStrength: -0.5,
        anisotropyRotation: 0.25,
      },
      KHR_materials_iridescence: {
        iridescenceFactor: 0.8,
        iridescenceIor: 1.6,
        iridescenceThicknessMaximum: 450,
      },
      KHR_materials_transmission: { transmissionFactor: 1 },
      KHR_materials_dispersion: { dispersion: 3 },
    });
    expect(material.finish).toMatchObject({
      anisotropy: 0.5,
      anisotropyRotation: 0.25,
      iridescence: 0.8,
      iridescenceIor: 1.6,
      dispersion: 3,
    });
    expect(material.finish.iridescenceThickness).toBeCloseTo(0.5);
    asset.dispose();
  });

  it('keeps the default finish for a plain material', async () => {
    const { asset, material } = await loadMaterial({});
    expect(material.finish.anisotropy).toBe(0);
    expect(material.finish.iridescence).toBe(0);
    asset.dispose();
  });

  it.each([
    {
      label: 'dispersion without transmission',
      extensions: { KHR_materials_dispersion: { dispersion: 1 } },
      error: AssetError,
    },
    {
      label: 'an anisotropy texture',
      extensions: {
        KHR_materials_anisotropy: { anisotropyTexture: { index: 0 } },
      },
      error: AssetError,
    },
    {
      label: 'an iridescence texture',
      extensions: {
        KHR_materials_iridescence: { iridescenceTexture: { index: 0 } },
      },
      error: AssetError,
    },
    {
      label: 'iridescence IOR below one',
      extensions: { KHR_materials_iridescence: { iridescenceIor: 0.5 } },
      error: AssetError,
    },
    {
      label: 'unlit combined with anisotropy',
      extensions: { KHR_materials_unlit: {}, KHR_materials_anisotropy: {} },
      error: AssetError,
    },
  ])('rejects $label', async ({ extensions, error }) => {
    installImages();
    await expect(
      new GLTFLoader().parse(JSON.stringify(variantModel([{ extensions }]))),
    ).rejects.toBeInstanceOf(error);
  });
});
