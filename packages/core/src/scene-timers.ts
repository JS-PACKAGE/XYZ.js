export interface TimerHandle {
  readonly active: boolean;
  cancel(): void;
}

class TimerTask implements TimerHandle {
  constructor(
    readonly id: number,
    public due: number,
    readonly interval: number,
    public callback: (() => void) | undefined,
    private tasks: Set<TimerTask> | undefined,
  ) {}

  get active(): boolean {
    return this.callback !== undefined;
  }

  cancel(): void {
    this.callback = undefined;
    this.tasks?.delete(this);
    this.tasks = undefined;
  }
}

/** Scene-local simulation seconds, never wall time. */
export class SceneTimers {
  private readonly tasks = new Set<TimerTask>();
  private time = 0;
  private nextId = 0;
  private disposed = false;
  private updating = false;

  after(delay: number, callback: () => void): TimerHandle {
    return this.schedule(delay, 0, callback);
  }

  /** At most one invocation per frame; skipped periods do not accumulate a burst. */
  every(interval: number, callback: () => void): TimerHandle {
    if (!Number.isFinite(interval) || interval <= 0)
      throw new RangeError('Timer interval must be positive and finite.');
    return this.schedule(interval, interval, callback);
  }

  /** @internal Game advances timers before Scene.update; nested advancement is invalid. */
  update(deltaTime: number): void {
    if (this.disposed) return;
    if (this.updating)
      throw new Error('Cannot recursively update SceneTimers.');
    if (
      !Number.isFinite(deltaTime) ||
      deltaTime < 0 ||
      !Number.isFinite(this.time + deltaTime)
    )
      throw new RangeError('Timer delta must be finite and nonnegative.');
    this.time += deltaTime;
    const lastId = this.nextId;
    this.updating = true;
    try {
      for (const task of this.tasks) {
        // Set iteration can see appended entries: defer those to the next tick.
        if (task.id > lastId) break;
        if (task.due > this.time) continue;
        const callback = task.callback!;
        if (task.interval === 0) task.cancel();
        else
          task.due =
            this.time +
            task.interval -
            ((this.time - task.due) % task.interval);
        callback();
      }
    } finally {
      this.updating = false;
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const task of this.tasks) task.cancel();
  }

  private schedule(
    delay: number,
    interval: number,
    callback: () => void,
  ): TimerHandle {
    if (this.disposed)
      throw new Error('Cannot schedule on destroyed SceneTimers.');
    if (
      !Number.isFinite(delay) ||
      delay < 0 ||
      !Number.isFinite(this.time + delay)
    )
      throw new RangeError('Timer delay must be finite and nonnegative.');
    if (typeof callback !== 'function')
      throw new TypeError('Timer callback must be a function.');
    const task = new TimerTask(
      ++this.nextId,
      this.time + delay,
      interval,
      callback,
      this.tasks,
    );
    this.tasks.add(task);
    return task;
  }
}
