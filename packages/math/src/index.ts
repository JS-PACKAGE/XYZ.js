export class Vector2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(other: Vector2): this {
    return this.set(other.x, other.y);
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(other: Vector2): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  subtract(other: Vector2): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  scale(factor: number): this {
    this.x *= factor;
    this.y *= factor;
    return this;
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  normalize(): this {
    const magnitude = this.length();
    if (magnitude !== 0) this.scale(1 / magnitude);
    return this;
  }
}

/** Column-major affine matrix; transforms column vectors as translation * rotation * scale. */
export class Matrix3 {
  readonly elements = new Float32Array(9);

  constructor() {
    this.identity();
  }

  identity(): this {
    const e = this.elements;
    e[0] = 1;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;
    e[4] = 1;
    e[5] = 0;
    e[6] = 0;
    e[7] = 0;
    e[8] = 1;
    return this;
  }

  compose(position: Vector2, rotation: number, scale: Vector2): this {
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const e = this.elements;
    e[0] = cosine * scale.x;
    e[1] = sine * scale.x;
    e[2] = 0;
    e[3] = -sine * scale.y;
    e[4] = cosine * scale.y;
    e[5] = 0;
    e[6] = position.x;
    e[7] = position.y;
    e[8] = 1;
    return this;
  }

  invert(): this {
    const e = this.elements;
    const a = e[0],
      b = e[1],
      c = e[3],
      d = e[4];
    const determinant = a * d - b * c;
    if (determinant === 0 || !Number.isFinite(determinant))
      throw new RangeError('Cannot invert a singular Matrix3');
    const tx = e[6],
      ty = e[7];
    const reciprocal = 1 / determinant;
    e[0] = d * reciprocal;
    e[1] = -b * reciprocal;
    e[2] = 0;
    e[3] = -c * reciprocal;
    e[4] = a * reciprocal;
    e[5] = 0;
    e[6] = (c * ty - d * tx) * reciprocal;
    e[7] = (b * tx - a * ty) * reciprocal;
    e[8] = 1;
    return this;
  }

  transformPoint(point: Vector2, out: Vector2 = new Vector2()): Vector2 {
    const x = point.x,
      y = point.y;
    const e = this.elements;
    return out.set(e[0] * x + e[3] * y + e[6], e[1] * x + e[4] * y + e[7]);
  }
}

export interface Transform2DOptions {
  position?: Vector2;
  rotation?: number;
  scale?: Vector2;
}

export class Transform2D {
  readonly position: Vector2;
  rotation: number;
  readonly scale: Vector2;
  readonly matrix = new Matrix3();

  constructor(options: Transform2DOptions = {}) {
    this.position = options.position?.clone() ?? new Vector2();
    this.rotation = options.rotation ?? 0;
    this.scale = options.scale?.clone() ?? new Vector2(1, 1);
    this.updateMatrix();
  }

  updateMatrix(): Matrix3 {
    return this.matrix.compose(this.position, this.rotation, this.scale);
  }
}

export { Matrix4, Quaternion, Transform3D, Vector3 } from './math3d.js';
export type { Transform3DOptions } from './math3d.js';
