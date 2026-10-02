import { workerJobLimits } from '../../../src/data/worker-jobs.js';

export const workerJobProtocol = 'xyz-worker-job-v1';

export interface WorkerJobRequest {
  readonly protocol: typeof workerJobProtocol;
  readonly type: 'run';
  readonly id: number;
  readonly jobType: string;
  readonly request: unknown;
  readonly requestBytes: number;
}

export interface WorkerJobSuccess {
  readonly protocol: typeof workerJobProtocol;
  readonly type: 'result';
  readonly id: number;
  readonly value: unknown;
  readonly computeMilliseconds: number;
  readonly resultBytes: number;
  readonly transferredBytes: number;
}

export interface WorkerJobFailure {
  readonly protocol: typeof workerJobProtocol;
  readonly type: 'error';
  readonly id: number;
  readonly error: { readonly name: string; readonly message: string };
}

export type WorkerJobResponse = WorkerJobSuccess | WorkerJobFailure;

export function workerByteCount(
  value: number,
  maximum: number,
  name: string,
): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum)
    throw new RangeError(`${name} must be an integer in [0, ${maximum}].`);
}

/** Non-buffer transferable sizes must be included in the caller's explicit byte count. */
export function workerTransferBytes(transfer: readonly Transferable[]): number {
  const unique = new Set<Transferable>();
  let bytes = 0;
  for (const item of transfer) {
    if (unique.has(item))
      throw new TypeError('Duplicate worker transfer ownership.');
    unique.add(item);
    if (item instanceof ArrayBuffer) bytes += item.byteLength;
  }
  return bytes;
}

export function validWorkerType(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= workerJobLimits.typeLength &&
    /^[a-zA-Z0-9_.-]+$/.test(value)
  );
}
