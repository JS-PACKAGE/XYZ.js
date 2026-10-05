import {
  AssetError,
  TextureView2D,
  type Texture2DSource,
} from '../../assets/src/index.js';
import { Vector2 } from '../../math/src/index.js';
import { GameObject } from './game-object.js';
import {
  validateSource,
  type ColorRGBA,
  type Rect2D,
} from './gameplay/contracts.js';
import type { FrameAnimation } from './gameplay/frame-animation.js';
import type { Material2D } from './materials2d/index.js';
import type { Lighting2D } from './lighting2d.js';
import { validateAnisotropy } from './texture-sampler.js';

export interface SpriteSampler2D {
  minFilter?: 'nearest' | 'linear';
  magFilter?: 'nearest' | 'linear';
  /** Integer quality request in [1,16]; nearest filtering is incompatible. */
  maxAnisotropy?: number;
}

export interface SpriteOptions {
  texture?: Texture2DSource;
  view?: TextureView2D;
  source?: Rect2D;
  position?: [number, number];
  rotation?: number;
  scale?: [number, number];
  pivot?: [number, number];
  skew?: [number, number];
  /** Normalized origin: (0, 0) is top-left and the default (0.5, 0.5) is center. */
  anchor?: [number, number];
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
  tint?: ColorRGBA;
  space?: 'world' | 'screen';
  material?: Material2D;
  lighting?: Lighting2D;
  /** RGB tangent normals encoded [0,1], +Y down; atlas/frame layout matches albedo. */
  normalTexture?: Texture2DSource;
  sampler?: SpriteSampler2D;
  roundPixels?: boolean;
}

/** A scene-owned visual; its Texture remains owned by its creator/AssetLoader. */
export class Sprite extends GameObject {
  private currentTexture: Texture2DSource;
  private region: Readonly<Rect2D> | undefined;
  private currentView: TextureView2D | undefined;
  private sampling: Readonly<SpriteSampler2D> | undefined;
  private rounded = false;
  private currentAnimation: FrameAnimation | undefined;
  readonly anchor = new Vector2(0.5, 0.5);
  /** Internal pool/culling switch; independent of the author's visibility. */
  renderEnabled = true;
  material: Material2D | undefined;
  lighting: Lighting2D | undefined;
  normalTexture: Texture2DSource | undefined;

  constructor(options: SpriteOptions) {
    super();
    const texture = options.texture ?? options.view?.source;
    if (!texture || texture.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing texture source for a Sprite.',
      );
    if (
      options.view &&
      options.texture &&
      options.view.source !== options.texture
    )
      throw new AssetError(
        'Sprite view must borrow the supplied texture source.',
      );
    if (options.view && options.source)
      throw new RangeError(
        'Sprite cannot use both a view and a source rectangle.',
      );
    options.view?.validate();
    this.currentTexture = texture;
    this.material = options.material;
    this.lighting = options.lighting;
    this.normalTexture = options.normalTexture;
    if (options.position) this.position = new Vector2(...options.position);
    if (options.scale) this.scale = new Vector2(...options.scale);
    if (options.pivot) this.pivot = new Vector2(...options.pivot);
    if (options.skew) this.skew = new Vector2(...options.skew);
    const anchor = options.anchor ?? options.view?.defaultAnchor;
    if (anchor) {
      if (anchor.length !== 2 || !anchor.every(Number.isFinite))
        throw new RangeError('anchor must contain two finite numbers.');
      this.anchor.set(anchor[0], anchor[1]);
    }
    if (options.view) this.view = options.view;
    else this.source = options.source;
    this.sampler = options.sampler;
    this.roundPixels = options.roundPixels ?? false;
    this.rotation = options.rotation ?? 0;
    this.opacity = options.opacity ?? 1;
    this.zIndex = options.zIndex ?? 0;
    this.visible = options.visible ?? true;
    if (options.tint) this.tint = options.tint;
    if (options.space) this.space = options.space;
  }

  get texture(): Texture2DSource {
    return this.currentTexture;
  }
  set texture(value: Texture2DSource) {
    if (!value || value.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing texture source for a Sprite.',
      );
    if (this.currentView && this.currentView.source !== value)
      throw new AssetError(
        'Sprite texture replacement must match its active view.',
      );
    this.currentView?.validate();
    if (this.region) validateSource(this.region, value.width, value.height);
    this.currentTexture = value;
  }
  get view(): TextureView2D | undefined {
    return this.currentView;
  }
  set view(value: TextureView2D | undefined) {
    if (value && !(value instanceof TextureView2D))
      throw new TypeError('Sprite view must be a TextureView2D.');
    value?.validate();
    if (value) this.currentTexture = value.source;
    this.currentView = value;
    this.region = undefined;
  }
  get sampler(): Readonly<SpriteSampler2D> | undefined {
    return this.sampling;
  }
  set sampler(value: Readonly<SpriteSampler2D> | undefined) {
    if (
      value &&
      ((value.minFilter !== undefined &&
        value.minFilter !== 'nearest' &&
        value.minFilter !== 'linear') ||
        (value.magFilter !== undefined &&
          value.magFilter !== 'nearest' &&
          value.magFilter !== 'linear'))
    )
      throw new RangeError('Sprite filters must be nearest or linear.');
    if (value) validateAnisotropy(value);
    this.sampling = value
      ? Object.freeze({
          minFilter: value.minFilter,
          magFilter: value.magFilter,
          maxAnisotropy: value.maxAnisotropy,
        })
      : undefined;
  }
  get roundPixels(): boolean {
    return this.rounded;
  }
  set roundPixels(value: boolean) {
    if (typeof value !== 'boolean')
      throw new TypeError('roundPixels must be boolean.');
    this.rounded = value;
  }
  get source(): Readonly<Rect2D> | undefined {
    return this.region;
  }
  set source(value: Readonly<Rect2D> | undefined) {
    if (value) {
      validateSource(value, this.texture.width, this.texture.height);
      this.currentView = undefined;
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
    } else {
      this.region = undefined;
      this.currentView = undefined;
    }
  }
  /** @internal FrameAnimation owns already-frozen frame rectangles, avoiding frame allocations. */
  setAnimationSource(value: Readonly<Rect2D>): void {
    validateSource(value, this.texture.width, this.texture.height);
    this.currentView = undefined;
    this.region = value;
  }
  /** @internal Animation views are already immutable and keep the Sprite anchor stable. */
  setAnimationView(value: TextureView2D): void {
    this.view = value;
  }
  get width(): number {
    return (
      this.currentView?.width ??
      this.region?.width ??
      (this.texture.kind === 'render'
        ? this.texture.logicalWidth
        : this.texture.width)
    );
  }
  get height(): number {
    return (
      this.currentView?.height ??
      this.region?.height ??
      (this.texture.kind === 'render'
        ? this.texture.logicalHeight
        : this.texture.height)
    );
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
