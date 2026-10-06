import{Mesh as e,TextureMaterial as t}from"./mesh.js";export function setMeshMaterial(n,r){if(!(n instanceof e))throw TypeError(`setMeshMaterial requires a Mesh.`);if(!(r instanceof t))throw TypeError(`Mesh material must be a TextureMaterial.`);let i=n;i.material=r}
//# sourceMappingURL=mesh-material.js.map
