import { describe, expect, it, vi } from 'vitest';
import { ResilientRenderer } from '../packages/graphics/src/resilient-renderer.js';
import {
  GraphicsError,
  WebGL2ContextLostError,
  WebGPUDeviceLostError,
} from '../packages/graphics/src/errors.js';
import type { Renderer } from '../packages/graphics/src/index.js';

class FakeRenderer {
  backend = 'webgl2';
  capabilities = { threeD: true };
  frames = 0;
  destroyed = false;
  initialized = 0;
  prepared: unknown[] = [];
  size: [number, number] | undefined;
  failInitialize: Error | undefined;
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
  destroy() {
    this.destroyed = true;
  }
}

class FakeDescriptor extends EventTarget {
  destroyed = false;
}

function setup(backend: 'webgl2' | 'webgpu' = 'webgl2') {
  const control: { failReplacement?: Error } = {};
  const created: FakeRenderer[] = [];
  const report = vi.fn();
  const hooks = { onLost: vi.fn(), onRecovered: vi.fn() };
  const renderer = new ResilientRenderer(
    backend,
    (onError) => {
      const fake = new FakeRenderer(onError);
      if (created.length > 0) fake.failInitialize = control.failReplacement;
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

  it('does not recover from loss reported before initialization finished', async () => {
    const { renderer, created, report, hooks } = setup();
    const lost = new WebGL2ContextLostError('lost early');
    created[0].onError(lost);
    expect(report).toHaveBeenCalledWith(lost);
    expect(hooks.onLost).not.toHaveBeenCalled();
    expect(renderer.isRecovering).toBe(false);
  });
});
