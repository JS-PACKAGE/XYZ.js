import { Mesh, TextureMaterial } from './mesh.js';
/**
 * Replace a Mesh's borrowed material. Renderers rebind on the next frame; the previous
 * material is not destroyed. Rejects anything that is not a TextureMaterial.
 */
export declare function setMeshMaterial(mesh: Mesh, material: TextureMaterial): void;
