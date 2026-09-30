import { afterEach, describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import {
  AnimationMixer,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { MorphTargets, MorphWeights } from '../packages/core/src/morph.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';
import { Matrix4 } from '../packages/math/src/index.js';
import { modelLimits } from '../src/data/models.js';

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
    vi.fn().mockResolvedValue({ width: 1, height: 1, close: vi.fn() }),
  );
}

function embedded(bytes: Uint8Array): string {
  let text = '';
  for (const value of bytes) text += String.fromCharCode(value);
  return `data:application/octet-stream;base64,${btoa(text)}`;
}

function triangleGeometry(): Geometry {
  return new Geometry({
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
  });
}

function material(): TextureMaterial {
  return new TextureMaterial({
    texture: new Texture({
      width: 1,
      height: 1,
      close: vi.fn(),
    } as unknown as ImageBitmap),
  });
}

describe('MorphTargets on Mesh', () => {
  it('blends weighted deltas from the undeformed base and only versions changed weights', () => {
    const geometry = triangleGeometry();
    const weights = new MorphWeights([0, 0]);
    const mesh = new Mesh({
      geometry,
      material: material(),
      morph: new MorphTargets({
        positions: [
          [0, 0, 2, 0, 0, 2, 0, 0, 2],
          [1, 0, 0, 1, 0, 0, 1, 0, 0],
        ],
        weights,
      }),
    });
    mesh.updateDeformation();
    const first = geometry.version;
    expect(geometry.vertices[2]).toBe(0);
    mesh.updateDeformation();
    expect(geometry.version).toBe(first);

    weights.set(0, 0.5);
    weights.set(1, 2);
    mesh.updateDeformation();
    expect(geometry.version).toBe(first + 1);
    expect(geometry.vertices[0]).toBeCloseTo(2);
    expect(geometry.vertices[2]).toBeCloseTo(1);
    // Re-blending starts from the base, so decreasing a weight does not accumulate.
    weights.set(0, 0);
    weights.set(1, 0);
    mesh.updateDeformation();
    expect(geometry.vertices[0]).toBe(0);
    expect(geometry.vertices[2]).toBe(0);
    weights.set(0, 0);
    mesh.updateDeformation();
    expect(geometry.version).toBe(first + 2);
  });

  it('renormalizes morphed normals and falls back to the base when they cancel', () => {
    const geometry = triangleGeometry();
    const weights = new MorphWeights([0]);
    const mesh = new Mesh({
      geometry,
      material: material(),
      morph: new MorphTargets({
        positions: [undefined],
        normals: [[0, 3, -1, 0, 3, -1, 0, 3, -1]],
        weights,
      }),
    });
    weights.set(0, 1);
    mesh.updateDeformation();
    const [nx, ny, nz] = [3, 4, 5].map((i) => geometry.vertices[i]);
    expect(nx).toBeCloseTo(0);
    expect(ny).toBeCloseTo(1);
    expect(nz).toBeCloseTo(0);
    const cancel = new MorphWeights([1]);
    const flat = triangleGeometry();
    const cancelled = new Mesh({
      geometry: flat,
      material: material(),
      morph: new MorphTargets({
        positions: [undefined],
        normals: [[0, 0, -1, 0, 0, -1, 0, 0, -1]],
        weights: cancel,
      }),
    });
    cancelled.updateDeformation();
    expect(flat.vertices[5]).toBe(1);
  });

  it('rejects reuse, shared geometry, wrong delta lengths and non-finite values', () => {
    const geometry = triangleGeometry();
    const make = (weights = new MorphWeights([0])) =>
      new MorphTargets({ positions: [[0, 0, 0, 0, 0, 0, 0, 0, 0]], weights });
    const morph = make();
    new Mesh({ geometry, material: material(), morph });
    expect(
      () => new Mesh({ geometry, material: material(), morph: make() }),
    ).toThrow(/already deformed/);
    expect(
      () =>
        new Mesh({
          geometry: triangleGeometry(),
          material: material(),
          morph,
        }),
    ).toThrow(/already bound/);
    expect(
      () =>
        new Mesh({
          geometry: triangleGeometry(),
          material: material(),
          morph: new MorphTargets({
            positions: [[0, 0, 0]],
            weights: new MorphWeights([0]),
          }),
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new MorphTargets({
          positions: [[Number.NaN, 0, 0]],
          weights: new MorphWeights([0]),
        }),
    ).toThrow(RangeError);
    expect(
      () => new MorphTargets({ positions: [], weights: new MorphWeights([0]) }),
    ).toThrow(RangeError);
    const weights = new MorphWeights([0]);
    expect(() => weights.set(1, 0)).toThrow(RangeError);
    expect(() => weights.set(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => new MorphWeights([Number.NaN])).toThrow(RangeError);
  });

  it('morphs the bind pose before skinning', () => {
    const geometry = triangleGeometry();
    const joint = new Group();
    const weights = new MorphWeights([0]);
    const mesh = new SkinnedMesh({
      geometry,
      material: material(),
      joints: [joint],
      inverseBindMatrices: [new Matrix4()],
      jointIndices: new Uint32Array(12),
      weights: Float32Array.from({ length: 12 }, (_, i) =>
        i % 4 === 0 ? 1 : 0,
      ),
      morph: new MorphTargets({
        positions: [[0, 0, 1, 0, 0, 1, 0, 0, 1]],
        weights,
      }),
    });
    joint.position.x = 10;
    mesh.updateDeformation();
    expect(mesh.geometry.vertices[0]).toBeCloseTo(10);
    expect(mesh.geometry.vertices[2]).toBeCloseTo(0);
    const version = mesh.geometry.version;
    mesh.updateDeformation();
    expect(mesh.geometry.version).toBe(version);
    weights.set(0, 3);
    mesh.updateDeformation();
    expect(mesh.geometry.version).toBe(version + 1);
    expect(mesh.geometry.vertices[0]).toBeCloseTo(10);
    expect(mesh.geometry.vertices[2]).toBeCloseTo(3);
    // The caller's geometry stays undeformed.
    expect(geometry.vertices[2]).toBe(0);
  });
});

describe('weights KeyframeTrack', () => {
  it('interpolates every weight for LINEAR, STEP and CUBICSPLINE tracks', () => {
    const weights = new MorphWeights([0, 0]);
    const linear = new KeyframeTrack(weights, 'weights', [0, 2], [0, 1, 1, 3]);
    linear.sample(1);
    expect([weights.get(0), weights.get(1)]).toEqual([0.5, 2]);
    const step = new KeyframeTrack(
      weights,
      'weights',
      [0, 2],
      [0, 1, 1, 3],
      'STEP',
    );
    step.sample(1.9);
    expect([weights.get(0), weights.get(1)]).toEqual([0, 1]);
    // Zero tangents make the cubic Hermite midpoint the plain average.
    const cubic = new KeyframeTrack(
      weights,
      'weights',
      [0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 0, 0],
      'CUBICSPLINE',
    );
    cubic.sample(0.5);
    expect(weights.get(0)).toBeCloseTo(1);
    expect(weights.get(1)).toBeCloseTo(2);
  });

  it('rejects a mismatched target type or value count', () => {
    const weights = new MorphWeights([0, 0]);
    expect(
      () => new KeyframeTrack(weights, 'translation', [0], [0, 0, 0]),
    ).toThrow(TypeError);
    expect(
      () => new KeyframeTrack(new Group(), 'weights', [0], [0, 0]),
    ).toThrow(TypeError);
    expect(
      () => new KeyframeTrack(weights, 'weights', [0, 1], [0, 0, 0]),
    ).toThrow(RangeError);
  });
});

interface MorphDocument {
  buffers: Array<{ byteLength: number; uri: string }>;
  bufferViews: Array<Record<string, number>>;
  accessors: Array<Record<string, unknown>>;
  meshes: Array<{
    primitives: Array<{
      attributes: Record<string, number>;
      targets?: Array<Record<string, number>>;
    }>;
    weights?: number[];
  }>;
  nodes: Array<Record<string, unknown>>;
  skins?: unknown[];
  animations: Array<{
    samplers: unknown[];
    channels: Array<{
      sampler: number;
      target: { node: number; path: string };
    }>;
  }>;
  scenes: Array<{ nodes: number[] }>;
  [key: string]: unknown;
}

function morphDocument(mutate?: (document: MorphDocument) => void) {
  const bytes = new Uint8Array(88),
    view = new DataView(bytes.buffer);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((v, i) =>
    view.setFloat32(i * 4, v, true),
  );
  for (let i = 0; i < 3; i++) view.setFloat32(36 + i * 12 + 8, 2, true);
  view.setFloat32(72, 0, true);
  view.setFloat32(76, 2, true);
  view.setFloat32(84, 1, true);
  const document: MorphDocument = {
    asset: { version: '2.0' },
    buffers: [{ byteLength: bytes.length, uri: embedded(bytes) }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 36 },
      { buffer: 0, byteOffset: 72, byteLength: 8 },
      { buffer: 0, byteOffset: 80, byteLength: 8 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: 2, type: 'SCALAR' },
      { bufferView: 3, componentType: 5126, count: 2, type: 'SCALAR' },
    ],
    meshes: [
      {
        primitives: [
          { attributes: { POSITION: 0 }, targets: [{ POSITION: 1 }] },
        ],
        weights: [0.25],
      },
    ],
    nodes: [{ mesh: 0 }],
    animations: [
      {
        samplers: [{ input: 2, output: 3 }],
        channels: [{ sampler: 0, target: { node: 0, path: 'weights' } }],
      },
    ],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
  mutate?.(document);
  return JSON.stringify(document);
}

describe('glTF morph targets', () => {
  it('loads targets and default weights, and drives them with a weights animation', async () => {
    installImages();
    const asset = await new GLTFLoader().parse(morphDocument());
    const mesh = [...[...asset.scene.children][0].children][0] as Mesh;
    expect(mesh.morph?.targetCount).toBe(1);
    mesh.updateDeformation();
    expect(mesh.geometry.vertices[2]).toBeCloseTo(0.5);
    expect(mesh.geometry.vertices[10]).toBeCloseTo(0.5);
    expect(asset.animations[0].tracks[0].path).toBe('weights');

    const mixer = new AnimationMixer();
    mixer.clipAction(asset.animations[0]).play();
    mixer.update(1);
    mesh.updateDeformation();
    // Keys 0 -> 1 over 2 s: weight 0.5 at t=1, delta 2.
    expect(mesh.geometry.vertices[2]).toBeCloseTo(1);
    mixer.update(0.5);
    mesh.updateDeformation();
    expect(mesh.geometry.vertices[2]).toBeCloseTo(1.5);
    mixer.destroy();
    asset.dispose();
  });

  it('shares one weight set across all primitives of a node and lets node weights override the mesh', async () => {
    installImages();
    const asset = await new GLTFLoader().parse(
      morphDocument((document) => {
        const primitive = document.meshes[0].primitives[0];
        document.meshes[0].primitives.push(structuredClone(primitive));
        document.nodes[0].weights = [1];
        document.animations = [];
      }),
    );
    const meshes = [...[...asset.scene.children][0].children] as Mesh[];
    expect(meshes).toHaveLength(2);
    expect(meshes[0].morph?.weights).toBe(meshes[1].morph?.weights);
    meshes[0].morph!.weights.set(0, 0.5);
    for (const mesh of meshes) {
      mesh.updateDeformation();
      expect(mesh.geometry.vertices[2]).toBeCloseTo(1);
    }
    asset.dispose();
  });

  it('deforms skinned primitives with targets', async () => {
    installImages();
    const asset = await new GLTFLoader().parse(
      morphDocument((document) => {
        const bytes = Uint8Array.from(
          atob(document.buffers[0].uri.split(',')[1]),
          (c) => c.charCodeAt(0),
        );
        const extended = new Uint8Array(bytes.length + 24);
        extended.set(bytes);
        for (let i = 0; i < 3; i++) extended[bytes.length + i * 4] = 0;
        for (let i = 0; i < 3; i++) extended[bytes.length + 12 + i * 4] = 255;
        document.buffers[0] = {
          byteLength: extended.length,
          uri: embedded(extended),
        };
        document.bufferViews.push(
          { buffer: 0, byteOffset: 88, byteLength: 12 },
          { buffer: 0, byteOffset: 100, byteLength: 12 },
        );
        document.accessors.push(
          { bufferView: 4, componentType: 5121, count: 3, type: 'VEC4' },
          {
            bufferView: 5,
            componentType: 5121,
            normalized: true,
            count: 3,
            type: 'VEC4',
          },
        );
        document.meshes[0].primitives[0].attributes.JOINTS_0 = 4;
        document.meshes[0].primitives[0].attributes.WEIGHTS_0 = 5;
        document.nodes = [{ mesh: 0, skin: 0 }, {}];
        document.skins = [{ joints: [1] }];
        document.scenes = [{ nodes: [0, 1] }];
        document.animations = [];
      }),
    );
    const mesh = [...[...asset.scene.children][0].children][0] as SkinnedMesh;
    expect(mesh).toBeInstanceOf(SkinnedMesh);
    mesh.updateDeformation();
    expect(mesh.geometry.vertices[2]).toBeCloseTo(0.5);
    asset.dispose();
  });

  it('rejects inconsistent or unsupported morph data before building meshes', async () => {
    installImages();
    const cases: Array<[string, RegExp, (d: MorphDocument) => void]> = [
      [
        'primitives disagree on target count',
        /same number of morph targets/,
        (d) => {
          d.meshes[0].primitives.push({ attributes: { POSITION: 0 } });
        },
      ],
      [
        'weights length differs from target count',
        /match the target count/,
        (d) => {
          d.meshes[0].weights = [0, 0];
        },
      ],
      [
        'weights without targets',
        /require morph targets/,
        (d) => {
          delete d.meshes[0].primitives[0].targets;
        },
      ],
      [
        'unsupported target attribute',
        /other than POSITION, NORMAL and TANGENT/,
        (d) => {
          d.meshes[0].primitives[0].targets![0].TEXCOORD_0 = 1;
        },
      ],
      [
        'target accessor of the wrong shape',
        /requires matching VEC3 data/,
        (d) => {
          d.meshes[0].primitives[0].targets![0].POSITION = 2;
        },
      ],
      [
        'too many targets',
        /morph target budget/,
        (d) => {
          d.meshes[0].primitives[0].targets = Array.from(
            { length: modelLimits.morphTargets + 1 },
            () => ({ POSITION: 1 }),
          );
          delete d.meshes[0].weights;
        },
      ],
      [
        'weights animation on a node without morph targets',
        /counts or types do not match|requires morph targets/,
        (d) => {
          d.nodes.push({});
          d.animations[0].channels[0].target.node = 1;
        },
      ],
      [
        'weights animation output not sized keys x targets',
        /counts or types do not match/,
        (d) => {
          d.meshes[0].primitives[0].targets!.push({ POSITION: 1 });
          d.meshes[0].weights = [0, 0];
        },
      ],
    ];
    for (const [name, message, mutate] of cases)
      await expect(
        new GLTFLoader().parse(morphDocument(mutate)),
        name,
      ).rejects.toThrow(message);
  });
});
