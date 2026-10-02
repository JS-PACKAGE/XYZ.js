import { type ActionBinding } from '../../../input/src/gamepad.js';
import type { InputContext } from '../../../input/src/contexts.js';
import type { AccessibilityPreferences, AccessibilityPreferenceOverrides } from './preferences.js';
import { type SaveStorage, type SaveLoadResult, type SaveRecord } from '../storage.js';
export interface PlayerSettings {
    readonly accessibility: AccessibilityPreferenceOverrides;
    readonly bindings: Readonly<Record<string, Readonly<Record<string, readonly ActionBinding[]>>>>;
}
export interface SettingsOptions {
    readonly slot?: string;
    readonly signal?: AbortSignal;
}
type BindingsOwner = Pick<InputContext, 'exportBindings' | 'importBindings'>;
/** Explicit game-local settings ownership. Writes finish before imported/reset policy is applied.
 * Version 1 contained accessibility only; migration fills bindings from this game's defaults. */
export declare class SettingsManager {
    private readonly preferences;
    private readonly contexts;
    private readonly saves;
    private readonly defaults;
    private readonly lifetime;
    private readonly signal;
    private readonly slot;
    constructor(storage: SaveStorage, preferences: AccessibilityPreferences, contexts: Readonly<Record<string, BindingsOwner>>, options?: SettingsOptions);
    capture(): PlayerSettings;
    private validate;
    private apply;
    load(): Promise<SaveLoadResult>;
    save(): Promise<SaveRecord>;
    reset(): Promise<void>;
    importFile(file: Blob): Promise<void>;
    exportFile(): Promise<Blob>;
    destroy(): void;
}
export {};
