import type { Scene } from '../../core/src/scene.js';
import { Sprite } from '../../core/src/sprite.js';
import type { GraphicsBackend } from './index.js';
import type { ColorRGBA } from '../../core/src/gameplay/contracts.js';
export interface RenderSnapshot {
    readonly backend: GraphicsBackend;
    readonly width: number;
    readonly height: number;
    readonly destroyed: boolean;
    destroy(): void;
}
export interface TransitionFrame {
    kind: 'fade' | 'crossfade' | 'slide';
    progress: number;
    snapshot?: RenderSnapshot;
    color: ColorRGBA;
    direction: 'left' | 'right' | 'up' | 'down';
}
export interface FrameEffects {
    transition?: TransitionFrame;
}
/** Shared, allocation-free collection in logical pixels with conservative affine culling. */
export declare function collectSprites2D(scene: Scene, width: number, height: number, out: Sprite[]): void;
