import { afterEach, describe, expect, it, vi } from 'vitest';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { Texture } from '../packages/assets/src/index.js';
import { Matrix4 } from '../packages/math/src/index.js';
import { AnimationMixer } from '../packages/core/src/animation.js';
import { modelLimits } from '../src/data/models.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function bitmap() {
  return { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
}
function installImages() {
  const image = bitmap();
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
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(image));
  return image;
}
function embedded(bytes: Uint8Array): string {
  let text = '';
  for (const value of bytes) text += String.fromCharCode(value);
  return `data:application/octet-stream;base64,${btoa(text)}`;
}
function triangle() {
  const bytes = new Uint8Array(68),
    view = new DataView(bytes.buffer);
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      view.setFloat32(i * 16 + j * 4, positions[i * 3 + j], true);
  bytes.set([0, 0, 255, 0, 0, 255], 48);
  bytes[54] = 1;
  view.setFloat32(56, 2, true);
  return {
    asset: { version: '2.0' },
    buffers: [{ byteLength: bytes.length, uri: embedded(bytes) }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 48, byteStride: 16 },
      { buffer: 0, byteOffset: 48, byteLength: 6 },
      { buffer: 0, byteOffset: 54, byteLength: 1 },
      { buffer: 0, byteOffset: 56, byteLength: 12 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        sparse: {
          count: 1,
          indices: { bufferView: 2, componentType: 5121 },
          values: { bufferView: 3 },
        },
      },
      {
        bufferView: 1,
        componentType: 5121,
        normalized: true,
        count: 3,
        type: 'VEC2',
      },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 } }] }],
    nodes: [{ mesh: 0, translation: [3, 0, 0] }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
}
function glb(document: unknown, binary?: Uint8Array): ArrayBuffer {
  const text = new TextEncoder().encode(JSON.stringify(document)),
    jsonLength = Math.ceil(text.length / 4) * 4;
  const binLength = binary ? Math.ceil(binary.length / 4) * 4 : 0;
  const bytes = new Uint8Array(20 + jsonLength + (binary ? 8 + binLength : 0)),
    view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(32, 20, 20 + jsonLength);
  bytes.set(text, 20);
  if (binary) {
    view.setUint32(20 + jsonLength, binLength, true);
    view.setUint32(24 + jsonLength, 0x004e4942, true);
    bytes.set(binary, 28 + jsonLength);
  }
  return bytes.buffer;
}

describe('glTF decoding and owned assets', () => {
  it('decodes stride, normalized UVs and sparse overlays, generates normals, and releases textures once', async () => {
    const image = installImages();
    const asset = await new GLTFLoader().parse(JSON.stringify(triangle()));
    const node = [...asset.scene.children][0],
      mesh = [...node.children][0] as Mesh;
    expect(mesh.geometry.vertices[8]).toBe(2);
    expect(mesh.geometry.vertices[14]).toBe(1);
    expect(mesh.geometry.vertices[5]).toBe(1);
    expect(mesh.updateWorldMatrix().elements[12]).toBe(3);
    asset.dispose();
    asset.dispose();
    expect(asset.scene.destroyed).toBe(true);
    expect(image.close).toHaveBeenCalledOnce();
  });
  it('initializes omitted bufferViews with zeros and preserves separately owned primitive geometry', async () => {
    installImages();
    const asset = await new GLTFLoader().parse(
      JSON.stringify({
        asset: { version: '2.0' },
        accessors: [{ count: 3, type: 'VEC3', componentType: 5126 }],
        meshes: [
          {
            primitives: [
              { attributes: { POSITION: 0 } },
              { attributes: { POSITION: 0 } },
            ],
          },
        ],
        nodes: [{ mesh: 0 }],
      }),
    );
    const meshes = [...[...asset.scene.children][0].children] as Mesh[];
    expect([...meshes[0].geometry.vertices]).toEqual(new Array(24).fill(0));
    meshes[0].geometry.vertices[0] = 3;
    meshes[0].geometry.markUpdated();
    expect(meshes[1].geometry.vertices[0]).toBe(0);
    asset.dispose();
  });
  it('rejects sparse out-of-range indices, truncated accessors and unsupported required extensions', async () => {
    const sparse = triangle();
    const bytes = new Uint8Array(68);
    bytes[54] = 3;
    sparse.buffers[0].uri = embedded(bytes);
    await expect(
      new GLTFLoader().parse(JSON.stringify(sparse)),
    ).rejects.toThrow(/Sparse indices/);
    const truncated = triangle();
    truncated.bufferViews[0].byteLength = 32;
    await expect(
      new GLTFLoader().parse(JSON.stringify(truncated)),
    ).rejects.toThrow(/Accessor exceeds/);
    await expect(
      new GLTFLoader().parse(
        JSON.stringify({
          asset: { version: '2.0' },
          extensionsRequired: ['KHR_draco_mesh_compression'],
        }),
      ),
    ).rejects.toThrow(/Required glTF extensions/);
  });
  it('rejects cyclic hierarchies, excessive accessor counts and malformed GLB lengths before decoding images', async () => {
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);
    await expect(
      new GLTFLoader().parse(
        JSON.stringify({
          asset: { version: '2.0' },
          nodes: [{ children: [1] }, { children: [0] }],
        }),
      ),
    ).rejects.toThrow(/cycle/);
    await expect(
      new GLTFLoader().parse(
        JSON.stringify({
          asset: { version: '2.0' },
          accessors: [
            {
              count: modelLimits.accessorElements + 1,
              componentType: 5126,
              type: 'VEC3',
            },
          ],
        }),
      ),
    ).rejects.toThrow(/allowed range/);
    const malformed = glb({ asset: { version: '2.0' } });
    new DataView(malformed).setUint32(8, malformed.byteLength + 4, true);
    await expect(new GLTFLoader().parse(malformed)).rejects.toThrow(
      /GLB header/,
    );
    expect(decode).not.toHaveBeenCalled();
  });
  it('rejects oversized source text and pre-aborted loads without fetching or decoding', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      new GLTFLoader().parse(' '.repeat(modelLimits.inputBytes + 1)),
    ).rejects.toThrow(/input exceeds/);
    const controller = new AbortController();
    controller.abort();
    await expect(
      new GLTFLoader().load('https://example.test/model.gltf', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('resolves external buffers relative to the model URL and bounds streamed image bytes', async () => {
    installImages();
    const document = triangle(),
      payload = document.buffers[0].uri;
    document.buffers[0].uri = './geometry.bin';
    const binary = Uint8Array.from(
      atob(payload.slice(payload.indexOf(',') + 1)),
      (c) => c.charCodeAt(0),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (uri: string) => {
        if (uri === 'https://example.test/models/model.gltf')
          return new Response(JSON.stringify(document));
        if (uri === 'https://example.test/models/geometry.bin')
          return new Response(binary);
        throw new Error(`Unexpected URI: ${uri}`);
      }),
    );
    const asset = await new GLTFLoader().load(
      'https://example.test/models/model.gltf',
    );
    const mesh = [...[...asset.scene.children][0].children][0] as Mesh;
    expect(mesh.geometry.vertices[8]).toBe(2);
    asset.dispose();
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(new Uint8Array(8 * 1024 * 1024 + 1))),
    );
    await expect(
      new GLTFLoader().parse(
        JSON.stringify({
          asset: { version: '2.0' },
          images: [{ uri: 'large.png' }],
          textures: [{ source: 0 }],
          materials: [
            { pbrMetallicRoughness: { baseColorTexture: { index: 0 } } },
          ],
        }),
        'https://example.test/models/model.gltf',
      ),
    ).rejects.toThrow(/Unable to parse/);
    expect(decode).not.toHaveBeenCalled();
  });
  it('loads GLB binary data and chooses the declared scene instead of all roots', async () => {
    const bytes = new Uint8Array(
      new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer,
    );
    installImages();
    const asset = await new GLTFLoader().parse(
      glb(
        {
          asset: { version: '2.0' },
          buffers: [{ byteLength: bytes.length }],
          bufferViews: [{ buffer: 0, byteLength: bytes.length }],
          accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
          ],
          meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
          nodes: [{ mesh: 0 }, { mesh: 0, translation: [9, 0, 0] }],
          scenes: [{ nodes: [0] }, { nodes: [1] }],
          scene: 1,
        },
        bytes,
      ),
    );
    expect([...asset.scene.children].map((node) => node.position.x)).toEqual([
      9,
    ]);
    const mesh = [...[...asset.scene.children][0].children][0] as Mesh;
    expect([...mesh.geometry.vertices.slice(6, 8)]).toEqual([0, 0]);
    asset.dispose();
  });
  it('retains independent glTF wrapping and filtering per material map while sharing its decoded image', async () => {
    const image = installImages();
    const document = {
      ...triangle(),
      images: [{ uri: embedded(new Uint8Array([1])) }],
      textures: [
        { source: 0 },
        { source: 0, sampler: 0 },
        { source: 0, sampler: 1 },
      ],
      samplers: [
        { wrapS: 33071, wrapT: 33648, minFilter: 9728, magFilter: 9728 },
        { wrapS: 33648, wrapT: 33071, minFilter: 9729, magFilter: 9728 },
      ],
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorTexture: { index: 0 },
            metallicRoughnessTexture: { index: 1 },
          },
          normalTexture: { index: 2 },
          occlusionTexture: { index: 0 },
          emissiveTexture: { index: 1 },
        },
      ],
      meshes: [
        {
          primitives: [
            { attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 },
          ],
        },
      ],
    };
    const asset = await new GLTFLoader().parse(JSON.stringify(document));
    const material = ([...[...asset.scene.children][0].children][0] as Mesh)
      .material as PBRMaterial;
    expect(material.textureSampler).toEqual({
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      minFilter: 'linear',
      magFilter: 'linear',
    });
    expect(material.metallicRoughnessSampler).toEqual({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'mirror-repeat',
      minFilter: 'nearest',
      magFilter: 'nearest',
    });
    expect(material.normalSampler).toEqual({
      addressModeU: 'mirror-repeat',
      addressModeV: 'clamp-to-edge',
      minFilter: 'linear',
      magFilter: 'nearest',
    });
    expect(material.occlusionSampler).toEqual(material.textureSampler);
    expect(material.emissiveSampler).toEqual(material.metallicRoughnessSampler);
    expect(material.normalTexture).toBe(material.texture);
    expect(material.metallicRoughnessTexture).toBe(material.texture);
    expect(material.occlusionTexture).toBe(material.texture);
    expect(material.emissiveTexture).toBe(material.texture);
    asset.dispose();
    expect(image.close).toHaveBeenCalledOnce();
  });
  it('rejects mipmapped minification and invalid sampler enums or references before image decoding', async () => {
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);
    for (const sampler of [
      { minFilter: 9987 },
      { wrapS: 12345 },
      { magFilter: 9984 },
    ]) {
      await expect(
        new GLTFLoader().parse(
          JSON.stringify({
            asset: { version: '2.0' },
            images: [{ uri: embedded(new Uint8Array([1])) }],
            textures: [{ source: 0, sampler: 0 }],
            samplers: [sampler],
            materials: [
              { pbrMetallicRoughness: { baseColorTexture: { index: 0 } } },
            ],
          }),
        ),
      ).rejects.toThrow();
    }
    await expect(
      new GLTFLoader().parse(
        JSON.stringify({
          asset: { version: '2.0' },
          textures: [{ source: 0, sampler: 9 }],
          samplers: [],
          materials: [
            { pbrMetallicRoughness: { baseColorTexture: { index: 0 } } },
          ],
        }),
      ),
    ).rejects.toThrow(/reference is out of bounds/);
    expect(decode).not.toHaveBeenCalled();
  });
  it('closes decoded textures when a later node validation fails', async () => {
    const image = installImages();
    await expect(
      new GLTFLoader().parse(
        JSON.stringify({
          asset: { version: '2.0' },
          materials: [{}],
          nodes: [{ children: [0] }],
        }),
      ),
    ).rejects.toThrow(/cycle/);
    expect(image.close).toHaveBeenCalledOnce();
  });
  it('aborts during image decoding promptly and closes the late-owned bitmap', async () => {
    const image = bitmap(),
      controller = new AbortController();
    let resolve!: (image: ImageBitmap) => void, started!: () => void;
    const pending = new Promise<ImageBitmap>((done) => {
      resolve = done;
    });
    const decodeStarted = new Promise<void>((done) => {
      started = done;
    });
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => {
        started();
        return pending;
      }),
    );
    const operation = new GLTFLoader().parse(
      JSON.stringify({
        asset: { version: '2.0' },
        images: [{ uri: embedded(new Uint8Array([1])) }],
        textures: [{ source: 0 }],
        materials: [
          { pbrMetallicRoughness: { baseColorTexture: { index: 0 } } },
        ],
      }),
      undefined,
      { signal: controller.signal },
    );
    await decodeStarted;
    controller.abort();
    await expect(operation).rejects.toMatchObject({ name: 'AbortError' });
    resolve(image);
    await pending;
    await Promise.resolve();
    await Promise.resolve();
    expect(image.close).toHaveBeenCalledOnce();
  });
  it('decomposes reflected and zero-scale matrices without changing transformed positions', async () => {
    const asset = await new GLTFLoader().parse(
      JSON.stringify({
        asset: { version: '2.0' },
        nodes: [
          { matrix: [-2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 5, 6, 7, 1] },
          { matrix: [0, 0, 0, 0, 0, 0, 2, 0, 0, -3, 0, 0, 0, 0, 0, 1] },
        ],
      }),
    );
    const nodes = [...asset.scene.children];
    const reflected = nodes[0].updateWorldMatrix().elements;
    const expected = [-2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 5, 6, 7, 1];
    for (let i = 0; i < 16; i++) expect(reflected[i]).toBeCloseTo(expected[i]);
    const e = nodes[1].updateWorldMatrix().elements;
    expect(e[0]).toBe(0);
    expect(e[6]).toBeCloseTo(2);
    expect(e[9]).toBeCloseTo(-3);
    asset.dispose();
  });
});

describe('CPU linear blend skinning', () => {
  it('keeps source geometry untouched, transforms into mesh-local space and versions only changed skin poses', () => {
    const geometry = Geometry.plane(),
      joint = new Group();
    const material = new TextureMaterial({ texture: new Texture(bitmap()) });
    const count = geometry.vertices.length / 8,
      indices = new Uint32Array(count * 4),
      weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) weights[i * 4] = 1;
    const mesh = new SkinnedMesh({
      geometry,
      material,
      joints: [joint],
      inverseBindMatrices: [new Matrix4()],
      jointIndices: indices,
      weights,
    });
    mesh.position.x = 2;
    joint.position.x = 5;
    mesh.updateSkin();
    const version = mesh.geometry.version;
    expect(mesh.geometry.vertices[0]).toBeCloseTo(geometry.vertices[0] + 3);
    expect(geometry.vertices[0]).toBe(-0.5);
    mesh.updateSkin();
    expect(mesh.geometry.version).toBe(version);
    joint.position.x = 6;
    mesh.updateSkin();
    expect(mesh.geometry.version).toBe(version + 1);
    expect(mesh.geometry.vertices[0]).toBeCloseTo(geometry.vertices[0] + 4);
    material.texture.destroy();
  });
  it('binds loader-created skin joints and samples loaded LINEAR animation into deformed vertices', async () => {
    installImages();
    const bytes = new Uint8Array(104),
      view = new DataView(bytes.buffer);
    const position = [0, 0, 0, 1, 0, 0, 0, 1, 0];
    position.forEach((value, i) => view.setFloat32(i * 4, value, true));
    for (let i = 0; i < 3; i++) bytes[48 + i * 4] = 255;
    view.setFloat32(60, 0, true);
    view.setFloat32(64, 2, true);
    view.setFloat32(80, 4, true);
    const asset = await new GLTFLoader().parse(
      JSON.stringify({
        asset: { version: '2.0' },
        buffers: [{ byteLength: bytes.length, uri: embedded(bytes) }],
        bufferViews: [
          { buffer: 0, byteOffset: 0, byteLength: 36 },
          { buffer: 0, byteOffset: 36, byteLength: 12 },
          { buffer: 0, byteOffset: 48, byteLength: 12 },
          { buffer: 0, byteOffset: 60, byteLength: 8 },
          { buffer: 0, byteOffset: 68, byteLength: 24 },
        ],
        accessors: [
          { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
          { bufferView: 1, componentType: 5121, count: 3, type: 'VEC4' },
          {
            bufferView: 2,
            componentType: 5121,
            normalized: true,
            count: 3,
            type: 'VEC4',
          },
          { bufferView: 3, componentType: 5126, count: 2, type: 'SCALAR' },
          { bufferView: 4, componentType: 5126, count: 2, type: 'VEC3' },
        ],
        meshes: [
          {
            primitives: [
              { attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } },
            ],
          },
        ],
        nodes: [{ mesh: 0, skin: 0 }, {}],
        skins: [{ joints: [1] }],
        animations: [
          {
            samplers: [{ input: 3, output: 4 }],
            channels: [
              { sampler: 0, target: { node: 1, path: 'translation' } },
            ],
          },
        ],
      }),
    );
    const mesh = [...[...asset.scene.children][0].children][0] as SkinnedMesh;
    const mixer = new AnimationMixer();
    mixer.clipAction(asset.animations[0]).play();
    mixer.update(1);
    mesh.updateSkin();
    expect(mesh.geometry.vertices[0]).toBeCloseTo(2);
    expect(mesh.geometry.vertices[8]).toBeCloseTo(3);
    asset.dispose();
    mixer.destroy();
  });
});
