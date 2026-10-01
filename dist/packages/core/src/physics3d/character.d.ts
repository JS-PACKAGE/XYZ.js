import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { PhysicsHit3D } from './world.js';
import { PhysicsWorld3D } from './world.js';
export interface CharacterControllerOptions3D {
    skin?: number;
    stepHeight?: number;
    maxSlopeAngle?: number;
    groundSnap?: number;
    pushStrength?: number;
    maxIterations?: number;
    mask?: number;
    maxRecoveryDistance?: number;
}
/** Borrowed reusable result, valid until the next move. */
export interface CharacterMoveResult3D {
    readonly displacement: Readonly<Vector3>;
    readonly grounded: boolean;
    readonly blocked: boolean;
    readonly contacts: readonly PhysicsHit3D[];
}
/** Upright root capsule sweep/slide controller; caller supplies gravity/jump displacement and simulation delta. */
export declare class CharacterController3D {
    readonly object: Object3D;
    readonly world: PhysicsWorld3D;
    readonly skin: number;
    readonly stepHeight: number;
    readonly maxSlopeAngle: number;
    readonly groundSnap: number;
    readonly pushStrength: number;
    readonly maxIterations: number;
    readonly maxRecoveryDistance: number;
    private groundedState;
    private disposed;
    private createdBody;
    private readonly remaining;
    private readonly motion;
    private readonly start;
    private readonly stepStart;
    private readonly applied;
    private readonly stepHorizontal;
    private readonly query;
    private readonly hit;
    private readonly contacts;
    private readonly contactPool;
    private readonly result;
    constructor(object: Object3D, world: PhysicsWorld3D, options?: CharacterControllerOptions3D);
    get grounded(): boolean;
    get destroyed(): boolean;
    private assertPose;
    private remember;
    private advance;
    private probe;
    private tryStep;
    move(displacement: Readonly<Vector3>): CharacterMoveResult3D;
    destroy(): void;
}
