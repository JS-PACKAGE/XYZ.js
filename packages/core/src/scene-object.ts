import type { Scene } from './scene.js';
import { observeObjectEventTypes } from './event-observers.js';

/** Base facade for scene-owned objects, independent of 2D or 3D transforms. */
export abstract class SceneObject extends EventTarget {
  private owningScene: Scene | undefined;
  private disposed = false;
  private observedEventTypes: Set<string> | undefined;
  private ownershipGeneration = 0;
  /** @internal Invalidates callback continuations on remove/re-add within the same Scene. */
  get registrationGeneration(): number {
    return this.ownershipGeneration;
  }

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, callback, options);
    if (callback && !(typeof options === 'object' && options.signal?.aborted)) {
      if (!this.observedEventTypes)
        observeObjectEventTypes(this, (this.observedEventTypes = new Set()));
      this.observedEventTypes.add(type);
    }
  }

  /** @internal Untouched pooled sprites need no lifecycle Event allocations. */
  dispatchObjectEvent(type: string, detail?: unknown): void {
    if (this.observedEventTypes?.has(type))
      this.dispatchEvent(new CustomEvent(type, { detail }));
  }
  /** @internal Update payloads are allocated only for objects observing lifecycle events. */
  emitUpdate(type: 'preupdate' | 'postupdate', dt: number): void {
    if (this.observedEventTypes?.has(type))
      this.dispatchEvent(new CustomEvent(type, { detail: { dt } }));
  }

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
    this.ownershipGeneration++;
  }

  /** @internal Called only by Scene during removal. */
  detach(scene: Scene): void {
    if (this.owningScene === scene) {
      this.owningScene = undefined;
      this.ownershipGeneration++;
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.owningScene?.remove(this);
    try {
      this.onDestroy();
    } finally {
      this.dispatchObjectEvent('destroy');
    }
  }

  protected onDestroy(): void {}
}
