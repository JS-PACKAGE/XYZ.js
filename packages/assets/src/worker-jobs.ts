import { workerJobLimits } from '../../../src/data/worker-jobs.js';
import {
  workerJobProtocol,
  workerByteCount,
  workerTransferBytes,
  validWorkerType,
  type WorkerJobResponse,
} from './worker-job-protocol.js';

export type WorkerJobErrorCode =
  | 'unsupported'
  | 'admission'
  | 'cancelled'
  | 'destroyed'
  | 'worker-failed'
  | 'job-failed'
  | 'protocol'
  | 'timeout';

export class WorkerJobError extends Error {
  constructor(
    readonly code: WorkerJobErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'WorkerJobError';
  }
}

export interface WorkerJobDefinition<Request, Result> {
  readonly type: string;
  /** Validate the trusted module's response before publication. */
  readonly decode: (value: unknown) => Result;
  /** Reclaim an unpublished result, including malformed or late owned payloads. */
  readonly release: (value: unknown) => void;
  /** @internal Carries the request type without any runtime object. */
  readonly requestType?: Request;
}

export interface WorkerJobTiming {
  readonly queueMilliseconds: number;
  /** Synchronous structured-clone/transfer submission, not worker execution. */
  readonly dispatchMilliseconds: number;
  readonly computeMilliseconds: number;
  /** Wall time including queue, transport, validation and worker execution. */
  readonly elapsedMilliseconds: number;
  readonly requestBytes: number;
  readonly requestTransferredBytes: number;
  readonly requestCopiedBytes: number;
  readonly resultBytes: number;
  readonly resultTransferredBytes: number;
  readonly resultCopiedBytes: number;
}

export interface WorkerJobResult<Result> {
  readonly value: Result;
  readonly timing: WorkerJobTiming;
}

export type WorkerJobStatus =
  'queued' | 'running' | 'succeeded' | 'cancelled' | 'failed';

export interface WorkerJobHandle<Result> {
  readonly id: number;
  readonly status: WorkerJobStatus;
  readonly promise: Promise<WorkerJobResult<Result>>;
  cancel(reason?: unknown): void;
}

export interface NativeWorkerPoolOptions {
  /** Explicit application-trusted module; data/blob URLs and credentials are rejected. */
  readonly moduleURL: URL | string;
  readonly workers?: number;
  readonly queuedJobs?: number;
  readonly admittedBytes?: number;
  readonly executionMilliseconds?: number;
  /** Native Worker construction hook for statically analyzable bundler entrypoints. Never a main-thread executor. */
  readonly workerFactory?: (moduleURL: URL) => Worker;
}

export interface WorkerJobOptions {
  /** Exact application payload byte count, including copied and transferred buffers. */
  readonly requestBytes: number;
  /** Transfer occurs only on dispatch. Do not mutate an admitted request while it is pending. */
  readonly transfer?: readonly Transferable[];
  readonly signal?: AbortSignal;
  /** Supersedes the same active key, cancelling its actual worker if already running. */
  readonly key?: string;
}

export interface WorkerPoolStats {
  readonly workers: number;
  readonly running: number;
  readonly queued: number;
  readonly admittedBytes: number;
  readonly completed: number;
  readonly cancelled: number;
  readonly failed: number;
}

interface PendingJob {
  readonly id: number;
  readonly definition: WorkerJobDefinition<unknown, unknown>;
  request: unknown;
  transfer: Transferable[];
  readonly bytes: number;
  transferredBytes: number;
  readonly created: number;
  started: number;
  dispatchMilliseconds: number;
  status: WorkerJobStatus;
  readonly key?: string;
  readonly signal?: AbortSignal;
  abort?: () => void;
  timeout?: ReturnType<typeof setTimeout>;
  resolve?: (value: WorkerJobResult<unknown>) => void;
  reject?: (reason: unknown) => void;
  slot?: WorkerSlot;
}

interface WorkerSlot {
  readonly worker: Worker;
  job?: PendingJob;
  retired: boolean;
}

function boundedPositive(value: number, maximum: number, name: string): void {
  workerByteCount(value, maximum, name);
  if (value === 0) throw new RangeError(`${name} must be positive.`);
}

function lateHandler(
  release: (value: unknown) => void,
): (event: MessageEvent) => void {
  return (event) => {
    const response = event.data as Partial<WorkerJobResponse> | null;
    if (response?.protocol === workerJobProtocol && response.type === 'result')
      release(response.value);
  };
}

/** Bounded lazy native module workers. Running cancellation terminates, not cooperative postMessage cancellation. */
export class NativeWorkerPool {
  readonly moduleURL: URL;
  private readonly workerCount: number;
  private readonly queueLimit: number;
  private readonly byteLimit: number;
  private readonly executionLimit: number;
  private readonly factory: (moduleURL: URL) => Worker;
  private readonly slots = new Set<WorkerSlot>();
  private readonly jobs = new Map<number, PendingJob>();
  private readonly keyedJobs = new Map<string, PendingJob>();
  private readonly queue: PendingJob[] = [];
  private nextId = 1;
  private bytes = 0;
  private completed = 0;
  private cancelled = 0;
  private failed = 0;
  private disposed = false;
  private pumping = false;

  constructor(options: NativeWorkerPoolOptions) {
    this.moduleURL = new URL(options.moduleURL);
    if (
      !['http:', 'https:', 'file:'].includes(this.moduleURL.protocol) ||
      this.moduleURL.username ||
      this.moduleURL.password
    )
      throw new TypeError(
        'A trusted HTTP(S) or file module URL without credentials is required.',
      );
    this.workerCount = options.workers ?? workerJobLimits.defaultWorkers;
    this.queueLimit = options.queuedJobs ?? workerJobLimits.defaultQueuedJobs;
    this.byteLimit = options.admittedBytes ?? workerJobLimits.admittedBytes;
    this.executionLimit =
      options.executionMilliseconds ?? workerJobLimits.executionMilliseconds;
    boundedPositive(this.workerCount, workerJobLimits.workers, 'Worker count');
    workerByteCount(this.queueLimit, workerJobLimits.queuedJobs, 'Queued jobs');
    boundedPositive(
      this.byteLimit,
      workerJobLimits.admittedBytes,
      'Admitted bytes',
    );
    boundedPositive(
      this.executionLimit,
      workerJobLimits.executionMilliseconds,
      'Execution milliseconds',
    );
    if (!options.workerFactory && typeof Worker === 'undefined')
      throw new WorkerJobError(
        'unsupported',
        'Native module Workers are unavailable.',
      );
    this.factory =
      options.workerFactory ?? ((url) => new Worker(url, { type: 'module' }));
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  get stats(): WorkerPoolStats {
    return {
      workers: this.slots.size,
      running: this.jobs.size - this.queue.length,
      queued: this.queue.length,
      admittedBytes: this.bytes,
      completed: this.completed,
      cancelled: this.cancelled,
      failed: this.failed,
    };
  }

  submit<Request, Result>(
    definition: WorkerJobDefinition<Request, Result>,
    request: Request,
    options: WorkerJobOptions,
  ): WorkerJobHandle<Result> {
    if (this.disposed)
      throw new WorkerJobError('destroyed', 'Worker pool is destroyed.');
    if (
      !definition ||
      !validWorkerType(definition.type) ||
      typeof definition.decode !== 'function' ||
      typeof definition.release !== 'function'
    )
      throw new TypeError(
        'A typed worker definition with decode and release is required.',
      );
    workerByteCount(
      options.requestBytes,
      workerJobLimits.requestBytes,
      'Request bytes',
    );
    if (
      options.key !== undefined &&
      (typeof options.key !== 'string' ||
        options.key.length === 0 ||
        options.key.length > workerJobLimits.keyLength)
    )
      throw new TypeError('Invalid worker supersession key.');
    if (options.signal?.aborted)
      throw new WorkerJobError('cancelled', 'Worker job was already aborted.', {
        cause: options.signal.reason,
      });
    const transfer = options.transfer ? [...options.transfer] : [];
    const transferredBytes = workerTransferBytes(transfer);
    if (transferredBytes > options.requestBytes)
      throw new RangeError(
        'Transferred bytes exceed the declared request bytes.',
      );
    const previous =
      options.key === undefined ? undefined : this.keyedJobs.get(options.key);
    const futureBytes =
      this.bytes - (previous?.bytes ?? 0) + options.requestBytes;
    const running =
      this.jobs.size -
      this.queue.length -
      (previous?.status === 'running' ? 1 : 0);
    const queued = this.queue.length - (previous?.status === 'queued' ? 1 : 0);
    if (
      futureBytes > this.byteLimit ||
      (running >= this.workerCount && queued >= this.queueLimit)
    )
      throw new WorkerJobError(
        'admission',
        'Worker job queue or admitted byte budget is full.',
      );
    if (previous)
      this.cancelJob(
        previous,
        new WorkerJobError('cancelled', 'Worker job was superseded.'),
        false,
      );
    let resolve!: (value: WorkerJobResult<unknown>) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<WorkerJobResult<Result>>((accept, decline) => {
      resolve = accept as (value: WorkerJobResult<unknown>) => void;
      reject = decline;
    });
    const job: PendingJob = {
      id: this.nextId++,
      definition: definition as WorkerJobDefinition<unknown, unknown>,
      request,
      transfer,
      bytes: options.requestBytes,
      transferredBytes,
      created: performance.now(),
      started: 0,
      dispatchMilliseconds: 0,
      status: 'queued',
      key: options.key,
      signal: options.signal,
      resolve,
      reject,
    };
    this.jobs.set(job.id, job);
    this.bytes += job.bytes;
    this.queue.push(job);
    if (job.key !== undefined) this.keyedJobs.set(job.key, job);
    job.abort = () =>
      this.cancelJob(
        job,
        new WorkerJobError('cancelled', 'Worker job was aborted.', {
          cause: job.signal?.reason,
        }),
      );
    job.signal?.addEventListener('abort', job.abort, { once: true });
    this.pump();
    return {
      id: job.id,
      get status() {
        return job.status;
      },
      promise,
      cancel: (reason) =>
        this.cancelJob(
          job,
          new WorkerJobError('cancelled', 'Worker job was cancelled.', {
            cause: reason,
          }),
        ),
    };
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    const error = new WorkerJobError('destroyed', 'Worker pool was destroyed.');
    for (const job of this.jobs.values()) {
      if (job.slot) this.retire(job.slot, job.definition.release);
      this.finish(job, 'failed', error);
    }
    for (const slot of this.slots) this.retire(slot);
    this.queue.length = 0;
    this.keyedJobs.clear();
  }

  private pump(): void {
    if (this.pumping || this.disposed) return;
    this.pumping = true;
    try {
      while (this.queue.length) {
        let slot: WorkerSlot | undefined;
        for (const candidate of this.slots) {
          if (!candidate.job) {
            slot = candidate;
            break;
          }
        }
        if (!slot && this.slots.size >= this.workerCount) break;
        const job = this.queue.shift()!;
        if (!slot) {
          try {
            slot = { worker: this.factory(this.moduleURL), retired: false };
            this.slots.add(slot);
          } catch (error) {
            this.finish(
              job,
              'failed',
              new WorkerJobError(
                'worker-failed',
                'Native worker creation failed.',
                { cause: error },
              ),
            );
            continue;
          }
        }
        const active = slot;
        active.job = job;
        job.slot = active;
        job.status = 'running';
        job.started = performance.now();
        active.worker.onmessage = (event) => this.receive(active, job, event);
        active.worker.onerror = (event) => {
          event.preventDefault();
          this.failWorker(
            active,
            job,
            new WorkerJobError(
              'worker-failed',
              event.message || 'Native worker failed.',
            ),
          );
        };
        active.worker.onmessageerror = () =>
          this.failWorker(
            active,
            job,
            new WorkerJobError(
              'protocol',
              'Worker response could not be deserialized.',
            ),
          );
        job.timeout = setTimeout(
          () =>
            this.failWorker(
              active,
              job,
              new WorkerJobError(
                'timeout',
                'Worker job exceeded its execution limit.',
              ),
            ),
          this.executionLimit,
        );
        try {
          const start = performance.now();
          active.worker.postMessage(
            {
              protocol: workerJobProtocol,
              type: 'run',
              id: job.id,
              jobType: job.definition.type,
              request: job.request,
              requestBytes: job.bytes,
            },
            job.transfer,
          );
          job.dispatchMilliseconds = performance.now() - start;
          job.request = undefined;
          job.transfer = [];
        } catch (error) {
          this.failWorker(
            active,
            job,
            new WorkerJobError(
              'worker-failed',
              'Worker request transfer failed.',
              { cause: error },
            ),
          );
        }
      }
    } finally {
      this.pumping = false;
    }
  }

  private receive(
    slot: WorkerSlot,
    job: PendingJob,
    event: MessageEvent,
  ): void {
    const response = event.data as Partial<WorkerJobResponse> | null;
    if (slot.retired || !this.jobs.has(job.id)) {
      lateHandler(job.definition.release)(event);
      return;
    }
    if (
      !response ||
      response.protocol !== workerJobProtocol ||
      response.id !== job.id ||
      (response.type !== 'result' && response.type !== 'error')
    ) {
      try {
        if (response?.type === 'result') job.definition.release(response.value);
      } finally {
        this.failWorker(
          slot,
          job,
          new WorkerJobError('protocol', 'Unexpected worker response.'),
        );
      }
      return;
    }
    if (response.type === 'error') {
      if (
        !response.error ||
        typeof response.error.name !== 'string' ||
        typeof response.error.message !== 'string'
      ) {
        this.failWorker(
          slot,
          job,
          new WorkerJobError('protocol', 'Malformed worker error.'),
        );
        return;
      }
      const cause = new Error(
        response.error.message.slice(0, workerJobLimits.errorLength),
      );
      cause.name = response.error.name.slice(0, workerJobLimits.typeLength);
      this.failWorker(
        slot,
        job,
        new WorkerJobError('job-failed', cause.message, { cause }),
      );
      return;
    }
    const success = response as Partial<
      Extract<WorkerJobResponse, { type: 'result' }>
    >;
    let value: unknown;
    try {
      workerByteCount(
        success.resultBytes!,
        workerJobLimits.resultBytes,
        'Result bytes',
      );
      workerByteCount(
        success.transferredBytes!,
        success.resultBytes!,
        'Result transferred bytes',
      );
      if (
        typeof success.computeMilliseconds !== 'number' ||
        !Number.isFinite(success.computeMilliseconds) ||
        success.computeMilliseconds < 0
      )
        throw new TypeError('Invalid worker compute duration.');
      value = job.definition.decode(success.value);
    } catch (error) {
      try {
        job.definition.release(success.value);
      } finally {
        this.failWorker(
          slot,
          job,
          new WorkerJobError('protocol', 'Worker result validation failed.', {
            cause: error,
          }),
        );
      }
      return;
    }
    // Decode may synchronously cancel/destroy/reenter the pool; ownership must not be published afterwards.
    if (!this.jobs.has(job.id)) {
      job.definition.release(success.value);
      return;
    }
    const result: WorkerJobResult<unknown> = {
      value,
      timing: {
        queueMilliseconds: job.started - job.created,
        dispatchMilliseconds: job.dispatchMilliseconds,
        computeMilliseconds: success.computeMilliseconds!,
        elapsedMilliseconds: performance.now() - job.created,
        requestBytes: job.bytes,
        requestTransferredBytes: job.transferredBytes,
        requestCopiedBytes: job.bytes - job.transferredBytes,
        resultBytes: success.resultBytes!,
        resultTransferredBytes: success.transferredBytes!,
        resultCopiedBytes: success.resultBytes! - success.transferredBytes!,
      },
    };
    const resolve = job.resolve;
    this.finish(job, 'succeeded');
    slot.worker.onmessage = null;
    slot.worker.onerror = (event) => {
      event.preventDefault();
      this.retire(slot);
      this.pump();
    };
    slot.worker.onmessageerror = () => {
      this.retire(slot);
      this.pump();
    };
    resolve?.(result);
    this.pump();
  }

  private finish(
    job: PendingJob,
    status: WorkerJobStatus,
    error?: unknown,
  ): void {
    if (!this.jobs.delete(job.id)) return;
    this.bytes -= job.bytes;
    const queued = this.queue.indexOf(job);
    if (queued !== -1) this.queue.splice(queued, 1);
    if (job.key !== undefined && this.keyedJobs.get(job.key) === job)
      this.keyedJobs.delete(job.key);
    if (job.abort) job.signal?.removeEventListener('abort', job.abort);
    clearTimeout(job.timeout);
    if (job.slot?.job === job) job.slot.job = undefined;
    job.slot = undefined;
    job.request = undefined;
    job.transfer = [];
    job.abort = undefined;
    job.timeout = undefined;
    job.status = status;
    if (status === 'succeeded') this.completed++;
    else if (status === 'cancelled') this.cancelled++;
    else this.failed++;
    const reject = job.reject;
    job.resolve = undefined;
    job.reject = undefined;
    if (error !== undefined) reject?.(error);
  }

  private retire(slot: WorkerSlot, release?: (value: unknown) => void): void {
    if (slot.retired) return;
    slot.retired = true;
    slot.worker.onmessage = release ? lateHandler(release) : null;
    slot.worker.onerror = null;
    slot.worker.onmessageerror = null;
    slot.worker.terminate();
    this.slots.delete(slot);
  }

  private failWorker(
    slot: WorkerSlot,
    job: PendingJob,
    error: WorkerJobError,
  ): void {
    if (!this.jobs.has(job.id)) return;
    this.retire(slot, job.definition.release);
    this.finish(job, 'failed', error);
    this.pump();
  }

  private cancelJob(job: PendingJob, error: WorkerJobError, pump = true): void {
    if (!this.jobs.has(job.id)) return;
    if (job.slot) this.retire(job.slot, job.definition.release);
    this.finish(job, 'cancelled', error);
    if (pump) this.pump();
  }
}
