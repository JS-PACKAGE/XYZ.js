import { storageLimits } from '../../../src/data/storage.js';
import type { JsonValue, SaveManager, SaveRecord } from './storage.js';

export type AutosaveStatus =
  'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'cancelled' | 'destroyed';
export interface AutosaveState {
  readonly status: AutosaveStatus;
  readonly pendingChanges: boolean;
  readonly revision: number | null;
  readonly error: unknown | null;
  readonly retryRequired: boolean;
}
export interface AutosaveOptions {
  readonly slot: string;
  /** Capture synchronously so a snapshot cannot cross a scene publication barrier. */
  readonly capture: () => JsonValue;
  readonly playTime?: () => number;
  readonly intervalMs?: number;
  readonly signal?: AbortSignal;
  readonly onState?: (state: AutosaveState) => void;
}

/** Opt-in autosave. Failed attempts stop scheduling until the player explicitly retries.
 * `change` is a CustomEvent<AutosaveState>; state can drive both visible UI and live regions. */
export class AutosaveController extends EventTarget {
  private current: AutosaveState = Object.freeze({
    status: 'idle',
    pendingChanges: false,
    revision: null,
    error: null,
    retryRequired: false,
  });
  private readonly intervalMs: number;
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private savedGeneration = 0;
  private epoch = 0;
  private disposed = false;
  private active?: Promise<SaveRecord | null>;
  private controller?: AbortController;
  private drain = false;
  private readonly ownerAbort = () => this.destroy();
  private readonly notify?: EventListener;

  constructor(
    private readonly saves: SaveManager,
    private readonly options: AutosaveOptions,
  ) {
    super();
    this.intervalMs = options.intervalMs ?? storageLimits.autosaveIntervalMs;
    if (
      !Number.isFinite(this.intervalMs) ||
      this.intervalMs < 0 ||
      this.intervalMs > 2_147_483_647
    )
      throw new RangeError(
        'Autosave interval must be a finite, nonnegative timer duration.',
      );
    if (!options.slot) throw new TypeError('Autosave slot must be nonempty.');
    if (options.onState) {
      const listener = options.onState;
      this.notify = (event) => {
        // This listener only receives the typed change event dispatched by publish().
        const change = event as CustomEvent<AutosaveState>;
        listener(change.detail);
      };
      this.addEventListener('change', this.notify);
    }
    options.signal?.addEventListener('abort', this.ownerAbort, { once: true });
    if (options.signal?.aborted) this.destroy();
  }
  get state(): AutosaveState {
    return this.current;
  }
  private publish(
    status: AutosaveStatus,
    error: unknown | null = null,
    revision = this.current.revision,
  ): void {
    this.current = Object.freeze({
      status,
      error,
      revision,
      pendingChanges: this.generation !== this.savedGeneration,
      retryRequired: status === 'error',
    });
    this.dispatchEvent(
      new CustomEvent<AutosaveState>('change', { detail: this.current }),
    );
  }
  private assertAlive(): void {
    if (this.disposed)
      throw new DOMException('Autosave owner is destroyed.', 'AbortError');
  }
  private schedule(): void {
    if (
      this.timer !== undefined ||
      this.active ||
      this.disposed ||
      this.current.retryRequired ||
      this.current.status === 'cancelled' ||
      this.generation === this.savedGeneration
    )
      return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      // Failure is represented by the error state/event, not a hidden retry or success.
      void this.run(false).catch(() => {});
    }, this.intervalMs);
  }
  /** Mark changed player state; a failure remains visible even when further edits arrive. */
  request(): void {
    this.assertAlive();
    this.generation++;
    if (this.current.status === 'error')
      this.publish('error', this.current.error);
    else if (this.active && !this.controller?.signal.aborted)
      this.publish('saving');
    else this.publish('dirty');
    this.schedule();
  }
  /** Wait until changes requested before/during this flush are durably acknowledged. */
  flush(): Promise<SaveRecord | null> {
    this.assertAlive();
    if (this.current.retryRequired) return Promise.reject(this.current.error);
    return this.run(true);
  }
  /** Explicit player/application action; stale errors still require reloading/resolving the conflict. */
  async retry(): Promise<SaveRecord | null> {
    this.assertAlive();
    if (
      this.active &&
      (this.current.status === 'error' || this.controller?.signal.aborted)
    ) {
      try {
        await this.active;
      } catch {
        /* Explicit retry starts after the failed attempt drains. */
      }
      this.assertAlive();
    }
    if (this.generation === this.savedGeneration) {
      this.publish(this.current.revision === null ? 'idle' : 'saved');
      return null;
    }
    if (this.current.status === 'error' || this.current.status === 'cancelled')
      this.publish('dirty');
    return this.run(true);
  }
  private run(drain: boolean): Promise<SaveRecord | null> {
    this.drain ||= drain;
    if (this.active) return this.active;
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    if (this.generation === this.savedGeneration) return Promise.resolve(null);
    const epoch = this.epoch;
    const controller = new AbortController();
    this.controller = controller;
    const attempt = async (): Promise<SaveRecord | null> => {
      let last: SaveRecord;
      controller.signal.throwIfAborted();
      do {
        const generation = this.generation;
        this.publish('saving');
        try {
          const data = this.options.capture();
          last = await this.saves.save(
            this.options.slot,
            data,
            this.options.playTime?.() ?? 0,
            { signal: controller.signal },
          );
          if (this.disposed || epoch !== this.epoch) return last;
          this.savedGeneration = generation;
          this.publish(
            this.generation === generation ? 'saved' : 'dirty',
            null,
            last.revision,
          );
        } catch (error) {
          if (!this.disposed && epoch === this.epoch) {
            this.publish(
              controller.signal.aborted ? 'cancelled' : 'error',
              error,
            );
          }
          throw error;
        }
      } while (
        this.drain &&
        this.generation !== this.savedGeneration &&
        !this.disposed &&
        epoch === this.epoch
      );
      return last;
    };
    // Defer capture until active is installed: listener-triggered flushes join this attempt.
    const pending = Promise.resolve().then(attempt);
    this.active = pending;
    void pending.then(
      () => finish(),
      () => finish(),
    );
    const finish = () => {
      if (this.active !== pending) return;
      this.active = undefined;
      this.controller = undefined;
      this.drain = false;
      this.schedule();
    };
    return pending;
  }
  /** Cancels queued/precommit work; an already committed write is not rolled back. */
  cancel(): void {
    this.assertAlive();
    this.epoch++;
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.controller?.abort(
      new DOMException('Autosave was cancelled.', 'AbortError'),
    );
    this.publish('cancelled');
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.epoch++;
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.controller?.abort(
      new DOMException('Autosave owner is destroyed.', 'AbortError'),
    );
    this.options.signal?.removeEventListener('abort', this.ownerAbort);
    this.publish('destroyed');
    if (this.notify) this.removeEventListener('change', this.notify);
  }
}
