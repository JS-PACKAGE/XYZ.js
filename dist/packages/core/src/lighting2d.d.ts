import type { Sprite } from './sprite.js';
export declare const MAX_LIGHTS_2D: 4;
export declare const MAX_OCCLUDERS_2D: 4;
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
export interface Occluder2DOptions {
    a?: readonly [number, number];
    b?: readonly [number, number];
    space?: 'world' | 'screen';
}
/** Finite segment that blocks a 2D light in the sprite's matching space. */
export declare class Occluder2D {
    a: [number, number];
    b: [number, number];
    space: 'world' | 'screen';
    enabled: boolean;
    constructor(options?: Occluder2DOptions);
    validate(): void;
}
/** True when the segment crosses the open 2D segment from the light to the sample. */
export declare function occluderBlocksLight2D(light: readonly [number, number], sample: readonly [number, number], a: readonly [number, number], b: readonly [number, number]): boolean;
export interface Lighting2DOptions {
    lights?: readonly Light2D[];
    ambient?: readonly [number, number, number];
    occluders?: readonly Occluder2D[];
    /** Linear RGB added after diffuse, still scaled by sprite opacity. */
    emissive?: readonly [number, number, number];
    /** Highlight strength, 0–1. Default 0 keeps the existing diffuse-only look. */
    specular?: number;
    /** 0 is sharp and 1 is matte. Default 1. */
    roughness?: number;
}
/** Borrowed lights and normal textures: destroying a sprite never destroys either. */
export declare class Lighting2D {
    readonly lights: Light2D[];
    readonly occluders: Occluder2D[];
    ambient: [number, number, number];
    emissive: [number, number, number];
    specular: number;
    roughness: number;
    constructor(options?: Lighting2DOptions);
    validate(): void;
}
export declare function validateSpriteLighting2D(sprite: Sprite): void;
