import { Texture } from '../../assets/src/index.js';
import {
  CanvasTexture2D,
  type MaterialTexture,
} from '../../assets/src/texture2d.js';
import { TextureMaterial, type TextureMaterialOptions } from './mesh.js';
import { nativeMaterial3DLimits } from '../../../src/data/rendering.js';
import {
  NativeMaterialState,
  type NativeShader3DOptions,
} from './native-material-state.js';
import { NativePBRMaterial } from './native-pbr-material.js';

const nativeSourceRegistry = new WeakMap<object, readonly MaterialTexture[]>();
const emptyNativeSources: readonly MaterialTexture[] = Object.freeze([]);
/** Effective maps (canvas/video overrides applied) that renderers bind. */
export function nativeMaterialSources(
  material: NativeMaterial3D | NativePBRMaterial,
): readonly MaterialTexture[] {
  return nativeSourceRegistry.get(material) ?? emptyNativeSources;
}

export interface NativeMaterial3DOptions
  extends TextureMaterialOptions, NativeShader3DOptions {
  /** Four borrowed maps, available as xyzMap0..3 and xyzSampler0..3 (WGSL). */
  readonly textures?: readonly Texture[];
  /** Additive per-index canvas/video overrides for `textures` (or extra maps when absent). */
  readonly textureSources?: readonly MaterialTexture[];
}

/** Per-mesh native shader hooks; resources remain caller-owned, including on loss. */
export class NativeMaterial3D extends TextureMaterial {
  private readonly state: NativeMaterialState;
  readonly label: string;
  private readonly borrowedMaps: readonly Texture[];
  override readonly deformationBounds: number | undefined;
  readonly uniforms: Float32Array;
  readonly shadowCache: 'dynamic' | 'tracked';

  constructor(options: NativeMaterial3DOptions) {
    super(options);
    this.state = new NativeMaterialState(options, 'NativeMaterial3D');
    this.label = this.state.label;
    this.deformationBounds = this.state.deformationBounds;
    this.uniforms = this.state.uniforms;
    this.shadowCache = this.state.shadowCache;
    const textures = options.textures ?? [];
    const overrides = options.textureSources ?? [];
    const count = Math.max(textures.length, overrides.length);
    const effective: MaterialTexture[] = [];
    for (let i = 0; i < count; i++) {
      const texture = overrides[i] ?? textures[i];
      if (
        texture === undefined ||
        (!(texture instanceof Texture) &&
          !(texture instanceof CanvasTexture2D)) ||
        texture.destroyed
      )
        throw new TypeError(
          'NativeMaterial3D accepts at most four live borrowed textures.',
        );
      effective.push(texture);
    }
    if (
      count > nativeMaterial3DLimits.textures ||
      textures.some(
        (texture) => !(texture instanceof Texture) || texture.destroyed,
      )
    )
      throw new TypeError(
        'NativeMaterial3D accepts at most four live borrowed textures.',
      );
    this.borrowedMaps = Object.freeze([...textures]);
    nativeSourceRegistry.set(this, Object.freeze(effective));
  }

  get wgsl(): string {
    return this.state.wgsl;
  }
  /** GLSL may branch on XYZ_VERTEX / XYZ_FRAGMENT / XYZ_SHADOW for stage-only intrinsics. */
  get glsl(): string {
    return this.state.glsl;
  }
  get textures(): readonly Texture[] {
    return this.borrowedMaps;
  }
  get destroyed(): boolean {
    return this.state.destroyed;
  }

  setUniforms(values: ArrayLike<number>, offset = 0): void {
    this.state.setUniforms(values, offset);
  }
  /** Validate the public mutable uniform view before native preparation/submission. */
  validate(): void {
    this.state.validate();
    if (
      this.texture.destroyed ||
      (nativeSourceRegistry.get(this) ?? []).some(
        (texture) => texture.destroyed,
      )
    )
      throw new Error(
        'NativeMaterial3D references a destroyed borrowed texture.',
      );
  }

  onDestroy(listener: () => void): () => void {
    return this.state.onDestroy(listener);
  }

  destroy(): void {
    this.state.destroy();
  }
}

export function isNativeMaterial3D(
  material: object,
): material is NativeMaterial3D | NativePBRMaterial {
  return (
    material instanceof NativeMaterial3D ||
    material instanceof NativePBRMaterial
  );
}

export type NativeMeshMaterial = NativeMaterial3D | NativePBRMaterial;
