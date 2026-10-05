import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import {
  ProceduralMaterial,
  type ProceduralMaterialKind,
} from '../packages/core/src/procedural-material.js';
import {
  createSurfaceSampler,
  generateProceduralMaps,
  writeNormals,
  type SurfaceSample,
} from '../packages/core/src/procedural-material-maps.js';
import { Mesh } from '../packages/core/src/mesh.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';

const kinds: ProceduralMaterialKind[] = [
  'wood',
  'brick',
  'stone',
  'metal',
  'fabric',
  'marble',
];

class TestImageData {
  readonly data: Uint8ClampedArray;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

const decoded: {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  close: Mock;
}[] = [];
let failAt = -1;
let oversizedAt = -1;

beforeEach(() => {
  decoded.length = 0;
  failAt = oversizedAt = -1;
  vi.stubGlobal('ImageData', TestImageData);
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async (image: TestImageData) => {
      if (decoded.length === failAt) throw new Error('late decode failure');
      const bitmap = {
        width: decoded.length === oversizedAt ? 100000 : image.width,
        height: image.height,
        pixels: image.data.slice(),
        close: vi.fn(),
      };
      decoded.push(bitmap);
      return bitmap;
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('periodic procedural material fields', () => {
  it.each(kinds)(
    '%s is deterministic, seeded, distinct and periodic in both axes',
    (kind) => {
      const first = generateProceduralMaps(kind, 32, 123);
      expect(generateProceduralMaps(kind, 32, 123)).toEqual(first);
      expect(generateProceduralMaps(kind, 32, 124).baseColor).not.toEqual(
        first.baseColor,
      );
      const sample = createSurfaceSampler(kind, 123);
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
      };
      const b = { ...a };
      for (const [u, v] of [
        [0, 0],
        [0.123, 0.456],
        [-0.00001, 0.31],
        [0.6, 0.99999],
      ]) {
        sample(u, v, a);
        for (const [du, dv] of [
          [1, 0],
          [0, 1],
          [-1, 2],
        ]) {
          sample(u + du, v + dv, b);
          for (const key of Object.keys(a) as (keyof SurfaceSample)[])
            expect(b[key]).toBeCloseTo(a[key], 9);
        }
      }
      const reds = new Set<number>(),
        roughness = new Set<number>(),
        normals = new Set<number>();
      for (let p = 0; p < first.baseColor.length; p += 4) {
        reds.add(first.baseColor[p]);
        roughness.add(first.metallicRoughness[p + 1]);
        normals.add(
          first.normal[p] * 65536 +
            first.normal[p + 1] * 256 +
            first.normal[p + 2],
        );
        expect(first.baseColor[p + 3]).toBe(255);
        expect(first.normal[p + 3]).toBe(255);
        expect(first.normal[p + 2]).toBeGreaterThanOrEqual(128);
        const nx = (first.normal[p] / 255) * 2 - 1;
        const ny = (first.normal[p + 1] / 255) * 2 - 1;
        const nz = (first.normal[p + 2] / 255) * 2 - 1;
        expect(Math.abs(Math.hypot(nx, ny, nz) - 1)).toBeLessThan(0.008);
        expect(first.metallicRoughness[p]).toBe(255);
        expect(first.metallicRoughness[p + 2]).toBe(kind === 'metal' ? 255 : 0);
        expect(first.metallicRoughness[p + 3]).toBe(255);
        expect(first.occlusion[p]).toBeGreaterThan(0);
        expect(first.occlusion[p + 3]).toBe(255);
      }
      expect(reds.size).toBeGreaterThan(8);
      expect(roughness.size).toBeGreaterThan(3);
      expect(normals.size).toBeGreaterThan(3);
    },
  );

  it('six presets produce different base colors', () => {
    const signatures = kinds.map((kind) =>
      Array.from(generateProceduralMaps(kind, 32, 1).baseColor).join(','),
    );
    expect(new Set(signatures).size).toBe(6);
  });

  it('wraps normal neighbors and uses negative slopes along both image UV axes', () => {
    const size = 32,
      heights = new Float32Array(size * size),
      normals = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        heights[y * size + x] =
          0.02 *
          (Math.sin((x * Math.PI * 2) / size) +
            Math.sin((y * Math.PI * 2) / size));
    writeNormals(heights, size, normals);
    for (const [x, y] of [
      [0, 0],
      [31, 31],
      [8, 16],
      [16, 8],
    ]) {
      const slope = 0.02 * size * Math.sin((2 * Math.PI) / size);
      const dx = slope * Math.cos((x * 2 * Math.PI) / size);
      const dy = slope * Math.cos((y * 2 * Math.PI) / size);
      const length = Math.hypot(dx, dy, 1),
        p = (y * size + x) * 4;
      expect(normals[p]).toBe(Math.round((0.5 - dx / length / 2) * 255));
      expect(normals[p + 1]).toBe(Math.round((0.5 - dy / length / 2) * 255));
    }
    expect(normals[0]).toBeLessThan(128);
    expect(normals[1]).toBeLessThan(128);
  });
});

describe('procedural preset acquisition and ownership', () => {
  it('rejects invalid kinds and dimensions/seeds before bitmap acquisition', async () => {
    await expect(
      ProceduralMaterial.create('glass' as ProceduralMaterialKind),
    ).rejects.toThrow(RangeError);
    for (const size of [
      0,
      31,
      1025,
      32.5,
      Infinity,
      NaN,
      Number.MAX_SAFE_INTEGER,
    ])
      await expect(ProceduralMaterial.create('wood', { size })).rejects.toThrow(
        RangeError,
      );
    for (const seed of [-1, 0x100000000, 0.5, Infinity, NaN])
      await expect(ProceduralMaterial.create('wood', { seed })).rejects.toThrow(
        RangeError,
      );
    await expect(
      ProceduralMaterial.create('wood', null as never),
    ).rejects.toThrow(TypeError);
    expect(decoded).toHaveLength(0);
  });

  it('closes every already acquired bitmap when a late decode fails', async () => {
    failAt = 3;
    await expect(
      ProceduralMaterial.create('brick', { size: 32 }),
    ).rejects.toThrow('Unable to decode');
    expect(decoded).toHaveLength(3);
    for (const bitmap of decoded) expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it('also closes the late bitmap rejected by Texture resource limits', async () => {
    oversizedAt = 2;
    await expect(
      ProceduralMaterial.create('stone', { size: 32 }),
    ).rejects.toThrow('resource budget');
    expect(decoded).toHaveLength(3);
    for (const bitmap of decoded) expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it('releases initial maps if initial material construction fails', async () => {
    vi.spyOn(ProceduralMaterial.prototype, 'createMaterial').mockImplementation(
      function (this: ProceduralMaterial) {
        return new PBRMaterial({
          texture: this.textures.baseColor,
          roughness: -1,
        });
      },
    );
    await expect(
      ProceduralMaterial.create('wood', { size: 32 }),
    ).rejects.toThrow();
    expect(decoded).toHaveLength(4);
    for (const bitmap of decoded) expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it('borrows maps across independent materials and never takes ownership of overrides', async () => {
    const preset = await ProceduralMaterial.create('metal', { size: 32 });
    const external = new Texture({
      width: 1,
      height: 1,
      close: vi.fn(),
    } as unknown as ImageBitmap);
    const material = preset.createMaterial({
      texture: external,
      roughness: 0.4,
      metallic: 0.8,
    });
    expect(material).not.toBe(preset.material);
    expect(material.texture).toBe(external);
    expect(material.normalTexture).toBe(preset.textures.normal);
    expect(material.roughness).toBe(0.4);
    expect(preset.material.roughness).toBe(1);
    const mesh = new Mesh({ geometry: Geometry.cube(), material });
    mesh.destroy();
    expect(preset.destroyed).toBe(false);
    expect(preset.textures.normal.destroyed).toBe(false);
    expect(() => preset.createMaterial({ roughness: -1 })).toThrow(RangeError);
    expect(
      decoded.every((bitmap) => bitmap.close.mock.calls.length === 0),
    ).toBe(true);
    preset.destroy();
    preset.destroy();
    expect(preset.destroyed).toBe(true);
    expect(
      Object.values(preset.textures).every((texture) => texture.destroyed),
    ).toBe(true);
    for (const bitmap of decoded) expect(bitmap.close).toHaveBeenCalledTimes(1);
    expect(external.destroyed).toBe(false);
    expect(() => preset.createMaterial()).toThrow('destroyed');
    external.destroy();
  });
});
