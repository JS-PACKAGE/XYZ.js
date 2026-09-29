import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../packages/core/src/game.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { SceneObject } from '../packages/core/src/scene-object.js';
import { Transform2D, Vector2 } from '../packages/math/src/index.js';
import {
  createRenderer,
  type Renderer,
} from '../packages/graphics/src/index.js';

vi.mock('../packages/graphics/src/index.js', async (original) => ({
  ...(await original<{ createRenderer: typeof createRenderer }>()),
  createRenderer: vi.fn(),
}));

class Style {
  private values = new Map<string, string>();
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? '';
  }
  getPropertyPriority(): string {
    return '';
  }
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
  }
}
class Canvas {
  readonly style = new Style();
  width = 0;
  height = 0;
}
class Observer {
  observe(): void {}
  disconnect(): void {}
}
class EventWithDetail extends Event {
  readonly detail: unknown;
  constructor(name: string, options: { detail: unknown }) {
    super(name);
    this.detail = options.detail;
  }
}
class DisposableObject extends SceneObject {
  constructor(private readonly calls: string[]) {
    super();
  }
  protected override onDestroy(): void {
    this.calls.push('object:destroy');
  }
}

let canvas: Canvas;
let renderer: Renderer;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let events: EventTarget;
let calls: string[];

beforeEach(() => {
  canvas = new Canvas();
  calls = [];
  frames = new Map();
  events = new EventTarget();
  nextFrame = 0;
  renderer = {
    backend: 'webgpu',
    initialize: vi.fn(),
    beginFrame: vi.fn(() => calls.push('renderer:begin')),
    render: vi.fn(() => calls.push('renderer:render')),
    endFrame: vi.fn(() => calls.push('renderer:end')),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
  vi.mocked(createRenderer).mockResolvedValue(renderer);
  vi.stubGlobal('HTMLCanvasElement', Canvas);
  vi.stubGlobal('ResizeObserver', Observer);
  vi.stubGlobal('CustomEvent', EventWithDetail);
  vi.stubGlobal('window', { devicePixelRatio: 1 });
  vi.stubGlobal('document', {
    hidden: false,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  });
  vi.stubGlobal('getComputedStyle', (element: Canvas) => ({
    contain: element.style.getPropertyValue('contain') || 'none',
    width: '1280px',
    height: '720px',
    boxSizing: 'content-box',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingTop: '0px',
    paddingBottom: '0px',
    borderLeftWidth: '0px',
    borderRightWidth: '0px',
    borderTopWidth: '0px',
    borderBottomWidth: '0px',
  }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function createGame(): Promise<Game> {
  return Game.create({ canvas: canvas as unknown as HTMLCanvasElement });
}
function frame(timestamp: number): void {
  const first = frames.entries().next().value;
  if (!first) throw new Error('No scheduled frame.');
  frames.delete(first[0]);
  first[1](timestamp);
}

class LoggingScene extends Scene {
  constructor(
    private readonly label: string,
    private readonly log: string[],
  ) {
    super();
  }
  protected override initialize(game: Game, signal: AbortSignal): void {
    super.initialize(game, signal);
    this.log.push(`${this.label}:initialize`);
  }
  override update(deltaTime: number): void {
    this.log.push(`${this.label}:update:${deltaTime}`);
  }
  protected override onDestroy(): void {
    this.log.push(`${this.label}:destroy`);
  }
}

describe('Scene ownership and Game integration', () => {
  it('registers 2D transforms without exposing ECS operations to object users', () => {
    const scene = new Scene();
    const object = new GameObject();
    object.position = new Vector2(4, 8);
    object.rotation = 0.5;
    object.scale = new Vector2(2, 3);
    scene.add(object);
    expect(object.position).toBe(object.transform.position);
    expect(object.transform.position.x).toBe(4);
    expect(object.rotation).toBe(0.5);
    expect(object.transform.scale.y).toBe(3);
    expect([...scene.world.query(Transform2D)]).toHaveLength(1);
    const entity = [...scene.world.query(Transform2D)][0];
    expect(scene.world.getComponent(entity, Transform2D)).toBe(
      object.transform,
    );
    expect(scene.has(object)).toBe(true);
    expect(scene.remove(object)).toBe(true);
    expect(scene.remove(object)).toBe(false);
    expect([...scene.world.query(Transform2D)]).toEqual([]);
    scene.add(object);
    scene.destroy();
    expect(object.destroyed).toBe(true);
    expect(object.scene).toBeUndefined();
    expect(() => scene.add(new GameObject())).toThrow();
  });

  it('prepares atomically and executes scene update before systems and renderer', async () => {
    const game = await createGame();
    const old = new LoggingScene('old', calls);
    await game.setScene(old);
    old.world.addSystem({
      update: (_world, delta) => calls.push(`old:system:${delta}`),
    });
    game.start();
    frame(100);
    expect(calls.slice(-5)).toEqual([
      'old:update:0',
      'old:system:0',
      'renderer:begin',
      'renderer:render',
      'renderer:end',
    ]);
    let release!: () => void;
    class PendingScene extends LoggingScene {
      protected override async initialize(
        game: Game,
        signal: AbortSignal,
      ): Promise<void> {
        super.initialize(game, signal);
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
    }
    const next = new PendingScene('next', calls);
    const switching = game.setScene(next);
    await Promise.resolve();
    expect(game.scene).toBe(old);
    frame(116);
    expect(calls).toContain('old:update:0.016');
    release();
    await switching;
    expect(game.scene).toBe(next);
    expect(calls.filter((call) => call === 'old:destroy')).toHaveLength(1);
    frame(132);
    expect(calls).toContain('next:update:0.016');
    game.destroy();
    game.destroy();
    expect(calls.filter((call) => call === 'next:destroy')).toHaveLength(1);
  });

  it('rejects a failed candidate, disposes its objects, and keeps the prior world running', async () => {
    const game = await createGame();
    const old = new LoggingScene('old', calls);
    await game.setScene(old);
    const failure = new Error('asset missing');
    class FailingScene extends LoggingScene {
      protected override async initialize(
        game: Game,
        signal: AbortSignal,
      ): Promise<void> {
        super.initialize(game, signal);
        this.add(new DisposableObject(calls));
        throw failure;
      }
    }
    const candidate = new FailingScene('failed', calls);
    await expect(game.setScene(candidate)).rejects.toBe(failure);
    expect(candidate.destroyed).toBe(true);
    expect(calls.filter((call) => call === 'object:destroy')).toHaveLength(1);
    expect(calls.filter((call) => call === 'failed:destroy')).toHaveLength(1);
    expect(game.scene).toBe(old);
    game.start();
    frame(100);
    expect(calls).toContain('old:update:0');
    game.destroy();
  });

  it('cancels superseded preparation, prevents late publication, and rejects double ownership', async () => {
    const game = await createGame();
    const old = new LoggingScene('old', calls);
    await game.setScene(old);
    let release!: () => void;
    let cancellationSignal: AbortSignal | undefined;
    class DeferredScene extends LoggingScene {
      protected override async initialize(
        game: Game,
        signal: AbortSignal,
      ): Promise<void> {
        super.initialize(game, signal);
        cancellationSignal = signal;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
    }
    const pending = new DeferredScene('pending', calls);
    const first = game.setScene(pending);
    const same = game.setScene(pending);
    await Promise.resolve();
    expect(cancellationSignal?.aborted).toBe(false);
    const replacement = new LoggingScene('replacement', calls);
    await game.setScene(replacement);
    expect(cancellationSignal?.aborted).toBe(true);
    expect(pending.destroyed).toBe(true);
    expect(game.scene).toBe(replacement);
    release();
    await expect(first).rejects.toThrow('cancelled');
    await expect(same).rejects.toThrow('cancelled');
    expect(calls.filter((call) => call === 'pending:destroy')).toHaveLength(1);
    expect(calls.filter((call) => call === 'old:destroy')).toHaveLength(1);
    await expect(game.setScene(old)).rejects.toThrow();
    game.destroy();
  });

  it('destroy cancels pending work and start(scene) reports asynchronous failure without rejection', async () => {
    const game = await createGame();
    const failure = new Error('init failed');
    class FailingScene extends Scene {
      protected override async initialize(): Promise<void> {
        throw failure;
      }
    }
    const errors: unknown[] = [];
    game.addEventListener('error', (event) =>
      errors.push((event as EventWithDetail).detail),
    );
    const failed = new FailingScene();
    game.start(failed);
    await vi.waitFor(() => expect(errors).toEqual([failure]));
    expect(game.scene).toBeUndefined();
    expect(game.state).toBe('running');
    let release!: () => void;
    let signal: AbortSignal | undefined;
    class DeferredScene extends Scene {
      protected override async initialize(
        _game: Game,
        controller: AbortSignal,
      ): Promise<void> {
        signal = controller;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
    }
    const active = new LoggingScene('active', calls);
    await game.setScene(active);
    const pending = new DeferredScene();
    const transition = game.setScene(pending);
    await Promise.resolve();
    game.destroy();
    expect(active.destroyed).toBe(true);
    expect(pending.destroyed).toBe(true);
    expect(signal?.aborted).toBe(true);
    expect(renderer.destroy).toHaveBeenCalledOnce();
    release();
    await expect(transition).rejects.toThrow('cancelled');
    expect(game.scene).toBeUndefined();
    expect(calls.filter((call) => call === 'active:destroy')).toHaveLength(1);
  });
});
