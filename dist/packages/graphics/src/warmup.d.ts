import type { Scene } from '../../core/src/scene.js';
import type { Renderer } from './index.js';
export interface WarmupProgress {
    readonly completed: number;
    readonly total: number;
    readonly ratio: number;
    readonly chunks: number;
}
export interface WarmupOptions {
    /** Maximum resources begun in a RAF chunk; defaults to eight. */
    maxItems?: number;
    /** CPU wall-clock boundary between resources; one item can exceed it. Defaults to four ms. */
    maxMilliseconds?: number;
    signal?: AbortSignal;
    onProgress?(progress: WarmupProgress): void;
}
export interface WarmupLease {
    readonly progress: WarmupProgress;
    readonly released: boolean;
    /** Release residency protection, not the borrowed CPU resources. */
    release(): void;
}
/** Snapshot descriptors, then upload/compile one typed resource at a time. */
export declare function warmupScene(renderer: Renderer, scene: Scene, options?: WarmupOptions, visibleOnly?: boolean): Promise<WarmupLease>;
