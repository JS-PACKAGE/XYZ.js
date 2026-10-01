import { expect, it, vi, afterEach } from 'vitest';
import {
  MemoryStorage,
  LocalStorageBackend,
  IndexedDBStorage,
  SaveManager,
  assertJsonValue,
  type JsonValue,
} from '../packages/core/src/storage.js';
import {
  Serializer,
  gameObjectState,
} from '../packages/core/src/serialization.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { RigidBody2D } from '../packages/core/src/physics2d/body.js';
import { storageLimits } from '../src/data/storage.js';

afterEach(() => vi.unstubAllGlobals());
it('round trips independent slots, metadata and detached input data', async () => {
  const saves = new SaveManager();
  const data = { score: 12 };
  await saves.save('one', data, 20);
  data.score = 99;
  await saves.save('two', [true, null]);
  const result = await saves.load('one');
  expect(result.status).toBe('loaded');
  if (result.status === 'loaded') {
    expect(result.record.data).toEqual({ score: 12 });
    expect(result.record.metadata.playTime).toBe(20);
    expect(Number.isFinite(Date.parse(result.record.metadata.savedAt))).toBe(
      true,
    );
  }
  expect(await saves.slots()).toEqual(['one', 'two']);
  await saves.remove('one');
  expect(await saves.load('one')).toEqual({ status: 'missing' });
});
it('runs every migration in order without rewriting the original', async () => {
  const storage = new MemoryStorage();
  await new SaveManager(storage).save('old', { score: 3 });
  const original = await storage.get('old');
  const calls: number[] = [];
  const saves = new SaveManager(storage, {
    version: 3,
    migrate: (version, data) => {
      calls.push(version);
      return {
        ...(data as { score: number }),
        score: (data as { score: number }).score + version,
      };
    },
    validate: (data) => (data as { score: number }).score === 6,
  });
  const loaded = await saves.load('old');
  expect(calls).toEqual([1, 2]);
  expect(loaded.status === 'loaded' && loaded.record.data).toEqual({
    score: 6,
  });
  expect(await storage.get('old')).toBe(original);
});
it('reports corrupt, incompatible and schema-invalid payloads without destroying them', async () => {
  const storage = new MemoryStorage();
  const saves = new SaveManager(storage);
  for (const raw of ['{broken', '{}', '{"payload":"{}","checksum":"wrong"}']) {
    await storage.set('bad', raw);
    const loaded = await saves.load('bad');
    expect(loaded).toMatchObject({ status: 'corrupt', raw });
    expect(await storage.get('bad')).toBe(raw);
  }
  await new SaveManager(storage, { version: 2 }).save('future', 4);
  expect((await saves.load('future')).status).toBe('corrupt');
  await saves.save('schema', 4);
  expect(
    (
      await new SaveManager(storage, {
        version: 1,
        validate: () => false,
      }).load('schema')
    ).status,
  ).toBe('corrupt');
});
it('rejects invalid JSON instead of silently changing values', async () => {
  const cyclic: unknown[] = [];
  cyclic.push(cyclic);
  for (const value of [
    NaN,
    Infinity,
    undefined,
    () => 1,
    Symbol('x'),
    BigInt(1),
    { nested: NaN },
    cyclic,
    new Date(),
    Object.assign(new Array<number>(2), { 1: 1 }),
  ]) {
    await expect(
      new SaveManager().save('bad', value as JsonValue),
    ).rejects.toMatchObject({ code: 'invalid' });
  }
  const shared = { value: 1 };
  expect(() => assertJsonValue([shared, shared])).not.toThrow();
});
it('isolates namespaces including clear and enforces byte limits', async () => {
  const entries = new Map<string, string>();
  const a = new MemoryStorage('a', entries),
    b = new MemoryStorage('a:b', entries);
  await a.set('same', 'a');
  await b.set('same', 'b');
  expect(await a.keys()).toEqual(['same']);
  await a.clear();
  expect(await a.get('same')).toBeNull();
  expect(await b.get('same')).toBe('b');
  await expect(
    b.set('large', '😀'.repeat(storageLimits.maxBytes / 4 + 1)),
  ).rejects.toMatchObject({ code: 'size' });
});
it('turns localStorage quota failures into typed errors and detects unavailable IndexedDB', async () => {
  const storage = {
    setItem: () => {
      throw new DOMException('full', 'QuotaExceededError');
    },
  } as unknown as Storage;
  await expect(
    new LocalStorageBackend('test', storage).set('slot', 'data'),
  ).rejects.toMatchObject({ code: 'quota' });
  vi.stubGlobal('indexedDB', undefined);
  await expect(new IndexedDBStorage().get('slot')).rejects.toMatchObject({
    code: 'unavailable',
  });
});
it('captures local transforms, visibility, existing body motion and explicit custom state', async () => {
  const scene = new Scene();
  const object = scene.add(new GameObject());
  object.body = new RigidBody2D();
  object.position.set(4, 8);
  object.rotation = 0.5;
  object.scale.set(2, 3);
  object.pivot.set(1, 2);
  object.skew.set(0.1, 0.2);
  object.visible = false;
  object.opacity = 0.4;
  object.body.velocity.set(5, 6);
  object.body.angularVelocity = 2;
  let score: JsonValue = 20;
  const serializer = new Serializer(scene);
  serializer.register(
    'player',
    object,
    gameObjectState(object, {
      serialize: () => score,
      restore: (value) => {
        score = value;
      },
    }),
  );
  const snapshot = serializer.capture();
  object.position.set(0, 0);
  object.rotation = 0;
  object.visible = true;
  object.body.velocity.set(0, 0);
  score = 0;
  expect(await serializer.restore(snapshot)).toEqual({
    restored: ['player'],
    unknown: [],
    missing: [],
  });
  expect([
    object.position.x,
    object.position.y,
    object.rotation,
    object.visible,
    object.opacity,
    object.body.velocity.x,
    object.body.velocity.y,
    object.body.angularVelocity,
    score,
  ]).toEqual([4, 8, 0.5, false, 0.4, 5, 6, 2, 20]);
  expect(serializer.capture()).toEqual(snapshot);
  scene.destroy();
});
it('reports unknown and missing ids or rejects before applying strict mismatches', async () => {
  const scene = new Scene();
  const a = scene.add(new GameObject());
  const b = scene.add(new GameObject());
  const serializer = new Serializer(scene);
  serializer.register('a', a);
  const unregister = serializer.register('b', b);
  const snapshot = serializer.capture();
  delete snapshot.objects.b;
  snapshot.objects.extra = null;
  a.position.x = 99;
  await expect(serializer.restore(snapshot, 'error')).rejects.toThrow(
    'mismatch',
  );
  expect(a.position.x).toBe(99);
  expect(await serializer.restore(snapshot)).toEqual({
    restored: ['a'],
    unknown: ['extra'],
    missing: ['b'],
  });
  unregister();
  scene.remove(a);
  expect(serializer.capture().objects).toEqual({});
  scene.destroy();
  a.destroy();
});
