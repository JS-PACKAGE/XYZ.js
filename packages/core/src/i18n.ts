import { logger } from './logger.js';
import { RuntimeError } from './errors.js';
import type { Text2D } from './text2d.js';

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
/** A message is a template string or a table of plural forms keyed by Intl.PluralRules category. */
export type I18nMessage =
  | string
  | Readonly<Partial<Record<PluralCategory, string>> & { other: string }>;
/** Nested tables are flattened with `.`: `{ menu: { start: 'Start' } }` defines `menu.start`. */
export interface I18nTable {
  readonly [key: string]: I18nMessage | I18nTable;
}
export type I18nParams = Readonly<Record<string, string | number | boolean>>;
export type MissingKeyPolicy =
  'key' | 'error' | ((key: string, locale: string) => string);

export interface I18nOptions {
  locale?: string;
  /** Tried after the locale's own parents, in order. */
  fallback?: string | readonly string[];
  messages?: Readonly<Record<string, I18nTable>>;
  /** `'key'` (default) returns the key itself; `'error'` throws I18nError. */
  missing?: MissingKeyPolicy;
}

export class I18nError extends RuntimeError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'I18nError';
  }
}

export interface I18nLocaleChangeDetail {
  readonly locale: string;
  readonly previous: string;
}

const categories: readonly string[] = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
];

function canonical(locale: string): string {
  try {
    const [result] = Intl.getCanonicalLocales(locale);
    if (result) return result;
  } catch (cause) {
    throw new I18nError(`Invalid locale tag "${locale}".`, { cause });
  }
  throw new I18nError(`Invalid locale tag "${locale}".`);
}

/** `zh-Hant-TW` -> `zh-Hant-TW`, `zh-Hant`, `zh`. */
function lineage(locale: string): string[] {
  const parts = locale.split('-');
  const result: string[] = [];
  for (let end = parts.length; end > 0; end--)
    result.push(parts.slice(0, end).join('-'));
  return result;
}

type PluralForms = Readonly<Partial<Record<PluralCategory, string>>> & {
  readonly other: string;
};

/**
 * A table whose keys are all Intl plural categories (including `other`) with string values is a
 * plural message; a nested table with exactly such keys is therefore not expressible.
 */
function pluralForms(value: object): PluralForms | undefined {
  const entries = Object.entries(value);
  const other: unknown = Object.fromEntries(entries).other;
  if (
    typeof other !== 'string' ||
    !entries.every(
      ([name, form]) => categories.includes(name) && typeof form === 'string',
    )
  )
    return undefined;
  return Object.freeze({ ...Object.fromEntries(entries), other });
}

function flatten(
  table: I18nTable,
  into: Map<string, I18nMessage>,
  prefix: string,
): void {
  for (const key of Object.keys(table)) {
    if (key === '' || key.includes('.'))
      throw new I18nError(`Invalid message key segment "${key}".`);
    const value = table[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      into.set(path, value);
    } else if (typeof value === 'object' && value !== null) {
      const forms = pluralForms(value);
      if (forms) into.set(path, forms);
      else flatten(value, into, path);
    } else {
      throw new I18nError(`Message "${path}" must be a string or a table.`);
    }
  }
}

/**
 * Locale registry with fallback chain, `{name}` interpolation (`{{`/`}}` for literal braces),
 * plural forms through Intl.PluralRules and Intl number/date formatting. Dispatches
 * `localechange` (detail: I18nLocaleChangeDetail) on the instance.
 */
export class I18n extends EventTarget {
  private readonly tables = new Map<string, Map<string, I18nMessage>>();
  private readonly fallbacks: string[];
  private readonly missing: MissingKeyPolicy;
  private readonly bindings = new Set<() => void>();
  private current: string;

  constructor(options: I18nOptions = {}) {
    super();
    this.current = canonical(options.locale ?? 'en');
    const fallback = options.fallback ?? [];
    this.fallbacks = (typeof fallback === 'string' ? [fallback] : fallback).map(
      canonical,
    );
    this.missing = options.missing ?? 'key';
    for (const [locale, table] of Object.entries(options.messages ?? {}))
      this.addMessages(locale, table);
  }

  get locale(): string {
    return this.current;
  }

  /** Merges into any existing table for the locale; later keys replace earlier ones. */
  addMessages(locale: string, table: I18nTable): void {
    const tag = canonical(locale);
    const flat = new Map<string, I18nMessage>();
    flatten(table, flat, '');
    const existing = this.tables.get(tag) ?? new Map<string, I18nMessage>();
    for (const [key, value] of flat) existing.set(key, value);
    this.tables.set(tag, existing);
  }

  hasLocale(locale: string): boolean {
    return this.tables.has(canonical(locale));
  }

  get locales(): string[] {
    return [...this.tables.keys()];
  }

  /** Changes the active locale and notifies listeners and bound Text2D objects. */
  setLocale(locale: string): void {
    const tag = canonical(locale);
    if (tag === this.current) return;
    const previous = this.current;
    this.current = tag;
    this.dispatchEvent(
      new CustomEvent<I18nLocaleChangeDetail>('localechange', {
        detail: { locale: tag, previous },
      }),
    );
    for (const refresh of [...this.bindings]) refresh();
  }

  has(key: string): boolean {
    return this.lookup(key) !== undefined;
  }

  /**
   * Resolves `key` through the fallback chain. Plural messages pick a form from `params.count`
   * (required and numeric for plural messages); the number is also usable as `{count}`.
   */
  t(key: string, params?: I18nParams): string {
    const found = this.lookup(key);
    if (!found) {
      if (this.missing === 'error')
        throw new I18nError(`Missing message "${key}" for "${this.current}".`);
      if (typeof this.missing === 'function')
        return this.missing(key, this.current);
      return key;
    }
    let template: string;
    if (typeof found.message === 'string') {
      template = found.message;
    } else {
      const count = params?.count;
      if (typeof count !== 'number' || !Number.isFinite(count))
        throw new I18nError(
          `Plural message "${key}" requires a finite numeric "count" parameter.`,
        );
      const category = new Intl.PluralRules(found.locale).select(count);
      template = found.message[category] ?? found.message.other;
    }
    return this.interpolate(key, template, params);
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.current, options).format(value);
  }

  formatDate(
    value: Date | number,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    return new Intl.DateTimeFormat(this.current, options).format(value);
  }

  /**
   * Keeps a Text2D showing `t(key, params)` and re-rasterizes it when the locale changes.
   * `params` may be a function for values that change over time (call `refresh` yourself then).
   * Returns an object whose `unbind()` stops updates; a destroyed Text2D unbinds itself.
   */
  bindText(
    text: Text2D,
    key: string,
    params?: I18nParams | (() => I18nParams),
  ): I18nBinding {
    let active = true;
    let latest: Promise<void> = Promise.resolve();
    const binding: I18nBinding = {
      refresh: () => {
        if (!active) return latest;
        if (text.destroyed) {
          binding.unbind();
          return latest;
        }
        latest = text
          .setText(
            this.t(key, typeof params === 'function' ? params() : params),
          )
          .catch((error: unknown) => {
            if (!text.destroyed)
              logger.error('I18n text update failed.', error);
          });
        return latest;
      },
      unbind: () => {
        active = false;
        this.bindings.delete(update);
      },
    };
    const update = (): void => void binding.refresh();
    this.bindings.add(update);
    void binding.refresh();
    return binding;
  }

  /** Drops every binding and listener owner state; called by Game.destroy. */
  destroy(): void {
    this.bindings.clear();
  }

  private lookup(
    key: string,
  ): { message: I18nMessage; locale: string } | undefined {
    const order = [
      ...lineage(this.current),
      ...this.fallbacks.flatMap((tag) => lineage(tag)),
    ];
    for (const locale of order) {
      const message = this.tables.get(locale)?.get(key);
      if (message !== undefined) return { message, locale };
    }
    return undefined;
  }

  private interpolate(
    key: string,
    template: string,
    params: I18nParams | undefined,
  ): string {
    return template.replace(
      /\{\{|\}\}|\{([^{}]+)\}/g,
      (match, name?: string) => {
        if (match === '{{') return '{';
        if (match === '}}') return '}';
        const value = params?.[name!];
        if (value === undefined)
          throw new I18nError(`Message "${key}" needs parameter "${name}".`);
        return typeof value === 'number'
          ? this.formatNumber(value)
          : String(value);
      },
    );
  }
}

export interface I18nBinding {
  /** Re-resolves the message now; resolves after the Text2D has been updated. */
  refresh(): Promise<void>;
  unbind(): void;
}
