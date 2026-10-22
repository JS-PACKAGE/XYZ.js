import { AssetError, Texture } from '../texture.js';
import { distanceFieldLimits as limits } from '../../../../src/data/fonts.js';
export interface DistanceFieldProfile {
  readonly type: 'sdf' | 'msdf';
  readonly range: number;
}
const profiles = new WeakMap<Texture, DistanceFieldProfile>();
export function getTextureDistanceField(
  texture: Texture,
): DistanceFieldProfile | undefined {
  return profiles.get(texture);
}
export function registerTextureDistanceField(
  texture: Texture,
  profile: DistanceFieldProfile,
): void {
  if (
    !profile ||
    !['sdf', 'msdf'].includes(profile.type) ||
    !Number.isFinite(profile.range) ||
    profile.range < limits.minimumRange ||
    profile.range > limits.maximumRange
  )
    throw new AssetError('Invalid distance-field profile.');
  const previous = profiles.get(texture);
  if (
    previous &&
    (previous.type !== profile.type || previous.range !== profile.range)
  )
    throw new AssetError('Conflicting distance-field texture profile.');
  profiles.set(texture, Object.freeze({ ...profile }));
}
const rasters = new WeakMap<
  Texture,
  { pixels: Uint8ClampedArray; scales: Map<number, HTMLCanvasElement> }
>();
/** Internal renderer policy: stable cache buckets, never exceed page/pixel bounds. */
export function getDistanceFieldRasterScale(
  texture: Texture,
  desiredScale: number,
): number {
  if (texture.destroyed || !Number.isFinite(desiredScale) || desiredScale <= 0)
    throw new RangeError('Invalid distance-field raster request.');
  const maximum = Math.min(
    limits.rasterScale,
    limits.rasterDimension / texture.width,
    limits.rasterDimension / texture.height,
    Math.sqrt(limits.rasterPixels / (texture.width * texture.height)),
  );
  return Math.max(
    limits.minimumRasterScale,
    2 **
      Math.floor(
        Math.log2(Math.min(maximum, 2 ** Math.ceil(Math.log2(desiredScale)))),
      ),
  );
}
/** CPU bilinear distance sampling, not scaling a previously thresholded bitmap. */
export function getDistanceFieldCanvas(
  texture: Texture,
  scale = 1,
): HTMLCanvasElement {
  const profile = profiles.get(texture);
  if (!profile || texture.destroyed)
    throw new AssetError('Unavailable distance-field texture.');
  if (
    !Number.isFinite(scale) ||
    scale < limits.minimumRasterScale ||
    scale > limits.rasterScale
  )
    throw new RangeError('Invalid distance-field raster scale.');
  const width = Math.ceil(texture.width * scale),
    height = Math.ceil(texture.height * scale);
  if (
    width > limits.rasterDimension ||
    height > limits.rasterDimension ||
    width * height > limits.rasterPixels
  )
    throw new RangeError('Distance-field fallback raster exceeds budget.');
  let cache = rasters.get(texture);
  if (!cache) {
    const source = document.createElement('canvas');
    source.width = texture.width;
    source.height = texture.height;
    const context = source.getContext('2d', { willReadFrequently: true });
    if (!context)
      throw new AssetError('Canvas2D distance-field fallback unavailable.');
    context.drawImage(texture.image, 0, 0);
    cache = {
      pixels: context.getImageData(0, 0, texture.width, texture.height).data,
      scales: new Map(),
    };
    rasters.set(texture, cache);
  }
  const previous = cache.scales.get(scale);
  if (previous) return previous;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context)
    throw new AssetError('Canvas2D distance-field fallback unavailable.');
  const image = context.createImageData(width, height),
    data = image.data,
    pixels = cache.pixels,
    msdf = profile.type === 'msdf';
  // Taps clamp to the page edge. The horizontal ones depend only on the column, so every
  // row shares one table instead of re-clamping four taps per channel per pixel.
  const left = new Int32Array(width),
    right = new Int32Array(width),
    along = new Float64Array(width);
  for (let x = 0; x < width; x++) {
    const px = (x + 0.5) / scale - 0.5,
      ix = Math.floor(px);
    along[x] = px - ix;
    left[x] = Math.max(0, Math.min(texture.width - 1, ix)) * 4;
    right[x] = Math.max(0, Math.min(texture.width - 1, ix + 1)) * 4;
  }
  const stride = texture.width * 4;
  for (let y = 0; y < height; y++) {
    const py = (y + 0.5) / scale - 0.5,
      iy = Math.floor(py),
      fy = py - iy,
      keepY = 1 - fy,
      top = Math.max(0, Math.min(texture.height - 1, iy)) * stride,
      bottom = Math.max(0, Math.min(texture.height - 1, iy + 1)) * stride;
    for (let x = 0, offset = y * width * 4; x < width; x++, offset += 4) {
      const fx = along[x]!,
        keepX = 1 - fx,
        a = top + left[x]!,
        b = top + right[x]!,
        c = bottom + left[x]!,
        d = bottom + right[x]!;
      const red =
        ((pixels[a]! / 255) * keepX + (pixels[b]! / 255) * fx) * keepY +
        ((pixels[c]! / 255) * keepX + (pixels[d]! / 255) * fx) * fy;
      let value = red;
      if (msdf) {
        const green =
            ((pixels[a + 1]! / 255) * keepX + (pixels[b + 1]! / 255) * fx) *
              keepY +
            ((pixels[c + 1]! / 255) * keepX + (pixels[d + 1]! / 255) * fx) * fy,
          blue =
            ((pixels[a + 2]! / 255) * keepX + (pixels[b + 2]! / 255) * fx) *
              keepY +
            ((pixels[c + 2]! / 255) * keepX + (pixels[d + 2]! / 255) * fx) * fy;
        value = Math.max(
          Math.min(red, green),
          Math.min(Math.max(red, green), blue),
        );
      }
      data[offset] = data[offset + 1] = data[offset + 2] = 255;
      data[offset + 3] = Math.round(
        Math.max(0, Math.min(1, (value - 0.5) * profile.range * scale + 0.5)) *
          255,
      );
    }
  }
  context.putImageData(image, 0, 0);
  if (cache.scales.size >= limits.cachedScales)
    cache.scales.delete(cache.scales.keys().next().value!);
  cache.scales.set(scale, canvas);
  return canvas;
}
