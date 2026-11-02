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

describe('flipdotdisplay: a dot matrix spelling a grid of digits', () => {
  const p = proceduralMaterialPresets.flipdotdisplay;
  const cellColumns = p.dots / p.digitColumns,
    cellRows = p.dots / p.digitRows;
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
    'lights discs that decode to a digit in every cell with an unlit margin (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('flipdotdisplay', seed),
        out = empty(),
        lit = (col: number, row: number): boolean => {
          sample((col + 0.5) / p.dots, (row + 0.5) / p.dots, out);
          return out.color > 0.5;
        },
        seen = new Set<number>();
      for (let dr = 0; dr < p.digitRows; dr++)
        for (let dc = 0; dc < p.digitColumns; dc++) {
          let bits = '';
          for (let y = 0; y < cellRows; y++)
            for (let x = 0; x < cellColumns; x++) {
              const on = lit(dc * cellColumns + x, dr * cellRows + y);
              if (x < 3 && y < 5) bits += on ? '1' : '0';
              else expect(on).toBe(false);
            }
          const digit = glyphs.indexOf(bits);
          expect(digit).toBeGreaterThanOrEqual(0);
          seen.add(digit);
        }
      expect(seen.size).toBeGreaterThanOrEqual(8);
      // A lit disc is round with the authored radius: measure its width and height through the center.
      const start = (() => {
        for (let row = 0; row < p.dots; row++)
          for (let col = 0; col < p.dots; col++)
            if (lit(col, row)) return { col, row };
        return { col: 0, row: 0 };
      })();
      for (const alongU of [true, false]) {
        let width = 0;
        const step = 0.001;
        for (let t = -0.5; t <= 0.5; t += step) {
          const gu = alongU ? start.col + 0.5 + t : start.col + 0.5,
            gv = alongU ? start.row + 0.5 : start.row + 0.5 + t;
          sample(gu / p.dots, gv / p.dots, out);
          width += Number(out.color > 0.5) * step;
        }
        expect(Math.abs(width - 2 * p.discRadius)).toBeLessThan(0.05);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('flipdotdisplay', 0),
      b = createSurfaceSampler('flipdotdisplay', 7),
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

describe('minesweeperboard: opened cells whose digits are consistent with hidden mines', () => {
  const p = proceduralMaterialPresets.minesweeperboard;
  const n = p.cells;
  // 3x5 pixel glyphs for 1-8, written out independently of the sampler.
  const glyphs = [
    '010110010010111',
    '111001111100111',
    '111001111001111',
    '101101111001001',
    '111100111001111',
    '111100111101111',
    '111001001010010',
    '111101111101111',
  ];

  it.each([...seeds, 1, 2, 3])(
    'opens cells whose zero and digit values are satisfiable by mines among the unopened neighbors (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('minesweeperboard', seed),
        out = empty(),
        wrap = (value: number): number => ((value % n) + n) % n,
        open: boolean[] = [],
        value: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          sample((col + 0.5) / n, (row + 0.5) / n, out);
          // Unopened cells are raised buttons; opened ones lie flat.
          const flat = out.height / p.relief < 0.55;
          open.push(flat);
          let digit = 0;
          if (flat) {
            let bits = '';
            for (let line = 0; line < 5; line++)
              for (let c = 0; c < 3; c++) {
                sample(
                  (col + 0.5 + (c - 1) * p.pixel) / n,
                  (row + 0.5 + (line - 2) * p.pixel) / n,
                  out,
                );
                bits += out.color < 0.3 ? '1' : '0';
              }
            if (bits !== '0'.repeat(15)) {
              const index = glyphs.indexOf(bits);
              expect(index).toBeGreaterThanOrEqual(0);
              digit = index + 1;
            }
          }
          value.push(digit);
        }
      const openCount = open.filter(Boolean).length;
      expect(openCount / (n * n)).toBeGreaterThan(0.12);
      expect(openCount / (n * n)).toBeLessThan(0.75);
      const neighbors = (cell: number): number[] => {
        const x = cell % n,
          y = Math.floor(cell / n),
          list: number[] = [];
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (dx !== 0 || dy !== 0)
              list.push(wrap(y + dy) * n + wrap(x + dx));
        return list;
      };
      const forced = new Set<number>();
      for (let cell = 0; cell < n * n; cell++) {
        if (!open[cell]) continue;
        const hidden = neighbors(cell).filter((other) => !open[other]);
        if (value[cell] === 0) {
          // A zero opens all of its neighbors.
          expect(hidden.length).toBe(0);
        } else {
          // The digit counts mines, which can only sit on unopened cells.
          expect(hidden.length).toBeGreaterThanOrEqual(value[cell]);
          if (hidden.length === value[cell])
            hidden.forEach((other) => forced.add(other));
        }
      }
      // A cell that must be a mine counts toward every opened neighbor's digit, never beyond it.
      for (let cell = 0; cell < n * n; cell++) {
        if (!open[cell] || value[cell] === 0) continue;
        expect(
          neighbors(cell).filter((other) => forced.has(other)).length,
        ).toBeLessThanOrEqual(value[cell]);
      }
      expect(new Set(value).size).toBeGreaterThanOrEqual(4);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('minesweeperboard', 0),
      b = createSurfaceSampler('minesweeperboard', 7),
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

describe('tetrisstack: pieces that are real tetrominoes with one tone per kind', () => {
  const p = proceduralMaterialPresets.tetrisstack;
  const n = p.cells;
  // Canonical form of a cell set under the four quarter-turn rotations (reflections are different pieces).
  const canonical = (cells: [number, number][]): string => {
    let best = '';
    let current = cells;
    for (let turn = 0; turn < 4; turn++) {
      current = current.map(([x, y]) => [-y, x] as [number, number]);
      const minX = Math.min(...current.map((c) => c[0])),
        minY = Math.min(...current.map((c) => c[1])),
        key = current
          .map(([x, y]) => `${x - minX},${y - minY}`)
          .sort()
          .join(';');
      if (best === '' || key < best) best = key;
    }
    return best;
  };
  // The seven tetrominoes, written out independently of the sampler.
  const known = new Map<string, string>(
    (
      [
        [
          'I',
          [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
          ],
        ],
        [
          'O',
          [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ],
        ],
        [
          'T',
          [
            [0, 0],
            [1, 0],
            [2, 0],
            [1, 1],
          ],
        ],
        [
          'S',
          [
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
          ],
        ],
        [
          'Z',
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [2, 1],
          ],
        ],
        [
          'J',
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [2, 1],
          ],
        ],
        [
          'L',
          [
            [2, 0],
            [0, 1],
            [1, 1],
            [2, 1],
          ],
        ],
      ] as [string, [number, number][]][]
    ).map(([name, cells]) => [canonical(cells), name]),
  );

  it.each([...seeds, 1, 2, 3])(
    'separates the stack into four-cell pieces of the seven tetromino shapes, each shape in its own tone (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('tetrisstack', seed),
        out = empty(),
        center: number[] = [],
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        };
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++)
          center.push(at((col + 0.5) / n, (row + 0.5) / n));
      const occupied = center.map((c) => c > 0.12);
      expect(occupied.filter(Boolean).length / (n * n)).toBeGreaterThan(0.4);
      // Join neighboring cells when the edge between them is unbroken (no outline).
      const parent = Array.from({ length: n * n }, (_, i) => i);
      const find = (i: number): number =>
        parent[i] === i ? i : (parent[i] = find(parent[i]));
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const a = row * n + col;
          if (!occupied[a]) continue;
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ]) {
            const x = col + dx,
              y = row + dy;
            if (x >= n || y >= n) continue;
            const b = y * n + x;
            if (!occupied[b]) continue;
            const edge = at(
              (col + 0.5 + dx * 0.5) / n,
              (row + 0.5 + dy * 0.5) / n,
            );
            if (edge > 0.6 * Math.min(center[a], center[b]))
              parent[find(a)] = find(b);
          }
        }
      const groups = new Map<number, number[]>();
      for (let i = 0; i < n * n; i++)
        if (occupied[i])
          groups.set(find(i), [...(groups.get(find(i)) ?? []), i]);
      const toneOf = new Map<string, number[]>();
      for (const members of groups.values()) {
        expect(members.length).toBe(4);
        const shape = known.get(
          canonical(
            members.map((i) => [i % n, Math.floor(i / n)] as [number, number]),
          ),
        );
        expect(shape).toBeDefined();
        const mean = members.reduce((sum, i) => sum + center[i], 0) / 4;
        toneOf.set(shape as string, [
          ...(toneOf.get(shape as string) ?? []),
          mean,
        ]);
      }
      // One tone per shape and distinct tones across shapes.
      const means: number[] = [];
      for (const tones of toneOf.values()) {
        expect(Math.max(...tones) - Math.min(...tones)).toBeLessThan(0.07);
        means.push(tones.reduce((a, b) => a + b, 0) / tones.length);
      }
      means.sort((a, b) => a - b);
      for (let i = 1; i < means.length; i++)
        expect(means[i] - means[i - 1]).toBeGreaterThan(0.06);
      expect(toneOf.size).toBeGreaterThanOrEqual(5);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('tetrisstack', 0),
      b = createSurfaceSampler('tetrisstack', 7),
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

describe('battleshipgrid: a legal fleet on a 10 x 10 board with shot pegs', () => {
  const p = proceduralMaterialPresets.battleshipgrid;
  const n = p.cells;

  it.each([...seeds, 1, 2, 3, 4, 5])(
    'lays out the five standard ships as straight, separate lines with hits only on ships (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('battleshipgrid', seed),
        out = empty(),
        kind: ('water' | 'ship' | 'miss')[] = [];
      let hits = 0,
        misses = 0;
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          sample((col + 0.5) / n, (row + 0.5) / n, out);
          const tone = out.color;
          // Water is mid-light, hull dark (a hit peg is darker still), a miss peg nearly white.
          const isShip = tone < 0.45,
            isMiss = tone > 0.9;
          kind.push(isShip ? 'ship' : isMiss ? 'miss' : 'water');
          hits += Number(tone < 0.15);
          misses += Number(isMiss);
        }
      // Hull cells separate into exactly five 8-connected groups: ships never touch, even at corners.
      const group = new Array<number>(n * n).fill(-1);
      const groups: number[][] = [];
      for (let start = 0; start < n * n; start++) {
        if (kind[start] !== 'ship' || group[start] >= 0) continue;
        const members: number[] = [],
          stack = [start];
        group[start] = groups.length;
        while (stack.length) {
          const cell = stack.pop() as number;
          members.push(cell);
          const x = cell % n,
            y = Math.floor(cell / n);
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx,
                ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
              const next = ny * n + nx;
              if (kind[next] === 'ship' && group[next] < 0) {
                group[next] = groups.length;
                stack.push(next);
              }
            }
        }
        groups.push(members);
      }
      expect(groups.length).toBe(5);
      // Each ship is a straight, gap-free line; the lengths are the classic 5, 4, 3, 3, 2.
      const lengths = groups.map((members) => {
        const xs = members.map((c) => c % n),
          ys = members.map((c) => Math.floor(c / n)),
          width = Math.max(...xs) - Math.min(...xs) + 1,
          height = Math.max(...ys) - Math.min(...ys) + 1;
        expect(Math.min(width, height)).toBe(1);
        expect(Math.max(width, height)).toBe(members.length);
        return members.length;
      });
      expect(lengths.sort((a, b) => a - b)).toEqual([2, 3, 3, 4, 5]);
      // Both kinds of peg appear, and shots cover roughly the authored share of cells.
      expect(hits).toBeGreaterThan(0);
      expect(misses).toBeGreaterThan(0);
      expect(Math.abs((hits + misses) / (n * n) - p.shotChance)).toBeLessThan(
        0.15,
      );
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('battleshipgrid', 0),
      b = createSurfaceSampler('battleshipgrid', 7),
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

describe('hilbertcurve: a space-filling path through every cell', () => {
  const p = proceduralMaterialPresets.hilbertcurve;
  const n = 1 << p.order,
    total = n * n;
  // The standard Hilbert index -> (x, y) conversion, written out independently of the sampler.
  const indexOf = new Int32Array(total);
  const positionOf: [number, number][] = [];
  for (let d = 0; d < total; d++) {
    let x = 0,
      y = 0,
      t = d;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & (t / 2),
        ry = 1 & (t ^ rx);
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        [x, y] = [y, x];
      }
      x += s * rx;
      y += s * ry;
      t = Math.floor(t / 4);
    }
    indexOf[y * n + x] = d;
    positionOf.push([x, y]);
  }

  it.each(seeds)(
    'inks exactly the unit steps between consecutive curve cells, with a tone ramp along the path (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hilbertcurve', seed),
        out = empty(),
        inked = (gx: number, gy: number): boolean => {
          sample(gx / n, gy / n, out);
          return out.color < 0.75;
        };
      // Every cell center carries ink, and its tone climbs with the curve index.
      const tones: number[] = [],
        indices: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          expect(inked(col + 0.5, row + 0.5)).toBe(true);
          tones.push(out.color);
          indices.push(indexOf[row * n + col]);
        }
      const mean = (values: number[]): number =>
          values.reduce((a, b) => a + b, 0) / values.length,
        mt = mean(tones),
        mi = mean(indices);
      let covariance = 0,
        varianceTone = 0,
        varianceIndex = 0;
      tones.forEach((tone, i) => {
        covariance += (tone - mt) * (indices[i] - mi);
        varianceTone += (tone - mt) ** 2;
        varianceIndex += (indices[i] - mi) ** 2;
      });
      expect(
        covariance / Math.sqrt(varianceTone * varianceIndex),
      ).toBeGreaterThan(0.95);
      // Between two neighboring cell centers there is ink exactly when their indices are consecutive.
      let connected = 0;
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++)
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ]) {
            const x = col + dx,
              y = row + dy;
            if (x >= n || y >= n) continue;
            const consecutive =
              Math.abs(indexOf[row * n + col] - indexOf[y * n + x]) === 1;
            expect(inked(col + 0.5 + dx * 0.5, row + 0.5 + dy * 0.5)).toBe(
              consecutive,
            );
            connected += Number(consecutive);
          }
      // A single path through all cells has total - 1 links between consecutive cells.
      expect(connected).toBe(total - 1);
      // The curve starts at the top-left cell and ends at the top-right cell and runs off the tile
      // edge there, so repeated tiles join into one curve; no other edge cell reaches the border.
      expect(positionOf[0]).toEqual([0, 0]);
      expect(positionOf[total - 1]).toEqual([n - 1, 0]);
      expect(inked(0.25, 0.5)).toBe(true);
      expect(inked(n - 0.25, 0.5)).toBe(true);
      for (let i = 1; i < n; i++) {
        expect(inked(0.25, i + 0.5)).toBe(false);
        expect(inked(n - 0.25, i + 0.5)).toBe(false);
        expect(inked(i + 0.5, 0.25)).toBe(false);
        expect(inked(i + 0.5, n - 0.25)).toBe(false);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hilbertcurve', 0),
      b = createSurfaceSampler('hilbertcurve', 7),
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

describe('mondriancomposition: a rectangular partition framed by black lines', () => {
  const p = proceduralMaterialPresets.mondriancomposition;

  it.each([...seeds, 1, 2, 3, 4, 5])(
    'divides the canvas into rectangles, each filled with one of the authored tones (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mondriancomposition', seed),
        out = empty(),
        n = 512,
        color = new Float64Array(n * n),
        line = new Uint8Array(n * n);
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
          line[y * n + x] = Number(out.color < 0.2);
        }
      expect(invalid).toBe(0);
      const seen = new Uint8Array(n * n),
        fills = new Set<number>();
      let regions = 0;
      for (let first = 0; first < n * n; first++) {
        if (line[first] || seen[first]) continue;
        regions++;
        const queue = [first];
        seen[first] = 1;
        const members: number[] = queue;
        let minX = n,
          maxX = 0,
          minY = n,
          maxY = 0;
        for (let read = 0; read < queue.length; read++) {
          const i = queue[read],
            x = i % n,
            y = Math.floor(i / n);
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
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
            const j = ny * n + nx;
            if (!line[j] && !seen[j]) {
              seen[j] = 1;
              queue.push(j);
            }
          }
        }
        // A rectangle fills its bounding box. Anti-aliased line edges leave a ragged pixel or two
        // along the boundary, so inspect the box shrunk by 3 px: it must be completely filled
        // (an L-shaped region would leave a large notch inside).
        const inset = 3;
        let core = 0,
          sum = 0,
          sumSquares = 0;
        for (const i of members) {
          const x = i % n,
            y = Math.floor(i / n);
          if (
            x >= minX + inset &&
            x <= maxX - inset &&
            y >= minY + inset &&
            y <= maxY - inset
          ) {
            core++;
            sum += color[i];
            sumSquares += color[i] ** 2;
          }
        }
        expect(core).toBe(
          Math.max(0, maxX - minX + 1 - 2 * inset) *
            Math.max(0, maxY - minY + 1 - 2 * inset),
        );
        const mean = sum / core;
        expect(
          Math.sqrt(Math.max(0, sumSquares / core - mean * mean)),
        ).toBeLessThan(0.08);
        // The fill matches one of the authored tones.
        const nearest = p.tones.reduce((best, tone) =>
          Math.abs(tone - mean) < Math.abs(best - mean) ? tone : best,
        );
        expect(Math.abs(nearest - mean)).toBeLessThan(0.08);
        fills.add(nearest);
      }
      expect(regions).toBeGreaterThanOrEqual(5);
      expect(regions).toBeLessThanOrEqual(40);
      expect(fills.size).toBeGreaterThanOrEqual(2);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mondriancomposition', 0),
      b = createSurfaceSampler('mondriancomposition', 7),
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
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('lissajousgrid: curves with frequencies a = column + 1 and b = row + 1', () => {
  const p = proceduralMaterialPresets.lissajousgrid;
  const n = p.cells;

  it.each(seeds)(
    'inks exactly the analytic Lissajous curve of every cell and nothing else (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('lissajousgrid', seed),
        out = empty();
      // Independent dense polyline of x = A sin(a t + phase), y = A sin(b t) per cell, in tile units.
      const dense = 2000;
      const curve = (col: number, row: number): Float64Array => {
        const points = new Float64Array(dense * 2);
        for (let i = 0; i < dense; i++) {
          const t = (2 * Math.PI * i) / dense;
          points[2 * i] =
            (col + 0.5 + p.amplitude * Math.sin((col + 1) * t + p.phase)) / n;
          points[2 * i + 1] =
            (row + 0.5 + p.amplitude * Math.sin((row + 1) * t)) / n;
        }
        return points;
      };
      let onCurveInked = 0,
        onCurveTotal = 0,
        stray = 0,
        inkPixels = 0;
      const size = 384;
      const ink = new Uint8Array(size * size);
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          sample((x + 0.5) / size, (y + 0.5) / size, out);
          ink[y * size + x] = Number(out.color > 0.6);
          expect(out.metallic).toBe(0);
          expect(out.mortar).toBe(0);
          for (const value of [
            out.color,
            out.height / p.relief,
            out.roughness,
            out.occlusion,
          ])
            expect(value >= 0 && value <= 1).toBe(true);
        }
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const points = curve(col, row);
          // Points on the analytic curve are inked (sampled on the pixel grid, not between pixels).
          for (let i = 0; i < dense; i += 40) {
            const x = Math.floor(points[2 * i] * size),
              y = Math.floor(points[2 * i + 1] * size);
            onCurveTotal++;
            onCurveInked += ink[y * size + x];
          }
          // Every inked pixel in this cell lies close to the curve.
          const x0 = Math.floor((col * size) / n),
            y0 = Math.floor((row * size) / n);
          for (let y = y0; y < y0 + size / n; y++)
            for (let x = x0; x < x0 + size / n; x++) {
              if (!ink[y * size + x]) continue;
              inkPixels++;
              const px = (x + 0.5) / size,
                py = (y + 0.5) / size;
              // lineHalf is in cells; allow slack for pixel size and the polyline spacing.
              const limit = p.lineHalf / n + 2 / size;
              let close = false;
              for (let i = 0; i < dense && !close; i++)
                close =
                  Math.hypot(points[2 * i] - px, points[2 * i + 1] - py) <=
                  limit;
              stray += Number(!close);
            }
        }
      expect(onCurveInked / onCurveTotal).toBeGreaterThan(0.99);
      expect(stray / inkPixels).toBeLessThan(0.01);
      expect(inkPixels).toBeGreaterThan(5000);
    },
    30_000,
  );

  it('repeats seamlessly and differs between seeds only in the panel grain', () => {
    const a = createSurfaceSampler('lissajousgrid', 0),
      b = createSurfaceSampler('lissajousgrid', 7),
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
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('zoneplates: Fresnel zone rings at radii proportional to sqrt(k)', () => {
  const p = proceduralMaterialPresets.zoneplates;
  const radiusOf = (k: number): number => p.radius * Math.sqrt(k / p.zones);

  it.each(seeds)(
    'puts the k-th ring boundary at R sqrt(k / N) in every direction of every plate, starting open at the center (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('zoneplates', seed),
        out = empty();
      for (let plateY = 0; plateY < p.plates; plateY++)
        for (let plateX = 0; plateX < p.plates; plateX++) {
          const colorAt = (r: number, angle: number): number => {
            sample(
              (plateX + 0.5 + r * Math.cos(angle)) / p.plates,
              (plateY + 0.5 + r * Math.sin(angle)) / p.plates,
              out,
            );
            return out.color;
          };
          expect(colorAt(0, 0)).toBeGreaterThan(0.7);
          for (const angle of [
            0,
            Math.PI / 4,
            Math.PI / 2,
            (5 * Math.PI) / 6,
            (3 * Math.PI) / 2,
          ]) {
            // Radial scan: record where the tone crosses 0.3 (zone edges, and the opaque last
            // zone meeting the mid-gray mount).
            const crossings: number[] = [];
            const step = 0.0005;
            let previous = colorAt(0, angle) < 0.3;
            for (let r = step; r < p.radius + 0.01; r += step) {
              const now = colorAt(r, angle) < 0.3;
              if (now !== previous) crossings.push(r - step / 2);
              previous = now;
            }
            expect(crossings.length).toBe(p.zones);
            crossings.forEach((radius, index) =>
              expect(Math.abs(radius - radiusOf(index + 1))).toBeLessThan(
                0.004,
              ),
            );
            // The squared radii grow linearly with the zone number: equal area per zone.
            for (let k = 1; k < crossings.length; k++) {
              const area = crossings[k] ** 2 - crossings[k - 1] ** 2;
              expect(Math.abs(area - p.radius ** 2 / p.zones)).toBeLessThan(
                0.0035,
              );
            }
          }
        }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('zoneplates', 0),
      b = createSurfaceSampler('zoneplates', 7),
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

describe('backgammonboard: twenty-four alternating points and legal checker stacks', () => {
  const p = proceduralMaterialPresets.backgammonboard;
  const halfPoints = p.pointsPerSide / 2,
    inner = 1 - 2 * p.frame,
    halfWidth = (inner - p.barWidth) / 2,
    pointWidth = halfWidth / halfPoints,
    radius = pointWidth * p.checkerFill;
  /** Center of a point's base in board coordinates: x across, and the y of the board edge it sits on. */
  const pointX = (column: number): number =>
    p.frame +
    (column < halfPoints
      ? (column + 0.5) * pointWidth
      : halfWidth + p.barWidth + (column - halfPoints + 0.5) * pointWidth);

  it.each([...seeds, 1, 2, 3, 4, 5])(
    'alternates point tones and holds fifteen checkers per color in same-color stacks of at most five (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('backgammonboard', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        };
      let light = 0,
        dark = 0;
      for (let point = 0; point < 2 * p.pointsPerSide; point++) {
        const top = point < p.pointsPerSide,
          column = point % p.pointsPerSide,
          u = pointX(column),
          states: ('light' | 'dark' | 'empty')[] = [];
        for (let j = 0; j < p.maxStack + 1; j++) {
          const along = radius + 2 * radius * j,
            v = top ? p.frame + along : 1 - p.frame - along,
            tone = at(u, v);
          states.push(tone > 0.75 ? 'light' : tone < 0.18 ? 'dark' : 'empty');
        }
        // A stack starts at the board edge with no gaps, holds one color and respects the limit.
        const height = states.filter((state) => state !== 'empty').length;
        expect(height).toBeLessThanOrEqual(p.maxStack);
        states.forEach((state, j) =>
          expect(state !== 'empty').toBe(j < height),
        );
        if (height > 0) {
          for (let j = 1; j < height; j++) expect(states[j]).toBe(states[0]);
          if (states[0] === 'light') light += height;
          else dark += height;
        }
      }
      expect(light).toBe(p.checkers);
      expect(dark).toBe(p.checkers);
      // Point tones alternate along each side, and the opposite side is offset by one point.
      // Sample near the apex, above the tallest possible stack of five checkers.
      const pointTone = (top: boolean, column: number): number =>
        at(
          pointX(column),
          top ? p.frame + inner * 0.36 : p.frame + inner * 0.64,
        );
      for (let column = 0; column < p.pointsPerSide; column++) {
        const here = pointTone(true, column),
          opposite = pointTone(false, column);
        expect(Math.abs(here - opposite)).toBeGreaterThan(0.1);
        if (column + 1 < p.pointsPerSide) {
          expect(Math.abs(here - pointTone(true, column + 1))).toBeGreaterThan(
            0.1,
          );
          expect(Math.abs(here - pointTone(false, column + 1))).toBeLessThan(
            0.06,
          );
        }
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('backgammonboard', 0),
      b = createSurfaceSampler('backgammonboard', 7),
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

describe('jigsawpuzzle: interlocking pieces on a torus', () => {
  const p = proceduralMaterialPresets.jigsawpuzzle;
  const cells = p.cells;

  it.each([...seeds, 1, 2, 3])(
    'cuts the surface into exactly one piece per cell, each of about equal area, with bulbs that shift area between neighbors (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('jigsawpuzzle', seed),
        out = empty(),
        n = 480,
        solid = new Uint8Array(n * n);
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
          // Cut lines sit low; piece faces stand high.
          solid[y * n + x] = Number(out.height / p.relief > 0.45);
        }
      expect(invalid).toBe(0);
      const id = new Int32Array(n * n).fill(-1),
        areas: number[] = [];
      for (let first = 0; first < n * n; first++) {
        if (!solid[first] || id[first] >= 0) continue;
        const piece = areas.length,
          queue = [first];
        id[first] = piece;
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
            if (solid[j] && id[j] < 0) {
              id[j] = piece;
              queue.push(j);
            }
          }
        }
        areas.push(queue.length);
      }
      // One piece per cell on the torus, and the cell centers all belong to different pieces.
      expect(areas.length).toBe(cells * cells);
      const centers = new Set<number>();
      for (let row = 0; row < cells; row++)
        for (let col = 0; col < cells; col++)
          centers.add(
            id[
              Math.floor(((row + 0.5) * n) / cells) * n +
                Math.floor(((col + 0.5) * n) / cells)
            ],
          );
      expect(centers.size).toBe(cells * cells);
      // Bulbs move area between neighbors but keep every piece close to one cell. A piece whose
      // bulbs and sockets cancel (two out, two in) keeps its plain cell area, which happens for
      // about 38% of pieces, so well over a third of them must differ visibly.
      const mean = areas.reduce((a, b) => a + b, 0) / areas.length;
      for (const area of areas) {
        expect(area / mean).toBeGreaterThan(0.7);
        expect(area / mean).toBeLessThan(1.3);
      }
      expect(
        areas.filter((area) => Math.abs(area / mean - 1) > 0.03).length,
      ).toBeGreaterThan(12);
    },
  );

  it('keeps repeating seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('jigsawpuzzle', 0),
      b = createSurfaceSampler('jigsawpuzzle', 7),
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

describe('ramennoodles: wavy strands with a rounded tube profile', () => {
  const p = proceduralMaterialPresets.ramennoodles;
  const n = p.strands;
  // Strand i: y = (i + 0.5) / n + A sin(2 pi (k u + phase)) with k cycling through the harmonics
  // and golden-ratio phases (the same for every seed).
  const strandY = (i: number, u: number): number =>
    (i + 0.5) / n +
    p.amplitude *
      Math.sin(
        2 *
          Math.PI *
          (p.harmonics[i % p.harmonics.length] * u +
            ((i * 0.6180339887498949) % 1)),
      );
  const strandSlope = (i: number, u: number): number => {
    const k = p.harmonics[i % p.harmonics.length];
    return (
      p.amplitude *
      2 *
      Math.PI *
      k *
      Math.cos(2 * Math.PI * (k * u + ((i * 0.6180339887498949) % 1)))
    );
  };
  /** Vertical-wrapped first-order distance from a point to strand j. */
  const distance = (j: number, u: number, v: number): number =>
    Math.abs(((v - strandY(j, u) + 1.5) % 1) - 0.5) /
    Math.sqrt(1 + strandSlope(j, u) ** 2);

  it.each(seeds)(
    'shows a rounded tube profile wherever a strand lies on top, and some broth between strands (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ramennoodles', seed),
        out = empty(),
        normalizedHeight = (u: number, v: number): number => {
          sample(u, ((v % 1) + 1) % 1, out);
          return out.height / p.relief;
        };
      let center = 0,
        flank = 0,
        checked = 0;
      // Later strands lie on top, so a strand shows its own profile wherever no later strand
      // reaches the probed point; the pile is dense, so use those stretches only.
      const onTop = (i: number, u: number, v: number): boolean => {
        for (let j = i + 1; j < n; j++)
          if (distance(j, u, v) < p.halfWidth) return false;
        return true;
      };
      for (let i = 0; i < n; i++)
        for (let k = 0; k < 400; k++) {
          const u = (k + 0.37) / 400,
            y = strandY(i, u),
            scale = Math.sqrt(1 + strandSlope(i, u) ** 2),
            probe = y + 0.7 * p.halfWidth * scale;
          if (!onTop(i, u, y) || !onTop(i, u, probe)) continue;
          checked++;
          // A tube: full height on the center line, lower at 0.7 of the half width.
          center += Number(
            Math.abs(normalizedHeight(u, y) - p.strandHeight) < 0.03,
          );
          const round = Math.sqrt(1 - 0.49),
            expected =
              p.brothHeight +
              (p.strandHeight - p.brothHeight) *
                (p.roundness + (1 - p.roundness) * round);
          flank += Number(
            Math.abs(normalizedHeight(u, probe) - expected) < 0.03,
          );
        }
      expect(checked).toBeGreaterThan(300);
      expect(center / checked).toBeGreaterThan(0.98);
      expect(flank / checked).toBeGreaterThan(0.98);
      // Broth shows through the gaps between strands: about 7% of the surface (measured) is at broth level.
      let gaps = 0;
      const size = 256;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
          gaps += Number(
            normalizedHeight((x + 0.5) / size, (y + 0.5) / size) <
              p.brothHeight + 0.02,
          );
      expect(gaps / (size * size)).toBeGreaterThan(0.04);
      expect(gaps / (size * size)).toBeLessThan(0.14);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds in tone only', () => {
    const a = createSurfaceSampler('ramennoodles', 0),
      b = createSurfaceSampler('ramennoodles', 7),
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
        expect(two.height).toBeCloseTo(one.height, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(50);
  });
});

describe('connectfourboard: a reachable mid-game position without a finished line', () => {
  const p = proceduralMaterialPresets.connectfourboard;
  const total = p.rows + 1;

  it.each([...seeds, 1, 2, 3, 4, 5, 6, 7, 8])(
    'drops discs from the bottom in alternating turns with no four in a row (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('connectfourboard', seed),
        out = empty(),
        grid: number[][] = [];
      // 0 = empty hole, 1 = mid-tone disc (first player), 2 = light disc (second player).
      for (let row = 0; row < p.rows; row++) {
        grid.push([]);
        for (let col = 0; col < p.columns; col++) {
          sample((col + 0.5) / p.columns, (row + 0.5) / total, out);
          const tone = out.color;
          grid[row].push(
            tone < 0.15
              ? 0
              : tone > 0.8
                ? 2
                : tone > 0.38 && tone < 0.62
                  ? 1
                  : -1,
          );
          expect(grid[row][col]).toBeGreaterThanOrEqual(0);
        }
      }
      // Gravity: in every column the discs form an unbroken stack resting on the bottom row.
      let first = 0,
        second = 0;
      for (let col = 0; col < p.columns; col++) {
        let seen = false;
        for (let row = 0; row < p.rows; row++) {
          if (grid[row][col] !== 0) seen = true;
          else expect(seen).toBe(false);
        }
        for (let row = 0; row < p.rows; row++) {
          first += Number(grid[row][col] === 1);
          second += Number(grid[row][col] === 2);
        }
      }
      // The first player moves first, so they have as many discs or exactly one more.
      expect(first - second).toBeGreaterThanOrEqual(0);
      expect(first - second).toBeLessThanOrEqual(1);
      expect(first + second).toBeGreaterThanOrEqual(p.movesMin - 2);
      expect(first + second).toBeLessThanOrEqual(p.movesMax);
      // Nobody has completed four in a row in any direction.
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          const who = grid[row][col];
          if (who === 0) continue;
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1],
          ]) {
            let run = 1;
            for (let step = 1; step < 4; step++) {
              const x = col + dx * step,
                y = row + dy * step;
              if (
                x < 0 ||
                y < 0 ||
                x >= p.columns ||
                y >= p.rows ||
                grid[y][x] !== who
              )
                break;
              run++;
            }
            expect(run).toBeLessThan(4);
          }
        }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('connectfourboard', 0),
      b = createSurfaceSampler('connectfourboard', 7),
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

describe('bingocard: a standard BINGO card', () => {
  const p = proceduralMaterialPresets.bingocard;
  const n = p.cells;
  // 3x5 pixel glyphs written out independently of the sampler.
  const digits = [
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
  const letters: Record<string, string> = {
    B: '110101110101110',
    I: '111010010010111',
    N: '101111111101101',
    G: '111100101101111',
    O: '111101101101111',
  };

  it.each([...seeds, 1, 2, 3, 4, 5])(
    'prints BINGO over columns of distinct numbers in the standard ranges with a free center (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('bingocard', seed),
        out = empty(),
        dark = (col: number, row: number, fx: number, fy: number): boolean => {
          sample((col + fx) / n, (row + fy) / n, out);
          return out.color < 0.2;
        },
        // Read a glyph whose top-left pixel center is at the given pixel offsets from the cell center.
        glyphAt = (col: number, row: number, firstPixel: number): string => {
          let bits = '';
          for (let y = 0; y < 5; y++)
            for (let x = 0; x < 3; x++)
              bits += dark(
                col,
                row,
                0.5 + (firstPixel + x + 0.5) * p.pixel,
                0.5 + (y - 2.5 + 0.5) * p.pixel,
              )
                ? '1'
                : '0';
          return bits;
        };
      // Header: the letters of BINGO, one per column.
      'BINGO'
        .split('')
        .forEach((letter, col) =>
          expect(glyphAt(col, 0, -1.5)).toBe(letters[letter]),
        );
      let daubs = 0;
      for (let col = 0; col < p.cardColumns; col++) {
        const seen = new Set<number>();
        for (let row = 1; row <= 5; row++) {
          // A single digit sits centered; two digits sit side by side, 4 pixels apart.
          const single = digits.indexOf(glyphAt(col, row, -1.5)),
            left = digits.indexOf(glyphAt(col, row, -3.5)),
            right = digits.indexOf(glyphAt(col, row, 0.5));
          let value: number | undefined;
          if (col === 2 && row === 3) {
            // The free space: no digits, but a mark at the center.
            expect(glyphAt(col, row, -1.5)).toBe('0'.repeat(15));
            sample((col + 0.5) / n, (row + 0.5) / n, out);
            expect(out.color).toBeLessThan(0.75);
            continue;
          }
          if (single >= 0 && !(left >= 0 && right >= 0)) value = single;
          else if (left >= 0 && right >= 0) value = left * 10 + right;
          expect(value).toBeDefined();
          const number = value as number;
          // Column c holds 15c + 1 .. 15c + 15, each at most once.
          expect(number).toBeGreaterThanOrEqual(15 * col + 1);
          expect(number).toBeLessThanOrEqual(15 * col + 15);
          expect(seen.has(number)).toBe(false);
          seen.add(number);
          // A daubed cell has a ring around the digits (probe the left edge of the ring).
          sample((col + 0.5 - p.ringRadius) / n, (row + 0.5) / n, out);
          daubs += Number(out.color < 0.5);
        }
        expect(seen.size).toBe(col === 2 ? 4 : 5);
      }
      // About the authored share of the 24 numbered cells is daubed.
      expect(daubs / 24).toBeLessThan(p.daubChance + 0.3);
      // The sixth column is blank margin.
      for (let row = 0; row < n; row++) {
        sample((5.5 + 0.1) / n, (row + 0.5) / n, out);
        expect(out.color).toBeGreaterThan(0.8);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bingocard', 0),
      b = createSurfaceSampler('bingocard', 7),
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

describe('pegsolitaire: a solvable position on the English board', () => {
  const p = proceduralMaterialPresets.pegsolitaire;
  const n = p.size;
  const onBoard = (x: number, y: number): boolean =>
    x >= 0 &&
    y >= 0 &&
    x < n &&
    y < n &&
    ((x >= 2 && x < n - 2) || (y >= 2 && y < n - 2));

  it.each([...seeds, 1, 2, 3, 4, 5, 6, 7, 8])(
    'cuts the 33-hole cross and places pegs that can be jumped down to a single peg (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('pegsolitaire', seed),
        out = empty(),
        pegs: boolean[] = [];
      let holes = 0;
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          sample((col + 0.5) / n, (row + 0.5) / n, out);
          const tone = out.color;
          // Wood is mid-tone, an empty hole nearly black and a peg light.
          const isHole = tone < 0.15,
            isPeg = tone > 0.7;
          // Holes and pegs exist exactly on the cross-shaped board.
          expect(isHole || isPeg).toBe(onBoard(col, row));
          holes += Number(isHole || isPeg);
          pegs.push(isPeg);
        }
      expect(holes).toBe(33);
      const count = pegs.filter(Boolean).length;
      expect(count).toBeGreaterThanOrEqual(5);
      expect(count).toBeLessThanOrEqual(p.reverseMoves + 1);
      // Solve by depth-first search over jumps (peg, peg, empty in a line); the position was
      // built by reverse play, so a solution to a single peg must exist.
      const seen = new Set<string>();
      const solve = (state: boolean[]): boolean => {
        const key = state.map((peg) => (peg ? '1' : '0')).join('');
        if (seen.has(key)) return false;
        seen.add(key);
        if (state.filter(Boolean).length === 1) return true;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++)
            for (const [dx, dy] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]) {
              const bx = x + dx,
                by = y + dy,
                cx = x + 2 * dx,
                cy = y + 2 * dy;
              if (!onBoard(cx, cy) || !onBoard(bx, by)) continue;
              if (
                !state[y * n + x] ||
                !state[by * n + bx] ||
                state[cy * n + cx]
              )
                continue;
              const next = [...state];
              next[y * n + x] = false;
              next[by * n + bx] = false;
              next[cy * n + cx] = true;
              if (solve(next)) return true;
            }
        return false;
      };
      expect(solve(pegs)).toBe(true);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('pegsolitaire', 0),
      b = createSurfaceSampler('pegsolitaire', 7),
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

describe('xylophonebars: tuned bar lengths with cord holes at the nodes', () => {
  const p = proceduralMaterialPresets.xylophonebars;
  // A tuned bar's frequency goes as 1 / length^2, so one equal-tempered semitone (frequency ratio
  // 2^(1/12)) shortens the bar by 2^(-1/24).
  const semitone = Math.pow(2, -1 / 24);

  it.each(seeds)(
    'shortens each bar by one semitone step and drills holes 22.4% in from both ends (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('xylophonebars', seed),
        out = empty(),
        lengths: number[] = [];
      for (let col = 0; col < p.bars; col++) {
        // Scan down a column a little off center (clear of the holes) and measure the bar's extent.
        const u = (col + 0.5 + 0.3) / p.bars,
          steps = 8192;
        let first = -1,
          last = -1;
        for (let i = 0; i < steps; i++) {
          sample(u, (i + 0.5) / steps, out);
          if (out.color > 0.3) {
            if (first < 0) first = i;
            last = i;
          }
        }
        const length = (last - first + 1) / steps;
        lengths.push(length);
        // Bars are centered on the middle of the tile.
        expect(Math.abs((first + last + 1) / 2 / steps - 0.5)).toBeLessThan(
          0.002,
        );
        // Holes: dark at both nodal points on the center line, bright wood 15% in from an end.
        const centerU = (col + 0.5) / p.bars;
        for (const sign of [-1, 1]) {
          sample(centerU, 0.5 + sign * length * (0.5 - 0.224), out);
          expect(out.color).toBeLessThan(0.15);
          sample(centerU, 0.5 + sign * length * 0.35, out);
          expect(out.color).toBeGreaterThan(0.3);
        }
      }
      expect(Math.abs(lengths[0] - p.longest)).toBeLessThan(0.003);
      for (let col = 1; col < p.bars; col++)
        expect(
          Math.abs(lengths[col] / lengths[col - 1] - semitone),
        ).toBeLessThan(0.006);
      // Eleven steps from the first to the last bar plus one more step is a whole octave, which
      // shortens a bar by 2^(-1/2).
      const octave = (lengths[p.bars - 1] / lengths[0]) * semitone;
      expect(Math.abs(octave - Math.pow(2, -0.5))).toBeLessThan(0.02);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('xylophonebars', 0),
      b = createSurfaceSampler('xylophonebars', 7),
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

describe('sliderulescale: logarithmic graduations and digits', () => {
  const p = proceduralMaterialPresets.sliderulescale;
  // The conventional C-scale graduations over one decade, as integer hundredths of x.
  const graduations = (): { x: number; level: number }[] => {
    const list: { x: number; level: number }[] = [];
    const push = (from: number, to: number, step: number): void => {
      for (let h = from; h < to; h += step) {
        let level = 0;
        if (h % 100 === 0) level = 2;
        else if (h < 400 ? h % 10 === 0 : h % 50 === 0) level = 1;
        list.push({ x: h / 100, level });
      }
    };
    push(100, 200, 2);
    push(200, 400, 5);
    push(400, 1000, 10);
    return list;
  };
  // Independent drawing of the digits 1 to 9 (3 wide, 5 tall).
  const art: Record<number, string[]> = {
    1: ['.#.', '##.', '.#.', '.#.', '###'],
    2: ['###', '..#', '###', '#..', '###'],
    3: ['###', '..#', '###', '..#', '###'],
    4: ['#.#', '#.#', '###', '..#', '..#'],
    5: ['###', '#..', '###', '..#', '###'],
    6: ['###', '#..', '###', '#.#', '###'],
    7: ['###', '..#', '.#.', '.#.', '.#.'],
    8: ['###', '#.#', '###', '#.#', '###'],
    9: ['###', '#.#', '###', '..#', '###'],
  };

  it('puts every tick at log10 of its value, with 150 / 42 / 9 ticks at the three lengths', () => {
    const sample = createSurfaceSampler('sliderulescale', 7),
      out = empty(),
      steps = 16384,
      stripHeight = 1 / p.strips,
      expected = graduations();
    // Scan at a depth that only ticks of that length (or longer) reach.
    const scan = (depth: number): number[] => {
      const centers: number[] = [];
      let start = -1;
      for (let i = 0; i <= steps; i++) {
        let inkRun = false;
        if (i < steps) {
          // Start half a tile in so the tick shared by 1 and 10 at the seam is not split in two.
          sample(((i + 0.5) / steps + 0.5) % 1, depth * stripHeight, out);
          inkRun = out.color < 0.5;
        }
        if (inkRun && start < 0) start = i;
        if (!inkRun && start >= 0) {
          centers.push(((start + i) / 2 / steps + 0.5) % 1);
          start = -1;
        }
      }
      return centers.sort((x, y) => x - y);
    };
    for (const [depth, level] of [
      [0.12, 0],
      [0.21, 1],
      [0.3, 2],
    ] as const) {
      const centers = scan(depth),
        wanted = expected.filter((g) => g.level >= level);
      expect(centers.length).toBe(wanted.length);
      let worst = 0;
      for (let i = 0; i < wanted.length; i++)
        worst = Math.max(worst, Math.abs(centers[i] - Math.log10(wanted[i].x)));
      expect(worst).toBeLessThan(0.0006);
    }
    expect(expected.length).toBe(150);
    expect(expected.filter((g) => g.level >= 1).length).toBe(42);
    expect(expected.filter((g) => g.level === 2).length).toBe(9);
  });

  it.each(seeds)(
    'prints the digits 1 to 9 beside the integer ticks on every strip (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('sliderulescale', seed),
        out = empty();
      let wrong = 0;
      for (let strip = 0; strip < p.strips; strip++)
        for (let digit = 1; digit <= 9; digit++)
          for (let row = 0; row < 5; row++)
            for (let column = 0; column < 3; column++) {
              const u =
                  Math.log10(digit) +
                  p.digitLeft +
                  (column + 0.5) * p.digitPixel,
                v =
                  (strip + p.digitTop) / p.strips + (row + 0.5) * p.digitPixel;
              sample(u, v, out);
              wrong += Number(
                out.color < 0.5 !== (art[digit][row][column] === '#'),
              );
            }
      expect(wrong).toBe(0);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sliderulescale', 0),
      b = createSurfaceSampler('sliderulescale', 7),
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

describe('spirographrosettes: hypotrochoid rosettes', () => {
  const p = proceduralMaterialPresets.spirographrosettes;
  // Ring and gear radii of the four quadrants, written out independently of the preset.
  const gears = [
    [5, 3],
    [8, 3],
    [7, 2],
    [9, 4],
  ];

  it.each(seeds)(
    'draws R equally spaced lobes that reach but never pass the outer circle (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('spirographrosettes', seed),
        out = empty();
      for (let cell = 0; cell < 4; cell++) {
        const cx = 0.25 + 0.5 * (cell & 1),
          cy = 0.25 + 0.5 * (cell >> 1),
          [ring] = gears[cell];
        // Outermost ink radius for each direction; lobe tips are the directions where it comes within
        // 0.004 of the reach circle (the pen reaches that circle exactly at the tips).
        const angles = 2880,
          reach: number[] = [];
        let beyond = 0;
        for (let i = 0; i < angles; i++) {
          const angle = ((i + 0.5) / angles) * Math.PI * 2;
          let outermost = 0;
          for (
            let radius = p.outerRadius + 0.006;
            radius > 0.02;
            radius -= 0.0005
          ) {
            sample(
              cx + radius * Math.cos(angle),
              cy + radius * Math.sin(angle),
              out,
            );
            if (out.color < 0.6) {
              outermost = radius;
              break;
            }
          }
          reach.push(outermost);
          beyond += Number(outermost > p.outerRadius + 0.0035);
        }
        expect(beyond).toBe(0);
        // Cyclic runs of directions near the reach circle: one run per lobe.
        const near = reach.map((radius) => radius > p.outerRadius - 0.004),
          first = near.findIndex(
            (hit, i) => hit && !near[(i + angles - 1) % angles],
          ),
          centers: number[] = [];
        expect(first).toBeGreaterThanOrEqual(0);
        let run = -1;
        for (let k = 0; k < angles; k++) {
          const i = (first + k) % angles;
          if (near[i] && run < 0) run = k;
          if (!near[i] && run >= 0) {
            centers.push(first + (run + k - 1) / 2);
            run = -1;
          }
        }
        // The scan starts at a run start, so a run still open here ends at the last direction.
        if (run >= 0) centers.push(first + (run + angles - 1) / 2);
        expect(centers.length).toBe(ring);
        for (let i = 0; i < centers.length; i++) {
          const gap =
            (i + 1 < centers.length ? centers[i + 1] : centers[0] + angles) -
            centers[i];
          expect(Math.abs(gap - angles / ring)).toBeLessThan(angles * 0.01);
        }
      }
    },
  );

  it('keeps the inner radius of each rosette within the pen-offset range', () => {
    const sample = createSurfaceSampler('spirographrosettes', 7),
      out = empty();
    for (let cell = 0; cell < 4; cell++) {
      const cx = 0.25 + 0.5 * (cell & 1),
        cy = 0.25 + 0.5 * (cell >> 1),
        [ring, gear] = gears[cell];
      let inner = Infinity;
      for (let j = 0; j < 480; j++)
        for (let i = 0; i < 480; i++) {
          const dx = ((i + 0.5) / 480 - 0.5) * 0.46,
            dy = ((j + 0.5) / 480 - 0.5) * 0.46;
          sample(cx + dx, cy + dy, out);
          if (out.color < 0.6) inner = Math.min(inner, Math.hypot(dx, dy));
        }
      // Pen distance is between 0.37 and 0.73 gear radii, the curve reaches ring - gear + pen
      // outside and ring - gear - pen inside (both in units of the reach, scaled to the tile).
      const low =
          ((ring - gear - 0.73 * gear) / (ring - gear + 0.73 * gear)) *
          p.outerRadius,
        high =
          ((ring - gear - 0.37 * gear) / (ring - gear + 0.37 * gear)) *
          p.outerRadius;
      expect(inner).toBeGreaterThan(low - 0.006);
      expect(inner).toBeLessThan(high + 0.006);
    }
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('spirographrosettes', 0),
      b = createSurfaceSampler('spirographrosettes', 7),
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
    expect(different).toBeGreaterThan(20);
  });
});

describe('juliacells: filled Julia sets with real parameters', () => {
  const p = proceduralMaterialPresets.juliacells;
  // The escape-time glow is monotone in the smooth iteration count, so the count can be recovered
  // from the tone: glow = (tone - inside) / (glow - inside), mu = -scale * ln(1 - glow).
  const decodeMu = (tone: number): number =>
    -p.glowScale *
    Math.log(1 - (tone - p.insideTone) / (p.glowTone - p.insideTone));
  // Independent smooth escape-time count for z -> z^2 + c (Infinity when it never escapes).
  const smoothCount = (x0: number, y0: number, c: number): number => {
    let x = x0,
      y = y0,
      n = 0;
    while (x * x + y * y <= 4 && n < 96) {
      [x, y] = [x * x - y * y + c, 2 * x * y];
      n++;
    }
    if (x * x + y * y <= 4) return Infinity;
    return n + 1 - Math.log2(Math.log(x * x + y * y) / 2 / Math.LN2);
  };

  it.each(seeds)(
    'follows z^2 + c for a real c inside the jitter range, in every cell (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('juliacells', seed),
        out = empty();
      for (let cell = 0; cell < 4; cell++) {
        const ox = 0.5 * (cell & 1),
          oy = 0.5 * (cell >> 1),
          point = (i: number): [number, number] => [
            ((0.5 * (i * 0.6180339887 + 0.1)) % 1) * 2 - 1,
            ((0.5 * (i * 0.7548776662 + 0.3)) % 1) * 2 - 1,
          ];
        const probes: { x: number; y: number; mu: number }[] = [];
        for (let i = 0; probes.length < 400; i++) {
          const [cx, cy] = point(i);
          const x = cx * 2,
            y = cy * 2;
          sample(ox + (cx + 1) / 4, oy + (cy + 1) / 4, out);
          // Keep only escaping points whose glow is not yet saturated, where the tone is invertible.
          if (out.color > p.insideTone + 1e-3 && out.color < 0.9)
            probes.push({ x, y, mu: decodeMu(out.color) });
        }
        // Fit c on a few probes by a 1-D search over the whole range the preset allows.
        const centre = p.centers[cell];
        let best: number = centre,
          bestError = Infinity;
        for (let k = -4000; k <= 4000; k++) {
          const c = centre + (k / 4000) * p.centerJitter;
          let error = 0;
          for (let i = 0; i < 12; i++) {
            const mu = smoothCount(probes[i].x, probes[i].y, c);
            error += Number.isFinite(mu) ? Math.abs(mu - probes[i].mu) : 10;
          }
          if (error < bestError) {
            bestError = error;
            best = c;
          }
        }
        expect(Math.abs(best - centre)).toBeLessThanOrEqual(
          p.centerJitter + 1e-9,
        );
        // Then every probe must agree with the iteration count of the fitted c.
        let worst = 0;
        for (const probe of probes)
          worst = Math.max(
            worst,
            Math.abs(smoothCount(probe.x, probe.y, best) - probe.mu),
          );
        expect(worst).toBeLessThan(0.02);
      }
    },
  );

  it('is mirror symmetric in both axes, dark at the cell centers and uniform at the borders', () => {
    const sample = createSurfaceSampler('juliacells', 7),
      out = empty(),
      other = empty();
    let asymmetric = 0;
    for (let cell = 0; cell < 4; cell++) {
      const ox = 0.5 * (cell & 1),
        oy = 0.5 * (cell >> 1);
      for (let i = 0; i < 300; i++) {
        const a = ((i * 0.6180339887) % 1) * 0.5,
          b = ((i * 0.7548776662) % 1) * 0.5;
        sample(ox + a, oy + b, out);
        sample(ox + 0.5 - a, oy + b, other);
        asymmetric += Number(Math.abs(out.color - other.color) > 1e-9);
        sample(ox + a, oy + 0.5 - b, other);
        asymmetric += Number(Math.abs(out.color - other.color) > 1e-9);
      }
      sample(ox + 0.25, oy + 0.25, out);
      expect(out.color).toBeCloseTo(p.insideTone, 6);
      // Along the cell border every point lies outside the escape circle's reach of the set.
      for (let i = 0; i < 64; i++) {
        sample(ox + (i + 0.5) / 128, oy + 0.0001, out);
        expect(out.color).toBeLessThan(0.3);
      }
    }
    expect(asymmetric).toBe(0);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('juliacells', 0),
      b = createSurfaceSampler('juliacells', 7),
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

describe('nonogrampuzzle: clues match the solved picture', () => {
  const p = proceduralMaterialPresets.nonogrampuzzle;
  const n = 8,
    m = 4,
    cells = n + m;
  // Independent 3x5 drawing of the digits 0 to 8.
  const art: Record<number, string[]> = {
    0: ['###', '#.#', '#.#', '#.#', '###'],
    1: ['.#.', '##.', '.#.', '.#.', '###'],
    2: ['###', '..#', '###', '#..', '###'],
    3: ['###', '..#', '###', '..#', '###'],
    4: ['#.#', '#.#', '###', '..#', '..#'],
    5: ['###', '#..', '###', '..#', '###'],
    6: ['###', '#..', '###', '#.#', '###'],
    7: ['###', '..#', '.#.', '.#.', '.#.'],
    8: ['###', '#.#', '###', '#.#', '###'],
  };
  const runs = (line: boolean[]): number[] => {
    const result: number[] = [];
    let length = 0;
    for (const on of [...line, false]) {
      if (on) length++;
      else if (length > 0) {
        result.push(length);
        length = 0;
      }
    }
    return result.length > 0 ? result : [0];
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'prints, for every row and column, the run lengths of the filled cells (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('nonogrampuzzle', seed),
        out = empty(),
        at = (col: number, row: number, fx: number, fy: number): number => {
          sample((col + fx) / cells, (row + fy) / cells, out);
          return out.color;
        };
      const grid: boolean[][] = [];
      for (let row = 0; row < n; row++) {
        const line: boolean[] = [];
        for (let col = 0; col < n; col++)
          line.push(at(m + col, m + row, 0.5, 0.5) < 0.3);
        grid.push(line);
      }
      // Decode a clue cell into a digit (or null if blank) with the independent glyph table.
      const decode = (col: number, row: number): number | null => {
        const bits: string[] = [];
        for (let y = 0; y < 5; y++) {
          let text = '';
          for (let x = 0; x < 3; x++)
            text +=
              at(
                col,
                row,
                0.5 + (x - 1) * p.digitPixel,
                0.5 + (y - 2) * p.digitPixel,
              ) < 0.4
                ? '#'
                : '.';
          bits.push(text);
        }
        if (bits.every((text) => text === '...')) return null;
        for (const [digit, rows] of Object.entries(art))
          if (rows.every((text, i) => text === bits[i])) return Number(digit);
        return -1;
      };
      let wrong = 0;
      for (let line = 0; line < n; line++) {
        const row = runs(grid[line]),
          column = runs(grid.map((r) => r[line]));
        for (let slot = 0; slot < m; slot++) {
          const wantRow =
              slot - (m - row.length) >= 0
                ? row[slot - (m - row.length)]
                : null,
            wantColumn =
              slot - (m - column.length) >= 0
                ? column[slot - (m - column.length)]
                : null;
          wrong += Number(decode(slot, m + line) !== wantRow);
          wrong += Number(decode(m + line, slot) !== wantColumn);
        }
      }
      expect(wrong).toBe(0);
      // A picture of a plausible density: not empty and not full.
      const total = grid.flat().filter(Boolean).length;
      expect(total).toBeGreaterThan(16);
      expect(total).toBeLessThan(56);
    },
  );

  it('keeps the corner blank and heavier lines every five cells', () => {
    const sample = createSurfaceSampler('nonogrampuzzle', 7),
      out = empty();
    for (const [x, y] of [
      [0.5, 0.5],
      [1.5, 2.5],
      [3.5, 3.5],
    ]) {
      sample(x / cells, y / cells, out);
      expect(out.color).toBeGreaterThan(0.9);
    }
    // Width (in 0.0001-cell steps) of the mid-tone grid line across a vertical cell edge, measured
    // along the middle of the first grid row: the lines every five cells and the outer border are
    // wider than the plain ones.
    const lineWidth = (edge: number): number => {
      let width = 0;
      for (let i = -400; i <= 400; i++) {
        sample((m + edge + i * 0.0001) / cells, (m + 0.5) / cells, out);
        width += Number(out.color > 0.3 && out.color < 0.75);
      }
      return width;
    };
    expect(lineWidth(5)).toBeGreaterThan(lineWidth(3) * 1.5);
    expect(lineWidth(8)).toBeGreaterThan(lineWidth(3) * 1.5);
    expect(lineWidth(0)).toBeGreaterThan(lineWidth(3) * 1.5);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('nonogrampuzzle', 0),
      b = createSurfaceSampler('nonogrampuzzle', 7),
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

describe('lightsoutboard: a solvable Lights Out position', () => {
  const p = proceduralMaterialPresets.lightsoutboard;
  const n = 5;
  // Solve A x = state over GF(2), where pressing button j toggles j and its orthogonal neighbors.
  const solvable = (state: number[]): boolean => {
    const size = n * n,
      rows: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row = new Array<number>(size + 1).fill(0),
        x = i % n,
        y = Math.floor(i / n);
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx >= 0 && nx < n && ny >= 0 && ny < n) row[ny * n + nx] = 1;
      }
      row[size] = state[i];
      rows.push(row);
    }
    let pivotRow = 0;
    for (let column = 0; column < size && pivotRow < size; column++) {
      const found = rows.findIndex(
        (row, i) => i >= pivotRow && row[column] === 1,
      );
      if (found < 0) continue;
      [rows[pivotRow], rows[found]] = [rows[found], rows[pivotRow]];
      for (let i = 0; i < size; i++)
        if (i !== pivotRow && rows[i][column] === 1)
          for (let k = column; k <= size; k++) rows[i][k] ^= rows[pivotRow][k];
      pivotRow++;
    }
    // Inconsistent if a row has no coefficients left but a nonzero right-hand side.
    return rows.every(
      (row) =>
        row[size] === 0 || row.slice(0, size).some((value) => value === 1),
    );
  };

  it('the oracle rejects unsolvable positions (only one in four boards is solvable)', () => {
    let state = 12345,
      solved = 0;
    const trials = 200;
    for (let t = 0; t < trials; t++) {
      const board: number[] = [];
      for (let i = 0; i < n * n; i++) {
        state = (state * 1664525 + 1013904223) >>> 0;
        board.push(state >>> 31);
      }
      solved += Number(solvable(board));
    }
    expect(solved).toBeGreaterThan(trials * 0.1);
    expect(solved).toBeLessThan(trials * 0.45);
  });

  it.each([...seeds, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13])(
    'shows a mixed lit pattern that can be pressed back to all off (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('lightsoutboard', seed),
        out = empty(),
        board: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          sample((col + 0.5) / n, (row + 0.5) / n, out);
          // Lit buttons are bright, unlit ones dark.
          expect(out.color < 0.3 || out.color > 0.6).toBe(true);
          board.push(out.color > 0.45 ? 1 : 0);
        }
      const lit = board.reduce((a, b) => a + b, 0);
      expect(lit).toBeGreaterThanOrEqual(2);
      expect(lit).toBeLessThanOrEqual(n * n - 2);
      expect(solvable(board)).toBe(true);
      // The gaps between buttons are dark frame.
      sample(1 / n, 0.5 / n, out);
      expect(out.color).toBeLessThan(0.12);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('lightsoutboard', 0),
      b = createSurfaceSampler('lightsoutboard', 7),
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

describe('weavingdraft: the drawdown follows from threading, tie-up and treadling', () => {
  const p = proceduralMaterialPresets.weavingdraft;
  const width = 12,
    shafts = 4,
    treadles = 4,
    cells = width + shafts;

  it.each([...seeds, 1, 2, 3, 4, 5, 6, 8, 9])(
    'draws a drawdown where thread c shows when treadle(row) lifts shaft(c) (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('weavingdraft', seed),
        out = empty(),
        tone = (col: number, row: number): number => {
          sample((col + 0.5) / cells, (row + 0.5) / cells, out);
          return out.color;
        },
        // Marks and warp-up cells are dark, empty paper and weft are light.
        dark = (col: number, row: number): boolean => tone(col, row) < 0.4;
      // Threading: exactly one mark per column, in the row of shaft s (shaft 1 nearest the drawdown).
      const threading: number[] = [];
      for (let col = 0; col < width; col++) {
        const marked: number[] = [];
        for (let row = 0; row < shafts; row++)
          if (dark(col, row)) marked.push(shafts - 1 - row);
        expect(marked.length).toBe(1);
        threading.push(marked[0]);
      }
      // Tie-up: each treadle lifts a non-empty, non-full set of shafts.
      const tieUp: boolean[][] = [];
      for (let treadle = 0; treadle < treadles; treadle++) {
        const lifts: boolean[] = [];
        for (let shaft = 0; shaft < shafts; shaft++)
          lifts.push(dark(width + treadle, shafts - 1 - shaft));
        const count = lifts.filter(Boolean).length;
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(shafts - 1);
        tieUp.push(lifts);
      }
      // Treadling: exactly one pressed treadle per weft pass.
      const treadling: number[] = [];
      for (let pass = 0; pass < width; pass++) {
        const pressed: number[] = [];
        for (let treadle = 0; treadle < treadles; treadle++)
          if (dark(width + treadle, shafts + pass)) pressed.push(treadle);
        expect(pressed.length).toBe(1);
        treadling.push(pressed[0]);
      }
      // The drawdown is then fully determined.
      let wrong = 0;
      for (let pass = 0; pass < width; pass++)
        for (let col = 0; col < width; col++)
          wrong += Number(
            dark(col, shafts + pass) !== tieUp[treadling[pass]][threading[col]],
          );
      expect(wrong).toBe(0);
      // A draft that does something: both lifted and sunk crossings appear.
      let lifted = 0;
      for (let pass = 0; pass < width; pass++)
        for (let col = 0; col < width; col++)
          lifted += Number(dark(col, shafts + pass));
      expect(lifted).toBeGreaterThan(20);
      expect(lifted).toBeLessThan(124);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('weavingdraft', 0),
      b = createSurfaceSampler('weavingdraft', 7),
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

describe('scrambledcubenet: the net of a legally scrambled 3x3x3 cube', () => {
  const p = proceduralMaterialPresets.scrambledcubenet;
  const tones = [0.24, 0.36, 0.5, 0.64, 0.79, 0.95];
  // Face order U, L, F, R, B, D with their outward normals; colors are numbered like the faces.
  const normals = [
    [0, 1, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, -1],
    [0, -1, 0],
  ];
  // Cross net: face origin in the 14x14 sheet (cells) and the map from face row/column to 3D.
  const origins = [
    [4, 2],
    [1, 5],
    [4, 5],
    [7, 5],
    [10, 5],
    [4, 8],
  ];
  const position = (face: number, r: number, c: number): number[] =>
    [
      [c - 1, 1, r - 1],
      [-1, 1 - r, c - 1],
      [c - 1, 1 - r, 1],
      [1, 1 - r, 1 - c],
      [1 - c, 1 - r, -1],
      [c - 1, -1, 1 - r],
    ][face];
  const det = (a: number[], b: number[], c: number[]): number =>
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0]);

  it.each([...seeds, 1, 2, 3, 4, 5, 6, 8, 9])(
    'keeps nine stickers per color and every edge and corner piece intact (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('scrambledcubenet', seed),
        out = empty(),
        colorAt = (col: number, row: number): number => {
          sample((col + 0.5) / p.cells, (row + 0.5) / p.cells, out);
          let best = 0;
          for (let i = 1; i < tones.length; i++)
            if (
              Math.abs(tones[i] - out.color) < Math.abs(tones[best] - out.color)
            )
              best = i;
          expect(Math.abs(tones[best] - out.color)).toBeLessThan(0.04);
          return best;
        };
      const counts = new Array<number>(6).fill(0),
        pieces = new Map<string, { colors: number[]; normals: number[][] }>();
      let displaced = 0;
      for (let face = 0; face < 6; face++)
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++) {
            const color = colorAt(origins[face][0] + c, origins[face][1] + r);
            counts[color]++;
            if (r === 1 && c === 1) expect(color).toBe(face);
            displaced += Number(color !== face);
            const key = position(face, r, c).join(','),
              piece = pieces.get(key) ?? { colors: [], normals: [] };
            piece.colors.push(color);
            piece.normals.push(normals[face]);
            pieces.set(key, piece);
          }
      expect(counts).toEqual([9, 9, 9, 9, 9, 9]);
      expect(displaced).toBeGreaterThan(20);
      // Cells outside the cross are blank paper.
      for (const [col, row] of [
        [0, 0],
        [13, 0],
        [0, 13],
        [13, 13],
        [1, 3],
        [12, 11],
      ]) {
        sample((col + 0.5) / p.cells, (row + 0.5) / p.cells, out);
        expect(out.color).toBeGreaterThan(0.85);
      }
      // Edge and corner pieces: the solved cube has 12 edges (two non-opposite colors) and 8
      // corners (three mutually adjacent colors); after scrambling each must appear exactly once.
      const solvedEdges = new Set<string>(),
        solvedCorners = new Set<string>();
      for (let a = 0; a < 6; a++)
        for (let b = a + 1; b < 6; b++) {
          if (
            normals[a][0] + normals[b][0] === 0 &&
            normals[a][1] + normals[b][1] === 0 &&
            normals[a][2] + normals[b][2] === 0
          )
            continue;
          solvedEdges.add(`${a},${b}`);
          for (let c = b + 1; c < 6; c++) {
            const opposite = (x: number, y: number): boolean =>
              normals[x].every((value, i) => value + normals[y][i] === 0);
            if (!opposite(a, c) && !opposite(b, c))
              solvedCorners.add(`${a},${b},${c}`);
          }
        }
      const seenEdges = new Set<string>(),
        seenCorners = new Set<string>();
      let wrongHanded = 0;
      for (const piece of pieces.values()) {
        const key = [...piece.colors].sort((x, y) => x - y).join(',');
        if (piece.colors.length === 2) {
          expect(solvedEdges.has(key)).toBe(true);
          seenEdges.add(key);
        } else if (piece.colors.length === 3) {
          expect(solvedCorners.has(key)).toBe(true);
          seenCorners.add(key);
          // A turn keeps the handedness of a corner: the colors read in the order of the facelet
          // normals have the same orientation as the normals of those colors on the solved cube.
          const here = det(
              piece.normals[0],
              piece.normals[1],
              piece.normals[2],
            ),
            solved = det(
              normals[piece.colors[0]],
              normals[piece.colors[1]],
              normals[piece.colors[2]],
            );
          wrongHanded += Number(here * solved < 0);
        }
      }
      expect(seenEdges.size).toBe(12);
      expect(seenCorners.size).toBe(8);
      expect(wrongHanded).toBe(0);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('scrambledcubenet', 0),
      b = createSurfaceSampler('scrambledcubenet', 7),
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
    expect(different).toBeGreaterThan(20);
  });
});

describe('knightstour: numbered squares form an open knight tour', () => {
  const p = proceduralMaterialPresets.knightstour;
  const n = 8,
    allSeeds = [...seeds, 1, 2, 3, 4, 5, 6, 8, 9];
  // Independent 3x5 drawing of the digits 0 to 9.
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  // Read the number written in one square from a 7-wide, 5-high window centered on it.
  const readSquare = (
    sample: ReturnType<typeof createSurfaceSampler>,
    col: number,
    row: number,
  ): number => {
    const out = empty(),
      bits: boolean[][] = [];
    for (let y = 0; y < 5; y++) {
      const line: boolean[] = [];
      for (let x = 0; x < 7; x++) {
        sample(
          (col + 0.5) / n + (x - 3) * p.digitPixel,
          (row + 0.5) / n + (y - 2) * p.digitPixel,
          out,
        );
        line.push(out.color < 0.25);
      }
      bits.push(line);
    }
    // A single digit sits in columns 2-4 (every digit has ink in its middle column, which is
    // column 3 here); two digits sit in columns 0-2 and 4-6 and leave column 3 empty.
    const glyphAt = (offset: number): number =>
      art.findIndex((rows) =>
        rows.every((text, y) =>
          [...text].every((ch, x) => bits[y][offset + x] === (ch === '#')),
        ),
      );
    if (bits.some((line) => line[3])) return glyphAt(2);
    const tens = glyphAt(0),
      units = glyphAt(4);
    return tens < 0 || units < 0 ? -1 : tens * 10 + units;
  };
  const tour = (seed: number): Map<number, [number, number]> => {
    const sample = createSurfaceSampler('knightstour', seed),
      where = new Map<number, [number, number]>();
    for (let row = 0; row < n; row++)
      for (let col = 0; col < n; col++)
        where.set(readSquare(sample, col, row), [col, row]);
    return where;
  };

  it.each(allSeeds)(
    'numbers 1 to 64 so consecutive squares are a knight move apart (seed %i)',
    (seed) => {
      const where = tour(seed);
      expect(where.size).toBe(64);
      for (let label = 1; label <= 64; label++)
        expect(where.has(label)).toBe(true);
      for (let k = 1; k < 64; k++) {
        const [ax, ay] = where.get(k)!,
          [bx, by] = where.get(k + 1)!,
          dx = Math.abs(ax - bx),
          dy = Math.abs(ay - by);
        expect((dx === 1 && dy === 2) || (dx === 2 && dy === 1)).toBe(true);
      }
    },
  );

  it('colors the squares as a checkerboard', () => {
    const sample = createSurfaceSampler('knightstour', 7),
      out = empty();
    for (let row = 0; row < n; row++)
      for (let col = 0; col < n; col++) {
        // Near the square's top-left corner, away from digits and tour lines.
        sample((col + 0.06) / n, (row + 0.06) / n, out);
        expect(
          Math.abs(out.color - ((col + row) % 2 === 1 ? 0.6 : 0.88)),
        ).toBeLessThan(0.08);
      }
  });

  it('starts the tour on different squares for different seeds', () => {
    const starts = new Set<string>();
    for (const seed of allSeeds) starts.add(String(tour(seed).get(1)));
    expect(starts.size).toBeGreaterThan(3);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('knightstour', 0),
      b = createSurfaceSampler('knightstour', 7),
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

describe('graycodediscs: encoder discs read out as a Gray code', () => {
  const p = proceduralMaterialPresets.graycodediscs;
  const bitsPerDisc = [3, 4, 5, 6];

  it.each([...seeds, 1, 2, 3, 4])(
    'reads every sector as a distinct code, one bit away from its neighbors (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('graycodediscs', seed),
        out = empty();
      for (let disc = 0; disc < 4; disc++) {
        const cx = 0.25 + 0.5 * (disc & 1),
          cy = 0.25 + 0.5 * (disc >> 1),
          bits = bitsPerDisc[disc],
          sectors = 2 ** bits,
          // Equal-width tracks between the inner and outer track radius, counted from the outside.
          width = (p.trackOuter - p.trackInner) / bits,
          codes: number[] = [];
        for (let s = 0; s < sectors; s++) {
          // Sector s spans the angles [s, s + 1) / sectors of a turn, measured from +u toward +v.
          const angle = ((s + 0.5) / sectors) * Math.PI * 2;
          let code = 0;
          for (let track = 0; track < bits; track++) {
            const radius = p.trackOuter - (track + 0.5) * width;
            sample(
              cx + radius * Math.cos(angle),
              cy + radius * Math.sin(angle),
              out,
            );
            // Clear slots are bright, opaque blocks dark; both are far from the mid-tone rim.
            expect(out.color < 0.3 || out.color > 0.8).toBe(true);
            if (out.color > 0.8) code |= 1 << track;
          }
          codes.push(code);
        }
        expect(new Set(codes).size).toBe(sectors);
        for (let s = 0; s < sectors; s++) {
          const next = codes[(s + 1) % sectors];
          let difference = codes[s] ^ next,
            changed = 0;
          while (difference) {
            changed += difference & 1;
            difference >>= 1;
          }
          // Exactly one track changes between neighboring sectors, including the wrap from the last to the first.
          expect(changed).toBe(1);
        }
        // Sector 0 is all dark (Gray code 0) and the hole at the center is dark.
        expect(codes[0]).toBe(0);
        sample(cx, cy, out);
        expect(out.color).toBeLessThan(0.15);
        // Outside the disc is the mid-tone mat.
        sample(cx + 0.245, cy, out);
        expect(Math.abs(out.color - p.matTone)).toBeLessThan(0.08);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('graycodediscs', 0),
      b = createSurfaceSampler('graycodediscs', 7),
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

describe('code39barcodes: rows decode with the Code 39 two-bar / one-space rule', () => {
  const p = proceduralMaterialPresets.code39barcodes;
  // Decode the nine elements (bar, space, bar, ... bar; true = wide) of one character from the
  // structure of the symbology rather than from a table: two wide bars encode a number 1 to 10
  // with the weights 1, 2, 4, 7, 0; the one wide space (of four) picks the group of ten values.
  const decodeCharacter = (wide: boolean[]): string => {
    const bars = [0, 2, 4, 6, 8].filter((i) => wide[i]),
      spaces = [1, 3, 5, 7].filter((i) => wide[i]);
    expect(bars.length).toBe(2);
    expect(spaces.length).toBe(1);
    const weights = [1, 2, 4, 7, 0],
      sum = bars.reduce((total, i) => total + weights[i / 2], 0),
      n = sum === 11 ? 10 : sum,
      group = [30, 0, 10, 20][(spaces[0] - 1) / 2];
    if (group === 0) return String(n === 10 ? 0 : n);
    const value = group + n - 1;
    if (value <= 35) return String.fromCharCode(65 + value - 10);
    return ['-', '.', ' ', '*'][value - 36];
  };

  // Read one row of bars into its label text, checking the structure of the symbol on the way.
  const readRow = (
    sample: ReturnType<typeof createSurfaceSampler>,
    row: number,
  ): string => {
    const out = empty(),
      bits: boolean[] = [];
    for (let unit = 0; unit < p.unitCount; unit++) {
      sample((unit + 0.5) / p.unitCount, (row + 0.5) / p.rows, out);
      bits.push(out.color < 0.5);
    }
    // Runs of equal bits, starting from the first bar.
    const first = bits.indexOf(true),
      runs: { bar: boolean; width: number }[] = [];
    // Quiet zones of at least ten narrow units on both sides, as the symbology asks.
    expect(first).toBeGreaterThanOrEqual(10);
    expect(bits.length - 1 - bits.lastIndexOf(true)).toBeGreaterThanOrEqual(10);
    for (let i = first; i < bits.length;) {
      let end = i;
      while (end < bits.length && bits[end] === bits[i]) end++;
      runs.push({ bar: bits[i], width: end - i });
      i = end;
    }
    // Nine elements per character, then a one-unit gap; the last run is the quiet zone.
    let text = '',
      at = 0;
    while (at + 9 <= runs.length - 1) {
      const wide: boolean[] = [];
      for (let k = 0; k < 9; k++) {
        const run = runs[at + k];
        expect(run.bar).toBe(k % 2 === 0);
        expect([1, 3]).toContain(run.width);
        wide.push(run.width === 3);
      }
      text += decodeCharacter(wide);
      at += 9;
      // Characters are separated by one narrow space (the last one is followed by the quiet zone).
      if (at < runs.length - 1) {
        expect(runs[at].bar).toBe(false);
        expect(runs[at].width).toBe(1);
        at++;
      }
    }
    return text;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'prints rows of *XXXXX* labels that decode back to valid characters (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('code39barcodes', seed),
        labels: string[] = [];
      for (let row = 0; row < p.rows; row++) {
        const text = readRow(sample, row);
        expect(text.length).toBe(p.characters + 2);
        expect(text[0]).toBe('*');
        expect(text[text.length - 1]).toBe('*');
        expect(/^[0-9A-Z.-]+$/.test(text.slice(1, -1))).toBe(true);
        labels.push(text);
      }
      expect(new Set(labels).size).toBeGreaterThan(p.rows - 2);
    },
  );

  it('uses the right bar pattern for every one of the 38 data characters', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const sample = createSurfaceSampler('code39barcodes', seed);
      for (let row = 0; row < p.rows; row++)
        for (const character of readRow(sample, row).slice(1, -1))
          seen.add(character);
    }
    expect([...seen].sort().join('')).toBe(
      '-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    );
  }, 30000);

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('code39barcodes', 0),
      b = createSurfaceSampler('code39barcodes', 7),
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

describe('amidakuji: the bottom numbers follow from walking the rungs', () => {
  const p = proceduralMaterialPresets.amidakuji;
  const n = 8,
    levels = 10;
  // Independent 3x5 drawing of the digits 1 to 8.
  const art: Record<number, string[]> = {
    1: ['.#.', '##.', '.#.', '.#.', '###'],
    2: ['###', '..#', '###', '#..', '###'],
    3: ['###', '..#', '###', '..#', '###'],
    4: ['#.#', '#.#', '###', '..#', '..#'],
    5: ['###', '#..', '###', '..#', '###'],
    6: ['###', '#..', '###', '#.#', '###'],
    7: ['###', '..#', '.#.', '.#.', '.#.'],
    8: ['###', '#.#', '###', '#.#', '###'],
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6, 8, 9])(
    'labels each line at the bottom with the start number that ends there (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('amidakuji', seed),
        out = empty(),
        bandBottom = 1 - p.labelBand,
        levelHeight = (bandBottom - p.labelBand) / levels,
        dark = (u: number, v: number): boolean => {
          sample(u, v, out);
          return out.color < 0.3;
        },
        readDigit = (column: number, v: number): number => {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text += dark(
                (column + 0.5) / n + (x - 1) * p.digitPixel,
                v + (y - 2) * p.digitPixel,
              )
                ? '#'
                : '.';
            bits.push(text);
          }
          const found = Object.entries(art).find(([, rows]) =>
            rows.every((text, i) => text === bits[i]),
          );
          return found ? Number(found[0]) : -1;
        };
      // Vertical lines run the full height between the label bands.
      for (let column = 0; column < n; column++)
        for (const v of [0.15, 0.5, 0.85])
          expect(dark((column + 0.5) / n, v)).toBe(true);
      // Rungs: one cell between two neighboring lines, per level.
      const rungs: boolean[][] = [];
      let touching = 0;
      for (let level = 0; level < levels; level++) {
        const v = p.labelBand + (level + 0.5) * levelHeight,
          row: boolean[] = [];
        for (let gap = 0; gap < n - 1; gap++) row.push(dark((gap + 1) / n, v));
        for (let gap = 1; gap < n - 1; gap++)
          touching += Number(row[gap] && row[gap - 1]);
        rungs.push(row);
        // Between the levels the gaps are empty (no stray ink).
        for (let gap = 0; gap < n - 1; gap++)
          expect(
            dark(
              (gap + 1) / n,
              p.labelBand + level * levelHeight + levelHeight * 0.02 + 0.0001,
            ),
          ).toBe(false);
      }
      expect(touching).toBe(0);
      expect(rungs.flat().filter(Boolean).length).toBeGreaterThan(8);
      // Walk every start number down the lines.
      const ends: number[] = [];
      for (let start = 0; start < n; start++) {
        let at = start;
        for (let level = 0; level < levels; level++) {
          if (at < n - 1 && rungs[level][at]) at++;
          else if (at > 0 && rungs[level][at - 1]) at--;
        }
        ends[at] = start + 1;
      }
      for (let column = 0; column < n; column++) {
        expect(readDigit(column, p.labelBand / 2)).toBe(column + 1);
        expect(readDigit(column, 1 - p.labelBand / 2)).toBe(ends[column]);
      }
      expect(new Set(ends).size).toBe(n);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('amidakuji', 0),
      b = createSurfaceSampler('amidakuji', 7),
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

describe('featherbarbs: barbs sweep tailward at a fixed slope from the shaft', () => {
  const p = proceduralMaterialPresets.featherbarbs;
  const period = 1 / p.barbsPerTile;

  // Centers of the runs where the scan is lit (tone above a level between the gaps and the barbs).
  // The scan covers one full tile, so a run touching both ends is one run across the wrap.
  const runCenters = (
    values: number[],
    step: number,
    origin: number,
  ): number[] => {
    const runs: [number, number][] = [];
    let start = -1;
    for (let i = 0; i <= values.length; i++) {
      const lit = i < values.length && values[i] > 0.25;
      if (lit && start < 0) start = i;
      if (!lit && start >= 0) {
        runs.push([start, i - 1]);
        start = -1;
      }
    }
    if (
      runs.length > 1 &&
      runs[0][0] === 0 &&
      runs[runs.length - 1][1] === values.length - 1
    ) {
      const first = runs.shift()!,
        last = runs.pop()!;
      runs.push([last[0], first[1] + values.length]);
    }
    return runs.map(([from, to]) => origin + ((from + to) / 2) * step);
  };

  it.each(seeds)(
    'has one barb per period along the shaft and a slope of dv/dx = -slope (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('featherbarbs', seed),
        out = empty(),
        shaftU = 0.25,
        steps = 20000;
      // Vertical scan at a fixed distance from the shaft: one stripe per barb period.
      const scanDown = (dx: number): number[] => {
        const values: number[] = [];
        for (let i = 0; i < steps; i++) {
          sample(shaftU + dx, (i + 0.5) / steps, out);
          values.push(out.color);
        }
        return runCenters(values, 1 / steps, 0.5 / steps);
      };
      const near = scanDown(0.06),
        far = scanDown(0.1);
      expect(near.length).toBe(p.barbsPerTile);
      expect(far.length).toBe(p.barbsPerTile);
      for (let i = 1; i < near.length; i++)
        expect(Math.abs(near[i] - near[i - 1] - period)).toBeLessThan(0.0004);
      // Moving 0.04 away from the shaft shifts every stripe by -slope * 0.04, modulo the period.
      const shift = ((far[10] - near[10] + p.slope * 0.04) / period) % 1;
      expect(
        Math.min(Math.abs(shift), Math.abs(shift - 1), Math.abs(shift + 1)),
      ).toBeLessThan(0.03);
    },
  );

  it('is mirror symmetric about the shaft, bright on the shaft and empty beyond the reach', () => {
    const sample = createSurfaceSampler('featherbarbs', 7),
      out = empty(),
      other = empty();
    let asymmetric = 0;
    for (let i = 0; i < 400; i++) {
      const dx = ((i * 0.6180339887) % 1) * 0.24,
        v = ((i * 0.7548776662) % 1) * 0.5 + 0.1;
      sample(0.25 + dx, v, out);
      sample(0.25 - dx, v, other);
      // Lit or not is symmetric (skipping the soft edge where the grain, which is not mirrored,
      // can move a sample across the threshold).
      if (
        Math.abs(out.color - 0.25) < 0.1 ||
        Math.abs(other.color - 0.25) < 0.1
      )
        continue;
      asymmetric += Number(out.color > 0.25 !== other.color > 0.25);
    }
    expect(asymmetric).toBe(0);
    sample(0.25, 0.4, out);
    expect(out.color).toBeGreaterThan(0.85);
    // Well beyond the longest barb (reach + variation) nothing is lit; well inside every barb stands.
    let beyond = 0,
      inside = 0;
    for (let i = 0; i < 400; i++) {
      sample(0.25 + p.reach + p.reachVariation + 0.005, (i + 0.5) / 400, out);
      beyond += Number(out.color > 0.2);
    }
    expect(beyond).toBe(0);
    for (let i = 0; i < 4000; i++) {
      sample(0.25 + p.reach - p.reachVariation - 0.01, (i + 0.5) / 4000, out);
      inside += Number(out.color > 0.25);
    }
    // About barbWidth of every period is covered by a barb (the rest is the gap between barbs).
    expect(Math.abs(inside / 4000 - p.barbWidth)).toBeLessThan(0.05);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('featherbarbs', 0),
      b = createSurfaceSampler('featherbarbs', 7),
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

describe('dartboardsectors: the standard board layout', () => {
  const p = proceduralMaterialPresets.dartboardsectors;
  // Standard clockwise order from the top (written independently of the preset) and the real
  // board radii in millimetres; the tile radius of the playing area is 0.47 for 225 mm.
  const order = [
    20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
  ];
  const mm = 0.47 / 225;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it('the reference order keeps the known property: adjacent differences sum to 198', () => {
    let total = 0;
    for (let i = 0; i < 20; i++)
      total += Math.abs(order[i] - order[(i + 1) % 20]);
    expect(total).toBe(198);
    expect(new Set(order).size).toBe(20);
  });

  it.each(seeds)(
    'colors every ring of every sector as a dartboard does (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('dartboardsectors', seed),
        out = empty();
      const toneAt = (angle: number, radiusMm: number): number => {
        sample(
          0.5 + Math.sin(angle) * radiusMm * mm,
          0.5 - Math.cos(angle) * radiusMm * mm,
          out,
        );
        return out.color;
      };
      // Region mid-radii and the tone each should have: [radius mm, black-sector tone, cream-sector tone].
      const regions: [number, number, number][] = [
        [57, 0.1, 0.86],
        [103, 0.34, 0.58],
        [134, 0.1, 0.86],
        [166, 0.34, 0.58],
      ];
      for (let sector = 0; sector < 20; sector++) {
        const angle = (sector * Math.PI * 2) / 20,
          even = sector % 2 === 0;
        for (const [radius, black, cream] of regions)
          expect(
            Math.abs(toneAt(angle, radius) - (even ? black : cream)),
          ).toBeLessThan(0.07);
        // Beyond the double ring is the dark number ring; outside 225 mm is the mid-tone mat.
        expect(toneAt(angle, 175)).toBeLessThan(0.15);
        expect(Math.abs(toneAt(angle, 240) - 0.3)).toBeLessThan(0.07);
      }
      // The bull is the red tone and the outer bull the green tone, shared by all sectors.
      expect(Math.abs(toneAt(0.3, 3) - 0.34)).toBeLessThan(0.07);
      expect(Math.abs(toneAt(0.3, 11) - 0.58)).toBeLessThan(0.07);
    },
  );

  it.each(seeds)(
    'prints the numbers in the standard order around the board (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('dartboardsectors', seed),
        out = empty(),
        pixel = p.digitPixel;
      for (let sector = 0; sector < 20; sector++) {
        const angle = (sector * Math.PI * 2) / 20,
          cx = 0.5 + Math.sin(angle) * 197 * mm,
          cy = 0.5 - Math.cos(angle) * 197 * mm;
        // Read a window wide enough for two digits (7 columns) and 5 rows around the center.
        const bits: boolean[][] = [];
        for (let y = 0; y < 5; y++) {
          const line: boolean[] = [];
          for (let x = 0; x < 7; x++) {
            sample(cx + (x - 3) * pixel, cy + (y - 2) * pixel, out);
            line.push(out.color > 0.6);
          }
          bits.push(line);
        }
        const glyphAt = (offset: number): number =>
          art.findIndex((rows) =>
            rows.every((text, y) =>
              [...text].every((ch, x) => bits[y][offset + x] === (ch === '#')),
            ),
          );
        // A one-digit number is centered (columns 2-4, ink in column 3); two digits leave column 3 empty.
        const value = bits.some((line) => line[3])
          ? glyphAt(2)
          : glyphAt(0) * 10 + glyphAt(4);
        expect(value).toBe(order[sector]);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('dartboardsectors', 0),
      b = createSurfaceSampler('dartboardsectors', 7),
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

describe('tictactoegames: positions reachable in a game of noughts and crosses', () => {
  const p = proceduralMaterialPresets.tictactoegames;
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13])(
    'shows legal positions: X moved first, at most one side has won (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('tictactoegames', seed),
        out = empty(),
        tone = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        };
      for (let board = 0; board < 4; board++) {
        const cells: string[] = [];
        for (let y = 0; y < 3; y++)
          for (let x = 0; x < 3; x++) {
            const cx = ((board & 1) * 3 + x + 0.5) / 6,
              cy = ((board >> 1) * 3 + y + 0.5) / 6;
            // X is dark through the centre; O is a ring (centre bright, dark at radius 0.29 cells).
            if (tone(cx, cy) < 0.3) cells.push('X');
            else if (tone(cx + 0.29 / 6, cy) < 0.3) cells.push('O');
            else {
              // Empty cell: also bright on the diagonal and ring positions away from lines.
              expect(tone(cx + 0.29 / 6, cy)).toBeGreaterThan(0.85);
              expect(tone(cx + 0.2 / 6, cy + 0.2 / 6)).toBeGreaterThan(0.85);
              cells.push('.');
            }
          }
        const x = cells.filter((c) => c === 'X').length,
          o = cells.filter((c) => c === 'O').length,
          wins = (who: string): number =>
            lines.filter((line) => line.every((cell) => cells[cell] === who))
              .length;
        // X moves first, so X has as many marks as O or one more.
        expect(x - o === 0 || x - o === 1).toBe(true);
        expect(x + o).toBeGreaterThanOrEqual(p.minPlies);
        // Never both sides with a line; a winning X has just moved (one more mark than O), a winning O
        // has matched it.
        expect(wins('X') > 0 && wins('O') > 0).toBe(false);
        if (wins('X') > 0) expect(x - o).toBe(1);
        if (wins('O') > 0) expect(x - o).toBe(0);
      }
    },
  );

  it('shows a mix of finished and unfinished games across seeds', () => {
    let won = 0,
      open = 0;
    for (let seed = 0; seed < 40; seed++) {
      const sample = createSurfaceSampler('tictactoegames', seed),
        out = empty();
      for (let board = 0; board < 4; board++) {
        const cells: string[] = [];
        for (let y = 0; y < 3; y++)
          for (let x = 0; x < 3; x++) {
            sample(
              ((board & 1) * 3 + x + 0.5) / 6,
              ((board >> 1) * 3 + y + 0.5) / 6,
              out,
            );
            const centre = out.color;
            sample(
              ((board & 1) * 3 + x + 0.5) / 6 + 0.29 / 6,
              ((board >> 1) * 3 + y + 0.5) / 6,
              out,
            );
            cells.push(centre < 0.3 ? 'X' : out.color < 0.3 ? 'O' : '.');
          }
        const winner = lines.some(
          (line) =>
            line.every((cell) => cells[cell] === 'X') ||
            line.every((cell) => cells[cell] === 'O'),
        );
        won += Number(winner);
        open += Number(!winner);
      }
    }
    expect(won).toBeGreaterThan(20);
    expect(open).toBeGreaterThan(20);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('tictactoegames', 0),
      b = createSurfaceSampler('tictactoegames', 7),
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

describe('quasicrystalwaves: five plane waves with near five-fold wave vectors', () => {
  const p = proceduralMaterialPresets.quasicrystalwaves;
  const n = 64;
  // Recover the summed wave field from the tone (the tone is 0.5 + 0.5 tanh(gain * sum)).
  const field = (seed: number): number[] => {
    const sample = createSurfaceSampler('quasicrystalwaves', seed),
      out = empty(),
      values: number[] = [];
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        sample(x / n, y / n, out);
        values.push(Math.atanh(2 * (out.color - 0.5)) / p.gain);
      }
    return values;
  };
  // Complex discrete Fourier coefficient of the field at integer frequency (kx, ky), normalised so
  // that a unit cosine gives 0.5 at its two frequencies.
  const coefficient = (
    values: number[],
    kx: number,
    ky: number,
  ): [number, number] => {
    let re = 0,
      im = 0;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const angle = (-2 * Math.PI * (kx * x + ky * y)) / n;
        re += values[y * n + x] * Math.cos(angle);
        im += values[y * n + x] * Math.sin(angle);
      }
    return [re / (n * n), im / (n * n)];
  };

  it('the wave vectors are near the five directions of a pentagon with similar lengths', () => {
    const angles = p.vectors.map(
        ([x, y]) => (Math.atan2(y, x) * 180) / Math.PI,
      ),
      lengths = p.vectors.map(([x, y]) => Math.hypot(x, y));
    for (let k = 0; k < 5; k++) {
      const step = (angles[(k + 1) % 5] - angles[k] + 360) % 360;
      expect(Math.abs(step - 72)).toBeLessThan(10);
    }
    expect(Math.max(...lengths) / Math.min(...lengths)).toBeLessThan(1.15);
  });

  it.each(seeds)(
    'has spectral peaks of height 0.5 at the five wave vectors and nothing elsewhere (seed %i)',
    (seed) => {
      const values = field(seed);
      const isWave = (kx: number, ky: number): boolean =>
        p.vectors.some(
          ([x, y]) => (kx === x && ky === y) || (kx === -x && ky === -y),
        );
      let strongest = 0,
        waves = 0;
      for (let ky = -10; ky <= 10; ky++)
        for (let kx = -10; kx <= 10; kx++) {
          const [re, im] = coefficient(values, kx, ky),
            magnitude = Math.hypot(re, im);
          if (isWave(kx, ky)) {
            waves++;
            expect(Math.abs(magnitude - 0.5)).toBeLessThan(0.01);
          } else strongest = Math.max(strongest, magnitude);
        }
      expect(waves).toBe(10);
      expect(strongest).toBeLessThan(0.01);
    },
    30000,
  );

  it('uses different phases for different seeds without changing the wave vectors', () => {
    const phaseAt = (seed: number): number => {
      const [re, im] = coefficient(
        field(seed),
        p.vectors[1][0],
        p.vectors[1][1],
      );
      return Math.atan2(im, re);
    };
    const a = phaseAt(0),
      b = phaseAt(7);
    expect(Math.abs(Math.sin((a - b) / 2))).toBeGreaterThan(0.05);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('quasicrystalwaves', 0),
      b = createSurfaceSampler('quasicrystalwaves', 7),
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

describe('tallymarks: strokes counted in fives match the printed total', () => {
  const p = proceduralMaterialPresets.tallymarks;
  // Independent 3x5 drawing of the digits 0 to 9.
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'counts four strokes plus a strike per group of five and prints the total (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('tallymarks', seed),
        out = empty(),
        dark = (u: number, v: number): boolean => {
          sample(u, v, out);
          return out.color < 0.4;
        };
      for (let row = 0; row < p.rows; row++) {
        const center = (row + 0.5) / p.rows,
          half = p.strokeHeight / p.rows / 2;
        let strokes = 0,
          partialSeen = false;
        for (let group = 0; group < 10; group++) {
          const start = p.marksLeft + group * p.groupPitch + p.strokeStart;
          let inGroup = 0;
          for (let s = 0; s < 4; s++)
            inGroup += Number(
              dark(start + s * p.strokePitch, center + 0.85 * half),
            );
          // Strokes of a group are the first ones: no gap before a stroke.
          for (let s = 0; s < 4; s++)
            if (dark(start + s * p.strokePitch, center + 0.85 * half))
              expect(s).toBeLessThan(inGroup);
          const strike = dark(start + 1.5 * p.strokePitch, center);
          // A strike only crosses a complete set of four strokes.
          if (strike) expect(inGroup).toBe(4);
          if (inGroup > 0 && !(inGroup === 4 && strike)) {
            // Only the last group can be partial (and then nothing follows).
            partialSeen = true;
          } else if (inGroup === 0) partialSeen = true;
          else expect(partialSeen).toBe(false);
          strokes += inGroup + Number(strike);
        }
        expect(strokes).toBeGreaterThanOrEqual(p.minCount);
        expect(strokes).toBeLessThanOrEqual(p.maxCount);
        // The printed total, read with the independent glyph table (one or two digits).
        const readDigit = (left: number): number => {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text += dark(
                left + (x + 0.5) * p.digitPixel,
                center + (y - 2) * p.digitPixel,
              )
                ? '#'
                : '.';
            bits.push(text);
          }
          return art.findIndex((rows) =>
            rows.every((text, i) => text === bits[i]),
          );
        };
        const first = readDigit(p.digitLeft),
          second = readDigit(p.digitLeft + 4 * p.digitPixel);
        const printed = second >= 0 ? first * 10 + second : first;
        expect(printed).toBe(strokes);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('tallymarks', 0),
      b = createSurfaceSampler('tallymarks', 7),
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

describe('polargraphpaper: rings at equal spacing and spokes every ten degrees', () => {
  const p = proceduralMaterialPresets.polargraphpaper;
  const spacing = 0.04;

  // Runs of ink along a sampled path: [centre, width] pairs.
  const runsOf = (values: number[], step: number): [number, number][] => {
    const runs: [number, number][] = [];
    let start = -1;
    for (let i = 0; i <= values.length; i++) {
      const ink = i < values.length && values[i] < 0.8;
      if (ink && start < 0) start = i;
      if (!ink && start >= 0) {
        runs.push([((start + i - 1) / 2) * step, (i - start) * step]);
        start = -1;
      }
    }
    return runs;
  };

  it.each(seeds)(
    'draws twelve rings at radii 0.04 k with heavier rings at 5, 10 and 12 (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('polargraphpaper', seed),
        out = empty(),
        steps = 8000;
      // Along a ray between two spokes (5 degrees past the +u axis).
      const angle = (5 * Math.PI) / 180,
        values: number[] = [];
      for (let i = 0; i < steps; i++) {
        const radius = ((i + 0.5) / steps) * 0.5;
        sample(
          0.5 + radius * Math.cos(angle),
          0.5 + radius * Math.sin(angle),
          out,
        );
        values.push(out.color);
      }
      const rings = runsOf(values, 0.5 / steps);
      expect(rings.length).toBe(12);
      for (let k = 0; k < 12; k++)
        expect(Math.abs(rings[k][0] - spacing * (k + 1))).toBeLessThan(0.0006);
      const thin = rings[1][1],
        heavy = rings[4][1];
      for (const k of [4, 9, 11])
        expect(rings[k][1]).toBeGreaterThan(thin * 1.4);
      for (const k of [0, 1, 2, 3, 5, 6, 7, 8, 10])
        expect(rings[k][1]).toBeLessThan(heavy * 0.85);
    },
  );

  it.each(seeds)(
    'draws 36 spokes with every third heavier and the four axes heaviest (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('polargraphpaper', seed),
        out = empty(),
        steps = 20000;
      // Around a circle halfway between two rings (inside the outer ring).
      const radius = spacing * 7.5,
        values: number[] = [];
      for (let i = 0; i < steps; i++) {
        const angle = ((i + 0.5) / steps) * Math.PI * 2;
        sample(
          0.5 + radius * Math.cos(angle),
          0.5 + radius * Math.sin(angle),
          out,
        );
        values.push(out.color);
      }
      // The scan starts on the +u axis, whose spoke straddles the start: rotate by half a spoke.
      const shifted = values
          .slice(steps / 72)
          .concat(values.slice(0, steps / 72)),
        spokes = runsOf(shifted, 360 / steps);
      expect(spokes.length).toBe(36);
      let worstAngle = 0;
      const widths: number[] = [];
      for (let k = 0; k < 36; k++) {
        // The scan starts 5 degrees past the +u axis, so the spoke on the axis (k = 0) is the last
        // run and run j is spoke j + 1, centred at (j + 1) * 10 degrees minus the 5 degree shift.
        const run = spokes[(k + 35) % 36],
          expected = k === 0 ? 360 - 5 : k * 10 - 5;
        worstAngle = Math.max(worstAngle, Math.abs(run[0] - expected));
        widths.push(run[1]);
      }
      expect(worstAngle).toBeLessThan(0.2);
      const thinWidth = widths[1];
      for (let k = 0; k < 36; k++) {
        if (k % 9 === 0) expect(widths[k]).toBeGreaterThan(thinWidth * 2.2);
        else if (k % 3 === 0)
          expect(widths[k]).toBeGreaterThan(thinWidth * 1.5);
        else
          expect(Math.abs(widths[k] - thinWidth)).toBeLessThan(
            thinWidth * 0.25,
          );
      }
      // No spokes inside the first ring, and nothing outside the outer ring.
      let inner = 0,
        outside = 0;
      for (let i = 0; i < 720; i++) {
        const a = ((i + 0.5) / 720) * Math.PI * 2;
        sample(0.5 + 0.025 * Math.cos(a), 0.5 + 0.025 * Math.sin(a), out);
        inner += Number(out.color < 0.8);
        sample(0.5 + 0.495 * Math.cos(a), 0.5 + 0.495 * Math.sin(a), out);
        outside += Number(out.color < 0.8);
      }
      expect(inner).toBe(0);
      expect(outside).toBe(0);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('polargraphpaper', 0),
      b = createSurfaceSampler('polargraphpaper', 7),
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
    expect(different).toBeGreaterThan(20);
  });
});

describe('chesterfieldtufting: buttons on the even grid points, creases between them', () => {
  const p = proceduralMaterialPresets.chesterfieldtufting;
  const n = 4;

  it.each(seeds)(
    'puts a raised button at every even grid point, a puffy diamond centre at every odd one and a crease between neighbours (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('chesterfieldtufting', seed),
        out = empty(),
        heightAt = (x: number, y: number): number => {
          sample(x / n, y / n, out);
          return out.height / p.relief;
        };
      let buttons = 0,
        centres = 0,
        creases = 0;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          if ((i + j) % 2 === 0) {
            buttons++;
            expect(heightAt(i, j)).toBeGreaterThan(0.9);
            sample(i / n, j / n, out);
            expect(out.color).toBeGreaterThan(0.6);
          } else {
            centres++;
            // The middle of a diamond is the puffy face at its full height.
            expect(Math.abs(heightAt(i, j) - 0.8)).toBeLessThan(0.02);
          }
          // The midpoint of the diagonal between two neighbouring buttons lies on a crease.
          creases++;
          expect(heightAt(i + 0.5, j + 0.5)).toBeLessThan(0.08);
          sample((i + 0.5) / n, (j + 0.5) / n, out);
          expect(out.color).toBeLessThan(0.15);
        }
      expect(buttons).toBe(8);
      expect(centres).toBe(8);
      expect(creases).toBe(16);
    },
  );

  it('rises monotonically from a crease to the centre of the diamond and is mirror symmetric', () => {
    const sample = createSurfaceSampler('chesterfieldtufting', 7),
      out = empty();
    // From the midpoint of a crease (0.5, 0.5) toward the diamond centre (1, 0), in grid units.
    let previous = -1;
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      sample((0.5 + 0.5 * f) / n, (0.5 - 0.5 * f) / n, out);
      expect(out.height / p.relief).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = out.height / p.relief;
    }
    // Reflection across a diamond's diagonal leaves the height unchanged.
    let asymmetric = 0;
    for (let i = 0; i < 300; i++) {
      const a = ((i * 0.6180339887) % 1) * 0.5,
        b = ((i * 0.7548776662) % 1) * 0.5;
      sample(0.25 + a, 0.25 + b, out);
      const first = out.height;
      sample(0.25 + b, 0.25 + a, out);
      asymmetric += Number(Math.abs(out.height - first) > 1e-9);
    }
    expect(asymmetric).toBe(0);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('chesterfieldtufting', 0),
      b = createSurfaceSampler('chesterfieldtufting', 7),
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

describe('louvershutter: slats, gaps, stiles, tilt rod and pins', () => {
  const p = proceduralMaterialPresets.louvershutter;
  const n = 10;

  it.each(seeds)(
    'has ten sloped slats separated by dark gaps, with stiles, a rod and a pin on every slat (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('louvershutter', seed),
        out = empty(),
        steps = 20000,
        scan: number[] = [];
      // Scan down a column clear of the stiles and rod.
      for (let i = 0; i < steps; i++) {
        sample(0.25, (i + 0.5) / steps, out);
        scan.push(out.color);
      }
      // Dark gap runs.
      const gaps: [number, number][] = [];
      let start = -1;
      for (let i = 0; i <= steps; i++) {
        const dark = i < steps && scan[i] < 0.3;
        if (dark && start < 0) start = i;
        if (!dark && start >= 0) {
          gaps.push([(start + i - 1) / 2 / steps, (i - start) / steps]);
          start = -1;
        }
      }
      expect(gaps.length).toBe(n);
      for (let k = 0; k < n; k++) {
        // The gap is the bottom part of each slat's period.
        expect(Math.abs(gaps[k][0] - (k + 1 - p.gap / 2) / n)).toBeLessThan(
          0.002,
        );
        expect(Math.abs(gaps[k][1] - p.gap / n)).toBeLessThan(0.004);
      }
      for (let k = 0; k < n; k++) {
        // Each face is brighter near its top edge than near its bottom edge.
        const faceTone = (fraction: number): number => {
          sample(0.25, (k + fraction * (1 - p.gap)) / n, out);
          return out.color;
        };
        expect(faceTone(0.15) - faceTone(0.85)).toBeGreaterThan(0.15);
        // Gap height is low and face height is high.
        sample(0.25, (k + 1 - p.gap / 2) / n, out);
        expect(out.height / p.relief).toBeLessThan(0.1);
        // Pin on the rod in the middle of every slat; the rod itself continues through the gap.
        sample(0.5, (k + (1 - p.gap) / 2) / n, out);
        expect(Math.abs(out.color - p.pinTone)).toBeLessThan(0.08);
        sample(0.5, (k + 1 - p.gap / 2) / n, out);
        expect(Math.abs(out.color - p.rodTone)).toBeLessThan(0.08);
      }
      // Stiles at both edges are solid: the same light tone at every height, no gaps.
      for (let i = 0; i < 200; i++) {
        for (const u of [0.02, 0.98]) {
          sample(u, (i + 0.5) / 200, out);
          expect(Math.abs(out.color - p.stileTone)).toBeLessThan(0.05);
        }
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('louvershutter', 0),
      b = createSurfaceSampler('louvershutter', 7),
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

describe('ledgersheet: the running balance adds up', () => {
  const p = proceduralMaterialPresets.ledgersheet;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'prints amounts and a balance that is their running sum (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ledgersheet', seed),
        out = empty(),
        rows = p.rows,
        px = p.digitPixel;
      // Read the glyph whose top-left pixel is at (left, top); -1 if it is not a digit.
      const glyph = (left: number, centerV: number): number => {
        const bits: string[] = [];
        for (let y = 0; y < 5; y++) {
          let text = '';
          for (let x = 0; x < 3; x++) {
            sample(left + (x + 0.5) * px, centerV + (y - 2) * px, out);
            text += out.color < 0.45 ? '#' : '.';
          }
          bits.push(text);
        }
        return art.findIndex((digits) =>
          digits.every((text, i) => text === bits[i]),
        );
      };
      // Read a right-aligned number of up to four digits ending at \`right\`.
      const readNumber = (
        right: number,
        centerV: number,
        maxDigits: number,
      ): number => {
        for (let length = maxDigits; length >= 1; length--) {
          const left = right - (length * 4 - 1) * px;
          const digits: number[] = [];
          for (let d = 0; d < length; d++)
            digits.push(glyph(left + d * 4 * px, centerV));
          // The window must hold exactly this many digits: valid glyphs, and blank space to its left.
          sample(left - 2 * px, centerV, out);
          if (
            digits.every((digit) => digit >= 0) &&
            out.color > 0.8 &&
            glyph(left - 4 * px, centerV) < 0
          )
            return Number(digits.join(''));
        }
        return -1;
      };
      let running = 0;
      for (let row = 0; row < rows; row++) {
        const centerV = (row + 0.5) / rows;
        expect(glyph(p.indexLeft, centerV)).toBe(row + 1);
        const amount = readNumber(p.amountRight, centerV, 3),
          balance = readNumber(p.balanceRight, centerV, 4);
        expect(amount).toBeGreaterThanOrEqual(p.minAmount);
        expect(amount).toBeLessThanOrEqual(p.maxAmount);
        running += amount;
        expect(balance).toBe(running);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('ledgersheet', 0),
      b = createSurfaceSampler('ledgersheet', 7),
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

describe('sundialplate: horizontal sundial hour lines follow the latitude formula', () => {
  const p = proceduralMaterialPresets.sundialplate;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  // Angle (radians, clockwise from straight up) of the hour line h hours from noon at a latitude.
  const hourAngle = (h: number, latitude: number): number =>
    Math.abs(h) === 6
      ? (Math.sign(h) * Math.PI) / 2
      : Math.atan(Math.sin(latitude) * Math.tan((h * Math.PI) / 12));

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts the thirteen hour lines at atan(sin(latitude) * tan(15 degrees * h)) (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('sundialplate', seed),
        out = empty(),
        steps = 40000,
        radius = 0.25;
      // Scan a circle (clockwise from straight up) for dark runs: the hour lines.
      const values: number[] = [];
      for (let i = 0; i < steps; i++) {
        const angle = ((i + 0.5) / steps) * Math.PI * 2;
        sample(
          0.5 + radius * Math.sin(angle),
          0.5 - radius * Math.cos(angle),
          out,
        );
        values.push(out.color);
      }
      // Hour lines only lie on the upper half of the plate; the lower half is blank.
      const centers: number[] = [];
      let start = -1;
      for (let i = 0; i <= steps; i++) {
        const dark = i < steps && values[i] < 0.3;
        if (dark && start < 0) start = i;
        if (!dark && start >= 0) {
          centers.push((((start + i - 1) / 2 + 0.5) / steps) * 360);
          start = -1;
        }
      }
      // The noon line is straight up and straddles the start: merge its two halves.
      const merged = centers.filter((angle) => angle > 1 && angle < 359);
      merged.push(0);
      merged.sort((a, b) => a - b);
      const signed = merged
        .map((angle) => (angle > 180 ? angle - 360 : angle))
        .sort((a, b) => a - b);
      expect(signed.length).toBe(13);
      // Fit the latitude from the line one hour after noon, then check all thirteen lines.
      const first = signed[7] * (Math.PI / 180),
        latitude = Math.asin(Math.tan(first) / Math.tan(Math.PI / 12));
      expect(latitude * (180 / Math.PI)).toBeGreaterThan(p.latitudeMin - 0.5);
      expect(latitude * (180 / Math.PI)).toBeLessThan(
        p.latitudeMin + p.latitudeSpan + 0.5,
      );
      for (let h = -6; h <= 6; h++)
        expect(
          Math.abs(signed[h + 6] - (hourAngle(h, latitude) * 180) / Math.PI),
        ).toBeLessThan(0.15);
      // Numerals: the clock hour printed beyond the end of each line (12 at noon).
      for (let h = -6; h <= 6; h++) {
        const angle = hourAngle(h, latitude),
          // Numerals of neighbouring hours sit at alternating distances so they do not collide.
          labelAt = h % 2 === 0 ? p.labelRadius : p.labelRadiusOuter,
          cx = 0.5 + Math.sin(angle) * labelAt,
          cy = 0.5 - Math.cos(angle) * labelAt,
          expected = h === 0 ? 12 : h < 0 ? 12 + h : h,
          digits = expected >= 10 ? 2 : 1,
          read = (left: number): number => {
            const bits: string[] = [];
            for (let y = 0; y < 5; y++) {
              let text = '';
              for (let x = 0; x < 3; x++) {
                sample(
                  left + (x + 0.5) * p.digitPixel,
                  cy + (y - 2) * p.digitPixel,
                  out,
                );
                text += out.color < 0.3 ? '#' : '.';
              }
              bits.push(text);
            }
            return art.findIndex((rows) =>
              rows.every((text, i) => text === bits[i]),
            );
          },
          left = cx - ((digits * 4 - 1) / 2) * p.digitPixel;
        const value =
          digits === 2
            ? read(left) * 10 + read(left + 4 * p.digitPixel)
            : read(left);
        expect(value).toBe(expected);
      }
      // The lower half of the circle (between 95 and 265 degrees from straight up) carries no lines.
      let stray = 0;
      for (let i = 0; i < steps; i++) {
        const degrees = ((i + 0.5) / steps) * 360;
        if (degrees > 95 && degrees < 265) stray += Number(values[i] < 0.3);
      }
      expect(stray).toBe(0);
    },
    30000,
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sundialplate', 0),
      b = createSurfaceSampler('sundialplate', 7),
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

describe('doubleslitfringes: fringe maxima follow the single-slit envelope', () => {
  const p = proceduralMaterialPresets.doubleslitfringes;
  const ratios = [2, 3, 4, 5];
  const period = 1 / 16;
  // Far-field intensity of two slits (separation / width = ratio) at offset x from the centre.
  const intensity = (x: number, ratio: number): number => {
    const argument = (Math.PI * x) / (ratio * period),
      envelope = argument === 0 ? 1 : (Math.sin(argument) / argument) ** 2;
    return Math.cos((Math.PI * x) / period) ** 2 * envelope;
  };

  it.each(seeds)(
    'has fringe maxima of height sinc^2(pi m / ratio) with every ratio-th order missing (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('doubleslitfringes', seed),
        out = empty();
      for (let panel = 0; panel < 4; panel++) {
        const ratio = ratios[panel],
          v = (panel + 0.5) / 4,
          measured = (x: number): number => {
            sample(0.5 + x, v, out);
            return out.color ** (1 / p.gamma);
          };
        let missing = 0;
        for (let m = -7; m <= 7; m++) {
          // Bright fringes sit at whole multiples of the period, dark ones halfway between.
          const x = m * period;
          expect(Math.abs(measured(x) - intensity(x, ratio))).toBeLessThan(
            0.02,
          );
          if (Math.abs(intensity(x, ratio)) < 1e-9) {
            missing++;
            expect(measured(x)).toBeLessThan(0.02);
          } else if (m % ratio !== 0) expect(measured(x)).toBeGreaterThan(0.0);
          expect(measured((m + 0.5) * period)).toBeLessThan(
            0.02 + intensity((m + 0.5) * period, ratio),
          );
        }
        // Orders 0 and +-ratio, +-2 ratio ... : the zeros of the envelope that fall within +-7 orders.
        expect(missing).toBe(2 * Math.floor(7 / ratio));
        // The central maximum is the brightest sample in the panel.
        expect(measured(0)).toBeGreaterThan(0.95);
      }
    },
  );

  it('is mirror symmetric about the centre and has dark gaps between the panels', () => {
    const sample = createSurfaceSampler('doubleslitfringes', 7),
      out = empty(),
      other = empty();
    let asymmetric = 0;
    for (let i = 0; i < 400; i++) {
      const x = ((i * 0.6180339887) % 1) * 0.5,
        v = ((i * 0.7548776662) % 1) * 0.9 + 0.05;
      sample(0.5 + x, v, out);
      sample(0.5 - x, v, other);
      asymmetric += Number(Math.abs(out.color - other.color) > 0.02);
    }
    expect(asymmetric).toBe(0);
    for (let panel = 1; panel < 4; panel++) {
      sample(0.5, panel / 4, out);
      expect(out.color).toBeLessThan(0.1);
    }
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('doubleslitfringes', 0),
      b = createSurfaceSampler('doubleslitfringes', 7),
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

describe('fibonaccisquares: squares of side 1, 1, 2, 3, 5, 8, 13 and a spiral through them', () => {
  const p = proceduralMaterialPresets.fibonaccisquares;
  const fibonacci = [1, 1, 2, 3, 5, 8, 13];
  const grid = 1024;
  const unit = 1 / 24;

  // Tone class of every pixel (-1 for paper, lines and the arc), keeping only pixels whose four
  // neighbours share the class, so anti-aliased edges (which pass through every tone) are ignored.
  const classMap = (
    sample: ReturnType<typeof createSurfaceSampler>,
  ): Int8Array => {
    const out = empty(),
      raw = new Int8Array(grid * grid).fill(-1);
    for (let y = 0; y < grid; y++)
      for (let x = 0; x < grid; x++) {
        sample((x + 0.5) / grid, (y + 0.5) / grid, out);
        raw[y * grid + x] =
          out.color < 0.96
            ? p.tones.findIndex((tone) => Math.abs(tone - out.color) < 0.04)
            : -1;
      }
    const flat = new Int8Array(grid * grid).fill(-1);
    for (let y = 1; y < grid - 1; y++)
      for (let x = 1; x < grid - 1; x++) {
        const k = raw[y * grid + x];
        if (
          k >= 0 &&
          raw[y * grid + x - 1] === k &&
          raw[y * grid + x + 1] === k &&
          raw[(y - 1) * grid + x] === k &&
          raw[(y + 1) * grid + x] === k
        )
          flat[y * grid + x] = k;
      }
    return flat;
  };
  const boxesOf = (
    flat: Int8Array,
  ): { x0: number; y0: number; x1: number; y1: number; n: number }[] => {
    const boxes = fibonacci.map(() => ({
      x0: Infinity,
      y0: Infinity,
      x1: -Infinity,
      y1: -Infinity,
      n: 0,
    }));
    for (let y = 0; y < grid; y++)
      for (let x = 0; x < grid; x++) {
        const k = flat[y * grid + x];
        if (k < 0) continue;
        const b = boxes[k];
        b.x0 = Math.min(b.x0, (x + 0.5) / grid);
        b.y0 = Math.min(b.y0, (y + 0.5) / grid);
        b.x1 = Math.max(b.x1, (x + 0.5) / grid);
        b.y1 = Math.max(b.y1, (y + 0.5) / grid);
        b.n++;
      }
    return boxes;
  };

  it.each(seeds)(
    'draws squares of Fibonacci sides in a golden rectangle (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('fibonaccisquares', seed),
        out = empty(),
        boxes = boxesOf(classMap(sample));
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (let y = 0; y < grid; y++)
        for (let x = 0; x < grid; x++) {
          sample((x + 0.5) / grid, (y + 0.5) / grid, out);
          // Anything darker than the paper belongs to the drawing (a square, a line or the arc).
          if (out.color < 0.96) {
            x0 = Math.min(x0, (x + 0.5) / grid);
            y0 = Math.min(y0, (y + 0.5) / grid);
            x1 = Math.max(x1, (x + 0.5) / grid);
            y1 = Math.max(y1, (y + 0.5) / grid);
          }
        }
      // The whole figure is a rectangle of 13 x 21 units (sides in the golden ratio, 21/13 = 1.615).
      expect(Math.abs((y1 - y0) / (x1 - x0) - 21 / 13)).toBeLessThan(0.03);
      expect(Math.abs((x1 - x0) / unit - 13)).toBeLessThan(0.3);
      // Each tone fills a square; its side, once the border lines are added back, is a Fibonacci number.
      boxes.forEach((b, k) => {
        expect(b.n).toBeGreaterThan(100);
        expect(
          Math.abs((b.x1 - b.x0 + 2 * p.lineHalf) / unit - fibonacci[k]),
        ).toBeLessThan(0.25);
        expect(
          Math.abs((b.y1 - b.y0 + 2 * p.lineHalf) / unit - fibonacci[k]),
        ).toBeLessThan(0.25);
      });
      // The squares fill the rectangle exactly: 1 + 1 + 4 + 9 + 25 + 64 + 169 = 13 * 21.
      expect(fibonacci.reduce((total, side) => total + side * side, 0)).toBe(
        13 * 21,
      );
    },
  );

  it.each(seeds)(
    'joins quarter circles tangentially into one spiral (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('fibonaccisquares', seed),
        out = empty(),
        boxes = boxesOf(classMap(sample)),
        centres: [number, number][] = [],
        ends: [number, number][][] = [];
      for (let k = 0; k < 7; k++) {
        const side = fibonacci[k] * unit,
          left = boxes[k].x0 - p.lineHalf,
          top = boxes[k].y0 - p.lineHalf,
          corners: [number, number][] = [
            [left, top],
            [left + side, top],
            [left + side, top + side],
            [left, top + side],
          ];
        // The centre is the one corner around which the quarter circle of radius = side is dark.
        const hits = corners.filter(([cx, cy], index) => {
          const towardX = index === 0 || index === 3 ? 1 : -1,
            towardY = index === 0 || index === 1 ? 1 : -1,
            samples = 40;
          let dark = 0;
          for (let i = 1; i < samples; i++) {
            const angle = ((i / samples) * Math.PI) / 2;
            sample(
              cx + towardX * side * Math.cos(angle) * 0.998,
              cy + towardY * side * Math.sin(angle) * 0.998,
              out,
            );
            dark += Number(out.color < 0.12);
          }
          return dark >= samples - 3;
        });
        expect(hits.length).toBe(1);
        const index = corners.findIndex(
          ([cx, cy]) => cx === hits[0][0] && cy === hits[0][1],
        );
        centres.push(hits[0]);
        // Arc ends: the two corners next to the centre.
        ends.push([corners[(index + 1) % 4], corners[(index + 3) % 4]]);
      }
      for (let k = 0; k + 1 < 7; k++) {
        // Consecutive arcs share an end point, and centre, shared point and next centre are collinear.
        const shared = ends[k].find(([ax, ay]) =>
          ends[k + 1].some(
            ([bx, by]) =>
              Math.abs(ax - bx) < 0.004 && Math.abs(ay - by) < 0.004,
          ),
        );
        expect(shared).toBeDefined();
        const [sx, sy] = shared!,
          cross =
            (centres[k][0] - sx) * (centres[k + 1][1] - sy) -
            (centres[k][1] - sy) * (centres[k + 1][0] - sx);
        const lengths =
          Math.hypot(centres[k][0] - sx, centres[k][1] - sy) *
          Math.hypot(centres[k + 1][0] - sx, centres[k + 1][1] - sy);
        // The sine of the angle between the two radii at the shared point (0 = tangent arcs).
        expect(Math.abs(cross) / lengths).toBeLessThan(0.01);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('fibonaccisquares', 0),
      b = createSurfaceSampler('fibonaccisquares', 7),
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
    expect(different).toBeGreaterThan(20);
  });
});

describe('bluenoisemask: a void-and-cluster dither mask', () => {
  const p = proceduralMaterialPresets.bluenoisemask;
  const n = 64,
    total = n * n;

  // The 64 x 64 texel ranks, recovered from the tone (rank / (total - 1)).
  const ranks = (seed: number): number[] => {
    const sample = createSurfaceSampler('bluenoisemask', seed),
      out = empty(),
      values: number[] = [];
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        sample((x + 0.5) / n, (y + 0.5) / n, out);
        values.push(Math.round(out.color * (total - 1)));
      }
    return values;
  };

  it.each(seeds)(
    'uses every rank exactly once, so the histogram is flat (seed %i)',
    (seed) => {
      const values = ranks(seed),
        seen = new Set(values);
      expect(seen.size).toBe(total);
      expect(Math.min(...values)).toBe(0);
      expect(Math.max(...values)).toBe(total - 1);
    },
    30000,
  );

  it.each(seeds)(
    'suppresses low spatial frequencies compared with white noise (seed %i)',
    (seed) => {
      const values = ranks(seed).map((rank) => rank / (total - 1) - 0.5);
      // Power spectrum on integer frequencies of the torus (the mask tiles).
      const power = (kx: number, ky: number): number => {
        let re = 0,
          im = 0;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            const angle = (-2 * Math.PI * (kx * x + ky * y)) / n;
            re += values[y * n + x] * Math.cos(angle);
            im += values[y * n + x] * Math.sin(angle);
          }
        return (re * re + im * im) / total;
      };
      // White noise of the same variance has a mean power equal to that variance at every frequency.
      const variance =
        values.reduce((sum, value) => sum + value * value, 0) / total;
      let low = 0,
        lowCount = 0,
        high = 0,
        highCount = 0;
      for (let ky = -31; ky <= 31; ky++)
        for (let kx = -31; kx <= 31; kx++) {
          const radius = Math.hypot(kx, ky);
          if (radius >= 1 && radius <= 5) {
            low += power(kx, ky);
            lowCount++;
          } else if (radius >= 24 && radius <= 31) {
            high += power(kx, ky);
            highCount++;
          }
        }
      // Blue noise: almost no power at low frequencies and more than white noise near the Nyquist
      // frequency (radius 24 to 31 of at most 32 cycles per mask).
      expect(low / lowCount / variance).toBeLessThan(0.1);
      expect(high / highCount / variance).toBeGreaterThan(1.2);
    },
    60000,
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bluenoisemask', 0),
      b = createSurfaceSampler('bluenoisemask', 7),
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
  }, 30000);
});

describe('elementaryautomata: every row follows from the previous one by the panel rule', () => {
  const p = proceduralMaterialPresets.elementaryautomata;
  const rules = [90, 110, 150, 184];
  const n = 31;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'applies Wolfram rules 90, 110, 150 and 184 on a ring of 31 cells (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('elementaryautomata', seed),
        out = empty();
      for (let panel = 0; panel < 4; panel++) {
        const ox = (panel & 1) * 0.5,
          oy = (panel >> 1) * 0.5,
          cells: number[][] = [];
        for (let row = 0; row < n; row++) {
          const line: number[] = [];
          for (let col = 0; col < n; col++) {
            sample(
              ox + ((col + 0.5) / n) * 0.5,
              oy + ((row + 0.5) / n) * 0.5,
              out,
            );
            line.push(out.color < 0.4 ? 1 : 0);
          }
          cells.push(line);
        }
        // The first row holds the middle cell and a sparse random scatter.
        expect(cells[0][15]).toBe(1);
        const first = cells[0].reduce((a, b) => a + b, 0);
        expect(first).toBeGreaterThanOrEqual(1);
        expect(first).toBeLessThanOrEqual(12);
        let wrong = 0;
        for (let row = 1; row < n; row++)
          for (let col = 0; col < n; col++) {
            const left = cells[row - 1][(col + n - 1) % n],
              middle = cells[row - 1][col],
              right = cells[row - 1][(col + 1) % n],
              neighbourhood = left * 4 + middle * 2 + right;
            wrong += Number(
              cells[row][col] !==
                Math.floor(rules[panel] / 2 ** neighbourhood) % 2,
            );
          }
        expect(wrong).toBe(0);
        // Something is still alive in the last row (the odd ring keeps rule 90 from dying out).
        expect(cells[n - 1].some((cell) => cell === 1)).toBe(true);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('elementaryautomata', 0),
      b = createSurfaceSampler('elementaryautomata', 7),
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

describe('mastermindboard: feedback pegs score each guess against the revealed code', () => {
  const p = proceduralMaterialPresets.mastermindboard;
  const columns = 6,
    rows = 9;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'scores every guess with exact and partial pegs by the game rules (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mastermindboard', seed),
        out = empty(),
        toneAt = (x: number, y: number): number => {
          sample(x, y, out);
          return out.color;
        },
        colorOf = (tone: number): number => {
          let best = 0;
          for (let i = 1; i < p.pegTones.length; i++)
            if (
              Math.abs(p.pegTones[i] - tone) < Math.abs(p.pegTones[best] - tone)
            )
              best = i;
          // The peg tones are 0.12 apart and the highlight at the exact centre adds at most 0.01.
          expect(Math.abs(p.pegTones[best] - tone)).toBeLessThan(0.04);
          return best;
        };
      const code = (row: number): number[] => {
        const colors: number[] = [];
        for (let i = 0; i < 4; i++)
          colors.push(colorOf(toneAt((i + 0.5) / columns, (row + 0.5) / rows)));
        return colors;
      };
      const secret = code(0);
      const distinctGuesses = new Set<string>();
      let informative = 0;
      for (let row = 1; row < rows; row++) {
        const guess = code(row);
        distinctGuesses.add(guess.join(''));
        // Decode the feedback block: slot order is left-right, top-bottom over the two last columns.
        let exact = 0,
          partial = 0,
          seenEmpty = false;
        for (let slot = 0; slot < 4; slot++) {
          const x = (4.5 + (slot % 2)) / columns,
            y = (row + 0.5 + (slot < 2 ? -0.25 : 0.25)) / rows,
            tone = toneAt(x, y);
          if (tone > 0.9) {
            exact++;
            expect(seenEmpty).toBe(false);
          } else if (tone < 0.09) {
            partial++;
          } else {
            seenEmpty = true;
            expect(Math.abs(tone - p.holeTone)).toBeLessThan(0.03);
          }
        }
        // Pegs are placed exact first, then partial, then the empty holes.
        let order = 0;
        for (let slot = 0; slot < 4; slot++) {
          const tone = toneAt(
              (4.5 + (slot % 2)) / columns,
              (row + 0.5 + (slot < 2 ? -0.25 : 0.25)) / rows,
            ),
            rank = tone > 0.9 ? 0 : tone < 0.09 ? 1 : 2;
          expect(rank).toBeGreaterThanOrEqual(order);
          order = rank;
        }
        // Independent scoring: exact = same colour in the same place; the total of shared colours
        // (counted with multiplicity) minus the exact ones gives the partial ones.
        const expectedExact = guess.filter(
          (color, i) => color === secret[i],
        ).length;
        let shared = 0;
        for (let color = 0; color < p.colorCount; color++)
          shared += Math.min(
            secret.filter((c) => c === color).length,
            guess.filter((c) => c === color).length,
          );
        expect(exact).toBe(expectedExact);
        expect(partial).toBe(shared - expectedExact);
        informative += Number(exact + partial > 0);
      }
      // Eight random guesses are mostly not all misses, and not all identical.
      expect(informative).toBeGreaterThanOrEqual(3);
      expect(distinctGuesses.size).toBeGreaterThanOrEqual(4);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mastermindboard', 0),
      b = createSurfaceSampler('mastermindboard', 7),
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

describe('wordsearchgrid: the listed words are hidden in the letter grid', () => {
  const p = proceduralMaterialPresets.wordsearchgrid;
  const n = 12;
  const words = [
    'CODE',
    'TREE',
    'GRID',
    'MINT',
    'TIDE',
    'LION',
    'DOOR',
    'CLOT',
    'RAIN',
    'CELL',
    'MOON',
    'TIGER',
    'ANGLE',
    'CIRCLE',
    'TRIANGLE',
  ];
  // Independent 3x5 drawings of the twelve letters.
  const art: Record<string, string[]> = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    C: ['###', '#..', '#..', '#..', '###'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '###', '#..', '###'],
    G: ['###', '#..', '#.#', '#.#', '###'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    L: ['#..', '#..', '#..', '#..', '###'],
    M: ['###', '###', '#.#', '#.#', '#.#'],
    N: ['##.', '#.#', '#.#', '#.#', '#.#'],
    O: ['###', '#.#', '#.#', '#.#', '###'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    T: ['###', '.#.', '.#.', '.#.', '.#.'],
  };
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'contains at least five of the listed words in straight lines (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('wordsearchgrid', seed),
        out = empty(),
        pixel = p.digitPixel,
        grid: string[][] = [];
      for (let row = 0; row < n; row++) {
        const line: string[] = [];
        for (let col = 0; col < n; col++) {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              sample(
                (col + 0.5) / n + (x - 1) * pixel,
                (row + 0.5) / n + (y - 2) * pixel,
                out,
              );
              text += out.color < 0.4 ? '#' : '.';
            }
            bits.push(text);
          }
          const found = Object.entries(art).find(([, rows]) =>
            rows.every((text, i) => text === bits[i]),
          );
          expect(found).toBeDefined();
          line.push(found![0]);
        }
        grid.push(line);
      }
      // Search every word in the eight directions.
      const present = new Set<string>();
      for (const word of words)
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++)
            for (const [dx, dy] of directions) {
              const x1 = x + dx * (word.length - 1),
                y1 = y + dy * (word.length - 1);
              if (x1 < 0 || x1 >= n || y1 < 0 || y1 >= n) continue;
              if (
                [...word].every(
                  (letter, i) => grid[y + dy * i][x + dx * i] === letter,
                )
              )
                present.add(word);
            }
      expect(present.size).toBeGreaterThanOrEqual(p.wordCount);
      // The fill letters come only from the alphabet.
      expect(new Set(grid.flat()).size).toBeLessThanOrEqual(12);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('wordsearchgrid', 0),
      b = createSurfaceSampler('wordsearchgrid', 7),
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

describe('magicsquares: every row, column and diagonal sums to the magic constant', () => {
  const p = proceduralMaterialPresets.magicsquares;
  const orders = [3, 4, 5, 7];
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'numbers 1 to n^2 once with all line sums equal (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('magicsquares', seed),
        out = empty(),
        side = 0.5 - 2 * p.margin;
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const n = orders[quadrant],
          cell = side / n,
          pixel = cell * p.digitFraction,
          ox = (quadrant & 1) * 0.5 + p.margin,
          oy = (quadrant >> 1) * 0.5 + p.margin,
          grid: number[][] = [];
        for (let row = 0; row < n; row++) {
          const line: number[] = [];
          for (let col = 0; col < n; col++) {
            const cx = ox + (col + 0.5) * cell,
              cy = oy + (row + 0.5) * cell,
              read = (left: number): number => {
                const bits: string[] = [];
                for (let y = 0; y < 5; y++) {
                  let text = '';
                  for (let x = 0; x < 3; x++) {
                    sample(left + (x + 0.5) * pixel, cy + (y - 2) * pixel, out);
                    text += out.color < 0.4 ? '#' : '.';
                  }
                  bits.push(text);
                }
                return art.findIndex((rows) =>
                  rows.every((text, i) => text === bits[i]),
                );
              };
            // One digit is centred; read as a single glyph it is valid. Two digits leave the middle
            // column of that window blank, which no digit has, so the single read fails.
            const single = read(cx - 1.5 * pixel),
              value =
                single >= 0
                  ? single
                  : read(cx - 3.5 * pixel) * 10 + read(cx + 0.5 * pixel);
            line.push(value);
          }
          grid.push(line);
        }
        const all = grid.flat().sort((a, b) => a - b);
        expect(all).toEqual(Array.from({ length: n * n }, (_, i) => i + 1));
        const magic = (n * (n * n + 1)) / 2;
        for (let i = 0; i < n; i++) {
          expect(grid[i].reduce((a, b) => a + b, 0)).toBe(magic);
          expect(grid.reduce((sum, line) => sum + line[i], 0)).toBe(magic);
        }
        expect(grid.reduce((sum, line, i) => sum + line[i], 0)).toBe(magic);
        expect(grid.reduce((sum, line, i) => sum + line[n - 1 - i], 0)).toBe(
          magic,
        );
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('magicsquares', 0),
      b = createSurfaceSampler('magicsquares', 7),
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

describe('slidingpuzzle: the shuffled board is a solvable 15-puzzle', () => {
  const p = proceduralMaterialPresets.slidingpuzzle;
  const n = 4;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows tiles 1 to 15 once and one empty square, solvable by parity (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('slidingpuzzle', seed),
        out = empty(),
        side = 1 - 2 * p.margin,
        cell = side / n,
        pixel = cell * p.digitFraction,
        board: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const cx = p.margin + (col + 0.5) * cell,
            cy = p.margin + (row + 0.5) * cell;
          // The empty square is the sunken dark one: its centre is far darker than a tile face.
          sample(cx - cell * 0.4, cy - cell * 0.4, out);
          if (out.color < 0.2) {
            board.push(0);
            continue;
          }
          const read = (left: number): number => {
            const bits: string[] = [];
            for (let y = 0; y < 5; y++) {
              let text = '';
              for (let x = 0; x < 3; x++) {
                sample(left + (x + 0.5) * pixel, cy + (y - 2) * pixel, out);
                text += out.color < 0.45 ? '#' : '.';
              }
              bits.push(text);
            }
            return art.findIndex((rows) =>
              rows.every((text, i) => text === bits[i]),
            );
          };
          const single = read(cx - 1.5 * pixel);
          board.push(
            single >= 0
              ? single
              : read(cx - 3.5 * pixel) * 10 + read(cx + 0.5 * pixel),
          );
        }
      expect([...board].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 16 }, (_, i) => i),
      );
      // A 4x4 board is solvable iff inversions + the blank's row counted from the bottom (1-based) is odd.
      const tiles = board.filter((value) => value !== 0);
      let inversions = 0;
      for (let i = 0; i < tiles.length; i++)
        for (let j = i + 1; j < tiles.length; j++)
          inversions += Number(tiles[i] > tiles[j]);
      const blankRow = n - Math.floor(board.indexOf(0) / n);
      expect((inversions + blankRow) % 2).toBe(1);
      // It was shuffled: very few tiles are still home.
      expect(
        board.filter((value, i) => value === (i + 1) % 16).length,
      ).toBeLessThanOrEqual(6);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('slidingpuzzle', 0),
      b = createSurfaceSampler('slidingpuzzle', 7),
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

describe('kaleidoscope: each rosette has dihedral symmetry of its own order', () => {
  const p = proceduralMaterialPresets.kaleidoscope;
  const folds = [6, 8, 5, 12];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'is unchanged by rotation 2π/n and by mirroring, but not by half a turn of the wedge (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('kaleidoscope', seed),
        one = empty(),
        two = empty();
      for (let cell = 0; cell < 4; cell++) {
        const n = folds[cell],
          cx = ((cell & 1) + 0.5) / 2,
          cy = ((cell >> 1) + 0.5) / 2,
          at = (
            radius: number,
            angle: number,
            target: SurfaceSample,
          ): number => {
            sample(
              cx + (radius * Math.cos(angle)) / 2,
              cy + (radius * Math.sin(angle)) / 2,
              target,
            );
            return target.color;
          };
        let probes = 0,
          halfTurnDiffers = 0,
          contrast = 0;
        for (let i = 0; i < 400; i++) {
          // Quasi-random probe positions inside the rim, away from the exact mirror lines.
          const radius = 0.02 + 0.42 * ((i * 0.6180339887) % 1),
            angle = 0.013 + 2 * Math.PI * ((i * 0.7548776662) % 1) * 0.999;
          const value = at(radius, angle, one);
          expect(at(radius, angle + (2 * Math.PI) / n, two)).toBeCloseTo(
            value,
            6,
          );
          expect(at(radius, -angle, two)).toBeCloseTo(value, 6);
          halfTurnDiffers += Number(
            Math.abs(at(radius, angle + Math.PI / n, two) - value) > 0.02,
          );
          contrast = Math.max(contrast, Math.abs(value - p.baseTone));
          probes++;
        }
        // The pattern is not merely radial: rotating by half the wedge angle changes many samples.
        expect(halfTurnDiffers / probes).toBeGreaterThan(0.05);
        expect(contrast).toBeGreaterThan(0.2);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('kaleidoscope', 0),
      b = createSurfaceSampler('kaleidoscope', 7),
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

describe('oghaminscription: stroke groups spell Old Irish tree names', () => {
  const p = proceduralMaterialPresets.oghaminscription;
  // Independent copy of the alphabet in the order of the four aicmi (X is NG) and of the word list.
  const alphabet = 'BLFSNHDTCQMGXZRAOUEI';
  const words = [
    'BETH',
    'LUIS',
    'FEARN',
    'SAILLE',
    'NION',
    'UATH',
    'DUIR',
    'TINNE',
    'COLL',
    'CERT',
    'GORT',
    'RUIS',
    'AILM',
    'ONN',
    'EADHA',
    'IDHO',
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'decodes every row into a word of the list (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('oghaminscription', seed),
        out = empty(),
        step = 0.0003,
        rowHeight = 1 / p.rows,
        cellWidth = 1 / p.cellsPerRow,
        decoded = new Set<string>();
      // Count the separate dark runs along a horizontal line inside one cell.
      const runs = (cell: number, y: number): number => {
        let count = 0,
          inside = false;
        for (
          let u = cell * cellWidth + step / 2;
          u < (cell + 1) * cellWidth;
          u += step
        ) {
          sample(u, y, out);
          const dark = out.color < 0.33;
          count += Number(dark && !inside);
          inside = dark;
        }
        return count;
      };
      for (let row = 0; row < p.rows; row++) {
        const stem = (row + 0.5) * rowHeight;
        let word = '';
        for (let cell = 0; cell < p.cellsPerRow; cell++) {
          const below = runs(cell, stem + 0.025),
            above = runs(cell, stem - 0.025);
          let kind: number, count: number;
          if (below === 0 && above === 0) {
            count = runs(cell, stem + 0.0075);
            if (count === 0) break;
            kind = 3;
          } else if (above === 0) {
            kind = 0;
            count = below;
          } else if (below === 0) {
            kind = 1;
            count = above;
          } else {
            expect(below).toBe(above);
            kind = 2;
            count = below;
          }
          word += alphabet[kind * 5 + count - 1];
        }
        expect(words).toContain(word);
        decoded.add(word);
      }
      // Eight rows draw from a list of sixteen words: not all rows are the same word.
      expect(decoded.size).toBeGreaterThanOrEqual(3);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('oghaminscription', 0),
      b = createSurfaceSampler('oghaminscription', 7),
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

describe('gameoflife: each board is the next generation of the one before', () => {
  const p = proceduralMaterialPresets.gameoflife;
  const n = 20;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'applies Conway’s rule between the four boards on a torus (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('gameoflife', seed),
        out = empty(),
        side = 0.5 - 2 * p.margin,
        cell = side / n,
        boards: number[][] = [];
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const board: number[] = [];
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            sample(
              (quadrant & 1) * 0.5 + p.margin + (x + 0.5) * cell,
              (quadrant >> 1) * 0.5 + p.margin + (y + 0.5) * cell,
              out,
            );
            board.push(out.color > 0.6 ? 1 : 0);
          }
        boards.push(board);
      }
      // An independent implementation of the rule: count the live cells in the 3x3 block including the cell itself.
      const next = (board: number[]): number[] =>
        board.map((alive, index) => {
          const x = index % n,
            y = Math.floor(index / n);
          let block = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              block += board[((y + dy + n) % n) * n + ((x + dx + n) % n)];
          return block === 3 || (block === 4 && alive === 1) ? 1 : 0;
        });
      for (let k = 0; k < 3; k++)
        expect(boards[k + 1]).toEqual(next(boards[k]));
      for (const board of boards) {
        const live = board.reduce((a, b) => a + b, 0);
        expect(live).toBeGreaterThan(n * n * 0.05);
        expect(live).toBeLessThan(n * n * 0.5);
      }
      // The boards are not frozen: successive generations differ.
      for (let k = 0; k < 3; k++) expect(boards[k + 1]).not.toEqual(boards[k]);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('gameoflife', 0),
      b = createSurfaceSampler('gameoflife', 7),
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

describe('pascalmodulo: every tile follows the Pascal recurrence modulo its modulus', () => {
  const p = proceduralMaterialPresets.pascalmodulo;
  const n = p.rows;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'rows are the sum of the two above, modulo 2, 3, 4 and 5 once each (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('pascalmodulo', seed),
        out = empty(),
        side = 0.5 - 2 * p.margin,
        cell = side / n,
        moduli: number[] = [];
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const tones: number[][] = [];
        for (let row = 0; row < n; row++) {
          const line: number[] = [];
          for (let col = 0; col < n; col++) {
            sample(
              (quadrant & 1) * 0.5 + p.margin + (col + 0.5) * cell,
              (quadrant >> 1) * 0.5 + p.margin + (row + 0.5) * cell,
              out,
            );
            line.push(out.color);
            // Cells right of the diagonal are empty paper.
            if (col > row) expect(out.color).toBeLessThan(p.emptyTone + 0.03);
          }
          tones.push(line);
        }
        // The distinct tile tones are the residues: cluster the sorted tones of the triangle.
        const used = tones
            .flatMap((line, row) => line.slice(0, row + 1))
            .sort((a, b) => a - b),
          levels: number[] = [used[0]];
        for (const tone of used)
          if (tone - levels[levels.length - 1] > 0.05) levels.push(tone);
        const modulus = levels.length;
        moduli.push(modulus);
        const value = (row: number, col: number): number =>
          col < 0 || col > row
            ? 0
            : // The "+ 0" turns a rounded -0 into 0.
              Math.round(
                ((tones[row][col] - p.lowTone) / (p.highTone - p.lowTone)) *
                  (modulus - 1),
              ) + 0;
        expect(value(0, 0)).toBe(1);
        let checked = 0;
        for (let row = 1; row < n; row++)
          for (let col = 0; col <= row; col++) {
            expect(value(row, col)).toBe(
              (value(row - 1, col - 1) + value(row - 1, col)) % modulus,
            );
            checked++;
          }
        expect(checked).toBe((n * (n - 1)) / 2 + n - 1);
      }
      expect(moduli.sort()).toEqual([2, 3, 4, 5]);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('pascalmodulo', 0),
      b = createSurfaceSampler('pascalmodulo', 7),
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

describe('dragoncurve: the lattice path follows the regular paper-folding turn sequence', () => {
  const p = proceduralMaterialPresets.dragoncurve;
  const segments = 2 ** p.order;

  // Turn after segment k (1-based): write k = 2^j * m with m odd; turn left when m mod 4 is 1.
  const turnLeft = (k: number): boolean => {
    let m = k;
    while (m % 2 === 0) m /= 2;
    return m % 4 === 1;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws exactly the edges of the curve in one of the eight orientations (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('dragoncurve', seed),
        out = empty(),
        raw: [number, number][] = [[0, 0]];
      let dx = 1,
        dy = 0;
      for (let k = 1; k <= segments; k++) {
        const [x, y] = raw[k - 1];
        raw.push([x + dx, y + dy]);
        const left = turnLeft(k);
        [dx, dy] = left ? [dy, -dx] : [-dy, dx];
      }
      let matching = 0;
      for (let orientation = 0; orientation < 8; orientation++) {
        const points = raw.map(([x0, y0]) => {
          let x = x0,
            y = y0;
          for (let q = 0; q < orientation % 4; q++) [x, y] = [-y, x];
          return orientation >= 4 ? [-x, y] : [x, y];
        });
        const minX = Math.min(...points.map((q) => q[0])),
          minY = Math.min(...points.map((q) => q[1])),
          w = Math.max(...points.map((q) => q[0])) - minX,
          h = Math.max(...points.map((q) => q[1])) - minY,
          cell = (1 - 2 * p.margin) / Math.max(w, h),
          originX = 0.5 - (w * cell) / 2,
          originY = 0.5 - (h * cell) / 2,
          used = new Set<string>(),
          ink = (x: number, y: number): boolean => {
            sample(originX + x * cell, originY + y * cell, out);
            return out.color > 0.25;
          };
        let good = true;
        for (let k = 0; k < segments && good; k++) {
          const x0 = points[k][0] - minX,
            y0 = points[k][1] - minY,
            x1 = points[k + 1][0] - minX,
            y1 = points[k + 1][1] - minY;
          used.add(
            `${Math.min(x0, x1)},${Math.min(y0, y1)},${y0 === y1 ? 'h' : 'v'}`,
          );
          good = ink((x0 + x1) / 2, (y0 + y1) / 2);
        }
        // Every other lattice edge inside the bounding box is bare background.
        for (let y = 0; y <= h && good; y++)
          for (let x = 0; x <= w && good; x++) {
            if (x < w && !used.has(`${x},${y},h`)) good = !ink(x + 0.5, y);
            if (y < h && good && !used.has(`${x},${y},v`))
              good = !ink(x, y + 0.5);
          }
        if (good) {
          matching++;
          // The tone rises along the path: dim at the start, bright at the end.
          const first = [
              (points[0][0] + points[1][0]) / 2 - minX,
              (points[0][1] + points[1][1]) / 2 - minY,
            ],
            last = [
              (points[segments - 1][0] + points[segments][0]) / 2 - minX,
              (points[segments - 1][1] + points[segments][1]) / 2 - minY,
            ];
          sample(originX + first[0] * cell, originY + first[1] * cell, out);
          const startColor = out.color;
          sample(originX + last[0] * cell, originY + last[1] * cell, out);
          expect(startColor).toBeLessThan(0.5);
          expect(out.color).toBeGreaterThan(0.9);
        }
      }
      expect(matching).toBe(1);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('dragoncurve', 0),
      b = createSurfaceSampler('dragoncurve', 7),
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

describe('cantordust: bars and dust keep exactly the ternary digits that are not 1', () => {
  const p = proceduralMaterialPresets.cantordust;
  const barCells = 3 ** p.barDigits;
  const dustCells = 3 ** p.dustDigits;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'row k keeps the cells whose first k base-3 digits avoid 1, and the dust is the product set (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('cantordust', seed),
        out = empty(),
        isInk = (u: number, v: number): boolean => {
          sample(u, v, out);
          return out.color > 0.3;
        },
        rowHeight = 0.5 / p.rows,
        width = 1 - 2 * p.margin;
      for (let row = 0; row < p.rows; row++) {
        let filled = 0;
        for (let x = 0; x < barCells; x++) {
          const digits = x.toString(3).padStart(p.barDigits, '0'),
            expected = !digits.slice(0, row).includes('1');
          expect(
            isInk(
              p.margin + ((x + 0.5) / barCells) * width,
              (row + 0.5) * rowHeight,
            ),
          ).toBe(expected);
          filled += Number(expected);
        }
        // 2^k of the 3^k leading-digit blocks survive, each covering 3^(5-k) cells.
        expect(filled).toBe(2 ** row * 3 ** (p.barDigits - row));
      }
      // Cantor dust: a cell is lit when neither its column nor its row index has a base-3 digit 1.
      const left = 0.5 - p.dustSide / 2,
        top = 0.5 + (0.5 - p.dustSide) / 2,
        cell = p.dustSide / dustCells;
      let lit = 0;
      for (let y = 0; y < dustCells; y++)
        for (let x = 0; x < dustCells; x++) {
          const noOnes = (index: number): boolean =>
              !index.toString(3).padStart(p.dustDigits, '0').includes('1'),
            expected = noOnes(x) && noOnes(y);
          expect(isInk(left + (x + 0.5) * cell, top + (y + 0.5) * cell)).toBe(
            expected,
          );
          lit += Number(expected);
        }
      // 2^3 surviving indices per axis.
      expect(lit).toBe((2 ** p.dustDigits) ** 2);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('cantordust', 0),
      b = createSurfaceSampler('cantordust', 7),
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

describe('eightqueens: every board is a non-attacking placement of eight queens', () => {
  const p = proceduralMaterialPresets.eightqueens;
  const n = p.size;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has one queen per row and column and none on a shared diagonal (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('eightqueens', seed),
        out = empty(),
        side = 0.5 - 2 * p.margin,
        cell = side / n,
        layouts = new Set<string>();
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const queens: [number, number][] = [];
        for (let row = 0; row < n; row++)
          for (let col = 0; col < n; col++) {
            sample(
              (quadrant & 1) * 0.5 + p.margin + (col + 0.5) * cell,
              (quadrant >> 1) * 0.5 + p.margin + (row + 0.5) * cell,
              out,
            );
            if (out.color > 0.9) queens.push([row, col]);
          }
        expect(queens.length).toBe(n);
        expect(new Set(queens.map(([row]) => row)).size).toBe(n);
        expect(new Set(queens.map(([, col]) => col)).size).toBe(n);
        // Two queens on the same diagonal share row - col or row + col.
        expect(new Set(queens.map(([row, col]) => row - col)).size).toBe(n);
        expect(new Set(queens.map(([row, col]) => row + col)).size).toBe(n);
        layouts.add(queens.map(([, col]) => col).join(''));
      }
      // The four boards are independent draws; they should not all be the same placement.
      expect(layouts.size).toBeGreaterThanOrEqual(2);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('eightqueens', 0),
      b = createSurfaceSampler('eightqueens', 7),
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

describe('hanoitowers: the panels show the optimal solution after 0, 1/3, 2/3 and all of its moves', () => {
  const p = proceduralMaterialPresets.hanoitowers;
  const n = p.disks;
  const side = 0.5 - 2 * p.margin;

  // Independent reference: the classic recursive solution, applied move by move.
  const solution: [number, number][] = [];
  const solve = (
    count: number,
    from: number,
    to: number,
    via: number,
  ): void => {
    if (count === 0) return;
    solve(count - 1, from, via, to);
    solution.push([from, to]);
    solve(count - 1, via, to, from);
  };
  solve(n, 0, 2, 1);
  const stateAfter = (moves: number): number[][] => {
    const pegs: number[][] = [
      Array.from({ length: n }, (_, i) => n - 1 - i),
      [],
      [],
    ];
    for (const [from, to] of solution.slice(0, moves))
      pegs[to].push(pegs[from].pop()!);
    return pegs;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws the disks of each panel in the stacks of the reference solution (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hanoitowers', seed),
        out = empty(),
        isDisk = (quadrant: number, x: number, y: number): boolean => {
          sample(
            (quadrant & 1) * 0.5 + p.margin + x * side,
            (quadrant >> 1) * 0.5 + p.margin + y * side,
            out,
          );
          return out.color > 0.3;
        };
      expect(solution.length).toBe(2 ** n - 1);
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const expected = stateAfter(Math.round(((2 ** n - 1) * quadrant) / 3));
        for (let peg = 0; peg < 3; peg++) {
          const centre = (peg + 0.5) / 3,
            stack: number[] = [];
          for (let row = 0; row < n; row++) {
            const y =
              p.baseY -
              row * (p.diskHeight + p.diskGap) -
              p.diskGap -
              p.diskHeight / 2;
            // The peg itself is thinner than the narrowest disk, so test beside it.
            if (!isDisk(quadrant, centre + 0.03, y)) break;
            let width = 0;
            for (let step = 0; step < 200; step++) {
              const left = isDisk(quadrant, centre - step * 0.002, y),
                right = isDisk(quadrant, centre + step * 0.002, y);
              if (!left && !right && step > 8) break;
              width = Math.max(width, step * 0.002 * 2);
            }
            // Widths are minWidth + widthStep * size; "+ 0" turns a rounded -0 into 0.
            stack.push(Math.round((width - p.minWidth) / p.widthStep) + 0);
          }
          expect(stack).toEqual(expected[peg]);
        }
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hanoitowers', 0),
      b = createSurfaceSampler('hanoitowers', 7),
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

describe('latinsquares: every brightness level occurs once in each row and column', () => {
  const p = proceduralMaterialPresets.latinsquares;
  const side = 0.5 - 2 * p.margin;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'forms four Latin squares of order 5, 6, 7 and 8 (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('latinsquares', seed),
        out = empty();
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const n = p.orders[quadrant],
          cell = side / n,
          grid: number[][] = [];
        for (let row = 0; row < n; row++) {
          const line: number[] = [];
          for (let col = 0; col < n; col++) {
            sample(
              (quadrant & 1) * 0.5 + p.margin + (col + 0.5) * cell,
              (quadrant >> 1) * 0.5 + p.margin + (row + 0.5) * cell,
              out,
            );
            // "+ 0" turns a rounded -0 into 0.
            line.push(
              Math.round(
                ((out.color - p.lowTone) / (p.highTone - p.lowTone)) * (n - 1),
              ) + 0,
            );
          }
          grid.push(line);
        }
        const symbols = Array.from({ length: n }, (_, i) => i);
        for (let i = 0; i < n; i++) {
          expect([...grid[i]].sort((a, b) => a - b)).toEqual(symbols);
          expect(grid.map((line) => line[i]).sort((a, b) => a - b)).toEqual(
            symbols,
          );
        }
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('latinsquares', 0),
      b = createSurfaceSampler('latinsquares', 7),
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

describe('mayansums: the carved base-20 numerals add up', () => {
  const p = proceduralMaterialPresets.mayansums;
  const stride = p.cellWidth + p.signWidth;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'reads a + b = c in every quadrant (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mayansums', seed),
        out = empty();
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const ox = (quadrant & 1) * 0.5,
          oy = (quadrant >> 1) * 0.5,
          carved = (x: number, y: number): boolean => {
            sample(ox + x, oy + y, out);
            return out.color < 0.35;
          },
          // Read one digit (0 to 19) of a cell: a hollow ring is 0; otherwise filled bars of five from
          // the bottom, then a row of separate dots.
          readDigit = (centreX: number, top: number): number => {
            const rowY = (level: number): number =>
              top + p.cellHeight - (level + 0.5) * p.levelHeight;
            if (
              !carved(centreX, top + p.cellHeight / 2) &&
              carved(
                centreX - p.shellRadiusX + p.shellWall / 2,
                top + p.cellHeight / 2,
              )
            )
              return 0;
            let bars = 0;
            while (
              bars < 4 &&
              [-0.04, 0, 0.04].every((dx) => carved(centreX + dx, rowY(bars)))
            )
              bars++;
            let dots = 0,
              inside = false;
            for (let x = -0.06; x <= 0.06; x += 0.0015) {
              const dark = carved(centreX + x, rowY(bars));
              dots += Number(dark && !inside);
              inside = dark;
            }
            return bars * 5 + dots;
          };
        const numbers = [0, 1, 2].map((slot) => {
          const centreX = p.left + slot * stride + p.cellWidth / 2;
          return (
            readDigit(centreX, p.topY) * 20 +
            readDigit(centreX, p.topY + p.cellHeight + p.rowGap)
          );
        });
        expect(numbers[0]).toBeGreaterThanOrEqual(p.minimum);
        expect(numbers[0]).toBeLessThanOrEqual(p.maximum);
        expect(numbers[1]).toBeGreaterThanOrEqual(p.minimum);
        expect(numbers[1]).toBeLessThanOrEqual(p.maximum);
        expect(numbers[0] + numbers[1]).toBe(numbers[2]);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mayansums', 0),
      b = createSurfaceSampler('mayansums', 7),
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

describe('sortingnetworks: the drawn comparators really sort', () => {
  const p = proceduralMaterialPresets.sortingnetworks;
  const n = p.wires;
  const side = 0.5 - 2 * p.margin;
  const wireSpacing = side / n;

  // Read the comparators of one quadrant, trying the two possible column counts (19 and 24).
  const readNetwork = (
    sample: ReturnType<typeof createSurfaceSampler>,
    quadrant: number,
  ): [number, number][] => {
    const out = empty(),
      bright = (x: number, y: number): boolean => {
        sample(
          (quadrant & 1) * 0.5 + p.margin + x,
          (quadrant >> 1) * 0.5 + p.margin + y,
          out,
        );
        return out.color > 0.8;
      };
    for (const columns of [19, 24]) {
      const width = side / columns,
        list: [number, number][] = [];
      let valid = true;
      for (let column = 0; column < columns && valid; column++) {
        const x = (column + 0.5) * width,
          lit: number[] = [];
        for (let wire = 0; wire < n; wire++)
          if (bright(x, (wire + 0.5) * wireSpacing)) lit.push(wire);
        // The bar crosses the wires between its two dots, so every wire from the first lit one to
        // the last lit one is bright and the comparator joins those two.
        valid =
          lit.length >= 2 && lit.length === lit[lit.length - 1] - lit[0] + 1;
        if (valid) {
          for (
            let y = (lit[0] + 0.5) * wireSpacing;
            y <= (lit[lit.length - 1] + 0.5) * wireSpacing && valid;
            y += 0.002
          )
            valid = bright(x, y);
          list.push([lit[0], lit[lit.length - 1]]);
        }
      }
      if (valid) return list;
    }
    throw new Error('no comparator network could be read');
  };

  it('sorts every 0-1 input into ascending order down the wires, using 19 or 24 comparators', () => {
    const sizes = new Set<number>();
    for (const seed of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const sample = createSurfaceSampler('sortingnetworks', seed);
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const network = readNetwork(sample, quadrant);
        sizes.add(network.length);
        // By the 0-1 principle a network sorts all inputs if it sorts every binary input.
        for (let input = 0; input < 2 ** n; input++) {
          const values = Array.from({ length: n }, (_, i) => (input >> i) & 1);
          for (const [a, b] of network)
            if (values[a] > values[b])
              [values[a], values[b]] = [values[b], values[a]];
          for (let i = 1; i < n; i++)
            expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
        }
      }
    }
    // Both families occur among these seeds.
    expect([...sizes].sort()).toEqual([19, 24]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sortingnetworks', 0),
      b = createSurfaceSampler('sortingnetworks', 7),
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

describe('primesieve: bright cells are exactly the primes of a window of consecutive integers', () => {
  const p = proceduralMaterialPresets.primesieve;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;

  // Independent reference: the smallest prime factor by a sieve, grouped like the tones.
  const limit = 1 + p.firstMax + n * n;
  const smallest = new Array<number>(limit + 1).fill(0);
  for (let i = 2; i <= limit; i++)
    if (smallest[i] === 0)
      for (let j = i; j <= limit; j += i)
        if (smallest[j] === 0) smallest[j] = i;
  const classOf = (value: number): number => {
    if (value === 1) return 0;
    if (smallest[value] === value) return 1;
    const factor = smallest[value];
    return factor <= 7 ? [0, 0, 2, 3, 0, 4, 0, 5][factor] : 6;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows the number classes of exactly one window start (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('primesieve', seed),
        out = empty(),
        decoded: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          sample(
            p.margin + (col + 0.5) * cell,
            p.margin + (row + 0.5) * cell,
            out,
          );
          // Nearest tone among: 1, prime, then the four prime-factor tones and the "11 or more" tone.
          const tones = [p.oneTone, p.primeTone, ...p.factorTones];
          let best = 0;
          for (let k = 1; k < tones.length; k++)
            if (
              Math.abs(tones[k] - out.color) < Math.abs(tones[best] - out.color)
            )
              best = k;
          expect(Math.abs(tones[best] - out.color)).toBeLessThan(0.04);
          decoded.push(best);
        }
      const starts: number[] = [];
      for (let start = 1; start <= 1 + p.firstMax; start++) {
        let same = true;
        for (let i = 0; i < n * n && same; i++)
          same = classOf(start + i) === decoded[i];
        if (same) starts.push(start);
      }
      expect(starts.length).toBe(1);
      // Among 256 consecutive integers below 1000 there are roughly 35 to 60 primes.
      const primes = decoded.filter((kind) => kind === 1).length;
      expect(primes).toBeGreaterThan(25);
      expect(primes).toBeLessThan(75);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('primesieve', 0),
      b = createSurfaceSampler('primesieve', 7),
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

describe('knockoutbracket: every winner advances from one of the two boxes that feed it', () => {
  const p = proceduralMaterialPresets.knockoutbracket;
  const rounds = Math.round(Math.log2(p.teams)) + 1;
  const pitchY = (1 - 2 * p.topMargin) / p.teams;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'reads sixteen teams in round one and a consistent tree above them (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('knockoutbracket', seed),
        out = empty(),
        read = (left: number, cy: number): number => {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              sample(left + (x + 0.5) * p.pixel, cy + (y - 2) * p.pixel, out);
              text += out.color < 0.45 ? '#' : '.';
            }
            bits.push(text);
          }
          return art.findIndex((rows) =>
            rows.every((text, i) => text === bits[i]),
          );
        },
        tree: number[][] = [];
      for (let round = 0; round < rounds; round++) {
        const count = p.teams / 2 ** round,
          centreX = p.left + round * p.columnPitch + p.boxWidth / 2,
          line: number[] = [];
        for (let i = 0; i < count; i++) {
          const cy = p.topMargin + (i + 0.5) * 2 ** round * pitchY,
            // A single digit reads as a valid glyph in the middle window; two digits leave its middle column blank.
            single = read(centreX - 1.5 * p.pixel, cy);
          line.push(
            single >= 0
              ? single
              : read(centreX - 3.5 * p.pixel, cy) * 10 +
                  read(centreX + 0.5 * p.pixel, cy),
          );
        }
        tree.push(line);
      }
      expect([...tree[0]].sort((a, b) => a - b)).toEqual(
        Array.from({ length: p.teams }, (_, i) => i + 1),
      );
      for (let round = 1; round < rounds; round++)
        tree[round].forEach((winner, i) => {
          expect([
            tree[round - 1][2 * i],
            tree[round - 1][2 * i + 1],
          ]).toContain(winner);
        });
      expect(tree[rounds - 1].length).toBe(1);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('knockoutbracket', 0),
      b = createSurfaceSampler('knockoutbracket', 7),
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

describe('skyscraperpuzzles: the clues count the visible buildings of the solved grid', () => {
  const p = proceduralMaterialPresets.skyscraperpuzzles;
  const side = 0.5 - 2 * p.margin;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  // Buildings seen from the start of a line: how many are taller than everything before them.
  const seen = (heights: number[]): number =>
    heights.filter((height, i) =>
      heights.slice(0, i).every((other) => other < height),
    ).length;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'is a Latin square whose four-sided clues match the visible buildings (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('skyscraperpuzzles', seed),
        out = empty();
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const n = p.orders[quadrant],
          cells = n + 2,
          cell = side / cells,
          pixel = cell * p.digitFraction,
          value = (row: number, col: number): number => {
            const cx = (quadrant & 1) * 0.5 + p.margin + (col + 0.5) * cell,
              cy = (quadrant >> 1) * 0.5 + p.margin + (row + 0.5) * cell,
              bits: string[] = [];
            for (let y = 0; y < 5; y++) {
              let text = '';
              for (let x = 0; x < 3; x++) {
                sample(cx + (x - 1) * pixel, cy + (y - 2) * pixel, out);
                text += out.color < 0.5 ? '#' : '.';
              }
              bits.push(text);
            }
            return art.findIndex((rows) =>
              rows.every((text, i) => text === bits[i]),
            );
          },
          grid: number[][] = [];
        for (let r = 1; r <= n; r++)
          grid.push(Array.from({ length: n }, (_, c) => value(r, c + 1)));
        const heights = Array.from({ length: n }, (_, i) => i + 1);
        for (let i = 0; i < n; i++) {
          expect([...grid[i]].sort((a, b) => a - b)).toEqual(heights);
          expect(grid.map((line) => line[i]).sort((a, b) => a - b)).toEqual(
            heights,
          );
          const column = grid.map((line) => line[i]);
          expect(value(0, i + 1)).toBe(seen(column));
          expect(value(n + 1, i + 1)).toBe(seen([...column].reverse()));
          expect(value(i + 1, 0)).toBe(seen(grid[i]));
          expect(value(i + 1, n + 1)).toBe(seen([...grid[i]].reverse()));
        }
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('skyscraperpuzzles', 0),
      b = createSurfaceSampler('skyscraperpuzzles', 7),
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

describe('pianoroll: a stepwise melody in a major scale over a keyboard strip', () => {
  const p = proceduralMaterialPresets.pianoroll;
  const rowHeight = (1 - p.top - p.bottom) / p.pitches;
  const stepWidth = (1 - p.rollLeft - p.rollRight) / p.steps;
  const blackKeys = new Set([1, 3, 6, 8, 10]);
  const major = [0, 2, 4, 5, 7, 9, 11];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has one pitch per step, in a single major scale that starts on its tonic (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('pianoroll', seed),
        out = empty(),
        toneAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        rowY = (pitch: number): number =>
          p.top + (p.pitches - 1 - pitch + 0.5) * rowHeight;
      // The keyboard strip shows black keys as dark rows and white keys as bright rows.
      for (let pitch = 0; pitch < p.pitches; pitch++)
        expect(toneAt(p.keyWidth / 2, rowY(pitch)) > 0.5).toBe(
          !blackKeys.has(pitch % 12),
        );
      const played: number[] = [];
      for (let step = 0; step < p.steps; step++) {
        const active: number[] = [];
        for (let pitch = 0; pitch < p.pitches; pitch++)
          if (
            toneAt(p.rollLeft + (step + 0.5) * stepWidth, rowY(pitch)) >
            p.noteLow - 0.05
          )
            active.push(pitch);
        expect(active.length).toBe(1);
        played.push(active[0]);
      }
      // Merge equal neighbours into notes: the generator never repeats a pitch, so runs are notes of 1 to 4 steps.
      const notes: { pitch: number; length: number }[] = [];
      for (const pitch of played)
        if (notes.length > 0 && notes[notes.length - 1].pitch === pitch)
          notes[notes.length - 1].length++;
        else notes.push({ pitch, length: 1 });
      expect(notes.length).toBeGreaterThanOrEqual(8);
      for (const note of notes) expect(note.length).toBeLessThanOrEqual(4);
      for (let i = 1; i < notes.length; i++) {
        const jump = Math.abs(notes[i].pitch - notes[i - 1].pitch);
        expect(jump).toBeGreaterThan(0);
        // One or two scale degrees: at most four semitones in a major scale.
        expect(jump).toBeLessThanOrEqual(4);
      }
      // Every played pitch class lies in the major scale whose tonic is the first note.
      const classes = new Set(notes.map((note) => note.pitch % 12)),
        tonics = Array.from({ length: 12 }, (_, tonic) => tonic).filter(
          (tonic) =>
            [...classes].every((pc) => major.includes((pc - tonic + 12) % 12)),
        );
      expect(tonics).toContain(notes[0].pitch % 12);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('pianoroll', 0),
      b = createSurfaceSampler('pianoroll', 7),
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

describe('binaryclock: the four faces show consecutive seconds in binary coded decimal', () => {
  const p = proceduralMaterialPresets.binaryclock;
  const side = 0.5 - 2 * p.margin;
  const inner = side - 2 * p.padding;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'reads valid times that advance by one second per face (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('binaryclock', seed),
        out = empty(),
        times: number[] = [];
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const digits: number[] = [];
        for (let column = 0; column < p.columns; column++) {
          let value = 0;
          for (let bit = 0; bit < p.bits; bit++) {
            sample(
              (quadrant & 1) * 0.5 +
                p.margin +
                p.padding +
                ((column + 0.5) * inner) / p.columns,
              (quadrant >> 1) * 0.5 +
                p.margin +
                p.padding +
                ((bit + 0.5) * inner) / p.bits,
              out,
            );
            // Top row is the 8 bit, bottom row the 1 bit.
            value = value * 2 + Number(out.color > 0.6);
          }
          digits.push(value);
        }
        // Binary coded decimal: each column is a decimal digit, tens of hours at most 2, tens of minutes and seconds at most 5.
        for (const digit of digits) expect(digit).toBeLessThanOrEqual(9);
        const hours = digits[0] * 10 + digits[1],
          minutes = digits[2] * 10 + digits[3],
          seconds = digits[4] * 10 + digits[5];
        expect(hours).toBeLessThan(24);
        expect(minutes).toBeLessThan(60);
        expect(seconds).toBeLessThan(60);
        times.push(hours * 3600 + minutes * 60 + seconds);
      }
      for (let i = 1; i < 4; i++)
        expect((times[i] - times[i - 1] + 86400) % 86400).toBe(1);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('binaryclock', 0),
      b = createSurfaceSampler('binaryclock', 7),
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

describe('othelloboard: each board is one legal Reversi move after the previous one', () => {
  const p = proceduralMaterialPresets.othelloboard;
  const n = p.size;
  const side = 0.5 - 2 * p.margin;
  const cell = side / n;

  // Independent reference: the discs flipped when `colour` plays at (row, col), scanning eight rays.
  const flippedBy = (
    board: number[][],
    row: number,
    col: number,
    colour: number,
  ): [number, number][] => {
    const flipped: [number, number][] = [];
    if (board[row][col] !== 0) return flipped;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const ray: [number, number][] = [];
        let r = row + dr,
          c = col + dc;
        while (
          r >= 0 &&
          r < n &&
          c >= 0 &&
          c < n &&
          board[r][c] === 3 - colour
        ) {
          ray.push([r, c]);
          r += dr;
          c += dc;
        }
        if (
          ray.length > 0 &&
          r >= 0 &&
          r < n &&
          c >= 0 &&
          c < n &&
          board[r][c] === colour
        )
          flipped.push(...ray);
      }
    return flipped;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows four boards linked by legal moves with exactly the right flips (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('othelloboard', seed),
        out = empty(),
        boards: number[][][] = [];
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const board: number[][] = [];
        for (let row = 0; row < n; row++) {
          const line: number[] = [];
          for (let col = 0; col < n; col++) {
            sample(
              (quadrant & 1) * 0.5 + p.margin + (col + 0.5) * cell,
              (quadrant >> 1) * 0.5 + p.margin + (row + 0.5) * cell,
              out,
            );
            // Black discs are dark, white discs bright, the empty felt in between.
            line.push(out.color < 0.2 ? 1 : out.color > 0.7 ? 2 : 0);
          }
          board.push(line);
        }
        boards.push(board);
      }
      // The first board is already several moves into the game.
      const count = (board: number[][]): number =>
        board.flat().filter((value) => value !== 0).length;
      expect(count(boards[0])).toBeGreaterThanOrEqual(4 + p.startPlies);
      for (let k = 0; k < 3; k++) {
        const before = boards[k],
          after = boards[k + 1],
          added: [number, number][] = [];
        for (let r = 0; r < n; r++)
          for (let c = 0; c < n; c++)
            if (before[r][c] === 0 && after[r][c] !== 0) added.push([r, c]);
        // Exactly one disc is placed, every other changed disc was flipped, and no disc disappeared.
        expect(added.length).toBe(1);
        const [row, col] = added[0],
          colour = after[row][col],
          expected = flippedBy(before, row, col, colour)
            .map(([r, c]) => `${r},${c}`)
            .sort(),
          actual: string[] = [];
        for (let r = 0; r < n; r++)
          for (let c = 0; c < n; c++) {
            if (before[r][c] !== 0 && before[r][c] !== after[r][c])
              actual.push(`${r},${c}`);
            if (before[r][c] !== 0) expect(after[r][c]).not.toBe(0);
          }
        expect(expected.length).toBeGreaterThan(0);
        expect(actual.sort()).toEqual(expected);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('othelloboard', 0),
      b = createSurfaceSampler('othelloboard', 7),
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

describe('goboards: no group of stones is left without a liberty', () => {
  const p = proceduralMaterialPresets.goboards;
  const n = p.size;
  const side = 0.5 - 2 * p.margin;
  const cell = side / n;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'every connected group on each board touches an empty point (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('goboards', seed),
        out = empty();
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const board: number[][] = [];
        for (let row = 0; row < n; row++) {
          const line: number[] = [];
          for (let col = 0; col < n; col++) {
            // Sample beside the intersection: the grid lines cross exactly at its centre.
            sample(
              (quadrant & 1) * 0.5 + p.margin + (col + 0.75) * cell,
              (quadrant >> 1) * 0.5 + p.margin + (row + 0.75) * cell,
              out,
            );
            line.push(out.color < 0.2 ? 1 : out.color > 0.8 ? 2 : 0);
          }
          board.push(line);
        }
        const stones = board.flat().filter((value) => value !== 0).length;
        expect(stones).toBeGreaterThan(4);
        expect(stones).toBeLessThanOrEqual(p.moves[quadrant]);
        // Flood fill every group (a connected run of one colour) and require a neighbouring empty point.
        const seen = new Set<number>();
        for (let start = 0; start < n * n; start++) {
          const colour = board[Math.floor(start / n)][start % n];
          if (colour === 0 || seen.has(start)) continue;
          const group = [start];
          seen.add(start);
          let liberty = false;
          for (let i = 0; i < group.length; i++) {
            const r = Math.floor(group[i] / n),
              c = group[i] % n;
            for (const [dr, dc] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]) {
              const rr = r + dr,
                cc = c + dc;
              if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
              if (board[rr][cc] === 0) liberty = true;
              else if (board[rr][cc] === colour && !seen.has(rr * n + cc)) {
                seen.add(rr * n + cc);
                group.push(rr * n + cc);
              }
            }
          }
          expect(liberty).toBe(true);
        }
      }
    },
  );

  it('shows both colours on the later, fuller boards', () => {
    const sample = createSurfaceSampler('goboards', 7),
      out = empty();
    let black = 0,
      white = 0;
    for (let row = 0; row < n; row++)
      for (let col = 0; col < n; col++) {
        sample(
          0.5 + p.margin + (col + 0.5) * cell,
          0.5 + p.margin + (row + 0.5) * cell,
          out,
        );
        black += Number(out.color < 0.2);
        white += Number(out.color > 0.8);
      }
    expect(black).toBeGreaterThan(5);
    expect(white).toBeGreaterThan(5);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('goboards', 0),
      b = createSurfaceSampler('goboards', 7),
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

describe('dewbeads: separate round domes of the drop sizes', () => {
  const p = proceduralMaterialPresets.dewbeads;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'finds round, spherical-cap drops that never touch and fit the radius range (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('dewbeads', seed),
        out = empty(),
        size = 384,
        step = 1 / size,
        heightAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.height / p.relief;
        },
        level = 0.5,
        grid = new Uint8Array(size * size);
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
          grid[y * size + x] = Number(
            heightAt((x + 0.5) * step, (y + 0.5) * step) > level,
          );
      // Label the connected regions above the threshold.
      const label = new Int32Array(size * size).fill(-1),
        regions: { cells: number[] }[] = [];
      for (let start = 0; start < size * size; start++) {
        if (grid[start] === 0 || label[start] !== -1) continue;
        const cells = [start];
        label[start] = regions.length;
        for (let i = 0; i < cells.length; i++) {
          const x = cells[i] % size,
            y = Math.floor(cells[i] / size);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            const index = ny * size + nx;
            if (grid[index] === 1 && label[index] === -1) {
              label[index] = regions.length;
              cells.push(index);
            }
          }
        }
        regions.push({ cells });
      }
      // The cap's height is leaf + dome * sqrt(1 - d^2); the threshold cuts it at distance d0 from the centre.
      const d0 = Math.sqrt(1 - ((level - p.leafHeight) / p.domeHeight) ** 2),
        found: { u: number; v: number; radius: number }[] = [];
      for (const { cells } of regions) {
        const xs = cells.map((c) => (c % size) + 0.5),
          ys = cells.map((c) => Math.floor(c / size) + 0.5),
          centreU = (xs.reduce((a, b) => a + b, 0) / cells.length) * step,
          centreV = (ys.reduce((a, b) => a + b, 0) / cells.length) * step,
          radius = Math.sqrt((cells.length * step * step) / Math.PI) / d0,
          width = (Math.max(...xs) - Math.min(...xs) + 1) * step,
          tall = (Math.max(...ys) - Math.min(...ys) + 1) * step;
        expect(radius).toBeGreaterThan(p.minRadius * 0.9);
        expect(radius).toBeLessThan(p.maxRadius * 1.1);
        // Round: the bounding box is nearly square.
        expect(width / tall).toBeGreaterThan(0.85);
        expect(width / tall).toBeLessThan(1.18);
        // Spherical cap: the height at the centre and at half the radius follow leaf + dome * sqrt(1 - d^2).
        expect(heightAt(centreU, centreV)).toBeCloseTo(
          p.leafHeight + p.domeHeight,
          1,
        );
        let ring = 0;
        for (let k = 0; k < 8; k++)
          ring +=
            heightAt(
              centreU + 0.5 * radius * Math.cos((k * Math.PI) / 4),
              centreV + 0.5 * radius * Math.sin((k * Math.PI) / 4),
            ) / 8;
        expect(
          Math.abs(ring - (p.leafHeight + p.domeHeight * Math.sqrt(0.75))),
        ).toBeLessThan(0.07);
        found.push({ u: centreU, v: centreV, radius });
      }
      // About `coverage` of the 144 cells hold a drop, and no two drops touch.
      expect(found.length).toBeGreaterThan(
        p.cells * p.cells * p.coverage * 0.6,
      );
      expect(found.length).toBeLessThan(
        p.cells * p.cells * Math.min(1, p.coverage * 1.4),
      );
      for (let i = 0; i < found.length; i++)
        for (let j = i + 1; j < found.length; j++)
          expect(
            Math.hypot(found[i].u - found[j].u, found[i].v - found[j].v),
          ).toBeGreaterThan(found[i].radius + found[j].radius);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('dewbeads', 0),
      b = createSurfaceSampler('dewbeads', 7),
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

describe('bowlingscoresheet: the cumulative scores follow from the rolls', () => {
  const p = proceduralMaterialPresets.bowlingscoresheet;
  // Independent 3x5 drawings: digits 0-9 then X (strike), / (spare), - (miss).
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
    ['#.#', '#.#', '.#.', '#.#', '#.#'],
    ['..#', '..#', '.#.', '#..', '#..'],
    ['...', '...', '###', '...', '...'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'reads the roll symbols and scores of four games and rescoring the rolls gives the same totals (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('bowlingscoresheet', seed),
        out = empty(),
        ink = (u: number, v: number): boolean => {
          sample(u, v, out);
          // Ink is much darker than the 0.45 frame lines, which must not count.
          return out.color < 0.3;
        },
        readGlyph = (
          centreU: number,
          centreV: number,
          pixel: number,
        ): number => {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text += ink(centreU + (x - 1) * pixel, centreV + (y - 2) * pixel)
                ? '#'
                : '.';
            bits.push(text);
          }
          return bits.every((line) => line === '...')
            ? -1
            : art.findIndex((rows) =>
                rows.every((text, i) => text === bits[i]),
              );
        };
      for (let game = 0; game < p.games; game++) {
        const rowTop = p.top + game * p.rowHeight,
          rolls: number[] = [],
          totals: number[] = [];
        for (let frame = 0; frame < p.frames; frame++) {
          const last = frame === p.frames - 1,
            width = last ? p.lastFrameWidth : p.frameWidth,
            left = p.left + frame * p.frameWidth,
            boxes = last ? 3 : 2,
            symbols: number[] = [];
          for (let box = 0; box < boxes; box++) {
            const symbol = readGlyph(
              left + width - (boxes - box) * p.boxWidth + p.boxWidth / 2,
              rowTop + p.boxHeight / 2,
              p.pixel,
            );
            if (symbol >= 0) symbols.push(symbol);
          }
          // Turn symbols into pin counts, tracking the pins standing in the current rack.
          let standing = 10;
          for (const symbol of symbols) {
            const pins =
              symbol === 10 || symbol === 11
                ? standing
                : symbol === 12
                  ? 0
                  : symbol;
            if (symbol === 10) expect(standing).toBe(10);
            if (symbol === 11) expect(standing).toBeLessThan(10);
            expect(pins).toBeLessThanOrEqual(standing);
            rolls.push(pins);
            standing = pins === standing ? 10 : standing - pins;
          }
          // Frames 1 to 9 end on a strike or after two rolls; the tenth has a third roll only after a strike or spare.
          if (!last)
            expect(symbols.length === 1 ? symbols[0] : 2).toBe(
              symbols.length === 1 ? 10 : 2,
            );
          else expect([2, 3]).toContain(symbols.length);
          // The cumulative score: measure the width of the ink to get the digit count, then read the digits.
          const scoreV = rowTop + p.boxHeight + (p.rowHeight - p.boxHeight) / 2;
          let leftmost = Infinity,
            rightmost = -Infinity;
          for (let x = 0; x < width; x += p.scorePixel / 2)
            for (let dy = -2; dy <= 2; dy++)
              if (ink(left + x, scoreV + dy * p.scorePixel)) {
                leftmost = Math.min(leftmost, x);
                rightmost = Math.max(rightmost, x);
              }
          const digitCount = Math.round(
              ((rightmost - leftmost) / p.scorePixel + 1 + 1) / 4,
            ),
            textLeft = left + (width - (digitCount * 4 - 1) * p.scorePixel) / 2;
          let total = 0;
          for (let d = 0; d < digitCount; d++) {
            const digit = readGlyph(
              textLeft + (d * 4 + 1.5) * p.scorePixel,
              scoreV,
              p.scorePixel,
            );
            expect(digit).toBeGreaterThanOrEqual(0);
            expect(digit).toBeLessThanOrEqual(9);
            total = total * 10 + digit;
          }
          totals.push(total);
        }
        // Independent scoring: frames 1 to 10 with the usual strike and spare bonuses from the following rolls.
        let position = 0,
          sum = 0;
        for (let frame = 0; frame < p.frames; frame++) {
          if (rolls[position] === 10) {
            sum += 10 + rolls[position + 1] + rolls[position + 2];
            position += 1;
          } else {
            sum +=
              rolls[position] +
              rolls[position + 1] +
              (rolls[position] + rolls[position + 1] === 10
                ? rolls[position + 2]
                : 0);
            position += 2;
          }
          expect(totals[frame]).toBe(sum);
        }
        // What is left after the tenth frame are only its bonus rolls: two after a strike, one after a spare.
        expect(rolls.length - position).toBeLessThanOrEqual(2);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bowlingscoresheet', 0),
      b = createSurfaceSampler('bowlingscoresheet', 7),
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

describe('hexresourceboard: resources and number tokens follow the Catan layout rules', () => {
  const p = proceduralMaterialPresets.hexresourceboard;
  const sqrt3 = Math.sqrt(3);
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has the right resource counts, one token per non-desert hexagon, and no touching 6 or 8 (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hexresourceboard', seed),
        out = empty(),
        read = (cx: number, cy: number): number => {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              sample(
                0.5 + cx + (x - 1) * p.pixel,
                0.5 + cy + (y - 2) * p.pixel,
                out,
              );
              text += out.color < 0.4 ? '#' : '.';
            }
            bits.push(text);
          }
          return art.findIndex((rows) =>
            rows.every((text, i) => text === bits[i]),
          );
        },
        types = new Map<string, number>(),
        tokens = new Map<string, number>();
      for (let r = -2; r <= 2; r++)
        for (let q = -2; q <= 2; q++) {
          if (Math.abs(q + r) > 2) continue;
          const cx = p.radius * sqrt3 * (q + r / 2),
            cy = p.radius * 1.5 * r;
          // Resource: the tile tone just below the token, matched to the nearest of the six tones.
          sample(0.5 + cx, 0.5 + cy + 0.055, out);
          let type = 0;
          for (let k = 1; k < p.resourceTones.length; k++)
            if (
              Math.abs(p.resourceTones[k] - out.color) <
              Math.abs(p.resourceTones[type] - out.color)
            )
              type = k;
          expect(Math.abs(p.resourceTones[type] - out.color)).toBeLessThan(
            0.06,
          );
          types.set(`${q},${r}`, type);
          // Token: a single digit reads as a glyph in the middle window; two digits leave its middle column blank.
          const single = read(cx, cy),
            value =
              single >= 0
                ? single
                : read(cx - 2 * p.pixel, cy) * 10 + read(cx + 2 * p.pixel, cy);
          if (type !== p.resources.length - 1) tokens.set(`${q},${r}`, value);
        }
      expect(types.size).toBe(19);
      // The six resource types in the 4 / 3 / 4 / 4 / 3 / 1 mix.
      const counts = p.resources.map(
        (_, type) =>
          [...types.values()].filter((value) => value === type).length,
      );
      expect(counts.sort()).toEqual([...p.resources].sort());
      // One number token on every hexagon except the single desert, using each number the right number of times.
      expect(tokens.size).toBe(18);
      expect([...tokens.values()].sort((a, b) => a - b)).toEqual([
        ...p.numbers,
      ]);
      // The red numbers 6 and 8 never sit on neighbouring hexagons.
      const offsets = [
        [1, 0],
        [0, 1],
        [-1, 1],
      ];
      for (const [key, value] of tokens) {
        if (value !== 6 && value !== 8) continue;
        const [q, r] = key.split(',').map(Number);
        for (const [dq, dr] of offsets)
          expect([6, 8]).not.toContain(tokens.get(`${q + dq},${r + dr}`));
        for (const [dq, dr] of offsets)
          expect([6, 8]).not.toContain(tokens.get(`${q - dq},${r - dr}`));
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hexresourceboard', 0),
      b = createSurfaceSampler('hexresourceboard', 7),
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

describe('kakuropuzzle: every run has distinct digits that add up to its clue', () => {
  const p = proceduralMaterialPresets.kakuropuzzle;
  const n = p.size;
  const side = 1 - 2 * p.margin;
  const cell = side / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'reads a consistent filled grid with its across and down clues (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('kakuropuzzle', seed),
        out = empty(),
        at = (row: number, col: number, fx: number, fy: number): number => {
          sample(
            p.margin + (col + fx) * cell,
            p.margin + (row + fy) * cell,
            out,
          );
          return out.color;
        },
        // Read a glyph whose middle pixel is at the given place inside a cell; `light` means light ink on a dark cell.
        glyph = (
          row: number,
          col: number,
          fx: number,
          fy: number,
          pixel: number,
          light: boolean,
        ): number => {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              const tone = at(
                row,
                col,
                fx + ((x - 1) * pixel) / cell,
                fy + ((y - 2) * pixel) / cell,
              );
              text += (light ? tone > 0.75 : tone < 0.3) ? '#' : '.';
            }
            bits.push(text);
          }
          return bits.every((line) => line === '...')
            ? -1
            : art.findIndex((rows) =>
                rows.every((text, i) => text === bits[i]),
              );
        },
        // A one- or two-digit number centred at (fx, fy); a single digit reads as a glyph in the middle window.
        number = (
          row: number,
          col: number,
          fx: number,
          fy: number,
          pixel: number,
          light: boolean,
        ): number => {
          const single = glyph(row, col, fx, fy, pixel, light);
          if (single >= 0) return single;
          const tens = glyph(
              row,
              col,
              fx - (2 * pixel) / cell,
              fy,
              pixel,
              light,
            ),
            ones = glyph(row, col, fx + (2 * pixel) / cell, fy, pixel, light);
          return tens >= 0 && ones >= 0 ? tens * 10 + ones : 0;
        },
        white: boolean[] = [],
        digit: number[] = [],
        across: number[] = [],
        down: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          // The bottom-left corner of a cell is plain paper (white cell) or plain block (black cell).
          const isWhite = at(row, col, 0.08, 0.92) > 0.7;
          white.push(isWhite);
          digit.push(
            isWhite
              ? glyph(row, col, 0.5, 0.5, cell * p.digitFraction, false)
              : 0,
          );
          across.push(
            isWhite ? 0 : number(row, col, 0.74, 0.27, p.cluePixel, true),
          );
          down.push(
            isWhite ? 0 : number(row, col, 0.26, 0.73, p.cluePixel, true),
          );
        }
      // The first row and column are blocks; every white cell holds a digit from 1 to 9.
      for (let i = 0; i < n; i++) {
        expect(white[i]).toBe(false);
        expect(white[i * n]).toBe(false);
      }
      expect(white.filter(Boolean).length).toBeGreaterThan(20);
      for (let i = 0; i < n * n; i++)
        if (white[i]) expect(digit[i]).toBeGreaterThanOrEqual(1);
      // Check every maximal run in both directions.
      let runCount = 0;
      for (const horizontal of [true, false])
        for (let line = 0; line < n; line++) {
          let run: number[] = [];
          for (let i = 0; i <= n; i++) {
            const index =
              i < n ? (horizontal ? line * n + i : i * n + line) : -1;
            if (index >= 0 && white[index]) {
              run.push(index);
              continue;
            }
            if (run.length > 0) {
              runCount++;
              expect(run.length).toBeGreaterThanOrEqual(2);
              const digits = run.map((cellIndex) => digit[cellIndex]);
              expect(new Set(digits).size).toBe(digits.length);
              const clueCell = horizontal ? run[0] - 1 : run[0] - n;
              expect((horizontal ? across : down)[clueCell]).toBe(
                digits.reduce((a, b) => a + b, 0),
              );
            }
            run = [];
          }
        }
      expect(runCount).toBeGreaterThanOrEqual(10);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('kakuropuzzle', 0),
      b = createSurfaceSampler('kakuropuzzle', 7),
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

describe('hashibridges: a consistent Hashiwokakero solution', () => {
  const p = proceduralMaterialPresets.hashibridges;
  const n = p.size;
  const side = 1 - 2 * p.margin;
  const cell = side / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has islands whose numbers equal their bridges, no crossings, all connected (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hashibridges', seed),
        out = empty(),
        centre = (index: number): [number, number] => [
          p.margin + ((index % n) + 0.5) * cell,
          p.margin + (Math.floor(index / n) + 0.5) * cell,
        ],
        ink = (u: number, v: number): boolean => {
          sample(u, v, out);
          return out.color < 0.3;
        },
        numberAt = (index: number): number => {
          const [cu, cv] = centre(index),
            bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text += ink(cu + (x - 1) * p.pixel, cv + (y - 2) * p.pixel)
                ? '#'
                : '.';
            bits.push(text);
          }
          return art.findIndex((rows) =>
            rows.every((text, i) => text === bits[i]),
          );
        },
        islands = new Map<number, number>();
      for (let index = 0; index < n * n; index++) {
        const value = numberAt(index);
        if (value >= 1) islands.set(index, value);
      }
      expect(islands.size).toBeGreaterThanOrEqual(6);
      // For every island and each direction right / down, find the next island in line and count the bridge between them.
      const edges: [number, number, number][] = [],
        horizontalCells = new Set<number>(),
        verticalCells = new Set<number>();
      for (const [a] of islands)
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
        ]) {
          let x = (a % n) + dx,
            y = Math.floor(a / n) + dy;
          while (x < n && y < n && !islands.has(y * n + x)) {
            x += dx;
            y += dy;
          }
          if (x >= n || y >= n) continue;
          const b = y * n + x,
            [au, av] = centre(a),
            [bu, bv] = centre(b),
            counts = [0.5, 0.35, 0.65].map((t) => {
              const mu = au + (bu - au) * t,
                mv = av + (bv - av) * t,
                // Lines run along the segment; look across it.
                across: [number, number] = dx === 1 ? [0, 1] : [1, 0],
                middle = ink(mu, mv),
                side1 = ink(
                  mu + across[0] * p.doubleOffset,
                  mv + across[1] * p.doubleOffset,
                ),
                side2 = ink(
                  mu - across[0] * p.doubleOffset,
                  mv - across[1] * p.doubleOffset,
                );
              return middle ? 1 : side1 && side2 ? 2 : 0;
            });
          // A bridge looks the same all along its length. Without one, a sample can still hit an unrelated
          // bridge crossing the line, so the smallest of the three counts decides.
          const count = Math.min(...counts);
          if (count === 0) continue;
          expect(new Set(counts).size).toBe(1);
          edges.push([a, b, count]);
          for (let k = 1; k < Math.abs(b - a) / (dx === 1 ? 1 : n); k++)
            (dx === 1 ? horizontalCells : verticalCells).add(
              a + k * (dx === 1 ? 1 : n),
            );
        }
      // No cell is crossed by a horizontal and a vertical bridge.
      for (const index of horizontalCells)
        expect(verticalCells.has(index)).toBe(false);
      // Each island's number is the number of bridges attached to it.
      const total = new Map<number, number>(
        [...islands.keys()].map((index) => [index, 0]),
      );
      for (const [a, b, count] of edges) {
        total.set(a, (total.get(a) ?? 0) + count);
        total.set(b, (total.get(b) ?? 0) + count);
      }
      for (const [index, value] of islands)
        expect(total.get(index)).toBe(value);
      // All islands are connected through the bridges.
      const seen = new Set<number>([[...islands.keys()][0]]),
        queue = [[...islands.keys()][0]];
      for (let i = 0; i < queue.length; i++)
        for (const [a, b] of edges) {
          const next = a === queue[i] ? b : b === queue[i] ? a : -1;
          if (next >= 0 && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      expect(seen.size).toBe(islands.size);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hashibridges', 0),
      b = createSurfaceSampler('hashibridges', 7),
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

describe('slitherlinkloop: one closed loop whose edges match the numbers', () => {
  const p = proceduralMaterialPresets.slitherlinkloop;
  const n = p.size;
  const side = 1 - 2 * p.margin;
  const cell = side / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'forms a single cycle and every cell number counts the loop edges around it (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('slitherlinkloop', seed),
        out = empty(),
        dark = (u: number, v: number): boolean => {
          sample(u, v, out);
          return out.color < 0.5;
        },
        // Loop edges: a dark bar at the middle of the segment between two neighbouring dots.
        horizontal: boolean[][] = [],
        vertical: boolean[][] = [];
      for (let y = 0; y <= n; y++) {
        horizontal.push(
          Array.from({ length: n }, (_, x) =>
            dark(p.margin + (x + 0.5) * cell, p.margin + y * cell),
          ),
        );
        vertical.push(
          Array.from(
            { length: n + 1 },
            (_, x) =>
              y < n && dark(p.margin + x * cell, p.margin + (y + 0.5) * cell),
          ),
        );
      }
      // Cell numbers from the dot-matrix glyphs.
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text += dark(
                p.margin + (col + 0.5) * cell + (x - 1) * p.pixel,
                p.margin + (row + 0.5) * cell + (y - 2) * p.pixel,
              )
                ? '#'
                : '.';
            bits.push(text);
          }
          const number = art.findIndex((rows) =>
              rows.every((line, i) => line === bits[i]),
            ),
            around = [
              horizontal[row][col],
              horizontal[row + 1][col],
              vertical[row][col],
              vertical[row][col + 1],
            ].filter(Boolean).length;
          expect(number).toBe(around);
        }
      // Every dot touches 0 or 2 loop edges, and the loop edges form one connected cycle.
      const neighbours = (x: number, y: number): [number, number][] => {
        const list: [number, number][] = [];
        if (x < n && horizontal[y][x]) list.push([x + 1, y]);
        if (x > 0 && horizontal[y][x - 1]) list.push([x - 1, y]);
        if (y < n && vertical[y][x]) list.push([x, y + 1]);
        if (y > 0 && vertical[y - 1][x]) list.push([x, y - 1]);
        return list;
      };
      const onLoop: [number, number][] = [];
      for (let y = 0; y <= n; y++)
        for (let x = 0; x <= n; x++) {
          const degree = neighbours(x, y).length;
          expect([0, 2]).toContain(degree);
          if (degree === 2) onLoop.push([x, y]);
        }
      expect(onLoop.length).toBeGreaterThanOrEqual(12);
      const seen = new Set<string>([onLoop[0].join(',')]),
        queue = [onLoop[0]];
      for (let i = 0; i < queue.length; i++)
        for (const next of neighbours(queue[i][0], queue[i][1]))
          if (!seen.has(next.join(','))) {
            seen.add(next.join(','));
            queue.push(next);
          }
      expect(seen.size).toBe(onLoop.length);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('slitherlinkloop', 0),
      b = createSurfaceSampler('slitherlinkloop', 7),
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

describe('masyupearls: one closed loop and pearls that obey the Masyu rules', () => {
  const p = proceduralMaterialPresets.masyupearls;
  const n = p.size;
  const dots = n + 1;
  const side = 1 - 2 * p.margin;
  const cell = side / n;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'forms one cycle, white pearls go straight beside a turn and black pearls turn between straights (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('masyupearls', seed),
        out = empty(),
        tone = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        dotU = (x: number): number => p.margin + x * cell,
        horizontal: boolean[][] = [],
        vertical: boolean[][] = [];
      for (let y = 0; y < dots; y++) {
        horizontal.push(
          Array.from(
            { length: n },
            (_, x) => tone(dotU(x) + cell / 2, dotU(y)) < 0.5,
          ),
        );
        vertical.push(
          Array.from(
            { length: dots },
            (_, x) => y < n && tone(dotU(x), dotU(y) + cell / 2) < 0.5,
          ),
        );
      }
      const links = (x: number, y: number): [number, number][] => {
        const list: [number, number][] = [];
        if (x < n && horizontal[y][x]) list.push([x + 1, y]);
        if (x > 0 && horizontal[y][x - 1]) list.push([x - 1, y]);
        if (y < n && vertical[y][x]) list.push([x, y + 1]);
        if (y > 0 && vertical[y - 1][x]) list.push([x, y - 1]);
        return list;
      };
      const onLoop: [number, number][] = [];
      for (let y = 0; y < dots; y++)
        for (let x = 0; x < dots; x++) {
          const degree = links(x, y).length;
          expect([0, 2]).toContain(degree);
          if (degree === 2) onLoop.push([x, y]);
        }
      expect(onLoop.length).toBeGreaterThanOrEqual(12);
      // One cycle: everything on the loop is reachable from the first dot.
      const seen = new Set<string>([onLoop[0].join(',')]),
        queue = [onLoop[0]];
      for (let i = 0; i < queue.length; i++)
        for (const next of links(queue[i][0], queue[i][1]))
          if (!seen.has(next.join(','))) {
            seen.add(next.join(','));
            queue.push(next);
          }
      expect(seen.size).toBe(onLoop.length);
      const goesStraight = (x: number, y: number): boolean => {
        const [a, b] = links(x, y);
        return a[0] + b[0] === 2 * x && a[1] + b[1] === 2 * y;
      };
      // Pearls are read at the dot: a ring at the pearl radius shows on the diagonal, a dark centre means black.
      let white = 0,
        black = 0;
      for (const [x, y] of onLoop) {
        const diagonal = (r: number): boolean =>
          [-1, 1].every((sx) =>
            [-1, 1].every(
              (sy) =>
                tone(
                  dotU(x) + (sx * r) / Math.SQRT2,
                  dotU(y) + (sy * r) / Math.SQRT2,
                ) < 0.5,
            ),
          );
        if (!diagonal(p.pearlRadius * 0.999)) continue;
        const around = links(x, y);
        if (diagonal(p.pearlRadius * 0.45)) {
          black++;
          // Black: the loop turns here and goes straight through both neighbouring dots.
          expect(goesStraight(x, y)).toBe(false);
          for (const [nx, ny] of around)
            expect(goesStraight(nx, ny)).toBe(true);
        } else {
          white++;
          // White: the loop goes straight here and turns at one or both neighbouring dots.
          expect(goesStraight(x, y)).toBe(true);
          expect(around.some(([nx, ny]) => !goesStraight(nx, ny))).toBe(true);
        }
      }
      expect(white + black).toBeGreaterThanOrEqual(p.minPearls);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('masyupearls', 0),
      b = createSurfaceSampler('masyupearls', 7),
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

describe('stringartcurves: each circle holds exactly the chords i to k·i mod n of its multiplier', () => {
  const p = proceduralMaterialPresets.stringartcurves;
  const n = p.points;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows every chord of one multiplier per quadrant and the four multipliers once each (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('stringartcurves', seed),
        out = empty(),
        found: number[] = [];
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        const cx = (quadrant & 1) * 0.5 + 0.25,
          cy = (quadrant >> 1) * 0.5 + 0.25;
        // The circle is turned by an unknown fraction of one point spacing, so try 64 turns and every
        // multiplier and keep a pair for which every chord midpoint is drawn.
        const matches: { multiplier: number; turn: number }[] = [];
        for (const multiplier of p.multipliers)
          for (let step = 0; step < 64; step++) {
            const turn = ((step + 0.5) / 64) * ((2 * Math.PI) / n);
            let all = true;
            for (let i = 0; i < n && all; i++) {
              const j = (multiplier * i) % n;
              if (j === i) continue;
              const angleA = turn + (2 * Math.PI * i) / n,
                angleB = turn + (2 * Math.PI * j) / n;
              sample(
                cx + (p.radius * (Math.cos(angleA) + Math.cos(angleB))) / 2,
                cy + (p.radius * (Math.sin(angleA) + Math.sin(angleB))) / 2,
                out,
              );
              all = out.color > 0.6;
            }
            if (all) matches.push({ multiplier, turn });
          }
        // Only the true multiplier explains all the chords.
        expect(new Set(matches.map((match) => match.multiplier)).size).toBe(1);
        found.push(matches[0].multiplier);
      }
      expect([...found].sort()).toEqual([...p.multipliers].sort());
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('stringartcurves', 0),
      b = createSurfaceSampler('stringartcurves', 7),
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

describe('fillominoregions: every connected group of equal numbers has that many cells', () => {
  const p = proceduralMaterialPresets.fillominoregions;
  const n = p.size;
  const side = 1 - 2 * p.margin;
  const cell = side / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has regions whose size equals their number (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('fillominoregions', seed),
        out = empty(),
        pixel = cell * p.digitFraction,
        grid: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              sample(
                p.margin + (col + 0.5) * cell + (x - 1) * pixel,
                p.margin + (row + 0.5) * cell + (y - 2) * pixel,
                out,
              );
              text += out.color < 0.3 ? '#' : '.';
            }
            bits.push(text);
          }
          const digit = art.findIndex((rows) =>
            rows.every((line, i) => line === bits[i]),
          );
          expect(digit).toBeGreaterThanOrEqual(1);
          grid.push(digit);
        }
      // Flood fill each group of equal neighbouring numbers: its cell count must equal the number written in it.
      const seen = new Set<number>();
      let regions = 0;
      for (let start = 0; start < n * n; start++) {
        if (seen.has(start)) continue;
        const group = [start];
        seen.add(start);
        for (let i = 0; i < group.length; i++) {
          const x = group[i] % n,
            y = Math.floor(group[i] / n);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
            const next = ny * n + nx;
            if (!seen.has(next) && grid[next] === grid[start]) {
              seen.add(next);
              group.push(next);
            }
          }
        }
        expect(group.length).toBe(grid[start]);
        regions++;
      }
      expect(regions).toBeGreaterThanOrEqual(10);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('fillominoregions', 0),
      b = createSurfaceSampler('fillominoregions', 7),
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

describe('futoshikigrid: a Latin square whose inequality signs hold', () => {
  const p = proceduralMaterialPresets.futoshikigrid;
  const n = p.size;
  const pitch = p.cellSize + p.gap;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has each of 1 to n once per row and column and every drawn sign points at the smaller number (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('futoshikigrid', seed),
        out = empty(),
        dark = (u: number, v: number): boolean => {
          sample(u, v, out);
          return out.color < 0.3;
        },
        cellU = (col: number): number => p.margin + col * pitch,
        pixel = p.cellSize * p.digitFraction,
        grid: number[][] = [];
      for (let row = 0; row < n; row++) {
        const line: number[] = [];
        for (let col = 0; col < n; col++) {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text += dark(
                cellU(col) + p.cellSize / 2 + (x - 1) * pixel,
                cellU(row) + p.cellSize / 2 + (y - 2) * pixel,
              )
                ? '#'
                : '.';
            bits.push(text);
          }
          const digit = art.findIndex((rows) =>
            rows.every((text, i) => text === bits[i]),
          );
          expect(digit).toBeGreaterThanOrEqual(1);
          line.push(digit);
        }
        grid.push(line);
      }
      const digits = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = 0; i < n; i++) {
        expect([...grid[i]].sort((a, b) => a - b)).toEqual(digits);
        expect(grid.map((line) => line[i]).sort((a, b) => a - b)).toEqual(
          digits,
        );
      }
      // Signs: the apex of the chevron sits at the smaller number's side; neither end inked means no sign.
      let signs = 0;
      const reach = p.signReach;
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          if (col < n - 1) {
            const gu = cellU(col) + p.cellSize + p.gap / 2,
              gv = cellU(row) + p.cellSize / 2,
              left = dark(gu - reach, gv),
              right = dark(gu + reach, gv);
            expect(left && right).toBe(false);
            if (left || right) {
              signs++;
              expect(grid[row][col] < grid[row][col + 1]).toBe(left);
            }
          }
          if (row < n - 1) {
            const gu = cellU(col) + p.cellSize / 2,
              gv = cellU(row) + p.cellSize + p.gap / 2,
              up = dark(gu, gv - reach),
              below = dark(gu, gv + reach);
            expect(up && below).toBe(false);
            if (up || below) {
              signs++;
              expect(grid[row][col] < grid[row + 1][col]).toBe(up);
            }
          }
        }
      expect(signs).toBeGreaterThanOrEqual(6);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('futoshikigrid', 0),
      b = createSurfaceSampler('futoshikigrid', 7),
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

describe('nurikabeislands: a solved Nurikabe', () => {
  const p = proceduralMaterialPresets.nurikabeislands;
  const n = p.size;
  const side = 1 - 2 * p.margin;
  const cell = side / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has numbered islands of that size, a connected sea and no 2×2 pool (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('nurikabeislands', seed),
        out = empty(),
        pixel = cell * p.digitFraction,
        land: boolean[] = [],
        clue: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          sample(
            p.margin + (col + 0.15) * cell,
            p.margin + (row + 0.15) * cell,
            out,
          );
          land.push(out.color > 0.5);
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              sample(
                p.margin + (col + 0.5) * cell + (x - 1) * pixel,
                p.margin + (row + 0.5) * cell + (y - 2) * pixel,
                out,
              );
              text += out.color < 0.3 && land[land.length - 1] ? '#' : '.';
            }
            bits.push(text);
          }
          const digit = art.findIndex((rows) =>
            rows.every((line, i) => line === bits[i]),
          );
          // A land cell shows either one of the digits or nothing at all; a sea cell never shows a digit.
          if (digit === -1)
            expect(bits.every((line) => line === '...')).toBe(true);
          clue.push(digit);
        }
      const neighbours = (i: number): number[] => {
        const x = i % n,
          y = Math.floor(i / n),
          list: number[] = [];
        if (x < n - 1) list.push(i + 1);
        if (x > 0) list.push(i - 1);
        if (y < n - 1) list.push(i + n);
        if (y > 0) list.push(i - n);
        return list;
      };
      const flood = (
        start: number,
        want: boolean,
        seen: Set<number>,
      ): number[] => {
        const group = [start];
        seen.add(start);
        for (let i = 0; i < group.length; i++)
          for (const next of neighbours(group[i]))
            if (land[next] === want && !seen.has(next)) {
              seen.add(next);
              group.push(next);
            }
        return group;
      };
      // Every island carries exactly one clue and its size equals that clue.
      const seen = new Set<number>();
      let islands = 0;
      for (let i = 0; i < n * n; i++) {
        if (!land[i] || seen.has(i)) continue;
        const group = flood(i, true, seen),
          clues = group.filter((c) => clue[c] !== -1);
        expect(clues.length).toBe(1);
        expect(clue[clues[0]]).toBe(group.length);
        islands++;
      }
      expect(islands).toBeGreaterThanOrEqual(5);
      // Clues only on land.
      for (let i = 0; i < n * n; i++)
        if (clue[i] !== -1) expect(land[i]).toBe(true);
      // The sea is one connected body.
      const seaSeen = new Set<number>(),
        sea = land
          .map((isLand, i) => (isLand ? -1 : i))
          .filter((i) => i !== -1);
      expect(flood(sea[0], false, seaSeen).length).toBe(sea.length);
      // No 2 x 2 pool.
      for (let y = 0; y < n - 1; y++)
        for (let x = 0; x < n - 1; x++) {
          const i = y * n + x;
          expect(
            !land[i] && !land[i + 1] && !land[i + n] && !land[i + n + 1],
          ).toBe(false);
        }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('nurikabeislands', 0),
      b = createSurfaceSampler('nurikabeislands', 7),
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

describe('tentsandtrees: a solved Tents puzzle', () => {
  const p = proceduralMaterialPresets.tentsandtrees;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / (n + 1);
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has non-touching tents that pair one-to-one with adjacent trees and matching counts (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('tentsandtrees', seed),
        out = empty(),
        pixel = cell * p.digitFraction,
        at = (col: number, row: number, fx: number, fy: number): number => {
          sample(
            p.margin + (col + fx) * cell,
            p.margin + (row + fy) * cell,
            out,
          );
          return out.color;
        },
        // Tree: a wide canopy at mid height and no wide base; tent: wide base and a narrow top.
        grid: string[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const canopy = at(col, row, 0.3, 0.4) < 0.5,
            base = at(col, row, 0.25, 0.78) < 0.5;
          expect(canopy && base).toBe(false);
          grid.push(canopy ? 'tree' : base ? 'tent' : 'grass');
        }
      const digitAt = (col: number, row: number): number => {
        const bits: string[] = [];
        for (let y = 0; y < 5; y++) {
          let text = '';
          for (let x = 0; x < 3; x++)
            text +=
              at(
                col,
                row,
                0.5 + ((x - 1) * pixel) / cell,
                0.5 + ((y - 2) * pixel) / cell,
              ) < 0.3
                ? '#'
                : '.';
          bits.push(text);
        }
        return art.findIndex((rows) =>
          rows.every((line, i) => line === bits[i]),
        );
      };
      const tents: number[] = [],
        trees: number[] = [];
      grid.forEach((what, i) => {
        if (what === 'tent') tents.push(i);
        if (what === 'tree') trees.push(i);
      });
      expect(tents.length).toBeGreaterThanOrEqual(8);
      // No two tents touch, not even diagonally.
      for (const a of tents)
        for (const b of tents)
          if (a < b)
            expect(
              Math.max(
                Math.abs((a % n) - (b % n)),
                Math.abs(Math.floor(a / n) - Math.floor(b / n)),
              ),
            ).toBeGreaterThan(1);
      // Row and column clues equal the tent counts.
      for (let i = 0; i < n; i++) {
        expect(digitAt(n, i)).toBe(
          tents.filter((t) => Math.floor(t / n) === i).length,
        );
        expect(digitAt(i, n)).toBe(tents.filter((t) => t % n === i).length);
      }
      // A perfect matching between tents and orthogonally adjacent trees (augmenting paths).
      const adjacent = (a: number, b: number): boolean =>
        Math.abs((a % n) - (b % n)) +
          Math.abs(Math.floor(a / n) - Math.floor(b / n)) ===
        1;
      const owner = new Map<number, number>();
      const augment = (tent: number, seen: Set<number>): boolean => {
        for (const tree of trees) {
          if (!adjacent(tent, tree) || seen.has(tree)) continue;
          seen.add(tree);
          const held = owner.get(tree);
          if (held === undefined || augment(held, seen)) {
            owner.set(tree, tent);
            return true;
          }
        }
        return false;
      };
      for (const tent of tents) expect(augment(tent, new Set())).toBe(true);
      // Every tree belongs to a tent too, so the counts agree.
      expect(trees.length).toBe(tents.length);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('tentsandtrees', 0),
      b = createSurfaceSampler('tentsandtrees', 7),
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

describe('shikakurects: a solved Shikaku', () => {
  const p = proceduralMaterialPresets.shikakurects;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'splits the board into rectangles that each hold one clue equal to their area (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('shikakurects', seed),
        out = empty(),
        pixel = cell * p.digitFraction,
        at = (u: number, v: number): number => {
          sample(p.margin + u * cell, p.margin + v * cell, out);
          return out.color;
        },
        clue: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text +=
                at(
                  col + 0.5 + (x - 1) * (pixel / cell),
                  row + 0.5 + (y - 2) * (pixel / cell),
                ) < 0.3
                  ? '#'
                  : '.';
            bits.push(text);
          }
          const digit = art.findIndex((rows) =>
            rows.every((line, i) => line === bits[i]),
          );
          if (digit === -1)
            expect(bits.every((line) => line === '...')).toBe(true);
          clue.push(digit);
        }
      // Thick walls between cells (measured on the boundary itself, away from the digits) split the board.
      const wall = (col: number, row: number, across: boolean): boolean =>
        across ? at(col + 1, row + 0.2) < 0.3 : at(col + 0.2, row + 1) < 0.3;
      const seen = new Set<number>();
      let regions = 0;
      for (let start = 0; start < n * n; start++) {
        if (seen.has(start)) continue;
        const group = [start];
        seen.add(start);
        for (let i = 0; i < group.length; i++) {
          const col = group[i] % n,
            row = Math.floor(group[i] / n),
            next: number[] = [];
          if (col < n - 1 && !wall(col, row, true)) next.push(group[i] + 1);
          if (col > 0 && !wall(col - 1, row, true)) next.push(group[i] - 1);
          if (row < n - 1 && !wall(col, row, false)) next.push(group[i] + n);
          if (row > 0 && !wall(col, row - 1, false)) next.push(group[i] - n);
          for (const other of next)
            if (!seen.has(other)) {
              seen.add(other);
              group.push(other);
            }
        }
        const xs = group.map((c) => c % n),
          ys = group.map((c) => Math.floor(c / n)),
          width = Math.max(...xs) - Math.min(...xs) + 1,
          height = Math.max(...ys) - Math.min(...ys) + 1,
          clues = group.filter((c) => clue[c] !== -1);
        expect(group.length).toBe(width * height);
        expect(clues.length).toBe(1);
        expect(clue[clues[0]]).toBe(group.length);
        regions++;
      }
      expect(regions).toBeGreaterThanOrEqual(12);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('shikakurects', 0),
      b = createSurfaceSampler('shikakurects', 7),
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

describe('hitorishading: a solved Hitori', () => {
  const p = proceduralMaterialPresets.hitorishading;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shades non-touching duplicates so the rest has no repeats and stays connected (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hitorishading', seed),
        out = empty(),
        pixel = cell * p.digitFraction,
        at = (u: number, v: number): number => {
          sample(p.margin + u * cell, p.margin + v * cell, out);
          return out.color;
        },
        shaded: boolean[] = [],
        value: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const dark = at(col + 0.1, row + 0.1) < 0.5,
            bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            // A digit is dark on a light cell and light on a shaded cell.
            for (let x = 0; x < 3; x++) {
              const sampled = at(
                col + 0.5 + (x - 1) * (pixel / cell),
                row + 0.5 + (y - 2) * (pixel / cell),
              );
              text += (dark ? sampled > 0.5 : sampled < 0.3) ? '#' : '.';
            }
            bits.push(text);
          }
          const digit = art.findIndex((rows) =>
            rows.every((line, i) => line === bits[i]),
          );
          expect(digit).toBeGreaterThanOrEqual(1);
          shaded.push(dark);
          value.push(digit);
        }
      expect(shaded.filter(Boolean).length).toBeGreaterThanOrEqual(8);
      const same = (a: number, b: number): boolean =>
        a % n === b % n || Math.floor(a / n) === Math.floor(b / n);
      for (let a = 0; a < n * n; a++) {
        // Shaded cells never touch orthogonally.
        if (shaded[a]) {
          if (a % n < n - 1) expect(shaded[a + 1]).toBe(false);
          if (a < n * (n - 1)) expect(shaded[a + n]).toBe(false);
        }
        for (let b = a + 1; b < n * n; b++) {
          if (!same(a, b) || shaded[a] || shaded[b]) continue;
          expect(value[a]).not.toBe(value[b]);
        }
        // A shaded number repeats an unshaded one in its row or column; otherwise shading it would be pointless.
        if (shaded[a])
          expect(
            Array.from({ length: n * n }, (_, b) => b).some(
              (b) =>
                b !== a && same(a, b) && !shaded[b] && value[b] === value[a],
            ),
          ).toBe(true);
      }
      // The unshaded cells form one connected body.
      const open = Array.from({ length: n * n }, (_, i) => i).filter(
          (i) => !shaded[i],
        ),
        seen = new Set<number>([open[0]]),
        queue = [open[0]];
      for (let i = 0; i < queue.length; i++) {
        const x = queue[i] % n,
          y = Math.floor(queue[i] / n);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
          const next = ny * n + nx;
          if (!shaded[next] && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect(seen.size).toBe(open.length);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hitorishading', 0),
      b = createSurfaceSampler('hitorishading', 7),
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

describe('akarilights: a solved Akari (Light Up)', () => {
  const p = proceduralMaterialPresets.akarilights;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lights every white cell with no two facing bulbs and correct wall counts (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('akarilights', seed),
        out = empty(),
        pixel = cell * p.digitFraction,
        at = (u: number, v: number): number => {
          sample(p.margin + u * cell, p.margin + v * cell, out);
          return out.color;
        },
        wall: boolean[] = [],
        bulb: boolean[] = [],
        clue: number[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const black = at(col + 0.1, row + 0.1) < 0.5;
          wall.push(black);
          bulb.push(!black && at(col + 0.5, row + 0.5) < 0.4);
          // Wall numbers are light on the dark wall.
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text +=
                black &&
                at(
                  col + 0.5 + (x - 1) * (pixel / cell),
                  row + 0.5 + (y - 2) * (pixel / cell),
                ) > 0.5
                  ? '#'
                  : '.';
            bits.push(text);
          }
          const digit = art.findIndex((rows) =>
            rows.every((line, i) => line === bits[i]),
          );
          if (digit === -1)
            expect(bits.every((line) => line === '...')).toBe(true);
          clue.push(digit);
        }
      expect(wall.filter(Boolean).length).toBeGreaterThanOrEqual(8);
      expect(bulb.filter(Boolean).length).toBeGreaterThanOrEqual(6);
      // Walk from every bulb along its row and column until a wall.
      const seen = Array.from({ length: n * n }, () => 0),
        directions = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
      for (let index = 0; index < n * n; index++) {
        if (!bulb[index]) continue;
        seen[index]++;
        for (const [dx, dy] of directions) {
          let x = (index % n) + dx,
            y = Math.floor(index / n) + dy;
          while (x >= 0 && y >= 0 && x < n && y < n && !wall[y * n + x]) {
            // A bulb that sees another bulb is a violation.
            expect(bulb[y * n + x]).toBe(false);
            seen[y * n + x]++;
            x += dx;
            y += dy;
          }
        }
      }
      for (let index = 0; index < n * n; index++) {
        if (!wall[index]) expect(seen[index]).toBeGreaterThan(0);
        else {
          expect(bulb[index]).toBe(false);
          if (clue[index] !== -1) {
            const x = index % n,
              y = Math.floor(index / n);
            const around = directions.filter(
              ([dx, dy]) =>
                x + dx >= 0 &&
                y + dy >= 0 &&
                x + dx < n &&
                y + dy < n &&
                bulb[(y + dy) * n + x + dx],
            ).length;
            expect(clue[index]).toBe(around);
          }
        }
      }
      expect(clue.filter((c) => c !== -1).length).toBeGreaterThanOrEqual(3);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('akarilights', 0),
      b = createSurfaceSampler('akarilights', 7),
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

describe('takuzugrid: a solved Takuzu (Binairo)', () => {
  const p = proceduralMaterialPresets.takuzugrid;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has balanced rows and columns, no three in a line and no repeated line (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('takuzugrid', seed),
        out = empty(),
        at = (col: number, row: number, dx: number, dy: number): number => {
          sample(
            p.margin + (col + 0.5 + dx) * cell,
            p.margin + (row + 0.5 + dy) * cell,
            out,
          );
          return out.color;
        },
        grid: number[][] = [];
      for (let row = 0; row < n; row++) {
        const line: number[] = [];
        for (let col = 0; col < n; col++) {
          const centre = at(col, row, 0, 0) < 0.4,
            // A ring is light in the middle and dark in a band between the two radii.
            ringBand =
              at(col, row, p.discRadius - p.ringWidth / 2, 0) < 0.4 &&
              at(col, row, 0, -(p.discRadius - p.ringWidth / 2)) < 0.4;
          // Dark in the middle is a disc (1); otherwise it must be a ring (0): light centre, dark band around it.
          if (!centre) expect(ringBand).toBe(true);
          line.push(centre ? 1 : 0);
        }
        grid.push(line);
      }
      const lines = [
        ...grid,
        ...Array.from({ length: n }, (_, c) => grid.map((line) => line[c])),
      ];
      for (const line of lines) {
        expect(line.reduce((sum, bit) => sum + bit, 0)).toBe(n / 2);
        for (let i = 2; i < n; i++)
          expect(line[i] === line[i - 1] && line[i] === line[i - 2]).toBe(
            false,
          );
      }
      const rowKeys = grid.map((line) => line.join('')),
        columnKeys = lines.slice(n).map((line) => line.join(''));
      expect(new Set(rowKeys).size).toBe(n);
      expect(new Set(columnKeys).size).toBe(n);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('takuzugrid', 0),
      b = createSurfaceSampler('takuzugrid', 7),
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

describe('kenkencages: a solved KenKen', () => {
  const p = proceduralMaterialPresets.kenkencages;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;
  const art: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '+': ['...', '.#.', '###', '.#.', '...'],
    '*': ['...', '#.#', '.#.', '#.#', '...'],
    '-': ['...', '...', '###', '...', '...'],
    '/': ['.#.', '...', '###', '...', '.#.'],
  };
  const read = (bits: string[]): string | null => {
    const found = Object.entries(art).find(([, rows]) =>
      rows.every((line, i) => line === bits[i]),
    );
    return found ? found[0] : null;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has a Latin square whose cages satisfy their targets and operators (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('kenkencages', seed),
        out = empty(),
        at = (col: number, row: number, fx: number, fy: number): number => {
          sample(
            p.margin + (col + fx) * cell,
            p.margin + (row + fy) * cell,
            out,
          );
          return out.color;
        },
        pixel = p.digitFraction,
        small = p.labelFraction,
        values: number[] = [],
        labels = new Map<number, string>();
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text +=
                at(
                  col,
                  row,
                  0.5 + (x - 1) * pixel,
                  p.digitY + (y - 2) * pixel,
                ) < 0.3
                  ? '#'
                  : '.';
            bits.push(text);
          }
          const digit = read(bits);
          expect(digit).not.toBeNull();
          values.push(Number(digit));
          // A label, if any, is read letter by letter from the top-left corner until a blank letter.
          let label = '';
          for (let k = 0; k < 4; k++) {
            const letterBits: string[] = [];
            for (let y = 0; y < 5; y++) {
              let text = '';
              for (let x = 0; x < 3; x++)
                text +=
                  at(
                    col,
                    row,
                    p.labelX + (k * 4 + x + 0.5) * small,
                    p.labelY + (y + 0.5) * small,
                  ) < 0.3
                    ? '#'
                    : '.';
              letterBits.push(text);
            }
            if (letterBits.every((line) => line === '...')) break;
            const letter = read(letterBits);
            expect(letter).not.toBeNull();
            label += letter;
          }
          if (label !== '') labels.set(row * n + col, label);
        }
      // Latin square.
      const wanted = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = 0; i < n; i++) {
        expect(values.slice(i * n, i * n + n).sort((a, b) => a - b)).toEqual(
          wanted,
        );
        expect(
          Array.from({ length: n }, (_, r) => values[r * n + i]).sort(
            (a, b) => a - b,
          ),
        ).toEqual(wanted);
      }
      // Cages: cells joined unless a thick wall is drawn on the boundary between them.
      const wall = (col: number, row: number, across: boolean): boolean =>
        across ? at(col, row, 1, 0.5) < 0.3 : at(col, row, 0.5, 1) < 0.3;
      const seen = new Set<number>();
      let cages = 0;
      for (let start = 0; start < n * n; start++) {
        if (seen.has(start)) continue;
        const group = [start];
        seen.add(start);
        for (let i = 0; i < group.length; i++) {
          const col = group[i] % n,
            row = Math.floor(group[i] / n),
            next: number[] = [];
          if (col < n - 1 && !wall(col, row, true)) next.push(group[i] + 1);
          if (col > 0 && !wall(col - 1, row, true)) next.push(group[i] - 1);
          if (row < n - 1 && !wall(col, row, false)) next.push(group[i] + n);
          if (row > 0 && !wall(col, row - 1, false)) next.push(group[i] - n);
          for (const other of next)
            if (!seen.has(other)) {
              seen.add(other);
              group.push(other);
            }
        }
        expect(group.length).toBeLessThanOrEqual(p.maxCage);
        // The one label of a cage sits in its first cell in reading order.
        const labelled = group.filter((c) => labels.has(c));
        expect(labelled).toEqual([Math.min(...group)]);
        const label = labels.get(labelled[0]) as string,
          operator = /[+*\-/]$/.test(label) ? label.slice(-1) : '',
          target = Number(operator === '' ? label : label.slice(0, -1)),
          digits = group.map((c) => values[c]);
        if (group.length === 1) expect(operator).toBe('');
        else expect(operator).not.toBe('');
        if (operator === '') expect(target).toBe(digits[0]);
        if (operator === '+')
          expect(target).toBe(digits.reduce((a, b) => a + b, 0));
        if (operator === '*')
          expect(target).toBe(digits.reduce((a, b) => a * b, 1));
        if (operator === '-') {
          expect(digits.length).toBe(2);
          expect(target).toBe(Math.max(...digits) - Math.min(...digits));
        }
        if (operator === '/') {
          expect(digits.length).toBe(2);
          expect(target * Math.min(...digits)).toBe(Math.max(...digits));
        }
        cages++;
      }
      expect(cages).toBeGreaterThanOrEqual(5);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('kenkencages', 0),
      b = createSurfaceSampler('kenkencages', 7),
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

describe('numberlinkpaths: a solved Numberlink', () => {
  const p = proceduralMaterialPresets.numberlinkpaths;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'joins each pair of equal numbers by a path and the paths fill every cell (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('numberlinkpaths', seed),
        out = empty(),
        at = (col: number, row: number, fx: number, fy: number): number => {
          sample(
            p.margin + (col + fx) * cell,
            p.margin + (row + fy) * cell,
            out,
          );
          return out.color;
        },
        digitSize = p.digitFraction,
        clue: number[] = [],
        links: number[][] = Array.from({ length: n * n }, () => []);
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          // An endpoint is a dark disc: all four diagonal points inside its radius are dark, away from any stroke.
          const diagonal = [-1, 1].flatMap((a) =>
            [-1, 1].map(
              (b) => at(col, row, 0.5 + 0.22 * a, 0.5 + 0.22 * b) < 0.5,
            ),
          );
          expect(
            diagonal.every(Boolean) || diagonal.every((value) => !value),
          ).toBe(true);
          if (diagonal[0]) {
            const bits: string[] = [];
            for (let y = 0; y < 5; y++) {
              let text = '';
              for (let x = 0; x < 3; x++)
                text +=
                  at(
                    col,
                    row,
                    0.5 + (x - 1) * digitSize,
                    0.5 + (y - 2) * digitSize,
                  ) > 0.5
                    ? '#'
                    : '.';
              bits.push(text);
            }
            const digit = art.findIndex((rows) =>
              rows.every((line, i) => line === bits[i]),
            );
            expect(digit).toBeGreaterThanOrEqual(1);
            clue.push(digit);
          } else clue.push(-1);
          const index = row * n + col;
          if (col < n - 1 && at(col, row, 1, 0.5) < 0.5) {
            links[index].push(index + 1);
            links[index + 1].push(index);
          }
          if (row < n - 1 && at(col, row, 0.5, 1) < 0.5) {
            links[index].push(index + n);
            links[index + n].push(index);
          }
        }
      // Every cell is covered: endpoints end one stroke, other cells pass exactly two.
      for (let index = 0; index < n * n; index++)
        expect(links[index].length).toBe(clue[index] === -1 ? 2 : 1);
      // Follow each path from an endpoint; it must end at the other endpoint with the same number.
      const visited = new Set<number>(),
        used = new Set<number>();
      let paths = 0;
      for (let start = 0; start < n * n; start++) {
        if (clue[start] === -1 || visited.has(start)) continue;
        let previous = -1,
          current = start;
        visited.add(start);
        for (;;) {
          const next = links[current].find((other) => other !== previous);
          if (next === undefined) break;
          previous = current;
          current = next;
          expect(visited.has(current)).toBe(false);
          visited.add(current);
        }
        expect(current).not.toBe(start);
        expect(clue[current]).toBe(clue[start]);
        expect(used.has(clue[start])).toBe(false);
        used.add(clue[start]);
        paths++;
      }
      expect(visited.size).toBe(n * n);
      expect(paths).toBeGreaterThanOrEqual(5);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('numberlinkpaths', 0),
      b = createSurfaceSampler('numberlinkpaths', 7),
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

describe('rushhourjam: a Rush Hour board', () => {
  const p = proceduralMaterialPresets.rushhourjam;
  const n = p.size;
  const side = 1 - 2 * p.margin;
  const cell = side / n;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has non-overlapping straight vehicles, one target car in the exit row and an open exit (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('rushhourjam', seed),
        out = empty(),
        at = (x: number, y: number): number => {
          sample(p.margin + x * cell, p.margin + y * cell, out);
          return out.color;
        },
        occupied: boolean[] = [],
        links: number[][] = Array.from({ length: n * n }, () => []);
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          occupied.push(at(col + 0.5, row + 0.5) < 0.85);
          const index = row * n + col;
          // Two neighbouring cells belong to one vehicle when the body runs on past the shared edge; between
          // different vehicles there is a gap of bare board (measured a little off the hairline grid).
          if (
            col < n - 1 &&
            at(col + 1 - 0.03, row + 0.5) < 0.85 &&
            at(col + 1 + 0.03, row + 0.5) < 0.85
          ) {
            links[index].push(index + 1);
            links[index + 1].push(index);
          }
          if (
            row < n - 1 &&
            at(col + 0.5, row + 1 - 0.03) < 0.85 &&
            at(col + 0.5, row + 1 + 0.03) < 0.85
          ) {
            links[index].push(index + n);
            links[index + n].push(index);
          }
        }
      const seen = new Set<number>();
      let vehicles = 0,
        targets = 0;
      for (let start = 0; start < n * n; start++) {
        if (!occupied[start] || seen.has(start)) continue;
        const group = [start];
        seen.add(start);
        for (let i = 0; i < group.length; i++)
          for (const next of links[group[i]])
            if (!seen.has(next)) {
              seen.add(next);
              group.push(next);
            }
        for (const index of group) expect(occupied[index]).toBe(true);
        const xs = group.map((c) => c % n),
          ys = group.map((c) => Math.floor(c / n)),
          horizontal = new Set(ys).size === 1,
          vertical = new Set(xs).size === 1,
          spanX = Math.max(...xs) - Math.min(...xs) + 1,
          spanY = Math.max(...ys) - Math.min(...ys) + 1;
        // Straight, contiguous, two or three cells long.
        expect(horizontal || vertical).toBe(true);
        expect(group.length).toBe(horizontal ? spanX : spanY);
        expect(group.length).toBeGreaterThanOrEqual(2);
        expect(group.length).toBeLessThanOrEqual(3);
        const isTarget = at(xs[0] + 0.5, ys[0] + 0.5) < 0.2;
        if (isTarget) {
          targets++;
          expect(horizontal).toBe(true);
          expect(ys[0]).toBe(p.exitRow);
          expect(group.length).toBe(2);
        } else if (horizontal) expect(ys[0]).not.toBe(p.exitRow);
        vehicles++;
      }
      expect(targets).toBe(1);
      expect(vehicles).toBeGreaterThanOrEqual(8);
      // The wall around the board is solid except for the opening to the right of the exit row.
      const mid = p.wall / 2 / cell;
      for (let i = 0; i < n; i++) {
        expect(at(i + 0.5, -mid)).toBeLessThan(0.3);
        expect(at(i + 0.5, n + mid)).toBeLessThan(0.3);
        expect(at(-mid, i + 0.5)).toBeLessThan(0.3);
        if (i === p.exitRow) expect(at(n + mid, i + 0.5)).toBeGreaterThan(0.5);
        else expect(at(n + mid, i + 0.5)).toBeLessThan(0.3);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('rushhourjam', 0),
      b = createSurfaceSampler('rushhourjam', 7),
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

describe('mancalaboard: a mid-game Mancala board', () => {
  const p = proceduralMaterialPresets.mancalaboard;
  const containers = 2 * p.pits + 2;
  const centre = (index: number): [number, number] =>
    index < 2 * p.pits
      ? [
          p.pitStart + (index % p.pits) * p.pitPitch,
          p.pitRows[Math.floor(index / p.pits)],
        ]
      : [p.storeCenters[index - 2 * p.pits], 0.5];
  const slots = (index: number): [number, number][] => {
    const pit = index < 2 * p.pits,
      columns = pit ? p.pitSlotColumns : p.storeSlotColumns,
      total = pit ? p.pitCapacity : p.storeCapacity,
      [cx, cy] = centre(index);
    return Array.from({ length: total }, (_, slot) => [
      cx + ((slot % columns) - (columns - 1) / 2) * p.slotPitch,
      cy +
        (Math.floor(slot / columns) - (total / columns - 1) / 2) * p.slotPitch,
    ]);
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'keeps all stones in the pits and stores, clustered, with the right total (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mancalaboard', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        };
      let total = 0;
      for (let index = 0; index < containers; index++) {
        const [cx, cy] = centre(index),
          lit = slots(index).map(([x, y]) => ({
            light: at(x, y) > 0.9,
            distance: Math.hypot(x - cx, y - cy),
          })),
          count = lit.filter((slot) => slot.light).length;
        total += count;
        // The container itself is dark where no stone lies, and stones gather nearest the middle.
        expect(count).toBeLessThanOrEqual(lit.length);
        const farthestStone = Math.max(
            0,
            ...lit.filter((slot) => slot.light).map((slot) => slot.distance),
          ),
          nearestEmpty = Math.min(
            Infinity,
            ...lit.filter((slot) => !slot.light).map((slot) => slot.distance),
          );
        expect(farthestStone).toBeLessThanOrEqual(nearestEmpty + 1e-9);
      }
      expect(total).toBe(p.stones);
      // Every light pixel is part of a stone: it lies near some slot of some container.
      const allSlots = Array.from({ length: containers }, (_, index) =>
        slots(index),
      ).flat();
      let stray = 0;
      for (let y = 0; y < 192; y++)
        for (let x = 0; x < 192; x++) {
          const u = (x + 0.5) / 192,
            v = (y + 0.5) / 192;
          if (
            at(u, v) > 0.9 &&
            !allSlots.some(
              ([sx, sy]) => Math.hypot(u - sx, v - sy) <= p.stoneRadius + 0.004,
            )
          )
            stray++;
        }
      expect(stray).toBe(0);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mancalaboard', 0),
      b = createSurfaceSampler('mancalaboard', 7),
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
        [t, 0.5],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(20);
  });
});

describe('hidatochain: a solved Hidato', () => {
  const p = proceduralMaterialPresets.hidatochain;
  const n = p.size;
  const total = n * n;
  const cell = (1 - 2 * p.margin) / n;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'numbers every cell once so that consecutive numbers are king-move neighbours (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hidatochain', seed),
        out = empty(),
        at = (col: number, row: number, fx: number, fy: number): number => {
          sample(
            p.margin + (col + fx) * cell,
            p.margin + (row + fy) * cell,
            out,
          );
          return out.color;
        },
        pixel = p.digitFraction,
        value: number[] = [],
        dark: boolean[] = [];
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          const background = at(col, row, 0.06, 0.06);
          dark.push(background < 0.5);
          // The 7 x 5 pixel field around the cell centre; ink differs strongly from the cell's own tone.
          const ink: boolean[][] = [];
          for (let c = -3; c <= 3; c++) {
            const column: boolean[] = [];
            for (let r = -2; r <= 2; r++)
              column.push(
                Math.abs(
                  at(col, row, 0.5 + c * pixel, 0.5 + r * pixel) - background,
                ) > 0.4,
              );
            ink.push(column);
          }
          const glyphAt = (first: number): number => {
            const rows = [0, 1, 2, 3, 4].map((y) =>
              [0, 1, 2]
                .map((x) => (ink[first + 3 + x][y] ? '#' : '.'))
                .join(''),
            );
            return art.findIndex((shape) =>
              shape.every((line, i) => line === rows[i]),
            );
          };
          // Ink in the middle column means one centred digit; otherwise two digits either side of a gap.
          const single = ink[3].some(Boolean),
            digits = single ? [glyphAt(-1)] : [glyphAt(-3), glyphAt(1)];
          for (const digit of digits) expect(digit).toBeGreaterThanOrEqual(0);
          value.push(digits.reduce((sum, digit) => sum * 10 + digit, 0));
        }
      expect([...value].sort((a, b) => a - b)).toEqual(
        Array.from({ length: total }, (_, i) => i + 1),
      );
      const where = (k: number): [number, number] => {
        const index = value.indexOf(k);
        return [index % n, Math.floor(index / n)];
      };
      for (let k = 1; k < total; k++) {
        const [ax, ay] = where(k),
          [bx, by] = where(k + 1);
        expect(Math.max(Math.abs(ax - bx), Math.abs(ay - by))).toBe(1);
      }
      // Only the first and last cells are drawn dark.
      expect(dark.filter(Boolean).length).toBe(2);
      expect(dark[value.indexOf(1)]).toBe(true);
      expect(dark[value.indexOf(total)]).toBe(true);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hidatochain', 0),
      b = createSurfaceSampler('hidatochain', 7),
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

describe('euclideanrhythms: sixteen Euclidean rhythm tracks', () => {
  const p = proceduralMaterialPresets.euclideanrhythms;
  const cell = (1 - 2 * p.margin) / p.steps;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'spreads each track pulses as evenly as possible around the loop (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('euclideanrhythms', seed),
        out = empty(),
        pulseCounts = new Set<number>();
      for (let track = 0; track < p.tracks; track++) {
        const onsets: number[] = [];
        for (let step = 0; step < p.steps; step++) {
          sample(
            p.margin + (step + 0.5) * cell,
            p.margin + (track + 0.5) * cell,
            out,
          );
          // A pad is either lit (bright) or unlit (dark); nothing in between.
          expect(out.color > 0.7 || out.color < 0.5).toBe(true);
          if (out.color > 0.7) onsets.push(step);
        }
        const k = onsets.length;
        expect(k).toBeGreaterThanOrEqual(p.minPulses);
        expect(k).toBeLessThanOrEqual(p.maxPulses);
        pulseCounts.add(k);
        // Gaps between consecutive onsets (wrapping around) are floor(n/k) or ceil(n/k), with n mod k of the larger kind.
        const gaps = onsets.map(
            (onset, i) =>
              (onsets[(i + 1) % k] - onset + p.steps) % p.steps || p.steps,
          ),
          low = Math.floor(p.steps / k),
          high = Math.ceil(p.steps / k);
        for (const gap of gaps) expect(gap === low || gap === high).toBe(true);
        expect(gaps.reduce((sum, gap) => sum + gap, 0)).toBe(p.steps);
        expect(gaps.filter((gap) => gap === high && high !== low).length).toBe(
          high === low ? 0 : p.steps % k,
        );
      }
      // Sixteen tracks do not all use the same number of pulses.
      expect(pulseCounts.size).toBeGreaterThanOrEqual(3);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('euclideanrhythms', 0),
      b = createSurfaceSampler('euclideanrhythms', 7),
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

describe('chinesecheckersboard: a Chinese checkers board a few moves in', () => {
  const p = proceduralMaterialPresets.chinesecheckersboard;
  const rowHeight = p.pitch * Math.sqrt(0.75);

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has a rotation-symmetric 121-hole star holding ten marbles of each of six tones (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('chinesecheckersboard', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        centre = (q: number, r: number): [number, number] => [
          0.5 + p.pitch * (q + r / 2),
          0.5 + rowHeight * r,
        ],
        holes = new Set<string>(),
        tones = new Map<string, number>();
      for (let r = -10; r <= 10; r++)
        for (let q = -10; q <= 10; q++) {
          const [cx, cy] = centre(q, r);
          if (cx < 0.01 || cx > 0.99 || cy < 0.01 || cy > 0.99) continue;
          // A hole shows its dark rim a little outside the marble; plate and table are lighter there.
          if (at(cx, cy - 0.39 * p.pitch) > 0.22) continue;
          holes.add(q + ',' + r);
          const middle = at(cx, cy);
          if (middle < 0.22) continue;
          // A marble: the nearest of the six tones, and it must be close to it.
          const nearest = p.marbleTones.reduce(
            (best, tone, i) =>
              Math.abs(tone - middle) < Math.abs(p.marbleTones[best] - middle)
                ? i
                : best,
            0,
          );
          expect(Math.abs(p.marbleTones[nearest] - middle)).toBeLessThan(0.06);
          tones.set(q + ',' + r, nearest);
        }
      expect(holes.size).toBe(121);
      // Rotating the star by 60 degrees (q, r, s) -> (-r, -s, -q) maps the set of holes onto itself.
      for (const key of holes) {
        const [q, r] = key.split(',').map(Number),
          s = -q - r;
        expect(holes.has(-r + ',' + -s)).toBe(true);
      }
      // The central hexagon of radius 4 is all holes; nothing lies farther than 8 steps from the middle.
      for (const key of holes) {
        const [q, r] = key.split(',').map(Number);
        expect(
          Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)),
        ).toBeLessThanOrEqual(8);
      }
      for (let q = -4; q <= 4; q++)
        for (let r = -4; r <= 4; r++)
          if (Math.abs(q + r) <= 4) expect(holes.has(q + ',' + r)).toBe(true);
      // Ten marbles of each tone, and no marble outside a hole.
      const perTone = [0, 0, 0, 0, 0, 0];
      for (const [key, tone] of tones) {
        expect(holes.has(key)).toBe(true);
        perTone[tone]++;
      }
      expect(perTone).toEqual([10, 10, 10, 10, 10, 10]);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('chinesecheckersboard', 0),
      b = createSurfaceSampler('chinesecheckersboard', 7),
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
        [t, 0.5],
        [0.5, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(5);
  });
});

describe('colormapregions: a map coloured so touching regions differ', () => {
  const p = proceduralMaterialPresets.colormapregions;
  const grid = 256;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'keeps the regions separate and gives every pair of touching regions different tones (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('colormapregions', seed),
        out = empty(),
        border: boolean[] = [],
        tone: number[] = [];
      for (let y = 0; y < grid; y++)
        for (let x = 0; x < grid; x++) {
          sample((x + 0.5) / grid, (y + 0.5) / grid, out);
          border.push(out.color < 0.18);
          // Which of the region tones this pixel is nearest to (meaningless on a border).
          tone.push(
            p.regionTones.reduce(
              (best, value, i) =>
                Math.abs(value - out.color) <
                Math.abs(p.regionTones[best] - out.color)
                  ? i
                  : best,
              0,
            ),
          );
        }
      const at = (x: number, y: number): number =>
        (((y % grid) + grid) % grid) * grid + (((x % grid) + grid) % grid);
      // Regions: periodic 4-connected components of the pixels that are not on a border line. Specks of a few
      // pixels left between border strips at a vertex are not regions and are treated like border pixels.
      const region = new Int32Array(grid * grid).fill(-1),
        members: number[][] = [];
      for (let start = 0; start < grid * grid; start++) {
        if (border[start] || region[start] !== -1) continue;
        const id = members.length,
          stack = [start],
          found: number[] = [];
        region[start] = id;
        while (stack.length > 0) {
          const index = stack.pop() as number,
            x = index % grid,
            y = Math.floor(index / grid);
          found.push(index);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const next = at(x + dx, y + dy);
            if (!border[next] && region[next] === -1) {
              region[next] = id;
              stack.push(next);
            }
          }
        }
        members.push(found);
      }
      for (const found of members)
        if (found.length < 100) for (const index of found) region[index] = -1;
      const regions = members.filter((found) => found.length >= 100).length;
      expect(regions).toBe(p.cells * p.cells);
      // Every region has one dominant tone among the five available (the soft edge of a border blends a few
      // pixels towards the border tone, so a small share of pixels may read as a neighbouring tone).
      const votes = new Map<number, number[]>();
      for (let index = 0; index < grid * grid; index++) {
        if (region[index] === -1) continue;
        if (!votes.has(region[index]))
          votes.set(region[index], [0, 0, 0, 0, 0]);
        (votes.get(region[index]) as number[])[tone[index]]++;
      }
      const dominant = new Map<number, number>();
      for (const [id, counts] of votes) {
        const best = counts.indexOf(Math.max(...counts));
        expect(counts[best]).toBeGreaterThanOrEqual(
          0.9 * counts.reduce((sum, count) => sum + count, 0),
        );
        dominant.set(id, best);
      }
      // Across a thin stretch of border (a run of at most four border pixels) the two regions it separates
      // must differ in tone; wider runs near a vertex could cross a sliver and are skipped.
      let pairs = 0;
      for (let y = 0; y < grid; y++)
        for (let x = 0; x < grid; x++) {
          if (!border[at(x, y)]) continue;
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ]) {
            let before = -1,
              after = -1,
              back = 0,
              forward = 0;
            for (let k = 1; k <= 4 && before === -1; k++) {
              before = region[at(x - dx * k, y - dy * k)];
              back = k;
            }
            for (let k = 1; k <= 4 && after === -1; k++) {
              after = region[at(x + dx * k, y + dy * k)];
              forward = k;
            }
            if (
              before === -1 ||
              after === -1 ||
              before === after ||
              back + forward > 5
            )
              continue;
            pairs++;
            expect(dominant.get(before)).not.toBe(dominant.get(after));
          }
        }
      expect(pairs).toBeGreaterThan(200);
      // At most five tones are used, and at least three.
      const used = new Set(dominant.values());
      expect(used.size).toBeLessThanOrEqual(5);
      expect(used.size).toBeGreaterThanOrEqual(3);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('colormapregions', 0),
      b = createSurfaceSampler('colormapregions', 7),
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

describe('draughtsposition: a draughts position', () => {
  const p = proceduralMaterialPresets.draughtsposition;
  const n = p.size;
  const cell = (1 - 2 * p.margin) / n;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has a checkered board with men and kings only on the dark squares and a sensible number of each side (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('draughtsposition', seed),
        out = empty(),
        at = (col: number, row: number, dx: number, dy: number): number => {
          sample(
            p.margin + (col + 0.5 + dx) * cell,
            p.margin + (row + 0.5 + dy) * cell,
            out,
          );
          return out.color;
        },
        counts = { pale: 0, charcoal: 0 };
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          // The square's own colour is read near its corner, away from any piece.
          const corner = at(col, row, -0.45, -0.45),
            dark = (row + col) % 2 === 1;
          expect(dark ? corner < 0.5 : corner > 0.7).toBe(true);
          // A piece shows as a disc: pale on a dark square is far lighter than the square, charcoal far darker.
          const middle = at(col, row, 0.3, 0),
            pale = dark && middle > 0.8,
            charcoal = dark && middle < 0.2;
          // Nothing sits on a light square: it stays the plain light-square tone (a pale piece would be lighter, a charcoal one darker).
          if (!dark) {
            expect(middle).toBeGreaterThan(0.75);
            expect(middle).toBeLessThan(0.93);
          }
          if (pale) counts.pale++;
          if (charcoal) counts.charcoal++;
          if (pale || charcoal) {
            // A king has an inner ring of the opposite tone; a man's disc is plain all the way across.
            const ring = at(col, row, p.ringRadius, 0),
              king = pale ? ring < 0.3 : ring > 0.7;
            const plain = pale ? ring > 0.8 : ring < 0.2;
            expect(king || plain).toBe(true);
          } else if (dark) expect(Math.abs(middle - corner)).toBeLessThan(0.1);
        }
      expect(counts.pale).toBeGreaterThanOrEqual(p.minPieces);
      expect(counts.pale).toBeLessThanOrEqual(p.maxPieces);
      expect(counts.charcoal).toBeGreaterThanOrEqual(p.minPieces);
      expect(counts.charcoal).toBeLessThanOrEqual(p.maxPieces);
    },
  );

  it('crowns some pieces: kings (ring inside the disc) turn up across the seeds but not on every piece', () => {
    const out = empty();
    let kings = 0,
      men = 0;
    for (const seed of [...seeds, 1, 2, 3, 4, 5, 6]) {
      const sample = createSurfaceSampler('draughtsposition', seed);
      for (let row = 0; row < n; row++)
        for (let col = 0; col < n; col++) {
          if ((row + col) % 2 === 0) continue;
          const read = (dx: number): number => {
            sample(
              p.margin + (col + 0.5 + dx) * cell,
              p.margin + (row + 0.5) * cell,
              out,
            );
            return out.color;
          };
          const middle = read(0.3);
          if (middle > 0.2 && middle < 0.8) continue;
          // The inner ring contrasts with the disc only on a king.
          if (Math.abs(read(p.ringRadius) - middle) > 0.5) kings++;
          else men++;
        }
    }
    expect(kings).toBeGreaterThan(0);
    expect(men).toBeGreaterThan(kings);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('draughtsposition', 0),
      b = createSurfaceSampler('draughtsposition', 7),
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

describe('multiplicationtable: a times table', () => {
  const p = proceduralMaterialPresets.multiplicationtable;
  const cells = p.factors + 1;
  const cell = (1 - 2 * p.margin) / cells;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists the factors along the edges and every product inside, squares highlighted (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('multiplicationtable', seed),
        out = empty(),
        at = (col: number, row: number, fx: number, fy: number): number => {
          sample(
            p.margin + (col + fx) * cell,
            p.margin + (row + fy) * cell,
            out,
          );
          return out.color;
        },
        pixel = p.digitFraction;
      const read = (col: number, row: number): number | null => {
        // Ink differs strongly from the cell's own tone (dark digits on light cells, light digits on the header).
        const background = at(col, row, 0.06, 0.06),
          ink: boolean[][] = [];
        for (let c = -3; c <= 3; c++) {
          const column: boolean[] = [];
          for (let r = -2; r <= 2; r++)
            column.push(
              Math.abs(
                at(col, row, 0.5 + c * pixel, 0.5 + r * pixel) - background,
              ) > 0.4,
            );
          ink.push(column);
        }
        if (!ink.some((column) => column.some(Boolean))) return null;
        const glyphAt = (first: number): number => {
          const rows = [0, 1, 2, 3, 4].map((y) =>
            [0, 1, 2].map((x) => (ink[first + 3 + x][y] ? '#' : '.')).join(''),
          );
          return art.findIndex((shape) =>
            shape.every((line, i) => line === rows[i]),
          );
        };
        const digits = ink[3].some(Boolean)
          ? [glyphAt(-1)]
          : [glyphAt(-3), glyphAt(1)];
        for (const digit of digits) expect(digit).toBeGreaterThanOrEqual(0);
        return digits.reduce((sum, digit) => sum * 10 + digit, 0);
      };
      // The corner cell is blank; the header cells are dark with light digits.
      expect(read(0, 0)).toBeNull();
      expect(at(0, 0, 0.06, 0.06)).toBeLessThan(0.3);
      for (let i = 1; i < cells; i++) {
        expect(read(i, 0)).toBe(i);
        expect(read(0, i)).toBe(i);
        expect(at(i, 0, 0.06, 0.06)).toBeLessThan(0.3);
      }
      for (let row = 1; row < cells; row++)
        for (let col = 1; col < cells; col++) {
          expect(read(col, row)).toBe(col * row);
          // Squares sit on the diagonal and have a slightly darker background than the other products.
          const background = at(col, row, 0.06, 0.06);
          expect(background < 0.85).toBe(col === row);
        }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('multiplicationtable', 0),
      b = createSurfaceSampler('multiplicationtable', 7),
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

describe('moonphases: thirty moons through one lunation', () => {
  const p = proceduralMaterialPresets.moonphases;
  const left = (1 - p.columns * p.cell) / 2;
  const top = (1 - p.rows * p.cell) / 2;
  const total = p.columns * p.rows;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lights each moon by the right fraction, from the right while waxing and from the left while waning (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('moonphases', seed),
        out = empty(),
        fractions: number[] = [],
        centroids: number[] = [];
      for (let day = 0; day < total; day++) {
        const cx = left + ((day % p.columns) + 0.5) * p.cell,
          cy = top + (Math.floor(day / p.columns) + 0.5) * p.cell;
        let inside = 0,
          lit = 0,
          sideSum = 0;
        // Sample the disc on a grid of points just inside its rim.
        for (let j = -24; j <= 24; j++)
          for (let i = -24; i <= 24; i++) {
            const dx = i / 24,
              dy = j / 24;
            if (Math.hypot(dx, dy) > 0.95) continue;
            sample(
              cx + dx * p.moonRadius * p.cell,
              cy + dy * p.moonRadius * p.cell,
              out,
            );
            inside++;
            // Lit surface is bright even through a crater (0.95 - 0.12); the shadowed side is dark.
            if (out.color > 0.6) {
              lit++;
              sideSum += dx;
            }
          }
        fractions.push(lit / inside);
        centroids.push(lit === 0 ? 0 : sideSum / lit);
      }
      // The calendar starts some fraction of a day into the lunation: find that offset and check every moon against it.
      const expected = (day: number, offset: number): number =>
        (1 - Math.cos((2 * Math.PI * (day + offset)) / p.synodicDays)) / 2;
      let best = 1,
        bestOffset = 0;
      for (let offset = 0; offset < 1; offset += 0.005) {
        const worst = Math.max(
          ...fractions.map((fraction, day) =>
            Math.abs(fraction - expected(day, offset)),
          ),
        );
        if (worst < best) {
          best = worst;
          bestOffset = offset;
        }
      }
      expect(best).toBeLessThan(0.05);
      // Waxing moons are lit on the right (positive x), waning moons on the left; new and full moons have no side.
      for (let day = 0; day < total; day++) {
        const phase = ((day + bestOffset) / p.synodicDays) % 1;
        if (fractions[day] > 0.15 && fractions[day] < 0.85)
          expect(centroids[day] > 0).toBe(phase < 0.5);
      }
      // The lunation passes through a new moon and a full moon.
      expect(Math.min(...fractions)).toBeLessThan(0.1);
      expect(Math.max(...fractions)).toBeGreaterThan(0.9);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('moonphases', 0),
      b = createSurfaceSampler('moonphases', 7),
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

describe('treemaprects: rectangles whose areas follow their labelled values', () => {
  const p = proceduralMaterialPresets.treemaprects;
  const grid = 512;
  const pixel = 1 / grid;
  const side = 1 - 2 * p.margin;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'tiles the square with rectangles whose area share equals their value share (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('treemaprects', seed),
        out = empty(),
        colors = new Float64Array(grid * grid);
      for (let y = 0; y < grid; y++)
        for (let x = 0; x < grid; x++) {
          sample((x + 0.5) * pixel, (y + 0.5) * pixel, out);
          colors[y * grid + x] = out.color;
        }
      const inner = (index: number): boolean => {
        const x = (index % grid) * pixel,
          y = Math.floor(index / grid) * pixel;
        return (
          x >= p.margin && y >= p.margin && x < 1 - p.margin && y < 1 - p.margin
        );
      };
      // Rectangles: 4-connected groups of fill pixels (not the dark borders or ink) inside the board.
      const region = new Int32Array(grid * grid).fill(-1),
        boxes: {
          minX: number;
          minY: number;
          maxX: number;
          maxY: number;
          count: number;
        }[] = [];
      for (let start = 0; start < grid * grid; start++) {
        if (!inner(start) || colors[start] < 0.2 || region[start] !== -1)
          continue;
        const id = boxes.length,
          box = {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity,
            count: 0,
          },
          stack = [start];
        region[start] = id;
        while (stack.length > 0) {
          const index = stack.pop() as number,
            x = index % grid,
            y = Math.floor(index / grid);
          box.count++;
          box.minX = Math.min(box.minX, x);
          box.minY = Math.min(box.minY, y);
          box.maxX = Math.max(box.maxX, x);
          box.maxY = Math.max(box.maxY, y);
          for (const next of [index + 1, index - 1, index + grid, index - grid])
            if (
              next >= 0 &&
              next < grid * grid &&
              inner(next) &&
              colors[next] >= 0.2 &&
              region[next] === -1
            ) {
              region[next] = id;
              stack.push(next);
            }
        }
        boxes.push(box);
      }
      // Ink pixels inside a rectangle are dark and so cut holes in its group; the big groups are the rectangles.
      const rectangles = boxes.filter((box) => box.count > 400);
      expect(rectangles.length).toBe(p.items);
      // Read each rectangle's label from its top-left corner (the edge is the border centre, one border half-width out).
      const at = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      };
      const values = rectangles.map((box) => {
        const originX = box.minX * pixel - p.borderHalf + p.labelInset,
          originY = box.minY * pixel - p.borderHalf + p.labelInset,
          digits: number[] = [];
        for (let k = 0; k < 2; k++) {
          const rows: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++)
              text +=
                at(
                  originX + (4 * k + x + 0.5) * p.digitPixel,
                  originY + (y + 0.5) * p.digitPixel,
                ) < 0.2
                  ? '#'
                  : '.';
            rows.push(text);
          }
          if (k === 1 && rows.every((row) => row === '...')) break;
          const digit = art.findIndex((shape) =>
            shape.every((row, i) => row === rows[i]),
          );
          expect(digit).toBeGreaterThanOrEqual(0);
          digits.push(digit);
        }
        return digits.reduce((sum, digit) => sum * 10 + digit, 0);
      });
      const sum = values.reduce((a, b) => a + b, 0),
        boardPixels = (side / pixel) ** 2;
      rectangles.forEach((box, i) => {
        expect(values[i]).toBeGreaterThanOrEqual(p.minValue);
        expect(values[i]).toBeLessThanOrEqual(p.maxValue);
        // The rectangle's full extent is its fill's bounding box widened by the border half-width on every side.
        const width = (box.maxX - box.minX + 1) * pixel + 2 * p.borderHalf,
          height = (box.maxY - box.minY + 1) * pixel + 2 * p.borderHalf;
        expect(
          Math.abs((width * height) / side ** 2 - values[i] / sum),
        ).toBeLessThan(0.0025);
      });
      // The rectangles' shares add up to (almost) the whole board.
      expect(
        rectangles.reduce((total, box) => total + box.count, 0) / boardPixels,
      ).toBeGreaterThan(0.9);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('treemaprects', 0),
      b = createSurfaceSampler('treemaprects', 7),
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

describe('analogclocks: a wall of clocks set to random times', () => {
  const p = proceduralMaterialPresets.analogclocks;
  const cell = (1 - 2 * p.margin) / Math.max(p.columns, p.rows);

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'turns the hour hand with the minutes and puts the minute hand on a whole minute (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('analogclocks', seed),
        out = empty(),
        steps = 720,
        // The angles (clockwise from twelve, in degrees) of the dark arcs met going once round a circle of the given radius.
        arcs = (cx: number, cy: number, radius: number): number[] => {
          const dark: boolean[] = [];
          for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            sample(
              cx + radius * p.faceRadius * cell * Math.sin(angle),
              cy - radius * p.faceRadius * cell * Math.cos(angle),
              out,
            );
            dark.push(out.color < 0.3);
          }
          const found: number[] = [];
          let start = dark.findIndex(
            (value, i) => value && !dark[(i + steps - 1) % steps],
          );
          if (start === -1) return dark.every(Boolean) ? [0] : [];
          for (let seen = 0; seen < steps;) {
            if (!dark[start % steps]) {
              start++;
              seen++;
              continue;
            }
            let length = 0;
            while (dark[(start + length) % steps] && seen + length < steps)
              length++;
            found.push((((start + (length - 1) / 2) / steps) * 360) % 360);
            start += length;
            seen += length;
          }
          return found;
        },
        gap = (a: number, b: number): number => {
          const d = Math.abs(a - b) % 360;
          return Math.min(d, 360 - d);
        };
      let checked = 0;
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          const cx = p.margin + (col + 0.5) * cell,
            cy = p.margin + (row + 0.5) * cell,
            minuteArcs = arcs(cx, cy, 0.65);
          // Only the minute hand reaches this far out.
          expect(minuteArcs.length).toBe(1);
          const minuteAngle = minuteArcs[0];
          // A whole number of minutes: a multiple of 6 degrees.
          expect(
            gap(minuteAngle, Math.round(minuteAngle / 6) * 6),
          ).toBeLessThan(2);
          const inner = arcs(cx, cy, 0.3);
          // The hour hand is the arc that is not the minute hand; when they overlap there is a single merged arc.
          const others = inner.filter((angle) => gap(angle, minuteAngle) > 12);
          if (others.length === 0) continue;
          expect(others.length).toBe(1);
          // The hour hand sits at 30 degrees per hour plus half a degree per minute, so its angle minus the minute
          // hand's angle over twelve is a whole number of hours (a multiple of 30 degrees).
          const hourOffset = (((others[0] - minuteAngle / 12) % 30) + 30) % 30;
          expect(Math.min(hourOffset, 30 - hourOffset)).toBeLessThan(3);
          checked++;
        }
      expect(checked).toBeGreaterThanOrEqual(8);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('analogclocks', 0),
      b = createSurfaceSampler('analogclocks', 7),
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

describe('piechartwedges: a pie chart whose wedge angles follow the printed percentages', () => {
  const p = proceduralMaterialPresets.piechartwedges;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'has wedges whose angles are 3.6 degrees per printed percent and whose percentages add up to 100 (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('piechartwedges', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        steps = 1440,
        point = (angle: number, distance: number): [number, number] => [
          0.5 + distance * p.radius * Math.sin(angle),
          0.5 - distance * p.radius * Math.cos(angle),
        ];
      // The separator lines are the dark runs met going once round a circle half way out; their centres bound the wedges.
      const dark: boolean[] = [];
      for (let i = 0; i < steps; i++)
        dark.push(at(...point((i / steps) * 2 * Math.PI, 0.5)) < 0.15);
      const start = dark.findIndex(
        (value, i) => !value && dark[(i + 1) % steps],
      );
      const centres: number[] = [];
      for (let seen = 0, i = start + 1; seen < steps;) {
        if (!dark[i % steps]) {
          i++;
          seen++;
          continue;
        }
        let length = 0;
        while (dark[(i + length) % steps] && seen + length < steps) length++;
        centres.push(((i + (length - 1) / 2) / steps) * 360);
        i += length;
        seen += length;
      }
      expect(centres.length).toBe(p.wedges);
      const widths = centres.map(
        (angle, i) =>
          (((centres[(i + 1) % centres.length] - angle) % 360) + 360) % 360,
      );
      expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(360, 3);
      // Read each wedge's percentage: ink contrasts with the wedge's own tone, at the middle of the wedge.
      const pixel = p.digitPixel;
      const percents = widths.map((width, i) => {
        const middle = ((centres[i] + width / 2) * Math.PI) / 180,
          [lx, ly] = point(middle, p.labelRadius),
          background = at(...point(middle, 0.9)),
          read = (digitCount: number): number[] => {
            const digits: number[] = [];
            for (let k = 0; k < digitCount; k++) {
              const rows: string[] = [];
              for (let y = 0; y < 5; y++) {
                let text = '';
                for (let x = 0; x < 3; x++) {
                  const column = (digitCount === 1 ? -1 : 4 * k - 3) + x;
                  text +=
                    Math.abs(
                      at(lx + column * pixel, ly + (y - 2) * pixel) -
                        background,
                    ) > 0.4
                      ? '#'
                      : '.';
                }
                rows.push(text);
              }
              digits.push(
                art.findIndex((shape) =>
                  shape.every((row, r) => row === rows[r]),
                ),
              );
            }
            return digits;
          };
        // A two-digit label leaves the middle column empty; a one-digit label has ink there.
        let middleInk = false;
        for (let y = -2; y <= 2; y++)
          if (Math.abs(at(lx, ly + y * pixel) - background) > 0.4)
            middleInk = true;
        const digits = read(middleInk ? 1 : 2);
        for (const digit of digits) expect(digit).toBeGreaterThanOrEqual(0);
        return digits.reduce((sum, digit) => sum * 10 + digit, 0);
      });
      expect(percents.reduce((sum, value) => sum + value, 0)).toBe(100);
      widths.forEach((width, i) => {
        expect(percents[i]).toBeGreaterThanOrEqual(p.minPercent);
        expect(Math.abs(width / 3.6 - percents[i])).toBeLessThan(0.4);
      });
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('piechartwedges', 0),
      b = createSurfaceSampler('piechartwedges', 7),
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

describe('regressionscatter: a scatter plot with its least-squares line', () => {
  const p = proceduralMaterialPresets.regressionscatter;
  const grid = 512;
  const pixel = 1 / grid;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws the line of best fit through the points as a least-squares fit would (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('regressionscatter', seed),
        out = empty(),
        colors = new Float64Array(grid * grid);
      for (let y = 0; y < grid; y++)
        for (let x = 0; x < grid; x++) {
          sample((x + 0.5) * pixel, (y + 0.5) * pixel, out);
          colors[y * grid + x] = out.color;
        }
      // Points: 4-connected groups of dark pixels (the line and the grid are lighter than 0.2); their centroids.
      const seen = new Uint8Array(grid * grid),
        centroids: [number, number][] = [],
        nearPoint = new Uint8Array(grid * grid);
      for (let start = 0; start < grid * grid; start++) {
        if (colors[start] >= 0.2 || seen[start]) continue;
        const stack = [start],
          members: number[] = [];
        seen[start] = 1;
        while (stack.length > 0) {
          const index = stack.pop() as number;
          members.push(index);
          for (const next of [index + 1, index - 1, index + grid, index - grid])
            if (
              next >= 0 &&
              next < grid * grid &&
              colors[next] < 0.2 &&
              !seen[next]
            ) {
              seen[next] = 1;
              stack.push(next);
            }
        }
        // A disc of the preset radius covers roughly this many pixels.
        const expected = Math.PI * (p.pointRadius * grid) ** 2;
        expect(members.length).toBeGreaterThan(0.5 * expected);
        expect(members.length).toBeLessThan(1.5 * expected);
        centroids.push([
          (members.reduce((sum, index) => sum + (index % grid) + 0.5, 0) /
            members.length) *
            pixel,
          (members.reduce(
            (sum, index) => sum + Math.floor(index / grid) + 0.5,
            0,
          ) /
            members.length) *
            pixel,
        ]);
        for (const index of members) {
          const x = index % grid,
            y = Math.floor(index / grid);
          for (let dy = -4; dy <= 4; dy++)
            for (let dx = -4; dx <= 4; dx++)
              nearPoint[(y + dy) * grid + x + dx] = 1;
        }
      }
      expect(centroids.length).toBeGreaterThanOrEqual(15);
      const fit = (data: [number, number][]): [number, number] => {
        const meanX = data.reduce((sum, d) => sum + d[0], 0) / data.length,
          meanY = data.reduce((sum, d) => sum + d[1], 0) / data.length,
          slope =
            data.reduce((sum, d) => sum + (d[0] - meanX) * (d[1] - meanY), 0) /
            data.reduce((sum, d) => sum + (d[0] - meanX) ** 2, 0);
        return [slope, meanY - slope * meanX];
      };
      // In plot units, with y up.
      const plot = (u: number, v: number): [number, number] => [
        (u - p.plotLeft) / p.plotSize,
        1 - (v - p.plotLeft) / p.plotSize,
      ];
      const [pointSlope, pointIntercept] = fit(
        centroids.map(([u, v]) => plot(u, v)),
      );
      // Line pixels: mid-tone pixels inside the plot, away from the discs' soft edges.
      const linePixels: [number, number][] = [];
      for (let y = 8; y < grid - 8; y++)
        for (let x = 8; x < grid - 8; x++) {
          const u = (x + 0.5) * pixel,
            v = (y + 0.5) * pixel,
            [px, py] = plot(u, v);
          if (
            px < 0.03 ||
            px > 0.97 ||
            py < 0.03 ||
            py > 0.97 ||
            nearPoint[y * grid + x]
          )
            continue;
          if (Math.abs(colors[y * grid + x] - p.lineTone) < 0.08)
            linePixels.push([px, py]);
        }
      expect(linePixels.length).toBeGreaterThan(300);
      const [lineSlope, lineIntercept] = fit(linePixels);
      expect(Math.abs(lineSlope - pointSlope)).toBeLessThan(0.03);
      expect(Math.abs(lineIntercept - pointIntercept)).toBeLessThan(0.015);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('regressionscatter', 0),
      b = createSurfaceSampler('regressionscatter', 7),
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
        [t, 0.5],
        [0.5, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(20);
  });
});

describe('barchartbars: bars whose heights match the printed values', () => {
  const p = proceduralMaterialPresets.barchartbars;
  const pitch = p.barWidth + p.barGap;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws each bar as many units high as its printed value (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('barchartbars', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        step = 0.0005,
        values: number[] = [];
      for (let i = 0; i < p.bars; i++) {
        const x = p.left + i * pitch + p.barWidth / 2 + 0.012;
        // Walk up from just above the axis while the pixel is bar-coloured (the grid rules and paper are lighter).
        let y = p.baseline - 0.01;
        while (at(x, y) < 0.75 && y > 0) y -= step;
        const top = y + step,
          units = (p.baseline - top) / p.unit,
          value = Math.round(units);
        expect(Math.abs(units - value)).toBeLessThan(0.06);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(p.maxValue);
        // The printed label sits centred above the bar.
        const cx = p.left + i * pitch + p.barWidth / 2,
          originY = top - p.labelGap - 5 * p.digitPixel,
          rows: string[] = [];
        for (let row = 0; row < 5; row++) {
          let text = '';
          for (let col = 0; col < 3; col++)
            text +=
              at(
                cx + (col - 1) * p.digitPixel,
                originY + (row + 0.5) * p.digitPixel,
              ) < 0.2
                ? '#'
                : '.';
          rows.push(text);
        }
        expect(
          art.findIndex((shape) => shape.every((line, r) => line === rows[r])),
        ).toBe(value);
        values.push(value);
      }
      // The values vary from bar to bar.
      expect(new Set(values).size).toBeGreaterThanOrEqual(3);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('barchartbars', 0),
      b = createSurfaceSampler('barchartbars', 7),
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
        [t, 0.7],
        [0.3101, t],
      ]) {
        a(u, v, one);
        a(u + 1, v + 1, two);
        expect(two.color).toBeCloseTo(one.color, 10);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(different).toBeGreaterThan(20);
  });
});

describe('truthtablelogic: the truth table of a four-input Boolean function', () => {
  const p = proceduralMaterialPresets.truthtablelogic;
  const columns = p.inputs + 1;
  const rows = 1 << p.inputs;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  };
  // The eight functions the output may follow, written out again here from their definitions.
  const candidates: ((
    a: number,
    b: number,
    c: number,
    d: number,
  ) => boolean)[] = [
    (a, b, c, d) => Boolean(a && b) || c !== d,
    (a, b, c, d) => a !== b && Boolean(c || d),
    (a, b, c) => Boolean(a ? b : c),
    (a, b, c, d) => !(a || b) || Boolean(c && d),
    (a, b, c, d) => Boolean(a || c) && Boolean(b || d),
    (a, b, c, d) => a + b + c >= 2 !== Boolean(d),
    (a, b, c, d) => Boolean(a && !b) || Boolean(c && !d),
    (a, b, c, d) => (a + b + c + d) % 2 === 1,
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists every input combination in order and an output that follows one Boolean function (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('truthtablelogic', seed),
        out = empty(),
        at = (column: number, row: number, fx: number, fy: number): number => {
          sample(
            p.left + (column + fx) * p.columnWidth,
            p.top + (row + fy) * p.rowHeight,
            out,
          );
          return out.color;
        },
        read = (column: number, row: number): string => {
          // Ink differs strongly from the cell's own tone near its corner (dark digits on pale cells, pale on the header).
          const background = at(column, row, 0.08, 0.1),
            bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              const fx = 0.5 + ((x - 1) * p.digitPixel) / p.columnWidth,
                fy = 0.5 + ((y - 2) * p.digitPixel) / p.rowHeight;
              text +=
                Math.abs(at(column, row, fx, fy) - background) > 0.4
                  ? '#'
                  : '.';
            }
            bits.push(text);
          }
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === bits[i]),
          );
          expect(found).toBeDefined();
          return (found as [string, string[]])[0];
        };
      // Header: A B C D then X.
      expect(Array.from({ length: columns }, (_, c) => read(c, 0))).toEqual([
        'A',
        'B',
        'C',
        'D',
        'X',
      ]);
      const output: number[] = [];
      for (let row = 0; row < rows; row++) {
        // The input columns count up in binary, most significant bit (A) first.
        for (let c = 0; c < p.inputs; c++)
          expect(read(c, row + 1)).toBe(
            String((row >> (p.inputs - 1 - c)) & 1),
          );
        const bit = Number(read(p.inputs, row + 1));
        output.push(bit);
        // A row whose output is 1 is shaded.
        expect(at(p.inputs, row + 1, 0.08, 0.1) < 0.85).toBe(bit === 1);
      }
      const matching = candidates.filter((f) =>
        output.every(
          (bit, row) =>
            Boolean(bit) ===
            f((row >> 3) & 1, (row >> 2) & 1, (row >> 1) & 1, row & 1),
        ),
      );
      expect(matching.length).toBeGreaterThanOrEqual(1);
      // It is a real function of the inputs, not constant.
      expect(new Set(output).size).toBe(2);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('truthtablelogic', 0),
      b = createSurfaceSampler('truthtablelogic', 7),
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

describe('fouriersquarewaves: square waves rebuilt from one to six harmonics', () => {
  const p = proceduralMaterialPresets.fouriersquarewaves;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws each panel as the partial Fourier sum of a square wave, with more ripple and a steeper edge as harmonics are added (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('fouriersquarewaves', seed),
        out = empty(),
        step = 0.0005,
        // (4 / pi) * sum over odd k up to 2n - 1 of sin(k t) / k, written out here independently of the sampler.
        partial = (terms: number, t: number): number => {
          let sum = 0;
          for (let m = 0; m < terms; m++)
            sum += Math.sin((2 * m + 1) * t) / (2 * m + 1);
          return (4 / Math.PI) * sum;
        },
        overshoots: number[] = [];
      for (let panel = 0; panel < p.panels; panel++) {
        const centre = p.top + (panel + 0.5) * p.panelHeight;
        let compared = 0,
          highest = -Infinity;
        for (let column = 0; column < 400; column++) {
          const u = (column + 0.5) / 400,
            dark: number[] = [];
          for (
            let v = centre - p.panelHeight / 2 + 0.002;
            v < centre + p.panelHeight / 2 - 0.002;
            v += step
          ) {
            sample(u, v, out);
            if (out.color < 0.3) dark.push(v);
          }
          expect(dark.length).toBeGreaterThan(0);
          const value = partial(panel + 1, 2 * Math.PI * p.periods * u),
            expected = centre - p.amplitude * value;
          highest = Math.max(highest, value);
          // Where the curve is steep its dark run is tall; compare only the shallow stretches.
          if (dark.length * step > 0.0075) continue;
          const middle = dark.reduce((sum, v) => sum + v, 0) / dark.length;
          expect(Math.abs(middle - expected)).toBeLessThan(0.0015);
          compared++;
        }
        expect(compared).toBeGreaterThan(150);
        overshoots.push(highest);
      }
      // One harmonic is a plain sine (amplitude 4/pi); with more of them the plateau ripples and the first overshoot
      // approaches the Gibbs value of about 1.179 of the square wave's level.
      expect(overshoots[0]).toBeCloseTo(4 / Math.PI, 1);
      expect(overshoots[p.panels - 1]).toBeGreaterThan(1.1);
      expect(overshoots[p.panels - 1]).toBeLessThan(1.2);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('fouriersquarewaves', 0),
      b = createSurfaceSampler('fouriersquarewaves', 7),
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

describe('pascaltrianglenumbers: the first rows of Pascal triangle', () => {
  const p = proceduralMaterialPresets.pascaltrianglenumbers;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists binomial coefficients where every entry is the sum of the two above it, with the odd ones on discs (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('pascaltrianglenumbers', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        centre = (n: number, k: number): [number, number] => [
          0.5 + (k - n / 2) * p.columnPitch,
          p.top + n * p.rowPitch,
        ],
        triangle: number[][] = [];
      for (let n = 0; n < p.rows; n++) {
        const row: number[] = [];
        for (let k = 0; k <= n; k++) {
          const [cx, cy] = centre(n, k),
            ink = (column: number, line: number): boolean =>
              at(cx + column * p.digitPixel, cy + (line - 2) * p.digitPixel) <
              0.3,
            // The widest ink column tells how many digits there are: 1 (columns -1..1), 2 (-3..3) or 3 (-5..5).
            reach = [5, 3, 1].find((column) =>
              [0, 1, 2, 3, 4].some(
                (line) => ink(column, line) || ink(-column, line),
              ),
            ),
            count = reach === 5 ? 3 : reach === 3 ? 2 : 1,
            start = -(2 * count - 1);
          expect(reach).toBeDefined();
          let value = 0;
          for (let d = 0; d < count; d++) {
            const rows = [0, 1, 2, 3, 4].map((line) =>
              [0, 1, 2]
                .map((column) =>
                  ink(start + 4 * d + column, line) ? '#' : '.',
                )
                .join(''),
            );
            const digit = art.findIndex((shape) =>
              shape.every((text, i) => text === rows[i]),
            );
            expect(digit).toBeGreaterThanOrEqual(0);
            value = value * 10 + digit;
          }
          row.push(value);
          // Odd entries lie on a darker disc, even entries on bare paper.
          expect(at(cx, cy + 0.03) < 0.85).toBe(value % 2 === 1);
        }
        triangle.push(row);
      }
      expect(triangle[0]).toEqual([1]);
      for (let n = 1; n < p.rows; n++) {
        expect(triangle[n][0]).toBe(1);
        expect(triangle[n][n]).toBe(1);
        for (let k = 1; k < n; k++)
          expect(triangle[n][k]).toBe(
            triangle[n - 1][k - 1] + triangle[n - 1][k],
          );
        // Each row adds up to a power of two, and is symmetric.
        expect(triangle[n].reduce((sum, value) => sum + value, 0)).toBe(2 ** n);
        expect(triangle[n]).toEqual([...triangle[n]].reverse());
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('pascaltrianglenumbers', 0),
      b = createSurfaceSampler('pascaltrianglenumbers', 7),
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

describe('convexhullpoints: a scatter of points and its convex hull', () => {
  const p = proceduralMaterialPresets.convexhullpoints;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'marks exactly the extreme points as hull vertices and outlines the polygon they form (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('convexhullpoints', seed),
        out = empty(),
        n = 400,
        grid = new Float64Array(n * n);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          grid[y * n + x] = out.color;
        }
      // Dots are the connected dark blobs; their area gives the radius and their centroid the position.
      const seen = new Uint8Array(n * n),
        dots: { x: number; y: number; r: number }[] = [];
      for (let start = 0; start < n * n; start++) {
        if (seen[start] || grid[start] >= 0.2) continue;
        const stack = [start];
        let area = 0,
          sx = 0,
          sy = 0;
        seen[start] = 1;
        while (stack.length > 0) {
          const cell = stack.pop() as number,
            cx = cell % n,
            cy = (cell - cx) / n;
          area++;
          sx += cx + 0.5;
          sy += cy + 0.5;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nx = cx + dx,
              ny = cy + dy;
            if (
              nx < 0 ||
              ny < 0 ||
              nx >= n ||
              ny >= n ||
              seen[ny * n + nx] ||
              grid[ny * n + nx] >= 0.2
            )
              continue;
            seen[ny * n + nx] = 1;
            stack.push(ny * n + nx);
          }
        }
        dots.push({
          x: sx / area / n,
          y: sy / area / n,
          r: Math.sqrt(area / Math.PI) / n,
        });
      }
      expect(dots.length).toBeGreaterThanOrEqual(10);
      expect(dots.length).toBeLessThanOrEqual(p.points);
      // Every point keeps its minimum spacing and stays off the tile edge.
      for (const [i, a] of dots.entries()) {
        expect(a.x).toBeGreaterThan(p.margin - 0.01);
        expect(a.x).toBeLessThan(1 - p.margin + 0.01);
        expect(a.y).toBeGreaterThan(p.margin - 0.01);
        expect(a.y).toBeLessThan(1 - p.margin + 0.01);
        for (const b of dots.slice(i + 1))
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(
            p.minSpacing - 0.005,
          );
      }
      // Which points are extreme: the maximiser of some direction is a hull vertex (checked over 1440 directions).
      const extreme = new Set<number>();
      for (let k = 0; k < 1440; k++) {
        const dx = Math.cos((2 * Math.PI * k) / 1440),
          dy = Math.sin((2 * Math.PI * k) / 1440);
        let best = 0;
        for (const [i, d] of dots.entries())
          if (d.x * dx + d.y * dy > dots[best].x * dx + dots[best].y * dy)
            best = i;
        extreme.add(best);
      }
      const large = new Set(
        dots.map((d, i) => (d.r > 0.0115 ? i : -1)).filter((i) => i >= 0),
      );
      expect([...large].sort((a, b) => a - b)).toEqual(
        [...extreme].sort((a, b) => a - b),
      );
      expect(extreme.size).toBeGreaterThanOrEqual(3);
      // The hull is outlined: walking the extreme points by angle around their centre, the middle of each edge is on a line.
      const hull = [...extreme].map((i) => dots[i]),
        mx = hull.reduce((s, d) => s + d.x, 0) / hull.length,
        my = hull.reduce((s, d) => s + d.y, 0) / hull.length;
      hull.sort(
        (a, b) =>
          Math.atan2(a.y - my, a.x - mx) - Math.atan2(b.y - my, b.x - mx),
      );
      for (let i = 0; i < hull.length; i++) {
        const a = hull[i],
          b = hull[(i + 1) % hull.length];
        sample((a.x + b.x) / 2, (a.y + b.y) / 2, out);
        expect(out.color).toBeGreaterThan(0.35);
        expect(out.color).toBeLessThan(0.65);
        // Convex: the next vertex never turns clockwise.
        const c = hull[(i + 2) % hull.length];
        expect(
          (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x),
        ).toBeGreaterThan(0);
      }
      // Every interior point lies inside the polygon, and the polygon's fill is darker than the paper outside.
      for (const [i, d] of dots.entries()) {
        if (extreme.has(i)) continue;
        for (let k = 0; k < hull.length; k++) {
          const a = hull[k],
            b = hull[(k + 1) % hull.length];
          expect(
            (b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x),
          ).toBeGreaterThan(0);
        }
      }
      sample(0.5, 0.5, out);
      const fillColor = out.color;
      sample(0.01, 0.01, out);
      expect(out.color).toBeGreaterThan(fillColor + 0.05);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('convexhullpoints', 0),
      b = createSurfaceSampler('convexhullpoints', 7),
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

describe('delaunaytriangles: a scatter of points and its Delaunay triangulation', () => {
  const p = proceduralMaterialPresets.delaunaytriangles;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'joins exactly the pairs of points that have an empty circle through them (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('delaunaytriangles', seed),
        out = empty(),
        n = 400,
        grid = new Float64Array(n * n);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          grid[y * n + x] = out.color;
        }
      // The points are the connected dark blobs; their centroids are the positions.
      const seen = new Uint8Array(n * n),
        dots: { x: number; y: number }[] = [];
      for (let start = 0; start < n * n; start++) {
        if (seen[start] || grid[start] >= 0.2) continue;
        const stack = [start];
        let area = 0,
          sx = 0,
          sy = 0;
        seen[start] = 1;
        while (stack.length > 0) {
          const cell = stack.pop() as number,
            cx = cell % n,
            cy = (cell - cx) / n;
          area++;
          sx += cx + 0.5;
          sy += cy + 0.5;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nx = cx + dx,
              ny = cy + dy;
            if (
              nx < 0 ||
              ny < 0 ||
              nx >= n ||
              ny >= n ||
              seen[ny * n + nx] ||
              grid[ny * n + nx] >= 0.2
            )
              continue;
            seen[ny * n + nx] = 1;
            stack.push(ny * n + nx);
          }
        }
        dots.push({ x: sx / area / n, y: sy / area / n });
      }
      expect(dots.length).toBeGreaterThanOrEqual(12);
      expect(dots.length).toBeLessThanOrEqual(p.points);
      for (const [i, a] of dots.entries()) {
        expect(a.x).toBeGreaterThan(p.margin - 0.01);
        expect(a.x).toBeLessThan(1 - p.margin + 0.01);
        expect(a.y).toBeGreaterThan(p.margin - 0.01);
        expect(a.y).toBeLessThan(1 - p.margin + 0.01);
        for (const b of dots.slice(i + 1))
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(
            p.minSpacing - 0.005,
          );
      }
      // Two points are a Delaunay edge when some circle through both holds no other point. Its centre lies on their
      // perpendicular bisector at offset t, and each other point k bounds t linearly, so the feasible t form an interval.
      // The interval's length measures how clear the decision is; pairs within 0.01 of a tie are not judged, since the
      // dots are only located to about a pixel.
      const gap = (i: number, j: number): number => {
        const a = dots[i],
          b = dots[j],
          mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2,
          length = Math.hypot(b.x - a.x, b.y - a.y),
          nx = -(b.y - a.y) / length,
          ny = (b.x - a.x) / length,
          half = length / 2;
        let low = -Infinity,
          high = Infinity;
        for (const [k, c] of dots.entries()) {
          if (k === i || k === j) continue;
          const along = c.x - mx,
            across = c.y - my,
            rhs = along * along + across * across - half * half,
            slope = 2 * (nx * along + ny * across);
          if (Math.abs(slope) < 1e-12) {
            if (rhs < 0) return -Infinity;
          } else if (slope > 0) high = Math.min(high, rhs / slope);
          else low = Math.max(low, rhs / slope);
        }
        return high - low;
      };
      let edges = 0,
        absent = 0;
      for (let i = 0; i < dots.length; i++)
        for (let j = i + 1; j < dots.length; j++) {
          const margin = gap(i, j),
            at = (t: number): number => {
              sample(
                dots[i].x + (dots[j].x - dots[i].x) * t,
                dots[i].y + (dots[j].y - dots[i].y) * t,
                out,
              );
              return out.color;
            };
          // A pair whose segment passes close to a third point (a chain of nearly collinear edges) is not judged.
          const ax = dots[i].x,
            ay = dots[i].y,
            bx = dots[j].x - ax,
            by = dots[j].y - ay,
            near = dots.some((c, k) => {
              if (k === i || k === j) return false;
              const t = Math.min(
                1,
                Math.max(
                  0,
                  ((c.x - ax) * bx + (c.y - ay) * by) / (bx * bx + by * by),
                ),
              );
              return Math.hypot(c.x - ax - bx * t, c.y - ay - by * t) < 0.015;
            });
          if (near) continue;
          if (margin > 0.01) {
            edges++;
            expect(at(0.5)).toBeGreaterThan(0.25);
            expect(at(0.5)).toBeLessThan(0.6);
          } else if (margin < -0.01) {
            absent++;
            // Somewhere along a non-edge the sheet shows fill or bare paper rather than a line.
            expect([0.2, 0.35, 0.5, 0.65, 0.8].some((t) => at(t) > 0.7)).toBe(
              true,
            );
          }
        }
      // Euler: a triangulation of m points with h on the hull has 3m - 3 - h edges, between 2m - 3 and 3m - 6 in all.
      expect(edges).toBeGreaterThanOrEqual(2 * dots.length - 3 - 3);
      expect(edges).toBeLessThanOrEqual(3 * dots.length - 6);
      expect(absent).toBeGreaterThan(20);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('delaunaytriangles', 0),
      b = createSurfaceSampler('delaunaytriangles', 7),
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

describe('collatzsequences: hailstone sequences down to 1', () => {
  const p = proceduralMaterialPresets.collatzsequences;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  const left = (1 - p.columns * p.columnPitch) / 2;
  const steps = (start: number): number => {
    let n = start,
      count = 1;
    while (n !== 1) {
      n = n % 2 === 0 ? n / 2 : 3 * n + 1;
      count++;
    }
    return count;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists each row as a Collatz sequence ending at 1, with odd terms shaded (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('collatzsequences', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        starts: number[] = [];
      for (let row = 0; row < p.rows; row++) {
        const terms: number[] = [];
        for (let column = 0; column < p.columns; column++) {
          const x0 = left + column * p.columnPitch,
            y0 = p.top + row * p.rowPitch,
            cx = x0 + p.columnPitch / 2,
            cy = y0 + p.rowPitch / 2,
            ink = (offset: number, line: number): boolean =>
              at(cx + offset * p.digitPixel, cy + (line - 2) * p.digitPixel) <
              0.3,
            anyInk = (offset: number): boolean =>
              [0, 1, 2, 3, 4].some(
                (line) => ink(offset, line) || ink(-offset, line),
              ),
            reach = [5, 3, 1].find((offset) => anyInk(offset));
          if (reach === undefined) {
            // After the sequence ends the rest of the row is bare paper.
            for (let rest = column; rest < p.columns; rest++) {
              const rx = left + rest * p.columnPitch + p.columnPitch / 2;
              expect(at(rx, cy)).toBeGreaterThan(0.85);
            }
            break;
          }
          const count = reach === 5 ? 3 : reach === 3 ? 2 : 1,
            first = -(2 * count - 1);
          let value = 0;
          for (let d = 0; d < count; d++) {
            const rows = [0, 1, 2, 3, 4].map((line) =>
              [0, 1, 2]
                .map((offset) =>
                  ink(first + 4 * d + offset, line) ? '#' : '.',
                )
                .join(''),
            );
            const digit = art.findIndex((shape) =>
              shape.every((text, i) => text === rows[i]),
            );
            expect(digit).toBeGreaterThanOrEqual(0);
            value = value * 10 + digit;
          }
          terms.push(value);
          // Odd terms sit on a darker cell.
          expect(
            at(x0 + 0.06 * p.columnPitch, y0 + 0.1 * p.rowPitch) < 0.85,
          ).toBe(value % 2 === 1);
        }
        expect(terms.length).toBeGreaterThanOrEqual(2);
        expect(terms[terms.length - 1]).toBe(1);
        for (let i = 0; i + 1 < terms.length; i++)
          expect(terms[i + 1]).toBe(
            terms[i] % 2 === 0 ? terms[i] / 2 : 3 * terms[i] + 1,
          );
        // Only the final term is 1, and the start is one of the values whose sequence fits the row.
        expect(terms.slice(0, -1)).not.toContain(1);
        expect(terms[0]).toBeGreaterThanOrEqual(2);
        expect(terms[0]).toBeLessThanOrEqual(p.candidateLimit);
        expect(steps(terms[0])).toBe(terms.length);
        starts.push(terms[0]);
      }
      expect(new Set(starts).size).toBe(p.rows);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('collatzsequences', 0),
      b = createSurfaceSampler('collatzsequences', 7),
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

describe('hammingcodewords: Hamming(7,4) code words with one flipped bit each', () => {
  const p = proceduralMaterialPresets.hammingcodewords;
  const columns = p.bits + 1;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    S: ['.##', '#..', '.#.', '..#', '##.'],
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows code words whose syndrome names the flipped bit, which corrects back to the row number (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('hammingcodewords', seed),
        out = empty(),
        at = (column: number, row: number, fx: number, fy: number): number => {
          sample(
            p.left + (column + fx) * p.columnWidth,
            p.top + (row + fy) * p.rowHeight,
            out,
          );
          return out.color;
        },
        read = (column: number, row: number): string => {
          const background = at(column, row, 0.08, 0.1),
            bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              const fx = 0.5 + ((x - 1) * p.digitPixel) / p.columnWidth,
                fy = 0.5 + ((y - 2) * p.digitPixel) / p.rowHeight;
              text +=
                Math.abs(at(column, row, fx, fy) - background) > 0.4
                  ? '#'
                  : '.';
            }
            bits.push(text);
          }
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === bits[i]),
          );
          expect(found).toBeDefined();
          return (found as [string, string[]])[0];
        };
      // Header: the positions 1 to 7, then S for the syndrome.
      expect(Array.from({ length: columns }, (_, c) => read(c, 0))).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        'S',
      ]);
      const flippedRows: number[] = [];
      for (let row = 0; row < 16; row++) {
        const word = [
            0,
            ...Array.from({ length: p.bits }, (_, c) =>
              Number(read(c, row + 1)),
            ),
          ],
          syndrome = Number(read(p.bits, row + 1));
        // The syndrome is the XOR of the positions that hold a 1, and it is in 0..7.
        expect(syndrome).toBeLessThanOrEqual(7);
        let xor = 0;
        for (let position = 1; position <= p.bits; position++)
          if (word[position]) xor ^= position;
        expect(xor).toBe(syndrome);
        // Flipping the bit it names gives a code word whose data bits (positions 3, 5, 6, 7) are the row number.
        const fixed = [...word];
        if (syndrome > 0) fixed[syndrome] ^= 1;
        expect([fixed[3], fixed[5], fixed[6], fixed[7]]).toEqual([
          (row >> 3) & 1,
          (row >> 2) & 1,
          (row >> 1) & 1,
          row & 1,
        ]);
        expect(fixed[1]).toBe(fixed[3] ^ fixed[5] ^ fixed[7]);
        expect(fixed[2]).toBe(fixed[3] ^ fixed[6] ^ fixed[7]);
        expect(fixed[4]).toBe(fixed[5] ^ fixed[6] ^ fixed[7]);
        // The flipped bit's cell is the darkest shade; parity positions (1, 2, 4) are a middle shade; data bits are palest.
        for (let position = 1; position <= p.bits; position++) {
          const tone = at(position - 1, row + 1, 0.08, 0.1),
            parity = (position & (position - 1)) === 0;
          if (position === syndrome) expect(tone).toBeLessThan(0.7);
          else if (parity) expect(tone > 0.7 && tone < 0.885).toBe(true);
          else expect(tone).toBeGreaterThan(0.885);
        }
        if (syndrome > 0) flippedRows.push(row);
      }
      // Most rows carry a flipped bit; the seed may leave a few (or, rarely, none) untouched.
      expect(flippedRows.length).toBeGreaterThanOrEqual(6);
      expect(flippedRows.length).toBeLessThanOrEqual(16);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hammingcodewords', 0),
      b = createSurfaceSampler('hammingcodewords', 7),
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

describe('cayleytables: the multiplication table of a group of order eight', () => {
  const p = proceduralMaterialPresets.cayleytables;
  const shapes = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
  ];
  // Element orders (sorted) and whether the group is abelian identify the five groups of order eight.
  const signatures = new Map<string, string>([
    ['1,2,4,4,8,8,8,8|abelian', 'Z8'],
    ['1,2,2,2,4,4,4,4|abelian', 'Z4xZ2'],
    ['1,2,2,2,2,2,2,2|abelian', 'Z2^3'],
    ['1,2,2,2,2,2,4,4|nonabelian', 'D4'],
    ['1,2,4,4,4,4,4,4|nonabelian', 'Q8'],
  ]);
  const n = p.order;

  // Reads the printed table (and checks the headers and shading) for a seed.
  const decode = (seed: number): { table: number[][]; shaded: boolean[][] } => {
    const sample = createSurfaceSampler('cayleytables', seed),
      out = empty(),
      at = (column: number, row: number, fx: number, fy: number): number => {
        sample(
          p.left + (column + fx) * p.cell,
          p.top + (row + fy) * p.cell,
          out,
        );
        return out.color;
      },
      read = (column: number, row: number): number => {
        const background = at(column, row, 0.08, 0.1),
          bits: string[] = [];
        for (let y = 0; y < 5; y++) {
          let text = '';
          for (let x = 0; x < 3; x++) {
            const fx = 0.5 + ((x - 1) * p.digitPixel) / p.cell,
              fy = 0.5 + ((y - 2) * p.digitPixel) / p.cell;
            text +=
              Math.abs(at(column, row, fx, fy) - background) > 0.4 ? '#' : '.';
          }
          bits.push(text);
        }
        const found = shapes.findIndex((shape) =>
          shape.every((line, i) => line === bits[i]),
        );
        expect(found).toBeGreaterThanOrEqual(0);
        return found;
      };
    // Headers list the elements 0 to 7 along the top and down the left.
    expect(Array.from({ length: n }, (_, i) => read(i + 1, 0))).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(Array.from({ length: n }, (_, i) => read(0, i + 1))).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    return {
      table: Array.from({ length: n }, (_, a) =>
        Array.from({ length: n }, (_, b) => read(b + 1, a + 1)),
      ),
      shaded: Array.from({ length: n }, (_, a) =>
        Array.from({ length: n }, (_, b) => at(b + 1, a + 1, 0.08, 0.1) < 0.85),
      ),
    };
  };
  const identify = (table: number[][]): string | undefined => {
    const orders = Array.from({ length: n }, (_, a) => {
      let power = a,
        order = 1;
      while (power !== 0) {
        power = table[power][a];
        order++;
      }
      return order;
    }).sort((x, y) => x - y);
    const abelian = table.every((row, a) =>
      row.every((value, b) => value === table[b][a]),
    );
    return signatures.get(
      `${orders.join(',')}|${abelian ? 'abelian' : 'nonabelian'}`,
    );
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'prints a Cayley table that satisfies the group axioms and is one of the five groups of order eight (seed %i)',
    (seed) => {
      const { table, shaded } = decode(seed);
      // The identity cells (0 in the body) are shaded.
      for (let a = 0; a < n; a++)
        for (let b = 0; b < n; b++)
          expect(shaded[a][b]).toBe(table[a][b] === 0);
      // Element 0 is the identity and every row and column is a permutation (a Latin square, so every element has an inverse).
      for (let a = 0; a < n; a++) {
        expect(table[0][a]).toBe(a);
        expect(table[a][0]).toBe(a);
        expect([...table[a]].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(table.map((row) => row[a]).sort()).toEqual([
          0, 1, 2, 3, 4, 5, 6, 7,
        ]);
      }
      // Associativity over all 512 triples.
      for (let a = 0; a < n; a++)
        for (let b = 0; b < n; b++)
          for (let c = 0; c < n; c++)
            expect(table[table[a][b]][c]).toBe(table[a][table[b][c]]);
      expect(identify(table)).toBeDefined();
    },
  );

  it('shows every one of the five groups across seeds 0 to 59', () => {
    const found = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const name = identify(decode(seed).table);
      expect(name).toBeDefined();
      found.add(name as string);
    }
    expect([...found].sort()).toEqual(['D4', 'Q8', 'Z2^3', 'Z4xZ2', 'Z8']);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('cayleytables', 0),
      b = createSurfaceSampler('cayleytables', 7),
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

describe('romannumerals: decimal numbers beside their Roman numerals', () => {
  const p = proceduralMaterialPresets.romannumerals;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '=': ['...', '###', '...', '###', '...'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    L: ['#..', '#..', '#..', '#..', '###'],
    C: ['.##', '#..', '#..', '#..', '.##'],
  };
  // The canonical Roman numeral, written out digit by digit rather than by the sampler's greedy table.
  const canonical = (value: number): string => {
    const hundreds = ['', 'C'][Math.floor(value / 100)],
      tens = ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC'][
        Math.floor(value / 10) % 10
      ],
      ones = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][
        value % 10
      ];
    return hundreds + tens + ones;
  };
  // Reads a numeral the way a reader does: a symbol smaller than the one after it is subtracted.
  const parse = (text: string): number => {
    const worth: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    return [...text].reduce((sum, symbol, i) => {
      const next = worth[text[i + 1]] ?? 0;
      return sum + (worth[symbol] < next ? -worth[symbol] : worth[symbol]);
    }, 0);
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes each decimal number as the matching canonical Roman numeral, in ascending order (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('romannumerals', seed),
        out = empty(),
        at = (column: number, row: number, fx: number, fy: number): number => {
          sample(
            p.left + (column + fx) * p.cell,
            p.top + (row + fy) * p.rowPitch,
            out,
          );
          return out.color;
        },
        // A cell holds a symbol, or nothing when no pixel of the 3 x 5 matrix is dark.
        read = (column: number, row: number): string => {
          const bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              const fx = 0.5 + ((x - 1) * p.digitPixel) / p.cell,
                fy = 0.5 + ((y - 2) * p.digitPixel) / p.rowPitch;
              text += at(column, row, fx, fy) < 0.3 ? '#' : '.';
            }
            bits.push(text);
          }
          if (bits.every((line) => line === '...')) return ' ';
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === bits[i]),
          );
          expect(found).toBeDefined();
          return (found as [string, string[]])[0];
        },
        values: number[] = [];
      for (let row = 0; row < p.rows; row++) {
        const cells = Array.from({ length: 13 }, (_, column) =>
            read(column, row),
          ),
          decimal = cells.slice(0, 3).join('').trim(),
          numeral = cells.slice(4).join('').trimEnd();
        expect(cells[3]).toBe('=');
        expect(decimal).toMatch(/^[1-9][0-9]{0,2}$/);
        // Numbers are right-aligned, and the numeral is flush left with no gaps.
        expect(cells.slice(0, 3).join('')).toBe(decimal.padStart(3, ' '));
        expect(cells.slice(4).join('')).toBe(numeral.padEnd(9, ' '));
        const value = Number(decimal);
        expect(value).toBeLessThanOrEqual(p.maxValue);
        expect(numeral).toBe(canonical(value));
        expect(parse(numeral)).toBe(value);
        values.push(value);
      }
      expect(new Set(values).size).toBe(p.rows);
      expect(values).toEqual([...values].sort((a, b) => a - b));
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('romannumerals', 0),
      b = createSurfaceSampler('romannumerals', 7),
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

describe('signedencodings: four-bit patterns read as signed numbers', () => {
  const p = proceduralMaterialPresets.signedencodings;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '-': ['...', '...', '###', '...', '...'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    S: ['.##', '#..', '.#.', '..#', '##.'],
    M: ['#.#', '###', '###', '#.#', '#.#'],
  };
  const rows = 1 << p.bits;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows every bit pattern with its unsigned value and the signed value of the named encoding (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('signedencodings', seed),
        out = empty(),
        at = (column: number, row: number, fx: number, fy: number): number => {
          sample(
            p.left + (column + fx) * p.cell,
            p.top + (row + fy) * p.rowPitch,
            out,
          );
          return out.color;
        },
        read = (column: number, row: number): string => {
          const background = at(column, row, 0.08, 0.1),
            bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              const fx = 0.5 + ((x - 1) * p.digitPixel) / p.cell,
                fy = 0.5 + ((y - 2) * p.digitPixel) / p.rowPitch;
              text +=
                Math.abs(at(column, row, fx, fy) - background) > 0.4
                  ? '#'
                  : '.';
            }
            bits.push(text);
          }
          if (bits.every((line) => line === '...')) return ' ';
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === bits[i]),
          );
          expect(found).toBeDefined();
          return (found as [string, string[]])[0];
        };
      // Header: U above the unsigned column and the encoding's two-letter code above the signed one.
      expect(read(6, 0)).toBe('U');
      const code = read(8, 0) + read(9, 0);
      expect(['2C', '1C', 'SM']).toContain(code);
      const readValue = (r: number): number => {
        // The signed value written in the table, with a leading minus sign for negatives (and for a negative zero).
        const sign = read(8, r + 1) === '-' ? -1 : 1,
          magnitude = Number(read(9, r + 1));
        return sign * magnitude;
      };
      let negativeZeros = 0;
      for (let r = 0; r < rows; r++) {
        const bits = Array.from({ length: p.bits }, (_, c) =>
          read(c, r + 1),
        ).join('');
        expect(bits).toBe(r.toString(2).padStart(p.bits, '0'));
        expect(read(4, r + 1)).toBe(' ');
        expect(read(7, r + 1)).toBe(' ');
        expect(
          Number(
            read(5, r + 1) === ' '
              ? read(6, r + 1)
              : read(5, r + 1) + read(6, r + 1),
          ),
        ).toBe(r);
        const top = (r >> 3) & 1,
          low = r & 7,
          // What each encoding says the pattern means.
          expected =
            code === '2C'
              ? -8 * top + low
              : code === '1C'
                ? top
                  ? -(7 - low)
                  : low
                : top
                  ? -low
                  : low,
          negativeZero = top === 1 && expected === 0;
        expect(readValue(r)).toBe(expected);
        const writtenSign = read(8, r + 1) === '-';
        expect(writtenSign).toBe(expected < 0 || negativeZero);
        negativeZeros += Number(negativeZero);
        // Negative rows are shaded; so is the sign bit's column.
        const shaded = (column: number): boolean =>
          at(column, r + 1, 0.08, 0.1) < 0.9;
        expect(shaded(9)).toBe(writtenSign);
        expect(shaded(5)).toBe(writtenSign);
        expect(at(0, r + 1, 0.08, 0.1) < 0.82).toBe(true);
      }
      // Two's complement has no negative zero; the other two encodings have exactly one.
      expect(negativeZeros).toBe(code === '2C' ? 0 : 1);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('signedencodings', 0),
      b = createSurfaceSampler('signedencodings', 7),
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

describe('matrixproducts: three-by-three matrix multiplications', () => {
  const p = proceduralMaterialPresets.matrixproducts;
  const n = p.size;
  const art = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  const times = ['...', '#.#', '.#.', '#.#', '...'];
  const equals = ['...', '###', '...', '###', '...'];
  const widths = [
    ...Array.from({ length: n }, () => p.factorWidth),
    p.symbolWidth,
    ...Array.from({ length: n }, () => p.factorWidth),
    p.symbolWidth,
    ...Array.from({ length: n }, () => p.productWidth),
  ];
  const starts = widths.map(
    (_, i) => p.left + widths.slice(0, i).reduce((sum, w) => sum + w, 0),
  );

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes each equation with C equal to the matrix product of A and B (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('matrixproducts', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        cellCentre = (
          equation: number,
          row: number,
          column: number,
        ): [number, number] => [
          starts[column] + widths[column] / 2,
          p.top + equation * p.pitch + (row + 0.5) * p.rowHeight,
        ],
        pattern = (cx: number, cy: number, offset: number): string[] =>
          [0, 1, 2, 3, 4].map((line) =>
            [0, 1, 2]
              .map((x) =>
                at(
                  cx + (offset + x) * p.digitPixel,
                  cy + (line - 2) * p.digitPixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          ),
        // A number is read from the cell centre: its widest ink column gives the digit count (1, 2 or 3).
        readNumber = (
          equation: number,
          row: number,
          column: number,
        ): number => {
          const [cx, cy] = cellCentre(equation, row, column),
            anyInk = (offset: number): boolean =>
              [0, 1, 2, 3, 4].some(
                (line) =>
                  at(
                    cx + offset * p.digitPixel,
                    cy + (line - 2) * p.digitPixel,
                  ) < 0.3 ||
                  at(
                    cx - offset * p.digitPixel,
                    cy + (line - 2) * p.digitPixel,
                  ) < 0.3,
              ),
            reach = [5, 3, 1].find((offset) => anyInk(offset));
          expect(reach).toBeDefined();
          const count = reach === 5 ? 3 : reach === 3 ? 2 : 1;
          let value = 0;
          for (let d = 0; d < count; d++) {
            const shape = pattern(cx, cy, -(2 * count - 1) + 4 * d),
              digit = art.findIndex((candidate) =>
                candidate.every((line, i) => line === shape[i]),
              );
            expect(digit).toBeGreaterThanOrEqual(0);
            value = value * 10 + digit;
          }
          return value;
        };
      for (let equation = 0; equation < p.equations; equation++) {
        const a = Array.from({ length: n }, (_, r) =>
            Array.from({ length: n }, (_, c) => readNumber(equation, r, c)),
          ),
          b = Array.from({ length: n }, (_, r) =>
            Array.from({ length: n }, (_, c) =>
              readNumber(equation, r, n + 1 + c),
            ),
          ),
          c = Array.from({ length: n }, (_, r) =>
            Array.from({ length: n }, (_, k) =>
              readNumber(equation, r, 2 * n + 2 + k),
            ),
          );
        for (const row of [...a, ...b])
          for (const value of row)
            expect(value).toBeLessThanOrEqual(p.maxEntry);
        // The signs: a times sign beside the middle row of A, an equals sign beside the middle row of B, nothing elsewhere.
        for (let row = 0; row < n; row++) {
          const middle = row === Math.floor(n / 2);
          for (const [column, shape] of [
            [n, times],
            [2 * n + 1, equals],
          ] as const) {
            const [cx, cy] = cellCentre(equation, row, column);
            expect(pattern(cx, cy, -1)).toEqual(
              middle ? shape : ['...', '...', '...', '...', '...'],
            );
          }
        }
        // C is the matrix product A B: c[i][j] = sum over k of a[i][k] b[k][j].
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) sum += a[i][k] * b[k][j];
            expect(c[i][j]).toBe(sum);
          }
        // The product is shaded darker than the factors.
        const [fx, fy] = cellCentre(equation, 0, 0),
          [px, py] = cellCentre(equation, 0, 2 * n + 2);
        expect(at(fx - 0.02, fy - 0.025)).toBeGreaterThan(
          at(px - 0.04, py - 0.025),
        );
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('matrixproducts', 0),
      b = createSurfaceSampler('matrixproducts', 7),
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

describe('kochsnowflake: the snowflake after zero to three Koch iterations', () => {
  const p = proceduralMaterialPresets.kochsnowflake;
  const baseArea = (Math.sqrt(3) / 4) * p.side * p.side;
  // Area after n iterations: A0 (8/5 - (3/5) (4/9)^n); the boundary grows by 4/3 each time.
  const areaRatio = (n: number): number => 8 / 5 - (3 / 5) * (4 / 9) ** n;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws four snowflakes whose areas and boundary lengths follow the Koch recurrences (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('kochsnowflake', seed),
        out = empty(),
        n = 360,
        cell = 0.5 / n,
        levels = new Set<number>(),
        edgeCounts: number[] = [];
      for (let panel = 0; panel < 4; panel++) {
        const u0 = panel % 2 === 0 ? 0 : 0.5,
          v0 = panel < 2 ? 0 : 0.5;
        let fill = 0,
          edge = 0;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            sample(u0 + (x + 0.5) * cell, v0 + (y + 0.5) * cell, out);
            if (out.color < 0.5) edge++;
            else if (out.color < 0.88) fill++;
          }
        // The line is centred on the boundary, so half of its pixels lie inside the shape.
        const area = (fill + edge / 2) * cell * cell,
          ratio = area / baseArea,
          // Levels 2 and 3 differ by only 4%, so pick the nearest prediction and demand a close match.
          errors = [0, 1, 2, 3].map((k) => Math.abs(ratio / areaRatio(k) - 1)),
          level = errors.indexOf(Math.min(...errors));
        expect(Math.min(...errors)).toBeLessThan(0.015);
        levels.add(level);
        // The boundary length of level k is (4/3)^k times that of the triangle; the line's pixel count follows it.
        edgeCounts[level] = edge * cell * cell;
      }
      // Each of the iterations 0 to 3 appears exactly once.
      expect([...levels].sort()).toEqual([0, 1, 2, 3]);
      for (let k = 1; k <= 3; k++) {
        const grown = edgeCounts[k] / edgeCounts[0];
        expect(Math.abs(grown / (4 / 3) ** k - 1)).toBeLessThan(0.15);
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('kochsnowflake', 0),
      b = createSurfaceSampler('kochsnowflake', 7),
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

describe('newtonbasins: basins of attraction of Newton iteration for z^n - 1', () => {
  const p = proceduralMaterialPresets.newtonbasins;
  const fold = (t: number): number => 1 - Math.abs(2 * t - 1);

  // Newton's method on z^n - 1 written with polar powers, independently of the sampler's repeated multiplication:
  // returns the index of the n-th root of unity the iteration settles on, counted anticlockwise from 1.
  const basin = (re: number, im: number, n: number): number => {
    let radius = Math.hypot(re, im),
      angle = Math.atan2(im, re);
    for (let step = 0; step < 200; step++) {
      // z^n and z^(n-1) in polar form.
      const powRe = radius ** n * Math.cos(n * angle),
        powIm = radius ** n * Math.sin(n * angle),
        lowRe = radius ** (n - 1) * Math.cos((n - 1) * angle),
        lowIm = radius ** (n - 1) * Math.sin((n - 1) * angle),
        zRe = radius * Math.cos(angle),
        zIm = radius * Math.sin(angle),
        // (z^n - 1) / (n z^(n-1)).
        numRe = powRe - 1,
        numIm = powIm,
        denRe = n * lowRe,
        denIm = n * lowIm,
        scale = denRe * denRe + denIm * denIm,
        qRe = (numRe * denRe + numIm * denIm) / scale,
        qIm = (numIm * denRe - numRe * denIm) / scale,
        nextRe = zRe - qRe,
        nextIm = zIm - qIm;
      radius = Math.hypot(nextRe, nextIm);
      angle = Math.atan2(nextIm, nextRe);
    }
    return ((Math.round(angle / ((2 * Math.PI) / n)) % n) + n) % n;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'colours each point by the root Newton iteration reaches, with one band per root (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('newtonbasins', seed),
        out = empty(),
        n = 200,
        tones: number[] = [];
      // Collect the rendered tones; they cluster into one band per root, the degree being between 3 and 5.
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          tones.push(out.color);
        }
      const bandOf = (tone: number, degree: number): number => {
        // Band k occupies [base_k - shadeMax - slack, base_k + slack]; at most one band can contain a tone.
        const matches: number[] = [];
        for (let k = 0; k < degree; k++) {
          const base =
            p.lowTone + ((p.highTone - p.lowTone) * k) / (degree - 1);
          if (
            tone <= base + 0.02 &&
            tone >= base - p.shadePerStep * p.shadeSteps - 0.02
          )
            matches.push(k);
        }
        return matches.length === 1 ? matches[0] : -1;
      };
      // The degree is the one for which every tone falls in a band and every band is occupied. A smaller degree's
      // bands can coincide with some of a larger degree's, but then the larger degree has empty bands.
      const fits: number[] = [];
      for (const degree of [3, 4, 5]) {
        if (!tones.every((tone) => bandOf(tone, degree) >= 0)) continue;
        const counts = new Array<number>(degree).fill(0);
        for (const tone of tones) counts[bandOf(tone, degree)]++;
        if (counts.every((count) => count > 0.05 * tones.length))
          fits.push(degree);
      }
      expect(fits.length).toBe(1);
      const degree = fits[0],
        counts = new Array<number>(degree).fill(0);
      let agree = 0;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const k = bandOf(tones[y * n + x], degree),
            re = -p.extent + 2 * p.extent * fold((x + 0.5) / n),
            im = -p.extent + 2 * p.extent * fold((y + 0.5) / n);
          counts[k]++;
          agree += Number(basin(re, im, degree) === k);
        }
      // Points on the fractal boundary are sensitive to rounding; away from it the two agree.
      expect(agree / (n * n)).toBeGreaterThan(0.975);
      // The square window is symmetric under a quarter turn, so for four roots the shares are about equal.
      if (degree === 4)
        for (const count of counts)
          expect(Math.abs(count / (n * n) - 0.25)).toBeLessThan(0.03);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('newtonbasins', 0),
      b = createSurfaceSampler('newtonbasins', 7),
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

describe('mandelbrotbands: smooth escape-time contours of the Mandelbrot set', () => {
  const p = proceduralMaterialPresets.mandelbrotbands;
  const fold = (t: number): number => 1 - Math.abs(2 * t - 1);

  // The tone a view predicts at a point, from the standard smooth escape-time formula written out here again.
  const predict = (
    view: (typeof p.views)[number],
    u: number,
    v: number,
  ): number => {
    const c = {
      re: view.x + view.extent * (2 * fold(u) - 1),
      im: view.y + view.extent * (2 * fold(v) - 1),
    };
    let z = { re: 0, im: 0 },
      steps = 0;
    while (steps < view.iterations && Math.hypot(z.re, z.im) <= p.bailout) {
      z = { re: z.re * z.re - z.im * z.im + c.re, im: 2 * z.re * z.im + c.im };
      steps++;
    }
    if (steps >= view.iterations) return p.insideTone;
    // nu = n + 1 - log2(log|z| / log(bailout)) is the fractional escape time.
    const nu =
        steps +
        1 -
        Math.log2(Math.log(Math.hypot(z.re, z.im)) / Math.log(p.bailout)),
      level = nu / (nu + p.scale);
    return (
      p.lowTone +
      (p.highTone - p.lowTone) * level +
      p.bandDepth * Math.cos((2 * Math.PI * nu) / p.bandPeriod)
    );
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'matches the smooth escape time of exactly one of the four views (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('mandelbrotbands', seed),
        out = empty(),
        n = 80,
        agreement = p.views.map(() => 0);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const u = (x + 0.5) / n,
            v = (y + 0.5) / n;
          sample(u, v, out);
          p.views.forEach((view, i) => {
            agreement[i] += Number(
              Math.abs(out.color - predict(view, u, v)) < 0.02,
            );
          });
        }
      const ranked = agreement
        .map((count) => count / (n * n))
        .sort((a, b) => b - a);
      // The chosen view reproduces the rendering nearly everywhere (pixels on the set's edge can differ by one iteration),
      // and no other view comes close.
      expect(ranked[0]).toBeGreaterThan(0.97);
      expect(ranked[1]).toBeLessThan(0.8);
    },
  );

  it('shows more than one view across seeds, and the full view contains the main cardioid', () => {
    const views = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const sample = createSurfaceSampler('mandelbrotbands', seed),
        out = empty(),
        n = 24,
        agreement = p.views.map(() => 0);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          p.views.forEach((view, i) => {
            agreement[i] += Number(
              Math.abs(
                out.color - predict(view, (x + 0.5) / n, (y + 0.5) / n),
              ) < 0.02,
            );
          });
        }
      views.add(agreement.indexOf(Math.max(...agreement)));
    }
    expect(views.size).toBe(p.views.length);
    // Seed-independent geometry of view 0: the point c = -0.1 (inside the main cardioid) is in the set and c = 1 is not.
    const inside = (re: number, im: number): boolean => {
      let zr = 0,
        zi = 0;
      for (let step = 0; step < 200; step++)
        [zr, zi] = [zr * zr - zi * zi + re, 2 * zr * zi + im];
      return Math.hypot(zr, zi) < 2;
    };
    expect(inside(-0.1, 0)).toBe(true);
    expect(inside(1, 0)).toBe(false);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mandelbrotbands', 0),
      b = createSurfaceSampler('mandelbrotbands', 7),
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

describe('cantorsetrows: stages of the Cantor construction', () => {
  const p = proceduralMaterialPresets.cantorsetrows;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows row k as 2^k equal intervals whose total length is (1 - r)^k (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('cantorsetrows', seed),
        out = empty(),
        n = 40000,
        step = 1 / n,
        rowCentre = (row: number): number => p.top + (row + 0.5) * p.rowPitch,
        // Runs of dark samples along a row, as [start, length] in u.
        runs = (row: number): [number, number][] => {
          const found: [number, number][] = [];
          let start = -1;
          for (let i = 0; i < n; i++) {
            sample((i + 0.5) * step, rowCentre(row), out);
            const dark = out.color < 0.5;
            if (dark && start < 0) start = i;
            if (!dark && start >= 0) {
              found.push([start * step, (i - start) * step]);
              start = -1;
            }
          }
          if (start >= 0) found.push([start * step, 1 - start * step]);
          return found;
        },
        first = runs(1),
        // The fraction removed in each step is read from the first split: two intervals sharing 1 - r of the unit length.
        measured = 1 - first.reduce((sum, [, length]) => sum + length, 0),
        removed = p.removed.reduce((best, candidate) =>
          Math.abs(candidate - measured) < Math.abs(best - measured)
            ? candidate
            : best,
        );
      expect(Math.abs(measured - removed)).toBeLessThan(0.002);
      expect(first.length).toBe(2);
      // The kept parts are symmetric about the middle.
      expect(first[0][0]).toBeCloseTo(0, 3);
      expect(first[1][0] + first[1][1]).toBeCloseTo(1, 3);
      const keep = (1 - removed) / 2;
      for (let row = 0; row <= 5; row++) {
        const found = runs(row);
        expect(found.length).toBe(2 ** row);
        const expectedLength = keep ** row;
        for (const [, length] of found)
          expect(Math.abs(length - expectedLength)).toBeLessThan(3 * step);
        // Total measure (1 - r)^row.
        expect(found.reduce((sum, [, length]) => sum + length, 0)).toBeCloseTo(
          (1 - removed) ** row,
          2,
        );
      }
      // Vertically each bar is barThickness tall and the paper between rows is bare. At the middle of row k's first
      // interval, rows 0 to k all have a bar and the later rows are in a gap.
      for (let row = 0; row <= 5; row++) {
        let dark = 0;
        for (let i = 0; i < 8000; i++) {
          sample(keep ** row / 2, i / 8000, out);
          dark += Number(out.color < 0.5);
        }
        expect(Math.abs(dark / 8000 - (row + 1) * p.barThickness)).toBeLessThan(
          0.003,
        );
      }
    },
  );

  it('shows all three removal fractions across seeds', () => {
    const seen = new Set<number>(),
      out = empty();
    for (let seed = 0; seed < 40; seed++) {
      const sample = createSurfaceSampler('cantorsetrows', seed);
      let dark = 0;
      for (let i = 0; i < 2000; i++) {
        sample((i + 0.5) / 2000, p.top + 1.5 * p.rowPitch, out);
        dark += Number(out.color < 0.5);
      }
      // Row 1's dark fraction is 1 - r.
      seen.add(Math.round((1 - dark / 2000) * 100));
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([20, 33, 50]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('cantorsetrows', 0),
      b = createSurfaceSampler('cantorsetrows', 7),
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

describe('conicsections: conics drawn from the focus and directrix rule', () => {
  const p = proceduralMaterialPresets.conicsections;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts a circle, an ellipse, a parabola and a hyperbola in the four panels, each satisfying distance to focus = e x distance to directrix (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('conicsections', seed),
        out = empty(),
        step = 0.001,
        centres = [
          [0.25, 0.25],
          [0.75, 0.25],
          [0.25, 0.75],
          [0.75, 0.75],
        ],
        assigned: number[] = [];
      for (const [cx, cy] of centres) {
        // The dark curve pixels of this panel, with their offsets from the panel centre.
        const dark: [number, number][] = [];
        for (let y = -p.panelHalf + step / 2; y < p.panelHalf; y += step)
          for (let x = -p.panelHalf + step / 2; x < p.panelHalf; x += step) {
            sample(cx + x, cy + y, out);
            if (out.color < 0.3) dark.push([x, y]);
          }
        expect(dark.length).toBeGreaterThan(200);
        // A candidate conic: the focus sits at (shift, 0) from the panel centre and the directrix is the vertical line
        // l / e to the right of the focus; pixels near the focus are the focus dot and are ignored.
        const fits = p.eccentricities.map((e, kind) => {
          const fx = p.focusShifts[kind];
          let tested = 0,
            matching = 0;
          for (const [x, y] of dark) {
            const r = Math.hypot(x - fx, y);
            if (r < 0.014) continue;
            tested++;
            // Residual of r = e * (distance to the directrix); a circle (e = 0) is r = l.
            const residual =
              e === 0
                ? Math.abs(r - p.latusRectum)
                : Math.abs(r - e * Math.abs(x - fx - p.latusRectum / e));
            matching += Number(residual < 0.0075);
          }
          return matching / tested;
        });
        const best = Math.max(...fits),
          kind = fits.indexOf(best);
        expect(best).toBeGreaterThan(0.98);
        expect([...fits].sort((a, b) => b - a)[1]).toBeLessThan(0.6);
        // A hyperbola has two branches: pixels near the vertex of each (x' = l / (1 + e) and x' = l / (e - 1) from the focus).
        const e = p.eccentricities[kind];
        if (e > 1) {
          const fx = p.focusShifts[kind];
          expect(
            dark.some(
              ([x, y]) =>
                Math.abs(x - fx - p.latusRectum / (e - 1)) < 0.003 &&
                Math.abs(y) < 0.003,
            ),
          ).toBe(true);
          expect(
            dark.some(
              ([x, y]) =>
                Math.abs(x - fx - p.latusRectum / (1 + e)) < 0.003 &&
                Math.abs(y) < 0.003,
            ),
          ).toBe(true);
        }
        assigned.push(kind);
      }
      // Each of the four conics appears exactly once.
      expect([...assigned].sort()).toEqual([0, 1, 2, 3]);
    },
  );

  it('shows more than one arrangement across seeds', () => {
    const arrangements = new Set<string>(),
      out = empty();
    for (let seed = 0; seed < 20; seed++) {
      const sample = createSurfaceSampler('conicsections', seed);
      // Which panel holds the circle: the only panel with dark pixels at distance latusRectum to the right, left and
      // below the panel centre (where its focus dot sits).
      const circles: number[] = [];
      [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ].forEach(([cx, cy], panel) => {
        const onCircle = [
          [p.latusRectum, 0],
          [-p.latusRectum, 0],
          [0, p.latusRectum],
        ].every(([dx, dy]) => {
          sample(cx + dx, cy + dy, out);
          return out.color < 0.3;
        });
        if (onCircle) circles.push(panel);
      });
      expect(circles.length).toBe(1);
      const circlePanel = circles[0];
      arrangements.add(String(circlePanel));
    }
    expect(arrangements.size).toBeGreaterThan(1);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('conicsections', 0),
      b = createSurfaceSampler('conicsections', 7),
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

describe('rosecurves: rhodonea roses in a three-by-three grid', () => {
  const p = proceduralMaterialPresets.rosecurves;

  // Points of the rose r = R cos(k theta), k = numerator / denominator, relative to the panel centre. The curve closes
  // within denominator * 2 pi, so the parameter runs over 2 pi per unit of denominator.
  const rosePoints = (
    numerator: number,
    denominator: number,
    count: number,
  ): [number, number][] => {
    const k = numerator / denominator,
      points: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const theta = (2 * Math.PI * denominator * i) / count,
        r = p.radius * Math.cos(k * theta);
      points.push([r * Math.cos(theta), r * Math.sin(theta)]);
    }
    return points;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws each of the nine roses r = cos(k theta) once, passing through its own parametric points (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('rosecurves', seed),
        out = empty(),
        step = 0.003,
        third = 1 / 3,
        curves = p.curves.map(([a, b]) => rosePoints(a, b, 1000)),
        used: number[] = [];
      for (let row = 0; row < 3; row++)
        for (let column = 0; column < 3; column++) {
          const cx = (column + 0.5) * third,
            cy = (row + 0.5) * third,
            dark: [number, number][] = [];
          for (let y = -third / 2 + step / 2; y < third / 2; y += step)
            for (let x = -third / 2 + step / 2; x < third / 2; x += step) {
              sample(cx + x, cy + y, out);
              if (out.color < 0.3) dark.push([x, y]);
            }
          expect(dark.length).toBeGreaterThan(100);
          // How many dark pixels lie within a pixel or two of a candidate's curve.
          const fits = curves.map((points) => {
            let near = 0;
            for (const [x, y] of dark) {
              if (
                points.some(([px, py]) => Math.hypot(px - x, py - y) < 0.0055)
              )
                near++;
            }
            return near / dark.length;
          });
          const best = Math.max(...fits),
            index = fits.indexOf(best);
          expect(best).toBeGreaterThan(0.97);
          expect([...fits].sort((a, b) => b - a)[1]).toBeLessThan(0.9);
          // And the curve is fully drawn: the sampler is dark at (nearly) every parametric point.
          const drawn = curves[index].filter(([x, y]) => {
            sample(cx + x, cy + y, out);
            return out.color < 0.35;
          }).length;
          expect(drawn / curves[index].length).toBeGreaterThan(0.97);
          used.push(index);
        }
      expect([...used].sort((a, b) => a - b)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8,
      ]);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('rosecurves', 0),
      b = createSurfaceSampler('rosecurves', 7),
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

describe('cassiniovals: curves of constant product of distances to two foci', () => {
  const p = proceduralMaterialPresets.cassiniovals;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts every dark pixel on an oval where |PF1| |PF2| = b^2 for one of the b values (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('cassiniovals', seed),
        out = empty(),
        n = 400,
        dark: [number, number][] = [];
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          if (out.color < 0.3)
            dark.push([(x + 0.5) / n - 0.5, (y + 0.5) / n - 0.5]);
        }
      expect(dark.length).toBeGreaterThan(300);
      // For each candidate half separation a, how many dark pixels lie (within a pixel or two) on one of the curves
      // sqrt(|PF1| |PF2|) = ratio * a. A perpendicular offset d changes that geometric mean by about d (r1 + r2) / (2 gm).
      const fits = p.halfSeparations.map((a) => {
        let tested = 0,
          matching = 0;
        for (const [x, y] of dark) {
          const r1 = Math.hypot(x + a, y),
            r2 = Math.hypot(x - a, y);
          if (Math.min(r1, r2) < 0.014) continue;
          tested++;
          const mean = Math.sqrt(r1 * r2),
            nearest = Math.min(
              ...p.ratios.map((ratio) => Math.abs(mean - ratio * a)),
            ),
            allowance = (0.0035 * (r1 + r2)) / (2 * mean) + 0.001;
          matching += Number(nearest < allowance);
        }
        return matching / tested;
      });
      const best = Math.max(...fits),
        a = p.halfSeparations[fits.indexOf(best)];
      expect(best).toBeGreaterThan(0.98);
      expect([...fits].sort((x, y) => y - x)[1]).toBeLessThan(0.7);
      // The lemniscate (ratio 1) passes through the midpoint between the foci, where the product is a^2 and the gradient
      // of the product vanishes, so the distance estimate must not blow up there.
      sample(0.5, 0.5, out);
      expect(out.color).toBeLessThan(0.3);
      // Each focus is marked, and every ratio's curve is present: on the axis beyond the right focus the product
      // (x - a)(x + a) = x^2 - a^2 reaches (ratio a)^2 at x = a sqrt(1 + ratio^2), which must be dark for the larger ratios.
      for (const ratio of p.ratios) {
        const x = ratio >= 1 ? a * Math.sqrt(1 + ratio * ratio) : -1;
        if (x < 0) continue;
        sample(0.5 + x, 0.5, out);
        expect(out.color).toBeLessThan(0.45);
      }
      sample(0.5 + a, 0.5, out);
      expect(out.color).toBeLessThan(0.3);
    },
  );

  it('shows all three focal separations across seeds', () => {
    const out = empty(),
      seen = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const sample = createSurfaceSampler('cassiniovals', seed);
      p.halfSeparations.forEach((a, index) => {
        sample(0.5 + a, 0.5, out);
        // A focus dot is dark exactly at the focus; the other separations' foci are in open paper or on curves, so also
        // require the left focus.
        const right = out.color < 0.3;
        sample(0.5 - a, 0.5, out);
        if (right && out.color < 0.3) seen.add(index);
      });
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('cassiniovals', 0),
      b = createSurfaceSampler('cassiniovals', 7),
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

describe('twosourceripples: interference of two circular waves', () => {
  const p = proceduralMaterialPresets.twosourceripples;
  const fold = (t: number): number => 1 - Math.abs(2 * t - 1);
  // The tone of a zero sum of the two waves (the nodal lines) is the middle of the tone range.
  const middle = (p.lowTone + p.highTone) / 2;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts the nodal lines on the hyperbolas |r1 - r2| = (m + 1/2) lambda and the strongest crests where both waves agree (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('twosourceripples', seed),
        out = empty(),
        n = 240,
        tones: number[] = [];
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          sample((x + 0.5) / n, (y + 0.5) / n, out);
          tones.push(out.color);
        }
      // For each candidate (wavelength, separation) measure how many near-nodal points are mid tone and how many near
      // points where both waves are at a crest or trough are extreme.
      const results: { nodal: number; extreme: number }[] = [];
      for (const wavelength of p.wavelengths)
        for (const separation of p.separations) {
          let nodal = 0,
            nodalMatching = 0,
            extreme = 0,
            extremeMatching = 0;
          for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++) {
              const fx = fold((x + 0.5) / n),
                fy = fold((y + 0.5) / n),
                r1 = Math.hypot(fx - (0.5 - separation / 2), fy - 0.5),
                r2 = Math.hypot(fx - (0.5 + separation / 2), fy - 0.5),
                difference = (r1 - r2) / wavelength,
                total = (r1 + r2) / wavelength,
                tone = tones[y * n + x];
              // r1 - r2 within 0.02 wavelengths of an odd multiple of half a wavelength.
              if (
                Math.abs(Math.abs(Math.sin(Math.PI * difference)) - 1) < 0.0004
              ) {
                nodal++;
                nodalMatching += Number(Math.abs(tone - middle) < 0.04);
              }
              // Both r1 - r2 and r1 + r2 near whole wavelengths: the two waves are in step and the sum is +-2.
              if (
                Math.abs(Math.sin(Math.PI * difference)) < 0.06 &&
                Math.abs(Math.sin(Math.PI * total)) < 0.06
              ) {
                extreme++;
                extremeMatching += Number(Math.abs(tone - middle) > 0.36);
              }
            }
          results.push({
            nodal: nodalMatching / Math.max(1, nodal),
            // Some geometries have no grid point where both conditions hold; then only the nodal lines are judged.
            extreme: extreme >= 5 ? extremeMatching / extreme : 1,
          });
        }
      const scores = results.map((result) =>
          Math.min(result.nodal, result.extreme),
        ),
        best = Math.max(...scores);
      expect(best).toBeGreaterThan(0.97);
      // Exactly one (wavelength, separation) pair explains the picture.
      expect(scores.filter((score) => score > 0.6).length).toBe(1);
    },
  );

  it('shows more than one wavelength across seeds', () => {
    const out = empty(),
      seen = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const sample = createSurfaceSampler('twosourceripples', seed);
      // Along the row through the sources, count tone peaks to read off the wavelength.
      let previous = 0,
        rising = false,
        peaks = 0;
      for (let i = 0; i < 4000; i++) {
        sample((i + 0.5) / 4000 / 2, 0.5, out);
        if (out.color > previous && !rising) rising = true;
        if (out.color < previous && rising) {
          rising = false;
          peaks++;
        }
        previous = out.color;
      }
      seen.add(String(Math.round(peaks / 5)));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('twosourceripples', 0),
      b = createSurfaceSampler('twosourceripples', 7),
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

describe('luhnnumbers: sixteen-digit numbers marked as passing or failing the Luhn check', () => {
  const p = proceduralMaterialPresets.luhnnumbers;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    V: ['...', '..#', '#.#', '.#.', '...'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  };
  // The Luhn check as it is usually stated: from the right, double every second digit, subtract 9 from any result
  // above 9, add everything up; the number is valid when the total is a multiple of 10.
  const luhnValid = (digits: number[]): boolean => {
    let total = 0;
    for (
      let i = digits.length - 1, double = false;
      i >= 0;
      i--, double = !double
    ) {
      let value = digits[i];
      if (double) {
        value *= 2;
        if (value > 9) value -= 9;
      }
      total += value;
    }
    return total % 10 === 0;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'marks a number with a check mark exactly when it passes the Luhn check (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('luhnnumbers', seed),
        out = empty(),
        // Cell column of digit i: groups of four separated by one blank cell.
        columnOf = (digit: number): number =>
          digit + Math.floor(digit / p.groupSize),
        markColumn = columnOf(p.digits - 1) + 2,
        at = (column: number, row: number, fx: number, fy: number): number => {
          sample(
            p.left + (column + fx) * p.cell,
            p.top + (row + fy) * p.rowPitch,
            out,
          );
          return out.color;
        },
        read = (column: number, row: number): string => {
          const background = at(column, row, 0.08, 0.1),
            bits: string[] = [];
          for (let y = 0; y < 5; y++) {
            let text = '';
            for (let x = 0; x < 3; x++) {
              const fx = 0.5 + ((x - 1) * p.digitPixel) / p.cell,
                fy = 0.5 + ((y - 2) * p.digitPixel) / p.rowPitch;
              text +=
                Math.abs(at(column, row, fx, fy) - background) > 0.4
                  ? '#'
                  : '.';
            }
            bits.push(text);
          }
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === bits[i]),
          );
          expect(found).toBeDefined();
          return (found as [string, string[]])[0];
        };
      let valid = 0;
      const seen = new Set<string>();
      for (let row = 0; row < p.rows; row++) {
        const digits = Array.from({ length: p.digits }, (_, i) =>
            Number(read(columnOf(i), row)),
          ),
          mark = read(markColumn, row);
        // The gaps between groups hold nothing.
        for (const gap of [4, 9, 14, 19]) {
          const middle = at(gap, row, 0.5, 0.5);
          expect(middle).toBeGreaterThan(0.85);
        }
        expect(mark === 'V').toBe(luhnValid(digits));
        valid += Number(mark === 'V');
        // The check digit (the last) has the darker cell.
        expect(at(columnOf(p.digits - 1), row, 0.08, 0.1) < 0.85).toBe(true);
        expect(at(columnOf(0), row, 0.08, 0.1) > 0.85).toBe(true);
        seen.add(digits.join(''));
      }
      expect(seen.size).toBe(p.rows);
      // A mix of passing and failing numbers.
      expect(valid).toBeGreaterThanOrEqual(1);
      expect(valid).toBeLessThanOrEqual(p.rows - 1);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('luhnnumbers', 0),
      b = createSurfaceSampler('luhnnumbers', 7),
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

describe('bezierconstruction: cubic Bezier curves with the de Casteljau construction', () => {
  const p = proceduralMaterialPresets.bezierconstruction;
  const centres = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];
  // Control points of preset curve `index` in a panel centred at (cx, cy).
  const controls = (
    index: number,
    cx: number,
    cy: number,
  ): [number, number][] =>
    [0, 1, 2, 3].map((k) => [
      cx + p.curves[index][2 * k],
      cy + p.curves[index][2 * k + 1],
    ]);
  // The Bezier curve from its Bernstein form B(t) = sum C(3, i) t^i (1 - t)^(3 - i) P_i.
  const bernstein = (
    points: [number, number][],
    t: number,
  ): [number, number] => {
    const weights = [
      (1 - t) ** 3,
      3 * t * (1 - t) ** 2,
      3 * t * t * (1 - t),
      t ** 3,
    ];
    return [
      weights.reduce((s, w, i) => s + w * points[i][0], 0),
      weights.reduce((s, w, i) => s + w * points[i][1], 0),
    ];
  };
  // The de Casteljau construction, written as repeated interpolation.
  const casteljau = (
    points: [number, number][],
    t: number,
  ): [number, number][][] => {
    const levels = [points];
    while (levels[levels.length - 1].length > 1) {
      const last = levels[levels.length - 1];
      levels.push(
        last
          .slice(1)
          .map(
            (q, i) =>
              [
                last[i][0] + (q[0] - last[i][0]) * t,
                last[i][1] + (q[1] - last[i][1]) * t,
              ] as [number, number],
          ),
      );
    }
    return levels;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws each curve through its Bernstein points and marks the de Casteljau point at one parameter (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('bezierconstruction', seed),
        out = empty(),
        colorAt = (x: number, y: number): number => {
          sample(x, y, out);
          return out.color;
        },
        used: number[] = [],
        matches: Map<number, number>[] = [];
      centres.forEach(([cx, cy]) => {
        // Which preset curve sits in this panel: the one whose Bernstein points are (nearly) all dark.
        const fits = p.curves.map((_, index) => {
          const points = controls(index, cx, cy);
          let dark = 0;
          for (let i = 0; i <= 100; i++) {
            const [x, y] = bernstein(points, i / 100);
            dark += Number(colorAt(x, y) < 0.3);
          }
          return dark / 101;
        });
        const best = Math.max(...fits),
          index = fits.indexOf(best);
        expect(best).toBeGreaterThan(0.97);
        expect([...fits].sort((a, b) => b - a)[1]).toBeLessThan(0.6);
        used.push(index);
        // For each candidate parameter, is the de Casteljau point marked (a dark disc) in this panel?
        const marked = new Map<number, number>();
        p.parameters.forEach((t, k) => {
          const levels = casteljau(controls(index, cx, cy), t),
            [x, y] = levels[3][0];
          marked.set(
            k,
            colorAt(x, y) < 0.15 &&
              colorAt(x + 0.007, y) < 0.15 &&
              colorAt(x, y - 0.007) < 0.15
              ? 1
              : 0,
          );
        });
        matches.push(marked);
        // The end points are filled squares, the inner control points are rings (hollow in the middle).
        const points = controls(index, cx, cy);
        for (const k of [0, 3])
          expect(colorAt(points[k][0], points[k][1])).toBeLessThan(0.2);
        for (const k of [1, 2]) {
          // The guide lines pass through the centre, so look for bare paper in the hollow around it.
          const hollow = Math.max(
            ...[0, 1, 2, 3, 4, 5, 6, 7].map((m) =>
              colorAt(
                points[k][0] + 0.0035 * Math.cos((m * Math.PI) / 4),
                points[k][1] + 0.0035 * Math.sin((m * Math.PI) / 4),
              ),
            ),
          );
          expect(hollow).toBeGreaterThan(0.8);
          expect(colorAt(points[k][0] + 0.0072, points[k][1])).toBeLessThan(
            0.3,
          );
        }
      });
      // Each preset curve appears once.
      expect([...used].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
      // Exactly one parameter is marked in every panel.
      const common = p.parameters.map((_, k) =>
        matches.every((m) => m.get(k) === 1),
      );
      expect(common.filter(Boolean).length).toBe(1);
    },
  );

  it('shows more than one construction parameter across seeds', () => {
    const out = empty(),
      seen = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const sample = createSurfaceSampler('bezierconstruction', seed);
      // The point at parameter t of the first preset curve, wherever its panel is, is only marked for the chosen t.
      centres.forEach(([cx, cy]) => {
        p.curves.forEach((_, index) => {
          p.parameters.forEach((t, k) => {
            const [x, y] = casteljau(controls(index, cx, cy), t)[3][0];
            sample(x, y, out);
            const a = out.color;
            sample(x + 0.007, y, out);
            const b = out.color;
            sample(x, y - 0.007, out);
            if (a < 0.15 && b < 0.15 && out.color < 0.15) seen.add(k);
          });
        });
      });
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bezierconstruction', 0),
      b = createSurfaceSampler('bezierconstruction', 7),
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

describe('vennregions: a three-set Venn diagram with region counts and set totals', () => {
  const p = proceduralMaterialPresets.vennregions;
  const art: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '=': ['...', '###', '...', '###', '...'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'],
  };
  // Which of the circles A, B, C contain each region's label, by the preset's own geometry.
  const membership = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts each count in its own region, and the three totals add up the regions inside each circle (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('vennregions', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        // Reads the 3 x 5 matrix centred at (cx, cy); dark pixels are ink.
        pattern = (cx: number, cy: number): string[] =>
          [0, 1, 2, 3, 4].map((line) =>
            [0, 1, 2]
              .map((x) =>
                at(
                  cx + (x - 1) * p.digitPixel,
                  cy + (line - 2) * p.digitPixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          ),
        symbol = (cx: number, cy: number): string | undefined =>
          Object.entries(art).find(([, shape]) =>
            shape.every((line, i) => line === pattern(cx, cy)[i]),
          )?.[0],
        readNumber = (cx: number, cy: number): number => {
          // Count the digits by the widest ink column (1, 2 or 3 digits are centred on the point).
          const anyInk = (offset: number): boolean =>
              [0, 1, 2, 3, 4].some(
                (line) =>
                  at(
                    cx + offset * p.digitPixel,
                    cy + (line - 2) * p.digitPixel,
                  ) < 0.3 ||
                  at(
                    cx - offset * p.digitPixel,
                    cy + (line - 2) * p.digitPixel,
                  ) < 0.3,
              ),
            reach = [5, 3, 1].find((offset) => anyInk(offset)),
            count = reach === 5 ? 3 : reach === 3 ? 2 : 1;
          let value = 0;
          for (let d = 0; d < count; d++) {
            const digit = symbol(
              cx - (2 * count - 1) * p.digitPixel + (4 * d + 1) * p.digitPixel,
              cy,
            );
            expect(digit).toBeDefined();
            value = value * 10 + Number(digit);
          }
          return value;
        },
        counts = Array.from({ length: 7 }, (_, region) =>
          readNumber(
            p.regionLabels[2 * region],
            p.regionLabels[2 * region + 1],
          ),
        );
      // Each label sits inside exactly the circles its region belongs to.
      for (let region = 0; region < 7; region++) {
        const [x, y] = [
          p.regionLabels[2 * region],
          p.regionLabels[2 * region + 1],
        ];
        for (let k = 0; k < 3; k++) {
          const inside =
            Math.hypot(x - p.centres[2 * k], y - p.centres[2 * k + 1]) <
            p.radius;
          expect(inside).toBe(membership[region][k] === 1);
        }
      }
      for (const count of counts) expect(count).toBeLessThanOrEqual(p.maxCount);
      // The totals "A=..", "B=..", "C=..": read the letter, the equals sign and the digits left to right.
      const totals = [0, 1, 2].map((line) => {
        let text = '';
        for (let column = 0; column < 6; column++) {
          const cx = p.totalsLeft + (column + 0.5) * p.glyphPitch,
            shape = pattern(cx, p.totalsTop[line]);
          if (shape.every((row) => row === '...')) break;
          const found = Object.entries(art).find(([, candidate]) =>
            candidate.every((row, i) => row === shape[i]),
          );
          expect(found).toBeDefined();
          text += (found as [string, string[]])[0];
        }
        return text;
      });
      expect(totals.map((text) => text.slice(0, 2))).toEqual([
        'A=',
        'B=',
        'C=',
      ]);
      const [a, b, c, ab, ac, bc, abc] = counts,
        sizes = totals.map((text) => Number(text.slice(2)));
      // |A| is everything inside circle A, and so on.
      expect(sizes).toEqual([
        a + ab + ac + abc,
        b + ab + bc + abc,
        c + ac + bc + abc,
      ]);
      // Inclusion-exclusion: the union is |A| + |B| + |C| - |A n B| - |A n C| - |B n C| + |A n B n C|.
      expect(
        sizes[0] +
          sizes[1] +
          sizes[2] -
          (ab + abc) -
          (ac + abc) -
          (bc + abc) +
          abc,
      ).toBe(a + b + c + ab + ac + bc + abc);
      // Each circle's outline passes through its four extreme points, and its middle is not outlined.
      for (let k = 0; k < 3; k++) {
        const cx = p.centres[2 * k],
          cy = p.centres[2 * k + 1];
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          expect(at(cx + dx * p.radius, cy + dy * p.radius)).toBeLessThan(0.4);
      }
      // The shading follows the circle's edge: just inside is darker than just outside, at the three extreme points that
      // lie outside the other circles (left of A, right of B, below C).
      for (const [k, dx, dy] of [
        [0, -1, 0],
        [1, 1, 0],
        [2, 0, 1],
      ] as const) {
        const cx = p.centres[2 * k],
          cy = p.centres[2 * k + 1];
        expect(
          at(cx + dx * (p.radius - 0.012), cy + dy * (p.radius - 0.012)),
        ).toBeLessThan(
          at(cx + dx * (p.radius + 0.012), cy + dy * (p.radius + 0.012)) - 0.03,
        );
      }
      // Overlaps are shaded darker: the mean background tone falls with the number of circles a point lies in (ink and
      // outlines, which are much darker, are left out).
      const sums = [0, 0, 0, 0],
        numbers = [0, 0, 0, 0],
        n = 160;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const px = (x + 0.5) / n,
            py = (y + 0.5) / n,
            tone = at(px, py);
          if (tone < 0.5) continue;
          const inside = [0, 1, 2].filter(
            (k) =>
              Math.hypot(px - p.centres[2 * k], py - p.centres[2 * k + 1]) <
              p.radius,
          ).length;
          sums[inside] += tone;
          numbers[inside]++;
        }
      const means = sums.map((sum, i) => sum / numbers[i]);
      for (let i = 1; i < 4; i++)
        expect(means[i]).toBeLessThan(means[i - 1] - 0.03);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('vennregions', 0),
      b = createSurfaceSampler('vennregions', 7),
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

describe('ieee754floats: single-precision numbers with their bit fields', () => {
  const p = proceduralMaterialPresets.ieee754floats;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '.': ['...', '...', '...', '...', '.#.'],
    '-': ['...', '...', '###', '...', '...'],
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'prints each number as the value its sign, exponent and mantissa bits encode (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('ieee754floats', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        read = (cx: number, cy: number, pixel: number): string => {
          const rows = [0, 1, 2, 3, 4].map((line) =>
            [0, 1, 2]
              .map((x) =>
                at(cx + (x - 1) * pixel, cy + (line - 2) * pixel) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          if (rows.every((row) => row === '...')) return ' ';
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((row, i) => row === rows[i]),
          );
          expect(found).toBeDefined();
          return (found as [string, string[]])[0];
        };
      const seen = new Set<string>();
      for (let block = 0; block < p.blocks; block++) {
        const top = p.top + block * p.blockPitch,
          bits = Array.from({ length: 32 }, (_, i) =>
            Number(
              read(
                p.bitsLeft + (i + 0.5) * p.bitsPitch,
                top + p.bitsLine,
                p.bitsPixel,
              ),
            ),
          );
        let text = '';
        for (let column = 0; column < 12; column++) {
          const symbol = read(
            p.textLeft + (column + 0.5) * p.textPitch,
            top + p.textLine,
            p.textPixel,
          );
          if (symbol === ' ') break;
          text += symbol;
        }
        // Decode the bit fields by hand: sign, biased exponent, mantissa.
        const sign = bits[0],
          exponent = bits
            .slice(1, 9)
            .reduce((value, bit) => value * 2 + bit, 0),
          mantissa = bits.slice(9).reduce((value, bit) => value * 2 + bit, 0),
          value =
            (sign ? -1 : 1) * 2 ** (exponent - 127) * (1 + mantissa / 8388608);
        expect(exponent).toBeGreaterThanOrEqual(p.exponentMin);
        expect(exponent).toBeLessThanOrEqual(p.exponentMax);
        expect(text).toBe(value.toFixed(p.decimals));
        // The same value through the platform's own float32 encoding gives the same bits.
        const view = new DataView(new ArrayBuffer(4));
        view.setFloat32(0, value);
        expect(view.getUint32(0)).toBe(
          bits.reduce((word, bit) => word * 2 + bit, 0),
        );
        // Field shading: the sign cell darkest, then the exponent, then the mantissa.
        const toneAt = (cell: number): number =>
          at(p.bitsLeft + (cell + 0.1) * p.bitsPitch, top + p.bitsLine - 0.012);
        expect(toneAt(0)).toBeLessThan(0.84);
        expect(toneAt(4)).toBeGreaterThan(0.8);
        expect(toneAt(4)).toBeLessThan(0.9);
        expect(toneAt(20)).toBeGreaterThan(0.9);
        seen.add(text);
      }
      expect(seen.size).toBe(p.blocks);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('ieee754floats', 0),
      b = createSurfaceSampler('ieee754floats', 7),
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

describe('bellcurvebands: a normal curve shaded by standard deviations', () => {
  const p = proceduralMaterialPresets.bellcurvebands;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shades the area under the curve in the 68-95-99.7 proportions with bands one sigma wide (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('bellcurvebands', seed),
        out = empty(),
        at = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        // Classify a tone: 0..3 for the four fills (darkest to lightest), 4 for paper, -1 for lines.
        kind = (tone: number): number =>
          tone < 0.4
            ? -1
            : tone < 0.57
              ? 0
              : tone < 0.71
                ? 1
                : tone < 0.83
                  ? 2
                  : tone < 0.915
                    ? 3
                    : 4,
        columns = 900,
        rows = 900;
      // Along a row just above the axis, within 2.5 sigma of the middle (where the curve is far above the row), the fill
      // tone steps at 0.5 +- sigma and 0.5 +- 2 sigma. Find which preset sigma explains it.
      const row = p.baseline - 0.004,
        steps = 20000,
        scores = p.sigmas.map((candidate) => {
          let tested = 0,
            matching = 0;
          for (let i = 0; i < steps; i++) {
            const u = (i + 0.5) / steps;
            if (Math.abs(u - 0.5) >= 2.5 * candidate) continue;
            tested++;
            matching += Number(
              kind(at(u, row)) === Math.floor(Math.abs(u - 0.5) / candidate),
            );
          }
          return matching / tested;
        }),
        best = Math.max(...scores),
        sigma = p.sigmas[scores.indexOf(best)];
      expect(best).toBeGreaterThan(0.995);
      expect([...scores].sort((a, b) => b - a)[1]).toBeLessThan(0.95);
      // The steps are where they should be: along the clean stretch there are exactly four tone changes.
      const edges: number[] = [];
      let previous = kind(at(0.5 - 2.5 * sigma, row));
      for (let i = 1; i <= steps; i++) {
        const u = 0.5 - 2.5 * sigma + (5 * sigma * i) / steps,
          current = kind(at(u, row));
        if (current !== previous) edges.push(u);
        previous = current;
      }
      expect(edges.length).toBe(4);
      [-2, -1, 1, 2].forEach((k, i) =>
        expect(Math.abs(edges[i] - (0.5 + k * sigma))).toBeLessThan(0.0015),
      );
      // Area per band. With sigma known, each column's fill tone is known, so a pixel is fill when its tone is close to
      // that, outline when much darker, and paper when much lighter. The outline is centred on the curve, so a run of
      // outline pixels followed by fill counts half towards that fill (its upper half lies outside the area).
      const counts = [0, 0, 0, 0],
        top = p.baseline - p.peak - 0.01,
        bottom = p.baseline - 0.003;
      let total = 0;
      for (let x = 0; x < columns; x++) {
        const u = (x + 0.5) / columns,
          band = Math.min(3, Math.floor(Math.abs(u - 0.5) / sigma)),
          fill = p.bandTones[band];
        let outline = 0;
        for (let y = 0; y < rows; y++) {
          const tone = at(u, top + ((y + 0.5) / rows) * (bottom - top));
          if (tone < fill - 0.05) outline++;
          else {
            if (tone < fill + 0.05) {
              counts[band] += 1 + outline * 0.5;
              total += 1 + outline * 0.5;
            }
            outline = 0;
          }
        }
      }
      // The fractions of the area within 1, 2 and 3 standard deviations of the mean: the normal distribution's
      // 0.6827, 0.9545 and 0.9973.
      const within = [
        counts[0],
        counts[0] + counts[1],
        counts[0] + counts[1] + counts[2],
      ].map((count) => count / total);
      expect(Math.abs(within[0] - 0.6827)).toBeLessThan(0.008);
      expect(Math.abs(within[1] - 0.9545)).toBeLessThan(0.008);
      expect(Math.abs(within[2] - 0.9973)).toBeLessThan(0.005);
    },
  );

  it('shows all three widths across seeds', () => {
    const out = empty(),
      widths = new Set<number>();
    for (let seed = 0; seed < 40; seed++) {
      const sample = createSurfaceSampler('bellcurvebands', seed);
      // The darkest fill spans 0.5 +- sigma along the row just above the axis.
      let span = 0;
      for (let i = 0; i < 4000; i++) {
        sample((i + 0.5) / 4000, p.baseline - 0.004, out);
        if (out.color > 0.4 && out.color < 0.57) span++;
      }
      widths.add(Math.round((span / 4000 / 2) * 100));
    }
    expect([...widths].sort((a, b) => a - b)).toEqual([7, 9, 11]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bellcurvebands', 0),
      b = createSurfaceSampler('bellcurvebands', 7),
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

describe('roundingmodes: numbers rounded five ways', () => {
  const p = proceduralMaterialPresets.roundingmodes;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '.': ['...', '...', '...', '...', '.#.'],
    '-': ['...', '...', '###', '...', '...'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    F: ['###', '#..', '##.', '#..', '#..'],
    L: ['#..', '#..', '#..', '#..', '###'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    E: ['###', '#..', '##.', '#..', '###'],
    T: ['###', '.#.', '.#.', '.#.', '.#.'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    N: ['#.#', '###', '###', '#.#', '#.#'],
  };
  // Rounding half to even, written here by comparing the two neighbouring integers instead of the sampler's fraction test.
  const halfEven = (x: number): number => {
    const low = Math.floor(x),
      high = Math.ceil(x);
    if (x - low < high - x) return low;
    if (x - low > high - x) return high;
    return low % 2 === 0 ? low : high;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists each number with its floor, ceiling, truncation, half-away-from-zero and half-to-even roundings (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('roundingmodes', seed),
        out = empty(),
        at = (column: number, row: number, fx: number, fy: number): number => {
          sample(
            p.left + (column + fx) * p.cell,
            p.top + (row + fy) * p.rowPitch,
            out,
          );
          return out.color;
        },
        // Read the text of a cell: characters are 4 pixels apart, centred on the cell.
        readCell = (column: number, row: number): string => {
          const background = at(column, row, 0.04, 0.1),
            dark = (x: number, y: number): boolean =>
              Math.abs(
                at(
                  column,
                  row,
                  0.5 + (x * p.digitPixel) / p.cell,
                  0.5 + ((y - 2) * p.digitPixel) / p.rowPitch,
                ) - background,
              ) > 0.4;
          // Count characters from the ink extent: 2 characters span pixels -3..3, 3 span -5..5, 4 span -7..7, 5 span -9..9.
          let reach = 0;
          for (let x = 1; x <= 7; x++)
            if ([0, 1, 2, 3, 4].some((y) => dark(x, y) || dark(-x, y)))
              reach = x;
          const count = (reach + 1) / 2;
          let text = '';
          for (let d = 0; d < count; d++) {
            const rows = [0, 1, 2, 3, 4].map((y) =>
                [0, 1, 2]
                  .map((x) =>
                    dark(-(2 * count - 1) + 4 * d + x, y) ? '#' : '.',
                  )
                  .join(''),
              ),
              found = Object.entries(shapes).find(([, shape]) =>
                shape.every((line, i) => line === rows[i]),
              );
            expect(found).toBeDefined();
            text += (found as [string, string[]])[0];
          }
          return text;
        };
      expect(Array.from({ length: 6 }, (_, c) => readCell(c, 0))).toEqual([
        'X',
        'FL',
        'CE',
        'TR',
        'RN',
        'RE',
      ]);
      const xs: number[] = [];
      for (let row = 1; row <= p.rows; row++) {
        const x = Number(readCell(0, row)),
          cells = [1, 2, 3, 4, 5].map((c) => Number(readCell(c, row)));
        expect(readCell(0, row)).toBe(x.toFixed(1));
        // Truncation toward zero is written with plain arithmetic here.
        const truncated = x < 0 ? -Math.floor(-x) : Math.floor(x),
          // Half away from zero: add 0.5 to the magnitude and drop the fraction.
          away = (x < 0 ? -1 : 1) * Math.floor(Math.abs(x) + 0.5);
        expect(cells[0]).toBe(Math.floor(x) + 0);
        expect(cells[1]).toBe(Math.ceil(x) + 0);
        expect(cells[2]).toBe(truncated === 0 ? 0 : truncated);
        expect(cells[3]).toBe(away === 0 ? 0 : away);
        expect(cells[4]).toBe(halfEven(x) + 0);
        // The last two columns are shaded exactly where x is half way between integers (where they can differ).
        const isHalf = Math.abs(x - Math.trunc(x)) === 0.5;
        expect(at(4, row, 0.04, 0.1) < 0.85).toBe(isHalf);
        expect(at(5, row, 0.04, 0.1) < 0.85).toBe(isHalf);
        expect(at(1, row, 0.04, 0.1) < 0.85).toBe(false);
        xs.push(x);
      }
      // Distinct values in ascending order drawn from the pool.
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
      expect(new Set(xs).size).toBe(p.rows);
      for (const x of xs) expect(p.pool).toContain(Math.round(x * 10));
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('roundingmodes', 0),
      b = createSurfaceSampler('roundingmodes', 7),
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

describe('binaryaddition: eight-bit sums with carries', () => {
  const p = proceduralMaterialPresets.binaryaddition;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '+': ['...', '.#.', '###', '.#.', '...'],
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'adds two numbers per problem and shows each carry above its column (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('binaryaddition', seed),
        out = empty(),
        at = (
          block: number,
          column: number,
          row: number,
          fx: number,
          fy: number,
        ): number => {
          sample(
            p.left + (column + fx) * p.cell,
            p.top + block * p.blockPitch + (row + fy) * p.rowPitch,
            out,
          );
          return out.color;
        },
        // Read one symbol: '' for an empty cell, otherwise the matching character.
        read = (block: number, column: number, row: number): string => {
          const pixel = row === 0 ? p.carryPixel : p.digitPixel,
            background = at(block, column, row, 0.04, 0.05),
            lines = [0, 1, 2, 3, 4].map((y) =>
              [0, 1, 2]
                .map((x) =>
                  Math.abs(
                    at(
                      block,
                      column,
                      row,
                      0.5 + ((x - 1) * pixel) / p.cell,
                      0.5 + ((y - 2) * pixel) / p.rowPitch,
                    ) - background,
                  ) > 0.25
                    ? '#'
                    : '.',
                )
                .join(''),
            );
          if (lines.every((line) => line === '...')) return '';
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === lines[i]),
          );
          expect(found).toBeDefined();
          return (found as [string, string[]])[0];
        };
      const sums = new Set<number>();
      for (let block = 0; block < p.problems; block++) {
        // Column c holds bit position 9 - c: column 1 is the carry out, column 9 the least significant bit.
        const bitAt = (row: number, position: number): number => {
          const symbol = read(block, 9 - position, row);
          expect(['0', '1']).toContain(symbol);
          return Number(symbol);
        };
        const a = Array.from({ length: 8 }, (_, j) => bitAt(1, j)),
          b = Array.from({ length: 8 }, (_, j) => bitAt(2, j)),
          s = Array.from({ length: 9 }, (_, j) => bitAt(4, j)),
          // The carry row holds the carry into positions 1 to 8; nothing comes into position 0.
          carry = [0, ...Array.from({ length: 8 }, (_, j) => bitAt(0, j + 1))];
        // Cells that must stay empty: the carry-out column of both operands, the carry over the units column, the sign column
        // on every row but the second operand's, and the sum's sign column.
        expect(read(block, 1, 1)).toBe('');
        expect(read(block, 1, 2)).toBe('');
        expect(read(block, 9, 0)).toBe('');
        expect(read(block, 0, 1)).toBe('');
        expect(read(block, 0, 2)).toBe('+');
        expect(read(block, 0, 4)).toBe('');
        // Full-adder rule at every position: a + b + carry in = sum bit + 2 * carry out.
        for (let j = 0; j < 8; j++) {
          const carryOut = j === 7 ? s[8] : carry[j + 1];
          expect(a[j] + b[j] + carry[j]).toBe(s[j] + 2 * carryOut);
        }
        const value = (bits: number[]): number =>
          bits.reduce((total, bit, j) => total + bit * 2 ** j, 0);
        expect(value(a) + value(b)).toBe(value(s));
        sums.add(value(a) * 1000 + value(b));
      }
      // The three problems are different from each other.
      expect(sums.size).toBe(p.problems);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('binaryaddition', 0),
      b = createSurfaceSampler('binaryaddition', 7),
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

describe('abeliansandpile: a stable sandpile', () => {
  const p = proceduralMaterialPresets.abeliansandpile,
    n = p.size;
  // The independent reference: topple every unstable cell once per round, all at the same time, on two buffers. The sampler
  // topples one cell at a time with a stack; the final pile of an abelian sandpile must not depend on that order.
  const settle = (grains: number): Uint8Array => {
    let current = new Int32Array(n * n),
      next = new Int32Array(n * n);
    current[((n - 1) / 2) * n + (n - 1) / 2] = grains;
    for (;;) {
      let toppled = false;
      next.fill(0);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const count = current[y * n + x],
            give = count >= 4 ? 1 : 0;
          next[y * n + x] += count - 4 * give;
          if (give === 0) continue;
          toppled = true;
          if (x > 0) next[y * n + x - 1]++;
          if (x < n - 1) next[y * n + x + 1]++;
          if (y > 0) next[(y - 1) * n + x]++;
          if (y < n - 1) next[(y + 1) * n + x]++;
        }
      [current, next] = [next, current];
      if (!toppled) break;
    }
    return Uint8Array.from(current);
  };
  const references = p.grains.map(settle);
  const observe = (seed: number): Uint8Array => {
    const sample = createSurfaceSampler('abeliansandpile', seed),
      out = empty(),
      cells = new Uint8Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        sample((x + 0.5) / n, (y + 0.5) / n, out);
        // The cell tone, less its small paper grain, is the nearest of the four tones.
        let best = 0;
        for (let k = 1; k < 4; k++)
          if (
            Math.abs(out.color - p.tones[k]) <
            Math.abs(out.color - p.tones[best])
          )
            best = k;
        cells[y * n + x] = best;
      }
    return cells;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'matches an independent simultaneous-toppling simulation and has the square symmetries (seed %i)',
    (seed) => {
      const cells = observe(seed),
        match = references.findIndex((reference) =>
          reference.every((value, i) => value === cells[i]),
        );
      expect(match).toBeGreaterThanOrEqual(0);
      // The dihedral symmetries of the square: mirror in both axes and across the diagonal.
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          expect(cells[y * n + x]).toBe(cells[y * n + (n - 1 - x)]);
          expect(cells[y * n + x]).toBe(cells[(n - 1 - y) * n + x]);
          expect(cells[y * n + x]).toBe(cells[x * n + y]);
        }
      // The pile is a stable sandpile that leaves the corners and the edge of the tile empty so that tiles do not touch.
      let corner = 0;
      for (let i = 0; i < n; i++)
        corner +=
          cells[i] +
          cells[(n - 1) * n + i] +
          cells[i * n] +
          cells[i * n + n - 1];
      expect(corner).toBe(0);
    },
  );

  it('uses all three grain counts across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 24; seed++) {
      const cells = observe(seed);
      used.add(
        references.findIndex((reference) =>
          reference.every((value, i) => value === cells[i]),
        ),
      );
    }
    expect([...used].sort()).toEqual([0, 1, 2]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('abeliansandpile', 0),
      b = createSurfaceSampler('abeliansandpile', 7),
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

describe('percolationclusters: open sites and their clusters', () => {
  const p = proceduralMaterialPresets.percolationclusters,
    n = p.size;
  const tones = [p.closedTone, p.smallTone, p.mediumTone, p.largestTone];
  const observe = (seed: number): number[] => {
    const sample = createSurfaceSampler('percolationclusters', seed),
      out = empty(),
      cells: number[] = [];
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        sample((x + 0.5) / n, (y + 0.5) / n, out);
        // 0 closed, 1 small cluster, 2 medium cluster, 3 largest cluster: the nearest tone, less the small paper grain.
        let best = 0;
        for (let k = 1; k < 4; k++)
          if (
            Math.abs(out.color - tones[k]) < Math.abs(out.color - tones[best])
          )
            best = k;
        cells.push(best);
      }
    return cells;
  };
  const openFraction = (cells: number[]): number =>
    cells.filter((cell) => cell > 0).length / (n * n);

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shades each cluster by its size, found again with a union-find (seed %i)',
    (seed) => {
      const cells = observe(seed),
        parent = Array.from({ length: n * n }, (_, i) => i),
        find = (i: number): number => {
          while (parent[i] !== i) {
            parent[i] = parent[parent[i]];
            i = parent[i];
          }
          return i;
        };
      // Join every open site to its open right and lower neighbour (no wrap-around at the tile edge).
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          if (cells[y * n + x] === 0) continue;
          if (x + 1 < n && cells[y * n + x + 1] > 0)
            parent[find(y * n + x)] = find(y * n + x + 1);
          if (y + 1 < n && cells[(y + 1) * n + x] > 0)
            parent[find(y * n + x)] = find((y + 1) * n + x);
        }
      const sizes = new Map<number, number>();
      for (let i = 0; i < n * n; i++)
        if (cells[i] > 0) sizes.set(find(i), (sizes.get(find(i)) ?? 0) + 1);
      const largest = Math.max(...sizes.values());
      for (let i = 0; i < n * n; i++) {
        if (cells[i] === 0) continue;
        const size = sizes.get(find(i)) as number;
        expect(cells[i]).toBe(
          size === largest ? 3 : size >= p.mediumSize ? 2 : 1,
        );
      }
      // Some cluster is largest, and the open fraction is close to one of the preset probabilities (within about 4.5 sigma).
      expect(largest).toBeGreaterThan(p.mediumSize);
      expect(
        Math.min(
          ...p.openings.map((opening) =>
            Math.abs(openFraction(cells) - opening),
          ),
        ),
      ).toBeLessThan(0.047);
    },
  );

  it('uses the lowest and the highest opening probability across seeds', () => {
    const nearest = new Set<number>();
    for (let seed = 0; seed < 24; seed++) {
      const fraction = openFraction(observe(seed));
      nearest.add(
        p.openings.indexOf(
          [...p.openings].sort(
            (a, b) => Math.abs(a - fraction) - Math.abs(b - fraction),
          )[0],
        ),
      );
    }
    expect(nearest.has(0)).toBe(true);
    expect(nearest.has(2)).toBe(true);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('percolationclusters', 0),
      b = createSurfaceSampler('percolationclusters', 7),
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

describe('gcdtable: greatest common divisors', () => {
  const p = proceduralMaterialPresets.gcdtable;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
  };
  // The largest number that divides both, found by trying every candidate rather than with Euclid's algorithm.
  const greatest = (a: number, b: number): number => {
    let best = 1;
    for (let d = 2; d <= Math.min(a, b); d++)
      if (a % d === 0 && b % d === 0) best = d;
    return best;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists the divisor of every row and column number, darker for larger ones (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('gcdtable', seed),
        out = empty(),
        at = (column: number, row: number, fx: number, fy: number): number => {
          sample(
            p.left + (column + fx) * p.cell,
            p.top + (row + fy) * p.cell,
            out,
          );
          return out.color;
        },
        tone = (column: number, row: number): number =>
          at(column, row, 0.12, 0.12),
        readCell = (column: number, row: number): number => {
          const background = tone(column, row),
            dark = (x: number, y: number): boolean =>
              Math.abs(
                at(
                  column,
                  row,
                  0.5 + (x * p.digitPixel) / p.cell,
                  0.5 + ((y - 2) * p.digitPixel) / p.cell,
                ) - background,
              ) > 0.25;
          let reach = 0;
          for (let x = 1; x <= 3; x++)
            if ([0, 1, 2, 3, 4].some((y) => dark(x, y) || dark(-x, y)))
              reach = x;
          const count = (reach + 1) / 2;
          expect(Number.isInteger(count)).toBe(true);
          let text = '';
          for (let d = 0; d < count; d++) {
            const lines = [0, 1, 2, 3, 4].map((y) =>
                [0, 1, 2]
                  .map((x) =>
                    dark(-(2 * count - 1) + 4 * d + x, y) ? '#' : '.',
                  )
                  .join(''),
              ),
              found = Object.entries(shapes).find(([, shape]) =>
                shape.every((line, i) => line === lines[i]),
              );
            expect(found).toBeDefined();
            text += (found as [string, string[]])[0];
          }
          return Number(text);
        };
      const columnStart = readCell(1, 0),
        rowStart = readCell(0, 1);
      expect(p.starts).toContain(columnStart);
      expect(p.starts).toContain(rowStart);
      let coprime = 0;
      for (let i = 1; i <= p.size; i++) {
        // Both header sequences count up by one.
        expect(readCell(i, 0)).toBe(columnStart + i - 1);
        expect(readCell(0, i)).toBe(rowStart + i - 1);
      }
      for (let row = 1; row <= p.size; row++)
        for (let column = 1; column <= p.size; column++) {
          const value = readCell(column, row),
            expected = greatest(rowStart + row - 1, columnStart + column - 1);
          expect(value).toBe(expected);
          // Cells with divisor 1 are the lightest; the others get darker as the divisor grows.
          expect(tone(column, row)).toBeCloseTo(
            expected === 1
              ? p.coprimeTone
              : p.divisorFloor + p.divisorRange / expected,
            1,
          );
          if (expected === 1) coprime++;
        }
      // Most cells of such a table are coprime pairs (the density of coprime pairs is 6 / pi^2, about 0.61).
      expect(coprime).toBeGreaterThan(0.4 * p.size * p.size);
      expect(coprime).toBeLessThan(0.8 * p.size * p.size);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('gcdtable', 0),
      b = createSurfaceSampler('gcdtable', 7),
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

describe('bitwiselogic: bit-by-bit logic on eight-bit numbers', () => {
  const p = proceduralMaterialPresets.bitwiselogic;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    N: ['##.', '#.#', '#.#', '#.#', '#.#'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    O: ['###', '#.#', '#.#', '#.#', '###'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  };
  // The definitions are written as truth tables here, not with the bit operators the sampler uses.
  const table: Record<string, number[][]> = {
    AND: [
      [0, 0],
      [0, 1],
    ],
    OR: [
      [0, 1],
      [1, 1],
    ],
    XOR: [
      [0, 1],
      [1, 0],
    ],
    NAND: [
      [1, 1],
      [1, 0],
    ],
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'applies each operation to every bit pair and labels the block with it (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('bitwiselogic', seed),
        out = empty(),
        at = (block: number, row: number, x: number, fy: number): number => {
          sample(
            x,
            p.top + block * p.blockPitch + (row + fy) * p.rowPitch,
            out,
          );
          return out.color;
        },
        // Read the characters of a cell whose horizontal extent is [left, left + width).
        readCell = (
          block: number,
          row: number,
          left: number,
          width: number,
          maxCount: number,
        ): string => {
          const centre = left + width / 2,
            background = at(block, row, left + 0.04 * width, 0.05),
            dark = (x: number, y: number): boolean =>
              Math.abs(
                at(
                  block,
                  row,
                  centre + x * p.digitPixel,
                  0.5 + ((y - 2) * p.digitPixel) / p.rowPitch,
                ) - background,
              ) > 0.25;
          let reach = 0;
          for (let x = 1; x <= 2 * maxCount - 1; x++)
            if ([0, 1, 2, 3, 4].some((y) => dark(x, y) || dark(-x, y)))
              reach = x;
          if (reach === 0) return '';
          const count = (reach + 1) / 2;
          expect(Number.isInteger(count)).toBe(true);
          let text = '';
          for (let d = 0; d < count; d++) {
            const lines = [0, 1, 2, 3, 4].map((y) =>
                [0, 1, 2]
                  .map((x) =>
                    dark(-(2 * count - 1) + 4 * d + x, y) ? '#' : '.',
                  )
                  .join(''),
              ),
              found = Object.entries(shapes).find(([, shape]) =>
                shape.every((line, i) => line === lines[i]),
              );
            expect(found).toBeDefined();
            text += (found as [string, string[]])[0];
          }
          return text;
        },
        bit = (block: number, row: number, column: number): number => {
          const text = readCell(
            block,
            row,
            p.left + p.labelCell + column * p.cell,
            p.cell,
            1,
          );
          expect(['0', '1']).toContain(text);
          return Number(text);
        };
      const seen: string[] = [];
      for (let block = 0; block < p.ops.length; block++) {
        // The letter O and the digit 0 are drawn the same, and labels hold no digits.
        const op = readCell(block, 1, p.left, p.labelCell, 4).replaceAll(
          '0',
          'O',
        );
        expect(p.ops).toContain(op);
        seen.push(op);
        // Only the second operand's row is labelled.
        expect(readCell(block, 0, p.left, p.labelCell, 4)).toBe('');
        expect(readCell(block, 3, p.left, p.labelCell, 4)).toBe('');
        let ones = 0;
        for (let column = 0; column < p.bits; column++) {
          const a = bit(block, 0, column),
            b = bit(block, 1, column),
            result = bit(block, 3, column);
          expect(result).toBe(table[op][a][b]);
          // The result row shades its 1 bits darker than its 0 bits.
          const centre = p.left + p.labelCell + (column + 0.5) * p.cell;
          expect(at(block, 3, centre - 0.45 * p.cell, 0.05) < 0.8).toBe(
            result === 1,
          );
          ones += result;
        }
        expect(ones).toBeLessThanOrEqual(p.bits);
      }
      // Every operation appears once, in a seed-dependent order.
      expect([...seen].sort()).toEqual([...p.ops].sort());
    },
  );

  it('orders the operations differently for different seeds', () => {
    const readOrder = (seed: number): string => {
      const sample = createSurfaceSampler('bitwiselogic', seed),
        out = empty(),
        keys: number[] = [];
      for (let block = 0; block < p.ops.length; block++) {
        // The label's ink pattern identifies the operation: count dark pixels of the label cell.
        let ink = 0;
        for (let y = 0; y < 40; y++)
          for (let x = 0; x < 120; x++) {
            sample(
              p.left + (x / 120) * p.labelCell,
              p.top + block * p.blockPitch + p.rowPitch + (y / 40) * p.rowPitch,
              out,
            );
            ink += Number(out.color < 0.5);
          }
        keys.push(ink);
      }
      return keys.join(',');
    };
    const orders = new Set<string>();
    for (let seed = 0; seed < 12; seed++) orders.add(readOrder(seed));
    expect(orders.size).toBeGreaterThan(2);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bitwiselogic', 0),
      b = createSurfaceSampler('bitwiselogic', 7),
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

describe('logisticbifurcation: long-run values of the logistic map', () => {
  const p = proceduralMaterialPresets.logisticbifurcation;
  const occupied = (seed: number): boolean[][] => {
    const sample = createSurfaceSampler('logisticbifurcation', seed),
      out = empty(),
      columns: boolean[][] = [];
    for (let column = 0; column < p.columns; column++) {
      const rows: boolean[] = [];
      for (let row = 0; row < p.rows; row++) {
        sample((column + 0.5) / p.columns, (row + 0.5) / p.rows, out);
        // One recorded value already darkens a cell by about 0.2; the paper grain moves the tone by less than 0.02.
        rows.push(out.color < p.paperTone - 0.1);
      }
      columns.push(rows);
    }
    return columns;
  };
  const rowOf = (x: number): number =>
    Math.min(p.rows - 1, Math.floor((1 - x) * p.rows));
  const rateOf = (window: readonly number[], column: number): number =>
    window[0] + ((column + 0.5) / p.columns) * (window[1] - window[0]);
  // The rows reached from the preset's start value, written with a differently ordered formula than the sampler's.
  const cycleRows = (r: number): Set<number> => {
    const rows = new Set<number>();
    let x = p.start;
    for (let step = 0; step < p.transient + p.recorded; step++) {
      x = r * x - r * x * x;
      if (step >= p.transient) rows.add(rowOf(x));
    }
    return rows;
  };
  const topRow = (rows: boolean[]): number => rows.indexOf(true);
  const bottomRow = (rows: boolean[]): number => rows.lastIndexOf(true);
  const identify = (columns: boolean[][]): number => {
    // The highest value the map ever reaches is r / 4, so for chaotic rates the topmost inked row says which rates are shown.
    const scores = p.windows.map((window) => {
      let hits = 0,
        total = 0;
      for (let column = 0; column < p.columns; column++) {
        const r = rateOf(window, column);
        if (r < 3.7) continue;
        total++;
        hits += Number(Math.abs(topRow(columns[column]) - rowOf(r / 4)) <= 1);
      }
      return total === 0 ? 0 : hits / total;
    });
    const best = scores.indexOf(Math.max(...scores));
    expect(scores[best]).toBeGreaterThan(0.95);
    return best;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows the attractor of the logistic map at every rate (seed %i)',
    (seed) => {
      const columns = occupied(seed),
        window = p.windows[identify(columns)];
      let cyclic = 0,
        cyclicMatches = 0,
        chaotic = 0,
        chaoticMatches = 0,
        threeCycle = 0;
      for (let column = 0; column < p.columns; column++) {
        const r = rateOf(window, column),
          rows = columns[column];
        if (r < 3.56) {
          // Fixed point and the first period doublings: the inked rows are exactly the rows of the cycle.
          const expected = cycleRows(r);
          cyclic++;
          cyclicMatches += Number(
            rows.every((inked, row) => inked === expected.has(row)),
          );
        } else if (r >= 3.835 && r <= 3.84) {
          // Inside the period-3 window the map settles on three values.
          const expected = cycleRows(r);
          expect(expected.size).toBe(3);
          expect(rows.every((inked, row) => inked === expected.has(row))).toBe(
            true,
          );
          threeCycle++;
        } else if (r >= 3.7) {
          // Chaotic rates fill the band between f(r / 4) and r / 4.
          chaotic++;
          chaoticMatches += Number(
            Math.abs(bottomRow(rows) - rowOf((r * r * (4 - r)) / 16)) <= 1,
          );
        }
      }
      if (cyclic > 0) expect(cyclicMatches / cyclic).toBeGreaterThan(0.97);
      expect(chaotic).toBeGreaterThan(20);
      expect(chaoticMatches / chaotic).toBeGreaterThan(0.9);
      if (window[0] <= 3.835 && window[1] >= 3.84)
        expect(threeCycle).toBeGreaterThan(0);
    },
  );

  it('uses all three rate ranges across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 24; seed++) used.add(identify(occupied(seed)));
    expect([...used].sort()).toEqual([0, 1, 2]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('logisticbifurcation', 0),
      b = createSurfaceSampler('logisticbifurcation', 7),
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

describe('burningship: smooth escape-time contours of the Burning Ship fractal', () => {
  const p = proceduralMaterialPresets.burningship;
  const fold = (t: number): number => 1 - Math.abs(2 * t - 1);

  // The tone a view predicts at a point: z -> (|Re z| + i |Im z|)^2 + c written as an explicit complex product.
  const predict = (
    view: (typeof p.views)[number],
    u: number,
    v: number,
  ): number => {
    const c = {
      re: view.x + view.extent * (2 * fold(u) - 1),
      im: view.y + view.extent * (2 * fold(v) - 1),
    };
    let z = { re: 0, im: 0 },
      steps = 0;
    while (steps < view.iterations && Math.hypot(z.re, z.im) <= p.bailout) {
      const w = { re: Math.abs(z.re), im: Math.abs(z.im) };
      z = {
        re: w.re * w.re - w.im * w.im + c.re,
        im: w.re * w.im + w.im * w.re + c.im,
      };
      steps++;
    }
    if (steps >= view.iterations) return p.insideTone;
    const nu =
        steps +
        1 -
        Math.log2(Math.log(Math.hypot(z.re, z.im)) / Math.log(p.bailout)),
      level = nu / (nu + p.scale);
    return (
      p.lowTone +
      (p.highTone - p.lowTone) * level +
      p.bandDepth * Math.cos((2 * Math.PI * nu) / p.bandPeriod)
    );
  };
  const agreementOf = (seed: number, n: number): number[] => {
    const sample = createSurfaceSampler('burningship', seed),
      out = empty(),
      agreement = p.views.map(() => 0);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const u = (x + 0.5) / n,
          v = (y + 0.5) / n;
        sample(u, v, out);
        p.views.forEach((view, i) => {
          agreement[i] += Number(
            Math.abs(out.color - predict(view, u, v)) < 0.02,
          );
        });
      }
    return agreement.map((count) => count / (n * n));
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'matches the smooth escape time of exactly one of the four views (seed %i)',
    (seed) => {
      const ranked = agreementOf(seed, 80).sort((a, b) => b - a);
      // The chosen view reproduces the rendering nearly everywhere (pixels on the fractal's edge can differ by one
      // iteration), and no other view comes close.
      expect(ranked[0]).toBeGreaterThan(0.97);
      expect(ranked[1]).toBeLessThan(0.8);
    },
  );

  it('shows every view across seeds and differs from the Mandelbrot set by the absolute values', () => {
    const views = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const agreement = agreementOf(seed, 24);
      views.add(agreement.indexOf(Math.max(...agreement)));
    }
    expect(views.size).toBe(p.views.length);
    // Seed-independent geometry: the orbit of c = -1.2 + 0.1i stays bounded in the Mandelbrot iteration but escapes once the
    // absolute values are taken, while c = 0.5 escapes and c = -0.5 stays in under both.
    const escapes = (re: number, im: number, folded: boolean): boolean => {
      let zr = 0,
        zi = 0;
      for (let step = 0; step < 200 && Math.hypot(zr, zi) <= 4; step++)
        [zr, zi] = [
          zr * zr - zi * zi + re,
          (folded ? 2 * Math.abs(zr * zi) : 2 * zr * zi) + im,
        ];
      return Math.hypot(zr, zi) > 4;
    };
    expect(escapes(0.5, 0, true)).toBe(true);
    expect(escapes(-0.5, 0, true)).toBe(false);
    expect(escapes(-1.2, 0.1, false)).toBe(false);
    expect(escapes(-1.2, 0.1, true)).toBe(true);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('burningship', 0),
      b = createSurfaceSampler('burningship', 7),
      one = empty(),
      two = empty();
    let invalid = 0,
      moved = 0,
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
        // Points on the fractal's edge can flip by one iteration when adding 1 changes the last bit of u, so a small share
        // of the samples may differ.
        moved += Number(Math.abs(two.color - one.color) > 1e-9);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(moved).toBeLessThan(10);
    expect(different).toBeGreaterThan(50);
  });
});

describe('modularpowers: powers modulo m', () => {
  const p = proceduralMaterialPresets.modularpowers;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
  };
  // The power by exponentiation by squaring, not by the repeated multiplication of the sampler.
  const power = (base: number, exponent: number, modulus: number): number => {
    let result = 1,
      square = base % modulus,
      rest = exponent;
    while (rest > 0) {
      if (rest % 2 === 1) result = (result * square) % modulus;
      square = (square * square) % modulus;
      rest = Math.floor(rest / 2);
    }
    return result % modulus;
  };
  const reader = (seed: number) => {
    const sample = createSurfaceSampler('modularpowers', seed),
      out = empty(),
      at = (column: number, row: number, fx: number, fy: number): number => {
        sample(
          p.left + (column + fx) * p.cell,
          p.top + (row + fy) * p.cell,
          out,
        );
        return out.color;
      },
      tone = (column: number, row: number): number =>
        at(column, row, 0.12, 0.12),
      readCell = (column: number, row: number): number => {
        const background = tone(column, row),
          dark = (x: number, y: number): boolean =>
            Math.abs(
              at(
                column,
                row,
                0.5 + (x * p.digitPixel) / p.cell,
                0.5 + ((y - 2) * p.digitPixel) / p.cell,
              ) - background,
            ) > 0.25;
        let reach = 0;
        for (let x = 1; x <= 3; x++)
          if ([0, 1, 2, 3, 4].some((y) => dark(x, y) || dark(-x, y))) reach = x;
        const count = (reach + 1) / 2;
        expect(Number.isInteger(count)).toBe(true);
        let text = '';
        for (let d = 0; d < count; d++) {
          const lines = [0, 1, 2, 3, 4].map((y) =>
              [0, 1, 2]
                .map((x) => (dark(-(2 * count - 1) + 4 * d + x, y) ? '#' : '.'))
                .join(''),
            ),
            found = Object.entries(shapes).find(([, shape]) =>
              shape.every((line, i) => line === lines[i]),
            );
          expect(found).toBeDefined();
          text += (found as [string, string[]])[0];
        }
        return Number(text);
      },
      // The modulus is the only value in the preset list that reproduces every body cell.
      modulus = (): number => {
        const matching = p.moduli.filter((candidate) => {
          for (let row = 1; row <= p.size; row++)
            for (let column = 1; column <= p.size; column++)
              if (
                readCell(column, row) !==
                power(p.firstBase + row - 1, column, candidate)
              )
                return false;
          return true;
        });
        expect(matching).toHaveLength(1);
        return matching[0];
      };
    return { tone, readCell, modulus };
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists a^k mod m and marks the ones and the bases sharing a factor with m (seed %i)',
    (seed) => {
      const { tone, readCell, modulus } = reader(seed);
      // The headers count the exponents 1 to 10 and the bases from firstBase.
      for (let i = 1; i <= p.size; i++) {
        expect(readCell(i, 0)).toBe(i);
        expect(readCell(0, i)).toBe(p.firstBase + i - 1);
      }
      const m = modulus();
      for (let row = 1; row <= p.size; row++) {
        const base = p.firstBase + row - 1;
        // A base shares a factor with the modulus when some number above 1 divides both.
        let shared = false;
        for (let d = 2; d <= base; d++)
          if (base % d === 0 && m % d === 0) shared = true;
        for (let column = 1; column <= p.size; column++) {
          const value = readCell(column, row);
          expect(tone(column, row)).toBeCloseTo(
            value === 1 ? p.oneTone : shared ? p.sharedFactorTone : p.plainTone,
            1,
          );
          // A power of a base that shares a factor with m can never be 1.
          if (shared) expect(value).not.toBe(1);
        }
      }
    },
  );

  it('uses every modulus of the preset across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 40; seed++) used.add(reader(seed).modulus());
    expect([...used].sort((a, b) => a - b)).toEqual(
      [...p.moduli].sort((a, b) => a - b),
    );
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('modularpowers', 0),
      b = createSurfaceSampler('modularpowers', 7),
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

describe('primefactors: integers written as products of primes', () => {
  const p = proceduralMaterialPresets.primefactors;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    x: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  };
  const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes every number as the product of its primes in ascending order (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('primefactors', seed),
        out = empty(),
        right = p.left + p.numberWidth,
        rowTop = (row: number): number => p.top + row * p.rowPitch,
        at = (u: number, row: number, k: number): number => {
          sample(
            u,
            rowTop(row) +
              p.rowPitch * (0.5 + ((k - 2) * p.digitPixel) / p.rowPitch),
            out,
          );
          return out.color;
        },
        // Decode the glyphs of one text whose pixel k starts at cellStart: returns the text or null when a slot is not a glyph.
        decode = (
          row: number,
          cellStart: number,
          count: number | null,
        ): { text: string; ink: number } | null => {
          const background = (() => {
              sample(cellStart + 0.003, rowTop(row) + 0.004, out);
              return out.color;
            })(),
            dark = (pixelX: number, k: number): boolean =>
              Math.abs(
                at(cellStart + (pixelX + 0.5) * p.digitPixel, row, k) -
                  background,
              ) > 0.25;
          let text = '',
            ink = 0;
          for (let slot = 0; count === null || slot < count; slot++) {
            const lines = [0, 1, 2, 3, 4].map((k) =>
              [0, 1, 2]
                .map((x) => (dark(4 * slot + x, k) ? '#' : '.'))
                .join(''),
            );
            if (count === null && lines.every((line) => line === '...')) break;
            const found = Object.entries(shapes).find(([, shape]) =>
              shape.every((line, i) => line === lines[i]),
            );
            if (!found) return null;
            text += found[0];
            ink += lines.join('').split('#').length - 1;
            if (slot > 20) return null;
          }
          return { text, ink };
        },
        numberOf = (row: number): number => {
          // The number is centred in its cell: try one and two digits and keep the decoding that accounts for all the ink.
          for (const count of [2, 1]) {
            const start =
                p.left + (p.numberWidth - (4 * count - 1) * p.digitPixel) / 2,
              decoded = decode(row, start, count);
            if (!decoded) continue;
            // All ink in the cell, found by looking at every pixel of the cell's strip, must belong to the glyphs.
            let total = 0;
            for (let k = 0; k < 5; k++)
              for (let x = -3; x < 4 * 2 + 4; x++) {
                sample(
                  start + (x + 0.5) * p.digitPixel,
                  rowTop(row) +
                    p.rowPitch * (0.5 + ((k - 2) * p.digitPixel) / p.rowPitch),
                  out,
                );
                const u = start + (x + 0.5) * p.digitPixel;
                if (
                  u > p.left + 0.004 &&
                  u < right - 0.004 &&
                  Math.abs(out.color - 0.9) > 0.3
                )
                  total++;
              }
            if (total === decoded.ink) return Number(decoded.text);
          }
          throw new Error('number not readable in row ' + row);
        };
      const numbers: number[] = [];
      for (let row = 0; row < p.rows; row++) {
        const n = numberOf(row),
          decoded = decode(row, right + 0.02, null);
        expect(decoded).not.toBeNull();
        const factors = (decoded as { text: string }).text
          .split('x')
          .map(Number);
        expect(factors.every(isPrime)).toBe(true);
        expect(factors).toEqual([...factors].sort((a, b) => a - b));
        expect(factors.reduce((product, factor) => product * factor, 1)).toBe(
          n,
        );
        // The prime rows (a single factor equal to the number) are the shaded ones.
        sample(p.left + 0.004, rowTop(row) + 0.004, out);
        expect(out.color < 0.85).toBe(isPrime(n));
        numbers.push(n);
      }
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      expect(new Set(numbers).size).toBe(p.rows);
      expect(Math.min(...numbers)).toBeGreaterThanOrEqual(p.lowest);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(p.highest);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('primefactors', 0),
      b = createSurfaceSampler('primefactors', 7),
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

describe('baseconversion: one number in four bases', () => {
  const p = proceduralMaterialPresets.baseconversion;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'],
    F: ['###', '#..', '##.', '#..', '#..'],
  };
  const edges = [
    p.left,
    ...p.widths.map(
      (_, i) =>
        p.left +
        p.widths.slice(0, i + 1).reduce((sum, width) => sum + width, 0),
    ),
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes each number in decimal, binary, octal and hexadecimal (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('baseconversion', seed),
        out = empty(),
        rowTop = (row: number): number => p.top + row * p.rowPitch,
        colorAt = (u: number, row: number, k: number): number => {
          sample(
            u,
            rowTop(row) +
              p.rowPitch * (0.5 + ((k - 2) * p.digitPixel) / p.rowPitch),
            out,
          );
          return out.color;
        },
        readCell = (row: number, column: number): string => {
          const start = edges[column] + p.indent,
            background = (() => {
              sample(edges[column] + 0.003, rowTop(row) + 0.004, out);
              return out.color;
            })(),
            dark = (x: number, k: number): boolean =>
              Math.abs(
                colorAt(start + (x + 0.5) * p.digitPixel, row, k) - background,
              ) > 0.25;
          let text = '';
          for (let slot = 0; slot < 12; slot++) {
            const lines = [0, 1, 2, 3, 4].map((k) =>
              [0, 1, 2]
                .map((x) => (dark(4 * slot + x, k) ? '#' : '.'))
                .join(''),
            );
            if (lines.every((line) => line === '...')) break;
            const found = Object.entries(shapes).find(([, shape]) =>
              shape.every((line, i) => line === lines[i]),
            );
            expect(found).toBeDefined();
            text += (found as [string, string[]])[0];
          }
          return text;
        };
      const numbers: number[] = [];
      for (let row = 0; row < p.rows; row++) {
        const [decimal, binary, octal, hexadecimal] = [0, 1, 2, 3].map(
            (column) => readCell(row, column),
          ),
          n = Number(decimal);
        expect(binary).toHaveLength(8);
        expect(octal).toHaveLength(3);
        expect(hexadecimal).toHaveLength(2);
        // Each text is read back with the digit value of its own base, independent of toString(base).
        const value = (text: string, base: number): number =>
          [...text].reduce(
            (total, digit) => total * base + '0123456789ABCDEF'.indexOf(digit),
            0,
          );
        expect(value(binary, 2)).toBe(n);
        expect(value(octal, 8)).toBe(n);
        expect(value(hexadecimal, 16)).toBe(n);
        expect(/^[01]+$/.test(binary)).toBe(true);
        expect(/^[0-7]+$/.test(octal)).toBe(true);
        // Hexadecimal cells that contain a letter are shaded darker than the row's own tone.
        sample(edges[3] + 0.003, rowTop(row) + 0.004, out);
        const rowTone = row % 2 === 1 ? p.stripeTone : p.paperTone;
        expect(out.color).toBeCloseTo(
          /[A-F]/.test(hexadecimal) ? p.letterTone : rowTone,
          1,
        );
        numbers.push(n);
      }
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      expect(new Set(numbers).size).toBe(p.rows);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(p.highest);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('baseconversion', 0),
      b = createSurfaceSampler('baseconversion', 7),
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

describe('caesarcipher: an alphabet and a message shifted by a fixed number', () => {
  const p = proceduralMaterialPresets.caesarcipher;
  const rows: Record<string, string[]> = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'],
    F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'],
    H: ['#.#', '#.#', '###', '#.#', '#.#'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    J: ['..#', '..#', '..#', '#.#', '.#.'],
    K: ['#.#', '#.#', '##.', '#.#', '#.#'],
    L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#.#', '###', '###', '#.#', '#.#'],
    N: ['##.', '#.#', '#.#', '#.#', '#.#'],
    O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'],
    Q: ['.#.', '#.#', '#.#', '###', '.##'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'],
    T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
    W: ['#.#', '#.#', '###', '###', '#.#'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
    Z: ['###', '..#', '.#.', '#..', '###'],
  };
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const reader = (seed: number) => {
    const sample = createSurfaceSampler('caesarcipher', seed),
      out = empty(),
      // The letter in one cell of a row, or '' when the cell is empty.
      readCell = (row: number, column: number): string => {
        sample(
          p.left + column * p.cell + 0.004,
          p.top + row * p.rowPitch + 0.004,
          out,
        );
        const background = out.color,
          lines = [0, 1, 2, 3, 4].map((y) =>
            [0, 1, 2]
              .map((x) => {
                sample(
                  p.left + (column + 0.5) * p.cell + (x - 1) * p.pixel,
                  p.top + (row + 0.5) * p.rowPitch + (y - 2) * p.pixel,
                  out,
                );
                return Math.abs(out.color - background) > 0.25 ? '#' : '.';
              })
              .join(''),
          );
        if (lines.every((line) => line === '...')) return '';
        const found = Object.entries(rows).find(([, shape]) =>
          shape.every((line, i) => line === lines[i]),
        );
        expect(found).toBeDefined();
        return (found as [string, string[]])[0];
      },
      readRow = (row: number): string => {
        let text = '';
        for (let column = 0; column < p.columns; column++) {
          const letter = readCell(row, column);
          if (letter === '') break;
          text += letter;
        }
        return text;
      };
    return { readCell, readRow };
  };

  it('draws twenty-six distinct letters', () => {
    expect(
      new Set(Object.values(rows).map((shape) => shape.join(''))).size,
    ).toBe(26);
  });

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes the cipher rows as the alphabet and the message shifted by one number (seed %i)',
    (seed) => {
      const { readRow } = reader(seed),
        plain = [readRow(0), readRow(3), readRow(6)],
        cipher = [readRow(1), readRow(4), readRow(7)];
      expect(plain[0]).toBe(alphabet.slice(0, 13));
      expect(plain[1]).toBe(alphabet.slice(13));
      expect(p.messages).toContain(plain[2]);
      // The shift is the distance from A to its cipher letter; every other letter must move by the same amount.
      const shift = alphabet.indexOf(cipher[0][0]);
      expect(p.shifts).toContain(shift);
      for (let i = 0; i < 3; i++) {
        expect(cipher[i]).toHaveLength(plain[i].length);
        for (let j = 0; j < plain[i].length; j++)
          expect(
            (alphabet.indexOf(cipher[i][j]) -
              alphabet.indexOf(plain[i][j]) +
              26) %
              26,
          ).toBe(shift);
      }
      // The spacer rows between the groups hold a thin rule, not letters: dark on the middle line, paper two pixels away.
      const out = empty(),
        sample = createSurfaceSampler('caesarcipher', seed);
      for (const row of [2, 5])
        for (let column = 0; column < p.columns; column++) {
          const x = p.left + (column + 0.5) * p.cell,
            y = p.top + (row + 0.5) * p.rowPitch;
          sample(x, y, out);
          expect(out.color).toBeLessThan(0.7);
          sample(x, y - 2 * p.pixel, out);
          expect(out.color).toBeGreaterThan(0.85);
          sample(x, y + 2 * p.pixel, out);
          expect(out.color).toBeGreaterThan(0.85);
        }
    },
  );

  it('uses every shift and more than one message across seeds', () => {
    const shifts = new Set<number>(),
      messages = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const { readCell, readRow } = reader(seed);
      shifts.add(alphabet.indexOf(readCell(1, 0)));
      messages.add(readRow(6));
    }
    expect([...shifts].sort((a, b) => a - b)).toEqual(
      [...p.shifts].sort((a, b) => a - b),
    );
    expect(messages.size).toBeGreaterThan(2);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('caesarcipher', 0),
      b = createSurfaceSampler('caesarcipher', 7),
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

describe('wordsquares: letter squares that read the same across and down', () => {
  const p = proceduralMaterialPresets.wordsquares;
  const shapes: Record<string, string[]> = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'],
    F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'],
    H: ['#.#', '#.#', '###', '#.#', '#.#'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    J: ['..#', '..#', '..#', '#.#', '.#.'],
    K: ['#.#', '#.#', '##.', '#.#', '#.#'],
    L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#.#', '###', '###', '#.#', '#.#'],
    N: ['##.', '#.#', '#.#', '#.#', '#.#'],
    O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'],
    Q: ['.#.', '#.#', '#.#', '###', '.##'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'],
    T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
    W: ['#.#', '#.#', '###', '###', '#.#'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
    Z: ['###', '..#', '.#.', '#..', '###'],
  };

  const origin = (1 - p.span) / 2;

  const decode = (seed: number, n: number): string[] | null => {
    const sample = createSurfaceSampler('wordsquares', seed),
      out = empty(),
      cell = p.span / n,
      result: string[] = [];
    for (let row = 0; row < n; row++) {
      let text = '';
      for (let column = 0; column < n; column++) {
        sample(
          origin + column * cell + 0.004,
          origin + row * cell + 0.004,
          out,
        );
        const background = out.color,
          lines = [0, 1, 2, 3, 4].map((y) =>
            [0, 1, 2]
              .map((x) => {
                sample(
                  origin + (column + 0.5) * cell + (x - 1) * p.pixel,
                  origin + (row + 0.5) * cell + (y - 2) * p.pixel,
                  out,
                );
                return Math.abs(out.color - background) > 0.25 ? '#' : '.';
              })
              .join(''),
          ),
          found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, k) => line === lines[k]),
          );
        if (!found) return null;
        text += found[0];
      }
      result.push(text);
    }
    return result;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'reads the same across and down and is one of the preset squares (seed %i)',
    (seed) => {
      // The side is whichever of the preset sizes decodes into letters everywhere.
      const decoded = [...new Set(p.squares.map((square) => square.length))]
        .map((n) => decode(seed, n))
        .filter((square) => square !== null) as string[][];
      expect(decoded).toHaveLength(1);
      const square = decoded[0];
      for (let i = 0; i < square.length; i++) {
        expect(square[i]).toHaveLength(square.length);
        for (let j = 0; j < square.length; j++)
          expect(square[i][j]).toBe(square[j][i]);
      }
      expect(new Set(square).size).toBe(square.length);
      expect(p.squares.map((candidate) => candidate.join(' '))).toContain(
        square.join(' '),
      );
      // The cells on the diagonal, the axis of the symmetry, are the shaded ones.
      const sample = createSurfaceSampler('wordsquares', seed),
        out = empty(),
        cell = p.span / square.length;
      for (let row = 0; row < square.length; row++)
        for (let column = 0; column < square.length; column++) {
          sample(
            origin + column * cell + 0.004,
            origin + row * cell + 0.004,
            out,
          );
          expect(out.color < 0.85).toBe(row === column);
        }
    },
  );

  it('keeps every preset square symmetric and uses every square across seeds', () => {
    for (const square of p.squares)
      for (let i = 0; i < square.length; i++)
        for (let j = 0; j < square.length; j++)
          expect(square[i][j]).toBe(square[j][i]);
    const used = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const sizes = [...new Set(p.squares.map((square) => square.length))];
      for (const n of sizes) {
        const square = decode(seed, n);
        if (square) used.add(square.join(' '));
      }
    }
    expect([...used].sort()).toEqual(
      p.squares.map((square) => square.join(' ')).sort(),
    );
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('wordsquares', 0),
      b = createSurfaceSampler('wordsquares', 7),
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

describe('vectorfieldarrows: arrows along a vector field', () => {
  const p = proceduralMaterialPresets.vectorfieldarrows,
    n = p.nodes,
    cell = 1 / n;
  // Each node's arrow: its direction (from the principal axis of the ink, signed towards the heavier half, which holds the
  // head), its length (the ink's extent along that axis) and its darkness.
  const measure = (seed: number, patch: number) => {
    const sample = createSurfaceSampler('vectorfieldarrows', seed),
      out = empty(),
      arrows: { angle: number; length: number; tone: number }[] = [];
    for (let row = 0; row < n; row++)
      for (let column = 0; column < n; column++) {
        const points: [number, number, number][] = [];
        let darkest = 1;
        for (let j = 0; j < patch; j++)
          for (let i = 0; i < patch; i++) {
            const dx = ((i + 0.5) / patch - 0.5) * cell,
              dy = ((j + 0.5) / patch - 0.5) * cell;
            sample((column + 0.5) * cell + dx, (row + 0.5) * cell + dy, out);
            if (out.color < p.paperTone - 0.15) {
              points.push([dx, dy, p.paperTone - out.color]);
              darkest = Math.min(darkest, out.color);
            }
          }
        const mean = [0, 1].map(
          (k) =>
            points.reduce((sum, point) => sum + point[k], 0) / points.length,
        );
        let sxx = 0,
          sxy = 0,
          syy = 0;
        for (const [x, y, w] of points) {
          sxx += w * (x - mean[0]) ** 2;
          sxy += w * (x - mean[0]) * (y - mean[1]);
          syy += w * (y - mean[1]) ** 2;
        }
        const axis = 0.5 * Math.atan2(2 * sxy, sxx - syy),
          ux = Math.cos(axis),
          uy = Math.sin(axis),
          projections = points.map(([x, y]) => x * ux + y * uy),
          // The head half (towards the tip) carries more ink than the shaft half: compare the ink on both sides of the node centre.
          forward = points.reduce(
            (sum, point, k) => sum + (projections[k] > 0 ? point[2] : 0),
            0,
          ),
          backward = points.reduce(
            (sum, point, k) => sum + (projections[k] < 0 ? point[2] : 0),
            0,
          ),
          angle = forward >= backward ? axis : axis + Math.PI;
        arrows.push({
          angle,
          length: Math.max(...projections) - Math.min(...projections),
          tone: darkest,
        });
      }
    return arrows;
  };
  const wrap = (angle: number): number =>
    Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)));

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'points every arrow along exactly one of the preset fields with a length that follows its strength (seed %i)',
    (seed) => {
      const arrows = measure(seed, 80),
        fits = p.fields.map(([a, b, c, d]) => {
          let good = 0,
            lengthGood = 0;
          const vectors = arrows.map((_, index) => {
              const x = ((index % n) + 0.5) / n - 0.5,
                y = (Math.floor(index / n) + 0.5) / n - 0.5;
              return [a * x + b * y, c * x + d * y] as const;
            }),
            strongest = Math.max(...vectors.map(([x, y]) => Math.hypot(x, y)));
          arrows.forEach((arrow, index) => {
            const [x, y] = vectors[index];
            good += Number(wrap(arrow.angle - Math.atan2(y, x)) < 0.15);
            const expected =
              cell *
              (p.shortest +
                (p.longest - p.shortest) * (Math.hypot(x, y) / strongest));
            lengthGood += Number(
              Math.abs(arrow.length - expected) < 0.1 * cell,
            );
          });
          return {
            good: good / arrows.length,
            lengthGood: lengthGood / arrows.length,
          };
        }),
        ranked = fits.map((fit) => fit.good).sort((x, y) => y - x);
      expect(ranked[0]).toBeGreaterThan(0.95);
      expect(ranked[1]).toBeLessThan(0.7);
      const best = fits.reduce((winner, fit) =>
        fit.good > winner.good ? fit : winner,
      );
      expect(best.lengthGood).toBeGreaterThan(0.95);
    },
  );

  it('uses every field across seeds and darkens the stronger arrows', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 24; seed++) {
      const arrows = measure(seed, 32),
        scores = p.fields.map(([a, b, c, d]) =>
          arrows.reduce((sum, arrow, index) => {
            const x = ((index % n) + 0.5) / n - 0.5,
              y = (Math.floor(index / n) + 0.5) / n - 0.5;
            return (
              sum +
              Number(
                wrap(arrow.angle - Math.atan2(c * x + d * y, a * x + b * y)) <
                  0.15,
              )
            );
          }, 0),
        );
      used.add(scores.indexOf(Math.max(...scores)));
      // The strongest arrow is darker than the weakest one.
      const lengths = arrows.map((arrow) => arrow.length),
        longest = lengths.indexOf(Math.max(...lengths)),
        shortest = lengths.indexOf(Math.min(...lengths));
      expect(arrows[longest].tone).toBeLessThan(arrows[shortest].tone);
    }
    expect([...used].sort()).toEqual([0, 1, 2, 3]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('vectorfieldarrows', 0),
      b = createSurfaceSampler('vectorfieldarrows', 7),
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

describe('fordcircles: Ford circles', () => {
  const p = proceduralMaterialPresets.fordcircles;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  // All fractions p/q in lowest terms with 0 <= p/q <= 1 and q <= limit, written here with a different loop order.
  const fractions = (limit: number): [number, number][] => {
    const list: [number, number][] = [];
    for (let q = 1; q <= limit; q++)
      for (let numerator = 0; numerator <= q; numerator++)
        if (gcd(q, numerator) === 1) list.push([numerator, q]);
    return list;
  };
  const circleOf = ([numerator, q]: [number, number]) => ({
    x: numerator / q,
    y: 1 / (2 * q * q),
    r: 1 / (2 * q * q),
  });
  // The tone class a point should have for a given limit: -1 when it is too close to an outline to tell.
  const expected = (limit: number, u: number, v: number): number => {
    const y = 1 - v;
    if (y < 0.012 || y > 0.988) return -1;
    let result = 0;
    for (const fraction of fractions(limit)) {
      const c = circleOf(fraction),
        distance = Math.hypot(u - c.x, y - c.y) - c.r;
      if (Math.abs(distance) < 0.006) return -1;
      if (distance < 0) result = fraction[1];
    }
    return result;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'fills exactly the Ford circles of one limit and touches neighbours at their tangent points (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('fordcircles', seed),
        out = empty(),
        biggest = Math.max(...p.limits),
        // Circle centres of every denominator up to the largest limit tell which circles exist: filled means present.
        present = (fraction: [number, number]): boolean => {
          const c = circleOf(fraction);
          sample(c.x, 1 - c.y, out);
          return out.color < 0.85;
        },
        matches = p.limits.filter((limit) =>
          fractions(biggest).every(
            (fraction) => present(fraction) === fraction[1] <= limit,
          ),
        );
      expect(matches).toHaveLength(1);
      const best = matches[0],
        n = 160;
      let counted = 0,
        agreed = 0;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n,
            v = (j + 0.5) / n;
          sample(u, v, out);
          // 0 for paper, otherwise the denominator whose fill tone is nearest.
          const observed =
              out.color > 0.85
                ? 0
                : p.tones.reduce(
                    (winner, tone, k) =>
                      Math.abs(out.color - tone) <
                      Math.abs(out.color - p.tones[winner])
                        ? k
                        : winner,
                    0,
                  ) + 1,
            want = expected(best, u, v);
          if (want === -1) continue;
          counted++;
          agreed += Number(want === observed);
        }
      expect(counted).toBeGreaterThan(0.9 * n * n);
      expect(agreed / counted).toBeGreaterThan(0.9995);
      const list = fractions(best);
      // Ford circles of Farey neighbours (|p q' - p' q| = 1) are tangent: the distance between the centres is the sum of the
      // radii; the dark outline passes through the point of tangency.
      let pairs = 0;
      for (const a of list)
        for (const b of list) {
          if (
            a[0] * b[1] >= b[0] * a[1] ||
            Math.abs(a[0] * b[1] - b[0] * a[1]) !== 1
          )
            continue;
          const ca = circleOf(a),
            cb = circleOf(b);
          expect(Math.hypot(ca.x - cb.x, ca.y - cb.y)).toBeCloseTo(
            ca.r + cb.r,
            12,
          );
          const tangent = {
            x: (ca.x * cb.r + cb.x * ca.r) / (ca.r + cb.r),
            y: (2 * ca.r * cb.r) / (ca.r + cb.r),
          };
          sample(tangent.x, 1 - tangent.y, out);
          expect(out.color).toBeLessThan(0.3);
          pairs++;
        }
      expect(pairs).toBeGreaterThan(5);
    },
  );

  it('uses every limit across seeds', () => {
    const used = new Set<number>(),
      sample = (seed: number): number => {
        const s = createSurfaceSampler('fordcircles', seed),
          out = empty();
        // The circle of 1/8 only exists for the limit of 8, and the circles of 1/5 and 1/7 for 6 and 8: look at their centres.
        const probe = (x: number, denominator: number): boolean => {
          s(x, 1 - 1 / (2 * denominator * denominator), out);
          return out.color < 0.85;
        };
        return probe(1 / 8, 8) ? 8 : probe(1 / 5, 5) ? 6 : 4;
      };
    for (let seed = 0; seed < 30; seed++) used.add(sample(seed));
    expect([...used].sort((a, b) => a - b)).toEqual(
      [...p.limits].sort((a, b) => a - b),
    );
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('fordcircles', 0),
      b = createSurfaceSampler('fordcircles', 7),
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

describe('mobiusgrid: a checkered grid carried through a Moebius map', () => {
  const p = proceduralMaterialPresets.mobiusgrid;
  const fold = (t: number): number => 1 - Math.abs(2 * t - 1);
  type Complex = { re: number; im: number };
  const mul = (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  });
  const add = (a: Complex, b: Complex): Complex => ({
    re: a.re + b.re,
    im: a.im + b.im,
  });
  const sub = (a: Complex, b: Complex): Complex => ({
    re: a.re - b.re,
    im: a.im - b.im,
  });
  const div = (a: Complex, b: Complex): Complex => {
    const norm = b.re * b.re + b.im * b.im;
    return {
      re: (a.re * b.re + a.im * b.im) / norm,
      im: (a.im * b.re - a.re * b.im) / norm,
    };
  };
  const modulus = (a: Complex): number => Math.hypot(a.re, a.im);

  // What map `index` predicts at (u, v): the distance in the w plane to the nearest grid line of the z plane and the parity
  // of the grid cell. z = f^-1(w) and the local scale |f'(z)| = |ad - bc| / |c z + d|^2 are written with complex values.
  const predict = (index: number, u: number, v: number) => {
    const [ar, ai, br, bi, cr, ci, dr, di] = p.maps[index],
      a = { re: ar, im: ai },
      b = { re: br, im: bi },
      c = { re: cr, im: ci },
      d = { re: dr, im: di },
      w = {
        re: p.extent * (2 * fold(u) - 1),
        im: p.extent * (2 * fold(v) - 1),
      },
      z = div(sub(mul(d, w), b), sub(a, mul(c, w))),
      derivative = modulus(
        div(
          sub(mul(a, d), mul(b, c)),
          mul(add(mul(c, z), d), add(mul(c, z), d)),
        ),
      ),
      gx = z.re / p.step,
      gy = z.im / p.step;
    return {
      distance:
        Math.min(Math.abs(gx - Math.round(gx)), Math.abs(gy - Math.round(gy))) *
        p.step *
        derivative,
      spacing: p.step * derivative,
      parity: (((Math.floor(gx) + Math.floor(gy)) % 2) + 2) % 2,
    };
  };
  const agreementOf = (seed: number, n: number): number[] => {
    const sample = createSurfaceSampler('mobiusgrid', seed),
      out = empty(),
      agreement = p.maps.map(() => 0);
    let counted = 0;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n,
          v = (j + 0.5) / n;
        sample(u, v, out);
        counted++;
        p.maps.forEach((_, k) => {
          const expected = predict(k, u, v);
          // Nothing is decided where the lines are packed closer than a few line widths, or within 0.006 of the soft edge of a line
          // (the edge softness is 0.01 wide).
          if (
            expected.spacing < 8 * p.lineHalf ||
            Math.abs(expected.distance - p.lineHalf) < 0.006
          ) {
            agreement[k]++;
            return;
          }
          const inked = out.color < 0.5;
          if (expected.distance < p.lineHalf) agreement[k] += Number(inked);
          else
            agreement[k] += Number(
              !inked &&
                Math.abs(
                  out.color -
                    (expected.parity === 0 ? p.paperTone : p.checkerTone),
                ) < 0.05,
            );
        });
      }
    return agreement.map((count) => count / counted);
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws the image of the square grid under exactly one of the preset maps (seed %i)',
    (seed) => {
      const ranked = agreementOf(seed, 128).sort((a, b) => b - a);
      expect(ranked[0]).toBeGreaterThan(0.995);
      expect(ranked[1]).toBeLessThan(0.9);
    },
  );

  it('uses every map across seeds and preserves the symmetry of the fold', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const agreement = agreementOf(seed, 40);
      used.add(agreement.indexOf(Math.max(...agreement)));
    }
    expect([...used].sort()).toEqual([0, 1, 2]);
    // The folded view is mirror symmetric about the tile's middle lines.
    const sample = createSurfaceSampler('mobiusgrid', 7),
      one = empty(),
      two = empty();
    for (let i = 0; i < 200; i++) {
      const u = (i + 0.31) / 200,
        v = 0.2137;
      sample(u, v, one);
      sample(1 - u, v, two);
      // The paper grain is not mirrored, so only the grain amplitude (0.03) separates the two sides.
      expect(two.color).toBeCloseTo(one.color, 1);
    }
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('mobiusgrid', 0),
      b = createSurfaceSampler('mobiusgrid', 1),
      one = empty(),
      two = empty();
    let invalid = 0,
      moved = 0,
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
        // Near the point where the map sends infinity the lines are so dense that the last bit of u + 1 can matter.
        moved += Number(Math.abs(two.color - one.color) > 1e-9);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(moved).toBeLessThan(10);
    expect(different).toBeGreaterThan(50);
  });
});

describe('dipolefieldlines: equipotentials and field lines of two line charges', () => {
  const p = proceduralMaterialPresets.dipolefieldlines;
  const fold = (t: number): number => 1 - Math.abs(2 * t - 1);

  // The complex function log((z - b) / (z - a)) has the potential as its real part and the angle difference as its
  // imaginary part, and the length of its derivative, 2 half / (r1 r2), is the common gradient length.
  const predict = (half: number, u: number, v: number) => {
    const x = p.extent * (2 * fold(u) - 1),
      y = p.extent * (2 * fold(v) - 1),
      r1 = Math.hypot(x + half, y),
      r2 = Math.hypot(x - half, y),
      // (z - b) / (z - a) with z - a = (x + half) + iy and z - b = (x - half) + iy.
      denominator = (x + half) ** 2 + y * y,
      quotientRe = ((x - half) * (x + half) + y * y) / denominator,
      quotientIm = (y * (x + half) - (x - half) * y) / denominator,
      potential = Math.log(Math.hypot(quotientRe, quotientIm)),
      angle = Math.atan2(quotientIm, quotientRe),
      gradient = (2 * half) / (r1 * r2),
      distanceToLevel = (value: number, step: number): number =>
        Math.abs(value - step * Math.round(value / step)) / gradient,
      potentialDistance = distanceToLevel(potential, p.potentialStep),
      fieldDistance = distanceToLevel(angle, p.fieldStep);
    return {
      potentialDistance,
      fieldDistance,
      positive: potential > 0,
      nearCharge: Math.min(r1, r2) < p.coreRadius + 0.02,
      spacing: Math.min(p.potentialStep, p.fieldStep) / gradient,
    };
  };
  const agreementOf = (seed: number, n: number): number[] => {
    const sample = createSurfaceSampler('dipolefieldlines', seed),
      out = empty(),
      agreement = p.separations.map(() => 0);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n,
          v = (j + 0.5) / n;
        sample(u, v, out);
        p.separations.forEach((half, k) => {
          const expected = predict(half, u, v);
          // Skip the charges' cores, places where lines are packed closer than 8 line widths, and the soft edges of lines.
          const soft = (distance: number): boolean =>
            Math.abs(distance - p.lineHalf) < 0.005;
          if (
            expected.nearCharge ||
            expected.spacing < 8 * p.lineHalf ||
            soft(expected.potentialDistance) ||
            soft(expected.fieldDistance)
          ) {
            agreement[k]++;
            return;
          }
          if (
            expected.potentialDistance < p.lineHalf ||
            expected.fieldDistance < p.lineHalf
          )
            agreement[k] += Number(out.color < 0.6);
          else
            agreement[k] += Number(
              Math.abs(
                out.color -
                  (expected.positive ? p.positiveTone : p.negativeTone),
              ) < 0.05,
            );
        });
      }
    return agreement.map((count) => count / (n * n));
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws the equipotentials and field lines of one of the preset separations (seed %i)',
    (seed) => {
      const ranked = agreementOf(seed, 128).sort((a, b) => b - a);
      expect(ranked[0]).toBeGreaterThan(0.995);
      // Neighbouring separations differ only in where the lines run, so the runner-up still agrees at most places.
      expect(ranked[0] - ranked[1]).toBeGreaterThan(0.05);
    },
  );

  it('uses every separation across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const agreement = agreementOf(seed, 48);
      used.add(agreement.indexOf(Math.max(...agreement)));
    }
    expect([...used].sort()).toEqual([0, 1, 2]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('dipolefieldlines', 0),
      b = createSurfaceSampler('dipolefieldlines', 1),
      one = empty(),
      two = empty();
    let invalid = 0,
      moved = 0,
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
        // Close to a charge the lines are so dense that the last bit of u + 1 can move a sample.
        moved += Number(Math.abs(two.color - one.color) > 1e-9);
        b(u, v, two);
        different += Number(two.color !== one.color);
      }
    }
    expect(moved).toBeLessThan(10);
    expect(different).toBeGreaterThan(50);
  });
});

describe('numberwords: numbers spelled out in English', () => {
  const p = proceduralMaterialPresets.numberwords;
  const letters: Record<string, string[]> = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'],
    F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'],
    H: ['#.#', '#.#', '###', '#.#', '#.#'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    J: ['..#', '..#', '..#', '#.#', '.#.'],
    K: ['#.#', '#.#', '##.', '#.#', '#.#'],
    L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#.#', '###', '###', '#.#', '#.#'],
    N: ['##.', '#.#', '#.#', '#.#', '#.#'],
    O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'],
    Q: ['.#.', '#.#', '#.#', '###', '.##'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'],
    T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
    W: ['#.#', '#.#', '###', '###', '#.#'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
    Z: ['###', '..#', '.#.', '#..', '###'],
  };
  const digitShapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    ' ': ['...', '...', '...', '...', '...'],
  };
  const shapes: Record<string, string[]> = { ...letters, ...digitShapes };
  // The English name of a number below 100, written here from three separate word lists.
  const ones = [
    '',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'SIX',
    'SEVEN',
    'EIGHT',
    'NINE',
  ];
  const teens = [
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN',
  ];
  const decades = [
    '',
    '',
    'TWENTY',
    'THIRTY',
    'FORTY',
    'FIFTY',
    'SIXTY',
    'SEVENTY',
    'EIGHTY',
    'NINETY',
  ];
  const name = (n: number): string => {
    if (n === 0) return 'ZERO';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return [decades[Math.floor(n / 10)], ones[n % 10]]
      .filter((part) => part !== '')
      .join(' ');
  };
  const right = p.left + p.numberWidth;

  it('spells all of 0 to 99 with letters of the font', () => {
    for (let n = 0; n <= p.highest; n++)
      for (const letter of name(n)) expect(shapes[letter]).toBeDefined();
    expect(name(0)).toBe('ZERO');
    expect(name(42)).toBe('FORTY TWO');
  });

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes each number and its English name, with names below twenty marked (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('numberwords', seed),
        out = empty(),
        rowTop = (row: number): number => p.top + row * p.rowPitch,
        readText = (row: number, cellLeft: number, slots: number): string => {
          const start = cellLeft + p.indent;
          sample(cellLeft + 0.003, rowTop(row) + 0.004, out);
          const background = out.color,
            lines = (slot: number) =>
              [0, 1, 2, 3, 4].map((k) =>
                [0, 1, 2]
                  .map((x) => {
                    sample(
                      start + (4 * slot + x + 0.5) * p.pixel,
                      rowTop(row) +
                        p.rowPitch * (0.5 + ((k - 2) * p.pixel) / p.rowPitch),
                      out,
                    );
                    return Math.abs(out.color - background) > 0.25 ? '#' : '.';
                  })
                  .join(''),
              );
          let text = '';
          for (let slot = 0; slot < slots; slot++) {
            // The letter O and the digit 0 are drawn differently, so exactly one character matches.
            const exact = Object.entries(shapes).filter(([, shape]) =>
              shape.every((line, i) => line === lines(slot)[i]),
            );
            expect(exact).toHaveLength(1);
            text += exact[0][0];
          }
          return text.replace(/ +$/, '');
        };
      const numbers: number[] = [];
      for (let row = 0; row < p.rows; row++) {
        const digits = readText(row, p.left, 3),
          words = readText(row, right, 24),
          n = Number(digits);
        expect(words).toBe(name(n));
        // Names below twenty (single words that are not built from a ten and a digit) mark their number cell.
        sample(p.left + 0.003, rowTop(row) + 0.004, out);
        expect(out.color < 0.85 && out.color > 0.6).toBe(n < 20);
        numbers.push(n);
      }
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      expect(new Set(numbers).size).toBe(p.rows);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(p.highest);
    },
  );

  it('marks exactly the numbers below twenty, including 19 and 20 next to each other', () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 150; seed++) {
      const sample = createSurfaceSampler('numberwords', seed),
        out = empty();
      for (let row = 0; row < p.rows; row++) {
        const top = p.top + row * p.rowPitch;
        sample(p.left + 0.003, top + 0.004, out);
        const marked = out.color < 0.85 && out.color > 0.6,
          background = out.color;
        // Read the digits of the number: the first digit's slot holds its top-left ink, so decode both slots.
        let n = 0;
        for (let slot = 0; slot < 2; slot++) {
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) => {
                sample(
                  p.left + p.indent + (4 * slot + x + 0.5) * p.pixel,
                  top + p.rowPitch * (0.5 + ((k - 2) * p.pixel) / p.rowPitch),
                  out,
                );
                return Math.abs(out.color - background) > 0.25 ? '#' : '.';
              })
              .join(''),
          );
          if (lines.every((line) => line === '...')) {
            // A one-digit number: the digit read so far was the whole number.
            break;
          }
          const digit = Object.entries(digitShapes).find(
            ([character, shape]) =>
              character !== ' ' && shape.every((line, i) => line === lines[i]),
          );
          expect(digit).toBeDefined();
          n = n * 10 + Number((digit as [string, string[]])[0]);
        }
        expect(marked).toBe(n < 20);
        seen.add(n);
      }
    }
    // Both sides of the boundary were drawn in some seed.
    expect(seen.has(19)).toBe(true);
    expect(seen.has(20)).toBe(true);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('numberwords', 0),
      b = createSurfaceSampler('numberwords', 7),
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

describe('sorobanabacus: soroban beads that show the printed number', () => {
  const p = proceduralMaterialPresets.sorobanabacus;
  const digitShapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
  };
  const rodPitch = p.frameWidth / p.rods;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows on its beads the same number as the digits printed below (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('sorobanabacus', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        numbers: string[] = [];
      for (let block = 0; block < p.abacuses; block++) {
        const top = p.top + block * p.blockPitch,
          beadAt = (rod: number, y: number): boolean =>
            colorAt(p.left + (rod + 0.5) * rodPitch, top + y) < 0.3;
        let beads = '',
          printed = '';
        for (let rod = 0; rod < p.rods; rod++) {
          // One heaven bead sits in one of its two slots; four earth beads fill four of the five slots below the beam.
          const upper = beadAt(rod, p.heavenFirst),
            lower = beadAt(rod, p.heavenSecond);
          expect(upper !== lower).toBe(true);
          const earth = [0, 1, 2, 3, 4].map((slot) =>
              beadAt(rod, p.earthFirst + slot * p.slotPitch),
            ),
            empty = earth.indexOf(false);
          expect(earth.filter((present) => !present)).toHaveLength(1);
          beads += String((lower ? 5 : 0) + empty);
          // The printed digit under this rod is a 3 x 5 glyph.
          const start =
              p.left +
              p.frameWidth / 2 -
              ((4 * p.rods - 1) / 2) * p.pixel +
              4 * rod * p.pixel,
            lines = [0, 1, 2, 3, 4].map((k) =>
              [0, 1, 2]
                .map((x) =>
                  colorAt(
                    start + (x + 0.5) * p.pixel,
                    top + p.labelCentre + (k - 2) * p.pixel,
                  ) < 0.3
                    ? '#'
                    : '.',
                )
                .join(''),
            ),
            found = Object.entries(digitShapes).find(([, shape]) =>
              shape.every((line, i) => line === lines[i]),
            );
          expect(found).toBeDefined();
          printed += (found as [string, string[]])[0];
        }
        expect(beads).toBe(printed);
        numbers.push(printed);
        // The frame ends below the beads: paper just beneath its bottom edge, at the frame side and in the middle.
        expect(colorAt(p.left, top + p.frameHeight + 0.03)).toBeGreaterThan(
          0.8,
        );
        expect(
          colorAt(p.left + p.frameWidth / 2, top + p.frameHeight + 0.01),
        ).toBeGreaterThan(0.8);
      }
      expect(new Set(numbers).size).toBe(p.abacuses);
    },
  );

  it('shows every digit from 0 to 9 on some rod across seeds', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 12; seed++) {
      const sample = createSurfaceSampler('sorobanabacus', seed),
        out = empty();
      for (let block = 0; block < p.abacuses; block++)
        for (let rod = 0; rod < p.rods; rod++) {
          const top = p.top + block * p.blockPitch,
            x = p.left + (rod + 0.5) * rodPitch,
            at = (y: number): boolean => {
              sample(x, top + y, out);
              return out.color < 0.3;
            },
            gap = [0, 1, 2, 3, 4].findIndex(
              (slot) => !at(p.earthFirst + slot * p.slotPitch),
            );
          seen.add(String((at(p.heavenSecond) ? 5 : 0) + gap));
        }
    }
    expect([...seen].sort()).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sorobanabacus', 0),
      b = createSurfaceSampler('sorobanabacus', 7),
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

describe('boxplots: five-number summaries drawn above their data', () => {
  const p = proceduralMaterialPresets.boxplots;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws each box, median and whiskers at the quartiles of the dots below it (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('boxplots', seed),
        out = empty(),
        step = 0.0004,
        // Dark runs along a horizontal line at height y, as [start, end] in u.
        runs = (y: number): [number, number][] => {
          const found: [number, number][] = [];
          let start = -1;
          for (let i = 0; i <= 2500; i++) {
            const u = i * step;
            sample(u, y, out);
            const dark = out.color < 0.5;
            if (dark && start < 0) start = u;
            if (!dark && start >= 0) {
              found.push([start, u - step]);
              start = -1;
            }
          }
          return found;
        };
      for (let panel = 0; panel < p.panels; panel++) {
        const top = p.top + panel * p.panelPitch,
          // The dots: runs on the two rows, each run's middle is a value.
          values = [...runs(top + p.dotRows[0]), ...runs(top + p.dotRows[1])]
            .map(([a, b]) => (a + b) / 2)
            .sort((a, b) => a - b);
        expect(values).toHaveLength(p.points);
        // Tukey's hinges for fifteen values: the median is the 8th, the quartiles are the medians of the 7 values below and above.
        const median = values[7],
          lower = values.slice(0, 7),
          upper = values.slice(8),
          q1 = lower[3],
          q3 = upper[3],
          centre = runs(top + p.boxCentre);
        // Whisker with the left outline of the box, the median line and the right outline with the other whisker.
        expect(centre).toHaveLength(3);
        const tolerance = 0.003;
        expect(Math.abs(centre[0][0] - (values[0] - p.lineHalf))).toBeLessThan(
          tolerance,
        );
        expect(Math.abs(centre[0][1] - (q1 + p.lineHalf))).toBeLessThan(
          tolerance,
        );
        expect(
          Math.abs((centre[1][0] + centre[1][1]) / 2 - median),
        ).toBeLessThan(tolerance);
        expect(Math.abs(centre[2][0] - (q3 - p.lineHalf))).toBeLessThan(
          tolerance,
        );
        expect(Math.abs(centre[2][1] - (values[14] + p.lineHalf))).toBeLessThan(
          tolerance,
        );
      }
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('boxplots', 0),
      b = createSurfaceSampler('boxplots', 7),
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

describe('stemandleaf: a stem-and-leaf plot with its median marked', () => {
  const p = proceduralMaterialPresets.stemandleaf;
  const digitShapes: string[][] = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  const stems = p.lastStem - p.firstStem + 1;

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists the leaves of every stem in order and marks the median value (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('stemandleaf', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        // The digit whose 3 x 5 glyph starts at pixel column x0 of row `row`, or null when the slot is empty.
        readDigit = (row: number, x0: number): number | null => {
          const centre = p.top + (row + 0.5) * p.rowPitch,
            lines = [0, 1, 2, 3, 4].map((k) =>
              [0, 1, 2]
                .map((j) =>
                  colorAt(
                    x0 + (j + 0.5) * p.pixel,
                    centre + (k - 2) * p.pixel,
                  ) < 0.3
                    ? '#'
                    : '.',
                )
                .join(''),
            );
          if (lines.every((line) => line === '...')) return null;
          const found = digitShapes.findIndex((shape) =>
            shape.every((line, i) => line === lines[i]),
          );
          expect(found).toBeGreaterThanOrEqual(0);
          return found;
        },
        leafStart = p.left + p.stemWidth + p.leafGap,
        values: number[] = [];
      const marked: number[] = [];
      for (let row = 0; row < stems; row++) {
        const stem = readDigit(
          row,
          p.left + p.stemWidth - p.stemGap - 3 * p.pixel,
        );
        expect(stem).toBe(p.firstStem + row);
        const leaves: number[] = [];
        for (let k = 0; k < 20; k++) {
          const leaf = readDigit(
            row,
            leafStart + 0.5 * (p.leafPitch - 3 * p.pixel) + k * p.leafPitch,
          );
          if (leaf === null) break;
          leaves.push(leaf);
          // The cell of the median leaf has a darker background, sampled at the top-left corner of the leaf's cell.
          const tone = colorAt(
            leafStart + k * p.leafPitch + 0.002,
            p.top + row * p.rowPitch + 0.004,
          );
          if (tone < 0.85) marked.push(10 * (p.firstStem + row) + leaf);
        }
        expect(leaves).toEqual([...leaves].sort((a, b) => a - b));
        for (const leaf of leaves) values.push(10 * (p.firstStem + row) + leaf);
      }
      expect(values).toHaveLength(p.count);
      // The median of an odd number of sorted values is the middle one, and exactly that leaf is marked.
      const sorted = [...values].sort((a, b) => a - b);
      expect(marked).toEqual([sorted[(p.count - 1) / 2]]);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(10);
      expect(Math.max(...values)).toBeLessThanOrEqual(99);
    },
  );

  it('puts more leaves on the middle stems than on the outer ones across seeds', () => {
    let outer = 0,
      middle = 0;
    for (let seed = 0; seed < 20; seed++) {
      const sample = createSurfaceSampler('stemandleaf', seed),
        out = empty();
      for (let row = 0; row < stems; row++) {
        const centre = p.top + (row + 0.5) * p.rowPitch,
          // The row's ink to the right of the bar: more leaves, more dark samples.
          ink = Array.from({ length: 200 }, (_, i) => {
            sample(
              p.left + p.stemWidth + p.leafGap + (i / 200) * 0.5,
              centre + (((i * 7) % 5) - 2) * p.pixel,
              out,
            );
            return out.color < 0.3 ? 1 : 0;
          }).reduce((sum: number, value) => sum + value, 0);
        if (row === 0 || row === stems - 1) outer += ink;
        else if (row >= 3 && row <= 5) middle += ink;
      }
    }
    expect(middle / 3).toBeGreaterThan(outer / 2);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('stemandleaf', 0),
      b = createSurfaceSampler('stemandleaf', 7),
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

describe('substitutionwords: rows produced by a letter substitution', () => {
  const p = proceduralMaterialPresets.substitutionwords;
  // The word of every row for a rule, applying the substitution with string replacement instead of the sampler's mapping.
  const wordsFor = (rule: (typeof p.rules)[number]): string[] => {
    const rows = ['0'];
    while (rows.length < rule.rows)
      rows.push(
        rows[rows.length - 1]
          .replace(/0/g, 'a')
          .replace(/1/g, rule.one)
          .replace(/a/g, rule.zero),
      );
    return rows;
  };

  // Rows read from the picture at cell centres: '1' dark, '0' mid grey, nothing past the end of the row.
  const decode = (
    seed: number,
    rule: (typeof p.rules)[number],
  ): string[] | null => {
    const sample = createSurfaceSampler('substitutionwords', seed),
      out = empty(),
      longest = wordsFor(rule)[rule.rows - 1].length,
      cell = p.width / longest,
      rows: string[] = [];
    for (let row = 0; row < rule.rows; row++) {
      let text = '';
      for (let column = 0; column < longest; column++) {
        sample(
          p.left + (column + 0.5) * cell,
          p.top + row * p.rowPitch + p.cellHeight / 2,
          out,
        );
        if (out.color < 0.3) text += '1';
        else if (out.color < 0.8) text += '0';
        else break;
      }
      rows.push(text);
    }
    return rows;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows each row as the previous row with every letter replaced, for exactly one rule (seed %i)',
    (seed) => {
      const matches = p.rules
        .map((rule, index) => ({
          index,
          same: decode(seed, rule)?.join('/') === wordsFor(rule).join('/'),
        }))
        .filter((entry) => entry.same);
      expect(matches).toHaveLength(1);
      const rule = p.rules[matches[0].index],
        rows = wordsFor(rule);
      // Known structure of the three rules, checked on the words that were read back.
      if (matches[0].index === 0) {
        // Fibonacci word: the lengths are Fibonacci numbers, each row is the previous one followed by the one before it,
        // and a 1 is never followed by another 1.
        expect(rows.map((row) => row.length).slice(0, 6)).toEqual([
          1, 2, 3, 5, 8, 13,
        ]);
        for (let i = 2; i < rows.length; i++)
          expect(rows[i]).toBe(rows[i - 1] + rows[i - 2]);
        for (const row of rows) expect(row).not.toContain('11');
      } else if (matches[0].index === 1) {
        // Thue-Morse: each row is the previous one followed by its complement, and there are no three equal letters in a row.
        for (let i = 1; i < rows.length; i++)
          expect(rows[i]).toBe(
            rows[i - 1] +
              [...rows[i - 1]]
                .map((letter) => (letter === '0' ? '1' : '0'))
                .join(''),
          );
        for (const row of rows) expect(row).not.toMatch(/000|111/);
      } else {
        // Period doubling: lengths double and no two 1s are adjacent.
        expect(rows.map((row) => row.length)).toEqual([1, 2, 4, 8, 16, 32, 64]);
        for (const row of rows) expect(row).not.toContain('11');
      }
      expect(rows[rule.rows - 1].length).toBeGreaterThan(30);
    },
  );

  it('uses every rule across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const index = p.rules.findIndex(
        (rule) => decode(seed, rule)?.join('/') === wordsFor(rule).join('/'),
      );
      expect(index).toBeGreaterThanOrEqual(0);
      used.add(index);
    }
    expect([...used].sort()).toEqual([0, 1, 2]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('substitutionwords', 0),
      b = createSurfaceSampler('substitutionwords', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('dicesumbars: how many ways two dice make each sum', () => {
  const p = proceduralMaterialPresets.dicesumbars;
  const digitShapes: string[][] = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  // Pairs of faces (a, b) of two n-sided dice with a given sum, counted by listing all n * n pairs.
  const waysOf = (n: number, sum: number): number => {
    let count = 0;
    for (let a = 1; a <= n; a++)
      for (let b = 1; b <= n; b++) if (a + b === sum) count++;
    return count;
  };

  // Read the bars for a number of sides: the number of squares per column and the sum printed under it, or null when the
  // picture does not fit that many columns.
  const read = (seed: number, n: number) => {
    const sample = createSurfaceSampler('dicesumbars', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      },
      columns = 2 * n - 1,
      pitch = p.width / columns,
      side = p.fill * pitch,
      stackPitch = p.stack * side,
      counts: number[] = [],
      sums: number[] = [],
      tones: number[] = [];
    for (let column = 0; column < columns; column++) {
      const centre = p.left + (column + 0.5) * pitch;
      let count = 0;
      while (
        count < 2 * n &&
        colorAt(centre, p.baseline - (count + 0.5) * stackPitch) < 0.7
      )
        count++;
      counts.push(count);
      tones.push(colorAt(centre, p.baseline - 0.5 * stackPitch));
      // The printed sum: one or two glyphs centred on the column; keep the reading in which every slot is a digit and no ink
      // lies outside the slots.
      let text = '';
      for (const length of [2, 1]) {
        const start = centre - ((4 * length - 1) / 2) * p.pixel,
          digits: number[] = [];
        for (let slot = 0; slot < length; slot++) {
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) =>
                colorAt(
                  start + (4 * slot + x + 0.5) * p.pixel,
                  p.labelTop + (k + 0.5) * p.pixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          digits.push(
            digitShapes.findIndex((shape) =>
              shape.every((line, i) => line === lines[i]),
            ),
          );
        }
        // A reading is right when all digits are found and the neighbouring slot (just past the text) is empty.
        const past = [0, 1, 2, 3, 4].some(
          (k) =>
            colorAt(
              start + (4 * length + 1.5) * p.pixel,
              p.labelTop + (k + 0.5) * p.pixel,
            ) < 0.3,
        );
        if (
          digits.every((digit) => digit >= 0) &&
          !past &&
          (length === 2 || digits[0] < 10)
        ) {
          text = digits.join('');
          break;
        }
      }
      sums.push(Number(text));
    }
    return { counts, sums, tones };
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'stacks one square per pair of faces for each sum under the sum itself (seed %i)',
    (seed) => {
      const fitting = p.sides.filter((n) => {
        const { counts } = read(seed, n);
        return counts.every((count, i) => count === waysOf(n, i + 2));
      });
      expect(fitting).toHaveLength(1);
      const n = fitting[0],
        { counts, tones } = read(seed, n);
      // The printed sums 2..2n: read where the label glyphs are centred (one-digit sums sit in the second slot).
      expect(counts).toEqual(
        Array.from({ length: 2 * n - 1 }, (_, i) => waysOf(n, i + 2)),
      );
      expect(Math.max(...counts)).toBe(n);
      // The most likely sum (n + 1) is the darker column.
      tones.forEach((tone, i) => expect(tone < 0.3).toBe(counts[i] === n));
      // The totals are symmetric and add up to every pair of faces.
      expect(counts.reduce((sum, count) => sum + count, 0)).toBe(n * n);
    },
  );

  it('uses every die size across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const fitting = p.sides.filter((n) =>
        read(seed, n).counts.every((count, i) => count === waysOf(n, i + 2)),
      );
      expect(fitting).toHaveLength(1);
      used.add(fitting[0]);
    }
    expect([...used].sort()).toEqual([...p.sides].sort());
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('dicesumbars', 0),
      b = createSurfaceSampler('dicesumbars', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('binaryheaptree: a complete binary tree that satisfies the heap property', () => {
  const p = proceduralMaterialPresets.binaryheaptree;
  const digitShapes: string[][] = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  const nodes = 2 ** p.levels - 1;
  // Centre of the node in slot i: the slots of a level are consecutive, so level = number of bits of i + 1 minus one.
  const centreOf = (slot: number): [number, number] => {
    let level = 0;
    while (slot + 1 >= 2 ** (level + 1)) level++;
    const index = slot + 1 - 2 ** level;
    return [
      p.left + (p.width * (index + 0.5)) / 2 ** level,
      p.top + level * p.levelPitch,
    ];
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts a two-digit value in every node so that each parent beats both children (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('binaryheaptree', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        values: number[] = [];
      for (let slot = 0; slot < nodes; slot++) {
        const [cx, cy] = centreOf(slot),
          start = cx - ((4 * 2 - 1) / 2) * p.pixel;
        let text = '';
        for (let d = 0; d < 2; d++) {
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) =>
                colorAt(
                  start + (4 * d + x + 0.5) * p.pixel,
                  cy + (k - 2) * p.pixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          const digit = digitShapes.findIndex((shape) =>
            shape.every((line, i) => line === lines[i]),
          );
          expect(digit).toBeGreaterThanOrEqual(0);
          text += digit;
        }
        values.push(Number(text));
      }
      expect(new Set(values).size).toBe(nodes);
      for (const value of values) {
        expect(value).toBeGreaterThanOrEqual(p.lowest);
        expect(value).toBeLessThanOrEqual(p.highest);
      }
      // Min-heap: every parent is smaller than its children; max-heap: larger. Exactly one of them holds.
      let minHeap = true,
        maxHeap = true;
      for (let slot = 1; slot < nodes; slot++) {
        const parent = values[Math.floor((slot - 1) / 2)];
        if (parent > values[slot]) minHeap = false;
        if (parent < values[slot]) maxHeap = false;
      }
      expect(minHeap !== maxHeap).toBe(true);
      // The root holds the extreme value and its node is shaded darker than the others; an edge joins every child to its parent.
      expect(values[0]).toBe(
        minHeap ? Math.min(...values) : Math.max(...values),
      );
      expect(
        colorAt(centreOf(0)[0] - p.nodeRadius * 0.8, centreOf(0)[1]),
      ).toBeLessThan(
        colorAt(centreOf(1)[0] - p.nodeRadius * 0.8, centreOf(1)[1]) - 0.1,
      );
      for (let slot = 1; slot < nodes; slot++) {
        const [cx, cy] = centreOf(slot),
          [px, py] = centreOf(Math.floor((slot - 1) / 2)),
          // The middle of the segment, which lies between the two nodes since they are more than two radii apart.
          mid = [(cx + px) / 2, (cy + py) / 2];
        expect(Math.hypot(cx - px, cy - py)).toBeGreaterThan(2 * p.nodeRadius);
        expect(colorAt(mid[0], mid[1])).toBeLessThan(0.5);
      }
    },
  );

  it('uses both min-heaps and max-heaps across seeds', () => {
    const kinds = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const sample = createSurfaceSampler('binaryheaptree', seed),
        out = empty(),
        [cx, cy] = centreOf(0),
        readValue = (slotCentre: [number, number]): number => {
          let text = '';
          const start = slotCentre[0] - ((4 * 2 - 1) / 2) * p.pixel;
          for (let d = 0; d < 2; d++) {
            const lines = [0, 1, 2, 3, 4].map((k) =>
              [0, 1, 2]
                .map((x) => {
                  sample(
                    start + (4 * d + x + 0.5) * p.pixel,
                    slotCentre[1] + (k - 2) * p.pixel,
                    out,
                  );
                  return out.color < 0.3 ? '#' : '.';
                })
                .join(''),
            );
            text += digitShapes.findIndex((shape) =>
              shape.every((line, i) => line === lines[i]),
            );
          }
          return Number(text);
        },
        root = readValue([cx, cy]),
        child = readValue(centreOf(1));
      kinds.add(root < child ? 'min' : 'max');
    }
    expect([...kinds].sort()).toEqual(['max', 'min']);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('binaryheaptree', 0),
      b = createSurfaceSampler('binaryheaptree', 7),
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

describe('bubblesortpasses: the rows of bubble sort', () => {
  const p = proceduralMaterialPresets.bubblesortpasses;
  const digitShapes: string[][] = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  // One pass of bubble sort written with a while loop and a running index.
  const onePass = (row: number[]): number[] => {
    const next = row.slice();
    let i = 0;
    while (i < next.length - 1) {
      if (next[i] > next[i + 1]) {
        const larger = next[i];
        next[i] = next[i + 1];
        next[i + 1] = larger;
      }
      i++;
    }
    return next;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows each row as one bubble-sort pass applied to the row above, with the settled right end shaded (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('bubblesortpasses', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        matrix: number[][] = [];
      for (let row = 0; row < p.size; row++) {
        const cells: number[] = [];
        for (let column = 0; column < p.size; column++) {
          const cx = p.left + (column + 0.5) * p.cell,
            cy = p.top + (row + 0.5) * p.rowPitch,
            lines = [0, 1, 2, 3, 4].map((k) =>
              [0, 1, 2]
                .map((x) =>
                  colorAt(cx + (x - 1) * p.pixel, cy + (k - 2) * p.pixel) < 0.3
                    ? '#'
                    : '.',
                )
                .join(''),
            ),
            digit = digitShapes.findIndex((shape) =>
              shape.every((line, i) => line === lines[i]),
            );
          expect(digit).toBeGreaterThanOrEqual(1);
          cells.push(digit);
          // Cells in the last `row` columns have reached their final place and are darker; the others are paler.
          const corner = colorAt(
            p.left + column * p.cell + 0.012,
            p.top + row * p.rowPitch + 0.012,
          );
          expect(corner < 0.75).toBe(column >= p.size - row);
        }
        matrix.push(cells);
      }
      // The first row is some order of 1..size, and each later row is one pass applied to the one before.
      expect([...matrix[0]].sort((a, b) => a - b)).toEqual(
        Array.from({ length: p.size }, (_, i) => i + 1),
      );
      for (let row = 1; row < p.size; row++)
        expect(matrix[row]).toEqual(onePass(matrix[row - 1]));
      // After size - 1 passes the row is sorted.
      expect(matrix[p.size - 1]).toEqual(
        Array.from({ length: p.size }, (_, i) => i + 1),
      );
      // Settled cells hold their final values: the largest ones, in order.
      for (let row = 1; row < p.size; row++)
        for (let column = p.size - row; column < p.size; column++)
          expect(matrix[row][column]).toBe(column + 1);
    },
  );

  it('starts from different orders for different seeds', () => {
    const firstRows = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const sample = createSurfaceSampler('bubblesortpasses', seed),
        out = empty(),
        cells: number[] = [];
      for (let column = 0; column < p.size; column++) {
        const cx = p.left + (column + 0.5) * p.cell,
          cy = p.top + 0.5 * p.rowPitch,
          lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) => {
                sample(cx + (x - 1) * p.pixel, cy + (k - 2) * p.pixel, out);
                return out.color < 0.3 ? '#' : '.';
              })
              .join(''),
          );
        cells.push(
          digitShapes.findIndex((shape) =>
            shape.every((line, i) => line === lines[i]),
          ),
        );
      }
      firstRows.add(cells.join(''));
    }
    expect(firstRows.size).toBeGreaterThan(15);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('bubblesortpasses', 0),
      b = createSurfaceSampler('bubblesortpasses', 7),
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

describe('graphcoloring: a graph whose vertices are shaded by a proper colouring', () => {
  const p = proceduralMaterialPresets.graphcoloring;
  // The fewest colours that properly colour a graph with n vertices and the given adjacency, by trying 1, 2, 3, ... colours.
  const chromaticNumber = (n: number, adjacent: boolean[][]): number => {
    for (let colours = 1; colours <= n; colours++) {
      const assignment = new Array<number>(n).fill(-1);
      const place = (vertex: number): boolean => {
        if (vertex === n) return true;
        for (let colour = 0; colour < colours; colour++) {
          if (
            assignment.every(
              (other, index) => other !== colour || !adjacent[vertex][index],
            )
          ) {
            assignment[vertex] = colour;
            if (place(vertex + 1)) return true;
            assignment[vertex] = -1;
          }
        }
        return false;
      };
      if (place(0)) return colours;
    }
    return n;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows a graph read back from the picture with a proper colouring that uses as few colours as possible (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('graphcoloring', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        // A vertex is there when its ring (dark) is found at eight angles around the vertex radius.
        hasVertex = (x: number, y: number): boolean =>
          Array.from({ length: 8 }, (_, k) => (k * Math.PI) / 4).every(
            (angle) =>
              colorAt(
                x + p.vertexRadius * Math.cos(angle),
                y + p.vertexRadius * Math.sin(angle),
              ) < 0.35,
          ),
        fitting = p.graphs.filter((graph) =>
          graph.vertices.every(([x, y]) => hasVertex(x, y)),
        );
      // The preset whose vertices are all drawn is unique, and no other vertex is drawn: the picture is that graph.
      expect(fitting).toHaveLength(1);
      const graph = fitting[0],
        n = graph.vertices.length,
        adjacent = Array.from({ length: n }, () =>
          new Array<boolean>(n).fill(false),
        );
      // An edge is drawn between two vertices when five points along the segment between their circles are all dark.
      for (let a = 0; a < n; a++)
        for (let b = a + 1; b < n; b++) {
          const [ax, ay] = graph.vertices[a],
            [bx, by] = graph.vertices[b],
            length = Math.hypot(bx - ax, by - ay),
            inset = (p.vertexRadius + 0.02) / length,
            drawn = [0, 1, 2, 3, 4].every((k) => {
              const t = inset + ((1 - 2 * inset) * k) / 4;
              return colorAt(ax + t * (bx - ax), ay + t * (by - ay)) < 0.4;
            });
          adjacent[a][b] = adjacent[b][a] = drawn;
        }
      // The tone at each vertex's centre tells its colour class: the nearest of the class tones.
      const classes = graph.vertices.map(([x, y]) => {
        const tone = colorAt(x, y);
        return p.classTones.reduce(
          (best, candidate, k) =>
            Math.abs(tone - candidate) < Math.abs(tone - p.classTones[best])
              ? k
              : best,
          0,
        );
      });
      let edges = 0;
      for (let a = 0; a < n; a++)
        for (let b = a + 1; b < n; b++)
          if (adjacent[a][b]) {
            edges++;
            // No edge joins two vertices of the same class.
            expect(classes[a]).not.toBe(classes[b]);
          }
      expect(edges).toBeGreaterThanOrEqual(n);
      // The colouring uses as few colours as the graph needs.
      expect(new Set(classes).size).toBe(chromaticNumber(n, adjacent));
    },
  );

  it('uses all three graphs across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const sample = createSurfaceSampler('graphcoloring', seed),
        out = empty();
      // The number of vertices is 8, 10 or 6: probe a vertex position that exists in just one of the graphs.
      const probe = (x: number, y: number): boolean =>
        Array.from({ length: 8 }, (_, k) => (k * Math.PI) / 4).every(
          (angle) => {
            sample(
              x + p.vertexRadius * Math.cos(angle),
              y + p.vertexRadius * Math.sin(angle),
              out,
            );
            return out.color < 0.35;
          },
        );
      used.add(
        probe(0.5, 0.5)
          ? 2
          : probe(p.graphs[0].vertices[0][0], p.graphs[0].vertices[0][1])
            ? 0
            : 1,
      );
    }
    expect([...used].sort()).toEqual([0, 1, 2]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('graphcoloring', 0),
      b = createSurfaceSampler('graphcoloring', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('runlengthrows: rows of cells with their run-length code', () => {
  const p = proceduralMaterialPresets.runlengthrows;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    W: ['#.#', '#.#', '###', '###', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
  };
  // The run-length code of a list of cells: each run's length followed by W for 0 and B for 1, written with a index loop.
  const encode = (bits: number[]): string => {
    let code = '',
      start = 0;
    for (let i = 1; i <= bits.length; i++)
      if (i === bits.length || bits[i] !== bits[start]) {
        code += String(i - start) + (bits[start] === 1 ? 'B' : 'W');
        start = i;
      }
    return code;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes under every row of cells its run-length code (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('runlengthrows', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        codes = new Set<string>();
      for (let block = 0; block < p.blocks; block++) {
        const top = p.top + block * p.blockPitch,
          // Black cells are dark, white ones pale grey and the paper between rows lighter still.
          bits = Array.from({ length: p.cells }, (_, column) =>
            colorAt(p.left + (column + 0.5) * p.cell, top + p.cellHeight / 2) <
            0.4
              ? 1
              : 0,
          );
        let text = '';
        for (let slot = 0; slot < 30; slot++) {
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) =>
                colorAt(
                  p.left + (4 * slot + x + 0.5) * p.pixel,
                  top + p.textTop + (k + 0.5) * p.pixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          if (lines.every((line) => line === '...')) break;
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === lines[i]),
          );
          expect(found).toBeDefined();
          text += (found as [string, string[]])[0];
        }
        expect(text).toBe(encode(bits));
        // Every run but possibly the last has a length between the shortest and the longest allowed.
        const lengths = [...text.matchAll(/(\d+)[WB]/g)].map((match) =>
          Number(match[1]),
        );
        expect(lengths.reduce((sum, length) => sum + length, 0)).toBe(p.cells);
        lengths.slice(0, -1).forEach((length) => {
          expect(length).toBeGreaterThanOrEqual(p.shortest);
          expect(length).toBeLessThanOrEqual(p.longest);
        });
        codes.add(text);
      }
      expect(codes.size).toBeGreaterThan(p.blocks - 2);
    },
  );

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('runlengthrows', 0),
      b = createSurfaceSampler('runlengthrows', 7),
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

describe('isbn10checks: ISBN-10 numbers with valid check digits', () => {
  const p = proceduralMaterialPresets.isbn10checks;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    '-': ['...', '...', '###', '...', '...'],
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists ISBN-10 numbers whose weighted digit sum is a multiple of 11 (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('isbn10checks', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        numbers = new Set<string>();
      for (let row = 0; row < p.rows; row++) {
        const centre = p.top + (row + 0.5) * p.rowPitch;
        let text = '';
        for (let slot = 0; slot < 13; slot++) {
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) =>
                colorAt(
                  p.left + (4 * slot + x + 0.5) * p.pixel,
                  centre + (k - 2) * p.pixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === lines[i]),
          );
          expect(found).toBeDefined();
          text += (found as [string, string[]])[0];
        }
        // Beyond the thirteenth character there is nothing more.
        for (let k = 0; k < 5; k++)
          expect(
            colorAt(
              p.left + (4 * 13 + 1.5) * p.pixel,
              centre + (k - 2) * p.pixel,
            ),
          ).toBeGreaterThan(0.8);
        // Group - publisher - title - check: 1, 3, 5 and 1 characters.
        expect(text).toMatch(/^\d-\d{3}-\d{5}-[\dX]$/);
        const digits = text
          .replace(/-/g, '')
          .split('')
          .map((character) => (character === 'X' ? 10 : Number(character)));
        // 10 d1 + 9 d2 + ... + 1 d10 must be a multiple of 11.
        expect(
          digits.reduce((sum, digit, i) => sum + (10 - i) * digit, 0) % 11,
        ).toBe(0);
        // The check digit's cell (the last character) is darker than the row around it.
        expect(
          colorAt(p.left + 4 * 12 * p.pixel + 0.001, centre - 0.03),
        ).toBeLessThan(
          colorAt(p.left + 4 * 11 * p.pixel + 0.001, centre - 0.03) - 0.05,
        );
        numbers.add(text);
      }
      expect(numbers.size).toBe(p.rows);
    },
  );

  it('writes an X as the check digit for some numbers across seeds', () => {
    let withX = 0;
    for (let seed = 0; seed < 40; seed++) {
      const sample = createSurfaceSampler('isbn10checks', seed),
        out = empty();
      for (let row = 0; row < p.rows; row++) {
        // The X glyph has ink in its top-left and top-right corners and in its middle, unlike every digit.
        const centre = p.top + (row + 0.5) * p.rowPitch,
          at = (x: number, y: number): boolean => {
            sample(
              p.left + (4 * 12 + x + 0.5) * p.pixel,
              centre + (y - 2) * p.pixel,
              out,
            );
            return out.color < 0.3;
          };
        if (at(0, 0) && at(2, 0) && at(1, 2) && !at(1, 0) && !at(0, 2)) withX++;
      }
    }
    expect(withX).toBeGreaterThan(10);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('isbn10checks', 0),
      b = createSurfaceSampler('isbn10checks', 7),
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

describe('projectilearcs: shots at several angles and their safety parabola', () => {
  const p = proceduralMaterialPresets.projectilearcs;
  // The path of a shot with v^2 / g = range: x(t) = sqrt(range) cos(a) t and y(t) = sqrt(range) sin(a) t - t^2 / 2 (g = 1),
  // which lands at t = 2 sqrt(range) sin(a), i.e. at x = range sin(2a).
  const pathPoints = (
    range: number,
    degrees: number,
    count: number,
  ): [number, number][] => {
    const a = (degrees * Math.PI) / 180,
      flight = 2 * Math.sqrt(range) * Math.sin(a);
    return Array.from({ length: count + 1 }, (_, i) => {
      const t = (flight * i) / count;
      return [
        Math.sqrt(range) * Math.cos(a) * t,
        Math.sqrt(range) * Math.sin(a) * t - (t * t) / 2,
      ];
    });
  };
  // Screen position of a point at distance x from the middle line (to the right) and height y above the ground of band 0.
  const screen = (x: number, y: number): [number, number] => [
    0.5 + x,
    p.ground - y,
  ];

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws every shot as a parabola from the middle and the envelope that touches them (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('projectilearcs', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        // The range is the one for which the top of every path (at half its flight) is drawn.
        matching = p.ranges.filter((range) =>
          p.angles.every((degrees) => {
            const top = pathPoints(range, degrees, 2)[1];
            return colorAt(...screen(top[0], top[1])) < 0.4;
          }),
        );
      expect(matching).toHaveLength(1);
      const range = matching[0];
      // Every point along each path, on both sides of the middle, is dark.
      for (const degrees of p.angles)
        for (const [x, y] of pathPoints(range, degrees, 60).slice(1, -1)) {
          expect(colorAt(...screen(x, y))).toBeLessThan(0.4);
          expect(colorAt(...screen(-x, y))).toBeLessThan(0.4);
        }
      // The maximum range is at 45 degrees and the paths land at range * sin(2 angle): the last point is on the ground line.
      const landings = p.angles.map(
        (degrees) => pathPoints(range, degrees, 2)[2][0],
      );
      expect(Math.max(...landings)).toBeCloseTo(
        range * Math.sin(Math.PI / 2),
        10,
      );
      // The safety parabola y = range / 2 - x^2 / (2 range) lies above every path and touches it at one point.
      const envelope = (x: number): number => range / 2 - (x * x) / (2 * range);
      for (const degrees of p.angles)
        for (const [x, y] of pathPoints(range, degrees, 40))
          expect(envelope(x) - y).toBeGreaterThan(-1e-12);
      for (let i = 1; i < 20; i++) {
        const x = (range * i) / 20;
        expect(colorAt(...screen(x, envelope(x)))).toBeLessThan(0.75);
      }
      // Away from every line the picture is paper: a grid of points whose distance to all lines exceeds 0.012 is pale.
      const lines: [number, number][] = [];
      for (const degrees of p.angles)
        for (const [x, y] of pathPoints(range, degrees, 300))
          lines.push([x, y]);
      for (let i = 0; i <= 300; i++)
        lines.push([(range * i) / 300, envelope((range * i) / 300)]);
      for (let i = 0; i <= 300; i++) lines.push([(range * i) / 300, 0]);
      let checked = 0;
      for (let j = 0; j < 50; j++)
        for (let i = 0; i < 50; i++) {
          const u = (i + 0.5) / 50,
            v = (j + 0.5) / 50,
            x = Math.abs(u - 0.5),
            offset = p.ground - v,
            y = offset - p.pitch * Math.floor(offset / p.pitch);
          let nearest = Infinity;
          for (const [lx, ly] of lines)
            nearest = Math.min(
              nearest,
              Math.hypot(x - lx, y - ly),
              Math.hypot(x - lx, y - ly - p.pitch),
              Math.hypot(x - lx, y - ly + p.pitch),
            );
          if (nearest > 0.012) {
            expect(colorAt(u, v)).toBeGreaterThan(0.85);
            checked++;
          }
        }
      expect(checked).toBeGreaterThan(1500);
    },
  );

  it('uses all three ranges across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const sample = createSurfaceSampler('projectilearcs', seed),
        out = empty();
      // The top of the 45 degree path sits at x = range / 2, height range / 4.
      const index = p.ranges.findIndex((range) => {
        sample(0.5 + range / 2, p.ground - range / 4, out);
        return out.color < 0.4;
      });
      expect(index).toBeGreaterThanOrEqual(0);
      used.add(index);
    }
    expect([...used].sort()).toEqual([0, 1, 2]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('projectilearcs', 0),
      b = createSurfaceSampler('projectilearcs', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('sternbrocottree: fractions in a Stern-Brocot or Calkin-Wilf tree', () => {
  const p = proceduralMaterialPresets.sternbrocottree;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '/': ['..#', '..#', '.#.', '#..', '#..'],
  };
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  // Stern-Brocot: all fractions of a level are found by the mediant rule on the sorted list of the fractions so far
  // (with 0/1 and 1/0 as the ends). Calkin-Wilf: the children of a/b are a/(a+b) and (a+b)/b.
  const sternBrocot = (levels: number): string[][] => {
    const result: string[][] = [];
    let sequence: [number, number][] = [
      [0, 1],
      [1, 0],
    ];
    for (let level = 0; level < levels; level++) {
      const next: [number, number][] = [sequence[0]],
        added: string[] = [];
      for (let i = 0; i + 1 < sequence.length; i++) {
        const mediant: [number, number] = [
          sequence[i][0] + sequence[i + 1][0],
          sequence[i][1] + sequence[i + 1][1],
        ];
        added.push(mediant[0] + '/' + mediant[1]);
        next.push(mediant, sequence[i + 1]);
      }
      result.push(added);
      sequence = next;
    }
    return result;
  };
  const calkinWilf = (levels: number): string[][] => {
    const result: string[][] = [['1/1']];
    for (let level = 1; level < levels; level++)
      result.push(
        result[level - 1].flatMap((text) => {
          const [a, b] = text.split('/').map(Number);
          return [a + '/' + (a + b), a + b + '/' + b];
        }),
      );
    return result;
  };
  const decode = (seed: number): string[][] => {
    const sample = createSurfaceSampler('sternbrocottree', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      };
    return Array.from({ length: p.levels }, (_, level) => {
      const centre = (level + 0.5) * p.pitch;
      return Array.from({ length: 2 ** level }, (_, node) => {
        const middle = (node + 0.5) / 2 ** level;
        let text = '';
        // Every fraction in the first four levels has one-digit parts, so it is three characters (11 pixels) centred on its node.
        for (let slot = 0; slot < 3; slot++) {
          const left = middle - 5.5 * p.pixel + slot * 4 * p.pixel;
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) =>
                colorAt(
                  left + (x + 0.5) * p.pixel,
                  centre + (k - 2) * p.pixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === lines[i]),
          );
          if (found) text += found[0];
        }
        return text;
      });
    });
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes the fractions of a Stern-Brocot or Calkin-Wilf tree level by level (seed %i)',
    (seed) => {
      const picture = decode(seed),
        expectedSB = sternBrocot(p.levels),
        expectedCW = calkinWilf(p.levels);
      expect(sternBrocot(p.levels)[0]).toEqual(['1/1']);
      expect([
        JSON.stringify(expectedSB),
        JSON.stringify(expectedCW),
      ]).toContain(JSON.stringify(picture));
      for (const row of picture)
        for (const text of row) {
          const [a, b] = text.split('/').map(Number);
          expect(gcd(a, b)).toBe(1);
        }
      expect(picture.map((row) => row.length)).toEqual([1, 2, 4, 8]);
    },
  );

  it('shows both trees across seeds and the links between a fraction and its two children', () => {
    const kinds = new Set<string>();
    for (let seed = 0; seed < 30; seed++)
      kinds.add(JSON.stringify(decode(seed)[2]));
    expect(kinds.size).toBe(2);
    const sample = createSurfaceSampler('sternbrocottree', 0),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      };
    // Each link runs from below the parent text to above a child; its midpoint is a mid-grey line, and the middle of the
    // gap between sibling links is paper.
    for (let level = 0; level + 1 < p.levels; level++)
      for (let node = 0; node < 2 ** level; node++) {
        const parentX = (node + 0.5) / 2 ** level,
          startY = (level + 0.5) * p.pitch + p.gap,
          endY = (level + 1.5) * p.pitch - p.gap;
        for (const side of [-1, 1]) {
          const childX = parentX + side / 2 ** (level + 2);
          for (const t of [0.15, 0.5, 0.85]) {
            const colour = colorAt(
              parentX + (childX - parentX) * t,
              startY + (endY - startY) * t,
            );
            expect(colour).toBeGreaterThan(0.3);
            expect(colour).toBeLessThan(0.65);
          }
        }
        expect(colorAt(parentX, (level + 1) * p.pitch)).toBeGreaterThan(0.85);
      }
    // The last level has no links below it.
    expect(
      colorAt(
        (0 + 0.5) / 8 - 0.02,
        (p.levels - 1) * p.pitch + 0.5 * p.pitch + 0.05,
      ),
    ).toBeGreaterThan(0.85);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sternbrocottree', 0),
      b = createSurfaceSampler('sternbrocottree', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('cycloidcusps: epicycloids and hypocycloids with k cusps', () => {
  const p = proceduralMaterialPresets.cycloidcusps;
  type Shape = { cx: number; cy: number; k: number; epi: boolean };
  const shapesFor = (lastEpi: boolean): Shape[] =>
    Array.from({ length: 9 }, (_, index) => {
      const row = Math.floor(index / 3),
        column = index % 3;
      return {
        cx: (column + 0.5) / 3,
        cy: (row + 0.5) / 3,
        k:
          row === 0
            ? column + 1
            : row === 1
              ? column + 3
              : (lastEpi ? p.lastEpi : p.lastHypo)[column],
        epi: row === 0 || (row === 2 && lastEpi),
      };
    });
  // Pen on a circle of radius r rolling on (epicycloid) or in (hypocycloid) a fixed circle of radius R = k r, in complex form:
  // epi: (R + r) e^{it} - r e^{i (R + r) t / r}; hypo: (R - r) e^{it} + r e^{-i (R - r) t / r}.
  const curvePoint = (
    { cx, cy, k, epi }: Shape,
    turn: number,
    t: number,
  ): [number, number] => {
    const r = p.extent / (epi ? k + 2 : k),
      R = k * r,
      re = epi
        ? (R + r) * Math.cos(t) - r * Math.cos(((R + r) / r) * t)
        : (R - r) * Math.cos(t) + r * Math.cos(((R - r) / r) * t),
      im = epi
        ? (R + r) * Math.sin(t) - r * Math.sin(((R + r) / r) * t)
        : (R - r) * Math.sin(t) - r * Math.sin(((R - r) / r) * t);
    return [
      cx + re * Math.cos(turn) - im * Math.sin(turn),
      cy + re * Math.sin(turn) + im * Math.cos(turn),
    ];
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws each curve and its fixed circle, and nothing else (seed %i)',
    (seed) => {
      const sample = createSurfaceSampler('cycloidcusps', seed),
        out = empty(),
        colorAt = (u: number, v: number): number => {
          sample(u, v, out);
          return out.color;
        },
        onCurves = (shapes: Shape[], turn: number): boolean =>
          shapes.every((shape) =>
            Array.from({ length: 48 }, (_, i) =>
              curvePoint(shape, turn, (2 * Math.PI * (i + 0.5)) / 48),
            ).every(([u, v]) => colorAt(u, v) < 0.4),
          ),
        matches: [boolean, number][] = [];
      for (const lastEpi of [true, false])
        for (const turn of p.turns)
          if (onCurves(shapesFor(lastEpi), turn)) matches.push([lastEpi, turn]);
      expect(matches).toHaveLength(1);
      const [lastEpi, turn] = matches[0],
        shapes = shapesFor(lastEpi),
        lines: [number, number][] = [];
      for (const shape of shapes) {
        const own: [number, number][] = Array.from({ length: 720 }, (_, i) =>
          curvePoint(shape, turn, (2 * Math.PI * i) / 720),
        );
        lines.push(...own);
        // The fixed circle (radius k r) is a mid-grey ring: sampled at angles where no curve is within 0.02.
        const radius =
          shape.k * (p.extent / (shape.epi ? shape.k + 2 : shape.k));
        let sampled = 0;
        for (let i = 0; i < 72; i++) {
          const angle = (2 * Math.PI * (i + 0.25)) / 72,
            u = shape.cx + radius * Math.cos(angle),
            v = shape.cy + radius * Math.sin(angle);
          if (own.every(([lx, ly]) => Math.hypot(u - lx, v - ly) > 0.02)) {
            expect(colorAt(u, v)).toBeGreaterThan(0.5);
            expect(colorAt(u, v)).toBeLessThan(0.75);
            sampled++;
          }
        }
        expect(sampled).toBeGreaterThan(0);
      }
      // Every curve has k cusps on its fixed circle: the points at t = 2 pi j / k are at distance k r from the cell centre.
      for (const shape of shapes)
        for (let j = 0; j < shape.k; j++) {
          const [u, v] = curvePoint(shape, turn, (2 * Math.PI * j) / shape.k);
          expect(Math.hypot(u - shape.cx, v - shape.cy)).toBeCloseTo(
            shape.k * (p.extent / (shape.epi ? shape.k + 2 : shape.k)),
            10,
          );
          expect(colorAt(u, v)).toBeLessThan(0.4);
        }
      // Away from every curve and ring the picture is paper.
      const rings = shapes.map((shape) => ({
        ...shape,
        radius: shape.k * (p.extent / (shape.epi ? shape.k + 2 : shape.k)),
      }));
      let checked = 0;
      for (let j = 0; j < 60; j++)
        for (let i = 0; i < 60; i++) {
          const u = (i + 0.5) / 60,
            v = (j + 0.5) / 60;
          let nearest = Infinity;
          for (const [lx, ly] of lines)
            nearest = Math.min(nearest, Math.hypot(u - lx, v - ly));
          for (const ring of rings)
            nearest = Math.min(
              nearest,
              Math.abs(Math.hypot(u - ring.cx, v - ring.cy) - ring.radius),
            );
          if (nearest > 0.012) {
            expect(colorAt(u, v)).toBeGreaterThan(0.85);
            checked++;
          }
        }
      expect(checked).toBeGreaterThan(2400);
    },
  );

  it('shows both kinds of last row and all rotations across seeds', () => {
    const variants = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const sample = createSurfaceSampler('cycloidcusps', seed),
        out = empty();
      // Cusp of the last row's first curve: epicycloid with k = 4 or hypocycloid with k = 6, both at t = 0.
      const keys: string[] = [];
      for (const lastEpi of [true, false])
        p.turns.forEach((turn, index) => {
          const shape = shapesFor(lastEpi)[6],
            [u, v] = curvePoint(shape, turn, 0);
          sample(u, v, out);
          if (out.color < 0.4) keys.push(`${lastEpi}:${index}`);
        });
      // The cusp points of several combinations can coincide; the combination is one of the listed ones.
      expect(keys.length).toBeGreaterThan(0);
      variants.add(keys.join('|'));
    }
    expect(variants.size).toBeGreaterThanOrEqual(6);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('cycloidcusps', 0),
      b = createSurfaceSampler('cycloidcusps', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('zeckendorfrows: numbers as sums of non-neighbouring Fibonacci numbers', () => {
  const p = proceduralMaterialPresets.zeckendorfrows;
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
  };
  // The Fibonacci weights, least significant bit last: 1, 2, 3, 5, 8, 13, 21, 34.
  const weights = [34, 21, 13, 8, 5, 3, 2, 1];
  // Every bit pattern without two neighbouring ones, by the number it adds up to: found by trying all 256 patterns.
  const patterns = new Map<number, string>();
  for (let mask = 0; mask < 256; mask++) {
    const bits = mask.toString(2).padStart(8, '0');
    if (!bits.includes('11')) {
      const sum = weights.reduce(
        (total, weight, i) => total + (bits[i] === '1' ? weight : 0),
        0,
      );
      expect(patterns.has(sum)).toBe(false);
      patterns.set(sum, bits);
    }
  }

  const decode = (seed: number): string[] => {
    const sample = createSurfaceSampler('zeckendorfrows', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      },
      rows: string[] = [];
    for (let column = 0; column < 2; column++)
      for (let row = 0; row < p.rows; row++) {
        const centre = p.top + (row + 0.5) * p.rowPitch;
        let text = '';
        // A character is a digit glyph, or blank when it has no ink at all; the second slot (index 2) is always blank.
        for (let slot = 0; slot < 11; slot++) {
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) =>
                colorAt(
                  p.columnLeft[column] + (4 * slot + x + 0.5) * p.pixel,
                  centre + (k - 2) * p.pixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          if (lines.every((line) => line === '...')) text += ' ';
          else {
            const found = Object.entries(shapes).find(([, shape]) =>
              shape.every((line, i) => line === lines[i]),
            );
            expect(found).toBeDefined();
            text += (found as [string, string[]])[0];
          }
        }
        rows.push(text);
      }
    return rows;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists 24 consecutive numbers with their Zeckendorf digits (seed %i)',
    (seed) => {
      const rows = decode(seed),
        first = Number(rows[0].slice(0, 2));
      expect(first).toBeGreaterThanOrEqual(1);
      expect(first).toBeLessThanOrEqual(p.firstMax);
      rows.forEach((text, index) => {
        expect(text[2]).toBe(' ');
        expect(Number(text.slice(0, 2))).toBe(first + index);
        expect(text.slice(3)).toBe(patterns.get(first + index));
        // The digits really add up to the number, and no two neighbouring digits are both 1.
        expect(
          weights.reduce(
            (total, weight, i) => total + (text[3 + i] === '1' ? weight : 0),
            0,
          ),
        ).toBe(first + index);
        expect(text.slice(3)).not.toContain('11');
      });
    },
  );

  it('starts at different numbers for different seeds', () => {
    const starts = new Set<number>();
    for (let seed = 0; seed < 60; seed++)
      starts.add(Number(decode(seed)[0].slice(0, 2)));
    expect(starts.size).toBeGreaterThan(15);
    expect(Math.min(...starts)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...starts)).toBeLessThanOrEqual(p.firstMax);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('zeckendorfrows', 0),
      b = createSurfaceSampler('zeckendorfrows', 7),
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

describe('ferrersdiagrams: the partitions of 7 as boxes', () => {
  const p = proceduralMaterialPresets.ferrersdiagrams;
  // Independent list of the partitions of 7: every composition of 7 (one bit per gap between seven units), its parts sorted
  // from large to small, duplicates removed.
  const partitionsOfSeven = (): string[] => {
    const found = new Set<string>();
    for (let mask = 0; mask < 1 << 6; mask++) {
      const parts: number[] = [];
      let run = 1;
      for (let gap = 0; gap < 6; gap++) {
        if ((mask >> gap) & 1) {
          parts.push(run);
          run = 1;
        } else run++;
      }
      parts.push(run);
      found.add(parts.sort((a, b) => b - a).join(','));
    }
    return [...found].sort();
  };
  const transpose = (parts: number[]): number[] =>
    Array.from(
      { length: parts[0] },
      (_, column) => parts.filter((part) => part > column).length,
    );

  // Reads the boxes of the diagram in a cell: its bounding box from a fine scan, then a box-centre check, giving the row
  // lengths from the top row to the bottom row.
  const readCell = (seed: number, column: number, row: number): number[] => {
    const sample = createSurfaceSampler('ferrersdiagrams', seed),
      out = empty(),
      cellWidth = 1 / p.columns,
      cellHeight = 1 / p.rows,
      step = 0.002;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (
      let y = row * cellHeight + step / 2;
      y < (row + 1) * cellHeight;
      y += step
    )
      for (
        let x = column * cellWidth + step / 2;
        x < (column + 1) * cellWidth;
        x += step
      ) {
        sample(x, y, out);
        if (out.color < 0.75) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    const width = Math.round((maxX - minX) / p.box),
      height = Math.round((maxY - minY) / p.box),
      lengths: number[] = [];
    // The diagram is centred in its cell.
    expect(minX).toBeCloseTo(
      (column + 0.5) * cellWidth - (width * p.box) / 2,
      2,
    );
    expect(minY).toBeCloseTo(
      (row + 0.5) * cellHeight - (height * p.box) / 2,
      2,
    );
    for (let line = 0; line < height; line++) {
      let length = 0;
      for (let across = 0; across < width; across++) {
        sample(
          minX + (across + 0.5) * p.box - step / 2,
          minY + (line + 0.5) * p.box - step / 2,
          out,
        );
        if (out.color < 0.75) length++;
      }
      lengths.push(length);
    }
    return lengths;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws every partition of 7 exactly once as left-aligned rows of boxes (seed %i)',
    (seed) => {
      const partitions: string[] = [];
      let english = 0,
        french = 0;
      for (let row = 0; row < p.rows; row++)
        for (let column = 0; column < p.columns; column++) {
          const lengths = readCell(seed, column, row);
          // The rows never have a gap on their left: every row is a run starting at the left edge of the diagram.
          expect(lengths.every((length) => length >= 1)).toBe(true);
          expect(lengths.reduce((a, b) => a + b, 0)).toBe(p.total);
          const sorted = [...lengths].sort((a, b) => b - a);
          // Drawn with the longest row on top (English) or at the bottom (French).
          const topDown = lengths.every(
              (length, i) => i === 0 || lengths[i - 1] >= length,
            ),
            bottomUp = lengths.every(
              (length, i) => i === 0 || lengths[i - 1] <= length,
            );
          expect(topDown || bottomUp).toBe(true);
          if (new Set(lengths).size > 1) {
            if (topDown) english++;
            else french++;
          }
          partitions.push(sorted.join(','));
        }
      // Either all the diagrams with different rows are English or all are French.
      expect(english === 0 || french === 0).toBe(true);
      expect([...partitions].sort()).toEqual(partitionsOfSeven());
      expect(partitions).toHaveLength(15);
    },
  );

  it('shows English and French drawings, plain and transposed, across seeds', () => {
    // Cell 1 is the partition 6 + 1 or, transposed, 2 + 1 + 1 + 1 + 1 + 1; either read top to bottom or bottom to top.
    const plain = [6, 1],
      allowed = [
        plain,
        [...plain].reverse(),
        transpose(plain),
        [...transpose(plain)].reverse(),
      ],
      variants = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const lengths = readCell(seed, 1, 0);
      expect(allowed).toContainEqual(lengths);
      variants.add(lengths.join(','));
    }
    expect(variants.size).toBe(4);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('ferrersdiagrams', 0),
      b = createSurfaceSampler('ferrersdiagrams', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('pairingtables: Cantor, Szudzik and Morton pairing tables', () => {
  const p = proceduralMaterialPresets.pairingtables;
  const shapes = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];

  // Three independent constructions of the pairing tables (x = column, y = row), by walking the order of enumeration.
  const enumerate = (
    method: 'cantor' | 'szudzik' | 'morton',
  ): Map<string, number> => {
    const table = new Map<string, number>();
    let next = 0;
    if (method === 'cantor') {
      // Diagonal after diagonal, each from (x = diagonal, y = 0) towards (x = 0, y = diagonal).
      for (let diagonal = 0; diagonal < 2 * p.size; diagonal++)
        for (let y = 0; y <= diagonal; y++)
          table.set(`${diagonal - y},${y}`, next++);
    } else if (method === 'szudzik') {
      // Shell after shell: (0, k), (1, k), ..., (k - 1, k), then (k, 0), (k, 1), ..., (k, k).
      for (let shell = 0; shell < p.size; shell++) {
        for (let x = 0; x < shell; x++) table.set(`${x},${shell}`, next++);
        for (let y = 0; y <= shell; y++) table.set(`${shell},${y}`, next++);
      }
    } else {
      // The bits of x and y interleaved, y's bit above x's bit: the Morton number of every position, found by sorting.
      const positions = Array.from({ length: p.size * p.size }, (_, i) => [
        i % p.size,
        Math.floor(i / p.size),
      ]);
      const key = ([x, y]: number[]): string =>
        [2, 1, 0].map((bit) => `${(y >> bit) & 1}${(x >> bit) & 1}`).join('');
      positions.sort((a, b) => key(a).localeCompare(key(b)));
      positions.forEach(([x, y]) => table.set(`${x},${y}`, next++));
    }
    return table;
  };

  const decode = (seed: number): number[][] => {
    const sample = createSurfaceSampler('pairingtables', seed),
      out = empty(),
      cell = 1 / p.size,
      glyphAt = (u: number, centre: number): number | null | undefined => {
        // A digit, null for a blank slot, undefined for something else.
        const lines = [0, 1, 2, 3, 4].map((k) =>
          [0, 1, 2]
            .map((x) => {
              sample(u + (x + 0.5) * p.pixel, centre + (k - 2) * p.pixel, out);
              return out.color < 0.3 ? '#' : '.';
            })
            .join(''),
        );
        if (lines.every((line) => line === '...')) return null;
        const digit = shapes.findIndex((shape) =>
          shape.every((line, i) => line === lines[i]),
        );
        return digit < 0 ? undefined : digit;
      };
    return Array.from({ length: p.size }, (_, row) =>
      Array.from({ length: p.size }, (_, column) => {
        const centre = (row + 0.5) * cell,
          middle = (column + 0.5) * cell;
        for (const length of [1, 2, 3]) {
          const left = middle - (2 * length - 0.5) * p.pixel,
            digits = Array.from({ length }, (_, i) =>
              glyphAt(left + 4 * i * p.pixel, centre),
            ),
            before = glyphAt(left - 4 * p.pixel, centre),
            after = glyphAt(left + 4 * length * p.pixel, centre);
          if (
            digits.every((digit) => typeof digit === 'number') &&
            before === null &&
            after === null
          )
            return Number(digits.join(''));
        }
        throw new Error(`unreadable cell ${column},${row}`);
      }),
    );
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes the pairing of column and row in every cell by one of three rules (seed %i)',
    (seed) => {
      const table = decode(seed),
        matches: string[] = [];
      for (const method of ['cantor', 'szudzik', 'morton'] as const) {
        const expected = enumerate(method);
        for (const swapped of [false, true])
          if (
            table.every((line, row) =>
              line.every(
                (value, column) =>
                  value ===
                  expected.get(
                    swapped ? `${row},${column}` : `${column},${row}`,
                  ),
              ),
            )
          )
            matches.push(`${method}:${swapped}`);
      }
      expect(matches).toHaveLength(1);
      // A pairing is one-to-one: no number is repeated.
      expect(new Set(table.flat()).size).toBe(p.size * p.size);
    },
  );

  it('shows every rule, swapped and not, across seeds', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const table = decode(seed);
      seen.add(table[0].join(',') + '|' + table[1].join(','));
    }
    expect(seen.size).toBe(6);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('pairingtables', 0),
      b = createSurfaceSampler('pairingtables', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('hexdumprows: offsets, bytes in hex and the same bytes as text', () => {
  const p = proceduralMaterialPresets.hexdumprows;
  // Glyphs as '#' and '.' rows (digits, A to Z, and a dot at the bottom centre).
  const shapes: Record<string, string[]> = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'],
    F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'],
    H: ['#.#', '#.#', '###', '#.#', '#.#'],
    I: ['###', '.#.', '.#.', '.#.', '###'],
    J: ['..#', '..#', '..#', '#.#', '.#.'],
    K: ['#.#', '#.#', '##.', '#.#', '#.#'],
    L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#.#', '###', '###', '#.#', '#.#'],
    N: ['##.', '#.#', '#.#', '#.#', '#.#'],
    O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'],
    Q: ['.#.', '#.#', '#.#', '###', '.##'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'],
    T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
    W: ['#.#', '#.#', '###', '###', '#.#'],
    X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
    Z: ['###', '..#', '.#.', '#..', '###'],
    '.': ['...', '...', '...', '...', '.#.'],
  };
  const printable = new Set(
    [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '].map((character) =>
      character.charCodeAt(0),
    ),
  );

  const decode = (seed: number): string[] => {
    const sample = createSurfaceSampler('hexdumprows', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      };
    return Array.from({ length: p.rows }, (_, row) => {
      const centre = p.top + (row + 0.5) * p.rowPitch;
      let text = '';
      for (let slot = 0; slot < 27; slot++) {
        const lines = [0, 1, 2, 3, 4].map((k) =>
          [0, 1, 2]
            .map((x) =>
              colorAt(
                p.left + (4 * slot + x + 0.5) * p.pixel,
                centre + (k - 2) * p.pixel,
              ) < 0.3
                ? '#'
                : '.',
            )
            .join(''),
        );
        if (lines.every((line) => line === '...')) text += ' ';
        else {
          const found = Object.entries(shapes).find(([, shape]) =>
            shape.every((line, i) => line === lines[i]),
          );
          expect(found).toBeDefined();
          text += (found as [string, string[]])[0];
        }
      }
      // Nothing is written after the 27th character.
      for (let k = 0; k < 5; k++)
        expect(
          colorAt(
            p.left + (4 * 27 + 1.5) * p.pixel,
            centre + (k - 2) * p.pixel,
          ),
        ).toBeGreaterThan(0.8);
      return text;
    });
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'writes each row as offset, six hex bytes and the matching text (seed %i)',
    (seed) => {
      const rows = decode(seed);
      rows.forEach((text, row) => {
        // Offset (2 hex digits), then six bytes (2 hex digits each) separated by single spaces, a space, and six characters.
        expect(text).toMatch(/^[0-9A-F]{2} ([0-9A-F]{2} ){5}[0-9A-F]{2} .{6}$/);
        const offset = parseInt(text.slice(0, 2), 16),
          bytes = text
            .slice(3, 20)
            .split(' ')
            .map((hex) => parseInt(hex, 16));
        expect(offset).toBe(
          (parseInt(rows[0].slice(0, 2), 16) + 6 * row) % 256,
        );
        expect(bytes).toHaveLength(6);
        bytes.forEach((byte, i) => {
          const shown = text[21 + i];
          if (byte < 32) {
            // A control code is shown as a dot.
            expect(shown).toBe('.');
          } else {
            expect(printable.has(byte)).toBe(true);
            expect(shown).toBe(String.fromCharCode(byte));
          }
        });
      });
      // Offsets start at a multiple of 6.
      expect(parseInt(rows[0].slice(0, 2), 16) % 6).toBe(0);
    },
  );

  it('shows about 14 percent control codes and varied starting offsets across seeds', () => {
    let controls = 0,
      total = 0;
    const starts = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const rows = decode(seed);
      starts.add(parseInt(rows[0].slice(0, 2), 16));
      for (const text of rows)
        for (const hex of text.slice(3, 20).split(' ')) {
          total++;
          controls += Number(parseInt(hex, 16) < 32);
        }
    }
    expect(controls / total).toBeGreaterThan(p.controlShare - 0.05);
    expect(controls / total).toBeLessThan(p.controlShare + 0.05);
    expect(starts.size).toBeGreaterThan(15);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('hexdumprows', 0),
      b = createSurfaceSampler('hexdumprows', 7),
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

describe('pythagoreantriples: primitive Pythagorean triples from Euclid formula', () => {
  const p = proceduralMaterialPresets.pythagoreantriples;
  const shapes = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  // All primitive triples that need m up to maxM, found by searching for a^2 + b^2 = c^2 directly (a odd, b even, a and b
  // without a common factor) and keeping those whose m^2 = (a + c) / 2 is at most maxM^2; Euclid's formula does not list them.
  // Two different triples can share a hypotenuse (65 is both 33, 56, 65 and 63, 16, 65), so rows are only sorted weakly.
  const limit = p.maxM * p.maxM + (p.maxM - 1) * (p.maxM - 1);
  const primitive = new Set<string>();
  for (let a = 1; a < limit; a += 2)
    for (let b = 2; b < limit; b += 2) {
      const c = Math.round(Math.sqrt(a * a + b * b));
      if (
        c * c === a * a + b * b &&
        gcd(a, b) === 1 &&
        (a + c) / 2 <= p.maxM * p.maxM
      )
        primitive.add(`${a},${b},${c}`);
    }

  const decode = (seed: number): number[][] => {
    const sample = createSurfaceSampler('pythagoreantriples', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      };
    return Array.from({ length: p.rows }, (_, row) => {
      const centre = p.top + (row + 0.5) * p.rowPitch,
        slots = Array.from({ length: 16 }, (_, slot) => {
          const lines = [0, 1, 2, 3, 4].map((k) =>
            [0, 1, 2]
              .map((x) =>
                colorAt(
                  p.left + (4 * slot + x + 0.5) * p.pixel,
                  centre + (k - 2) * p.pixel,
                ) < 0.3
                  ? '#'
                  : '.',
              )
              .join(''),
          );
          if (lines.every((line) => line === '...')) return ' ';
          const digit = shapes.findIndex((shape) =>
            shape.every((line, i) => line === lines[i]),
          );
          expect(digit).toBeGreaterThanOrEqual(0);
          return String(digit);
        }).join('');
      // Columns: m (slot 0), n (slot 2), a (5-7), b (9-11), c (13-15); the rest is blank.
      expect(slots[1] + slots[3] + slots[4] + slots[8] + slots[12]).toBe(
        '     ',
      );
      return [
        slots[0],
        slots[2],
        slots.slice(5, 8),
        slots.slice(9, 12),
        slots.slice(13, 16),
      ].map((text) => Number(text.trim()));
    });
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'lists twelve different primitive triples by hypotenuse, each with its m and n (seed %i)',
    (seed) => {
      const rows = decode(seed);
      expect(new Set(rows.map((row) => row.join(','))).size).toBe(p.rows);
      rows.forEach(([m, n, a, b, c], index) => {
        expect(a * a + b * b).toBe(c * c);
        expect(primitive.has(`${a},${b},${c}`)).toBe(true);
        // m and n are what Euclid's formula needs to make this triple.
        expect([m * m - n * n, 2 * m * n, m * m + n * n]).toEqual([a, b, c]);
        expect(m).toBeLessThanOrEqual(p.maxM);
        if (index > 0) expect(c).toBeGreaterThanOrEqual(rows[index - 1][4]);
      });
      // No two rows come from the same pair, and the triples are all different too.
      expect(new Set(rows.map(([m, n]) => `${m},${n}`)).size).toBe(p.rows);
    },
  );

  it('chooses different sets of triples for different seeds and every one of the 18 can appear', () => {
    const seen = new Set<string>(),
      sets = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const rows = decode(seed);
      sets.add(rows.map((row) => row[4]).join(','));
      for (const [a, b, c] of rows) seen.add(`${a},${b},${c}`);
    }
    expect(primitive.size).toBe(18);
    expect(seen.size).toBe(18);
    expect(sets.size).toBeGreaterThan(30);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('pythagoreantriples', 0),
      b = createSurfaceSampler('pythagoreantriples', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('figuratenumbers: dot patterns of figurate numbers', () => {
  const p = proceduralMaterialPresets.figuratenumbers;
  const counts: Record<string, number[]> = {
    triangular: [1, 2, 3, 4, 5].map((n) => (n * (n + 1)) / 2),
    square: [1, 2, 3, 4, 5].map((n) => n * n),
    oblong: [1, 2, 3, 4, 5].map((n) => n * (n + 1)),
    centredSquare: [1, 2, 3, 4, 5].map((n) => 2 * n * n - 2 * n + 1),
  };
  // Width and height of the figure in dot pitches (triangular rows are sqrt(3) / 2 of a pitch apart).
  const extents = (kind: string, n: number): [number, number] =>
    kind === 'triangular'
      ? [n - 1, ((n - 1) * Math.sqrt(3)) / 2]
      : kind === 'square'
        ? [n - 1, n - 1]
        : kind === 'oblong'
          ? [n, n - 1]
          : [2 * n - 2, 2 * n - 2];

  // Counts the dots of one cell: connected groups of dark samples (4-neighbours) on a fine grid, with their bounding box.
  const readCell = (
    seed: number,
    column: number,
    row: number,
  ): { count: number; box: number[] } => {
    const sample = createSurfaceSampler('figuratenumbers', seed),
      out = empty(),
      step = 0.002,
      width = Math.round(1 / p.columns / step),
      height = Math.round(1 / p.rows / step),
      dark = new Uint8Array(width * height);
    let minX = width,
      maxX = -1,
      minY = height,
      maxY = -1;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        sample(
          column / p.columns + (x + 0.5) * step,
          row / p.rows + (y + 0.5) * step,
          out,
        );
        if (out.color < 0.5) {
          dark[y * width + x] = 1;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    let count = 0;
    const stack: number[] = [];
    for (let start = 0; start < dark.length; start++) {
      if (dark[start] !== 1) continue;
      count++;
      dark[start] = 2;
      stack.push(start);
      while (stack.length > 0) {
        const at = stack.pop() as number,
          x = at % width,
          y = Math.floor(at / width);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx,
            ny = y + dy;
          if (
            nx >= 0 &&
            nx < width &&
            ny >= 0 &&
            ny < height &&
            dark[ny * width + nx] === 1
          ) {
            dark[ny * width + nx] = 2;
            stack.push(ny * width + nx);
          }
        }
      }
    }
    return {
      count,
      box: [
        (maxX - minX + 1) * step,
        (maxY - minY + 1) * step,
        ((minX + maxX + 1) / 2) * step,
        ((minY + maxY + 1) / 2) * step,
      ],
    };
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'shows triangular, square, oblong and centred square numbers 1 to 5 with the right number of dots (seed %i)',
    (seed) => {
      const kinds: string[] = [];
      for (let row = 0; row < p.rows; row++) {
        const cells = Array.from({ length: p.columns }, (_, column) =>
            readCell(seed, column, row),
          ),
          kind = Object.keys(counts).find((name) =>
            counts[name].every(
              (count, column) => cells[column].count === count,
            ),
          );
        expect(kind).toBeDefined();
        kinds.push(kind as string);
        cells.forEach(({ box }, column) => {
          const [wide, high] = extents(kind as string, column + 1);
          // The bounding box is the figure's extent plus one dot diameter, and is centred in its cell.
          expect(box[0]).toBeCloseTo(wide * p.pitch + 2 * p.dotRadius, 2);
          expect(box[1]).toBeCloseTo(high * p.pitch + 2 * p.dotRadius, 2);
          expect(box[2]).toBeCloseTo(1 / p.columns / 2, 2);
          expect(box[3]).toBeCloseTo(1 / p.rows / 2, 2);
        });
      }
      // Each kind appears in exactly one row.
      expect(new Set(kinds).size).toBe(4);
    },
  );

  it('puts the four kinds in different row orders for different seeds', () => {
    const orders = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      // The count of the second figure of each row (3, 4, 6 or 5) tells which kind the row shows.
      const key = Array.from(
        { length: p.rows },
        (_, row) => readCell(seed, 1, row).count,
      ).join(',');
      orders.add(key);
      expect(new Set(key.split(',')).size).toBe(4);
    }
    expect(orders.size).toBeGreaterThan(12);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('figuratenumbers', 0),
      b = createSurfaceSampler('figuratenumbers', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('dyckpaths: the 14 Dyck paths of semilength 4', () => {
  const p = proceduralMaterialPresets.dyckpaths;
  const steps = 2 * p.semilength;
  // Independent list: every one of the 2^8 sequences of up (+1) and down (-1) steps, kept if no prefix sum is negative and the
  // total is 0 (as a string of 'U' and 'D').
  const dyck = new Set<string>();
  for (let mask = 0; mask < 1 << steps; mask++) {
    let level = 0,
      word = '',
      valid = true;
    for (let bit = steps - 1; bit >= 0 && valid; bit--) {
      const up = (mask >> bit) & 1;
      level += up ? 1 : -1;
      word += up ? 'U' : 'D';
      valid = level >= 0;
    }
    if (valid && level === 0) dyck.add(word);
  }

  const decode = (seed: number): string[] => {
    const sample = createSurfaceSampler('dyckpaths', seed),
      out = empty(),
      cellWidth = 1 / p.columns,
      cellHeight = 1 / p.rows,
      width = steps * p.unit,
      scan = 0.0015,
      words: string[] = [];
    for (let row = 0; row < p.rows; row++)
      for (let column = 0; column < p.columns; column++) {
        const baseline = (row + 0.5) * cellHeight + (p.semilength * p.unit) / 2,
          left = column * cellWidth + (cellWidth - width) / 2;
        let height = 0,
          word = '';
        for (let step = 0; step < steps; step++) {
          // Height of the dark line at the middle of the step: the mean of the dark samples going down the column.
          const x = left + (step + 0.5) * p.unit;
          let sum = 0,
            dark = 0;
          for (
            let v = row * cellHeight + scan / 2;
            v < (row + 1) * cellHeight;
            v += scan
          ) {
            sample(x, v, out);
            if (out.color < 0.3) {
              sum += baseline - v;
              dark++;
            }
          }
          expect(dark).toBeGreaterThan(0);
          // The middle of an up step is half a unit above the point it starts from, and of a down step half a unit below.
          const middle = sum / dark / p.unit;
          expect(
            Math.abs(middle - height - 0.5) < 0.1 ||
              Math.abs(middle - height + 0.5) < 0.1,
          ).toBe(true);
          const up =
            Math.abs(middle - height - 0.5) < Math.abs(middle - height + 0.5);
          word += up ? 'U' : 'D';
          height += up ? 1 : -1;
        }
        words.push(word);
      }
    return words;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws each of the 14 Dyck paths exactly once (seed %i)',
    (seed) => {
      const words = decode(seed);
      expect(dyck.size).toBe(14);
      expect(words).toHaveLength(14);
      expect(new Set(words).size).toBe(14);
      for (const word of words) expect(dyck.has(word)).toBe(true);
    },
  );

  it('shuffles the order of the paths differently for different seeds', () => {
    const orders = new Set<string>();
    for (let seed = 0; seed < 30; seed++) orders.add(decode(seed).join(','));
    expect(orders.size).toBeGreaterThan(25);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('dyckpaths', 0),
      b = createSurfaceSampler('dyckpaths', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('sacksspiral: primes on the Sacks spiral', () => {
  const p = proceduralMaterialPresets.sacksspiral;
  const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };
  // The dots of one variant, found by trial division and the polar formula (radius c sqrt(n), angle 2 pi sqrt(n)).
  const dotsFor = (last: number, mode: number): [number, number][] => {
    const scale = p.outerRadius / Math.sqrt(last),
      dots: [number, number][] = [];
    for (let n = 2; n <= last; n++)
      if (isPrime(n) && (mode === 0 || n % 4 === (mode === 1 ? 1 : 3)))
        dots.push([
          0.5 + scale * Math.sqrt(n) * Math.cos(2 * Math.PI * Math.sqrt(n)),
          0.5 + scale * Math.sqrt(n) * Math.sin(2 * Math.PI * Math.sqrt(n)),
        ]);
    return dots;
  };

  const matching = (seed: number): [number, number][] => {
    const sample = createSurfaceSampler('sacksspiral', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      },
      found: [number, number][] = [];
    for (const last of p.lasts)
      for (const mode of [0, 1, 2]) {
        const dots = dotsFor(last, mode);
        if (!dots.every(([x, y]) => colorAt(x, y) < 0.4)) continue;
        // Empty places: a grid of points farther than 0.012 from every dot must be paper.
        let empties = 0,
          ok = true;
        for (let j = 0; j < 80 && ok; j++)
          for (let i = 0; i < 80 && ok; i++) {
            const u = (i + 0.5) / 80,
              v = (j + 0.5) / 80;
            if (dots.every(([x, y]) => Math.hypot(u - x, v - y) > 0.012)) {
              empties++;
              ok = colorAt(u, v) > 0.85;
            }
          }
        if (ok && empties > 3000) found.push([last, mode]);
      }
    return found;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts exactly the primes of one variant at their spiral positions (seed %i)',
    (seed) => {
      expect(matching(seed)).toHaveLength(1);
    },
  );

  it('uses every last number and every kind of prime across seeds', () => {
    const lasts = new Set<number>(),
      modes = new Set<number>();
    for (let seed = 0; seed < 40; seed++) {
      const [[last, mode]] = matching(seed);
      lasts.add(last);
      modes.add(mode);
    }
    expect([...lasts].sort()).toEqual([...p.lasts].sort());
    expect([...modes].sort()).toEqual([0, 1, 2]);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sacksspiral', 0),
      b = createSurfaceSampler('sacksspiral', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('sierpinskipascal: Pascal triangle modulo 2 in two triangles', () => {
  const p = proceduralMaterialPresets.sierpinskipascal;
  // Pascal's triangle mod 2 built by adding the two numbers above (no bit tricks); entry (i, j) of the picture is C(i + j, i).
  const pascal = (rows: number): number[][] => {
    const triangle: number[][] = [[1]];
    for (let n = 1; n < rows; n++)
      triangle.push(
        Array.from(
          { length: n + 1 },
          (_, k) =>
            ((triangle[n - 1][k - 1] ?? 0) + (triangle[n - 1][k] ?? 0)) % 2,
        ),
      );
    return triangle;
  };
  const expected = (depth: number, mirrored: boolean): number[][] => {
    const size = 2 ** depth,
      triangle = pascal(size),
      odd = (i: number, j: number): number =>
        i + j < size ? triangle[i + j][i] : 0;
    // Cell (row j, column i): the picture plus the same picture turned half a turn, columns mirrored when asked.
    return Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, column) => {
        const i = mirrored ? size - 1 - column : column;
        return Math.max(odd(i, row), odd(size - 1 - i, size - 1 - row));
      }),
    );
  };

  const matches = (seed: number): [number, boolean][] => {
    const sample = createSurfaceSampler('sierpinskipascal', seed),
      out = empty(),
      found: [number, boolean][] = [];
    for (const depth of p.depths)
      for (const mirrored of [false, true]) {
        const grid = expected(depth, mirrored),
          size = 2 ** depth;
        let ok = true;
        for (let row = 0; row < size && ok; row++)
          for (let column = 0; column < size && ok; column++) {
            sample((column + 0.5) / size, (row + 0.5) / size, out);
            ok = (out.color < 0.5 ? 1 : 0) === grid[row][column];
          }
        if (ok) found.push([depth, mirrored]);
      }
    return found;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'fills exactly the cells where Pascal numbers are odd, in two halves (seed %i)',
    (seed) => {
      expect(matches(seed)).toHaveLength(1);
    },
  );

  it('uses every depth and both mirrorings across seeds', () => {
    const variants = new Set<string>();
    for (let seed = 0; seed < 40; seed++) variants.add(matches(seed).join('|'));
    expect(variants.size).toBe(6);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('sierpinskipascal', 0),
      b = createSurfaceSampler('sierpinskipascal', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('cobwebplots: the logistic map and its cobweb', () => {
  const p = proceduralMaterialPresets.cobwebplots;
  // Plot units (0 to 1 both ways) to tile coordinates; y goes up in the plot and down in the tile.
  const toTile = (x: number, y: number): [number, number] => [
    p.origin + x * p.size,
    p.origin + (1 - y) * p.size,
  ];
  const cobweb = (rate: number, start: number): [number, number][] => {
    const points: [number, number][] = [[start, 0]];
    let x = start;
    for (let i = 0; i < p.iterations; i++) {
      const next = rate * x * (1 - x);
      points.push([x, next], [next, next]);
      x = next;
    }
    return points;
  };

  const matching = (seed: number, thorough = true): [number, number][] => {
    const sample = createSurfaceSampler('cobwebplots', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      },
      found: [number, number][] = [];
    for (const rate of p.rates)
      for (const start of p.starts) {
        const points = cobweb(rate, start);
        // The middle of every segment of the cobweb is dark.
        let ok = points.every(([x, y], i) => {
          if (i === 0) return true;
          const [px, py] = points[i - 1];
          return (
            Math.hypot(x - px, y - py) < 1e-9 ||
            colorAt(...toTile((x + px) / 2, (y + py) / 2)) < 0.3
          );
        });
        if (!ok) continue;
        if (!thorough) {
          found.push([rate, start]);
          continue;
        }
        // Lines drawn: the cobweb, the parabola, the diagonal and the frame; far from all of them the picture is paper.
        const lines: [number, number][] = [];
        for (let k = 1; k < points.length; k++)
          for (let s = 0; s <= 40; s++)
            lines.push([
              points[k - 1][0] + ((points[k][0] - points[k - 1][0]) * s) / 40,
              points[k - 1][1] + ((points[k][1] - points[k - 1][1]) * s) / 40,
            ]);
        for (let s = 0; s <= 400; s++) {
          const x = s / 400;
          lines.push(
            [x, rate * x * (1 - x)],
            [x, x],
            [x, 0],
            [x, 1],
            [0, x],
            [1, x],
          );
        }
        let empties = 0;
        for (let j = 0; j < 70 && ok; j++)
          for (let i = 0; i < 70 && ok; i++) {
            const u = (i + 0.5) / 70,
              v = (j + 0.5) / 70,
              x = (u - p.origin) / p.size,
              y = 1 - (v - p.origin) / p.size;
            if (
              lines.every(
                ([lx, ly]) => Math.hypot(x - lx, y - ly) * p.size > 0.012,
              )
            ) {
              empties++;
              ok = colorAt(u, v) > 0.85;
            }
          }
        if (ok && empties > 3000) found.push([rate, start]);
      }
    return found;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws the cobweb of the logistic map for exactly one growth rate and start (seed %i)',
    (seed) => {
      expect(matching(seed)).toHaveLength(1);
    },
  );

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws the parabola and the diagonal as thin grey lines (seed %i)',
    (seed) => {
      const [[rate, start]] = matching(seed, false),
        sample = createSurfaceSampler('cobwebplots', seed),
        out = empty(),
        web = cobweb(rate, start),
        near = (x: number, y: number): boolean => {
          for (let k = 1; k < web.length; k++)
            for (let s = 0; s <= 20; s++) {
              const px = web[k - 1][0] + ((web[k][0] - web[k - 1][0]) * s) / 20,
                py = web[k - 1][1] + ((web[k][1] - web[k - 1][1]) * s) / 20;
              if (Math.hypot(x - px, y - py) * p.size < 0.02) return true;
            }
          return false;
        };
      let diagonals = 0,
        curves = 0;
      for (let i = 1; i < 40; i++) {
        const x = i / 40;
        if (!near(x, x)) {
          sample(...toTile(x, x), out);
          expect(out.color).toBeGreaterThan(0.45);
          expect(out.color).toBeLessThan(0.8);
          diagonals++;
        }
        const y = rate * x * (1 - x);
        if (!near(x, y)) {
          sample(...toTile(x, y), out);
          expect(out.color).toBeGreaterThan(0.25);
          expect(out.color).toBeLessThan(0.6);
          curves++;
        }
      }
      expect(diagonals).toBeGreaterThan(10);
      expect(curves).toBeGreaterThan(10);
    },
  );

  it('uses every growth rate and start across seeds', () => {
    const rates = new Set<number>(),
      starts = new Set<number>();
    for (let seed = 0; seed < 40; seed++) {
      const cheap = matching(seed, false);
      expect(cheap).toHaveLength(1);
      const [[rate, start]] = cheap;
      rates.add(rate);
      starts.add(start);
    }
    expect(rates.size).toBe(p.rates.length);
    expect(starts.size).toBe(p.starts.length);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('cobwebplots', 0),
      b = createSurfaceSampler('cobwebplots', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('divisorcountbars: stacks of boxes for the number of divisors', () => {
  const p = proceduralMaterialPresets.divisorcountbars;
  // d(n) by trial division, n = 1 to the largest number any seed can show.
  const last = p.firstMax + p.count - 1;
  const divisorCount = Array.from({ length: last + 1 }, (_, n) => {
    let count = 0;
    for (let d = 1; d <= n; d++) if (n % d === 0) count++;
    return count;
  });
  const isSquare = (n: number): boolean => Math.round(Math.sqrt(n)) ** 2 === n;

  const readBars = (seed: number): { counts: number[]; tones: number[] } => {
    const sample = createSurfaceSampler('divisorcountbars', seed),
      out = empty(),
      step = 0.0007,
      counts: number[] = [],
      tones: number[] = [];
    for (let slot = 0; slot < p.count; slot++) {
      const x = p.left + slot * p.slot + p.barWidth / 2;
      let boxes = 0,
        inside = false;
      for (let v = p.ground - step; v > 0; v -= step) {
        sample(x, v, out);
        const dark = out.color < 0.6;
        if (dark && !inside) boxes++;
        inside = dark;
      }
      counts.push(boxes);
      // The tone of the lowest box (half a box above the ground).
      sample(x, p.ground - p.box / 2, out);
      tones.push(out.color);
    }
    return { counts, tones };
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'stacks one box per divisor, darkest for primes and lightest for squares (seed %i)',
    (seed) => {
      const { counts, tones } = readBars(seed),
        starts: number[] = [];
      for (let first = 1; first <= p.firstMax; first++)
        if (counts.every((count, i) => count === divisorCount[first + i]))
          starts.push(first);
      expect(starts).toHaveLength(1);
      const first = starts[0];
      counts.forEach((count, i) => {
        const n = first + i;
        // Primes (2 divisors) are the darkest, squares (an odd number of divisors) the lightest, the rest in between.
        if (count === 2) expect(tones[i]).toBeLessThan(0.16);
        else if (isSquare(n)) expect(tones[i]).toBeGreaterThan(0.32);
        else {
          expect(tones[i]).toBeGreaterThan(0.16);
          expect(tones[i]).toBeLessThan(0.32);
        }
      });
    },
  );

  it('starts at different numbers for different seeds', () => {
    const starts = new Set<string>();
    for (let seed = 0; seed < 25; seed++)
      starts.add(readBars(seed).counts.join(','));
    expect(starts.size).toBeGreaterThan(20);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('divisorcountbars', 0),
      b = createSurfaceSampler('divisorcountbars', 7),
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

describe('timestablecircles: times tables drawn as chords on a circle', () => {
  const p = proceduralMaterialPresets.timestablecircles;
  const cell = 1 / p.cells;
  const pointAt = (
    column: number,
    row: number,
    i: number,
  ): [number, number] => {
    const angle = (2 * Math.PI * i) / p.points - Math.PI / 2;
    return [
      (column + 0.5) * cell + p.radius * Math.cos(angle),
      (row + 0.5) * cell + p.radius * Math.sin(angle),
    ];
  };
  const chordsOf = (column: number, row: number, k: number): number[][] =>
    Array.from({ length: p.points }, (_, i) => [i, (k * i) % p.points])
      .filter(([i, j]) => i !== j)
      .map(([i, j]) => [
        ...pointAt(column, row, i),
        ...pointAt(column, row, j),
      ]);
  const distanceToSegment = (
    x: number,
    y: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): number => {
    const dx = x1 - x0,
      dy = y1 - y0,
      t = Math.max(
        0,
        Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)),
      );
    return Math.hypot(x - x0 - t * dx, y - y0 - t * dy);
  };
  // Chord midpoints of "i to k i (mod points)" in one cell, the points being at angle 2 pi i / points - pi / 2.
  const midpoints = (
    column: number,
    row: number,
    k: number,
  ): [number, number][] => {
    const result: [number, number][] = [];
    for (let i = 0; i < p.points; i++) {
      const j = (k * i) % p.points;
      if (j === i) continue;
      const a = (2 * Math.PI * i) / p.points - Math.PI / 2,
        b = (2 * Math.PI * j) / p.points - Math.PI / 2;
      result.push([
        (column + 0.5) * cell + (p.radius * (Math.cos(a) + Math.cos(b))) / 2,
        (row + 0.5) * cell + (p.radius * (Math.sin(a) + Math.sin(b))) / 2,
      ]);
    }
    return result;
  };

  const readMultipliers = (seed: number): number[][] => {
    const sample = createSurfaceSampler('timestablecircles', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      };
    return Array.from({ length: p.cells * p.cells }, (_, index) => {
      const column = index % p.cells,
        row = Math.floor(index / p.cells),
        found: number[] = [];
      for (let k = p.kMin; k <= p.kMax; k++) {
        if (!midpoints(column, row, k).every(([u, v]) => colorAt(u, v) < 0.4))
          continue;
        // The chords of k must be all that is drawn: the middle of any other chord between two of the points is paper unless it
        // lies close to one of k's chords (where lines cross).
        const own = chordsOf(column, row, k);
        let stray = false;
        for (let a = 0; a < p.points && !stray; a++)
          for (let b = a + 1; b < p.points && !stray; b++) {
            const [ax, ay] = pointAt(column, row, a),
              [bx, by] = pointAt(column, row, b),
              u = (ax + bx) / 2,
              v = (ay + by) / 2;
            // Chords between neighbouring points run along the ring (also drawn), and lines cross at the chords of k.
            if (
              Math.abs(
                Math.hypot(u - (column + 0.5) * cell, v - (row + 0.5) * cell) -
                  p.radius,
              ) < 0.006 ||
              own.some(
                ([x0, y0, x1, y1]) =>
                  distanceToSegment(u, v, x0, y0, x1, y1) < 0.006,
              )
            )
              continue;
            stray = colorAt(u, v) < 0.5;
          }
        if (!stray) found.push(k);
      }
      return found;
    });
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'draws, in every cell, the chords of one multiplier and all nine differ (seed %i)',
    (seed) => {
      const cells = readMultipliers(seed);
      // Every cell shows the chords of exactly one multiplier from kMin to kMax.
      cells.forEach((found) => expect(found).toHaveLength(1));
      const multipliers = cells.map(([k]) => k);
      expect(new Set(multipliers).size).toBe(p.cells * p.cells);
      multipliers.forEach((k) => {
        expect(k).toBeGreaterThanOrEqual(p.kMin);
        expect(k).toBeLessThanOrEqual(p.kMax);
      });
    },
  );

  it('draws a dark dot at every point and leaves the outside of the ring empty', () => {
    const sample = createSurfaceSampler('timestablecircles', 7),
      out = empty();
    // Every one of the 72 points on the ring is a dark dot.
    for (let index = 0; index < p.cells * p.cells; index++) {
      const column = index % p.cells,
        row = Math.floor(index / p.cells);
      for (let i = 0; i < p.points; i++) {
        const a = (2 * Math.PI * i) / p.points - Math.PI / 2;
        sample(
          (column + 0.5) * cell + p.radius * Math.cos(a),
          (row + 0.5) * cell + p.radius * Math.sin(a),
          out,
        );
        expect(out.color).toBeLessThan(0.3);
      }
      // Outside the ring, away from the dots, the cell is empty (paper or its faint band).
      sample((column + 0.5) * cell + p.radius + 0.02, (row + 0.5) * cell, out);
      expect(out.color).toBeGreaterThan(0.85);
    }
  });

  it('uses every multiplier across seeds', () => {
    const used = new Set<number>();
    for (let seed = 0; seed < 20; seed++)
      for (const [k] of readMultipliers(seed)) used.add(k);
    expect(used.size).toBe(p.kMax - p.kMin + 1);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('timestablecircles', 0),
      b = createSurfaceSampler('timestablecircles', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('gaussianprimes: Gaussian primes in a 40 by 40 window', () => {
  const p = proceduralMaterialPresets.gaussianprimes;
  const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };
  // Gaussian primes: norm a^2 + b^2 prime, or a or b zero and the other of the form 4k + 3 (a prime) in absolute value. Checked by
  // trial division and, as a cross-check of the rule, by brute-force search for a Gaussian-integer factorisation.
  const gaussianPrime = (a: number, b: number): boolean =>
    a === 0 || b === 0
      ? isPrime(Math.abs(a + b)) && Math.abs(a + b) % 4 === 3
      : isPrime(a * a + b * b);
  const factorable = (a: number, b: number): boolean => {
    // a + b i = (x + y i)(z + w i) with both factors of norm > 1: try every x + y i whose norm divides the norm of a + b i.
    const norm = a * a + b * b;
    for (let x = -Math.ceil(Math.sqrt(norm)); x <= Math.sqrt(norm); x++)
      for (let y = -Math.ceil(Math.sqrt(norm)); y <= Math.sqrt(norm); y++) {
        const factorNorm = x * x + y * y;
        if (factorNorm <= 1 || factorNorm >= norm || norm % factorNorm !== 0)
          continue;
        // (a + b i) / (x + y i) = (a + b i)(x - y i) / factorNorm
        if (
          (a * x + b * y) % factorNorm === 0 &&
          (b * x - a * y) % factorNorm === 0
        )
          return true;
      }
    return false;
  };

  it('agrees with a brute-force factorisation on small Gaussian integers', () => {
    for (let a = -9; a <= 9; a++)
      for (let b = -9; b <= 9; b++) {
        if (a * a + b * b < 2) continue;
        expect(gaussianPrime(a, b)).toBe(!factorable(a, b));
      }
  });

  const matches = (seed: number): number[][] => {
    const sample = createSurfaceSampler('gaussianprimes', seed),
      out = empty(),
      found: number[][] = [];
    for (const corner of p.corners) {
      let ok = true;
      for (let row = 0; row < p.size && ok; row++)
        for (let column = 0; column < p.size && ok; column++) {
          sample((column + 0.5) / p.size, (row + 0.5) / p.size, out);
          ok =
            out.color < 0.4 ===
            gaussianPrime(corner[0] + column, corner[1] + p.size - 1 - row);
        }
      if (ok) found.push([...corner]);
    }
    return found;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'puts a dot exactly at each Gaussian prime of one window (seed %i)',
    (seed) => {
      expect(matches(seed)).toHaveLength(1);
    },
  );

  it('uses every window across seeds', () => {
    const used = new Set<string>();
    for (let seed = 0; seed < 40; seed++) used.add(matches(seed).join('|'));
    expect(used.size).toBe(p.corners.length);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('gaussianprimes', 0),
      b = createSurfaceSampler('gaussianprimes', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});

describe('josephuscircle: the order of elimination round a circle', () => {
  const p = proceduralMaterialPresets.josephuscircle;
  const shapes = [
    ['###', '#.#', '#.#', '#.#', '###'],
    ['.#.', '##.', '.#.', '.#.', '###'],
    ['###', '..#', '###', '#..', '###'],
    ['###', '..#', '###', '..#', '###'],
    ['#.#', '#.#', '###', '..#', '..#'],
    ['###', '#..', '###', '..#', '###'],
    ['###', '#..', '###', '#.#', '###'],
    ['###', '..#', '.#.', '.#.', '.#.'],
    ['###', '#.#', '###', '#.#', '###'],
    ['###', '#.#', '###', '..#', '###'],
  ];
  // Elimination order by keeping the people in a list and moving a position pointer (step - 1 places on, then removing).
  const eliminationOrder = (count: number, step: number): number[] => {
    const people = Array.from({ length: count }, (_, i) => i),
      order = Array.from({ length: count }, () => 0);
    let at = 0;
    for (let left = 1; left <= count; left++) {
      at = (at + step - 1) % people.length;
      order[people[at]] = left;
      people.splice(at, 1);
    }
    return order;
  };

  const matching = (seed: number): [number, number][] => {
    const sample = createSurfaceSampler('josephuscircle', seed),
      out = empty(),
      colorAt = (u: number, v: number): number => {
        sample(u, v, out);
        return out.color;
      },
      // True when the glyphs of `text` (centred on cx, cy, with the given pixel size) are drawn there.
      shows = (text: string, cx: number, cy: number, pixel: number): boolean =>
        [...text].every((character, d) =>
          shapes[Number(character)].every((line, k) =>
            [...line].every(
              (cell, x) =>
                colorAt(
                  cx -
                    (2 * text.length - 0.5) * pixel +
                    (4 * d + x + 0.5) * pixel,
                  cy + (k - 2) * pixel,
                ) <
                  0.3 ===
                (cell === '#'),
            ),
          ),
        ),
      found: [number, number][] = [];
    for (const count of p.counts)
      for (const step of p.steps) {
        const order = eliminationOrder(count, step);
        let ok = shows(String(step), 0.5, 0.5, p.bigPixel);
        for (let i = 0; i < count && ok; i++) {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          ok = shows(
            String(order[i]),
            0.5 + p.ringRadius * Math.cos(angle),
            0.5 + p.ringRadius * Math.sin(angle),
            p.pixel,
          );
        }
        if (ok) found.push([count, step]);
      }
    return found;
  };

  it.each([...seeds, 1, 2, 3, 4, 5, 6])(
    'numbers each person by the order they leave, with the step in the middle (seed %i)',
    (seed) => {
      expect(matching(seed)).toHaveLength(1);
    },
  );

  it('shades the survivor and no one else', () => {
    for (const seed of [0, 7, 3]) {
      const [[count, step]] = matching(seed),
        order = eliminationOrder(count, step),
        sample = createSurfaceSampler('josephuscircle', seed),
        out = empty(),
        tones: number[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        // A point of the disk away from its digits: on the disk's edge side towards the middle of the circle.
        sample(
          0.5 + (p.ringRadius - 0.036) * Math.cos(angle),
          0.5 + (p.ringRadius - 0.036) * Math.sin(angle),
          out,
        );
        tones.push(out.color);
      }
      tones.forEach((tone, i) => {
        if (order[i] === count) expect(tone).toBeLessThan(0.7);
        else expect(tone).toBeGreaterThan(0.78);
      });
      expect(tones.filter((tone) => tone < 0.7)).toHaveLength(1);
    }
  });

  it('uses every count and every step across seeds', () => {
    const counts = new Set<number>(),
      steps = new Set<number>();
    for (let seed = 0; seed < 40; seed++) {
      const [[count, step]] = matching(seed);
      counts.add(count);
      steps.add(step);
    }
    expect(counts.size).toBe(p.counts.length);
    expect(steps.size).toBe(p.steps.length);
  });

  it('keeps all channels in range, repeats seamlessly and differs between seeds', () => {
    const a = createSurfaceSampler('josephuscircle', 0),
      b = createSurfaceSampler('josephuscircle', 7),
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
    expect(different).toBeGreaterThan(0);
  });
});
