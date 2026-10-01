import { GameObject } from './game-object.js';
import { Object3D } from './object3d.js';
import { SceneObject } from './scene-object.js';

export interface FactoryContext<Services = void> {
  readonly services: Services;
  readonly signal: AbortSignal;
  readonly id: string | undefined;
  /** Only aliases explicitly declared by this content node are available. */
  reference(alias: string): SceneObject;
  /** Claim a fresh detached prefab and its owned descendants before awaiting fallible work. */
  own<Node extends SceneObject>(node: Node): Node;
}

export interface FactoryDefinition<
  Options,
  Node extends SceneObject,
  Services = void,
> {
  /** Must reject invalid options by throwing; no unchecked JSON-to-options cast. */
  parse(value: unknown): Options;
  /** Return a fresh detached prefab; borrowed resources remain caller-owned. */
  create(
    options: Options,
    context: FactoryContext<Services>,
  ): Node | Promise<Node>;
}

export type FactoryDefinitions = Readonly<
  Record<string, FactoryDefinition<unknown, SceneObject, never>>
>;
export type FactoryOptions<Definition> = Definition extends {
  parse(value: unknown): infer Options;
}
  ? Options
  : never;
export type FactoryNode<Definition> = Definition extends {
  create(
    ...args: never[]
  ): infer Node extends SceneObject | Promise<SceneObject>;
}
  ? Awaited<Node>
  : never;
type DefinitionServices<Definition> = Definition extends {
  create(options: never, context: FactoryContext<infer Services>): unknown;
}
  ? Services
  : never;
type Intersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Value) => void
  ? Value
  : never;
type ServiceUnion<Definitions extends FactoryDefinitions> = Exclude<
  DefinitionServices<Definitions[keyof Definitions]>,
  void
>;
export type FactoryServices<Definitions extends FactoryDefinitions> = [
  ServiceUnion<Definitions>,
] extends [never]
  ? void
  : Intersection<ServiceUnion<Definitions>>;

export function defineFactory<
  Options,
  Node extends SceneObject,
  Services = void,
>(
  definition: FactoryDefinition<Options, Node, Services>,
): FactoryDefinition<Options, Node, Services> {
  return Object.freeze({ parse: definition.parse, create: definition.create });
}

/** Static named definitions, with explicit parsers rather than reflected constructors. */
export class FactoryRegistry<Definitions extends FactoryDefinitions> {
  readonly definitions: Definitions;

  constructor(definitions: Definitions) {
    const table: Record<
      string,
      FactoryDefinition<unknown, SceneObject, never>
    > = Object.create(null) as Record<
      string,
      FactoryDefinition<unknown, SceneObject, never>
    >;
    for (const kind of Object.keys(definitions)) {
      if (!kind || kind.length > 128)
        throw new RangeError('Factory names must contain 1–128 characters.');
      const definition = definitions[kind];
      if (
        !definition ||
        typeof definition.parse !== 'function' ||
        typeof definition.create !== 'function'
      )
        throw new TypeError(`Invalid factory: ${kind}.`);
      table[kind] = Object.freeze({
        parse: definition.parse,
        create: definition.create,
      });
    }
    this.definitions = Object.freeze(table) as Definitions;
  }

  has(kind: string): kind is Extract<keyof Definitions, string> {
    return Object.hasOwn(this.definitions, kind);
  }

  parse<Kind extends Extract<keyof Definitions, string>>(
    kind: Kind,
    value: unknown,
  ): FactoryOptions<Definitions[Kind]> {
    if (!this.has(kind)) throw new Error(`Unknown factory: ${kind}.`);
    return this.definitions[kind].parse(value) as FactoryOptions<
      Definitions[Kind]
    >;
  }

  async create<Kind extends Extract<keyof Definitions, string>>(
    kind: Kind,
    options: FactoryOptions<Definitions[Kind]>,
    services: DefinitionServices<Definitions[Kind]>,
    signal?: AbortSignal,
  ): Promise<FactoryNode<Definitions[Kind]>> {
    return this.createParsed(kind, this.parse(kind, options), services, {
      signal,
    });
  }

  /** @internal Content validates all options before invoking any constructor. */
  async createParsed<Kind extends Extract<keyof Definitions, string>>(
    kind: Kind,
    options: FactoryOptions<Definitions[Kind]>,
    services: unknown,
    settings: {
      signal?: AbortSignal;
      id?: string;
      reference?: (alias: string) => SceneObject;
    } = {},
  ): Promise<FactoryNode<Definitions[Kind]>> {
    if (!this.has(kind)) throw new Error(`Unknown factory: ${kind}.`);
    const signal = settings.signal ?? new AbortController().signal;
    if (signal.aborted) throw factoryAbortReason(signal);
    const owned = new Set<SceneObject>();
    const roots = new Set<SceneObject>();
    let finished = false;
    const own = <Node extends SceneObject>(node: Node): Node => {
      if (finished) {
        if (!roots.has(node)) {
          const late = new Set<SceneObject>();
          try {
            collectFactoryNodes(node, late);
          } finally {
            destroyFactoryNodes(late);
          }
        }
        throw factoryAbortReason(signal);
      }
      collectFactoryNodes(node, owned);
      roots.add(node);
      if (signal.aborted) {
        destroyFactoryNodes(owned);
        throw factoryAbortReason(signal);
      }
      return node;
    };
    let abort: (() => void) | undefined;
    const cancelled = new Promise<never>((_resolve, reject) => {
      abort = () => reject(factoryAbortReason(signal));
      signal.addEventListener('abort', abort, { once: true });
    });
    const context: FactoryContext<DefinitionServices<Definitions[Kind]>> = {
      services: services as DefinitionServices<Definitions[Kind]>,
      signal,
      id: settings.id,
      own,
      reference:
        settings.reference ??
        (() => {
          throw new Error('No content references are declared.');
        }),
    };
    const definition = this.definitions[kind] as unknown as FactoryDefinition<
      FactoryOptions<Definitions[Kind]>,
      SceneObject,
      DefinitionServices<Definitions[Kind]>
    >;
    const task = Promise.resolve()
      .then(() => {
        if (signal.aborted) throw factoryAbortReason(signal);
        return definition.create(options, context);
      })
      .then((node) => {
        own(node);
        if (roots.size !== 1 || !roots.has(node))
          throw new Error(
            'A factory must return its only claimed prefab root.',
          );
        return node as FactoryNode<Definitions[Kind]>;
      });
    try {
      return await Promise.race([task, cancelled]);
    } catch (error) {
      finished = true;
      try {
        destroyFactoryNodes(owned);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Factory creation and cleanup failed.',
          { cause: cleanupError },
        );
      }
      throw error;
    } finally {
      finished = true;
      if (abort) signal.removeEventListener('abort', abort);
    }
  }
}

/** @internal Claim only fresh members; validation failure never claims a borrowed descendant. */
export function collectFactoryNodes(
  root: SceneObject,
  owned: Set<SceneObject>,
): void {
  if ((root instanceof GameObject || root instanceof Object3D) && root.parent)
    throw new Error('A factory prefab root must be detached.');
  const pending: SceneObject[] = [root];
  const seen = new Set<SceneObject>();
  for (let index = 0; index < pending.length; index++) {
    const node = pending[index];
    if (
      !(node instanceof SceneObject) ||
      node.destroyed ||
      node.scene ||
      node.registrationGeneration !== 0
    )
      throw new Error(
        'A factory must return fresh, never-scene-owned objects.',
      );
    if (seen.has(node))
      throw new Error('Factory prefab contains duplicate identity or a cycle.');
    seen.add(node);
    owned.add(node);
    if (node instanceof GameObject || node instanceof Object3D) {
      for (const child of node.children) {
        if (child.parent !== node)
          throw new Error('Factory prefab has inconsistent parent ownership.');
        pending.push(child);
      }
    }
  }
}

/** @internal Never recursively dispose unclaimed descendants or borrowed resources. */
export function destroyFactoryNodes(nodes: ReadonlySet<SceneObject>): void {
  const owned = new Set(nodes);
  // Include fresh descendants created after context.own, but never previously owned objects.
  for (const node of owned)
    if (node instanceof GameObject || node instanceof Object3D)
      for (const child of node.children)
        if (
          !child.scene &&
          !child.destroyed &&
          child.registrationGeneration === 0
        )
          owned.add(child);
  for (const node of owned) {
    if (node instanceof GameObject || node instanceof Object3D) {
      if (node.parent && !owned.has(node.parent)) node.detachParent();
      for (const child of node.children)
        if (!owned.has(child)) child.detachParent();
    }
  }
  const errors: unknown[] = [];
  for (const node of owned) {
    try {
      node.destroy();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length)
    throw new AggregateError(errors, 'Factory node cleanup failed.');
}

/** @internal */
export function factoryAbortReason(signal: AbortSignal): unknown {
  return (
    signal.reason ??
    new DOMException('Content construction cancelled.', 'AbortError')
  );
}
