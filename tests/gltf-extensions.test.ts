import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetError } from '../packages/assets/src/index.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { Mesh } from '../packages/core/src/mesh.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';

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

function tangentModel(
  component: 5120 | 5122 | 5126 = 5126,
  texCoord: 0 | 1 = 0,
) {
  const base = model({ normalTexture: { index: 0, texCoord } });
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const tangents =
    component === 5120
      ? new Int8Array([0, 127, 0, -127, 0, 127, 0, -127, 0, 127, 0, -127])
      : component === 5122
        ? new Int16Array([
            0, 32767, 0, -32767, 0, 32767, 0, -32767, 0, 32767, 0, -32767,
          ])
        : new Float32Array([0, 2, 0, -1, 0, 2, 0, -1, 0, 2, 0, -1]);
  const delta = new Float32Array([-1, -1, 0, -1, -1, 0, -1, -1, 0]);
  const streams = [normals, tangents, delta];
  if (texCoord === 1) streams.push(new Float32Array([0, 0, 1, 0, 0, 1]));
  return {
    ...base,
    extensionsUsed: component === 5126 ? [] : ['KHR_mesh_quantization'],
    buffers: [
      ...base.buffers,
      ...streams.map((data) => ({
        byteLength: data.byteLength,
        uri: embedded(new Uint8Array(data.buffer)),
      })),
    ],
    bufferViews: [
      ...base.bufferViews,
      ...streams.map((data, i) => ({
        buffer: i + 1,
        byteOffset: 0,
        byteLength: data.byteLength,
      })),
    ],
    accessors: [
      ...base.accessors,
      { bufferView: 2, componentType: 5126, count: 3, type: 'VEC3' },
      {
        bufferView: 3,
        componentType: component,
        normalized: component !== 5126,
        count: 3,
        type: 'VEC4',
      },
      { bufferView: 4, componentType: 5126, count: 3, type: 'VEC3' },
      ...(texCoord === 1
        ? [{ bufferView: 5, componentType: 5126, count: 3, type: 'VEC2' }]
        : []),
    ],
    meshes: [
      {
        weights: [0],
        primitives: [
          {
            attributes: {
              POSITION: 0,
              TEXCOORD_0: 1,
              NORMAL: 2,
              TANGENT: 3,
              ...(texCoord === 1 ? { TEXCOORD_1: 5 } : {}),
            },
            material: 0,
            targets: [{ TANGENT: 4 }],
          },
        ],
      },
    ],
  };
}

function foldedTangentModel(influences: 4 | 8) {
  const base = model({ normalTexture: { index: 0, texCoord: 1 } });
  const joints = new Uint16Array([
    1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const weights = new Float32Array([
    1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
  ]);
  if (influences === 8) for (let i = 0; i < 4; i++) weights[i * 4] = 0.5;
  const uv = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const streams = [
    {
      data: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
      componentType: 5126,
      type: 'VEC3',
      count: 4,
    },
    {
      data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      componentType: 5126,
      type: 'VEC3',
      count: 4,
    },
    { data: uv, componentType: 5126, type: 'VEC2', count: 4 },
    { data: uv, componentType: 5126, type: 'VEC2', count: 4 },
    { data: joints, componentType: 5123, type: 'VEC4', count: 4 },
    { data: weights, componentType: 5126, type: 'VEC4', count: 4 },
    {
      data: new Uint16Array([0, 1, 2, 0, 2, 3]),
      componentType: 5123,
      type: 'SCALAR',
      count: 6,
    },
    {
      data: new Float32Array([0.1, 0, 0, 0.2, 0, 0, 0.3, 0, 0, 0.4, 0, 0]),
      componentType: 5126,
      type: 'VEC3',
      count: 4,
    },
    {
      data: new Float32Array([0, 0.25, 0, 0, 0.25, 0, 0, 0.25, 0, 0, 0.25, 0]),
      componentType: 5126,
      type: 'VEC3',
      count: 4,
    },
  ];
  if (influences === 8)
    streams.push(
      {
        data: new Uint16Array([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
        componentType: 5123,
        type: 'VEC4',
        count: 4,
      },
      {
        data: new Float32Array([
          0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0,
        ]),
        componentType: 5126,
        type: 'VEC4',
        count: 4,
      },
    );
  return {
    ...base,
    buffers: streams.map(({ data }) => ({
      byteLength: data.byteLength,
      uri: embedded(new Uint8Array(data.buffer)),
    })),
    bufferViews: streams.map(({ data }, buffer) => ({
      buffer,
      byteOffset: 0,
      byteLength: data.byteLength,
    })),
    accessors: streams.map(({ componentType, type, count }, bufferView) => ({
      bufferView,
      componentType,
      type,
      count,
    })),
    meshes: [
      {
        weights: [0],
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1,
              TEXCOORD_0: 2,
              TEXCOORD_1: 3,
              JOINTS_0: 4,
              WEIGHTS_0: 5,
              ...(influences === 8 ? { JOINTS_1: 9, WEIGHTS_1: 10 } : {}),
            },
            indices: 6,
            material: 0,
            targets: [{ POSITION: 7, TANGENT: 8 }],
          },
        ],
      },
    ],
    nodes: [
      { mesh: 0, skin: 0, children: [1, 2] },
      {},
      { translation: [0.25, 0, 0] },
    ],
    skins: [{ joints: [1, 2] }],
  };
}

async function load(document: unknown) {
  installImages();
  const asset = await new GLTFLoader().parse(JSON.stringify(document));
  const mesh = [...[...asset.scene.children][0].children][0] as Mesh;
  return { asset, mesh, material: mesh.material as PBRMaterial };
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
    'KHR_materials_transmission',
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
    ['KHR_materials_transmission', { transmissionFactor: 1.1 }],
    ['KHR_materials_volume', { thicknessFactor: -1 }],
    ['KHR_materials_volume', { attenuationDistance: 0 }],
    ['KHR_materials_volume', { attenuationColor: [1, -1, 1] }],
  ])('rejects invalid %s factors %j', async (extension, factors) => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(
          model(
            {
              extensions: {
                ...(extension === 'KHR_materials_volume'
                  ? { KHR_materials_transmission: {} }
                  : {}),
                [extension as string]: factors,
              },
            },
            { extensionsRequired: [extension] },
          ),
        ),
      ),
    ).rejects.toMatchObject({ cause: expect.any(RangeError) });
  });

  it('rejects a volume without a transmitting material', async () => {
    installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify(model({ extensions: { KHR_materials_volume: {} } })),
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
  it.each([0, 1] as const)(
    'consumes authored tangent direction, handedness and UV%i morph deltas',
    async (texCoord) => {
      const { asset, mesh } = await load(tangentModel(5126, texCoord));
      try {
        expect(mesh.geometry.tangentTexCoord).toBe(texCoord);
        expect(mesh.geometry.tangents[0]).toBe(0);
        expect(mesh.geometry.tangents[1]).toBe(1);
        expect(mesh.geometry.tangents[3]).toBe(-1);
        mesh.morph!.weights.set(0, 1);
        mesh.updateDeformation();
        expect(mesh.geometry.tangents[0]).toBeCloseTo(-1);
        expect(mesh.geometry.tangents[1]).toBeCloseTo(0);
        expect(mesh.geometry.tangents[3]).toBe(-1);
      } finally {
        asset.dispose();
      }
    },
  );

  it.each([5120, 5122] as const)(
    'decodes signed normalized tangent component %i',
    async (component) => {
      const { asset, mesh } = await load(tangentModel(component));
      try {
        expect(mesh.geometry.tangents[1]).toBe(1);
        expect(mesh.geometry.tangents[3]).toBe(-1);
      } finally {
        asset.dispose();
      }
    },
  );

  it('generates missing glTF normal-map tangents with the reference sign convention', async () => {
    const { asset, mesh } = await load(model({ normalTexture: { index: 0 } }));
    try {
      expect(mesh.geometry.tangents[0]).toBeCloseTo(1);
      expect(mesh.geometry.tangents[3]).toBe(-1);
    } finally {
      asset.dispose();
    }
  });
  it.each([4, 8] as const)(
    'keeps morph and %i-influence skin aligned after mirrored UV1 seam splits',
    async (influences) => {
      const { asset } = await load(foldedTangentModel(influences));
      try {
        const mesh = [...[...asset.scene.children][0].children].find(
          (child) => child instanceof SkinnedMesh,
        );
        if (!(mesh instanceof SkinnedMesh))
          throw new Error('Expected a skinned primitive.');
        const before = mesh.renderGeometry.vertices.slice();
        const tangents = mesh.renderGeometry.tangents.slice();
        expect(mesh.renderGeometry.tangentTexCoord).toBe(1);
        expect(before.length / 8).toBe(6);
        mesh.morph!.weights.set(0, 1);
        mesh.updateSkin();
        for (let i = 0; i < 6; i++) {
          const x = before[i * 8],
            y = before[i * 8 + 1];
          const source = y === 0 ? (x === 0 ? 0 : 1) : x === 1 ? 2 : 3;
          const shift = influences === 8 ? 0.125 : source % 2 === 0 ? 0.25 : 0;
          expect(mesh.geometry.vertices[i * 8]).toBeCloseTo(
            x + (source + 1) * 0.1 + shift,
          );
          expect(mesh.geometry.vertices[i * 8 + 1]).toBe(y);
          expect(mesh.geometry.tangents[i * 4 + 1]).toBeCloseTo(
            0.25 / Math.hypot(1, 0.25),
          );
          expect(mesh.geometry.tangents[i * 4 + 3]).toBe(tangents[i * 4 + 3]);
        }
      } finally {
        asset.dispose();
      }
    },
  );
});
