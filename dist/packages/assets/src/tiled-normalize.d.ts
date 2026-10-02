type RecordData = Record<string, unknown>;
/** Normalize asynchronous profiles before the synchronous, fully validating parser. */
export declare function normalizeTiledMap(map: RecordData, base: string, resolve: (path: string, base: string) => string, json: (href: string) => Promise<unknown>, signal: AbortSignal): Promise<void>;
export {};
