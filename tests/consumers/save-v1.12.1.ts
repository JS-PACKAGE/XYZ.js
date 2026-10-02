import {
  SaveManager,
  type JsonValue,
  type SaveLoadResult,
  type SaveRecord,
  type SaveSchema,
  type SaveStorage,
} from '../../src/index.js';

// A custom published-v1.12.1 implementation may omit optional coordination/mutate.
export class ConsumerStorage implements SaveStorage {
  private readonly values = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }
  async keys(): Promise<string[]> {
    return [...this.values.keys()];
  }
  async clear(): Promise<void> {
    this.values.clear();
  }
}

export function saves(storage: SaveStorage): SaveManager {
  const schema: SaveSchema = {
    version: 2,
    migrate: (_version: number, data: JsonValue): JsonValue => data,
    validate: (data: JsonValue): boolean =>
      typeof data === 'object' && data !== null,
  };
  return new SaveManager(storage, schema);
}

export async function checkpoint(
  manager: SaveManager,
  signal: AbortSignal,
): Promise<JsonValue | undefined> {
  const loaded: SaveLoadResult = await manager.load('checkpoint', {
    signal,
    recovery: true,
  });
  if (loaded.status === 'corrupt') throw loaded.error;
  if (loaded.status === 'missing') return undefined;
  const record: SaveRecord = await manager.save(
    'checkpoint',
    loaded.record.data,
    12,
    {
      expectedRevision: loaded.record.revision,
      signal,
    },
  );
  const portable: string = await manager.export('checkpoint', { signal });
  const imported: SaveRecord = await manager.decodeImport(portable, { signal });
  return imported.revision === record.revision ? imported.data : record.data;
}
