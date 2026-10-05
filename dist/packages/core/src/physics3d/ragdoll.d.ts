import type { Object3D } from '../object3d.js';
import type { PhysicsWorld3D } from './world.js';
import { type BallSocketJointOptions3D, type HingeJointOptions3D, type Joint3D } from './joints.js';
export interface RagdollBoneMapping3D {
    id: string;
    bone: Object3D;
    body: Object3D;
}
export type RagdollJointOptions3D = ({
    type: 'cone';
    a: string;
    b: string;
} & Omit<BallSocketJointOptions3D, 'bodyA' | 'bodyB'>) | ({
    type: 'hinge';
    a: string;
    b: string;
} & Omit<HingeJointOptions3D, 'bodyA' | 'bodyB'>);
export interface RagdollOptions3D {
    mappings: readonly RagdollBoneMapping3D[];
    joints: readonly RagdollJointOptions3D[];
    /** Registers missing bodies, unregisters only these on destroy. */ registerBodies?: boolean;
}
/** Explicit reference-pose mapping. Existing world cone/hinge impulses are the only rigid solver.
 * Run blend after animation and world update. Bodies remain independent scene roots. */
export declare class Ragdoll3D {
    readonly world: PhysicsWorld3D;
    readonly joints: readonly Joint3D[];
    private readonly bindings;
    private readonly owned;
    private readonly inverse;
    private readonly q;
    private readonly r;
    private disposed;
    constructor(world: PhysicsWorld3D, options: RagdollOptions3D);
    blend(weight?: number): void;
    destroy(): void;
}
