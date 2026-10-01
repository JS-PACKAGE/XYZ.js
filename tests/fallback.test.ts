import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../packages/core/src/logger.js';
import {
  createRenderer,
  WebGPUInitializationError,
  UnsupportedGraphicsError,
} from '../packages/graphics/src/index.js';

class Canvas extends EventTarget {
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
              features: new Set<string>(),
              requestDevice: async () => ({
                features: new Set<string>(),
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
afterEach(() => {
  logger.level = 'warn';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
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
  it('reports automatic fallback and successful backend at configured levels', async () => {
    setup(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.level = 'info';
    const renderer = await createRenderer(
      new Canvas() as unknown as HTMLCanvasElement,
      'auto',
      () => {},
    );
    expect(renderer.backend).toBe('canvas2d');
    expect(warn).toHaveBeenCalledTimes(2);
    expect(
      warn.mock.calls.every(
        (args) => args[0] === '[XYZ]' && args[2] instanceof Error,
      ),
    ).toBe(true);
    expect(info).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
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
