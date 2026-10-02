export type GainCurve = 'linear' | 'exponential';
/** Deterministic envelope used to hold/cancel automation without trusting AudioParam.value,
 * which is not the rendered value of a future ramp on every browser. */
export declare class GainTimeline {
    private initial;
    private segments;
    constructor(initial?: number);
    valueAt(time: number): number;
    isRampingAt(time: number): boolean;
    /** Copies schedules onto another context's captured clock, without sharing mutable segments. */
    copy(offset: number): GainTimeline;
    validateRamp(value: number, start: number, duration: number, curve?: GainCurve): number;
    ramp(value: number, start: number, duration: number, curve?: GainCurve): void;
    cancel(time: number): number;
    /** Replays only the current/future envelope onto an independent native context clock. */
    apply(param: AudioParam, now: number, offset?: number): void;
}
