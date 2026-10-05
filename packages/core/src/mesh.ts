import { Texture } from '../../assets/src/index.js';
import {
  CanvasTexture2D,
  type MaterialTexture,
} from '../../assets/src/texture2d.js';
import { Quaternion } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import type { Frustum } from './frustum.js';
import { MorphTargets } from './morph.js';
import { Object3D } from './object3d.js';
import { samplerOptions } from './texture-sampler.js';
import type { TextureSamplerOptions } from './texture-sampler.js';
import {
  transformSphere,
  sphereIsFinite,
  type BoundingSphere3D,
} from './render-bounds.js';

export interface TextureMaterialOptions {
  texture: Texture;
  /** Optional canvas/video override; `texture` remains the caller's static fallback. */
  textureSource?: MaterialTexture;
  color?: [number, number, number];
  opacity?: number;
  /** Include texture/vertex alpha in the transparent pass even when opacity is one. */
  transparent?: boolean;
  textureSampler?: TextureSamplerOptions;
}

/** References a shared Texture; destroying a Mesh never destroys its material or texture. */
export class TextureMaterial {
  readonly texture: Texture;
  readonly textureSource?: MaterialTexture;
  readonly color: [number, number, number];
  readonly opacity: number;
  readonly transparent: boolean;
  readonly textureSampler?: Readonly<TextureSamplerOptions>;
  /** Maximum final mesh-local vertex displacement; undefined means unbounded native output. */
  readonly deformationBounds: number | undefined = 0;

  constructor(options: TextureMaterialOptions) {
    if (!(options.texture instanceof Texture))
      throw new TypeError('TextureMaterial requires a Texture.');
    if (
      options.textureSource !== undefined &&
      !(options.textureSource instanceof Texture) &&
      !(options.textureSource instanceof CanvasTexture2D)
    )
      throw new TypeError(
        'Texture source must be a Texture or CanvasTexture2D.',
      );
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
    if (
      options.transparent !== undefined &&
      typeof options.transparent !== 'boolean'
    )
      throw new TypeError('Material transparent must be a boolean.');
    this.texture = options.texture;
    this.textureSource = options.textureSource;
    this.textureSampler = samplerOptions(options.textureSampler);
    this.color = [...color] as [number, number, number];
    this.opacity = opacity;
    this.transparent = opacity < 1 || options.transparent === true;
  }
}

/** Effective base-color texture: the canvas/video override when present, else `texture`. */
export function materialBaseTexture(
  material: TextureMaterial,
): MaterialTexture {
  return material.textureSource ?? material.texture;
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
  /** Opt-in native depth queries. Unsupported, pending, or stale proofs remain visible. */
  occlusionCulled = false;
  private readonly worldSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };
  private readonly deformationSphere: BoundingSphere3D = {
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  };

  /** Native rendering may use bind-pose streams while exact CPU queries use `geometry`. */
  get renderGeometry(): Geometry {
    return this.geometry;
  }

  get boundingSphere(): Readonly<{
    x: number;
    y: number;
    z: number;
    radius: number;
  }> {
    return this.geometry.boundingSphere;
  }

  updateRenderDeformation(): void {
    this.updateDeformation();
  }

  /** CPU morph bounds follow the current weights; skinned meshes override their bounds. */
  protected get cullable(): boolean {
    return true;
  }

  /** Squared distance from a world-space point to this mesh's bounding-sphere center. */
  distanceSquaredTo(x: number, y: number, z: number): number {
    const sphere = this.boundingSphere;
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
    const sphere = this.getWorldBoundingSphere(this.worldSphere);
    if (!this.frustumCulled || !this.cullable) return true;
    if (!sphereIsFinite(sphere)) return true;
    return frustum.intersectsSphere(
      sphere.x,
      sphere.y,
      sphere.z,
      sphere.radius,
    );
  }

  /** Caller-owned output; mutable poses and pending deformation are refreshed by default. */
  getWorldBoundingSphere(
    out: BoundingSphere3D,
    refresh = true,
  ): BoundingSphere3D {
    if (refresh) {
      this.updateRenderDeformation();
      this.updateWorldMatrix();
    }
    const sphere = this.boundingSphere;
    const displacement = this.material.deformationBounds;
    if (displacement === undefined) {
      out.x = out.y = out.z = 0;
      out.radius = Infinity;
      return out;
    }
    if (displacement === 0)
      return transformSphere(sphere, this.worldMatrix, out);
    const expanded = this.deformationSphere;
    expanded.x = sphere.x;
    expanded.y = sphere.y;
    expanded.z = sphere.z;
    expanded.radius = sphere.radius + displacement;
    return transformSphere(expanded, this.worldMatrix, out);
  }
  /**
   * Applies pending morph weights to the geometry. Renderers and raycasts call this
   * before reading vertices; unchanged weights cost one integer comparison.
   */
  updateDeformation(): void {
    if (this.morph?.apply(this.geometry.vertices)) this.geometry.markUpdated();
  }
}
