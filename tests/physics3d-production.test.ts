import { expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  BoxCollider3D,
  CapsuleCollider3D,
  RigidBody3D,
  SphereCollider3D,
  TriangleMeshCollider3D,
} from '../packages/core/src/physics3d/index.js';

it('resolves opposing fast dynamic bodies at relative TOI, including restitution and swept sensors', () => {
  const scene = new Scene(),
    bodies: Object3D[] = [];
  for (const sign of [-1, 1]) {
    const object = new Object3D();
    object.position.x = sign * 3;
    object.collider = new SphereCollider3D(0.25);
    object.body = new RigidBody3D({
      continuous: true,
      lockRotation: true,
      restitution: 1,
      gravityScale: 0,
      allowSleep: false,
    });
    object.body.velocity.x = -sign * 600;
    bodies.push(scene.add(object));
  }
  const sensor = new Object3D();
  sensor.position.x = -2;
  sensor.collider = new BoxCollider3D(new Vector3(0.01, 1, 1), {
    sensor: true,
  });
  scene.add(sensor);
  let impacts = 0,
    triggers = 0;
  bodies[0].addEventListener('collisionstart', (event) => {
    const detail = (event as CustomEvent<{ sensor: boolean }>).detail;
    if (detail.sensor) triggers++;
    else impacts++;
  });
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(bodies[0].body!.velocity.x).toBeCloseTo(-600, 3);
  expect(bodies[1].body!.velocity.x).toBeCloseTo(600, 3);
  expect(bodies[0].position.x).toBeLessThan(bodies[1].position.x);
  expect(impacts).toBe(1);
  expect(triggers).toBe(1);
  scene.destroy();
});

it('finds an angular thin-box impact even when both endpoint poses miss a static mesh', () => {
  const scene = new Scene(),
    obstacle = new Object3D(),
    blade = new Object3D();
  obstacle.collider = new TriangleMeshCollider3D(
    [1, 0.7, -0.3, 1, 1.4, -0.3, 1, 1.4, 0.3, 1, 0.7, 0.3],
    [0, 1, 2, 0, 2, 3],
  );
  scene.add(obstacle);
  blade.collider = new BoxCollider3D(new Vector3(2, 0.02, 0.02));
  blade.body = new RigidBody3D({
    continuous: true,
    gravityScale: 0,
    allowSleep: false,
    friction: 0,
  });
  const initial = Math.PI / (2 * scene.physics3D.fixedDelta);
  blade.body.angularVelocity.z = initial;
  scene.add(blade);
  let starts = 0;
  blade.addEventListener('collisionstart', () => starts++);
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(starts).toBe(1);
  expect(blade.body.angularVelocity.z).toBeLessThan(initial - 1);
  expect(
    2 * Math.atan2(Math.abs(blade.rotation.z), blade.rotation.w),
  ).toBeLessThan(1.5);
  scene.destroy();
});

it('refreshes exact static/ancestor mutations without recomputing unchanged query geometry', () => {
  const scene = new Scene(),
    parent = new Object3D(),
    box = new Object3D();
  box.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
  parent.add(box);
  scene.add(parent);
  const world = scene.physics3D,
    origin = new Vector3(-3, 0, 0),
    direction = new Vector3(1, 0, 0);
  expect(world.raycast(origin, direction, 10)?.distance).toBeCloseTo(2.5);
  const revision = world.geometryRevision,
    refreshed = world.stats.refreshedLeaves,
    refits = world.stats.refits;
  for (let i = 0; i < 20; i++)
    expect(world.raycast(origin, direction, 10)?.object).toBe(box);
  expect(world.stats.refreshedLeaves).toBe(refreshed);
  expect(world.stats.refits).toBe(refits);
  parent.position.x = 2;
  expect(world.raycast(origin, direction, 10)?.distance).toBeCloseTo(4.5);
  expect(world.geometryRevision).toBeGreaterThan(revision);
  box.scale.x = 2;
  expect(world.raycast(origin, direction, 10)?.distance).toBeCloseTo(4);
  scene.destroy();
});

it('keeps placement and padded sweep probes transactional and out of geometry generations', () => {
  const scene = new Scene(),
    capsule = new Object3D(),
    wall = new Object3D();
  capsule.collider = new CapsuleCollider3D(0.2, 1);
  scene.add(capsule);
  wall.position.x = 1;
  wall.collider = new BoxCollider3D(new Vector3(0.1, 2, 2));
  scene.add(wall);
  const world = scene.physics3D,
    revision = world.geometryRevision;
  expect(
    world.canPlaceCapsule(
      capsule,
      new CapsuleCollider3D(0.2, 2),
      new Vector3(0.9, 0, 0),
    ),
  ).toBe(false);
  expect(capsule.position.x).toBe(0);
  expect(
    world.sweepCapsule(capsule, new Vector3(2, 0, 0))?.distance,
  ).toBeCloseTo(0.7, 3);
  expect(
    world.sweepCapsule(capsule, new Vector3(2, 0, 0), {}, undefined, 0.1)
      ?.distance,
  ).toBeCloseTo(0.6, 3);
  expect(world.geometryRevision).toBe(revision);
  scene.destroy();
});
