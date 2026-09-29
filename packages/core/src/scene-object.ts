import type { Scene } from './scene.js';

/** Base facade for scene-owned objects, independent of 2D or 3D transforms. */
export abstract class SceneObject {
  private owningScene: Scene | undefined;
  private disposed = false;

  get scene(): Scene | undefined {
    return this.owningScene;
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  /** @internal Called only by Scene during registration. */
  attach(scene: Scene): void {
    if (this.disposed) throw new Error('Cannot add a destroyed scene object.');
    if (this.owningScene)
      throw new Error('Scene object already belongs to a scene.');
    this.owningScene = scene;
  }

  /** @internal Called only by Scene during removal. */
  detach(scene: Scene): void {
    if (this.owningScene === scene) this.owningScene = undefined;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.owningScene?.remove(this);
    this.onDestroy();
  }

  protected onDestroy(): void {}
}
