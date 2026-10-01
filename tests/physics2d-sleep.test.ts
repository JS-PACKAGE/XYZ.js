import { expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import {
  Colliders,
  PhysicsWorld2D,
  RigidBody2D,
} from '../packages/core/src/physics2d/index.js';
import { Vector2 } from '../packages/math/src/index.js';

function box(
  world: PhysicsWorld2D,
  y: number,
  type: 'static' | 'dynamic' = 'dynamic',
): GameObject {
  const object = new GameObject();
  object.position.y = y;
  object.collider = Colliders.box(type === 'static' ? 100 : 2, 2);
  object.body = new RigidBody2D({ type, lockRotation: true });
  world.register(object);
  return object;
}
function advance(world: PhysicsWorld2D, seconds: number): void {
  for (let i = 0; i < seconds * 120; i++) world.update(1 / 120);
}
it('sleeps a resting stack without position drift and wakes the group on impact', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 20] });
  box(world, 10, 'static');
  const lower = box(world, 8),
    upper = box(world, 6);
  advance(world, 4);
  expect(lower.body!.isSleeping).toBe(true);
  expect(upper.body!.isSleeping).toBe(true);
  const y = upper.position.y;
  advance(world, 1);
  expect(upper.position.y).toBe(y);
  const falling = box(world, 0);
  falling.body!.velocity.y = 20;
  advance(world, 0.2);
  expect(lower.body!.isSleeping).toBe(false);
  expect(upper.body!.isSleeping).toBe(false);
});
it('wakes on force, impulse, mutable velocity/transform, sensor entry, and removed support', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 20] });
  const floor = box(world, 10, 'static'),
    resting = box(world, 8);
  const settle = (): void => {
    advance(world, 2);
    expect(resting.body!.isSleeping).toBe(true);
  };
  settle();
  resting.body!.applyForce(new Vector2(1, 0));
  expect(resting.body!.isSleeping).toBe(false);
  settle();
  resting.body!.applyImpulse(new Vector2(0, -1));
  expect(resting.body!.isSleeping).toBe(false);
  settle();
  resting.body!.velocity.x = 1;
  expect(resting.body!.isSleeping).toBe(false);
  resting.body!.velocity.x = 0;
  settle();
  resting.position.x += 1;
  expect(resting.body!.isSleeping).toBe(false);
  settle();
  const sensor = box(world, 8, 'static');
  sensor.collider!.sensor = true;
  world.update(1 / 120);
  expect(resting.body!.isSleeping).toBe(false);
  world.unregister(sensor);
  settle();
  world.unregister(floor);
  expect(resting.body!.isSleeping).toBe(false);
  advance(world, 0.5);
  expect(resting.position.y).toBeGreaterThan(9);
});
it('respects allowSleep and explicit wake', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  const body = box(world, 0).body!;
  body.allowSleep = false;
  advance(world, 1);
  expect(body.isSleeping).toBe(false);
  body.allowSleep = true;
  advance(world, 1);
  expect(body.isSleeping).toBe(true);
  body.wake();
  expect(body.isSleeping).toBe(false);
});
it('lets a bouncy ball settle and sleep under pixel-scale gravity, but still bounces on hard impacts', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 600] });
  const floor = new GameObject();
  floor.position.y = 418;
  floor.collider = Colliders.box(300, 20);
  world.register(floor);
  const ball = new GameObject();
  ball.position.y = 380;
  ball.collider = Colliders.circle(9);
  ball.body = new RigidBody2D({ restitution: 0.3 });
  world.register(ball);
  let bounced = false;
  for (let i = 0; i < 360; i++) {
    world.update(1 / 60);
    if (ball.body.velocity.y < -20) bounced = true;
  }
  expect(bounced).toBe(true);
  expect(ball.body.isSleeping).toBe(true);
});
