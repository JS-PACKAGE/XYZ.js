import { gestureDefaults } from '../../../src/data/input.js';
import type { PointerSample } from './index.js';
export type GestureType = 'tap' | 'doubletap' | 'longpress' | 'swipe' | 'pan' | 'pinch' | 'rotate';
/** Discrete gestures (`tap`, `doubletap`, `longpress`, `swipe`) only report `end`. */
export type GesturePhase = 'start' | 'change' | 'end' | 'cancel';
export interface GesturePoint {
    readonly x: number;
    readonly y: number;
}
export interface GestureDetail {
    readonly type: GestureType;
    readonly phase: GesturePhase;
    /** Pointer ids taking part: one, or two for pinch and rotate. */
    readonly pointerIds: readonly number[];
    readonly pointerType: string;
    /** Logical pixels; the pointer, or the midpoint of the two pointers. */
    readonly center: GesturePoint;
    /** Movement of `center` since the gesture began, in logical pixels. */
    readonly translation: GesturePoint;
    /** Logical pixels per second at the latest sample. */
    readonly velocity: GesturePoint;
    /** Swipe direction by dominant axis. */
    readonly direction?: 'left' | 'right' | 'up' | 'down';
    /** Pinch distance relative to when the second pointer went down (1 = unchanged). */
    readonly scale: number;
    /** Rotation of the two pointers in radians since they went down; clockwise on screen is positive. */
    readonly rotation: number;
}
export interface GestureOptions {
    /** Monotonic milliseconds used for timing; defaults to `performance.now`. */
    readonly now?: () => number;
    readonly thresholds?: Partial<GestureThresholds>;
}
export type GestureThresholds = {
    -readonly [K in keyof typeof gestureDefaults]: number;
};
type Listener = (detail: GestureDetail) => void;
/**
 * Turns the pointer stream into tap, double tap, long press, swipe, pan, pinch and rotate
 * gestures. It is a read-only observer: it never consumes samples or changes how the Scene routes
 * pointers, so it can run beside ordinary pointer handlers. Only the first two simultaneous
 * pointers are tracked, and mouse input uses the primary button only.
 */
export declare class GestureRecognizer extends EventTarget {
    readonly thresholds: GestureThresholds;
    private readonly clock;
    private readonly contacts;
    private pair;
    private lastTap;
    private disposed;
    constructor(options?: GestureOptions);
    /** Subscribes to one gesture type; returns the function that unsubscribes. */
    on(type: GestureType, listener: Listener): () => void;
    /** @internal Called for every pointer sample as it is recorded. */
    feed(sample: PointerSample): void;
    /** @internal Once per frame: promotes a held, unmoved pointer to a long press. */
    update(): void;
    /** @internal Cancels whatever is in flight, for example when the page is hidden. */
    reset(): void;
    destroy(): void;
    private down;
    private move;
    private movePair;
    private up;
    private cancel;
    private emitPan;
    private emitPair;
    private emit;
}
export {};
