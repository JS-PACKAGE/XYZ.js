import { Easings, type Easing } from './actions2d/easings.js';

export type TweenEasing = Easing | keyof typeof Easings;

export interface TweenOptions {
  /** Seconds of one pass. */
  duration: number;
  /** Seconds before the first pass starts. */
  delay?: number;
  easing?: TweenEasing;
  /** Extra passes after the first; `Infinity` repeats forever. Default 0. */
  repeat?: number;
  /** Alternate passes run backwards. */
  yoyo?: boolean;
  onStart?: (tween: Tween) => void;
  onUpdate?: (tween: Tween) => void;
  onComplete?: (tween: Tween) => void;
}

/** Anything a {@link Timeline} can schedule: it renders its state for a local time. */
export interface Tweenable {
  /** Seconds until it is finished; `Infinity` when it repeats forever. */
  readonly totalDuration: number;
  /** Applies the state at `time` seconds from its own start (clamped to its span). */
  seek(time: number): void;
  /** Returns to the state before it first ran, restoring anything it changed. */
  reset(): void;
}

interface Property {
  readonly parent: Record<string, unknown>;
  readonly key: string;
  /** The value the caller gave: the destination for `to`, the origin for `from`. */
  readonly value: number;
  start: number;
  end: number;
}

function nonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${label} must be finite and nonnegative.`);
  return value;
}

function resolveEasing(easing: TweenEasing | undefined): Easing {
  if (easing === undefined) return Easings.linear;
  if (typeof easing === 'function') return easing;
  const found = Easings[easing];
  if (typeof found !== 'function')
    throw new RangeError(`Unknown easing "${String(easing)}".`);
  return found;
}

/** Resolves `a.b.c` to the object holding `c` and checks the value is a finite number. */
function locate(
  target: object,
  path: string,
): { parent: Record<string, unknown>; key: string } {
  const parts = path.split('.');
  let parent = target as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = parent[parts[i]!];
    if (next === null || typeof next !== 'object')
      throw new TypeError(`Tween path "${path}" does not lead to an object.`);
    parent = next as Record<string, unknown>;
  }
  const key = parts[parts.length - 1]!;
  if (typeof parent[key] !== 'number' || !Number.isFinite(parent[key]))
    throw new TypeError(
      `Tween property "${path}" must currently be a finite number.`,
    );
  return { parent, key };
}

/**
 * Animates numeric properties of any object, including nested ones such as `'position.x'`.
 * Start values are read when the tween first runs, so chained tweens continue from where the
 * previous one ended; rewinding restores them. A tween can run on its own through
 * {@link TweenGroup}, or be scheduled on a {@link Timeline}.
 */
export class Tween implements Tweenable {
  readonly duration: number;
  readonly delay: number;
  readonly repeat: number;
  readonly yoyo: boolean;
  timeScale = 1;
  playing = false;
  private readonly properties: Property[] = [];
  private readonly easing: Easing;
  private readonly options: TweenOptions;
  private readonly reverse: boolean;
  private captured = false;
  private started = false;
  private finished = false;
  private clock = 0;

  private constructor(
    private readonly target: object,
    values: Readonly<Record<string, number>>,
    options: TweenOptions,
    from: boolean,
  ) {
    this.options = options;
    this.duration = nonnegative(options.duration, 'Tween duration');
    this.delay = nonnegative(options.delay ?? 0, 'Tween delay');
    const repeat = options.repeat ?? 0;
    if (repeat !== Infinity && (!Number.isInteger(repeat) || repeat < 0))
      throw new RangeError(
        'Tween repeat must be a nonnegative integer or Infinity.',
      );
    this.repeat = repeat;
    this.yoyo = options.yoyo ?? false;
    this.easing = resolveEasing(options.easing);
    this.reverse = from;
    const entries = Object.entries(values);
    if (!entries.length)
      throw new RangeError('A tween needs at least one property.');
    for (const [path, value] of entries) {
      if (!Number.isFinite(value))
        throw new RangeError(`Tween value for "${path}" must be finite.`);
      const { parent, key } = locate(target, path);
      this.properties.push({ parent, key, value, start: 0, end: value });
    }
  }

  /** Tweens from the properties' current values to `values`. */
  static to(
    target: object,
    values: Readonly<Record<string, number>>,
    options: TweenOptions,
  ): Tween {
    return new Tween(target, values, options, false);
  }

  /** Tweens from `values` to the properties' current values. */
  static from(
    target: object,
    values: Readonly<Record<string, number>>,
    options: TweenOptions,
  ): Tween {
    return new Tween(target, values, options, true);
  }

  get totalDuration(): number {
    return this.delay + this.duration * (this.repeat + 1);
  }

  /** Seconds this tween has run, including the delay. */
  get time(): number {
    return this.clock;
  }

  get completed(): boolean {
    return this.finished;
  }

  play(): this {
    if (this.finished) this.reset();
    this.playing = true;
    return this;
  }

  pause(): this {
    this.playing = false;
    return this;
  }

  /** Stops and restores the start values if the tween ever ran. */
  stop(): this {
    this.playing = false;
    this.reset();
    return this;
  }

  /** Advances by `delta` seconds; returns true while the tween still has time left. */
  update(delta: number): boolean {
    if (!this.playing) return !this.finished;
    nonnegative(delta, 'Tween delta');
    if ((this.target as { destroyed?: boolean }).destroyed === true) {
      this.playing = false;
      this.finished = true;
      return false;
    }
    this.seek(this.clock + delta * this.timeScale);
    return !this.finished;
  }

  seek(time: number): void {
    if (!Number.isFinite(time))
      throw new RangeError('Tween time must be finite.');
    const total = this.totalDuration;
    const local = Math.max(0, Math.min(time, total));
    this.clock = local;
    if (local < this.delay) {
      // Rewinding before the delay puts the properties back where they started.
      if (this.started) this.restore();
      this.finished = false;
      return;
    }
    if (!this.captured) this.capture();
    if (!this.started) {
      this.started = true;
      this.options.onStart?.(this);
    }
    const elapsed = local - this.delay;
    let progress: number;
    if (this.duration === 0) progress = 1;
    else {
      const passes = this.repeat + 1;
      const pass = Math.min(Math.floor(elapsed / this.duration), passes - 1);
      progress = Math.min(1, (elapsed - pass * this.duration) / this.duration);
      if (this.yoyo && pass % 2 === 1) progress = 1 - progress;
    }
    this.write(progress);
    this.options.onUpdate?.(this);
    if (local >= total && Number.isFinite(total)) {
      if (!this.finished) {
        this.finished = true;
        this.playing = false;
        this.options.onComplete?.(this);
      }
    } else this.finished = false;
  }

  private capture(): void {
    for (const property of this.properties) {
      const current = property.parent[property.key];
      if (typeof current !== 'number' || !Number.isFinite(current))
        throw new TypeError(
          `Tween property "${property.key}" is no longer a finite number.`,
        );
      property.start = this.reverse ? property.value : current;
      property.end = this.reverse ? current : property.value;
    }
    this.captured = true;
  }

  /** Puts every property back to the value it had before the tween first ran. */
  private restore(): void {
    for (const property of this.properties)
      property.parent[property.key] = this.reverse
        ? property.end
        : property.start;
  }

  private write(progress: number): void {
    const eased = this.easing(progress);
    for (const property of this.properties)
      property.parent[property.key] =
        property.start + (property.end - property.start) * eased;
  }

  /** Restores the start values if the tween ever ran; they are read again on the next run. */
  reset(): void {
    if (this.started) this.restore();
    this.clock = 0;
    this.started = false;
    this.finished = false;
    this.captured = false;
  }
}

interface Entry {
  readonly item: Tweenable | undefined;
  readonly start: number;
  readonly call: (() => void) | undefined;
}

export interface TimelineOptions {
  /** Extra passes after the first; `Infinity` repeats forever. Default 0. */
  repeat?: number;
  onComplete?: (timeline: Timeline) => void;
}

/**
 * Places tweens (or other timelines) and callbacks on a shared clock. Items are positioned with
 * `add`/`then`/`call`, optionally by label, and the timeline can be played, paused, sought and
 * time-scaled. It is itself {@link Tweenable}, so timelines nest.
 */
export class Timeline implements Tweenable {
  timeScale = 1;
  playing = false;
  private readonly entries: Entry[] = [];
  private readonly labels = new Map<string, number>();
  /** Items the playhead has reached since the last reset. */
  private readonly touched = new Set<Entry>();
  private readonly repeat: number;
  private readonly onComplete: ((timeline: Timeline) => void) | undefined;
  private cursor = 0;
  private clock = 0;
  /** Absolute time up to which callbacks have run; -1 so a callback at 0 still fires. */
  private fired = -1;
  private finished = false;

  constructor(options: TimelineOptions = {}) {
    const repeat = options.repeat ?? 0;
    if (repeat !== Infinity && (!Number.isInteger(repeat) || repeat < 0))
      throw new RangeError(
        'Timeline repeat must be a nonnegative integer or Infinity.',
      );
    this.repeat = repeat;
    this.onComplete = options.onComplete;
  }

  /** Length of one pass: the end of the last item. */
  get duration(): number {
    return this.cursor;
  }

  get totalDuration(): number {
    return this.cursor * (this.repeat + 1);
  }

  get time(): number {
    return this.clock;
  }

  get completed(): boolean {
    return this.finished;
  }

  /** Names a time (default: the current end) for use as `add(item, 'name')`. */
  label(name: string, at: number = this.cursor): this {
    this.labels.set(name, nonnegative(at, 'Label time'));
    return this;
  }

  /** Adds `item` at a time, a label (plus `offset`), or the current end. Items may overlap. */
  add(item: Tweenable, at?: number | string, offset = 0): this {
    const start = this.position(at, offset);
    this.entries.push({ item, start, call: undefined });
    this.cursor = Math.max(this.cursor, start + item.totalDuration);
    if (!Number.isFinite(this.cursor))
      throw new RangeError(
        'A timeline cannot contain an endlessly repeating item.',
      );
    return this;
  }

  /** Adds `item` after everything so far, `gap` seconds later. */
  then(item: Tweenable, gap = 0): this {
    return this.add(item, this.cursor + nonnegative(gap, 'Gap'));
  }

  /** Runs `callback` when playback passes `at` (default: the end); seeking does not run it. */
  call(callback: () => void, at?: number | string, offset = 0): this {
    const start = this.position(at, offset);
    this.entries.push({ item: undefined, start, call: callback });
    this.cursor = Math.max(this.cursor, start);
    return this;
  }

  play(): this {
    if (this.finished) this.reset();
    this.playing = true;
    return this;
  }

  pause(): this {
    this.playing = false;
    return this;
  }

  /** Stops and rewinds every item to its start. */
  stop(): this {
    this.playing = false;
    this.reset();
    return this;
  }

  update(delta: number): boolean {
    if (!this.playing) return !this.finished;
    nonnegative(delta, 'Timeline delta');
    const next = this.clock + delta * this.timeScale;
    this.advance(next);
    return !this.finished;
  }

  seek(time: number): void {
    if (!Number.isFinite(time))
      throw new RangeError('Timeline time must be finite.');
    const total = this.totalDuration;
    const local = Math.max(0, Math.min(time, total));
    this.clock = local;
    this.render(local);
    this.finished = Number.isFinite(total) && local >= total && total > 0;
    this.fired = local;
  }

  private advance(next: number): void {
    const total = this.totalDuration;
    const local = Math.max(0, Math.min(next, total));
    this.clock = local;
    this.render(local);
    this.fireCallbacks(local);
    if (Number.isFinite(total) && local >= total) {
      this.finished = true;
      this.playing = false;
      this.onComplete?.(this);
    }
  }

  private render(clock: number): void {
    const length = this.cursor;
    // Repeats replay the same span; the pass boundary itself belongs to the finished pass.
    const pass =
      length > 0 ? Math.min(Math.floor(clock / length), this.repeat) : 0;
    const local = Math.min(clock - pass * length, length);
    // Items the playhead is before are put back first (latest first), so an earlier item's
    // restored values are never overwritten by a later one's.
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i]!;
      if (entry.item && local < entry.start && this.touched.delete(entry))
        entry.item.reset();
    }
    for (const entry of this.entries) {
      if (!entry.item || local < entry.start) continue;
      this.touched.add(entry);
      entry.item.seek(Math.min(local - entry.start, entry.item.totalDuration));
    }
  }

  /** Runs callbacks whose absolute time, in any pass, lies in (fired, next]. */
  private fireCallbacks(next: number): void {
    const length = this.cursor;
    const firstPass =
      length > 0 ? Math.floor(Math.max(this.fired, 0) / length) : 0;
    const lastPass =
      length > 0 ? Math.min(Math.floor(next / length), this.repeat) : 0;
    for (let pass = firstPass; pass <= lastPass; pass++)
      for (const entry of this.entries) {
        if (!entry.call) continue;
        const at = pass * length + entry.start;
        if (at > this.fired && at <= next) entry.call();
      }
    this.fired = next;
  }

  /** Rewinds to the start, undoing what every item changed. */
  reset(): void {
    this.clock = 0;
    this.fired = -1;
    this.finished = false;
    this.touched.clear();
    for (const entry of [...this.entries].reverse()) entry.item?.reset();
  }

  private position(at: number | string | undefined, offset: number): number {
    if (!Number.isFinite(offset))
      throw new RangeError('Offset must be finite.');
    let base: number;
    if (at === undefined) base = this.cursor;
    else if (typeof at === 'string') {
      const found = this.labels.get(at);
      if (found === undefined)
        throw new RangeError(`Unknown timeline label "${at}".`);
      base = found;
    } else base = nonnegative(at, 'Timeline position');
    return nonnegative(base + offset, 'Timeline position');
  }
}

/** Owns running tweens and timelines and advances them together; `scene.tweens` is one. */
export class TweenGroup {
  private readonly running = new Set<Tween | Timeline>();
  private disposed = false;

  get size(): number {
    return this.running.size;
  }

  /** Starts `item` (a Tween or Timeline) and keeps updating it until it finishes. */
  add<T extends Tween | Timeline>(item: T): T {
    if (this.disposed) throw new Error('TweenGroup is destroyed.');
    this.running.add(item);
    item.play();
    return item;
  }

  to(
    target: object,
    values: Readonly<Record<string, number>>,
    options: TweenOptions,
  ): Tween {
    return this.add(Tween.to(target, values, options));
  }

  from(
    target: object,
    values: Readonly<Record<string, number>>,
    options: TweenOptions,
  ): Tween {
    return this.add(Tween.from(target, values, options));
  }

  remove(item: Tween | Timeline): boolean {
    return this.running.delete(item);
  }

  update(delta: number): void {
    if (this.disposed) return;
    nonnegative(delta, 'Tween delta');
    for (const item of [...this.running]) {
      if (!this.running.has(item)) continue;
      if (!item.update(delta) && !item.playing) this.running.delete(item);
    }
  }

  /** Drops every item without finishing it, leaving properties where they are. */
  clear(): void {
    this.running.clear();
  }

  destroy(): void {
    this.disposed = true;
    this.running.clear();
  }
}
