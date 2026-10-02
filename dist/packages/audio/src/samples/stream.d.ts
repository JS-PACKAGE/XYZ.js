import type { AudioPlayOptions } from '../audio-manager.js';
import { type AudioVec3 } from './spatial.js';
export interface AudioStreamOptions extends AudioPlayOptions {
    volume?: number;
    playbackRate?: number;
    /** Position in seconds to start from. */
    startTime?: number;
    /** Start playing as soon as the media can play. Default true. */
    autoplay?: boolean;
    /**
     * CORS mode of the media element. Defaults to `anonymous` for cross-origin URLs: without CORS
     * headers the Web Audio graph receives silence, so such URLs fail to play instead.
     */
    crossOrigin?: 'anonymous' | 'use-credentials';
    signal?: AbortSignal;
}
export type AudioStreamState = 'paused' | 'playing' | 'stopped' | 'ended';
/**
 * A long audio file played through an `HTMLAudioElement` that is routed into the channel bus, so
 * it starts before the whole file is downloaded and is never decoded into memory. Prefer decoded
 * samples for short effects: streams cannot be scheduled sample-accurately, loops can have a
 * gap, and seeking needs a seekable (range-capable) server.
 */
export declare class AudioStream extends EventTarget {
    private readonly media;
    private readonly source;
    private readonly gain;
    private readonly release;
    private readonly activity?;
    private status;
    private level;
    private disposed;
    private readonly pauseReasons;
    private readonly panner?;
    /** @internal */
    constructor(media: HTMLAudioElement, source: MediaElementAudioSourceNode, gain: GainNode, release: (stream: AudioStream) => void, options: AudioStreamOptions, activity?: ((active: boolean) => void) | undefined);
    get state(): AudioStreamState;
    /** Seconds. */
    get position(): number;
    /** Seconds, `Infinity` for an endless stream, or `undefined` before metadata is known. */
    get duration(): number | undefined;
    get loop(): boolean;
    set loop(value: boolean);
    get volume(): number;
    set volume(value: number);
    get position3D(): Readonly<AudioVec3> | undefined;
    set position3D(value: Readonly<AudioVec3> | undefined);
    get playbackRate(): number;
    set playbackRate(value: number);
    /** Resolves once playback has started; rejects if the browser refuses (for example autoplay). */
    play(reason?: string): Promise<void>;
    pause(reason?: string): void;
    seek(seconds: number): void;
    stop(): void;
    private readonly onEnded;
    private readonly onError;
}
/** Waits until the element can play, rejecting on failure, abort or `stop`. */
export declare function whenPlayable(media: HTMLAudioElement, signal: AbortSignal | undefined, lifetime: AbortSignal): Promise<void>;
