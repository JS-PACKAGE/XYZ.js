import type { AssetLoader, Texture } from './index.js';
import { AssetError } from './texture.js';
import { subscribeLoad } from './preload/subscribe-load.js';

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
  readonly load: (
    signal: AbortSignal,
    context: ResourceLoadContext<T>,
  ) => T | Promise<T>;
  /** Required for owned resources; never called for borrowed resources. */
  readonly dispose?: (value: T) => void;
}

/** A handle owns its consumer bindings, not other handles' consumers. */
export class ResourceLease<T> {
  private disposed = false;
  private releasing = false;
  private readonly consumers = new Set<() => void>();
  private retired?: () => void;

  constructor(
    readonly value: T,
    readonly ownership: ResourceOwnership,
    private readonly relinquish: () => void,
  ) {}

  get released(): boolean {
    return this.disposed;
  }

  /** @internal A scope forgets handles immediately after release, including disposal errors. */
  observeRelease(callback: () => void): void {
    this.retired = callback;
  }

  /** Register synchronous detachment (remove a node, stop a voice, clear a binding). */
  attach(detach: () => void): () => void {
    if (this.disposed || this.releasing)
      throw new AssetError('Cannot bind a released resource handle.');
    if (typeof detach !== 'function')
      throw new TypeError('A detach callback is required.');
    this.consumers.add(detach);
    return () => {
      if (!this.consumers.has(detach)) return;
      detach();
      this.consumers.delete(detach);
    };
  }

  release(): void {
    if (this.disposed || this.releasing) return;
    this.releasing = true;
    const errors: unknown[] = [];
    try {
      for (const detach of this.consumers) {
        try {
          detach();
          this.consumers.delete(detach);
        } catch (error) {
          errors.push(error);
        }
      }
      // Retain the resource when a consumer could not detach; retrying release is safe.
      if (errors.length)
        throw new AggregateError(
          errors,
          'Resource consumers failed to detach.',
        );
      this.disposed = true;
      this.relinquish();
    } finally {
      if (this.disposed) {
        this.retired?.();
        this.retired = undefined;
      }
      this.releasing = false;
    }
  }
}

interface SharedResource {
  readonly controller: AbortController;
  readonly promise: Promise<unknown>;
  readonly ownership: ResourceOwnership;
  readonly dispose?: (value: unknown) => void;
  references: number;
  ready: boolean;
  value?: unknown;
  disposed: boolean;
}

/** Game-local owner. Texture work uses AssetLoader's existing decoded cache and leases. */
export class ResourcePool {
  private readonly entries = new Map<
    ResourceRequest<unknown>,
    SharedResource
  >();
  private readonly scopes = new Set<ResourceScope>();
  private disposed = false;

  constructor(readonly loader: AssetLoader) {}

  get destroyed(): boolean {
    return this.disposed;
  }

  createScope(options: { signal?: AbortSignal } = {}): ResourceScope {
    if (this.disposed) throw new AssetError('ResourcePool is destroyed.');
    const scope = new ResourceScope(this, options.signal, () =>
      this.scopes.delete(scope),
    );
    this.scopes.add(scope);
    if (options.signal?.aborted) scope.release(options.signal.reason);
    return scope;
  }

  /** @internal Pending subscribers count as references and cancel independently. */
  async acquire<T>(
    request: ResourceRequest<T>,
    signal: AbortSignal,
  ): Promise<ResourceLease<T>> {
    signal.throwIfAborted();
    if (this.disposed) throw new AssetError('ResourcePool is destroyed.');
    if (
      !request ||
      !['texture', 'model', 'font', 'audio', 'custom'].includes(request.kind) ||
      !['owned', 'borrowed'].includes(request.ownership) ||
      typeof request.load !== 'function' ||
      (request.ownership === 'owned' && typeof request.dispose !== 'function')
    )
      throw new TypeError('Invalid resource acquisition.');
    const key = request as unknown as ResourceRequest<unknown>;
    let entry = this.entries.get(key);
    if (!entry) {
      const controller = new AbortController();
      const ownership = request.ownership;
      const dispose = request.dispose;
      const load = request.load;
      const fresh: SharedResource = {
        controller,
        ownership,
        dispose: dispose as ((value: unknown) => void) | undefined,
        references: 0,
        ready: false,
        disposed: false,
        promise: Promise.resolve()
          .then(() => {
            controller.signal.throwIfAborted();
            return load(controller.signal, {
              own(value) {
                if (ownership !== 'owned')
                  throw new AssetError(
                    'Borrowed acquisitions cannot claim ownership.',
                  );
                if (fresh.ready && fresh.value !== value)
                  throw new AssetError(
                    'An acquisition may claim only its returned resource.',
                  );
                fresh.ready = true;
                fresh.value = value;
                if (controller.signal.aborted) {
                  if (!fresh.disposed) {
                    fresh.disposed = true;
                    dispose!(value);
                  }
                  throw controller.signal.reason;
                }
                return value;
              },
            });
          })
          .then((value) => {
            if (fresh.ready && fresh.value !== value) {
              if (ownership === 'owned') dispose!(value);
              throw new AssetError(
                'Acquisition returned a different resource than it claimed.',
              );
            }
            fresh.ready = true;
            fresh.value = value;
            if (controller.signal.aborted || !fresh.references) {
              if (!fresh.disposed) {
                fresh.disposed = true;
                if (ownership === 'owned') dispose!(value);
              }
              throw (
                controller.signal.reason ??
                new AssetError('Resource acquisition was cancelled.')
              );
            }
            return value;
          })
          .catch((error: unknown) => {
            if (this.entries.get(key) === fresh) this.entries.delete(key);
            if (fresh.ready && !fresh.disposed) {
              fresh.disposed = true;
              if (ownership === 'owned') dispose!(fresh.value as T);
            }
            throw error;
          }),
      };
      this.entries.set(key, fresh);
      entry = fresh;
    }
    entry.references++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      entry.references--;
      if (entry.references) return;
      if (this.entries.get(key) === entry) this.entries.delete(key);
      entry.controller.abort(
        new AssetError('Last resource borrower released.'),
      );
      if (entry.ready && !entry.disposed) {
        entry.disposed = true;
        if (entry.ownership === 'owned') entry.dispose!(entry.value);
      }
    };
    try {
      const value = (await subscribeLoad(entry.promise, signal)) as T;
      signal.throwIfAborted();
      return new ResourceLease(value, entry.ownership, release);
    } catch (error) {
      try {
        release();
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Resource acquisition and cleanup failed.',
          { cause: cleanupError },
        );
      }
      throw error;
    }
  }

  /** Detach scope consumers before releasing any owned acquisition; loader remains caller-owned. */
  destroy(): void {
    this.disposed = true;
    const errors: unknown[] = [];
    for (const scope of this.scopes) {
      try {
        scope.release();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'ResourcePool cleanup failed.');
  }
}

/** Scene/candidate-local lifetime, including rollback for late non-cooperative results. */
export class ResourceScope {
  private readonly controller = new AbortController();
  private readonly leases = new Set<ResourceLease<unknown>>();
  private readonly children = new Set<ResourceScope>();
  private readonly consumers = new Set<() => void>();
  private disposed = false;
  private completed = false;
  private releasing = false;
  private parent?: ResourceScope;
  private readonly abortOwner: () => void;

  /** @internal Create through ResourcePool.createScope or fork. */
  constructor(
    readonly pool: ResourcePool,
    private readonly ownerSignal?: AbortSignal,
    private readonly onRelease?: () => void,
  ) {
    this.abortOwner = () => {
      try {
        this.release(ownerSignal?.reason);
      } catch {
        // EventTarget cannot propagate teardown errors; retained bindings make pool/release retry report them.
      }
    };
    ownerSignal?.addEventListener('abort', this.abortOwner, { once: true });
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }
  get destroyed(): boolean {
    return this.disposed;
  }

  fork(options: { signal?: AbortSignal } = {}): ResourceScope {
    this.assertLive();
    const child = this.pool.createScope(options);
    if (!child.destroyed) {
      this.children.add(child);
      child.parent = this;
    }
    return child;
  }

  /** Bind candidate teardown before releasing its acquisitions, including pending results. */
  attach(detach: () => void): () => void {
    this.assertLive();
    if (typeof detach !== 'function')
      throw new TypeError('A detach callback is required.');
    this.consumers.add(detach);
    return () => {
      if (!this.consumers.has(detach)) return;
      detach();
      this.consumers.delete(detach);
    };
  }

  /** Cancel acquisitions without tearing down consumers; the owner releases after node disposal. */
  cancelPending(
    reason: unknown = new AssetError('Resource acquisitions were cancelled.'),
  ): void {
    this.controller.abort(reason);
    for (const child of this.children) child.cancelPending(reason);
  }

  async acquire<T>(
    request: ResourceRequest<T>,
    options: { signal?: AbortSignal } = {},
  ): Promise<ResourceLease<T>> {
    this.assertLive();
    const signal = options.signal
      ? AbortSignal.any([this.signal, options.signal])
      : this.signal;
    const lease = await this.pool.acquire(request, signal);
    return this.accept(lease);
  }

  async acquireTexture(
    url: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<ResourceLease<Texture>> {
    this.assertLive();
    const signal = options.signal
      ? AbortSignal.any([this.signal, options.signal])
      : this.signal;
    const texture = await this.pool.loader.acquireTexture(url, { signal });
    return this.accept(
      new ResourceLease(texture.texture, 'borrowed', () => texture.release()),
    );
  }

  own<T>(value: T, dispose: (value: T) => void): ResourceLease<T> {
    this.assertLive();
    if (typeof dispose !== 'function')
      throw new TypeError('An owned resource requires disposal.');
    return this.accept(new ResourceLease(value, 'owned', () => dispose(value)));
  }

  borrow<T>(value: T): ResourceLease<T> {
    this.assertLive();
    return this.accept(new ResourceLease(value, 'borrowed', () => {}));
  }

  /** Register leases with consumers before use; release detaches them before the last disposal. */
  release(
    reason: unknown = new AssetError('ResourceScope was released.'),
  ): void {
    if (this.completed || this.releasing) return;
    this.releasing = true;
    this.disposed = true;
    this.ownerSignal?.removeEventListener('abort', this.abortOwner);
    const errors: unknown[] = [];
    for (const detach of this.consumers) {
      try {
        detach();
        this.consumers.delete(detach);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) {
      this.releasing = false;
      throw new AggregateError(
        errors,
        'ResourceScope consumers failed to detach.',
      );
    }
    for (const child of this.children) {
      try {
        child.release(reason);
        if (child.completed) this.children.delete(child);
      } catch (error) {
        errors.push(error);
      }
    }
    if (this.children.size || errors.length) {
      this.releasing = false;
      if (errors.length)
        throw new AggregateError(errors, 'ResourceScope cleanup failed.');
      return;
    }
    for (const lease of this.leases) {
      try {
        lease.release();
        if (lease.released) this.leases.delete(lease);
      } catch (error) {
        errors.push(error);
      }
    }
    this.releasing = false;
    if (!errors.length && !this.children.size && !this.leases.size) {
      this.completed = true;
      this.controller.abort(reason);
      this.parent?.children.delete(this);
      this.onRelease?.();
    }
    if (errors.length)
      throw new AggregateError(errors, 'ResourceScope cleanup failed.');
  }

  private assertLive(): void {
    this.signal.throwIfAborted();
    if (this.disposed || this.pool.destroyed)
      throw new AssetError('ResourceScope is destroyed.');
  }

  private accept<T>(lease: ResourceLease<T>): ResourceLease<T> {
    if (this.completed) {
      lease.release();
      this.assertLive();
    }
    this.leases.add(lease as ResourceLease<unknown>);
    lease.observeRelease(() =>
      this.leases.delete(lease as ResourceLease<unknown>),
    );
    // A failed teardown must retain even a result that arrives after pool destruction.
    if (this.disposed || this.pool.destroyed) this.assertLive();
    return lease;
  }
}
