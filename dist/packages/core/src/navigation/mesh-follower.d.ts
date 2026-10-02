import { Vector3 } from '../../../math/src/math3d.js';
import type { CharacterController3D } from '../physics3d/character.js';
import { PathFollower3D, type PathFollowerOptions3D } from './follower.js';
import { NavigationMesh3D, type NavigationMeshPath3D, type NavigationMeshLink3D } from './mesh.js';
export interface NavigationMeshLinkTraversal3D {
    readonly link: NavigationMeshLink3D;
    readonly from: Readonly<Vector3>;
    readonly to: Readonly<Vector3>;
    readonly controller: CharacterController3D;
    readonly deltaSeconds: number;
}
export interface NavigationMeshFollowerOptions3D extends PathFollowerOptions3D {
    readonly traverseLink?: (context: NavigationMeshLinkTraversal3D) => 'pending' | 'complete' | 'blocked';
}
/** Borrows the mesh and character. Only an explicit handler may execute off-surface links.
 * Revision changes block the route; the caller schedules a new query on the shared scheduler.
 */
export declare class NavigationMeshFollower3D extends PathFollower3D {
    private mesh;
    private route;
    private readonly traverseLink;
    constructor(controller: CharacterController3D, options?: NavigationMeshFollowerOptions3D);
    /** Mesh waypoints are feet positions. Supply the character center-to-feet offset explicitly. */
    follow(mesh: NavigationMesh3D, path: NavigationMeshPath3D, centerOffset: number): void;
    setPath(path: Parameters<PathFollower3D['setPath']>[0]): void;
    stop(): void;
    update(deltaSeconds: number): void;
    protected beforeWaypoint(index: number, deltaSeconds: number): boolean;
    destroy(): void;
}
