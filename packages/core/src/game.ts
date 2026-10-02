import { defaults } from '../../../src/data/defaults.js';
import {
  AssetLoader,
  ResourcePool,
  type PreloadBatch,
} from '../../assets/src/index.js';
import { InputManager } from '../../input/src/index.js';
import { AudioManager } from '../../audio/src/audio-manager.js';
import {
  createRenderer,
  type Renderer,
  type RendererPreference,
  type FrameEffects,
  type RenderSnapshot,
  type GpuTimingOptions,
} from '../../graphics/src/index.js';
import type { PreparedResourceLease } from '../../graphics/src/index.js';
import { Scene } from './scene.js';
import { Clock } from './clock.js';
import { RuntimeError } from './errors.js';
import { logger } from './logger.js';
import {
  TransitionController,
  type TransitionOptions,
} from './transitions2d/index.js';
import { AccessibilityManager } from './accessibility/index.js';
import { AccessibilityPreferences } from './accessibility/preferences.js';
import { SaveManager, type SaveSchema, type SaveStorage } from './storage.js';
import { I18n, type I18nOptions } from './i18n.js';
import { warmupScene } from '../../graphics/src/warmup.js';
import type { WarmupOptions, WarmupLease } from '../../graphics/src/warmup.js';
import { FrameWorkCounter, type FrameWorkStats } from './frame-work.js';
export type { FrameWorkStats } from './frame-work.js';
import type {
  FactoryDefinitions,
  FactoryRegistry,
  FactoryServices,
} from './factories.js';
import type {
  ContentLoadCoordinator,
  ContentPublicationHost,
} from './content-storage.js';
export type {
  WarmupOptions,
  WarmupProgress,
  WarmupLease,
} from '../../graphics/src/warmup.js';
export interface ResourceBudgets {
  decodedTextureBytes?: number;
  nativeTextureBytes?: number;
  nativeGeometryBytes?: number;
}

class SceneCancelledError extends RuntimeError {
  constructor() {
    super('Scene initialization was cancelled.');
  }
}
// GPU canvas contexts are exclusive even while a renderer is initializing.
const claimedCanvases = new WeakSet<HTMLCanvasElement>();

export interface GameOptions {
  canvas: string | HTMLCanvasElement;
  renderer?: RendererPreference;
  width?: number;
  height?: number;
  maxDeltaTime?: number;
  /** Defaults to devicePixelRatio capped at the engine's configured maximum. */
  pixelRatio?: number;
  /** Follow the canvas CSS content size. Enabled by default. */
  autoResize?: boolean;
  /**
   * 4× multisampling for the 3D pass (WebGPU) and the default WebGL2 framebuffer.
   * Enabled by default; the WebGL2 post-processing path and Canvas2D do not multisample.
   */
  antialias?: boolean;
  /**
   * Rebuild a lost WebGL2 context or WebGPU device and keep running, emitting
   * `graphicslost` and `graphicsrecovered`. Enabled by default; when false a loss is fatal.
   */
  recoverGraphics?: boolean;
  /** Optional native GPU timestamps; unsupported backends report an explicit status. */
  gpuTiming?: GpuTimingOptions;
  /** Defaults to an isolated in-memory store; inject a browser backend for persistence. */
  saveStorage?: SaveStorage;
  saveSchema?: SaveSchema;
  /** Locale registry, exposed as `game.i18n`; defaults to locale `en` with no messages. */
  i18n?: I18nOptions;
  /** Independent decoded CPU / native texture / native geometry cache estimates. */
  resourceBudgets?: ResourceBudgets;
  /** Opt-in whole-frame CPU target and stage attribution; callbacks cannot be preempted. */
  frameWorkBudgetMs?: number;
  /**
   * Freezes `game.audio` together with the game. `onPause` follows `pause()`/`resume()`;
   * `onHidden` follows the page becoming hidden or visible. Both default to false, so audio keeps
   * playing as it always did.
   */
  audioPause?: { onPause?: boolean; onHidden?: boolean };
}

export type GameState = 'idle' | 'running' | 'paused' | 'destroyed';

export interface SetSceneOptions {
  transition?: TransitionOptions;
  /** Warm the initialized candidate in bounded RAF chunks before atomic publication. */
  warmup?: WarmupOptions;
  /** Cancel candidate preparation before publication; a published Scene is never rolled back. */
  signal?: AbortSignal;
}
export interface SceneTransitionEventDetail {
  readonly from: Scene;
  readonly to: Scene;
  readonly kind: TransitionOptions['kind'];
}
interface ActiveSceneTransition {
  readonly controller: TransitionController;
  readonly detail: SceneTransitionEventDetail;
  readonly finished: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (reason: unknown) => void;
}

/** Browser runtime controller. GPU handles remain private to the renderer. */
export class Game extends EventTarget {
  readonly canvas: HTMLCanvasElement;
  readonly graphics: Renderer;
  readonly clock: Clock;
  readonly assets: AssetLoader;
  readonly input: InputManager;
  readonly saves: SaveManager;
  readonly i18n: I18n;
  readonly audio = new AudioManager(
    () => this.currentScene,
    (error) =>
      this.dispatchEvent(new CustomEvent<Error>('error', { detail: error })),
  );
  private currentState: GameState = 'idle';
  private currentScene: Scene | undefined;
  private updatingScene: Scene | undefined;
  private readonly canUpdateScene = (): boolean =>
    this.currentState === 'running' &&
    this.updatingScene === this.currentScene &&
    !!this.updatingScene &&
    !this.updatingScene.destroyed;
  private pendingScene: Scene | undefined;
  private pendingCompletion: Promise<void> | undefined;
  private loadingBatch: PreloadBatch | undefined;
  private loadingScene: Scene | undefined;
  private activeTransition: ActiveSceneTransition | undefined;
  private readonly frameEffects: FrameEffects = {};
  private readonly frameWorkCounter = new FrameWorkCounter();
  get frameWork(): FrameWorkStats {
    return this.frameWorkCounter;
  }
  private sceneVersion = 0;
  private switchingScene = false;
  private requestId: number | undefined;
  private observer: ResizeObserver | undefined;
  private logicalWidth: number;
  private logicalHeight: number;
  private readonly fixedPixelRatio: number | undefined;
  private appliedPixelRatio = 0;
  private fatalError: Error | undefined;
  private appliedContain: string | undefined;
  private appliedIntrinsicSize: string | undefined;
  private readonly previousContain: { value: string; priority: string };
  private readonly previousIntrinsicSize: { value: string; priority: string };
  private readonly autoResize: boolean;
  private readonly audioPause: { onPause: boolean; onHidden: boolean };
  private readonly accessibilityManager: AccessibilityManager;
  private readonly accessibilitySize = { width: 0, height: 0 };
  private preferencePolicy: AccessibilityPreferences | undefined;
  private readonly onMotionPreferenceChange = (): void => {
    if (this.preferencePolicy?.values.reducedMotion && this.activeTransition)
      this.completeTransition(this.activeTransition);
  };
  private readonly warmupControllers = new Set<AbortController>();
  private readonly warmupLeases = new Set<WarmupLease>();
  private currentWarmup: WarmupLease | undefined;
  private readonly warmupProtections = new Map<WarmupLease, () => void>();
  private resourcePool: ResourcePool | undefined;
  private contentLifetime: AbortController | undefined;

  /** Shared acquisition ownership is lazy and local to this Game. */
  get resources(): ResourcePool {
    if (!this.resourcePool) {
      if (this.currentState === 'destroyed')
        throw new RuntimeError('Cannot create resources for a destroyed Game.');
      this.resourcePool = new ResourcePool(this.assets);
    }
    return this.resourcePool;
  }
  /** Player presentation policy; unused games do not install OS media listeners. */
  get preferences(): AccessibilityPreferences {
    if (!this.preferencePolicy) {
      if (this.currentState === 'destroyed')
        throw new RuntimeError(
          'Cannot create preferences for a destroyed Game.',
        );
      this.preferencePolicy = new AccessibilityPreferences();
      this.preferencePolicy.addEventListener(
        'change',
        this.onMotionPreferenceChange,
      );
    }
    return this.preferencePolicy;
  }

  /** Load/migrate/restore a fresh candidate before the existing Scene publication barrier. */
  async createContentLoader<Definitions extends FactoryDefinitions>(
    registry: FactoryRegistry<Definitions>,
    services: FactoryServices<Definitions>,
  ): Promise<ContentLoadCoordinator<Definitions>> {
    if (this.currentState === 'destroyed')
      throw new RuntimeError(
        'Cannot create a content loader for a destroyed Game.',
      );
    const { ContentLoadCoordinator } = await import('./content-storage.js');
    if (this.state === 'destroyed')
      throw new RuntimeError(
        'Game was destroyed while creating a content loader.',
      );
    this.contentLifetime ??= new AbortController();
    const host: ContentPublicationHost<Definitions> & { readonly owner: Game } =
      {
        owner: this,
        signal: this.contentLifetime.signal,
        get destroyed() {
          return this.owner.state === 'destroyed';
        },
        get revision() {
          return this.owner.sceneVersion;
        },
        get scene() {
          return this.owner.scene;
        },
        async publish(candidate, signal, expectedRevision) {
          signal.throwIfAborted();
          if (
            this.owner.state === 'destroyed' ||
            this.owner.sceneVersion !== expectedRevision
          )
            throw new SceneCancelledError();
          await this.owner.setScene(candidate.scene, { signal });
        },
      };
    return new ContentLoadCoordinator(registry, services, this.resources, host);
  }

  get accessibility(): AccessibilityManager {
    return this.accessibilityManager;
  }

  async warmup(
    scene: Scene,
    options: WarmupOptions = {},
  ): Promise<WarmupLease> {
    if (this.currentState === 'destroyed')
      throw new RuntimeError('Cannot warm up a destroyed Game.');
    const controller = new AbortController();
    const abort = (): void => controller.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    this.warmupControllers.add(controller);
    let previousFrame: PreparedResourceLease | undefined;
    let previousScene: WarmupLease | undefined;
    try {
      const current = this.currentScene;
      previousFrame = this.graphics.retainFrameResources();
      if (current && !current.destroyed) {
        previousScene = await warmupScene(
          this.graphics,
          current,
          {
            maxItems: options.maxItems,
            maxMilliseconds: options.maxMilliseconds,
            signal: controller.signal,
          },
          true,
        );
      }
      const native = await warmupScene(this.graphics, scene, {
        ...options,
        signal: controller.signal,
      });
      if (controller.signal.aborted || this.state === 'destroyed') {
        native.release();
        controller.signal.throwIfAborted();
        throw new RuntimeError('Game was destroyed during warmup.');
      }
      const protectedFrame = previousFrame,
        protectedScene = previousScene;
      const releasePrevious = (): void => {
        this.warmupProtections.delete(lease);
        protectedScene?.release();
        protectedFrame?.release();
      };
      const lease: WarmupLease = {
        progress: native.progress,
        get released() {
          return native.released;
        },
        release: () => {
          this.warmupLeases.delete(lease);
          releasePrevious();
          native.release();
        },
      };
      this.warmupLeases.add(lease);
      if (protectedFrame || protectedScene)
        this.warmupProtections.set(lease, releasePrevious);
      previousFrame = undefined;
      previousScene = undefined;
      return lease;
    } finally {
      previousScene?.release();
      previousFrame?.release();
      this.warmupControllers.delete(controller);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  private constructor(
    canvas: HTMLCanvasElement,
    graphics: Renderer,
    clock: Clock,
    options: GameOptions,
  ) {
    super();
    this.canvas = canvas;
    this.graphics = graphics;
    this.clock = clock;
    this.assets = new AssetLoader(undefined, {
      decodedTextureBytes: options.resourceBudgets?.decodedTextureBytes,
    });
    this.logicalWidth = options.width ?? defaults.width;
    this.logicalHeight = options.height ?? defaults.height;
    this.fixedPixelRatio = options.pixelRatio;
    this.autoResize = options.autoResize !== false;
    this.input = new InputManager(canvas, () => this);
    this.saves = new SaveManager(options.saveStorage, options.saveSchema);
    this.i18n = new I18n(options.i18n);
    this.frameWorkCounter.budgetMs = options.frameWorkBudgetMs ?? null;
    this.audioPause = {
      onPause: options.audioPause?.onPause ?? false,
      onHidden: options.audioPause?.onHidden ?? false,
    };
    this.accessibilityManager = new AccessibilityManager(canvas, () => {
      this.accessibilitySize.width = this.logicalWidth;
      this.accessibilitySize.height = this.logicalHeight;
      return this.accessibilitySize;
    });
    this.previousContain = {
      value: canvas.style.getPropertyValue('contain'),
      priority: canvas.style.getPropertyPriority('contain'),
    };
    this.previousIntrinsicSize = {
      value: canvas.style.getPropertyValue('contain-intrinsic-size'),
      priority: canvas.style.getPropertyPriority('contain-intrinsic-size'),
    };
    try {
      this.installLayout();
      this.resize(this.logicalWidth, this.logicalHeight);
      if (this.autoResize) {
        this.observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (
            entry &&
            this.currentState !== 'destroyed' &&
            entry.contentRect.width > 0 &&
            entry.contentRect.height > 0
          ) {
            try {
              this.resizeBacking(
                entry.contentRect.width,
                entry.contentRect.height,
              );
            } catch (cause) {
              this.fail(
                cause instanceof Error
                  ? cause
                  : new RuntimeError('Canvas resize failed.', { cause }),
              );
            }
          }
        });
        this.observer.observe(canvas);
      }
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    } catch (cause) {
      try {
        this.cleanup();
      } catch (cleanupError) {
        throw new AggregateError(
          [cause, cleanupError],
          'Game initialization and cleanup failed.',
          { cause: cleanupError },
        );
      }
      throw cause;
    }
  }

  static async create(options: GameOptions): Promise<Game> {
    let canvas: Element | null;
    try {
      canvas =
        typeof options.canvas === 'string'
          ? document.querySelector(options.canvas)
          : options.canvas;
    } catch (cause) {
      throw new RuntimeError(
        'Canvas selector is invalid. Supply a valid selector or HTMLCanvasElement.',
        { cause },
      );
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new RuntimeError(
        'Canvas was not found or is not an HTMLCanvasElement. Create the canvas before Game.create().',
      );
    }
    const width = options.width ?? defaults.width;
    const height = options.height ?? defaults.height;
    if (
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(height) ||
      height <= 0
    ) {
      throw new RuntimeError(
        'Canvas width and height must be finite positive CSS pixel values.',
      );
    }
    if (
      options.pixelRatio !== undefined &&
      (!Number.isFinite(options.pixelRatio) || options.pixelRatio <= 0)
    ) {
      throw new RuntimeError(
        'Canvas pixelRatio must be a finite positive number.',
      );
    }
    if (
      options.frameWorkBudgetMs !== undefined &&
      (!Number.isFinite(options.frameWorkBudgetMs) ||
        options.frameWorkBudgetMs <= 0)
    )
      throw new RuntimeError(
        'frameWorkBudgetMs must be a finite positive CPU target.',
      );
    const clock = new Clock(options.maxDeltaTime);
    if (claimedCanvases.has(canvas)) {
      throw new RuntimeError(
        'Canvas is already owned by a Game. Destroy the existing Game before creating another on this canvas.',
      );
    }
    claimedCanvases.add(canvas);
    let game: Game | undefined;
    let graphics: Renderer | undefined;
    let initializationError: Error | undefined;
    try {
      graphics = await createRenderer(
        canvas,
        options.renderer ?? 'auto',
        (error) => {
          if (game) game.fail(error);
          else initializationError = error;
        },
        {
          antialias: options.antialias,
          recover: options.recoverGraphics,
          gpuTiming: options.gpuTiming,
          residency: {
            textureBytes: options.resourceBudgets?.nativeTextureBytes,
            geometryBytes: options.resourceBudgets?.nativeGeometryBytes,
          },
          onLost: (error) => {
            // Snapshots and captures belong to the lost device.
            game?.cancelTransition();
            game?.dispatchEvent(
              new CustomEvent<Error>('graphicslost', { detail: error }),
            );
          },
          onRecovered: () =>
            game?.dispatchEvent(new CustomEvent('graphicsrecovered')),
        },
      );
      if (initializationError) throw initializationError;
      game = new Game(canvas, graphics, clock, options);
      return game;
    } catch (cause) {
      try {
        graphics?.destroy();
      } catch (cleanupError) {
        throw new AggregateError(
          [cause, cleanupError],
          'Game initialization and renderer cleanup failed.',
          { cause: cleanupError },
        );
      } finally {
        claimedCanvases.delete(canvas);
      }
      throw cause;
    }
  }

  get state(): GameState {
    return this.currentState;
  }
  get width(): number {
    return this.logicalWidth;
  }
  get height(): number {
    return this.logicalHeight;
  }
  get scene(): Scene | undefined {
    return this.currentScene;
  }
  get loading(): PreloadBatch | undefined {
    return this.loadingBatch;
  }
  /** @internal Older async candidates cannot overwrite or clear a newer loading barrier. */
  setLoading(scene: Scene, batch: PreloadBatch | undefined): void {
    if (batch) {
      if (
        this.pendingScene !== scene ||
        this.currentState === 'destroyed' ||
        scene.destroyed
      )
        return;
      this.loadingScene = scene;
      this.loadingBatch = batch;
    } else if (this.loadingScene === scene) {
      this.loadingScene = undefined;
      this.loadingBatch = undefined;
    }
  }
  get transitioning(): boolean {
    return !!this.activeTransition;
  }

  private cancelTransition(): void {
    const active = this.activeTransition;
    if (!active) return;
    this.activeTransition = undefined;
    this.frameEffects.transition = undefined;
    try {
      active.controller.destroy();
    } finally {
      active.reject(new SceneCancelledError());
      this.dispatchEvent(
        new CustomEvent('transitioncancel', { detail: active.detail }),
      );
    }
  }

  private completeTransition(active: ActiveSceneTransition): void {
    if (this.activeTransition !== active) return;
    this.activeTransition = undefined;
    this.frameEffects.transition = undefined;
    try {
      active.controller.destroy();
    } catch (error) {
      active.reject(error);
      throw error;
    }
    active.resolve();
    this.dispatchEvent(
      new CustomEvent('transitioncomplete', { detail: active.detail }),
    );
  }

  private beginTransition(
    controller: TransitionController,
    from: Scene,
    to: Scene,
  ): ActiveSceneTransition {
    let resolve!: () => void;
    let reject!: (reason: unknown) => void;
    const finished = new Promise<void>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    const active: ActiveSceneTransition = {
      controller,
      detail: Object.freeze({ from, to, kind: controller.kind }),
      finished,
      resolve,
      reject,
    };
    this.activeTransition = active;
    if (controller.blockInput) {
      to.resetPointerRouting();
      this.input.pointer.reset();
    }
    this.dispatchEvent(
      new CustomEvent('transitionstart', { detail: active.detail }),
    );
    if (this.preferencePolicy?.values.reducedMotion)
      this.completeTransition(active);
    return active;
  }

  start(scene?: Scene): void {
    if (this.currentState === 'destroyed')
      throw new RuntimeError(
        'Cannot start a destroyed Game. Create a new Game instance.',
      );
    if (this.fatalError)
      throw new RuntimeError(
        'Cannot start a Game after a fatal runtime error. Destroy it and create a new Game.',
        { cause: this.fatalError },
      );
    if (scene) {
      void this.setScene(scene).catch((error: unknown) => {
        if (
          !(error instanceof SceneCancelledError) &&
          this.currentState !== 'destroyed'
        ) {
          this.dispatchEvent(new CustomEvent('error', { detail: error }));
        }
      });
    }
    if (this.currentState === 'running') return;
    this.currentState = 'running';
    this.currentScene?.setWorldStreamingPaused(document.hidden);
    if (this.audioPause.onPause) this.audio.resume('game');
    this.clock.suspend();
    this.input.reset();
    if (!document.hidden) this.requestId = requestAnimationFrame(this.onFrame);
  }

  /** Prepare/capture before publication; only the published Scene participates in simulation. */
  async setScene(next: Scene, options: SetSceneOptions = {}): Promise<void> {
    if (this.currentState === 'destroyed')
      throw new RuntimeError('Cannot set a Scene on a destroyed Game.');
    if (this.switchingScene)
      throw new RuntimeError('Cannot switch Scenes during scene disposal.');
    options.signal?.throwIfAborted();
    if (next === this.pendingScene) return this.pendingCompletion;
    const transitionOptions = options.transition
      ? this.preferences.transition(options.transition)
      : undefined;
    const transition = transitionOptions
      ? new TransitionController(transitionOptions)
      : undefined;
    if (next === this.currentScene) {
      transition?.destroy();
      try {
        if (this.pendingScene) {
          const pending = this.pendingScene;
          this.pendingScene = undefined;
          this.pendingCompletion = undefined;
          this.sceneVersion++;
          this.switchingScene = true;
          try {
            pending.cancel();
          } finally {
            this.switchingScene = false;
          }
        }
      } finally {
        this.cancelTransition();
      }
      return;
    }
    const signal = next.claim(this);
    const prior = this.pendingScene;
    this.pendingScene = next;
    const version = ++this.sceneVersion;
    let abortCleanupError: unknown;
    const abortCandidate = (): void => {
      if (this.pendingScene !== next || this.currentScene === next) return;
      try {
        next.cancel();
      } catch (error) {
        abortCleanupError = error;
      }
    };
    options.signal?.addEventListener('abort', abortCandidate, { once: true });
    if (options.signal?.aborted) abortCandidate();
    try {
      this.cancelTransition();
      if (prior) {
        this.switchingScene = true;
        try {
          prior.cancel();
        } finally {
          this.switchingScene = false;
        }
      }
    } catch (error) {
      transition?.destroy();
      if (this.pendingScene === next) this.pendingScene = undefined;
      options.signal?.removeEventListener('abort', abortCandidate);
      try {
        next.cancel();
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Scene cancellation and cleanup failed.',
          { cause: cleanupError },
        );
      }
      throw error;
    }
    const completion = Promise.resolve().then(async () => {
      let snapshot: RenderSnapshot | undefined;
      let warmed: WarmupLease | undefined;
      try {
        options.signal?.throwIfAborted();
        if (signal.aborted) throw new SceneCancelledError();
        await next.prepare(this, signal);
        if (options.warmup) {
          const warmupController = new AbortController();
          const abortScene = (): void => warmupController.abort(signal.reason);
          const abortWarmup = (): void =>
            warmupController.abort(options.warmup?.signal?.reason);
          signal.addEventListener('abort', abortScene, { once: true });
          options.warmup.signal?.addEventListener('abort', abortWarmup, {
            once: true,
          });
          if (signal.aborted) abortScene();
          if (options.warmup.signal?.aborted) abortWarmup();
          try {
            warmed = await this.warmup(next, {
              ...options.warmup,
              signal: warmupController.signal,
            });
          } finally {
            signal.removeEventListener('abort', abortScene);
            options.warmup.signal?.removeEventListener('abort', abortWarmup);
          }
        }
        options.warmup?.signal?.throwIfAborted();
        if (abortCleanupError !== undefined) throw abortCleanupError;
        options.signal?.throwIfAborted();
        if (
          signal.aborted ||
          version !== this.sceneVersion ||
          this.currentState === 'destroyed' ||
          this.fatalError
        )
          throw new SceneCancelledError();
        const old = this.currentScene;
        const visual = !!(
          old &&
          transition &&
          !this.preferencePolicy?.values.reducedMotion &&
          transition.duration > 0 &&
          this.currentState !== 'idle'
        );
        if (visual) {
          snapshot = await this.graphics.captureScene(
            old!,
            this.logicalWidth,
            this.logicalHeight,
          );
          options.signal?.throwIfAborted();
          if (
            signal.aborted ||
            version !== this.sceneVersion ||
            this.state === 'destroyed' ||
            this.fatalError
          )
            throw new SceneCancelledError();
          transition!.attachSnapshot(snapshot);
          snapshot = undefined;
        }
        options.signal?.removeEventListener('abort', abortCandidate);
        this.pendingScene = undefined;
        this.pendingCompletion = undefined;
        this.switchingScene = true;
        try {
          for (const controller of this.warmupControllers)
            controller.abort(new SceneCancelledError());
          const previousWarmup = this.currentWarmup;
          this.currentWarmup = warmed;
          if (warmed) this.warmupProtections.get(warmed)?.();
          warmed = undefined;
          previousWarmup?.release();
          this.currentScene = next;
          next.setWorldStreamingPaused(
            this.currentState !== 'running' || document.hidden,
          );
          this.accessibilityManager.reset();
          old?.destroy();
        } finally {
          this.switchingScene = false;
        }
        if (
          signal.aborted ||
          next.destroyed ||
          this.currentScene !== next ||
          this.state === 'destroyed' ||
          this.fatalError
        )
          throw new SceneCancelledError();
        if (visual && !this.preferencePolicy?.values.reducedMotion)
          await this.beginTransition(transition!, old!, next).finished;
      } catch (error) {
        if (this.pendingScene === next) {
          this.pendingScene = undefined;
          this.pendingCompletion = undefined;
        }
        const reason =
          abortCleanupError !== undefined
            ? new AggregateError(
                [error, abortCleanupError],
                'Scene cancellation and cleanup failed.',
                { cause: abortCleanupError },
              )
            : signal.aborted && this.currentScene !== next
              ? new SceneCancelledError()
              : error;
        if (this.currentScene !== next) {
          try {
            next.cancel();
          } catch (cleanupError) {
            throw new AggregateError(
              [reason, cleanupError],
              'Scene preparation and cleanup failed.',
              { cause: cleanupError },
            );
          }
        }
        throw reason;
      } finally {
        options.signal?.removeEventListener('abort', abortCandidate);
        warmed?.release();
        snapshot?.destroy();
        if (this.activeTransition?.controller !== transition)
          transition?.destroy();
      }
    });
    // A transitioncancel listener may synchronously request a newer candidate.
    if (this.pendingScene === next && this.sceneVersion === version)
      this.pendingCompletion = completion;
    return completion;
  }

  /** @internal Called when a Scene is explicitly disposed by its owner. */
  onSceneDisposed(scene: Scene): void {
    this.setLoading(scene, undefined);
    if (this.currentScene === scene) {
      for (const controller of this.warmupControllers)
        controller.abort(new SceneCancelledError());
      this.currentScene = undefined;
      this.currentWarmup?.release();
      this.currentWarmup = undefined;
      this.accessibilityManager.reset();
    }
    if (this.activeTransition?.detail.to === scene) this.cancelTransition();
    if (this.pendingScene === scene) {
      this.pendingScene = undefined;
      this.sceneVersion++;
    }
  }

  pause(): void {
    if (this.currentState === 'destroyed' || this.currentState === 'paused')
      return;
    this.currentState = 'paused';
    this.currentScene?.setWorldStreamingPaused(true);
    if (this.audioPause.onPause) this.audio.pause('game');
    if (this.requestId !== undefined) cancelAnimationFrame(this.requestId);
    this.requestId = undefined;
    this.clock.suspend();
    this.currentScene?.resetPointerRouting();
    this.accessibilityManager.reset();
    this.input.reset();
  }

  resume(): void {
    this.start();
  }

  resize(width: number, height: number): void {
    if (this.currentState === 'destroyed')
      throw new RuntimeError('Cannot resize a destroyed Game.');
    this.validateSize(width, height);
    const oldIntrinsicSize = this.appliedIntrinsicSize;
    const oldPixelWidth = this.canvas.width;
    const oldPixelHeight = this.canvas.height;
    const oldWidth = this.logicalWidth;
    const oldHeight = this.logicalHeight;
    const oldRatio = this.appliedPixelRatio;
    let seeded = false;
    try {
      this.setIntrinsicSize(width, height);
      // Canvas width/height attributes also supply a CSS aspect-ratio hint.
      // Seed the requested ratio before measuring authored auto-sized axes.
      this.resizeBacking(width, height);
      seeded = true;
      if (this.autoResize) {
        const size = this.contentSize();
        if (size && (size.width !== width || size.height !== height)) {
          this.resizeBacking(size.width, size.height);
        }
      }
    } catch (cause) {
      if (oldIntrinsicSize !== undefined) {
        this.canvas.style.setProperty(
          'contain-intrinsic-size',
          oldIntrinsicSize,
          this.previousIntrinsicSize.priority,
        );
        this.appliedIntrinsicSize = oldIntrinsicSize;
      }
      if (seeded) {
        try {
          this.graphics.resize(oldPixelWidth, oldPixelHeight);
        } catch (rollbackError) {
          throw new AggregateError(
            [cause, rollbackError],
            'Canvas resize and backing restoration failed.',
            { cause: rollbackError },
          );
        } finally {
          this.logicalWidth = oldWidth;
          this.logicalHeight = oldHeight;
          this.appliedPixelRatio = oldRatio;
        }
      }
      throw cause;
    }
  }

  destroy(): void {
    if (this.currentState === 'destroyed') return;
    this.pause();
    this.currentState = 'destroyed';
    this.sceneVersion++;
    this.contentLifetime?.abort(
      new RuntimeError('Game content owner was destroyed.'),
    );
    for (const controller of this.warmupControllers)
      controller.abort(new RuntimeError('Game was destroyed during warmup.'));
    for (const lease of this.warmupLeases) lease.release();
    this.currentWarmup = undefined;
    const pending = this.pendingScene;
    const current = this.currentScene;
    this.pendingScene = undefined;
    this.currentScene = undefined;
    const errors: unknown[] = [];
    try {
      this.cancelTransition();
    } catch (error) {
      errors.push(error);
    }
    try {
      pending?.cancel();
    } catch (error) {
      errors.push(error);
    }
    try {
      current?.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.cleanup();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.graphics.destroy();
    } catch (error) {
      errors.push(error);
    } finally {
      claimedCanvases.delete(this.canvas);
    }
    let resourcesDetached = true;
    try {
      this.resourcePool?.destroy();
    } catch (error) {
      resourcesDetached = false;
      errors.push(error);
    }
    if (resourcesDetached) {
      try {
        this.assets.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      this.audio.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.saves.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.preferencePolicy?.removeEventListener(
        'change',
        this.onMotionPreferenceChange,
      );
      this.preferencePolicy?.destroy();
    } catch (error) {
      errors.push(error);
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length) throw new AggregateError(errors, 'Game cleanup failed.');
  }

  private installLayout(): void {
    const computed = getComputedStyle(this.canvas).contain;
    const contain =
      computed === 'strict' || computed === 'content'
        ? 'strict'
        : [
            'size',
            ...computed
              .split(/\s+/)
              .filter(
                (token) =>
                  token &&
                  token !== 'none' &&
                  token !== 'inline-size' &&
                  token !== 'size',
              ),
          ].join(' ');
    this.canvas.style.setProperty(
      'contain',
      contain,
      this.previousContain.priority,
    );
    this.appliedContain = this.canvas.style.getPropertyValue('contain');
    this.setIntrinsicSize(this.logicalWidth, this.logicalHeight);
  }

  private setIntrinsicSize(width: number, height: number): void {
    const size = `${width}px ${height}px`;
    this.canvas.style.setProperty(
      'contain-intrinsic-size',
      size,
      this.previousIntrinsicSize.priority,
    );
    // CSSOM canonicalizes shorthands (e.g. "200px 200px" becomes "200px").
    this.appliedIntrinsicSize = this.canvas.style.getPropertyValue(
      'contain-intrinsic-size',
    );
  }

  private validateSize(width: number, height: number): void {
    if (
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(height) ||
      height <= 0
    ) {
      throw new RuntimeError(
        'Canvas resize requires finite positive CSS pixel dimensions.',
      );
    }
  }

  private contentSize(): { width: number; height: number } | undefined {
    const style = getComputedStyle(this.canvas);
    const insetWidth =
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) +
      parseFloat(style.borderRightWidth);
    const insetHeight =
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth);
    const width = style.width.endsWith('px')
      ? parseFloat(style.width) -
        (style.boxSizing === 'border-box' ? insetWidth : 0)
      : this.canvas.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
    const height = style.height.endsWith('px')
      ? parseFloat(style.height) -
        (style.boxSizing === 'border-box' ? insetHeight : 0)
      : this.canvas.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
    return width > 0 && height > 0 ? { width, height } : undefined;
  }

  private resizeBacking(width: number, height: number): void {
    this.validateSize(width, height);
    const ratio =
      this.fixedPixelRatio ??
      Math.min(window.devicePixelRatio || 1, defaults.maxPixelRatio);
    this.graphics.resize(
      Math.max(1, Math.round(width * ratio)),
      Math.max(1, Math.round(height * ratio)),
    );
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.appliedPixelRatio = ratio;
  }

  private cleanup(): void {
    try {
      try {
        try {
          try {
            this.accessibilityManager.destroy();
          } finally {
            this.input.destroy();
          }
        } finally {
          this.i18n.destroy();
        }
      } finally {
        this.observer?.disconnect();
      }
    } finally {
      try {
        document.removeEventListener(
          'visibilitychange',
          this.onVisibilityChange,
        );
      } finally {
        const style = this.canvas.style;
        try {
          if (
            this.appliedIntrinsicSize !== undefined &&
            style.getPropertyValue('contain-intrinsic-size') ===
              this.appliedIntrinsicSize &&
            style.getPropertyPriority('contain-intrinsic-size') ===
              this.previousIntrinsicSize.priority
          ) {
            if (this.previousIntrinsicSize.value)
              style.setProperty(
                'contain-intrinsic-size',
                this.previousIntrinsicSize.value,
                this.previousIntrinsicSize.priority,
              );
            else style.removeProperty('contain-intrinsic-size');
          }
        } finally {
          if (
            this.appliedContain !== undefined &&
            style.getPropertyValue('contain') === this.appliedContain &&
            style.getPropertyPriority('contain') ===
              this.previousContain.priority
          ) {
            if (this.previousContain.value)
              style.setProperty(
                'contain',
                this.previousContain.value,
                this.previousContain.priority,
              );
            else style.removeProperty('contain');
          }
        }
      }
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (this.audioPause.onHidden) {
      if (document.hidden) this.audio.pause('hidden');
      else this.audio.resume('hidden');
    }
    this.currentScene?.setWorldStreamingPaused(
      document.hidden || this.currentState !== 'running',
    );
    this.clock.suspend();
    this.currentScene?.resetPointerRouting();
    this.accessibilityManager.reset();
    this.input.reset();
    if (this.requestId !== undefined) cancelAnimationFrame(this.requestId);
    this.requestId = undefined;
    if (!document.hidden && this.currentState === 'running') {
      this.requestId = requestAnimationFrame(this.onFrame);
    }
  };

  private readonly onFrame = (timestamp: number): void => {
    this.requestId = undefined;
    if (this.currentState !== 'running' || document.hidden) return;
    const frameWork = this.frameWorkCounter.enabled
      ? this.frameWorkCounter
      : undefined;
    frameWork?.begin(this.clock.frame + 1);
    let workStartedAt = frameWork ? performance.now() : 0;
    try {
      const ratio =
        this.fixedPixelRatio ??
        Math.min(window.devicePixelRatio || 1, defaults.maxPixelRatio);
      if (ratio !== this.appliedPixelRatio)
        this.resizeBacking(this.logicalWidth, this.logicalHeight);
      this.clock.tick(timestamp);
      const scene = this.currentScene;
      this.updatingScene = scene;
      scene?.beginObjectFrame();
      scene?.camera2D.resize(this.logicalWidth, this.logicalHeight);
      this.input.update();
      if (
        scene &&
        this.canUpdateScene() &&
        !this.activeTransition?.controller.blockInput
      )
        scene.routePointers(this.input.pointer, this.canUpdateScene);
      if (scene && this.canUpdateScene()) {
        scene.advanceTimers(this.clock.deltaTime);
        // A timer callback may have destroyed the scene or stopped the game.
        if (this.canUpdateScene()) scene.advanceTweens(this.clock.deltaTime);
      }
      if (this.currentState !== 'running') return;
      if (scene && this.canUpdateScene())
        scene.beginObjectUpdates(this.clock.deltaTime, this.canUpdateScene);
      if (scene && scene === this.currentScene && !scene.destroyed)
        scene.advanceAnimations(this.clock.deltaTime);
      if (scene && this.canUpdateScene())
        scene.advanceFrameAnimations(this.clock.deltaTime, this.canUpdateScene);
      if (scene && this.canUpdateScene())
        scene.advanceActions(this.clock.deltaTime, this.canUpdateScene);
      if (scene && this.canUpdateScene()) scene.update(this.clock.deltaTime);
      if (scene && this.canUpdateScene())
        scene.advanceObjects(this.clock.deltaTime, this.canUpdateScene);
      if (this.currentState !== 'running') return;
      if (scene && scene === this.currentScene && !scene.destroyed)
        scene.world.update(this.clock.deltaTime);
      if (frameWork) {
        frameWork.simulationMs = performance.now() - workStartedAt;
        workStartedAt = performance.now();
      }
      if (scene && this.canUpdateScene())
        scene.advanceWorldStreaming(this.canUpdateScene);
      if (scene && this.canUpdateScene())
        scene.advanceNavigation(this.clock.deltaTime);
      if (frameWork) {
        frameWork.navigationMs = performance.now() - workStartedAt;
        const navigation = scene?.initializedNavigation?.stats;
        frameWork.navigationWork = navigation?.work ?? 0;
        frameWork.navigationExpansions = navigation?.expansions ?? 0;
        frameWork.navigationBakeWork = navigation?.bakeWork ?? 0;
        workStartedAt = performance.now();
      }
      if (scene && this.canUpdateScene())
        scene.advanceAfterUpdate(this.clock.deltaTime, this.canUpdateScene);
      if (this.currentState === 'running') this.audio.updateBindings();
      if (frameWork)
        frameWork.afterUpdateMs = performance.now() - workStartedAt;
      if (this.currentState !== 'running') return;
      const transition = this.activeTransition;
      this.frameEffects.transition = transition?.controller.advance(
        this.clock.deltaTime,
      );
      const presentedScene = this.currentScene;
      if (frameWork) workStartedAt = performance.now();
      presentedScene?.beginPresentation();
      try {
        this.graphics.beginFrame();
        this.graphics.render(
          presentedScene,
          this.logicalWidth,
          this.logicalHeight,
          this.frameEffects,
        );
        this.graphics.endFrame();
      } finally {
        presentedScene?.endPresentation();
      }
      if (frameWork)
        frameWork.renderSubmitMs = performance.now() - workStartedAt;
      this.accessibilityManager.update(this.currentScene);
      if (transition?.controller.complete) this.completeTransition(transition);
    } catch (cause) {
      this.fail(
        cause instanceof Error
          ? cause
          : new RuntimeError('Frame rendering failed.', { cause }),
      );
      return;
    } finally {
      this.updatingScene = undefined;
      this.input.endFrame();
      frameWork?.finish();
    }
    if (this.currentState === 'running')
      this.requestId = requestAnimationFrame(this.onFrame);
  };

  private fail(error: Error): void {
    if (this.currentState === 'destroyed' || this.fatalError) return;
    this.fatalError = error;
    this.pause();
    const errors: unknown[] = [error];
    try {
      this.cancelTransition();
    } catch (cleanupError) {
      errors.push(cleanupError);
    }
    const pending = this.pendingScene;
    this.pendingScene = undefined;
    this.pendingCompletion = undefined;
    this.sceneVersion++;
    try {
      pending?.cancel();
    } catch (cleanupError) {
      errors.push(cleanupError);
    }
    const reported =
      errors.length > 1
        ? new AggregateError(
            errors,
            'Fatal runtime error and cancellation cleanup failed.',
            { cause: error },
          )
        : error;
    logger.error('Runtime paused after a fatal error.', reported);
    this.dispatchEvent(new CustomEvent<Error>('error', { detail: reported }));
  }
}
