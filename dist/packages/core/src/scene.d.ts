import { Vector3 } from '../../math/src/index.js';
import { World } from '../../ecs/src/world.js';
import { Camera2D } from './camera2d.js';
import { PerspectiveCamera } from './perspective-camera.js';
import type { Game } from './game.js';
import { SceneObject } from './scene-object.js';
import { SceneTimers } from './scene-timers.js';
/** Owns objects and their scene-local ECS registrations until synchronous disposal. */
export declare class Scene {
    readonly world: World;
    readonly camera2D: Camera2D;
    readonly camera3D: PerspectiveCamera;
    readonly timers: SceneTimers;
    ambientLight: number;
    /** Direction points from a surface toward the light. */
    directionalLight: {
        direction: Vector3;
        color: [number, number, number];
        intensity: number;
    };
    private readonly registrations;
    private readonly registeredObjects;
    private owner;
    private controller;
    private disposed;
    get objects(): ReadonlySet<SceneObject>;
    get destroyed(): boolean;
    has(object: SceneObject): boolean;
    add<T extends SceneObject>(object: T): T;
    remove(object: SceneObject): boolean;
    /** @internal A Scene belongs to one Game for its lifetime, including failed preparation. */
    claim(game: Game): AbortSignal;
    /** @internal Abort signals are cooperative; disposal itself is always synchronous. */
    cancel(): void;
    /** @internal Runs once before Game atomically publishes the prepared Scene. */
    prepare(game: Game, signal: AbortSignal): void | Promise<void>;
    protected initialize(game: Game, signal: AbortSignal): void | Promise<void>;
    /** Called before scene systems, once per visible frame. */
    update(deltaTime: number): void;
    destroy(): void;
    /** Release scene-owned resources synchronously; called exactly once. */
    protected onDestroy(): void;
}
