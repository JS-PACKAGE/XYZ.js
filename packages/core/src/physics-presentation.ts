import {
  Transform2D,
  Transform3D,
  type Matrix3,
  type Matrix4,
} from '../../math/src/index.js';

export class PhysicsPresentation2D {
  private readonly previous = new Float64Array(3);
  private readonly current = new Float64Array(3);
  private readonly display = new Transform2D();
  private sealed = false;
  capture(transform: Transform2D): void {
    this.previous[0] = transform.position.x;
    this.previous[1] = transform.position.y;
    this.previous[2] = transform.rotation;
    this.sealed = false;
  }
  seal(transform: Transform2D): void {
    this.current[0] = transform.position.x;
    this.current[1] = transform.position.y;
    this.current[2] = transform.rotation;
    this.sealed = true;
  }
  matrix(transform: Transform2D, alpha: number): Matrix3 {
    const { position, rotation } = transform;
    if (
      !this.sealed ||
      position.x !== this.current[0] ||
      position.y !== this.current[1] ||
      rotation !== this.current[2]
    )
      return transform.updateMatrix();
    this.display.position.set(
      this.previous[0] + (position.x - this.previous[0]) * alpha,
      this.previous[1] + (position.y - this.previous[1]) * alpha,
    );
    const angle = Math.atan2(
      Math.sin(rotation - this.previous[2]),
      Math.cos(rotation - this.previous[2]),
    );
    this.display.rotation = this.previous[2] + angle * alpha;
    this.display.scale.set(transform.scale.x, transform.scale.y);
    this.display.pivot.set(transform.pivot.x, transform.pivot.y);
    this.display.skew.set(transform.skew.x, transform.skew.y);
    return this.display.updateMatrix();
  }
}

export class PhysicsPresentation3D {
  private readonly previous = new Float64Array(7);
  private readonly current = new Float64Array(7);
  private readonly display = new Transform3D();
  private sealed = false;
  private copy(transform: Transform3D, out: Float64Array): void {
    out[0] = transform.position.x;
    out[1] = transform.position.y;
    out[2] = transform.position.z;
    out[3] = transform.rotation.x;
    out[4] = transform.rotation.y;
    out[5] = transform.rotation.z;
    out[6] = transform.rotation.w;
  }
  capture(transform: Transform3D): void {
    this.copy(transform, this.previous);
    this.sealed = false;
  }
  seal(transform: Transform3D): void {
    this.copy(transform, this.current);
    this.sealed = true;
  }
  matrix(transform: Transform3D, alpha: number): Matrix4 {
    const p = transform.position,
      q = transform.rotation,
      current = this.current,
      previous = this.previous;
    if (
      !this.sealed ||
      p.x !== current[0] ||
      p.y !== current[1] ||
      p.z !== current[2] ||
      q.x !== current[3] ||
      q.y !== current[4] ||
      q.z !== current[5] ||
      q.w !== current[6]
    )
      return transform.updateMatrix();
    this.display.position.set(
      previous[0] + (p.x - previous[0]) * alpha,
      previous[1] + (p.y - previous[1]) * alpha,
      previous[2] + (p.z - previous[2]) * alpha,
    );
    let dot =
      previous[3] * q.x +
      previous[4] * q.y +
      previous[5] * q.z +
      previous[6] * q.w;
    const sign = dot < 0 ? -1 : 1;
    dot = Math.min(1, Math.max(0, Math.abs(dot)));
    let a = 1 - alpha,
      b = alpha;
    if (dot < 0.9995) {
      const angle = Math.acos(dot),
        inverseSine = 1 / Math.sin(angle);
      a = Math.sin((1 - alpha) * angle) * inverseSine;
      b = Math.sin(alpha * angle) * inverseSine;
    }
    b *= sign;
    this.display.rotation
      .set(
        previous[3] * a + q.x * b,
        previous[4] * a + q.y * b,
        previous[5] * a + q.z * b,
        previous[6] * a + q.w * b,
      )
      .normalize();
    this.display.scale.set(
      transform.scale.x,
      transform.scale.y,
      transform.scale.z,
    );
    return this.display.updateMatrix();
  }
}
