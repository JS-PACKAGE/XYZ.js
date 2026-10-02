import { Matrix4 } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { Mesh } from './mesh.js';
import type { MeshOptions } from './mesh.js';
import { Object3D } from './object3d.js';

export interface SkinnedMeshOptions extends MeshOptions {
  joints: readonly Object3D[];
  inverseBindMatrices?: readonly Matrix4[];
  jointIndices: ArrayLike<number>;
  weights: ArrayLike<number>;
  /** Four preserves the 1.x stream contract; eight consumes both glTF influence sets. */
  influencesPerVertex?: 4 | 8;
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
  return new Geometry({
    positions,
    normals,
    uvs,
    uvs1: source.uvs1,
    indices: source.indices,
    colors: source.colors,
  });
}

/** Native bind-pose streams and an on-demand exact CPU picking mirror; joints remain borrowed. */
export class SkinnedMesh extends Mesh {
  readonly joints: readonly Object3D[];
  readonly inverseBindMatrices: readonly Matrix4[];
  readonly jointIndices: Uint32Array;
  readonly weights: Float32Array;
  readonly influencesPerVertex: 4 | 8;
  readonly jointPalette: Float32Array;
  paletteVersion = 0;
  private readonly skinGeometry: Geometry;
  private readonly bindVertices: Float32Array;
  private readonly matrices: Matrix4[];
  private readonly influenceBounds: Float32Array;
  private readonly sphere = { x: 0, y: 0, z: 0, radius: 0 };
  private readonly inverse = new Matrix4();
  private readonly blend = new Matrix4();
  private initialized = false;
  private deformationVersion = 0;
  private mirrorVersion = -1;

  protected override get cullable(): boolean {
    return true;
  }

  override get renderGeometry(): Geometry {
    return this.skinGeometry;
  }

  override get boundingSphere(): Readonly<{
    x: number;
    y: number;
    z: number;
    radius: number;
  }> {
    this.updateRenderDeformation();
    return this.sphere;
  }

  constructor(options: SkinnedMeshOptions) {
    super({ ...options, geometry: cloneGeometry(options.geometry) });
    const count = this.geometry.vertices.length / 8;
    const influences = options.influencesPerVertex ?? 4;
    if (influences !== 4 && influences !== 8)
      throw new RangeError('Skin influences per vertex must be four or eight.');
    this.influencesPerVertex = influences;
    if (
      !options.joints.length ||
      options.jointIndices.length !== count * influences ||
      options.weights.length !== count * influences ||
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
    this.jointPalette = new Float32Array(options.joints.length * 16);
    this.influenceBounds = new Float32Array(options.joints.length * 6);
    this.jointIndices = new Uint32Array(count * influences);
    this.weights = new Float32Array(count * influences);
    this.skinGeometry = cloneGeometry(options.geometry);
    this.bindVertices = this.skinGeometry.vertices;
    for (let i = 0; i < count; i++) {
      let total = 0;
      for (let j = 0; j < influences; j++) {
        const k = i * influences + j,
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
      for (let j = 0; j < influences; j++)
        this.weights[i * influences + j] =
          options.weights[i * influences + j] / total;
    }
    this.refreshInfluenceBounds();
  }

  /** Morphs the bind pose first, then skins it. */
  override updateDeformation(): void {
    this.updateSkin();
  }

  /** Updates only the palette and conservative bounds; joint motion never deforms all vertices. */
  override updateRenderDeformation(): void {
    this.inverse.copy(this.updateWorldMatrix()).invert();
    let changed = !this.initialized;
    const morphed = this.morph?.apply(this.bindVertices) ?? false;
    if (morphed) {
      this.skinGeometry.markUpdated();
      this.refreshInfluenceBounds();
    }
    for (let i = 0; i < this.joints.length; i++) {
      const matrix = this.matrices[i]
        .copy(this.inverse)
        .multiply(this.joints[i].updateWorldMatrix())
        .multiply(this.inverseBindMatrices[i]);
      for (let j = 0; j < 16; j++) {
        const k = i * 16 + j;
        if (matrix.elements[j] !== this.jointPalette[k]) changed = true;
        this.jointPalette[k] = matrix.elements[j];
      }
    }
    if (!changed && !morphed) return;
    if (changed) this.paletteVersion++;
    this.initialized = true;
    this.deformationVersion++;
    this.refreshAnimatedBounds();
  }

  updateSkin(): void {
    this.updateRenderDeformation();
    if (this.mirrorVersion === this.deformationVersion) return;
    const out = this.geometry.vertices,
      source = this.bindVertices;
    for (let i = 0; i < out.length / 8; i++) {
      const e = this.blend.elements;
      e.fill(0);
      for (let j = 0; j < this.influencesPerVertex; j++) {
        const index = i * this.influencesPerVertex + j;
        const weight = this.weights[index];
        if (weight === 0) continue;
        const joint = this.matrices[this.jointIndices[index]].elements;
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
    this.mirrorVersion = this.deformationVersion;
    this.geometry.markUpdated();
  }

  private refreshInfluenceBounds(): void {
    const bounds = this.influenceBounds;
    for (let joint = 0; joint < this.joints.length; joint++) {
      const offset = joint * 6;
      bounds.fill(Infinity, offset, offset + 3);
      bounds.fill(-Infinity, offset + 3, offset + 6);
    }
    for (let vertex = 0; vertex < this.bindVertices.length / 8; vertex++)
      for (
        let influence = 0;
        influence < this.influencesPerVertex;
        influence++
      ) {
        const index = vertex * this.influencesPerVertex + influence;
        if (this.weights[index] === 0) continue;
        const offset = this.jointIndices[index] * 6;
        for (let axis = 0; axis < 3; axis++) {
          const value = this.bindVertices[vertex * 8 + axis];
          bounds[offset + axis] = Math.min(bounds[offset + axis], value);
          bounds[offset + 3 + axis] = Math.max(
            bounds[offset + 3 + axis],
            value,
          );
        }
      }
  }

  private refreshAnimatedBounds(): void {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let joint = 0; joint < this.joints.length; joint++) {
      const offset = joint * 6,
        bounds = this.influenceBounds;
      if (bounds[offset] === Infinity) continue;
      const e = this.matrices[joint].elements;
      for (let corner = 0; corner < 8; corner++) {
        const x = bounds[offset + (corner & 1 ? 3 : 0)];
        const y = bounds[offset + (corner & 2 ? 4 : 1)];
        const z = bounds[offset + (corner & 4 ? 5 : 2)];
        const tx = e[0] * x + e[4] * y + e[8] * z + e[12];
        const ty = e[1] * x + e[5] * y + e[9] * z + e[13];
        const tz = e[2] * x + e[6] * y + e[10] * z + e[14];
        minX = Math.min(minX, tx);
        minY = Math.min(minY, ty);
        minZ = Math.min(minZ, tz);
        maxX = Math.max(maxX, tx);
        maxY = Math.max(maxY, ty);
        maxZ = Math.max(maxZ, tz);
      }
    }
    // Nonnegative normalized weights make every blended point a convex combination
    // inside this union of transformed influence boxes, including negative morph weights.
    this.sphere.x = (minX + maxX) * 0.5;
    this.sphere.y = (minY + maxY) * 0.5;
    this.sphere.z = (minZ + maxZ) * 0.5;
    const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) * 0.5;
    this.sphere.radius =
      radius +
      Math.max(
        1,
        radius,
        Math.abs(this.sphere.x),
        Math.abs(this.sphere.y),
        Math.abs(this.sphere.z),
      ) *
        0.000001;
  }
}
