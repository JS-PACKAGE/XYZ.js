import {
  ActionMap,
  GamepadState,
  type ActionBinding,
} from '../../../input/src/gamepad.js';
import type { InputContext } from '../../../input/src/contexts.js';
import { validateAccessibilityOverrides } from './preferences.js';
import type {
  AccessibilityPreferences,
  AccessibilityPreferenceOverrides,
} from './preferences.js';
import {
  SaveManager,
  StorageError,
  type JsonValue,
  type SaveStorage,
  type SaveLoadResult,
  type SaveRecord,
} from '../storage.js';
import { readSaveFile } from '../portable-save.js';

export interface PlayerSettings {
  readonly accessibility: AccessibilityPreferenceOverrides;
  readonly bindings: Readonly<
    Record<string, Readonly<Record<string, readonly ActionBinding[]>>>
  >;
}
export interface SettingsOptions {
  readonly slot?: string;
  readonly signal?: AbortSignal;
}
type BindingsOwner = Pick<InputContext, 'exportBindings' | 'importBindings'>;

/** Explicit game-local settings ownership. Writes finish before imported/reset policy is applied.
 * Version 1 contained accessibility only; migration fills bindings from this game's defaults. */
export class SettingsManager {
  private readonly saves: SaveManager;
  private readonly defaults: PlayerSettings;
  private readonly lifetime = new AbortController();
  private readonly signal: AbortSignal;
  private readonly slot: string;
  constructor(
    storage: SaveStorage,
    private readonly preferences: AccessibilityPreferences,
    private readonly contexts: Readonly<Record<string, BindingsOwner>>,
    options: SettingsOptions = {},
  ) {
    this.slot = options.slot ?? 'settings';
    this.signal = options.signal
      ? AbortSignal.any([options.signal, this.lifetime.signal])
      : this.lifetime.signal;
    this.defaults = this.capture();
    this.saves = new SaveManager(storage, {
      version: 2,
      migrate: (_version, data) => {
        if (
          !data ||
          typeof data !== 'object' ||
          Array.isArray(data) ||
          !('accessibility' in data)
        )
          throw new StorageError('invalid', 'Invalid legacy settings.');
        return {
          accessibility: data.accessibility!,
          bindings: this.defaults.bindings as unknown as JsonValue,
        };
      },
      validate: (data) => {
        try {
          this.validate(data);
          return true;
        } catch {
          return false;
        }
      },
    });
  }

  capture(): PlayerSettings {
    const bindings: Record<
      string,
      Record<string, ActionBinding[]>
    > = Object.create(null) as Record<string, Record<string, ActionBinding[]>>;
    for (const [name, context] of Object.entries(this.contexts))
      bindings[name] = context.exportBindings();
    return { accessibility: this.preferences.export(), bindings };
  }

  private validate(value: unknown): asserts value is PlayerSettings {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !('accessibility' in value) ||
      !('bindings' in value) ||
      Object.keys(value).some(
        (key) => !['accessibility', 'bindings'].includes(key),
      )
    )
      throw new StorageError('invalid', 'Invalid settings object.');
    validateAccessibilityOverrides(value.accessibility);
    const bindings = value.bindings;
    if (
      !bindings ||
      typeof bindings !== 'object' ||
      Array.isArray(bindings) ||
      Object.keys(bindings).length !== Object.keys(this.contexts).length
    )
      throw new StorageError(
        'invalid',
        'Settings contexts do not match this game.',
      );
    const map = new ActionMap(new GamepadState());
    for (const name of Object.keys(this.contexts)) {
      if (!Object.hasOwn(bindings, name))
        throw new StorageError('invalid', `Missing settings context: ${name}.`);
      map.import((bindings as PlayerSettings['bindings'])[name]!);
      const actions = Object.keys(map.export());
      const required = Object.keys(this.defaults.bindings[name]!);
      if (
        actions.length !== required.length ||
        required.some((action) => !actions.includes(action))
      )
        throw new StorageError(
          'invalid',
          `Settings actions do not match context: ${name}.`,
        );
    }
  }

  private apply(settings: PlayerSettings): void {
    this.signal.throwIfAborted();
    for (const [name, context] of Object.entries(this.contexts))
      context.importBindings(settings.bindings[name]!);
    this.preferences.replace(settings.accessibility);
  }

  async load(): Promise<SaveLoadResult> {
    const result = await this.saves.load(this.slot, { signal: this.signal });
    this.signal.throwIfAborted();
    if (result.status === 'loaded')
      this.apply(result.record.data as unknown as PlayerSettings);
    return result;
  }

  save(): Promise<SaveRecord> {
    const settings = this.capture();
    return this.saves.save(this.slot, settings as unknown as JsonValue, 0, {
      signal: this.signal,
    });
  }

  async reset(): Promise<void> {
    await this.saves.save(this.slot, this.defaults as unknown as JsonValue, 0, {
      signal: this.signal,
    });
    this.apply(this.defaults);
  }

  async importFile(file: Blob): Promise<void> {
    const raw = await readSaveFile(file, this.signal);
    const record = await this.saves.decodeImport(raw, { signal: this.signal });
    await this.saves.save(this.slot, record.data, 0, { signal: this.signal });
    this.apply(record.data as unknown as PlayerSettings);
  }

  async exportFile(): Promise<Blob> {
    await this.save();
    return new Blob(
      [await this.saves.export(this.slot, { signal: this.signal })],
      { type: 'application/json' },
    );
  }

  destroy(): void {
    this.lifetime.abort(
      new DOMException('Settings owner is destroyed.', 'AbortError'),
    );
    this.saves.destroy();
  }
}
