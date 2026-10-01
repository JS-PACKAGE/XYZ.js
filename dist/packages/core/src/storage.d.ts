export type JsonValue = null | boolean | number | string | JsonValue[] | {
    [key: string]: JsonValue;
};
export type StorageErrorCode = 'unavailable' | 'quota' | 'size' | 'invalid' | 'io';
export declare class StorageError extends Error {
    readonly code: StorageErrorCode;
    constructor(code: StorageErrorCode, message: string, options?: ErrorOptions);
}
/** Reject values JSON would silently discard or coerce. Shared references are allowed. */
export declare function assertJsonValue(value: unknown): asserts value is JsonValue;
/** String storage scoped to a namespace. clear never affects other namespaces. */
export interface SaveStorage {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
}
export declare class MemoryStorage implements SaveStorage {
    private readonly entries;
    private readonly prefix;
    constructor(namespace?: string, entries?: Map<string, string>);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
}
export declare class LocalStorageBackend implements SaveStorage {
    private readonly storage?;
    private readonly prefix;
    constructor(namespace?: string, storage?: Storage | undefined);
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
    constructor(namespace?: string, database?: string);
    private open;
    private run;
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
    data: JsonValue;
    metadata: SaveMetadata;
}
export type SaveLoadResult = {
    status: 'missing';
} | {
    status: 'loaded';
    record: SaveRecord;
} | {
    status: 'corrupt';
    raw: string;
    error: StorageError;
};
export declare class SaveManager {
    private readonly storage;
    private readonly schema;
    constructor(storage?: SaveStorage, schema?: SaveSchema);
    private validate;
    save(slot: string, data: JsonValue, playTime?: number): Promise<SaveRecord>;
    load(slot: string): Promise<SaveLoadResult>;
    remove(slot: string): Promise<void>;
    slots(): Promise<string[]>;
    clear(): Promise<void>;
}
