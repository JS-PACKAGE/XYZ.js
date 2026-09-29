import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRenderer,
  type RendererPreference,
} from '../packages/graphics/src/index.js';
import {
  GraphicsBackendUnavailableError,
  GraphicsError,
} from '../packages/graphics/src/errors.js';
import { WebGPURenderer } from '../packages/graphics/src/webgpu-renderer.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function gpuFixture() {
  let width = 128;
  let height = 64;
  let mutations = 0;
  let destroyed = 0;
  let configurations = 0;
  const context = {
    configure() {
      configurations++;
    },
    unconfigure() {},
  };
  const canvas = {
    get width() {
      return width;
    },
    set width(value: number) {
      width = value;
      mutations++;
    },
    get height() {
      return height;
    },
    set height(value: number) {
      height = value;
      mutations++;
    },
    getContext() {
      return context;
    },
  } as unknown as HTMLCanvasElement;
  const device = {
    limits: { maxTextureDimension2D: 4096 },
    lost: new Promise<GPUDeviceLostInfo>(() => {}),
    addEventListener() {},
    pushErrorScope() {},
    async popErrorScope() {
      return null;
    },
    createShaderModule() {
      return {
        async getCompilationInfo() {
          return { messages: [] };
        },
      };
    },
    createRenderPipeline() {
      return {};
    },
    destroy() {
      destroyed++;
    },
  } as unknown as GPUDevice;
  const installGPU = (requestDevice: () => Promise<GPUDevice>) => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: async () => ({ requestDevice }),
        getPreferredCanvasFormat: () => 'bgra8unorm',
      },
    });
  };
  return {
    canvas,
    device,
    installGPU,
    state: () => ({ width, height, mutations, destroyed, configurations }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WebGPU renderer lifecycle and backing dimensions', () => {
  it('rejects oversized, overflowing and invalid dimensions before either backing dimension changes', async () => {
    const fixture = gpuFixture();
    fixture.installGPU(async () => fixture.device);
    const renderer = new WebGPURenderer(() => {});
    await renderer.initialize(fixture.canvas);
    expect(fixture.state()).toMatchObject({ mutations: 0, configurations: 1 });

    expect(() => renderer.resize(512, 4097)).toThrow(GraphicsError);
    expect(() => renderer.resize(512, Number.MAX_VALUE)).toThrow(GraphicsError);
    expect(() => renderer.resize(512, Infinity)).toThrow(RangeError);
    expect(fixture.state()).toMatchObject({
      width: 128,
      height: 64,
      mutations: 0,
    });

    renderer.resize(512, 256);
    expect(fixture.state()).toMatchObject({
      width: 512,
      height: 256,
      mutations: 2,
      configurations: 1,
    });
    renderer.destroy();
    expect(fixture.state().destroyed).toBe(1);
  });

  it('rejects a concurrent initialization and destroys a device acquired after teardown', async () => {
    const fixture = gpuFixture();
    const entered = deferred<void>();
    const lateDevice = deferred<GPUDevice>();
    fixture.installGPU(() => {
      entered.resolve();
      return lateDevice.promise;
    });
    const renderer = new WebGPURenderer(() => {});
    const initializing = renderer.initialize(fixture.canvas);
    await entered.promise;
    await expect(renderer.initialize(fixture.canvas)).rejects.toThrow(
      GraphicsError,
    );
    renderer.destroy();
    lateDevice.resolve(fixture.device);
    await expect(initializing).rejects.toThrow(GraphicsError);
    expect(fixture.state()).toMatchObject({
      destroyed: 1,
      configurations: 0,
      mutations: 0,
    });
  });
});

describe('graphics backend selection', () => {
  it('rejects unknown JavaScript preferences before accessing the GPU', async () => {
    const requestAdapter = vi.fn();
    vi.stubGlobal('navigator', { gpu: { requestAdapter } });
    await expect(
      createRenderer(
        gpuFixture().canvas,
        'webgl3' as RendererPreference,
        () => {},
      ),
    ).rejects.toBeInstanceOf(GraphicsBackendUnavailableError);
    expect(requestAdapter).not.toHaveBeenCalled();
  });
});
