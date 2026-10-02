import { gpuTimingDefaults } from '../../../src/data/observability.js';
import { GpuFrameTiming, type GpuTimingOptions } from './render-stats.js';

/** Shared option validation happens even on unsupported backends. */
export function configureGpuTiming(
  stats: GpuFrameTiming,
  options: GpuTimingOptions,
): boolean {
  const integer = (
    name: string,
    value: number,
    minimum: number,
    maximum: number,
  ): number => {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum)
      throw new RangeError(
        `${name} must be an integer in [${minimum}, ${maximum}].`,
      );
    return value;
  };
  stats.maxInFlight = integer(
    'gpuTiming.maxInFlight',
    options.maxInFlight ?? gpuTimingDefaults.maxInFlight,
    1,
    gpuTimingDefaults.maxInFlightLimit,
  );
  stats.warmupFrames = integer(
    'gpuTiming.warmupFrames',
    options.warmupFrames ?? gpuTimingDefaults.warmupFrames,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  stats.sampleInterval = integer(
    'gpuTiming.sampleInterval',
    options.sampleInterval ?? gpuTimingDefaults.sampleInterval,
    1,
    Number.MAX_SAFE_INTEGER,
  );
  if (options.enabled)
    stats.unavailable(
      'pending',
      'Waiting for warmup and an asynchronous GPU sample.',
    );
  return options.enabled === true;
}

interface GpuSlot {
  query: GPUQuerySet;
  resolve: GPUBuffer;
  readback: GPUBuffer;
  start: GPUComputePassDescriptor;
  end: GPUComputePassDescriptor;
  frame: number;
  busy: boolean;
}

/** Empty timestamp passes bracket all commands in the frame's encoder, not queue wait/present. */
export class WebGpuTimer {
  private readonly slots: GpuSlot[] = [];
  private active: GpuSlot | undefined;
  private destroyed = false;
  constructor(
    private readonly stats: GpuFrameTiming,
    device: GPUDevice,
  ) {
    stats.source = 'webgpu-timestamp-query';
    for (let index = 0; index < stats.maxInFlight; index++) {
      const query = device.createQuerySet({ type: 'timestamp', count: 2 });
      const resolve = device.createBuffer({
        size: 256,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });
      const readback = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      this.slots.push({
        query,
        resolve,
        readback,
        frame: 0,
        busy: false,
        start: {
          timestampWrites: { querySet: query, beginningOfPassWriteIndex: 0 },
        },
        end: { timestampWrites: { querySet: query, endOfPassWriteIndex: 1 } },
      });
    }
  }
  begin(encoder: GPUCommandEncoder, frame: number): void {
    if (
      this.destroyed ||
      frame <= this.stats.warmupFrames ||
      (frame - this.stats.warmupFrames - 1) % this.stats.sampleInterval !== 0
    )
      return;
    let slot: GpuSlot | undefined;
    for (const candidate of this.slots)
      if (!candidate.busy) {
        slot = candidate;
        break;
      }
    if (!slot) {
      this.stats.skipped++;
      return;
    }
    slot.busy = true;
    slot.frame = frame;
    this.active = slot;
    this.stats.pending++;
    encoder.beginComputePass(slot.start).end();
  }
  end(encoder: GPUCommandEncoder): void {
    const slot = this.active;
    if (!slot) return;
    encoder.beginComputePass(slot.end).end();
    encoder.resolveQuerySet(slot.query, 0, 2, slot.resolve, 0);
    encoder.copyBufferToBuffer(slot.resolve, 0, slot.readback, 0, 16);
  }
  submitted(): void {
    const slot = this.active;
    this.active = undefined;
    if (!slot) return;
    void slot.readback
      .mapAsync(GPUMapMode.READ)
      .then(() => {
        if (this.destroyed) return;
        try {
          const values = new BigUint64Array(slot.readback.getMappedRange());
          const delta = values[1]! - values[0]!;
          // Reject wrap/reversed/missing timestamps rather than inventing a zero sample.
          if (
            values[0] === 0n ||
            values[1] === 0n ||
            delta <= 0n ||
            delta > 9007199254740991n
          ) {
            this.stats.invalid++;
            this.stats.unavailable(
              'pending',
              'WebGPU timestamps are unavailable or invalid.',
            );
          } else {
            this.stats.sample(slot.frame, Number(delta) / 1_000_000);
          }
        } finally {
          slot.readback.unmap();
          slot.busy = false;
          this.stats.pending--;
        }
      })
      .catch((error: unknown) => {
        if (this.destroyed) return;
        if (slot.busy) {
          slot.busy = false;
          this.stats.pending--;
        }
        this.stats.invalid++;
        this.stats.unavailable(
          'error',
          `GPU timestamp readback failed: ${String(error)}`,
        );
      });
  }
  abort(): void {
    if (!this.active) return;
    this.active.busy = false;
    this.active = undefined;
    this.stats.pending--;
    this.stats.invalid++;
  }
  destroy(lost = false): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.active = undefined;
    for (const slot of this.slots) {
      slot.readback.destroy();
      slot.resolve.destroy();
      slot.query.destroy();
    }
    this.slots.length = 0;
    this.stats.pending = 0;
    this.stats.unavailable(
      lost ? 'lost' : 'disabled',
      lost ? 'WebGPU device was lost.' : 'GPU timing resources were destroyed.',
    );
  }
}

interface DisjointTimerExtension {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
}
interface GlSlot {
  query: WebGLQuery;
  frame: number;
  busy: boolean;
}

/** EXT_disjoint_timer_query_webgl2 results are polled without blocking or fences. */
export class WebGlTimer {
  private readonly slots: GlSlot[] = [];
  private active: GlSlot | undefined;
  private destroyed = false;
  private disjoint = false;
  constructor(
    private readonly stats: GpuFrameTiming,
    private readonly gl: WebGL2RenderingContext,
    private readonly extension: DisjointTimerExtension,
  ) {
    stats.source = 'webgl2-disjoint-query';
    for (let index = 0; index < stats.maxInFlight; index++) {
      const query = gl.createQuery();
      if (!query) {
        this.destroy();
        throw new Error('Could not allocate GPU timer query.');
      }
      this.slots.push({ query, frame: 0, busy: false });
    }
  }
  begin(frame: number): void {
    this.poll();
    if (
      this.destroyed ||
      this.disjoint ||
      frame <= this.stats.warmupFrames ||
      (frame - this.stats.warmupFrames - 1) % this.stats.sampleInterval !== 0
    )
      return;
    let slot: GlSlot | undefined;
    for (const candidate of this.slots)
      if (!candidate.busy) {
        slot = candidate;
        break;
      }
    if (!slot) {
      this.stats.skipped++;
      return;
    }
    slot.busy = true;
    slot.frame = frame;
    this.active = slot;
    this.stats.pending++;
    this.gl.beginQuery(this.extension.TIME_ELAPSED_EXT, slot.query);
  }
  end(): void {
    if (!this.active) return;
    this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
    this.active = undefined;
  }
  poll(): void {
    if (this.destroyed) return;
    const disjoint = !!this.gl.getParameter(this.extension.GPU_DISJOINT_EXT);
    this.disjoint = disjoint;
    if (disjoint) {
      this.stats.unavailable(
        'disjoint',
        'GPU clock became disjoint; outstanding samples were discarded.',
      );
      this.stats.invalid++;
    }
    for (const slot of this.slots) {
      if (!slot.busy || slot === this.active) continue;
      if (
        !disjoint &&
        !this.gl.getQueryParameter(slot.query, this.gl.QUERY_RESULT_AVAILABLE)
      )
        continue;
      if (!disjoint) {
        const nanoseconds = this.gl.getQueryParameter(
          slot.query,
          this.gl.QUERY_RESULT,
        ) as number;
        this.stats.sample(slot.frame, nanoseconds / 1_000_000);
      }
      slot.busy = false;
      this.stats.pending--;
    }
  }
  abort(): void {
    const slot = this.active;
    if (!slot) return;
    this.end();
    slot.busy = false;
    this.stats.pending--;
    this.stats.invalid++;
  }
  destroy(lost = false): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.end();
    for (const slot of this.slots) this.gl.deleteQuery(slot.query);
    this.slots.length = 0;
    this.stats.pending = 0;
    this.stats.unavailable(
      lost ? 'lost' : 'disabled',
      lost ? 'WebGL context was lost.' : 'GPU timing resources were destroyed.',
    );
  }
}
