import { ribbonLimits } from '../../../src/data/ribbon.js';
import { Geometry } from './geometry.js';
import { Mesh, type TextureMaterial } from './mesh.js';
import { Object3D } from './object3d.js';

export interface RibbonCurveKey {
  /** Normalized age, from zero (new) to one (expired). */
  age: number;
  width: number;
  color: readonly [number, number, number, number];
}
export interface Ribbon3DOptions {
  material: TextureMaterial;
  maxPoints?: number;
  lifetime?: number;
  mode?: 'flat' | 'camera-facing';
  curve?: readonly RibbonCurveKey[];
}
const defaultCurve: readonly RibbonCurveKey[] = [
  { age: 0, width: 1, color: [1, 1, 1, 1] },
  { age: 1, width: 0, color: [1, 1, 1, 0] },
];

/** Bounded dynamic triangle strip. Points and view direction are mesh-local. */
export class Ribbon3D extends Mesh {
  readonly maxPoints: number;
  readonly lifetime: number;
  readonly mode: 'flat' | 'camera-facing';
  private readonly curve: readonly RibbonCurveKey[];
  private readonly points: Float64Array;
  private start = 0;
  private count = 0;
  private clock = -Infinity;

  constructor(options: Ribbon3DOptions) {
    const capacity = options.maxPoints ?? ribbonLimits.defaultPoints;
    const lifetime = options.lifetime ?? ribbonLimits.defaultLifetime;
    const mode = options.mode ?? 'camera-facing';
    if (
      !Number.isSafeInteger(capacity) ||
      capacity < 2 ||
      capacity > ribbonLimits.maximumPoints
    )
      throw new RangeError('Ribbon maxPoints must be an integer in [2,65536].');
    if (!Number.isFinite(lifetime) || lifetime <= 0)
      throw new RangeError('Ribbon lifetime must be positive and finite.');
    if (mode !== 'flat' && mode !== 'camera-facing')
      throw new RangeError('Invalid ribbon orientation.');
    const curve = options.curve ?? defaultCurve;
    if (
      curve.length < 2 ||
      curve.length > ribbonLimits.maximumCurveKeys ||
      curve[0].age !== 0 ||
      curve[curve.length - 1].age !== 1
    )
      throw new RangeError('Ribbon curve needs 2–64 keys spanning [0,1].');
    for (let i = 0; i < curve.length; i++) {
      const key = curve[i];
      if (
        !Number.isFinite(key.age) ||
        (i > 0 && key.age <= curve[i - 1].age) ||
        !Number.isFinite(key.width) ||
        key.width < 0 ||
        key.color.length !== 4 ||
        key.color.some(
          (v, c) => !Number.isFinite(v) || v < 0 || (c === 3 && v > 1),
        )
      )
        throw new RangeError('Invalid ribbon age/width/color curve.');
    }
    const positions = new Float32Array(capacity * 6);
    const normals = new Float32Array(capacity * 6);
    const uvs = new Float32Array(capacity * 4);
    const indices = new Uint32Array((capacity - 1) * 6);
    for (let i = 0; i < capacity; i++) {
      normals[i * 6 + 1] = normals[i * 6 + 4] = 1;
      uvs[i * 4 + 2] = 1;
      if (i < capacity - 1)
        indices.set(
          [i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2],
          i * 6,
        );
    }
    const geometry = new Geometry({
      positions,
      normals,
      uvs,
      indices,
      colors: new Float32Array(capacity * 8),
    });
    super({ geometry, material: options.material, castShadow: false });
    this.maxPoints = capacity;
    this.lifetime = lifetime;
    this.mode = mode;
    this.curve = curve.map((key) => ({
      age: key.age,
      width: key.width,
      color: [...key.color] as [number, number, number, number],
    }));
    this.points = new Float64Array(capacity * 4);
    this.visible = false;
  }

  get pointCount(): number {
    return this.count;
  }

  /** Timestamps must be nondecreasing, in seconds. Oldest points are overwritten. */
  addPoint(x: number, y: number, z: number, time: number): void {
    if (
      ![x, y, z, time].every(Number.isFinite) ||
      ![x, y, z].every((v) => Number.isFinite(Math.fround(v))) ||
      time < this.clock
    )
      throw new RangeError(
        'Ribbon points require finite coordinates and monotonic time.',
      );
    this.clock = time;
    if (this.count === this.maxPoints) {
      this.start = (this.start + 1) % this.maxPoints;
      this.count--;
    }
    const index = ((this.start + this.count++) % this.maxPoints) * 4;
    this.points[index] = x;
    this.points[index + 1] = y;
    this.points[index + 2] = z;
    this.points[index + 3] = time;
  }

  clear(): void {
    this.start = 0;
    this.count = 0;
    this.clock = -Infinity;
    this.visible = false;
  }

  /** Reuses all vertex/index/color buffers; markUpdated drives native GPU re-upload. */
  update(
    time: number,
    viewDirection: readonly [number, number, number] = [0, 0, 1],
  ): void {
    if (
      !Number.isFinite(time) ||
      time < this.clock ||
      viewDirection.length !== 3 ||
      !viewDirection.every(Number.isFinite) ||
      Math.hypot(...viewDirection) === 0
    )
      throw new RangeError(
        'Ribbon update requires monotonic time and a finite nonzero view direction.',
      );
    this.clock = time;
    while (
      this.count &&
      time - this.points[this.start * 4 + 3] >= this.lifetime
    ) {
      this.start = (this.start + 1) % this.maxPoints;
      this.count--;
    }
    const vertices = this.geometry.vertices;
    const colors = this.geometry.colors!;
    for (let i = 0; i < this.maxPoints; i++) {
      const active = i < this.count;
      const point =
        ((this.start + Math.min(i, Math.max(0, this.count - 1))) %
          this.maxPoints) *
        4;
      const previous = ((this.start + Math.max(0, i - 1)) % this.maxPoints) * 4;
      const next =
        ((this.start + Math.min(this.count - 1, i + 1) + this.maxPoints) %
          this.maxPoints) *
        4;
      let sx = 1,
        sy = 0,
        sz = 0,
        nx = 0,
        ny = 1,
        nz = 0;
      const age = active
        ? Math.min(
            1,
            Math.max(0, (time - this.points[point + 3]) / this.lifetime),
          )
        : 1;
      let key = 1;
      while (key < this.curve.length - 1 && age > this.curve[key].age) key++;
      const a = this.curve[key - 1],
        b = this.curve[key];
      const t = (age - a.age) / (b.age - a.age);
      const width = active ? (a.width + (b.width - a.width) * t) * 0.5 : 0;
      if (active && this.count > 1) {
        const tx = this.points[next] - this.points[previous],
          ty = this.points[next + 1] - this.points[previous + 1],
          tz = this.points[next + 2] - this.points[previous + 2];
        nx = this.mode === 'flat' ? 0 : viewDirection[0];
        ny = this.mode === 'flat' ? 1 : viewDirection[1];
        nz = this.mode === 'flat' ? 0 : viewDirection[2];
        sx = ty * nz - tz * ny;
        sy = tz * nx - tx * nz;
        sz = tx * ny - ty * nx;
        const length = Math.hypot(sx, sy, sz);
        if (length > 1e-12) {
          sx /= length;
          sy /= length;
          sz /= length;
        } else {
          sx = 1;
          sy = 0;
          sz = 0;
        }
        const normalLength = Math.hypot(nx, ny, nz);
        nx /= normalLength;
        ny /= normalLength;
        nz /= normalLength;
      }
      for (let side = 0; side < 2; side++) {
        const vertex = (i * 2 + side) * 8,
          sign = side === 0 ? -1 : 1;
        vertices[vertex] = this.count
          ? this.points[point] + sx * width * sign
          : 0;
        vertices[vertex + 1] = this.count
          ? this.points[point + 1] + sy * width * sign
          : 0;
        vertices[vertex + 2] = this.count
          ? this.points[point + 2] + sz * width * sign
          : 0;
        vertices[vertex + 3] = nx;
        vertices[vertex + 4] = ny;
        vertices[vertex + 5] = nz;
        vertices[vertex + 6] = side;
        vertices[vertex + 7] = age;
        for (let c = 0; c < 4; c++)
          colors[(i * 2 + side) * 4 + c] = active
            ? a.color[c] + (b.color[c] - a.color[c]) * t
            : 0;
      }
    }
    this.visible = this.count >= 2;
    this.geometry.markUpdated();
  }
}

/** Samples a moving object into an unparented world-space ribbon. */
export class Trail3D extends Ribbon3D {
  readonly target: Object3D;
  readonly minimumDistance: number;
  private lastX = Infinity;
  private lastY = Infinity;
  private lastZ = Infinity;
  constructor(
    options: Ribbon3DOptions & { target: Object3D; minimumDistance?: number },
  ) {
    super(options);
    if (!(options.target instanceof Object3D))
      throw new TypeError('Trail target must be Object3D.');
    this.target = options.target;
    this.minimumDistance =
      options.minimumDistance ?? ribbonLimits.minimumDistance;
    if (!Number.isFinite(this.minimumDistance) || this.minimumDistance < 0)
      throw new RangeError('Trail minimumDistance must be nonnegative.');
  }
  sample(
    time: number,
    viewDirection?: readonly [number, number, number],
  ): void {
    const matrix = this.target.updateWorldMatrix().elements;
    const x = matrix[12],
      y = matrix[13],
      z = matrix[14];
    if (
      Math.hypot(x - this.lastX, y - this.lastY, z - this.lastZ) >=
      this.minimumDistance
    ) {
      this.addPoint(x, y, z, time);
      this.lastX = x;
      this.lastY = y;
      this.lastZ = z;
    }
    this.update(time, viewDirection);
  }
  override clear(): void {
    super.clear();
    this.lastX = this.lastY = this.lastZ = Infinity;
  }
}
