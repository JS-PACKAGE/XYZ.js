import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { Game } from '../packages/core/src/game.js';
import { RuntimeError } from '../packages/core/src/errors.js';
import {
  createRenderer,
  type Renderer,
} from '../packages/graphics/src/index.js';

import { NativeResidency } from '../packages/graphics/src/residency.js';
import { residencyLease } from '../packages/graphics/src/preparation.js';
vi.mock('../packages/graphics/src/index.js', async (importOriginal) => ({
  ...(await importOriginal<{ createRenderer: typeof createRenderer }>()),
  createRenderer: vi.fn(),
}));

class FakeCSSStyle {
  private readonly properties = new Map<
    string,
    { value: string; priority: string }
  >();
  getPropertyValue(name: string): string {
    return this.properties.get(name)?.value ?? '';
  }
  getPropertyPriority(name: string): string {
    return this.properties.get(name)?.priority ?? '';
  }
  setProperty(name: string, value: string, priority = ''): void {
    this.properties.set(name, { value, priority });
  }
  removeProperty(name: string): string {
    const value = this.getPropertyValue(name);
    this.properties.delete(name);
    return value;
  }
}

class FakeCanvas {
  readonly style = new FakeCSSStyle();
  authoredContain: string | undefined;
  clientWidth = 0;
  clientHeight = 0;
}

class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  constructor() {
    FakeObserver.instances.push(this);
  }
}

let canvas: FakeCanvas;
let documentEvents: EventTarget;
let scheduled: Map<number, FrameRequestCallback>;
let frameId: number;
let renderer: Renderer;
let rendererResize: Mock;
let rendererDestroy: Mock;
let rendererError: (error: Error) => void;

beforeEach(() => {
  canvas = new FakeCanvas();
  documentEvents = new EventTarget();
  scheduled = new Map();
  frameId = 0;
  FakeObserver.instances = [];
  rendererResize = vi.fn();
  rendererDestroy = vi.fn();
  renderer = {
    backend: 'webgpu',
    stats: {
      frame: 0,
      meshes: 0,
      culled: 0,
      drawCalls: 0,
      triangles: 0,
      shadowDrawCalls: 0,
      drawCalls2D: 0,
      instances2D: 0,
      renderPasses2D: 0,
      uploadBytes: 0,
      renderTargetBytes: 0,
      peakRenderTargetBytes: 0,
    },
    capabilities: {
      threeD: true,
      compute: true,
      customShaders: true,
      storageBuffers: true,
      instancing: true,
      maxTextureSize: 4096,
      supportedTextureFormats: [],
    },
    residency: new NativeResidency(),
    configureResidency: vi.fn(),
    prepareGeometry: vi.fn(),
    unloadGeometry: vi.fn(),
    prepareResource: vi.fn(async () => {
      throw new Error('Unexpected warmup in runtime fixture.');
    }),
    retainFrameResources: () =>
      residencyLease(
        (renderer.residency as NativeResidency).retainFrameResources(),
      ),
    initialize: vi.fn(),
    beginFrame: vi.fn(),
    render: vi.fn(),
    endFrame: vi.fn(),
    captureScene: vi.fn(async () => {
      throw new Error('Unexpected capture in atomic runtime fixture.');
    }),
    prepareMaterial: vi.fn(async () => {
      throw new Error('Native material outside runtime fixture.');
    }),
    preparePostProcessor: vi.fn(async () => {
      throw new Error('Native postprocessor outside runtime fixture.');
    }),
    createRenderTexture: vi.fn(),
    renderToTexture: vi.fn(),
    extractPixels: vi.fn(),
    generateTexture: vi.fn(),
    prepareTextures: vi.fn(),
    unloadTexture: vi.fn(),
    resize: rendererResize,
    destroy: rendererDestroy,
  };
  vi.mocked(createRenderer).mockReset();
  vi.mocked(createRenderer).mockImplementation(
    async (_canvas, _preference, onError) => {
      rendererError = onError;
      return renderer;
    },
  );
  vi.stubGlobal('HTMLCanvasElement', FakeCanvas);
  vi.stubGlobal('ResizeObserver', FakeObserver);
  vi.stubGlobal('window', { devicePixelRatio: 2 });
  vi.stubGlobal('document', {
    hidden: false,
    addEventListener: documentEvents.addEventListener.bind(documentEvents),
    removeEventListener:
      documentEvents.removeEventListener.bind(documentEvents),
  });
  vi.stubGlobal('getComputedStyle', (element: FakeCanvas) => {
    const fallback = element.style
      .getPropertyValue('contain-intrinsic-size')
      .split(' ');
    return {
      contain:
        element.style.getPropertyValue('contain') ||
        element.authoredContain ||
        'none',
      width: fallback[0] || '300px',
      height: fallback[1] || '150px',
      boxSizing: 'content-box',
      paddingLeft: '0px',
      paddingRight: '0px',
      paddingTop: '0px',
      paddingBottom: '0px',
      borderLeftWidth: '0px',
      borderRightWidth: '0px',
      borderTopWidth: '0px',
      borderBottomWidth: '0px',
    };
  });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    scheduled.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => scheduled.delete(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Game canvas ownership and lifecycle', () => {
  it('reserves a canvas while the renderer is still initializing and releases after destroy', async () => {
    let finishInitialization!: (value: Renderer) => void;
    vi.mocked(createRenderer).mockImplementationOnce(
      () =>
        new Promise<Renderer>((resolve) => {
          finishInitialization = resolve;
        }),
    );
    const first = Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    await expect(
      Game.create({ canvas: canvas as unknown as HTMLCanvasElement }),
    ).rejects.toBeInstanceOf(RuntimeError);
    finishInitialization(renderer);
    const game = await first;
    await expect(
      Game.create({ canvas: canvas as unknown as HTMLCanvasElement }),
    ).rejects.toBeInstanceOf(RuntimeError);
    game.destroy();
    const replacement = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    replacement.destroy();
  });

  it('releases claims when initialization or setup fails and restores prior layout', async () => {
    canvas.style.setProperty('contain', 'paint', 'important');
    canvas.style.setProperty(
      'contain-intrinsic-size',
      '75px 50px',
      'important',
    );
    const unavailable = new Error('GPU unavailable');
    vi.mocked(createRenderer).mockRejectedValueOnce(unavailable);
    await expect(
      Game.create({ canvas: canvas as unknown as HTMLCanvasElement }),
    ).rejects.toBe(unavailable);
    const resizeError = new Error('invalid backing');
    rendererResize.mockImplementationOnce(() => {
      throw resizeError;
    });
    await expect(
      Game.create({ canvas: canvas as unknown as HTMLCanvasElement }),
    ).rejects.toBe(resizeError);
    expect(canvas.style.getPropertyValue('contain')).toBe('paint');
    expect(canvas.style.getPropertyPriority('contain')).toBe('important');
    expect(canvas.style.getPropertyValue('contain-intrinsic-size')).toBe(
      '75px 50px',
    );
    expect(rendererDestroy).toHaveBeenCalledOnce();
    const game = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    game.destroy();
    expect(canvas.style.getPropertyValue('contain')).toBe('paint');
    expect(canvas.style.getPropertyValue('contain-intrinsic-size')).toBe(
      '75px 50px',
    );
  });

  it('restores layout and releases ownership after listener setup fails', async () => {
    const originalDocument = document;
    const registrationError = new Error('listener registration failed');
    vi.stubGlobal('document', {
      ...originalDocument,
      addEventListener: () => {
        throw registrationError;
      },
    });
    await expect(
      Game.create({ canvas: canvas as unknown as HTMLCanvasElement }),
    ).rejects.toBe(registrationError);
    expect(canvas.style.getPropertyValue('contain')).toBe('');
    expect(canvas.style.getPropertyValue('contain-intrinsic-size')).toBe('');
    expect(rendererDestroy).toHaveBeenCalledOnce();
    vi.stubGlobal('document', originalDocument);
    const next = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    next.destroy();
  });

  it('releases its claim when renderer teardown itself fails during setup', async () => {
    const resizeError = new Error('canvas resize failed');
    const teardownError = new Error('renderer teardown failed');
    rendererResize.mockImplementationOnce(() => {
      throw resizeError;
    });
    rendererDestroy.mockImplementationOnce(() => {
      throw teardownError;
    });
    await expect(
      Game.create({ canvas: canvas as unknown as HTMLCanvasElement }),
    ).rejects.toMatchObject({ errors: [resizeError, teardownError] });
    expect(canvas.style.getPropertyValue('contain')).toBe('');
    const next = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    next.destroy();
  });

  it('cleans observer, layout, and claim even when renderer destroy throws', async () => {
    const game = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    const observer = FakeObserver.instances[0];
    const teardownError = new Error('GPU teardown failed');
    rendererDestroy.mockImplementationOnce(() => {
      throw teardownError;
    });
    expect(() => game.destroy()).toThrow(teardownError);
    expect(game.state).toBe('destroyed');
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(canvas.style.getPropertyValue('contain')).toBe('');
    expect(canvas.style.getPropertyValue('contain-intrinsic-size')).toBe('');
    game.destroy();
    const next = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    next.destroy();
  });

  it('disconnects resize observation and releases canvas when input cleanup fails', async () => {
    const game = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    const observer = FakeObserver.instances[0];
    const inputFailure = new Error('input cleanup failed');
    vi.spyOn(game.input, 'destroy').mockImplementationOnce(() => {
      throw inputFailure;
    });
    expect(() => game.destroy()).toThrow(inputFailure);
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(canvas.style.getPropertyValue('contain')).toBe('');
    expect(canvas.style.getPropertyValue('contain-intrinsic-size')).toBe('');
    const next = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    next.destroy();
  });

  it('latches the first fatal error and refuses resume without scheduling another frame', async () => {
    const game = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    const onError = vi.fn();
    game.addEventListener('error', onError);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    game.start();
    const lost = new Error('device lost');
    rendererError(lost);
    rendererError(new Error('duplicate failure'));
    expect(game.state).toBe('paused');
    expect(scheduled.size).toBe(0);
    expect(onError).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledOnce();
    expect(() => game.resume()).toThrow(RuntimeError);
    let startFailure: unknown;
    try {
      game.start();
    } catch (error) {
      startFailure = error;
    }
    expect(startFailure).toBeInstanceOf(RuntimeError);
    expect((startFailure as RuntimeError).cause).toBe(lost);
    expect(scheduled.size).toBe(0);
    game.destroy();
  });

  it('preserves caller edits to containment made while the Game is active', async () => {
    canvas.authoredContain = 'layout paint';
    const game = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    expect(
      getComputedStyle(canvas as unknown as HTMLCanvasElement).contain,
    ).toBe('size layout paint');
    canvas.style.setProperty('contain', 'size paint');
    canvas.style.setProperty('contain-intrinsic-size', '400px 200px');
    game.destroy();
    expect(canvas.style.getPropertyValue('contain')).toBe('size paint');
    expect(canvas.style.getPropertyValue('contain-intrinsic-size')).toBe(
      '400px 200px',
    );
  });

  it('rolls back fallback layout and logical size on backing resize failure', async () => {
    const game = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    rendererResize.mockImplementationOnce(() => {
      throw new RangeError('exceeds texture limit');
    });
    expect(() => game.resize(100000000, 100)).toThrow(RangeError);
    expect(canvas.style.getPropertyValue('contain-intrinsic-size')).toBe(
      '1280px 720px',
    );
    expect([game.width, game.height]).toEqual([1280, 720]);
    game.destroy();
  });

  it('ties audio pause to game pause/resume and page visibility only when asked', async () => {
    const optedIn = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
      audioPause: { onPause: true, onHidden: true },
    });
    const pause = vi.spyOn(optedIn.audio, 'pause');
    const resume = vi.spyOn(optedIn.audio, 'resume');
    optedIn.start();
    optedIn.pause();
    expect(pause).toHaveBeenLastCalledWith('game');
    optedIn.resume();
    expect(resume).toHaveBeenLastCalledWith('game');
    (document as { hidden: boolean }).hidden = true;
    documentEvents.dispatchEvent(new Event('visibilitychange'));
    expect(pause).toHaveBeenLastCalledWith('hidden');
    (document as { hidden: boolean }).hidden = false;
    documentEvents.dispatchEvent(new Event('visibilitychange'));
    expect(resume).toHaveBeenLastCalledWith('hidden');
    optedIn.destroy();

    const defaults = await Game.create({
      canvas: canvas as unknown as HTMLCanvasElement,
    });
    const untouched = vi.spyOn(defaults.audio, 'pause');
    defaults.start();
    defaults.pause();
    (document as { hidden: boolean }).hidden = true;
    documentEvents.dispatchEvent(new Event('visibilitychange'));
    expect(untouched).not.toHaveBeenCalled();
    (document as { hidden: boolean }).hidden = false;
    defaults.destroy();
  });
});
