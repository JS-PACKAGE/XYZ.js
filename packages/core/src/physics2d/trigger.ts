import { GameObject } from '../game-object.js';
import { Collider2D } from './collider.js';
import type { CollisionDetail } from './world.js';

export interface TriggerOptions {
  filter?: (other: GameObject) => boolean;
  /** Accepted enters; default one. Use Infinity explicitly for unlimited enters. */
  repeat?: number;
  onEnter?: (other: GameObject) => void;
}

/** Static sensor facade using the same geometry and contact lifecycle as rigid bodies. */
export class Trigger2D extends GameObject {
  private remaining: number;
  private readonly accepted = new Set<GameObject>();

  constructor(collider: Collider2D, options: TriggerOptions = {}) {
    super();
    this.remaining = options.repeat ?? 1;
    if (
      this.remaining !== Infinity &&
      (!Number.isInteger(this.remaining) || this.remaining < 0)
    )
      throw new RangeError(
        'Trigger repeat must be a nonnegative integer or Infinity.',
      );
    const shape = new Collider2D(
      collider.kind,
      collider.radius,
      collider.vertices,
      { offset: [collider.offset.x, collider.offset.y] },
    );
    shape.sensor = true;
    shape.category = collider.category;
    shape.mask = this.remaining ? collider.mask : 0;
    this.collider = shape;
    this.addEventListener('collisionstart', (event) => {
      const other = (event as CustomEvent<CollisionDetail>).detail.other;
      if (
        !this.remaining ||
        this.accepted.has(other) ||
        (options.filter && !options.filter(other))
      )
        return;
      if (this.destroyed || other.destroyed) return;
      this.remaining--;
      this.accepted.add(other);
      this.dispatchEvent(
        new CustomEvent('triggerenter', { detail: { self: this, other } }),
      );
      if (!this.destroyed && !other.destroyed && this.accepted.has(other))
        options.onEnter?.(other);
    });
    this.addEventListener('collisionend', (event) => {
      const other = (event as CustomEvent<CollisionDetail>).detail.other;
      if (this.accepted.delete(other))
        this.dispatchEvent(
          new CustomEvent('triggerexit', { detail: { self: this, other } }),
        );
    });
  }
  get remainingRepeats(): number {
    return this.remaining;
  }
  protected override onDestroy(): void {
    this.accepted.clear();
  }
}
