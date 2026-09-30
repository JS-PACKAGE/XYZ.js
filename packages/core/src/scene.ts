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

/** Owns objects and their scene-local ECS registrations until synchronous disposal. */
export class Scene {
  readonly world = new World();
  readonly camera2D = new Camera2D();
  camera3D: PerspectiveCamera | OrthographicCamera = new PerspectiveCamera();
  readonly timers = new SceneTimers();
  readonly animations = new AnimationMixer();
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
      if (member instanceof Object3D) {
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
    if (object instanceof Object3D) object.detachParent();
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
      this.registrations.set(object, entity);
      this.registeredObjects.add(object);
    } catch (error) {
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
      if (member instanceof Object3D) {
        for (const child of member.children) subtree.push(child);
      }
    }
    if (object instanceof Object3D) object.detachParent();
    for (const member of subtree) this.unregister(member);
    return true;
  }

  private unregister(object: SceneObject): void {
    const entity = this.registrations.get(object);
    if (entity === undefined) return;
    this.registrations.delete(object);
    this.registeredObjects.delete(object);
    object.detach(this);
    this.world.removeEntity(entity);
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
      (object) => !(object instanceof Object3D) || !object.parent,
    );
    // Preserve parent links while detaching every registration; roots own recursive cleanup.
    for (const object of objects) {
      try {
        this.unregister(object);
      } catch (error) {
        errors.push(error);
      }
    }
    for (const object of roots) {
      if (object.destroyed) continue;
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
