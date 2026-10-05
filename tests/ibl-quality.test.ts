import { describe, expect, it } from 'vitest';
import { EnvironmentMap } from '../packages/core/src/environment.js';
import {
  BRDF_LUT_WIDTH,
  BRDF_LUT_HEIGHT,
  ggxDirectionalAlbedo,
} from '../src/data/brdf.js';

function lookup(nv: number, rough: number): number[] {
  const x = nv * (BRDF_LUT_WIDTH - 1),
    y = rough * (BRDF_LUT_HEIGHT - 1);
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, BRDF_LUT_WIDTH - 1),
    y1 = Math.min(y0 + 1, BRDF_LUT_HEIGHT - 1);
  return [0, 1].map((channel) => {
    const value = (u: number, v: number) =>
      ggxDirectionalAlbedo[(v * BRDF_LUT_WIDTH + u) * 2 + channel];
    const low = value(x0, y0) * (1 - x + x0) + value(x1, y0) * (x - x0);
    const high = value(x0, y1) * (1 - x + x0) + value(x1, y1) * (x - x0);
    return low * (1 - y + y0) + high * (y - y0);
  });
}

// Independent solid-angle hemisphere quadrature, not the generator's NDF samples.
function integrate(nv: number, rough: number): number[] {
  const polar = 512,
    azimuth = 512,
    alpha2 = rough ** 4;
  const sv = Math.sqrt(1 - nv * nv),
    rootV = Math.sqrt(alpha2 + (1 - alpha2) * nv * nv);
  let a = 0,
    b = 0;
  for (let y = 0; y < polar; y++) {
    const nl = (y + 0.5) / polar,
      sl = Math.sqrt(1 - nl * nl);
    const visibility =
      0.5 / (nl * rootV + nv * Math.sqrt(alpha2 + (1 - alpha2) * nl * nl));
    for (let x = 0; x < azimuth; x++) {
      const lv =
        sv * sl * Math.cos(((x + 0.5) * 2 * Math.PI) / azimuth) + nv * nl;
      const length = Math.sqrt(2 + 2 * lv),
        nh = (nv + nl) / length,
        vh = (1 + lv) / length;
      const denominator = 1 - nh * nh + alpha2 * nh * nh;
      const weight =
        (alpha2 / (Math.PI * denominator * denominator)) * visibility * nl;
      const fresnel = (1 - vh) ** 5;
      a += weight * (1 - fresnel);
      b += weight * fresnel;
    }
  }
  const solidAngle = (2 * Math.PI) / (polar * azimuth);
  return [a * solidAngle, b * solidAngle];
}

function half(value: number): number {
  const exponent = (value >> 10) & 31,
    fraction = value & 1023;
  return exponent === 0
    ? fraction * 2 ** -24
    : (1 + fraction / 1024) * 2 ** (exponent - 15);
}

function ggxMoment(rough: number): number {
  const alpha2 = rough ** 4;
  let weighted = 0,
    normalization = 0;
  for (let i = 0; i < 32768; i++) {
    const nl = (i + 0.5) / 32768,
      nh2 = (1 + nl) * 0.5;
    const kernel = nl / (1 - nh2 + alpha2 * nh2) ** 2;
    weighted += kernel * nl;
    normalization += kernel;
  }
  return weighted / normalization;
}

describe('physical IBL integration', () => {
  it('matches independent Smith GGX hemisphere integration at rough and grazing boundaries', () => {
    for (const rough of [0.35, 0.7, 1])
      for (const nv of [0.03, 0.25, 0.7, 1]) {
        const reference = integrate(nv, rough),
          actual = lookup(nv, rough);
        for (let channel = 0; channel < 2; channel++)
          expect(Math.abs(actual[channel] - reference[channel])).toBeLessThan(
            0.012,
          );
      }
  });

  it('preserves the analytic mirror and fully rough directional albedos', () => {
    for (const nv of [0.1, 0.4, 1]) {
      const [a, b] = lookup(nv, 0);
      expect(a + b).toBeCloseTo(1, 5);
      expect(b).toBeCloseTo((1 - nv) ** 5, 3);
    }
    const [a, b] = lookup(1, 1);
    expect(a + b).toBeCloseTo(1 - Math.log(2), 4);
    for (let i = 0; i < ggxDirectionalAlbedo.length; i += 2) {
      const energy = ggxDirectionalAlbedo[i] + ggxDirectionalAlbedo[i + 1];
      expect(ggxDirectionalAlbedo[i]).toBeGreaterThanOrEqual(0);
      expect(ggxDirectionalAlbedo[i + 1]).toBeGreaterThanOrEqual(0);
      expect(energy).toBeGreaterThan(0.3);
      expect(energy).toBeLessThan(1.00001);
    }
  });

  it('filters directional radiance with GGX moments rather than a cosine-power kernel', () => {
    const width = 128,
      height = width / 2,
      pixels = new Float32Array(width * height * 3);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const theta = ((y + 0.5) / height) * Math.PI,
          phi = ((x + 0.5) / width - 0.5) * Math.PI * 2;
        const direction = [
          Math.sin(theta) * Math.sin(phi),
          Math.cos(theta),
          -Math.sin(theta) * Math.cos(phi),
        ];
        for (let c = 0; c < 3; c++)
          pixels[(y * width + x) * 3 + c] = 0.5 + 0.5 * direction[c];
      }
    const map = EnvironmentMap.fromPixels(width, height, pixels);
    try {
      for (let level = 1; level < map.mipCount; level++) {
        const size = map.levelSizes[level],
          moment = ggxMoment(level / (map.mipCount - 1));
        for (let y = 0; y < size.height; y++)
          for (let x = 0; x < size.width; x++) {
            const theta = ((y + 0.5) / size.height) * Math.PI,
              phi = ((x + 0.5) / size.width - 0.5) * Math.PI * 2;
            const direction = [
              Math.sin(theta) * Math.sin(phi),
              Math.cos(theta),
              -Math.sin(theta) * Math.cos(phi),
            ];
            for (let c = 0; c < 3; c++)
              expect(
                Math.abs(
                  half(map.levels[level][(y * size.width + x) * 4 + c]) -
                    (0.5 + 0.5 * direction[c] * moment),
                ),
              ).toBeLessThan(0.035);
          }
      }
    } finally {
      map.destroy();
    }
  });
});
