import { measurementDefaults } from '../src/data/observability.js';
import { BoundedTiming, BoundedTrend } from './measurement.js';

interface BrowserHeap {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/** Browser platform observations stay separate from engine residency estimates and CDP. */
export class BrowserObservations {
  private readonly heap = new BoundedTrend();
  private readonly longTasks = new BoundedTiming();
  private readonly heapTail: {
    seconds: number;
    usedBytes: number;
    totalBytes: number;
    limitBytes: number;
  }[] = [];
  private readonly longTaskTail: { startMs: number; durationMs: number }[] = [];
  private observer: PerformanceObserver | undefined;
  private heapStatus: 'unsupported' | 'available' = 'unsupported';
  private longTaskStatus: 'unsupported' | 'available' = 'unsupported';
  private nextSample = 0;
  constructor(private readonly started = performance.now()) {
    if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes.includes('longtask')
    ) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTasks.add(entry.duration);
          this.longTaskTail.push({
            startMs: entry.startTime,
            durationMs: entry.duration,
          });
          if (this.longTaskTail.length > measurementDefaults.tailSamples)
            this.longTaskTail.shift();
        }
      });
      this.observer.observe({ type: 'longtask', buffered: true });
      this.longTaskStatus = 'available';
    }
  }
  sample(now = performance.now()): void {
    const seconds = (now - this.started) / 1000;
    if (seconds < this.nextSample) return;
    this.nextSample = seconds + measurementDefaults.memorySampleSeconds;
    const memory = (performance as Performance & { memory?: BrowserHeap })
      .memory;
    if (!memory || !Number.isFinite(memory.usedJSHeapSize)) return;
    this.heapStatus = 'available';
    this.heap.add(memory.usedJSHeapSize, seconds);
    this.heapTail.push({
      seconds,
      usedBytes: memory.usedJSHeapSize,
      totalBytes: memory.totalJSHeapSize,
      limitBytes: memory.jsHeapSizeLimit,
    });
    if (this.heapTail.length > measurementDefaults.tailSamples)
      this.heapTail.shift();
  }
  stop() {
    this.sample();
    for (const entry of this.observer?.takeRecords() ?? []) {
      this.longTasks.add(entry.duration);
      this.longTaskTail.push({
        startMs: entry.startTime,
        durationMs: entry.duration,
      });
      if (this.longTaskTail.length > measurementDefaults.tailSamples)
        this.longTaskTail.shift();
    }
    this.observer?.disconnect();
    return {
      jsHeap: {
        status: this.heapStatus,
        source:
          this.heapStatus === 'available'
            ? 'nonstandard performance.memory (browser estimate)'
            : null,
        trend: this.heap.snapshot(),
        rawTail: this.heapTail,
      },
      longTasks: {
        status: this.longTaskStatus,
        source:
          this.longTaskStatus === 'available'
            ? 'PerformanceObserver longtask'
            : null,
        timing: this.longTasks.snapshot(),
        rawTail: this.longTaskTail,
        note: 'Main-thread tasks >50ms, not GC attribution or load-hitch attribution.',
      },
      gc: {
        status: 'unsupported',
        source: null,
        note: 'No standard browser GC observer; owned Chromium runner adds real CDP tracing separately.',
      },
      processMemory: {
        status: 'unsupported',
        source: null,
        note: 'No browser page process RSS API; owned runner reports OS process memory separately where available.',
      },
      userAgentSpecificMemory: {
        status:
          typeof (
            performance as Performance & {
              measureUserAgentSpecificMemory?: unknown;
            }
          ).measureUserAgentSpecificMemory === 'function'
            ? 'not-requested'
            : 'unsupported',
        note: 'Not called: asynchronous cross-origin-isolated measurement is not a substitute for heap/process metrics.',
      },
    };
  }
}

export async function browserProvenance(
  canvas: HTMLCanvasElement,
  backend: string,
) {
  let gpu: unknown = null;
  if (backend === 'webgl2') {
    const gl = canvas.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && extension)
      gpu = {
        source: 'WEBGL_debug_renderer_info on renderer canvas',
        vendor: gl.getParameter(extension.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(extension.UNMASKED_RENDERER_WEBGL),
      };
  } else if (backend === 'webgpu' && navigator.gpu) {
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter)
      gpu = {
        source:
          'separate default WebGPU adapter query; not device hardware certification',
        vendor: adapter.info.vendor,
        architecture: adapter.info.architecture,
        device: adapter.info.device,
        description: adapter.info.description,
        timestampQuery: adapter.features.has('timestamp-query'),
      };
  }
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGiB:
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
    gpu,
    visibility: document.visibilityState,
    crossOriginIsolated,
    devicePixelRatio,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
    },
    note: 'Browser-exposed provenance may be redacted. Owned headless/emulated scenarios are not actual Safari/iOS/low-tier hardware.',
  };
}
