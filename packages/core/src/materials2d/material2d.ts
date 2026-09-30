import { GraphicsError } from '../../../graphics/src/errors.js';
import { materials2dLimits } from '../../../../src/data/materials2d.js';

export interface NativeEffect2DOptions {
  wgsl: string;
  glsl: string;
  uniforms?: readonly number[];
}

class NativeEffect2D extends EventTarget {
  private readonly wgslSource: string;
  private readonly glslSource: string;
  private disposed = false;
  readonly uniforms = new Float32Array(materials2dLimits.uniformFloats);

  constructor(options: NativeEffect2DOptions) {
    super();
    for (const language of ['wgsl', 'glsl'] as const) {
      const source = options[language];
      if (
        typeof source !== 'string' ||
        !source.trim() ||
        source.length > materials2dLimits.sourceCharacters
      )
        throw new GraphicsError(
          `${language} effect source must be nonempty and at most ${materials2dLimits.sourceCharacters} characters.`,
        );
    }
    this.wgslSource = options.wgsl;
    this.glslSource = options.glsl;
    if (options.uniforms) this.setUniforms(options.uniforms);
  }

  get wgsl(): string {
    return this.wgslSource;
  }
  get glsl(): string {
    return this.glslSource;
  }
  get destroyed(): boolean {
    return this.disposed;
  }

  setUniforms(values: readonly number[]): void {
    if (this.disposed)
      throw new GraphicsError('Cannot update a destroyed 2D effect.');
    if (
      values.length > this.uniforms.length ||
      values.some(
        (value) =>
          !Number.isFinite(value) || !Number.isFinite(Math.fround(value)),
      )
    )
      throw new GraphicsError(
        `2D effects accept at most ${this.uniforms.length} finite float uniforms.`,
      );
    this.uniforms.fill(0);
    this.uniforms.set(values);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dispatchEvent(new Event('destroy'));
  }
}

/** Native fragment effect on one Sprite's premultiplied sampled color. */
export class Material2D extends NativeEffect2D {}

/** Native fragment effect on the transparent world-2D plus HUD layer. */
export class PostProcessor2D extends NativeEffect2D {}

export function validateEffect2D(effect: Material2D | PostProcessor2D): void {
  if (effect.destroyed)
    throw new GraphicsError('Cannot use a destroyed 2D effect.');
  for (const value of effect.uniforms) {
    if (!Number.isFinite(value))
      throw new GraphicsError('2D effect uniforms must remain finite.');
  }
}
