import { describe, expect, it } from 'vitest';
import {
  AnimationClip,
  AnimationMixer,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import { AnimationRootMotion } from '../packages/core/src/animation-root-motion.js';
import {
  AnimationMask,
  AnimationReferencePose,
} from '../packages/core/src/animation-pose.js';
import { AnimationBlendTree } from '../packages/core/src/animation-blend-tree.js';
import { Group } from '../packages/core/src/group.js';
import { Scene } from '../packages/core/src/scene.js';
import { CharacterController3D } from '../packages/core/src/physics3d/character.js';
import {
  BoxCollider3D,
  CapsuleCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { Vector3 } from '../packages/math/src/index.js';

function walk(root: Group, distance = 2, name = 'walk'): AnimationClip {
  return new AnimationClip(name, [
    new KeyframeTrack(
      root,
      'translation',
      [0, 1],
      [5, 0, 0, 5 + distance, 0, 0],
    ),
  ]);
}
function rig() {
  const root = new Group(),
    target = new Group(),
    mixer = new AnimationMixer();
  root.position.x = 5;
  const binding = new AnimationRootMotion(root, { target });
  const action = mixer.clipAction(walk(root)).setRootMotion(binding).play();
  return { root, target, mixer, binding, action };
}

describe('mixer root motion', () => {
  it('retains exact repeat displacement across multiple crossings without animating the root twice', () => {
    const { root, target, mixer } = rig();
    mixer.update(2.25);
    expect(target.position.x).toBeCloseTo(4.5);
    expect(root.position.x).toBe(5);
    mixer.update(0.75);
    expect(target.position.x).toBeCloseTo(6);
    mixer.destroy();
    expect(root.destroyed).toBe(false);
    expect(target.destroyed).toBe(false);
  });
  it('moves backward through zero and handles seek/reset without teleport displacement', () => {
    const { target, mixer, action } = rig();
    action.timeScale = -1;
    mixer.update(1.25);
    expect(target.position.x).toBeCloseTo(-2.5);
    action.time = 0.8;
    mixer.update(0);
    expect(target.position.x).toBeCloseTo(-2.5);
    mixer.update(0.2);
    expect(target.position.x).toBeCloseTo(-2.9);
    action.stop().play();
    action.timeScale = 1;
    mixer.update(0.1);
    expect(target.position.x).toBeCloseTo(-2.7);
    mixer.destroy();
  });
  it('reverses at ping-pong turnarounds and clamps once motion at both ends', () => {
    const { target, mixer, action } = rig();
    action.loopMode = 'pingpong';
    mixer.update(0.75);
    expect(target.position.x).toBeCloseTo(1.5);
    mixer.update(0.75);
    expect(target.position.x).toBeCloseTo(1);
    mixer.update(4.5);
    expect(target.position.x).toBeCloseTo(0);
    action.stop().play();
    action.loopMode = 'once';
    mixer.update(2);
    expect(target.position.x).toBeCloseTo(2);
    mixer.update(2);
    expect(target.position.x).toBeCloseTo(2);
    action.time = 1;
    action.timeScale = -1;
    action.play();
    mixer.update(2);
    expect(target.position.x).toBeCloseTo(0);
    mixer.destroy();
  });
  it('composes loop turning and translation as rigid transforms, including a rotated consumer', () => {
    const root = new Group(),
      target = new Group(),
      mixer = new AnimationMixer();
    target.rotation.setFromEuler(0, 0, Math.PI / 2);
    const clip = new AnimationClip('turning stride', [
      new KeyframeTrack(root, 'translation', [0, 1], [0, 0, 0, 1, 0, 0]),
      new KeyframeTrack(
        root,
        'rotation',
        [0, 1],
        [0, 0, 0, 1, 0, 0, Math.SQRT1_2, Math.SQRT1_2],
      ),
    ]);
    const action = mixer
      .clipAction(clip)
      .setRootMotion(new AnimationRootMotion(root, { target }))
      .play();
    mixer.update(2);
    expect(target.position.x).toBeCloseTo(-1);
    expect(target.position.y).toBeCloseTo(1);
    expect(Math.abs(target.rotation.z)).toBeCloseTo(Math.SQRT1_2);
    action.timeScale = -1;
    mixer.update(2);
    expect(target.position.x).toBeCloseTo(0);
    expect(target.position.y).toBeCloseTo(0);
    expect(target.rotation.z).toBeCloseTo(Math.SQRT1_2);
    mixer.destroy();
  });
  it('weights rotational deltas with fades and channel masks while leaving skeleton rotation untouched', () => {
    const root = new Group(),
      target = new Group(),
      mixer = new AnimationMixer();
    const action = mixer
      .clipAction(
        new AnimationClip('rotation only', [
          new KeyframeTrack(root, 'rotation', [0, 1], [0, 0, 0, 1, 0, 0, 1, 0]),
        ]),
      )
      .setRootMotion(new AnimationRootMotion(root, { target }));
    action.mask = new AnimationMask([
      { target: root, paths: ['rotation'], weight: 0.5 },
    ]);
    action.fadeIn(1);
    mixer.update(0.5);
    expect(target.rotation.z).toBeCloseTo(Math.sin(Math.PI / 16));
    expect(target.rotation.w).toBeCloseTo(Math.cos(Math.PI / 16));
    expect(root.rotation.z).toBe(0);
    mixer.destroy();
  });
  it('blends masked, faded and additive motion through one shared sink', () => {
    const root = new Group(),
      mixer = new AnimationMixer(),
      received: number[] = [];
    const binding = new AnimationRootMotion(root, {
      sink: (delta) => received.push(delta.translation.x),
    });
    const base = mixer
      .clipAction(walk(root, 2, 'base'))
      .setRootMotion(binding)
      .play();
    const top = mixer.clipAction(walk(root, 6, 'top')).setRootMotion(binding);
    base.crossFadeTo(top, 1);
    mixer.update(0.5);
    expect(received).toEqual([2]);
    top.mask = new AnimationMask([
      { target: root, paths: ['translation'], weight: 0.5 },
    ]);
    mixer.update(0.25);
    expect(received[1]).toBeCloseTo(0.875);
    top.stop();
    base.stop().play();
    const additive = mixer
      .clipAction(walk(root, 4, 'additive'))
      .setRootMotion(binding)
      .setAdditive(
        new AnimationReferencePose([{ target: root, translation: [5, 0, 0] }]),
      )
      .play();
    additive.weight = 0.5;
    mixer.update(0.25);
    expect(received[2]).toBeCloseTo(1);
    expect(root.position).toEqual(new Vector3());
    mixer.destroy();
  });
  it('supports synchronized blend-tree leaves rather than interpreting controller phase alignment as locomotion', () => {
    const root = new Group(),
      target = new Group(),
      mixer = new AnimationMixer();
    const slow = walk(root, 2, 'slow'),
      fast = walk(root, 6, 'fast');
    const tree = new AnimationBlendTree(mixer, {
      dimension: '1d',
      points: [
        { clip: slow, value: 0 },
        { clip: fast, value: 1 },
      ],
    });
    const binding = new AnimationRootMotion(root, { target });
    mixer.clipAction(slow).setRootMotion(binding);
    mixer.clipAction(fast).setRootMotion(binding);
    tree.setParameter(0.5).play();
    mixer.update(1.25);
    expect(target.position.x).toBeCloseTo(5);
    tree.normalizedTime = 0.8;
    mixer.update(0);
    expect(target.position.x).toBeCloseTo(5);
    mixer.destroy();
  });
  it('cancels staged motion when a loop callback stops/seeks the action or clears the mixer', () => {
    for (const cancel of ['stop', 'seek', 'clear', 'destroy'] as const) {
      const { target, mixer, action } = rig();
      action.on('loop', () => {
        if (cancel === 'stop') action.stop();
        else if (cancel === 'seek') action.time = 0.5;
        else if (cancel === 'clear') mixer.clear();
        else mixer.destroy();
      });
      mixer.update(1);
      expect(target.position.x).toBe(0);
      mixer.destroy();
    }
  });
  it('keeps pause stationary, rejects reentry, and discards unflushed motion after callback errors', () => {
    const { target, mixer, action } = rig();
    mixer.paused = true;
    mixer.update(100);
    expect(action.time).toBe(0);
    mixer.paused = false;
    const reenter = () => mixer.update(0.1);
    action.on('loop', reenter);
    expect(() => mixer.update(1)).toThrow('not reentrant');
    expect(target.position.x).toBe(0);
    action.off('loop', reenter);
    mixer.update(0.25);
    expect(target.position.x).toBeCloseTo(0.5);
    mixer.destroy();
  });
  it('lets a physics consumer decide movement, cancels later sinks after clear, and releases bindings for reuse', () => {
    const root = new Group(),
      otherRoot = new Group(),
      mixer = new AnimationMixer();
    const moved = new Vector3(),
      blocked = new Vector3();
    const binding = new AnimationRootMotion(root, {
      sink: (delta) => {
        moved.add(delta.translation);
        mixer.clear();
      },
    });
    mixer.clipAction(walk(root)).setRootMotion(binding).play();
    mixer
      .clipAction(walk(otherRoot))
      .setRootMotion(
        new AnimationRootMotion(otherRoot, {
          sink: (delta) => blocked.add(delta.translation),
        }),
      )
      .play();
    mixer.update(0.25);
    expect(moved.x).toBeCloseTo(0.5);
    expect(blocked.x).toBe(0);
    const next = new AnimationMixer();
    next.clipAction(walk(root)).setRootMotion(binding).play();
    next.update(0.25);
    expect(moved.x).toBeCloseTo(1);
    next.destroy();
    mixer.destroy();
  });
  it('rejects invalid root extraction atomically and leaves the previous valid binding active', () => {
    const { root, target, mixer, action } = rig();
    const other = new Group();
    expect(() =>
      action.setRootMotion(new AnimationRootMotion(other, { target })),
    ).toThrow('no tracks');
    mixer.update(0.25);
    expect(target.position.x).toBeCloseTo(0.5);
    const second = new AnimationMixer();
    const binding = new AnimationRootMotion(root, { target });
    action.setRootMotion(binding);
    expect(() => second.clipAction(walk(root)).setRootMotion(binding)).toThrow(
      'another mixer',
    );
    mixer.update(0.25);
    expect(target.position.x).toBeCloseTo(1);
    second.destroy();
    mixer.destroy();
  });
  it('delivers the final once displacement unless its finished callback clears playback', () => {
    for (const clear of [false, true]) {
      const { target, mixer, action } = rig();
      action.loopMode = 'once';
      if (clear) action.on('finished', () => mixer.clear());
      mixer.update(3);
      expect(target.position.x).toBeCloseTo(clear ? 0 : 2);
      mixer.destroy();
    }
  });
  it('routes actual extracted locomotion through capsule collision instead of teleporting through a wall', () => {
    const scene = new Scene(),
      root = new Group(),
      actor = new Group(),
      wall = new Group();
    root.position.x = 5;
    actor.position.y = 1;
    actor.collider = new CapsuleCollider3D(0.25, 1);
    wall.position.set(1, 1, 0);
    wall.collider = new BoxCollider3D(new Vector3(0.1, 2, 2));
    scene.add(actor);
    scene.add(wall);
    const controller = new CharacterController3D(actor, scene.physics3D, {
      stepHeight: 0,
      groundSnap: 0,
    });
    let blocked = false;
    const binding = new AnimationRootMotion(root, {
      sink: (delta) => {
        blocked = controller.move(delta.translation).blocked;
      },
    });
    scene.animations.clipAction(walk(root)).setRootMotion(binding).play();
    scene.animations.update(1);
    expect(blocked).toBe(true);
    expect(actor.position.x).toBeGreaterThan(0.6);
    expect(actor.position.x).toBeLessThan(0.66);
    expect(root.position.x).toBe(5);
    controller.destroy();
    scene.destroy();
  });
});
