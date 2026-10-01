import { describe, expect, it } from 'vitest';
import {
  AnimationClip,
  AnimationMixer,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import type { AnimationPath } from '../packages/core/src/animation.js';
import {
  AnimationMask,
  AnimationReferencePose,
} from '../packages/core/src/animation-pose.js';
import { AnimationBlendTree } from '../packages/core/src/animation-blend-tree.js';
import { TwoBoneIKConstraint } from '../packages/core/src/animation-ik.js';
import { AnimationStateMachine } from '../packages/core/src/animation-state.js';
import { Group } from '../packages/core/src/group.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector3 } from '../packages/math/src/index.js';

function constant(
  target: Group,
  path: AnimationPath,
  values: number[],
): KeyframeTrack {
  return new KeyframeTrack(target, path, [0, 1], [...values, ...values]);
}
function slide(
  target: Group,
  value: number,
  name: string,
  duration = 1,
): AnimationClip {
  return new AnimationClip(name, [
    new KeyframeTrack(
      target,
      'translation',
      [0, duration],
      [value, 0, 0, value, 0, 0],
    ),
  ]);
}
function chain() {
  const mixer = new AnimationMixer();
  const root = new Group(),
    middle = root.add(new Group()),
    tip = middle.add(new Group());
  middle.position.x = 1;
  tip.position.x = 1;
  return { mixer, root, middle, tip };
}
function endpoint(tip: Group): Vector3 {
  const e = tip.updateWorldMatrix().elements;
  return new Vector3(e[12], e[13], e[14]);
}

describe('masked reference-relative animation', () => {
  it('leaves excluded bones and properties intact while weighting allowed channels', () => {
    const target = new Group(),
      excluded = new Group(),
      mixer = new AnimationMixer();
    target.position.set(3, 4, 5);
    excluded.position.set(7, 8, 9);
    const action = mixer
      .clipAction(
        new AnimationClip('masked', [
          constant(target, 'translation', [9, 9, 9]),
          constant(target, 'scale', [3, 3, 3]),
          constant(excluded, 'translation', [0, 0, 0]),
        ]),
      )
      .play();
    action.mask = new AnimationMask([
      { target, paths: ['scale'], weight: 0.5 },
    ]);
    mixer.update(0);
    expect(target.position).toEqual(new Vector3(3, 4, 5));
    expect(excluded.position).toEqual(new Vector3(7, 8, 9));
    expect(target.scale).toEqual(new Vector3(2, 2, 2));
    mixer.destroy();
  });
  it('treats an explicit reference and its antipodal quaternion as zero delta', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    target.position.set(10, 2, 3);
    target.scale.set(2, 3, 4);
    target.rotation.setFromEuler(0.4, 0.2, 0.1);
    const before = target.rotation.clone();
    const reference = new AnimationReferencePose([
      {
        target,
        translation: [3, 2, 1],
        scale: [2, 1, 3],
        rotation: [0, 0, 0, 1],
      },
    ]);
    const action = mixer
      .clipAction(
        new AnimationClip('zero', [
          constant(target, 'translation', [3, 2, 1]),
          constant(target, 'scale', [2, 1, 3]),
          constant(target, 'rotation', [0, 0, 0, -1]),
        ]),
      )
      .setAdditive(reference)
      .play();
    action.weight = 0.3;
    for (let i = 0; i < 40; i++) mixer.update(0.01);
    expect(target.position).toEqual(new Vector3(10, 2, 3));
    expect(target.scale).toEqual(new Vector3(2, 3, 4));
    expect(target.rotation.x).toBeCloseTo(before.x);
    expect(target.rotation.y).toBeCloseTo(before.y);
    expect(target.rotation.z).toBeCloseTo(before.z);
    expect(target.rotation.w).toBeCloseTo(before.w);
    mixer.destroy();
  });
  it('applies scale ratios and spherical weighted local rotation without held-pose drift', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    target.position.x = 10;
    target.scale.set(2, 2, 2);
    const reference = new AnimationReferencePose([
      {
        target,
        translation: [2, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0, 1],
      },
    ]);
    const action = mixer
      .clipAction(
        new AnimationClip('additive', [
          constant(target, 'translation', [4, 0, 0]),
          constant(target, 'scale', [2, 2, 2]),
          constant(target, 'rotation', [0, 0, Math.SQRT1_2, Math.SQRT1_2]),
        ]),
      )
      .setAdditive(reference)
      .play();
    action.weight = 0.25;
    action.timeScale = 0;
    for (let i = 0; i < 100; i++) mixer.update(0.01);
    expect(target.position.x).toBeCloseTo(10.5);
    expect(target.scale.x).toBeCloseTo(2.5);
    expect(target.rotation.z).toBeCloseTo(Math.sin(Math.PI / 16));
    expect(target.rotation.w).toBeCloseTo(Math.cos(Math.PI / 16));
    target.position.x = 20;
    mixer.update(0);
    expect(target.position.x).toBeCloseTo(20.5);
    mixer.clear();
    expect(target.position.x).toBeCloseTo(20);
    expect(target.scale.x).toBeCloseTo(2);
    expect(target.rotation.w).toBeCloseTo(1);
  });
  it('uses inverse-reference then sampled quaternion, composed after the base rotation', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    target.rotation.setFromEuler(Math.PI / 2, 0, 0);
    const reference = new AnimationReferencePose([
      { target, rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2] },
    ]);
    // Reference Y90 followed by local Z90.
    const action = mixer
      .clipAction(
        new AnimationClip('delta', [
          constant(target, 'rotation', [0.5, 0.5, 0.5, 0.5]),
        ]),
      )
      .setAdditive(reference)
      .play();
    action.weight = 0.5;
    mixer.update(0);
    expect(target.rotation.x).toBeCloseTo(Math.SQRT1_2 * Math.cos(Math.PI / 8));
    expect(target.rotation.y).toBeCloseTo(
      -Math.SQRT1_2 * Math.sin(Math.PI / 8),
    );
    expect(target.rotation.z).toBeCloseTo(Math.SQRT1_2 * Math.sin(Math.PI / 8));
    expect(target.rotation.w).toBeCloseTo(Math.SQRT1_2 * Math.cos(Math.PI / 8));
    mixer.destroy();
  });
  it('rejects missing or singular reference channels before playback can use them', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    const action = mixer.clipAction(slide(target, 2, 'slide'));
    expect(() =>
      action.setAdditive(
        new AnimationReferencePose([{ target, scale: [1, 1, 1] }]),
      ),
    ).toThrow(RangeError);
    expect(
      () => new AnimationReferencePose([{ target, scale: [1, 0, 1] }]),
    ).toThrow(RangeError);
    mixer.destroy();
  });
  it('uses state masks and additive reference within the existing state/action lifecycle', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    target.position.x = 5;
    const reference = new AnimationReferencePose([
      { target, translation: [2, 0, 0] },
    ]);
    const machine = new AnimationStateMachine(mixer, {
      initial: 'idle',
      states: {
        idle: {
          clip: slide(target, 4, 'idle'),
          additiveReference: reference,
          mask: new AnimationMask([
            { target, paths: ['translation'], weight: 0.5 },
          ]),
        },
      },
    });
    mixer.update(0.1);
    mixer.update(0.1);
    expect(target.position.x).toBeCloseTo(6);
    machine.destroy();
    mixer.destroy();
  });
});

describe('normalized sampled blend trees', () => {
  it('clamps 1D endpoints and smoothly moves parameters with frame-rate-independent response', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    const tree = new AnimationBlendTree(mixer, {
      dimension: '1d',
      smoothing: 0.5,
      points: [
        { clip: slide(target, 0, 'idle'), value: 0 },
        { clip: slide(target, 10, 'run'), value: 1 },
      ],
    }).play();
    tree.setParameter(1);
    mixer.update(0.25);
    mixer.update(0.25);
    expect(target.position.x).toBeCloseTo(10 * (1 - Math.exp(-1)));
    expect(tree.weights[0] + tree.weights[1]).toBeCloseTo(1);
    tree.setParameter(-100);
    mixer.update(1);
    expect(target.position.x).toBe(0);
    tree.setParameter(100);
    mixer.update(1);
    expect(target.position.x).toBe(10);
    mixer.destroy();
  });
  it('interpolates 2D triangles and projects out-of-domain parameters onto their nearest boundary', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    const tree = new AnimationBlendTree(mixer, {
      dimension: '2d',
      parameter: { x: 0.25, y: 0.25 },
      points: [
        { clip: slide(target, 0, 'a'), x: 0, y: 0 },
        { clip: slide(target, 10, 'b'), x: 1, y: 0 },
        { clip: slide(target, 20, 'c'), x: 0, y: 1 },
      ],
      triangles: [[0, 1, 2]],
    }).play();
    mixer.update(0);
    expect(target.position.x).toBeCloseTo(7.5);
    expect([...tree.weights]).toEqual([0.5, 0.25, 0.25]);
    tree.setParameter(2, 2);
    mixer.update(0);
    expect([...tree.weights]).toEqual([0, 0.5, 0.5]);
    expect(target.position.x).toBeCloseTo(15);
    tree.setParameter(-1, -1);
    mixer.update(0);
    expect(target.position.x).toBe(0);
    mixer.destroy();
  });
  it('synchronizes unequal-duration leaves and respects seek, reverse, pingpong, once and pause', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    const clips = [1, 3].map(
      (duration, i) =>
        new AnimationClip(String(i), [
          new KeyframeTrack(
            target,
            'translation',
            [0, duration],
            [0, 0, 0, 10, 0, 0],
          ),
        ]),
    );
    const tree = new AnimationBlendTree(mixer, {
      dimension: '1d',
      parameter: 0.5,
      points: [
        { clip: clips[0], value: 0 },
        { clip: clips[1], value: 1 },
      ],
    }).play();
    mixer.update(1);
    expect(tree.normalizedTime).toBeCloseTo(0.5);
    expect(target.position.x).toBeCloseTo(5);
    tree.loopMode = 'pingpong';
    tree.normalizedTime = 0.75;
    mixer.update(1);
    expect(tree.normalizedTime).toBeCloseTo(0.75);
    expect(target.position.x).toBeCloseTo(7.5);
    tree.pause();
    mixer.update(3);
    expect(target.position.x).toBeCloseTo(7.5);
    tree.loopMode = 'once';
    tree.normalizedTime = 0.5;
    tree.timeScale = -1;
    tree.play();
    mixer.update(1.5);
    expect(tree.playing).toBe(false);
    expect(target.position.x).toBe(0);
    tree.timeScale = 1;
    tree.normalizedTime = 0.75;
    tree.play();
    mixer.update(1);
    expect(tree.playing).toBe(false);
    expect(target.position.x).toBe(10);
    mixer.destroy();
  });
  it('rejects mismatched leaf channels and degenerate triangle topology', () => {
    const a = new Group(),
      b = new Group(),
      mixer = new AnimationMixer();
    expect(
      () =>
        new AnimationBlendTree(mixer, {
          dimension: '1d',
          points: [
            { clip: slide(a, 0, 'a'), value: 0 },
            { clip: slide(b, 1, 'b'), value: 1 },
          ],
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new AnimationBlendTree(mixer, {
          dimension: '2d',
          points: [
            { clip: slide(a, 0, 'a'), x: 0, y: 0 },
            { clip: slide(a, 1, 'b'), x: 1, y: 0 },
            { clip: slide(a, 2, 'c'), x: 2, y: 0 },
          ],
          triangles: [[0, 1, 2]],
        }),
    ).toThrow(RangeError);
    mixer.destroy();
  });
});

describe('post-sampling two-bone IK', () => {
  it('reaches a target through rotated/scaled ancestors and selects the authored pole side', () => {
    const { mixer, root, middle, tip } = chain();
    const parent = new Group();
    parent.add(root);
    parent.position.set(2, 3, 0);
    parent.rotation.setFromEuler(0, 0, 0.3);
    parent.scale.set(2, 2, 2);
    const pole = new Vector3(1, 8, 0),
      target = new Vector3(4, 5, 0);
    new TwoBoneIKConstraint(mixer, { root, middle, tip, target, pole });
    for (let i = 0; i < 30; i++) mixer.update(0.01);
    expect(endpoint(tip).x).toBeCloseTo(4);
    expect(endpoint(tip).y).toBeCloseTo(5);
    const above = endpoint(middle).y - endpoint(middle).x;
    pole.set(8, 1, 0);
    mixer.update(0);
    expect(endpoint(middle).y - endpoint(middle).x).toBeLessThan(above);
    expect(endpoint(tip).x).toBeCloseTo(4);
    expect(endpoint(tip).y).toBeCloseTo(5);
    mixer.destroy();
  });
  it('clamps unreachable targets and enforces bend-angle reach limits', () => {
    const { mixer, root, middle, tip } = chain();
    const ik = new TwoBoneIKConstraint(mixer, {
      root,
      middle,
      tip,
      target: new Vector3(10, 0, 0),
      minBend: Math.PI / 2,
    });
    mixer.update(0);
    expect(endpoint(tip).length()).toBeCloseTo(Math.SQRT2);
    expect(ik.status).toBe('clamped');
    mixer.destroy();
  });
  it('handles coincident goals, collinear poles and antiparallel reach without NaNs', () => {
    const { mixer, root, middle, tip } = chain();
    const target = new Vector3(-2, 0, 0);
    new TwoBoneIKConstraint(mixer, { root, middle, tip, target, pole: target });
    mixer.update(0);
    expect(endpoint(tip).x).toBeCloseTo(-2);
    target.set(0, 0, 0);
    mixer.update(0);
    expect(endpoint(tip).length()).toBeLessThan(1e-5);
    expect(
      Math.hypot(
        root.rotation.x,
        root.rotation.y,
        root.rotation.z,
        root.rotation.w,
      ),
    ).toBeCloseTo(1);
    expect(
      Math.hypot(
        middle.rotation.x,
        middle.rotation.y,
        middle.rotation.z,
        middle.rotation.w,
      ),
    ).toBeCloseTo(1);
    mixer.destroy();
  });
  it('leaves singular chains unchanged and disables invalid reparented hierarchies', () => {
    const { mixer, root, middle, tip } = chain();
    const ik = new TwoBoneIKConstraint(mixer, {
      root,
      middle,
      tip,
      target: new Vector3(1, 1, 0),
    });
    root.scale.set(0, 0, 0);
    mixer.update(0);
    expect(ik.status).toBe('singular');
    expect(root.rotation.w).toBe(1);
    root.scale.set(1, 2, 1);
    mixer.update(0);
    expect(ik.status).toBe('singular');
    expect(root.rotation.w).toBe(1);
    root.scale.set(1, 1, 1);
    middle.remove(tip);
    mixer.update(0);
    expect(ik.status).toBe('invalid-hierarchy');
    expect(ik.enabled).toBe(false);
    mixer.destroy();
  });
  it('runs after sampled rotations, avoids weighted-pose drift, freezes on pause and releases on clear', () => {
    const { mixer, root, middle, tip } = chain();
    mixer
      .clipAction(
        new AnimationClip('base', [
          constant(root, 'rotation', [0, 0, 0, 1]),
          constant(middle, 'rotation', [0, 0, 0, 1]),
        ]),
      )
      .play();
    const target = new Vector3(1, 1, 0);
    const ik = new TwoBoneIKConstraint(mixer, {
      root,
      middle,
      tip,
      target,
      pole: new Vector3(0, 2, 0),
      weight: 0.5,
    });
    mixer.update(0);
    const before = endpoint(tip);
    for (let i = 0; i < 20; i++) mixer.update(0.01);
    expect(endpoint(tip).x).toBeCloseTo(before.x);
    expect(endpoint(tip).y).toBeCloseTo(before.y);
    mixer.paused = true;
    target.set(-1, 1, 0);
    mixer.update(1);
    expect(endpoint(tip).x).toBeCloseTo(before.x);
    expect(endpoint(tip).y).toBeCloseTo(before.y);
    mixer.paused = false;
    mixer.stopAll();
    mixer.update(1);
    expect(ik.enabled).toBe(false);
    mixer.clear();
    target.set(0, -2, 0);
    mixer.update(1);
    expect(endpoint(tip).x).toBeCloseTo(2);
    expect(endpoint(tip).y).toBeCloseTo(0);
    expect(root.destroyed).toBe(false);
    expect(tip.destroyed).toBe(false);
  });
  it('disables and unbinds a removed borrowed target without destroying it or its chain', () => {
    const { mixer, root, middle, tip } = chain();
    const scene = new Scene(),
      target = scene.add(new Group());
    target.position.set(1, 1, 0);
    const ik = new TwoBoneIKConstraint(mixer, {
      root,
      middle,
      tip,
      target,
      pole: target,
    });
    mixer.update(0);
    scene.remove(target);
    expect(ik.enabled).toBe(false);
    expect(ik.status).toBe('invalid-target');
    expect(target.destroyed).toBe(false);
    expect(root.destroyed).toBe(false);
    mixer.clear();
    scene.add(target);
    target.position.set(-2, 0, 0);
    mixer.update(0);
    expect(endpoint(tip).x).toBeCloseTo(2);
    scene.destroy();
  });
});

describe('animation callback pose ownership', () => {
  function additive(mixer: AnimationMixer, target: Group): void {
    mixer
      .clipAction(slide(target, 4, 'additive'))
      .setAdditive(
        new AnimationReferencePose([{ target, translation: [2, 0, 0] }]),
      )
      .play();
  }

  it('restores an additive base when a finished callback clears the mixer', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    target.position.x = 10;
    const clip = slide(target, 4, 'once');
    mixer
      .clipAction(clip)
      .setAdditive(
        new AnimationReferencePose([{ target, translation: [2, 0, 0] }]),
      )
      .on('finished', () => mixer.clear())
      .play();
    mixer.clipAction(clip).loopMode = 'once';
    mixer.update(1);
    expect(target.position.x).toBe(10);
    mixer.destroy();
  });

  it('keeps external pose edits made by loop listeners as the next additive base', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    target.position.x = 10;
    const clip = slide(target, 4, 'loop');
    const action = mixer
      .clipAction(clip)
      .setAdditive(
        new AnimationReferencePose([{ target, translation: [2, 0, 0] }]),
      )
      .play();
    const edit = (): void => {
      target.position.x = 20;
      action.off('loop', edit);
    };
    action.on('loop', edit);
    mixer.update(1);
    expect(target.position.x).toBe(20);
    mixer.update(0);
    expect(target.position.x).toBe(22);
    mixer.destroy();
  });

  it('rejects nested updates without adding the same overlay twice', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    target.position.x = 10;
    const action = mixer
      .clipAction(slide(target, 4, 'reentrant'))
      .setAdditive(
        new AnimationReferencePose([{ target, translation: [2, 0, 0] }]),
      )
      .play();
    let nestedError: unknown;
    const nested = (): void => {
      action.off('loop', nested);
      try {
        mixer.update(0);
      } catch (error) {
        nestedError = error;
      }
    };
    action.on('loop', nested);
    mixer.update(1);
    expect(nestedError).toBeInstanceOf(Error);
    expect(target.position.x).toBe(12);
    mixer.update(0);
    expect(target.position.x).toBe(12);
    mixer.destroy();
  });

  it('stops remaining actions and constraints when a controller requests pause', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    additive(mixer, target);
    mixer.addController({
      evaluate: () => {
        mixer.paused = true;
      },
    });
    let solved = false;
    mixer.addConstraint({
      enabled: true,
      channels: [],
      solve: () => {
        solved = true;
      },
      destroy: () => {},
    });
    mixer.update(0.5);
    expect(target.position.x).toBe(0);
    expect(solved).toBe(false);
    mixer.destroy();
  });
});
