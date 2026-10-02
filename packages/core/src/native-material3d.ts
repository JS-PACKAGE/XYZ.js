import { Texture } from '../../assets/src/index.js';
import { TextureMaterial, type TextureMaterialOptions } from './mesh.js';
import { nativeMaterial3DLimits } from '../../../src/data/rendering.js';

export interface NativeMaterial3DOptions extends TextureMaterialOptions {
  /** Native declarations defining xyzDeform and xyzSurface. No entry points or transpilation. */
  readonly wgsl: string;
  readonly glsl: string;
  readonly uniforms?: ArrayLike<number>;
  /** Four borrowed maps, available as xyzMap0..3 and xyzSampler0..3 (WGSL). */
  readonly textures?: readonly Texture[];
  readonly label?: string;
  /** Maximum final mesh-local vertex displacement; absent means unbounded and disables bounds culling. */
  readonly deformationBounds?: number;
}

/** Per-mesh native shader hooks; resources remain caller-owned, including on loss. */
export class NativeMaterial3D extends TextureMaterial {
  private readonly wgslSource: string;
  private readonly glslSource: string;
  readonly label: string;
  private readonly borrowedMaps: readonly Texture[];
  override readonly deformationBounds: number | undefined;
  readonly uniforms = new Float32Array(nativeMaterial3DLimits.uniformFloats);
  private readonly listeners = new Set<() => void>();
  private disposed = false;

  constructor(options: NativeMaterial3DOptions) {
    super(options);
    if (
      typeof options.wgsl !== 'string' ||
      !options.wgsl.trim() ||
      typeof options.glsl !== 'string' ||
      !options.glsl.trim() ||
      options.wgsl.length > nativeMaterial3DLimits.sourceCharacters ||
      options.glsl.length > nativeMaterial3DLimits.sourceCharacters
    )
      throw new TypeError(
        'NativeMaterial3D requires bounded WGSL and GLSL native hooks.',
      );
    const textures = options.textures ?? [];
    if (
      textures.length > nativeMaterial3DLimits.textures ||
      textures.some(
        (texture) => !(texture instanceof Texture) || texture.destroyed,
      )
    )
      throw new TypeError(
        'NativeMaterial3D accepts at most four live borrowed textures.',
      );
    if (
      options.deformationBounds !== undefined &&
      (!Number.isFinite(options.deformationBounds) ||
        options.deformationBounds < 0)
    )
      throw new RangeError(
        'NativeMaterial3D deformationBounds must be finite and nonnegative.',
      );
    this.deformationBounds = options.deformationBounds;
    this.wgslSource = options.wgsl;
    this.glslSource = options.glsl;
    this.label = options.label ?? 'NativeMaterial3D';
    this.borrowedMaps = Object.freeze([...textures]);
    if (options.uniforms) this.setUniforms(options.uniforms);
  }

  get wgsl(): string {
    return this.wgslSource;
  }
  /** GLSL may branch on XYZ_VERTEX / XYZ_FRAGMENT / XYZ_SHADOW for stage-only intrinsics. */
  get glsl(): string {
    return this.glslSource;
  }
  get textures(): readonly Texture[] {
    return this.borrowedMaps;
  }
  get destroyed(): boolean {
    return this.disposed;
  }

  setUniforms(values: ArrayLike<number>, offset = 0): void {
    if (this.disposed) throw new Error('NativeMaterial3D is destroyed.');
    if (
      !Number.isSafeInteger(values.length) ||
      values.length < 0 ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset + values.length > this.uniforms.length
    )
      throw new RangeError(
        'NativeMaterial3D uniform update exceeds 64 floats.',
      );
    for (let i = 0; i < values.length; i++)
      if (
        !Number.isFinite(values[i]) ||
        !Number.isFinite(Math.fround(values[i]))
      )
        throw new RangeError(
          'NativeMaterial3D uniforms must fit finite Float32.',
        );
    this.uniforms.set(values, offset);
  }
  /** Validate the public mutable uniform view before native preparation/submission. */
  validate(): void {
    if (this.disposed) throw new Error('NativeMaterial3D is destroyed.');
    if (
      this.texture.destroyed ||
      this.textures.some((texture) => texture.destroyed)
    )
      throw new Error(
        'NativeMaterial3D references a destroyed borrowed texture.',
      );
    for (const value of this.uniforms)
      if (!Number.isFinite(value))
        throw new RangeError('NativeMaterial3D uniforms must be finite.');
  }

  onDestroy(listener: () => void): () => void {
    if (this.disposed) {
      listener();
      return () => {};
    }
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    let errors: unknown[] | undefined;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        (errors ??= []).push(error);
      }
    }
    this.listeners.clear();
    if (errors)
      throw new AggregateError(errors, 'NativeMaterial3D cleanup failed.');
  }
}
