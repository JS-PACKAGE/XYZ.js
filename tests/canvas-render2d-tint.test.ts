import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { IsolatedGroup2D } from '../packages/core/src/rendering2d/isolated-group.js';
import { CanvasRender2D } from '../packages/graphics/src/canvas-render2d.js';
import { CanvasSpriteSource } from '../packages/graphics/src/canvas-sprite-source.js';
import { RenderCommandBuffer2D } from '../packages/graphics/src/render2d-contract.js';
import { FrameStats } from '../packages/graphics/src/render-stats.js';

class FakeContext {
  readonly getImageData = vi.fn(
    (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4).fill(200),
    }),
  );
  readonly putImageData = vi.fn();
  readonly drawImage = vi.fn();
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
  setTransform(): void {}
  clearRect(): void {}
  constructor(readonly canvas: FakeCanvas) {}
}
class FakeCanvas {
  width = 300;
  height = 150;
  readonly context = new FakeContext(this);
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

function readbacks(): number {
  return canvases.reduce(
    (sum, canvas) => sum + canvas.context.getImageData.mock.calls.length,
    0,
  );
}

describe('CanvasRender2D tinted layers', () => {
  function setup(cacheAsTexture: boolean) {
    const stats = new FrameStats();
    const sources = new CanvasSpriteSource(() => {
      throw new Error('Layer test draws no sprites.');
    });
    const renderer = new CanvasRender2D(sources, stats);
    const scene = new Scene();
    const group = scene.add(new IsolatedGroup2D());
    group.cacheAsTexture = cacheAsTexture;
    group.isolate = true;
    group.tint = [0.5, 1, 1, 1];
    const commands = new RenderCommandBuffer2D();
    commands.appendLayer(group);
    const target = new FakeCanvas();
    const draw = (): void =>
      renderer.draw(
        target.context as unknown as CanvasRenderingContext2D,
        commands,
        scene,
        1,
        1,
      );
    return { stats, group, draw, target };
  }

  it('reuses the tinted copy of an unchanged cached layer', () => {
    const { group, draw, target } = setup(true);
    draw();
    draw();
    draw();
    expect(readbacks()).toBe(1);
    const composite = target.context.drawImage.mock.calls.map(
      (call) => call[0],
    );
    expect(new Set(composite).size).toBe(1);
    const tinted = canvases.find(
      (canvas) => canvas.context.putImageData.mock.calls.length,
    );
    expect(composite[0]).toBe(tinted);
    expect(tinted!.context.putImageData.mock.calls[0]![0].data[0]).toBe(100);

    group.tint = [0.25, 1, 1, 1];
    draw();
    expect(readbacks()).toBe(2);
    group.updateCache();
    draw();
    expect(readbacks()).toBe(3);
    draw();
    expect(readbacks()).toBe(3);
  });

  it('retints every frame when the layer is redrawn every frame', () => {
    const { draw } = setup(false);
    draw();
    draw();
    expect(readbacks()).toBe(2);
  });

  it('releases the tinted copy once the layer composites untinted', () => {
    const { stats, group, draw, target } = setup(true);
    draw();
    const tinted = target.context.drawImage.mock.calls[0]![0] as FakeCanvas;
    const layerBytes = 4;
    expect(stats.renderTargetBytes).toBe(2 * layerBytes);
    group.tint = [1, 1, 1, 1];
    draw();
    expect(stats.renderTargetBytes).toBe(layerBytes);
    expect(target.context.drawImage.mock.calls[1]![0]).not.toBe(tinted);
    group.tint = [0.5, 1, 1, 1];
    draw();
    expect(readbacks()).toBe(2);
  });
});
