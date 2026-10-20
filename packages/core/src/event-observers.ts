const objectEventObservers = new WeakMap<object, Set<string>>();
/** Every type any object has observed; a superset of each per-object Set, never shrinking. */
const observedEventTypes = new Set<string>();

/** @internal Share the existing listener Set without expanding scene facade declarations. */
export function observeObjectEventTypes(
  object: object,
  types: Set<string>,
): void {
  objectEventObservers.set(object, types);
}

/** @internal Record each type added to a shared Set; unobserved types skip the object lookup. */
export function observeEventType(type: string): void {
  observedEventTypes.add(type);
}

/** @internal Observation stays conservative after remove, once, and signal abort. */
export function hasObjectEventObservers(object: object, type: string): boolean {
  return (
    observedEventTypes.has(type) &&
    (objectEventObservers.get(object)?.has(type) ?? false)
  );
}
