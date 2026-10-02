import { afterEach, expect, it, vi } from 'vitest';
import {
  MemoryStorage,
  LocalStorageBackend,
  SaveManager,
  StorageError,
  type SaveStorage,
} from '../packages/core/src/storage.js';
import {
  AutosaveController,
  type AutosaveState,
} from '../packages/core/src/autosave.js';

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
function delayedStorage() {
  const values = new Map<string, string>();
  const entered = gate(),
    delayed = gate();
  let primaryWrites = 0;
  const storage: SaveStorage = {
    async get(key) {
      return values.get(key) ?? null;
    },
    async set(key, value) {
      if (key === 'slot' && ++primaryWrites === 1) {
        entered.release();
        await delayed.promise;
      }
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    },
    async keys() {
      return [...values.keys()];
    },
    async clear() {
      values.clear();
    },
  };
  return { storage, entered, delayed, primaryWrites: () => primaryWrites };
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('orders delayed same-slot writes and captures input before waiting', async () => {
  const backend = delayedStorage(),
    saves = new SaveManager(backend.storage);
  const first = saves.save('slot', { value: 'old' });
  await backend.entered.promise;
  const data = { value: 'new' };
  const second = saves.save('slot', data);
  data.value = 'mutated';
  await Promise.resolve();
  expect(backend.primaryWrites()).toBe(1);
  backend.delayed.release();
  expect((await first).revision).toBe(1);
  expect((await second).revision).toBe(2);
  expect(await saves.load('slot')).toMatchObject({
    status: 'loaded',
    record: { data: { value: 'new' }, revision: 2 },
  });
});
it('rejects another owner stale revision across separate memory backend instances', async () => {
  const entries = new Map<string, string>();
  const a = new SaveManager(new MemoryStorage('shared', entries));
  const b = new SaveManager(new MemoryStorage('shared', entries));
  await a.save('slot', 1);
  await b.load('slot');
  const attempts = await Promise.allSettled([
    a.save('slot', 2),
    b.save('slot', 3),
  ]);
  expect(attempts[0].status).toBe('fulfilled');
  expect(attempts[1]).toMatchObject({
    status: 'rejected',
    reason: { code: 'stale' },
  });
  expect(await b.load('slot')).toMatchObject({
    status: 'loaded',
    record: { data: 2, revision: 2 },
  });
  await b.save('slot', 4);
  await expect(
    a.save('slot', 5, 0, { expectedRevision: 2 }),
  ).rejects.toMatchObject({ code: 'stale' });
});
it('retains blind-save compatibility while assigning the current revision atomically', async () => {
  const storage = new MemoryStorage();
  await new SaveManager(storage).save('slot', 1);
  const owner = new SaveManager(storage);
  expect((await owner.save('slot', 2)).revision).toBe(2);
  expect(await owner.load('slot')).toMatchObject({
    status: 'loaded',
    record: { data: 2 },
  });
});
it('does not reset revision after removal or namespace clear', async () => {
  const storage = new MemoryStorage();
  const a = new SaveManager(storage),
    stale = new SaveManager(storage);
  await a.save('slot', 1);
  await stale.load('slot');
  await a.remove('slot');
  expect(await a.load('slot')).toEqual({ status: 'missing' });
  await expect(stale.save('slot', 2)).rejects.toMatchObject({ code: 'stale' });
  expect((await a.save('slot', 3)).revision).toBe(3);
  await a.clear();
  expect(await a.slots()).toEqual([]);
  expect((await a.save('slot', 4)).revision).toBe(5);
});
it('recovers a valid backup without touching corrupt text and archives every explicit restoration', async () => {
  const storage = new MemoryStorage(),
    saves = new SaveManager(storage);
  await saves.save('slot', { level: 1 });
  await saves.save('slot', { level: 2 });
  const stale = new SaveManager(storage);
  await stale.load('slot');
  await storage.set('slot', '{damaged-one');
  expect(await saves.load('slot')).toMatchObject({
    status: 'corrupt',
    raw: '{damaged-one',
  });
  expect(await saves.load('slot', { recovery: true })).toMatchObject({
    status: 'loaded',
    record: { data: { level: 1 } },
    recovery: { raw: '{damaged-one' },
  });
  expect(await storage.get('slot')).toBe('{damaged-one');
  await expect(saves.save('slot', { level: 3 })).rejects.toMatchObject({
    code: 'invalid',
  });
  expect((await saves.restore('slot')).revision).toBe(3);
  expect(await saves.damagedPayload('slot')).toBe('{damaged-one');
  await expect(stale.save('slot', { level: 4 })).rejects.toMatchObject({
    code: 'stale',
  });
  await storage.set('slot', '{damaged-two');
  expect((await saves.restore('slot')).revision).toBe(4);
  expect(await saves.damagedPayloads('slot')).toEqual([
    '{damaged-one',
    '{damaged-two',
  ]);
});
it('keeps both invalid primary and invalid backup when recovery cannot validate', async () => {
  const storage = new MemoryStorage(),
    saves = new SaveManager(storage);
  await saves.save('slot', 1);
  await storage.set('slot', '{primary');
  const backupKey = (await storage.keys()).find((key) =>
    key.includes('backup:'),
  )!;
  await storage.set(backupKey, '{backup');
  expect(await saves.load('slot', { recovery: true })).toMatchObject({
    status: 'corrupt',
    raw: '{primary',
  });
  await expect(saves.restore('slot')).rejects.toBeInstanceOf(Error);
  expect(await storage.get('slot')).toBe('{primary');
  expect(await storage.get(backupKey)).toBe('{backup');
});
it('aborts queued writes without cancelling a primary already issued to a custom backend', async () => {
  const backend = delayedStorage(),
    saves = new SaveManager(backend.storage);
  const first = saves.save('slot', 1);
  await backend.entered.promise;
  const controller = new AbortController();
  const second = saves.save('slot', 2, 0, { signal: controller.signal });
  controller.abort();
  backend.delayed.release();
  await first;
  await expect(second).rejects.toMatchObject({ name: 'AbortError' });
  expect(await saves.load('slot')).toMatchObject({
    status: 'loaded',
    record: { data: 1 },
  });
});
it('cancels pending migration promptly and leaves the stored original unchanged', async () => {
  const storage = new MemoryStorage();
  await new SaveManager(storage).save('slot', 1);
  const original = await storage.get('slot');
  const entered = gate(),
    migration = gate();
  const saves = new SaveManager(storage, {
    version: 2,
    async migrate(_version, data) {
      entered.release();
      await migration.promise;
      return data;
    },
  });
  const controller = new AbortController();
  const load = saves.load('slot', { signal: controller.signal });
  await entered.promise;
  controller.abort();
  await expect(load).rejects.toMatchObject({ name: 'AbortError' });
  expect(await storage.get('slot')).toBe(original);
  migration.release();
});
it('teardown aborts pending migration and denies later writes', async () => {
  const storage = new MemoryStorage();
  await new SaveManager(storage).save('slot', 1);
  const entered = gate(),
    migration = gate();
  const saves = new SaveManager(storage, {
    version: 2,
    async migrate(_version, data) {
      entered.release();
      await migration.promise;
      return data;
    },
  });
  const pending = saves.load('slot');
  await entered.promise;
  saves.destroy();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await expect(saves.save('slot', 2)).rejects.toMatchObject({
    name: 'AbortError',
  });
  migration.release();
});
it('requires native Web Locks rather than pretending localStorage is cross-tab safe', async () => {
  vi.stubGlobal('navigator', {});
  const saves = new SaveManager(new LocalStorageBackend('missing-locks'));
  await expect(saves.save('slot', 1)).rejects.toMatchObject({
    code: 'unsupported',
  });
});
it('exposes autosave failure, never retries silently, and explicitly retries the latest state', async () => {
  vi.useFakeTimers();
  const storage = new MemoryStorage();
  let failing = true,
    attempts = 0,
    score = 1;
  const backend: SaveStorage = {
    get: storage.get.bind(storage),
    remove: storage.remove.bind(storage),
    keys: storage.keys.bind(storage),
    clear: storage.clear.bind(storage),
    async set(key, value) {
      if (key === 'slot') {
        attempts++;
        if (failing) throw new StorageError('quota', 'full');
      }
      await storage.set(key, value);
    },
  };
  const saves = new SaveManager(backend),
    states: AutosaveState[] = [];
  const autosave = new AutosaveController(saves, {
    slot: 'slot',
    intervalMs: 20,
    capture: () => ({ score }),
    onState: (state) => states.push(state),
  });
  autosave.request();
  await expect(autosave.flush()).rejects.toMatchObject({ code: 'quota' });
  expect(autosave.state).toMatchObject({
    status: 'error',
    retryRequired: true,
    pendingChanges: true,
  });
  expect(states.some((state) => state.status === 'saved')).toBe(false);
  score = 2;
  autosave.request();
  await vi.advanceTimersByTimeAsync(200);
  expect(attempts).toBe(1);
  failing = false;
  await autosave.retry();
  expect(autosave.state).toMatchObject({
    status: 'saved',
    retryRequired: false,
    pendingChanges: false,
  });
  expect(await saves.load('slot')).toMatchObject({
    status: 'loaded',
    record: { data: { score: 2 } },
  });
  autosave.destroy();
});
it('flush drains changes that arrive while a write is pending, and teardown cancels timers', async () => {
  vi.useFakeTimers();
  const backend = delayedStorage(),
    saves = new SaveManager(backend.storage);
  let value = 1;
  const autosave = new AutosaveController(saves, {
    slot: 'slot',
    capture: () => value,
    intervalMs: 20,
  });
  autosave.request();
  const flushing = autosave.flush();
  await backend.entered.promise;
  value = 2;
  autosave.request();
  backend.delayed.release();
  expect((await flushing)?.data).toBe(2);
  expect(autosave.state).toMatchObject({
    status: 'saved',
    pendingChanges: false,
    revision: 2,
  });
  value = 3;
  autosave.request();
  autosave.destroy();
  await vi.advanceTimersByTimeAsync(100);
  expect(await saves.load('slot')).toMatchObject({
    status: 'loaded',
    record: { data: 2 },
  });
  expect(autosave.state.status).toBe('destroyed');
});

it('reads the original envelope format, migrates sequentially, and leaves raw legacy data unchanged', async () => {
  const storage = new MemoryStorage();
  const payload = JSON.stringify({
    version: 1,
    data: { score: 1 },
    metadata: { savedAt: '2026-01-01T00:00:00.000Z', playTime: 2 },
  });
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index++)
    hash = Math.imul(hash ^ payload.charCodeAt(index), 16777619);
  const raw = JSON.stringify({ payload, checksum: (hash >>> 0).toString(16) });
  await storage.set('slot', raw);
  const migrated = new SaveManager(storage, {
    version: 2,
    migrate(_version, data) {
      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        typeof data.score !== 'number'
      )
        throw new StorageError('invalid', 'Expected score data.');
      return { score: data.score + 1 };
    },
  });
  expect(await migrated.load('slot')).toMatchObject({
    status: 'loaded',
    record: { version: 2, revision: 0, data: { score: 2 } },
  });
  expect(await storage.get('slot')).toBe(raw);
  expect((await migrated.save('slot', { score: 3 })).revision).toBe(1);
});

it('rejects recovery prepared against an older primary when another owner commits during migration', async () => {
  const entries = new Map<string, string>();
  const storage = new MemoryStorage('recovery-race', entries);
  const writer = new SaveManager(storage);
  await writer.save('slot', 1);
  await writer.save('slot', 2);
  await storage.set('slot', '{corrupt');
  const entered = gate(),
    migration = gate();
  const recovering = new SaveManager(
    new MemoryStorage('recovery-race', entries),
    {
      version: 2,
      async migrate(_version, data) {
        entered.release();
        await migration.promise;
        return data;
      },
    },
  );
  const pending = recovering.restore('slot');
  await entered.promise;
  const concurrent = await writer.restore('slot');
  migration.release();
  await expect(pending).rejects.toMatchObject({ code: 'stale' });
  expect(await writer.load('slot')).toMatchObject({
    status: 'loaded',
    record: concurrent,
  });
});

it('returns a clean cancelled autosave to idle on explicit retry without writing a checkpoint', async () => {
  const saves = new SaveManager();
  const autosave = new AutosaveController(saves, {
    slot: 'slot',
    capture: () => 1,
  });
  autosave.cancel();
  expect(autosave.state.status).toBe('cancelled');
  expect(await autosave.retry()).toBeNull();
  expect(autosave.state).toMatchObject({
    status: 'idle',
    pendingChanges: false,
  });
  expect(await saves.load('slot')).toEqual({ status: 'missing' });
  autosave.destroy();
});
