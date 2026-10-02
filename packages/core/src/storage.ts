import { storageLimits } from '../../../src/data/storage.js';
import { subscribeLoad } from '../../assets/src/preload/subscribe-load.js';

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type StorageErrorCode =
  'unavailable' | 'quota' | 'size' | 'invalid' | 'io' | 'stale' | 'unsupported';
export class StorageError extends Error {
  constructor(
    readonly code: StorageErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'StorageError';
  }
}

/** Reject values JSON would silently discard or coerce. Shared references are allowed. */
export function assertJsonValue(value: unknown): asserts value is JsonValue {
  const ancestors = new Set<object>();
  const visit = (item: unknown, path: string): void => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean')
      return;
    if (typeof item === 'number' && Number.isFinite(item)) return;
    if (typeof item !== 'object' || item === null)
      throw new StorageError('invalid', `Invalid JSON value at ${path}.`);
    if (ancestors.has(item))
      throw new StorageError('invalid', `JSON cycle at ${path}.`);
    if (
      !Array.isArray(item) &&
      Object.getPrototypeOf(item) !== Object.prototype &&
      Object.getPrototypeOf(item) !== null
    )
      throw new StorageError(
        'invalid',
        `JSON requires plain objects at ${path}.`,
      );
    ancestors.add(item);
    if (Reflect.ownKeys(item).some((key) => typeof key === 'symbol'))
      throw new StorageError('invalid', `JSON symbol key at ${path}.`);
    if (Array.isArray(item)) {
      for (let i = 0; i < item.length; i++) visit(item[i], `${path}[${i}]`);
      if (Object.keys(item).length !== item.length)
        throw new StorageError('invalid', `JSON array properties at ${path}.`);
    } else {
      for (const key of Object.getOwnPropertyNames(item)) {
        const descriptor = Object.getOwnPropertyDescriptor(item, key)!;
        if (!descriptor.enumerable || !('value' in descriptor))
          throw new StorageError(
            'invalid',
            `JSON requires enumerable data properties at ${path}.${key}.`,
          );
        visit(descriptor.value, `${path}.${key}`);
      }
    }
    ancestors.delete(item);
  };
  visit(value, '$');
}

/** String storage scoped to a namespace. clear never affects other namespaces. */
export type StorageCoordination = 'process' | 'web-locks' | 'indexeddb';
export interface StorageMutation<T> {
  readonly values: readonly (string | null)[] | null;
  readonly result: T;
}
export interface SaveStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  /** The callback is synchronous; native implementations commit all supplied keys atomically
   * (Web Locks serialize localStorage, whose multi-key writes are not crash-atomic). */
  mutate?<T>(
    keys: readonly string[],
    update: (values: readonly (string | null)[]) => StorageMutation<T>,
  ): Promise<T>;
  readonly coordination?: StorageCoordination;
}
function checkMutation<T>(
  keys: readonly string[],
  mutation: StorageMutation<T>,
): void {
  if (mutation.values === null) return;
  if (mutation.values.length !== keys.length)
    throw new StorageError(
      'invalid',
      'Storage mutation key/value count differs.',
    );
  for (const value of mutation.values) if (value !== null) checkSize(value);
}
function prefix(namespace: string): string {
  if (!namespace)
    throw new StorageError('invalid', 'Storage namespace must not be empty.');
  return `xyz:${encodeURIComponent(namespace)}:`;
}
function checkSize(value: string): void {
  if (typeof value !== 'string')
    throw new StorageError('invalid', 'Storage value must be a string.');
  if (new TextEncoder().encode(value).byteLength > storageLimits.maxBytes)
    throw new StorageError(
      'size',
      `Save exceeds ${storageLimits.maxBytes} bytes.`,
    );
}
function failure(cause: unknown): StorageError {
  if (cause instanceof StorageError) return cause;
  return new StorageError(
    cause instanceof Error && cause.name === 'QuotaExceededError'
      ? 'quota'
      : 'io',
    'Save storage operation failed.',
    { cause },
  );
}

export class MemoryStorage implements SaveStorage {
  private readonly prefix: string;
  readonly coordination = 'process' as const;
  constructor(
    namespace = 'default',
    private readonly entries = new Map<string, string>(),
  ) {
    this.prefix = prefix(namespace);
  }
  async get(key: string): Promise<string | null> {
    return this.entries.get(this.prefix + key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    checkSize(value);
    this.entries.set(this.prefix + key, value);
  }
  async remove(key: string): Promise<void> {
    this.entries.delete(this.prefix + key);
  }
  async keys(): Promise<string[]> {
    return [...this.entries.keys()]
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.slice(this.prefix.length));
  }
  async clear(): Promise<void> {
    for (const key of await this.keys()) await this.remove(key);
  }
  async mutate<T>(
    keys: readonly string[],
    update: (values: readonly (string | null)[]) => StorageMutation<T>,
  ): Promise<T> {
    const mutation = update(
      keys.map((key) => this.entries.get(this.prefix + key) ?? null),
    );
    checkMutation(keys, mutation);
    if (mutation.values === null) return mutation.result;
    const nextValues = mutation.values;
    keys.forEach((key, index) => {
      const value = nextValues[index]!;
      if (value === null) this.entries.delete(this.prefix + key);
      else this.entries.set(this.prefix + key, value);
    });
    return mutation.result;
  }
}

export class LocalStorageBackend implements SaveStorage {
  private readonly prefix: string;
  constructor(
    namespace = 'default',
    private readonly storage?: Storage,
  ) {
    this.prefix = prefix(namespace);
  }
  get coordination(): StorageCoordination {
    if (!globalThis.navigator?.locks)
      throw new StorageError(
        'unsupported',
        'Safe localStorage saves require native Web Locks.',
      );
    return 'web-locks';
  }
  async mutate<T>(
    keys: readonly string[],
    update: (values: readonly (string | null)[]) => StorageMutation<T>,
  ): Promise<T> {
    const locks = globalThis.navigator?.locks;
    if (!locks)
      throw new StorageError(
        'unsupported',
        'Safe localStorage saves require native Web Locks.',
      );
    try {
      return await locks.request(this.prefix + 'save-owner', () => {
        const storage = this.handle();
        const mutation = update(
          keys.map((key) => storage.getItem(this.prefix + key)),
        );
        checkMutation(keys, mutation);
        if (mutation.values === null) return mutation.result;
        // Backup precedes primary. A quota failure must not replace the previous primary.
        for (let i = keys.length - 1; i >= 0; i--) {
          const value = mutation.values[i]!;
          if (value === null) storage.removeItem(this.prefix + keys[i]!);
          else storage.setItem(this.prefix + keys[i]!, value);
        }
        return mutation.result;
      });
    } catch (cause) {
      throw failure(cause);
    }
  }
  private handle(): Storage {
    try {
      const handle = this.storage ?? globalThis.localStorage;
      if (!handle) throw new Error('localStorage is unavailable.');
      return handle;
    } catch (cause) {
      throw new StorageError('unavailable', 'localStorage is unavailable.', {
        cause,
      });
    }
  }
  async get(key: string): Promise<string | null> {
    try {
      return this.handle().getItem(this.prefix + key);
    } catch (cause) {
      throw failure(cause);
    }
  }
  async set(key: string, value: string): Promise<void> {
    checkSize(value);
    try {
      this.handle().setItem(this.prefix + key, value);
    } catch (cause) {
      throw failure(cause);
    }
  }
  async remove(key: string): Promise<void> {
    try {
      this.handle().removeItem(this.prefix + key);
    } catch (cause) {
      throw failure(cause);
    }
  }
  async keys(): Promise<string[]> {
    try {
      const storage = this.handle();
      const result: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(this.prefix))
          result.push(key.slice(this.prefix.length));
      }
      return result;
    } catch (cause) {
      throw failure(cause);
    }
  }
  async clear(): Promise<void> {
    for (const key of await this.keys()) await this.remove(key);
  }
}

export class IndexedDBStorage implements SaveStorage {
  private readonly prefix: string;
  readonly coordination = 'indexeddb' as const;
  constructor(
    namespace = 'default',
    private readonly database = 'xyz-saves',
  ) {
    this.prefix = prefix(namespace);
  }
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new StorageError('unavailable', 'IndexedDB is unavailable.'));
        return;
      }
      try {
        const request = globalThis.indexedDB.open(this.database, 1);
        let settled = false;
        request.onupgradeneeded = () =>
          request.result.createObjectStore('saves');
        request.onerror = () => {
          settled = true;
          reject(failure(request.error));
        };
        request.onblocked = () => {
          settled = true;
          reject(new StorageError('io', 'IndexedDB open is blocked.'));
        };
        request.onsuccess = () => {
          if (settled) {
            request.result.close();
            return;
          }
          settled = true;
          request.result.onversionchange = () => request.result.close();
          resolve(request.result);
        };
      } catch (cause) {
        reject(failure(cause));
      }
    });
  }
  private async run<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      try {
        const transaction = db.transaction('saves', mode);
        const request = operation(transaction.objectStore('saves'));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onabort = () => {
          db.close();
          reject(failure(transaction.error ?? request.error));
        };
        transaction.onerror = () => {
          /* onabort owns rejection and closing. */
        };
      } catch (cause) {
        db.close();
        reject(failure(cause));
      }
    });
  }
  async mutate<T>(
    keys: readonly string[],
    update: (values: readonly (string | null)[]) => StorageMutation<T>,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      let error: unknown;
      let result: T;
      try {
        const transaction = db.transaction('saves', 'readwrite');
        const store = transaction.objectStore('saves');
        const values: (string | null)[] = new Array(keys.length).fill(null);
        let remaining = keys.length;
        transaction.oncomplete = () => {
          db.close();
          resolve(result);
        };
        transaction.onabort = () => {
          db.close();
          reject(failure(error ?? transaction.error));
        };
        const apply = () => {
          try {
            const mutation = update(values);
            checkMutation(keys, mutation);
            result = mutation.result;
            if (mutation.values === null) return;
            const nextValues = mutation.values;
            keys.forEach((key, index) => {
              const value = nextValues[index]!;
              if (value === null) store.delete(this.prefix + key);
              else store.put(value, this.prefix + key);
            });
          } catch (cause) {
            error = cause;
            transaction.abort();
          }
        };
        if (!remaining) apply();
        keys.forEach((key, index) => {
          const request = store.get(this.prefix + key);
          request.onsuccess = () => {
            const value: unknown = request.result;
            if (value !== undefined && typeof value !== 'string') {
              error = new StorageError(
                'invalid',
                'Stored IndexedDB value is not a string.',
              );
              transaction.abort();
              return;
            }
            values[index] = value === undefined ? null : (value as string);
            if (!--remaining) apply();
          };
        });
      } catch (cause) {
        db.close();
        reject(failure(cause));
      }
    });
  }
  async get(key: string): Promise<string | null> {
    const value: unknown = await this.run('readonly', (store) =>
      store.get(this.prefix + key),
    );
    if (value === undefined) return null;
    if (typeof value !== 'string')
      throw new StorageError(
        'invalid',
        'Stored IndexedDB value is not a string.',
      );
    return value;
  }
  async set(key: string, value: string): Promise<void> {
    checkSize(value);
    await this.run('readwrite', (store) => store.put(value, this.prefix + key));
  }
  async remove(key: string): Promise<void> {
    await this.run('readwrite', (store) => store.delete(this.prefix + key));
  }
  async keys(): Promise<string[]> {
    const keys = await this.run('readonly', (store) => store.getAllKeys());
    return keys
      .filter(
        (key): key is string =>
          typeof key === 'string' && key.startsWith(this.prefix),
      )
      .map((key) => key.slice(this.prefix.length));
  }
  async clear(): Promise<void> {
    await this.run('readwrite', (store) => {
      const range = IDBKeyRange.bound(this.prefix, this.prefix + '\uffff');
      return store.delete(range);
    });
  }
}

export interface SaveSchema {
  version: number;
  /** Each call upgrades exactly one version; fromVersion starts at the stored version. */
  migrate?: (
    fromVersion: number,
    data: JsonValue,
  ) => JsonValue | Promise<JsonValue>;
  validate?: (data: JsonValue) => boolean;
}
export interface SaveMetadata {
  savedAt: string;
  playTime: number;
}
export interface SaveRecord {
  version: number;
  /** Legacy records load at revision zero. Revisions never reset when a slot is removed. */
  revision: number;
  data: JsonValue;
  metadata: SaveMetadata;
}
export type SaveLoadResult =
  | { status: 'missing' }
  | { status: 'loaded'; record: SaveRecord; recovery?: SaveRecovery }
  | { status: 'corrupt'; raw: string; error: StorageError };
function checksum(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++)
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
export interface SaveRecovery {
  readonly raw: string;
  readonly error: StorageError;
}
export interface SaveWriteOptions {
  readonly expectedRevision?: number;
  readonly signal?: AbortSignal;
}
export interface SaveReadOptions {
  readonly signal?: AbortSignal;
  /** Read the valid backup without replacing or deleting the corrupt primary. */
  readonly recovery?: boolean;
}
const internalPrefix = '__xyz_save__:';
function slotKeys(slot: string): readonly string[] {
  if (!slot || slot.startsWith(internalPrefix))
    throw new StorageError(
      'invalid',
      'Save slot must be nonempty and not reserved.',
    );
  const suffix = encodeURIComponent(slot);
  // Reverse write order leaves the primary intact if backup allocation fails on localStorage.
  return [
    internalPrefix + 'revision:' + suffix,
    slot,
    internalPrefix + 'backup:' + suffix,
    internalPrefix + 'corrupt:' + suffix,
  ];
}
function parseStoredJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (cause) {
    throw new StorageError('invalid', 'Stored save JSON is invalid.', {
      cause,
    });
  }
}
function decode(raw: string): SaveRecord {
  const envelope = parseStoredJson(raw);
  if (
    !envelope ||
    typeof envelope !== 'object' ||
    !('payload' in envelope) ||
    typeof envelope.payload !== 'string' ||
    !('checksum' in envelope) ||
    envelope.checksum !== checksum(envelope.payload)
  )
    throw new StorageError('invalid', 'Invalid save envelope or checksum.');
  const record = parseStoredJson(envelope.payload);
  assertJsonValue(record);
  if (
    !record ||
    typeof record !== 'object' ||
    Array.isArray(record) ||
    typeof record.version !== 'number' ||
    !Number.isSafeInteger(record.version) ||
    record.version < 1 ||
    !record.metadata ||
    typeof record.metadata !== 'object' ||
    Array.isArray(record.metadata) ||
    typeof record.metadata.savedAt !== 'string' ||
    !Number.isFinite(Date.parse(record.metadata.savedAt)) ||
    typeof record.metadata.playTime !== 'number' ||
    !Number.isFinite(record.metadata.playTime) ||
    record.metadata.playTime < 0
  )
    throw new StorageError('invalid', 'Invalid save version or metadata.');
  if (!('revision' in record)) record.revision = 0;
  if (
    typeof record.revision !== 'number' ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 0
  )
    throw new StorageError('invalid', 'Invalid save revision.');
  assertJsonValue(record.data);
  // All persisted fields were checked above; JsonValue's index signature cannot express this record.
  return record as unknown as SaveRecord;
}
function encode(record: SaveRecord): string {
  const payload = JSON.stringify(record);
  return JSON.stringify({ payload, checksum: checksum(payload) });
}
function revisionOf(values: readonly (string | null)[]): number {
  let revision = 0;
  if (values[0] !== null) {
    revision = Number(values[0]);
    if (!Number.isSafeInteger(revision) || revision < 0)
      throw new StorageError('invalid', 'Save revision marker is corrupt.');
  }
  if (values[1] !== null) {
    try {
      revision = Math.max(revision, decode(values[1]!).revision);
    } catch {
      /* The independent revision marker survives primary corruption. */
    }
  }
  return revision;
}
const storageQueues = new WeakMap<SaveStorage, Promise<void>>();
function ordered<T>(
  storage: SaveStorage,
  operation: () => Promise<T>,
): Promise<T> {
  const before = storageQueues.get(storage) ?? Promise.resolve();
  const result = before.then(operation);
  const settled = result.then(
    () => {},
    () => {},
  );
  storageQueues.set(storage, settled);
  void settled.then(() => {
    if (storageQueues.get(storage) === settled) storageQueues.delete(storage);
  });
  return result;
}

/** Same-process calls are ordered; native transactions/Web Locks also arbitrate other tabs.
 * Blind first writes read the current revision atomically; observed/explicit revisions reject stale data. */
export class SaveManager {
  private readonly schema: SaveSchema;
  private readonly revisions = new Map<string, number>();
  private disposed = false;
  private readonly lifetime = new AbortController();
  constructor(
    private readonly storage: SaveStorage = new MemoryStorage(),
    schema: SaveSchema = { version: 1 },
  ) {
    if (!Number.isSafeInteger(schema.version) || schema.version < 1)
      throw new StorageError(
        'invalid',
        'Save version must be a positive safe integer.',
      );
    this.schema = { ...schema };
  }
  get coordination(): StorageCoordination {
    return this.storage.coordination ?? 'process';
  }
  private assertActive(signal?: AbortSignal): void {
    signal?.throwIfAborted();
    if (this.disposed)
      throw new DOMException('Save owner is destroyed.', 'AbortError');
  }
  private validate(data: unknown): asserts data is JsonValue {
    assertJsonValue(data);
    if (this.schema.validate && !this.schema.validate(data))
      throw new StorageError('invalid', 'Save data failed schema validation.');
  }
  private async mutate<T>(
    keys: readonly string[],
    update: (values: readonly (string | null)[]) => StorageMutation<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    this.assertActive(signal);
    if (this.storage.mutate) {
      try {
        return await this.storage.mutate(keys, update);
      } catch (error) {
        // Native storage converts transaction errors, but cancellation keeps the owner's reason.
        this.assertActive(signal);
        throw error;
      }
    }
    // Custom backends only promise process-local ordering, never cross-tab ownership.
    const current = await Promise.all(keys.map((key) => this.storage.get(key)));
    const mutation = update(current);
    checkMutation(keys, mutation);
    if (mutation.values !== null) {
      for (let i = keys.length - 1; i >= 0; i--) {
        // Once primary has been issued, finish its revision marker even if the owner cancels.
        if (i > 0) this.assertActive(signal);
        const value = mutation.values[i]!;
        if (value === null) await this.storage.remove(keys[i]!);
        else await this.storage.set(keys[i]!, value);
      }
    }
    return mutation.result;
  }
  private expected(
    slot: string,
    options: SaveWriteOptions,
    actual: number,
  ): void {
    const expected =
      options.expectedRevision ?? this.revisions.get(slot) ?? actual;
    if (!Number.isSafeInteger(expected) || expected < 0)
      throw new StorageError(
        'invalid',
        'Expected revision must be a nonnegative safe integer.',
      );
    if (actual !== expected)
      throw new StorageError(
        'stale',
        `Save revision changed: expected ${expected}, found ${actual}.`,
      );
    if (actual === Number.MAX_SAFE_INTEGER)
      throw new StorageError('invalid', 'Save revision is exhausted.');
  }
  async save(
    slot: string,
    data: JsonValue,
    playTime = 0,
    options: SaveWriteOptions = {},
  ): Promise<SaveRecord> {
    this.assertActive(options.signal);
    this.validate(data);
    if (!Number.isFinite(playTime) || playTime < 0)
      throw new StorageError(
        'invalid',
        'playTime must be finite and nonnegative.',
      );
    const keys = slotKeys(slot);
    // Capture at invocation, not after waiting behind an older asynchronous backend write.
    const snapshot = JSON.stringify(data);
    return ordered(this.storage, async () => {
      const record = await this.mutate(
        keys,
        (values) => {
          this.assertActive(options.signal);
          const revision = revisionOf(values);
          this.expected(slot, options, revision);
          let backup = values[2]!;
          if (values[1] !== null) {
            const previous = decode(values[1]!); // Do not silently overwrite corrupt payloads.
            if (previous.version > this.schema.version)
              throw new StorageError(
                'invalid',
                'Cannot overwrite a future save version.',
              );
            if (previous.version === this.schema.version)
              this.validate(previous.data);
            backup = values[1]!;
          }
          const next: SaveRecord = {
            version: this.schema.version,
            revision: revision + 1,
            data: JSON.parse(snapshot) as JsonValue,
            metadata: { savedAt: new Date().toISOString(), playTime },
          };
          const raw = encode(next);
          return {
            values: [String(next.revision), raw, backup ?? raw, values[3]!],
            result: next,
          };
        },
        options.signal,
      );
      this.revisions.set(slot, record.revision);
      return record;
    });
  }
  private async migrate(
    raw: string,
    signal?: AbortSignal,
  ): Promise<SaveRecord> {
    const record = decode(raw);
    if (record.version > this.schema.version)
      throw new StorageError(
        'invalid',
        'Save version is newer than this schema.',
      );
    while (record.version < this.schema.version) {
      this.assertActive(signal);
      if (!this.schema.migrate)
        throw new StorageError(
          'invalid',
          `Missing migration from version ${record.version}.`,
        );
      const lifetime = signal
        ? AbortSignal.any([signal, this.lifetime.signal])
        : this.lifetime.signal;
      record.data = await subscribeLoad(
        Promise.resolve(this.schema.migrate(record.version, record.data)),
        lifetime,
      );
      this.assertActive(signal);
      assertJsonValue(record.data);
      record.version++;
    }
    this.validate(record.data);
    return record;
  }
  async load(
    slot: string,
    options: SaveReadOptions = {},
  ): Promise<SaveLoadResult> {
    const keys = slotKeys(slot);
    return ordered<SaveLoadResult>(this.storage, async () => {
      this.assertActive(options.signal);
      const values = await this.mutate(
        keys,
        (current) => ({ values: null, result: current }),
        options.signal,
      );
      this.assertActive(options.signal);
      const revision = revisionOf(values);
      const raw = values[1]!;
      if (raw === null) {
        this.revisions.set(slot, revision);
        return { status: 'missing' };
      }
      try {
        const record = await this.migrate(raw, options.signal);
        this.assertActive(options.signal);
        this.revisions.set(slot, revision);
        return { status: 'loaded', record };
      } catch (cause) {
        this.assertActive(options.signal);
        const error = new StorageError(
          'invalid',
          'Save is corrupt or incompatible; original payload was preserved.',
          { cause },
        );
        if (options.recovery && values[2] !== null) {
          try {
            const record = await this.migrate(values[2]!, options.signal);
            this.assertActive(options.signal);
            this.revisions.set(slot, revision);
            return { status: 'loaded', record, recovery: { raw, error } };
          } catch {
            this.assertActive(options.signal);
          }
        }
        return { status: 'corrupt', raw, error };
      }
    });
  }
  /** Explicitly restore backup; retain the exact damaged primary under its forensic key. */
  async restore(
    slot: string,
    options: SaveWriteOptions = {},
  ): Promise<SaveRecord> {
    const keys = slotKeys(slot);
    return ordered(this.storage, async () => {
      this.assertActive(options.signal);
      const before = await this.mutate(
        keys,
        (values) => ({ values: null, result: values }),
        options.signal,
      );
      if (before[1] === null || before[2] === null)
        throw new StorageError(
          'invalid',
          'Recovery requires a primary and valid backup.',
        );
      const recovered = await this.migrate(before[2]!, options.signal);
      const record = await this.mutate(
        keys,
        (current) => {
          this.assertActive(options.signal);
          if (current.some((value, index) => value !== before[index]))
            throw new StorageError(
              'stale',
              'Save changed while recovery was preparing.',
            );
          const revision = revisionOf(current);
          this.expected(slot, options, revision);
          recovered.revision = revision + 1;
          recovered.metadata.savedAt = new Date().toISOString();
          const damaged: unknown =
            current[3] === null ? [] : parseStoredJson(current[3]!);
          if (
            !Array.isArray(damaged) ||
            damaged.some((value: unknown) => typeof value !== 'string')
          )
            throw new StorageError(
              'invalid',
              'Damaged-payload archive is corrupt; it was preserved.',
            );
          if (!damaged.includes(current[1]!)) damaged.push(current[1]!);
          return {
            values: [
              String(recovered.revision),
              encode(recovered),
              current[2]!,
              JSON.stringify(damaged),
            ],
            result: recovered,
          };
        },
        options.signal,
      );
      this.revisions.set(slot, record.revision);
      return record;
    });
  }
  async damagedPayload(slot: string): Promise<string | null> {
    const damaged = await this.damagedPayloads(slot);
    return damaged[damaged.length - 1] ?? null;
  }
  async damagedPayloads(slot: string): Promise<readonly string[]> {
    this.assertActive();
    const raw = await this.storage.get(slotKeys(slot)[3]!);
    if (raw === null) return [];
    const damaged = parseStoredJson(raw);
    if (
      !Array.isArray(damaged) ||
      damaged.some((value: unknown) => typeof value !== 'string')
    )
      throw new StorageError(
        'invalid',
        'Damaged-payload archive is corrupt; it was preserved.',
      );
    return damaged as string[];
  }
  async remove(slot: string, options: SaveWriteOptions = {}): Promise<void> {
    const keys = slotKeys(slot);
    await ordered(this.storage, async () => {
      const revision = await this.mutate(
        keys,
        (values) => {
          this.assertActive(options.signal);
          const current = revisionOf(values);
          this.expected(slot, options, current);
          return {
            values: [String(current + 1), null, null, values[3]!],
            result: current + 1,
          };
        },
        options.signal,
      );
      this.revisions.set(slot, revision);
    });
  }
  async slots(): Promise<string[]> {
    this.assertActive();
    return (await this.storage.keys()).filter(
      (key) => !key.startsWith(internalPrefix),
    );
  }
  async clear(options: { signal?: AbortSignal } = {}): Promise<void> {
    for (const slot of await this.slots()) {
      await this.load(slot, options);
      await this.remove(slot, options);
    }
  }
  /** Queued/precommit work aborts. Already-issued custom writes drain; they cannot be revoked. */
  destroy(): void {
    this.disposed = true;
    this.lifetime.abort(
      new DOMException('Save owner is destroyed.', 'AbortError'),
    );
  }
}
