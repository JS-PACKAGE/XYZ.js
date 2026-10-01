import { expect, it, vi } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import {
  Colliders,
  DistanceJoint,
  MouseJoint,
  PhysicsDebugDraw2D,
  PhysicsWorld2D,
  RigidBody2D,
} from '../packages/core/src/physics2d/index.js';

function body(
  world: PhysicsWorld2D,
  x: number,
  y: number,
  type: 'static' | 'dynamic' = 'dynamic',
  sensor = false,
): GameObject {
  const object = new GameObject();
  object.position.set(x, y);
  object.collider =
    type === 'static' ? Colliders.box(100, 10) : Colliders.circle(5);
  object.collider.sensor = sensor;
  object.body = new RigidBody2D({ type });
  world.register(object);
  return object;
}

it('reports shape state, active contacts and joint anchors', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 980] });
  body(world, 0, 100, 'static');
  const ball = body(world, 0, 80);
  body(world, 200, 0, 'static', true);
  const hanging = body(world, 300, 40);
  const joint = world.addJoint(
    new DistanceJoint({ bodyA: hanging, anchor: [300, 40], anchorB: [300, 0] }),
  );
  for (let i = 0; i < 30; i++) world.update(1 / 120);

  const snapshot = world.debugSnapshot();
  expect(snapshot.shapes).toHaveLength(4);
  const circles = snapshot.shapes.filter((shape) => shape.kind === 'circle');
  const polygons = snapshot.shapes.filter((shape) => shape.kind === 'polygon');
  expect(circles.every((shape) => shape.dynamic && shape.radius === 5)).toBe(
    true,
  );
  expect(polygons.map((shape) => shape.sensor).sort()).toEqual([false, true]);
  expect(polygons[0]!.points).toHaveLength(8);
  expect(polygons.every((shape) => !shape.dynamic)).toBe(true);

  // The ball rests on the 10-thick floor whose top is y = 95.
  expect(snapshot.contacts).toHaveLength(1);
  expect(Math.abs(snapshot.contacts[0]!.normal[1])).toBeCloseTo(1, 5);
  expect(snapshot.contacts[0]!.points[0]![1]).toBeCloseTo(95, 0);

  expect(snapshot.joints).toEqual([
    { type: 'distance', anchors: expect.any(Array) },
  ]);
  const [ax, ay, bx, by] = snapshot.joints[0]!.anchors;
  // With no bodyB the fixed world is side A, so the world anchor comes first.
  expect([ax, ay]).toEqual([300, 0]);
  expect([bx, by]).toEqual([hanging.position.x, hanging.position.y]);
  expect(joint.anchors()).toEqual(snapshot.joints[0]!.anchors);
  expect(ball.body!.isSleeping).toBe(false);
});

it('marks sleeping bodies and uses the mouse target as the world anchor', () => {
  const world = new PhysicsWorld2D({ gravity: [0, 980] });
  body(world, 0, 100, 'static');
  const ball = body(world, 0, 90);
  for (let i = 0; i < 240; i++) world.update(1 / 120);
  expect(
    world.debugSnapshot().shapes.find((shape) => shape.dynamic)!.sleeping,
  ).toBe(true);

  const mouse = world.addJoint(
    new MouseJoint({ body: ball, target: [0, 90], maxForce: 1e5 }),
  );
  mouse.setTarget(50, 60);
  const [tx, ty] = world.debugSnapshot().joints[0]!.anchors;
  expect([tx, ty]).toEqual([50, 60]);
});

it('draws only what touches the region, so far-flung bodies cannot blow the raster budget', () => {
  // Node has no Path2D; instruction building only needs the constructor and path methods to exist.
  vi.stubGlobal(
    'Path2D',
    class {
      constructor() {
        return new Proxy(this, { get: () => () => undefined });
      }
    },
  );
  const world = new PhysicsWorld2D({ gravity: [0, 0] });
  body(world, 10, 10);
  const far = body(world, 1e7, 1e7);
  const anchored = new DistanceJoint({
    bodyA: far,
    anchor: [1e7, 1e7],
    anchorB: [0, 0],
  });
  world.addJoint(anchored);
  const config = {
    colliders: true,
    contacts: true,
    joints: true,
    bounds: false,
    region: undefined,
  };
  expect(() =>
    PhysicsDebugDraw2D.instructions(world.debugSnapshot(), config),
  ).toThrow(RangeError);
  const clipped = PhysicsDebugDraw2D.instructions(world.debugSnapshot(), {
    ...config,
    region: { x: 0, y: 0, width: 100, height: 100 },
  });
  expect(clipped).toHaveLength(1);
});
