import { describe, expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { RigidBody3D } from '../packages/core/src/physics3d/body.js';
import { SphereCollider3D } from '../packages/core/src/physics3d/collider.js';
import { RigidBody2D } from '../packages/core/src/physics2d/body.js';
import { Colliders } from '../packages/core/src/physics2d/index.js';
import { Vector2, Vector3 } from '../packages/math/src/index.js';

const rates = [30, 60, 120, 144, 240];
function body3(scene: Scene): Object3D {
  const object = new Object3D();
  object.collider = new SphereCollider3D(0.5);
  object.body = new RigidBody3D({ gravityScale: 0, allowSleep: false });
  scene.add(object);
  return object;
}
function body2(scene: Scene): GameObject {
  scene.physics.fixedDelta = 1 / 60;
  const object = new GameObject();
  object.collider = Colliders.circle(0.5);
  object.body = new RigidBody2D({ gravityScale: 0, allowSleep: false });
  scene.add(object);
  return object;
}

describe('frame-force impulse and unified fixed gameplay', () => {
  for (const rate of rates) {
    it(`integrates the same continuous frame force at ${rate} Hz`, () => {
      const scene = new Scene();
      const three = body3(scene),
        two = body2(scene);
      for (let frame = 0; frame < rate; frame++) {
        three.body!.applyForce(new Vector3(120, 0, 0));
        two.body!.applyForce(new Vector2(120, 0));
        scene.advanceAfterUpdate(1 / rate, () => true);
      }
      expect(three.body!.velocity.x).toBeCloseTo(120, 8);
      expect(two.body!.velocity.x).toBeCloseTo(120, 8);
      expect(scene.fixedFrame).toBe(120);
      expect(scene.droppedSimulationTime).toBe(0);
      scene.destroy();
    });
    it(`applies fixed-callback force once per simulation tick at ${rate} Hz`, () => {
      class FixedScene extends Scene {
        object = body3(this);
        object2 = body2(this);
        override fixedUpdate(): void {
          this.object.body!.applyForce(new Vector3(120, 0, 0));
          this.object2.body!.applyForce(new Vector2(120, 0));
        }
      }
      const scene = new FixedScene();
      for (let frame = 0; frame < rate; frame++)
        scene.advanceAfterUpdate(1 / rate, () => true);
      expect(scene.object.body!.velocity.x).toBeCloseTo(120, 8);
      expect(scene.object2.body!.velocity.x).toBeCloseTo(120, 8);
      expect(scene.fixedElapsed).toBeCloseTo(1, 8);
      scene.destroy();
    });
  }
  it('retires sleeping frame time before applying a new awake force', () => {
    const scene = new Scene();
    const three = body3(scene),
      two = body2(scene);
    three.body = new RigidBody3D({ gravityScale: 0, allowSleep: true });
    two.body = new RigidBody2D({ gravityScale: 0, allowSleep: true });
    for (let frame = 0; frame < 120; frame++)
      scene.advanceAfterUpdate(1 / 120, () => true);
    expect(three.body!.isSleeping).toBe(true);
    expect(two.body!.isSleeping).toBe(true);
    three.body!.applyForce(new Vector3(120, 0, 0));
    two.body!.applyForce(new Vector2(120, 0));
    scene.advanceAfterUpdate(1 / 60, () => true);
    expect(three.body!.velocity.x).toBeCloseTo(2, 8);
    expect(two.body!.velocity.x).toBeCloseTo(2, 8);
    scene.destroy();
  });
  it('weights changes of force in sub-tick frames and explicit clearing cancels pending impulse', () => {
    const scene = new Scene();
    const object = body3(scene);
    object.body!.applyForce(new Vector3(120, 0, 0));
    scene.physics3D.update(1 / 240);
    object.body!.applyForce(new Vector3(240, 0, 0));
    scene.physics3D.update(1 / 240);
    expect(object.body!.velocity.x).toBeCloseTo(1.5, 8);
    object.body!.applyForce(new Vector3(120, 0, 0));
    scene.physics3D.update(1 / 240);
    object.body!.clearForces();
    scene.physics3D.update(1 / 240);
    expect(object.body!.velocity.x).toBeCloseTo(1.5, 8);
    scene.destroy();
  });
  it('drops bounded catch-up time without applying its force or replaying interrupted gameplay', () => {
    let live = true;
    class Interrupted extends Scene {
      override fixedUpdate(): void {
        live = false;
      }
    }
    const scene = new Interrupted({ maxFixedSteps: 2 });
    const object = body3(scene);
    object.body!.applyForce(new Vector3(120, 0, 0));
    scene.advanceAfterUpdate(1, () => live);
    expect(scene.droppedSimulationTime).toBeCloseTo(1 - 2 / 120, 8);
    expect(object.body!.velocity.x).toBe(0);
    live = true;
    scene.advanceAfterUpdate(0, () => live);
    expect(object.body!.velocity.x).toBe(0);
    scene.destroy();
  });
  it('interpolates only presentation matrices, preserves exact physics queries and bypasses teleports', () => {
    const scene = new Scene({ interpolatePhysics: true });
    const object = body3(scene);
    object.body!.velocity.x = 120;
    scene.advanceAfterUpdate(1 / 80, () => true);
    expect(object.position.x).toBeCloseTo(1, 8);
    expect(object.updateWorldMatrix().elements[12]).toBeCloseTo(1, 8);
    scene.beginPresentation();
    expect(object.updateWorldMatrix().elements[12]).toBeCloseTo(0.5, 8);
    expect(object.position.x).toBeCloseTo(1, 8);
    scene.endPresentation();
    expect(object.updateWorldMatrix().elements[12]).toBeCloseTo(1, 8);
    object.position.x = 20;
    scene.beginPresentation();
    expect(object.updateWorldMatrix().elements[12]).toBe(20);
    scene.endPresentation();
    scene.destroy();
  });
});
