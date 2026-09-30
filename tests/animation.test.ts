import { describe, expect, it } from 'vitest';
import {
  AnimationClip,
  AnimationMixer,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import { Group } from '../packages/core/src/group.js';

describe('transform animation', () => {
  it('holds STEP values until each key and clamps nonlooping actions to the final pose', () => {
    const target = new Group();
    const track = new KeyframeTrack(
      target,
      'translation',
      [0, 1, 2],
      [0, 0, 0, 2, 0, 0, 5, 0, 0],
      'STEP',
    );
    const mixer = new AnimationMixer();
    const action = mixer.clipAction(new AnimationClip('step', [track])).play();
    action.loop = false;
    mixer.update(0.75);
    expect(target.position.x).toBe(0);
    mixer.update(0.25);
    expect(target.position.x).toBe(2);
    mixer.update(10);
    expect(target.position.x).toBe(5);
    expect(action.playing).toBe(false);
    mixer.update(1);
    expect(target.position.x).toBe(5);
  });
  it('uses shortest-path quaternion interpolation across equivalent signs', () => {
    const target = new Group();
    const track = new KeyframeTrack(
      target,
      'rotation',
      [0, 1],
      [0, 0, 0, 1, 0, 0, -Math.SQRT1_2, -Math.SQRT1_2],
    );
    track.sample(0.5);
    expect(target.rotation.z).toBeCloseTo(Math.sin(Math.PI / 8));
    expect(target.rotation.w).toBeCloseTo(Math.cos(Math.PI / 8));
    track.sample(1);
    expect(Math.abs(target.rotation.z)).toBeCloseTo(Math.SQRT1_2);
  });
  it('scales cubic tangents by interval duration and normalizes sampled rotations', () => {
    const target = new Group();
    const track = new KeyframeTrack(
      target,
      'translation',
      [0, 2],
      [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
      'CUBICSPLINE',
    );
    track.sample(1);
    expect(target.position.x).toBeCloseTo(1.5);
    track.sample(3);
    expect(target.position.x).toBe(2);
    const rotation = new KeyframeTrack(
      target,
      'rotation',
      [0, 2],
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      'CUBICSPLINE',
    );
    rotation.sample(1);
    expect(target.rotation.z).toBeCloseTo(Math.SQRT1_2);
    expect(target.rotation.w).toBeCloseTo(Math.SQRT1_2);
  });
  it('wraps reverse playback, stops all actions and rejects duplicate times', () => {
    const target = new Group(),
      mixer = new AnimationMixer();
    const clip = new AnimationClip('move', [
      new KeyframeTrack(target, 'scale', [0, 2], [1, 1, 1, 3, 3, 3]),
    ]);
    const action = mixer.clipAction(clip).play();
    action.timeScale = -1;
    mixer.update(0.5);
    expect(action.time).toBe(1.5);
    expect(target.scale.x).toBe(2.5);
    mixer.stopAll();
    mixer.update(1);
    expect(target.scale.x).toBe(2.5);
    expect(action.time).toBe(0);
    expect(
      () =>
        new KeyframeTrack(target, 'translation', [0, 0], [0, 0, 0, 1, 1, 1]),
    ).toThrow(/strictly increasing/);
    expect(() => mixer.update(-1)).toThrow(RangeError);
  });
});
