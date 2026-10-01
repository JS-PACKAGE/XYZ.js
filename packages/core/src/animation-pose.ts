import { Quaternion } from '../../math/src/index.js';
import type { AnimationPath, KeyframeTrack } from './animation.js';
import type { Object3D } from './object3d.js';
import { MorphWeights } from './morph.js';

export type AnimationTarget = Object3D | MorphWeights;
export interface AnimationMaskEntry {
  target: AnimationTarget;
  /** Omitted paths includes every channel on this target. */
  paths?: readonly AnimationPath[];
  weight?: number;
}

/** An explicit allow-list of borrowed bones/targets and property channels. */
export class AnimationMask {
  private readonly entries = new Map<
    AnimationTarget,
    Map<AnimationPath, number>
  >();
  constructor(entries: readonly AnimationMaskEntry[]) {
    for (const entry of entries) {
      const weight = entry.weight ?? 1;
      if (!Number.isFinite(weight) || weight < 0 || weight > 1)
        throw new RangeError('Mask weight must be in [0, 1].');
      let paths = this.entries.get(entry.target);
      if (!paths) this.entries.set(entry.target, (paths = new Map()));
      for (const path of entry.paths ?? [
        'translation',
        'rotation',
        'scale',
        'weights',
      ])
        paths.set(path, weight);
    }
  }
  weight(target: AnimationTarget, path: AnimationPath): number {
    return this.entries.get(target)?.get(path) ?? 0;
  }
}

export interface AnimationReferenceEntry {
  target: AnimationTarget;
  translation?: readonly number[];
  rotation?: readonly number[];
  scale?: readonly number[];
  weights?: readonly number[];
}

/** Immutable values of an explicitly supplied local reference pose; targets remain borrowed. */
export class AnimationReferencePose {
  private readonly entries = new Map<
    AnimationTarget,
    Map<AnimationPath, Float64Array>
  >();
  constructor(entries: readonly AnimationReferenceEntry[]) {
    for (const entry of entries) {
      const paths = new Map<AnimationPath, Float64Array>();
      for (const path of [
        'translation',
        'rotation',
        'scale',
        'weights',
      ] as const) {
        const values = entry[path];
        if (!values) continue;
        const size =
          path === 'rotation'
            ? 4
            : path === 'weights'
              ? entry.target instanceof MorphWeights
                ? entry.target.count
                : 0
              : 3;
        if (
          !size ||
          values.length !== size ||
          values.some((value) => !Number.isFinite(value))
        )
          throw new RangeError('Invalid reference pose channel.');
        const copy = Float64Array.from(values);
        if (path === 'scale' && copy.some((value) => value === 0))
          throw new RangeError('Additive reference scale cannot be zero.');
        if (path === 'rotation') {
          const length = Math.hypot(...values);
          if (!length)
            throw new RangeError('Reference quaternion cannot be zero.');
          for (let i = 0; i < 4; i++) copy[i] /= length;
        }
        paths.set(path, copy);
      }
      this.entries.set(entry.target, paths);
    }
  }
  /** @internal Validated once when an action adopts this reference. */
  channel(track: KeyframeTrack): Float64Array {
    const value = this.entries.get(track.target)?.get(track.path);
    if (!value)
      throw new RangeError(
        'Additive track is absent from the explicit reference pose.',
      );
    return value;
  }
}

/** @internal Hamilton product, with alias-safe scalar reads. */
export function multiplyRotation(
  a: Quaternion,
  b: Quaternion,
  out: Quaternion,
): void {
  const ax = a.x,
    ay = a.y,
    az = a.z,
    aw = a.w;
  const bx = b.x,
    by = b.y,
    bz = b.z,
    bw = b.w;
  out
    .set(
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by - ax * bz + ay * bw + az * bx,
      aw * bz + ax * by - ay * bx + az * bw,
      aw * bw - ax * bx - ay * by - az * bz,
    )
    .normalize();
}

/** @internal Shortest-arc spherical blend, including antipodal representations. */
export function blendRotation(
  a: Quaternion,
  b: Quaternion,
  weight: number,
  out: Quaternion,
): void {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  const side = dot < 0 ? -1 : 1;
  dot = Math.min(1, Math.abs(dot));
  let wa = 1 - weight,
    wb = weight;
  if (dot < 0.9995) {
    const angle = Math.acos(dot),
      sine = Math.sin(angle);
    wa = Math.sin((1 - weight) * angle) / sine;
    wb = Math.sin(weight * angle) / sine;
  }
  out
    .set(
      wa * a.x + wb * side * b.x,
      wa * a.y + wb * side * b.y,
      wa * a.z + wb * side * b.z,
      wa * a.w + wb * side * b.w,
    )
    .normalize();
}

export interface AnimationPoseChannel {
  target: AnimationTarget;
  path: AnimationPath;
}

/** @internal Reusable base/output pair prevents held additive/constraint poses accumulating. */
export class AnimationPoseOverlay {
  private readonly base: Float64Array;
  private readonly output: Float64Array;
  private readonly scratch: Float64Array;
  captured = false;
  private applied = false;
  constructor(
    readonly target: AnimationTarget,
    readonly path: AnimationPath,
  ) {
    const size =
      target instanceof MorphWeights
        ? target.count
        : path === 'rotation'
          ? 4
          : 3;
    this.base = new Float64Array(size);
    this.output = new Float64Array(size);
    this.scratch = new Float64Array(size);
  }
  private read(out: Float64Array): void {
    if (this.target instanceof MorphWeights) {
      for (let i = 0; i < out.length; i++) out[i] = this.target.get(i);
    } else if (this.path === 'rotation') {
      const q = this.target.rotation;
      out[0] = q.x;
      out[1] = q.y;
      out[2] = q.z;
      out[3] = q.w;
    } else {
      const v =
        this.path === 'translation' ? this.target.position : this.target.scale;
      out[0] = v.x;
      out[1] = v.y;
      out[2] = v.z;
    }
  }
  restore(): void {
    if (this.applied) {
      this.read(this.scratch);
      let unchanged = true;
      for (let i = 0; i < this.output.length; i++)
        if (this.output[i] !== this.scratch[i]) unchanged = false;
      if (unchanged) {
        if (this.target instanceof MorphWeights) {
          for (let i = 0; i < this.base.length; i++)
            this.target.set(i, this.base[i]);
        } else if (this.path === 'rotation')
          this.target.rotation.set(
            this.base[0],
            this.base[1],
            this.base[2],
            this.base[3],
          );
        else
          (this.path === 'translation'
            ? this.target.position
            : this.target.scale
          ).set(this.base[0], this.base[1], this.base[2]);
      }
    }
    this.applied = this.captured = false;
  }
  capture(): void {
    if (this.captured) {
      if (!this.applied) return;
      this.read(this.scratch);
      let unchanged = true;
      for (let i = 0; i < this.output.length; i++)
        if (this.output[i] !== this.scratch[i]) unchanged = false;
      if (unchanged) return;
      // A callback's external edit becomes the base for any later owned overlay writes.
      this.base.set(this.scratch);
      this.applied = false;
      return;
    }
    this.read(this.base);
    this.captured = true;
  }
  seal(): void {
    if (!this.captured) return;
    this.read(this.output);
    this.applied = true;
  }
}
