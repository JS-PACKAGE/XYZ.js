import { Matrix4, Quaternion, Vector3 } from '../../../math/src/index.js';
import type { Object3D } from '../object3d.js';
import type { PhysicsWorld3D } from './world.js';
import {
  BallSocketJoint3D,
  HingeJoint3D,
  type BallSocketJointOptions3D,
  type HingeJointOptions3D,
  type Joint3D,
} from './joints.js';
import { finite3D, vector3D } from './collider.js';
import { physicsProfiles } from '../../../../src/data/physics-profiles.js';
export interface RagdollBoneMapping3D {
  id: string;
  bone: Object3D;
  body: Object3D;
}
export type RagdollJointOptions3D =
  | ({ type: 'cone'; a: string; b: string } & Omit<
      BallSocketJointOptions3D,
      'bodyA' | 'bodyB'
    >)
  | ({ type: 'hinge'; a: string; b: string } & Omit<
      HingeJointOptions3D,
      'bodyA' | 'bodyB'
    >);
export interface RagdollOptions3D {
  mappings: readonly RagdollBoneMapping3D[];
  joints: readonly RagdollJointOptions3D[];
  /** Registers missing bodies, unregisters only these on destroy. */ registerBodies?: boolean;
}
function multiply(a: Quaternion, b: Quaternion, out: Quaternion): Quaternion {
  return out.set(
    a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  );
}
function rotation(matrix: Matrix4, out: Quaternion): Quaternion {
  const e = matrix.elements;
  const sx = Math.hypot(e[0], e[1], e[2]),
    sy = Math.hypot(e[4], e[5], e[6]),
    sz = Math.hypot(e[8], e[9], e[10]);
  if (!(sx > 0 && sy > 0 && sz > 0))
    throw new RangeError('Ragdoll reference pose is singular.');
  const a = e[0] / sx,
    b = e[4] / sy,
    c = e[8] / sz,
    d = e[1] / sx,
    f = e[5] / sy,
    g = e[9] / sz,
    h = e[2] / sx,
    i = e[6] / sy,
    j = e[10] / sz;
  if (
    Math.abs(a * b + d * f + h * i) >
      physicsProfiles.ragdoll.referenceTolerance ||
    Math.abs(a * c + d * g + h * j) >
      physicsProfiles.ragdoll.referenceTolerance ||
    Math.abs(b * c + f * g + i * j) >
      physicsProfiles.ragdoll.referenceTolerance ||
    a * (f * j - g * i) - b * (d * j - g * h) + c * (d * i - f * h) < 0
  )
    throw new RangeError(
      'Ragdoll reference pose must not contain shear/reflection.',
    );
  const trace = a + f + j;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    out.set((i - g) / s, (c - h) / s, (d - b) / s, s / 4);
  } else if (a > f && a > j) {
    const s = Math.sqrt(1 + a - f - j) * 2;
    out.set(s / 4, (b + d) / s, (c + h) / s, (i - g) / s);
  } else if (f > j) {
    const s = Math.sqrt(1 + f - a - j) * 2;
    out.set((b + d) / s, s / 4, (g + i) / s, (c - h) / s);
  } else {
    const s = Math.sqrt(1 + j - a - f) * 2;
    out.set((c + h) / s, (g + i) / s, s / 4, (d - b) / s);
  }
  return out.normalize();
}
interface Binding {
  mapping: RagdollBoneMapping3D;
  offset: Vector3;
  rotation: Quaternion;
  target: Vector3;
  targetRotation: Quaternion;
}
/** Explicit reference-pose mapping. Existing world cone/hinge impulses are the only rigid solver.
 * Run blend after animation and world update. Bodies remain independent scene roots. */
export class Ragdoll3D {
  readonly joints: readonly Joint3D[];
  private readonly bindings: Binding[];
  private readonly owned: Object3D[] = [];
  private readonly inverse = new Matrix4();
  private readonly q = new Quaternion();
  private readonly r = new Quaternion();
  private disposed = false;
  constructor(
    readonly world: PhysicsWorld3D,
    options: RagdollOptions3D,
  ) {
    if (
      !options.mappings.length ||
      options.mappings.length > physicsProfiles.ragdoll.maxBones ||
      options.joints.length > physicsProfiles.ragdoll.maxBones * 2
    )
      throw new RangeError('Invalid ragdoll size.');
    const ids = new Map<string, Object3D>(),
      bones = new Set<Object3D>(),
      bodies = new Set<Object3D>();
    this.bindings = options.mappings.map((mapping) => {
      const { id, bone, body } = mapping;
      if (
        !id ||
        ids.has(id) ||
        bones.has(bone) ||
        bodies.has(body) ||
        bone === body ||
        bone.destroyed ||
        body.destroyed ||
        body.parent ||
        body.body?.type !== 'dynamic' ||
        !body.collider
      )
        throw new Error(
          'Ragdoll requires unique live bone/root dynamic-body mappings.',
        );
      if (body.scene && body.scene.physics3D !== world)
        throw new Error('Ragdoll body belongs to another world.');
      if (!world.has(body) && options.registerBodies === false)
        throw new Error('Ragdoll body must be registered.');
      world.validate(body);
      ids.set(id, body);
      bones.add(bone);
      bodies.add(body);
      const bm = bone.updateWorldMatrix(),
        bodyMatrix = body.updateWorldMatrix();
      vector3D(bone.position, 'bone position');
      vector3D(body.position, 'body position');
      for (const value of bm.elements) finite3D(value, 'reference matrix');
      const offset = new Vector3(
        bm.elements[12],
        bm.elements[13],
        bm.elements[14],
      );
      this.inverse.copy(bodyMatrix).invert().transformPoint(offset, offset);
      rotation(bodyMatrix, this.q);
      this.q.set(-this.q.x, -this.q.y, -this.q.z, this.q.w);
      rotation(bm, this.r);
      return {
        mapping: { ...mapping },
        offset,
        rotation: multiply(this.q, this.r, new Quaternion()),
        target: new Vector3(),
        targetRotation: new Quaternion(),
      };
    });
    const joints = options.joints.map((spec) => {
      const bodyA = ids.get(spec.a),
        bodyB = ids.get(spec.b);
      if (!bodyA || !bodyB)
        throw new Error('Ragdoll joint references an unknown mapping.');
      return spec.type === 'cone'
        ? new BallSocketJoint3D({ ...spec, bodyA, bodyB })
        : new HingeJoint3D({ ...spec, bodyA, bodyB });
    });
    const added: Joint3D[] = [];
    try {
      for (const body of bodies)
        if (!world.has(body)) {
          world.register(body);
          this.owned.push(body);
        }
      for (const joint of joints) {
        world.addJoint(joint);
        added.push(joint);
      }
    } catch (error) {
      for (const joint of added) world.removeJoint(joint);
      for (const body of this.owned) world.unregister(body);
      throw error;
    }
    this.joints = Object.freeze(joints);
    // Parent bones first so local transforms are derived from the already blended parent.
    const depth = (bone: Object3D): number => {
      let n = 0;
      for (let p = bone.parent; p; p = p.parent) n++;
      return n;
    };
    this.bindings.sort((a, b) => depth(a.mapping.bone) - depth(b.mapping.bone));
  }
  blend(weight = 1): void {
    finite3D(weight, 'blend weight');
    if (weight < 0 || weight > 1)
      throw new RangeError('Blend weight must be within [0,1].');
    if (this.disposed) throw new Error('Ragdoll3D is destroyed.');
    for (const binding of this.bindings) {
      const { bone, body } = binding.mapping;
      if (!this.world.has(body) || body.destroyed || bone.destroyed)
        throw new Error('Ragdoll mapping is no longer live.');
      body.updateWorldMatrix().transformPoint(binding.offset, binding.target);
      rotation(body.worldMatrix, this.q);
      multiply(this.q, binding.rotation, binding.targetRotation);
    }
    for (const binding of this.bindings) {
      const bone = binding.mapping.bone,
        target = binding.target,
        q = binding.targetRotation;
      if (bone.parent) {
        this.inverse
          .copy(bone.parent.updateWorldMatrix())
          .invert()
          .transformPoint(target, target);
        rotation(bone.parent.worldMatrix, this.q);
        this.q.set(-this.q.x, -this.q.y, -this.q.z, this.q.w);
        multiply(this.q, q, this.r);
        q.copy(this.r);
      }
      bone.position.x += (target.x - bone.position.x) * weight;
      bone.position.y += (target.y - bone.position.y) * weight;
      bone.position.z += (target.z - bone.position.z) * weight;
      const animation = bone.rotation,
        sign =
          animation.x * q.x +
            animation.y * q.y +
            animation.z * q.z +
            animation.w * q.w <
          0
            ? -1
            : 1;
      animation
        .set(
          animation.x * (1 - weight) + q.x * weight * sign,
          animation.y * (1 - weight) + q.y * weight * sign,
          animation.z * (1 - weight) + q.z * weight * sign,
          animation.w * (1 - weight) + q.w * weight * sign,
        )
        .normalize();
    }
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const joint of this.joints) this.world.removeJoint(joint);
    for (const body of this.owned) this.world.unregister(body);
  }
}
