import { expect, it } from 'vitest';
import { AccessibilityPreferences } from '../packages/core/src/accessibility/preferences.js';
import { SettingsManager } from '../packages/core/src/accessibility/settings.js';
import {
  PortableSaveFiles,
  readSaveFile,
} from '../packages/core/src/portable-save.js';
import {
  MemoryStorage,
  SaveManager,
  type JsonValue,
} from '../packages/core/src/storage.js';
import { ActionMap, GamepadState } from '../packages/input/src/gamepad.js';
import { storageLimits } from '../src/data/storage.js';

function player(storage: MemoryStorage) {
  const preferences = new AccessibilityPreferences(
    {} as Pick<Window, 'matchMedia'>,
  );
  const actions = new ActionMap(new GamepadState());
  actions.bind('right', { key: 'KeyD' });
  const settings = new SettingsManager(storage, preferences, {
    play: {
      exportBindings: () => actions.export(),
      importBindings: (bindings) => actions.import(bindings),
    },
  });
  return {
    preferences,
    actions,
    settings,
    destroy() {
      settings.destroy();
      preferences.destroy();
    },
  };
}

it('restores explicit accessibility and remapping on reload; reset is durable and restores game defaults', async () => {
  const storage = new MemoryStorage(),
    first = player(storage),
    second = player(storage);
  try {
    await first.settings.load();
    first.preferences.set({
      textScale: 1.5,
      highContrast: true,
      reducedMotion: true,
    });
    first.actions.rebind('right', [{ key: 'KeyL' }]);
    await first.settings.save();
    await second.settings.load();
    expect(second.preferences.export()).toEqual({
      textScale: 1.5,
      highContrast: true,
      reducedMotion: true,
    });
    expect(second.actions.bindings('right')).toEqual([{ key: 'KeyL' }]);
    await second.settings.reset();
    await first.settings.load();
    expect(first.preferences.export()).toEqual({});
    expect(first.actions.bindings('right')).toEqual([{ key: 'KeyD' }]);
  } finally {
    first.destroy();
    second.destroy();
  }
});

it('invalid settings in any context leave all live policy, bindings and stored bytes unchanged', async () => {
  const storage = new MemoryStorage(),
    owner = player(storage);
  const source = new SaveManager(new MemoryStorage(), { version: 2 });
  try {
    await owner.settings.save();
    const before = await storage.get('settings');
    const invalidFiles: JsonValue[] = [
      {
        accessibility: { textScale: 2 },
        bindings: { play: { right: [{ wheel: 'invalid', direction: 1 }] } },
      },
      {
        accessibility: { textScale: 2 },
        bindings: { unknown: { right: [{ key: 'KeyL' }] } },
      },
      {
        accessibility: { textScale: 3 },
        bindings: { play: { right: [{ key: 'KeyL' }] } },
      },
    ];
    for (const data of invalidFiles) {
      await source.save('file', data);
      await expect(
        owner.settings.importFile(new Blob([await source.export('file')])),
      ).rejects.toMatchObject({ code: 'invalid' });
      expect(owner.preferences.export()).toEqual({});
      expect(owner.actions.bindings('right')).toEqual([{ key: 'KeyD' }]);
      expect(await storage.get('settings')).toBe(before);
    }
  } finally {
    owner.destroy();
    source.destroy();
  }
});

it('migrates accessibility-only v1 settings using declared game binding defaults without rewriting on read', async () => {
  const storage = new MemoryStorage(),
    source = new SaveManager(storage),
    owner = player(storage);
  try {
    await source.save('settings', { accessibility: { reducedMotion: true } });
    const raw = await storage.get('settings');
    await owner.settings.load();
    expect(owner.preferences.values.reducedMotion).toBe(true);
    expect(owner.actions.bindings('right')).toEqual([{ key: 'KeyD' }]);
    expect(await storage.get('settings')).toBe(raw);
  } finally {
    owner.destroy();
    source.destroy();
  }
});

it('migrates portable files before fresh candidate validation and transfers checkpoint metadata to a fresh store', async () => {
  const source = new SaveManager(),
    storage = new MemoryStorage();
  const target = new SaveManager(storage, {
    version: 2,
    migrate: (_version, data) => ({ position: data, level: 2 }),
  });
  let restored: unknown;
  const files = new PortableSaveFiles(target, {
    slot: 'run',
    validateCandidate: async (record) => {
      restored = record.data;
    },
  });
  try {
    await source.save('run', [4, 5], 12);
    const imported = await files.importFile(
      new Blob([await source.export('run')]),
    );
    expect(restored).toEqual({ position: [4, 5], level: 2 });
    expect(imported.metadata.playTime).toBe(12);
    expect(
      await new SaveManager(storage, { version: 2 }).load('run'),
    ).toMatchObject({ status: 'loaded', record: { data: restored } });
  } finally {
    files.destroy();
    target.destroy();
    source.destroy();
  }
});

it('candidate failure and corruption preserve existing save and exact rejected file bytes', async () => {
  const storage = new MemoryStorage(),
    target = new SaveManager(storage),
    source = new SaveManager();
  const files = new PortableSaveFiles(target, {
    slot: 'run',
    validateCandidate: async () => {
      throw new Error('Obstacle intersects player');
    },
  });
  try {
    await target.save('run', { position: 1 });
    const before = await storage.get('run');
    await source.save('run', { position: 2 });
    await expect(
      files.importFile(new Blob([await source.export('run')])),
    ).rejects.toThrow('Obstacle intersects player');
    const damaged = new Blob(['\r\n{broken\r\n']);
    await expect(files.importFile(damaged)).rejects.toMatchObject({
      code: 'invalid',
    });
    expect(await damaged.text()).toBe('\r\n{broken\r\n');
    expect(await storage.get('run')).toBe(before);
  } finally {
    files.destroy();
    target.destroy();
    source.destroy();
  }
});

it('CAS prevents a concurrent same-owner save from being overwritten while a candidate is preparing', async () => {
  const storage = new MemoryStorage(),
    target = new SaveManager(storage),
    source = new SaveManager();
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const files = new PortableSaveFiles(target, {
    slot: 'run',
    validateCandidate: async () => {
      entered();
      await gate;
    },
  });
  try {
    await target.save('run', 1);
    await source.save('run', 2);
    const importing = files.importFile(new Blob([await source.export('run')]));
    await started;
    await target.save('run', 3);
    release();
    await expect(importing).rejects.toMatchObject({ code: 'stale' });
    expect(await target.load('run')).toMatchObject({
      status: 'loaded',
      record: { data: 3 },
    });
  } finally {
    release();
    files.destroy();
    target.destroy();
    source.destroy();
  }
});

it('rejects oversized files before reading and aborts pending candidate work without writes', async () => {
  const oversized = new Blob([new Uint8Array(storageLimits.maxBytes + 1)]);
  await expect(readSaveFile(oversized)).rejects.toMatchObject({ code: 'size' });
  const storage = new MemoryStorage(),
    target = new SaveManager(storage),
    source = new SaveManager();
  let entered!: () => void, finish!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const files = new PortableSaveFiles(target, {
    slot: 'run',
    validateCandidate: async () => {
      entered();
      await gate;
    },
  });
  try {
    await source.save('run', 2);
    const importing = files.importFile(new Blob([await source.export('run')]));
    await started;
    files.destroy();
    await expect(importing).rejects.toMatchObject({ name: 'AbortError' });
    finish();
    expect(await storage.get('run')).toBeNull();
  } finally {
    finish();
    files.destroy();
    target.destroy();
    source.destroy();
  }
});
