import { expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  TriangleMeshCollider3D,
  SphereCollider3D,
  BoxCollider3D,
  CapsuleCollider3D,
  RigidBody3D,
  CharacterController3D,
} from '../packages/core/src/physics3d/index.js';
const positions = [-5, 0, -5, 0, 0, 5, 5, 0, -5];
function floor(
  scene: Scene,
  sidedness: 'front' | 'double' = 'double',
): Object3D {
  const o = new Object3D();
  o.collider = new TriangleMeshCollider3D(positions, [0, 1, 2], { sidedness });
  return scene.add(o);
}
it('solves actual sphere, box and capsule contacts against triangle interiors', () => {
  const scene = new Scene();
  floor(scene);
  const bodies = [
    new SphereCollider3D(0.25),
    new BoxCollider3D(new Vector3(0.25, 0.25, 0.25)),
    new CapsuleCollider3D(0.25, 0.5),
  ].map((c, i) => {
    const o = new Object3D();
    o.collider = c;
    o.position.set(i - 1, 2, 0);
    o.body = new RigidBody3D({ lockRotation: true });
    return scene.add(o);
  });
  for (let i = 0; i < 480; i++)
    scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(bodies[0].position.y).toBeCloseTo(0.25, 2);
  expect(bodies[1].position.y).toBeCloseTo(0.25, 2);
  expect(bodies[2].position.y).toBeCloseTo(0.5, 2);
  scene.destroy();
});
it('queries triangle edges, grazing and front sidedness without bounding-box false hits', () => {
  const scene = new Scene();
  const f = floor(scene, 'front');
  expect(
    scene.physics3D.raycast(new Vector3(0, 2, 0), new Vector3(0, -1, 0), 4)
      ?.distance,
  ).toBeCloseTo(2, 3);
  expect(
    scene.physics3D.raycast(new Vector3(0, -2, 0), new Vector3(0, 1, 0), 4),
  ).toBeUndefined();
  expect(
    scene.physics3D.raycast(new Vector3(4, 2, 4), new Vector3(0, -1, 0), 4),
  ).toBeUndefined();
  expect(
    scene.physics3D.sweepSphere(
      new Vector3(0, 1, 5.2),
      0.3,
      new Vector3(0, -2, 0),
    )?.object,
  ).toBe(f);
  expect(
    scene.physics3D.sweepSphere(
      new Vector3(0, 0.3, 0),
      0.3,
      new Vector3(1, 0, 0),
    ),
  ).toBeUndefined();
  f.position.y = 3;
  expect(
    scene.physics3D.raycast(new Vector3(0, 5, 0), new Vector3(0, -1, 0), 4)
      ?.distance,
  ).toBeCloseTo(2, 3);
  scene.destroy();
});
it('owns baked coordinates and rejects invalid replacement without losing the previous attachment', () => {
  const scene = new Scene();
  const input = positions.slice(),
    o = new Object3D();
  o.collider = new TriangleMeshCollider3D(input, [0, 1, 2]);
  scene.add(o);
  input.fill(100);
  expect(
    scene.physics3D.raycast(new Vector3(0, 2, 0), new Vector3(0, -1, 0), 4)
      ?.object,
  ).toBe(o);
  expect(
    () => new TriangleMeshCollider3D([0, 0, 0, 1, 0, 0, 2, 0, 0], [0, 1, 2]),
  ).toThrow();
  o.body = new RigidBody3D({ type: 'static' });
  expect(() => {
    o.body = new RigidBody3D();
  }).toThrow();
  expect(o.body?.type).toBe('static');
  scene.destroy();
});
it('grounds the existing capsule controller on triangle geometry', () => {
  const scene = new Scene();
  floor(scene);
  const o = new Object3D();
  o.collider = new CapsuleCollider3D(0.25, 0.5);
  o.position.y = 2;
  scene.add(o);
  const controller = new CharacterController3D(o, scene.physics3D, {
    stepHeight: 0,
  });
  const result = controller.move(new Vector3(0, -3, 0));
  expect(result.grounded).toBe(true);
  expect(o.position.y).toBeCloseTo(0.503, 2);
  controller.destroy();
  scene.destroy();
});
it('recovers an interior capsule using triangle-face penetration rather than edge distance', () => {
  const scene = new Scene();
  floor(scene);
  const o = new Object3D();
  o.collider = new CapsuleCollider3D(0.25, 1);
  scene.add(o);
  const controller = new CharacterController3D(o, scene.physics3D, {
    stepHeight: 0,
    maxRecoveryDistance: 2,
    groundSnap: 0,
  });
  controller.move(new Vector3());
  expect(o.position.y).toBeGreaterThanOrEqual(0.75);
  expect(o.position.y).toBeLessThan(0.76);
  controller.destroy();
  scene.destroy();
});
