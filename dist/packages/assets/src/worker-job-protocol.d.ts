export declare const workerJobProtocol = "xyz-worker-job-v1";
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
    readonly error: {
        readonly name: string;
        readonly message: string;
    };
}
export type WorkerJobResponse = WorkerJobSuccess | WorkerJobFailure;
export declare function workerByteCount(value: number, maximum: number, name: string): void;
/** Non-buffer transferable sizes must be included in the caller's explicit byte count. */
export declare function workerTransferBytes(transfer: readonly Transferable[]): number;
export declare function validWorkerType(value: string): boolean;
