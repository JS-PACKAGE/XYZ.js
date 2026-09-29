import { Transform2D } from '../../math/src/index.js';
import { World, type Entity } from '../../ecs/src/world.js';
import { Camera2D } from './camera2d.js';
import type { Game } from './game.js';
import { GameObject } from './game-object.js';
import { SceneObject } from './scene-object.js';
import { Sprite } from './sprite.js';

/** Owns objects and their scene-local ECS registrations until synchronous disposal. */
export class Scene {
  readonly world = new World();
  readonly camera2D = new Camera2D();
  private readonly registrations = new Map<SceneObject, Entity>();
  private readonly registeredObjects = new Set<SceneObject>();
  private owner: Game | undefined;
  private controller: AbortController | undefined;
  private disposed = false;

  get objects(): ReadonlySet<SceneObject> {
    return this.registeredObjects;
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  has(object: SceneObject): boolean {
    return this.registrations.has(object);
  }

  add<T extends SceneObject>(object: T): T {
    if (this.disposed) throw new Error('Cannot add to a destroyed Scene.');
    if (this.registrations.has(object)) return object;
    object.attach(this);
    let entity: Entity | undefined;
    try {
      entity = this.world.createEntity();
      if (object instanceof GameObject)
        this.world.addComponent(entity, Transform2D, object.transform);
      if (object instanceof Sprite)
        this.world.addComponent(entity, Sprite, object);
      this.registrations.set(object, entity);
      this.registeredObjects.add(object);
    } catch (error) {
      if (entity !== undefined) this.world.removeEntity(entity);
      object.detach(this);
      throw error;
    }
    return object;
  }

  remove(object: SceneObject): boolean {
    const entity = this.registrations.get(object);
    if (entity === undefined) return false;
    this.registrations.delete(object);
    this.registeredObjects.delete(object);
    object.detach(this);
    this.world.removeEntity(entity);
    return true;
  }

  /** @internal A Scene belongs to one Game for its lifetime, including failed preparation. */
  claim(game: Game): AbortSignal {
    if (this.disposed || this.owner)
      throw new Error('Scene is destroyed or already owned by a Game.');
    this.owner = game;
    this.controller = new AbortController();
    return this.controller.signal;
  }

  /** @internal Abort signals are cooperative; disposal itself is always synchronous. */
  cancel(): void {
    this.controller?.abort();
    this.destroy();
  }

  /** @internal Runs once before Game atomically publishes the prepared Scene. */
  prepare(game: Game, signal: AbortSignal): void | Promise<void> {
    return this.initialize(game, signal);
  }

  protected initialize(game: Game, signal: AbortSignal): void | Promise<void> {
    void game;
    void signal;
  }

  /** Called before scene systems, once per visible frame. */
  update(deltaTime: number): void {
    void deltaTime;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controller?.abort();
    const errors: unknown[] = [];
    // Detach registrations first so object destruction cannot mutate traversal.
    for (const object of [...this.registrations.keys()]) {
      this.remove(object);
      try {
        object.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      this.onDestroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.world.destroy();
    } catch (error) {
      errors.push(error);
    }
    this.owner?.onSceneDisposed(this);
    if (errors.length)
      throw new AggregateError(errors, 'Scene cleanup failed.');
  }

  /** Release scene-owned resources synchronously; called exactly once. */
  protected onDestroy(): void {}
}
