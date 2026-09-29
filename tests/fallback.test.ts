import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRenderer,
  WebGPUInitializationError,
  UnsupportedGraphicsError,
} from '../packages/graphics/src/index.js';

class Canvas {
  width = 64;
  height = 64;
  bound: string | undefined;
  getContext(type: string): object | null {
    if (this.bound && this.bound !== type) return null;
    if (type === 'webgl2') return null;
    this.bound = type;
    if (type === 'webgpu')
      return {
        configure() {
          throw new Error('configure failed after binding');
        },
        unconfigure() {},
      };
    return {};
  }
}
function setup(gpu: boolean): void {
  vi.stubGlobal('document', { createElement: () => new Canvas() });
  vi.stubGlobal(
    'navigator',
    gpu
      ? {
          gpu: {
            requestAdapter: async () => ({
              requestDevice: async () => ({
                limits: { maxTextureDimension2D: 4096 },
                lost: new Promise(() => {}),
                addEventListener() {},
                pushErrorScope() {},
                async popErrorScope() {
                  return null;
                },
                destroy() {},
              }),
            }),
            getPreferredCanvasFormat: () => 'bgra8unorm',
          },
        }
      : {},
  );
}
afterEach(() => vi.unstubAllGlobals());
describe('automatic backend isolation', () => {
  it('falls back after WebGPU binds and configure fails without poisoning the user canvas', async () => {
    setup(true);
    const canvas = new Canvas();
    const renderer = await createRenderer(
      canvas as unknown as HTMLCanvasElement,
      'auto',
      () => {},
    );
    expect(renderer.backend).toBe('canvas2d');
    expect(renderer.capabilities.threeD).toBe(false);
    expect(canvas.bound).toBe('2d');
    renderer.resize(128, 80);
    expect([canvas.width, canvas.height]).toEqual([128, 80]);
    renderer.destroy();
  });
  it('does not silently fall back when WebGPU was explicitly requested', async () => {
    setup(true);
    const canvas = new Canvas();
    await expect(
      createRenderer(
        canvas as unknown as HTMLCanvasElement,
        'webgpu',
        () => {},
      ),
    ).rejects.toBeInstanceOf(WebGPUInitializationError);
    expect(canvas.bound).toBe('webgpu');
  });
  it('reports unavailable when all contexts fail', async () => {
    setup(false);
    vi.stubGlobal('document', {
      createElement: () => ({ width: 64, height: 64, getContext: () => null }),
    });
    await expect(
      createRenderer(
        new Canvas() as unknown as HTMLCanvasElement,
        'auto',
        () => {},
      ),
    ).rejects.toBeInstanceOf(UnsupportedGraphicsError);
  });
});
