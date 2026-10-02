import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import type { CharacterController3D } from '../physics3d/character.js';
import { NavigationGraph3D } from './graph.js';
import type { NavigationGraphPath3D } from './graph.js';
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
  private readonly arrivalTolerance: number;
  private readonly displacement = new Vector3();

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
      path.nodes.length > navigationLimits.graphNodes ||
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
      const target = this.waypoints[this.nextWaypoint]!;
      const position = character.object.position;
      this.displacement.set(
        target.x - position.x,
        target.y - position.y,
        target.z - position.z,
      );
      const distance = this.displacement.length();
      if (distance <= this.arrivalTolerance) {
        this.nextWaypoint++;
        continue;
      }
      if (budget <= 0) return;
      const step = Math.min(distance, budget);
      this.displacement.scale(step / distance);
      const movement = character.move(this.displacement);
      budget = Math.max(0, budget - step);
      const remaining = Math.hypot(
        target.x - position.x,
        target.y - position.y,
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
}
export interface NavigationRoute3D {
  readonly graph: NavigationGraph3D;
  /** Explicit authored anchor; the character must be able to return to it. */
  readonly start: string;
  readonly goal: string;
  readonly agentRadius: number;
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

  constructor(
    controller: CharacterController3D,
    options: NavigationFollowerOptions3D = {},
  ) {
    super(controller, options);
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
