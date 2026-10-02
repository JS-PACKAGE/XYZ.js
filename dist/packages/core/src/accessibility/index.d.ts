import { GameObject } from '../game-object.js';
import type { Scene } from '../scene.js';
export interface AccessibilityOptions2D {
    readonly role: string;
    readonly label: string;
    readonly tabIndex?: number;
    readonly disabled?: boolean;
    readonly nativeInput?: boolean;
    readonly language?: string;
    readonly description?: string;
    readonly modal?: boolean;
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
    private readonly liveRegions;
    private readonly announcementTimers;
    private readonly modalScopes;
    private semanticSequence;
    constructor(canvas: HTMLCanvasElement, getSize: () => {
        width: number;
        height: number;
    });
    /** Returns only the semantic mirror belonging to the object's live registration. */
    element(object: GameObject): HTMLElement | undefined;
    focus(object: GameObject): boolean;
    /** Semantic-only announcements; repeated results are reinserted rather than silently deduplicated. */
    announce(text: string, options?: {
        priority?: 'polite' | 'assertive';
        language?: string;
    }): void;
    clearAnnouncements(priority?: 'polite' | 'assertive'): void;
    /** A root-local modal hides background semantics from assistive navigation, not just Tab. */
    setModal(root: GameObject, modal?: GameObject): void;
    private inScope;
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
