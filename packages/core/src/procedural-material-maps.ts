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
) {
  const preset = proceduralMaterialPresets[kind];
  const phase = hash(0, 0, seed) * TAU;
  const motifAngle = kind === 'encaustictiles' ? 0.12 * Math.sin(phase) : 0;
  const motifCos = Math.cos(motifAngle),
    motifSin = Math.sin(motifAngle);
  const endgrainCenterU = kind === 'endgrain' ? hash(0, 0, seed ^ 0x3b17) : 0;
  const endgrainCenterV = kind === 'endgrain' ? hash(0, 0, seed ^ 0x5d29) : 0;
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
    kind === 'fishscales' || kind === 'feathers'
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
  return (u: number, v: number, out: SurfaceSample): void => {
    u = fract(u);
    v = fract(v);
    const broad = needsBroad ? noise(u, v, 4, 4, seed) : 0;
    const detail =
      architectural ||
      fabricated ||
      botanical ||
      packaging ||
      volcanic ||
      mineral ||
      bulkGrain ||
      foliage ||
      marine
        ? 0
        : noise(u, v, 32, 32, seed ^ 0xa3c59ac3);
    const fine = needsFine ? noise(u, v, 64, 64, seed ^ 0x7f4a7c15) : 0;
    let color = broad,
      height = broad,
      roughness = preset.roughness,
      occlusion = 1,
      mortar = 0,
      metallic =
        kind === 'metal' ||
        kind === 'diamondplate' ||
        kind === 'hammeredmetal' ||
        kind === 'galvanized' ||
        kind === 'corrugatedmetal' ||
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
    switch (kind) {
      case 'braincoral': {
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
        break;
      }
      case 'starcoral': {
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
            roughness += face * (preset.roughness + 0.055 * mouth - roughness);
            occlusion += face * (0.88 + 0.07 * wall - 0.42 * mouth - occlusion);
          }
        break;
      }
      case 'seasponge': {
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
        break;
      }
      case 'lotusleaf':
      case 'bananaleaf':
      case 'fernleaf': {
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
                  fine = Math.pow(0.5 + 0.5 * Math.cos(42 * t - 7 * across), 8),
                  vein = pinna * (0.78 * midrib + 0.22 * fine);
                face += (1 - face) * pinna;
                veins += (1 - veins) * vein;
              }
              crown = face;
            } else {
              const q =
                a * a + b * b * (kind === 'bananaleaf' ? 1 + 0.45 * a * a : 1);
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
        break;
      }
      case 'rice':
      case 'sesame':
      case 'coffeebeans': {
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
            let pigment: number, relief: number, finish: number, shade: number;
            if (kind === 'rice') {
              const striation = 0.5 + 0.5 * Math.cos(14 * b + 0.7 * a * a);
              pigment = 0.75 + 0.16 * variation + 0.035 * striation;
              relief = 0.28 + 0.32 * crown + 0.025 * crown * striation;
              finish = preset.roughness + 0.04 * (1 - crown);
              shade = 0.87 + 0.1 * crown;
            } else if (kind === 'sesame') {
              const keel = Math.exp(-12 * b * b) * crown,
                fleck = 0.5 + 0.5 * Math.sin(17 * a + 5 * b + variation * TAU);
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
              relief = 0.28 + 0.4 * crown - 0.3 * split + 0.018 * grain * crown;
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
        break;
      }
      case 'malachite':
      case 'agate': {
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
        break;
      }
      case 'lapislazuli': {
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
        break;
      }
      case 'basalt': {
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
        break;
      }
      case 'scoria':
      case 'obsidian': {
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
                smooth(clamp((q - 0.42) / 0.18)) * smooth(clamp((1 - q) / 0.2));
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
        break;
      }
      case 'corrugatedcardboard':
      case 'creasedpaper':
      case 'layeredpaper': {
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
            0.7 + 0.1 * ridge - 0.14 * shoulder + 0.07 * grain - 0.04 * fibers;
          height = 0.4 + 0.3 * ridge - 0.16 * shoulder + pulp;
          roughness += 0.025 * (grain - 0.5) - 0.035 * ridge + 0.025 * shoulder;
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
        break;
      }
      case 'cactus': {
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
        break;
      }
      case 'pinecone': {
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
        break;
      }
      case 'corncob': {
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
        roughness += 0.14 * (1 - face) - 0.055 * crown + 0.015 * (grain - 0.5);
        occlusion = 0.55 + 0.44 * face;
        break;
      }
      case 'wood': {
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
        break;
      }
      case 'brick': {
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
        break;
      }
      case 'stone': {
        const strata = noise(u + 0.12 * broad, v, 8, 8, seed ^ 131);
        color = clamp(0.1 + 0.65 * strata + 0.3 * detail);
        height = 0.65 * strata + 0.25 * detail + 0.1 * fine;
        roughness += 0.1 * (detail - 0.5);
        occlusion = 0.8 + 0.2 * smooth(height);
        break;
      }
      case 'metal': {
        const brush = noise(u, v, 4, 64, seed ^ 313);
        const scratch = Math.pow(
          0.5 + 0.5 * Math.sin(TAU * v * 48 + phase),
          16,
        );
        color = 0.4 + 0.38 * brush + 0.12 * broad - 0.1 * scratch;
        height = 0.7 * brush - 0.15 * scratch;
        roughness += 0.18 * brush + 0.08 * scratch;
        occlusion = 1 - 0.04 * scratch;
        break;
      }
      case 'fabric': {
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
        break;
      }
      case 'marble': {
        const warp = noise(u, v, 4, 4, seed ^ 997);
        const vein = Math.exp(
          -Math.abs(Math.sin(TAU * (3 * u + 2 * v + 0.8 * warp) + phase)) * 16,
        );
        color = clamp(0.9 + 0.1 * broad - 0.85 * vein);
        height = 0.3 * broad - 0.2 * vein + 0.05 * detail;
        roughness += 0.1 * vein + 0.04 * (detail - 0.5);
        occlusion = 1 - 0.06 * vein;
        break;
      }
      case 'concrete': {
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
        break;
      }
      case 'tiles': {
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
        break;
      }
      case 'leather': {
        const pores = wrappedFeature(u, v, 14, seed ^ 0x51);
        const pebble = smooth(clamp(1 - pores * 1.55));
        color = 0.24 + 0.52 * pebble + 0.12 * detail;
        height = 0.12 + 0.72 * pebble + 0.06 * detail;
        roughness += 0.16 * (1 - pebble) + 0.04 * (detail - 0.5);
        occlusion = 0.55 + 0.45 * pebble;
        break;
      }
      case 'suede': {
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
        color = 0.23 + 0.36 * brush + 0.25 * nap + 0.1 * detail - 0.08 * pores;
        height = 0.35 + 0.075 * nap + 0.025 * brush - 0.045 * pores;
        roughness += 0.075 * (nap - 0.5) + 0.035 * (brush - 0.5);
        occlusion = 0.985 - 0.035 * pores + 0.01 * nap;
        break;
      }
      case 'snakeskin': {
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
          0.04 + 0.64 * scales + 0.2 * crowns + 0.065 * keels + 0.012 * detail;
        roughness +=
          0.12 * (1 - scales) - 0.045 * crowns + 0.045 * (detail - 0.5);
        occlusion = 0.57 + 0.41 * scales + 0.015 * crowns;
        break;
      }
      case 'crocodile': {
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
          0.12 + face * (0.37 + 0.22 * variation + 0.1 * detail - 0.12 * fold);
        height =
          0.035 +
          face * (0.64 + 0.17 * cap * cap + 0.035 * variation - 0.065 * fold);
        roughness +=
          0.13 * (1 - face) + face * (0.055 * fold + 0.04 * (detail - 0.5));
        occlusion = 0.53 + face * (0.46 - 0.055 * fold);
        break;
      }
      case 'fishscales':
      case 'feathers': {
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
              relief = 0.37 + 0.12 * dome + 0.11 * lip + 0.012 * growth * dome;
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
              relief = 0.35 + 0.1 * vane + 0.075 * shaft + 0.013 * barbs * vane;
            }
            color += cover * (pigment - color);
            height += cover * (relief - height);
            occlusion += cover * (0.98 - occlusion);
          }
        }
        roughness += 0.045 * (1 - occlusion) + 0.025 * (detail - 0.5);
        break;
      }
      case 'tortoiseshell': {
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
        break;
      }
      case 'sand': {
        const warp = noise(u, v, 3, 3, seed ^ 17);
        const ripple =
          0.5 + 0.5 * Math.sin(TAU * (v * 7 + 0.35 * warp) + phase);
        const grain = noise(u, v, 48, 48, seed ^ 0x51ed);
        color = 0.3 + 0.48 * ripple + 0.18 * grain;
        height = 0.72 * ripple + 0.22 * grain;
        roughness += 0.06 * (grain - 0.5);
        occlusion = 0.82 + 0.18 * ripple;
        break;
      }
      case 'rust': {
        const pit = noise(u, v, 6, 6, seed ^ 211);
        const flake = noise(u, v, 18, 18, seed ^ 419);
        const corrosion = smooth(
          clamp((pit * 0.7 + flake * 0.3 - 0.32) / 0.28),
        );
        color = corrosion;
        height = 0.25 + 0.45 * (1 - corrosion) * flake - 0.2 * corrosion * pit;
        roughness += 0.22 * corrosion + 0.05 * (flake - 0.5);
        occlusion = 0.7 + 0.3 * (1 - corrosion);
        metallic = 1 - corrosion;
        break;
      }
      case 'snow': {
        const drift = noise(u, v, 3, 3, seed ^ 17);
        const spark = Math.pow(
          hash(Math.floor(fract(u) * 48), Math.floor(fract(v) * 48), seed),
          8,
        );
        color = clamp(0.22 + 0.68 * drift + 0.1 * spark);
        height = 0.7 * drift + 0.2 * spark;
        roughness += 0.22 * spark - 0.06 * drift;
        occlusion = 0.88 + 0.12 * drift;
        break;
      }
      case 'asphalt':
      case 'gravel': {
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
        break;
      }
      case 'cobblestone': {
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
          0.05 + face * (0.25 + 0.48 * variation + 0.12 * detail) + 0.05 * fine;
        height = face * (0.76 * crown + 0.16 * detail + 0.08 * fine);
        roughness += 0.17 * (1 - face) + 0.1 * (fine - 0.5);
        occlusion = 0.45 + 0.55 * face;
        break;
      }
      case 'bark': {
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
        break;
      }
      case 'moss': {
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
        break;
      }
      case 'mud': {
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
        break;
      }
      case 'granite': {
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
        break;
      }
      case 'slate': {
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
        break;
      }
      case 'terrazzo': {
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
        break;
      }
      case 'denim': {
        const x = u * 24,
          y = v * 24;
        const warp = 0.5 + 0.5 * Math.cos(TAU * x),
          weft = 0.5 + 0.5 * Math.cos(TAU * y);
        // A narrow pale weft exposure advances diagonally through indigo warp floats.
        // Analytic ownership avoids switching yarns abruptly at crossing/row boundaries.
        const exposure =
          1 -
          smooth(
            clamp((Math.abs(Math.sin((Math.PI * (x - y)) / 4)) - 0.24) / 0.22),
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
        break;
      }
      case 'herringbone': {
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
          0.25 + 0.24 * thread + 0.07 * exposure + 0.035 * fiber + 0.025 * slub;
        roughness += 0.055 * (detail - 0.5) + 0.035 * (1 - thread);
        occlusion = 0.84 + 0.12 * thread + 0.025 * fiber;
        break;
      }
      case 'tweed': {
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
        break;
      }
      case 'seersucker': {
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
          0.22 + 0.035 * thread + 0.008 * fiber + band * (0.08 + 0.2 * wrinkle);
        roughness += 0.045 * (detail - 0.5) + 0.025 * band * (1 - wrinkle);
        occlusion = 0.96 - 0.07 * band * (1 - wrinkle) + 0.02 * thread;
        break;
      }
      case 'burlap': {
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
        color = 0.04 + 0.65 * coverage + 0.14 * fiber + 0.1 * detail * coverage;
        height =
          0.58 * coverage + 0.2 * crossing + 0.08 * fiber + 0.04 * detail;
        roughness += 0.05 * (detail - 0.5) + 0.025 * (1 - coverage);
        occlusion = 0.42 + 0.54 * coverage + 0.04 * fiber;
        break;
      }
      case 'carpet': {
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
        break;
      }
      case 'plaster': {
        const sweep = noise(u, v, 3, 3, seed ^ 0x37a1);
        const tool =
          0.5 + 0.5 * Math.sin(TAU * (3 * u + 2 * v + 0.7 * sweep) + phase);
        const crest = Math.pow(tool, 10);
        const drag = noise(u, v, 18, 5, seed ^ 0x54d9);
        const pores = smooth(clamp((0.32 - fine) / 0.23));
        // Broad, curved trowel passes leave shallow feathered edges in gypsum.
        color = 0.61 + 0.2 * sweep + 0.08 * drag + 0.07 * crest - 0.12 * pores;
        height =
          0.22 + 0.28 * sweep + 0.18 * crest + 0.08 * drag - 0.14 * pores;
        roughness += 0.1 * (fine - 0.5) - 0.065 * crest + 0.045 * pores;
        occlusion = 0.98 - 0.1 * pores - 0.025 * crest;
        break;
      }
      case 'terracotta': {
        const kiln = noise(u, v, 5, 5, seed ^ 0x3a17);
        const firing = noise(u + 0.04 * kiln, v, 12, 9, seed ^ 0x7d23);
        const pitDistance = wrappedFeature(u, v, 28, seed ^ 0x486d);
        const pits = 1 - smooth(clamp((pitDistance - 0.04) / 0.19));
        const scorched = smooth(clamp((kiln - 0.5) / 0.3));
        // Firing clouds affect pigment more strongly than the unglazed clay relief.
        color =
          0.37 + 0.46 * firing + 0.15 * detail - 0.18 * scorched - 0.17 * pits;
        height = 0.35 + 0.14 * detail + 0.12 * fine - 0.3 * pits;
        roughness += 0.1 * (fine - 0.5) + 0.07 * pits - 0.04 * scorched;
        occlusion = 0.97 - 0.22 * pits + 0.025 * fine;
        break;
      }
      case 'cork': {
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
              0.5 + 0.5 * Math.sin(TAU * (5 * ry + 0.3 * rx) + TAU * variation),
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
        break;
      }
      case 'studdedrubber': {
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
        break;
      }
      case 'groovedrubber': {
        const x = u * 12;
        const distance = Math.abs(fract(x) - 0.5);
        const rib = 1 - smooth(clamp((distance - 0.32) / 0.13));
        const variation = rubberRibs![Math.floor(x)];
        const stipple = noise(u, v, 144, 144, seed ^ 0x6e21);
        color = 0.18 + 0.29 * rib + 0.04 * rib * variation + 0.035 * stipple;
        height = 0.15 + 0.7 * rib + 0.0015 * stipple;
        roughness = preset.roughness + 0.035 * (stipple - 0.5);
        occlusion = 0.7 + 0.3 * rib;
        break;
      }
      case 'recycledrubber': {
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
        break;
      }
      case 'rubber': {
        const distance = wrappedFeature(u, v, 44, seed ^ 0x8e53);
        const pebble = 1 - smooth(clamp((distance - 0.08) / 0.55));
        // Fine molded stipple, with much shallower relief than leather grain.
        color = 0.19 + 0.38 * pebble + 0.19 * fine + 0.1 * detail;
        height = 0.19 + 0.49 * pebble + 0.15 * fine + 0.06 * detail;
        roughness += 0.12 * (fine - 0.5) - 0.045 * pebble;
        occlusion = 0.9 + 0.08 * pebble + 0.02 * fine;
        break;
      }
      case 'carbonfiber': {
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
        break;
      }
      case 'diamondplate': {
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
        break;
      }
      case 'knurledmetal': {
        const across = smooth(0.5 - 0.5 * Math.cos(TAU * 24 * (u + v))),
          along = smooth(0.5 - 0.5 * Math.cos(TAU * 24 * (u - v)));
        // Intersecting cuts leave small diamond crowns, not isolated tread bars.
        const crown = across * along;
        color = 0.29 + 0.48 * crown + 0.16 * detail;
        height = 0.12 + 0.72 * crown + 0.025 * detail;
        roughness += 0.1 * (detail - 0.5) + 0.07 * (1 - crown);
        occlusion = 0.85 + 0.14 * crown;
        break;
      }
      case 'engineturned': {
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
        break;
      }
      case 'goldleaf': {
        const warp = noise(u, v, 4, 5, seed ^ 0x4d83);
        const patchU = u + 0.035 * Math.sin(TAU * v * 3 + phase),
          patchV = v + 0.03 * Math.sin(TAU * u * 4 + phase);
        const patch = noise(patchU, patchV, 4, 5, seed ^ 0x1e59);
        const lapU = smooth(clamp((Math.cos(TAU * 4 * patchU) - 0.92) / 0.08));
        const lapV = smooth(clamp((Math.cos(TAU * 5 * patchV) - 0.92) / 0.08));
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
        break;
      }
      case 'paper': {
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
              (along * along) / (length * length) + (across * across) / 0.0064;
            const fiber = Math.pow(clamp(1 - distance), 2);
            fibers = Math.max(fibers, fiber);
          }
        color = 0.62 + 0.24 * formation + 0.1 * tooth - 0.2 * fibers;
        height = 0.22 + 0.12 * formation + 0.22 * tooth + 0.3 * fibers;
        roughness += 0.08 * (tooth - 0.5) + 0.04 * fibers;
        occlusion = 0.98 - 0.07 * fibers - 0.035 * (1 - tooth);
        break;
      }
      case 'reedmat': {
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
        roughness += 0.06 * (1 - reed) - 0.035 * reed * fiber + 0.025 * thread;
        occlusion = 0.56 + 0.32 * reed + 0.07 * thread;
        break;
      }
      case 'rope': {
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
          0.13 + body * (0.3 + 0.14 * variation + 0.23 * strand + 0.06 * fiber);
        height = 0.08 + body * (0.34 + 0.32 * strand + 0.018 * fiber);
        roughness += 0.065 * (1 - body) + body * (0.025 - 0.045 * fiber);
        occlusion = 0.43 + body * (0.35 + 0.17 * strand);
        break;
      }
      case 'straw': {
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
        break;
      }
      case 'wicker': {
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
        roughness += 0.1 * (detail - 0.5) + 0.1 * (1 - coverage) - 0.04 * grain;
        occlusion = 0.34 + 0.54 * coverage + 0.1 * crown;
        break;
      }
      case 'bamboo': {
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
        break;
      }
      case 'hammeredmetal': {
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
        break;
      }
      case 'galvanized': {
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
              0.5 + 0.5 * Math.cos(TAU * (3 * across + 1.5 * Math.abs(along)));
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
        break;
      }
      case 'corrugatedmetal': {
        const flute = 0.5 + 0.5 * Math.cos(TAU * 8 * u + phase);
        const rolled = noise(u, v, 64, 4, seed ^ 0x1f6b);
        const wear = Math.pow(0.5 + 0.5 * Math.sin(TAU * 48 * u + phase), 12);
        // A continuous rolled sheet: the large-scale flutes affect only its
        // normal map, with faint longitudinal wear rather than panel joints.
        color = 0.5 + 0.2 * flute + 0.16 * rolled - 0.06 * wear;
        height = 0.1 + 0.8 * flute + 0.004 * rolled - 0.002 * wear;
        roughness += 0.13 * (rolled - 0.5) + 0.06 * wear;
        occlusion = 0.91 + 0.08 * flute;
        break;
      }
      case 'perforatedmetal': {
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
        break;
      }
      case 'expandedmetal': {
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
        break;
      }
      case 'wiremesh': {
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
        break;
      }
      case 'velvet': {
        // Dense upright pile stays flat while soft crush clouds shift the
        // nap's pigment and sheen without introducing hard pile edges.
        const crush = noise(u, v, 5, 5, seed ^ 0x7c31);
        const drift = noise(u, v, 3, 9, seed ^ 0x2a17);
        const nap = noise(u, v, 96, 96, seed ^ 0x5f2d);
        color = 0.3 + 0.32 * crush + 0.12 * nap;
        height = 0.42 + 0.06 * crush + 0.05 * nap;
        roughness += 0.12 * (crush - 0.5) + 0.035 * (drift - 0.5);
        occlusion = 0.92 + 0.06 * crush;
        break;
      }
      case 'terrycloth': {
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
        break;
      }
      case 'boucle': {
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
            const dx = x - cx - 0.5 - 0.3 * (hash(wx, wy, seed ^ 0x6a2d) - 0.5),
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
        break;
      }
      case 'geode': {
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
        break;
      }
      case 'quartz': {
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
                (Math.PI / 3) * k + 0.22 * (hash(wx, wy, seed ^ 0x5d77) - 0.5);
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
        break;
      }
      case 'pyrite': {
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
        break;
      }
      case 'shiplap': {
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
        color = 0.24 + 0.36 * board + 0.16 * grain + 0.1 * streak - 0.18 * seam;
        height = 0.72 - 0.5 * seam + 0.08 * grain + 0.03 * streak;
        roughness += 0.05 * (grain - 0.5) + 0.06 * seam;
        occlusion = 1 - 0.55 * seam;
        break;
      }
      case 'glassblock': {
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
        break;
      }
      case 'thatch': {
        const rows = 6;
        const y = v * rows;
        // Layered straw courses hang over their laps; fine streaks carry
        // individual straws down the slope between soft course shadows.
        const course =
          0.5 +
          0.5 *
            Math.cos(
              TAU * (fract(y) - 0.25) + 0.5 * noise(u, v, 3, 6, seed ^ 0x1d4b),
            );
        const straw = noise(u, v, 80, 6, seed ^ 0x3f8d);
        const lap = smooth(clamp((0.14 - Math.abs(fract(y) - 0.73)) / 0.07));
        color = 0.3 + 0.32 * course + 0.18 * straw + 0.1 * detail - 0.12 * lap;
        height = 0.32 + 0.36 * course + 0.22 * straw - 0.3 * lap;
        roughness += 0.05 * (straw - 0.5) + 0.05 * lap;
        occlusion = 0.68 + 0.28 * course - 0.3 * lap;
        break;
      }
      case 'sandstone': {
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
        break;
      }
      case 'travertine': {
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
        const band = 0.5 + 0.5 * Math.sin(TAU * (6 * v + 0.18 * warp) + phase);
        color = 0.65 + 0.12 * band + 0.09 * fine - 0.48 * vugs;
        height = 0.62 + 0.05 * band + 0.04 * fine - 0.3 * vugs;
        roughness += 0.15 * vugs + 0.08 * (fine - 0.5);
        occlusion = 0.98 - 0.42 * vugs;
        break;
      }
      case 'pumice': {
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
        break;
      }
      case 'parquet': {
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
              TAU * (across * 38 + 0.28 * Math.sin(TAU * along) + 0.18 * warp) +
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
        break;
      }
      case 'mosaic': {
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
        break;
      }
      case 'hexagontiles': {
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
        break;
      }
      case 'knit': {
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
        break;
      }
      case 'corduroy': {
        const wale = Math.pow(0.5 + 0.5 * Math.cos(TAU * u * 12), 0.65);
        const pile = noise(u, v, 96, 96, seed ^ 0x2b71);
        const nap = noise(u, v, 12, 48, seed ^ 0x7ca3);
        color = 0.12 + 0.57 * wale + 0.16 * pile + 0.08 * nap;
        height = 0.07 + 0.79 * wale + 0.035 * pile + 0.025 * nap;
        roughness += 0.08 * (pile - 0.5) + 0.035 * (1 - wale);
        occlusion = 0.57 + 0.42 * wale;
        break;
      }
      case 'felt': {
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
        break;
      }
      case 'wafflecloth': {
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
        break;
      }
      case 'cableknit': {
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
          0.13 + 0.55 * lift + 0.13 * rib + 0.09 * wool + 0.04 * braid * twist;
        height =
          0.07 +
          lift +
          0.17 * rib * (0.65 + 0.35 * loops) +
          0.02 * wool +
          0.015 * braid * twist;
        roughness += 0.035 * (wool - 0.5) + 0.025 * (1 - braid);
        occlusion = 0.57 + 0.35 * braid + 0.055 * rib + 0.015 * wool;
        break;
      }
      case 'quilting': {
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
        break;
      }
      case 'roofshingles': {
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
        break;
      }
      case 'rooftiles': {
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
        break;
      }
      case 'stucco': {
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
          0.52 + 0.15 * trowel + 0.19 * aggregate - 0.24 * pits + 0.08 * detail;
        height =
          0.27 + 0.16 * trowel + 0.43 * aggregate - 0.22 * pits + 0.06 * detail;
        roughness += 0.055 * aggregate + 0.065 * pits + 0.05 * (detail - 0.5);
        occlusion = 0.96 - 0.25 * pits - 0.075 * aggregate + 0.02 * detail;
        break;
      }
      case 'lichen': {
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
        break;
      }
      case 'leaflitter': {
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
        break;
      }
      case 'endgrain': {
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
          0.76 - 0.37 * latewood - 0.2 * pores - 0.24 * checks + 0.08 * detail;
        height =
          0.49 -
          0.07 * latewood -
          0.16 * pores -
          0.22 * checks +
          0.025 * detail;
        roughness += 0.13 * pores + 0.06 * latewood + 0.045 * (detail - 0.5);
        occlusion = 0.99 - 0.17 * pores - 0.22 * checks;
        break;
      }
      case 'acousticfoam': {
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
        break;
      }
      case 'closedcellfoam': {
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
            const cap = clamp(1 - (dx * dx + dy * dy) * foamCells![offset + 2]);
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
        break;
      }
      case 'linoleum': {
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
        break;
      }
      case 'orangepeel': {
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
        break;
      }
      case 'coconut': {
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
        occlusion = (0.96 + 0.025 * fibers) * (1 - fissures) + 0.86 * fissures;
        break;
      }
      case 'watermelon': {
        const warp = noise(u, v, 4, 5, seed ^ 0x4f17),
          waviness = noise(u, v, 12, 8, seed ^ 0x67a3);
        const wave =
          0.5 +
          0.5 * Math.sin(TAU * (5 * u + 0.3 * warp + 0.12 * waviness) + phase);
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
        break;
      }
      case 'limestone': {
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
        break;
      }
      case 'breccia': {
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
        break;
      }
      case 'gneiss': {
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
        roughness += 0.08 * (detail - 0.5) + 0.06 * (1 - bands) - 0.05 * flecks;
        occlusion = 0.95 + 0.025 * bands + 0.015 * flecks;
        break;
      }
      case 'plywood': {
        const warp = noise(u, v, 4, 3, seed ^ 0x43b7);
        // Rotary-cut growth surfaces form broad nested cathedral arches,
        // rather than plank seams or the exposed laminate edges of a panel.
        const growth =
          3.2 * Math.cos(TAU * u + phase) +
          1.8 * Math.cos(TAU * v + 0.7 * phase) +
          0.45 * warp;
        const grain = Math.pow(0.5 + 0.5 * Math.sin(TAU * growth), 5);
        const fiber = 0.5 + 0.5 * Math.sin(TAU * (64 * u + 0.4 * warp) + phase);
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
          occlusion = occlusion * (1 - weight) + (0.95 + 0.025 * ring) * weight;
        }
        break;
      }
      case 'osb':
      case 'chipboard': {
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
        break;
      }
      case 'crackleglaze': {
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
        break;
      }
      case 'flutedceramic': {
        const flute = 0.5 + 0.5 * Math.cos(TAU * 8 * u + phase);
        const speckles = smooth(
          clamp((noise(u, v, 96, 96, seed ^ 0x5f29) - 0.65) / 0.28),
        );
        color = 0.88 + 0.035 * detail - 0.12 * speckles;
        height = 0.2 + 0.6 * flute;
        roughness += 0.035 * (1 - flute) + 0.025 * speckles;
        occlusion = 0.92 + 0.08 * flute;
        break;
      }
      case 'encaustictiles': {
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
        break;
      }
      case 'breadcrust': {
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
          0.12 + 0.42 * plates + 0.26 * puff + 0.012 * plates * (detail - 0.5);
        roughness += 0.08 * (1 - plates) + 0.035 * (baked - 0.5);
        occlusion = 0.65 + 0.35 * plates;
        break;
      }
      case 'wafer': {
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
        break;
      }
      case 'chocolate': {
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
        break;
      }
      case 'basketball': {
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
          along = Math.abs(Math.sin(TAU * (2 * v + 0.12 * Math.sin(TAU * u))));
        const panel =
          smooth(clamp((across - 0.035) / 0.105)) *
          smooth(clamp((along - 0.035) / 0.105));
        color = 0.025 + panel * (0.64 + 0.24 * pebbles + 0.025 * detail);
        height = 0.12 + panel * (0.46 + 0.22 * pebbles);
        roughness += 0.045 * pebbles - 0.08 * (1 - panel);
        occlusion = 0.64 + 0.36 * panel;
        break;
      }
      case 'tennisball': {
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
        color = (0.16 + 0.1 * detail + 0.06 * felt) * (1 - seam) + 0.97 * seam;
        height =
          0.54 + (1 - seam) * (0.065 * felt + 0.018 * detail) - 0.12 * seam;
        roughness -= 0.1 * seam;
        occlusion = 1 - 0.12 * seam;
        break;
      }
      case 'golfball': {
        const x = fract(u * 10 - golfOffsetU) - 0.5,
          y = fract(v * 10 - golfOffsetV) - 0.5;
        // Squared radius is smooth at the center; the compact bowl meets flat
        // land with zero rim slope, before a cell can change ownership.
        const bowl = Math.pow(clamp(1 - (x * x + y * y) / (0.41 * 0.41)), 2);
        color = 0.96 - 0.12 * bowl;
        height = 0.8 - 0.6 * bowl;
        roughness += 0.04 * bowl;
        occlusion = 1 - 0.2 * bowl;
        break;
      }
      case 'boardformedconcrete': {
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
        break;
      }
      case 'ribbedconcrete': {
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
        break;
      }
      case 'splitfaceblock': {
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
        break;
      }
      case 'chainmail': {
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
        break;
      }
      case 'rivetedmetal': {
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
          0.28 + face * (0.19 + 0.09 * variation) + 0.13 * rivet + 0.03 * grain;
        height =
          0.09 +
          face * (0.23 + 0.025 * variation) +
          0.57 * rivet +
          0.004 * grain;
        roughness += 0.1 * (1 - face) - 0.09 * rivet + 0.025 * grain;
        occlusion = 0.64 + 0.34 * face + 0.02 * rivet;
        break;
      }
      case 'weldedmetal': {
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
        break;
      }
    }
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
  controls: { contrast?: number; roughnessBias?: number } = {},
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
        const color =
          preset.dark[c] + (preset.light[c] - preset.dark[c]) * surface.color;
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
  return maps;
}
