import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/texture.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Object3D } from '../packages/core/src/object3d.js';
import {
  Colliders,
  RigidBody2D,
} from '../packages/core/src/physics2d/index.js';
import { SphereCollider3D } from '../packages/core/src/physics3d/collider.js';
import { Vector3 } from '../packages/math/src/index.js';

const continueFrame = () => true;

describe('scene lazy service lifetime', () => {
  it('keeps a passive sprite frame and teardown free of unused services', () => {
    const scene = new Scene();
    const texture = new Texture({ kind: 'native', width: 8, height: 8 });
    const sprite = scene.add(new Sprite({ texture }));
    const duration = scene.fixedDelta * 3;
    scene.beginObjectFrame();
    scene.advanceTimers(duration);
    scene.advanceTweens(duration);
    scene.advanceAnimations(duration);
    scene.advanceFrameAnimations(duration, continueFrame);
    scene.advanceActions(duration, continueFrame);
    scene.advanceAfterUpdate(duration, continueFrame);
    expect(scene.fixedFrame).toBe(3);
    expect(scene.initializedPhysics).toBeUndefined();
    expect(scene.initializedPhysics3D).toBeUndefined();
    scene.destroy();
    expect(sprite.destroyed).toBe(true);
    expect(texture.destroyed).toBe(false);
    for (const name of [
      'camera3D',
      'timers',
      'tweens',
      'animations',
      'physics',
      'physics3D',
      'shadows',
      'postProcessing',
      'fog',
      'directionalLight',
      'pointLights',
      'spotLights',
      'reflectionProbes',
      'pointerEvents',
    ] as const)
      expect(() => scene[name]).toThrow('destroyed Scene');
    texture.destroy();
  });

  it('activates only 2D physics for a late attachment and unregisters on removal', () => {
    const scene = new Scene();
    const object = scene.add(new GameObject());
    expect(scene.initializedPhysics).toBeUndefined();
    object.collider = Colliders.circle(1);
    object.body = new RigidBody2D();
    const physics = scene.physics;
    physics.gravity.set(0, 0);
    object.body.velocity.x = 12;
    scene.advanceAfterUpdate(scene.fixedDelta, continueFrame);
    expect(object.position.x).toBeCloseTo(12 * scene.fixedDelta);
    expect(physics.colliderCount).toBe(1);
    expect(scene.initializedPhysics3D).toBeUndefined();
    scene.remove(object);
    expect(physics.colliderCount).toBe(0);
    scene.add(object);
    expect(scene.physics).toBe(physics);
    expect(physics.colliderCount).toBe(1);
    scene.destroy();
    expect(scene.physics).toBe(physics);
    expect(physics.destroyed).toBe(true);
    expect(() => scene.physics3D).toThrow('destroyed Scene');
  });

  it('preserves transformed 3D collider queries through attachment and reparenting', () => {
    const scene = new Scene();
    const left = scene.add(new Object3D());
    const right = scene.add(new Object3D());
    left.position.x = 5;
    right.position.x = 10;
    const collider = left.add(new Object3D());
    expect(scene.initializedPhysics3D).toBeUndefined();
    collider.collider = new SphereCollider3D(1);
    const physics = scene.physics3D;
    expect(
      physics.raycast(new Vector3(), new Vector3(1, 0, 0), 20)?.distance,
    ).toBeCloseTo(4);
    right.add(collider);
    expect(collider.parent).toBe(right);
    expect(
      physics.raycast(new Vector3(), new Vector3(1, 0, 0), 20)?.distance,
    ).toBeCloseTo(9);
    scene.remove(right);
    expect(physics.has(collider)).toBe(false);
    expect(scene.initializedPhysics).toBeUndefined();
    scene.destroy();
    right.destroy();
    expect(() => scene.camera3D).toThrow('destroyed Scene');
  });

  it('retains acquired service identity without permitting work after teardown', () => {
    const scene = new Scene();
    const timers = scene.timers;
    let calls = 0;
    timers.after(0.01, () => calls++);
    scene.advanceTimers(0.01);
    expect(calls).toBe(1);
    timers.after(0.01, () => calls++);
    scene.destroy();
    expect(scene.timers).toBe(timers);
    scene.advanceTimers(0.1);
    expect(calls).toBe(1);
    expect(() => timers.after(0, () => calls++)).toThrow();
    expect(() => scene.animations).toThrow('destroyed Scene');
  });
});
