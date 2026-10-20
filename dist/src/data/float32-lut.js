export function decodeFloat32LUT(e){let t=atob(e),n=new DataView(new ArrayBuffer(t.length));for(let e=0;e<t.length;e++)n.setUint8(e,t.charCodeAt(e));let r=new Float32Array(t.length/4);for(let e=0;e<r.length;e++)r[e]=n.getFloat32(e*4,!0);return r}
//# sourceMappingURL=float32-lut.js.map
