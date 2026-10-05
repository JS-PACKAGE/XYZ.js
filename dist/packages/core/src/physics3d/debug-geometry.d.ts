import { Vector3 } from '../../../math/src/index.js';
import type { Shape3D } from './collider.js';
export type PhysicsDebugSegment3D = Readonly<{
    kind: 'collider' | 'contact' | 'joint';
    from: readonly [number, number, number];
    to: readonly [number, number, number];
}>;
export interface PhysicsDebugSnapshot3D {
    readonly segments: readonly PhysicsDebugSegment3D[];
}
/** Snapshot builder is used only on explicit debug requests, never in the simulation hot path. */
export declare class PhysicsDebugSnapshotBuilder3D {
    private readonly segments;
    line(a: Readonly<Vector3>, b: Readonly<Vector3>, kind?: PhysicsDebugSegment3D['kind']): void;
    shape(shape: Shape3D): void;
    finish(): PhysicsDebugSnapshot3D;
}
