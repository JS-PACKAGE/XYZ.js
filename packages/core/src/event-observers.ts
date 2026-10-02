const objectEventObservers = new WeakMap<object, Set<string>>();

/** @internal Share the existing listener Set without expanding scene facade declarations. */
export function observeObjectEventTypes(
  object: object,
  types: Set<string>,
): void {
  objectEventObservers.set(object, types);
}

/** @internal Observation stays conservative after remove, once, and signal abort. */
export function hasObjectEventObservers(object: object, type: string): boolean {
  return objectEventObservers.get(object)?.has(type) ?? false;
}
