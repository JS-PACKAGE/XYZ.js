import {
  Group,
  SkinnedMesh,
  Geometry,
  Matrix4,
  Quaternion,
  Vector3,
  AnimationClip,
  KeyframeTrack,
  AnimationBlendTree,
  AnimationMask,
  AnimationReferencePose,
  TwoBoneIKConstraint,
} from '../../src/index.js';
import type {
  AnimationMixer,
  AnimationAction,
  PBRMaterial,
} from '../../src/index.js';

export interface RunnerRig {
  readonly blend: AnimationBlendTree;
  readonly bob: AnimationAction;
  readonly ik: TwoBoneIKConstraint;
}
/** A single visibly skinned robot; collidable root movement stays outside sampled poses. */
export function createRunner(
  player: Group,
  mixer: AnimationMixer,
  material: PBRMaterial,
  handTarget: Vector3,
): RunnerRig {
  const body = player.add(new Group());
  const left = body.add(new Group());
  left.position.set(-0.18, -0.2, 0);
  const right = body.add(new Group());
  right.position.set(0.18, -0.2, 0);
  const shoulder = body.add(new Group());
  shoulder.position.set(0.27, 0.28, 0);
  const elbow = shoulder.add(new Group());
  elbow.position.set(0.35, 0, 0);
  const hand = elbow.add(new Group());
  hand.position.set(0.3, 0, 0);
  const joints = [body, left, right, shoulder, elbow, hand];
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    indices: number[] = [],
    jointIndices: number[] = [],
    weights: number[] = [];
  const cube = Geometry.cube(1);
  const part = (
    joint: number,
    center: readonly number[],
    size: readonly number[],
  ): void => {
    const start = positions.length / 3;
    for (let i = 0; i < cube.vertices.length; i += 8) {
      positions.push(
        cube.vertices[i]! * size[0]! + center[0]!,
        cube.vertices[i + 1]! * size[1]! + center[1]!,
        cube.vertices[i + 2]! * size[2]! + center[2]!,
      );
      normals.push(
        cube.vertices[i + 3]!,
        cube.vertices[i + 4]!,
        cube.vertices[i + 5]!,
      );
      uvs.push(cube.vertices[i + 6]!, cube.vertices[i + 7]!);
      jointIndices.push(joint, 0, 0, 0);
      weights.push(1, 0, 0, 0);
    }
    for (const index of cube.indices) indices.push(start + index);
  };
  part(0, [0, 0.12, 0], [0.48, 0.65, 0.32]);
  part(0, [0, 0.65, 0], [0.4, 0.35, 0.36]);
  part(1, [-0.18, -0.5, 0], [0.22, 0.6, 0.25]);
  part(2, [0.18, -0.5, 0], [0.22, 0.6, 0.25]);
  part(3, [0.445, 0.28, 0], [0.35, 0.15, 0.18]);
  part(4, [0.77, 0.28, 0], [0.3, 0.13, 0.16]);
  part(5, [0.92, 0.28, 0], [0.16, 0.18, 0.2]);
  const inversePlayer = new Matrix4().copy(player.updateWorldMatrix()).invert();
  const inverseBindMatrices = joints.map((joint) =>
    new Matrix4()
      .copy(inversePlayer)
      .multiply(joint.updateWorldMatrix())
      .invert(),
  );
  player.add(
    new SkinnedMesh({
      geometry: new Geometry({ positions, normals, uvs, indices }),
      material,
      joints,
      inverseBindMatrices,
      jointIndices,
      weights,
    }),
  );
  const rotation = (
    joint: Group,
    amount: number,
    side: number,
  ): KeyframeTrack => {
    const values: number[] = [];
    for (const angle of [0, amount * side, 0, -amount * side, 0]) {
      const q = new Quaternion().setFromEuler(angle, 0, 0);
      values.push(q.x, q.y, q.z, q.w);
    }
    return new KeyframeTrack(
      joint,
      'rotation',
      [0, 0.2, 0.4, 0.6, 0.8],
      values,
    );
  };
  const idle = new AnimationClip('idle', [
    rotation(left, 0.035, 1),
    rotation(right, 0.035, -1),
  ]);
  const run = new AnimationClip('stride', [
    rotation(left, 0.65, 1),
    rotation(right, 0.65, -1),
  ]);
  const blend = new AnimationBlendTree(mixer, {
    dimension: '1d',
    points: [
      { value: 0, clip: idle },
      { value: 1, clip: run },
    ],
    smoothing: 0.12,
    mask: new AnimationMask([
      { target: left, paths: ['rotation'] },
      { target: right, paths: ['rotation'] },
    ]),
  }).play();
  const bob = mixer.clipAction(
    new AnimationClip('breathing', [
      new KeyframeTrack(
        body,
        'translation',
        [0, 0.4, 0.8],
        [0, 0, 0, 0, 0.045, 0, 0, 0, 0],
      ),
    ]),
  );
  bob.mask = new AnimationMask([{ target: body, paths: ['translation'] }]);
  bob
    .setAdditive(
      new AnimationReferencePose([{ target: body, translation: [0, 0, 0] }]),
    )
    .play();
  const ik = new TwoBoneIKConstraint(mixer, {
    root: shoulder,
    middle: elbow,
    tip: hand,
    target: handTarget,
    pole: new Vector3(0, 4, 1),
    weight: 0.6,
    maxBend: 2.6,
  });
  return { blend, bob, ik };
}
