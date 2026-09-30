import { Matrix4 } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { Mesh, type MeshOptions } from './mesh.js';
import { Object3D } from './object3d.js';

export interface SkinnedMeshOptions extends MeshOptions {
  joints: readonly Object3D[];
  inverseBindMatrices?: readonly Matrix4[];
  jointIndices: ArrayLike<number>;
  weights: ArrayLike<number>;
}

function cloneGeometry(source: Geometry): Geometry {
  const count = source.vertices.length / 8;
  const positions = new Float32Array(count * 3),
    normals = new Float32Array(count * 3),
    uvs = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < 3; j++) {
      positions[i * 3 + j] = source.vertices[i * 8 + j];
      normals[i * 3 + j] = source.vertices[i * 8 + 3 + j];
    }
    uvs[i * 2] = source.vertices[i * 8 + 6];
    uvs[i * 2 + 1] = source.vertices[i * 8 + 7];
  }
  return new Geometry({ positions, normals, uvs, indices: source.indices });
}

/** Owns deformed geometry; source geometry, joints and material remain borrowed. */
export class SkinnedMesh extends Mesh {
  readonly joints: readonly Object3D[];
  readonly inverseBindMatrices: readonly Matrix4[];
  private readonly jointIndices: Uint32Array;
  private readonly weights: Float32Array;
  private readonly bindVertices: Float32Array;
  private readonly matrices: Matrix4[];
  private readonly previous: Float32Array;
  private readonly inverse = new Matrix4();
  private readonly blend = new Matrix4();
  private initialized = false;

  constructor(options: SkinnedMeshOptions) {
    super({ ...options, geometry: cloneGeometry(options.geometry) });
    const count = this.geometry.vertices.length / 8;
    if (
      !options.joints.length ||
      options.jointIndices.length !== count * 4 ||
      options.weights.length !== count * 4 ||
      (options.inverseBindMatrices &&
        options.inverseBindMatrices.length !== options.joints.length)
    )
      throw new RangeError(
        'Skin joint, weight and inverse bind counts do not match.',
      );
    for (const joint of options.joints)
      if (!(joint instanceof Object3D))
        throw new TypeError('Skin joints require Object3D.');
    this.joints = [...options.joints];
    this.inverseBindMatrices = options.joints.map((_, i) => {
      const matrix = new Matrix4(),
        source = options.inverseBindMatrices?.[i];
      if (source) matrix.copy(source);
      const e = matrix.elements;
      for (const value of e)
        if (!Number.isFinite(value))
          throw new RangeError('Inverse bind matrices must be finite.');
      if (e[3] !== 0 || e[7] !== 0 || e[11] !== 0 || e[15] !== 1)
        throw new RangeError('Inverse bind matrices must be affine.');
      return matrix;
    });
    this.matrices = options.joints.map(() => new Matrix4());
    this.previous = new Float32Array(options.joints.length * 16);
    this.jointIndices = new Uint32Array(count * 4);
    this.weights = new Float32Array(count * 4);
    this.bindVertices = this.geometry.vertices.slice();
    for (let i = 0; i < count; i++) {
      let total = 0;
      for (let j = 0; j < 4; j++) {
        const k = i * 4 + j,
          joint = options.jointIndices[k],
          weight = options.weights[k];
        if (
          !Number.isSafeInteger(joint) ||
          joint < 0 ||
          joint >= this.joints.length ||
          !Number.isFinite(weight) ||
          weight < 0
        )
          throw new RangeError('Skin joint indices or weights are invalid.');
        this.jointIndices[k] = joint;
        total += weight;
      }
      if (!Number.isFinite(total) || total <= 0)
        throw new RangeError('Skin weights must have a positive total.');
      for (let j = 0; j < 4; j++)
        this.weights[i * 4 + j] = options.weights[i * 4 + j] / total;
    }
  }

  /** Morphs the bind pose first, then skins it. */
  override updateDeformation(): void {
    this.updateSkin();
  }

  updateSkin(): void {
    this.inverse.copy(this.updateWorldMatrix()).invert();
    let changed = !this.initialized;
    if (this.morph?.apply(this.bindVertices)) changed = true;
    for (let i = 0; i < this.joints.length; i++) {
      const matrix = this.matrices[i]
        .copy(this.inverse)
        .multiply(this.joints[i].updateWorldMatrix())
        .multiply(this.inverseBindMatrices[i]);
      for (let j = 0; j < 16; j++) {
        const k = i * 16 + j;
        if (matrix.elements[j] !== this.previous[k]) changed = true;
        this.previous[k] = matrix.elements[j];
      }
    }
    if (!changed) return;
    const out = this.geometry.vertices,
      source = this.bindVertices;
    for (let i = 0; i < out.length / 8; i++) {
      const e = this.blend.elements;
      e.fill(0);
      for (let j = 0; j < 4; j++) {
        const weight = this.weights[i * 4 + j];
        if (weight === 0) continue;
        const joint = this.matrices[this.jointIndices[i * 4 + j]].elements;
        for (let k = 0; k < 16; k++) e[k] += weight * joint[k];
      }
      const offset = i * 8,
        x = source[offset],
        y = source[offset + 1],
        z = source[offset + 2];
      out[offset] = e[0] * x + e[4] * y + e[8] * z + e[12];
      out[offset + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      out[offset + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      // Cofactors give inverse-transpose directions without dividing by a tiny determinant.
      // They also remain defined for a temporarily collapsed blend of rotating joints.
      const c00 = e[5] * e[10] - e[9] * e[6],
        c01 = e[9] * e[2] - e[1] * e[10],
        c02 = e[1] * e[6] - e[5] * e[2];
      const c10 = e[8] * e[6] - e[4] * e[10],
        c11 = e[0] * e[10] - e[8] * e[2],
        c12 = e[4] * e[2] - e[0] * e[6];
      const c20 = e[4] * e[9] - e[8] * e[5],
        c21 = e[8] * e[1] - e[0] * e[9],
        c22 = e[0] * e[5] - e[4] * e[1];
      const sign = e[0] * c00 + e[4] * c01 + e[8] * c02 < 0 ? -1 : 1;
      const nx = source[offset + 3],
        ny = source[offset + 4],
        nz = source[offset + 5];
      const tx = sign * (c00 * nx + c01 * ny + c02 * nz);
      const ty = sign * (c10 * nx + c11 * ny + c12 * nz);
      const tz = sign * (c20 * nx + c21 * ny + c22 * nz);
      const length = Math.hypot(tx, ty, tz);
      out[offset + 3] = length ? tx / length : 0;
      out[offset + 4] = length ? ty / length : 0;
      out[offset + 5] = length ? tz / length : 0;
    }
    this.initialized = true;
    this.geometry.markUpdated();
  }
}
