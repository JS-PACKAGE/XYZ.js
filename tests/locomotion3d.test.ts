import { describe, expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Group } from '../packages/core/src/group.js';
import {
  AnimationClip,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import {
  CharacterLocomotion3D,
  type CharacterLocomotionOptions3D,
} from '../packages/core/src/locomotion3d.js';
import { CharacterController3D } from '../packages/core/src/physics3d/character.js';
import {
  BoxCollider3D,
  CapsuleCollider3D,
  PlaneCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { RigidBody3D } from '../packages/core/src/physics3d/body.js';
import { Vector3 } from '../packages/math/src/index.js';

function fixture(
  movement: 'velocity' | 'root-motion' = 'root-motion',
  platform = false,
) {
  const scene = new Scene();
  const floor = new Group();
  floor.collider = platform
    ? new BoxCollider3D(new Vector3(4, 0.25, 4))
    : new PlaneCollider3D();
  if (platform) floor.body = new RigidBody3D({ type: 'kinematic' });
  scene.add(floor);
  const body = new Group();
  body.position.y = platform ? 1.003 : 0.753;
  body.collider = new CapsuleCollider3D(0.25, 1);
  scene.add(body);
  const root = body.add(new Group());
  const controller = new CharacterController3D(body, scene.physics3D, {
    stepHeight: 0,
  });
  controller.move(new Vector3(0, -0.01, 0));
  const animations: CharacterLocomotionOptions3D['animations'] =
    Object.fromEntries(
      [
        ['idle', 0],
        ['walk', 2],
        ['run', 5],
        ['jump', 0],
        ['fall', 0],
      ].map(([name, speed]) => [
        name,
        {
          clip: new AnimationClip(String(name), [
            new KeyframeTrack(
              root,
              'translation',
              [0, 1],
              [0, 0, 0, 0, 0, Number(speed)],
            ),
          ]),
          ...(Number(speed) > 0 ? { motionSpeed: Number(speed) } : {}),
        },
      ]),
    );
  const driver = new CharacterLocomotion3D(controller, {
    root,
    animations,
    states: {
      idle: 'idle',
      walk: 'walk',
      run: 'run',
      jump: 'jump',
      fall: 'fall',
    },
    movement,
    acceleration: 10000,
    deceleration: 10000,
    turnSpeed: 10000,
    fadeDuration: 0,
  });
  return { scene, floor, body, root, controller, driver };
}
function dispose(f: {
  driver: CharacterLocomotion3D;
  controller: CharacterController3D;
  scene: Scene;
}): void {
  f.driver.destroy();
  f.controller.destroy();
  f.scene.destroy();
}

describe('fixed character locomotion', () => {
  it('supports in-place limb clips without an authored root track in velocity mode', () => {
    const f = fixture('velocity');
    f.driver.destroy();
    const limb = f.root.add(new Group());
    const clip = new AnimationClip('limb', [
      new KeyframeTrack(limb, 'translation', [0, 1], [0, 0, 0, 0, 1, 0]),
    ]);
    const driver = new CharacterLocomotion3D(f.controller, {
      root: f.root,
      animations: { limb: { clip } },
      states: {
        idle: 'limb',
        walk: 'limb',
        run: 'limb',
        jump: 'limb',
        fall: 'limb',
      },
      movement: 'velocity',
      acceleration: 10000,
    });
    driver.setInput({ x: 0, z: 1 });
    for (let i = 0; i < 30; i++) driver.fixedUpdate(1 / 60, i);
    expect(f.body.position.z).toBeCloseTo(1, 5);
    expect(limb.position.y).toBeCloseTo(0.5, 5);
    expect(f.root.position.length()).toBe(0);
    driver.destroy();
    dispose(f);
  });
  it('rotates body-local strides, runs/stops, and sweeps a wall without writing root pose', () => {
    const f = fixture();
    f.driver.setInput({ x: 1, z: 0 });
    for (let i = 0; i < 30; i++) f.driver.fixedUpdate(1 / 60, i);
    expect(f.body.position.x).toBeCloseTo(1, 5);
    expect(f.body.position.z).toBeCloseTo(0, 5);
    const wall = new Group();
    wall.collider = new BoxCollider3D(new Vector3(0.1, 2, 4));
    wall.position.set(2, 2, 0);
    f.scene.add(wall);
    f.driver.setInput({ x: 1, z: 0, run: true });
    for (let i = 30; i < 90; i++) f.driver.fixedUpdate(1 / 60, i);
    expect(f.driver.phase).toBe('run');
    expect(f.body.position.x).toBeLessThan(1.651);
    expect(f.body.position.x).toBeGreaterThan(1.64);
    expect(f.driver.result!.blocked).toBe(true);
    expect(f.driver.velocity.x).toBeCloseTo(0, 4);
    expect(f.root.position.length()).toBe(0);
    f.driver.setInput({ x: 0, z: 0 });
    const stopped = f.body.position.x;
    for (let i = 90; i < 150; i++) f.driver.fixedUpdate(1 / 60, i);
    expect(f.driver.phase).toBe('idle');
    expect(f.body.position.x).toBeCloseTo(stopped, 6);
    dispose(f);
  });
  it('keeps velocity-driven air control when authored jump root tracks contain no stride', () => {
    const f = fixture();
    f.driver.setInput({ x: 0, z: 1, jump: true });
    for (let i = 0; i < 15; i++) f.driver.fixedUpdate(1 / 60, i);
    expect(f.driver.phase).toBe('jump');
    expect(f.body.position.z).toBeCloseTo(0.5, 5);
    expect(f.body.position.y).toBeGreaterThan(1.6);
    expect(f.root.position.length()).toBe(0);
    dispose(f);
  });
  it('buffers one jump across frame input, detaches support, then lands without held-key repeats', () => {
    const f = fixture('velocity', true);
    expect(f.controller.support).toBe(f.floor);
    f.driver.setInput({ x: 0, z: 0, jump: true });
    f.driver.setInput({ x: 0, z: 0, jump: true });
    f.driver.fixedUpdate(1 / 60, 0);
    expect(f.driver.phase).toBe('jump');
    expect(f.driver.result!.support).toBeUndefined();
    expect(f.driver.result!.supportDetached).toBe('jump');
    let peak = f.body.position.y;
    for (let i = 1; i < 120; i++) {
      f.driver.setInput({ x: 0, z: 0, jump: true });
      f.driver.fixedUpdate(1 / 60, i);
      peak = Math.max(peak, f.body.position.y);
    }
    expect(peak).toBeGreaterThan(1.8);
    expect(f.controller.grounded).toBe(true);
    expect(f.driver.phase).toBe('idle');
    expect(f.body.position.y).toBeCloseTo(1.0025, 3);
    dispose(f);
  });
  it('consumes moving support translation/yaw once per epoch and excludes carry from velocity', () => {
    const f = fixture('root-motion', true);
    f.body.position.x = 1;
    f.controller.move(new Vector3(0, -0.01, 0));
    f.floor.position.x = 0.5;
    f.floor.rotation.setFromEuler(0, Math.PI / 2, 0);
    f.driver.fixedUpdate(1 / 60, 1);
    expect(f.body.position.x).toBeCloseTo(0.5, 5);
    expect(f.body.position.z).toBeCloseTo(-1, 5);
    expect(f.driver.result!.supportYawDelta).toBeCloseTo(Math.PI / 2);
    expect(f.driver.velocity.x).toBeCloseTo(0, 5);
    const x = f.body.position.x,
      z = f.body.position.z;
    f.driver.fixedUpdate(1 / 60, 1);
    expect(f.body.position.x).toBe(x);
    expect(f.body.position.z).toBe(z);
    dispose(f);
  });
  it('runs identical fixed ticks at 30/60/120/144 Hz presentation without double mixer advance', () => {
    const positions: number[] = [];
    for (const hz of [30, 60, 120, 144]) {
      const f = fixture();
      f.driver.setInput({ x: 0, z: 1 });
      let accumulator = 0,
        epoch = 0;
      for (let frame = 0; frame < hz * 2; frame++) {
        accumulator += 1 / hz;
        while (accumulator + 1e-10 >= 1 / 60) {
          f.driver.fixedUpdate(1 / 60, epoch++);
          accumulator -= 1 / 60;
        }
        f.scene.animations.update(1 / hz);
      }
      expect(epoch).toBe(120);
      positions.push(f.body.position.z);
      dispose(f);
    }
    for (const position of positions) expect(position).toBeCloseTo(4, 5);
  });
  it('cancels callback-time seek, pause and stop before their pending stride reaches physics', () => {
    for (const cancel of ['seek', 'pause', 'stop', 'destroy'] as const) {
      const f = fixture();
      f.driver.requestAnimation('walk');
      f.driver.animation.action.time = 0.99;
      f.driver.animation.action.on('loop', () => {
        if (cancel === 'seek') f.driver.seek(0.5);
        if (cancel === 'pause') f.driver.paused = true;
        if (cancel === 'stop') f.driver.stop();
        if (cancel === 'destroy') f.driver.destroy();
      });
      f.driver.fixedUpdate(1 / 60, 0);
      expect(f.body.position.z).toBe(0);
      expect(f.root.position.z).toBe(0);
      expect(f.controller.destroyed).toBe(false);
      expect(f.body.destroyed).toBe(false);
      if (cancel === 'pause' || cancel === 'stop') {
        f.driver.fixedUpdate(1 / 60, 1);
        expect(f.body.position.z).toBe(0);
      }
      dispose(f);
    }
  });
  it('does not turn a seek into body teleport, preserves paused pose, and restarts cleanly', () => {
    const f = fixture();
    f.driver.setInput({ x: 0, z: 1 });
    f.driver.fixedUpdate(1 / 60, 0);
    const before = f.body.position.z;
    f.driver.seek(0.8);
    expect(f.body.position.z).toBe(before);
    f.driver.paused = true;
    for (let i = 1; i < 30; i++) f.driver.fixedUpdate(1 / 60, i);
    expect(f.body.position.z).toBe(before);
    expect(f.driver.animation.action.time).toBeCloseTo(0.8);
    f.driver.paused = false;
    f.driver.fixedUpdate(1 / 60, 30);
    expect(f.body.position.z - before).toBeCloseTo(2 / 60, 5);
    f.driver.stop();
    f.driver.setInput({ x: 0, z: 0 });
    f.driver.start();
    f.driver.fixedUpdate(1 / 60, 31);
    expect(f.body.position.z - before).toBeCloseTo(2 / 60, 5);
    dispose(f);
  });
});
