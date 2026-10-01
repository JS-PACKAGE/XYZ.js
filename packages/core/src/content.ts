import {
  FactoryRegistry,
  collectFactoryNodes,
  destroyFactoryNodes,
  factoryAbortReason,
} from './factories.js';
import type {
  FactoryDefinitions,
  FactoryNode,
  FactoryOptions,
  FactoryServices,
} from './factories.js';
import { GameObject } from './game-object.js';
import { Object3D } from './object3d.js';
import { Scene } from './scene.js';
import { SceneObject } from './scene-object.js';
import { Serializer } from './serialization.js';
import { assertJsonValue } from './storage.js';
import type { JsonValue } from './storage.js';

export type ContentNodeDefinition<Definitions extends FactoryDefinitions> = {
  [Kind in Extract<keyof Definitions, string>]: {
    readonly id: string;
    readonly kind: Kind;
    readonly options: FactoryOptions<Definitions[Kind]>;
    readonly parent?: string;
    readonly references?: Readonly<Record<string, string>>;
  };
}[Extract<keyof Definitions, string>];

export interface ContentSceneDefinition<
  Definitions extends FactoryDefinitions,
> {
  readonly version: 1;
  readonly nodes: readonly ContentNodeDefinition<Definitions>[];
}
export interface ContentBuildOptions {
  readonly signal?: AbortSignal;
}

type NodeAt<
  Definitions extends FactoryDefinitions,
  Definition extends ContentSceneDefinition<Definitions>,
  Id extends string,
> = FactoryNode<
  Definitions[Extract<Definition['nodes'][number], { readonly id: Id }>['kind']]
>;

/** A built, unpublished Scene. Game.setScene remains the only publication API. */
export class ContentScene<
  Definitions extends FactoryDefinitions,
  Definition extends ContentSceneDefinition<Definitions> =
    ContentSceneDefinition<Definitions>,
> {
  readonly serializer: Serializer;
  constructor(
    readonly scene: Scene,
    private readonly entries: ReadonlyMap<
      string,
      { kind: string; node: SceneObject }
    >,
  ) {
    this.serializer = new Serializer(scene);
    for (const [id, { node }] of entries)
      if (node instanceof GameObject) this.serializer.register(id, node);
  }

  get<Id extends Definition['nodes'][number]['id']>(
    id: Id,
  ): NodeAt<Definitions, Definition, Id> | undefined {
    const node = this.entries.get(id)?.node;
    if (!node || node.destroyed || node.scene !== this.scene) return undefined;
    return node as NodeAt<Definitions, Definition, Id>;
  }

  /** Runtime kind check narrows dynamic JSON IDs without an unchecked cast. */
  require<Kind extends Extract<keyof Definitions, string>>(
    id: string,
    kind: Kind,
  ): FactoryNode<Definitions[Kind]> {
    const entry = this.entries.get(id);
    if (
      !entry ||
      entry.kind !== kind ||
      entry.node.destroyed ||
      entry.node.scene !== this.scene
    )
      throw new Error(`Content node ${id} is not a live ${kind}.`);
    return entry.node as FactoryNode<Definitions[Kind]>;
  }
}

/** Finite JSON profile: 4096 nodes, depth 32, 65536 values, 4096-char strings, 128-char keys/IDs. */
function boundedJson(value: unknown): asserts value is JsonValue {
  const pending: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  let count = 0;
  while (pending.length) {
    const item = pending.pop()!;
    if (++count > 65536 || item.depth > 32)
      throw new RangeError('Content exceeds JSON value or depth limits.');
    if (typeof item.value === 'string' && item.value.length > 4096)
      throw new RangeError('Content strings exceed 4096 characters.');
    if (item.value === null || typeof item.value !== 'object') continue;
    if (Array.isArray(item.value) && item.value.length > 4096)
      throw new RangeError('Content arrays exceed 4096 entries.');
    const keys = Reflect.ownKeys(item.value);
    if (keys.length > 4097)
      throw new RangeError('Content objects exceed 4096 properties.');
    for (const key of keys) {
      if (typeof key !== 'string' || key.length > 128)
        throw new RangeError(
          'Content keys must be strings of at most 128 characters.',
        );
      if (Array.isArray(item.value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(item.value, key)!;
      if (!('value' in descriptor))
        throw new TypeError('Content requires JSON data properties.');
      if (count + pending.length >= 65536)
        throw new RangeError('Content exceeds JSON value limits.');
      pending.push({ value: descriptor.value, depth: item.depth + 1 });
    }
  }
  assertJsonValue(value);
}

function contentOrder<Definitions extends FactoryDefinitions>(
  nodes: readonly ContentNodeDefinition<Definitions>[],
): ContentNodeDefinition<Definitions>[] {
  const byId = new Map<string, ContentNodeDefinition<Definitions>>();
  const dependents = new Map<string, string[]>();
  const remaining = new Map<string, number>();
  for (const node of nodes) {
    if (byId.has(node.id)) throw new Error(`Duplicate content ID: ${node.id}.`);
    byId.set(node.id, node);
    dependents.set(node.id, []);
  }
  const ready: ContentNodeDefinition<Definitions>[] = [];
  for (const node of nodes) {
    const dependencies = new Set<string>(Object.values(node.references ?? {}));
    if (node.parent !== undefined) dependencies.add(node.parent);
    remaining.set(node.id, dependencies.size);
    if (!dependencies.size) ready.push(node);
    for (const id of dependencies) {
      const list = dependents.get(id);
      if (!list) throw new Error(`Missing content parent or reference: ${id}.`);
      list.push(node.id);
    }
  }
  for (let index = 0; index < ready.length; index++) {
    for (const id of dependents.get(ready[index].id)!) {
      const count = remaining.get(id)! - 1;
      remaining.set(id, count);
      if (!count) ready.push(byId.get(id)!);
    }
  }
  if (ready.length !== nodes.length)
    throw new Error('Content parent/reference graph contains a cycle.');
  return ready;
}

function validateContent<Definitions extends FactoryDefinitions>(
  registry: FactoryRegistry<Definitions>,
  value: unknown,
): {
  definition: ContentSceneDefinition<Definitions>;
  ordered: ContentNodeDefinition<Definitions>[];
} {
  boundedJson(value);
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value.version !== 1 ||
    !Array.isArray(value.nodes) ||
    Object.keys(value).some((key) => key !== 'version' && key !== 'nodes')
  )
    throw new TypeError('Invalid content scene definition.');
  const nodes: ContentNodeDefinition<Definitions>[] = [];
  for (const raw of value.nodes) {
    if (
      !raw ||
      typeof raw !== 'object' ||
      Array.isArray(raw) ||
      Object.keys(raw).some(
        (key) =>
          !['id', 'kind', 'options', 'parent', 'references'].includes(key),
      )
    )
      throw new TypeError('Invalid content node definition.');
    if (
      typeof raw.id !== 'string' ||
      !raw.id ||
      raw.id.length > 128 ||
      typeof raw.kind !== 'string' ||
      !registry.has(raw.kind) ||
      !Object.hasOwn(raw, 'options')
    )
      throw new TypeError(
        'Content nodes require a bounded ID, known factory and options.',
      );
    if (
      raw.parent !== undefined &&
      (typeof raw.parent !== 'string' || !raw.parent || raw.parent.length > 128)
    )
      throw new TypeError('Invalid content parent ID.');
    let references: Record<string, string> | undefined;
    if (raw.references !== undefined) {
      if (
        !raw.references ||
        typeof raw.references !== 'object' ||
        Array.isArray(raw.references)
      )
        throw new TypeError(
          'Content references require an alias-to-ID object.',
        );
      references = Object.create(null) as Record<string, string>;
      for (const [alias, id] of Object.entries(raw.references)) {
        if (!alias || typeof id !== 'string' || !id || id.length > 128)
          throw new TypeError('Invalid content reference alias or ID.');
        references[alias] = id;
      }
      Object.freeze(references);
    }
    nodes.push(
      Object.freeze({
        id: raw.id,
        kind: raw.kind,
        // Factories await work; later caller edits must not change the validated option snapshot.
        options: registry.parse(
          raw.kind,
          JSON.parse(JSON.stringify(raw.options)) as JsonValue,
        ),
        ...(raw.parent !== undefined ? { parent: raw.parent } : {}),
        ...(references ? { references } : {}),
      }) as ContentNodeDefinition<Definitions>,
    );
  }
  const ordered = contentOrder(nodes);
  return {
    definition: Object.freeze({ version: 1, nodes: Object.freeze(nodes) }),
    ordered,
  };
}

/** Validates unknown JSON and every factory's options before construction starts. */
export function parseContentScene<Definitions extends FactoryDefinitions>(
  registry: FactoryRegistry<Definitions>,
  value: unknown,
): ContentSceneDefinition<Definitions> {
  return validateContent(registry, value).definition;
}

/** Construct off the active Game; failure owns only the new leaves, never service assets. */
export async function buildContentScene<
  Definitions extends FactoryDefinitions,
  const Definition extends ContentSceneDefinition<Definitions>,
>(
  registry: FactoryRegistry<Definitions>,
  definition: Definition,
  services: FactoryServices<Definitions>,
  options: ContentBuildOptions = {},
): Promise<ContentScene<Definitions, Definition>> {
  const signal = options.signal ?? new AbortController().signal;
  if (signal.aborted) throw factoryAbortReason(signal);
  const { ordered } = validateContent(registry, definition);
  const scene = new Scene();
  const entries = new Map<string, { kind: string; node: SceneObject }>();
  const owned = new Set<SceneObject>();
  try {
    for (const entry of ordered) {
      if (signal.aborted) throw factoryAbortReason(signal);
      const node = await registry.createParsed(
        entry.kind,
        entry.options,
        services,
        {
          signal,
          id: entry.id,
          reference(alias) {
            const id =
              entry.references && Object.hasOwn(entry.references, alias)
                ? entry.references[alias]
                : undefined;
            const referenced =
              id === undefined ? undefined : entries.get(id)?.node;
            if (!referenced || referenced.destroyed)
              throw new Error(
                `Undeclared or unavailable content reference: ${alias}.`,
              );
            return referenced;
          },
        },
      );
      if (owned.has(node))
        throw new Error(
          'Factories returned the same object for multiple content IDs.',
        );
      const subtree = new Set<SceneObject>();
      collectFactoryNodes(node, subtree);
      for (const member of subtree) {
        if (owned.has(member))
          throw new Error(
            'Factory prefabs share an object across content IDs.',
          );
        owned.add(member);
      }
      entries.set(entry.id, { kind: entry.kind, node });
    }
    if (signal.aborted) throw factoryAbortReason(signal);
    // Callbacks may have touched earlier references: recheck before any Scene registration.
    for (const { node } of entries.values()) collectFactoryNodes(node, owned);
    for (const entry of ordered) {
      if (entry.parent === undefined) continue;
      const node = entries.get(entry.id)!.node;
      const parent = entries.get(entry.parent)!.node;
      if (node instanceof GameObject && parent instanceof GameObject)
        parent.add(node);
      else if (node instanceof Object3D && parent instanceof Object3D)
        parent.add(node);
      else
        throw new Error(
          `Incompatible content parent dimensions for ${entry.id}.`,
        );
    }
    for (const entry of ordered)
      if (entry.parent === undefined) scene.add(entries.get(entry.id)!.node);
    for (const node of owned)
      if (node.destroyed || node.scene !== scene)
        throw new Error('Content registration changed object ownership.');
    for (const node of scene.objects)
      if (!owned.has(node))
        throw new Error('Content registration introduced an unowned object.');
    if (signal.aborted) throw factoryAbortReason(signal);
    return new ContentScene<Definitions, Definition>(scene, entries);
  } catch (error) {
    const errors: unknown[] = [error];
    // Remove foreign registrations without disposing objects introduced by user listeners.
    for (const node of scene.objects)
      if (!owned.has(node)) {
        try {
          scene.remove(node);
        } catch (cleanupError) {
          errors.push(cleanupError);
        }
      }
    try {
      destroyFactoryNodes(owned);
    } catch (cleanupError) {
      errors.push(cleanupError);
    }
    for (const node of scene.objects)
      if (!owned.has(node)) {
        try {
          scene.remove(node);
        } catch (cleanupError) {
          errors.push(cleanupError);
        }
      }
    try {
      scene.destroy();
    } catch (cleanupError) {
      errors.push(cleanupError);
    }
    if (errors.length > 1)
      throw new AggregateError(
        errors,
        'Content construction and cleanup failed.',
        { cause: error },
      );
    throw error;
  }
}
