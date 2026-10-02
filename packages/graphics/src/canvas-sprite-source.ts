import type { Texture2DSource } from '../../assets/src/index.js';
import type { TextureQuad2D } from './sprite-instance.js';
import { GraphicsError } from './errors.js';

/** Renderer-owned source snapshots; views borrow a single versioned upload. */
export class CanvasSpriteSource {
  private readonly sources = new Map<
    Texture2DSource,
    { canvas: HTMLCanvasElement; version: number }
  >();
  private scratch: HTMLCanvasElement | undefined;
  constructor(
    private readonly renderImage: (
      source: Texture2DSource,
    ) => CanvasImageSource,
  ) {}
  endFrame(): void {
    for (const source of this.sources.keys())
      if (source.destroyed) this.unload(source);
  }
  prepare(source: Texture2DSource): CanvasImageSource {
    if (source.destroyed)
      throw new GraphicsError('Cannot prepare a destroyed texture.');
    if (source.kind === 'native')
      throw new GraphicsError(
        'Canvas2D does not support native texture payloads.',
      );
    if (source.kind === 'render') return this.renderImage(source);
    let entry = this.sources.get(source);
    if (!entry) {
      entry = { canvas: document.createElement('canvas'), version: -1 };
      this.sources.set(source, entry);
    }
    if (entry.version !== source.version) {
      entry.canvas.width = source.width;
      entry.canvas.height = source.height;
      const context = entry.canvas.getContext('2d');
      if (!context)
        throw new GraphicsError('Canvas2D source preparation is unavailable.');
      context.drawImage(source.image, 0, 0);
      entry.version = source.version;
    }
    return entry.canvas;
  }
  image(
    source: Texture2DSource,
    quad: TextureQuad2D,
    tint: ArrayLike<number>,
  ): HTMLCanvasElement {
    const image = this.prepare(source);
    // Full untinted frames already have a versioned snapshot. Repainting the
    // shared scratch per sprite forces unnecessary native canvas dependencies.
    if (
      source.kind !== 'render' &&
      tint[0] === 1 &&
      tint[1] === 1 &&
      tint[2] === 1 &&
      quad.u0 === 0 &&
      quad.v0 === 0 &&
      quad.ux === 1 &&
      quad.vx === 0 &&
      quad.uy === 0 &&
      quad.vy === 1 &&
      quad.trimWidth * quad.resolution === source.width &&
      quad.trimHeight * quad.resolution === source.height
    )
      return this.sources.get(source)!.canvas;
    const canvas = (this.scratch ??= document.createElement('canvas'));
    const width = Math.max(1, Math.round(quad.trimWidth * quad.resolution)),
      height = Math.max(1, Math.round(quad.trimHeight * quad.resolution));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext('2d')!;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    // Invert the central UV basis: packed clockwise frames are unrotated here.
    const a = (quad.ux * source.width) / canvas.width;
    const b = (quad.vx * source.height) / canvas.width;
    const c = (quad.uy * source.width) / canvas.height;
    const d = (quad.vy * source.height) / canvas.height;
    const det = a * d - b * c;
    const x = quad.u0 * source.width,
      y = quad.v0 * source.height;
    context.setTransform(
      d / det,
      -b / det,
      -c / det,
      a / det,
      (c * y - d * x) / det,
      (b * x - a * y) / det,
    );
    context.drawImage(image, 0, 0);
    context.setTransform(1, 0, 0, 1, 0, 0);
    if (tint[0] !== 1 || tint[1] !== 1 || tint[2] !== 1) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] *= tint[0];
        pixels.data[i + 1] *= tint[1];
        pixels.data[i + 2] *= tint[2];
      }
      context.putImageData(pixels, 0, 0);
    }
    return canvas;
  }
  unload(source: Texture2DSource): void {
    const entry = this.sources.get(source);
    if (entry) entry.canvas.width = entry.canvas.height = 1;
    this.sources.delete(source);
  }
  destroy(): void {
    for (const source of this.sources.keys()) this.unload(source);
    if (this.scratch) this.scratch.width = this.scratch.height = 1;
    this.scratch = undefined;
  }
}
