import { Texture } from '../../assets/src/index.js';
import { Quaternion } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
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

  /**
   * Applies pending morph weights to the geometry. Renderers and raycasts call this
   * before reading vertices; unchanged weights cost one integer comparison.
   */
  updateDeformation(): void {
    if (this.morph?.apply(this.geometry.vertices)) this.geometry.markUpdated();
  }
}
