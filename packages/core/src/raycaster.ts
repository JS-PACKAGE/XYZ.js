import { Matrix4, Vector3 } from '../../math/src/index.js';
import { InstancedMesh } from './instanced-mesh.js';
import { Mesh } from './mesh.js';
import { Object3D } from './object3d.js';
import { OrthographicCamera, type Camera3D } from './orthographic-camera.js';
import type { SceneObject } from './scene-object.js';

export interface RaycastHit {
  object: Mesh;
  distance: number;
  point: Vector3;
  faceIndex: number;
  instanceId?: number;
}

function nearestFirst(a: RaycastHit, b: RaycastHit): number {
  return a.distance - b.distance;
}

/** Exact, two-sided indexed-triangle picking in world units, including hierarchy and instances. */
export class Raycaster {
  readonly origin = new Vector3();
  readonly direction = new Vector3(0, 0, -1);
  near = 0;
  far = Infinity;
  private readonly inverse = new Matrix4();
  private readonly instance = new Matrix4();
  private readonly world = new Matrix4();
  private readonly localOrigin = new Vector3();
  private readonly localDirection = new Vector3();
  private readonly visited = new Set<Object3D>();

  setFromCamera(x: number, y: number, camera: Camera3D, aspect: number): this {
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new RangeError('Raycaster NDC coordinates must be finite.');
    this.inverse.copy(camera.updateMatrix(aspect)).invert();
    this.localOrigin.set(x, y, 0);
    this.inverse.transformPoint(this.localOrigin, this.localOrigin);
    this.direction.set(x, y, 0.5);
    this.inverse.transformPoint(this.direction, this.direction);
    if (camera instanceof OrthographicCamera) {
      this.direction.subtract(this.localOrigin).normalize();
      this.origin.copy(this.localOrigin);
      this.origin.x -= this.direction.x * camera.near;
      this.origin.y -= this.direction.y * camera.near;
      this.origin.z -= this.direction.z * camera.near;
    } else {
      this.origin.copy(camera.position);
      this.direction.subtract(this.origin).normalize();
    }
    return this;
  }

  /** Replaces out's contents; flat scene registration and recursive roots never duplicate a mesh. */
  intersectObjects(
    objects: Iterable<SceneObject>,
    recursive = true,
    out: RaycastHit[] = [],
  ): RaycastHit[] {
    if (
      !Number.isFinite(this.near) ||
      this.near < 0 ||
      !(this.far >= this.near) ||
      !Number.isFinite(this.origin.x) ||
      !Number.isFinite(this.origin.y) ||
      !Number.isFinite(this.origin.z) ||
      !Number.isFinite(this.direction.x) ||
      !Number.isFinite(this.direction.y) ||
      !Number.isFinite(this.direction.z) ||
      this.direction.length() === 0
    )
      throw new RangeError(
        'Raycaster requires a finite origin, nonzero direction and 0 <= near <= far.',
      );
    this.direction.normalize();
    out.length = 0;
    try {
      for (const object of objects)
        if (object instanceof Object3D)
          this.intersectObject(object, recursive, out);
      out.sort(nearestFirst);
      return out;
    } finally {
      this.visited.clear();
    }
  }

  private intersectObject(
    object: Object3D,
    recursive: boolean,
    out: RaycastHit[],
  ): void {
    if (this.visited.has(object)) return;
    this.visited.add(object);
    if (object.destroyed || !object.worldVisible) return;
    if (object instanceof Mesh) {
      object.updateDeformation();
      const world = object.updateWorldMatrix();
      if (object instanceof InstancedMesh) {
        for (let i = 0; i < object.count; i++) {
          object.getMatrixAt(i, this.instance);
          this.world.copy(world).multiply(this.instance);
          this.intersectMesh(object, this.world, out, i);
        }
      } else this.intersectMesh(object, world, out);
    }
    if (recursive)
      for (const child of object.children)
        this.intersectObject(child, true, out);
  }

  private intersectMesh(
    mesh: Mesh,
    world: Matrix4,
    out: RaycastHit[],
    instanceId?: number,
  ): void {
    const e = world.elements;
    // Singular transforms can still contain a pickable planar triangle: use world coordinates then.
    const determinant =
      e[0] * (e[5] * e[10] - e[6] * e[9]) -
      e[4] * (e[1] * e[10] - e[2] * e[9]) +
      e[8] * (e[1] * e[6] - e[2] * e[5]);
    if (!Number.isFinite(determinant)) return;
    const singular = determinant === 0;
    if (singular) {
      this.localOrigin.copy(this.origin);
      this.localDirection.copy(this.direction);
    } else {
      this.inverse.copy(world).invert();
      this.inverse.transformPoint(this.origin, this.localOrigin);
      const m = this.inverse.elements;
      const direction = this.direction;
      // Do not normalize: local ray t remains world distance under nonuniform scale.
      this.localDirection.set(
        m[0] * direction.x + m[4] * direction.y + m[8] * direction.z,
        m[1] * direction.x + m[5] * direction.y + m[9] * direction.z,
        m[2] * direction.x + m[6] * direction.y + m[10] * direction.z,
      );
    }
    const ox = this.localOrigin.x,
      oy = this.localOrigin.y,
      oz = this.localOrigin.z;
    const dx = this.localDirection.x,
      dy = this.localDirection.y,
      dz = this.localDirection.z;
    const { vertices: v, indices } = mesh.geometry;
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 8,
        b = indices[i + 1] * 8,
        c = indices[i + 2] * 8;
      let ax = v[a],
        ay = v[a + 1],
        az = v[a + 2];
      let bx = v[b],
        by = v[b + 1],
        bz = v[b + 2];
      let cx = v[c],
        cy = v[c + 1],
        cz = v[c + 2];
      if (singular) {
        const wax = e[0] * ax + e[4] * ay + e[8] * az + e[12];
        const way = e[1] * ax + e[5] * ay + e[9] * az + e[13];
        const waz = e[2] * ax + e[6] * ay + e[10] * az + e[14];
        const wbx = e[0] * bx + e[4] * by + e[8] * bz + e[12];
        const wby = e[1] * bx + e[5] * by + e[9] * bz + e[13];
        const wbz = e[2] * bx + e[6] * by + e[10] * bz + e[14];
        const wcx = e[0] * cx + e[4] * cy + e[8] * cz + e[12];
        const wcy = e[1] * cx + e[5] * cy + e[9] * cz + e[13];
        const wcz = e[2] * cx + e[6] * cy + e[10] * cz + e[14];
        ax = wax;
        ay = way;
        az = waz;
        bx = wbx;
        by = wby;
        bz = wbz;
        cx = wcx;
        cy = wcy;
        cz = wcz;
      }
      const e1x = bx - ax,
        e1y = by - ay,
        e1z = bz - az;
      const e2x = cx - ax,
        e2y = cy - ay,
        e2z = cz - az;
      const px = dy * e2z - dz * e2y;
      const py = dz * e2x - dx * e2z;
      const pz = dx * e2y - dy * e2x;
      const det = e1x * px + e1y * py + e1z * pz;
      if (det === 0 || !Number.isFinite(det)) continue;
      const tx = ox - ax,
        ty = oy - ay,
        tz = oz - az;
      const u = (tx * px + ty * py + tz * pz) / det;
      if (u < -1e-10 || u > 1 + 1e-10) continue;
      const qx = ty * e1z - tz * e1y;
      const qy = tz * e1x - tx * e1z;
      const qz = tx * e1y - ty * e1x;
      const barycentricV = (dx * qx + dy * qy + dz * qz) / det;
      if (barycentricV < -1e-10 || u + barycentricV > 1 + 1e-10) continue;
      const distance = (e2x * qx + e2y * qy + e2z * qz) / det;
      if (
        !Number.isFinite(distance) ||
        distance < this.near ||
        distance > this.far
      )
        continue;
      const hit: RaycastHit = {
        object: mesh,
        distance,
        point: new Vector3(
          this.origin.x + this.direction.x * distance,
          this.origin.y + this.direction.y * distance,
          this.origin.z + this.direction.z * distance,
        ),
        faceIndex: i / 3,
      };
      if (instanceId !== undefined) hit.instanceId = instanceId;
      out.push(hit);
    }
  }
}
