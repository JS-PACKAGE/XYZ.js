import type { Scene } from './scene.js';
export interface ContactShadowOptions {
    /** World-space ray length toward the directional light. */
    distance?: number;
    /** Maximum world-space separation between the ray and a depth hit. */
    thickness?: number;
    /** World-space normal offset to avoid self-intersections. */
    bias?: number;
    /** Bounded ray samples, 1–64. */
    steps?: number;
    /** Shadow opacity, 0–1. */
    strength?: number;
}
export declare class ContactShadowSettings {
    distance: number;
    thickness: number;
    bias: number;
    steps: number;
    strength: number;
    constructor(options?: ContactShadowOptions);
    validate(): void;
}
/** Optional scene feature. Removing settings releases renderer depth resources next frame. */
export declare const ContactShadows: Readonly<{
    set(scene: Scene, value: ContactShadowSettings | undefined): void;
    get(scene: Scene): ContactShadowSettings | undefined;
}>;
