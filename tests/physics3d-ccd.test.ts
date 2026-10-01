import { expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  SphereCollider3D,
  BoxCollider3D,
  CapsuleCollider3D,
  TriangleMeshCollider3D,
  CompoundCollider3D,
  RigidBody3D,
} from '../packages/core/src/physics3d/index.js';
import type { Collider3D } from '../packages/core/src/physics3d/index.js';
const moving = [
  () => new SphereCollider3D(0.25),
  () => new BoxCollider3D(new Vector3(0.25, 0.25, 0.25)),
  () => new CapsuleCollider3D(0.25, 1),
  () =>
    new CompoundCollider3D(
      [-1, 1].map((y) => ({
        collider: new SphereCollider3D(0.25),
        position: new Vector3(0, y, 0),
      })),
    ),
];
const targets = [
  () => new BoxCollider3D(new Vector3(0.01, 5, 5)),
  () => new TriangleMeshCollider3D([0, -5, -5, 0, 5, -5, 0, 0, 5], [0, 1, 2]),
  () =>
    new CompoundCollider3D([
      { collider: new BoxCollider3D(new Vector3(0.01, 5, 5)) },
    ]),
];
function launch(
  scene: Scene,
  collider: Collider3D,
  continuous = true,
): Object3D {
  const o = new Object3D();
  o.collider = collider;
  o.position.x = -3;
  o.body = new RigidBody3D({
    continuous,
    gravityScale: 0,
    lockRotation: true,
    allowSleep: false,
  });
  o.body.velocity.x = 600;
  return scene.add(o);
}
for (let i = 0; i < moving.length; i++)
  for (let j = 0; j < targets.length; j++)
    it(`stops fast shape ${i} at real static target ${j} and resolves velocity/contact`, () => {
      const scene = new Scene(),
        wall = new Object3D();
      wall.collider = targets[j]();
      scene.add(wall);
      const body = launch(scene, moving[i]());
      let starts = 0;
      body.addEventListener('collisionstart', () => starts++);
      scene.physics3D.update(scene.physics3D.fixedDelta);
      expect(body.position.x).toBeLessThan(-0.24);
      expect(body.position.x).toBeGreaterThan(-0.28);
      expect(Math.abs(body.body!.velocity.x)).toBeLessThan(0.01);
      expect(starts).toBe(1);
      scene.destroy();
    });
it('uses full shape coverage for off-center impact, not a center ray', () => {
  const scene = new Scene(),
    wall = new Object3D();
  wall.collider = new BoxCollider3D(new Vector3(0.01, 0.1, 0.1));
  wall.position.y = 0.8;
  scene.add(wall);
  const o = launch(scene, new BoxCollider3D(new Vector3(0.25, 1, 0.25)));
  o.body = new RigidBody3D({
    continuous: true,
    gravityScale: 0,
    allowSleep: false,
    friction: 0,
  });
  o.body.velocity.x = 600;
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(o.position.x).toBeLessThan(0);
  expect(Math.abs(o.body!.angularVelocity.z)).toBeGreaterThan(1);
  expect(o.body!.velocity.x).toBeLessThan(600);
  scene.destroy();
});
it('preserves compound gaps, sensors, reciprocal filters and discrete opt-out', () => {
  const scene = new Scene(),
    wall = new Object3D();
  wall.collider = new CompoundCollider3D(
    [-1, 1].map((y) => ({
      collider: new BoxCollider3D(new Vector3(0.01, 0.2, 2)),
      position: new Vector3(0, y, 0),
    })),
  );
  scene.add(wall);
  const o = launch(scene, new SphereCollider3D(0.2));
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(o.position.x).toBeCloseTo(2, 6);
  scene.remove(wall);
  wall.collider = new BoxCollider3D(new Vector3(0.01, 5, 5), { sensor: true });
  scene.add(wall);
  o.position.x = -3;
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(o.position.x).toBeCloseTo(2, 6);
  wall.collider = new BoxCollider3D(new Vector3(0.01, 5, 5), { mask: 2 });
  o.position.x = -3;
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(o.position.x).toBeCloseTo(2, 6);
  wall.collider = new BoxCollider3D(new Vector3(0.01, 5, 5));
  scene.remove(o);
  const discrete = launch(scene, new SphereCollider3D(0.2), false);
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(discrete.position.x).toBeCloseTo(2, 6);
  scene.destroy();
});
it('sweeps a box through Scene facade and returns its first surface contact', () => {
  const scene = new Scene(),
    wall = new Object3D();
  wall.collider = new BoxCollider3D(new Vector3(0.01, 5, 5));
  scene.add(wall);
  const query = new Object3D();
  query.position.x = -3;
  const hit = scene.physics3D.sweep(
    new BoxCollider3D(new Vector3(0.25, 0.25, 0.25)),
    query,
    new Vector3(5, 0, 0),
  );
  expect(hit?.object).toBe(wall);
  expect(hit?.distance).toBeCloseTo(2.74, 3);
  expect(hit?.normal.x).toBeCloseTo(-1, 6);
  scene.destroy();
});
