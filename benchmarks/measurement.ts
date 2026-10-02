import type { Game, Scene } from '../src/index.js';
import { measurementDefaults } from '../src/data/observability.js';

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
  const gpu = new BoundedTiming();
  let gpuSampleFrame = 0;
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
          const sample = game.graphics.stats.gpuTiming;
          if (
            sample.status === 'available' &&
            sample.milliseconds !== null &&
            sample.sampledFrame !== null &&
            sample.sampledFrame > gpuSampleFrame
          ) {
            gpuSampleFrame = sample.sampledFrame;
            if (sample.sampledFrame > settings.warmup)
              gpu.add(sample.milliseconds);
          }
        }
        frame++;
        if (frame < settings.warmup + settings.samples) {
          handle = requestAnimationFrame(render);
          return;
        }
        const raf = summarize(intervals);
        // RenderStats is reused by the renderer; preserve this frame's counters.
        const renderStats = {
          ...game.graphics.stats,
          gpuTiming: { ...game.graphics.stats.gpuTiming },
        };
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
          gpuExecutionMs: gpu.snapshot(),
          gpuTiming: { ...game.graphics.stats.gpuTiming },
          [options.updateMetric]: summarize(updates),
          renderStats,
          workload: options.workload,
          ...options.finalMetrics?.(),
          notes:
            'RAF intervals are display-paced wall time. CPU submit measures beginFrame/render/endFrame only, excluding simulation and not waiting for GPU completion. Opt-in GPU timestamps asynchronously bracket native frame commands, excluding queue wait/presentation; null/status explicitly marks disabled, unsupported or pending samples. RenderStats residency is an attachment estimate, not total VRAM. Canvas2D has 2D paint counters but no 3D counters. Fixed 1/60-second simulation per RAF. Setup/teardown excluded; no GC measurement in this short collector.',
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

/** Online trend and timestamped bounded tail; growth is an observation, never a leak verdict. */
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
  private readonly tail = new Float64Array(measurementDefaults.tailSamples);
  private readonly times = new Float64Array(measurementDefaults.tailSamples);
  private timestamped = true;
  add(value: number, elapsedSeconds?: number): void {
    if (!Number.isFinite(value)) throw new RangeError('Trend must be finite.');
    if (
      elapsedSeconds !== undefined &&
      (!Number.isFinite(elapsedSeconds) ||
        elapsedSeconds < 0 ||
        (this.count &&
          elapsedSeconds < this.times[(this.count - 1) % this.times.length]!))
    )
      throw new RangeError(
        'Trend times must be finite, nonnegative and monotonic.',
      );
    const x = this.count++;
    if (elapsedSeconds === undefined) this.timestamped = false;
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
    this.times[x % this.times.length] = elapsedSeconds ?? x;
  }
  snapshot() {
    const retained = Math.min(this.count, this.tail.length);
    const values = Array.from(
      { length: retained },
      (_, index) =>
        this.tail[(this.count - retained + index) % this.tail.length]!,
    );
    const times = Array.from(
      { length: retained },
      (_, index) =>
        this.times[(this.count - retained + index) % this.times.length]!,
    );
    const duration = retained ? times[retained - 1]! - times[0]! : 0;
    let covariance = 0;
    let variance = 0;
    const meanTime = retained
      ? times.reduce((sum, value) => sum + value, 0) / retained
      : 0;
    const meanValue = retained
      ? values.reduce((sum, value) => sum + value, 0) / retained
      : 0;
    for (let index = 0; index < retained; index++) {
      covariance += (times[index]! - meanTime) * (values[index]! - meanValue);
      variance += (times[index]! - meanTime) ** 2;
    }
    const slopePerMinute =
      this.timestamped && variance ? (covariance / variance) * 60 : null;
    const range = retained ? Math.max(...values) - Math.min(...values) : null;
    const tolerance = Math.max(
      measurementDefaults.plateauAbsoluteBytes,
      Math.abs(meanValue) * measurementDefaults.plateauRelativeFraction,
    );
    const midpoint = Math.floor(retained / 2);
    const floorGrowth = midpoint
      ? Math.min(...values.slice(midpoint)) -
        Math.min(...values.slice(0, midpoint))
      : null;
    let classification:
      'insufficient-data' | 'plateau' | 'sustained-growth' | 'variable' =
      'insufficient-data';
    if (
      this.timestamped &&
      retained >= measurementDefaults.minimumTrendSamples &&
      duration >= measurementDefaults.minimumTrendSeconds
    ) {
      if (range! <= tolerance) classification = 'plateau';
      else if (
        slopePerMinute !== null &&
        slopePerMinute > measurementDefaults.growthBytesPerMinute &&
        floorGrowth! > tolerance
      )
        classification = 'sustained-growth';
      else classification = 'variable';
    }
    return {
      count: this.count,
      first: this.count ? this.first : null,
      last: this.count ? this.last : null,
      min: this.count ? this.minimum : null,
      max: this.count ? this.maximum : null,
      slopePerCycle: this.variance ? this.covariance / this.variance : null,
      tailSlopeBytesPerMinute: slopePerMinute,
      tailDurationSeconds: this.timestamped && retained ? duration : null,
      tailRange: range,
      tailFloorGrowthBytes: floorGrowth,
      classification,
      thresholds: {
        minimumSamples: measurementDefaults.minimumTrendSamples,
        minimumSeconds: measurementDefaults.minimumTrendSeconds,
        toleranceBytes: tolerance,
        growthBytesPerMinute: measurementDefaults.growthBytesPerMinute,
      },
      tail: values,
      tailTimesSeconds: this.timestamped ? times : null,
      note: 'Tail classification is observational, not proof of a leak or a GC/post-GC plateau.',
    };
  }
}
