import { describe, expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import { Group2D } from '../packages/core/src/gameplay/group2d.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector2 } from '../packages/math/src/index.js';
import {
  Colliders,
  PhysicsWorld2D,
  RigidBody2D,
  Trigger2D,
  type Collider2D,
  type CollisionDetail,
} from '../packages/core/src/physics2d/index.js';

function object(
  shape: Collider2D,
  x = 0,
  y = 0,
  options: ConstructorParameters<typeof RigidBody2D>[0] = {},
): GameObject {
  const owner = new GameObject();
  owner.position.set(x, y);
  owner.collider = shape;
  owner.body = new RigidBody2D(options);
  return owner;
}
function advance(world: PhysicsWorld2D, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / world.fixedDelta); i++)
    world.update(world.fixedDelta);
}

// Assertions observe outcomes and contact transitions, not solver internals or forwarding.
describe('bounded rigid body physics', () => {
  it('conserves elastic circle momentum with unequal masses', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const a = object(Colliders.circle(1), -2, 0, {
      mass: 1,
      restitution: 1,
      friction: 0,
    });
    const b = object(Colliders.circle(1), 2, 0, {
      mass: 3,
      restitution: 1,
      friction: 0,
    });
    a.body!.velocity.x = 6;
    world.register(a);
    world.register(b);
    advance(world, 1);
    expect(a.body!.velocity.x).toBeCloseTo(-3, 6);
    expect(b.body!.velocity.x).toBeCloseTo(3, 6);
    expect(a.body!.velocity.x + 3 * b.body!.velocity.x).toBeCloseTo(6, 6);
    expect(a.position.x).toBeLessThan(b.position.x - 2);
  });

  it('rebounds a circle against a rotated convex polygon, not its AABB', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const wall = object(
      Colliders.polygon([
        [-4, -1],
        [4, -1],
        [4, 1],
        [-4, 1],
      ]),
      0,
      0,
      { type: 'static', restitution: 1, friction: 0 },
    );
    wall.rotation = Math.PI / 4;
    const ball = object(Colliders.circle(0.5), 0, -3, {
      restitution: 1,
      friction: 0,
    });
    ball.body!.velocity.y = 8;
    world.register(wall);
    world.register(ball);
    advance(world, 0.5);
    expect(ball.body!.velocity.x).toBeGreaterThan(7.5);
    expect(Math.abs(ball.body!.velocity.y)).toBeLessThan(0.1);
    expect(world.overlap(ball.collider!, ball)).toEqual([]);
  });

  it('clips rotated polygon faces and rebounds along the true contact normal', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const wall = object(Colliders.box(10, 2), 0, 0, {
      type: 'static',
      restitution: 1,
      friction: 0,
    });
    const moving = object(
      Colliders.box(2, 2),
      3 * Math.SQRT1_2,
      -3 * Math.SQRT1_2,
      { restitution: 1, friction: 0, lockRotation: true },
    );
    wall.rotation = moving.rotation = Math.PI / 4;
    moving.body!.velocity.set(-6 * Math.SQRT1_2, 6 * Math.SQRT1_2);
    let detail: CollisionDetail | undefined;
    moving.addEventListener('collisionstart', (event) => {
      detail = (event as CustomEvent<CollisionDetail>).detail;
    });
    world.register(wall);
    world.register(moving);
    advance(world, 0.5);
    expect(detail!.points).toHaveLength(2);
    expect(detail!.normal.x).toBeCloseTo(-Math.SQRT1_2, 5);
    expect(detail!.normal.y).toBeCloseTo(Math.SQRT1_2, 5);
    expect(moving.body!.velocity.x).toBeCloseTo(6 * Math.SQRT1_2, 5);
    expect(moving.body!.velocity.y).toBeCloseTo(-6 * Math.SQRT1_2, 5);
    expect(world.overlap(moving.collider!, moving)).toEqual([]);
  });

  it('off-center impact transfers angular momentum and friction removes slip', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const target = object(Colliders.box(2, 4), 0, 0, { mass: 2, friction: 0 });
    const projectile = object(Colliders.circle(0.5), -3, 1.2, { friction: 0 });
    projectile.body!.velocity.x = 8;
    world.register(target);
    world.register(projectile);
    advance(world, 0.4);
    expect(Math.abs(target.body!.angularVelocity)).toBeGreaterThan(0.5);
    expect(target.body!.velocity.x).toBeGreaterThan(1);

    const floorWorld = new PhysicsWorld2D({ gravity: [0, 10] });
    const floor = object(Colliders.box(100, 2), 0, 5, {
      type: 'static',
      friction: 1,
    });
    const sliding = object(Colliders.box(2, 2), 0, 3, {
      friction: 1,
      lockRotation: true,
    });
    sliding.body!.velocity.x = 5;
    floorWorld.register(floor);
    floorWorld.register(sliding);
    advance(floorWorld, 1);
    expect(Math.abs(sliding.body!.velocity.x)).toBeLessThan(0.1);
    expect(sliding.position.y).toBeCloseTo(3, 1);
  });

  it('a falling box rests with bounded jitter and no sustained spin', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 20] });
    const floor = object(Colliders.box(100, 2), 0, 10, { type: 'static' });
    const falling = object(Colliders.box(2, 2), 0, 0);
    world.register(floor);
    world.register(falling);
    advance(world, 3);
    const y = falling.position.y;
    advance(world, 1);
    expect(falling.position.y).toBeCloseTo(8, 1);
    expect(Math.abs(falling.position.y - y)).toBeLessThan(0.02);
    expect(Math.abs(falling.body!.velocity.y)).toBeLessThan(0.1);
    expect(Math.abs(falling.body!.angularVelocity)).toBeLessThan(0.05);
  });

  it('separates fully contained shapes and applies exact circle corner tests', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const outer = object(Colliders.box(10, 10), 0, 0, { type: 'static' });
    const inner = object(Colliders.circle(1));
    world.register(outer);
    world.register(inner);
    advance(world, 0.2);
    expect(
      Math.max(Math.abs(inner.position.x), Math.abs(inner.position.y)),
    ).toBeGreaterThan(5.9);
    const query = new GameObject();
    query.position.set(5.9, 5.9);
    expect(
      world
        .overlap(Colliders.circle(1), query)
        .some((hit) => hit.owner === outer),
    ).toBe(false);
    query.position.set(5.6, 5.6);
    expect(
      world
        .overlap(Colliders.circle(1), query)
        .some((hit) => hit.owner === outer),
    ).toBe(true);
  });

  it('uses reciprocal masks and sensor start/persist/leave transitions without response', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const sensor = object(Colliders.box(4, 4), 0, 0, { type: 'static' });
    sensor.collider!.sensor = true;
    const ball = object(Colliders.circle(0.5), -3, 0);
    sensor.collider!.category = 2;
    sensor.collider!.mask = 4;
    ball.collider!.category = 4;
    ball.collider!.mask = 1;
    ball.body!.velocity.x = 4;
    const events: string[] = [];
    sensor.addEventListener('collisionstart', () => events.push('start'));
    sensor.addEventListener('collisionend', () => events.push('end'));
    world.register(sensor);
    world.register(ball);
    advance(world, 0.5);
    expect(events).toEqual([]);
    ball.collider!.mask = 2;
    advance(world, 0.1);
    expect(events).toEqual(['start']);
    advance(world, 0.1);
    expect(events).toEqual(['start']);
    advance(world, 1);
    expect(events).toEqual(['start', 'end']);
    expect(ball.body!.velocity.x).toBe(4);
  });

  it('ends filtered/removed contacts once; precollision removal prevents response', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const sensor = object(Colliders.box(4, 4), 0, 0, { type: 'static' });
    sensor.collider!.sensor = true;
    const ball = object(Colliders.circle(1));
    let ends = 0;
    sensor.addEventListener('collisionend', () => ends++);
    world.register(sensor);
    world.register(ball);
    world.update(world.fixedDelta);
    ball.collider!.mask = 0;
    world.update(world.fixedDelta);
    expect(ends).toBe(1);
    world.unregister(ball);
    expect(ends).toBe(1);

    const wall = object(Colliders.box(2, 10), 5, 0, { type: 'static' });
    const moving = object(Colliders.circle(1), 3.1, 0);
    moving.body!.velocity.x = 10;
    wall.addEventListener('precollision', () => world.unregister(moving), {
      once: true,
    });
    world.register(wall);
    world.register(moving);
    world.update(world.fixedDelta);
    expect(moving.body!.velocity.x).toBe(10);
  });

  it('cancellation suppresses only one step and event payloads stay stable', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const wall = object(Colliders.box(2, 10), 0, 0, { type: 'static' });
    const moving = object(Colliders.circle(1), -1.9, 0);
    moving.body!.velocity.x = 2;
    let snapshot: CollisionDetail | undefined;
    moving.addEventListener(
      'precollision',
      (event) => {
        snapshot = (event as CustomEvent<CollisionDetail>).detail;
        snapshot.cancelResponse();
      },
      { once: true },
    );
    world.register(wall);
    world.register(moving);
    world.update(world.fixedDelta);
    expect(moving.body!.velocity.x).toBe(2);
    const normalX = snapshot!.normal.x,
      pointX = snapshot!.points[0].x;
    world.update(world.fixedDelta);
    expect(moving.body!.velocity.x).toBeCloseTo(0);
    expect(snapshot!.normal.x).toBe(normalX);
    expect(snapshot!.points[0].x).toBe(pointX);
  });

  it('matches fixed-step partitions, clears forces once, and caps catchup', () => {
    const aWorld = new PhysicsWorld2D({ gravity: [0, 0] }),
      bWorld = new PhysicsWorld2D({ gravity: [0, 0] });
    const a = object(Colliders.circle(1)),
      b = object(Colliders.circle(1));
    aWorld.register(a);
    bWorld.register(b);
    a.body!.applyForce(new Vector2(12, 0));
    aWorld.update(1 / 30);
    for (let i = 0; i < 4; i++) {
      b.body!.applyForce(new Vector2(12, 0));
      bWorld.update(1 / 120);
    }
    expect(a.position.x).toBeCloseTo(b.position.x, 10);
    expect(a.body!.velocity.x).toBeCloseTo(0.4, 10);
    expect(a.body!.force.x).toBe(0);
    aWorld.update(1);
    expect(aWorld.droppedTime).toBeCloseTo(0.9, 10);
    expect(a.position.x).toBeCloseTo(b.position.x + 0.04, 10);
  });

  it('huge finite frame deltas remain bounded without poisoning the next step', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const moving = object(Colliders.circle(1));
    moving.body!.velocity.x = 1;
    world.register(moving);
    world.update(1e308);
    expect(moving.position.x).toBeCloseTo(0.1);
    expect(Number.isFinite(world.droppedTime)).toBe(true);
    world.update(world.fixedDelta);
    expect(moving.position.x).toBeGreaterThan(0.1);
    expect(moving.position.x).toBeLessThan(0.125);
  });

  it('raycasts shape surfaces sorted by distance, with masks and inside hits', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const circle = object(Colliders.circle(1), 4, 0, { type: 'static' });
    const polygon = object(Colliders.box(2, 2), 8, 0, { type: 'static' });
    polygon.rotation = Math.PI / 4;
    polygon.collider!.category = 2;
    world.register(polygon);
    world.register(circle);
    const hits = world.raycast(new Vector2(), new Vector2(2, 0), 10);
    expect(hits.map((hit) => hit.owner)).toEqual([circle, polygon]);
    expect(hits[0].distance).toBeCloseTo(3);
    expect(hits[1].distance).toBeCloseTo(8 - Math.sqrt(2), 5);
    expect(hits[1].normal.x).toBeCloseTo(-Math.SQRT1_2, 5);
    expect(world.raycast(new Vector2(), new Vector2(1, 0), 10, 1)).toHaveLength(
      1,
    );
    expect(
      world.raycast(new Vector2(4, 0), new Vector2(1, 0), 0)[0].distance,
    ).toBe(0);
  });

  it('emits transient contact start/end within a single catchup frame', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const sensor = object(Colliders.box(1, 4), 0, 0, { type: 'static' });
    sensor.collider!.sensor = true;
    const moving = object(Colliders.circle(0.1), -1, 0);
    moving.body!.velocity.x = 60;
    const transitions: string[] = [];
    sensor.addEventListener('collisionstart', () => transitions.push('start'));
    sensor.addEventListener('collisionend', () => transitions.push('end'));
    world.register(sensor);
    world.register(moving);
    world.update(1 / 30);
    expect(transitions).toEqual(['start', 'end']);
    expect(moving.position.x).toBeCloseTo(1);
    expect(moving.body!.velocity.x).toBe(60);
  });

  it('a collision-driven pause stops response and discards withheld catchup work', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const wall = object(Colliders.box(2, 10), 0, 0, { type: 'static' });
    const moving = object(Colliders.circle(1), -1.9, 0);
    moving.body!.velocity.x = 2;
    let running = true;
    wall.addEventListener(
      'precollision',
      () => {
        running = false;
      },
      { once: true },
    );
    world.register(wall);
    world.register(moving);
    world.update(1 / 30, () => running);
    expect(moving.position.x).toBeCloseTo(-1.9 + 2 / 120);
    expect(moving.body!.velocity.x).toBe(2);
    const pausedX = moving.position.x;
    running = true;
    world.update(0, () => running);
    expect(moving.position.x).toBe(pausedX);
  });

  it('offset geometry and scale alter angular inertia about the owner center', () => {
    const owner = object(Colliders.box(2, 4, { offset: [3, 0] }));
    expect(owner.body!.inverseInertia).toBeCloseTo(1 / (20 / 12 + 9));
    owner.scale.set(2, 1);
    expect(owner.body!.inverseInertia).toBeCloseTo(1 / (32 / 12 + 36));
    owner.body!.applyImpulse(new Vector2(0, 1), new Vector2(1, 0));
    expect(owner.body!.angularVelocity).toBeCloseTo(1 / (32 / 12 + 36));
    owner.scale.set(-2, 1);
    expect(owner.collider!.containsPoint(new Vector2(-6, 0), owner)).toBe(true);
    expect(owner.collider!.containsPoint(new Vector2(6, 0), owner)).toBe(false);
  });

  it('uses auto Scene membership, nested static colliders and reusable detached bodies', () => {
    const scene = new Scene();
    scene.physics.gravity.set(0, 0);
    const parent = new Group2D();
    parent.position.x = 10;
    const wall = new GameObject();
    parent.add(wall);
    wall.collider = Colliders.box(2, 2);
    const ball = object(Colliders.circle(1), 8.1);
    ball.body!.velocity.x = 2;
    scene.add(parent);
    scene.add(ball);
    scene.physics.update(1 / 120);
    expect(ball.body!.velocity.x).toBeCloseTo(0);
    scene.remove(parent);
    ball.body!.velocity.x = 2;
    scene.physics.update(1 / 120);
    expect(ball.body!.velocity.x).toBe(2);
    scene.remove(ball);
    expect(ball.body!.owner).toBe(ball);
    scene.add(ball);
    scene.destroy();
    expect(ball.destroyed).toBe(true);
  });

  it('triggers filter accepted unique enters with bounded repeats and removal exits', () => {
    const scene = new Scene();
    scene.physics.gravity.set(0, 0);
    const accepted = object(Colliders.circle(1)),
      ignored = object(Colliders.circle(1));
    const trigger = new Trigger2D(Colliders.box(4, 4), {
      repeat: 1,
      filter: (other) => other === accepted,
    });
    let enters = 0,
      exits = 0;
    trigger.addEventListener('triggerenter', () => enters++);
    trigger.addEventListener('triggerexit', () => exits++);
    scene.add(trigger);
    scene.add(ignored);
    scene.add(accepted);
    scene.physics.update(1 / 120);
    expect(enters).toBe(1);
    scene.remove(accepted);
    expect(exits).toBe(1);
    scene.add(accepted);
    scene.physics.update(1 / 120);
    expect(enters).toBe(1);
    scene.destroy();
  });

  it('rejects unsupported geometry, ownership, transforms and invalid material inputs', () => {
    expect(() =>
      Colliders.polygon([
        [0, 0],
        [2, 0],
        [1, 1],
        [2, 2],
        [0, 2],
      ]),
    ).toThrow(/convex/);
    expect(() =>
      Colliders.polygon([
        [0, 0],
        [1, 0],
        [1, 0],
      ]),
    ).toThrow();
    expect(() => new RigidBody2D({ mass: 0 })).toThrow();
    expect(() => new RigidBody2D({ restitution: 2 })).toThrow();
    const a = object(Colliders.circle(1)),
      b = new GameObject();
    expect(() => {
      b.body = a.body;
    }).toThrow(/belongs/);
    const world = new PhysicsWorld2D();
    a.scale.set(2, 1);
    expect(() => world.register(a)).toThrow(/uniform/);
    a.scale.set(0, 0);
    expect(() => world.register(a)).toThrow(/nonsingular/);
    const parent = new Group2D(),
      child = new GameObject();
    parent.add(child);
    expect(() => {
      child.body = new RigidBody2D();
    }).toThrow(/root/);
    const hud = new GameObject();
    hud.space = 'screen';
    expect(() => {
      hud.body = new RigidBody2D({ type: 'static' });
    }).toThrow(/Screen/);
  });
});
