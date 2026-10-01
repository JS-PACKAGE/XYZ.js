import { storageLimits } from '../../../src/data/storage.js';

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type StorageErrorCode =
  'unavailable' | 'quota' | 'size' | 'invalid' | 'io';
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
export interface SaveStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
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
}

export class LocalStorageBackend implements SaveStorage {
  private readonly prefix: string;
  constructor(
    namespace = 'default',
    private readonly storage?: Storage,
  ) {
    this.prefix = prefix(namespace);
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
        request.onupgradeneeded = () =>
          request.result.createObjectStore('saves');
        request.onerror = () => reject(failure(request.error));
        request.onblocked = () =>
          reject(new StorageError('io', 'IndexedDB open is blocked.'));
        request.onsuccess = () => resolve(request.result);
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
  data: JsonValue;
  metadata: SaveMetadata;
}
export type SaveLoadResult =
  | { status: 'missing' }
  | { status: 'loaded'; record: SaveRecord }
  | { status: 'corrupt'; raw: string; error: StorageError };
function checksum(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++)
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}

export class SaveManager {
  private readonly schema: SaveSchema;
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
  private validate(data: unknown): asserts data is JsonValue {
    assertJsonValue(data);
    if (this.schema.validate && !this.schema.validate(data))
      throw new StorageError('invalid', 'Save data failed schema validation.');
  }
  async save(slot: string, data: JsonValue, playTime = 0): Promise<SaveRecord> {
    this.validate(data);
    if (!Number.isFinite(playTime) || playTime < 0)
      throw new StorageError(
        'invalid',
        'playTime must be finite and nonnegative.',
      );
    const record: SaveRecord = {
      version: this.schema.version,
      data,
      metadata: { savedAt: new Date().toISOString(), playTime },
    };
    const payload = JSON.stringify(record);
    await this.storage.set(
      slot,
      JSON.stringify({ payload, checksum: checksum(payload) }),
    );
    return JSON.parse(payload) as SaveRecord;
  }
  async load(slot: string): Promise<SaveLoadResult> {
    const raw = await this.storage.get(slot);
    if (raw === null) return { status: 'missing' };
    try {
      const envelope = JSON.parse(raw) as {
        payload?: unknown;
        checksum?: unknown;
      };
      if (
        !envelope ||
        typeof envelope.payload !== 'string' ||
        envelope.checksum !== checksum(envelope.payload)
      )
        throw new Error('Invalid save envelope or checksum.');
      const record = JSON.parse(envelope.payload) as SaveRecord;
      assertJsonValue(record);
      if (
        !record ||
        !Number.isSafeInteger(record.version) ||
        record.version < 1 ||
        record.version > this.schema.version ||
        !record.metadata ||
        typeof record.metadata.savedAt !== 'string' ||
        !Number.isFinite(Date.parse(record.metadata.savedAt)) ||
        !Number.isFinite(record.metadata.playTime) ||
        record.metadata.playTime < 0
      )
        throw new Error('Invalid save version or metadata.');
      assertJsonValue(record.data);
      while (record.version < this.schema.version) {
        if (!this.schema.migrate)
          throw new Error(`Missing migration from version ${record.version}.`);
        record.data = await this.schema.migrate(record.version, record.data);
        assertJsonValue(record.data);
        record.version++;
      }
      this.validate(record.data);
      return { status: 'loaded', record };
    } catch (cause) {
      return {
        status: 'corrupt',
        raw,
        error: new StorageError(
          'invalid',
          'Save is corrupt or incompatible; original payload was preserved.',
          { cause },
        ),
      };
    }
  }
  async remove(slot: string): Promise<void> {
    await this.storage.remove(slot);
  }
  async slots(): Promise<string[]> {
    return this.storage.keys();
  }
  async clear(): Promise<void> {
    await this.storage.clear();
  }
}
