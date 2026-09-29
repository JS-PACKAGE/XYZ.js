import { defaults } from '../../../src/data/defaults.js';
import {
  createRenderer,
  type Renderer,
  type RendererPreference,
} from '../../graphics/src/index.js';
import { Clock } from './clock.js';
import { RuntimeError } from './errors.js';

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
  private currentState: GameState = 'idle';
  private requestId: number | undefined;
  private observer: ResizeObserver | undefined;
  private logicalWidth: number;
  private logicalHeight: number;
  private readonly fixedPixelRatio: number | undefined;
  private appliedPixelRatio = 0;

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
    this.resize(this.logicalWidth, this.logicalHeight);
    // Separate CSS size from backing pixels so DPR changes cannot feed back into layout.
    canvas.style.width ||= `${this.logicalWidth}px`;
    canvas.style.height ||= `${this.logicalHeight}px`;
    if (options.autoResize !== false) {
      this.observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (
          entry &&
          this.currentState !== 'destroyed' &&
          entry.contentRect.width > 0 &&
          entry.contentRect.height > 0
        ) {
          try {
            this.resize(entry.contentRect.width, entry.contentRect.height);
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
    let game: Game | undefined;
    let initializationError: Error | undefined;
    const graphics = await createRenderer(
      canvas,
      options.renderer ?? 'auto',
      (error) => {
        if (game) game.fail(error);
        else initializationError = error;
      },
    );
    try {
      if (initializationError) throw initializationError;
      game = new Game(canvas, graphics, clock, options);
      return game;
    } catch (cause) {
      graphics.destroy();
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

  start(): void {
    if (this.currentState === 'destroyed')
      throw new RuntimeError(
        'Cannot start a destroyed Game. Create a new Game instance.',
      );
    if (this.currentState === 'running') return;
    this.currentState = 'running';
    this.clock.suspend();
    if (!document.hidden) this.requestId = requestAnimationFrame(this.onFrame);
  }

  pause(): void {
    if (this.currentState === 'destroyed' || this.currentState === 'paused')
      return;
    this.currentState = 'paused';
    if (this.requestId !== undefined) cancelAnimationFrame(this.requestId);
    this.requestId = undefined;
    this.clock.suspend();
  }

  resume(): void {
    this.start();
  }

  resize(width: number, height: number): void {
    if (this.currentState === 'destroyed')
      throw new RuntimeError('Cannot resize a destroyed Game.');
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

  destroy(): void {
    if (this.currentState === 'destroyed') return;
    this.pause();
    this.currentState = 'destroyed';
    this.observer?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.graphics.destroy();
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
        this.resize(this.logicalWidth, this.logicalHeight);
      this.clock.tick(timestamp);
      this.graphics.beginFrame();
      this.graphics.render();
      this.graphics.endFrame();
    } catch (cause) {
      this.fail(
        cause instanceof Error
          ? cause
          : new RuntimeError('Frame rendering failed.', { cause }),
      );
      return;
    }
    if (this.currentState === 'running')
      this.requestId = requestAnimationFrame(this.onFrame);
  };

  private fail(error: Error): void {
    if (this.currentState === 'destroyed') return;
    this.pause();
    console.error('[XYZ] Runtime paused after a graphics error.', error);
    this.dispatchEvent(new CustomEvent<Error>('error', { detail: error }));
  }
}
