const e=new WeakMap;export function registerGLTFVariants(t,n){e.set(t,n)}export function gltfVariants(t){let n=e.get(t);if(!n)throw TypeError(`Object is not an asset returned by GLTFLoader.`);return n}
//# sourceMappingURL=gltf-variants.js.map
