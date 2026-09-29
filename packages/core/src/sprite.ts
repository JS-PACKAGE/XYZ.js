import { Texture, AssetError } from '../../assets/src/index.js';
import { Vector2 } from '../../math/src/index.js';
import { GameObject } from './game-object.js';

export interface SpriteOptions {
  texture: Texture;
  position?: [number, number];
  rotation?: number;
  scale?: [number, number];
  /** Normalized pivot: (0, 0) is top-left and the default (0.5, 0.5) is center. */
  anchor?: [number, number];
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

/** A scene-owned visual; the Texture remains owned by its creator/AssetLoader. */
export class Sprite extends GameObject {
  private currentTexture: Texture;
  readonly anchor = new Vector2(0.5, 0.5);
  private alpha = 1;
  private order = 0;
  visible = true;

  constructor(options: SpriteOptions) {
    super();
    this.currentTexture = options.texture;
    if (!this.currentTexture || this.currentTexture.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing Texture for a Sprite.',
      );

    if (options.position) {
      assertFinite(options.position[0], 'position.x');
      assertFinite(options.position[1], 'position.y');
      this.transform.position.set(options.position[0], options.position[1]);
    }
    if (options.scale) {
      assertFinite(options.scale[0], 'scale.x');
      assertFinite(options.scale[1], 'scale.y');
      this.transform.scale.set(options.scale[0], options.scale[1]);
    }
    if (options.anchor) {
      assertFinite(options.anchor[0], 'anchor.x');
      assertFinite(options.anchor[1], 'anchor.y');
      this.anchor.set(options.anchor[0], options.anchor[1]);
    }
    this.rotation = options.rotation ?? 0;
    this.opacity = options.opacity ?? 1;
    this.zIndex = options.zIndex ?? 0;
    this.visible = options.visible ?? true;
  }

  get texture(): Texture {
    return this.currentTexture;
  }

  set texture(value: Texture) {
    if (!value || value.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing Texture for a Sprite.',
      );
    this.currentTexture = value;
  }

  override get position(): Vector2 {
    return super.position;
  }

  override set position(value: Vector2) {
    assertFinite(value.x, 'position.x');
    assertFinite(value.y, 'position.y');
    super.position = value;
  }

  override get rotation(): number {
    return super.rotation;
  }

  override set rotation(value: number) {
    assertFinite(value, 'rotation');
    super.rotation = value;
  }

  override get scale(): Vector2 {
    return super.scale;
  }

  override set scale(value: Vector2) {
    assertFinite(value.x, 'scale.x');
    assertFinite(value.y, 'scale.y');
    super.scale = value;
  }

  get opacity(): number {
    return this.alpha;
  }

  set opacity(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new RangeError('opacity must be finite and between 0 and 1.');
    this.alpha = value;
  }

  get zIndex(): number {
    return this.order;
  }

  set zIndex(value: number) {
    assertFinite(value, 'zIndex');
    this.order = value;
  }
}
