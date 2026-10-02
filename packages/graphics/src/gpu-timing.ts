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
  writes: (GPURenderPassTimestampWrites & GPUComputePassTimestampWrites)[];
  frame: number;
  passes: number;
  overflow: boolean;
  busy: boolean;
}

const timedEncoders = new WeakMap<GPUCommandEncoder, WebGpuTimer>();

/** Integer subtraction preserves duration precision even when absolute GPU clocks exceed 2^53. */
export function nativePassDurationNanoseconds(
  values: BigUint64Array,
): bigint | null {
  if (!values.length || values.length % 2) return null;
  let total = 0n;
  for (let index = 0; index < values.length; index += 2) {
    const start = values[index]!;
    const end = values[index + 1]!;
    if (end < start || (start === 0n && end === 0n)) return null;
    total += end - start;
  }
  // Equal nonzero ticks may be quantized; only the complete positive sum is usable.
  return total > 0n && total <= 9007199254740991n ? total : null;
}

/** Timestamp only real native passes. The native API consumes descriptors synchronously. */
export function beginTimedRenderPass(
  encoder: GPUCommandEncoder,
  descriptor: GPURenderPassDescriptor,
): GPURenderPassEncoder {
  const previous = descriptor.timestampWrites;
  const writes = timedEncoders.get(encoder)?.nextPass();
  if (writes && !previous) descriptor.timestampWrites = writes;
  try {
    return encoder.beginRenderPass(descriptor);
  } finally {
    if (previous) descriptor.timestampWrites = previous;
    else delete descriptor.timestampWrites;
    if (writes && previous) timedEncoders.get(encoder)?.conflict();
  }
}

export function beginTimedComputePass(
  encoder: GPUCommandEncoder,
  descriptor: GPUComputePassDescriptor,
): GPUComputePassEncoder {
  const previous = descriptor.timestampWrites;
  const writes = timedEncoders.get(encoder)?.nextPass();
  if (writes && !previous) descriptor.timestampWrites = writes;
  try {
    return encoder.beginComputePass(descriptor);
  } finally {
    if (previous) descriptor.timestampWrites = previous;
    else delete descriptor.timestampWrites;
    if (writes && previous) timedEncoders.get(encoder)?.conflict();
  }
}

/** Sum of real render/compute pass durations, excluding inter-pass gaps, queue wait and present. */
export class WebGpuTimer {
  private readonly slots: GpuSlot[] = [];
  private active: GpuSlot | undefined;
  private encoder: GPUCommandEncoder | undefined;
  private destroyed = false;
  constructor(
    private readonly stats: GpuFrameTiming,
    device: GPUDevice,
  ) {
    stats.source = 'webgpu-timestamp-query';
    stats.scope = 'native-pass-sum';
    const count = gpuTimingDefaults.maxTimedPasses * 2;
    for (let index = 0; index < stats.maxInFlight; index++) {
      let query: GPUQuerySet | undefined;
      let resolve: GPUBuffer | undefined;
      let readback: GPUBuffer | undefined;
      try {
        query = device.createQuerySet({ type: 'timestamp', count });
        const size = Math.ceil((count * 8) / 256) * 256;
        resolve = device.createBuffer({
          size,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });
        readback = device.createBuffer({
          size,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        const querySet = query;
        this.slots.push({
          query,
          resolve,
          readback,
          writes: Array.from(
            { length: gpuTimingDefaults.maxTimedPasses },
            (_, pass) => ({
              querySet,
              beginningOfPassWriteIndex: pass * 2,
              endOfPassWriteIndex: pass * 2 + 1,
            }),
          ),
          frame: 0,
          passes: 0,
          overflow: false,
          busy: false,
        });
      } catch (error) {
        readback?.destroy();
        resolve?.destroy();
        query?.destroy();
        this.destroy();
        stats.unavailable(
          'error',
          `GPU timestamp allocation failed: ${String(error)}`,
        );
        throw error;
      }
    }
  }
  begin(encoder: GPUCommandEncoder, frame: number): void {
    if (this.active) this.abort();
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
    slot.passes = 0;
    slot.overflow = false;
    this.active = slot;
    this.encoder = encoder;
    timedEncoders.set(encoder, this);
    this.stats.pending++;
  }
  nextPass(): GPURenderPassTimestampWrites | undefined {
    const slot = this.active;
    if (!slot || slot.overflow) return undefined;
    if (slot.passes >= slot.writes.length) {
      slot.overflow = true;
      return undefined;
    }
    return slot.writes[slot.passes++];
  }
  conflict(): void {
    if (this.active) this.active.overflow = true;
  }
  private detach(): void {
    if (this.encoder) timedEncoders.delete(this.encoder);
    this.encoder = undefined;
  }
  end(encoder: GPUCommandEncoder): void {
    const slot = this.active;
    this.detach();
    if (!slot) return;
    if (!slot.passes || slot.overflow) {
      this.stats.skipped++;
      this.stats.unavailable(
        'pending',
        slot.overflow
          ? 'Native pass timestamp capacity exceeded or descriptor already owns timestamps; no partial duration reported.'
          : 'No timed native render/compute passes in this frame.',
      );
      slot.busy = false;
      this.active = undefined;
      this.stats.pending--;
      return;
    }
    const count = slot.passes * 2;
    encoder.resolveQuerySet(slot.query, 0, count, slot.resolve, 0);
    encoder.copyBufferToBuffer(slot.resolve, 0, slot.readback, 0, count * 8);
  }
  submitted(): void {
    const slot = this.active;
    this.detach();
    this.active = undefined;
    if (!slot) return;
    const size = slot.passes * 16;
    // Called only after queue.submit. mapAsync waits for this buffer's submitted copy,
    // without globally draining the queue or synchronizing subsequent frames.
    void slot.readback
      .mapAsync(GPUMapMode.READ, 0, size)
      .then(() => {
        if (this.destroyed) return;
        try {
          const values = new BigUint64Array(
            slot.readback.getMappedRange(0, size),
          );
          const total = nativePassDurationNanoseconds(values);
          if (total === null) {
            this.stats.invalid++;
            this.stats.unavailable(
              'pending',
              'Real native pass timestamps were zero, reversed, quantized to zero or outside exact duration range. Run the engine-free timestamp probe for this adapter/browser session; no timing fallback.',
            );
          } else this.stats.sample(slot.frame, Number(total) / 1_000_000);
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
    this.detach();
    if (!this.active) return;
    this.active.busy = false;
    this.active = undefined;
    this.stats.pending--;
    this.stats.invalid++;
  }
  destroy(lost = false): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detach();
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
    stats.scope = 'native-command-interval';
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
