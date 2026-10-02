import type { ResourcePool } from '../../assets/src/resource-scope.js';
import { subscribeLoad } from '../../assets/src/preload/subscribe-load.js';
import { ContentScene, rebuildContentScene } from './content.js';
import type {
  FactoryDefinitions,
  FactoryRegistry,
  FactoryServices,
} from './factories.js';
import type { Scene } from './scene.js';
import {
  assertJsonValue,
  type SaveLoadResult,
  type SaveManager,
  type SaveRecord,
} from './storage.js';

export interface ContentPublicationHost<
  Definitions extends FactoryDefinitions,
> {
  readonly destroyed: boolean;
  /** Changes when any scene publication/preparation supersedes this load. */
  readonly revision: number;
  readonly scene: Scene | undefined;
  /** Optional owner lifetime; otherwise the owner must destroy its coordinators on teardown. */
  readonly signal?: AbortSignal;
  /** Atomically reject a stale revision/aborted signal before taking ownership. */
  publish(
    candidate: ContentScene<Definitions>,
    signal: AbortSignal,
    expectedRevision: number,
  ): Promise<void>;
}

export type ContentLoadResult<Definitions extends FactoryDefinitions> =
  | Exclude<SaveLoadResult, { status: 'loaded' }>
  | {
      status: 'loaded';
      record: SaveRecord;
      content: ContentScene<Definitions>;
    };

interface PendingContent<Definitions extends FactoryDefinitions> {
  readonly controller: AbortController;
  candidate?: ContentScene<Definitions>;
  cleanupError?: unknown;
}

/** SaveManager migration → fresh factory candidate → complete restoration → guarded publication.
 * Live scene state is never restored in place. Factories/adapters must confine writes to their
 * candidate; arbitrary asynchronous external side effects cannot be rolled back by this API. */
export class ContentLoadCoordinator<Definitions extends FactoryDefinitions> {
  private pending?: PendingContent<Definitions>;
  private disposed = false;

  constructor(
    private readonly registry: FactoryRegistry<Definitions>,
    private readonly services: FactoryServices<Definitions>,
    private readonly resources: ResourcePool,
    private readonly host: ContentPublicationHost<Definitions>,
  ) {}

  async save(
    saves: SaveManager,
    slot: string,
    content: ContentScene<Definitions>,
    playTime = 0,
  ): Promise<SaveRecord> {
    if (this.disposed || this.host.destroyed)
      throw new DOMException('Content owner is destroyed.', 'AbortError');
    const snapshot: unknown = content.capture();
    assertJsonValue(snapshot);
    return saves.save(slot, snapshot, playTime);
  }

  async load(
    saves: SaveManager,
    slot: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<ContentLoadResult<Definitions>> {
    if (this.disposed || this.host.destroyed)
      throw new DOMException('Content owner is destroyed.', 'AbortError');
    this.cancel(new DOMException('Content load was superseded.', 'AbortError'));
    const pending: PendingContent<Definitions> = {
      controller: new AbortController(),
    };
    this.pending = pending;
    const signals = [pending.controller.signal];
    if (options.signal) signals.push(options.signal);
    if (this.host.signal) signals.push(this.host.signal);
    const signal = AbortSignal.any(signals);
    const revision = this.host.revision;
    const assertCurrent = () => {
      signal.throwIfAborted();
      if (
        this.disposed ||
        this.host.destroyed ||
        this.pending !== pending ||
        this.host.revision !== revision
      )
        throw new DOMException(
          'Content publication was superseded.',
          'AbortError',
        );
    };
    const cancelCandidate = () => {
      if (!pending.candidate || this.host.scene === pending.candidate.scene)
        return;
      try {
        pending.candidate.destroy();
      } catch (error) {
        pending.cleanupError = error;
      }
    };
    signal.addEventListener('abort', cancelCandidate, { once: true });
    try {
      assertCurrent();
      const loaded = await subscribeLoad(saves.load(slot), signal);
      assertCurrent();
      if (loaded.status !== 'loaded') return loaded;
      const candidate = await rebuildContentScene(
        this.registry,
        loaded.record.data,
        this.services,
        { signal, resourcePool: this.resources },
      );
      pending.candidate = candidate;
      assertCurrent();
      // The host owns the atomic preparation/publication barrier; do not race cleanup against it.
      await this.host.publish(candidate, signal, revision);
      signal.throwIfAborted();
      if (this.host.destroyed || this.host.scene !== candidate.scene)
        throw new DOMException(
          'Content candidate was not published.',
          'AbortError',
        );
      return { status: 'loaded', record: loaded.record, content: candidate };
    } catch (error) {
      if (pending.cleanupError !== undefined)
        throw new AggregateError(
          [error, pending.cleanupError],
          'Content cancellation and cleanup failed.',
          { cause: error },
        );
      const candidate = pending.candidate;
      if (candidate && this.host.scene !== candidate.scene) {
        try {
          candidate.destroy();
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            'Content load and candidate cleanup failed.',
            { cause: cleanupError },
          );
        }
      }
      throw error;
    } finally {
      if (this.pending === pending) this.pending = undefined;
      signal.removeEventListener('abort', cancelCandidate);
    }
  }

  cancel(
    reason: unknown = new DOMException(
      'Content load was cancelled.',
      'AbortError',
    ),
  ): void {
    const pending = this.pending;
    if (!pending) return;
    pending.controller.abort(reason);
  }

  /** The Game owner calls this during destruction, including while a migration/factory is pending. */
  destroy(): void {
    this.disposed = true;
    this.cancel(new DOMException('Content owner is destroyed.', 'AbortError'));
  }
}
