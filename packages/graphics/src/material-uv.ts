import { mappedMaterialTextureSlots as materialTextureSlots } from './optical-maps.js';
import { PBRMaterial } from '../../core/src/pbr-material.js';
import { materialTextureCoordinates } from '../../core/src/optical-material-maps.js';
import type { TextureMaterial } from '../../core/src/mesh.js';
import type { Geometry } from '../../core/src/geometry.js';
import { GraphicsError } from './errors.js';

/** Shared GPU/std140 affine ABI: [a,b,c,d], then [tx,ty,UV selector,0]. */
export function fillMaterialUV(
  material: TextureMaterial,
  geometry: Geometry,
  out: Float32Array,
  offset = 0,
): void {
  const coordinates =
    material instanceof PBRMaterial
      ? materialTextureCoordinates(material)
      : undefined;
  for (let i = 0; i < materialTextureSlots.length; i++) {
    const mapping = coordinates?.[materialTextureSlots[i]!];
    if (mapping?.texCoord === 1 && !geometry.uvs1)
      throw new GraphicsError(
        `Material ${materialTextureSlots[i]} requires absent TEXCOORD_1.`,
      );
    const at = offset + i * 8;
    if (mapping) {
      for (let j = 0; j < 6; j++) out[at + j] = mapping.transform[j]!;
      out[at + 6] = mapping.texCoord;
    } else {
      out[at] = out[at + 3] = 1;
      out[at + 1] = out[at + 2] = out[at + 4] = out[at + 5] = out[at + 6] = 0;
    }
    out[at + 7] = 0;
  }
}
