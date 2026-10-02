import { workerJobLimits } from '../../../src/data/worker-jobs.js';
import {
  workerJobProtocol,
  workerByteCount,
  workerTransferBytes,
  validWorkerType,
  type WorkerJobRequest,
  type WorkerJobResponse,
} from './worker-job-protocol.js';

export interface WorkerJobOutput<Result> {
  readonly value: Result;
  readonly transfer: Transferable[];
  readonly byteLength: number;
}

export interface WorkerJobContext {
  /** Claim the whole response envelope (not nested members) before fallible work. */
  own<Value>(value: Value, dispose: (value: Value) => void): Value;
}

export interface TrustedWorkerJob<Request, Result> {
  decode(value: unknown): Request;
  execute(
    request: Request,
    context: WorkerJobContext,
  ): WorkerJobOutput<Result> | Promise<WorkerJobOutput<Result>>;
}

/** DOM lib-compatible subset of a dedicated worker's global scope. */
export interface WorkerJobHost {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: WorkerJobResponse, transfer: Transferable[]): void;
}

/** Install only in an application-authored module Worker. This never fetches/evaluates asset code. */
export function installWorkerJobs(
  handlers: Readonly<Record<string, TrustedWorkerJob<unknown, unknown>>>,
  host: WorkerJobHost = globalThis as unknown as WorkerJobHost,
): () => void {
  let disposed = false;
  let busy = false;
  const owned = new Map<unknown, (value: unknown) => void>();
  const context: WorkerJobContext = {
    own(value, dispose) {
      if (disposed) {
        dispose(value);
        throw new Error(
          'Trusted worker owner was disposed before the payload claim.',
        );
      }
      if (owned.has(value))
        throw new TypeError('Worker response ownership was already claimed.');
      owned.set(value, dispose as (value: unknown) => void);
      return value;
    },
  };
  const clean = (except?: unknown): void => {
    const errors: unknown[] = [];
    for (const [value, dispose] of owned) {
      if (value === except) continue;
      owned.delete(value);
      try {
        dispose(value);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Worker owned payload cleanup failed.');
  };
  host.onmessage = (event) => {
    const message = event.data as Partial<WorkerJobRequest> | null;
    if (
      disposed ||
      !message ||
      message.protocol !== workerJobProtocol ||
      message.type !== 'run' ||
      !Number.isSafeInteger(message.id) ||
      message.id! <= 0
    )
      return;
    const id = message.id!;
    const respond = (error: unknown): void => {
      const source = error instanceof Error ? error : new Error(String(error));
      host.postMessage(
        {
          protocol: workerJobProtocol,
          type: 'error',
          id,
          error: {
            name: source.name.slice(0, workerJobLimits.typeLength),
            message: source.message.slice(0, workerJobLimits.errorLength),
          },
        },
        [],
      );
    };
    if (busy) {
      respond(new Error('Trusted worker received concurrent work.'));
      return;
    }
    busy = true;
    const run = async (): Promise<void> => {
      let published = false;
      try {
        if (!validWorkerType(message.jobType!))
          throw new TypeError('Invalid worker job type.');
        workerByteCount(
          message.requestBytes!,
          workerJobLimits.requestBytes,
          'Request bytes',
        );
        if (!Object.hasOwn(handlers, message.jobType!))
          throw new TypeError('Unknown trusted worker job type.');
        const handler = handlers[message.jobType!];
        const started = performance.now();
        const result = await handler.execute(
          handler.decode(message.request),
          context,
        );
        const computeMilliseconds = performance.now() - started;
        workerByteCount(
          result.byteLength,
          workerJobLimits.resultBytes,
          'Result bytes',
        );
        const transferredBytes = workerTransferBytes(result.transfer);
        if (transferredBytes > result.byteLength)
          throw new RangeError(
            'Worker response transfer exceeds its declared byte count.',
          );
        if (disposed) return;
        // Scratch claims are cleaned before transfer; only the response claim moves to the caller.
        clean(result.value);
        host.postMessage(
          {
            protocol: workerJobProtocol,
            type: 'result',
            id,
            value: result.value,
            computeMilliseconds,
            resultBytes: result.byteLength,
            transferredBytes,
          },
          result.transfer,
        );
        owned.delete(result.value);
        published = true;
      } catch (error) {
        let failure = error;
        try {
          clean();
        } catch (cleanupError) {
          failure = new AggregateError(
            [error, cleanupError],
            'Worker execution and cleanup failed.',
          );
        }
        if (!disposed) respond(failure);
      } finally {
        busy = false;
        if (!published) clean();
      }
    };
    void run();
  };
  return () => {
    if (disposed) return;
    disposed = true;
    host.onmessage = null;
    clean();
  };
}
