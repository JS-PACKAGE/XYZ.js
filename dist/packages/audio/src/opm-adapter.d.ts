import type { AudioChannelName } from './audio-manager.js';
import { type SpatialAudioOptions, type AudioVec3 } from './samples/spatial.js';
export interface OPMOperator {
    ratio: number;
    level: number;
    detune: number;
    adsr: {
        a: number;
        d: number;
        s: number;
        r: number;
    };
}
export interface OPMVoice {
    version?: 1 | 6;
    name?: string;
    algorithm: number;
    feedback: number;
    ops: [OPMOperator, OPMOperator, OPMOperator, OPMOperator];
    lfo?: {
        rate: number;
        amDepth: number;
        pmDepth: number;
    };
    modIndex?: number;
}
interface OfficialOPM {
    readonly context: AudioContext | null;
    readonly node: AudioWorkletNode | null;
    voices: ReadonlyMap<string, OPMVoice>;
    loadVoice(name: string, voice: unknown): void;
    start(): Promise<void>;
    playNote(options: {
        voice?: string | OPMVoice;
        note: number;
        time?: number;
        duration: number;
    }): number;
    stop(id: number): void;
    panic(): number;
    dispose(): Promise<void>;
    close(): Promise<void>;
}
type OutputRouter = (context: AudioContext, channel: AudioChannelName) => AudioNode;
/** Eight live AudioContexts/worklets isolate voice stealing at the cost of idle resources; destroy closes them. */
export declare class OPMAdapter {
    private readonly output?;
    private slots;
    private pendingSlots;
    private unlocking;
    private destroyed;
    private frozen;
    private contextList;
    constructor(output?: OutputRouter | undefined);
    /** Context-local graphs cannot share native nodes across these eight clocks. */
    get contexts(): readonly AudioContext[];
    /** Native calls happen in the caller's turn, including a trusted resume gesture. */
    setPaused(paused: boolean): Promise<void>;
    static validateVoice(value: unknown): Promise<OPMVoice>;
    get unlocked(): boolean;
    get now(): number;
    get opm(): OfficialOPM | undefined;
    /** @internal Native PCM shares the first existing context; worklet reset leaves it alive. */
    get sampleContext(): AudioContext | undefined;
    unlock(): Promise<void>;
    private initialize;
    play(slot: number, voice: OPMVoice, note: number, delay: number, duration: number, gain: number, bus?: AudioChannelName, spatial?: Required<SpatialAudioOptions>): void;
    stop(slot: number): void;
    setPosition(slot: number, position: Readonly<AudioVec3>): void;
    reset(slot: number): void;
    setGain(slot: number, value: number): void;
    destroy(): void;
    private getSlot;
    private dispose;
}
export {};
