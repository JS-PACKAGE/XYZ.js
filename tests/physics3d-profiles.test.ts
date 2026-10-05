import { expect, it } from 'vitest';
import { Vector3 } from '../packages/math/src/index.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { PhysicsWorld3D } from '../packages/core/src/physics3d/world.js';
import { RigidBody3D } from '../packages/core/src/physics3d/body.js';
import { HingeJoint3D } from '../packages/core/src/physics3d/joints.js';
import {
  BoxCollider3D,
  PlaneCollider3D,
  SphereCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { Vehicle3D } from '../packages/core/src/physics3d/vehicle.js';
import { Ragdoll3D } from '../packages/core/src/physics3d/ragdoll.js';
import { SoftBody3D } from '../packages/core/src/physics3d/softbody.js';
import { PhysicsDebugDraw3D } from '../packages/core/src/physics3d/debug.js';
import { TextureMaterial, Mesh } from '../packages/core/src/mesh.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Texture } from '../packages/assets/src/index.js';
function floor(world: PhysicsWorld3D): Object3D {
  const floor = new Object3D();
  floor.collider = new PlaneCollider3D();
  world.register(floor);
  return floor;
}
function body(world: PhysicsWorld3D, y: number): Object3D {
  const object = new Object3D();
  object.position.y = y;
  object.collider = new SphereCollider3D(0.1);
  object.body = new RigidBody3D({ allowSleep: false });
  world.register(object);
  return object;
}
it('supports suspension weight, accelerates through grounded tires, and brakes instead of teleporting the chassis', () => {
  const world = new PhysicsWorld3D();
  floor(world);
  const chassis = body(world, 0.8);
  chassis.collider = new BoxCollider3D(new Vector3(0.6, 0.1, 1));
  world.register(chassis);
  chassis.body!.mass = 400;
  const vehicle = new Vehicle3D(world, {
    chassis,
    driveForce: 1600,
    brakeForce: 4000,
    wheels: [-1, 1].flatMap((x) =>
      [-1, 1].map((z) => ({
        position: new Vector3(x * 0.5, 0, z * 0.8),
        radius: 0.2,
        restLength: 0.6,
        spring: 20000,
        damping: 2500,
        drive: true,
        steer: z > 0,
      })),
    ),
  });
  for (let i = 0; i < 240; i++) {
    vehicle.update(world.fixedDelta);
    world.update(world.fixedDelta);
  }
  expect(vehicle.wheels.every((w) => w.grounded && w.suspensionForce > 0)).toBe(
    true,
  );
  expect(chassis.position.y).toBeGreaterThan(0.65);
  expect(chassis.position.y).toBeLessThan(0.8);
  vehicle.setControls(1);
  for (let i = 0; i < 120; i++) {
    vehicle.update(world.fixedDelta);
    world.update(world.fixedDelta);
  }
  const speed = chassis.body!.velocity.z;
  expect(speed).toBeGreaterThan(1);
  vehicle.setControls(0, 1);
  for (let i = 0; i < 120; i++) {
    vehicle.update(world.fixedDelta);
    world.update(world.fixedDelta);
  }
  expect(Math.abs(chassis.body!.velocity.z)).toBeLessThan(speed * 0.3);
  vehicle.setControls(1, 0, 0.3);
  for (let i = 0; i < 120; i++) {
    vehicle.update(world.fixedDelta);
    world.update(world.fixedDelta);
  }
  expect(Math.abs(chassis.body!.angularVelocity.y)).toBeGreaterThan(0.01);
  vehicle.destroy();
  expect(world.has(chassis)).toBe(true);
  world.destroy();
});
it('uses existing limited joints, blends bone poses and removes only owned registrations', () => {
  const world = new PhysicsWorld3D();
  floor(world);
  const a = body(world, 2),
    b = new Object3D();
  b.position.y = 1;
  b.collider = new SphereCollider3D(0.1);
  b.body = new RigidBody3D({ allowSleep: false });
  const boneA = new Object3D(),
    boneB = new Object3D();
  boneA.position.y = 2;
  boneB.position.y = 1;
  const ragdoll = new Ragdoll3D(world, {
    mappings: [
      { id: 'a', bone: boneA, body: a },
      { id: 'b', bone: boneB, body: b },
    ],
    joints: [
      {
        type: 'hinge',
        a: 'a',
        b: 'b',
        anchor: new Vector3(0, 1.5, 0),
        axis: new Vector3(0, 0, 1),
        lowerAngle: -0.25,
        upperAngle: 0.25,
      },
    ],
  });
  b.body!.applyImpulse(new Vector3(0.2, 0, 0));
  for (let i = 0; i < 120; i++) world.update(world.fixedDelta);
  expect(a.position.y).toBeLessThan(2);
  ragdoll.blend(0);
  expect(boneA.position.y).toBe(2);
  ragdoll.blend(0.5);
  expect(boneA.position.y).toBeCloseTo((a.position.y + 2) / 2, 4);
  ragdoll.blend(1);
  expect(boneA.position.y).toBeCloseTo(a.position.y, 4);
  const [p, q] = ragdoll.joints[0]!.anchors();
  expect(p.subtract(q).length()).toBeLessThan(0.1);
  expect(Math.abs((ragdoll.joints[0] as HingeJoint3D).angle)).toBeLessThan(0.3);
  ragdoll.destroy();
  expect(world.has(a)).toBe(true);
  expect(world.has(b)).toBe(false);
  expect(world.joints.length).toBe(0);
  world.destroy();
});
it('sags under gravity, keeps pins, collides with world surfaces, and versions mesh deformation', () => {
  const world = new PhysicsWorld3D();
  floor(world);
  const texture = Object.create(Texture.prototype) as Texture;
  const mesh = new Mesh({
    material: new TextureMaterial({ texture }),
    geometry: new Geometry({
      positions: [-0.5, 1, 0, 0, 1, 0, 0.5, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 0.5, 0, 1, 0],
      indices: [0, 1, 2],
    }),
  });
  const soft = new SoftBody3D(world, {
    particles: [
      { position: new Vector3(-0.5, 1, 0), pinned: true },
      { position: new Vector3(0, 1, 0) },
      { position: new Vector3(0.5, 1, 0), pinned: true },
    ],
    springs: [
      { a: 0, b: 1 },
      { a: 1, b: 2 },
    ],
    mesh,
    vertexParticles: [0, 1, 2],
  });
  for (let i = 0; i < 240; i++) soft.update(1 / 120);
  expect(soft.particles[0]!.position.y).toBe(1);
  expect(soft.particles[1]!.position.y).toBeLessThan(0.95);
  expect(mesh.geometry.version).toBeGreaterThan(0);
  soft.unpin(0);
  soft.unpin(2);
  for (let i = 0; i < 480; i++) soft.update(1 / 120);
  for (const p of soft.particles) {
    expect(p.position.y).toBeGreaterThanOrEqual(0.024);
    expect(p.position.y).toBeLessThan(0.04);
    expect(p.velocity.length()).toBeLessThan(0.1);
  }
  soft.pin(1, new Vector3(0, 2, 0));
  soft.update(1 / 120);
  expect(soft.particles[1]!.position.y).toBe(2);
  soft.destroy();
  world.destroy();
});
it('snapshots live shapes immutably and draws actual native line triangle geometry', () => {
  const world = new PhysicsWorld3D({ gravity: new Vector3() }),
    object = body(world, 1);
  object.collider = new BoxCollider3D(new Vector3(1, 2, 3));
  world.register(object);
  const snapshot = world.debugSnapshot();
  expect(snapshot.segments.length).toBe(12);
  expect(Object.isFrozen(snapshot.segments[0]!.from)).toBe(true);
  const texture = Object.create(Texture.prototype) as Texture;
  const debug = new PhysicsDebugDraw3D(world, {
    colliderMaterial: new TextureMaterial({ texture }),
  });
  debug.refresh(snapshot);
  expect(debug.children.size).toBe(12);
  const line = [...debug.children][0] as Mesh;
  expect(line.geometry.indices.length).toBe(6);
  const previous = snapshot.segments[0]!.from[0];
  object.position.x += 5;
  debug.refresh();
  expect(world.debugSnapshot().segments[0]!.from[0]).toBeCloseTo(previous + 5);
  expect(snapshot.segments[0]!.from[0]).toBe(previous);
  debug.destroy();
  expect(world.has(object)).toBe(true);
  world.destroy();
});
