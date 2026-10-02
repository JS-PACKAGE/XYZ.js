import { describe, expect, it } from 'vitest';
import { AssetLoader } from '../packages/assets/src/index.js';
import { ResourcePool } from '../packages/assets/src/resource-scope.js';
import {
  buildContentScene,
  type ContentScene,
} from '../packages/core/src/content.js';
import {
  ContentLoadCoordinator,
  type ContentPublicationHost,
} from '../packages/core/src/content-storage.js';
import {
  defineFactory,
  FactoryRegistry,
  type FactoryDefinitions,
} from '../packages/core/src/factories.js';
import { SceneObject } from '../packages/core/src/scene-object.js';
import {
  assertJsonValue,
  MemoryStorage,
  SaveManager,
  type JsonValue,
} from '../packages/core/src/storage.js';
import type { Scene } from '../packages/core/src/scene.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
class Counter extends SceneObject {
  value = 0;
  busy = false;
  readonly resourcesReleased = deferred<void>();
  override destroy(): void {
    if (this.busy) throw new Error('Counter is still consuming its resource.');
    super.destroy();
  }
}
interface Services {
  created: Counter[];
  cleaned: Counter[];
  restoreGate?: Promise<void>;
  restoreStarted?: () => void;
  factoryId?: string;
  factoryGate?: Promise<void>;
  factoryStarted?: () => void;
}
function fixture() {
  const services: Services = { created: [], cleaned: [] };
  const registry = new FactoryRegistry({
    counter: defineFactory<number, Counter, Services>({
      parse(value) {
        if (typeof value !== 'number' || !Number.isFinite(value))
          throw new TypeError('Invalid options.');
        return value;
      },
      async create(value, context) {
        const node = context.own(new Counter());
        node.value = value;
        services.created.push(node);
        context.resources?.own(node, (resource) => {
          if (!resource.destroyed || resource.scene)
            throw new Error('Resource released before node detachment.');
          services.cleaned.push(resource);
          resource.resourcesReleased.resolve();
        });
        if (context.id === services.factoryId) {
          services.factoryStarted?.();
          await services.factoryGate;
        }
        return node;
      },
      state(node) {
        return {
          serialize: () => node.value,
          async restore(value) {
            if (value === 'fail') throw new Error('Second adapter failed.');
            if (typeof value !== 'number')
              throw new TypeError('Invalid counter state.');
            node.value = value;
            services.restoreStarted?.();
            await services.restoreGate;
          },
        };
      },
    }),
  });
  const assets = new AssetLoader(),
    resources = new ResourcePool(assets);
  const owner = new AbortController();
  type Definitions = typeof registry.definitions;
  const host: ContentPublicationHost<Definitions> & {
    destroyed: boolean;
    revision: number;
    scene: Scene | undefined;
  } = {
    destroyed: false,
    revision: 0,
    scene: undefined,
    signal: owner.signal,
    async publish(candidate, signal, revision) {
      signal.throwIfAborted();
      if (this.destroyed || this.revision !== revision)
        throw new DOMException('Superseded.', 'AbortError');
      const old = this.scene;
      this.scene = candidate.scene;
      this.revision++;
      old?.destroy();
    },
  };
  const coordinator = new ContentLoadCoordinator(
    registry,
    services,
    resources,
    host,
  );
  return { services, registry, assets, resources, host, coordinator, owner };
}
const definition = {
  version: 1,
  nodes: [
    { id: 'first', kind: 'counter', options: 1 },
    { id: 'second', kind: 'counter', options: 2 },
  ],
} as const;
async function saveSnapshot<Definitions extends FactoryDefinitions>(
  saves: SaveManager,
  slot: string,
  content: ContentScene<Definitions>,
  mutate?: (snapshot: JsonValue) => void,
) {
  const snapshot: unknown = content.capture();
  assertJsonValue(snapshot);
  mutate?.(snapshot);
  await saves.save(slot, snapshot);
}

describe('safe content save/load publication', () => {
  it('preserves live state when a later adapter fails after an earlier candidate adapter changed state', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'bad', live, (data) => {
      const snapshot = data as {
        state: { objects: Record<string, JsonValue> };
      };
      snapshot.state.objects.first = 99;
      snapshot.state.objects.second = 'fail';
    });
    await expect(f.coordinator.load(saves, 'bad')).rejects.toThrow(
      'Second adapter failed.',
    );
    expect(f.host.scene).toBe(live.scene);
    expect(live.require('first', 'counter').value).toBe(1);
    expect(live.require('second', 'counter').value).toBe(2);
    expect(
      f.services.created
        .slice(2)
        .every((node) => node.destroyed && !node.scene),
    ).toBe(true);
    expect(f.services.cleaned).toEqual(f.services.created.slice(2));
    expect(live.resources?.destroyed).toBe(false);
    live.destroy();
    f.coordinator.destroy();
    f.resources.destroy();
    f.assets.destroy();
  });

  it('migrates stored state before constructing and publishing a fresh candidate', async () => {
    const f = fixture(),
      storage = new MemoryStorage();
    const old = new SaveManager(storage);
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await f.coordinator.save(old, 'old', live, 12);
    const raw = await storage.get('old');
    const upgraded = new SaveManager(storage, {
      version: 2,
      migrate(_version, data) {
        const snapshot = data as {
          state: { objects: Record<string, JsonValue> };
        };
        snapshot.state.objects.first = 41;
        return data;
      },
    });
    const loaded = await f.coordinator.load(upgraded, 'old');
    expect(loaded.status).toBe('loaded');
    if (loaded.status !== 'loaded')
      throw new Error('Expected a loaded candidate.');
    expect(loaded.content.require('first', 'counter').value).toBe(41);
    expect(loaded.content.require('second', 'counter').value).toBe(2);
    expect(loaded.content.scene).toBe(f.host.scene);
    expect(loaded.content.scene).not.toBe(live.scene);
    expect(live.scene.destroyed).toBe(true);
    expect(loaded.record.metadata.playTime).toBe(12);
    expect(await storage.get('old')).toBe(raw);
    loaded.content.destroy();
    f.coordinator.destroy();
    f.resources.destroy();
    f.assets.destroy();
  });

  it('rejects a candidate if another publication wins while an asynchronous adapter restores', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    const started = deferred<void>(),
      gate = deferred<void>();
    f.services.restoreStarted = () => started.resolve();
    f.services.restoreGate = gate.promise;
    const pending = f.coordinator.load(saves, 'one');
    const cancelled = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    f.host.revision++;
    gate.resolve();
    await cancelled;
    expect(f.host.scene).toBe(live.scene);
    expect(live.require('first', 'counter').value).toBe(1);
    expect(f.services.created.slice(2).every((node) => node.destroyed)).toBe(
      true,
    );
    live.destroy();
    f.coordinator.destroy();
    f.resources.destroy();
    f.assets.destroy();
  });

  it('supersedes an in-flight candidate without waiting for its custom adapter', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    const started = deferred<void>(),
      gate = deferred<void>();
    f.services.restoreStarted = () => started.resolve();
    f.services.restoreGate = gate.promise;
    const pending = f.coordinator.load(saves, 'one');
    const cancelled = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    expect(await f.coordinator.load(saves, 'missing')).toEqual({
      status: 'missing',
    });
    await cancelled;
    expect(f.host.scene).toBe(live.scene);
    expect(f.services.cleaned).toEqual(f.services.created.slice(2));
    gate.resolve();
    live.destroy();
    f.coordinator.destroy();
    f.resources.destroy();
    f.assets.destroy();
  });

  it('cancels destroyed owners even when a custom adapter never settles', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    const started = deferred<void>(),
      gate = deferred<void>();
    f.services.restoreStarted = () => started.resolve();
    f.services.restoreGate = gate.promise;
    const pending = f.coordinator.load(saves, 'one');
    const cancelled = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    f.host.destroyed = true;
    f.owner.abort(
      new DOMException('Content owner is destroyed.', 'AbortError'),
    );
    expect(
      f.services.created
        .slice(2)
        .every((node) => node.destroyed && !node.scene),
    ).toBe(true);
    expect(f.services.cleaned).toEqual(f.services.created.slice(2));
    live.destroy();
    f.resources.destroy();
    await cancelled;
    expect(live.scene.destroyed).toBe(true);
    expect(f.services.cleaned).toEqual([
      ...f.services.created.slice(2),
      ...f.services.created.slice(0, 2),
    ]);
    gate.resolve();
    f.assets.destroy();
  });

  it('detaches completed and claimed factory consumers synchronously while a later factory is still awaiting', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    const started = deferred<void>(),
      gate = deferred<void>();
    f.services.factoryId = 'second';
    f.services.factoryStarted = () => started.resolve();
    f.services.factoryGate = gate.promise;
    const pending = f.coordinator.load(saves, 'one');
    const cancelled = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    await started.promise;
    f.host.destroyed = true;
    f.owner.abort(
      new DOMException('Content owner is destroyed.', 'AbortError'),
    );
    expect(
      f.services.created
        .slice(2)
        .every((node) => node.destroyed && !node.scene),
    ).toBe(true);
    expect(f.services.cleaned).toEqual(f.services.created.slice(2));
    live.destroy();
    f.resources.destroy();
    await cancelled;
    gate.resolve();
    f.assets.destroy();
  });

  it('releases retained factory resources once cancellation cleanup can detach the blocked consumer, without awaiting its factory', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    const started = deferred<void>(),
      gate = deferred<void>();
    f.services.factoryId = 'second';
    f.services.factoryStarted = () => started.resolve();
    f.services.factoryGate = gate.promise;
    const pending = f.coordinator.load(saves, 'one');
    const cancelled = expect(pending).rejects.toThrow(
      'Content cancellation and cleanup failed.',
    );
    await started.promise;
    const blocked = f.services.created[3];
    blocked.busy = true;
    f.host.destroyed = true;
    f.owner.abort(
      new DOMException('Content owner is destroyed.', 'AbortError'),
    );
    live.destroy();
    expect(() => f.resources.destroy()).toThrow(AggregateError);
    expect(blocked.destroyed).toBe(false);
    expect(f.services.cleaned).not.toContain(blocked);
    blocked.busy = false;
    await cancelled;
    expect(blocked.destroyed).toBe(true);
    expect(f.services.cleaned.filter((node) => node === blocked)).toEqual([
      blocked,
    ]);
    f.resources.destroy();
    gate.resolve();
    f.assets.destroy();
  });

  it('retries retained ownership when a cancelled factory finally returns its previously blocked consumer', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    const started = deferred<void>(),
      gate = deferred<void>();
    f.services.factoryId = 'second';
    f.services.factoryStarted = () => started.resolve();
    f.services.factoryGate = gate.promise;
    const pending = f.coordinator.load(saves, 'one');
    const cancelled = expect(pending).rejects.toThrow(
      'Content cancellation and cleanup failed.',
    );
    await started.promise;
    const blocked = f.services.created[3];
    blocked.busy = true;
    f.host.destroyed = true;
    f.owner.abort(
      new DOMException('Content owner is destroyed.', 'AbortError'),
    );
    live.destroy();
    expect(() => f.resources.destroy()).toThrow(AggregateError);
    await cancelled;
    expect(blocked.destroyed).toBe(false);
    expect(f.services.cleaned).not.toContain(blocked);
    blocked.busy = false;
    gate.resolve();
    await blocked.resourcesReleased.promise;
    expect(blocked.destroyed).toBe(true);
    expect(f.services.cleaned.filter((node) => node === blocked)).toEqual([
      blocked,
    ]);
    f.resources.destroy();
    f.assets.destroy();
  });

  it('honors independently supplied spawn pools and parent scopes without transferring parent ownership', async () => {
    const f = fixture();
    const content = await buildContentScene(
      f.registry,
      { version: 1, nodes: [] },
      f.services,
    );
    const parent = f.resources.createScope();
    let parentDisposals = 0;
    const parentLease = parent.own({}, () => {
      parentDisposals++;
    });
    const first = await content.spawn(
      { id: 'pool-child', kind: 'counter', options: 1 },
      { resourcePool: f.resources },
    );
    const second = await content.spawn(
      { id: 'scope-child', kind: 'counter', options: 2 },
      { resources: parent },
    );
    expect(content.resources).toBeUndefined();
    content.remove('pool-child');
    expect(first.destroyed).toBe(true);
    expect(f.services.cleaned).toEqual([first]);
    content.scene.destroy();
    expect(second.destroyed).toBe(true);
    expect(f.services.cleaned).toEqual([first, second]);
    expect(parent.destroyed).toBe(false);
    expect(parentLease.released).toBe(false);
    expect(parentDisposals).toBe(0);
    parent.release();
    expect(parentDisposals).toBe(1);
    f.resources.destroy();
    f.assets.destroy();
  });

  it('removes candidate abort ownership after publication instead of destroying a live scene on later owner abort', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    const loaded = await f.coordinator.load(saves, 'one');
    if (loaded.status !== 'loaded')
      throw new Error('Expected a loaded candidate.');
    f.owner.abort(
      new DOMException('Content owner is destroyed.', 'AbortError'),
    );
    expect(loaded.content.scene.destroyed).toBe(false);
    expect(loaded.content.require('first', 'counter').destroyed).toBe(false);
    expect(loaded.content.resources?.destroyed).toBe(false);
    loaded.content.destroy();
    f.coordinator.destroy();
    f.resources.destroy();
    f.assets.destroy();
  });

  it('tears down an independently scoped pending spawn when its resource-less scene is destroyed', async () => {
    const f = fixture();
    const content = await buildContentScene(
      f.registry,
      { version: 1, nodes: [] },
      f.services,
    );
    const started = deferred<void>(),
      gate = deferred<void>();
    f.services.factoryId = 'pending';
    f.services.factoryStarted = () => started.resolve();
    f.services.factoryGate = gate.promise;
    const spawn = content.spawn(
      { id: 'pending', kind: 'counter', options: 1 },
      { resourcePool: f.resources },
    );
    const cancelled = expect(spawn).rejects.toThrow(
      'ResourceScope was released.',
    );
    await started.promise;
    content.scene.destroy();
    expect(f.services.created[0].destroyed).toBe(true);
    expect(f.services.cleaned).toEqual(f.services.created);
    f.resources.destroy();
    await cancelled;
    gate.resolve();
    f.assets.destroy();
  });

  it('does not tear down a live candidate when host publication fails after taking ownership', async () => {
    const f = fixture(),
      saves = new SaveManager();
    const live = await buildContentScene(f.registry, definition, f.services, {
      resourcePool: f.resources,
    });
    f.host.scene = live.scene;
    await saveSnapshot(saves, 'one', live);
    f.host.publish = async function (candidate) {
      this.scene = candidate.scene;
      this.revision++;
      live.destroy();
      throw new Error('Old lifecycle cleanup failed after publication.');
    };
    await expect(f.coordinator.load(saves, 'one')).rejects.toThrow(
      'Old lifecycle cleanup failed',
    );
    expect(f.host.scene).not.toBe(live.scene);
    expect(f.host.scene?.destroyed).toBe(false);
    expect(f.services.created.slice(2).every((node) => !node.destroyed)).toBe(
      true,
    );
    f.host.scene?.destroy();
    f.coordinator.destroy();
    f.resources.destroy();
    f.assets.destroy();
  });
});
