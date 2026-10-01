import { describe, expect, it } from 'vitest';
import { EnvironmentMap } from '../packages/core/src/environment.js';
import {
  fillEnvironmentData,
  validateRenderSettings,
} from '../packages/core/src/render-data.js';
import { Scene } from '../packages/core/src/scene.js';
import { ENVIRONMENT_FLOAT_COUNT } from '../src/data/rendering.js';

function halfToFloat(h: number): number {
  const sign = h & 0x8000 ? -1 : 1;
  const exponent = (h >> 10) & 0x1f;
  const mantissa = h & 0x3ff;
  if (exponent === 0) return sign * mantissa * 2 ** -24;
  return sign * (1 + mantissa / 1024) * 2 ** (exponent - 15);
}

/** Mirrors the shader: order-2 real SH evaluated at a unit normal. */
function irradiance(sh: Float32Array, n: [number, number, number]): number[] {
  const [x, y, z] = n;
  const basis = [
    0.282095,
    0.488603 * y,
    0.488603 * z,
    0.488603 * x,
    1.092548 * x * y,
    1.092548 * y * z,
    0.315392 * (3 * z * z - 1),
    1.092548 * x * z,
    0.546274 * (x * x - y * y),
  ];
  return [0, 1, 2].map((c) =>
    basis.reduce((sum, b, k) => sum + b * sh[k * 4 + c], 0),
  );
}

function uniform(width: number, value: number, channels: 3 | 4 = 3) {
  const height = width / 2;
  return EnvironmentMap.fromPixels(
    width,
    height,
    new Float32Array(width * height * channels).fill(value),
    channels,
  );
}

describe('EnvironmentMap construction', () => {
  it('rejects non-2:1, oversized, mismatched and non-radiance input', () => {
    const ok = new Float32Array(16 * 8 * 3);
    expect(() =>
      EnvironmentMap.fromPixels(16, 16, new Float32Array(16 * 16 * 3)),
    ).toThrow(RangeError);
    expect(() => EnvironmentMap.fromPixels(4, 2, new Float32Array(24))).toThrow(
      RangeError,
    );
    expect(() =>
      EnvironmentMap.fromPixels(4096, 2048, new Float32Array(1)),
    ).toThrow(RangeError);
    expect(() => EnvironmentMap.fromPixels(16, 8, ok.subarray(1))).toThrow(
      RangeError,
    );
    expect(() => EnvironmentMap.fromPixels(16, 8, ok, 5 as never)).toThrow(
      RangeError,
    );
    const negative = ok.slice();
    negative[7] = -0.1;
    expect(() => EnvironmentMap.fromPixels(16, 8, negative)).toThrow(
      /nonnegative/,
    );
    const nan = ok.slice();
    nan[3] = Number.NaN;
    expect(() => EnvironmentMap.fromPixels(16, 8, nan)).toThrow(RangeError);
  });

  it('builds a full mip chain and preserves a constant radiance in every level', () => {
    const map = uniform(64, 1.5);
    expect(map.mipCount).toBe(6);
    expect(map.levelSizes.map((s) => `${s.width}x${s.height}`)).toEqual([
      '64x32',
      '32x16',
      '16x8',
      '8x4',
      '4x2',
      '2x1',
    ]);
    for (const [index, level] of map.levels.entries()) {
      const size = map.levelSizes[index];
      expect(level.length).toBe(size.width * size.height * 4);
      for (let p = 0; p < size.width * size.height; p++) {
        expect(halfToFloat(level[p * 4])).toBeCloseTo(1.5, 2);
        expect(halfToFloat(level[p * 4 + 3])).toBe(1);
      }
    }
  });

  it('projects a uniform sky to SH whose irradiance / pi equals the sky radiance', () => {
    const map = uniform(128, 2);
    for (const n of [
      [0, 1, 0],
      [0, -1, 0],
      [1, 0, 0],
      [0.577, 0.577, -0.577],
    ] as Array<[number, number, number]>)
      for (const c of irradiance(map.sh, n)) expect(c).toBeCloseTo(2, 1);
  });

  it('gives normals facing a bright light more irradiance than opposite normals', () => {
    const map = EnvironmentMap.gradient({
      zenith: [0.1, 0.1, 0.1],
      horizon: [0.1, 0.1, 0.1],
      ground: [0.1, 0.1, 0.1],
      sun: { direction: [1, 0, 0], color: [50, 50, 50], radius: 0.3 },
      width: 128,
    });
    const toward = irradiance(map.sh, [1, 0, 0])[0];
    const away = irradiance(map.sh, [-1, 0, 0])[0];
    const side = irradiance(map.sh, [0, 0, 1])[0];
    expect(toward).toBeGreaterThan(side);
    expect(side).toBeGreaterThan(away);
    expect(away).toBeGreaterThanOrEqual(0);
  });

  it('blurs specular mips by spreading a bright spot without losing its energy', () => {
    const width = 128;
    const height = 64;
    const data = new Float32Array(width * height * 3).fill(0.05);
    for (const dx of [0, 1, 2, 3])
      for (const dy of [0, 1, 2, 3])
        for (let c = 0; c < 3; c++)
          data[((20 + dy) * width + 40 + dx) * 3 + c] = 400;
    const map = EnvironmentMap.fromPixels(width, height, data);
    const peak = (level: number) => {
      let max = 0;
      for (
        let p = 0;
        p < map.levelSizes[level].width * map.levelSizes[level].height;
        p++
      )
        max = Math.max(max, halfToFloat(map.levels[level][p * 4]));
      return max;
    };
    expect(peak(0)).toBeGreaterThan(300);
    expect(peak(map.mipCount - 1)).toBeLessThan(peak(3));
    expect(peak(3)).toBeLessThan(peak(1));
    // Mean radiance (sin-weighted) stays comparable across blur levels.
    const mean = (level: number) => {
      const { width: w, height: h } = map.levelSizes[level];
      let total = 0;
      let weight = 0;
      for (let j = 0; j < h; j++) {
        const s = Math.sin(((j + 0.5) / h) * Math.PI);
        for (let i = 0; i < w; i++) {
          total += halfToFloat(map.levels[level][(j * w + i) * 4]) * s;
          weight += s;
        }
      }
      return total / weight;
    };
    for (let level = 2; level < map.mipCount; level++)
      expect(mean(level)).toBeGreaterThan(mean(0) * 0.5);
    expect(mean(0)).toBeGreaterThan(0.05);
  });

  it('decodes 8-bit sRGB ImageData to linear light and marks destroyed maps', () => {
    const width = 16;
    const height = 8;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    data.fill(188, 0, 4); // sRGB 188/255 ~= 0.503 linear
    const map = EnvironmentMap.fromImageData({ width, height, data });
    expect(halfToFloat(map.levels[0][0])).toBeCloseTo(0.503, 2);
    expect(halfToFloat(map.levels[0][4])).toBe(1);
    expect(map.destroyed).toBe(false);
    map.destroy();
    expect(map.destroyed).toBe(true);
    expect(() =>
      EnvironmentMap.fromImageData({ width, height, data: data.subarray(1) }),
    ).toThrow(RangeError);
  });
});

function rgbeFile(
  width: number,
  height: number,
  encode: (row: number) => number[],
  header = '#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n',
  resolution = `-Y ${height} +X ${width}\n`,
): Uint8Array {
  const text = new TextEncoder().encode(header + resolution);
  const rows = Array.from({ length: height }, (_, y) => encode(y)).flat();
  const bytes = new Uint8Array(text.length + rows.length);
  bytes.set(text);
  bytes.set(rows, text.length);
  return bytes;
}

describe('EnvironmentMap.fromRGBE', () => {
  const width = 8;
  const height = 4;

  it('reads flat scanlines with the shared exponent', () => {
    // mantissa 128, exponent 129 -> 128 * 2^(129-136) = 1.0
    const file = rgbeFile(width, height, () =>
      Array.from({ length: width }, () => [128, 64, 0, 129]).flat(),
    );
    const map = EnvironmentMap.fromRGBE(file);
    expect(map.width).toBe(8);
    expect(halfToFloat(map.levels[0][0])).toBeCloseTo(1, 3);
    expect(halfToFloat(map.levels[0][1])).toBeCloseTo(0.5, 3);
    expect(halfToFloat(map.levels[0][2])).toBe(0);
  });

  it('reads new-style RLE scanlines, including runs and literal spans', () => {
    const row = (): number[] => {
      const out = [2, 2, 0, width];
      // R, G: one run of 8; B: literal 8; E: run of 8.
      out.push(
        128 + 8,
        128,
        128 + 8,
        64,
        8,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        128 + 8,
        129,
      );
      return out;
    };
    const map = EnvironmentMap.fromRGBE(rgbeFile(width, height, row));
    expect(halfToFloat(map.levels[0][0])).toBeCloseTo(1, 3);
    expect(halfToFloat(map.levels[0][1])).toBeCloseTo(0.5, 3);
  });

  it('rejects malformed, truncated and unsupported files without reading past the buffer', () => {
    const flat = () =>
      Array.from({ length: width }, () => [128, 128, 128, 129]).flat();
    const good = rgbeFile(width, height, flat);
    expect(() =>
      EnvironmentMap.fromRGBE(good.subarray(0, good.length - 1)),
    ).toThrow(RangeError);
    expect(() =>
      EnvironmentMap.fromRGBE(new TextEncoder().encode('P6\n1 1\n255\n')),
    ).toThrow(/Radiance/);
    expect(() =>
      EnvironmentMap.fromRGBE(
        rgbeFile(width, height, flat, '#?RADIANCE\nFORMAT=32-bit_rle_xyze\n\n'),
      ),
    ).toThrow(/RGBE/);
    expect(() =>
      EnvironmentMap.fromRGBE(
        rgbeFile(width, height, flat, undefined, `+Y ${height} +X ${width}\n`),
      ),
    ).toThrow(/orientation/);
    expect(() =>
      EnvironmentMap.fromRGBE(rgbeFile(9, 4, flat, undefined, '-Y 4 +X 9\n')),
    ).toThrow(/2:1/);
    const badRun = rgbeFile(width, height, () => [
      2,
      2,
      0,
      width,
      128 + 100,
      1,
    ]);
    expect(() => EnvironmentMap.fromRGBE(badRun)).toThrow(/run is invalid/);
    expect(() => EnvironmentMap.fromRGBE(new Uint8Array(0))).toThrow(
      RangeError,
    );
  });
});

describe('scene environment settings', () => {
  it('writes SH, intensity, mip range and background strength, treating destroyed maps as absent', () => {
    const scene = new Scene();
    const out = new Float32Array(ENVIRONMENT_FLOAT_COUNT).fill(9);
    fillEnvironmentData(scene, out);
    expect(Array.from(out)).toEqual(new Array(ENVIRONMENT_FLOAT_COUNT).fill(0));

    const map = uniform(32, 1);
    scene.environment = map;
    scene.environmentIntensity = 0.5;
    scene.background = map;
    scene.backgroundIntensity = 2;
    fillEnvironmentData(scene, out);
    expect(out.subarray(0, 36)).toEqual(map.sh);
    expect(Array.from(out.subarray(36))).toEqual([0.5, 1, map.mipCount - 1, 2]);

    map.destroy();
    fillEnvironmentData(scene, out);
    expect(Array.from(out)).toEqual(new Array(ENVIRONMENT_FLOAT_COUNT).fill(0));
  });

  it('validates types and intensities before a backend allocates anything', () => {
    const scene = new Scene();
    expect(() => validateRenderSettings(scene)).not.toThrow();
    scene.environmentIntensity = -1;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
    scene.environmentIntensity = 1;
    scene.backgroundIntensity = Number.NaN;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
    scene.backgroundIntensity = 1;
    scene.environment = {} as EnvironmentMap;
    expect(() => validateRenderSettings(scene)).toThrow(TypeError);
  });
});

describe('cubemap environments', () => {
  it('preserves world-direction colors across every face orientation', () => {
    const size = 16;
    const faces = Array.from({ length: 6 }, (_, face) => {
      const pixels = new Float32Array(size * size * 3);
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const u = (2 * (x + 0.5)) / size - 1,
            v = (2 * (y + 0.5)) / size - 1;
          const direction = [
            [1, -v, -u],
            [-1, -v, u],
            [u, 1, v],
            [u, -1, -v],
            [u, -v, 1],
            [-u, -v, -1],
          ][face]!;
          const length = Math.hypot(...direction);
          for (let c = 0; c < 3; c++)
            pixels[(y * size + x) * 3 + c] = (direction[c]! / length + 1) / 2;
        }
      return pixels;
    }) as [
      Float32Array,
      Float32Array,
      Float32Array,
      Float32Array,
      Float32Array,
      Float32Array,
    ];
    const map = EnvironmentMap.fromCubemap(size, faces);
    const pixels = map.levels[0]!;
    for (let y = 0; y < map.height; y += 2)
      for (let x = 0; x < map.width; x += 2) {
        const phi = ((x + 0.5) / map.width - 0.5) * Math.PI * 2,
          theta = ((y + 0.5) / map.height) * Math.PI;
        const expected = [
          Math.sin(theta) * Math.sin(phi),
          Math.cos(theta),
          -Math.sin(theta) * Math.cos(phi),
        ];
        for (let c = 0; c < 3; c++)
          expect(
            Math.abs(
              halfToFloat(pixels[(y * map.width + x) * 4 + c]!) -
                (expected[c]! + 1) / 2,
            ),
          ).toBeLessThan(0.025);
      }
    faces[0].fill(0);
    expect(halfToFloat(pixels[(16 * map.width + 48) * 4]!)).toBeGreaterThan(
      0.9,
    );
    map.destroy();
  });

  it('decodes sRGB faces once and ignores alpha', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    for (let p = 0; p < 16; p++) {
      data[p * 4] = 188;
      data[p * 4 + 1] = 255;
    }
    const face = { width: 4, height: 4, data };
    const map = EnvironmentMap.fromCubemapImageData([
      face,
      face,
      face,
      face,
      face,
      face,
    ]);
    for (let p = 0; p < map.width * map.height; p++) {
      expect(halfToFloat(map.levels[0]![p * 4]!)).toBeCloseTo(0.503, 2);
      expect(halfToFloat(map.levels[0]![p * 4 + 1]!)).toBe(1);
      expect(halfToFloat(map.levels[0]![p * 4 + 3]!)).toBe(1);
    }
    map.destroy();
  });

  it('rejects mismatched faces and radiance before filtering', () => {
    const valid = new Float32Array(4 * 4 * 3).fill(1);
    const faces: [
      Float32Array,
      Float32Array,
      Float32Array,
      Float32Array,
      Float32Array,
      Float32Array,
    ] = [valid, valid, valid, valid, valid, valid];
    expect(() => EnvironmentMap.fromCubemap(0, faces)).toThrow(RangeError);
    expect(() => EnvironmentMap.fromCubemap(4096, faces)).toThrow(RangeError);
    faces[5] = valid.subarray(1);
    expect(() => EnvironmentMap.fromCubemap(4, faces)).toThrow(/dimensions/);
    faces[5] = valid.slice();
    faces[5][5] = -1;
    expect(() => EnvironmentMap.fromCubemap(4, faces)).toThrow(/nonnegative/);
    faces[5][5] = Number.NaN;
    expect(() => EnvironmentMap.fromCubemap(4, faces)).toThrow(RangeError);
    const face = { width: 4, height: 4, data: new Uint8Array(64) };
    expect(() =>
      EnvironmentMap.fromCubemapImageData([
        face,
        face,
        face,
        face,
        face,
        { ...face, height: 2 },
      ]),
    ).toThrow(/dimensions/);
  });
});
