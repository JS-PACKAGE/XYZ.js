import { decalNormalOffset } from '../../../src/data/rendering.js';
import { Matrix4, Quaternion, Vector3 } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { InstancedMesh } from './instanced-mesh.js';
import { Mesh, TextureMaterial, type MeshOptions } from './mesh.js';
import { SkinnedMesh } from './skinned-mesh.js';

export interface DecalOptions {
  target: Mesh;
  material: TextureMaterial;
  /** World-space projector center; local +Z points out of the receiver. */
  position: [number, number, number];
  rotation?: MeshOptions['rotation'];
  /** Projector width, height and depth in world units. */
  size: [number, number, number];
  /** World-space lift along interpolated receiver normals, baked at creation. */
  normalOffset?: number;
  cullBackfaces?: boolean;
  visible?: boolean;
  receiveShadow?: boolean;
}

/** Clips receiver triangles once and attaches the resulting mesh to that receiver. */
export class Decal extends Mesh {
  constructor(options: DecalOptions) {
    const geometry = project(options);
    super({
      geometry,
      material: options.material,
      visible: options.visible,
      castShadow: false,
      receiveShadow: options.receiveShadow,
    });
    options.target.add(this);
  }
}

function project(options: DecalOptions): Geometry {
  const { target, material, position, size } = options;
  if (!(target instanceof Mesh) || target.destroyed)
    throw new TypeError('Decal requires a live receiver Mesh.');
  if (
    target instanceof InstancedMesh ||
    target instanceof SkinnedMesh ||
    target.morph
  )
    throw new TypeError(
      'Decal requires a non-instanced, non-deforming receiver.',
    );
  if (!(material instanceof TextureMaterial))
    throw new TypeError('Decal requires TextureMaterial.');
  if (position.length !== 3 || position.some((v) => !Number.isFinite(v)))
    throw new RangeError(
      'Decal position must contain three finite coordinates.',
    );
  if (size.length !== 3 || size.some((v) => !Number.isFinite(v) || v <= 0))
    throw new RangeError(
      'Decal size must contain three positive finite dimensions.',
    );
  const offset = options.normalOffset ?? decalNormalOffset;
  if (!Number.isFinite(offset) || offset < 0)
    throw new RangeError('Decal normalOffset must be finite and nonnegative.');
  const rotation = new Quaternion();
  if (options.rotation instanceof Quaternion) rotation.copy(options.rotation);
  else if (options.rotation) {
    if (
      options.rotation.length !== 3 ||
      options.rotation.some((v) => !Number.isFinite(v))
    )
      throw new RangeError(
        'Decal Euler rotation must contain three finite angles.',
      );
    rotation.setFromEuler(...options.rotation);
  }
  const length = Math.hypot(rotation.x, rotation.y, rotation.z, rotation.w);
  if (!Number.isFinite(length) || length === 0)
    throw new RangeError(
      'Decal rotation must be a finite, nonzero quaternion.',
    );
  rotation.normalize();
  const projector = new Matrix4().compose(
    new Vector3(...position),
    rotation,
    new Vector3(1, 1, 1),
  );
  const receiver = target.updateWorldMatrix();
  if (receiver.elements.some((v) => !Number.isFinite(v)))
    throw new RangeError('Decal receiver transform must be finite.');
  const inverseReceiver = new Matrix4().copy(receiver).invert();
  const projection = new Matrix4().copy(projector).invert().multiply(receiver);
  const transform = projection.elements;
  const inverse = inverseReceiver.elements;
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  // A triangle gains at most one vertex per clipping plane: 3 + 6 vertices.
  let input = new Float64Array(9 * 6),
    output = new Float64Array(9 * 6);
  const point = new Vector3(),
    worldNormal = new Vector3();
  const vertices = target.geometry.vertices,
    sourceIndices = target.geometry.indices;
  for (let triangle = 0; triangle < sourceIndices.length; triangle += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const source = sourceIndices[triangle + corner] * 8,
        dest = corner * 6;
      const x = vertices[source],
        y = vertices[source + 1],
        z = vertices[source + 2];
      input[dest] =
        transform[0] * x + transform[4] * y + transform[8] * z + transform[12];
      input[dest + 1] =
        transform[1] * x + transform[5] * y + transform[9] * z + transform[13];
      input[dest + 2] =
        transform[2] * x + transform[6] * y + transform[10] * z + transform[14];
      for (let component = 0; component < 3; component++)
        input[dest + 3 + component] = vertices[source + 3 + component];
    }
    const ax = input[6] - input[0],
      ay = input[7] - input[1];
    const bx = input[12] - input[0],
      by = input[13] - input[1];
    if (options.cullBackfaces !== false && ax * by - ay * bx <= 0) continue;
    let count = 3;
    for (let dimension = 0; dimension < 3 && count >= 3; dimension++) {
      for (let sign = -1; sign <= 1; sign += 2) {
        count = clip(
          input,
          output,
          count,
          dimension,
          sign,
          size[dimension] / 2,
        );
        const swap = input;
        input = output;
        output = swap;
        if (count < 3) break;
      }
    }
    if (count < 3) continue;
    const base = positions.length / 3;
    for (let vertex = 0; vertex < count; vertex++) {
      const k = vertex * 6;
      point.set(input[k], input[k + 1], input[k + 2]);
      projector.transformPoint(point, point);
      inverseReceiver.transformPoint(point, point);
      const nx = input[k + 3],
        ny = input[k + 4],
        nz = input[k + 5];
      worldNormal
        .set(
          inverse[0] * nx + inverse[1] * ny + inverse[2] * nz,
          inverse[4] * nx + inverse[5] * ny + inverse[6] * nz,
          inverse[8] * nx + inverse[9] * ny + inverse[10] * nz,
        )
        .normalize();
      positions.push(
        point.x +
          offset *
            (inverse[0] * worldNormal.x +
              inverse[4] * worldNormal.y +
              inverse[8] * worldNormal.z),
        point.y +
          offset *
            (inverse[1] * worldNormal.x +
              inverse[5] * worldNormal.y +
              inverse[9] * worldNormal.z),
        point.z +
          offset *
            (inverse[2] * worldNormal.x +
              inverse[6] * worldNormal.y +
              inverse[10] * worldNormal.z),
      );
      const magnitude = Math.hypot(nx, ny, nz);
      normals.push(
        magnitude ? nx / magnitude : 0,
        magnitude ? ny / magnitude : 0,
        magnitude ? nz / magnitude : 0,
      );
      uvs.push(input[k] / size[0] + 0.5, 0.5 - input[k + 1] / size[1]);
    }
    for (let vertex = 1; vertex < count - 1; vertex++) {
      const a = 6 * vertex,
        b = 6 * (vertex + 1);
      const ux = input[a] - input[0],
        uy = input[a + 1] - input[1],
        uz = input[a + 2] - input[2];
      const vx = input[b] - input[0],
        vy = input[b + 1] - input[1],
        vz = input[b + 2] - input[2];
      if (
        Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) > 0
      )
        indices.push(base, base + vertex, base + vertex + 1);
    }
  }
  // Never substitute a floating quad when the projector misses the receiver.
  if (!indices.length)
    throw new RangeError(
      'Decal projector does not intersect a receiver surface.',
    );
  return new Geometry({ positions, normals, uvs, indices });
}

function clip(
  input: Float64Array,
  output: Float64Array,
  count: number,
  dimension: number,
  sign: number,
  halfSize: number,
): number {
  let written = 0;
  let previous = (count - 1) * 6;
  let previousDistance = sign * input[previous + dimension] - halfSize;
  for (let vertex = 0; vertex < count; vertex++) {
    const current = vertex * 6;
    const distance = sign * input[current + dimension] - halfSize;
    if (distance <= 0 !== previousDistance <= 0)
      written = emit(
        input,
        output,
        written,
        previous,
        current,
        previousDistance / (previousDistance - distance),
      );
    if (distance <= 0)
      written = emit(input, output, written, current, current, 0);
    previous = current;
    previousDistance = distance;
  }
  if (
    written > 1 &&
    output[0] === output[(written - 1) * 6] &&
    output[1] === output[(written - 1) * 6 + 1] &&
    output[2] === output[(written - 1) * 6 + 2]
  )
    written--;
  return written;
}

function emit(
  input: Float64Array,
  output: Float64Array,
  written: number,
  a: number,
  b: number,
  t: number,
): number {
  const dest = written * 6;
  const x = input[a] + (input[b] - input[a]) * t;
  const y = input[a + 1] + (input[b + 1] - input[a + 1]) * t;
  const z = input[a + 2] + (input[b + 2] - input[a + 2]) * t;
  if (
    written &&
    output[dest - 6] === x &&
    output[dest - 5] === y &&
    output[dest - 4] === z
  )
    return written;
  output[dest] = x;
  output[dest + 1] = y;
  output[dest + 2] = z;
  for (let component = 3; component < 6; component++)
    output[dest + component] =
      input[a + component] + (input[b + component] - input[a + component]) * t;
  return written + 1;
}
