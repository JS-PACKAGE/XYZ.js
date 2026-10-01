import type { Texture } from '../../assets/src/index.js';
import type { TextureSamplerOptions } from '../../core/src/pbr-material.js';

/** A two-layer array keeps transmission + thickness inside the 16-slot baseline.
 * Native texels are flattened into compact square layers without resampling;
 * shader texel addressing preserves independent filtering and wrap modes. */
export function fillOpticalMapSettings(
  data: Float32Array,
  offset: number,
  texture: Texture | undefined,
  sampler: TextureSamplerOptions | undefined,
): void {
  data[offset] = texture?.width ?? 0;
  data[offset + 1] = texture?.height ?? 0;
  const u =
    sampler?.addressModeU === 'repeat'
      ? 1
      : sampler?.addressModeU === 'mirror-repeat'
        ? 2
        : 0;
  const v =
    sampler?.addressModeV === 'repeat'
      ? 1
      : sampler?.addressModeV === 'mirror-repeat'
        ? 2
        : 0;
  data[offset + 2] = u + v * 3;
  data[offset + 3] =
    (sampler?.minFilter === 'nearest' ? 0 : 1) +
    (sampler?.magFilter === 'nearest' ? 0 : 2);
}
