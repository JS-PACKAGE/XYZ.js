import { defaults } from '../../../src/data/defaults.js';

/** A variable-step clock. Times are seconds; tick timestamps are milliseconds. */
export class Clock {
  readonly maxDeltaTime: number;
  private previous: number | undefined;
  private delta = 0;
  private elapsed = 0;
  private frames = 0;

  constructor(maxDeltaTime: number = defaults.maxDeltaTime) {
    if (!Number.isFinite(maxDeltaTime) || maxDeltaTime <= 0) {
      throw new RangeError(
        'Clock maxDeltaTime must be a finite positive number of seconds.',
      );
    }
    this.maxDeltaTime = maxDeltaTime;
  }

  get deltaTime(): number {
    return this.delta;
  }
  get elapsedTime(): number {
    return this.elapsed;
  }
  get frame(): number {
    return this.frames;
  }
  get fps(): number {
    return this.delta > 0 ? 1 / this.delta : 0;
  }

  tick(timestamp: number): void {
    if (!Number.isFinite(timestamp)) {
      throw new RangeError('Clock timestamp must be finite milliseconds.');
    }
    this.delta =
      this.previous === undefined
        ? 0
        : Math.min(
            this.maxDeltaTime,
            Math.max(0, (timestamp - this.previous) / 1000),
          );
    this.previous =
      this.previous === undefined
        ? timestamp
        : Math.max(this.previous, timestamp);
    this.elapsed += this.delta;
    this.frames++;
  }

  /** Suspend time accumulation without discarding elapsed gameplay time. */
  suspend(): void {
    this.previous = undefined;
    this.delta = 0;
  }

  reset(): void {
    this.suspend();
    this.elapsed = 0;
    this.frames = 0;
  }
}
