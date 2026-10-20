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

it('pairs earlier static and sensor colliders with later bodies without counting static-static overlaps', () => {
  const scene = new Scene();
  const place = (o: Object3D, x: number) => {
    o.position.set(x, 0, 0);
    return scene.add(o);
  };
  const floor = new Object3D();
  floor.collider = new BoxCollider3D(new Vector3(1, 1, 1));
  place(floor, 0);
  // Overlapping static neighbours of the floor, never a contact pair.
  for (const x of [0.5, 1, 1.5]) {
    const o = new Object3D();
    o.collider = new BoxCollider3D(new Vector3(1, 1, 1));
    place(o, x);
  }
  const zone = new Object3D();
  zone.collider = new SphereCollider3D(1, { sensor: true });
  place(zone, 6);
  const ball = new Object3D();
  ball.collider = new SphereCollider3D(0.5);
  ball.body = new RigidBody3D({ gravityScale: 0 });
  place(ball, -1.2);
  const probe = new Object3D();
  probe.collider = new SphereCollider3D(0.5);
  probe.body = new RigidBody3D({ gravityScale: 0 });
  place(probe, 6.5);
  const started: string[] = [];
  floor.addEventListener('collisionstart', () => started.push('floor'));
  zone.addEventListener('collisionstart', () => started.push('zone'));
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(started.sort()).toEqual(['floor', 'zone']);
  expect(scene.physics3D.stats.candidatePairs).toBe(2);
  scene.destroy();
});

it('refreshes static poses after any transform input or ancestor change', () => {
  const scene = new Scene();
  const bar = scene.add(new Object3D());
  bar.collider = new BoxCollider3D(new Vector3(2, 0.1, 0.1));
  const hit = () =>
    scene.physics3D.raycast(new Vector3(1.5, 3, 0), new Vector3(0, -1, 0), 6)
      ?.object;
  expect(hit()).toBe(bar);
  bar.rotation.setFromEuler(0, Math.PI / 2, 0);
  expect(hit()).toBeUndefined();
  bar.rotation.setFromEuler(0, 0, 0);
  expect(hit()).toBe(bar);
  bar.scale.set(0.5, 1, 1);
  expect(hit()).toBeUndefined();
  bar.scale.set(1, 1, 1);
  bar.position.z = 1;
  expect(hit()).toBeUndefined();
  bar.position.z = 0;
  expect(hit()).toBe(bar);
  const holder = scene.add(new Object3D());
  holder.add(bar);
  holder.position.x = 10;
  expect(hit()).toBeUndefined();
  holder.position.x = 0;
  expect(hit()).toBe(bar);
  scene.destroy();
});
