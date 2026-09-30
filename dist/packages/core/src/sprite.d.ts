import { Texture } from '../../assets/src/index.js';
import { Vector2 } from '../../math/src/index.js';
import { GameObject } from './game-object.js';
import { type ColorRGBA, type Rect2D } from './gameplay/contracts.js';
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
export declare class Sprite extends GameObject {
    private currentTexture;
    private region;
    private currentAnimation;
    readonly anchor: Vector2;
    /** Internal pool/culling switch; independent of the author's visibility. */
    renderEnabled: boolean;
    material: Material2D | undefined;
    constructor(options: SpriteOptions);
    get texture(): Texture;
    set texture(value: Texture);
    get source(): Readonly<Rect2D> | undefined;
    set source(value: Readonly<Rect2D> | undefined);
    /** @internal FrameAnimation owns already-frozen frame rectangles, avoiding frame allocations. */
    setAnimationSource(value: Readonly<Rect2D>): void;
    get width(): number;
    get height(): number;
    get animation(): FrameAnimation | undefined;
    set animation(value: FrameAnimation | undefined);
    getLocalBounds(out?: Rect2D): Rect2D;
    destroy(): void;
}
