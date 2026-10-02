import type { Scene } from '../../../core/src/scene.js';
import type { AudioChannelName } from '../audio-manager.js';
import { SamplePlayback, type SamplePlayOptions } from './sample-playback.js';
import { AudioStream, type AudioStreamOptions } from './stream.js';
import { AudioListenerState } from './spatial.js';
import type { AudioActivity } from '../mixer.js';
interface SampleHost {
    context(): AudioContext | undefined;
    scene(): Scene | undefined;
    bus(context: AudioContext, channel: AudioChannelName): GainNode;
    activity?(channel: AudioChannelName, delay?: number): AudioActivity;
    contexts?(): readonly AudioContext[];
}
/** Seconds into the decoded buffer; `end` is exclusive of later sprites sharing the file. */
export interface AudioSpriteRange {
    readonly start: number;
    readonly end: number;
}
/** Encoded bytes are loader-owned; decoded metadata stays unavailable before unlock/decode. */
export declare class SampleAudioAsset {
    private readonly engine;
    private encoded;
    private buffer?;
    private decoding?;
    private readonly spriteRanges;
    loop: boolean;
    persistent: boolean;
    /** @internal */
    constructor(engine: SampleAudioEngine, encoded: ArrayBuffer);
    get decoded(): boolean;
    get duration(): number | undefined;
    get sampleRate(): number | undefined;
    get channels(): number | undefined;
    /** Names of the defined sprites in definition order. */
    get sprites(): readonly string[];
    /**
     * Names sections of this one decoded buffer so many short sounds share a single file and
     * decode. Ranges are in seconds, are validated against the decoded duration when played, and
     * may overlap. Redefining a name replaces it.
     */
    defineSprites(ranges: Readonly<Record<string, AudioSpriteRange>>): void;
    /** Plays one defined sprite; `loop` repeats only that section. */
    playSprite(name: string, options?: Omit<SamplePlayOptions, 'region' | 'offset'>): Promise<SamplePlayback>;
    decode(): Promise<void>;
    play(options?: SamplePlayOptions): Promise<SamplePlayback>;
    /** @internal */
    dispose(): void;
}
/** Owns sampled buses and sources on the first OPM context, independent of the eight OPM slots. */
export declare class SampleAudioEngine {
    private readonly host;
    private readonly lifetime;
    private readonly cache;
    private readonly assets;
    private readonly playbacks;
    /** Playbacks paused by the manager's pause policy, resumed together. */
    private readonly suspended;
    private holding;
    private disposed;
    readonly listener: AudioListenerState;
    constructor(host: SampleHost);
    get signal(): AbortSignal;
    get currentScene(): Scene | undefined;
    requireContext(): AudioContext;
    /** Subscriber abort rejects only that acquisition, never another caller's shared cache. */
    load(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<SampleAudioAsset>;
    play(buffer: AudioBuffer, options: SamplePlayOptions): SamplePlayback;
    /**
     * Starts a streamed (not decoded) playback of a long file through an HTMLAudioElement. Resolves
     * once the element can play; `autoplay` (default true) then starts it.
     */
    stream(url: string, options?: AudioStreamOptions): Promise<AudioStream>;
    /** Pauses every playing sample and stream; `resume` restarts exactly those. */
    suspend(): void;
    resume(): void;
    stopScene(scene: Scene): void;
    destroy(): void;
}
export {};
