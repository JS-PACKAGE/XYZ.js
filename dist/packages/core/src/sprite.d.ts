import { Texture } from '../../assets/src/index.js';
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
/** A scene-owned visual; the Texture remains owned by its creator/AssetLoader. */
export declare class Sprite extends GameObject {
    private currentTexture;
    readonly anchor: Vector2;
    private alpha;
    private order;
    visible: boolean;
    constructor(options: SpriteOptions);
    get texture(): Texture;
    set texture(value: Texture);
    get position(): Vector2;
    set position(value: Vector2);
    get rotation(): number;
    set rotation(value: number);
    get scale(): Vector2;
    set scale(value: Vector2);
    get opacity(): number;
    set opacity(value: number);
    get zIndex(): number;
    set zIndex(value: number);
}
