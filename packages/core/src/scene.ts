import { Transform2D, Transform3D, Vector3 } from '../../math/src/index.js';
import { World, type Entity } from '../../ecs/src/world.js';
import { Camera2D } from './camera2d.js';
import { Mesh } from './mesh.js';
import { PerspectiveCamera } from './perspective-camera.js';
import type { OrthographicCamera } from './orthographic-camera.js';
import { Object3D } from './object3d.js';
import { AnimationMixer } from './animation.js';
import type { EnvironmentMap } from './environment.js';
import type { PointLight, SpotLight } from './lights.js';
import type { ReflectionProbe } from './reflection-probe.js';
import {
  FogSettings,
  PostProcessingSettings,
  ShadowSettings,
} from './render-settings.js';
import type { Game } from './game.js';
import { GameObject } from './game-object.js';
import { SceneObject } from './scene-object.js';
import { Sprite } from './sprite.js';
import { SceneTimers } from './scene-timers.js';
import { TweenGroup } from './tween.js';
import { isCameraDependent, type CameraDependent3D } from './objects3d.js';
import { PhysicsWorld2D } from './physics2d/world.js';
import { PhysicsWorld3D } from './physics3d/world.js';
import { ParticleEmitter } from './particles2d/index.js';
import type { PostProcessor2D } from './materials2d/index.js';
import type { Pointer } from '../../input/src/index.js';
import { PointerRouter } from './gameplay/pointer-router.js';
import { PreloadBatch } from '../../assets/src/index.js';
import { simulationDefaults } from '../../../src/data/simulation.js';
import { NavigationScheduler } from './navigation/scheduler.js';
import { navigationLimits } from '../../../src/data/navigation.js';
import { GPUParticleEmitter3D } from './gpu-particles3d.js';
import {
  CharacterLocomotion3D,
  type CharacterLocomotionOptions3D,
} from './locomotion3d.js';
import type { CharacterController3D } from './physics3d/character.js';
import {
  WorldStreamingController,
  type WorldStreamingOptions,
} from './world-streaming.js';
import { SpatialLightSelector } from './light-selection.js';
import type { RenderGraph } from '../../graphics/src/render-graph.js';

export interface SceneOptions {
  readonly fixedDelta?: number;
  readonly maxFixedSteps?: number;
  readonly interpolatePhysics?: boolean;
  /** Aggregate admissions, searches and collision-bake work per visible Game frame. */
  readonly navigationWorkBudget?: number;
}

/** Owns objects and their scene-local ECS registrations until synchronous disposal. */
export class Scene {
  readonly world = new World();
  readonly camera2D = new Camera2D();
  private camera3DValue: PerspectiveCamera | OrthographicCamera | undefined;
  private timerQueue: SceneTimers | undefined;
  private tweenGroup: TweenGroup | undefined;
  private animationMixer: AnimationMixer | undefined;
  private physicsWorld: PhysicsWorld2D | undefined;
  private physicsWorld3D: PhysicsWorld3D | undefined;
  private navigationScheduler: NavigationScheduler | undefined;
  private readonly navigationWorkBudget: number;
  private locomotionDrivers: Set<CharacterLocomotion3D> | undefined;
  private streamingControllers: Set<WorldStreamingController> | undefined;
  private lightSelector: SpatialLightSelector | undefined;
  private presentationElapsed = 0;

  /** Scene-local simulation seconds; presentation fades never use a wall clock. */
  get presentationTime(): number {
    return this.presentationElapsed;
  }
  /** Logical pixels; detached scenes require an explicit viewport for screen-size LOD. */
  get presentationViewportHeight(): number | undefined {
    return this.owner?.height;
  }
  get lightSelection(): SpatialLightSelector {
    if (!this.lightSelector) {
      this.assertCanInitialize();
      this.lightSelector = new SpatialLightSelector();
    }
    return this.lightSelector;
  }
  set lightSelection(value: SpatialLightSelector) {
    this.assertCanInitialize();
    if (!(value instanceof SpatialLightSelector))
      throw new TypeError(
        'Scene light selection requires a SpatialLightSelector.',
      );
    this.lightSelector = value;
  }
  createLocomotion3D(
    controller: CharacterController3D,
    options: CharacterLocomotionOptions3D,
  ): CharacterLocomotion3D {
    this.assertCanInitialize();
    if (controller.world !== this.physicsWorld3D)
      throw new Error('Scene locomotion requires its own physics controller.');
    const driver = new CharacterLocomotion3D(controller, options);
    (this.locomotionDrivers ??= new Set()).add(driver);
    return driver;
  }
  createWorldStreaming(
    options: WorldStreamingOptions,
  ): WorldStreamingController {
    this.assertCanInitialize();
    if (!this.owner)
      throw new Error('Scene streaming requires a Game-owned Scene.');
    const controller = new WorldStreamingController(
      this,
      this.owner.resources,
      options,
    );
    controller.setPaused(
      this.owner.state !== 'running' ||
        (typeof document !== 'undefined' && document.hidden),
    );
    (this.streamingControllers ??= new Set()).add(controller);
    return controller;
  }
  /** @internal Reading membership does not initialize any streaming service. */
  get initializedWorldStreaming():
    ReadonlySet<WorldStreamingController> | undefined {
    return this.streamingControllers;
  }
  /** @internal Game applies its pause/visibility state before frame admission. */
  setWorldStreamingPaused(paused: boolean): void {
    if (this.streamingControllers)
      for (const controller of this.streamingControllers)
        controller.setPaused(paused);
  }
  /** @internal Once per visible frame, after gameplay input and before navigation. */
  advanceWorldStreaming(canContinue: () => boolean): void {
    if (this.disposed || !this.streamingControllers) return;
    for (const controller of this.streamingControllers) {
      if (!canContinue() || this.disposed) return;
      if (controller.destroyed) this.streamingControllers.delete(controller);
      else controller.update();
    }
  }

  get navigation(): NavigationScheduler {
    if (!this.navigationScheduler) {
      this.assertCanInitialize();
      this.navigationScheduler = new NavigationScheduler({
        workBudget: this.navigationWorkBudget,
      });
    }
    return this.navigationScheduler;
  }
  /** @internal Reading counters never admits work or initializes a scheduler. */
  get initializedNavigation(): NavigationScheduler | undefined {
    return this.navigationScheduler;
  }
  /** @internal Game invokes once, not once per fixed catch-up tick. */
  advanceNavigation(deltaTime: number): void {
    if (this.disposed || !this.navigationScheduler) return;
    this.navigationScheduler.update();
    if (!this.disposed) this.navigationScheduler.updateFollowers(deltaTime);
  }

  get camera3D(): PerspectiveCamera | OrthographicCamera {
    if (!this.camera3DValue) {
      this.assertCanInitialize();
      this.camera3DValue = new PerspectiveCamera();
    }
    return this.camera3DValue;
  }
  set camera3D(value: PerspectiveCamera | OrthographicCamera) {
    this.assertCanInitialize();
    this.camera3DValue = value;
  }
  get timers(): SceneTimers {
    if (!this.timerQueue) {
      this.assertCanInitialize();
      this.timerQueue = new SceneTimers();
    }
    return this.timerQueue;
  }
  /** Scene-local tweens and timelines, advanced every frame right after `timers`. */
  get tweens(): TweenGroup {
    if (!this.tweenGroup) {
      this.assertCanInitialize();
      this.tweenGroup = new TweenGroup();
    }
    return this.tweenGroup;
  }
  get animations(): AnimationMixer {
    if (!this.animationMixer) {
      this.assertCanInitialize();
      this.animationMixer = new AnimationMixer();
    }
    return this.animationMixer;
  }
  get physics(): PhysicsWorld2D {
    if (!this.physicsWorld) {
      this.assertCanInitialize();
      this.physicsWorld = new PhysicsWorld2D();
    }
    return this.physicsWorld;
  }
  get physics3D(): PhysicsWorld3D {
    if (!this.physicsWorld3D) {
      this.assertCanInitialize();
      this.physicsWorld3D = new PhysicsWorld3D();
    }
    return this.physicsWorld3D;
  }
  /** @internal Diagnostics must not activate otherwise unused services. */
  get initializedPhysics(): PhysicsWorld2D | undefined {
    return this.physicsWorld;
  }
  /** @internal */
  get initializedPhysics3D(): PhysicsWorld3D | undefined {
    return this.physicsWorld3D;
  }
  /** @internal */
  get initializedTweens(): TweenGroup | undefined {
    return this.tweenGroup;
  }
  /** @internal Frame hooks advance acquired services without initializing them. */
  advanceTimers(deltaTime: number): void {
    if (!this.disposed) this.timerQueue?.update(deltaTime);
  }
  /** @internal */
  advanceTweens(deltaTime: number): void {
    if (!this.disposed) this.tweenGroup?.update(deltaTime);
  }
  /** @internal */
  advanceAnimations(deltaTime: number): void {
    if (!this.disposed) this.animationMixer?.update(deltaTime);
  }
  private assertCanInitialize(): void {
    if (this.disposed)
      throw new Error('Cannot initialize services on a destroyed Scene.');
  }
  readonly fixedDelta: number;
  readonly maxFixedSteps: number;
  /** Opt-in rendering interpolation; simulation and queries keep their exact current poses. */
  interpolatePhysics: boolean;
  fixedElapsed = 0;
  fixedFrame = 0;
  droppedSimulationTime = 0;
  private fixedAccumulator = 0;
  private advancingFixed = false;
  private presenting = false;
  constructor(options: SceneOptions = {}) {
    this.fixedDelta = options.fixedDelta ?? simulationDefaults.fixedDelta;
    this.maxFixedSteps =
      options.maxFixedSteps ?? simulationDefaults.maxFixedSteps;
    if (
      !Number.isFinite(this.fixedDelta) ||
      this.fixedDelta <= 0 ||
      !Number.isInteger(this.maxFixedSteps) ||
      this.maxFixedSteps < 1
    )
      throw new RangeError(
        'Scene fixed timing requires a positive delta and step limit.',
      );
    this.interpolatePhysics = options.interpolatePhysics ?? false;
    this.navigationWorkBudget =
      options.navigationWorkBudget ?? navigationLimits.sceneWork;
    if (
      !Number.isInteger(this.navigationWorkBudget) ||
      this.navigationWorkBudget < 1 ||
      this.navigationWorkBudget > navigationLimits.scheduledWork
    )
      throw new RangeError(
        `navigationWorkBudget must be an integer in [1, ${navigationLimits.scheduledWork}].`,
      );
  }
  get fixedInterpolationAlpha(): number {
    return Math.min(1, Math.max(0, this.fixedAccumulator / this.fixedDelta));
  }
  /** @internal Presentation-only flag, never enabled during physics or input queries. */
  get presentingPhysics(): boolean {
    return this.presenting && this.interpolatePhysics;
  }
  /** @internal Rendering is bracketed even when a renderer throws. */
  beginPresentation(): void {
    this.presenting = true;
  }
  /** @internal */
  endPresentation(): void {
    this.presenting = false;
  }
  readonly effects2D: PostProcessor2D[] = [];
  /**
   * Full-frame native effects over the finished 3D image (WebGPU and WebGL2), applied in order
   * before the 2D layer. Same descriptors and shader ABI as `effects2D`.
   */
  readonly effects3D: PostProcessor2D[] = [];
  /** Prepared native DAG over the composed 3D + HUD frame, before scene transitions. */
  renderGraph?: RenderGraph | undefined;
  private pointLightList: PointLight[] | undefined;
  private spotLightList: SpotLight[] | undefined;
  get pointLights(): PointLight[] {
    if (!this.pointLightList) {
      this.assertCanInitialize();
      this.pointLightList = [];
    }
    return this.pointLightList;
  }
  get spotLights(): SpotLight[] {
    if (!this.spotLightList) {
      this.assertCanInitialize();
      this.spotLightList = [];
    }
    return this.spotLightList;
  }
  private shadowSettings: ShadowSettings | undefined;
  private postProcessingSettings: PostProcessingSettings | undefined;
  get shadows(): ShadowSettings {
    if (!this.shadowSettings) {
      this.assertCanInitialize();
      this.shadowSettings = new ShadowSettings();
    }
    return this.shadowSettings;
  }
  get postProcessing(): PostProcessingSettings {
    if (!this.postProcessingSettings) {
      this.assertCanInitialize();
      this.postProcessingSettings = new PostProcessingSettings();
    }
    return this.postProcessingSettings;
  }
  /** Weighted blended OIT trades exact layer ordering for stable intersecting transparency. */
  transparency: 'sorted' | 'weighted' = 'sorted';
  ambientLight = 0.3;
  /** Distance fog for 3D meshes (WebGPU and WebGL2). */
  private fogSettings: FogSettings | undefined;
  get fog(): FogSettings {
    if (!this.fogSettings) {
      this.assertCanInitialize();
      this.fogSettings = new FogSettings();
    }
    return this.fogSettings;
  }
  /** Image-based lighting for PBRMaterial; replaces `ambientLight` for those materials. */
  environment: EnvironmentMap | undefined;
  environmentIntensity = 1;
  /** Local IBL; the nearest containing probe overrides environment per mesh origin. */
  private reflectionProbeList: ReflectionProbe[] | undefined;
  get reflectionProbes(): ReflectionProbe[] {
    if (!this.reflectionProbeList) {
      this.assertCanInitialize();
      this.reflectionProbeList = [];
    }
    return this.reflectionProbeList;
  }
  /** Skybox drawn behind 3D objects. May be the same map as `environment`. */
  background: EnvironmentMap | undefined;
  backgroundIntensity = 1;
  /** Direction points from a surface toward the light. */
  private directionalLightValue:
    | {
        direction: Vector3;
        color: [number, number, number];
        intensity: number;
      }
    | undefined;
  get directionalLight(): {
    direction: Vector3;
    color: [number, number, number];
    intensity: number;
  } {
    if (!this.directionalLightValue) {
      this.assertCanInitialize();
      this.directionalLightValue = {
        direction: new Vector3(1, 1, 1).normalize(),
        color: [1, 1, 1],
        intensity: 0.7,
      };
    }
    return this.directionalLightValue;
  }
  set directionalLight(value: {
    direction: Vector3;
    color: [number, number, number];
    intensity: number;
  }) {
    this.assertCanInitialize();
    this.directionalLightValue = value;
  }
  private readonly registrations = new Map<SceneObject, Entity>();
  private readonly registeredObjects = new Set<SceneObject>();
  private registeredMeshes: Set<Mesh> | undefined;
  private meshRevision = 0;
  private registeredGPUParticles: Set<GPUParticleEmitter3D> | undefined;
  private cameraDependents: Set<Object3D & CameraDependent3D> | undefined;
  private readonly objectUpdates = new Map<GameObject, number>();
  private nextObjectUpdate = 0;
  private frameObjectUpdate = 0;
  private pointerRouter: PointerRouter | undefined;
  /** Explicit global-pointer observers; passive scene objects allocate no listener hub. */
  get pointerEvents(): PointerRouter {
    if (!this.pointerRouter) {
      this.assertCanInitialize();
      this.pointerRouter = new PointerRouter(this);
    }
    return this.pointerRouter;
  }

  /** @internal Input routing is independent of subclass Scene.update. */
  routePointers(pointer: Pointer, canContinue: () => boolean): void {
    if (this.disposed) return;
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
  private committingStreamingMembership = false;

  get objects(): ReadonlySet<SceneObject> {
    return this.registeredObjects;
  }
  /** @internal A lazy mesh-only membership view for native render collection. */
  get renderMeshes(): ReadonlySet<Mesh> | undefined {
    return this.registeredMeshes;
  }
  /** @internal Membership changes only; mutable poses are checked independently. */
  get renderMeshRevision(): number {
    return this.meshRevision;
  }
  /** @internal Native emitters are lazy and do not enter the 2D update registry. */
  get gpuParticleEmitters(): ReadonlySet<GPUParticleEmitter3D> | undefined {
    return this.registeredGPUParticles;
  }
  /** @internal Backends skip 3D camera/lighting work for sprite-only scenes. */
  get has3DContent(): boolean {
    return (
      (this.registeredMeshes?.size ?? 0) !== 0 ||
      (this.registeredGPUParticles?.size ?? 0) !== 0 ||
      (!!this.background && !this.background.destroyed) ||
      this.effects3D.length !== 0
    );
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  has(object: SceneObject): boolean {
    return this.registrations.has(object);
  }

  add<T extends SceneObject>(object: T): T {
    return this.addObject(object, true);
  }

  /** @internal Object3D.add registers and publishes the final parent before add events. */
  addChild<T extends Object3D>(object: T, parent: Object3D): T {
    return this.addObject(object, false, parent);
  }
  /** @internal Publish owner metadata only after every subtree registration succeeds. */
  publishStreamingSubtree(root: SceneObject, publish: () => void): void {
    if (this.committingStreamingMembership)
      throw new Error('Streaming membership publication is not reentrant.');
    if (
      root.destroyed ||
      root.scene ||
      ((root instanceof Object3D || root instanceof GameObject) && root.parent)
    )
      throw new Error(
        'Streaming publication requires a live detached owned root.',
      );
    this.addObject(root, true, undefined, publish);
  }
  /** @internal Retire metadata before consumers observe detached subtree events. */
  retireStreamingSubtree(root: SceneObject, retire: () => void): void {
    if (this.committingStreamingMembership)
      throw new Error('Streaming membership retirement is not reentrant.');
    if (root.scene !== this)
      throw new Error('Cannot retire a foreign streaming subtree.');
    this.removeObject(root, retire);
  }
  private commitStreamingMembership(commit: () => void): void {
    this.committingStreamingMembership = true;
    try {
      commit();
    } finally {
      this.committingStreamingMembership = false;
    }
  }

  private addObject<T extends SceneObject>(
    object: T,
    detachRoot: boolean,
    parent?: Object3D,
    publish?: () => void,
  ): T {
    if (this.disposed) throw new Error('Cannot add to a destroyed Scene.');
    if (this.registrations.has(object)) return object;
    const subtree: SceneObject[] = [object];
    for (let i = 0; i < subtree.length; i++) {
      const member = subtree[i];
      if (member.destroyed)
        throw new Error('Cannot add a destroyed scene object.');
      if (member.scene && member.scene !== this)
        throw new Error('Scene object already belongs to a scene.');
      if (publish && member.scene)
        throw new Error('Streaming subtree members must all be detached.');
      if (member instanceof Object3D || member instanceof GameObject) {
        for (const child of member.children) subtree.push(child);
      }
    }
    const added: SceneObject[] = [];
    const restoreParent =
      object instanceof Object3D && (parent || (detachRoot && object.parent))
        ? object.setParentForRegistration(parent)
        : undefined;
    try {
      for (const member of subtree) {
        if (this.registrations.has(member)) continue;
        this.register(member);
        added.push(member);
      }
      if (publish) this.commitStreamingMembership(publish);
    } catch (error) {
      for (let i = added.length - 1; i >= 0; i--) this.unregister(added[i]);
      restoreParent?.();
      throw error;
    }
    if (object instanceof GameObject) object.detachParent();
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
      if (object instanceof GameObject && (object.body || object.collider))
        this.physics.register(object);
      if (object instanceof Object3D && (object.body || object.collider))
        this.physics3D.register(object);
      this.registrations.set(object, entity);
      this.registeredObjects.add(object);
      if (object instanceof Mesh) {
        (this.registeredMeshes ??= new Set()).add(object);
        ++this.meshRevision;
      }
      if (object instanceof GPUParticleEmitter3D)
        (this.registeredGPUParticles ??= new Set()).add(object);
      if (isCameraDependent(object))
        (this.cameraDependents ??= new Set()).add(object);
      if (object instanceof GameObject)
        this.objectUpdates.set(object, ++this.nextObjectUpdate);
    } catch (error) {
      if (object instanceof GameObject) this.physicsWorld?.unregister(object);
      if (object instanceof Object3D) this.physicsWorld3D?.unregister(object);
      if (entity !== undefined) this.world.removeEntity(entity);
      object.detach(this);
      throw error;
    }
  }

  remove(object: SceneObject): boolean {
    return this.removeObject(object);
  }

  private removeObject(object: SceneObject, retire?: () => void): boolean {
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
    if (retire) this.commitStreamingMembership(retire);
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
    if (object instanceof Mesh) {
      this.registeredMeshes?.delete(object);
      ++this.meshRevision;
    }
    if (object instanceof GPUParticleEmitter3D)
      this.registeredGPUParticles?.delete(object);
    if (isCameraDependent(object)) this.cameraDependents?.delete(object);
    if (object instanceof GameObject) this.objectUpdates.delete(object);
    object.detach(this);
    this.world.removeEntity(entity);
    if (object instanceof GameObject) this.physicsWorld?.unregister(object);
    if (object instanceof Object3D) this.physicsWorld3D?.unregister(object);
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
    if (!Number.isFinite(deltaTime) || deltaTime < 0)
      throw new RangeError(
        'Scene simulation delta must be nonnegative and finite.',
      );
    if (this.advancingFixed)
      throw new Error('Scene fixed update is not reentrant.');
    this.presentationElapsed += deltaTime;
    this.physicsWorld?.sampleForces(deltaTime);
    if (this.physicsWorld3D?.enabled)
      this.physicsWorld3D.sampleForces(deltaTime);
    const total = this.fixedAccumulator + deltaTime;
    const available = Math.floor(
      (total + this.fixedDelta * 1e-9) / this.fixedDelta,
    );
    const steps = Math.min(available, this.maxFixedSteps);
    const remainder = Math.max(0, total - available * this.fixedDelta);
    const dropped = Math.max(0, (available - steps) * this.fixedDelta);
    this.droppedSimulationTime += dropped;
    this.physicsWorld?.discardFrameTime(dropped);
    this.physicsWorld3D?.discardFrameTime(dropped);
    this.fixedAccumulator = steps * this.fixedDelta + remainder;
    this.advancingFixed = true;
    try {
      for (
        let tick = 0;
        tick < steps && canContinue() && !this.disposed;
        tick++
      ) {
        this.fixedAccumulator = Math.max(
          0,
          this.fixedAccumulator - this.fixedDelta,
        );
        this.fixedUpdate(this.fixedDelta);
        if (!canContinue() || this.disposed) return;
        if (this.locomotionDrivers)
          for (const driver of this.locomotionDrivers) {
            if (!canContinue() || this.disposed) return;
            if (driver.destroyed) this.locomotionDrivers.delete(driver);
            else driver.fixedUpdate(this.fixedDelta, this.fixedFrame);
          }
        this.physicsWorld?.sampleFixedForces(this.fixedDelta);
        if (this.physicsWorld3D?.enabled)
          this.physicsWorld3D.sampleFixedForces(this.fixedDelta);
        this.physicsWorld?.update(this.fixedDelta, canContinue, false);
        if (!canContinue() || this.disposed) return;
        this.physicsWorld3D?.update(this.fixedDelta, canContinue, false);
        this.fixedElapsed += this.fixedDelta;
        ++this.fixedFrame;
      }
    } finally {
      this.advancingFixed = false;
      if (
        this.fixedAccumulator >= this.fixedDelta &&
        (!canContinue() || this.disposed)
      ) {
        const omitted =
          Math.floor(this.fixedAccumulator / this.fixedDelta) * this.fixedDelta;
        this.fixedAccumulator = Math.max(0, this.fixedAccumulator - omitted);
        this.physicsWorld?.discardFrameTime(omitted);
        this.physicsWorld3D?.discardFrameTime(omitted);
      }
    }
    if (!canContinue() || this.disposed) return;
    for (const [object, id] of this.objectUpdates) {
      if (id > this.frameObjectUpdate) break;
      if (!canContinue() || this.disposed) return;
      if (object instanceof ParticleEmitter) object.updateSimulation(deltaTime);
    }
    if (this.registeredGPUParticles)
      for (const emitter of this.registeredGPUParticles) {
        if (!canContinue() || this.disposed) return;
        emitter.updateSimulation(deltaTime);
      }
    if (canContinue() && !this.disposed)
      this.camera2D.updateBehaviors(deltaTime);
    if (canContinue() && !this.disposed) this.updateCameraDependents();
  }

  /** @internal Billboards, LODs and camera-facing lines follow the final 3D camera pose. */
  updateCameraDependents(
    viewportHeight = this.presentationViewportHeight,
  ): void {
    if (this.disposed || !this.cameraDependents?.size) return;
    for (const object of [...this.cameraDependents]) {
      if (object.worldVisible)
        object.updateForCamera(
          this.camera3D,
          viewportHeight,
          this.presentationTime,
        );
    }
  }

  /** Called before scene systems, once per visible frame. */
  update(deltaTime: number): void {
    void deltaTime;
  }
  /** Fixed gameplay runs immediately before both physics worlds, zero or more times per frame. */
  fixedUpdate(deltaTime: number): void {
    void deltaTime;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timerQueue?.destroy();
    this.tweenGroup?.destroy();
    this.controller?.abort();
    const errors: unknown[] = [];
    if (this.streamingControllers) {
      for (const controller of this.streamingControllers) {
        try {
          controller.destroy();
        } catch (error) {
          errors.push(error);
        }
      }
      this.streamingControllers.clear();
    }
    if (this.locomotionDrivers) {
      for (const driver of this.locomotionDrivers) {
        try {
          driver.destroy();
        } catch (error) {
          errors.push(error);
        }
      }
      this.locomotionDrivers.clear();
    }
    try {
      this.navigationScheduler?.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.animationMixer?.destroy();
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
      this.physicsWorld?.destroy();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.physicsWorld3D?.destroy();
    } catch (error) {
      errors.push(error);
    }
    this.lightSelector?.clear();
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
