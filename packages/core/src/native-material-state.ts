import { nativeMaterial3DLimits } from '../../../src/data/rendering.js';

export interface NativeShader3DOptions {
  /** Native declarations, without entry points or additional resources. */
  readonly wgsl: string;
  readonly glsl: string;
  readonly uniforms?: ArrayLike<number>;
  readonly label?: string;
  /** Maximum final mesh-local displacement; absent disables bounds culling. */
  readonly deformationBounds?: number;
  /** Tracked hooks must depend only on their inputs, uniforms and borrowed maps. */
  shadowCache?: 'dynamic' | 'tracked';
}

/** Shared validation/lifetime for the basic and physical native material facades. */
export class NativeMaterialState {
  readonly wgsl: string;
  readonly glsl: string;
  readonly label: string;
  readonly deformationBounds: number | undefined;
  readonly shadowCache: 'dynamic' | 'tracked';
  readonly uniforms = new Float32Array(nativeMaterial3DLimits.uniformFloats);
  private readonly listeners = new Set<() => void>();
  private disposed = false;

  constructor(
    options: NativeShader3DOptions,
    private readonly kind: string,
  ) {
    if (
      typeof options.wgsl !== 'string' ||
      !options.wgsl.trim() ||
      typeof options.glsl !== 'string' ||
      !options.glsl.trim() ||
      options.wgsl.length > nativeMaterial3DLimits.sourceCharacters ||
      options.glsl.length > nativeMaterial3DLimits.sourceCharacters
    )
      throw new TypeError(
        `${kind} requires bounded WGSL and GLSL native hooks.`,
      );
    if (
      options.deformationBounds !== undefined &&
      (!Number.isFinite(options.deformationBounds) ||
        options.deformationBounds < 0)
    )
      throw new RangeError(
        `${kind} deformationBounds must be finite and nonnegative.`,
      );
    if (
      options.shadowCache !== undefined &&
      options.shadowCache !== 'dynamic' &&
      options.shadowCache !== 'tracked'
    )
      throw new TypeError(`${kind} shadowCache must be dynamic or tracked.`);
    this.wgsl = options.wgsl;
    this.glsl = options.glsl;
    this.label = options.label ?? kind;
    this.deformationBounds = options.deformationBounds;
    this.shadowCache = options.shadowCache ?? 'dynamic';
    if (options.uniforms) this.setUniforms(options.uniforms);
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  setUniforms(values: ArrayLike<number>, offset = 0): void {
    if (this.disposed) throw new Error(`${this.kind} is destroyed.`);
    if (
      !Number.isSafeInteger(values.length) ||
      values.length < 0 ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset + values.length > this.uniforms.length
    )
      throw new RangeError(`${this.kind} uniform update exceeds 64 floats.`);
    for (let i = 0; i < values.length; i++)
      if (
        !Number.isFinite(values[i]) ||
        !Number.isFinite(Math.fround(values[i]))
      )
        throw new RangeError(`${this.kind} uniforms must fit finite Float32.`);
    this.uniforms.set(values, offset);
  }

  validate(): void {
    if (this.disposed) throw new Error(`${this.kind} is destroyed.`);
    for (const value of this.uniforms)
      if (!Number.isFinite(value))
        throw new RangeError(`${this.kind} uniforms must be finite.`);
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
      throw new AggregateError(errors, `${this.kind} cleanup failed.`);
  }
}
