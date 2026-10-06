export const xrLoops=new WeakMap;export function requestGameFrame(e,t){let n=xrLoops.get(e);if(n){n.tick=t;return}return requestAnimationFrame(t)}
//# sourceMappingURL=xr-loop.js.map
