import { Texture } from '../../assets/src/index.js';
import { Quaternion } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import type { Frustum } from './frustum.js';
import { MorphTargets } from './morph.js';
import { Object3D } from './object3d.js';

export interface TextureMaterialOptions {
  texture: Texture;
  color?: [number, number, number];
  opacity?: number;
}

/** References a shared Texture; destroying a Mesh never destroys its material or texture. */
export class TextureMaterial {
  readonly texture: Texture;
  readonly color: [number, number, number];
  readonly opacity: number;

  constructor(options: TextureMaterialOptions) {
    if (!(options.texture instanceof Texture))
      throw new TypeError('TextureMaterial requires a Texture.');
    const color = options.color ?? [1, 1, 1];
    if (
      color.length !== 3 ||
      color.some(
        (component) =>
          !Number.isFinite(component) || component < 0 || component > 1,
      )
    )
      throw new RangeError(
        'Material color components must be finite numbers between 0 and 1.',
      );
    const opacity = options.opacity ?? 1;
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1)
      throw new RangeError('Material opacity must be between 0 and 1.');
    this.texture = options.texture;
    this.color = [...color] as [number, number, number];
    this.opacity = opacity;
  }
}

export interface MeshOptions {
  geometry: Geometry;
  material: TextureMaterial;
  position?: [number, number, number];
  rotation?: Quaternion | [number, number, number];
  scale?: [number, number, number];
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Takes ownership of `geometry`'s vertex data; the geometry must not be shared. */
  morph?: MorphTargets;
}

/** 3D scene facade; Geometry and TextureMaterial remain owned by their creators. */
export class Mesh extends Object3D {
  readonly geometry: Geometry;
  readonly material: TextureMaterial;
  castShadow: boolean;
  receiveShadow: boolean;
  readonly morph?: MorphTargets;

  constructor(options: MeshOptions) {
    super();
    if (
      !(options.geometry instanceof Geometry) ||
      !(options.material instanceof TextureMaterial)
    )
      throw new TypeError('Mesh requires Geometry and TextureMaterial.');
    this.geometry = options.geometry;
    this.material = options.material;
    if (options.morph !== undefined) {
      if (!(options.morph instanceof MorphTargets))
        throw new TypeError('Mesh morph requires MorphTargets.');
      options.morph.bind(options.geometry);
      this.morph = options.morph;
    }
    if (options.position) this.transform.position.set(...options.position);
    if (options.rotation) {
      if (options.rotation instanceof Quaternion) {
        this.transform.rotation.x = options.rotation.x;
        this.transform.rotation.y = options.rotation.y;
        this.transform.rotation.z = options.rotation.z;
        this.transform.rotation.w = options.rotation.w;
      } else this.transform.rotation.setFromEuler(...options.rotation);
    }
    if (options.scale) this.transform.scale.set(...options.scale);
    this.visible = options.visible ?? true;
    this.castShadow = options.castShadow ?? true;
    this.receiveShadow = options.receiveShadow ?? true;
  }

  /** Set false to always submit this mesh even when it lies outside the camera frustum. */
  frustumCulled = true;

  /** Deformed and instanced meshes keep bind-pose or per-instance bounds unreliable. */
  protected get cullable(): boolean {
    return this.morph === undefined;
  }

  /** Squared distance from a world-space point to this mesh's bounding-sphere center. */
  distanceSquaredTo(x: number, y: number, z: number): number {
    const sphere = this.geometry.boundingSphere;
    const e = this.updateWorldMatrix().elements;
    const dx = e[0] * sphere.x + e[4] * sphere.y + e[8] * sphere.z + e[12] - x;
    const dy = e[1] * sphere.x + e[5] * sphere.y + e[9] * sphere.z + e[13] - y;
    const dz = e[2] * sphere.x + e[6] * sphere.y + e[10] * sphere.z + e[14] - z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Conservative sphere test against the camera frustum. Refreshes the world matrix
   * so callers may use it before drawing. Non-finite bounds are treated as visible.
   */
  isInFrustum(frustum: Frustum): boolean {
    if (!this.frustumCulled || !this.cullable) return true;
    const sphere = this.geometry.boundingSphere;
    const e = this.updateWorldMatrix().elements;
    const x = e[0] * sphere.x + e[4] * sphere.y + e[8] * sphere.z + e[12];
    const y = e[1] * sphere.x + e[5] * sphere.y + e[9] * sphere.z + e[13];
    const z = e[2] * sphere.x + e[6] * sphere.y + e[10] * sphere.z + e[14];
    const scale = Math.max(
      Math.hypot(e[0], e[1], e[2]),
      Math.hypot(e[4], e[5], e[6]),
      Math.hypot(e[8], e[9], e[10]),
    );
    const radius = sphere.radius * scale;
    if (!Number.isFinite(x + y + z + radius)) return true;
    return frustum.intersectsSphere(x, y, z, radius);
  }
  /**
   * Applies pending morph weights to the geometry. Renderers and raycasts call this
   * before reading vertices; unchanged weights cost one integer comparison.
   */
  updateDeformation(): void {
    if (this.morph?.apply(this.geometry.vertices)) this.geometry.markUpdated();
  }
}
