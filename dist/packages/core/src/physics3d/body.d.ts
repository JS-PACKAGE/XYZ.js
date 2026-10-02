import { Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import { Shape3D } from './collider.js';
export interface RigidBodyOptions3D {
    type?: 'static' | 'dynamic' | 'kinematic';
    mass?: number;
    restitution?: number;
    friction?: number;
    linearDamping?: number;
    angularDamping?: number;
    gravityScale?: number;
    lockRotation?: boolean;
    allowSleep?: boolean;
    /** Opt-in conservative rigid-motion CCD, including rotation and moving-body pairs. */
    continuous?: boolean;
}
/** Root dynamic/kinematic body with analytic primitive or uniform-density compound inertia. */
export declare class RigidBody3D {
    readonly type: 'static' | 'dynamic' | 'kinematic';
    readonly velocity: Vector3;
    readonly angularVelocity: Vector3;
    readonly force: Vector3;
    readonly torque: Vector3;
    /** @internal Invalidates queued frame impulses when the caller clears forces. */
    forceEpoch: number;
    readonly lockRotation: boolean;
    readonly allowSleep: boolean;
    readonly continuous: boolean;
    private owningObject;
    private shape;
    private bodyMass;
    private bounce;
    private surfaceFriction;
    private linearDrag;
    private angularDrag;
    private gravityMultiplier;
    private sleeping;
    private idleTime;
    private readonly sleepPose;
    private readonly inverseDiagonal;
    private readonly inverseTensor;
    private readonly transformed;
    private inertiaRevision;
    private inertiaMass;
    private readonly inertiaScale;
    private inertiaShape;
    constructor(options?: RigidBodyOptions3D);
    get owner(): Object3D | undefined;
    get mass(): number;
    set mass(value: number);
    get restitution(): number;
    set restitution(value: number);
    get friction(): number;
    set friction(value: number);
    get linearDamping(): number;
    set linearDamping(value: number);
    get angularDamping(): number;
    set angularDamping(value: number);
    get gravityScale(): number;
    set gravityScale(value: number);
    get inverseMass(): number;
    get isSleeping(): boolean;
    wake(): void;
    /** @internal */
    updateSleep(dt: number): void;
    /** Explicitly sleep a dynamic body, recording its pose for external-mutation wake detection. */
    sleep(): void;
    /** @internal Attachment ownership survives Scene removal. */
    attach(owner: Object3D): void;
    /** @internal */
    detach(owner: Object3D): void;
    /** @internal Recompute analytic primitive inertia after mutable pose/scale changes. */
    refreshInertia(shape: Shape3D): void;
    private primitiveInertia;
    /** @internal World-space inverse inertia tensor product. */
    inverseInertia(vector: Readonly<Vector3>, out: Vector3): Vector3;
    applyForce(force: Readonly<Vector3>, worldPoint?: Readonly<Vector3>): void;
    applyImpulse(impulse: Readonly<Vector3>, worldPoint?: Readonly<Vector3>): void;
    clearForces(): void;
}
