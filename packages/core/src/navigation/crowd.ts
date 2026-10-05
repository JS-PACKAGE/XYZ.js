import { Vector3 } from '../../../math/src/math3d.js';
import { Vector2 } from '../../../math/src/index.js';
import { crowdLimits } from '../../../../src/data/crowd.js';
import type { CharacterController3D } from '../physics3d/character.js';
import type { CharacterController2D } from '../physics2d/character.js';
import type { PathFollower3D } from './follower.js';
import { CapsuleCollider3D } from '../physics3d/collider.js';

export interface CrowdOptions {
  maxAgents?: number;
  maxObstacles?: number;
  maxNeighbors?: number;
  neighborDistance?: number;
  timeHorizon?: number;
}
export interface CrowdAgentOptions {
  /** Explicit stable positive integer; registration order does not affect solve order. */
  id: number;
  radius: number;
  maxSpeed: number;
  follower?: PathFollower3D;
  /** Write desired velocity into out. 2D maps world XY onto solver XZ. */
  preferredVelocity?: (deltaSeconds: number, out: Vector3) => void;
}
export type CrowdAgentState =
  'moving' | 'idle' | 'blocked' | 'budget-exceeded' | 'removed';
export interface CrowdRegistration {
  readonly id: number;
  readonly velocity: Readonly<Vector3>;
  readonly state: CrowdAgentState;
  remove(): void;
}
interface Agent extends CrowdRegistration {
  state: CrowdAgentState;
  velocity: Vector3;
  preferred: Vector3;
  next: Vector3;
  x: number;
  z: number;
  radius: number;
  maxSpeed: number;
  options: CrowdAgentOptions;
  controller3D?: CharacterController3D;
  controller2D?: CharacterController2D;
}
interface Disc {
  id: number;
  x: number;
  z: number;
  radius: number;
}
interface Line {
  nx: number;
  nz: number;
  b: number;
}

function positive(value: number, name: string, maximum = Infinity): number {
  if (!Number.isFinite(value) || value <= 0 || value > maximum)
    throw new RangeError(`Invalid crowd ${name}.`);
  return value;
}
function integer(value: number, name: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum)
    throw new RangeError(`Invalid crowd ${name}.`);
  return value;
}

/** Bounded disc ORCA on a plane, with exact nearest feasible half-plane/speed-disc solve.
 * No pathfinding or animation ownership. Call once from Scene.fixedUpdate(dt, scene.fixedFrame).
 * Borrowed controllers remain owned by caller. Never also update registered followers/locomotion.
 * Crowded cells fail closed rather than silently discarding nearby agents. Physical geometry
 * remains authoritative via controller sweeps; obstacle discs are explicit conservative proxies.
 */
export class CrowdSolver {
  readonly maxAgents: number;
  readonly maxObstacles: number;
  readonly maxNeighbors: number;
  readonly neighborDistance: number;
  readonly timeHorizon: number;
  private readonly agents = new Map<number, Agent>();
  private readonly obstacles = new Map<number, Disc>();
  private readonly ordered: Agent[] = [];
  private readonly grid = new Map<string, (Agent | Disc)[]>();
  private readonly buckets: (Agent | Disc)[][] = [];
  private readonly neighbors: (Agent | Disc)[] = [];
  private readonly lines: Line[];
  private readonly displacement = new Vector3();
  private readonly displacement2D = new Vector2();
  private readonly movementOptions = { epoch: 0 };
  private epoch: number | undefined;
  private disposed = false;
  private updating = false;
  private readonly candidateScratch = {
    best: Infinity,
    x: 0,
    z: 0,
    count: 0,
    px: 0,
    pz: 0,
    speed: 0,
  };

  constructor(options: CrowdOptions = {}) {
    this.maxAgents = integer(
      options.maxAgents ?? 256,
      'agent budget',
      crowdLimits.agents,
    );
    this.maxObstacles = integer(
      options.maxObstacles ?? 256,
      'obstacle budget',
      crowdLimits.obstacles,
    );
    this.maxNeighbors = integer(
      options.maxNeighbors ?? 16,
      'neighbor budget',
      crowdLimits.neighbors,
    );
    this.neighborDistance = positive(
      options.neighborDistance ?? 10,
      'neighbor distance',
    );
    this.timeHorizon = positive(
      options.timeHorizon ?? 2,
      'time horizon',
      crowdLimits.timeHorizon,
    );
    this.lines = Array.from({ length: this.maxNeighbors }, () => ({
      nx: 0,
      nz: 0,
      b: 0,
    }));
  }

  register3D(
    controller: CharacterController3D,
    options: CrowdAgentOptions,
  ): CrowdRegistration {
    if (options.follower && options.follower.controller !== controller)
      throw new Error('Crowd follower must borrow the registered controller.');
    if (
      !(controller.object.collider instanceof CapsuleCollider3D) ||
      options.radius < controller.object.collider.radius + controller.skin
    )
      throw new RangeError(
        'Crowd radius must enclose the character capsule and skin.',
      );
    return this.register(controller, undefined, options);
  }
  /** Top-down XY adapter only, not a platformer/navmesh equivalence. Radius must enclose collider. */
  register2D(
    controller: CharacterController2D,
    options: CrowdAgentOptions,
  ): CrowdRegistration {
    if (options.follower)
      throw new Error('3D route followers cannot drive a 2D controller.');
    return this.register(undefined, controller, options);
  }
  private register(
    controller3D: CharacterController3D | undefined,
    controller2D: CharacterController2D | undefined,
    options: CrowdAgentOptions,
  ): CrowdRegistration {
    if (this.disposed || this.updating)
      throw new Error('Crowd registration requires a live idle solver.');
    integer(options.id, 'stable ID', Number.MAX_SAFE_INTEGER);
    positive(options.radius, 'radius', this.neighborDistance / 2);
    positive(options.maxSpeed, 'speed', crowdLimits.speed);
    // Every possible collision over the configured horizon must be inside the query radius.
    if (
      2 * options.radius + 2 * options.maxSpeed * this.timeHorizon >
      this.neighborDistance
    )
      throw new RangeError(
        'Neighbor distance must cover diameter plus twice speed times horizon.',
      );
    if (this.agents.has(options.id) || this.obstacles.has(options.id))
      throw new Error('Duplicate crowd ID.');
    if (this.agents.size >= this.maxAgents)
      throw new RangeError('Crowd agent budget exceeded.');
    for (const agent of this.agents.values()) {
      if (
        (agent.controller3D === controller3D && controller3D) ||
        (agent.controller2D === controller2D && controller2D)
      )
        throw new Error('A controller may be registered only once.');
      if (!!agent.controller3D !== !!controller3D)
        throw new Error('Use separate solvers for XY and XZ worlds.');
    }
    const agent: Agent = {
      id: options.id,
      radius: options.radius,
      maxSpeed: options.maxSpeed,
      options: { ...options },
      controller3D,
      controller2D,
      x: 0,
      z: 0,
      state: 'idle',
      velocity: new Vector3(),
      preferred: new Vector3(),
      next: new Vector3(),
      remove: () => {
        if (this.updating)
          throw new Error(
            'Remove crowd registrations outside update callbacks.',
          );
        agent.state = 'removed';
        agent.velocity.set(0, 0, 0);
        this.agents.delete(agent.id);
      },
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  addObstacle(
    id: number,
    center: Readonly<Vector3>,
    radius: number,
  ): () => void {
    if (this.disposed || this.updating)
      throw new Error(
        'Crowd obstacle registration requires a live idle solver.',
      );
    integer(id, 'stable ID', Number.MAX_SAFE_INTEGER);
    positive(radius, 'obstacle radius', this.neighborDistance / 2);
    if (!Number.isFinite(center.x) || !Number.isFinite(center.z))
      throw new RangeError('Invalid obstacle center.');
    const cellX = Math.floor(center.x / this.neighborDistance),
      cellZ = Math.floor(center.z / this.neighborDistance);
    if (
      !Number.isSafeInteger(cellX) ||
      !Number.isSafeInteger(cellZ) ||
      Math.abs(cellX) >= Number.MAX_SAFE_INTEGER ||
      Math.abs(cellZ) >= Number.MAX_SAFE_INTEGER
    )
      throw new RangeError(
        'Crowd position exceeds representable neighbor-grid coordinates.',
      );
    if (this.agents.has(id) || this.obstacles.has(id))
      throw new Error('Duplicate crowd ID.');
    if (this.obstacles.size >= this.maxObstacles)
      throw new RangeError('Crowd obstacle budget exceeded.');
    this.obstacles.set(id, { id, x: center.x, z: center.z, radius });
    return () => {
      if (this.updating)
        throw new Error('Remove crowd obstacles outside update callbacks.');
      this.obstacles.delete(id);
    };
  }

  update(deltaSeconds: number, epoch: number): void {
    if (this.disposed || this.updating)
      throw new Error('Crowd update requires a live idle solver.');
    if (
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds <= 0 ||
      deltaSeconds > crowdLimits.deltaSeconds
    )
      throw new RangeError(
        'Crowd requires fixed delta within (0, 0.1] seconds.',
      );
    if (
      !Number.isSafeInteger(epoch) ||
      epoch < 0 ||
      (this.epoch !== undefined && epoch < this.epoch)
    )
      throw new RangeError('Crowd epoch must be monotonic and nonnegative.');
    if (epoch === this.epoch) return;
    this.updating = true;
    try {
      this.ordered.length = 0;
      for (const agent of this.agents.values()) {
        const controller = agent.controller3D ?? agent.controller2D!;
        if (controller.destroyed || controller.object.destroyed) {
          agent.state = 'removed';
          this.agents.delete(agent.id);
          continue;
        }
        const position = controller.object.position;
        agent.x = position.x;
        agent.z = agent.controller3D ? (position as Vector3).z : position.y;
        agent.preferred.set(0, 0, 0);
        if (agent.options.follower)
          agent.options.follower.samplePreferredVelocity(
            deltaSeconds,
            agent.preferred,
          );
        else agent.options.preferredVelocity?.(deltaSeconds, agent.preferred);
        if (
          !Number.isFinite(agent.x) ||
          !Number.isFinite(agent.z) ||
          !Number.isFinite(agent.preferred.x) ||
          !Number.isFinite(agent.preferred.y) ||
          !Number.isFinite(agent.preferred.z)
        )
          throw new RangeError(
            'Crowd positions and preferred velocities must be finite.',
          );
        // Neighbor queries add +/-1; all cell arithmetic must remain exact.
        const cellX = Math.floor(agent.x / this.neighborDistance),
          cellZ = Math.floor(agent.z / this.neighborDistance);
        if (
          !Number.isSafeInteger(cellX) ||
          !Number.isSafeInteger(cellZ) ||
          Math.abs(cellX) >= Number.MAX_SAFE_INTEGER ||
          Math.abs(cellZ) >= Number.MAX_SAFE_INTEGER
        )
          throw new RangeError(
            'Crowd position exceeds representable neighbor-grid coordinates.',
          );
        const speed = agent.preferred.length();
        if (speed > agent.maxSpeed) {
          agent.preferred.x *= agent.maxSpeed / speed;
          agent.preferred.y *= agent.maxSpeed / speed;
          agent.preferred.z *= agent.maxSpeed / speed;
        }
        this.ordered.push(agent);
      }
      this.ordered.sort((a, b) => a.id - b.id);
      for (const bucket of this.grid.values()) {
        bucket.length = 0;
        this.buckets.push(bucket);
      }
      this.grid.clear();
      for (const disc of this.ordered) this.insertDisc(disc);
      for (const disc of this.obstacles.values()) this.insertDisc(disc);
      for (const agent of this.ordered) this.solve(agent, deltaSeconds);
      let overflow = false;
      for (const agent of this.ordered)
        if (agent.state === 'budget-exceeded') overflow = true;
      // Reciprocity is invalid if an overflowing participant cannot solve its share.
      // Freeze the epoch globally instead of letting neighbors assume that it will yield.
      if (overflow)
        for (const agent of this.ordered) {
          agent.next.set(0, 0, 0);
          agent.state = 'budget-exceeded';
        }
      this.movementOptions.epoch = epoch;
      for (const agent of this.ordered) {
        this.displacement.set(
          agent.next.x * deltaSeconds,
          agent.state === 'budget-exceeded' || agent.state === 'blocked'
            ? 0
            : agent.preferred.y * deltaSeconds,
          agent.next.z * deltaSeconds,
        );
        const result = agent.controller3D
          ? agent.controller3D.move(this.displacement, this.movementOptions)
          : agent.controller2D!.move(
              this.displacement2D.set(this.displacement.x, this.displacement.z),
              this.movementOptions,
            );
        agent.velocity.set(
          result.locomotionDisplacement.x / deltaSeconds,
          0,
          agent.controller3D
            ? (result.locomotionDisplacement as Vector3).z / deltaSeconds
            : result.locomotionDisplacement.y / deltaSeconds,
        );
        if (result.blocked || result.unresolvedPenetration)
          agent.state = 'blocked';
      }
      this.epoch = epoch;
    } finally {
      this.updating = false;
    }
  }

  private insertDisc(disc: Agent | Disc): void {
    const key = `${Math.floor(disc.x / this.neighborDistance)},${Math.floor(disc.z / this.neighborDistance)}`;
    let bucket = this.grid.get(key);
    if (!bucket) {
      bucket = this.buckets.pop() ?? [];
      this.grid.set(key, bucket);
    }
    bucket.push(disc);
  }

  private solve(agent: Agent, delta: number): void {
    this.neighbors.length = 0;
    const cx = Math.floor(agent.x / this.neighborDistance),
      cz = Math.floor(agent.z / this.neighborDistance);
    for (let x = cx - 1; x <= cx + 1; x++)
      for (let z = cz - 1; z <= cz + 1; z++) {
        const bucket = this.grid.get(`${x},${z}`);
        if (!bucket) continue;
        for (const other of bucket) {
          if (
            other === agent ||
            Math.hypot(other.x - agent.x, other.z - agent.z) >
              this.neighborDistance
          )
            continue;
          this.neighbors.push(other);
          if (this.neighbors.length > this.maxNeighbors) {
            agent.next.set(0, 0, 0);
            agent.state = 'budget-exceeded';
            return;
          }
        }
      }
    this.neighbors.sort((a, b) => a.id - b.id);
    let count = 0;
    for (const other of this.neighbors) {
      const dynamic = 'velocity' in other;
      const px = other.x - agent.x,
        pz = other.z - agent.z;
      const vx = agent.velocity.x - (dynamic ? other.velocity.x : 0);
      const vz = agent.velocity.z - (dynamic ? other.velocity.z : 0);
      const radius = agent.radius + other.radius + 0.002;
      const distance2 = px * px + pz * pz,
        radius2 = radius * radius;
      let dx: number, dz: number, ux: number, uz: number;
      const inv = 1 / (distance2 > radius2 ? this.timeHorizon : delta);
      const wx = vx - px * inv,
        wz = vz - pz * inv;
      const w2 = wx * wx + wz * wz,
        dot = wx * px + wz * pz;
      if (distance2 <= radius2 || (dot < 0 && dot * dot > radius2 * w2)) {
        const length = Math.sqrt(w2);
        // Coincident centers have a deterministic antisymmetric separating axis.
        const nx =
          length > crowdLimits.epsilon
            ? wx / length
            : agent.id < other.id
              ? -1
              : 1;
        const nz = length > crowdLimits.epsilon ? wz / length : 0;
        dx = nz;
        dz = -nx;
        ux = (radius * inv - length) * nx;
        uz = (radius * inv - length) * nz;
      } else {
        const leg = Math.sqrt(Math.max(0, distance2 - radius2));
        if (px * wz - pz * wx > 0) {
          dx = (px * leg - pz * radius) / distance2;
          dz = (px * radius + pz * leg) / distance2;
        } else {
          dx = -(px * leg + pz * radius) / distance2;
          dz = -(-px * radius + pz * leg) / distance2;
        }
        const projection = vx * dx + vz * dz;
        ux = projection * dx - vx;
        uz = projection * dz - vz;
      }
      const line = this.lines[count++]!;
      line.nx = -dz;
      line.nz = dx;
      const share = dynamic ? 0.5 : 1;
      line.b =
        line.nx * (agent.velocity.x + share * ux) +
        line.nz * (agent.velocity.z + share * uz);
    }
    // A small deterministic right-hand passing preference breaks exact head-on symmetry.
    const bias = count > 0 ? 0.05 : 0;
    let px = agent.preferred.x - agent.preferred.z * bias;
    let pz = agent.preferred.z + agent.preferred.x * bias;
    const speed = Math.sqrt(
      Math.max(0, agent.maxSpeed ** 2 - agent.preferred.y ** 2),
    );
    const preferredSpeed = Math.hypot(px, pz);
    if (preferredSpeed > speed) {
      px *= speed / preferredSpeed;
      pz *= speed / preferredSpeed;
    }
    const scratch = this.candidateScratch;
    scratch.best = Infinity;
    scratch.x = scratch.z = 0;
    scratch.count = count;
    scratch.px = px;
    scratch.pz = pz;
    scratch.speed = speed;
    this.candidate(px, pz);
    this.candidate(0, 0);
    for (let i = 0; i < count; i++) {
      const a = this.lines[i]!;
      const offset = a.b - a.nx * px - a.nz * pz;
      this.candidate(px + offset * a.nx, pz + offset * a.nz);
      const along2 = speed * speed - a.b * a.b;
      if (along2 >= 0) {
        const along = Math.sqrt(along2);
        this.candidate(a.nx * a.b - a.nz * along, a.nz * a.b + a.nx * along);
        this.candidate(a.nx * a.b + a.nz * along, a.nz * a.b - a.nx * along);
      }
      for (let j = 0; j < i; j++) {
        const b = this.lines[j]!;
        const determinant = a.nx * b.nz - a.nz * b.nx;
        if (Math.abs(determinant) > crowdLimits.epsilon)
          this.candidate(
            (a.b * b.nz - a.nz * b.b) / determinant,
            (a.nx * b.b - a.b * b.nx) / determinant,
          );
      }
    }
    agent.next.set(scratch.x, 0, scratch.z);
    agent.state =
      scratch.best === Infinity
        ? 'blocked'
        : Math.hypot(scratch.x, agent.preferred.y, scratch.z) < 1e-6
          ? Math.hypot(px, pz) > 1e-6
            ? 'blocked'
            : 'idle'
          : 'moving';
  }

  private candidate(x: number, z: number): void {
    const scratch = this.candidateScratch;
    if (x * x + z * z > scratch.speed * scratch.speed + crowdLimits.epsilon)
      return;
    for (let i = 0; i < scratch.count; i++) {
      const line = this.lines[i]!;
      if (line.nx * x + line.nz * z < line.b - crowdLimits.epsilon) return;
    }
    const error = (x - scratch.px) ** 2 + (z - scratch.pz) ** 2;
    if (error < scratch.best) {
      scratch.best = error;
      scratch.x = x;
      scratch.z = z;
    }
  }

  destroy(): void {
    if (this.updating)
      throw new Error('Destroy crowd outside update callbacks.');
    for (const agent of this.agents.values()) {
      agent.state = 'removed';
      agent.velocity.set(0, 0, 0);
    }
    this.agents.clear();
    this.obstacles.clear();
    this.grid.clear();
    this.buckets.length = 0;
    this.ordered.length = 0;
    this.neighbors.length = 0;
    this.disposed = true;
  }
}
