import { expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  BallSocketJoint3D,
  BoxCollider3D,
  DistanceJoint3D,
  HingeJoint3D,
  RigidBody3D,
  SphereCollider3D,
} from '../packages/core/src/physics3d/index.js';

function dynamic(scene: Scene, position: Vector3, box = false): Object3D {
  const object = new Object3D();
  object.position.copy(position);
  object.collider = box
    ? new BoxCollider3D(new Vector3(0.1, 0.5, 0.1))
    : new SphereCollider3D(0.1);
  object.body = new RigidBody3D({ allowSleep: false });
  return scene.add(object);
}
function tick(scene: Scene, count: number): void {
  for (let i = 0; i < count; i++)
    scene.physics3D.update(scene.physics3D.fixedDelta);
}

it('settles a damped suspension at the gravity/spring equilibrium instead of imposing its rest pose', () => {
  const scene = new Scene(),
    object = dynamic(scene, new Vector3(0, -1, 0));
  const spring = scene.physics3D.addJoint(
    new DistanceJoint3D({
      bodyA: object,
      anchor: object.position,
      anchorB: new Vector3(),
      length: 1,
      frequencyHz: 2,
      dampingRatio: 1,
    }),
  );
  tick(scene, 960);
  expect(object.position.y).toBeCloseTo(-1 - 9.81 / (2 * Math.PI * 2) ** 2, 3);
  expect(Math.abs(object.body!.velocity.y)).toBeLessThan(0.005);
  expect(spring.reactionForce).toBeCloseTo(9.81, 2);
  scene.destroy();
  expect(spring.attached).toBe(false);
});

it('drives an offset gate with angular inertia and holds its pivot and motor stop', () => {
  const scene = new Scene(),
    gate = dynamic(scene, new Vector3(0.5, 0, 0));
  scene.physics3D.gravity.set(0, 0, 0);
  gate.collider = new BoxCollider3D(new Vector3(0.5, 0.05, 0.05));
  const hinge = scene.physics3D.addJoint(
    new HingeJoint3D({
      bodyA: gate,
      anchor: new Vector3(),
      axis: new Vector3(0, 0, 1),
      lowerAngle: -0.2,
      upperAngle: 0.4,
      enableMotor: true,
      motorSpeed: 2,
      maxMotorTorque: 40,
    }),
  );
  tick(scene, 240);
  const [a, b] = hinge.anchors();
  expect(hinge.angle).toBeCloseTo(0.4, 2);
  expect(a.subtract(b).length()).toBeLessThan(0.02);
  expect(gate.position.y).toBeGreaterThan(0.15);
  expect(Math.abs(gate.body!.angularVelocity.z)).toBeLessThan(0.03);
  scene.destroy();
});

it('transmits a limb impulse through an articulated chain while enforcing swing/twist limits', () => {
  const scene = new Scene();
  const bodies = Array.from({ length: 4 }, (_, i) =>
    dynamic(scene, new Vector3(0, -i - 0.5, 0), true),
  );
  const joints = bodies.map((body, i) =>
    scene.physics3D.addJoint(
      new BallSocketJoint3D({
        bodyA: i === 0 ? body : bodies[i - 1],
        bodyB: i === 0 ? undefined : body,
        anchor: new Vector3(0, -i, 0),
        axis: new Vector3(0, 1, 0),
        swingLimit: 0.65,
        lowerTwist: -0.3,
        upperTwist: 0.3,
      }),
    ),
  );
  bodies[3].body!.applyImpulse(new Vector3(2, 0, 0.5));
  tick(scene, 180);
  expect(Math.abs(bodies[0].position.x)).toBeGreaterThan(0.01);
  for (const joint of joints) {
    const [a, b] = joint.anchors();
    expect(a.subtract(b).length()).toBeLessThan(0.12);
    expect(joint.swingAngle).toBeLessThan(0.73);
    expect(Math.abs(joint.twistAngle)).toBeLessThan(0.38);
  }
  scene.destroy();
  expect(joints.every((joint) => !joint.attached)).toBe(true);
});

it('rejects cross-world ownership, removes joints on attachment replacement and breaks exactly once', () => {
  const scene = new Scene(),
    other = new Scene();
  const a = dynamic(scene, new Vector3(0, -1, 0)),
    b = dynamic(other, new Vector3());
  expect(() =>
    scene.physics3D.addJoint(
      new DistanceJoint3D({ bodyA: a, bodyB: b, anchor: a.position }),
    ),
  ).toThrow();
  const old = scene.physics3D.addJoint(
    new HingeJoint3D({ bodyA: a, anchor: new Vector3() }),
  );
  a.body = new RigidBody3D({ gravityScale: 0, allowSleep: false });
  expect(old.attached).toBe(false);
  const fragile = scene.physics3D.addJoint(
    new DistanceJoint3D({
      bodyA: a,
      anchor: a.position,
      anchorB: new Vector3(),
      length: 1,
      breakForce: 1,
    }),
  );
  let breaks = 0;
  fragile.onBreak = () => breaks++;
  a.body.applyImpulse(new Vector3(0, -10, 0));
  tick(scene, 2);
  expect(breaks).toBe(1);
  expect(fragile.attached).toBe(false);
  expect(scene.physics3D.joints).toEqual([]);
  scene.destroy();
  other.destroy();
});
