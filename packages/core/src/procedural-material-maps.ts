import { proceduralMaterialPresets } from '../../../src/data/materials.js';
import type { ProceduralMaterialKind } from './procedural-material.js';
import { hypot3 } from '../../math/src/hypot.js';

const TAU = Math.PI * 2;
const clamp = (v: number): number => Math.max(0, Math.min(1, v));
const fract = (v: number): number => v - Math.floor(v);
const smooth = (v: number): number => v * v * (3 - 2 * v);
const byte = (v: number): number => Math.round(clamp(v) * 255);

function hash(x: number, y: number, seed: number): number {
  let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/** Periodic value noise: every lattice coordinate wraps, including interpolation neighbors. */
function noise(
  u: number,
  v: number,
  nx: number,
  ny: number,
  seed: number,
): number {
  const x = fract(u) * nx,
    y = fract(v) * ny;
  const ix = Math.floor(x),
    iy = Math.floor(y),
    sx = smooth(x - ix),
    sy = smooth(y - iy);
  const a = hash(ix, iy, seed),
    b = hash((ix + 1) % nx, iy, seed);
  const c = hash(ix, (iy + 1) % ny, seed),
    d = hash((ix + 1) % nx, (iy + 1) % ny, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/** Immutable periodic lattice: architectural seed work is paid once per sampler. */
function cachedNoise(nx: number, ny: number, seed: number) {
  const values = new Float64Array(nx * ny);
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++) values[y * nx + x] = hash(x, y, seed);
  return (u: number, v: number): number => {
    const x = fract(u) * nx,
      y = fract(v) * ny,
      ix = Math.floor(x),
      iy = Math.floor(y),
      sx = smooth(x - ix),
      sy = smooth(y - iy),
      nextX = (ix + 1) % nx,
      nextY = ((iy + 1) % ny) * nx;
    const a = values[iy * nx + ix],
      b = values[iy * nx + nextX],
      c = values[nextY + ix],
      d = values[nextY + nextX];
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  };
}

export interface SurfaceSample {
  color: number;
  height: number;
  roughness: number;
  occlusion: number;
  mortar: number;
  metallic: number;
}

/** Distance to the nearest wrapped cell feature, in cell units. */
function wrappedFeature(
  u: number,
  v: number,
  cells: number,
  seed: number,
): number {
  const ix = Math.floor(u * cells);
  const iy = Math.floor(v * cells);
  let best = 4;
  for (let oy = -1; oy <= 1; oy++)
    for (let ox = -1; ox <= 1; ox++) {
      const cx = ix + ox;
      const cy = iy + oy;
      const wx = ((cx % cells) + cells) % cells;
      const wy = ((cy % cells) + cells) % cells;
      const px = (cx + hash(wx, wy, seed)) / cells;
      const py = (cy + hash(wx, wy, seed ^ 0x9e37)) / cells;
      const dx = u - px;
      const dy = v - py;
      const d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
  return Math.sqrt(best) * cells;
}

/** Internal CPU field sampler; coordinates are periodic in both directions. */
export function createSurfaceSampler(
  kind: ProceduralMaterialKind,
  seed: number,
): (u: number, v: number, out: SurfaceSample) => void {
  const preset = proceduralMaterialPresets[kind];
  const phase = hash(0, 0, seed) * TAU;
  const motifAngle = kind === 'encaustictiles' ? 0.12 * Math.sin(phase) : 0;
  const motifCos = Math.cos(motifAngle),
    motifSin = Math.sin(motifAngle);
  const municipal =
    kind === 'tactilepaving' || kind === 'roadmarking' || kind === 'draincover';
  const municipalGrain = municipal ? cachedNoise(96, 96, seed ^ 0x2a71) : null;
  const fungal =
    kind === 'mushroomgills' || kind === 'morel' || kind === 'bracketfungus';
  const fungalGrain = fungal ? cachedNoise(80, 80, seed ^ 0x6d39) : null;
  const rind =
    kind === 'pineapple' || kind === 'strawberry' || kind === 'lychee';
  const rindGrain = rind ? cachedNoise(96, 96, seed ^ 0x615b) : null;
  const rindColumns =
    kind === 'strawberry'
      ? proceduralMaterialPresets.strawberry.columns
      : kind === 'lychee'
        ? proceduralMaterialPresets.lychee.columns
        : proceduralMaterialPresets.pineapple.cells;
  const rindRows =
    kind === 'strawberry'
      ? proceduralMaterialPresets.strawberry.rows
      : kind === 'lychee'
        ? proceduralMaterialPresets.lychee.rows
        : rindColumns;
  const rindStride = kind === 'strawberry' ? 4 : kind === 'lychee' ? 8 : 1;
  const rindCells = rind
    ? new Float64Array(rindColumns * rindRows * rindStride)
    : null;
  if (rindCells)
    for (let y = 0; y < rindRows; y++)
      for (let x = 0; x < rindColumns; x++) {
        const offset = (y * rindColumns + x) * rindStride;
        if (kind === 'strawberry') {
          const angle = 0.3 * (hash(x, y, seed ^ 0x31a7) - 0.5);
          rindCells[offset] = 0.42 + 0.16 * hash(x, y, seed ^ 0x293d);
          rindCells[offset + 1] = 0.42 + 0.16 * hash(x, y, seed ^ 0x473b);
          rindCells[offset + 2] = Math.cos(angle);
          rindCells[offset + 3] = Math.sin(angle);
        } else if (kind === 'lychee') {
          const p = proceduralMaterialPresets.lychee;
          for (let side = 0; side < 6; side++)
            rindCells[offset + side] =
              p.edge +
              p.jitter * (2 * hash(x, y, seed ^ (0x371b + side * 0x9e37)) - 1);
          rindCells[offset + 6] = 0.24 * (hash(x, y, seed ^ 0x293d) - 0.5);
          rindCells[offset + 7] = 0.24 * (hash(x, y, seed ^ 0x473b) - 0.5);
        } else rindCells[offset] = hash(x, y, seed ^ 0x371b);
      }
  const fanPreset =
    kind === 'mushroomgills'
      ? proceduralMaterialPresets.mushroomgills
      : proceduralMaterialPresets.bracketfungus;
  // Fan centers lie in [.4,.6]^2. Including the displaced attachment,
  // support fits radius .58*(.55+1.35/.91) < 1.18 cell units.
  // An omitted 3x3 neighbor is >= 1.4 away on one axis, even for hash == 1.
  const fungalFans =
    kind === 'mushroomgills' || kind === 'bracketfungus'
      ? new Float64Array(fanPreset.cells * fanPreset.cells * 7)
      : null;
  if (fungalFans)
    for (let y = 0; y < fanPreset.cells; y++)
      for (let x = 0; x < fanPreset.cells; x++) {
        const offset = (y * fanPreset.cells + x) * 7,
          angle = 0.5 * (hash(x, y, seed ^ 0x2d41) - 0.5);
        fungalFans[offset] = 0.4 + 0.2 * hash(x, y, seed ^ 0x17c3);
        fungalFans[offset + 1] = 0.4 + 0.2 * hash(x, y, seed ^ 0x59b7);
        fungalFans[offset + 2] = Math.cos(angle) / fanPreset.scale;
        fungalFans[offset + 3] = Math.sin(angle) / fanPreset.scale;
        fungalFans[offset + 4] = TAU * hash(x, y, seed ^ 0x73a9);
        fungalFans[offset + 5] = 0.5 + 0.1 * hash(x, y, seed ^ 0x3b51);
        fungalFans[offset + 6] = 0.85 + 0.15 * hash(x, y, seed ^ 0x4f27);
      }
  const morelPreset = proceduralMaterialPresets.morel;
  // The metric's minimum stretch is >= .85-.15 = .70, so support
  // radius <= 1.6/.70 < 2.29. Omitted 5x5 centers are >= 2.32 away.
  // The current cell's center is <= .68 per axis away; even the largest
  // metric gives length < 1.20 < 1.6, hence the weight sum is never zero.
  const morelChambers =
    kind === 'morel'
      ? new Float64Array(morelPreset.columns * morelPreset.rows * 5)
      : null;
  if (morelChambers)
    for (let y = 0; y < morelPreset.rows; y++)
      for (let x = 0; x < morelPreset.columns; x++) {
        const offset = (y * morelPreset.columns + x) * 5,
          stretch = 0.85 + 0.3 * hash(x, y, seed ^ 0x61d7);
        morelChambers[offset] =
          0.5 + morelPreset.jitter * (2 * hash(x, y, seed ^ 0x23b9) - 1);
        morelChambers[offset + 1] =
          0.5 + morelPreset.jitter * (2 * hash(x, y, seed ^ 0x47a1) - 1);
        morelChambers[offset + 2] = stretch / morelPreset.support;
        morelChambers[offset + 3] = 1 / (stretch * morelPreset.support);
        morelChambers[offset + 4] =
          (0.3 * (hash(x, y, seed ^ 0x75c3) - 0.5)) / morelPreset.support;
      }
  const pavingTone =
    kind === 'tactilepaving'
      ? cachedNoise(
          proceduralMaterialPresets.tactilepaving.tiles,
          proceduralMaterialPresets.tactilepaving.tiles,
          seed ^ 0x5b93,
        )
      : null;
  const paintWear =
    kind === 'roadmarking'
      ? cachedNoise(
          proceduralMaterialPresets.roadmarking.wearColumns,
          proceduralMaterialPresets.roadmarking.wearRows,
          seed ^ 0x63d1,
        )
      : null;
  const animalSkin =
    kind === 'elephanthide' ||
    kind === 'ostrichleather' ||
    kind === 'sharkskin';
  const skinGrain = animalSkin ? cachedNoise(96, 96, seed ^ 0x61b3) : null;
  const hideWarp =
    kind === 'elephanthide' ? cachedNoise(4, 4, seed ^ 0x2d79) : null;
  // Follicles have radius <= 0.25 and centers in [0.25, 0.75]: disjoint
  // interiors, fully contained in each owner cell (including hash == 1).
  const follicles =
    kind === 'ostrichleather' ? new Float64Array(6 * 6 * 3) : null;
  if (follicles)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        const offset = (y * 6 + x) * 3;
        follicles[offset] = 0.25 + 0.5 * hash(x, y, seed ^ 0x1b37);
        follicles[offset + 1] = 0.25 + 0.5 * hash(x, y, seed ^ 0x4f91);
        follicles[offset + 2] = 1 / (0.2 + 0.05 * hash(x, y, seed ^ 0x73a5));
      }
  const denticles = kind === 'sharkskin' ? new Float64Array(18 * 24) : null;
  if (denticles)
    for (let y = 0; y < 24; y++)
      for (let x = 0; x < 18; x++)
        denticles[y * 18 + x] = hash(x, y, seed ^ 0x3d67);
  const treeBark =
    kind === 'birchbark' || kind === 'palmtrunk' || kind === 'sycamorebark';
  const treeGrain = treeBark ? cachedNoise(64, 64, seed ^ 0x54b7) : null;
  const treeCloud =
    treeBark && kind !== 'sycamorebark'
      ? cachedNoise(4, 4, seed ^ 0x31d9)
      : null;
  const palmFibers =
    kind === 'palmtrunk' ? cachedNoise(96, 8, seed ^ 0x27b1) : null;
  // Birch marks fit within 0.43 x 0.075 cells of centers in [0.2, 0.8].
  // Sycamore's modulated quadratic has radius <= 0.85/sqrt(0.84) < 0.93
  // around centers in [0.25, 0.75]. Thus a wrapped 3x3 lookup is complete:
  // any omitted cell is at least 1.2 / 1.25 cells away on one axis.
  const barkColumns = kind === 'birchbark' ? 7 : 4,
    barkRows = kind === 'birchbark' ? 10 : 4;
  // Birch needs a strength slot; sycamore needs phase and tone slots.
  const barkStride = kind === 'birchbark' ? 5 : 6;
  const barkMarks =
    kind === 'birchbark' || kind === 'sycamorebark'
      ? new Float64Array(barkColumns * barkRows * barkStride)
      : null;
  if (barkMarks)
    for (let y = 0; y < barkRows; y++)
      for (let x = 0; x < barkColumns; x++) {
        const offset = (y * barkColumns + x) * barkStride,
          birch = kind === 'birchbark';
        barkMarks[offset] = 0.25 + 0.5 * hash(x, y, seed ^ 0x19d3);
        barkMarks[offset + 1] = 0.25 + 0.5 * hash(x, y, seed ^ 0x67b9);
        barkMarks[offset + 2] =
          (birch ? 0.2 : 0.72) +
          (birch ? 0.23 : 0.13) * hash(x, y, seed ^ 0x43a1);
        barkMarks[offset + 3] =
          (birch ? 0.035 : 0.72) +
          (birch ? 0.04 : 0.13) * hash(x, y, seed ^ 0x75d1);
        barkMarks[offset + 4] = birch
          ? 0.65 + 0.35 * hash(x, y, seed ^ 0x2d71)
          : TAU * hash(x, y, seed ^ 0x39b7);
        // Hash includes 1; it must still select the highest valid tone.
        if (!birch)
          barkMarks[offset + 5] =
            Math.min(2, Math.floor(3 * hash(x, y, seed ^ 0x51a3))) * 0.32 +
            0.18;
      }
  // Each scar stays within [0.02, 1.16] row units, including wander and lip.
  // Only the current row and its predecessor can contribute; both compact
  // profiles vanish before the wrapped-distance cut.
  const palmScars = kind === 'palmtrunk' ? new Float64Array(9 * 4) : null;
  if (palmScars)
    for (let y = 0; y < 9; y++) {
      const offset = y * 4;
      palmScars[offset] = (y + 0.2 + 0.6 * hash(0, y, seed ^ 0x17a9)) / 9;
      palmScars[offset + 1] = 0.006 + 0.005 * hash(0, y, seed ^ 0x69b3);
      palmScars[offset + 2] = TAU * hash(0, y, seed ^ 0x41d7);
      palmScars[offset + 3] = 0.7 + 0.3 * hash(0, y, seed ^ 0x53b1);
    }
  const petal =
    kind === 'rosepetal' || kind === 'lilypetal' || kind === 'fritillarypetal';
  const petalWander =
    kind === 'rosepetal' || kind === 'fritillarypetal'
      ? cachedNoise(4, 4, seed ^ 0x27d9)
      : null;
  const petalGrain = petal ? cachedNoise(48, 48, seed ^ 0x63b1) : null;
  const petalColumns = kind === 'rosepetal' ? 48 : 9,
    petalRows = kind === 'rosepetal' ? 48 : 7;
  // Compact supports extend less than 0.55 cells from centers inside their
  // cells, so the wrapped 3x3 lookup includes every contributor. Cubic
  // shoulders and bounded pigment blending keep overlaps smooth.
  const petalMarks =
    kind === 'rosepetal' || kind === 'lilypetal'
      ? new Float64Array(petalColumns * petalRows * 8)
      : null;
  if (petalMarks)
    for (let y = 0; y < petalRows; y++)
      for (let x = 0; x < petalColumns; x++) {
        const offset = (y * petalColumns + x) * 8,
          rose = kind === 'rosepetal',
          margin = rose ? 0.3 : 0.15,
          spread = rose ? 0.4 : 0.7,
          angle = (rose ? 1 : 0.22) * (hash(x, y, seed ^ 0x59c3) - 0.5);
        petalMarks[offset] = margin + spread * hash(x, y, seed ^ 0x31a7);
        petalMarks[offset + 1] = margin + spread * hash(x, y, seed ^ 0x47e9);
        petalMarks[offset + 2] = Math.cos(angle);
        petalMarks[offset + 3] = Math.sin(angle);
        petalMarks[offset + 4] =
          1 / (rose ? 0.38 + 0.07 * hash(x, y, seed ^ 0x6d13) : 0.13);
        petalMarks[offset + 5] =
          1 / (rose ? 0.38 + 0.07 * hash(x, y, seed ^ 0x1b57) : 0.43);
        petalMarks[offset + 6] =
          !rose && hash(x, y, seed ^ 0x2b97) < 0.24
            ? 0
            : 0.65 + 0.35 * hash(x, y, seed ^ 0x71a9);
        petalMarks[offset + 7] = rose
          ? 0
          : 0.5 * (hash(x, y, seed ^ 0x39d5) - 0.5);
      }
  const fruitSkin =
    kind === 'cantaloupe' || kind === 'dragonfruit' || kind === 'kiwiskin';
  const fruitGrain = fruitSkin ? cachedNoise(64, 64, seed ^ 0x45e7) : null;
  const rindWarp =
    kind === 'cantaloupe' ? cachedNoise(4, 4, seed ^ 0x71a3) : null;
  // Smoothly warped shared bisectors enclose rind islands. The complementary
  // cork network is actual raised relief, including its rounded junctions.
  const rindIslands =
    kind === 'cantaloupe' ? new Float64Array(7 * 7 * 26) : null;
  if (rindIslands)
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const offset = (y * 7 + x) * 26,
          px = 0.25 + 0.5 * hash(x, y, seed ^ 0x32b1),
          py = 0.25 + 0.5 * hash(x, y, seed ^ 0x67d9);
        rindIslands[offset] = px;
        rindIslands[offset + 1] = py;
        let plane = offset + 2;
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const wx = (x + ox + 7) % 7,
              wy = (y + oy + 7) % 7,
              dx = ox + 0.25 + 0.5 * hash(wx, wy, seed ^ 0x32b1) - px,
              dy = oy + 0.25 + 0.5 * hash(wx, wy, seed ^ 0x67d9) - py,
              inverse = 1 / Math.sqrt(dx * dx + dy * dy);
            rindIslands[plane++] = dx * inverse;
            rindIslands[plane++] = dy * inverse;
            rindIslands[plane++] = 0.5 / inverse;
          }
      }
  // Bracts are staggered, tilted, asymmetric tapered lenses. Their compact
  // supports fit within the 3x3 lookup, even across row staggering and seams.
  const bractWidthInverse = 1 / 0.34,
    bractLengthInverse = 1 / 0.7,
    hairLengthSquaredInverse = 1 / (0.43 * 0.43),
    hairWidthSquaredInverse = 1 / (0.075 * 0.075),
    follicleSquaredInverse = 1 / (0.12 * 0.12);
  const bracts = kind === 'dragonfruit' ? new Float64Array(4 * 6 * 5) : null;
  if (bracts)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 4; x++) {
        const offset = (y * 4 + x) * 5,
          angle = 0.24 * (hash(x, y, seed ^ 0x53a9) - 0.5);
        bracts[offset] =
          0.25 + 0.5 * (y % 2) + 0.12 * (hash(x, y, seed ^ 0x3c71) - 0.5);
        bracts[offset + 1] = 0.5 + 0.12 * (hash(x, y, seed ^ 0x6d13) - 0.5);
        bracts[offset + 2] = Math.cos(angle);
        bracts[offset + 3] = Math.sin(angle);
        bracts[offset + 4] = 0.85 + 0.15 * hash(x, y, seed ^ 0x29e7);
      }
  const kiwiHairs = kind === 'kiwiskin' ? new Float64Array(36 * 36 * 5) : null;
  if (kiwiHairs)
    for (let y = 0; y < 36; y++)
      for (let x = 0; x < 36; x++) {
        const offset = (y * 36 + x) * 5,
          angle = TAU * hash(x, y, seed ^ 0x2f93);
        kiwiHairs[offset] = 0.3 + 0.4 * hash(x, y, seed ^ 0x43b7);
        kiwiHairs[offset + 1] = 0.3 + 0.4 * hash(x, y, seed ^ 0x6a51);
        kiwiHairs[offset + 2] = Math.cos(angle);
        kiwiHairs[offset + 3] = Math.sin(angle);
        kiwiHairs[offset + 4] = 0.75 + 0.25 * hash(x, y, seed ^ 0x19d3);
      }
  const shortFur =
    kind === 'zebrafur' ||
    kind === 'leopardfur' ||
    kind === 'giraffefur' ||
    kind === 'cowhide';
  const furWarp = shortFur ? cachedNoise(5, 7, seed ^ 0x72b9) : null;
  const furGrain = shortFur ? cachedNoise(96, 64, seed ^ 0x4c13) : null;
  const cowPreset =
      kind === 'cowhide' ? proceduralMaterialPresets.cowhide : null,
    cowPatches = cowPreset
      ? cachedNoise(cowPreset.patchColumns, cowPreset.patchRows, seed ^ 0x11211)
      : null,
    inverseCowTransition = cowPreset
      ? 1 / (cowPreset.patchHigh - cowPreset.patchLow)
      : 0;
  // Each short hair has compact C1 elliptical support strictly inside the
  // neighboring cells. Pigment never participates in the pile's height field.
  const furFibers = shortFur ? new Float64Array(40 * 32 * 4) : null;
  if (furFibers)
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 40; x++) {
        const offset = (y * 40 + x) * 4,
          angle = Math.PI / 2 + 0.65 * (hash(x, y, seed ^ 0x173d) - 0.5);
        furFibers[offset] = 0.3 + 0.4 * hash(x, y, seed ^ 0x53a1);
        furFibers[offset + 1] = 0.3 + 0.4 * hash(x, y, seed ^ 0x6b29);
        furFibers[offset + 2] = Math.cos(angle);
        furFibers[offset + 3] = Math.sin(angle);
      }
  const rosettes = kind === 'leopardfur' ? new Float64Array(5 * 5 * 7) : null;
  if (rosettes)
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) {
        const offset = (y * 5 + x) * 7,
          angle = TAU * hash(x, y, seed ^ 0x39a7);
        rosettes[offset] = 0.32 + 0.36 * hash(x, y, seed ^ 0x19e3);
        rosettes[offset + 1] = 0.32 + 0.36 * hash(x, y, seed ^ 0x5d71);
        rosettes[offset + 2] = Math.cos(angle);
        rosettes[offset + 3] = Math.sin(angle);
        rosettes[offset + 4] = 1 / (0.39 + 0.08 * hash(x, y, seed ^ 0x6c35));
        rosettes[offset + 5] = 1 / (0.34 + 0.07 * hash(x, y, seed ^ 0x2f19));
        rosettes[offset + 6] = hash(x, y, seed ^ 0x73b1);
      }
  // Shared bisectors inset every patch from its neighbors. The complementary
  // pale network stays connected; no hard nearest-site ownership is sampled.
  const furPatches =
    kind === 'giraffefur' ? new Float64Array(6 * 6 * 27) : null;
  if (furPatches)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        const offset = (y * 6 + x) * 27,
          px = 0.3 + 0.4 * hash(x, y, seed ^ 0x43b9),
          py = 0.3 + 0.4 * hash(x, y, seed ^ 0x6a17);
        furPatches[offset] = px;
        furPatches[offset + 1] = py;
        furPatches[offset + 2] = hash(x, y, seed ^ 0x27d3);
        let plane = offset + 3;
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const wx = (x + ox + 6) % 6,
              wy = (y + oy + 6) % 6,
              dx = ox + 0.3 + 0.4 * hash(wx, wy, seed ^ 0x43b9) - px,
              dy = oy + 0.3 + 0.4 * hash(wx, wy, seed ^ 0x6a17) - py,
              distance = Math.sqrt(dx * dx + dy * dy);
            furPatches[plane++] = dx / distance;
            furPatches[plane++] = dy / distance;
            furPatches[plane++] = distance / 2;
          }
      }
  const endgrainCenterU = kind === 'endgrain' ? hash(0, 0, seed ^ 0x3b17) : 0;
  const endgrainCenterV = kind === 'endgrain' ? hash(0, 0, seed ^ 0x5d29) : 0;
  // Four dark/four light yarns woven in 2/2 twill produce broken-check teeth.
  // Reconstruct yarn-center pigments smoothly, rather than hard pixel masks.
  const toothYarns = kind === 'houndstooth' ? new Float64Array(64) : null;
  if (toothYarns)
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++)
        toothYarns[y * 8 + x] = ((x - y + 8) % 4 < 2 ? x : y) < 4 ? 0 : 1;
  // Compact Cartesian petals and paired leaves; transforms are sampler-owned.
  const damaskLobes =
    kind === 'damask' || kind === 'goldbrocade'
      ? new Float64Array(12 * 6)
      : null;
  if (damaskLobes) {
    for (let i = 0; i < 12; i++) {
      let x = 0,
        y = -0.18,
        angle = 0,
        length = 0.065,
        width = 0.065;
      if (i < 6) {
        angle = (TAU * i) / 6 + Math.PI / 2;
        x = 0.085 * Math.cos(angle);
        y += 0.085 * Math.sin(angle);
        length = 0.12;
        width = 0.055;
      } else if (i < 10) {
        const side = i % 2 === 0 ? -1 : 1;
        x = side * (i < 8 ? 0.115 : 0.09);
        y = i < 8 ? 0.095 : 0.275;
        angle = side * -0.65;
        length = i < 8 ? 0.145 : 0.115;
        width = 0.06;
      } else if (i === 11) {
        y = 0.12;
        angle = Math.PI / 2;
        length = 0.26;
        width = 0.018;
      }
      const offset = i * 6;
      damaskLobes[offset] = x;
      damaskLobes[offset + 1] = y;
      damaskLobes[offset + 2] = Math.cos(angle);
      damaskLobes[offset + 3] = Math.sin(angle);
      damaskLobes[offset + 4] = 1 / length;
      damaskLobes[offset + 5] = 1 / width;
    }
  }
  // Cell geometry is immutable for this sampler, not rehashed for every texel.
  const foamCells =
    kind === 'closedcellfoam' ? new Float64Array(28 * 28 * 4) : null;
  if (foamCells)
    for (let y = 0; y < 28; y++)
      for (let x = 0; x < 28; x++) {
        const offset = (y * 28 + x) * 4;
        const variation = hash(x, y, seed ^ 0x6f27);
        const radius = 0.55 + 0.16 * variation;
        foamCells[offset] = 0.3 + 0.4 * hash(x, y, seed);
        foamCells[offset + 1] = 0.3 + 0.4 * hash(x, y, seed ^ 0x29a5);
        foamCells[offset + 2] = 1 / (radius * radius);
        foamCells[offset + 3] = variation;
      }
  const hideColumns = kind === 'snakeskin' ? 10 : 4;
  const hideRows = kind === 'snakeskin' ? 12 : 6;
  const hideCells =
    kind === 'snakeskin' || kind === 'crocodile'
      ? new Float64Array(hideColumns * hideRows)
      : null;
  if (hideCells)
    for (let y = 0; y < hideRows; y++)
      for (let x = 0; x < hideColumns; x++)
        hideCells[y * hideColumns + x] = hash(x, y, seed ^ 0x73b9);
  const turnedDisks =
    kind === 'engineturned' ? new Float64Array(6 * 6 * 2) : null;
  if (turnedDisks)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        const offset = (y * 6 + x) * 2;
        turnedDisks[offset] = hash(x, y, seed ^ 0x38a1);
        turnedDisks[offset + 1] = hash(x, y, seed ^ 0x6c57);
      }
  const skinColumns = kind === 'orangepeel' ? 24 : 40;
  const skinRows = kind === 'orangepeel' ? 24 : 8;
  const skinFeatures =
    kind === 'orangepeel' || kind === 'coconut'
      ? new Float64Array(skinColumns * skinRows * 3)
      : null;
  if (skinFeatures)
    for (let y = 0; y < skinRows; y++)
      for (let x = 0; x < skinColumns; x++) {
        const offset = (y * skinColumns + x) * 3;
        skinFeatures[offset] = 0.25 + 0.5 * hash(x, y, seed ^ 0x1e73);
        skinFeatures[offset + 1] = 0.25 + 0.5 * hash(x, y, seed ^ 0x53b1);
        skinFeatures[offset + 2] = hash(x, y, seed ^ 0x7b29);
      }
  const ooids = kind === 'limestone' ? new Float64Array(24 * 24 * 7) : null;
  if (ooids)
    for (let y = 0; y < 24; y++)
      for (let x = 0; x < 24; x++) {
        const offset = (y * 24 + x) * 7;
        const angle = TAU * hash(x, y, seed ^ 0x2c71);
        ooids[offset] = 0.15 + 0.7 * hash(x, y, seed ^ 0x18b3);
        ooids[offset + 1] = 0.15 + 0.7 * hash(x, y, seed ^ 0x4e29);
        ooids[offset + 2] = 0.25 + 0.19 * hash(x, y, seed ^ 0x7a91);
        ooids[offset + 3] = 0.65 + 0.35 * hash(x, y, seed ^ 0x398d);
        ooids[offset + 4] = Math.cos(angle);
        ooids[offset + 5] = Math.sin(angle);
        ooids[offset + 6] = hash(x, y, seed ^ 0x63f7);
      }
  // Five irregular half-planes form each clast. Their compact support fits
  // strictly inside the sampled 3x3 neighborhood, including at wrapped edges.
  const clasts = kind === 'breccia' ? new Float64Array(6 * 6 * 18) : null;
  if (clasts)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        const offset = (y * 6 + x) * 18;
        const rotation = TAU * hash(x, y, seed ^ 0x2b53);
        const radius = 0.3 + 0.35 * hash(x, y, seed ^ 0x5a17);
        clasts[offset] = 0.15 + 0.7 * hash(x, y, seed ^ 0x17c9);
        clasts[offset + 1] = 0.15 + 0.7 * hash(x, y, seed ^ 0x38d1);
        clasts[offset + 2] = hash(x, y, seed ^ 0x7e43);
        for (let edge = 0; edge < 5; edge++) {
          const angle =
            rotation +
            (TAU * edge) / 5 +
            0.2 * (hash(x, y, seed ^ (0x41b7 + edge)) - 0.5);
          const plane = offset + 3 + edge * 3;
          clasts[plane] = Math.cos(angle);
          clasts[plane + 1] = Math.sin(angle);
          clasts[plane + 2] =
            radius * (0.75 + 0.25 * hash(x, y, seed ^ (0x68a1 + edge)));
        }
      }
  const veneerEyes = kind === 'plywood' ? new Float64Array(2 * 3) : null;
  if (veneerEyes)
    for (let eye = 0; eye < 2; eye++) {
      veneerEyes[eye * 3] = hash(eye, 0, seed ^ 0x21e7);
      veneerEyes[eye * 3 + 1] = hash(eye, 0, seed ^ 0x64b3);
      veneerEyes[eye * 3 + 2] = 0.75 + 0.25 * hash(eye, 0, seed ^ 0x48d9);
    }
  const fiberBandCount = kind === 'reedmat' ? 16 : 6;
  const fiberBands =
    kind === 'reedmat' || kind === 'rope'
      ? new Float64Array(fiberBandCount * 2)
      : null;
  if (fiberBands)
    for (let band = 0; band < fiberBandCount; band++) {
      fiberBands[band * 2] = hash(band, 0, seed ^ 0x16d9);
      fiberBands[band * 2 + 1] = TAU * hash(band, 0, seed ^ 0x49b3);
    }
  // Thin straight stems in three ordered strata. Radius stays below one cell
  // and centers stay in [0.25, 0.75], safely inside a wrapped 3x3 lookup.
  const strawStems = kind === 'straw' ? new Float64Array(3 * 8 * 8 * 9) : null;
  if (strawStems)
    for (let layer = 0; layer < 3; layer++)
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          const offset = ((layer * 8 + y) * 8 + x) * 9;
          const salt = seed ^ (layer * 0x39a7);
          const angle = TAU * hash(x, y, salt ^ 0x18d3);
          strawStems[offset] = 0.25 + 0.5 * hash(x, y, salt ^ 0x4f17);
          strawStems[offset + 1] = 0.25 + 0.5 * hash(x, y, salt ^ 0x73c9);
          strawStems[offset + 2] = Math.cos(angle);
          strawStems[offset + 3] = Math.sin(angle);
          strawStems[offset + 4] = 0.62 + 0.33 * hash(x, y, salt ^ 0x62b1);
          strawStems[offset + 5] = 0.035 + 0.03 * hash(x, y, salt ^ 0x519b);
          strawStems[offset + 6] = hash(x, y, salt ^ 0x2e65);
          strawStems[offset + 7] = TAU * hash(x, y, salt ^ 0x71c3);
          strawStems[offset + 8] = hash(x, y, salt ^ 0x37e1);
        }
  const strandCells = kind === 'osb' ? 6 : 28;
  // Two overlapping strata of angular flakes. The longest support has radius
  // below 1.2 cells; centers stay in [0.25, 0.75], so 3x3 lookup is sufficient.
  const strands =
    kind === 'osb' || kind === 'chipboard'
      ? new Float64Array(strandCells * strandCells * 2 * 26)
      : null;
  if (strands)
    for (let layer = 0; layer < 2; layer++)
      for (let y = 0; y < strandCells; y++)
        for (let x = 0; x < strandCells; x++) {
          const offset = ((layer * strandCells + y) * strandCells + x) * 26;
          const salt = seed ^ (layer * 0x39a7);
          const variation = hash(x, y, salt ^ 0x62b1);
          const angle =
            kind === 'osb'
              ? Math.PI / 2 +
                0.65 * (hash(x, y, salt ^ 0x18d3) - 0.5) +
                0.5 * (noise(x / 6, y / 6, 3, 3, seed ^ 0x7b29) - 0.5)
              : TAU * hash(x, y, salt ^ 0x18d3);
          strands[offset] = 0.25 + 0.5 * hash(x, y, salt ^ 0x4f17);
          strands[offset + 1] = 0.25 + 0.5 * hash(x, y, salt ^ 0x73c9);
          strands[offset + 2] = Math.cos(angle);
          strands[offset + 3] = Math.sin(angle);
          strands[offset + 4] =
            kind === 'osb' ? 0.78 + 0.14 * variation : 0.46 + 0.19 * variation;
          strands[offset + 5] =
            kind === 'osb'
              ? 0.13 + 0.1 * hash(x, y, salt ^ 0x519b)
              : 0.25 + 0.17 * hash(x, y, salt ^ 0x519b);
          strands[offset + 6] = variation;
          strands[offset + 7] = TAU * hash(x, y, salt ^ 0x2e65);
          for (let edge = 0; edge < 6; edge++) {
            const plane = offset + 8 + edge * 3;
            strands[plane] = Math.cos((TAU * edge) / 6);
            strands[plane + 1] = Math.sin((TAU * edge) / 6);
            strands[plane + 2] =
              0.82 + 0.18 * hash(x, y, salt ^ (0x5d31 + edge));
          }
        }
  // Narrow C1 half-plane shoulders leave a connected, closed hairline network.
  // Jitter stays within 0.14 cells, so each polygon is bounded inside the
  // sampled 3x3 neighborhood; no nearest-cell pigment switches are involved.
  const glazeCells =
    kind === 'crackleglaze' ? new Float64Array(16 * 16 * 26) : null;
  if (glazeCells)
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const offset = (y * 16 + x) * 26;
        const px = 0.36 + 0.28 * hash(x, y, seed ^ 0x438d),
          py = 0.36 + 0.28 * hash(x, y, seed ^ 0x7b25);
        glazeCells[offset] = px;
        glazeCells[offset + 1] = py;
        let plane = offset + 2;
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const wx = (x + ox + 16) % 16,
              wy = (y + oy + 16) % 16;
            const dx = ox + 0.36 + 0.28 * hash(wx, wy, seed ^ 0x438d) - px,
              dy = oy + 0.36 + 0.28 * hash(wx, wy, seed ^ 0x7b25) - py;
            const distance = Math.sqrt(dx * dx + dy * dy);
            glazeCells[plane++] = dx / distance;
            glazeCells[plane++] = dy / distance;
            glazeCells[plane++] = distance / 2;
          }
      }
  const armorColumns = kind === 'fishscales' ? 10 : 8;
  const armorRows = kind === 'fishscales' ? 10 : 4;
  const armorCells =
    kind === 'fishscales' || kind === 'feathers' || kind === 'peacockfeathers'
      ? new Float64Array(armorColumns * armorRows * 2)
      : null;
  if (armorCells)
    for (let y = 0; y < armorRows; y++)
      for (let x = 0; x < armorColumns; x++) {
        const offset = (y * armorColumns + x) * 2;
        armorCells[offset] = hash(x, y, seed ^ 0x3e71);
        armorCells[offset + 1] = 0.2 * (hash(x, y, seed ^ 0x62d3) - 0.5);
      }
  // Shared jittered bisectors leave irregular scutes, not a hexagonal grid.
  // Products of C1 half-plane shoulders keep their corners differentiable.
  const scutes = kind === 'tortoiseshell' ? new Float64Array(6 * 6 * 27) : null;
  if (scutes)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        const offset = (y * 6 + x) * 27;
        const px = 0.22 + 0.56 * hash(x, y, seed ^ 0x35b7),
          py = 0.22 + 0.56 * hash(x, y, seed ^ 0x6e19);
        scutes[offset] = px;
        scutes[offset + 1] = py;
        scutes[offset + 2] = hash(x, y, seed ^ 0x7c43);
        let plane = offset + 3;
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const wx = (x + ox + 6) % 6,
              wy = (y + oy + 6) % 6;
            const dx = ox + 0.22 + 0.56 * hash(wx, wy, seed ^ 0x35b7) - px,
              dy = oy + 0.22 + 0.56 * hash(wx, wy, seed ^ 0x6e19) - py;
            const distance = Math.sqrt(dx * dx + dy * dy);
            scutes[plane++] = dx / distance;
            scutes[plane++] = dy / distance;
            scutes[plane++] = distance / 2;
          }
      }
  const rubberStuds = kind === 'studdedrubber' ? new Float64Array(6 * 6) : null;
  if (rubberStuds)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++)
        rubberStuds[y * 6 + x] = hash(x, y, seed ^ 0x4b19);
  const rubberRibs = kind === 'groovedrubber' ? new Float64Array(12) : null;
  if (rubberRibs)
    for (let x = 0; x < 12; x++) rubberRibs[x] = hash(x, 0, seed ^ 0x5c37);
  // Compact irregular granules: multiply smooth half-plane masks rather than
  // selecting a nearest edge, so compressed corners have continuous slopes.
  const rubberGranules =
    kind === 'recycledrubber' ? new Float64Array(48 * 48 * 18) : null;
  if (rubberGranules)
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < 48; x++) {
        const offset = (y * 48 + x) * 18;
        const angle = TAU * hash(x, y, seed ^ 0x7d13);
        const radius = 0.48 + 0.17 * hash(x, y, seed ^ 0x19b7);
        rubberGranules[offset] = 0.2 + 0.6 * hash(x, y, seed ^ 0x32a9);
        rubberGranules[offset + 1] = 0.2 + 0.6 * hash(x, y, seed ^ 0x61e3);
        rubberGranules[offset + 2] = hash(x, y, seed ^ 0x53c1);
        for (let edge = 0; edge < 5; edge++) {
          const plane = offset + 3 + edge * 3;
          const direction = angle + (TAU * edge) / 5;
          rubberGranules[plane] = Math.cos(direction);
          rubberGranules[plane + 1] = Math.sin(direction);
          rubberGranules[plane + 2] =
            radius * (0.78 + 0.22 * hash(x, y, seed ^ (0x26f1 + edge)));
        }
      }
  // Shared jittered bisectors form crust plates. All shoulders retreat inside
  // their polygon, so summing owners never introduces nearest-feature jumps.
  const crustPlates =
    kind === 'breadcrust' ? new Float64Array(7 * 7 * 27) : null;
  if (crustPlates)
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const offset = (y * 7 + x) * 27;
        const px = 0.36 + 0.28 * hash(x, y, seed ^ 0x24b7),
          py = 0.36 + 0.28 * hash(x, y, seed ^ 0x59d1);
        crustPlates[offset] = px;
        crustPlates[offset + 1] = py;
        crustPlates[offset + 2] = hash(x, y, seed ^ 0x73a9);
        let plane = offset + 3;
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const wx = (x + ox + 7) % 7,
              wy = (y + oy + 7) % 7;
            const dx = ox + 0.36 + 0.28 * hash(wx, wy, seed ^ 0x24b7) - px,
              dy = oy + 0.36 + 0.28 * hash(wx, wy, seed ^ 0x59d1) - py;
            const distance = Math.sqrt(dx * dx + dy * dy);
            crustPlates[plane++] = dx / distance;
            crustPlates[plane++] = dy / distance;
            crustPlates[plane++] = distance / 2;
          }
      }
  const sportCells = kind === 'basketball' ? 36 : 24;
  const sportStride = kind === 'basketball' ? 3 : 4;
  const sportFeatures =
    kind === 'basketball' || kind === 'tennisball'
      ? new Float64Array(sportCells * sportCells * sportStride)
      : null;
  if (sportFeatures)
    for (let y = 0; y < sportCells; y++)
      for (let x = 0; x < sportCells; x++) {
        const offset = (y * sportCells + x) * sportStride;
        sportFeatures[offset] = 0.35 + 0.3 * hash(x, y, seed ^ 0x19a7);
        sportFeatures[offset + 1] = 0.35 + 0.3 * hash(x, y, seed ^ 0x5c23);
        if (kind === 'basketball') {
          const radius = 0.34 + 0.04 * hash(x, y, seed ^ 0x73d9);
          sportFeatures[offset + 2] = 1 / (radius * radius);
        } else {
          const angle = TAU * hash(x, y, seed ^ 0x37b1);
          sportFeatures[offset + 2] = Math.cos(angle);
          sportFeatures[offset + 3] = Math.sin(angle);
        }
      }
  const golfOffsetU = kind === 'golfball' ? hash(0, 0, seed ^ 0x29b7) : 0;
  const golfOffsetV = kind === 'golfball' ? hash(0, 0, seed ^ 0x61d3) : 0;
  const architectural =
    kind === 'boardformedconcrete' ||
    kind === 'ribbedconcrete' ||
    kind === 'splitfaceblock';
  const castPores = architectural ? cachedNoise(96, 96, seed ^ 0x2d71) : null;
  const castAggregate =
    kind === 'ribbedconcrete' || kind === 'splitfaceblock'
      ? cachedNoise(24, 32, seed ^ 0x6b39)
      : null;
  const boardGrain =
    kind === 'boardformedconcrete' ? cachedNoise(3, 128, seed ^ 0x5a13) : null;
  const architecturalOwners = architectural
    ? new Float64Array(
        kind === 'boardformedconcrete'
          ? 16
          : kind === 'ribbedconcrete'
            ? 12
            : 32,
      )
    : null;
  if (architecturalOwners)
    for (let i = 0; i < architecturalOwners.length; i++)
      architecturalOwners[i] = hash(i, 0, seed ^ 0x47e9);
  const fabricated =
    kind === 'chainmail' || kind === 'rivetedmetal' || kind === 'weldedmetal';
  const sheetGrain = fabricated ? cachedNoise(48, 64, seed ^ 0x6d27) : null;
  const fabricatedOwners =
    kind === 'chainmail'
      ? new Float64Array(48)
      : kind === 'rivetedmetal'
        ? new Float64Array(12)
        : null;
  if (fabricatedOwners)
    for (let i = 0; i < fabricatedOwners.length; i++)
      fabricatedOwners[i] = hash(i, 0, seed ^ 0x39b5);
  const botanical =
    kind === 'cactus' || kind === 'pinecone' || kind === 'corncob';
  const botanicalGrain = botanical ? cachedNoise(48, 64, seed ^ 0x5e39) : null;
  const botanicalColumns = kind === 'corncob' ? 12 : 8;
  const botanicalRows = 8;
  const botanicalStride = kind === 'cactus' ? 18 : 1;
  const botanicalCells = botanical
    ? new Float64Array(botanicalColumns * botanicalRows * botanicalStride)
    : null;
  if (botanicalCells)
    for (let y = 0; y < botanicalRows; y++)
      for (let x = 0; x < botanicalColumns; x++) {
        const offset = (y * botanicalColumns + x) * botanicalStride;
        botanicalCells[offset] = hash(x, y, seed ^ 0x4a73);
        if (kind === 'cactus') {
          botanicalCells[offset] = 0.28 + 0.08 * botanicalCells[offset];
          botanicalCells[offset + 1] = 0.12 * (hash(x, y, seed ^ 0x2d59) - 0.5);
          const rotation = hash(x, y, seed ^ 0x7f31) * TAU;
          for (let ray = 0; ray < 8; ray++) {
            const angle = rotation + (ray * TAU) / 8;
            botanicalCells[offset + 2 + ray * 2] = Math.cos(angle);
            botanicalCells[offset + 3 + ray * 2] = Math.sin(angle);
          }
        }
      }
  const packaging =
    kind === 'corrugatedcardboard' ||
    kind === 'creasedpaper' ||
    kind === 'layeredpaper';
  const pulpGrain = packaging ? cachedNoise(6, 8, seed ^ 0x31b9) : null;
  // A small periodic pulp carrier keeps microfibers independent of macrogeometry.
  const pulpFibers = packaging ? new Float64Array(3 * 4 * 5) : null;
  if (pulpFibers)
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 3; x++) {
        const offset = (y * 3 + x) * 5,
          angle = TAU * hash(x, y, seed ^ 0x6e13);
        pulpFibers[offset] = 0.3 + 0.4 * hash(x, y, seed ^ 0x2b71);
        pulpFibers[offset + 1] = 0.3 + 0.4 * hash(x, y, seed ^ 0x5c39);
        pulpFibers[offset + 2] = Math.cos(angle);
        pulpFibers[offset + 3] = Math.sin(angle);
        pulpFibers[offset + 4] = 0.32 + 0.12 * hash(x, y, seed ^ 0x7a51);
      }
  const paperLayers = kind === 'layeredpaper' ? new Float64Array(8 * 3) : null;
  if (paperLayers)
    for (let i = 0; i < 8; i++) {
      paperLayers[i * 3] = 0.35 + i * 0.045;
      paperLayers[i * 3 + 1] = 0.58 + 0.14 * hash(i, 0, seed ^ 0x4f27);
      paperLayers[i * 3 + 2] = TAU * hash(i, 0, seed ^ 0x291d);
    }
  const volcanic =
    kind === 'basalt' || kind === 'scoria' || kind === 'obsidian';
  const volcanicGrain = volcanic ? cachedNoise(64, 64, seed ^ 0x5b17) : null;
  const volcanicColumns = kind === 'basalt' ? 6 : kind === 'scoria' ? 10 : 4;
  const volcanicRows = kind === 'basalt' ? 8 : volcanicColumns;
  const volcanicStride = kind === 'basalt' ? 4 : 7;
  const volcanicCells = volcanic
    ? new Float64Array(volcanicColumns * volcanicRows * volcanicStride)
    : null;
  if (volcanicCells)
    for (let y = 0; y < volcanicRows; y++)
      for (let x = 0; x < volcanicColumns; x++) {
        const offset = (y * volcanicColumns + x) * volcanicStride,
          variation = hash(x, y, seed ^ 0x3d71);
        if (kind === 'basalt') {
          volcanicCells[offset] = 0.46 + 0.025 * variation;
          volcanicCells[offset + 1] = 0.46 + 0.025 * hash(x, y, seed ^ 0x6a29);
          volcanicCells[offset + 2] = 0.46 + 0.025 * hash(x, y, seed ^ 0x7c43);
          volcanicCells[offset + 3] = variation;
        } else {
          const angle = TAU * hash(x, y, seed ^ 0x6a29),
            radius =
              kind === 'scoria'
                ? 0.32 + 0.12 * variation
                : 0.65 + 0.13 * variation;
          volcanicCells[offset] = 0.35 + 0.3 * hash(x, y, seed ^ 0x2f59);
          volcanicCells[offset + 1] = 0.35 + 0.3 * hash(x, y, seed ^ 0x7c43);
          volcanicCells[offset + 2] = radius;
          volcanicCells[offset + 3] =
            radius * (0.7 + 0.25 * hash(x, y, seed ^ 0x4e13));
          volcanicCells[offset + 4] = Math.cos(angle);
          volcanicCells[offset + 5] = Math.sin(angle);
          volcanicCells[offset + 6] = variation;
        }
      }
  const mineral =
    kind === 'malachite' || kind === 'agate' || kind === 'lapislazuli';
  const mineralGrain = mineral ? cachedNoise(64, 64, seed ^ 0x79b3) : null;
  const calciteGrain =
    kind === 'lapislazuli' ? cachedNoise(8, 8, seed ^ 0x4d29) : null;
  const mineralPhaseU = mineral ? TAU * hash(0, 0, seed ^ 0x35a7) : 0;
  const mineralPhaseV = mineral ? TAU * hash(0, 0, seed ^ 0x6c19) : 0;
  const bulkGrain =
    kind === 'rice' || kind === 'sesame' || kind === 'coffeebeans';
  const grainCells = kind === 'rice' ? 12 : kind === 'sesame' ? 16 : 8;
  const grainSites = bulkGrain
    ? new Float64Array(grainCells * grainCells * 7)
    : null;
  const roastGrain =
    kind === 'coffeebeans' ? cachedNoise(64, 64, seed ^ 0x46b9) : null;
  if (grainSites)
    for (let y = 0; y < grainCells; y++)
      for (let x = 0; x < grainCells; x++) {
        const offset = (y * grainCells + x) * 7,
          angle = TAU * hash(x, y, seed ^ 0x5f39),
          variation = hash(x, y, seed ^ 0x37c1);
        grainSites[offset] = 0.35 + 0.3 * hash(x, y, seed ^ 0x18a7);
        grainSites[offset + 1] = 0.35 + 0.3 * hash(x, y, seed ^ 0x6d23);
        grainSites[offset + 2] = Math.cos(angle);
        grainSites[offset + 3] = Math.sin(angle);
        grainSites[offset + 4] =
          1 /
          (kind === 'rice'
            ? 0.62 + 0.09 * variation
            : kind === 'sesame'
              ? 0.48 + 0.06 * variation
              : 0.57 + 0.06 * variation);
        grainSites[offset + 5] =
          1 /
          (kind === 'rice'
            ? 0.14 + 0.025 * variation
            : kind === 'sesame'
              ? 0.24 + 0.025 * variation
              : 0.36 + 0.03 * variation);
        grainSites[offset + 6] = variation;
      }
  const foliage =
    kind === 'lotusleaf' || kind === 'bananaleaf' || kind === 'fernleaf';
  const leafStride = kind === 'lotusleaf' ? 31 : 7;
  const leafSites = foliage ? new Float64Array(3 * 3 * leafStride) : null;
  if (leafSites)
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < 3; x++) {
        const offset = (y * 3 + x) * leafStride,
          angle = TAU * hash(x, y, seed ^ 0x5a97),
          variation = hash(x, y, seed ^ 0x36d1);
        leafSites[offset] = 0.45 + 0.1 * hash(x, y, seed ^ 0x21b7);
        leafSites[offset + 1] = 0.45 + 0.1 * hash(x, y, seed ^ 0x71e3);
        leafSites[offset + 2] = Math.cos(angle);
        leafSites[offset + 3] = Math.sin(angle);
        leafSites[offset + 4] =
          1 /
          (kind === 'lotusleaf'
            ? 0.65 + 0.04 * variation
            : kind === 'bananaleaf'
              ? 0.76 + 0.04 * variation
              : 0.78 + 0.03 * variation);
        leafSites[offset + 5] =
          1 /
          (kind === 'lotusleaf'
            ? 0.61 + 0.04 * variation
            : kind === 'bananaleaf'
              ? 0.28 + 0.02 * variation
              : 0.5);
        leafSites[offset + 6] = variation;
        if (kind === 'lotusleaf')
          for (let ray = 0; ray < 12; ray++) {
            const direction = (ray * TAU) / 12 + 0.15 * variation;
            leafSites[offset + 7 + ray * 2] = Math.cos(direction);
            leafSites[offset + 8 + ray * 2] = Math.sin(direction);
          }
      }
  // Fixed pinna geometry is shared by all seeded fronds; no tip divisions or
  // branch transforms are recomputed for individual samples.
  const pinnae = kind === 'fernleaf' ? new Float64Array(14 * 3) : null;
  if (pinnae)
    for (let i = 0; i < 14; i++) {
      const root = -0.7 + i * 0.105;
      pinnae[i * 3] = root;
      pinnae[i * 3 + 1] = i % 2 === 0 ? 1 : -1;
      pinnae[i * 3 + 2] = 1 / (0.68 - 0.36 * root * root);
    }
  const marine =
    kind === 'braincoral' || kind === 'starcoral' || kind === 'seasponge';
  const marineGrain = marine ? cachedNoise(64, 64, seed ^ 0x4a93) : null;
  // Integer Fourier directions close on the torus. Their seeded phases create
  // a labyrinth of rounded level-set ridges, not nearest-cell cavity rims.
  const brainModes =
    kind === 'braincoral'
      ? new Float64Array([
          4, 1, 0, 0.34, -2, 5, 0, 0.28, 3, 4, 0, 0.22, 1, -3, 0, 0.18, 6, -2,
          0, 0.12, 2, 7, 0, 0.08,
        ])
      : null;
  if (brainModes)
    for (let i = 0; i < 6; i++)
      brainModes[i * 4 + 2] = TAU * hash(i, 0, seed ^ 0x71c9);
  const corallites = kind === 'starcoral' ? new Float64Array(6 * 6 * 31) : null;
  if (corallites)
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        const offset = (y * 6 + x) * 31,
          angle = TAU * hash(x, y, seed ^ 0x2c97),
          radius = 0.5 + 0.055 * hash(x, y, seed ^ 0x6e31);
        corallites[offset] = 0.4 + 0.2 * hash(x, y, seed ^ 0x1b59);
        corallites[offset + 1] = 0.4 + 0.2 * hash(x, y, seed ^ 0x5f27);
        corallites[offset + 2] = Math.cos(angle);
        corallites[offset + 3] = Math.sin(angle);
        corallites[offset + 4] = 1 / radius;
        corallites[offset + 5] = 1 / (0.9 * radius);
        corallites[offset + 6] = hash(x, y, seed ^ 0x39d7);
        for (let ray = 0; ray < 12; ray++) {
          const direction = (ray * TAU) / 12;
          corallites[offset + 7 + ray * 2] = Math.cos(direction);
          corallites[offset + 8 + ray * 2] = Math.sin(direction);
        }
      }
  // Each jittered node joins its right and upper neighbors, with occasional
  // diagonal braces. Compact struts and node bulbs form a connected skeleton;
  // broad pores are the spaces between branches, not a union of gas-pit bowls.
  // All supports lie strictly inside [0, 2]^2 of their anchor cell, so a wrapped
  // 3x3 lookup cannot introduce an ownership edge.
  const spongeStruts =
    kind === 'seasponge' ? new Float64Array(7 * 7 * 4 * 7) : null;
  const spongeChannels =
    kind === 'seasponge' ? cachedNoise(28, 28, seed ^ 0x73b1) : null;
  if (spongeStruts)
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const ax = 0.34 + 0.32 * hash(x, y, seed ^ 0x17d3),
          ay = 0.34 + 0.32 * hash(x, y, seed ^ 0x59a7);
        for (let branch = 0; branch < 4; branch++) {
          const offset = ((y * 7 + x) * 4 + branch) * 7,
            ox = branch === 0 || branch === 2 ? 1 : 0,
            oy = branch === 1 || branch === 2 ? 1 : 0,
            bx =
              ox +
              0.34 +
              0.32 * hash((x + ox) % 7, (y + oy) % 7, seed ^ 0x17d3),
            by =
              oy +
              0.34 +
              0.32 * hash((x + ox) % 7, (y + oy) % 7, seed ^ 0x59a7),
            dx = bx - ax,
            dy = by - ay,
            length = Math.sqrt(dx * dx + dy * dy);
          spongeStruts[offset] = (ax + bx) * 0.5;
          spongeStruts[offset + 1] = (ay + by) * 0.5;
          spongeStruts[offset + 2] = branch === 3 ? 1 : dx / length;
          spongeStruts[offset + 3] = branch === 3 ? 0 : dy / length;
          spongeStruts[offset + 4] =
            1 / (branch === 3 ? 0.23 : length * 0.5 + 0.12);
          spongeStruts[offset + 5] =
            1 /
            (branch === 3
              ? 0.23
              : 0.14 + 0.03 * hash(x, y, seed ^ (0x41b9 + branch)));
          spongeStruts[offset + 6] =
            branch !== 2 || hash(x, y, seed ^ 0x6d25) < 0.35 ? 1 : 0;
        }
      }
  const shell =
    kind === 'scallopshell' ||
    kind === 'oystershell' ||
    kind === 'nautilusshell';
  const shellGrain = shell ? cachedNoise(64, 64, seed ^ 0x5e91) : null;
  const shellCells = kind === 'oystershell' ? 3 : 2;
  // Compact, sampler-owned transforms. Every support fits inside the wrapped
  // 3x3 lookup; inserting/removing a neighbor therefore changes no field.
  const shellFaces = shell
    ? new Float64Array(shellCells * shellCells * 8)
    : null;
  if (shellFaces)
    for (let y = 0; y < shellCells; y++)
      for (let x = 0; x < shellCells; x++) {
        const offset = (y * shellCells + x) * 8,
          angle = 0.45 * (hash(x, y, seed ^ 0x317b) - 0.5),
          oyster = kind === 'oystershell';
        shellFaces[offset] = 0.5 + 0.12 * (hash(x, y, seed ^ 0x193d) - 0.5);
        shellFaces[offset + 1] = 0.5 + 0.12 * (hash(x, y, seed ^ 0x69a1) - 0.5);
        shellFaces[offset + 2] = Math.cos(angle);
        shellFaces[offset + 3] = Math.sin(angle);
        shellFaces[offset + 4] = 1 / (oyster ? 0.73 : 0.47);
        shellFaces[offset + 5] = 1 / (oyster ? 0.58 : 0.47);
        shellFaces[offset + 6] = TAU * hash(x, y, seed ^ 0x4b27);
        shellFaces[offset + 7] = 0.52 + 0.05 * Math.sin(shellFaces[offset + 6]);
      }
  const nutshell =
    kind === 'walnutshell' || kind === 'peanutshell' || kind === 'almondshell';
  const nutGrain = nutshell ? cachedNoise(64, 48, seed ^ 0x63d7) : null;
  const nutWarp =
    kind === 'peanutshell' || kind === 'walnutshell'
      ? cachedNoise(4, 6, seed ^ 0x3b59)
      : null;
  // Curved finite ridges join jittered nodes, with optional diagonal branches.
  // Every support lies strictly inside (-0.75, 2.75)^2 of its anchor;
  // the wrapped 5x5 lookup includes it even across anchor changes.
  const walnutRidges =
    kind === 'walnutshell' ? new Float64Array(7 * 7 * 3 * 8) : null;
  if (walnutRidges)
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const ax = 0.2 + 0.6 * hash(x, y, seed ^ 0x196d),
          ay = 0.2 + 0.6 * hash(x, y, seed ^ 0x57b3);
        for (let branch = 0; branch < 3; branch++) {
          const ox = branch === 1 ? 0 : 1,
            oy = branch === 0 ? 0 : 1,
            bx =
              ox + 0.2 + 0.6 * hash((x + ox) % 7, (y + oy) % 7, seed ^ 0x196d),
            by =
              oy + 0.2 + 0.6 * hash((x + ox) % 7, (y + oy) % 7, seed ^ 0x57b3),
            dx = bx - ax,
            dy = by - ay,
            length = Math.sqrt(dx * dx + dy * dy),
            offset = ((y * 7 + x) * 3 + branch) * 8;
          walnutRidges[offset] = (ax + bx) * 0.5;
          walnutRidges[offset + 1] = (ay + by) * 0.5;
          walnutRidges[offset + 2] = dx / length;
          walnutRidges[offset + 3] = dy / length;
          walnutRidges[offset + 4] = 1 / (length * 0.5 + 0.2);
          walnutRidges[offset + 5] =
            1 / (0.28 + 0.14 * hash(x, y, seed ^ (0x39a1 + branch)));
          walnutRidges[offset + 6] =
            0.64 * (hash(x, y, seed ^ (0x61c7 + branch)) - 0.5);
          walnutRidges[offset + 7] =
            branch === 1 ||
            (branch === 0
              ? hash(x, y, seed ^ 0x42ab) < 0.6
              : hash(x, y, seed ^ 0x2d93) < 0.45)
              ? 1
              : 0;
        }
      }
  const peanutLinks =
    kind === 'peanutshell' ? new Float64Array(10 * 5 * 3) : null;
  if (peanutLinks)
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 10; x++) {
        const offset = (y * 10 + x) * 3;
        peanutLinks[offset] = 0.25 + 0.5 * hash(x, y, seed ^ 0x2b71);
        peanutLinks[offset + 1] = 1 / (0.09 + 0.04 * hash(x, y, seed ^ 0x57d1));
        peanutLinks[offset + 2] = 0.3 * (hash(x, y, seed ^ 0x71b9) - 0.5);
      }
  // Pores stay within radius 0.44 of centers in [0.25, 0.75], so the
  // wrapped 3x3 lookup never clips a rotated ellipse at a cell boundary.
  const almondPores =
    kind === 'almondshell' ? new Float64Array(16 * 12 * 7) : null;
  if (almondPores)
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 16; x++) {
        const offset = (y * 16 + x) * 7,
          angle = 0.3 * (hash(x, y, seed ^ 0x37a9) - 0.5);
        almondPores[offset] = 0.25 + 0.5 * hash(x, y, seed ^ 0x193b);
        almondPores[offset + 1] = 0.25 + 0.5 * hash(x, y, seed ^ 0x5d27);
        almondPores[offset + 2] = Math.cos(angle);
        almondPores[offset + 3] = Math.sin(angle);
        almondPores[offset + 4] = 1 / (0.1 + 0.03 * hash(x, y, seed ^ 0x6b13));
        almondPores[offset + 5] = 1 / (0.32 + 0.12 * hash(x, y, seed ^ 0x41d7));
        almondPores[offset + 6] = hash(x, y, seed ^ 0x79b1) > 0.3 ? 1 : 0;
      }
  const needsBroad = kind === 'stone' || kind === 'metal' || kind === 'marble';
  const needsFine =
    kind === 'brick' ||
    kind === 'stone' ||
    kind === 'asphalt' ||
    kind === 'gravel' ||
    kind === 'cobblestone' ||
    kind === 'bark' ||
    kind === 'moss' ||
    kind === 'mud' ||
    kind === 'granite' ||
    kind === 'slate' ||
    kind === 'terrazzo' ||
    kind === 'plaster' ||
    kind === 'terracotta' ||
    kind === 'cork' ||
    kind === 'rubber' ||
    kind === 'sandstone' ||
    kind === 'travertine' ||
    kind === 'pumice';
  let u = 0,
    v = 0,
    broad = 0,
    detail = 0,
    fine = 0,
    color = 0,
    height = 0,
    roughness = 0,
    occlusion = 1,
    mortar = 0,
    metallic = 0;
  // Constant for the sampler: only the kind decides it.
  const metallicBase =
    kind === 'metal' ||
    kind === 'diamondplate' ||
    kind === 'hammeredmetal' ||
    kind === 'galvanized' ||
    kind === 'corrugatedmetal' ||
    kind === 'standingseam' ||
    kind === 'damascus' ||
    kind === 'castiron' ||
    kind === 'pressedtin' ||
    kind === 'louveredmetal' ||
    kind === 'crowncaps' ||
    kind === 'rebar' ||
    kind === 'guilloche' ||
    kind === 'splitlockwashers' ||
    kind === 'hexnuts' ||
    kind === 'wingnuts' ||
    kind === 'circlips' ||
    kind === 'fivebarplate' ||
    kind === 'scalemail' ||
    kind === 'slottedmetal' ||
    kind === 'castellatednuts' ||
    kind === 'cotterpins' ||
    kind === 'squarewashers' ||
    kind === 'spurgears' ||
    kind === 'paperclips' ||
    kind === 'starsocketbolts' ||
    kind === 'sawblades' ||
    kind === 'countersunkmetal' ||
    kind === 'rollerchain' ||
    kind === 'hinges' ||
    kind === 'coins' ||
    kind === 'ballchain' ||
    kind === 'doorkeys' ||
    kind === 'beltbuckles' ||
    kind === 'carabiners' ||
    kind === 'safetypins' ||
    kind === 'grinderburrs' ||
    kind === 'canlids' ||
    kind === 'dinnerforks' ||
    kind === 'hexkeys' ||
    kind === 'perforatedmetal' ||
    kind === 'expandedmetal' ||
    kind === 'wiremesh' ||
    kind === 'pyrite' ||
    kind === 'knurledmetal' ||
    kind === 'engineturned' ||
    kind === 'goldleaf' ||
    kind === 'rivetedmetal' ||
    kind === 'weldedmetal'
      ? 1
      : 0;
  /**
   * One closure per preset. A single sampler holding every preset's code stayed too large for V8
   * to optimize well, and each preset first run deoptimized it again; a closure per preset warms
   * up on its own. Add a preset as `case 'name': return () => { ... };` reading the shared
   * `u`, `v`, `broad`, `detail`, `fine` and writing `color`, `height`, `roughness`,
   * `occlusion`, `mortar`, `metallic`; return (not break) to finish.
   */
  const pick = (): (() => void) => {
    switch (kind) {
      case 'mudtiretracks': {
        const p = proceduralMaterialPresets.mudtiretracks;
        const phases = new Float64Array(p.tracks),
          inverseWidth = 1 / p.halfWidth,
          inverseLugSquared = 1 / (p.lugWidth * p.lugWidth),
          bermSquared = p.bermCenter * p.bermCenter,
          inverseBermWidth = 1 / p.bermSquaredWidth,
          soilField = cachedNoise(8, 8, seed ^ 0x11811),
          grainField = cachedNoise(128, 128, seed ^ 0x11813);
        for (let track = 0; track < p.tracks; track++)
          phases[track] = hash(track, 0, seed ^ 0x11815);
        return () => {
          const soil = soilField(u, v),
            grain = grainField(u, v),
            track = Math.floor(u * p.tracks),
            across = (u - (track + 0.5) / p.tracks) * inverseWidth,
            squared = across * across,
            rut = smooth(clamp(1 - squared)),
            bermDistance = (squared - bermSquared) * inverseBermWidth,
            berm = smooth(clamp(1 - bermDistance * bermDistance));
          color = 0.44 + 0.1 * soil + 0.05 * grain;
          height = 0.55 + 0.12 * soil + 0.02 * grain;
          roughness = p.roughness + 0.06 * grain;
          occlusion = 0.99;
          if (rut === 0 && berm === 0) return;
          let pressed = 0;
          if (rut > 0) {
            // Squared transverse warping rounds the lug arc's apex without
            // an absolute-value cusp; compact bands also close the phase wrap.
            const phase =
              fract(v * p.lugs - p.curvature * squared + phases[track] + 0.5) -
              0.5;
            pressed =
              rut * smooth(clamp(1 - phase * phase * inverseLugSquared));
          }
          color += 0.05 * berm - 0.09 * rut - 0.19 * pressed;
          height += 0.06 * berm - 0.18 * rut - 0.26 * pressed;
          roughness += -0.04 * rut + 0.035 * pressed;
          occlusion -= 0.12 * rut + 0.32 * pressed;
          return;
        };
      }
      case 'dinnerforks': {
        const p = proceduralMaterialPresets.dinnerforks;
        const tones = new Float64Array(p.cells * p.cells),
          inversePitch = 1 / p.tinePitch,
          inverseWidth = 1 / p.tineHalfWidth,
          inverseTineLength = 1 / (p.rootY - p.tipY),
          inverseTip = 1 / p.tipShoulder,
          inverseBevel = 1 / p.edgeBevel,
          inverseBottom = 1 / p.bottomShoulder,
          inverseEllipseShoulder = 1 / p.ellipseShoulder,
          inverseNeck = 1 / p.neckLength,
          inverseWidening = 1 / p.wideningLength,
          grainField = cachedNoise(96, 96, seed ^ 0x11711);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x11713);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? dy : dx,
            y = turn ? dx : dy,
            width =
              p.neckWidth +
              p.headWidening *
                (1 - smooth(clamp((y - p.headBottom) * inverseNeck))) +
              p.handleWidening *
                smooth(clamp((y - p.wideningStart) * inverseWidening)),
            bodyCap = clamp(1 - (x * x) / (width * width)),
            bodyDome = smooth(bodyCap),
            body =
              smooth(clamp(bodyCap * inverseEllipseShoulder)) *
              smooth(clamp((y - p.bodyTop) * inverseBevel)) *
              smooth(clamp((p.bodyBottom - y) * inverseBottom)),
            tooth = Math.floor((x - p.firstTine) * inversePitch + 0.5);
          let tines = 0,
            tineDome = 0;
          // As with haircombs, one nearest tine suffices because every tapered
          // support reaches zero before the ownership boundary.
          if (tooth >= 0 && tooth < p.tines && y > p.tipY && y < p.rootY) {
            const t = smooth(clamp((p.rootY - y) * inverseTineLength)),
              across =
                ((x - p.firstTine - tooth * p.tinePitch) * inverseWidth) /
                (1 - p.taper * t);
            tineDome = smooth(clamp(1 - across * across));
            tines =
              tineDome *
              smooth(clamp((y - p.tipY) * inverseTip)) *
              smooth(clamp((p.rootY - y) * inverseBevel));
          }
          const weight = body + tines;
          color = 0.07;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (weight === 0) return;
          const face = body + tines - body * tines,
            dome = (body * bodyDome + tines * tineDome) / weight,
            relief =
              (body * (0.5 + 0.08 * bodyDome) +
                tines * (0.61 + 0.02 * tineDome)) /
              weight,
            grain = grainField(u, v);
          // Normalized relief keeps all four roots attached without doubling
          // thickness where they merge into the head and continuous handle.
          color +=
            face *
            (0.64 +
              0.06 * tones[row * p.cells + col] +
              0.015 * grain +
              0.035 * dome -
              color);
          height += face * (relief + 0.001 * grain - height);
          roughness +=
            face * (p.roughness + 0.02 * grain - 0.035 * dome - roughness);
          occlusion += face * (0.98 - occlusion);
          return;
        };
      }
      case 'tangramtiles': {
        const p = proceduralMaterialPresets.tangramtiles,
          count = p.pieces.length,
          offsets = new Uint8Array(count + 1),
          tones = new Float64Array(p.cells * p.cells * count),
          inverseShoulder = 1 / p.shoulder,
          grainField = cachedNoise(64, 64, seed ^ 0x11911);
        let edgeCount = 0;
        for (const piece of p.pieces) edgeCount += piece.length;
        const planes = new Float64Array(edgeCount * 3);
        let edge = 0;
        // Counterclockwise polygons partition a square into the standard
        // 2 large, 1 medium, 2 small triangles, square and parallelogram.
        for (let i = 0; i < count; i++) {
          offsets[i] = edge;
          const piece = p.pieces[i];
          for (let j = 0; j < piece.length; j++, edge++) {
            const a = piece[j],
              b = piece[(j + 1) % piece.length],
              inverse = 1 / Math.hypot(b[0] - a[0], b[1] - a[1]),
              nx = (a[1] - b[1]) * inverse,
              ny = (b[0] - a[0]) * inverse,
              at = edge * 3;
            planes[at] = nx;
            planes[at + 1] = ny;
            planes[at + 2] = -nx * a[0] - ny * a[1];
          }
        }
        offsets[count] = edge;
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            for (let i = 0; i < count; i++)
              tones[(row * p.cells + col) * count + i] =
                0.18 + 0.11 * i + 0.03 * hash(col, row, seed ^ (0x11913 + i));
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            x = fract(uc),
            y = fract(vc),
            owner = (Math.floor(vc) * p.cells + Math.floor(uc)) * count;
          let face = 0,
            pigment = 0;
          for (let i = 0; i < count; i++) {
            let cover = 1;
            for (let e = offsets[i]; e < offsets[i + 1] && cover > 0; e++) {
              const at = e * 3;
              cover *= smooth(
                clamp(
                  (planes[at] * x +
                    planes[at + 1] * y +
                    planes[at + 2] -
                    p.grout) *
                    inverseShoulder,
                ),
              );
            }
            face += cover;
            pigment += cover * tones[owner + i];
          }
          const grain = face > 0 ? grainField(u, v) : 0;
          mortar = 1 - face;
          color = pigment + 0.015 * grain * face;
          height = (0.65 + 0.003 * grain) * face;
          roughness = p.roughness + 0.015 * grain * face + 0.6 * mortar;
          occlusion = 0.5 + 0.49 * face;
        };
      }
      case 'pythagoreantiles': {
        const p = proceduralMaterialPresets.pythagoreantiles;
        const a = p.smallSide,
          b = p.largeSide,
          period = a * a + b * b,
          largeHalf = b / 2,
          smallHalf = a / 2,
          offsetX = (b - a) / 2,
          offsetY = (a + b) / 2,
          inverseShoulder = 1 / p.shoulder,
          tones = new Float64Array(period * 2),
          grainField = cachedNoise(64, 64, seed ^ 0x11611);
        for (let type = 0; type < 2; type++)
          for (let i = 0; i < period; i++)
            tones[type * period + i] = hash(i, type, seed ^ 0x11613);
        return () => {
          const x = u * period,
            y = v * period,
            column = Math.floor(b * u + a * v),
            row = Math.floor(-a * u + b * v);
          let face = 0,
            pigment = 0;
          // Lattice vectors (b,a),(-a,b) tile the plane with two square sizes.
          // Their square-period translations preserve (a*i+b*j) modulo period.
          for (let oy = 0; oy <= 1; oy++)
            for (let ox = 0; ox <= 1; ox++) {
              const i = column + ox,
                j = row + oy,
                dx = x - (b * i - a * j),
                dy = y - (a * i + b * j),
                cover =
                  smooth(
                    clamp(
                      (largeHalf - Math.abs(dx) - p.grout) * inverseShoulder,
                    ),
                  ) *
                  smooth(
                    clamp(
                      (largeHalf - Math.abs(dy) - p.grout) * inverseShoulder,
                    ),
                  );
              if (cover === 0) continue;
              const id = (a * i + b * j + period) % period;
              face += cover;
              pigment += cover * (0.32 + 0.08 * tones[id]);
            }
          const sx = x - (b * column - a * row + offsetX),
            sy = y - (a * column + b * row + offsetY),
            small =
              smooth(
                clamp((smallHalf - Math.abs(sx) - p.grout) * inverseShoulder),
              ) *
              smooth(
                clamp((smallHalf - Math.abs(sy) - p.grout) * inverseShoulder),
              ),
            id = (a * column + b * row + period) % period;
          face += small;
          pigment += small * (0.78 + 0.06 * tones[period + id]);
          const grain = face > 0 ? grainField(u, v) : 0;
          mortar = 1 - face;
          color = pigment + 0.02 * grain * face;
          height = (0.65 + 0.003 * grain) * face;
          roughness = p.roughness + 0.015 * grain + 0.7 * mortar;
          occlusion = 0.5 + 0.49 * face;
          return;
        };
      }
      case 'crinoidossicles': {
        const p = proceduralMaterialPresets.crinoidossicles;
        const fossils = new Float64Array(p.cells * p.cells * 4),
          coreSquared =
            (p.lumenRadius - p.lobeDepth) ** 2 - p.lumenSquaredShoulder,
          innerSquared = p.ribInnerRadius * p.ribInnerRadius,
          outerSquared = p.ribOuterRadius * p.ribOuterRadius,
          inverseInnerFade =
            1 / ((p.ribInnerRadius + p.ribFade) ** 2 - innerSquared),
          inverseOuterFade =
            1 / (outerSquared - (p.ribOuterRadius - p.ribFade) ** 2),
          inverseLumenShoulder = 1 / p.lumenSquaredShoulder,
          grainField = cachedNoise(96, 96, seed ^ 0x11511),
          sedimentField = cachedNoise(16, 16, seed ^ 0x11513);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 4,
              radius =
                p.radius +
                p.radiusVariation * (2 * hash(col, row, seed ^ 0x11515) - 1);
            fossils[i] = hash(col, row, seed ^ 0x11517);
            fossils[i + 1] = TAU * hash(col, row, seed ^ 0x11519);
            fossils[i + 2] = radius * radius;
            fossils[i + 3] =
              1 / (radius * radius - (radius - p.edgeBevel) ** 2);
          }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            i = (Math.floor(vc) * p.cells + Math.floor(uc)) * 4,
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            squared = x * x + y * y,
            face = smooth(clamp((fossils[i + 2] - squared) * fossils[i + 3])),
            grain = grainField(u, v),
            sediment = sedimentField(u, v);
          color = 0.4 + 0.08 * sediment + 0.03 * grain;
          height = 0.36 + 0.012 * grain;
          roughness = p.roughness + 0.05 * grain;
          occlusion = 0.99;
          if (face === 0) return;
          let lumen = 1,
            ridge = 0;
          // The saturated filled center masks the angular pole completely.
          if (squared > coreSquared) {
            const angle = Math.atan2(y, x) - fossils[i + 1],
              lobe = Math.cos(p.lobes * angle),
              lumenRadius = p.lumenRadius + p.lobeDepth * lobe;
            lumen = smooth(
              clamp(
                (lumenRadius * lumenRadius - squared) * inverseLumenShoulder,
              ),
            );
            // T4(cos(5θ)) supplies 20 fine ribs without a second cosine.
            const lobeSquared = lobe * lobe,
              wave = 1 + 4 * lobeSquared * (lobeSquared - 1);
            ridge =
              wave *
              wave *
              smooth(clamp((squared - innerSquared) * inverseInnerFade)) *
              smooth(clamp((outerSquared - squared) * inverseOuterFade));
          }
          color +=
            face *
            (0.82 + 0.06 * fossils[i] + 0.02 * grain + 0.035 * ridge - color);
          height += face * (0.49 + 0.07 * ridge + 0.005 * grain - height);
          roughness += face * (0.64 + 0.04 * grain - 0.07 * ridge - roughness);
          occlusion += face * (0.96 + 0.025 * ridge - occlusion);
          const filled = face * lumen;
          color += filled * (0.31 + 0.035 * sediment + 0.025 * grain - color);
          height += filled * (0.31 + 0.01 * grain - height);
          roughness += filled * (0.86 + 0.04 * grain - roughness);
          occlusion += filled * (0.72 - occlusion);
          return;
        };
      }
      case 'canlids': {
        const p = proceduralMaterialPresets.canlids;
        const tones = new Float64Array(p.cells * p.cells),
          radiusSquared = p.radius * p.radius,
          inverseBevel = 1 / (radiusSquared - (p.radius - p.edgeBevel) ** 2),
          beadSquared = p.beadRadius * p.beadRadius,
          inverseBead = 1 / ((p.beadRadius + p.beadWidth) ** 2 - beadSquared),
          scoreSquared = p.scoreRadius * p.scoreRadius,
          inverseScore =
            1 / ((p.scoreRadius + p.scoreWidth) ** 2 - scoreSquared),
          grainField = cachedNoise(96, 96, seed ^ 0x11411);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x11413);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? dy : dx,
            y = turn ? dx : dy,
            squared = x * x + y * y,
            face = smooth(clamp((radiusSquared - squared) * inverseBevel));
          color = 0.07;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (face === 0) return;
          const grain = grainField(u, v),
            tone = tones[row * p.cells + col],
            beadDistance = (squared - beadSquared) * inverseBead,
            bead = smooth(clamp(1 - beadDistance * beadDistance)),
            scoreDistance = (squared - scoreSquared) * inverseScore,
            score = smooth(clamp(1 - scoreDistance * scoreDistance)),
            tabCap =
              1 -
              (x / p.tabWidth) ** 2 -
              ((y - p.tabCenter) / p.tabLength) ** 2,
            outerTab = smooth(clamp(tabCap / p.shoulder)),
            grip = smooth(
              clamp(
                (1 -
                  (x / p.gripWidth) ** 2 -
                  ((y - p.gripCenter) / p.gripLength) ** 2) /
                  p.shoulder,
              ),
            ),
            slot = smooth(
              clamp(
                (1 -
                  (x / p.slotWidth) ** 2 -
                  ((y - p.slotCenter) / p.slotLength) ** 2) /
                  p.shoulder,
              ),
            ),
            tab = outerTab * (1 - grip) * (1 - slot),
            rivetCap =
              1 -
              (x / p.rivetRadius) ** 2 -
              ((y - p.rivetCenter) / p.rivetRadius) ** 2,
            rivet = smooth(clamp(rivetCap / p.shoulder));
          color +=
            face *
            (0.52 +
              0.1 * bead -
              0.12 * score +
              0.025 * tone +
              0.01 * grain -
              color);
          height +=
            face * (0.38 + 0.1 * bead - 0.035 * score + 0.003 * grain - height);
          roughness +=
            face *
            (p.roughness +
              0.03 * grain +
              0.1 * score -
              0.07 * bead -
              roughness);
          occlusion += face * (0.96 - 0.1 * score - occlusion);
          // Holes in the raised tab expose the intact lid, not the backing.
          // Replacing each layer prevents intersection height from stacking.
          color += tab * (0.68 + 0.025 * tone + 0.008 * grain - color);
          height +=
            tab *
            (0.64 + 0.025 * smooth(clamp(tabCap)) + 0.001 * grain - height);
          roughness += tab * (0.27 + 0.01 * grain - roughness);
          occlusion += tab * (0.99 - occlusion);
          color += rivet * (0.78 + 0.02 * tone + 0.008 * grain - color);
          height +=
            rivet *
            (0.74 + 0.03 * smooth(clamp(rivetCap)) + 0.001 * grain - height);
          roughness += rivet * (0.24 + 0.01 * grain - roughness);
          occlusion += rivet * (1 - occlusion);
          return;
        };
      }
      case 'spaltedwood': {
        const p = proceduralMaterialPresets.spaltedwood;
        const zoneField = cachedNoise(
            p.zoneColumns,
            p.zoneRows,
            seed ^ 0x11311,
          ),
          variationField = cachedNoise(
            p.variationColumns,
            p.variationRows,
            seed ^ 0x11313,
          ),
          grainField = cachedNoise(96, 4, seed ^ 0x11315),
          fiberField = cachedNoise(192, 8, seed ^ 0x11317);
        return () => {
          const variation = variationField(u, v),
            zone =
              (1 - p.variationMix) * zoneField(u, v) +
              p.variationMix * variation,
            width = p.lineWidth + p.lineWidthVariation * variation,
            distance = (zone - p.zoneLevel) / width,
            line = smooth(clamp(1 - distance * distance)),
            grain = grainField(u, v),
            fiber = fiberField(u, v);
          // Spalt zones are pigment, not open cracks or incised galleries.
          color = 0.78 + 0.12 * grain + 0.045 * fiber - 0.69 * line;
          height = 0.64 + 0.018 * grain + 0.01 * fiber;
          roughness = 0.67 + 0.05 * grain + 0.01 * fiber;
          occlusion = 0.97 + 0.02 * fiber;
          return;
        };
      }
      case 'grinderburrs': {
        const p = proceduralMaterialPresets.grinderburrs;
        const tones = new Float64Array(p.cells * p.cells),
          phases = new Float64Array(p.cells * p.cells),
          holes = new Float64Array(p.cells * p.cells * p.mountingHoles * 2),
          outerSquared = p.outerRadius * p.outerRadius,
          boreSquared = p.boreRadius * p.boreRadius,
          holeSquared = p.holeRadius * p.holeRadius,
          inverseOuterBevel =
            1 / (outerSquared - (p.outerRadius - p.edgeBevel) ** 2),
          inverseBoreBevel =
            1 / ((p.boreRadius + p.edgeBevel) ** 2 - boreSquared),
          inverseHoleBevel = 1 / (holeSquared - p.holeCore * p.holeCore),
          inverseTAU = 1 / TAU,
          grainField = cachedNoise(96, 96, seed ^ 0x11115);
        for (let cell = 0; cell < tones.length; cell++) {
          tones[cell] = hash(cell, 0, seed ^ 0x11111);
          phases[cell] = hash(cell, 0, seed ^ 0x11113);
          for (let hole = 0; hole < p.mountingHoles; hole++) {
            const angle = TAU * (phases[cell] + hole / p.mountingHoles),
              index = (cell * p.mountingHoles + hole) * 2;
            holes[index] = p.holeDistance * Math.cos(angle);
            holes[index + 1] = p.holeDistance * Math.sin(angle);
          }
        }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            cell = Math.floor(vc) * p.cells + Math.floor(uc),
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            radiusSquared = x * x + y * y,
            ring =
              smooth(
                clamp((outerSquared - radiusSquared) * inverseOuterBevel),
              ) *
              smooth(clamp((radiusSquared - boreSquared) * inverseBoreBevel));
          color = 0.065;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (ring === 0) return;
          let holeMask = 0;
          for (let hole = 0; hole < p.mountingHoles; hole++) {
            const index = (cell * p.mountingHoles + hole) * 2,
              dx = x - holes[index],
              dy = y - holes[index + 1],
              coverage = smooth(
                clamp((holeSquared - dx * dx - dy * dy) * inverseHoleBevel),
              );
            holeMask += (1 - holeMask) * coverage;
          }
          const face = ring * (1 - holeMask);
          if (face === 0) return;
          // Integer flute count closes the angle branch; the bore masks its
          // singular center. Squared-radius phase bends lands without sqrt.
          const phase =
              fract(
                p.flutes * (Math.atan2(y, x) * inverseTAU - phases[cell]) +
                  p.twist * radiusSquared,
              ) *
                2 -
              1,
            cap = 1 - phase * phase,
            land = cap * cap,
            grain = grainField(u, v);
          color +=
            face *
            (0.48 + 0.18 * land + 0.03 * tones[cell] + 0.01 * grain - color);
          height += face * (0.44 + 0.24 * land + 0.001 * grain - height);
          roughness += face * (0.57 - 0.31 * land + 0.02 * grain - roughness);
          occlusion += face * (0.76 + 0.22 * land - occlusion);
          return;
        };
      }
      case 'sharkteeth': {
        const p = proceduralMaterialPresets.sharkteeth;
        const tones = new Float64Array(p.cells * p.cells),
          phases = new Float64Array(p.cells * p.cells),
          inverseEdge = 1 / p.edgeBevel,
          inverseTipFade = 1 / p.serrationTipFade,
          inverseBaseFade = 1 / p.serrationBaseFade,
          inverseRootWidthSquared = 1 / (p.rootWidth * p.rootWidth),
          inverseRootHeightSquared = 1 / (p.rootHeight * p.rootHeight),
          inverseRootShoulder = 1 / p.rootShoulder,
          grainField = cachedNoise(96, 96, seed ^ 0x11015);
        for (let cell = 0; cell < tones.length; cell++) {
          tones[cell] = hash(cell, 0, seed ^ 0x11011);
          phases[cell] = hash(cell, 0, seed ^ 0x11013);
        }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            cell = row * p.cells + col,
            vertical = (col + row) & 1,
            x = vertical ? fract(uc) - 0.5 : fract(vc) - 0.5,
            y = vertical ? fract(vc) - 0.5 : fract(uc) - 0.5,
            along = y - p.crownTop,
            phase = fract(along * p.serrationFrequency + phases[cell]) * 2 - 1,
            cap = 1 - phase * phase,
            serration =
              cap *
              cap *
              smooth(clamp(along * inverseTipFade)) *
              smooth(clamp((p.crownBottom - y) * inverseBaseFade)),
            width = p.crownSlope * along + p.serrationAmplitude * serration,
            crown =
              smooth(clamp((width + x) * inverseEdge)) *
              smooth(clamp((width - x) * inverseEdge)) *
              smooth(clamp((p.crownBottom - y) * inverseEdge)),
            neck =
              smooth(clamp((p.neckWidth - Math.abs(x)) * inverseEdge)) *
              smooth(clamp((y - p.neckTop) * inverseEdge)) *
              smooth(clamp((p.neckBottom - y) * inverseEdge)),
            rootY = y - p.rootY,
            leftX = x + p.rootOffset,
            rightX = x - p.rootOffset,
            rootVertical = rootY * rootY * inverseRootHeightSquared,
            leftDome = clamp(
              1 - leftX * leftX * inverseRootWidthSquared - rootVertical,
            ),
            rightDome = clamp(
              1 - rightX * rightX * inverseRootWidthSquared - rootVertical,
            ),
            left = smooth(clamp(leftDome * inverseRootShoulder)),
            right = smooth(clamp(rightDome * inverseRootShoulder)),
            root = left + (1 - left) * right;
          color = 0.04;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (crown === 0 && neck === 0 && root === 0) return;
          const grain = grainField(u, v),
            tone = tones[cell];
          color += neck * (0.6 + 0.03 * tone - color);
          height += neck * (0.34 - height);
          roughness += neck * (0.65 - roughness);
          occlusion += neck * (0.94 - occlusion);
          if (crown > 0) {
            const safeWidth = width + p.crownDomeFloor,
              dome = smooth(clamp(1 - (x * x) / (safeWidth * safeWidth)));
            color += crown * (0.85 + 0.035 * tone + 0.006 * grain - color);
            height += crown * (0.52 + 0.17 * dome + 0.001 * grain - height);
            roughness += crown * (0.27 + 0.015 * grain - roughness);
            occlusion += crown * (0.98 - occlusion);
          }
          if (root > 0) {
            // The rough double root replaces the lower crown/neck; its central
            // lower notch stays open to opaque backing, not a transparent hole.
            const dome =
              (left * smooth(leftDome) + right * smooth(rightDome)) /
              (left + right);
            color += root * (0.56 + 0.03 * tone + 0.02 * grain - color);
            height += root * (0.43 + 0.08 * dome + 0.001 * grain - height);
            roughness += root * (0.67 + 0.03 * grain - roughness);
            occlusion += root * (0.96 - occlusion);
          }
          return;
        };
      }
      case 'bellpepperslices': {
        const p = proceduralMaterialPresets.bellpepperslices;
        const axes = new Float64Array(p.lobes * 2),
          tones = new Float64Array(p.cells * p.cells),
          seedTones = new Float64Array(p.cells * p.cells * p.lobes * 2),
          inverseOuterSquared = 1 / (p.outerRadius * p.outerRadius),
          inverseInnerSquared = 1 / (p.innerRadius * p.innerRadius),
          inverseCoreSquared = 1 / (p.coreRadius * p.coreRadius),
          inversePithWidthSquared = 1 / (p.pithHalfWidth * p.pithHalfWidth),
          inversePithBevel = 1 / p.pithBevel,
          inverseShoulder = 1 / p.shoulder,
          inverseSeedLengthSquared = 1 / (p.seedLength * p.seedLength),
          inverseSeedWidthSquared = 1 / (p.seedWidth * p.seedWidth),
          inverseSeedShoulder = 1 / p.seedShoulder,
          grainField = cachedNoise(96, 96, seed ^ 0x10f15);
        for (let lobe = 0; lobe < p.lobes; lobe++) {
          axes[lobe * 2] = Math.cos((TAU * lobe) / p.lobes);
          axes[lobe * 2 + 1] = Math.sin((TAU * lobe) / p.lobes);
        }
        for (let cell = 0; cell < tones.length; cell++) {
          tones[cell] = hash(cell, 0, seed ^ 0x10f11);
          for (let index = 0; index < p.lobes * 2; index++)
            seedTones[cell * p.lobes * 2 + index] = hash(
              cell,
              index,
              seed ^ 0x10f13,
            );
        }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            cell = row * p.cells + col,
            vertical = (col + row) & 1,
            x = vertical ? fract(uc) - 0.5 : fract(vc) - 0.5,
            y = vertical ? fract(vc) - 0.5 : fract(uc) - 0.5,
            coreDome = clamp(1 - (x * x + y * y) * inverseCoreSquared);
          let outer = 0,
            inner = 0,
            pith = smooth(clamp(coreDome * inverseShoulder)),
            seeds = 0,
            seedWeight = 0,
            seedColor = 0,
            seedHeight = 0;
          for (let lobe = 0; lobe < p.lobes; lobe++) {
            const ax = axes[lobe * 2],
              ay = axes[lobe * 2 + 1],
              along = x * ax + y * ay,
              across = y * ax - x * ay,
              dx = along - p.lobeOffset,
              distanceSquared = dx * dx + across * across,
              outside = smooth(
                clamp(
                  (1 - distanceSquared * inverseOuterSquared) * inverseShoulder,
                ),
              ),
              hollow = smooth(
                clamp(
                  (1 - distanceSquared * inverseInnerSquared) * inverseShoulder,
                ),
              ),
              membrane =
                smooth(clamp(1 - across * across * inversePithWidthSquared)) *
                smooth(clamp(along * inversePithBevel)) *
                smooth(clamp((p.pithEnd - along) * inversePithBevel));
            outer += (1 - outer) * outside;
            inner += (1 - inner) * hollow;
            pith += (1 - pith) * membrane;
            const seedX = along - p.seedAlong;
            for (let side = 0; side < 2; side++) {
              const seedY =
                  across - (side === 0 ? -p.seedOffset : p.seedOffset),
                dome = clamp(
                  1 -
                    seedX * seedX * inverseSeedLengthSquared -
                    seedY * seedY * inverseSeedWidthSquared,
                ),
                coverage = smooth(clamp(dome * inverseSeedShoulder));
              seeds += (1 - seeds) * coverage;
              seedWeight += coverage;
              seedColor +=
                coverage *
                (0.96 +
                  0.035 * seedTones[cell * p.lobes * 2 + lobe * 2 + side]);
              seedHeight += coverage * (0.43 + 0.07 * smooth(dome));
            }
          }
          const ring = outer * (1 - inner);
          pith *= outer;
          seeds *= outer;
          color = 0.025;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.3;
          if (ring === 0 && pith === 0 && seeds === 0) return;
          const grain = grainField(u, v);
          color += ring * (0.28 + 0.035 * tones[cell] + 0.015 * grain - color);
          height += ring * (0.61 + 0.004 * grain - height);
          roughness += ring * (0.38 + 0.02 * grain - roughness);
          occlusion += ring * (0.96 - occlusion);
          // Pale membranes bridge to the ring; attached seeds replace them,
          // while the three open chambers retain lower opaque backing.
          color += pith * (0.91 + 0.025 * tones[cell] + 0.01 * grain - color);
          height += pith * (0.32 + 0.004 * grain - height);
          roughness += pith * (0.58 + 0.01 * grain - roughness);
          occlusion += pith * (0.9 - occlusion);
          if (seeds > 0) {
            color += seeds * (seedColor / seedWeight + 0.003 * grain - color);
            height +=
              seeds * (seedHeight / seedWeight + 0.001 * grain - height);
            roughness += seeds * (0.46 + 0.01 * grain - roughness);
            occlusion += seeds * (0.96 - occlusion);
          }
          return;
        };
      }
      case 'threadspools': {
        const p = proceduralMaterialPresets.threadspools;
        const tones = new Float64Array(p.cells * p.cells),
          phases = new Float64Array(p.cells * p.cells),
          inverseCoreWidthSquared = 1 / (p.coreWidth * p.coreWidth),
          inverseThreadWidthSquared = 1 / (p.threadWidth * p.threadWidth),
          inverseFlangeWidthSquared = 1 / (p.flangeWidth * p.flangeWidth),
          inverseFlangeHeightSquared = 1 / (p.flangeHeight * p.flangeHeight),
          inverseEnd = 1 / p.endBevel,
          inverseShoulder = 1 / p.shoulder,
          windingFrequency = p.turns / p.windingLength,
          grainField = cachedNoise(96, 96, seed ^ 0x10e15);
        for (let cell = 0; cell < tones.length; cell++) {
          tones[cell] = hash(cell, 0, seed ^ 0x10e11);
          phases[cell] = hash(cell, 0, seed ^ 0x10e13);
        }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            cell = row * p.cells + col,
            vertical = (col + row) & 1,
            x = vertical ? fract(uc) - 0.5 : fract(vc) - 0.5,
            y = vertical ? fract(vc) - 0.5 : fract(uc) - 0.5,
            coreDome = clamp(1 - x * x * inverseCoreWidthSquared),
            core =
              smooth(clamp(coreDome * inverseShoulder)) *
              smooth(clamp((p.coreHalfHeight - Math.abs(y)) * inverseEnd)),
            threadDome = clamp(1 - x * x * inverseThreadWidthSquared),
            thread =
              smooth(clamp(threadDome * inverseShoulder)) *
              smooth(clamp((p.threadHalfHeight - Math.abs(y)) * inverseEnd)),
            flangeY = Math.abs(y) - p.flangeCenter,
            flangeDome = clamp(
              1 -
                x * x * inverseFlangeWidthSquared -
                flangeY * flangeY * inverseFlangeHeightSquared,
            ),
            flange = smooth(clamp(flangeDome * inverseShoulder));
          color = 0.035;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (core === 0 && thread === 0 && flange === 0) return;
          const grain = grainField(u, v),
            wood = 0.76 + 0.05 * tones[cell] + 0.03 * grain;
          color += core * (wood - color);
          height += core * (0.37 + 0.02 * smooth(coreDome) - height);
          roughness += core * (0.5 + 0.02 * grain - roughness);
          occlusion += core * (0.97 - occlusion);
          if (thread > 0) {
            // Squared parabolic windings have zero slope at each periodic join.
            const phase =
                fract(
                  y * windingFrequency + p.windingSlope * x + phases[cell],
                ) *
                  2 -
                1,
              cap = 1 - phase * phase,
              ridge = cap * cap;
            color +=
              thread *
              (0.13 +
                0.04 * tones[cell] +
                0.025 * ridge +
                0.008 * grain -
                color);
            height +=
              thread *
              (0.52 +
                0.09 * smooth(threadDome) +
                0.025 * ridge +
                0.001 * grain -
                height);
            roughness +=
              thread * (0.76 + 0.02 * grain + 0.02 * (1 - ridge) - roughness);
            occlusion += thread * (0.92 + 0.04 * ridge - occlusion);
          }
          // Higher wooden flanges replace the lower wound barrel at its ends.
          color += flange * (wood - color);
          height +=
            flange *
            (0.66 + 0.05 * smooth(flangeDome) + 0.001 * grain - height);
          roughness += flange * (0.5 + 0.02 * grain - roughness);
          occlusion += flange * (0.98 - occlusion);
          return;
        };
      }
      case 'chessrooks': {
        const p = proceduralMaterialPresets.chessrooks;
        const tones = new Float64Array(p.cells * p.cells),
          inverseEdge = 1 / p.edgeBevel,
          inverseWidening = 1 / p.wideningLength,
          inverseShaftShoulder = 1 / p.shaftShoulder,
          inverseEllipseShoulder = 1 / p.ellipseShoulder,
          inverseCrownWidthSquared = 1 / (p.crownHalfWidth * p.crownHalfWidth),
          inverseTopWidthSquared = 1 / (p.topCollarWidth * p.topCollarWidth),
          inverseTopHeightSquared = 1 / (p.topCollarHeight * p.topCollarHeight),
          inverseLowerWidthSquared =
            1 / (p.lowerCollarWidth * p.lowerCollarWidth),
          inverseLowerHeightSquared =
            1 / (p.lowerCollarHeight * p.lowerCollarHeight),
          inverseBaseWidthSquared = 1 / (p.baseWidth * p.baseWidth),
          inverseBaseHeightSquared = 1 / (p.baseHeight * p.baseHeight),
          grainField = cachedNoise(96, 96, seed ^ 0x10d13);
        for (let cell = 0; cell < tones.length; cell++)
          tones[cell] = hash(cell, 0, seed ^ 0x10d11);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            vertical = (col + row) & 1,
            x = vertical ? fract(uc) - 0.5 : fract(vc) - 0.5,
            y = vertical ? fract(vc) - 0.5 : fract(uc) - 0.5,
            width =
              p.neckWidth +
              p.shaftWidening *
                smooth(clamp((y - p.wideningStart) * inverseWidening)),
            shaftCap = clamp(1 - (x * x) / (width * width)),
            shaftDome = smooth(shaftCap),
            shaft =
              smooth(clamp(shaftCap * inverseShaftShoulder)) *
              smooth(clamp((y - p.shaftTop) * inverseEdge)) *
              smooth(clamp((p.shaftBottom - y) * inverseEdge)),
            notchY = smooth(clamp((p.notchBottom - y) * inverseEdge)),
            leftNotch =
              notchY *
              smooth(
                clamp(
                  (p.notchHalfWidth - Math.abs(x + p.notchOffset)) *
                    inverseEdge,
                ),
              ),
            rightNotch =
              notchY *
              smooth(
                clamp(
                  (p.notchHalfWidth - Math.abs(x - p.notchOffset)) *
                    inverseEdge,
                ),
              ),
            crown =
              smooth(clamp((p.crownHalfWidth - Math.abs(x)) * inverseEdge)) *
              smooth(clamp((y - p.crownTop) * inverseEdge)) *
              smooth(clamp((p.crownBottom - y) * inverseEdge)) *
              (1 - leftNotch) *
              (1 - rightNotch),
            topY = y - p.topCollarY,
            topDome = clamp(
              1 -
                x * x * inverseTopWidthSquared -
                topY * topY * inverseTopHeightSquared,
            ),
            top = smooth(clamp(topDome * inverseEllipseShoulder)),
            lowerY = y - p.lowerCollarY,
            lowerDome = clamp(
              1 -
                x * x * inverseLowerWidthSquared -
                lowerY * lowerY * inverseLowerHeightSquared,
            ),
            lower = smooth(clamp(lowerDome * inverseEllipseShoulder)),
            baseY = y - p.baseY,
            baseDome = clamp(
              1 -
                x * x * inverseBaseWidthSquared -
                baseY * baseY * inverseBaseHeightSquared,
            ),
            base = smooth(clamp(baseDome * inverseEllipseShoulder)),
            weight = shaft + crown + top + lower + base;
          color = 0.04;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (weight === 0) return;
          let face = shaft;
          face += (1 - face) * crown;
          face += (1 - face) * top;
          face += (1 - face) * lower;
          face += (1 - face) * base;
          const grain = grainField(u, v),
            relief =
              (shaft * (0.44 + 0.1 * shaftDome) +
                crown *
                  (0.62 +
                    0.03 *
                      smooth(clamp(1 - x * x * inverseCrownWidthSquared))) +
                top * (0.59 + 0.04 * smooth(topDome)) +
                lower * (0.59 + 0.04 * smooth(lowerDome)) +
                base * (0.64 + 0.05 * smooth(baseDome))) /
              weight;
          // Normalized component relief prevents collars, crown and base from
          // stacking thickness over the continuous lower shaft.
          color +=
            face *
            (0.8 + 0.045 * tones[row * p.cells + col] + 0.009 * grain - color);
          height += face * (relief + 0.001 * grain - height);
          roughness += face * (0.38 + 0.015 * grain - roughness);
          occlusion += face * (0.98 - occlusion);
          return;
        };
      }
      case 'woodenspoons': {
        const p = proceduralMaterialPresets.woodenspoons;
        const tones = new Float64Array(p.cells * p.cells),
          inverseBowlWidthSquared = 1 / (p.bowlWidth * p.bowlWidth),
          inverseBowlHeightSquared = 1 / (p.bowlHeight * p.bowlHeight),
          inverseBowlShoulder = 1 / p.bowlShoulder,
          inverseCavity = 1 / p.cavityRadiusSquared,
          inverseHandleEnd = 1 / p.handleEndBevel,
          inverseHandleShoulder = 1 / p.handleShoulder,
          inverseWideningLength = 1 / p.wideningLength,
          fiberField = cachedNoise(128, 16, seed ^ 0x10c13),
          grainField = cachedNoise(96, 96, seed ^ 0x10c15);
        for (let cell = 0; cell < tones.length; cell++)
          tones[cell] = hash(cell, 0, seed ^ 0x10c11);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            cell = row * p.cells + col,
            vertical = (col + row) & 1,
            x = vertical ? fract(uc) - 0.5 : fract(vc) - 0.5,
            y = vertical ? fract(vc) - 0.5 : fract(uc) - 0.5,
            by = y - p.bowlY,
            q =
              x * x * inverseBowlWidthSquared +
              by * by * inverseBowlHeightSquared,
            bowl = smooth(clamp((1 - q) * inverseBowlShoulder)),
            cavity = smooth(clamp(1 - q * inverseCavity)),
            width =
              p.neckWidth +
              p.handleWidening *
                smooth(clamp((y - p.wideningStart) * inverseWideningLength)),
            handleDome = clamp(1 - (x * x) / (width * width)),
            handle =
              smooth(clamp(handleDome * inverseHandleShoulder)) *
              smooth(clamp((y - p.handleTop) * inverseHandleEnd)) *
              smooth(clamp((p.handleBottom - y) * inverseHandleEnd));
          color = 0.04;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (bowl === 0 && handle === 0) return;
          const fiber = fiberField(
              (col + 0.5 + x) / p.cells,
              (row + 0.5 + y) / p.cells,
            ),
            grain = grainField(u, v),
            wood = 0.72 + 0.06 * tones[cell] + 0.065 * fiber + 0.008 * grain;
          color += handle * (wood - color);
          height +=
            handle *
            (0.5 + 0.045 * smooth(handleDome) + 0.001 * grain - height);
          roughness +=
            handle * (0.55 + 0.025 * fiber + 0.01 * grain - roughness);
          occlusion += handle * (0.97 - occlusion);
          // A higher rim surrounds a filled concavity; the bowl replaces the
          // lower handle where they overlap instead of stacking their relief.
          color += bowl * (wood - 0.16 * cavity - color);
          height += bowl * (0.69 - 0.25 * cavity + 0.001 * grain - height);
          roughness +=
            bowl *
            (0.53 + 0.025 * fiber + 0.01 * grain + 0.035 * cavity - roughness);
          occlusion += bowl * (0.98 - 0.16 * cavity - occlusion);
          return;
        };
      }
      case 'dominoes': {
        const p = proceduralMaterialPresets.dominoes;
        const tones = new Float64Array(p.cells * p.cells),
          masks = new Uint8Array(p.cells * p.cells * 2),
          layouts = [0, 8, 65, 73, 99, 107, 119],
          pipX = [-p.pipX, p.pipX, -p.pipX, 0, p.pipX, -p.pipX, p.pipX],
          pipY = [-p.pipY, -p.pipY, 0, 0, 0, p.pipY, p.pipY],
          inverseWidth = 1 / p.halfWidth,
          inverseHeight = 1 / p.halfHeight,
          inverseShoulder = 1 / p.shoulder,
          inversePipRadiusSquared = 1 / (p.pipRadius * p.pipRadius),
          inversePipShoulder = 1 / p.pipShoulder,
          inverseDividerWidthSquared =
            1 / (p.dividerHalfWidth * p.dividerHalfWidth),
          inverseDividerHeightSquared =
            1 / (p.dividerHalfHeight * p.dividerHalfHeight),
          grainField = cachedNoise(96, 96, seed ^ 0x10b17);
        for (let cell = 0; cell < tones.length; cell++) {
          tones[cell] = hash(cell, 0, seed ^ 0x10b11);
          masks[cell * 2] =
            layouts[Math.floor(hash(cell, 0, seed ^ 0x10b13) * 7)];
          masks[cell * 2 + 1] =
            layouts[Math.floor(hash(cell, 1, seed ^ 0x10b15) * 7)];
        }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            cell = row * p.cells + col,
            vertical = (col + row) & 1,
            x = vertical ? fract(uc) - 0.5 : fract(vc) - 0.5,
            y = vertical ? fract(vc) - 0.5 : fract(uc) - 0.5,
            nx = x * inverseWidth,
            ny = y * inverseHeight,
            xx = nx * nx,
            yy = ny * ny,
            face = smooth(
              clamp(
                (1 - xx * xx * xx * xx - yy * yy * yy * yy) * inverseShoulder,
              ),
            );
          color = 0.035;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.35;
          if (face === 0) return;
          const grain = grainField(u, v),
            half = y < 0 ? 0 : 1,
            localY = y + (half === 0 ? p.halfCenter : -p.halfCenter),
            mask = masks[cell * 2 + half],
            divider =
              smooth(clamp(1 - x * x * inverseDividerWidthSquared)) *
              smooth(clamp(1 - y * y * inverseDividerHeightSquared));
          let pips = 0;
          for (let index = 0; index < 7; index++) {
            if ((mask & (1 << index)) === 0) continue;
            const dx = x - pipX[index],
              dy = localY - pipY[index],
              pit = smooth(
                clamp(
                  (1 - (dx * dx + dy * dy) * inversePipRadiusSquared) *
                    inversePipShoulder,
                ),
              );
            pips += (1 - pips) * pit;
          }
          // Recesses remain filled above the backing; they are not alpha holes.
          const ivory = 0.83 + 0.035 * tones[cell] + 0.006 * grain,
            faceColor = ivory + divider * (0.34 - ivory),
            faceHeight = 0.62 + 0.001 * grain - 0.035 * divider;
          color += face * (faceColor + pips * (0.055 - faceColor) - color);
          height += face * (faceHeight + pips * (0.515 - faceHeight) - height);
          roughness +=
            face *
            (0.31 + 0.01 * grain + 0.15 * divider + 0.23 * pips - roughness);
          occlusion += face * (0.99 - 0.12 * divider - 0.26 * pips - occlusion);
          return;
        };
      }
      case 'porcelaininsulators': {
        const p = proceduralMaterialPresets.porcelaininsulators;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x10a11);
        const inverseCore = 1 / (p.coreWidth * p.coreWidth),
          inverseEnd = 1 / p.endBevel,
          inverseSkirtX = 1 / p.skirtWidth,
          inverseSkirtY = 1 / p.skirtHeight,
          inverseCapX = 1 / p.capWidth,
          inverseCapY = 1 / p.capHeight,
          inverseShoulder = 1 / p.shoulder,
          grainField = cachedNoise(96, 96, seed ^ 0x10a13);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            turn = (row + col) & 1,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = turn ? dy : dx,
            y = turn ? -dx : dy,
            coreDome = clamp(1 - x * x * inverseCore),
            core =
              smooth(clamp(coreDome * inverseShoulder)) *
              smooth(clamp((y - p.coreTop) * inverseEnd)) *
              smooth(clamp((p.coreBottom - y) * inverseEnd)),
            cx = x * inverseCapX,
            cy = (y - p.capY) * inverseCapY,
            capDome = clamp(1 - cx * cx - cy * cy),
            cap = smooth(clamp(capDome * inverseShoulder));
          let outsideSkirts = 1,
            outsideCrowns = 1;
          for (let i = 0; i < p.skirts; i++) {
            const sx = x * inverseSkirtX,
              sy = (y - p.firstSkirt - i * p.skirtPitch) * inverseSkirtY,
              dome = clamp(1 - sx * sx - sy * sy),
              skirt = smooth(clamp(dome * inverseShoulder));
            outsideSkirts *= 1 - skirt;
            outsideCrowns *= 1 - skirt * smooth(dome);
          }
          color = 0.045;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.3;
          const skirts = 1 - outsideSkirts;
          if (core === 0 && skirts === 0 && cap === 0) return;
          const grain = grainField(u, v),
            tone = tones[row * p.cells + col],
            glaze = 0.8 + 0.055 * tone + 0.02 * grain;
          color += core * (glaze - 0.075 - color);
          height +=
            core * (0.34 + 0.06 * smooth(coreDome) + 0.002 * grain - height);
          roughness += core * (p.roughness + 0.045 + 0.02 * grain - roughness);
          occlusion += core * (0.85 - occlusion);
          // Repeated porcelain skirts replace the lower continuous neck.
          // Bounded crown coverage cannot accumulate thickness at core joins.
          color += skirts * (glaze + 0.04 * (1 - outsideCrowns) - color);
          height +=
            skirts *
            (0.56 + 0.17 * (1 - outsideCrowns) + 0.002 * grain - height);
          roughness += skirts * (p.roughness + 0.015 * grain - roughness);
          occlusion += skirts * (0.92 + 0.06 * (1 - outsideCrowns) - occlusion);
          color += cap * (glaze + 0.035 * smooth(capDome) - color);
          height +=
            cap * (0.57 + 0.1 * smooth(capDome) + 0.002 * grain - height);
          roughness += cap * (p.roughness + 0.015 * grain - roughness);
          occlusion += cap * (0.94 + 0.04 * smooth(capDome) - occlusion);
          return;
        };
      }
      case 'matchsticks': {
        const p = proceduralMaterialPresets.matchsticks;
        const phases = new Float64Array(p.cells * p.cells),
          tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = row * p.cells + col;
            phases[i] = TAU * hash(col, row, seed ^ 0x10911);
            tones[i] = hash(col, row, seed ^ 0x10913);
          }
        const inverseSide = 1 / p.sideBevel,
          inverseEnd = 1 / p.endBevel,
          inverseHeadX = 1 / p.headWidth,
          inverseHeadY = 1 / p.headLength,
          inverseHeadShoulder = 1 / p.headShoulder,
          fineField = cachedNoise(128, 128, seed ^ 0x10917);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            turn = (row + col) & 1,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = turn ? dy : dx,
            y = turn ? -dx : dy,
            shaft =
              smooth(clamp((p.shaftHalfWidth - Math.abs(x)) * inverseSide)) *
              smooth(clamp((y - p.shaftTop) * inverseEnd)) *
              smooth(clamp((p.shaftBottom - y) * inverseEnd)),
            hx = x * inverseHeadX,
            hy = (y - p.headY) * inverseHeadY,
            cap = clamp(1 - hx * hx - hy * hy),
            head = smooth(clamp(cap * inverseHeadShoulder));
          color = 0.025;
          height = 0.025;
          roughness = 0.98;
          occlusion = 0.34;
          if (shaft === 0 && head === 0) return;
          const i = row * p.cells + col,
            tone = tones[i],
            fine = fineField(u, v);
          if (shaft > 0) {
            const grain =
                0.5 +
                0.5 *
                  Math.sin(
                    TAU * p.grainFrequency * x +
                      0.35 * Math.sin(TAU * 1.5 * y + phases[i]) +
                      phases[i],
                  ),
              pores = grain ** 8;
            color +=
              shaft *
              (0.79 + 0.07 * tone + 0.04 * grain - 0.035 * pores - color);
            height += shaft * (0.39 + 0.003 * grain - 0.002 * pores - height);
            roughness += shaft * (p.roughness + 0.045 * pores - roughness);
            occlusion += shaft * (0.98 - 0.015 * pores - occlusion);
          }
          // The rough opaque coating replaces the flat wooden shaft at their
          // overlap. Its convex crown is not an emissive flame or a burnt tip.
          const dome = smooth(cap);
          color += head * (0.13 + 0.055 * tone + 0.045 * fine - color);
          height += head * (0.52 + 0.22 * dome + 0.006 * fine - height);
          roughness += head * (p.headRoughness + 0.03 * fine - roughness);
          occlusion += head * (0.9 + 0.08 * dome - occlusion);
          return;
        };
      }
      case 'leatherbookspines': {
        const p = proceduralMaterialPresets.leatherbookspines;
        const tones = new Float64Array(p.columns);
        for (let col = 0; col < p.columns; col++)
          tones[col] = hash(col, 0, seed ^ 0x10811);
        const inverseEdge = 1 / p.edge,
          inverseWidth = 1 / p.halfWidth,
          inverseBand = 1 / p.bandWidth,
          inverseFrameX = 1 / p.frameHalfWidth,
          inverseFrameY = 1 / p.frameHalfHeight,
          inversePanelX = 1 / p.panelHalfWidth,
          inversePanelY = 1 / p.panelHalfHeight,
          inverseFrameShoulder = 1 / p.frameShoulder,
          inversePoreShoulder = 1 / p.poreShoulder,
          grainField = cachedNoise(128, 256, seed ^ 0x10813),
          poreField = cachedNoise(256, 256, seed ^ 0x10815);
        return () => {
          const uc = u * p.columns,
            col = Math.floor(uc),
            x = fract(uc) - 0.5,
            y = v - 0.5,
            face =
              smooth(clamp((p.halfWidth - Math.abs(x)) * inverseEdge)) *
              smooth(clamp((p.halfHeight - Math.abs(y)) * inverseEdge));
          color = 0.045;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.3;
          if (face === 0) return;
          const nx = x * inverseWidth,
            dome = smooth(clamp(1 - nx * nx)),
            by = y + p.bandCurve * nx * nx;
          let outsideBands = 1;
          for (const center of p.bands) {
            const d = (by - center) * inverseBand;
            outsideBands *= 1 - smooth(clamp(1 - d * d));
          }
          const bands = 1 - outsideBands,
            fx = x * inverseFrameX,
            fy = y * inverseFrameY,
            px = x * inversePanelX,
            py = y * inversePanelY,
            frame = smooth(
              clamp((1 - fx ** 4 - fy ** 4) * inverseFrameShoulder),
            ),
            panel = smooth(
              clamp((1 - px ** 4 - py ** 4) * inverseFrameShoulder),
            ),
            rim = frame * (1 - panel),
            grain = grainField(u, v),
            pores = smooth(
              clamp((poreField(u, v) - p.poreThreshold) * inversePoreShoulder),
            );
          // Curved raised bands follow each convex spine. The central blind
          // stamp has a shallow floor and raised rim, not text or metal foil.
          color +=
            face *
            (0.28 +
              0.35 * tones[col] +
              0.12 * dome +
              0.04 * bands +
              0.018 * grain -
              0.035 * pores +
              0.06 * rim -
              0.035 * panel -
              color);
          height +=
            face *
            (0.42 +
              0.16 * dome +
              p.bandLift * bands +
              p.frameLift * rim -
              p.panelDepth * panel +
              0.003 * grain -
              0.002 * pores -
              height);
          roughness +=
            face *
            (p.roughness +
              0.07 * pores -
              0.06 * panel -
              0.035 * rim +
              0.02 * grain -
              roughness);
          occlusion +=
            face *
            (0.88 +
              0.09 * dome +
              0.025 * bands +
              0.01 * rim -
              0.035 * panel -
              0.015 * pores -
              occlusion);
          return;
        };
      }
      case 'poppyseedpods': {
        const p = proceduralMaterialPresets.poppyseedpods;
        const axes = new Float64Array(p.lobes * 2),
          tones = new Float64Array(p.cells * p.cells);
        for (let i = 0; i < p.lobes; i++) {
          const angle = (TAU * i) / p.lobes;
          axes[i * 2] = Math.cos(angle);
          axes[i * 2 + 1] = Math.sin(angle);
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x10711);
        const inverseBodyX = 1 / p.bodyWidth,
          inverseBodyY = 1 / p.bodyLength,
          inverseBodyShoulder = 1 / p.bodyShoulder,
          inverseStemWidth = 1 / p.stemWidth,
          inverseStemBevel = 1 / p.stemBevel,
          inverseCrownX = 1 / p.crownWidth,
          inverseCrownY = 1 / p.crownHeight,
          coreSquared = p.crownCore * p.crownCore,
          crownBoundSquared = (p.lobeDistance + p.lobeLength) ** 2,
          inverseLobeLength = 1 / p.lobeLength,
          inverseLobeWidth = 1 / p.lobeWidth,
          inverseRayLength = 1 / p.rayLength,
          inverseRayWidth = 1 / p.rayWidth,
          inverseCrownShoulder = 1 / p.crownShoulder,
          grainField = cachedNoise(96, 96, seed ^ 0x10713);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            turn = (row + col) & 1,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = turn ? dy : dx,
            y = turn ? -dx : dy,
            bx = x * inverseBodyX,
            by = (y - p.bodyY) * inverseBodyY,
            cap = clamp(1 - bx * bx - by * by),
            body = smooth(clamp(cap * inverseBodyShoulder)),
            sx = x * inverseStemWidth,
            stem =
              smooth(clamp(1 - sx * sx)) *
              smooth(clamp((y - p.stemTop) * inverseStemBevel)) *
              smooth(clamp((p.stemBottom - y) * inverseStemBevel)),
            cx = x * inverseCrownX,
            cy = (y - p.crownY) * inverseCrownY,
            cq = cx * cx + cy * cy;
          let crown = 0,
            rays = 0;
          if (cq < crownBoundSquared) {
            let outside =
                1 - smooth(clamp((coreSquared - cq) * inverseCrownShoulder)),
              outsideRays = 1;
            for (let i = 0; i < axes.length; i += 2) {
              const along = cx * axes[i] + cy * axes[i + 1],
                across = cy * axes[i] - cx * axes[i + 1],
                la = (along - p.lobeDistance) * inverseLobeLength,
                lb = across * inverseLobeWidth,
                ra = (along - p.rayDistance) * inverseRayLength,
                rb = across * inverseRayWidth;
              outside *=
                1 -
                smooth(clamp((1 - la * la - lb * lb) * inverseCrownShoulder));
              outsideRays *=
                1 -
                smooth(clamp((1 - ra * ra - rb * rb) * inverseCrownShoulder));
            }
            crown = 1 - outside;
            rays = 1 - outsideRays;
          }
          color = 0.045;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.34;
          if (stem === 0 && body === 0 && crown === 0) return;
          const grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color += stem * (0.34 + 0.04 * tone + 0.02 * grain - color);
          height += stem * (0.22 + 0.002 * grain - height);
          roughness += stem * (0.85 - roughness);
          occlusion += stem * (0.93 - occlusion);
          if (body > 0) {
            // A positive width floor keeps the converging longitudinal flutes
            // finite. Body/plate layers replace, rather than stack on, the stem.
            const dome = smooth(cap),
              profile = smooth(clamp(1 - by * by)),
              width = p.widthFloor + (1 - p.widthFloor) * profile,
              rib = 0.5 + 0.5 * Math.cos((TAU * p.ribs * bx) / width);
            color +=
              body *
              (0.58 +
                0.13 * dome +
                0.06 * tone +
                0.02 * grain -
                0.07 * dome * (1 - rib) -
                color);
            height +=
              body *
              (0.39 +
                0.23 * dome +
                0.035 * dome * rib +
                0.003 * grain -
                height);
            roughness +=
              body *
              (p.roughness + 0.035 * (1 - rib) + 0.015 * grain - roughness);
            occlusion +=
              body *
              (0.85 + 0.12 * dome - 0.025 * dome * (1 - rib) - occlusion);
          }
          color +=
            crown * (0.68 + 0.04 * tone + 0.015 * grain + 0.1 * rays - color);
          height += crown * (0.77 + 0.02 * rays + 0.002 * grain - height);
          roughness += crown * (0.76 - 0.045 * rays + 0.02 * grain - roughness);
          occlusion += crown * (0.95 + 0.03 * rays - occlusion);
          return;
        };
      }
      case 'safetypins': {
        const p = proceduralMaterialPresets.safetypins;
        const segments = new Float64Array(p.legs.length * 5),
          tones = new Float64Array(p.cells * p.cells);
        for (let i = 0; i < p.legs.length; i++) {
          const [ax, ay, bx, by] = p.legs[i],
            dx = bx - ax,
            dy = by - ay;
          segments[i * 5] = ax;
          segments[i * 5 + 1] = ay;
          segments[i * 5 + 2] = dx;
          segments[i * 5 + 3] = dy;
          segments[i * 5 + 4] = 1 / (dx * dx + dy * dy);
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x10611);
        const inverseWire = 1 / (p.wireRadius * p.wireRadius),
          coilSquared = p.coilRadius * p.coilRadius,
          inverseCoil = 1 / (2 * p.coilRadius * p.wireRadius),
          inverseShoulder = 1 / p.shoulder,
          inverseGuardX = 1 / p.guardHalfWidth,
          inverseGuardY = 1 / p.guardHalfHeight,
          inverseGuardShoulder = 1 / p.guardShoulder,
          inverseSlotX = 1 / p.slotHalfWidth,
          inverseSlotY = 1 / p.slotHalfHeight,
          grainField = cachedNoise(96, 96, seed ^ 0x10613);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            turn = (row + col) & 1,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = turn ? dy : dx,
            y = turn ? -dx : dy,
            ey = y - p.coilY,
            ring = (x * x + ey * ey - coilSquared) * inverseCoil,
            ringDome = clamp(1 - ring * ring),
            coil = smooth(clamp(ringDome * inverseShoulder));
          let outside = 1 - coil,
            outsideCrown = 1 - coil * smooth(ringDome);
          for (let i = 0; i < segments.length; i += 5) {
            const ex = x - segments[i],
              sy = y - segments[i + 1],
              t = clamp(
                (ex * segments[i + 2] + sy * segments[i + 3]) * segments[i + 4],
              ),
              qx = ex - t * segments[i + 2],
              qy = sy - t * segments[i + 3],
              dome = clamp(1 - (qx * qx + qy * qy) * inverseWire),
              leg = smooth(clamp(dome * inverseShoulder));
            outside *= 1 - leg;
            outsideCrown *= 1 - leg * smooth(dome);
          }
          const gx = (x - p.guardX) * inverseGuardX,
            gy = (y - p.guardY) * inverseGuardY,
            guard = smooth(
              clamp((1 - gx * gx - gy * gy) * inverseGuardShoulder),
            ),
            wire = 1 - outside;
          color = 0.045;
          height = 0.035;
          roughness = 0.94;
          occlusion = 0.3;
          if (wire === 0 && guard === 0) return;
          const crown = 1 - outsideCrown,
            tone = tones[row * p.cells + col],
            grain = grainField(u, v),
            sx = (x - p.slotX) * inverseSlotX,
            sy = (y - p.guardY) * inverseSlotY,
            slot = smooth(clamp(1 - sx * sx - sy * sy));
          // Bounded coverage/crown unions cannot double wire thickness where
          // legs touch the coil. The solid folded guard covers the needle tip.
          color +=
            wire * (0.52 + 0.21 * crown + 0.05 * tone + 0.015 * grain - color);
          height += wire * (0.485 + 0.2 * crown + 0.003 * grain - height);
          roughness +=
            wire * (p.roughness - 0.045 * crown + 0.02 * grain - roughness);
          occlusion += wire * (0.72 + 0.26 * crown - occlusion);
          color +=
            guard * (0.78 + 0.04 * tone + 0.015 * grain - 0.18 * slot - color);
          height +=
            guard * (0.78 + 0.002 * grain - p.slotDepth * slot - height);
          roughness += guard * (p.roughness + 0.04 + 0.08 * slot - roughness);
          occlusion += guard * (0.98 - 0.09 * slot - occlusion);
          return;
        };
      }
      case 'musselshells': {
        const p = proceduralMaterialPresets.musselshells;
        const shells = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 2;
            shells[i] = TAU * hash(col, row, seed ^ 0x10501);
            shells[i + 1] = hash(col, row, seed ^ 0x10503);
          }
        const inverseLength = 1 / (2 * p.halfLength),
          inverseWidth = 1 / (p.maxHalfWidth * p.maxHalfWidth),
          inverseEdge = 1 / p.edge,
          growthScale =
            (TAU * p.growthBands) / (4 * p.halfLength * p.halfLength),
          grainField = cachedNoise(96, 96, seed ^ 0x10507);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            turn = (row + col) & 1,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = turn ? dy : dx,
            y = turn ? -dx : dy;
          color = 0.045;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.33;
          if (y <= -p.halfLength || y >= p.halfLength) return;
          const hinge = y + p.halfLength,
            t = hinge * inverseLength,
            cap = (27 / 4) * t * t * (1 - t) - x * x * inverseWidth;
          if (cap <= 0) return;
          const face = smooth(clamp(cap * inverseEdge)),
            dome = smooth(clamp(cap)),
            i = (row * p.cells + col) * 2,
            // Squared hinge distance gives curved, variably spaced growth
            // fronts without a radial singularity at the pointed hinge.
            wave =
              0.5 +
              0.5 * Math.cos(growthScale * (x * x + hinge * hinge) + shells[i]),
            growth = wave ** 8,
            grain = grainField(u, v);
          color +=
            face *
            (0.32 +
              0.16 * dome +
              0.08 * shells[i + 1] -
              0.085 * growth +
              0.015 * grain -
              color);
          height +=
            face *
            (0.37 + 0.31 * dome - p.incision * growth + 0.003 * grain - height);
          roughness +=
            face * (p.roughness + 0.035 * growth + 0.02 * grain - roughness);
          occlusion += face * (0.84 + 0.13 * dome - 0.025 * growth - occlusion);
          return;
        };
      }
      case 'blackberries': {
        const p = proceduralMaterialPresets.blackberries;
        const middle = (p.rows - 1) * 0.5,
          rowStep = p.pitch * Math.sqrt(3) * 0.5;
        let count = 0;
        for (let row = 0; row < p.rows; row++)
          count += p.rows - Math.abs(row - middle);
        const centers = new Float64Array(count * 2),
          tones = new Float64Array(p.cells * p.cells * count);
        let next = 0;
        for (let row = 0; row < p.rows; row++) {
          const columns = p.rows - Math.abs(row - middle);
          for (let col = 0; col < columns; col++) {
            centers[next++] = (col - (columns - 1) * 0.5) * p.pitch;
            centers[next++] = (row - middle) * rowStep;
          }
        }
        for (let cell = 0; cell < p.cells * p.cells; cell++)
          for (let i = 0; i < count; i++)
            tones[cell * count + i] = hash(i, cell, seed ^ 0x10411);
        const halfWidth = middle * p.pitch + p.drupeRadius,
          halfHeight = middle * rowStep + p.drupeRadius,
          inverseRadius = 1 / (p.drupeRadius * p.drupeRadius),
          inverseStretch = 1 / p.stretch,
          inverseShoulder = 1 / p.shoulder,
          grainField = cachedNoise(96, 96, seed ^ 0x10413);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            turn = (row + col) & 1,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = turn ? dy : dx,
            y = (turn ? -dx : dy) * inverseStretch;
          color = 0.055;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.33;
          if (Math.abs(x) >= halfWidth || Math.abs(y) >= halfHeight) return;
          let outside = 1,
            weight = 0,
            domeWeight = 0,
            toneWeight = 0;
          const offset = (row * p.cells + col) * count;
          for (let i = 0; i < count; i++) {
            const ex = x - centers[i * 2],
              ey = y - centers[i * 2 + 1],
              dome = 1 - (ex * ex + ey * ey) * inverseRadius;
            if (dome <= 0) continue;
            const drupe = smooth(clamp(dome * inverseShoulder));
            outside *= 1 - drupe;
            weight += drupe;
            domeWeight += drupe * dome;
            toneWeight += drupe * tones[offset + i];
          }
          if (weight > 0) {
            // Normalize the individual convex crowns, rather than stacking
            // overlapping drupelets or introducing a hard nearest-lobe seam.
            const berry = 1 - outside,
              dome = domeWeight / weight,
              tone = toneWeight / weight,
              grain = grainField(u, v);
            color +=
              berry * (0.44 + 0.3 * dome + 0.08 * tone + 0.015 * grain - color);
            height += berry * (0.38 + 0.35 * dome + 0.003 * grain - height);
            roughness +=
              berry * (p.roughness - 0.06 * dome + 0.025 * grain - roughness);
            occlusion += berry * (0.62 + 0.36 * dome - occlusion);
          }
          return;
        };
      }
      case 'haircombs': {
        const p = proceduralMaterialPresets.haircombs;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x10321);
        const pitch = p.toothSpan / (p.teeth - 1),
          inversePitch = 1 / pitch,
          inverseWidth = 1 / p.toothHalfWidth,
          inverseLength = 1 / (p.tipY - p.rootY),
          inverseTip = 1 / p.tipShoulder,
          inverseBevel = 1 / p.bevel,
          grainField = cachedNoise(96, 96, seed ^ 0x10323);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            vertical = (row + col) & 1,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = vertical ? dy : dx,
            y = vertical ? -dx : dy,
            spine =
              smooth(clamp((p.spineHalfWidth - Math.abs(x)) * inverseBevel)) *
              smooth(clamp((y - p.spineTop) * inverseBevel)) *
              smooth(clamp((p.spineBottom - y) * inverseBevel)),
            tooth = Math.floor((x - p.firstTooth) * inversePitch + 0.5);
          let tines = 0;
          // One nearest tooth suffices: both support edges end before its
          // ownership boundary. The tapered width and rounded tip are C1.
          if (tooth >= 0 && tooth < p.teeth && y > p.rootY && y < p.tipY) {
            const t = smooth(clamp((y - p.rootY) * inverseLength)),
              across =
                ((x - p.firstTooth - tooth * pitch) * inverseWidth) /
                (1 - p.taper * t);
            tines =
              smooth(clamp(1 - across * across)) *
              smooth(clamp((y - p.rootY) * inverseBevel)) *
              smooth(clamp((p.tipY - y) * inverseTip));
          }
          const face = 1 - (1 - spine) * (1 - tines),
            grain = grainField(u, v);
          color =
            0.055 +
            face * (0.63 + 0.08 * tones[row * p.cells + col] + 0.015 * grain);
          height = 0.025 + face * (0.595 + 0.002 * grain);
          roughness = 0.94 + face * (p.roughness - 0.94 + 0.018 * grain);
          occlusion = 0.4 + 0.58 * face;
          return;
        };
      }
      case 'corrugatedplasticedge': {
        const p = proceduralMaterialPresets.corrugatedplasticedge;
        const tones = new Float64Array(p.rows);
        for (let row = 0; row < p.rows; row++)
          tones[row] = hash(0, row, seed ^ 0x10291);
        const inverseLiner = 1 / p.linerHalfWidth,
          inverseWeb = 1 / p.webHalfWidth,
          inverseJoint = 1 / p.jointShoulder,
          grainField = cachedNoise(64, 64, seed ^ 0x10293);
        return () => {
          const vc = v * p.rows,
            row = Math.floor(vc),
            x = fract(u * p.columns + (row & 1) * 0.5) - 0.5,
            y = fract(vc) - 0.5,
            linerDistance = (Math.abs(y) - p.linerCenter) * inverseLiner,
            liner = smooth(clamp(1 - linerDistance * linerDistance)),
            webDistance = x * inverseWeb,
            web =
              smooth(clamp(1 - webDistance * webDistance)) *
              smooth(
                clamp(
                  (p.linerCenter + p.linerHalfWidth - Math.abs(y)) *
                    inverseJoint,
                ),
              ),
            face = 1 - (1 - liner) * (1 - web),
            grain = grainField(u, v);
          // Straight ribs meet both flat skins on one flush cut face. Their
          // union never adds a second layer of height at a T-junction.
          color = 0.045 + face * (0.575 + 0.06 * tones[row] + 0.02 * grain);
          height = 0.035 + face * (0.645 + 0.003 * grain);
          roughness = 0.94 + face * (p.roughness - 0.94 + 0.02 * grain);
          occlusion = 0.26 + 0.71 * face;
          return;
        };
      }
      case 'pencilends': {
        const p = proceduralMaterialPresets.pencilends;
        const axes = new Float64Array(6),
          phases = new Float64Array(p.cells * p.cells),
          tones = new Float64Array(p.cells * p.cells);
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * i) / 3;
          axes[i * 2] = Math.cos(angle);
          axes[i * 2 + 1] = Math.sin(angle);
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = row * p.cells + col;
            phases[i] = TAU * hash(col, row, seed ^ 0x10191);
            tones[i] = hash(col, row, seed ^ 0x10193);
          }
        const inverseOuter = 1 / p.outerBevel,
          inverseWood = 1 / p.woodBevel,
          coreSquared = p.coreRadius * p.coreRadius,
          inverseCore = 1 / (coreSquared - p.coreInner * p.coreInner),
          turnCos = Math.cos(p.turn),
          turnSin = Math.sin(p.turn),
          fineField = cachedNoise(96, 96, seed ^ 0x10195);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? turnCos * dx + turnSin * dy : dx,
            y = turn ? turnCos * dy - turnSin * dx : dy;
          let outer = 1,
            wood = 1;
          for (let i = 0; i < axes.length; i += 2) {
            const plane = Math.abs(x * axes[i] + y * axes[i + 1]);
            outer *= smooth(clamp((p.apothem - plane) * inverseOuter));
            wood *= smooth(clamp((p.woodApothem - plane) * inverseWood));
          }
          color = 0.055;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.38;
          if (outer === 0) return;
          const i = row * p.cells + col,
            fine = fineField(u, v),
            grain =
              0.5 +
              0.5 *
                Math.sin(
                  TAU *
                    (p.grainFrequency * y +
                      p.grainWarp * Math.sin(TAU * 2 * x + phases[i])) +
                    phases[i],
                ),
            pores = grain ** 8,
            core =
              wood * smooth(clamp((coreSquared - x * x - y * y) * inverseCore));
          color += outer * (0.22 + 0.025 * tones[i] + 0.01 * fine - color);
          height += outer * (0.58 - height);
          roughness += outer * (p.paintRoughness - roughness);
          occlusion += outer * (0.96 - occlusion);
          // The pale wood is a cut face, not a sharpened cone; the dark
          // graphite is a slightly lower opaque core rather than an empty bore.
          color +=
            wood *
            (0.72 + 0.09 * grain + 0.035 * tones[i] - 0.035 * pores - color);
          height += wood * (0.54 + 0.003 * fine - 0.002 * pores - height);
          roughness += wood * (p.roughness + 0.035 * pores - roughness);
          occlusion += wood * (0.97 - occlusion);
          color += core * (0.035 + 0.015 * fine - color);
          height += core * (0.525 + 0.001 * fine - height);
          roughness += core * (p.coreRoughness - roughness);
          occlusion += core * (0.95 - occlusion);
          return;
        };
      }
      case 'carabiners': {
        const p = proceduralMaterialPresets.carabiners;
        const segments = new Float64Array(p.vertices.length * 7),
          tones = new Float64Array(p.cells * p.cells);
        for (let i = 0; i < p.vertices.length; i++) {
          const a = p.vertices[i],
            b = p.vertices[(i + 1) % p.vertices.length],
            dx = b[0] - a[0],
            dy = b[1] - a[1],
            inverseLength = 1 / Math.sqrt(dx * dx + dy * dy),
            j = i * 7;
          segments[j] = a[0];
          segments[j + 1] = a[1];
          segments[j + 2] = dx;
          segments[j + 3] = dy;
          segments[j + 4] = inverseLength * inverseLength;
          segments[j + 5] = -dy * inverseLength;
          segments[j + 6] = dx * inverseLength;
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x10091);
        const roundingSquared = p.rounding * p.rounding,
          inverseBand = 1 / p.frameBand,
          inverseShoulder = 1 / p.shoulder,
          inverseGate = 1 / p.gateShoulder,
          inverseJoint = 1 / p.jointWidth,
          inversePin = 1 / (p.pinRadius * p.pinRadius),
          gateIndex = p.gateEdge * 7,
          pinX =
            segments[gateIndex] +
            p.pinAt * segments[gateIndex + 2] +
            p.rounding * segments[gateIndex + 5],
          pinY =
            segments[gateIndex + 1] +
            p.pinAt * segments[gateIndex + 3] +
            p.rounding * segments[gateIndex + 6],
          grainField = cachedNoise(8, 128, seed ^ 0x10093);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? dy : dx,
            y = turn ? -dx : dy;
          color = 0.055;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.36;
          let outside = false,
            best = Infinity,
            owner = 0,
            along = 0;
          for (let i = 0; i < segments.length; i += 7) {
            const sx = x - segments[i],
              sy = y - segments[i + 1],
              ex = segments[i + 2],
              ey = segments[i + 3],
              t = clamp((sx * ex + sy * ey) * segments[i + 4]),
              qx = sx - t * ex,
              qy = sy - t * ey,
              q = qx * qx + qy * qy;
            if (ex * sy - ey * sx > 0) outside = true;
            if (q < best) {
              best = q;
              owner = i;
              along = t;
            }
          }
          // The inner exclusion is hidden in a zero-support strip around
          // the polygon. Its exterior offset has tangent segment/corner joins.
          if (!outside) return;
          const distance = (best - roundingSquared) * inverseBand,
            dome = clamp(1 - distance * distance),
            face = smooth(clamp(dome * inverseShoulder));
          if (face === 0) return;
          let gate = 0,
            joints = 0;
          if (owner === gateIndex) {
            gate =
              smooth(clamp((along - p.gateStart) * inverseGate)) *
              smooth(clamp((p.gateEnd - along) * inverseGate));
            const start = (along - p.gateStart) * inverseJoint,
              end = (along - p.gateEnd) * inverseJoint;
            joints =
              smooth(clamp(1 - start * start)) + smooth(clamp(1 - end * end));
          }
          const grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color +=
            face *
            (0.56 +
              0.2 * dome +
              0.03 * tone +
              0.012 * grain +
              0.12 * gate -
              0.2 * joints -
              color);
          height +=
            face * (0.4 + 0.12 * dome + 0.035 * gate - 0.07 * joints - height);
          roughness +=
            face *
            (p.roughness -
              0.05 * dome -
              0.025 * gate +
              0.12 * joints -
              roughness);
          occlusion += face * (0.96 - 0.12 * joints - occlusion);
          const px = x - pinX,
            py = y - pinY,
            pinDome = clamp(1 - (px * px + py * py) * inversePin),
            pin = face * smooth(clamp(pinDome * inverseShoulder));
          color += pin * (0.9 - color);
          height += pin * (0.68 + 0.04 * pinDome - height);
          roughness += pin * (0.21 - roughness);
          occlusion += pin * (0.99 - occlusion);
          return;
        };
      }
      case 'cottonbolls': {
        const p = proceduralMaterialPresets.cottonbolls;
        const axes = new Float64Array(p.tufts * 4),
          tones = new Float64Array(p.cells * p.cells);
        for (let i = 0; i < p.tufts; i++) {
          const angle = (TAU * i) / p.tufts;
          axes[i * 4] = Math.cos(angle);
          axes[i * 4 + 1] = Math.sin(angle);
          axes[i * 4 + 2] = Math.cos(angle + Math.PI / 4);
          axes[i * 4 + 3] = Math.sin(angle + Math.PI / 4);
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xff91);
        const inverseTuft = 1 / (p.tuftRadius * p.tuftRadius),
          inverseTuftShoulder = 1 / p.tuftShoulder,
          inverseBractLength = 1 / p.bractLength,
          inverseBractWidth = 1 / p.bractWidth,
          inverseBractShoulder = 1 / p.bractShoulder,
          fineField = cachedNoise(256, 256, seed ^ 0xff93),
          napField = cachedNoise(96, 96, seed ^ 0xff95);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? (dx + dy) * Math.SQRT1_2 : dx,
            y = turn ? (dy - dx) * Math.SQRT1_2 : dy;
          let outsideTuft = 1,
            outsideBract = 1,
            weight = 0,
            domeWeight = 0;
          for (let i = 0; i < axes.length; i += 4) {
            const tx = x - p.tuftDistance * axes[i],
              ty = y - p.tuftDistance * axes[i + 1],
              dome = clamp(1 - (tx * tx + ty * ty) * inverseTuft),
              tuft = smooth(clamp(dome * inverseTuftShoulder)),
              along =
                (x * axes[i + 2] + y * axes[i + 3] - p.bractDistance) *
                inverseBractLength,
              across = (y * axes[i + 2] - x * axes[i + 3]) * inverseBractWidth,
              cap = clamp(1 - along * along),
              bract = smooth(
                clamp((cap * cap - across * across) * inverseBractShoulder),
              );
            outsideTuft *= 1 - tuft;
            outsideBract *= 1 - bract;
            weight += tuft;
            domeWeight += tuft * dome;
          }
          const bract = 1 - outsideBract,
            fine = fineField(u, v),
            fiber = 0.65 * fine + 0.35 * napField(u, v);
          color = 0.055 + bract * (0.18 + 0.05 * fine);
          height = 0.025 + bract * 0.145;
          roughness = 0.94 - bract * 0.09;
          occlusion = 0.38 + bract * 0.52;
          if (weight > 0) {
            // Normalize overlapping tufts instead of adding their thickness:
            // four separate crowns stay above a lower shared center.
            const cotton = 1 - outsideTuft,
              dome = domeWeight / weight,
              tone = tones[row * p.cells + col];
            color +=
              cotton *
              (0.78 + 0.12 * dome + 0.035 * tone - 0.045 * fiber - color);
            height += cotton * (0.5 + 0.22 * dome + 0.005 * fine - height);
            roughness +=
              cotton * (p.roughness - 0.02 + 0.06 * fiber - roughness);
            occlusion += cotton * (0.86 + 0.12 * dome - occlusion);
          }
          return;
        };
      }
      case 'waxseals': {
        const p = proceduralMaterialPresets.waxseals;
        const phases = new Float64Array(p.cells * p.cells),
          tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = row * p.cells + col;
            phases[i] = TAU * hash(col, row, seed ^ 0xfe91);
            tones[i] = hash(col, row, seed ^ 0xfe93);
          }
        const edgeGuardSquared = p.edgeGuard * p.edgeGuard,
          emblemGuardSquared = p.emblemGuard * p.emblemGuard,
          inverseRadius = 1 / (p.radius * p.radius),
          stampSquared = p.stampRadius * p.stampRadius,
          inverseStamp = 1 / (stampSquared - p.stampCore * p.stampCore),
          ringSquared = p.ringRadius * p.ringRadius,
          inverseRing = 1 / p.ringBand,
          grainField = cachedNoise(96, 96, seed ^ 0xfe95);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            q = x * x + y * y,
            i = Math.floor(vc) * p.cells + Math.floor(uc),
            phase = phases[i],
            angle = q > emblemGuardSquared ? Math.atan2(y, x) : 0;
          let body = 1,
            emblem = 1;
          // Both angular masks are already fully covered at their guards.
          // Their phase cannot leak into the constant center or the wax dome.
          if (q > edgeGuardSquared) {
            const radius =
              p.radius +
              p.rippleA * Math.cos(p.wavesA * angle + phase) +
              p.rippleB * Math.cos(p.wavesB * angle + 0.7 * phase);
            body = smooth(
              clamp(
                (radius * radius - q) /
                  (radius * radius - (radius - p.edgeBevel) ** 2),
              ),
            );
          }
          if (q > emblemGuardSquared) {
            const radius =
              p.emblemRadius +
              p.emblemDepth * Math.cos(p.emblemLobes * (angle + phase));
            emblem = smooth(
              clamp(
                (radius * radius - q) /
                  (radius * radius - (radius - p.emblemBevel) ** 2),
              ),
            );
          }
          const dome = 1 - smooth(clamp(q * inverseRadius)),
            stamp = smooth(clamp((stampSquared - q) * inverseStamp)),
            ringDistance = (q - ringSquared) * inverseRing,
            ring = smooth(clamp(1 - ringDistance * ringDistance)),
            grain = grainField(u, v);
          color =
            0.065 +
            body *
              (0.395 +
                0.12 * dome +
                0.04 * tones[i] +
                0.015 * grain -
                0.055 * stamp +
                0.09 * ring +
                0.16 * emblem);
          height =
            0.025 +
            body *
              (0.255 +
                0.08 * dome -
                0.07 * stamp +
                0.1 * ring +
                0.18 * emblem +
                0.001 * grain);
          roughness =
            0.94 +
            body *
              (p.roughness -
                0.94 +
                0.055 * stamp -
                0.06 * ring -
                0.075 * emblem +
                0.01 * grain);
          occlusion =
            0.38 + body * (0.52 - 0.06 * stamp + 0.06 * ring + 0.08 * emblem);
          return;
        };
      }
      case 'scoredmango': {
        const p = proceduralMaterialPresets.scoredmango;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xfd91);
        const inverseSkinX = 1 / p.skinWidth,
          inverseSkinY = 1 / p.skinLength,
          inverseFleshX = 1 / p.fleshWidth,
          inverseFleshY = 1 / p.fleshLength,
          inverseShoulder = 1 / p.shoulder,
          inversePitchX = 1 / p.pitchX,
          inversePitchY = 1 / p.pitchY,
          inverseCut = 1 / p.cutShoulder,
          grainField = cachedNoise(96, 96, seed ^ 0xfd93);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? dy : dx,
            y = turn ? -dx : dy,
            skinDome = clamp(
              1 - (x * inverseSkinX) ** 2 - (y * inverseSkinY) ** 2,
            ),
            skin = smooth(clamp(skinDome * inverseShoulder)),
            fleshDome = clamp(
              1 - (x * inverseFleshX) ** 2 - (y * inverseFleshY) ** 2,
            ),
            flesh = smooth(clamp(fleshDome * inverseShoulder)),
            grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color = 0.055 + skin * (0.125 + 0.06 * grain);
          height = 0.025 + skin * (0.145 + 0.05 * skinDome);
          roughness = 0.94 + skin * (0.76 - 0.94);
          occlusion = 0.38 + skin * 0.42;
          color +=
            flesh *
            (0.48 + 0.03 * fleshDome + 0.03 * tone + 0.015 * grain - color);
          height += flesh * (0.27 + 0.06 * fleshDome - height);
          roughness += flesh * (p.roughness + 0.14 - roughness);
          occlusion += flesh * (0.74 - occlusion);
          const gx = fract(x * inversePitchX) - 0.5,
            gy = fract(y * inversePitchY + 0.5) - 0.5,
            cube =
              flesh *
              smooth(clamp((0.5 - Math.abs(gx) - p.cutGap) * inverseCut)) *
              smooth(clamp((0.5 - Math.abs(gy) - p.cutGap) * inverseCut)),
            crown = clamp(1 - 4 * gx * gx) * clamp(1 - 4 * gy * gy);
          // Raised flesh blocks stop at the inner ellipse, leaving an intact
          // skin rim and a continuous lower floor beneath the cross cuts.
          color +=
            cube * (0.72 + 0.15 * crown + 0.03 * tone + 0.015 * grain - color);
          height +=
            cube *
            (0.48 + 0.24 * crown + 0.03 * fleshDome + 0.002 * grain - height);
          roughness +=
            cube * (p.roughness - 0.075 * crown + 0.01 * grain - roughness);
          occlusion += cube * (0.96 + 0.02 * crown - occlusion);
          return;
        };
      }
      case 'hextruchettiles': {
        const p = proceduralMaterialPresets.hextruchettiles;
        const turns = new Uint8Array(p.columns * p.rows),
          tones = new Float64Array(p.columns * p.rows),
          centers = new Float64Array(12),
          pitch = Math.sqrt(3) / 2,
          tileHeight = p.rows * pitch,
          inversePitch = 1 / pitch,
          inverseShoulder = 1 / p.shoulder,
          inverseBand = 1 / p.arcBand,
          arcSquared = p.arcRadius * p.arcRadius,
          grainField = cachedNoise(64, 64, seed ^ 0xfc93);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++) {
            const i = row * p.columns + col;
            turns[i] = hash(col, row, seed ^ 0xfc91) < 0.5 ? 0 : 1;
            tones[i] = hash(col, row, seed ^ 0xfc95);
          }
        for (let turn = 0; turn < 2; turn++)
          for (let arc = 0; arc < 3; arc++) {
            const angle = Math.PI / 6 + ((2 * arc + turn) * Math.PI) / 3,
              i = turn * 6 + arc * 2;
            centers[i] = p.vertexRadius * Math.cos(angle);
            centers[i + 1] = p.vertexRadius * Math.sin(angle);
          }
        return () => {
          const x = u * p.columns,
            y = v * tileHeight,
            row = Math.floor(y * inversePitch);
          let best = Infinity,
            dx = 0,
            dy = 0,
            owner = 0;
          // Only the two bracketing rows can own a nearest center; within
          // either row its rounded column is the closest candidate.
          for (let oy = 0; oy <= 1; oy++) {
            const cy = row + oy,
              offset = (cy & 1) * 0.5,
              cx = Math.round(x - offset),
              px = x - cx - offset,
              py = y - cy * pitch,
              distance = px * px + py * py;
            if (distance < best) {
              best = distance;
              dx = px;
              dy = py;
              owner =
                (((cy % p.rows) + p.rows) % p.rows) * p.columns +
                (((cx % p.columns) + p.columns) % p.columns);
            }
          }
          const face =
              smooth(
                clamp((p.apothem - Math.abs(dx) - p.grout) * inverseShoulder),
              ) *
              smooth(
                clamp(
                  (p.apothem - Math.abs(0.5 * dx + pitch * dy) - p.grout) *
                    inverseShoulder,
                ),
              ) *
              smooth(
                clamp(
                  (p.apothem - Math.abs(0.5 * dx - pitch * dy) - p.grout) *
                    inverseShoulder,
                ),
              ),
            first = turns[owner] * 6;
          let motif = 0;
          for (let i = first; i < first + 6; i += 2) {
            const ax = dx - centers[i],
              ay = dy - centers[i + 1],
              d = (ax * ax + ay * ay - arcSquared) * inverseBand;
            motif += smooth(clamp(1 - d * d));
          }
          const grain = grainField(u, v);
          color =
            0.2 + face * (0.025 * tones[owner] + 0.61 * motif + 0.008 * grain);
          // All three arcs are glaze pigment on one flat ceramic face.
          height = face * (0.58 + 0.002 * grain);
          roughness =
            0.83 + face * (p.roughness - 0.83 - 0.045 * motif + 0.008 * grain);
          occlusion = 0.53 + 0.46 * face;
          mortar = 1 - face;
          return;
        };
      }
      case 'beltbuckles': {
        const p = proceduralMaterialPresets.beltbuckles;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xfb91);
        const straightX = p.halfWidth - p.cornerRadius,
          straightY = p.halfHeight - p.cornerRadius,
          inverseFrame = 1 / (p.frameRadius * p.frameRadius),
          inverseBar = 1 / (p.barRadius * p.barRadius),
          inverseShoulder = 1 / p.shoulder,
          inverseTongue = 1 / p.tongueBevel,
          inverseTaper = 1 / p.taperRun,
          pivotSquared = p.pivotRadius * p.pivotRadius,
          inversePivot = 1 / (pivotSquared - p.pivotCore * p.pivotCore),
          grainField = cachedNoise(8, 128, seed ^ 0xfb93);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? dy : dx,
            y = turn ? -dx : dy,
            qx = Math.abs(x) - straightX,
            qy = Math.abs(y) - straightY,
            ox = Math.max(qx, 0),
            oy = Math.max(qy, 0),
            distance =
              Math.sqrt(ox * ox + oy * oy) +
              Math.min(Math.max(qx, qy), 0) -
              p.cornerRadius,
            frameDome = clamp(1 - distance * distance * inverseFrame),
            frame = smooth(clamp(frameDome * inverseShoulder)),
            bx = x - p.barX,
            by = Math.max(Math.abs(y) - p.halfHeight, 0),
            barDome = clamp(1 - (bx * bx + by * by) * inverseBar),
            bar = smooth(clamp(barDome * inverseShoulder)),
            grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color = 0.05 + bar * (0.43 + 0.17 * barDome + 0.012 * grain);
          height = 0.025 + bar * (0.315 + 0.12 * barDome);
          roughness = 0.92 + bar * (0.32 - 0.92);
          occlusion = 0.36 + bar * 0.59;
          // The frame hides the lower crossbar ends; the tongue sits above
          // both, and its pivot cap hides the narrow root rather than adding
          // the intersecting profiles together.
          color +=
            frame *
            (0.54 + 0.22 * frameDome + 0.04 * tone + 0.012 * grain - color);
          height += frame * (0.4 + 0.13 * frameDome - height);
          roughness += frame * (p.roughness - 0.04 * frameDome - roughness);
          occlusion += frame * (0.95 - occlusion);
          const width =
              p.tongueWidth *
              (1 - p.taper * smooth(clamp((x - p.taperStart) * inverseTaper))),
            tongueDome = clamp(1 - (y / width) ** 2),
            tongue =
              smooth(clamp(tongueDome * inverseShoulder)) *
              smooth(clamp((x - p.tongueStart) * inverseTongue)) *
              smooth(clamp((p.tongueEnd - x) * inverseTongue)),
            pivotQ = bx * bx + y * y,
            pivot = smooth(clamp((pivotSquared - pivotQ) * inversePivot)),
            pivotDome = clamp(1 - pivotQ / pivotSquared);
          color += tongue * (0.69 + 0.13 * tongueDome + 0.012 * grain - color);
          height += tongue * (0.64 + 0.08 * tongueDome - height);
          roughness += tongue * (0.24 - roughness);
          occlusion += tongue * (0.98 - occlusion);
          color += pivot * (0.75 + 0.12 * pivotDome - color);
          height += pivot * (0.73 + 0.05 * pivotDome - height);
          roughness += pivot * (0.23 - roughness);
          occlusion += pivot * (0.99 - occlusion);
          return;
        };
      }
      case 'greenpeapods': {
        const p = proceduralMaterialPresets.greenpeapods;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xfa91);
        const inverseLength = 1 / p.halfLength,
          inverseWidth = 1 / p.halfWidth,
          inverseShoulder = 1 / p.shoulder,
          inverseSeam = 1 / p.seamRange,
          inversePitch = 1 / p.peaPitch,
          inversePeaWidth = 1 / p.peaWidth,
          inversePeaLength = 1 / p.peaLength,
          inverseStemLength = 1 / p.stemLength,
          inverseStemWidth = 1 / p.stemWidth,
          middle = (p.peas - 1) / 2,
          grainField = cachedNoise(96, 96, seed ^ 0xfa93);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            sign = (col + row) & 1 ? -1 : 1,
            x = (dx + sign * dy) * Math.SQRT1_2,
            y = (dy - sign * dx) * Math.SQRT1_2,
            cap = clamp(1 - (y * inverseLength) ** 2),
            across = x - p.curve * cap,
            lens = cap * cap - (across * inverseWidth) ** 2,
            pod = smooth(clamp(lens * inverseShoulder)),
            stem = smooth(
              clamp(
                (1 -
                  (x * inverseStemWidth) ** 2 -
                  ((y - p.stemY) * inverseStemLength) ** 2) *
                  inverseShoulder,
              ),
            );
          color = 0.055 + stem * 0.3;
          height = 0.025 + stem * 0.165;
          roughness = 0.94 - stem * 0.21;
          occlusion = 0.38 + stem * 0.52;
          if (pod === 0) return;
          // The five compact pea bulges stay covered by the shell; nearest
          // centers change in the clear gaps between their supports.
          const owner = Math.max(
              0,
              Math.min(p.peas - 1, Math.floor(y * inversePitch + middle + 0.5)),
            ),
            peaY = (y - (owner - middle) * p.peaPitch) * inversePeaLength,
            peaX = across * inversePeaWidth,
            pea = smooth(clamp(1 - peaX * peaX - peaY * peaY)),
            seam = 1 - smooth(clamp(lens * inverseSeam)),
            dome = clamp(lens),
            grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color +=
            pod *
            (0.38 +
              0.14 * dome +
              0.18 * pea +
              0.15 * seam +
              0.04 * tone +
              0.015 * grain -
              color);
          height +=
            pod *
            (0.28 +
              0.16 * dome +
              0.24 * pea +
              0.14 * seam +
              0.003 * grain -
              height);
          roughness +=
            pod *
            (p.roughness -
              0.065 * pea -
              0.04 * seam +
              0.015 * grain -
              roughness);
          occlusion += pod * (0.87 + 0.1 * pea + 0.08 * seam - occlusion);
          return;
        };
      }
      case 'togglebuttons': {
        const p = proceduralMaterialPresets.togglebuttons;
        const tones = new Float64Array(p.cells * p.cells),
          phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = row * p.cells + col;
            tones[i] = hash(col, row, seed ^ 0xf991);
            phases[i] = TAU * hash(col, row, seed ^ 0xf993);
          }
        const inverseLength = 1 / p.halfLength,
          inverseWidth = 1 / p.halfWidth,
          inverseShoulder = 1 / p.shoulder,
          holeSquared = p.holeRadius * p.holeRadius,
          inverseHole = 1 / (holeSquared - p.holeCore * p.holeCore);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            turn = (col + row) & 1,
            x = turn ? dy : dx,
            y = turn ? -dx : dy,
            along = x * inverseLength,
            across = y * inverseWidth,
            q = along ** 4 + across * across,
            face = smooth(clamp((1 - q) * inverseShoulder));
          color = 0.06;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.38;
          if (face === 0) return;
          const i = row * p.cells + col,
            crown = clamp(1 - q),
            grain =
              0.5 +
              0.5 *
                Math.sin(
                  TAU *
                    (p.grainFrequency * y +
                      0.12 * Math.sin(TAU * 1.8 * x + phases[i])) +
                    phases[i],
                ),
            pores = grain ** 10;
          color +=
            face *
            (0.39 +
              0.14 * grain +
              0.05 * tones[i] +
              0.12 * crown -
              0.07 * pores -
              color);
          height += face * (0.2 + 0.46 * crown + 0.006 * grain - height);
          roughness +=
            face * (p.roughness - 0.05 * crown + 0.025 * pores - roughness);
          occlusion += face * (0.86 + 0.12 * crown - occlusion);
          // The nearest bore changes only on the solid middle of the barrel,
          // well outside either compact hole; the pit never leaks past the wood.
          const hx = Math.abs(x) - p.holeOffset,
            hole =
              face *
              smooth(clamp((holeSquared - hx * hx - y * y) * inverseHole));
          color += hole * (0.075 - color);
          height += hole * (0.06 - height);
          roughness += hole * (0.9 - roughness);
          occlusion += hole * (0.23 - occlusion);
          return;
        };
      }
      case 'foldingfans': {
        const p = proceduralMaterialPresets.foldingfans;
        const axes = new Float64Array((p.folds + 1) * 2),
          tones = new Float64Array(p.cells * p.cells),
          step = (2 * p.halfAngle) / p.folds;
        for (let i = 0; i <= p.folds; i++) {
          const angle = -p.halfAngle + i * step;
          axes[i * 2] = Math.sin(angle);
          axes[i * 2 + 1] = Math.cos(angle);
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xf891);
        const radiusSquared = p.radius * p.radius,
          innerSquared = p.innerRadius * p.innerRadius,
          inverseOuter = 1 / (radiusSquared - (p.radius - p.radialBevel) ** 2),
          inverseInner =
            1 / ((p.innerRadius + p.radialBevel) ** 2 - innerSquared),
          pivotSquared = p.pivotRadius * p.pivotRadius,
          inversePivot = 1 / (pivotSquared - p.pivotShoulder * p.pivotShoulder),
          inverseRib = 1 / (p.ribWidth * p.ribWidth),
          inverseRibShoulder = 1 / p.ribShoulder,
          inverseStep = 1 / step,
          edgeSin = Math.sin(p.halfAngle),
          edgeCos = Math.cos(p.halfAngle),
          inverseEdge = 1 / p.edgeBevel,
          grainField = cachedNoise(96, 96, seed ^ 0xf893);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            flip = (col + row) & 1 ? -1 : 1,
            x = (fract(uc) - 0.5) * flip,
            y = p.pivotY - (fract(vc) - 0.5) * flip,
            q = x * x + y * y,
            pivot = smooth(clamp((pivotSquared - q) * inversePivot));
          color = 0.055;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.4;
          // The full pivot covers the angular singularity and all near-root
          // nearest-rib ties. Outside it the compact rib supports are disjoint.
          if (q > p.pivotShoulder * p.pivotShoulder) {
            const angle = Math.atan2(x, y),
              owner = Math.max(
                0,
                Math.min(
                  p.folds,
                  Math.floor((angle + p.halfAngle) * inverseStep + 0.5),
                ),
              ),
              s = axes[owner * 2],
              c = axes[owner * 2 + 1],
              along = Math.max(p.ribStart, Math.min(p.ribEnd, x * s + y * c)),
              dx = x - along * s,
              dy = y - along * c,
              ribQ = (dx * dx + dy * dy) * inverseRib,
              rib = smooth(clamp((1 - ribQ) * inverseRibShoulder)),
              ribDome = clamp(1 - ribQ);
            color += rib * (0.34 + 0.12 * ribDome - color);
            height += rib * (0.2 + 0.05 * ribDome - height);
            roughness += rib * (0.65 - roughness);
            occlusion += rib * (0.94 - occlusion);
            const paper =
              smooth(clamp((radiusSquared - q) * inverseOuter)) *
              smooth(clamp((q - innerSquared) * inverseInner)) *
              smooth(
                clamp((y * edgeSin - Math.abs(x) * edgeCos) * inverseEdge),
              );
            if (paper > 0) {
              const fold =
                  0.5 +
                  0.5 * Math.cos(TAU * (angle + p.halfAngle) * inverseStep),
                grain = grainField(u, v),
                tone = tones[row * p.cells + col];
              color +=
                paper *
                (0.64 + 0.16 * fold + 0.05 * tone + 0.015 * grain - color);
              height += paper * (0.36 + 0.18 * fold + 0.003 * grain - height);
              roughness +=
                paper * (p.roughness - 0.08 * fold + 0.015 * grain - roughness);
              occlusion += paper * (0.8 + 0.18 * fold - occlusion);
            }
          }
          color += pivot * (0.26 - color);
          height += pivot * (0.3 - height);
          roughness += pivot * (0.6 - roughness);
          occlusion += pivot * (0.98 - occlusion);
          return;
        };
      }
      case 'succulentrosettes': {
        const p = proceduralMaterialPresets.succulentrosettes;
        const stride = p.whorls.length * p.leaves * 7,
          leaves = new Float64Array(p.cells * p.cells * stride);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const base = (row * p.cells + col) * stride,
              phase = TAU * hash(col, row, seed ^ 0xf781);
            for (let ring = 0; ring < p.whorls.length; ring++) {
              const whorl = p.whorls[ring];
              for (let leaf = 0; leaf < p.leaves; leaf++) {
                const i = base + (ring * p.leaves + leaf) * 7,
                  angle = phase + (TAU * (leaf + whorl[4])) / p.leaves;
                leaves[i] = Math.cos(angle);
                leaves[i + 1] = Math.sin(angle);
                leaves[i + 2] = whorl[0];
                leaves[i + 3] = 1 / whorl[1];
                leaves[i + 4] = 1 / whorl[2];
                leaves[i + 5] = whorl[3];
                leaves[i + 6] =
                  0.36 +
                  0.04 * ring +
                  0.06 *
                    hash(
                      col * p.leaves + leaf,
                      row * p.whorls.length + ring,
                      seed ^ 0xf783,
                    );
              }
            }
          }
        const inverseShoulder = 1 / p.shoulder,
          radiusSquared = p.radiusLimit * p.radiusLimit,
          grainField = cachedNoise(96, 96, seed ^ 0xf785);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          color = 0.07;
          height = 0.025;
          roughness = 0.94;
          occlusion = 0.38;
          if (x * x + y * y >= radiusSquared) return;
          const base = (Math.floor(vc) * p.cells + Math.floor(uc)) * stride,
            end = base + stride,
            grain = grainField(u, v);
          // Outer leaves first; inner whorls hide their narrow bases. Every
          // spoon-shaped leaf is compact, including the longitudinal cutoff.
          for (let i = base; i < end; i += 7) {
            const along =
              (x * leaves[i] + y * leaves[i + 1] - leaves[i + 2]) *
              leaves[i + 3];
            if (Math.abs(along) >= 1) continue;
            const across =
                ((y * leaves[i] - x * leaves[i + 1]) * leaves[i + 4]) /
                (1 + p.taper * along),
              q = along * along + across * across,
              face = smooth(clamp((1 - q) * inverseShoulder));
            if (face === 0) continue;
            const dome = smooth(clamp(1 - q)),
              tip = smooth((along + 1) * 0.5);
            color =
              color * (1 - face) +
              face * (leaves[i + 6] + 0.22 * dome + 0.02 * grain);
            height =
              height * (1 - face) +
              face * (leaves[i + 5] + 0.17 * dome + 0.04 * tip + 0.003 * grain);
            roughness =
              roughness * (1 - face) +
              face * (p.roughness - 0.12 * dome + 0.025 * grain);
            occlusion = occlusion * (1 - face) + face * (0.84 + 0.14 * dome);
          }
          return;
        };
      }
      case 'ballchain': {
        const p = proceduralMaterialPresets.ballchain;
        const beads = new Float64Array(p.columns * p.rows * 4);
        for (let col = 0; col < p.columns; col++) {
          const phase = TAU * hash(col, 0, seed ^ 0xf671);
          for (let row = 0; row < p.rows; row++) {
            const i = (col * p.rows + row) * 4;
            beads[i] =
              p.amplitude *
              Math.sin((TAU * p.cycles * (row + 0.5)) / p.rows + phase);
            beads[i + 1] = hash(col, row, seed ^ 0xf673);
          }
          for (let row = 0; row < p.rows; row++) {
            const i = (col * p.rows + row) * 4,
              next = (col * p.rows + ((row + 1) % p.rows)) * 4,
              dx = beads[next] - beads[i];
            beads[i + 2] = dx;
            beads[i + 3] = 1 / (dx * dx + p.pitch * p.pitch);
          }
        }
        const radiusSquared = p.radius * p.radius,
          inverseRadius = 1 / radiusSquared,
          inverseBeadBevel =
            1 / (radiusSquared - (p.radius - p.beadBevel) ** 2),
          neckSquared = p.neckRadius * p.neckRadius,
          inverseNeck = 1 / neckSquared,
          inverseNeckBevel =
            1 / (neckSquared - (p.neckRadius - p.neckBevel) ** 2),
          inversePitch = 1 / p.pitch,
          grainField = cachedNoise(96, 96, seed ^ 0xf675);
        return () => {
          const x = u * p.columns,
            y = v * p.rows * p.pitch,
            col = Math.floor(x),
            row = Math.floor(y * inversePitch),
            i = (col * p.rows + row) * 4,
            dx = x - col - 0.5 - beads[i],
            dy = y - (row + 0.5) * p.pitch,
            r2 = dx * dx + dy * dy,
            bead = smooth(clamp((radiusSquared - r2) * inverseBeadBevel)),
            dome = bead > 0 ? Math.sqrt(clamp(1 - r2 * inverseRadius)) : 0,
            segment = Math.floor(y * inversePitch - 0.5),
            wrapped = ((segment % p.rows) + p.rows) % p.rows,
            j = (col * p.rows + wrapped) * 4,
            sx = x - col - 0.5 - beads[j],
            sy = y - (segment + 0.5) * p.pitch,
            t = clamp((sx * beads[j + 2] + sy * p.pitch) * beads[j + 3]),
            ex = sx - t * beads[j + 2],
            ey = sy - t * p.pitch,
            distanceSquared = ex * ex + ey * ey,
            neck = smooth(
              clamp((neckSquared - distanceSquared) * inverseNeckBevel),
            ),
            neckDome = clamp(1 - distanceSquared * inverseNeck);
          color = 0.055 * (1 - neck) + neck * (0.52 + 0.08 * neckDome);
          height = 0.025 * (1 - neck) + neck * (0.13 + 0.05 * neckDome);
          roughness = 0.56 * (1 - neck) + neck * (0.38 - 0.04 * neckDome);
          occlusion = 0.4 * (1 - neck) + 0.92 * neck;
          // A bead hides its two connector owners, including their join at
          // the center plane. Do not add the wire's height through the sphere.
          const grain = bead > 0 ? grainField(u, v) : 0;
          color =
            color * (1 - bead) +
            bead * (0.4 + 0.42 * dome + 0.025 * beads[i + 1]);
          height = height * (1 - bead) + bead * (0.2 + 0.51 * dome);
          roughness =
            roughness * (1 - bead) +
            bead * (0.23 + 0.05 * (1 - dome) + 0.015 * grain);
          occlusion = occlusion * (1 - bead) + 0.99 * bead;
          return;
        };
      }
      case 'dodecagontiles': {
        const p = proceduralMaterialPresets.dodecagontiles;
        const tones = new Float64Array(p.columns * p.rows * 3);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++) {
            const i = (row * p.columns + col) * 3;
            tones[i] = 0.3 + 0.4 * hash(col, row, seed ^ 0xf561);
            tones[i + 1] = 0.87 + 0.08 * hash(col, row, seed ^ 0xf563);
            tones[i + 2] = 0.87 + 0.08 * hash(col, row, seed ^ 0xf565);
          }
        const c = p.rowStep * 0.5,
          inner = 1 - p.grout,
          triangleInner = 2 / p.rowStep - 1 - p.grout,
          inverseBevel = 1 / p.bevel,
          grainField = cachedNoise(96, 96, seed ^ 0xf567);
        return () => {
          const x = u * p.columns * 2,
            y = v * p.rows * p.rowStep,
            baseRow = Math.floor(y / p.rowStep);
          let coverage = 0,
            pigment = 0;
          // Six opposite plane pairs clip each dodecagon. Both entering rows
          // and nearest-column owners vanish before their lookup changes.
          for (let oy = 0; oy <= 1; oy++) {
            const row = baseRow + oy,
              shifted = x - (row & 1),
              col = Math.floor((shifted + 1) * 0.5),
              dx = shifted - col * 2,
              dy = y - row * p.rowStep,
              face =
                smooth(clamp((inner - Math.abs(dx)) * inverseBevel)) *
                smooth(clamp((inner - Math.abs(dy)) * inverseBevel)) *
                smooth(
                  clamp((inner - Math.abs(c * dx + 0.5 * dy)) * inverseBevel),
                ) *
                smooth(
                  clamp((inner - Math.abs(c * dx - 0.5 * dy)) * inverseBevel),
                ) *
                smooth(
                  clamp((inner - Math.abs(0.5 * dx + c * dy)) * inverseBevel),
                ) *
                smooth(
                  clamp((inner - Math.abs(0.5 * dx - c * dy)) * inverseBevel),
                ),
              wrappedRow = ((row % p.rows) + p.rows) % p.rows,
              wrappedCol = ((col % p.columns) + p.columns) % p.columns;
            coverage += face;
            pigment += face * tones[(wrappedRow * p.columns + wrappedCol) * 3];
          }
          // The two complementary triangle families span the Voronoi corners
          // directly, so a triangle never changes tone at a hex-lattice border.
          for (let family = 0; family < 2; family++) {
            const direction = family === 0 ? 1 : -1,
              shifted = x - (baseRow & 1) - (1 - family),
              col = Math.floor((shifted + 1) * 0.5),
              dx = shifted - col * 2,
              dy = y - (baseRow + (family + 1) / 3) * p.rowStep,
              face =
                smooth(
                  clamp(
                    (triangleInner + c * dx + direction * 0.5 * dy) *
                      inverseBevel,
                  ),
                ) *
                smooth(
                  clamp(
                    (triangleInner - c * dx + direction * 0.5 * dy) *
                      inverseBevel,
                  ),
                ) *
                smooth(clamp((triangleInner - direction * dy) * inverseBevel)),
              wrappedCol = ((col % p.columns) + p.columns) % p.columns;
            coverage += face;
            pigment +=
              face * tones[(baseRow * p.columns + wrappedCol) * 3 + family + 1];
          }
          const grain = grainField(u, v);
          color = pigment + 0.012 * grain * coverage;
          height = (0.64 + 0.004 * grain) * coverage;
          mortar = 1 - coverage;
          roughness += 0.46 * mortar + 0.015 * grain * coverage;
          occlusion = 0.5 + 0.49 * coverage;
          return;
        };
      }
      case 'doorkeys': {
        const p = proceduralMaterialPresets.doorkeys;
        const keys = new Float64Array(p.cells * p.cells * 6);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 6,
              turn = Math.floor(4 * hash(col, row, seed ^ 0xf451));
            keys[i] = turn === 0 ? 1 : turn === 2 ? -1 : 0;
            keys[i + 1] = turn === 1 ? 1 : turn === 3 ? -1 : 0;
            keys[i + 2] = hash(col, row, seed ^ 0xf453);
            for (let j = 0; j < 3; j++) {
              const depth =
                p.bittingDepth +
                p.depthVariation * hash(col * 3 + j, row, seed ^ 0xf455);
              keys[i + 3 + j] = 1 / (depth * depth);
            }
          }
        const bowSquared = p.bowRadius * p.bowRadius,
          inverseBow = 1 / (bowSquared - (p.bowRadius - p.bowBevel) ** 2),
          boreSquared = p.boreRadius * p.boreRadius,
          inverseBore = 1 / (boreSquared - (p.boreRadius - p.boreBevel) ** 2),
          inverseBevel = 1 / p.bevel,
          inversePitch = 1 / p.bittingPitch,
          inverseBittingHeight = 1 / (p.bittingHeight * p.bittingHeight),
          inverseBittingShoulder = 1 / p.bittingShoulder,
          inverseGrooveWidth = 1 / (p.grooveWidth * p.grooveWidth),
          inverseGrooveEnd = 1 / p.grooveEnd,
          grainField = cachedNoise(96, 96, seed ^ 0xf457);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            i = (Math.floor(vc) * p.cells + Math.floor(uc)) * 6,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = dx * keys[i] + dy * keys[i + 1],
            y = dy * keys[i] - dx * keys[i + 1],
            by = y - p.bowY,
            r2 = x * x + by * by,
            bow = smooth(clamp((bowSquared - r2) * inverseBow)),
            bore = smooth(clamp((boreSquared - r2) * inverseBore)),
            neck =
              smooth(clamp((p.neckHalfWidth - Math.abs(x)) * inverseBevel)) *
              smooth(clamp((y - p.neckTop) * inverseBevel)) *
              smooth(clamp((p.neckBottom - y) * inverseBevel)),
            blade =
              smooth(clamp((x - p.bladeLeft) * inverseBevel)) *
              smooth(clamp((p.bladeRight - x) * inverseBevel)) *
              smooth(clamp((y - p.bladeTop) * inverseBevel)) *
              smooth(clamp((p.tipY - y) * inverseBevel)) *
              smooth(clamp((p.tipClip - x - y) * inverseBevel)),
            bitting = Math.floor((y - p.firstBitting) * inversePitch + 0.5);
          let cut = 0;
          if (bitting >= 0 && bitting < 3) {
            const ex = x - p.bladeRight,
              ey = y - p.firstBitting - bitting * p.bittingPitch;
            cut = smooth(
              clamp(
                (1 -
                  ex * ex * keys[i + 3 + bitting] -
                  ey * ey * inverseBittingHeight) *
                  inverseBittingShoulder,
              ),
            );
          }
          // Union the flat blank before cutting its bore and three bittings:
          // overlapping parts must not thicken the bow-to-blade connection.
          const face =
              (1 - (1 - bow) * (1 - neck) * (1 - blade)) *
              (1 - bore) *
              (1 - cut),
            gx = x - p.grooveX,
            groove =
              face *
              smooth(clamp(1 - gx * gx * inverseGrooveWidth)) *
              smooth(clamp((y - p.grooveTop) * inverseGrooveEnd)) *
              smooth(clamp((p.grooveBottom - y) * inverseGrooveEnd)),
            grain = grainField(u, v);
          color =
            0.07 +
            face * (0.73 + 0.07 * keys[i + 2] + 0.025 * grain) -
            0.1 * groove;
          height = 0.025 + 0.58 * face - 0.05 * groove + 0.003 * grain * face;
          roughness += 0.18 * (1 - face) + 0.065 * groove + 0.02 * grain * face;
          occlusion = 0.44 + 0.55 * face - 0.055 * groove;
          return;
        };
      }
      case 'creamcrackers': {
        const p = proceduralMaterialPresets.creamcrackers;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xf341);
        const inverseOuter = 1 / p.halfWidth ** 8,
          inverseInner = 1 / p.innerWidth ** 8,
          inverseEdge = 1 / p.edge,
          inverseInnerEdge = 1 / p.innerEdge,
          inversePitch = 1 / p.notchPitch,
          inverseNotchWidth = 1 / (p.notchWidth * p.notchWidth),
          inverseNotchDepth = 1 / (p.notchDepth * p.notchDepth),
          inverseNotchShoulder = 1 / p.notchShoulder,
          inverseHolePitch = 1 / p.holePitch,
          inverseHoleRadius = 1 / (p.holeRadius * p.holeRadius),
          inverseHoleShoulder = 1 / p.holeShoulder,
          grainField = cachedNoise(96, 96, seed ^ 0xf343),
          blisterField = cachedNoise(32, 32, seed ^ 0xf347);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            xx = x * x,
            yy = y * y,
            x4 = xx * xx,
            y4 = yy * yy,
            power = x4 * x4 + y4 * y4,
            nx =
              (fract((x + p.notchOrigin) * inversePitch) - 0.5) * p.notchPitch,
            ny =
              (fract((y + p.notchOrigin) * inversePitch) - 0.5) * p.notchPitch,
            ex = Math.abs(x) - p.notchCenter,
            ey = Math.abs(y) - p.notchCenter,
            horizontal = smooth(
              clamp(
                (1 -
                  nx * nx * inverseNotchWidth -
                  ey * ey * inverseNotchDepth) *
                  inverseNotchShoulder,
              ),
            ),
            vertical = smooth(
              clamp(
                (1 -
                  ny * ny * inverseNotchWidth -
                  ex * ex * inverseNotchDepth) *
                  inverseNotchShoulder,
              ),
            ),
            face =
              smooth(clamp((1 - power * inverseOuter) * inverseEdge)) *
              (1 - horizontal) *
              (1 - vertical),
            interior =
              face *
              smooth(clamp((1 - power * inverseInner) * inverseInnerEdge)),
            rim = face - interior,
            holeX = Math.floor(x * inverseHolePitch + 0.5),
            holeY = Math.floor(y * inverseHolePitch + 0.5);
          let holes = 0;
          // Only the central 3×3 docking grid exists. Its compact pits vanish
          // before nearest-hole ties, so there are no extra holes in the rim.
          if (Math.abs(holeX) <= 1 && Math.abs(holeY) <= 1) {
            const dx = x - holeX * p.holePitch,
              dy = y - holeY * p.holePitch;
            holes =
              interior *
              smooth(
                clamp(
                  (1 - (dx * dx + dy * dy) * inverseHoleRadius) *
                    inverseHoleShoulder,
                ),
              );
          }
          const grain = grainField(u, v),
            blisters =
              interior * smooth(clamp((blisterField(u, v) - 0.55) * 4)),
            tone = tones[Math.floor(vc) * p.cells + Math.floor(uc)];
          color =
            0.08 +
            face * (0.6 + 0.1 * tone + 0.04 * grain) -
            0.11 * rim -
            0.16 * blisters -
            0.37 * holes;
          height =
            0.035 +
            0.6 * face -
            0.04 * interior +
            0.04 * blisters -
            0.2 * holes;
          roughness +=
            0.12 * (1 - face) + 0.06 * rim - 0.05 * blisters + 0.08 * holes;
          occlusion = 0.46 + 0.52 * face - 0.34 * holes;
          return;
        };
      }
      case 'driedfigslice': {
        const p = proceduralMaterialPresets.driedfigslice;
        const grains = new Float64Array(
            p.cells * p.cells * p.seeds * p.seeds * 5,
          ),
          phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const fig = row * p.cells + col;
            phases[fig] = TAU * hash(col, row, seed ^ 0xf231);
            for (let sy = 0; sy < p.seeds; sy++)
              for (let sx = 0; sx < p.seeds; sx++) {
                const i = ((fig * p.seeds + sy) * p.seeds + sx) * 5,
                  gx = col * p.seeds + sx,
                  gy = row * p.seeds + sy,
                  angle = TAU * hash(gx, gy, seed ^ 0xf237);
                grains[i] =
                  0.5 + 2 * p.seedJitter * (hash(gx, gy, seed ^ 0xf233) - 0.5);
                grains[i + 1] =
                  0.5 + 2 * p.seedJitter * (hash(gx, gy, seed ^ 0xf235) - 0.5);
                grains[i + 2] = Math.cos(angle);
                grains[i + 3] = Math.sin(angle);
                grains[i + 4] = hash(gx, gy, seed ^ 0xf239);
              }
          }
        const gridScale = p.seeds * 0.5,
          inverseLong = 1 / (gridScale * p.seedLong),
          inverseShort = 1 / (gridScale * p.seedShort),
          inverseSeedShoulder = 1 / p.seedShoulder,
          fleshSquared = p.fleshRadius * p.fleshRadius,
          inverseFlesh = 1 / (fleshSquared - p.fleshShoulder * p.fleshShoulder),
          inverseEdge = 1 / p.edge,
          grainField = cachedNoise(96, 96, seed ^ 0xf23b);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            fig = row * p.cells + col,
            flip = (col + row) & 1 ? -1 : 1,
            y = ((fract(vc) - 0.5) * flip - p.centerY) / p.length,
            x = ((fract(uc) - 0.5) * flip) / (p.width * (1 + p.taper * y)),
            q = x * x + y * y,
            face = smooth(clamp((1 - q) * inverseEdge)),
            flesh = face * smooth(clamp((fleshSquared - q) * inverseFlesh)),
            rind = face - flesh;
          let wrinkles = 0,
            seeds = 0,
            seedTone = 0;
          // Angular creases have compact annular support, so their center
          // singularity never reaches the flesh or the constant backing.
          if (rind > 0) {
            const wave = Math.sin(p.wrinkles * Math.atan2(y, x) + phases[fig]),
              w2 = wave * wave,
              w4 = w2 * w2;
            wrinkles = rind * w4 * w4;
          }
          if (flesh > 0) {
            const sx = (x + 1) * gridScale,
              sy = (y + 1) * gridScale,
              i =
                ((fig * p.seeds + Math.floor(sy)) * p.seeds + Math.floor(sx)) *
                5,
              dx = fract(sx) - grains[i],
              dy = fract(sy) - grains[i + 1],
              a = (dx * grains[i + 2] + dy * grains[i + 3]) * inverseLong,
              b = (dy * grains[i + 2] - dx * grains[i + 3]) * inverseShort;
            // Jitter plus maximal seed radius stays inside its owner cell.
            // Flesh clips outer grains before either body or rind boundaries.
            seeds =
              flesh * smooth(clamp((1 - a * a - b * b) * inverseSeedShoulder));
            seedTone = grains[i + 4];
          }
          const grain = grainField(u, v);
          color =
            0.07 +
            face * (0.43 + 0.13 * grain) -
            0.12 * wrinkles +
            flesh * (-0.26 + 0.01 * grain);
          color = color * (1 - seeds) + seeds * (0.94 + 0.03 * seedTone);
          height =
            0.03 +
            face * (0.62 + 0.012 * grain) -
            0.035 * wrinkles -
            0.02 * flesh +
            0.035 * seeds;
          roughness +=
            0.12 * (1 - face) + 0.06 * wrinkles - flesh * (0.12 - 0.04 * grain);
          roughness = roughness * (1 - seeds) + 0.58 * seeds;
          occlusion = 0.5 + 0.48 * face - 0.04 * flesh + 0.03 * seeds;
          return;
        };
      }
      case 'hexkeys': {
        const p = proceduralMaterialPresets.hexkeys;
        const poses = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 3,
              turn = Math.floor(4 * hash(col, row, seed ^ 0xf121));
            poses[i] = turn === 0 ? 1 : turn === 2 ? -1 : 0;
            poses[i + 1] = turn === 1 ? 1 : turn === 3 ? -1 : 0;
            poses[i + 2] = hash(col, row, seed ^ 0xf123);
          }
        const inverseShoulder = 1 / p.shoulder,
          inverseEnd = 1 / p.endBevel,
          flatWidth = p.width * p.flatFraction,
          inverseFacet = 1 / (p.width - flatWidth),
          inverseRound = 1 / (2 * p.facetRound),
          inverseRamp = 1 / (1 - p.facetRound),
          grainField = cachedNoise(96, 96, seed ^ 0xf127);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            i = (Math.floor(vc) * p.cells + Math.floor(uc)) * 3,
            dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = dx * poses[i] + dy * poses[i + 1],
            y = dy * poses[i] - dx * poses[i + 1];
          let across: number,
            end = 1;
          // Tangent straight/quarter-circle joins share distance and gradient.
          // The arc's radial singularity lies outside the compact rod support.
          if (y <= p.bendY) {
            across = Math.abs(x + p.bendRadius);
            end = smooth(clamp((y - p.longEnd) * inverseEnd));
          } else if (x >= 0) {
            across = Math.abs(y - p.bendY - p.bendRadius);
            end = smooth(clamp((p.shortEnd - x) * inverseEnd));
          } else {
            const by = y - p.bendY;
            across = Math.abs(Math.sqrt(x * x + by * by) - p.bendRadius);
          }
          const face =
              end * smooth(clamp((p.width - across) * inverseShoulder)),
            t = clamp((across - flatWidth) * inverseFacet);
          // Keep a flat crown and planar side facets; only their small corner
          // bands round the linear ramp so normals remain C1 at facet joins.
          const ramp =
              t < p.facetRound
                ? t * t * inverseRound
                : t > 1 - p.facetRound
                  ? 1 - p.facetRound - (1 - t) * (1 - t) * inverseRound
                  : t - p.facetRound * 0.5,
            facet = 1 - ramp * inverseRamp,
            grain = grainField(u, v);
          color =
            0.08 +
            face * (0.36 + 0.32 * facet + 0.03 * poses[i + 2] + 0.015 * grain);
          height = 0.025 + face * (0.5 + 0.25 * facet + 0.006 * grain);
          roughness +=
            0.12 * (1 - face) + face * (-0.1 * facet + 0.035 * grain);
          occlusion = 0.48 + 0.5 * face;
          return;
        };
      }
      case 'fishscaletiles': {
        const p = proceduralMaterialPresets.fishscaletiles;
        const tones = new Float64Array(p.columns * p.rows);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++)
            tones[row * p.columns + col] =
              0.38 + 0.48 * hash(col, row, seed ^ 0xf013);
        const innerSquared = (1 - p.grout) ** 2,
          outerSquared = (1 + p.grout) ** 2,
          inverseBevel = 1 / (innerSquared - (1 - p.grout - p.bevel) ** 2),
          grainField = cachedNoise(96, 96, seed ^ 0xf017);
        return () => {
          const x = u * p.columns * 2,
            y = v * p.rows,
            baseRow = Math.floor(y);
          let clear = 1,
            coverage = 0,
            pigment = 0;
          // Subtract the next course's expanded disks from each face, rather
          // than stacking shingles. The extra course keeps grout continuous
          // before a row enters; both neighboring disks preserve C1 at ties.
          for (let oy = 2; oy >= 0; oy--) {
            const row = baseRow + oy,
              shifted = x - (row & 1),
              col = Math.floor((shifted + 1) * 0.5),
              dx = shifted - col * 2,
              dy = y - row,
              d2 = dx * dx + dy * dy;
            if (oy < 2) {
              const face =
                  clear * smooth(clamp((innerSquared - d2) * inverseBevel)),
                wrappedRow = ((row % p.rows) + p.rows) % p.rows,
                wrappedCol = ((col % p.columns) + p.columns) % p.columns;
              coverage += face;
              pigment += face * tones[wrappedRow * p.columns + wrappedCol];
            }
            if (oy > 0) {
              const other = 2 - Math.abs(dx);
              clear *=
                smooth(clamp((d2 - outerSquared) * inverseBevel)) *
                smooth(
                  clamp(
                    (other * other + dy * dy - outerSquared) * inverseBevel,
                  ),
                );
            }
          }
          const grain = grainField(u, v);
          color = 0.3 + pigment - 0.3 * coverage + 0.012 * grain * coverage;
          height = (0.62 + 0.004 * grain) * coverage;
          roughness += 0.48 * (1 - coverage) + 0.015 * grain * coverage;
          occlusion = 0.5 + 0.49 * coverage;
          mortar = 1 - coverage;
          return;
        };
      }
      case 'grommetcanvas': {
        const p = proceduralMaterialPresets.grommetcanvas;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xef01);
        const outerSquared = p.outerRadius * p.outerRadius,
          inverseOuterBand =
            1 / (outerSquared - p.outerShoulder * p.outerShoulder),
          innerSquared = p.innerRadius * p.innerRadius,
          inverseInnerBand =
            1 / (p.innerShoulder * p.innerShoulder - innerSquared),
          cutSquared = p.fabricCut * p.fabricCut,
          inverseCutBand =
            1 / (p.fabricShoulder * p.fabricShoulder - cutSquared),
          ridgeSquared = p.ridgeRadius * p.ridgeRadius,
          inverseRidgeBand = 1 / p.ridgeBand,
          inverseThreadSquared = 1 / (p.threadWidth * p.threadWidth),
          grainField = cachedNoise(96, 96, seed ^ 0xef03);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            r2 = x * x + y * y,
            outer = smooth(clamp((outerSquared - r2) * inverseOuterBand)),
            inner = smooth(clamp((r2 - innerSquared) * inverseInnerBand)),
            ring = outer * inner,
            fabric = smooth(clamp((r2 - cutSquared) * inverseCutBand)),
            d = (r2 - ridgeSquared) * inverseRidgeBand,
            dome = smooth(clamp(1 - d * d)),
            tx = fract(u * p.threads) - 0.5,
            ty = fract(v * p.threads) - 0.5,
            warp = smooth(clamp(1 - tx * tx * inverseThreadSquared)),
            weft = smooth(clamp(1 - ty * ty * inverseThreadSquared)),
            weave = warp + weft - warp * weft,
            grain = grainField(u, v),
            tone = tones[Math.floor(vc) * p.cells + Math.floor(uc)];
          color = 0.06 + fabric * (0.21 + 0.07 * weave + 0.025 * grain);
          height = 0.025 + fabric * (0.075 + 0.025 * weave + 0.003 * grain);
          roughness =
            0.95 * (1 - fabric) +
            fabric * (p.roughness + 0.06 * (1 - weave) + 0.025 * grain);
          occlusion = 0.38 + 0.59 * fabric;
          color =
            color * (1 - ring) + ring * (0.76 + 0.14 * dome + 0.025 * tone);
          height = height * (1 - ring) + ring * (0.46 + 0.14 * dome);
          roughness = roughness * (1 - ring) + ring * (0.25 - 0.05 * dome);
          occlusion = occlusion * (1 - ring) + 0.99 * ring;
          // A factor of one preserves this authored brass/cloth split. Neither
          // the canvas nor the opaque dark bore backing becomes metallic.
          metallic = ring;
          return;
        };
      }
      case 'crossbeddedsandstone': {
        const p = proceduralMaterialPresets.crossbeddedsandstone;
        const beds = new Float64Array(p.beds * 4);
        for (let row = 0; row < p.beds; row++) {
          const i = row * 4,
            sign = row & 1 ? -1 : 1;
          beds[i] =
            sign * (p.dip + p.dipVariation * hash(row, 0, seed ^ 0xdef1));
          beds[i + 1] =
            sign *
            (p.curvature + p.curvatureVariation * hash(row, 0, seed ^ 0xdef3));
          beds[i + 2] = hash(row, 0, seed ^ 0xdef5);
          beds[i + 3] = 0.19 + 0.04 * hash(row, 0, seed ^ 0xdef7);
        }
        const inverseWidthSquared = 1 / (p.laminaWidth * p.laminaWidth),
          inverseFade = 1 / p.fadeBand,
          inverseContact = 1 / p.contactWidth,
          grainField = cachedNoise(96, 96, seed ^ 0xdef9);
        return () => {
          const vc = v * p.beds,
            row = Math.floor(vc),
            f = fract(vc),
            y = f - 0.5,
            distance = Math.min(f, 1 - f),
            coverage = smooth(clamp((distance - p.fadeStart) * inverseFade)),
            contact = smooth(
              clamp((p.contactWidth - distance) * inverseContact),
            ),
            i = row * 4,
            phase =
              u * p.laminaFrequency +
              beds[i] * y +
              beds[i + 1] * y * y +
              beds[i + 2],
            d = fract(phase) - 0.5,
            lamina = smooth(clamp(1 - d * d * inverseWidthSquared)) * coverage,
            grain = grainField(u, v);
          // Each dip set terminates before the next horizontal bed owner;
          // common contact fields avoid seeded normal seams at the truncation.
          color = 0.73 + 0.025 * grain - beds[i + 3] * lamina - 0.09 * contact;
          height = 0.28 + 0.008 * grain - 0.045 * lamina - 0.025 * contact;
          roughness += 0.015 * grain + 0.03 * lamina + 0.04 * contact;
          occlusion = 0.97 - 0.035 * lamina - 0.02 * contact;
          return;
        };
      }
      case 'braidedcord': {
        const p = proceduralMaterialPresets.braidedcord;
        const tones = new Float64Array(p.columns * p.strands),
          strands = new Float64Array(p.strands * 3),
          inverseWidthSquared = 1 / (p.strandWidth * p.strandWidth),
          inverseShoulder = 1 / p.shoulder,
          inverseLayerBand = 1 / p.layerBand,
          slopeScale = ((32 / 5) * p.amplitude * p.cycles) / p.columns,
          grainField = cachedNoise(96, 96, seed ^ 0xcdf1);
        for (let col = 0; col < p.columns; col++)
          for (let i = 0; i < p.strands; i++)
            tones[col * p.strands + i] =
              0.15 + 0.3 * i + 0.03 * hash(col, i, seed ^ 0xcdf3);
        return () => {
          const uc = u * p.columns,
            col = Math.floor(uc),
            x = fract(uc) - 0.5,
            y = v * p.cycles;
          // C2 quartic waves keep tangent-corrected strand widths C1 at the
          // half-period joins; a merely C1 centerline would crease those widths.
          for (let i = 0; i < p.strands; i++) {
            const phase = y + i / p.strands,
              q = fract(phase) * 2,
              half = q < 1 ? q : q - 1,
              sign = q < 1 ? 1 : -1,
              center =
                (16 / 5) *
                p.amplitude *
                sign *
                half *
                (1 + half * half * (half - 2)),
              slope = slopeScale * sign * (1 + half * half * (4 * half - 6)),
              dx = x - center,
              cap = clamp(
                1 - (dx * dx * inverseWidthSquared) / (1 + slope * slope),
              ),
              zq = fract(phase * 2) * 2,
              zh = zq < 1 ? zq : zq - 1,
              depth =
                (16 / 5) * (zq < 1 ? 1 : -1) * zh * (1 + zh * zh * (zh - 2)),
              j = i * 3;
            strands[j] = smooth(clamp(cap * inverseShoulder));
            strands[j + 1] = smooth(cap);
            strands[j + 2] = depth;
          }
          color = 0.08;
          height = 0.06;
          occlusion = 0.4;
          let coverage = 0,
            domes = 0;
          const grain = grainField(u, v);
          for (let i = 0; i < p.strands; i++) {
            const j = i * 3,
              dome = strands[j + 1],
              depth = strands[j + 2];
            let visible = strands[j];
            if (visible === 0) continue;
            for (let other = 0; other < p.strands; other++) {
              const k = other * 3;
              if (other === i || strands[k] === 0) continue;
              visible *=
                1 -
                strands[k] *
                  smooth(
                    clamp(0.5 + (strands[k + 2] - depth) * inverseLayerBand),
                  );
            }
            // A doubled depth phase gives figure-eight plaiting, not three
            // helices. Smooth ownership lets each strand alternate over/under.
            coverage += visible;
            domes += visible * dome;
            color +=
              visible *
              (0.3 +
                0.45 * tones[col * p.strands + i] +
                0.035 * depth +
                0.08 * dome +
                0.025 * grain);
            height +=
              visible * (0.42 + 0.18 * depth + 0.16 * dome + 0.004 * grain);
            occlusion += visible * (0.45 + 0.1 * dome + 0.03 * depth);
          }
          roughness +=
            0.12 * (1 - coverage) - 0.07 * domes + 0.01 * grain * coverage;
          return;
        };
      }
      case 'punchcard': {
        const p = proceduralMaterialPresets.punchcard;
        const cardCount = p.columns * p.rows,
          slotsPerCard = p.punchColumns * p.punchRows,
          slots = new Uint8Array(cardCount * slotsPerCard),
          tones = new Float64Array(cardCount);
        for (let card = 0; card < cardCount; card++) {
          tones[card] = hash(card, 0, seed ^ 0xbce1);
          for (let col = 0; col < p.punchColumns; col++) {
            const first = Math.floor(
                hash(col, card, seed ^ 0xbce3) * p.punchRows,
              ),
              second =
                (first +
                  1 +
                  Math.floor(
                    hash(col, card, seed ^ 0xbce5) * (p.punchRows - 1),
                  )) %
                p.punchRows;
            slots[card * slotsPerCard + first * p.punchColumns + col] = 1;
            slots[card * slotsPerCard + second * p.punchColumns + col] = 1;
          }
        }
        const startX = (-(p.punchColumns - 1) * p.pitchX) / 2,
          startY = (-(p.punchRows - 1) * p.pitchY) / 2,
          inversePitchX = 1 / p.pitchX,
          inversePitchY = 1 / p.pitchY,
          inverseEdge = 1 / p.edge,
          inversePunchBevel = 1 / p.punchBevel,
          grainField = cachedNoise(96, 96, seed ^ 0xbce7);
        return () => {
          const uc = u * p.columns,
            vc = v * p.rows,
            card = Math.floor(vc) * p.columns + Math.floor(uc),
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            face =
              smooth(clamp((p.halfWidth - Math.abs(x)) * inverseEdge)) *
              smooth(clamp((p.halfHeight - Math.abs(y)) * inverseEdge)) *
              smooth(clamp((p.chamfer - x + y) * inverseEdge)),
            col = Math.max(
              0,
              Math.min(
                p.punchColumns - 1,
                Math.round((x - startX) * inversePitchX),
              ),
            ),
            row = Math.max(
              0,
              Math.min(
                p.punchRows - 1,
                Math.round((y - startY) * inversePitchY),
              ),
            ),
            dx = x - startX - col * p.pitchX,
            dy = y - startY - row * p.pitchY,
            slot =
              slots[card * slotsPerCard + row * p.punchColumns + col] *
              smooth(
                clamp((p.punchHalfWidth - Math.abs(dx)) * inversePunchBevel),
              ) *
              smooth(
                clamp((p.punchHalfHeight - Math.abs(dy)) * inversePunchBevel),
              ),
            paper = face * (1 - slot),
            grain = grainField(u, v);
          // Two distinct seeded punches per column suggest data without claiming
          // a historical encoding. Slots expose opaque backing, not cutout alpha.
          color = 0.12 + paper * (0.74 + 0.05 * tones[card] + 0.015 * grain);
          height = 0.04 + paper * (0.06 + 0.001 * grain);
          roughness +=
            0.08 * (1 - paper) - 0.04 * paper + 0.015 * grain * paper;
          occlusion = 0.6 + 0.39 * paper;
          return;
        };
      }
      case 'cherryblossom': {
        const p = proceduralMaterialPresets.cherryblossom;
        const axes = new Float64Array(p.petals * 2),
          pollenSites = new Float64Array(p.pollenCount * 2),
          tones = new Float64Array(p.cells * p.cells);
        for (let i = 0; i < p.petals; i++) {
          axes[i * 2] = Math.cos((i * TAU) / p.petals);
          axes[i * 2 + 1] = Math.sin((i * TAU) / p.petals);
        }
        for (let i = 0; i < p.pollenCount; i++) {
          pollenSites[i * 2] =
            p.pollenDistance * Math.cos((i * TAU) / p.pollenCount);
          pollenSites[i * 2 + 1] =
            p.pollenDistance * Math.sin((i * TAU) / p.pollenCount);
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0xabd1);
        const inverseLength = 1 / (p.petalLength * p.petalLength),
          inverseWidth = 1 / (p.petalWidth * p.petalWidth),
          inverseNotchLength = 1 / (p.notchLength * p.notchLength),
          inverseNotchWidth = 1 / (p.notchWidth * p.notchWidth),
          inverseShoulder = 1 / p.shoulder,
          centerSquared = p.centerRadius * p.centerRadius,
          inverseCenterShoulder = 1 / p.centerShoulder,
          inversePollen = 1 / (p.pollenRadius * p.pollenRadius),
          pollenReachSquared = (p.pollenDistance + p.pollenRadius) ** 2,
          turnCos = Math.cos(Math.PI / p.petals),
          turnSin = Math.sin(Math.PI / p.petals),
          grainField = cachedNoise(96, 96, seed ^ 0xabd3);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc);
          let x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          if ((col + row) & 1) {
            const rx = x * turnCos + y * turnSin;
            y = -x * turnSin + y * turnCos;
            x = rx;
          }
          const r2 = x * x + y * y;
          let outside = 1,
            outsideDome = 1,
            outsidePollen = 1;
          for (let i = 0; i < p.petals; i++) {
            const c = axes[i * 2],
              s = axes[i * 2 + 1],
              along = x * c + y * s,
              across = -x * s + y * c,
              dx = along - p.petalCenter,
              nx = along - p.notchCenter,
              cap = clamp(
                1 - dx * dx * inverseLength - across * across * inverseWidth,
              ),
              notch = smooth(
                clamp(
                  (1 -
                    nx * nx * inverseNotchLength -
                    across * across * inverseNotchWidth) *
                    inverseShoulder,
                ),
              );
            outside *= 1 - smooth(clamp(cap * inverseShoulder)) * (1 - notch);
            outsideDome *= 1 - smooth(cap) * (1 - notch);
          }
          // All pollen support vanishes before this gate, including its slope.
          if (r2 < pollenReachSquared)
            for (let i = 0; i < p.pollenCount; i++) {
              const dx = x - pollenSites[i * 2],
                dy = y - pollenSites[i * 2 + 1];
              outsidePollen *=
                1 -
                smooth(
                  clamp(
                    (1 - (dx * dx + dy * dy) * inversePollen) * inverseShoulder,
                  ),
                );
            }
          const flower = 1 - outside,
            dome = 1 - outsideDome,
            pollen = 1 - outsidePollen,
            center = smooth(
              clamp((centerSquared - r2) * inverseCenterShoulder),
            ),
            grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color =
            0.03 +
            flower * (0.62 + 0.12 * tone + 0.015 * grain) +
            0.1 * dome -
            0.2 * center +
            0.2 * pollen;
          height =
            0.04 +
            0.35 * flower +
            0.12 * dome -
            0.13 * center +
            0.08 * pollen +
            0.003 * grain * flower;
          roughness +=
            0.18 * (1 - flower) - 0.1 * flower + 0.1 * center - 0.05 * pollen;
          occlusion = 0.38 + 0.56 * flower - 0.16 * center + 0.04 * pollen;
          return;
        };
      }
      case 'righttriangletiles': {
        const p = proceduralMaterialPresets.righttriangletiles;
        const tones = new Float64Array(p.cells * p.cells * 2),
          inverseBevel = 1 / p.bevel,
          grainField = cachedNoise(96, 96, seed ^ 0x9ac3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 2;
            tones[i] = 0.35 + 0.15 * hash(col, row, seed ^ 0x9ac5);
            tones[i + 1] = 0.8 + 0.12 * hash(col, row, seed ^ 0x9ac7);
          }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            x = fract(uc),
            rawY = fract(vc),
            y = (col + row) & 1 ? 1 - rawY : rawY,
            border =
              smooth(clamp((Math.min(x, 1 - x) - p.grout) * inverseBevel)) *
              smooth(clamp((Math.min(y, 1 - y) - p.grout) * inverseBevel)),
            diagonal = (x - y) * Math.SQRT1_2,
            a = border * smooth(clamp((diagonal - p.grout) * inverseBevel)),
            b = border * smooth(clamp((-diagonal - p.grout) * inverseBevel)),
            face = a + b,
            i = (row * p.cells + col) * 2,
            grain = grainField(u, v);
          // Diagonal distance is perpendicular to the seam, keeping its grout
          // and bevel widths equal to the horizontal and vertical tile edges.
          color =
            0.3 +
            a * (tones[i] - 0.3) +
            b * (tones[i + 1] - 0.3) +
            0.01 * grain * face;
          height = 0.04 + face * (0.58 + 0.005 * grain);
          mortar = 1 - face;
          roughness += 0.42 * mortar - 0.06 * face + 0.015 * grain * face;
          occlusion = 0.5 + 0.48 * face;
          return;
        };
      }
      case 'coins': {
        const p = proceduralMaterialPresets.coins;
        const axes = new Float64Array(p.points * 2),
          tones = new Float64Array(p.cells * p.cells);
        for (let i = 0; i < p.points; i++) {
          axes[i * 2] = Math.cos((i * TAU) / p.points);
          axes[i * 2 + 1] = Math.sin((i * TAU) / p.points);
        }
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x8fb1);
        const turnCos = Math.cos(Math.PI / p.points),
          turnSin = Math.sin(Math.PI / p.points),
          apothem = p.starInnerRadius * turnCos,
          slope = (p.starInnerRadius * turnSin) / (p.starRadius - apothem),
          inverseBevel = 1 / p.starBevel,
          radiusSquared = p.radius * p.radius,
          rimInnerSquared = p.rimInner * p.rimInner,
          rimOuterSquared = p.rimOuter * p.rimOuter,
          inverseDiskShoulder = 1 / p.diskShoulder,
          inverseRimShoulder = 1 / p.rimShoulder,
          grainField = cachedNoise(96, 96, seed ^ 0x8fb3);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc);
          let x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          if ((col + row) & 1) {
            const rx = x * turnCos + y * turnSin;
            y = -x * turnSin + y * turnCos;
            x = rx;
          }
          const r2 = x * x + y * y,
            face = smooth(clamp((radiusSquared - r2) * inverseDiskShoulder)),
            rim =
              smooth(clamp((r2 - rimInnerSquared) * inverseRimShoulder)) *
              smooth(clamp((rimOuterSquared - r2) * inverseRimShoulder));
          let hub = 1,
            outside = 1;
          for (let i = 0; i < p.points; i++) {
            const c = axes[i * 2],
              s = axes[i * 2 + 1],
              along = x * c + y * s,
              across = -x * s + y * c,
              width = (p.starRadius - along) * slope;
            hub *= smooth(clamp((apothem - along) * inverseBevel));
            const tip =
              smooth(clamp((along - p.starBase) * inverseBevel)) *
              smooth(clamp((width - across) * inverseBevel)) *
              smooth(clamp((width + across) * inverseBevel));
            outside *= 1 - tip;
          }
          // Overlapping spike bases fill the pentagonal hub without internal
          // bevel seams; all five outer tips retain compact smooth shoulders.
          const star = 1 - outside * (1 - hub),
            grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color =
            0.06 +
            face * (0.52 + 0.08 * tone + 0.015 * grain) +
            0.14 * rim +
            0.14 * star;
          height =
            0.05 + 0.3 * face + 0.18 * rim + 0.14 * star + 0.003 * grain * face;
          roughness +=
            0.22 * (1 - face) - 0.06 * rim - 0.05 * star + 0.01 * grain * face;
          occlusion = 0.4 + 0.48 * face + 0.1 * rim + 0.08 * star;
          return;
        };
      }
      case 'hinges': {
        const p = proceduralMaterialPresets.hinges;
        const inverseLeafX = 1 / p.leafHalfWidth,
          inverseLeafY = 1 / p.leafHalfLength,
          inverseShoulder = 1 / p.shoulder,
          boreSquared = p.boreRadius * p.boreRadius,
          inverseBoreShoulder = 1 / (boreSquared * p.shoulder),
          seatSquared = p.seatRadius * p.seatRadius,
          inverseSeatBand =
            1 / (seatSquared - p.seatInnerRadius * p.seatInnerRadius),
          inverseBarrel = 1 / (p.barrelRadius * p.barrelRadius),
          inversePin = 1 / (p.pinRadius * p.pinRadius),
          inversePitch = 1 / p.knucklePitch,
          inverseJoint = 1 / p.jointShoulder,
          inverseEnd = 1 / p.endShoulder,
          grainField = cachedNoise(8, 128, seed ^ 0x7ea1);
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5,
            lx = (Math.abs(x) - p.leafX) * inverseLeafX,
            ly = y * inverseLeafY,
            xx = lx * lx,
            yy = ly * ly,
            leaf = smooth(clamp((1 - xx * xx - yy * yy) * inverseShoulder)),
            screwRow = Math.max(-1, Math.min(1, Math.round(y / p.screwPitch))),
            dx = Math.abs(x) - p.screwX,
            dy = y - screwRow * p.screwPitch,
            r2 = dx * dx + dy * dy,
            bore =
              smooth(clamp((boreSquared - r2) * inverseBoreShoulder)) * leaf,
            seat = smooth(clamp((seatSquared - r2) * inverseSeatBand)) * leaf,
            pinCap = clamp(1 - x * x * inversePin),
            pin =
              smooth(clamp(pinCap * inverseShoulder)) *
              smooth(clamp((p.pinHalfLength - Math.abs(y)) * inverseEnd)),
            phase = fract((y + p.barrelHalfLength) * inversePitch),
            joint = smooth(clamp(Math.min(phase, 1 - phase) * inverseJoint)),
            barrelCap = clamp(1 - x * x * inverseBarrel),
            barrel =
              smooth(clamp(barrelCap * inverseShoulder)) *
              joint *
              smooth(clamp((p.barrelHalfLength - Math.abs(y)) * inverseEnd)),
            dome = smooth(barrelCap),
            pinDome = smooth(pinCap),
            grain = grainField(u, v);
          // The lower continuous pin stays visible in the four knuckle joints.
          // Masked blends keep both mounting leaves flat under the raised barrel.
          color =
            0.08 +
            0.47 * leaf -
            0.16 * seat -
            0.25 * bore +
            0.012 * grain * leaf;
          height =
            0.04 +
            0.3 * leaf -
            0.13 * seat -
            0.14 * bore +
            0.002 * grain * leaf;
          roughness =
            p.roughness + 0.25 * (1 - leaf) + 0.13 * seat + 0.12 * bore;
          occlusion = 0.35 + 0.62 * leaf - 0.17 * seat - 0.33 * bore;
          color =
            color * (1 - pin) + pin * (0.65 + 0.1 * pinDome + 0.012 * grain);
          height = height * (1 - pin) + pin * (0.42 + 0.13 * pinDome);
          roughness = roughness * (1 - pin) + 0.25 * pin;
          occlusion = occlusion * (1 - pin) + 0.94 * pin;
          color =
            color * (1 - barrel) + barrel * (0.55 + 0.2 * dome + 0.012 * grain);
          height = height * (1 - barrel) + barrel * (0.53 + 0.27 * dome);
          roughness = roughness * (1 - barrel) + 0.24 * barrel;
          occlusion = occlusion * (1 - barrel) + 0.99 * barrel;
          return;
        };
      }
      case 'cashews': {
        const p = proceduralMaterialPresets.cashews;
        const tones = new Float64Array(p.cells * p.cells),
          inverseTips = new Float64Array(p.tipRadii.length);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] =
              0.9 + 0.1 * hash(col, row, seed ^ 0x6dc1);
        for (let i = 0; i < p.tipRadii.length; i++)
          inverseTips[i] = 1 / (p.tipRadii[i] * p.tipRadii[i]);
        const inverseOuterX = 1 / (p.outerX * p.outerX),
          inverseOuterY = 1 / (p.outerY * p.outerY),
          inverseOpeningX = 1 / (p.openingRadiusX * p.openingRadiusX),
          inverseOpeningY = 1 / (p.openingRadiusY * p.openingRadiusY),
          inverseShoulder = 1 / p.shoulder,
          turnCos = Math.cos(p.turn),
          turnSin = Math.sin(p.turn),
          grainField = cachedNoise(96, 96, seed ^ 0x6dc3);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            sign = (col + row) & 1 ? -1 : 1,
            lx = x * turnCos + y * turnSin * sign,
            ly = -x * turnSin * sign + y * turnCos,
            cap = clamp(1 - lx * lx * inverseOuterX - ly * ly * inverseOuterY),
            dx = lx - p.openingX,
            opening = smooth(
              clamp(
                (1 - dx * dx * inverseOpeningX - ly * ly * inverseOpeningY) *
                  inverseShoulder,
              ),
            ),
            crescent = smooth(clamp(cap * inverseShoulder)) * (1 - opening);
          let outside = 1 - crescent,
            outsideDome = 1 - smooth(cap) * (1 - opening);
          // Rounded end lobes blunt the two ellipse-intersection cusps without
          // bridging the mouth: the kernel is a C, not a closed nut ring.
          for (let i = 0; i < p.tipRadii.length; i++) {
            const tx = lx - p.tipX,
              ty = ly - (i === 0 ? p.tipY : -p.tipY),
              tip = clamp(1 - (tx * tx + ty * ty) * inverseTips[i]);
            outside *= 1 - smooth(clamp(tip * inverseShoulder));
            outsideDome *= 1 - smooth(tip);
          }
          const kernel = 1 - outside,
            dome = 1 - outsideDome,
            grain = grainField(u, v),
            tone = tones[row * p.cells + col];
          color = 0.06 + kernel * (0.7 * tone + 0.02 * grain) + 0.12 * dome;
          height = 0.06 + 0.4 * kernel + 0.24 * dome + 0.004 * grain * kernel;
          roughness +=
            0.16 * (1 - kernel) - 0.06 * kernel + 0.015 * grain * kernel;
          occlusion = 0.43 + 0.53 * kernel;
          return;
        };
      }
      case 'coffeerings': {
        const p = proceduralMaterialPresets.coffeerings;
        const sites = new Float64Array(p.cells * p.cells * 7);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 7,
              angle = TAU * hash(col, row, seed ^ 0x3e81),
              major =
                p.radius + p.radiusVariation * hash(col, row, seed ^ 0x4f93),
              minor =
                major *
                (p.minorRatio +
                  (1 - p.minorRatio) * hash(col, row, seed ^ 0x50a5)),
              cos = Math.cos(angle),
              sin = Math.sin(angle);
            sites[i] =
              0.5 + p.centerJitter * (hash(col, row, seed ^ 0x61b7) - 0.5);
            sites[i + 1] =
              0.5 + p.centerJitter * (hash(col, row, seed ^ 0x72c9) - 0.5);
            sites[i + 2] = cos / major;
            sites[i + 3] = sin / major;
            sites[i + 4] = cos / minor;
            sites[i + 5] = sin / minor;
            sites[i + 6] = 0.55 + 0.25 * hash(col, row, seed ^ 0x83db);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0xd91d),
          warpField = cachedNoise(12, 12, seed ^ 0xea2f),
          fadeField = cachedNoise(24, 24, seed ^ 0xfb41),
          inverseBand = 1 / p.ringBand,
          inverseInnerShoulder = 1 / p.innerShoulder;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            i = (Math.floor(vc) * p.cells + Math.floor(uc)) * 7;
          const dx = fract(uc) - sites[i],
            dy = fract(vc) - sites[i + 1],
            along = dx * sites[i + 2] + dy * sites[i + 3],
            across = dy * sites[i + 4] - dx * sites[i + 5];
          const r2 =
              along * along +
              across * across +
              p.warp * (warpField(u, v) - 0.5),
            edge = (r2 - 1) * inverseBand;
          const ring = smooth(clamp(1 - edge * edge)),
            inner = smooth(clamp((1 - r2) * inverseInnerShoulder)),
            fade = 0.45 + 0.55 * fadeField(u, v),
            stain = sites[i + 6] * ring * fade + 0.08 * inner,
            grain = grainField(u, v);
          // Dried pigment changes paper color, not a deep cavity or its AO.
          color = 0.94 - 0.68 * stain + 0.012 * grain;
          height = 0.12 + 0.006 * grain + 0.002 * stain;
          roughness += -0.1 * stain + 0.015 * grain;
          occlusion = 0.99;
          return;
        };
      }
      case 'pillowtiles': {
        const p = proceduralMaterialPresets.pillowtiles;
        const grainField = cachedNoise(96, 96, seed ^ 0xc809);
        const tones = new Float64Array(p.cells * p.cells),
          inverseWidth = 1 / p.halfWidth,
          inverseShoulder = 1 / p.shoulder;
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x2d79);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const x = (fract(uc) - 0.5) * inverseWidth,
            y = (fract(vc) - 0.5) * inverseWidth,
            xx = x * x,
            yy = y * y;
          const face = smooth(clamp((1 - xx * xx - yy * yy) * inverseShoulder)),
            dome = smooth(clamp(1 - 0.5 * (xx + yy)));
          const tone = tones[Math.floor(vc) * p.cells + Math.floor(uc)],
            grain = grainField(u, v);
          color =
            0.45 + face * (0.2 + 0.12 * dome + 0.08 * tone + 0.015 * grain);
          height = 0.04 + face * (0.42 + 0.3 * dome + 0.005 * grain);
          mortar = 1 - face;
          roughness += 0.5 * mortar - 0.04 * dome * face + 0.02 * grain * face;
          occlusion = 0.5 + 0.48 * face;
          return;
        };
      }
      case 'ribknit': {
        const p = proceduralMaterialPresets.ribknit;
        const grainField = cachedNoise(96, 96, seed ^ 0xb7f5);
        const sy = p.armTop - p.armBottom,
          inverseArmSquared = 1 / (p.armX * p.armX + sy * sy),
          inverseYarnSquared = 1 / (p.yarnWidth * p.yarnWidth),
          inversePurlSquared = 1 / (p.purlWidth * p.purlWidth);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const x = fract(uc) - 0.5,
            y = fract(vc) - 0.5,
            purl = Math.floor(uc) & 1;
          let yarn: number;
          if (purl) {
            const qx = x - Math.max(-p.purlLength, Math.min(p.purlLength, x));
            yarn = smooth(
              clamp(1 - (qx * qx + (y - p.purlY) ** 2) * inversePurlSquared),
            );
          } else {
            let outside = 1;
            for (let sign = -1; sign <= 1; sign += 2) {
              const sx = sign * p.armX,
                dy = y - p.armBottom;
              const t = clamp((x * sx + dy * sy) * inverseArmSquared),
                qx = x - t * sx,
                qy = dy - t * sy;
              outside *=
                1 - smooth(clamp(1 - (qx * qx + qy * qy) * inverseYarnSquared));
            }
            yarn = 1 - outside;
          }
          const grain = grainField(u, v);
          // Column-only ownership keeps the knit ribs vertical rather than
          // alternating their positions on each row as in seed stitch.
          color = 0.1 + yarn * (0.62 - 0.18 * purl + 0.05 * grain);
          height = 0.07 + yarn * (0.7 - 0.26 * purl + 0.02 * grain);
          roughness +=
            0.06 * (1 - yarn) + 0.04 * purl * yarn + 0.02 * grain * yarn;
          occlusion = 0.45 + yarn * (0.53 - 0.08 * purl);
          return;
        };
      }
      case 'ivyleaf': {
        const p = proceduralMaterialPresets.ivyleaf;
        const lobes = new Float64Array(p.lobes.length * 6),
          veins = new Float64Array(p.lobes.length * 3);
        for (let i = 0; i < p.lobes.length; i++) {
          const [cx, cy, width, length, angle] = p.lobes[i],
            cos = Math.cos(angle),
            sin = Math.sin(angle);
          lobes[i * 6] = cx;
          lobes[i * 6 + 1] = cy;
          lobes[i * 6 + 2] = 1 / width;
          lobes[i * 6 + 3] = 1 / length;
          lobes[i * 6 + 4] = cos;
          lobes[i * 6 + 5] = sin;
          const vx = cx - length * sin,
            vy = cy - length * cos - p.veinRoot;
          veins[i * 3] = vx;
          veins[i * 3 + 1] = vy;
          veins[i * 3 + 2] = 1 / (vx * vx + vy * vy);
        }
        const inverseShoulder = 1 / p.shoulder,
          inverseVeinSquared = 1 / (p.veinWidth * p.veinWidth),
          inverseStemSquared = 1 / (p.stemWidth * p.stemWidth),
          inverseStemShoulder = 1 / p.stemShoulder,
          stemLength = p.stemEnd - p.stemStart,
          inverseStemLength = 1 / stemLength;
        const grainField = cachedNoise(96, 96, seed ^ 0xa6e1);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1 ? 1 : -1;
          const x = (dx + turn * dy) * Math.SQRT1_2,
            y = (dy - turn * dx) * Math.SQRT1_2,
            rootY = y - p.veinRoot;
          let outsideLeaf = 1,
            outsideVeins = 1;
          for (let i = 0; i < p.lobes.length; i++) {
            const j = i * 6,
              k = i * 3,
              lx = x - lobes[j],
              ly = y - lobes[j + 1];
            const across =
                (lx * lobes[j + 4] - ly * lobes[j + 5]) * lobes[j + 2],
              along = (lx * lobes[j + 5] + ly * lobes[j + 4]) * lobes[j + 3];
            const cap = clamp(1 - along * along);
            outsideLeaf *=
              1 -
              smooth(clamp((cap * cap - across * across) * inverseShoulder));
            const t = clamp(
                (x * veins[k] + rootY * veins[k + 1]) * veins[k + 2],
              ),
              vx = x - t * veins[k],
              vy = rootY - t * veins[k + 1];
            outsideVeins *=
              1 - smooth(clamp(1 - (vx * vx + vy * vy) * inverseVeinSquared));
          }
          const leaf = 1 - outsideLeaf,
            vein = (1 - outsideVeins) * leaf;
          const t = clamp((y - p.stemStart) * inverseStemLength),
            sy = y - p.stemStart - t * stemLength;
          const stem = smooth(
            clamp(
              (1 - (x * x + sy * sy) * inverseStemSquared) *
                inverseStemShoulder,
            ),
          );
          const face = 1 - (1 - leaf) * (1 - stem),
            grain = grainField(u, v);
          color =
            0.06 +
            0.55 * face +
            0.07 * leaf +
            0.18 * vein +
            0.025 * grain * face;
          height = 0.06 + 0.5 * face + 0.09 * vein + 0.007 * grain * face;
          roughness += 0.2 * (1 - face) - 0.12 * vein + 0.02 * grain * face;
          occlusion = 0.36 + 0.6 * face + 0.02 * vein;
          return;
        };
      }
      case 'paperclips': {
        const p = proceduralMaterialPresets.paperclips;
        const segments = new Float64Array(p.legs.length * 5),
          bends = new Float64Array(p.bends.length * 5);
        for (let i = 0; i < p.legs.length; i++) {
          const [ax, ay, bx, by] = p.legs[i],
            dx = bx - ax,
            dy = by - ay;
          segments[i * 5] = ax;
          segments[i * 5 + 1] = ay;
          segments[i * 5 + 2] = dx;
          segments[i * 5 + 3] = dy;
          segments[i * 5 + 4] = 1 / (dx * dx + dy * dy);
        }
        for (let i = 0; i < p.bends.length; i++) {
          const [x, y, radius, direction] = p.bends[i];
          bends[i * 5] = x;
          bends[i * 5 + 1] = y;
          bends[i * 5 + 2] = radius * radius;
          bends[i * 5 + 3] = 1 / (2 * radius * p.wireWidth);
          bends[i * 5 + 4] = direction;
        }
        const inverseWireSquared = 1 / (p.wireWidth * p.wireWidth),
          inverseShoulder = 1 / p.shoulder,
          inverseArcFade = 1 / p.arcFade;
        const grainField = cachedNoise(96, 96, seed ^ 0x95d7);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1 ? 1 : -1;
          const x = (dx + turn * dy) * Math.SQRT1_2,
            y = (dy - turn * dx) * Math.SQRT1_2;
          let outside = 1;
          for (let i = 0; i < segments.length; i += 5) {
            const sx = x - segments[i],
              sy = y - segments[i + 1];
            const t = clamp(
              (sx * segments[i + 2] + sy * segments[i + 3]) * segments[i + 4],
            );
            const qx = sx - t * segments[i + 2],
              qy = sy - t * segments[i + 3];
            outside *=
              1 -
              smooth(
                clamp(
                  (1 - (qx * qx + qy * qy) * inverseWireSquared) *
                    inverseShoulder,
                ),
              );
          }
          for (let i = 0; i < bends.length; i += 5) {
            const bx = x - bends[i],
              by = y - bends[i + 1];
            const ring = (bx * bx + by * by - bends[i + 2]) * bends[i + 3];
            // A compact half-plane shoulder overlaps each capsule endpoint;
            // a hard semicircle cut would jump across its wire profile.
            const half = smooth(clamp(1 + by * bends[i + 4] * inverseArcFade));
            outside *=
              1 - half * smooth(clamp((1 - ring * ring) * inverseShoulder));
          }
          const face = 1 - outside,
            grain = grainField(u, v);
          color = 0.05 + 0.77 * face + 0.02 * grain;
          height = 0.06 + 0.64 * face + 0.004 * grain;
          roughness += 0.3 * (1 - face) + 0.02 * grain;
          occlusion = 0.33 + 0.65 * face;
          return;
        };
      }
      case 'appleslice': {
        const p = proceduralMaterialPresets.appleslice;
        const grainField = cachedNoise(96, 96, seed ^ 0x84c3);
        const axes = new Float64Array(p.chambers * 2);
        for (let i = 0; i < p.chambers; i++) {
          axes[i * 2] = Math.cos((i * TAU) / p.chambers);
          axes[i * 2 + 1] = Math.sin((i * TAU) / p.chambers);
        }
        const radiusSquared = p.radius * p.radius,
          fleshSquared = p.fleshRadius * p.fleshRadius,
          coreSquared = p.coreRadius * p.coreRadius;
        const inversePeelShoulder =
            1 / (radiusSquared - (p.radius - p.peelBevel) ** 2),
          inverseFleshShoulder =
            1 / (fleshSquared - (p.fleshRadius - p.fleshBevel) ** 2),
          inverseCoreShoulder =
            1 / (coreSquared - (p.coreRadius - p.coreBevel) ** 2);
        const inverseChamberLength = 1 / p.chamberLength,
          inverseChamberWidth = 1 / p.chamberWidth,
          inverseSeedLength = 1 / p.seedLength,
          inverseSeedWidth = 1 / p.seedWidth,
          inverseChamberShoulder = 1 / p.chamberShoulder,
          inverseSeedShoulder = 1 / p.seedShoulder;
        const cosTurn = Math.cos(Math.PI / p.chambers),
          sinTurn = Math.sin(Math.PI / p.chambers);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = turn ? dx * cosTurn + dy * sinTurn : dx,
            y = turn ? dy * cosTurn - dx * sinTurn : dy;
          const r2 = x * x + y * y;
          const face = smooth(
              clamp((radiusSquared - r2) * inversePeelShoulder),
            ),
            flesh = smooth(clamp((fleshSquared - r2) * inverseFleshShoulder)),
            core = smooth(clamp((coreSquared - r2) * inverseCoreShoulder));
          let outsideChambers = 1,
            outsideSeeds = 1;
          for (let i = 0; i < axes.length; i += 2) {
            const along = x * axes[i] + y * axes[i + 1],
              across = y * axes[i] - x * axes[i + 1];
            const ca = (along - p.chamberCenter) * inverseChamberLength,
              cb = across * inverseChamberWidth,
              sa = (along - p.seedCenter) * inverseSeedLength,
              sb = across * inverseSeedWidth;
            outsideChambers *=
              1 -
              smooth(clamp((1 - ca * ca - cb * cb) * inverseChamberShoulder));
            outsideSeeds *=
              1 - smooth(clamp((1 - sa * sa - sb * sb) * inverseSeedShoulder));
          }
          const chamber = 1 - outsideChambers,
            kernel = 1 - outsideSeeds,
            grain = grainField(u, v);
          color =
            0.06 +
            face *
              (0.14 +
                0.74 * flesh -
                0.06 * core -
                0.4 * chamber -
                0.4 * kernel +
                0.02 * grain);
          height =
            0.06 +
            face *
              (0.5 +
                0.05 * flesh -
                0.05 * core -
                0.15 * chamber +
                0.08 * kernel +
                0.003 * grain);
          roughness +=
            0.25 * (1 - face) -
            0.14 * flesh +
            0.14 * chamber -
            0.2 * kernel +
            0.02 * grain * face;
          occlusion =
            0.38 + 0.6 * face - 0.04 * core - 0.18 * chamber + 0.12 * kernel;
          return;
        };
      }
      case 'diamondcheckertiles': {
        const p = proceduralMaterialPresets.diamondcheckertiles;
        const grainField = cachedNoise(96, 96, seed ^ 0x73a9);
        const rows = p.cells * 2,
          tones = new Float64Array(p.cells * rows),
          inverseBevel = 1 / p.bevel;
        for (let row = 0; row < rows; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x1c67);
        return () => {
          const a = (u + v) * p.cells,
            b = (u - v) * p.cells;
          const ia = Math.floor(a),
            ib = Math.floor(b);
          const x = fract(a),
            y = fract(b);
          const face =
            smooth(clamp((Math.min(x, 1 - x) - p.grout) * inverseBevel)) *
            smooth(clamp((Math.min(y, 1 - y) - p.grout) * inverseBevel));
          // Quotient ownership is invariant under both UV translations
          // (a,b) → (a+cells,b±cells), including negative diagonal rows.
          const row = (((ia - ib) % rows) + rows) % rows,
            col = ia % p.cells;
          const tone = tones[row * p.cells + col],
            grain = grainField(u, v);
          const pigment =
            ((ia + ib) & 1 ? 0.88 : 0.11) + 0.035 * tone + 0.012 * grain;
          color = 0.45 + face * (pigment - 0.45);
          height = 0.06 + face * (0.7 + 0.01 * grain);
          mortar = 1 - face;
          roughness += 0.55 * mortar + 0.03 * grain * face;
          occlusion = 0.52 + 0.46 * face;
          return;
        };
      }
      case 'spurgears': {
        const p = proceduralMaterialPresets.spurgears;
        const grainField = cachedNoise(96, 96, seed ^ 0x68f1);
        const axes = new Float64Array(p.teeth * 2);
        for (let i = 0; i < p.teeth; i++) {
          axes[i * 2] = Math.cos((i * TAU) / p.teeth);
          axes[i * 2 + 1] = Math.sin((i * TAU) / p.teeth);
        }
        const bodySquared = p.bodyRadius * p.bodyRadius,
          inverseBodyShoulder =
            1 / (bodySquared - (p.bodyRadius - p.bodyBevel) ** 2),
          boreSquared = p.boreRadius * p.boreRadius,
          inverseBoreShoulder =
            1 / ((p.boreRadius + p.boreBevel) ** 2 - boreSquared),
          hubSquared = p.hubRadius * p.hubRadius,
          inverseHubShoulder =
            1 / (hubSquared - (p.hubRadius - p.hubBevel) ** 2),
          inverseToothBevel = 1 / p.toothBevel,
          turnCos = Math.cos(Math.PI / p.teeth),
          turnSin = Math.sin(Math.PI / p.teeth);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          let x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          if ((Math.floor(uc) + Math.floor(vc)) & 1) {
            const rx = x * turnCos + y * turnSin;
            y = -x * turnSin + y * turnCos;
            x = rx;
          }
          const r2 = x * x + y * y,
            body = smooth(clamp((bodySquared - r2) * inverseBodyShoulder)),
            holeWall = smooth(clamp((r2 - boreSquared) * inverseBoreShoulder));
          let outside = 1 - body;
          for (let i = 0; i < p.teeth; i++) {
            const c = axes[i * 2],
              s = axes[i * 2 + 1],
              along = x * c + y * s,
              across = -x * s + y * c;
            const tooth =
              smooth(clamp((along - p.toothRoot) * inverseToothBevel)) *
              smooth(clamp((p.toothTip - along) * inverseToothBevel)) *
              smooth(
                clamp(
                  (p.toothHalfWidth - Math.abs(across)) * inverseToothBevel,
                ),
              );
            outside *= 1 - tooth;
          }
          const face = (1 - outside) * holeWall,
            hub =
              smooth(clamp((hubSquared - r2) * inverseHubShoulder)) * holeWall,
            grain = grainField(u, v);
          color = 0.06 + 0.73 * face + 0.07 * hub + 0.02 * grain;
          height = 0.05 + 0.48 * face + 0.18 * hub + 0.003 * grain;
          roughness += 0.25 * (1 - face) - 0.04 * hub + 0.02 * grain;
          occlusion = 0.35 + 0.62 * face + 0.02 * hub;
          return;
        };
      }
      case 'pumpkinseeds': {
        const p = proceduralMaterialPresets.pumpkinseeds;
        const grainField = cachedNoise(96, 96, seed ^ 0x4ba9);
        const turn = Math.SQRT1_2,
          inverseLengthSquared = 1 / (p.halfLength * p.halfLength),
          inverseWidthSquared = 1 / (p.halfWidth * p.halfWidth),
          inverseShoulder = 1 / p.shoulder;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            sign = (Math.floor(uc) + Math.floor(vc)) & 1 ? 1 : -1;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = (dx + sign * dy) * turn,
            y = (dy - sign * dx) * turn;
          const envelope = clamp(1 - y * y * inverseLengthSquared),
            cap = envelope * envelope - x * x * inverseWidthSquared,
            face = smooth(clamp(cap * inverseShoulder)),
            inner = smooth(clamp((cap - p.rimInset) * inverseShoulder)),
            rim = face - inner,
            grain = grainField(u, v);
          color = 0.06 + 0.74 * face - 0.16 * inner + 0.02 * grain * face;
          height = 0.05 + 0.25 * inner + 0.5 * rim + 0.003 * grain * face;
          roughness += 0.22 * (1 - face) + 0.06 * rim + 0.02 * grain * face;
          occlusion = 0.4 + 0.42 * inner + 0.54 * rim;
          return;
        };
      }
      case 'twillweave': {
        const p = proceduralMaterialPresets.twillweave;
        const grainField = cachedNoise(128, 128, seed ^ 0x2f65);
        const inverseWidthSquared = 1 / (p.halfWidth * p.halfWidth),
          inverseExposure = 1 / p.exposureShoulder;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            col = Math.floor(uc),
            row = Math.floor(vc),
            x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          const warp = smooth(clamp(1 - x * x * inverseWidthSquared)),
            weft = smooth(clamp(1 - y * y * inverseWidthSquared));
          const exposure =
            ((col - row) & 3) < 2
              ? smooth(
                  clamp((p.exposureHalf - Math.abs(x)) * inverseExposure),
                ) *
                smooth(clamp((p.exposureHalf - Math.abs(y)) * inverseExposure))
              : 0;
          const warpTop = 0.46 * warp + 0.18 * weft * (1 - warp),
            weftTop = 0.46 * weft + 0.18 * warp * (1 - weft),
            warpColor = 0.08 + 0.2 * warp + 0.65 * weft * (1 - warp),
            weftColor = 0.08 + 0.65 * weft + 0.2 * warp * (1 - weft),
            dominant = warp * (1 - exposure) + weft * exposure,
            coverage = 1 - (1 - warp) * (1 - weft),
            grain = grainField(u, v);
          color =
            warpColor * (1 - exposure) +
            weftColor * exposure +
            0.03 * grain * coverage;
          height =
            0.05 +
            warpTop * (1 - exposure) +
            weftTop * exposure +
            0.006 * grain * coverage;
          roughness += 0.08 * (1 - dominant) + 0.02 * grain * coverage;
          occlusion = 0.5 + 0.48 * coverage;
          return;
        };
      }
      case 'eucalyptusleaf': {
        const p = proceduralMaterialPresets.eucalyptusleaf;
        const grainField = cachedNoise(96, 96, seed ^ 0x79d1);
        const roots = new Float64Array(p.veinPairs);
        for (let i = 0; i < p.veinPairs; i++)
          roots[i] = p.centerY + (i - (p.veinPairs - 1) * 0.5) * p.veinSpacing;
        const turn = Math.SQRT1_2,
          inverseLength = 1 / p.halfLength,
          inverseWidthSquared = 1 / (p.halfWidth * p.halfWidth),
          inverseShoulder = 1 / p.shoulder,
          inverseStemSquared = 1 / (p.stemWidth * p.stemWidth),
          inverseStemShoulder = 1 / p.stemShoulder,
          inverseMidribSquared = 1 / (p.midribWidth * p.midribWidth),
          inverseMidribFade = 1 / p.midribFade,
          inverseVeinSquared = 1 / (p.veinWidth * p.veinWidth),
          inverseAxisFade = 1 / p.veinAxisFade;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells,
            sign = (Math.floor(uc) + Math.floor(vc)) & 1 ? 1 : -1;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5,
            x = (dx + sign * dy) * turn,
            y = (dy - sign * dx) * turn;
          const ny = (y - p.centerY) * inverseLength,
            envelope = clamp(1 - ny * ny),
            wx = x - p.bend * envelope,
            a = Math.abs(wx);
          const blade = smooth(
            clamp(
              (envelope * envelope - wx * wx * inverseWidthSquared) *
                inverseShoulder,
            ),
          );
          const stem =
            smooth(clamp((y - p.stemStart) * inverseStemShoulder)) *
            smooth(clamp((p.stemEnd - y) * inverseStemShoulder)) *
            smooth(clamp(1 - x * x * inverseStemSquared));
          const midrib =
            smooth(clamp(1 - wx * wx * inverseMidribSquared)) *
            smooth(
              clamp(
                (p.midribLength - Math.abs(y - p.centerY)) * inverseMidribFade,
              ),
            );
          const veinY = y - p.veinSlope * a;
          let branches = 0;
          for (let i = 0; i < p.veinPairs; i++) {
            const d = veinY - roots[i];
            branches += smooth(clamp(1 - d * d * inverseVeinSquared));
          }
          branches *= smooth(clamp(a * inverseAxisFade));
          const grain = grainField(u, v),
            coverage = 1 - (1 - blade) * (1 - stem);
          color =
            0.1 +
            blade * (0.52 + 0.06 * grain + 0.1 * (midrib + 0.5 * branches)) +
            (1 - blade) * 0.32 * stem;
          height =
            0.05 +
            blade * (0.53 + 0.015 * grain + 0.075 * midrib + 0.035 * branches) +
            (1 - blade) * 0.28 * stem;
          roughness +=
            0.26 * (1 - blade) + blade * (0.02 * grain - 0.03 * midrib);
          occlusion = 0.34 + 0.64 * coverage;
          return;
        };
      }
      case 'squarewashers': {
        const p = proceduralMaterialPresets.squarewashers;
        const grainField = cachedNoise(96, 96, seed ^ 0x57b3);
        const turn = Math.SQRT1_2,
          inverseBevel = 1 / p.bevel,
          innerSquared = p.holeRadius * p.holeRadius,
          inverseHoleShoulder =
            1 / ((p.holeRadius + p.holeBevel) ** 2 - innerSquared);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          let x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          if ((Math.floor(uc) + Math.floor(vc)) & 1) {
            const rx = (x + y) * turn;
            y = (y - x) * turn;
            x = rx;
          }
          const face =
            smooth(clamp((p.halfWidth - Math.abs(x)) * inverseBevel)) *
            smooth(clamp((p.halfWidth - Math.abs(y)) * inverseBevel)) *
            smooth(clamp((x * x + y * y - innerSquared) * inverseHoleShoulder));
          const grain = grainField(u, v);
          color = 0.06 + 0.74 * face + 0.02 * grain;
          height = 0.05 + 0.62 * face + 0.004 * grain;
          roughness += 0.28 * (1 - face) + 0.03 * grain;
          occlusion = 0.36 + 0.62 * face;
          return;
        };
      }
      case 'pickettiles': {
        const p = proceduralMaterialPresets.pickettiles;
        const pitch = Math.sqrt(3) / 2,
          inverseBevel = 1 / p.bevel;
        const grainField = cachedNoise(96, 96, seed ^ 0x3a97);
        const tones = new Float64Array(p.columns * p.rows);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++)
            tones[row * p.columns + col] = hash(col, row, seed);
        return () => {
          const x = u * p.columns,
            y = v * p.rows * pitch,
            row = Math.floor(y / pitch);
          let best = Infinity,
            dx = 0,
            dy = 0,
            ownerX = 0,
            ownerY = 0;
          for (let oy = 0; oy <= 1; oy++) {
            const cy = row + oy,
              offset = (cy & 1) * 0.5,
              cx = Math.round(x - offset),
              px = x - cx - offset,
              py = y - cy * pitch,
              distance = px * px + py * py;
            if (distance < best) {
              best = distance;
              dx = px;
              dy = py;
              ownerX = ((cx % p.columns) + p.columns) % p.columns;
              ownerY = ((cy % p.rows) + p.rows) % p.rows;
            }
          }
          const face =
            smooth(clamp((0.5 - Math.abs(dx) - p.gap) * inverseBevel)) *
            smooth(
              clamp(
                (0.5 - Math.abs(dx * 0.5 + dy * pitch) - p.gap) * inverseBevel,
              ),
            ) *
            smooth(
              clamp(
                (0.5 - Math.abs(dx * 0.5 - dy * pitch) - p.gap) * inverseBevel,
              ),
            );
          const tone = tones[ownerY * p.columns + ownerX],
            grain = grainField(u, v);
          color = 0.14 + face * (0.35 + 0.38 * tone + 0.03 * grain);
          height = face * (0.75 + 0.04 * tone + 0.01 * grain);
          roughness =
            0.86 + face * (p.roughness - 0.86 + 0.07 * tone + 0.02 * grain);
          occlusion = 0.5 + 0.49 * face;
          mortar = 1 - face;
          return;
        };
      }
      case 'mangosteenslice': {
        const p = proceduralMaterialPresets.mangosteenslice;
        const grainField = cachedNoise(96, 96, seed ^ 0x6e25);
        const axes = new Float64Array(p.lobes * 2);
        for (let i = 0; i < p.lobes; i++) {
          axes[i * 2] = Math.cos((i * TAU) / p.lobes);
          axes[i * 2 + 1] = Math.sin((i * TAU) / p.lobes);
        }
        const inverseLengthSquared = 1 / (p.lobeLength * p.lobeLength),
          inverseWidthSquared = 1 / (p.lobeWidth * p.lobeWidth),
          inverseHubSquared = 1 / (p.hubRadius * p.hubRadius),
          radiusSquared = p.radius * p.radius,
          innerSquared = p.innerRadius * p.innerRadius,
          outerShoulder = radiusSquared - (p.radius - p.rimShoulder) ** 2,
          innerShoulder = innerSquared - (p.innerRadius - p.rimShoulder) ** 2,
          turnCos = Math.cos(Math.PI / p.lobes),
          turnSin = Math.sin(Math.PI / p.lobes);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          let x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          if ((Math.floor(uc) + Math.floor(vc)) & 1) {
            const rx = x * turnCos + y * turnSin;
            y = -x * turnSin + y * turnCos;
            x = rx;
          }
          const r2 = x * x + y * y,
            body = smooth(clamp((radiusSquared - r2) / outerShoulder)),
            inside = smooth(clamp((innerSquared - r2) / innerShoulder)),
            rind = body * (1 - inside);
          const hub = smooth(clamp(1 - r2 * inverseHubSquared));
          let outside = 1 - hub,
            outsideDome = 1 - hub;
          for (let i = 0; i < p.lobes; i++) {
            const c = axes[i * 2],
              s = axes[i * 2 + 1],
              lx = x * c + y * s - p.lobeCenter,
              ly = -x * s + y * c;
            const cap = clamp(
              1 -
                lx * lx * inverseLengthSquared -
                ly * ly * inverseWidthSquared,
            );
            outside *= 1 - smooth(clamp(cap / p.shoulder));
            outsideDome *= 1 - smooth(cap);
          }
          const flesh = 1 - outside,
            dome = 1 - outsideDome,
            grain = grainField(u, v);
          color =
            0.04 + 0.12 * body + 0.06 * rind + flesh * (0.76 + 0.02 * grain);
          height = 0.04 + 0.16 * body + 0.15 * rind + 0.3 * flesh + 0.16 * dome;
          roughness +=
            0.24 * rind +
            0.15 * (1 - body) -
            0.12 * flesh +
            0.02 * grain * body;
          occlusion = 0.4 + 0.25 * body + 0.32 * flesh;
          return;
        };
      }
      case 'seedstitch': {
        const p = proceduralMaterialPresets.seedstitch;
        const grainField = cachedNoise(96, 96, seed ^ 0x4dcb);
        const sy = p.armTop - p.armBottom,
          inverseArmSquared = 1 / (p.armX * p.armX + sy * sy),
          inverseYarnSquared = 1 / (p.yarnWidth * p.yarnWidth),
          inversePurlSquared = 1 / (p.purlWidth * p.purlWidth);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const x = fract(uc) - 0.5,
            y = fract(vc) - 0.5;
          const purl = (Math.floor(uc) + Math.floor(vc)) & 1;
          let yarn: number;
          if (purl) {
            const qx = x - Math.max(-p.purlLength, Math.min(p.purlLength, x));
            yarn = smooth(
              clamp(1 - (qx * qx + (y - p.purlY) ** 2) * inversePurlSquared),
            );
          } else {
            let outside = 1;
            for (let sign = -1; sign <= 1; sign += 2) {
              const sx = sign * p.armX,
                dy = y - p.armBottom;
              const t = clamp((x * sx + dy * sy) * inverseArmSquared);
              const qx = x - t * sx,
                qy = dy - t * sy;
              outside *=
                1 - smooth(clamp(1 - (qx * qx + qy * qy) * inverseYarnSquared));
            }
            yarn = 1 - outside;
          }
          const grain = grainField(u, v);
          color = 0.12 + yarn * (0.55 + 0.06 * purl + 0.07 * grain);
          height = 0.09 + yarn * (0.56 + 0.1 * purl + 0.025 * grain);
          roughness += 0.04 * (1 - yarn) + 0.02 * grain * yarn;
          occlusion = 0.49 + 0.49 * yarn;
          return;
        };
      }
      case 'cotterpins': {
        const p = proceduralMaterialPresets.cotterpins;
        const segments = new Float64Array(p.legs.length * 5);
        for (let i = 0; i < p.legs.length; i++) {
          const [ax, ay, bx, by] = p.legs[i],
            dx = bx - ax,
            dy = by - ay;
          segments[i * 5] = ax;
          segments[i * 5 + 1] = ay;
          segments[i * 5 + 2] = dx;
          segments[i * 5 + 3] = dy;
          segments[i * 5 + 4] = 1 / (dx * dx + dy * dy);
        }
        const inverseWireSquared = 1 / (p.wireWidth * p.wireWidth);
        const grainField = cachedNoise(96, 96, seed ^ 0x3cb9);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const flip = (Math.floor(uc) + Math.floor(vc)) & 1 ? -1 : 1;
          const x = (fract(uc) - 0.5) * flip,
            y = (fract(vc) - 0.5) * flip;
          const ey = y - p.eyeY;
          const eye =
            smooth(
              clamp(
                (1 - (x / p.outerWidth) ** 2 - (ey / p.outerLength) ** 2) /
                  p.shoulder,
              ),
            ) *
            (1 -
              smooth(
                clamp(
                  (1 - (x / p.innerWidth) ** 2 - (ey / p.innerLength) ** 2) /
                    p.shoulder,
                ),
              ));
          let outside = 1 - eye;
          for (let i = 0; i < segments.length; i += 5) {
            const dx = x - segments[i],
              dy = y - segments[i + 1];
            const t = clamp(
              (dx * segments[i + 2] + dy * segments[i + 3]) * segments[i + 4],
            );
            const qx = dx - t * segments[i + 2],
              qy = dy - t * segments[i + 3];
            outside *=
              1 -
              smooth(
                clamp(
                  (1 - (qx * qx + qy * qy) * inverseWireSquared) / p.shoulder,
                ),
              );
          }
          const face = 1 - outside,
            grain = grainField(u, v);
          color = 0.05 + 0.76 * face + 0.02 * grain;
          height = 0.06 + 0.64 * face + 0.004 * grain;
          roughness += 0.3 * (1 - face) + 0.02 * grain;
          occlusion = 0.33 + 0.65 * face;
          return;
        };
      }
      case 'cowrieshells': {
        const p = proceduralMaterialPresets.cowrieshells;
        const grainField = cachedNoise(96, 96, seed ^ 0x7ba7);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = turn ? dy : dx,
            y = turn ? dx : dy;
          const cap = clamp(
            1 - (x / p.halfWidth) ** 2 - (y / p.halfLength) ** 2,
          );
          const body = smooth(clamp(cap / p.shoulder));
          const opening = smooth(
            clamp(
              (1 - (x / p.apertureWidth) ** 2 - (y / p.apertureLength) ** 2) /
                p.shoulder,
            ),
          );
          let outsideTeeth = 1;
          for (let side = -1; side <= 1; side += 2)
            for (let i = 0; i < p.teeth; i++) {
              const ty = (i - (p.teeth - 1) / 2) * p.toothPitch;
              outsideTeeth *=
                1 -
                smooth(
                  clamp(
                    1 -
                      ((x - side * p.toothX) / p.toothLength) ** 2 -
                      ((y - ty) / p.toothWidth) ** 2,
                  ),
                );
            }
          const teeth = 1 - outsideTeeth,
            dome = smooth(cap),
            grain = grainField(u, v);
          // The two tooth rows flank, rather than bridge, the opaque aperture.
          color =
            0.035 +
            body *
              (0.6 +
                0.12 * dome -
                0.56 * opening +
                0.13 * teeth +
                0.03 * grain);
          height =
            0.06 +
            body *
              (0.32 +
                0.36 * dome -
                0.48 * opening +
                0.13 * teeth +
                0.008 * grain);
          roughness +=
            body * (-0.14 + 0.12 * opening - 0.04 * teeth + 0.02 * grain);
          occlusion = 0.35 + body * (0.62 - 0.38 * opening + 0.03 * teeth);
          return;
        };
      }
      case 'fiddleheads': {
        const p = proceduralMaterialPresets.fiddleheads;
        const segments = new Float64Array(
          (p.coilSegments + p.stemSegments) * 10,
        );
        const store = (
          index: number,
          ax: number,
          ay: number,
          bx: number,
          by: number,
          width: number,
        ): void => {
          const i = index * 10,
            dx = bx - ax,
            dy = by - ay;
          segments[i] = ax;
          segments[i + 1] = ay;
          segments[i + 2] = dx;
          segments[i + 3] = dy;
          segments[i + 4] = 1 / (dx * dx + dy * dy);
          segments[i + 5] = 1 / (width * width);
          segments[i + 6] = Math.min(ax, bx) - width;
          segments[i + 7] = Math.max(ax, bx) + width;
          segments[i + 8] = Math.min(ay, by) - width;
          segments[i + 9] = Math.max(ay, by) + width;
        };
        let ax: number = p.outerRadius,
          ay: number = p.coilY;
        for (let i = 0; i < p.coilSegments; i++) {
          const t = (i + 1) / p.coilSegments,
            radius = p.outerRadius + (p.innerRadius - p.outerRadius) * t,
            angle = -TAU * p.turns * t;
          const bx = radius * Math.cos(angle),
            by = p.coilY + radius * Math.sin(angle);
          store(i, ax, ay, bx, by, p.width * (1 - p.taper * t));
          ax = bx;
          ay = by;
        }
        ax = p.outerRadius;
        ay = p.coilY;
        for (let i = 0; i < p.stemSegments; i++) {
          const t = (i + 1) / p.stemSegments,
            s = 1 - t;
          const bx =
            s * s * s * p.outerRadius +
            3 * s * s * t * p.outerRadius +
            3 * s * t * t * p.stemBendX +
            t * t * t * p.stemEndX;
          const by =
            s * s * s * p.coilY +
            3 * s * s * t * p.stemControlY +
            3 * s * t * t * p.stemBendY +
            t * t * t * p.stemEndY;
          store(p.coilSegments + i, ax, ay, bx, by, p.width);
          ax = bx;
          ay = by;
        }
        const grainField = cachedNoise(96, 96, seed ^ 0x6a95);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const flip = (Math.floor(uc) + Math.floor(vc)) & 1 ? -1 : 1;
          const x = (fract(uc) - 0.5) * flip,
            y = fract(vc) - 0.5;
          let outside = 1;
          for (let i = 0; i < segments.length; i += 10) {
            if (
              x < segments[i + 6] ||
              x > segments[i + 7] ||
              y < segments[i + 8] ||
              y > segments[i + 9]
            )
              continue;
            const dx = x - segments[i],
              dy = y - segments[i + 1];
            const t = clamp(
              (dx * segments[i + 2] + dy * segments[i + 3]) * segments[i + 4],
            );
            const qx = dx - t * segments[i + 2],
              qy = dy - t * segments[i + 3];
            outside *=
              1 -
              smooth(
                clamp((1 - (qx * qx + qy * qy) * segments[i + 5]) / p.shoulder),
              );
          }
          // Product-union caps keep joins smooth without angular ownership
          // switches or per-sample geometry/arrays.
          const body = 1 - outside,
            grain = grainField(u, v);
          color = 0.04 + body * (0.47 + 0.18 * grain);
          height = 0.05 + body * (0.62 + 0.03 * grain);
          roughness += body * (-0.09 + 0.03 * grain);
          occlusion = 0.36 + 0.6 * body;
          return;
        };
      }
      case 'knottednet': {
        const p = proceduralMaterialPresets.knottednet;
        const grainField = cachedNoise(96, 96, seed ^ 0x5f83);
        return () => {
          const xc = u * p.cells - 0.5,
            yc = v * p.cells - 0.5;
          const sagX = p.sag * Math.sin(Math.PI * xc) ** 2,
            sagY = p.sag * Math.sin(Math.PI * yc) ** 2;
          const qh = fract(yc - sagX + 0.5) - 0.5,
            qv = fract(xc - sagY + 0.5) - 0.5;
          const horizontal = smooth(clamp(1 - (qh / p.cordWidth) ** 2)),
            vertical = smooth(clamp(1 - (qv / p.cordWidth) ** 2));
          const cord = 1 - (1 - horizontal) * (1 - vertical);
          const dx = fract(xc + 0.5) - 0.5,
            dy = fract(yc + 0.5) - 0.5;
          const a = Math.SQRT1_2 * (dx + dy),
            b = Math.SQRT1_2 * (dy - dx);
          const first = smooth(
            clamp(1 - (a / p.knotLength) ** 2 - (b / p.knotWidth) ** 2),
          );
          const second = smooth(
            clamp(1 - (b / p.knotLength) ** 2 - (a / p.knotWidth) ** 2),
          );
          const knot = 1 - (1 - first) * (1 - second);
          const crease =
            smooth(clamp(1 - (dx / p.creaseWidth) ** 2)) *
            smooth(clamp(1 - (dy / p.creaseLength) ** 2));
          const exposed = cord * (1 - knot),
            net = exposed + knot;
          const twist =
            0.5 +
            0.25 * Math.cos(TAU * p.twists * xc) +
            0.25 * Math.cos(TAU * p.twists * yc);
          const grain = grainField(u, v);
          color =
            0.04 +
            0.48 * exposed +
            knot * (0.68 - 0.13 * crease) +
            0.04 * grain * net;
          height =
            0.04 +
            0.35 * exposed +
            knot * (0.71 - 0.07 * crease) +
            (0.025 * twist + 0.006 * grain) * net;
          roughness += 0.06 * (1 - net) - 0.04 * exposed + 0.05 * crease * knot;
          occlusion = 0.35 + 0.5 * exposed + knot * (0.61 - 0.09 * crease);
          return;
        };
      }
      case 'brickarches': {
        const p = proceduralMaterialPresets.brickarches;
        const planes = new Float64Array(p.voussoirs * 2);
        for (let i = 0; i < p.voussoirs; i++) {
          const angle = Math.PI + ((i + 0.5) * Math.PI) / p.voussoirs;
          planes[i * 2] = Math.cos(angle);
          planes[i * 2 + 1] = Math.sin(angle);
        }
        const stride = p.voussoirs + 2 * p.pierRows;
        const tones = new Float64Array(p.cells * p.cells * stride);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            for (let brick = 0; brick < stride; brick++)
              tones[(row * p.cells + col) * stride + brick] =
                0.5 + 0.5 * hash(col * stride + brick, row, seed ^ 0x3d67);
        const sinHalf = Math.sin(Math.PI / (2 * p.voussoirs)),
          cosHalf = Math.cos(Math.PI / (2 * p.voussoirs));
        const halfWidth = (p.outerRadius - p.innerRadius) / 2,
          pierX = (p.outerRadius + p.innerRadius) / 2;
        const grainField = cachedNoise(96, 96, seed ^ 0x4e79);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const cell = (Math.floor(vc) * p.cells + Math.floor(uc)) * stride;
          const x = fract(uc) - 0.5,
            y = fract(vc) - 0.5 - p.centerY;
          const radius = Math.hypot(x, y);
          const radial =
            smooth(clamp((p.outerRadius - p.gap - radius) / p.bevel)) *
            smooth(clamp((radius - p.innerRadius - p.gap) / p.bevel));
          let outline =
            smooth(clamp((p.outerRadius - radius) / p.bevel)) *
            smooth(clamp((radius - p.innerRadius) / p.bevel)) *
            smooth(clamp((p.bevel - y) / p.bevel));
          let face = 0,
            pigment = 0;
          for (let i = 0; i < p.voussoirs; i++) {
            const along = x * planes[i * 2] + y * planes[i * 2 + 1],
              across = y * planes[i * 2] - x * planes[i * 2 + 1];
            const wedge =
              radial *
              smooth(
                clamp(
                  (sinHalf * along - cosHalf * Math.abs(across) - p.gap) /
                    p.bevel,
                ),
              );
            face += wedge;
            pigment += wedge * tones[cell + i];
          }
          for (let side = 0; side < 2; side++) {
            const dx = x - (side ? pierX : -pierX);
            const pier =
              smooth(clamp((halfWidth - Math.abs(dx)) / p.bevel)) *
              smooth(clamp((y + p.bevel) / p.bevel)) *
              smooth(clamp((p.pierRows * p.courseHeight - y) / p.bevel));
            outline = 1 - (1 - outline) * (1 - pier);
            for (let row = 0; row < p.pierRows; row++) {
              const brick =
                smooth(clamp((halfWidth - p.gap - Math.abs(dx)) / p.bevel)) *
                smooth(
                  clamp(
                    (p.courseHeight / 2 -
                      p.gap -
                      Math.abs(y - (row + 0.5) * p.courseHeight)) /
                      p.bevel,
                  ),
                );
              face += brick;
              pigment +=
                brick * tones[cell + p.voussoirs + side * p.pierRows + row];
            }
          }
          const grain = grainField(u, v);
          // Radial and bed joints share recessed mortar; the opening remains
          // an opaque shaded surface, not an actual doorway or cutout.
          mortar = outline - face;
          color =
            0.045 * (1 - outline) +
            0.62 * pigment +
            0.08 * grain * face +
            0.5 * mortar;
          height = 0.06 + 0.1 * outline + 0.6 * face + 0.01 * grain * face;
          roughness += 0.12 * (1 - face) + 0.04 * grain * face;
          occlusion = 0.32 + 0.18 * outline + 0.48 * face;
          return;
        };
      }
      case 'cardamompods': {
        const p = proceduralMaterialPresets.cardamompods;
        const grainField = cachedNoise(96, 96, seed ^ 0x7c45);
        const cos = Math.SQRT1_2;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const sign = (Math.floor(uc) + Math.floor(vc)) & 1 ? -1 : 1;
          const x = cos * (dx + sign * dy),
            y = cos * (dy - sign * dx);
          const cap = clamp(1 - (y / p.halfLength) ** 2);
          const lens = cap * cap - (x / p.halfWidth) ** 2;
          const pod = smooth(clamp(lens / p.shoulder));
          const stem = smooth(
            clamp(
              (1 -
                (x / p.stemWidth) ** 2 -
                ((y - p.stemCenter) / p.stemLength) ** 2) /
                p.shoulder,
            ),
          );
          const body = 1 - (1 - pod) * (1 - stem);
          // The positive width floor keeps the converging ribs finite at
          // pointed tips; the compact pod mask removes them outside the skin.
          const width = p.halfWidth * (cap + p.tipFloor);
          const rib = 0.5 + 0.5 * Math.cos((TAU * 2 * x) / width);
          const dome = smooth(clamp(lens)),
            grain = grainField(u, v);
          color =
            0.025 + 0.25 * body + pod * (0.23 + 0.23 * rib + 0.03 * grain);
          height =
            0.06 +
            0.28 * body +
            pod * (0.33 * dome + 0.13 * rib + 0.008 * grain);
          roughness +=
            0.1 * (1 - body) + pod * (0.04 * (1 - rib) + 0.02 * grain);
          occlusion = 0.36 + 0.27 * body + pod * (0.21 + 0.14 * rib);
          return;
        };
      }
      case 'farfalle': {
        const p = proceduralMaterialPresets.farfalle;
        const grainField = cachedNoise(128, 128, seed ^ 0x6e39);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = turn ? dy : dx,
            y = turn ? dx : dy;
          const width =
            p.waist + p.wingSpread * smooth(clamp((x / p.wingRun) ** 2));
          const face =
            smooth(clamp((width - Math.abs(y)) / p.shoulder)) *
            smooth(
              clamp(
                (p.halfLength +
                  p.scallop * Math.cos(TAU * p.teeth * y) -
                  Math.abs(x)) /
                  p.shoulder,
              ),
            );
          const pleat = 0.5 + 0.5 * Math.cos((TAU * 1.5 * y) / width);
          const pinch = smooth(clamp(1 - (x / p.pinchRadius) ** 2));
          const grain = grainField(u, v);
          color =
            0.045 + face * (0.59 + 0.14 * pleat - 0.17 * pinch + 0.03 * grain);
          height =
            0.06 + face * (0.31 + 0.21 * pleat + 0.11 * pinch + 0.008 * grain);
          roughness += 0.18 * (1 - face) + face * (0.04 * pinch - 0.05 * pleat);
          occlusion = 0.38 + face * (0.53 + 0.07 * pleat - 0.12 * pinch);
          return;
        };
      }
      case 'castellatednuts': {
        const p = proceduralMaterialPresets.castellatednuts;
        const planes = new Float64Array(12);
        for (let side = 0; side < 6; side++) {
          planes[side * 2] = Math.cos((TAU * side) / 6);
          planes[side * 2 + 1] = Math.sin((TAU * side) / 6);
        }
        const grainField = cachedNoise(96, 96, seed ^ 0x5d73);
        const cos = Math.sqrt(3) / 2;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = turn ? cos * dx + 0.5 * dy : dx,
            y = turn ? cos * dy - 0.5 * dx : dy;
          let outer = 1,
            outsideSlots = 1;
          for (let side = 0; side < 6; side++) {
            const nx = planes[side * 2],
              ny = planes[side * 2 + 1];
            const along = x * nx + y * ny,
              across = y * nx - x * ny;
            outer *= smooth(clamp((p.inradius - along) / p.outerBevel));
            outsideSlots *=
              1 -
              smooth(
                clamp(
                  (1 -
                    ((along - p.slotCenter) / p.slotLength) ** 2 -
                    (across / p.slotWidth) ** 2) /
                    p.shoulder,
                ),
              );
          }
          const radius = Math.hypot(x, y);
          const ring =
            outer * smooth(clamp((radius - p.boreRadius) / p.boreBevel));
          // Slots lower the crown to a steel floor, not transparent cutouts;
          // the continuous inner ring remains below the six raised segments.
          const crown = ring * outsideSlots,
            grain = grainField(u, v);
          color = 0.1 + 0.21 * ring + 0.4 * crown + 0.03 * grain;
          height = 0.07 + 0.3 * ring + 0.39 * crown + 0.004 * grain;
          roughness += 0.32 * (1 - ring) + 0.17 * (ring - crown) + 0.02 * grain;
          occlusion = 0.4 + 0.26 * ring + 0.32 * crown;
          return;
        };
      }
      case 'peppercorns': {
        const p = proceduralMaterialPresets.peppercorns;
        const wrinkleField = cachedNoise(40, 40, seed ^ 0x3e79),
          grainField = cachedNoise(128, 128, seed ^ 0x6d43);
        const radiusSquared = p.radius * p.radius,
          scarSquared = p.scarRadius * p.scarRadius;
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const r2 = x * x + y * y,
            cap = clamp(1 - r2 / radiusSquared);
          const berry = smooth(clamp(cap / p.shoulder)),
            dome = smooth(cap),
            scar = smooth(clamp((1 - r2 / scarSquared) / p.shoulder));
          const fold = 2 * wrinkleField(u, v) - 1;
          const ridges = fold * fold,
            grain = grainField(u, v);
          color =
            0.035 +
            berry *
              (0.18 + 0.24 * dome + 0.16 * ridges + 0.03 * grain - 0.19 * scar);
          height =
            0.07 +
            berry *
              (0.25 +
                0.42 * dome +
                0.11 * ridges +
                0.008 * grain -
                0.14 * scar);
          roughness += 0.06 * berry - 0.04 * ridges * berry + 0.065 * scar;
          occlusion = 0.4 + berry * (0.49 + 0.09 * ridges - 0.12 * scar);
          return;
        };
      }
      case 'slottedmetal': {
        const p = proceduralMaterialPresets.slottedmetal;
        const grainField = cachedNoise(128, 8, seed ^ 0x7b53);
        const outerSquared = p.outerRadius * p.outerRadius,
          wallRange = outerSquared - p.coreRadius * p.coreRadius,
          aspect = p.columns / p.rows;
        return () => {
          const row = Math.floor(v * p.rows);
          const x = fract(u * p.columns - (row & 1) * 0.5) - 0.5,
            y = (fract(v * p.rows) - 0.5) * aspect;
          // Match both axes in column-cell units: rectangular slot pitch must
          // not stretch the machined semicircular ends into ellipses.
          const end = Math.max(0, Math.abs(y) - p.spine);
          const hole = smooth(
            clamp((outerSquared - end * end - x * x) / wallRange),
          );
          const bevel = 4 * hole * (1 - hole),
            grain = grainField(u, v);
          color = 0.64 + 0.07 * grain - 0.57 * hole + 0.11 * bevel;
          height = 0.64 + 0.008 * grain - 0.49 * hole + 0.03 * bevel;
          roughness += 0.42 * hole - 0.06 * bevel + 0.02 * grain;
          occlusion = 0.99 - 0.64 * hole;
          return;
        };
      }
      case 'burlwood': {
        const p = proceduralMaterialPresets.burlwood;
        const coarseField = cachedNoise(3, 3, seed ^ 0x4f69),
          swirlField = cachedNoise(7, 7, seed ^ 0x9d35),
          grainField = cachedNoise(96, 96, seed ^ 0x1b47);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const center = p.centers[Math.floor(y) * p.cells + Math.floor(x)];
          const dx = (fract(x) - center[0]) / p.radiusX,
            dy = (fract(y) - center[1]) / p.radiusY;
          const q = dx * dx + dy * dy;
          const support = smooth(clamp(1 - q)),
            core = smooth(clamp((p.core - q) / p.core));
          const swirl = swirlField(u, v),
            grain = grainField(u, v);
          // Closed contour grain replaces straight plank fibers. Local eye
          // distortion vanishes at both the pith and the compact support edge.
          const contour = 3 * coarseField(u, v) + 0.8 * swirl + 0.08 * grain;
          const latewood = (0.5 + 0.5 * Math.cos(TAU * contour)) ** 4;
          const eye =
            support > 0
              ? support *
                (0.5 +
                  0.5 *
                    Math.cos(
                      TAU * (p.rings * q + 0.2 * (swirl - 0.5) * q * support),
                    ))
              : 0;
          color = 0.74 - 0.26 * latewood - 0.36 * core - 0.12 * eye;
          height = 0.46 - 0.008 * latewood - 0.018 * core + 0.003 * grain;
          roughness += 0.06 * core + 0.025 * latewood + 0.012 * grain;
          occlusion = 0.99 - 0.05 * core - 0.015 * latewood;
          return;
        };
      }
      case 'trihexagonaltiles': {
        const p = proceduralMaterialPresets.trihexagonaltiles;
        const grainField = cachedNoise(96, 96, seed ^ 0x5c47);
        const inner = p.apothem - p.grout,
          outer = p.apothem + p.grout + p.bevel,
          reach = (2 * outer) / p.rowStep;
        return () => {
          const x = u * p.columns * 2,
            y = v * p.rows * p.rowStep,
            row = Math.floor(y / p.rowStep);
          let outsideFaces = 1,
            outsideExpanded = 1;
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy,
              dy = y - cy * p.rowStep;
            if (Math.abs(dy) >= outer) continue;
            const stagger = cy & 1,
              column = Math.floor((x - stagger) / 2);
            for (let ox = -1; ox <= 1; ox++) {
              const dx = x - (column + ox) * 2 - stagger;
              if (Math.abs(dx) >= reach) continue;
              const a = Math.abs(dy),
                b = Math.abs(p.apothem * dx + 0.5 * dy),
                c = Math.abs(p.apothem * dx - 0.5 * dy);
              const hex =
                smooth(clamp((inner - a) / p.bevel)) *
                smooth(clamp((inner - b) / p.bevel)) *
                smooth(clamp((inner - c) / p.bevel));
              const expanded =
                smooth(clamp((outer - a) / p.bevel)) *
                smooth(clamp((outer - b) / p.bevel)) *
                smooth(clamp((outer - c) / p.bevel));
              outsideFaces *= 1 - hex;
              outsideExpanded *= 1 - expanded;
            }
          }
          // Complementing every expanded neighbor leaves true triangular faces,
          // including where hexagon vertices meet across cell boundaries.
          const hex = 1 - outsideFaces,
            triangle = outsideExpanded,
            face = hex + triangle;
          const grain = grainField(u, v);
          color = 0.18 * hex + 0.9 * triangle + 0.025 * grain * face;
          height = 0.08 + 0.58 * hex + 0.5 * triangle + 0.003 * grain * face;
          mortar = clamp(1 - face);
          roughness +=
            0.36 * mortar - 0.1 * hex - 0.04 * triangle + 0.015 * grain;
          occlusion = 0.48 + 0.5 * face;
          return;
        };
      }
      case 'scalemail': {
        const p = proceduralMaterialPresets.scalemail;
        const grainField = cachedNoise(128, 8, seed ^ 0x4e93);
        return () => {
          const x = u * p.columns,
            y = v * p.rows,
            row = Math.floor(y);
          const grain = grainField(u, v);
          color = 0.07 + 0.02 * grain;
          height = 0.08 + 0.004 * grain;
          roughness = 0.9;
          occlusion = 0.57;
          // Upper rows cover lower rows; compact supports enter and leave the
          // neighborhood with zero value and slope, including at tile wrap.
          for (let oy = 1; oy >= -1; oy--) {
            const cy = row + oy,
              stagger = (cy & 1) * 0.5,
              column = Math.floor(x - stagger);
            for (let ox = -1; ox <= 1; ox++) {
              const dx = x - column - ox - stagger - 0.5,
                dy = y - cy - 0.5;
              const width =
                p.width *
                (0.6 + 0.4 * smooth(clamp((p.length - dy) / (2 * p.length))));
              const q = (dx / width) ** 2 + (dy / p.length) ** 2;
              const cover = smooth(clamp((1 - q) / p.shoulder));
              if (cover === 0) continue;
              const ridge =
                smooth(clamp(1 - (dx / p.ridgeWidth) ** 2)) *
                smooth(clamp(1 - (dy / p.ridgeLength) ** 2));
              const rivet = smooth(
                clamp(
                  (1 -
                    (dx / p.rivetRadius) ** 2 -
                    ((dy - p.rivetY) / p.rivetRadius) ** 2) /
                    p.shoulder,
                ),
              );
              const lip =
                smooth(clamp((q - 0.64) / 0.15)) *
                smooth(clamp((1 - q) / p.shoulder));
              color +=
                cover *
                (0.56 +
                  0.18 * ridge +
                  0.16 * rivet +
                  0.07 * lip +
                  0.04 * grain -
                  color);
              height +=
                cover *
                (0.47 +
                  0.2 * ridge +
                  0.11 * rivet +
                  0.06 * lip +
                  0.005 * grain -
                  height);
              roughness +=
                cover *
                (p.roughness -
                  0.06 * ridge -
                  0.03 * rivet +
                  0.03 * grain -
                  roughness);
              occlusion +=
                cover * (0.91 + 0.06 * ridge + 0.02 * rivet - occlusion);
            }
          }
          return;
        };
      }
      case 'wheatears': {
        const p = proceduralMaterialPresets.wheatears;
        const grainField = cachedNoise(96, 96, seed ^ 0x8d31);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const flip = (Math.floor(uc) + Math.floor(vc)) & 1 ? -1 : 1;
          const x = (fract(uc) - 0.5) * flip,
            y = (fract(vc) - 0.5) * flip;
          let outsideKernels = 1,
            outsideCrowns = 1,
            outsideGrooves = 1,
            outsideAwns = 1;
          for (let i = 0; i < p.pairs; i++)
            for (let side = -1; side <= 1; side += 2) {
              const dx = x * side - p.offset,
                dy = y - (i - (p.pairs - 1) / 2) * p.spacing;
              const along = (dx - dy) * Math.SQRT1_2,
                across = (dx + dy) * Math.SQRT1_2;
              const cap =
                1 -
                (along / p.kernelLength) ** 2 -
                (across / p.kernelWidth) ** 2;
              const kernel = smooth(clamp(cap / p.shoulder));
              outsideKernels *= 1 - kernel;
              outsideCrowns *= 1 - kernel * smooth(clamp(cap));
              outsideGrooves *=
                1 -
                kernel *
                  smooth(
                    clamp((1 - (across / p.grooveWidth) ** 2) / p.shoulder),
                  );
              outsideAwns *=
                1 -
                smooth(
                  clamp(
                    (1 -
                      ((along - p.awnCenter) / p.awnLength) ** 2 -
                      (across / p.awnWidth) ** 2) /
                      p.shoulder,
                  ),
                );
            }
          const stalk = smooth(
            clamp(
              (1 -
                (x / p.stalkWidth) ** 2 -
                ((y - p.stalkCenter) / p.stalkLength) ** 2) /
                p.shoulder,
            ),
          );
          const kernels = 1 - outsideKernels,
            crowns = 1 - outsideCrowns,
            grooves = 1 - outsideGrooves;
          const shape = 1 - outsideKernels * outsideAwns * (1 - stalk);
          const grain = grainField(u, v);
          color =
            0.08 +
            0.25 * shape +
            0.38 * kernels +
            0.08 * crowns -
            0.06 * grooves +
            0.03 * shape * grain;
          height =
            0.1 +
            0.22 * shape +
            0.34 * kernels +
            0.1 * crowns -
            0.05 * grooves +
            0.004 * shape * grain;
          roughness += 0.04 * shape - 0.1 * kernels + 0.02 * shape * grain;
          occlusion = 0.62 + 0.21 * shape + 0.16 * kernels - 0.05 * grooves;
          return;
        };
      }
      case 'cinnamonswirl': {
        const p = proceduralMaterialPresets.cinnamonswirl;
        const crumbField = cachedNoise(96, 96, seed ^ 0x6c25);
        const radiusSquared = p.radius * p.radius,
          coreSquared = p.core * p.core,
          fillingSquared = p.fillingRadius * p.fillingRadius;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = (fract(uc) - 0.5) * (turn ? -1 : 1),
            y = (fract(vc) - 0.5) * (turn ? -1 : 1);
          const r2 = x * x + y * y,
            r = Math.sqrt(r2);
          const bun = smooth(clamp((radiusSquared - r2) / p.shoulder));
          const phase = (TAU * r) / p.pitch;
          // Cartesian angle components avoid an atan2 branch seam. A flat core
          // replaces the singular center before its angular contribution begins.
          const wave =
            r > 0 ? (Math.cos(phase) * x + Math.sin(phase) * y) / r : 1;
          const core =
            1 - smooth(clamp((r2 - coreSquared / 4) / (coreSquared * 0.75)));
          const spiral = smooth(clamp((wave - 0.83) / 0.14));
          const filling =
            (core + (1 - core) * spiral) *
            smooth(clamp((fillingSquared - r2) / p.fillingShoulder));
          const crust = 1 - smooth(clamp((radiusSquared - r2) / 0.04));
          const crumb = crumbField(u, v);
          color =
            0.08 +
            bun *
              (0.76 - 0.5 * filling - p.crustStrength * crust + 0.04 * crumb);
          height = 0.1 + bun * (0.58 - 0.16 * filling + 0.012 * crumb);
          roughness += bun * (0.02 * crumb - 0.08 * filling);
          occlusion = 0.62 + bun * (0.37 - 0.12 * filling);
          return;
        };
      }
      case 'fivebarplate': {
        const p = proceduralMaterialPresets.fivebarplate;
        const grainField = cachedNoise(128, 8, seed ^ 0x2b61);
        const radiusSquared = p.radius * p.radius;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const a = (dx + dy) * Math.SQRT1_2,
            b = (dy - dx) * Math.SQRT1_2;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = turn ? b : a,
            y = turn ? -a : b;
          const end = Math.max(0, Math.abs(x) - p.halfLength);
          let outside = 1;
          for (let i = 0; i < p.bars; i++) {
            const across = y - (i - (p.bars - 1) / 2) * p.spacing;
            outside *=
              1 -
              smooth(
                clamp(
                  (radiusSquared - end * end - across * across) / p.shoulder,
                ),
              );
          }
          const bars = 1 - outside,
            grain = grainField(u, v);
          color = 0.32 + 0.51 * bars + 0.03 * grain;
          height = 0.18 + 0.55 * bars + 0.004 * grain;
          roughness -= 0.18 * bars - 0.02 * grain;
          occlusion = 0.82 + 0.17 * bars;
          return;
        };
      }
      case 'gingerslice': {
        const p = proceduralMaterialPresets.gingerslice;
        const grainField = cachedNoise(64, 64, seed ^ 0xf93d);
        const fiberField = cachedNoise(128, 12, seed ^ 0x1a4f);
        const lobes = new Float64Array(p.lobes.length * 4);
        for (let i = 0; i < p.lobes.length; i++) {
          const lobe = p.lobes[i],
            j = i * 4;
          lobes[j] = lobe[0];
          lobes[j + 1] = lobe[1];
          lobes[j + 2] = 1 / (lobe[2] * lobe[2]);
          lobes[j + 3] = 1 / (lobe[2] - p.rindWidth) ** 2;
        }
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = turn ? dy : dx,
            y = turn ? -dx : dy;
          let outside = 1,
            outsideFlesh = 1;
          for (let i = 0; i < lobes.length; i += 4) {
            const lx = x - lobes[i],
              ly = y - lobes[i + 1];
            const r2 = lx * lx + ly * ly;
            outside *= 1 - smooth(clamp((1 - r2 * lobes[i + 2]) / p.shoulder));
            outsideFlesh *=
              1 - smooth(clamp((1 - r2 * lobes[i + 3]) / p.shoulder));
          }
          const face = 1 - outside,
            flesh = 1 - outsideFlesh;
          const grain = grainField(u, v),
            fibers = fiberField(u, v);
          color =
            0.05 +
            0.22 * face +
            0.62 * flesh +
            0.025 * fibers * flesh +
            0.015 * grain * face;
          height =
            0.05 +
            0.46 * face +
            0.12 * flesh +
            0.007 * fibers * flesh +
            0.003 * grain * face;
          roughness += 0.15 * (1 - face) - 0.25 * flesh + 0.03 * grain * face;
          occlusion = 0.36 + 0.6 * face;
          return;
        };
      }
      case 'tuliptiles': {
        const p = proceduralMaterialPresets.tuliptiles;
        const grainField = cachedNoise(64, 64, seed ^ 0xe82b);
        const lobes = new Float64Array(p.lobes.length * 6);
        for (let i = 0; i < p.lobes.length; i++) {
          const lobe = p.lobes[i],
            j = i * 6;
          lobes[j] = lobe[0];
          lobes[j + 1] = lobe[1];
          lobes[j + 2] = 1 / lobe[2];
          lobes[j + 3] = 1 / lobe[3];
          lobes[j + 4] = Math.sin(lobe[4]);
          lobes[j + 5] = Math.cos(lobe[4]);
        }
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const face =
            smooth(clamp((p.faceSquared - x * x) / p.faceShoulder)) *
            smooth(clamp((p.faceSquared - y * y) / p.faceShoulder));
          let outside =
            1 -
            smooth(
              clamp(
                (1 -
                  (x / p.stemWidth) ** 2 -
                  ((y - p.stemY) / p.stemLength) ** 2) /
                  p.shoulder,
              ),
            );
          for (let i = 0; i < lobes.length; i += 6) {
            const dx = x - lobes[i],
              dy = y - lobes[i + 1];
            const along =
              (dx * lobes[i + 4] - dy * lobes[i + 5]) * lobes[i + 3];
            const across =
              (dx * lobes[i + 5] + dy * lobes[i + 4]) * lobes[i + 2];
            const bulge = clamp(1 - along * along);
            outside *=
              1 - smooth(clamp((bulge * bulge - across * across) / p.shoulder));
          }
          const flower = 1 - outside,
            grain = grainField(u, v);
          color = 0.93 - 0.78 * flower + 0.02 * grain;
          height = face * (0.5 + 0.04 * flower + 0.003 * grain);
          mortar = 1 - face;
          roughness += 0.45 * mortar + 0.03 * flower;
          occlusion = 0.55 + 0.43 * face;
          return;
        };
      }
      case 'circlips': {
        const p = proceduralMaterialPresets.circlips;
        const grainField = cachedNoise(96, 96, seed ^ 0xd719);
        const innerSquared = p.innerRadius * p.innerRadius,
          outerSquared = p.outerRadius * p.outerRadius;
        const gapSquared = p.gapWidth * p.gapWidth,
          lugSquared = p.lugRadius * p.lugRadius,
          boreSquared = p.boreRadius * p.boreRadius;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const flip = (Math.floor(uc) + Math.floor(vc)) & 1 ? -1 : 1;
          const x = (fract(uc) - 0.5) * flip,
            y = (fract(vc) - 0.5) * flip;
          const r2 = x * x + y * y;
          const ring =
            smooth(clamp((outerSquared - r2) / p.ringShoulder)) *
            (1 - smooth(clamp((innerSquared - r2) / p.ringShoulder)));
          const gap =
            smooth(clamp((gapSquared - x * x) / p.gapShoulder)) *
            smooth(clamp((y - p.gapStart) / p.gapFade));
          let outside = 1 - ring * (1 - gap),
            outsideBores = 1;
          for (let side = -1; side <= 1; side += 2) {
            const dx = x - side * p.lugX,
              dy = y - p.lugY;
            const d2 = dx * dx + dy * dy;
            outside *= 1 - smooth(clamp((lugSquared - d2) / p.lugShoulder));
            outsideBores *=
              1 - smooth(clamp((boreSquared - d2) / p.boreShoulder));
          }
          const face = (1 - outside) * outsideBores;
          const grain = grainField(u, v);
          color = 0.06 + 0.76 * face + 0.02 * grain;
          height = 0.06 + 0.62 * face + 0.004 * grain;
          roughness += 0.3 * (1 - face) + 0.02 * grain;
          occlusion = 0.33 + 0.65 * face;
          return;
        };
      }
      case 'lenoweave': {
        const p = proceduralMaterialPresets.lenoweave;
        const grainField = cachedNoise(128, 128, seed ^ 0xc607);
        return () => {
          const x = fract(u * p.columns) - 0.5,
            y = v * p.rows;
          const sin = Math.sin(Math.PI * y),
            cos = Math.cos(Math.PI * y);
          const a = smooth(
            clamp(1 - ((x - p.warpOffset * cos) / p.warpWidth) ** 2),
          );
          const b = smooth(
            clamp(1 - ((x + p.warpOffset * cos) / p.warpWidth) ** 2),
          );
          const weftDistance = fract(y + 0.5) - 0.5;
          const weft = smooth(clamp(1 - (weftDistance / p.weftWidth) ** 2));
          const aOverB = smooth(clamp(0.5 + 2 * sin));
          const aOverWeft = smooth(clamp(0.5 + 2 * cos));
          // Warp-pair crossings and weft crossings have disjoint supports.
          const wa = a * (1 - b * (1 - aOverB)) * (1 - weft * (1 - aOverWeft));
          const wb = b * (1 - a * aOverB) * (1 - weft * aOverWeft);
          const ww = weft * (1 - a * aOverWeft) * (1 - b * (1 - aOverWeft));
          const body = wa + wb + ww;
          const grain = grainField(u, v);
          const warpFiber = 0.5 + 0.5 * Math.cos(TAU * u * p.fibers),
            weftFiber = 0.5 + 0.5 * Math.cos(TAU * v * p.fibers);
          color =
            0.04 + 0.82 * wa + 0.48 * wb + 0.65 * ww + 0.015 * grain * body;
          height =
            0.06 +
            0.62 * (wa + wb) +
            0.52 * ww +
            0.08 * (wa - wb) * sin +
            0.008 * ((wa + wb) * warpFiber + ww * weftFiber) +
            0.005 * grain * body;
          roughness +=
            0.12 * (1 - body) - 0.08 * wa - 0.04 * wb + 0.02 * grain * body;
          occlusion = 0.34 + 0.64 * body;
          return;
        };
      }
      case 'maplesamara': {
        const p = proceduralMaterialPresets.maplesamara;
        const grainField = cachedNoise(64, 64, seed ^ 0xb5f3);
        const cos = Math.cos(p.angle),
          sin = Math.sin(p.angle);
        const wingEnd = p.wingCenter + p.wingLength;
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const flip = (Math.floor(uc) + Math.floor(vc)) & 1 ? -1 : 1;
          const x = (fract(uc) - 0.5) * flip,
            y = (fract(vc) - 0.5) * flip;
          let outsideWings = 1,
            outsideSeeds = 1,
            veins = 0;
          for (let side = -1; side <= 1; side += 2) {
            const dx = x * side - p.originX,
              dy = p.originY - y;
            const along = dx * sin + dy * cos,
              across = dx * cos - dy * sin;
            const width =
              p.wingBaseWidth + p.wingFlare * smooth(clamp(along / wingEnd));
            const wing = smooth(
              clamp(
                (1 -
                  ((along - p.wingCenter) / p.wingLength) ** 2 -
                  (across / width) ** 2) /
                  p.shoulder,
              ),
            );
            const kernel = smooth(
              clamp(
                (1 -
                  ((along - p.seedCenter) / p.seedLength) ** 2 -
                  (across / p.seedWidth) ** 2) /
                  p.shoulder,
              ),
            );
            outsideWings *= 1 - wing;
            outsideSeeds *= 1 - kernel;
            veins +=
              wing *
              (0.5 +
                0.5 *
                  Math.cos(TAU * ((across / width) * p.veins + along * 0.8)));
          }
          const stalk = smooth(
            clamp(
              (1 -
                (x / p.stalkWidth) ** 2 -
                ((y - p.originY) / p.stalkHeight) ** 2) /
                p.shoulder,
            ),
          );
          const wings = 1 - outsideWings,
            kernels = 1 - outsideSeeds;
          const body = 1 - outsideWings * outsideSeeds * (1 - stalk);
          const grain = grainField(u, v);
          color =
            0.04 +
            0.63 * wings * (1 - kernels) +
            0.32 * kernels +
            0.2 * stalk * (1 - wings) * (1 - kernels) +
            0.015 * grain * body;
          height =
            0.04 +
            0.31 * body +
            0.37 * kernels +
            0.025 * veins +
            0.01 * grain * body;
          roughness += 0.1 * (1 - body) - 0.08 * kernels + 0.02 * grain;
          occlusion = 0.32 + 0.64 * body;
          return;
        };
      }
      case 'starcrosstiles': {
        const p = proceduralMaterialPresets.starcrosstiles;
        const grainField = cachedNoise(64, 64, seed ^ 0xa4e1);
        const inner = p.halfSquare - p.grout,
          outer = p.halfSquare + p.grout + p.bevel;
        const innerSquared = inner * inner,
          outerSquared = outer * outer;
        const innerShoulder = p.bevel * (2 * inner - p.bevel),
          outerShoulder = p.bevel * (2 * outer - p.bevel);
        const neighborStart = 1 - Math.SQRT2 * outer;
        const starAt = (
          x: number,
          y: number,
          squared: number,
          shoulder: number,
        ): number => {
          const square =
            smooth(clamp((squared - x * x) / shoulder)) *
            smooth(clamp((squared - y * y) / shoulder));
          const a = (x + y) * Math.SQRT1_2,
            b = (x - y) * Math.SQRT1_2;
          const diamond =
            smooth(clamp((squared - a * a) / shoulder)) *
            smooth(clamp((squared - b * b) / shoulder));
          return 1 - (1 - square) * (1 - diamond);
        };
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const star = starAt(x, y, innerSquared, innerShoulder);
          let outside = 1 - starAt(x, y, outerSquared, outerShoulder);
          // Expanded star tips cross cells; include their neighbors before taking the complement.
          if (Math.abs(x) > neighborStart)
            outside *=
              1 - starAt(x - Math.sign(x), y, outerSquared, outerShoulder);
          if (Math.abs(y) > neighborStart)
            outside *=
              1 - starAt(x, y - Math.sign(y), outerSquared, outerShoulder);
          const cross = outside,
            face = star + cross;
          const grain = grainField(u, v);
          color = 0.14 * star + 0.88 * cross + 0.025 * grain * face;
          height = 0.08 + 0.55 * face + 0.003 * grain * face;
          mortar = clamp(1 - face);
          roughness += 0.42 * mortar + 0.025 * grain;
          occlusion = 0.48 + 0.51 * face;
          return;
        };
      }
      case 'clovebuds': {
        const p = proceduralMaterialPresets.clovebuds;
        const grainField = cachedNoise(96, 96, seed ^ 0xf3df);
        return () => {
          const uc = u * p.cells,
            vc = v * p.cells;
          const dx = fract(uc) - 0.5,
            dy = fract(vc) - 0.5;
          const turn = (Math.floor(uc) + Math.floor(vc)) & 1;
          const x = turn ? dy : dx,
            y = turn ? -dx : dy;
          const stem = smooth(
            clamp(
              (1 -
                (x / p.stemWidth) ** 2 -
                ((y - p.stemCenter) / p.stemLength) ** 2) /
                p.shoulder,
            ),
          );
          const head = smooth(
            clamp(
              (1 - (x * x + (y - p.headY) ** 2) / p.headRadius ** 2) /
                p.shoulder,
            ),
          );
          let outsideSepals = 1;
          for (let i = 0; i < 4; i++) {
            const sign = i < 2 ? 1 : -1;
            const along = (i & 1 ? y - p.collarY : x) * sign;
            const across = i & 1 ? x : y - p.collarY;
            outsideSepals *=
              1 -
              smooth(
                clamp(
                  (1 -
                    ((along - p.sepalDistance) / p.sepalLength) ** 2 -
                    (across / p.sepalWidth) ** 2) /
                    p.shoulder,
                ),
              );
          }
          const sepals = 1 - outsideSepals;
          const body = 1 - (1 - stem) * (1 - head) * outsideSepals;
          const grain = grainField(u, v);
          color = 0.025 + 0.45 * body + 0.17 * head + 0.03 * grain * body;
          height =
            0.04 +
            0.38 * body +
            0.26 * head +
            0.08 * sepals +
            0.02 * grain * body;
          roughness += 0.12 * (1 - body) + 0.035 * grain;
          occlusion = 0.3 + 0.65 * body;
          return;
        };
      }
      case 'brogueleather': {
        const p = proceduralMaterialPresets.brogueleather;
        const grainField = cachedNoise(96, 96, seed ^ 0xe2cd);
        const axes = new Float64Array(p.petals * 2);
        for (let i = 0; i < p.petals; i++) {
          axes[i * 2] = Math.cos((i * TAU) / p.petals);
          axes[i * 2 + 1] = Math.sin((i * TAU) / p.petals);
        }
        const centerSquared = p.centerRadius * p.centerRadius;
        const borderSquared = p.borderRadius * p.borderRadius;
        return () => {
          const x = fract(u * p.cells) - 0.5;
          const y = fract(v * p.cells) - 0.5;
          let outside =
            1 -
            smooth(clamp((1 - (x * x + y * y) / centerSquared) / p.shoulder));
          for (let i = 0; i < axes.length; i += 2) {
            const ax =
              (x * axes[i] + y * axes[i + 1] - p.petalDistance) / p.petalLong;
            const ay = (y * axes[i] - x * axes[i + 1]) / p.petalShort;
            outside *= 1 - smooth(clamp((1 - ax * ax - ay * ay) / p.shoulder));
          }
          const bx =
            (fract(u * p.cells * p.borderColumns) - 0.5) / p.borderColumns;
          for (const row of p.borderRows) {
            const by = Math.abs(y) - row;
            outside *=
              1 -
              smooth(
                clamp((1 - (bx * bx + by * by) / borderSquared) / p.shoulder),
              );
          }
          const holes = 1 - outside,
            grain = grainField(u, v);
          color = (0.48 + 0.18 * grain) * (1 - holes) + 0.03 * holes;
          height = (0.55 + 0.016 * grain) * (1 - holes) + 0.08 * holes;
          roughness += 0.34 * holes + 0.04 * grain * (1 - holes);
          occlusion = 0.98 - 0.72 * holes;
          return;
        };
      }
      case 'sanddollar': {
        const p = proceduralMaterialPresets.sanddollar;
        const grainField = cachedNoise(96, 96, seed ^ 0xd1bb);
        const axes = new Float64Array(p.petals * 4);
        for (let i = 0; i < p.petals; i++) {
          const angle = (i * TAU) / p.petals;
          axes[i * 4] = Math.cos(angle);
          axes[i * 4 + 1] = Math.sin(angle);
          axes[i * 4 + 2] = Math.cos(angle + Math.PI / p.petals);
          axes[i * 4 + 3] = Math.sin(angle + Math.PI / p.petals);
        }
        return () => {
          const x = fract(u * p.cells) - 0.5;
          const y = fract(v * p.cells) - 0.5;
          const sx = x / p.radiusX,
            sy = y / p.radiusY;
          const dome = clamp(1 - sx * sx - sy * sy);
          const face = smooth(clamp(dome / p.edge));
          let petalOutside = 1,
            holeOutside = 1;
          for (let i = 0; i < axes.length; i += 4) {
            const along =
              (x * axes[i] + y * axes[i + 1] - p.petalDistance) / p.petalLong;
            const across = (y * axes[i] - x * axes[i + 1]) / p.petalShort;
            const band = (along * along + across * across - 1) / p.petalBand;
            petalOutside *= 1 - smooth(clamp(1 - band * band));
            const lx =
              (x * axes[i + 2] + y * axes[i + 3] - p.lunuleDistance) /
              p.lunuleLong;
            const ly = (y * axes[i + 2] - x * axes[i + 3]) / p.lunuleShort;
            holeOutside *=
              1 - smooth(clamp((1 - lx * lx - ly * ly) / p.lunuleShoulder));
          }
          const petals = 1 - petalOutside,
            holes = 1 - holeOutside;
          const shell = face * (1 - holes);
          const grain = grainField(u, v);
          color =
            0.05 +
            shell * (0.79 + 0.08 * dome * dome - 0.18 * petals + 0.03 * grain);
          height =
            0.04 +
            shell * (0.28 + 0.08 * dome * dome - 0.08 * petals + 0.003 * grain);
          roughness += 0.12 * (1 - face) + 0.1 * holes + 0.05 * petals;
          occlusion = 0.35 + shell * (0.62 - 0.16 * petals);
          return;
        };
      }
      case 'starsocketbolts': {
        const p = proceduralMaterialPresets.starsocketbolts;
        const grainField = cachedNoise(96, 96, seed ^ 0xc0a9);
        const capSquared = p.capRadius * p.capRadius;
        const coreSquared =
          (p.socketRadius - p.lobeDepth) ** 2 - p.socketShoulder;
        const socketSquared = (p.socketRadius + p.lobeDepth) ** 2;
        return () => {
          const cx = u * p.cells,
            cy = v * p.cells;
          const x = fract(cx) - 0.5,
            y = fract(cy) - 0.5;
          const r2 = x * x + y * y;
          const face = smooth(clamp((capSquared - r2) / p.capShoulder));
          let socket = 0;
          if (r2 <= coreSquared) socket = 1;
          else if (r2 < socketSquared) {
            // cos(6θ) as a polynomial in sin²θ avoids angles and the center singularity.
            const t = (y * y) / r2;
            const wave = 1 + t * (-18 + t * (48 - 32 * t));
            const sign = (Math.floor(cx) + Math.floor(cy)) & 1 ? -1 : 1;
            const radius = p.socketRadius + p.lobeDepth * wave * sign;
            socket = smooth(clamp((radius * radius - r2) / p.socketShoulder));
          }
          const lens = clamp(1 - r2 / capSquared);
          const grain = grainField(u, v);
          color = 0.08 + face * (0.65 + 0.05 * grain - 0.48 * socket);
          height =
            0.05 + face * (0.64 + 0.1 * lens - 0.46 * socket) + 0.003 * grain;
          roughness += 0.23 * (1 - face) + 0.1 * socket + 0.02 * grain;
          occlusion = 0.4 + 0.58 * face - 0.3 * socket;
          return;
        };
      }
      case 'dovetailjoint': {
        const p = proceduralMaterialPresets.dovetailjoint;
        const verticalGrain = cachedNoise(96, 4, seed ^ 0x9d73);
        const horizontalGrain = cachedNoise(4, 96, seed ^ 0xae85);
        const tones = new Float64Array(p.rows);
        for (let row = 0; row < p.rows; row++)
          tones[row] = hash(0, row, seed ^ 0xbf97);
        return () => {
          const x = fract(u * p.columns) - 0.5;
          const cy = v * p.rows,
            y = fract(cy),
            row = Math.floor(cy);
          const flat = 1 - smooth(clamp((y - p.seamY + p.bevel) / p.bevel));
          const width =
            p.neckHalfWidth + (p.flare * (y - p.seamY)) / (p.tipY - p.seamY);
          const tail =
            smooth(clamp((p.tipY - y) / p.bevel)) *
            smooth(clamp((width - Math.abs(x)) / p.bevel));
          const owner = 1 - (1 - flat) * (1 - tail);
          const seam = 4 * owner * (1 - owner);
          const vertical = verticalGrain(u, v),
            horizontal = horizontalGrain(u, v);
          const top = row & 1 ? horizontal : vertical;
          const bottom = row & 1 ? vertical : horizontal;
          // Bottom board is the next row's top board, including grain and seeded tone.
          const grain = top * owner + bottom * (1 - owner);
          const tone =
            tones[row] * owner + tones[(row + 1) % p.rows] * (1 - owner);
          color = (0.28 + 0.38 * grain + 0.18 * tone) * (1 - 0.78 * seam);
          height = 0.5 - 0.26 * seam + 0.003 * grain;
          roughness += 0.18 * seam + 0.035 * grain;
          occlusion = 0.98 - 0.42 * seam;
          return;
        };
      }
      case 'pawprinttiles': {
        const p = proceduralMaterialPresets.pawprinttiles;
        const grainField = cachedNoise(96, 96, seed ^ 0x8c61);
        const toes = new Float64Array(p.toes.length * 4);
        for (let i = 0; i < p.toes.length; i++) {
          const [x, y, angle] = p.toes[i];
          toes[i * 4] = x;
          toes[i * 4 + 1] = y;
          toes[i * 4 + 2] = Math.cos(angle);
          toes[i * 4 + 3] = Math.sin(angle);
        }
        const pads = Float64Array.from(p.pads.flat());
        return () => {
          const x = fract(u * p.cells) - 0.5;
          const y = fract(v * p.cells) - 0.5;
          // A product of edge profiles rounds grout corners without a min-distance crease.
          const face =
            smooth(clamp((0.25 - x * x) / p.grout)) *
            smooth(clamp((0.25 - y * y) / p.grout));
          let outside = 1;
          for (let i = 0; i < toes.length; i += 4) {
            const dx = x - toes[i],
              dy = y - toes[i + 1];
            const ax = (dx * toes[i + 2] + dy * toes[i + 3]) / p.toeWidth;
            const ay = (dy * toes[i + 2] - dx * toes[i + 3]) / p.toeHeight;
            outside *= 1 - smooth(clamp((1 - ax * ax - ay * ay) / p.shoulder));
          }
          for (let i = 0; i < pads.length; i += 3) {
            const dx = (x - pads[i]) / pads[i + 2];
            const dy = (y - pads[i + 1]) / pads[i + 2];
            outside *= 1 - smooth(clamp((1 - dx * dx - dy * dy) / p.shoulder));
          }
          const stamp = 1 - outside;
          const grain = grainField(u, v);
          color = 0.92 - 0.76 * stamp + 0.025 * grain;
          height = face * (0.5 - 0.24 * stamp + 0.003 * grain);
          mortar = 1 - face;
          roughness += 0.5 * mortar + 0.12 * stamp;
          occlusion = 0.55 + 0.43 * face - 0.2 * stamp;
          return;
        };
      }
      case 'pomegranateslice': {
        const p = proceduralMaterialPresets.pomegranateslice;
        const grainField = cachedNoise(96, 96, seed ^ 0x7b59);
        const step = TAU / p.chambers;
        const directions = new Float64Array(p.chambers * 2);
        for (let i = 0; i < p.chambers; i++) {
          directions[i * 2] = Math.cos(i * step);
          directions[i * 2 + 1] = Math.sin(i * step);
        }
        const arils = Float64Array.from(p.arils.flat());
        const outerSquared = p.radius * p.radius;
        const innerSquared = p.innerRadius * p.innerRadius;
        return () => {
          const x = fract(u * p.cells) - 0.5;
          const y = fract(v * p.cells) - 0.5;
          const r2 = x * x + y * y;
          const face = smooth(clamp((outerSquared - r2) / p.edge));
          const inner = smooth(clamp((innerSquared - r2) / p.edge));
          // Chamber and aril supports end before sector borders, where pith takes over.
          const sector =
            Math.floor((Math.atan2(y, x) + TAU + step / 2) / step) % p.chambers;
          const c = directions[sector * 2],
            s = directions[sector * 2 + 1];
          const radial = x * c + y * s - p.chamberDistance;
          const tangent = y * c - x * s;
          const ax = radial / p.chamberLong,
            ay = tangent / p.chamberShort;
          const cavity = smooth(
            clamp((1 - ax * ax - ay * ay) / p.chamberShoulder),
          );
          let outside = 1;
          for (let i = 0; i < arils.length; i += 2) {
            const dx = (radial - arils[i]) / p.arilLong;
            const dy = (tangent - arils[i + 1]) / p.arilShort;
            outside *= 1 - smooth(clamp(1 - dx * dx - dy * dy));
          }
          const seeds = 1 - outside;
          const grain = grainField(u, v);
          color =
            0.06 +
            face * (0.18 + 0.64 * inner - 0.42 * cavity - 0.34 * seeds) +
            0.02 * grain;
          height =
            0.06 +
            face * (0.36 + 0.12 * (1 - inner) - 0.12 * cavity + 0.3 * seeds) +
            0.003 * grain;
          roughness -= 0.12 * face + 0.28 * seeds;
          occlusion = 0.4 + 0.48 * face - 0.16 * cavity + 0.23 * seeds;
          return;
        };
      }
      case 'wingnuts': {
        const p = proceduralMaterialPresets.wingnuts;
        const grainField = cachedNoise(96, 96, seed ^ 0x6f43);
        const cos = Math.cos(p.wingAngle),
          sin = Math.sin(p.wingAngle);
        const hubSquared = p.hubRadius * p.hubRadius;
        const boreSquared = p.boreRadius * p.boreRadius;
        return () => {
          const cx = u * p.cells,
            cy = v * p.cells;
          const fx = fract(cx) - 0.5,
            fy = fract(cy) - 0.5;
          const turned = (Math.floor(cx) + Math.floor(cy)) & 1;
          const x = turned ? fy : fx,
            y = turned ? -fx : fy;
          const r2 = x * x + y * y;
          const hub = smooth(clamp((hubSquared - r2) / p.hubShoulder));
          const bore = smooth(clamp((boreSquared - r2) / p.boreShoulder));
          let outside = 1;
          for (let side = -1; side <= 1; side += 2) {
            const dx = side * x - p.wingOffset,
              dy = y + p.wingLift;
            const ax = (dx * cos - dy * sin) / p.wingLength;
            const ay = (dx * sin + dy * cos) / p.wingWidth;
            outside *=
              1 - smooth(clamp((1 - ax * ax - ay * ay) / p.wingShoulder));
          }
          const wings = 1 - outside;
          const face = (1 - (1 - hub) * (1 - wings)) * (1 - bore);
          const grain = grainField(u, v);
          color = 0.08 + 0.7 * face + 0.08 * wings + 0.025 * grain;
          height = 0.06 + 0.62 * face + 0.12 * wings + 0.004 * grain;
          roughness += 0.24 * (1 - face) + 0.02 * grain;
          occlusion = 0.35 + 0.62 * face;
          return;
        };
      }
      case 'chainstitch': {
        const p = proceduralMaterialPresets.chainstitch;
        const grainField = cachedNoise(96, 96, seed ^ 0x5d39);
        return () => {
          const x = fract(u * p.columns) - 0.5;
          const y = fract(v * p.rows) - 0.5;
          let outside = 1;
          // Neighbor loops overlap across cell boundaries; a product union keeps joins C1.
          for (let offset = -1; offset <= 1; offset++) {
            const dy = y + offset;
            const ax = x / (p.halfWidth * (1 + p.taper * dy));
            const ay = dy / p.halfLength;
            const d = (ax * ax + ay * ay - 1) / p.band;
            outside *= 1 - smooth(clamp(1 - d * d));
          }
          const stitch = 1 - outside;
          const weave =
            Math.sin(TAU * u * p.threads) * Math.sin(TAU * v * p.threads);
          const grain = grainField(u, v);
          color = 0.08 + 0.78 * stitch + 0.025 * grain;
          height = 0.1 + 0.6 * stitch + 0.008 * weave + 0.004 * grain;
          roughness -= 0.22 * stitch;
          occlusion = 0.65 + 0.35 * stitch;
          return;
        };
      }
      case 'seedbeads': {
        const p = proceduralMaterialPresets.seedbeads;
        const tones = new Float64Array(p.columns * p.rows);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++)
            tones[row * p.columns + col] = hash(col, row, seed ^ 0x4d27);
        const holeSquared = p.holeRadius * p.holeRadius;
        return () => {
          const y = v * p.rows;
          const row = Math.floor(y);
          // Even row counts keep the half-bead stagger periodic across the tile wrap.
          const x = u * p.columns - 0.5 * (row & 1);
          const col = Math.floor(x);
          const fx = fract(x) - 0.5,
            fy = fract(y) - 0.5;
          const ax = fx / p.halfLength,
            ay = fy / p.halfHeight;
          const ax2 = ax * ax,
            ay2 = ay * ay;
          const face = smooth(clamp((1 - ax2 * ax2 - ay2 * ay2) / p.shoulder));
          const lens = clamp(1 - ay2);
          const hx = Math.abs(fx) - p.holeOffset;
          const hole = smooth(clamp(1 - (hx * hx + fy * fy) / holeSquared));
          const tone =
            tones[
              (((row % p.rows) + p.rows) % p.rows) * p.columns +
                (((col % p.columns) + p.columns) % p.columns)
            ]!;
          color =
            0.06 + face * (0.12 + 0.6 * tone * (0.6 + 0.4 * lens) - 0.2 * hole);
          height = 0.1 + face * (0.35 + 0.35 * lens - 0.3 * hole);
          roughness += 0.5 * (1 - face) - 0.1 * face * lens;
          occlusion = 0.3 + face * (0.6 + 0.1 * lens - 0.4 * hole);
          return;
        };
      }
      case 'greekkey': {
        const p = proceduralMaterialPresets.greekkey;
        const grainField = cachedNoise(96, 96, seed ^ 0x3b95);
        const widthSquared = p.halfWidth * p.halfWidth;
        const coreSquared = p.coreWidth * p.coreWidth;
        const lines = Float64Array.from(p.segments.flat());
        return () => {
          const x = fract(u * p.cells),
            y = fract(v * p.cells);
          let outside = 1,
            coreOutside = 1;
          // Squared distance to a segment is C1, so the product union has no ridge creases.
          for (let i = 0; i < lines.length; i += 4) {
            const ax = lines[i]!,
              ay = lines[i + 1]!;
            const dx = lines[i + 2]! - ax,
              dy = lines[i + 3]! - ay;
            const t = clamp(
              ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy),
            );
            const ex = ax + t * dx - x,
              ey = ay + t * dy - y;
            const d2 = ex * ex + ey * ey;
            outside *= 1 - smooth(clamp(1 - d2 / widthSquared));
            coreOutside *= 1 - smooth(clamp(1 - d2 / coreSquared));
          }
          const ridge = 1 - outside,
            core = 1 - coreOutside;
          const grain = grainField(u, v);
          color = 0.1 + 0.6 * ridge + 0.2 * core + 0.03 * grain;
          height = 0.12 + 0.5 * ridge + 0.16 * core + 0.006 * grain;
          roughness += 0.12 * (1 - ridge) + 0.02 * grain;
          occlusion = 0.55 + 0.45 * ridge;
          return;
        };
      }
      case 'eggcarton': {
        const p = proceduralMaterialPresets.eggcarton;
        const grainField = cachedNoise(96, 96, seed ^ 0x2e91);
        const cupSquared = p.cupRadius * p.cupRadius;
        const ribSquared = p.ribRadius * p.ribRadius;
        const peakSquared = p.peakRadius * p.peakRadius;
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const cup = smooth(
            clamp((cupSquared - x * x - y * y) / p.cupShoulder),
          );
          const ring = (x * x + y * y - ribSquared) / p.ribBand;
          const rib = smooth(clamp(1 - ring * ring)) * cup;
          const px = fract(u * p.cells + 0.5) - 0.5,
            py = fract(v * p.cells + 0.5) - 0.5;
          // Squared dome keeps each cone tip C1 while the tray floor stays flat.
          const peak =
            smooth(clamp(1 - (px * px + py * py) / peakSquared)) ** 2;
          const grain = grainField(u, v);
          color = 0.5 + 0.16 * peak - 0.2 * cup + 0.05 * rib + 0.04 * grain;
          height = 0.55 - 0.42 * cup + 0.08 * rib + 0.38 * peak + 0.006 * grain;
          roughness += 0.04 * grain + 0.04 * peak;
          occlusion = 0.95 - 0.36 * cup + 0.05 * peak + 0.1 * rib;
          return;
        };
      }
      case 'okraslice': {
        const p = proceduralMaterialPresets.okraslice;
        const grainField = cachedNoise(96, 96, seed ^ 0x63e7);
        const stride = 1 + 2 * p.chambers;
        const slices = new Float64Array(p.cells * p.cells * stride);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * stride;
            const phase = TAU * hash(col, row, seed ^ 0x34b9);
            slices[i] = phase;
            for (let chamber = 0; chamber < p.chambers; chamber++) {
              const a = phase + (TAU * chamber) / p.chambers;
              slices[i + 1 + 2 * chamber] = Math.cos(a);
              slices[i + 2 + 2 * chamber] = Math.sin(a);
            }
          }
        const longInverse = 1 / (p.chamberLong * p.chamberLong),
          shortInverse = 1 / (p.chamberShort * p.chamberShort),
          seedInverse = 1 / (p.seedRadius * p.seedRadius);
        return () => {
          const sx = u * p.cells,
            sy = v * p.cells;
          const i = (Math.floor(sy) * p.cells + Math.floor(sx)) * stride;
          const x = fract(sx) - 0.5,
            y = fract(sy) - 0.5;
          const r2 = x * x + y * y;
          const radius =
            p.radius +
            p.lobeDepth * Math.cos(p.chambers * (Math.atan2(y, x) - slices[i]));
          const face = smooth(clamp((radius * radius - r2) / p.edge));
          // The angular center is inside the saturated face and outside the rind.
          const rind = smooth(clamp((r2 - (radius - p.rind) ** 2) / p.edge));
          let cavities = 0,
            seeds = 0;
          for (let chamber = 0; chamber < p.chambers; chamber++) {
            const c = slices[i + 1 + 2 * chamber],
              s = slices[i + 2 + 2 * chamber];
            const along = x * c + y * s - p.chamberDistance;
            const across = -x * s + y * c;
            const q =
              along * along * longInverse + across * across * shortInverse;
            cavities += smooth(clamp((1 - q) / p.chamberShoulder));
            for (let side = -1; side <= 1; side += 2) {
              const offset = across - side * p.seedOffset;
              seeds += smooth(
                clamp(1 - (along * along + offset * offset) * seedInverse),
              );
            }
          }
          const grain = grainField(u, v);
          color =
            0.06 +
            face *
              (0.53 -
                0.28 * rind -
                0.38 * cavities +
                0.68 * seeds +
                0.015 * grain);
          height =
            0.04 +
            face * (0.62 - 0.4 * cavities + 0.26 * seeds + 0.005 * grain);
          roughness +=
            face * (0.1 * rind + 0.15 * cavities - 0.12 * seeds + 0.02 * grain);
          occlusion = 0.28 + face * (0.7 - 0.4 * cavities + 0.32 * seeds);
          return;
        };
      }
      case 'quatrefoiltile': {
        const p = proceduralMaterialPresets.quatrefoiltile;
        const grainField = cachedNoise(48, 48, seed ^ 0x72d5);
        const radiusSquared = p.lobeRadius * p.lobeRadius;
        const coreSquared = p.coreRadius * p.coreRadius;
        const dotSquared = p.dotRadius * p.dotRadius;
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          let outside =
            1 - smooth(clamp((coreSquared - x * x - y * y) / p.shoulder));
          // A central disk joins separated lobes while retaining deep concave notches.
          for (let arm = 0; arm < 4; arm++) {
            const dx =
              x - (arm === 0 ? p.lobeOffset : arm === 1 ? -p.lobeOffset : 0);
            const dy =
              y - (arm === 2 ? p.lobeOffset : arm === 3 ? -p.lobeOffset : 0);
            outside *=
              1 -
              smooth(clamp((radiusSquared - dx * dx - dy * dy) / p.shoulder));
          }
          const tile = 1 - outside;
          const dx = fract(u * p.cells + 0.5) - 0.5,
            dy = fract(v * p.cells + 0.5) - 0.5;
          const dot =
            smooth(clamp((dotSquared - (dx + dy) ** 2) / p.dotShoulder)) *
            smooth(clamp((dotSquared - (dx - dy) ** 2) / p.dotShoulder));
          const ceramic = tile + dot;
          const grain = grainField(u, v);
          color =
            0.34 + (0.48 + 0.025 * grain) * tile - (0.23 - 0.015 * grain) * dot;
          height = (0.68 + 0.004 * grain) * tile + (0.58 + 0.004 * grain) * dot;
          roughness +=
            0.48 * (1 - ceramic) + 0.04 * dot + 0.015 * grain * ceramic;
          occlusion = 0.42 + 0.58 * ceramic;
          mortar = 1 - ceramic;
          return;
        };
      }
      case 'smocking': {
        const p = proceduralMaterialPresets.smocking;
        const grainField = cachedNoise(48, 48, seed ^ 0x5e71);
        return () => {
          const x = u * p.columns,
            y = v * p.rows;
          const column = Math.floor(x);
          const spread = 0.25 + p.spread * Math.cos(Math.PI * y);
          let fold = 0;
          for (let offset = -1; offset <= 1; offset++)
            for (let side = -1; side <= 1; side += 2) {
              const distance =
                (x - column - offset - side * spread) / p.foldWidth;
              const cover = smooth(clamp(1 - distance * distance));
              fold += (1 - fold) * cover;
            }
          const row = Math.floor(y + 0.5);
          const sx = fract(x + (row % 2 ? 0.5 : 0)) - 0.5;
          const sy = y - row;
          const stitch = smooth(
            clamp(1 - (sx / p.stitchWidth) ** 2 - (sy / p.stitchHeight) ** 2),
          );
          const gather = (0.5 + 0.5 * Math.cos(TAU * y)) ** 4;
          const weave =
            0.5 +
            0.25 *
              (Math.cos(TAU * p.threads * u) + Math.cos(TAU * p.threads * v));
          const grain = grainField(u, v);
          // Alternating paired pleats pinch under the short horizontal stitches.
          const lift = fold * (1 - 0.45 * gather);
          color =
            0.2 + 0.42 * lift + 0.18 * stitch + 0.04 * grain + 0.03 * weave;
          height = 0.1 + 0.5 * lift + 0.09 * stitch + 0.006 * weave;
          roughness += 0.07 * (1 - fold) - 0.06 * stitch + 0.02 * grain;
          occlusion = 0.48 + 0.43 * fold - 0.1 * gather * fold + 0.1 * stitch;
        };
      }
      case 'mapleleaf': {
        const p = proceduralMaterialPresets.mapleleaf;
        const tipNorm =
          Math.sqrt(1 + p.tipRoundness * p.tipRoundness) - p.tipRoundness;
        const leaves = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 3;
            const angle = TAU * hash(col, row, seed ^ 0x6e51);
            leaves[i] = Math.cos(angle);
            leaves[i + 1] = Math.sin(angle);
            leaves[i + 2] = hash(col, row, seed ^ 0x3b27);
          }
        const veins = new Float64Array(p.lobes * 3);
        for (let lobe = 0; lobe < p.lobes; lobe++) {
          const angle = -Math.PI / 2 + (TAU * lobe) / p.lobes;
          const dx = p.veinTip * Math.cos(angle),
            dy = p.veinTip * Math.sin(angle) - p.veinRoot;
          veins[lobe * 3] = dx;
          veins[lobe * 3 + 1] = dy;
          veins[lobe * 3 + 2] = 1 / (dx * dx + dy * dy);
        }
        const grainField = cachedNoise(96, 96, seed ^ 0x5f13);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 3;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * leaves[i] + dy * leaves[i + 1],
            y = dy * leaves[i] - dx * leaves[i + 1];
          const angle = Math.atan2(y, x),
            squared = x * x + y * y;
          const lobeWave = Math.sin((p.lobes * (angle + Math.PI / 2)) / 2);
          const lobe =
            1 -
            (Math.sqrt(lobeWave * lobeWave + p.tipRoundness * p.tipRoundness) -
              p.tipRoundness) /
              tipNorm;
          const radius =
            p.innerRadius +
            p.lobeDepth * lobe +
            p.serration * lobe * Math.sin(15 * angle) ** 2;
          // The origin lies in the saturated interior, so angle has no polar seam.
          const leaf = smooth(
            clamp((radius * radius - squared) / p.edgeSquared),
          );
          const stem = smooth(
            clamp(
              1 -
                (x / p.stemWidth) ** 2 -
                ((y - p.stemCenter) / p.stemLength) ** 8,
            ),
          );
          const face = leaf + stem - leaf * stem;
          let vein = 0;
          for (let ray = 0; ray < p.lobes; ray++) {
            const j = ray * 3;
            const t = clamp(
              (x * veins[j] + (y - p.veinRoot) * veins[j + 1]) * veins[j + 2],
            );
            const a = x - t * veins[j],
              b = y - p.veinRoot - t * veins[j + 1];
            const cover = smooth(
              clamp(1 - (a * a + b * b) / (p.veinWidth * p.veinWidth)),
            );
            vein += (1 - vein) * cover;
          }
          const crown =
            clamp(1 - squared / (p.innerRadius + p.lobeDepth) ** 2) ** 2;
          const grain = grainField(u, v);
          color =
            0.07 +
            leaf * (0.55 + 0.1 * crown + 0.08 * vein + 0.05 * leaves[i + 2]) +
            0.35 * stem * (1 - leaf) +
            0.04 * grain * face;
          height =
            0.05 +
            leaf * (0.45 + 0.12 * crown + 0.07 * vein) +
            0.25 * stem * (1 - leaf);
          roughness +=
            0.16 * (1 - face) -
            0.1 * leaf -
            0.03 * vein * leaf +
            0.04 * grain * face;
          occlusion = 0.38 + 0.58 * face + 0.04 * vein * leaf;
        };
      }
      case 'rollerchain': {
        const p = proceduralMaterialPresets.rollerchain;
        const grainField = cachedNoise(16, 96, seed ^ 0x6e41);
        return () => {
          const row = Math.floor(v * p.rows);
          const x = u * p.columns - (row % 2) * 0.5;
          const y = fract(v * p.rows) - 0.5;
          const column = Math.floor(x);
          let face = 0,
            raised = 0;
          for (let offset = -1; offset <= 1; offset++) {
            const col = column + offset,
              dx = x - col - 0.5;
            const left = smooth(
              clamp(
                (1 -
                  ((dx + 0.5) ** 2 + y * y) / (p.headRadius * p.headRadius)) /
                  p.bevel,
              ),
            );
            const right = smooth(
              clamp(
                (1 -
                  ((dx - 0.5) ** 2 + y * y) / (p.headRadius * p.headRadius)) /
                  p.bevel,
              ),
            );
            const bridge = smooth(
              clamp(
                (1 - (dx / p.bridgeLength) ** 8 - (y / p.waistRadius) ** 2) /
                  p.bevel,
              ),
            );
            const plate = 1 - (1 - left) * (1 - right) * (1 - bridge);
            face += (1 - face) * plate;
            if (col % 2 === 0) raised += (1 - raised) * plate;
          }
          const pinX = fract(x + 0.5) - 0.5,
            radius = Math.hypot(pinX, y);
          const pin = smooth(
            clamp(
              (p.pinRadius * p.pinRadius - radius * radius) /
                (p.pinRadius * p.pinRadius - p.pinCore * p.pinCore),
            ),
          );
          const crown = smooth(
            clamp(1 - (radius * radius) / (p.pinRadius * p.pinRadius)),
          );
          const collar = smooth(
            clamp(1 - ((radius - p.collarRadius) / p.collarWidth) ** 2),
          );
          const grain = grainField(u, v);
          color =
            0.08 +
            0.45 * face +
            0.12 * raised +
            0.12 * pin -
            0.2 * collar +
            0.03 * grain * face;
          // Alternate outer plates overlap inner plates at their shared hinge pins.
          height =
            0.05 +
            0.4 * face +
            0.16 * raised +
            0.12 * pin +
            0.03 * crown -
            0.04 * collar +
            0.004 * grain * face;
          roughness +=
            0.12 * (1 - face) -
            0.12 * raised -
            0.12 * pin +
            0.2 * collar +
            0.02 * grain * face;
          occlusion = 0.3 + 0.65 * face - 0.2 * collar + 0.05 * pin;
        };
      }
      case 'ravioli': {
        const p = proceduralMaterialPresets.ravioli;
        const pillows = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 3;
            pillows[i] = 0.03 * (hash(col, row, seed ^ 0x6d31) - 0.5);
            pillows[i + 1] = 0.03 * (hash(col, row, seed ^ 0x3f57) - 0.5);
            pillows[i + 2] = hash(col, row, seed ^ 0x7c19);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x5b23);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 3;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const waveX = Math.cos(TAU * p.crimps * x),
            waveY = Math.cos(TAU * p.crimps * y);
          const face =
            smooth(
              clamp(
                (p.halfWidth + p.scallop * waveY - Math.abs(x)) / p.shoulder,
              ),
            ) *
            smooth(
              clamp(
                (p.halfWidth + p.scallop * waveX - Math.abs(y)) / p.shoulder,
              ),
            );
          const dome = smooth(
            clamp(
              1 -
                ((x - pillows[i]) / p.pillowRadius) ** 4 -
                ((y - pillows[i + 1]) / p.pillowRadius) ** 4,
            ),
          );
          const crimpX =
            smooth(
              clamp(1 - ((Math.abs(x) - p.crimpCenter) / p.crimpWidth) ** 2),
            ) *
            smooth(clamp((p.crimpSpan - Math.abs(y)) / 0.04)) *
            (0.5 + 0.5 * waveY) ** 4;
          const crimpY =
            smooth(
              clamp(1 - ((Math.abs(y) - p.crimpCenter) / p.crimpWidth) ** 2),
            ) *
            smooth(clamp((p.crimpSpan - Math.abs(x)) / 0.04)) *
            (0.5 + 0.5 * waveX) ** 4;
          const crimp = crimpX + crimpY - crimpX * crimpY;
          const grain = grainField(u, v);
          color =
            0.05 +
            face *
              (0.55 +
                0.15 * dome +
                0.06 * grain +
                0.04 * pillows[i + 2] -
                0.1 * crimp);
          // Fork marks indent the flat sealed rim; the filling remains a raised pillow.
          height =
            0.05 + face * (0.3 + 0.48 * dome + 0.01 * grain - 0.1 * crimp);
          roughness +=
            0.18 * (1 - face) +
            face * (0.03 * grain - 0.08 * dome + 0.05 * crimp);
          occlusion = 0.38 + face * (0.58 - 0.17 * crimp);
        };
      }
      case 'dendriticagate': {
        const p = proceduralMaterialPresets.dendriticagate;
        const count = 2 ** p.levels - 1,
          stride = count * 6;
        const branches = new Float64Array(p.cells * p.cells * stride);
        const angles = new Float64Array(count);
        for (let cell = 0; cell < p.cells * p.cells; cell++) {
          const rotation = TAU * hash(cell, 0, seed ^ 0x6c13);
          let extent = 0;
          for (let node = 0; node < count; node++) {
            const depth = Math.floor(Math.log2(node + 1));
            const i = cell * stride + node * 6;
            const parent = Math.floor((node - 1) / 2);
            const parentIndex = cell * stride + parent * 6;
            const angle =
              node === 0
                ? rotation
                : angles[parent] +
                  (node % 2 ? -1 : 1) *
                    (0.48 + 0.2 * hash(node, cell, seed ^ 0x4f25));
            angles[node] = angle;
            const length =
              p.branchLength *
              p.lengthDecay ** depth *
              (0.94 + 0.12 * hash(node, cell, seed ^ 0x7b39));
            const radius = p.branchWidth * p.widthDecay ** depth;
            const x =
              node === 0
                ? p.rootOffset * Math.sin(rotation)
                : branches[parentIndex] + branches[parentIndex + 2];
            const y =
              node === 0
                ? -p.rootOffset * Math.cos(rotation)
                : branches[parentIndex + 1] + branches[parentIndex + 3];
            const dx = length * Math.sin(angle),
              dy = length * Math.cos(angle);
            branches[i] = x;
            branches[i + 1] = y;
            branches[i + 2] = dx;
            branches[i + 3] = dy;
            branches[i + 4] = 1 / (length * length);
            branches[i + 5] = 1 / (radius * radius);
            extent = Math.max(
              extent,
              Math.hypot(x, y) + radius,
              Math.hypot(x + dx, y + dy) + radius,
            );
          }
          // Keep all rotated descendants inside their owning cell.
          const scale = Math.min(1, p.supportRadius / extent);
          for (let node = 0; node < count; node++) {
            const i = cell * stride + node * 6;
            for (let j = 0; j < 4; j++) branches[i + j] *= scale;
            branches[i + 4] /= scale * scale;
            branches[i + 5] /= scale * scale;
          }
        }
        const clouds = cachedNoise(8, 8, seed ^ 0x4e73);
        const grainField = cachedNoise(64, 64, seed ^ 0x6f21);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const offset =
            (Math.floor(vCell) * p.cells + Math.floor(uCell)) * stride;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          let inclusion = 0;
          if (x * x + y * y < p.supportRadius * p.supportRadius)
            for (let node = 0; node < count; node++) {
              const i = offset + node * 6;
              const px = x - branches[i],
                py = y - branches[i + 1];
              const t = clamp(
                (px * branches[i + 2] + py * branches[i + 3]) * branches[i + 4],
              );
              const dx = px - t * branches[i + 2],
                dy = py - t * branches[i + 3];
              const cover = smooth(
                clamp(1 - (dx * dx + dy * dy) * branches[i + 5]),
              );
              inclusion += (1 - inclusion) * cover;
            }
          const grain = grainField(u, v);
          color =
            (0.76 + 0.12 * clouds(u, v) + 0.03 * grain) * (1 - inclusion) +
            0.06 * inclusion;
          // Mineral inclusions lie below one polished surface, not raised veins.
          height = 0.5 + 0.003 * grain;
          roughness += 0.015 * grain;
          occlusion = 1;
        };
      }
      case 'eyeletcotton': {
        const p = proceduralMaterialPresets.eyeletcotton;
        const phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            phases[row * p.cells + col] = TAU * hash(col, row, seed ^ 0x6b51);
        const grainField = cachedNoise(96, 96, seed ^ 0x7c63);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = Math.floor(vCell) * p.cells + Math.floor(uCell);
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const radius = Math.hypot(x, y);
          const face = smooth(clamp((radius - p.holeRadius) / p.holeShoulder));
          const rim = smooth(
            clamp(1 - ((radius - p.rimRadius) / p.rimWidth) ** 2),
          );
          const stitch =
            rim > 0
              ? (0.5 +
                  0.5 * Math.cos(p.stitches * Math.atan2(y, x) + phases[i])) **
                3
              : 0;
          const weave =
            0.5 +
            0.25 *
              (Math.cos(TAU * p.threads * u) + Math.cos(TAU * p.threads * v));
          const grain = grainField(u, v);
          // The embroidered ring sits above the cloth, not inside the dark hole.
          color =
            0.04 * (1 - face) +
            face * (0.78 + 0.03 * weave + 0.02 * grain) +
            rim * (0.12 + 0.03 * stitch);
          height =
            0.05 +
            face * (0.3 + 0.02 * weave + 0.004 * grain) +
            rim * (0.18 + 0.1 * stitch);
          roughness += 0.12 * (1 - face) - rim * (0.12 + 0.04 * stitch);
          occlusion = 0.23 + 0.75 * face - 0.1 * rim + 0.08 * rim * stitch;
        };
      }
      case 'trilobitefossil': {
        const p = proceduralMaterialPresets.trilobitefossil;
        const rotations = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const angle = TAU * hash(col, row, seed ^ 0x5b71);
            const i = (row * p.cells + col) * 2;
            rotations[i] = Math.cos(angle);
            rotations[i + 1] = Math.sin(angle);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x6c83);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * rotations[i] + dy * rotations[i + 1],
            y = dy * rotations[i] - dx * rotations[i + 1];
          const headDome = clamp(
            1 -
              (x / p.headWidth) ** 2 -
              ((y - p.headCenter) / p.headLength) ** 2,
          );
          const head = smooth(clamp(headDome / p.shoulder));
          const body = smooth(
            clamp(
              (1 -
                (x / p.bodyWidth) ** 2 -
                ((y - p.bodyCenter) / p.bodyLength) ** 2) /
                p.shoulder,
            ),
          );
          const tail = smooth(
            clamp(
              (1 -
                (x / p.tailWidth) ** 2 -
                ((y - p.tailCenter) / p.tailLength) ** 2) /
                p.shoulder,
            ),
          );
          const face = 1 - (1 - head) * (1 - body) * (1 - tail);
          const axis =
            smooth(clamp(1 - (x / p.axisWidth) ** 2)) *
            smooth(clamp((y + 0.29) / 0.04)) *
            smooth(clamp((0.32 - y) / 0.06));
          const z = y - p.segmentCurve * x * x;
          const end = p.segmentStart + (p.segments - 1) * p.segmentPitch;
          const envelope =
            smooth(clamp((z - p.segmentStart + p.segmentPitch / 2) / 0.008)) *
            smooth(clamp((end + p.segmentPitch / 2 - z) / 0.008));
          const rib =
            envelope *
            (1 - head) *
            (0.5 +
              0.5 * Math.cos((TAU * (z - p.segmentStart)) / p.segmentPitch)) **
              3;
          const eyes =
            smooth(
              clamp(
                1 -
                  ((x - p.eyeOffset) / p.eyeRadius) ** 2 -
                  ((y - p.eyeCenter) / p.eyeRadius) ** 2,
              ),
            ) +
            smooth(
              clamp(
                1 -
                  ((x + p.eyeOffset) / p.eyeRadius) ** 2 -
                  ((y - p.eyeCenter) / p.eyeRadius) ** 2,
              ),
            );
          const grain = grainField(u, v);
          color =
            (1 - face) * (0.75 + 0.03 * grain) +
            face * (0.3 + 0.08 * rib + 0.05 * axis + 0.02 * grain);
          // The axial lobe joins the head and tail; paired pleurae remain segmented.
          height =
            0.2 +
            0.006 * grain +
            face *
              (0.3 +
                0.12 * axis +
                0.09 * rib * (1 - 0.6 * axis) +
                0.05 * eyes +
                0.06 * headDome * head);
          roughness += 0.02 * grain - 0.13 * face + 0.04 * face * rib;
          occlusion =
            0.98 + face * (-0.18 + 0.08 * axis + 0.06 * rib + 0.03 * eyes);
        };
      }
      case 'countersunkmetal': {
        const p = proceduralMaterialPresets.countersunkmetal;
        const grainField = cachedNoise(8, 128, seed ^ 0x4e61);
        const coneStart = p.boreRadius + p.boreShoulder;
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const radius = Math.hypot(x, y);
          const wall = smooth(clamp((radius - p.boreRadius) / p.boreShoulder));
          const t = clamp((radius - coneStart) / (p.coneRadius - coneStart));
          const e = p.coneShoulder;
          // Preserve a straight conical slope, with C1 shoulders at both ends.
          const cone =
            (t < e
              ? (t * t) / (2 * e)
              : t > 1 - e
                ? 1 - e - ((1 - t) * (1 - t)) / (2 * e)
                : t - e / 2) /
            (1 - e);
          const grain = grainField(u, v);
          color = 0.08 + 0.35 * wall + 0.32 * cone + 0.04 * grain * wall;
          height = 0.05 + 0.28 * wall + 0.45 * cone + 0.0015 * grain * wall;
          roughness +=
            0.25 * (1 - wall) + 0.06 * (1 - cone) * wall + 0.015 * grain * wall;
          occlusion = 0.3 + 0.35 * wall + 0.34 * cone;
        };
      }
      case 'logcabinparquet': {
        const p = proceduralMaterialPresets.logcabinparquet;
        const owners = new Uint8Array(p.units * p.units);
        const tones = new Float64Array(p.blocks * p.blocks * p.boards.length);
        for (let board = 0; board < p.boards.length; board++) {
          const [x, y, width, height] = p.boards[board];
          for (let row = y; row < y + height; row++)
            for (let col = x; col < x + width; col++)
              owners[row * p.units + col] = board;
          for (let block = 0; block < p.blocks * p.blocks; block++)
            tones[block * p.boards.length + board] = hash(
              board,
              block,
              seed ^ 0x5c61,
            );
        }
        const grainField = cachedNoise(8, 96, seed ^ 0x6d73);
        return () => {
          const uBlock = u * p.blocks,
            vBlock = v * p.blocks;
          const block = Math.floor(vBlock) * p.blocks + Math.floor(uBlock);
          const x = fract(uBlock) * p.units,
            y = fract(vBlock) * p.units;
          const owner = owners[Math.floor(y) * p.units + Math.floor(x)];
          const board = p.boards[owner];
          const dx = x - board[0],
            dy = y - board[1];
          const face =
            smooth(clamp((Math.min(dx, board[2] - dx) - p.gap) / p.bevel)) *
            smooth(clamp((Math.min(dy, board[3] - dy) - p.gap) / p.bevel));
          const horizontal = board[2] >= board[3];
          const along = horizontal ? dx : dy,
            across = horizontal ? dy : dx;
          const tone = tones[block * p.boards.length + owner];
          const grain = grainField(
            along / p.units + tone,
            across / p.units + 0.3 * tone,
          );
          // Lookup-cell boundaries within one long board are not wood joints.
          color = 0.06 + face * (0.32 + 0.25 * tone + 0.25 * grain);
          height = 0.1 + face * (0.65 + 0.004 * grain);
          roughness += 0.3 * (1 - face) + 0.03 * face * grain;
          occlusion = 0.55 + 0.43 * face;
        };
      }
      case 'staranise': {
        const p = proceduralMaterialPresets.staranise;
        const axes = new Float64Array(p.cells * p.cells * p.pods * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const phase = TAU * hash(col, row, seed ^ 0x3a61);
            for (let pod = 0; pod < p.pods; pod++) {
              const angle = phase + (pod * TAU) / p.pods;
              const i = ((row * p.cells + col) * p.pods + pod) * 2;
              axes[i] = Math.cos(angle);
              axes[i + 1] = Math.sin(angle);
            }
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x4b73);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i =
            (Math.floor(vCell) * p.cells + Math.floor(uCell)) * p.pods * 2;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const hub = smooth(clamp(1 - (x * x + y * y) / p.hubRadius ** 2));
          const grain = grainField(u, v);
          color = 0.04 + 0.3 * hub;
          height = 0.04 + 0.16 * hub;
          occlusion = 0.3 + 0.2 * hub;
          roughness += 0.02 * grain;
          for (let pod = 0; pod < p.pods; pod++) {
            const j = i + pod * 2;
            const along = x * axes[j] + y * axes[j + 1],
              across = y * axes[j] - x * axes[j + 1];
            const bulge = clamp(1 - ((along - p.podCenter) / p.podLength) ** 2);
            const face = smooth(
              clamp((bulge * bulge - (across / p.podWidth) ** 2) / p.shoulder),
            );
            const cavity = smooth(
              clamp(
                (1 -
                  ((along - p.podCenter) / p.cavityLength) ** 2 -
                  (across / p.cavityWidth) ** 2) /
                  0.2,
              ),
            );
            const kernel = smooth(
              clamp(
                (1 -
                  ((along - p.seedCenter) / p.seedLength) ** 2 -
                  (across / p.seedWidth) ** 2) /
                  0.2,
              ),
            );
            // Pointed woody pod walls surround a lower cavity and its smooth seed.
            color +=
              face * (0.58 + 0.03 * grain - 0.4 * cavity + 0.16 * kernel);
            height +=
              face *
              (0.5 +
                0.1 * bulge -
                0.36 * cavity +
                0.14 * kernel +
                0.008 * grain);
            roughness -= 0.25 * face * kernel;
            occlusion += face * (0.65 - 0.35 * cavity + 0.1 * kernel);
          }
        };
      }
      case 'crossstitch': {
        const p = proceduralMaterialPresets.crossstitch;
        const stitches = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 2;
            stitches[i] = hash(col, row, seed ^ 0x6c41);
            stitches[i + 1] = TAU * hash(col, row, seed ^ 0x7d53);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x2e65);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const a = (x + y) * Math.SQRT1_2,
            b = (y - x) * Math.SQRT1_2;
          const upper =
            smooth(clamp(1 - (b / p.halfWidth) ** 2)) *
            smooth(clamp((p.halfLength - Math.abs(a)) / p.endShoulder));
          const lower =
            smooth(clamp(1 - (a / p.halfWidth) ** 2)) *
            smooth(clamp((p.halfLength - Math.abs(b)) / p.endShoulder));
          const visibleLower = lower * (1 - upper),
            coverage = upper + visibleLower;
          const upperFiber =
              0.5 +
              0.5 *
                Math.cos((TAU * p.fibers * b) / p.halfWidth + stitches[i + 1]),
            lowerFiber =
              0.5 +
              0.5 *
                Math.cos((TAU * p.fibers * a) / p.halfWidth + stitches[i + 1]);
          const fiber = upper * upperFiber + visibleLower * lowerFiber;
          const weave =
            0.5 +
            0.25 *
              (Math.cos(TAU * p.threads * u) + Math.cos(TAU * p.threads * v));
          const grain = grainField(u, v);
          // The upper diagonal hides the lower one instead of adding both heights.
          color =
            (1 - coverage) * (0.9 + 0.03 * weave) +
            coverage * (0.2 + 0.12 * stitches[i]) +
            0.04 * fiber;
          height =
            0.06 +
            0.55 * upper +
            0.4 * visibleLower +
            0.012 * fiber +
            0.02 * weave * (1 - coverage) +
            0.005 * grain;
          roughness += 0.02 * grain - 0.12 * coverage;
          occlusion = 0.98 - 0.18 * coverage + 0.16 * upper;
        };
      }
      case 'monsteraleaf': {
        const p = proceduralMaterialPresets.monsteraleaf;
        const rotations = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const phase = TAU * hash(col, row, seed ^ 0x4a71);
            const i = (row * p.cells + col) * 2;
            rotations[i] = Math.cos(phase);
            rotations[i + 1] = Math.sin(phase);
          }
        const inverseSlopeLength = 1 / Math.hypot(1, p.slope);
        const grainField = cachedNoise(96, 96, seed ^ 0x5b83);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * rotations[i] + dy * rotations[i + 1],
            y = dy * rotations[i] - dx * rotations[i + 1],
            a = Math.abs(x);
          let blade = smooth(
            clamp((1 - (x / p.width) ** 2 - (y / p.length) ** 2) / p.shoulder),
          );
          const notch = smooth(
            clamp(
              (1 -
                (x / p.notchWidth) ** 2 -
                ((y - p.notchY) / p.notchLength) ** 2) /
                p.shoulder,
            ),
          );
          blade *= 1 - notch;
          let branches = 0;
          for (const level of p.levels) {
            const hx = a - p.holeX,
              hy = y - level - p.slope * p.holeX;
            const along = (hx + p.slope * hy) * inverseSlopeLength,
              across = (hy - p.slope * hx) * inverseSlopeLength;
            const hole = smooth(
              clamp(
                (1 -
                  (along / p.holeLength) ** 2 -
                  (across / p.holeWidth) ** 2) /
                  p.shoulder,
              ),
            );
            const offset = y - level - p.slope * a;
            const slit =
              smooth(clamp(1 - (offset / p.slitWidth) ** 2)) *
              smooth(clamp((a - p.slitStart) / p.slitShoulder));
            blade *= (1 - hole) * (1 - slit);
            const veinOffset = offset - 0.08;
            branches +=
              smooth(clamp(1 - (veinOffset / p.veinWidth) ** 2)) *
              smooth(clamp(a / 0.025));
          }
          const midrib =
            smooth(clamp(1 - (x / p.midribWidth) ** 2)) *
            smooth(clamp((0.34 - Math.abs(y)) / 0.05));
          const grain = grainField(u, v);
          // Closed inner fenestrations and open margin cuts share opaque backing.
          color =
            0.04 +
            blade * (0.55 + 0.08 * grain + 0.1 * midrib + 0.04 * branches);
          height =
            0.04 +
            blade * (0.58 + 0.02 * grain + 0.05 * midrib + 0.025 * branches);
          roughness += 0.2 * (1 - blade) + 0.02 * grain * blade;
          occlusion = 0.3 + 0.68 * blade;
        };
      }
      case 'cucumberslices': {
        const p = proceduralMaterialPresets.cucumberslices;
        const axes = new Float64Array(p.cells * p.cells * p.chambers * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const phase = TAU * hash(col, row, seed ^ 0x2e51);
            for (let chamber = 0; chamber < p.chambers; chamber++) {
              const i = ((row * p.cells + col) * p.chambers + chamber) * 2;
              const angle = phase + (TAU * chamber) / p.chambers;
              axes[i] = Math.cos(angle);
              axes[i + 1] = Math.sin(angle);
            }
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x3f63);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i =
            (Math.floor(vCell) * p.cells + Math.floor(uCell)) * p.chambers * 2;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5,
            radius = Math.hypot(x, y);
          const face = smooth(clamp((p.radius - radius) / p.edge));
          const rind = smooth(clamp((radius - p.rindStart) / p.rindWidth));
          let chambers = 0,
            seeds = 0;
          for (let chamber = 0; chamber < p.chambers; chamber++) {
            const j = i + chamber * 2;
            const along = x * axes[j] + y * axes[j + 1],
              across = y * axes[j] - x * axes[j + 1];
            const gel = smooth(
              clamp(
                (1 -
                  ((along - p.chamberCenter) / p.chamberLength) ** 2 -
                  (across / p.chamberWidth) ** 2) /
                  p.shoulder,
              ),
            );
            chambers += gel;
            if (gel > 0)
              for (const position of p.seedPositions)
                seeds += smooth(
                  clamp(
                    (1 -
                      ((along - position) / p.seedLength) ** 2 -
                      (across / p.seedWidth) ** 2) /
                      p.shoulder,
                  ),
                );
          }
          const grain = grainField(u, v);
          color =
            0.05 +
            face *
              (0.68 +
                0.015 * grain -
                0.58 * rind -
                0.28 * chambers +
                0.48 * seeds);
          // Flesh, gel, seeds and rind share a flush cut face, not open air canals.
          height = 0.05 + face * (0.55 + 0.004 * grain);
          roughness +=
            0.02 * grain +
            face * (0.18 * rind - 0.08 * chambers + 0.04 * seeds);
          occlusion = 0.3 + 0.69 * face;
        };
      }
      case 'polkadotfabric': {
        const p = proceduralMaterialPresets.polkadotfabric;
        const shiftU = hash(0, 0, seed ^ 0x5d47),
          shiftV = hash(1, 0, seed ^ 0x5d47);
        const grainField = cachedNoise(96, 96, seed ^ 0x6e59);
        return () => {
          const uCell = fract(u + shiftU) * p.cells,
            vCell = fract(v + shiftV) * p.cells;
          const row = Math.floor(vCell);
          const x = fract(uCell - 0.5 * (row & 1)) - 0.5,
            y = fract(vCell) - 0.5;
          const dot = smooth(
            clamp((1 - (x * x + y * y) / (p.radius * p.radius)) / p.shoulder),
          );
          const warp = 0.5 + 0.5 * Math.cos(TAU * p.threads * u),
            weft = 0.5 + 0.5 * Math.cos(TAU * p.threads * v);
          const over =
            0.5 +
            0.5 *
              Math.cos(Math.PI * p.threads * u) *
              Math.cos(Math.PI * p.threads * v);
          const weave =
            warp * (0.35 + 0.25 * over) +
            weft * (0.35 + 0.25 * (1 - over)) -
            0.3 * warp * weft;
          const grain = grainField(u, v);
          // Staggered dots are pigment; their rims create no normal or AO ridges.
          color = 0.12 + 0.78 * dot + 0.03 * weave + 0.02 * grain;
          height = 0.2 + 0.15 * weave + 0.02 * grain;
          roughness += 0.025 * (1 - weave) + 0.02 * grain - 0.04 * dot;
          occlusion = 0.88 + 0.1 * weave;
        };
      }
      case 'pistachios': {
        const p = proceduralMaterialPresets.pistachios;
        const rotations = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const phase = TAU * hash(col, row, seed ^ 0x3c47);
            const i = (row * p.cells + col) * 2;
            rotations[i] = Math.cos(phase);
            rotations[i + 1] = Math.sin(phase);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x4d59);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * rotations[i] + dy * rotations[i + 1],
            y = dy * rotations[i] - dx * rotations[i + 1];
          const dome = clamp(
            1 - (x / p.shellWidth) ** 2 - (y / p.shellLength) ** 2,
          );
          const face = smooth(clamp(dome / p.shoulder));
          const opening = smooth(
            clamp(
              (1 - (x / p.openingWidth) ** 2 - (y / p.openingLength) ** 2) /
                p.shoulder,
            ),
          );
          const kernel = smooth(
            clamp(
              (1 - (x / p.kernelWidth) ** 2 - (y / p.kernelLength) ** 2) /
                p.shoulder,
            ),
          );
          const grain = grainField(u, v);
          const fiber =
            0.5 + 0.5 * Math.cos(TAU * (p.fibers * x + 0.5 * y * y));
          // Two pale shell lips sit above the green kernel and its darker side gaps.
          color =
            0.08 +
            face * (0.82 + 0.03 * grain - 0.72 * opening + 0.14 * kernel);
          height =
            0.05 +
            face *
              (0.35 +
                0.3 * dome -
                0.3 * opening +
                0.13 * kernel +
                0.008 * grain +
                0.006 * fiber * (1 - opening));
          roughness += 0.03 * grain + face * (0.12 * opening - 0.18 * kernel);
          occlusion = 0.3 + face * (0.67 - 0.4 * opening + 0.15 * kernel);
        };
      }
      case 'sawblades': {
        const p = proceduralMaterialPresets.sawblades;
        const phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            phases[row * p.cells + col] = TAU * hash(col, row, seed ^ 0x6a43);
        const grainField = cachedNoise(96, 96, seed ^ 0x7b55);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5,
            radius = Math.hypot(x, y);
          const phase = phases[Math.floor(vCell) * p.cells + Math.floor(uCell)];
          let face = 0;
          if (radius > p.boreRadius && radius < p.rootRadius + p.toothDepth) {
            const t = fract(((Math.atan2(y, x) - phase) * p.teeth) / TAU);
            const tooth =
              t < p.toothRise
                ? smooth(t / p.toothRise)
                : 1 - smooth((t - p.toothRise) / (1 - p.toothRise));
            face =
              smooth(
                clamp(
                  (p.rootRadius + p.toothDepth * tooth - radius) / p.edgeBevel,
                ),
              ) * smooth(clamp((radius - p.boreRadius) / p.boreBevel));
          }
          const grain = grainField(u, v);
          const machining = 0.5 + 0.5 * Math.cos(TAU * p.machining * radius);
          // Asymmetric teeth cut the silhouette, not the flat blade face.
          // The arbor hole and gullets reveal the same opaque metal backing.
          color =
            (1 - face) * (0.12 + 0.05 * grain) +
            face * (0.7 + 0.05 * grain + 0.04 * machining);
          height =
            0.06 +
            0.003 * grain +
            face * (0.45 + 0.003 * grain + 0.001 * machining);
          roughness +=
            0.02 * grain + 0.22 * (1 - face) + 0.04 * machining * face;
          occlusion = 0.45 + 0.53 * face;
        };
      }
      case 'snowflaketiles': {
        const p = proceduralMaterialPresets.snowflaketiles;
        const rotations = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const angle = TAU * hash(col, row, seed ^ 0x4e57);
            const i = (row * p.cells + col) * 2;
            rotations[i] = Math.cos(angle);
            rotations[i + 1] = Math.sin(angle);
          }
        const segments = new Float64Array(
          p.arms * (1 + p.branchPositions.length * 2) * 5,
        );
        let offset = 0;
        const add = (x: number, y: number, dx: number, dy: number): void => {
          segments[offset++] = x;
          segments[offset++] = y;
          segments[offset++] = dx;
          segments[offset++] = dy;
          segments[offset++] = 1 / (dx * dx + dy * dy);
        };
        for (let arm = 0; arm < p.arms; arm++) {
          const angle = (TAU * arm) / p.arms,
            c = Math.cos(angle),
            s = Math.sin(angle);
          add(0, 0, p.radius * c, p.radius * s);
          for (const position of p.branchPositions)
            for (const side of [-1, 1]) {
              const dx = p.branchLength * 0.5,
                dy = side * p.branchLength * Math.sqrt(3) * 0.5;
              add(position * c, position * s, dx * c - dy * s, dx * s + dy * c);
            }
        }
        const inverseWidth2 = 1 / (p.lineWidth * p.lineWidth);
        const grainField = cachedNoise(96, 96, seed ^ 0x5f69);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const rx = x * rotations[i] + y * rotations[i + 1],
            ry = y * rotations[i] - x * rotations[i + 1];
          let unprinted = 1;
          for (let j = 0; j < segments.length; j += 5) {
            const px = rx - segments[j],
              py = ry - segments[j + 1],
              dx = segments[j + 2],
              dy = segments[j + 3];
            const t = clamp((px * dx + py * dy) * segments[j + 4]);
            const ex = px - t * dx,
              ey = py - t * dy;
            unprinted *=
              1 - smooth(clamp(1 - (ex * ex + ey * ey) * inverseWidth2));
          }
          const motif = 1 - unprinted;
          const face =
            smooth(clamp((0.5 - Math.abs(x) - p.grout) / p.bevel)) *
            smooth(clamp((0.5 - Math.abs(y) - p.grout) / p.bevel));
          const grain = grainField(u, v);
          mortar = 1 - face;
          color = 0.1 + 0.84 * motif + 0.02 * grain;
          // Glazed pigment stays flush; only the square tile joints affect relief.
          height = 0.15 + face * (0.6 + 0.006 * grain);
          roughness += 0.02 * grain + 0.5 * mortar + 0.04 * motif * face;
          occlusion = 0.7 + 0.29 * face;
        };
      }
      case 'circularpavers': {
        const p = proceduralMaterialPresets.circularpavers;
        const count = 1 + (p.sectors * p.courses * (p.courses + 1)) / 2;
        const stride = count + 1;
        const stones = new Float64Array(p.cells * p.cells * stride);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * stride;
            stones[i] = TAU * hash(col, row, seed ^ 0x3d51);
            for (let stone = 0; stone < count; stone++)
              stones[i + 1 + stone] = hash(
                col * count + stone,
                row,
                seed ^ 0x4e63,
              );
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x5f75);
        const outerRadius = (p.courses + 1) * p.courseWidth;
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * stride;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const radius = Math.hypot(x, y);
          let face = 0,
            stone = 0;
          if (radius < p.courseWidth) {
            face = smooth(clamp((p.courseWidth - radius - p.grout) / p.bevel));
          } else if (radius < outerRadius) {
            const course = Math.min(
              p.courses,
              Math.floor(radius / p.courseWidth),
            );
            const sectors = p.sectors * course;
            const phase = stones[i] + ((course % 2) * Math.PI) / sectors;
            const turn = fract((Math.atan2(y, x) - phase) / TAU) * sectors;
            const sector = Math.floor(turn) % sectors,
              local = fract(turn);
            const radial = Math.min(
              radius - course * p.courseWidth,
              (course + 1) * p.courseWidth - radius,
            );
            const angular =
              radius * Math.sin((Math.min(local, 1 - local) * TAU) / sectors);
            face =
              smooth(clamp((radial - p.grout) / p.bevel)) *
              smooth(clamp((angular - p.grout) / p.bevel));
            stone = 1 + (p.sectors * (course - 1) * course) / 2 + sector;
          }
          const grain = grainField(u, v);
          mortar = 1 - face;
          // Both circular and radial joints use physical cell-space distances.
          // Owner changes happen inside grout; the center stone has no angle field.
          color =
            face * (0.35 + 0.3 * stones[i + 1 + stone] + 0.06 * grain) +
            0.5 * mortar;
          height = 0.08 + face * (0.68 + 0.015 * grain);
          roughness += 0.04 * grain * face + 0.13 * mortar;
          occlusion = 0.55 + 0.42 * face;
        };
      }
      case 'acornbarnacles': {
        const p = proceduralMaterialPresets.acornbarnacles;
        const rotations = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const phase = TAU * hash(col, row, seed ^ 0x5b47);
            const i = (row * p.cells + col) * 2;
            rotations[i] = Math.cos(phase);
            rotations[i + 1] = Math.sin(phase);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x6c59);
        const rounding = p.apertureRound * p.apertureRound;
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * rotations[i] + dy * rotations[i + 1],
            y = dy * rotations[i] - dx * rotations[i + 1];
          const radius = Math.hypot(x, y);
          const face = smooth(clamp((p.radius - radius) / p.edge));
          const crown =
            1 - smooth(clamp((radius - p.crownStart) / p.crownWidth));
          const diamond =
            Math.sqrt(x * x + rounding) + Math.sqrt(y * y + rounding);
          const aperture =
            1 - smooth(clamp((diamond - p.apertureInner) / p.apertureShoulder));
          let seam = 0,
            ribs = 0;
          if (radius > p.ribStart && face > 0) {
            const angle = Math.atan2(y, x);
            const fade = smooth(clamp((radius - p.ribStart) / p.ribShoulder));
            seam = fade * smooth(clamp((Math.cos(6 * angle) - 0.88) / 0.12));
            ribs = fade * (0.5 + 0.5 * Math.cos(p.striae * angle));
          }
          const grain = grainField(u, v);
          // Six wall plates converge on a diamond aperture with opaque backing.
          // Angular striae vanish before the center, keeping its limit unique.
          color =
            0.08 +
            face *
              (0.55 +
                0.2 * crown -
                0.75 * aperture -
                0.12 * seam +
                0.03 * ribs +
                0.03 * grain);
          height =
            0.05 +
            face *
              (0.25 +
                0.5 * crown -
                0.75 * aperture -
                0.065 * seam +
                0.018 * ribs +
                0.008 * grain);
          roughness +=
            0.03 * grain +
            face * (0.08 * seam + 0.12 * aperture - 0.08 * crown);
          occlusion = 0.3 + face * (0.68 - 0.6 * aperture - 0.12 * seam);
        };
      }
      case 'orbicularjasper': {
        const p = proceduralMaterialPresets.orbicularjasper;
        const orbs = new Float64Array(p.cells * p.cells * 4);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 4;
            const radius =
              p.radiusMin + p.radiusVariation * hash(col, row, seed ^ 0x4f6b);
            orbs[i] =
              p.centerMin + p.centerVariation * hash(col, row, seed ^ 0x2d47);
            orbs[i + 1] =
              p.centerMin + p.centerVariation * hash(col, row, seed ^ 0x3e59);
            orbs[i + 2] = 1 / (radius * radius);
            orbs[i + 3] = hash(col, row, seed ^ 0x5a7d) < 0.5 ? 3 : 4;
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x6b8f);
        const matrixField = cachedNoise(8, 8, seed ^ 0x7ca1);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 4;
          const x = fract(uCell) - orbs[i],
            y = fract(vCell) - orbs[i + 1];
          const q = (x * x + y * y) * orbs[i + 2];
          const orb = smooth(clamp((1 - q) / p.shoulder));
          const bands =
            orb > 0 ? 0.5 - 0.5 * Math.cos(TAU * orbs[i + 3] * q) : 0;
          const grain = grainField(u, v);
          color =
            (1 - orb) * (0.2 + 0.1 * matrixField(u, v)) +
            orb * (0.12 + 0.75 * bands + 0.04 * grain);
          // These are polished mineral inclusions, not raised rings or cavities.
          height = 0.4 + 0.004 * grain;
          roughness += 0.06 * orb * bands + 0.015 * grain;
          occlusion = 1;
        };
      }
      case 'hexnuts': {
        const p = proceduralMaterialPresets.hexnuts;
        const planes = new Float64Array(p.cells * p.cells * 12);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const phase = TAU * hash(col, row, seed ^ 0x4c71);
            for (let side = 0; side < 6; side++) {
              const i = (row * p.cells + col) * 12 + side * 2;
              const angle = phase + (TAU * side) / 6;
              planes[i] = Math.cos(angle);
              planes[i + 1] = Math.sin(angle);
            }
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x5d83);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 12;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          let outer = 1;
          for (let side = 0; side < 6; side++) {
            const j = i + side * 2;
            outer *= smooth(
              clamp(
                (p.inradius - x * planes[j] - y * planes[j + 1]) / p.outerBevel,
              ),
            );
          }
          const radius = Math.hypot(x, y);
          const face =
            outer * smooth(clamp((radius - p.boreRadius) / p.boreBevel));
          const grain = grainField(u, v);
          const machining = 0.5 + 0.5 * Math.cos(TAU * p.machining * radius);
          // Circular bores and outside spaces expose the same opaque steel backing.
          // Fine concentric machining marks are not helical thread geometry.
          color =
            (1 - face) * (0.15 + 0.05 * grain) +
            face * (0.68 + 0.06 * grain + 0.04 * machining);
          height =
            0.05 +
            0.003 * grain +
            face * (0.7 + 0.004 * grain + 0.001 * machining);
          roughness +=
            0.015 * grain + 0.18 * (1 - face) + 0.025 * machining * face;
          occlusion = 0.45 + 0.53 * face;
        };
      }
      case 'cardboardedge': {
        const p = proceduralMaterialPresets.cardboardedge;
        const phases = new Float64Array(p.rows);
        for (let row = 0; row < p.rows; row++)
          phases[row] = TAU * hash(0, row, seed ^ 0x3a57);
        const grainField = cachedNoise(128, 128, seed ^ 0x4b69);
        const fiberField = cachedNoise(192, 24, seed ^ 0x5c7b);
        const slopeScale = (p.amplitude * TAU * p.columns) / p.rows;
        return () => {
          const vCell = v * p.rows,
            y = fract(vCell) - 0.5;
          const angle = TAU * p.columns * u + phases[Math.floor(vCell)];
          const wave = p.amplitude * Math.cos(angle);
          const slope = slopeScale * Math.sin(angle);
          const distance = (y - wave) / Math.sqrt(1 + slope * slope);
          const medium = smooth(clamp(1 - (distance / p.mediumHalfWidth) ** 2));
          const liner = smooth(
            clamp(1 - ((Math.abs(y) - p.linerCenter) / p.linerHalfWidth) ** 2),
          );
          const paper = 1 - (1 - medium) * (1 - liner);
          const grain = grainField(u, v),
            fiber = fiberField(u, v);
          // This is the cut edge: flute and liner faces are flush, cavities lower.
          // Slope correction avoids thinning the medium on steep wave flanks.
          color = 0.06 + paper * (0.6 + 0.08 * grain + 0.04 * fiber);
          height = 0.04 + paper * (0.68 + 0.015 * grain + 0.008 * fiber);
          roughness += 0.08 * (1 - paper) + 0.03 * grain;
          occlusion = 0.25 + 0.73 * paper;
        };
      }
      case 'lotusroot': {
        const p = proceduralMaterialPresets.lotusroot;
        const grainField = cachedNoise(96, 96, seed ^ 0x5f83);
        const canals = new Float64Array(p.cells * p.cells * p.canals * 4);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const phase = TAU * hash(col, row, seed ^ 0x2c59);
            for (let canal = 0; canal < p.canals; canal++) {
              const id = col * p.canals + canal;
              const i = ((row * p.cells + col) * p.canals + canal) * 4;
              const angle = phase + (TAU * canal) / p.canals;
              const along =
                p.canalLong +
                p.canalLongVariation * hash(id, row, seed ^ 0x3d61);
              const across =
                p.canalShort +
                p.canalShortVariation * hash(id, row, seed ^ 0x4e73);
              canals[i] = Math.cos(angle);
              canals[i + 1] = Math.sin(angle);
              canals[i + 2] = 1 / (along * along);
              canals[i + 3] = 1 / (across * across);
            }
          }
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i =
            (Math.floor(vCell) * p.cells + Math.floor(uCell)) * p.canals * 4;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const radius = Math.hypot(x, y);
          const face = smooth(clamp((p.radius - radius) / p.edge));
          const rind = smooth(clamp((radius - p.rindStart) / p.rindWidth));
          let holes = smooth(
            clamp(
              (1 - (x * x + y * y) / (p.centralRadius * p.centralRadius)) /
                p.wallShoulder,
            ),
          );
          for (let canal = 0; canal < p.canals; canal++) {
            const j = i + canal * 4;
            const along = x * canals[j] + y * canals[j + 1] - p.canalDistance;
            const across = -x * canals[j + 1] + y * canals[j];
            const q =
              along * along * canals[j + 2] + across * across * canals[j + 3];
            holes += smooth(clamp((1 - q) / p.wallShoulder));
          }
          const grain = grainField(u, v);
          // Air canals have low opaque backing, not seeds or raised collars.
          color =
            0.05 + face * (0.8 + 0.04 * grain - 0.4 * rind - 0.72 * holes);
          height = 0.05 + face * (0.6 + 0.008 * grain - 0.52 * holes);
          roughness += 0.04 * grain + face * (0.12 * rind + 0.2 * holes);
          occlusion = 0.25 + face * (0.73 - 0.65 * holes);
        };
      }
      case 'satinweave': {
        const p = proceduralMaterialPresets.satinweave;
        const phase = TAU * hash(0, 0, seed ^ 0x5d31);
        const grainField = cachedNoise(128, 128, seed ^ 0x6e43);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const col = Math.floor(uCell),
            row = Math.floor(vCell);
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const warp = smooth(clamp(1 - (x * x) / (p.halfWidth * p.halfWidth)));
          const weft = smooth(clamp(1 - (y * y) / (p.halfWidth * p.halfWidth)));
          const interlace = (col + p.step * row) % p.harness === 0;
          const exposure = interlace
            ? smooth(
                clamp((p.exposureHalf - Math.abs(x)) / p.exposureShoulder),
              ) *
              smooth(clamp((p.exposureHalf - Math.abs(y)) / p.exposureShoulder))
            : 0;
          const warpFiber = 0.5 + 0.5 * Math.cos(TAU * 4 * x + phase);
          const weftFiber = 0.5 + 0.5 * Math.cos(TAU * 4 * y + phase);
          const fiber = warpFiber * (1 - exposure) + weftFiber * exposure;
          const dominant = warp * (1 - exposure) + weft * exposure;
          const coverage = 1 - (1 - warp) * (1 - weft);
          const warpTop = 0.45 * warp + 0.15 * weft * (1 - warp);
          const weftTop = 0.45 * weft + 0.15 * warp * (1 - weft);
          const grain = grainField(u, v);
          // Four warp floats precede each isolated weft interlacing.
          // Compact exposure keeps the ownership change inside its crossing.
          color = 0.4 + 0.2 * dominant + 0.08 * fiber * coverage + 0.08 * grain;
          height =
            0.08 +
            warpTop * (1 - exposure) +
            weftTop * exposure +
            0.006 * fiber * coverage +
            0.005 * grain;
          roughness += 0.08 * (1 - dominant) + 0.015 * grain;
          occlusion = 0.75 + 0.22 * coverage;
        };
      }
      case 'flemishbond': {
        const p = proceduralMaterialPresets.flemishbond;
        const units = p.modules * 3;
        const tones = new Float64Array(p.rows * p.modules * 2);
        for (let row = 0; row < p.rows; row++)
          for (let brick = 0; brick < p.modules * 2; brick++)
            tones[row * p.modules * 2 + brick] = hash(
              brick,
              row,
              seed ^ 0x4d61,
            );
        const grainField = cachedNoise(96, 96, seed ^ 0x5e73);
        const aggregateField = cachedNoise(48, 48, seed ^ 0x6f85);
        return () => {
          const row = Math.floor(v * p.rows);
          const x = fract(u - (1.5 * (row % 2)) / units) * units;
          const module = Math.floor(x / 3) % p.modules,
            local = x % 3;
          const header = local < 1,
            length = header ? 1 : 2;
          const along = header ? local : local - 1;
          // Each course alternates a header and a double-width stretcher.
          // Row-pitch distances keep horizontal and vertical joints equal.
          const dx = (Math.min(along, length - along) * p.rows) / units;
          const dy = 0.5 - Math.abs(fract(v * p.rows) - 0.5);
          const face =
            smooth(clamp((dx - p.grout) / p.bevel)) *
            smooth(clamp((dy - p.grout) / p.bevel));
          const tone =
            tones[row * p.modules * 2 + module * 2 + (header ? 0 : 1)];
          const grain = grainField(u, v),
            aggregate = aggregateField(u, v);
          mortar = 1 - face;
          color =
            face *
              ((header ? p.headerTone : p.stretcherTone) +
                0.1 * tone +
                0.07 * grain +
                0.04 * aggregate) +
            0.5 * mortar;
          height = 0.08 + face * (0.7 + 0.025 * grain + 0.015 * aggregate);
          roughness += 0.04 * grain * face + 0.12 * mortar;
          occlusion = 0.6 + 0.36 * face;
        };
      }
      case 'splitlockwashers': {
        const p = proceduralMaterialPresets.splitlockwashers;
        const phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            phases[row * p.cells + col] = TAU * hash(col, row, seed ^ 0x2b49);
        const grainField = cachedNoise(96, 96, seed ^ 0x3c5b);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const index = Math.floor(vCell) * p.cells + Math.floor(uCell);
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const r = Math.sqrt(x * x + y * y);
          const angle = TAU * fract((Math.atan2(y, x) - phases[index]) / TAU);
          const face =
            smooth(clamp((r - p.inner) / p.bevel)) *
            smooth(clamp((p.outer - r) / p.bevel)) *
            smooth(clamp((angle - p.gap) / p.angularBevel)) *
            smooth(clamp((TAU - p.gap - angle) / p.angularBevel));
          const rise = clamp((angle - p.gap) / (TAU - 2 * p.gap));
          const grain = grainField(u, v);
          // The cut lies in a zero-support sector, so the helical rise never
          // bridges the gap or creates a discontinuity across the angle wrap.
          color =
            (1 - face) * (0.2 + 0.06 * grain) +
            face * (0.65 + 0.08 * grain + 0.08 * rise);
          height =
            0.06 + 0.003 * grain + face * (0.3 + 0.3 * rise + 0.004 * grain);
          roughness += 0.02 * grain + 0.25 * (1 - face);
          occlusion = 0.65 + 0.33 * face;
        };
      }
      case 'artichoke': {
        const p = proceduralMaterialPresets.artichoke;
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x6c27);
        const grainField = cachedNoise(96, 96, seed ^ 0x7d39);
        return () => {
          const x = u * p.cells,
            y = v * p.cells,
            row = Math.floor(y);
          const grain = grainField(u, v);
          color = 0.08 + 0.03 * grain;
          height = 0.1;
          occlusion = 0.5;
          // Back-to-front rows expose broad roots beneath the pointed bracts.
          for (let oy = 1; oy >= -1; oy--) {
            const cy = row + oy,
              wy = (cy + p.cells) % p.cells;
            const stagger = 0.5 * (wy % 2),
              column = Math.floor(x - stagger);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                wx = (cx + p.cells) % p.cells;
              const dx = x - cx - stagger - 0.5,
                dy = y - cy - 0.5;
              const t = clamp((dy - p.root) / (p.tip - p.root));
              const width = p.halfWidth * (1 - t * t);
              const cover =
                smooth(clamp((width * width - dx * dx) / p.edge)) *
                smooth(clamp((dy - p.root) / 0.12)) *
                smooth(clamp((p.tip - dy) / 0.1));
              if (cover === 0) continue;
              const tip = smooth(clamp((dy + 0.15) / 0.9));
              const rib = smooth(clamp(1 - (dx * dx) / (p.midrib * p.midrib)));
              const branchFade = smooth(clamp((Math.abs(dx) - 0.04) / 0.05));
              let veins = rib;
              for (let branch = 0; branch < 3; branch++) {
                const line =
                  -0.3 + 0.25 * branch + 0.55 * Math.sqrt(dx * dx + 0.0001);
                const distance = (dy - line) / p.veinWidth;
                veins += branchFade * smooth(clamp(1 - distance * distance));
              }
              const pigment =
                0.32 +
                0.17 * tones[wy * p.cells + wx] +
                0.18 * (1 - tip) +
                0.05 * veins +
                0.025 * grain;
              const relief =
                0.28 + 0.28 * tip + 0.05 * rib + 0.025 * veins + 0.012 * grain;
              color += cover * (pigment - color);
              height += cover * (relief - height);
              occlusion += cover * (0.96 - 0.22 * (1 - cover) - occlusion);
            }
          }
          roughness += 0.05 * grain + 0.08 * (1 - occlusion);
        };
      }
      case 'frenchknots': {
        const p = proceduralMaterialPresets.frenchknots;
        const knots = new Float64Array(p.cells * p.cells * 5);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const index = (row * p.cells + col) * 5;
            const angle = TAU * hash(col, row, seed ^ 0x3a65);
            knots[index] = 0.45 + 0.1 * hash(col, row, seed ^ 0x1c41);
            knots[index + 1] = 0.45 + 0.1 * hash(col, row, seed ^ 0x2d53);
            knots[index + 2] = Math.cos(angle);
            knots[index + 3] = Math.sin(angle);
            knots[index + 4] = TAU * hash(col, row, seed ^ 0x4b77);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x5c89);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const index = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 5;
          const dx = fract(uCell) - knots[index],
            dy = fract(vCell) - knots[index + 1];
          const x = dx * knots[index + 2] + dy * knots[index + 3];
          const y = (dy * knots[index + 2] - dx * knots[index + 3]) * p.aspect;
          const q = x * x + y * y,
            r = Math.sqrt(q);
          const cap = smooth(clamp(1 - q / (p.radius * p.radius)));
          const dimple = smooth(clamp(1 - q / (p.dimple * p.dimple)));
          let wraps = 0;
          if (
            r > p.inner - p.width - p.warp &&
            r < p.outer + p.width + p.warp
          ) {
            const warp =
              p.warp * Math.cos(3 * Math.atan2(y, x) + knots[index + 4]);
            const inner = (r - p.inner - warp) / p.width;
            const outer = (r - p.outer - warp) / p.width;
            wraps =
              smooth(clamp(1 - inner * inner)) +
              smooth(clamp(1 - outer * outer));
          }
          const halo = smooth(clamp(1 - q / (0.34 * 0.34)));
          const weave =
            (0.5 + 0.5 * Math.cos(TAU * 64 * u)) *
            (0.5 + 0.5 * Math.cos(TAU * 64 * v));
          const grain = grainField(u, v);
          // Compact yarn wraps rise over a woven backing; the knot center
          // dimples inward without opening a hole through the cloth.
          color =
            (1 - cap) * (0.9 + 0.04 * weave) +
            cap * (0.25 + 0.08 * grain + 0.08 * wraps);
          height =
            0.08 +
            0.02 * weave +
            0.012 * grain +
            cap * (0.4 - 0.12 * dimple) +
            0.2 * wraps;
          roughness += 0.03 * grain - 0.1 * cap;
          occlusion = 0.98 - 0.2 * halo + 0.17 * cap + 0.02 * wraps;
        };
      }
      case 'flintwall': {
        const p = proceduralMaterialPresets.flintwall;
        const stride = 2 + p.edges * 3;
        const stones = new Float64Array(p.cells * p.cells * stride);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const index = (row * p.cells + col) * stride;
            const phase = TAU * hash(col, row, seed ^ 0x3651);
            stones[index] = phase;
            stones[index + 1] = hash(col, row, seed ^ 0x4763);
            for (let edge = 0; edge < p.edges; edge++) {
              const offset = index + 2 + edge * 3;
              const angle = phase + (TAU * edge) / p.edges;
              stones[offset] = Math.cos(angle);
              stones[offset + 1] = Math.sin(angle);
              stones[offset + 2] =
                p.radiusMin +
                p.radiusRange * hash(col * p.edges + edge, row, seed ^ 0x5875);
            }
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x6987);
        return () => {
          const row = Math.floor(v * p.cells);
          const uCell = fract(u - (0.5 * (row % 2)) / p.cells) * p.cells;
          const col = Math.floor(uCell) % p.cells,
            index = (row * p.cells + col) * stride;
          const x = fract(uCell) - 0.5,
            y = fract(v * p.cells) - 0.5;
          let face = 1,
            core = 1;
          for (let edge = 0; edge < p.edges; edge++) {
            const offset = index + 2 + edge * 3;
            const inward =
              stones[offset + 2] - x * stones[offset] - y * stones[offset + 1];
            face *= smooth(clamp(inward / p.bevel));
            core *= smooth(clamp((inward - p.cortex) / p.bevel));
          }
          const cortex = face - core;
          const ripple =
            0.5 +
            0.5 *
              Math.cos(
                TAU * 10 * ((x + 0.13) * (x + 0.13) + (y - 0.07) * (y - 0.07)) +
                  stones[index],
              );
          const grain = grainField(u, v);
          // Pale chalk cortex surrounds the darker, smoother knapped flint.
          // Broad mortar gaps remain below both exposed stone surfaces.
          mortar = 1 - face;
          color =
            0.62 * mortar +
            0.86 * cortex +
            core * (0.15 + 0.1 * stones[index + 1] + 0.05 * ripple);
          height = 0.15 + face * (0.5 + 0.015 * grain) + 0.025 * core * ripple;
          roughness += 0.12 * mortar + core * (-0.36 + 0.06 * ripple);
          occlusion = 0.65 + 0.32 * face;
        };
      }
      case 'rakedgravel': {
        const p = proceduralMaterialPresets.rakedgravel;
        const stones = new Float64Array(p.cells * p.cells * 4);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const index = (row * p.cells + col) * 4;
            stones[index] = 0.4 + 0.2 * hash(col, row, seed ^ 0x3157);
            stones[index + 1] = 0.4 + 0.2 * hash(col, row, seed ^ 0x4269);
            stones[index + 2] =
              p.radiusMin + p.radiusRange * hash(col, row, seed ^ 0x537b);
            stones[index + 3] = 0.6 + 0.4 * hash(col, row, seed ^ 0x648d);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x759f);
        return () => {
          const distance = Math.abs(fract(u * p.furrows) - 0.5);
          const ridge = smooth(clamp((distance - p.bottom) / p.shoulder));
          const x = u * p.cells,
            y = v * p.cells;
          const index = (Math.floor(y) * p.cells + Math.floor(x)) * 4;
          const dx = (fract(x) - stones[index]) / stones[index + 2],
            dy = (fract(y) - stones[index + 1]) / stones[index + 2];
          const pebble = smooth(clamp(1 - dx * dx - dy * dy));
          const grain = grainField(u, v);
          // Rake teeth leave flat-bottomed channels and rounded shoulders;
          // the same compact stone caps remain on both bed and raised banks.
          color =
            0.44 +
            0.14 * ridge +
            0.22 * pebble * stones[index + 3] +
            0.05 * grain;
          height = 0.16 + 0.5 * ridge + 0.12 * pebble + 0.015 * grain;
          roughness += 0.1 * (1 - pebble) - 0.03 * ridge;
          occlusion = 0.6 + 0.3 * ridge + 0.08 * pebble;
        };
      }
      case 'sunburstveneer': {
        const p = proceduralMaterialPresets.sunburstveneer;
        const phases = new Float64Array(p.cells * p.cells);
        const wedges = new Float64Array(p.cells * p.cells * p.wedges * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const cell = row * p.cells + col;
            phases[cell] = TAU * hash(col, row, seed ^ 0x4153);
            for (let wedge = 0; wedge < p.wedges; wedge++) {
              const index = (cell * p.wedges + wedge) * 3;
              const angle = phases[cell] + (TAU * (wedge + 0.5)) / p.wedges;
              wedges[index] = Math.cos(angle);
              wedges[index + 1] = Math.sin(angle);
              wedges[index + 2] = hash(
                col * p.wedges + wedge,
                row,
                seed ^ 0x5265,
              );
            }
          }
        const sinHalf = Math.sin(Math.PI / p.wedges),
          cosHalf = Math.cos(Math.PI / p.wedges);
        const grainField = cachedNoise(8, 96, seed ^ 0x6377);
        const fineField = cachedNoise(96, 96, seed ^ 0x7489);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const cell = Math.floor(vCell) * p.cells + Math.floor(uCell);
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const r = Math.hypot(x, y);
          // A tiny negative turn can round its fractional part to exactly 1.
          // Wrap the integer owner too, so the closing seam stays in this cell.
          const wedge =
            Math.floor(
              fract((Math.atan2(y, x) - phases[cell]) / TAU) * p.wedges,
            ) % p.wedges;
          const index = (cell * p.wedges + wedge) * 3;
          const along = x * wedges[index] + y * wedges[index + 1],
            across = y * wedges[index] - x * wedges[index + 1];
          const side = sinHalf * along - cosHalf * Math.abs(across);
          const face =
            smooth(clamp((side - p.gap) / p.bevel)) *
            smooth(clamp((r - p.innerRadius) / p.edge)) *
            smooth(clamp((p.radius - r) / p.edge));
          const plug = smooth(clamp((p.plugRadius - r) / p.edge));
          const outer = 1 - smooth(clamp((r - p.radius) / p.edge));
          const joint = outer - face - plug;
          const tone = wedges[index + 2];
          const grain = grainField(along + 0.3 * tone, across + 0.7 * tone);
          const fine = fineField(u, v);
          color =
            (1 - outer) * (0.18 + 0.1 * grainField(u, v)) +
            joint * 0.08 +
            face * (0.4 + 0.25 * tone + 0.2 * grain) +
            plug * (0.55 + 0.15 * grainField(x + 0.5, y + 0.5));
          // The wedges, centre plug and surrounding board are flush veneer.
          // Only the narrow inlay joints recess; grain follows each wedge.
          height = 0.65 + 0.01 * fine - 0.18 * joint + 0.004 * face * grain;
          roughness += 0.2 * joint + 0.03 * face * grain;
          occlusion = 0.99 - 0.35 * joint;
        };
      }
      case 'shirring': {
        const p = proceduralMaterialPresets.shirring;
        const offset = hash(0, 0, seed ^ 0x2941);
        const grainField = cachedNoise(96, 96, seed ^ 0x3a53);
        return () => {
          const y = v * p.rows,
            nearRow = fract(y + 0.5) - 0.5;
          const swell = 0.5 - 0.5 * Math.cos(TAU * y);
          const wave =
            0.5 +
            0.5 *
              Math.cos(
                TAU * (u * p.folds + p.wander * Math.sin(TAU * y) + offset),
              );
          const fold = wave * wave;
          const seam = 1 - smooth(clamp(Math.abs(nearRow) / p.seamWidth));
          const across = nearRow / p.threadWidth;
          const stitch =
            smooth(clamp(1 - across * across)) *
            smooth(clamp((0.4 - Math.abs(fract(u * p.stitches) - 0.5)) / 0.1));
          const weave =
            0.5 + 0.25 * Math.cos(TAU * 96 * u) + 0.25 * Math.cos(TAU * 96 * v);
          const grain = grainField(u, v);
          // Elastic stitch rows compress the gathers; between rows the same
          // folds open into taller, slightly wandering cloth ridges.
          color =
            0.4 +
            0.13 * fold +
            0.08 * weave +
            0.02 * grain -
            0.12 * seam +
            0.2 * stitch;
          height =
            0.15 -
            0.04 * seam +
            (0.03 + 0.52 * swell) * fold +
            0.025 * weave +
            0.01 * grain +
            0.06 * stitch;
          roughness += 0.05 * (1 - fold) - 0.08 * stitch;
          occlusion = 0.65 + 0.3 * fold * swell - 0.12 * seam + 0.1 * stitch;
        };
      }
      case 'crystallineglaze': {
        const p = proceduralMaterialPresets.crystallineglaze;
        const crystals = new Float64Array(p.cells * p.cells * 5);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const index = (row * p.cells + col) * 5;
            crystals[index] = 0.44 + 0.12 * hash(col, row, seed ^ 0x2a51);
            crystals[index + 1] = 0.44 + 0.12 * hash(col, row, seed ^ 0x3b63);
            crystals[index + 2] =
              p.radiusMin + p.radiusRange * hash(col, row, seed ^ 0x4c75);
            crystals[index + 3] = TAU * hash(col, row, seed ^ 0x5d87);
            crystals[index + 4] =
              p.armsMin +
              Math.floor(p.armsRange * hash(col, row, seed ^ 0x6e99));
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x7fab);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const index = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 5;
          const x = fract(uCell) - crystals[index],
            y = fract(vCell) - crystals[index + 1];
          const q =
            (x * x + y * y) / (crystals[index + 2] * crystals[index + 2]);
          const angle = Math.atan2(y, x),
            phase = crystals[index + 3];
          const edge =
            1 +
            0.08 * Math.cos(5 * angle + phase) +
            0.05 * Math.cos(9 * angle - phase);
          const face = smooth(clamp((1 - q / (edge * edge)) / 0.25));
          const fade = smooth(clamp(q / 0.04));
          const ray = 0.5 + 0.5 * Math.cos(crystals[index + 4] * angle + phase);
          const needles = ray * ray * ray * ray;
          const growth = 0.5 + 0.5 * Math.cos(TAU * 3 * q);
          const crystal =
            (0.6 + 0.4 * fade * (2 * needles - 1)) * (0.85 + 0.15 * growth);
          const grain = grainField(u, v);
          color = 0.12 + 0.8 * face * crystal + 0.02 * grain;
          // Crystals are embedded in the glaze, not raised ice or carved rays.
          // Only independent coating grain contributes to the height field.
          height = 0.4 + 0.004 * grain;
          roughness += 0.08 * face * fade * needles;
          occlusion = 1;
        };
      }
      case 'seaurchintest': {
        const p = proceduralMaterialPresets.seaurchintest;
        const rotations = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const angle = TAU * hash(col, row, seed ^ 0x6c51);
            const index = (row * p.cells + col) * 2;
            rotations[index] = Math.cos(angle);
            rotations[index + 1] = Math.sin(angle);
          }
        const axes = new Float64Array(20);
        for (let ray = 0; ray < 10; ray++) {
          axes[ray * 2] = Math.cos((TAU * ray) / 10);
          axes[ray * 2 + 1] = Math.sin((TAU * ray) / 10);
        }
        const grainField = cachedNoise(96, 96, seed ^ 0x7d63);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const index = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const x = dx * rotations[index] + dy * rotations[index + 1],
            y = dy * rotations[index] - dx * rotations[index + 1];
          const r2 = x * x + y * y;
          const dome = clamp(1 - r2 / (p.radius * p.radius));
          const face = smooth(clamp(dome / 0.2));
          // Nearest-ray and pore choices change only in zero-support gaps.
          // The compact features therefore preserve the fivefold seams.
          const angle = (Math.atan2(y, x) * 5) / TAU;
          const ray = ((Math.round(angle) % 5) + 5) % 5;
          const a = x * axes[ray * 4] + y * axes[ray * 4 + 1],
            b = y * axes[ray * 4] - x * axes[ray * 4 + 1];
          const row = Math.max(
            0,
            Math.min(
              p.poreRows - 1,
              Math.round((a - p.poreStart) / p.poreSpacing),
            ),
          );
          const along = (a - p.poreStart - row * p.poreSpacing) / p.poreRadius,
            across = (Math.abs(b) - p.poreOffset) / p.poreRadius;
          const pores =
            smooth(clamp(1 - along * along - across * across)) +
            smooth(clamp(1 - r2 / (p.apicalRadius * p.apicalRadius)));
          const gap = (((Math.round(angle - 0.5) % 5) + 5) % 5) * 4 + 2;
          const tx = x * axes[gap] + y * axes[gap + 1],
            ty = (y * axes[gap] - x * axes[gap + 1]) / p.tubercleRadius;
          const tr = (tx - (tx < 0.25 ? 0.2 : 0.3)) / p.tubercleRadius;
          const tubercle = smooth(clamp(1 - tr * tr - ty * ty));
          const grain = grainField(u, v);
          color =
            0.07 * (1 - face) +
            face * (0.53 + 0.18 * dome + 0.05 * grain - 0.3 * pores);
          height =
            0.04 +
            face *
              (0.42 +
                0.3 * dome +
                0.07 * tubercle +
                0.01 * grain -
                0.16 * pores);
          roughness +=
            0.14 * (1 - face) + face * (0.1 * pores - 0.06 * tubercle);
          occlusion = 0.3 + face * (0.68 - 0.45 * pores);
        };
      }
      case 'guilloche': {
        const p = proceduralMaterialPresets.guilloche;
        const phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            phases[row * p.cells + col] = TAU * hash(col, row, seed ^ 0x4a31);
        const grainField = cachedNoise(96, 96, seed ^ 0x5b43);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const phase = phases[Math.floor(vCell) * p.cells + Math.floor(uCell)];
          const r = Math.hypot(x, y);
          const contour =
            p.radius +
            p.amplitude * Math.cos(p.lobes * Math.atan2(y, x) + phase);
          let groove = 0;
          for (let ring = -1; ring <= 1; ring++) {
            const distance = (r - contour - ring * p.spacing) / p.width;
            groove += smooth(clamp(1 - distance * distance));
          }
          // All cuts stay away from the polar centre and cell boundary.
          // The uncut plate therefore has no angular singularity or seam.
          const grain = grainField(u, v);
          color = 0.75 + 0.05 * grain - 0.25 * groove;
          height = 0.65 + 0.005 * grain - 0.15 * groove;
          roughness += 0.015 * grain + 0.12 * groove;
          occlusion = 0.99 - 0.18 * groove;
        };
      }
      case 'cairotiles': {
        const p = proceduralMaterialPresets.cairotiles;
        const planes = new Float64Array(4 * 5 * 3);
        for (let parity = 0; parity < 2; parity++)
          for (let axis = 0; axis < 2; axis++) {
            const sign = parity ? -1 : 1;
            for (let edge = 0; edge < 5; edge++) {
              const next = (edge + 1) % 5;
              const vx = p.vertices[edge * 2],
                vy = sign * p.vertices[edge * 2 + 1],
                wx = p.vertices[next * 2],
                wy = sign * p.vertices[next * 2 + 1];
              const ax = axis ? -vy : vx,
                ay = axis ? vx : vy,
                bx = axis ? -wy : wx,
                by = axis ? wx : wy;
              const inverse = sign / Math.hypot(bx - ax, by - ay);
              const nx = (ay - by) * inverse,
                ny = (bx - ax) * inverse;
              const offset = ((parity * 2 + axis) * 5 + edge) * 3;
              planes[offset] = nx;
              planes[offset + 1] = ny;
              planes[offset + 2] = -nx * ax - ny * ay;
            }
          }
        const tones = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            for (let axis = 0; axis < 2; axis++)
              tones[(row * p.cells + col) * 2 + axis] = hash(
                col,
                row,
                seed ^ (axis ? 0x6e39 : 0x5d27),
              );
        const grainField = cachedNoise(96, 96, seed ^ 0x7f41);
        return () => {
          const x = u * p.cells,
            y = v * p.cells,
            ix = Math.floor(x),
            iy = Math.floor(y);
          let faces = 0,
            pigment = 0;
          // Each square-grid node owns its left and lower pentagon. Alternating
          // reflections join three 120-degree corners or four right angles.
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % p.cells) + p.cells) % p.cells,
                wy = ((cy % p.cells) + p.cells) % p.cells;
              const parity = (cx + cy) & 1,
                dx = x - cx,
                dy = y - cy;
              for (let axis = 0; axis < 2; axis++) {
                let face = 1;
                for (let edge = 0; edge < 5 && face > 0; edge++) {
                  const offset = ((parity * 2 + axis) * 5 + edge) * 3;
                  face *= smooth(
                    clamp(
                      (planes[offset] * dx +
                        planes[offset + 1] * dy +
                        planes[offset + 2] -
                        p.grout) /
                        p.shoulder,
                    ),
                  );
                }
                faces += face;
                pigment += face * tones[(wy * p.cells + wx) * 2 + axis];
              }
            }
          faces = clamp(faces);
          const grain = grainField(u, v);
          mortar = 1 - faces;
          color = faces * (0.25 + 0.05 * grain) + 0.35 * pigment + 0.5 * mortar;
          height = 0.08 + faces * (0.7 + 0.01 * grain);
          roughness += 0.04 * grain * faces + 0.18 * mortar;
          occlusion = 0.55 + 0.43 * faces;
        };
      }
      case 'vermiculite': {
        const p = proceduralMaterialPresets.vermiculite;
        const flakes = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const offset = (row * p.cells + col) * 3;
            const angle = TAU * hash(col, row, seed ^ 0x4d27);
            flakes[offset] = Math.cos(angle);
            flakes[offset + 1] = Math.sin(angle);
            flakes[offset + 2] = hash(col, row, seed ^ 0x5e39);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x6f41);
        return () => {
          const vCell = v * p.cells,
            row = Math.floor(vCell);
          const uCell = u * p.cells - 0.5 * (row % 2);
          const col = ((Math.floor(uCell) % p.cells) + p.cells) % p.cells;
          const offset = (row * p.cells + col) * 3;
          const tx = fract(uCell) - 0.5,
            ty = fract(vCell) - 0.5;
          const x = tx * flakes[offset] + ty * flakes[offset + 1],
            y = ty * flakes[offset] - tx * flakes[offset + 1];
          const wave =
            0.5 +
            0.5 *
              Math.cos(
                TAU *
                  ((p.layers * x) / (2 * p.halfLength) + flakes[offset + 2]),
              );
          const ridge = wave * wave;
          // Expanded lamellae widen at the crests, not just painted stripes.
          const width = p.halfWidth + p.ribWidth * ridge;
          const q = (x / p.halfLength) ** 2 + (y / width) ** 2;
          const face = smooth(clamp((1 - q) / 0.18));
          const dome = clamp(1 - q),
            grain = grainField(u, v);
          color =
            0.12 * (1 - face) + face * (0.43 + 0.3 * ridge + 0.08 * grain);
          height =
            0.06 + face * (0.35 + 0.27 * ridge + 0.12 * dome + 0.015 * grain);
          roughness += 0.18 * (1 - face) + face * (0.04 * grain - 0.12 * ridge);
          occlusion = 0.35 + face * (0.38 + 0.22 * ridge);
        };
      }
      case 'suminagashi': {
        const p = proceduralMaterialPresets.suminagashi;
        const warpX = cachedNoise(4, 4, seed ^ 0x2d47),
          warpY = cachedNoise(4, 4, seed ^ 0x3e59),
          contourField = cachedNoise(3, 3, seed ^ 0x4f61),
          rippleField = cachedNoise(7, 7, seed ^ 0x5a73),
          grainField = cachedNoise(96, 96, seed ^ 0x6b85),
          fiberField = cachedNoise(192, 8, seed ^ 0x7c97);
        return () => {
          const x = u + p.warp * (warpX(u, v) - 0.5),
            y = v + p.warp * (warpY(u, v) - 0.5);
          const level = 0.9 * contourField(x, y) + 0.1 * rippleField(x, y);
          const ink = smooth(
            clamp((Math.cos(TAU * p.rings * level) - 0.45) / 0.5),
          );
          const grain = grainField(u, v),
            fiber = fiberField(u, v);
          color = 0.93 - 0.82 * ink + 0.02 * grain;
          // Floating ink stains the sheet; only paper tooth contributes relief.
          height = 0.12 + 0.02 * grain + 0.008 * fiber;
          roughness += 0.025 * grain - 0.1 * ink;
          occlusion = 0.99;
        };
      }
      case 'cocoamat': {
        const p = proceduralMaterialPresets.cocoamat;
        const fibers = new Float64Array(p.cells * p.cells * p.fibers * 5);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            for (let strand = 0; strand < p.fibers; strand++) {
              const offset = ((row * p.cells + col) * p.fibers + strand) * 5;
              const salt = seed ^ Math.imul(strand + 1, 0x9e37);
              const angle = TAU * hash(col, row, salt ^ 0x5a29);
              fibers[offset] = 0.2 + 0.6 * hash(col, row, salt ^ 0x3145);
              fibers[offset + 1] = 0.2 + 0.6 * hash(col, row, salt ^ 0x4267);
              fibers[offset + 2] = Math.cos(angle);
              fibers[offset + 3] = Math.sin(angle);
              fibers[offset + 4] = 0.08 + 0.08 * hash(col, row, salt ^ 0x6b31);
            }
        const grainField = cachedNoise(96, 96, seed ^ 0x7c43);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let empty = 1;
          // Compact curved strands vanish before the neighbour window changes.
          // Their smooth union keeps crossings continuous without hard maxima.
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const col = ((cx % p.cells) + p.cells) % p.cells,
                row = ((cy % p.cells) + p.cells) % p.cells;
              for (let strand = 0; strand < p.fibers; strand++) {
                const offset = ((row * p.cells + col) * p.fibers + strand) * 5;
                const dx = x - cx - fibers[offset],
                  dy = y - cy - fibers[offset + 1];
                const along = dx * fibers[offset + 2] + dy * fibers[offset + 3],
                  across = dy * fibers[offset + 2] - dx * fibers[offset + 3];
                if (
                  Math.abs(along) >= p.halfLength ||
                  Math.abs(across) >= fibers[offset + 4] + p.radius
                )
                  continue;
                const curve =
                  fibers[offset + 4] *
                  Math.sin((Math.PI * along) / p.halfLength);
                const distance = (across - curve) / p.radius;
                const shape =
                  smooth(clamp(1 - distance * distance)) *
                  smooth(clamp((p.halfLength - Math.abs(along)) / 0.1));
                empty *= 1 - shape;
              }
            }
          const pile = 1 - empty,
            grain = grainField(u, v);
          color = 0.05 + pile * (0.52 + 0.12 * grain);
          height = 0.06 + pile * (0.69 + 0.035 * grain);
          roughness += 0.1 * empty + 0.02 * grain * pile;
          occlusion = 0.35 + 0.63 * pile;
        };
      }
      case 'saffiano': {
        const p = proceduralMaterialPresets.saffiano;
        const grainField = cachedNoise(128, 128, seed ^ 0x6f29);
        return () => {
          const a = smooth(
            clamp((Math.cos(TAU * p.lines * (u + v)) - 0.8) / 0.2),
          );
          const b = smooth(
            clamp((Math.cos(TAU * p.lines * (u - v)) - 0.8) / 0.2),
          );
          // Pressed crosshatch intersections share one groove floor instead
          // of adding two cuts into an artificially deep pit.
          const groove = 1 - (1 - a) * (1 - b);
          const grain = grainField(u, v);
          color = 0.48 + 0.08 * grain - 0.13 * groove;
          height = 0.65 + 0.025 * grain - p.grooveDepth * groove;
          roughness += 0.025 * grain + 0.08 * groove;
          occlusion = 0.97 - 0.13 * groove;
        };
      }
      case 'bargello': {
        const p = proceduralMaterialPresets.bargello;
        const grainField = cachedNoise(96, 96, seed ^ 0x5e39);
        return () => {
          const uCell = u * p.columns,
            col = Math.floor(uCell);
          const zig = col % 16,
            step = Math.min(zig, 15 - zig);
          const vCell = v * p.rows - 0.25 * step;
          const row = ((Math.floor(vCell) % p.rows) + p.rows) % p.rows;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          // Each neighboring stitch shifts by one canvas unit while spanning
          // four units; compact yarn supports hide the stepped ownership seam.
          const across = smooth(clamp(1 - (x / p.halfWidth) ** 2));
          const along = smooth(clamp((0.47 - Math.abs(y)) / 0.08));
          const face = across * along;
          const fiber = 0.5 + 0.5 * Math.cos(TAU * 3 * x);
          const grain = grainField(u, v);
          color =
            face * (p.tones[row % 4]! + 0.025 * grain) + 0.025 * (1 - face);
          height = 0.04 + face * (0.55 + 0.015 * fiber + 0.01 * grain);
          roughness +=
            0.15 * (1 - face) + face * (0.02 * grain + 0.015 * fiber);
          occlusion = 0.5 + 0.48 * face;
        };
      }
      case 'diamondrustication': {
        const p = proceduralMaterialPresets.diamondrustication;
        const grainField = cachedNoise(96, 96, seed ^ 0x6d31);
        const mineralField = cachedNoise(24, 24, seed ^ 0x9a57);
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x3c29);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const x = fract(uCell) - 0.5,
            y = fract(vCell) - 0.5;
          const ax = Math.sqrt(x * x + 0.0001),
            ay = Math.sqrt(y * y + 0.0001);
          const edge = 0.5 * (ax + ay + Math.sqrt((ax - ay) ** 2 + 0.0004));
          const t = clamp(1 - edge / p.bossHalfWidth);
          // Retain planar flanks while flattening only the boss foot, leaving
          // a separate stone collar before the outer bevel and mortar.
          const boss =
            t < p.footSoftness
              ? (t * t) / (2 * p.footSoftness)
              : t - p.footSoftness / 2;
          const face =
            smooth(clamp((0.5 - Math.abs(x) - p.grout) / p.bevel)) *
            smooth(clamp((0.5 - Math.abs(y) - p.grout) / p.bevel));
          const grain = grainField(u, v),
            mineral = mineralField(u, v);
          const tone = tones[Math.floor(vCell) * p.cells + Math.floor(uCell)]!;
          color =
            face * (0.35 + 0.3 * tone + 0.1 * mineral + 0.04 * grain) +
            0.5 * (1 - face);
          height = 0.06 + face * (0.2 + 0.7 * boss + 0.008 * grain);
          mortar = 1 - face;
          roughness += 0.035 * grain * face + 0.12 * mortar;
          occlusion = 0.55 + 0.43 * face;
        };
      }
      case 'starfruit': {
        const p = proceduralMaterialPresets.starfruit;
        const grainField = cachedNoise(96, 96, seed ^ 0x8d31);
        const slices = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 2;
            const angle = TAU * hash(col, row, seed ^ 0x4a67);
            slices[i] = Math.cos(angle);
            slices[i + 1] = Math.sin(angle);
          }
        const seedAxes = new Float64Array(10);
        for (let j = 0; j < 5; j++) {
          seedAxes[j * 2] = Math.cos((TAU * j) / 5);
          seedAxes[j * 2 + 1] = Math.sin((TAU * j) / 5);
        }
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * slices[i]! + dy * slices[i + 1]!,
            y = dy * slices[i]! - dx * slices[i + 1]!;
          const r = Math.hypot(x, y),
            theta = Math.atan2(y, x);
          const radius =
            p.innerRadius +
            (p.outerRadius - p.innerRadius) *
              (0.5 + 0.5 * Math.cos(5 * theta)) ** 3;
          const distance = radius - r;
          const face = smooth(clamp(distance / 0.025));
          // Angular silhouette/rind fields are constant in the whole core,
          // so the polar coordinate has no singular effect at the center.
          const rind = 1 - smooth(clamp((distance - 0.02) / 0.025));
          let seeds = 0;
          for (let j = 0; j < 5; j++) {
            const c = seedAxes[j * 2]!,
              s = seedAxes[j * 2 + 1]!;
            const along = (x * c + y * s - p.seedRadius) / 0.027;
            const across = (y * c - x * s) / 0.012;
            seeds += smooth(clamp(1 - along * along - across * across));
          }
          const grain = grainField(u, v);
          color =
            0.025 + face * (0.85 + 0.02 * grain - 0.27 * rind - 0.75 * seeds);
          height =
            0.04 + face * (0.5 + 0.01 * grain + 0.03 * rind - 0.13 * seeds);
          roughness += 0.3 * (1 - face) + face * (0.02 * grain + 0.08 * seeds);
          occlusion = 0.35 + face * (0.63 - 0.3 * seeds);
        };
      }
      case 'rebar': {
        const p = proceduralMaterialPresets.rebar;
        const grainField = cachedNoise(96, 96, seed ^ 0x7c31);
        return () => {
          const col = Math.floor(u * p.columns);
          const x = fract(u * p.columns) - 0.5;
          const q = clamp(1 - (x / p.radius) ** 2);
          // Taper the circular cross-section before its vertical tangent;
          // both the shaft and its rolled ribs meet the backing smoothly.
          const face = smooth(clamp(q / 0.18)),
            crown = Math.sqrt(q);
          const hand = col % 2 ? -1 : 1;
          const rib =
            (0.5 + 0.5 * Math.cos(TAU * (p.ribs * v + hand * p.slant * x))) **
            12;
          const grain = grainField(u, v);
          color =
            0.03 + face * (0.3 + 0.27 * crown + 0.14 * rib + 0.025 * grain);
          height =
            0.04 + face * (0.3 + 0.35 * crown + 0.1 * rib + 0.008 * grain);
          roughness += 0.2 * (1 - face) + face * (0.03 * grain - 0.06 * rib);
          occlusion = 0.4 + face * (0.57 - 0.02 * rib);
        };
      }
      case 'englishbond': {
        const p = proceduralMaterialPresets.englishbond;
        const grainField = cachedNoise(96, 96, seed ^ 0x5b17);
        const aggregateField = cachedNoise(48, 48, seed ^ 0x3d29);
        const tones = new Float64Array(p.rows * p.headerColumns);
        for (let row = 0; row < p.rows; row++) {
          const columns = row % 2 ? p.stretcherColumns : p.headerColumns;
          for (let col = 0; col < columns; col++)
            tones[row * p.headerColumns + col] = hash(col, row, seed ^ 0x8c43);
        }
        return () => {
          const row = Math.floor(v * p.rows);
          const headers = row % 2 === 0;
          const columns = headers ? p.headerColumns : p.stretcherColumns;
          const x = u * columns + (headers ? 0.5 : 0);
          const col = Math.floor(x) % columns;
          // Express both joint distances in row-pitch units: changing brick
          // width must not double the physical mortar or bevel width.
          const dx = ((0.5 - Math.abs(fract(x) - 0.5)) * p.rows) / columns;
          const dy = 0.5 - Math.abs(fract(v * p.rows) - 0.5);
          const face =
            smooth(clamp((dx - p.grout) / p.bevel)) *
            smooth(clamp((dy - p.grout) / p.bevel));
          const grain = grainField(u, v),
            aggregate = aggregateField(u, v);
          const tone = tones[row * p.headerColumns + col]!;
          color = face * (0.3 + 0.3 * tone + 0.05 * grain) + 0.5 * (1 - face);
          height = 0.08 + face * (0.7 + 0.025 * grain + 0.015 * aggregate);
          mortar = 1 - face;
          roughness += 0.04 * grain * face + 0.1 * mortar;
          occlusion = 0.6 + 0.36 * face;
        };
      }
      case 'hollyleaf': {
        const p = proceduralMaterialPresets.hollyleaf;
        const grainField = cachedNoise(96, 96, seed ^ 0x3d71);
        const leaves = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 2;
            const angle = TAU * hash(col, row, seed ^ 0x6b29);
            leaves[i] = Math.cos(angle);
            leaves[i + 1] = Math.sin(angle);
          }
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 2;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * leaves[i]! + dy * leaves[i + 1]!,
            y = dy * leaves[i]! - dx * leaves[i + 1]!;
          const a = Math.abs(x);
          let blade = smooth(
            clamp((1 - (x * x) / 0.0225 - (y * y) / 0.1024) / 0.2),
          );
          let branches = 0;
          for (let pair = -1; pair <= 1; pair++) {
            const center = pair * 0.18;
            const width = 0.06 * clamp((0.3 - a) / 0.22);
            const offset = y - center - 0.035 * clamp((a - 0.08) / 0.22);
            const spine =
              smooth(clamp((width * width - offset * offset) / 0.00015)) *
              smooth(clamp((a - 0.08) / 0.03));
            blade = 1 - (1 - blade) * (1 - spine);
            const veinOffset = y - center - 0.12 * a;
            // Branch veins vanish with zero slope before the absolute
            // cross-axis coordinate reaches the central rib.
            branches +=
              smooth(clamp((0.000025 - veinOffset * veinOffset) / 0.000025)) *
              smooth(clamp(a / 0.025)) *
              smooth(clamp((0.28 - a) / 0.06));
          }
          const tipWidth = 0.07 * clamp((0.4 - y) / 0.15);
          const tip =
            smooth(clamp((y - 0.25) / 0.04)) *
            smooth(clamp((tipWidth * tipWidth - x * x) / 0.00008));
          blade = 1 - (1 - blade) * (1 - tip);
          const stem =
            smooth(clamp((y + 0.42) / 0.035)) *
            (1 - smooth(clamp((y + 0.3) / 0.035))) *
            smooth(clamp((0.000196 - x * x) / 0.000196));
          const midrib =
            smooth(clamp((0.0001 - x * x) / 0.0001)) *
            smooth(clamp((0.34 - Math.abs(y)) / 0.04));
          const grain = grainField(u, v),
            veins = midrib + 0.55 * branches;
          const coverage = 1 - (1 - blade) * (1 - stem);
          color =
            0.04 +
            blade * (0.5 + 0.12 * grain + 0.08 * veins) +
            (1 - blade) * 0.25 * stem;
          height =
            0.04 +
            blade * (0.58 + 0.015 * grain + 0.045 * veins) +
            (1 - blade) * 0.25 * stem;
          roughness += 0.3 * (1 - blade) + 0.02 * grain * blade;
          occlusion = 0.34 + 0.64 * coverage;
        };
      }
      case 'slottedwood': {
        const p = proceduralMaterialPresets.slottedwood;
        const grainField = cachedNoise(96, 4, seed ^ 0x4c29);
        const fiberField = cachedNoise(192, 8, seed ^ 0x7e13);
        const outerSquared = p.outerRadius * p.outerRadius;
        const wallRange = outerSquared - p.coreRadius * p.coreRadius;
        const aspect = p.columns / p.rows;
        return () => {
          const row = Math.floor(v * p.rows);
          const x = fract(u * p.columns - (row % 2) * 0.5) - 0.5;
          const y = (fract(v * p.rows) - 0.5) * aspect;
          // Measure both axes in column-cell units so the slot ends are
          // circular on the square UV tile despite the rectangular pitch.
          const end = Math.max(0, Math.abs(x) - p.spine);
          const hole = smooth(
            clamp((outerSquared - end * end - y * y) / wallRange),
          );
          const face = 1 - hole;
          const grain = grainField(u, v),
            fiber = fiberField(u, v);
          color = (0.58 + 0.2 * grain + 0.04 * fiber) * face + 0.025 * hole;
          height = (0.74 + 0.018 * grain + 0.006 * fiber) * face + 0.08 * hole;
          roughness += 0.04 * grain * face + 0.28 * hole;
          occlusion = 0.98 - 0.72 * hole;
        };
      }
      case 'ikat': {
        const p = proceduralMaterialPresets.ikat;
        const alignmentField = cachedNoise(p.threads, 1, seed ^ 0x6c17);
        const grainField = cachedNoise(96, 96, seed ^ 0x3e49);
        return () => {
          const alignment = p.fringe * (alignmentField(u, 0) - 0.5);
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells + alignment) - 0.5;
          // A softly rounded diamond avoids cusps; per-warp alignment
          // shifts its dye boundary along the yarn, not the cloth relief.
          const diamond = Math.sqrt(x * x + 0.0001) + Math.sqrt(y * y + 0.0001);
          const resist = 1 - smooth(clamp((diamond - 0.34) / 0.07));
          const tx = u * p.threads,
            ty = v * p.threads;
          const warp = 0.5 + 0.5 * Math.cos(TAU * tx),
            weft = 0.5 + 0.5 * Math.cos(TAU * ty);
          const over =
            0.5 + 0.5 * Math.cos(Math.PI * tx) * Math.cos(Math.PI * ty);
          const weave =
            warp * (0.35 + 0.25 * over) +
            weft * (0.35 + 0.25 * (1 - over)) -
            0.3 * warp * weft;
          const grain = grainField(u, v);
          color = 0.055 + 0.82 * resist + 0.025 * grain;
          height = 0.12 + 0.22 * weave + 0.004 * grain;
          roughness += 0.02 * grain + 0.02 * (1 - weave);
          occlusion = 0.82 + 0.16 * weave;
        };
      }
      case 'calcadawaves': {
        const p = proceduralMaterialPresets.calcadawaves;
        const grainField = cachedNoise(96, 96, seed ^ 0x7d31);
        const aggregateField = cachedNoise(48, 48, seed ^ 0x4b27);
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const wave =
              row + 0.5 + 2.8 * Math.sin((TAU * (col + 0.5)) / p.cells);
            tones[row * p.cells + col] =
              Math.cos((TAU * wave) / 8) >= 0 ? 0.83 : 0.05;
          }
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const face =
            smooth(
              clamp((0.5 - Math.abs(fract(x) - 0.5) - p.grout) / p.bevel),
            ) *
            smooth(clamp((0.5 - Math.abs(fract(y) - 0.5) - p.grout) / p.bevel));
          const tone = tones[Math.floor(y) * p.cells + Math.floor(x)];
          const grain = grainField(u, v),
            aggregate = aggregateField(u, v);
          // Whole stones carry the wave pattern; their color never cuts
          // across a tessera or changes its relief, roughness or occlusion.
          color = 0.3 + face * (tone - 0.3 + 0.04 * grain);
          height = 0.1 + face * (0.65 + 0.015 * grain + 0.008 * aggregate);
          roughness += 0.03 * grain + 0.05 * (1 - face);
          occlusion = 0.43 + 0.55 * face;
          mortar = 1 - face;
        };
      }
      case 'woodworm': {
        const p = proceduralMaterialPresets.woodworm;
        const grainField = cachedNoise(96, 4, seed ^ 0x7c19);
        const fiberField = cachedNoise(192, 8, seed ^ 0x3a27);
        const galleries = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 3;
            const angle = TAU * hash(col, row, seed ^ 0x5e31);
            galleries[i] = Math.cos(angle);
            galleries[i + 1] = Math.sin(angle);
            galleries[i + 2] = 0.06 + 0.05 * hash(col, row, seed ^ 0x2b47);
          }
        const channelScale = 1 / (p.channelWidth * p.channelWidth);
        const holeScale = 1 / (p.holeRadius * p.holeRadius);
        return () => {
          const uCell = u * p.cells,
            vCell = v * p.cells;
          const i = (Math.floor(vCell) * p.cells + Math.floor(uCell)) * 3;
          const dx = fract(uCell) - 0.5,
            dy = fract(vCell) - 0.5;
          const x = dx * galleries[i] + dy * galleries[i + 1],
            y = dy * galleries[i] - dx * galleries[i + 1];
          const offset = y - galleries[i + 2] * Math.sin((TAU * x) / 0.6);
          const channel =
            (1 -
              smooth(clamp((offset * offset * channelScale - 0.25) / 0.75))) *
            (1 - smooth(clamp((Math.abs(x) - 0.26) / 0.08)));
          let holes = 0;
          for (let side = -1; side <= 1; side += 2) {
            const a = x - side * 0.3;
            holes +=
              1 - smooth(clamp(((a * a + y * y) * holeScale - 0.2) / 0.8));
          }
          // Smooth union avoids seams where deeper exit bores meet the
          // exposed winding gallery; supports stay inside their owner cell.
          const groove = 1 - (1 - channel) * (1 - holes);
          const grain = grainField(u, v),
            fiber = fiberField(u, v);
          color =
            0.58 + 0.2 * grain + 0.05 * fiber - 0.43 * groove - 0.12 * holes;
          height =
            0.74 + 0.018 * grain + 0.01 * fiber - 0.42 * groove - 0.2 * holes;
          roughness += 0.06 * grain + 0.1 * groove;
          occlusion = 0.98 - 0.35 * groove - 0.3 * holes;
        };
      }
      case 'cofferedconcrete': {
        const p = proceduralMaterialPresets.cofferedconcrete;
        const grainField = cachedNoise(96, 96, seed ^ 0x4c37);
        const aggregateField = cachedNoise(24, 24, seed ^ 0x6e19);
        return () => {
          const x = Math.abs(fract(u * p.cells) - 0.5),
            y = Math.abs(fract(v * p.cells) - 0.5);
          // Flat-bottomed chambers stop before the shared ribs. A product
          // rounds the wall junctions without creating diagonal max cusps.
          const chamber =
            smooth(clamp((p.opening - x) / p.wallWidth)) *
            smooth(clamp((p.opening - y) / p.wallWidth));
          const grain = grainField(u, v),
            aggregate = aggregateField(u, v);
          const pores = smooth(clamp((grain - 0.68) / 0.2));
          color =
            0.64 -
            0.22 * chamber +
            0.06 * grain +
            0.025 * aggregate -
            0.07 * pores;
          height =
            0.8 -
            0.65 * chamber +
            0.009 * grain +
            0.006 * aggregate -
            0.015 * pores;
          roughness += 0.05 * grain + 0.03 * chamber;
          occlusion = 0.98 - 0.45 * chamber - 0.04 * pores;
        };
      }
      case 'crowncaps': {
        const p = proceduralMaterialPresets.crowncaps;
        const grainField = cachedNoise(96, 96, seed ^ 0x5c27);
        const phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            phases[row * p.cells + col] = TAU * hash(col, row, seed ^ 0x7a13);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const dx = fract(x) - 0.5,
            dy = fract(y) - 0.5;
          const r = Math.hypot(dx, dy);
          const phase = phases[Math.floor(y) * p.cells + Math.floor(x)];
          const wave =
            0.5 + 0.5 * Math.cos(p.teeth * Math.atan2(dy, dx) + phase);
          const face = smooth(clamp((0.42 + 0.04 * wave - r) / 0.025));
          const top = 1 - smooth(clamp((r - 0.32) / 0.09));
          const rim =
            smooth(clamp((r - 0.29) / 0.025)) *
            (1 - smooth(clamp((r - 0.34) / 0.025)));
          const flank = smooth(clamp((r - 0.3) / 0.06)),
            grain = grainField(u, v);
          // Angular crimping is confined to the skirt: the crown stays flat
          // and its pole has no angular height or color singularity.
          color =
            0.12 +
            face * (0.45 + 0.12 * rim + 0.04 * grain + 0.07 * wave * flank);
          height =
            0.02 +
            face *
              (0.28 +
                0.45 * top +
                0.12 * rim +
                0.07 * wave * flank +
                0.003 * grain);
          roughness +=
            0.15 * (1 - face) +
            face * (0.03 * grain + 0.08 * flank * (1 - wave));
          occlusion = 0.35 + face * (0.63 - 0.15 * flank * (1 - wave));
        };
      }
      case 'lotusseedpod': {
        const p = proceduralMaterialPresets.lotusseedpod;
        const grainField = cachedNoise(96, 96, seed ^ 0x6d27);
        const pods = new Float64Array(p.cells * p.cells * 22);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 22;
            const phase = TAU * hash(col, row, seed ^ 0x2f51);
            pods[i] = 0.44 + 0.02 * hash(col, row, seed ^ 0x5a19);
            for (let chamber = 0; chamber < 7; chamber++) {
              const j = i + 1 + chamber * 3,
                id = col * 7 + chamber;
              const angle =
                phase +
                ((chamber - 1) * TAU) / 6 +
                0.1 * (hash(id, row, seed ^ 0x7b31) - 0.5);
              const distance =
                chamber === 0 ? 0 : 0.235 + 0.03 * hash(id, row, seed ^ 0x3c49);
              const radius = 0.07 + 0.015 * hash(id, row, seed ^ 0x8e17);
              pods[j] = distance * Math.cos(angle);
              pods[j + 1] = distance * Math.sin(angle);
              pods[j + 2] = 1 / (radius * radius);
            }
          }
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const i = (Math.floor(y) * p.cells + Math.floor(x)) * 22;
          const dx = fract(x) - 0.5,
            dy = fract(y) - 0.5;
          const face = smooth(clamp((pods[i] - Math.hypot(dx, dy)) / 0.04));
          let cavities = 0,
            rims = 0,
            seeds = 0;
          for (let chamber = 0; chamber < 7; chamber++) {
            const j = i + 1 + chamber * 3;
            const q =
              ((dx - pods[j]) ** 2 + (dy - pods[j + 1]) ** 2) * pods[j + 2];
            cavities += 1 - smooth(clamp((q - 0.45) / 0.55));
            rims +=
              smooth(clamp((q - 0.75) / 0.25)) *
              (1 - smooth(clamp((q - 1.2) / 0.35)));
            seeds += smooth(clamp((0.2 - q) / 0.2));
          }
          const grain = grainField(u, v);
          // Seeds rise from the chamber floor but remain below the dry pod face.
          // Dark gaps and chambers have opaque backing, not cutout geometry.
          color =
            0.04 +
            face *
              (0.58 +
                0.04 * grain -
                0.4 * cavities +
                0.08 * rims +
                0.05 * seeds);
          height =
            0.03 +
            face *
              (0.57 +
                0.012 * grain -
                0.4 * cavities +
                0.08 * rims +
                0.17 * seeds);
          roughness += face * (0.04 * grain + 0.05 * cavities - 0.22 * seeds);
          occlusion = 0.35 + face * (0.63 - 0.48 * cavities + 0.08 * seeds);
        };
      }
      case 'asanoha': {
        const p = proceduralMaterialPresets.asanoha;
        const rowStep = Math.sqrt(3) / 2;
        const grainField = cachedNoise(96, 96, seed ^ 0x5b17);
        const gridLine = (t: number): number => {
          const f = fract(t);
          return smooth(clamp((0.035 - rowStep * Math.min(f, 1 - f)) / 0.015));
        };
        return () => {
          const t = v * p.rows,
            s = u * p.columns - 0.5 * t;
          const a = fract(s),
            b = fract(t);
          let x = a + 0.5 * b,
            y = rowStep * b;
          if (a + b > 1) {
            x = 1.5 - x;
            y = rowStep - y;
          }
          let unprinted =
            (1 - gridLine(s)) * (1 - gridLine(t)) * (1 - gridLine(s + t));
          const cx = x - 0.5,
            cy = y - rowStep / 3;
          for (let vertex = 0; vertex < 3; vertex++) {
            const dx = vertex === 0 ? -0.5 : vertex === 1 ? 0.5 : 0;
            const dy = vertex === 2 ? (2 * rowStep) / 3 : -rowStep / 3;
            const along = clamp(3 * (cx * dx + cy * dy));
            const distance2 = (cx - along * dx) ** 2 + (cy - along * dy) ** 2;
            const line = smooth(
              clamp((0.018 ** 2 - distance2) / (0.018 ** 2 - 0.008 ** 2)),
            );
            unprinted *= 1 - line;
          }
          // The saturated lattice stroke covers triangle ownership changes.
          // All hemp-leaf lines are dye; only the underlying weave has relief.
          const warp = 0.5 + 0.5 * Math.cos(TAU * p.threads * u),
            weft = 0.5 + 0.5 * Math.cos(TAU * p.threads * v),
            over = 0.5 + 0.5 * Math.cos(Math.PI * p.threads * (u + v));
          const thread = warp * over + weft * (1 - over),
            grain = grainField(u, v);
          color =
            0.13 * unprinted +
            0.9 * (1 - unprinted) +
            0.025 * thread +
            0.02 * grain;
          height = 0.24 + 0.16 * thread + 0.02 * grain;
          roughness += 0.025 * grain + 0.025 * (1 - thread);
          occlusion = 0.88 + 0.1 * thread;
        };
      }
      case 'palmendgrain': {
        const p = proceduralMaterialPresets.palmendgrain;
        const grainField = cachedNoise(96, 96, seed ^ 0x4a13);
        const matrixField = cachedNoise(16, 16, seed ^ 0x7c29);
        const bundles = new Float64Array(p.cells * p.cells * 6);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 6;
            const angle = TAU * hash(col, row, seed ^ 0x5d37);
            bundles[i] = 0.35 + 0.3 * hash(col, row, seed ^ 0x2b19);
            bundles[i + 1] = 0.35 + 0.3 * hash(col, row, seed ^ 0x6e41);
            bundles[i + 2] = Math.cos(angle);
            bundles[i + 3] = Math.sin(angle);
            bundles[i + 4] = 1 / (0.23 + 0.05 * hash(col, row, seed ^ 0x3c57));
            bundles[i + 5] = 1 / (0.15 + 0.035 * hash(col, row, seed ^ 0x8a23));
          }
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const i = (Math.floor(y) * p.cells + Math.floor(x)) * 6;
          const dx = fract(x) - bundles[i],
            dy = fract(y) - bundles[i + 1];
          const rx = dx * bundles[i + 2] + dy * bundles[i + 3],
            ry = -dx * bundles[i + 3] + dy * bundles[i + 2];
          const q = (rx * bundles[i + 4]) ** 2 + (ry * bundles[i + 5]) ** 2;
          const fiber = 1 - smooth(clamp((q - 0.4) / 0.6));
          const left = clamp(1 - ((rx + 0.09) / 0.055) ** 2 - (ry / 0.05) ** 2),
            right = clamp(1 - ((rx - 0.09) / 0.055) ** 2 - (ry / 0.05) ** 2);
          const pores = left * left + right * right;
          const grain = grainField(u, v),
            matrix = matrixField(u, v);
          // Palm bundles are flush dark fibers in pale ground tissue, not
          // annual rings or raised knots. Only their cut vessels recess.
          color =
            0.8 + 0.04 * grain + 0.05 * matrix - 0.58 * fiber - 0.12 * pores;
          height = 0.5 + 0.012 * grain - 0.28 * pores;
          roughness += 0.04 * grain - 0.06 * fiber + 0.12 * pores;
          occlusion = 0.99 - 0.25 * pores;
        };
      }
      case 'dogbonepavers': {
        const p = proceduralMaterialPresets.dogbonepavers;
        const grainField = cachedNoise(96, 96, seed ^ 0x3a91);
        const aggregateField = cachedNoise(24, 24, seed ^ 0x6c27);
        const tones = new Float64Array(p.columns * p.rows);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++)
            tones[row * p.columns + col] = hash(col, row, seed ^ 0x5d13);
        return () => {
          const x = u * p.columns,
            y = v * p.rows * 2;
          let faces = 0,
            pigment = 0;
          for (let ox = -1; ox <= 1; ox++) {
            const col = Math.floor(x) + ox,
              shift = col & 1;
            const row = Math.floor((y - shift) / 2);
            const tx = x - col - 0.5,
              ty = y - (row * 2 + shift + 1);
            // Adjacent columns shift half a brick: complementary shoulders
            // make each wide end fit its neighbor's narrow waist exactly.
            const halfWidth =
              0.35 + 0.3 * smooth(clamp((Math.abs(ty) - 0.35) / 0.3));
            const face =
              smooth(clamp((halfWidth - Math.abs(tx) - p.grout) / p.shoulder)) *
              smooth(clamp((1 - Math.abs(ty) - p.grout) / p.shoulder));
            const wx = (col + p.columns) % p.columns,
              wy = (row + p.rows) % p.rows;
            faces += face;
            pigment += face * tones[wy * p.columns + wx];
          }
          const face = clamp(faces),
            grain = grainField(u, v),
            aggregate = aggregateField(u, v);
          color =
            0.2 +
            0.4 * face +
            0.2 * pigment +
            face * (0.04 * grain - 0.06 * aggregate);
          height = face * (0.62 + 0.025 * grain + 0.01 * aggregate);
          roughness += 0.1 * (1 - face) + 0.025 * grain * face;
          occlusion = 0.5 + 0.5 * face;
          mortar = 1 - face;
        };
      }
      case 'saltpan': {
        const p = proceduralMaterialPresets.saltpan;
        const grainField = cachedNoise(96, 96, seed ^ 0x2a71);
        const crystalField = cachedNoise(48, 48, seed ^ 0x6d35);
        const cells = new Float64Array(p.cells * p.cells * 27);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const offset = (row * p.cells + col) * 27;
            const px = 0.36 + 0.28 * hash(col, row, seed ^ 0x3b19),
              py = 0.36 + 0.28 * hash(col, row, seed ^ 0x7f23);
            cells[offset] = px;
            cells[offset + 1] = py;
            cells[offset + 2] = hash(col, row, seed ^ 0x5c17);
            let plane = offset + 3;
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                if (ox === 0 && oy === 0) continue;
                const wx = (col + ox + p.cells) % p.cells,
                  wy = (row + oy + p.cells) % p.cells;
                const dx =
                    ox +
                    ((wy & 1) - (row & 1)) * 0.5 +
                    0.36 +
                    0.28 * hash(wx, wy, seed ^ 0x3b19) -
                    px,
                  dy = oy + 0.36 + 0.28 * hash(wx, wy, seed ^ 0x7f23) - py;
                const distance = Math.sqrt(dx * dx + dy * dy);
                cells[plane++] = dx / distance;
                cells[plane++] = dy / distance;
                cells[plane++] = distance / 2;
              }
          }
        return () => {
          const x = u * p.cells,
            y = v * p.cells,
            iy = Math.floor(y);
          let faces = 0,
            pigment = 0;
          // As with crackle glaze, shared bisectors and products of smooth
          // half-planes keep corners C1. Here their complement rises as salt
          // ridges instead of sinking into mud cracks or glazed hairlines.
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cy = iy + oy;
              const stagger = (cy & 1) * 0.5;
              const cx = Math.floor(x - stagger) + ox;
              const offset =
                (((cy + p.cells) % p.cells) * p.cells +
                  ((cx + p.cells) % p.cells)) *
                27;
              const dx = x - cx - stagger - cells[offset],
                dy = y - cy - cells[offset + 1];
              let face = 1;
              for (let edge = 0; edge < 8 && face > 0; edge++) {
                const plane = offset + 3 + edge * 3;
                face *= smooth(
                  clamp(
                    (cells[plane + 2] -
                      dx * cells[plane] -
                      dy * cells[plane + 1]) /
                      p.ridgeWidth,
                  ),
                );
              }
              faces += face;
              pigment += face * cells[offset + 2];
            }
          const ridge = 1 - clamp(faces),
            grain = grainField(u, v);
          const crystal = smooth(clamp((crystalField(u, v) - 0.65) / 0.25));
          color =
            0.32 + 0.48 * ridge + 0.1 * pigment + 0.03 * grain + 0.04 * crystal;
          height = 0.08 + 0.58 * ridge + 0.025 * grain + 0.015 * crystal;
          roughness += 0.06 * ridge + 0.025 * grain;
          occlusion = 0.9 + 0.08 * ridge;
        };
      }
      case 'scallopedslate': {
        const p = proceduralMaterialPresets.scallopedslate;
        const grainField = cachedNoise(96, 96, seed ^ 0x4e31);
        const strataField = cachedNoise(8, 64, seed ^ 0x6b17);
        const tones = new Float64Array(p.columns * p.rows);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++)
            tones[row * p.columns + col] = hash(col, row, seed ^ 0x3f29);
        return () => {
          const y = v * p.rows,
            baseRow = Math.floor(y);
          const grain = grainField(u, v),
            strata = strataField(u, v);
          color = 0.08 + 0.025 * grain;
          height = 0.08 + 0.01 * grain;
          roughness = p.roughness + 0.08;
          occlusion = 0.6;
          // Paint lower courses first: upper rounded tails cover the next
          // staggered row. Three rows preserve the same overlap at row wrap.
          for (let row = baseRow + 1; row >= baseRow - 1; row--) {
            const x = u * p.columns + (row & 1) * 0.5;
            const tx = fract(x) - 0.5,
              ty = y - row;
            const top = smooth(clamp((ty + 0.75) / 0.1));
            const side = smooth(clamp((p.halfWidth - Math.abs(tx)) / 0.035));
            const tail = Math.max(ty - p.tailStart, 0) / p.tailDepth;
            const q = (tx / p.halfWidth) ** 2 + tail * tail;
            const cap = smooth(clamp((1 - q) / 0.12));
            const face = top * side * cap;
            const shadow =
              top * side * (1 - cap) * smooth(clamp((1.16 - q) / 0.16));
            const wy = (row + p.rows) % p.rows;
            const wx = Math.floor(x) % p.columns;
            const tone = tones[wy * p.columns + wx];
            const pigment = 0.25 + 0.3 * tone + 0.08 * strata + 0.025 * grain;
            const lift =
              0.3 + 0.35 * smooth(clamp((ty + 0.75) / 2.15)) + 0.015 * grain;
            color = color * (1 - 0.2 * shadow) * (1 - face) + pigment * face;
            height = height * (1 - face) + lift * face;
            roughness =
              roughness * (1 - face) +
              (p.roughness - 0.07 + 0.07 * grain + 0.04 * strata) * face;
            occlusion =
              occlusion * (1 - 0.3 * shadow) * (1 - face) + 0.98 * face;
          }
        };
      }
      case 'shibori': {
        const p = proceduralMaterialPresets.shibori;
        const grainField = cachedNoise(96, 96, seed ^ 0x3b71);
        const phases = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            phases[row * p.cells + col] = TAU * hash(col, row, seed ^ 0x7d23);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const dx = fract(x) - 0.5,
            dy = fract(y) - 0.5;
          const q = dx * dx + dy * dy;
          const grain = grainField(u, v);
          let resist = 0;
          // The compact annuli vanish before the center and cell boundary,
          // so atan2 never introduces a singular dye mark or a tile seam.
          if (q > 0.0025 && q < 0.2304) {
            const angle = Math.atan2(dy, dx);
            const phase = phases[Math.floor(y) * p.cells + Math.floor(x)];
            const radius =
              Math.sqrt(q) +
              0.01 * Math.sin(5 * angle + phase) +
              0.012 * Math.sin(9 * angle - phase) +
              0.008 * (grain - 0.5);
            const inner = smooth(
              clamp((0.055 - Math.abs(radius - 0.17)) / 0.035),
            );
            const outer = smooth(
              clamp((0.055 - Math.abs(radius - 0.34)) / 0.035),
            );
            const pleat = smooth(
              clamp(
                (Math.cos(
                  p.pleats * angle + 0.8 * Math.sin(3 * angle + phase),
                ) -
                  0.2) /
                  0.8,
              ),
            );
            resist = (inner + outer) * (0.55 + 0.45 * pleat);
          }
          const tx = u * p.threads,
            ty = v * p.threads;
          const warp = 0.5 + 0.5 * Math.cos(TAU * tx),
            weft = 0.5 + 0.5 * Math.cos(TAU * ty);
          const over =
            0.5 + 0.5 * Math.cos(Math.PI * tx) * Math.cos(Math.PI * ty);
          const weave =
            warp * (0.35 + 0.25 * over) +
            weft * (0.35 + 0.25 * (1 - over)) -
            0.3 * warp * weft;
          // Resist dye changes pigment, not the underlying cotton relief.
          color = 0.055 + 0.82 * resist + 0.025 * grain;
          height = 0.12 + 0.22 * weave + 0.004 * grain;
          roughness += 0.02 * grain + 0.02 * (1 - weave);
          occlusion = 0.82 + 0.16 * weave;
        };
      }
      case 'herringbonebrick': {
        const p = proceduralMaterialPresets.herringbonebrick;
        const grainField = cachedNoise(96, 96, seed ^ 0x53a7);
        const tones = new Float64Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            tones[row * p.cells + col] = hash(col, row, seed ^ 0x2d19);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          const diagonal = (ix + iy) % 4;
          const horizontal = diagonal < 2;
          // Every integer cell belongs to exactly one 2:1 domino. Adjacent
          // diagonal bands turn the bricks by 90 degrees, not their pigment.
          const col = ix - (diagonal === 1 ? 1 : 0);
          const row = iy - (diagonal === 3 ? 1 : 0);
          const width = horizontal ? 2 : 1,
            depth = horizontal ? 1 : 2;
          const tx = x - col,
            ty = y - row;
          const face =
            smooth(clamp((Math.min(tx, width - tx) - p.grout) / p.shoulder)) *
            smooth(clamp((Math.min(ty, depth - ty) - p.grout) / p.shoulder));
          const wx = (col + p.cells) % p.cells,
            wy = (row + p.cells) % p.cells;
          const grain = grainField(u, v);
          color =
            0.16 +
            face * (0.35 + 0.2 * tones[wy * p.cells + wx] + 0.09 * grain);
          height = (0.58 + 0.04 * grain) * face;
          roughness += 0.16 * (1 - face) + 0.02 * grain * face;
          occlusion = 0.55 + 0.45 * face;
          mortar = 1 - face;
        };
      }
      case 'louveredmetal': {
        const p = proceduralMaterialPresets.louveredmetal;
        const grainField = cachedNoise(96, 96, seed ^ 0x6d39);
        return () => {
          const x = fract(u * p.columns) - 0.5;
          const y = fract(v * p.rows) - 0.5;
          const ends = smooth(
            clamp((p.halfWidth - Math.abs(x)) / p.endShoulder),
          );
          const blade =
            ends *
            smooth(clamp((y + 0.3) / 0.08)) *
            (1 - smooth(clamp((y - 0.2) / 0.06)));
          const tilt = smooth(clamp((y + 0.22) / 0.44));
          const slot =
            ends *
            smooth(clamp((y - 0.22) / 0.04)) *
            (1 - smooth(clamp((y - 0.34) / 0.04)));
          const grain = grainField(u, v);
          // Stamped blades remain attached at both ends. Their raised lower
          // lip overhangs an opaque recessed backing, not an alpha-cut hole.
          color = 0.46 + 0.2 * blade * tilt - 0.36 * slot + 0.025 * grain;
          height = 0.1 + 0.5 * blade * tilt - 0.07 * slot + 0.006 * grain;
          roughness += -0.04 * blade + 0.12 * slot + 0.01 * grain;
          occlusion = 1 - 0.65 * slot;
        };
      }
      case 'tuftedleather': {
        const p = proceduralMaterialPresets.tuftedleather;
        const grainField = cachedNoise(96, 96, seed ^ 0x35c7);
        const wearField = cachedNoise(24, 24, seed ^ 0x73a1);
        const buttonSquared = p.buttonRadius * p.buttonRadius;
        const collarSquared = p.collarRadius * p.collarRadius;
        return () => {
          const da = (u + v) * p.diamonds,
            db = (u - v) * p.diamonds;
          const a = 0.5 - 0.5 * Math.cos(TAU * da);
          const b = 0.5 - 0.5 * Math.cos(TAU * db);
          const padded = smooth(1 - Math.exp(-6 * a * b));
          const dx = fract(da + 0.5) - 0.5,
            dy = fract(db + 0.5) - 0.5;
          const q = dx * dx + dy * dy;
          const collar = smooth(clamp((collarSquared - q) / 0.02));
          const button = smooth(clamp((buttonSquared - q) / 0.0015));
          const grain = grainField(u, v),
            wear = wearField(u, v);
          color =
            0.28 +
            0.3 * padded -
            0.13 * collar +
            0.09 * button +
            0.035 * grain +
            0.015 * wear;
          // The covered button rises from its compressed pocket, but stays
          // below the diamond cushion crown; this is not a metal stud.
          height =
            0.12 +
            0.6 * padded -
            0.08 * collar +
            0.18 * button * (1 - (0.25 * q) / buttonSquared) +
            0.02 * grain;
          roughness += -0.16 * padded + 0.06 * grain - 0.06 * button;
          occlusion = 0.5 + 0.48 * padded - 0.15 * collar + 0.12 * button;
        };
      }
      case 'seigaihatiles': {
        const p = proceduralMaterialPresets.seigaihatiles;
        const grainField = cachedNoise(48, 48, seed ^ 0x39b7);
        const tones = new Float64Array(p.columns * p.rows);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++)
            tones[row * p.columns + col] =
              0.06 + 0.04 * hash(col, row, seed ^ 0x71c3);
        const outer = p.radius * p.radius;
        const inner = (p.radius - 0.02) ** 2;
        return () => {
          const x = u * p.columns,
            y = v * p.rows * 0.5;
          const row = Math.floor(y * 2);
          let pigment = 0.08;
          // Paint back rows before front rows. Compact disc edges keep owner
          // changes smooth while hiding lower arcs behind the staggered row.
          for (let oy = -1; oy <= 2; oy++) {
            const cy = row + oy;
            const wy = ((cy % p.rows) + p.rows) % p.rows;
            const shift = 0.5 + (wy % 2) * 0.5;
            const col = Math.floor(x - shift);
            const dy = y - cy * 0.5;
            for (let ox = 0; ox <= 1; ox++) {
              const cx = col + ox;
              const dx = x - cx - shift;
              const q = dx * dx + dy * dy;
              if (q >= outer) continue;
              const wx = ((cx % p.columns) + p.columns) % p.columns;
              const face = 1 - smooth(clamp((q - inner) / (outer - inner)));
              const center = smooth(clamp((q - 0.0025) / 0.02));
              const arc =
                center *
                (0.5 +
                  0.5 *
                    Math.cos(
                      (TAU * (Math.sqrt(q) - p.arcStart)) / p.arcSpacing,
                    )) **
                  10;
              pigment +=
                face * (tones[wy * p.columns + wx] + 0.82 * arc - pigment);
            }
          }
          const tx = fract(u * p.tiles),
            ty = fract(v * p.tiles);
          const face =
            smooth(clamp((Math.min(tx, 1 - tx) - p.grout) / p.shoulder)) *
            smooth(clamp((Math.min(ty, 1 - ty) - p.grout) / p.shoulder));
          const grain = grainField(u, v);
          color = 0.3 + face * (pigment - 0.3 + 0.015 * grain);
          // Glazed wave pigment is coplanar; only the tile bevel has macro relief.
          height = (0.65 + 0.004 * grain) * face;
          roughness += 0.4 * (1 - face) + 0.015 * grain * face;
          occlusion = 0.5 + 0.5 * face;
          mortar = 1 - face;
        };
      }
      case 'fossillimestone': {
        const p = proceduralMaterialPresets.fossillimestone;
        const grainField = cachedNoise(80, 80, seed ^ 0x2f39);
        const sedimentField = cachedNoise(12, 12, seed ^ 0x61a7);
        const fossils = new Float64Array(p.cells * p.cells * 5);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const offset = (row * p.cells + col) * 5;
            const angle = TAU * hash(col, row, seed ^ 0x375b);
            const radius = 0.3 + 0.12 * hash(col, row, seed ^ 0x73d1);
            fossils[offset] = Math.cos(angle);
            fossils[offset + 1] = Math.sin(angle);
            fossils[offset + 2] = 1 / radius;
            fossils[offset + 3] =
              1 / (radius * (0.72 + 0.22 * hash(col, row, seed ^ 0x19c7)));
            fossils[offset + 4] = TAU * hash(col, row, seed ^ 0x57b3);
          }
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const offset = (Math.floor(y) * p.cells + Math.floor(x)) * 5;
          const dx = fract(x) - 0.5,
            dy = fract(y) - 0.5;
          const a =
            (dx * fossils[offset] + dy * fossils[offset + 1]) *
            fossils[offset + 2];
          const b =
            (dy * fossils[offset] - dx * fossils[offset + 1]) *
            fossils[offset + 3];
          const q = a * a + b * b;
          const grain = grainField(u, v),
            sediment = sedimentField(u, v);
          color = 0.48 + 0.08 * sediment + 0.035 * grain;
          // A polished cut exposes mineral-filled chambers, not raised shells.
          // Neither the coil nor its outer outline contributes macro relief/AO.
          height = 0.35 + 0.015 * grain;
          roughness += 0.015 * grain;
          occlusion = 0.99;
          if (q >= 1) return;
          const face = 1 - smooth(clamp((q - 0.81) / 0.19));
          const center = smooth(clamp((q - 0.0064) / 0.0256));
          const radius = Math.sqrt(q),
            angle = Math.atan2(b, a);
          const phase = fossils[offset + 4];
          // Integer angular harmonics agree across atan2's branch cut; an
          // open constant nucleus removes its directional singularity.
          const coil =
            (0.5 + 0.5 * Math.cos(TAU * p.turns * radius - angle + phase)) **
            16;
          const septa =
            (0.5 + 0.5 * Math.cos(p.septa * angle - TAU * radius + phase)) **
            24;
          const wall = center * (coil + 0.45 * septa * (1 - coil));
          color += face * (0.26 + 0.57 * wall + 0.02 * grain - color);
          roughness -= 0.09 * face * wall;
        };
      }
      case 'rhombille': {
        const p = proceduralMaterialPresets.rhombille;
        const rowStep = Math.sqrt(3) / 2;
        const grainField = cachedNoise(64, 64, seed ^ 0x6b17);
        const tones = new Float64Array(p.columns * p.rows * 3);
        for (let row = 0; row < p.rows; row++)
          for (let col = 0; col < p.columns; col++)
            for (let k = 0; k < 3; k++)
              tones[(row * p.columns + col) * 3 + k] =
                p.shades[k]! +
                0.04 * (hash(col, row, seed ^ (k * 0x9e37)) - 0.5);
        const band = (t: number): number =>
          smooth(clamp((t - p.grout) / p.shoulder)) *
          smooth(clamp((0.5 - p.grout - t) / p.shoulder));
        return () => {
          const x = u * p.columns,
            y = v * p.rows * rowStep;
          const row = Math.floor(y / rowStep);
          let best = Infinity,
            dx = 0,
            dy = 0,
            ownerX = 0,
            ownerY = 0;
          // The even staggered row count closes the triangular lattice at wrap.
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy;
            const offset = (((cy % 2) + 2) % 2) * 0.5;
            const column = Math.round(x - offset);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox;
              const px = x - cx - offset,
                py = y - cy * rowStep;
              const distance = px * px + py * py;
              if (distance < best) {
                best = distance;
                dx = px;
                dy = py;
                ownerX = ((cx % p.columns) + p.columns) % p.columns;
                ownerY = ((cy % p.rows) + p.rows) % p.rows;
              }
            }
          }
          const a = 0.5 * dx + rowStep * dy,
            b = -0.5 * dx + rowStep * dy;
          // Three pairs of parallel half-planes form lozenges, not triangular
          // wedges. Products round corners without a min-distance crease.
          const first = band(dx) * band(a);
          const second = band(-a) * band(-b);
          const third = band(-dx) * band(b);
          const face = first + second + third;
          const i = (ownerY * p.columns + ownerX) * 3;
          const grain = grainField(u, v);
          color =
            0.04 +
            first * tones[i]! +
            second * tones[i + 1]! +
            third * tones[i + 2]! +
            0.02 * grain * face;
          height = (0.65 + 0.005 * grain) * face;
          roughness += 0.4 * (1 - face) + 0.01 * grain * face;
          occlusion = 0.45 + 0.55 * face;
          mortar = 1 - face;
          return;
        };
      }
      case 'oakleaf': {
        const p = proceduralMaterialPresets.oakleaf;
        const fineField = cachedNoise(96, 96, seed ^ 0x9c31);
        const leaves = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 3;
            const angle = TAU * hash(col, row, seed ^ 0x7d43);
            leaves[i] = Math.cos(angle);
            leaves[i + 1] = Math.sin(angle);
            leaves[i + 2] = hash(col, row, seed ^ 0x5a29);
          }
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const i = (Math.floor(y) * p.cells + Math.floor(x)) * 3;
          const dx = fract(x) - 0.5,
            dy = fract(y) - 0.5;
          const a = dx * leaves[i]! + dy * leaves[i + 1]!;
          const b = dy * leaves[i]! - dx * leaves[i + 1]!;
          const along = b / p.length;
          const width = p.width * (0.72 + 0.28 * Math.cos(3 * Math.PI * along));
          const cap = clamp(1 - along * along - (a / width) ** 2);
          const blade = smooth(clamp(cap / 0.18));
          const stem = smooth(
            clamp((1 - (a / 0.012) ** 2 - ((b + 0.405) / 0.065) ** 2) / 0.35),
          );
          const face = 1 - (1 - blade) * (1 - stem);
          const midrib = smooth(clamp(1 - (a / 0.014) ** 2));
          // Regularizing the absolute cross-axis distance keeps paired branch
          // veins differentiable where they meet the central rib.
          const branches =
            (0.5 +
              0.5 *
                Math.cos(
                  TAU *
                    (3 * along - 0.75 * Math.sqrt((a / p.width) ** 2 + 0.0004)),
                )) **
            16;
          const ribs = blade * (midrib + 0.45 * branches * (1 - midrib));
          const grain = fineField(u, v);
          color =
            0.06 +
            face * (0.48 + 0.18 * leaves[i + 2]! + 0.12 * ribs + 0.03 * grain);
          height = 0.08 + 0.28 * face + 0.1 * blade * cap * cap + 0.06 * ribs;
          roughness =
            0.86 + face * (p.roughness - 0.86 + 0.02 * grain - 0.03 * ribs);
          occlusion = 0.55 + 0.4 * face;
          return;
        };
      }
      case 'moire': {
        const p = proceduralMaterialPresets.moire;
        const phaseA = TAU * hash(0, 0, seed ^ 0x6d13);
        const phaseB = TAU * hash(0, 0, seed ^ 0x8a57);
        const grainField = cachedNoise(96, 96, seed ^ 0x3c91);
        return () => {
          // Evaluate the low-frequency beat envelope directly; this is baked
          // watered-silk shading, not view-dependent diffraction or a new BRDF.
          const beat =
            p.bands * u +
            0.9 * Math.sin(TAU * 3 * v + phaseA) -
            0.7 * Math.sin(TAU * 2 * v + phaseB) +
            0.2 * Math.sin(TAU * 2 * u);
          const water = 0.5 + 0.5 * Math.cos(TAU * beat);
          const warp = 0.5 + 0.5 * Math.cos(TAU * p.warpThreads * u);
          const weft = 0.5 + 0.5 * Math.cos(TAU * p.weftThreads * v);
          const grain = grainField(u, v);
          color = 0.2 + 0.55 * water + 0.025 * warp + 0.01 * grain;
          height = 0.08 + 0.12 * warp + 0.06 * weft + 0.004 * grain;
          roughness += -0.19 * water + 0.015 * grain + 0.01 * weft;
          occlusion = 0.93 + 0.045 * (0.7 * warp + 0.3 * weft);
          return;
        };
      }
      case 'bamboocrosscut': {
        const p = proceduralMaterialPresets.bamboocrosscut;
        const tubes = new Float64Array(p.cells * p.cells * 3);
        for (let y = 0; y < p.cells; y++)
          for (let x = 0; x < p.cells; x++) {
            const i = (y * p.cells + x) * 3;
            const radius = 0.4 + 0.055 * hash(x, y, seed ^ 0x7a31);
            tubes[i] = radius;
            tubes[i + 1] = radius * (0.59 + 0.1 * hash(x, y, seed ^ 0xb419));
            tubes[i + 2] = hash(x, y, seed ^ 0x5d63);
          }
        const grainField = cachedNoise(96, 96, seed ^ 0x391b);
        const poreField = cachedNoise(64, 64, seed ^ 0x89c7);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const i = (Math.floor(y) * p.cells + Math.floor(x)) * 3;
          const radius = tubes[i]!,
            inner = tubes[i + 1]!,
            tone = tubes[i + 2]!;
          const distance = Math.hypot(fract(x) - 0.5, fract(y) - 0.5);
          const wall =
            smooth(clamp((radius - distance) / p.edge)) *
            smooth(clamp((distance - inner) / p.edge));
          const rind = smooth(
            clamp((distance - radius + p.rindWidth) / p.edge),
          );
          const grain = grainField(u, v);
          const pores =
            smooth(clamp((poreField(u, v) - 0.62) / 0.16)) * (1 - rind);
          // Unlike timber endgrain, bamboo has an annular wall and no annual
          // rings. The dark hollow remains opaque backing, not cutout geometry.
          color =
            0.025 +
            0.01 * grain +
            wall *
              ((0.78 + 0.1 * tone - 0.1 * pores) * (1 - rind) + 0.18 * rind);
          height = wall * (0.7 + 0.015 * grain - 0.05 * pores);
          roughness += 0.03 * grain - 0.24 * wall * rind;
          occlusion = 0.35 + 0.6 * wall;
          return;
        };
      }
      case 'mossypavers': {
        const p = proceduralMaterialPresets.mossypavers;
        const growthField = cachedNoise(8, 8, seed ^ 0x6c39);
        const grainField = cachedNoise(96, 96, seed ^ 0x4e17);
        const wearField = cachedNoise(20, 20, seed ^ 0x95a3);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          const face =
            smooth(clamp((0.5 - Math.abs(fract(x) - 0.5) - p.gap) / p.bevel)) *
            smooth(clamp((0.5 - Math.abs(fract(y) - 0.5) - p.gap) / p.bevel));
          const grain = grainField(u, v);
          const tips = smooth(clamp((grain - 0.2) / 0.6));
          const growth = smooth(clamp((growthField(u, v) - 0.35) / 0.3));
          const moss = (1 - face) * growth;
          const tone = hash(ix, iy, seed ^ 0x21bf);
          // Growth fills selected joints below the stone crowns, not a green
          // tint spread across every face. Neutral mortar supplies the stone hue.
          color =
            0.08 +
            face * (0.2 + 0.4 * tone) +
            0.65 * moss * (0.65 + 0.35 * tips);
          mortar = face * (0.75 + 0.15 * tone);
          height =
            face * (0.65 + 0.04 * wearField(u, v)) +
            moss * (0.16 + 0.1 * tips) +
            0.01 * grain;
          roughness += 0.22 * (1 - face) + 0.07 * moss + 0.02 * grain;
          occlusion = 0.5 + 0.47 * face + 0.2 * moss;
          return;
        };
      }
      case 'gingham': {
        const p = proceduralMaterialPresets.gingham;
        const grainField = cachedNoise(96, 96, seed ^ 0x6d31);
        return () => {
          const warpWhite = smooth(
            clamp(
              (Math.cos(TAU * u * p.checks) + p.colorEdge) / (2 * p.colorEdge),
            ),
          );
          const weftWhite = smooth(
            clamp(
              (Math.cos(TAU * v * p.checks) + p.colorEdge) / (2 * p.colorEdge),
            ),
          );
          const x = u * p.threads,
            y = v * p.threads;
          const warp = 0.5 + 0.5 * Math.cos(TAU * x),
            weft = 0.5 + 0.5 * Math.cos(TAU * y);
          const over =
            0.5 + 0.5 * Math.cos(Math.PI * x) * Math.cos(Math.PI * y);
          const weave =
            warp * (0.35 + 0.25 * over) +
            weft * (0.35 + 0.25 * (1 - over)) -
            0.3 * warp * weft;
          const grain = grainField(u, v);
          // Mixed checks expose alternating dyed/undyed yarns, not a flat printed intermediate tone.
          color =
            0.1 +
            0.8 * (warpWhite * over + weftWhite * (1 - over)) +
            0.025 * grain;
          height = 0.12 + 0.22 * weave + 0.01 * grain;
          roughness += 0.025 * grain + 0.02 * (1 - weave);
          occlusion = 0.82 + 0.16 * weave;
          return;
        };
      }
      case 'gabion': {
        const p = proceduralMaterialPresets.gabion;
        const grainField = cachedNoise(64, 64, seed ^ 0x4c71);
        const stones = new Float64Array(p.cells * p.cells * 7);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 7;
            const angle = TAU * hash(col, row, seed ^ 0x1b39);
            const radius =
              p.radiusMin + p.radiusRange * hash(col, row, seed ^ 0x5f27);
            const aspect = 0.85 + 0.15 * hash(col, row, seed ^ 0x7d13);
            stones[i] =
              0.5 + p.jitter * (2 * hash(col, row, seed ^ 0x2a59) - 1);
            stones[i + 1] =
              0.5 + p.jitter * (2 * hash(col, row, seed ^ 0x6e43) - 1);
            stones[i + 2] = Math.cos(angle);
            stones[i + 3] = Math.sin(angle);
            stones[i + 4] = 1 / (radius * radius);
            stones[i + 5] = 1 / (aspect * aspect);
            stones[i + 6] = hash(col, row, seed ^ 0x3b65);
          }
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const i = (Math.floor(y) * p.cells + Math.floor(x)) * 7;
          const dx = fract(x) - stones[i],
            dy = fract(y) - stones[i + 1];
          const rx = dx * stones[i + 2] + dy * stones[i + 3];
          const ry = dy * stones[i + 2] - dx * stones[i + 3];
          const cap = Math.max(
            0,
            1 - (rx * rx * stones[i + 5] + ry * ry) * stones[i + 4],
          );
          const coverage = smooth(clamp(cap / 0.3));
          const wx = (fract(u * p.mesh + 0.5) - 0.5) / p.wireWidth;
          const wy = (fract(v * p.mesh + 0.5) - 0.5) / p.wireWidth;
          const a = smooth(clamp(1 - wx * wx)),
            b = smooth(clamp(1 - wy * wy));
          const wire = a + b - a * b,
            grain = grainField(u, v);
          color = 0.12 + coverage * (0.2 + 0.4 * stones[i + 6]) + 0.025 * grain;
          // The steel grid stays above the stone crowns and blends to opaque backing, not holes.
          height =
            (0.16 + 0.4 * cap * cap + 0.015 * grain) * (1 - wire) + 0.85 * wire;
          roughness = (roughness + 0.02 * grain) * (1 - wire) + 0.3 * wire;
          occlusion = (0.55 + 0.38 * coverage) * (1 - wire) + 0.98 * wire;
          mortar = wire;
          metallic = wire;
          return;
        };
      }
      case 'ashlar': {
        const p = proceduralMaterialPresets.ashlar;
        const owners = new Uint8Array(p.cells * p.cells);
        const tones = new Float64Array(p.stones.length);
        const grainField = cachedNoise(64, 64, seed ^ 0x2f63);
        const mineralField = cachedNoise(12, 12, seed ^ 0x7b19);
        for (let i = 0; i < p.stones.length; i++) {
          const [x, y, width, height] = p.stones[i];
          tones[i] = hash(i, 0, seed ^ 0x5c47);
          for (let row = y; row < y + height; row++)
            for (let col = x; col < x + width; col++)
              owners[row * p.cells + col] = i;
        }
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const index = owners[Math.floor(y) * p.cells + Math.floor(x)];
          const stone = p.stones[index];
          const dx = x - stone[0],
            dy = y - stone[1];
          // Internal lookup cells are not joints; only the complete stone boundary bevels.
          const face =
            smooth(clamp((dx - p.gap) / p.bevel)) *
            smooth(clamp((stone[2] - dx - p.gap) / p.bevel)) *
            smooth(clamp((dy - p.gap) / p.bevel)) *
            smooth(clamp((stone[3] - dy - p.gap) / p.bevel));
          const grain = grainField(u, v),
            mineral = mineralField(u, v);
          color =
            0.05 +
            face * (0.28 + 0.35 * tones[index] + 0.18 * mineral) +
            0.025 * grain;
          height = face * (0.62 + 0.08 * mineral + 0.015 * grain);
          roughness += 0.16 * (1 - face) + 0.04 * grain;
          occlusion = 0.58 + 0.4 * face;
          return;
        };
      }
      case 'sashiko': {
        const p = proceduralMaterialPresets.sashiko;
        const grainField = cachedNoise(64, 64, seed ^ 0x7a31);
        const phases = new Uint8Array(p.cells * 2);
        for (let i = 0; i < p.cells; i++) {
          phases[i] = hash(i, 0, seed ^ 0x1d73) < 0.5 ? 0 : 1;
          phases[p.cells + i] = hash(i, 0, seed ^ 0x4f29) < 0.5 ? 0 : 1;
        }
        const alongScale = 1 / (p.stitchLength * p.stitchLength);
        const acrossScale = 1 / (p.stitchWidth * p.stitchWidth);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const row = Math.floor(y + 0.5) % p.cells,
            col = Math.floor(x + 0.5) % p.cells;
          const dx = fract(x) - 0.5,
            dy = fract(y + 0.5) - 0.5;
          const ex = fract(x + 0.5) - 0.5,
            ey = fract(y) - 0.5;
          const horizontal =
            Math.floor(x) % 2 === phases[row]
              ? Math.max(0, 1 - dx * dx * alongScale - dy * dy * acrossScale)
              : 0;
          const vertical =
            Math.floor(y) % 2 === phases[p.cells + col]
              ? Math.max(0, 1 - ey * ey * alongScale - ex * ex * acrossScale)
              : 0;
          // Running stitches end before grid intersections; their supports do not overlap.
          const stitch = horizontal * horizontal + vertical * vertical;
          const warp = 0.5 + 0.5 * Math.cos(TAU * u * p.threads);
          const weft = 0.5 + 0.5 * Math.cos(TAU * v * p.threads);
          const over =
            0.5 +
            0.5 *
              Math.cos(Math.PI * u * p.threads) *
              Math.cos(Math.PI * v * p.threads);
          const weave =
            warp * (0.35 + 0.25 * over) +
            weft * (0.35 + 0.25 * (1 - over)) -
            0.3 * warp * weft;
          const grain = grainField(u, v);
          color = 0.04 + 0.05 * weave + 0.85 * stitch + 0.01 * grain;
          height = 0.08 + 0.1 * weave + 0.6 * stitch + 0.005 * grain;
          roughness += 0.03 * grain - 0.08 * stitch;
          occlusion = 0.8 + 0.1 * weave + 0.1 * stitch;
          return;
        };
      }
      case 'pressedtin': {
        const p = proceduralMaterialPresets.pressedtin;
        const fineField = cachedNoise(64, 64, seed ^ 0x5a39);
        const alongScale = 1 / (p.petalLength * p.petalLength);
        const acrossScale = 1 / (p.petalWidth * p.petalWidth);
        const bossScale = 1 / (p.bossRadius * p.bossRadius);
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const outer =
            smooth(clamp((p.frameOuter - Math.abs(x)) / p.frameEdge)) *
            smooth(clamp((p.frameOuter - Math.abs(y)) / p.frameEdge));
          const inner =
            smooth(clamp((p.frameInner - Math.abs(x)) / p.frameEdge)) *
            smooth(clamp((p.frameInner - Math.abs(y)) / p.frameEdge));
          const frame = outer - inner;
          let petals = 0;
          for (let axis = 0; axis < 2; axis++) {
            const along = axis === 0 ? x : y,
              across = axis === 0 ? y : x;
            for (let side = -1; side <= 1; side += 2) {
              const d = along - side * p.petalOffset;
              const cap = Math.max(
                0,
                1 - d * d * alongScale - across * across * acrossScale,
              );
              petals += cap * cap;
            }
          }
          const cap = Math.max(0, 1 - (x * x + y * y) * bossScale);
          const boss = cap * cap,
            grain = fineField(u, v);
          // Compact stamped ornaments return to the same flat metal sheet.
          color =
            0.45 + 0.2 * frame + 0.2 * petals + 0.18 * boss + 0.03 * grain;
          height =
            0.2 + 0.12 * frame + 0.35 * petals + 0.3 * boss + 0.005 * grain;
          roughness +=
            0.05 * grain - 0.07 * petals - 0.06 * boss - 0.04 * frame;
          occlusion = 0.94 + 0.04 * boss + 0.02 * petals;
          return;
        };
      }
      case 'ginkgoleaf': {
        const p = proceduralMaterialPresets.ginkgoleaf;
        const fineField = cachedNoise(96, 96, seed ^ 0x5c19);
        const leaves = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 3;
            const angle = TAU * hash(col, row, seed ^ 0x2d47);
            leaves[i] = Math.cos(angle);
            leaves[i + 1] = Math.sin(angle);
            leaves[i + 2] = hash(col, row, seed ^ 0x6a31);
          }
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const i = (row * p.cells + col) * 3;
          const dx = fract(u * p.cells) - 0.5,
            dy = fract(v * p.cells) - 0.5;
          const a = dx * leaves[i]! + dy * leaves[i + 1]!;
          const b = dy * leaves[i]! - dx * leaves[i + 1]!;
          const r = Math.sqrt(a * a + b * b),
            angle = Math.atan2(a, b);
          const rim =
            p.radius - p.notchDepth * Math.exp(-((angle / p.notchWidth) ** 2));
          // The fan vanishes around the polar origin and angle branch cut.
          const leaf =
            smooth(clamp((rim - r) / p.edge)) *
            smooth(clamp((p.halfAngle - Math.abs(angle)) / 0.12)) *
            smooth(clamp((r - 0.035) / 0.045));
          const stem = smooth(
            clamp((1 - (a * a) / 0.0004 - (b + 0.05) ** 2 / 0.0121) / 0.3),
          );
          const face = 1 - (1 - leaf) * (1 - stem);
          const split = smooth(clamp((r - 0.16) / 0.12));
          const coarse = (0.5 + 0.5 * Math.cos(18 * angle)) ** 8;
          const fine = (0.5 + 0.5 * Math.cos(36 * angle)) ** 8;
          const veins =
            leaf *
            smooth(clamp((r - 0.08) / 0.08)) *
            (coarse * (1 - split) + fine * split);
          const grain = fineField(u, v);
          color =
            0.06 +
            face * (0.55 + 0.15 * leaves[i + 2]! + 0.12 * veins + 0.02 * grain);
          height = 0.08 + face * (0.3 + 0.06 * veins);
          roughness =
            0.85 + face * (p.roughness - 0.85 + 0.02 * grain - 0.04 * veins);
          occlusion = 0.6 + 0.35 * face;
          return;
        };
      }
      case 'chevronparquet': {
        const p = proceduralMaterialPresets.chevronparquet;
        const fineField = cachedNoise(64, 64, seed ^ 0x6b31);
        const variations = new Float64Array(2 * p.rows);
        for (let col = 0; col < 2; col++)
          for (let row = 0; row < p.rows; row++)
            variations[col * p.rows + row] = hash(col, row, seed ^ 0x4d27);
        return () => {
          const col = Math.floor(2 * u),
            local = fract(2 * u);
          const sign = col === 0 ? 1 : -1;
          const band = p.rows * (v + (col === 0 ? u : 1 - u));
          const cross = fract(band),
            row = Math.floor(band) % p.rows;
          const end = smooth(
            clamp(
              (Math.min(local, 1 - local) - p.endGap) / (p.endBevel - p.endGap),
            ),
          );
          const side = smooth(
            clamp(
              (Math.min(cross, 1 - cross) - p.sideGap) /
                (p.sideBevel - p.sideGap),
            ),
          );
          const face = end * side;
          const variation = variations[col * p.rows + row]!;
          const grain =
            0.5 +
            0.5 *
              Math.sin(
                TAU *
                  (p.grainBands * band +
                    0.15 * Math.sin(TAU * 2 * (u - sign * v)) +
                    variation),
              );
          const fineGrain = fineField(u, v);
          // Mitered ends and diagonal board edges meet in the same recessed joint.
          color =
            0.08 +
            face * (0.3 + 0.2 * variation + 0.22 * grain + 0.03 * fineGrain);
          height = face * (0.6 + 0.01 * grain);
          roughness = 0.84 + face * (p.roughness - 0.84 + 0.04 * grain);
          occlusion = 0.5 + 0.48 * face;
          return;
        };
      }
      case 'argyle': {
        const p = proceduralMaterialPresets.argyle;
        const grainField = cachedNoise(96, 96, seed ^ 0x3e57);
        return () => {
          const x = Math.PI * p.diamonds * (u + v);
          const y = Math.PI * p.diamonds * (u - v);
          const a = 2 * smooth(clamp(0.5 + Math.sin(x) / p.colorEdge)) - 1;
          const b = 2 * smooth(clamp(0.5 + Math.sin(y) / p.colorEdge)) - 1;
          const diamond = 0.5 + 0.5 * a * b;
          const lineA = smooth(
            clamp(
              (p.lineOuter - Math.abs(Math.cos(x))) /
                (p.lineOuter - p.lineInner),
            ),
          );
          const lineB = smooth(
            clamp(
              (p.lineOuter - Math.abs(Math.cos(y))) /
                (p.lineOuter - p.lineInner),
            ),
          );
          const line = 1 - (1 - lineA) * (1 - lineB);
          const warp = 0.5 + 0.5 * Math.cos(TAU * p.threads * u);
          const weft = 0.5 + 0.5 * Math.cos(TAU * p.threads * v);
          const over = 0.5 + 0.5 * Math.cos(Math.PI * p.threads * (u + v));
          const thread = warp * over + weft * (1 - over);
          const grain = grainField(u, v);
          color =
            (0.12 + 0.5 * diamond) * (1 - line) +
            0.92 * line +
            0.035 * thread +
            0.02 * grain;
          // Diamonds and crossing lines are pigment, not embossed tile boundaries.
          height = 0.24 + 0.16 * thread + 0.02 * grain;
          roughness += 0.03 * grain + 0.025 * (1 - thread);
          occlusion = 0.88 + 0.1 * thread;
          return;
        };
      }
      case 'perforatedleather': {
        const p = proceduralMaterialPresets.perforatedleather;
        const grainField = cachedNoise(64, 64, seed ^ 0x4e17);
        const fineField = cachedNoise(128, 128, seed ^ 0x2b63);
        const outerSquared = p.outerRadius * p.outerRadius;
        const wallRange = outerSquared - p.coreRadius * p.coreRadius;
        return () => {
          const row = Math.floor(v * p.cells);
          const x = fract(u * p.cells - (row % 2) * 0.5) - 0.5;
          const y = fract(v * p.cells) - 0.5;
          const hole = smooth(
            clamp((outerSquared - x * x - y * y) / wallRange),
          );
          const face = 1 - hole;
          const grain = 0.7 * grainField(u, v) + 0.3 * fineField(u, v);
          // Recessed opaque backing, not alpha-cut geometry or raised quill collars.
          color = (0.55 + 0.12 * grain) * face + 0.025 * hole;
          height = (0.6 + 0.035 * grain) * face + 0.08 * hole;
          roughness += 0.03 * grain * face + 0.46 * hole;
          occlusion = 0.98 - 0.75 * hole;
          return;
        };
      }
      case 'chippedenamel': {
        const p = proceduralMaterialPresets.chippedenamel;
        const grainField = cachedNoise(96, 96, seed ^ 0x6a37);
        const stride = 3 + p.edges * 3;
        const chips = new Float64Array(p.cells * p.cells * stride);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * stride;
            chips[i] = 0.35 + 0.3 * hash(col, row, seed ^ 0x5b21);
            chips[i + 1] = 0.35 + 0.3 * hash(col, row, seed ^ 0x2e49);
            chips[i + 2] =
              hash(col, row, seed ^ 0x7c13) < p.chipChance
                ? p.radiusMin + p.radiusRange * hash(col, row, seed ^ 0x4d61)
                : 0;
            const rotation = TAU * hash(col, row, seed ^ 0x3f19);
            for (let edge = 0; edge < p.edges; edge++) {
              const j = i + 3 + edge * 3;
              const angle = rotation + (TAU * edge) / p.edges;
              chips[j] = Math.cos(angle);
              chips[j + 1] = Math.sin(angle);
              chips[j + 2] =
                chips[i + 2]! *
                (0.55 + 0.3 * hash(col * p.edges + edge, row, seed ^ 0x1a53));
            }
          }
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const i = (row * p.cells + col) * stride;
          const x = fract(u * p.cells) - chips[i]!,
            y = fract(v * p.cells) - chips[i + 1]!;
          let chip = chips[i + 2] === 0 ? 0 : 1;
          for (let edge = 0; edge < p.edges && chip > 0; edge++) {
            const j = i + 3 + edge * 3;
            const inward = chips[j + 2]! - x * chips[j]! - y * chips[j + 1]!;
            chip *= smooth(clamp(inward / p.edge));
          }
          const coating = 1 - chip,
            grain = grainField(u, v);
          // Brittle enamel breaks away without the curled lip of peeling paint.
          color = 0.12 + 0.74 * coating + 0.03 * grain;
          height = 0.15 + 0.5 * coating + 0.005 * grain;
          metallic = chip;
          roughness += 0.5 * chip + 0.04 * grain * chip;
          occlusion = 1 - 0.12 * chip - 0.48 * chip * coating;
          return;
        };
      }
      case 'linen': {
        const p = proceduralMaterialPresets.linen;
        const warpSlubs = cachedNoise(p.threads, 4, seed ^ 0x3c19);
        const weftSlubs = cachedNoise(p.threads, 4, seed ^ 0x6b43);
        return () => {
          const x = u * p.threads,
            y = v * p.threads;
          const col = Math.floor(x + 0.5) % p.threads,
            row = Math.floor(y + 0.5) % p.threads;
          const warpSlub = warpSlubs(col / p.threads, v),
            weftSlub = weftSlubs(row / p.threads, u);
          const dx =
            (fract(x + 0.5) - 0.5) / (p.halfWidth + p.slubWidth * warpSlub);
          const dy =
            (fract(y + 0.5) - 0.5) / (p.halfWidth + p.slubWidth * weftSlub);
          // Variable-width yarns vanish inside gaps before their owners change.
          const warp = smooth(clamp(1 - dx * dx)),
            weft = smooth(clamp(1 - dy * dy));
          const over =
            0.5 + 0.5 * Math.cos(Math.PI * x) * Math.cos(Math.PI * y);
          const warpTop = warp * (1 - weft + weft * over),
            weftTop = weft * (1 - warp + warp * (1 - over));
          const coverage = warpTop + weftTop,
            crossing = warp * weft;
          const bulge = warpTop * warpSlub + weftTop * weftSlub;
          const fiber =
            warpTop * (0.5 + 0.5 * Math.sin(TAU * 96 * u + phase)) +
            weftTop * (0.5 + 0.5 * Math.sin(TAU * 96 * v + phase));
          color = 0.15 + 0.55 * coverage + 0.08 * fiber + 0.08 * bulge;
          height =
            0.12 +
            0.5 * coverage +
            0.18 * crossing +
            0.06 * bulge +
            0.03 * fiber;
          roughness -= 0.03 * coverage;
          occlusion = 0.62 + 0.37 * coverage;
          return;
        };
      }
      case 'porphyry': {
        const p = proceduralMaterialPresets.porphyry;
        const grainField = cachedNoise(96, 96, seed ^ 0x6c21);
        const crystals = new Float64Array(p.cells * p.cells * 6);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 6;
            const angle = TAU * hash(col, row, seed ^ 0x3b59);
            crystals[i] = 0.35 + 0.3 * hash(col, row, seed ^ 0x5e13);
            crystals[i + 1] = 0.35 + 0.3 * hash(col, row, seed ^ 0x7a31);
            crystals[i + 2] = Math.cos(angle);
            crystals[i + 3] = Math.sin(angle);
            crystals[i + 4] =
              hash(col, row, seed ^ 0x2d47) < p.crystalChance
                ? p.halfLengthMin +
                  p.halfLengthRange * hash(col, row, seed ^ 0x4f19)
                : 0;
            crystals[i + 5] =
              p.halfWidthMin + p.halfWidthRange * hash(col, row, seed ^ 0x1c63);
          }
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const i = (row * p.cells + col) * 6;
          const x = fract(u * p.cells) - crystals[i]!,
            y = fract(v * p.cells) - crystals[i + 1]!;
          const along = x * crystals[i + 2]! + y * crystals[i + 3]!;
          const across = -x * crystals[i + 3]! + y * crystals[i + 2]!;
          const crystal =
            smooth(clamp((crystals[i + 4]! - Math.abs(along)) / p.edge)) *
            smooth(clamp((crystals[i + 5]! - Math.abs(across)) / p.edge));
          const grain = grainField(u, v);
          color = 0.24 + 0.12 * grain + crystal * (0.55 - 0.06 * grain);
          // Polishing leaves feldspar inclusions flush, not raised stone fragments.
          height = 0.4 + 0.015 * grain;
          roughness += 0.08 * grain - 0.22 * crystal;
          occlusion = 1 - 0.02 * grain;
          return;
        };
      }
      case 'castiron': {
        const p = proceduralMaterialPresets.castiron;
        const fineField = cachedNoise(96, 96, seed ^ 0x3f21);
        const coarseField = cachedNoise(48, 48, seed ^ 0x6d49);
        const pores = new Float64Array(p.cells * p.cells * 3);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 3;
            pores[i] = 0.3 + 0.4 * hash(col, row, seed ^ 0x2c19);
            pores[i + 1] = 0.3 + 0.4 * hash(col, row, seed ^ 0x5a73);
            const radius =
              p.poreRadiusMin +
              p.poreRadiusRange * hash(col, row, seed ^ 0x7e35);
            pores[i + 2] =
              hash(col, row, seed ^ 0x1b47) < p.poreChance
                ? 1 / (radius * radius)
                : 0;
          }
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const i = (row * p.cells + col) * 3;
          const x = fract(u * p.cells) - pores[i]!,
            y = fract(v * p.cells) - pores[i + 1]!;
          const inverseRadiusSquared = pores[i + 2]!;
          // Sparse casting pores end inside their cells, unlike broad overlapping hammer dents.
          const pore =
            inverseRadiusSquared === 0
              ? 0
              : smooth(clamp(1 - (x * x + y * y) * inverseRadiusSquared));
          const grain = 0.7 * fineField(u, v) + 0.3 * coarseField(u, v);
          color = 0.45 + 0.3 * grain - 0.2 * pore;
          height = 0.4 + 0.14 * grain - 0.3 * pore;
          roughness += 0.12 * grain + 0.12 * pore;
          occlusion = 1 - 0.45 * pore;
          return;
        };
      }
      case 'windmillpavers': {
        const p = proceduralMaterialPresets.windmillpavers;
        const grainField = cachedNoise(64, 64, seed ^ 0x3a57);
        const tones = new Float64Array(p.cells * p.cells * 5);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            for (let brick = 0; brick < 5; brick++)
              tones[(row * p.cells + col) * 5 + brick] = hash(
                col * 5 + brick,
                row,
                seed ^ 0x5e13,
              );
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const x = fract(u * p.cells) * 3,
            y = fract(v * p.cells) * 3;
          let left = 1,
            top = 1,
            width = 1,
            depth = 1,
            brick = 4;
          if (y < 1 && x < 2) {
            left = 0;
            top = 0;
            width = 2;
            brick = 0;
          } else if (x >= 2 && y < 2) {
            left = 2;
            top = 0;
            depth = 2;
            brick = 1;
          } else if (y >= 2 && x >= 1) {
            left = 1;
            top = 2;
            width = 2;
            brick = 2;
          } else if (x < 1 && y >= 1) {
            left = 0;
            top = 1;
            depth = 2;
            brick = 3;
          }
          const dx = x - left,
            dy = y - top;
          const face =
            smooth(clamp((Math.min(dx, width - dx) - p.grout) / p.shoulder)) *
            smooth(clamp((Math.min(dy, depth - dy) - p.grout) / p.shoulder));
          const grain = grainField(u, v);
          const tone = tones[(row * p.cells + col) * 5 + brick]!;
          // Each long paver and the dark square fade into the same recessed grout.
          color =
            0.08 +
            face * ((brick === 4 ? 0.1 : 0.5) + 0.15 * tone + 0.08 * grain);
          height = face * (0.7 + 0.008 * grain);
          roughness += face * (0.03 * grain - 0.04);
          occlusion = 0.45 + 0.55 * face;
          mortar = 1 - face;
          return;
        };
      }
      case 'damascus': {
        const p = proceduralMaterialPresets.damascus;
        const grainField = cachedNoise(64, 64, seed ^ 0x5de7);
        const centers = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 2;
            centers[i] = 0.4 + 0.2 * hash(col, row, seed ^ 0x37a1);
            centers[i + 1] = 0.4 + 0.2 * hash(col, row, seed ^ 0x6b19);
          }
        const inverseRadiusSquared = 1 / (p.foldRadius * p.foldRadius);
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const i = (row * p.cells + col) * 2;
          const x = fract(u * p.cells) - centers[i]!;
          const y = fract(v * p.cells) - centers[i + 1]!;
          // Compact folds return to the shared strata before changing cell owner.
          const fold = smooth(
            clamp(1 - (x * x + y * y) * inverseRadiusSquared),
          );
          const angle =
            TAU *
            (v * p.layers +
              0.35 * Math.sin(TAU * u + phase) +
              p.foldStrength * fold);
          const layer = smooth(0.5 + 0.5 * Math.sin(angle));
          const grain = grainField(u, v);
          color = 0.2 + 0.65 * layer + 0.03 * grain;
          height = 0.3 + 0.1 * layer + 0.003 * grain;
          roughness += 0.28 * (1 - layer) + 0.02 * grain;
          occlusion = 0.96 + 0.04 * layer;
          return;
        };
      }
      case 'standingseam': {
        const p = proceduralMaterialPresets.standingseam;
        const rolledField = cachedNoise(64, 4, seed ^ 0x3e87);
        return () => {
          const x = Math.abs(fract(u * p.panels + 0.5) - 0.5);
          const cap = 1 - smooth(clamp((x - p.capHalfWidth) / p.shoulder));
          const d = (x - p.toeOffset) / p.toeWidth;
          const toe = smooth(clamp(1 - d * d));
          const rolled = rolledField(u, v);
          color = 0.5 + 0.1 * rolled + 0.1 * cap - 0.1 * toe;
          height = 0.15 + 0.72 * cap - 0.07 * toe + 0.003 * rolled;
          roughness += 0.05 * rolled - 0.06 * cap;
          occlusion = 1 - 0.18 * toe;
          return;
        };
      }
      case 'truchettiles': {
        const p = proceduralMaterialPresets.truchettiles;
        const grainField = cachedNoise(32, 32, seed ^ 0x2d75);
        const turns = new Uint8Array(p.cells * p.cells);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            turns[row * p.cells + col] =
              hash(col, row, seed ^ 0x4be9) < 0.5 ? 0 : 1;
        const radiusSquared = p.arcRadius * p.arcRadius;
        const arc = (x: number, y: number): number => {
          const d = (x * x + y * y - radiusSquared) / p.arcWidthSquared;
          return smooth(clamp(1 - d * d));
        };
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const x = fract(u * p.cells),
            y = fract(v * p.cells);
          const face =
            smooth(clamp((Math.min(x, 1 - x) - p.grout) / p.shoulder)) *
            smooth(clamp((Math.min(y, 1 - y) - p.grout) / p.shoulder));
          const ty = turns[row * p.cells + col] ? 1 - y : y;
          const motif = arc(x, ty) + arc(1 - x, 1 - ty);
          const grain = grainField(u, v);
          color = 0.3 + face * (0.62 - 0.83 * motif + 0.025 * grain);
          // Glazed pigment follows the same flat tile face, not raised tubing.
          height = (0.65 + 0.003 * grain) * face;
          roughness += 0.32 * (1 - face) + 0.015 * grain * face;
          occlusion = 0.5 + 0.5 * face;
          mortar = 1 - face;
          return;
        };
      }
      case 'octagondot': {
        const p = proceduralMaterialPresets.octagondot;
        const grainField = cachedNoise(32, 32, seed ^ 0x7ce3);
        const dotSquared = p.dotRadius * p.dotRadius;
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const octagon =
            smooth(clamp((0.5 - Math.abs(x) - p.grout) / p.shoulder)) *
            smooth(clamp((0.5 - Math.abs(y) - p.grout) / p.shoulder)) *
            smooth(clamp((p.clippedCorner - Math.abs(x + y)) / p.shoulder)) *
            smooth(clamp((p.clippedCorner - Math.abs(x - y)) / p.shoulder));
          const dx = fract(u * p.cells + 0.5) - 0.5;
          const dy = fract(v * p.cells + 0.5) - 0.5;
          // Diagonal bands keep diamond corners smooth, including the wrap axes.
          const dot =
            smooth(clamp((dotSquared - (dx + dy) ** 2) / p.dotShoulder)) *
            smooth(clamp((dotSquared - (dx - dy) ** 2) / p.dotShoulder));
          const grain = grainField(u, v);
          const tile = octagon + dot;
          color =
            0.2 + (0.72 + 0.04 * grain) * octagon - (0.13 - 0.02 * grain) * dot;
          height = (0.65 + 0.005 * grain) * tile;
          roughness += 0.35 * (1 - tile) + 0.015 * grain * tile;
          occlusion = 0.45 + 0.55 * tile;
          mortar = 1 - tile;
          return;
        };
      }
      case 'ripstop': {
        const p = proceduralMaterialPresets.ripstop;
        const grainField = cachedNoise(32, 32, seed ^ 0x71e9);
        const ridge = (t: number): number => {
          const d = (fract(t + 0.5) - 0.5) / p.reinforcementWidth;
          return smooth(clamp(1 - d * d));
        };
        return () => {
          const x = u * p.threads,
            y = v * p.threads;
          const warp = 0.5 + 0.5 * Math.cos(TAU * x);
          const weft = 0.5 + 0.5 * Math.cos(TAU * y);
          const over =
            0.5 + 0.5 * Math.cos(Math.PI * x) * Math.cos(Math.PI * y);
          const weave =
            warp * (0.35 + 0.25 * over) +
            weft * (0.35 + 0.25 * (1 - over)) -
            0.3 * warp * weft;
          const rx =
            ridge(u * p.cells - p.reinforcementOffset) +
            ridge(u * p.cells + p.reinforcementOffset);
          const ry =
            ridge(v * p.cells - p.reinforcementOffset) +
            ridge(v * p.cells + p.reinforcementOffset);
          const grid = rx + ry - rx * ry;
          const grain = grainField(u, v);
          color = 0.28 + 0.2 * weave + 0.25 * grid + 0.06 * grain;
          height = 0.1 + 0.24 * weave + 0.38 * grid + 0.015 * grain;
          roughness += 0.06 * grid + 0.03 * grain;
          occlusion = 0.8 + 0.16 * weave + 0.04 * grid;
          return;
        };
      }
      case 'basketweavepavers': {
        const p = proceduralMaterialPresets.basketweavepavers;
        const grainField = cachedNoise(64, 64, seed ^ 0x6a53);
        const tones = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++)
          for (let col = 0; col < p.cells; col++)
            for (let brick = 0; brick < 2; brick++)
              tones[(row * p.cells + col) * 2 + brick] = hash(
                col * 2 + brick,
                row,
                seed ^ 0x43ab,
              );
        return () => {
          const col = Math.floor(u * p.cells),
            row = Math.floor(v * p.cells);
          const x = fract(u * p.cells),
            y = fract(v * p.cells);
          const vertical = (col + row) % 2 !== 0;
          const along = vertical ? y : x,
            cross = vertical ? x : y;
          const brick = Math.floor(cross * 2);
          const across = cross - brick * 0.5;
          const face =
            smooth(clamp((Math.min(along, 1 - along) - p.grout) / p.shoulder)) *
            smooth(
              clamp((Math.min(across, 0.5 - across) - p.grout) / p.shoulder),
            );
          const grain = grainField(u, v);
          // Per-brick tone disappears inside shared grout before the owner changes.
          const tone = tones[(row * p.cells + col) * 2 + brick]!;
          color = 0.3 + face * (0.25 + 0.2 * tone + 0.08 * grain);
          height = face * (0.65 + 0.025 * grain);
          roughness += face * (0.05 * grain - 0.03);
          occlusion = 0.45 + 0.55 * face;
          mortar = 1 - face;
          return;
        };
      }
      case 'breezeblock': {
        const p = proceduralMaterialPresets.breezeblock;
        const grainField = cachedNoise(64, 64, seed ^ 0x3b75);
        const radiusSquared = p.lobeRadius * p.lobeRadius;
        const lobe = (x: number, y: number): number =>
          smooth(clamp((radiusSquared - x * x - y * y) / p.lobeShoulder));
        return () => {
          const x = fract(u * p.cells) - 0.5,
            y = fract(v * p.cells) - 0.5;
          const face =
            smooth(clamp((0.5 - Math.abs(x) - p.grout) / p.edgeShoulder)) *
            smooth(clamp((0.5 - Math.abs(y) - p.grout) / p.edgeShoulder));
          // A smooth union preserves rounded lobes without cusps at their overlaps.
          const opening =
            1 -
            (1 - lobe(x - p.lobeOffset, y)) *
              (1 - lobe(x + p.lobeOffset, y)) *
              (1 - lobe(x, y - p.lobeOffset)) *
              (1 - lobe(x, y + p.lobeOffset));
          const concrete = face * (1 - opening);
          const grain = grainField(u, v);
          color = 0.04 + concrete * (0.58 + 0.18 * grain);
          height = 0.06 + concrete * (0.74 + 0.02 * grain);
          roughness += 0.08 * grain * concrete;
          occlusion = 0.22 + 0.76 * concrete;
          mortar = 1 - face;
          return;
        };
      }
      case 'birdseyemaple': {
        const p = proceduralMaterialPresets.birdseyemaple;
        const centers = new Float64Array(p.cells * p.cells * 2);
        for (let row = 0; row < p.cells; row++) {
          for (let col = 0; col < p.cells; col++) {
            const i = (row * p.cells + col) * 2;
            centers[i] = 0.34 + 0.32 * hash(col, row, seed ^ 0x4f17);
            centers[i + 1] = 0.34 + 0.32 * hash(col, row, seed ^ 0x23d9);
          }
        }
        const grainField = cachedNoise(48, 4, seed ^ 0x6b31);
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const i = (Math.floor(y) * p.cells + Math.floor(x)) * 2;
          const dx = fract(x) - centers[i],
            dy = fract(y) - centers[i + 1];
          const radius = (dx / p.radiusX) ** 2 + (dy / p.radiusY) ** 2;
          // Compact eyes stay inside their cells; grain bends vanish before owner changes.
          const support = smooth(clamp(1 - radius));
          const core = smooth(clamp(1 - radius / 0.06));
          const rings =
            support > 0
              ? support * (0.5 + 0.5 * Math.cos(TAU * 2 * radius))
              : 0;
          const bend = Math.sin(TAU * 2 * v);
          const grain = Math.sin(
            TAU * (24 * u + 0.35 * bend + 0.7 * dx * support) + phase,
          );
          const fiber = Math.cos(TAU * (64 * u + 0.16 * bend) + phase);
          color = 0.67 + 0.12 * grain - 0.34 * core - 0.12 * rings;
          height = 0.45 + 0.012 * grain - 0.015 * core + 0.005 * fiber;
          roughness += 0.025 * core + 0.03 * grainField(u, v);
          occlusion = 0.98 - 0.04 * core;
          return;
        };
      }
      case 'copperpatina': {
        const p = proceduralMaterialPresets.copperpatina;
        const patches = cachedNoise(4, 4, seed ^ 0x7a93);
        const flakes = cachedNoise(20, 20, seed ^ 0x2c67);
        const grains = cachedNoise(96, 96, seed ^ 0x59e1);
        return () => {
          const patch = patches(u, v),
            flake = flakes(u, v),
            grain = grains(u, v);
          const patina = smooth(
            clamp(
              (0.78 * patch + 0.22 * flake - p.coverageStart) / p.coverageRange,
            ),
          );
          // The same oxide coverage drives color and the metal/dielectric transition.
          color = 0.05 + 0.9 * patina + 0.03 * grain;
          metallic = 1 - patina;
          height = 0.25 + 0.28 * patina + 0.06 * grain + 0.1 * flake * patina;
          roughness += 0.53 * patina + 0.05 * grain;
          occlusion = 0.98 - 0.15 * (1 - flake) * patina;
          return;
        };
      }
      case 'rammedearth': {
        const p = proceduralMaterialPresets.rammedearth;
        const tones = new Float64Array(p.layers);
        for (let i = 0; i < p.layers; i++)
          tones[i] = 0.22 + 0.46 * (i % 2) + 0.14 * hash(i, 0, seed ^ 0x4e71);
        const grains = cachedNoise(96, 96, seed ^ 0x2e59);
        const pores = cachedNoise(32, 48, seed ^ 0x754b);
        return () => {
          const warp =
            p.warp * Math.sin(TAU * u + phase) +
            p.fineWarp * Math.sin(TAU * 3 * u - phase);
          const bedding = fract(v + warp / p.layers) * p.layers;
          const layer = Math.floor(bedding);
          const f = fract(bedding);
          // Blend layer owners before wrapping; packed seams do not create normal jumps.
          const blend = smooth(
            clamp((f - 0.5 + p.transition) / (2 * p.transition)),
          );
          const tone =
            tones[layer] +
            (tones[(layer + 1) % p.layers] - tones[layer]) * blend;
          const seam = smooth(clamp(1 - ((f - 0.5) / p.seamWidth) ** 2));
          const grain = grains(u, v);
          const pit = smooth(clamp((0.38 - pores(u, v)) / 0.25));
          color = 0.14 + 0.62 * tone + 0.13 * grain - 0.12 * seam - 0.1 * pit;
          height = 0.42 + 0.18 * grain - 0.1 * seam - 0.12 * pit;
          roughness += 0.07 * grain - 0.05 * seam;
          occlusion = 0.97 - 0.12 * seam - 0.22 * pit;
          return;
        };
      }
      case 'canewebbing': {
        const p = proceduralMaterialPresets.canewebbing;
        const grainField = cachedNoise(16, 16, seed ^ 0x61c3);
        const ribbon = (t: number, width: number): number => {
          const distance = fract(t + 0.5) - 0.5;
          return smooth(clamp(1 - (distance / width) ** 2));
        };
        return () => {
          const x = u * p.cells,
            y = v * p.cells;
          const warp = ribbon(x, p.ribbonWidth);
          const weft = ribbon(y, p.ribbonWidth);
          const over =
            0.5 + 0.5 * Math.cos(Math.PI * x) * Math.cos(Math.PI * y);
          const warpTop = warp * (1 - weft + weft * over);
          const weftTop = weft * (1 - warp + warp * (1 - over));
          // Half-cell diagonal lacing clips all four corners of each square opening.
          const rising = ribbon(x + y - 0.5, p.diagonalWidth);
          const falling = ribbon(x - y - 0.5, p.diagonalWidth);
          const diagonal = rising + falling - rising * falling;
          const main = warpTop + weftTop;
          const coverage = main * (1 - diagonal) + diagonal;
          const grain = grainField(u, v);
          const fiber =
            (warpTop * Math.cos(TAU * 3 * x + phase) +
              weftTop * Math.cos(TAU * 3 * y + phase)) *
              (1 - diagonal) +
            0.5 *
              diagonal *
              (Math.cos(TAU * 3 * (x + y) + phase) +
                Math.cos(TAU * 3 * (x - y) + phase));
          color = 0.04 + coverage * (0.6 + 0.1 * grain) + 0.035 * fiber;
          height =
            0.06 +
            (warpTop * (0.63 + 0.04 * over) +
              weftTop * (0.63 + 0.04 * (1 - over))) *
              (1 - diagonal) +
            0.72 * diagonal +
            coverage * 0.01 * grain +
            0.003 * fiber;
          roughness +=
            0.3 * (1 - coverage) + 0.04 * grain * coverage - 0.025 * fiber;
          occlusion = 0.22 + 0.77 * coverage;
          return;
        };
      }
      case 'subwaytiles': {
        const p = proceduralMaterialPresets.subwaytiles;
        const owners = new Float64Array(p.columns * p.rows);
        for (let row = 0; row < p.rows; row++)
          for (let column = 0; column < p.columns; column++)
            owners[row * p.columns + column] = hash(column, row, seed ^ 0x7b19);
        return () => {
          const row = Math.floor(v * p.rows);
          const shifted = u * p.columns + (row % 2) * 0.5;
          const x = fract(shifted);
          const aspect = p.columns / p.rows;
          const y = fract(v * p.rows) * aspect;
          // Equal-width shoulders in UV space, including the rectangular corners.
          const face =
            smooth(clamp((x - p.grout) / p.shoulder)) *
            smooth(clamp((1 - x - p.grout) / p.shoulder)) *
            smooth(clamp((y - p.grout) / p.shoulder)) *
            smooth(clamp((aspect - y - p.grout) / p.shoulder));
          const inset = p.grout + p.shoulder;
          const plateau =
            smooth(clamp((x - inset) / p.bevel)) *
            smooth(clamp((1 - x - inset) / p.bevel)) *
            smooth(clamp((y - inset) / p.bevel)) *
            smooth(clamp((aspect - y - inset) / p.bevel));
          const tone =
            owners[row * p.columns + (Math.floor(shifted) % p.columns)];
          // Owner-dependent color vanishes before staggered row ownership changes.
          color = 0.4 + face * (0.2 + 0.24 * tone);
          height = 0.08 + face * (0.32 + 0.48 * plateau);
          mortar = 1 - face;
          roughness += 0.6 * mortar + 0.05 * face * (1 - plateau);
          occlusion = 0.62 + 0.38 * face;
          return;
        };
      }
      case 'flutedwood': {
        const p = proceduralMaterialPresets.flutedwood;
        const grainField = cachedNoise(64, 4, seed ^ 0x47b1);
        return () => {
          const x = fract(u * p.slats) - 0.5;
          // A compact rounded crown meets the flat backing with zero slope.
          const crown = smooth(clamp(1 - (x / p.halfWidth) ** 2));
          const grain = grainField(
            u + 0.008 * Math.sin(TAU * 2 * v + phase),
            v,
          );
          const fiber =
            0.5 +
            0.5 *
              Math.cos(TAU * (96 * u + 0.24 * Math.sin(TAU * 2 * v)) + phase);
          color = 0.08 + crown * (0.43 + 0.28 * grain + 0.045 * fiber);
          height = 0.08 + crown * (0.71 + 0.018 * grain + 0.006 * fiber);
          roughness += 0.26 * (1 - crown) + 0.055 * grain * crown;
          occlusion = 0.52 + 0.47 * crown;
          return;
        };
      }
      case 'tatami':
        return () => {
          const p = proceduralMaterialPresets.tatami;
          const reed = 0.5 + 0.5 * Math.cos(TAU * p.reeds * u);
          const cross = fract(v * p.bindings + 0.5) - 0.5;
          const binding = smooth(clamp(1 - (cross / p.bindingWidth) ** 2));
          // Alternate over/under at neighboring reed crowns, with a smooth crossover.
          const over = 0.5 + 0.5 * Math.cos(TAU * (p.reeds / 2) * u);
          const grain = noise(u, v, p.reeds, 4, seed ^ 0x3157);
          const fiber =
            0.5 +
            0.5 *
              Math.cos(TAU * p.reeds * 3 * u + 0.12 * Math.sin(TAU * 4 * v));
          color = 0.31 + 0.26 * reed + 0.18 * grain - 0.14 * binding;
          height =
            0.16 +
            0.4 * reed +
            0.016 * fiber * reed +
            0.015 * detail +
            binding * (0.24 * over - 0.1 * (1 - over));
          roughness += 0.035 * grain - 0.045 * binding * over;
          occlusion = 0.72 + 0.26 * reed - 0.06 * binding * (1 - over);
          return;
        };
      case 'pineapple':
        return () => {
          const p = proceduralMaterialPresets.pineapple,
            x = fract(u + v) * p.cells,
            y = fract(v - u) * p.cells,
            column = Math.floor(x),
            row = Math.floor(y),
            dx = x - column - 0.5,
            dy = y - row - 0.5,
            grain = rindGrain!(u, v),
            variation = rindCells![row * p.cells + column],
            polygon =
              smooth(clamp((0.5 - dx) / p.shoulder)) *
              smooth(clamp((0.5 + dx) / p.shoulder)) *
              smooth(clamp((0.5 - dy) / p.shoulder)) *
              smooth(clamp((0.5 + dy) / p.shoulder)),
            q = (dx * dx + dy * dy) / (p.eyeRadius * p.eyeRadius),
            eye = 1 - smooth(clamp(q)),
            crown = smooth(clamp(q)) * (1 - smooth(clamp((q - 1) / 3)));
          // Disjoint diamond cells: all owner-dependent terms vanish with
          // zero slope at their edges. Raw H [.14,.665], C [.10,.755].
          height =
            0.14 +
            polygon *
              (0.34 +
                0.13 * crown -
                0.22 * eye +
                0.05 * variation +
                0.005 * grain);
          color =
            0.1 +
            polygon * (0.49 + 0.12 * variation + 0.045 * grain - 0.2 * eye);
          occlusion = 0.55 + polygon * (0.42 - 0.2 * eye);
          roughness =
            preset.roughness + 0.04 * (1 - polygon) - 0.025 * crown * polygon;
          return;
        };
      case 'strawberry':
      case 'lychee':
        return () => {
          const x = u * rindColumns,
            y = v * rindRows,
            column = Math.floor(x),
            row = Math.floor(y),
            grain = rindGrain!(u, v);
          let pocket = 0,
            core = 0,
            coverage = 0,
            crown = 0;
          // Strawberry supports fit radius .34. Centers in [.42,.58],
          // so omitted 3x3 rows are >=1.42 away, columns >=.92 with stagger.
          // Pairwise center distance >=.84 > 2*.34: supports are disjoint.
          // Lychee planes imply |dx|<=.495, |dy|<=.66; omitted
          // centers are >=1 (x) or 1.5 (y). Adjacent plane sums <=.99
          // versus center separation 1, so polygons are disjoint too.
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                wx = ((cx % rindColumns) + rindColumns) % rindColumns,
                wy = ((cy % rindRows) + rindRows) % rindRows,
                offset = (wy * rindColumns + wx) * rindStride,
                stagger = (wy % 2) * 0.5;
              if (kind === 'strawberry') {
                const p = proceduralMaterialPresets.strawberry,
                  dx = x - cx - stagger - rindCells![offset],
                  dy = y - cy - rindCells![offset + 1],
                  a =
                    (dx * rindCells![offset + 2] +
                      dy * rindCells![offset + 3]) /
                    p.width,
                  b =
                    (dy * rindCells![offset + 2] -
                      dx * rindCells![offset + 3]) /
                    p.length,
                  q = a * a + b * b;
                if (q >= 1) continue;
                pocket += 1 - smooth(clamp((q - p.core) / (1 - p.core)));
                core += 1 - smooth(clamp(q / p.core));
              } else {
                const p = proceduralMaterialPresets.lychee,
                  dx = x - cx - stagger - 0.5,
                  dy = y - cy - 0.5;
                if (dx >= rindCells![offset] || -dx >= rindCells![offset + 1])
                  continue;
                let polygon = 1;
                for (let side = 0; side < 6; side++) {
                  const plane =
                    side === 0
                      ? dx
                      : side === 1
                        ? -dx
                        : side === 2
                          ? 0.5 * dx + 0.75 * dy
                          : side === 3
                            ? -0.5 * dx - 0.75 * dy
                            : side === 4
                              ? -0.5 * dx + 0.75 * dy
                              : 0.5 * dx - 0.75 * dy;
                  polygon *= smooth(
                    clamp((rindCells![offset + side] - plane) / p.shoulder),
                  );
                  if (polygon === 0) break;
                }
                if (polygon === 0) continue;
                const a = dx - rindCells![offset + 6],
                  b = dy - rindCells![offset + 7];
                coverage += polygon;
                crown += polygon / (1 + 18 * (a * a + b * b));
              }
            }
          if (kind === 'strawberry') {
            // Disjoint supports: P,S in [0,1]. Raw H [.32,.714],
            // C [.12,.912], AO [.68,1], roughness [.41,.47].
            height = 0.62 + 0.004 * grain - 0.3 * pocket + 0.09 * core;
            color = 0.12 + 0.012 * grain + 0.78 * core;
            occlusion = 1 - 0.32 * pocket + 0.12 * core;
            roughness = preset.roughness + 0.04 * pocket - 0.06 * core;
          } else {
            // Disjoint polygons: coverage,crown in [0,1].
            // Raw H [.16,.594], C [.12,.762], AO [.55,.97].
            height = 0.16 + 0.28 * coverage + 0.15 * crown + 0.004 * grain;
            color = 0.12 + 0.55 * coverage + 0.08 * crown + 0.012 * grain;
            occlusion = 0.55 + 0.42 * coverage;
            roughness = preset.roughness + 0.04 * (1 - coverage) - 0.03 * crown;
          }
          return;
        };
      case 'sandpaper':
        return () => {
          // Grit domes stay on a fixed staggered lattice; seed only sizes them.
          const nx = 10,
            ny = 12;
          const cy = Math.floor(v * ny),
            stagger = (cy & 1) * 0.5;
          const cx = Math.floor(u * nx + stagger);
          // Radius hashes wrap with the lattice periods so the seam stays continuous.
          const cellX = ((cx % nx) + nx) % nx,
            cellY = ((cy % ny) + ny) % ny;
          const fx = fract(u * nx + stagger) - 0.5,
            fy = fract(v * ny) - 0.5;
          const d = Math.hypot(fx, fy);
          const r = 0.38 + 0.1 * hash(cellX, cellY, seed ^ 0x2f1a);
          const dome = smooth(clamp((r - d) / (r * 0.55)));
          // Shedding pits gather where smooth noise stays high and never reach the domes.
          const pit =
            smooth(clamp((noise(u, v, 6, 6, seed ^ 0x77c3) - 0.72) / 0.18)) *
            (1 - dome);
          const grain = noise(u, v, 48, 48, seed ^ 0x55a1);
          color = 0.4 + 0.3 * dome - 0.14 * pit + 0.08 * grain;
          height = 0.3 + 0.34 * dome - 0.12 * pit;
          roughness += 0.06 * (grain - 0.5) + 0.04 * (1 - dome);
          occlusion = 1 - 0.44 * (1 - dome) - 0.12 * pit;
          return;
        };
      case 'steelwool':
        return () => {
          // Tangled strand ridges run along three wrapped diagonal families.
          const f1 = Math.sin(Math.PI * (fract(3 * (u + v)) - 0.5)),
            f2 = Math.sin(Math.PI * (fract(3 * (u - v)) - 0.5)),
            f3 = Math.sin(Math.PI * (fract(2 * u + v) - 0.5));
          const e1 = smooth(clamp((0.22 - Math.abs(f1)) / 0.14)),
            e2 = smooth(clamp((0.22 - Math.abs(f2)) / 0.14)),
            e3 = smooth(clamp((0.22 - Math.abs(f3)) / 0.14));
          const i1 = ((Math.floor(3 * (u + v)) % 3) + 3) % 3,
            i2 = ((Math.floor(3 * (u - v)) % 3) + 3) % 3;
          // The third family keeps a constant amplitude: its strand index cannot
          // be labeled periodically, so hashing it would break the wrapped seam.
          const a1 = e1 * (0.85 + 0.15 * hash(i1, 0, seed ^ 0x1d51)),
            a2 = e2 * (0.85 + 0.15 * hash(i2, 1, seed ^ 0x4c2b)),
            a3 = e3 * 0.92;
          // OR of the three envelopes keeps crossing slopes continuous; the
          // pair OR stays bounded so packed crossings cannot leave the unit range.
          const strand = 1 - (1 - a1) * (1 - a2) * (1 - a3);
          const cross = 1 - (1 - a1 * a2) * (1 - a2 * a3) * (1 - a3 * a1);
          const grain = noise(u, v, 32, 32, seed ^ 0x2e07);
          color = 0.44 + 0.34 * strand + 0.1 * cross + 0.08 * grain;
          height = 0.3 + 0.3 * strand + 0.08 * cross;
          roughness += 0.1 * (grain - 0.5) + 0.08 * (1 - strand);
          occlusion = 1 - 0.44 * (1 - strand);
          return;
        };
      case 'wirebrush':
        return () => {
          // Dense parallel bristles lean together and flick only in amplitude.
          // Hash keys wrap with the bristle period so the seam stays continuous.
          const x = u * 24 + 0.3 * Math.sin(TAU * v);
          const ix = Math.floor(x);
          const cell = ((ix % 24) + 24) % 24;
          const fx = fract(x) - 0.5;
          const ridge = smooth(clamp((0.32 - Math.abs(fx)) / 0.12));
          const amp = 0.85 + 0.15 * hash(cell, 0, seed ^ 0x3c71);
          const flick =
            0.9 + 0.1 * Math.sin(TAU * (2 * v + hash(cell, 1, seed ^ 0x61d2)));
          const grain = noise(u, v, 32, 32, seed ^ 0x1b2f);
          color = 0.38 + 0.3 * ridge * amp * flick + 0.08 * grain;
          height = 0.3 + 0.44 * ridge * amp * flick;
          roughness += 0.1 * (grain - 0.5) - 0.06 * ridge;
          occlusion = 1 - 0.44 * (1 - ridge);
          return;
        };
      case 'cheesegrater':
        return () => {
          // Punched holes sink below a raised rim ring on a fixed lattice.
          const nx = 6,
            ny = 8;
          const cx = Math.floor(u * nx),
            cy = Math.floor(v * ny);
          // Rim amplitude hashes wrap with the lattice periods at the seam.
          const cellX = ((cx % nx) + nx) % nx,
            cellY = ((cy % ny) + ny) % ny;
          const fx = fract(u * nx) - 0.5,
            fy = fract(v * ny) - 0.5;
          const d = Math.hypot(fx, fy);
          const hole = smooth(clamp((0.22 - d) / 0.1));
          const rim =
            smooth(clamp((d - 0.22) / 0.06)) * smooth(clamp((0.42 - d) / 0.08));
          const lift = 0.85 + 0.15 * hash(cellX, cellY, seed ^ 0x5c21);
          const plane = (1 - rim) * (1 - hole);
          const grain = noise(u, v, 32, 32, seed ^ 0x3a77);
          color = 0.44 + 0.26 * rim - 0.3 * hole + 0.08 * grain;
          height = 0.3 + 0.24 * rim * lift - 0.26 * hole;
          roughness += 0.08 * (grain - 0.5) - 0.06 * rim + 0.1 * hole;
          occlusion = 1 - 0.44 * hole - 0.12 * plane;
          return;
        };
      case 'ovenrack':
        return () => {
          // Round rods run along u with thin crossbars along v; crossings lift.
          const rv = fract(v * 8) - 0.5,
            cu = fract(u * 4) - 0.5;
          const rod = smooth(clamp((0.3 - Math.abs(rv)) / 0.12));
          const bar = smooth(clamp((0.16 - Math.abs(cu)) / 0.08));
          const cell = ((Math.floor(v * 8) % 8) + 8) % 8;
          const amp = 0.85 + 0.15 * hash(cell, 0, seed ^ 0x2b4d);
          const grain = noise(u, v, 24, 24, seed ^ 0x6e13);
          color =
            0.4 + 0.28 * rod + 0.16 * bar + 0.05 * rod * bar + 0.08 * grain;
          height = 0.3 + 0.36 * rod * amp + 0.16 * bar + 0.06 * rod * bar;
          roughness += 0.08 * (grain - 0.5) - 0.08 * rod;
          occlusion = 1 - 0.44 * (1 - rod) * (1 - bar) - 0.12 * (1 - rod) * bar;
          return;
        };
      case 'muffintin':
        return () => {
          // Cup recesses sit under a raised rim ring on a coarse lattice.
          const nx = 4,
            ny = 4;
          const cx = Math.floor(u * nx),
            cy = Math.floor(v * ny);
          const cellX = ((cx % nx) + nx) % nx,
            cellY = ((cy % ny) + ny) % ny;
          const fx = fract(u * nx) - 0.5,
            fy = fract(v * ny) - 0.5;
          const d = Math.hypot(fx, fy);
          const cup = smooth(clamp((0.34 - d) / 0.12));
          const rim =
            smooth(clamp((d - 0.32) / 0.06)) * smooth(clamp((0.48 - d) / 0.06));
          const lift = 0.85 + 0.15 * hash(cellX, cellY, seed ^ 0x71b5);
          const grain = noise(u, v, 24, 24, seed ^ 0x1f8a);
          color = 0.42 + 0.24 * rim - 0.28 * cup + 0.08 * grain;
          height = 0.3 + 0.2 * rim * lift - 0.28 * cup;
          roughness += 0.08 * (grain - 0.5) - 0.05 * rim + 0.08 * cup;
          occlusion = 1 - 0.44 * cup - 0.12 * (1 - rim) * (1 - cup);
          return;
        };
      case 'gauze':
        return () => {
          // Warp and weft threads undulate over and under; the gaps stay open.
          const n = 12;
          const wx = fract(u * n) - 0.5,
            wy = fract(v * n) - 0.5;
          const warpEnv = smooth(clamp((0.26 - Math.abs(wy)) / 0.14));
          const weftEnv = smooth(clamp((0.26 - Math.abs(wx)) / 0.14));
          // The wave alternates which thread sits above at every crossing.
          const wave = Math.cos(Math.PI * n * (u + v));
          const a1 = warpEnv * (0.72 + 0.28 * wave),
            a2 = weftEnv * (0.72 - 0.28 * wave);
          const over = 1 - (1 - a1) * (1 - a2);
          const grain = noise(u, v, 32, 32, seed ^ 0x4d19);
          color = 0.7 + 0.16 * over + 0.05 * (a1 - a2) + 0.06 * grain;
          height = 0.3 + 0.26 * over + 0.05 * (a1 - a2);
          roughness += 0.08 * (grain - 0.5);
          occlusion = 1 - 0.44 * (1 - over);
          return;
        };
      case 'elasticbandage':
        return () => {
          // Diagonal stretch ribs cross recessed selvedge grooves.
          const rv = fract(4 * (u - v)) - 0.5;
          const rib = smooth(clamp((0.3 - Math.abs(rv)) / 0.12));
          const groove = smooth(
            clamp(
              (0.16 - Math.abs(Math.sin(Math.PI * fract(2 * (u + v))))) / 0.1,
            ),
          );
          const cell = ((Math.floor(4 * (u - v)) % 4) + 4) % 4;
          const amp = 0.85 + 0.15 * hash(cell, 0, seed ^ 0x1c47);
          const grain = noise(u, v, 28, 28, seed ^ 0x55ab);
          color = 0.52 + 0.3 * rib * amp + 0.08 * grain - 0.18 * groove;
          height = 0.3 + 0.26 * rib * amp - 0.16 * groove;
          roughness += 0.08 * (grain - 0.5) - 0.06 * rib;
          occlusion = 1 - 0.44 * groove;
          return;
        };
      case 'icepack':
        return () => {
          // Squircle quilted cells bulge above their recessed seam grid.
          const nx = 4,
            ny = 4;
          const cx = Math.floor(u * nx),
            cy = Math.floor(v * ny);
          const cellX = ((cx % nx) + nx) % nx,
            cellY = ((cy % ny) + ny) % ny;
          const fx = fract(u * nx) - 0.5,
            fy = fract(v * ny) - 0.5;
          const d4 = Math.pow(
            Math.pow(Math.abs(fx), 4) + Math.pow(Math.abs(fy), 4),
            0.25,
          );
          const quilt = smooth(clamp((0.42 - d4) / 0.12));
          const lift = 0.85 + 0.15 * hash(cellX, cellY, seed ^ 0x6b3c);
          const grain = noise(u, v, 24, 24, seed ^ 0x2f81);
          color =
            0.42 + 0.34 * quilt * lift + 0.08 * grain - 0.12 * (1 - quilt);
          height = 0.3 + 0.24 * quilt * lift - 0.16 * (1 - quilt);
          roughness += 0.08 * (grain - 0.5) - 0.05 * quilt;
          occlusion = 1 - 0.44 * (1 - quilt);
          return;
        };
      case 'bubblewrap':
        return () => {
          // Sealed spherical domes puff above the thin film web between them.
          const nx = 12,
            ny = 12;
          const cx = Math.floor(u * nx),
            cy = Math.floor(v * ny);
          const cellX = ((cx % nx) + nx) % nx,
            cellY = ((cy % ny) + ny) % ny;
          const fx = fract(u * nx) - 0.5,
            fy = fract(v * ny) - 0.5;
          const d2 = (fx * fx + fy * fy) / (0.42 * 0.42);
          const dome = d2 < 1 ? (1 - d2) * (1 - d2) : 0;
          const lift = 0.9 + 0.1 * hash(cellX, cellY, seed ^ 0x3c21);
          const film = noise(u, v, 36, 36, seed ^ 0x77aa);
          color = 0.55 + 0.3 * dome * lift + 0.06 * (film - 0.5);
          height = 0.26 + 0.36 * dome * lift;
          roughness += 0.08 * (film - 0.5) - 0.12 * dome;
          occlusion = 1 - 0.42 * (1 - dome);
          return;
        };
      case 'sequin':
        return () => {
          // Staggered discs sit on the cloth with a stitch dimple at each hub.
          const nx = 10,
            ny = 10;
          const row = Math.floor(v * ny);
          const rowW = ((row % ny) + ny) % ny;
          const stagger = 0.5 * (rowW & 1);
          const x = u * nx + stagger;
          const col = Math.floor(x);
          const colW = ((col % nx) + nx) % nx;
          const fx = fract(x) - 0.5,
            fy = fract(v * ny) - 0.5;
          const d2 = (fx * fx + fy * fy) / (0.34 * 0.34);
          const disc = smooth(clamp((1 - d2) / 0.22));
          const hole2 = (fx * fx + fy * fy) / (0.1 * 0.1);
          const dimple = hole2 < 1 ? (1 - hole2) * (1 - hole2) : 0;
          const lift = 0.9 + 0.1 * hash(colW, rowW, seed ^ 0x51d2);
          const tiltX = hash(colW, rowW, seed ^ 0xa11) - 0.5;
          const tiltY = hash(colW, rowW, seed ^ 0xb22) - 0.5;
          const cloth = noise(u, v, 30, 30, seed ^ 0x6c1e);
          const tilt = disc * (tiltX * fx + tiltY * fy);
          color =
            0.46 +
            0.34 * disc * lift +
            0.16 * tilt -
            0.26 * dimple +
            0.06 * (cloth - 0.5);
          height = 0.24 + 0.32 * disc * lift + 0.2 * tilt - 0.24 * dimple;
          roughness += 0.08 * (cloth - 0.5) - 0.1 * disc;
          occlusion = 1 - 0.44 * (1 - disc) - 0.14 * dimple;
          return;
        };
      case 'pennyround':
        return () => {
          // Round glazed tiles crowd together above recessed grainy grout.
          const nx = 8,
            ny = 8;
          const row = Math.floor(v * ny);
          const rowW = ((row % ny) + ny) % ny;
          const stagger = 0.5 * (rowW & 1);
          const x = u * nx + stagger;
          const col = Math.floor(x);
          const colW = ((col % nx) + nx) % nx;
          const fx = fract(x) - 0.5,
            fy = fract(v * ny) - 0.5;
          const d2 = (fx * fx + fy * fy) / (0.46 * 0.46);
          const tile = smooth(clamp((1 - d2) / 0.22));
          const lift = 0.9 + 0.1 * hash(colW, rowW, seed ^ 0x2ab4);
          const grout = noise(u, v, 40, 40, seed ^ 0x77f1);
          color =
            0.56 +
            0.26 * tile * lift +
            0.06 * (grout - 0.5) -
            0.14 * (1 - tile);
          height =
            0.26 + 0.28 * tile * lift + 0.04 * (grout - 0.5) * (1 - tile);
          roughness += 0.12 * (1 - tile) + 0.06 * (grout - 0.5);
          occlusion = 1 - 0.44 * (1 - tile);
          return;
        };
      case 'volleyball':
        return () => {
          // Three broad curved panels meet at recessed seams over a dimpled skin.
          const x = 3 * u + 0.18 * Math.sin(TAU * v);
          const band = Math.floor(x);
          const bandW = ((band % 3) + 3) % 3;
          const fx = fract(x) - 0.5;
          const edge = 0.5 - Math.abs(fx);
          const seam = smooth(clamp((0.06 - edge) / 0.04));
          const lift = 0.92 + 0.08 * hash(bandW, 0, seed ^ 0x51c9);
          const dx = fract(u * 24) - 0.5,
            dy = fract(v * 24) - 0.5;
          const q = (dx * dx + dy * dy) / (0.06 * 0.06);
          const dimple = q < 1 ? (1 - q) * (1 - q) : 0;
          const grain = noise(u, v, 40, 40, seed ^ 0x33a7);
          color =
            0.42 +
            0.4 * lift * (1 - seam) -
            0.14 * seam -
            0.08 * dimple +
            0.05 * (grain - 0.5);
          height = 0.3 + 0.22 * lift * (1 - seam) - 0.16 * seam - 0.07 * dimple;
          roughness += 0.06 * (grain - 0.5) + 0.08 * seam + 0.05 * dimple;
          occlusion = 1 - 0.4 * seam - 0.16 * dimple;
          return;
        };
      case 'bowlingball':
        return () => {
          // Polished pearl swirl wraps a cluster of three recessed finger holes.
          const swirl =
            0.6 * noise(u, v, 6, 6, seed ^ 0x19af) +
            0.4 * noise(u, v, 14, 14, seed ^ 0x2b71);
          let hole = 0;
          for (const [hu, hv] of [
            [0.5, 0.36],
            [0.38, 0.52],
            [0.62, 0.52],
          ] as const) {
            const du = fract(u - hu + 0.5) - 0.5,
              dv = fract(v - hv + 0.5) - 0.5;
            const q = (du * du + dv * dv) / (0.055 * 0.055);
            const recess = q < 1 ? (1 - q) * (1 - q) : 0;
            hole += recess - hole * recess;
          }
          color = 0.36 + 0.34 * swirl - 0.24 * hole;
          height = 0.38 + 0.1 * swirl - 0.3 * hole;
          roughness += 0.05 * (swirl - 0.5) + 0.22 * hole;
          occlusion = 1 - 0.5 * hole;
          return;
        };
      case 'rugbyball':
        return () => {
          // Pebbled leather panels run under a stitched lacing seam.
          const dv = fract(v - 0.25 + 0.5) - 0.5;
          const band = smooth(clamp((0.05 - Math.abs(dv)) / 0.03));
          const s = fract(u * 12) - 0.5;
          const stitch = smooth(clamp((0.18 - Math.abs(s)) / 0.08)) * band;
          const seamV = 0.5 - Math.abs(fract(v * 2) - 0.5);
          const groove = smooth(clamp((0.035 - seamV) / 0.025));
          const pebble = noise(u, v, 72, 72, seed ^ 0x6d2c);
          color =
            0.42 +
            0.26 * stitch -
            0.16 * groove +
            0.12 * (pebble - 0.5) +
            0.06 * band;
          height = 0.32 + 0.16 * stitch - 0.12 * groove + 0.05 * (pebble - 0.5);
          roughness += 0.1 * (pebble - 0.5) - 0.12 * stitch + 0.06 * groove;
          occlusion = 1 - 0.42 * groove - 0.14 * (1 - stitch) * band;
          return;
        };
      case 'wafflecone':
        return () => {
          // Diagonal lattice ridges cradle toasted diamond pockets.
          const a = fract((u + v) * 8) - 0.5,
            b = fract((u - v) * 8) - 0.5;
          const ra = smooth(clamp((0.12 - Math.abs(a)) / 0.08)),
            rb = smooth(clamp((0.12 - Math.abs(b)) / 0.08));
          const ridge = ra + rb - ra * rb;
          const toast = noise(u, v, 24, 24, seed ^ 0x2f31);
          color = 0.42 + 0.3 * ridge - 0.1 * (1 - ridge) + 0.12 * (toast - 0.5);
          height = 0.28 + 0.24 * ridge;
          roughness += 0.08 * (toast - 0.5) - 0.06 * ridge;
          occlusion = 1 - 0.4 * (1 - ridge);
          return;
        };
      case 'donutglaze':
        return () => {
          // Smooth glaze puddles with rounded edges sit over a porous cake.
          const g1 = noise(u, v, 5, 5, seed ^ 0x4c2b),
            g2 = noise(u, v, 11, 11, seed ^ 0x5d3c);
          const glazeField = 0.65 * g1 + 0.35 * g2;
          const glaze = smooth(clamp((glazeField - 0.46) / 0.14));
          const px = fract(u * 14) - 0.5,
            py = fract(v * 14) - 0.5;
          const q = (px * px + py * py) / (0.08 * 0.08);
          const pore = q < 1 ? (1 - q) * (1 - q) : 0;
          const pit = pore * (1 - 0.6 * glaze);
          color = 0.5 + 0.3 * glaze + 0.1 * (g2 - 0.5) - 0.12 * pit;
          height = 0.3 + 0.22 * glaze - 0.1 * pit;
          roughness += 0.14 * (1 - glaze) + 0.05 * (g1 - 0.5);
          occlusion = 1 - 0.4 * pit - 0.12 * (1 - glaze);
          return;
        };
      case 'brownie':
        return () => {
          // Coarse fudge cracks and walnut chunks break the baked top.
          const w1 = noise(u, v, 3, 3, seed ^ 0x1b7e) - 0.5,
            w2 = noise(u, v, 3, 3, seed ^ 0x2c8f) - 0.5;
          const x = 7 * u + 0.5 * w1,
            y = 7 * v + 0.5 * w2;
          const cxr = smooth(
              clamp((0.1 - (0.5 - Math.abs(fract(x) - 0.5))) / 0.05),
            ),
            cyr = smooth(
              clamp((0.1 - (0.5 - Math.abs(fract(y) - 0.5))) / 0.05),
            );
          const crack = cxr + cyr - cxr * cyr;
          let nut = 0;
          for (const [nu, nv] of [
            [0.22, 0.3],
            [0.62, 0.58],
            [0.42, 0.82],
          ] as const) {
            const du = fract(u - nu + 0.5) - 0.5,
              dv = fract(v - nv + 0.5) - 0.5;
            const q = (du * du + dv * dv) / (0.06 * 0.06);
            const bump = q < 1 ? (1 - q) * (1 - q) : 0;
            nut += bump - nut * bump;
          }
          const grain = noise(u, v, 40, 40, seed ^ 0x3d90);
          color = 0.34 - 0.16 * crack + 0.3 * nut + 0.08 * (grain - 0.5);
          height = 0.36 - 0.14 * crack + 0.2 * nut + 0.04 * (grain - 0.5);
          roughness += 0.06 * (grain - 0.5) + 0.08 * crack - 0.1 * nut;
          occlusion = 1 - 0.4 * crack - 0.1 * (1 - nut);
          return;
        };
      case 'soapbar':
        return () => {
          // Rounded bars with beveled shoulders, an embossed oval and fine pores.
          const nx = 2,
            ny = 2;
          const cx = Math.floor(u * nx),
            cy = Math.floor(v * ny);
          const cellX = ((cx % nx) + nx) % nx,
            cellY = ((cy % ny) + ny) % ny;
          const fx = fract(u * nx) - 0.5,
            fy = fract(v * ny) - 0.5;
          const rx = Math.abs(fx) / 0.42,
            ry = Math.abs(fy) / 0.36;
          const d = Math.pow(Math.pow(rx, 4) + Math.pow(ry, 4), 0.25);
          const bar = smooth(clamp((1.12 - d) / 0.22));
          const lift = 0.92 + 0.08 * hash(cellX, cellY, seed ^ 0x61af);
          const ox = fx / 0.16,
            oy = fy / 0.1;
          const oq = ox * ox + oy * oy;
          const emboss = oq < 1 ? (1 - oq) * (1 - oq) : 0;
          const px = fract(u * 40) - 0.5,
            py = fract(v * 40) - 0.5;
          const pq = (px * px + py * py) / (0.07 * 0.07);
          const pore = pq < 1 ? (1 - pq) * (1 - pq) : 0;
          color =
            0.52 +
            0.3 * bar * lift +
            0.1 * emboss -
            0.08 * pore -
            0.14 * (1 - bar);
          height = 0.3 + 0.24 * bar * lift + 0.06 * emboss - 0.05 * pore;
          roughness += 0.1 * (1 - bar) + 0.06 * pore - 0.04 * emboss;
          occlusion = 1 - 0.42 * (1 - bar) - 0.14 * pore;
          return;
        };
      case 'loofah':
        return () => {
          // Crossing wavy strands weave an open sponge network.
          const a = fract((u + 0.16 * Math.sin(Math.PI * 2 * v)) * 6) - 0.5,
            b = fract((v + 0.16 * Math.sin(Math.PI * 2 * u)) * 6) - 0.5;
          const sa = smooth(clamp((0.16 - Math.abs(a)) / 0.12)),
            sb = smooth(clamp((0.16 - Math.abs(b)) / 0.12));
          const weave = sa + sb - sa * sb;
          const fiber = noise(u, v, 48, 48, seed ^ 0x48c1);
          color = 0.46 + 0.32 * weave + 0.12 * (fiber - 0.5);
          height = 0.28 + 0.3 * weave + 0.05 * (fiber - 0.5);
          roughness += 0.12 * (fiber - 0.5) - 0.06 * weave;
          occlusion = 1 - 0.46 * (1 - weave);
          return;
        };
      case 'scrubbypad':
        return () => {
          // Abrasive speckle surrounds recessed hexagonal cut-outs.
          const row = Math.floor(v * 8);
          const rowW = ((row % 2) + 2) % 2;
          const x = u * 8 + 0.5 * rowW;
          const fx = fract(x) - 0.5,
            fy = fract(v * 8) - 0.5;
          const hexDist = Math.max(Math.abs(fx) * 1.15, Math.abs(fy));
          const hole = smooth(clamp((0.34 - hexDist) / 0.06));
          const speck = noise(u, v, 64, 64, seed ^ 0x7712);
          color = 0.5 + 0.26 * (1 - hole) + 0.16 * (speck - 0.5) - 0.18 * hole;
          height = 0.32 + 0.2 * (1 - hole) - 0.22 * hole + 0.05 * (speck - 0.5);
          roughness += 0.14 * (speck - 0.5) + 0.1 * hole;
          occlusion = 1 - 0.5 * hole;
          return;
        };
      case 'orangeflesh':
        return () => {
          // Radial juice segments meet at recessed pith under a raised rind ring.
          const du = fract(u) - 0.5,
            dv = fract(v) - 0.5;
          const r = Math.hypot(du, dv);
          const theta = Math.atan2(dv, du);
          const body = smooth(clamp((0.46 - r) / 0.03));
          const rind =
            smooth(clamp((0.45 - r) / 0.03)) - smooth(clamp((0.38 - r) / 0.03));
          const inner = smooth(clamp((0.38 - r) / 0.03));
          const hub = smooth(clamp((r - 0.05) / 0.04));
          const pith =
            smooth(clamp((0.09 - Math.abs(Math.sin(5 * theta))) / 0.05)) *
            inner *
            hub;
          const vesicle = 0.5 + 0.5 * Math.sin(48 * theta + r * 72);
          const grain = noise(u, v, 40, 40, seed ^ 0x31c7);
          color =
            0.34 +
            0.3 * body +
            0.16 * rind +
            0.12 * vesicle * inner * hub -
            0.18 * pith +
            0.05 * (grain - 0.5);
          height =
            0.24 +
            0.24 * body +
            0.12 * rind +
            0.06 * vesicle * inner * hub -
            0.12 * pith;
          roughness +=
            0.06 * (grain - 0.5) + 0.12 * pith - 0.06 * vesicle * inner * hub;
          occlusion = 1 - 0.44 * (1 - body) - 0.4 * pith;
          return;
        };
      case 'kiwiflesh':
        return () => {
          // Pale core with a ring of dark seeds and radiating fibers.
          const du = fract(u) - 0.5,
            dv = fract(v) - 0.5;
          const r = Math.hypot(du, dv);
          const theta = Math.atan2(dv, du);
          const body = smooth(clamp((0.46 - r) / 0.03));
          const rind =
            smooth(clamp((0.45 - r) / 0.03)) - smooth(clamp((0.38 - r) / 0.03));
          const core = smooth(clamp((0.1 - r) / 0.04));
          const hub = smooth(clamp((r - 0.08) / 0.04));
          const inner = smooth(clamp((0.38 - r) / 0.03));
          const ring = smooth(clamp((0.06 - Math.abs(r - 0.2)) / 0.03));
          const seedSpot = (0.5 + 0.5 * Math.cos(16 * theta)) * ring;
          const fiber =
            (0.5 + 0.5 * Math.sin(56 * theta + r * 48)) * hub * inner;
          const grain = noise(u, v, 40, 40, seed ^ 0x55aa);
          color =
            0.38 +
            0.26 * body +
            0.18 * core -
            0.26 * seedSpot +
            0.08 * fiber +
            0.05 * (grain - 0.5);
          height =
            0.26 +
            0.24 * body +
            0.08 * core +
            0.08 * seedSpot +
            0.04 * fiber +
            0.1 * rind;
          roughness +=
            0.06 * (grain - 0.5) -
            0.08 * seedSpot -
            0.06 * core +
            0.08 * (1 - body);
          occlusion = 1 - 0.44 * (1 - body) - 0.18 * seedSpot;
          return;
        };
      case 'avocadoflesh':
        return () => {
          // Buttery smooth flesh cradles an elliptical pit recess.
          const du = fract(u) - 0.5,
            dv = fract(v) - 0.5;
          const r = Math.hypot(du, dv);
          const body = smooth(clamp((0.46 - r) / 0.03));
          const rind =
            smooth(clamp((0.45 - r) / 0.03)) - smooth(clamp((0.39 - r) / 0.03));
          const pq = (du / 0.15) * (du / 0.15) + (dv / 0.19) * (dv / 0.19);
          const pit = pq < 1 ? smooth(clamp((1 - pq) / 0.22)) : 0;
          const swirl = noise(u, v, 12, 12, seed ^ 0x66c3);
          const grain = noise(u, v, 48, 48, seed ^ 0x22db);
          color =
            0.36 +
            0.3 * body +
            0.14 * rind -
            0.2 * pit +
            0.08 * (swirl - 0.5) +
            0.04 * (grain - 0.5);
          height = 0.26 + 0.26 * body + 0.12 * rind - 0.22 * pit;
          roughness +=
            0.06 * (grain - 0.5) + 0.14 * pit - 0.06 * (1 - pit) * body;
          occlusion = 1 - 0.44 * (1 - body) - 0.38 * pit;
          return;
        };
      case 'turquoise': {
        const phaseA = TAU * hash(0, 0, seed ^ 0x31a5);
        const phaseB = TAU * hash(0, 0, seed ^ 0x5b72);
        const phaseC = TAU * hash(0, 0, seed ^ 0x9e17);
        return () => {
          // Dark spiderweb matrix veins run through polished turquoise stone.
          const a =
            Math.sin(TAU * (3 * u + v) + phaseA) +
            0.35 * Math.sin(TAU * 2 * u + phaseB);
          const b =
            Math.sin(TAU * (u - 2 * v) + phaseB) +
            0.3 * Math.sin(TAU * 3 * v + phaseA);
          const c = Math.sin(TAU * (2 * u + 3 * v) + phaseC);
          const vA = smooth(clamp(1 - (a / 0.1) * (a / 0.1)));
          const vB = smooth(clamp(1 - (b / 0.085) * (b / 0.085)));
          const vC = smooth(clamp(1 - (c / 0.075) * (c / 0.075)));
          const matrix = clamp(0.55 * vA + 0.5 * vB + 0.35 * vC);
          const grain = noise(u, v, 32, 32, seed ^ 0x47e1);
          color = 0.82 * (1 - matrix) + 0.14 * matrix + 0.05 * (grain - 0.5);
          height = 0.52 * (1 - matrix) + 0.44 * matrix + 0.008 * (grain - 0.5);
          roughness += 0.22 * matrix + 0.03 * (grain - 0.5);
          occlusion = 1 - 0.22 * matrix;
          return;
        };
      }
      case 'rhodonite': {
        const phaseA = TAU * hash(0, 0, seed ^ 0x12a9);
        const phaseB = TAU * hash(0, 0, seed ^ 0x73b4);
        return () => {
          // Rose-pink stone with dark branching manganese oxide dendrites.
          const warp = noise(u, v, 4, 4, seed ^ 0x38d2);
          const uw = u + 0.06 * (warp - 0.5);
          const vw = v + 0.06 * (warp - 0.5);
          const d1 =
            Math.sin(TAU * (4 * uw + vw) + phaseA) +
            0.35 * Math.sin(TAU * 3 * vw + phaseB);
          const d2 = Math.sin(TAU * (2 * uw - 3 * vw) + phaseB);
          const vein =
            smooth(clamp(1 - (d1 / 0.11) * (d1 / 0.11))) *
            smooth(clamp(1 - (d2 / 0.14) * (d2 / 0.14)));
          const blotch = smooth(
            clamp((noise(u, v, 8, 8, seed ^ 0x8a5b) - 0.58) / 0.22),
          );
          const mn = clamp(vein * 1.5 + 0.75 * blotch);
          const grain = noise(u, v, 40, 40, seed ^ 0x61f3);
          color = 0.84 * (1 - mn) + 0.12 * mn + 0.04 * (grain - 0.5);
          height = 0.52 * (1 - mn) + 0.45 * mn + 0.006 * (grain - 0.5);
          roughness += 0.18 * mn + 0.02 * (grain - 0.5);
          occlusion = 1 - 0.18 * mn;
          return;
        };
      }
      case 'tigereye': {
        const phaseA = TAU * hash(0, 0, seed ^ 0x27f5);
        const phaseB = TAU * hash(0, 0, seed ^ 0x6e91);
        return () => {
          // Silky chatoyant golden-brown and dark amber fibrous bands.
          const warp = noise(u, v, 4, 8, seed ^ 0x5a31);
          const y =
            v * 6 + 0.35 * Math.sin(TAU * u + phaseA) + 0.25 * (warp - 0.5);
          const band = 0.5 + 0.5 * Math.sin(TAU * y);
          const band2 = 0.5 + 0.5 * Math.cos(TAU * 2 * y + phaseB);
          const chatoyancy = 0.65 * band + 0.35 * band2;
          const fiber = noise(u * 64, v * 8, 64, 8, seed ^ 0x82d4);
          color = 0.25 + 0.65 * chatoyancy + 0.08 * (fiber - 0.5);
          height = 0.48 + 0.04 * chatoyancy + 0.005 * (fiber - 0.5);
          roughness += 0.05 * (1 - chatoyancy) + 0.02 * (fiber - 0.5);
          occlusion = 0.98 + 0.02 * chatoyancy;
          return;
        };
      }
      case 'morel':
        return () => {
          const p = morelPreset,
            x = u * p.columns,
            y = v * p.rows,
            column = Math.floor(x),
            row = Math.floor(y),
            grain = fungalGrain!(u, v);
          let total = 0,
            squared = 0;
          for (let oy = -2; oy <= 2; oy++)
            for (let ox = -2; ox <= 2; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset =
                  (((cy + p.rows) % p.rows) * p.columns +
                    ((cx + p.columns) % p.columns)) *
                  5,
                dx = x - cx - morelChambers![offset],
                dy = y - cy - morelChambers![offset + 1],
                a =
                  dx * morelChambers![offset + 2] +
                  dy * morelChambers![offset + 4],
                b = dy * morelChambers![offset + 3],
                q = a * a + b * b;
              if (q >= 1) continue;
              const weight = (1 - q) ** p.weightPower;
              total += weight;
              squared += weight * weight;
            }
          // Smooth competition, not a nearest-feature min: equal owners and
          // triple junctions retain common derivatives. Compact weights vanish
          // to order 12 at their real supports; the denominator stays positive.
          const dominance = squared / (total * total),
            bowl = smooth(clamp((dominance - 0.48) / 0.48));
          color = 0.8 - 0.6 * bowl + 0.025 * grain;
          height = 0.64 - 0.48 * bowl + 0.006 * grain;
          occlusion = 0.98 - 0.4 * bowl;
          roughness += 0.035 * bowl + 0.012 * (grain - 0.5);
          return;
        };
      case 'mushroomgills':
      case 'bracketfungus':
        return () => {
          const x = u * fanPreset.cells,
            y = v * fanPreset.cells,
            column = Math.floor(x),
            row = Math.floor(y),
            grain = fungalGrain!(u, v);
          color = 0.3 + 0.025 * grain;
          height = 0.13 + 0.004 * grain;
          occlusion = 0.66;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset =
                  (((cy + fanPreset.cells) % fanPreset.cells) *
                    fanPreset.cells +
                    ((cx + fanPreset.cells) % fanPreset.cells)) *
                  7,
                dx = x - cx - fungalFans![offset],
                dy = y - cy - fungalFans![offset + 1],
                cosine = fungalFans![offset + 2],
                sine = fungalFans![offset + 3],
                a = dx * cosine + dy * sine,
                b = dy * cosine - dx * sine + 0.55,
                q = a * a + b * b;
              if (q <= 0.025 || q >= 2.21 || b <= 0 || b * b <= 0.04 * q)
                continue;
              const radius = Math.sqrt(q),
                angle = Math.atan2(a, b),
                p = fungalFans![offset + 4],
                attachment = smooth(clamp((q - 0.025) / 0.065)),
                fan = smooth(clamp((b / radius - 0.2) / 0.25));
              let coverage: number,
                relief: number,
                pigment: number,
                exposure: number,
                finish: number;
              if (kind === 'mushroomgills') {
                const g = proceduralMaterialPresets.mushroomgills,
                  wave =
                    0.5 +
                    0.5 *
                      Math.cos(
                        g.blades * angle + 0.5 * Math.sin(5 * radius + p),
                      ),
                  long = wave ** g.bladePower,
                  short =
                    (1 - wave) ** g.bladePower *
                    smooth(
                      clamp(
                        (radius - g.shortStart) / (g.shortEnd - g.shortStart),
                      ),
                    ),
                  blades = (long + short) * fungalFans![offset + 6],
                  rim = 1 - smooth(clamp((radius - 1.22) / 0.2));
                coverage = attachment * fan * rim;
                relief = 0.2 + 0.22 * blades + 0.005 * grain;
                pigment = 0.25 + 0.51 * blades + 0.08 * fungalFans![offset + 5];
                exposure = 0.63 + 0.33 * blades;
                finish =
                  preset.roughness - 0.035 * blades + 0.012 * (grain - 0.5);
              } else {
                const f = proceduralMaterialPresets.bracketfungus,
                  front =
                    radius *
                    (1 +
                      f.lobe * Math.cos(5 * angle + p) +
                      0.035 * Math.cos(9 * angle - p));
                if (front >= 1.35) continue;
                const edge = 1 - smooth(clamp((front - 1.27) / 0.08)),
                  margin = smooth(
                    clamp(
                      (front - f.marginStart) / (f.marginEnd - f.marginStart),
                    ),
                  ),
                  zones =
                    0.5 +
                    0.5 *
                      Math.cos(
                        TAU * f.zones * front + p + 0.2 * Math.sin(3 * angle),
                      ),
                  tone = fungalFans![offset + 5],
                  velvet = (grain - 0.5) * fungalFans![offset + 6];
                coverage = attachment * fan * edge;
                relief = 0.47 - 0.045 * front + 0.009 * velvet;
                pigment =
                  (0.22 + 0.48 * zones + 0.12 * tone) * (1 - margin) +
                  0.94 * margin +
                  0.018 * velvet;
                exposure = 0.97;
                finish = preset.roughness + 0.025 * velvet - 0.045 * margin;
              }
              // An opaque face replaces every lower channel, including the
              // previous rim's shadow. Stable unwrapped row order only changes
              // when a zero-support neighbor enters/leaves the lookup.
              color += coverage * (pigment - color);
              height += coverage * (relief - height);
              occlusion += coverage * (exposure - occlusion);
              roughness += coverage * (finish - roughness);
            }
          return;
        };
      case 'tactilepaving':
        return () => {
          const p = proceduralMaterialPresets.tactilepaving,
            grain = municipalGrain!(u, v),
            tone = pavingTone!(u, v),
            tx = Math.abs(fract(u * p.tiles) - 0.5),
            ty = Math.abs(fract(v * p.tiles) - 0.5),
            tile =
              (1 -
                smooth(
                  clamp((tx - p.jointInner) / (p.jointOuter - p.jointInner)),
                )) *
              (1 -
                smooth(
                  clamp((ty - p.jointInner) / (p.jointOuter - p.jointInner)),
                )),
            dx = fract(u * p.domes) - 0.5,
            dy = fract(v * p.domes) - 0.5,
            dome =
              1 -
              smooth(
                clamp(
                  (dx * dx + dy * dy - p.domeInner * p.domeInner) /
                    (p.domeOuter * p.domeOuter - p.domeInner * p.domeInner),
                ),
              );
          // Radius .34 < .5: the one owner cell contains the full dome support.
          // Squared radius is smooth at its center; tile joins lie in flat gaps.
          color =
            0.22 + 0.4 * tile + 0.08 * tile * dome + 0.06 * grain + 0.05 * tone;
          height = 0.12 + tile * (0.12 + 0.56 * dome) + 0.008 * grain;
          roughness = p.roughness + 0.06 * (grain - 0.5) - 0.025 * dome * tile;
          occlusion = 0.72 + 0.22 * tile + 0.06 * tile * dome;
          return;
        };
      case 'roadmarking':
        return () => {
          const p = proceduralMaterialPresets.roadmarking,
            grain = municipalGrain!(u, v),
            distance = Math.abs(fract(u * p.bands) - 0.5),
            band =
              1 -
              smooth(
                clamp((distance - p.bandInner) / (p.bandOuter - p.bandInner)),
              ),
            survival = smooth(
              clamp(
                (paintWear!(u, v) - p.wearInner) / (p.wearOuter - p.wearInner),
              ),
            ),
            paint = band * survival,
            substrateColor = 0.04 + 0.12 * grain,
            substrateHeight = 0.17 + 0.07 * grain;
          // Convex opaque ownership removes buried asphalt relief on intact paint.
          color =
            substrateColor + paint * (0.82 + 0.1 * grain - substrateColor);
          height =
            substrateHeight + paint * (0.32 + 0.008 * grain - substrateHeight);
          roughness = p.roughness - 0.25 * paint + 0.04 * (grain - 0.5);
          occlusion = 0.91 + 0.09 * paint;
          return;
        };
      case 'draincover':
        return () => {
          const p = proceduralMaterialPresets.draincover,
            grain = municipalGrain!(u, v),
            x = Math.abs(u - 0.5),
            y = Math.abs(v - 0.5),
            cover =
              (1 -
                smooth(
                  clamp((x - p.frameInnerX) / (p.frameOuterX - p.frameInnerX)),
                )) *
              (1 -
                smooth(
                  clamp((y - p.frameInnerY) / (p.frameOuterY - p.frameInnerY)),
                )),
            brace =
              1 -
              smooth(clamp((y - p.braceInner) / (p.braceOuter - p.braceInner))),
            end = Math.max(0, y - p.slotHalfLength);
          let slots = 0;
          // Enumerate all six disjoint capsules (.084 width < .14 spacing).
          // Their full supports fit inside the frame; no lookup truncates an end.
          for (let i = 0; i < p.slots; i++) {
            const dx = u - p.slotStart - i * p.slotSpacing;
            slots +=
              1 -
              smooth(
                clamp(
                  (dx * dx + end * end - p.slotInner * p.slotInner) /
                    (p.slotOuter * p.slotOuter - p.slotInner * p.slotInner),
                ),
              );
          }
          // The squared positive part is C1 where straight sides meet end caps.
          // Brace ownership suppresses lower slot shading on the upper iron face.
          const face = cover * (1 - slots * (1 - brace));
          color = 0.035 + 0.045 * grain + face * (0.52 + 0.08 * grain);
          height = 0.1 + 0.012 * grain + 0.72 * face;
          roughness = p.roughness + 0.2 * (1 - face) + 0.06 * (grain - 0.5);
          occlusion = 0.25 + 0.75 * face;
          metallic = face;
          return;
        };
      case 'birchbark':
      case 'palmtrunk':
      case 'sycamorebark':
        return () => {
          const grain = treeGrain!(u, v),
            cloud = treeCloud ? treeCloud(u, v) : 0;
          if (kind === 'palmtrunk') {
            const fibers = palmFibers!(u, v),
              row = Math.floor(v * 9);
            let scars = 0,
              shoulders = 0;
            for (let i = row - 1; i <= row; i++) {
              const offset = ((i + 9) % 9) * 4,
                center =
                  palmScars![offset] +
                  0.006 * Math.sin(TAU * u + palmScars![offset + 2]) +
                  0.003 * Math.sin(3 * TAU * u + palmScars![offset + 2]),
                dy = fract(v - center + 0.5) - 0.5,
                q = dy / palmScars![offset + 1],
                lip = (dy - 0.018) / 0.013,
                recess = Math.max(0, 1 - q * q),
                shoulder = Math.max(0, 1 - lip * lip);
              scars += recess * recess * palmScars![offset + 3];
              shoulders += shoulder * shoulder * palmScars![offset + 3];
            }
            color =
              0.49 +
              0.17 * cloud +
              0.12 * fibers -
              0.32 * scars +
              0.08 * shoulders;
            height =
              0.36 +
              0.035 * fibers +
              0.012 * grain -
              0.15 * scars +
              0.12 * shoulders;
            roughness += 0.025 * (grain - 0.5) - 0.03 * scars;
            occlusion = 1 - 0.22 * scars;
          } else {
            const x = u * barkColumns,
              y = v * barkRows,
              ix = Math.floor(x),
              iy = Math.floor(y),
              birch = kind === 'birchbark';
            let marks = 0,
              tone = 0.54,
              layer = 0.32,
              edges = 0;
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                const cx = ix + ox,
                  cy = iy + oy,
                  wx = (cx + barkColumns) % barkColumns,
                  wy = (cy + barkRows) % barkRows,
                  offset = (wy * barkColumns + wx) * barkStride,
                  dx = x - cx - barkMarks![offset],
                  dy = y - cy - barkMarks![offset + 1],
                  a = dx / barkMarks![offset + 2],
                  b = dy / barkMarks![offset + 3],
                  quadratic = a * a + b * b,
                  q = birch
                    ? quadratic
                    : quadratic *
                      (1 +
                        0.16 *
                          Math.sin(5 * dx + barkMarks![offset + 4]) *
                          Math.sin(6 * dy - barkMarks![offset + 4]));
                if (q >= 1) continue;
                const face = smooth(clamp((1 - q) / (birch ? 0.75 : 0.24)));
                if (birch) {
                  marks += (1 - marks) * face * barkMarks![offset + 4];
                } else {
                  // Layered compact lobes, not nearest-cell grout or one noise
                  // threshold. A new layer replaces tone and shallow plate height.
                  tone += (barkMarks![offset + 5] - tone) * face;
                  layer +=
                    (0.29 + 0.055 * barkMarks![offset + 5] - layer) * face;
                  // A covering lobe hides the earlier layer's peel rim.
                  edges = (edges + face) * (1 - face);
                }
              }
            if (birch) {
              const seamWave = Math.sin(TAU * (13 * v + 0.12 * cloud)),
                seam = ((1 + seamWave) * 0.5) ** 24;
              color = 0.91 + 0.035 * cloud - 0.79 * marks - 0.035 * seam;
              height = 0.34 + 0.007 * grain - 0.065 * marks - 0.012 * seam;
              roughness += 0.04 * marks + 0.02 * (grain - 0.5);
              occlusion = 1 - 0.2 * marks - 0.025 * seam;
            } else {
              color = tone + 0.025 * (grain - 0.5);
              height = layer + 0.008 * edges + 0.005 * (grain - 0.5);
              roughness += 0.035 * (1 - tone) + 0.015 * (grain - 0.5);
              occlusion = 1 - 0.055 * edges;
            }
          }
          return;
        };
      case 'rosepetal':
      case 'lilypetal':
        return () => {
          const rose = kind === 'rosepetal',
            wander = rose ? petalWander!(u, v) : 0,
            grain = petalGrain!(u, v),
            fold = Math.sin(TAU * (3 * u + 0.22 * Math.sin(TAU * v + phase))),
            rib = rose
              ? 0
              : Math.sin(TAU * (32 * u + 0.16 * Math.sin(TAU * 2 * v + phase))),
            x = petalColumns * u,
            y = petalRows * v,
            ix = Math.floor(x),
            iy = Math.floor(y);
          let marks = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy,
                offset =
                  (((cy + petalRows) % petalRows) * petalColumns +
                    ((cx + petalColumns) % petalColumns)) *
                  8,
                dx = x - cx - petalMarks![offset],
                dy = y - cy - petalMarks![offset + 1],
                across =
                  (dx * petalMarks![offset + 2] +
                    dy * petalMarks![offset + 3]) *
                  petalMarks![offset + 4],
                along =
                  (dy * petalMarks![offset + 2] -
                    dx * petalMarks![offset + 3]) *
                  petalMarks![offset + 5],
                radius = rose
                  ? across * across + along * along
                  : across *
                      across *
                      (1 + petalMarks![offset + 7] * Math.sin(3 * along)) +
                    along * along,
                support = clamp(1 - radius),
                mark = support * support * support * petalMarks![offset + 6];
              marks += rose ? mark : (1 - marks) * mark;
            }
          if (rose) {
            color = 0.48 + 0.16 * fold + 0.08 * wander;
            height = 0.3 + 0.1 * fold + 0.055 * marks;
            roughness += 0.025 * marks + 0.02 * (grain - 0.5);
            occlusion = 0.98;
          } else {
            // Pigment has no relief or AO contribution: dark speckles are not pits.
            color = 0.94 - 0.82 * marks;
            height = 0.3 + 0.025 * fold + 0.012 * rib;
            roughness += 0.025 * marks + 0.012 * (grain - 0.5);
            occlusion = 0.99;
          }
          return;
        };
      case 'fritillarypetal':
        return () => {
          const wander = petalWander!(u, v),
            grain = petalGrain!(u, v),
            across =
              3 * u + 0.085 * Math.sin(TAU * 2 * v + phase) + 0.12 * wander,
            along =
              4 * v + 0.065 * Math.sin(TAU * 2 * u - phase) + 0.1 * wander,
            pigment =
              0.5 +
              0.5 *
                Math.tanh(7 * Math.sin(TAU * across) * Math.sin(TAU * along)),
            rib = Math.sin(TAU * (40 * u + 0.12 * Math.sin(TAU * v + phase)));
          color = 0.12 + 0.8 * pigment;
          // Checker ownership never enters height, roughness or occlusion.
          height =
            0.3 +
            0.014 * rib +
            0.02 * Math.sin(TAU * (2 * u + 0.1 * Math.sin(TAU * v + phase)));
          roughness += 0.014 * (grain - 0.5);
          occlusion = 0.99;
          return;
        };
      case 'cantaloupe':
        return () => {
          const warp = rindWarp!(u, v),
            x = 7 * u + 0.38 * Math.sin(TAU * 3 * v + phase),
            y = 7 * v + 0.34 * Math.sin(TAU * 2 * u - phase),
            ix = Math.floor(x),
            iy = Math.floor(y),
            grain = fruitGrain!(u, v);
          let interior = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy,
                offset = (((cy + 7) % 7) * 7 + ((cx + 7) % 7)) * 26,
                dx = x - cx - rindIslands![offset],
                dy = y - cy - rindIslands![offset + 1];
              let mask =
                smooth(clamp((1.21 - dx * dx) * 5)) *
                smooth(clamp((1.21 - dy * dy) * 5));
              for (let edge = 0; edge < 8; edge++) {
                const plane = offset + 2 + edge * 3,
                  inset =
                    rindIslands![plane + 2] -
                    dx * rindIslands![plane] -
                    dy * rindIslands![plane + 1];
                mask *= smooth(clamp((inset - 0.035) * 6));
              }
              interior += mask;
            }
          const net = 1 - interior;
          color = 0.14 + 0.12 * warp + net * (0.66 + 0.06 * grain);
          height = 0.12 + 0.012 * grain + net * (0.5 + 0.06 * grain);
          roughness += 0.1 * net - 0.03 * interior;
          occlusion = 0.9 + 0.1 * net;
          return;
        };
      case 'dragonfruit':
        return () => {
          const x = 4 * u,
            y = 6 * v,
            ix = Math.floor(x),
            iy = Math.floor(y),
            grain = fruitGrain!(u, v);
          let face = 0,
            tips = 0,
            lifted = 0,
            underlap = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy,
                offset = (((cy + 6) % 6) * 4 + ((cx + 4) % 4)) * 5,
                dx = x - cx - bracts![offset],
                dy = y - cy - bracts![offset + 1],
                a =
                  (dx * bracts![offset + 2] - dy * bracts![offset + 3]) *
                  bractWidthInverse,
                b =
                  (dy * bracts![offset + 2] + dx * bracts![offset + 3]) *
                  bractLengthInverse,
                radius = a * a * (1 + 0.65 * b + 0.2 * b * b) + b * b,
                body = smooth(clamp(1 - radius)),
                pigment = smooth(clamp((1 - radius) * 5)),
                tip = smooth(clamp((b - 0.05) * 2.5)),
                lip = body * smooth(clamp((b + 0.35) * 1.5)),
                shade = (pigment - body) * (1 - tip);
              face += body;
              tips += (1 - tips) * pigment * tip * bracts![offset + 4];
              lifted += lip;
              underlap += shade;
            }
          color = 0.045 + 0.025 * grain + 0.86 * tips;
          height =
            0.16 +
            0.008 * grain +
            0.11 * face +
            0.48 * lifted -
            0.07 * underlap;
          roughness += 0.1 * tips + 0.04 * underlap;
          occlusion = 1 - 0.19 * underlap;
          return;
        };
      case 'kiwiskin':
        return () => {
          const x = 36 * u,
            y = 36 * v,
            ix = Math.floor(x),
            iy = Math.floor(y),
            grain = fruitGrain!(u, v);
          let hairs = 0,
            pits = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy,
                offset = (((cy + 36) % 36) * 36 + ((cx + 36) % 36)) * 5,
                dx = x - cx - kiwiHairs![offset],
                dy = y - cy - kiwiHairs![offset + 1],
                along =
                  dx * kiwiHairs![offset + 2] + dy * kiwiHairs![offset + 3],
                across =
                  dy * kiwiHairs![offset + 2] - dx * kiwiHairs![offset + 3],
                hair = smooth(
                  clamp(
                    1 -
                      along * along * hairLengthSquaredInverse -
                      across * across * hairWidthSquaredInverse,
                  ),
                ),
                root = along + 0.43,
                pit = smooth(
                  clamp(
                    1 -
                      (root * root + across * across) * follicleSquaredInverse,
                  ),
                );
              hairs += (1 - hairs) * hair * kiwiHairs![offset + 4];
              pits += (1 - pits) * pit;
            }
          color = 0.34 + 0.13 * grain + 0.38 * hairs - 0.19 * pits;
          height = 0.15 + 0.016 * grain + 0.23 * hairs - 0.085 * pits;
          roughness += 0.055 * hairs - 0.025 * pits;
          occlusion = 1 - 0.23 * pits;
          return;
        };
      case 'walnutshell':
        return () => {
          // Flowing longitudinal ridges and missing cross-links avoid a lattice.
          const x = u * 7 + 0.8 * (nutWarp!(u, v) - 0.5),
            y = v * 7,
            column = Math.floor(x),
            row = Math.floor(y);
          let ridges = 0;
          for (let oy = -2; oy <= 2; oy++)
            for (let ox = -2; ox <= 2; ox++) {
              const cx = column + ox,
                cy = row + oy,
                cell = (((cy + 7) % 7) * 7 + ((cx + 7) % 7)) * 24;
              for (let branch = 0; branch < 3; branch++) {
                const offset = cell + branch * 8;
                if (!walnutRidges![offset + 7]) continue;
                const dx = x - cx - walnutRidges![offset],
                  dy = y - cy - walnutRidges![offset + 1],
                  cosine = walnutRidges![offset + 2],
                  sine = walnutRidges![offset + 3],
                  a = (dx * cosine + dy * sine) * walnutRidges![offset + 4];
                if (a * a >= 1) continue;
                const across =
                    dy * cosine -
                    dx * sine -
                    walnutRidges![offset + 6] * (1 - a * a),
                  b = across * walnutRidges![offset + 5],
                  ridge =
                    smooth(clamp((1 - a * a) / 0.4)) * smooth(clamp(1 - b * b));
                ridges += ridge;
              }
            }
          const crest = ridges / (0.65 + ridges),
            grain = nutGrain!(u, v);
          color = 0.13 + 0.74 * crest + 0.055 * grain;
          height = 0.13 + 0.75 * crest + 0.012 * grain;
          occlusion = 0.45 + 0.53 * crest;
          roughness += 0.035 * (1 - crest) + 0.012 * (grain - 0.5);
          return;
        };
      case 'peanutshell':
        return () => {
          const x =
              u * 10 +
              0.28 * Math.sin(TAU * v + phase) +
              0.3 * (nutWarp!(u, v) - 0.5),
            y = v * 5,
            column = Math.floor(x),
            row = Math.floor(y),
            rib = smooth(clamp((Math.cos(TAU * x) - 0.6) / 0.4));
          let links = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset = (((cy + 5) % 5) * 10 + ((cx + 10) % 10)) * 3,
                dx = x - cx - 0.5,
                dy = y - cy - peanutLinks![offset],
                a = dx / 0.65,
                b =
                  (dy - peanutLinks![offset + 2] * dx) *
                  peanutLinks![offset + 1],
                q = a * a + b * b;
              if (q < 1) links += smooth(1 - q);
            }
          const cross = links / (0.5 + links),
            grain = nutGrain!(u, v);
          color = 0.5 + 0.22 * rib + 0.12 * cross + 0.045 * grain;
          height = 0.25 + 0.38 * rib + 0.17 * cross + 0.008 * grain;
          occlusion = 0.72 + 0.19 * rib + 0.075 * cross;
          roughness += 0.025 * (1 - rib) + 0.012 * (grain - 0.5);
          return;
        };
      case 'almondshell':
        return () => {
          const x = u * 16,
            y = v * 12,
            column = Math.floor(x),
            row = Math.floor(y);
          let pores = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset = (((cy + 12) % 12) * 16 + ((cx + 16) % 16)) * 7;
              if (!almondPores![offset + 6]) continue;
              const dx = x - cx - almondPores![offset],
                dy = y - cy - almondPores![offset + 1],
                cosine = almondPores![offset + 2],
                sine = almondPores![offset + 3],
                a = (dx * cosine + dy * sine) * almondPores![offset + 4],
                b = (dy * cosine - dx * sine) * almondPores![offset + 5],
                q = a * a + b * b;
              if (q < 1) pores += smooth(1 - q);
            }
          const grain = nutGrain!(u, v),
            fiber =
              0.5 +
              0.5 * Math.cos(TAU * 43 * u + 0.35 * Math.sin(TAU * v + phase));
          color = 0.76 - 0.45 * pores + 0.035 * grain + 0.018 * fiber;
          height = 0.62 - 0.33 * pores + 0.006 * grain + 0.004 * fiber;
          occlusion = 0.98 - 0.38 * pores;
          roughness += 0.035 * pores + 0.012 * (grain - 0.5);
          return;
        };
      case 'scallopshell':
      case 'oystershell':
      case 'nautilusshell':
        return () => {
          const x = u * shellCells,
            y = v * shellCells,
            column = Math.floor(x),
            row = Math.floor(y),
            grain = shellGrain!(u, v);
          color = 0.28 + 0.035 * grain;
          height = 0.12 + 0.004 * grain;
          occlusion = 0.76;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset =
                  (((cy + shellCells) % shellCells) * shellCells +
                    ((cx + shellCells) % shellCells)) *
                  8,
                dx = x - cx - shellFaces![offset],
                dy = y - cy - shellFaces![offset + 1],
                cosine = shellFaces![offset + 2],
                sine = shellFaces![offset + 3],
                a = (dx * cosine + dy * sine) * shellFaces![offset + 4],
                b = (dy * cosine - dx * sine) * shellFaces![offset + 5],
                p = shellFaces![offset + 6];
              let face: number,
                relief: number,
                pigment: number,
                exposure: number,
                polish: number;
              if (kind === 'scallopshell') {
                const along = b + 0.6,
                  q = a * a + along * along;
                if (q <= 0.015 || q >= 1.8225 || along <= 0) continue;
                const radius = Math.sqrt(q),
                  angle = Math.atan2(a, along),
                  // The hinge has an open zero neighborhood: no directional
                  // limit survives there, even on atan2's branch cut.
                  hinge = smooth(clamp((q - 0.015) * 16)),
                  fan = smooth(clamp((Math.cos(angle) - 0.55) * 5)),
                  rim = 1 - smooth(clamp((radius - 1.15) * 5)),
                  rib = 0.5 + 0.5 * Math.cos(18 * angle),
                  growth = 0.5 + 0.5 * Math.cos(44 * radius + p);
                face = hinge * fan * rim;
                relief = 0.29 + 0.25 * rib + 0.025 * growth;
                pigment = 0.48 + 0.25 * rib + 0.065 * growth;
                exposure = 0.8 + 0.17 * rib;
                polish = -0.05 * rib;
              } else if (kind === 'oystershell') {
                // Off-center, Cartesian lobing deforms nested growth fronts.
                // Each lamina has a lifted inner lip and a shadowed outer recess,
                // not a symmetric sinusoidal corrugation or rectangular strip.
                const warped = a + 0.16 * b * b,
                  q =
                    (warped * warped + b * b) *
                    (1 + 0.13 * Math.sin(5 * a + p) * Math.sin(4 * b - p));
                if (q >= 1) continue;
                face = 1 - smooth(clamp((q - 0.78) * (1 / 0.22)));
                relief = 0.25;
                pigment = shellFaces![offset + 7];
                exposure = 0.96;
                for (let layer = 0; layer < 5; layer++) {
                  const front = 0.9 - layer * 0.155,
                    distance = q - front,
                    terrace = 1 - smooth(clamp((distance + 0.025) * 20)),
                    lip = Math.exp(-1800 * (distance + 0.045) ** 2),
                    recess = Math.exp(-1800 * (distance - 0.035) ** 2);
                  relief += 0.065 * terrace + 0.075 * lip - 0.035 * recess;
                  pigment += 0.035 * terrace + 0.1 * lip - 0.14 * recess;
                  exposure -= 0.12 * recess;
                }
                relief += 0.018 * (grain - 0.5);
                pigment += 0.12 * (grain - 0.5);
                polish = 0.045 * (grain - 0.5);
              } else {
                const q = a * a + b * b;
                if (q >= 1) continue;
                const radius = Math.sqrt(q),
                  angle = Math.atan2(b, a),
                  center = smooth(clamp((q - 0.01) * 12)),
                  // Integer angular harmonics make both sides of atan2's cut
                  // identical. Radial phase winds the coil and bends chambers.
                  coil = 0.5 + 0.5 * Math.cos(6 * Math.PI * radius - angle + p),
                  chamber = 0.5 + 0.5 * Math.cos(18 * angle - 13 * radius + p),
                  stripe = chamber ** 4;
                face = 1 - smooth(clamp((q - 0.75) * 4));
                relief = 0.35 + center * (0.15 * coil + 0.025 * chamber);
                pigment = 0.87 - center * (0.52 * stripe + 0.13 * (1 - coil));
                exposure = 0.97 - 0.15 * center * (1 - coil);
                polish = -0.045 * center * coil;
              }
              height += face * (relief - height);
              color += face * (pigment - color);
              occlusion += face * (exposure - occlusion);
              roughness += face * (preset.roughness + polish - roughness);
            }
          return;
        };
      case 'zebrafur':
      case 'leopardfur':
      case 'giraffefur':
      case 'cowhide':
        return () => {
          const warp = furWarp!(u, v),
            grain = furGrain!(u, v),
            fx = u * 40,
            fy = v * 32,
            column = Math.floor(fx),
            row = Math.floor(fy);
          let fibers = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset = (((cy + 32) % 32) * 40 + ((cx + 40) % 40)) * 4,
                dx = fx - cx - furFibers![offset],
                dy = fy - cy - furFibers![offset + 1],
                along =
                  (dx * furFibers![offset + 2] + dy * furFibers![offset + 3]) /
                  0.58,
                across =
                  (dy * furFibers![offset + 2] - dx * furFibers![offset + 3]) /
                  0.13,
                hair = smooth(clamp(1 - along * along - across * across));
              fibers += (1 - fibers) * hair;
            }
          if (kind === 'cowhide') {
            const p = proceduralMaterialPresets.cowhide,
              pigment = (1 - p.warpMix) * cowPatches!(u, v) + p.warpMix * warp;
            color =
              0.04 +
              0.92 *
                smooth(clamp((pigment - p.patchLow) * inverseCowTransition));
          } else if (kind === 'zebrafur') {
            const bend =
                0.42 * Math.sin(TAU * 2 * v + phase) + 0.75 * (warp - 0.5),
              carrier = TAU * (8 * u + bend),
              // A subharmonic crossing unit amplitude changes the number of
              // stripes: paired bands genuinely join, rather than just waving.
              branching = 1.65 * Math.sin(TAU * 2 * v - phase),
              pigment =
                Math.cos(carrier) +
                branching *
                  Math.cos(carrier * 0.5 + 0.3 * Math.sin(TAU * v + phase));
            color =
              0.025 +
              0.94 *
                smooth(clamp((pigment + 0.13 + 0.16 * (warp - 0.5)) / 0.26));
          } else if (kind === 'leopardfur') {
            const x = 5 * u + 0.12 * Math.sin(TAU * 3 * v + phase),
              y = 5 * v + 0.12 * Math.sin(TAU * 2 * u - phase),
              ix = Math.floor(x),
              iy = Math.floor(y);
            let rings = 0,
              centers = 0;
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                const cx = ix + ox,
                  cy = iy + oy,
                  offset = (((cy + 5) % 5) * 5 + ((cx + 5) % 5)) * 7,
                  dx = x - cx - rosettes![offset],
                  dy = y - cy - rosettes![offset + 1],
                  a =
                    (dx * rosettes![offset + 2] + dy * rosettes![offset + 3]) *
                    rosettes![offset + 4],
                  b =
                    (dy * rosettes![offset + 2] - dx * rosettes![offset + 3]) *
                    rosettes![offset + 5],
                  // Bounded Cartesian lobing stays regular at the center and
                  // keeps the entire support within 0.53 cell units.
                  squared = a * a + b * b,
                  radius =
                    squared * (1 + (0.18 * a * b + 0.16 * a) / (1 + squared)),
                  outer = 1 - smooth(clamp((radius - 0.72) / 0.28)),
                  inner = smooth(clamp((radius - 0.25) / 0.2)),
                  gap =
                    smooth(clamp((a - 0.35) / 0.28)) *
                    (1 - smooth(clamp((b * b - 0.025) / 0.12))),
                  secondGap =
                    smooth(clamp((-b - 0.48) / 0.25)) *
                    (1 - smooth(clamp((a * a - 0.015) / 0.065))),
                  ring = outer * inner * (1 - gap) * (1 - secondGap),
                  center = (1 - inner) * (0.65 + 0.25 * rosettes![offset + 6]);
                rings += (1 - rings) * ring;
                centers += (1 - centers) * center * outer;
              }
            color =
              (0.88 - 0.22 * centers + 0.055 * (warp - 0.5)) *
              (1 - 0.96 * rings);
          } else {
            const x = 6 * u + 0.13 * Math.sin(TAU * 2 * v + phase),
              y = 6 * v + 0.13 * Math.sin(TAU * 3 * u - phase),
              ix = Math.floor(x),
              iy = Math.floor(y);
            color = 0.95;
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                const cx = ix + ox,
                  cy = iy + oy,
                  offset = (((cy + 6) % 6) * 6 + ((cx + 6) % 6)) * 27,
                  dx = x - cx - furPatches![offset],
                  dy = y - cy - furPatches![offset + 1];
                // Explicit compact support also makes lookup entry/exit C1.
                let mask =
                  smooth(clamp((1.21 - dx * dx) / 0.21)) *
                  smooth(clamp((1.21 - dy * dy) / 0.21));
                for (let edge = 0; edge < 8; edge++) {
                  const plane = offset + 3 + edge * 3,
                    inset =
                      furPatches![plane + 2] -
                      dx * furPatches![plane] -
                      dy * furPatches![plane + 1];
                  mask *= smooth(clamp((inset - 0.045) / 0.055));
                }
                color +=
                  mask *
                  (0.12 + 0.2 * furPatches![offset + 2] + 0.055 * warp - color);
              }
          }
          color += 0.018 * (fibers - 0.5) + 0.012 * (grain - 0.5);
          height = 0.28 + 0.24 * fibers + 0.035 * grain;
          roughness += 0.07 * (fibers - 0.5) + 0.025 * (grain - 0.5);
          occlusion = 0.985 + 0.012 * fibers;
          return;
        };
      case 'braincoral':
        return () => {
          const x = TAU * u + 0.17 * Math.sin(TAU * v + phase),
            y = TAU * v + 0.17 * Math.sin(TAU * u - phase),
            grain = marineGrain!(u, v);
          let field = 0;
          for (let i = 0; i < 6; i++) {
            const offset = i * 4;
            field +=
              brainModes![offset + 3] *
              Math.sin(
                brainModes![offset] * x +
                  brainModes![offset + 1] * y +
                  brainModes![offset + 2],
              );
          }
          const ridge = Math.exp(-24 * field * field),
            shoulder = Math.exp(-6 * field * field);
          color = 0.13 + 0.55 * ridge + 0.11 * shoulder + 0.04 * grain;
          height = 0.16 + 0.43 * ridge + 0.12 * shoulder + 0.009 * grain;
          roughness += 0.06 * (1 - ridge) + 0.015 * (grain - 0.5);
          occlusion = 0.57 + 0.39 * shoulder;
          return;
        };
      case 'starcoral':
        return () => {
          const x = u * 6,
            y = v * 6,
            column = Math.floor(x),
            row = Math.floor(y),
            grain = marineGrain!(u, v);
          color = 0.2 + 0.025 * grain;
          height = 0.16 + 0.006 * grain;
          occlusion = 0.72;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset = (((cy + 6) % 6) * 6 + ((cx + 6) % 6)) * 31,
                dx = x - cx - corallites![offset],
                dy = y - cy - corallites![offset + 1],
                cosine = corallites![offset + 2],
                sine = corallites![offset + 3],
                a = (dx * cosine + dy * sine) * corallites![offset + 4],
                b = (dy * cosine - dx * sine) * corallites![offset + 5],
                q = a * a + b * b;
              if (q >= 1) continue;
              const face = smooth(clamp((1 - q) / 0.25)),
                mouth = Math.exp(-40 * q),
                wall = Math.exp(-45 * (q - 0.65) * (q - 0.65));
              let septa = 0;
              // Cartesian rays start outside the recessed mouth. Neither angular
              // division nor a directional limit occurs at the corallite center.
              for (let ray = 0; ray < 12; ray++) {
                const rx = corallites![offset + 7 + ray * 2],
                  ry = corallites![offset + 8 + ray * 2],
                  along = a * rx + b * ry,
                  across = b * rx - a * ry,
                  rib =
                    smooth(clamp((along - 0.16) / 0.12)) *
                    Math.exp(-700 * across * across);
                septa += (1 - septa) * rib;
              }
              const pigment =
                  0.43 +
                  0.12 * corallites![offset + 6] +
                  0.19 * wall +
                  0.15 * septa -
                  0.27 * mouth,
                relief = 0.29 + 0.18 * wall + 0.16 * septa - 0.19 * mouth;
              color += face * (pigment - color);
              height += face * (relief - height);
              roughness +=
                face * (preset.roughness + 0.055 * mouth - roughness);
              occlusion +=
                face * (0.88 + 0.07 * wall - 0.42 * mouth - occlusion);
            }
          return;
        };
      case 'seasponge':
        return () => {
          // Periodic shears bend the connected skeleton without opening joins or
          // changing its compact-support lookup.
          const warpedU = u + 0.07 * Math.sin(TAU * 3 * v + phase),
            warpedV = v + 0.06 * Math.sin(TAU * 2 * warpedU - phase),
            x = fract(warpedU) * 7,
            y = fract(warpedV) * 7,
            column = Math.floor(x),
            row = Math.floor(y);
          let skeleton = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                cell = ((cy + 7) % 7) * 7 + ((cx + 7) % 7);
              for (let branch = 0; branch < 4; branch++) {
                const offset = (cell * 4 + branch) * 7;
                if (spongeStruts![offset + 6] === 0) continue;
                const dx = x - cx - spongeStruts![offset],
                  dy = y - cy - spongeStruts![offset + 1],
                  cosine = spongeStruts![offset + 2],
                  sine = spongeStruts![offset + 3],
                  a = (dx * cosine + dy * sine) * spongeStruts![offset + 4],
                  b = (dy * cosine - dx * sine) * spongeStruts![offset + 5],
                  q = a * a + b * b;
                if (q >= 1) continue;
                const strut = smooth(clamp((1 - q) / 0.8));
                skeleton += (1 - skeleton) * strut;
              }
            }
          const channelField = spongeChannels!(u, v) - 0.5,
            channels = Math.exp(-110 * channelField * channelField),
            grain = marineGrain!(u, v),
            body = skeleton * (1 - 0.42 * channels);
          color = 0.12 + 0.63 * body + 0.055 * grain;
          height = 0.12 + 0.57 * body + 0.012 * grain * skeleton;
          roughness += 0.035 * (1 - body) + 0.01 * (grain - 0.5);
          occlusion = 0.48 + 0.48 * body;
          return;
        };
      case 'lotusleaf':
      case 'bananaleaf':
      case 'fernleaf':
        return () => {
          const x = u * 3,
            y = v * 3,
            column = Math.floor(x),
            row = Math.floor(y);
          color = 0.12;
          height = 0.08;
          occlusion = 0.68;
          // Every support fits strictly within the 3x3 neighborhood. Ordered
          // convex layers retain C1 ownership at overlaps and wrapped cell edges.
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                offset = (((cy + 3) % 3) * 3 + ((cx + 3) % 3)) * leafStride,
                dx = x - cx - leafSites![offset],
                dy = y - cy - leafSites![offset + 1],
                cosine = leafSites![offset + 2],
                sine = leafSites![offset + 3],
                a = (dx * cosine + dy * sine) * leafSites![offset + 4],
                b = (dy * cosine - dx * sine) * leafSites![offset + 5],
                variation = leafSites![offset + 6];
              let face: number,
                veins = 0,
                crown: number;
              if (kind === 'fernleaf') {
                if (a * a + b * b > 1.5) continue;
                face = smooth(
                  clamp((1 - (a * a) / 0.81 - (b * b) / 0.0016) / 0.35),
                );
                veins = face;
                for (let i = 0; i < 14; i++) {
                  const side = pinnae![i * 3 + 1],
                    t = b * side * pinnae![i * 3 + 2],
                    across = (a - pinnae![i * 3] - 0.3 * b * side) / 0.043,
                    q = (2 * t - 1) * (2 * t - 1) + across * across;
                  if (q >= 1) continue;
                  const pinna = smooth(clamp((1 - q) / 0.35)),
                    midrib = Math.exp(-10 * across * across),
                    fine = Math.pow(
                      0.5 + 0.5 * Math.cos(42 * t - 7 * across),
                      8,
                    ),
                    vein = pinna * (0.78 * midrib + 0.22 * fine);
                  face += (1 - face) * pinna;
                  veins += (1 - veins) * vein;
                }
                crown = face;
              } else {
                const q =
                  a * a +
                  b * b * (kind === 'bananaleaf' ? 1 + 0.45 * a * a : 1);
                if (q >= 1) continue;
                face = smooth(clamp((1 - q) / 0.24));
                crown = (1 - q) * (1 - q);
                if (kind === 'lotusleaf') {
                  // Cartesian rays fade before meeting the attachment: no angle,
                  // radius division or directional limit exists at the center.
                  for (let ray = 0; ray < 12; ray++) {
                    const rx = leafSites![offset + 7 + ray * 2],
                      ry = leafSites![offset + 8 + ray * 2],
                      along = a * rx + b * ry,
                      across = b * rx - a * ry,
                      shaft = smooth(clamp((along - 0.03) / 0.1)),
                      vein = shaft * Math.exp(-900 * across * across);
                    veins += (1 - veins) * vein;
                  }
                  const attachment = Math.exp(-110 * q);
                  veins += (1 - veins) * attachment;
                } else {
                  const midrib = Math.exp(-180 * b * b),
                    // Rounded transverse distance joins oblique parallel side
                    // veins smoothly to both sides of the strong midrib.
                    carrier = Math.cos(
                      TAU * (9 * a - 2.4 * Math.sqrt(b * b + 0.0004)),
                    ),
                    branches =
                      ((b * b) / (b * b + 0.006)) *
                      Math.pow(0.5 + 0.5 * carrier, 8);
                  veins = midrib + (1 - midrib) * 0.7 * branches;
                }
              }
              color += face * (0.5 + 0.18 * variation + 0.12 * veins - color);
              height += face * (0.26 + 0.13 * crown + 0.14 * veins - height);
              roughness +=
                face * (preset.roughness + 0.035 * (1 - veins) - roughness);
              occlusion += face * (0.9 + 0.08 * crown - occlusion);
            }
          return;
        };
      case 'rice':
      case 'sesame':
      case 'coffeebeans':
        return () => {
          const x = u * grainCells,
            y = v * grainCells,
            column = Math.floor(x),
            row = Math.floor(y),
            grain = roastGrain ? roastGrain(u, v) : 0;
          color = kind === 'rice' ? 0.26 : kind === 'sesame' ? 0.19 : 0.12;
          height = 0.08;
          occlusion = 0.57;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                wx = (cx + grainCells) % grainCells,
                wy = (cy + grainCells) % grainCells,
                offset = (wy * grainCells + wx) * 7,
                dx = x - cx - grainSites![offset],
                dy = y - cy - grainSites![offset + 1],
                cosine = grainSites![offset + 2],
                sine = grainSites![offset + 3],
                a = (dx * cosine + dy * sine) * grainSites![offset + 4],
                b = (dy * cosine - dx * sine) * grainSites![offset + 5],
                variation = grainSites![offset + 6];
              let q: number;
              if (kind === 'rice') q = a * a + b * b * (1 + 0.8 * a * a);
              else if (kind === 'sesame') {
                const taper = 1 + 0.65 * a;
                q = a * a + b * b * taper * taper;
              } else q = a * a + b * b * (1 + 0.12 * a);
              if (q >= 1) continue;
              // Polynomial coordinates have no singular radial center. The
              // compact face and every owned detail vanish with zero edge slope.
              const face = smooth(clamp((1 - q) / 0.32)),
                crown = (1 - q) * (1 - q);
              let pigment: number,
                relief: number,
                finish: number,
                shade: number;
              if (kind === 'rice') {
                const striation = 0.5 + 0.5 * Math.cos(14 * b + 0.7 * a * a);
                pigment = 0.75 + 0.16 * variation + 0.035 * striation;
                relief = 0.28 + 0.32 * crown + 0.025 * crown * striation;
                finish = preset.roughness + 0.04 * (1 - crown);
                shade = 0.87 + 0.1 * crown;
              } else if (kind === 'sesame') {
                const keel = Math.exp(-12 * b * b) * crown,
                  fleck =
                    0.5 + 0.5 * Math.sin(17 * a + 5 * b + variation * TAU);
                pigment = 0.58 + 0.2 * variation + 0.07 * keel + 0.025 * fleck;
                relief = 0.24 + 0.2 * crown + 0.23 * keel;
                finish = preset.roughness + 0.05 * (1 - keel);
                shade = 0.86 + 0.11 * crown;
              } else {
                // A curved recessed split cuts the broad crown, not an absolute
                // distance crease; its squared profile stays smooth at the floor.
                const curve = b - 0.16 * Math.sin(2.8 * a + variation - 0.5),
                  split = Math.exp((-curve * curve) / 0.012) * crown,
                  roast = 0.55 * grain + 0.45 * variation;
                pigment = 0.4 + 0.3 * roast + 0.1 * crown - 0.26 * split;
                relief =
                  0.28 + 0.4 * crown - 0.3 * split + 0.018 * grain * crown;
                finish = preset.roughness + 0.11 * roast + 0.1 * split;
                shade = 0.89 + 0.08 * crown - 0.32 * split;
              }
              // Convex layering preserves distinct seed ownership without hard
              // nearest-site changes or saturation kinks where silhouettes overlap.
              color += face * (pigment - color);
              height += face * (relief - height);
              roughness += face * (finish - roughness);
              occlusion += face * (shade - occlusion);
            }
          return;
        };
      case 'malachite':
      case 'agate':
        return () => {
          const columns = kind === 'malachite' ? 3 : 1,
            rows = 3,
            a = TAU * columns * u + mineralPhaseU,
            b = TAU * rows * v + mineralPhaseV,
            x = a + 0.28 * Math.sin(b),
            y = b + 0.18 * Math.sin(a),
            // Analytic contour ownership blends through saddles rather than
            // selecting a nearest growth center. No radial origin is singular.
            // Agate's second harmonic adds growth basins, not only a stretched recolor.
            growth =
              1 -
              0.5 * (Math.cos(x) + Math.cos(y)) +
              (kind === 'agate' ? 0.22 * (1 - Math.cos(2 * x - y)) : 0),
            bands =
              0.5 +
              0.5 *
                Math.cos(TAU * (3 * growth + 0.1 * Math.sin(x) * Math.sin(y))),
            grain = mineralGrain!(u, v);
          color = 0.12 + 0.8 * bands + 0.035 * grain;
          height = 0.48 + 0.07 * bands + 0.002 * grain;
          roughness += 0.045 * (1 - bands) + 0.012 * grain;
          occlusion = 0.985 + 0.015 * bands;
          return;
        };
      case 'lapislazuli':
        return () => {
          const a =
              Math.sin(TAU * (u + v) + mineralPhaseU) +
              0.22 * Math.sin(TAU * 3 * v + mineralPhaseV),
            b =
              Math.sin(TAU * (2 * u - v) + mineralPhaseV) +
              0.18 * Math.sin(TAU * 2 * v + mineralPhaseU),
            veinA = smooth(clamp(1 - (a / 0.1) ** 2)),
            veinB = smooth(clamp(1 - (b / 0.065) ** 2)),
            inclusion = smooth(clamp((calciteGrain!(u, v) - 0.64) / 0.22)),
            // Smooth complement union retains calcite ownership at crossings
            // and fades inclusions into the granular blue dielectric matrix.
            calcite = 1 - (1 - veinA) * (1 - veinB) * (1 - 0.8 * inclusion),
            grain = mineralGrain!(u, v);
          color = 0.1 + 0.12 * grain + 0.76 * calcite;
          height = 0.5 + 0.009 * grain + 0.045 * calcite;
          roughness += 0.04 * grain + 0.13 * calcite;
          occlusion = 0.988 + 0.012 * calcite;
          return;
        };
      case 'basalt':
        return () => {
          const x = u * 6,
            y = v * 8,
            row = Math.floor(y),
            grain = volcanicGrain!(u, v);
          color = 0.08 + 0.035 * grain;
          height = 0.1 + 0.008 * grain;
          occlusion = 0.59;
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy,
              wy = (cy + 8) % 8,
              stagger = (wy % 2) * 0.5,
              column = Math.floor(x - stagger);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                wx = (cx + 6) % 6,
                offset = (wy * 6 + wx) * 4,
                dx = x - cx - stagger - 0.5,
                dy = y - cy - 0.5,
                a = volcanicCells![offset],
                b = volcanicCells![offset + 1],
                c = volcanicCells![offset + 2],
                variation = volcanicCells![offset + 3];
              // Six smooth half-planes multiply through diagonal corners; no
              // nearest-edge selection can introduce a bisector slope cusp.
              const face =
                  smooth(clamp((a - dx) / 0.065)) *
                  smooth(clamp((a + dx) / 0.065)) *
                  smooth(clamp((b - 0.5 * dx - 0.75 * dy) / 0.065)) *
                  smooth(clamp((b + 0.5 * dx + 0.75 * dy) / 0.065)) *
                  smooth(clamp((c + 0.5 * dx - 0.75 * dy) / 0.065)) *
                  smooth(clamp((c - 0.5 * dx + 0.75 * dy) / 0.065)),
                crown = 1 - 0.6 * dx * dx - 0.6 * dy * dy;
              color += face * (0.28 + 0.18 * variation + 0.06 * grain);
              height += face * (0.52 + 0.08 * variation + 0.07 * crown);
              occlusion += 0.4 * face;
            }
          }
          roughness += 0.08 * (1 - occlusion) + 0.025 * (grain - 0.5);
          return;
        };
      case 'scoria':
      case 'obsidian':
        return () => {
          const columns = volcanicColumns,
            x = u * columns,
            y = v * volcanicRows,
            column = Math.floor(x),
            row = Math.floor(y),
            grain = volcanicGrain!(u, v);
          let depression = 0,
            edge = 0,
            pigment = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                wx = (cx + columns) % columns,
                wy = (cy + volcanicRows) % volcanicRows,
                offset = (wy * columns + wx) * 7,
                dx = x - cx - volcanicCells![offset],
                dy = y - cy - volcanicCells![offset + 1],
                cosine = volcanicCells![offset + 4],
                sine = volcanicCells![offset + 5],
                lx = (cosine * dx + sine * dy) / volcanicCells![offset + 2],
                ly = (-sine * dx + cosine * dy) / volcanicCells![offset + 3],
                q = lx * lx + ly * ly;
              if (q >= 1) continue;
              let bowl: number, lip: number;
              if (kind === 'scoria') {
                bowl = smooth(clamp((0.7 - q) / 0.7));
                lip =
                  smooth(clamp((q - 0.42) / 0.18)) *
                  smooth(clamp((1 - q) / 0.2));
              } else {
                bowl = smooth(1 - q);
                // A parabolic fracture front inside a compact elliptical flake:
                // polynomial coordinates avoid angular and radial origin cusps.
                const curve = (lx + 0.36 - 1.2 * ly * ly) / 0.08;
                lip =
                  smooth(clamp(1 - curve * curve)) *
                  smooth(clamp((1 - q) / 0.25));
              }
              // Complement products are bounded smooth unions, even where gas
              // pits or flake scars overlap; hard saturation would kink normals.
              depression += (1 - depression) * bowl;
              edge += (1 - edge) * lip;
              pigment += (1 - pigment) * bowl * volcanicCells![offset + 6];
            }
          if (kind === 'scoria') {
            color =
              0.36 +
              0.09 * grain -
              0.23 * depression +
              0.16 * edge +
              0.04 * pigment;
            height = 0.48 + 0.012 * grain - 0.32 * depression + 0.15 * edge;
            roughness +=
              0.045 * depression - 0.035 * edge + 0.015 * (grain - 0.5);
            occlusion = 0.98 - 0.36 * depression + 0.015 * edge;
          } else {
            color =
              0.15 +
              0.035 * grain +
              0.14 * depression +
              0.28 * edge +
              0.035 * pigment;
            height = 0.5 + 0.003 * grain - 0.2 * depression + 0.1 * edge;
            roughness += 0.08 * depression + 0.1 * edge + 0.012 * grain;
            occlusion = 1 - 0.13 * depression;
          }
          return;
        };
      case 'corrugatedcardboard':
      case 'creasedpaper':
      case 'layeredpaper':
        return () => {
          const grain = pulpGrain!(u * 8, v * 8),
            x = u * 24,
            y = v * 32,
            ix = Math.floor(x),
            iy = Math.floor(y);
          let fibers = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy,
                offset = ((((cy % 4) + 4) % 4) * 3 + (((cx % 3) + 3) % 3)) * 5,
                dx = x - cx - pulpFibers![offset],
                dy = y - cy - pulpFibers![offset + 1],
                along =
                  dx * pulpFibers![offset + 2] + dy * pulpFibers![offset + 3],
                across =
                  dy * pulpFibers![offset + 2] - dx * pulpFibers![offset + 3],
                support = clamp(
                  1 -
                    (along / pulpFibers![offset + 4]) ** 2 -
                    (across / 0.065) ** 2,
                );
              // Add compact fibers, rather than switching nearest-fiber ownership.
              fibers += support * support;
            }
          const pulp = 0.018 * grain + 0.014 * fibers;
          if (kind === 'corrugatedcardboard') {
            const flute = 0.5 + 0.5 * Math.cos(TAU * u * 4);
            color = 0.38 + 0.27 * flute + 0.09 * grain - 0.055 * fibers;
            height = 0.18 + 0.58 * flute + pulp;
            roughness += 0.025 * (grain - 0.5) + 0.015 * fibers;
            occlusion = 0.68 + 0.3 * flute - 0.025 * fibers;
          } else if (kind === 'creasedpaper') {
            const dx = Math.abs(fract(u * 2 + 0.5) - 0.5),
              dy = Math.abs(fract(v * 2 + 0.5) - 0.5),
              rx = clamp(1 - (dx / 0.14) ** 2) ** 2,
              ry = clamp(1 - (dy / 0.14) ** 2) ** 2,
              sx = clamp(1 - ((dx - 0.25) / 0.1) ** 2) ** 2,
              sy = clamp(1 - ((dy - 0.25) / 0.1) ** 2) ** 2,
              ridge = 1 - (1 - rx) * (1 - ry),
              shoulder = (1 - (1 - sx) * (1 - sy)) * (1 - ridge);
            // Product unions bound fold intersections without max/min corner cusps.
            color =
              0.7 +
              0.1 * ridge -
              0.14 * shoulder +
              0.07 * grain -
              0.04 * fibers;
            height = 0.4 + 0.3 * ridge - 0.16 * shoulder + pulp;
            roughness +=
              0.025 * (grain - 0.5) - 0.035 * ridge + 0.025 * shoulder;
            occlusion = 0.98 - 0.19 * shoulder - 0.02 * fibers;
          } else {
            color = 0.5;
            height = 0.2;
            occlusion = 0.98;
            for (let i = 0; i < 8; i++) {
              const cx = 0.25 + (i % 2) * 0.5,
                cy = (Math.floor(i / 2) + 0.5) / 4,
                dx = fract(u - cx + 0.5) - 0.5,
                dy = fract(v - cy + 0.5) - 0.5,
                phase = paperLayers![i * 3 + 2],
                torn =
                  0.008 * Math.sin(TAU * dx * 12 + phase) +
                  0.004 * Math.sin(TAU * dx * 28 - phase),
                mx = smooth(clamp((0.34 - Math.abs(dx)) / 0.025)),
                my = smooth(clamp((0.18 + torn - Math.abs(dy)) / 0.025)),
                mask = mx * my,
                ledge = 4 * my * (1 - my),
                corner = 4 * mx * (1 - mx),
                undercut = ledge * mx + corner * my * (1 - ledge);
              // Fixed ordered alpha ownership is periodic even when a strip wraps.
              height += mask * (paperLayers![i * 3] - height);
              color += mask * (paperLayers![i * 3 + 1] - color);
              occlusion += mask * (0.98 - occlusion);
              height -= 0.035 * undercut;
              color -= 0.075 * undercut;
              occlusion -= 0.18 * undercut;
            }
            height += pulp;
            color += 0.07 * grain - 0.045 * fibers;
            roughness += 0.025 * (grain - 0.5) + 0.015 * fibers;
            occlusion -= 0.02 * fibers;
          }
          return;
        };
      case 'cactus':
        return () => {
          const x = u * 8,
            y = v * 8,
            column = Math.floor(x),
            row = Math.floor(y),
            rib = 0.5 - 0.5 * Math.cos(TAU * x),
            grain = botanicalGrain!(u, v);
          let areoles = 0,
            impressions = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                cy = row + oy,
                wx = (cx + 8) % 8,
                wy = (cy + 8) % 8,
                offset = (wy * 8 + wx) * 18,
                dx = x - cx - 0.5,
                dy = y - cy - 0.5 - botanicalCells![offset + 1];
              if (dx * dx + dy * dy > 0.14) continue;
              const cap = clamp(1 - (dx * dx) / 0.0196 - (dy * dy) / 0.0169),
                length = botanicalCells![offset];
              areoles += cap * cap;
              for (let ray = 0; ray < 8; ray++) {
                const rx = botanicalCells![offset + 2 + ray * 2],
                  ry = botanicalCells![offset + 3 + ray * 2],
                  along = dx * rx + dy * ry,
                  across = dy * rx - dx * ry,
                  shaft =
                    smooth(clamp((along - 0.09) / 0.055)) *
                    smooth(clamp((length - along) / 0.085)),
                  width = clamp(1 - (across * across) / 0.000225);
                impressions += shaft * width * width;
              }
            }
          // Fine radial marks are recessed shading only, never needle geometry.
          color =
            0.2 +
            0.47 * rib +
            0.045 * grain +
            0.18 * areoles -
            0.08 * impressions;
          height =
            0.18 +
            0.49 * rib +
            0.065 * areoles -
            0.025 * impressions +
            0.004 * grain;
          roughness +=
            0.12 * areoles + 0.055 * impressions + 0.025 * (grain - 0.5);
          occlusion = 0.83 + 0.16 * rib - 0.08 * areoles - 0.035 * impressions;
          return;
        };
      case 'pinecone':
        return () => {
          const x = u * 8,
            y = v * 8,
            row = Math.floor(y),
            grain = botanicalGrain!(u, v);
          color = 0.08 + 0.025 * grain;
          height = 0.12;
          occlusion = 0.58;
          // Upper rows cover the roots of lower rows. Four multiplied half-plane
          // shoulders form angular woody faces without min-axis corner cusps.
          for (let oy = 1; oy >= -1; oy--) {
            const cy = row + oy,
              wy = (cy + 8) % 8,
              stagger = (wy % 2) * 0.5,
              column = Math.floor(x - stagger);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                wx = (cx + 8) % 8,
                variation = botanicalCells![wy * 8 + wx],
                dx = x - cx - stagger - 0.5,
                dy = y - cy - 0.5,
                left = smooth(clamp((0.68 + dx - 0.55 * dy) / 0.1)),
                right = smooth(clamp((0.68 - dx - 0.55 * dy) / 0.1)),
                root = smooth(clamp((dy + 0.78) / 0.12)),
                end = smooth(clamp((0.86 - dy) / 0.12)),
                cover = left * right * root * end;
              if (cover === 0) continue;
              const tip = smooth(clamp((dy + 0.05) / 0.76)),
                ridge = smooth(clamp(1 - (dx * dx) / 0.36)),
                fibers = Math.cos(TAU * (19 * dx + 1.8 * dy * dy + variation)),
                relief =
                  0.28 +
                  0.27 * tip +
                  0.075 * ridge +
                  0.018 * variation +
                  0.006 * fibers,
                pigment =
                  0.28 +
                  0.22 * variation +
                  0.18 * tip +
                  0.045 * fibers +
                  0.025 * grain;
              color += cover * (pigment - color);
              height += cover * (relief - height);
              occlusion += cover * (0.97 - occlusion);
            }
          }
          roughness += 0.06 * (1 - occlusion) + 0.025 * (grain - 0.5);
          return;
        };
      case 'corncob':
        return () => {
          const x = u * 12,
            y = v * 8,
            column = Math.floor(x),
            row = Math.floor(y),
            variation = botanicalCells![row * 12 + column],
            dx = (fract(x) - 0.5) / (0.445 + 0.015 * variation),
            dy = (fract(y) - 0.5) / (0.46 + 0.015 * variation),
            cap = clamp(1 - dx * dx * dx * dx - dy * dy),
            face = smooth(clamp(cap / 0.28)),
            crown = smooth(cap),
            grain = botanicalGrain!(u, v);
          // Rounded oblong kernels bulge throughout their faces, not flat bricks.
          color =
            0.13 +
            face * (0.36 + 0.15 * variation + 0.21 * crown + 0.025 * grain);
          height = 0.09 + face * (0.24 + 0.4 * crown + 0.025 * variation);
          roughness +=
            0.14 * (1 - face) - 0.055 * crown + 0.015 * (grain - 0.5);
          occlusion = 0.55 + 0.44 * face;
          return;
        };
      case 'wood':
        return () => {
          const warp = noise(u, v, 4, 2, seed ^ 71);
          const grain =
            0.5 + 0.5 * Math.sin(TAU * (12 * u + 0.65 * warp) + phase);
          const pores = Math.pow(
            0.5 + 0.5 * Math.sin(TAU * (40 * u + warp) + phase),
            12,
          );
          color = clamp(0.22 + 0.6 * grain + 0.16 * detail - 0.2 * pores);
          height = 0.65 * grain + 0.15 * detail - 0.18 * pores;
          roughness += 0.15 * pores + 0.08 * (detail - 0.5);
          occlusion = 1 - 0.15 * pores;
          return;
        };
      case 'brick':
        return () => {
          const row = Math.floor(v * 8);
          const x = fract(u * 4 + (row % 2) * 0.5),
            y = fract(v * 8);
          const edge = Math.min(x, 1 - x, y * 0.5, (1 - y) * 0.5);
          const face = smooth(clamp((edge - 0.014) / 0.045));
          const variation = hash(
            Math.floor(u * 4 + (row % 2) * 0.5) % 4,
            row,
            seed,
          );
          color = 0.25 + 0.42 * variation + 0.2 * detail;
          height = face * (0.75 + 0.15 * detail + 0.1 * fine);
          mortar = 1 - face;
          roughness += 0.09 * mortar + 0.05 * (detail - 0.5);
          occlusion = 0.65 + 0.35 * face;
          return;
        };
      case 'stone':
        return () => {
          const strata = noise(u + 0.12 * broad, v, 8, 8, seed ^ 131);
          color = clamp(0.1 + 0.65 * strata + 0.3 * detail);
          height = 0.65 * strata + 0.25 * detail + 0.1 * fine;
          roughness += 0.1 * (detail - 0.5);
          occlusion = 0.8 + 0.2 * smooth(height);
          return;
        };
      case 'metal':
        return () => {
          const brush = noise(u, v, 4, 64, seed ^ 313);
          const scratch = Math.pow(
            0.5 + 0.5 * Math.sin(TAU * v * 48 + phase),
            16,
          );
          color = 0.4 + 0.38 * brush + 0.12 * broad - 0.1 * scratch;
          height = 0.7 * brush - 0.15 * scratch;
          roughness += 0.18 * brush + 0.08 * scratch;
          occlusion = 1 - 0.04 * scratch;
          return;
        };
      case 'fabric':
        return () => {
          const x = u * 12,
            y = v * 12;
          const warp = Math.pow(Math.sin(Math.PI * fract(x)), 2);
          const weft = Math.pow(Math.sin(Math.PI * fract(y)), 2);
          const over = (Math.floor(x) + Math.floor(y)) % 2 === 0;
          const thread = over
            ? warp * (0.6 + 0.4 * weft)
            : weft * (0.6 + 0.4 * warp);
          const fiber = 0.5 + 0.5 * Math.sin(TAU * (over ? u : v) * 48 + phase);
          color = 0.22 + 0.48 * thread + 0.14 * detail + 0.08 * fiber;
          height = 0.8 * thread + 0.06 * fiber + 0.08 * detail;
          roughness += 0.04 * (detail - 0.5);
          occlusion = 0.68 + 0.32 * thread;
          return;
        };
      case 'marble':
        return () => {
          const warp = noise(u, v, 4, 4, seed ^ 997);
          const vein = Math.exp(
            -Math.abs(Math.sin(TAU * (3 * u + 2 * v + 0.8 * warp) + phase)) *
              16,
          );
          color = clamp(0.9 + 0.1 * broad - 0.85 * vein);
          height = 0.3 * broad - 0.2 * vein + 0.05 * detail;
          roughness += 0.1 * vein + 0.04 * (detail - 0.5);
          occlusion = 1 - 0.06 * vein;
          return;
        };
      case 'concrete':
        return () => {
          const x = fract(u * 3),
            y = fract(v * 3);
          const edge = Math.min(x, 1 - x, y, 1 - y);
          const seam = 1 - smooth(clamp((edge - 0.02) / 0.035));
          const speckle = hash(
            Math.floor(fract(u) * 40),
            Math.floor(fract(v) * 40),
            seed,
          );
          color = 0.28 + 0.5 * speckle * (1 - seam) + 0.12 * detail;
          height = (1 - seam) * (0.65 + 0.25 * speckle) + 0.05 * detail;
          roughness += 0.14 * seam + 0.06 * (speckle - 0.5);
          occlusion = 0.62 + 0.38 * (1 - seam);
          return;
        };
      case 'tiles':
        return () => {
          const n = 5;
          const x = fract(u * n),
            y = fract(v * n);
          const edge = Math.min(x, 1 - x, y, 1 - y);
          const face = smooth(clamp((edge - 0.018) / 0.028));
          const variation = hash(
            Math.floor(u * n) % n,
            Math.floor(v * n) % n,
            seed,
          );
          color = 0.42 + 0.4 * variation + 0.08 * detail;
          height = face * (0.82 + 0.1 * detail);
          mortar = 1 - face;
          roughness += 0.42 * mortar + 0.04 * (detail - 0.5);
          occlusion = 0.58 + 0.42 * face;
          return;
        };
      case 'elephanthide':
        return () => {
          const warp = hideWarp!(u, v),
            grain = skinGrain!(u, v),
            a =
              0.5 +
              0.5 *
                Math.cos(
                  TAU *
                    (5 * u + 0.65 * Math.sin(TAU * 2 * v + phase) + 1.1 * warp),
                ),
            b =
              0.5 +
              0.5 *
                Math.cos(
                  TAU *
                    (4 * v + 0.5 * Math.sin(TAU * 3 * u - phase) - 0.8 * warp),
                ),
            ca = a ** 22,
            cb = b ** 24,
            crease = 1 - (1 - ca) * (1 - cb),
            shoulder = (a ** 7 - ca + b ** 8 - cb) * 0.5,
            fold =
              (0.5 +
                0.5 * Math.cos(TAU * (21 * u + 13 * v + 1.8 * warp) + phase)) **
              16;
          // Negative broad wrinkles, modest rounded shoulders, and subordinate
          // fine folds leave wide flat skin regions instead of raised pebble nets.
          color = 0.65 - 0.4 * crease - 0.055 * fold + 0.035 * grain;
          height =
            0.63 -
            0.39 * crease +
            0.055 * shoulder -
            0.035 * fold +
            0.008 * grain;
          roughness += 0.035 * crease + 0.025 * (grain - 0.5);
          occlusion = 0.98 - 0.23 * crease - 0.025 * fold;
          return;
        };
      case 'ostrichleather':
        return () => {
          const x = u * 6,
            y = v * 6,
            cx = Math.floor(x),
            cy = Math.floor(y),
            offset = (cy * 6 + cx) * 3,
            dx = (x - cx - follicles![offset]) * follicles![offset + 2],
            dy = (y - cy - follicles![offset + 1]) * follicles![offset + 2],
            q = dx * dx + dy * dy,
            support = smooth(clamp((1 - q) / 0.2)),
            dimple = smooth(clamp(1 - q / 0.12)),
            // Cartesian three-lobed modulation is regular at the center.
            rosette = 1 + 0.18 * (dx * dx * dx - 3 * dx * dy * dy),
            collar =
              q < 1
                ? support *
                  q *
                  Math.exp(-(((q - 0.43) / 0.22) ** 2)) *
                  2 *
                  rosette
                : 0,
            grain = skinGrain!(u, v);
          color = 0.57 + 0.075 * grain + 0.12 * collar - 0.19 * dimple;
          height = 0.43 + 0.018 * grain + 0.18 * collar - 0.13 * dimple;
          roughness += 0.035 * (grain - 0.5) - 0.035 * collar + 0.04 * dimple;
          occlusion = 0.985 - 0.17 * dimple - 0.035 * collar;
          return;
        };
      case 'sharkskin':
        return () => {
          const x = u * 18,
            y = v * 24,
            row = Math.floor(y),
            grain = skinGrain!(u, v);
          color = 0.3 + 0.025 * grain;
          height = 0.26 + 0.008 * grain;
          occlusion = 0.79;
          // |dy| < .78, width <= .43 * 1.45 < .624. Omitted rows/
          // columns are >= 1.5 away: wrapped 3x3 support is complete.
          // Ascending unwrapped rows preserve back-to-front order at the seam.
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy,
              wy = ((cy % 24) + 24) % 24,
              shift = (wy % 2) * 0.5,
              column = Math.floor(x - shift);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                wx = ((cx % 18) + 18) % 18,
                variation = denticles![wy * 18 + wx],
                dy = y - cy - 0.5,
                t = dy / 0.78;
              if (t <= -1 || t >= 1) continue;
              const width = (0.39 + 0.04 * variation) * (1 - 0.45 * t),
                across = (x - cx - shift - 0.5) / width,
                q = across * across + t * t,
                cover = smooth(clamp((1 - q) / 0.22));
              if (cover === 0) continue;
              const dome = smooth(clamp(1 - q)),
                keels =
                  Math.exp(-(((across + 0.48) / 0.075) ** 2)) +
                  Math.exp(-((across / 0.075) ** 2)) +
                  Math.exp(-(((across - 0.48) / 0.075) ** 2)),
                rim = smooth(clamp((q - 0.56) / 0.2));
              // Composite the complete opaque face, including its AO and rim;
              // covered lower rims cannot bleed through an upper denticle.
              color +=
                cover *
                (0.52 +
                  0.1 * variation +
                  0.045 * keels * dome -
                  0.055 * rim -
                  color);
              height +=
                cover *
                (0.4 +
                  0.065 * dome +
                  0.055 * keels * dome -
                  0.025 * rim -
                  height);
              occlusion += cover * (0.98 - 0.07 * rim - occlusion);
            }
          }
          roughness += 0.025 * (grain - 0.5) + 0.035 * (1 - occlusion);
          return;
        };
      case 'leather':
        return () => {
          const pores = wrappedFeature(u, v, 14, seed ^ 0x51);
          const pebble = smooth(clamp(1 - pores * 1.55));
          color = 0.24 + 0.52 * pebble + 0.12 * detail;
          height = 0.12 + 0.72 * pebble + 0.06 * detail;
          roughness += 0.16 * (1 - pebble) + 0.04 * (detail - 0.5);
          occlusion = 0.55 + 0.45 * pebble;
          return;
        };
      case 'suede':
        return () => {
          const brush = noise(u, v, 5, 7, seed ^ 0x3d17);
          const nap = noise(
            u + 0.012 * brush,
            v + 0.004 * brush,
            96,
            24,
            seed ^ 0x5e31,
          );
          const pores = smooth(
            clamp((noise(u, v, 80, 80, seed ^ 0x7a63) - 0.57) / 0.35),
          );
          // Short directional pile is a continuous brushed field, not isolated
          // long felt fibers or the coarse raised pebbles of leather.
          color =
            0.23 + 0.36 * brush + 0.25 * nap + 0.1 * detail - 0.08 * pores;
          height = 0.35 + 0.075 * nap + 0.025 * brush - 0.045 * pores;
          roughness += 0.075 * (nap - 0.5) + 0.035 * (brush - 0.5);
          occlusion = 0.985 - 0.035 * pores + 0.01 * nap;
          return;
        };
      case 'snakeskin':
        return () => {
          const x = u * 10,
            y = v * 12;
          const row = Math.floor(y);
          let scales = 0,
            crowns = 0,
            keels = 0,
            pigment = 0;
          // Rounded pointed diamonds have compact, disjoint support. Even rows
          // wrap the stagger; owner pigment and keel vanish at each folded rim.
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy;
            const stagger = (((cy % 2) + 2) % 2) * 0.5;
            const column = Math.floor(x - stagger);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox;
              const wx = ((cx % 10) + 10) % 10,
                wy = ((cy % 12) + 12) % 12;
              const variation = hideCells![wy * 10 + wx];
              const dx = x - cx - stagger - 0.5,
                dy = y - cy - 0.5;
              if (Math.abs(dx) >= 0.48 || Math.abs(dy) >= 0.64) continue;
              const distance =
                Math.sqrt(dx * dx + 0.0016) / (0.46 + 0.02 * variation) +
                Math.sqrt(dy * dy + 0.0016) / (0.61 + 0.03 * variation);
              const cap = clamp(1 - distance);
              if (cap === 0) continue;
              const face = smooth(clamp(cap / 0.18));
              const crown = cap * cap;
              const keel = crown * Math.exp(-dx * dx * 180);
              scales += face;
              crowns += crown;
              keels += keel;
              pigment += face * variation;
            }
          }
          color =
            0.13 + 0.4 * scales + 0.2 * pigment + 0.1 * crowns + 0.04 * detail;
          height =
            0.04 +
            0.64 * scales +
            0.2 * crowns +
            0.065 * keels +
            0.012 * detail;
          roughness +=
            0.12 * (1 - scales) - 0.045 * crowns + 0.045 * (detail - 0.5);
          occlusion = 0.57 + 0.41 * scales + 0.015 * crowns;
          return;
        };
      case 'crocodile':
        return () => {
          const x = u * 4,
            y = v * 6;
          const column = Math.floor(x),
            row = Math.floor(y);
          const variation = hideCells![row * 4 + column];
          const dx = (fract(x) - 0.5) / (0.445 + 0.025 * variation),
            dy = (fract(y) - 0.5) / (0.445 + 0.02 * variation);
          const cap = clamp(1 - dx * dx * dx * dx - dy * dy * dy * dy);
          const face = smooth(clamp(cap / 0.36));
          const warp = noise(u, v, 9, 11, seed ^ 0x2f53);
          const fold = Math.pow(
            0.5 + 0.5 * Math.sin(TAU * (19 * u + 13 * v + 1.7 * warp) + phase),
            12,
          );
          // Superelliptic scutes have rounded corners and domed embossed faces.
          // Irregular fine wrinkles cross them, unlike running-bond brick joints.
          color =
            0.12 +
            face * (0.37 + 0.22 * variation + 0.1 * detail - 0.12 * fold);
          height =
            0.035 +
            face * (0.64 + 0.17 * cap * cap + 0.035 * variation - 0.065 * fold);
          roughness +=
            0.13 * (1 - face) + face * (0.055 * fold + 0.04 * (detail - 0.5));
          occlusion = 0.53 + face * (0.46 - 0.055 * fold);
          return;
        };
      case 'fishscales':
      case 'feathers':
      case 'peacockfeathers': {
        const eye =
            kind === 'peacockfeathers'
              ? proceduralMaterialPresets.peacockfeathers
              : null,
          inverseEyeWidth = eye ? 1 / (eye.eyeWidth * eye.eyeWidth) : 0,
          inverseEyeLength = eye ? 1 / (eye.eyeLength * eye.eyeLength) : 0,
          inverseOuterShoulder = eye ? 1 / eye.outerShoulder : 0,
          inverseInnerShoulder = eye ? 1 / eye.innerShoulder : 0,
          inversePupilWidth = eye ? 1 / (eye.pupilWidth * eye.pupilWidth) : 0,
          inversePupilLength = eye
            ? 1 / (eye.pupilLength * eye.pupilLength)
            : 0,
          inversePupilShoulder = eye ? 1 / eye.pupilShoulder : 0;
        return () => {
          const x = u * armorColumns,
            y = v * armorRows,
            row = Math.floor(y);
          color = 0.12 + 0.045 * detail;
          height = 0.23;
          occlusion = 0.76;
          // Back-to-front rows retain the same local order across the periodic
          // seam. Every entering/leaving owner has zero value and slope.
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy,
              wy = ((cy % armorRows) + armorRows) % armorRows,
              stagger = (wy % 2) * 0.5,
              column = Math.floor(x - stagger);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                wx = ((cx % armorColumns) + armorColumns) % armorColumns,
                offset = (wy * armorColumns + wx) * 2,
                variation = armorCells![offset],
                dy = y - cy - 0.5,
                dx = x - cx - stagger - 0.5 - armorCells![offset + 1] * dy;
              let cover: number, pigment: number, relief: number;
              if (kind === 'fishscales') {
                const q = (dx * dx) / 0.4356 + (dy * dy) / 0.6724;
                cover = smooth(clamp((1 - q) / 0.18));
                if (cover === 0) continue;
                const dome = smooth(clamp(1 - q));
                const lip =
                  smooth(clamp((q - 0.48) / 0.2)) *
                  smooth(clamp((1 - q) / 0.15)) *
                  smooth(clamp((dy + 0.12) / 0.4));
                const growth = Math.cos(TAU * (6 * q + 0.15 * variation));
                pigment =
                  0.39 +
                  0.2 * variation +
                  0.13 * dome +
                  0.1 * lip +
                  0.045 * growth;
                relief =
                  0.37 + 0.12 * dome + 0.11 * lip + 0.012 * growth * dome;
              } else {
                const t = dy / 1.08;
                if (t <= -1 || t >= 1) continue;
                const width = 1 - t * t;
                const edge = width * width - (dx * dx) / 0.2304;
                cover = smooth(clamp(edge / 0.16));
                if (cover === 0) continue;
                const vane = smooth(clamp(edge));
                const shaft = smooth(clamp(1 - (dx * dx) / 0.0025));
                const barbs = Math.cos(
                  TAU * (18 * dy - 14 * Math.sqrt(dx * dx + 0.0004)),
                );
                const tip = smooth(clamp((t + 0.45) / 1.1));
                pigment =
                  0.36 +
                  0.22 * variation +
                  0.1 * vane -
                  0.12 * tip +
                  0.08 * shaft +
                  0.065 * barbs;
                relief =
                  0.35 + 0.1 * vane + 0.075 * shaft + 0.013 * barbs * vane;
                if (eye) {
                  const ey = dy - eye.eyeY,
                    q = dx * dx * inverseEyeWidth + ey * ey * inverseEyeLength,
                    outer = smooth(clamp((1 - q) * inverseOuterShoulder)),
                    inner = smooth(
                      clamp((eye.innerSquared - q) * inverseInnerShoulder),
                    ),
                    px = dx - eye.pupilX,
                    py = dy - eye.pupilY,
                    pupil = smooth(
                      clamp(
                        (1 -
                          px * px * inversePupilWidth -
                          py * py * inversePupilLength) *
                          inversePupilShoulder,
                      ),
                    );
                  // Ocelli are pigment: the shaft, barbs and AO never become
                  // a carved ring or hollow pupil.
                  pigment +=
                    outer *
                    (0.91 + 0.025 * variation + 0.015 * barbs - pigment);
                  pigment +=
                    inner * (0.29 + 0.035 * variation + 0.02 * barbs - pigment);
                  pigment +=
                    pupil *
                    (0.035 + 0.015 * variation + 0.008 * barbs - pigment);
                }
              }
              color += cover * (pigment - color);
              height += cover * (relief - height);
              occlusion += cover * (0.98 - occlusion);
            }
          }
          roughness += 0.045 * (1 - occlusion) + 0.025 * (detail - 0.5);
          return;
        };
      }
      case 'tortoiseshell':
        return () => {
          const x = u * 6,
            y = v * 6,
            ix = Math.floor(x),
            iy = Math.floor(y);
          const mottling = noise(u, v, 19, 23, seed ^ 0x49e7);
          color = 0.045 + 0.025 * detail;
          height = 0.22;
          occlusion = 0.72;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy,
                wx = (cx + 6) % 6,
                wy = (cy + 6) % 6,
                offset = (wy * 6 + wx) * 27,
                dx = x - cx - scutes![offset],
                dy = y - cy - scutes![offset + 1];
              let cover = 1,
                dome = 1;
              for (let edge = 0; edge < 8; edge++) {
                const plane = offset + 3 + edge * 3,
                  distance = scutes![plane + 2],
                  inset =
                    distance - dx * scutes![plane] - dy * scutes![plane + 1];
                cover *= smooth(clamp((inset - 0.018) / 0.085));
                dome *= smooth(clamp(inset / distance));
                if (cover === 0) break;
              }
              if (cover === 0) continue;
              const variation = scutes![offset + 2];
              const growth = Math.cos(TAU * (5 * dome + 0.12 * variation));
              const pigment =
                0.28 +
                0.25 * variation +
                0.22 * mottling +
                0.09 * dome +
                0.045 * growth;
              color += cover * (pigment - color);
              height +=
                cover * (0.37 + 0.2 * dome + 0.012 * growth * dome - height);
              occlusion += cover * (0.98 - occlusion);
            }
          roughness += 0.06 * (1 - occlusion) + 0.025 * (detail - 0.5);
          return;
        };
      case 'sand':
        return () => {
          const warp = noise(u, v, 3, 3, seed ^ 17);
          const ripple =
            0.5 + 0.5 * Math.sin(TAU * (v * 7 + 0.35 * warp) + phase);
          const grain = noise(u, v, 48, 48, seed ^ 0x51ed);
          color = 0.3 + 0.48 * ripple + 0.18 * grain;
          height = 0.72 * ripple + 0.22 * grain;
          roughness += 0.06 * (grain - 0.5);
          occlusion = 0.82 + 0.18 * ripple;
          return;
        };
      case 'rust':
        return () => {
          const pit = noise(u, v, 6, 6, seed ^ 211);
          const flake = noise(u, v, 18, 18, seed ^ 419);
          const corrosion = smooth(
            clamp((pit * 0.7 + flake * 0.3 - 0.32) / 0.28),
          );
          color = corrosion;
          height =
            0.25 + 0.45 * (1 - corrosion) * flake - 0.2 * corrosion * pit;
          roughness += 0.22 * corrosion + 0.05 * (flake - 0.5);
          occlusion = 0.7 + 0.3 * (1 - corrosion);
          metallic = 1 - corrosion;
          return;
        };
      case 'snow':
        return () => {
          const drift = noise(u, v, 3, 3, seed ^ 17);
          const spark = Math.pow(
            hash(Math.floor(fract(u) * 48), Math.floor(fract(v) * 48), seed),
            8,
          );
          color = clamp(0.22 + 0.68 * drift + 0.1 * spark);
          height = 0.7 * drift + 0.2 * spark;
          roughness += 0.22 * spark - 0.06 * drift;
          occlusion = 0.88 + 0.12 * drift;
          return;
        };
      case 'asphalt':
      case 'gravel':
        return () => {
          const asphalt = kind === 'asphalt';
          const cells = asphalt ? 40 : 12;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let coverage = 0,
            pigment = 0,
            weight = 0,
            relief = 0;
          // Compact, softly edged caps blend continuously, including across wrapped cells.
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const variation = hash(wx, wy, seed ^ 0x74b1);
              const angle = hash(wx, wy, seed ^ 0x6a09) * TAU;
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const dx = x - cx - 0.25 - 0.5 * hash(wx, wy, seed),
                dy = y - cy - 0.25 - 0.5 * hash(wx, wy, seed ^ 0x9e37);
              const radius = asphalt
                ? 0.22 + 0.21 * variation
                : 0.46 + 0.17 * variation;
              const aspect = 0.7 + 0.3 * hash(wx, wy, seed ^ 0x51ed);
              const rx = (dx * cos + dy * sin) / aspect,
                ry = dy * cos - dx * sin;
              const distance =
                Math.sqrt(rx * rx + ry * ry) +
                (detail - 0.5) * (asphalt ? 0.08 : 0.16);
              const cap = smooth(clamp((radius - distance) / 0.16));
              const dome = clamp(1 - distance / radius);
              coverage = Math.max(coverage, cap);
              relief = Math.max(relief, cap * (0.65 + 0.35 * dome));
              pigment += cap * (0.35 + 0.65 * variation);
              weight += cap;
            }
          const aggregate = pigment / Math.max(1, weight);
          if (asphalt) {
            color = 0.06 + 0.58 * aggregate + 0.1 * detail + 0.06 * fine;
            height = 0.58 * relief + 0.18 * detail + 0.24 * fine;
            roughness += 0.08 * (1 - coverage) + 0.1 * (fine - 0.5);
            occlusion = 0.8 + 0.2 * coverage;
          } else {
            color = 0.04 + 0.8 * aggregate + 0.08 * fine;
            height = relief * (0.84 + 0.16 * detail) + 0.025 * fine;
            roughness += 0.13 * (1 - coverage) + 0.1 * (fine - 0.5);
            occlusion = 0.42 + 0.58 * coverage;
          }
          return;
        };
      case 'cobblestone':
        return () => {
          const wu = u + 0.012 * noise(u, v, 6, 8, seed ^ 0x231);
          const wv = v + 0.009 * noise(u, v, 6, 8, seed ^ 0x913);
          const row = Math.floor(fract(wv) * 8);
          const column = wu * 6 + (row % 2) * 0.5;
          const x = fract(column),
            y = fract(wv * 8);
          const dx = Math.abs(x - 0.5),
            dy = Math.abs(y - 0.5) * 0.75;
          const cornerX = Math.max(0, dx - 0.38),
            cornerY = Math.max(0, dy - 0.255);
          const edge = 0.12 - Math.sqrt(cornerX * cornerX + cornerY * cornerY);
          const face = smooth(clamp((edge - 0.018) / 0.085));
          const variation = hash(((Math.floor(column) % 6) + 6) % 6, row, seed);
          const crown = 1 - 0.65 * (dx * dx + dy * dy);
          // Stone-specific variation vanishes in the joints to keep staggered row edges continuous.
          color =
            0.05 +
            face * (0.25 + 0.48 * variation + 0.12 * detail) +
            0.05 * fine;
          height = face * (0.76 * crown + 0.16 * detail + 0.08 * fine);
          roughness += 0.17 * (1 - face) + 0.1 * (fine - 0.5);
          occlusion = 0.45 + 0.55 * face;
          return;
        };
      case 'bark':
        return () => {
          const warp = noise(u, v, 4, 6, seed ^ 0x3b17);
          const ridge = noise(u + 0.035 * warp, v, 18, 3, seed ^ 0x8421);
          const split = noise(u, v, 6, 18, seed ^ 0x5193);
          // Anisotropic islands break across the trunk instead of repeating wood-grain waves.
          const face =
            smooth(clamp((ridge - 0.26) / 0.38)) *
            smooth(clamp((split - 0.18) / 0.22));
          const flake = noise(u, v, 48, 12, seed ^ 0x217b);
          color = 0.05 + face * (0.43 + 0.33 * flake + 0.13 * fine);
          height = face * (0.58 + 0.3 * flake + 0.12 * detail);
          roughness += 0.08 * (1 - face) + 0.1 * (fine - 0.5);
          occlusion = 0.42 + 0.58 * face;
          return;
        };
      case 'moss':
        return () => {
          const warp = noise(u, v, 4, 4, seed ^ 0x1b67);
          const distance = wrappedFeature(
            fract(u + 0.025 * warp),
            fract(v + 0.018 * warp),
            9,
            seed ^ 0x63af,
          );
          const cushion = smooth(clamp(1 - distance / 0.95));
          const growth = noise(u, v, 18, 18, seed ^ 0x9327);
          const tips = smooth(clamp((fine - 0.25) / 0.5));
          color = 0.09 + 0.46 * cushion + 0.24 * growth + 0.19 * tips;
          height =
            0.65 * cushion + (0.09 + 0.14 * cushion) * tips + 0.12 * detail;
          roughness += 0.06 * (tips - 0.5) - 0.08 * (1 - cushion);
          occlusion = 0.52 + 0.36 * cushion + 0.12 * tips;
          return;
        };
      case 'mud':
        return () => {
          const cells = 7;
          const warp = noise(u, v, 4, 4, seed ^ 0x7153);
          const x = (u + 0.025 * warp) * cells,
            y = (v + 0.025 * noise(u, v, 4, 4, seed ^ 0x1f39)) * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let nearest = 4,
            second = 4;
          // Constrained jitter keeps the two closest sites inside this wrapped neighborhood.
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.3 - 0.4 * hash(wx, wy, seed),
                dy = y - cy - 0.3 - 0.4 * hash(wx, wy, seed ^ 0x9e37);
              const distance = dx * dx + dy * dy;
              if (distance < nearest) {
                second = nearest;
                nearest = distance;
              } else if (distance < second) second = distance;
            }
          const margin = Math.sqrt(second) - Math.sqrt(nearest);
          const clod = smooth(clamp((margin - 0.025) / 0.13));
          const damp = smooth(
            clamp((noise(u, v, 3, 3, seed ^ 0x38e1) - 0.25) / 0.5),
          );
          color =
            0.04 + clod * (0.52 - 0.24 * damp + 0.17 * detail) + 0.04 * fine;
          height =
            clod * (0.48 + 0.16 * (1 - nearest)) +
            (0.07 * detail + 0.03 * fine) * (1 - 0.75 * damp);
          roughness -= 0.38 * damp;
          roughness += 0.1 * (1 - clod) + 0.08 * (fine - 0.5) * (1 - damp);
          occlusion = 0.48 + 0.52 * clod;
          return;
        };
      case 'granite':
        return () => {
          const cells = 38;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let pigment = 0,
            weight = 0,
            nearest = 4,
            second = 4;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.3 - 0.4 * hash(wx, wy, seed),
                dy = y - cy - 0.3 - 0.4 * hash(wx, wy, seed ^ 0x9e37);
              const distance = dx * dx + dy * dy;
              if (distance < nearest) {
                second = nearest;
                nearest = distance;
              } else if (distance < second) second = distance;
              // Compact weights vanish before a site can leave the wrapped neighborhood.
              // Sharp normalized blends form mineral facets without discontinuous cell colors.
              const cap = Math.pow(clamp(1 - distance / 1.44), 10);
              const mineral = hash(wx, wy, seed ^ 0x642b);
              pigment +=
                cap * (mineral < 0.24 ? 0.08 + mineral : 0.48 + 0.5 * mineral);
              weight += cap;
            }
          const mineral = pigment / Math.max(weight, 1e-12);
          const boundary =
            1 - smooth(clamp((Math.sqrt(second) - Math.sqrt(nearest)) / 0.16));
          color = clamp(
            0.04 + 0.88 * mineral + 0.1 * (fine - 0.5) - 0.07 * boundary,
          );
          height = 0.35 * mineral + 0.17 * fine - 0.12 * boundary;
          roughness += 0.16 * (1 - mineral) + 0.06 * (fine - 0.5);
          occlusion = 0.97 - 0.025 * boundary + 0.03 * fine;
          return;
        };
      case 'slate':
        return () => {
          const warp = noise(u, v, 5, 4, seed ^ 0x4167);
          const bedding = noise(
            u + 0.025 * warp,
            v + 0.018 * warp,
            3,
            22,
            seed ^ 0x741b,
          );
          const layers = bedding * 5;
          const terrace =
            (Math.floor(layers) + smooth(clamp((fract(layers) - 0.35) / 0.3))) /
            5;
          const cross = noise(u, v, 12, 5, seed ^ 0x135b);
          const cleft =
            Math.pow(1 - Math.abs(2 * fract(layers) - 1), 8) *
            smooth(clamp((cross - 0.18) / 0.35));
          // Elongated terrace steps and broken clefts, not sinusoidal marble veins.
          color = 0.14 + 0.62 * terrace + 0.14 * fine - 0.12 * cleft;
          height = 0.72 * terrace + 0.1 * fine - 0.18 * cleft;
          roughness += 0.1 * cleft + 0.1 * (fine - 0.5);
          occlusion = 0.98 - 0.15 * cleft + 0.02 * fine;
          return;
        };
      case 'terrazzo':
        return () => {
          const cells = 9;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let coverage = 0,
            pigment = 0,
            weight = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const variation = hash(wx, wy, seed ^ 0x927b);
              const angle = hash(wx, wy, seed ^ 0x341d) * TAU;
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const dx = x - cx - 0.3 - 0.4 * hash(wx, wy, seed),
                dy = y - cy - 0.3 - 0.4 * hash(wx, wy, seed ^ 0x9e37);
              const rx = dx * cos + dy * sin,
                ry = dy * cos - dx * sin;
              const aspect = 0.75 + 0.25 * hash(wx, wy, seed ^ 0x21af);
              // Intersect rotated half-planes for asymmetric, flat angular chips.
              const distance = Math.max(
                Math.abs(rx) * aspect,
                Math.abs(ry),
                (rx * 0.65 + ry * 0.76) * 1.1,
                (-rx * 0.83 + ry * 0.55) * 1.15,
              );
              const radius = 0.26 + 0.18 * variation;
              const chip = smooth(clamp((radius - distance) / 0.025));
              coverage = Math.max(coverage, chip);
              pigment += chip * (0.08 + 0.7 * hash(wx, wy, seed ^ 0x591f));
              weight += chip;
            }
          const mineral = pigment / Math.max(weight, 1e-12);
          const binder = 0.88 + 0.06 * detail;
          color = binder * (1 - coverage) + coverage * mineral;
          // Polished chips are nearly flush with the binder: color is not a height map.
          height = 0.15 + 0.06 * coverage + 0.015 * detail + 0.025 * fine;
          roughness +=
            0.055 * (1 - coverage) -
            0.03 * coverage * mineral +
            0.04 * (fine - 0.5);
          occlusion = 0.98 + 0.015 * coverage + 0.005 * fine;
          return;
        };
      case 'denim':
        return () => {
          const x = u * 24,
            y = v * 24;
          const warp = 0.5 + 0.5 * Math.cos(TAU * x),
            weft = 0.5 + 0.5 * Math.cos(TAU * y);
          // A narrow pale weft exposure advances diagonally through indigo warp floats.
          // Analytic ownership avoids switching yarns abruptly at crossing/row boundaries.
          const exposure =
            1 -
            smooth(
              clamp(
                (Math.abs(Math.sin((Math.PI * (x - y)) / 4)) - 0.24) / 0.22,
              ),
            );
          const warpFiber =
            0.5 + 0.5 * Math.sin(TAU * (96 * u + 0.12 * detail) + phase);
          const weftFiber =
            0.5 + 0.5 * Math.sin(TAU * (96 * v + 0.12 * detail) + phase);
          const fiber = warpFiber * (1 - exposure) + weftFiber * exposure;
          const thread = warp * (1 - exposure) + weft * exposure;
          const slub = noise(u, v, 24, 4, seed ^ 0x6d31);
          color =
            0.12 + 0.22 * thread + 0.34 * exposure + 0.1 * fiber + 0.12 * slub;
          height =
            0.42 * thread + 0.24 * (1 - exposure) + 0.06 * fiber + 0.08 * slub;
          roughness += 0.06 * (detail - 0.5) + 0.04 * (1 - thread);
          occlusion = 0.78 + 0.18 * thread + 0.04 * fiber;
          return;
        };
      case 'houndstooth':
        return () => {
          const x = 32 * u,
            y = 32 * v,
            ix = Math.floor(x) % 8,
            iy = Math.floor(y) % 8,
            sx = smooth(fract(x)),
            sy = smooth(fract(y)),
            nx = (ix + 1) % 8,
            ny = (iy + 1) % 8;
          const a = toothYarns![iy * 8 + ix],
            b = toothYarns![iy * 8 + nx],
            c = toothYarns![ny * 8 + ix],
            d = toothYarns![ny * 8 + nx];
          const pigment =
            (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
          const over = 0.5 + 0.5 * Math.cos((TAU * (x - y)) / 4),
            warp = 0.5 + 0.5 * Math.cos(TAU * x),
            weft = 0.5 + 0.5 * Math.cos(TAU * y),
            thread = warp * over + weft * (1 - over);
          const fiber =
            0.5 +
            0.25 * Math.cos(TAU * 96 * u + phase) +
            0.25 * Math.cos(TAU * 96 * v - phase);
          color = 0.025 + 0.88 * pigment + 0.045 * thread + 0.03 * detail;
          height = 0.2 + 0.19 * thread + 0.025 * fiber + 0.02 * detail;
          roughness += 0.04 * (detail - 0.5) + 0.025 * (1 - thread);
          occlusion = 0.86 + 0.12 * thread;
          return;
        };
      case 'tartan':
        return () => {
          const x = 2 * u,
            y = 2 * v;
          const broadWarp = smooth(clamp((Math.cos(TAU * x) + 0.15) / 0.55)),
            broadWeft = smooth(clamp((Math.cos(TAU * y) + 0.15) / 0.55)),
            fineWarp = smooth(
              clamp((Math.cos(TAU * (x + 0.25)) - 0.96) / 0.04),
            ),
            fineWeft = smooth(
              clamp((Math.cos(TAU * (y + 0.25)) - 0.96) / 0.04),
            ),
            doubleWarp = smooth(clamp((Math.cos(TAU * 2 * x) - 0.9) / 0.1)),
            doubleWeft = smooth(clamp((Math.cos(TAU * 2 * y) - 0.9) / 0.1));
          const warpPigment =
              0.13 + 0.35 * broadWarp + 0.36 * fineWarp + 0.1 * doubleWarp,
            weftPigment =
              0.13 + 0.35 * broadWeft + 0.36 * fineWeft + 0.1 * doubleWeft;
          const over = smooth(
              clamp(0.5 + 0.8 * Math.cos(Math.PI * 64 * (u + v))),
            ),
            warp = 0.5 + 0.5 * Math.cos(TAU * 64 * u),
            weft = 0.5 + 0.5 * Math.cos(TAU * 64 * v),
            thread = warp * over + weft * (1 - over);
          // Pigment follows the upper yarn at every crossing, not rectangular tiles.
          color =
            warpPigment * over +
            weftPigment * (1 - over) +
            0.045 * thread +
            0.025 * detail;
          height = 0.2 + 0.16 * thread + 0.025 * detail;
          roughness += 0.04 * (detail - 0.5) + 0.03 * (1 - thread);
          occlusion = 0.85 + 0.13 * thread;
          return;
        };
      case 'goldbrocade':
      case 'damask':
        return () => {
          const x = fract(2 * u + 0.5) - 0.5,
            y = fract(2 * v + 0.5) - 0.5;
          let backing = 1,
            rounded = 1;
          for (let i = 0; i < 12; i++) {
            const offset = i * 6,
              dx = x - damaskLobes![offset],
              dy = y - damaskLobes![offset + 1],
              cos = damaskLobes![offset + 2],
              sin = damaskLobes![offset + 3],
              along = (dx * cos + dy * sin) * damaskLobes![offset + 4],
              across = (dy * cos - dx * sin) * damaskLobes![offset + 5],
              cap = clamp(1 - along * along - across * across);
            // Both silhouette and raised crown vanish with zero slope; overlapping
            // petals blend as a smooth union, with no nearest-lobe ownership jump.
            backing *= 1 - smooth(clamp(cap / 0.28));
            rounded *= 1 - cap * cap;
          }
          const motif = 1 - backing,
            crown = 1 - rounded,
            warp = 0.5 + 0.5 * Math.cos(TAU * 64 * u),
            weft = 0.5 + 0.5 * Math.cos(TAU * 64 * v),
            thread = (warp + weft) * 0.5;
          if (kind === 'goldbrocade') {
            const weave = warp + weft - warp * weft,
              gold = motif * weave;
            color = 0.03 + 0.025 * weave + 0.01 * detail;
            height = 0.12 + 0.04 * weave + 0.004 * detail;
            roughness += 0.08 * (1 - weave) + 0.025 * detail;
            occlusion = 0.85 + 0.1 * weave;
            // Only exposed supplementary gold threads are metallic; cloth and
            // woven interstices keep their dielectric response.
            metallic = gold;
            if (gold === 0) return;
            const satin = 0.5 + 0.5 * Math.cos(TAU * (16 * u - 16 * v) + phase);
            color += gold * (0.9 + 0.07 * crown + 0.02 * thread - color);
            height +=
              gold *
              (0.4 + 0.12 * crown + 0.02 * thread + 0.01 * satin - height);
            roughness +=
              gold * (0.25 - 0.04 * crown + 0.015 * satin - roughness);
            occlusion += gold * (0.99 - occlusion);
            return;
          }
          const satin = 0.5 + 0.5 * Math.cos(TAU * (16 * u - 16 * v) + phase);
          color =
            0.19 + 0.48 * motif + 0.08 * crown + 0.07 * thread + 0.025 * detail;
          height =
            0.18 +
            0.3 * motif +
            0.13 * crown +
            0.025 * thread +
            0.015 * motif * satin;
          roughness +=
            0.055 * (1 - motif) -
            0.035 * motif * satin +
            0.025 * (detail - 0.5);
          occlusion = 0.88 + 0.07 * motif + 0.03 * thread;
          return;
        };
      case 'herringbone':
        return () => {
          const x = 32 * u,
            y = 32 * v;
          // A rounded triangular phase reverses the twill, not rectangular
          // patches of yarn. Its analytic turn has no cusp or ownership seam.
          const fold = Math.acos(0.995 * Math.cos(TAU * 2 * u)) / Math.PI;
          const exposure = smooth(
            clamp(
              (0.5 + 0.5 * Math.cos(TAU * (2 * fold - 8 * v) + phase) - 0.2) /
                0.6,
            ),
          );
          const warp = 0.5 + 0.5 * Math.cos(TAU * x),
            weft = 0.5 + 0.5 * Math.cos(TAU * y);
          const thread = warp * (1 - exposure) + weft * exposure;
          const fiber =
            (0.5 + 0.5 * Math.sin(TAU * 128 * u + phase)) * (1 - exposure) +
            (0.5 + 0.5 * Math.sin(TAU * 128 * v - phase)) * exposure;
          const slub = noise(u, v, 16, 8, seed ^ 0x3c19);
          color =
            0.17 + 0.31 * exposure + 0.26 * thread + 0.1 * fiber + 0.09 * slub;
          height =
            0.25 +
            0.24 * thread +
            0.07 * exposure +
            0.035 * fiber +
            0.025 * slub;
          roughness += 0.055 * (detail - 0.5) + 0.035 * (1 - thread);
          occlusion = 0.84 + 0.12 * thread + 0.025 * fiber;
          return;
        };
      case 'tweed':
        return () => {
          const x = 20 * u,
            y = 20 * v;
          const warp = smooth(clamp((Math.cos(TAU * x) + 0.45) / 1.25)),
            weft = smooth(clamp((Math.cos(TAU * y) + 0.45) / 1.25));
          const over = smooth(clamp(0.5 + 0.85 * Math.cos(Math.PI * (x + y))));
          const warpTop = warp * (1 - weft + weft * over),
            weftTop = weft * (1 - warp + warp * (1 - over));
          const yarn = warpTop + weftTop;
          const slub =
            warpTop * noise(u, v, 20, 4, seed ^ 0x3b17) +
            weftTop * noise(u, v, 4, 20, seed ^ 0x6e29);
          const fiber =
            warpTop *
              (0.5 + 0.5 * Math.sin(TAU * (80 * u + 0.15 * detail) + phase)) +
            weftTop *
              (0.5 + 0.5 * Math.sin(TAU * (80 * v + 0.15 * detail) - phase));
          const fx = u * 24,
            fy = v * 24,
            ix = Math.floor(fx),
            iy = Math.floor(fy);
          let flecks = 0,
            pigment = 0.12 + 0.29 * yarn + 0.34 * slub + 0.12 * fiber;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy,
                wx = ((cx % 24) + 24) % 24,
                wy = ((cy % 24) + 24) % 24;
              const variation = hash(wx, wy, seed ^ 0x2d73);
              const dx = fx - cx - 0.25 - 0.5 * hash(wx, wy, seed),
                dy = fy - cy - 0.25 - 0.5 * hash(wx, wy, seed ^ 0x5a31);
              const angle =
                (variation < 0.5 ? 0 : Math.PI / 2) + (variation - 0.5) * 0.7;
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const along = (dx * cos + dy * sin) / (0.18 + 0.2 * variation),
                across = (dy * cos - dx * sin) / 0.075;
              // Small yarn-aligned neps vanish with zero slope at their support.
              const cap = clamp(1 - along * along - across * across);
              const fleck = cap * cap;
              flecks += fleck;
              // Blend the nep's pigment into its yarn instead of subtracting
              // color from dark gaps, which can leave the normalized range.
              pigment +=
                fleck * (0.18 + 0.64 * hash(wx, wy, seed ^ 0x7f19) - pigment);
            }
          color = pigment;
          height =
            0.2 +
            0.28 * yarn +
            0.08 * warp * weft +
            0.05 * fiber +
            0.055 * flecks;
          roughness += 0.05 * (detail - 0.5) + 0.025 * flecks;
          occlusion = 0.77 + 0.19 * yarn + 0.025 * fiber;
          return;
        };
      case 'seersucker':
        return () => {
          const band = smooth(clamp((Math.cos(TAU * 4 * u) + 0.25) / 0.75));
          const warp = 0.5 + 0.5 * Math.cos(TAU * 48 * u),
            weft = 0.5 + 0.5 * Math.cos(TAU * 48 * v);
          const over = 0.5 + 0.5 * Math.cos(Math.PI * 48 * (u + v));
          const thread = warp * over + weft * (1 - over);
          const fiber =
            0.5 +
            0.25 * Math.sin(TAU * 144 * u + phase) +
            0.25 * Math.sin(TAU * 144 * v - phase);
          const waviness = noise(u, v, 4, 4, seed ^ 0x4c39);
          const wrinkle =
            0.5 +
            0.5 *
              Math.sin(
                TAU * (12 * v + 0.22 * Math.sin(TAU * 4 * u) + 0.3 * waviness) +
                  phase,
              );
          // Flat cream bands retain only the fine weave; the blue bands carry
          // low, longitudinally varying puckers rather than uniform pile wales.
          color =
            0.71 -
            0.39 * band +
            0.12 * thread +
            0.055 * fiber +
            0.04 * band * wrinkle;
          height =
            0.22 +
            0.035 * thread +
            0.008 * fiber +
            band * (0.08 + 0.2 * wrinkle);
          roughness += 0.045 * (detail - 0.5) + 0.025 * band * (1 - wrinkle);
          occlusion = 0.96 - 0.07 * band * (1 - wrinkle) + 0.02 * thread;
          return;
        };
      case 'burlap':
        return () => {
          const x = u * 10,
            y = v * 10;
          const warp = smooth(clamp((Math.cos(TAU * x) + 0.35) / 1.1)),
            weft = smooth(clamp((Math.cos(TAU * y) + 0.35) / 1.1));
          const over = smooth(clamp(0.5 + 0.9 * Math.cos(Math.PI * (x + y))));
          // Blend ownership continuously; both yarns vanish into opaque recessed gaps.
          const warpTop = warp * (1 - weft + weft * over),
            weftTop = weft * (1 - warp + warp * (1 - over));
          const coverage = warpTop + weftTop;
          const warpFiber =
            0.5 + 0.5 * Math.sin(TAU * (50 * u + 0.14 * detail) + phase);
          const weftFiber =
            0.5 + 0.5 * Math.sin(TAU * (50 * v + 0.14 * detail) + phase);
          const fiber = warpTop * warpFiber + weftTop * weftFiber;
          const crossing = warp * weft;
          color =
            0.04 + 0.65 * coverage + 0.14 * fiber + 0.1 * detail * coverage;
          height =
            0.58 * coverage + 0.2 * crossing + 0.08 * fiber + 0.04 * detail;
          roughness += 0.05 * (detail - 0.5) + 0.025 * (1 - coverage);
          occlusion = 0.42 + 0.54 * coverage + 0.04 * fiber;
          return;
        };
      case 'carpet':
        return () => {
          const cells = 24;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let weight = 0,
            pigment = 0,
            fibers = 0,
            crown = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.35 - 0.3 * hash(wx, wy, seed),
                dy = y - cy - 0.35 - 0.3 * hash(wx, wy, seed ^ 0x9e37);
              const distance = dx * dx + dy * dy;
              // Compact overlapping crowns hide the backing without geometry or alpha.
              // The support ends before any site leaves this wrapped neighborhood.
              const cap = Math.pow(clamp(1 - distance), 3);
              const variation = hash(wx, wy, seed ^ 0x294b);
              const angle = hash(wx, wy, seed ^ 0x681f) * TAU;
              const tips = Math.pow(
                0.5 +
                  0.5 *
                    Math.sin(
                      TAU * 3 * (dx * Math.cos(angle) + dy * Math.sin(angle)) +
                        variation * TAU,
                    ),
                4,
              );
              weight += cap;
              pigment += cap * variation;
              fibers += cap * tips;
              crown = Math.max(crown, cap * (0.75 + 0.25 * variation));
            }
          const inv = 1 / Math.max(weight, 1e-12);
          const yarn = pigment * inv,
            tips = fibers * inv;
          color = 0.19 + 0.4 * yarn + 0.2 * crown + 0.13 * tips + 0.08 * detail;
          height = 0.3 + 0.38 * crown + 0.12 * tips + 0.1 * detail;
          roughness += 0.04 * (detail - 0.5) - 0.035 * tips;
          occlusion = 0.7 + 0.22 * Math.sqrt(crown) + 0.06 * tips;
          return;
        };
      case 'plaster':
        return () => {
          const sweep = noise(u, v, 3, 3, seed ^ 0x37a1);
          const tool =
            0.5 + 0.5 * Math.sin(TAU * (3 * u + 2 * v + 0.7 * sweep) + phase);
          const crest = Math.pow(tool, 10);
          const drag = noise(u, v, 18, 5, seed ^ 0x54d9);
          const pores = smooth(clamp((0.32 - fine) / 0.23));
          // Broad, curved trowel passes leave shallow feathered edges in gypsum.
          color =
            0.61 + 0.2 * sweep + 0.08 * drag + 0.07 * crest - 0.12 * pores;
          height =
            0.22 + 0.28 * sweep + 0.18 * crest + 0.08 * drag - 0.14 * pores;
          roughness += 0.1 * (fine - 0.5) - 0.065 * crest + 0.045 * pores;
          occlusion = 0.98 - 0.1 * pores - 0.025 * crest;
          return;
        };
      case 'terracotta':
        return () => {
          const kiln = noise(u, v, 5, 5, seed ^ 0x3a17);
          const firing = noise(u + 0.04 * kiln, v, 12, 9, seed ^ 0x7d23);
          const pitDistance = wrappedFeature(u, v, 28, seed ^ 0x486d);
          const pits = 1 - smooth(clamp((pitDistance - 0.04) / 0.19));
          const scorched = smooth(clamp((kiln - 0.5) / 0.3));
          // Firing clouds affect pigment more strongly than the unglazed clay relief.
          color =
            0.37 +
            0.46 * firing +
            0.15 * detail -
            0.18 * scorched -
            0.17 * pits;
          height = 0.35 + 0.14 * detail + 0.12 * fine - 0.3 * pits;
          roughness += 0.1 * (fine - 0.5) + 0.07 * pits - 0.04 * scorched;
          occlusion = 0.97 - 0.22 * pits + 0.025 * fine;
          return;
        };
      case 'cork':
        return () => {
          const cells = 14;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let weight = 0,
            pigment = 0,
            largest = 0,
            grain = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.35 - 0.3 * hash(wx, wy, seed),
                dy = y - cy - 0.35 - 0.3 * hash(wx, wy, seed ^ 0x9e37);
              const angle = TAU * hash(wx, wy, seed ^ 0x4d21);
              const rx = dx * Math.cos(angle) + dy * Math.sin(angle),
                ry = dy * Math.cos(angle) - dx * Math.sin(angle);
              // Compact elliptical flakes blend before leaving the wrapped neighborhood.
              const distance = 0.9 * rx * rx + 1.3 * ry * ry;
              const cap = Math.pow(clamp(1 - distance / 1.21), 8);
              const variation = hash(wx, wy, seed ^ 0x172b);
              const lenticel = Math.pow(
                0.5 +
                  0.5 * Math.sin(TAU * (5 * ry + 0.3 * rx) + TAU * variation),
                12,
              );
              weight += cap;
              pigment += cap * variation;
              grain += cap * lenticel;
              largest = Math.max(largest, cap);
            }
          const inv = 1 / Math.max(weight, 1e-12);
          const flake = pigment * inv,
            lenticel = grain * inv;
          const boundary = 1 - smooth(clamp((largest * inv - 0.48) / 0.4));
          color =
            0.31 +
            0.57 * flake +
            0.12 * detail -
            0.22 * boundary -
            0.09 * lenticel;
          height =
            0.4 + 0.16 * flake + 0.07 * fine - 0.2 * boundary - 0.07 * lenticel;
          roughness += 0.07 * (fine - 0.5) + 0.045 * boundary - 0.025 * flake;
          occlusion = 0.97 - 0.18 * boundary - 0.08 * lenticel;
          return;
        };
      case 'studdedrubber':
        return () => {
          const x = u * 6,
            y = v * 6;
          const dx = fract(x) - 0.5,
            dy = fract(y) - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const stud = 1 - smooth(clamp((radius - 0.24) / 0.12));
          const variation = rubberStuds![Math.floor(y) * 6 + Math.floor(x)];
          const stipple = noise(u, v, 144, 144, seed ^ 0x49b3);
          color = 0.24 + 0.16 * stud + 0.06 * stud * variation + 0.05 * stipple;
          height = 0.16 + 0.66 * stud + 0.002 * stipple;
          roughness = preset.roughness + 0.04 * (stipple - 0.5);
          occlusion = 0.84 + 0.16 * stud;
          return;
        };
      case 'groovedrubber':
        return () => {
          const x = u * 12;
          const distance = Math.abs(fract(x) - 0.5);
          const rib = 1 - smooth(clamp((distance - 0.32) / 0.13));
          const variation = rubberRibs![Math.floor(x)];
          const stipple = noise(u, v, 144, 144, seed ^ 0x6e21);
          color = 0.18 + 0.29 * rib + 0.04 * rib * variation + 0.035 * stipple;
          height = 0.15 + 0.7 * rib + 0.0015 * stipple;
          roughness = preset.roughness + 0.035 * (stipple - 0.5);
          occlusion = 0.7 + 0.3 * rib;
          return;
        };
      case 'recycledrubber':
        return () => {
          const x = u * 48,
            y = v * 48,
            ix = Math.floor(x),
            iy = Math.floor(y);
          let coverage = 0,
            pigment = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const offset = (((cy + 48) % 48) * 48 + ((cx + 48) % 48)) * 18;
              const dx = x - cx - rubberGranules![offset],
                dy = y - cy - rubberGranules![offset + 1];
              let mask = 1;
              for (let edge = 0; edge < 5; edge++) {
                const plane = offset + 3 + edge * 3;
                const inset =
                  rubberGranules![plane + 2] -
                  dx * rubberGranules![plane] -
                  dy * rubberGranules![plane + 1];
                mask *= smooth(clamp(inset / 0.14));
              }
              coverage += mask;
              pigment += mask * rubberGranules![offset + 2];
            }
          const granule = 1 - Math.exp(-2 * coverage);
          const speckle = noise(u, v, 144, 144, seed ^ 0x3b87);
          color = 0.035 + 0.59 * granule + (0.22 * pigment) / (1 + coverage);
          height = 0.25 + 0.18 * granule + 0.002 * speckle;
          roughness = preset.roughness - 0.06 * granule + 0.02 * speckle;
          occlusion = 0.83 + 0.17 * granule;
          return;
        };
      case 'rubber':
        return () => {
          const distance = wrappedFeature(u, v, 44, seed ^ 0x8e53);
          const pebble = 1 - smooth(clamp((distance - 0.08) / 0.55));
          // Fine molded stipple, with much shallower relief than leather grain.
          color = 0.19 + 0.38 * pebble + 0.19 * fine + 0.1 * detail;
          height = 0.19 + 0.49 * pebble + 0.15 * fine + 0.06 * detail;
          roughness += 0.12 * (fine - 0.5) - 0.045 * pebble;
          occlusion = 0.9 + 0.08 * pebble + 0.02 * fine;
          return;
        };
      case 'carbonfiber':
        return () => {
          const x = 12 * (u + v),
            y = 12 * (v - u);
          const warp = 0.5 + 0.5 * Math.cos(TAU * x),
            weft = 0.5 + 0.5 * Math.cos(TAU * y);
          // Smooth two-over/two-under ownership of diagonal tow bundles.
          const over = smooth(
            clamp(0.5 + 0.9 * Math.cos((Math.PI * (x - y)) / 2)),
          );
          const warpFiber =
            0.5 + 0.5 * Math.sin(TAU * (4 * x + 0.08 * detail) + phase);
          const weftFiber =
            0.5 + 0.5 * Math.sin(TAU * (4 * y + 0.08 * detail) + phase);
          const tow = warp * over + weft * (1 - over);
          const fiber = warpFiber * over + weftFiber * (1 - over);
          color = 0.12 + 0.46 * tow + 0.2 * fiber + 0.12 * detail;
          // Resin smooths the weave; its sheen remains dielectric, not metallic.
          height = 0.25 + 0.37 * tow + 0.055 * fiber + 0.04 * detail;
          roughness += 0.065 * (detail - 0.5) + 0.045 * (1 - tow);
          occlusion = 0.88 + 0.1 * tow + 0.02 * fiber;
          return;
        };
      case 'diamondplate':
        return () => {
          const x = u * 8,
            y = v * 8;
          const dx = fract(x) - 0.5,
            dy = fract(y) - 0.5;
          const direction = (Math.floor(x) + Math.floor(y)) % 2 === 0 ? 1 : -1;
          const along = (dx + direction * dy) * Math.SQRT1_2,
            across = (dy - direction * dx) * Math.SQRT1_2;
          const distance = Math.abs(along) / 0.48 + Math.abs(across) / 0.14;
          // Each beveled lozenge ends strictly inside its cell, so alternating
          // orientation never introduces an ownership discontinuity at cell edges.
          const raised = smooth(clamp((1 - distance) / 0.24));
          const rolled = noise(u, v, 4, 64, seed ^ 0x35e1);
          color = 0.35 + 0.25 * rolled + 0.29 * raised + 0.07 * detail;
          height = 0.08 + 0.78 * raised + 0.025 * rolled;
          roughness += 0.14 * (rolled - 0.5) - 0.075 * raised;
          occlusion = 0.94 + 0.05 * raised + 0.01 * detail;
          return;
        };
      case 'knurledmetal':
        return () => {
          const across = smooth(0.5 - 0.5 * Math.cos(TAU * 24 * (u + v))),
            along = smooth(0.5 - 0.5 * Math.cos(TAU * 24 * (u - v)));
          // Intersecting cuts leave small diamond crowns, not isolated tread bars.
          const crown = across * along;
          color = 0.29 + 0.48 * crown + 0.16 * detail;
          height = 0.12 + 0.72 * crown + 0.025 * detail;
          roughness += 0.1 * (detail - 0.5) + 0.07 * (1 - crown);
          occlusion = 0.85 + 0.14 * crown;
          return;
        };
      case 'engineturned':
        return () => {
          const x = u * 6,
            y = v * 6;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let total = 0,
            scratches = 0,
            sheen = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % 6) + 6) % 6,
                wy = ((cy % 6) + 6) % 6;
              const dx = x - cx - 0.25 - 0.5 * (wy % 2),
                dy = y - cy - 0.5;
              const radiusSquared = dx * dx + dy * dy;
              const cap = Math.max(0, 1 - radiusSquared / 0.9025);
              const weight = cap * cap;
              const offset = (wy * 6 + wx) * 2;
              const turn = turnedDisks![offset];
              const scratch =
                0.5 +
                0.5 *
                  Math.cos(TAU * (10 * radiusSquared + turn + 0.18 * dx * dy));
              total += weight;
              scratches += weight * scratch;
              sheen += weight * turnedDisks![offset + 1];
            }
          // Compact C1 disk supports and normalized convex ownership avoid both
          // hard nearest-disk seams and unbounded overlap sums. Coverage is total.
          scratches /= total;
          sheen /= total;
          color = 0.35 + 0.34 * sheen + 0.22 * scratches + 0.04 * detail;
          height = 0.44 + 0.07 * scratches + 0.025 * detail;
          roughness += 0.18 * (scratches - 0.5) + 0.12 * (sheen - 0.5);
          occlusion = 0.98 + 0.015 * scratches;
          return;
        };
      case 'goldleaf':
        return () => {
          const warp = noise(u, v, 4, 5, seed ^ 0x4d83);
          const patchU = u + 0.035 * Math.sin(TAU * v * 3 + phase),
            patchV = v + 0.03 * Math.sin(TAU * u * 4 + phase);
          const patch = noise(patchU, patchV, 4, 5, seed ^ 0x1e59);
          const lapU = smooth(
            clamp((Math.cos(TAU * 4 * patchU) - 0.92) / 0.08),
          );
          const lapV = smooth(
            clamp((Math.cos(TAU * 5 * patchV) - 0.92) / 0.08),
          );
          const lap = lapU + (1 - lapU) * lapV;
          const foldA = Math.pow(
            0.5 + 0.5 * Math.cos(TAU * (18 * u + 7 * v + 1.7 * warp) + phase),
            8,
          );
          const foldB = Math.pow(
            0.5 + 0.5 * Math.cos(TAU * (5 * u - 21 * v + 1.3 * patch) - phase),
            10,
          );
          const wrinkle = 0.6 * foldA + 0.4 * foldB;
          // Thin overlapping sheets carry crumpled folds, not deep cracks or
          // translucent foil; all relief remains in the four opaque surface maps.
          color = 0.4 + 0.3 * patch + 0.19 * wrinkle - 0.1 * lap;
          height = 0.36 + 0.34 * wrinkle + 0.065 * lap + 0.04 * detail;
          roughness += 0.12 * (patch - 0.5) + 0.11 * wrinkle + 0.025 * lap;
          occlusion = 0.99 - 0.065 * wrinkle - 0.025 * lap;
          return;
        };
      case 'paper':
        return () => {
          const formation = noise(u, v, 3, 5, seed ^ 0x81b7);
          const tooth = noise(u, v, 48, 48, seed ^ 0x57d3);
          const cells = 24;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let fibers = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.35 - 0.3 * hash(wx, wy, seed),
                dy = y - cy - 0.35 - 0.3 * hash(wx, wy, seed ^ 0x193f);
              const angle = TAU * hash(wx, wy, seed ^ 0x72e1);
              const along = dx * Math.cos(angle) + dy * Math.sin(angle),
                across = dy * Math.cos(angle) - dx * Math.sin(angle);
              const length = 0.42 + 0.28 * hash(wx, wy, seed ^ 0x5b29);
              // Short, randomly oriented pulp fibers have compact support, so
              // neighboring cells blend without changing ownership at their edges.
              const distance =
                (along * along) / (length * length) +
                (across * across) / 0.0064;
              const fiber = Math.pow(clamp(1 - distance), 2);
              fibers = Math.max(fibers, fiber);
            }
          color = 0.62 + 0.24 * formation + 0.1 * tooth - 0.2 * fibers;
          height = 0.22 + 0.12 * formation + 0.22 * tooth + 0.3 * fibers;
          roughness += 0.08 * (tooth - 0.5) + 0.04 * fibers;
          occlusion = 0.98 - 0.07 * fibers - 0.035 * (1 - tooth);
          return;
        };
      case 'reedmat':
        return () => {
          const x = u * 16,
            band = Math.floor(x),
            across = (fract(x) - 0.5) / 0.46;
          const reed = smooth(clamp(1 - across * across));
          const variation = fiberBands![band * 2],
            fiberPhase = fiberBands![band * 2 + 1];
          const fiber =
            0.5 +
            0.5 *
              Math.sin(TAU * x * 7 + 0.2 * Math.sin(TAU * v * 3) + fiberPhase);
          const thread = smooth(clamp(1 - (1 - Math.cos(TAU * v * 4)) / 0.055));
          const threadFiber = 0.5 + 0.5 * Math.cos(TAU * u * 96 + phase);
          color =
            0.15 +
            reed * (0.38 + 0.14 * variation + 0.09 * fiber) +
            thread * (0.12 + 0.04 * threadFiber);
          height =
            0.1 +
            reed * (0.46 + 0.055 * variation + 0.018 * fiber) +
            thread * (0.24 + 0.015 * threadFiber);
          roughness +=
            0.06 * (1 - reed) - 0.035 * reed * fiber + 0.025 * thread;
          occlusion = 0.56 + 0.32 * reed + 0.07 * thread;
          return;
        };
      case 'rope':
        return () => {
          const x = u * 6,
            band = Math.floor(x),
            local = fract(x) - 0.5;
          const body = smooth(clamp(1 - (local / 0.48) ** 2));
          const variation = fiberBands![band * 2],
            twistPhase = fiberBands![band * 2 + 1];
          const helix = TAU * (3 * local - 6 * v) + twistPhase;
          const strand = 0.5 + 0.5 * Math.cos(helix),
            fiber =
              0.5 + 0.5 * Math.cos(helix * 9 + 0.15 * Math.sin(TAU * v * 2));
          // Three diagonal constituent crowns per rope band, never crossing loops.
          color =
            0.13 +
            body * (0.3 + 0.14 * variation + 0.23 * strand + 0.06 * fiber);
          height = 0.08 + body * (0.34 + 0.32 * strand + 0.018 * fiber);
          roughness += 0.065 * (1 - body) + body * (0.025 - 0.045 * fiber);
          occlusion = 0.43 + body * (0.35 + 0.17 * strand);
          return;
        };
      case 'straw':
        return () => {
          const x = u * 8,
            y = v * 8,
            ix = Math.floor(x),
            iy = Math.floor(y);
          color = 0.17 + 0.07 * detail;
          height = 0.15 + 0.015 * detail;
          occlusion = 0.55 + 0.035 * detail;
          for (let layer = 0; layer < 3; layer++)
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                const cx = ix + ox,
                  cy = iy + oy;
                const offset =
                  ((layer * 8 + (((cy % 8) + 8) % 8)) * 8 +
                    (((cx % 8) + 8) % 8)) *
                  9;
                const dx = x - cx - strawStems![offset],
                  dy = y - cy - strawStems![offset + 1];
                const along =
                    (dx * strawStems![offset + 2] +
                      dy * strawStems![offset + 3]) /
                    strawStems![offset + 4],
                  across =
                    (dy * strawStems![offset + 2] -
                      dx * strawStems![offset + 3]) /
                    strawStems![offset + 5];
                const stem =
                  smooth(clamp((1 - along * along) / 0.24)) *
                  smooth(clamp(1 - across * across));
                if (stem === 0) continue;
                const variation = strawStems![offset + 6];
                const fiber =
                  0.5 + 0.5 * Math.cos(12 * across + strawStems![offset + 7]);
                const node =
                  strawStems![offset + 8] > 0.6
                    ? smooth(clamp(1 - ((along - 0.2) / 0.065) ** 2))
                    : 0;
                // All ownership, including nodes and fibers, fades with support.
                color =
                  color * (1 - stem) +
                  stem * (0.48 + 0.26 * variation + 0.07 * fiber - 0.13 * node);
                height =
                  height * (1 - stem) +
                  stem *
                    (0.51 +
                      0.06 * layer +
                      0.04 * variation +
                      0.018 * fiber +
                      0.055 * node);
                roughness =
                  roughness * (1 - stem) +
                  stem * (preset.roughness - 0.04 * fiber + 0.025 * node);
                occlusion =
                  occlusion * (1 - stem) + stem * (0.91 + 0.045 * fiber);
              }
          return;
        };
      case 'wicker':
        return () => {
          const x = u * 6,
            y = v * 6;
          const warpCrown = 0.5 + 0.5 * Math.cos(TAU * x),
            weftCrown = 0.5 + 0.5 * Math.cos(TAU * y);
          const warp = smooth(clamp((Math.cos(TAU * x) + 0.92) / 0.3)),
            weft = smooth(clamp((Math.cos(TAU * y) + 0.92) / 0.3));
          const over = smooth(
            clamp(0.5 + 1.4 * Math.cos(Math.PI * x) * Math.cos(Math.PI * y)),
          );
          const warpTop = warp * (1 - weft + weft * over),
            weftTop = weft * (1 - warp + warp * (1 - over));
          const coverage = warpTop + weftTop;
          const warpGrain = noise(u, v, 72, 4, seed ^ 0x6f31),
            weftGrain = noise(u, v, 4, 72, seed ^ 0x2a97);
          const grain = warpTop * warpGrain + weftTop * weftGrain;
          const crown = warpTop * warpCrown + weftTop * weftCrown;
          // Broad solid rattan ribbons have rolled shoulders and longitudinal
          // grain, rather than the narrow twisted yarns of coarse burlap.
          color = 0.08 + 0.5 * coverage + 0.16 * crown + 0.18 * grain;
          height = 0.04 + 0.48 * coverage + 0.32 * crown + 0.045 * grain;
          roughness +=
            0.1 * (detail - 0.5) + 0.1 * (1 - coverage) - 0.04 * grain;
          occlusion = 0.34 + 0.54 * coverage + 0.1 * crown;
          return;
        };
      case 'bamboo':
        return () => {
          const grain = noise(u, v, 64, 4, seed ^ 0x4b71);
          const wander = noise(u, v, 4, 3, seed ^ 0x691d);
          const fiber =
            0.5 + 0.5 * Math.sin(TAU * (48 * u + 0.22 * wander) + phase);
          const stagger = noise(u, 0, 4, 1, seed ^ 0x28d5);
          const ring =
            1 -
            Math.cos(
              TAU * (3 * v + 0.65 * stagger + 0.07 * Math.sin(TAU * 4 * u)) +
                phase,
            );
          const node = 1 - smooth(clamp(ring / 0.16));
          const shoulder = 1 - smooth(clamp(ring / 0.42));
          // Continuous phase staggering bends the darker node bands across the
          // fiber field without introducing plank seams or segmented geometry.
          color =
            0.46 + 0.23 * grain + 0.16 * fiber + 0.08 * detail - 0.34 * node;
          height =
            0.3 + 0.14 * grain + 0.12 * fiber + 0.16 * shoulder - 0.1 * node;
          roughness += 0.12 * node + 0.1 * (grain - 0.5) - 0.035 * fiber;
          occlusion = 0.99 - 0.14 * node - 0.025 * (1 - grain);
          return;
        };
      case 'hammeredmetal':
        return () => {
          const cells = 12;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let impressions = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.35 - 0.3 * hash(wx, wy, seed),
                dy = y - cy - 0.35 - 0.3 * hash(wx, wy, seed ^ 0x729b);
              const radius = 0.85 + 0.25 * hash(wx, wy, seed ^ 0x193d);
              // Rounded tool impressions overlap with zero slope at their support
              // edges; summing them avoids nearest-site ridges in the copper.
              const cap = clamp(1 - (dx * dx + dy * dy) / (radius * radius));
              impressions +=
                cap * cap * (0.7 + 0.3 * hash(wx, wy, seed ^ 0x5a17));
            }
          const dent = 1 - Math.exp(-1.6 * impressions);
          const polish = noise(u, v, 4, 4, seed ^ 0x4e21);
          color = 0.72 - 0.32 * dent + 0.14 * polish + 0.045 * detail;
          height = 0.85 - 0.7 * dent + 0.008 * detail;
          roughness += 0.1 * (polish - 0.5) + 0.09 * dent;
          occlusion = 0.99 - 0.12 * dent;
          return;
        };
      case 'galvanized':
        return () => {
          const cells = 10;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let weight = 0,
            pigment = 0,
            rays = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.35 - 0.3 * hash(wx, wy, seed),
                dy = y - cy - 0.35 - 0.3 * hash(wx, wy, seed ^ 0x3b79);
              const angle = TAU * hash(wx, wy, seed ^ 0x57a3);
              const along = dx * Math.cos(angle) + dy * Math.sin(angle),
                across = dy * Math.cos(angle) - dx * Math.sin(angle);
              // Compact high-power weights create flat-looking zinc spangles
              // with feathered crystallite boundaries, not raised stone chips.
              const cap = Math.pow(clamp(1 - (dx * dx + dy * dy) / 1.21), 8);
              const variation = hash(wx, wy, seed ^ 0x49d1);
              const ray =
                0.5 +
                0.5 * Math.cos(TAU * (3 * across + 1.5 * Math.abs(along)));
              weight += cap;
              pigment += cap * variation;
              rays += cap * ray;
            }
          const inv = 1 / Math.max(weight, 1e-12);
          const crystallite = pigment * inv,
            ray = rays * inv;
          color = 0.18 + 0.65 * crystallite + 0.12 * ray + 0.035 * detail;
          height = 0.3 + 0.18 * crystallite + 0.035 * ray + 0.015 * detail;
          roughness += 0.24 * (crystallite - 0.5) + 0.045 * (ray - 0.5);
          occlusion = 0.98 + 0.02 * crystallite;
          return;
        };
      case 'corrugatedmetal':
        return () => {
          const flute = 0.5 + 0.5 * Math.cos(TAU * 8 * u + phase);
          const rolled = noise(u, v, 64, 4, seed ^ 0x1f6b);
          const wear = Math.pow(0.5 + 0.5 * Math.sin(TAU * 48 * u + phase), 12);
          // A continuous rolled sheet: the large-scale flutes affect only its
          // normal map, with faint longitudinal wear rather than panel joints.
          color = 0.5 + 0.2 * flute + 0.16 * rolled - 0.06 * wear;
          height = 0.1 + 0.8 * flute + 0.004 * rolled - 0.002 * wear;
          roughness += 0.13 * (rolled - 0.5) + 0.06 * wear;
          occlusion = 0.91 + 0.08 * flute;
          return;
        };
      case 'perforatedmetal':
        return () => {
          const cells = 6;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Even row counts keep the staggered half-cell hole lattice periodic.
          let recess = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const shift = (((cy % 2) + 2) % 2) * 0.5;
              const dx = x - cx - 0.5 - shift,
                dy = y - cy - 0.5;
              const distance = Math.sqrt(dx * dx + dy * dy);
              // Flat hole floors sink below the sheet and rise back at the rim
              // with zero slope; supports stop before a discarded cell matters.
              const hole = smooth(clamp((0.3 - distance) / 0.12));
              recess += (1 - recess) * hole;
            }
          color = 0.62 + 0.1 * detail - 0.44 * recess;
          height = 0.82 - 0.62 * recess + 0.03 * detail;
          roughness += 0.07 * recess + 0.04 * (detail - 0.5);
          occlusion = 1 - 0.78 * recess;
          return;
        };
      case 'expandedmetal':
        return () => {
          // Two diagonal strand families join smoothly at shared nodes and
          // leave recessed rhombic openings between their rounded shoulders.
          const strandA = smooth(
            clamp((Math.cos(TAU * 5 * (u + v)) - 0.1) / 0.9),
          );
          const strandB = smooth(
            clamp((Math.cos(TAU * 5 * (u - v)) - 0.1) / 0.9),
          );
          const lattice = strandA + strandB - strandA * strandB;
          const node = strandA * strandB;
          const opening = 1 - lattice;
          color = 0.7 + 0.1 * detail - 0.42 * opening;
          height = 0.22 + 0.6 * lattice + 0.09 * node + 0.025 * detail;
          roughness += 0.08 * opening + 0.03 * (detail - 0.5);
          occlusion = 0.34 + 0.62 * lattice;
          return;
        };
      case 'wiremesh':
        return () => {
          const x = u * 12,
            y = v * 12;
          // Squared caps round each wire crest and vanish with zero slope
          // at the half-cell support, so the fract jumps land in flat gaps.
          const cap = (q: number): number => {
            const span = clamp(1 - q * q);
            return span * span;
          };
          const warp = cap((fract(x) - 0.5) / 0.34),
            weft = cap((fract(y) - 0.5) / 0.34);
          // Over-under crimp alternates at every crossing and eases to equal
          // tension halfway between them, so no seam opens along a float.
          const over = 0.5 + 0.5 * Math.cos(Math.PI * (x - y));
          const top = warp * over + weft * (1 - over),
            under = weft * over + warp * (1 - over);
          const exposed = under * (1 - top);
          color = 0.3 + 0.46 * top + 0.2 * exposed + 0.08 * detail;
          height = 0.08 + 0.78 * top + 0.34 * exposed + 0.03 * detail;
          roughness += 0.04 * (1 - top) + 0.03 * (detail - 0.5);
          occlusion = 0.36 + 0.56 * top + 0.18 * exposed;
          return;
        };
      case 'velvet':
        return () => {
          // Dense upright pile stays flat while soft crush clouds shift the
          // nap's pigment and sheen without introducing hard pile edges.
          const crush = noise(u, v, 5, 5, seed ^ 0x7c31);
          const drift = noise(u, v, 3, 9, seed ^ 0x2a17);
          const nap = noise(u, v, 96, 96, seed ^ 0x5f2d);
          color = 0.3 + 0.32 * crush + 0.12 * nap;
          height = 0.42 + 0.06 * crush + 0.05 * nap;
          roughness += 0.12 * (crush - 0.5) + 0.035 * (drift - 0.5);
          occlusion = 0.92 + 0.06 * crush;
          return;
        };
      case 'terrycloth':
        return () => {
          const columns = 10,
            rows = 8;
          const x = u * columns,
            y = v * rows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Even row counts keep the staggered half-cell loop lattice periodic.
          let loops = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const shift = (((cy % 2) + 2) % 2) * 0.5;
              const dx = x - cx - 0.5 - shift,
                dy = y - cy - 0.5;
              const distance = Math.sqrt(dx * dx + dy * dy);
              // Rounded loop crowns rise over the ground and vanish with
              // zero slope before a discarded cell can matter.
              const cap = clamp(1 - (distance / 0.36) ** 2);
              loops += (1 - loops) * cap * cap;
            }
          color = 0.42 + 0.3 * loops + 0.16 * detail;
          height = 0.3 + 0.62 * loops + 0.05 * detail;
          roughness += 0.05 * (detail - 0.5) - 0.03 * loops;
          occlusion = 0.62 + 0.35 * loops;
          return;
        };
      case 'boucle':
        return () => {
          const rows = 6,
            cells = 8;
          const x = u * cells,
            y = v * rows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Yarn courses run along u; squared caps round each course crown
          // and meet the channel with zero slope at the half-row support.
          const across = fract(y) - 0.5;
          const span = clamp(1 - (across / 0.36) ** 2);
          const yarn = span * span;
          let rings = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % rows) + rows) % rows;
              const dx =
                  x - cx - 0.5 - 0.3 * (hash(wx, wy, seed ^ 0x6a2d) - 0.5),
                dy = y - cy - 0.5 - 0.18 * (hash(wx, wy, seed ^ 0x33f1) - 0.5);
              const distance = Math.sqrt(dx * dx + dy * dy);
              // Annular loop crests curl over the yarn around recessed
              // centers and vanish with zero slope at the ring support.
              const band = clamp(1 - ((distance - 0.16) / 0.075) ** 2);
              rings += (1 - rings) * band * band;
            }
          const channel = 1 - yarn;
          color = 0.36 + 0.34 * yarn + 0.14 * rings + 0.12 * detail;
          height = 0.16 + 0.5 * yarn + 0.26 * rings + 0.04 * detail;
          roughness += 0.06 * channel + 0.03 * (detail - 0.5);
          occlusion = 0.58 + 0.3 * yarn + 0.1 * rings;
          return;
        };
      case 'geode':
        return () => {
          // Bands share a fixed tile center so one UV tile stays a full
          // radial section, while seeded warping keeps the rings organic.
          const dx = fract(u) - 0.5,
            dy = fract(v) - 0.5;
          // Sinusoidal wrap keeps the radial distance smooth across seams.
          const sx = Math.sin(Math.PI * dx) / Math.PI,
            sy = Math.sin(Math.PI * dy) / Math.PI;
          const radius = Math.sqrt(sx * sx + sy * sy);
          const warp = noise(u, v, 6, 6, seed ^ 0x3c17);
          // The banding fades flat before the center so the radial distance
          // leaves no cone behind at the origin.
          const ringFade = smooth(clamp((radius - 0.1) / 0.08));
          const band =
            0.5 +
            0.5 * ringFade * Math.cos(TAU * (9 * radius + 0.12 * warp) + phase);
          // A fine crystalline druse core breaks the smooth mineral banding.
          const core = smooth(clamp((0.17 - radius) / 0.05));
          const facet = noise(u, v, 48, 48, seed ^ 0x5921);
          const druse = core * facet;
          color = 0.3 + 0.3 * band + 0.22 * druse + 0.12 * detail;
          height = 0.3 + 0.3 * band + 0.2 * druse + 0.03 * detail;
          roughness += 0.1 * (1 - band) + 0.08 * druse + 0.03 * (detail - 0.5);
          occlusion = 0.72 + 0.22 * band + 0.04 * druse;
          return;
        };
      case 'quartz':
        return () => {
          const cells = 5;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Hexagonal prism tops carry pyramidal apices; products of C1
          // half-plane shoulders keep every facet edge differentiable.
          let columns = 0,
            tops = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const px = cx + 0.5 + 0.24 * (hash(wx, wy, seed ^ 0x4c21) - 0.5),
                py = cy + 0.5 + 0.24 * (hash(wx, wy, seed ^ 0x71b3) - 0.5);
              const dx = x - px,
                dy = y - py;
              let shoulder = 1;
              for (let k = 0; k < 6; k++) {
                const angle =
                  (Math.PI / 3) * k +
                  0.22 * (hash(wx, wy, seed ^ 0x5d77) - 0.5);
                const across = Math.abs(
                  dx * Math.cos(angle) + dy * Math.sin(angle),
                );
                shoulder *= smooth(clamp((0.3 - across) / 0.055));
              }
              const top = 0.34 + 0.42 * hash(wx, wy, seed ^ 0x2f19);
              const distance = Math.sqrt(dx * dx + dy * dy);
              const tip = clamp(1 - (distance / 0.21) ** 2);
              columns += (1 - columns) * shoulder;
              tops += (1 - tops) * shoulder * (top + 0.24 * tip * tip);
            }
          color = 0.52 + 0.26 * tops + 0.12 * detail;
          height = 0.16 + 0.72 * tops + 0.03 * detail;
          roughness += 0.1 * (1 - columns) + 0.03 * (detail - 0.5);
          occlusion = 0.5 + 0.46 * columns;
          return;
        };
      case 'pyrite':
        return () => {
          const cells = 5;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Interlocking cube tops step at varied heights; squared shoulders
          // stay differentiable through products of C1 half-plane caps.
          let cubes = 0,
            tops = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const px = cx + 0.5 + 0.2 * (hash(wx, wy, seed ^ 0x1c41) - 0.5),
                py = cy + 0.5 + 0.2 * (hash(wx, wy, seed ^ 0x3f27) - 0.5);
              const angle = 0.28 * (hash(wx, wy, seed ^ 0x6b5d) - 0.5);
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const dx = x - px,
                dy = y - py;
              const lx = Math.abs(dx * cos + dy * sin),
                ly = Math.abs(dy * cos - dx * sin);
              const face =
                smooth(clamp((0.32 - lx) / 0.05)) *
                smooth(clamp((0.32 - ly) / 0.05));
              const top = 0.3 + 0.45 * hash(wx, wy, seed ^ 0x51af);
              cubes += (1 - cubes) * face;
              tops += (1 - tops) * face * top;
            }
          // Fine parallel striations cut across every exposed cube top.
          const groove = 0.5 + 0.5 * Math.cos(TAU * 26 * (u + v) + phase);
          const striation = cubes * smooth(groove);
          color = 0.5 + 0.24 * tops + 0.1 * striation + 0.1 * detail;
          height = 0.18 + 0.6 * tops + 0.06 * striation + 0.03 * detail;
          roughness += 0.07 * (1 - striation) + 0.03 * (detail - 0.5);
          occlusion = 0.52 + 0.42 * cubes;
          return;
        };
      case 'shiplap':
        return () => {
          const rows = 5;
          const y = v * rows,
            iy = Math.floor(y);
          const wy = ((iy % rows) + rows) % rows;
          // Lap boards shadow their lower overlap while grain runs along
          // each board; the seam fades in and out with zero slope.
          const dist = 0.5 - Math.abs(fract(y) - 0.5);
          const seam = smooth(clamp((0.07 - dist) / 0.05));
          // Board tones fade into the shared seam so ownership never jumps.
          const board = 0.5 + 0.36 * hash(wy, 0, seed ^ 0x2c61) * (1 - seam);
          const grain = noise(u, v, 48, 6, seed ^ 0x47b9);
          const streak = noise(u, v, 12, 2, seed ^ 0x6d23);
          color =
            0.24 + 0.36 * board + 0.16 * grain + 0.1 * streak - 0.18 * seam;
          height = 0.72 - 0.5 * seam + 0.08 * grain + 0.03 * streak;
          roughness += 0.05 * (grain - 0.5) + 0.06 * seam;
          occlusion = 1 - 0.55 * seam;
          return;
        };
      case 'glassblock':
        return () => {
          const cells = 4;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Rounded block faces rise over recessed seams; products of C1
          // half-plane shoulders round every corner before the seam.
          let faces = 0,
            bubbles = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.5,
                dy = y - cy - 0.5;
              const face =
                smooth(clamp((0.42 - Math.abs(dx)) / 0.05)) *
                smooth(clamp((0.42 - Math.abs(dy)) / 0.05));
              const bx = dx - 0.2 * (hash(wx, wy, seed ^ 0x51c7) - 0.5),
                by = dy - 0.2 * (hash(wx, wy, seed ^ 0x78a1) - 0.5);
              const distance = Math.sqrt(bx * bx + by * by);
              // Tiny trapped bubbles dome inside the glass faces.
              const cap = clamp(1 - (distance / 0.07) ** 2);
              const bubble = cap * cap;
              faces += (1 - faces) * face;
              bubbles += (1 - bubbles) * face * bubble;
            }
          color = 0.55 + 0.2 * faces + 0.12 * bubbles + 0.1 * detail;
          height = 0.24 + 0.6 * faces + 0.05 * bubbles + 0.02 * detail;
          roughness += 0.12 * (1 - faces) - 0.03 * bubbles;
          occlusion = 0.45 + 0.5 * faces;
          return;
        };
      case 'thatch':
        return () => {
          const rows = 6;
          const y = v * rows;
          // Layered straw courses hang over their laps; fine streaks carry
          // individual straws down the slope between soft course shadows.
          const course =
            0.5 +
            0.5 *
              Math.cos(
                TAU * (fract(y) - 0.25) +
                  0.5 * noise(u, v, 3, 6, seed ^ 0x1d4b),
              );
          const straw = noise(u, v, 80, 6, seed ^ 0x3f8d);
          const lap = smooth(clamp((0.14 - Math.abs(fract(y) - 0.73)) / 0.07));
          color =
            0.3 + 0.32 * course + 0.18 * straw + 0.1 * detail - 0.12 * lap;
          height = 0.32 + 0.36 * course + 0.22 * straw - 0.3 * lap;
          roughness += 0.05 * (straw - 0.5) + 0.05 * lap;
          occlusion = 0.68 + 0.28 * course - 0.3 * lap;
          return;
        };
      case 'charredwood':
        return () => {
          const cells = 9;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Rounded charcoal scales lift above deep alligator cracks; caps
          // fade with zero slope before a discarded cell can matter.
          let plates = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx =
                  x - cx - 0.5 - 0.24 * (hash(wx, wy, seed ^ 0x4a17) - 0.5),
                dy = y - cy - 0.5 - 0.24 * (hash(wx, wy, seed ^ 0x73bd) - 0.5);
              const distance = Math.sqrt(dx * dx + dy * dy);
              const cap = smooth(clamp((0.36 - distance) / 0.08));
              plates += (1 - plates) * cap;
            }
          const grain = noise(u, v, 64, 64, seed ^ 0x2f51);
          color = 0.12 + 0.24 * plates + 0.14 * grain;
          height = 0.2 + 0.66 * plates + 0.05 * grain;
          roughness += 0.08 * (1 - plates) + 0.03 * (grain - 0.5);
          occlusion = 0.36 + 0.6 * plates;
          return;
        };
      case 'driftwood':
        return () => {
          // Weathered cracks open along the grain while silvered ridges run
          // the length of the board with zero slope at every crack wall.
          const warp = noise(u, v, 4, 3, seed ^ 0x1c8b);
          const grain = noise(u, v, 64, 3, seed ^ 0x55e1);
          const streak = noise(u, v, 12, 2, seed ^ 0x39af);
          const f = fract(v * 7 + 0.12 * warp);
          const edge = Math.min(f, 1 - f);
          const crack = smooth(clamp((0.1 - edge) / 0.05));
          color = 0.42 + 0.26 * grain + 0.12 * streak - 0.24 * crack;
          height = 0.62 + 0.18 * grain + 0.04 * streak - 0.5 * crack;
          roughness += 0.06 * (grain - 0.5) + 0.08 * crack;
          occlusion = 1 - 0.62 * crack;
          return;
        };
      case 'peelingpaint':
        return () => {
          // Smooth noise opens peeled patches; the boundary rim curls up
          // between the intact paint face and the exposed substrate.
          const warp = noise(u, v, 5, 5, seed ^ 0x6f2d);
          const peel = smooth(
            clamp((noise(u, v, 3, 3, seed ^ 0x4b71) - 0.55) / 0.08),
          );
          const rim = 4 * peel * (1 - peel);
          const substrate = noise(u, v, 40, 40, seed ^ 0x2ad3);
          const paint = 1 - peel;
          color =
            0.66 * paint +
            0.3 * peel +
            0.16 * rim +
            0.1 * substrate * peel +
            0.12 * (0.5 + 0.5 * warp) * paint;
          height = 0.24 + 0.42 * paint + 0.3 * rim + 0.05 * substrate;
          roughness += 0.12 * peel + 0.05 * (substrate - 0.5);
          occlusion = 0.52 + 0.36 * paint + 0.16 * rim;
          return;
        };
      case 'tiretread':
        return () => {
          const rows = 6,
            columns = 4;
          const x = u * columns,
            y = v * rows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Staggered tread blocks step above their grooves; squared C1
          // shoulders round every block corner before the groove floor.
          let blocks = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const shift = (((cy % 2) + 2) % 2) * 0.5;
              const dx = x - cx - 0.5 - shift,
                dy = y - cy - 0.5;
              const face =
                smooth(clamp((0.34 - Math.abs(dx)) / 0.06)) *
                smooth(clamp((0.32 - Math.abs(dy)) / 0.06));
              blocks += (1 - blocks) * face;
            }
          // Fine lateral sipes cut each block into ribs.
          const sipe = smooth(
            clamp((Math.abs(Math.sin(TAU * 2 * (x + 0.25 * y))) - 0.12) / 0.12),
          );
          color = 0.18 + 0.24 * blocks - 0.08 * sipe * blocks + 0.1 * detail;
          height = 0.22 + 0.58 * blocks - 0.12 * sipe * blocks + 0.03 * detail;
          roughness += 0.06 * (1 - blocks) + 0.03 * (detail - 0.5);
          occlusion = 0.42 + 0.52 * blocks - 0.1 * sipe * blocks;
          return;
        };
      case 'honeycomb':
        return () => {
          const root3 = Math.sqrt(3);
          const columns = 5,
            rows = 4;
          const x = u * columns,
            y = v * rows;
          // Hexagonal wax walls crest around recessed cell floors; products
          // of C1 half-plane shoulders keep wall joints differentiable.
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let floors = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const offset = (((cy % 2) + 2) % 2) * 0.5;
              const dx = x - cx - 0.5 - offset,
                dy = y - cy - 0.5;
              const inside =
                smooth(clamp((0.42 - Math.abs(dx)) / 0.03)) *
                smooth(
                  clamp((0.42 - Math.abs(dx * 0.5 + (dy * root3) / 2)) / 0.03),
                ) *
                smooth(
                  clamp((0.42 - Math.abs(dx * 0.5 - (dy * root3) / 2)) / 0.03),
                );
              // Walls are everything the union of hexagonal floors leaves.
              floors += (1 - floors) * inside;
            }
          const walls = 1 - floors;
          const grain = noise(u, v, 48, 48, seed ^ 0x31c7);
          color = 0.38 + 0.34 * walls + 0.12 * grain;
          height = 0.28 + 0.56 * walls + 0.04 * grain;
          roughness += 0.08 * (1 - walls) + 0.03 * (grain - 0.5);
          occlusion = 0.52 + 0.42 * walls;
          return;
        };
      case 'frost':
        return () => {
          const dx = fract(u) - 0.5,
            dy = fract(v) - 0.5;
          const sx = Math.sin(Math.PI * dx) / Math.PI,
            sy = Math.sin(Math.PI * dy) / Math.PI;
          const radius = Math.sqrt(sx * sx + sy * sy);
          const angle = Math.atan2(sy, sx);
          // Fern arms radiate from the tile center with feathery branchlets
          // and fade flat before the origin keeps the angle cone hidden.
          const fade = smooth(clamp((radius - 0.06) / 0.05));
          // The odd sine keeps the arm phase even in the angle so seams
          // fold back onto identical crystal arms.
          const arm = Math.pow(
            Math.abs(
              Math.cos(
                3 * angle +
                  0.4 *
                    (noise(u, v, 3, 3, seed ^ 0x5c21) - 0.5) *
                    Math.sin(2 * angle),
              ),
            ),
            3,
          );
          const branch = noise(
            u * 6 + 2 * radius,
            v * 6 - 2 * radius,
            24,
            24,
            seed ^ 0x27ab,
          );
          const crystal = fade * arm * (0.55 + 0.45 * branch);
          color = 0.42 + 0.42 * crystal + 0.12 * detail;
          height = 0.28 + 0.58 * crystal + 0.04 * detail;
          roughness += 0.12 * (1 - crystal) + 0.03 * (detail - 0.5);
          occlusion = 0.6 + 0.36 * crystal;
          return;
        };
      case 'stainedglass':
        return () => {
          const cells = 5;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Jittered bisectors cut irregular panes; squared C1 shoulders keep
          // every came junction differentiable and energy marks the came.
          let pane = 0,
            energy = 0,
            tone = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const px = 0.2 + 0.6 * hash(wx, wy, seed ^ 0x3d17),
                py = 0.2 + 0.6 * hash(wx, wy, seed ^ 0x74ab);
              let shoulder = 1;
              for (let ny = -1; ny <= 1; ny++)
                for (let nx = -1; nx <= 1; nx++) {
                  if (!nx && !ny) continue;
                  const ax = (((cx + nx) % cells) + cells) % cells,
                    ay = (((cy + ny) % cells) + cells) % cells;
                  const rx = 0.2 + 0.6 * hash(ax, ay, seed ^ 0x3d17),
                    ry = 0.2 + 0.6 * hash(ax, ay, seed ^ 0x74ab);
                  const dx = nx + rx - px,
                    dy = ny + ry - py;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const across =
                    ((x - cx - px) * dx + (y - cy - py) * dy) / distance;
                  shoulder *= smooth(clamp((distance / 2 - across) / 0.035));
                }
              const weight = (1 - pane) * shoulder;
              pane += weight;
              energy += weight * weight;
              tone += weight * hash(wx, wy, seed ^ 0x5e33);
            }
          const lead = clamp((1 - energy) * 1.4);
          color = (0.22 + 0.58 * tone) * (1 - 0.45 * lead) + 0.12 * detail;
          height = 0.36 + 0.14 * (1 - lead) + 0.32 * lead + 0.03 * detail;
          roughness += 0.06 * lead + 0.03 * (detail - 0.5);
          occlusion = 0.86 - 0.2 * lead;
          return;
        };
      case 'soapstone':
        return () => {
          // Soft pale veining sweeps over the dark talc ground in wide
          // cloudy bands with fine talc streaking along the polish.
          const smear = noise(u, v, 6, 2, seed ^ 0x2c91);
          const vein = smooth(
            clamp((noise(u, v, 3, 3, seed ^ 0x4c19) - 0.52) / 0.1),
          );
          const talc = noise(u, v, 48, 12, seed ^ 0x61af);
          color = 0.16 + 0.52 * vein + 0.16 * smear + 0.12 * talc;
          height = 0.45 + 0.06 * vein + 0.05 * smear + 0.04 * talc;
          roughness += 0.1 * (1 - vein) + 0.03 * (talc - 0.5);
          occlusion = 0.9 + 0.08 * vein;
          return;
        };
      case 'butcherblock':
        return () => {
          const cells = 4;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // End-grain blocks alternate tones in a checker while joints sink
          // between them and fine pores ring each block face.
          const seamX = 0.5 - Math.abs(fract(x) - 0.5),
            seamY = 0.5 - Math.abs(fract(y) - 0.5);
          const seam = smooth(clamp((0.06 - Math.min(seamX, seamY)) / 0.04));
          // Checker tones fade into the shared joint so ownership never jumps.
          const checker = (((ix + iy) % 2) + 2) % 2;
          const block = (checker ? 0.5 : -0.5) * (1 - seam);
          const grain = noise(u, v, 40, 40, seed ^ 0x37c1);
          const pore = noise(u, v, 96, 96, seed ^ 0x5ad3);
          color = 0.46 + 0.34 * block + 0.14 * grain + 0.1 * pore - 0.12 * seam;
          height = 0.7 - 0.42 * seam + 0.06 * grain + 0.04 * pore;
          roughness += 0.05 * (grain - 0.5) + 0.06 * seam;
          occlusion = 1 - 0.5 * seam;
          return;
        };
      case 'wallpaper':
        return () => {
          // Motif coordinates fold through squares and absolute offsets so
          // the damask repeats with exact mirror symmetry on every axis.
          const ax = Math.abs(fract(u * 2) - 0.5),
            ay = Math.abs(fract(v * 2) - 0.5);
          const q = ax * ax + ay * ay;
          const ring = 0.5 + 0.5 * Math.cos(TAU * 3.5 * q + phase);
          const motif = smooth(clamp((0.22 - q) / 0.08)) * ring;
          color = 0.34 + 0.3 * motif + 0.12 * detail;
          height = 0.34 + 0.28 * motif;
          roughness += 0.08 * (1 - motif) + 0.03 * (detail - 0.5);
          occlusion = 0.82 + 0.16 * motif;
          return;
        };
      case 'embroidery':
        return () => {
          const cells = 6;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Satin stitches lie as aligned tapered caps and fade with zero
          // slope at their support before a discarded cell can matter.
          let stitches = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const angle = 0.6 * (hash(wx, wy, seed ^ 0x2f31) - 0.5);
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const px = cx + 0.5 + 0.16 * (hash(wx, wy, seed ^ 0x41c7) - 0.5),
                py = cy + 0.5 + 0.16 * (hash(wx, wy, seed ^ 0x6d23) - 0.5);
              const dx = x - px,
                dy = y - py;
              const along = (dx * cos + dy * sin) / 0.34,
                across = (dy * cos - dx * sin) / 0.09;
              const cap = clamp(1 - along * along - across * across);
              stitches += (1 - stitches) * cap * cap;
            }
          color = 0.36 + 0.3 * stitches + 0.14 * detail;
          height = 0.3 + 0.56 * stitches + 0.04 * detail;
          roughness += 0.06 * (detail - 0.5) - 0.03 * stitches;
          occlusion = 0.62 + 0.34 * stitches;
          return;
        };
      case 'macrame':
        return () => {
          const rows = 4,
            columns = 4;
          const x = u * columns,
            y = v * rows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Rounded knots step between twisted crossing cords; even rows
          // keep the staggered knot lattice periodic.
          let knots = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const shift = (((cy % 2) + 2) % 2) * 0.5;
              const dx = x - cx - 0.5 - shift,
                dy = y - cy - 0.5;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const cap = smooth(clamp((0.3 - distance) / 0.1));
              knots += (1 - knots) * cap;
            }
          const twist = 0.5 + 0.5 * Math.cos(TAU * 12 * (x + y) + phase);
          const cord = 0.5 + 0.5 * Math.cos(TAU * 6 * (x - y) + phase);
          color = 0.34 + 0.3 * knots + 0.12 * twist * cord + 0.12 * detail;
          height =
            0.28 +
            0.52 * knots +
            0.14 * (1 - knots) * twist * cord +
            0.04 * detail;
          roughness += 0.06 * (detail - 0.5);
          occlusion = 0.6 + 0.36 * knots;
          return;
        };
      case 'brickpaving':
        return () => {
          const rows = 4,
            columns = 3;
          const x = u * columns,
            y = v * rows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Running-bond pavers step above sandy joints; squared C1
          // shoulders round every paver corner before the joint floor.
          let pavers = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const shift = (((cy % 2) + 2) % 2) * 0.5;
              const dx = x - cx - 0.5 - shift,
                dy = y - cy - 0.5;
              const face =
                smooth(clamp((0.44 - Math.abs(dx)) / 0.05)) *
                smooth(clamp((0.38 - Math.abs(dy)) / 0.05));
              pavers += (1 - pavers) * face;
            }
          const sand = noise(u, v, 64, 64, seed ^ 0x3c17);
          const wear = noise(u, v, 24, 24, seed ^ 0x51af);
          color =
            0.36 +
            0.28 * pavers +
            0.12 * wear +
            0.1 * sand -
            0.1 * (1 - pavers);
          height = 0.26 + 0.56 * pavers + 0.06 * wear + 0.03 * sand;
          roughness += 0.06 * (1 - pavers) + 0.04 * (sand - 0.5);
          occlusion = 0.5 + 0.46 * pavers;
          return;
        };
      case 'steppingstone':
        return () => {
          const cells = 3;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Rounded flagstone pads sit over gritty ground and fade with
          // zero slope before a discarded cell can matter.
          let pads = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx =
                  x - cx - 0.5 - 0.18 * (hash(wx, wy, seed ^ 0x42b1) - 0.5),
                dy = y - cy - 0.5 - 0.18 * (hash(wx, wy, seed ^ 0x6c77) - 0.5);
              const distance = Math.sqrt(dx * dx + dy * dy);
              const cap = smooth(clamp((0.4 - distance) / 0.1));
              pads += (1 - pads) * cap;
            }
          const grit = noise(u, v, 72, 72, seed ^ 0x2d5b);
          const mottle = noise(u, v, 12, 12, seed ^ 0x58c3);
          color = 0.32 + 0.3 * pads + 0.14 * mottle + 0.12 * grit;
          height = 0.24 + 0.58 * pads + 0.06 * mottle + 0.03 * grit;
          roughness += 0.08 * (1 - pads) + 0.04 * (grit - 0.5);
          occlusion = 0.54 + 0.42 * pads;
          return;
        };
      case 'woodendeck':
        return () => {
          const rows = 5,
            columns = 3;
          const x = u * columns,
            y = v * rows;
          const iy = Math.floor(y);
          const wy = ((iy % rows) + rows) % rows;
          const dist = 0.5 - Math.abs(fract(y) - 0.5);
          const gap = smooth(clamp((0.05 - dist) / 0.035));
          // Board tones fade into the shared gap so ownership never jumps.
          const board = 0.5 + 0.3 * hash(wy, 0, seed ^ 0x1b7d) * (1 - gap);
          const grain = noise(u, v, 48, 8, seed ^ 0x39e1);
          let heads = 0,
            slots = 0;
          for (let k = 0; k < 3; k++) {
            const dx = x - (k + 0.5),
              dy = y - iy - 0.5;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Domed screw heads sit proud of the board over recessed slots.
            const dome = smooth(clamp((0.16 - distance) / 0.05));
            const slot =
              dome *
              smooth(
                clamp((0.035 - Math.min(Math.abs(dx), Math.abs(dy))) / 0.02),
              );
            heads += (1 - heads) * dome;
            slots += (1 - slots) * slot;
          }
          color =
            0.42 + 0.24 * board + 0.12 * grain + 0.1 * heads - 0.08 * slots;
          height =
            0.68 - 0.44 * gap + 0.05 * heads - 0.12 * slots + 0.05 * grain;
          roughness += 0.05 * (grain - 0.5) + 0.08 * gap - 0.04 * heads;
          occlusion = 1 - 0.52 * gap - 0.12 * slots;
          return;
        };
      case 'cheese':
        return () => {
          const cells = 6;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Rounded eyes of two sizes sink into the paste with smooth walls
          // and zero slope before a discarded cell can matter.
          let eyes = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx =
                  x - cx - 0.5 - 0.24 * (hash(wx, wy, seed ^ 0x4e17) - 0.5),
                dy = y - cy - 0.5 - 0.24 * (hash(wx, wy, seed ^ 0x72ab) - 0.5);
              const radius =
                0.14 + 0.18 * Math.floor(hash(wx, wy, seed ^ 0x35cf) * 2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              const bowl = smooth(clamp((radius - distance) / (0.35 * radius)));
              eyes += (1 - eyes) * bowl;
            }
          const knife = noise(u, v, 40, 4, seed ^ 0x2b7d);
          const paste = noise(u, v, 24, 24, seed ^ 0x61c3);
          color = 0.56 + 0.26 * paste + 0.1 * knife - 0.3 * eyes;
          height = 0.72 - 0.5 * eyes + 0.04 * paste - 0.03 * knife;
          roughness += 0.06 * (1 - eyes) + 0.03 * (paste - 0.5);
          occlusion = 0.94 - 0.6 * eyes;
          return;
        };
      case 'sugarfrosting':
        return () => {
          const cells = 5;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Piped rosette peaks swell over smooth icing between them.
          let peaks = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx =
                  x - cx - 0.5 - 0.2 * (hash(wx, wy, seed ^ 0x1f8b) - 0.5),
                dy = y - cy - 0.5 - 0.2 * (hash(wx, wy, seed ^ 0x4a2d) - 0.5);
              const distance = Math.sqrt(dx * dx + dy * dy);
              const cap = clamp(1 - (distance / 0.34) ** 2);
              peaks += (1 - peaks) * cap * cap;
            }
          const swirl = noise(u, v, 32, 32, seed ^ 0x7c41);
          color = 0.58 + 0.2 * peaks + 0.1 * swirl + 0.1 * detail;
          height = 0.34 + 0.5 * peaks + 0.06 * swirl + 0.03 * detail;
          roughness += 0.06 * (1 - peaks) + 0.03 * (detail - 0.5);
          occlusion = 0.66 + 0.3 * peaks;
          return;
        };
      case 'candleswax':
        return () => {
          const columns = 6,
            rows = 2;
          const x = u * columns,
            y = v * rows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          // Rounded drips run down the wax with bulging noses; squared caps
          // fade with zero slope at their support.
          let drips = 0,
            noses = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % columns) + columns) % columns,
                wy = ((cy % rows) + rows) % rows;
              const px = cx + 0.5 + 0.3 * (hash(wx, wy, seed ^ 0x24b1) - 0.5),
                py = cy + 0.5;
              const dx = x - px,
                dy = y - py;
              const along = dy / 0.42,
                across = dx / 0.14;
              const cap = clamp(1 - along * along - across * across);
              const drip = cap * cap;
              const nose =
                clamp(1 - ((dy - 0.22) / 0.14) ** 2 - (dx / 0.17) ** 2) ** 2;
              drips += (1 - drips) * drip;
              noses += (1 - noses) * drip * nose;
            }
          const sheen = noise(u, v, 48, 16, seed ^ 0x5d23);
          color = 0.5 + 0.26 * drips + 0.12 * noses + 0.1 * sheen;
          height = 0.3 + 0.42 * drips + 0.16 * noses + 0.05 * sheen;
          roughness += 0.05 * (sheen - 0.5) + 0.05 * (1 - drips);
          occlusion = 0.62 + 0.34 * drips;
          return;
        };
      case 'vinylrecord':
        return () => {
          const dx = fract(u) - 0.5,
            dy = fract(v) - 0.5;
          // Sinusoidal wrap keeps the radial groove field smooth across seams.
          const sx = Math.sin(Math.PI * dx) / Math.PI,
            sy = Math.sin(Math.PI * dy) / Math.PI;
          const radius = Math.sqrt(sx * sx + sy * sy);
          // Fine concentric grooves ring a smooth label disc; the fade keeps
          // the radial distance from leaving a cone at the origin.
          const ringFade = smooth(clamp((radius - 0.18) / 0.06));
          const groove = 0.5 + 0.5 * Math.cos(TAU * 52 * radius + phase);
          const sparkle = noise(u, v, 64, 64, seed ^ 0x31c7);
          color = 0.14 + 0.1 * groove * ringFade + 0.08 * sparkle;
          height = 0.42 + 0.24 * groove * ringFade + 0.02 * sparkle;
          roughness += 0.06 * (1 - groove * ringFade) + 0.03 * (sparkle - 0.5);
          occlusion = 0.88 + 0.1 * groove * ringFade;
          return;
        };
      case 'graphpaper':
        return () => {
          // Minor rules print every twelfth, majors every third; each line
          // sinks slightly into the paper and fades with zero slope.
          const fu = fract(u * 12),
            fv = fract(v * 12);
          const du = Math.min(fu, 1 - fu),
            dv = Math.min(fv, 1 - fv);
          const minor = smooth(clamp((0.05 - Math.min(du, dv)) / 0.03));
          const gu = fract(u * 3),
            gv = fract(v * 3);
          const eu = Math.min(gu, 1 - gu),
            ev = Math.min(gv, 1 - gv);
          const major = smooth(clamp((0.06 - Math.min(eu, ev)) / 0.035));
          const fiber = noise(u, v, 64, 64, seed ^ 0x5b2d);
          color = 0.9 - 0.28 * minor - 0.34 * major + 0.06 * fiber;
          height = 0.8 - 0.22 * minor - 0.36 * major + 0.03 * fiber;
          roughness += 0.04 * (fiber - 0.5) + 0.03 * minor;
          occlusion = 1 - 0.12 * minor - 0.2 * major;
          return;
        };
      case 'notebookpaper':
        return () => {
          const fy = fract(v * 8);
          const rule = smooth(clamp((0.05 - Math.min(fy, 1 - fy)) / 0.03));
          const margin = smooth(
            clamp((0.012 - Math.abs(fract(u) - 0.25)) / 0.008),
          );
          // Punch holes sink deepest beside the ruled margin line.
          let holes = 0;
          for (let k = 0; k < 3; k++) {
            const dx = fract(u) - 0.12,
              dy = fract(v) - (k + 1) / 4;
            const distance = Math.sqrt(dx * dx + 4 * dy * dy);
            const bowl = smooth(clamp((0.06 - distance) / 0.03));
            holes += (1 - holes) * bowl;
          }
          const fiber = noise(u, v, 48, 48, seed ^ 0x27ab);
          color = 0.9 - 0.3 * rule - 0.26 * margin - 0.5 * holes + 0.06 * fiber;
          height =
            0.82 - 0.2 * rule - 0.22 * margin - 0.5 * holes + 0.03 * fiber;
          roughness += 0.04 * (fiber - 0.5) + 0.03 * rule;
          occlusion = 1 - 0.1 * rule - 0.12 * margin - 0.4 * holes;
          return;
        };
      case 'lace':
        return () => {
          // Two diagonal thread families cross above the diamond voids.
          const a = fract((u + v) * 6),
            b = fract((u - v) * 6);
          const threadA = smooth(clamp((0.14 - Math.min(a, 1 - a)) / 0.07));
          const threadB = smooth(clamp((0.14 - Math.min(b, 1 - b)) / 0.07));
          const net = threadA + threadB - threadA * threadB;
          const crossings = threadA * threadB;
          const fiber = noise(u, v, 48, 48, seed ^ 0x1c3f);
          color = 0.58 + 0.32 * net + 0.05 * fiber;
          height = 0.5 + 0.32 * net + 0.12 * crossings + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.08 * net;
          occlusion = 1 - 0.5 * (1 - net) - 0.14 * (1 - crossings);
          return;
        };
      case 'crochet':
        return () => {
          // Plush loops sit on half-cell-offset rows above the recessed gaps.
          const row = Math.floor(v * 6);
          const offset = (row % 2) * 0.5;
          const du = fract(u * 8 + offset) - 0.5,
            dv = fract(v * 6) - 0.5;
          const radius = Math.sqrt(du * du + 1.4 * dv * dv);
          const loop = smooth(clamp((0.44 - radius) / 0.12));
          const fiber = noise(u, v, 40, 40, seed ^ 0x5a17);
          color = 0.58 + 0.34 * loop + 0.05 * fiber;
          height = 0.45 + 0.4 * loop + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.05 * loop;
          occlusion = 1 - 0.55 * (1 - loop);
          return;
        };
      case 'basketweave':
        return () => {
          // Strips change direction per block; block borders fade to gaps.
          const bu = fract(u * 4),
            bv = fract(v * 4);
          const fadeU = smooth(clamp((Math.min(bu, 1 - bu) - 0.06) / 0.1));
          const fadeV = smooth(clamp((Math.min(bv, 1 - bv) - 0.06) / 0.1));
          const fade = fadeU * fadeV;
          const blockParity = (Math.floor(u * 4) + Math.floor(v * 4)) % 2;
          const across = blockParity ? fract(u * 8) : fract(v * 8);
          const strip = smooth(
            clamp((Math.min(across, 1 - across) - 0.06) / 0.1),
          );
          const ridge = smooth(clamp((0.14 - Math.abs(across - 0.5)) / 0.07));
          const fiber = noise(u, v, 32, 32, seed ^ 0x66de);
          color = 0.5 + fade * (0.28 * strip + 0.12 * ridge) + 0.06 * fiber;
          height = 0.42 + fade * (0.36 * strip + 0.14 * ridge) + 0.02 * fiber;
          roughness += 0.06 * (fiber - 0.5) - 0.05 * fade * ridge;
          occlusion = 1 - 0.55 * (1 - fade * strip) - 0.16 * (1 - fade * ridge);
          return;
        };
      case 'zipper':
        return () => {
          // Offset tooth rows meet over a recessed seam beside woven tape.
          const vLeft = fract(v * 12) - 0.5,
            vRight = fract(v * 12 + 0.5) - 0.5;
          const toothLeft =
            smooth(clamp((0.34 - Math.abs(vLeft)) / 0.08)) *
            smooth(clamp((0.09 - Math.abs(u - 0.42)) / 0.035));
          const toothRight =
            smooth(clamp((0.34 - Math.abs(vRight)) / 0.08)) *
            smooth(clamp((0.09 - Math.abs(u - 0.58)) / 0.035));
          const teeth = toothLeft + toothRight - toothLeft * toothRight;
          const tape =
            smooth(clamp((0.2 - Math.abs(u - 0.25)) / 0.06)) +
            smooth(clamp((0.2 - Math.abs(u - 0.75)) / 0.06));
          const seam =
            smooth(clamp((0.05 - Math.abs(u - 0.5)) / 0.03)) * (1 - teeth);
          const weave = 0.5 + 0.5 * Math.cos(TAU * 24 * v);
          const fiber = noise(u, v, 40, 40, seed ^ 0x3d92);
          const cover = teeth + 0.7 * tape - teeth * 0.7 * tape;
          color =
            0.42 +
            0.24 * teeth +
            0.2 * tape * (0.85 + 0.15 * weave) +
            0.05 * fiber;
          height =
            0.4 +
            0.34 * teeth +
            0.16 * tape * (0.85 + 0.15 * weave) -
            0.12 * seam +
            0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.08 * teeth;
          occlusion = 1 - 0.42 * (1 - cover) - 0.3 * seam;
          return;
        };
      case 'velcro':
        return () => {
          // Staggered hook pins ring above their dimpled cores and backing.
          const row = Math.floor(v * 12);
          const offset = (row % 2) * 0.5;
          const du = fract(u * 12 + offset) - 0.5,
            dv = fract(v * 12) - 0.5;
          const radius = Math.sqrt(du * du + dv * dv);
          const ring =
            smooth(clamp((0.34 - radius) / 0.07)) *
            smooth(clamp((radius - 0.16) / 0.07));
          const core = smooth(clamp((0.18 - radius) / 0.08));
          const fiber = noise(u, v, 36, 36, seed ^ 0x77b1);
          const pin = ring + core - ring * core;
          color = 0.46 + 0.3 * ring + 0.16 * core + 0.05 * fiber;
          height = 0.42 + 0.3 * ring + 0.15 * core + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.06 * ring;
          occlusion = 1 - 0.5 * (1 - pin) - 0.14 * ring;
          return;
        };
      case 'button':
        return () => {
          // Raised buttons ring above their stitched faces and hole pits.
          const du = fract(u * 4) - 0.5,
            dv = fract(v * 4) - 0.5;
          const radius = Math.sqrt(du * du + dv * dv);
          const face = smooth(clamp((0.34 - radius) / 0.08));
          const rim =
            smooth(clamp((0.34 - radius) / 0.05)) *
            smooth(clamp((radius - 0.2) / 0.05));
          let holes = 0;
          for (let k = 0; k < 4; k++) {
            const hx = du - (k % 2 ? 0.07 : -0.07),
              hy = dv - (k > 1 ? 0.07 : -0.07);
            const distance = Math.sqrt(hx * hx + hy * hy);
            const pit = smooth(clamp((0.05 - distance) / 0.03));
            holes += (1 - holes) * pit;
          }
          const fiber = noise(u, v, 32, 32, seed ^ 0x4c2d);
          color = 0.55 + 0.26 * face + 0.12 * rim - 0.3 * holes + 0.05 * fiber;
          height = 0.4 + 0.22 * face + 0.24 * rim - 0.34 * holes + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.06 * rim;
          occlusion = 1 - 0.4 * (1 - face) - 0.42 * holes;
          return;
        };
      case 'traintracks':
        return () => {
          // Rails crest above sleepers laid across the ballast grain.
          const sleeper = smooth(
            clamp((0.18 - Math.min(fract(v * 6), 1 - fract(v * 6))) / 0.08),
          );
          const rail =
            smooth(clamp((0.06 - Math.abs(u - 0.35)) / 0.025)) +
            smooth(clamp((0.06 - Math.abs(u - 0.65)) / 0.025));
          const grain = noise(u, v, 48, 48, seed ^ 0x2f61);
          const bed = sleeper + rail - sleeper * rail;
          color = 0.32 + 0.28 * sleeper + 0.3 * rail + 0.08 * grain;
          height = 0.36 + 0.16 * sleeper + 0.34 * rail + 0.03 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * rail;
          occlusion = 1 - 0.45 * (1 - bed) - 0.12 * (1 - grain);
          return;
        };
      case 'manholecover':
        return () => {
          // The frame ring crowns a radially and concentrically ribbed panel.
          const dx = u - 0.5,
            dy = v - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const frame =
            smooth(clamp((0.46 - radius) / 0.03)) *
            smooth(clamp((radius - 0.38) / 0.03));
          const panel = smooth(clamp((0.36 - radius) / 0.04));
          const angle = Math.atan2(dy, dx);
          const ribs = 0.5 + 0.5 * Math.cos(16 * angle);
          const rings = 0.5 + 0.5 * Math.cos(TAU * 6 * radius);
          const ribbed = ribs * smooth(clamp((radius - 0.06) / 0.05)) * panel;
          const ringed = rings * panel;
          const fiber = noise(u, v, 40, 40, seed ^ 0x18ce);
          color =
            0.4 + 0.3 * frame + 0.14 * ribbed + 0.1 * ringed + 0.05 * fiber;
          height =
            0.38 + 0.3 * frame + 0.14 * ribbed + 0.12 * ringed + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.08 * frame;
          occlusion = 1 - 0.4 * (1 - frame) - 0.2 * (1 - ribbed) * (1 - ringed);
          return;
        };
      case 'speedbump':
        return () => {
          // Rounded bumps rise above their feet and the recessed seams.
          const wrapped = fract(v * 2),
            d = Math.abs(wrapped - 0.5);
          const bump = smooth(clamp((0.34 - d) / 0.14));
          const seam = smooth(
            clamp((0.04 - Math.min(wrapped, 1 - wrapped)) / 0.03),
          );
          const stripe = smooth(
            clamp((0.28 - Math.abs(fract(u * 4) - 0.5)) / 0.1),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x51af);
          color = 0.42 + 0.4 * stripe * (0.3 + 0.7 * bump) + 0.06 * grain;
          height = 0.38 + 0.4 * bump - 0.1 * seam + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.06 * bump;
          occlusion = 1 - 0.45 * (1 - bump) - 0.3 * seam;
          return;
        };
      case 'circuitboard':
        return () => {
          // Pads crest over traces routed above the substrate, with via pits.
          const row = Math.floor(v * 8),
            col = Math.floor(u * 8);
          const pu = fract(u * 8) - 0.5,
            pv = fract(v * 8) - 0.5;
          const radius = Math.sqrt(pu * pu + pv * pv);
          const hTrace =
            row % 2 === 0 ? smooth(clamp((0.12 - Math.abs(pv)) / 0.05)) : 0;
          const vTrace =
            col % 2 === 1 ? smooth(clamp((0.12 - Math.abs(pu)) / 0.05)) : 0;
          const crossing =
            row % 2 === 0 && col % 2 === 1
              ? smooth(clamp((0.22 - radius) / 0.06))
              : 0;
          const via =
            row % 2 === 1 && col % 2 === 0
              ? smooth(clamp((0.1 - radius) / 0.04))
              : 0;
          const fiber = noise(u, v, 32, 32, seed ^ 0x6b02);
          const routed = 1 - (1 - hTrace) * (1 - vTrace) * (1 - crossing);
          color = 0.3 + 0.3 * routed + 0.26 * crossing + 0.06 * fiber;
          height =
            0.4 +
            0.12 * hTrace +
            0.12 * vTrace +
            0.22 * crossing -
            0.3 * via +
            0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.1 * routed;
          occlusion = 1 - 0.35 * (1 - routed) - 0.35 * via;
          return;
        };
      case 'solarpanel':
        return () => {
          // Cell faces rise out of their gaps under busbars and fingers.
          const cu = fract(u * 2),
            cv = fract(v * 2);
          const face =
            smooth(clamp((Math.min(cu, 1 - cu) - 0.06) / 0.1)) *
            smooth(clamp((Math.min(cv, 1 - cv) - 0.06) / 0.1));
          const bar = smooth(
            clamp(
              (0.05 - Math.min(Math.abs(cu - 0.3), Math.abs(cu - 0.7))) / 0.025,
            ),
          );
          const finger = smooth(
            clamp((0.04 - Math.min(fract(v * 8), 1 - fract(v * 8))) / 0.02),
          );
          const fiber = noise(u, v, 40, 40, seed ^ 0x31f7);
          color =
            0.34 +
            0.3 * face +
            0.2 * bar * face +
            0.1 * finger * face +
            0.05 * fiber;
          height =
            0.4 +
            0.3 * face +
            0.12 * bar * face +
            0.05 * finger * face +
            0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.1 * bar * face;
          occlusion = 1 - 0.5 * (1 - face) - 0.12 * (1 - bar * face);
          return;
        };
      case 'heattile':
        return () => {
          // Rounded tile faces rise above their recessed seams.
          const tu = fract(u * 3),
            tv = fract(v * 3);
          const tile =
            smooth(clamp((Math.min(tu, 1 - tu) - 0.08) / 0.12)) *
            smooth(clamp((Math.min(tv, 1 - tv) - 0.08) / 0.12));
          const grain = noise(u, v, 48, 48, seed ^ 0x7a41);
          color = 0.52 + 0.32 * tile + 0.08 * grain;
          height = 0.42 + 0.34 * tile + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.04 * tile;
          occlusion = 1 - 0.5 * (1 - tile);
          return;
        };
      case 'pianokeys':
        return () => {
          // Black keys rise over white faces split by recessed seams.
          const wrapped = fract(u * 7),
            seam = smooth(
              clamp((0.04 - Math.min(wrapped, 1 - wrapped)) / 0.025),
            );
          let black = 0;
          for (let k = 0; k < 7; k++) {
            if (k === 0 || k === 3) continue;
            const du = Math.abs(fract(u) - k / 7);
            const dv = Math.abs(fract(v) - 0.275);
            const key =
              smooth(clamp((0.045 - du) / 0.018)) *
              smooth(clamp((0.175 - dv) / 0.06));
            black += (1 - black) * key;
          }
          const fiber = noise(u, v, 40, 40, seed ^ 0x4f88);
          const face = 1 - seam * (1 - black);
          color = 0.48 + 0.32 * face + 0.14 * black + 0.05 * fiber;
          height = 0.42 + 0.2 * face + 0.26 * black + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.1 * black;
          occlusion = 1 - 0.32 * seam * (1 - black);
          return;
        };
      case 'drumskin':
        return () => {
          // Lugs crown the rim above the taut creased membrane.
          const dx = u - 0.5,
            dy = v - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const rim =
            smooth(clamp((0.46 - radius) / 0.03)) *
            smooth(clamp((radius - 0.38) / 0.03));
          const lug = Math.pow(0.5 + 0.5 * Math.cos(8 * angle), 4) * rim;
          const membrane = smooth(clamp((0.38 - radius) / 0.06));
          const crease =
            (0.5 - 0.5 * Math.cos(16 * angle)) *
            smooth(clamp((radius - 0.08) / 0.06)) *
            membrane;
          const fiber = noise(u, v, 36, 36, seed ^ 0x2c5a);
          color =
            0.42 +
            0.28 * rim +
            0.14 * lug +
            0.1 * membrane -
            0.1 * crease +
            0.05 * fiber;
          height =
            0.42 +
            0.28 * rim +
            0.16 * lug +
            0.1 * membrane -
            0.06 * crease +
            0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.06 * rim;
          occlusion = 1 - 0.3 * (1 - membrane) - 0.12 * crease - 0.1 * lug;
          return;
        };
      case 'gongsurface':
        return () => {
          // Hammered rings ripple around the raised center boss.
          const dx = u - 0.5,
            dy = v - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const warp = noise(u, v, 6, 6, seed ^ 0x60af) - 0.5;
          const rings =
            0.5 + 0.5 * Math.cos(TAU * 10 * (radius + 0.012 * warp));
          const lathe = 0.5 + 0.5 * Math.cos(24 * angle);
          const boss = smooth(clamp((0.1 - radius) / 0.05));
          const fade = smooth(clamp((radius - 0.06) / 0.05));
          const outer = smooth(clamp((0.44 - radius) / 0.06));
          const fiber = noise(u, v, 32, 32, seed ^ 0x59c1);
          color =
            0.46 +
            0.26 * rings * outer +
            0.12 * lathe * fade * outer +
            0.1 * boss +
            0.05 * fiber;
          height =
            0.42 +
            0.22 * rings * outer +
            0.06 * lathe * fade * outer +
            0.2 * boss +
            0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.08 * rings * outer;
          occlusion =
            1 - 0.24 * (1 - rings * outer) - 0.1 * (1 - lathe * fade * outer);
          return;
        };
      case 'lensarray':
        return () => {
          // Microlens domes rise out of the fine supporting web.
          const du = fract(u * 16) - 0.5,
            dv = fract(v * 16) - 0.5;
          const radius = Math.sqrt(du * du + dv * dv);
          const dome = smooth(clamp((0.42 - radius) / 0.12));
          const fiber = noise(u, v, 48, 48, seed ^ 0x6f3c);
          color = 0.42 + 0.4 * dome + 0.06 * fiber;
          height = 0.42 + 0.36 * dome + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.12 * dome;
          occlusion = 1 - 0.42 * (1 - dome);
          return;
        };
      case 'prismtape':
        return () => {
          // Diagonal prism ridges crest over their feet and the tape base.
          const p = fract((u - v) * 8),
            d = Math.abs(p - 0.5);
          const ridge = smooth(clamp((0.34 - d) / 0.16));
          const fiber = noise(u, v, 40, 40, seed ^ 0x1b7e);
          color = 0.4 + 0.42 * ridge + 0.06 * fiber;
          height = 0.4 + 0.4 * ridge + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.1 * ridge;
          occlusion = 1 - 0.45 * (1 - ridge);
          return;
        };
      case 'fresnel':
        return () => {
          // Concentric saw rings descend outward around the center boss.
          const dx = u - 0.5,
            dy = v - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const phase = fract(radius * 10);
          const outer = smooth(clamp((0.46 - radius) / 0.05));
          const step = smooth(clamp((0.75 - phase) / 0.25)) * outer;
          const boss = smooth(clamp((0.1 - radius) / 0.05));
          const fiber = noise(u, v, 40, 40, seed ^ 0x37a9);
          color = 0.38 + 0.32 * step + 0.2 * boss + 0.05 * fiber;
          height = 0.42 + 0.22 * step + 0.3 * boss + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.1 * step;
          occlusion = 1 - 0.36 * (1 - step) - 0.12 * (1 - boss);
          return;
        };
      case 'bandage':
        return () => {
          // A rounded pad cushions over the woven gauze backing.
          const pad =
            smooth(clamp((0.28 - Math.abs(u - 0.5)) / 0.06)) *
            smooth(clamp((0.28 - Math.abs(v - 0.5)) / 0.06));
          const warp = smooth(
            clamp((0.12 - Math.abs(fract(u * 24) - 0.5)) / 0.06),
          );
          const weft = smooth(
            clamp((0.12 - Math.abs(fract(v * 24) - 0.5)) / 0.06),
          );
          const weave = warp + weft - warp * weft;
          const fiber = noise(u, v, 48, 48, seed ^ 0x5d21);
          color = 0.5 + 0.3 * pad + 0.12 * weave + 0.06 * fiber;
          height = 0.44 + 0.3 * pad + 0.08 * weave + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.08 * pad;
          occlusion = 1 - 0.32 * (1 - weave) - 0.12 * (1 - pad);
          return;
        };
      case 'pillblister':
        return () => {
          // Blister domes swell over scored foil between their cells.
          const du = fract(u * 3) - 0.5,
            dv = fract(v * 3) - 0.5;
          const radius = Math.sqrt(du * du + dv * dv);
          const dome = smooth(clamp((0.36 - radius) / 0.1));
          const score =
            smooth(
              clamp((0.03 - Math.min(fract(u * 3), 1 - fract(u * 3))) / 0.02),
            ) +
            smooth(
              clamp((0.03 - Math.min(fract(v * 3), 1 - fract(v * 3))) / 0.02),
            );
          const fiber = noise(u, v, 40, 40, seed ^ 0x27bd);
          color = 0.52 + 0.34 * dome - 0.14 * score + 0.06 * fiber;
          height = 0.46 + 0.36 * dome - 0.14 * score + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.12 * dome;
          occlusion = 1 - 0.42 * (1 - dome) - 0.2 * score;
          return;
        };
      case 'sutures':
        return () => {
          // Stitch cords bridge the incision above pits and bare skin.
          const band = smooth(
            clamp((0.09 - Math.abs(fract(v * 10) - 0.5)) / 0.03),
          );
          const span = smooth(clamp((0.22 - Math.abs(u - 0.5)) / 0.06));
          const cord = band * span;
          const incision = smooth(clamp((0.05 - Math.abs(u - 0.5)) / 0.03));
          const pit =
            smooth(clamp((0.045 - Math.abs(u - 0.16)) / 0.025)) * band +
            smooth(clamp((0.045 - Math.abs(u - 0.84)) / 0.025)) * band;
          const fiber = noise(u, v, 40, 40, seed ^ 0x63de);
          color =
            0.56 +
            0.26 * cord -
            0.22 * incision * (1 - cord) -
            0.18 * pit +
            0.05 * fiber;
          height =
            0.5 +
            0.28 * cord -
            0.3 * incision * (1 - cord) -
            0.2 * pit * (1 - cord) +
            0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.08 * cord;
          occlusion =
            1 - 0.3 * incision * (1 - cord) - 0.28 * pit - 0.12 * (1 - cord);
          return;
        };
      case 'trellis':
        return () => {
          // Slats cross over the open grid, knotted at their joins.
          const vSlat = smooth(
            clamp((0.16 - Math.abs(fract(u * 2) - 0.5)) / 0.08),
          );
          const hSlat = smooth(
            clamp((0.16 - Math.abs(fract(v * 2) - 0.5)) / 0.08),
          );
          const cover = vSlat + hSlat - vSlat * hSlat;
          const knot =
            smooth(
              clamp(
                (0.14 -
                  Math.sqrt(
                    (fract(u * 2) - 0.5) ** 2 + (fract(v * 2) - 0.5) ** 2,
                  )) /
                  0.06,
              ),
            ) * cover;
          const grain = noise(u, v, 32, 32, seed ^ 0x41c7);
          color = 0.42 + 0.3 * cover + 0.14 * knot + 0.06 * grain;
          height = 0.4 + 0.24 * cover + 0.1 * knot + 0.03 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * cover;
          occlusion = 1 - 0.5 * (1 - cover) - 0.12 * (1 - knot) * cover;
          return;
        };
      case 'terracottapot':
        return () => {
          // A proud rim band rides over the pot's thrown wall ribs.
          const rib = smooth(
            clamp((0.18 - Math.abs(fract(v * 8) - 0.5)) / 0.08),
          );
          const rim = smooth(clamp((0.1 - Math.abs(fract(v) - 0.1)) / 0.04));
          const grain = noise(u, v, 32, 32, seed ^ 0x5e0b);
          color = 0.46 + 0.24 * rib + 0.22 * rim + 0.06 * grain;
          height = 0.42 + 0.18 * rib + 0.26 * rim + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.06 * rim;
          occlusion = 1 - 0.34 * (1 - rib) - 0.12 * (1 - rim);
          return;
        };
      case 'hedgerow':
        return () => {
          // Leafy clumps swell over the shadowed branch gaps.
          const row = Math.floor(v * 4);
          const offset = (row % 2) * 0.5;
          const du = fract(u * 4 + offset) - 0.5,
            dv = fract(v * 4) - 0.5;
          const radius = Math.sqrt(du * du + dv * dv);
          const warp = noise(u, v, 8, 8, seed ^ 0x33af) - 0.5;
          const clump = smooth(clamp((0.34 - (radius + 0.08 * warp)) / 0.12));
          const leaves = noise(u, v, 48, 48, seed ^ 0x72d4);
          color = 0.36 + 0.36 * clump + 0.12 * leaves + 0.05 * clump * leaves;
          height = 0.42 + 0.34 * clump + 0.04 * leaves;
          roughness += 0.05 * (leaves - 0.5) - 0.06 * clump;
          occlusion = 1 - 0.5 * (1 - clump);
          return;
        };
      case 'collar':
        return () => {
          // A buckle rises over stitched webbing above bare backing.
          const band = smooth(clamp((0.2 - Math.abs(fract(v) - 0.5)) / 0.05));
          const stitch = smooth(
            clamp((0.02 - Math.abs(Math.abs(fract(v) - 0.5) - 0.17)) / 0.012),
          );
          const buckle =
            smooth(clamp((0.12 - Math.abs(fract(u) - 0.3)) / 0.04)) *
            smooth(clamp((0.14 - Math.abs(fract(v) - 0.5)) / 0.05));
          const weave = noise(u, v, 48, 48, seed ^ 0x4c19);
          color = 0.42 + 0.26 * band + 0.22 * buckle + 0.06 * weave;
          height =
            0.44 +
            0.2 * band +
            0.28 * buckle -
            0.1 * stitch * band +
            0.03 * weave;
          roughness += 0.05 * (weave - 0.5) - 0.1 * buckle;
          occlusion = 1 - 0.32 * (1 - band) - 0.14 * stitch - 0.12 * buckle;
          return;
        };
      case 'petbed':
        return () => {
          // A bolster ring surrounds the dished cushion and base weave.
          const dx = u - 0.5,
            dy = v - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const bolster =
            smooth(clamp((0.44 - radius) / 0.06)) *
            smooth(clamp((radius - 0.3) / 0.08));
          const cushion = smooth(clamp((0.28 - radius) / 0.1));
          const fabric =
            (0.5 + 0.5 * Math.cos(TAU * 20 * u)) *
            (0.5 + 0.5 * Math.cos(TAU * 20 * v));
          const fiber = noise(u, v, 40, 40, seed ^ 0x51c3);
          color =
            0.44 +
            0.3 * bolster +
            0.14 * cushion +
            0.05 * fabric +
            0.05 * fiber;
          height =
            0.44 +
            0.34 * bolster +
            0.12 * cushion +
            0.03 * fabric +
            0.03 * fiber;
          roughness +=
            0.05 * (fiber - 0.5) + 0.02 * (fabric - 0.5) - 0.08 * bolster;
          occlusion = 1 - 0.36 * (1 - bolster) - 0.12 * (1 - cushion);
          return;
        };
      case 'scratchpost':
        return () => {
          // Rope wraps the post in rounded ridges above the tight grooves.
          const rope = smooth(
            clamp((0.2 - Math.abs(fract(v * 8) - 0.5)) / 0.08),
          );
          const twist = 0.5 + 0.5 * Math.cos(TAU * (12 * u + 2 * v));
          const fiber = noise(u, v, 40, 40, seed ^ 0x2ad6);
          color = 0.46 + 0.32 * rope + 0.08 * twist * rope + 0.06 * fiber;
          height = 0.44 + 0.36 * rope + 0.05 * twist * rope + 0.03 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.08 * rope;
          occlusion = 1 - 0.5 * (1 - rope) - 0.1 * (1 - twist) * rope;
          return;
        };
      case 'runningtrack':
        return () => {
          // Lane lines ride the granular surface above the drainage seam.
          const line =
            smooth(clamp((0.03 - Math.abs(fract(v) - 0.25)) / 0.015)) +
            smooth(clamp((0.03 - Math.abs(fract(v) - 0.75)) / 0.015));
          const seam = smooth(
            clamp((0.02 - Math.min(fract(v), 1 - fract(v))) / 0.012),
          );
          const grain = noise(u, v, 64, 64, seed ^ 0x3f58);
          color = 0.42 + 0.4 * line + 0.1 * grain;
          height = 0.46 + 0.12 * line + 0.02 * grain - 0.16 * seam;
          roughness += 0.05 * (grain - 0.5) - 0.1 * line;
          occlusion = 1 - 0.3 * seam - 0.12 * (1 - line);
          return;
        };
      case 'bouldermat':
        return () => {
          // Quilted diamonds puff inside the raised border band.
          const d1 = Math.abs(fract((u + v) * 4) - 0.5),
            d2 = Math.abs(fract((u - v) * 4) - 0.5);
          const quilt =
            smooth(clamp((0.3 - d1) / 0.1)) * smooth(clamp((0.3 - d2) / 0.1));
          const bu = smooth(
            clamp((0.08 - Math.min(fract(u), 1 - fract(u))) / 0.04),
          );
          const bv = smooth(
            clamp((0.08 - Math.min(fract(v), 1 - fract(v))) / 0.04),
          );
          const border = 1 - (1 - bu) * (1 - bv);
          const grain = noise(u, v, 40, 40, seed ^ 0x64b2);
          color = 0.42 + 0.3 * quilt + 0.16 * border + 0.06 * grain;
          height = 0.44 + 0.28 * quilt + 0.18 * border + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.06 * quilt;
          occlusion = 1 - 0.42 * (1 - quilt) - 0.12 * (1 - border);
          return;
        };
      case 'pooltile':
        return () => {
          // Tile faces meet recessed grout under broad caustic light bands.
          const gu = Math.min(fract(u * 8), 1 - fract(u * 8)),
            gv = Math.min(fract(v * 8), 1 - fract(v * 8));
          const face =
            smooth(clamp((gu - 0.04) / 0.06)) *
            smooth(clamp((gv - 0.04) / 0.06));
          const caustic = 0.5 + 0.5 * Math.cos(TAU * 2 * (u + v));
          const grain = noise(u, v, 32, 32, seed ^ 0x18fa);
          color = 0.4 + 0.3 * face + 0.14 * caustic + 0.06 * grain;
          height = 0.44 + 0.2 * face + 0.1 * caustic + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.12 * face;
          occlusion = 1 - 0.42 * (1 - face) - 0.1 * (1 - caustic);
          return;
        };
      case 'envelope':
        return () => {
          // Crosshatch ridges frame the recessed flap seam.
          const d1 = Math.abs(fract((u + v) * 10) - 0.5),
            d2 = Math.abs(fract((u - v) * 10) - 0.5);
          const hatchA = smooth(clamp((0.14 - d1) / 0.07));
          const hatchB = smooth(clamp((0.14 - d2) / 0.07));
          const cover = hatchA + hatchB - hatchA * hatchB;
          const seam =
            smooth(clamp((0.03 - Math.abs(u - 0.5)) / 0.02)) * (1 - cover);
          const fiber = noise(u, v, 48, 48, seed ^ 0x2e4c);
          color = 0.5 + 0.24 * cover + 0.06 * fiber;
          height = 0.46 + 0.12 * cover - 0.14 * seam + 0.02 * fiber;
          roughness += 0.05 * (fiber - 0.5) - 0.06 * cover;
          occlusion = 1 - 0.28 * (1 - cover) - 0.3 * seam;
          return;
        };
      case 'chalkboard':
        return () => {
          // A frame band surrounds streaked slate between clean passes.
          const edgeU = 0.5 - Math.abs(fract(u) - 0.5),
            edgeV = 0.5 - Math.abs(fract(v) - 0.5);
          const frame =
            1 -
            (1 - smooth(clamp((0.08 - edgeU) / 0.04))) *
              (1 - smooth(clamp((0.08 - edgeV) / 0.04)));
          const warp = noise(u, v, 6, 6, seed ^ 0x55ea) - 0.5;
          const streak = 0.5 + 0.5 * Math.cos(TAU * 3 * (v + 0.02 * warp));
          const grain = noise(u, v, 32, 32, seed ^ 0x1c08);
          color = 0.34 + 0.3 * frame + 0.12 * streak + 0.06 * grain;
          height = 0.44 + 0.24 * frame + 0.04 * streak + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.08 * frame;
          occlusion = 1 - 0.3 * (1 - frame) - 0.08 * (1 - streak);
          return;
        };
      case 'corkboard':
        return () => {
          // Cork granules rise over the board with deep pin holes.
          const row = Math.floor(v * 8);
          const offset = (row % 2) * 0.5;
          const du = fract(u * 8 + offset) - 0.5,
            dv = fract(v * 8) - 0.5;
          const radius = Math.sqrt(du * du + dv * dv);
          const warp = noise(u, v, 8, 8, seed ^ 0x6b37) - 0.5;
          const clump = smooth(clamp((0.34 - (radius + 0.08 * warp)) / 0.12));
          const pu = fract(u * 4) - 0.5,
            pv = fract(v * 4) - 0.5;
          const pit = smooth(
            clamp((0.07 - Math.sqrt(pu * pu + pv * pv)) / 0.03),
          );
          const grain = noise(u, v, 48, 48, seed ^ 0x3a52);
          color = 0.42 + 0.26 * clump - 0.2 * pit + 0.08 * grain;
          height = 0.44 + 0.2 * clump - 0.26 * pit + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.06 * clump;
          occlusion = 1 - 0.3 * (1 - clump) - 0.45 * pit;
          return;
        };
      case 'snowdrift':
        return () => {
          // Wind ripples ride the drift over the fine snow grain.
          const warp = noise(u, v, 4, 4, seed ^ 0x4e77) - 0.5;
          const drift = 0.5 + 0.5 * Math.cos(TAU * (2 * u + 0.35 * warp));
          const grain = noise(u, v, 48, 48, seed ^ 0x2b15);
          color = 0.52 + 0.34 * drift + 0.06 * grain;
          height = 0.46 + 0.32 * drift + 0.05 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.12 * drift;
          occlusion = 1 - 0.3 * (1 - drift);
          return;
        };
      case 'icicle':
        return () => {
          // Rounded icicle columns hang over the shadowed gaps.
          const du = Math.abs(fract(u * 6) - 0.5);
          const column = smooth(clamp((0.28 - du) / 0.1));
          const striation = 0.5 + 0.5 * Math.cos(TAU * 24 * u);
          const grain = noise(u, v, 32, 32, seed ^ 0x7c41);
          color =
            0.46 + 0.36 * column + 0.08 * striation * column + 0.06 * grain;
          height =
            0.42 + 0.42 * column + 0.04 * striation * column + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.14 * column;
          occlusion = 1 - 0.52 * (1 - column);
          return;
        };
      case 'dewdrops':
        return () => {
          // Two drop sizes bead over the faint leaf veins.
          const bu = fract(u * 12) - 0.5,
            bv = fract(v * 12) - 0.5;
          const big = smooth(
            clamp((0.22 - Math.sqrt(bu * bu + bv * bv)) / 0.08),
          );
          const su = fract(u * 24) - 0.5,
            sv = fract(v * 24) - 0.5;
          const small = smooth(
            clamp((0.12 - Math.sqrt(su * su + sv * sv)) / 0.05),
          );
          const veins = 0.5 + 0.5 * Math.cos(TAU * 8 * (u + 0.25 * v));
          const grain = noise(u, v, 40, 40, seed ^ 0x58ce);
          color = 0.34 + 0.28 * big + 0.18 * small + 0.1 * veins + 0.05 * grain;
          height =
            0.42 + 0.28 * big + 0.16 * small + 0.04 * veins + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.16 * big;
          occlusion = 1 - 0.3 * (1 - big) - 0.12 * (1 - small) * (1 - big);
          return;
        };
      case 'mooncrater':
        return () => {
          // Crater rims rise over the surface around their sunken bowls.
          const bu = fract(u * 3) - 0.5,
            bv = fract(v * 3) - 0.5;
          const big = Math.sqrt(bu * bu + bv * bv);
          const bigRim =
            smooth(clamp((0.3 - big) / 0.06)) *
            smooth(clamp((big - 0.2) / 0.06));
          const bigBowl = smooth(clamp((0.2 - big) / 0.08));
          const su = fract(u * 6) - 0.5,
            sv = fract(v * 6) - 0.5;
          const small = Math.sqrt(su * su + sv * sv);
          const smallRim =
            smooth(clamp((0.16 - small) / 0.04)) *
            smooth(clamp((small - 0.1) / 0.04));
          const smallBowl = smooth(clamp((0.1 - small) / 0.05));
          const grain = noise(u, v, 32, 32, seed ^ 0x61c8);
          color =
            0.5 +
            0.24 * bigRim +
            0.12 * smallRim -
            0.16 * bigBowl -
            0.1 * smallBowl +
            0.08 * grain;
          height =
            0.46 +
            0.24 * bigRim +
            0.12 * smallRim -
            0.2 * bigBowl -
            0.1 * smallBowl +
            0.03 * grain;
          roughness += 0.05 * (grain - 0.5) + 0.08 * bigBowl;
          occlusion =
            1 -
            0.3 * bigBowl -
            0.16 * smallBowl -
            0.12 * (1 - bigRim - smallRim + bigRim * smallRim);
          return;
        };
      case 'starfield':
        return () => {
          // Bright stars and dust points twinkle over the nebula base.
          const bu = fract(u * 12) - 0.5,
            bv = fract(v * 12) - 0.5;
          const star = smooth(
            clamp((0.08 - Math.sqrt(bu * bu + bv * bv)) / 0.035),
          );
          const su = fract(u * 24) - 0.5,
            sv = fract(v * 24) - 0.5;
          const dust = smooth(
            clamp((0.05 - Math.sqrt(su * su + sv * sv)) / 0.025),
          );
          const haze = noise(u, v, 3, 3, seed ^ 0x17f2);
          const grain = noise(u, v, 40, 40, seed ^ 0x4d3a);
          color = 0.26 + 0.38 * star + 0.18 * dust + 0.07 * haze + 0.05 * grain;
          height = 0.42 + 0.3 * star + 0.16 * dust + 0.06 * haze + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.18 * star;
          occlusion = 1 - 0.2 * (1 - star) * (1 - dust);
          return;
        };
      case 'nebula':
        return () => {
          // Bright swirl bands flow around the dark dust lanes.
          const warp = noise(u, v, 3, 3, seed ^ 0x5a2d) - 0.5;
          const band = 0.5 + 0.5 * Math.cos(TAU * (2 * u + 3 * v + 1.2 * warp));
          const detail = noise(u, v, 12, 12, seed ^ 0x36e4);
          const grain = noise(u, v, 32, 32, seed ^ 0x2fb1);
          color = 0.42 + 0.34 * band + 0.1 * detail + 0.06 * grain;
          height = 0.44 + 0.28 * band + 0.05 * detail + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.1 * band;
          occlusion = 1 - 0.24 * (1 - band);
          return;
        };
      case 'pleats':
        return () => {
          // Accordion folds crest over the valleys with a fine fabric grain.
          const fold = smooth(
            clamp((0.34 - Math.abs(fract(u * 4) - 0.5)) / 0.16),
          );
          const grain = noise(u, v, 40, 40, seed ^ 0x63a1);
          color = 0.46 + 0.32 * fold + 0.08 * grain;
          height = 0.46 + 0.32 * fold + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.1 * fold;
          occlusion = 1 - 0.4 * (1 - fold);
          return;
        };
      case 'shoelace':
        return () => {
          // Woven cords cross over the base above the punched eyelets.
          const d1 = Math.abs(fract((u + v) * 8) - 0.5),
            d2 = Math.abs(fract((u - v) * 8) - 0.5);
          const cordA = smooth(clamp((0.18 - d1) / 0.09));
          const cordB = smooth(clamp((0.18 - d2) / 0.09));
          const cover = cordA + cordB - cordA * cordB;
          const pu = fract(u * 4) - 0.5,
            pv = fract(v * 4) - 0.5;
          const eyelet = smooth(
            clamp((0.09 - Math.sqrt(pu * pu + pv * pv)) / 0.04),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x4f16);
          color = 0.46 + 0.3 * cover - 0.22 * eyelet + 0.06 * grain;
          height = 0.46 + 0.22 * cover - 0.28 * eyelet + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.08 * cover;
          occlusion = 1 - 0.3 * (1 - cover) - 0.45 * eyelet;
          return;
        };
      case 'tassel':
        return () => {
          // Hanging strands fall from the raised binding ring.
          const strand = smooth(
            clamp((0.16 - Math.abs(fract(u * 10) - 0.5)) / 0.08),
          );
          const ring = smooth(clamp((0.08 - Math.abs(fract(v) - 0.1)) / 0.04));
          const grain = noise(u, v, 32, 32, seed ^ 0x28bd);
          color = 0.38 + 0.26 * strand + 0.28 * ring + 0.06 * grain;
          height = 0.42 + 0.22 * strand + 0.3 * ring + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.06 * strand;
          occlusion = 1 - 0.38 * (1 - strand) - 0.12 * (1 - ring);
          return;
        };
      case 'woksurface':
        return () => {
          // Hammered dimples rise over scratched steel with an oil sheen.
          const du = fract(u * 10) - 0.5,
            dv = fract(v * 10) - 0.5;
          const dimple = smooth(
            clamp((0.28 - Math.sqrt(du * du + dv * dv)) / 0.1),
          );
          const scratch = smooth(
            clamp((0.02 - Math.abs(fract((u + v) * 8) - 0.5)) / 0.01),
          );
          const sheen = noise(u, v, 3, 3, seed ^ 0x44d2);
          const grain = noise(u, v, 40, 40, seed ^ 0x21be);
          color =
            0.4 + 0.22 * dimple - 0.1 * scratch + 0.16 * sheen + 0.06 * grain;
          height = 0.44 + 0.16 * dimple - 0.12 * scratch + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.14 * sheen;
          occlusion = 1 - 0.3 * scratch - 0.12 * (1 - dimple);
          return;
        };
      case 'cutlery':
        return () => {
          // Beaded borders frame the finely brushed handle face.
          const edge = Math.min(fract(v), 1 - fract(v));
          const border = smooth(clamp((0.08 - edge) / 0.04));
          const bead = border * (0.5 + 0.5 * Math.cos(TAU * 16 * u));
          const brush = 0.5 + 0.5 * Math.cos(TAU * 20 * v);
          const grain = noise(u, v, 32, 32, seed ^ 0x7724);
          color =
            0.46 + 0.26 * border + 0.16 * bead + 0.06 * brush + 0.05 * grain;
          height =
            0.46 + 0.24 * border + 0.12 * bead + 0.03 * brush + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.12 * bead;
          occlusion = 1 - 0.2 * (1 - border) - 0.12 * (1 - bead) * border;
          return;
        };
      case 'choppingboard':
        return () => {
          // End-grain blocks hold knife scars above the recessed border.
          const gu = Math.min(fract(u * 4), 1 - fract(u * 4)),
            gv = Math.min(fract(v * 4), 1 - fract(v * 4));
          const block =
            smooth(clamp((gu - 0.08) / 0.06)) *
            smooth(clamp((gv - 0.08) / 0.06));
          const s1 = smooth(
            clamp((0.03 - Math.abs(fract((u + v) * 5) - 0.5)) / 0.015),
          );
          const s2 = smooth(
            clamp((0.03 - Math.abs(fract((u - v) * 5) - 0.5)) / 0.015),
          );
          const scar = s1 + s2 - s1 * s2;
          const edgeU = Math.min(fract(u), 1 - fract(u)),
            edgeV = Math.min(fract(v), 1 - fract(v));
          const border =
            1 -
            (1 - smooth(clamp((0.05 - edgeU) / 0.03))) *
              (1 - smooth(clamp((0.05 - edgeV) / 0.03)));
          const grain = noise(u, v, 32, 32, seed ^ 0x51c8);
          color =
            0.5 +
            0.24 * block -
            0.14 * scar * block -
            0.14 * border +
            0.06 * grain;
          height =
            0.48 +
            0.14 * block -
            0.1 * scar * block -
            0.12 * border +
            0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.08 * block;
          occlusion =
            1 - 0.3 * scar * block - 0.24 * border - 0.12 * (1 - block);
          return;
        };
      case 'faucet':
        return () => {
          // A polished dome rises over its base plate with scale spots.
          const dx = u - 0.5,
            dy = v - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const dome = smooth(clamp((0.4 - radius) / 0.12));
          const plate =
            smooth(clamp((0.5 - radius) / 0.05)) *
            smooth(clamp((radius - 0.4) / 0.05));
          const su = fract(u * 8) - 0.5,
            sv = fract(v * 8) - 0.5;
          const spot = smooth(
            clamp((0.12 - Math.sqrt(su * su + sv * sv)) / 0.05),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x6a17);
          color = 0.4 + 0.3 * dome + 0.16 * plate + 0.07 * spot + 0.05 * grain;
          height = 0.4 + 0.3 * dome + 0.14 * plate + 0.05 * spot + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.14 * dome;
          occlusion = 1 - 0.18 * (1 - dome) - 0.1 * spot;
          return;
        };
      case 'showerhead':
        return () => {
          // Spray holes sink into the grooved panel face.
          const dx = u - 0.5,
            dy = v - 0.5;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const panel = smooth(clamp((0.42 - radius) / 0.06));
          const groove = smooth(
            clamp((0.03 - Math.abs(fract(12 * radius) - 0.5)) / 0.015),
          );
          const hu = fract(u * 10) - 0.5,
            hv = fract(v * 10) - 0.5;
          const hole = smooth(
            clamp((0.12 - Math.sqrt(hu * hu + hv * hv)) / 0.05),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x31f8);
          color =
            0.46 +
            0.3 * panel -
            0.12 * groove * panel -
            0.2 * hole * panel +
            0.06 * grain;
          height =
            0.44 +
            0.22 * panel -
            0.1 * groove * panel -
            0.22 * hole * panel +
            0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.1 * panel;
          occlusion =
            1 - 0.3 * hole * panel - 0.12 * groove * panel - 0.2 * (1 - panel);
          return;
        };
      case 'bathmat':
        return () => {
          // Suction cups dome over the striped woven backing.
          const row = Math.floor(v * 8);
          const offset = (row % 2) * 0.5;
          const du = fract(u * 8 + offset) - 0.5,
            dv = fract(v * 8) - 0.5;
          const cup = smooth(clamp((0.3 - Math.sqrt(du * du + dv * dv)) / 0.1));
          const weave = 0.5 + 0.5 * Math.cos(TAU * 12 * v);
          const grain = noise(u, v, 32, 32, seed ^ 0x24cb);
          color = 0.42 + 0.32 * cup + 0.12 * weave + 0.06 * grain;
          height = 0.44 + 0.28 * cup + 0.06 * weave + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.1 * cup;
          occlusion = 1 - 0.34 * (1 - cup) - 0.08 * (1 - weave);
          return;
        };
      case 'blinds':
        return () => {
          // Tilted slat faces rise over the shadowed gaps between them.
          const slat = smooth(
            clamp((0.34 - Math.abs(fract(v * 4) - 0.5)) / 0.16),
          );
          const tilt = smooth(
            clamp((0.02 - Math.abs(fract(v * 4) - 0.5)) / 0.012),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x5f27);
          color = 0.48 + 0.32 * slat - 0.1 * tilt + 0.06 * grain;
          height = 0.46 + 0.3 * slat - 0.08 * tilt + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.1 * slat;
          occlusion = 1 - 0.42 * (1 - slat) - 0.1 * tilt;
          return;
        };
      case 'curtain':
        return () => {
          // Draped folds ripple over the fabric with a woven grain.
          const warp = noise(u, v, 4, 4, seed ^ 0x3c81) - 0.5;
          const fold = smooth(
            clamp((0.34 - Math.abs(fract(5 * (u + 0.1 * warp)) - 0.5)) / 0.16),
          );
          const grain = noise(u, v, 40, 40, seed ^ 0x6e42);
          color = 0.46 + 0.34 * fold + 0.08 * grain;
          height = 0.46 + 0.3 * fold + 0.03 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.08 * fold;
          occlusion = 1 - 0.36 * (1 - fold);
          return;
        };
      case 'shadecloth':
        return () => {
          // Woven threads cross over the open half-shadowed gaps.
          const warp = smooth(
            clamp((0.12 - Math.abs(fract(u * 16) - 0.5)) / 0.06),
          );
          const weft = smooth(
            clamp((0.12 - Math.abs(fract(v * 16) - 0.5)) / 0.06),
          );
          const cover = warp + weft - warp * weft;
          const grain = noise(u, v, 32, 32, seed ^ 0x27d5);
          color = 0.42 + 0.3 * cover + 0.08 * grain;
          height = 0.46 + 0.2 * cover + 0.02 * grain;
          roughness += 0.05 * (grain - 0.5) - 0.08 * cover;
          occlusion = 1 - 0.42 * (1 - cover);
          return;
        };
      case 'sandstone':
        return () => {
          const warp = noise(u, v, 3, 5, seed ^ 0x693d);
          const bedding = v + 0.055 * (warp - 0.5);
          const strata = 0.5 + 0.5 * Math.sin(TAU * (8 * bedding) + phase);
          const lamina = Math.pow(
            0.5 + 0.5 * Math.sin(TAU * (19 * bedding) + phase),
            6,
          );
          const sediment = noise(u, v, 8, 3, seed ^ 0x4d17);
          const grit = smooth(clamp((fine - 0.28) / 0.48));
          const mineral = Math.pow(1 - fine, 5);
          // Unequal warped sediment bands carry small cemented grains, not dunes.
          color =
            0.22 + 0.35 * strata + 0.2 * sediment + 0.18 * grit - 0.2 * lamina;
          height =
            0.32 + 0.16 * strata - 0.09 * lamina + 0.24 * grit - 0.1 * mineral;
          roughness += 0.12 * (grit - 0.5) + 0.05 * lamina;
          occlusion = 0.97 - 0.12 * lamina - 0.13 * mineral + 0.025 * grit;
          return;
        };
      case 'travertine':
        return () => {
          const nx = 12,
            ny = 18;
          const x = u * nx,
            y = v * ny;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let cavities = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % nx) + nx) % nx,
                wy = ((cy % ny) + ny) % ny;
              const variation = hash(wx, wy, seed ^ 0x5e93);
              const angle = (hash(wx, wy, seed ^ 0x23d1) - 0.5) * 0.36;
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const dx = x - cx - 0.2 - 0.6 * hash(wx, wy, seed),
                dy = y - cy - 0.2 - 0.6 * hash(wx, wy, seed ^ 0x7b19);
              const rx = dx * cos + dy * sin,
                ry = dy * cos - dx * sin;
              const width = 0.42 + 0.36 * variation,
                depth = 0.11 + 0.13 * hash(wx, wy, seed ^ 0x8f31);
              const distance =
                (rx * rx) / (width * width) +
                (ry * ry) / (depth * depth) +
                0.12 * Math.sin(9 * rx + variation * TAU) * Math.sin(13 * ry);
              // Irregular elongated bowls have compact support inside this neighborhood.
              const cap = smooth(clamp((1 - distance) / 0.65));
              cavities += cap * (0.65 + 0.35 * variation);
            }
          const vugs = 1 - Math.exp(-1.8 * cavities);
          const warp = noise(u, v, 3, 3, seed ^ 0x41d7);
          const band =
            0.5 + 0.5 * Math.sin(TAU * (6 * v + 0.18 * warp) + phase);
          color = 0.65 + 0.12 * band + 0.09 * fine - 0.48 * vugs;
          height = 0.62 + 0.05 * band + 0.04 * fine - 0.3 * vugs;
          roughness += 0.15 * vugs + 0.08 * (fine - 0.5);
          occlusion = 0.98 - 0.42 * vugs;
          return;
        };
      case 'pumice':
        return () => {
          const cells = 26;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let vesicles = 0,
            rims = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.15 - 0.7 * hash(wx, wy, seed),
                dy = y - cy - 0.15 - 0.7 * hash(wx, wy, seed ^ 0x631f);
              const radius = 0.24 + 0.2 * hash(wx, wy, seed ^ 0x38b9);
              const distance = (dx * dx + dy * dy) / (radius * radius);
              // Rounded gas pockets recess into a continuous matrix with softly raised lips.
              const cap = clamp(1 - distance);
              const bowl = cap * cap;
              vesicles = Math.max(vesicles, bowl);
              rims = Math.max(rims, 6 * distance * bowl);
            }
          const matrix = noise(u, v, 5, 5, seed ^ 0x9c47);
          color =
            0.65 + 0.12 * matrix + 0.08 * fine - 0.57 * vesicles + 0.05 * rims;
          height = 0.72 - 0.58 * vesicles + 0.08 * rims + 0.03 * fine;
          roughness += 0.07 * vesicles + 0.07 * (fine - 0.5);
          occlusion = 0.98 - 0.52 * vesicles + 0.01 * detail;
          return;
        };
      case 'parquet':
        return () => {
          const x = u * 4,
            y = v * 4;
          const bx = Math.floor(x),
            by = Math.floor(y);
          const horizontal = (bx + by) % 2 === 0;
          const along = horizontal ? fract(x) : fract(y),
            across = horizontal ? fract(y) : fract(x);
          const slat = Math.floor(across * 3);
          const edge = Math.min(
            along,
            1 - along,
            fract(across * 3) / 3,
            (1 - fract(across * 3)) / 3,
          );
          const face = smooth(clamp((edge - 0.006) / 0.016));
          const variation = hash(bx * 3 + slat, by, seed);
          const warp = noise(u, v, 8, 8, seed ^ 0x3719);
          const grain =
            0.5 +
            0.5 *
              Math.sin(
                TAU *
                  (across * 38 + 0.28 * Math.sin(TAU * along) + 0.18 * warp) +
                  variation * TAU,
              );
          // All slat-owned grain and finish vanish into a common dark joint.
          color =
            0.06 +
            face * (0.25 + 0.32 * variation + 0.22 * grain + 0.06 * detail);
          height = face * (0.76 + 0.045 * grain + 0.025 * detail);
          roughness =
            0.78 +
            face * (preset.roughness - 0.78 + 0.09 * grain + 0.04 * variation);
          occlusion = 0.52 + 0.46 * face;
          return;
        };
      case 'mosaic':
        return () => {
          const cells = 16;
          const x = u * cells,
            y = v * cells;
          const fx = fract(x),
            fy = fract(y);
          const edge = Math.min(fx, 1 - fx, fy, 1 - fy);
          const face = smooth(clamp((edge - 0.018) / 0.042));
          const variation = hash(Math.floor(x), Math.floor(y), seed);
          color = 0.2 + face * (0.08 + 0.56 * variation + 0.1 * detail);
          height = face * (0.78 + 0.08 * variation + 0.025 * detail);
          roughness =
            0.76 +
            face * (preset.roughness - 0.76 + 0.11 * variation + 0.04 * detail);
          occlusion = 0.6 + 0.39 * face;
          mortar = 1 - face;
          return;
        };
      case 'hexagontiles':
        return () => {
          const root3 = Math.sqrt(3);
          const columns = 5,
            rows = 6;
          const x = u * columns,
            y = (v * rows * root3) / 2;
          const row = Math.floor(y / (root3 / 2));
          let best = Infinity,
            dx = 0,
            dy = 0,
            ownerX = 0,
            ownerY = 0;
          // Even row count makes this staggered triangular lattice wrap in a
          // rectangle. Its Voronoi faces are six genuine straight hexagon edges.
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy;
            const offset = (((cy % 2) + 2) % 2) * 0.5;
            const column = Math.round(x - offset);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox;
              const px = x - cx - offset,
                py = y - (cy * root3) / 2;
              const distance = px * px + py * py;
              if (distance < best) {
                best = distance;
                dx = px;
                dy = py;
                ownerX = ((cx % columns) + columns) % columns;
                ownerY = ((cy % rows) + rows) % rows;
              }
            }
          }
          const edge =
            0.5 -
            Math.max(
              Math.abs(dx),
              Math.abs(dx * 0.5 + (dy * root3) / 2),
              Math.abs(dx * 0.5 - (dy * root3) / 2),
            );
          const face = smooth(clamp((edge - 0.012) / 0.034));
          const variation = hash(ownerX, ownerY, seed);
          // A flat grout bottom removes ownership jumps on diagonal edges too.
          color = 0.2 + face * (0.28 + 0.35 * variation + 0.07 * detail);
          height = face * (0.8 + 0.045 * variation + 0.02 * detail);
          roughness =
            0.74 +
            face * (preset.roughness - 0.74 + 0.1 * variation + 0.04 * detail);
          occlusion = 0.6 + 0.39 * face;
          mortar = 1 - face;
          return;
        };
      case 'knit':
        return () => {
          const x = u * 8,
            y = v * 8;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let yarn = 0;
          // Rounded finite yarn arms overlap at the point of each stockinette V.
          // Their smooth support vanishes before the stitch cell edges.
          for (let side = -1; side <= 1; side += 2) {
            const dx = x - ix - 0.5,
              dy = y - iy - 0.84;
            const sx = side * 0.34,
              sy = -0.68;
            const t = clamp((dx * sx + dy * sy) / (sx * sx + sy * sy));
            const px = dx - t * sx,
              py = dy - t * sy;
            const cap = clamp(1 - (px * px + py * py) / 0.0169);
            const arm = smooth(cap);
            yarn += (1 - yarn) * arm;
          }
          const twist =
            0.5 +
            0.25 * Math.sin(TAU * (48 * u + 24 * v) + phase) +
            0.25 * Math.sin(TAU * (48 * u - 24 * v) - phase);
          color = 0.12 + 0.64 * yarn + 0.1 * detail + 0.07 * yarn * twist;
          height = 0.08 + yarn * (0.76 + 0.045 * twist) + 0.025 * detail;
          roughness += 0.065 * (detail - 0.5) + 0.035 * (1 - yarn);
          occlusion = 0.58 + 0.41 * yarn;
          return;
        };
      case 'corduroy':
        return () => {
          const wale = Math.pow(0.5 + 0.5 * Math.cos(TAU * u * 12), 0.65);
          const pile = noise(u, v, 96, 96, seed ^ 0x2b71);
          const nap = noise(u, v, 12, 48, seed ^ 0x7ca3);
          color = 0.12 + 0.57 * wale + 0.16 * pile + 0.08 * nap;
          height = 0.07 + 0.79 * wale + 0.035 * pile + 0.025 * nap;
          roughness += 0.08 * (pile - 0.5) + 0.035 * (1 - wale);
          occlusion = 0.57 + 0.42 * wale;
          return;
        };
      case 'felt':
        return () => {
          const cells = 20;
          const x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let fibers = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.25 - 0.5 * hash(wx, wy, seed),
                dy = y - cy - 0.25 - 0.5 * hash(wx, wy, seed ^ 0xa375);
              const angle = hash(wx, wy, seed ^ 0x6b17) * TAU;
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const along = (dx * cos + dy * sin) / 0.6,
                across = (dy * cos - dx * sin) / 0.055;
              // Tapered, randomly oriented fibers vanish with zero slope at their
              // elliptical support; none reaches a discarded neighborhood cell.
              const cap = clamp(1 - along * along - across * across);
              fibers += (1 - fibers) * cap * cap;
            }
          color = 0.28 + 0.28 * detail + 0.3 * fibers;
          height = 0.18 + 0.035 * detail + 0.065 * fibers;
          roughness += 0.065 * (detail - 0.5) + 0.025 * fibers;
          occlusion = 0.96 + 0.025 * fibers + 0.01 * detail;
          return;
        };
      case 'wafflecloth':
        return () => {
          const warp = smooth(clamp((Math.cos(TAU * u * 8) - 0.35) / 0.65)),
            weft = smooth(clamp((Math.cos(TAU * v * 8) - 0.35) / 0.65));
          const rim = warp + weft - warp * weft;
          const yarn =
            0.5 +
            0.25 * Math.cos(TAU * u * 96 + phase) +
            0.25 * Math.cos(TAU * v * 96 - phase);
          const cotton = noise(u, v, 24, 24, seed ^ 0x4a73);
          color = 0.22 + 0.48 * rim + 0.12 * yarn + 0.08 * cotton;
          height = 0.12 + 0.66 * rim + 0.035 * yarn + 0.025 * cotton;
          roughness += 0.04 * (cotton - 0.5) + 0.025 * (1 - rim);
          occlusion = 0.65 + 0.32 * rim + 0.02 * yarn;
          return;
        };
      case 'cableknit':
        return () => {
          const x = fract(u * 4),
            y = v * 4;
          const sweep = 0.22 * Math.sin(TAU * y),
            crossing = 0.5 + 0.5 * Math.cos(TAU * y);
          const left = (x - 0.5 - sweep) / 0.115,
            right = (x - 0.5 + sweep) / 0.115;
          // Both strands retain their identity through the crossing. Each
          // compact profile and its owned lift fade with zero support slope.
          const a = smooth(clamp(1 - left * left)),
            b = smooth(clamp(1 - right * right));
          const braid = a + b - a * b;
          const liftA = a * (0.38 + 0.38 * crossing),
            liftB = b * (0.76 - 0.38 * crossing);
          const lift = liftA + liftB - liftA * liftB;
          const rib = smooth(clamp((Math.cos(TAU * x) - 0.5) / 0.5));
          const loops =
            0.5 + 0.5 * Math.cos(TAU * (v * 32 + 0.35 * Math.cos(TAU * x)));
          const wool = noise(u, v, 64, 64, seed ^ 0x37a9);
          const twist = 0.5 + 0.5 * Math.sin(TAU * (u * 96 + v * 48) + phase);
          color =
            0.13 +
            0.55 * lift +
            0.13 * rib +
            0.09 * wool +
            0.04 * braid * twist;
          height =
            0.07 +
            lift +
            0.17 * rib * (0.65 + 0.35 * loops) +
            0.02 * wool +
            0.015 * braid * twist;
          roughness += 0.035 * (wool - 0.5) + 0.025 * (1 - braid);
          occlusion = 0.57 + 0.35 * braid + 0.055 * rib + 0.015 * wool;
          return;
        };
      case 'quilting':
        return () => {
          const diagonalA = (u + v) * 6,
            diagonalB = (u - v) * 6;
          const a = 0.5 - 0.5 * Math.cos(TAU * diagonalA),
            b = 0.5 - 0.5 * Math.cos(TAU * diagonalB);
          const padded = a * b;
          const seamA = smooth(clamp(1 - a / 0.055)),
            seamB = smooth(clamp(1 - b / 0.055));
          const seam = seamA + seamB - seamA * seamB;
          const dashA = smooth(
              clamp((Math.cos(TAU * diagonalB * 8) - 0.2) / 0.8),
            ),
            dashB = smooth(clamp((Math.cos(TAU * diagonalA * 8) - 0.2) / 0.8));
          const stitch =
            seamA * dashA + seamB * dashB - seamA * dashA * seamB * dashB;
          const weave =
            0.5 +
            0.25 * Math.cos(TAU * u * 96 + phase) +
            0.25 * Math.cos(TAU * v * 96 - phase);
          const cloth = noise(u, v, 24, 24, seed ^ 0x6b31);
          color =
            0.3 +
            0.32 * padded -
            0.15 * seam +
            0.12 * stitch +
            0.08 * cloth +
            0.06 * weave;
          height =
            0.13 +
            0.67 * padded -
            0.065 * seam +
            0.035 * stitch +
            0.02 * weave +
            0.015 * cloth;
          roughness += 0.045 * (cloth - 0.5) + 0.025 * seam;
          occlusion = 0.88 + 0.1 * padded - 0.18 * seam + 0.025 * stitch;
          return;
        };
      case 'roofshingles':
        return () => {
          const row = Math.floor(v * 6),
            y = fract(v * 6);
          const shifted = u * 4 + (row % 2) * 0.5,
            x = fract(shifted);
          const course = smooth(clamp(Math.min(y, 1 - y) / 0.12));
          const tab = smooth(clamp(Math.min(x, 1 - x) / 0.055));
          const notch = (1 - tab) * smooth(clamp((y - 0.32) / 0.16)) * course;
          // Tab-owned pigment disappears before either staggered course changes
          // owner; all seams retain the same continuous mineral-granule field.
          const ownership = course * tab;
          const variation = hash(Math.floor(shifted) % 4, row, seed ^ 0x63b7);
          const grit = smooth(
            clamp((noise(u, v, 64, 64, seed ^ 0x4d35) - 0.2) / 0.6),
          );
          const lap = 1 - course;
          color =
            0.24 +
            0.32 * grit +
            0.2 * ownership * variation -
            0.15 * lap -
            0.14 * notch;
          height =
            0.2 +
            0.38 * course -
            0.2 * notch +
            0.13 * grit +
            0.05 * ownership * variation;
          roughness += 0.12 * (grit - 0.5) + 0.04 * lap + 0.03 * notch;
          occlusion = 0.96 - 0.24 * lap - 0.2 * notch + 0.025 * grit;
          return;
        };
      case 'rooftiles':
        return () => {
          const x = fract(u * 6 + 0.5),
            y = fract(v * 5);
          const crown = 0.5 + 0.5 * Math.cos(TAU * u * 6);
          const course = smooth(clamp(Math.min(y, 1 - y) / 0.13));
          const side = smooth(clamp(Math.min(x, 1 - x) / 0.12));
          const ownership = course * side;
          const variation = hash(
            Math.floor(u * 6 + 0.5) % 6,
            Math.floor(v * 5),
            seed ^ 0x7a41,
          );
          const clay = noise(u, v, 24, 32, seed ^ 0x5c27);
          const lap = 1 - course;
          // Cosine crowns meet recessed channels with zero slope, rather than
          // resetting a semicircle at its peak or exposing a flat tile face.
          color =
            0.26 +
            0.24 * crown +
            0.23 * ownership * variation +
            0.14 * clay -
            0.14 * lap;
          height =
            0.16 +
            0.65 * crown -
            0.1 * lap +
            0.035 * ownership * variation +
            0.012 * clay;
          roughness += 0.13 * (clay - 0.5) + 0.05 * (1 - crown) + 0.045 * lap;
          occlusion = 0.76 + 0.22 * crown - 0.14 * lap + 0.015 * clay;
          return;
        };
      case 'stucco':
        return () => {
          const cells = 28,
            x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let aggregate = 0,
            pits = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const variation = hash(wx, wy, seed ^ 0x43b9);
              const dx = x - cx - 0.2 - 0.6 * hash(wx, wy, seed),
                dy = y - cy - 0.2 - 0.6 * hash(wx, wy, seed ^ 0x17c3);
              const radius = 0.3 + 0.25 * variation;
              const cap = clamp(
                1 - (dx * dx + dy * dy * (0.7 + variation)) / (radius * radius),
              );
              const weight = cap * cap;
              // Compact caps and a smooth union keep both relief and slopes
              // continuous as neighboring sprayed grains enter the support.
              if (variation < 0.28) pits += (1 - pits) * weight;
              else aggregate += (1 - aggregate) * weight;
            }
          const trowel = noise(u, v, 5, 7, seed ^ 0x537d);
          color =
            0.52 +
            0.15 * trowel +
            0.19 * aggregate -
            0.24 * pits +
            0.08 * detail;
          height =
            0.27 +
            0.16 * trowel +
            0.43 * aggregate -
            0.22 * pits +
            0.06 * detail;
          roughness += 0.055 * aggregate + 0.065 * pits + 0.05 * (detail - 0.5);
          occlusion = 0.96 - 0.25 * pits - 0.075 * aggregate + 0.02 * detail;
          return;
        };
      case 'lichen':
        return () => {
          const cells = 7,
            x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let crust = 0,
            pigment = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.25 - 0.5 * hash(wx, wy, seed),
                dy = y - cy - 0.25 - 0.5 * hash(wx, wy, seed ^ 0x71b3);
              const angle = Math.atan2(dy, dx);
              const variation = hash(wx, wy, seed ^ 0x3c59);
              const radius =
                (0.38 + 0.16 * variation) *
                (1 +
                  0.13 * Math.cos(5 * angle + variation * TAU) +
                  0.09 * Math.sin(3 * angle - variation * TAU));
              // Lobes only affect the border; the center is a flat mineral crust,
              // not a rounded moss tuft. Every colony fits the fixed neighborhood.
              const face = smooth(
                clamp((1 - Math.hypot(dx, dy) / radius) / 0.18),
              );
              crust += (1 - crust) * face;
              pigment += face * (variation - 0.5);
            }
          const pits = smooth(
            clamp((noise(u, v, 96, 96, seed ^ 0x6a23) - 0.58) / 0.25),
          );
          color =
            0.16 +
            0.13 * detail +
            0.53 * crust +
            0.07 * Math.tanh(pigment) -
            0.18 * crust * pits;
          height = 0.15 + 0.035 * detail + crust * (0.48 - 0.17 * pits);
          roughness += 0.04 * (detail - 0.5) + 0.035 * crust * pits;
          occlusion = 0.9 + 0.08 * crust - 0.15 * crust * pits;
          return;
        };
      case 'leaflitter':
        return () => {
          const cells = 6,
            x = u * cells,
            y = v * cells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let leaves = 0,
            pigment = 0,
            veins = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % cells) + cells) % cells,
                wy = ((cy % cells) + cells) % cells;
              const dx = x - cx - 0.2 - 0.6 * hash(wx, wy, seed),
                dy = y - cy - 0.2 - 0.6 * hash(wx, wy, seed ^ 0x29b7);
              const angle = hash(wx, wy, seed ^ 0x4f31) * TAU;
              const cos = Math.cos(angle),
                sin = Math.sin(angle);
              const variation = hash(wx, wy, seed ^ 0x51a9);
              const along = (dx * cos + dy * sin) / (0.64 + 0.1 * variation),
                across = (dy * cos - dx * sin) / (0.26 + 0.05 * variation);
              // A tapered oval ends in two points. Smooth compact support makes
              // discarded neighbors contribute zero, including their pigment.
              const face = smooth(
                clamp(
                  (1 - along * along - Math.sqrt(across * across + 0.0001)) /
                    0.18,
                ),
              );
              const vein = face * Math.exp(-across * across * 260);
              leaves += (1 - leaves) * face;
              veins += (1 - veins) * vein;
              pigment += face * (variation - 0.5);
            }
          color =
            0.07 +
            0.09 * detail +
            0.56 * leaves +
            0.16 * Math.tanh(pigment) -
            0.12 * veins;
          height = 0.08 + 0.035 * detail + 0.61 * leaves + 0.045 * veins;
          roughness += 0.07 * (detail - 0.5) + 0.045 * (1 - leaves);
          occlusion = 0.53 + 0.44 * leaves;
          return;
        };
      case 'endgrain':
        return () => {
          const dx = fract(u - endgrainCenterU + 0.5) - 0.5,
            dy = fract(v - endgrainCenterV + 0.5) - 0.5;
          const sx = Math.sin(Math.PI * dx) / Math.PI,
            sy = Math.sin(Math.PI * dy) / Math.PI;
          // Squared toroidal distances meet with zero slope at the tile's
          // opposite sides; a small core also regularizes the pith derivative.
          const radius = Math.sqrt(sx * sx + sy * sy + 0.0004);
          const warp = noise(u, v, 5, 5, seed ^ 0x7c43);
          const rings =
            0.5 + 0.5 * Math.sin(TAU * (23 * radius + 0.23 * warp) + phase);
          const latewood = Math.pow(rings, 6);
          const pores = smooth(
            clamp((noise(u, v, 96, 96, seed ^ 0x15e7) - 0.62) / 0.23),
          );
          const distance = Math.hypot(dx, dy);
          const checkSupport =
            smooth(clamp((distance - 0.07) / 0.08)) *
            smooth(clamp((0.43 - distance) / 0.08));
          const checks =
            checkSupport *
            Math.pow(0.5 + 0.5 * Math.cos(7 * Math.atan2(dy, dx) + phase), 48);
          color =
            0.76 -
            0.37 * latewood -
            0.2 * pores -
            0.24 * checks +
            0.08 * detail;
          height =
            0.49 -
            0.07 * latewood -
            0.16 * pores -
            0.22 * checks +
            0.025 * detail;
          roughness += 0.13 * pores + 0.06 * latewood + 0.045 * (detail - 0.5);
          occlusion = 0.99 - 0.17 * pores - 0.22 * checks;
          return;
        };
      case 'acousticfoam':
        return () => {
          const x = fract(u * 4) - 0.5,
            y = fract(v * 4) - 0.5;
          const ax = Math.sqrt(x * x + 0.0001),
            ay = Math.sqrt(y * y + 0.0001);
          // A rounded maximum retains four planar faces, unlike crossed sine
          // ridges. Its flattened foot hides the cell-owned height variation.
          const edge = 0.5 * (ax + ay + Math.sqrt((ax - ay) ** 2 + 0.0004));
          const t = clamp(1 - 2 * edge);
          const pyramid =
            t < 0.1
              ? t * t * 5
              : t > 0.9
                ? 0.9 - (1 - t) * (1 - t) * 5
                : t - 0.05;
          const variation = hash(
            Math.floor(u * 4),
            Math.floor(v * 4),
            seed ^ 0x37d1,
          );
          const pores = smooth(
            clamp((noise(u, v, 96, 96, seed ^ 0x6b19) - 0.42) / 0.46),
          );
          color = 0.14 + 0.61 * pyramid + 0.13 * detail - 0.12 * pores;
          height =
            0.03 +
            pyramid * (0.88 + 0.07 * variation) +
            0.009 * detail -
            0.008 * pores;
          roughness += 0.065 * (detail - 0.5) + 0.025 * pores;
          occlusion = 0.43 + 0.54 * pyramid + 0.025 * detail - 0.025 * pores;
          return;
        };
      case 'closedcellfoam':
        return () => {
          const x = u * 28,
            y = v * 28;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let dimples = 0,
            membranes = 0,
            pigment = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % 28) + 28) % 28,
                wy = ((cy % 28) + 28) % 28;
              const offset = (wy * 28 + wx) * 4;
              const dx = x - cx - foamCells![offset],
                dy = y - cy - foamCells![offset + 1];
              const cap = clamp(
                1 - (dx * dx + dy * dy) * foamCells![offset + 2],
              );
              // Shallow closed dimples have a gently raised membrane, not open
              // cavities. Squared compact support meets the shared skin at C1.
              const weight = cap * cap;
              dimples += (1 - dimples) * weight;
              membranes += (1 - membranes) * weight * (1 - cap) * 6.75;
              pigment += weight * (foamCells![offset + 3] - 0.5);
            }
          color =
            0.49 +
            0.18 * detail -
            0.13 * dimples +
            0.08 * membranes +
            0.1 * pigment;
          height = 0.48 + 0.035 * detail - 0.17 * dimples + 0.055 * membranes;
          roughness += 0.065 * (detail - 0.5) + 0.025 * dimples;
          occlusion = 0.99 - 0.065 * dimples;
          return;
        };
      case 'linoleum':
        return () => {
          const warp = noise(u, v, 4, 5, seed ^ 0x591b);
          const swirl =
            0.5 + 0.5 * Math.sin(TAU * (5 * u + 3 * v + 1.2 * warp) + phase);
          const pigment = noise(
            u + 0.19 * warp,
            v + 0.08 * swirl,
            48,
            8,
            seed ^ 0x2d73,
          );
          const flecks = smooth(clamp((pigment - 0.43) / 0.4));
          // Pigment is marbled through a smooth sheet; it does not carve veins,
          // stone pores or joints into the physical surface.
          color = 0.24 + 0.25 * swirl + 0.38 * flecks + 0.08 * detail;
          height = 0.45 + 0.025 * detail + 0.015 * pigment;
          roughness += 0.09 * (pigment - 0.5) + 0.045 * (detail - 0.5);
          occlusion = 0.99 + 0.008 * detail;
          return;
        };
      case 'orangepeel':
        return () => {
          const x = u * skinColumns,
            y = v * skinRows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let dimples = 0,
            shoulders = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % skinColumns) + skinColumns) % skinColumns,
                wy = ((cy % skinRows) + skinRows) % skinRows;
              const offset = (wy * skinColumns + wx) * 3;
              const dx = x - cx - skinFeatures![offset],
                dy = y - cy - skinFeatures![offset + 1];
              const radius = 0.26 + 0.14 * skinFeatures![offset + 2];
              const distance2 = dx * dx + dy * dy;
              const pit = clamp(1 - distance2 / (radius * radius));
              const skin = clamp(1 - distance2 / 0.36);
              // Compact squared caps meet the shared skin with zero slope.
              // Rounded shoulders surround depressed oil glands, not grit peaks.
              dimples += (1 - dimples) * pit * pit;
              shoulders += (1 - shoulders) * skin * skin * (1 - skin) * 6.75;
            }
          const pigment = 0.48 + 0.28 * detail;
          color = pigment * (1 - 0.35 * dimples) + 0.34 * 0.35 * dimples;
          const skinHeight = 0.46 + 0.025 * detail + 0.045 * shoulders;
          height = skinHeight * (1 - dimples) + 0.22 * dimples;
          roughness += 0.06 * (detail - 0.5) + 0.035 * dimples;
          occlusion = 1 - 0.08 * dimples;
          return;
        };
      case 'coconut':
        return () => {
          const x = u * skinColumns,
            y = v * skinRows;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let fibers = 0,
            fissures = 0,
            pigment = 0.38 + 0.18 * detail;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % skinColumns) + skinColumns) % skinColumns,
                wy = ((cy % skinRows) + skinRows) % skinRows;
              const offset = (wy * skinColumns + wx) * 3;
              const dx = x - cx - skinFeatures![offset],
                dy = y - cy - skinFeatures![offset + 1],
                variation = skinFeatures![offset + 2];
              const along = dy / (0.48 + 0.25 * variation),
                across = (dx + (variation - 0.5) * 0.28 * dy) / 0.12;
              const cap = clamp(1 - along * along - across * across);
              const weight = cap * cap;
              // Short longitudinal fibers and hairline fissures taper inside
              // the neighborhood. Cell-owned pigment vanishes with its support.
              if (variation < 0.24) {
                fissures += (1 - fissures) * weight;
                pigment = pigment * (1 - weight) + 0.15 * weight;
              } else {
                fibers += (1 - fibers) * weight;
                pigment =
                  pigment * (1 - weight) + (0.55 + 0.25 * variation) * weight;
              }
            }
          color = pigment;
          const husk = 0.42 + 0.055 * detail + 0.18 * fibers;
          height = husk * (1 - fissures) + 0.3 * fissures;
          roughness += 0.055 * (detail - 0.5) + 0.025 * fibers;
          occlusion =
            (0.96 + 0.025 * fibers) * (1 - fissures) + 0.86 * fissures;
          return;
        };
      case 'watermelon':
        return () => {
          const warp = noise(u, v, 4, 5, seed ^ 0x4f17),
            waviness = noise(u, v, 12, 8, seed ^ 0x67a3);
          const wave =
            0.5 +
            0.5 *
              Math.sin(TAU * (5 * u + 0.3 * warp + 0.12 * waviness) + phase);
          const bands = smooth(clamp((wave - 0.24) / 0.52));
          const speckles = smooth(
            clamp((noise(u, v, 96, 96, seed ^ 0x5c39) - 0.48) / 0.4),
          );
          const pores = smooth(
            clamp((noise(u, v, 80, 80, seed ^ 0x2b71) - 0.5) / 0.38),
          );
          const pigment = 0.12 + 0.72 * bands;
          color = pigment * (1 - 0.2 * speckles) + 0.46 * 0.2 * speckles;
          // Bands are pigmentation only: no longitudinal ridges in the rind.
          height = (0.48 + 0.025 * detail) * (1 - 0.14 * pores);
          roughness += 0.055 * (detail - 0.5) + 0.045 * pores;
          occlusion = 1 - 0.035 * pores;
          return;
        };
      case 'limestone':
        return () => {
          const x = u * 24,
            y = v * 24;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          const pores = smooth(
            clamp((noise(u, v, 96, 96, seed ^ 0x19d7) - 0.49) / 0.38),
          );
          let grains = 0;
          color = 0.63 + 0.14 * detail - 0.16 * pores;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % 24) + 24) % 24,
                wy = ((cy % 24) + 24) % 24;
              const offset = (wy * 24 + wx) * 7;
              const dx = x - cx - ooids![offset],
                dy = y - cy - ooids![offset + 1];
              const rx =
                  (dx * ooids![offset + 4] + dy * ooids![offset + 5]) /
                  ooids![offset + 2],
                ry =
                  (dy * ooids![offset + 4] - dx * ooids![offset + 5]) /
                  (ooids![offset + 2] * ooids![offset + 3]);
              const distance = rx * rx + ry * ry;
              const weight = smooth(clamp((1 - distance) / 0.36));
              const variation = ooids![offset + 6];
              // Rounded carbonate grains carry faint concentric growth rings;
              // all grain-owned color fades into the finely porous matrix.
              const ring = 0.5 + 0.5 * Math.cos(TAU * 1.5 * distance);
              const pigment = 0.5 + 0.24 * variation + 0.16 * ring;
              color = color * (1 - weight) + pigment * weight;
              grains += (1 - grains) * weight;
            }
          height = 0.47 + 0.08 * grains + 0.025 * detail - 0.07 * pores;
          roughness += 0.06 * (detail - 0.5) + 0.08 * pores - 0.05 * grains;
          occlusion = 0.98 - 0.12 * pores + 0.015 * grains;
          return;
        };
      case 'breccia':
        return () => {
          const x = u * 6,
            y = v * 6;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          const cement = noise(u, v, 80, 80, seed ^ 0x5d21);
          let coverage = 0;
          color = 0.56 + 0.16 * cement;
          height = 0.33 + 0.035 * cement;
          roughness += 0.08 * cement;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const wx = ((cx % 6) + 6) % 6,
                wy = ((cy % 6) + 6) % 6;
              const offset = (wy * 6 + wx) * 18;
              const dx = x - cx - clasts![offset],
                dy = y - cy - clasts![offset + 1];
              let face = 1;
              for (let edge = 0; edge < 5; edge++) {
                const plane = offset + 3 + edge * 3;
                const inward =
                  clasts![plane + 2] -
                  dx * clasts![plane] -
                  dy * clasts![plane + 1];
                face *= smooth(clamp(inward / 0.055));
              }
              const variation = clasts![offset + 2];
              // Smooth half-plane products retain angular fractured outlines
              // without a nearest-feature switch or rectangular masonry joints.
              const pigment = 0.15 + 0.66 * variation + 0.12 * detail;
              color = color * (1 - face) + pigment * face;
              height =
                height * (1 - face) +
                (0.54 + 0.1 * variation + 0.025 * detail) * face;
              roughness =
                roughness * (1 - face) +
                (preset.roughness + 0.08 * (detail - 0.5)) * face;
              coverage += (1 - coverage) * face;
            }
          occlusion = 0.81 + 0.17 * coverage + 0.015 * cement;
          return;
        };
      case 'gneiss':
        return () => {
          const warp = noise(u, v, 4, 4, seed ^ 0x6b19);
          const folded =
            v +
            0.28 * Math.sin(TAU * u + 0.8 * Math.sin(TAU * v) + phase) +
            0.06 * Math.sin(TAU * (2 * u - v) + phase);
          const angle = TAU * 6 * folded + 1.4 * (warp - 0.5);
          const bands = smooth(
            clamp((0.5 + 0.5 * Math.sin(angle) - 0.18) / 0.64),
          );
          const lamina = 0.5 + 0.5 * Math.sin(3 * angle + 0.4 * warp);
          const crystal = noise(u, v, 96, 96, seed ^ 0x3c75);
          const flecks = smooth(clamp((crystal - 0.52) / 0.34));
          const pigment = 0.12 + 0.7 * bands + 0.08 * lamina;
          color = pigment * (1 - 0.3 * flecks) + 0.88 * 0.3 * flecks;
          // Light and dark minerals occupy broad folded bands, not isolated
          // marble veins; small crystalline grains add restrained surface relief.
          height = 0.42 + 0.055 * bands + 0.07 * flecks + 0.025 * detail;
          roughness +=
            0.08 * (detail - 0.5) + 0.06 * (1 - bands) - 0.05 * flecks;
          occlusion = 0.95 + 0.025 * bands + 0.015 * flecks;
          return;
        };
      case 'plywood':
        return () => {
          const warp = noise(u, v, 4, 3, seed ^ 0x43b7);
          // Rotary-cut growth surfaces form broad nested cathedral arches,
          // rather than plank seams or the exposed laminate edges of a panel.
          const growth =
            3.2 * Math.cos(TAU * u + phase) +
            1.8 * Math.cos(TAU * v + 0.7 * phase) +
            0.45 * warp;
          const grain = Math.pow(0.5 + 0.5 * Math.sin(TAU * growth), 5);
          const fiber =
            0.5 + 0.5 * Math.sin(TAU * (64 * u + 0.4 * warp) + phase);
          color = 0.67 + 0.1 * detail - 0.32 * grain + 0.035 * fiber;
          height = 0.48 + 0.025 * detail - 0.045 * grain + 0.015 * fiber;
          roughness += 0.05 * grain + 0.04 * (detail - 0.5);
          occlusion = 0.99 - 0.045 * grain;
          for (let eye = 0; eye < 2; eye++) {
            const offset = eye * 3;
            const dx = fract(u - veneerEyes![offset] + 0.5) - 0.5,
              dy = fract(v - veneerEyes![offset + 1] + 0.5) - 0.5;
            const scale = veneerEyes![offset + 2];
            const radius =
              (dx * dx) / (0.0025 * scale * scale) +
              (dy * dy) / (0.0169 * scale * scale);
            const cap = Math.max(0, 1 - radius),
              weight = cap * cap;
            const ring = 0.5 + 0.5 * Math.cos(TAU * 2 * radius);
            color = color * (1 - weight) + (0.25 + 0.2 * ring) * weight;
            height = height * (1 - weight) + (0.44 + 0.025 * ring) * weight;
            roughness =
              roughness * (1 - weight) +
              (preset.roughness + 0.065 * ring) * weight;
            occlusion =
              occlusion * (1 - weight) + (0.95 + 0.025 * ring) * weight;
          }
          return;
        };
      case 'osb':
      case 'chipboard':
        return () => {
          const x = u * strandCells,
            y = v * strandCells;
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let coverage = 0;
          color = 0.24 + 0.12 * detail;
          height = 0.35 + 0.025 * detail;
          roughness += 0.035 * detail;
          for (let layer = 0; layer < 2; layer++)
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                const cx = ix + ox,
                  cy = iy + oy;
                const wx = ((cx % strandCells) + strandCells) % strandCells,
                  wy = ((cy % strandCells) + strandCells) % strandCells;
                const offset =
                  ((layer * strandCells + wy) * strandCells + wx) * 26;
                const dx = x - cx - strands![offset],
                  dy = y - cy - strands![offset + 1];
                const along =
                    (dx * strands![offset + 2] + dy * strands![offset + 3]) /
                    strands![offset + 4],
                  across =
                    (dy * strands![offset + 2] - dx * strands![offset + 3]) /
                    strands![offset + 5];
                let face = 1;
                for (let edge = 0; edge < 6; edge++) {
                  const plane = offset + 8 + edge * 3;
                  face *= smooth(
                    clamp(
                      (strands![plane + 2] -
                        along * strands![plane] -
                        across * strands![plane + 1]) /
                        0.12,
                    ),
                  );
                }
                if (face === 0) continue;
                const variation = strands![offset + 6];
                const fiber =
                  0.5 +
                  0.5 *
                    Math.sin(
                      18 * across +
                        0.65 * Math.sin(3 * along) +
                        strands![offset + 7],
                    );
                // Every flake-owned field fades with the same compact polygon.
                // Convex over-compositing keeps overlapping strata bounded.
                color =
                  color * (1 - face) +
                  (0.34 + 0.44 * variation + 0.1 * fiber) * face;
                height =
                  height * (1 - face) +
                  (0.49 + 0.12 * variation + 0.025 * fiber) * face;
                roughness =
                  roughness * (1 - face) +
                  (preset.roughness - 0.045 + 0.07 * fiber) * face;
                coverage += (1 - coverage) * face;
              }
          occlusion = 0.83 + 0.15 * coverage + 0.015 * detail;
          return;
        };
      case 'crackleglaze':
        return () => {
          const x = u * 16 + 0.6 * (noise(u, v, 4, 4, seed ^ 0x35ad) - 0.5),
            y = v * 16 + 0.6 * (noise(u, v, 4, 4, seed ^ 0x71c3) - 0.5);
          const ix = Math.floor(x),
            iy = Math.floor(y);
          let faces = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const offset =
                ((((cy % 16) + 16) % 16) * 16 + (((cx % 16) + 16) % 16)) * 26;
              const dx = x - cx - glazeCells![offset],
                dy = y - cy - glazeCells![offset + 1];
              let face = 1;
              for (let edge = 0; edge < 8; edge++) {
                const plane = offset + 2 + edge * 3;
                face *= smooth(
                  clamp(
                    (glazeCells![plane + 2] -
                      dx * glazeCells![plane] -
                      dy * glazeCells![plane + 1]) /
                      0.024,
                  ),
                );
              }
              faces += face;
            }
          const cracks = 1 - clamp(faces);
          color = (0.87 + 0.035 * detail) * (1 - cracks) + 0.08 * cracks;
          height = 0.54 - 0.12 * cracks;
          roughness += 0.14 * cracks + 0.015 * (detail - 0.5);
          occlusion = 1 - 0.14 * cracks;
          return;
        };
      case 'flutedceramic':
        return () => {
          const flute = 0.5 + 0.5 * Math.cos(TAU * 8 * u + phase);
          const speckles = smooth(
            clamp((noise(u, v, 96, 96, seed ^ 0x5f29) - 0.65) / 0.28),
          );
          color = 0.88 + 0.035 * detail - 0.12 * speckles;
          height = 0.2 + 0.6 * flute;
          roughness += 0.035 * (1 - flute) + 0.025 * speckles;
          occlusion = 0.92 + 0.08 * flute;
          return;
        };
      case 'encaustictiles':
        return () => {
          const x = fract(u * 4),
            y = fract(v * 4);
          // A product keeps both slopes smooth where the two grout bevels meet.
          const face =
            smooth(clamp((Math.min(x, 1 - x) - 0.02) / 0.08)) *
            smooth(clamp((Math.min(y, 1 - y) - 0.02) / 0.08));
          const dx = x - 0.5,
            dy = y - 0.5;
          const rx = dx * motifCos + dy * motifSin,
            ry = dy * motifCos - dx * motifSin;
          let petals = 0;
          for (let petal = 0; petal < 4; petal++) {
            const px = petal < 2 ? rx : ry,
              py = petal < 2 ? ry : rx;
            const along = (px - (petal % 2 === 0 ? 0.16 : -0.16)) / 0.19,
              across = py / 0.085;
            const weight = smooth(
              clamp((1 - along * along - across * across) / 0.22),
            );
            petals += (1 - petals) * weight;
          }
          const radius2 = dx * dx + dy * dy;
          const ring =
            smooth(clamp((radius2 - 0.135) / 0.008)) *
            (1 - smooth(clamp((radius2 - 0.158) / 0.008)));
          const motif = petals + (1 - petals) * ring;
          color = 0.94 - 0.84 * motif + 0.012 * (detail - 0.5);
          // Inlaid pigment changes no height: only the square grout is recessed.
          height = 0.18 + 0.4 * face;
          mortar = 1 - face;
          roughness += 0.12 * mortar + 0.035 * (detail - 0.5);
          occlusion = 0.77 + 0.23 * face;
          return;
        };
      case 'breadcrust':
        return () => {
          const x = u * 7,
            y = v * 7,
            ix = Math.floor(x),
            iy = Math.floor(y);
          let plates = 0,
            puff = 0,
            toast = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const offset =
                ((((cy % 7) + 7) % 7) * 7 + (((cx % 7) + 7) % 7)) * 27;
              const dx = x - cx - crustPlates![offset],
                dy = y - cy - crustPlates![offset + 1];
              let plate = 1,
                crown = 1;
              for (let edge = 0; edge < 8; edge++) {
                const plane = offset + 3 + edge * 3;
                const inset =
                  crustPlates![plane + 2] -
                  dx * crustPlates![plane] -
                  dy * crustPlates![plane + 1];
                plate *= smooth(clamp((inset - 0.025) / 0.14));
                crown *= smooth(clamp((inset - 0.025) / 0.5));
              }
              plates += plate;
              puff += crown;
              toast += plate * crustPlates![offset + 2];
            }
          const baked = noise(u, v, 19, 23, seed ^ 0x47c3);
          color = 0.06 + plates * (0.42 + 0.21 * baked) + 0.2 * toast;
          height =
            0.12 +
            0.42 * plates +
            0.26 * puff +
            0.012 * plates * (detail - 0.5);
          roughness += 0.08 * (1 - plates) + 0.035 * (baked - 0.5);
          occlusion = 0.65 + 0.35 * plates;
          return;
        };
      case 'wafer':
        return () => {
          const x = fract(u * 12),
            y = fract(v * 12);
          // Independent rounded walls meet as a product, not a min-edge cusp.
          // Broad pocket floors and narrow continuous ribs have no yarn crossing.
          const pocket =
            smooth(clamp((Math.min(x, 1 - x) - 0.07) / 0.17)) *
            smooth(clamp((Math.min(y, 1 - y) - 0.07) / 0.17));
          const baked = noise(u, v, 24, 24, seed ^ 0x6d31);
          color = 0.46 + 0.27 * pocket + 0.12 * baked + 0.035 * detail;
          height = 0.72 - 0.5 * pocket + 0.008 * (detail - 0.5);
          roughness += 0.06 * pocket + 0.02 * (baked - 0.5);
          occlusion = 1 - 0.23 * pocket;
          return;
        };
      case 'chocolate':
        return () => {
          const x = fract(u * 4),
            y = fract(v * 4);
          const segment =
            smooth(clamp((Math.min(x, 1 - x) - 0.035) / 0.105)) *
            smooth(clamp((Math.min(y, 1 - y) - 0.035) / 0.105));
          const cocoa = noise(u, v, 4, 4, seed ^ 0x31b9);
          color = 0.18 + 0.46 * segment + 0.065 * cocoa + 0.008 * detail;
          // The mold's broad top stays exactly flat; only its scoring has relief.
          height = 0.14 + 0.65 * segment;
          roughness += 0.1 * (1 - segment) + 0.008 * (cocoa - 0.5);
          occlusion = 0.73 + 0.27 * segment;
          return;
        };
      case 'pretzel':
        return () => {
          // Interlaced dough ropes cross at raised knots, dusted with salt.
          const ropeA = smooth(
            clamp((0.18 - Math.abs(fract((u + v) * 3) - 0.5)) / 0.12),
          );
          const ropeB = smooth(
            clamp((0.18 - Math.abs(fract((u - v) * 3) - 0.5)) / 0.12),
          );
          const twist = ropeA + ropeB - ropeA * ropeB;
          const knot = ropeA * ropeB;
          const salt = smooth(
            clamp((noise(u, v, 24, 24, seed ^ 0x19af) - 0.78) / 0.06),
          );
          const grain = noise(u, v, 16, 16, seed ^ 0x2f31);
          color = 0.42 + 0.28 * twist + 0.1 * knot + 0.1 * salt + 0.06 * grain;
          height =
            0.42 + 0.22 * twist + 0.1 * knot + 0.04 * salt + 0.015 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * knot - 0.18 * salt;
          occlusion = 1 - 0.34 * (1 - twist) - 0.1 * (1 - knot);
          return;
        };
      case 'bagel':
        return () => {
          // A chewy ring rises around the recessed hole, seeded with sesame.
          const dx = Math.min(Math.abs(u - 0.5), 1 - Math.abs(u - 0.5));
          const dy = Math.min(Math.abs(v - 0.5), 1 - Math.abs(v - 0.5));
          const d = Math.hypot(dx, dy) * 2;
          const ring = smooth(clamp((0.12 - Math.abs(d - 0.34)) / 0.06));
          const hole = smooth(clamp((0.16 - d) / 0.08));
          const sesame = smooth(
            clamp((noise(u, v, 20, 20, seed ^ 0x4c1d) - 0.78) / 0.06),
          );
          const grain = noise(u, v, 16, 16, seed ^ 0x5b2e);
          color =
            0.44 + 0.3 * ring - 0.16 * hole + 0.12 * sesame + 0.06 * grain;
          height =
            0.46 + 0.26 * ring - 0.16 * hole + 0.05 * sesame + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * ring - 0.18 * sesame;
          occlusion = 1 - 0.3 * hole - 0.14 * (1 - ring);
          return;
        };
      case 'croissant':
        return () => {
          // Buttered layers stack in diagonal ridges with browned seams.
          const turn = fract((u + v) * 4);
          const layer = smooth(clamp((0.3 - Math.abs(turn - 0.5)) / 0.14));
          const seam = smooth(clamp((0.12 - Math.min(turn, 1 - turn)) / 0.03));
          const grain = noise(u, v, 16, 16, seed ^ 0x6d47);
          color = 0.44 + 0.34 * layer - 0.14 * seam + 0.08 * grain;
          height = 0.44 + 0.28 * layer - 0.06 * seam + 0.03 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * layer + 0.1 * seam;
          occlusion = 1 - 0.34 * (1 - layer) - 0.1 * seam;
          return;
        };
      case 'butterflywing':
        return () => {
          // Overlapping scale tiles sit in the cells between raised wing veins.
          const tile =
            smooth(clamp((0.28 - Math.abs(fract(u * 24) - 0.5)) / 0.12)) *
            smooth(clamp((0.28 - Math.abs(fract(v * 16) - 0.5)) / 0.12));
          const vein = smooth(
            clamp((0.06 - Math.min(fract(u * 3), 1 - fract(u * 3))) / 0.025),
          );
          const patch = noise(u, v, 6, 6, seed ^ 0x71c3);
          const grain = noise(u, v, 48, 48, seed ^ 0x2a55);
          color = 0.42 + 0.3 * tile - 0.1 * vein + 0.12 * patch + 0.06 * grain;
          height = 0.44 + 0.22 * tile - 0.14 * vein + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * tile + 0.12 * vein;
          occlusion = 1 - 0.3 * (1 - tile) - 0.24 * vein;
          return;
        };
      case 'beetlewing':
        return () => {
          // Elytra plates dome above their sutured seams and fine punctures.
          const plate = smooth(
            clamp((0.32 - Math.abs(fract(u * 6) - 0.5)) / 0.14),
          );
          const suture = smooth(
            clamp((0.12 - Math.min(fract(u * 6), 1 - fract(u * 6))) / 0.03),
          );
          const puncture = smooth(
            clamp((noise(u, v, 24, 24, seed ^ 0x55aa) - 0.8) / 0.05),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x39f1);
          color =
            0.42 + 0.32 * plate - 0.12 * suture - 0.1 * puncture + 0.06 * grain;
          height =
            0.44 + 0.26 * plate - 0.1 * suture - 0.06 * puncture + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * plate + 0.1 * suture;
          occlusion = 1 - 0.3 * suture - 0.14 * (1 - plate) - 0.18 * puncture;
          return;
        };
      case 'spiderweb':
        return () => {
          // Radial spokes and concentric silk rings frame the open cells, beaded with dew.
          const spokeU = smooth(clamp((0.012 - Math.abs(u - 0.5)) / 0.008));
          const spokeV = smooth(clamp((0.012 - Math.abs(v - 0.5)) / 0.008));
          const d1 = Math.abs(u - v),
            d2 = Math.abs(u + v - 1);
          const spokeA = smooth(clamp((0.012 - Math.min(d1, 1 - d1)) / 0.008));
          const spokeB = smooth(clamp((0.012 - Math.min(d2, 1 - d2)) / 0.008));
          const spoke =
            1 - (1 - spokeU) * (1 - spokeV) * (1 - spokeA) * (1 - spokeB);
          const rad =
            Math.hypot(
              Math.sin(Math.PI * (u - 0.5)),
              Math.sin(Math.PI * (v - 0.5)),
            ) *
            (2 / Math.PI);
          const ring =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(rad * 6) - 0.5));
          const silk = 1 - (1 - spoke) * (1 - ring);
          const dew = smooth(
            clamp((noise(u, v, 20, 20, seed ^ 0x7d21) - 0.82) / 0.08),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x1b64);
          color = 0.4 + 0.3 * silk + 0.12 * dew + 0.08 * grain;
          height = 0.42 + 0.2 * silk + 0.05 * dew + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.16 * silk - 0.1 * dew;
          occlusion = 1 - 0.34 * (1 - silk);
          return;
        };
      case 'cirrus':
        return () => {
          // Wind-combed streaks feather across the open high air.
          const warp = noise(u, v, 3, 3, seed ^ 0x2345) - 0.5;
          const streak = smooth(
            clamp((0.3 - Math.abs(fract((v + 0.18 * warp) * 6) - 0.5)) / 0.16),
          );
          const fiber = noise(u, v, 32, 16, seed ^ 0x3456);
          color = 0.46 + 0.34 * streak + 0.08 * fiber;
          height = 0.46 + 0.22 * streak + 0.02 * fiber;
          roughness += 0.06 * (fiber - 0.5) - 0.12 * streak;
          occlusion = 1 - 0.32 * (1 - streak);
          return;
        };
      case 'cumulus':
        return () => {
          // Puffy cauliflower domes pile above the shaded gaps between them.
          const puff = smooth(
            clamp((noise(u, v, 5, 5, seed ^ 0x4567) - 0.42) / 0.18),
          );
          const wisp = noise(u, v, 12, 12, seed ^ 0x5678);
          color = 0.48 + 0.36 * puff + 0.08 * wisp;
          height = 0.44 + 0.3 * puff + 0.02 * wisp;
          roughness += 0.06 * (wisp - 0.5) - 0.1 * puff;
          occlusion = 1 - 0.36 * (1 - puff);
          return;
        };
      case 'lightning':
        return () => {
          // A jagged bolt core glows above the dark storm sky.
          const warp = noise(u, v, 4, 4, seed ^ 0x6789) - 0.5;
          const zig = fract((u + v) * 3 + 0.35 * warp);
          const bolt = smooth(clamp((0.022 - Math.abs(zig - 0.5)) / 0.012));
          const glow = smooth(clamp((0.16 - Math.abs(zig - 0.5)) / 0.14));
          const grain = noise(u, v, 32, 32, seed ^ 0x789a);
          color = 0.22 + 0.3 * glow + 0.4 * bolt + 0.06 * grain;
          height = 0.44 + 0.16 * glow + 0.18 * bolt + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.14 * bolt;
          occlusion = 1 - 0.36 * (1 - glow) - 0.14 * (1 - bolt);
          return;
        };
      case 'kelp':
        return () => {
          // Broad slick blades ripple in waves above the shadowed troughs.
          const warp = noise(u, v, 4, 4, seed ^ 0x1122) - 0.5;
          const wave = smooth(
            clamp((0.32 - Math.abs(fract((v + 0.12 * warp) * 4) - 0.5)) / 0.16),
          );
          const slick = smooth(
            clamp((noise(u, v, 8, 8, seed ^ 0x2233) - 0.68) / 0.08),
          );
          const grain = noise(u, v, 24, 24, seed ^ 0x3344);
          color = 0.44 + 0.3 * wave + 0.1 * slick + 0.08 * grain;
          height = 0.44 + 0.28 * wave + 0.05 * slick + 0.02 * grain;
          roughness += 0.08 * (grain - 0.5) - 0.22 * slick - 0.1 * wave;
          occlusion = 1 - 0.36 * (1 - wave) - 0.1 * (1 - slick);
          return;
        };
      case 'seaweed':
        return () => {
          // Fine branching threads weave over the shaded gaps of the mat.
          const warp = noise(u, v, 3, 3, seed ^ 0x4455) - 0.5;
          const branchA = smooth(
            clamp(
              (0.05 - Math.abs(fract((u + v) * 3 + 0.3 * warp) - 0.5)) / 0.03,
            ),
          );
          const branchB = smooth(
            clamp(
              (0.05 - Math.abs(fract((u - v) * 3 + 0.3 * warp) - 0.5)) / 0.03,
            ),
          );
          const branch = branchA + branchB - branchA * branchB;
          const grain = noise(u, v, 24, 24, seed ^ 0x5566);
          color = 0.42 + 0.3 * branch + 0.08 * grain;
          height = 0.44 + 0.22 * branch + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * branch;
          occlusion = 1 - 0.34 * (1 - branch);
          return;
        };
      case 'anemone':
        return () => {
          // Ringed tentacles rise around the recessed central mouth.
          const rad =
            Math.hypot(
              Math.sin(Math.PI * (u - 0.5)),
              Math.sin(Math.PI * (v - 0.5)),
            ) *
            (2 / Math.PI);
          const fade = smooth(clamp((rad - 0.12) / 0.08));
          const tentacle =
            (0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(rad * 8) - 0.5))) * fade;
          const mouth = smooth(clamp((0.12 - rad) / 0.06));
          const grain = noise(u, v, 24, 24, seed ^ 0x6677);
          color = 0.42 + 0.32 * tentacle - 0.12 * mouth + 0.08 * grain;
          height = 0.44 + 0.26 * tentacle - 0.12 * mouth + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * tentacle;
          occlusion = 1 - 0.3 * mouth - 0.12 * (1 - tentacle) * fade;
          return;
        };
      case 'candy':
        return () => {
          // Glossy hard-candy stripes twist above their shallow seams.
          const turn = fract((u + v) * 4);
          const stripe = smooth(clamp((0.34 - Math.abs(turn - 0.5)) / 0.12));
          const seam = smooth(clamp((0.1 - Math.min(turn, 1 - turn)) / 0.03));
          const gloss = noise(u, v, 16, 16, seed ^ 0x7788);
          color = 0.42 + 0.36 * stripe - 0.12 * seam + 0.08 * gloss;
          height = 0.44 + 0.26 * stripe - 0.06 * seam + 0.02 * gloss;
          roughness += 0.08 * (gloss - 0.5) - 0.12 * stripe;
          occlusion = 1 - 0.32 * (1 - stripe) - 0.12 * seam;
          return;
        };
      case 'marshmallow':
        return () => {
          // Soft piped ridges roll over their rounded grooves, dusted with starch.
          const roll = fract((u + v) * 5);
          const ridge = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (roll - 0.5));
          const starch = smooth(
            clamp((noise(u, v, 20, 20, seed ^ 0x8899) - 0.7) / 0.1),
          );
          const grain = noise(u, v, 24, 24, seed ^ 0x99aa);
          color = 0.5 + 0.3 * ridge + 0.1 * starch + 0.06 * grain;
          height = 0.44 + 0.28 * ridge + 0.05 * starch + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * ridge;
          occlusion = 1 - 0.32 * (1 - ridge);
          return;
        };
      case 'nougat':
        return () => {
          // Nut chunks and bubble pits break the chewy sugar base.
          const nut = smooth(
            clamp((noise(u, v, 6, 6, seed ^ 0xaabb) - 0.55) / 0.12),
          );
          const pit = smooth(
            clamp((noise(u, v, 16, 16, seed ^ 0xbbcc) - 0.72) / 0.05),
          );
          const grain = noise(u, v, 24, 24, seed ^ 0xccdd);
          color = 0.44 + 0.3 * nut - 0.12 * pit + 0.08 * grain;
          height = 0.44 + 0.24 * nut - 0.1 * pit + 0.02 * grain;
          roughness += 0.08 * (grain - 0.5) - 0.1 * nut + 0.12 * pit;
          occlusion = 1 - 0.34 * (1 - nut) - 0.18 * pit;
          return;
        };
      case 'frostedglass':
        return () => {
          // Fine acid-etch speckle scatters over the pane.
          const etch = smooth(
            clamp((noise(u, v, 32, 32, seed ^ 0xdd11) - 0.42) / 0.16),
          );
          const micro = noise(u, v, 64, 64, seed ^ 0xee22);
          color = 0.5 + 0.26 * etch + 0.08 * micro;
          height = 0.46 + 0.18 * etch + 0.02 * micro;
          roughness += 0.08 * (micro - 0.5) - 0.1 * etch;
          occlusion = 1 - 0.28 * (1 - etch);
          return;
        };
      case 'rippledglass':
        return () => {
          // Vertical rolled ribs ripple across the drawn glass.
          const rib = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(u * 6) - 0.5));
          const micro = noise(u, v, 32, 32, seed ^ 0xff33);
          color = 0.48 + 0.32 * rib + 0.08 * micro;
          height = 0.46 + 0.26 * rib + 0.02 * micro;
          roughness += 0.08 * (micro - 0.5) - 0.12 * rib;
          occlusion = 1 - 0.3 * (1 - rib);
          return;
        };
      case 'bubbleglass':
        return () => {
          // Seeded round bubbles dome over the clear glass body.
          const dx = fract(u * 8) - 0.5,
            dy = fract(v * 8) - 0.5;
          const r = Math.hypot(dx, dy);
          const bubble = smooth(clamp((0.34 - r) / 0.14));
          const micro = noise(u, v, 32, 32, seed ^ 0x1a44);
          color = 0.48 + 0.32 * bubble + 0.08 * micro;
          height = 0.46 + 0.24 * bubble + 0.02 * micro;
          roughness += 0.08 * (micro - 0.5) - 0.12 * bubble;
          occlusion = 1 - 0.3 * (1 - bubble);
          return;
        };
      case 'saddlestitch':
        return () => {
          // Saddle stitches dash along their seam above the grained leather.
          const se = (u - v) * 2 - 0.25;
          const line = smooth(
            clamp((0.05 - Math.min(fract(se), 1 - fract(se))) / 0.03),
          );
          const dash = smooth(
            clamp((0.3 - Math.abs(fract((u + v) * 8) - 0.5)) / 0.12),
          );
          const stitch = line * dash;
          const grain = noise(u, v, 24, 24, seed ^ 0x2b55);
          color = 0.42 + 0.3 * stitch + 0.08 * grain;
          height = 0.44 + 0.24 * stitch + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * stitch;
          occlusion = 1 - 0.32 * (1 - stitch);
          return;
        };
      case 'tooledleather':
        return () => {
          // Tooled medallions with swirl rings emboss over the compressed ground.
          const tx = fract(u * 4) - 0.5,
            ty = fract(v * 4) - 0.5;
          const r = Math.hypot(tx, ty);
          const medallion = smooth(clamp((0.36 - r) / 0.16));
          const swirl = smooth(clamp((0.035 - Math.abs(r - 0.18)) / 0.02));
          const grain = noise(u, v, 24, 24, seed ^ 0x3c66);
          color = 0.42 + 0.26 * medallion + 0.1 * swirl + 0.08 * grain;
          height = 0.44 + 0.22 * medallion + 0.08 * swirl + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * medallion;
          occlusion = 1 - 0.34 * (1 - medallion);
          return;
        };
      case 'patentleather':
        return () => {
          // Mirror lacquer carries a fine orange-peel ripple.
          const peel = smooth(
            clamp((noise(u, v, 32, 32, seed ^ 0x4d77) - 0.42) / 0.16),
          );
          const sheen = noise(u, v, 6, 6, seed ^ 0x5e88);
          color = 0.44 + 0.18 * peel + 0.16 * sheen;
          height = 0.46 + 0.16 * peel + 0.02 * sheen;
          roughness += 0.08 * (peel - 0.5);
          occlusion = 1 - 0.18 * (1 - peel);
          return;
        };
      case 'appleskin':
        return () => {
          // Blush streaks band the taut skin, freckled with lenticel dots.
          const stripe =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(v * 5) - 0.5));
          const dot = smooth(
            clamp((noise(u, v, 28, 28, seed ^ 0x6f99) - 0.8) / 0.05),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x7aaa);
          color = 0.44 + 0.32 * stripe + 0.1 * dot + 0.06 * grain;
          height = 0.46 + 0.2 * stripe + 0.05 * dot + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * stripe;
          occlusion = 1 - 0.3 * (1 - stripe) - 0.1 * (1 - dot);
          return;
        };
      case 'peachskin':
        return () => {
          // Fine fuzz covers the blush beside the recessed suture groove.
          const suture = smooth(clamp((0.045 - Math.abs(u - 0.5)) / 0.025));
          const fuzz = noise(u, v, 32, 32, seed ^ 0x8bbb);
          const blush = noise(u, v, 6, 6, seed ^ 0x9ccc);
          color = 0.46 + 0.3 * blush - 0.12 * suture + 0.08 * fuzz;
          height = 0.46 + 0.06 * fuzz - 0.16 * suture;
          roughness += 0.08 * (fuzz - 0.5) + 0.1 * suture;
          occlusion = 1 - 0.4 * suture;
          return;
        };
      case 'grapeskin':
        return () => {
          // Taut bloom patches dust the smooth stretched skin.
          const bloom = smooth(
            clamp((noise(u, v, 6, 6, seed ^ 0xaddd) - 0.5) / 0.16),
          );
          const pore = noise(u, v, 32, 32, seed ^ 0xbeee);
          color = 0.46 + 0.28 * bloom + 0.08 * pore;
          height = 0.46 + 0.18 * bloom + 0.02 * pore;
          roughness += 0.12 * (bloom - 0.5) * 2 + 0.06 * (pore - 0.5);
          occlusion = 1 - 0.3 * (1 - bloom);
          return;
        };
      case 'broccoli':
        return () => {
          // Dense floret buds cluster above the shaded gaps of the head.
          const floret = smooth(
            clamp((noise(u, v, 10, 10, seed ^ 0xcf11) - 0.45) / 0.14),
          );
          const bud = smooth(
            clamp((noise(u, v, 28, 28, seed ^ 0xd022) - 0.58) / 0.1),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0xe133);
          color = 0.42 + 0.3 * floret + 0.12 * bud + 0.06 * grain;
          height = 0.44 + 0.24 * floret + 0.08 * bud + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * floret;
          occlusion = 1 - 0.36 * (1 - floret) - 0.1 * (1 - bud);
          return;
        };
      case 'cabbage':
        return () => {
          // Leafy folds ripple beside the recessed veins between them.
          const turn = fract((u + v) * 3);
          const fold = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const vein =
            smooth(
              clamp((0.045 - Math.min(fract(u * 3), 1 - fract(u * 3))) / 0.025),
            ) +
            smooth(
              clamp((0.045 - Math.min(fract(v * 3), 1 - fract(v * 3))) / 0.025),
            );
          const grain = noise(u, v, 24, 24, seed ^ 0xf244);
          color = 0.44 + 0.3 * fold - 0.12 * Math.min(vein, 1) + 0.08 * grain;
          height = 0.44 + 0.26 * fold - 0.1 * Math.min(vein, 1) + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * fold;
          occlusion = 1 - 0.34 * (1 - fold) - 0.12 * Math.min(vein, 1);
          return;
        };
      case 'onion':
        return () => {
          // Concentric layer bands arc over the dry papery skin fibers.
          const turn = fract((u + v) * 6);
          const layer = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const fiber = smooth(
            clamp((0.035 - Math.abs(fract((u - v) * 8) - 0.5)) / 0.02),
          );
          const grain = noise(u, v, 24, 24, seed ^ 0x1355);
          color = 0.44 + 0.3 * layer + 0.1 * fiber + 0.06 * grain;
          height = 0.44 + 0.24 * layer + 0.05 * fiber + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * layer;
          occlusion = 1 - 0.32 * (1 - layer);
          return;
        };
      case 'bedsheet':
        return () => {
          // Soft pressed wrinkles drift across the woven sheet.
          const warp = noise(u, v, 4, 4, seed ^ 0x2466) - 0.5;
          const wrinkle = smooth(
            clamp((0.3 - Math.abs(fract((v + 0.16 * warp) * 4) - 0.5)) / 0.16),
          );
          const weave = noise(u, v, 32, 32, seed ^ 0x3577);
          color = 0.5 + 0.3 * wrinkle + 0.08 * weave;
          height = 0.46 + 0.22 * wrinkle + 0.02 * weave;
          roughness += 0.06 * (weave - 0.5) - 0.1 * wrinkle;
          occlusion = 1 - 0.3 * (1 - wrinkle);
          return;
        };
      case 'pillow':
        return () => {
          // Lofty quilted puffs dome between the recessed piped seams.
          const px = fract(u * 2) - 0.5,
            py = fract(v * 2) - 0.5;
          const puff = smooth(clamp((0.36 - Math.hypot(px, py)) / 0.16));
          const seam =
            smooth(
              clamp((0.045 - Math.min(fract(u * 2), 1 - fract(u * 2))) / 0.025),
            ) +
            smooth(
              clamp((0.045 - Math.min(fract(v * 2), 1 - fract(v * 2))) / 0.025),
            );
          const weave = noise(u, v, 32, 32, seed ^ 0x5799);
          color = 0.5 + 0.3 * puff - 0.1 * Math.min(seam, 1) + 0.06 * weave;
          height = 0.44 + 0.24 * puff - 0.12 * Math.min(seam, 1) + 0.02 * weave;
          roughness += 0.06 * (weave - 0.5) - 0.08 * puff;
          occlusion = 1 - 0.34 * (1 - puff) - 0.12 * Math.min(seam, 1);
          return;
        };
      case 'mattress':
        return () => {
          // Button tufts pull dimples into the coarse woven surface.
          const tx = fract(u * 4) - 0.5,
            ty = fract(v * 4) - 0.5;
          const r = Math.hypot(tx, ty);
          const tuft = smooth(clamp((0.18 - r) / 0.08));
          const weave = noise(u, v, 24, 24, seed ^ 0x68aa);
          color = 0.46 + 0.3 * (1 - tuft) * 0.4 + 0.1 * weave;
          height = 0.46 + 0.12 * weave - 0.2 * tuft;
          roughness += 0.06 * (weave - 0.5);
          occlusion = 1 - 0.42 * tuft;
          return;
        };
      case 'tealeaf':
        return () => {
          // Curled leaf pieces pile over the shaded gaps of the heap.
          const leaf = smooth(
            clamp((noise(u, v, 6, 6, seed ^ 0x79bb) - 0.48) / 0.14),
          );
          const curl = smooth(
            clamp((noise(u, v, 14, 14, seed ^ 0x8acc) - 0.62) / 0.1),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x9bdd);
          color = 0.42 + 0.3 * leaf + 0.12 * curl + 0.06 * grain;
          height = 0.44 + 0.22 * leaf + 0.08 * curl + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * leaf;
          occlusion = 1 - 0.36 * (1 - leaf) - 0.1 * (1 - curl);
          return;
        };
      case 'matcha':
        return () => {
          // Whisk streaks comb across the fine powder bed.
          const turn = fract((u + v) * 5);
          const streak = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const powder = noise(u, v, 32, 32, seed ^ 0xaeee);
          color = 0.46 + 0.3 * streak + 0.08 * powder;
          height = 0.46 + 0.2 * streak + 0.02 * powder;
          roughness += 0.06 * (powder - 0.5) - 0.08 * streak;
          occlusion = 1 - 0.3 * (1 - streak);
          return;
        };
      case 'teabag':
        return () => {
          // Filter-paper mesh threads cross over the open pores and tea shadows.
          const warp = smooth(
            clamp((0.12 - Math.abs(fract(u * 24) - 0.5)) / 0.06),
          );
          const weft = smooth(
            clamp((0.12 - Math.abs(fract(v * 24) - 0.5)) / 0.06),
          );
          const thread = warp + weft - warp * weft;
          const shadow = noise(u, v, 6, 6, seed ^ 0xbfff);
          const grain = noise(u, v, 32, 32, seed ^ 0xc111);
          color = 0.46 + 0.28 * thread + 0.1 * shadow + 0.06 * grain;
          height = 0.46 + 0.2 * thread + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * thread;
          occlusion = 1 - 0.34 * (1 - thread);
          return;
        };
      case 'sanddune':
        return () => {
          // Wind ripples comb fine grain across the dune face.
          const turn = fract((u + v) * 6);
          const ripple = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const grain = noise(u, v, 32, 32, seed ^ 0xd222);
          color = 0.46 + 0.3 * ripple + 0.08 * grain;
          height = 0.46 + 0.2 * ripple + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * ripple;
          occlusion = 1 - 0.3 * (1 - ripple);
          return;
        };
      case 'pebblebeach':
        return () => {
          // Round pebbles dome over the coarse sand between them.
          const px = fract(u * 5) - 0.5,
            py = fract(v * 5) - 0.5;
          const pebble = smooth(clamp((0.34 - Math.hypot(px, py)) / 0.14));
          const grain = noise(u, v, 32, 32, seed ^ 0xe333);
          color = 0.44 + 0.32 * pebble + 0.08 * grain;
          height = 0.44 + 0.26 * pebble + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * pebble;
          occlusion = 1 - 0.34 * (1 - pebble);
          return;
        };
      case 'foamedge':
        return () => {
          // Foam clumps and bubble specks wash over the thin water film.
          const clump = smooth(
            clamp((noise(u, v, 8, 8, seed ^ 0xf444) - 0.46) / 0.16),
          );
          const bubble = smooth(
            clamp((noise(u, v, 24, 24, seed ^ 0x1555) - 0.7) / 0.08),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x2666);
          color = 0.48 + 0.3 * clump + 0.12 * bubble + 0.06 * grain;
          height = 0.44 + 0.22 * clump + 0.06 * bubble + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * clump;
          occlusion = 1 - 0.34 * (1 - clump) - 0.1 * (1 - bubble);
          return;
        };
      case 'lavaflow':
        return () => {
          // Pahoehoe ropes coil above the dark cracks between them.
          const turn = fract((u + v) * 5);
          const rope = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const crack = smooth(clamp((0.08 - Math.min(turn, 1 - turn)) / 0.04));
          const glow = noise(u, v, 12, 12, seed ^ 0x3777);
          const grain = noise(u, v, 32, 32, seed ^ 0x4888);
          color =
            0.34 + 0.34 * rope - 0.12 * crack + 0.16 * glow + 0.06 * grain;
          height = 0.44 + 0.26 * rope - 0.1 * crack + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * rope + 0.12 * crack;
          occlusion = 1 - 0.32 * (1 - rope) - 0.18 * crack;
          return;
        };
      case 'cooledlava':
        return () => {
          // Crusted blocks crack apart over the pitted cooled surface.
          const bx = Math.min(fract(u * 4), 1 - fract(u * 4));
          const by = Math.min(fract(v * 4), 1 - fract(v * 4));
          const block = smooth(clamp((Math.min(bx, by) - 0.03) / 0.1));
          const pore = smooth(
            clamp((noise(u, v, 20, 20, seed ^ 0x5999) - 0.74) / 0.06),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x6aaa);
          color = 0.4 + 0.3 * block - 0.1 * pore + 0.08 * grain;
          height = 0.42 + 0.24 * block - 0.08 * pore + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) + 0.1 * pore;
          occlusion = 1 - 0.34 * (1 - block) - 0.18 * pore;
          return;
        };
      case 'ashfield':
        return () => {
          // Fine ash drifts mound over the dusted ground.
          const drift = smooth(
            clamp((noise(u, v, 8, 8, seed ^ 0x7bbb) - 0.44) / 0.18),
          );
          const grit = noise(u, v, 32, 32, seed ^ 0x8ccc);
          color = 0.44 + 0.28 * drift + 0.08 * grit;
          height = 0.44 + 0.22 * drift + 0.02 * grit;
          roughness += 0.06 * (grit - 0.5);
          occlusion = 1 - 0.32 * (1 - drift);
          return;
        };
      case 'stalactite':
        return () => {
          // Dripping cone tips hang over the shadowed pockets between them.
          const cx = fract(u * 4) - 0.5,
            cy = fract(v * 4) - 0.5;
          const cone = smooth(clamp((0.32 - Math.hypot(cx, cy)) / 0.16));
          const drip = smooth(
            clamp((noise(u, v, 20, 20, seed ^ 0x9ddd) - 0.7) / 0.08),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0xaeee);
          color = 0.44 + 0.3 * cone + 0.1 * drip + 0.06 * grain;
          height = 0.44 + 0.26 * cone + 0.05 * drip + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * cone;
          occlusion = 1 - 0.36 * (1 - cone) - 0.1 * (1 - drip);
          return;
        };
      case 'flowstone':
        return () => {
          // Terraced flow bands step over the fine drip ripples.
          const turn = fract((u + v) * 5);
          const terrace = smooth(clamp((0.34 - Math.abs(turn - 0.5)) / 0.12));
          const ripple = noise(u, v, 24, 24, seed ^ 0xbfff);
          const grain = noise(u, v, 32, 32, seed ^ 0xc111);
          color = 0.46 + 0.3 * terrace + 0.08 * ripple + 0.06 * grain;
          height = 0.44 + 0.26 * terrace + 0.04 * ripple + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * terrace;
          occlusion = 1 - 0.32 * (1 - terrace);
          return;
        };
      case 'cavefloor':
        return () => {
          // Rubble and grit break around the smooth shallow puddles.
          const rubble = smooth(
            clamp((noise(u, v, 8, 8, seed ^ 0xd222) - 0.46) / 0.16),
          );
          const puddle = smooth(
            clamp((noise(u, v, 5, 5, seed ^ 0xe333) - 0.72) / 0.06),
          );
          const grit = noise(u, v, 32, 32, seed ^ 0xf444);
          color = 0.42 + 0.28 * rubble + 0.12 * puddle + 0.08 * grit;
          height = 0.44 + 0.2 * rubble - 0.1 * puddle + 0.02 * grit;
          roughness += 0.06 * (grit - 0.5) + 0.2 * puddle;
          occlusion = 1 - 0.34 * (1 - rubble) - 0.1 * puddle;
          return;
        };
      case 'jam':
        return () => {
          // Glossy fruit chunks sit in the clear set syrup.
          const jx = fract(u * 5) - 0.5,
            jy = fract(v * 5) - 0.5;
          const chunk = smooth(clamp((0.3 - Math.hypot(jx, jy)) / 0.14));
          const syrup = noise(u, v, 16, 16, seed ^ 0x1555);
          const grain = noise(u, v, 32, 32, seed ^ 0x2666);
          color = 0.42 + 0.32 * chunk + 0.12 * syrup + 0.06 * grain;
          height = 0.44 + 0.22 * chunk + 0.02 * grain;
          roughness += 0.1 * (grain - 0.5) - 0.12 * chunk;
          occlusion = 1 - 0.32 * (1 - chunk);
          return;
        };
      case 'peanutbutter':
        return () => {
          // Chopped nut pieces break the smooth swirled paste.
          const nut = smooth(
            clamp((noise(u, v, 10, 10, seed ^ 0x3777) - 0.6) / 0.1),
          );
          const swirl = noise(u, v, 6, 6, seed ^ 0x4888);
          const grain = noise(u, v, 32, 32, seed ^ 0x5999);
          color = 0.46 + 0.28 * nut + 0.1 * swirl + 0.06 * grain;
          height = 0.44 + 0.18 * nut + 0.04 * swirl + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * nut;
          occlusion = 1 - 0.3 * (1 - nut);
          return;
        };
      case 'sprinkles':
        return () => {
          // Sugar rods scatter over the frosted base.
          const sx = Math.sin(Math.PI * (fract(u * 6) - 0.5)),
            sy = Math.sin(Math.PI * (fract(v * 6) - 0.5));
          const t = clamp((0.32 - Math.hypot(sx * 0.5, sy * 2)) / 0.32);
          const rod = 0.5 - 0.5 * Math.cos(Math.PI * t);
          const grain = noise(u, v, 32, 32, seed ^ 0x6aaa);
          color = 0.52 + 0.28 * rod + 0.08 * grain;
          height = 0.44 + 0.22 * rod + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.12 * rod;
          occlusion = 1 - 0.32 * (1 - rod);
          return;
        };
      case 'icecream':
        return () => {
          // Piped cream ridges roll between the melting drip specks.
          const turn = fract((u + v) * 5);
          const ridge = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const drip = smooth(
            clamp((noise(u, v, 16, 16, seed ^ 0x7bbb) - 0.72) / 0.08),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x8ccc);
          color = 0.52 + 0.28 * ridge + 0.1 * drip + 0.06 * grain;
          height = 0.44 + 0.24 * ridge + 0.05 * drip + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * ridge;
          occlusion = 1 - 0.3 * (1 - ridge) - 0.1 * (1 - drip);
          return;
        };
      case 'popsicle':
        return () => {
          // Frozen drip ridges run down the frosted ice pop.
          const ridge =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(v * 8) - 0.5));
          const frost = noise(u, v, 24, 24, seed ^ 0x9ddd);
          const grain = noise(u, v, 32, 32, seed ^ 0xaeee);
          color = 0.46 + 0.3 * ridge + 0.1 * frost + 0.06 * grain;
          height = 0.44 + 0.22 * ridge + 0.04 * frost + 0.02 * grain;
          roughness += 0.08 * (grain - 0.5) - 0.1 * ridge;
          occlusion = 1 - 0.32 * (1 - ridge);
          return;
        };
      case 'sorbet':
        return () => {
          // Scoop scrapes ridge over the fruit-flecked surface.
          const turn = fract((u - v) * 6);
          const scrape = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const fruit = smooth(
            clamp((noise(u, v, 12, 12, seed ^ 0xbfff) - 0.68) / 0.1),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0xc111);
          color = 0.46 + 0.28 * scrape + 0.12 * fruit + 0.06 * grain;
          height = 0.44 + 0.2 * scrape + 0.06 * fruit + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * scrape;
          occlusion = 1 - 0.3 * (1 - scrape) - 0.1 * (1 - fruit);
          return;
        };
      case 'spaghetti':
        return () => {
          // Winding noodle strands coil over the sauce beneath.
          const warp = noise(u, v, 4, 4, seed ^ 0xd222) - 0.5;
          const strand = smooth(
            clamp((0.32 - Math.abs(fract((v + 0.12 * warp) * 6) - 0.5)) / 0.16),
          );
          const sauce = noise(u, v, 8, 8, seed ^ 0xe333);
          const grain = noise(u, v, 32, 32, seed ^ 0xf444);
          color = 0.5 + 0.3 * strand + 0.1 * sauce + 0.06 * grain;
          height = 0.46 + 0.22 * strand + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * strand;
          occlusion = 1 - 0.32 * (1 - strand);
          return;
        };
      case 'macaroni':
        return () => {
          // Short bent tube shells pile over the gaps between them.
          const tx = Math.min(fract(u * 4), 1 - fract(u * 4)),
            ty = Math.min(fract(v * 4), 1 - fract(v * 4));
          const tube = smooth(clamp((Math.min(tx, ty) - 0.03) / 0.12));
          const hr = Math.hypot(fract(u * 4) - 0.5, fract(v * 4) - 0.5);
          const bore = smooth(clamp((0.12 - hr) / 0.06));
          const grain = noise(u, v, 32, 32, seed ^ 0x1555);
          color = 0.5 + 0.3 * tube - 0.12 * bore + 0.06 * grain;
          height = 0.46 + 0.2 * tube - 0.14 * bore + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * tube;
          occlusion = 1 - 0.34 * (1 - tube) - 0.2 * bore;
          return;
        };
      case 'lasagna':
        return () => {
          // Layered pasta sheets stack over the sauce seams between them.
          const layer =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(v * 4) - 0.5));
          const cheese = smooth(
            clamp((noise(u, v, 14, 14, seed ^ 0x2666) - 0.68) / 0.1),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x3777);
          color = 0.44 + 0.32 * layer + 0.1 * cheese + 0.06 * grain;
          height = 0.44 + 0.24 * layer + 0.05 * cheese + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * layer;
          occlusion = 1 - 0.32 * (1 - layer);
          return;
        };
      case 'origami':
        return () => {
          // Folded facets rise between the pressed crease lines.
          const fa = Math.abs(fract((u + v) * 2) - 0.5),
            fb = Math.abs(fract((u - v) * 2) - 0.5);
          const fold =
            smooth(clamp((0.34 - fa) / 0.16)) +
            smooth(clamp((0.34 - fb) / 0.16)) -
            smooth(clamp((0.34 - fa) / 0.16)) *
              smooth(clamp((0.34 - fb) / 0.16));
          const crease =
            smooth(
              clamp(
                (0.05 - Math.min(fract((u + v) * 2), 1 - fract((u + v) * 2))) /
                  0.025,
              ),
            ) +
            smooth(
              clamp(
                (0.05 - Math.min(fract((u - v) * 2), 1 - fract((u - v) * 2))) /
                  0.025,
              ),
            );
          const grain = noise(u, v, 32, 32, seed ^ 0x4888);
          color = 0.46 + 0.3 * fold - 0.1 * Math.min(crease, 1) + 0.06 * grain;
          height =
            0.44 + 0.24 * fold - 0.1 * Math.min(crease, 1) + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * fold;
          occlusion = 1 - 0.3 * (1 - fold) - 0.12 * Math.min(crease, 1);
          return;
        };
      case 'paperlace':
        return () => {
          // Die-cut lace holes sink through the pressed paper webbing.
          const sx = Math.sin(Math.PI * (fract(u * 6) - 0.5)),
            sy = Math.sin(Math.PI * (fract(v * 6) - 0.5));
          const hole = smooth(clamp((0.16 - Math.hypot(sx, sy)) / 0.07));
          const grain = noise(u, v, 32, 32, seed ^ 0x5999);
          color = 0.52 + 0.28 * (1 - hole) + 0.06 * grain;
          height = 0.46 + 0.2 * (1 - hole) + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) + 0.1 * hole;
          occlusion = 1 - 0.36 * hole;
          return;
        };
      case 'papercut':
        return () => {
          // Layered cutout shapes rise over the flat backing sheet.
          const sx = Math.sin(Math.PI * (fract(u * 5) - 0.5)),
            sy = Math.sin(Math.PI * (fract(v * 5) - 0.5));
          const shape = smooth(clamp((0.5 - Math.hypot(sx * 0.7, sy)) / 0.2));
          const grain = noise(u, v, 32, 32, seed ^ 0x6aaa);
          color = 0.42 + 0.34 * shape + 0.08 * grain;
          height = 0.44 + 0.24 * shape + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * shape;
          occlusion = 1 - 0.32 * (1 - shape);
          return;
        };
      case 'sunflower':
        return () => {
          // Seed heads pack in a domed grid across the disk.
          const sx = Math.sin(Math.PI * (fract(u * 10) - 0.5)),
            sy = Math.sin(Math.PI * (fract(v * 10) - 0.5));
          const st = clamp((0.6 - Math.hypot(sx * 0.9, sy * 1.4)) / 0.6);
          const head = 0.5 - 0.5 * Math.cos(Math.PI * st);
          const grain = noise(u, v, 32, 32, seed ^ 0x7bbb);
          color = 0.44 + 0.3 * head + 0.08 * grain;
          height = 0.44 + 0.24 * head + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * head;
          occlusion = 1 - 0.32 * (1 - head);
          return;
        };
      case 'daisy':
        return () => {
          // Radial petals fan around the recessed seed center.
          const sx = Math.sin(Math.PI * (u - 0.5)),
            sy = Math.sin(Math.PI * (v - 0.5));
          const r = Math.hypot(sx, sy);
          const ang = Math.atan2(sy, sx);
          const petal =
            (0.5 + 0.5 * Math.cos(ang * 12)) *
            smooth(clamp((r - 0.16) / 0.1)) *
            smooth(clamp((0.6 - r) / 0.1));
          const center = smooth(clamp((0.16 - r) / 0.06));
          const grain = noise(u, v, 32, 32, seed ^ 0x8ccc);
          color = 0.46 + 0.32 * petal - 0.12 * center + 0.06 * grain;
          height = 0.44 + 0.22 * petal - 0.1 * center + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * petal;
          occlusion = 1 - 0.3 * (1 - petal) - 0.14 * center;
          return;
        };
      case 'clover':
        return () => {
          // Three heart lobes spread from the stem join with fine veins.
          const sx = Math.sin(Math.PI * (u - 0.5)),
            sy = Math.sin(Math.PI * (v - 0.5));
          const r = Math.hypot(sx, sy);
          const ang = Math.atan2(sy, sx);
          const lobe =
            (0.5 + 0.5 * Math.cos(ang * 3)) * smooth(clamp((0.5 - r) / 0.14));
          const vein = noise(u, v, 12, 12, seed ^ 0x9ddd);
          const grain = noise(u, v, 32, 32, seed ^ 0xaeee);
          color = 0.4 + 0.34 * lobe + 0.08 * vein + 0.06 * grain;
          height = 0.42 + 0.24 * lobe + 0.03 * vein + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * lobe;
          occlusion = 1 - 0.34 * (1 - lobe);
          return;
        };
      case 'puzzletile':
        return () => {
          // Jigsaw pieces rise over their seams, bridged by rounded knobs.
          const bx = Math.min(fract(u * 2), 1 - fract(u * 2)),
            by = Math.min(fract(v * 2), 1 - fract(v * 2));
          const piece = smooth(clamp((Math.min(bx, by) - 0.02) / 0.05));
          const knobH = smooth(
            clamp((0.13 - Math.hypot(bx, fract(v * 2) - 0.5)) / 0.05),
          );
          const knobV = smooth(
            clamp((0.13 - Math.hypot(by, fract(u * 2) - 0.5)) / 0.05),
          );
          const top = 1 - (1 - piece) * (1 - knobH) * (1 - knobV);
          const grain = noise(u, v, 32, 32, seed ^ 0xbbcc);
          color = 0.44 + 0.3 * top + 0.08 * grain;
          height = 0.44 + 0.24 * top + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * top;
          occlusion = 1 - 0.34 * (1 - top);
          return;
        };
      case 'legobrick':
        return () => {
          // Cylindrical studs dome over the smooth brick plate.
          const sx = Math.sin(Math.PI * (fract(u * 4) - 0.5)),
            sy = Math.sin(Math.PI * (fract(v * 4) - 0.5));
          const st = clamp((0.55 - Math.hypot(sx * 0.8, sy * 0.8)) / 0.55);
          const stud = 0.5 - 0.5 * Math.cos(Math.PI * st);
          const grain = noise(u, v, 32, 32, seed ^ 0xcddc);
          color = 0.46 + 0.3 * stud + 0.06 * grain;
          height = 0.44 + 0.24 * stud + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * stud;
          occlusion = 1 - 0.3 * (1 - stud);
          return;
        };
      case 'rubberband':
        return () => {
          // Crossed elastic bands stretch over the base wrap.
          const bandU =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(v * 3) - 0.5));
          const bandV =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(u * 3) - 0.5));
          const band = bandU + bandV - bandU * bandV;
          const stretch = noise(u, v, 32, 32, seed ^ 0xddee);
          color = 0.42 + 0.3 * band + 0.08 * stretch;
          height = 0.44 + 0.2 * band + 0.02 * stretch;
          roughness += 0.06 * (stretch - 0.5) - 0.1 * band;
          occlusion = 1 - 0.32 * (1 - band);
          return;
        };
      case 'haybale':
        return () => {
          // Combed straw streaks run beside the compressed bind bands.
          const warp = noise(u, v, 3, 3, seed ^ 0xe444) - 0.5;
          const straw =
            0.5 +
            0.5 *
              Math.cos(
                Math.PI * 2 * (fract((u + v + 0.008 * warp) * 10) - 0.5),
              );
          const bind = smooth(
            clamp((0.08 - Math.min(fract(u * 3), 1 - fract(u * 3))) / 0.04),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0xf555);
          color = 0.46 + 0.3 * straw - 0.1 * bind + 0.08 * grain;
          height = 0.44 + 0.22 * straw - 0.1 * bind + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * straw + 0.08 * bind;
          occlusion = 1 - 0.32 * (1 - straw) - 0.14 * bind;
          return;
        };
      case 'corncrib':
        return () => {
          // Slatted crib rails cross over the dark open gaps.
          const slatH =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(v * 4) - 0.5));
          const slatV =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(u * 3) - 0.5));
          const slat = slatH + slatV - slatH * slatV;
          const grain = noise(u, v, 32, 32, seed ^ 0x1666);
          color = 0.4 + 0.32 * slat + 0.08 * grain;
          height = 0.42 + 0.24 * slat + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * slat;
          occlusion = 1 - 0.34 * (1 - slat);
          return;
        };
      case 'fencepost':
        return () => {
          // Weathered vertical grain ridges split by dark checks.
          const turn = fract(u * 6);
          const grainridge = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (turn - 0.5));
          const check = smooth(
            clamp((0.03 - Math.min(turn, 1 - turn)) / 0.015),
          );
          const knot = smooth(
            clamp((noise(u, v, 10, 10, seed ^ 0x2777) - 0.72) / 0.08),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x3888);
          color =
            0.44 + 0.3 * grainridge - 0.12 * check + 0.08 * knot + 0.06 * grain;
          height = 0.44 + 0.22 * grainridge - 0.1 * check + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.08 * grainridge + 0.1 * check;
          occlusion = 1 - 0.32 * (1 - grainridge) - 0.16 * check;
          return;
        };
      case 'poolfelt':
        return () => {
          // Dense felt nap holds the crisp white marking dots.
          const fx = Math.sin(Math.PI * (fract(u * 8) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 8) - 0.5));
          const dot = smooth(clamp((0.18 - Math.hypot(fx, fy)) / 0.08));
          const felt = noise(u, v, 32, 32, seed ^ 0x4999);
          color = 0.36 + 0.34 * dot + 0.1 * felt;
          height = 0.46 + 0.16 * dot + 0.02 * felt;
          roughness += 0.06 * (felt - 0.5) - 0.06 * dot;
          occlusion = 1 - 0.28 * (1 - dot);
          return;
        };
      case 'icesurface':
        return () => {
          // Zamboni sweep arcs gloss over the scratched ice with frost flecks.
          const warp = noise(u, v, 3, 3, seed ^ 0x5aaa) - 0.5;
          const sweep =
            0.5 +
            0.5 *
              Math.cos(Math.PI * 2 * (fract((u + v + 0.008 * warp) * 7) - 0.5));
          const frost = smooth(
            clamp((noise(u, v, 20, 20, seed ^ 0x6bbb) - 0.72) / 0.08),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x7ccc);
          color = 0.52 + 0.28 * sweep + 0.1 * frost + 0.08 * grain;
          height = 0.46 + 0.18 * sweep + 0.04 * frost + 0.02 * grain;
          roughness += 0.08 * (grain - 0.5) + 0.2 * frost;
          occlusion = 1 - 0.3 * (1 - sweep) - 0.1 * (1 - frost);
          return;
        };
      case 'climbingwall':
        return () => {
          // Rounded climbing holds rise over the gritty wall panels.
          const cx = Math.sin(Math.PI * (fract(u * 3) - 0.5)),
            cy = Math.sin(Math.PI * (fract(v * 3) - 0.5));
          const ht = clamp((0.5 - Math.hypot(cx * 0.8, cy)) / 0.5);
          const hold = 0.5 - 0.5 * Math.cos(Math.PI * ht);
          const grit = noise(u, v, 32, 32, seed ^ 0x8ddd);
          color = 0.4 + 0.34 * hold + 0.08 * grit;
          height = 0.42 + 0.28 * hold + 0.02 * grit;
          roughness += 0.06 * (grit - 0.5) - 0.08 * hold;
          occlusion = 1 - 0.36 * (1 - hold);
          return;
        };
      case 'oledpanel':
        return () => {
          // Subpixel stripes glow inside each cell; the dark matrix masks between them.
          const gx = fract(u * 6),
            gy = fract(v * 6);
          const rawx = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (gx - 0.5)),
            rawy = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (gy - 0.5));
          const bx = smooth(clamp((rawx - 0.74) / 0.26)),
            by = smooth(clamp((rawy - 0.74) / 0.26));
          const cellMask = bx + by - bx * by;
          const sx = fract(gx * 3);
          const raws = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (sx - 0.5));
          const sm = smooth(clamp((raws - 0.8) / 0.2));
          const mask = cellMask + sm - cellMask * sm;
          const glow =
            0.55 +
            0.45 * hash(Math.floor(gx * 3), Math.floor(v * 6), seed ^ 0x1a2b);
          color = 0.16 + 0.84 * glow * (1 - mask);
          height = 0.28 + 0.44 * (1 - mask);
          roughness += 0.1 * mask - 0.04 * (1 - mask);
          occlusion = 1 - 0.34 * mask;
          return;
        };
      case 'crtscanline':
        return () => {
          // Bright phosphor scanlines sit above the dark line gaps with fine grain.
          const scan =
            0.5 + 0.5 * Math.cos(Math.PI * 2 * (fract(v * 10) - 0.5));
          const phosphor = noise(u, v, 32, 32, seed ^ 0x2b3c),
            grain = noise(u, v, 64, 64, seed ^ 0x3c4d);
          color = 0.1 + 0.72 * scan + 0.12 * phosphor + 0.06 * grain;
          height = 0.24 + 0.5 * scan + 0.04 * phosphor;
          roughness += 0.08 * (1 - scan) + 0.06 * (grain - 0.5);
          occlusion = 1 - 0.36 * (1 - scan);
          return;
        };
      case 'keyboardkey':
        return () => {
          // Sculpted rounded-square keycaps rise over the recessed gaps.
          const fx = Math.sin(Math.PI * (fract(u * 6) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 6) - 0.5));
          const d = Math.pow(
            Math.pow(Math.abs(fx), 4) + Math.pow(Math.abs(fy), 4),
            0.25,
          );
          const cap = smooth(clamp((0.86 - d) / 0.5));
          const grain = noise(u, v, 32, 32, seed ^ 0x4d5e);
          color = 0.34 + 0.4 * cap + 0.08 * grain;
          height = 0.26 + 0.46 * cap + 0.04 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.06 * cap;
          occlusion = 1 - 0.34 * (1 - cap);
          return;
        };
      case 'filmstrip':
        return () => {
          // Perforation holes punch the film between the horizontal divider grooves.
          const fx = Math.sin(Math.PI * (fract(u * 4) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 2) - 0.5));
          const d = Math.hypot(fx, fy);
          const hole = smooth(clamp((0.3 - d) / 0.28));
          const groove = (1 + Math.cos(Math.PI * 2 * fract(v * 2))) / 2;
          const grain = noise(u, v, 16, 32, seed ^ 0x5e6f);
          color = (0.45 + 0.2 * grain) * (1 - 0.8 * hole) * (1 - 0.25 * groove);
          height = 0.62 - 0.4 * hole - 0.2 * groove + 0.02 * grain;
          roughness += 0.05 * grain + 0.12 * hole;
          occlusion = 1 - 0.45 * hole - 0.18 * groove;
          return;
        };
      case 'postagestamp':
        return () => {
          // Border perforations frame the raised medallion on stamp paper.
          const ax = Math.sin(Math.PI * (fract(u * 8 + 0.5) - 0.5)),
            av = Math.sin(Math.PI * v),
            ay = Math.sin(Math.PI * (fract(v * 8 + 0.5) - 0.5)),
            au = Math.sin(Math.PI * u);
          const dTop = Math.hypot(ax, av),
            dSide = Math.hypot(ay, au);
          const hT = smooth(clamp((0.3 - dTop) / 0.28)),
            hS = smooth(clamp((0.3 - dSide) / 0.28));
          const hole = hT + hS - hT * hS;
          const med = smooth(
            clamp((0.4 - Math.hypot(u - 0.5, v - 0.5)) / 0.12),
          );
          const grain = noise(u, v, 32, 32, seed ^ 0x6f7a);
          color = (0.5 + 0.28 * med + 0.1 * grain) * (1 - 0.72 * hole);
          height = 0.5 + 0.13 * med - 0.42 * hole + 0.03 * grain;
          roughness += 0.08 * (grain - 0.5) + 0.1 * hole;
          occlusion = 1 - 0.5 * hole;
          return;
        };
      case 'halftoneprint':
        return () => {
          // Tone-varying ink dots tile the paper on a rotated lattice.
          const u1 = (u + v) * 6,
            v1 = (u - v) * 6;
          const fx = Math.sin(Math.PI * (fract(u1) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v1) - 0.5));
          const d = Math.hypot(fx, fy);
          const tone = noise(u, v, 4, 4, seed ^ 0x7a8b),
            grain = noise(u, v, 64, 64, seed ^ 0x8b9c);
          const dot = smooth(clamp((0.28 + 0.42 * tone - d) / 0.22));
          color = 0.28 + 0.55 * dot + 0.08 * grain;
          height = 0.35 + 0.5 * dot + 0.02 * grain;
          roughness += 0.12 * (1 - dot) + 0.05 * (grain - 0.5);
          occlusion = 1 - 0.55 * (1 - dot);
          return;
        };
      case 'radiator':
        return () => {
          // Round heating tubes rise from the recessed seams between them.
          const tube = (1 + Math.cos(Math.PI * 2 * (fract(u * 5) - 0.5))) / 2;
          const grain = noise(u, v, 32, 32, seed ^ 0x9cad);
          color = 0.34 + 0.5 * tube + 0.08 * grain;
          height = 0.32 + 0.6 * tube + 0.02 * grain;
          roughness += 0.08 * (grain - 0.5) - 0.06 * tube;
          occlusion = 1 - 0.5 * (1 - tube);
          return;
        };
      case 'screwhead':
        return () => {
          // Cross-recessed screw heads sit inside their shallow panel dimples.
          const fx = Math.sin(Math.PI * (fract(u * 4) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 4) - 0.5));
          const d = Math.hypot(fx, fy);
          const head = smooth(clamp((0.55 - d) / 0.3));
          const slotX = 1 - smooth(clamp((Math.abs(fx) - 0.08) / 0.12)),
            slotY = 1 - smooth(clamp((Math.abs(fy) - 0.08) / 0.12));
          const cross = slotX + slotY - slotX * slotY;
          const recess = cross * head;
          const grain = noise(u, v, 32, 32, seed ^ 0xadbe);
          color = 0.4 + 0.3 * head - 0.28 * recess + 0.06 * grain;
          height = 0.45 + 0.28 * head - 0.42 * recess;
          roughness += 0.08 * (grain - 0.5) + 0.1 * recess;
          occlusion = 1 - 0.4 * recess - 0.1 * (1 - head) * (1 - recess);
          return;
        };
      case 'chainlink':
        return () => {
          // Diamond wires twist thicker at the nodes where they cross.
          const w1 = Math.sin(Math.PI * (fract(u + v + 0.5) - 0.5)),
            w2 = Math.sin(Math.PI * (fract(u - v + 0.5) - 0.5));
          const b1 = smooth(clamp((0.22 - Math.abs(w1)) / 0.18)),
            b2 = smooth(clamp((0.22 - Math.abs(w2)) / 0.18));
          const wire = b1 + b2 - b1 * b2,
            node = b1 * b2;
          const grain = noise(u, v, 32, 32, seed ^ 0xbecf);
          color = 0.3 + 0.36 * wire + 0.1 * node + 0.08 * grain;
          height = 0.3 + 0.44 * wire + 0.16 * node + 0.02 * grain;
          roughness += 0.08 * (grain - 0.5) - 0.1 * wire;
          occlusion = 1 - 0.55 * (1 - wire) - 0.12 * (1 - node);
          return;
        };
      case 'friedegg':
        return () => {
          // A warped white blob carries the yolk dome at its center.
          const w1 = noise(u, v, 4, 4, seed ^ 0xcfd0) - 0.5,
            w2 = noise(u, v, 4, 4, seed ^ 0xd0e1) - 0.5,
            w3 = noise(u, v, 4, 4, seed ^ 0xe1f2) - 0.5;
          const r = Math.hypot(u - 0.5 + 0.06 * w1, v - 0.5 + 0.06 * w2);
          const yolk = smooth(clamp((0.16 - r) / 0.06));
          const white = smooth(clamp((0.34 - (r + 0.1 * w3)) / 0.1));
          const grain = noise(u, v, 32, 32, seed ^ 0xf203);
          color = 0.4 + 0.34 * yolk + 0.2 * white + 0.05 * grain;
          height = 0.3 + 0.45 * yolk + 0.18 * white + 0.02 * grain;
          roughness += 0.1 * (1 - yolk) - 0.06 * white;
          occlusion = 0.5 + 0.5 * (yolk + white - yolk * white);
          return;
        };
      case 'sushirice':
        return () => {
          // Rice grains dome up from the crevices, with even warp modulation.
          const fx = Math.sin(Math.PI * (fract(u * 6) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 6) - 0.5));
          const w1 = noise(u, v, 6, 6, seed ^ 0x0314) - 0.5,
            w2 = noise(u, v, 6, 6, seed ^ 0x1425) - 0.5;
          const mod =
            1 + 0.16 * (w1 * (2 * fx * fx - 1) + w2 * (2 * fy * fy - 1));
          const d = Math.hypot(fx * 1.2, fy * 0.8) * mod;
          const grain = smooth(clamp((0.34 - d) / 0.22));
          const sheen = noise(u, v, 32, 32, seed ^ 0x2536);
          color = 0.62 + 0.28 * grain + 0.06 * sheen;
          height = 0.34 + 0.5 * grain + 0.03 * sheen;
          roughness += 0.08 * (sheen - 0.5) - 0.08 * grain;
          occlusion = 1 - 0.5 * (1 - grain);
          return;
        };
      case 'chocolatechip':
        return () => {
          // Chocolate discs sink into the soft cookie crumb.
          const fx = Math.sin(Math.PI * (fract(u * 3) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 3) - 0.5));
          const d = Math.hypot(fx, fy);
          const radius =
            0.45 +
            0.1 * hash(Math.floor(u * 3), Math.floor(v * 3), seed ^ 0x3647);
          const chip = smooth(clamp((radius - d) / 0.12));
          const crumb = noise(u, v, 32, 32, seed ^ 0x4758);
          color = 0.62 - 0.3 * chip + 0.08 * crumb;
          height = 0.36 + 0.34 * chip + 0.03 * crumb;
          roughness += 0.06 * (crumb - 0.5) - 0.1 * chip;
          occlusion = 1 - 0.45 * (1 - chip);
          return;
        };
      case 'cargomat':
        return () => {
          // Rubber ribs run into the transverse recessed grooves.
          const rib = (1 + Math.cos(Math.PI * 2 * (fract(u * 4) - 0.5))) / 2;
          const groove = (1 + Math.cos(Math.PI * 2 * fract(v * 2))) / 2;
          const grain = noise(u, v, 32, 32, seed ^ 0x5869);
          color =
            (0.36 + 0.1 * grain) * (1 - 0.28 * groove) * (0.55 + 0.45 * rib);
          height = 0.28 + 0.52 * rib - 0.22 * groove + 0.02 * grain;
          roughness += 0.06 * grain + 0.1 * (1 - rib);
          occlusion = 1 - 0.4 * (1 - rib) - 0.24 * groove;
          return;
        };
      case 'dashboardgrain':
        return () => {
          // Pebbled leather grain with a recessed seam crease.
          const fx = Math.sin(Math.PI * (fract(u * 10) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 10) - 0.5));
          const d = Math.hypot(fx, fy);
          const bs = smooth(clamp((0.5 - d) / 0.34));
          const gn = noise(u, v, 32, 32, seed ^ 0x697a);
          const rawSeam = (1 + Math.cos(Math.PI * 2 * fract(u * 2))) / 2;
          const seam = smooth(clamp((rawSeam - 0.8) / 0.2));
          const pebble = bs * (0.7 + 0.3 * gn);
          color = 0.42 + 0.3 * pebble + 0.06 * gn - 0.12 * seam;
          height = 0.34 + 0.42 * pebble - 0.2 * seam + 0.02 * gn;
          roughness += 0.06 * gn + 0.1 * seam - 0.06 * bs;
          occlusion = 1 - 0.4 * (1 - bs) - 0.2 * seam;
          return;
        };
      case 'licenseplate':
        return () => {
          // A raised border frames the embossed text bars over the inset.
          const rawx = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (u - 0.5)),
            rawy = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (v - 0.5));
          const bx = smooth(clamp((rawx - 0.72) / 0.24)),
            by = smooth(clamp((rawy - 0.72) / 0.24));
          const border = bx + by - bx * by;
          const bar = (1 + Math.cos(Math.PI * 2 * (fract(v * 4) - 0.5))) / 2;
          const grain = noise(u, v, 32, 32, seed ^ 0x7a8b);
          const raised = bar * (1 - border);
          color = 0.44 + 0.2 * border + 0.12 * raised + 0.05 * grain;
          height = 0.3 + 0.4 * border + 0.22 * raised + 0.02 * grain;
          roughness += 0.06 * (grain - 0.5) - 0.1 * border;
          occlusion = 1 - 0.3 * (1 - border) * (1 - bar);
          return;
        };
      case 'flowerbed':
        return () => {
          // Rosettes with four-fold petals dome above the soil.
          const fx = Math.sin(Math.PI * (fract(u * 3) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 3) - 0.5));
          const d = Math.hypot(fx, fy);
          const petal =
            0.72 +
            0.28 *
              (Math.cos(Math.PI * 2 * 3 * (u + v)) *
                Math.cos(Math.PI * 2 * 3 * (u - v)));
          const dome = smooth(clamp((0.5 - d) / 0.3)) * petal;
          const soil = noise(u, v, 32, 32, seed ^ 0x8b9c);
          color = 0.3 + 0.32 * dome + 0.1 * soil;
          height = 0.3 + 0.5 * dome + 0.03 * soil;
          roughness += 0.08 * (soil - 0.5) - 0.1 * dome;
          occlusion = 1 - 0.5 * (1 - dome);
          return;
        };
      case 'grassstripe':
        return () => {
          // Mowed bands gloss over the fine blade texture.
          const stripe = (1 + Math.cos(Math.PI * 2 * (fract(v * 2) - 0.5))) / 2;
          const blade = noise(u, v, 48, 8, seed ^ 0x9cad),
            soil = noise(u, v, 16, 16, seed ^ 0xadbe);
          color = 0.34 + 0.36 * stripe + 0.12 * blade + 0.06 * soil;
          height = 0.3 + 0.42 * stripe + 0.08 * blade + 0.03 * soil;
          roughness += 0.08 * (soil - 0.5) + 0.06 * (1 - stripe);
          occlusion = 1 - 0.42 * (1 - stripe);
          return;
        };
      case 'topiary':
        return () => {
          // Clipped leaf clusters dome above the trimmed gaps.
          const fx = Math.sin(Math.PI * (fract(u * 3) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 3) - 0.5));
          const d = Math.hypot(fx, fy);
          const w1 = noise(u, v, 3, 3, seed ^ 0xbecf) - 0.5,
            w2 = noise(u, v, 3, 3, seed ^ 0xcfd0) - 0.5;
          const mod =
            1 + 0.16 * (w1 * (2 * fx * fx - 1) + w2 * (2 * fy * fy - 1));
          const cluster = smooth(clamp((0.52 - d * mod) / 0.3));
          const leaf = noise(u, v, 32, 32, seed ^ 0xd0e1);
          color = 0.28 + 0.3 * cluster + 0.1 * leaf;
          height = 0.3 + 0.48 * cluster + 0.04 * leaf;
          roughness += 0.08 * (leaf - 0.5) - 0.08 * cluster;
          occlusion = 1 - 0.48 * (1 - cluster);
          return;
        };
      case 'confetti':
        return () => {
          // Scattered chips with per-cell size variation over the paper.
          const fx = Math.sin(Math.PI * (fract(u * 4) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 4) - 0.5));
          const d = Math.pow(
            Math.pow(Math.abs(fx), 4) + Math.pow(Math.abs(fy), 4),
            0.25,
          );
          const radius =
            0.52 +
            0.16 * hash(Math.floor(u * 4), Math.floor(v * 4), seed ^ 0xe1f2);
          const chip = smooth(clamp((radius - d) / 0.12));
          const paper = noise(u, v, 32, 32, seed ^ 0xf203);
          color = 0.4 + 0.3 * chip + 0.1 * paper;
          height = 0.34 + 0.4 * chip + 0.03 * paper;
          roughness += 0.06 * (paper - 0.5) - 0.1 * chip;
          occlusion = 1 - 0.44 * (1 - chip);
          return;
        };
      case 'ribbonstreamer':
        return () => {
          // Wide twisted ribbon bands sweep along the diagonal.
          const band =
            (1 + Math.cos(Math.PI * 2 * (fract((u + v) * 3) - 0.5))) / 2;
          const w2 = noise(u, v, 4, 4, seed ^ 0x1425) - 0.5,
            sheen = noise(u, v, 32, 32, seed ^ 0x2536);
          color = 0.36 + 0.34 * band + 0.12 * sheen + 0.08 * w2;
          height = 0.3 + 0.46 * band + 0.03 * sheen;
          roughness += 0.08 * (sheen - 0.5) - 0.1 * band;
          occlusion = 1 - 0.46 * (1 - band);
          return;
        };
      case 'pinatafringe':
        return () => {
          // Dense fringe strands hang in tiers over the crepe backing.
          const strand =
            (1 + Math.cos(Math.PI * 2 * (fract(u * 14) - 0.5))) / 2;
          const tier = (1 + Math.cos(Math.PI * 2 * fract(v * 3))) / 2;
          const crepe = noise(u, v, 32, 32, seed ^ 0x3647);
          color = 0.34 + 0.3 * strand + 0.12 * crepe - 0.14 * tier;
          height = 0.28 + 0.44 * strand - 0.2 * tier + 0.03 * crepe;
          roughness += 0.06 * (crepe - 0.5) + 0.1 * tier;
          occlusion = 1 - 0.4 * (1 - strand) - 0.2 * tier;
          return;
        };
      case 'xylophone':
        return () => {
          // Tuned wooden bars rise above the open gaps and cord holes.
          const bar = (1 + Math.cos(Math.PI * 2 * (fract(u * 4) - 0.5))) / 2;
          const hole = smooth(
            clamp(
              (0.18 -
                Math.hypot(
                  Math.sin(Math.PI * (fract(u * 4) - 0.5)),
                  Math.sin(Math.PI * (fract(v * 2) - 0.5)),
                )) /
                0.12,
            ),
          );
          const grain = noise(u, v, 32, 8, seed ^ 0x4758);
          color = 0.4 + 0.32 * bar + 0.1 * grain - 0.22 * hole;
          height = 0.3 + 0.46 * bar - 0.24 * hole + 0.03 * grain;
          roughness += 0.06 * (grain - 0.5) + 0.12 * hole;
          occlusion = 1 - 0.44 * (1 - bar) - 0.18 * hole;
          return;
        };
      case 'tambourine':
        return () => {
          // Tilted jingle discs dome over the drum skin.
          const fx = Math.sin(Math.PI * (fract(u * 5) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 5) - 0.5));
          const d = Math.hypot(fx * 1.35, fy * 0.85);
          const disc = smooth(clamp((0.46 - d) / 0.16));
          const skin = noise(u, v, 32, 32, seed ^ 0x5869);
          color = 0.38 + 0.34 * disc + 0.1 * skin;
          height = 0.32 + 0.42 * disc + 0.03 * skin;
          roughness += 0.06 * (skin - 0.5) - 0.12 * disc;
          occlusion = 1 - 0.46 * (1 - disc);
          return;
        };
      case 'castanet':
        return () => {
          // Paired shells dimple at their centers above the felt backing.
          const fx = Math.sin(Math.PI * (fract(u * 3) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 3) - 0.5));
          const d = Math.hypot(fx, fy);
          const shell = smooth(clamp((0.56 - d) / 0.3));
          const dimple = smooth(clamp((0.16 - d) / 0.1));
          const grain = noise(u, v, 32, 32, seed ^ 0x697a);
          color = 0.42 + 0.26 * shell - 0.18 * dimple + 0.08 * grain;
          height = 0.3 + 0.42 * shell - 0.3 * dimple;
          roughness += 0.06 * (grain - 0.5) + 0.1 * dimple;
          occlusion = 1 - 0.44 * (1 - shell) - 0.12 * dimple;
          return;
        };
      case 'pillcapsule':
        return () => {
          // Elongated capsule halves dome over the blister backing.
          const fx = Math.sin(Math.PI * (fract(u * 3) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 2) - 0.5));
          const d = Math.hypot(fx * 0.72, fy * 1.25);
          const body = smooth(clamp((0.52 - d) / 0.3));
          const seam = 1 - smooth(clamp((Math.abs(fy) - 0.06) / 0.12));
          const groove = seam * body;
          const grain = noise(u, v, 32, 32, seed ^ 0x7a8b);
          color = 0.46 + 0.28 * body - 0.2 * groove + 0.06 * grain;
          height = 0.3 + 0.44 * body - 0.26 * groove;
          roughness += 0.06 * (grain - 0.5) + 0.12 * groove;
          occlusion = 1 - 0.44 * (1 - body) - 0.12 * groove;
          return;
        };
      case 'pilltablet':
        return () => {
          // Round tablets carry a score groove across their crowns.
          const fx = Math.sin(Math.PI * (fract(u * 4) - 0.5)),
            fy = Math.sin(Math.PI * (fract(v * 4) - 0.5));
          const d = Math.hypot(fx, fy);
          const tablet = smooth(clamp((0.62 - d) / 0.3));
          const score = 1 - smooth(clamp((Math.abs(fx) - 0.05) / 0.1));
          const groove = score * tablet;
          const grain = noise(u, v, 32, 32, seed ^ 0x8b9c);
          color = 0.5 + 0.26 * tablet - 0.2 * groove + 0.06 * grain;
          height = 0.3 + 0.42 * tablet - 0.24 * groove;
          roughness += 0.06 * (grain - 0.5) + 0.12 * groove;
          occlusion = 1 - 0.44 * (1 - tablet) - 0.12 * groove;
          return;
        };
      case 'bathbomb':
        return () => {
          // Coarse fizz grain breaks along shallow diagonal fissures.
          const fx = Math.sin(Math.PI * (fract((u + v) * 4) - 0.5)),
            fy = Math.sin(Math.PI * (fract((u - v) * 4) - 0.5));
          const crack =
            smooth(clamp((Math.abs(fx) - 0.62) / 0.2)) +
            smooth(clamp((Math.abs(fy) - 0.62) / 0.2)) -
            smooth(clamp((Math.abs(fx) - 0.62) / 0.2)) *
              smooth(clamp((Math.abs(fy) - 0.62) / 0.2));
          const grain = noise(u, v, 24, 24, seed ^ 0x9cad);
          const fizz = smooth(clamp((grain - 0.34) / 0.3));
          color = 0.42 + 0.26 * fizz - 0.16 * crack + 0.08 * grain;
          height = 0.34 + 0.02 * grain - 0.22 * crack;
          roughness += 0.08 * (grain - 0.5) + 0.12 * crack;
          occlusion = 1 - 0.4 * crack - 0.16 * (1 - fizz);
          return;
        };
      case 'basketball':
        return () => {
          const x = u * sportCells,
            y = v * sportCells,
            ix = Math.floor(x),
            iy = Math.floor(y);
          let pebbles = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const offset =
                ((((cy % sportCells) + sportCells) % sportCells) * sportCells +
                  (((cx % sportCells) + sportCells) % sportCells)) *
                sportStride;
              const dx = x - cx - sportFeatures![offset],
                dy = y - cy - sportFeatures![offset + 1];
              const pebble = smooth(
                clamp(1 - (dx * dx + dy * dy) * sportFeatures![offset + 2]),
              );
              pebbles += (1 - pebbles) * pebble;
            }
          // Products keep both intersecting panel grooves and their slopes smooth.
          const across = Math.abs(
              Math.sin(TAU * (2 * u + 0.12 * Math.sin(TAU * v))),
            ),
            along = Math.abs(
              Math.sin(TAU * (2 * v + 0.12 * Math.sin(TAU * u))),
            );
          const panel =
            smooth(clamp((across - 0.035) / 0.105)) *
            smooth(clamp((along - 0.035) / 0.105));
          color = 0.025 + panel * (0.64 + 0.24 * pebbles + 0.025 * detail);
          height = 0.12 + panel * (0.46 + 0.22 * pebbles);
          roughness += 0.045 * pebbles - 0.08 * (1 - panel);
          occlusion = 0.64 + 0.36 * panel;
          return;
        };
      case 'tennisball':
        return () => {
          const x = u * sportCells,
            y = v * sportCells,
            ix = Math.floor(x),
            iy = Math.floor(y);
          let felt = 0;
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const cx = ix + ox,
                cy = iy + oy;
              const offset =
                ((((cy % sportCells) + sportCells) % sportCells) * sportCells +
                  (((cx % sportCells) + sportCells) % sportCells)) *
                sportStride;
              const dx = x - cx - sportFeatures![offset],
                dy = y - cy - sportFeatures![offset + 1];
              const along =
                  (dx * sportFeatures![offset + 2] +
                    dy * sportFeatures![offset + 3]) /
                  0.48,
                across =
                  (-dx * sportFeatures![offset + 3] +
                    dy * sportFeatures![offset + 2]) /
                  0.065;
              // Compact, randomly oriented strokes imply tangled felt, not woven yarn.
              const fiber = smooth(clamp(1 - along * along - across * across));
              felt += (1 - felt) * fiber;
            }
          const distance = Math.abs(
            Math.sin(TAU * (v - 0.19 * Math.sin(TAU * u) - 0.25)),
          );
          const seam = 1 - smooth(clamp((distance - 0.025) / 0.075));
          color =
            (0.16 + 0.1 * detail + 0.06 * felt) * (1 - seam) + 0.97 * seam;
          height =
            0.54 + (1 - seam) * (0.065 * felt + 0.018 * detail) - 0.12 * seam;
          roughness -= 0.1 * seam;
          occlusion = 1 - 0.12 * seam;
          return;
        };
      case 'golfball':
        return () => {
          const x = fract(u * 10 - golfOffsetU) - 0.5,
            y = fract(v * 10 - golfOffsetV) - 0.5;
          // Squared radius is smooth at the center; the compact bowl meets flat
          // land with zero rim slope, before a cell can change ownership.
          const bowl = Math.pow(clamp(1 - (x * x + y * y) / (0.41 * 0.41)), 2);
          color = 0.96 - 0.12 * bowl;
          height = 0.8 - 0.6 * bowl;
          roughness += 0.04 * bowl;
          occlusion = 1 - 0.2 * bowl;
          return;
        };
      case 'boardformedconcrete':
        return () => {
          const row = Math.floor(v * 8),
            y = fract(v * 8),
            x = fract(u * 2 + (row % 2) * 0.5),
            column = Math.floor(fract(u + (row % 2) * 0.25) * 2);
          // Recessed timber joints own all board-local variation, including ends.
          // Separate axis shoulders avoid diagonal nearest-edge corner cusps.
          const face =
            smooth(clamp(x / 0.018)) *
            smooth(clamp((1 - x) / 0.018)) *
            smooth(clamp(y / 0.055)) *
            smooth(clamp((1 - y) / 0.055));
          const variation = architecturalOwners![row * 2 + column],
            grain = boardGrain!(
              u,
              v + 0.002 * Math.sin(TAU * u + variation * TAU),
            ),
            pores = castPores!(u, v);
          color =
            0.39 +
            face * (0.12 + 0.09 * variation + 0.055 * grain) +
            0.025 * pores;
          height =
            0.18 +
            face * (0.48 + 0.025 * variation + 0.025 * grain) +
            0.008 * pores;
          roughness += 0.025 * grain * face + 0.025 * pores;
          occlusion = 0.75 + 0.25 * face;
          return;
        };
      case 'ribbedconcrete':
        return () => {
          const x = fract(u * 12),
            owner = Math.floor(u * 12);
          // A broad flat crown and trough meet through rounded C1 shoulders.
          const rib =
            smooth(clamp((x - 0.12) / 0.18)) * smooth(clamp((0.88 - x) / 0.18));
          const pores = castPores!(u, v),
            aggregate = castAggregate!(u, v),
            variation = architecturalOwners![owner];
          color =
            0.38 +
            0.17 * rib +
            0.055 * aggregate +
            0.025 * pores +
            0.025 * variation * rib;
          height =
            0.15 +
            0.65 * rib +
            0.009 * pores +
            0.006 * aggregate +
            0.008 * variation * rib;
          roughness += 0.035 * pores + 0.02 * aggregate;
          occlusion = 0.69 + 0.31 * rib;
          return;
        };
      case 'splitfaceblock':
        return () => {
          const row = Math.floor(v * 8),
            y = fract(v * 8),
            shifted = u * 4 + (row % 2) * 0.5,
            x = fract(shifted),
            column = Math.floor(shifted) % 4;
          const face =
            smooth(clamp((x - 0.04) / 0.08)) *
            smooth(clamp((0.96 - x) / 0.08)) *
            smooth(clamp((y - 0.06) / 0.09)) *
            smooth(clamp((0.94 - y) / 0.09));
          const variation = architecturalOwners![row * 4 + column],
            aggregate = castAggregate!(u, v),
            pores = castPores!(u, v);
          // Broad fractured facets and smaller chips are confined to the block,
          // leaving a smooth, flat mortar bed through staggered row transitions.
          const fracture = smooth(clamp((aggregate - 0.22) / 0.56));
          color =
            0.4 +
            face * (0.04 + 0.28 * fracture + 0.1 * variation + 0.06 * pores);
          height =
            0.14 +
            face * (0.34 + 0.25 * fracture + 0.1 * variation + 0.08 * pores);
          roughness -= 0.1 * (1 - face);
          roughness += 0.035 * pores * face;
          occlusion = 0.64 + face * (0.29 + 0.07 * fracture);
          mortar = 1 - face;
          return;
        };
      case 'chainmail':
        return () => {
          const x = u * 6,
            y = v * 8,
            row = Math.floor(y);
          const grain = sheetGrain!(u, v);
          color = 0.035 + 0.025 * grain;
          height = 0.06 + 0.008 * grain;
          roughness = 0.88 + 0.04 * grain;
          occlusion = 0.59;
          // Compact annuli are composited in row order. Their opposite tilts
          // expose alternate shoulders where adjacent rows interleave.
          for (let oy = -1; oy <= 1; oy++) {
            const cy = row + oy,
              wy = (cy + 8) % 8;
            const shift = (wy % 2) * 0.5,
              column = Math.floor(x - shift);
            for (let ox = -1; ox <= 1; ox++) {
              const cx = column + ox,
                wx = (cx + 6) % 6;
              const dx = x - cx - shift - 0.5,
                dy = y - cy - 0.5;
              const radial = Math.sqrt(dx * dx + dy * dy);
              const wire = clamp(1 - ((radial - 0.62) / 0.105) ** 2);
              const coverage = smooth(wire);
              const variation = fabricatedOwners![wy * 6 + wx];
              const crown =
                0.44 +
                0.26 * wire +
                (wy % 2 ? -1 : 1) * dy * (0.13 + 0.04 * variation);
              color +=
                coverage * (0.63 + 0.13 * variation + 0.04 * grain - color);
              height += coverage * (crown - height);
              roughness +=
                coverage * (preset.roughness + 0.04 * grain - roughness);
              occlusion += coverage * (0.88 + 0.1 * wire - occlusion);
              metallic += coverage * (1 - metallic);
            }
          }
          return;
        };
      case 'rivetedmetal':
        return () => {
          const x = fract(u * 3),
            y = fract(v * 4);
          const face =
            smooth(clamp(x / 0.045)) *
            smooth(clamp((1 - x) / 0.045)) *
            smooth(clamp(y / 0.045)) *
            smooth(clamp((1 - y) / 0.045));
          const owner = Math.floor(v * 4) * 3 + Math.floor(u * 3);
          const variation = fabricatedOwners![owner],
            grain = sheetGrain!(u, v);
          let rivet = 0;
          // Four discrete heads sit inside each panel, clear of its joint.
          for (let iy = 0; iy < 2; iy++)
            for (let ix = 0; ix < 2; ix++) {
              const dx = x - (ix ? 0.88 : 0.12),
                dy = y - (iy ? 0.88 : 0.12);
              const cap = clamp(1 - (dx * dx + dy * dy) / (0.052 * 0.052));
              rivet += cap * cap;
            }
          color =
            0.28 +
            face * (0.19 + 0.09 * variation) +
            0.13 * rivet +
            0.03 * grain;
          height =
            0.09 +
            face * (0.23 + 0.025 * variation) +
            0.57 * rivet +
            0.004 * grain;
          roughness += 0.1 * (1 - face) - 0.09 * rivet + 0.025 * grain;
          occlusion = 0.64 + 0.34 * face + 0.02 * rivet;
          return;
        };
      case 'weldedmetal':
        return () => {
          const x = fract(u * 3 + 0.5) - 0.5;
          const scallop = 0.5 + 0.5 * Math.cos(TAU * 32 * v + phase);
          const width = 0.065 + 0.015 * scallop;
          const bead = smooth(clamp(1 - (x / width) ** 2));
          const halo = smooth(clamp(1 - (x / 0.15) ** 2));
          const grain = sheetGrain!(u, v);
          color =
            0.52 + 0.04 * grain - 0.16 * halo + bead * (0.19 + 0.08 * scallop);
          height = 0.2 + 0.004 * grain + bead * (0.46 + 0.15 * scallop);
          roughness += 0.12 * halo - 0.05 * bead + 0.025 * grain;
          occlusion = 1 - 0.15 * halo * (1 - bead);
          return;
        };
    }
    throw new Error(
      `Procedural material ${kind} has no sampler case in createSurfaceSampler.`,
    );
  };
  const body = pick();
  // Constant for the sampler: which noise layers the preset's own field does not replace.
  const needsDetail = !(
    architectural ||
    kind === 'flutedwood' ||
    kind === 'subwaytiles' ||
    kind === 'canewebbing' ||
    kind === 'rammedearth' ||
    kind === 'copperpatina' ||
    kind === 'birdseyemaple' ||
    kind === 'breezeblock' ||
    kind === 'basketweavepavers' ||
    kind === 'ripstop' ||
    kind === 'octagondot' ||
    kind === 'truchettiles' ||
    kind === 'standingseam' ||
    kind === 'damascus' ||
    kind === 'windmillpavers' ||
    kind === 'castiron' ||
    kind === 'porphyry' ||
    kind === 'linen' ||
    kind === 'chippedenamel' ||
    kind === 'perforatedleather' ||
    kind === 'argyle' ||
    kind === 'chevronparquet' ||
    kind === 'ginkgoleaf' ||
    kind === 'pressedtin' ||
    kind === 'sashiko' ||
    kind === 'ashlar' ||
    kind === 'gabion' ||
    kind === 'gingham' ||
    kind === 'mossypavers' ||
    kind === 'bamboocrosscut' ||
    kind === 'moire' ||
    kind === 'oakleaf' ||
    kind === 'rhombille' ||
    kind === 'fossillimestone' ||
    kind === 'seigaihatiles' ||
    kind === 'tuftedleather' ||
    kind === 'louveredmetal' ||
    kind === 'herringbonebrick' ||
    kind === 'shibori' ||
    kind === 'scallopedslate' ||
    kind === 'saltpan' ||
    kind === 'dogbonepavers' ||
    kind === 'palmendgrain' ||
    kind === 'asanoha' ||
    kind === 'lotusseedpod' ||
    kind === 'crowncaps' ||
    kind === 'cofferedconcrete' ||
    kind === 'woodworm' ||
    kind === 'calcadawaves' ||
    kind === 'ikat' ||
    kind === 'slottedwood' ||
    kind === 'hollyleaf' ||
    kind === 'englishbond' ||
    kind === 'rebar' ||
    kind === 'starfruit' ||
    kind === 'diamondrustication' ||
    kind === 'bargello' ||
    kind === 'saffiano' ||
    kind === 'cocoamat' ||
    kind === 'suminagashi' ||
    kind === 'vermiculite' ||
    kind === 'cairotiles' ||
    kind === 'guilloche' ||
    kind === 'seaurchintest' ||
    kind === 'crystallineglaze' ||
    kind === 'shirring' ||
    kind === 'sunburstveneer' ||
    kind === 'rakedgravel' ||
    kind === 'flintwall' ||
    kind === 'frenchknots' ||
    kind === 'artichoke' ||
    kind === 'splitlockwashers' ||
    kind === 'flemishbond' ||
    kind === 'satinweave' ||
    kind === 'lotusroot' ||
    kind === 'cardboardedge' ||
    kind === 'hexnuts' ||
    kind === 'orbicularjasper' ||
    kind === 'acornbarnacles' ||
    kind === 'circularpavers' ||
    kind === 'snowflaketiles' ||
    kind === 'sawblades' ||
    kind === 'pistachios' ||
    kind === 'polkadotfabric' ||
    kind === 'cucumberslices' ||
    kind === 'monsteraleaf' ||
    kind === 'crossstitch' ||
    kind === 'staranise' ||
    kind === 'logcabinparquet' ||
    kind === 'countersunkmetal' ||
    kind === 'trilobitefossil' ||
    kind === 'eyeletcotton' ||
    kind === 'dendriticagate' ||
    kind === 'ravioli' ||
    kind === 'rollerchain' ||
    kind === 'mapleleaf' ||
    kind === 'smocking' ||
    kind === 'quatrefoiltile' ||
    kind === 'okraslice' ||
    kind === 'eggcarton' ||
    kind === 'greekkey' ||
    kind === 'seedbeads' ||
    kind === 'chainstitch' ||
    kind === 'wingnuts' ||
    kind === 'pomegranateslice' ||
    kind === 'pawprinttiles' ||
    kind === 'dovetailjoint' ||
    kind === 'starsocketbolts' ||
    kind === 'sanddollar' ||
    kind === 'brogueleather' ||
    kind === 'clovebuds' ||
    kind === 'starcrosstiles' ||
    kind === 'maplesamara' ||
    kind === 'lenoweave' ||
    kind === 'circlips' ||
    kind === 'tuliptiles' ||
    kind === 'gingerslice' ||
    kind === 'fivebarplate' ||
    kind === 'cinnamonswirl' ||
    kind === 'wheatears' ||
    kind === 'scalemail' ||
    kind === 'trihexagonaltiles' ||
    kind === 'burlwood' ||
    kind === 'slottedmetal' ||
    kind === 'peppercorns' ||
    kind === 'castellatednuts' ||
    kind === 'farfalle' ||
    kind === 'cardamompods' ||
    kind === 'brickarches' ||
    kind === 'knottednet' ||
    kind === 'fiddleheads' ||
    kind === 'cowrieshells' ||
    kind === 'cotterpins' ||
    kind === 'seedstitch' ||
    kind === 'mangosteenslice' ||
    kind === 'pickettiles' ||
    kind === 'squarewashers' ||
    kind === 'eucalyptusleaf' ||
    kind === 'twillweave' ||
    kind === 'pumpkinseeds' ||
    kind === 'spurgears' ||
    kind === 'diamondcheckertiles' ||
    kind === 'appleslice' ||
    kind === 'paperclips' ||
    kind === 'ivyleaf' ||
    kind === 'ribknit' ||
    kind === 'pillowtiles' ||
    kind === 'coffeerings' ||
    kind === 'cashews' ||
    kind === 'hinges' ||
    kind === 'coins' ||
    kind === 'righttriangletiles' ||
    kind === 'cherryblossom' ||
    kind === 'punchcard' ||
    kind === 'braidedcord' ||
    kind === 'crossbeddedsandstone' ||
    kind === 'grommetcanvas' ||
    kind === 'fishscaletiles' ||
    kind === 'hexkeys' ||
    kind === 'driedfigslice' ||
    kind === 'creamcrackers' ||
    kind === 'doorkeys' ||
    kind === 'dodecagontiles' ||
    kind === 'ballchain' ||
    kind === 'succulentrosettes' ||
    kind === 'foldingfans' ||
    kind === 'togglebuttons' ||
    kind === 'greenpeapods' ||
    kind === 'beltbuckles' ||
    kind === 'hextruchettiles' ||
    kind === 'scoredmango' ||
    kind === 'waxseals' ||
    kind === 'cottonbolls' ||
    kind === 'carabiners' ||
    kind === 'pencilends' ||
    kind === 'corrugatedplasticedge' ||
    kind === 'haircombs' ||
    kind === 'blackberries' ||
    kind === 'musselshells' ||
    kind === 'safetypins' ||
    kind === 'poppyseedpods' ||
    kind === 'leatherbookspines' ||
    kind === 'matchsticks' ||
    kind === 'porcelaininsulators' ||
    kind === 'dominoes' ||
    kind === 'woodenspoons' ||
    kind === 'chessrooks' ||
    kind === 'threadspools' ||
    kind === 'bellpepperslices' ||
    kind === 'sharkteeth' ||
    kind === 'grinderburrs' ||
    kind === 'spaltedwood' ||
    kind === 'canlids' ||
    kind === 'crinoidossicles' ||
    kind === 'pythagoreantiles' ||
    kind === 'dinnerforks' ||
    kind === 'mudtiretracks' ||
    kind === 'tangramtiles' ||
    fabricated ||
    botanical ||
    packaging ||
    volcanic ||
    mineral ||
    bulkGrain ||
    foliage ||
    marine ||
    shortFur ||
    shell ||
    nutshell ||
    fruitSkin ||
    petal ||
    treeBark ||
    animalSkin ||
    municipal ||
    fungal ||
    rind
  );
  const detailSeed = seed ^ 0xa3c59ac3,
    fineSeed = seed ^ 0x7f4a7c15;
  return (x: number, y: number, out: SurfaceSample): void => {
    u = fract(x);
    v = fract(y);
    broad = needsBroad ? noise(u, v, 4, 4, seed) : 0;
    detail = needsDetail ? noise(u, v, 32, 32, detailSeed) : 0;
    fine = needsFine ? noise(u, v, 64, 64, fineSeed) : 0;
    color = broad;
    height = broad;
    roughness = preset.roughness;
    occlusion = 1;
    mortar = 0;
    metallic = metallicBase;
    body();
    out.color = color;
    out.height = height * preset.relief;
    out.roughness = clamp(roughness);
    out.occlusion = occlusion;
    out.mortar = mortar;
    out.metallic = metallic;
  };
}

export interface ProceduralMaps {
  baseColor: Uint8ClampedArray;
  normal: Uint8ClampedArray;
  metallicRoughness: Uint8ClampedArray;
  occlusion: Uint8ClampedArray;
  height?: Uint8ClampedArray;
}

/** Normal derivatives wrap and divide by UV spacing, not texture resolution. */
export function writeNormals(
  height: Float32Array,
  size: number,
  normal: Uint8ClampedArray,
): void {
  for (let y = 0; y < size; y++) {
    const up = ((y + size - 1) % size) * size,
      down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x++) {
      const i = y * size + x,
        p = i * 4;
      const dx =
        ((height[y * size + ((x + 1) % size)] -
          height[y * size + ((x + size - 1) % size)]) *
          size) /
        2;
      // Image rows and renderer UV.v both increase downward (uploads do not flip Y).
      const dy = ((height[down + x] - height[up + x]) * size) / 2;
      const inv = 1 / hypot3(dx, dy, 1);
      normal[p] = byte(0.5 - dx * inv * 0.5);
      normal[p + 1] = byte(0.5 - dy * inv * 0.5);
      normal[p + 2] = byte(0.5 + inv * 0.5);
      normal[p + 3] = 255;
    }
  }
}

export function generateProceduralMaps(
  kind: ProceduralMaterialKind,
  size: number,
  seed: number,
  controls: {
    contrast?: number;
    roughnessBias?: number;
    tint?: readonly [number, number, number];
    heightMap?: boolean;
  } = {},
): ProceduralMaps {
  const maps: ProceduralMaps = {
    baseColor: new Uint8ClampedArray(size * size * 4),
    normal: new Uint8ClampedArray(size * size * 4),
    metallicRoughness: new Uint8ClampedArray(size * size * 4),
    occlusion: new Uint8ClampedArray(size * size * 4),
  };
  const heights = new Float32Array(size * size);
  const sample = createSurfaceSampler(kind, seed),
    preset = proceduralMaterialPresets[kind];
  const surface: SurfaceSample = {
    color: 0,
    height: 0,
    roughness: 0,
    occlusion: 0,
    mortar: 0,
    metallic: 0,
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      sample((x + 0.5) / size, (y + 0.5) / size, surface);
      const contrast = controls.contrast ?? 1;
      const roughnessBias = controls.roughnessBias ?? 0;
      surface.color = clamp(0.5 + (surface.color - 0.5) * contrast);
      const i = y * size + x,
        p = i * 4;
      heights[i] = surface.height;
      for (let c = 0; c < 3; c++) {
        const authored =
          preset.dark[c] + (preset.light[c] - preset.dark[c]) * surface.color;
        // Tint scales only the surface pigment; mortar/grout keeps its neutral tone.
        const color =
          controls.tint === undefined ? authored : authored * controls.tint[c];
        maps.baseColor[p + c] = Math.round(
          color * (1 - surface.mortar) + (c === 2 ? 139 : 153) * surface.mortar,
        );
        maps.occlusion[p + c] = byte(surface.occlusion);
      }
      maps.baseColor[p + 3] = maps.occlusion[p + 3] = 255;
      maps.metallicRoughness[p] = 255;
      maps.metallicRoughness[p + 1] = byte(surface.roughness + roughnessBias);
      maps.metallicRoughness[p + 2] = byte(surface.metallic);
      maps.metallicRoughness[p + 3] = 255;
    }
  writeNormals(heights, size, maps.normal);
  if (controls.heightMap) {
    const height = new Uint8ClampedArray(size * size * 4);
    let minimum = Infinity;
    let maximum = -Infinity;
    for (const value of heights) {
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    const range = maximum - minimum;
    for (let i = 0; i < heights.length; i++) {
      const value = byte(range > 0 ? (heights[i] - minimum) / range : 0.5);
      const p = i * 4;
      height[p] = height[p + 1] = height[p + 2] = value;
      height[p + 3] = 255;
    }
    maps.height = height;
  }
  return maps;
}
