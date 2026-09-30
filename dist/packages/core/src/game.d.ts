import { AssetLoader } from '../../assets/src/index.js';
import { InputManager } from '../../input/src/index.js';
import { AudioManager } from '../../audio/src/audio-manager.js';
import { type Renderer, type RendererPreference } from '../../graphics/src/index.js';
import { Scene } from './scene.js';
import { Clock } from './clock.js';
export interface GameOptions {
    canvas: string | HTMLCanvasElement;
    renderer?: RendererPreference;
    width?: number;
    height?: number;
    maxDeltaTime?: number;
    /** Defaults to devicePixelRatio capped at the engine's configured maximum. */
    pixelRatio?: number;
    /** Follow the canvas CSS content size. Enabled by default. */
    autoResize?: boolean;
}
export type GameState = 'idle' | 'running' | 'paused' | 'destroyed';
/** Browser runtime controller. GPU handles remain private to the renderer. */
export declare class Game extends EventTarget {
    readonly canvas: HTMLCanvasElement;
    readonly graphics: Renderer;
    readonly clock: Clock;
    readonly assets: AssetLoader;
    readonly input: InputManager;
    readonly audio: AudioManager;
    private currentState;
    private currentScene;
    private pendingScene;
    private pendingCompletion;
    private sceneVersion;
    private switchingScene;
    private requestId;
    private observer;
    private logicalWidth;
    private logicalHeight;
    private readonly fixedPixelRatio;
    private appliedPixelRatio;
    private fatalError;
    private appliedContain;
    private appliedIntrinsicSize;
    private readonly previousContain;
    private readonly previousIntrinsicSize;
    private readonly autoResize;
    private constructor();
    static create(options: GameOptions): Promise<Game>;
    get state(): GameState;
    get width(): number;
    get height(): number;
    get scene(): Scene | undefined;
    start(scene?: Scene): void;
    /** Prepare offscreen, then publish the candidate and synchronously release the old scene. */
    setScene(next: Scene): Promise<void>;
    /** @internal Called when a Scene is explicitly disposed by its owner. */
    onSceneDisposed(scene: Scene): void;
    pause(): void;
    resume(): void;
    resize(width: number, height: number): void;
    destroy(): void;
    private installLayout;
    private setIntrinsicSize;
    private validateSize;
    private contentSize;
    private resizeBacking;
    private cleanup;
    private readonly onVisibilityChange;
    private readonly onFrame;
    private fail;
}
