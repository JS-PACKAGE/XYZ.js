import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import type { CharacterController3D } from '../physics3d/character.js';
import type { NavigationGraphPath3D } from './graph.js';

export type PathFollowerState3D =
  'stopped' | 'following' | 'paused' | 'blocked' | 'finished' | 'destroyed';
export interface PathFollowerOptions3D {
  readonly speed?: number;
  readonly arrivalTolerance?: number;
}

/** Explicitly update from Scene.update. Borrows, never destroys, its physics character. */
export class PathFollower3D {
  private character: CharacterController3D | undefined;
  private waypoints: readonly Readonly<Vector3>[] = [];
  private nextWaypoint = 0;
  private currentState: PathFollowerState3D = 'stopped';
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
  setPath(path: NavigationGraphPath3D): void {
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
      if (
        movement.blocked ||
        Math.hypot(
          movement.displacement.x,
          movement.displacement.y,
          movement.displacement.z,
        ) <=
          step * 1e-10
      ) {
        this.currentState = 'blocked';
        return;
      }
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

  private assertLive(): void {
    if (this.currentState === 'destroyed')
      throw new Error('Path follower is destroyed.');
  }
}
