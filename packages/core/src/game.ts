import { defaults } from '../../../src/data/defaults.js';
import { AssetLoader } from '../../assets/src/index.js';
import { InputManager } from '../../input/src/index.js';
import { AudioManager } from '../../audio/src/audio-manager.js';
import {
  createRenderer,
  type Renderer,
  type RendererPreference,
} from '../../graphics/src/index.js';
import { Scene } from './scene.js';
import { Clock } from './clock.js';
import { RuntimeError } from './errors.js';
import { logger } from './logger.js';

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
}

export type GameState = 'idle' | 'running' | 'paused' | 'destroyed';

/** Browser runtime controller. GPU handles remain private to the renderer. */
export class Game extends EventTarget {
  readonly canvas: HTMLCanvasElement;
  readonly graphics: Renderer;
  readonly clock: Clock;
  readonly assets = new AssetLoader();
  readonly input: InputManager;
  readonly audio = new AudioManager(
    () => this.currentScene,
    (error) =>
      this.dispatchEvent(new CustomEvent<Error>('error', { detail: error })),
  );
  private currentState: GameState = 'idle';
  private currentScene: Scene | undefined;
  private pendingScene: Scene | undefined;
  private pendingCompletion: Promise<void> | undefined;
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
    this.logicalWidth = options.width ?? defaults.width;
    this.logicalHeight = options.height ?? defaults.height;
    this.fixedPixelRatio = options.pixelRatio;
    this.autoResize = options.autoResize !== false;
    this.input = new InputManager(canvas, () => this);
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
    this.clock.suspend();
    if (!document.hidden) this.requestId = requestAnimationFrame(this.onFrame);
  }

  /** Prepare offscreen, then publish the candidate and synchronously release the old scene. */
  async setScene(next: Scene): Promise<void> {
    if (this.currentState === 'destroyed')
      throw new RuntimeError('Cannot set a Scene on a destroyed Game.');
    if (this.switchingScene)
      throw new RuntimeError('Cannot switch Scenes during scene disposal.');
    if (next === this.currentScene) {
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
      return;
    }
    if (next === this.pendingScene) return this.pendingCompletion;
    const signal = next.claim(this);
    const prior = this.pendingScene;
    this.pendingScene = next;
    const version = ++this.sceneVersion;
    if (prior) {
      this.switchingScene = true;
      try {
        prior.cancel();
      } catch (error) {
        this.pendingScene = undefined;
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
      } finally {
        this.switchingScene = false;
      }
    }
    const completion = Promise.resolve().then(async () => {
      try {
        if (signal.aborted) throw new SceneCancelledError();
        await next.prepare(this, signal);
        if (
          signal.aborted ||
          version !== this.sceneVersion ||
          this.currentState === 'destroyed'
        )
          throw new SceneCancelledError();
        const old = this.currentScene;
        this.pendingScene = undefined;
        this.pendingCompletion = undefined;
        this.switchingScene = true;
        try {
          this.currentScene = next;
          old?.destroy();
        } finally {
          this.switchingScene = false;
        }
      } catch (error) {
        if (this.pendingScene === next) {
          this.pendingScene = undefined;
          this.pendingCompletion = undefined;
        }
        const reason =
          signal.aborted && this.currentScene !== next
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
      }
    });
    this.pendingCompletion = completion;
    return completion;
  }

  /** @internal Called when a Scene is explicitly disposed by its owner. */
  onSceneDisposed(scene: Scene): void {
    if (this.currentScene === scene) this.currentScene = undefined;
    if (this.pendingScene === scene) {
      this.pendingScene = undefined;
      this.sceneVersion++;
    }
  }

  pause(): void {
    if (this.currentState === 'destroyed' || this.currentState === 'paused')
      return;
    this.currentState = 'paused';
    if (this.requestId !== undefined) cancelAnimationFrame(this.requestId);
    this.requestId = undefined;
    this.clock.suspend();
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
    const pending = this.pendingScene;
    const current = this.currentScene;
    this.pendingScene = undefined;
    this.currentScene = undefined;
    const errors: unknown[] = [];
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
    try {
      this.assets.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.audio.destroy();
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
        this.input.destroy();
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
    this.clock.suspend();
    if (this.requestId !== undefined) cancelAnimationFrame(this.requestId);
    this.requestId = undefined;
    if (!document.hidden && this.currentState === 'running') {
      this.requestId = requestAnimationFrame(this.onFrame);
    }
  };

  private readonly onFrame = (timestamp: number): void => {
    this.requestId = undefined;
    if (this.currentState !== 'running' || document.hidden) return;
    try {
      const ratio =
        this.fixedPixelRatio ??
        Math.min(window.devicePixelRatio || 1, defaults.maxPixelRatio);
      if (ratio !== this.appliedPixelRatio)
        this.resizeBacking(this.logicalWidth, this.logicalHeight);
      this.clock.tick(timestamp);
      const scene = this.currentScene;
      scene?.camera2D.resize(this.logicalWidth, this.logicalHeight);
      this.input.update();
      scene?.timers.update(this.clock.deltaTime);
      if (this.currentState !== 'running') return;
      if (scene && scene === this.currentScene && !scene.destroyed)
        scene.update(this.clock.deltaTime);
      if (this.currentState !== 'running') return;
      if (scene && scene === this.currentScene && !scene.destroyed)
        scene.world.update(this.clock.deltaTime);
      if (this.currentState !== 'running') return;
      this.graphics.beginFrame();
      this.graphics.render(
        this.currentScene,
        this.logicalWidth,
        this.logicalHeight,
      );
      this.graphics.endFrame();
    } catch (cause) {
      this.fail(
        cause instanceof Error
          ? cause
          : new RuntimeError('Frame rendering failed.', { cause }),
      );
      return;
    } finally {
      this.input.endFrame();
    }
    if (this.currentState === 'running')
      this.requestId = requestAnimationFrame(this.onFrame);
  };

  private fail(error: Error): void {
    if (this.currentState === 'destroyed' || this.fatalError) return;
    this.fatalError = error;
    this.pause();
    logger.error('Runtime paused after a fatal error.', error);
    this.dispatchEvent(new CustomEvent<Error>('error', { detail: error }));
  }
}
