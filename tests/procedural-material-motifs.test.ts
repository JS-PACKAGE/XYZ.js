import { describe, expect, it } from 'vitest';
import { proceduralMaterialPresets } from '../src/data/materials.js';
import {
  createSurfaceSampler,
  type SurfaceSample,
} from '../packages/core/src/procedural-material-maps.js';

const seeds = [0, 7, 0xffffffff] as const;
const empty = (): SurfaceSample => ({
  color: 0,
  height: 0,
  roughness: 0,
  occlusion: 0,
  mortar: 0,
  metallic: 0,
});

describe('mudcloth: painted motif bands on a dark plain weave', () => {
  const p = proceduralMaterialPresets.mudcloth;
  // Painted strokes are cream (>.5); the dyed ground and its weave shading stay below.
  const painted = (s: SurfaceSample): boolean => s.color > 0.5;

  it.each(seeds)(
    'keeps opaque non-metal channels in range for seed %i',
    (seed) => {
      const sample = createSurfaceSampler('mudcloth', seed),
        out = empty();
      for (let y = 0; y < 256; y++)
        for (let x = 0; x < 256; x++) {
          sample((x + 0.5) / 256, (y + 0.5) / 256, out);
          expect(out.mortar).toBe(0);
          expect(out.metallic).toBe(0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            if (!(value >= 0 && value <= 1))
              throw new Error(`mudcloth channel ${value} out of range`);
        }
    },
  );

  it.each(seeds)(
    'paints zigzag, dot, diamond and ladder bands with distinct stroke counts (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mudcloth', seed),
        out = empty(),
        n = 4096,
        // Per band unit: zigzag crosses the centerline twice, two dots, a diamond with
        // two tips and a center dot, and a ladder with four rungs.
        perBand = [2, 2, 3, 4];
      for (let row = 0; row < p.bands; row++) {
        const hits: boolean[] = [];
        for (let i = 0; i < n; i++) {
          sample(i / n, (row + 0.5) / p.bands, out);
          hits.push(painted(out));
        }
        let runs = 0;
        for (let i = 0; i < n; i++)
          if (hits[i] && !hits[(i + n - 1) % n]) runs++;
        expect(runs).toBe(perBand[row & 3] * p.bands);
      }
    },
  );

  it('draws a continuous separator line on every band boundary', () => {
    const sample = createSurfaceSampler('mudcloth', 7),
      out = empty();
    for (let row = 0; row < p.bands; row++) {
      let covered = 0;
      const n = 512;
      // The hand-painted wobble moves the line by < wobble band units, so probe within it.
      for (let i = 0; i < n; i++) {
        let hit = false;
        for (const dy of [-0.5, 0, 0.5]) {
          sample(i / n, (row + dy * p.wobble) / p.bands, out);
          hit ||= painted(out);
        }
        covered += Number(hit);
      }
      expect(covered).toBe(n);
    }
  });

  it('alternates warp-over and weft-over every thread on unpainted ground', () => {
    const sample = createSurfaceSampler('mudcloth', 7),
      base = empty(),
      even = empty(),
      odd = empty();
    let evenDelta = 0,
      oddDelta = 0,
      count = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const u = ((x + 0.5) / 256) * 0.5,
          v = (y + 0.5) / 256;
        sample(u, v, base);
        sample(u + 2 / p.threads, v, even);
        sample(u + 1 / p.threads, v, odd);
        if (painted(base) || painted(even) || painted(odd)) continue;
        evenDelta += Math.abs(even.height - base.height);
        oddDelta += Math.abs(odd.height - base.height);
        count++;
      }
    expect(count).toBeGreaterThan(10_000);
    // Two threads is the weave period; one thread flips over/under.
    expect(evenDelta).toBeLessThan(oddDelta * 0.3);
  });

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mudcloth', 0),
      b = createSurfaceSampler('mudcloth', 7),
      one = empty(),
      two = empty();
    let different = 0;
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.2501],
        [0.2501, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        expect(two.height).toBeCloseTo(one.height, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(100);
  });
});

describe('turingpattern: analytic labyrinth-to-spot coat pattern', () => {
  const p = proceduralMaterialPresets.turingpattern;
  const n = 128;
  const read = (
    seed: number,
  ): { color: Float64Array; height: Float64Array } => {
    const sample = createSurfaceSampler('turingpattern', seed),
      out = empty(),
      color = new Float64Array(n * n),
      height = new Float64Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        sample((x + 0.5) / n, (y + 0.5) / n, out);
        expect(out.metallic).toBe(0);
        expect(out.mortar).toBe(0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          if (!(value >= 0 && value <= 1))
            throw new Error(`turingpattern channel ${value} out of range`);
        color[y * n + x] = out.color;
        height[y * n + x] = out.height / p.relief;
      }
    return { color, height };
  };
  /** Fraction of non-DC power whose radial frequency lies in [low, high] cycles per tile. */
  const bandPower = (
    field: Float64Array,
    low: number,
    high: number,
  ): number => {
    const mean = field.reduce((a, b) => a + b, 0) / field.length,
      cos = new Float64Array(n * n),
      sin = new Float64Array(n * n),
      re = new Float64Array(n * n),
      im = new Float64Array(n * n);
    for (let k = 0; k < n; k++)
      for (let i = 0; i < n; i++) {
        cos[k * n + i] = Math.cos((-2 * Math.PI * k * i) / n);
        sin[k * n + i] = Math.sin((-2 * Math.PI * k * i) / n);
      }
    for (let y = 0; y < n; y++)
      for (let kx = 0; kx < n; kx++) {
        let a = 0,
          b = 0;
        for (let x = 0; x < n; x++) {
          const value = field[y * n + x] - mean;
          a += value * cos[kx * n + x];
          b += value * sin[kx * n + x];
        }
        re[y * n + kx] = a;
        im[y * n + kx] = b;
      }
    let total = 0,
      band = 0;
    for (let kx = 0; kx < n; kx++)
      for (let ky = 0; ky < n; ky++) {
        let a = 0,
          b = 0;
        for (let y = 0; y < n; y++) {
          a +=
            re[y * n + kx] * cos[ky * n + y] - im[y * n + kx] * sin[ky * n + y];
          b +=
            re[y * n + kx] * sin[ky * n + y] + im[y * n + kx] * cos[ky * n + y];
        }
        const power = a * a + b * b,
          radius = Math.hypot(
            kx > n / 2 ? kx - n : kx,
            ky > n / 2 ? ky - n : ky,
          );
        total += power;
        if (radius >= low && radius <= high) band += power;
      }
    return band / total;
  };

  it.each(seeds)(
    'concentrates power at the Turing wavelength and mixes spots with labyrinths (seed %i)',
    (seed) => {
      const { color, height } = read(seed),
        dark = Array.from(color, (value) => value < 0.5);
      // The three integer wave vectors have |k| 12.5..13.0 cycles per tile; white noise
      // would put only about 5% of its power in the [9, 18] annulus.
      expect(bandPower(color, 9, 18)).toBeGreaterThan(0.3);
      const coverage = dark.filter(Boolean).length / dark.length;
      expect(coverage).toBeGreaterThan(0.15);
      expect(coverage).toBeLessThan(0.5);
      // The slowly varying threshold changes the local dark fraction between regimes.
      const blocks: number[] = [],
        size = n / 8;
      for (let by = 0; by < 8; by++)
        for (let bx = 0; bx < 8; bx++) {
          let count = 0;
          for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++)
              count += Number(dark[(by * size + y) * n + bx * size + x]);
          blocks.push(count / (size * size));
        }
      expect(Math.max(...blocks) - Math.min(...blocks)).toBeGreaterThan(0.25);
      // Pigmented regions are raised above the pale ground.
      let raised = 0,
        raisedCount = 0,
        ground = 0,
        groundCount = 0;
      for (let i = 0; i < dark.length; i++)
        if (dark[i]) {
          raised += height[i];
          raisedCount++;
        } else {
          ground += height[i];
          groundCount++;
        }
      expect(raised / raisedCount - ground / groundCount).toBeGreaterThan(0.25);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('turingpattern', 0),
      b = createSurfaceSampler('turingpattern', 7),
      one = empty(),
      two = empty();
    let different = 0;
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        expect(two.height).toBeCloseTo(one.height, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(100);
  });
});
