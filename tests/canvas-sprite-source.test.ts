import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CanvasTexture2D,
  Texture,
  type Texture2DSource,
} from '../packages/assets/src/index.js';
import { CanvasSpriteSource } from '../packages/graphics/src/canvas-sprite-source.js';
import {
  createTextureQuad2D,
  getTextureQuad2D,
  type TextureQuad2D,
} from '../packages/graphics/src/sprite-instance.js';
import { rendering2dLimits } from '../src/data/rendering2d.js';

/** Alpha of every pixel the fake canvases read back; RGB falls with the pixel index. */
let readAlpha: (pixel: number) => number;
class FakeContext {
  readonly getImageData = vi.fn(
    (_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i++)
        data[i] = (i & 3) === 3 ? readAlpha(i >> 2) : 200 - ((i >> 2) % 100);
      return { data };
    },
  );
  readonly painted: Uint8ClampedArray[] = [];
  readonly putImageData = vi.fn((image: { data: Uint8ClampedArray }) => {
    this.painted.push(image.data.slice());
  });
  readonly drawImage = vi.fn();
  imageSmoothingEnabled = true;
  createImageData(
    width: number,
    height: number,
  ): { width: number; height: number; data: Uint8ClampedArray } {
    return { width, height, data: new Uint8ClampedArray(width * height * 4) };
  }
  setTransform(): void {}
  clearRect(): void {}
}
class FakeCanvas {
  width = 300;
  height = 150;
  readonly context = new FakeContext();
  getContext(): FakeContext {
    return this.context;
  }
}

let canvases: FakeCanvas[];
beforeEach(() => {
  canvases = [];
  readAlpha = () => 200;
  vi.stubGlobal('document', {
    createElement: () => {
      const canvas = new FakeCanvas();
      canvases.push(canvas);
      return canvas;
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

/** Every tinted paint writes its pixels once. */
function paints(): number {
  return canvases.reduce(
    (sum, canvas) => sum + canvas.context.putImageData.mock.calls.length,
    0,
  );
}
function readbacks(): number {
  return canvases.reduce(
    (sum, canvas) => sum + canvas.context.getImageData.mock.calls.length,
    0,
  );
}
function quad(
  texture: Texture2DSource,
  x: number,
  width: number,
): TextureQuad2D {
  return getTextureQuad2D(
    texture,
    undefined,
    { x, y: 0, width, height: texture.height },
    createTextureQuad2D(),
  );
}
function sprites(): CanvasSpriteSource {
  return new CanvasSpriteSource(() => {
    throw new Error('No render targets are drawn.');
  });
}
/**
 * Non-white tints that paint pairwise different frames from the fake pixels (levels
 * 137–200): per channel, steps of 1/64 move every level's rounded product by 2 or more.
 */
function distinctTint(i: number): number[] {
  return [
    (i % 64) / 64,
    (Math.floor(i / 64) % 64) / 64,
    Math.floor(i / 4096) / 64,
    1,
  ];
}

describe('Canvas2D painted frame snapshots', () => {
  it('redraws an unchanged tinted sub-frame without repainting it', () => {
    const texture = new Texture({
      width: 8,
      height: 8,
      close() {},
    } as ImageBitmap);
    const source = sprites();
    const left = quad(texture, 0, 4),
      right = quad(texture, 4, 4);
    const red = [1, 0.5, 0.5, 1];
    const first = source.image(texture, left, red);
    const tinted = first as unknown as FakeCanvas;
    expect(tinted.context.painted[0]![1]).toBe(100);
    expect(source.image(texture, left, red)).toBe(first);
    expect(paints()).toBe(1);
    expect(source.image(texture, right, red)).not.toBe(first);
    // Each channel alone distinguishes a snapshot.
    for (const other of [
      [0.25, 0.5, 0.5, 1],
      [1, 0.25, 0.5, 1],
      [1, 0.5, 0.25, 1],
    ])
      expect(source.image(texture, left, other)).not.toBe(first);
    expect(paints()).toBe(5);
    expect(source.image(texture, left, red)).toBe(first);
    expect(paints()).toBe(5);
  });

  it('repaints after a source update or unload', () => {
    const texture = new CanvasTexture2D({
      width: 8,
      height: 8,
    } as HTMLCanvasElement);
    const source = sprites();
    const tint = [0.5, 1, 1, 1];
    source.image(texture, quad(texture, 0, 4), tint);
    texture.update({ width: 8, height: 8 } as HTMLCanvasElement);
    source.image(texture, quad(texture, 0, 4), tint);
    expect(paints()).toBe(2);
    source.image(texture, quad(texture, 0, 4), tint);
    expect(paints()).toBe(2);
    source.unload(texture);
    source.image(texture, quad(texture, 0, 4), tint);
    expect(paints()).toBe(3);
  });

  it('preserves LRU eviction after unloading or replacing the cached source', () => {
    const texture = new CanvasTexture2D({
      width: 8,
      height: 8,
    } as HTMLCanvasElement);
    const source = sprites();
    const frame = quad(texture, 0, 4);
    const capacity = rendering2dLimits.canvasFrameSnapshots;
    // Distinct non-white tints: a white tint takes the untinted path and paints nothing.
    const tints = Array.from({ length: capacity + 1 }, (_, i) =>
      distinctTint(i),
    );
    for (let cycle = 0; cycle < 3; cycle++) {
      const previousCanvases = canvases.length,
        previousPaints = paints();
      for (let i = 0; i < tints.length - 1; i++)
        source.image(texture, frame, tints[i]!);
      // Drawing the first again makes the second the least recently drawn.
      source.image(texture, frame, tints[0]!);
      source.image(texture, frame, tints.at(-1)!);
      const painted = paints();
      expect(painted - previousPaints).toBe(tints.length);
      source.image(texture, frame, tints[0]!);
      expect(paints()).toBe(painted);
      source.image(texture, frame, tints[1]!);
      expect(paints()).toBe(painted + 1);
      // Evicted canvases are repainted instead of allocated.
      expect(canvases.length - previousCanvases).toBeLessThanOrEqual(
        capacity + 1,
      );
      if (cycle === 0) source.unload(texture);
      if (cycle === 1)
        texture.update({ width: 8, height: 8 } as HTMLCanvasElement);
    }
    source.destroy();
    texture.destroy();
  });

  it('keeps retained frames ordered when unload removes the oldest, middle and newest frames', () => {
    const a = new CanvasTexture2D({ width: 8, height: 8 } as HTMLCanvasElement),
      b = new CanvasTexture2D({ width: 8, height: 8 } as HTMLCanvasElement);
    const source = sprites(),
      frameA = quad(a, 0, 4),
      frameB = quad(b, 0, 4),
      capacity = rendering2dLimits.canvasFrameSnapshots,
      middle = Math.floor(capacity / 2);
    const tints = Array.from({ length: capacity + 3 }, (_, i) =>
      distinctTint(i),
    );
    const removed = new Set([0, middle, capacity - 1]);
    const frames = tints
      .slice(0, capacity)
      .map(
        (tint, i) =>
          source.image(
            removed.has(i) ? a : b,
            removed.has(i) ? frameA : frameB,
            tint,
          ) as unknown as FakeCanvas,
      );
    source.unload(a);
    for (const i of removed)
      expect([frames[i]!.width, frames[i]!.height]).toEqual([1, 1]);

    // Promote both the oldest and an interior survivor; repeating the newest is a hit.
    for (const i of [1, middle + 1, middle + 1])
      expect(source.image(b, frameB, tints[i]!)).toBe(frames[i]);
    const refilled = tints
      .slice(capacity)
      .map((tint) => source.image(a, frameA, tint) as unknown as FakeCanvas);
    const replacement = source.image(a, frameA, [0.5, 0.5, 0.5, 1]);
    expect(replacement).toBe(frames[2]);
    expect(frames[2]!.context.painted.at(-1)!.slice(0, 4)).toEqual(
      new Uint8ClampedArray([100, 100, 100, 200]),
    );
    for (const i of [1, middle + 1])
      expect(source.image(b, frameB, tints[i]!)).toBe(frames[i]);

    source.destroy();
    for (const frame of [...frames, ...refilled])
      expect([frame.width, frame.height]).toEqual([1, 1]);
    a.destroy();
    b.destroy();
  });

  it('shares one frame between tints that round every source level alike', () => {
    const texture = new CanvasTexture2D({
      width: 8,
      height: 8,
    } as HTMLCanvasElement);
    const source = sprites();
    const frame = quad(texture, 0, 4);
    // Levels 137–200 times 0.6 have fractional parts of at most 0.4, which 0.6004 raises by
    // under 0.08, so both round alike; 0.61 moves 200 from 120 to 122 and paints its own.
    const first = source.image(texture, frame, [0.6, 1, 1, 1]);
    expect(source.image(texture, frame, [0.6004, 1, 1, 1])).toBe(first);
    expect(paints()).toBe(1);
    const second = source.image(texture, frame, [0.61, 1, 1, 1]);
    expect(second).not.toBe(first);
    expect(paints()).toBe(2);
    const painted = (canvas: unknown): Uint8ClampedArray =>
      (canvas as FakeCanvas).context.painted.at(-1)!;
    expect(painted(first)[0]).toBe(120);
    expect(painted(second)[0]).toBe(122);
    // The same tints through a non-integer copy read the frame back and key on the floats.
    const scaled = getTextureQuad2D(
      texture,
      undefined,
      { x: 0.5, y: 0, width: 4, height: 8 },
      createTextureQuad2D(),
    );
    const resampled = source.image(texture, scaled, [0.6, 1, 1, 1]);
    expect(source.image(texture, scaled, [0.6004, 1, 1, 1])).not.toBe(
      resampled,
    );
    expect(paints()).toBe(4);
    source.destroy();
    texture.destroy();
  });

  it('evicts multiple least-recent frames to fit the pixel budget', () => {
    const height = 1024,
      width = Math.floor(
        rendering2dLimits.canvasFrameSnapshotPixels / (4 * height),
      );
    const texture = new CanvasTexture2D({
      width: width * 4,
      height,
    } as HTMLCanvasElement);
    const source = sprites(),
      tint = [1, 1, 1, 1];
    const quads = Array.from({ length: 4 }, (_, i) =>
      quad(texture, i * width, width),
    );
    const frames = quads.map(
      (frame) => source.image(texture, frame, tint) as unknown as FakeCanvas,
    );
    expect(source.image(texture, quads[0]!, tint)).toBe(frames[0]);
    const large = source.image(texture, quad(texture, 0, width * 3), tint);
    expect(large).toBe(frames[1]);
    expect([frames[1]!.width, frames[1]!.height]).toEqual([width * 3, height]);
    for (const frame of frames.slice(2))
      expect([frame.width, frame.height]).toEqual([1, 1]);
    expect(source.image(texture, quads[0]!, tint)).toBe(frames[0]);
    source.destroy();
    for (const frame of frames)
      expect([frame.width, frame.height]).toEqual([1, 1]);
    texture.destroy();
  });

  it('tints 1:1 frames from one read of their source', () => {
    readAlpha = (pixel) => (pixel % 2 ? 255 : 0);
    const texture = new CanvasTexture2D({
      width: 8,
      height: 8,
    } as HTMLCanvasElement);
    const source = sprites();
    const left = source.image(texture, quad(texture, 0, 4), [0.5, 1, 1, 1]);
    const right = source.image(texture, quad(texture, 4, 4), [0.25, 1, 1, 1]);
    const lower = source.image(
      texture,
      getTextureQuad2D(
        texture,
        undefined,
        { x: 4, y: 2, width: 4, height: 4 },
        createTextureQuad2D(),
      ),
      [0.25, 1, 1, 1],
    );
    source.image(texture, quad(texture, 0, 4), [1, 0.5, 1, 1]);
    expect(paints()).toBe(4);
    expect(readbacks()).toBe(1);
    const written = (canvas: HTMLCanvasElement): Uint8ClampedArray =>
      (canvas as unknown as FakeCanvas).context.painted[0]!;
    // Source pixel (x, y) has red 200 - (y * 8 + x); alpha passes through.
    expect(Array.from(written(left).subarray(0, 8))).toEqual([
      100, 200, 200, 0, 100, 199, 199, 255,
    ]);
    expect(written(right)[0]).toBe(49);
    expect(written(right)[16]).toBe(47);
    expect(written(lower)[0]).toBe(45);
    // Scaled or half-pixel frames are resampled, so they read back their own paint.
    source.image(texture, { ...quad(texture, 0, 4), ux: 1 }, [0.5, 1, 1, 1]);
    source.image(
      texture,
      { ...quad(texture, 0, 4), v0: 1 / 16 },
      [0.5, 1, 1, 1],
    );
    expect(readbacks()).toBe(3);
    texture.update({ width: 8, height: 8 } as HTMLCanvasElement);
    source.image(texture, quad(texture, 0, 4), [0.5, 1, 1, 1]);
    expect(readbacks()).toBe(4);
  });

  it('preserves source-pixel recency through repeated hits, eviction and unload', () => {
    const width = 1024,
      height = rendering2dLimits.canvasFrameSnapshotPixels / (2 * width);
    const textures = Array.from(
      { length: 3 },
      () => new CanvasTexture2D({ width, height } as HTMLCanvasElement),
    );
    const [a, b, c] = textures as [
      CanvasTexture2D,
      CanvasTexture2D,
      CanvasTexture2D,
    ];
    const source = sprites();
    let tint = 0.1;
    const draw = (texture: CanvasTexture2D): void => {
      tint += 0.01;
      const canvas = source.image(
        texture,
        getTextureQuad2D(
          texture,
          undefined,
          { x: 0, y: 0, width: 1, height: 1 },
          createTextureQuad2D(),
        ),
        [tint, 1, 1, 1],
      ) as unknown as FakeCanvas;
      expect(Array.from(canvas.context.painted.at(-1)!)).toEqual([
        Math.round(200 * tint),
        200,
        200,
        200,
      ]);
    };
    draw(a);
    draw(b);
    draw(a);
    draw(a);
    expect(readbacks()).toBe(2);
    draw(c);
    draw(a);
    expect(readbacks()).toBe(3);
    draw(b);
    expect(readbacks()).toBe(4);
    source.unload(b);
    draw(a);
    expect(readbacks()).toBe(4);
    draw(b);
    expect(readbacks()).toBe(5);
    source.destroy();
    for (const texture of textures) texture.destroy();
  });

  it('tints semi-transparent 1:1 frames from the same single source read', () => {
    const texture = new CanvasTexture2D({
      width: 8,
      height: 8,
    } as HTMLCanvasElement);
    const source = sprites();
    const first = source.image(texture, quad(texture, 0, 4), [0.5, 1, 1, 1]);
    source.image(texture, quad(texture, 4, 4), [0.5, 1, 1, 1]);
    source.image(texture, quad(texture, 0, 4), [0.25, 1, 1, 1]);
    expect(paints()).toBe(3);
    expect(readbacks()).toBe(1);
    const data = (first as unknown as FakeCanvas).context.painted[0]!;
    // Red 200 - pixel halves; the partial alpha 200 passes through unchanged.
    expect(Array.from(data.subarray(0, 8))).toEqual([
      100, 200, 200, 200, 100, 199, 199, 200,
    ]);
  });

  it('keeps batched source rows separate across updates, transparent reuse and unload', () => {
    const storage = new WeakMap<FakeCanvas, Uint8ClampedArray>();
    const pixels = (canvas: FakeCanvas): Uint8ClampedArray => {
      let data = storage.get(canvas);
      if (!data || data.length !== canvas.width * canvas.height * 4) {
        data = new Uint8ClampedArray(canvas.width * canvas.height * 4);
        storage.set(canvas, data);
      }
      return data;
    };
    const bitmap = (
      width: number,
      height: number,
      color?: number[],
    ): FakeCanvas => {
      const canvas = new FakeCanvas();
      canvas.width = width;
      canvas.height = height;
      canvas.context.clearRect = () => pixels(canvas).fill(0);
      canvas.context.drawImage.mockImplementation(
        (image: FakeCanvas, x: number, y: number) => {
          const input = pixels(image),
            output = pixels(canvas);
          for (let row = 0; row < image.height; row++)
            for (let col = 0; col < image.width; col++) {
              const from = (row * image.width + col) * 4,
                to = ((y + row) * canvas.width + x + col) * 4;
              // Transparent source-over texels must not erase stale atlas contents.
              if (input[from + 3] === 0) continue;
              for (let channel = 0; channel < 4; channel++)
                output[to + channel] = input[from + channel]!;
            }
        },
      );
      canvas.context.getImageData.mockImplementation((x, y, w, h) => {
        const data = new Uint8ClampedArray(w * h * 4),
          input = pixels(canvas);
        for (let row = 0; row < h; row++)
          for (let col = 0; col < w * 4; col++)
            data[row * w * 4 + col] =
              input[((y + row) * canvas.width + x) * 4 + col]!;
        return { data };
      });
      if (color)
        for (let i = 0; i < width * height * 4; i += 4)
          pixels(canvas).set(color, i);
      return canvas;
    };
    vi.stubGlobal('document', { createElement: () => bitmap(300, 150) });
    const texture = (w: number, h: number, color?: number[]): CanvasTexture2D =>
      new CanvasTexture2D(bitmap(w, h, color) as unknown as HTMLCanvasElement);
    const a = texture(200, 2, [200, 60, 30, 128]),
      b = texture(100, 3, [40, 160, 20, 255]),
      transparent = texture(130, 3);
    const source = sprites(),
      tint = [0.5, 1, 1, 1];
    const batch = (textures: CanvasTexture2D[]): void => {
      source.beginPixelBatch();
      for (const t of textures)
        source.queuePixels(t, quad(t, 0, t.width), tint);
      source.flushPixelBatch();
    };
    const expectColor = (t: CanvasTexture2D, color: number[]): void => {
      const painted = source.image(
        t,
        quad(t, 0, t.width),
        tint,
      ) as unknown as FakeCanvas;
      const expected = new Uint8ClampedArray(t.width * t.height * 4);
      for (let i = 0; i < expected.length; i += 4) expected.set(color, i);
      expect(painted.context.painted.at(-1)).toEqual(expected);
    };
    batch([a, b]);
    expectColor(a, [100, 60, 30, 128]);
    expectColor(b, [20, 160, 20, 255]);
    b.update(bitmap(70, 5, [80, 20, 100, 64]) as unknown as HTMLCanvasElement);
    source.unload(a);
    batch([transparent, b, a]);
    expectColor(transparent, [0, 0, 0, 0]);
    expectColor(b, [40, 20, 100, 64]);
    expectColor(a, [100, 60, 30, 128]);
    source.destroy();
    a.destroy();
    b.destroy();
    transparent.destroy();
  });
});
