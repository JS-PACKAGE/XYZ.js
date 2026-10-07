import { CanvasTexture2D } from './texture2d.js';
import type { MP4DemuxOptions } from './mp4-demux.js';
export interface VideoTextureOptions {
    /** Borrowed elements are not paused, unloaded, or removed on destroy. */
    ownVideo?: boolean;
    signal?: AbortSignal;
    timeoutMs?: number;
    onError?: (error: Error) => void;
}
export interface VideoTextureLoadOptions extends VideoTextureOptions {
    crossOrigin?: 'anonymous' | 'use-credentials';
    muted?: boolean;
    loop?: boolean;
}
/** One stable source for Sprite and 3D materials; owns its copied pixels, not consumers. */
export declare class VideoTexture extends CanvasTexture2D {
    private video;
    private ownVideo;
    private callback;
    private fallback;
    private readonly listeners;
    private abortSignal;
    private abortListener;
    private readonly observers;
    private readonly decoders;
    private lastTime;
    private errorValue;
    constructor(options?: Pick<VideoTextureOptions, 'onError'>);
    get lastError(): Error | undefined;
    get media(): HTMLVideoElement | undefined;
    onError(listener: (error: Error) => void): () => void;
    /** Consumes an externally decoded frame, closing it even when copying fails. */
    ingest(frame: VideoFrame): void;
    /** Waits for decoded pixels. requestVideoFrameCallback drives subsequent copies. */
    static fromVideo(video: HTMLVideoElement, options?: VideoTextureOptions): Promise<VideoTexture>;
    /** Browser media loading, not container demuxing for WebCodecs. CORS is set before src. */
    static load(url: string | URL, options?: VideoTextureLoadOptions): Promise<VideoTexture>;
    play(): Promise<void>;
    pause(): void;
    createDecoder(config: VideoDecoderConfig): Promise<VideoTextureDecoder>;
    private listen;
    private capture;
    private schedule;
    private cancelDelivery;
    /** Decoder errors are also observable through the owning source. */
    observe(error: unknown): void;
    destroy(): void;
}
/** Bounded WebCodecs adapter; the texture owns registered adapters and output frames. */
export declare class VideoTextureDecoder {
    private readonly texture;
    private decoder;
    private pending;
    private queuedBytes;
    private disposed;
    private scheduled;
    private errorValue;
    private constructor();
    /** Decode a bounded MP4 snapshot, not timed playback; caller owns the texture/input. */
    static fromMP4(texture: VideoTexture, bytes: Uint8Array, options?: MP4DemuxOptions): Promise<VideoTextureDecoder>;
    static create(texture: VideoTexture, config: VideoDecoderConfig): Promise<VideoTextureDecoder>;
    get lastError(): Error | undefined;
    get destroyed(): boolean;
    get decodeQueueSize(): number;
    /** Throws on backpressure; never retains an unbounded caller chunk queue. */
    decode(chunk: EncodedVideoChunk): void;
    flush(): Promise<void>;
    private fail;
    destroy(): void;
}
