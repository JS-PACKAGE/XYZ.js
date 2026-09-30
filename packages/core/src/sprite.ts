import { Texture, AssetError } from '../../assets/src/index.js';
import { Vector2 } from '../../math/src/index.js';
import { GameObject } from './game-object.js';
import {
  validateSource,
  type ColorRGBA,
  type Rect2D,
} from './gameplay/contracts.js';
import type { FrameAnimation } from './gameplay/frame-animation.js';
import type { Material2D } from './materials2d/index.js';

export interface SpriteOptions {
  texture: Texture;
  source?: Rect2D;
  position?: [number, number];
  rotation?: number;
  scale?: [number, number];
  /** Normalized pivot: (0, 0) is top-left and the default (0.5, 0.5) is center. */
  anchor?: [number, number];
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
  tint?: ColorRGBA;
  space?: 'world' | 'screen';
  material?: Material2D;
}

/** A scene-owned visual; its Texture remains owned by its creator/AssetLoader. */
export class Sprite extends GameObject {
  private currentTexture: Texture;
  private region: Readonly<Rect2D> | undefined;
  private currentAnimation: FrameAnimation | undefined;
  readonly anchor = new Vector2(0.5, 0.5);
  /** Internal pool/culling switch; independent of the author's visibility. */
  renderEnabled = true;
  material: Material2D | undefined;

  constructor(options: SpriteOptions) {
    super();
    if (!options.texture || options.texture.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing Texture for a Sprite.',
      );
    this.currentTexture = options.texture;
    this.material = options.material;
    if (options.position) this.position = new Vector2(...options.position);
    if (options.scale) this.scale = new Vector2(...options.scale);
    if (options.anchor) {
      if (!options.anchor.every(Number.isFinite))
        throw new RangeError('anchor must be finite.');
      this.anchor.set(...options.anchor);
    }
    this.source = options.source;
    this.rotation = options.rotation ?? 0;
    this.opacity = options.opacity ?? 1;
    this.zIndex = options.zIndex ?? 0;
    this.visible = options.visible ?? true;
    if (options.tint) this.tint = options.tint;
    if (options.space) this.space = options.space;
  }

  get texture(): Texture {
    return this.currentTexture;
  }
  set texture(value: Texture) {
    if (!value || value.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing Texture for a Sprite.',
      );
    if (this.region) validateSource(this.region, value.width, value.height);
    this.currentTexture = value;
  }
  get source(): Readonly<Rect2D> | undefined {
    return this.region;
  }
  set source(value: Readonly<Rect2D> | undefined) {
    if (value) {
      validateSource(value, this.texture.width, this.texture.height);
      const previous = this.region;
      if (
        previous &&
        previous.x === value.x &&
        previous.y === value.y &&
        previous.width === value.width &&
        previous.height === value.height
      )
        return;
      this.region = Object.freeze({
        x: value.x,
        y: value.y,
        width: value.width,
        height: value.height,
      });
    } else this.region = undefined;
  }
  /** @internal FrameAnimation owns already-frozen frame rectangles, avoiding frame allocations. */
  setAnimationSource(value: Readonly<Rect2D>): void {
    validateSource(value, this.texture.width, this.texture.height);
    this.region = value;
  }
  get width(): number {
    return this.region?.width ?? this.texture.width;
  }
  get height(): number {
    return this.region?.height ?? this.texture.height;
  }
  get animation(): FrameAnimation | undefined {
    return this.currentAnimation;
  }
  set animation(value: FrameAnimation | undefined) {
    if (value?.sprite !== this) {
      if (value) throw new Error('FrameAnimation belongs to another Sprite.');
    }
    if (value === this.currentAnimation) return;
    this.currentAnimation?.pause();
    this.currentAnimation = value;
  }
  override getLocalBounds(
    out: Rect2D = { x: 0, y: 0, width: 0, height: 0 },
  ): Rect2D {
    out.x = -this.anchor.x * this.width;
    out.y = -this.anchor.y * this.height;
    out.width = this.width;
    out.height = this.height;
    return out;
  }
  override destroy(): void {
    if (this.destroyed) return;
    this.currentAnimation?.pause();
    this.currentAnimation = undefined;
    super.destroy();
  }
}
