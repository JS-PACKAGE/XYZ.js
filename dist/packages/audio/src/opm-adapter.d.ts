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
    version?: 1;
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
    context: AudioContext | null;
    node: AudioWorkletNode | null;
    voices: Map<string, OPMVoice>;
    loadVoice(name: string, voice: unknown): void;
    start(): Promise<void>;
    playNote(options: {
        voice?: string | OPMVoice;
        note: number;
        time?: number;
        duration: number;
    }): number;
    stop(id: number): void;
    close(): Promise<void>;
}
type OutputRouter = (context: AudioContext, channel: AudioChannelName) => AudioNode;
/**
 * Validates an alternative official OPM `dist/api/index.js` URL, such as a version-pinned
 * CDN copy: HTTPS, or HTTP(S) on the page's own origin, without credentials or a fragment.
 */
export declare function resolveOPMModuleURL(input: string | URL): string;
/**
 * Eight OPM instances isolate voice stealing per slot and share one AudioContext. AudioManager
 * lends its own context; a standalone adapter creates one and closes it on destroy.
 */
export declare class OPMAdapter {
    private readonly output?;
    private slots;
    private pendingSlots;
    private unlocking;
    private destroyed;
    private frozen;
    private contextList;
    private owned;
    private lent;
    private moduleUrl;
    constructor(output?: OutputRouter | undefined);
    /** @internal AudioManager lends its context; the adapter never suspends or closes it. */
    lendContext(context: () => AudioContext | undefined): void;
    /** @internal A URL from {@link resolveOPMModuleURL}, used instead of the vendored copy. */
    useModule(url: string): void;
    /** The single native context shared by every slot, once unlocked. */
    get contexts(): readonly AudioContext[];
    /** Native calls happen in the caller's turn, including a trusted resume gesture. */
    setPaused(paused: boolean): Promise<void>;
    static validateVoice(value: unknown): Promise<OPMVoice>;
    /** @internal Validates through the configured module, like {@link validateVoice}. */
    validate(value: unknown): Promise<OPMVoice>;
    get unlocked(): boolean;
    get now(): number;
    get opm(): OfficialOPM | undefined;
    /** @internal The shared slot context; AudioManager hands samples its own context instead. */
    get sampleContext(): AudioContext | undefined;
    unlock(): Promise<void>;
    private initialize;
    play(slot: number, voice: OPMVoice, note: number, delay: number, duration: number, gain: number, bus?: AudioChannelName, spatial?: Required<SpatialAudioOptions>): void;
    stop(slot: number): void;
    setPosition(slot: number, position: Readonly<AudioVec3>): void;
    reset(slot: number): void;
    setGain(slot: number, value: number): void;
    /** @internal Drops every slot (closing only an owned context); a later unlock starts afresh. */
    release(): void;
    destroy(): void;
    private getSlot;
    private dispose;
}
export {};
