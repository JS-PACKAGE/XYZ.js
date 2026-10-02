import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../packages/core/src/game.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { SceneObject } from '../packages/core/src/scene-object.js';
import { Group } from '../packages/core/src/group.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { RigidBody3D } from '../packages/core/src/physics3d/body.js';
import {
  BoxCollider3D,
  SphereCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import {
  AnimationClip,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import {
  Transform2D,
  Transform3D,
  Vector2,
  Vector3,
} from '../packages/math/src/index.js';
import {
  createRenderer,
  type Renderer,
  type RenderSnapshot,
} from '../packages/graphics/src/index.js';
import { Texture } from '../packages/assets/src/index.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { NativeResidency } from '../packages/graphics/src/residency.js';
import type { ResidencyAllocation } from '../packages/graphics/src/residency.js';
import {
  prepareNativeResource,
  residencyLease,
} from '../packages/graphics/src/preparation.js';

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
      throw new Error('Unexpected warmup in Scene fixture.');
    }),
    retainFrameResources: () =>
      residencyLease(
        (renderer.residency as NativeResidency).retainFrameResources(),
      ),
    initialize: vi.fn(),
    beginFrame: vi.fn(() => calls.push('renderer:begin')),
    render: vi.fn(() => calls.push('renderer:render')),
    endFrame: vi.fn(() => calls.push('renderer:end')),
    captureScene: vi.fn(async () => {
      throw new Error('Unexpected capture in atomic Scene fixture.');
    }),
    prepareMaterial: vi.fn(async () => {
      throw new Error('Native material outside Scene fixture.');
    }),
    preparePostProcessor: vi.fn(async () => {
      throw new Error('Native postprocessor outside Scene fixture.');
    }),
    createRenderTexture: vi.fn(),
    renderToTexture: vi.fn(),
    extractPixels: vi.fn(),
    generateTexture: vi.fn(),
    prepareTextures: vi.fn(),
    unloadTexture: vi.fn(),
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

function installTextureCache(
  budget: number,
  completion?: Promise<void>,
): NativeResidency {
  const native = renderer.residency as NativeResidency;
  native.configure({ textureBytes: budget });
  const cache = new Map<Texture, ResidencyAllocation>();
  const touch = (texture: Texture): void => {
    let allocation = cache.get(texture);
    if (!allocation) {
      allocation = native.textures.allocate(
        texture.width * texture.height * 4,
        () => cache.delete(texture),
      );
      cache.set(texture, allocation);
    }
    allocation.touch();
  };
  const unsupported = (): never => {
    throw new Error('Unexpected non-texture fixture resource.');
  };
  vi.mocked(renderer.prepareResource).mockImplementation((source, options) =>
    prepareNativeResource(
      native,
      source,
      {
        texture: (texture) => {
          if (!(texture instanceof Texture))
            throw new Error('Unexpected fixture texture.');
          touch(texture);
        },
        geometry: unsupported,
        mesh: unsupported,
        particles: unsupported,
        environment: unsupported,
        material: unsupported,
        post: unsupported,
        complete: () => completion ?? Promise.resolve(),
      },
      options,
    ),
  );
  vi.mocked(renderer.render).mockImplementation((scene) => {
    native.beginFrame();
    try {
      for (const object of scene?.objects ?? [])
        if (
          object instanceof Sprite &&
          object.visible &&
          object.texture instanceof Texture
        )
          touch(object.texture);
      native.endFrame();
    } catch (error) {
      native.abortFrame();
      throw error;
    }
  });
  return native;
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

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
function ownedSnapshot(): RenderSnapshot {
  let disposed = false;
  return {
    backend: 'webgpu',
    width: 1280,
    height: 720,
    get destroyed() {
      return disposed;
    },
    destroy: vi.fn(() => {
      disposed = true;
    }),
  };
}
function rejected(promise: Promise<void>): Promise<Error> {
  return promise.then(
    () => {
      throw new Error('Scene operation unexpectedly completed.');
    },
    (reason) => reason as Error,
  );
}

describe('Scene ownership and Game integration', () => {
  it('samples animation before user update, freezes during pause and releases it with the scene', async () => {
    const game = await createGame();
    const object = new Group();
    class AnimatedScene extends Scene {
      observed = -1;
      override update(): void {
        this.observed = object.position.x;
      }
    }
    const scene = new AnimatedScene();
    scene.add(object);
    scene.animations
      .clipAction(
        new AnimationClip('move', [
          new KeyframeTrack(object, 'translation', [0, 1], [0, 0, 0, 10, 0, 0]),
        ]),
      )
      .play();
    await game.setScene(scene);
    game.start();
    frame(0);
    frame(100);
    expect(scene.observed).toBeCloseTo(1);
    game.pause();
    expect(frames.size).toBe(0);
    game.resume();
    frame(10000);
    expect(scene.observed).toBeCloseTo(1);
    frame(10100);
    expect(scene.observed).toBeCloseTo(2);
    await game.setScene(new Scene());
    frame(10200);
    expect(object.destroyed).toBe(true);
    expect(object.position.x).toBeCloseTo(2);
    game.destroy();
  });

  it('advances timers without super.update and excludes paused wall time', async () => {
    const game = await createGame();
    let fired = 0;
    class TimedScene extends Scene {
      observed = 0;
      override update(): void {
        this.observed = fired;
      }
    }
    const scene = new TimedScene();
    scene.timers.after(0.2, () => fired++);
    await game.setScene(scene);
    game.start();
    frame(0);
    frame(100);
    game.pause();
    expect(fired).toBe(0);
    expect(frames.size).toBe(0);
    game.resume();
    frame(10000);
    expect(fired).toBe(0);
    frame(10100);
    expect(scene.observed).toBe(1);
    const oldTask = scene.timers.after(0, () => fired++);
    await game.setScene(new Scene());
    frame(10200);
    expect(fired).toBe(1);
    expect(oldTask.active).toBe(false);
    game.destroy();
  });

  it('does not update or render after a timer destroys the Game', async () => {
    const game = await createGame();
    let updates = 0;
    class TimedScene extends Scene {
      override update(): void {
        updates++;
      }
    }
    const scene = new TimedScene();
    scene.timers.after(0, () => game.destroy());
    await game.setScene(scene);
    game.start();
    frame(0);
    expect(game.state).toBe('destroyed');
    expect(updates).toBe(0);
    expect(renderer.beginFrame).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

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

  it('rejects an invalid detached sphere without changing hierarchy or registrations', () => {
    const scene = new Scene();
    const existing = scene.add(new Object3D());
    existing.collider = new SphereCollider3D(1);
    const entities = [...scene.world.query(Transform3D)];
    const parent = new Object3D();
    parent.scale.set(2, 1, 1);
    const before = parent.add(new Object3D());
    const sphere = new Object3D();
    sphere.scale.set(0.5, 1, 1);
    parent.add(sphere);
    sphere.body = new RigidBody3D({ type: 'static' });
    sphere.collider = new SphereCollider3D(1);
    const after = parent.add(new Object3D());
    const add = vi.fn();
    sphere.addEventListener('add', add);

    expect(() => scene.add(sphere)).toThrow();
    expect(sphere.parent).toBe(parent);
    expect([...parent.children]).toEqual([before, sphere, after]);
    expect(sphere.scene).toBeUndefined();
    expect([...scene.objects]).toEqual([existing]);
    expect([...scene.world.query(Transform3D)]).toEqual(entities);
    expect(scene.physics3D.has(sphere)).toBe(false);
    expect(scene.physics3D.has(existing)).toBe(true);
    expect(scene.physics3D.size).toBe(1);
    expect(add).not.toHaveBeenCalled();
  });

  it('rolls back partially registered descendants and restores the original root order', () => {
    const scene = new Scene();
    const parent = new Object3D();
    parent.scale.set(2, 1, 1);
    const before = parent.add(new Object3D());
    const root = parent.add(new Object3D());
    const valid = root.add(new Object3D());
    valid.collider = new BoxCollider3D(new Vector3(1, 1, 1));
    const invalid = root.add(new Object3D());
    invalid.scale.set(0.5, 1, 1);
    invalid.collider = new SphereCollider3D(1);
    const after = parent.add(new Object3D());

    expect(() => scene.add(root)).toThrow();
    expect(root.parent).toBe(parent);
    expect([...parent.children]).toEqual([before, root, after]);
    expect([...root.children]).toEqual([valid, invalid]);
    for (const object of [root, valid, invalid]) {
      expect(object.scene).toBeUndefined();
      expect(scene.has(object)).toBe(false);
      expect(scene.physics3D.has(object)).toBe(false);
    }
    expect([...scene.world.query(Transform3D)]).toEqual([]);
    expect(scene.objects.size).toBe(0);
  });

  it('registers a detached moving root using its local pose rather than its former parent', () => {
    const scene = new Scene();
    scene.physics3D.gravity.set(0, 0, 0);
    const parent = new Object3D();
    parent.position.set(100, 20, 0);
    const moving = parent.add(new Object3D());
    moving.position.set(3, 4, 0);
    moving.body = new RigidBody3D({ type: 'static' });
    moving.collider = new SphereCollider3D(1);
    // Model a preexisting nested moving body; admission must validate its eventual root.
    Object.defineProperty(moving.body, 'type', { value: 'dynamic' });
    parent.scale.set(2, 1, 1);
    moving.body.velocity.set(6, 0, 0);

    scene.add(moving);
    expect(moving.parent).toBeUndefined();
    expect(parent.children.has(moving)).toBe(false);
    expect(scene.physics3D.has(moving)).toBe(true);
    scene.physics3D.update(scene.physics3D.fixedDelta);
    expect(moving.position.x).toBeCloseTo(3 + 6 * scene.physics3D.fixedDelta);
    expect(moving.position.y).toBe(4);
    const hit = scene.physics3D.raycast(
      new Vector3(0, 4, 0),
      new Vector3(1, 0, 0),
      10,
    );
    expect(hit?.object).toBe(moving);
    expect(hit?.distance).toBeCloseTo(moving.position.x - 1);
  });

  it('registers parented static spheres against the final composed transform', () => {
    const scene = new Scene();
    const parent = new Object3D();
    parent.scale.set(2, 1, 1);
    scene.add(parent);
    const sphere = new Object3D();
    sphere.collider = new SphereCollider3D(1);
    sphere.scale.set(0.5, 1, 1);

    parent.add(sphere);
    expect(sphere.parent).toBe(parent);
    expect(scene.physics3D.has(sphere)).toBe(true);
    const hit = scene.physics3D.raycast(
      new Vector3(-3, 0, 0),
      new Vector3(1, 0, 0),
      10,
    );
    expect(hit?.object).toBe(sphere);
    expect(hit?.distance).toBeCloseTo(2);
  });

  it.each(['destroy', 'remove'] as const)(
    'does not undo an add listener that %ss its newly parented child',
    (action) => {
      const scene = new Scene();
      const parent = scene.add(new Object3D());
      const oldParent = new Object3D();
      const child = oldParent.add(new Object3D());
      const descendant = child.add(new Object3D());
      child.collider = new SphereCollider3D(1);
      let published = false;
      child.addEventListener('add', () => {
        published = child.parent === parent && parent.children.has(child);
        if (action === 'destroy') child.destroy();
        else parent.remove(child);
      });

      parent.add(child);
      expect(published).toBe(true);
      expect(child.parent).toBeUndefined();
      expect(oldParent.children.has(child)).toBe(false);
      expect(parent.children.has(child)).toBe(false);
      expect(child.destroyed).toBe(action === 'destroy');
      expect(descendant.destroyed).toBe(action === 'destroy');
      expect(child.scene).toBeUndefined();
      expect(descendant.scene).toBeUndefined();
      expect(scene.has(child)).toBe(false);
      expect(scene.has(descendant)).toBe(false);
      expect(scene.physics3D.has(child)).toBe(false);
      expect([...scene.objects]).toEqual([parent]);
    },
  );

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

  it('cancels an externally aborted candidate without losing the published Scene', async () => {
    const game = await createGame();
    const active = new LoggingScene('active', calls);
    await game.setScene(active);
    let finish!: () => void;
    let preparationSignal: AbortSignal | undefined;
    class DeferredScene extends Scene {
      protected override async initialize(
        _game: Game,
        signal: AbortSignal,
      ): Promise<void> {
        preparationSignal = signal;
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      }
    }
    const controller = new AbortController();
    const candidate = new DeferredScene();
    const switching = game.setScene(candidate, { signal: controller.signal });
    await Promise.resolve();
    controller.abort();
    expect(preparationSignal?.aborted).toBe(true);
    expect(candidate.destroyed).toBe(true);
    expect(game.scene).toBe(active);
    expect(active.destroyed).toBe(false);
    finish();
    await expect(switching).rejects.toThrow('cancelled');
    expect(game.scene).toBe(active);
    game.destroy();
  });

  it('does not roll back a published Scene when its preparation signal aborts later', async () => {
    const game = await createGame();
    const active = new Scene();
    await game.setScene(active);
    const candidate = new Scene();
    const controller = new AbortController();
    await game.setScene(candidate, { signal: controller.signal });
    controller.abort();
    expect(game.scene).toBe(candidate);
    expect(candidate.destroyed).toBe(false);
    expect(active.destroyed).toBe(true);
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

  it('publishes only after capture, freezes the visual promise while paused and releases capture after presentation', async () => {
    const game = await createGame();
    const old = new LoggingScene('old', calls);
    await game.setScene(old);
    game.start();
    frame(100);
    const capture = deferred<RenderSnapshot>(),
      capturing = deferred<void>(),
      started = deferred<void>();
    const snapshot = ownedSnapshot();
    vi.mocked(renderer.captureScene).mockImplementation(() => {
      capturing.resolve();
      return capture.promise;
    });
    const lifecycle: string[] = [];
    game.addEventListener('transitionstart', () => {
      lifecycle.push('start');
      started.resolve();
    });
    game.addEventListener('transitioncomplete', () =>
      lifecycle.push('complete'),
    );
    const next = new LoggingScene('next', calls);
    let settled = false;
    const effect = game.setScene(next, {
      transition: { kind: 'crossfade', duration: 0.05 },
    });
    void effect.then(
      () => {
        settled = true;
      },
      () => {},
    );
    await capturing.promise;
    expect(game.scene).toBe(old);
    expect(old.destroyed).toBe(false);
    frame(116);
    capture.resolve(snapshot);
    await started.promise;
    expect(game.scene).toBe(next);
    expect(old.destroyed).toBe(true);
    const oldUpdates = calls.filter((call) =>
      call.startsWith('old:update:'),
    ).length;
    frame(132);
    expect(calls.filter((call) => call.startsWith('old:update:'))).toHaveLength(
      oldUpdates,
    );
    expect(calls).toContain('next:update:0.016');
    game.pause();
    game.resize(640, 360);
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(game.transitioning).toBe(true);
    expect(snapshot.destroyed).toBe(false);
    game.resume();
    frame(1000);
    expect(game.transitioning).toBe(true);
    frame(1060);
    await effect;
    expect(settled).toBe(true);
    expect(game.transitioning).toBe(false);
    expect(snapshot.destroyed).toBe(true);
    expect(lifecycle).toEqual(['start', 'complete']);
    game.destroy();
    expect(snapshot.destroy).toHaveBeenCalledOnce();
  });

  it('retains the old Scene on capture failure and destroys a late superseded capture without publication', async () => {
    const game = await createGame();
    const old = new LoggingScene('old', calls);
    await game.setScene(old);
    game.start();
    frame(100);
    const failure = new Error('capture failed');
    vi.mocked(renderer.captureScene).mockRejectedValueOnce(failure);
    const failed = new LoggingScene('failed', calls);
    await expect(
      game.setScene(failed, { transition: { kind: 'fade', duration: 1 } }),
    ).rejects.toBe(failure);
    expect(game.scene).toBe(old);
    expect(old.destroyed).toBe(false);
    expect(failed.destroyed).toBe(true);
    frame(116);
    expect(calls).toContain('old:update:0.016');
    const capture = deferred<RenderSnapshot>(),
      capturing = deferred<void>();
    vi.mocked(renderer.captureScene).mockImplementationOnce(() => {
      capturing.resolve();
      return capture.promise;
    });
    const late = new LoggingScene('late', calls),
      snapshot = ownedSnapshot();
    const lateResult = rejected(
      game.setScene(late, { transition: { kind: 'slide', duration: 1 } }),
    );
    await capturing.promise;
    const replacement = new LoggingScene('replacement', calls);
    await game.setScene(replacement);
    expect(late.destroyed).toBe(true);
    expect(game.scene).toBe(replacement);
    capture.resolve(snapshot);
    expect((await lateResult).message).toContain('cancelled');
    expect(snapshot.destroyed).toBe(true);
    expect(snapshot.destroy).toHaveBeenCalledOnce();
    expect(calls).not.toContain('late:update:0.016');
    game.destroy();
  });

  it('keeps the latest reentrant request from a visual cancellation listener and settles both obsolete promises', async () => {
    const game = await createGame();
    const old = new LoggingScene('old', calls);
    await game.setScene(old);
    game.start();
    frame(100);
    const snapshot = ownedSnapshot(),
      started = deferred<void>();
    vi.mocked(renderer.captureScene).mockResolvedValueOnce(snapshot);
    game.addEventListener('transitionstart', () => started.resolve(), {
      once: true,
    });
    const active = new LoggingScene('active', calls);
    const firstResult = rejected(
      game.setScene(active, {
        transition: { kind: 'crossfade', duration: 10 },
      }),
    );
    await started.promise;
    game.pause();
    const interrupted = new LoggingScene('interrupted', calls),
      latest = new LoggingScene('latest', calls);
    let nested!: Promise<void>;
    game.addEventListener(
      'transitioncancel',
      () => {
        nested = game.setScene(latest);
      },
      { once: true },
    );
    const outerResult = rejected(game.setScene(interrupted));
    expect((await firstResult).message).toContain('cancelled');
    expect((await outerResult).message).toContain('cancelled');
    await nested;
    expect(game.scene).toBe(latest);
    expect(latest.destroyed).toBe(false);
    expect(interrupted.destroyed).toBe(true);
    expect(snapshot.destroy).toHaveBeenCalledOnce();
    expect(game.transitioning).toBe(false);
    game.destroy();
  });

  it('cancels an active visual effect on fatal rendering failure without prematurely destroying the published Scene', async () => {
    const game = await createGame();
    const old = new LoggingScene('old', calls);
    await game.setScene(old);
    game.start();
    frame(100);
    const snapshot = ownedSnapshot(),
      started = deferred<void>();
    vi.mocked(renderer.captureScene).mockResolvedValueOnce(snapshot);
    game.addEventListener('transitionstart', () => started.resolve(), {
      once: true,
    });
    const published = new LoggingScene('published', calls);
    const result = rejected(
      game.setScene(published, { transition: { kind: 'fade', duration: 10 } }),
    );
    await started.promise;
    const failure = new Error('renderer lost');
    let reported: Error | undefined;
    game.addEventListener('error', (event) => {
      reported = (event as CustomEvent<Error>).detail;
    });
    vi.mocked(renderer.render).mockImplementationOnce(() => {
      throw failure;
    });
    frame(116);
    expect((await result).message).toContain('cancelled');
    expect(reported).toBe(failure);
    expect(game.state).toBe('paused');
    expect(game.scene).toBe(published);
    expect(published.destroyed).toBe(false);
    expect(snapshot.destroy).toHaveBeenCalledOnce();
    expect(game.transitioning).toBe(false);
    game.destroy();
    expect(published.destroyed).toBe(true);
  });

  it('validates transition options before claiming a candidate', async () => {
    const game = await createGame(),
      next = new Scene();
    await expect(
      game.setScene(next, { transition: { kind: 'fade', duration: NaN } }),
    ).rejects.toThrow('duration');
    expect(next.destroyed).toBe(false);
    await game.setScene(next);
    expect(game.scene).toBe(next);
    game.destroy();
  });

  it('warms a candidate over RAF chunks and retains its resources only for the published scene lifetime', async () => {
    const game = await createGame(),
      old = new LoggingScene('old', calls);
    await game.setScene(old);
    const native = renderer.residency as NativeResidency;
    native.configure({ textureBytes: 32 });
    vi.mocked(renderer.prepareResource).mockImplementation(async (source) => {
      if (!(source instanceof Texture)) throw new Error('Unexpected resource.');
      native.beginCapture();
      native.textures.allocate(source.width * source.height * 4, () => {});
      return residencyLease(native.endCapture());
    });
    const candidate = new Scene();
    for (let i = 0; i < 2; i++)
      candidate.add(
        new Sprite({
          texture: new Texture({
            width: 2,
            height: 2,
            close() {},
          } as ImageBitmap),
        }),
      );
    const ratios: number[] = [];
    const switching = game.setScene(candidate, {
      warmup: {
        maxItems: 1,
        maxMilliseconds: 1000,
        onProgress: (progress) => ratios.push(progress.ratio),
      },
    });
    await vi.waitFor(() => expect(frames.size).toBe(1));
    expect(game.scene).toBe(old);
    frame(1);
    await vi.waitFor(() => expect(ratios).toEqual([0, 0.5]));
    expect(game.scene).toBe(old);
    expect(() => native.textures.allocate(32, () => {})).toThrow();
    frame(2);
    await switching;
    expect(ratios).toEqual([0, 0.5, 1]);
    expect(game.scene).toBe(candidate);
    expect(old.destroyed).toBe(true);
    await game.setScene(new Scene());
    const replacement = native.textures.allocate(32, () => {});
    expect(replacement.bytes).toBe(32);
    expect(native.textures.entries).toBe(1);
    game.destroy();
    native.clear();
  });

  it('keeps the old scene on warmup budget failure and cancellation, releasing only the candidate leases', async () => {
    const game = await createGame(),
      old = new Scene();
    await game.setScene(old);
    const native = renderer.residency as NativeResidency;
    native.configure({ textureBytes: 16 });
    vi.mocked(renderer.prepareResource).mockImplementation(async (source) => {
      if (!(source instanceof Texture)) throw new Error('Unexpected resource.');
      native.beginCapture();
      try {
        native.textures.allocate(source.width * source.height * 4, () => {});
        return residencyLease(native.endCapture());
      } catch (error) {
        residencyLease(native.endCapture()).release();
        throw error;
      }
    });
    const texture = new Texture({
      width: 2,
      height: 2,
      close() {},
    } as ImageBitmap);
    const candidate = new Scene();
    candidate.add(new Sprite({ texture }));
    candidate.add(
      new Sprite({
        texture: new Texture({
          width: 2,
          height: 2,
          close() {},
        } as ImageBitmap),
      }),
    );
    const switching = game.setScene(candidate, { warmup: { maxItems: 1 } });
    const failed = expect(switching).rejects.toThrow();
    await vi.waitFor(() => expect(frames.size).toBe(1));
    frame(1);
    await vi.waitFor(() => expect(frames.size).toBe(1));
    frame(2);
    await failed;
    expect(game.scene).toBe(old);
    expect(old.destroyed).toBe(false);
    expect(candidate.destroyed).toBe(true);
    expect(texture.destroyed).toBe(false);
    native.textures.allocate(16, () => {});

    const controller = new AbortController(),
      cancelled = new Scene();
    cancelled.add(new Sprite({ texture }));
    const pending = game.setScene(cancelled, {
      warmup: { signal: controller.signal },
    });
    const cancelledFailure = expect(pending).rejects.toThrow();
    await vi.waitFor(() => expect(frames.size).toBe(1));
    controller.abort(new Error('leave loading'));
    await cancelledFailure;
    expect(frames.size).toBe(0);
    expect(game.scene).toBe(old);
    expect(cancelled.destroyed).toBe(true);
    expect(texture.destroyed).toBe(false);
    game.destroy();
    native.clear();
  });

  it('preserves submitted old-frame allocations across an impossible candidate handoff and keeps rendering', async () => {
    const game = await createGame(),
      old = new Scene();
    const texture = new Texture({
      width: 2,
      height: 2,
      close() {},
    } as ImageBitmap);
    old.add(new Sprite({ texture }));
    await game.setScene(old);
    const native = renderer.residency as NativeResidency;
    native.configure({ textureBytes: 16 });
    let oldAllocation = native.textures.allocate(16, () => {});
    native.beginFrame();
    oldAllocation.touch();
    native.endFrame();
    vi.mocked(renderer.prepareResource).mockImplementation(async (source) => {
      native.beginCapture();
      try {
        if (source === texture) oldAllocation.touch();
        else native.textures.allocate(16, () => {});
        return residencyLease(native.endCapture());
      } catch (error) {
        residencyLease(native.endCapture()).release();
        throw error;
      }
    });
    vi.mocked(renderer.render).mockImplementation(() => {
      native.beginFrame();
      if (oldAllocation.destroyed)
        oldAllocation = native.textures.allocate(16, () => {});
      oldAllocation.touch();
      native.endFrame();
    });
    const candidate = new Scene();
    candidate.add(
      new Sprite({
        texture: new Texture({
          width: 2,
          height: 2,
          close() {},
        } as ImageBitmap),
      }),
    );
    const pending = game.setScene(candidate, { warmup: { maxItems: 1 } });
    const failure = expect(pending).rejects.toThrow();
    await vi.waitFor(() => expect(frames.size).toBe(1));
    frame(1);
    await vi.waitFor(() => expect(frames.size).toBe(1));
    frame(2);
    await failure;
    expect(oldAllocation.destroyed).toBe(false);
    expect(game.scene).toBe(old);
    game.start();
    frame(3);
    expect(game.state).toBe('running');
    expect(old.destroyed).toBe(false);
    expect(texture.destroyed).toBe(false);
    game.destroy();
    native.clear();
  });

  it('cancels a pending standalone warmup before publishing a different active scene', async () => {
    const game = await createGame();
    await game.setScene(new Scene());
    const native = installTextureCache(16),
      candidate = new Scene();
    candidate.add(
      new Sprite({
        texture: new Texture({
          width: 2,
          height: 2,
          close() {},
        } as ImageBitmap),
      }),
    );
    const pending = game.warmup(candidate, { maxItems: 1 });
    void pending.catch(() => {});
    try {
      await vi.waitFor(() => expect(frames.size).toBe(1));
      const active = new Scene();
      active.add(
        new Sprite({
          texture: new Texture({
            width: 2,
            height: 2,
            close() {},
          } as ImageBitmap),
        }),
      );
      await game.setScene(active);
      renderer.render(active, 1280, 720);
      if (frames.size) frame(1);
      await expect(pending).rejects.toThrow();
      expect(game.scene).toBe(active);
      expect(native.textures.evictions).toBe(0);
      game.start();
      frame(2);
      frame(3);
      expect(game.state).toBe('running');
    } finally {
      game.destroy();
      native.clear();
      await pending.catch(() => {});
    }
  });

  it('protects the submitted visible texture while warming hidden resources in the current scene', async () => {
    const game = await createGame(),
      active = new Scene();
    const hidden = new Sprite({
      texture: new Texture({ width: 2, height: 2, close() {} } as ImageBitmap),
    });
    hidden.visible = false;
    active.add(hidden);
    active.add(
      new Sprite({
        texture: new Texture({
          width: 2,
          height: 2,
          close() {},
        } as ImageBitmap),
      }),
    );
    await game.setScene(active);
    const native = installTextureCache(16);
    renderer.render(active, 1280, 720);
    let settled = false;
    const pending = game.warmup(active, { maxItems: 1 });
    void pending.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    try {
      await vi.waitFor(() => expect(frames.size).toBe(1));
      frame(1);
      await vi.waitFor(() => expect(settled || frames.size > 0).toBe(true));
      expect(() => renderer.render(active, 1280, 720)).not.toThrow();
      if (!settled && frames.size) frame(2);
      await expect(pending).rejects.toThrow();
      expect(native.textures.evictions).toBe(0);
      game.start();
      frame(3);
      expect(game.state).toBe('running');
    } finally {
      game.destroy();
      native.clear();
      await pending.catch(() => {});
    }
  });

  it('cancels in-flight upload ownership before a newly published scene needs the budget', async () => {
    const game = await createGame();
    await game.setScene(new Scene());
    let complete!: () => void;
    const work = new Promise<void>((resolve) => {
      complete = resolve;
    });
    const native = installTextureCache(16, work),
      candidate = new Scene();
    candidate.add(
      new Sprite({
        texture: new Texture({
          width: 2,
          height: 2,
          close() {},
        } as ImageBitmap),
      }),
    );
    const pending = game.warmup(candidate, { maxItems: 1 });
    void pending.catch(() => {});
    try {
      await vi.waitFor(() => expect(frames.size).toBe(1));
      frame(1);
      await vi.waitFor(() => expect(native.textures.liveBytes).toBe(16));
      const active = new Scene();
      active.add(
        new Sprite({
          texture: new Texture({
            width: 2,
            height: 2,
            close() {},
          } as ImageBitmap),
        }),
      );
      await game.setScene(active);
      expect(() => renderer.render(active, 1280, 720)).not.toThrow();
      await expect(pending).rejects.toThrow();
      expect(game.scene).toBe(active);
      expect(native.textures.evictions).toBe(1);
      game.start();
      frame(2);
      expect(game.state).toBe('running');
    } finally {
      complete();
      game.destroy();
      native.clear();
      await pending.catch(() => {});
    }
  });
});
