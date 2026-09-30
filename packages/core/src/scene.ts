import { Transform2D, Transform3D, Vector3 } from '../../math/src/index.js';
import { World, type Entity } from '../../ecs/src/world.js';
import { Camera2D } from './camera2d.js';
import { Mesh } from './mesh.js';
import { PerspectiveCamera } from './perspective-camera.js';
import type { OrthographicCamera } from './orthographic-camera.js';
import { Object3D } from './object3d.js';
import { AnimationMixer } from './animation.js';
import type { PointLight, SpotLight } from './lights.js';
import { PostProcessingSettings, ShadowSettings } from './render-settings.js';
import type { Game } from './game.js';
import { GameObject } from './game-object.js';
import { SceneObject } from './scene-object.js';
import { Sprite } from './sprite.js';
import { SceneTimers } from './scene-timers.js';
import { PhysicsWorld2D } from './physics2d/world.js';
import { ParticleEmitter } from './particles2d/index.js';
import type { PostProcessor2D } from './materials2d/index.js';
import type { Pointer } from '../../input/src/index.js';
import { PointerRouter } from './gameplay/pointer-router.js';
import { PreloadBatch } from '../../assets/src/index.js';

/** Owns objects and their scene-local ECS registrations until synchronous disposal. */
export class Scene {
  readonly world = new World();
  readonly camera2D = new Camera2D();
  camera3D: PerspectiveCamera | OrthographicCamera = new PerspectiveCamera();
  readonly timers = new SceneTimers();
  readonly animations = new AnimationMixer();
  readonly physics = new PhysicsWorld2D();
  readonly effects2D: PostProcessor2D[] = [];
  readonly pointLights: PointLight[] = [];
  readonly spotLights: SpotLight[] = [];
  readonly shadows = new ShadowSettings();
  readonly postProcessing = new PostProcessingSettings();
  ambientLight = 0.3;
  /** Direction points from a surface toward the light. */
  directionalLight = {
    direction: new Vector3(1, 1, 1).normalize(),
    color: [1, 1, 1] as [number, number, number],
    intensity: 0.7,
  };
  private readonly registrations = new Map<SceneObject, Entity>();
  private readonly registeredObjects = new Set<SceneObject>();
  private readonly objectUpdates = new Map<GameObject, number>();
  private nextObjectUpdate = 0;
  private frameObjectUpdate = 0;
  private pointerRouter: PointerRouter | undefined;
  /** Explicit global-pointer observers; passive scene objects allocate no listener hub. */
  get pointerEvents(): PointerRouter {
    return (this.pointerRouter ??= new PointerRouter(this));
  }

  /** @internal Input routing is independent of subclass Scene.update. */
  routePointers(pointer: Pointer, canContinue: () => boolean): void {
    if (this.pointerRouter || pointer.samples.length)
      (this.pointerRouter ??= new PointerRouter(this)).update(
        pointer,
        canContinue,
      );
  }
  /** @internal Pause/blur/scene disposal cancels captured drags synchronously. */
  resetPointerRouting(): void {
    this.pointerRouter?.reset();
  }
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
    const subtree: SceneObject[] = [object];
    for (let i = 0; i < subtree.length; i++) {
      const member = subtree[i];
      if (member.destroyed)
        throw new Error('Cannot add a destroyed scene object.');
      if (member.scene && member.scene !== this)
        throw new Error('Scene object already belongs to a scene.');
      if (member instanceof Object3D || member instanceof GameObject) {
        for (const child of member.children) subtree.push(child);
      }
    }
    const added: SceneObject[] = [];
    try {
      for (const member of subtree) {
        if (this.registrations.has(member)) continue;
        this.register(member);
        added.push(member);
      }
    } catch (error) {
      for (let i = added.length - 1; i >= 0; i--) this.unregister(added[i]);
      throw error;
    }
    if (object instanceof Object3D || object instanceof GameObject)
      object.detachParent();
    for (const member of added) {
      if (member.scene === this && !member.destroyed)
        member.dispatchObjectEvent('add', { scene: this });
    }
    return object;
  }

  private register(object: SceneObject): void {
    object.attach(this);
    let entity: Entity | undefined;
    try {
      entity = this.world.createEntity();
      if (object instanceof GameObject)
        this.world.addComponent(entity, Transform2D, object.transform);
      if (object instanceof Sprite)
        this.world.addComponent(entity, Sprite, object);
      if (object instanceof Object3D)
        this.world.addComponent(entity, Transform3D, object.transform);
      if (object instanceof Mesh) this.world.addComponent(entity, Mesh, object);
      if (object instanceof GameObject) this.physics.register(object);
      this.registrations.set(object, entity);
      this.registeredObjects.add(object);
      if (object instanceof GameObject)
        this.objectUpdates.set(object, ++this.nextObjectUpdate);
    } catch (error) {
      if (object instanceof GameObject) this.physics.unregister(object);
      if (entity !== undefined) this.world.removeEntity(entity);
      object.detach(this);
      throw error;
    }
  }

  remove(object: SceneObject): boolean {
    if (!this.registrations.has(object)) return false;
    const subtree: SceneObject[] = [object];
    for (let i = 0; i < subtree.length; i++) {
      const member = subtree[i];
      if (member instanceof Object3D || member instanceof GameObject) {
        for (const child of member.children) subtree.push(child);
      }
    }
    if (object instanceof Object3D || object instanceof GameObject)
      object.detachParent();
    for (const member of subtree) this.unregister(member);
    for (const member of subtree) {
      if (!member.scene) member.dispatchObjectEvent('remove', { scene: this });
    }
    return true;
  }

  private unregister(object: SceneObject): void {
    const entity = this.registrations.get(object);
    if (entity === undefined) return;
    this.registrations.delete(object);
    this.registeredObjects.delete(object);
    if (object instanceof GameObject) this.objectUpdates.delete(object);
    object.detach(this);
    this.world.removeEntity(entity);
    if (object instanceof GameObject) this.physics.unregister(object);
    if (object instanceof GameObject) this.pointerRouter?.forget(object);
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
    const preload = this.preload(game, signal);
    if (!preload || preload instanceof PreloadBatch)
      return this.prepareBatch(preload, game, signal);
    return preload.then((batch) => this.prepareBatch(batch, game, signal));
  }

  private prepareBatch(
    batch: PreloadBatch | void,
    game: Game,
    signal: AbortSignal,
  ): void | Promise<void> {
    if (signal.aborted || this.disposed) {
      batch?.cancel(signal.reason);
      throw (
        signal.reason ??
        new DOMException('Scene preparation cancelled.', 'AbortError')
      );
    }
    // Scenes without a loading barrier retain their existing initialization timing.
    if (!batch) return this.initialize(game, signal);
    game.setLoading(this, batch);
    return batch
      .load({ signal })
      .then(() => {
        if (signal.aborted || this.disposed)
          throw (
            signal.reason ??
            new DOMException('Scene preparation cancelled.', 'AbortError')
          );
        return this.initialize(game, signal);
      })
      .finally(() => game.setLoading(this, undefined));
  }

  protected preload(
    game: Game,
    signal: AbortSignal,
  ): PreloadBatch | void | Promise<PreloadBatch | void> {
    void game;
    void signal;
  }

  protected initialize(game: Game, signal: AbortSignal): void | Promise<void> {
    void game;
    void signal;
  }

  /** @internal Freeze membership before callbacks; new/re-added objects wait one frame. */
  beginObjectFrame(): void {
    this.frameObjectUpdate = this.nextObjectUpdate;
  }

  /** @internal Re-entrant lifecycle callbacks cannot revive an object in the same tick. */
  beginObjectUpdates(deltaTime: number, canContinue: () => boolean): void {
    for (const [object, id] of this.objectUpdates) {
      if (id > this.frameObjectUpdate) break;
      if (!canContinue() || this.disposed) return;
      object.initializeEvents();
      if (!canContinue() || this.disposed) return;
      if (this.objectUpdates.get(object) !== id || object.destroyed) continue;
      object.emitUpdate('preupdate', deltaTime);
    }
  }

  /** @internal Invoked independently of subclass Scene.update. */
  advanceFrameAnimations(deltaTime: number, canContinue: () => boolean): void {
    for (const [object, id] of this.objectUpdates) {
      if (id > this.frameObjectUpdate) break;
      if (!canContinue() || this.disposed) return;
      if (object instanceof Sprite) object.animation?.update(deltaTime);
    }
  }

  /** @internal Only queues explicitly accessed by consumers are advanced. */
  advanceActions(deltaTime: number, canContinue: () => boolean): void {
    for (const [object, id] of this.objectUpdates) {
      if (id > this.frameObjectUpdate) break;
      if (!canContinue() || this.disposed) return;
      object.advanceActions(deltaTime, canContinue);
    }
  }

  /** @internal Object updates are never dependent on a subclass calling super. */
  advanceObjects(deltaTime: number, canContinue: () => boolean): void {
    for (const [object, id] of this.objectUpdates) {
      if (id > this.frameObjectUpdate) break;
      if (!canContinue() || this.disposed) return;
      object.update(deltaTime);
      if (!canContinue() || this.disposed) return;
      if (this.objectUpdates.get(object) === id && !object.destroyed)
        object.emitUpdate('postupdate', deltaTime);
    }
  }

  /** @internal Systems/actions run first, physics then particles, final camera last. */
  advanceAfterUpdate(deltaTime: number, canContinue: () => boolean): void {
    if (!canContinue() || this.disposed) return;
    this.physics.update(deltaTime, canContinue);
    if (!canContinue() || this.disposed) return;
    for (const [object, id] of this.objectUpdates) {
      if (id > this.frameObjectUpdate) break;
      if (!canContinue() || this.disposed) return;
      if (object instanceof ParticleEmitter) object.updateSimulation(deltaTime);
    }
    if (canContinue() && !this.disposed)
      this.camera2D.updateBehaviors(deltaTime);
  }

  /** Called before scene systems, once per visible frame. */
  update(deltaTime: number): void {
    void deltaTime;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timers.destroy();
    this.controller?.abort();
    const errors: unknown[] = [];
    try {
      this.animations.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.owner?.audio.stopScene(this);
    } catch (error) {
      errors.push(error);
    }
    const objects = [...this.registeredObjects];
    const roots = objects.filter(
      (object) =>
        !(
          (object instanceof Object3D || object instanceof GameObject) &&
          object.parent
        ),
    );
    // Preserve parent links while detaching every registration; roots own recursive cleanup.
    for (const object of objects) {
      try {
        this.unregister(object);
      } catch (error) {
        errors.push(error);
      }
    }
    for (const object of objects)
      object.dispatchObjectEvent('remove', { scene: this });
    for (const object of roots) {
      if (object.destroyed) continue;
      try {
        object.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      this.physics.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.camera2D.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.pointerRouter?.destroy();
    } catch (error) {
      errors.push(error);
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
