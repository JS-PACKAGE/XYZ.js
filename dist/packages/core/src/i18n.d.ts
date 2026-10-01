import { RuntimeError } from './errors.js';
import type { Text2D } from './text2d.js';
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
/** A message is a template string or a table of plural forms keyed by Intl.PluralRules category. */
export type I18nMessage = string | Readonly<Partial<Record<PluralCategory, string>> & {
    other: string;
}>;
/** Nested tables are flattened with `.`: `{ menu: { start: 'Start' } }` defines `menu.start`. */
export interface I18nTable {
    readonly [key: string]: I18nMessage | I18nTable;
}
export type I18nParams = Readonly<Record<string, string | number | boolean>>;
export type MissingKeyPolicy = 'key' | 'error' | ((key: string, locale: string) => string);
export interface I18nOptions {
    locale?: string;
    /** Tried after the locale's own parents, in order. */
    fallback?: string | readonly string[];
    messages?: Readonly<Record<string, I18nTable>>;
    /** `'key'` (default) returns the key itself; `'error'` throws I18nError. */
    missing?: MissingKeyPolicy;
}
export declare class I18nError extends RuntimeError {
    constructor(message: string, options?: ErrorOptions);
}
export interface I18nLocaleChangeDetail {
    readonly locale: string;
    readonly previous: string;
}
/**
 * Locale registry with fallback chain, `{name}` interpolation (`{{`/`}}` for literal braces),
 * plural forms through Intl.PluralRules and Intl number/date formatting. Dispatches
 * `localechange` (detail: I18nLocaleChangeDetail) on the instance.
 */
export declare class I18n extends EventTarget {
    private readonly tables;
    private readonly fallbacks;
    private readonly missing;
    private readonly bindings;
    private current;
    constructor(options?: I18nOptions);
    get locale(): string;
    /** Merges into any existing table for the locale; later keys replace earlier ones. */
    addMessages(locale: string, table: I18nTable): void;
    hasLocale(locale: string): boolean;
    get locales(): string[];
    /** Changes the active locale and notifies listeners and bound Text2D objects. */
    setLocale(locale: string): void;
    has(key: string): boolean;
    /**
     * Resolves `key` through the fallback chain. Plural messages pick a form from `params.count`
     * (required and numeric for plural messages); the number is also usable as `{count}`.
     */
    t(key: string, params?: I18nParams): string;
    formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
    formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
    /**
     * Keeps a Text2D showing `t(key, params)` and re-rasterizes it when the locale changes.
     * `params` may be a function for values that change over time (call `refresh` yourself then).
     * Returns an object whose `unbind()` stops updates; a destroyed Text2D unbinds itself.
     */
    bindText(text: Text2D, key: string, params?: I18nParams | (() => I18nParams)): I18nBinding;
    /** Drops every binding and listener owner state; called by Game.destroy. */
    destroy(): void;
    private lookup;
    private interpolate;
}
export interface I18nBinding {
    /** Re-resolves the message now; resolves after the Text2D has been updated. */
    refresh(): Promise<void>;
    unbind(): void;
}
