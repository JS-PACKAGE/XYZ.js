import { expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3, Quaternion } from '../packages/math/src/index.js';
import {
  CompoundCollider3D,
  SphereCollider3D,
  BoxCollider3D,
  CapsuleCollider3D,
  RigidBody3D,
  CharacterController3D,
} from '../packages/core/src/physics3d/index.js';
it('preserves compound gaps for ray, sphere sweep and actual capsule movement', () => {
  const scene = new Scene(),
    o = new Object3D();
  o.collider = new CompoundCollider3D(
    [-1, 1].map((x) => ({
      collider: new BoxCollider3D(new Vector3(0.25, 2, 0.25)),
      position: new Vector3(x, 0, 0),
    })),
  );
  scene.add(o);
  expect(
    scene.physics3D.raycast(new Vector3(0, 0, -3), new Vector3(0, 0, 1), 6),
  ).toBeUndefined();
  expect(
    scene.physics3D.sweepSphere(
      new Vector3(0, 0, -3),
      0.25,
      new Vector3(0, 0, 6),
    ),
  ).toBeUndefined();
  expect(
    scene.physics3D.raycast(new Vector3(1, 0, -3), new Vector3(0, 0, 1), 6)
      ?.distance,
  ).toBeCloseTo(2.75, 3);
  const actor = new Object3D();
  actor.collider = new CapsuleCollider3D(0.25, 0.5);
  actor.position.z = -3;
  scene.add(actor);
  const controller = new CharacterController3D(actor, scene.physics3D, {
    stepHeight: 0,
    groundSnap: 0,
  });
  controller.move(new Vector3(0, 0, 6));
  expect(actor.position.z).toBeCloseTo(3, 3);
  controller.destroy();
  scene.destroy();
});
it('combines volume-weighted intrinsic and parallel-axis inertia at the declared COM', () => {
  const scene = new Scene(),
    o = new Object3D();
  o.collider = new CompoundCollider3D(
    [-1, 1].map((x) => ({
      collider: new SphereCollider3D(0.25),
      position: new Vector3(x, 0, 0),
    })),
  );
  o.body = new RigidBody3D({ mass: 2, gravityScale: 0 });
  scene.add(o);
  o.body.applyImpulse(new Vector3(1, 0, 0), new Vector3(0, 1, 0));
  expect(o.body.velocity.x).toBeCloseTo(0.5, 8);
  expect(o.body.angularVelocity.z).toBeCloseTo(-1 / 2.05, 6);
  expect(() => {
    o.collider = new CompoundCollider3D([
      { collider: new SphereCollider3D(0.25), position: new Vector3(1, 0, 0) },
    ]);
  }).toThrow();
  expect((o.collider as CompoundCollider3D).children.length).toBe(2);
  scene.destroy();
});
it('snapshots explicit child rotation and rejects nonpositive child scales', () => {
  const q = new Quaternion(0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8));
  const c = new CompoundCollider3D([
    { collider: new BoxCollider3D(new Vector3(2, 0.1, 0.1)), rotation: q },
  ]);
  q.set(0, 0, 0, 1);
  const scene = new Scene(),
    o = new Object3D();
  o.collider = c;
  scene.add(o);
  expect(
    scene.physics3D.raycast(new Vector3(1, 1, -2), new Vector3(0, 0, 1), 4)
      ?.object,
  ).toBe(o);
  expect(
    scene.physics3D.raycast(new Vector3(1, -1, -2), new Vector3(0, 0, 1), 4),
  ).toBeUndefined();
  expect(
    () =>
      new CompoundCollider3D([
        { collider: new SphereCollider3D(1), scale: new Vector3(-1, -1, 1) },
      ]),
  ).toThrow();
  scene.destroy();
});
