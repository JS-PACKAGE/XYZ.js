import { Texture } from '../../assets/src/index.js';
import { Matrix4, Vector3 } from '../../math/src/index.js';
import { lookAtRotation } from './camera-utils.js';
import { Geometry } from './geometry.js';
import { Group } from './group.js';
import {
  Mesh,
  TextureMaterial,
  type MeshOptions,
  type TextureMaterialOptions,
} from './mesh.js';
import type { Object3D } from './object3d.js';
import { OrthographicCamera } from './orthographic-camera.js';
import type { PerspectiveCamera } from './perspective-camera.js';
import type { Rect2D } from './gameplay/contracts.js';
import { validatedRegion } from './graphics2d/sprite-sheet.js';
import { transformSphere, type BoundingSphere3D } from './render-bounds.js';
import { visibilityLimits } from '../../../src/data/visibility.js';

type Camera3D = PerspectiveCamera | OrthographicCamera;

/**
 * Objects that need the camera before each draw. The Scene calls `updateForCamera` once per
 * frame, after all simulation and before rendering, for every registered object that has it.
 */
export interface CameraDependent3D {
  updateForCamera(
    camera: Camera3D,
    viewportHeight?: number,
    timeSeconds?: number,
  ): void;
}

export function isCameraDependent(
  object: unknown,
): object is Object3D & CameraDependent3D {
  return (
    typeof object === 'object' &&
    object !== null &&
    typeof (object as Partial<CameraDependent3D>).updateForCamera === 'function'
  );
}

const tmp = new Vector3();

/** Carries only the placement/visibility fields, so subclass-specific options never reach Mesh. */
function meshOptions(
  options: Omit<MeshOptions, 'geometry' | 'material'>,
  geometry: Geometry,
  material: TextureMaterial,
): MeshOptions {
  return {
    geometry,
    material,
    position: options.position,
    rotation: options.rotation,
    scale: options.scale,
    visible: options.visible,
    castShadow: options.castShadow,
    receiveShadow: options.receiveShadow,
  };
}

/** World-space position of an object, refreshing its matrix chain. */
function worldPosition(object: Object3D, out: Vector3): Vector3 {
  const e = object.updateWorldMatrix().elements;
  return out.set(e[12], e[13], e[14]);
}

export interface LODLevel {
  /** Object becomes an owned child; its geometry/material/texture remain borrowed. */
  readonly object: Object3D;
  readonly distance: number;
  /** Minimum projected diameter in logical viewport pixels, independent of DPR. */
  readonly screenSize?: number;
}

export interface LODOptions {
  hysteresis?: number;
  crossFadeDuration?: number;
  /** Local sphere radius used by screen-size LOD. */
  screenRadius?: number;
}

/** Distance or projected-size selection with native-rendered coverage transitions. */
export class LOD extends Group implements CameraDependent3D {
  private readonly entries: LODLevel[] = [];
  private current = -1;
  private screenMode = false;
  private weights: number[] = [];
  private fromWeights: number[] = [];
  private fadeStarted = 0;
  private fading = false;
  private readonly screenSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 1,
  };
  /** World units for distance levels, logical viewport pixels for screen-size levels. */
  hysteresis = 0;
  crossFadeDuration = 0;
  screenRadius: number = visibilityLimits.screenRadius;

  constructor(options: LODOptions = {}) {
    super();
    this.hysteresis = options.hysteresis ?? 0;
    this.crossFadeDuration = options.crossFadeDuration ?? 0;
    this.screenRadius = options.screenRadius ?? visibilityLimits.screenRadius;
    this.validateSettings();
  }

  get levels(): readonly LODLevel[] {
    return this.entries;
  }
  get level(): number {
    return this.current;
  }

  addLevel(object: Object3D, distance: number): this {
    if (!Number.isFinite(distance) || distance < 0)
      throw new RangeError('LOD distance must be finite and nonnegative.');
    if (this.screenMode)
      throw new Error('Cannot mix distance and screen-size LOD levels.');
    this.insertLevel({ object, distance });
    this.entries.sort((a, b) => a.distance - b.distance);
    return this;
  }

  addScreenLevel(object: Object3D, minimumPixels: number): this {
    if (!Number.isFinite(minimumPixels) || minimumPixels < 0)
      throw new RangeError('LOD screen size must be finite and nonnegative.');
    if (this.entries.length && !this.screenMode)
      throw new Error('Cannot mix distance and screen-size LOD levels.');
    this.screenMode = true;
    this.insertLevel({ object, distance: 0, screenSize: minimumPixels });
    this.entries.sort((a, b) => b.screenSize! - a.screenSize!);
    return this;
  }

  removeLevel(object: Object3D, destroy = false): boolean {
    const index = this.entries.findIndex((entry) => entry.object === object);
    if (index < 0) return false;
    this.entries.splice(index, 1);
    this.remove(object);
    object.visible = true;
    if (destroy) object.destroy();
    this.resetSelection();
    return true;
  }

  private insertLevel(entry: LODLevel): void {
    if (this.entries.some((item) => item.object === entry.object))
      throw new Error('This object is already an LOD level.');
    this.add(entry.object);
    entry.object.visible = false;
    this.entries.push(entry);
    this.resetSelection();
  }

  private resetSelection(): void {
    this.current = -1;
    this.fading = false;
    this.weights.length = this.fromWeights.length = this.entries.length;
    this.weights.fill(0);
    this.fromWeights.fill(0);
    for (const entry of this.entries) entry.object.visible = false;
  }

  /** Native Scene supplies logical viewport/time; one-argument legacy distance LOD still works. */
  updateForCamera(
    camera: Camera3D,
    viewportHeight?: number,
    timeSeconds?: number,
  ): void {
    if (viewportHeight !== undefined && timeSeconds !== undefined)
      this.updateForRender(camera, viewportHeight, timeSeconds);
    else if (!this.screenMode && this.crossFadeDuration === 0)
      this.select(camera, 1, 0);
  }

  updateForRender(
    camera: Camera3D,
    viewportHeight: number,
    timeSeconds: number,
  ): void {
    if (
      !Number.isFinite(viewportHeight) ||
      viewportHeight <= 0 ||
      !Number.isFinite(timeSeconds)
    )
      throw new RangeError(
        'LOD presentation requires a positive viewport and finite time.',
      );
    this.select(camera, viewportHeight, timeSeconds);
  }

  /** Native color/shadow/picking consumers can inspect the same active branch weight. */
  renderWeight(object: Object3D): number {
    let branch = object;
    while (branch.parent && branch.parent !== this) branch = branch.parent;
    const index = this.entries.findIndex((entry) => entry.object === branch);
    return index < 0 ? 1 : this.weights[index]!;
  }

  protected projectedDiameter(
    camera: Camera3D,
    viewportHeight: number,
  ): number {
    const s = this.screenSphere;
    s.x = s.y = s.z = 0;
    s.radius = this.screenRadius;
    transformSphere(s, this.updateWorldMatrix(), s);
    return projectedSphereDiameter(s, camera, viewportHeight);
  }

  private validateSettings(): void {
    if (
      !Number.isFinite(this.hysteresis) ||
      this.hysteresis < 0 ||
      !Number.isFinite(this.crossFadeDuration) ||
      this.crossFadeDuration < 0 ||
      !Number.isFinite(this.screenRadius) ||
      this.screenRadius <= 0
    )
      throw new RangeError(
        'LOD hysteresis/fade must be nonnegative and radius positive.',
      );
  }

  private select(camera: Camera3D, height: number, time: number): void {
    this.validateSettings();
    if (!this.entries.length) return;
    this.advanceFade(time);
    const p = worldPosition(this, tmp);
    const metric = this.screenMode
      ? this.projectedDiameter(camera, height)
      : Math.hypot(
          p.x - camera.position.x,
          p.y - camera.position.y,
          p.z - camera.position.z,
        );
    let chosen = 0;
    if (this.screenMode) {
      chosen = this.entries.length - 1;
      for (let i = 0; i < this.entries.length; i++) {
        if (metric >= this.entries[i]!.screenSize!) {
          chosen = i;
          break;
        }
      }
    } else {
      for (let i = 0; i < this.entries.length; i++)
        if (metric >= this.entries[i]!.distance) chosen = i;
    }
    const current = this.current;
    if (current >= 0 && chosen !== current && this.hysteresis > 0) {
      const boundary = this.screenMode
        ? chosen > current
          ? this.entries[current]!.screenSize! - this.hysteresis
          : this.entries[current - 1]!.screenSize! + this.hysteresis
        : chosen > current
          ? this.entries[current + 1]!.distance + this.hysteresis
          : this.entries[current]!.distance - this.hysteresis;
      if (
        this.screenMode
          ? chosen > current
            ? metric > boundary
            : metric < boundary
          : chosen > current
            ? metric < boundary
            : metric > boundary
      )
        return;
    }
    if (chosen === current) return;
    this.current = chosen;
    for (let i = 0; i < this.weights.length; i++)
      this.fromWeights[i] = this.weights[i]!;
    this.fading = current >= 0 && this.crossFadeDuration > 0;
    this.fadeStarted = time;
    this.advanceFade(time);
  }

  private advanceFade(time: number): void {
    if (this.current < 0) return;
    if (this.crossFadeDuration === 0) this.fading = false;
    const t = this.fading
      ? Math.min(
          1,
          Math.max(0, (time - this.fadeStarted) / this.crossFadeDuration),
        )
      : 1;
    for (let i = 0; i < this.entries.length; i++) {
      this.weights[i] =
        this.fromWeights[i]! * (1 - t) + (i === this.current ? t : 0);
      this.entries[i]!.object.visible = this.weights[i]! > 0;
    }
    if (t === 1) this.fading = false;
  }
}

/** Conservative projected diameter; near-plane intersections retain highest detail. */
export function projectedSphereDiameter(
  sphere: Readonly<BoundingSphere3D>,
  camera: Camera3D,
  viewportHeight: number,
): number {
  if (camera instanceof OrthographicCamera)
    return (sphere.radius * 2 * camera.zoom * viewportHeight) / camera.height;
  const q = camera.rotation;
  const fx = -2 * (q.x * q.z + q.w * q.y);
  const fy = -2 * (q.y * q.z - q.w * q.x);
  const fz = -(1 - 2 * (q.x * q.x + q.y * q.y));
  const depth =
    (sphere.x - camera.position.x) * fx +
    (sphere.y - camera.position.y) * fy +
    (sphere.z - camera.position.z) * fz;
  if (
    !Number.isFinite(depth + sphere.radius) ||
    depth - sphere.radius <= camera.near
  )
    return Infinity;
  return (
    (sphere.radius * viewportHeight) /
    (Math.tan(camera.fov / 2) * (depth - sphere.radius))
  );
}

export interface HLODOptions extends LODOptions {
  proxy: Object3D;
  children: readonly Object3D[];
  /** Switch to the child aggregate above this logical-pixel diameter. */
  screenSize: number;
}

/** Owns detail/proxy nodes; replacing them retires nodes, never borrowed render resources. */
export class HLOD extends LOD {
  readonly detail = new Group();
  private proxyObject: Object3D;
  private readonly aggregateSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private readonly childSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private readonly pending: Object3D[] = [];
  readonly screenSize: number;

  constructor(options: HLODOptions) {
    super(options);
    if (!Number.isFinite(options.screenSize) || options.screenSize <= 0)
      throw new RangeError('HLOD screen size must be positive and finite.');
    this.screenSize = options.screenSize;
    this.proxyObject = options.proxy;
    for (const child of options.children) this.detail.add(child);
    this.addScreenLevel(this.detail, this.screenSize);
    this.addScreenLevel(this.proxyObject, 0);
  }

  get proxy(): Object3D {
    return this.proxyObject;
  }

  replaceProxy(proxy: Object3D): void {
    if (proxy === this.proxyObject) return;
    if (proxy.destroyed || (proxy.scene && proxy.scene !== this.scene))
      throw new Error(
        'HLOD replacement proxy must be live and belong to this scene.',
      );
    const previous = this.proxyObject;
    this.addScreenLevel(proxy, 0);
    this.proxyObject = proxy;
    this.removeLevel(previous, true);
  }

  replaceChildren(children: readonly Object3D[]): void {
    const unique = new Set(children);
    if (
      unique.size !== children.length ||
      children.some(
        (child) =>
          child.destroyed ||
          child === this ||
          child === this.proxyObject ||
          child === this.detail ||
          (child.scene && child.scene !== this.scene),
      )
    )
      throw new Error('HLOD children must be unique live nodes in this scene.');
    for (const child of children) {
      for (let ancestor = this.parent; ancestor; ancestor = ancestor.parent)
        if (child === ancestor)
          throw new Error('HLOD children cannot be ancestors of their owner.');
    }
    const retired = [...this.detail.children].filter(
      (child) => !unique.has(child),
    );
    for (const child of children) this.detail.add(child);
    for (const child of retired) {
      this.detail.remove(child);
      child.destroy();
    }
  }

  protected override projectedDiameter(
    camera: Camera3D,
    viewportHeight: number,
  ): number {
    const pending = this.pending;
    pending.length = 0;
    pending.push(this.detail);
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    let found = false;
    for (let i = 0; i < pending.length; i++) {
      const child = pending[i]!;
      for (const descendant of child.children) pending.push(descendant);
      if (!(child instanceof Mesh) || child.destroyed) continue;
      const s = child.getWorldBoundingSphere(this.childSphere);
      if (!Number.isFinite(s.x + s.y + s.z + s.radius)) return Infinity;
      found = true;
      minX = Math.min(minX, s.x - s.radius);
      maxX = Math.max(maxX, s.x + s.radius);
      minY = Math.min(minY, s.y - s.radius);
      maxY = Math.max(maxY, s.y + s.radius);
      minZ = Math.min(minZ, s.z - s.radius);
      maxZ = Math.max(maxZ, s.z + s.radius);
    }
    if (!found) return super.projectedDiameter(camera, viewportHeight);
    const s = this.aggregateSphere;
    s.x = (minX + maxX) / 2;
    s.y = (minY + maxY) / 2;
    s.z = (minZ + maxZ) / 2;
    s.radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2;
    return projectedSphereDiameter(s, camera, viewportHeight);
  }
}

export type BillboardMode = 'spherical' | 'cylindrical';

const facingTarget = new Vector3();

function faceCamera(
  object: Object3D,
  camera: Camera3D,
  mode: BillboardMode,
): void {
  const p = worldPosition(object, tmp);
  const t = facingTarget;
  if (camera instanceof OrthographicCamera) {
    const q = camera.rotation;
    const fx = -2 * (q.x * q.z + q.w * q.y);
    const fy = -2 * (q.y * q.z - q.w * q.x);
    const fz = -(1 - 2 * (q.x * q.x + q.y * q.y));
    t.set(p.x + fx, mode === 'cylindrical' ? p.y : p.y + fy, p.z + fz);
  } else {
    t.set(
      2 * p.x - camera.position.x,
      mode === 'cylindrical' ? p.y : 2 * p.y - camera.position.y,
      2 * p.z - camera.position.z,
    );
  }
  // Local +Z faces the camera when local -Z aims away from it.
  lookAtRotation(p, t, object.rotation);
}

export interface BillboardOptions extends Omit<
  MeshOptions,
  'geometry' | 'material'
> {
  material: TextureMaterial;
  /** World units; the quad is scaled by these (further scaled by `scale`). Default 1. */
  width?: number;
  height?: number;
  /** `spherical` faces the camera fully; `cylindrical` only turns around the Y axis. */
  mode?: BillboardMode;
}

let unitQuad: Geometry | undefined;

/**
 * A textured quad that turns to face the camera each frame. Its own rotation is overwritten, so
 * parent rotation and scale are not compensated: keep billboards in the Scene root or under
 * translation-only groups.
 */
export class Billboard extends Mesh implements CameraDependent3D {
  mode: BillboardMode;

  constructor(options: BillboardOptions) {
    super(
      meshOptions(
        options,
        (unitQuad ??= Geometry.quad(1, 1)),
        options.material,
      ),
    );
    const w = options.width ?? 1;
    const h = options.height ?? 1;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
      throw new RangeError('Billboard size must be positive and finite.');
    this.scale.set(this.scale.x * w, this.scale.y * h, this.scale.z);
    this.mode = options.mode ?? 'spherical';
    if (this.mode !== 'spherical' && this.mode !== 'cylindrical')
      throw new RangeError('Unknown billboard mode.');
  }

  updateForCamera(camera: Camera3D): void {
    faceCamera(this, camera, this.mode);
  }
}

export interface Sprite3DOptions
  extends Omit<BillboardOptions, 'material'>, TextureMaterialOptions {
  /** Atlas region in physical pixels. World size does not change with later frames. */
  source?: Rect2D;
}

/** Camera-facing, unlit image in world space; borrows its Texture and owns its atlas quad. */
export class Sprite3D extends Mesh implements CameraDependent3D {
  mode: BillboardMode;
  private readonly fullSource: Readonly<Rect2D>;
  private region: Readonly<Rect2D>;

  constructor(options: Sprite3DOptions) {
    const material = new TextureMaterial({ ...options, transparent: true });
    const full = validatedRegion(options.texture, {
      x: 0,
      y: 0,
      width: options.texture.width,
      height: options.texture.height,
    });
    const region = options.source
      ? validatedRegion(options.texture, options.source)
      : full;
    const width = options.width ?? 1;
    const height = options.height ?? (width * region.height) / region.width;
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      throw new RangeError('Sprite3D size must be positive and finite.');
    const mode = options.mode ?? 'spherical';
    if (mode !== 'spherical' && mode !== 'cylindrical')
      throw new RangeError('Unknown sprite facing mode.');
    super(meshOptions(options, Geometry.quad(), material));
    this.scale.set(this.scale.x * width, this.scale.y * height, this.scale.z);
    this.castShadow = options.castShadow ?? false;
    this.receiveShadow = options.receiveShadow ?? false;
    this.mode = mode;
    this.fullSource = full;
    this.region = region;
    this.applySource();
  }

  get texture(): Texture {
    return this.material.texture;
  }

  get source(): Readonly<Rect2D> {
    return this.region;
  }

  /** Changes UVs without allocating a cropped bitmap or resizing the sprite. */
  setSource(source: Rect2D = this.fullSource): this {
    const previous = this.region;
    if (
      !this.texture.destroyed &&
      source.x === previous.x &&
      source.y === previous.y &&
      source.width === previous.width &&
      source.height === previous.height
    )
      return this;
    this.region = validatedRegion(this.texture, source);
    this.applySource();
    return this;
  }

  private applySource(): void {
    const { x, y, width, height } = this.region;
    const vertices = this.geometry.vertices;
    for (let i = 0; i < 4; i++) {
      vertices[i * 8 + 6] =
        (x + (i === 1 || i === 2 ? width : 0)) / this.texture.width;
      vertices[i * 8 + 7] = (y + (i >= 2 ? height : 0)) / this.texture.height;
    }
    this.geometry.markUpdated();
  }

  updateForCamera(camera: Camera3D): void {
    faceCamera(this, camera, this.mode);
  }
}

export interface Line3DOptions extends Omit<
  MeshOptions,
  'geometry' | 'material'
> {
  material: TextureMaterial;
  /** World units across the ribbon. Default 0.05. */
  width?: number;
  /** Join the last point back to the first. */
  closed?: boolean;
}

/**
 * A polyline drawn as a camera-facing ribbon of triangles (renderers have no line primitive).
 * The number of points is fixed at construction; move them with {@link setPoint}. Segments are
 * independent quads, so very sharp corners show a small gap or overlap.
 */
export class Line3D extends Mesh implements CameraDependent3D {
  private readonly coordinates: Float64Array;
  private readonly segments: number;
  readonly closed: boolean;
  width: number;
  private readonly side = new Vector3();
  private readonly view = new Vector3();
  private readonly inverse = new Matrix4();

  constructor(
    points: readonly (readonly [number, number, number])[],
    options: Line3DOptions,
  ) {
    const closed = options.closed ?? false;
    const segments = closed ? points.length : points.length - 1;
    if (points.length < 2 || (closed && points.length < 3))
      throw new RangeError(
        'A line needs at least two points (three when closed).',
      );
    const width = options.width ?? 0.05;
    if (!Number.isFinite(width) || width <= 0)
      throw new RangeError('Line width must be positive and finite.');
    const positions = new Float32Array(segments * 4 * 3);
    const normals = new Float32Array(segments * 4 * 3);
    const uvs = new Float32Array(segments * 4 * 2);
    const indices: number[] = [];
    for (let i = 0; i < segments; i++) {
      const base = i * 4;
      // uv: x across the ribbon, y along the whole line
      const v0 = i / segments;
      const v1 = (i + 1) / segments;
      uvs.set([0, v0, 1, v0, 0, v1, 1, v1], i * 8);
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
    super(
      meshOptions(
        options,
        new Geometry({ positions, normals, uvs, indices }),
        options.material,
      ),
    );
    this.closed = closed;
    this.segments = segments;
    this.width = width;
    this.coordinates = new Float64Array(points.length * 3);
    points.forEach((point, index) => this.setPoint(index, ...point));
    // Until a camera is known, lie in the XY plane facing +Z.
    this.rebuild(0, 0, 1);
  }

  get pointCount(): number {
    return this.coordinates.length / 3;
  }

  point(index: number): [number, number, number] {
    this.check(index);
    const c = this.coordinates;
    return [c[index * 3]!, c[index * 3 + 1]!, c[index * 3 + 2]!];
  }

  setPoint(index: number, x: number, y: number, z: number): void {
    this.check(index);
    if (![x, y, z].every(Number.isFinite))
      throw new RangeError('Line points must be finite.');
    this.coordinates.set([x, y, z], index * 3);
  }

  updateForCamera(camera: Camera3D): void {
    // Work in local space: bring the camera into it through the inverse world matrix.
    const inverse = this.inverse.copy(this.updateWorldMatrix()).invert();
    const local = inverse.transformPoint(camera.position, this.view);
    this.rebuild(local.x, local.y, local.z);
  }

  private check(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.pointCount)
      throw new RangeError('Line point index is out of range.');
  }

  /** Lays each segment's quad flat to the viewer at `(cx, cy, cz)` (local space). */
  private rebuild(cx: number, cy: number, cz: number): void {
    const c = this.coordinates;
    const n = this.pointCount;
    const v = this.geometry.vertices;
    const half = this.width / 2;
    const side = this.side;
    for (let i = 0; i < this.segments; i++) {
      const a = i * 3;
      const b = ((i + 1) % n) * 3;
      const dx = c[b]! - c[a]!;
      const dy = c[b + 1]! - c[a + 1]!;
      const dz = c[b + 2]! - c[a + 2]!;
      // Toward the viewer from the segment midpoint.
      let vx = cx - (c[a]! + c[b]!) / 2;
      let vy = cy - (c[a + 1]! + c[b + 1]!) / 2;
      let vz = cz - (c[a + 2]! + c[b + 2]!) / 2;
      const vl = Math.hypot(vx, vy, vz) || 1;
      vx /= vl;
      vy /= vl;
      vz /= vl;
      // side = dir × view, so the ribbon is perpendicular to both the line and the view.
      side.set(dy * vz - dz * vy, dz * vx - dx * vz, dx * vy - dy * vx);
      const sl = side.length();
      if (sl > 1e-9) side.scale(half / sl);
      else side.set(0, 0, 0);
      const corners = [
        [c[a]! - side.x, c[a + 1]! - side.y, c[a + 2]! - side.z],
        [c[a]! + side.x, c[a + 1]! + side.y, c[a + 2]! + side.z],
        [c[b]! - side.x, c[b + 1]! - side.y, c[b + 2]! - side.z],
        [c[b]! + side.x, c[b + 1]! + side.y, c[b + 2]! + side.z],
      ] as const;
      for (let k = 0; k < 4; k++) {
        const o = (i * 4 + k) * 8;
        v[o] = corners[k]![0];
        v[o + 1] = corners[k]![1];
        v[o + 2] = corners[k]![2];
        v[o + 3] = vx;
        v[o + 4] = vy;
        v[o + 5] = vz;
      }
    }
    this.geometry.markUpdated();
  }
}

export interface Text3DOptions extends Omit<
  BillboardOptions,
  'material' | 'width' | 'height'
> {
  /** CSS font size in pixels used to rasterize; default 64. */
  fontSize?: number;
  /** CSS font family; default `system-ui, sans-serif`. */
  fontFamily?: string;
  /** CSS color; default white. */
  color?: string;
  /** World height of one line; the width follows the text. Default 1. */
  height?: number;
  padding?: number;
}

/**
 * Text drawn into a canvas texture and shown on a camera-facing quad. The text is fixed when
 * created (create a new Text3D to change it); it owns its texture and releases it on destroy.
 */
export class Text3D extends Billboard {
  private readonly ownedTexture: Texture;

  private constructor(
    texture: Texture,
    options: Text3DOptions,
    aspect: number,
  ) {
    const height = options.height ?? 1;
    super({
      position: options.position,
      rotation: options.rotation,
      scale: options.scale,
      visible: options.visible,
      castShadow: options.castShadow,
      receiveShadow: options.receiveShadow,
      mode: options.mode,
      material: new TextureMaterial({ texture, transparent: true }),
      width: height * aspect,
      height,
    });
    this.ownedTexture = texture;
  }

  static async create(
    text: string,
    options: Text3DOptions = {},
  ): Promise<Text3D> {
    if (!text) throw new RangeError('Text3D needs text.');
    const size = options.fontSize ?? 64;
    const padding = options.padding ?? Math.round(size / 4);
    if (!Number.isFinite(size) || size <= 0 || size > 512)
      throw new RangeError('Text3D fontSize must be within (0, 512].');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const font = `${size}px ${options.fontFamily ?? 'system-ui, sans-serif'}`;
    context.font = font;
    const width = Math.max(
      1,
      Math.ceil(context.measureText(text).width) + padding * 2,
    );
    const height = Math.ceil(size * 1.3) + padding * 2;
    canvas.width = width;
    canvas.height = height;
    // Resizing resets the context state.
    context.font = font;
    context.fillStyle = options.color ?? '#ffffff';
    context.textBaseline = 'middle';
    context.fillText(text, padding, height / 2);
    const texture = await Texture.fromImage(canvas);
    try {
      return new Text3D(texture, options, width / height);
    } catch (error) {
      texture.destroy();
      throw error;
    }
  }

  override destroy(): void {
    if (this.destroyed) return;
    super.destroy();
    this.ownedTexture.destroy();
  }
}
