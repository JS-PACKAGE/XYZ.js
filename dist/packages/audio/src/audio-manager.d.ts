import type { Scene } from '../../core/src/scene.js';
import { OPMAdapter, type OPMVoice } from './opm-adapter.js';
import type { LoadTask } from '../../assets/src/preload/preload-batch.js';
import { type SampleAudioAsset } from './samples/sample-audio.js';
import type { AudioListenerState } from './samples/spatial.js';
import type { AudioStream, AudioStreamOptions } from './samples/stream.js';
export type AudioChannelName = 'music' | 'sfx' | 'ui';
export interface AudioNote {
    readonly note: number;
    readonly time: number;
    readonly duration: number;
}
export interface AudioPlayOptions {
    channel?: AudioChannelName;
    scene?: Scene;
    persistent?: boolean;
    loop?: boolean;
}
/** A gain control shared by every playing voice in its channel. */
export declare class AudioChannel {
    readonly name: AudioChannelName | 'master';
    private readonly refresh;
    private level;
    constructor(name: AudioChannelName | 'master', refresh: () => void);
    get volume(): number;
    set volume(value: number);
}
/** Loaded voice and note data are immutable; only playback defaults may change. */
export declare class AudioAsset {
    private readonly manager;
    readonly voice: OPMVoice;
    readonly notes: readonly AudioNote[];
    readonly duration: number;
    readonly channel: AudioChannelName;
    loop: boolean;
    persistent: boolean;
    /** @internal Reservation expiry includes the longest operator release. */
    readonly releaseTime: number;
    constructor(manager: AudioManager, voice: OPMVoice, notes: readonly AudioNote[], duration: number, channel: AudioChannelName, loop: boolean);
    play(options?: AudioPlayOptions): AudioPlayback;
    stop(): void;
    /** @internal */
    belongsTo(manager: AudioManager): boolean;
}
export declare class AudioPlayback {
    private readonly manager;
    private status;
    constructor(manager: AudioManager);
    get state(): 'playing' | 'stopped' | 'ended';
    stop(): void;
    /** @internal */
    finish(state: 'stopped' | 'ended'): void;
}
/** Schedules a bounded lookahead; each slot owns an independent OPM voice. */
export declare class AudioManager {
    private readonly getScene;
    private readonly onError;
    readonly master: AudioChannel;
    readonly music: AudioChannel;
    readonly sfx: AudioChannel;
    readonly ui: AudioChannel;
    private readonly adapter;
    private readonly samples;
    private readonly cache;
    private readonly playbacks;
    private readonly slots;
    private timer;
    private disposed;
    private sequence;
    private readonly pauseReasons;
    private pausedAt;
    private pausedTotal;
    constructor(getScene: () => Scene | undefined, onError: (error: Error) => void);
    /** Manager-wide 3D listener used by playbacks created with `spatial` options. */
    get listener(): AudioListenerState;
    get unlocked(): boolean;
    /** True while at least one pause reason is active (see {@link pause}). */
    get paused(): boolean;
    /**
     * Freezes audio under a named reason (default `user`); it stays frozen until every reason has
     * been {@link resume}d. OPM tracks stop sounding and their timeline stops, then continue at the
     * next note; a note that was sounding when paused is not replayed. Sample and stream playbacks
     * pause at their current position and resume together, and playbacks started while paused wait
     * for the resume.
     */
    pause(reason?: string): void;
    resume(reason?: string): void;
    /** Audio-timeline seconds: wall time minus every paused interval. */
    private clock;
    get opm(): OPMAdapter['opm'];
    unlock(): Promise<void>;
    /** Subscriber cancellation does not abort another caller's loader-owned cache request. */
    load(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<AudioAsset>;
    opmTask(key: string, url: string): LoadTask<AudioAsset>;
    loadSample(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<SampleAudioAsset>;
    /** Streams a long file without decoding it; see {@link AudioStream}. */
    stream(url: string, options?: AudioStreamOptions): Promise<AudioStream>;
    sampleTask(key: string, url: string): LoadTask<SampleAudioAsset>;
    play(asset: AudioAsset, options?: AudioPlayOptions): AudioPlayback;
    stopScene(scene: Scene): void;
    /** @internal */
    stopAsset(asset: AudioAsset): void;
    /** @internal Scene teardown resets queued events, whereas manual stop retains the audible release. */
    stopPlayback(playback: AudioPlayback, immediate?: boolean): void;
    destroy(): void;
    private fetchAudio;
    private tick;
    private schedule;
    private reserve;
    private gain;
    private refreshGains;
    private stopIdleTimer;
    private report;
}
