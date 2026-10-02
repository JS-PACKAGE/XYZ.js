const e=new WeakMap;export function observeObjectEventTypes(t,n){e.set(t,n)}export function hasObjectEventObservers(t,n){return e.get(t)?.has(n)??!1}
//# sourceMappingURL=event-observers.js.map
