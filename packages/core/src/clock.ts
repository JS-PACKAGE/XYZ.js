import { defaults } from '../../../src/data/defaults.js';

/** A variable-step clock. Times are seconds; tick timestamps are milliseconds. */
export class Clock {
  readonly maxDeltaTime: number;
  private previous: number | undefined;
  private delta = 0;
  private frameInterval = 0;
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
    return this.frameInterval > 0 ? 1 / this.frameInterval : 0;
  }

  tick(timestamp: number): void {
    if (!Number.isFinite(timestamp)) {
      throw new RangeError('Clock timestamp must be finite milliseconds.');
    }
    this.frameInterval =
      this.previous === undefined
        ? 0
        : Math.max(0, (timestamp - this.previous) / 1000);
    this.delta = Math.min(this.maxDeltaTime, this.frameInterval);
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
    this.frameInterval = 0;
  }

  reset(): void {
    this.suspend();
    this.elapsed = 0;
    this.frames = 0;
  }
}
