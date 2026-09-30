import type { Scene } from './scene.js';
/** Base facade for scene-owned objects, independent of 2D or 3D transforms. */
export declare abstract class SceneObject {
    private owningScene;
    private disposed;
    get scene(): Scene | undefined;
    get destroyed(): boolean;
    /** @internal Called only by Scene during registration. */
    attach(scene: Scene): void;
    /** @internal Called only by Scene during removal. */
    detach(scene: Scene): void;
    destroy(): void;
    protected onDestroy(): void;
}
