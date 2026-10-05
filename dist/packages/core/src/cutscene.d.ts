import { GameObject } from './game-object.js';
import type { Tweenable } from './tween.js';
import type { AnimationClip } from './animation.js';
export type CutsceneStatus = 'idle' | 'playing' | 'paused' | 'waiting' | 'completed' | 'cancelled' | 'error';
/** Samples must be pure/idempotent state writes. Side effects belong in cues, never samples. */
export interface CutsceneAction {
    sample(time: number, duration: number): void;
    reset(): void;
    pause?(): void;
    resume?(): void;
    dispose?(): void;
}
export interface CutsceneTrack {
    readonly id: string;
    readonly start: number;
    readonly duration: number;
    readonly action: CutsceneAction;
}
export interface CutsceneCue {
    readonly id: string;
    readonly at: number;
    /** Returning a promise creates an instruction/choice barrier. AbortSignal invalidates stale UI. */
    readonly run: (context: {
        director: CutsceneDirector;
        signal: AbortSignal;
        pass: number;
    }) => void | Promise<unknown>;
    /** Default once for the entire run; opt in to one invocation per loop pass. */
    readonly repeat?: boolean;
}
export interface CutsceneOptions {
    readonly duration: number;
    readonly tracks?: readonly CutsceneTrack[];
    readonly cues?: readonly CutsceneCue[];
    /** Extra passes, or Infinity. */
    readonly repeat?: number;
    readonly onComplete?: () => void;
    readonly onError?: (error: unknown) => void;
}
/** Uses Scene's existing GameObject simulation update; also supports manual update(dt).
 * Seek samples tracks but never invokes cues; past cues are consumed. Cancel resets borrowed
 * track state and disposes owned resources; destruction always cancels pending barriers. */
export declare class CutsceneDirector extends GameObject {
    private readonly options;
    readonly duration: number;
    private readonly tracks;
    private readonly cues;
    private readonly repeat;
    private state;
    private clock;
    private passNumber;
    private readonly fired;
    private barrier;
    private readonly cueLifetimes;
    private generation;
    private paused;
    private updating;
    private disposedActions;
    error: unknown;
    constructor(options: CutsceneOptions);
    get status(): CutsceneStatus;
    get time(): number;
    get pass(): number;
    play(): void;
    pause(): void;
    resume(): void;
    seek(time: number): void;
    update(delta: number): void;
    cancel(): void;
    protected onDestroy(): void;
    private cueKey;
    private sample;
    private invalidate;
    private fail;
    private disposeActions;
}
/** Reuses Tween/Timeline state sampling for actual camera or UI numeric properties.
 * Use callback-free tweenables: cue callbacks belong to the director's side-effect ledger. */
export declare function cutsceneTween(item: Tweenable): CutsceneAction;
/** Renderer-independent clip sampling, without playing a second mixer clock. */
export declare function cutsceneAnimation(clip: AnimationClip, weight?: number): CutsceneAction;
/** A UI state adapter captures its original value and restores it on cancel/backward seek. */
export declare function cutsceneValue<T>(read: () => T, write: (value: T) => void, value: T): CutsceneAction;
/** Cue-owned audio playback: cancellation abort stops real sample/OPM/stream playback.
 * Playback is borrowed; use a factory cue for each loop if audio should repeat. */
export declare function cutsceneAudio(play: () => {
    stop(): void;
} | Promise<{
    stop(): void;
}>): CutsceneCue['run'];
