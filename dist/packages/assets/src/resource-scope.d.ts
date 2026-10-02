import type { AssetLoader, Texture } from './index.js';
export type ResourceOwnership = 'owned' | 'borrowed';
export type ResourceKind = 'texture' | 'model' | 'font' | 'audio' | 'custom';
export interface ResourceLoadContext<T> {
    /** Claim the owned result before awaiting fallible work, so failure/abort can reclaim it. */
    own(value: T): T;
}
/** Share the same request object to share one acquisition across scopes. */
export interface ResourceRequest<T> {
    readonly kind: ResourceKind;
    readonly ownership: ResourceOwnership;
    readonly load: (signal: AbortSignal, context: ResourceLoadContext<T>) => T | Promise<T>;
    /** Required for owned resources; never called for borrowed resources. */
    readonly dispose?: (value: T) => void;
}
/** A handle owns its consumer bindings, not other handles' consumers. */
export declare class ResourceLease<T> {
    readonly value: T;
    readonly ownership: ResourceOwnership;
    private readonly relinquish;
    private disposed;
    private releasing;
    private readonly consumers;
    private retired?;
    constructor(value: T, ownership: ResourceOwnership, relinquish: () => void);
    get released(): boolean;
    /** @internal A scope forgets handles immediately after release, including disposal errors. */
    observeRelease(callback: () => void): void;
    /** Register synchronous detachment (remove a node, stop a voice, clear a binding). */
    attach(detach: () => void): () => void;
    release(): void;
}
/** Game-local owner. Texture work uses AssetLoader's existing decoded cache and leases. */
export declare class ResourcePool {
    readonly loader: AssetLoader;
    private readonly entries;
    private readonly scopes;
    private disposed;
    constructor(loader: AssetLoader);
    get destroyed(): boolean;
    createScope(options?: {
        signal?: AbortSignal;
    }): ResourceScope;
    /** @internal Pending subscribers count as references and cancel independently. */
    acquire<T>(request: ResourceRequest<T>, signal: AbortSignal): Promise<ResourceLease<T>>;
    /** Detach scope consumers before releasing any owned acquisition; loader remains caller-owned. */
    destroy(): void;
}
/** Scene/candidate-local lifetime, including rollback for late non-cooperative results. */
export declare class ResourceScope {
    readonly pool: ResourcePool;
    private readonly ownerSignal?;
    private readonly onRelease?;
    private readonly controller;
    private readonly leases;
    private readonly children;
    private readonly consumers;
    private disposed;
    private completed;
    private releasing;
    private parent?;
    private readonly abortOwner;
    /** @internal Create through ResourcePool.createScope or fork. */
    constructor(pool: ResourcePool, ownerSignal?: AbortSignal | undefined, onRelease?: (() => void) | undefined);
    get signal(): AbortSignal;
    get destroyed(): boolean;
    fork(options?: {
        signal?: AbortSignal;
    }): ResourceScope;
    /** Bind candidate teardown before releasing its acquisitions, including pending results. */
    attach(detach: () => void): () => void;
    /** Cancel acquisitions without tearing down consumers; the owner releases after node disposal. */
    cancelPending(reason?: unknown): void;
    acquire<T>(request: ResourceRequest<T>, options?: {
        signal?: AbortSignal;
    }): Promise<ResourceLease<T>>;
    acquireTexture(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<ResourceLease<Texture>>;
    own<T>(value: T, dispose: (value: T) => void): ResourceLease<T>;
    borrow<T>(value: T): ResourceLease<T>;
    /** Register leases with consumers before use; release detaches them before the last disposal. */
    release(reason?: unknown): void;
    private assertLive;
    private accept;
}
