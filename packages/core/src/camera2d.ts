import { Vector2 } from '../../math/src/index.js';

/** Top-left-origin world-to-screen camera in logical pixels. */
export class Camera2D {
  readonly position = new Vector2();
  private currentZoom = 1;
  private width = 1280;
  private height = 720;

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
    const x = (point.x - this.position.x) * this.currentZoom;
    const y = (point.y - this.position.y) * this.currentZoom;
    return out.set(x, y);
  }

  screenToWorld(point: Vector2, out = new Vector2()): Vector2 {
    const x = point.x / this.currentZoom + this.position.x;
    const y = point.y / this.currentZoom + this.position.y;
    return out.set(x, y);
  }
}
