import { assetLimits } from '../../../src/data/assets.js';
import type { Game, SetSceneOptions } from './game.js';
import type { Scene } from './scene.js';
import type { ResourceScope } from '../../assets/src/resource-scope.js';

export interface HotSceneContext {
  readonly game: Game;
  readonly resources: ResourceScope;
  readonly signal: AbortSignal;
}
export type HotSceneFactory = (
  context: HotSceneContext,
) => Scene | Promise<Scene>;
export interface HotSceneOptions {
  /** Default true. The owner never creates a second Game/canvas. */
  destroyGameOnDispose?: boolean;
  publication?: Omit<SetSceneOptions, 'signal'>;
}

/** Prepare on the existing Game; Game.setScene is the sole publication boundary.
 * Factories must acquire candidate resources through context.resources and honor signal.
 */
export class HotSceneOwner {
  private disposed = false;
  private disposal?: Promise<void>;
  private pending?: AbortController;
  private current?: ResourceScope;
  private readonly jobs = new Set<Promise<Scene>>();

  constructor(
    readonly game: Game,
    private readonly options: HotSceneOptions = {},
  ) {}

  replace(factory: HotSceneFactory): Promise<Scene> {
    if (this.disposed)
      return Promise.reject(new Error('Hot scene owner is disposed.'));
    if (this.jobs.size >= assetLimits.hotSceneCandidates)
      return Promise.reject(new Error('Hot scene candidate limit exceeded.'));
    this.pending?.abort(new Error('Hot scene candidate superseded.'));
    const controller = new AbortController();
    this.pending = controller;
    const resources = this.game.resources.createScope();
    let abortError: unknown;
    const abort = (): void => {
      try {
        resources.release(controller.signal.reason);
      } catch (error) {
        abortError = error;
      }
    };
    controller.signal.addEventListener('abort', abort, { once: true });
    const job = Promise.resolve().then(async () => {
      let attemptedPublication = false;
      let candidate: Scene | undefined;
      try {
        controller.signal.throwIfAborted();
        candidate = await factory({
          game: this.game,
          resources,
          signal: controller.signal,
        });
        controller.signal.throwIfAborted();
        if (candidate === this.game.scene)
          throw new Error('A hot replacement must return a fresh Scene.');
        attemptedPublication = true;
        await this.game.setScene(candidate, {
          ...this.options.publication,
          signal: controller.signal,
        });
        // Publication can succeed but old Scene cleanup can report an error. Never destroy the live candidate.
        const old = this.current;
        this.current = resources;
        if (this.pending === controller) this.pending = undefined;
        controller.signal.removeEventListener('abort', abort);
        old?.release();
        return candidate;
      } catch (error) {
        const errors: unknown[] = [error];
        if (abortError !== undefined) errors.push(abortError);
        if (
          candidate &&
          attemptedPublication &&
          this.game.scene === candidate
        ) {
          if (this.current !== resources) {
            const old = this.current;
            this.current = resources;
            controller.signal.removeEventListener('abort', abort);
            try {
              old?.release();
            } catch (cleanup) {
              errors.push(cleanup);
            }
          }
        } else {
          try {
            if (candidate !== this.game.scene) candidate?.destroy();
          } catch (cleanup) {
            errors.push(cleanup);
          }
          try {
            resources.release();
          } catch (cleanup) {
            errors.push(cleanup);
          }
        }
        if (errors.length > 1)
          throw new AggregateError(
            errors,
            'Hot scene replacement cleanup failed.',
            { cause: error },
          );
        throw error;
      } finally {
        controller.signal.removeEventListener('abort', abort);
        if (this.pending === controller) this.pending = undefined;
      }
    });
    this.jobs.add(job);
    void job.then(
      () => this.jobs.delete(job),
      () => this.jobs.delete(job),
    );
    return job;
  }

  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    this.disposed = true;
    const errors: unknown[] = [];
    try {
      this.pending?.abort(new Error('Hot scene owner disposed.'));
    } catch (error) {
      errors.push(error);
    }
    // Vite does not await dispose callbacks. Relinquish canvas ownership synchronously,
    // before a reevaluated entry module can create its next Game.
    if (this.options.destroyGameOnDispose !== false) {
      try {
        this.game.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      this.current?.release();
    } catch (error) {
      errors.push(error);
    }
    this.current = undefined;
    this.disposal = Promise.allSettled(this.jobs).then(() => {
      if (errors.length)
        throw new AggregateError(errors, 'Hot scene owner disposal failed.');
    });
    return this.disposal;
  }
}

/** Structural Vite protocol: no Vite import or runtime dependency. */
export interface SceneHotAdapter<Module> {
  accept(
    dependency: string,
    callback: (module: Module | undefined) => void,
  ): void;
  dispose(callback: () => void): void;
}
export function bindSceneHotReload<Module>(
  owner: HotSceneOwner,
  hot: SceneHotAdapter<Module>,
  dependency: string,
  factory: (module: Module) => HotSceneFactory,
  onError: (error: unknown) => void,
): void {
  hot.accept(dependency, (module) => {
    if (!module) {
      onError(new Error('Hot scene module failed to load.'));
      return;
    }
    try {
      void owner.replace(factory(module)).catch(onError);
    } catch (error) {
      onError(error);
    }
  });
  hot.dispose(() => {
    void owner.dispose().catch(onError);
  });
}
