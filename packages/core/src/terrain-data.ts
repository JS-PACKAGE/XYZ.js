import { terrainLimits } from '../../../src/data/terrain.js';
import { Texture } from '../../assets/src/index.js';

export interface TerrainImageData {
  readonly width: number;
  readonly height: number;
  readonly data: ArrayLike<number>;
}
export type TerrainImageSource = TerrainImageData | Texture;

/** Reads decoded images only; native/compressed sources cannot be sampled on the CPU. */
export function terrainImageData(source: TerrainImageSource): TerrainImageData {
  if (!(source instanceof Texture)) {
    if (
      !Number.isInteger(source.width) ||
      !Number.isInteger(source.height) ||
      source.width < 1 ||
      source.height < 1 ||
      source.width * source.height > terrainLimits.imagePixels ||
      source.data.length !== source.width * source.height * 4
    )
      throw new RangeError('Terrain image requires bounded RGBA pixels.');
    for (let i = 0; i < source.data.length; i++)
      if (
        !Number.isFinite(source.data[i]) ||
        source.data[i]! < 0 ||
        source.data[i]! > 255
      )
        throw new RangeError('Terrain image channels must be in [0,255].');
    return source;
  }
  if (source.destroyed || source.kind !== 'image')
    throw new Error('Terrain requires a live decoded image texture.');
  if (source.width * source.height > terrainLimits.imagePixels)
    throw new RangeError('Terrain image exceeds pixel budget.');
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(source.width, source.height)
      : typeof document !== 'undefined'
        ? document.createElement('canvas')
        : undefined;
  if (!canvas)
    throw new Error(
      'Texture terrain sampling requires a canvas; supply RGBA image data in CPU environments.',
    );
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d') as
    OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!context)
    throw new Error('Terrain image readback requires a 2D canvas context.');
  context.drawImage(source.image, 0, 0);
  return context.getImageData(0, 0, source.width, source.height);
}

export function terrainChannel(
  image: TerrainImageData,
  u: number,
  v: number,
  channel: number,
  repeat = false,
): number {
  u = repeat ? u - Math.floor(u) : Math.max(0, Math.min(1, u));
  v = repeat ? v - Math.floor(v) : Math.max(0, Math.min(1, v));
  const x = u * (image.width - 1),
    y = v * (image.height - 1);
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, image.width - 1),
    y1 = Math.min(y0 + 1, image.height - 1);
  const a = image.data[(y0 * image.width + x0) * 4 + channel]! / 255;
  const b = image.data[(y0 * image.width + x1) * 4 + channel]! / 255;
  const c = image.data[(y1 * image.width + x0) * 4 + channel]! / 255;
  const d = image.data[(y1 * image.width + x1) * 4 + channel]! / 255;
  return (
    (a * (1 - (x - x0)) + b * (x - x0)) * (1 - (y - y0)) +
    (c * (1 - (x - x0)) + d * (x - x0)) * (y - y0)
  );
}
