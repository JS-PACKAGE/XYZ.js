export type JsonValue = null | boolean | number | string | JsonValue[] | {
    [key: string]: JsonValue;
};
export type StorageErrorCode = 'unavailable' | 'quota' | 'size' | 'invalid' | 'io' | 'stale' | 'unsupported';
export declare class StorageError extends Error {
    readonly code: StorageErrorCode;
    constructor(code: StorageErrorCode, message: string, options?: ErrorOptions);
}
/** Reject values JSON would silently discard or coerce. Shared references are allowed. */
export declare function assertJsonValue(value: unknown): asserts value is JsonValue;
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
    mutate?<T>(keys: readonly string[], update: (values: readonly (string | null)[]) => StorageMutation<T>): Promise<T>;
    readonly coordination?: StorageCoordination;
}
export declare class MemoryStorage implements SaveStorage {
    private readonly entries;
    private readonly prefix;
    readonly coordination: "process";
    constructor(namespace?: string, entries?: Map<string, string>);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
    mutate<T>(keys: readonly string[], update: (values: readonly (string | null)[]) => StorageMutation<T>): Promise<T>;
}
export declare class LocalStorageBackend implements SaveStorage {
    private readonly storage?;
    private readonly prefix;
    constructor(namespace?: string, storage?: Storage | undefined);
    get coordination(): StorageCoordination;
    mutate<T>(keys: readonly string[], update: (values: readonly (string | null)[]) => StorageMutation<T>): Promise<T>;
    private handle;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
}
export declare class IndexedDBStorage implements SaveStorage {
    private readonly database;
    private readonly prefix;
    readonly coordination: "indexeddb";
    constructor(namespace?: string, database?: string);
    private open;
    private run;
    mutate<T>(keys: readonly string[], update: (values: readonly (string | null)[]) => StorageMutation<T>): Promise<T>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
}
export interface SaveSchema {
    version: number;
    /** Each call upgrades exactly one version; fromVersion starts at the stored version. */
    migrate?: (fromVersion: number, data: JsonValue) => JsonValue | Promise<JsonValue>;
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
export type SaveLoadResult = {
    status: 'missing';
} | {
    status: 'loaded';
    record: SaveRecord;
    recovery?: SaveRecovery;
} | {
    status: 'corrupt';
    raw: string;
    error: StorageError;
};
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
/** Same-process calls are ordered; native transactions/Web Locks also arbitrate other tabs.
 * Blind first writes read the current revision atomically; observed/explicit revisions reject stale data. */
export declare class SaveManager {
    private readonly storage;
    private readonly schema;
    private readonly revisions;
    private disposed;
    private readonly lifetime;
    constructor(storage?: SaveStorage, schema?: SaveSchema);
    get coordination(): StorageCoordination;
    private assertActive;
    private validate;
    private mutate;
    private expected;
    save(slot: string, data: JsonValue, playTime?: number, options?: SaveWriteOptions): Promise<SaveRecord>;
    private migrate;
    /** Revision observed by the last successful load/write, including removed slots. */
    observedRevision(slot: string): number | undefined;
    /** Decode and migrate a portable envelope without observing or changing any slot. */
    decodeImport(raw: string, options?: {
        signal?: AbortSignal;
    }): Promise<SaveRecord>;
    /** Export a detached, validated envelope; revision remains informational on import. */
    export(slot: string, options?: SaveReadOptions): Promise<string>;
    load(slot: string, options?: SaveReadOptions): Promise<SaveLoadResult>;
    /** Explicitly restore backup; retain the exact damaged primary under its forensic key. */
    restore(slot: string, options?: SaveWriteOptions): Promise<SaveRecord>;
    damagedPayload(slot: string): Promise<string | null>;
    damagedPayloads(slot: string): Promise<readonly string[]>;
    remove(slot: string, options?: SaveWriteOptions): Promise<void>;
    slots(): Promise<string[]>;
    clear(options?: {
        signal?: AbortSignal;
    }): Promise<void>;
    /** Queued/precommit work aborts. Already-issued custom writes drain; they cannot be revoked. */
    destroy(): void;
}
