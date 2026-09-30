import { Vector2 } from '../../../math/src/index.js';
import type { Pointer } from '../../../input/src/index.js';
import { GameObject } from '../game-object.js';
import type { Scene } from '../scene.js';
export interface PointerTargetEventDetail {
    pointerId: number;
    button: number;
    screen: Vector2;
    world: Vector2;
    target: GameObject;
    originalEvent?: PointerEvent;
}
/** Scene-local targeting. DOM capture and aggregate polling remain owned by Pointer. */
export declare class PointerRouter {
    private readonly scene;
    private readonly targets;
    private readonly states;
    private readonly dragging;
    private readonly world;
    private readonly local;
    private readonly inverse;
    private resetVersion;
    private disposed;
    constructor(scene: Scene);
    private alive;
    private pick;
    private dispatch;
    private hover;
    private parentPoint;
    private endDrag;
    private cancel;
    /** @internal Called after membership removal, including synchronous destruction. */
    forget(object: GameObject): void;
    reset(): void;
    destroy(): void;
    update(pointer: Pointer, canContinue: () => boolean): void;
}
