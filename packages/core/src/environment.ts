import { environmentLimits } from '../../../src/data/rendering.js';

export type EnvironmentColor = readonly [number, number, number];

export interface EnvironmentGradientOptions {
  zenith: EnvironmentColor;
  horizon: EnvironmentColor;
  ground: EnvironmentColor;
  /** Optional sun disc; `direction` points from the origin toward the sun. */
  sun?: {
    direction: EnvironmentColor;
    color: EnvironmentColor;
    /** Angular radius in radians. */
    radius?: number;
  };
  /** Equirect width; height is width / 2. Defaults to 128. */
  width?: number;
}

const TWO_PI = Math.PI * 2;
const HALF_MAX = 65504;
const scratchFloat = new Float32Array(1);
const scratchBits = new Uint32Array(scratchFloat.buffer);

/** Round-to-nearest IEEE binary16; inputs are finite and nonnegative-clamped by the caller. */
function toHalf(value: number): number {
  const sign = value < 0 ? 0x8000 : 0;
  const abs = Math.abs(value);
  if (abs >= HALF_MAX) return sign | 0x7bff;
  if (abs < 6.103515625e-5)
    return sign | Math.round(abs / 5.960464477539063e-8);
  scratchFloat[0] = abs;
  const bits = scratchBits[0];
  const exponent = (bits >>> 23) - 127 + 15;
  const mantissa = (bits & 0x7fffff) + 0x1000;
  const half = (exponent << 10) + (mantissa >>> 13);
  return sign | Math.min(half, 0x7bff);
}

/** Equirect texel center to a unit direction; u = 0.5 looks toward -Z, v = 0 is +Y. */
export function equirectDirection(
  u: number,
  v: number,
  out: [number, number, number],
): [number, number, number] {
  const phi = (u - 0.5) * TWO_PI;
  const theta = v * Math.PI;
  const s = Math.sin(theta);
  out[0] = s * Math.sin(phi);
  out[1] = Math.cos(theta);
  out[2] = -s * Math.cos(phi);
  return out;
}

/** Bilinear resample with horizontal wrap and vertical clamp (exact 2x2 box for 2:1 halving). */
function resample(
  source: Float32Array,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Float32Array {
  const out = new Float32Array(dw * dh * 3);
  for (let j = 0; j < dh; j++) {
    const sy = ((j + 0.5) * sh) / dh - 0.5;
    const y0 = Math.floor(sy);
    const fy = sy - y0;
    const ya = Math.min(Math.max(y0, 0), sh - 1);
    const yb = Math.min(Math.max(y0 + 1, 0), sh - 1);
    for (let i = 0; i < dw; i++) {
      const sx = ((i + 0.5) * sw) / dw - 0.5;
      const x0 = Math.floor(sx);
      const fx = sx - x0;
      const xa = ((x0 % sw) + sw) % sw;
      const xb = (((x0 + 1) % sw) + sw) % sw;
      for (let c = 0; c < 3; c++) {
        const top =
          source[(ya * sw + xa) * 3 + c] * (1 - fx) +
          source[(ya * sw + xb) * 3 + c] * fx;
        const bottom =
          source[(yb * sw + xa) * 3 + c] * (1 - fx) +
          source[(yb * sw + xb) * 3 + c] * fx;
        out[(j * dw + i) * 3 + c] = top * (1 - fy) + bottom * fy;
      }
    }
  }
  return out;
}

function encodeHalf(level: Float32Array, width: number, height: number) {
  const out = new Uint16Array(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    out[p * 4] = toHalf(level[p * 3]);
    out[p * 4 + 1] = toHalf(level[p * 3 + 1]);
    out[p * 4 + 2] = toHalf(level[p * 3 + 2]);
    out[p * 4 + 3] = 0x3c00; // 1.0
  }
  return out;
}

/** Real SH basis through order 2, in the same order as the shader. */
function shBasis(x: number, y: number, z: number, out: Float64Array): void {
  out[0] = 0.282095;
  out[1] = 0.488603 * y;
  out[2] = 0.488603 * z;
  out[3] = 0.488603 * x;
  out[4] = 1.092548 * x * y;
  out[5] = 1.092548 * y * z;
  out[6] = 0.315392 * (3 * z * z - 1);
  out[7] = 1.092548 * x * z;
  out[8] = 0.546274 * (x * x - y * y);
}

/** Cosine-lobe convolution per SH band, divided by pi so the shader yields irradiance / pi. */
const BAND_FACTOR = [1, 2 / 3, 2 / 3, 2 / 3, 0.25, 0.25, 0.25, 0.25, 0.25];

/**
 * Immutable equirectangular (2:1) radiance environment for image-based lighting and
 * backgrounds. Construction does all CPU filtering once: an order-2 SH irradiance for
 * diffuse light and a roughness-blurred mip chain for specular reflections. GPU uploads
 * are renderer-owned caches; `destroy()` only releases the CPU data and stops rendering.
 */
export class EnvironmentMap {
  /** Half-float RGBA levels; level 0 is sharp, later levels are progressively blurrier. */
  readonly levels: readonly Uint16Array[];
  readonly levelSizes: ReadonlyArray<{ width: number; height: number }>;
  /** Nine RGB coefficients padded to vec4, ready for the mesh shaders. */
  readonly sh: Float32Array;
  readonly width: number;
  readonly height: number;
  private gone = false;

  private constructor(width: number, height: number, linear: Float32Array) {
    this.width = width;
    this.height = height;
    const sizes: Array<{ width: number; height: number }> = [];
    const chain: Float32Array[] = [];
    let mipCount = 1;
    while (mipCount < environmentLimits.maxMips && height >> mipCount >= 1)
      mipCount++;
    for (let level = 0; level < mipCount; level++)
      sizes.push({
        width: Math.max(1, width >> level),
        height: Math.max(1, height >> level),
      });
    chain.push(linear);
    if (mipCount > 1)
      chain.push(
        resample(linear, width, height, sizes[1].width, sizes[1].height),
      );
    // Blur from a small proxy: filtered lobes are smooth, so 64x32 loses nothing visible.
    // Halving repeatedly averages bright small features instead of aliasing them away.
    let proxy = linear;
    let proxyWidth = width;
    let proxyHeight = height;
    while (
      proxyWidth > environmentLimits.proxyWidth &&
      proxyWidth > 2 &&
      proxyHeight > 1
    ) {
      proxy = resample(
        proxy,
        proxyWidth,
        proxyHeight,
        proxyWidth >> 1,
        proxyHeight >> 1,
      );
      proxyWidth >>= 1;
      proxyHeight >>= 1;
    }
    this.sh = EnvironmentMap.projectSH(proxy, proxyWidth, proxyHeight);
    const directions = EnvironmentMap.sourceDirections(proxyWidth, proxyHeight);
    const solidAngles = new Float32Array(proxyWidth * proxyHeight);
    for (let j = 0; j < proxyHeight; j++) {
      const weight =
        (TWO_PI / proxyWidth) *
        (Math.PI / proxyHeight) *
        Math.sin(((j + 0.5) / proxyHeight) * Math.PI);
      for (let i = 0; i < proxyWidth; i++)
        solidAngles[j * proxyWidth + i] = weight;
    }
    for (let level = 2; level < mipCount; level++) {
      const roughness = level / (mipCount - 1);
      const alpha = roughness * roughness;
      const shininess = Math.min(4096, Math.max(1, 2 / (alpha * alpha) - 2));
      const bw = Math.min(sizes[level].width, environmentLimits.proxyWidth);
      const bh = Math.max(1, bw >> 1);
      const blurred = EnvironmentMap.convolve(
        proxy,
        directions,
        solidAngles,
        proxyWidth * proxyHeight,
        bw,
        bh,
        shininess,
      );
      chain.push(
        bw === sizes[level].width && bh === sizes[level].height
          ? blurred
          : resample(blurred, bw, bh, sizes[level].width, sizes[level].height),
      );
    }
    this.levelSizes = sizes;
    this.levels = chain.map((level, index) =>
      encodeHalf(level, sizes[index].width, sizes[index].height),
    );
  }

  get destroyed(): boolean {
    return this.gone;
  }

  /** Number of mip levels; specular LOD is `roughness * (mipCount - 1)`. */
  get mipCount(): number {
    return this.levelSizes.length;
  }

  /**
   * @param data Linear-light RGB (channels = 3) or RGBA (channels = 4) floats, row-major,
   * top row first. Width must be twice the height.
   */
  static fromPixels(
    width: number,
    height: number,
    data: ArrayLike<number>,
    channels: 3 | 4 = 3,
  ): EnvironmentMap {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width !== height * 2 ||
      height < environmentLimits.minHeight ||
      width > environmentLimits.maxWidth
    )
      throw new RangeError(
        `Environment must be a 2:1 equirect between ${environmentLimits.minHeight * 2}x${environmentLimits.minHeight} and ${environmentLimits.maxWidth}x${environmentLimits.maxWidth / 2}.`,
      );
    if (channels !== 3 && channels !== 4)
      throw new RangeError('Environment channels must be 3 or 4.');
    if (data.length !== width * height * channels)
      throw new RangeError('Environment pixel count does not match its size.');
    const linear = new Float32Array(width * height * 3);
    for (let p = 0; p < width * height; p++)
      for (let c = 0; c < 3; c++) {
        const value = data[p * channels + c];
        if (!Number.isFinite(value) || value < 0)
          throw new RangeError(
            'Environment radiance must be finite and nonnegative.',
          );
        linear[p * 3 + c] = Math.min(value, HALF_MAX);
      }
    return new EnvironmentMap(width, height, linear);
  }

  /** 8-bit sRGB pixels (for example canvas ImageData) decoded to linear light. */
  static fromImageData(image: {
    width: number;
    height: number;
    data: ArrayLike<number>;
  }): EnvironmentMap {
    const linear = new Float32Array(image.width * image.height * 3);
    if (image.data.length !== image.width * image.height * 4)
      throw new RangeError('Environment ImageData must be RGBA.');
    for (let p = 0; p < image.width * image.height; p++)
      for (let c = 0; c < 3; c++) {
        const s = image.data[p * 4 + c] / 255;
        if (!Number.isFinite(s) || s < 0 || s > 1)
          throw new RangeError('Environment ImageData must be 8-bit.');
        linear[p * 3 + c] =
          s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      }
    return EnvironmentMap.fromPixels(image.width, image.height, linear, 3);
  }

  /** Radiance `.hdr` (RGBE, flat or new-style RLE). Untrusted input is bounds-checked. */
  static fromRGBE(source: ArrayBuffer | Uint8Array): EnvironmentMap {
    const bytes =
      source instanceof Uint8Array ? source : new Uint8Array(source);
    let cursor = 0;
    const readLine = (): string => {
      let line = '';
      while (cursor < bytes.length && bytes[cursor] !== 10) {
        line += String.fromCharCode(bytes[cursor++]);
        if (line.length > 256)
          throw new RangeError('Radiance header line is too long.');
      }
      if (cursor >= bytes.length)
        throw new RangeError('Radiance header is truncated.');
      cursor++;
      return line;
    };
    const magic = readLine();
    if (!magic.startsWith('#?'))
      throw new RangeError('Not a Radiance RGBE file.');
    for (let guard = 0; ; guard++) {
      if (guard > 64) throw new RangeError('Radiance header is too long.');
      const line = readLine();
      if (line === '') break;
      if (line.startsWith('FORMAT=') && line !== 'FORMAT=32-bit_rle_rgbe')
        throw new RangeError('Only 32-bit RGBE Radiance files are supported.');
    }
    const resolution = /^-Y (\d+) \+X (\d+)$/.exec(readLine());
    if (!resolution)
      throw new RangeError('Only -Y +X Radiance orientation is supported.');
    const height = Number(resolution[1]);
    const width = Number(resolution[2]);
    if (
      width !== height * 2 ||
      height < environmentLimits.minHeight ||
      width > environmentLimits.maxWidth
    )
      throw new RangeError('Radiance image is not a supported 2:1 equirect.');
    const rgbe = new Uint8Array(width * 4);
    const pixels = new Float32Array(width * height * 3);
    for (let y = 0; y < height; y++) {
      if (cursor + 4 > bytes.length)
        throw new RangeError('Radiance data is truncated.');
      const rle =
        width >= 8 &&
        width < 32768 &&
        bytes[cursor] === 2 &&
        bytes[cursor + 1] === 2 &&
        (bytes[cursor + 2] & 0x80) === 0;
      if (rle) {
        if (((bytes[cursor + 2] << 8) | bytes[cursor + 3]) !== width)
          throw new RangeError('Radiance scanline width mismatch.');
        cursor += 4;
        for (let channel = 0; channel < 4; channel++) {
          let x = 0;
          while (x < width) {
            if (cursor >= bytes.length)
              throw new RangeError('Radiance data is truncated.');
            let count = bytes[cursor++];
            if (count > 128) {
              count -= 128;
              if (count === 0 || x + count > width || cursor >= bytes.length)
                throw new RangeError('Radiance run is invalid.');
              const value = bytes[cursor++];
              for (let k = 0; k < count; k++)
                rgbe[(x++ << 2) + channel] = value;
            } else {
              if (
                count === 0 ||
                x + count > width ||
                cursor + count > bytes.length
              )
                throw new RangeError('Radiance run is invalid.');
              for (let k = 0; k < count; k++)
                rgbe[(x++ << 2) + channel] = bytes[cursor++];
            }
          }
        }
      } else {
        if (cursor + width * 4 > bytes.length)
          throw new RangeError('Radiance data is truncated.');
        rgbe.set(bytes.subarray(cursor, cursor + width * 4));
        cursor += width * 4;
      }
      for (let x = 0; x < width; x++) {
        const e = rgbe[x * 4 + 3];
        const scale = e === 0 ? 0 : Math.pow(2, e - 136);
        for (let c = 0; c < 3; c++)
          pixels[(y * width + x) * 3 + c] = rgbe[x * 4 + c] * scale;
      }
    }
    return EnvironmentMap.fromPixels(width, height, pixels, 3);
  }

  /** Procedural sky: vertical gradient with an optional soft-edged sun. */
  static gradient(options: EnvironmentGradientOptions): EnvironmentMap {
    const width = options.width ?? 128;
    if (!Number.isInteger(width) || width % 2 !== 0)
      throw new RangeError('Gradient width must be an even integer.');
    const height = width / 2;
    for (const color of [options.zenith, options.horizon, options.ground])
      if (
        !Array.isArray(color) ||
        color.length !== 3 ||
        !color.every((v) => Number.isFinite(v) && v >= 0)
      )
        throw new RangeError('Gradient colors need three nonnegative numbers.');
    let sunDirection: [number, number, number] | undefined;
    const sun = options.sun;
    const radius = sun?.radius ?? 0.05;
    if (sun) {
      const d = sun.direction;
      const length = Math.hypot(d[0], d[1], d[2]);
      if (!Number.isFinite(length) || length === 0)
        throw new RangeError('Sun direction must be a nonzero vector.');
      if (
        !sun.color.every((v) => Number.isFinite(v) && v >= 0) ||
        !Number.isFinite(radius) ||
        radius <= 0
      )
        throw new RangeError(
          'Sun needs nonnegative color and positive radius.',
        );
      sunDirection = [d[0] / length, d[1] / length, d[2] / length];
    }
    const data = new Float32Array(width * height * 3);
    const direction: [number, number, number] = [0, 0, 0];
    for (let j = 0; j < height; j++)
      for (let i = 0; i < width; i++) {
        equirectDirection((i + 0.5) / width, (j + 0.5) / height, direction);
        const y = direction[1];
        const up = y >= 0;
        const t = up ? Math.pow(y, 0.5) : Math.pow(-y, 0.5);
        const from = options.horizon;
        const to = up ? options.zenith : options.ground;
        for (let c = 0; c < 3; c++) {
          let value = from[c] + (to[c] - from[c]) * t;
          if (sunDirection && sun) {
            const cosine = Math.min(
              1,
              direction[0] * sunDirection[0] +
                direction[1] * sunDirection[1] +
                direction[2] * sunDirection[2],
            );
            const angle = Math.acos(cosine);
            // Smooth edge so the disc does not alias into single hot texels.
            value +=
              sun.color[c] *
              Math.max(0, Math.min(1, (radius * 1.5 - angle) / (radius * 0.5)));
          }
          data[(j * width + i) * 3 + c] = value;
        }
      }
    return EnvironmentMap.fromPixels(width, height, data, 3);
  }

  /** Stops rendering with this map; renderers release their GPU copies on the next frame. */
  destroy(): void {
    this.gone = true;
  }

  private static sourceDirections(width: number, height: number): Float32Array {
    const out = new Float32Array(width * height * 3);
    const d: [number, number, number] = [0, 0, 0];
    for (let j = 0; j < height; j++)
      for (let i = 0; i < width; i++) {
        equirectDirection((i + 0.5) / width, (j + 0.5) / height, d);
        out.set(d, (j * width + i) * 3);
      }
    return out;
  }

  private static projectSH(
    proxy: Float32Array,
    width: number,
    height: number,
  ): Float32Array {
    const coefficients = new Float64Array(27);
    const basis = new Float64Array(9);
    const d: [number, number, number] = [0, 0, 0];
    for (let j = 0; j < height; j++) {
      const weight =
        (TWO_PI / width) *
        (Math.PI / height) *
        Math.sin(((j + 0.5) / height) * Math.PI);
      for (let i = 0; i < width; i++) {
        equirectDirection((i + 0.5) / width, (j + 0.5) / height, d);
        shBasis(d[0], d[1], d[2], basis);
        const p = (j * width + i) * 3;
        for (let k = 0; k < 9; k++)
          for (let c = 0; c < 3; c++)
            coefficients[k * 3 + c] += proxy[p + c] * basis[k] * weight;
      }
    }
    const out = new Float32Array(36);
    for (let k = 0; k < 9; k++)
      for (let c = 0; c < 3; c++)
        out[k * 4 + c] = coefficients[k * 3 + c] * BAND_FACTOR[k];
    return out;
  }

  private static convolve(
    proxy: Float32Array,
    directions: Float32Array,
    solidAngles: Float32Array,
    count: number,
    width: number,
    height: number,
    shininess: number,
  ): Float32Array {
    const out = new Float32Array(width * height * 3);
    const d: [number, number, number] = [0, 0, 0];
    for (let j = 0; j < height; j++)
      for (let i = 0; i < width; i++) {
        equirectDirection((i + 0.5) / width, (j + 0.5) / height, d);
        let r = 0;
        let g = 0;
        let b = 0;
        let total = 0;
        for (let s = 0; s < count; s++) {
          const cosine =
            d[0] * directions[s * 3] +
            d[1] * directions[s * 3 + 1] +
            d[2] * directions[s * 3 + 2];
          if (cosine <= 0) continue;
          const weight = Math.pow(cosine, shininess) * solidAngles[s];
          r += proxy[s * 3] * weight;
          g += proxy[s * 3 + 1] * weight;
          b += proxy[s * 3 + 2] * weight;
          total += weight;
        }
        const o = (j * width + i) * 3;
        if (total > 0) {
          out[o] = r / total;
          out[o + 1] = g / total;
          out[o + 2] = b / total;
        }
      }
    return out;
  }
}
