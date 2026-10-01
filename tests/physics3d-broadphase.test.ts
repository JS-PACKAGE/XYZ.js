import { expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  SphereCollider3D,
  BoxCollider3D,
  RigidBody3D,
} from '../packages/core/src/physics3d/index.js';

it('refits mutable static transforms and removes stale query/solver leaves', () => {
  const scene = new Scene();
  const target = scene.add(new Object3D());
  target.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6)
      ?.object,
  ).toBe(target);
  target.position.y = 5;
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6),
  ).toBeUndefined();
  target.position.y = 0;
  scene.remove(target);
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6),
  ).toBeUndefined();
  scene.add(target);
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6)
      ?.object,
  ).toBe(target);
  scene.destroy();
});
it('matches isolated shape queries while rejecting spatially distant pairs', () => {
  const scene = new Scene();
  const objects: Object3D[] = [];
  for (let i = 0; i < 64; i++) {
    const o = new Object3D();
    o.collider = new SphereCollider3D(0.5);
    o.position.set(i * 4, 0, 0);
    o.body = new RigidBody3D({ gravityScale: 0 });
    objects.push(scene.add(o));
  }
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(scene.physics3D.stats.candidatePairs).toBe(0);
  const query = new Object3D();
  query.position.set(20, 0, 0);
  expect(
    scene.physics3D
      .overlap(new SphereCollider3D(0.6), query)
      .map((h) => h.object),
  ).toEqual([objects[5]]);
  expect(scene.physics3D.stats.queryCandidates).toBe(1);
  expect(
    scene.physics3D.sweepSphere(
      new Vector3(17, 0, 0),
      0.25,
      new Vector3(6, 0, 0),
    )?.distance,
  ).toBeCloseTo(2.25, 3);
  scene.destroy();
  expect(scene.physics3D.size).toBe(0);
});
