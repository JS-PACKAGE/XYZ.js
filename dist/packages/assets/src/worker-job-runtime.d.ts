import { type WorkerJobResponse } from './worker-job-protocol.js';
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
    execute(request: Request, context: WorkerJobContext): WorkerJobOutput<Result> | Promise<WorkerJobOutput<Result>>;
}
/** DOM lib-compatible subset of a dedicated worker's global scope. */
export interface WorkerJobHost {
    onmessage: ((event: MessageEvent<unknown>) => void) | null;
    postMessage(message: WorkerJobResponse, transfer: Transferable[]): void;
}
/** Install only in an application-authored module Worker. This never fetches/evaluates asset code. */
export declare function installWorkerJobs(handlers: Readonly<Record<string, TrustedWorkerJob<unknown, unknown>>>, host?: WorkerJobHost): () => void;
