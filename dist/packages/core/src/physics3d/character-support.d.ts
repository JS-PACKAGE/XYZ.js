import { Matrix4, Quaternion, Vector3 } from '../../../math/src/index.js';
/** Controller-owned rigid support snapshot; no Object3D pose is temporarily replaced. */
export declare class CharacterSupportPose3D {
    readonly matrix: Matrix4;
    readonly position: Vector3;
    readonly rotation: Quaternion;
    readonly scale: Vector3;
    capture(matrix: Matrix4): void;
    angleTo(next: CharacterSupportPose3D): number;
    /** Shortest quaternion arc, with linear translation and fixed support scale. */
    interpolatePoint(next: CharacterSupportPose3D, local: Vector3, t: number, out: Vector3): void;
}
