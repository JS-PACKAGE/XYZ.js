import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import type { CharacterController3D } from '../physics3d/character.js';
import { PathFollower3D, type PathFollowerOptions3D } from './follower.js';
import {
  NavigationMesh3D,
  type NavigationMeshPath3D,
  type NavigationMeshLink3D,
} from './mesh.js';

export interface NavigationMeshLinkTraversal3D {
  readonly link: NavigationMeshLink3D;
  readonly from: Readonly<Vector3>;
  readonly to: Readonly<Vector3>;
  readonly controller: CharacterController3D;
  readonly deltaSeconds: number;
}
export interface NavigationMeshFollowerOptions3D extends PathFollowerOptions3D {
  readonly traverseLink?: (
    context: NavigationMeshLinkTraversal3D,
  ) => 'pending' | 'complete' | 'blocked';
}

/** Borrows the mesh and character. Only an explicit handler may execute off-surface links.
 * Revision changes block the route; the caller schedules a new query on the shared scheduler.
 */
export class NavigationMeshFollower3D extends PathFollower3D {
  private mesh: NavigationMesh3D | undefined;
  private route: NavigationMeshPath3D | undefined;
  private readonly traverseLink: NavigationMeshFollowerOptions3D['traverseLink'];
  constructor(
    controller: CharacterController3D,
    options: NavigationMeshFollowerOptions3D = {},
  ) {
    super(controller, options);
    this.traverseLink = options.traverseLink;
  }
  /** Mesh waypoints are feet positions. Supply the character center-to-feet offset explicitly. */
  follow(
    mesh: NavigationMesh3D,
    path: NavigationMeshPath3D,
    centerOffset: number,
  ): void {
    this.assertLive();
    if (
      !mesh.isPathCurrent(path) ||
      path.status !== 'found' ||
      !Number.isFinite(centerOffset) ||
      centerOffset < 0 ||
      centerOffset > navigationLimits.coordinateExtent
    )
      throw new RangeError(
        'A mesh follower requires a current path and finite center offset.',
      );
    super.setPath({
      status: path.status,
      cost: path.cost,
      nodes: path.waypoints.map((waypoint, index) => ({
        id: `${index}`,
        position: new Vector3(
          waypoint.position.x,
          waypoint.position.y + centerOffset,
          waypoint.position.z,
        ),
        surfaceY: waypoint.position.y,
      })),
    });
    this.mesh = mesh;
    this.route = path;
  }
  override setPath(path: Parameters<PathFollower3D['setPath']>[0]): void {
    super.setPath(path);
    this.mesh = undefined;
    this.route = undefined;
  }
  override stop(): void {
    super.stop();
    this.mesh = undefined;
    this.route = undefined;
  }
  override update(deltaSeconds: number): void {
    this.assertLive();
    if (this.route && !this.mesh!.isPathCurrent(this.route)) {
      this.currentState = 'blocked';
      return;
    }
    super.update(deltaSeconds);
  }
  protected override beforeWaypoint(
    index: number,
    deltaSeconds: number,
  ): boolean {
    const route = this.route,
      mesh = this.mesh,
      link = route?.waypoints[index]?.link;
    if (!link || index === 0) return true;
    const result =
      this.traverseLink?.({
        link,
        from: this.waypoints[index - 1]!,
        to: this.waypoints[index]!,
        controller: this.character!,
        deltaSeconds,
      }) ?? 'blocked';
    if (
      this.route !== route ||
      !this.character ||
      this.character.destroyed ||
      this.character.object.destroyed ||
      this.currentState !== 'following' ||
      !mesh!.isPathCurrent(route!)
    )
      return false;
    if (result === 'pending') return false;
    const position = this.character.object.position,
      target = this.waypoints[index]!;
    if (
      result === 'complete' &&
      Math.hypot(
        position.x - target.x,
        position.y - target.y,
        position.z - target.z,
      ) <= this.arrivalTolerance
    ) {
      this.nextWaypoint++;
      if (this.nextWaypoint === this.waypoints.length)
        this.currentState = 'finished';
    } else this.currentState = 'blocked';
    return false;
  }
  override destroy(): void {
    this.mesh = undefined;
    this.route = undefined;
    super.destroy();
  }
}
