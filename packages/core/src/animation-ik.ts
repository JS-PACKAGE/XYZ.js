import { Quaternion, Vector3 } from '../../math/src/index.js';
import type { AnimationConstraint, AnimationMixer } from './animation.js';
import type { AnimationPoseChannel } from './animation-pose.js';
import { blendRotation, multiplyRotation } from './animation-pose.js';
import type { Object3D } from './object3d.js';

export interface TwoBoneIKOptions {
  root: Object3D;
  middle: Object3D;
  tip: Object3D;
  /** Borrowed world-space target: an object origin or mutable world-space vector. */
  target: Object3D | Readonly<Vector3>;
  pole?: Object3D | Readonly<Vector3>;
  weight?: number;
  /** Angle between successive segment directions: 0 is straight, PI fully folded. */
  minBend?: number;
  maxBend?: number;
}
export type TwoBoneIKStatus =
  | 'idle'
  | 'solved'
  | 'clamped'
  | 'singular'
  | 'invalid-target'
  | 'invalid-hierarchy';

/**
 * Analytic two-bone world-space solver, applied by the existing mixer after sampled actions.
 * The direct root→middle→tip chain and ancestors require positive uniform scales (no shear or
 * reflection). Only local rotations change; segment offsets and borrowed targets are never owned.
 */
export class TwoBoneIKConstraint implements AnimationConstraint {
  enabled = true;
  weight: number;
  readonly minBend: number;
  readonly maxBend: number;
  readonly channels: readonly AnimationPoseChannel[];
  status: TwoBoneIKStatus = 'idle';
  private target: Object3D | Readonly<Vector3> | undefined;
  private pole: Object3D | Readonly<Vector3> | undefined;
  private readonly root: Object3D;
  private readonly middle: Object3D;
  private readonly tip: Object3D;
  private readonly origin = new Vector3();
  private readonly joint = new Vector3();
  private readonly end = new Vector3();
  private readonly goal = new Vector3();
  private readonly polePoint = new Vector3();
  private readonly direction = new Vector3();
  private readonly bend = new Vector3();
  private readonly desiredJoint = new Vector3();
  private readonly desiredEnd = new Vector3();
  private readonly from = new Vector3();
  private readonly to = new Vector3();
  private readonly swing = new Quaternion();
  private readonly world = new Quaternion();
  private readonly parentInverse = new Quaternion();
  private readonly desiredRotation = new Quaternion();
  private readonly unregister: () => void;
  private readonly removed: EventListener;
  private destroyed = false;

  constructor(mixer: AnimationMixer, options: TwoBoneIKOptions) {
    this.root = options.root;
    this.middle = options.middle;
    this.tip = options.tip;
    this.weight = options.weight ?? 1;
    this.minBend = options.minBend ?? 0;
    this.maxBend = options.maxBend ?? Math.PI;
    if (
      !Number.isFinite(this.weight) ||
      this.weight < 0 ||
      this.weight > 1 ||
      !Number.isFinite(this.minBend) ||
      !Number.isFinite(this.maxBend) ||
      this.minBend < 0 ||
      this.maxBend > Math.PI ||
      this.minBend > this.maxBend
    )
      throw new RangeError('Invalid IK weight or bend limits.');
    if (this.middle.parent !== this.root || this.tip.parent !== this.middle)
      throw new RangeError('IK requires a direct root/middle/tip hierarchy.');
    this.channels = [
      { target: this.root, path: 'rotation' },
      { target: this.middle, path: 'rotation' },
    ];
    this.removed = () => {
      this.enabled = false;
      this.status = 'invalid-target';
      this.setTarget(undefined);
      this.setPole(undefined);
    };
    this.unregister = mixer.addConstraint(this);
    this.setTarget(options.target);
    this.setPole(options.pole);
  }
  setTarget(target: Object3D | Readonly<Vector3> | undefined): this {
    this.unwatch(this.target);
    this.unwatch(this.pole);
    this.target = target;
    this.watch(target);
    this.watch(this.pole);
    return this;
  }
  setPole(pole: Object3D | Readonly<Vector3> | undefined): this {
    this.unwatch(this.pole);
    this.unwatch(this.target);
    this.pole = pole;
    this.watch(pole);
    this.watch(this.target);
    return this;
  }
  private watch(target: Object3D | Readonly<Vector3> | undefined): void {
    if (target && 'updateWorldMatrix' in target) {
      target.addEventListener('remove', this.removed);
      target.addEventListener('destroy', this.removed);
    }
  }
  private unwatch(target: Object3D | Readonly<Vector3> | undefined): void {
    if (target && 'updateWorldMatrix' in target) {
      target.removeEventListener('remove', this.removed);
      target.removeEventListener('destroy', this.removed);
    }
  }
  private worldPoint(
    target: Object3D | Readonly<Vector3>,
    out: Vector3,
  ): boolean {
    if ('updateWorldMatrix' in target) {
      if (target.destroyed) return false;
      const e = target.updateWorldMatrix().elements;
      out.set(e[12], e[13], e[14]);
    } else out.set(target.x, target.y, target.z);
    return (
      Number.isFinite(out.x) && Number.isFinite(out.y) && Number.isFinite(out.z)
    );
  }
  solve(): void {
    if (!this.enabled || this.destroyed) return;
    if (!Number.isFinite(this.weight) || this.weight < 0 || this.weight > 1)
      throw new RangeError('IK weight must be in [0, 1].');
    if (
      !this.target ||
      !this.worldPoint(this.target, this.goal) ||
      (this.pole && !this.worldPoint(this.pole, this.polePoint))
    ) {
      this.status = 'invalid-target';
      this.enabled = false;
      return;
    }
    if (
      this.middle.parent !== this.root ||
      this.tip.parent !== this.middle ||
      this.root.destroyed ||
      this.middle.destroyed ||
      this.tip.destroyed
    ) {
      this.status = 'invalid-hierarchy';
      this.enabled = false;
      return;
    }
    for (let node: Object3D | undefined = this.tip; node; node = node.parent) {
      const s = node.scale,
        q = node.rotation;
      if (
        !Number.isFinite(s.x) ||
        s.x <= 0 ||
        Math.abs(s.x - s.y) > 1e-6 * s.x ||
        Math.abs(s.x - s.z) > 1e-6 * s.x ||
        !Number.isFinite(s.y) ||
        !Number.isFinite(s.z) ||
        !Number.isFinite(Math.hypot(q.x, q.y, q.z, q.w)) ||
        Math.hypot(q.x, q.y, q.z, q.w) < 1e-12
      ) {
        this.status = 'singular';
        return;
      }
    }
    this.worldPoint(this.root, this.origin);
    this.worldPoint(this.middle, this.joint);
    this.worldPoint(this.tip, this.end);
    const l1 = this.from.copy(this.joint).subtract(this.origin).length();
    const l2 = this.to.copy(this.end).subtract(this.joint).length();
    if (!Number.isFinite(l1 + l2) || l1 < 1e-8 || l2 < 1e-8) {
      this.status = 'singular';
      return;
    }
    this.direction.copy(this.goal).subtract(this.origin);
    const requested = this.direction.length();
    if (requested < 1e-8) {
      this.direction.copy(this.end).subtract(this.origin);
      if (this.direction.length() < 1e-8) this.direction.set(1, 0, 0);
    }
    this.direction.normalize();
    const minimum = Math.sqrt(
      Math.max(0, l1 * l1 + l2 * l2 + 2 * l1 * l2 * Math.cos(this.maxBend)),
    );
    const maximum = Math.sqrt(
      Math.max(0, l1 * l1 + l2 * l2 + 2 * l1 * l2 * Math.cos(this.minBend)),
    );
    const distance = Math.max(
      1e-8,
      Math.max(minimum, Math.min(maximum, requested)),
    );
    this.status = Math.abs(distance - requested) > 1e-6 ? 'clamped' : 'solved';
    this.bend
      .copy(this.pole ? this.polePoint : this.joint)
      .subtract(this.origin);
    const projection = this.bend.dot(this.direction);
    this.bend.set(
      this.bend.x - this.direction.x * projection,
      this.bend.y - this.direction.y * projection,
      this.bend.z - this.direction.z * projection,
    );
    if (this.bend.length() < 1e-8) {
      // Deterministic least-aligned axis also handles a collinear pole and straight bind pose.
      const x = Math.abs(this.direction.x),
        y = Math.abs(this.direction.y),
        z = Math.abs(this.direction.z);
      this.bend.set(
        x <= y && x <= z ? 1 : 0,
        y < x && y <= z ? 1 : 0,
        z < x && z < y ? 1 : 0,
      );
      const dot = this.bend.dot(this.direction);
      this.bend.set(
        this.bend.x - this.direction.x * dot,
        this.bend.y - this.direction.y * dot,
        this.bend.z - this.direction.z * dot,
      );
    }
    this.bend.normalize();
    const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    this.desiredJoint.set(
      this.origin.x + this.direction.x * along + this.bend.x * height,
      this.origin.y + this.direction.y * along + this.bend.y * height,
      this.origin.z + this.direction.z * along + this.bend.z * height,
    );
    this.desiredEnd.set(
      this.origin.x + this.direction.x * distance,
      this.origin.y + this.direction.y * distance,
      this.origin.z + this.direction.z * distance,
    );
    this.from.copy(this.joint).subtract(this.origin);
    this.to.copy(this.desiredJoint).subtract(this.origin);
    this.rotateBone(this.root);
    this.worldPoint(this.middle, this.joint);
    this.worldPoint(this.tip, this.end);
    this.from.copy(this.end).subtract(this.joint);
    this.to.copy(this.desiredEnd).subtract(this.joint);
    this.rotateBone(this.middle);
  }
  private rotateBone(bone: Object3D): void {
    this.from.normalize();
    this.to.normalize();
    const dot = Math.max(-1, Math.min(1, this.from.dot(this.to)));
    if (dot < -0.999999) {
      this.to.copy(this.bend);
      const projection = this.to.dot(this.from);
      this.to.set(
        this.to.x - this.from.x * projection,
        this.to.y - this.from.y * projection,
        this.to.z - this.from.z * projection,
      );
      if (this.to.length() < 1e-8) {
        this.to.set(
          Math.abs(this.from.x) < 0.9 ? 1 : 0,
          Math.abs(this.from.x) < 0.9 ? 0 : 1,
          0,
        );
        this.to.cross(this.from);
      }
      this.to.normalize();
      this.swing.set(this.to.x, this.to.y, this.to.z, 0);
    } else {
      const ax = this.from.x,
        ay = this.from.y,
        az = this.from.z;
      const bx = this.to.x,
        by = this.to.y,
        bz = this.to.z;
      this.swing
        .set(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx, 1 + dot)
        .normalize();
    }
    this.world.set(0, 0, 0, 1);
    for (let node: Object3D | undefined = bone; node; node = node.parent)
      multiplyRotation(node.rotation, this.world, this.world);
    multiplyRotation(this.swing, this.world, this.desiredRotation);
    this.parentInverse.set(0, 0, 0, 1);
    for (let node = bone.parent; node; node = node.parent)
      multiplyRotation(node.rotation, this.parentInverse, this.parentInverse);
    this.parentInverse.set(
      -this.parentInverse.x,
      -this.parentInverse.y,
      -this.parentInverse.z,
      this.parentInverse.w,
    );
    multiplyRotation(
      this.parentInverse,
      this.desiredRotation,
      this.desiredRotation,
    );
    blendRotation(
      bone.rotation,
      this.desiredRotation,
      this.weight,
      bone.rotation,
    );
  }
  destroy(): void {
    if (this.destroyed) return;
    this.enabled = false;
    this.setTarget(undefined);
    this.setPole(undefined);
    this.unregister();
    this.destroyed = true;
  }
}
