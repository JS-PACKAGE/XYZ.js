import { expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import {
  Collider2D,
  Colliders,
  PhysicsWorld2D,
  RigidBody2D,
} from '../packages/core/src/physics2d/index.js';

function wall(
  world: PhysicsWorld2D,
  collider: Collider2D,
  x: number,
  y = 0,
  rotation = 0,
): GameObject {
  const object = new GameObject();
  object.position.set(x, y);
  object.rotation = rotation;
  object.collider = collider;
  object.body = new RigidBody2D({ type: 'static' });
  world.register(object);
  return object;
}
function bullet(
  world: PhysicsWorld2D,
  collider: Collider2D,
  speed: number,
  ccd: boolean,
  restitution = 0,
  angle = 0,
): GameObject {
  const object = new GameObject();
  object.collider = collider;
  object.body = new RigidBody2D({ ccd, restitution, lockRotation: true });
  object.body.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
  world.register(object);
  return object;
}
function run(world: PhysicsWorld2D, seconds: number): void {
  for (let i = 0; i < seconds * 120; i++) world.update(1 / 120);
}
// 6000 units/s is 50 units per fixed step: ten times the wall and twenty-five times the radius.
const fast = 6000;

it('tunnels through a thin box wall without ccd and is stopped with it', () => {
  for (const [ccd, stopped] of [
    [false, false],
    [true, true],
  ] as const) {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    wall(world, Colliders.box(4, 400), 300);
    const shot = bullet(world, Colliders.circle(2), fast, ccd);
    shot.position.x = 100;
    run(world, 0.5);
    expect(shot.position.x < 300).toBe(stopped);
  }
});

it('stops circle, box and polygon bullets against circle, box and rotated walls', () => {
  const walls: [string, () => Collider2D, number][] = [
    ['box', () => Colliders.box(4, 400), 0],
    ['rotated box', () => Colliders.box(4, 400), 0.3],
    ['circle', () => Colliders.circle(6), 0],
    [
      'triangle',
      () =>
        Colliders.polygon([
          [-3, -100],
          [3, -100],
          [0, 100],
        ]),
      0,
    ],
  ];
  const shots: [string, () => Collider2D][] = [
    ['circle', () => Colliders.circle(2)],
    ['box', () => Colliders.box(3, 3)],
    [
      'polygon',
      () =>
        Colliders.polygon([
          [-2, -2],
          [3, 0],
          [-2, 2],
        ]),
    ],
  ];
  for (const [wallName, makeWall, rotation] of walls)
    for (const [shotName, makeShot] of shots) {
      const world = new PhysicsWorld2D({ gravity: [0, 0] });
      wall(world, makeWall(), 300, 0, rotation);
      const shot = bullet(world, makeShot(), fast, true);
      shot.position.x = 100;
      run(world, 0.5);
      expect(shot.position.x, `${shotName} vs ${wallName}`).toBeLessThan(310);
      expect(shot.position.x, `${shotName} vs ${wallName}`).toBeGreaterThan(
        100,
      );
    }
});

it('lets the solver apply restitution after the swept hit', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  wall(world, Colliders.box(4, 400), 300);
  const shot = bullet(world, Colliders.circle(2), fast, true, 1);
  shot.position.x = 100;
  run(world, 0.1);
  expect(shot.body!.velocity.x).toBeLessThan(-fast * 0.9);
  expect(shot.position.x).toBeLessThan(300);
});

it('ignores sensors, filtered colliders, and misses beside the wall', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  const sensorShape = Colliders.box(4, 400);
  sensorShape.sensor = true;
  wall(world, sensorShape, 200);
  wall(world, Colliders.box(4, 100), 300, 300);
  const filteredShape = Colliders.box(4, 400);
  filteredShape.category = 2;
  wall(world, filteredShape, 400);
  const shape = Colliders.circle(2);
  shape.mask = 1;
  const shot = bullet(world, shape, fast, true);
  shot.position.x = 100;
  run(world, 0.2);
  expect(shot.position.x).toBeGreaterThan(1000);
});

it('leaves slow ccd bodies to the normal solver', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  wall(world, Colliders.box(40, 400), 300);
  const slow = bullet(world, Colliders.circle(2), 120, true);
  slow.position.x = 100;
  run(world, 2);
  expect(slow.position.x).toBeLessThan(300);
  expect(slow.position.x).toBeGreaterThan(250);
});
