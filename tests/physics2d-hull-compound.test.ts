import { describe, expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector2 } from '../packages/math/src/index.js';
import {
  Colliders,
  Compound2D,
  DynamicConcave2D,
  PhysicsWorld2D,
  RigidBody2D,
  Trigger2D,
  convexHull,
  type CollisionDetail,
} from '../packages/core/src/physics2d/index.js';

const lShape: [number, number][] = [
  [0, 0],
  [6, 0],
  [6, 2],
  [2, 2],
  [2, 6],
  [0, 6],
];

function separated(
  options: ConstructorParameters<typeof Compound2D>[1] = {},
): Compound2D {
  return new Compound2D(
    [
      Colliders.box(2, 2, { offset: [-3, 0] }),
      Colliders.box(2, 2, { offset: [3, 0] }),
    ],
    options,
  );
}

function floor(
  world: PhysicsWorld2D,
  x: number,
  y: number,
  width: number,
): GameObject {
  const object = new GameObject();
  object.position.set(x, y);
  object.collider = Colliders.box(width, 2);
  world.register(object);
  return object;
}

describe('convex hull collider', () => {
  it('encloses concave unordered point clouds, ignoring interior points', () => {
    const hull = convexHull([
      [2, 2],
      [4, 0],
      [0, 4],
      [0, 0],
      [4, 4],
      [1, 2],
    ]);
    expect(hull.kind).toBe('polygon');
    expect(hull.vertices).toEqual([
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ]);
    const owner = new GameObject();
    expect(hull.containsPoint(new Vector2(3, 3), owner)).toBe(true);
    expect(hull.containsPoint(new Vector2(5, 3), owner)).toBe(false);
  });

  it('removes repeated and collinear points and snapshots geometry with offsets', () => {
    const input: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
      [2, 2],
    ];
    const hull = convexHull(input, { offset: [10, 5] });
    input[0][0] = 100;
    expect(hull.vertices).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
    expect(hull.containsPoint(new Vector2(11, 6), new GameObject())).toBe(true);
    expect(Object.isFrozen(hull.vertices)).toBe(true);
  });

  it('accepts three points and 256 inputs without silently limiting input count to 32', () => {
    expect(
      convexHull([
        [0, 0],
        [2, 0],
        [0, 2],
      ]).vertices,
    ).toHaveLength(3);
    const points: [number, number][] = Array.from({ length: 256 }, (_, i) => [
      i % 2,
      Math.floor(i / 2) % 2,
    ]);
    expect(convexHull(points).vertices).toHaveLength(4);
  });

  it('rejects degenerate, oversized, nonfinite and out-of-bounds clouds', () => {
    const inputs: [number, number][][] = [
      [
        [0, 0],
        [1, 1],
      ],
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [1, 0],
        [NaN, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [0, 1_000_001],
      ],
      Array.from({ length: 257 }, (_, i) => [i, i % 2]),
    ];
    for (const points of inputs)
      expect(() => convexHull(points)).toThrow(RangeError);
  });

  it('rejects hulls beyond 32 vertices rather than clipping them', () => {
    const cloud = (n: number): [number, number][] =>
      Array.from({ length: n }, (_, i) => [
        10 * Math.cos((i * Math.PI * 2) / n),
        10 * Math.sin((i * Math.PI * 2) / n),
      ]);
    expect(convexHull(cloud(32)).vertices).toHaveLength(32);
    expect(() => convexHull(cloud(33))).toThrow(RangeError);
  });
});

describe('one-body convex compounds', () => {
  it('composes area-weighted mass, centroid and parallel-axis inertia', () => {
    const compound = new Compound2D(
      [
        Colliders.box(2, 2),
        convexHull([
          [4, -1],
          [8, -1],
          [8, 1],
          [4, 1],
        ]),
      ],
      { mass: 12 },
    );
    expect(compound.area).toBe(12);
    expect(compound.centerOfMass.x).toBeCloseTo(4);
    expect(compound.centerOfMass.y).toBeCloseTo(0);
    expect(compound.position.x).toBeCloseTo(4);
    expect(compound.body!.mass).toBe(12);
    expect(1 / compound.body!.inverseInertia).toBeCloseTo(112);
    compound.body!.applyImpulse(new Vector2(0, 12), new Vector2(6, 0));
    expect(compound.body!.velocity.y).toBeCloseTo(1);
    expect(compound.body!.angularVelocity).toBeCloseTo(24 / 112);
    compound.body!.mass = 24;
    expect(1 / compound.body!.inverseInertia).toBeCloseTo(224);
    compound.scale.set(2, 2);
    expect(1 / compound.body!.inverseInertia).toBeCloseTo(896);
  });

  it('decomposes concavity without filling the notch and uses its true centroid', () => {
    const object = new DynamicConcave2D(lShape);
    expect(object.pieces.length).toBeGreaterThan(1);
    expect(object.area).toBeCloseTo(20);
    expect(object.centerOfMass.x).toBeCloseTo(2.2);
    expect(object.centerOfMass.y).toBeCloseTo(2.2);
    object.hitTestMode = 'collider';
    expect(object.containsPoint(new Vector2(1, 5))).toBe(true);
    expect(object.containsPoint(new Vector2(5, 1))).toBe(true);
    expect(object.containsPoint(new Vector2(5, 5))).toBe(false);
    expect(object.body!.owner).toBe(object);
    expect(object.children).toHaveLength(0);
  });

  it('snapshots pieces, preserves filters and never gives source colliders ownership', () => {
    const source = Colliders.box(2, 2);
    source.category = 4;
    source.mask = 8;
    source.sensor = true;
    const object = new Compound2D([source]);
    source.mask = 0;
    expect(object.pieces[0]).not.toBe(source);
    expect(object.pieces[0].category).toBe(4);
    expect(object.pieces[0].mask).toBe(8);
    expect(object.pieces[0].sensor).toBe(true);
    expect(Object.isFrozen(object.pieces)).toBe(true);
    expect(() => {
      object.collider = Colliders.box(4, 4);
    }).toThrow(RangeError);
  });

  it('rejects unsupported shape sets and compound CCD explicitly', () => {
    expect(() => new Compound2D([])).toThrow(RangeError);
    expect(() => new Compound2D([Colliders.circle(1)])).toThrow(RangeError);
    expect(
      () =>
        new Compound2D(Array.from({ length: 257 }, () => Colliders.box(1, 1))),
    ).toThrow(RangeError);
    expect(() => separated({ ccd: true })).toThrow(RangeError);
    const object = separated();
    object.body!.ccd = true;
    expect(() => new PhysicsWorld2D().register(object)).toThrow(RangeError);
  });

  it('integrates shared forces, gravity and angular velocity exactly once per tick', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 12], fixedDelta: 0.1 });
    const object = separated({ mass: 2, allowSleep: false });
    object.body!.angularVelocity = 1;
    object.body!.applyForce(new Vector2(20, 0));
    world.register(object);
    world.update(0.1);
    expect(object.body!.velocity.x).toBeCloseTo(1);
    expect(object.body!.velocity.y).toBeCloseTo(1.2);
    expect(object.position.x).toBeCloseTo(0.1);
    expect(object.position.y).toBeCloseTo(0.12);
    expect(object.rotation).toBeCloseTo(0.1);
    expect(world.colliderCount).toBe(2);
    expect(world.debugSnapshot().contacts).toHaveLength(0);
    world.destroy();
  });

  it('lands a dynamic concave polygon on solid ground through actual contact response', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 40] });
    floor(world, 0, 20, 100);
    const object = new DynamicConcave2D(lShape, { lockRotation: true });
    let contacts = 0;
    object.addEventListener('collisionstart', () => contacts++);
    world.register(object);
    for (let i = 0; i < 360; i++) world.update(1 / 120);
    expect(contacts).toBeGreaterThan(0);
    expect(object.position.y).toBeGreaterThan(15);
    expect(object.position.y).toBeLessThan(15.3);
    expect(Math.abs(object.body!.velocity.y)).toBeLessThan(0.2);
    expect(object.body!.isSleeping).toBe(true);
    world.destroy();
  });

  it('changes the shared angular and linear velocities on an off-center concave contact', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const obstacle = floor(world, 5, 2.8, 2);
    const object = new DynamicConcave2D(lShape, {
      allowSleep: false,
      friction: 0,
    });
    object.body!.velocity.y = 10;
    let other: GameObject | undefined;
    object.addEventListener('postcollision', (event) => {
      other = (event as CustomEvent<CollisionDetail>).detail.other;
    });
    world.register(object);
    world.update(1 / 120);
    expect(other).toBe(obstacle);
    expect(object.body!.velocity.y).toBeLessThan(10);
    expect(Math.abs(object.body!.angularVelocity)).toBeGreaterThan(0.01);
    world.destroy();
  });

  it('queries every piece, returns the root owner, and leaves the concave gap empty', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const object = separated({ category: 4, mask: 2 });
    world.register(object);
    const probe = new GameObject();
    const collider = Colliders.circle(0.25);
    collider.category = 2;
    collider.mask = 4;
    probe.position.x = 3;
    const overlaps = world.overlap(collider, probe);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].owner).toBe(object);
    expect(overlaps[0].collider).toBe(object.pieces[1]);
    probe.position.x = 0;
    expect(world.overlap(collider, probe)).toHaveLength(0);
    const hits = world.raycast(new Vector2(-10, 0), new Vector2(1, 0), 30, 4);
    expect(hits.map((hit) => hit.owner)).toEqual([object, object]);
    expect(hits.map((hit) => hit.distance)).toEqual([6, 12]);
    expect(
      world.raycast(new Vector2(-10, 0), new Vector2(1, 0), 30, 2),
    ).toHaveLength(0);
    collider.mask = 0;
    probe.position.x = 3;
    expect(world.overlap(collider, probe)).toHaveLength(0);
    expect(world.has(object, object.pieces[1])).toBe(true);
    world.destroy();
  });

  it('honors per-piece sensors and reciprocal filters without solid response', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const object = separated({ allowSleep: false, category: 4, mask: 2 });
    object.pieces[1].sensor = true;
    const wall = floor(world, 3, 1.5, 2);
    wall.collider!.category = 2;
    wall.collider!.mask = 4;
    object.body!.velocity.y = 10;
    let sensor = false;
    object.addEventListener('collisionstart', (event) => {
      sensor = (event as CustomEvent<CollisionDetail>).detail.sensor;
    });
    world.register(object);
    world.update(1 / 120);
    expect(sensor).toBe(true);
    expect(object.body!.velocity.y).toBe(10);
    expect(object.body!.angularVelocity).toBe(0);
    object.pieces[1].sensor = false;
    object.pieces[1].mask = 0;
    object.position.y = 0;
    world.update(1 / 120);
    expect(object.body!.velocity.y).toBe(10);
    expect(world.debugSnapshot().contacts).toHaveLength(0);
    world.destroy();
  });

  it('counts a multi-piece trigger enter once and waits for the last piece before exit', () => {
    const scene = new Scene();
    scene.physics.gravity.set(0, 0);
    const object = separated();
    const trigger = new Trigger2D(Colliders.box(10, 4), { repeat: Infinity });
    let enters = 0,
      exits = 0;
    trigger.addEventListener('triggerenter', () => enters++);
    trigger.addEventListener('triggerexit', () => exits++);
    scene.add(trigger);
    scene.add(object);
    scene.physics.update(1 / 120);
    expect(enters).toBe(1);
    object.position.x = 5;
    scene.physics.update(1 / 120);
    expect(exits).toBe(0);
    object.position.x = 20;
    scene.physics.update(1 / 120);
    expect(exits).toBe(1);
    scene.destroy();
  });

  it('removes, reattaches, disables and destroys all piece registrations transactionally', () => {
    const scene = new Scene();
    scene.physics.gravity.set(0, 0);
    const object = separated();
    scene.add(object);
    expect(scene.physics.colliderCount).toBe(2);
    const revision = scene.physics.membershipRevision(object);
    scene.remove(object);
    expect(scene.physics.colliderCount).toBe(0);
    expect(object.body!.owner).toBe(object);
    scene.add(object);
    expect(scene.physics.membershipRevision(object)).toBeGreaterThan(revision);
    object.collider = undefined;
    expect(scene.physics.colliderCount).toBe(0);
    object.collider = object.pieces[0];
    expect(scene.physics.colliderCount).toBe(2);
    object.destroy();
    expect(scene.physics.colliderCount).toBe(0);
    expect(scene.physics.has(object, object.pieces[1])).toBe(false);
    expect(
      scene.physics.raycast(new Vector2(-10, 0), new Vector2(1, 0), 30),
    ).toHaveLength(0);
    scene.destroy();
  });

  it('preserves centered circle, box and polygon single-shape inertia and response', () => {
    const cases = [
      { collider: Colliders.circle(1), inertia: 0.5, x: 0 },
      { collider: Colliders.box(2, 2), inertia: 2 / 3, x: 5 },
      {
        collider: Colliders.polygon([
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]),
        inertia: 2 / 3,
        x: 10,
      },
    ];
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    floor(world, 5, 2, 30);
    for (const { collider, inertia, x } of cases) {
      const object = new GameObject();
      object.collider = collider;
      object.body = new RigidBody2D({ lockRotation: false, friction: 0 });
      object.position.x = x;
      object.body.velocity.y = 10;
      expect(1 / object.body.inverseInertia).toBeCloseTo(inertia);
      world.register(object);
    }
    world.update(1 / 120);
    expect(world.colliderCount).toBe(4);
    expect(world.debugSnapshot().contacts).toHaveLength(3);
    world.destroy();
  });
});
