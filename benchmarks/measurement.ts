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
            'RAF intervals are display-paced wall time. CPU submit measures beginFrame/render/endFrame only, excluding simulation and not waiting for GPU completion. RenderStats contains last-frame 3D counters only, not 2D batches or GPU time; Canvas2D counters stay zero. Fixed 1/60-second simulation per RAF. No GPU/GC timing instrumentation; setup and teardown excluded.',
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
