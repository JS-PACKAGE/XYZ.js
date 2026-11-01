import { describe, expect, it } from 'vitest';
import { proceduralMaterialPresets } from '../src/data/materials.js';
import {
  createSurfaceSampler,
  generateProceduralMaps,
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

describe('bayerdither: ordered-dither pixel tile mosaic', () => {
  const p = proceduralMaterialPresets.bayerdither;
  const n = p.blocks;
  // Independent bit-interleaved Bayer rank (the sampler builds its matrix recursively).
  const rank = (x: number, y: number): number => {
    let r = 0;
    for (let i = 0; i < 3; i++)
      r += ((((x >> i) ^ (y >> i)) & 1) * 2 + ((y >> i) & 1)) * 4 ** i;
    return r;
  };
  const readBlocks = (seed: number): Uint8Array => {
    const sample = createSurfaceSampler('bayerdither', seed),
      out = empty(),
      on = new Uint8Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        sample((x + 0.5 - p.phase) / n, (y + 0.5 - p.phase) / n, out);
        on[y * n + x] = Number(out.color > 0.5);
      }
    return on;
  };

  it.each(seeds)(
    'keeps opaque non-metal channels in range for seed %i',
    (seed) => {
      const sample = createSurfaceSampler('bayerdither', seed),
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
              throw new Error(`bayerdither channel ${value} out of range`);
        }
    },
  );

  it.each(seeds)(
    'follows Bayer threshold order and forms checkerboards at mid level (seed %i)',
    (seed) => {
      const on = readBlocks(seed),
        density = on.reduce((a, b) => a + b, 0) / on.length;
      expect(density).toBeGreaterThan(0.25);
      expect(density).toBeLessThan(0.75);
      // Where two adjacent blocks differ, the lit one should hold the lower threshold rank.
      let differing = 0,
        ordered = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ]) {
            const x2 = (x + dx) % n,
              y2 = (y + dy) % n,
              a = on[y * n + x],
              b = on[y2 * n + x2];
            if (a === b) continue;
            differing++;
            ordered += Number(
              (a === 1) === rank(x & 7, y & 7) < rank(x2 & 7, y2 & 7),
            );
          }
      expect(differing).toBeGreaterThan(1000);
      // Random states would agree about half the time.
      expect(ordered / differing).toBeGreaterThan(0.7);
      // Near 50% level every Bayer tile degenerates to a checkerboard; independent random
      // blocks of that density would average about 28 lit orthogonal neighbor pairs.
      const pairs: number[] = [];
      for (let ty = 0; ty < n / 8; ty++)
        for (let tx = 0; tx < n / 8; tx++) {
          let lit = 0,
            touching = 0;
          for (let y = 0; y < 8; y++)
            for (let x = 0; x < 8; x++) {
              const a = on[(ty * 8 + y) * n + tx * 8 + x];
              lit += a;
              if (x < 7 && a && on[(ty * 8 + y) * n + tx * 8 + x + 1])
                touching++;
              if (y < 7 && a && on[(ty * 8 + y + 1) * n + tx * 8 + x])
                touching++;
            }
          if (lit >= 26 && lit <= 38) pairs.push(touching);
        }
      expect(pairs.length).toBeGreaterThanOrEqual(8);
      expect(pairs.reduce((a, b) => a + b, 0) / pairs.length).toBeLessThan(14);
    },
  );

  it('keeps each block flat in its interior and cuts a dark groove between blocks', () => {
    const sample = createSurfaceSampler('bayerdither', 7),
      center = empty(),
      probe = empty(),
      groove = empty();
    for (let by = 0; by < n; by += 5)
      for (let bx = 0; bx < n; bx += 3) {
        sample((bx + 0.5 - p.phase) / n, (by + 0.5 - p.phase) / n, center);
        for (const [fx, fy] of [
          [0.35, 0.35],
          [0.65, 0.4],
          [0.4, 0.65],
        ]) {
          sample((bx + fx - p.phase) / n, (by + fy - p.phase) / n, probe);
          expect(probe.color).toBeCloseTo(center.color, 10);
          expect(probe.height).toBeCloseTo(center.height, 10);
        }
        sample((bx + 0.01 - p.phase) / n, (by + 0.5 - p.phase) / n, groove);
        expect(groove.color).toBeLessThan(0.1);
        expect(groove.height).toBeLessThan(center.height);
      }
  });

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bayerdither', 0),
      b = createSurfaceSampler('bayerdither', 7),
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
    expect(different).toBeGreaterThan(50);
  });
});

describe('patchworkquilt: sewn patches with puffed padding and running stitches', () => {
  const p = proceduralMaterialPresets.patchworkquilt;
  const n = p.patches;
  const heightAt = (
    sample: ReturnType<typeof createSurfaceSampler>,
    px: number,
    py: number,
    x: number,
    y: number,
  ): number => {
    const out = empty();
    sample((px + x) / n, (py + y) / n, out);
    return out.height / p.relief;
  };

  it.each(seeds)(
    'keeps opaque non-metal channels in range for seed %i',
    (seed) => {
      const sample = createSurfaceSampler('patchworkquilt', seed),
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
              throw new Error(`patchworkquilt channel ${value} out of range`);
        }
    },
  );

  it.each(seeds)(
    'sews a groove on every patch border and puffs each patch (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('patchworkquilt', seed);
      let grooved = 0,
        total = 0,
        centers = 0,
        borders = 0;
      for (let k = 0; k < n; k++)
        for (let i = 0; i < 256; i++) {
          const t = (i + 0.5) / 256;
          // Horizontal border k/n, probed 0.04 of a patch inside (clear of stitching).
          grooved += Number(
            heightAt(sample, 0, k, t * n, 0) <
              heightAt(sample, 0, k, t * n, 0.04) - 0.05,
          );
          total++;
        }
      for (let py = 0; py < n; py++)
        for (let px = 0; px < n; px++) {
          centers += heightAt(sample, px, py, 0.5, 0.5);
          borders += heightAt(sample, px, py, 0.02, 0.5);
        }
      expect(grooved / total).toBeGreaterThan(0.9);
      expect((centers - borders) / (n * n)).toBeGreaterThan(0.3);
    },
  );

  it.each(seeds)(
    'dashes the outline stitch at the authored inset with the authored duty (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('patchworkquilt', seed),
        samples = 800;
      for (let py = 0; py < n; py++)
        for (let px = 0; px < n; px++) {
          const dips: boolean[] = [];
          for (let i = 0; i < samples; i++) {
            const f = 0.1 + (0.8 * i) / samples,
              // A stitch lowers its own height below both flanks.
              flank =
                (heightAt(sample, px, py, f, p.stitchInset - 0.025) +
                  heightAt(sample, px, py, f, p.stitchInset + 0.025)) /
                2;
            dips.push(
              flank - heightAt(sample, px, py, f, p.stitchInset) > 0.08,
            );
          }
          const lit = dips.filter(Boolean).length / samples;
          let runs = 0;
          for (let i = 0; i < samples; i++) if (dips[i] && !dips[i - 1]) runs++;
          // 0.8 of a side spans 4.8 dash periods.
          expect(lit).toBeGreaterThan(p.stitchDuty - 0.12);
          expect(lit).toBeLessThan(p.stitchDuty + 0.08);
          expect(runs).toBeGreaterThanOrEqual(5);
          expect(runs).toBeLessThanOrEqual(7);
          // The lowest point of the cross-section sits at the inset (the dome slope
          // shifts it slightly toward the border).
          const dash = dips.indexOf(true, 20),
            f = 0.1 + (0.8 * (dash + 8)) / samples;
          let best = 0,
            low = Infinity;
          for (let k = 0; k <= 200; k++) {
            const e = 0.04 + (0.06 * k) / 200,
              h = heightAt(sample, px, py, f, e);
            if (h < low) {
              low = h;
              best = e;
            }
          }
          expect(Math.abs(best - p.stitchInset)).toBeLessThan(0.012);
        }
    },
  );

  it.each(seeds)(
    'mixes distinct fabric tones across patches (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('patchworkquilt', seed),
        out = empty(),
        means: number[] = [];
      for (let py = 0; py < n; py++)
        for (let px = 0; px < n; px++) {
          let sum = 0;
          for (let y = 0; y < 8; y++)
            for (let x = 0; x < 8; x++) {
              sample((px + 0.1 + x * 0.1) / n, (py + 0.1 + y * 0.1) / n, out);
              sum += out.color;
            }
          means.push(sum / 64);
        }
      const mean = means.reduce((a, b) => a + b, 0) / means.length,
        spread = Math.sqrt(
          means.reduce((a, b) => a + (b - mean) ** 2, 0) / means.length,
        );
      expect(spread).toBeGreaterThan(0.08);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('patchworkquilt', 0),
      b = createSurfaceSampler('patchworkquilt', 7),
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

describe('amberresin: polished resin with flow bands, bubbles and spangle cracks', () => {
  const p = proceduralMaterialPresets.amberresin;
  const size = 768;
  const sweep = (
    seed: number,
  ): {
    sample: ReturnType<typeof createSurfaceSampler>;
    maps: SurfaceSample[];
  } => {
    const sample = createSurfaceSampler('amberresin', seed),
      maps: SurfaceSample[] = [];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const out = empty();
        sample((x + 0.5) / size, (y + 0.5) / size, out);
        maps.push(out);
      }
    return { sample, maps };
  };

  it.each(seeds)(
    'keeps opaque non-metal channels in range for seed %i',
    (seed) => {
      for (const out of sweep(seed).maps) {
        expect(out.mortar).toBe(0);
        expect(out.metallic).toBe(0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          if (!(value >= 0 && value <= 1))
            throw new Error(`amberresin channel ${value} out of range`);
      }
    },
  );

  it.each(seeds)(
    'places at most one ring-shaped bubble inside each grid cell, within the authored radii (seed %i)',
    (seed) => {
      const { maps } = sweep(seed),
        rim = maps.map((m) => m.occlusion < 0.95),
        seen = new Uint8Array(rim.length),
        cell = size / p.cells,
        perCell = new Map<string, number>();
      let rings = 0;
      for (let first = 0; first < rim.length; first++) {
        if (!rim[first] || seen[first]) continue;
        const queue = [first];
        seen[first] = 1;
        let minX = size,
          maxX = -1,
          minY = size,
          maxY = -1,
          area = 0;
        for (let read = 0; read < queue.length; read++) {
          const i = queue[read],
            x = i % size,
            y = Math.floor(i / size);
          area++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const j =
              ((y + dy + size) % size) * size + ((x + dx + size) % size);
            if (rim[j] && !seen[j]) {
              seen[j] = 1;
              queue.push(j);
            }
          }
        }
        if (area <= 20) continue;
        rings++;
        const width = (maxX - minX + 1) / size,
          height = (maxY - minY + 1) / size;
        // A circular rim has equal extents and a diameter between the authored limits.
        expect(Math.abs(width - height)).toBeLessThan(0.01);
        expect(width).toBeGreaterThan(2 * p.bubbleMin - 0.005);
        expect(width).toBeLessThan(2 * (p.bubbleMax + p.rimWidth) + 0.01);
        // The whole ring sits inside one grid cell.
        const cellX = Math.floor(minX / cell),
          cellY = Math.floor(minY / cell);
        expect(Math.floor(maxX / cell)).toBe(cellX);
        expect(Math.floor(maxY / cell)).toBe(cellY);
        perCell.set(
          `${cellX},${cellY}`,
          (perCell.get(`${cellX},${cellY}`) ?? 0) + 1,
        );
        // The enclosed gas is lighter than its own rim.
        const centre =
            maps[
              Math.floor((minY + maxY) / 2) * size +
                Math.floor((minX + maxX) / 2)
            ],
          ring = maps[queue[0]];
        expect(centre.occlusion).toBe(1);
        expect(centre.color).toBeGreaterThan(ring.color + 0.1);
      }
      expect(rings).toBeGreaterThanOrEqual(8);
      expect(rings).toBeLessThanOrEqual(p.cells * p.cells);
      expect(Math.max(...perCell.values())).toBe(1);
    },
  );

  it.each(seeds)(
    'bands the flow along v more finely than along u and cuts spangle cracks (seed %i)',
    (seed) => {
      const { sample, maps } = sweep(seed),
        a = empty(),
        b = empty(),
        lag = 1 / 56;
      let acrossU = 0,
        acrossV = 0;
      for (let y = 0; y < 256; y++)
        for (let x = 0; x < 256; x++) {
          const u = (x + 0.5) / 256,
            v = (y + 0.5) / 256;
          sample(u, v, a);
          const base = a.color,
            baseAO = a.occlusion;
          sample(u + lag, v, b);
          if (baseAO === 1 && b.occlusion === 1)
            acrossU += Math.abs(base - b.color);
          sample(u, v + lag, b);
          if (baseAO === 1 && b.occlusion === 1)
            acrossV += Math.abs(base - b.color);
        }
      // The flow field has 28 rows but only 4 columns per tile.
      expect(acrossV / acrossU).toBeGreaterThan(1.8);
      const cracked =
        maps.filter((m) => m.height / p.relief < 0.3).length / maps.length;
      expect(cracked).toBeGreaterThan(0.005);
      expect(cracked).toBeLessThan(0.06);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('amberresin', 0),
      b = createSurfaceSampler('amberresin', 7),
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

describe('ammonitestone: logarithmic-spiral fossils in limestone', () => {
  const p = proceduralMaterialPresets.ammonitestone;
  type Fossil = { x: number; y: number; radius: number };
  /** Finds each fossil disc as a connected component of raised pixels in its own cell. */
  const locate = (
    sample: ReturnType<typeof createSurfaceSampler>,
  ): Fossil[] => {
    const size = 512,
      out = empty(),
      cell = size / p.cells,
      found: Fossil[] = [];
    for (let row = 0; row < p.cells; row++)
      for (let col = 0; col < p.cells; col++) {
        let count = 0,
          sx = 0,
          sy = 0;
        for (let y = 0; y < cell; y++)
          for (let x = 0; x < cell; x++) {
            const px = col * cell + x,
              py = row * cell + y;
            sample((px + 0.5) / size, (py + 0.5) / size, out);
            // Matrix height stays below 0.27 relief units; the shell is at least 0.3.
            if (out.height / p.relief > 0.27) {
              count++;
              sx += (px + 0.5) / size;
              sy += (py + 0.5) / size;
            }
          }
        found.push({
          x: sx / count,
          y: sy / count,
          radius: Math.sqrt(count / Math.PI) / size,
        });
      }
    return found;
  };

  it.each(seeds)(
    'puts one disc fossil of the authored size in every cell (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ammonitestone', seed),
        out = empty();
      for (let i = 0; i < 20_000; i++) {
        sample((i * 0.6180339887) % 1, (i * 0.7548776662) % 1, out);
        expect(out.metallic).toBe(0);
        expect(out.mortar).toBe(0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          if (!(value >= 0 && value <= 1))
            throw new Error(`ammonitestone channel ${value} out of range`);
      }
      const fossils = locate(sample);
      expect(fossils.length).toBe(p.cells * p.cells);
      for (const [index, fossil] of fossils.entries()) {
        const col = index % p.cells,
          row = Math.floor(index / p.cells);
        expect(Math.floor(fossil.x * p.cells)).toBe(col);
        expect(Math.floor(fossil.y * p.cells)).toBe(row);
        expect(fossil.radius).toBeGreaterThan(
          (p.outerRadius * p.minScale * 0.9) / p.cells,
        );
        expect(fossil.radius).toBeLessThan((p.outerRadius * 1.02) / p.cells);
      }
    },
  );

  it.each(seeds)(
    'spaces the sutures geometrically by the growth ratio along any ray (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ammonitestone', seed),
        out = empty();
      for (const fossil of locate(sample))
        for (const angle of [0.3, 2.1, 4.4]) {
          const steps = 6000,
            reach = fossil.radius * 0.97,
            ao: number[] = [];
          for (let i = 0; i < steps; i++) {
            const r = (reach * (i + 0.5)) / steps;
            sample(
              fossil.x + r * Math.cos(angle),
              fossil.y + r * Math.sin(angle),
              out,
            );
            ao.push(out.occlusion);
          }
          // Suture = local occlusion minimum deep inside the shell tone range.
          const radii: number[] = [];
          for (let i = 2; i < steps - 2; i++)
            if (
              ao[i] < 0.7 &&
              ao[i] <= ao[i - 1] &&
              ao[i] < ao[i + 1] &&
              ao[i] <= ao[i - 2] &&
              ao[i] < ao[i + 2]
            )
              radii.push((reach * (i + 0.5)) / steps);
          // Skip the innermost, centroid-error-sensitive suture.
          const outer = radii.filter((r) => r > 0.03);
          expect(outer.length).toBeGreaterThanOrEqual(2);
          for (let i = 1; i < outer.length; i++)
            expect(Math.abs(outer[i] / outer[i - 1] - p.growth)).toBeLessThan(
              0.2,
            );
        }
    },
  );

  it.each(seeds)(
    'carries the authored rib count around each whorl (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ammonitestone', seed),
        out = empty(),
        steps = 2048,
        window = steps / p.ribs;
      for (const fossil of locate(sample)) {
        const radius = fossil.radius * 0.6,
          color: number[] = [];
        for (let i = 0; i < steps; i++) {
          const a = (2 * Math.PI * i) / steps;
          sample(
            fossil.x + radius * Math.cos(a),
            fossil.y + radius * Math.sin(a),
            out,
          );
          color.push(out.color);
        }
        // One rib period of moving average removes the ribs and keeps the slow whorl trend.
        const residual = color.map((value, i) => {
          let sum = 0;
          for (let k = 0; k < window; k++)
            sum += color[(i + k - Math.floor(window / 2) + steps) % steps];
          return value - sum / window;
        });
        let crossings = 0;
        for (let i = 0; i < steps; i++)
          if (residual[i] > 0 && residual[(i + steps - 1) % steps] <= 0)
            crossings++;
        expect(Math.abs(crossings - p.ribs)).toBeLessThanOrEqual(2);
      }
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('ammonitestone', 0),
      b = createSurfaceSampler('ammonitestone', 7),
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

describe('octopussuckers: staggered sucker rims and ridged cups', () => {
  const p = proceduralMaterialPresets.octopussuckers;
  const size = 512;
  type Ring = { u: number; v: number; radius: number };
  const wrapDelta = (a: number, b: number): number => {
    const d = a - b;
    return d - Math.round(d);
  };
  const sweep = (seed: number) => {
    const sample = createSurfaceSampler('octopussuckers', seed),
      out = empty(),
      raised = new Uint8Array(size * size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        sample((x + 0.5) / size, (y + 0.5) / size, out);
        expect(out.metallic).toBe(0);
        expect(out.mortar).toBe(0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          if (!(value >= 0 && value <= 1))
            throw new Error(`octopussuckers channel ${value} out of range`);
        // Only a rim crest reaches this height; skin and cups stay below.
        raised[y * size + x] = Number(
          out.height / p.relief > p.skinHeight + 0.7 * p.rimHeight,
        );
      }
    // Rim crests as wrap-aware components with circular-mean centers.
    const seen = new Uint8Array(raised.length),
      rings: Ring[] = [];
    for (let first = 0; first < raised.length; first++) {
      if (!raised[first] || seen[first]) continue;
      const queue = [first],
        pixels: number[] = [];
      seen[first] = 1;
      for (let read = 0; read < queue.length; read++) {
        const i = queue[read],
          x = i % size,
          y = Math.floor(i / size);
        pixels.push(i);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const j = ((y + dy + size) % size) * size + ((x + dx + size) % size);
          if (raised[j] && !seen[j]) {
            seen[j] = 1;
            queue.push(j);
          }
        }
      }
      let su = 0,
        cu = 0,
        sv = 0,
        cv = 0;
      for (const i of pixels) {
        const u = (2 * Math.PI * ((i % size) + 0.5)) / size,
          v = (2 * Math.PI * (Math.floor(i / size) + 0.5)) / size;
        su += Math.sin(u);
        cu += Math.cos(u);
        sv += Math.sin(v);
        cv += Math.cos(v);
      }
      const u = (Math.atan2(su, cu) / (2 * Math.PI) + 1) % 1,
        v = (Math.atan2(sv, cv) / (2 * Math.PI) + 1) % 1;
      let radius = 0;
      for (const i of pixels)
        radius += Math.hypot(
          wrapDelta(((i % size) + 0.5) / size, u),
          wrapDelta((Math.floor(i / size) + 0.5) / size, v),
        );
      rings.push({ u, v, radius: radius / pixels.length });
    }
    return { sample, rings };
  };

  it.each(seeds)(
    'lays one rim per sucker in staggered rows at the authored pitch (seed %i)',
    (seed) => {
      const { sample, rings } = sweep(seed),
        out = empty();
      expect(rings.length).toBe(p.columns * p.rows);
      const tolerance = p.jitter + 0.004;
      for (const ring of rings) {
        const row = Math.round(ring.v * p.rows - 0.5);
        expect(Math.abs(wrapDelta(ring.v, (row + 0.5) / p.rows))).toBeLessThan(
          tolerance,
        );
        // Odd rows are shifted by half a column pitch.
        const column = ring.u * p.columns - (row & 1) * 0.5;
        expect(
          Math.abs(wrapDelta(column, Math.round(column))) / p.columns,
        ).toBeLessThan(tolerance);
        // The crest radius lies between the inner foot and the rim edge.
        expect(ring.radius).toBeGreaterThan(p.rimInner * p.radius * 0.92);
        expect(ring.radius).toBeLessThan(p.radius);
        // The enclosed orifice is deep and dark.
        sample(ring.u, ring.v, out);
        expect(out.height / p.relief).toBeLessThan(p.skinHeight - 0.25);
        expect(out.color).toBeLessThan(p.skinTone - 0.3);
        expect(out.occlusion).toBeLessThan(1 - p.holeAO * 0.5);
      }
    },
  );

  it.each(seeds)(
    'carries the authored number of radial ridges inside each cup (seed %i)',
    (seed) => {
      const { sample, rings } = sweep(seed),
        out = empty(),
        steps = 1024;
      for (const ring of rings) {
        // Crest radius sits at (rimInner + 1) / 2 of the sucker radius.
        const radius = (ring.radius / ((p.rimInner + 1) / 2)) * 0.38,
          color: number[] = [];
        for (let i = 0; i < steps; i++) {
          const a = (2 * Math.PI * i) / steps;
          sample(
            ring.u + radius * Math.cos(a),
            ring.v + radius * Math.sin(a),
            out,
          );
          color.push(out.color);
        }
        // Dominant angular harmonic above the slow noise (k >= 6) must be the ridge count.
        let best = 0,
          bestPower = 0;
        for (let k = 6; k <= 30; k++) {
          let re = 0,
            im = 0;
          for (let i = 0; i < steps; i++) {
            re += color[i] * Math.cos((2 * Math.PI * k * i) / steps);
            im += color[i] * Math.sin((2 * Math.PI * k * i) / steps);
          }
          if (re * re + im * im > bestPower) {
            bestPower = re * re + im * im;
            best = k;
          }
        }
        expect(best).toBe(p.ridges);
      }
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('octopussuckers', 0),
      b = createSurfaceSampler('octopussuckers', 7),
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

describe('expandedpolystyrene: fused domed beads with junction voids', () => {
  const p = proceduralMaterialPresets.expandedpolystyrene;
  const size = 768;
  /** Wrap-aware 4-connected labeling; returns label per pixel (0 = background). */
  const label = (mask: Uint8Array): { labels: Int32Array; count: number } => {
    const labels = new Int32Array(mask.length);
    let count = 0;
    for (let first = 0; first < mask.length; first++) {
      if (!mask[first] || labels[first]) continue;
      count++;
      const queue = [first];
      labels[first] = count;
      for (let read = 0; read < queue.length; read++) {
        const i = queue[read],
          x = i % size,
          y = Math.floor(i / size);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const j = ((y + dy + size) % size) * size + ((x + dx + size) % size);
          if (mask[j] && !labels[j]) {
            labels[j] = count;
            queue.push(j);
          }
        }
      }
    }
    return { labels, count };
  };

  it.each(seeds)(
    'has exactly one bead per cell, separated by seams, with voids only at junctions (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('expandedpolystyrene', seed),
        out = empty(),
        bead = new Uint8Array(size * size),
        hole = new Uint8Array(size * size);
      let invalid = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          sample((x + 0.5) / size, (y + 0.5) / size, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          // Bead faces rise above the seam floor; voids are the darkest AO.
          bead[y * size + x] = Number(
            out.height / p.relief > p.seamHeight + 0.15,
          );
          hole[y * size + x] = Number(
            out.occlusion < (p.seamAO + p.voidAO) / 2,
          );
        }
      expect(invalid).toBe(0);
      const beads = label(bead),
        voids = label(hole),
        cells = p.cells * p.cells;
      // One connected bead per Voronoi cell: seams always close each cell.
      expect(beads.count).toBe(cells);
      // A planar periodic Voronoi diagram has 2 vertices per cell; narrow junctions fade out.
      expect(voids.count).toBeGreaterThan(cells);
      expect(voids.count).toBeLessThanOrEqual(2 * cells);
      // Every void sits where at least three different beads meet.
      const touching: Set<number>[] = Array.from(
        { length: voids.count + 1 },
        () => new Set<number>(),
      );
      const reach = 8;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const id = voids.labels[y * size + x];
          if (!id) continue;
          for (const [dx, dy] of [
            [reach, 0],
            [-reach, 0],
            [0, reach],
            [0, -reach],
            [reach, reach],
            [-reach, -reach],
            [reach, -reach],
            [-reach, reach],
          ]) {
            const bead =
              beads.labels[
                ((y + dy + size) % size) * size + ((x + dx + size) % size)
              ];
            if (bead) touching[id].add(bead);
          }
        }
      let junctions = 0;
      for (let id = 1; id <= voids.count; id++)
        junctions += Number(touching[id].size >= 3);
      expect(junctions / voids.count).toBeGreaterThan(0.95);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('expandedpolystyrene', 0),
      b = createSurfaceSampler('expandedpolystyrene', 7),
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

describe('asphaltshingle: staggered three-tab courses', () => {
  const p = proceduralMaterialPresets.asphaltshingle;
  /** Slot centers (in tab units) along a horizontal line inside one course. */
  const slotsAt = (
    sample: ReturnType<typeof createSurfaceSampler>,
    v: number,
  ): { centers: number[]; widths: number[] } => {
    const out = empty(),
      n = 6144,
      dark: boolean[] = [];
    for (let i = 0; i < n; i++) {
      sample((i + 0.5) / n, v, out);
      // Slot floor is the darkest tone; granules and shadow stay far above it.
      dark.push(out.color < 0.12);
    }
    const start = dark.findIndex((d, i) => d && !dark[(i + n - 1) % n]),
      centers: number[] = [],
      widths: number[] = [];
    let run = 0;
    for (let k = 0; k < n; k++) {
      const i = (start + k) % n;
      if (dark[i]) run++;
      else if (run > 0) {
        centers.push(((((start + k - run / 2) % n) + n) % n) / n);
        widths.push(run / n);
        run = 0;
      }
    }
    if (run > 0) {
      centers.push(((((start + n - run / 2) % n) + n) % n) / n);
      widths.push(run / n);
    }
    return { centers, widths };
  };

  it.each(seeds)(
    'cuts one slot per tab at half-tab course offsets, only in the lower part (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('asphaltshingle', seed),
        out = empty(),
        pitch = 1 / p.tabs;
      for (let course = 0; course < p.courses; course++) {
        const { centers, widths } = slotsAt(sample, (course + 0.8) / p.courses);
        expect(centers.length).toBe(p.tabs);
        for (const width of widths)
          expect(Math.abs(width - 2 * p.slotHalf)).toBeLessThan(0.004);
        const sorted = [...centers].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++)
          expect(Math.abs(sorted[i] - sorted[i - 1] - pitch)).toBeLessThan(
            0.002,
          );
        // Offset relative to the tab pitch is a whole number of half tabs.
        const half = (sorted[0] * p.tabs * 2) % 1;
        expect(Math.min(half, 1 - half)).toBeLessThan(0.05);
        // The upper part of the course (covered by the course above) has no slot.
        for (let i = 0; i < 512; i++) {
          sample(i / 512, (course + 0.2) / p.courses, out);
          expect(out.color).toBeGreaterThan(0.12);
        }
      }
    },
  );

  it.each(seeds)(
    'steps down at each course edge, shadows the overlap and varies tab tone (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('asphaltshingle', seed),
        above = empty(),
        below = empty(),
        mid = empty(),
        tones: number[] = [];
      let steps = 0,
        shadows = 0,
        count = 0;
      for (let course = 0; course < p.courses; course++)
        for (let tab = 0; tab < p.tabs; tab++) {
          // Middle of a tab: halfway between two neighboring slots of this course.
          const slots = slotsAt(
              sample,
              (course + 0.8) / p.courses,
            ).centers.sort((x, y) => x - y),
            u = slots[0] + (tab + 0.5) / p.tabs;
          sample(u, (course + 0.97) / p.courses, above);
          sample(u, (course + 1.03) / p.courses, below);
          sample(u, (course + 0.6) / p.courses, mid);
          steps += Number(above.height - below.height > 0.15 * p.relief);
          shadows += Number(mid.occlusion - below.occlusion > 0.25);
          tones.push(mid.color);
          count++;
        }
      expect(steps / count).toBeGreaterThan(0.95);
      expect(shadows / count).toBeGreaterThan(0.95);
      const mean = tones.reduce((a, b) => a + b, 0) / tones.length,
        spread = Math.sqrt(
          tones.reduce((a, b) => a + (b - mean) ** 2, 0) / tones.length,
        );
      expect(spread).toBeGreaterThan(0.03);
    },
  );

  it.each(seeds)(
    'keeps opaque non-metal channels in range for seed %i',
    (seed) => {
      const sample = createSurfaceSampler('asphaltshingle', seed),
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
              throw new Error(`asphaltshingle channel ${value} out of range`);
        }
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('asphaltshingle', 0),
      b = createSurfaceSampler('asphaltshingle', 7),
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

describe('lawnstripes: mown stripes with alternating blade lean', () => {
  const p = proceduralMaterialPresets.lawnstripes;
  const size = 512;
  const read = (seed: number): Float64Array => {
    const sample = createSurfaceSampler('lawnstripes', seed),
      out = empty(),
      color = new Float64Array(size * size);
    let invalid = 0;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        sample((x + 0.5) / size, (y + 0.5) / size, out);
        invalid += Number(out.metallic !== 0 || out.mortar !== 0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
        color[y * size + x] = out.color;
      }
    expect(invalid).toBe(0);
    return color;
  };

  it.each(seeds)(
    'alternates tone and blade lean stripe by stripe (seed %i)',
    (seed) => {
      const color = read(seed),
        band = size / p.stripes,
        // Stay clear of the wobbling stripe borders.
        margin = Math.ceil(band * 0.2);
      const means: number[] = [];
      for (let b = 0; b < p.stripes; b++) {
        let sum = 0,
          count = 0,
          covariance = 0;
        for (let y = b * band + margin; y < (b + 1) * band - margin; y++)
          for (let x = 0; x < size; x++) {
            sum += color[y * size + x];
            count++;
            // Central-difference gradient; the strand lean makes gx and gy correlate.
            const gx =
                color[y * size + ((x + 1) % size)] -
                color[y * size + ((x + size - 1) % size)],
              gy = color[(y + 1) * size + x] - color[(y - 1) * size + x];
            covariance += gx * gy;
          }
        means.push(sum / count);
        // Even stripes lean along +lean (gradient along (1, +lean)), odd stripes the other way.
        expect(Math.sign(covariance)).toBe(b % 2 === 0 ? 1 : -1);
      }
      for (let b = 1; b < p.stripes; b++)
        expect(Math.abs(means[b] - means[b - 1])).toBeGreaterThan(p.stripeTone);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('lawnstripes', 0),
      b = createSurfaceSampler('lawnstripes', 7),
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

describe('atomicboomerang: laminate print of V boomerangs and stars', () => {
  const p = proceduralMaterialPresets.atomicboomerang;
  const size = 768;
  type Shape = { cell: number; ratio: number; angle: number; light: boolean };
  const analyze = (seed: number): { shapes: Shape[]; speckle: number } => {
    const sample = createSurfaceSampler('atomicboomerang', seed),
      out = empty(),
      kind = new Uint8Array(size * size);
    let invalid = 0,
      speckles = 0;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        sample((x + 0.5) / size, (y + 0.5) / size, out);
        invalid += Number(out.metallic !== 0 || out.mortar !== 0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
        // Printed shapes are far from the base tone; speckle only dips to about 0.34.
        kind[y * size + x] = out.color > 0.75 ? 1 : out.color < 0.27 ? 2 : 0;
        speckles += Number(out.color < p.baseTone - 0.1 && out.color >= 0.27);
      }
    expect(invalid).toBe(0);
    const seen = new Uint8Array(kind.length),
      shapes: Shape[] = [],
      cell = size / p.cells;
    for (let first = 0; first < kind.length; first++) {
      if (!kind[first] || seen[first]) continue;
      const value = kind[first],
        queue = [first];
      seen[first] = 1;
      for (let read = 0; read < queue.length; read++) {
        const i = queue[read],
          x = i % size,
          y = Math.floor(i / size);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const j = ((y + dy + size) % size) * size + ((x + dx + size) % size);
          if (kind[j] === value && !seen[j]) {
            seen[j] = 1;
            queue.push(j);
          }
        }
      }
      if (queue.length < 20) continue;
      // Shapes never cross a tile edge, so plain coordinates suffice for their moments.
      let mx = 0,
        my = 0;
      for (const i of queue) {
        mx += i % size;
        my += Math.floor(i / size);
      }
      mx /= queue.length;
      my /= queue.length;
      let sxx = 0,
        syy = 0,
        sxy = 0,
        minX = size,
        maxX = 0,
        minY = size,
        maxY = 0;
      for (const i of queue) {
        const x = i % size,
          y = Math.floor(i / size);
        sxx += (x - mx) ** 2;
        syy += (y - my) ** 2;
        sxy += (x - mx) * (y - my);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      const tr = sxx + syy,
        det = sxx * syy - sxy * sxy,
        root = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
      // Every shape sits inside a single cell.
      // Pixel centers decide which cell owns a pixel.
      expect(Math.floor((minX + 0.5) / cell)).toBe(
        Math.floor((maxX + 0.5) / cell),
      );
      expect(Math.floor((minY + 0.5) / cell)).toBe(
        Math.floor((maxY + 0.5) / cell),
      );
      shapes.push({
        cell:
          Math.floor((minY + 0.5) / cell) * p.cells +
          Math.floor((minX + 0.5) / cell),
        ratio: (tr / 2 + root) / Math.max(1e-9, tr / 2 - root),
        angle: 0.5 * Math.atan2(2 * sxy, sxx - syy),
        light: value === 1,
      });
    }
    return { shapes, speckle: speckles / kind.length };
  };

  it.each(seeds)(
    'prints one shape per cell: elongated V boomerangs at random angles and round-symmetric stars (seed %i)',
    (seed) => {
      const { shapes, speckle } = analyze(seed),
        cells = new Set(shapes.map((s) => s.cell));
      // At most one printed shape per cell.
      expect(cells.size).toBe(shapes.length);
      // Four-fold symmetric stars have an isotropic second moment; V boomerangs do not.
      const boomerangs = shapes.filter((s) => s.ratio > 1.5),
        stars = shapes.filter((s) => s.ratio <= 1.5);
      expect(boomerangs.length).toBeGreaterThan(0.3 * p.cells * p.cells);
      expect(stars.length).toBeGreaterThan(2);
      expect(boomerangs.length + stars.length).toBeLessThanOrEqual(
        p.cells * p.cells,
      );
      expect(shapes.some((s) => s.light)).toBe(true);
      expect(shapes.some((s) => !s.light)).toBe(true);
      // Orientation is spread over the circle (axial angle, doubled).
      let c = 0,
        s2 = 0;
      for (const b of boomerangs) {
        c += Math.cos(2 * b.angle);
        s2 += Math.sin(2 * b.angle);
      }
      expect(Math.hypot(c, s2) / boomerangs.length).toBeLessThan(0.6);
      // The base keeps a fine dark speckle.
      expect(speckle).toBeGreaterThan(0.01);
      expect(speckle).toBeLessThan(0.2);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('atomicboomerang', 0),
      b = createSurfaceSampler('atomicboomerang', 7),
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

describe('celticplait: carved two-ribbon interlace bands', () => {
  const p = proceduralMaterialPresets.celticplait;

  it.each(seeds)(
    'places two grooved ribbons at the authored amplitude and width in every band (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('celticplait', seed),
        out = empty(),
        n = 16384,
        // theta = pi/2: both ribbons are horizontal and furthest apart.
        u = 0.25 / p.periods,
        lit: boolean[] = [];
      let invalid = 0;
      for (let i = 0; i < n; i++) {
        sample(u, (i + 0.5) / n, out);
        invalid += Number(out.metallic !== 0 || out.mortar !== 0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
        // Ribbon faces (0.74) are above both rails (0.62) and the groove/ground.
        lit.push(out.color > 0.68);
      }
      expect(invalid).toBe(0);
      const runs: { center: number; width: number }[] = [];
      let start = -1;
      for (let i = 0; i <= n; i++) {
        const on = i < n && lit[i];
        if (on && start < 0) start = i;
        if (!on && start >= 0) {
          runs.push({ center: (start + i) / 2 / n, width: (i - start) / n });
          start = -1;
        }
      }
      // Per band: two ribbons, each split in two halves by the center groove.
      expect(runs.length).toBe(4 * p.bands);
      const half = p.ribbonHalf - p.grooveHalf;
      for (const run of runs)
        expect(Math.abs(run.width - half)).toBeLessThan(0.006);
      for (let band = 0; band < p.bands; band++) {
        const mid = (band + 0.5) / p.bands,
          centers = runs
            .slice(4 * band, 4 * band + 4)
            .map((r) => r.center - mid);
        const expected = [
          -p.amplitude - (p.ribbonHalf + p.grooveHalf) / 2,
          -p.amplitude + (p.ribbonHalf + p.grooveHalf) / 2,
          p.amplitude - (p.ribbonHalf + p.grooveHalf) / 2,
          p.amplitude + (p.ribbonHalf + p.grooveHalf) / 2,
        ];
        for (let k = 0; k < 4; k++)
          expect(Math.abs(centers[k] - expected[k])).toBeLessThan(0.006);
      }
    },
  );

  it.each(seeds)(
    'passes the rising ribbon over the falling one at every crossing (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('celticplait', seed),
        out = empty(),
        slope = p.amplitude * 2 * Math.PI * p.periods;
      for (let band = 0; band < p.bands; band++)
        for (let crossing = 0; crossing < 2 * p.periods; crossing++) {
          const u0 = crossing / (2 * p.periods),
            v0 = (band + 0.5) / p.bands,
            // Slope of strand 1 alternates in sign; the strands mirror each other.
            slope1 = slope * (crossing % 2 === 0 ? 1 : -1),
            range = (direction: number): number => {
              let low = Infinity,
                high = -Infinity;
              for (let k = -10; k <= 10; k++) {
                const t = (k / 10) * 0.012;
                sample(u0 + t, v0 + direction * Math.abs(slope1) * t, out);
                low = Math.min(low, out.height);
                high = Math.max(high, out.height);
              }
              return (high - low) / p.relief;
            };
          // The over ribbon keeps its crest through the crossing; the under ribbon is
          // interrupted by it, so its height profile varies far more.
          const rising = range(1),
            falling = range(-1);
          expect(falling).toBeGreaterThan(rising + 0.1);
        }
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('celticplait', 0),
      b = createSurfaceSampler('celticplait', 7),
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

describe('garnetschist: foliated schist with faceted garnets', () => {
  const p = proceduralMaterialPresets.garnetschist;
  const size = 768;

  it.each(seeds)(
    'keeps garnets hexagonal and inside their own cells, with horizontal foliation and sparse mica (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('garnetschist', seed),
        out = empty(),
        color = new Float64Array(size * size);
      let invalid = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          sample((x + 0.5) / size, (y + 0.5) / size, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          color[y * size + x] = out.color;
        }
      expect(invalid).toBe(0);
      // Garnets are far darker (<0.25) than the darkest foliation layer (about 0.31).
      const dark = color.map((c) => Number(c < 0.25)),
        seen = new Uint8Array(dark.length),
        cell = size / p.cells,
        owners = new Set<number>(),
        centers: { x: number; y: number }[] = [];
      for (let first = 0; first < dark.length; first++) {
        if (!dark[first] || seen[first]) continue;
        const queue = [first];
        seen[first] = 1;
        let sx = 0,
          sy = 0;
        for (let read = 0; read < queue.length; read++) {
          const i = queue[read],
            x = i % size,
            y = Math.floor(i / size);
          sx += x + 0.5;
          sy += y + 0.5;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const j =
              ((y + dy + size) % size) * size + ((x + dx + size) % size);
            if (dark[j] && !seen[j]) {
              seen[j] = 1;
              queue.push(j);
            }
          }
        }
        if (queue.length < 30) continue;
        const cx = sx / queue.length,
          cy = sy / queue.length;
        centers.push({ x: cx, y: cy });
        const owner = Math.floor(cy / cell) * p.cells + Math.floor(cx / cell);
        expect(owners.has(owner)).toBe(false);
        owners.add(owner);
        // Cast rays to find the outline radius at 360 angles.
        const outline: number[] = [];
        for (let a = 0; a < 360; a++) {
          const angle = (a * Math.PI) / 180;
          let r = 0;
          while (r < 60) {
            const px = Math.round(cx + (r + 1) * Math.cos(angle) - 0.5),
              py = Math.round(cy + (r + 1) * Math.sin(angle) - 0.5);
            if (
              !(
                color[((py + size) % size) * size + ((px + size) % size)] < 0.25
              )
            )
              break;
            r++;
          }
          outline.push(r);
        }
        // A regular hexagon's outline radius oscillates six times per revolution.
        let best = 0,
          bestPower = 0;
        for (let k = 2; k <= 12; k++) {
          let re = 0,
            im = 0;
          for (let a = 0; a < 360; a++) {
            re += outline[a] * Math.cos((2 * Math.PI * k * a) / 360);
            im += outline[a] * Math.sin((2 * Math.PI * k * a) / 360);
          }
          if (re * re + im * im > bestPower) {
            bestPower = re * re + im * im;
            best = k;
          }
        }
        expect(best).toBe(6);
      }
      expect(centers.length).toBeGreaterThanOrEqual(8);
      expect(centers.length).toBeLessThanOrEqual(p.cells * p.cells);
      // Foliation: color changes across the layers (v) much faster than along them (u).
      let acrossV = 0,
        acrossU = 0,
        count = 0;
      for (let y = 0; y < size - 4; y++)
        for (let x = 0; x < size - 4; x++) {
          const here = color[y * size + x],
            right = color[y * size + x + 4],
            down = color[(y + 4) * size + x];
          if (here < 0.25 || right < 0.25 || down < 0.25) continue;
          // Ignore mica flecks, which are isotropic.
          if (here > 0.8 || right > 0.8 || down > 0.8) continue;
          acrossU += Math.abs(right - here);
          acrossV += Math.abs(down - here);
          count++;
        }
      expect(count).toBeGreaterThan(size * size * 0.5);
      expect(acrossV / acrossU).toBeGreaterThan(1.8);
      // Mica sparkle is sparse.
      const sparkle = color.filter((c) => c > 0.85).length / color.length;
      expect(sparkle).toBeGreaterThan(0.002);
      expect(sparkle).toBeLessThan(0.05);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('garnetschist', 0),
      b = createSurfaceSampler('garnetschist', 7),
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

describe('topographiccontours: isolines of a smooth elevation field', () => {
  const p = proceduralMaterialPresets.topographiccontours;
  const samples = 4096;
  type Line = { width: number; depth: number };
  /** Cyclic scan of one row: line runs and the base tone at the middle of every gap. */
  const scan = (
    sample: ReturnType<typeof createSurfaceSampler>,
    v: number,
  ): { lines: Line[]; gaps: number[] } => {
    const out = empty(),
      color: number[] = [];
    for (let i = 0; i < samples; i++) {
      sample((i + 0.5) / samples, v, out);
      color.push(out.color);
    }
    const dark = color.map((c) => c < 0.35),
      start = dark.findIndex((d, i) => !d && dark[(i + 1) % samples]),
      lines: Line[] = [],
      gaps: number[] = [];
    if (start < 0) return { lines, gaps };
    let run = 0,
      depth = 1,
      gapStart = 0;
    for (let k = 1; k <= samples; k++) {
      const i = (start + k) % samples;
      if (dark[i]) {
        if (run === 0 && k > 1 && k - gapStart > 6) {
          const mid = Math.floor((gapStart + k) / 2);
          gaps.push(
            (color[(start + mid - 1) % samples] +
              color[(start + mid) % samples] +
              color[(start + mid + 1) % samples]) /
              3,
          );
        }
        run++;
        depth = Math.min(depth, color[i]);
      } else if (run > 0) {
        lines.push({ width: run / samples, depth });
        run = 0;
        depth = 1;
        gapStart = k;
      }
    }
    return { lines, gaps };
  };

  it.each(seeds)(
    'steps tone by one interval per line and thickens every fifth line (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('topographiccontours', seed),
        out = empty();
      let invalid = 0;
      for (let i = 0; i < 40_000; i++) {
        sample((i * 0.6180339887) % 1, (i * 0.7548776662) % 1, out);
        invalid += Number(out.metallic !== 0 || out.mortar !== 0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
      expect(invalid).toBe(0);
      const median = (values: number[]): number =>
        [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
      let index = 0,
        lineCount = 0;
      const steps: number[] = [],
        indexWidth: number[] = [],
        minorWidth: number[] = [];
      for (let row = 0; row < 64; row++) {
        const { lines, gaps } = scan(sample, (row + 0.37) / 64);
        for (const line of lines) {
          lineCount++;
          // Index lines are painted with the darker tone.
          const isIndex = line.depth < (p.indexTone + p.minorTone) / 2;
          index += Number(isIndex);
          (isIndex ? indexWidth : minorWidth).push(line.width);
        }
        for (let i = 1; i < gaps.length; i++)
          steps.push(Math.abs(gaps[i] - gaps[i - 1]));
      }
      // About one line in indexEvery is an index line.
      expect(index / lineCount).toBeGreaterThan(0.5 / p.indexEvery);
      expect(index / lineCount).toBeLessThan(1.6 / p.indexEvery);
      expect(median(indexWidth) / median(minorWidth)).toBeGreaterThan(1.7);
      expect(median(indexWidth) / median(minorWidth)).toBeLessThan(3.2);
      // Mid-gap tones of neighboring bands differ by about one hypsometric interval.
      const interval = p.elevationTone / p.levels;
      expect(steps.length).toBeGreaterThan(200);
      expect(median(steps) / interval).toBeGreaterThan(0.7);
      expect(median(steps) / interval).toBeLessThan(1.3);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('topographiccontours', 0),
      b = createSurfaceSampler('topographiccontours', 7),
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

describe('digitalcamo: four-tone pixel camouflage on canvas', () => {
  const p = proceduralMaterialPresets.digitalcamo;
  const n = p.blocks;
  const nearest = (color: number): number => {
    let best = 0;
    for (let i = 1; i < p.tones.length; i++)
      if (Math.abs(color - p.tones[i]) < Math.abs(color - p.tones[best]))
        best = i;
    return best;
  };

  it.each(seeds)(
    'gives each tone a quarter of the pixels, flat inside every block and clustered across blocks (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('digitalcamo', seed),
        out = empty();
      let invalid = 0;
      const counts = new Array<number>(p.tones.length).fill(0),
        grid = new Uint8Array(n * n);
      let inside = 0,
        flat = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          // Several probes inside the block (clear of its edge, where nothing changes anyway).
          const levels: number[] = [];
          for (const [fx, fy] of [
            [0.2, 0.2],
            [0.8, 0.3],
            [0.5, 0.5],
            [0.3, 0.8],
            [0.75, 0.75],
          ]) {
            sample((x + fx) / n, (y + fy) / n, out);
            invalid += Number(out.metallic !== 0 || out.mortar !== 0);
            for (const value of [
              out.color,
              out.height / p.relief,
              out.roughness,
              out.occlusion,
            ])
              invalid += Number(!(value >= 0 && value <= 1));
            levels.push(nearest(out.color));
          }
          inside++;
          flat += Number(levels.every((l) => l === levels[0]));
          grid[y * n + x] = levels[0];
          counts[levels[0]]++;
        }
      expect(invalid).toBe(0);
      // Block tone ignores the weave: every probe in a block reads as the same tone.
      expect(flat / inside).toBe(1);
      // Quartile thresholds give an equal share to every tone.
      for (const count of counts) {
        expect(count / (n * n)).toBeGreaterThan(0.24);
        expect(count / (n * n)).toBeLessThan(0.26);
      }
      // Spatial clustering: neighboring blocks agree far more often than the 1/4 of random tones.
      let same = 0,
        pairs = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ]) {
            same += Number(
              grid[y * n + x] === grid[((y + dy) % n) * n + ((x + dx) % n)],
            );
            pairs++;
          }
      expect(same / pairs).toBeGreaterThan(0.45);
    },
  );

  it('keeps the canvas weave visible inside a flat block', () => {
    const sample = createSurfaceSampler('digitalcamo', 7),
      out = empty(),
      colors: number[] = [],
      heights: number[] = [];
    // One block spans 2 thread cells in each direction.
    for (let i = 0; i < 64; i++)
      for (let j = 0; j < 64; j++) {
        sample(
          (10 + 0.1 + (0.8 * i) / 64) / n,
          (20 + 0.1 + (0.8 * j) / 64) / n,
          out,
        );
        colors.push(out.color);
        heights.push(out.height / p.relief);
      }
    const spread = (values: number[]): number =>
      Math.max(...values) - Math.min(...values);
    expect(spread(colors)).toBeGreaterThan(p.weaveTone * 0.5);
    expect(spread(colors)).toBeLessThan(p.weaveTone * 1.5);
    expect(spread(heights)).toBeGreaterThan(p.weaveHeight * 0.5);
  });

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('digitalcamo', 0),
      b = createSurfaceSampler('digitalcamo', 7),
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

describe('radarscope: rings, bearing spokes, sweep afterglow and blips', () => {
  const p = proceduralMaterialPresets.radarscope;
  const TAU = 2 * Math.PI;
  const spokeStep = TAU / p.spokes;
  /** Scope color at polar coordinates around the tile center. */
  const at = (
    sample: ReturnType<typeof createSurfaceSampler>,
    rho: number,
    theta: number,
  ): number => {
    const out = empty();
    sample(0.5 + rho * Math.cos(theta), 0.5 + rho * Math.sin(theta), out);
    return out.color;
  };
  /** Sweep arm angle: the brightest point of a mid-radius circle. */
  const arm = (sample: ReturnType<typeof createSurfaceSampler>): number => {
    let best = 0,
      bright = -1;
    for (let i = 0; i < 7200; i++) {
      const theta = (TAU * i) / 7200,
        c = at(sample, 0.3, theta);
      if (c > bright) {
        bright = c;
        best = theta;
      }
    }
    return best;
  };

  it.each(seeds)(
    'draws evenly spaced range rings and bearing spokes (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('radarscope', seed),
        sweep = arm(sample),
        step = p.radius / p.rings;
      // A ray between two spokes, well behind the afterglow so only rings are lit.
      const behind = sweep + p.sweepWidth + 0.4,
        ray = (Math.floor(behind / spokeStep) + 0.5) * spokeStep,
        peaks: number[] = [];
      const n = 6000,
        profile: number[] = [];
      for (let i = 0; i < n; i++)
        profile.push(at(sample, ((p.radius + 0.02) * (i + 0.5)) / n, ray));
      for (let i = 1; i < n - 1; i++)
        if (
          profile[i] > 0.12 &&
          profile[i] >= profile[i - 1] &&
          profile[i] > profile[i + 1]
        )
          peaks.push(((p.radius + 0.02) * (i + 0.5)) / n);
      // Blips and scanlines may add peaks; every authored ring must have one at its radius.
      for (let k = 1; k <= p.rings; k++)
        expect(
          Math.min(...peaks.map((r) => Math.abs(r - k * step))),
        ).toBeLessThan(0.003);
      // Spokes along a circle inside the unlit sector. Blips add extra peaks, so take the
      // candidate radius with the fewest peaks (a blip-free circle).
      // Unlit sector: angles from just past the arm to the far end of the afterglow.
      const first = sweep + 0.15,
        last = sweep + TAU - p.sweepWidth - 0.15,
        m = 9000;
      let angles: number[] | undefined;
      for (const circle of [0.2, 0.25, 0.3, 0.34, 0.38, 0.42]) {
        const ring: number[] = [],
          found: number[] = [];
        for (let i = 0; i <= m; i++)
          ring.push(at(sample, circle, first + ((last - first) * i) / m));
        for (let i = 1; i < m; i++)
          if (ring[i] > 0.1 && ring[i] >= ring[i - 1] && ring[i] > ring[i + 1])
            found.push(first + ((last - first) * i) / m);
        // A flat spoke top can hold several local maxima (scanline ripple): keep one per spoke.
        const merged = found.filter(
          (angle, i) => i === 0 || angle - found[i - 1] > 0.03,
        );
        if (angles === undefined || merged.length < angles.length)
          angles = merged;
      }
      if (angles === undefined) throw new Error('no spoke samples');
      const wrapped = angles.map((a) => {
        const r = (((a % spokeStep) + spokeStep) % spokeStep) / spokeStep;
        return Math.min(r, 1 - r) * spokeStep;
      });
      // Every spoke peak sits on a multiple of the authored bearing step.
      for (const offset of wrapped) expect(offset).toBeLessThan(0.01);
      const expected = Math.floor((last - first) / spokeStep);
      expect(angles.length).toBeGreaterThanOrEqual(expected - 1);
      expect(angles.length).toBeLessThanOrEqual(expected + 3);
    },
  );

  it.each(seeds)(
    'fades the sweep afterglow monotonically behind the arm and keeps the rest dark (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('radarscope', seed),
        sweep = arm(sample),
        // Mid-radius between two rings, away from spokes along the arc.
        rho = p.radius * 0.5 + p.radius / p.rings / 2.5,
        tones: number[] = [];
      for (const lag of [0.2, 0.5, 0.8, 1.1]) {
        // Snap to the middle of a bearing sector so no spoke line enters the average.
        const theta =
          (Math.round((sweep - lag) / spokeStep - 0.5) + 0.5) * spokeStep;
        let sum = 0;
        for (let k = 0; k < 20; k++)
          sum += at(sample, rho, theta + (k - 10) * 0.0008);
        tones.push(sum / 20);
      }
      for (let i = 1; i < tones.length; i++)
        expect(tones[i]).toBeLessThan(tones[i - 1]);
      // Past the afterglow the scope returns to its dark background.
      const dark = at(sample, rho, sweep - p.sweepWidth - 0.5 + spokeStep / 2);
      expect(tones[0]).toBeGreaterThan(dark + 0.05);
      expect(dark).toBeLessThan(p.backgroundTone + 0.04);
      // Outside the scope disc only background remains.
      expect(at(sample, p.radius + 0.03, sweep + 1)).toBeLessThan(
        p.backgroundTone + 0.04,
      );
      // The arm itself is the brightest line.
      expect(at(sample, 0.3, sweep)).toBeGreaterThan(p.sweepLineTone * 0.8);
    },
  );

  it('keeps channels in range and wraps seamlessly, differing between seeds', () => {
    const a = createSurfaceSampler('radarscope', 0),
      b = createSurfaceSampler('radarscope', 7),
      one = empty(),
      two = empty();
    let different = 0,
      invalid = 0;
    for (let i = 0; i < 40_000; i++) {
      a((i * 0.6180339887) % 1, (i * 0.7548776662) % 1, one);
      invalid += Number(one.metallic !== 0 || one.mortar !== 0);
      for (const value of [
        one.color,
        one.height / p.relief,
        one.roughness,
        one.occlusion,
      ])
        invalid += Number(!(value >= 0 && value <= 1));
    }
    expect(invalid).toBe(0);
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
    expect(different).toBeGreaterThan(20);
  });
});

describe('hazardstripes: chipped warning stripes over bare steel', () => {
  const p = proceduralMaterialPresets.hazardstripes;
  const size = 512;
  // Expected baseColor bytes: dark + (light - dark) * tone for the two paints, and the shared
  // neutral gray that the mortar weight mixes in for bare steel.
  const paint = (tone: number): number[] =>
    [0, 1, 2].map((c) => p.dark[c] + (p.light[c] - p.dark[c]) * tone);
  const yellow = paint(p.yellowTone),
    black = paint(p.blackTone),
    steel = [153, 153, 139];
  const distance = (a: ArrayLike<number>, b: number[]): number =>
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

  it.each(seeds)(
    'exposes neutral steel with the metallic mask, mostly at stripe borders (seed %i)',
    (seed) => {
      const maps = generateProceduralMaps('hazardstripes', size, seed);
      let bare = 0,
        paintCount = 0,
        edgeBare = 0,
        badBare = 0,
        badPaint = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4,
            metal = maps.metallicRoughness[i + 2],
            color = maps.baseColor.subarray(i, i + 3),
            // Relative distance to the nearest diagonal stripe border.
            along = (((x + 0.5) / size + (y + 0.5) / size) * p.stripes) % 1,
            edge = 2 * Math.min(along, 1 - along);
          if (metal > 250) {
            bare++;
            edgeBare += Number(edge < 0.3);
            badBare += Number(distance(color, steel) > 6);
          } else if (metal < 5) {
            paintCount++;
            badPaint += Number(
              Math.min(distance(color, yellow), distance(color, black)) > 8,
            );
          }
        }
      // Bare steel shows only the neutral mortar gray; paint shows only the two paint tones.
      expect(badBare).toBe(0);
      expect(badPaint).toBe(0);
      const fraction = bare / (size * size);
      expect(fraction).toBeGreaterThan(0.05);
      expect(fraction).toBeLessThan(0.25);
      expect(paintCount / (size * size)).toBeGreaterThan(0.7);
      // Wear is biased toward the borders: 30% of the stripe width holds most of the steel.
      expect(edgeBare / bare).toBeGreaterThan(0.6);
    },
  );

  it.each(seeds)(
    'alternates yellow and black bands, one border per stripe (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hazardstripes', seed),
        out = empty(),
        n = 4096;
      let invalid = 0;
      const kinds: number[] = [];
      for (let i = 0; i < n; i++) {
        sample((i + 0.5) / n, 0.1337, out);
        invalid += Number(Math.abs(out.metallic - out.mortar) > 1e-12);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
          out.metallic,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
        // 1 yellow, 2 black, 0 worn (bare steel hides the paint underneath).
        kinds.push(out.metallic > 0.5 ? 0 : out.color > 0.5 ? 1 : 2);
      }
      expect(invalid).toBe(0);
      const painted = kinds.filter((k) => k !== 0);
      let toggles = 0;
      for (let i = 0; i < painted.length; i++)
        toggles += Number(painted[i] !== painted[(i + 1) % painted.length]);
      // Each of the stripes alternating bands ends at one border, so a full cycle has `stripes` borders.
      expect(toggles).toBe(p.stripes);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hazardstripes', 0),
      b = createSurfaceSampler('hazardstripes', 7),
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
        expect(two.metallic).toBeCloseTo(one.metallic, 10);
        b(u, v, two);
        different += Number(two.metallic !== one.metallic);
      }
    }
    expect(different).toBeGreaterThan(5);
  });
});

describe('kiwislices: radial-streaked slices with two seed rings', () => {
  const p = proceduralMaterialPresets.kiwislices;
  const size = 768;
  type Slice = { u: number; v: number; flesh: number; seeds: number[] };

  const analyze = (seed: number) => {
    const sample = createSurfaceSampler('kiwislices', seed),
      out = empty(),
      color = new Float64Array(size * size);
    let invalid = 0;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        sample((x + 0.5) / size, (y + 0.5) / size, out);
        invalid += Number(out.metallic !== 0 || out.mortar !== 0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
        color[y * size + x] = out.color;
      }
    expect(invalid).toBe(0);
    const cell = size / p.cells,
      slices: Slice[] = [];
    for (let row = 0; row < p.cells; row++)
      for (let col = 0; col < p.cells; col++) {
        // Flesh and core are brighter than skin, seeds and the gap between fruit (< 0.2).
        let count = 0,
          sx = 0,
          sy = 0;
        for (let y = 0; y < cell; y++)
          for (let x = 0; x < cell; x++) {
            const px = col * cell + x,
              py = row * cell + y;
            if (color[py * size + px] > 0.2) {
              count++;
              sx += px + 0.5;
              sy += py + 0.5;
            }
          }
        const cx = sx / count,
          cy = sy / count,
          // Bright area ~ pi r^2 minus the (small) seed holes.
          flesh = Math.sqrt(count / Math.PI);
        // Seeds: dark pixels well inside the flesh disc, 4-connected components.
        const dark = new Uint8Array(cell * cell),
          seen = new Uint8Array(cell * cell);
        for (let y = 0; y < cell; y++)
          for (let x = 0; x < cell; x++) {
            const px = col * cell + x,
              py = row * cell + y;
            dark[y * cell + x] = Number(
              color[py * size + px] < 0.12 &&
                Math.hypot(px + 0.5 - cx, py + 0.5 - cy) < 0.85 * flesh,
            );
          }
        const seeds: number[] = [];
        for (let first = 0; first < dark.length; first++) {
          if (!dark[first] || seen[first]) continue;
          const queue = [first];
          seen[first] = 1;
          let mx = 0,
            my = 0;
          for (let read = 0; read < queue.length; read++) {
            const i = queue[read],
              x = i % cell,
              y = Math.floor(i / cell);
            mx += col * cell + x + 0.5;
            my += row * cell + y + 0.5;
            for (const [dx, dy] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]) {
              const nx = x + dx,
                ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= cell || ny >= cell) continue;
              const j = ny * cell + nx;
              if (dark[j] && !seen[j]) {
                seen[j] = 1;
                queue.push(j);
              }
            }
          }
          if (queue.length >= 4)
            seeds.push(
              Math.hypot(mx / queue.length - cx, my / queue.length - cy) /
                flesh,
            );
        }
        slices.push({ u: cx / size, v: cy / size, flesh: flesh / size, seeds });
      }
    return { sample, slices };
  };

  it.each(seeds)(
    'places the authored number of seeds on two rings per slice (seed %i)',
    (seed) => {
      const { slices } = analyze(seed),
        fleshRadius = p.radius - p.skinWidth,
        inner = p.innerSeedRadius / fleshRadius,
        outer = p.outerSeedRadius / fleshRadius;
      expect(slices.length).toBe(p.cells * p.cells);
      for (const slice of slices) {
        // Seed distances split into two clusters at the authored radius ratio.
        const near = slice.seeds.filter((r) => r < (inner + outer) / 2),
          far = slice.seeds.filter((r) => r >= (inner + outer) / 2);
        expect(Math.abs(near.length - p.innerSeeds)).toBeLessThanOrEqual(1);
        expect(Math.abs(far.length - p.outerSeeds)).toBeLessThanOrEqual(1);
        const mean = (values: number[]): number =>
          values.reduce((a, b) => a + b, 0) / values.length;
        // The flesh radius estimate carries the skin-edge softness, so allow a few percent.
        expect(Math.abs(mean(near) - inner)).toBeLessThan(0.04);
        expect(Math.abs(mean(far) - outer)).toBeLessThan(0.04);
      }
    },
  );

  it.each(seeds)(
    'carries the authored number of radial streaks around the flesh (seed %i)',
    (seed) => {
      const { sample, slices } = analyze(seed),
        out = empty(),
        steps = 2048;
      for (const slice of slices) {
        // Outside the outer seed ring, inside the skin.
        const radius = slice.flesh * 0.86,
          color: number[] = [];
        for (let i = 0; i < steps; i++) {
          const a = (2 * Math.PI * i) / steps;
          sample(
            slice.u + radius * Math.cos(a),
            slice.v + radius * Math.sin(a),
            out,
          );
          color.push(out.color);
        }
        let best = 0,
          bestPower = 0;
        for (let k = 20; k <= 120; k++) {
          let re = 0,
            im = 0;
          for (let i = 0; i < steps; i++) {
            re += color[i] * Math.cos((2 * Math.PI * k * i) / steps);
            im += color[i] * Math.sin((2 * Math.PI * k * i) / steps);
          }
          if (re * re + im * im > bestPower) {
            bestPower = re * re + im * im;
            best = k;
          }
        }
        expect(best).toBe(p.streaks);
      }
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('kiwislices', 0),
      b = createSurfaceSampler('kiwislices', 7),
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

describe('mandalaflower: layered rotational-symmetric petals', () => {
  const p = proceduralMaterialPresets.mandalaflower;
  const steps = 2880;

  /** Dominant angular harmonic of the color on a circle around the tile center. */
  const harmonic = (
    sample: ReturnType<typeof createSurfaceSampler>,
    radius: number,
  ): number => {
    const out = empty(),
      color: number[] = [];
    for (let i = 0; i < steps; i++) {
      const a = (2 * Math.PI * (i + 0.5)) / steps;
      sample(0.5 + radius * Math.cos(a), 0.5 + radius * Math.sin(a), out);
      color.push(out.color);
    }
    let best = 0,
      bestPower = 0;
    for (let k = 2; k <= 72; k++) {
      let re = 0,
        im = 0;
      for (let i = 0; i < steps; i++) {
        re += color[i] * Math.cos((2 * Math.PI * k * i) / steps);
        im += color[i] * Math.sin((2 * Math.PI * k * i) / steps);
      }
      if (re * re + im * im > bestPower) {
        bestPower = re * re + im * im;
        best = k;
      }
    }
    return best;
  };

  it.each(seeds)(
    'repeats each layer with its authored rotational symmetry (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mandalaflower', seed);
      // Inner petals, outer petals, dot ring and lotus tips.
      expect(harmonic(sample, p.innerBase + p.innerDepth * 0.5)).toBe(
        p.innerCount,
      );
      expect(harmonic(sample, p.petalBase + p.petalDepth * 0.8)).toBe(
        p.petalCount,
      );
      expect(harmonic(sample, p.dotRadius)).toBe(p.dotCount);
      expect(harmonic(sample, p.lotusBase + p.lotusDepth * 0.5)).toBe(
        p.lotusCount,
      );
    },
  );

  it.each(seeds)(
    'paints the hub, outlines every layer edge and stays in range (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mandalaflower', seed),
        out = empty();
      let invalid = 0;
      for (let i = 0; i < 40_000; i++) {
        sample((i * 0.6180339887) % 1, (i * 0.7548776662) % 1, out);
        invalid += Number(out.metallic !== 0 || out.mortar !== 0);
        for (const value of [
          out.color,
          out.height / p.relief,
          out.roughness,
          out.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
      expect(invalid).toBe(0);
      sample(0.5, 0.5, out);
      expect(out.color).toBeLessThan(p.hubTone + 0.06);
      // Along a ray from the hub, every layer boundary carries a dark outline: a local minimum
      // well below the tones on both sides (one outline width away). Close dips are one outline.
      const n = 8000,
        reach = 0.47,
        width = Math.round((p.outlineWidth / reach) * n),
        profile: number[] = [],
        positions: number[] = [];
      for (let i = 0; i < n; i++) {
        sample(0.5 + (reach * (i + 0.5)) / n, 0.5, out);
        profile.push(out.color);
      }
      for (let i = width; i < n - width; i++)
        if (
          profile[i] < p.outlineTone + 0.08 &&
          profile[i] <= profile[i - 1] &&
          profile[i] < profile[i + 1] &&
          profile[i - width] > profile[i] + 0.1 &&
          profile[i + width] > profile[i] + 0.1
        )
          positions.push((reach * (i + 0.5)) / n);
      const dips = positions.filter(
        (x, i) => i === 0 || x - positions[i - 1] > 0.02,
      ).length;
      expect(dips).toBeGreaterThanOrEqual(3);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mandalaflower', 0),
      b = createSurfaceSampler('mandalaflower', 7),
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
    expect(different).toBeGreaterThan(50);
  });
});

describe('needlepoint: slanted wool stitches in a repeating diamond motif', () => {
  const p = proceduralMaterialPresets.needlepoint;
  const n = p.stitches;
  const tones = [...p.ringTones, p.accentTone];
  const nearest = (color: number): number => {
    let best = 0;
    for (let i = 1; i < tones.length; i++)
      if (Math.abs(color - tones[i]) < Math.abs(color - tones[best])) best = i;
    return best;
  };

  it.each(seeds)(
    'tiles a mirror-symmetric motif with the authored period and slants every stitch (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('needlepoint', seed),
        out = empty(),
        grid = new Uint8Array(n * n);
      let invalid = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          // Stitch center: full cover, so the color is the cell tone (plus ply ripple).
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          grid[y * n + x] = nearest(out.color);
        }
      const size = 384,
        color = new Float64Array(size * size);
      let holes = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          sample((x + 0.5) / size, (y + 0.5) / size, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          color[y * size + x] = out.height;
          holes += Number(out.occlusion < (p.holeAO + 1) / 2);
        }
      expect(invalid).toBe(0);
      // Motif: the same tone class one motif further, and mirrored inside every motif.
      let periodic = 0,
        mirrored = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          periodic += Number(
            grid[y * n + x] ===
              grid[((y + p.motif) % n) * n + ((x + p.motif) % n)],
          );
          const mx = p.motif - 1 - (x % p.motif),
            my = p.motif - 1 - (y % p.motif),
            base = Math.floor(x / p.motif) * p.motif,
            baseY = Math.floor(y / p.motif) * p.motif;
          mirrored += Number(
            grid[y * n + x] === grid[(baseY + my) * n + (base + mx)] &&
              grid[y * n + x] === grid[y * n + (base + mx)],
          );
        }
      expect(periodic).toBe(n * n);
      expect(mirrored).toBe(n * n);
      // All four tone classes appear; the cross accent covers 44 of the 144 cells of a motif.
      const accent = grid.filter((c) => c === 3).length / grid.length;
      expect(Math.abs(accent - 44 / 144)).toBeLessThan(0.01);
      for (let c = 0; c < tones.length; c++)
        expect(grid.some((value) => value === c)).toBe(true);
      // Ridge direction: stitches run along (1, 1), so height gradients anti-correlate.
      let covariance = 0;
      for (let y = 1; y < size - 1; y++)
        for (let x = 1; x < size - 1; x++) {
          const gx = color[y * size + x + 1] - color[y * size + x - 1],
            gy = color[(y + 1) * size + x] - color[(y - 1) * size + x];
          covariance += gx * gy;
        }
      expect(covariance).toBeLessThan(0);
      // Canvas gaps and stitch edges (AO well below 1) are a sizable minority, not most, of the surface.
      expect(holes / (size * size)).toBeGreaterThan(0.15);
      expect(holes / (size * size)).toBeLessThan(0.5);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('needlepoint', 0),
      b = createSurfaceSampler('needlepoint', 7),
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

describe('dicefaces: rounded dice faces with point-symmetric pip layouts', () => {
  const p = proceduralMaterialPresets.dicefaces;
  const size = 768;
  const cell = size / p.cells;

  it.each(seeds)(
    'draws rounded faces of the authored area with 1-6 pips on a symmetric 3x3 lattice (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('dicefaces', seed),
        out = empty(),
        color = new Float64Array(size * size);
      let invalid = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          sample((x + 0.5) / size, (y + 0.5) / size, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          color[y * size + x] = out.color;
        }
      expect(invalid).toBe(0);
      const counts = new Set<number>();
      // Rounded square of half size h and corner radius r has area (2h)^2 - (4 - pi) r^2.
      const expectedArea =
        (2 * p.halfSize) ** 2 - (4 - Math.PI) * p.cornerRadius ** 2;
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          // Face pixels are bright or pip-dark; the gap is darker than both... except pips, so
          // classify by distance from the cell center: inside the face = anything above the gap.
          let facePixels = 0;
          const dark = new Uint8Array(cell * cell);
          for (let y = 0; y < cell; y++)
            for (let x = 0; x < cell; x++) {
              const c = color[(row * cell + y) * size + col * cell + x];
              facePixels += Number(c > 0.5);
              // Pips lie within 0.34 of the center; stay clear of the soft face edge.
              const inner =
                Math.abs((x + 0.5) / cell - 0.5) < 0.38 &&
                Math.abs((y + 0.5) / cell - 0.5) < 0.38;
              dark[y * cell + x] = Number(inner && c < 0.25);
            }
          // Pips are inside the face, so the face area includes them: add the pip pixels back.
          const pipPixels = dark.reduce((a, b) => a + b, 0);
          expect(
            Math.abs((facePixels + pipPixels) / (cell * cell) - expectedArea),
          ).toBeLessThan(0.02);
          // Pips: 4-connected dark components with their centers relative to the face center.
          const seen = new Uint8Array(dark.length),
            pips: { x: number; y: number }[] = [];
          for (let first = 0; first < dark.length; first++) {
            if (!dark[first] || seen[first]) continue;
            const queue = [first];
            seen[first] = 1;
            let sx = 0,
              sy = 0;
            for (let read = 0; read < queue.length; read++) {
              const i = queue[read],
                x = i % cell,
                y = Math.floor(i / cell);
              sx += x + 0.5;
              sy += y + 0.5;
              for (const [dx, dy] of [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ]) {
                const nx = x + dx,
                  ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= cell || ny >= cell) continue;
                const j = ny * cell + nx;
                if (dark[j] && !seen[j]) {
                  seen[j] = 1;
                  queue.push(j);
                }
              }
            }
            if (queue.length > 20)
              pips.push({
                x: sx / queue.length / cell - 0.5,
                y: sy / queue.length / cell - 0.5,
              });
          }
          counts.add(pips.length);
          expect(pips.length).toBeGreaterThanOrEqual(1);
          expect(pips.length).toBeLessThanOrEqual(6);
          for (const pip of pips) {
            // Every pip sits on the 3x3 lattice of the authored spacing...
            for (const coordinate of [pip.x, pip.y])
              expect(
                Math.abs(
                  coordinate -
                    p.pipSpacing * Math.round(coordinate / p.pipSpacing),
                ),
              ).toBeLessThan(0.012);
            // ...and the layout is point-symmetric: the opposite lattice point is lit too.
            expect(
              pips.some(
                (other) =>
                  Math.abs(other.x + pip.x) < 0.012 &&
                  Math.abs(other.y + pip.y) < 0.012,
              ),
            ).toBe(true);
          }
        }
      // Every face value shows up somewhere in the 16 faces of at least one seed (checked below).
      expect(counts.size).toBeGreaterThan(2);
    },
  );

  it('uses every pip count from one to six across seeds and wraps seamlessly', () => {
    const seen = new Set<number>(),
      out = empty();
    for (const seed of seeds) {
      const sample = createSurfaceSampler('dicefaces', seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          // Count lattice points whose center is a pip (dark) in this face's quadrant frame.
          let count = 0;
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) {
              sample(
                (col + 0.5 + i * p.pipSpacing) / p.cells,
                (row + 0.5 + j * p.pipSpacing) / p.cells,
                out,
              );
              count += Number(out.color < 0.25);
            }
          seen.add(count);
        }
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    const a = createSurfaceSampler('dicefaces', 0),
      b = createSurfaceSampler('dicefaces', 7),
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
    expect(different).toBeGreaterThan(50);
  });
});

describe('cinderblockwall: running-bond masonry blocks with air voids', () => {
  const p = proceduralMaterialPresets.cinderblockwall;
  /** Runs (center, width) of mortar > 0.5 along a cyclic scan; fixed v scans u, otherwise the reverse. */
  const runs = (
    sample: ReturnType<typeof createSurfaceSampler>,
    fixed: number,
    alongU: boolean,
  ): { center: number; width: number }[] => {
    const out = empty(),
      n = 16384,
      on: boolean[] = [];
    for (let i = 0; i < n; i++) {
      if (alongU) sample((i + 0.5) / n, fixed, out);
      else sample(fixed, (i + 0.5) / n, out);
      on.push(out.mortar > 0.5);
    }
    const start = on.findIndex((value, i) => !value && on[(i + 1) % n]),
      found: { center: number; width: number }[] = [];
    let run = 0;
    for (let k = 1; k <= n; k++) {
      const i = (start + k) % n;
      if (on[i]) run++;
      else if (run > 0) {
        found.push({
          center: ((((start + k - run / 2) % n) + n) % n) / n,
          width: run / n,
        });
        run = 0;
      }
    }
    return found;
  };

  it.each(seeds)(
    'lays joints of the authored width on a half-block running bond (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('cinderblockwall', seed),
        pitch = 1 / p.columns;
      const offsets: number[] = [];
      for (let row = 0; row < p.courses; row++) {
        const joints = runs(sample, (row + 0.5) / p.courses, true);
        expect(joints.length).toBe(p.columns);
        for (const joint of joints)
          expect(Math.abs(joint.width - p.jointWidth)).toBeLessThan(0.003);
        const spacing = joints.map((j) => j.center).sort((a, b) => a - b);
        for (let i = 1; i < spacing.length; i++)
          expect(Math.abs(spacing[i] - spacing[i - 1] - pitch)).toBeLessThan(
            0.002,
          );
        // Joint offset within a block pitch.
        offsets.push(((spacing[0] % pitch) + pitch) % pitch);
      }
      // Adjacent courses are offset by half a block, even courses by the same amount.
      for (let row = 2; row < p.courses; row++)
        expect(Math.abs(offsets[row] - offsets[row - 2])).toBeLessThan(0.002);
      const shift = Math.abs(offsets[1] - offsets[0]);
      expect(Math.abs(Math.min(shift, pitch - shift) - pitch / 2)).toBeLessThan(
        0.003,
      );
      // Bed joints: one per course boundary, at the same places in every column.
      const beds = runs(sample, 0.07, false);
      expect(beds.length).toBe(p.courses);
      for (const [k, bed] of beds
        .sort((a, b) => a.center - b.center)
        .entries()) {
        const expected = (k === 0 ? 0 : k) / p.courses;
        const gap = Math.abs(bed.center - expected);
        expect(Math.min(gap, 1 - gap)).toBeLessThan(0.003);
        expect(Math.abs(bed.width - p.jointWidth)).toBeLessThan(0.003);
      }
    },
  );

  it.each(seeds)(
    'scatters small air voids at about the authored density and stays in range (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('cinderblockwall', seed),
        out = empty(),
        n = 1024,
        pit = new Uint8Array(n * n);
      let invalid = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          invalid += Number(out.metallic !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
            out.mortar,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          pit[y * n + x] = Number(out.occlusion < 0.65 && out.mortar < 0.05);
        }
      expect(invalid).toBe(0);
      const seen = new Uint8Array(pit.length);
      let pits = 0;
      for (let first = 0; first < pit.length; first++) {
        if (!pit[first] || seen[first]) continue;
        pits++;
        const queue = [first];
        seen[first] = 1;
        for (let read = 0; read < queue.length; read++) {
          const i = queue[read],
            x = i % n,
            y = Math.floor(i / n);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const j = ((y + dy + n) % n) * n + ((x + dx + n) % n);
            if (pit[j] && !seen[j]) {
              seen[j] = 1;
              queue.push(j);
            }
          }
        }
      }
      const expected = p.voidCells * p.voidCells * p.voidChance;
      expect(pits).toBeGreaterThan(0.8 * expected);
      expect(pits).toBeLessThan(1.1 * expected);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('cinderblockwall', 0),
      b = createSurfaceSampler('cinderblockwall', 7),
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
        expect(two.mortar).toBeCloseTo(one.mortar, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(100);
  });
});

describe('moirefringes: two integer-wavevector gratings and their beat', () => {
  const p = proceduralMaterialPresets.moirefringes;
  const n = 256;

  it.each(seeds)(
    'puts spectral energy at both gratings, their difference and sum, and nowhere else (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('moirefringes', seed),
        out = empty(),
        color = new Float64Array(n * n);
      let invalid = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          color[y * n + x] = out.color;
        }
      expect(invalid).toBe(0);
      const amplitude = (kx: number, ky: number): number => {
        let re = 0,
          im = 0;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            const angle =
              (-2 * Math.PI * (kx * (x + 0.5) + ky * (y + 0.5))) / n;
            re += color[y * n + x] * Math.cos(angle);
            im += color[y * n + x] * Math.sin(angle);
          }
        return (2 * Math.hypot(re, im)) / (n * n);
      };
      const first = amplitude(p.kx1, p.ky1),
        second = amplitude(p.kx2, p.ky2),
        beat = amplitude(p.kx1 - p.kx2, p.ky1 - p.ky2),
        sum = amplitude(p.kx1 + p.kx2, p.ky1 + p.ky2);
      // Gratings are strong and equal; the overlay's product terms carry the beat and the sum.
      expect(first).toBeGreaterThan(0.25);
      expect(Math.abs(first - second) / first).toBeLessThan(0.02);
      expect(beat).toBeGreaterThan(0.07);
      expect(Math.abs(beat - sum) / beat).toBeLessThan(0.03);
      // Frequencies between lattice points, next to the beat, and unrelated ones stay near zero
      // (only the faint paper fibers contribute).
      for (const [kx, ky] of [
        [p.kx1 - p.kx2, p.ky1 - p.ky2 + 1],
        [p.kx1 - p.kx2, p.ky1 - p.ky2 - 1],
        [1, p.ky1 - p.ky2],
        [11, 5],
        [17, -2],
        [p.kx1 + 6, p.ky1],
      ])
        expect(amplitude(kx, ky)).toBeLessThan(0.01);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('moirefringes', 0),
      b = createSurfaceSampler('moirefringes', 7),
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

describe('azulejotiles: identical D4-symmetric tiles separated by grout', () => {
  const p = proceduralMaterialPresets.azulejotiles;
  const n = 1024,
    tile = n / p.tiles;

  it.each(seeds)(
    'repeats one tile with full square symmetry between grout lines of the authored width (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('azulejotiles', seed),
        out = empty(),
        color = new Float64Array(n * n),
        grout = new Float64Array(n * n);
      let invalid = 0,
        pigment = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          invalid += Number(out.metallic !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
            out.mortar,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          color[y * n + x] = out.color;
          grout[y * n + x] = out.mortar;
          pigment += Number(out.color < 0.5);
        }
      expect(invalid).toBe(0);
      expect(pigment / (n * n)).toBeGreaterThan(0.15);
      expect(pigment / (n * n)).toBeLessThan(0.3);
      const margin = 8,
        agreement = (
          tx: number,
          ty: number,
          map: (x: number, y: number) => [number, number],
        ): number => {
          let ok = 0,
            count = 0;
          for (let y = margin; y < tile - margin; y++)
            for (let x = margin; x < tile - margin; x++) {
              const [x2, y2] = map(x, y);
              count++;
              ok += Number(
                Math.abs(
                  color[(ty * tile + y) * n + tx * tile + x] -
                    color[(ty * tile + y2) * n + tx * tile + x2],
                ) < 0.3,
              );
            }
          return ok / count;
        };
      // Quarter turn, both mirrors and the diagonal flip all map the tile onto itself;
      // an arbitrary shift (control) does not, which shows the test can fail.
      expect(agreement(1, 2, (x, y) => [tile - 1 - y, x])).toBeGreaterThan(
        0.99,
      );
      expect(agreement(1, 2, (x, y) => [tile - 1 - x, y])).toBeGreaterThan(
        0.99,
      );
      expect(agreement(1, 2, (x, y) => [y, x])).toBeGreaterThan(0.99);
      expect(
        agreement(1, 2, (x, y) => [Math.min(tile - margin - 1, x + 30), y]),
      ).toBeLessThan(0.85);
      // Every tile carries the same pigment pattern as tile (0, 0).
      let same = 0,
        total = 0;
      for (let ty = 0; ty < p.tiles; ty++)
        for (let tx = 0; tx < p.tiles; tx++)
          for (let y = margin; y < tile - margin; y++)
            for (let x = margin; x < tile - margin; x++) {
              total++;
              same += Number(
                color[(ty * tile + y) * n + tx * tile + x] < 0.5 ===
                  color[y * n + x] < 0.5,
              );
            }
      expect(same / total).toBeGreaterThan(0.99);
      // Grout: one line per tile boundary in each direction, of the authored width.
      for (const alongU of [true, false]) {
        const mid = Math.floor(tile / 2),
          lines: number[] = [];
        let run = 0;
        for (let i = 0; i < n; i++) {
          const g = alongU ? grout[mid * n + i] : grout[i * n + mid];
          if (g > 0.5) run++;
          else if (run > 0) {
            lines.push(run);
            run = 0;
          }
        }
        if (run > 0) lines.push(run);
        // A line crossing the seam of the scan is split in two; merge it back.
        const wrapped =
          grout[alongU ? mid * n : mid] > 0.5 &&
          grout[alongU ? mid * n + n - 1 : (n - 1) * n + mid] > 0.5;
        if (wrapped) {
          const last = lines.pop() ?? 0;
          lines[0] += last;
        }
        expect(lines.length).toBe(p.tiles);
        for (const width of lines)
          expect(Math.abs(width / n - p.groutWidth)).toBeLessThan(0.003);
      }
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('azulejotiles', 0),
      b = createSurfaceSampler('azulejotiles', 7),
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
        expect(two.mortar).toBeCloseTo(one.mortar, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(100);
  });
});

describe('tumblingblocks: isometric cubes on a hexagonal lattice', () => {
  const p = proceduralMaterialPresets.tumblingblocks;
  const root3 = Math.sqrt(3),
    width = p.columns * root3,
    height = p.rows * 1.5;
  /** Hex centers of the authored lattice (unit circumradius, a hex centered at u = v = 0). */
  const centers = (): { x: number; y: number }[] => {
    const list: { x: number; y: number }[] = [];
    for (let row = 0; row < p.rows; row++)
      for (let col = 0; col < p.columns; col++)
        list.push({ x: col * root3 + (row & 1) * (root3 / 2), y: row * 1.5 });
    return list;
  };

  it.each(seeds)(
    'shades top, right and left faces in order on every cube and splits each hex into thirds (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('tumblingblocks', seed),
        out = empty(),
        at = (x: number, y: number): number => {
          sample(x / width, y / height, out);
          return out.color;
        };
      let ordered = 0,
        total = 0;
      for (const { x, y } of centers()) {
        // Face centers sit at 0.5 of the circumradius toward -90, 30 and 150 degrees.
        const top = at(x, y - 0.5),
          right = at(x + 0.5 * Math.cos(Math.PI / 6), y + 0.25),
          left = at(x - 0.5 * Math.cos(Math.PI / 6), y + 0.25);
        total++;
        ordered += Number(top > right + 0.15 && right > left + 0.15);
      }
      expect(total).toBe(p.columns * p.rows);
      expect(ordered).toBe(total);
      // Face areas: classify a fine sweep by tone; each rhombus covers a third of the surface.
      const size = 768;
      const counts = [0, 0, 0];
      let invalid = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          sample((x + 0.5) / size, (y + 0.5) / size, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          const tone = out.color;
          if (tone > 0.78) counts[0]++;
          else if (tone > 0.46) counts[1]++;
          else counts[2]++;
        }
      expect(invalid).toBe(0);
      // The thin dark seams classify with the darkest tone, so top and right are each a
      // third minus their share of the seams (a few percent) and equal to each other.
      const [top, right, left] = counts.map((count) => count / (size * size));
      expect(Math.abs(top - right)).toBeLessThan(0.01);
      expect(top).toBeGreaterThan(0.29);
      expect(top).toBeLessThan(1 / 3);
      expect(left).toBeGreaterThan(1 / 3);
      expect(left).toBeLessThan(0.4);
      // Cubes repeat by one hex across, and by half a hex plus one row diagonally.
      let same = 0,
        probes = 0;
      const kind = (tone: number): number =>
        tone > 0.78 ? 0 : tone > 0.46 ? 1 : 2;
      for (let i = 0; i < 4000; i++) {
        const x = ((i * 0.6180339887) % 1) * width,
          y = ((i * 0.7548776662) % 1) * height;
        probes++;
        same +=
          Number(kind(at(x, y)) === kind(at(x + root3, y))) *
          Number(kind(at(x, y)) === kind(at(x + root3 / 2, y + 1.5)));
      }
      expect(same / probes).toBeGreaterThan(0.99);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('tumblingblocks', 0),
      b = createSurfaceSampler('tumblingblocks', 7),
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

describe('kilimflatweave: four motif bands in weft-faced wool', () => {
  const p = proceduralMaterialPresets.kilimflatweave;
  const n = p.cells;
  const nearest = (color: number): number => {
    let best = 0;
    for (let i = 1; i < p.tones.length; i++)
      if (Math.abs(color - p.tones[i]) < Math.abs(color - p.tones[best]))
        best = i;
    return best;
  };

  it.each(seeds)(
    'weaves symmetric diamonds, zigzags, stripes and crosses on a cell grid with slits at color changes (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('kilimflatweave', seed),
        out = empty(),
        grid = new Uint8Array(n * n),
        at = (cx: number, cy: number, fx: number, fy: number): number => {
          sample((cx + fx) / n, (cy + fy) / n, out);
          return out.color;
        };
      for (let cy = 0; cy < n; cy++)
        for (let cx = 0; cx < n; cx++)
          grid[cy * n + cx] = nearest(at(cx, cy, 0.5, 0.5));
      const cell = (cx: number, cy: number): number =>
        grid[cy * n + (((cx % n) + n) % n)];
      const m = p.motif,
        b = p.band;
      // Band 0: stepped diamonds repeat every motif and mirror in both axes.
      let diamonds = 0,
        diamondChecks = 0;
      const used0 = new Set<number>();
      for (let y = 0; y < b; y++)
        for (let x = 0; x < n; x++) {
          diamondChecks++;
          used0.add(cell(x, y));
          diamonds += Number(
            cell(x, y) === cell(x + m, y) &&
              cell(x, y) ===
                cell(Math.floor(x / m) * m + (m - 1 - (x % m)), y) &&
              cell(x, y) === cell(x, b - 1 - y),
          );
        }
      expect(diamonds).toBe(diamondChecks);
      expect(used0.size).toBeGreaterThanOrEqual(3);
      // Band 1: two alternating colors with period 6 across and down, half of each row in each.
      for (let y = b; y < 2 * b; y++) {
        let first = 0;
        const colors = new Set<number>();
        for (let x = 0; x < n; x++) {
          colors.add(cell(x, y));
          first += Number(cell(x, y) === cell(0, y));
          expect(cell(x, y)).toBe(cell(x + p.zigzag, y));
          if (y + p.zigzag < 2 * b)
            expect(cell(x, y)).toBe(cell(x, y + p.zigzag));
        }
        expect(colors.size).toBe(2);
        expect(first).toBe(n / 2);
      }
      // Band 2: whole-row stripes, palindromic within the band.
      const stripes: number[] = [];
      for (let y = 2 * b; y < 3 * b; y++) {
        const row = cell(0, y);
        for (let x = 0; x < n; x++) expect(cell(x, y)).toBe(row);
        stripes.push(row);
      }
      expect(stripes).toEqual([...stripes].reverse());
      expect(new Set(stripes).size).toBe(4);
      // Band 3: a plus-shaped cross of one color through each motif (44 of 144 cells).
      for (let motif = 0; motif < n / m; motif++) {
        const colors = new Map<number, number>();
        for (let y = 3 * b; y < 4 * b; y++)
          for (let x = motif * m; x < (motif + 1) * m; x++)
            colors.set(cell(x, y), (colors.get(cell(x, y)) ?? 0) + 1);
        expect(colors.get(2)).toBe(44);
      }
      // Slits: a pale cell whose left neighbor has another color is darker at its left edge than
      // in its middle by a wide margin; cells that continue the left color are not.
      let changed = 0,
        slitOk = 0,
        continued = 0,
        flatOk = 0;
      for (let cy = 0; cy < n; cy++)
        for (let cx = 0; cx < n; cx++) {
          const edge = at(cx, cy, 0.05, 0.5),
            middle = at(cx, cy, 0.5, 0.5);
          if (cell(cx - 1, cy) !== cell(cx, cy)) {
            if (cell(cx, cy) >= 1) {
              changed++;
              slitOk += Number(edge < middle - 0.12);
            }
          } else {
            continued++;
            flatOk += Number(Math.abs(edge - middle) < 0.06);
          }
        }
      expect(changed).toBeGreaterThan(100);
      expect(slitOk).toBe(changed);
      expect(flatOk).toBe(continued);
      // Channel ranges.
      let invalid = 0;
      const size = 384;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          sample((x + 0.5) / size, (y + 0.5) / size, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
        }
      expect(invalid).toBe(0);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('kilimflatweave', 0),
      b = createSurfaceSampler('kilimflatweave', 7),
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

describe('ean13barcodes: structurally valid EAN-13 symbols', () => {
  const p = proceduralMaterialPresets.ean13barcodes;
  const total = 2 * p.quiet + 95;
  // The published EAN-13 digit encodings, written out independently of the sampler.
  const left = [
    '0001101',
    '0011001',
    '0010011',
    '0111101',
    '0100011',
    '0110001',
    '0101111',
    '0111011',
    '0110111',
    '0001011',
  ];
  const right = left.map((code) =>
    [...code].map((bit) => (bit === '1' ? '0' : '1')).join(''),
  );
  const mirrored = right.map((code) => [...code].reverse().join(''));
  const firstDigit = [
    'LLLLLL',
    'LLGLGG',
    'LLGGLG',
    'LLGGGL',
    'LGLLGG',
    'LGGLLG',
    'LGGGLL',
    'LGLGLG',
    'LGLGGL',
    'LGGLGL',
  ];

  const readRow = (
    sample: ReturnType<typeof createSurfaceSampler>,
    row: number,
    fy: number,
  ): string => {
    const out = empty();
    let bits = '';
    for (let i = 0; i < total; i++) {
      sample((i + 0.5) / total, (row + fy) / p.rows, out);
      bits += out.color < 0.5 ? '1' : '0';
    }
    return bits;
  };

  it.each(seeds)(
    'prints guards, parity-coded digit groups and a correct check digit on every label (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ean13barcodes', seed),
        seen = new Set<string>();
      for (let row = 0; row < p.rows; row++) {
        const all = readRow(sample, row, 0.5);
        // Quiet zones on both sides are blank paper.
        expect(all.slice(0, p.quiet)).toBe('0'.repeat(p.quiet));
        expect(all.slice(total - p.quiet)).toBe('0'.repeat(p.quiet));
        const bits = all.slice(p.quiet, total - p.quiet);
        expect(bits.length).toBe(95);
        expect(bits.slice(0, 3)).toBe('101');
        expect(bits.slice(45, 50)).toBe('01010');
        expect(bits.slice(92)).toBe('101');
        const digits: number[] = [];
        let pattern = '';
        for (let group = 0; group < 6; group++) {
          const code = bits.slice(3 + group * 7, 10 + group * 7),
            asL = left.indexOf(code),
            asG = mirrored.indexOf(code);
          expect(asL >= 0 !== asG >= 0).toBe(true);
          pattern += asL >= 0 ? 'L' : 'G';
          digits.push(asL >= 0 ? asL : asG);
        }
        const first = firstDigit.indexOf(pattern);
        expect(first).toBeGreaterThanOrEqual(0);
        digits.unshift(first);
        for (let group = 0; group < 6; group++) {
          const code = bits.slice(50 + group * 7, 57 + group * 7);
          expect(right.indexOf(code)).toBeGreaterThanOrEqual(0);
          digits.push(right.indexOf(code));
        }
        expect(digits.length).toBe(13);
        // Check digit: weights 1, 3, 1, 3, ... over all thirteen digits sum to a multiple of 10.
        const sum = digits.reduce(
          (a, d, i) => a + d * (i % 2 === 0 ? 1 : 3),
          0,
        );
        expect(sum % 10).toBe(0);
        seen.add(digits.join(''));
        // Between the bar bottom and the guard bottom only the guard bars are inked.
        const lower = readRow(
          sample,
          row,
          (p.barBottom + p.guardBottom) / 2,
        ).slice(p.quiet, total - p.quiet);
        const guards = bits
          .split('')
          .map((bit, i) =>
            i < 3 || (i >= 45 && i < 50) || i >= 92 ? bit : '0',
          )
          .join('');
        expect(lower).toBe(guards);
      }
      expect(seen.size).toBe(p.rows);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('ean13barcodes', 0),
      b = createSurfaceSampler('ean13barcodes', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(100);
  });
});

describe('morsetape: decodable International Morse words on paper tape', () => {
  const p = proceduralMaterialPresets.morsetape;
  const vocabulary = [
    'SOS',
    'XYZ',
    'CAT',
    'PLAY',
    'HELLO',
    'WORLD',
    'LIGHT',
    'ENGINE',
    'SIGNAL',
    'TEXTURE',
  ];
  // ITU Morse for A-Z, written out independently of the sampler.
  const letters: Record<string, string> = {
    '.-': 'A',
    '-...': 'B',
    '-.-.': 'C',
    '-..': 'D',
    '.': 'E',
    '..-.': 'F',
    '--.': 'G',
    '....': 'H',
    '..': 'I',
    '.---': 'J',
    '-.-': 'K',
    '.-..': 'L',
    '--': 'M',
    '-.': 'N',
    '---': 'O',
    '.--.': 'P',
    '--.-': 'Q',
    '.-.': 'R',
    '...': 'S',
    '-': 'T',
    '..-': 'U',
    '...-': 'V',
    '.--': 'W',
    '-..-': 'X',
    '-.--': 'Y',
    '--..': 'Z',
  };

  /** Decode one tape line from its module-center samples; undefined when the timing is invalid. */
  const decode = (bits: number[]): string | undefined => {
    const runs: { on: boolean; length: number }[] = [];
    for (const bit of bits) {
      const on = bit === 1,
        last = runs[runs.length - 1];
      if (last && last.on === on) last.length++;
      else runs.push({ on, length: 1 });
    }
    // Leading margin, then alternating marks and gaps, then blank tape.
    if (runs[0].on || runs[0].length !== p.margin) return undefined;
    let word = '',
      letter = '';
    for (let i = 1; i < runs.length; i++) {
      const run = runs[i];
      if (run.on) {
        if (run.length === 1) letter += '.';
        else if (run.length === 3) letter += '-';
        else return undefined;
      } else if (i === runs.length - 1) {
        break;
      } else if (run.length === 3) {
        word += letters[letter] ?? '?';
        letter = '';
      } else if (run.length !== 1) return undefined;
    }
    return word + (letters[letter] ?? '?');
  };

  it.each(seeds)(
    'spells vocabulary words with standard dot, dash and gap timing on every line (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('morsetape', seed),
        out = empty(),
        words = new Set<string>();
      for (let row = 0; row < p.rows; row++) {
        const bits: number[] = [];
        for (let i = 0; i < p.modules; i++) {
          sample((i + 0.5) / p.modules, (row + 0.5) / p.rows, out);
          bits.push(out.color < 0.35 ? 1 : 0);
        }
        const word = decode(bits);
        expect(word).toBeDefined();
        expect(vocabulary).toContain(word);
        words.add(word as string);
        // Tape ends blank so the pattern wraps without cutting a mark.
        expect(bits[0]).toBe(0);
        expect(bits[p.modules - 1]).toBe(0);
        // A mark is one module thick: measure its height across the first inked module center.
        const center = bits.indexOf(1);
        let thick = 0;
        const steps = 2000;
        for (let k = 0; k < steps; k++) {
          sample(
            (center + 0.5) / p.modules,
            (row + (k + 0.5) / steps) / p.rows,
            out,
          );
          thick += Number(out.color < 0.35);
        }
        const rowModules = p.modules / p.rows;
        expect(
          Math.abs((thick / steps) * rowModules - 2 * p.markRadius),
        ).toBeLessThan(0.08);
      }
      expect(words.size).toBeGreaterThanOrEqual(3);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('morsetape', 0),
      b = createSurfaceSampler('morsetape', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('sandripples: asymmetric ripple train on an integer wave vector', () => {
  const p = proceduralMaterialPresets.sandripples;
  const n = 256;

  it.each(seeds)(
    'concentrates height energy at the ripple wave vector with a gentle windward and steep lee face (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('sandripples', seed),
        out = empty(),
        height = new Float64Array(n * n);
      let invalid = 0,
        mean = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          height[y * n + x] = out.height / p.relief;
          mean += out.height / p.relief;
        }
      expect(invalid).toBe(0);
      mean /= n * n;
      let power = 0;
      for (const value of height) power += (value - mean) ** 2;
      power /= n * n;
      // Squared DFT magnitude at an integer frequency, normalized so that a real signal's
      // positive-frequency bins sum (times two) to the mean-square value.
      const energy = (kx: number, ky: number): number => {
        let re = 0,
          im = 0;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            const angle =
                (-2 * Math.PI * (kx * (x + 0.5) + ky * (y + 0.5))) / n,
              value = height[y * n + x] - mean;
            re += value * Math.cos(angle);
            im += value * Math.sin(angle);
          }
        return (2 * (re * re + im * im)) / (n * n) ** 2;
      };
      let band = 0;
      for (let dx = -3; dx <= 3; dx++)
        for (let dy = -3; dy <= 3; dy++) band += energy(p.kx + dx, p.ky + dy);
      // The crests bend with the noise, so energy spreads over a few bins around the fundamental.
      expect(band / power).toBeGreaterThan(0.65);
      // Mirror-image and transposed wave vectors carry almost nothing.
      let far = 0;
      for (const [kx, ky] of [
        [p.kx, -p.ky],
        [p.ky, p.kx],
        [30, 3],
        [2, 2],
      ])
        far += energy(kx, ky);
      expect(far / power).toBeLessThan(0.01);
      // Moving along +u height climbs gently for about the windward fraction of the time
      // and falls steeply for the rest.
      let rising = 0,
        moving = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const step = height[y * n + ((x + 1) % n)] - height[y * n + x];
          if (Math.abs(step) < 1e-4) continue;
          moving++;
          rising += Number(step > 0);
        }
      expect(Math.abs(rising / moving - p.windward)).toBeLessThan(0.06);
      expect(rising / moving).toBeGreaterThan(0.6);
    },
  );

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sandripples', 0),
      b = createSurfaceSampler('sandripples', 7),
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

describe('frostpolygons: patterned ground of silt polygons between troughs', () => {
  const p = proceduralMaterialPresets.frostpolygons;

  it.each([...seeds, 1, 2, 3])(
    'closes a trough network around exactly one silt polygon per lattice cell (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('frostpolygons', seed),
        out = empty(),
        n = 1024,
        floor = new Uint8Array(n * n);
      let invalid = 0,
        trough = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          invalid += Number(out.metallic !== 0 || out.mortar !== 0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            invalid += Number(!(value >= 0 && value <= 1));
          const wet = out.occlusion < 0.8;
          trough += Number(wet);
          floor[y * n + x] = wet ? 0 : 1;
        }
      expect(invalid).toBe(0);
      // Troughs cover a modest share of the surface.
      expect(trough / (n * n)).toBeGreaterThan(0.08);
      expect(trough / (n * n)).toBeLessThan(0.22);
      // Everything that is not trough splits into exactly cells^2 polygons (torus connectivity).
      const seen = new Uint8Array(floor.length);
      let polygons = 0,
        smallest = Infinity;
      for (let first = 0; first < floor.length; first++) {
        if (!floor[first] || seen[first]) continue;
        polygons++;
        const queue = [first];
        seen[first] = 1;
        for (let read = 0; read < queue.length; read++) {
          const i = queue[read],
            x = i % n,
            y = Math.floor(i / n);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const j = ((y + dy + n) % n) * n + ((x + dx + n) % n);
            if (floor[j] && !seen[j]) {
              seen[j] = 1;
              queue.push(j);
            }
          }
        }
        smallest = Math.min(smallest, queue.length);
      }
      expect(polygons).toBe(p.cells * p.cells);
      // No sliver: every polygon is a real patch of ground.
      expect(smallest).toBeGreaterThan(
        0.2 * ((n * n) / (p.cells * p.cells)) * 0.5,
      );
    },
  );

  it('rises from the trough through a stony rim to a lower silt core', () => {
    const sample = createSurfaceSampler('frostpolygons', 7),
      out = empty(),
      n = 512,
      height = new Float64Array(n * n),
      distance = new Int32Array(n * n).fill(-1),
      queue: number[] = [];
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        sample((x + 0.5) / n, (y + 0.5) / n, out);
        height[y * n + x] = out.height / p.relief;
        if (out.occlusion < 0.8) {
          distance[y * n + x] = 0;
          queue.push(y * n + x);
        }
      }
    // Distance (in pixels) from the nearest trough pixel by multi-source BFS on the torus.
    for (let read = 0; read < queue.length; read++) {
      const i = queue[read],
        x = i % n,
        y = Math.floor(i / n);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const j = ((y + dy + n) % n) * n + ((x + dx + n) % n);
        if (distance[j] < 0) {
          distance[j] = distance[i] + 1;
          queue.push(j);
        }
      }
    }
    const meanAt = (low: number, high: number): number => {
      let sum = 0,
        count = 0;
      for (let i = 0; i < height.length; i++)
        if (distance[i] >= low && distance[i] <= high) {
          sum += height[i];
          count++;
        }
      expect(count).toBeGreaterThan(500);
      return sum / count;
    };
    const trough = meanAt(0, 0),
      rim = meanAt(4, 10),
      core = meanAt(30, 1000);
    expect(trough).toBeLessThan(0.12);
    expect(rim).toBeGreaterThan(0.58);
    expect(core).toBeLessThan(0.5);
    expect(rim - core).toBeGreaterThan(0.12);
  });

  it('wraps seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('frostpolygons', 0),
      b = createSurfaceSampler('frostpolygons', 7),
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

describe('datamatrixcodes: ECC 200 finder and clock patterns', () => {
  const p = proceduralMaterialPresets.datamatrixcodes;
  const pitch = p.size + 2 * p.quiet,
    modules = p.symbols * pitch;

  it.each(seeds)(
    'draws an L-shaped solid finder, alternating clock track and varied data in every symbol (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('datamatrixcodes', seed),
        out = empty(),
        dark = (col: number, row: number): number => {
          sample((col + 0.5) / modules, (row + 0.5) / modules, out);
          return out.color < 0.5 ? 1 : 0;
        },
        last = p.size - 1,
        patterns = new Set<string>();
      for (let sy = 0; sy < p.symbols; sy++)
        for (let sx = 0; sx < p.symbols; sx++) {
          const at = (col: number, row: number): number =>
            dark(sx * pitch + p.quiet + col, sy * pitch + p.quiet + row);
          let dataDark = 0,
            bits = '';
          for (let i = 0; i < p.size; i++) {
            // Solid L: left column and bottom row.
            expect(at(0, i)).toBe(1);
            expect(at(i, last)).toBe(1);
            // Clock track: top row dark on even columns, right column dark on even steps up from
            // the bottom (so the top-right corner module is light for an even-sized symbol).
            expect(at(i, 0)).toBe(i % 2 === 0 ? 1 : 0);
            expect(at(last, i)).toBe((last - i) % 2 === 0 ? 1 : 0);
          }
          for (let row = 1; row < last; row++)
            for (let col = 1; col < last; col++) {
              const bit = at(col, row);
              dataDark += bit;
              bits += bit;
            }
          const data = (p.size - 2) ** 2;
          expect(Math.abs(dataDark / data - p.dataDensity)).toBeLessThan(0.12);
          patterns.add(bits);
          // Quiet zone around the symbol is paper.
          for (let i = -p.quiet; i <= p.size + p.quiet - 1; i++) {
            expect(at(i, -1)).toBe(0);
            expect(at(-1, i)).toBe(0);
            expect(at(i, p.size)).toBe(0);
            expect(at(p.size, i)).toBe(0);
          }
        }
      expect(patterns.size).toBe(p.symbols * p.symbols);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('datamatrixcodes', 0),
      b = createSurfaceSampler('datamatrixcodes', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('ecgpaper: millimeter grid with PQRST heartbeat traces', () => {
  const p = proceduralMaterialPresets.ecgpaper;
  const rowMillimeters = p.millimeters / p.rows,
    beats = Math.round(p.millimeters / p.beat);

  it.each(seeds)(
    'rules a 1 mm grid with heavier 5 mm lines and draws four beats per row with R, S and T waves (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ecgpaper', seed),
        out = empty(),
        at = (x: number, y: number): number => {
          sample(x / p.millimeters, y / p.millimeters, out);
          return out.color;
        };
      // Grid: sample just above the row's lower edge, where no trace reaches. A line center is
      // darker than the paper midway between lines, and every fifth line is darker still.
      const yClear = rowMillimeters * 0.97;
      let minorOk = 0,
        majorOk = 0,
        majors = 0;
      for (let k = 0; k < p.millimeters; k++) {
        const line = at(k, yClear),
          between = at(k + 0.5, yClear);
        minorOk += Number(line < between - 0.05);
        if (k % p.major === 0) {
          majors++;
          const neighbor = at(k + 1, yClear);
          majorOk += Number(line < neighbor - 0.05);
        }
      }
      expect(minorOk).toBe(p.millimeters);
      expect(majorOk).toBe(majors);
      // Horizontal rules, sampled where the flat start of a beat keeps the trace clear.
      let ruled = 0,
        ruledMajor = 0,
        checked = 0,
        checkedMajor = 0;
      for (let k = 1; k < rowMillimeters; k++) {
        if (Math.abs(k - rowMillimeters / 2) < 2) continue;
        checked++;
        ruled += Number(at(0.5, k) < at(0.5, k + 0.5) - 0.05);
        if (k % p.major === 0) {
          checkedMajor++;
          ruledMajor += Number(at(0.5, k) < at(0.5, k + 1) - 0.05);
        }
      }
      expect(ruled).toBe(checked);
      expect(ruledMajor).toBe(checkedMajor);
      // Trace: scan each row at 8 samples per mm and keep the highest and lowest ink per column.
      const res = 8,
        width = p.millimeters * res;
      for (let row = 0; row < p.rows; row++) {
        const baseline = (row + 0.5) * rowMillimeters,
          top = new Float64Array(width).fill(NaN),
          bottom = new Float64Array(width).fill(NaN);
        for (let xi = 0; xi < width; xi++)
          for (let yi = 0; yi < rowMillimeters * res; yi++) {
            const y = row * rowMillimeters + (yi + 0.5) / res;
            if (at((xi + 0.5) / res, y) < 0.3) {
              if (Number.isNaN(top[xi])) top[xi] = baseline - y;
              bottom[xi] = baseline - y;
            }
          }
        let rWaves = 0;
        for (let beat = 0; beat < beats; beat++) {
          let rHeight = -Infinity,
            rAt = 0,
            sDepth = Infinity,
            sAt = 0,
            tHeight = -Infinity,
            tAt = 0;
          for (
            let xi = beat * p.beat * res;
            xi < (beat + 1) * p.beat * res;
            xi++
          ) {
            const x = (xi + 0.5) / res - beat * p.beat;
            if (top[xi] > rHeight) {
              rHeight = top[xi];
              rAt = x;
            }
            if (bottom[xi] < sDepth) {
              sDepth = bottom[xi];
              sAt = x;
            }
            if (x > 12 && x < 18 && top[xi] > tHeight) {
              tHeight = top[xi];
              tAt = x;
            }
          }
          // The spike is a thin line, so its inked height overshoots the authored amplitude a bit.
          expect(rHeight).toBeGreaterThan(6.5);
          expect(rHeight).toBeLessThan(10);
          expect(Math.abs(rAt - p.waves[2][0])).toBeLessThan(0.5);
          expect(sDepth).toBeLessThan(-1.2);
          expect(sDepth).toBeGreaterThan(-3.2);
          expect(Math.abs(sAt - p.waves[3][0])).toBeLessThan(0.7);
          expect(tHeight).toBeGreaterThan(1.1);
          expect(tHeight).toBeLessThan(2.8);
          expect(Math.abs(tAt - p.waves[4][0])).toBeLessThan(0.8);
          rWaves++;
        }
        expect(rWaves).toBe(beats);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('ecgpaper', 0),
      b = createSurfaceSampler('ecgpaper', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('sheetmusic: five-line staves with notes on the staff grid', () => {
  const p = proceduralMaterialPresets.sheetmusic;
  const s = p.spacing,
    pitch = 1 / p.staves;

  /** Scan down one column; returns ink runs as [startUnits, endUnits] in staff spacings above the bottom line. */
  const runsAt = (
    sample: ReturnType<typeof createSurfaceSampler>,
    u: number,
    staff: number,
    from = -3.5,
    to = 7,
    step = 1 / 32,
  ): [number, number][] => {
    const out = empty(),
      bottomV = (staff + 0.5) * pitch + 2 * s,
      runs: [number, number][] = [];
    let start: number | undefined;
    for (let y = from; y <= to; y += step) {
      sample(u, bottomV - y * s, out);
      if (out.color < 0.35) start ??= y;
      else if (start !== undefined) {
        runs.push([start, y - step]);
        start = undefined;
      }
    }
    if (start !== undefined) runs.push([start, to]);
    return runs;
  };

  it.each(seeds)(
    'rules five equal lines, barlines at measure edges and stems that follow the notation rule (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('sheetmusic', seed),
        out = empty(),
        positions = new Set<number>();
      let ups = 0,
        downs = 0;
      for (let staff = 0; staff < p.staves; staff++) {
        // Staff lines: a column midway between two notes (not on a barline) crosses five short runs.
        const lines = runsAt(
          sample,
          1.5 / p.beats + 2 * s,
          staff,
          -1,
          5,
          1 / 64,
        );
        expect(lines.length).toBe(5);
        lines.forEach(([a, b], i) => {
          expect(Math.abs((a + b) / 2 - i)).toBeLessThan(0.06);
          expect(b - a).toBeLessThan(0.35);
        });
        // Barlines run the staff height at the measure edges; probe their ends and the gap above.
        for (let bar = 0; bar < p.beats / p.barBeats; bar++) {
          const column = (bar * p.barBeats) / p.beats,
            ends = runsAt(sample, column, staff, -1, 5, 1 / 64);
          expect(ends.length).toBe(1);
          expect(ends[0][0]).toBeLessThan(-0.05);
          expect(ends[0][1]).toBeGreaterThan(4.05);
          expect(runsAt(sample, column, staff, 4.5, 7, 1 / 32).length).toBe(0);
        }
        for (let beat = 0; beat < p.beats; beat++) {
          const centerU = (beat + 0.5) / p.beats,
            right = runsAt(sample, centerU + 0.6072 * s, staff),
            left = runsAt(sample, centerU - 0.6072 * s, staff),
            longest = (runs: [number, number][]): [number, number] =>
              runs.reduce(
                (a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a),
                [0, 0],
              );
          const r = longest(right),
            l = longest(left);
          const stemOnRight = r[1] - r[0] > 3,
            stemOnLeft = l[1] - l[0] > 3;
          // Exactly one stem per note.
          expect(stemOnRight !== stemOnLeft).toBe(true);
          // An up stem (right side) ends 3.5 spacings above the head center; a down stem
          // (left side) ends 3.5 below it. Head centers sit on the half-spacing grid.
          const center = stemOnRight
              ? r[1] - p.stemLength
              : l[0] + p.stemLength,
            position = center / 0.5;
          expect(Math.abs(position - Math.round(position))).toBeLessThan(0.2);
          const rounded = Math.round(position);
          expect(rounded).toBeGreaterThanOrEqual(0);
          expect(rounded).toBeLessThanOrEqual(p.maxPosition);
          positions.add(rounded);
          // Notation rule: notes below the middle line have stems up, the rest stems down.
          expect(stemOnRight).toBe(rounded < p.middlePosition);
          if (stemOnRight) ups++;
          else downs++;
          // The head's far flank is inked (ring or filled), on the side opposite the stem.
          sample(
            centerU + (stemOnRight ? -0.55 : 0.55) * s,
            (staff + 0.5) * pitch + 2 * s - rounded * 0.5 * s,
            out,
          );
          expect(out.color).toBeLessThan(0.35);
        }
      }
      expect(positions.size).toBeGreaterThanOrEqual(7);
      expect(ups).toBeGreaterThan(20);
      expect(downs).toBeGreaterThan(20);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sheetmusic', 0),
      b = createSurfaceSampler('sheetmusic', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(30);
  });
});

describe('sudokugrid: conflict-free clues on a 9 x 9 grid with box lines', () => {
  const p = proceduralMaterialPresets.sudokugrid;
  // 3x5 pixel glyphs for 1-9, written out independently of the sampler.
  const glyphs = [
    '010110010010111',
    '111001111100111',
    '111001111001111',
    '101101111001001',
    '111100111001111',
    '111100111101111',
    '111001001010010',
    '111101111101111',
    '111101111001111',
  ];

  it.each([...seeds, 1, 2, 3, 4, 5])(
    'prints decodable clues that never repeat in a row, column or box (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('sudokugrid', seed),
        out = empty(),
        grid: number[][] = [];
      let clues = 0;
      for (let row = 0; row < 9; row++) {
        grid.push([]);
        for (let col = 0; col < 9; col++) {
          let bits = '';
          for (let gy = 0; gy < 5; gy++)
            for (let gx = 0; gx < 3; gx++) {
              sample(
                (col + 0.5 + (gx - 1) * p.pixel) / 9,
                (row + 0.5 + (gy - 2) * p.pixel) / 9,
                out,
              );
              bits += out.color < 0.5 ? '1' : '0';
            }
          if (bits === '0'.repeat(15)) {
            grid[row].push(0);
            continue;
          }
          const digit = glyphs.indexOf(bits) + 1;
          expect(digit).toBeGreaterThanOrEqual(1);
          grid[row].push(digit);
          clues++;
        }
      }
      // Roughly the authored share of cells carries a clue.
      expect(Math.abs(clues / 81 - p.clueChance)).toBeLessThan(0.2);
      const unique = (digits: number[]): boolean => {
        const given = digits.filter((d) => d > 0);
        return new Set(given).size === given.length;
      };
      for (let i = 0; i < 9; i++) {
        expect(unique(grid[i])).toBe(true);
        expect(unique(grid.map((row) => row[i]))).toBe(true);
        const box: number[] = [];
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++)
            box.push(grid[Math.floor(i / 3) * 3 + r][(i % 3) * 3 + c]);
        expect(unique(box)).toBe(true);
      }
    },
  );

  it('rules thin cell lines and thicker box lines at the right places', () => {
    const sample = createSurfaceSampler('sudokugrid', 7),
      out = empty(),
      step = 0.0002,
      width = (center: number, alongU: boolean, cross: number): number => {
        let run = 0;
        for (let t = -0.012; t <= 0.012; t += step) {
          if (alongU) sample(center + t, cross, out);
          else sample(cross, center + t, out);
          run += Number(out.color < 0.5);
        }
        return run * step;
      };
    for (const alongU of [true, false])
      for (let k = 0; k < 9; k++) {
        // A cross position inside a cell, away from digits and from the other line family.
        const measured = width(k / 9, alongU, 0.5 / 9 + 0.012);
        const half = k % 3 === 0 ? p.thickHalf : p.thinHalf;
        expect(Math.abs(measured - (2 * half) / 9)).toBeLessThan(0.0012);
      }
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sudokugrid', 0),
      b = createSurfaceSampler('sudokugrid', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('measuringtape: millimeter scale with numbered centimeters', () => {
  const p = proceduralMaterialPresets.measuringtape;
  const tileMm = p.centimeters * 10,
    stripMm = tileMm / p.strips;
  // 3x5 pixel glyphs for 0-9, written out independently of the sampler.
  const glyphs = [
    '111101101101111',
    '010110010010111',
    '111001111100111',
    '111001111001111',
    '101101111001001',
    '111100111001111',
    '111100111101111',
    '111001001010010',
    '111101111101111',
    '111101111001111',
  ];

  it.each(seeds)(
    'draws ticks of three lengths with the right counts and numbers every centimeter on every strip (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('measuringtape', seed),
        out = empty(),
        dark = (x: number, strip: number, y: number): boolean => {
          sample(x / tileMm, (strip * stripMm + y) / tileMm, out);
          return out.color < 0.3;
        };
      for (let strip = 0; strip < p.strips; strip++) {
        // Count ticks crossing a scan line at depth y: millimeter ticks reach 4 mm, half
        // centimeter ticks 6.4 mm and centimeter ticks 9.2 mm from the top edge of the strip.
        const ticksAt = (y: number): number => {
          // Count dark runs around the seam-free cycle; start from the state at the far end so a
          // tick straddling x = 0 is counted exactly once.
          let runs = 0,
            previous = dark(tileMm - 0.025, strip, y);
          for (let x = 0.025; x < tileMm; x += 0.05) {
            const now = dark(x, strip, y);
            if (now && !previous) runs++;
            previous = now;
          }
          return runs;
        };
        expect(ticksAt(2)).toBe(tileMm);
        expect(ticksAt((p.millimeterLength + p.halfLength) / 2)).toBe(
          tileMm / 5,
        );
        expect(ticksAt((p.halfLength + p.centimeterLength) / 2)).toBe(
          p.centimeters,
        );
        expect(ticksAt(p.centimeterLength + 0.8)).toBe(0);
        // Numbers: centimeter k is written as its decimal digits right of its tick.
        for (let k = 0; k < p.centimeters; k++) {
          const label = String(k);
          let decoded = '';
          for (let g = 0; g < label.length; g++) {
            let bits = '';
            for (let row = 0; row < 5; row++)
              for (let col = 0; col < 3; col++)
                bits += dark(
                  k * 10 + p.digitLeft + (4 * g + col + 0.5) * p.digitPixel,
                  strip,
                  p.digitTop + (row + 0.5) * p.digitPixel,
                )
                  ? '1'
                  : '0';
            const digit = glyphs.indexOf(bits);
            expect(digit).toBeGreaterThanOrEqual(0);
            decoded += digit;
          }
          expect(decoded).toBe(label);
        }
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('measuringtape', 0),
      b = createSurfaceSampler('measuringtape', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('calendarpage: a month laid out on a weekday grid', () => {
  const p = proceduralMaterialPresets.calendarpage;
  // 3x5 pixel glyphs for 0-9, written out independently of the sampler.
  const glyphs = [
    '111101101101111',
    '010110010010111',
    '111001111100111',
    '111001111001111',
    '101101111001001',
    '111100111001111',
    '111100111101111',
    '111001001010010',
    '111101111101111',
    '111101111001111',
  ];

  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 4294967295])(
    'numbers consecutive days from a weekday column through a 28-31 day month with tinted weekends (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('calendarpage', seed),
        out = empty(),
        dark = (col: number, row: number, fx: number, fy: number): boolean => {
          sample((col + fx) / p.columns, (row + fy) / p.rows, out);
          return out.color < 0.3;
        };
      // Read the label of a cell: zero, one or two glyphs, left aligned.
      const read = (col: number, row: number): number | undefined => {
        let text = '';
        for (let g = 0; g < 2; g++) {
          let bits = '';
          for (let line = 0; line < 5; line++)
            for (let c = 0; c < 3; c++)
              bits += dark(
                col,
                row,
                p.numberLeft + (4 * g + c + 0.5) * p.pixel,
                p.numberTop + (line + 0.5) * p.pixel,
              )
                ? '1'
                : '0';
          if (bits === '0'.repeat(15)) break;
          const digit = glyphs.indexOf(bits);
          expect(digit).toBeGreaterThanOrEqual(0);
          text += digit;
        }
        return text === '' ? undefined : Number(text);
      };
      const labels: (number | undefined)[] = [];
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) labels.push(read(col, row));
      const first = labels.findIndex((value) => value !== undefined),
        last =
          labels.length -
          1 -
          [...labels].reverse().findIndex((value) => value !== undefined),
        days = last - first + 1;
      // The month starts on its own weekday column, runs 28-31 days, and numbers increase by one.
      expect(first).toBeLessThan(p.columns);
      expect(days).toBeGreaterThanOrEqual(28);
      expect(days).toBeLessThanOrEqual(31);
      for (let i = 0; i < labels.length; i++)
        expect(labels[i]).toBe(
          i >= first && i <= last ? i - first + 1 : undefined,
        );
      // Weekend columns (first and last) are tinted: compare empty paper at a cell's lower right.
      const paper = (col: number): number => {
        sample((col + 0.9) / p.columns, 0.9 / p.rows + 4 / p.rows, out);
        return out.color;
      };
      const weekday = paper(3);
      expect(paper(0)).toBeLessThan(weekday - 0.05);
      expect(paper(p.columns - 1)).toBeLessThan(weekday - 0.05);
      // Paper grain alone moves the tone by up to about 0.04 between two spots.
      expect(Math.abs(paper(2) - weekday)).toBeLessThan(0.05);
    },
  );

  it('uses more than one weekday start and month length across seeds, stays in range and wraps', () => {
    const starts = new Set<number>(),
      lengths = new Set<number>(),
      out = empty();
    for (let seed = 0; seed < 24; seed++) {
      const sample = createSurfaceSampler('calendarpage', seed);
      let first = -1,
        count = 0;
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          // A day number always inks its top-left pixel block, so look for any ink in the label box.
          let inked = false;
          for (let line = 0; line < 5 && !inked; line++)
            for (let c = 0; c < 7 && !inked; c++) {
              sample(
                (col + p.numberLeft + (c + 0.5) * p.pixel) / p.columns,
                (row + p.numberTop + (line + 0.5) * p.pixel) / p.rows,
                out,
              );
              inked = out.color < 0.3;
            }
          if (inked) {
            if (first < 0) first = row * p.columns + col;
            count++;
          }
        }
      starts.add(first);
      lengths.add(count);
    }
    expect(starts.size).toBeGreaterThanOrEqual(4);
    expect(lengths.size).toBeGreaterThanOrEqual(3);
    const a = createSurfaceSampler('calendarpage', 0),
      b = createSurfaceSampler('calendarpage', 3),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(30);
  });
});

describe('fretboard: equal-tempered frets, graded strings and inlay dots', () => {
  const p = proceduralMaterialPresets.fretboard;
  // Equal temperament: fret n sits at 1 - 2^(-n/12) of the scale; the octave (fret 12) is half the
  // scale, so normalizing by it puts fret 12 at u = 1.
  const fretAt = (n: number): number => (1 - Math.pow(2, -n / 12)) * 2;

  /** Bright runs (color above a threshold) along u or v at a fixed cross position, as [center, width]. */
  const bright = (
    sample: ReturnType<typeof createSurfaceSampler>,
    cross: number,
    alongU: boolean,
    threshold = 0.5,
  ): [number, number][] => {
    const out = empty(),
      n = 20000,
      on: boolean[] = [];
    for (let i = 0; i < n; i++) {
      if (alongU) sample((i + 0.5) / n, cross, out);
      else sample(cross, (i + 0.5) / n, out);
      on.push(out.color > threshold);
    }
    const start = on.findIndex((value, i) => !value && on[(i + 1) % n]),
      runs: [number, number][] = [];
    let length = 0;
    for (let k = 1; k <= n; k++) {
      const i = (start + k) % n;
      if (on[i]) length++;
      else if (length > 0) {
        runs.push([((((start + k - length / 2) % n) + n) % n) / n, length / n]);
        length = 0;
      }
    }
    return runs.sort((a, b) => a[0] - b[0]);
  };

  it.each(seeds)(
    'places frets at the 12-TET positions, six graded strings and inlays at fret midpoints (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('fretboard', seed),
        out = empty();
      // Frets: a scan between strings crosses one thin bright line per fret 0-11.
      const frets = bright(sample, 1 / p.strings, true).filter(
        ([, width]) => width < 0.012,
      );
      expect(frets.length).toBe(p.frets);
      for (let n = 0; n < p.frets; n++) {
        const expected = fretAt(n),
          actual = frets
            .map(([center]) => center)
            .reduce((best, center) => {
              const d = (a: number) =>
                Math.min(Math.abs(a - expected), 1 - Math.abs(a - expected));
              return d(center) < d(best) ? center : best;
            });
        expect(
          Math.min(
            Math.abs(actual - expected),
            1 - Math.abs(actual - expected),
          ),
        ).toBeLessThan(0.003);
      }
      // Frets narrow toward the bridge: successive gaps shrink by the factor 2^(-1/12).
      const centers = frets.map(([center]) => center);
      for (let n = 2; n < p.frets; n++) {
        const gap = centers[n] - centers[n - 1],
          previous = centers[n - 1] - centers[n - 2];
        expect(Math.abs(gap / previous - Math.pow(2, -1 / 12))).toBeLessThan(
          0.01,
        );
      }
      // Strings: a scan along v in the first fret gap meets six bright lines, thicker toward the bass.
      const strings = bright(sample, (fretAt(0) + fretAt(1)) / 2, false, 0.4);
      expect(strings.length).toBe(p.strings);
      strings.forEach(([center, width], i) => {
        expect(Math.abs(center - (i + 0.5) / p.strings)).toBeLessThan(0.003);
        const half =
          p.stringHalfMin +
          ((p.stringHalfMax - p.stringHalfMin) * i) / (p.strings - 1);
        expect(Math.abs(width - 2 * half)).toBeLessThan(0.002);
        if (i > 0) expect(width).toBeGreaterThan(strings[i - 1][1]);
      });
      // Single inlay dots at frets 3, 5, 7 and 9: wide bright runs on the center line.
      const dots = bright(sample, 0.5, true).filter(
        ([, width]) => width > 0.02,
      );
      expect(dots.length).toBe(p.inlayFrets.length);
      p.inlayFrets.forEach((n, i) => {
        expect(
          Math.abs(dots[i][0] - (fretAt(n - 1) + fretAt(n)) / 2),
        ).toBeLessThan(0.003);
        expect(Math.abs(dots[i][1] - 2 * p.inlayRadius)).toBeLessThan(0.004);
      });
      // The double marker at fret 12: one dot above and one below the center line, none on it.
      const doubleU =
        (fretAt(p.doubleInlayFret - 1) + fretAt(p.doubleInlayFret)) / 2;
      for (const offset of [-p.doubleInlayOffset, p.doubleInlayOffset]) {
        sample(doubleU, 0.5 + offset, out);
        expect(out.color).toBeGreaterThan(0.5);
      }
      sample(doubleU, 0.5, out);
      expect(out.color).toBeLessThan(0.4);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('fretboard', 0),
      b = createSurfaceSampler('fretboard', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('crosswordgrid: a rule-abiding symmetric grid with standard numbering', () => {
  const p = proceduralMaterialPresets.crosswordgrid;
  const n = p.size;
  // 3x5 pixel glyphs for 0-9, written out independently of the sampler.
  const glyphs = [
    '111101101101111',
    '010110010010111',
    '111001111100111',
    '111001111001111',
    '101101111001001',
    '111100111001111',
    '111100111101111',
    '111001001010010',
    '111101111101111',
    '111101111001111',
  ];

  it.each([...seeds, 1, 2, 3, 4, 5])(
    'draws a 180-degree symmetric, connected grid with words of at least three letters and standard numbers (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('crosswordgrid', seed),
        out = empty(),
        dark = (col: number, row: number, fx: number, fy: number): boolean => {
          sample((col + fx) / n, (row + fy) / n, out);
          return out.color < 0.3;
        },
        black: boolean[][] = [];
      let blacks = 0;
      for (let row = 0; row < n; row++) {
        black.push([]);
        for (let col = 0; col < n; col++) {
          const isBlack = dark(col, row, 0.5, 0.5);
          black[row].push(isBlack);
          blacks += Number(isBlack);
        }
      }
      expect(blacks / (n * n)).toBeGreaterThan(0.1);
      expect(blacks / (n * n)).toBeLessThan(p.blackTarget + 0.06);
      // 180-degree rotational symmetry.
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++)
          expect(black[row][col]).toBe(black[n - 1 - row][n - 1 - col]);
      // No run of white cells shorter than the minimum, across or down.
      for (let line = 0; line < n; line++)
        for (const across of [true, false]) {
          let run = 0;
          for (let i = 0; i <= n; i++) {
            const isBlack =
              i === n || (across ? black[line][i] : black[i][line]);
            if (isBlack) {
              if (run > 0) expect(run).toBeGreaterThanOrEqual(p.minRun);
              run = 0;
            } else run++;
          }
        }
      // All white cells form one connected region.
      const seen = new Set<number>(),
        stack: number[] = [],
        whites = n * n - blacks,
        first = black.flat().findIndex((cell) => !cell);
      stack.push(first);
      seen.add(first);
      while (stack.length) {
        const cell = stack.pop() as number,
          x = cell % n,
          y = Math.floor(cell / n);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx,
            ny = y + dy;
          if (
            nx < 0 ||
            ny < 0 ||
            nx >= n ||
            ny >= n ||
            black[ny][nx] ||
            seen.has(ny * n + nx)
          )
            continue;
          seen.add(ny * n + nx);
          stack.push(ny * n + nx);
        }
      }
      expect(seen.size).toBe(whites);
      // Numbering: a white cell is numbered when it starts an across or down word, counting in
      // reading order from 1; every other cell shows no number.
      const read = (col: number, row: number): number | undefined => {
        let text = '';
        for (let g = 0; g < 2; g++) {
          let bits = '';
          for (let line = 0; line < 5; line++)
            for (let c = 0; c < 3; c++)
              bits += dark(
                col,
                row,
                p.numberLeft + (4 * g + c + 0.5) * p.pixel,
                p.numberTop + (line + 0.5) * p.pixel,
              )
                ? '1'
                : '0';
          if (bits === '0'.repeat(15)) break;
          const digit = glyphs.indexOf(bits);
          expect(digit).toBeGreaterThanOrEqual(0);
          text += digit;
        }
        return text === '' ? undefined : Number(text);
      };
      let expected = 1;
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          if (black[row][col]) continue;
          const startsAcross =
              (col === 0 || black[row][col - 1]) &&
              col + 1 < n &&
              !black[row][col + 1],
            startsDown =
              (row === 0 || black[row - 1][col]) &&
              row + 1 < n &&
              !black[row + 1][col];
          expect(read(col, row)).toBe(
            startsAcross || startsDown ? expected++ : undefined,
          );
        }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('crosswordgrid', 0),
      b = createSurfaceSampler('crosswordgrid', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      different = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        a((x + 0.5) / 256, (y + 0.5) / 256, one);
        invalid += Number(one.metallic !== 0 || one.mortar !== 0);
        for (const value of [
          one.color,
          one.height / p.relief,
          one.roughness,
          one.occlusion,
        ])
          invalid += Number(!(value >= 0 && value <= 1));
      }
    expect(invalid).toBe(0);
    for (let i = 0; i < 512; i++) {
      const t = (i + 0.37) / 512;
      for (const [u, v] of [
        [t, 0.3101],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});
