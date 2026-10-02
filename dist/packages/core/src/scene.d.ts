import { Vector3 } from '../../math/src/index.js';
import { World } from '../../ecs/src/world.js';
import { Camera2D } from './camera2d.js';
import { PerspectiveCamera } from './perspective-camera.js';
import type { OrthographicCamera } from './orthographic-camera.js';
import { Object3D } from './object3d.js';
import { AnimationMixer } from './animation.js';
import type { EnvironmentMap } from './environment.js';
import type { PointLight, SpotLight } from './lights.js';
import type { ReflectionProbe } from './reflection-probe.js';
import { FogSettings, PostProcessingSettings, ShadowSettings } from './render-settings.js';
import type { Game } from './game.js';
import { SceneObject } from './scene-object.js';
import { SceneTimers } from './scene-timers.js';
import { TweenGroup } from './tween.js';
import { PhysicsWorld2D } from './physics2d/world.js';
import { PhysicsWorld3D } from './physics3d/world.js';
import type { PostProcessor2D } from './materials2d/index.js';
import type { Pointer } from '../../input/src/index.js';
import { PointerRouter } from './gameplay/pointer-router.js';
import { PreloadBatch } from '../../assets/src/index.js';
export interface SceneOptions {
    readonly fixedDelta?: number;
    readonly maxFixedSteps?: number;
    readonly interpolatePhysics?: boolean;
}
/** Owns objects and their scene-local ECS registrations until synchronous disposal. */
export declare class Scene {
    readonly world: World;
    readonly camera2D: Camera2D;
    private camera3DValue;
    private timerQueue;
    private tweenGroup;
    private animationMixer;
    private physicsWorld;
    private physicsWorld3D;
    get camera3D(): PerspectiveCamera | OrthographicCamera;
    set camera3D(value: PerspectiveCamera | OrthographicCamera);
    get timers(): SceneTimers;
    /** Scene-local tweens and timelines, advanced every frame right after `timers`. */
    get tweens(): TweenGroup;
    get animations(): AnimationMixer;
    get physics(): PhysicsWorld2D;
    get physics3D(): PhysicsWorld3D;
    /** @internal Diagnostics must not activate otherwise unused services. */
    get initializedPhysics(): PhysicsWorld2D | undefined;
    /** @internal */
    get initializedPhysics3D(): PhysicsWorld3D | undefined;
    /** @internal */
    get initializedTweens(): TweenGroup | undefined;
    /** @internal Frame hooks advance acquired services without initializing them. */
    advanceTimers(deltaTime: number): void;
    /** @internal */
    advanceTweens(deltaTime: number): void;
    /** @internal */
    advanceAnimations(deltaTime: number): void;
    private assertCanInitialize;
    readonly fixedDelta: number;
    readonly maxFixedSteps: number;
    /** Opt-in rendering interpolation; simulation and queries keep their exact current poses. */
    interpolatePhysics: boolean;
    fixedElapsed: number;
    fixedFrame: number;
    droppedSimulationTime: number;
    private fixedAccumulator;
    private advancingFixed;
    private presenting;
    constructor(options?: SceneOptions);
    get fixedInterpolationAlpha(): number;
    /** @internal Presentation-only flag, never enabled during physics or input queries. */
    get presentingPhysics(): boolean;
    /** @internal Rendering is bracketed even when a renderer throws. */
    beginPresentation(): void;
    /** @internal */
    endPresentation(): void;
    readonly effects2D: PostProcessor2D[];
    /**
     * Full-frame native effects over the finished 3D image (WebGPU and WebGL2), applied in order
     * before the 2D layer. Same descriptors and shader ABI as `effects2D`.
     */
    readonly effects3D: PostProcessor2D[];
    private pointLightList;
    private spotLightList;
    get pointLights(): PointLight[];
    get spotLights(): SpotLight[];
    private shadowSettings;
    private postProcessingSettings;
    get shadows(): ShadowSettings;
    get postProcessing(): PostProcessingSettings;
    /** Weighted blended OIT trades exact layer ordering for stable intersecting transparency. */
    transparency: 'sorted' | 'weighted';
    ambientLight: number;
    /** Distance fog for 3D meshes (WebGPU and WebGL2). */
    private fogSettings;
    get fog(): FogSettings;
    /** Image-based lighting for PBRMaterial; replaces `ambientLight` for those materials. */
    environment: EnvironmentMap | undefined;
    environmentIntensity: number;
    /** Local IBL; the nearest containing probe overrides environment per mesh origin. */
    private reflectionProbeList;
    get reflectionProbes(): ReflectionProbe[];
    /** Skybox drawn behind 3D objects. May be the same map as `environment`. */
    background: EnvironmentMap | undefined;
    backgroundIntensity: number;
    /** Direction points from a surface toward the light. */
    private directionalLightValue;
    get directionalLight(): {
        direction: Vector3;
        color: [number, number, number];
        intensity: number;
    };
    set directionalLight(value: {
        direction: Vector3;
        color: [number, number, number];
        intensity: number;
    });
    private readonly registrations;
    private readonly registeredObjects;
    private meshCount;
    private cameraDependents;
    private readonly objectUpdates;
    private nextObjectUpdate;
    private frameObjectUpdate;
    private pointerRouter;
    /** Explicit global-pointer observers; passive scene objects allocate no listener hub. */
    get pointerEvents(): PointerRouter;
    /** @internal Input routing is independent of subclass Scene.update. */
    routePointers(pointer: Pointer, canContinue: () => boolean): void;
    /** @internal Pause/blur/scene disposal cancels captured drags synchronously. */
    resetPointerRouting(): void;
    private owner;
    private controller;
    private disposed;
    get objects(): ReadonlySet<SceneObject>;
    /** @internal Backends skip 3D camera/lighting work for sprite-only scenes. */
    get has3DContent(): boolean;
    get destroyed(): boolean;
    has(object: SceneObject): boolean;
    add<T extends SceneObject>(object: T): T;
    /** @internal Object3D.add registers and publishes the final parent before add events. */
    addChild<T extends Object3D>(object: T, parent: Object3D): T;
    private addObject;
    private register;
    remove(object: SceneObject): boolean;
    private unregister;
    /** @internal A Scene belongs to one Game for its lifetime, including failed preparation. */
    claim(game: Game): AbortSignal;
    /** @internal Abort signals are cooperative; disposal itself is always synchronous. */
    cancel(): void;
    /** @internal Runs once before Game atomically publishes the prepared Scene. */
    prepare(game: Game, signal: AbortSignal): void | Promise<void>;
    private prepareBatch;
    protected preload(game: Game, signal: AbortSignal): PreloadBatch | void | Promise<PreloadBatch | void>;
    protected initialize(game: Game, signal: AbortSignal): void | Promise<void>;
    /** @internal Freeze membership before callbacks; new/re-added objects wait one frame. */
    beginObjectFrame(): void;
    /** @internal Re-entrant lifecycle callbacks cannot revive an object in the same tick. */
    beginObjectUpdates(deltaTime: number, canContinue: () => boolean): void;
    /** @internal Invoked independently of subclass Scene.update. */
    advanceFrameAnimations(deltaTime: number, canContinue: () => boolean): void;
    /** @internal Only queues explicitly accessed by consumers are advanced. */
    advanceActions(deltaTime: number, canContinue: () => boolean): void;
    /** @internal Object updates are never dependent on a subclass calling super. */
    advanceObjects(deltaTime: number, canContinue: () => boolean): void;
    /** @internal Systems/actions run first, physics then particles, final camera last. */
    advanceAfterUpdate(deltaTime: number, canContinue: () => boolean): void;
    /** @internal Billboards, LODs and camera-facing lines follow the final 3D camera pose. */
    updateCameraDependents(): void;
    /** Called before scene systems, once per visible frame. */
    update(deltaTime: number): void;
    /** Fixed gameplay runs immediately before both physics worlds, zero or more times per frame. */
    fixedUpdate(deltaTime: number): void;
    destroy(): void;
    /** Release scene-owned resources synchronously; called exactly once. */
    protected onDestroy(): void;
}
