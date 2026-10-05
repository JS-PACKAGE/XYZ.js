import type { I18n } from './i18n.js';
import { assertJsonValue } from './storage.js';

export type NarrativeValue = string | number | boolean | null;
export type NarrativeVariables = Readonly<Record<string, NarrativeValue>>;
export type NarrativeCondition =
  | { readonly variable: string; readonly equals: NarrativeValue }
  | { readonly all: readonly NarrativeCondition[] }
  | { readonly any: readonly NarrativeCondition[] }
  | { readonly not: NarrativeCondition };
export type NarrativeText = string | { readonly key: string };
export function conditionMatches(
  condition: NarrativeCondition | undefined,
  variables: NarrativeVariables,
): boolean {
  if (!condition) return true;
  if ('variable' in condition)
    return (
      Object.hasOwn(variables, condition.variable) &&
      variables[condition.variable] === condition.equals
    );
  if ('all' in condition)
    return condition.all.every((item) => conditionMatches(item, variables));
  if ('any' in condition)
    return condition.any.some((item) => conditionMatches(item, variables));
  return !conditionMatches(condition.not, variables);
}
export function narrativeText(
  text: NarrativeText,
  variables: NarrativeVariables,
  i18n?: I18n,
): string {
  if (typeof text === 'string') return text;
  if (!i18n) throw new Error('Localized narrative text requires I18n.');
  const params: Record<string, string | number | boolean> = Object.create(
    null,
  ) as Record<string, string | number | boolean>;
  for (const [key, value] of Object.entries(variables))
    if (value !== null) params[key] = value;
  return i18n.t(text.key, params);
}
export function validateVariables(
  value: unknown,
): asserts value is Record<string, NarrativeValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Invalid narrative variables.');
  for (const item of Object.values(value)) {
    if (
      item !== null &&
      typeof item !== 'string' &&
      typeof item !== 'boolean' &&
      !(typeof item === 'number' && Number.isFinite(item))
    )
      throw new TypeError('Invalid narrative variable.');
  }
}
/** Clone before freezing: caller data remains caller-owned. */
export function immutableData<T>(value: T): T {
  assertJsonValue(value);
  const clone = structuredClone(value);
  const freeze = (item: unknown): void => {
    if (item && typeof item === 'object') {
      for (const child of Object.values(item)) freeze(child);
      Object.freeze(item);
    }
  };
  freeze(clone);
  return clone;
}
export function validateCondition(
  condition: NarrativeCondition | undefined,
): void {
  if (!condition) return;
  if ('variable' in condition) {
    if (!condition.variable) throw new TypeError('Condition needs a variable.');
    validateVariables({ value: condition.equals });
  } else if ('all' in condition || 'any' in condition) {
    const items = 'all' in condition ? condition.all : condition.any;
    if (!Array.isArray(items)) throw new TypeError('Invalid condition list.');
    for (const item of items) validateCondition(item);
  } else if ('not' in condition) validateCondition(condition.not);
  else throw new TypeError('Invalid condition.');
}
export function validateGraph(
  nodes: readonly string[],
  edges: (id: string) => readonly string[],
  allowCycles = false,
): void {
  const known = new Set(nodes);
  if (known.size !== nodes.length || nodes.some((id) => !id))
    throw new Error('Graph IDs must be unique and nonempty.');
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (!known.has(id)) throw new Error(`Unknown graph reference: ${id}`);
    if (visiting.has(id)) {
      if (!allowCycles) throw new Error(`Graph cycle at ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of edges(id)) visit(target);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of nodes) visit(id);
}
