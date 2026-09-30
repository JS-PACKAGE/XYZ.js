import { gameplayAssetLimits } from '../../../../src/data/gameplay-assets.js';
import { subscribeLoad } from './subscribe-load.js';

export interface LoadTask<T = unknown> {
  readonly key: string;
  load(signal: AbortSignal): Promise<T>;
}

export interface PreloadProgress {
  readonly completed: number;
  readonly total: number;
  readonly ratio: number;
  readonly currentKey?: string;
}

export type PreloadState =
  'idle' | 'loading' | 'ready' | 'failed' | 'cancelled';

/** A batch owns task cancellation, never the resources returned by a shared loader. */
export class PreloadBatch extends EventTarget {
  private readonly tasks: readonly LoadTask[];
  private readonly controller = new AbortController();
  private readonly results = new Map<string, unknown>();
  private status: PreloadState = 'idle';
  private snapshot: PreloadProgress;
  private pending?: Promise<ReadonlyMap<string, unknown>>;

  constructor(tasks: readonly LoadTask[]) {
    super();
    if (tasks.length > gameplayAssetLimits.preloadTasks)
      throw new RangeError('Preload batch exceeds the task budget.');
    const keys = new Set<string>();
    this.tasks = tasks.map((task) => {
      if (!task.key || keys.has(task.key) || typeof task.load !== 'function')
        throw new TypeError(
          'Preload tasks require unique nonempty keys and a load function.',
        );
      keys.add(task.key);
      return { key: task.key, load: task.load.bind(task) };
    });
    this.snapshot = Object.freeze({
      completed: 0,
      total: tasks.length,
      ratio: tasks.length ? 0 : 1,
    });
  }

  get state(): PreloadState {
    return this.status;
  }

  get progress(): PreloadProgress {
    return this.snapshot;
  }

  load(
    options: { signal?: AbortSignal } = {},
  ): Promise<ReadonlyMap<string, unknown>> {
    if (this.pending) return this.pending;
    if (this.status === 'cancelled')
      return Promise.reject(this.controller.signal.reason);
    this.status = 'loading';
    const abort = () => this.cancel(options.signal?.reason);
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    this.pending = Promise.resolve()
      .then(() => this.run())
      .finally(() => options.signal?.removeEventListener('abort', abort));
    return this.pending;
  }

  cancel(
    reason: unknown = new DOMException('Preload cancelled.', 'AbortError'),
  ): void {
    if (this.status !== 'idle' && this.status !== 'loading') return;
    this.status = 'cancelled';
    this.controller.abort(reason);
  }

  private async run(): Promise<ReadonlyMap<string, unknown>> {
    const signal = this.controller.signal;
    try {
      signal.throwIfAborted();
      this.dispatchEvent(
        new CustomEvent('progress', { detail: this.snapshot }),
      );
      let next = 0;
      const worker = async () => {
        while (next < this.tasks.length) {
          signal.throwIfAborted();
          const task = this.tasks[next++];
          const value = await subscribeLoad(
            Promise.resolve().then(() => {
              signal.throwIfAborted();
              return task.load(signal);
            }),
            signal,
          );
          signal.throwIfAborted();
          this.results.set(task.key, value);
          const completed = this.results.size;
          this.snapshot = Object.freeze({
            completed,
            total: this.tasks.length,
            ratio: completed / this.tasks.length,
            currentKey: task.key,
          });
          this.dispatchEvent(
            new CustomEvent('progress', { detail: this.snapshot }),
          );
        }
      };
      await Promise.all(
        Array.from(
          {
            length: Math.min(
              gameplayAssetLimits.preloadConcurrency,
              this.tasks.length,
            ),
          },
          worker,
        ),
      );
      signal.throwIfAborted();
      this.status = 'ready';
      this.dispatchEvent(new CustomEvent('complete', { detail: this.results }));
      return this.results;
    } catch (error) {
      if (this.status !== 'cancelled') {
        this.status = 'failed';
        this.controller.abort(error);
        this.dispatchEvent(new CustomEvent('error', { detail: error }));
      }
      throw error;
    }
  }
}
