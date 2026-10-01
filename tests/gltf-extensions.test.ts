import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetError } from '../packages/assets/src/index.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { Mesh } from '../packages/core/src/mesh.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';

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
    vi.fn(async () => ({ width: 1, height: 1, close: vi.fn() })),
  );
}

function embedded(bytes: Uint8Array): string {
  let text = '';
  for (const value of bytes) text += String.fromCharCode(value);
  return `data:application/octet-stream;base64,${btoa(text)}`;
}

/** One triangle with UVs (0,0) (1,0) (0,1) and a single texture-bearing material. */
function model(
  material: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  const bytes = new Uint8Array(60),
    view = new DataView(bytes.buffer);
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1].forEach((value, i) =>
    view.setFloat32(i * 4, value, true),
  );
  return {
    asset: { version: '2.0' },
    buffers: [{ byteLength: 60, uri: embedded(bytes) }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 24 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' },
    ],
    images: [{ uri: embedded(new Uint8Array([1])) }],
    textures: [{ source: 0 }],
    materials: [material],
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
    ...extra,
  };
}

async function load(document: unknown) {
  installImages();
  const asset = await new GLTFLoader().parse(JSON.stringify(document));
  const mesh = [...[...asset.scene.children][0].children][0] as Mesh;
  return { asset, mesh, material: mesh.material as PBRMaterial };
}

function uvs(mesh: Mesh): number[] {
  const v = mesh.geometry.vertices;
  return [v[6], v[7], v[14], v[15], v[22], v[23]];
}

describe('glTF extensions', () => {
  it('rejects unknown required extensions but accepts implemented ones', async () => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          model({}, { extensionsRequired: ['KHR_draco_mesh_compression'] }),
        ),
      ),
    ).rejects.toThrow(/Required glTF extensions/);
    const { asset } = await load(
      model({}, { extensionsRequired: ['KHR_mesh_quantization'] }),
    );
    asset.dispose();
  });

  it('scales emissive by KHR_materials_emissive_strength', async () => {
    const { asset, material } = await load(
      model({
        emissiveFactor: [0.5, 0.25, 0],
        extensions: {
          KHR_materials_emissive_strength: { emissiveStrength: 4 },
        },
      }),
    );
    expect(material.emissive).toEqual([2, 1, 0]);
    asset.dispose();
  });

  it('rejects negative emissive strength', async () => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          model({
            extensions: {
              KHR_materials_emissive_strength: { emissiveStrength: -1 },
            },
          }),
        ),
      ),
    ).rejects.toThrow(/negative/);
  });

  it.each([
    'KHR_materials_ior',
    'KHR_materials_specular',
    'KHR_materials_clearcoat',
    'KHR_materials_sheen',
  ])('rejects %s combined with unlit', async (extension) => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          model(
            {
              extensions: { [extension]: {}, KHR_materials_unlit: {} },
            },
            { extensionsRequired: [extension] },
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(AssetError);
  });

  it.each([
    ['KHR_materials_ior', { ior: -1 }],
    ['KHR_materials_ior', { ior: 0.5 }],
    ['KHR_materials_specular', { specularFactor: 1.1 }],
    ['KHR_materials_specular', { specularColorFactor: [1, -1, 1] }],
    ['KHR_materials_clearcoat', { clearcoatFactor: -1 }],
    ['KHR_materials_clearcoat', { clearcoatRoughnessFactor: 1.1 }],
    ['KHR_materials_sheen', { sheenColorFactor: [1, 1.1, 1] }],
    ['KHR_materials_sheen', { sheenRoughnessFactor: -1 }],
  ])('rejects invalid %s factors %j', async (extension, factors) => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          model(
            {
              extensions: { [extension as string]: factors },
            },
            { extensionsRequired: [extension] },
          ),
        ),
      ),
    ).rejects.toMatchObject({ cause: expect.any(RangeError) });
  });

  it.each([
    ['KHR_materials_specular', 'specularTexture'],
    ['KHR_materials_specular', 'specularColorTexture'],
    ['KHR_materials_clearcoat', 'clearcoatTexture'],
    ['KHR_materials_clearcoat', 'clearcoatRoughnessTexture'],
    ['KHR_materials_clearcoat', 'clearcoatNormalTexture'],
    ['KHR_materials_sheen', 'sheenColorTexture'],
    ['KHR_materials_sheen', 'sheenRoughnessTexture'],
  ])('rejects an incompatible transform on %s %s', async (extension, slot) => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          model({
            pbrMetallicRoughness: { baseColorTexture: { index: 0 } },
            extensions: {
              [extension]: {
                [slot]: {
                  index: 0,
                  extensions: { KHR_texture_transform: { offset: [0.5, 0] } },
                },
              },
            },
          }),
        ),
      ),
    ).rejects.toBeInstanceOf(AssetError);
  });

  it('maps KHR_materials_unlit base color to emission with no diffuse response', async () => {
    const { asset, material } = await load(
      model({
        pbrMetallicRoughness: {
          baseColorFactor: [0.2, 0.4, 0.6, 0.5],
          baseColorTexture: { index: 0 },
        },
        alphaMode: 'BLEND',
        extensions: { KHR_materials_unlit: {} },
      }),
    );
    expect(material.color).toEqual([0, 0, 0]);
    expect(material.emissive[0]).toBeCloseTo(0.2);
    expect(material.emissive[2]).toBeCloseTo(0.6);
    expect(material.opacity).toBeCloseTo(0.5);
    expect(material.emissiveTexture).toBe(material.texture);
    asset.dispose();
  });

  it('bakes KHR_texture_transform (offset, rotation, scale) into UV0', async () => {
    const transform = {
      offset: [0.5, 0.25],
      rotation: Math.PI / 2,
      scale: [2, 3],
    };
    const { asset, mesh } = await load(
      model({
        pbrMetallicRoughness: {
          baseColorTexture: {
            index: 0,
            extensions: { KHR_texture_transform: transform },
          },
        },
      }),
    );
    // uv' = offset + R * S * uv, R = [[cos, sin], [-sin, cos]].
    const [u0, v0, u1, v1, u2, v2] = uvs(mesh);
    expect([u0, v0]).toEqual([0.5, 0.25].map((x) => expect.closeTo(x, 5)));
    expect(u1).toBeCloseTo(0.5);
    expect(v1).toBeCloseTo(0.25 - 2);
    expect(u2).toBeCloseTo(0.5 + 3);
    expect(v2).toBeCloseTo(0.25);
    asset.dispose();
  });

  it('rejects materials whose textures use different transforms', async () => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          model({
            pbrMetallicRoughness: {
              baseColorTexture: {
                index: 0,
                extensions: { KHR_texture_transform: { scale: [2, 2] } },
              },
            },
            emissiveTexture: { index: 0 },
          }),
        ),
      ),
    ).rejects.toThrow(/same KHR_texture_transform/);
  });

  it('accepts mipmapped minification filters as their base filter', async () => {
    const { asset, material } = await load(
      model(
        { pbrMetallicRoughness: { baseColorTexture: { index: 0 } } },
        {
          textures: [{ source: 0, sampler: 0 }],
          samplers: [{ minFilter: 9984 }],
        },
      ),
    );
    expect(material.textureSampler?.minFilter).toBe('nearest');
    asset.dispose();
  });

  it('bakes KHR_lights_punctual at node world transforms', async () => {
    const document = model(
      {},
      {
        extensionsRequired: ['KHR_lights_punctual'],
        extensions: {
          KHR_lights_punctual: {
            lights: [
              { type: 'point', color: [1, 0.5, 0], intensity: 3, range: 10 },
              {
                type: 'spot',
                intensity: 2,
                spot: { innerConeAngle: 0.1, outerConeAngle: 0.5 },
              },
              { type: 'directional', intensity: 5 },
            ],
          },
        },
        nodes: [
          { mesh: 0, children: [1, 2, 3], translation: [10, 0, 0] },
          {
            translation: [1, 2, 3],
            extensions: { KHR_lights_punctual: { light: 0 } },
          },
          {
            // Rotated 180° about Y: the node's −Z axis now points along +Z.
            rotation: [0, 1, 0, 0],
            extensions: { KHR_lights_punctual: { light: 1 } },
          },
          { extensions: { KHR_lights_punctual: { light: 2 } } },
        ],
      },
    );
    installImages();
    const asset = await new GLTFLoader().parse(JSON.stringify(document));
    const { point, spot, directional } = asset.lights;
    expect(point).toHaveLength(1);
    expect(point[0].position.x).toBeCloseTo(11);
    expect(point[0].position.y).toBeCloseTo(2);
    expect(point[0].color).toEqual([1, 0.5, 0]);
    expect(point[0].range).toBe(10);
    expect(spot[0].direction.z).toBeCloseTo(1);
    expect(spot[0].outerAngle).toBeCloseTo(0.5);
    expect(directional[0].direction.z).toBeCloseTo(-1);
    expect(directional[0].intensity).toBe(5);
    asset.dispose();
  });

  it('returns empty lights when the extension is absent', async () => {
    const { asset } = await load(model({}));
    expect(asset.lights).toEqual({ point: [], spot: [], directional: [] });
    asset.dispose();
  });
});
