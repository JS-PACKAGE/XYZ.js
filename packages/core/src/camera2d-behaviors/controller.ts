import type { Camera2D } from '../camera2d.js';
import { Vector2 } from '../../../math/src/index.js';
import {
  ActionQueue,
  Actions,
  type ActionHandle,
  type ActionOwner,
  type Easing,
} from '../actions2d/index.js';
import { validateTime } from '../actions2d/actions.js';
import type { CameraBehavior2D } from './strategies.js';
import { actions2dLimits } from '../../../../src/data/actions2d.js';

export interface CameraShakeOptions {
  duration: number;
  amplitude: readonly [number, number];
  frequency?: number;
  seed?: number;
}
interface BehaviorEntry {
  behavior: CameraBehavior2D;
  serial: number;
}

// Integer hashing gives the same noise at a given time, independent of dt partition.
function noise(seed: number, index: number, axis: number): number {
  let value = (seed ^ Math.imul(index, 0x9e3779b1) ^ axis) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return (((value ^ (value >>> 15)) >>> 0) / 0xffffffff) * 2 - 1;
}

/** Camera2D delegates lazily; motion, zoom and shake have independent FIFO channels. */
export class CameraController2D extends EventTarget implements ActionOwner {
  readonly scale = new Vector2(1, 1);
  rotation = 0;
  opacity = 1;
  private disposed = false;
  private motion?: ActionQueue;
  private zooming?: ActionQueue;
  private shaking?: ActionQueue;
  private readonly behaviors: (BehaviorEntry | undefined)[] = [];
  private serial = 0;
  private updating = false;
  private shakeTime = { elapsed: 0 };
  private shakeOptions?: Required<CameraShakeOptions>;
  private shakeHandle?: ActionHandle;

  constructor(readonly camera: Camera2D) {
    super();
  }
  get position(): Vector2 {
    return this.camera.position;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  addBehavior<T extends CameraBehavior2D>(behavior: T): T {
    if (this.disposed) throw new Error('Camera controller is destroyed.');
    if (typeof behavior.update !== 'function')
      throw new TypeError('Camera behavior needs an update method.');
    if (!this.behaviors.some((entry) => entry?.behavior === behavior))
      this.behaviors.push({ behavior, serial: ++this.serial });
    return behavior;
  }
  removeBehavior(behavior: CameraBehavior2D): boolean {
    const index = this.behaviors.findIndex(
      (entry) => entry?.behavior === behavior,
    );
    if (index < 0) return false;
    this.behaviors[index] = undefined;
    behavior.destroy?.();
    return true;
  }
  clearBehaviors(): void {
    const entries = this.behaviors.splice(0);
    const errors: unknown[] = [];
    for (const entry of entries) {
      try {
        entry?.behavior.destroy?.();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Camera behavior cleanup failed.');
  }
  moveTo(
    x: number,
    y: number,
    duration: number,
    easing?: Easing,
  ): ActionHandle {
    return (this.motion ??= new ActionQueue(this)).run(
      Actions.moveTo(x, y, duration, easing),
    );
  }
  zoomTo(zoom: number, duration: number, easing?: Easing): ActionHandle {
    if (!Number.isFinite(zoom) || zoom <= 0)
      throw new RangeError('Camera zoom must be finite and positive.');
    return (this.zooming ??= new ActionQueue(this)).run(
      Actions.tween(this.camera, { zoom }, duration, easing),
    );
  }
  shake(options: CameraShakeOptions): ActionHandle {
    validateTime(options.duration);
    const frequency = options.frequency ?? 30;
    const seed = options.seed ?? 0;
    if (
      !Number.isFinite(frequency) ||
      frequency <= 0 ||
      !Number.isSafeInteger(seed) ||
      !Number.isFinite(options.duration * frequency) ||
      options.duration * frequency > actions2dLimits.shakeSamples ||
      options.amplitude.length !== 2 ||
      options.amplitude.some((value) => !Number.isFinite(value) || value < 0)
    )
      throw new RangeError(
        'Shake requires nonnegative finite amplitude, positive finite frequency and an integer seed; sample count is bounded to uint32.',
      );
    if (this.disposed) throw new Error('Camera controller is destroyed.');
    this.shaking ??= new ActionQueue(this);
    this.shaking.clear();
    this.camera.renderOffset.set(0, 0);
    this.shakeTime = { elapsed: 0 };
    this.shakeOptions = {
      duration: options.duration,
      amplitude: [options.amplitude[0], options.amplitude[1]],
      frequency,
      seed,
    };
    const handle = this.shaking.run(
      Actions.tween(
        this.shakeTime,
        { elapsed: options.duration },
        options.duration,
      ),
    );
    this.shakeHandle = handle;
    return {
      get state() {
        return handle.state;
      },
      finished: handle.finished,
      cancel: () => {
        handle.cancel();
        if (this.shakeHandle === handle) {
          this.shakeOptions = undefined;
          this.camera.renderOffset.set(0, 0);
        }
      },
    };
  }
  update(dt: number): void {
    validateTime(dt, 'delta time');
    if (this.disposed || this.updating) return;
    this.updating = true;
    const boundary = this.serial;
    try {
      this.motion?.update(dt);
      if (this.disposed) return;
      this.zooming?.update(dt);
      for (let i = 0; i < this.behaviors.length && !this.disposed; i++) {
        const entry = this.behaviors[i];
        if (entry && entry.serial <= boundary)
          entry.behavior.update(this.camera, dt);
      }
      if (this.disposed) return;
      this.shaking?.update(dt);
      const options = this.shakeOptions;
      if (
        !options ||
        this.shakeHandle?.state === 'cancelled' ||
        this.shakeHandle?.state === 'completed'
      ) {
        this.camera.renderOffset.set(0, 0);
        return;
      }
      const time = this.shakeTime.elapsed * options.frequency;
      const index = Math.floor(time);
      const fraction = time - index;
      const weight = fraction * fraction * (3 - 2 * fraction);
      const decay = 1 - this.shakeTime.elapsed / options.duration;
      const x =
        noise(options.seed, index, 0x68bc21eb) * (1 - weight) +
        noise(options.seed, index + 1, 0x68bc21eb) * weight;
      const y =
        noise(options.seed, index, 0x02e5be93) * (1 - weight) +
        noise(options.seed, index + 1, 0x02e5be93) * weight;
      this.camera.renderOffset.set(
        x * options.amplitude[0] * decay,
        y * options.amplitude[1] * decay,
      );
    } finally {
      this.updating = false;
      // Compact tombstones in place without changing execution order or allocating.
      let write = 0;
      for (const entry of this.behaviors)
        if (entry) this.behaviors[write++] = entry;
      this.behaviors.length = write;
    }
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.motion?.destroy();
    this.zooming?.destroy();
    this.shaking?.destroy();
    this.shakeOptions = undefined;
    this.camera.renderOffset.set(0, 0);
    this.clearBehaviors();
  }
}
