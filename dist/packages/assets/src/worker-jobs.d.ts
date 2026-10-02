export type WorkerJobErrorCode = 'unsupported' | 'admission' | 'cancelled' | 'destroyed' | 'worker-failed' | 'job-failed' | 'protocol' | 'timeout';
export declare class WorkerJobError extends Error {
    readonly code: WorkerJobErrorCode;
    constructor(code: WorkerJobErrorCode, message: string, options?: ErrorOptions);
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
export type WorkerJobStatus = 'queued' | 'running' | 'succeeded' | 'cancelled' | 'failed';
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
/** Bounded lazy native module workers. Running cancellation terminates, not cooperative postMessage cancellation. */
export declare class NativeWorkerPool {
    readonly moduleURL: URL;
    private readonly workerCount;
    private readonly queueLimit;
    private readonly byteLimit;
    private readonly executionLimit;
    private readonly factory;
    private readonly slots;
    private readonly jobs;
    private readonly keyedJobs;
    private readonly queue;
    private nextId;
    private bytes;
    private completed;
    private cancelled;
    private failed;
    private disposed;
    private pumping;
    constructor(options: NativeWorkerPoolOptions);
    get destroyed(): boolean;
    get stats(): WorkerPoolStats;
    submit<Request, Result>(definition: WorkerJobDefinition<Request, Result>, request: Request, options: WorkerJobOptions): WorkerJobHandle<Result>;
    destroy(): void;
    private pump;
    private receive;
    private finish;
    private retire;
    private failWorker;
    private cancelJob;
}
