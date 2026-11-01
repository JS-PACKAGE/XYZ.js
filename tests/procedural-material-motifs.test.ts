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
