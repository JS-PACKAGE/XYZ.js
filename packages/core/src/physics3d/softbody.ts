import { Matrix4, Vector3 } from '../../../math/src/index.js';
import type { Mesh } from '../mesh.js';
import type { PhysicsWorld3D, PhysicsHit3D } from './world.js';
import { nonnegative3D, positive3D, vector3D } from './collider.js';
import { physicsProfiles } from '../../../../src/data/physics-profiles.js';
export interface SoftBodyParticleOptions3D {
  position: Readonly<Vector3>;
  mass?: number;
  pinned?: boolean;
}
export interface SoftBodySpringOptions3D {
  a: number;
  b: number;
  restLength?: number;
  stiffness?: number;
  damping?: number;
}
export interface SoftBodyOptions3D {
  particles: readonly SoftBodyParticleOptions3D[];
  springs: readonly SoftBodySpringOptions3D[];
  radius?: number;
  drag?: number;
  friction?: number;
  fixedDelta?: number;
  iterations?: number;
  maxStretch?: number;
  /** Exclusive mutable geometry; one particle index per mesh vertex. World positions convert to mesh-local. */
  mesh?: Mesh;
  vertexParticles?: readonly number[];
}
export interface SoftBodyParticle3D {
  readonly position: Vector3;
  readonly velocity: Vector3;
  readonly mass: number;
  pinned: boolean;
}
/** Bounded mass-spring + stretch projection profile, not FEM, volume preservation or self-collision.
 * World owns rigid contacts; particles query swept spheres. Call update in simulation seconds. */
export class SoftBody3D {
  readonly particles: readonly SoftBodyParticle3D[];
  readonly fixedDelta: number;
  private readonly springs: Required<SoftBodySpringOptions3D>[];
  private readonly forces: Vector3[];
  private readonly anchors: Vector3[];
  private readonly radius: number;
  private readonly drag: number;
  private readonly friction: number;
  private readonly iterations: number;
  private readonly stretch: number;
  private readonly mesh: Mesh | undefined;
  private readonly mapping: readonly number[] | undefined;
  private readonly difference = new Vector3();
  private readonly displacement = new Vector3();
  private readonly old: Vector3[];
  private readonly inverse = new Matrix4();
  private readonly local = new Vector3();
  private hit: PhysicsHit3D | undefined;
  private readonly query = {};
  private accumulator = 0;
  private disposed = false;
  constructor(
    readonly world: PhysicsWorld3D,
    options: SoftBodyOptions3D,
  ) {
    const d = physicsProfiles.softBody;
    if (
      !options.particles.length ||
      options.particles.length > d.maxParticles ||
      options.springs.length > d.maxSprings
    )
      throw new RangeError('SoftBody exceeds particle/spring bounds.');
    this.particles = options.particles.map((p) => {
      vector3D(p.position, 'particle');
      return {
        position: new Vector3(p.position.x, p.position.y, p.position.z),
        velocity: new Vector3(),
        mass: positive3D(p.mass ?? 1, 'mass'),
        pinned: p.pinned ?? false,
      };
    });
    this.anchors = this.particles.map((p) => p.position.clone());
    this.forces = this.particles.map(() => new Vector3());
    this.old = this.particles.map((p) => p.position.clone());
    this.springs = options.springs.map((s) => {
      this.index(s.a);
      this.index(s.b);
      if (s.a === s.b) throw new RangeError('Spring endpoints must differ.');
      const length = this.difference
        .copy(this.particles[s.a]!.position)
        .subtract(this.particles[s.b]!.position)
        .length();
      return {
        a: s.a,
        b: s.b,
        restLength: positive3D(s.restLength ?? length, 'restLength'),
        stiffness: nonnegative3D(s.stiffness ?? d.stiffness, 'stiffness'),
        damping: nonnegative3D(s.damping ?? d.damping, 'damping'),
      };
    });
    this.radius = positive3D(options.radius ?? d.radius, 'radius');
    this.drag = nonnegative3D(options.drag ?? d.drag, 'drag');
    this.friction = nonnegative3D(options.friction ?? 0.5, 'friction');
    this.fixedDelta = positive3D(
      options.fixedDelta ?? d.fixedDelta,
      'fixedDelta',
    );
    this.iterations = options.iterations ?? d.iterations;
    if (
      !Number.isInteger(this.iterations) ||
      this.iterations < 1 ||
      this.iterations > 32
    )
      throw new RangeError('iterations must be within [1,32].');
    this.stretch = positive3D(options.maxStretch ?? d.maxStretch, 'maxStretch');
    if (this.stretch < 1) throw new RangeError('maxStretch must be >= 1.');
    this.mesh = options.mesh;
    if (this.mesh) {
      if (this.mesh.morph)
        throw new Error(
          'SoftBody cannot share geometry with morph deformation.',
        );
      if (
        !options.vertexParticles ||
        options.vertexParticles.length !==
          this.mesh.geometry.vertices.length / 8
      )
        throw new RangeError(
          'One particle mapping is required for each mesh vertex.',
        );
      options.vertexParticles.forEach((i) => this.index(i));
      this.mapping = [...options.vertexParticles];
    } else if (options.vertexParticles)
      throw new Error('vertexParticles requires a mesh.');
  }
  private index(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.particles.length)
      throw new RangeError('Particle index is out of range.');
  }
  pin(index: number, position?: Readonly<Vector3>): void {
    this.index(index);
    const p = this.particles[index]!;
    if (position) {
      vector3D(position, 'pin');
      p.position.set(position.x, position.y, position.z);
    }
    this.anchors[index]!.copy(p.position);
    p.velocity.set(0, 0, 0);
    p.pinned = true;
  }
  unpin(index: number): void {
    this.index(index);
    this.particles[index]!.pinned = false;
  }
  update(delta: number): void {
    nonnegative3D(delta, 'delta');
    if (this.disposed) throw new Error('SoftBody3D is destroyed.');
    const steps = Math.floor(
      (this.accumulator + delta) / this.fixedDelta + 1e-10,
    );
    if (steps > physicsProfiles.softBody.maxSubSteps)
      throw new RangeError(
        'SoftBody update exceeds bounded substeps; split simulation time.',
      );
    this.accumulator += delta;
    for (let i = 0; i < steps; i++) {
      this.step(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }
    if (steps) this.uploadMesh();
  }
  private step(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;
      this.old[i]!.copy(p.position);
      this.forces[i]!.copy(this.world.gravity).scale(p.mass);
    }
    for (const s of this.springs) {
      const a = this.particles[s.a]!,
        b = this.particles[s.b]!;
      const n = this.difference.copy(b.position).subtract(a.position),
        length = n.length();
      if (length < 1e-12) continue;
      n.scale(1 / length);
      const relative =
        (b.velocity.x - a.velocity.x) * n.x +
        (b.velocity.y - a.velocity.y) * n.y +
        (b.velocity.z - a.velocity.z) * n.z;
      const force =
        s.stiffness * (length - s.restLength) + s.damping * relative;
      const fa = this.forces[s.a]!,
        fb = this.forces[s.b]!;
      fa.x += n.x * force;
      fa.y += n.y * force;
      fa.z += n.z * force;
      fb.x -= n.x * force;
      fb.y -= n.y * force;
      fb.z -= n.z * force;
    }
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;
      if (p.pinned) {
        p.position.copy(this.anchors[i]!);
        p.velocity.set(0, 0, 0);
        continue;
      }
      p.velocity
        .add(this.forces[i]!.scale(dt / p.mass))
        .scale(Math.exp(-this.drag * dt));
      p.position.add(this.displacement.copy(p.velocity).scale(dt));
    }
    for (let iteration = 0; iteration < this.iterations; iteration++)
      for (const s of this.springs) {
        const a = this.particles[s.a]!,
          b = this.particles[s.b]!,
          n = this.difference.copy(b.position).subtract(a.position),
          length = n.length();
        const ia = a.pinned ? 0 : 1 / a.mass,
          ib = b.pinned ? 0 : 1 / b.mass;
        if (length <= s.restLength * this.stretch || ia + ib === 0) continue;
        n.scale((length - s.restLength * this.stretch) / length / (ia + ib));
        a.position.x += n.x * ia;
        a.position.y += n.y * ia;
        a.position.z += n.z * ia;
        b.position.x -= n.x * ib;
        b.position.y -= n.y * ib;
        b.position.z -= n.z * ib;
      }
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;
      if (p.pinned) continue;
      this.displacement.copy(p.position).subtract(this.old[i]!);
      const hit = this.world.sweepSphere(
        this.old[i]!,
        this.radius,
        this.displacement,
        this.query,
        this.hit,
      );
      if (hit) this.hit = hit;
      if (hit) {
        const length = this.displacement.length();
        p.position
          .copy(this.old[i]!)
          .add(
            this.displacement.scale(
              length ? Math.max(0, hit.distance - 0.0001) / length : 0,
            ),
          );
        p.position.x += hit.normal.x * 0.0001;
        p.position.y += hit.normal.y * 0.0001;
        p.position.z += hit.normal.z * 0.0001;
      }
      p.velocity
        .copy(p.position)
        .subtract(this.old[i]!)
        .scale(1 / dt);
      if (hit) {
        const normalSpeed = p.velocity.dot(hit.normal);
        if (normalSpeed < 0) {
          p.velocity.x -= hit.normal.x * normalSpeed;
          p.velocity.y -= hit.normal.y * normalSpeed;
          p.velocity.z -= hit.normal.z * normalSpeed;
        }
        p.velocity.scale(Math.max(0, 1 - this.friction));
      }
      vector3D(p.position, 'integrated position');
      vector3D(p.velocity, 'integrated velocity');
    }
  }
  private uploadMesh(): void {
    if (!this.mesh || !this.mapping) return;
    const g = this.mesh.geometry,
      vertices = g.vertices;
    this.inverse.copy(this.mesh.updateWorldMatrix()).invert();
    for (let i = 0; i < this.mapping.length; i++) {
      this.inverse.transformPoint(
        this.particles[this.mapping[i]!]!.position,
        this.local,
      );
      const o = i * 8;
      vertices[o] = this.local.x;
      vertices[o + 1] = this.local.y;
      vertices[o + 2] = this.local.z;
      vertices[o + 3] = vertices[o + 4] = vertices[o + 5] = 0;
    }
    for (let i = 0; i < g.indices.length; i += 3) {
      const a = g.indices[i]! * 8,
        b = g.indices[i + 1]! * 8,
        c = g.indices[i + 2]! * 8;
      this.difference.set(
        vertices[b]! - vertices[a]!,
        vertices[b + 1]! - vertices[a + 1]!,
        vertices[b + 2]! - vertices[a + 2]!,
      );
      this.local.set(
        vertices[c]! - vertices[a]!,
        vertices[c + 1]! - vertices[a + 1]!,
        vertices[c + 2]! - vertices[a + 2]!,
      );
      this.difference.cross(this.local);
      for (let corner = 0; corner < 3; corner++) {
        const o = corner === 0 ? a : corner === 1 ? b : c;
        vertices[o + 3] += this.difference.x;
        vertices[o + 4] += this.difference.y;
        vertices[o + 5] += this.difference.z;
      }
    }
    for (let i = 0; i < vertices.length; i += 8) {
      this.local
        .set(vertices[i + 3]!, vertices[i + 4]!, vertices[i + 5]!)
        .normalize();
      vertices[i + 3] = this.local.x;
      vertices[i + 4] = this.local.y;
      vertices[i + 5] = this.local.z;
    }
    g.markUpdated();
  }
  destroy(): void {
    this.disposed = true;
  }
}
