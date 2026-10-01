import type { Game, Scene } from '../src/index.js';

export const settings = {
  warmup: 120,
  samples: 600,
  width: 1280,
  height: 720,
  pixelRatio: 1,
  simulationDelta: 1 / 60,
} as const;

interface MeasurementOptions {
  benchmark: '3d' | 'physics2d' | 'particles2d';
  workload: Readonly<Record<string, unknown>>;
  updateMetric: 'animationUpdateMs' | 'physicsStepMs' | 'particleUpdateMs';
  update(frame: number): void;
  finalMetrics?(): Readonly<Record<string, unknown>>;
}

function summarize(values: Float64Array) {
  const sorted = values.slice().sort();
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted[sorted.length - 1],
  };
}

/** Manual RAF keeps fixed simulation work independent of display refresh rate. */
export function measure(
  game: Game,
  scene: Scene,
  options: MeasurementOptions,
): Promise<Readonly<Record<string, unknown>>> {
  const intervals = new Float64Array(settings.samples);
  const submissions = new Float64Array(settings.samples);
  const updates = new Float64Array(settings.samples);
  scene.camera2D.resize(game.width, game.height);
  return new Promise((resolve, reject) => {
    let frame = 0;
    let previous: number | undefined;
    let handle = 0;
    const cleanup = (): void => {
      cancelAnimationFrame(handle);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      game.removeEventListener('error', onError);
    };
    const fail = (error: unknown): void => {
      cleanup();
      reject(error);
    };
    const onPageHide = (): void => {
      fail(new Error('Aborted: page was hidden or unloaded.'));
    };
    const onVisibilityChange = (): void => {
      if (document.hidden)
        fail(new Error('Aborted: tab became hidden. Reload while visible.'));
    };
    const onError = (event: Event): void => {
      fail((event as CustomEvent<Error>).detail);
    };
    const render = (time: number): void => {
      if (document.hidden) {
        fail(new Error('Aborted: tab became hidden. Reload while visible.'));
        return;
      }
      const interval = previous === undefined ? 0 : time - previous;
      previous = time;
      try {
        const updateStart = performance.now();
        options.update(frame);
        const updateMs = performance.now() - updateStart;
        const submitStart = performance.now();
        game.graphics.beginFrame();
        game.graphics.render(scene, game.width, game.height);
        game.graphics.endFrame();
        const submitMs = performance.now() - submitStart;
        if (frame >= settings.warmup) {
          const index = frame - settings.warmup;
          intervals[index] = interval;
          submissions[index] = submitMs;
          updates[index] = updateMs;
        }
        frame++;
        if (frame < settings.warmup + settings.samples) {
          handle = requestAnimationFrame(render);
          return;
        }
        const raf = summarize(intervals);
        // RenderStats is reused by the renderer; preserve this frame's counters.
        const renderStats = { ...game.graphics.stats };
        const result = {
          date: new Date().toISOString(),
          userAgent: navigator.userAgent,
          benchmark: options.benchmark,
          backend: game.graphics.backend,
          warmupFrames: settings.warmup,
          measuredFrames: settings.samples,
          logicalSize: [game.width, game.height],
          backingSize: [game.canvas.width, game.canvas.height],
          pixelRatio: settings.pixelRatio,
          simulationDeltaSeconds: settings.simulationDelta,
          fps: 1000 / raf.mean,
          frameIntervalMs: raf,
          cpuSubmitMs: summarize(submissions),
          [options.updateMetric]: summarize(updates),
          renderStats,
          workload: options.workload,
          ...options.finalMetrics?.(),
          notes:
            'RAF intervals are display-paced wall time. CPU submit measures beginFrame/render/endFrame only, excluding simulation and not waiting for GPU completion. RenderStats contains last-frame 2D/3D submission counters and resident/peak attachment estimates, not GPU timing or total VRAM. Canvas2D has 2D paint counters but no 3D counters. Fixed 1/60-second simulation per RAF. No GPU/GC timing instrumentation; setup and teardown excluded.',
        };
        cleanup();
        resolve(result);
      } catch (error) {
        fail(error);
      }
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);
    game.addEventListener('error', onError);
    handle = requestAnimationFrame(render);
  });
}

/** Fixed-size histogram: percentiles are upper bucket bounds, not exact samples. */
export class BoundedTiming {
  private readonly bins = new Uint32Array(4096);
  private count = 0;
  private sum = 0;
  private maximum = 0;
  private overRange = 0;
  private overBudget = 0;
  private longFrames = 0;
  constructor(private readonly budgetMs = 1000 / 60) {}
  add(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0)
      throw new RangeError('Timing must be finite and nonnegative.');
    this.count++;
    this.sum += milliseconds;
    this.maximum = Math.max(this.maximum, milliseconds);
    if (milliseconds > this.budgetMs) this.overBudget++;
    if (milliseconds > 50) this.longFrames++;
    const bin = Math.floor(milliseconds * 4);
    if (bin >= this.bins.length) this.overRange++;
    else this.bins[bin] = this.bins[bin]! + 1;
  }
  snapshot() {
    const percentile = (fraction: number): number | null => {
      if (!this.count) return null;
      const target = Math.ceil(this.count * fraction);
      let cumulative = 0;
      for (let index = 0; index < this.bins.length; index++) {
        cumulative += this.bins[index]!;
        if (cumulative >= target) return (index + 1) / 4;
      }
      return null;
    };
    return {
      count: this.count,
      mean: this.count ? this.sum / this.count : null,
      p50: percentile(0.5),
      p95: percentile(0.95),
      max: this.count ? this.maximum : null,
      overBudget: this.overBudget,
      longFramesOver50Ms: this.longFrames,
      histogramOverflow: this.overRange,
      bucketWidthMs: 0.25,
      histogramLimitMs: 1024,
    };
  }
}

/** Online trend plus a bounded tail; never retains a duration-sized trace. */
export class BoundedTrend {
  private count = 0;
  private first = 0;
  private last = 0;
  private minimum = Infinity;
  private maximum = -Infinity;
  private meanX = 0;
  private meanY = 0;
  private covariance = 0;
  private variance = 0;
  private readonly tail = new Float64Array(32);
  add(value: number): void {
    if (!Number.isFinite(value)) throw new RangeError('Trend must be finite.');
    const x = this.count++;
    if (!x) this.first = value;
    this.last = value;
    this.minimum = Math.min(this.minimum, value);
    this.maximum = Math.max(this.maximum, value);
    const dx = x - this.meanX;
    const dy = value - this.meanY;
    this.meanX += dx / this.count;
    this.meanY += dy / this.count;
    this.covariance += dx * (value - this.meanY);
    this.variance += dx * (x - this.meanX);
    this.tail[x % this.tail.length] = value;
  }
  snapshot() {
    const retained = Math.min(this.count, this.tail.length);
    const values = Array.from(
      { length: retained },
      (_, index) =>
        this.tail[(this.count - retained + index) % this.tail.length]!,
    );
    return {
      count: this.count,
      first: this.count ? this.first : null,
      last: this.count ? this.last : null,
      min: this.count ? this.minimum : null,
      max: this.count ? this.maximum : null,
      slopePerCycle: this.variance ? this.covariance / this.variance : null,
      tailRange: values.length
        ? Math.max(...values) - Math.min(...values)
        : null,
      tail: values,
    };
  }
}
