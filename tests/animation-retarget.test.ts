import { describe, expect, it } from 'vitest';
import {
  AnimationClip,
  AnimationMixer,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import {
  AnimationRetargeter,
  type AnimationBindTransform,
} from '../packages/core/src/animation-retarget.js';
import { AnimationRootMotion } from '../packages/core/src/animation-root-motion.js';
import { multiplyRotation } from '../packages/core/src/animation-pose.js';
import { Group } from '../packages/core/src/group.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { TextureMaterial } from '../packages/core/src/mesh.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';
import { NativeTexture2D } from '../packages/assets/src/native-texture.js';
import { Matrix4, Quaternion } from '../packages/math/src/index.js';

function bind(
  translation = [0, 0, 0],
  rotation = [0, 0, 0, 1],
  scale = [1, 1, 1],
): AnimationBindTransform {
  return { translation, rotation, scale };
}
function components(q: Quaternion): number[] {
  return [q.x, q.y, q.z, q.w];
}
function sameRotation(a: Quaternion, b: Quaternion): void {
  expect(Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)).toBeCloseTo(
    1,
    5,
  );
}

describe('explicit bind-pose clip retargeting', () => {
  it('corrects unequal rest axes and bone proportions on an actual target skin without changing source data', () => {
    const sourceRoot = new Group(),
      sourceBone = sourceRoot.add(new Group());
    const targetRoot = new Group(),
      targetBone = targetRoot.add(new Group());
    sourceBone.position.x = 1;
    sourceBone.rotation.setFromEuler(Math.PI / 2, 0, 0);
    targetRoot.rotation.setFromEuler(0, Math.PI / 2, 0);
    targetBone.position.y = 2;
    const targetBindWorld = new Matrix4()
      .copy(targetBone.updateWorldMatrix())
      .invert();
    const texture = new NativeTexture2D({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      levels: [
        { width: 1, height: 1, data: new Uint8Array([255, 255, 255, 255]) },
      ],
    });
    const mesh = new SkinnedMesh({
      geometry: Geometry.quad(1, 1),
      material: new TextureMaterial({ texture }),
      joints: [targetBone],
      inverseBindMatrices: [targetBindWorld],
      jointIndices: new Uint32Array(16),
      weights: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    });
    const source = new AnimationClip('different rest', [
      new KeyframeTrack(
        sourceBone,
        'rotation',
        [0, 1],
        [Math.SQRT1_2, 0, 0, Math.SQRT1_2, 0.5, 0.5, 0.5, 0.5],
      ),
      new KeyframeTrack(sourceBone, 'translation', [0, 1], [1, 0, 0, 2, 0, 0]),
    ]);
    const original = source.tracks.map((track) => track.values.slice());
    const adapter = new AnimationRetargeter(
      [
        {
          source: sourceBone,
          target: targetBone,
          sourceBind: bind([1, 0, 0], components(sourceBone.rotation)),
          targetBind: bind([0, 2, 0]),
        },
        {
          source: sourceRoot,
          target: targetRoot,
          sourceBind: bind(),
          targetBind: bind([0, 0, 0], components(targetRoot.rotation)),
        },
      ],
      { sourceRoot, targetRoot },
    );
    const result = adapter.retarget(source);
    const mixer = new AnimationMixer(),
      action = mixer.clipAction(result).play();
    action.loopMode = 'once';
    mixer.update(0);
    mesh.updateSkin();
    expect(mesh.geometry.vertices[0]).toBeCloseTo(-0.5);
    expect(mesh.geometry.vertices[1]).toBeCloseTo(0.5);
    mixer.update(1);
    expect(targetBone.position.x).toBeCloseTo(0);
    expect(targetBone.position.y).toBeCloseTo(2);
    expect(targetBone.position.z).toBeCloseTo(2);
    mesh.updateSkin();
    expect(mesh.geometry.vertices[0]).toBeCloseTo(3.5, 5);
    expect(mesh.geometry.vertices[1]).toBeCloseTo(1.5, 5);
    expect(mesh.geometry.vertices[2]).toBeCloseTo(0, 5);
    expect(sourceBone.position.x).toBe(1);
    sameRotation(
      sourceBone.rotation,
      new Quaternion().setFromEuler(Math.PI / 2, 0, 0),
    );
    source.tracks.forEach((track, i) =>
      expect(track.values).toEqual(original[i]),
    );
    mixer.destroy();
    texture.destroy();
  });
  it('retains cubic quaternion interpolation and derivatives rather than rekeying sampled values', () => {
    const sourceRoot = new Group(),
      targetRoot = new Group();
    const sourceRest = new Quaternion().setFromEuler(Math.PI / 2, 0, 0),
      targetRest = new Quaternion().setFromEuler(0, Math.PI / 2, 0);
    const animated = new Quaternion();
    multiplyRotation(
      new Quaternion().setFromEuler(0, 0, Math.PI / 2),
      sourceRest,
      animated,
    );
    const rotation = new KeyframeTrack(
      sourceRoot,
      'rotation',
      [0, 1],
      [
        0,
        0,
        0,
        0,
        ...components(sourceRest),
        0.2,
        0.1,
        0,
        -0.2,
        -0.1,
        0.2,
        0.1,
        0,
        ...components(animated),
        0,
        0,
        0,
        0,
      ],
      'CUBICSPLINE',
    );
    const adapter = new AnimationRetargeter(
      [
        {
          source: sourceRoot,
          target: targetRoot,
          sourceBind: bind([0, 0, 0], components(sourceRest)),
          targetBind: bind([0, 0, 0], components(targetRest)),
        },
      ],
      { sourceRoot, targetRoot },
    );
    const retargeted = adapter.retarget(new AnimationClip('cubic', [rotation]))
      .tracks[0];
    const a = new Float64Array(4),
      b = new Float64Array(4),
      correction = new Quaternion(
        -sourceRest.x,
        -sourceRest.y,
        -sourceRest.z,
        sourceRest.w,
      ),
      expected = new Quaternion();
    multiplyRotation(correction, targetRest, correction);
    for (const time of [0.2, 0.7]) {
      rotation.sampleValues(time, a);
      retargeted.sampleValues(time, b);
      multiplyRotation(
        new Quaternion(a[0], a[1], a[2], a[3]),
        correction,
        expected,
      );
      sameRotation(new Quaternion(b[0], b[1], b[2], b[3]), expected);
    }
    expect(retargeted.interpolation).toBe('CUBICSPLINE');
  });
  it('scales cubic translation tangents and offsets independently and preserves STEP behavior', () => {
    const sourceRoot = new Group(),
      targetRoot = new Group();
    const adapter = new AnimationRetargeter(
      [
        {
          source: sourceRoot,
          target: targetRoot,
          sourceBind: bind([5, 0, 0]),
          targetBind: bind([10, 0, 0]),
        },
      ],
      { sourceRoot, targetRoot, rootTranslationScale: 3 },
    );
    const cubic = new KeyframeTrack(
      sourceRoot,
      'translation',
      [0, 1],
      [0, 0, 0, 5, 0, 0, 4, 0, 0, 2, 0, 0, 7, 0, 0, 0, 0, 0],
      'CUBICSPLINE',
    );
    const result = adapter.retarget(
      new AnimationClip('cubic displacement', [cubic]),
    ).tracks[0];
    const a = new Float64Array(3),
      b = new Float64Array(3);
    cubic.sampleValues(0.4, a);
    result.sampleValues(0.4, b);
    expect(b[0]).toBeCloseTo(10 + (a[0] - 5) * 3);
    const step = adapter.retarget(
      new AnimationClip('step', [
        new KeyframeTrack(
          sourceRoot,
          'translation',
          [0, 1],
          [5, 0, 0, 7, 0, 0],
          'STEP',
        ),
      ]),
    ).tracks[0];
    step.sampleValues(0.9, b);
    expect(b[0]).toBe(10);
    step.sampleValues(1, b);
    expect(b[0]).toBe(16);
  });
  it('feeds retargeted scaled loop displacement into a rotated public root-motion consumer', () => {
    const sourceRoot = new Group(),
      targetRoot = new Group(),
      actor = new Group(),
      mixer = new AnimationMixer();
    actor.rotation.setFromEuler(0, 0, Math.PI / 2);
    const adapter = new AnimationRetargeter(
      [
        {
          source: sourceRoot,
          target: targetRoot,
          sourceBind: bind(),
          targetBind: bind(),
        },
      ],
      { sourceRoot, targetRoot, rootTranslationScale: 2 },
    );
    const clip = adapter.retarget(
      new AnimationClip('locomotion', [
        new KeyframeTrack(
          sourceRoot,
          'translation',
          [0, 1],
          [0, 0, 0, 1, 0, 0],
        ),
      ]),
    );
    const action = mixer
      .clipAction(clip)
      .setRootMotion(new AnimationRootMotion(targetRoot, { target: actor }))
      .play();
    mixer.update(2.25);
    expect(actor.position.x).toBeCloseTo(0);
    expect(actor.position.y).toBeCloseTo(4.5);
    expect(targetRoot.position.x).toBe(0);
    action.timeScale = -1;
    mixer.update(2.25);
    expect(actor.position.y).toBeCloseTo(0);
    mixer.destroy();
  });
  it('rejects incomplete/ambiguous hierarchy and unsupported tracks atomically', () => {
    const sourceRoot = new Group(),
      sourceBone = sourceRoot.add(new Group()),
      targetRoot = new Group(),
      targetBone = new Group();
    const entries = [
      {
        source: sourceRoot,
        target: targetRoot,
        sourceBind: bind(),
        targetBind: bind(),
      },
      {
        source: sourceBone,
        target: targetBone,
        sourceBind: bind([1, 0, 0]),
        targetBind: bind([2, 0, 0]),
      },
    ];
    expect(
      () => new AnimationRetargeter(entries, { sourceRoot, targetRoot }),
    ).toThrow('parents');
    targetRoot.add(targetBone);
    const adapter = new AnimationRetargeter(entries, {
      sourceRoot,
      targetRoot,
    });
    const source = new AnimationClip('unsupported', [
      new KeyframeTrack(sourceRoot, 'translation', [0, 1], [0, 0, 0, 1, 0, 0]),
      new KeyframeTrack(sourceBone, 'scale', [0, 1], [1, 1, 1, 2, 3, 2]),
    ]);
    expect(() => adapter.retarget(source)).toThrow('uniform');
    expect(targetRoot.position.x).toBe(0);
    expect(targetBone.position.x).toBe(0);
    expect(source.tracks[1].values[4]).toBe(3);
    expect(
      () =>
        new AnimationRetargeter([...entries, entries[0]], {
          sourceRoot,
          targetRoot,
        }),
    ).toThrow('one-to-one');
    targetRoot.remove(targetBone);
    expect(() => adapter.retarget(new AnimationClip('empty', []))).toThrow(
      'hierarchy changed',
    );
  });
  it('snapshots explicit bind data and supports positive uniform scale ratios without taking node ownership', () => {
    const sourceRoot = new Group(),
      targetRoot = new Group(),
      sourceBind = bind(),
      targetBind = bind([4, 0, 0], [0, 0, 0, 1], [2, 2, 2]);
    const adapter = new AnimationRetargeter(
      [{ source: sourceRoot, target: targetRoot, sourceBind, targetBind }],
      { sourceRoot, targetRoot },
    );
    (targetBind.translation as number[])[0] = 100;
    const result = adapter.retarget(
      new AnimationClip('uniform', [
        new KeyframeTrack(sourceRoot, 'scale', [0, 1], [1, 1, 1, 3, 3, 3]),
        new KeyframeTrack(
          sourceRoot,
          'translation',
          [0, 1],
          [0, 0, 0, 1, 0, 0],
        ),
      ]),
    );
    const mixer = new AnimationMixer();
    mixer.clipAction(result).play();
    mixer.update(0.5);
    expect(targetRoot.scale.x).toBeCloseTo(4);
    expect(targetRoot.position.x).toBeCloseTo(4.5);
    mixer.destroy();
    expect(targetRoot.destroyed).toBe(false);
    expect(sourceRoot.destroyed).toBe(false);
  });
  it('rejects cubic scale reflection between positive endpoints before publishing a clip', () => {
    const sourceRoot = new Group(),
      targetRoot = new Group();
    const adapter = new AnimationRetargeter(
      [
        {
          source: sourceRoot,
          target: targetRoot,
          sourceBind: bind(),
          targetBind: bind(),
        },
      ],
      { sourceRoot, targetRoot },
    );
    const scale = new KeyframeTrack(
      sourceRoot,
      'scale',
      [0, 1],
      [0, 0, 0, 1, 1, 1, -8, -8, -8, 8, 8, 8, 1, 1, 1, 0, 0, 0],
      'CUBICSPLINE',
    );
    expect(() =>
      adapter.retarget(new AnimationClip('reflection', [scale])),
    ).toThrow('singular or reflected');
    expect(targetRoot.scale.x).toBe(1);
  });
  it('supports collapsed target offsets and explicit zero translation scale without suppressing rotations', () => {
    const sourceRoot = new Group(),
      sourceBone = sourceRoot.add(new Group());
    const targetRoot = new Group(),
      targetBone = targetRoot.add(new Group());
    const adapter = new AnimationRetargeter(
      [
        {
          source: sourceRoot,
          target: targetRoot,
          sourceBind: bind(),
          targetBind: bind(),
        },
        {
          source: sourceBone,
          target: targetBone,
          sourceBind: bind([1, 0, 0]),
          targetBind: bind(),
        },
      ],
      { sourceRoot, targetRoot, rootTranslationScale: 0 },
    );
    const clip = adapter.retarget(
      new AnimationClip('twist', [
        new KeyframeTrack(
          sourceRoot,
          'translation',
          [0, 1],
          [0, 0, 0, 3, 0, 0],
        ),
        new KeyframeTrack(
          sourceBone,
          'translation',
          [0, 1],
          [1, 0, 0, 2, 0, 0],
        ),
        new KeyframeTrack(
          sourceBone,
          'rotation',
          [0, 1],
          [0, 0, 0, 1, 0, 0, Math.SQRT1_2, Math.SQRT1_2],
        ),
      ]),
    );
    const mixer = new AnimationMixer(),
      action = mixer.clipAction(clip).play();
    action.loopMode = 'once';
    mixer.update(1);
    expect(targetRoot.position.x).toBe(0);
    expect(targetBone.position.x).toBe(0);
    expect(targetBone.rotation.z).toBeCloseTo(Math.SQRT1_2);
    mixer.destroy();
  });
});
