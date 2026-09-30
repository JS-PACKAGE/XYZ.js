import { Matrix4, Quaternion, Vector3 } from '../../math/src/index.js';
import { lookAtRotation } from './camera-utils.js';

/** Right-handed camera looking down -Z; WebGPU clip depth is 0..1. */
export class PerspectiveCamera {
  readonly position = new Vector3(0, 0, 5);
  readonly rotation = new Quaternion();
  fov = Math.PI / 3;
  near = 0.1;
  far = 100;
  private readonly view = new Matrix4();
  private readonly unitScale = new Vector3(1, 1, 1);
  readonly matrix = new Matrix4();

  lookAt(target: Vector3): void {
    lookAtRotation(this.position, target, this.rotation);
  }

  /** Recomputes projection * inverse(camera translation * rotation). */
  updateMatrix(aspect: number): Matrix4 {
    if (
      !Number.isFinite(aspect) ||
      aspect <= 0 ||
      !Number.isFinite(this.fov) ||
      this.fov <= 0 ||
      this.fov >= Math.PI ||
      !Number.isFinite(this.near) ||
      this.near <= 0 ||
      !Number.isFinite(this.far) ||
      this.far <= this.near
    )
      throw new RangeError(
        'Camera requires positive aspect, fov in (0, PI), and 0 < near < far.',
      );
    this.view.compose(this.position, this.rotation, this.unitScale).invert();
    return this.matrix
      .perspective(this.fov, aspect, this.near, this.far)
      .multiply(this.view);
  }
}
