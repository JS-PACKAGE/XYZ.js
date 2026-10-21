import { Texture, type Texture2DSource } from '../../assets/src/index.js';
import {
  getTextureDistanceField,
  getDistanceFieldRasterScale,
  getDistanceFieldCanvas,
} from '../../assets/src/fonts/distance-field.js';
import type { TextureQuad2D } from './sprite-instance.js';
import { GraphicsError } from './errors.js';
import { hypot2 } from '../../math/src/hypot.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';

/** Canvas `setTransform(a, b, c, d, e, f)` operands that place one 2D object on its target. */
export interface CanvasPlacement2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

interface FrameSnapshot {
  readonly canvas: HTMLCanvasElement;
  readonly source: Texture2DSource;
  readonly key: Float64Array;
  pixels: number;
  used: number;
}

const FRAME_KEY_LENGTH = 16;

/** Renderer-owned source snapshots; views borrow a single versioned upload. */
export class CanvasSpriteSource {
  private readonly sources = new Map<
    Texture2DSource,
    { canvas: HTMLCanvasElement; version: number }
  >();
  /** Source pixels read back once per version for tinted copies, least recently used first. */
  private readonly sourcePixelCache = new Map<
    Texture2DSource,
    { version: number; pixels: Uint8ClampedArray }
  >();
  private sourcePixelTotal = 0;
  private scratch: HTMLCanvasElement | undefined;
  /**
   * Painted frames by key hash. A sub-frame or tint repainted into one shared scratch per
   * draw made every draw wait on that repaint (and a tint read it back); identical inputs
   * paint identical pixels, so a snapshot can be drawn again. A hash collision is a miss.
   */
  private readonly frames = new Map<number, FrameSnapshot>();
  private framePixels = 0;
  private frameClock = 0;
  private readonly frameKey = new Float64Array(FRAME_KEY_LENGTH);
  private readonly frameWords = new Int32Array(this.frameKey.buffer);
  private readonly sourceIds = new WeakMap<Texture2DSource, number>();
  private nextSourceId = 0;
  constructor(
    private readonly renderImage: (
      source: Texture2DSource,
    ) => CanvasImageSource,
  ) {}
  endFrame(): void {
    for (const source of this.sources.keys())
      if (source.destroyed) this.unload(source);
    // Distance-field frames paint from glyph canvases outside `sources`.
    for (const snapshot of this.frames.values())
      if (snapshot.source.destroyed) this.dropFrames(snapshot.source);
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
  /** `transform` supplies the destination scale; only distance-field textures read it. */
  image(
    source: Texture2DSource,
    quad: TextureQuad2D,
    tint: ArrayLike<number>,
    transform?: Readonly<CanvasPlacement2D>,
  ): HTMLCanvasElement {
    const field = source instanceof Texture && getTextureDistanceField(source);
    let scale = 1;
    if (field) {
      scale = getDistanceFieldRasterScale(
        source as Texture,
        transform
          ? Math.max(
              hypot2(transform.a, transform.b),
              hypot2(transform.c, transform.d),
            ) / quad.resolution
          : 1,
      );
    }
    const image = field
      ? getDistanceFieldCanvas(source as Texture, scale)
      : this.prepare(source);
    const sourceWidth = Math.ceil(source.width * scale),
      sourceHeight = Math.ceil(source.height * scale);
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
      return image as HTMLCanvasElement;
    const width = Math.max(
        1,
        Math.round(quad.trimWidth * quad.resolution * scale),
      ),
      height = Math.max(
        1,
        Math.round(quad.trimHeight * quad.resolution * scale),
      );
    // Render targets change without a version, so they always repaint the scratch.
    if (
      source.kind === 'render' ||
      width * height > rendering2dLimits.canvasFrameSnapshotPixels
    ) {
      const canvas = (this.scratch ??= document.createElement('canvas'));
      this.paint(
        canvas,
        image,
        quad,
        tint,
        width,
        height,
        sourceWidth,
        sourceHeight,
      );
      return canvas;
    }
    let id = this.sourceIds.get(source);
    if (id === undefined)
      this.sourceIds.set(source, (id = this.nextSourceId++));
    const k = this.frameKey;
    k[0] = id;
    k[1] = source.version;
    k[2] = scale;
    k[3] = source.width;
    k[4] = source.height;
    k[5] = quad.u0;
    k[6] = quad.v0;
    k[7] = quad.ux;
    k[8] = quad.vx;
    k[9] = quad.uy;
    k[10] = quad.vy;
    k[11] = width;
    k[12] = height;
    k[13] = tint[0];
    k[14] = tint[1];
    k[15] = tint[2];
    const words = this.frameWords;
    let hash = 0;
    for (let i = 0; i < words.length; i++)
      hash = (Math.imul(hash, 0x01000193) ^ words[i]!) | 0;
    const hit = this.frames.get(hash);
    if (hit && sameKey(hit.key, k)) {
      hit.used = ++this.frameClock;
      return hit.canvas;
    }
    const pixels = width * height;
    let canvas: HTMLCanvasElement | undefined;
    if (hit) canvas = this.dropFrame(hash, hit);
    while (
      this.frames.size >= rendering2dLimits.canvasFrameSnapshots ||
      this.framePixels + pixels > rendering2dLimits.canvasFrameSnapshotPixels
    ) {
      let oldest: number | undefined, snapshot: FrameSnapshot | undefined;
      for (const [key, candidate] of this.frames)
        if (!snapshot || candidate.used < snapshot.used) {
          oldest = key;
          snapshot = candidate;
        }
      const evicted = this.dropFrame(oldest!, snapshot!);
      if (canvas) evicted.width = evicted.height = 1;
      else canvas = evicted;
    }
    canvas ??= document.createElement('canvas');
    this.paint(
      canvas,
      image,
      quad,
      tint,
      width,
      height,
      sourceWidth,
      sourceHeight,
      field ? undefined : source,
    );
    this.frames.set(hash, {
      canvas,
      source,
      key: k.slice(),
      pixels,
      used: ++this.frameClock,
    });
    this.framePixels += pixels;
    return canvas;
  }
  /** Paints one frame exactly as every snapshot and the scratch hold it. */
  private paint(
    canvas: HTMLCanvasElement,
    image: CanvasImageSource,
    quad: TextureQuad2D,
    tint: ArrayLike<number>,
    width: number,
    height: number,
    sourceWidth: number,
    sourceHeight: number,
    readable?: Texture2DSource,
  ): void {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext('2d')!;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    // Invert the central UV basis: packed clockwise frames are unrotated here.
    const a = (quad.ux * sourceWidth) / canvas.width;
    const b = (quad.vx * sourceHeight) / canvas.width;
    const c = (quad.uy * sourceWidth) / canvas.height;
    const d = (quad.vy * sourceHeight) / canvas.height;
    const det = a * d - b * c;
    const x = quad.u0 * sourceWidth,
      y = quad.v0 * sourceHeight;
    const tinted = tint[0] !== 1 || tint[1] !== 1 || tint[2] !== 1;
    // An integer-offset 1:1 copy reads back exactly the source's own pixels, so tint
    // those from one read of the source instead of reading back every painted frame.
    const pixels =
      tinted &&
      readable &&
      a === 1 &&
      d === 1 &&
      b === 0 &&
      c === 0 &&
      Number.isInteger(x) &&
      Number.isInteger(y)
        ? this.sourcePixels(readable)
        : undefined;
    if (pixels) {
      const out = context.createImageData(width, height),
        data = out.data,
        sw = readable!.width,
        x0 = Math.max(0, x),
        x1 = Math.min(sw, x + width);
      let exact = true;
      copy: for (let row = 0; row < height; row++) {
        const sy = y + row;
        if (sy < 0 || sy >= readable!.height || x0 >= x1) continue;
        for (
          let o = (row * width + x0 - x) * 4,
            s = (sy * sw + x0) * 4,
            end = s + (x1 - x0) * 4;
          s < end;
          o += 4, s += 4
        ) {
          const alpha = pixels[s + 3]!;
          if (alpha !== 0 && alpha !== 255) {
            exact = false;
            break copy;
          }
          data[o] = pixels[s]! * tint[0]!;
          data[o + 1] = pixels[s + 1]! * tint[1]!;
          data[o + 2] = pixels[s + 2]! * tint[2]!;
          data[o + 3] = alpha;
        }
      }
      if (exact) {
        context.putImageData(out, 0, 0);
        return;
      }
    }
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
    if (tinted) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] *= tint[0];
        pixels.data[i + 1] *= tint[1];
        pixels.data[i + 2] *= tint[2];
      }
      context.putImageData(pixels, 0, 0);
    }
  }
  /** The prepared source's pixels, read back once per version within the snapshot budget. */
  private sourcePixels(source: Texture2DSource): Uint8ClampedArray | undefined {
    const size = source.width * source.height;
    const prepared = this.sources.get(source);
    if (!prepared || size > rendering2dLimits.canvasFrameSnapshotPixels)
      return undefined;
    const cache = this.sourcePixelCache;
    let entry = cache.get(source);
    if (entry) {
      cache.delete(source);
      if (entry.version !== source.version) {
        this.sourcePixelTotal -= entry.pixels.length / 4;
        entry = undefined;
      }
    }
    if (!entry) {
      for (const [oldest, cached] of cache) {
        if (
          this.sourcePixelTotal + size <=
          rendering2dLimits.canvasFrameSnapshotPixels
        )
          break;
        cache.delete(oldest);
        this.sourcePixelTotal -= cached.pixels.length / 4;
      }
      entry = {
        version: source.version,
        pixels: prepared.canvas
          .getContext('2d')!
          .getImageData(0, 0, source.width, source.height).data,
      };
      this.sourcePixelTotal += size;
    }
    cache.set(source, entry);
    return entry.pixels;
  }
  private dropFrame(hash: number, snapshot: FrameSnapshot): HTMLCanvasElement {
    this.frames.delete(hash);
    this.framePixels -= snapshot.pixels;
    return snapshot.canvas;
  }
  private dropFrames(source?: Texture2DSource): void {
    for (const [hash, snapshot] of this.frames)
      if (!source || snapshot.source === source) {
        const canvas = this.dropFrame(hash, snapshot);
        canvas.width = canvas.height = 1;
      }
  }
  unload(source: Texture2DSource): void {
    const entry = this.sources.get(source);
    if (entry) entry.canvas.width = entry.canvas.height = 1;
    this.sources.delete(source);
    this.dropFrames(source);
    const pixels = this.sourcePixelCache.get(source);
    if (pixels) {
      this.sourcePixelCache.delete(source);
      this.sourcePixelTotal -= pixels.pixels.length / 4;
    }
  }
  destroy(): void {
    for (const source of this.sources.keys()) this.unload(source);
    this.dropFrames();
    if (this.scratch) this.scratch.width = this.scratch.height = 1;
    this.scratch = undefined;
  }
}

function sameKey(a: Float64Array, b: Float64Array): boolean {
  for (let i = 0; i < FRAME_KEY_LENGTH; i++) if (a[i] !== b[i]) return false;
  return true;
}
