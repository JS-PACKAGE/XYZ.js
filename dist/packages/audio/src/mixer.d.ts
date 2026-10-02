import type { AudioChannelName } from './audio-manager.js';
import { type AudioEffect } from './effects.js';
import { type GainCurve } from './gain-timeline.js';
export type AudioBusName = AudioChannelName | 'master';
export interface AudioDuckingRule {
    readonly source: AudioChannelName;
    readonly target: AudioBusName;
    readonly gain: number;
    readonly attack?: number;
    readonly release?: number;
}
export interface AudioActivity {
    readonly released: boolean;
    /** A paused source does not duck. This does not release ownership. */
    setActive(active: boolean): void;
    release(after?: number): void;
}
/** Shared immutable policies, but one complete native graph per actual AudioContext. */
export declare class AudioMixer {
    private readonly graphs;
    private readonly effects;
    private readonly envelopes;
    private rules;
    private readonly activities;
    private primary?;
    private disposed;
    private cleanupTimer?;
    constructor();
    get currentTime(): number;
    get contextCount(): number;
    getEffects(name: AudioBusName): readonly AudioEffect[];
    get ducking(): readonly AudioDuckingRule[];
    attach(context: AudioContext): void;
    input(context: AudioContext, name: AudioBusName): GainNode;
    /** Borrowed analyser; its signals are local to this context, never a cross-context sum. */
    analyser(name: AudioBusName, contextIndex?: number): AnalyserNode | undefined;
    setEffects(name: AudioBusName, input: readonly AudioEffect[]): void;
    setGain(name: AudioBusName, value: number): void;
    automate(name: AudioBusName, value: number, time: number, duration: number, curve?: GainCurve): void;
    cancelAutomation(name: AudioBusName, time?: number): number;
    setDucking(input: readonly AudioDuckingRule[]): void;
    /** Activity lasts through an optional native-time reservation, including OPM release tails. */
    acquire(channel: AudioChannelName, delay?: number, duration?: number): AudioActivity;
    private refreshDucking;
    private collect;
    /** @internal Failed unlock rolls back native graphs but retains configured policies. */
    clearContexts(): void;
    destroy(): void;
    private disposeGraph;
}
