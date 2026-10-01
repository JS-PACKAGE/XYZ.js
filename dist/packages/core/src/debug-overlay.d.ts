import type { Game } from './game.js';
import type { RenderStats } from '../../graphics/src/render-stats.js';
export interface DebugOverlayOptions {
    /** Corner of the canvas the panel sticks to. Default `top-left`. */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /** Milliseconds between refreshes; default 250. */
    interval?: number;
    /** Extra lines appended to the panel, evaluated on each refresh. */
    extra?: () => string | readonly string[];
}
/** Everything the panel prints; kept plain so formatting can be tested without a DOM. */
export interface DebugSample {
    /** Frames per second measured over wall time, never from the clamped simulation delta. */
    fps: number;
    frameMs: number;
    backend: string;
    state: string;
    logicalSize: readonly [number, number];
    backingSize: readonly [number, number];
    frame: number;
    render: RenderStats;
    colliders: number;
    tweens: number;
    audio: string;
    pointers: number;
}
export declare function formatDebugSample(sample: DebugSample): string[];
/**
 * A small text panel over the canvas with frame rate, renderer counters and a few subsystem
 * sizes. It is a plain DOM element (not rendered by the engine), so it costs nothing on the GPU
 * and never affects what is drawn. Refresh is timer-driven and cheap; it removes itself once the
 * Game is destroyed.
 */
export declare class DebugOverlay {
    private readonly game;
    private readonly options;
    readonly element: HTMLPreElement;
    private timer;
    private lastFrame;
    private lastTime;
    private fps;
    private destroyed;
    private constructor();
    /** Creates the panel and starts refreshing it. */
    static attach(game: Game, options?: DebugOverlayOptions): DebugOverlay;
    get visible(): boolean;
    set visible(value: boolean);
    destroy(): void;
    private refresh;
    /** Sticks the panel to a corner of the canvas box, wherever the canvas sits in its parent. */
    private place;
}
