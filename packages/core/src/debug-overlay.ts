import type { Game } from './game.js';
import type { RenderStats } from '../../graphics/src/render-stats.js';

export interface DebugOverlayOptions {
  /** Corner of the canvas the panel sticks to. Default `top-left`. */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Milliseconds between refreshes; default 250. */
  interval?: number;
  /** Extra lines appended to the panel, evaluated on each refresh. */
  extra?: () => string | readonly string[];
}

/** Everything the panel prints; kept plain so formatting can be tested without a DOM. */
export interface DebugSample {
  /** Frames per second measured over wall time, never from the clamped simulation delta. */
  fps: number;
  frameMs: number;
  backend: string;
  state: string;
  logicalSize: readonly [number, number];
  backingSize: readonly [number, number];
  frame: number;
  render: RenderStats;
  colliders: number;
  tweens: number;
  audio: string;
  pointers: number;
}

export function formatDebugSample(sample: DebugSample): string[] {
  const lines = [
    `${sample.fps.toFixed(1)} fps · ${sample.frameMs.toFixed(2)} ms/frame`,
    `${sample.backend} · ${sample.state} · frame ${sample.frame}`,
    `canvas ${sample.logicalSize[0]}×${sample.logicalSize[1]} → ${sample.backingSize[0]}×${sample.backingSize[1]} px`,
  ];
  const r = sample.render;
  lines.push(
    r.meshes + r.drawCalls + r.triangles > 0
      ? `3D ${r.meshes} meshes (${r.culled} culled) · ${r.drawCalls}+${r.shadowDrawCalls} draws · ${r.triangles} tris`
      : '3D idle',
  );
  lines.push(
    `2D ${r.drawCalls2D} draws · ${r.instances2D} instances · ${r.renderPasses2D} passes`,
    `upload ${r.uploadBytes} B/frame · targets ${r.renderTargetBytes} B (peak ${r.peakRenderTargetBytes} B, estimated)`,
  );
  lines.push(
    `physics ${sample.colliders} colliders · tweens ${sample.tweens} · pointers ${sample.pointers}`,
    `audio ${sample.audio}`,
  );
  return lines;
}

/**
 * A small text panel over the canvas with frame rate, renderer counters and a few subsystem
 * sizes. It is a plain DOM element (not rendered by the engine), so it costs nothing on the GPU
 * and never affects what is drawn. Refresh is timer-driven and cheap; it removes itself once the
 * Game is destroyed.
 */
export class DebugOverlay {
  readonly element: HTMLPreElement;
  private timer: number | undefined;
  private lastFrame: number;
  private lastTime: number;
  private fps = 0;
  private destroyed = false;

  private constructor(
    private readonly game: Game,
    private readonly options: DebugOverlayOptions,
  ) {
    const interval = options.interval ?? 250;
    if (!Number.isFinite(interval) || interval < 16)
      throw new RangeError('DebugOverlay interval must be at least 16 ms.');
    const parent = game.canvas.parentElement ?? document.body;
    this.element = document.createElement('pre');
    this.element.setAttribute('aria-hidden', 'true');
    Object.assign(this.element.style, {
      position: 'absolute',
      margin: '4px',
      padding: '4px 6px',
      font: '11px/1.35 ui-monospace, monospace',
      color: '#bff',
      background: 'rgba(0, 0, 0, 0.55)',
      pointerEvents: 'none',
      whiteSpace: 'pre',
      zIndex: '10',
    });
    // An absolutely positioned panel needs a positioned ancestor to anchor to the canvas.
    if (getComputedStyle(parent).position === 'static')
      parent.style.position = 'relative';
    parent.append(this.element);
    this.lastFrame = game.clock.frame;
    this.lastTime = performance.now();
    this.timer = window.setInterval(() => this.refresh(), interval);
    this.refresh();
  }

  /** Creates the panel and starts refreshing it. */
  static attach(game: Game, options: DebugOverlayOptions = {}): DebugOverlay {
    return new DebugOverlay(game, options);
  }

  get visible(): boolean {
    return this.element.style.display !== 'none';
  }

  set visible(value: boolean) {
    this.element.style.display = value ? '' : 'none';
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.clearInterval(this.timer);
    this.timer = undefined;
    this.element.remove();
  }

  private refresh(): void {
    const game = this.game;
    if (this.destroyed) return;
    if (game.state === 'destroyed') {
      this.destroy();
      return;
    }
    const now = performance.now();
    const frames = game.clock.frame - this.lastFrame;
    const elapsed = now - this.lastTime;
    if (elapsed > 0 && frames >= 0) this.fps = (frames * 1000) / elapsed;
    this.lastFrame = game.clock.frame;
    this.lastTime = now;
    const scene = game.scene;
    const stats = game.graphics.stats;
    const lines = formatDebugSample({
      fps: this.fps,
      frameMs: this.fps > 0 ? 1000 / this.fps : 0,
      backend: game.graphics.backend,
      state: game.state,
      logicalSize: [game.width, game.height],
      backingSize: [game.canvas.width, game.canvas.height],
      frame: game.clock.frame,
      render: stats,
      colliders: scene?.physics.colliderCount ?? 0,
      tweens: scene?.tweens.size ?? 0,
      audio: game.audio.unlocked
        ? game.audio.paused
          ? 'paused'
          : 'running'
        : 'locked',
      pointers: game.input.pointer.activePointers.size,
    });
    const extra = this.options.extra?.() ?? [];
    this.element.textContent = [
      ...lines,
      ...(typeof extra === 'string' ? [extra] : extra),
    ].join('\n');
    this.place();
  }

  /** Sticks the panel to a corner of the canvas box, wherever the canvas sits in its parent. */
  private place(): void {
    const canvas = this.game.canvas;
    const position = this.options.position ?? 'top-left';
    const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = canvas;
    const own = this.element;
    own.style.left = `${position.endsWith('left') ? offsetLeft : offsetLeft + offsetWidth - own.offsetWidth - 8}px`;
    own.style.top = `${position.startsWith('top') ? offsetTop : offsetTop + offsetHeight - own.offsetHeight - 8}px`;
  }
}
