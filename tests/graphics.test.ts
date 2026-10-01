import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRenderer,
  type RendererPreference,
} from '../packages/graphics/src/index.js';
import {
  GraphicsBackendUnavailableError,
  GraphicsError,
  WebGPUDeviceLostError,
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
  vi.stubGlobal('GPUShaderStage', { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 });
  vi.stubGlobal('GPUBufferUsage', { UNIFORM: 64, COPY_DST: 8, VERTEX: 32 });
  vi.stubGlobal('GPUTextureUsage', {
    COPY_SRC: 1,
    COPY_DST: 2,
    TEXTURE_BINDING: 4,
    STORAGE_BINDING: 8,
    RENDER_ATTACHMENT: 16,
  });
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
    features: new Set<string>(),
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
    createComputePipeline() {
      return {};
    },
    createBindGroupLayout() {
      return {};
    },
    createPipelineLayout() {
      return {};
    },
    createBindGroup() {
      return {};
    },
    createSampler() {
      return {};
    },
    createBuffer() {
      return { destroy() {} };
    },
    createTexture() {
      return {
        createView() {
          return {};
        },
        destroy() {},
      };
    },
    queue: { writeTexture() {}, writeBuffer() {} },
    destroy() {
      destroyed++;
    },
  } as unknown as GPUDevice;
  const installGPU = (requestDevice: () => Promise<GPUDevice>) => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: async () => ({
          features: new Set<string>(),
          requestDevice,
        }),
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

  it('rejects resize after device loss without changing either backing dimension', async () => {
    const fixture = gpuFixture();
    const loss = deferred<GPUDeviceLostInfo>();
    Object.defineProperty(fixture.device, 'lost', { value: loss.promise });
    fixture.installGPU(async () => fixture.device);
    const onError = vi.fn();
    const renderer = new WebGPURenderer(onError);
    await renderer.initialize(fixture.canvas);
    loss.resolve({
      reason: 'unknown',
      message: 'driver reset',
    } as GPUDeviceLostInfo);
    await loss.promise;
    await Promise.resolve();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(WebGPUDeviceLostError);
    const before = fixture.state();
    expect(() => renderer.resize(256, 128)).toThrow(WebGPUDeviceLostError);
    expect(fixture.state()).toMatchObject({
      width: before.width,
      height: before.height,
      mutations: before.mutations,
    });
    renderer.destroy();
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
