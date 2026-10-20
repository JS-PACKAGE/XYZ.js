const e=new WeakMap,t=new Set;export function observeObjectEventTypes(t,n){e.set(t,n)}export function observeEventType(e){t.add(e)}export function hasObjectEventObservers(n,r){return t.has(r)&&(e.get(n)?.has(r)??!1)}
//# sourceMappingURL=event-observers.js.map
