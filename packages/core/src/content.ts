import { contentLimits } from '../../../src/data/content.js';
import {
  ResourcePool,
  type ResourceScope,
} from '../../assets/src/resource-scope.js';
import { subscribeLoad } from '../../assets/src/preload/subscribe-load.js';
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
import {
  Serializer,
  sceneObjectState,
  type Serializable,
  type SceneSnapshot,
} from './serialization.js';
import { assertJsonValue } from './storage.js';
import type { JsonValue } from './storage.js';

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

export interface ContentSceneDefinition<
  Definitions extends FactoryDefinitions,
> {
  readonly version: 1;
  readonly nodes: readonly ContentNodeDefinition<Definitions>[];
}
export interface ContentBuildOptions {
  readonly signal?: AbortSignal;
  /** A fresh candidate scope is created, or forked from resources; neither owns borrowed services. */
  readonly resourcePool?: ResourcePool;
  readonly resources?: ResourceScope;
}

export interface ContentSnapshot<
  Definitions extends FactoryDefinitions = FactoryDefinitions,
> {
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
  resources?: ResourceScope;
}

type NodeAt<
  Definitions extends FactoryDefinitions,
  Definition extends ContentSceneDefinition<Definitions>,
  Id extends string,
> = FactoryNode<
  Definitions[Extract<Definition['nodes'][number], { readonly id: Id }>['kind']]
>;

/** Scope release runs in Scene's existing post-object teardown hook, not on acquisition abort. */
class ResourceContentScene extends Scene {
  private readonly spawnedResources = new Set<ResourceScope>();
  constructor(readonly resources: ResourceScope | undefined) {
    super();
  }

  adoptResources(resources: ResourceScope): void {
    this.spawnedResources.add(resources);
  }

  releaseResources(resources: ResourceScope): void {
    resources.release();
    this.spawnedResources.delete(resources);
  }

  protected override onDestroy(): void {
    const errors: unknown[] = [];
    try {
      this.resources?.release();
    } catch (error) {
      errors.push(error);
    }
    for (const resources of this.spawnedResources) {
      try {
        this.releaseResources(resources);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(
        errors,
        'Content scene resources failed to release.',
      );
  }
}

/** A built Scene, including an explicit factory-authored topology ledger. Publish with Game.setScene. */
export class ContentScene<
  Definitions extends FactoryDefinitions,
  Definition extends ContentSceneDefinition<Definitions> =
    ContentSceneDefinition<Definitions>,
> {
  readonly serializer: Serializer;
  private mutating = false;
  constructor(
    readonly scene: Scene,
    private readonly entries: Map<string, ContentEntry>,
    private readonly definitions: Map<
      string,
      ContentNodeDefinition<Definitions>
    >,
    private readonly owned: Set<SceneObject>,
    private readonly registry: FactoryRegistry<Definitions>,
    private readonly services: FactoryServices<Definitions>,
    readonly resources?: ResourceScope,
  ) {
    this.serializer = new Serializer(scene);
    for (const [id, entry] of entries)
      entry.unregister = this.serializer.register(id, entry.node, entry.state);
  }

  get<Id extends Definition['nodes'][number]['id']>(
    id: Id,
  ): NodeAt<Definitions, Definition, Id> | undefined {
    return this.getById(id) as NodeAt<Definitions, Definition, Id> | undefined;
  }

  /** Runtime IDs (including prefab children) without pretending their subtype is known. */
  getById(id: string): SceneObject | undefined {
    const node = this.entries.get(id)?.node;
    return node && !node.destroyed && node.scene === this.scene
      ? node
      : undefined;
  }

  require<Kind extends Extract<keyof Definitions, string>>(
    id: string,
    kind: Kind,
  ): FactoryNode<Definitions[Kind]> {
    const entry = this.entries.get(id);
    if (
      !entry ||
      entry.alias !== undefined ||
      entry.kind !== kind ||
      !this.getById(id)
    )
      throw new Error(`Content node ${id} is not a live ${kind}.`);
    return entry.node as FactoryNode<Definitions[Kind]>;
  }

  capture(): ContentSnapshot<Definitions> {
    if (this.mutating) throw new Error('Content mutation is in progress.');
    const ids = new Map<SceneObject, string>();
    for (const [id, entry] of this.entries)
      if (this.getById(id)) ids.set(entry.node, id);
    for (const node of this.scene.objects)
      if (!ids.has(node))
        throw new Error(
          'Content capture requires an authored stable ID for every scene object.',
        );
    for (const [id, entry] of this.entries)
      if (ids.has(entry.node) && !this.getById(entry.rootId))
        throw new Error(
          `Content prefab member ${id} has no live factory root.`,
        );
    const parents: Record<string, string | null> = Object.create(
      null,
    ) as Record<string, string | null>;
    for (const [node, id] of ids) {
      const parent = parentOf(node);
      if (parent && !ids.has(parent))
        throw new Error(`Unregistered content parent for ${id}.`);
      parents[id] = parent ? ids.get(parent)! : null;
    }
    const nodes: ContentNodeDefinition<Definitions>[] = [];
    for (const [id, definition] of this.definitions) {
      if (!ids.has(this.entries.get(id)!.node)) continue;
      const authored = {
        id: definition.id,
        kind: definition.kind,
        options: definition.options,
        ...(definition.references ? { references: definition.references } : {}),
        ...(definition.children ? { children: definition.children } : {}),
      };
      const removedChildren = Object.entries(definition.children ?? {})
        .filter(([, childId]) => !this.getById(childId))
        .map(([alias]) => alias);
      nodes.push({
        ...authored,
        ...(parents[id] === null ? {} : { parent: parents[id] }),
        ...(removedChildren.length ? { removedChildren } : {}),
      } as ContentNodeDefinition<Definitions>);
    }
    const snapshot = {
      version: 1 as const,
      content: { version: 1 as const, nodes },
      state: this.serializer.capture(),
      parents,
    };
    // Reject stale references or unsupported cycles rather than emitting a save that cannot rebuild.
    validateContent(this.registry, snapshot.content);
    boundedJson(snapshot);
    return JSON.parse(JSON.stringify(snapshot)) as ContentSnapshot<Definitions>;
  }

  /** Create one authored dynamic prefab; existing IDs are available only through declared aliases. */
  async spawn<const Node extends ContentNodeDefinition<Definitions>>(
    definition: Node,
    options: ContentBuildOptions = {},
  ): Promise<FactoryNode<Definitions[Node['kind']]>> {
    if (this.mutating || this.scene.destroyed)
      throw new Error('Content is unavailable for mutation.');
    if (
      options.resourcePool &&
      options.resources &&
      options.resources.pool !== options.resourcePool
    )
      throw new Error('Content resource scope belongs to another pool.');
    this.mutating = true;
    const fresh = new Set<SceneObject>();
    const added = new Map<string, ContentEntry>();
    let resources: ResourceScope | undefined;
    const signals = [
      options.signal,
      this.resources?.signal,
      options.resources?.signal,
    ].filter((signal): signal is AbortSignal => signal !== undefined);
    const signal = signals.length
      ? AbortSignal.any(signals)
      : new AbortController().signal;
    let cancellationError: unknown;
    const cancel = () => {
      try {
        destroyFactoryNodes(fresh, false);
        resources?.release();
      } catch (error) {
        cancellationError = error;
      }
    };
    signal.addEventListener('abort', cancel, { once: true });
    try {
      if (signal.aborted) throw factoryAbortReason(signal);
      resources =
        options.resources?.fork() ??
        (options.resourcePool
          ? options.resourcePool.createScope()
          : this.resources?.fork());
      if (resources && this.scene instanceof ResourceContentScene)
        this.scene.adoptResources(resources);
      const validated = validateContent(this.registry, {
        version: 1,
        nodes: [...this.definitions.values(), definition],
      });
      const authored = validated.definition.nodes.find(
        (node) => node.id === definition.id,
      )!;
      await createContentNode(
        this.registry,
        authored,
        validated.parsedOptions.get(authored.id)!,
        this.services,
        signal,
        this.entries,
        added,
        fresh,
        resources,
      );
      const root = added.get(authored.id)!.node;
      const parent =
        authored.parent === undefined
          ? undefined
          : this.getById(authored.parent);
      if (authored.parent !== undefined && !parent)
        throw new Error('Content parent is unavailable.');
      for (const target of Object.values(authored.references ?? {}))
        if (!this.getById(target))
          throw new Error('Content reference is unavailable.');
      if (signal.aborted) throw factoryAbortReason(signal);
      this.scene.add(root);
      if (parent) attachParent(root, parent);
      for (const [id, entry] of added) {
        if (
          this.entries.has(id) ||
          !this.scene.has(entry.node) ||
          entry.node.destroyed
        )
          throw new Error('Dynamic content registration changed ownership.');
        entry.unregister = this.serializer.register(
          id,
          entry.node,
          entry.state,
        );
      }
      for (const member of fresh)
        if (member.destroyed || member.scene !== this.scene)
          throw new Error('Dynamic prefab registration changed ownership.');
      if (signal.aborted || this.scene.destroyed)
        throw factoryAbortReason(signal);
      for (const [id, entry] of added) this.entries.set(id, entry);
      for (const member of fresh) this.owned.add(member);
      this.definitions.set(authored.id, authored);
      return root as FactoryNode<Definitions[Node['kind']]>;
    } catch (error) {
      for (const entry of added.values()) entry.unregister?.();
      const cleanupErrors: unknown[] =
        cancellationError === undefined ? [] : [cancellationError];
      try {
        destroyFactoryNodes(fresh, false);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
      try {
        if (resources && this.scene instanceof ResourceContentScene)
          this.scene.releaseResources(resources);
        else resources?.release();
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
      if (cleanupErrors.length)
        throw new AggregateError(
          [error, ...cleanupErrors],
          'Dynamic content creation and cleanup failed.',
          { cause: error },
        );
      throw error;
    } finally {
      this.mutating = false;
      signal.removeEventListener('abort', cancel);
    }
  }

  /** Dispose only content-owned nodes. Surviving explicit references must be removed first. */
  remove(id: string): boolean {
    if (this.mutating) throw new Error('Content mutation is in progress.');
    const entry = this.entries.get(id);
    if (!entry) return false;
    const removed = new Set<SceneObject>();
    const pending = [entry.node];
    for (let index = 0; index < pending.length; index++) {
      const node = pending[index];
      if (!this.owned.has(node) || removed.has(node)) continue;
      removed.add(node);
      for (const child of childrenOf(node)) pending.push(child);
      // Prefab members cannot outlive the factory root that reconstructs them.
      for (const member of this.entries.values())
        if (
          member.alias !== undefined &&
          this.entries.get(member.rootId)?.node === node
        )
          pending.push(member.node);
    }
    const removedIds = new Set(
      [...this.entries]
        .filter(([, item]) => removed.has(item.node))
        .map(([key]) => key),
    );
    for (const [rootId, definition] of this.definitions)
      if (
        !removedIds.has(rootId) &&
        Object.values(definition.references ?? {}).some((target) =>
          removedIds.has(target),
        )
      )
        throw new Error(`Content ${rootId} still references a removed ID.`);
    const resources = new Set<ResourceScope>();
    for (const key of removedIds) {
      const scope = this.entries.get(key)?.resources;
      if (scope) resources.add(scope);
    }
    this.mutating = true;
    try {
      for (const key of removedIds) {
        const item = this.entries.get(key)!;
        item.unregister?.();
        this.entries.delete(key);
        if (item.alias === undefined) this.definitions.delete(key);
        else {
          const definition = this.definitions.get(item.rootId);
          if (definition)
            this.definitions.set(item.rootId, {
              ...definition,
              removedChildren: [
                ...new Set([...(definition.removedChildren ?? []), item.alias]),
              ],
            } as ContentNodeDefinition<Definitions>);
        }
      }
      for (const node of removed) this.owned.delete(node);
      const errors: unknown[] = [];
      try {
        destroyFactoryNodes(removed, false);
      } catch (error) {
        errors.push(error);
      }
      for (const scope of resources) {
        try {
          if (this.scene instanceof ResourceContentScene)
            this.scene.releaseResources(scope);
          else scope.release();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length)
        throw new AggregateError(errors, 'Content removal cleanup failed.');
      return true;
    } finally {
      this.mutating = false;
    }
  }

  /** Used for an unpublished candidate on rebuild failure; foreign nodes are never destroyed. */
  destroy(): void {
    for (const entry of this.entries.values()) entry.unregister?.();
    try {
      cleanupContent(this.scene, this.owned);
    } finally {
      this.entries.clear();
      this.definitions.clear();
      this.owned.clear();
    }
  }
}

/** Finite JSON profile: 4096 nodes, depth 32, 65536 values, 4096-char strings, 128-char keys/IDs. */
function boundedJson(value: unknown): asserts value is JsonValue {
  const pending: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  let count = 0;
  while (pending.length) {
    const item = pending.pop()!;
    if (
      ++count > contentLimits.maxValues ||
      item.depth > contentLimits.maxDepth
    )
      throw new RangeError('Content exceeds JSON value or depth limits.');
    if (
      typeof item.value === 'string' &&
      item.value.length > contentLimits.maxStringLength
    )
      throw new RangeError('Content strings exceed 4096 characters.');
    if (item.value === null || typeof item.value !== 'object') continue;
    if (Array.isArray(item.value) && item.value.length > contentLimits.maxNodes)
      throw new RangeError('Content arrays exceed 4096 entries.');
    const keys = Reflect.ownKeys(item.value);
    if (keys.length > contentLimits.maxNodes + 1)
      throw new RangeError('Content objects exceed 4096 properties.');
    for (const key of keys) {
      if (typeof key !== 'string' || key.length > contentLimits.maxKeyLength)
        throw new RangeError(
          'Content keys must be strings of at most 128 characters.',
        );
      if (Array.isArray(item.value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(item.value, key)!;
      if (!('value' in descriptor))
        throw new TypeError('Content requires JSON data properties.');
      if (count + pending.length >= contentLimits.maxValues)
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
  const owners = new Map<string, string>();
  const reserved = new Set<string>();
  for (const node of nodes) {
    for (const id of [node.id, ...Object.values(node.children ?? {})]) {
      if (reserved.has(id)) throw new Error(`Duplicate content ID: ${id}.`);
      reserved.add(id);
    }
    owners.set(node.id, node.id);
    for (const [alias, id] of Object.entries(node.children ?? {}))
      if (!node.removedChildren?.includes(alias)) owners.set(id, node.id);
    byId.set(node.id, node);
    dependents.set(node.id, []);
  }
  if (reserved.size > contentLimits.maxNodes)
    throw new RangeError('Content exceeds 4096 stable IDs.');
  const ready: ContentNodeDefinition<Definitions>[] = [];
  for (const node of nodes) {
    const dependencies = new Set<string>();
    for (const id of [
      ...Object.values(node.references ?? {}),
      ...(node.parent === undefined ? [] : [node.parent]),
    ]) {
      const owner = owners.get(id);
      if (!owner)
        throw new Error(`Missing content parent or reference: ${id}.`);
      dependencies.add(owner);
    }
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
  parsedOptions: Map<
    string,
    FactoryOptions<Definitions[Extract<keyof Definitions, string>]>
  >;
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
  const parsedOptions = new Map<
    string,
    FactoryOptions<Definitions[Extract<keyof Definitions, string>]>
  >();
  for (const raw of value.nodes) {
    if (
      !raw ||
      typeof raw !== 'object' ||
      Array.isArray(raw) ||
      Object.keys(raw).some(
        (key) =>
          ![
            'id',
            'kind',
            'options',
            'parent',
            'references',
            'children',
            'removedChildren',
          ].includes(key),
      )
    )
      throw new TypeError('Invalid content node definition.');
    if (
      typeof raw.id !== 'string' ||
      !raw.id ||
      raw.id.length > contentLimits.maxKeyLength ||
      typeof raw.kind !== 'string' ||
      !registry.has(raw.kind) ||
      !Object.hasOwn(raw, 'options')
    )
      throw new TypeError(
        'Content nodes require a bounded ID, known factory and options.',
      );
    if (
      raw.parent !== undefined &&
      (typeof raw.parent !== 'string' ||
        !raw.parent ||
        raw.parent.length > contentLimits.maxKeyLength)
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
        if (
          !alias ||
          typeof id !== 'string' ||
          !id ||
          id.length > contentLimits.maxKeyLength
        )
          throw new TypeError('Invalid content reference alias or ID.');
        references[alias] = id;
      }
      Object.freeze(references);
    }
    let children: Record<string, string> | undefined;
    if (raw.children !== undefined) {
      if (
        !raw.children ||
        typeof raw.children !== 'object' ||
        Array.isArray(raw.children)
      )
        throw new TypeError('Content children require an alias-to-ID object.');
      children = Object.create(null) as Record<string, string>;
      for (const [alias, id] of Object.entries(raw.children)) {
        if (
          !alias ||
          typeof id !== 'string' ||
          !id ||
          id.length > contentLimits.maxKeyLength
        )
          throw new TypeError('Invalid content child alias or ID.');
        children[alias] = id;
      }
      Object.freeze(children);
    }
    let removedChildren: readonly string[] | undefined;
    if (raw.removedChildren !== undefined) {
      if (
        !Array.isArray(raw.removedChildren) ||
        !raw.removedChildren.every(
          (alias) =>
            typeof alias === 'string' &&
            children &&
            Object.hasOwn(children, alias),
        ) ||
        new Set(raw.removedChildren).size !== raw.removedChildren.length
      )
        throw new TypeError(
          'Removed prefab children require unique declared aliases.',
        );
      removedChildren = Object.freeze([
        ...raw.removedChildren,
      ]) as readonly string[];
    }
    const options = JSON.parse(JSON.stringify(raw.options)) as JsonValue;
    parsedOptions.set(raw.id, registry.parse(raw.kind, options));
    nodes.push(
      Object.freeze({
        id: raw.id,
        kind: raw.kind,
        // Keep authored JSON, not parser-produced runtime handles, in the topology ledger.
        options: JSON.parse(JSON.stringify(raw.options)) as JsonValue,
        ...(raw.parent !== undefined ? { parent: raw.parent } : {}),
        ...(references ? { references } : {}),
        ...(children ? { children } : {}),
        ...(removedChildren ? { removedChildren } : {}),
      }) as ContentNodeDefinition<Definitions>,
    );
  }
  const ordered = contentOrder(nodes);
  return {
    definition: Object.freeze({ version: 1, nodes: Object.freeze(nodes) }),
    ordered,
    parsedOptions,
  };
}

/** Validates unknown JSON and every factory's options before construction starts. */
export function parseContentScene<Definitions extends FactoryDefinitions>(
  registry: FactoryRegistry<Definitions>,
  value: unknown,
): ContentSceneDefinition<Definitions> {
  return validateContent(registry, value).definition;
}

/** Construct off the active Game; failure owns only new nodes, never service assets. */
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
  const { ordered, parsedOptions } = validateContent(registry, definition);
  if (
    options.resourcePool &&
    options.resources &&
    options.resources.pool !== options.resourcePool
  )
    throw new Error('Content resource scope belongs to another pool.');
  const resources =
    options.resources?.fork() ?? options.resourcePool?.createScope();
  const scene = new ResourceContentScene(resources);
  let cancellationError: unknown;
  const cancel = () => {
    try {
      cleanupContent(scene, owned);
    } catch (error) {
      cancellationError = error;
    }
  };
  signal.addEventListener('abort', cancel, { once: true });
  const entries = new Map<string, ContentEntry>();
  const owned = new Set<SceneObject>();
  if (signal.aborted) cancel();
  try {
    for (const entry of ordered)
      await createContentNode(
        registry,
        entry,
        parsedOptions.get(entry.id)!,
        services,
        signal,
        entries,
        entries,
        owned,
        resources?.fork(),
      );
    if (signal.aborted) throw factoryAbortReason(signal);
    // Constructors can touch earlier references. Recheck roots before any registration.
    for (const entry of ordered)
      collectFactoryNodes(entries.get(entry.id)!.node, owned);
    for (const entry of ordered)
      if (entry.parent !== undefined)
        attachParent(
          entries.get(entry.id)!.node,
          entries.get(entry.parent)!.node,
        );
    for (const entry of ordered)
      if (entry.parent === undefined) scene.add(entries.get(entry.id)!.node);
    for (const node of owned)
      if (node.destroyed || node.scene !== scene)
        throw new Error('Content registration changed object ownership.');
    for (const node of scene.objects)
      if (!owned.has(node))
        throw new Error('Content registration introduced an unowned object.');
    if (signal.aborted) throw factoryAbortReason(signal);
    return new ContentScene<Definitions, Definition>(
      scene,
      entries,
      new Map(ordered.map((entry) => [entry.id, entry])),
      owned,
      registry,
      services,
      resources,
    );
  } catch (error) {
    if (cancellationError !== undefined)
      throw new AggregateError(
        [error, cancellationError],
        'Content cancellation and cleanup failed.',
        { cause: error },
      );
    try {
      cleanupContent(scene, owned);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Content construction and cleanup failed.',
        { cause: cleanupError },
      );
    }
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
  }
}

/** Recreate an unpublished candidate from JSON topology, then restore every stable-ID state. */
export async function rebuildContentScene<
  Definitions extends FactoryDefinitions,
>(
  registry: FactoryRegistry<Definitions>,
  value: unknown,
  services: FactoryServices<Definitions>,
  options: ContentBuildOptions = {},
): Promise<ContentScene<Definitions>> {
  boundedJson(value);
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value.version !== 1 ||
    Object.keys(value).some(
      (key) => !['version', 'content', 'state', 'parents'].includes(key),
    ) ||
    !value.parents ||
    typeof value.parents !== 'object' ||
    Array.isArray(value.parents) ||
    !value.state ||
    typeof value.state !== 'object' ||
    Array.isArray(value.state) ||
    value.state.version !== 1 ||
    !value.state.objects ||
    typeof value.state.objects !== 'object' ||
    Array.isArray(value.state.objects)
  )
    throw new TypeError('Invalid content snapshot.');
  const definition = parseContentScene(registry, value.content);
  const ids = new Set<string>();
  for (const node of definition.nodes) {
    ids.add(node.id);
    for (const [alias, id] of Object.entries(node.children ?? {}))
      if (!node.removedChildren?.includes(alias)) ids.add(id);
  }
  const parents = JSON.parse(JSON.stringify(value.parents)) as Record<
    string,
    string | null
  >;
  const state = JSON.parse(JSON.stringify(value.state)) as SceneSnapshot;
  for (const table of [parents, state.objects])
    if (
      Object.keys(table).length !== ids.size ||
      Object.keys(table).some((id) => !ids.has(id))
    )
      throw new Error('Content snapshot IDs do not match topology.');
  // Parent cycles and missing IDs fail before allocating any candidate.
  const ordered: string[] = [];
  const pending = new Set(ids);
  for (const [id, parent] of Object.entries(parents))
    if (
      parent !== null &&
      (typeof parent !== 'string' || !ids.has(parent) || parent === id)
    )
      throw new Error(`Invalid snapshot parent for ${id}.`);
  while (pending.size) {
    const before = pending.size;
    for (const id of pending) {
      const parent = parents[id];
      if (parent !== null && pending.has(parent as string)) continue;
      ordered.push(id);
      pending.delete(id);
    }
    if (before === pending.size)
      throw new Error('Snapshot hierarchy contains a cycle.');
  }
  const candidate = await buildContentScene(
    registry,
    definition,
    services,
    options,
  );
  let cancellationError: unknown;
  const cancel = () => {
    try {
      candidate.destroy();
    } catch (error) {
      cancellationError = error;
    }
  };
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) cancel();
  try {
    if (options.signal?.aborted) throw factoryAbortReason(options.signal);
    for (const id of ids) {
      const node = candidate.getById(id)!;
      if (node instanceof GameObject || node instanceof Object3D)
        node.detachParent();
    }
    for (const id of ordered) {
      const parent = parents[id];
      if (typeof parent === 'string')
        attachParent(candidate.getById(id)!, candidate.getById(parent)!);
    }
    await subscribeLoad(
      candidate.serializer.restore(state, 'error'),
      options.signal,
    );
    if (options.signal?.aborted) throw factoryAbortReason(options.signal);
    // Explicit adapters may await or invoke lifecycle callbacks; neither may change the candidate's topology.
    if (candidate.scene.objects.size !== ids.size)
      throw new Error('Content restoration introduced unregistered objects.');
    for (const id of ids) {
      const node = candidate.getById(id);
      const parent = parents[id];
      if (
        !node ||
        parentOf(node) !==
          (parent === null ? undefined : candidate.getById(parent))
      )
        throw new Error(
          'Content restoration changed object ownership or hierarchy.',
        );
    }
    return candidate;
  } catch (error) {
    if (cancellationError !== undefined)
      throw new AggregateError(
        [error, cancellationError],
        'Content cancellation and cleanup failed.',
        { cause: error },
      );
    try {
      candidate.destroy();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Content restoration and cleanup failed.',
        { cause: cleanupError },
      );
    }
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', cancel);
  }
}

async function createContentNode<Definitions extends FactoryDefinitions>(
  registry: FactoryRegistry<Definitions>,
  entry: ContentNodeDefinition<Definitions>,
  options: FactoryOptions<Definitions[Extract<keyof Definitions, string>]>,
  services: FactoryServices<Definitions>,
  signal: AbortSignal,
  available: ReadonlyMap<string, ContentEntry>,
  destination: Map<string, ContentEntry>,
  owned: Set<SceneObject>,
  resources?: ResourceScope,
): Promise<void> {
  if (signal.aborted) throw factoryAbortReason(signal);
  const subtree = new Set<SceneObject>();
  const node = await registry.createParsed(entry.kind, options, services, {
    signal,
    id: entry.id,
    resources,
    onOwn(nodes) {
      for (const member of nodes) {
        if (owned.has(member) && !subtree.has(member))
          throw new Error(
            'Factory prefabs share an object across content IDs.',
          );
        subtree.add(member);
        owned.add(member);
      }
    },
    reference(alias) {
      const id =
        entry.references && Object.hasOwn(entry.references, alias)
          ? entry.references[alias]
          : undefined;
      const referenced = id === undefined ? undefined : available.get(id)?.node;
      if (!referenced || referenced.destroyed)
        throw new Error(
          `Undeclared or unavailable content reference: ${alias}.`,
        );
      return referenced;
    },
  });
  if (signal.aborted) throw factoryAbortReason(signal);
  collectFactoryNodes(node, subtree);
  const factory = registry.definitions[entry.kind] as unknown as {
    children?(root: SceneObject): Readonly<Record<string, SceneObject>>;
    state?(root: SceneObject, member: SceneObject): Serializable;
  };
  const children = factory.children?.(node) ?? {};
  if (
    Object.keys(children).length !== Object.keys(entry.children ?? {}).length ||
    Object.keys(children).some(
      (alias) => !entry.children || !Object.hasOwn(entry.children, alias),
    )
  )
    throw new Error(
      'Prefab stable child aliases do not match authored content metadata.',
    );
  const named = new Set<SceneObject>([node]);
  for (const member of Object.values(children)) {
    if (!subtree.has(member) || named.has(member))
      throw new Error('Prefab metadata must name distinct owned descendants.');
    named.add(member);
  }
  const removed = new Set<SceneObject>();
  for (const alias of entry.removedChildren ?? []) {
    const pending = [children[alias]];
    for (let index = 0; index < pending.length; index++) {
      removed.add(pending[index]);
      for (const child of childrenOf(pending[index])) pending.push(child);
    }
  }
  for (const [alias, member] of Object.entries(children))
    if (removed.has(member) && !entry.removedChildren?.includes(alias))
      throw new Error(
        'Removed prefab subtrees must mark all descendant aliases.',
      );
  destroyFactoryNodes(removed, false);
  for (const member of removed) owned.delete(member);
  const members: [string, SceneObject, string | undefined][] = [
    [entry.id, node, undefined],
  ];
  for (const [alias, member] of Object.entries(children))
    if (!removed.has(member))
      members.push([entry.children![alias], member, alias]);
  for (const [id, member, alias] of members) {
    if (available.has(id) || destination.has(id))
      throw new Error(`Duplicate content ID: ${id}.`);
    const state = factory.state
      ? factory.state(node, member)
      : sceneObjectState(member);
    if (
      !state ||
      typeof state.serialize !== 'function' ||
      typeof state.restore !== 'function'
    )
      throw new TypeError(`Invalid Serializable adapter for ${id}.`);
    destination.set(id, {
      kind: entry.kind,
      node: member,
      rootId: entry.id,
      alias,
      state,
      ...(alias === undefined && resources ? { resources } : {}),
    });
  }
}

function parentOf(node: SceneObject): SceneObject | undefined {
  return node instanceof GameObject || node instanceof Object3D
    ? node.parent
    : undefined;
}

function childrenOf(
  node: SceneObject,
): ReadonlySet<SceneObject> | readonly SceneObject[] {
  return node instanceof GameObject || node instanceof Object3D
    ? node.children
    : [];
}

function attachParent(node: SceneObject, parent: SceneObject): void {
  if (node instanceof GameObject && parent instanceof GameObject)
    parent.add(node);
  else if (node instanceof Object3D && parent instanceof Object3D)
    parent.add(node);
  else throw new Error('Incompatible content parent dimensions.');
}

function cleanupContent(scene: Scene, owned: ReadonlySet<SceneObject>): void {
  const errors: unknown[] = [];
  // First isolate owned hierarchies, including foreign children introduced by callbacks.
  for (const node of owned)
    if (node instanceof GameObject || node instanceof Object3D)
      for (const child of node.children)
        if (!owned.has(child)) child.detachParent();
  try {
    destroyFactoryNodes(owned, false);
  } catch (error) {
    errors.push(error);
  }
  for (const node of scene.objects) {
    if (owned.has(node)) continue;
    try {
      scene.remove(node);
    } catch (error) {
      errors.push(error);
    }
  }
  try {
    scene.destroy();
  } catch (error) {
    errors.push(error);
  }
  if (errors.length)
    throw new AggregateError(errors, 'Content cleanup failed.');
}
