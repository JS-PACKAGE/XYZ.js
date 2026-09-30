import { Vector2 } from '../../math/src/index.js';
import {
  CameraController2D,
  type CameraBehavior2D,
  type CameraShakeOptions,
} from './camera2d-behaviors/index.js';
import type { ActionHandle, Easing } from './actions2d/index.js';

/** Top-left-origin world-to-screen camera in logical pixels. */
export class Camera2D {
  readonly position = new Vector2();
  /** Logical screen-pixel displacement; effects do not mutate the camera's focus. */
  readonly renderOffset = new Vector2();
  private currentZoom = 1;
  private width = 1280;
  private height = 720;
  private behaviorController: CameraController2D | undefined;
  private disposed = false;

  private get controller(): CameraController2D {
    if (this.disposed) throw new Error('Cannot control a destroyed Camera2D.');
    return (this.behaviorController ??= new CameraController2D(this));
  }
  addBehavior<T extends CameraBehavior2D>(behavior: T): T {
    return this.controller.addBehavior(behavior);
  }
  removeBehavior(behavior: CameraBehavior2D): boolean {
    return this.behaviorController?.removeBehavior(behavior) ?? false;
  }
  clearBehaviors(): void {
    this.behaviorController?.clearBehaviors();
  }
  moveTo(
    x: number,
    y: number,
    duration: number,
    easing?: Easing,
  ): ActionHandle {
    return this.controller.moveTo(x, y, duration, easing);
  }
  zoomTo(zoom: number, duration: number, easing?: Easing): ActionHandle {
    return this.controller.zoomTo(zoom, duration, easing);
  }
  shake(options: CameraShakeOptions): ActionHandle {
    return this.controller.shake(options);
  }
  /** @internal Applied after scene simulation, before final culling and rendering. */
  updateBehaviors(dt: number): void {
    this.behaviorController?.update(dt);
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.behaviorController?.destroy();
    this.renderOffset.set(0, 0);
  }

  get zoom(): number {
    return this.currentZoom;
  }

  set zoom(value: number) {
    if (!Number.isFinite(value) || value <= 0)
      throw new RangeError('Camera zoom must be a positive finite number.');
    this.currentZoom = value;
  }

  get viewportWidth(): number {
    return this.width;
  }

  get viewportHeight(): number {
    return this.height;
  }

  resize(width: number, height: number): void {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 0 ||
      height < 0
    )
      throw new RangeError(
        'Camera viewport dimensions must be finite, nonnegative numbers.',
      );
    this.width = width;
    this.height = height;
  }

  worldToScreen(point: Vector2, out = new Vector2()): Vector2 {
    const x =
      (point.x - this.position.x) * this.currentZoom + this.renderOffset.x;
    const y =
      (point.y - this.position.y) * this.currentZoom + this.renderOffset.y;
    return out.set(x, y);
  }

  screenToWorld(point: Vector2, out = new Vector2()): Vector2 {
    const x =
      (point.x - this.renderOffset.x) / this.currentZoom + this.position.x;
    const y =
      (point.y - this.renderOffset.y) / this.currentZoom + this.position.y;
    return out.set(x, y);
  }
}
