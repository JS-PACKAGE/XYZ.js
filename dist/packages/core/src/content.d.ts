import { FactoryRegistry } from './factories.js';
import type { FactoryDefinitions, FactoryNode, FactoryOptions, FactoryServices } from './factories.js';
import { Scene } from './scene.js';
import { SceneObject } from './scene-object.js';
import { Serializer } from './serialization.js';
export type ContentNodeDefinition<Definitions extends FactoryDefinitions> = {
    [Kind in Extract<keyof Definitions, string>]: {
        readonly id: string;
        readonly kind: Kind;
        readonly options: FactoryOptions<Definitions[Kind]>;
        readonly parent?: string;
        readonly references?: Readonly<Record<string, string>>;
    };
}[Extract<keyof Definitions, string>];
export interface ContentSceneDefinition<Definitions extends FactoryDefinitions> {
    readonly version: 1;
    readonly nodes: readonly ContentNodeDefinition<Definitions>[];
}
export interface ContentBuildOptions {
    readonly signal?: AbortSignal;
}
type NodeAt<Definitions extends FactoryDefinitions, Definition extends ContentSceneDefinition<Definitions>, Id extends string> = FactoryNode<Definitions[Extract<Definition['nodes'][number], {
    readonly id: Id;
}>['kind']]>;
/** A built, unpublished Scene. Game.setScene remains the only publication API. */
export declare class ContentScene<Definitions extends FactoryDefinitions, Definition extends ContentSceneDefinition<Definitions> = ContentSceneDefinition<Definitions>> {
    readonly scene: Scene;
    private readonly entries;
    readonly serializer: Serializer;
    constructor(scene: Scene, entries: ReadonlyMap<string, {
        kind: string;
        node: SceneObject;
    }>);
    get<Id extends Definition['nodes'][number]['id']>(id: Id): NodeAt<Definitions, Definition, Id> | undefined;
    /** Runtime kind check narrows dynamic JSON IDs without an unchecked cast. */
    require<Kind extends Extract<keyof Definitions, string>>(id: string, kind: Kind): FactoryNode<Definitions[Kind]>;
}
/** Validates unknown JSON and every factory's options before construction starts. */
export declare function parseContentScene<Definitions extends FactoryDefinitions>(registry: FactoryRegistry<Definitions>, value: unknown): ContentSceneDefinition<Definitions>;
/** Construct off the active Game; failure owns only the new leaves, never service assets. */
export declare function buildContentScene<Definitions extends FactoryDefinitions, const Definition extends ContentSceneDefinition<Definitions>>(registry: FactoryRegistry<Definitions>, definition: Definition, services: FactoryServices<Definitions>, options?: ContentBuildOptions): Promise<ContentScene<Definitions, Definition>>;
export {};
