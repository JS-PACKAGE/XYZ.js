import { SceneObject } from './scene-object.js';
import type { Serializable } from './serialization.js';
export interface FactoryContext<Services = void> {
    readonly services: Services;
    readonly signal: AbortSignal;
    readonly id: string | undefined;
    /** Only aliases explicitly declared by this content node are available. */
    reference(alias: string): SceneObject;
    /** Claim a fresh detached prefab and its owned descendants before awaiting fallible work. */
    own<Node extends SceneObject>(node: Node): Node;
}
export interface FactoryDefinition<Options, Node extends SceneObject, Services = void> {
    /** Must reject invalid options by throwing; no unchecked JSON-to-options cast. */
    parse(value: unknown): Options;
    /** Return a fresh detached prefab; borrowed resources remain caller-owned. */
    create(options: Options, context: FactoryContext<Services>): Node | Promise<Node>;
    /** Explicit stable names for every prefab descendant included in content saves. */
    children?(node: Node): Readonly<Record<string, SceneObject>>;
    /** Explicit adapter for the root or a named prefab member; omitted uses built-in 2D/3D state. */
    state?(node: Node, member: SceneObject): Serializable;
}
export type FactoryDefinitions = Readonly<Record<string, FactoryDefinition<unknown, SceneObject, never>>>;
export type FactoryOptions<Definition> = Definition extends {
    parse(value: unknown): infer Options;
} ? Options : never;
export type FactoryNode<Definition> = Definition extends {
    create(...args: never[]): infer Node extends SceneObject | Promise<SceneObject>;
} ? Awaited<Node> : never;
type DefinitionServices<Definition> = Definition extends {
    create(options: never, context: FactoryContext<infer Services>): unknown;
} ? Services : never;
type Intersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (value: infer Value) => void ? Value : never;
type ServiceUnion<Definitions extends FactoryDefinitions> = Exclude<DefinitionServices<Definitions[keyof Definitions]>, void>;
export type FactoryServices<Definitions extends FactoryDefinitions> = [
    ServiceUnion<Definitions>
] extends [never] ? void : Intersection<ServiceUnion<Definitions>>;
export declare function defineFactory<Options, Node extends SceneObject, Services = void>(definition: FactoryDefinition<Options, Node, Services>): FactoryDefinition<Options, Node, Services>;
/** Static named definitions, with explicit parsers rather than reflected constructors. */
export declare class FactoryRegistry<Definitions extends FactoryDefinitions> {
    readonly definitions: Definitions;
    constructor(definitions: Definitions);
    has(kind: string): kind is Extract<keyof Definitions, string>;
    parse<Kind extends Extract<keyof Definitions, string>>(kind: Kind, value: unknown): FactoryOptions<Definitions[Kind]>;
    create<Kind extends Extract<keyof Definitions, string>>(kind: Kind, options: FactoryOptions<Definitions[Kind]>, services: DefinitionServices<Definitions[Kind]>, signal?: AbortSignal): Promise<FactoryNode<Definitions[Kind]>>;
    /** @internal Content validates all options before invoking any constructor. */
    createParsed<Kind extends Extract<keyof Definitions, string>>(kind: Kind, options: FactoryOptions<Definitions[Kind]>, services: unknown, settings?: {
        signal?: AbortSignal;
        id?: string;
        reference?: (alias: string) => SceneObject;
    }): Promise<FactoryNode<Definitions[Kind]>>;
}
/** @internal Claim only fresh members; validation failure never claims a borrowed descendant. */
export declare function collectFactoryNodes(root: SceneObject, owned: Set<SceneObject>): void;
/** @internal Never recursively dispose unclaimed descendants or borrowed resources. */
export declare function destroyFactoryNodes(nodes: ReadonlySet<SceneObject>, includeFresh?: boolean): void;
/** @internal */
export declare function factoryAbortReason(signal: AbortSignal): unknown;
export {};
