import { describe, expect, it, vi } from 'vitest';
import {
  NativeWorkerPool,
  type WorkerJobDefinition,
} from '../packages/assets/src/worker-jobs.js';
import {
  workerJobProtocol,
  type WorkerJobRequest,
  type WorkerJobResponse,
} from '../packages/assets/src/worker-job-protocol.js';

/** Controlled native transport boundary; these tests assert owner/admission transitions, not execution-thread identity. */
class ControlledWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminated = false;
  request?: WorkerJobRequest;
  postMessage(message: WorkerJobRequest, transfer: Transferable[]): void {
    this.request = structuredClone(message, { transfer });
  }
  terminate(): void {
    this.terminated = true;
  }
  respond(value: unknown): void {
    const response: WorkerJobResponse = {
      protocol: workerJobProtocol,
      type: 'result',
      id: this.request!.id,
      value,
      computeMilliseconds: 5,
      resultBytes: 4,
      transferredBytes: 0,
    };
    this.onmessage?.(new MessageEvent('message', { data: response }));
  }
}

interface Payload {
  closed: boolean;
  value: number;
}
function fixture(
  options: {
    queuedJobs?: number;
    admittedBytes?: number;
    executionMilliseconds?: number;
  } = {},
) {
  const workers: ControlledWorker[] = [];
  const released: Payload[] = [];
  const definition: WorkerJobDefinition<Float32Array, Payload> = {
    type: 'owned.result',
    decode(value) {
      if (!value || typeof value !== 'object' || !('value' in value))
        throw new TypeError('Invalid owned result.');
      return value as Payload;
    },
    release(value) {
      const payload = value as Payload;
      payload.closed = true;
      released.push(payload);
    },
  };
  const pool = new NativeWorkerPool({
    moduleURL: new URL('https://example.test/trusted-worker.js'),
    workers: 1,
    ...options,
    workerFactory: () => {
      const worker = new ControlledWorker();
      workers.push(worker);
      return worker as unknown as Worker;
    },
  });
  return { pool, workers, definition, released };
}

function input() {
  return new Float32Array([1]);
}

describe('native worker job ownership and admission', () => {
  it('rejects saturated admission without detaching rejected/queued inputs, and queued abort releases its byte reservation', async () => {
    const { pool, workers, definition } = fixture({
      queuedJobs: 1,
      admittedBytes: 8,
    });
    try {
      const running = pool.submit(definition, input(), { requestBytes: 4 });
      const buffer = input();
      const abort = new AbortController();
      const queued = pool.submit(definition, buffer, {
        requestBytes: 4,
        transfer: [buffer.buffer],
        signal: abort.signal,
      });
      const rejection = expect(queued.promise).rejects.toMatchObject({
        code: 'cancelled',
      });
      const rejected = input();
      expect(() =>
        pool.submit(definition, rejected, {
          requestBytes: 4,
          transfer: [rejected.buffer],
        }),
      ).toThrow();
      expect(rejected.byteLength).toBe(4);
      expect(buffer.byteLength).toBe(4);
      abort.abort();
      await rejection;
      expect(pool.stats.admittedBytes).toBe(4);
      expect(workers[0].terminated).toBe(false);
      workers[0].respond({ value: 7, closed: false });
      expect((await running.promise).value.value).toBe(7);
      expect(buffer.byteLength).toBe(4);
    } finally {
      pool.destroy();
    }
  });

  it('hard-cancels executing work, reclaims a late owned payload and admits a replacement without stale publication', async () => {
    const { pool, workers, definition, released } = fixture({ queuedJobs: 0 });
    const source = input();
    const first = pool.submit(definition, source, {
      requestBytes: 4,
      transfer: [source.buffer],
      key: 'preview',
    });
    const rejected = expect(first.promise).rejects.toMatchObject({
      code: 'cancelled',
    });
    expect(source.byteLength).toBe(0);
    const second = pool.submit(definition, input(), {
      requestBytes: 4,
      key: 'preview',
    });
    await rejected;
    expect(workers[0].terminated).toBe(true);
    const stale = { value: 1, closed: false };
    workers[0].respond(stale);
    expect(stale.closed).toBe(true);
    expect(released).toEqual([stale]);
    const accepted = { value: 2, closed: false };
    workers[1].respond(accepted);
    expect((await second.promise).value).toBe(accepted);
    pool.destroy();
    expect(accepted.closed).toBe(false);
    expect(pool.stats).toMatchObject({
      workers: 0,
      queued: 0,
      running: 0,
      admittedBytes: 0,
    });
  });

  it('reclaims response ownership when decode synchronously aborts the owner before publication', async () => {
    const { pool, workers, definition, released } = fixture();
    const abort = new AbortController();
    const job = pool.submit(
      {
        ...definition,
        decode(value) {
          abort.abort('Publication superseded');
          return definition.decode(value);
        },
      },
      input(),
      { requestBytes: 4, signal: abort.signal },
    );
    const rejected = expect(job.promise).rejects.toMatchObject({
      code: 'cancelled',
    });
    const stale = { value: 3, closed: false };
    workers[0].respond(stale);
    await rejected;
    expect(released).toEqual([stale]);
    expect(pool.stats.workers).toBe(0);
    pool.destroy();
  });

  it('destroy rejects queued/running promises, terminates all actual slots and still reclaims already arriving payloads', async () => {
    const { pool, workers, definition, released } = fixture();
    const running = pool.submit(definition, input(), { requestBytes: 4 });
    const queuedInput = input();
    const queued = pool.submit(definition, queuedInput, {
      requestBytes: 4,
      transfer: [queuedInput.buffer],
    });
    const rejectedRunning = expect(running.promise).rejects.toMatchObject({
      code: 'destroyed',
    });
    const rejectedQueued = expect(queued.promise).rejects.toMatchObject({
      code: 'destroyed',
    });
    pool.destroy();
    pool.destroy();
    await Promise.all([rejectedRunning, rejectedQueued]);
    workers[0].respond({ value: 4, closed: false });
    expect(released[0].closed).toBe(true);
    expect(workers.every((worker) => worker.terminated)).toBe(true);
    expect(queuedInput.byteLength).toBe(4);
    expect(pool.stats).toMatchObject({
      workers: 0,
      running: 0,
      queued: 0,
      admittedBytes: 0,
    });
  });

  it('reclaims rejected response data and replaces a failed worker without retrying the failed consumer job', async () => {
    const { pool, workers, definition, released } = fixture();
    const invalid = pool.submit(
      {
        ...definition,
        decode() {
          throw new RangeError('Invalid result');
        },
      },
      input(),
      { requestBytes: 4 },
    );
    const queued = pool.submit(definition, input(), { requestBytes: 4 });
    const rejected = expect(invalid.promise).rejects.toMatchObject({
      code: 'protocol',
    });
    workers[0].respond({ value: -1, closed: false });
    await rejected;
    expect(released[0].closed).toBe(true);
    expect(workers[0].terminated).toBe(true);
    workers[1].respond({ value: 5, closed: false });
    expect((await queued.promise).value.value).toBe(5);
    expect(pool.stats.failed).toBe(1);
    pool.destroy();
  });

  it('terminates a hung native job at the execution cap and returns all admission reservations', async () => {
    vi.useFakeTimers();
    const { pool, workers, definition } = fixture({
      executionMilliseconds: 10,
    });
    try {
      const job = pool.submit(definition, input(), { requestBytes: 4 });
      const rejected = expect(job.promise).rejects.toMatchObject({
        code: 'timeout',
      });
      await vi.advanceTimersByTimeAsync(10);
      await rejected;
      expect(workers[0].terminated).toBe(true);
      expect(pool.stats).toMatchObject({
        workers: 0,
        admittedBytes: 0,
        running: 0,
      });
    } finally {
      pool.destroy();
      vi.useRealTimers();
    }
  });
});
