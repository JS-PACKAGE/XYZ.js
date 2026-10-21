import { Geometry } from './geometry.js';
import { modelLimits } from '../../../src/data/models.js';
import { mikkTangents } from './mikktspace-wasm.js';
import { hypot3 } from '../../math/src/hypot.js';

export interface MikkTangentsOptions {
  /** glTF uses the normal-map handedness conversion recommended by mikktspace. */
  convention?: 'uv' | 'gltf';
  texCoord?: 0 | 1;
}
export interface MikkTangentsResult {
  readonly geometry: Geometry;
  /** New vertex index → original vertex index, including tangent seam splits. */
  readonly sourceVertices: Uint32Array;
}

/** @internal Copies a vertex stream through an explicit seam map. */
export function remapVertexData(
  source: ArrayLike<number>,
  sourceVertices: Uint32Array,
  components: number,
  stride = components,
  offset = 0,
): Float32Array {
  const result = new Float32Array(sourceVertices.length * components);
  for (let i = 0; i < sourceVertices.length; i++) {
    const s = sourceVertices[i] * stride + offset;
    for (let j = 0; j < components; j++)
      result[i * components + j] = source[s + j];
  }
  return result;
}

export function generateMikkTangents(
  geometry: Geometry,
  options: MikkTangentsOptions = {},
): MikkTangentsResult {
  if (!(geometry instanceof Geometry))
    throw new TypeError('MikkTSpace requires Geometry.');
  const convention = options.convention ?? 'uv';
  if (convention !== 'uv' && convention !== 'gltf')
    throw new RangeError('Unknown tangent convention.');
  const texCoord = options.texCoord ?? 0;
  if (texCoord !== 0 && texCoord !== 1)
    throw new RangeError('MikkTSpace requires UV0 or UV1.');
  if (texCoord === 1 && !geometry.uvs1)
    throw new RangeError('MikkTSpace requires the requested UV stream.');
  const vertices = geometry.vertices,
    indices = geometry.indices;
  const count = vertices.length / 8,
    corners = indices.length;
  if (count > modelLimits.vertices || corners > modelLimits.indices)
    throw new RangeError('MikkTSpace geometry exceeds model limits.');
  const upper = Math.min(count + corners, modelLimits.vertices);
  const estimatedBytes =
    corners * 52 +
    count * 4 +
    upper * (100 + (geometry.uvs1 ? 16 : 0) + (geometry.colors ? 32 : 0));
  if (estimatedBytes > modelLimits.decodedBytes)
    throw new RangeError(
      'MikkTSpace working streams exceed decoded allocation limits.',
    );
  const positions = new Float32Array(corners * 3);
  const normals = new Float32Array(corners * 3);
  const uvs = new Float32Array(corners * 2);
  for (let i = 0; i < corners; i++) {
    const s = indices[i] * 8;
    positions[i * 3] = vertices[s];
    positions[i * 3 + 1] = vertices[s + 1];
    positions[i * 3 + 2] = vertices[s + 2];
    const length = hypot3(vertices[s + 3], vertices[s + 4], vertices[s + 5]);
    normals[i * 3] = length > 0 ? vertices[s + 3] / length : 0;
    normals[i * 3 + 1] = length > 0 ? vertices[s + 4] / length : 0;
    normals[i * 3 + 2] = length > 0 ? vertices[s + 5] / length : 1;
    uvs[i * 2] =
      texCoord === 1 ? geometry.uvs1![indices[i] * 2] : vertices[s + 6];
    uvs[i * 2 + 1] =
      texCoord === 1 ? geometry.uvs1![indices[i] * 2 + 1] : vertices[s + 7];
  }
  const generated = mikkTangents(positions, normals, uvs);
  const sourceMap: number[] = [];
  for (let i = 0; i < count; i++) sourceMap.push(i);
  const cornerMap = new Int32Array(count).fill(-1);
  const extraCorners: number[] = [];
  const newIndices = new Uint32Array(corners);
  // A corner's seam key is its source vertex plus its four tangent components compared
  // as numbers (-0 equals 0, NaN equals NaN): an open-addressed table of the corner that
  // first used each key, instead of building a string per corner.
  const keyBits = new Uint32Array(corners * 4);
  const bits = new Uint32Array(
    generated.buffer,
    generated.byteOffset,
    generated.length,
  );
  for (let i = 0; i < corners * 4; i++) {
    const value = generated[i]!;
    keyBits[i] = value === 0 ? 0 : value !== value ? 0x7fc00000 : bits[i]!;
  }
  let capacity = 16;
  while (capacity < corners * 2) capacity *= 2;
  const slots = new Int32Array(capacity).fill(-1),
    slotTargets = new Uint32Array(capacity),
    mask = capacity - 1;
  for (let i = 0; i < corners; i++) {
    const source = indices[i]!,
      o = i * 4;
    let hash = Math.imul(source, 0x9e3779b1);
    for (let k = 0; k < 4; k++)
      hash = Math.imul(hash ^ keyBits[o + k]!, 0x01000193);
    let slot = (hash ^ (hash >>> 15)) & mask,
      target = -1;
    for (; slots[slot]! >= 0; slot = (slot + 1) & mask) {
      const other = slots[slot]!,
        p = other * 4;
      if (
        indices[other] === source &&
        keyBits[p] === keyBits[o] &&
        keyBits[p + 1] === keyBits[o + 1] &&
        keyBits[p + 2] === keyBits[o + 2] &&
        keyBits[p + 3] === keyBits[o + 3]
      ) {
        target = slotTargets[slot]!;
        break;
      }
    }
    if (target < 0) {
      if (cornerMap[source] < 0) {
        target = source;
        cornerMap[source] = i;
      } else {
        if (sourceMap.length >= modelLimits.vertices)
          throw new RangeError(
            'MikkTSpace seam splitting exceeds vertex limits.',
          );
        target = sourceMap.length;
        sourceMap.push(source);
        extraCorners.push(i);
      }
      slots[slot] = i;
      slotTargets[slot] = target;
    }
    newIndices[i] = target;
  }
  if (sourceMap.length > modelLimits.vertices)
    throw new RangeError('MikkTSpace seam splitting exceeds vertex limits.');
  const sourceVertices = new Uint32Array(sourceMap);
  const tangents = new Float32Array(sourceVertices.length * 4);
  for (let i = 0; i < sourceVertices.length; i++) {
    const corner = i < count ? cornerMap[i] : extraCorners[i - count];
    const data = corner < 0 ? geometry.tangents : generated;
    const o = corner < 0 ? i * 4 : corner * 4;
    tangents[i * 4] = data[o];
    tangents[i * 4 + 1] = data[o + 1];
    tangents[i * 4 + 2] = data[o + 2];
    const sign =
      corner < 0
        ? geometry.tangentConvention === convention
          ? 1
          : -1
        : convention === 'gltf'
          ? -1
          : 1;
    tangents[i * 4 + 3] = data[o + 3] * sign;
  }
  return {
    sourceVertices,
    geometry: new Geometry({
      positions: remapVertexData(vertices, sourceVertices, 3, 8),
      normals: remapVertexData(vertices, sourceVertices, 3, 8, 3),
      uvs: remapVertexData(vertices, sourceVertices, 2, 8, 6),
      uvs1: geometry.uvs1
        ? remapVertexData(geometry.uvs1, sourceVertices, 2)
        : undefined,
      colors: geometry.colors
        ? remapVertexData(geometry.colors, sourceVertices, 4)
        : undefined,
      tangents,
      tangentTexCoord: texCoord,
      tangentConvention: convention,
      indices: newIndices,
    }),
  };
}
