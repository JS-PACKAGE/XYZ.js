import { GameObject } from '../game-object.js';
import type { Scene } from '../scene.js';
export interface AccessibilityOptions2D {
    readonly role: string;
    readonly label: string;
    readonly tabIndex?: number;
    readonly disabled?: boolean;
    readonly nativeInput?: boolean;
}
/** Invisible semantics only; exact native geometric masks never replace canvas visuals. */
export declare class AccessibilityManager {
    private readonly canvas;
    private readonly getSize;
    private readonly entries;
    private readonly shapes;
    private readonly point;
    private readonly bounds;
    private readonly transform;
    private scene?;
    private definitions?;
    private coverageCanvas?;
    private disposed;
    constructor(canvas: HTMLCanvasElement, getSize: () => {
        width: number;
        height: number;
    });
    /** Returns only the semantic mirror belonging to the object's live registration. */
    element(object: GameObject): HTMLElement | undefined;
    focus(object: GameObject): boolean;
    private emit;
    private create;
    private shape;
    private createClip;
    private clip;
    private remove;
    update(scene?: Scene): void;
    reset(): void;
    destroy(): void;
}
