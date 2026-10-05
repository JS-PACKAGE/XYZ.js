import type { Sprite } from './sprite.js';
export declare const MAX_LIGHTS_2D: 4;
export interface Light2DOptions {
    position?: readonly [number, number];
    height?: number;
    radius?: number;
    intensity?: number;
    color?: readonly [number, number, number];
    space?: 'world' | 'screen';
}
/** Point light in world units (or logical HUD pixels); +Y points down, +Z toward the viewer. */
export declare class Light2D {
    position: [number, number];
    height: number;
    radius: number;
    intensity: number;
    color: [number, number, number];
    space: 'world' | 'screen';
    enabled: boolean;
    constructor(options?: Light2DOptions);
    validate(): void;
}
export interface Lighting2DOptions {
    lights?: readonly Light2D[];
    ambient?: readonly [number, number, number];
}
/** Borrowed lights and normal textures: destroying a sprite never destroys either. */
export declare class Lighting2D {
    readonly lights: Light2D[];
    ambient: [number, number, number];
    constructor(options?: Lighting2DOptions);
    validate(): void;
}
export declare function validateSpriteLighting2D(sprite: Sprite): void;
