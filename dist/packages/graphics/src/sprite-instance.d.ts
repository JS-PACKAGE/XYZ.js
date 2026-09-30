import type { Sprite } from '../../core/src/sprite.js';
import type { Camera2D } from '../../core/src/camera2d.js';
export declare const SPRITE_FLOATS = 20;
export declare const SPRITE_BYTES: number;
/** Keep the complete ancestor affine transform, including shear and reflection. */
export declare function writeSpriteInstance(sprite: Sprite, camera: Camera2D, data: Float32Array, offset: number): void;
