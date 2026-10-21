import { mappedMaterialTextureSlots as materialTextureSlots } from './optical-maps.js';
import {
  PBRMaterial,
  type TextureCoordinates,
} from '../../core/src/pbr-material.js';
import {
  materialTextureCoordinates,
  type MaterialMappedTextureSlot,
} from '../../core/src/optical-material-maps.js';
import type { TextureMaterial } from '../../core/src/mesh.js';
import type { Geometry } from '../../core/src/geometry.js';
import { GraphicsError } from './errors.js';

type Coordinates = Readonly<
  Partial<Record<MaterialMappedTextureSlot, TextureCoordinates>>
>;

/** Packed output for one immutable coordinate set, and whether any slot reads UV1. */
interface UVTemplate {
  readonly data: Float32Array;
  readonly uv1: boolean;
}

const UV_FLOAT_COUNT = materialTextureSlots.length * 8;
const identityTemplate = buildTemplate(undefined);
/** `null` marks coordinate sets that are not deeply frozen data and are packed per call. */
const templates = new WeakMap<Coordinates, UVTemplate | null>();

/** Shared GPU/std140 affine ABI: [a,b,c,d], then [tx,ty,UV selector,0]. */
export function fillMaterialUV(
  material: TextureMaterial,
  geometry: Pick<Geometry, 'uvs1'>,
  out: Float32Array,
  offset = 0,
): void {
  const coordinates = coordinatesOf(material);
  const packed = templateData(coordinates, geometry);
  if (packed && offset + UV_FLOAT_COUNT <= out.length) out.set(packed, offset);
  else packMaterialUV(coordinates, geometry, out, offset);
}

/**
 * The packed `fillMaterialUV` layout as a shared array that never changes, or
 * `undefined` when this material must be packed per call. Callers must not write to it;
 * equal arrays mean equal data, so a destination already holding it needs no copy.
 */
export function packedMaterialUV(
  material: TextureMaterial,
  geometry: Pick<Geometry, 'uvs1'>,
): Float32Array | undefined {
  return templateData(coordinatesOf(material), geometry);
}

function templateData(
  coordinates: Coordinates | undefined,
  geometry: Pick<Geometry, 'uvs1'>,
): Float32Array | undefined {
  // Renderers pack this for every draw; immutable coordinate sets reuse their packed copy.
  const template = !coordinates
    ? identityTemplate
    : typeof coordinates === 'object'
      ? templateFor(coordinates)
      : null;
  return template && (!template.uv1 || geometry.uvs1)
    ? template.data
    : undefined;
}

function coordinatesOf(material: TextureMaterial): Coordinates | undefined {
  return material instanceof PBRMaterial
    ? materialTextureCoordinates(material)
    : undefined;
}

function packMaterialUV(
  coordinates: Coordinates | undefined,
  geometry: Pick<Geometry, 'uvs1'>,
  out: Float32Array,
  offset: number,
): void {
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

function templateFor(coordinates: Coordinates): UVTemplate | null {
  let template = templates.get(coordinates);
  if (template === undefined) {
    template = frozenData(coordinates) ? buildTemplate(coordinates) : null;
    templates.set(coordinates, template);
  }
  return template;
}

function buildTemplate(coordinates: Coordinates | undefined): UVTemplate {
  const data = new Float32Array(UV_FLOAT_COUNT);
  packMaterialUV(coordinates, { uvs1: new Float32Array(0) }, data, 0);
  return {
    data,
    uv1: materialTextureSlots.some(
      (slot) => coordinates?.[slot]?.texCoord === 1,
    ),
  };
}

/**
 * True only for the shape PBRMaterial builds: frozen own data properties all the way
 * down, UV selector 0 or 1, six numbers per transform. Such a set can never change, and
 * packing it cannot throw except for the UV1 check `fillMaterialUV` keeps per call.
 */
function frozenData(coordinates: Coordinates): boolean {
  if (!Object.isFrozen(coordinates)) return false;
  for (const slot of materialTextureSlots) {
    const entry = Object.getOwnPropertyDescriptor(coordinates, slot);
    if (!entry) {
      if (slot in coordinates) return false;
      continue;
    }
    const mapping: unknown = entry.value;
    if (!('value' in entry) || !mapping || typeof mapping !== 'object')
      return false;
    if (!Object.isFrozen(mapping)) return false;
    const texCoord = Object.getOwnPropertyDescriptor(mapping, 'texCoord');
    const transform = Object.getOwnPropertyDescriptor(mapping, 'transform');
    if (texCoord?.value !== 0 && texCoord?.value !== 1) return false;
    const values: unknown = transform?.value;
    if (
      !Array.isArray(values) ||
      !Object.isFrozen(values) ||
      values.length !== 6
    )
      return false;
    for (let j = 0; j < 6; j++)
      if (typeof Object.getOwnPropertyDescriptor(values, j)?.value !== 'number')
        return false;
  }
  return true;
}
