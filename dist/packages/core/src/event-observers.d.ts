/** @internal Share the existing listener Set without expanding scene facade declarations. */
export declare function observeObjectEventTypes(object: object, types: Set<string>): void;
/** @internal Record each type added to a shared Set; unobserved types skip the object lookup. */
export declare function observeEventType(type: string): void;
/** @internal Observation stays conservative after remove, once, and signal abort. */
export declare function hasObjectEventObservers(object: object, type: string): boolean;
