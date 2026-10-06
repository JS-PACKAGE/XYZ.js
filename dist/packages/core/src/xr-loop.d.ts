import type { Game } from './game.js';
import type { Scene } from './scene.js';
export interface XRLoopDriver {
    tick?: (timestamp: number) => void;
    render(scene: Scene | undefined): void;
    destroy(): void;
}
export declare const xrLoops: WeakMap<Game, XRLoopDriver>;
export declare function requestGameFrame(game: Game, callback: FrameRequestCallback): number | undefined;
