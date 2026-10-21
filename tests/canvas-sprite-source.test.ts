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

class FakeContext {
  readonly getImageData = vi.fn(
    (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4).fill(200),
    }),
  );
  readonly putImageData = vi.fn();
  readonly drawImage = vi.fn();
  imageSmoothingEnabled = true;
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
  vi.stubGlobal('document', {
    createElement: () => {
      const canvas = new FakeCanvas();
      canvases.push(canvas);
      return canvas;
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

/** Tinted paints read their frame back once each. */
function paints(): number {
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
    expect(tinted.context.putImageData.mock.calls[0]![0].data[1]).toBe(100);
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

  it('evicts the least recently drawn snapshot when the budget is full', () => {
    const texture = new Texture({
      width: 8,
      height: 8,
      close() {},
    } as ImageBitmap);
    const source = sprites();
    const frame = quad(texture, 0, 4);
    const tints = Array.from(
      { length: rendering2dLimits.canvasFrameSnapshots + 1 },
      (_, i) => [1, i / 1024, 1, 1],
    );
    for (let i = 0; i < tints.length - 1; i++)
      source.image(texture, frame, tints[i]!);
    // Drawing the first again makes the second the least recently drawn.
    source.image(texture, frame, tints[0]!);
    source.image(texture, frame, tints.at(-1)!);
    const painted = paints();
    expect(painted).toBe(tints.length);
    source.image(texture, frame, tints[0]!);
    expect(paints()).toBe(painted);
    source.image(texture, frame, tints[1]!);
    expect(paints()).toBe(painted + 1);
    // Evicted canvases are repainted instead of allocated.
    expect(canvases.length).toBeLessThanOrEqual(
      rendering2dLimits.canvasFrameSnapshots + 1,
    );
  });
});
