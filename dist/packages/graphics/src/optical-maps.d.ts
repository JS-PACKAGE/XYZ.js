import type { MaterialTexture } from '../../assets/src/texture2d.js';
import type { TextureSamplerOptions } from '../../core/src/texture-sampler.js';
/** A two-layer array keeps transmission + thickness inside the 16-slot baseline.
 * Native texels are flattened into compact square layers without resampling;
 * shader texel addressing preserves independent filtering and wrap modes. */
export declare function fillOpticalMapSettings(data: Float32Array, offset: number, texture: MaterialTexture | undefined, sampler: TextureSamplerOptions | undefined, maxAnisotropy?: number): void;
