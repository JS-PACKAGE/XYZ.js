import { Matrix4 } from '../../math/src/index.js';
import { Mesh, type MeshOptions } from './mesh.js';

export interface InstancedMeshOptions extends MeshOptions {
  count: number;
}

/** One geometry/material draw with mesh.worldMatrix * each local instance matrix. */
export class InstancedMesh extends Mesh {
  readonly count: number;
  /** Column-major matrices; use setMatrixAt to notify renderer upload caches. */
  readonly matrices: Float32Array;
  version = 0;

  protected override get cullable(): boolean {
    return false;
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
