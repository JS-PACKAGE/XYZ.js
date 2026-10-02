import { graphicsRecoveryLimits } from '../src/data/rendering.js';
import { describe, expect, it, vi } from 'vitest';
import { ResilientRenderer } from '../packages/graphics/src/resilient-renderer.js';
import { GPUParticleEmitter3D } from '../packages/core/src/gpu-particles3d.js';
import {
  GraphicsError,
  UnsupportedGraphicsError,
  WebGL2ContextLostError,
  WebGPUDeviceLostError,
} from '../packages/graphics/src/errors.js';
import type { Renderer } from '../packages/graphics/src/index.js';
import { NativeResidency } from '../packages/graphics/src/residency.js';
import type {
  ResidencyAllocation,
  ResidencyBudgetOptions,
} from '../packages/graphics/src/residency.js';
import { Texture } from '../packages/assets/src/index.js';
import type { Texture2DSource } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';

class FakeRenderer {
  backend = 'webgl2';
  capabilities = { threeD: true };
  frames = 0;
  destroyed = false;
  initialized = 0;
  prepared: unknown[] = [];
  size: [number, number] | undefined;
  failInitialize: Error | undefined;
  readonly residency = new NativeResidency();
  configureResidency(options: ResidencyBudgetOptions): void {
    this.residency.configure(options);
  }
  gate: Promise<void> | undefined;
  private readonly textures = new Map<Texture2DSource, ResidencyAllocation>();
  private readonly geometry = new Map<Geometry, ResidencyAllocation>();
  constructor(readonly onError: (error: Error) => void) {}
  async initialize(): Promise<void> {
    if (this.failInitialize) throw this.failInitialize;
    this.initialized++;
  }
  beginFrame() {}
  render() {
    this.frames++;
  }
  endFrame() {}
  resize(width: number, height: number) {
    this.size = [width, height];
  }
  async prepareMaterial(material: unknown) {
    this.prepared.push(material);
  }
  async preparePostProcessor(processor: unknown) {
    this.prepared.push(processor);
  }
  async prepareTextures(sources: readonly Texture2DSource[]): Promise<void> {
    for (const source of sources)
      if (!this.textures.has(source)) {
        const allocation = this.residency.textures.allocate(
          source.width * source.height * 4,
          () => this.textures.delete(source),
        );
        allocation.retain();
        this.textures.set(source, allocation);
      }
    await this.gate;
  }
  unloadTexture(source: Texture2DSource): void {
    this.textures.get(source)?.destroy();
  }
  async prepareGeometry(source: Geometry): Promise<void> {
    if (!this.geometry.has(source)) {
      const allocation = this.residency.geometry.allocate(
        source.vertices.byteLength + source.indices.byteLength,
        () => this.geometry.delete(source),
      );
      allocation.retain();
      this.geometry.set(source, allocation);
    }
    await this.gate;
  }
  unloadGeometry(source: Geometry): void {
    this.geometry.get(source)?.destroy();
  }
  destroy() {
    this.destroyed = true;
    this.residency.clear();
  }
}

class FakeDescriptor extends EventTarget {
  destroyed = false;
}

function setup(backend: 'webgl2' | 'webgpu' = 'webgl2') {
  const control: { failReplacement?: Error; replacementGate?: Promise<void> } =
    {};
  const created: FakeRenderer[] = [];
  const report = vi.fn();
  const hooks = { onLost: vi.fn(), onRecovered: vi.fn() };
  const renderer = new ResilientRenderer(
    backend,
    (onError) => {
      const fake = new FakeRenderer(onError);
      if (created.length > 0) fake.failInitialize = control.failReplacement;
      if (created.length > 0) fake.gate = control.replacementGate;
      created.push(fake);
      return fake as unknown as Renderer;
    },
    report,
    hooks,
  );
  const canvas = new EventTarget() as unknown as HTMLCanvasElement;
  return { renderer, created, report, hooks, canvas, control };
}

/** Lets pending promise continuations run without any timer. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

describe('ResilientRenderer', () => {
  it('rejects missing optional particle preparation without poisoning a legacy renderer', async () => {
    const { renderer, created, canvas } = setup();
    const emitter = new GPUParticleEmitter3D({ capacity: 4 });
    await renderer.initialize(canvas);
    await expect(renderer.prepareGpuParticles(emitter)).rejects.toBeInstanceOf(
      UnsupportedGraphicsError,
    );
    renderer.render();
    expect(created[0].frames).toBe(1);
    expect(renderer.isRecovering).toBe(false);
    emitter.destroy();
    renderer.destroy();
  });

  it('delegates normally and forwards non-loss errors', async () => {
    const { renderer, created, report, canvas } = setup();
    await renderer.initialize(canvas);
    renderer.render();
    expect(created[0].frames).toBe(1);
    const failure = new GraphicsError('shader failed');
    created[0].onError(failure);
    expect(report).toHaveBeenCalledWith(failure);
    expect(renderer.isRecovering).toBe(false);
  });

  it('rebuilds WebGL2 only after the context is restored, then re-prepares and resizes', async () => {
    const { renderer, created, report, hooks, canvas } = setup();
    await renderer.initialize(canvas);
    const material = new FakeDescriptor();
    const processor = new FakeDescriptor();
    await renderer.prepareMaterial(material as never);
    await renderer.preparePostProcessor(processor as never);
    renderer.resize(320, 200);

    created[0].onError(new WebGL2ContextLostError('lost'));
    expect(hooks.onLost).toHaveBeenCalledOnce();
    expect(renderer.isRecovering).toBe(true);
    expect(created[0].destroyed).toBe(true);
    // Frames are skipped and renderer-owned handles are refused until recovery.
    renderer.render();
    expect(created[0].frames).toBe(0);
    expect(() => renderer.createRenderTexture({} as never)).toThrow(
      /being restored/,
    );
    await settle();
    expect(created).toHaveLength(1); // still waiting for webglcontextrestored

    canvas.dispatchEvent(new Event('webglcontextrestored'));
    await settle();
    expect(created).toHaveLength(2);
    expect(created[1].prepared).toEqual([material, processor]);
    expect(created[1].size).toEqual([320, 200]);
    expect(renderer.isRecovering).toBe(false);
    expect(hooks.onRecovered).toHaveBeenCalledOnce();
    expect(renderer.recoveries).toBe(1);
    renderer.render();
    expect(created[1].frames).toBe(1);
    expect(report).not.toHaveBeenCalled();
  });

  it('recovers WebGPU immediately without waiting for a restore event', async () => {
    const { renderer, created, hooks, canvas } = setup('webgpu');
    await renderer.initialize(canvas);
    created[0].onError(new WebGPUDeviceLostError('device lost'));
    await settle();
    expect(created).toHaveLength(2);
    expect(hooks.onRecovered).toHaveBeenCalledOnce();
  });

  it('skips descriptors destroyed before recovery', async () => {
    const { renderer, created, canvas } = setup('webgpu');
    await renderer.initialize(canvas);
    const alive = new FakeDescriptor();
    const gone = new FakeDescriptor();
    await renderer.prepareMaterial(alive as never);
    await renderer.prepareMaterial(gone as never);
    gone.destroyed = true;
    gone.dispatchEvent(new Event('destroy'));
    created[0].onError(new WebGPUDeviceLostError('lost'));
    await settle();
    expect(created[1].prepared).toEqual([alive]);
  });

  it('reports a GraphicsError when the replacement cannot initialize', async () => {
    const { renderer, created, report, hooks, canvas, control } =
      setup('webgpu');
    await renderer.initialize(canvas);
    const cause = new Error('adapter gone');
    control.failReplacement = cause;
    created[0].onError(new WebGPUDeviceLostError('lost'));
    await settle();
    expect(hooks.onRecovered).not.toHaveBeenCalled();
    expect(renderer.isRecovering).toBe(false);
    expect(created[1].destroyed).toBe(true);
    expect(report).toHaveBeenCalledOnce();
    const failure = report.mock.calls[0][0] as GraphicsError;
    expect(failure).toBeInstanceOf(GraphicsError);
    expect(failure.cause).toBe(cause);
  });

  it('stops waiting when destroyed during recovery', async () => {
    const { renderer, created, report, hooks, canvas } = setup();
    await renderer.initialize(canvas);
    created[0].onError(new WebGL2ContextLostError('lost'));
    renderer.destroy();
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    await settle();
    expect(created).toHaveLength(1);
    expect(hooks.onRecovered).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  });

  it('reports a GraphicsError when a lost WebGL2 context is never restored', async () => {
    vi.useFakeTimers();
    try {
      const { renderer, created, report, hooks, canvas } = setup();
      await renderer.initialize(canvas);
      created[0].onError(new WebGL2ContextLostError('lost'));
      await vi.advanceTimersByTimeAsync(
        graphicsRecoveryLimits.restoreTimeoutMs - 1,
      );
      expect(renderer.isRecovering).toBe(true);
      expect(report).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(renderer.isRecovering).toBe(false);
      expect(created).toHaveLength(1);
      expect(hooks.onRecovered).not.toHaveBeenCalled();
      const failure = report.mock.calls[0][0] as GraphicsError;
      expect(failure).toBeInstanceOf(GraphicsError);
      expect((failure.cause as Error).message).toMatch(/not restored/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the restore timeout once the context is restored or destroyed', async () => {
    vi.useFakeTimers();
    try {
      const first = setup();
      await first.renderer.initialize(first.canvas);
      first.created[0].onError(new WebGL2ContextLostError('lost'));
      expect(vi.getTimerCount()).toBe(1);
      first.canvas.dispatchEvent(new Event('webglcontextrestored'));
      await settle();
      expect(vi.getTimerCount()).toBe(0);
      expect(first.hooks.onRecovered).toHaveBeenCalledOnce();
      const second = setup();
      await second.renderer.initialize(second.canvas);
      second.created[0].onError(new WebGL2ContextLostError('lost'));
      second.renderer.destroy();
      await settle();
      expect(vi.getTimerCount()).toBe(0);
      expect(second.report).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not recover from loss reported before initialization finished', async () => {
    const { renderer, created, report, hooks } = setup();
    const lost = new WebGL2ContextLostError('lost early');
    created[0].onError(lost);
    expect(report).toHaveBeenCalledWith(lost);
    expect(hooks.onLost).not.toHaveBeenCalled();
    expect(renderer.isRecovering).toBe(false);
  });

  it.each(['texture', 'geometry'] as const)(
    'does not resurrect %s ownership unloaded before preparation completion',
    async (kind) => {
      const { renderer, created, report, canvas } = setup('webgpu');
      await renderer.initialize(canvas);
      const make = (): Texture | Geometry =>
        kind === 'texture'
          ? new Texture({ width: 2, height: 2, close() {} } as ImageBitmap)
          : Geometry.quad();
      const a = make(),
        b = make();
      const bytes =
        a instanceof Texture
          ? 16
          : a.vertices.byteLength + a.indices.byteLength;
      renderer.configureResidency({
        textureBytes: bytes,
        geometryBytes: bytes,
      });
      const prepare = (source: Texture | Geometry): Promise<void> =>
        source instanceof Texture
          ? renderer.prepareTextures([source])
          : renderer.prepareGeometry(source);
      const unload = (source: Texture | Geometry): void => {
        if (source instanceof Texture) renderer.unloadTexture(source);
        else renderer.unloadGeometry(source);
      };
      const pending = prepare(a);
      unload(a);
      await pending;
      await prepare(b);
      created[0].onError(new WebGPUDeviceLostError('lost'));
      await settle();
      expect(report).not.toHaveBeenCalled();
      expect(renderer.recoveries).toBe(1);
      const pool =
        kind === 'texture'
          ? created[1].residency.textures
          : created[1].residency.geometry;
      expect(pool.liveBytes).toBe(bytes);
      expect(() => pool.allocate(bytes, () => {})).toThrow();
      unload(b);
      await prepare(make());
      expect(pool.liveBytes).toBe(bytes);
      renderer.destroy();
    },
  );

  it.each(['texture', 'geometry'] as const)(
    'retires a %s unloaded while replacement preparation is waiting',
    async (kind) => {
      const { renderer, created, report, canvas, control } = setup('webgpu');
      await renderer.initialize(canvas);
      const make = (): Texture | Geometry =>
        kind === 'texture'
          ? new Texture({ width: 2, height: 2, close() {} } as ImageBitmap)
          : Geometry.quad();
      const a = make(),
        b = make();
      const bytes =
        a instanceof Texture
          ? 16
          : a.vertices.byteLength + a.indices.byteLength;
      renderer.configureResidency({
        textureBytes: bytes,
        geometryBytes: bytes,
      });
      const prepare = (source: Texture | Geometry): Promise<void> =>
        source instanceof Texture
          ? renderer.prepareTextures([source])
          : renderer.prepareGeometry(source);
      const unload = (source: Texture | Geometry): void => {
        if (source instanceof Texture) renderer.unloadTexture(source);
        else renderer.unloadGeometry(source);
      };
      await prepare(a);
      let complete!: () => void;
      control.replacementGate = new Promise<void>((resolve) => {
        complete = resolve;
      });
      created[0].onError(new WebGPUDeviceLostError('lost'));
      await settle();
      const pool =
        kind === 'texture'
          ? created[1].residency.textures
          : created[1].residency.geometry;
      expect(renderer.isRecovering).toBe(true);
      expect(pool.liveBytes).toBe(bytes);
      unload(a);
      expect(pool.liveBytes).toBe(0);
      complete();
      await settle();
      expect(report).not.toHaveBeenCalled();
      expect(renderer.recoveries).toBe(1);
      await prepare(b);
      expect(pool.liveBytes).toBe(bytes);
      renderer.destroy();
    },
  );
});
