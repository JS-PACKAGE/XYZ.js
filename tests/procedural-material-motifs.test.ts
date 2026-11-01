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
