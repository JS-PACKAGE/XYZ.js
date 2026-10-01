import { FactoryRegistry } from './factories.js';
import type { FactoryDefinitions, FactoryNode, FactoryOptions, FactoryServices } from './factories.js';
import { Scene } from './scene.js';
import { SceneObject } from './scene-object.js';
import { Serializer, type Serializable, type SceneSnapshot } from './serialization.js';
export type ContentNodeDefinition<Definitions extends FactoryDefinitions> = {
    [Kind in Extract<keyof Definitions, string>]: {
        readonly id: string;
        readonly kind: Kind;
        readonly options: FactoryOptions<Definitions[Kind]>;
        readonly parent?: string;
        readonly references?: Readonly<Record<string, string>>;
        /** Factory-authored child alias to globally stable ID, including removed aliases. */
        readonly children?: Readonly<Record<string, string>>;
        readonly removedChildren?: readonly string[];
    };
}[Extract<keyof Definitions, string>];
export interface ContentSceneDefinition<Definitions extends FactoryDefinitions> {
    readonly version: 1;
    readonly nodes: readonly ContentNodeDefinition<Definitions>[];
}
export interface ContentBuildOptions {
    readonly signal?: AbortSignal;
}
export interface ContentSnapshot<Definitions extends FactoryDefinitions = FactoryDefinitions> {
    readonly version: 1;
    readonly content: ContentSceneDefinition<Definitions>;
    readonly state: SceneSnapshot;
    /** Exact current hierarchy for every stable ID, including factory prefab members. */
    readonly parents: Readonly<Record<string, string | null>>;
}
interface ContentEntry {
    kind: string;
    node: SceneObject;
    rootId: string;
    alias?: string;
    state: Serializable;
    unregister?: () => void;
}
type NodeAt<Definitions extends FactoryDefinitions, Definition extends ContentSceneDefinition<Definitions>, Id extends string> = FactoryNode<Definitions[Extract<Definition['nodes'][number], {
    readonly id: Id;
}>['kind']]>;
/** A built Scene, including an explicit factory-authored topology ledger. Publish with Game.setScene. */
export declare class ContentScene<Definitions extends FactoryDefinitions, Definition extends ContentSceneDefinition<Definitions> = ContentSceneDefinition<Definitions>> {
    readonly scene: Scene;
    private readonly entries;
    private readonly definitions;
    private readonly owned;
    private readonly registry;
    private readonly services;
    readonly serializer: Serializer;
    private mutating;
    constructor(scene: Scene, entries: Map<string, ContentEntry>, definitions: Map<string, ContentNodeDefinition<Definitions>>, owned: Set<SceneObject>, registry: FactoryRegistry<Definitions>, services: FactoryServices<Definitions>);
    get<Id extends Definition['nodes'][number]['id']>(id: Id): NodeAt<Definitions, Definition, Id> | undefined;
    /** Runtime IDs (including prefab children) without pretending their subtype is known. */
    getById(id: string): SceneObject | undefined;
    require<Kind extends Extract<keyof Definitions, string>>(id: string, kind: Kind): FactoryNode<Definitions[Kind]>;
    capture(): ContentSnapshot<Definitions>;
    /** Create one authored dynamic prefab; existing IDs are available only through declared aliases. */
    spawn<const Node extends ContentNodeDefinition<Definitions>>(definition: Node, options?: ContentBuildOptions): Promise<FactoryNode<Definitions[Node['kind']]>>;
    /** Dispose only content-owned nodes. Surviving explicit references must be removed first. */
    remove(id: string): boolean;
    /** Used for an unpublished candidate on rebuild failure; foreign nodes are never destroyed. */
    destroy(): void;
}
/** Validates unknown JSON and every factory's options before construction starts. */
export declare function parseContentScene<Definitions extends FactoryDefinitions>(registry: FactoryRegistry<Definitions>, value: unknown): ContentSceneDefinition<Definitions>;
/** Construct off the active Game; failure owns only new nodes, never service assets. */
export declare function buildContentScene<Definitions extends FactoryDefinitions, const Definition extends ContentSceneDefinition<Definitions>>(registry: FactoryRegistry<Definitions>, definition: Definition, services: FactoryServices<Definitions>, options?: ContentBuildOptions): Promise<ContentScene<Definitions, Definition>>;
/** Recreate an unpublished candidate from JSON topology, then restore every stable-ID state. */
export declare function rebuildContentScene<Definitions extends FactoryDefinitions>(registry: FactoryRegistry<Definitions>, value: unknown, services: FactoryServices<Definitions>, options?: ContentBuildOptions): Promise<ContentScene<Definitions>>;
export {};
