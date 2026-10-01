import { expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import {
  Colliders,
  PhysicsWorld2D,
  RigidBody2D,
  StaticChain2D,
  StaticConcave2D,
  decomposeConvex,
} from '../packages/core/src/physics2d/index.js';

type Polygon = [number, number][];
const area = (points: Polygon): number => {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!,
      q = points[(i + 1) % points.length]!;
    sum += p[0] * q[1] - p[1] * q[0];
  }
  return sum / 2;
};
// An upward-opening cup in a y-down world, wound clockwise on purpose.
const cup: Polygon = [
  [0, 0],
  [20, 0],
  [20, 80],
  [80, 80],
  [80, 0],
  [100, 0],
  [100, 100],
  [0, 100],
];
const lShape: Polygon = [
  [0, 0],
  [60, 0],
  [60, 20],
  [20, 20],
  [20, 60],
  [0, 60],
];

function ball(world: PhysicsWorld2D, x: number, y: number): GameObject {
  const object = new GameObject();
  object.position.set(x, y);
  object.collider = Colliders.circle(5);
  object.body = new RigidBody2D({ ccd: true });
  world.register(object);
  return object;
}
function run(world: PhysicsWorld2D, seconds: number): void {
  for (let i = 0; i < seconds * 120; i++) world.update(1 / 120);
}
function attach(world: PhysicsWorld2D, root: GameObject): void {
  // Scene.add would register the subtree; do the same by hand for a bare world.
  const visit = (object: GameObject): void => {
    world.register(object);
    for (const child of object.children) visit(child);
  };
  visit(root);
}

it('decomposes concave polygons into strictly convex pieces that cover the area exactly', () => {
  for (const shape of [cup, lShape, [...lShape].reverse() as Polygon]) {
    const pieces = decomposeConvex(shape);
    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) {
      expect(piece.length).toBeLessThanOrEqual(32);
      // Colliders.polygon rejects non-convex or collinear input.
      expect(() => Colliders.polygon(piece)).not.toThrow();
      expect(area(piece)).toBeGreaterThan(0);
    }
    const total = pieces.reduce((sum, piece) => sum + area(piece), 0);
    expect(total).toBeCloseTo(Math.abs(area(shape)), 6);
  }
  expect(
    decomposeConvex([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]),
  ).toHaveLength(1);
});

it('rejects self-intersecting, degenerate and oversized polygons', () => {
  const bowtie: Polygon = [
    [0, 0],
    [10, 10],
    [10, 0],
    [0, 10],
  ];
  expect(() => decomposeConvex(bowtie)).toThrow(/self-intersect/);
  expect(() =>
    decomposeConvex([
      [0, 0],
      [5, 0],
      [10, 0],
    ]),
  ).toThrow(RangeError);
  expect(() =>
    decomposeConvex([
      [0, 0],
      [1, 1],
    ]),
  ).toThrow(RangeError);
  expect(() =>
    decomposeConvex(Array.from({ length: 300 }, (_, i) => [i, i * i])),
  ).toThrow(RangeError);
});

it('keeps a ball inside a concave cup and lets one fall past its rim', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 980] });
  const container = new StaticConcave2D(cup);
  container.position.set(0, 100);
  attach(world, container);
  const inside = ball(world, 50, 110);
  const outside = ball(world, 150, 100);
  run(world, 3);
  // Container origin is y = 100, so the floor top is at y = 100 + 80 = 180 (gravity is +y).
  expect(inside.position.y).toBeGreaterThan(165);
  expect(inside.position.y).toBeLessThan(180);
  expect(inside.position.x).toBeGreaterThan(20);
  expect(inside.position.x).toBeLessThan(80);
  expect(outside.position.y).toBeGreaterThan(1000);
});

it('builds a solid chain, optionally closed, that contains fast ccd bodies', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  const room = new StaticChain2D(
    [
      [0, 0],
      [200, 0],
      [200, 200],
      [0, 200],
    ],
    { closed: true, thickness: 4 },
  );
  expect(room.segments).toHaveLength(4);
  attach(world, room);
  const shot = ball(world, 100, 100);
  shot.body!.velocity.set(5000, 3300);
  shot.body!.restitution = 1;
  let outOfBounds = 0;
  for (let i = 0; i < 360; i++) {
    world.update(1 / 120);
    const { x, y } = shot.position;
    if (x < 0 || x > 200 || y < 0 || y > 200) outOfBounds++;
  }
  expect(outOfBounds).toBe(0);

  expect(() => new StaticChain2D([[0, 0]])).toThrow(RangeError);
  expect(
    () =>
      new StaticChain2D([
        [0, 0],
        [0, 0],
      ]),
  ).toThrow(RangeError);
  expect(
    () =>
      new StaticChain2D(
        [
          [0, 0],
          [1, 0],
        ],
        { closed: true },
      ),
  ).toThrow(RangeError);
  expect(
    new StaticChain2D([
      [0, 0],
      [10, 0],
      [20, 5],
    ]).segments,
  ).toHaveLength(2);
});
