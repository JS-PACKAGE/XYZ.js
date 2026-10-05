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
    pixels = cache.pixels;
  const read = (x: number, y: number, c: number) =>
    pixels[
      (Math.max(0, Math.min(texture.height - 1, y)) * texture.width +
        Math.max(0, Math.min(texture.width - 1, x))) *
        4 +
        c
    ]! / 255;
  const sample = (ix: number, iy: number, fx: number, fy: number, c: number) =>
    (read(ix, iy, c) * (1 - fx) + read(ix + 1, iy, c) * fx) * (1 - fy) +
    (read(ix, iy + 1, c) * (1 - fx) + read(ix + 1, iy + 1, c) * fx) * fy;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const px = (x + 0.5) / scale - 0.5,
        py = (y + 0.5) / scale - 0.5,
        ix = Math.floor(px),
        iy = Math.floor(py),
        fx = px - ix,
        fy = py - iy;
      const red = sample(ix, iy, fx, fy, 0);
      let value = red;
      if (profile.type === 'msdf') {
        const green = sample(ix, iy, fx, fy, 1),
          blue = sample(ix, iy, fx, fy, 2);
        value = Math.max(
          Math.min(red, green),
          Math.min(Math.max(red, green), blue),
        );
      }
      const offset = (y * width + x) * 4;
      image.data[offset] =
        image.data[offset + 1] =
        image.data[offset + 2] =
          255;
      image.data[offset + 3] = Math.round(
        Math.max(0, Math.min(1, (value - 0.5) * profile.range * scale + 0.5)) *
          255,
      );
    }
  context.putImageData(image, 0, 0);
  if (cache.scales.size >= limits.cachedScales)
    cache.scales.delete(cache.scales.keys().next().value!);
  cache.scales.set(scale, canvas);
  return canvas;
}
