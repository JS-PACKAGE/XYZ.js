import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import type { CharacterController3D } from '../physics3d/character.js';
import type { NavigationGraph3D } from './graph.js';
import type {
  NavigationGraphPath3D,
  NavigationConnection3D,
  NavigationNode3D,
} from './graph.js';
import {
  NavigationScheduler,
  type NavigationScheduledSearch,
} from './scheduler.js';

export type PathFollowerState3D =
  | 'stopped'
  | 'following'
  | 'searching'
  | 'unreachable'
  | 'paused'
  | 'blocked'
  | 'finished'
  | 'destroyed';
export interface PathFollowerOptions3D {
  readonly speed?: number;
  readonly arrivalTolerance?: number;
}

/** Explicitly update from Scene.update. Borrows, never destroys, its physics character. */
export class PathFollower3D {
  protected character: CharacterController3D | undefined;
  protected waypoints: readonly Readonly<Vector3>[] = [];
  protected nextWaypoint = 0;
  protected currentState: PathFollowerState3D = 'stopped';
  private currentSpeed: number;
  protected readonly arrivalTolerance: number;
  private readonly displacement = new Vector3();
  private sampledSurface = false;
  protected samplingVelocity = false;
  private readonly preferredVelocity = new Vector3();

  /** Advances route/search state without moving the borrowed character.
   * Crowd owns movement exclusively; special links block until ordinary following resumes.
   */
  samplePreferredVelocity(deltaSeconds: number, out: Vector3): Vector3 {
    if (this.samplingVelocity)
      throw new Error('Follower sampling is not reentrant.');
    this.preferredVelocity.set(0, 0, 0);
    this.samplingVelocity = true;
    try {
      this.update(deltaSeconds);
      return out.copy(this.preferredVelocity);
    } finally {
      this.samplingVelocity = false;
    }
  }

  get controller(): CharacterController3D | undefined {
    return this.character;
  }

  constructor(
    controller: CharacterController3D,
    options: PathFollowerOptions3D = {},
  ) {
    const speed = options.speed ?? 1;
    const tolerance = options.arrivalTolerance ?? 0.0001;
    if (
      !Number.isFinite(speed) ||
      speed <= 0 ||
      speed > navigationLimits.followerSpeed ||
      !Number.isFinite(tolerance) ||
      tolerance < 0 ||
      tolerance > 1
    )
      throw new RangeError(
        'Path follower requires bounded positive speed and arrival tolerance in [0, 1].',
      );
    this.character = controller;
    this.currentSpeed = speed;
    this.arrivalTolerance = tolerance;
  }

  get state(): PathFollowerState3D {
    return this.currentState;
  }
  get waypointIndex(): number {
    return this.nextWaypoint;
  }
  get speed(): number {
    return this.currentSpeed;
  }
  set speed(value: number) {
    this.assertLive();
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      value > navigationLimits.followerSpeed
    )
      throw new RangeError(
        'Path follower speed exceeds its positive finite bound.',
      );
    this.currentSpeed = value;
  }

  /** Atomically takes an owned snapshot; the route includes its start waypoint. */
  setPath(
    path: Pick<NavigationGraphPath3D, 'status' | 'nodes' | 'cost'>,
  ): void {
    this.assertLive();
    if (
      path.status !== 'found' ||
      path.nodes.length === 0 ||
      path.nodes.length > navigationLimits.partitionNodes ||
      !Number.isFinite(path.cost) ||
      path.cost < 0
    )
      throw new RangeError(
        'Path follower requires a found bounded graph path.',
      );
    const waypoints: Readonly<Vector3>[] = [];
    for (const node of path.nodes) {
      const { x, y, z } = node.position;
      if (
        ![x, y, z].every(
          (value) =>
            Number.isFinite(value) &&
            Math.abs(value) <= navigationLimits.coordinateExtent,
        )
      )
        throw new RangeError(
          'Path follower waypoint exceeds finite coordinate bounds.',
        );
      waypoints.push(Object.freeze(new Vector3(x, y, z)));
    }
    this.waypoints = Object.freeze(waypoints);
    this.sampledSurface = path.nodes.every(
      (node) => node.surfaceY !== undefined,
    );
    this.nextWaypoint = 0;
    this.currentState = 'following';
  }

  pause(): void {
    this.assertLive();
    if (this.currentState === 'following' || this.currentState === 'blocked')
      this.currentState = 'paused';
  }

  /** Explicit resume also retries a blocked route after its obstacle changes. */
  resume(): void {
    this.assertLive();
    if (this.currentState === 'paused' || this.currentState === 'blocked')
      this.currentState = 'following';
  }

  stop(): void {
    this.assertLive();
    this.waypoints = [];
    this.nextWaypoint = 0;
    this.currentState = 'stopped';
  }

  update(deltaSeconds: number): void {
    this.assertLive();
    if (
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds < 0 ||
      !Number.isFinite(deltaSeconds * this.currentSpeed)
    )
      throw new RangeError(
        'Path follower delta must be finite and nonnegative.',
      );
    if (this.currentState !== 'following') return;
    const character = this.character!;
    if (character.object.destroyed) {
      this.stop();
      return;
    }
    let budget = deltaSeconds * this.currentSpeed;
    while (this.nextWaypoint < this.waypoints.length) {
      if (!this.beforeWaypoint(this.nextWaypoint, deltaSeconds)) return;
      const target = this.waypoints[this.nextWaypoint]!;
      const position = character.object.position;
      this.displacement.set(
        target.x - position.x,
        target.y - position.y,
        target.z - position.z,
      );
      const supportSurface =
        this.sampledSurface || (character.grounded && this.displacement.y <= 0);
      const verticalTolerance = supportSurface
        ? character.skin + navigationLimits.bakeSkin
        : 0;
      if (
        supportSurface &&
        this.displacement.y <= 0 &&
        Math.abs(this.displacement.y) <= verticalTolerance
      )
        this.displacement.y = 0;
      const distance = this.displacement.length();
      if (distance <= this.arrivalTolerance) {
        this.nextWaypoint++;
        continue;
      }
      if (budget <= 0) return;
      // Execute the same swept raise-then-traverse corridor certified by the bake.
      // A partial diagonal step can hit a tread corner before the controller's
      // grounded step probe has enough horizontal travel to find the next support.
      if (
        this.sampledSurface &&
        this.displacement.y > 0 &&
        this.displacement.y <= character.stepHeight + character.skin
      ) {
        this.displacement.x = this.displacement.z = 0;
        this.displacement.y += character.skin;
      }
      // Descending diagonally enters the old tread before leaving it. Traverse
      // the already-swept horizontal corridor first, then lower onto the destination.
      if (
        this.sampledSurface &&
        this.displacement.y < 0 &&
        Math.hypot(this.displacement.x, this.displacement.z) >
          this.arrivalTolerance
      )
        this.displacement.y = 0;
      const movementDistance = this.displacement.length();
      const step = Math.min(movementDistance, budget);
      this.displacement.scale(step / movementDistance);
      if (this.samplingVelocity) {
        if (deltaSeconds > 0)
          this.preferredVelocity
            .copy(this.displacement)
            .scale(1 / deltaSeconds);
        return;
      }
      const movement = character.move(this.displacement);
      budget = Math.max(0, budget - step);
      const remaining = Math.hypot(
        target.x - position.x,
        supportSurface && Math.abs(target.y - position.y) <= verticalTolerance
          ? 0
          : target.y - position.y,
        target.z - position.z,
      );
      if (remaining <= this.arrivalTolerance) {
        this.nextWaypoint++;
        continue;
      }
      // The controller reports actual obstruction. A tiny residual budget can
      // legitimately produce no displacement below its motion tolerance.
      if (movement.blocked) {
        this.currentState = 'blocked';
        return;
      }
      if (
        movement.displacement.x === 0 &&
        movement.displacement.y === 0 &&
        movement.displacement.z === 0
      )
        return;
    }
    this.currentState = 'finished';
  }

  destroy(): void {
    if (this.currentState === 'destroyed') return;
    this.waypoints = [];
    this.character = undefined;
    this.nextWaypoint = 0;
    this.displacement.set(0, 0, 0);
    this.currentState = 'destroyed';
  }

  /** Navigation special links can suspend ordinary capsule movement at a segment boundary. */
  protected beforeWaypoint(index: number, deltaSeconds: number): boolean;
  protected beforeWaypoint(): boolean {
    return true;
  }
  protected assertLive(): void {
    if (this.currentState === 'destroyed')
      throw new Error('Path follower is destroyed.');
  }
}

export interface NavigationFollowerOptions3D extends PathFollowerOptions3D {
  /** Standalone scheduler work budget; Scene-bound searches use the Scene aggregate budget. */
  readonly expansionBudget?: number;
  /** Total replans per navigate call, including revision invalidations. */
  readonly maxReplans?: number;
  /** Searches share the Scene scheduler by default; movement remains explicitly updated. */
  readonly scheduler?: NavigationScheduler;
  /** Called once per update while a special link is active. Handler owns actual elevator/ladder
   * motion; completion is accepted only at the destination. No handler means blocked/replan.
   */
  readonly traverseLink?: (
    context: NavigationLinkTraversal3D,
  ) => 'pending' | 'complete' | 'blocked';
}
export interface NavigationRoute3D {
  readonly graph: Pick<
    NavigationGraph3D,
    | 'scheduleSearch'
    | 'revision'
    | 'destroyed'
    | 'connections'
    | 'getConnectionIndex'
  >;
  /** Explicit authored anchor; the character must be able to return to it. */
  readonly start: string;
  readonly goal: string;
  readonly agentRadius: number;
}
export interface NavigationLinkTraversal3D {
  readonly connection: NavigationConnection3D;
  readonly from: NavigationNode3D;
  readonly to: NavigationNode3D;
  readonly controller: CharacterController3D;
  readonly deltaSeconds: number;
}

/** Borrowed graph/controller; bounded jobs are owned and cancelled with this follower. */
export class NavigationFollower3D extends PathFollower3D {
  private route: NavigationRoute3D | undefined;
  private path: NavigationGraphPath3D | undefined;
  private job: NavigationScheduledSearch<NavigationGraphPath3D> | undefined;
  private anchor = '';
  private readonly excluded = new Set<number>();
  private observedRevision = 0;
  private retries = 0;
  private physicallyBlocked = false;
  private pausedState: PathFollowerState3D = 'stopped';
  readonly expansionBudget: number;
  readonly maxReplans: number;
  readonly scheduler: NavigationScheduler;
  private readonly ownsScheduler: boolean;
  private readonly traverseLink: NavigationFollowerOptions3D['traverseLink'];

  constructor(
    controller: CharacterController3D,
    options: NavigationFollowerOptions3D = {},
  ) {
    super(controller, options);
    this.traverseLink = options.traverseLink;
    const budget =
      options.expansionBudget ?? navigationLimits.followerExpansions;
    const retries = options.maxReplans ?? navigationLimits.followerReplans;
    if (
      !Number.isInteger(budget) ||
      budget < 1 ||
      budget > navigationLimits.expansionsPerStep ||
      !Number.isInteger(retries) ||
      retries < 0 ||
      retries > navigationLimits.followerReplans
    )
      throw new RangeError(
        'Navigation follower requires bounded expansion and replan budgets.',
      );
    this.expansionBudget = budget;
    this.maxReplans = retries;
    const sceneScheduler =
      options.scheduler === undefined
        ? controller.object.scene?.navigation
        : undefined;
    this.ownsScheduler =
      options.scheduler === undefined && sceneScheduler === undefined;
    this.scheduler =
      options.scheduler ??
      sceneScheduler ??
      new NavigationScheduler({ workBudget: budget });
  }

  get replanCount(): number {
    return this.retries;
  }
  get searchJob():
    NavigationScheduledSearch<NavigationGraphPath3D> | undefined {
    return this.job;
  }

  /** Starts an incremental query, never computes a complete route synchronously. */
  navigate(route: NavigationRoute3D): void {
    this.assertLive();
    const controller = this.character!;
    if (
      controller.destroyed ||
      controller.object.destroyed ||
      !controller.world.has(controller.object)
    )
      throw new Error('Navigation requires a registered live character.');
    if (
      !Number.isFinite(route.agentRadius) ||
      route.agentRadius < 0 ||
      route.agentRadius > navigationLimits.coordinateExtent
    )
      throw new RangeError(
        'Navigation requires a nonnegative finite agent radius.',
      );
    const job = route.graph.scheduleSearch(
      this.scheduler,
      route.start,
      route.goal,
      {
        agentRadius: route.agentRadius,
      },
    );
    this.stop();
    this.route = Object.freeze({ ...route });
    this.anchor = route.start;
    this.observedRevision = route.graph.revision;
    this.job = job;
    this.currentState = 'searching';
  }

  override setPath(
    path: Pick<NavigationGraphPath3D, 'status' | 'nodes' | 'cost'>,
  ): void {
    // Validate before retiring the active navigation contract.
    super.setPath(path);
    this.clearNavigation();
  }

  override pause(): void {
    this.assertLive();
    if (this.currentState !== 'paused' && this.currentState !== 'destroyed') {
      this.pausedState = this.currentState;
      this.currentState = 'paused';
    }
  }

  override resume(): void {
    this.assertLive();
    if (!this.route) {
      super.resume();
      return;
    }
    if (this.currentState === 'paused') this.currentState = this.pausedState;
  }

  override stop(): void {
    super.stop();
    this.clearNavigation();
  }

  override update(deltaSeconds: number): void {
    this.assertLive();
    if (
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds < 0 ||
      !Number.isFinite(deltaSeconds * this.speed)
    )
      throw new RangeError(
        'Path follower delta must be finite and nonnegative.',
      );
    if (this.ownsScheduler) this.scheduler.update(this.expansionBudget);
    const controller = this.character!;
    if (
      controller.object.destroyed ||
      !controller.world.has(controller.object) ||
      controller.destroyed
    ) {
      this.stop();
      return;
    }
    const route = this.route;
    if (!route) {
      super.update(deltaSeconds);
      return;
    }
    if (route.graph.destroyed) {
      this.stop();
      return;
    }
    if (this.currentState === 'paused' || this.currentState === 'finished')
      return;
    if (this.observedRevision !== route.graph.revision) {
      this.excluded.clear();
      this.observedRevision = route.graph.revision;
      this.beginReplan();
      return;
    }
    if (this.currentState === 'searching') {
      const job = this.job!;
      if (job.status === 'pending') return;
      this.job = undefined;
      if (job.status === 'cancelled') {
        this.stop();
      } else if (job.status === 'invalidated') {
        this.beginReplan();
      } else if (job.status === 'unreachable') {
        this.path = undefined;
        this.waypoints = [];
        this.currentState = this.physicallyBlocked ? 'blocked' : 'unreachable';
      } else {
        this.path = job.result!;
        super.setPath(this.path);
      }
      // Movement starts on the next update; a search tick never spends a second budget.
      return;
    }
    if (this.currentState !== 'following') return;
    super.update(deltaSeconds);
    const path = this.path;
    if (!path) return;
    if (this.nextWaypoint > 0)
      this.anchor =
        path.nodes[Math.min(this.nextWaypoint - 1, path.nodes.length - 1)]!.id;
    if (this.state === 'blocked') {
      this.physicallyBlocked = true;
      if (this.nextWaypoint > 0 && this.nextWaypoint < path.nodes.length) {
        const edge = route.graph.getConnectionIndex(
          path.nodes[this.nextWaypoint - 1]!.id,
          path.nodes[this.nextWaypoint]!.id,
        );
        if (edge !== undefined) this.excluded.add(edge);
      }
      this.beginReplan();
    }
  }

  protected override beforeWaypoint(
    index: number,
    deltaSeconds: number,
  ): boolean {
    const path = this.path,
      route = this.route;
    if (!path || !route || index === 0) return true;
    const from = path.nodes[index - 1]!,
      to = path.nodes[index]!;
    const connectionIndex = route.graph.getConnectionIndex(from.id, to.id);
    if (connectionIndex === undefined) {
      this.currentState = 'blocked';
      return false;
    }
    const connection = route.graph.connections[connectionIndex]!;
    if (connection.kind !== 'special') return true;
    if (this.samplingVelocity) return false;
    const result =
      this.traverseLink?.({
        connection,
        from,
        to,
        controller: this.character!,
        deltaSeconds,
      }) ?? 'blocked';
    if (
      this.route !== route ||
      !this.character ||
      this.character.destroyed ||
      this.currentState !== 'following' ||
      route.graph.destroyed ||
      route.graph.revision !== path.revision
    )
      return false;
    if (result === 'pending') return false;
    const position = this.character!.object.position;
    if (
      result === 'complete' &&
      Math.hypot(
        position.x - to.position.x,
        position.y - to.position.y,
        position.z - to.position.z,
      ) <= this.arrivalTolerance
    ) {
      this.nextWaypoint++;
      if (this.nextWaypoint === this.waypoints.length)
        this.currentState = 'finished';
      return false;
    }
    this.currentState = 'blocked';
    return false;
  }
  override destroy(): void {
    this.clearNavigation();
    this.scheduler.removeFollower(this);
    if (this.ownsScheduler) this.scheduler.destroy();
    super.destroy();
  }

  private beginReplan(): void {
    this.job?.cancel();
    this.job = undefined;
    this.path = undefined;
    this.waypoints = [];
    this.nextWaypoint = 0;
    this.currentState = 'blocked';
    if (this.retries >= this.maxReplans) {
      return;
    }
    this.retries++;
    const route = this.route!;
    this.job = route.graph.scheduleSearch(
      this.scheduler,
      this.anchor,
      route.goal,
      {
        agentRadius: route.agentRadius,
        excludedConnections: [...this.excluded],
      },
    );
    this.currentState = 'searching';
  }

  private clearNavigation(): void {
    this.job?.cancel();
    this.job = undefined;
    this.route = undefined;
    this.path = undefined;
    this.anchor = '';
    this.excluded.clear();
    this.retries = 0;
    this.physicallyBlocked = false;
  }
}
