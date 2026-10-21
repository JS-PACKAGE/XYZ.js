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
  proceduralRepeats,
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
  'concrete',
  'tiles',
  'leather',
  'sand',
  'rust',
  'snow',
  'asphalt',
  'gravel',
  'cobblestone',
  'bark',
  'moss',
  'mud',
  'granite',
  'slate',
  'terrazzo',
  'denim',
  'burlap',
  'carpet',
  'plaster',
  'terracotta',
  'cork',
  'rubber',
  'carbonfiber',
  'diamondplate',
  'paper',
  'wicker',
  'bamboo',
  'hammeredmetal',
  'galvanized',
  'corrugatedmetal',
  'sandstone',
  'travertine',
  'pumice',
  'parquet',
  'mosaic',
  'hexagontiles',
  'knit',
  'corduroy',
  'felt',
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
        metallic: 0,
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
        normals = new Set<number>(),
        metallic = new Set<number>();
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
        metallic.add(first.metallicRoughness[p + 2]);
        if (
          kind === 'metal' ||
          kind === 'diamondplate' ||
          kind === 'hammeredmetal' ||
          kind === 'galvanized' ||
          kind === 'corrugatedmetal'
        )
          expect(first.metallicRoughness[p + 2]).toBe(255);
        else if (kind !== 'rust')
          expect(first.metallicRoughness[p + 2]).toBe(0);
        expect(first.metallicRoughness[p + 3]).toBe(255);
        expect(first.occlusion[p]).toBeGreaterThan(0);
        expect(first.occlusion[p + 3]).toBe(255);
      }
      expect(reds.size).toBeGreaterThan(8);
      expect(roughness.size).toBeGreaterThan(3);
      expect(normals.size).toBeGreaterThan(3);
      if (kind === 'rust') {
        expect(Math.min(...metallic)).toBeLessThan(40);
        expect(Math.max(...metallic)).toBeGreaterThan(200);
        expect(metallic.size).toBeGreaterThan(8);
      }
    },
  );

  it.each([
    'asphalt',
    'gravel',
    'cobblestone',
    'bark',
    'moss',
    'mud',
    'granite',
    'slate',
    'terrazzo',
    'denim',
    'burlap',
    'carpet',
  ] as const)(
    '%s remains continuous across wrapped seams and textile cell boundaries',
    (kind) => {
      const sample = createSurfaceSampler(kind, 123);
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      const epsilon = 1e-7;
      const cells =
        kind === 'burlap' ? 10 : kind === 'denim' || kind === 'carpet' ? 24 : 1;
      for (let edge = 0; edge < cells; edge++) {
        const boundary = edge / cells;
        for (let i = 0; i < 24; i++) {
          const along = i / 24;
          for (const axis of [0, 1]) {
            sample(
              axis === 0 ? boundary - epsilon : along,
              axis === 1 ? boundary - epsilon : along,
              a,
            );
            sample(
              axis === 0 ? boundary + epsilon : along,
              axis === 1 ? boundary + epsilon : along,
              b,
            );
            for (const key of Object.keys(a) as (keyof SurfaceSample)[])
              expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
          }
        }
      }
    },
  );

  it.each([
    ['plaster', [3, 5, 18, 32, 64]],
    ['terracotta', [5, 9, 12, 28, 32, 64]],
    ['cork', [14, 32, 64]],
    ['rubber', [32, 44, 64]],
    ['carbonfiber', [12, 24, 32, 48]],
    ['diamondplate', [4, 8, 32, 64]],
    ['paper', [3, 5, 24, 32, 48]],
    ['wicker', [3, 4, 6, 12, 32, 72]],
    ['bamboo', [3, 4, 32, 48, 64]],
    ['hammeredmetal', [4, 12, 32]],
    ['galvanized', [10, 32]],
    ['corrugatedmetal', [4, 8, 32, 48, 64]],
    ['sandstone', [3, 5, 8, 19, 32, 64]],
    ['travertine', [3, 6, 12, 18, 32, 64]],
    ['pumice', [5, 26, 32, 64]],
    ['parquet', [4, 8, 12, 32]],
    ['mosaic', [16, 32]],
    ['hexagontiles', [5, 6, 10, 12, 32]],
    ['knit', [8, 16, 32, 48]],
    ['corduroy', [12, 24, 32, 48, 96]],
    ['felt', [20, 32, 40]],
  ] as const)(
    '%s keeps bounded fields continuous at external and internal boundaries',
    (kind, lattices) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      const epsilon = 1e-7;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const cells of lattices)
          for (let edge = 0; edge <= cells; edge++)
            for (const along of [0, 0.137, 0.43, 0.791, 1])
              for (const axis of [0, 1]) {
                const boundary = edge / cells;
                sample(
                  axis === 0 ? boundary - epsilon : along,
                  axis === 1 ? boundary - epsilon : along,
                  a,
                );
                sample(
                  axis === 0 ? boundary + epsilon : along,
                  axis === 1 ? boundary + epsilon : along,
                  b,
                );
                for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                  expect(Number.isFinite(a[key])).toBe(true);
                  expect(a[key]).toBeGreaterThanOrEqual(0);
                  expect(a[key]).toBeLessThanOrEqual(1);
                  expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                }
                expect(a.metallic).toBe(
                  kind === 'diamondplate' ||
                    kind === 'hammeredmetal' ||
                    kind === 'galvanized' ||
                    kind === 'corrugatedmetal'
                    ? 1
                    : 0,
                );
                if (kind !== 'mosaic' && kind !== 'hexagontiles')
                  expect(a.mortar).toBe(0);
              }
      }
    },
  );

  it('hexagonal cells meet continuously along all six shared edges, including wrapped diagonals', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    const root3 = Math.sqrt(3);
    const epsilon = 1e-7;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('hexagontiles', seed);
      for (const row of [0, 1, 5, 6])
        for (const column of [0, 2, 5]) {
          const cx = column + (row % 2) * 0.5,
            cy = (row * root3) / 2;
          sample(cx / 5, cy / (3 * root3), a);
          expect(a.mortar).toBe(0);
          expect(a.height).toBeGreaterThan(0);
          for (let side = 0; side < 6; side++) {
            const nx = Math.cos((side * Math.PI) / 3),
              ny = Math.sin((side * Math.PI) / 3);
            for (const along of [-0.2, 0, 0.2]) {
              const x = cx + 0.5 * nx - along * ny,
                y = cy + 0.5 * ny + along * nx;
              sample(
                (x - epsilon * nx) / 5,
                (y - epsilon * ny) / (3 * root3),
                a,
              );
              sample(
                (x + epsilon * nx) / 5,
                (y + epsilon * ny) / (3 * root3),
                b,
              );
              for (const key of Object.keys(a) as (keyof SurfaceSample)[])
                expect(a[key]).toBeCloseTo(b[key], 9);
              expect(a.mortar).toBe(1);
              expect(a.height).toBe(0);
              // Both sides have a flat bottom, so height derivatives cannot
              // pick up a tile-owned normal discontinuity at a shared edge.
              sample((x - 0.001 * nx) / 5, (y - 0.001 * ny) / (3 * root3), a);
              sample((x + 0.001 * nx) / 5, (y + 0.001 * ny) / (3 * root3), b);
              expect(a.height).toBe(0);
              expect(b.height).toBe(0);
              sample((x - 0.08 * nx) / 5, (y - 0.08 * ny) / (3 * root3), a);
              expect(a.mortar).toBe(0);
              expect(a.height).toBeGreaterThan(0);
            }
          }
        }
    }
  });

  it('parquet alternates three-slat baskets with common recessed dark joints', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const sample = createSurfaceSampler('parquet', 123);
    for (let slat = 0; slat < 3; slat++) {
      for (const [u, v] of [
        [0.125, slat / 12],
        [(1 + slat / 3) / 4, 0.125],
      ]) {
        sample(u, v, a);
        expect(a.height).toBe(0);
      }
      for (const [u, v] of [
        [0.125, (slat + 0.5) / 12],
        [(1 + (slat + 0.5) / 3) / 4, 0.125],
      ]) {
        sample(u, v, a);
        expect(a.height).toBeGreaterThan(0);
      }
    }
  });

  it('knit raises both arms of repeating V stitches above recessed loop gaps', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('knit', seed);
      for (const column of [0, 3, 7])
        for (const row of [0, 4, 7]) {
          sample((column + 0.5) / 8, (row + 0.4) / 8, gap);
          for (const side of [-1, 1]) {
            sample((column + 0.5 + side * 0.22) / 8, (row + 0.4) / 8, a);
            expect(a.height).toBeGreaterThan(gap.height);
            expect(a.occlusion).toBeGreaterThan(gap.occlusion);
          }
          sample((column + 0.5) / 8, (row + 0.84) / 8, a);
          expect(a.height).toBeGreaterThan(gap.height);
        }
    }
  });

  it('knit yarn remains continuous across rounded ends, joins and finite support', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    const epsilon = 1e-7;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('knit', seed);
      for (const side of [-1, 1]) {
        const sx = side * 0.34,
          sy = -0.68;
        const length = Math.hypot(sx, sy);
        for (const t of [-0.13 / length, 0, 0.5, 1, 1 + 0.13 / length])
          for (const offset of [-0.13, 0, 0.13]) {
            const u = (0.5 + t * sx - (offset * sy) / length) / 8,
              v = (0.84 + t * sy + (offset * sx) / length) / 8;
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
            ]) {
              sample(u - du, v - dv, a);
              sample(u + du, v + dv, b);
              for (const key of Object.keys(a) as (keyof SurfaceSample)[])
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
              const leftHeight = a.height,
                rightHeight = b.height;
              sample(u, v, a);
              expect(
                Math.abs(rightHeight - a.height - (a.height - leftHeight)) /
                  epsilon,
              ).toBeLessThan(0.001);
            }
          }
      }
    }
  });

  it('corduroy has parallel raised wales with recessed narrow valleys along their length', () => {
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const valley = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('corduroy', seed);
      for (let wale = 0; wale < 12; wale++)
        for (const v of [0, 0.137, 0.43, 0.791]) {
          sample(wale / 12, v, crest);
          sample((wale + 0.5) / 12, v, valley);
          expect(crest.height).toBeGreaterThan(valley.height);
          expect(crest.occlusion).toBeGreaterThan(valley.occlusion);
          sample((wale + 0.3) / 12, v, crest);
          expect(crest.height).toBeGreaterThan(valley.height);
        }
    }
  });

  it('every preset produces a different base color', () => {
    const signatures = kinds.map((kind) =>
      Array.from(generateProceduralMaps(kind, 32, 1).baseColor).join(','),
    );
    expect(new Set(signatures).size).toBe(kinds.length);
  });

  it('keeps default contrast and applies art controls only when requested', () => {
    const plain = generateProceduralMaps('wood', 32, 1);
    expect(generateProceduralMaps('wood', 32, 1, { contrast: 1 })).toEqual(
      plain,
    );
    expect(
      generateProceduralMaps('wood', 32, 1, { contrast: 1.8 }).baseColor,
    ).not.toEqual(plain.baseColor);
    expect(
      generateProceduralMaps('wood', 32, 1, { roughnessBias: 0.2 })
        .metallicRoughness,
    ).not.toEqual(plain.metallicRoughness);
    expect(proceduralRepeats('brick', 1.2)).toBeCloseTo(5);
    expect(() => proceduralRepeats('brick', 0)).toThrow(RangeError);
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

  it('keeps new dielectrics unmetallic and lets rust use its metallic map', async () => {
    const concrete = await ProceduralMaterial.create('concrete', { size: 32 });
    const rust = await ProceduralMaterial.create('rust', { size: 32 });
    expect(concrete.material.metallic).toBe(0);
    expect(rust.material.metallic).toBe(1);
    expect(concrete.material.metallicRoughnessTexture).toBe(
      concrete.textures.metallicRoughness,
    );
    concrete.destroy();
    rust.destroy();
    expect(concrete.destroyed).toBe(true);
    expect(rust.textures.baseColor.destroyed).toBe(true);
  });
});
