import { Easings, type Easing } from './actions2d/easings.js';
export type TweenEasing = Easing | keyof typeof Easings;
export interface TweenOptions {
    /** Seconds of one pass. */
    duration: number;
    /** Seconds before the first pass starts. */
    delay?: number;
    easing?: TweenEasing;
    /** Extra passes after the first; `Infinity` repeats forever. Default 0. */
    repeat?: number;
    /** Alternate passes run backwards. */
    yoyo?: boolean;
    onStart?: (tween: Tween) => void;
    onUpdate?: (tween: Tween) => void;
    onComplete?: (tween: Tween) => void;
}
/** Anything a {@link Timeline} can schedule: it renders its state for a local time. */
export interface Tweenable {
    /** Seconds until it is finished; `Infinity` when it repeats forever. */
    readonly totalDuration: number;
    /** Applies the state at `time` seconds from its own start (clamped to its span). */
    seek(time: number): void;
    /** Returns to the state before it first ran, restoring anything it changed. */
    reset(): void;
}
/**
 * Animates numeric properties of any object, including nested ones such as `'position.x'`.
 * Start values are read when the tween first runs, so chained tweens continue from where the
 * previous one ended; rewinding restores them. A tween can run on its own through
 * {@link TweenGroup}, or be scheduled on a {@link Timeline}.
 */
export declare class Tween implements Tweenable {
    private readonly target;
    readonly duration: number;
    readonly delay: number;
    readonly repeat: number;
    readonly yoyo: boolean;
    timeScale: number;
    playing: boolean;
    private readonly properties;
    private readonly easing;
    private readonly options;
    private readonly reverse;
    private captured;
    private started;
    private finished;
    private clock;
    private constructor();
    /** Tweens from the properties' current values to `values`. */
    static to(target: object, values: Readonly<Record<string, number>>, options: TweenOptions): Tween;
    /** Tweens from `values` to the properties' current values. */
    static from(target: object, values: Readonly<Record<string, number>>, options: TweenOptions): Tween;
    get totalDuration(): number;
    /** Seconds this tween has run, including the delay. */
    get time(): number;
    get completed(): boolean;
    play(): this;
    pause(): this;
    /** Stops and restores the start values if the tween ever ran. */
    stop(): this;
    /** Advances by `delta` seconds; returns true while the tween still has time left. */
    update(delta: number): boolean;
    seek(time: number): void;
    private capture;
    /** Puts every property back to the value it had before the tween first ran. */
    private restore;
    private write;
    /** Restores the start values if the tween ever ran; they are read again on the next run. */
    reset(): void;
}
export interface TimelineOptions {
    /** Extra passes after the first; `Infinity` repeats forever. Default 0. */
    repeat?: number;
    onComplete?: (timeline: Timeline) => void;
}
/**
 * Places tweens (or other timelines) and callbacks on a shared clock. Items are positioned with
 * `add`/`then`/`call`, optionally by label, and the timeline can be played, paused, sought and
 * time-scaled. It is itself {@link Tweenable}, so timelines nest.
 */
export declare class Timeline implements Tweenable {
    timeScale: number;
    playing: boolean;
    private readonly entries;
    private readonly labels;
    /** Items the playhead has reached since the last reset. */
    private readonly touched;
    private readonly repeat;
    private readonly onComplete;
    private cursor;
    private clock;
    /** Absolute time up to which callbacks have run; -1 so a callback at 0 still fires. */
    private fired;
    private finished;
    constructor(options?: TimelineOptions);
    /** Length of one pass: the end of the last item. */
    get duration(): number;
    get totalDuration(): number;
    get time(): number;
    get completed(): boolean;
    /** Names a time (default: the current end) for use as `add(item, 'name')`. */
    label(name: string, at?: number): this;
    /** Adds `item` at a time, a label (plus `offset`), or the current end. Items may overlap. */
    add(item: Tweenable, at?: number | string, offset?: number): this;
    /** Adds `item` after everything so far, `gap` seconds later. */
    then(item: Tweenable, gap?: number): this;
    /** Runs `callback` when playback passes `at` (default: the end); seeking does not run it. */
    call(callback: () => void, at?: number | string, offset?: number): this;
    play(): this;
    pause(): this;
    /** Stops and rewinds every item to its start. */
    stop(): this;
    update(delta: number): boolean;
    seek(time: number): void;
    private advance;
    private render;
    /** Runs callbacks whose absolute time, in any pass, lies in (fired, next]. */
    private fireCallbacks;
    /** Rewinds to the start, undoing what every item changed. */
    reset(): void;
    private position;
}
/** Owns running tweens and timelines and advances them together; `scene.tweens` is one. */
export declare class TweenGroup {
    private readonly running;
    private disposed;
    get size(): number;
    /** Starts `item` (a Tween or Timeline) and keeps updating it until it finishes. */
    add<T extends Tween | Timeline>(item: T): T;
    to(target: object, values: Readonly<Record<string, number>>, options: TweenOptions): Tween;
    from(target: object, values: Readonly<Record<string, number>>, options: TweenOptions): Tween;
    remove(item: Tween | Timeline): boolean;
    update(delta: number): void;
    /** Drops every item without finishing it, leaving properties where they are. */
    clear(): void;
    destroy(): void;
}
