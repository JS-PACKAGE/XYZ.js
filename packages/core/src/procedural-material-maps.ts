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
    kind === 'rubber';
  return (u: number, v: number, out: SurfaceSample): void => {
    u = fract(u);
    v = fract(v);
    const broad = needsBroad ? noise(u, v, 4, 4, seed) : 0;
    const detail = noise(u, v, 32, 32, seed ^ 0xa3c59ac3);
    const fine = needsFine ? noise(u, v, 64, 64, seed ^ 0x7f4a7c15) : 0;
    let color = broad,
      height = broad,
      roughness = preset.roughness,
      occlusion = 1,
      mortar = 0,
      metallic = kind === 'metal' || kind === 'diamondplate' ? 1 : 0;
    switch (kind) {
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
