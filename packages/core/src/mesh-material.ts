import { Mesh, TextureMaterial } from './mesh.js';

/** Writable view used only by setMeshMaterial; Mesh keeps its published readonly declaration. */
interface MeshMaterialSlot {
  material: TextureMaterial;
}

/**
 * Replace a Mesh's borrowed material. Renderers rebind on the next frame; the previous
 * material is not destroyed. Rejects anything that is not a TextureMaterial.
 */
export function setMeshMaterial(mesh: Mesh, material: TextureMaterial): void {
  if (!(mesh instanceof Mesh))
    throw new TypeError('setMeshMaterial requires a Mesh.');
  if (!(material instanceof TextureMaterial))
    throw new TypeError('Mesh material must be a TextureMaterial.');
  const slot: MeshMaterialSlot = mesh;
  slot.material = material;
}
