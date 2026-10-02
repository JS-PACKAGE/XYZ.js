export interface BiquadEffect {
    readonly type: 'biquad';
    readonly filter: BiquadFilterType;
    readonly frequency: number;
    readonly Q?: number;
    readonly gain?: number;
    readonly detune?: number;
}
export interface CompressorEffect {
    readonly type: 'compressor';
    readonly threshold?: number;
    readonly knee?: number;
    readonly ratio?: number;
    readonly attack?: number;
    readonly release?: number;
}
export interface ReverbEffect {
    readonly type: 'reverb';
    readonly impulse: PreparedAudioImpulse;
    readonly wet?: number;
    readonly normalize?: boolean;
}
export type AudioEffect = BiquadEffect | CompressorEffect | ReverbEffect;
/** Owns a private PCM snapshot, never the caller's AudioBuffer. Disposal prevents new uses;
 * graphs already retaining this preparation keep their buffers until disconnected. */
export declare class PreparedAudioImpulse {
    #private;
    readonly sampleRate: number;
    readonly length: number;
    readonly numberOfChannels: number;
    constructor(buffer: AudioBuffer);
    get destroyed(): boolean;
    dispose(): void;
}
/** Validation and copying happen before changing any live graph. */
export declare function snapshotEffects(input: readonly AudioEffect[]): readonly AudioEffect[];
export interface EffectChain {
    readonly input: GainNode;
    readonly output: GainNode;
    disconnect(): void;
}
/** Native nodes only: no replacement of the official OPM DSP. */
export declare function createEffectChain(context: BaseAudioContext, effects: readonly AudioEffect[]): EffectChain;
