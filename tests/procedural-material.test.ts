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
  'corrugatedcardboard',
  'creasedpaper',
  'layeredpaper',
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
  'studdedrubber',
  'groovedrubber',
  'recycledrubber',
  'breadcrust',
  'wafer',
  'chocolate',
  'basketball',
  'tennisball',
  'golfball',
  'boardformedconcrete',
  'ribbedconcrete',
  'splitfaceblock',
  'chainmail',
  'rivetedmetal',
  'weldedmetal',
  'cactus',
  'pinecone',
  'corncob',
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
  describe('botanical surface relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    it('cactus has longitudinal ribs, rough areoles and recessed radial marks', () => {
      const crest = empty(),
        groove = empty(),
        areole = empty(),
        mark = empty(),
        skin = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('cactus', seed);
        for (const [column, row] of [
          [0, 0],
          [3, 5],
          [7, 7],
        ]) {
          const x = column + 0.5,
            y = row + 0.5 + 0.12 * (hash(column, row, seed ^ 0x2d59) - 0.5),
            angle = hash(column, row, seed ^ 0x7f31) * Math.PI * 2,
            rx = Math.cos(angle),
            ry = Math.sin(angle);
          sample(x / 8, (y + 0.45) / 8, crest);
          sample((x - 0.5) / 8, (y + 0.45) / 8, groove);
          sample(x / 8, y / 8, areole);
          expect(crest.height).toBeGreaterThan(groove.height);
          expect(areole.roughness).toBeGreaterThan(crest.roughness);
          const mx = x + 0.24 * rx,
            my = y + 0.24 * ry;
          sample(mx / 8, my / 8, mark);
          // The row boundary shares the rib's x coordinate but lies beyond
          // either row's areole support, so relief scaling cancels naturally.
          sample(mx / 8, (row + 1) / 8, skin);
          expect(mark.height).toBeLessThan(skin.height);
          expect(mark.roughness).toBeGreaterThan(skin.roughness);
        }
      }
    });
    it('pinecone exposes raised angular tips above centers and overlap seams', () => {
      const tip = empty(),
        center = empty(),
        seam = empty(),
        root = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('pinecone', seed);
        for (const [column, row] of [
          [0, 0],
          [3, 5],
          [7, 7],
        ]) {
          const x = column + (row % 2) * 0.5 + 0.5,
            y = row + 0.5;
          sample(x / 8, y / 8, center);
          sample(x / 8, (y + 0.6) / 8, tip);
          sample((x + 0.35) / 8, (y + 0.6) / 8, seam);
          sample(x / 8, (y + 0.86) / 8, root);
          expect(tip.height).toBeGreaterThan(center.height);
          expect(tip.height).toBeGreaterThan(seam.height);
          expect(tip.height).toBeGreaterThan(root.height);
        }
      }
    });
    it('corn has rounded oblong crowns and narrow recessed interstices', () => {
      const crown = empty(),
        shoulder = empty(),
        gap = empty(),
        along = empty(),
        across = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('corncob', seed);
        for (const [column, row] of [
          [0, 0],
          [5, 3],
          [11, 7],
        ]) {
          const u = (column + 0.5) / 12,
            v = (row + 0.5) / 8;
          sample(u, v, crown);
          for (const [du, dv] of [
            [0.3 / 12, 0],
            [0, 0.3 / 8],
          ]) {
            sample(u + du, v + dv, shoulder);
            sample(u + (du * 5) / 3, v + (dv * 5) / 3, gap);
            expect(crown.height).toBeGreaterThan(shoulder.height);
            expect(shoulder.height).toBeGreaterThan(gap.height);
            expect(crown.occlusion).toBeGreaterThan(gap.occlusion);
          }
          sample(u, v + 0.025, along);
          sample(u + 0.025, v, across);
          expect(along.height).toBeGreaterThan(across.height);
        }
      }
    });
    it.each(['cactus', 'pinecone', 'corncob'] as const)(
      '%s is C1 at actual seeded shoulders, tips, corners and support',
      (kind) => {
        const a = empty(),
          b = empty(),
          center = empty(),
          halfA = empty(),
          halfB = empty();
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          for (const [column, row] of [
            [0, 0],
            [3, 5],
            [7, 7],
          ]) {
            const points: number[][] = [];
            const x = column + 0.5,
              y = row + 0.5;
            if (kind === 'cactus') {
              const cy = y + 0.12 * (hash(column, row, seed ^ 0x2d59) - 0.5),
                angle = hash(column, row, seed ^ 0x7f31) * Math.PI * 2,
                length = 0.28 + 0.08 * hash(column, row, seed ^ 0x4a73);
              points.push([(x + 0.14) / 8, cy / 8], [x / 8, (cy + 0.13) / 8]);
              for (let ray = 0; ray < 8; ray++) {
                const rx = Math.cos(angle + (ray * Math.PI) / 4),
                  ry = Math.sin(angle + (ray * Math.PI) / 4);
                for (const distance of [0.09, 0.145, length - 0.085, length])
                  points.push([
                    (x + distance * rx) / 8,
                    (cy + distance * ry) / 8,
                  ]);
                points.push([
                  (x + 0.24 * rx - 0.015 * ry) / 8,
                  (cy + 0.24 * ry + 0.015 * rx) / 8,
                ]);
              }
            } else if (kind === 'pinecone') {
              const cx = x + (row % 2) * 0.5;
              for (const dy of [-0.78, -0.66, 0.74, 0.86])
                for (const dx of [0, 0.68 - 0.55 * dy, 0.58 - 0.55 * dy])
                  for (const sign of [-1, 1])
                    points.push([(cx + sign * dx) / 8, (y + dy) / 8]);
              points.push([cx / 8, (y - 0.05) / 8], [cx / 8, (y + 0.71) / 8]);
            } else {
              const variation = hash(column, row, seed ^ 0x4a73),
                width = 0.445 + 0.015 * variation,
                length = 0.46 + 0.015 * variation;
              for (const cap of [0, 0.28])
                for (const dx of [0, 0.4, 0.8]) {
                  const dy = Math.sqrt(1 - cap - dx ** 4);
                  for (const sign of [-1, 1])
                    points.push([
                      (x + dx * width) / 12,
                      (y + sign * dy * length) / 8,
                    ]);
                }
            }
            for (const [u, v] of points)
              for (const [du, dv] of [
                [1e-8, 0],
                [0, 1e-8],
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
                    ) / 1e-8,
                  ).toBeLessThan(0.001);
              }
          }
        }
      },
    );
  });
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
      const metallic = new Set<number>();
      for (let p = 0; p < first.baseColor.length; p += 4) {
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
          kind === 'goldleaf' ||
          kind === 'rivetedmetal' ||
          kind === 'weldedmetal'
        )
          expect(first.metallicRoughness[p + 2]).toBe(255);
        else if (kind !== 'rust' && kind !== 'chainmail')
          expect(first.metallicRoughness[p + 2]).toBe(0);
        expect(first.metallicRoughness[p + 3]).toBe(255);
        expect(first.occlusion[p]).toBeGreaterThan(0);
        expect(first.occlusion[p + 3]).toBe(255);
      }
      if (kind === 'rust') {
        expect(Math.min(...metallic)).toBeLessThan(40);
        expect(Math.max(...metallic)).toBeGreaterThan(200);
      }
      if (kind === 'chainmail') {
        expect(metallic.has(0)).toBe(true);
        expect(metallic.has(255)).toBe(true);
        expect([...metallic].some((value) => value > 0 && value < 255)).toBe(
          true,
        );
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
    ['studdedrubber', [6, 32, 144]],
    ['groovedrubber', [12, 32, 144]],
    ['recycledrubber', [32, 48, 144]],
    ['breadcrust', [7, 19, 23, 32]],
    ['wafer', [12, 24, 32]],
    ['chocolate', [4, 32]],
    ['basketball', [2, 32, 36]],
    ['tennisball', [1, 24, 32]],
    ['golfball', [10, 32]],
    ['boardformedconcrete', [2, 4, 8, 32, 96, 128]],
    ['ribbedconcrete', [12, 24, 32, 96]],
    ['splitfaceblock', [4, 8, 24, 32, 96]],
    ['chainmail', [6, 8, 48, 64]],
    ['rivetedmetal', [3, 4, 48, 64]],
    ['weldedmetal', [3, 32, 48, 64]],
    ['cactus', [8, 48, 64]],
    ['pinecone', [8, 16, 48, 64]],
    ['corncob', [8, 12, 48, 64]],
    ['corrugatedcardboard', [4, 24, 32, 48, 64]],
    ['creasedpaper', [2, 24, 32, 48, 64]],
    ['layeredpaper', [2, 4, 24, 32, 48, 64]],
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
                if (kind !== 'chainmail')
                  expect(a.metallic).toBe(
                    kind === 'diamondplate' ||
                      kind === 'hammeredmetal' ||
                      kind === 'galvanized' ||
                      kind === 'corrugatedmetal' ||
                      kind === 'knurledmetal' ||
                      kind === 'engineturned' ||
                      kind === 'goldleaf' ||
                      kind === 'rivetedmetal' ||
                      kind === 'weldedmetal'
                      ? 1
                      : 0,
                  );
                if (
                  kind !== 'mosaic' &&
                  kind !== 'hexagontiles' &&
                  kind !== 'encaustictiles' &&
                  kind !== 'splitfaceblock'
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
    ['studdedrubber', 144],
    ['groovedrubber', 144],
    ['recycledrubber', 144],
    ['breadcrust', 7],
    ['breadcrust', 19],
    ['breadcrust', 23],
    ['wafer', 12],
    ['wafer', 24],
    ['chocolate', 4],
    ['basketball', 2],
    ['basketball', 36],
    ['tennisball', 24],
    ['tennisball', 32],
    ['golfball', 10],
    ['boardformedconcrete', 4],
    ['boardformedconcrete', 8],
    ['boardformedconcrete', 128],
    ['ribbedconcrete', 12],
    ['ribbedconcrete', 96],
    ['splitfaceblock', 8],
    ['splitfaceblock', 96],
    ['chainmail', 6],
    ['chainmail', 8],
    ['chainmail', 64],
    ['rivetedmetal', 3],
    ['rivetedmetal', 4],
    ['rivetedmetal', 64],
    ['weldedmetal', 3],
    ['weldedmetal', 32],
    ['weldedmetal', 64],
    ['cactus', 8],
    ['cactus', 48],
    ['cactus', 64],
    ['pinecone', 8],
    ['pinecone', 16],
    ['pinecone', 48],
    ['pinecone', 64],
    ['corncob', 8],
    ['corncob', 12],
    ['corncob', 48],
    ['corncob', 64],
    ['corrugatedcardboard', 4],
    ['corrugatedcardboard', 24],
    ['corrugatedcardboard', 64],
    ['creasedpaper', 2],
    ['creasedpaper', 24],
    ['creasedpaper', 64],
    ['layeredpaper', 2],
    ['layeredpaper', 4],
    ['layeredpaper', 24],
    ['layeredpaper', 64],
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

  describe('paper packaging relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const featureHash = (x: number, y: number, seed: number) => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };

    it('cardboard has rounded axial flutes over independent kraft pulp', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('corrugatedcardboard', seed),
          ridge = empty(),
          trough = empty(),
          flank = empty();
        let microMin = Infinity,
          microMax = -Infinity,
          contrast = Infinity;
        for (let i = 0; i < 128; i++) {
          const v = i / 128;
          // The carrier repeats at 1/8 UV: these pairs differ only in macrorelief.
          sample(0, v, ridge);
          sample(0.125, v, trough);
          sample(0.0625, v, flank);
          expect(ridge.height).toBeGreaterThan(flank.height);
          expect(flank.height).toBeGreaterThan(trough.height);
          expect(ridge.color).toBeGreaterThan(trough.color);
          expect(ridge.occlusion).toBeGreaterThan(trough.occlusion);
          contrast = Math.min(contrast, ridge.height - trough.height);
          microMin = Math.min(microMin, ridge.height);
          microMax = Math.max(microMax, ridge.height);
        }
        expect(microMax).toBeGreaterThan(microMin);
        expect(microMax - microMin).toBeLessThan(contrast / 10);
      }
    });

    it('creased paper has raised intersecting folds and recessed shoulders, not additive spikes', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('creasedpaper', seed),
          flat = empty(),
          ridge = empty(),
          shoulder = empty(),
          crossing = empty(),
          shoulderCrossing = empty();
        for (const offset of [0, 0.5]) {
          sample(0.25 + offset, 0.25, flat);
          sample(offset, 0.25, ridge);
          sample(0.125 + offset, 0.25, shoulder);
          sample(offset, 0, crossing);
          sample(0.125 + offset, 0.125, shoulderCrossing);
          expect(ridge.height).toBeGreaterThan(flat.height);
          expect(flat.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.occlusion).toBeLessThan(flat.occlusion);
          expect(shoulder.color).toBeLessThan(flat.color);
          expect(crossing.height).toBeCloseTo(ridge.height, 12);
          expect(shoulderCrossing.height).toBeCloseTo(shoulder.height, 12);
          expect(ridge.roughness).toBeLessThan(flat.roughness);
        }
      }
    });

    it('layered paper has ordered overlapping strip ledges and a shaded torn undercut', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('layeredpaper', seed),
          lower = empty(),
          upper = empty(),
          overlap = empty(),
          outside = empty(),
          inside = empty(),
          edge = empty();
        for (let row = 0; row < 3; row++) {
          const v = (row + 0.5) / 4;
          sample(0.25, v, lower);
          sample(0.75, v, upper);
          expect(upper.height).toBeGreaterThan(lower.height);
          sample(0.25, v + 0.125, overlap);
          expect(overlap.height).toBeGreaterThan(lower.height);
          sample(0.25, v + 0.25, upper);
          expect(overlap.height).toBeCloseTo(upper.height, 12);
        }
        const phase = Math.PI * 2 * featureHash(7, 0, seed ^ 0x291d),
          torn = 0.008 * Math.sin(phase) + 0.004 * Math.sin(-phase),
          boundary = 0.875 + 0.18 + torn;
        sample(0.75, boundary - 0.0625, inside);
        sample(0.75, boundary + 0.0625, outside);
        sample(0.75, boundary - 0.0125, edge);
        expect(inside.height).toBeGreaterThan(outside.height);
        expect(edge.height).toBeLessThan(inside.height);
        expect(edge.height).toBeGreaterThan(outside.height);
        expect(edge.occlusion).toBeLessThan(inside.occlusion);
        expect(edge.occlusion).toBeLessThan(outside.occlusion);
      }
    });

    it.each(['corrugatedcardboard', 'creasedpaper', 'layeredpaper'] as const)(
      '%s keeps every field C1 at actual shoulders, corners, intersections and overlaps',
      (kind) => {
        const center = empty(),
          left = empty(),
          right = empty(),
          epsilon = 1e-9;
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [1, 1],
              [0, 0.137],
              [0.791, 0],
            ];
          if (kind === 'corrugatedcardboard') {
            for (let i = 0; i < 4; i++)
              for (const x of [0, 0.0625, 0.125, 0.1875])
                points.push([i / 4 + x, 0.137]);
          } else if (kind === 'creasedpaper') {
            for (const x of [0, 0.07, 0.075, 0.125, 0.175, 0.25, 0.5])
              for (const y of [0, 0.07, 0.075, 0.125, 0.175, 0.25])
                points.push([x, y]);
          } else {
            for (let i = 0; i < 8; i++) {
              const cx = 0.25 + (i % 2) * 0.5,
                cy = (Math.floor(i / 2) + 0.5) / 4,
                phase = Math.PI * 2 * featureHash(i, 0, seed ^ 0x291d);
              for (const dx of [
                -0.34, -0.3275, -0.315, 0, 0.315, 0.3275, 0.34,
              ]) {
                const torn =
                  0.008 * Math.sin(Math.PI * 2 * dx * 12 + phase) +
                  0.004 * Math.sin(Math.PI * 2 * dx * 28 - phase);
                for (const inset of [0, 0.0125, 0.025])
                  for (const side of [-1, 1])
                    points.push([cx + dx, cy + side * (0.18 + torn - inset)]);
              }
              points.push([cx, cy + 0.125], [cx + 0.25, cy], [cx + 0.5, cy]);
            }
          }
          // Include fiber support boundaries, not only the macrostructure.
          for (let y = 0; y < 4; y++)
            for (let x = 0; x < 3; x++) {
              const cx = 0.3 + 0.4 * featureHash(x, y, seed ^ 0x2b71),
                cy = 0.3 + 0.4 * featureHash(x, y, seed ^ 0x5c39),
                angle = Math.PI * 2 * featureHash(x, y, seed ^ 0x6e13),
                length = 0.32 + 0.12 * featureHash(x, y, seed ^ 0x7a51);
              points.push(
                [
                  (x + cx + length * Math.cos(angle)) / 24,
                  (y + cy + length * Math.sin(angle)) / 32,
                ],
                [
                  (x + cx - 0.065 * Math.sin(angle)) / 24,
                  (y + cy + 0.065 * Math.cos(angle)) / 32,
                ],
              );
            }
          for (const [u, v] of points)
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
              [epsilon, epsilon],
              [epsilon, -epsilon],
            ]) {
              sample(u - du, v - dv, left);
              sample(u, v, center);
              sample(u + du, v + dv, right);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                expect(center[key]).toBeGreaterThanOrEqual(0);
                expect(center[key]).toBeLessThanOrEqual(1);
                expect(Math.abs(right[key] - left[key])).toBeLessThan(0.001);
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
              }
            }
        }
      },
    );
  });

  describe('fabricated metal relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });

    it('chainmail leaves opaque dielectric lining inside raised overlapping metal rings', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('chainmail', seed);
        const lining = empty(),
          wire = empty(),
          shoulder = empty(),
          overlap = empty();
        for (let row = 0; row < 8; row++) {
          const cx = 0.5 + (row % 2) * 0.5,
            cy = row + 0.5;
          sample(cx / 6, cy / 8, lining);
          sample((cx + 0.62) / 6, cy / 8, wire);
          sample((cx + 0.7) / 6, cy / 8, shoulder);
          expect(wire.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.height).toBeGreaterThan(lining.height);
          expect(wire.metallic).toBeGreaterThan(shoulder.metallic);
          expect(shoulder.metallic).toBeGreaterThan(lining.metallic);
          expect(lining.metallic).toBe(0);
          expect(wire.color).toBeGreaterThan(lining.color);
          expect(wire.roughness).toBeLessThan(lining.roughness);
          expect(wire.occlusion).toBeGreaterThan(lining.occlusion);
          const crossY = Math.sqrt(0.62 ** 2 - 0.5 ** 2);
          sample((cx + 0.5) / 6, (cy + crossY) / 8, overlap);
          expect(overlap.height).toBeGreaterThan(lining.height);
          expect(overlap.metallic).toBeGreaterThan(shoulder.metallic);
          const side = Math.sqrt(0.62 ** 2 - 0.12 ** 2);
          sample((cx + side) / 6, (cy + 0.12) / 8, wire);
          sample((cx + side) / 6, (cy - 0.12) / 8, shoulder);
          if (row % 2) expect(wire.height).toBeLessThan(shoulder.height);
          else expect(wire.height).toBeGreaterThan(shoulder.height);
        }
      }
    });

    it('rivets are discrete rounded heads above flat panels and recessed intersecting joints', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('rivetedmetal', seed);
        const head = empty(),
          shoulder = empty(),
          panel = empty(),
          joint = empty();
        for (let row = 0; row < 4; row++)
          for (let column = 0; column < 3; column++) {
            sample((column + 0.5) / 3, (row + 0.5) / 4, panel);
            for (const x of [0.12, 0.88])
              for (const y of [0.12, 0.88]) {
                sample((column + x) / 3, (row + y) / 4, head);
                sample((column + x + 0.03) / 3, (row + y) / 4, shoulder);
                expect(head.height).toBeGreaterThan(shoulder.height);
                expect(shoulder.height).toBeGreaterThan(panel.height);
                expect(head.roughness).toBeLessThan(panel.roughness);
              }
            for (const [x, y] of [
              [0, 0.5],
              [0.5, 0],
              [0, 0],
            ]) {
              sample((column + x) / 3, (row + y) / 4, joint);
              expect(panel.height).toBeGreaterThan(joint.height);
              expect(panel.occlusion).toBeGreaterThan(joint.occlusion);
            }
          }
      }
    });

    it('weld beads have repeated scallops above flatter sheet and darkened recessed toes', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('weldedmetal', seed);
        const bead = empty(),
          sheet = empty(),
          toe = empty();
        const beadHeights: number[] = [],
          sheetHeights: number[] = [];
        for (let i = 0; i < 128; i++) {
          const v = i / 128;
          sample(0, v, bead);
          sample(0.15, v, sheet);
          sample(0.035, v, toe);
          expect(bead.height).toBeGreaterThan(sheet.height);
          expect(bead.color).toBeGreaterThan(toe.color);
          expect(toe.occlusion).toBeLessThan(sheet.occlusion);
          expect(toe.roughness).toBeGreaterThan(sheet.roughness);
          beadHeights.push(bead.height);
          sheetHeights.push(sheet.height);
        }
        const range = (values: number[]) =>
          Math.max(...values) - Math.min(...values);
        expect(range(beadHeights)).toBeGreaterThan(10 * range(sheetHeights));
        for (let i = 0; i < 124; i++)
          expect(Math.abs(beadHeights[i + 4] - beadHeights[i])).toBeLessThan(
            range(beadHeights) / 4,
          );
      }
    });

    it.each(['chainmail', 'rivetedmetal', 'weldedmetal'] as const)(
      '%s keeps every field C1 at actual joints, shoulders, corners and overlaps',
      (kind) => {
        const center = empty(),
          left = empty(),
          right = empty();
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          const points: [number, number][] = [
            [0, 0],
            [1, 1],
            [0, 0.173],
            [0.317, 0],
          ];
          if (kind === 'chainmail') {
            for (let row = 0; row < 8; row++) {
              const cx = 0.5 + (row % 2) * 0.5,
                cy = row + 0.5;
              for (const radius of [0, 0.515, 0.62, 0.725])
                points.push([(cx + radius) / 6, cy / 8]);
              points.push(
                [(cx + 0.5) / 6, (cy + Math.sqrt(0.62 ** 2 - 0.5 ** 2)) / 8],
                [(cx + 0.25) / 6, (cy + 0.5) / 8],
                [cx / 6, (row + 1) / 8],
              );
            }
          } else if (kind === 'rivetedmetal') {
            for (const x of [0, 0.0225, 0.045, 0.12, 0.88, 0.955, 1])
              for (const y of [0, 0.0225, 0.045, 0.12, 0.88, 1])
                points.push([x / 3, y / 4]);
            for (const radius of [0, 0.026, 0.052])
              for (const angle of [0, Math.PI / 4, Math.PI / 2])
                points.push([
                  (0.12 + radius * Math.cos(angle)) / 3,
                  (0.12 + radius * Math.sin(angle)) / 4,
                ]);
          } else {
            let n = seed >>> 0;
            n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
            n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
            const phase = ((n ^ (n >>> 16)) >>> 0) / 4294967295;
            for (const scallop of [0, 1]) {
              const cycle = (scallop ? 1 : 1.5) - phase;
              const v = cycle / 32,
                width = 0.065 + 0.015 * scallop;
              for (const x of [0, width / 2, width, 0.15])
                points.push([x / 3, v], [-x / 3, v]);
            }
          }
          const epsilon = 1e-9;
          for (const [u, v] of points)
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
              [epsilon, epsilon],
            ]) {
              sample(u - du, v - dv, left);
              sample(u, v, center);
              sample(u + du, v + dv, right);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                expect(Math.abs(right[key] - left[key])).toBeLessThan(0.001);
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
              }
            }
        }
      },
    );
  });

  it('board-formed concrete has recessed horizontal timber joints and shallow long grain', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const joint = { ...face },
      along = { ...face },
      across = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('boardformedconcrete', seed);
      for (let row = 0; row < 8; row++) {
        const offset = (row % 2) * 0.25;
        sample(0.25 - offset, (row + 0.5) / 8, face);
        for (const [u, v] of [
          [0.25 - offset, row / 8],
          [-offset, (row + 0.5) / 8],
        ]) {
          sample(u, v, joint);
          expect(face.height).toBeGreaterThan(joint.height);
          expect(face.occlusion).toBeGreaterThan(joint.occlusion);
          expect(face.color).toBeGreaterThan(joint.color);
        }
      }
      let longitudinal = 0,
        transverse = 0;
      for (let i = 0; i < 128; i++) {
        const u = 0.1 + (0.3 * (i + 0.5)) / 128,
          v = 0.025 + (0.075 * (((i * 47) % 128) + 0.5)) / 128;
        sample(u, v, face);
        sample(u + 0.0002, v, along);
        sample(u, v + 0.0002, across);
        longitudinal += Math.abs(face.height - along.height);
        transverse += Math.abs(face.height - across.height);
      }
      expect(longitudinal).toBeGreaterThan(0);
      expect(transverse).toBeGreaterThan(longitudinal * 1.3);
    }
  });

  it('cast concrete ribs have broad crowns, rounded shoulders and fine lengthwise pores', () => {
    const crown: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crown },
      shoulder = { ...crown },
      other = { ...crown };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('ribbedconcrete', seed);
      let pores = 0;
      for (let rib = 0; rib < 12; rib++)
        for (const v of [0.137, 0.43, 0.791]) {
          sample((rib + 0.35) / 12, v, crown);
          sample((rib + 0.65) / 12, v, other);
          sample(rib / 12, v, trough);
          sample((rib + 0.21) / 12, v, shoulder);
          const relief = crown.height - trough.height;
          expect(relief).toBeGreaterThan(0);
          expect(Math.abs(crown.height - other.height)).toBeLessThan(
            relief / 20,
          );
          expect(shoulder.height - trough.height).toBeGreaterThan(relief * 0.4);
          expect(shoulder.height - trough.height).toBeLessThan(relief * 0.6);
          expect(crown.occlusion).toBe(other.occlusion);
          expect(shoulder.occlusion).toBeGreaterThan(trough.occlusion);
          expect(shoulder.occlusion).toBeLessThan(crown.occlusion);
          sample((rib + 0.35) / 12, v + 0.003, other);
          pores += Math.abs(crown.height - other.height);
          expect(Math.abs(crown.height - other.height)).toBeLessThan(
            relief / 20,
          );
        }
      expect(pores).toBeGreaterThan(0);
    }
  });

  it('split-face masonry staggers fractured block faces over smooth recessed mortar', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const joint = { ...face },
      other = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('splitfaceblock', seed);
      let faceRelief = 0;
      for (let row = 0; row < 8; row++)
        for (let column = 0; column < 4; column++) {
          const u = (column + 0.5 - (row % 2) * 0.5) / 4,
            v = (row + 0.5) / 8;
          sample(u, v, face);
          expect(face.mortar).toBe(0);
          sample(u + 0.04, v + 0.02, other);
          faceRelief += Math.abs(face.height - other.height);
          sample(u - 0.125, v, joint);
          expect(joint.mortar).toBe(1);
          expect(joint.height).toBeLessThan(face.height);
          expect(joint.occlusion).toBeLessThan(face.occlusion);
          expect(joint.roughness).toBeLessThan(face.roughness);
          // The head joint becomes a face halfway across the next row.
          sample(u - 0.125, v + 0.125, other);
          expect(other.mortar).toBe(0);
          expect(other.height).toBeGreaterThan(joint.height);
          sample(u, row / 8, other);
          expect(other.mortar).toBe(1);
          expect(other.height).toBe(joint.height);
          sample(u + 0.07, row / 8 + 0.002, other);
          expect(other.height).toBe(joint.height);
        }
      expect(faceRelief).toBeGreaterThan(0);
    }
  });

  it.each([
    [
      'boardformedconcrete',
      2,
      8,
      [0, 0.018, 0.5, 0.982, 1],
      [0, 0.055, 0.5, 0.945, 1],
    ],
    [
      'ribbedconcrete',
      12,
      1,
      [0, 0.12, 0.21, 0.3, 0.5, 0.7, 0.79, 0.88, 1],
      [0, 0.37, 1],
    ],
    [
      'splitfaceblock',
      4,
      8,
      [0, 0.04, 0.08, 0.12, 0.5, 0.88, 0.92, 0.96, 1],
      [0, 0.06, 0.105, 0.15, 0.5, 0.85, 0.895, 0.94, 1],
    ],
  ] as const)(
    '%s keeps every field C1 at actual shoulders, corners and offset row ownership',
    (kind, columns, rows, xs, ys) => {
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
      const epsilon = 1e-7 / Math.max(columns, rows);
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++)
            for (const x of xs)
              for (const y of ys) {
                const offset = kind === 'ribbedconcrete' ? 0 : (row % 2) * 0.5,
                  u = (column + x - offset) / columns,
                  v = (row + y) / rows;
                for (const [du, dv] of [
                  [epsilon, 0],
                  [0, epsilon],
                ]) {
                  sample(u - du, v - dv, a);
                  sample(u, v, center);
                  sample(u + du, v + dv, b);
                  sample(u - du / 2, v - dv / 2, halfA);
                  sample(u + du / 2, v + dv / 2, halfB);
                  for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                    expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
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
      }
    },
  );
  it('bread crust separates puffed toasted plates with dark recessed cracks', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const plate: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crack = { ...plate },
      shoulder = { ...plate },
      left = { ...plate },
      right = { ...plate };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('breadcrust', seed);
      for (const [column, row] of [
        [0, 0],
        [3, 4],
        [6, 6],
      ]) {
        const px =
            column + 0.36 + 0.28 * featureHash(column, row, seed ^ 0x24b7),
          py = row + 0.36 + 0.28 * featureHash(column, row, seed ^ 0x59d1);
        const nx =
            column +
            1 +
            0.36 +
            0.28 * featureHash((column + 1) % 7, row, seed ^ 0x24b7),
          ny =
            row +
            0.36 +
            0.28 * featureHash((column + 1) % 7, row, seed ^ 0x59d1);
        const mx = (px + nx) / 2,
          my = (py + ny) / 2;
        sample(px / 7, py / 7, plate);
        sample(mx / 7, my / 7, crack);
        sample((0.3 * px + 0.7 * mx) / 7, (0.3 * py + 0.7 * my) / 7, shoulder);
        expect(plate.height).toBeGreaterThan(shoulder.height);
        expect(shoulder.height).toBeGreaterThan(crack.height);
        expect(plate.color).toBeGreaterThan(crack.color);
        expect(plate.occlusion).toBeGreaterThan(crack.occlusion);
        const distance = Math.hypot(nx - px, ny - py),
          ux = (nx - px) / distance,
          uy = (ny - py) / distance;
        // Both cached polygon owners meet the same bisector. Check each
        // compact shoulder endpoint, not merely the cell-grid boundaries.
        const epsilon = 1e-8;
        for (const inset of [-0.165, -0.025, 0, 0.025, 0.165]) {
          const u = (mx + inset * ux) / 7,
            v = (my + inset * uy) / 7;
          sample(u - epsilon * ux, v - epsilon * uy, left);
          sample(u, v, shoulder);
          sample(u + epsilon * ux, v + epsilon * uy, right);
          for (const key of Object.keys(plate) as (keyof SurfaceSample)[])
            expect(
              Math.abs(right[key] - 2 * shoulder[key] + left[key]) / epsilon,
            ).toBeLessThan(0.001);
        }
      }
    }
  });

  it('wafer has recessed square pocket floors beneath continuous orthogonal ribs', () => {
    const floor: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rib = { ...floor },
      crossing = { ...floor },
      wall = { ...floor };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wafer', seed);
      for (const [column, row] of [
        [0, 0],
        [5, 7],
        [11, 11],
      ]) {
        sample((column + 0.5) / 12, (row + 0.5) / 12, floor);
        sample(column / 12, row / 12, crossing);
        for (const axis of [0, 1]) {
          sample(
            (column + (axis === 0 ? 0 : 0.5)) / 12,
            (row + (axis === 1 ? 0 : 0.5)) / 12,
            rib,
          );
          sample(
            (column + (axis === 0 ? 0.15 : 0.5)) / 12,
            (row + (axis === 1 ? 0.15 : 0.5)) / 12,
            wall,
          );
          expect(crossing.height).toBeGreaterThan(wall.height);
          expect(rib.height).toBeGreaterThan(wall.height);
          expect(wall.height).toBeGreaterThan(floor.height);
          expect(rib.occlusion).toBeGreaterThan(floor.occlusion);
          // Baked microtexture must not turn the crossing into woven over/under.
          expect(Math.abs(crossing.height - rib.height)).toBeLessThan(
            (rib.height - floor.height) * 0.03,
          );
        }
      }
    }
  });

  it('chocolate keeps broad segment tops flat above smoothly descending scored shoulders', () => {
    const top: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const out = { ...top };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('chocolate', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 1],
        [3, 3],
      ]) {
        sample((column + 0.5) / 4, (row + 0.5) / 4, top);
        for (const x of [0.16, 0.3, 0.5, 0.7, 0.84])
          for (const y of [0.16, 0.5, 0.84]) {
            sample((column + x) / 4, (row + y) / 4, out);
            expect(out.height).toBe(top.height);
          }
        for (const axis of [0, 1]) {
          let previous = top.height;
          for (const edge of [0.12, 0.09, 0.06, 0.02]) {
            sample(
              (column + (axis === 0 ? edge : 0.5)) / 4,
              (row + (axis === 1 ? edge : 0.5)) / 4,
              out,
            );
            expect(out.height).toBeLessThan(previous);
            previous = out.height;
          }
          expect(out.occlusion).toBeLessThan(top.occlusion);
          expect(out.color).toBeLessThan(top.color);
        }
      }
    }
  });
  it.each(['wafer', 'chocolate'] as const)(
    '%s has differentiable corners where orthogonal mold shoulders meet',
    (kind) => {
      const center: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const left = { ...center },
        right = { ...center };
      const cells = kind === 'wafer' ? 12 : 4,
        edges = kind === 'wafer' ? [0.11, 0.15, 0.19] : [0.06, 0.09, 0.12],
        epsilon = 1e-8 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const edge of edges)
          for (const sx of [1, -1])
            for (const sy of [1, -1]) {
              const u = (sx * edge) / cells,
                v = (sy * edge) / cells;
              sample(u - epsilon, v, left);
              sample(u, v, center);
              sample(u + epsilon, v, right);
              for (const key of ['height', 'occlusion'] as const)
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
            }
      }
    },
  );
  describe('sports surface geometry', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });

    it('basketball has continuous dark recessed panel seams beneath fine rounded pebbles', () => {
      const seam = empty(),
        field = empty(),
        crown = empty(),
        foot = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('basketball', seed);
        for (const v of [0.125, 0.375, 0.625, 0.875]) {
          const u = -0.06 * Math.sin(2 * Math.PI * v);
          sample(u, v, seam);
          sample(u + 0.08, v, field);
          expect(field.color).toBeGreaterThan(seam.color);
          expect(field.height).toBeGreaterThan(seam.height);
          expect(field.occlusion).toBeGreaterThan(seam.occlusion);
        }
        // This cell is inside a panel for every possible feature jitter.
        const column = 4,
          row = 4,
          u =
            (column + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x19a7)) /
            36,
          v = (row + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x5c23)) / 36;
        sample(u, v, crown);
        for (const direction of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
          sample(
            u + (Math.cos(direction) * 0.4) / 36,
            v + (Math.sin(direction) * 0.4) / 36,
            foot,
          );
          expect(crown.height).toBeGreaterThan(foot.height);
        }
      }
    });

    it('tennis felt surrounds a continuous pale curving recessed seam without a woven crossing', () => {
      const seam = empty(),
        field = empty(),
        fiber = empty(),
        beside = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('tennisball', seed);
        for (let i = 0; i <= 48; i++) {
          const u = i / 48,
            v = 0.25 + 0.19 * Math.sin(2 * Math.PI * u);
          for (const offset of [0, 0.5]) {
            sample(u, v + offset, seam);
            sample(u, v + offset + 0.08, field);
            expect(seam.color).toBeGreaterThan(field.color);
            expect(seam.height).toBeLessThan(field.height);
            expect(seam.roughness).toBeLessThan(field.roughness);
          }
        }
        const column = 3,
          row = 3,
          u =
            (column + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x19a7)) /
            24,
          v = (row + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x5c23)) / 24,
          angle = 2 * Math.PI * featureHash(column, row, seed ^ 0x37b1);
        sample(u, v, fiber);
        sample(
          u - (Math.sin(angle) * 0.12) / 24,
          v + (Math.cos(angle) * 0.12) / 24,
          beside,
        );
        expect(fiber.height).toBeGreaterThan(beside.height);
      }
    });

    it('golf dimples are regular circular concave bowls meeting smooth rims and flat land', () => {
      const center = empty(),
        out = empty(),
        land = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('golfball', seed),
          offsetU = featureHash(0, 0, seed ^ 0x29b7),
          offsetV = featureHash(0, 0, seed ^ 0x61d3);
        for (const [column, row] of [
          [0, 0],
          [4, 7],
          [9, 9],
        ]) {
          const u = (column + offsetU + 0.5) / 10,
            v = (row + offsetV + 0.5) / 10;
          sample(u, v, center);
          sample(u + 0.047, v, land);
          for (let direction = 0; direction < 12; direction++) {
            const angle = (direction * Math.PI) / 6;
            let previous = center.height;
            for (const radius of [0.1, 0.2, 0.3, 0.4, 0.41]) {
              sample(
                u + (Math.cos(angle) * radius) / 10,
                v + (Math.sin(angle) * radius) / 10,
                out,
              );
              expect(out.height).toBeGreaterThan(previous);
              previous = out.height;
              const radialHeight = out.height;
              sample(u + radius / 10, v, out);
              expect(out.height).toBeCloseTo(radialHeight, 12);
            }
            for (const radius of [0.42, 0.46, 0.49]) {
              sample(
                u + (Math.cos(angle) * radius) / 10,
                v + (Math.sin(angle) * radius) / 10,
                out,
              );
              expect(out.height).toBe(land.height);
            }
          }
          sample(u + 0.02, v, out);
          expect(out.height - center.height).toBeLessThan(
            land.height - out.height,
          );
          expect(center.occlusion).toBeLessThan(land.occlusion);
        }
      }
    });

    it.each(['basketball', 'tennisball', 'golfball'] as const)(
      '%s has differentiable feature centers, shoulders and support boundaries',
      (kind) => {
        const center = empty(),
          left = empty(),
          right = empty(),
          epsilon =
            1e-8 /
            (kind === 'basketball' ? 36 : kind === 'tennisball' ? 24 : 10);
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          const points: [number, number][] = [];
          if (kind === 'basketball') {
            const v = 0.125;
            for (const threshold of [0, 0.035, 0.08, 0.14])
              points.push([
                (Math.asin(threshold) / (2 * Math.PI) -
                  0.12 * Math.sin(2 * Math.PI * v)) /
                  2,
                v,
              ]);
            const u = (4.35 + 0.3 * featureHash(4, 4, seed ^ 0x19a7)) / 36,
              pv = (4.35 + 0.3 * featureHash(4, 4, seed ^ 0x5c23)) / 36,
              radius = 0.34 + 0.04 * featureHash(4, 4, seed ^ 0x73d9);
            points.push([u, pv], [u + radius / 36, pv]);
          } else if (kind === 'tennisball') {
            const u = 0.173;
            for (const threshold of [0, 0.025, 0.06, 0.1])
              points.push([
                u,
                0.25 +
                  0.19 * Math.sin(2 * Math.PI * u) +
                  Math.asin(threshold) / (2 * Math.PI),
              ]);
            const fu = (3.35 + 0.3 * featureHash(3, 3, seed ^ 0x19a7)) / 24,
              fv = (3.35 + 0.3 * featureHash(3, 3, seed ^ 0x5c23)) / 24,
              angle = 2 * Math.PI * featureHash(3, 3, seed ^ 0x37b1);
            points.push(
              [fu, fv],
              [
                fu - (Math.sin(angle) * 0.065) / 24,
                fv + (Math.cos(angle) * 0.065) / 24,
              ],
            );
          } else {
            const u = (0.5 + featureHash(0, 0, seed ^ 0x29b7)) / 10,
              v = (0.5 + featureHash(0, 0, seed ^ 0x61d3)) / 10;
            for (const radius of [0, 0.2, 0.41, 0.5])
              points.push([u + radius / 10, v]);
          }
          for (const [u, v] of points)
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
            ]) {
              sample(u - du, v - dv, left);
              sample(u, v, center);
              sample(u + du, v + dv, right);
              for (const key of Object.keys(center) as (keyof SurfaceSample)[])
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
            }
        }
      },
    );
  });

  it('studded rubber has circular flat crowns and rounded descending shoulders', () => {
    const out: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('studdedrubber', seed);
      for (const [column, row] of [
        [0, 0],
        [3, 4],
        [5, 5],
      ]) {
        const u = (column + 0.5) / 6,
          v = (row + 0.5) / 6;
        sample(u, v, out);
        const crown = out.height;
        for (let direction = 0; direction < 8; direction++) {
          const angle = (direction * Math.PI) / 4;
          const at = (radius: number): number => {
            sample(
              u + (Math.cos(angle) * radius) / 6,
              v + (Math.sin(angle) * radius) / 6,
              out,
            );
            return out.height;
          };
          const plateauDifference = Math.abs(at(0.2) - crown);
          const upper = at(0.27),
            middle = at(0.3),
            lower = at(0.33),
            base = at(0.4);
          expect(plateauDifference).toBeLessThan((crown - base) * 0.01);
          expect(crown).toBeGreaterThan(upper);
          expect(upper).toBeGreaterThan(middle);
          expect(middle).toBeGreaterThan(lower);
          expect(lower).toBeGreaterThan(base);
          // Both shoulder joins flatten, unlike a hard bevel or domed stud.
          for (const join of [0.24, 0.36]) {
            const h = at(join),
              left = at(join - 0.0001),
              right = at(join + 0.0001);
            expect(Math.abs(right - 2 * h + left) / 0.0001).toBeLessThan(0.03);
          }
        }
      }
    }
  });

  it('grooved rubber keeps broad level crowns along narrow parallel recesses', () => {
    const out: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('groovedrubber', seed);
      for (const column of [0, 5, 11]) {
        for (const v of [0.13, 0.47, 0.89]) {
          const at = (across: number): number => {
            sample((column + 0.5 + across) / 12, v, out);
            return out.height;
          };
          const crown = at(0),
            shoulder = at(0.385),
            floor = at(0.48),
            flatTolerance = (crown - floor) * 0.01;
          for (const across of [-0.3, -0.15, 0.15, 0.3])
            expect(Math.abs(at(across) - crown)).toBeLessThan(flatTolerance);
          expect(crown).toBeGreaterThan(shoulder);
          expect(shoulder).toBeGreaterThan(floor);
          expect(Math.abs(at(0.46) - floor)).toBeLessThan(flatTolerance);
          sample((column + 0.5) / 12, v + 0.19, out);
          expect(Math.abs(out.height - crown)).toBeLessThan(flatTolerance);
          for (const join of [0.32, 0.45]) {
            const h = at(join),
              left = at(join - 0.0001),
              right = at(join + 0.0001);
            expect(Math.abs(right - 2 * h + left) / 0.0001).toBeLessThan(0.03);
          }
        }
      }
    }
  });

  it('recycled rubber has fine lighter compressed granules above dark binder', () => {
    const out: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('recycledrubber', seed);
      const heights: number[] = [];
      let low = Infinity,
        high = -Infinity,
        binderColor = 0,
        granuleColor = 0;
      // Resolve the fine aggregate along a physical tile-wide transect.
      for (let step = 0; step <= 3072; step++) {
        sample(step / 3072, 0.371, out);
        heights.push(out.height);
        if (out.height < low) {
          low = out.height;
          binderColor = out.color;
        }
        if (out.height > high) {
          high = out.height;
          granuleColor = out.color;
        }
      }
      expect(high).toBeGreaterThan(low);
      expect(granuleColor).toBeGreaterThan(binderColor);
      const threshold = low + (high - low) * 0.6;
      let run = 0,
        longest = 0;
      for (const height of heights) {
        run = height > threshold ? run + 1 : 0;
        longest = Math.max(longest, run);
      }
      // Dense fine crumbs, not isolated tile-scale terrazzo/asphalt stones.
      expect(longest / 3072).toBeLessThan(6 / 48);
    }
  });

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
    'cactus',
    'pinecone',
    'corncob',
    'breadcrust',
    'wafer',
    'chocolate',
    'boardformedconcrete',
    'ribbedconcrete',
    'splitfaceblock',
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
        kind === 'cactus' || kind === 'pinecone' || kind === 'corncob'
          ? 12
          : kind === 'crackleglaze'
            ? 16
            : kind === 'flutedceramic'
              ? 96
              : kind === 'fishscales'
                ? 10
                : kind === 'tortoiseshell'
                  ? 6
                  : kind === 'feathers'
                    ? 8
                    : kind === 'breadcrust'
                      ? 7
                      : kind === 'wafer'
                        ? 12
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
    ['studdedrubber', 6],
    ['groovedrubber', 12],
    ['recycledrubber', 48],
    ['basketball', 36],
    ['tennisball', 24],
    ['golfball', 10],
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

  it.each([
    'metal',
    'basketball',
    'tennisball',
    'golfball',
    'boardformedconcrete',
    'ribbedconcrete',
    'splitfaceblock',
  ] as const)(
    'borrows %s maps across independent materials and never takes ownership of overrides',
    async (kind) => {
      const preset = await ProceduralMaterial.create(kind, { size: 32 });
      expect(preset.material.metallic).toBe(kind === 'metal' ? 1 : 0);
      expect(preset.material.alphaMode).toBe('OPAQUE');
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
      expect(() => preset.createMaterial({ roughness: -1 })).toThrow(
        RangeError,
      );
      expect(
        decoded.every((bitmap) => bitmap.close.mock.calls.length === 0),
      ).toBe(true);
      preset.destroy();
      preset.destroy();
      expect(preset.destroyed).toBe(true);
      expect(
        Object.values(preset.textures).every((texture) => texture.destroyed),
      ).toBe(true);
      for (const bitmap of decoded)
        expect(bitmap.close).toHaveBeenCalledTimes(1);
      expect(external.destroyed).toBe(false);
      expect(() => preset.createMaterial()).toThrow('destroyed');
      external.destroy();
    },
  );
});
