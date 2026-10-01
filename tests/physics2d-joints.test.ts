import { expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import { Vector2 } from '../packages/math/src/index.js';
import {
  Colliders,
  DistanceJoint,
  MouseJoint,
  PhysicsWorld2D,
  PrismaticJoint,
  RevoluteJoint,
  RigidBody2D,
  WeldJoint,
} from '../packages/core/src/physics2d/index.js';
import type { Collider2D } from '../packages/core/src/physics2d/index.js';

function body(
  world: PhysicsWorld2D,
  x: number,
  y: number,
  options: ConstructorParameters<typeof RigidBody2D>[0] = {},
  collider: Collider2D = Colliders.circle(5),
): GameObject {
  const object = new GameObject();
  object.position.set(x, y);
  object.collider = collider;
  object.body = new RigidBody2D(options);
  world.register(object);
  return object;
}
function run(
  world: PhysicsWorld2D,
  seconds: number,
  each?: (time: number) => void,
): void {
  const steps = Math.round(seconds * 120);
  for (let i = 1; i <= steps; i++) {
    world.update(1 / 120);
    each?.(i / 120);
  }
}

it('swings a revolute pendulum at the analytic period without stretching', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 980] });
  const bob = body(world, 100, 0);
  bob.position.set(100 * Math.sin(0.1), 100 * Math.cos(0.1));
  world.addJoint(new RevoluteJoint({ bodyA: bob, anchor: [0, 0] }));
  const crossings: number[] = [];
  let previous = bob.position.x;
  let longest = 0;
  run(world, 6, (time) => {
    longest = Math.max(
      longest,
      Math.abs(Math.hypot(bob.position.x, bob.position.y) - 100),
    );
    if (previous > 0 && bob.position.x <= 0) crossings.push(time);
    previous = bob.position.x;
  });
  expect(crossings.length).toBeGreaterThanOrEqual(2);
  const period = crossings[1]! - crossings[0]!;
  const expected = 2 * Math.PI * Math.sqrt(100 / 980);
  expect(Math.abs(period - expected) / expected).toBeLessThan(0.03);
  expect(longest).toBeLessThan(0.5);
});

it('holds a rigid distance joint and lets a spring joint oscillate near its frequency', () => {
  const rigid = new PhysicsWorld2D({ gravity: [0, 980] });
  const weight = body(rigid, 80, 60);
  rigid.addJoint(
    new DistanceJoint({ bodyA: weight, anchor: [80, 60], anchorB: [0, 0] }),
  );
  let drift = 0;
  run(rigid, 3, () => {
    drift = Math.max(
      drift,
      Math.abs(Math.hypot(weight.position.x, weight.position.y) - 100),
    );
  });
  expect(drift).toBeLessThan(0.5);

  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  const bob = body(world, 120, 0);
  world.addJoint(
    new DistanceJoint({
      bodyA: bob,
      anchor: [120, 0],
      anchorB: [100, 0],
      length: 0,
      frequencyHz: 2,
      dampingRatio: 0,
    }),
  );
  // The anchor sits at 100; the body starts 20 to the right.
  bob.position.x = 120;
  const crossings: number[] = [];
  let previous = bob.position.x - 100;
  run(world, 3, (time) => {
    const offset = bob.position.x - 100;
    if (previous > 0 && offset <= 0) crossings.push(time);
    previous = offset;
  });
  expect(crossings.length).toBeGreaterThanOrEqual(2);
  const period = crossings[1]! - crossings[0]!;
  expect(period).toBeGreaterThan(0.45);
  expect(period).toBeLessThan(0.6);
});

it('drives a revolute motor to speed and stops a swinging bar at its angle limit', () => {
  const motor = new PhysicsWorld2D({ gravity: [0, 0] });
  const wheel = body(motor, 0, 0);
  motor.addJoint(
    new RevoluteJoint({
      bodyA: wheel,
      anchor: [0, 0],
      motorSpeed: 3,
      maxMotorTorque: 1e6,
    }),
  );
  run(motor, 1);
  expect(wheel.body!.angularVelocity).toBeCloseTo(3, 1);

  const world = new PhysicsWorld2D({ gravity: [0, 980] });
  const bar = body(world, 50, 0, {}, Colliders.box(100, 10));
  world.addJoint(
    new RevoluteJoint({
      bodyA: bar,
      anchor: [0, 0],
      lowerAngle: -0.5,
      upperAngle: 0.5,
    }),
  );
  run(world, 3);
  expect(bar.rotation).toBeGreaterThan(0.4);
  expect(bar.rotation).toBeLessThan(0.56);
  expect(bar.body!.angularVelocity).toBeCloseTo(0, 0);
});

it('slides along a prismatic axis between limits, drives its motor and locks rotation', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 980] });
  const block = body(world, 0, 0, {}, Colliders.box(20, 10));
  const joint = world.addJoint(
    new PrismaticJoint({
      bodyA: block,
      anchor: [0, 0],
      axis: [0, 1],
      lowerTranslation: 0,
      upperTranslation: 100,
    }),
  );
  run(world, 2);
  expect(block.position.y).toBeGreaterThan(98);
  expect(block.position.y).toBeLessThan(102);
  expect(Math.abs(block.position.x)).toBeLessThan(0.5);
  expect(Math.abs(block.rotation)).toBeLessThan(0.01);
  expect(joint.jointTranslation).toBeGreaterThan(95);

  const motor = new PhysicsWorld2D({ gravity: [0, 0] });
  const slider = body(motor, 0, 0, {}, Colliders.box(20, 10));
  motor.addJoint(
    new PrismaticJoint({
      bodyA: slider,
      anchor: [0, 0],
      axis: [1, 0],
      motorSpeed: 50,
      maxMotorForce: 1e6,
    }),
  );
  run(motor, 1);
  expect(slider.position.x).toBeGreaterThan(46);
  expect(slider.position.x).toBeLessThan(52);
  expect(Math.abs(slider.position.y)).toBeLessThan(0.5);
});

it('keeps welded bodies rigid when struck', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  const left = body(world, 0, 0, {}, Colliders.box(20, 20));
  const right = body(world, 40, 0, {}, Colliders.box(20, 20));
  world.addJoint(new WeldJoint({ bodyA: left, bodyB: right, anchor: [20, 0] }));
  right.body!.applyImpulse(new Vector2(0, 200), new Vector2(50, 0));
  left.body!.velocity.set(30, 0);
  let separation = 0;
  let relative = 0;
  run(world, 2, () => {
    const dx = right.position.x - left.position.x,
      dy = right.position.y - left.position.y;
    separation = Math.max(separation, Math.abs(Math.hypot(dx, dy) - 40));
    relative = Math.max(relative, Math.abs(right.rotation - left.rotation));
  });
  expect(separation).toBeLessThan(1);
  expect(relative).toBeLessThan(0.05);
  expect(Math.abs(left.rotation)).toBeGreaterThan(0.1);
});

it('pulls a dragged body to a moving mouse target within the force limit', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  const box = body(world, 0, 0, {}, Colliders.box(20, 20));
  const mouse = world.addJoint(
    new MouseJoint({
      body: box,
      target: [0, 0],
      maxForce: 1e6,
      frequencyHz: 5,
    }),
  );
  mouse.setTarget(100, 40);
  run(world, 2);
  expect(box.position.x).toBeGreaterThan(97);
  expect(box.position.x).toBeLessThan(103);
  expect(box.position.y).toBeGreaterThan(37);
  expect(box.position.y).toBeLessThan(43);

  const weak = new PhysicsWorld2D({ gravity: [0, 0] });
  const heavy = body(weak, 0, 0, { mass: 100 });
  const slow = weak.addJoint(
    new MouseJoint({ body: heavy, target: [0, 0], maxForce: 50 }),
  );
  slow.setTarget(1000, 0);
  run(weak, 1);
  // a = 50 / 100 = 0.5 per second squared bounds the move to about 0.25.
  expect(heavy.position.x).toBeLessThan(1);
});

it('lets jointed bodies pass through each other unless collideConnected is set', () => {
  for (const collideConnected of [false, true]) {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const a = body(world, 0, 0, {}, Colliders.box(20, 20));
    const b = body(world, 5, 0, {}, Colliders.box(20, 20));
    world.addJoint(
      new RevoluteJoint({
        bodyA: a,
        bodyB: b,
        anchor: [2, 0],
        collideConnected,
      }),
    );
    let contacts = 0;
    a.addEventListener('collisionstart', () => contacts++);
    run(world, 0.1);
    expect(contacts).toBe(collideConnected ? 1 : 0);
  }
});

it('breaks only when the reaction exceeds breakForce and reports once', () => {
  for (const [breakForce, breaks] of [
    [500, true],
    [5000, false],
  ] as const) {
    const world = new PhysicsWorld2D({ gravity: [0, 980] });
    const weight = body(world, 0, 50);
    let reported = 0;
    const joint = world.addJoint(
      new DistanceJoint({
        bodyA: weight,
        anchor: [0, 50],
        anchorB: [0, 0],
        breakForce,
      }),
    );
    joint.onBreak = () => reported++;
    run(world, 0.5);
    expect(joint.attached).toBe(!breaks);
    expect(reported).toBe(breaks ? 1 : 0);
    if (breaks) expect(weight.position.y).toBeGreaterThan(100);
  }
});

it('validates attachment and detaches joints with their bodies', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  const a = body(world, 0, 0);
  const wall = body(world, 50, 0, { type: 'static' });
  const other = body(new PhysicsWorld2D(), 0, 0);
  expect(
    () => new RevoluteJoint({ bodyA: a, bodyB: a, anchor: [0, 0] }),
  ).toThrow(RangeError);
  expect(() =>
    world.addJoint(
      new RevoluteJoint({ bodyA: a, bodyB: other, anchor: [0, 0] }),
    ),
  ).toThrow(/registered/);
  expect(() =>
    world.addJoint(new WeldJoint({ bodyA: wall, anchor: [50, 0] })),
  ).toThrow(/dynamic/);
  const joint = world.addJoint(
    new WeldJoint({ bodyA: a, bodyB: wall, anchor: [25, 0] }),
  );
  expect(() => world.addJoint(joint)).toThrow(/already/);
  expect(world.joints).toEqual([joint]);
  world.unregister(a);
  expect(joint.attached).toBe(false);
  expect(world.joints).toEqual([]);
  expect(world.removeJoint(joint)).toBe(false);
});

it('keeps a jointed sleeper asleep with its partner and wakes both when the joint is removed', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 980] });
  const hanger = body(world, 0, 0, { type: 'static' }, Colliders.box(10, 10));
  const weight = body(world, 0, 40);
  const joint = world.addJoint(
    new DistanceJoint({
      bodyA: weight,
      bodyB: hanger,
      anchor: [0, 40],
      anchorB: [0, 0],
    }),
  );
  run(world, 3);
  expect(weight.body!.isSleeping).toBe(true);
  world.removeJoint(joint);
  expect(weight.body!.isSleeping).toBe(false);
  run(world, 0.5);
  expect(weight.position.y).toBeGreaterThan(100);
});
