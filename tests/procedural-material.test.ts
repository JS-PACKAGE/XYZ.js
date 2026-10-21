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
  'roofshingles',
  'rooftiles',
  'stucco',
  'lichen',
  'leaflitter',
  'endgrain',
  'acousticfoam',
  'closedcellfoam',
  'linoleum',
  'suede',
  'snakeskin',
  'crocodile',
  'herringbone',
  'tweed',
  'seersucker',
  'knurledmetal',
  'engineturned',
  'goldleaf',
  'orangepeel',
  'coconut',
  'watermelon',
  'limestone',
  'breccia',
  'gneiss',
  'plywood',
  'osb',
  'chipboard',
  'wafflecloth',
  'cableknit',
  'quilting',
  'crackleglaze',
  'flutedceramic',
  'encaustictiles',
  'fishscales',
  'tortoiseshell',
  'feathers',
  'reedmat',
  'rope',
  'straw',
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
          kind === 'corrugatedmetal' ||
          kind === 'knurledmetal' ||
          kind === 'engineturned' ||
          kind === 'goldleaf'
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
    ['roofshingles', [4, 6, 8, 32, 64]],
    ['rooftiles', [5, 6, 12, 24, 32]],
    ['stucco', [5, 7, 28, 32]],
    ['lichen', [7, 32, 96]],
    ['leaflitter', [6, 32]],
    ['endgrain', [5, 32, 96]],
    ['acousticfoam', [4, 32, 96]],
    ['closedcellfoam', [28, 32]],
    ['linoleum', [4, 5, 8, 32, 48]],
    ['suede', [5, 7, 24, 32, 80, 96]],
    ['snakeskin', [10, 12, 20, 24, 32]],
    ['crocodile', [4, 6, 9, 11, 32]],
    ['herringbone', [2, 4, 8, 16, 32, 128]],
    ['tweed', [4, 20, 24, 32, 80]],
    ['seersucker', [4, 8, 12, 24, 32, 48, 144]],
    ['knurledmetal', [24, 32, 48]],
    ['engineturned', [6, 12, 24, 32]],
    ['goldleaf', [3, 4, 5, 18, 21, 32]],
    ['orangepeel', [24, 32]],
    ['coconut', [8, 32, 40]],
    ['watermelon', [4, 5, 8, 12, 32, 80, 96]],
    ['limestone', [24, 32, 96]],
    ['breccia', [6, 32, 80]],
    ['gneiss', [4, 32, 96]],
    ['plywood', [3, 4, 32]],
    ['osb', [6, 32]],
    ['chipboard', [28, 32]],
    ['wafflecloth', [8, 24, 32, 96]],
    ['cableknit', [4, 32, 48, 64, 96]],
    ['quilting', [6, 12, 24, 32, 48, 96]],
    ['crackleglaze', [4, 16, 32]],
    ['flutedceramic', [8, 32, 96]],
    ['encaustictiles', [4, 32]],
    ['fishscales', [10, 20, 32]],
    ['tortoiseshell', [6, 19, 23, 32]],
    ['feathers', [4, 8, 16, 32]],
    ['reedmat', [4, 16, 32, 96]],
    ['rope', [6, 18, 32, 54]],
    ['straw', [8, 32]],
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
                    kind === 'corrugatedmetal' ||
                    kind === 'knurledmetal' ||
                    kind === 'engineturned' ||
                    kind === 'goldleaf'
                    ? 1
                    : 0,
                );
                if (
                  kind !== 'mosaic' &&
                  kind !== 'hexagontiles' &&
                  kind !== 'encaustictiles'
                )
                  expect(a.mortar).toBe(0);
              }
      }
    },
  );

  it.each([
    ['lichen', 7],
    ['leaflitter', 6],
    ['acousticfoam', 4],
    ['closedcellfoam', 28],
    ['linoleum', 1],
    ['suede', 96],
    ['snakeskin', 10],
    ['snakeskin', 12],
    ['crocodile', 4],
    ['crocodile', 6],
    ['knurledmetal', 48],
    ['engineturned', 12],
    ['goldleaf', 20],
    ['orangepeel', 24],
    ['coconut', 8],
    ['coconut', 40],
    ['watermelon', 96],
    ['gneiss', 4],
    ['gneiss', 96],
    ['plywood', 4],
    ['crackleglaze', 16],
    ['flutedceramic', 96],
    ['encaustictiles', 4],
  ] as const)(
    '%s keeps continuous slopes across wrapped and owned cell boundaries',
    (kind, cells) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      const epsilon = 1e-7 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let edge = 0; edge <= cells; edge++)
          for (let i = 0; i < 37; i++)
            for (const axis of [0, 1]) {
              const u = axis === 0 ? edge / cells : (i + 0.37) / 37,
                v = axis === 1 ? edge / cells : (i + 0.37) / 37;
              const du = axis === 0 ? epsilon : 0,
                dv = axis === 1 ? epsilon : 0;
              sample(u - du, v - dv, a);
              sample(u + du, v + dv, b);
              for (const key of Object.keys(a) as (keyof SurfaceSample)[])
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
              const left = a.height,
                right = b.height;
              sample(u, v, a);
              expect(
                Math.abs(right - 2 * a.height + left) / epsilon,
              ).toBeLessThan(0.001);
            }
      }
    },
  );

  it('crackle glaze encloses smooth faces with fine dark recessed hairlines', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crack = { ...face },
      beyond = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('crackleglaze', seed);
      for (const [column, row] of [
        [0, 0],
        [7, 11],
        [15, 15],
      ]) {
        const u = (column + 0.5) / 16,
          v = (row + 0.5) / 16;
        sample(u, v, face);
        // Every direction leaves the smooth face through a crack and returns
        // to glaze; broad mud fissures cannot satisfy this hairline width.
        for (let direction = 0; direction < 8; direction++) {
          const angle = (direction * Math.PI) / 4,
            du = Math.cos(angle),
            dv = Math.sin(angle);
          let start = -1,
            end = -1,
            darkest = Infinity,
            crackU = 0,
            crackV = 0;
          for (let step = 1; step <= 384; step++) {
            const distance = step / (16 * 256);
            sample(u + du * distance, v + dv * distance, beyond);
            if (beyond.color < 0.5) {
              if (start < 0) start = distance;
              if (beyond.color < darkest) {
                darkest = beyond.color;
                crackU = u + du * distance;
                crackV = v + dv * distance;
                Object.assign(crack, beyond);
              }
            } else if (start >= 0) {
              end = distance;
              break;
            }
          }
          expect(start).toBeGreaterThan(0);
          expect(end).toBeGreaterThan(start);
          // At a network junction both coordinate axes can follow cracks.
          // Include oblique transects to measure width across the hairline.
          let narrowest = Infinity;
          for (let axis = 0; axis < 8; axis++) {
            const angle = (axis * Math.PI) / 8;
            let width = 0;
            for (const side of [-1, 1])
              for (let step = 1; step <= 256; step++) {
                const distance = (side * step) / (16 * 1024);
                sample(
                  crackU + Math.cos(angle) * distance,
                  crackV + Math.sin(angle) * distance,
                  beyond,
                );
                if (beyond.color >= 0.5 || step === 256) {
                  width += step / (16 * 1024);
                  break;
                }
              }
            narrowest = Math.min(narrowest, width);
          }
          expect(narrowest).toBeLessThan(1 / (16 * 8));
          expect(crack.height).toBeLessThan(face.height);
          expect(crack.occlusion).toBeLessThan(face.occlusion);
          expect(crack.roughness).toBeGreaterThan(face.roughness);
        }
      }
    }
  });

  it('ceramic flutes export rounded vertical ridges with no lengthwise normal slope', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('flutedceramic', seed);
      let across = 0,
        along = 0;
      for (let x = 0; x < 128; x++) {
        const u = (x + 0.5) / 128;
        sample(u, 0.23, a);
        sample(u + 1 / 64, 0.23, b);
        across += Math.abs(a.height - b.height);
        sample(u, 0.71, b);
        along += Math.abs(a.height - b.height);
      }
      expect(across).toBeGreaterThan(0);
      expect(along).toBeLessThan(across / 100);
      const maps = generateProceduralMaps('flutedceramic', 128, seed);
      for (let p = 0; p < maps.normal.length; p += 4)
        expect(maps.normal[p + 1]).toBe(128);
      expect(maps.normal.some((value, i) => i % 4 === 0 && value !== 128)).toBe(
        true,
      );
    }
  });

  it('encaustic ornament is flat pigment above recessed square grout', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pigment = { ...face },
      grout = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('encaustictiles', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 1],
        [3, 3],
      ]) {
        sample((column + 0.78) / 4, (row + 0.72) / 4, face);
        sample((column + 0.66) / 4, (row + 0.5) / 4, pigment);
        expect(pigment.color).toBeLessThan(face.color);
        expect(face.height).toBe(pigment.height);
        expect(face.mortar).toBe(0);
        expect(pigment.mortar).toBe(0);
        for (const [x, y] of [
          [column, row + 0.5],
          [column + 0.5, row],
        ]) {
          sample(x / 4, y / 4, grout);
          expect(grout.height).toBeLessThan(face.height);
          expect(grout.occlusion).toBeLessThan(face.occlusion);
          expect(grout.mortar).toBeGreaterThan(face.mortar);
        }
        // Crossing a corner bevel's diagonal must not switch abruptly between
        // the horizontal and vertical grout slopes.
        const epsilon = 1e-9;
        for (const edge of [0.04, 0.06, 0.08])
          for (const sx of [1, -1])
            for (const sy of [1, -1]) {
              const u = (column + (sx === 1 ? edge : 1 - edge)) / 4,
                v = (row + (sy === 1 ? edge : 1 - edge)) / 4;
              sample(u - epsilon, v, face);
              sample(u, v, grout);
              sample(u + epsilon, v, pigment);
              for (const key of ['height', 'mortar', 'occlusion'] as const)
                expect(
                  Math.abs(face[key] - 2 * grout[key] + pigment[key]) / epsilon,
                ).toBeLessThan(0.01);
            }
      }
      const maps = generateProceduralMaps('encaustictiles', 128, seed);
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const tx = x % 32,
            ty = y % 32;
          if (tx < 4 || tx > 27 || ty < 4 || ty > 27) continue;
          const p = (y * 128 + x) * 4;
          expect(maps.normal[p]).toBe(128);
          expect(maps.normal[p + 1]).toBe(128);
        }
    }
  });

  it.each([
    'crackleglaze',
    'flutedceramic',
    'encaustictiles',
    'fishscales',
    'tortoiseshell',
    'feathers',
  ] as const)(
    '%s has C1 fields through narrow shoulders, overlapping owners and support',
    (kind) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a },
        center = { ...a },
        halfA = { ...a },
        halfB = { ...a };
      const cells =
        kind === 'crackleglaze'
          ? 16
          : kind === 'flutedceramic'
            ? 96
            : kind === 'fishscales'
              ? 10
              : kind === 'tortoiseshell'
                ? 6
                : kind === 'feathers'
                  ? 8
                  : 4;
      // Extrapolate each one-sided slope to cancel smooth curvature. A usable
      // step avoids amplified rounding error from tiny hairline sample offsets.
      const epsilon = 1e-7 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let i = 0; i < 1024; i++) {
          const u = i < 64 ? (i % cells) / cells : (i + 0.37) / 1024,
            v =
              i >= 64 && i < 128
                ? (i % cells) / cells
                : (((i * 157) % 1024) + 0.29) / 1024;
          for (const [du, dv] of [
            [epsilon, 0],
            [0, epsilon],
          ]) {
            sample(u - du, v - dv, a);
            sample(u, v, center);
            sample(u + du, v + dv, b);
            sample(u - du / 2, v - dv / 2, halfA);
            sample(u + du / 2, v + dv / 2, halfB);
            for (const key of Object.keys(a) as (keyof SurfaceSample)[])
              expect(
                Math.abs(
                  4 * (halfA[key] + halfB[key]) -
                    a[key] -
                    b[key] -
                    6 * center[key],
                ) / epsilon,
              ).toBeLessThan(0.001);
          }
        }
      }
    },
  );
  it.each(['limestone', 'breccia'] as const)(
    '%s recesses porous or cement matrix below the exposed mineral faces',
    (kind) => {
      const surface: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        let lowestOcclusion = Infinity,
          highestOcclusion = -Infinity,
          recessedHeight = 0,
          faceHeight = 0;
        // Find the matrix and mineral faces from cavity shading rather than
        // duplicating the seeded geometry or pinning incidental relief values.
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 128; x++) {
            sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
            if (surface.occlusion < lowestOcclusion) {
              lowestOcclusion = surface.occlusion;
              recessedHeight = surface.height;
            }
            if (surface.occlusion > highestOcclusion) {
              highestOcclusion = surface.occlusion;
              faceHeight = surface.height;
            }
          }
        expect(lowestOcclusion).toBeLessThan(highestOcclusion);
        expect(recessedHeight).toBeLessThan(faceHeight);
      }
    },
  );

  it('orange oil glands are depressed below the surrounding rounded skin', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('orangepeel', seed);
      for (const [column, row] of [
        [0, 0],
        [7, 13],
        [23, 19],
      ]) {
        let centerU = 0,
          centerV = 0,
          glandOcclusion = 1,
          glandHeight = 0;
        // Locate a seeded gland by its cavity shading, not a copied hash.
        for (let y = 0; y < 17; y++)
          for (let x = 0; x < 17; x++) {
            const u = (column + (x + 0.5) / 17) / 24,
              v = (row + (y + 0.5) / 17) / 24;
            sample(u, v, a);
            if (a.occlusion < glandOcclusion) {
              centerU = u;
              centerV = v;
              glandOcclusion = a.occlusion;
              glandHeight = a.height;
            }
          }
        let skinHeight = 0,
          skinOcclusion = 0;
        for (let direction = 0; direction < 8; direction++) {
          const angle = (direction / 8) * Math.PI * 2;
          sample(
            centerU + (0.5 / 24) * Math.cos(angle),
            centerV + (0.5 / 24) * Math.sin(angle),
            a,
          );
          skinHeight += a.height / 8;
          skinOcclusion += a.occlusion / 8;
        }
        expect(glandHeight).toBeLessThan(skinHeight);
        expect(glandOcclusion).toBeLessThan(skinOcclusion);
      }
    }
  });

  it.each([
    ['coconut', 'height'],
    ['watermelon', 'color'],
  ] as const)(
    '%s has longitudinal %s features rather than crosswise bands',
    (kind, field) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        let transverse = 0,
          longitudinal = 0;
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 128; x++) {
            const u = (x + 0.5) / 128,
              v = (y + 0.5) / 128;
            sample(u, v, a);
            sample(u + 1 / 128, v, b);
            transverse += (a[field] - b[field]) ** 2;
            sample(u, v + 1 / 128, b);
            longitudinal += (a[field] - b[field]) ** 2;
          }
        expect(transverse).toBeGreaterThan(longitudinal);
      }
    },
  );

  it('knurled metal leaves raised diamond tips between both diagonal cuts', () => {
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('knurledmetal', seed);
      for (const offset of [0, 1 / 12, 7 / 12]) {
        sample(offset + 1 / 48, offset, surface);
        const tip = surface.height,
          tipOcclusion = surface.occlusion;
        for (const side of [-1, 1]) {
          sample(offset + 1 / 96, offset + side / 96, surface);
          expect(surface.height).toBeLessThan(tip);
          expect(surface.occlusion).toBeLessThan(tipOcclusion);
        }
      }
    }
  });

  it('engine-turned disk support boundaries blend with continuous field slopes', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      center = { ...a };
    const epsilon = 1e-8;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('engineturned', seed);
      for (const row of [0, 1, 5])
        for (const column of [0, 3, 5])
          for (let i = 0; i < 19; i++) {
            const angle = (i / 19) * Math.PI * 2,
              dx = Math.cos(angle),
              dy = Math.sin(angle);
            const u = (column + 0.25 + 0.5 * (row % 2) + 0.95 * dx) / 6,
              v = (row + 0.5 + 0.95 * dy) / 6;
            sample(u - epsilon * dx, v - epsilon * dy, a);
            sample(u + epsilon * dx, v + epsilon * dy, b);
            sample(u, v, center);
            for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
              expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
              expect(
                Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
              ).toBeLessThan(0.01);
            }
          }
    }
  });

  it.each([
    ['limestone', 24],
    ['breccia', 6],
    ['osb', 6],
    ['chipboard', 28],
    ['straw', 8],
  ] as const)(
    '%s fades all owned fields smoothly as feature neighborhoods change',
    (kind, cells) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a },
        center = { ...a };
      // Use a cell-local step: dense chip edges have high but continuous
      // curvature, which a fixed UV step can mistake for a slope jump.
      const epsilon = 1e-8 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let edge = 0; edge <= cells; edge++)
          for (let i = 0; i < 37; i++)
            for (const axis of [0, 1]) {
              const u = axis === 0 ? edge / cells : (i + 0.37) / 37,
                v = axis === 1 ? edge / cells : (i + 0.37) / 37;
              const du = axis === 0 ? epsilon : 0,
                dv = axis === 1 ? epsilon : 0;
              sample(u - du, v - dv, a);
              sample(u + du, v + dv, b);
              sample(u, v, center);
              for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                expect(
                  Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
                ).toBeLessThan(0.01);
              }
            }
      }
    },
  );

  it('reed mat binding threads lift above slender reed crowns and recessed gaps', () => {
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('reedmat', seed);
      for (let reed = 0; reed < 16; reed++)
        for (let row = 0; row < 4; row++) {
          const u = (reed + 0.5) / 16,
            v = row / 4;
          sample(u, v, surface);
          const binding = surface.height;
          sample(u, v + 1 / 8, surface);
          const crown = surface.height;
          sample(reed / 16, v + 1 / 8, surface);
          const gap = surface.height;
          expect(binding).toBeGreaterThan(crown);
          expect(crown).toBeGreaterThan(surface.height);
          sample(reed / 16, v, surface);
          expect(surface.height).toBeGreaterThan(gap);
        }
    }
  });

  it('rope relief follows diagonal helical grooves rather than crossing knit loops', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    const epsilon = 1e-5;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rope', seed);
      let along = 0,
        across = 0;
      for (let band = 0; band < 6; band++)
        for (let step = 0; step < 96; step++) {
          const u = (band + 0.5) / 6,
            v = (step + 0.37) / 96;
          sample(u - epsilon / 3, v - epsilon, a);
          sample(u + epsilon / 3, v + epsilon, b);
          along += (a.height - b.height) ** 2;
          sample(u, v - epsilon, a);
          sample(u, v + epsilon, b);
          across += (a.height - b.height) ** 2;
        }
      expect(across).toBeGreaterThan(along * 4);
    }
  });

  it('thin straw stems stand above bedding gaps and fade all owned fields at their edges', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      center = { ...a };
    const epsilon = 1e-8 / 8;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('straw', seed),
        salt = seed ^ (2 * 0x39a7);
      let isolatedStem = false;
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          const angle = Math.PI * 2 * featureHash(x, y, salt ^ 0x18d3),
            nx = -Math.sin(angle),
            ny = Math.cos(angle),
            u = (x + 0.25 + 0.5 * featureHash(x, y, salt ^ 0x4f17)) / 8,
            v = (y + 0.25 + 0.5 * featureHash(x, y, salt ^ 0x73c9)) / 8,
            width = (0.035 + 0.03 * featureHash(x, y, salt ^ 0x519b)) / 8;
          sample(u, v, center);
          sample(u - 2 * width * nx, v - 2 * width * ny, a);
          sample(u + 2 * width * nx, v + 2 * width * ny, b);
          // Inspect exposed stems, not unrelated stems layered across a gap.
          if (a.occlusion < 0.65 && b.occlusion < 0.65) {
            isolatedStem = true;
            expect(center.height).toBeGreaterThan(a.height);
            expect(center.height).toBeGreaterThan(b.height);
          }
          for (const side of [-1, 1]) {
            const px = u + side * width * nx,
              py = v + side * width * ny;
            sample(px - epsilon * nx, py - epsilon * ny, a);
            sample(px + epsilon * nx, py + epsilon * ny, b);
            sample(px, py, center);
            for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
              expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
              expect(
                Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
              ).toBeLessThan(0.01);
            }
          }
        }
      expect(isolatedStem).toBe(true);
    }
  });

  it('OSB relief follows long aligned strands while chipboard has finer unoriented chips', () => {
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const geometry = (kind: 'osb' | 'chipboard') => {
      let across = 0,
        along = 0,
        minimum = Infinity,
        maximum = -Infinity;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const u = (x + 0.37) / 64,
              v = (y + 0.61) / 64;
            sample(u, v, surface);
            const center = surface.height;
            minimum = Math.min(minimum, center);
            maximum = Math.max(maximum, center);
            sample(u + 1 / 2048, v, surface);
            across += Math.abs(surface.height - center);
            sample(u, v + 1 / 2048, surface);
            along += Math.abs(surface.height - center);
          }
      }
      return {
        directionality: across / along,
        edgeDensity: (across + along) / (maximum - minimum),
      };
    };
    const strands = geometry('osb'),
      chips = geometry('chipboard');
    // Compare geometry independently of each preset's relief amplitude.
    expect(strands.directionality).toBeGreaterThan(1.5);
    expect(strands.directionality).toBeGreaterThan(chips.directionality);
    expect(chips.edgeDensity).toBeGreaterThan(strands.edgeDensity * 1.5);
  });

  it('acoustic foam has four sloping pyramid faces above recessed cell edges', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('acousticfoam', seed);
      for (const column of [0, 2, 3])
        for (const row of [0, 1, 3]) {
          sample((column + 0.5) / 4, (row + 0.5) / 4, a);
          const peak = a.height,
            peakOcclusion = a.occlusion;
          for (const axis of [0, 1])
            for (const side of [-1, 1]) {
              const heights: number[] = [];
              for (const distance of [0.1, 0.2, 0.3, 0.5]) {
                sample(
                  (column + 0.5 + (axis === 0 ? side * distance : 0)) / 4,
                  (row + 0.5 + (axis === 1 ? side * distance : 0)) / 4,
                  a,
                );
                heights.push(a.height);
              }
              expect(peak).toBeGreaterThan(heights[0]);
              expect(heights[0]).toBeGreaterThan(heights[1]);
              expect(heights[1]).toBeGreaterThan(heights[2]);
              // The middle of each face stays nearly planar, not sinusoidal.
              expect(
                Math.abs(heights[0] - 2 * heights[1] + heights[2]),
              ).toBeLessThan((heights[0] - heights[2]) * 0.15);
              expect(heights[2]).toBeGreaterThan(heights[3]);
              expect(a.occlusion).toBeLessThan(peakOcclusion);
            }
        }
    }
  });

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

  it('wafflecloth raises orthogonal woven rims above its square pockets', () => {
    const rim: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pocket = { ...rim };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wafflecloth', seed);
      for (const column of [0, 3, 7])
        for (const row of [0, 4, 7]) {
          sample((column + 0.5) / 8, (row + 0.5) / 8, pocket);
          for (const [x, y] of [
            [0, 0.5],
            [0.5, 0],
            [0, 0],
          ]) {
            sample((column + x) / 8, (row + y) / 8, rim);
            expect(rim.height).toBeGreaterThan(pocket.height);
            expect(rim.occlusion).toBeGreaterThan(pocket.occlusion);
          }
        }
    }
  });

  it('cableknit exchanges over-under strand height across successive braid crossings', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      gap = { ...a },
      rib = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cableknit', seed);
      for (const column of [0, 1, 3])
        for (const row of [0, 2, 3])
          for (const y of [0.125, 0.375, 0.625, 0.875]) {
            const sweep = 0.22 * Math.sin(Math.PI * 2 * y);
            sample((column + 0.5 + sweep) / 4, (row + y) / 4, a);
            sample((column + 0.5 - sweep) / 4, (row + y) / 4, b);
            expect(
              (a.height - b.height) * Math.cos(Math.PI * 2 * y),
            ).toBeGreaterThan(0);
            sample((column + 0.5) / 4, (row + y) / 4, gap);
            expect(a.height).toBeGreaterThan(gap.height);
            expect(b.height).toBeGreaterThan(gap.height);
            sample(column / 4, (row + y) / 4, rib);
            expect(rib.height).toBeGreaterThan(gap.height);
            expect(rib.height).toBeLessThan(Math.min(a.height, b.height));
          }
    }
  });

  it('quilting pads diamond centers above both recessed stitched diagonal seams', () => {
    const center: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...center },
      betweenStitches = { ...center };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('quilting', seed);
      for (const a of [0, 2, 5])
        for (const b of [-2, 0, 3]) {
          sample((a + b + 1) / 12, (a - b) / 12, center);
          for (const axis of [0, 1]) {
            const da = a + (axis === 0 ? 0 : 0.5),
              db = b + (axis === 0 ? 0.5 : 0);
            sample((da + db) / 12, (da - db) / 12, seam);
            expect(center.height).toBeGreaterThan(seam.height);
            expect(center.occlusion).toBeGreaterThan(seam.occlusion);
            const offset = 1 / 16;
            sample(
              (da + db + offset) / 12,
              (da - db + (axis === 0 ? -offset : offset)) / 12,
              betweenStitches,
            );
            expect(seam.height).toBeGreaterThan(betweenStitches.height);
          }
        }
    }
  });

  it.each(['wafflecloth', 'cableknit', 'quilting'] as const)(
    '%s keeps compact textile support slopes continuous',
    (kind) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a },
        center = { ...a };
      const cells = kind === 'wafflecloth' ? 8 : kind === 'cableknit' ? 4 : 6;
      const epsilon = 1e-8 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const t of [0.037, 0.125, 0.375, 0.68, 0.875])
          for (const side of [-1, 1]) {
            let u: number, v: number;
            if (kind === 'wafflecloth') {
              u = (side * Math.acos(0.35)) / (Math.PI * 2 * cells);
              v = t;
            } else if (kind === 'cableknit') {
              u =
                (0.5 + 0.22 * Math.sin(Math.PI * 2 * t) + side * 0.115) / cells;
              v = t / cells;
            } else {
              const seamEdge =
                (side * Math.acos(1 - 2 * 0.055)) / (Math.PI * 2);
              u = (seamEdge + t) / (2 * cells);
              v = (seamEdge - t) / (2 * cells);
            }
            const points =
              kind === 'cableknit'
                ? [
                    [u, v],
                    [1 / cells - u, v],
                    [side / (6 * cells), v],
                  ]
                : kind === 'wafflecloth'
                  ? [
                      [u, v],
                      [v, u],
                    ]
                  : [
                      [u, v],
                      [u, -v],
                      [
                        (side * Math.acos(0.2)) / (Math.PI * 2 * 8 * 2 * cells),
                        (-side * Math.acos(0.2)) /
                          (Math.PI * 2 * 8 * 2 * cells),
                      ],
                    ];
            for (const [px, py] of points)
              for (const [du, dv] of [
                [epsilon, 0],
                [0, epsilon],
              ]) {
                sample(px - du, py - dv, a);
                sample(px + du, py + dv, b);
                sample(px, py, center);
                for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                  expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                  expect(
                    Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
                  ).toBeLessThan(0.01);
                }
              }
          }
      }
    },
  );

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

  it('herringbone reverses its diagonal twill on alternating chevron halves', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('herringbone', seed);
      for (const half of [0, 1]) {
        let alongTwill = 0,
          acrossTwill = 0;
        const direction = half === 0 ? 1 : -1;
        for (const u of [0.06, 0.1, 0.14, 0.18])
          for (let row = 0; row < 48; row++) {
            const x = u + half * 0.25,
              y = row / 48;
            sample(x, y, a);
            sample(x + 1 / 32, y + direction / 32, b);
            alongTwill += (a.color - b.color) ** 2;
            sample(x + 1 / 32, y - direction / 32, b);
            acrossTwill += (a.color - b.color) ** 2;
          }
        expect(alongTwill).toBeLessThan(acrossTwill);
      }
    }
  });

  it('seersucker puckers vary along raised bands while adjacent bands remain flat-woven', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('seersucker', seed);
      for (let band = 0; band < 4; band++) {
        let raisedVariation = 0,
          flatVariation = 0;
        for (let row = 0; row < 96; row++) {
          const u = band / 4,
            v = row / 96;
          sample(u, v, a);
          sample(u + 1 / 8, v, b);
          expect(a.height).toBeGreaterThan(b.height);
          const raised = a.height,
            flat = b.height;
          // One warp/weft repeat preserves the fine weave but advances
          // the soft pucker; a uniform corduroy wale would not do this.
          sample(u, v + 1 / 24, a);
          sample(u + 1 / 8, v + 1 / 24, b);
          raisedVariation += (a.height - raised) ** 2;
          flatVariation += (b.height - flat) ** 2;
        }
        expect(raisedVariation).toBeGreaterThan(flatVariation);
      }
    }
  });

  it('shingle tabs are staggered, recessed at their lower cuts and shadowed at course laps', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('roofshingles', seed);
      for (let row = 0; row < 6; row++) {
        const cut = (row % 2) / 8;
        sample(cut, (row + 0.75) / 6, a);
        sample(cut + 0.125, (row + 0.75) / 6, b);
        expect(b.height).toBeGreaterThan(a.height);
        expect(b.occlusion).toBeGreaterThan(a.occlusion);
        sample(cut, (row + 0.25) / 6, b);
        expect(b.height).toBeGreaterThan(a.height);
        sample(cut + 0.125, row / 6, a);
        sample(cut + 0.125, (row + 0.5) / 6, b);
        expect(b.height).toBeGreaterThan(a.height);
        expect(b.occlusion).toBeGreaterThan(a.occlusion);
      }
    }
  });

  it.each(['roofshingles', 'rooftiles'] as const)(
    '%s fades owner variation without a normal crease at course, offset or crown seams',
    (kind) => {
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
      const rows = kind === 'roofshingles' ? 6 : 5;
      const columns = kind === 'roofshingles' ? 8 : 12;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row <= rows; row++)
          for (let column = 0; column <= columns; column++)
            for (const offset of [0, 0.5, 0.75])
              for (const [du, dv] of [
                [epsilon, 0],
                [0, epsilon],
              ]) {
                const u = column / columns,
                  v = (row + offset) / rows;
                sample(u - du, v - dv, a);
                sample(u + du, v + dv, b);
                const leftHeight = a.height,
                  rightHeight = b.height;
                sample(u, v, a);
                expect(
                  Math.abs(rightHeight - 2 * a.height + leftHeight) / epsilon,
                ).toBeLessThan(0.001);
              }
      }
    },
  );

  it('roof tiles have rounded crowns above channels and transverse recessed course laps', () => {
    const crown: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const shoulder = { ...crown },
      channel = { ...crown },
      lap = { ...crown };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rooftiles', seed);
      for (let row = 0; row < 5; row++)
        for (let column = 0; column < 6; column++) {
          const u = column / 6,
            v = (row + 0.5) / 5;
          sample(u, v, crown);
          sample(u + 1 / 24, v, shoulder);
          sample(u + 1 / 12, v, channel);
          sample(u, row / 5, lap);
          expect(crown.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.height).toBeGreaterThan(channel.height);
          expect(crown.occlusion).toBeGreaterThan(channel.occlusion);
          expect(crown.height).toBeGreaterThan(lap.height);
          expect(crown.occlusion).toBeGreaterThan(lap.occlusion);
        }
    }
  });

  it('tortoiseshell scute shoulders have continuous slopes where polygon edges meet', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const center: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const left = { ...center },
      right = { ...center },
      halfLeft = { ...center },
      halfRight = { ...center };
    const epsilon = 1e-5 / 6;
    let corners = 0;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tortoiseshell', seed);
      for (const [x, y] of [
        [0, 0],
        [2, 3],
        [5, 5],
      ]) {
        const px = 0.22 + 0.56 * featureHash(x, y, seed ^ 0x35b7),
          py = 0.22 + 0.56 * featureHash(x, y, seed ^ 0x6e19);
        const planes: number[][] = [];
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const wx = (x + ox + 6) % 6,
              wy = (y + oy + 6) % 6;
            const dx =
                ox + 0.22 + 0.56 * featureHash(wx, wy, seed ^ 0x35b7) - px,
              dy = oy + 0.22 + 0.56 * featureHash(wx, wy, seed ^ 0x6e19) - py;
            const distance = Math.hypot(dx, dy);
            planes.push([dx / distance, dy / distance, distance / 2]);
          }
        // Intersect equal-inset shoulders, not the already-flat dark seam.
        // A nearest-edge bevel has a normal discontinuity at these corners.
        for (let i = 0; i < planes.length; i++)
          for (let j = i + 1; j < planes.length; j++) {
            const a = planes[i]!,
              b = planes[j]!,
              determinant = a[0]! * b[1]! - a[1]! * b[0]!;
            if (Math.abs(determinant) < 0.01) continue;
            const dx =
                ((a[2]! - 0.06) * b[1]! - a[1]! * (b[2]! - 0.06)) / determinant,
              dy =
                (a[0]! * (b[2]! - 0.06) - (a[2]! - 0.06) * b[0]!) / determinant;
            if (
              planes.some((p) => p[2]! - dx * p[0]! - dy * p[1]! < 0.06 - 1e-10)
            )
              continue;
            corners++;
            const u = (x + px + dx) / 6,
              v = (y + py + dy) / 6;
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
            ]) {
              sample(u, v, center);
              sample(u - du!, v - dv!, left);
              sample(u + du!, v + dv!, right);
              sample(u - du! / 2, v - dv! / 2, halfLeft);
              sample(u + du! / 2, v + dv! / 2, halfRight);
              for (const key of Object.keys(center) as (keyof SurfaceSample)[])
                expect(
                  Math.abs(
                    4 * (halfLeft[key] + halfRight[key]) -
                      left[key] -
                      right[key] -
                      6 * center[key],
                  ) / epsilon,
                ).toBeLessThan(0.001);
            }
          }
      }
    }
    expect(corners).toBeGreaterThan(0);
  });
  it.each(['fishscales', 'feathers'] as const)(
    '%s has rounded crowns or raised shafts rather than flat repeated pigment',
    (kind) => {
      const crown: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const shoulder = { ...crown };
      const columns = kind === 'fishscales' ? 10 : 8,
        rows = kind === 'fishscales' ? 10 : 4;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            const u = (column + (row % 2) * 0.5 + 0.5) / columns,
              v = (row + 0.5) / rows;
            sample(u, v, crown);
            for (const direction of [-1, 1]) {
              sample(
                u +
                  (direction * (kind === 'fishscales' ? 0.5 : 0.12)) / columns,
                v,
                shoulder,
              );
              expect(crown.height).toBeGreaterThan(shoulder.height);
            }
          }
      }
    },
  );
  it.each(['snakeskin', 'crocodile'] as const)(
    '%s has raised embossed centers above recessed gaps on both axes',
    (kind) => {
      const center: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const gap = { ...center };
      const columns = kind === 'snakeskin' ? 10 : 4,
        rows = kind === 'snakeskin' ? 12 : 6;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            const stagger = kind === 'snakeskin' ? (row % 2) * 0.5 : 0;
            const u = (column + stagger + 0.5) / columns,
              v = (row + 0.5) / rows;
            sample(u, v, center);
            sample(u + 0.5 / columns, v, gap);
            expect(center.height).toBeGreaterThan(gap.height);
            expect(center.occlusion).toBeGreaterThan(gap.occlusion);
            // Pointed staggered scales extend into the next row, so their
            // transverse gap lies between offset owners rather than at a T joint.
            sample(
              u + (kind === 'snakeskin' ? 0.25 / columns : 0),
              v + 0.5 / rows,
              gap,
            );
            expect(center.height).toBeGreaterThan(gap.height);
            expect(center.occlusion).toBeGreaterThan(gap.occlusion);
          }
      }
    },
  );
  it.each(['snakeskin', 'crocodile'] as const)(
    '%s meets the recessed skin with continuous slopes at rounded compact support',
    (kind) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const columns = kind === 'snakeskin' ? 10 : 4,
        rows = kind === 'snakeskin' ? 12 : 6;
      const epsilon = 1e-7;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const row of [0, 1, 3]) {
          const u =
              (0.5 + (kind === 'snakeskin' ? (row % 2) * 0.5 : 0)) / columns,
            v = (row + 0.5) / rows;
          sample(u + 0.5 / columns, v, a);
          const floorOcclusion = a.occlusion;
          let inside = u,
            outside = u + 0.5 / columns;
          // Locate the actual seeded shoulder, not a pinned radius or relief.
          for (let step = 0; step < 48; step++) {
            const middle = (inside + outside) / 2;
            sample(middle, v, a);
            if (a.occlusion > floorOcclusion) inside = middle;
            else outside = middle;
          }
          const boundary = (inside + outside) / 2;
          for (const [du, dv] of [
            [epsilon, 0],
            [0, epsilon],
          ]) {
            sample(boundary - du, v - dv, a);
            const left = a.height;
            sample(boundary + du, v + dv, a);
            const right = a.height;
            sample(boundary, v, a);
            expect(
              Math.abs(right - 2 * a.height + left) / epsilon,
            ).toBeLessThan(0.001);
          }
        }
      }
    },
  );

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
});
