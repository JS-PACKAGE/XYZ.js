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
  readonly hash: number;
  previous: FrameSnapshot | undefined;
  next: FrameSnapshot | undefined;
  pixels: number;
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
  private readonly pendingPixels = new Map<Texture2DSource, number>();
  private pixelBatch: HTMLCanvasElement | undefined;
  private batchX = 0;
  private batchY = 0;
  private batchRowHeight = 0;
  private scratch: HTMLCanvasElement | undefined;
  /**
   * Painted frames by key hash. A sub-frame or tint repainted into one shared scratch per
   * draw made every draw wait on that repaint (and a tint read it back); identical inputs
   * paint identical pixels, so a snapshot can be drawn again. A hash collision is a miss.
   */
  private readonly frames = new Map<number, FrameSnapshot>();
  // Map delete/set churn allocates; a long-lived iterator can retain obsolete
  // Map storage until eviction advances it. Keep hit recency on the snapshots.
  private oldestFrame: FrameSnapshot | undefined;
  private newestFrame: FrameSnapshot | undefined;
  private framePixels = 0;
  private readonly frameKey = new Float64Array(FRAME_KEY_LENGTH);
  private readonly frameWords = new Int32Array(this.frameKey.buffer);
  /** putImageData copies these bytes; painted snapshots never borrow this bounded scratch. */
  private tintPixels: ImageData | undefined;
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
  beginPixelBatch(): void {
    this.pendingPixels.clear();
    this.batchX = this.batchY = this.batchRowHeight = 0;
  }
  canBatchPixels(source: Texture2DSource): boolean {
    const dimension = rendering2dLimits.canvasReadbackBatchDimension;
    return (
      source.kind !== 'render' &&
      source.kind !== 'native' &&
      source.width <= dimension &&
      source.height <= dimension &&
      this.sourcePixelCache.get(source)?.version !== source.version &&
      !this.pendingPixels.has(source) &&
      !(source instanceof Texture && getTextureDistanceField(source))
    );
  }
  /** Collect only small, uncached 1:1 tinted sources; larger/resampled frames stay lazy. */
  queuePixels(
    source: Texture2DSource,
    quad: TextureQuad2D,
    tint: ArrayLike<number>,
  ): void {
    const dimension = rendering2dLimits.canvasReadbackBatchDimension;
    if (
      (tint[0] === 1 && tint[1] === 1 && tint[2] === 1) ||
      !this.canBatchPixels(source)
    )
      return;
    const width = Math.max(1, Math.round(quad.trimWidth * quad.resolution)),
      height = Math.max(1, Math.round(quad.trimHeight * quad.resolution));
    if (
      width * height > rendering2dLimits.canvasFrameSnapshotPixels ||
      !integerCopy(
        (quad.ux * source.width) / width,
        (quad.vx * source.height) / width,
        (quad.uy * source.width) / height,
        (quad.vy * source.height) / height,
        quad.u0 * source.width,
        quad.v0 * source.height,
      )
    )
      return;
    let x = this.batchX,
      y = this.batchY,
      rowHeight = this.batchRowHeight;
    if (x + source.width > dimension) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    // Do not prefetch beyond one atlas: a large scene must not evict an entire live pixel cache.
    if (y + source.height > dimension) return;
    this.pendingPixels.set(source, y * dimension + x);
    this.batchX = x + source.width;
    this.batchY = y;
    this.batchRowHeight = Math.max(rowHeight, source.height);
  }
  flushPixelBatch(): void {
    try {
      if (this.pendingPixels.size < 2) return;
      const dimension = rendering2dLimits.canvasReadbackBatchDimension;
      const canvas = (this.pixelBatch ??= document.createElement('canvas'));
      if (canvas.width !== dimension) canvas.width = dimension;
      if (canvas.height !== dimension) canvas.height = dimension;
      const context = canvas.getContext('2d')!;
      const height = this.batchY + this.batchRowHeight;
      context.clearRect(0, 0, dimension, height);
      for (const source of this.pendingPixels.keys()) {
        const offset = this.pendingPixels.get(source)!;
        context.drawImage(
          this.prepare(source),
          offset % dimension,
          Math.floor(offset / dimension),
        );
      }
      // Integer 1:1 copies preserve the premultiplied texels. One fence/read replaces N
      // separate GPU readbacks; each cached source still owns exactly its original pixel area.
      const atlas = context.getImageData(0, 0, dimension, height).data;
      for (const source of this.pendingPixels.keys()) {
        const offset = this.pendingPixels.get(source)!;
        const pixels = new Uint8ClampedArray(source.width * source.height * 4);
        for (let row = 0; row < source.height; row++) {
          const start = (offset + row * dimension) * 4;
          const target = row * source.width * 4;
          for (let col = 0; col < source.width * 4; col++)
            pixels[target + col] = atlas[start + col]!;
        }
        this.cachePixels(source, pixels);
      }
    } finally {
      this.pendingPixels.clear();
    }
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
      if (hit !== this.newestFrame) {
        this.unlinkFrame(hit);
        this.appendFrame(hit);
      }
      return hit.canvas;
    }
    const pixels = width * height;
    let canvas: HTMLCanvasElement | undefined;
    if (hit) canvas = this.dropFrame(hit);
    while (
      this.frames.size >= rendering2dLimits.canvasFrameSnapshots ||
      this.framePixels + pixels > rendering2dLimits.canvasFrameSnapshotPixels
    ) {
      const evicted = this.dropFrame(this.oldestFrame!);
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
    const snapshot: FrameSnapshot = {
      canvas,
      source,
      key: k.slice(),
      hash,
      previous: undefined,
      next: undefined,
      pixels,
    };
    this.frames.set(hash, snapshot);
    this.appendFrame(snapshot);
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
    // Invert the central UV basis: packed clockwise frames are unrotated here.
    const a = (quad.ux * sourceWidth) / canvas.width;
    const b = (quad.vx * sourceHeight) / canvas.width;
    const c = (quad.uy * sourceWidth) / canvas.height;
    const d = (quad.vy * sourceHeight) / canvas.height;
    const det = a * d - b * c;
    const x = quad.u0 * sourceWidth,
      y = quad.v0 * sourceHeight;
    const tinted = tint[0] !== 1 || tint[1] !== 1 || tint[2] !== 1;
    // An integer-offset 1:1 copy reads back exactly the source's own pixels (the copy holds
    // the same premultiplied texels, so it unpremultiplies to the same values at any alpha),
    // so tint those from one read of the source instead of reading back every painted frame.
    const pixels =
      tinted && readable && integerCopy(a, b, c, d, x, y)
        ? this.sourcePixels(readable)
        : undefined;
    if (pixels) {
      let out = this.tintPixels;
      if (!out || out.width !== width || out.height !== height)
        out = this.tintPixels = context.createImageData(width, height);
      const data = out.data,
        r = tint[0]!,
        g = tint[1]!,
        b = tint[2]!,
        sw = readable!.width,
        sh = readable!.height,
        x0 = Math.max(0, x),
        x1 = Math.min(sw, x + width);
      if (x < 0 || y < 0 || x + width > sw || y + height > sh) data.fill(0);
      for (let row = 0; row < height; row++) {
        const sy = y + row;
        if (sy < 0 || sy >= sh || x0 >= x1) continue;
        for (
          let o = (row * width + x0 - x) * 4,
            s = (sy * sw + x0) * 4,
            end = s + (x1 - x0) * 4;
          s < end;
          o += 4, s += 4
        ) {
          data[o] = pixels[s]! * r;
          data[o + 1] = pixels[s + 1]! * g;
          data[o + 2] = pixels[s + 2]! * b;
          data[o + 3] = pixels[s + 3]!;
        }
      }
      context.putImageData(out, 0, 0);
      return;
    }
    // putImageData replaces the full frame; only the drawImage path needs clearing.
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
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
      const pixels = prepared.canvas
        .getContext('2d')!
        .getImageData(0, 0, source.width, source.height).data;
      this.cachePixels(source, pixels);
      return pixels;
    }
    cache.set(source, entry);
    return entry.pixels;
  }
  private cachePixels(
    source: Texture2DSource,
    pixels: Uint8ClampedArray,
  ): void {
    const cache = this.sourcePixelCache;
    const previous = cache.get(source);
    if (previous) {
      this.sourcePixelTotal -= previous.pixels.length / 4;
      cache.delete(source);
    }
    const size = pixels.length / 4;
    for (const oldest of cache.keys()) {
      if (
        this.sourcePixelTotal + size <=
        rendering2dLimits.canvasFrameSnapshotPixels
      )
        break;
      this.sourcePixelTotal -= cache.get(oldest)!.pixels.length / 4;
      cache.delete(oldest);
    }
    cache.set(source, { version: source.version, pixels });
    this.sourcePixelTotal += size;
  }
  private appendFrame(snapshot: FrameSnapshot): void {
    snapshot.previous = this.newestFrame;
    snapshot.next = undefined;
    if (this.newestFrame) this.newestFrame.next = snapshot;
    else this.oldestFrame = snapshot;
    this.newestFrame = snapshot;
  }
  private unlinkFrame(snapshot: FrameSnapshot): void {
    const previous = snapshot.previous,
      next = snapshot.next;
    if (previous) previous.next = next;
    else this.oldestFrame = next;
    if (next) next.previous = previous;
    else this.newestFrame = previous;
    snapshot.previous = snapshot.next = undefined;
  }
  private dropFrame(snapshot: FrameSnapshot): HTMLCanvasElement {
    this.frames.delete(snapshot.hash);
    this.unlinkFrame(snapshot);
    this.framePixels -= snapshot.pixels;
    return snapshot.canvas;
  }
  private dropFrames(source?: Texture2DSource): void {
    for (const snapshot of this.frames.values())
      if (!source || snapshot.source === source) {
        const canvas = this.dropFrame(snapshot);
        canvas.width = canvas.height = 1;
      }
  }
  unload(source: Texture2DSource): void {
    const entry = this.sources.get(source);
    if (entry) entry.canvas.width = entry.canvas.height = 1;
    this.pendingPixels.delete(source);
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
    this.tintPixels = undefined;
    this.pendingPixels.clear();
    if (this.pixelBatch) this.pixelBatch.width = this.pixelBatch.height = 1;
    this.pixelBatch = undefined;
  }
}

function sameKey(a: Float64Array, b: Float64Array): boolean {
  for (let i = 0; i < FRAME_KEY_LENGTH; i++) if (a[i] !== b[i]) return false;
  return true;
}

function integerCopy(
  a: number,
  b: number,
  c: number,
  d: number,
  x: number,
  y: number,
): boolean {
  return (
    a === 1 &&
    d === 1 &&
    b === 0 &&
    c === 0 &&
    Number.isInteger(x) &&
    Number.isInteger(y)
  );
}
