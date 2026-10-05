import { proceduralMaterialPresets } from '../../../src/data/materials.js';
import type { ProceduralMaterialKind } from './procedural-material.js';

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
}

/** Internal CPU field sampler; coordinates are periodic in both directions. */
export function createSurfaceSampler(
  kind: ProceduralMaterialKind,
  seed: number,
) {
  const preset = proceduralMaterialPresets[kind];
  const phase = hash(0, 0, seed) * TAU;
  const needsBroad = kind === 'stone' || kind === 'metal' || kind === 'marble';
  const needsFine = kind === 'brick' || kind === 'stone';
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
      mortar = 0;
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
    }
    out.color = color;
    out.height = height * preset.relief;
    out.roughness = clamp(roughness);
    out.occlusion = occlusion;
    out.mortar = mortar;
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
      const inv = 1 / Math.hypot(dx, dy, 1);
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
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      sample((x + 0.5) / size, (y + 0.5) / size, surface);
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
      maps.metallicRoughness[p + 1] = byte(surface.roughness);
      maps.metallicRoughness[p + 2] = kind === 'metal' ? 255 : 0;
      maps.metallicRoughness[p + 3] = 255;
    }
  writeNormals(heights, size, maps.normal);
  return maps;
}
