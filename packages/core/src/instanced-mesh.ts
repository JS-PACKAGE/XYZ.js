import { Matrix4 } from '../../math/src/index.js';
import { Mesh, type MeshOptions } from './mesh.js';
import {
  transformSphereElements,
  type BoundingSphere3D,
} from './render-bounds.js';

export interface InstancedMeshOptions extends MeshOptions {
  count: number;
}

/** One geometry/material draw with mesh.worldMatrix * each local instance matrix. */
export class InstancedMesh extends Mesh {
  readonly count: number;
  /** Column-major matrices; use setMatrixAt to notify renderer upload caches. */
  readonly matrices: Float32Array;
  version = 0;
  private instanceColors: Float32Array | undefined;
  /** Bumped by every color change so renderer upload caches refresh. */
  colorVersion = 0;

  /**
   * Per-instance linear RGB (three floats each), or undefined while no color was ever set, in
   * which case every instance is white. Multiplied into the base color like vertex colors.
   */
  get colors(): Float32Array | undefined {
    return this.instanceColors;
  }

  private boundsVersion = -1;
  private geometryBoundsVersion = -1;
  private readonly aggregate: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private readonly instanceSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private readonly instanceDeformationSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };

  /** Bounds include every local instance, not just the mesh's base geometry. */
  override get boundingSphere(): Readonly<BoundingSphere3D> {
    if (
      this.boundsVersion === this.version &&
      this.geometryBoundsVersion === this.geometry.version
    )
      return this.aggregate;
    const sphere = super.boundingSphere,
      displacement = this.material.deformationBounds;
    const base = this.instanceDeformationSphere;
    base.x = sphere.x;
    base.y = sphere.y;
    base.z = sphere.z;
    base.radius =
      displacement === undefined ? Infinity : sphere.radius + displacement;
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let index = 0; index < this.count; index++) {
      const s = transformSphereElements(
        base,
        this.matrices,
        index * 16,
        this.instanceSphere,
      );
      minX = Math.min(minX, s.x - s.radius);
      minY = Math.min(minY, s.y - s.radius);
      minZ = Math.min(minZ, s.z - s.radius);
      maxX = Math.max(maxX, s.x + s.radius);
      maxY = Math.max(maxY, s.y + s.radius);
      maxZ = Math.max(maxZ, s.z + s.radius);
    }
    this.aggregate.x = (minX + maxX) / 2;
    this.aggregate.y = (minY + maxY) / 2;
    this.aggregate.z = (minZ + maxZ) / 2;
    this.aggregate.radius =
      Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2;
    this.boundsVersion = this.version;
    this.geometryBoundsVersion = this.geometry.version;
    return this.aggregate;
  }

  constructor(options: InstancedMeshOptions) {
    super(options);
    if (
      !Number.isSafeInteger(options.count) ||
      options.count < 1 ||
      options.count > Math.floor(0xffffffff / 16)
    )
      throw new RangeError(
        'Instance count must be a positive supported integer.',
      );
    this.count = options.count;
    this.matrices = new Float32Array(this.count * 16);
    for (let i = 0; i < this.count; i++) {
      const offset = i * 16;
      this.matrices[offset] = 1;
      this.matrices[offset + 5] = 1;
      this.matrices[offset + 10] = 1;
      this.matrices[offset + 15] = 1;
    }
  }

  setMatrixAt(index: number, matrix: Matrix4): void {
    this.validateIndex(index);
    if (!(matrix instanceof Matrix4))
      throw new TypeError('Instance transform must be a Matrix4.');
    const e = matrix.elements;
    for (let i = 0; i < 16; i++) {
      if (!Number.isFinite(e[i]))
        throw new RangeError('Instance transform components must be finite.');
    }
    if (e[3] !== 0 || e[7] !== 0 || e[11] !== 0 || e[15] !== 1)
      throw new RangeError('Instance transforms must be affine.');
    const determinant =
      e[0] * (e[5] * e[10] - e[9] * e[6]) -
      e[4] * (e[1] * e[10] - e[9] * e[2]) +
      e[8] * (e[1] * e[6] - e[5] * e[2]);
    if (determinant === 0 || !Number.isFinite(determinant))
      throw new RangeError(
        'Instance transforms must be invertible for lighting.',
      );
    this.matrices.set(e, index * 16);
    this.version++;
  }

  /** Sets one instance's color; components are finite and nonnegative (above 1 brightens). */
  setColorAt(index: number, r: number, g: number, b: number): void {
    this.validateIndex(index);
    if (
      !Number.isFinite(r) ||
      r < 0 ||
      !Number.isFinite(Math.fround(r)) ||
      !Number.isFinite(g) ||
      g < 0 ||
      !Number.isFinite(Math.fround(g)) ||
      !Number.isFinite(b) ||
      b < 0 ||
      !Number.isFinite(Math.fround(b))
    )
      throw new RangeError(
        'Instance color components must be finite and nonnegative.',
      );
    this.instanceColors ??= new Float32Array(this.count * 3).fill(1);
    const offset = index * 3;
    this.instanceColors[offset] = r;
    this.instanceColors[offset + 1] = g;
    this.instanceColors[offset + 2] = b;
    this.colorVersion++;
  }

  getColorAt(
    index: number,
    out: [number, number, number],
  ): [number, number, number] {
    this.validateIndex(index);
    const colors = this.instanceColors;
    out[0] = colors?.[index * 3] ?? 1;
    out[1] = colors?.[index * 3 + 1] ?? 1;
    out[2] = colors?.[index * 3 + 2] ?? 1;
    return out;
  }

  getMatrixAt(index: number, out: Matrix4): Matrix4 {
    this.validateIndex(index);
    if (!(out instanceof Matrix4))
      throw new TypeError('Instance transform output must be a Matrix4.');
    const offset = index * 16;
    for (let i = 0; i < 16; i++) out.elements[i] = this.matrices[offset + i];
    return out;
  }

  private validateIndex(index: number): void {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.count)
      throw new RangeError(
        'Instance index is outside the mesh instance range.',
      );
  }
}
