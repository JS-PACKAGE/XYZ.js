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
