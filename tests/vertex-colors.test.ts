import { afterEach, describe, expect, it, vi } from 'vitest';
import { Geometry } from '../packages/core/src/geometry.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { InstancedMesh } from '../packages/core/src/instanced-mesh.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { Texture } from '../packages/assets/src/index.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const material = () =>
  new TextureMaterial({ texture: Object.create(Texture.prototype) as Texture });

describe('Geometry vertex colors', () => {
  const triangle = (colors?: ArrayLike<number>) =>
    new Geometry({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0, 1],
      indices: [0, 1, 2],
      colors,
    });

  it('copies colors from the constructor and starts with an unchanged version', () => {
    const source = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const geometry = triangle(source);
    source[0] = 9;
    expect(Array.from(geometry.colors!)).toEqual([
      1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1,
    ]);
    expect(geometry.version).toBe(0);
    expect(triangle().colors).toBeUndefined();
  });

  it('replaces and removes colors, bumping the version only on real changes', () => {
    const geometry = triangle();
    geometry.setColors([0.5, 0.5, 0.5, 1, 1, 1, 2, 2, 2]);
    expect(geometry.version).toBe(1);
    expect(geometry.colors![8]).toBe(2);
    geometry.setColors(undefined);
    expect(geometry.version).toBe(2);
    geometry.setColors(undefined);
    expect(geometry.version).toBe(2);
  });
  it('retains vertex alpha and rejects alpha outside its unit interval atomically', () => {
    const rgba = [1, 0, 0, 0, 0, 1, 0, 0.5, 0, 0, 1, 1];
    const geometry = triangle(rgba);
    expect(Array.from(geometry.colors!)).toEqual(rgba);
    rgba[3] = 2;
    expect(() => geometry.setColors(rgba)).toThrow(RangeError);
    expect(geometry.colors![3]).toBe(0);
  });

  it('rejects wrong lengths, negative, non-finite and Float32-overflowing values atomically', () => {
    const geometry = triangle([1, 1, 1, 1, 1, 1, 1, 1, 1]);
    const before = Array.from(geometry.colors!);
    for (const bad of [
      [1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, -0.1],
      [1, 1, 1, 1, 1, 1, 1, 1, Number.NaN],
      [1, 1, 1, 1, 1, 1, 1, 1, 1e40],
    ])
      expect(() => geometry.setColors(bad)).toThrow(RangeError);
    expect(Array.from(geometry.colors!)).toEqual(before);
    expect(() => triangle([1, 1, 1])).toThrow(RangeError);
  });
});

describe('InstancedMesh colors', () => {
  it('stays white until a color is set, then tracks per-instance values and versions', () => {
    const mesh = new InstancedMesh({
      geometry: Geometry.cube(),
      material: material(),
      count: 3,
    });
    expect(mesh.colors).toBeUndefined();
    expect(mesh.getColorAt(1, [0, 0, 0])).toEqual([1, 1, 1]);
    mesh.setColorAt(1, 0.2, 0.4, 3);
    expect(mesh.colorVersion).toBe(1);
    expect(Array.from(mesh.colors!)).toEqual([
      1,
      1,
      1,
      Math.fround(0.2),
      Math.fround(0.4),
      3,
      1,
      1,
      1,
    ]);
    expect(mesh.getColorAt(1, [0, 0, 0])).toEqual([
      Math.fround(0.2),
      Math.fround(0.4),
      3,
    ]);
    expect(mesh.version).toBe(0);
  });

  it('validates the index and components', () => {
    const mesh = new InstancedMesh({
      geometry: Geometry.cube(),
      material: material(),
      count: 2,
    });
    expect(() => mesh.setColorAt(2, 1, 1, 1)).toThrow(RangeError);
    expect(() => mesh.setColorAt(-1, 1, 1, 1)).toThrow(RangeError);
    expect(() => mesh.setColorAt(0, -1, 1, 1)).toThrow(RangeError);
    expect(() => mesh.setColorAt(0, 1, Number.NaN, 1)).toThrow(RangeError);
    expect(mesh.colors).toBeUndefined();
    expect(mesh.colorVersion).toBe(0);
  });
});

describe('glTF COLOR_0', () => {
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
  const uri = (bytes: Uint8Array) =>
    `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}`;

  function model(
    color: Record<string, unknown>,
    colorBytes: Uint8Array,
    extraAttributes: Record<string, number> = {},
  ) {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const bytes = new Uint8Array(36 + colorBytes.length);
    bytes.set(new Uint8Array(positions.buffer));
    bytes.set(colorBytes, 36);
    return {
      asset: { version: '2.0' },
      buffers: [{ byteLength: bytes.length, uri: uri(bytes) }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: colorBytes.length },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, count: 3, ...color },
      ],
      meshes: [
        {
          primitives: [
            { attributes: { POSITION: 0, COLOR_0: 1, ...extraAttributes } },
          ],
        },
      ],
      nodes: [{ mesh: 0 }],
      scenes: [{ nodes: [0] }],
      scene: 0,
    };
  }
  async function load(document: unknown) {
    installImages();
    const asset = await new GLTFLoader().parse(JSON.stringify(document));
    return [...[...asset.scene.children][0]!.children][0] as Mesh;
  }

  it('reads float VEC3 colors and normalized unsigned-byte VEC4 colors with alpha', async () => {
    const floats = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 0.5]);
    const a = await load(
      model(
        { componentType: 5126, type: 'VEC3' },
        new Uint8Array(floats.buffer),
      ),
    );
    expect(Array.from(a.geometry.colors!)).toEqual([
      1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0.5, 1,
    ]);
    const bytes = new Uint8Array([
      255, 0, 0, 128, 0, 255, 0, 255, 0, 0, 255, 0,
    ]);
    const b = await load(
      model({ componentType: 5121, type: 'VEC4', normalized: true }, bytes),
    );
    expect(Array.from(b.geometry.colors!)).toEqual([
      1,
      0,
      0,
      Math.fround(128 / 255),
      0,
      1,
      0,
      1,
      0,
      0,
      1,
      0,
    ]);
  });

  it('rejects COLOR_1, unnormalized integers, wrong types and negative floats', async () => {
    const floats = new Uint8Array(new Float32Array(9).buffer);
    await expect(
      load(
        model({ componentType: 5126, type: 'VEC3' }, floats, { COLOR_1: 1 }),
      ),
    ).rejects.toThrow();
    await expect(
      load(model({ componentType: 5121, type: 'VEC4' }, new Uint8Array(12))),
    ).rejects.toThrow();
    await expect(
      load(model({ componentType: 5126, type: 'VEC2' }, new Uint8Array(24))),
    ).rejects.toThrow();
    const negative = new Float32Array([-1, 0, 0, 0, 1, 0, 0, 0, 1]);
    await expect(
      load(
        model(
          { componentType: 5126, type: 'VEC3' },
          new Uint8Array(negative.buffer),
        ),
      ),
    ).rejects.toThrow();
  });
});
