import { Matrix4, Quaternion, Vector3 } from '../../math/src/index.js';
import { lookAtRotation } from './camera-utils.js';
import type { PerspectiveCamera } from './perspective-camera.js';

export type Camera3D = PerspectiveCamera | OrthographicCamera;

/** Centered orthographic camera with vertical size height / zoom and depth in [0, 1]. */
export class OrthographicCamera {
  readonly position = new Vector3(0, 0, 5);
  readonly rotation = new Quaternion();
  height = 10;
  zoom = 1;
  near = 0.1;
  far = 100;
  readonly matrix = new Matrix4();
  private readonly view = new Matrix4();
  private readonly unitScale = new Vector3(1, 1, 1);

  lookAt(target: Vector3): void {
    lookAtRotation(this.position, target, this.rotation);
  }

  updateMatrix(aspect: number): Matrix4 {
    if (
      !Number.isFinite(aspect) ||
      aspect <= 0 ||
      !Number.isFinite(this.height) ||
      this.height <= 0 ||
      !Number.isFinite(this.zoom) ||
      this.zoom <= 0 ||
      !Number.isFinite(this.near) ||
      this.near < 0 ||
      !Number.isFinite(this.far) ||
      this.far <= this.near
    )
      throw new RangeError(
        'Orthographic camera requires positive aspect, height and zoom, and 0 <= near < far.',
      );
    this.view.compose(this.position, this.rotation, this.unitScale).invert();
    const e = this.matrix.identity().elements;
    e[0] = (2 * this.zoom) / (this.height * aspect);
    e[5] = (2 * this.zoom) / this.height;
    e[10] = 1 / (this.near - this.far);
    e[14] = this.near / (this.near - this.far);
    return this.matrix.multiply(this.view);
  }
}
