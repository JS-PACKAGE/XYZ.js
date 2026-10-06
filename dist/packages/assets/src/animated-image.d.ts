import { CanvasTexture2D, type TextureRect2D } from './texture2d.js';
export interface AnimatedImageOptions {
    /** Total plays, including the first; Infinity repeats forever. Defaults to file metadata. */
    plays?: number;
    signal?: AbortSignal;
}
/** Simulation-time clock; no RAF, wall-clock accumulation or per-update allocation. */
export declare class AnimatedImageTimeline {
    readonly durations: readonly number[];
    readonly duration: number;
    readonly plays: number;
    private elapsed;
    private index;
    private active;
    private finished;
    constructor(durations: readonly number[], plays?: number);
    get frame(): number;
    get playing(): boolean;
    get ended(): boolean;
    pause(): void;
    play(): void;
    reset(): void;
    update(deltaSeconds: number): number;
}
export interface AnimatedImageAtlas {
    readonly texture: CanvasTexture2D;
    readonly frames: readonly Readonly<TextureRect2D>[];
    readonly durations: readonly number[];
    /** Atlas owns only its texture; SpriteSheet and consumers borrow it. */
    destroy(): void;
}
/** GIF/APNG decoded exclusively by ImageDecoder, which supplies fully composited/disposed frames. */
export declare class AnimatedImageTexture extends CanvasTexture2D {
    private readonly snapshots;
    private readonly timeline;
    private constructor();
    get frame(): number;
    get durations(): readonly number[];
    get plays(): number;
    get duration(): number;
    get playing(): boolean;
    get ended(): boolean;
    /** Copies input bytes before decoding; caller retains its input. All decoded VideoFrames close immediately. */
    static decode(data: Uint8Array, type: 'image/gif' | 'image/png', options?: AnimatedImageOptions): Promise<AnimatedImageTexture>;
    private live;
    updateAnimation(deltaSeconds: number): void;
    play(): void;
    pause(): void;
    reset(): void;
    /** Independent owned atlas; pass texture/frames to SpriteSheet and durations to FrameAnimation. */
    createAtlas(): AnimatedImageAtlas;
    destroy(): void;
}
