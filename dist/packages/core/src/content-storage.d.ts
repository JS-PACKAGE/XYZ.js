import type { ResourcePool } from '../../assets/src/resource-scope.js';
import { ContentScene } from './content.js';
import type { FactoryDefinitions, FactoryRegistry, FactoryServices } from './factories.js';
import type { Scene } from './scene.js';
import { type SaveLoadResult, type SaveManager, type SaveRecord, type SaveReadOptions, type SaveWriteOptions, type SaveRecovery } from './storage.js';
export interface ContentPublicationHost<Definitions extends FactoryDefinitions> {
    readonly destroyed: boolean;
    /** Changes when any scene publication/preparation supersedes this load. */
    readonly revision: number;
    readonly scene: Scene | undefined;
    /** Optional owner lifetime; otherwise the owner must destroy its coordinators on teardown. */
    readonly signal?: AbortSignal;
    /** Atomically reject a stale revision/aborted signal before taking ownership. */
    publish(candidate: ContentScene<Definitions>, signal: AbortSignal, expectedRevision: number): Promise<void>;
}
export type ContentLoadResult<Definitions extends FactoryDefinitions> = Exclude<SaveLoadResult, {
    status: 'loaded';
}> | {
    status: 'loaded';
    record: SaveRecord;
    recovery?: SaveRecovery;
    content: ContentScene<Definitions>;
};
/** SaveManager migration → fresh factory candidate → complete restoration → guarded publication.
 * Live scene state is never restored in place. Factories/adapters must confine writes to their
 * candidate; arbitrary asynchronous external side effects cannot be rolled back by this API. */
export declare class ContentLoadCoordinator<Definitions extends FactoryDefinitions> {
    private readonly registry;
    private readonly services;
    private readonly resources;
    private readonly host;
    private pending?;
    private disposed;
    private readonly lifetime;
    constructor(registry: FactoryRegistry<Definitions>, services: FactoryServices<Definitions>, resources: ResourcePool, host: ContentPublicationHost<Definitions>);
    save(saves: SaveManager, slot: string, content: ContentScene<Definitions>, playTime?: number, options?: SaveWriteOptions): Promise<SaveRecord>;
    load(saves: SaveManager, slot: string, options?: SaveReadOptions): Promise<ContentLoadResult<Definitions>>;
    cancel(reason?: unknown): void;
    /** The Game owner calls this during destruction, including while a migration/factory is pending. */
    destroy(): void;
}
