import {
  PBRMaterial,
  pbrTextureKeys,
  pbrTextureSources,
  type PBRMaterialOptions,
} from './pbr-material.js';
import { materialBaseTexture } from './mesh.js';
import {
  NativeMaterialState,
  type NativeShader3DOptions,
} from './native-material-state.js';
import type { NativeMaterial3D } from './native-material3d.js';

export type NativeMeshMaterial = NativeMaterial3D | NativePBRMaterial;

export interface NativePBRMaterialOptions
  extends PBRMaterialOptions, NativeShader3DOptions {}

/** Native physical-surface hooks; the engine still owns BRDF, passes and bindings. */
export class NativePBRMaterial extends PBRMaterial {
  private readonly state: NativeMaterialState;
  readonly label: string;
  readonly uniforms: Float32Array<ArrayBuffer>;
  override readonly deformationBounds: number | undefined;
  readonly shadowCache: 'dynamic' | 'tracked';

  constructor(options: NativePBRMaterialOptions) {
    super(options);
    this.state = new NativeMaterialState(options, 'NativePBRMaterial');
    this.label = this.state.label;
    this.uniforms = this.state.uniforms;
    this.deformationBounds = this.state.deformationBounds;
    this.shadowCache = this.state.shadowCache;
  }

  get wgsl(): string {
    return this.state.wgsl;
  }
  get glsl(): string {
    return this.state.glsl;
  }
  get destroyed(): boolean {
    return this.state.destroyed;
  }

  setUniforms(values: ArrayLike<number>, offset = 0): void {
    this.state.setUniforms(values, offset);
  }

  validate(): void {
    this.state.validate();
    if (materialBaseTexture(this).destroyed)
      throw new Error(
        'NativePBRMaterial references a destroyed borrowed texture.',
      );
    const sources = pbrTextureSources(this);
    for (const key of pbrTextureKeys)
      if (sources[key]?.destroyed)
        throw new Error(
          'NativePBRMaterial references a destroyed borrowed texture.',
        );
  }

  onDestroy(listener: () => void): () => void {
    return this.state.onDestroy(listener);
  }
  destroy(): void {
    this.state.destroy();
  }
}
