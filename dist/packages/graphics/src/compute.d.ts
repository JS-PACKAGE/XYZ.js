export type ComputeScalar = 'f32' | 'u32' | 'i32';
export type ComputeArray = Float32Array | Uint32Array | Int32Array;
export interface ComputeBinding {
    readonly type: ComputeScalar;
    readonly access: 'read' | 'read-write';
}
export interface ComputeProgramOptions {
    /** WGSL declarations defining fn compute(index: vec3u). Storage arrays are buffer0..N at group 0. */
    readonly wgsl: string;
    readonly bindings: readonly ComputeBinding[];
    readonly workgroupSize?: readonly [number, number?, number?];
    readonly label?: string;
}
export interface ComputeDispatchOptions {
    readonly bindings: readonly ComputeBuffer[];
    readonly workgroups: readonly [number, number?, number?];
    readonly signal?: AbortSignal;
}
export interface ComputeReadOptions {
    readonly offset?: number;
    readonly count?: number;
    readonly signal?: AbortSignal;
}
export interface ComputePreparationOptions {
    readonly signal?: AbortSignal;
}
export declare class ComputeBuffer extends EventTarget {
    readonly type: ComputeScalar;
    readonly length: number;
    readonly label: string;
    private disposed;
    constructor(options: {
        type: ComputeScalar;
        length: number;
        label?: string;
    });
    get byteLength(): number;
    get destroyed(): boolean;
    validate(): void;
    validateUpload(data: ComputeArray, offset?: number): void;
    range(offset: number, count: number): void;
    destroy(): void;
}
export declare class ComputeProgram extends EventTarget {
    readonly wgsl: string;
    readonly bindings: readonly ComputeBinding[];
    readonly workgroupSize: readonly [number, number, number];
    readonly label: string;
    private disposed;
    constructor(options: ComputeProgramOptions);
    get destroyed(): boolean;
    validate(): void;
    validateDispatch(options: ComputeDispatchOptions): readonly [number, number, number];
    destroy(): void;
}
/** Abort stops waiting/submission, not already submitted GPU execution. */
export declare function gpuOperation<T>(promise: Promise<T>, signal?: AbortSignal, resources?: readonly (EventTarget & {
    readonly destroyed: boolean;
})[]): Promise<T>;
