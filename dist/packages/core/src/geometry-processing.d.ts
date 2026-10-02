import { NativeWorkerPool, type NativeWorkerPoolOptions, type WorkerJobDefinition } from '../../assets/src/worker-jobs.js';
import { Geometry } from './geometry.js';
export interface HeightfieldGeometryRequest {
    readonly columns: number;
    readonly rows: number;
    readonly width: number;
    readonly depth: number;
    readonly heights: Float32Array;
    /** Jacobi smoothing passes; boundary samples remain fixed. */
    readonly iterations: number;
    readonly smoothing: number;
    /** Transfer the generated streams back, or structured-clone them for a measured comparison. */
    readonly transferResult?: boolean;
}
export interface HeightfieldGeometryResult {
    readonly columns: number;
    readonly rows: number;
    readonly positions: Float32Array;
    readonly normals: Float32Array;
    readonly uvs: Float32Array;
    readonly indices: Uint32Array;
}
export declare function decodeHeightfieldGeometryRequest(value: unknown): HeightfieldGeometryRequest;
/** Real CPU smoothing, indexed topology and finite-difference normals; the worker and main thread share this implementation. */
export declare function processHeightfieldGeometry(input: HeightfieldGeometryRequest): HeightfieldGeometryResult;
export declare function decodeHeightfieldGeometryResult(value: unknown): HeightfieldGeometryResult;
export declare const heightfieldGeometryJob: WorkerJobDefinition<HeightfieldGeometryRequest, HeightfieldGeometryResult>;
export interface PublishedWorkerGeometry {
    readonly geometry: Geometry;
    readonly publicationMilliseconds: number;
    /** Existing Geometry validates/interleaves and copies the supplied streams. Not hidden as zero-copy publication. */
    readonly publicationCopiedBytes: number;
}
/** Publish through the existing Geometry consumer, never a second asset loader/cache. */
export declare function publishHeightfieldGeometry(result: HeightfieldGeometryResult): PublishedWorkerGeometry;
/** Resolves to a real emitted .js module in the published dist tree. */
export declare function geometryWorkerURL(): URL;
/** Static native Worker construction is visible to bundlers; moduleURL remains explicit on the underlying pool. */
export declare function createGeometryWorkerPool(options?: Omit<NativeWorkerPoolOptions, 'moduleURL' | 'workerFactory'>): NativeWorkerPool;
