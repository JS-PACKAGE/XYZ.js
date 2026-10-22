import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import { Group2D } from '../packages/core/src/gameplay/group2d.js';
import { Scene } from '../packages/core/src/scene.js';
import { SceneObject } from '../packages/core/src/scene-object.js';
import { Vector2 } from '../packages/math/src/index.js';
import {
  Colliders,
  PhysicsWorld2D,
  RigidBody2D,
  Trigger2D,
  type Collider2D,
  type CollisionDetail,
  type ContactQuery,
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

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it('stops delivering and resolving a contact once a precollision listener halts the step', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const wall = object(Colliders.box(2, 10), 0, 0, { type: 'static' });
    const moving = object(Colliders.circle(1), -1.9, 0);
    moving.body!.velocity.x = 2;
    let running = true;
    const events: string[] = [];
    moving.addEventListener('precollision', () => {
      events.push('moving');
      running = false;
    });
    wall.addEventListener('precollision', () => events.push('wall'));
    world.register(wall);
    world.register(moving);
    world.update(world.fixedDelta, () => running);
    // The halted step neither reaches the other receiver nor answers the contact.
    expect(events).toEqual(['moving']);
    expect(moving.body!.velocity.x).toBe(2);
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

  it('retains dense sensor contacts and late listener exit/reentry', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const owners = Array.from({ length: 8 }, () => {
      const owner = new GameObject();
      owner.collider = Colliders.circle(1);
      owner.collider.sensor = true;
      world.register(owner);
      return owner;
    });
    world.update(world.fixedDelta);
    world.update(world.fixedDelta);
    expect(world.debugSnapshot().contacts).toHaveLength(28);

    const transitions: string[] = [];
    owners[0].addEventListener('collisionstart', () =>
      transitions.push('start'),
    );
    owners[0].addEventListener('collisionend', () => transitions.push('end'));
    owners[0].position.x = 10;
    world.update(world.fixedDelta);
    expect(world.debugSnapshot().contacts).toHaveLength(21);
    owners[0].position.x = 0;
    world.update(world.fixedDelta);
    expect(world.debugSnapshot().contacts).toHaveLength(28);
    expect(transitions).toEqual([
      ...Array<string>(7).fill('end'),
      ...Array<string>(7).fill('start'),
    ]);
  });

  it('observes listeners added by the opposite receiver before their same-tick delivery', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const a = new GameObject(),
      b = new GameObject();
    a.collider = Colliders.circle(1);
    a.collider.sensor = true;
    b.collider = Colliders.circle(1);
    b.position.x = 1;
    const events: string[] = [];
    a.addEventListener('collisionstart', () => {
      events.push('a:start');
      b.addEventListener('collisionstart', (event) => {
        const detail = (event as CustomEvent<CollisionDetail>).detail;
        expect(detail.self).toBe(b);
        expect(detail.other).toBe(a);
        expect(detail.normal.x).toBe(-1);
        events.push('b:start');
      });
      b.addEventListener('postcollision', () => events.push('b:post'));
    });
    a.addEventListener('precollision', () => {
      events.push('a:pre');
      b.addEventListener('precollision', () => events.push('b:pre'));
    });
    world.register(a);
    world.register(b);
    world.update(world.fixedDelta);
    expect(events).toEqual(['a:start', 'b:start', 'a:pre', 'b:pre', 'b:post']);
    expect(world.debugSnapshot().contacts).toHaveLength(1);
    expect(a.position.x).toBe(0);
    expect(b.position.x).toBe(1);
  });

  it('honors a late precollision subscriber and rejects cancellation from its old snapshot', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const wall = object(Colliders.box(2, 10), 0, 0, { type: 'static' });
    const moving = object(Colliders.circle(1), 1.9, 0);
    moving.body!.velocity.x = -2;
    let snapshot: CollisionDetail | undefined;
    wall.addEventListener('precollision', () => {
      if (snapshot) snapshot.cancelResponse();
      else
        moving.addEventListener(
          'precollision',
          (event) => {
            snapshot = (event as CustomEvent<CollisionDetail>).detail;
            snapshot.cancelResponse();
          },
          { once: true },
        );
    });
    const post = vi.fn();
    moving.addEventListener('postcollision', post);
    world.register(wall);
    world.register(moving);
    world.update(world.fixedDelta);
    expect(moving.body!.velocity.x).toBe(-2);
    expect(snapshot!.self).toBe(moving);
    expect(snapshot!.other).toBe(wall);
    const pointX = snapshot!.points[0].x;
    world.update(world.fixedDelta);
    expect(moving.body!.velocity.x).toBeCloseTo(0);
    expect(snapshot!.points[0].x).toBe(pointX);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('preserves collision observation and cancellation through dispatchEvent overrides', () => {
    class CancellingObject extends GameObject {
      readonly events: string[] = [];
      override dispatchEvent(event: Event): boolean {
        if (
          event.type === 'collisionstart' ||
          event.type === 'precollision' ||
          event.type === 'postcollision' ||
          event.type === 'collisionend'
        ) {
          this.events.push(event.type);
          if (event.type === 'precollision')
            (event as CustomEvent<CollisionDetail>).detail.cancelResponse();
        }
        return super.dispatchEvent(event);
      }
    }
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const moving = new CancellingObject();
    moving.collider = Colliders.circle(1);
    moving.body = new RigidBody2D();
    moving.position.x = -1.9;
    moving.body.velocity.x = 2;
    const wall = object(Colliders.box(2, 10), 0, 0, { type: 'static' });
    world.register(moving);
    world.register(wall);
    world.update(world.fixedDelta);
    expect(moving.body.velocity.x).toBe(2);
    world.unregister(wall);
    expect(moving.events).toEqual([
      'collisionstart',
      'precollision',
      'postcollision',
      'collisionend',
    ]);
    expect(world.debugSnapshot().contacts).toEqual([]);
  });

  it.each([
    ['GameObject', GameObject.prototype],
    ['SceneObject', SceneObject.prototype],
    ['EventTarget', EventTarget.prototype],
  ] as const)(
    'preserves %s prototype dispatch interception without subscribers',
    (_, prototype) => {
      const world = new PhysicsWorld2D({ gravity: [0, 0] });
      const a = new GameObject(),
        b = new GameObject();
      a.collider = Colliders.circle(1);
      a.collider.sensor = true;
      b.collider = Colliders.circle(1);
      world.register(a);
      world.register(b);
      const dispatch = vi.spyOn(prototype, 'dispatchEvent');
      world.update(world.fixedDelta);
      expect(dispatch.mock.calls.map(([event]) => event.type)).toEqual([
        'collisionstart',
        'collisionstart',
        'precollision',
        'precollision',
        'postcollision',
        'postcollision',
      ]);
    },
  );

  it('ends a contact once when its first start receiver removes itself', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const a = new GameObject(),
      b = new GameObject();
    a.collider = Colliders.circle(1);
    a.collider.sensor = true;
    b.collider = Colliders.circle(1);
    const start = vi.fn(),
      end = vi.fn(),
      pre = vi.fn(),
      post = vi.fn();
    a.addEventListener('collisionstart', () => {
      world.unregister(a);
      a.destroy();
    });
    b.addEventListener('collisionstart', start);
    b.addEventListener('collisionend', end);
    b.addEventListener('precollision', pre);
    b.addEventListener('postcollision', post);
    world.register(a);
    world.register(b);
    world.update(world.fixedDelta);
    world.update(world.fixedDelta);
    expect(a.destroyed).toBe(true);
    expect(start).not.toHaveBeenCalled();
    expect(pre).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledTimes(1);
    expect(world.debugSnapshot().contacts).toEqual([]);
  });

  it('drops a receiver whose collider changes inside an earlier callback', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const a = new GameObject(),
      b = new GameObject();
    a.collider = Colliders.circle(1);
    a.collider.sensor = true;
    b.collider = Colliders.circle(1);
    // Detached objects do not re-register, so only the world's own checks see it.
    a.addEventListener('collisionstart', () => {
      b.collider = Colliders.circle(1);
    });
    const start = vi.fn(),
      pre = vi.fn();
    b.addEventListener('collisionstart', start);
    b.addEventListener('precollision', pre);
    world.register(a);
    world.register(b);
    world.update(world.fixedDelta);
    expect(start).not.toHaveBeenCalled();
    expect(pre).not.toHaveBeenCalled();
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
    // Turned back square, the same ray meets a face rather than a corner.
    polygon.rotation = 0;
    const face = world.raycast(new Vector2(), new Vector2(1, 0), 10, 2)[0];
    expect(face.distance).toBeCloseTo(7, 9);
    expect([face.normal.x, face.normal.y]).toEqual([-1, -0]);
  });

  it('raycasts keep inside hits that tolerance places just outside the bounds', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    // The 1e-5 edge at x = 1, between two nearly horizontal ones, makes `contains` accept
    // points up to geometryEpsilon / 1e-5 (1e-3) beyond it, so beyond the AABB too: a ray
    // starting there hits at distance zero even pointing away.
    const sliver = object(
      Colliders.polygon([
        [-10, -0.001],
        [1, 0],
        [1, 1e-5],
        [-10, 0.00101],
      ]),
      0,
      0,
      { type: 'static' },
    );
    world.register(sliver);
    const away = new Vector2(1, 0);
    expect(world.raycast(new Vector2(1.0005, 5e-6), away, 10)).toMatchObject([
      { owner: sliver, distance: 0 },
    ]);
    expect(world.raycast(new Vector2(1.01, 5e-6), away, 10)).toEqual([]);
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

describe('mutable static poses', () => {
  it('reflect every transform input and ancestor change in the next query', () => {
    const scene = new Scene();
    const bar = scene.add(new GameObject());
    bar.collider = Colliders.box(4, 0.2);
    const hit = () =>
      scene.physics.raycast(new Vector2(1.5, -5), new Vector2(0, 1), 10).length;
    expect(hit()).toBe(1);
    bar.rotation = Math.PI / 2;
    expect(hit()).toBe(0);
    bar.rotation = 0;
    expect(hit()).toBe(1);
    bar.scale.set(0.5, 1);
    expect(hit()).toBe(0);
    bar.scale.set(1, 1);
    expect(hit()).toBe(1);
    bar.skew.set(0, Math.PI / 3);
    expect(hit()).toBe(0);
    bar.skew.set(0, 0);
    expect(hit()).toBe(1);
    bar.pivot.set(3, 0);
    expect(hit()).toBe(0);
    bar.pivot.set(0, 0);
    expect(hit()).toBe(1);
    const holder = scene.add(new Group2D());
    holder.add(bar);
    holder.position.x = 10;
    expect(hit()).toBe(0);
    holder.position.x = 0;
    expect(hit()).toBe(1);
    scene.destroy();
  });

  it('returns the same overlaps inside a frozen pose snapshot as outside it', () => {
    const scene = new Scene();
    const world = scene.physics;
    // Unit boxes on a jittered grid, with sensors and a collider whose category the probe masks out.
    const owners: GameObject[] = [];
    for (let i = 0; i < 80; i++) {
      const owner = scene.add(new GameObject());
      owner.collider = Colliders.box(1, 1);
      owner.collider.sensor = i % 9 === 0;
      if (i % 11 === 0) owner.collider.category = 2;
      owner.position.set(
        (i % 10) * 1.3 + (i % 3) * 0.1,
        Math.floor(i / 10) * 1.3,
      );
      owners.push(owner);
    }
    const probe = new GameObject();
    const shape = Colliders.circle(0.7);
    shape.mask = 1;
    const summarize = (hits: readonly ContactQuery[]) =>
      hits.map((hit) => [
        owners.indexOf(hit.owner),
        hit.sensor,
        hit.penetration,
        hit.normal.x,
        hit.normal.y,
      ]);
    let compared = 0;
    for (let i = 0; i < 60; i++) {
      probe.position.set(((i * 0.37) % 14) - 0.5, ((i * 0.53) % 11) - 0.5);
      const live = summarize(world.overlap(shape, probe));
      const frozen = world.withPoseSnapshot(() =>
        summarize(world.overlap(shape, probe)),
      );
      expect(frozen).toEqual(live);
      compared += live.length;
    }
    // The probes must actually touch things, or equality would be vacuous.
    expect(compared).toBeGreaterThan(40);
    scene.destroy();
  });

  it('lets queries inside a moving pose snapshot follow the mover and its collider children', () => {
    const scene = new Scene();
    const world = scene.physics;
    const mover = scene.add(new GameObject());
    mover.collider = Colliders.circle(0.5);
    const child = new GameObject();
    child.collider = Colliders.circle(0.5);
    child.position.set(0, 3);
    mover.add(child);
    // Moved before the snapshot without any query in between.
    const other = scene.add(new GameObject());
    other.collider = Colliders.circle(0.5);
    world.raycast(new Vector2(-10, 0), new Vector2(1, 0), 1);
    other.position.set(20, 6);
    const hit = (x: number, y: number) =>
      world.raycast(new Vector2(x - 5, y), new Vector2(1, 0), 10)[0]?.owner;
    const seen = world.withPoseSnapshot(() => {
      const before = [hit(0, 0), hit(0, 3), hit(20, 6)];
      mover.position.x = 10;
      return [...before, hit(10, 0), hit(10, 3), hit(0, 0), hit(0, 3)];
    }, mover);
    expect(seen).toEqual([
      mover,
      child,
      other,
      mover,
      child,
      undefined,
      undefined,
    ]);
    scene.destroy();
  });
});

describe('static sensor coverage', () => {
  it('pairs static colliders with static sensors that sort after them', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const wall = object(Colliders.box(2, 2), 0, 0, { type: 'static' });
    const later = object(Colliders.box(2, 2), 1, 0, { type: 'static' });
    later.collider!.sensor = true;
    const earlier = object(Colliders.box(2, 2), -1, 0, { type: 'static' });
    earlier.collider!.sensor = true;
    for (const owner of [wall, later, earlier]) world.register(owner);
    // No listeners: unobserved contacts dispatch nothing, so no callback interrupts the sweep.
    world.update(world.fixedDelta);
    expect(world.debugSnapshot().contacts).toHaveLength(3);
  });

  it('keeps every neighbour pair when all sensors reverse their sweep order at once', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    // Each circle overlaps only its immediate neighbours: 15 apart, radius 10.
    const sensors = Array.from({ length: 60 }, (_, i) => {
      const owner = object(Colliders.circle(10), i * 15, 0, { type: 'static' });
      owner.collider!.sensor = true;
      world.register(owner);
      return owner;
    });
    world.update(world.fixedDelta);
    expect(world.debugSnapshot().contacts).toHaveLength(59);
    for (const [i, owner] of sensors.entries())
      owner.position.set((59 - i) * 15, 0);
    world.update(world.fixedDelta);
    expect(world.debugSnapshot().contacts).toHaveLength(59);
  });
});

describe('static contact velocity', () => {
  it('ignores velocity stored on a static body when solving friction', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 20] });
    const ground = object(Colliders.box(20, 1), 0, 1, { type: 'static' });
    ground.body!.velocity.x = 50;
    const crate = object(Colliders.box(1, 1), 0, 0, { friction: 1 });
    world.register(ground);
    world.register(crate);
    advance(world, 0.5);
    // Settling jitter stays tiny; dragging along at the stored 50 units/s would not.
    expect(Math.abs(crate.body!.velocity.x)).toBeLessThan(0.01);
    expect(Math.abs(crate.position.x)).toBeLessThan(0.01);
  });
});
