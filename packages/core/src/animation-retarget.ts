import { Quaternion } from '../../math/src/index.js';
import { AnimationClip, KeyframeTrack } from './animation.js';
import { multiplyRotation } from './animation-pose.js';
import type { Object3D } from './object3d.js';

export interface AnimationBindTransform {
  translation: readonly number[];
  rotation: readonly number[];
  scale: readonly number[];
}
export interface AnimationRetargetMapping {
  source: Object3D;
  target: Object3D;
  /** Local bind transforms, explicitly supplied rather than read from an animated pose. */
  sourceBind: AnimationBindTransform;
  targetBind: AnimationBindTransform;
  /** Non-root default is the target/source bind offset length ratio; zero locks translation. */
  translationScale?: number;
}
export interface AnimationRetargetOptions {
  sourceRoot: Object3D;
  targetRoot: Object3D;
  /** Root displacement scale is explicit, independent of character scene placement. Default 1. */
  rootTranslationScale?: number;
}
interface BindPose {
  translation: Float64Array;
  rotation: Quaternion;
  scale: number;
}
interface Mapping {
  source: Object3D;
  target: Object3D;
  sourceParent: Object3D | undefined;
  targetParent: Object3D | undefined;
  sourceBind: BindPose;
  targetBind: BindPose;
  translationScale: number;
  sourceWorld: Quaternion;
  targetWorld: Quaternion;
  left: Quaternion;
  right: Quaternion;
  vectorMatrix: Float64Array;
}
function bindPose(value: AnimationBindTransform): BindPose {
  if (
    value.translation.length !== 3 ||
    value.rotation.length !== 4 ||
    value.scale.length !== 3 ||
    !value.translation.every(Number.isFinite) ||
    !value.rotation.every(Number.isFinite) ||
    !value.scale.every(Number.isFinite)
  )
    throw new RangeError(
      'Retarget bind pose requires finite local TRS values.',
    );
  const s = value.scale;
  if (s[0] <= 0 || s[0] !== s[1] || s[0] !== s[2])
    throw new RangeError(
      'Retarget bind scales must be positive and uniform; shear/reflection are unsupported.',
    );
  const q = value.rotation;
  const length = Math.hypot(q[0], q[1], q[2], q[3]);
  if (!Number.isFinite(length) || length === 0)
    throw new RangeError(
      'Retarget bind quaternion must have a finite nonzero length.',
    );
  return {
    translation: Float64Array.from(value.translation),
    rotation: new Quaternion(q[0], q[1], q[2], q[3]).normalize(),
    scale: s[0],
  };
}
/** Linear quaternion map A*q*B also transforms cubic derivatives, without normalizing tangents. */
function transformRotation(
  a: Quaternion,
  b: Quaternion,
  values: Float32Array,
  offset: number,
  out: Float64Array,
): void {
  const x = values[offset],
    y = values[offset + 1],
    z = values[offset + 2],
    w = values[offset + 3];
  const lx = a.w * x + a.x * w + a.y * z - a.z * y;
  const ly = a.w * y - a.x * z + a.y * w + a.z * x;
  const lz = a.w * z + a.x * y - a.y * x + a.z * w;
  const lw = a.w * w - a.x * x - a.y * y - a.z * z;
  out[0] = lw * b.x + lx * b.w + ly * b.z - lz * b.y;
  out[1] = lw * b.y - lx * b.z + ly * b.w + lz * b.x;
  out[2] = lw * b.z + lx * b.y - ly * b.x + lz * b.w;
  out[3] = lw * b.w - lx * b.x - ly * b.y - lz * b.z;
}

function validateScaleTrack(track: KeyframeTrack): void {
  for (let i = 0; i < track.values.length; i += 3) {
    if (
      track.values[i] !== track.values[i + 1] ||
      track.values[i] !== track.values[i + 2]
    )
      throw new RangeError('Retarget supports uniform animated scale only.');
    const isValue = track.interpolation !== 'CUBICSPLINE' || (i / 3) % 3 === 1;
    if (isValue && track.values[i] <= 0)
      throw new RangeError('Retarget animated scale must stay positive.');
  }
  if (track.interpolation !== 'CUBICSPLINE') return;
  for (let key = 0; key + 1 < track.times.length; key++) {
    const dt = track.times[key + 1] - track.times[key];
    const offset = key * 9;
    const p = track.values[offset + 3],
      q = track.values[offset + 12];
    const u = track.values[offset + 6] * dt,
      v = track.values[offset + 9] * dt;
    const a = 2 * p - 2 * q + u + v;
    const b = -3 * p + 3 * q - 2 * u - v;
    const c = u;
    const discriminant = 4 * b * b - 12 * a * c;
    if (discriminant < 0) continue;
    const squareRoot = Math.sqrt(discriminant);
    for (let side = -1; side <= 1; side += 2) {
      const t =
        a === 0
          ? b === 0
            ? -1
            : -c / (2 * b)
          : (-2 * b + side * squareRoot) / (6 * a);
      if (t > 0 && t < 1 && ((a * t + b) * t + c) * t + p <= 0)
        throw new RangeError(
          'Retarget cubic scale crosses a singular or reflected transform.',
        );
    }
  }
}

/**
 * Explicit skeletal-space rest correction. Offline baking and runtime clip adaptation use the
 * same immutable output clip, which plays through AnimationMixer (including skinning/root motion).
 * Every animated source must be mapped; direct mapped parents must correspond. Scene placement
 * outside the two declared skeleton roots is intentionally not part of their bind space.
 */
export class AnimationRetargeter {
  private readonly mappings = new Map<Object3D, Mapping>();
  private readonly sourceRoot: Object3D;
  private readonly targetRoot: Object3D;
  constructor(
    entries: readonly AnimationRetargetMapping[],
    options: AnimationRetargetOptions,
  ) {
    this.sourceRoot = options.sourceRoot;
    this.targetRoot = options.targetRoot;
    const rootScale = options.rootTranslationScale ?? 1;
    if (!Number.isFinite(rootScale) || rootScale < 0)
      throw new RangeError(
        'Root translation scale must be nonnegative and finite.',
      );
    const targets = new Set<Object3D>();
    for (const entry of entries) {
      if (
        entry.source.destroyed ||
        entry.target.destroyed ||
        this.mappings.has(entry.source) ||
        targets.has(entry.target)
      )
        throw new RangeError(
          'Retarget nodes must be live and mapped one-to-one.',
        );
      const sourceBind = bindPose(entry.sourceBind),
        targetBind = bindPose(entry.targetBind);
      const s = sourceBind.translation,
        t = targetBind.translation;
      const sourceLength = Math.hypot(s[0], s[1], s[2]),
        targetLength = Math.hypot(t[0], t[1], t[2]);
      let ratio = entry.translationScale;
      if (ratio === undefined) {
        if (entry.source === options.sourceRoot) ratio = rootScale;
        else if (sourceLength > 0) ratio = targetLength / sourceLength;
        else if (targetLength === 0) ratio = 1;
        else
          throw new RangeError(
            'Zero source bone offset requires an explicit translation scale.',
          );
      }
      if (!Number.isFinite(ratio) || ratio < 0)
        throw new RangeError(
          'Translation scale must be nonnegative and finite.',
        );
      targets.add(entry.target);
      this.mappings.set(entry.source, {
        source: entry.source,
        target: entry.target,
        sourceParent: entry.source.parent,
        targetParent: entry.target.parent,
        sourceBind,
        targetBind,
        translationScale: ratio,
        sourceWorld: new Quaternion(),
        targetWorld: new Quaternion(),
        left: new Quaternion(),
        right: new Quaternion(),
        vectorMatrix: new Float64Array(9),
      });
    }
    const root = this.mappings.get(options.sourceRoot);
    if (!root || root.target !== options.targetRoot)
      throw new RangeError(
        'Explicit source and target roots must be mapped together.',
      );
    this.validateHierarchy();
    const completed = new Set<Mapping>();
    const prepare = (mapping: Mapping): void => {
      if (completed.has(mapping)) return;
      const parent =
        mapping.source === this.sourceRoot
          ? undefined
          : this.mappings.get(mapping.sourceParent!);
      if (parent) {
        prepare(parent);
        multiplyRotation(
          parent.sourceWorld,
          mapping.sourceBind.rotation,
          mapping.sourceWorld,
        );
        multiplyRotation(
          parent.targetWorld,
          mapping.targetBind.rotation,
          mapping.targetWorld,
        );
        mapping.left.set(
          -parent.targetWorld.x,
          -parent.targetWorld.y,
          -parent.targetWorld.z,
          parent.targetWorld.w,
        );
        multiplyRotation(mapping.left, parent.sourceWorld, mapping.left);
      } else {
        mapping.sourceWorld.copy(mapping.sourceBind.rotation);
        mapping.targetWorld.copy(mapping.targetBind.rotation);
      }
      mapping.right.set(
        -mapping.sourceWorld.x,
        -mapping.sourceWorld.y,
        -mapping.sourceWorld.z,
        mapping.sourceWorld.w,
      );
      multiplyRotation(mapping.right, mapping.targetWorld, mapping.right);
      const q = mapping.left,
        m = mapping.vectorMatrix;
      m[0] = 1 - 2 * (q.y * q.y + q.z * q.z);
      m[1] = 2 * (q.x * q.y - q.z * q.w);
      m[2] = 2 * (q.x * q.z + q.y * q.w);
      m[3] = 2 * (q.x * q.y + q.z * q.w);
      m[4] = 1 - 2 * (q.x * q.x + q.z * q.z);
      m[5] = 2 * (q.y * q.z - q.x * q.w);
      m[6] = 2 * (q.x * q.z - q.y * q.w);
      m[7] = 2 * (q.y * q.z + q.x * q.w);
      m[8] = 1 - 2 * (q.x * q.x + q.y * q.y);
      completed.add(mapping);
    };
    for (const mapping of this.mappings.values()) prepare(mapping);
  }
  private validateHierarchy(): void {
    for (const mapping of this.mappings.values()) {
      if (
        mapping.source.destroyed ||
        mapping.target.destroyed ||
        mapping.source.parent !== mapping.sourceParent ||
        mapping.target.parent !== mapping.targetParent
      )
        throw new RangeError(
          'Retarget hierarchy changed or a borrowed node was destroyed.',
        );
      if (mapping.source === this.sourceRoot) {
        if (
          mapping.target !== this.targetRoot ||
          this.mappings.has(mapping.sourceParent!)
        )
          throw new RangeError(
            'Retarget root must be the top of the mapped hierarchy.',
          );
      } else {
        const parent = this.mappings.get(mapping.sourceParent!);
        if (!parent || parent.target !== mapping.targetParent)
          throw new RangeError(
            'Retarget requires corresponding direct mapped parents.',
          );
      }
    }
  }
  retarget(clip: AnimationClip, name = clip.name): AnimationClip {
    this.validateHierarchy();
    // Preflight the entire clip before creating any result; never touch either skeleton pose.
    const channels = new Map<Object3D, Set<string>>();
    for (const track of clip.tracks) {
      const mapping = this.mappings.get(track.target as Object3D);
      if (!mapping || track.path === 'weights')
        throw new RangeError(
          'Every retarget track must address an explicitly mapped TRS node.',
        );
      let paths = channels.get(mapping.target);
      if (!paths) channels.set(mapping.target, (paths = new Set()));
      if (paths.has(track.path))
        throw new RangeError('Duplicate retarget animation channel.');
      paths.add(track.path);
      if (track.path === 'scale') validateScaleTrack(track);
    }
    const tracks: KeyframeTrack[] = [];
    const rotation = new Float64Array(4);
    for (const track of clip.tracks) {
      const mapping = this.mappings.get(track.target as Object3D)!;
      const values = new Float32Array(track.values.length);
      for (let i = 0; i < values.length; i += track.size) {
        const tangent =
          track.interpolation === 'CUBICSPLINE' && (i / track.size) % 3 !== 1;
        if (track.path === 'rotation') {
          transformRotation(
            mapping.left,
            mapping.right,
            track.values,
            i,
            rotation,
          );
          values.set(rotation, i);
        } else if (track.path === 'scale') {
          const ratio = mapping.targetBind.scale / mapping.sourceBind.scale;
          for (let j = 0; j < 3; j++)
            values[i + j] = track.values[i + j] * ratio;
        } else {
          const s = mapping.sourceBind.translation,
            t = mapping.targetBind.translation,
            m = mapping.vectorMatrix;
          const x = track.values[i] - (tangent ? 0 : s[0]);
          const y = track.values[i + 1] - (tangent ? 0 : s[1]);
          const z = track.values[i + 2] - (tangent ? 0 : s[2]);
          const ratio = mapping.translationScale;
          values[i] =
            (m[0] * x + m[1] * y + m[2] * z) * ratio + (tangent ? 0 : t[0]);
          values[i + 1] =
            (m[3] * x + m[4] * y + m[5] * z) * ratio + (tangent ? 0 : t[1]);
          values[i + 2] =
            (m[6] * x + m[7] * y + m[8] * z) * ratio + (tangent ? 0 : t[2]);
        }
      }
      const result = new KeyframeTrack(
        mapping.target,
        track.path,
        track.times,
        values,
        track.interpolation,
      );
      if (result.path === 'scale') validateScaleTrack(result);
      tracks.push(result);
    }
    return new AnimationClip(name, tracks);
  }
}
