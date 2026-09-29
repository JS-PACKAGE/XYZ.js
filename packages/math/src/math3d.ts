export class Vector3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(other: Vector3): this {
    return this.set(other.x, other.y, other.z);
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  add(other: Vector3): this {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  }

  subtract(other: Vector3): this {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
  }

  scale(factor: number): this {
    this.x *= factor;
    this.y *= factor;
    this.z *= factor;
    return this;
  }

  length(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Vector3): this {
    const x = this.y * other.z - this.z * other.y;
    const y = this.z * other.x - this.x * other.z;
    const z = this.x * other.y - this.y * other.x;
    return this.set(x, y, z);
  }

  normalize(): this {
    const magnitude = this.length();
    if (magnitude !== 0) this.scale(1 / magnitude);
    return this;
  }
}

export class Quaternion {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1,
  ) {}

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  copy(other: Quaternion): this {
    return this.set(other.x, other.y, other.z, other.w);
  }

  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  normalize(): this {
    const magnitude = Math.hypot(this.x, this.y, this.z, this.w);
    if (magnitude !== 0) {
      const reciprocal = 1 / magnitude;
      this.x *= reciprocal;
      this.y *= reciprocal;
      this.z *= reciprocal;
      this.w *= reciprocal;
    }
    return this;
  }

  /** Intrinsic XYZ Euler angles in radians (rotation matrix Rx * Ry * Rz). */
  setFromEuler(x: number, y: number, z: number): this {
    const cx = Math.cos(x / 2);
    const cy = Math.cos(y / 2);
    const cz = Math.cos(z / 2);
    const sx = Math.sin(x / 2);
    const sy = Math.sin(y / 2);
    const sz = Math.sin(z / 2);
    return this.set(
      sx * cy * cz + cx * sy * sz,
      cx * sy * cz - sx * cy * sz,
      cx * cy * sz + sx * sy * cz,
      cx * cy * cz - sx * sy * sz,
    );
  }
}

/** Column-major 4x4 matrix transforming column vectors; composition is translation * rotation * scale. */
export class Matrix4 {
  readonly elements = new Float32Array(16);

  constructor() {
    this.identity();
  }

  identity(): this {
    const e = this.elements;
    e[0] = 1;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;
    e[4] = 0;
    e[5] = 1;
    e[6] = 0;
    e[7] = 0;
    e[8] = 0;
    e[9] = 0;
    e[10] = 1;
    e[11] = 0;
    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;
    return this;
  }

  copy(other: Matrix4): this {
    this.elements.set(other.elements);
    return this;
  }

  /** Post-multiply in place: this = this * right. Supports self-multiplication. */
  multiply(right: Matrix4): this {
    const e = this.elements;
    const r = right.elements;
    const a00 = e[0],
      a01 = e[1],
      a02 = e[2],
      a03 = e[3];
    const a10 = e[4],
      a11 = e[5],
      a12 = e[6],
      a13 = e[7];
    const a20 = e[8],
      a21 = e[9],
      a22 = e[10],
      a23 = e[11];
    const a30 = e[12],
      a31 = e[13],
      a32 = e[14],
      a33 = e[15];
    // Cache right-hand columns before writes, including when right === this.
    const b00 = r[0],
      b01 = r[1],
      b02 = r[2],
      b03 = r[3];
    const b10 = r[4],
      b11 = r[5],
      b12 = r[6],
      b13 = r[7];
    const b20 = r[8],
      b21 = r[9],
      b22 = r[10],
      b23 = r[11];
    const b30 = r[12],
      b31 = r[13],
      b32 = r[14],
      b33 = r[15];
    e[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    e[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    e[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    e[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    e[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    e[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    e[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    e[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    e[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    e[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    e[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    e[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    e[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    e[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    e[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    e[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return this;
  }

  compose(position: Vector3, rotation: Quaternion, scale: Vector3): this {
    const x = rotation.x,
      y = rotation.y,
      z = rotation.z,
      w = rotation.w;
    const x2 = x + x,
      y2 = y + y,
      z2 = z + z;
    const xx = x * x2,
      xy = x * y2,
      xz = x * z2;
    const yy = y * y2,
      yz = y * z2,
      zz = z * z2;
    const wx = w * x2,
      wy = w * y2,
      wz = w * z2;
    const e = this.elements;
    e[0] = (1 - yy - zz) * scale.x;
    e[1] = (xy + wz) * scale.x;
    e[2] = (xz - wy) * scale.x;
    e[3] = 0;
    e[4] = (xy - wz) * scale.y;
    e[5] = (1 - xx - zz) * scale.y;
    e[6] = (yz + wx) * scale.y;
    e[7] = 0;
    e[8] = (xz + wy) * scale.z;
    e[9] = (yz - wx) * scale.z;
    e[10] = (1 - xx - yy) * scale.z;
    e[11] = 0;
    e[12] = position.x;
    e[13] = position.y;
    e[14] = position.z;
    e[15] = 1;
    return this;
  }

  invert(): this {
    const e = this.elements;
    const a00 = e[0],
      a01 = e[1],
      a02 = e[2],
      a03 = e[3];
    const a10 = e[4],
      a11 = e[5],
      a12 = e[6],
      a13 = e[7];
    const a20 = e[8],
      a21 = e[9],
      a22 = e[10],
      a23 = e[11];
    const a30 = e[12],
      a31 = e[13],
      a32 = e[14],
      a33 = e[15];
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    const determinant =
      b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (determinant === 0 || !Number.isFinite(determinant))
      throw new RangeError('Cannot invert a singular Matrix4');
    const reciprocal = 1 / determinant;
    e[0] = (a11 * b11 - a12 * b10 + a13 * b09) * reciprocal;
    e[1] = (a02 * b10 - a01 * b11 - a03 * b09) * reciprocal;
    e[2] = (a31 * b05 - a32 * b04 + a33 * b03) * reciprocal;
    e[3] = (a22 * b04 - a21 * b05 - a23 * b03) * reciprocal;
    e[4] = (a12 * b08 - a10 * b11 - a13 * b07) * reciprocal;
    e[5] = (a00 * b11 - a02 * b08 + a03 * b07) * reciprocal;
    e[6] = (a32 * b02 - a30 * b05 - a33 * b01) * reciprocal;
    e[7] = (a20 * b05 - a22 * b02 + a23 * b01) * reciprocal;
    e[8] = (a10 * b10 - a11 * b08 + a13 * b06) * reciprocal;
    e[9] = (a01 * b08 - a00 * b10 - a03 * b06) * reciprocal;
    e[10] = (a30 * b04 - a31 * b02 + a33 * b00) * reciprocal;
    e[11] = (a21 * b02 - a20 * b04 - a23 * b00) * reciprocal;
    e[12] = (a11 * b07 - a10 * b09 - a12 * b06) * reciprocal;
    e[13] = (a00 * b09 - a01 * b07 + a02 * b06) * reciprocal;
    e[14] = (a31 * b01 - a30 * b03 - a32 * b00) * reciprocal;
    e[15] = (a20 * b03 - a21 * b01 + a22 * b00) * reciprocal;
    return this;
  }

  /** Right-handed perspective looking along -Z, with WebGPU depth in [0, 1]. */
  perspective(fov: number, aspect: number, near: number, far: number): this {
    const f = 1 / Math.tan(fov / 2);
    const e = this.elements;
    e[0] = f / aspect;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;
    e[4] = 0;
    e[5] = f;
    e[6] = 0;
    e[7] = 0;
    e[8] = 0;
    e[9] = 0;
    e[10] = far / (near - far);
    e[11] = -1;
    e[12] = 0;
    e[13] = 0;
    e[14] = (near * far) / (near - far);
    e[15] = 0;
    return this;
  }

  /** Projects homogeneous coordinates and divides by w; out may alias point. */
  transformPoint(point: Vector3, out: Vector3 = new Vector3()): Vector3 {
    const x = point.x,
      y = point.y,
      z = point.z;
    const e = this.elements;
    const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    return out.set(
      (e[0] * x + e[4] * y + e[8] * z + e[12]) / w,
      (e[1] * x + e[5] * y + e[9] * z + e[13]) / w,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) / w,
    );
  }
}

export interface Transform3DOptions {
  position?: Vector3;
  rotation?: Quaternion;
  scale?: Vector3;
}

export class Transform3D {
  readonly position: Vector3;
  readonly rotation: Quaternion;
  readonly scale: Vector3;
  readonly matrix = new Matrix4();

  constructor(options: Transform3DOptions = {}) {
    this.position = options.position?.clone() ?? new Vector3();
    this.rotation = options.rotation?.clone() ?? new Quaternion();
    this.scale = options.scale?.clone() ?? new Vector3(1, 1, 1);
    this.updateMatrix();
  }

  updateMatrix(): Matrix4 {
    return this.matrix.compose(this.position, this.rotation, this.scale);
  }
}
