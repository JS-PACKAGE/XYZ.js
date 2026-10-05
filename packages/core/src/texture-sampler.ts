export interface TextureSamplerOptions {
  minFilter?: 'nearest' | 'linear';
  magFilter?: 'nearest' | 'linear';
  mipmapFilter?: 'nearest' | 'linear';
  lodMinClamp?: number;
  lodMaxClamp?: number;
  addressModeU?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  addressModeV?: 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
  /** Integer quality request in [1,16]; the platform may use a lower value. */
  maxAnisotropy?: number;
}

export function validateAnisotropy(value: TextureSamplerOptions): void {
  const maximum = value.maxAnisotropy ?? 1;
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 16)
    throw new RangeError(
      'Texture sampler anisotropy must be an integer between 1 and 16.',
    );
  if (
    maximum > 1 &&
    (value.minFilter === 'nearest' ||
      value.magFilter === 'nearest' ||
      value.mipmapFilter === 'nearest')
  )
    throw new RangeError(
      'Anisotropic texture sampling requires linear min, mag and mipmap filters.',
    );
}

export function samplerOptions(
  value: TextureSamplerOptions | undefined,
): Readonly<TextureSamplerOptions> | undefined {
  if (value === undefined) return undefined;
  if (
    (value.minFilter !== undefined &&
      value.minFilter !== 'nearest' &&
      value.minFilter !== 'linear') ||
    (value.magFilter !== undefined &&
      value.magFilter !== 'nearest' &&
      value.magFilter !== 'linear') ||
    (value.mipmapFilter !== undefined &&
      value.mipmapFilter !== 'nearest' &&
      value.mipmapFilter !== 'linear')
  )
    throw new RangeError('Texture sampler filters must be nearest or linear.');
  const lodMin = value.lodMinClamp ?? 0,
    lodMax = value.lodMaxClamp ?? 32;
  if (
    !Number.isFinite(lodMin) ||
    !Number.isFinite(lodMax) ||
    lodMin < 0 ||
    lodMax < lodMin ||
    lodMax > 32
  )
    throw new RangeError(
      'Texture sampler LOD clamps must satisfy 0 <= min <= max <= 32.',
    );
  for (const mode of [value.addressModeU, value.addressModeV])
    if (
      mode !== undefined &&
      mode !== 'clamp-to-edge' &&
      mode !== 'repeat' &&
      mode !== 'mirror-repeat'
    )
      throw new RangeError(
        'Texture sampler address modes must be clamp-to-edge, repeat or mirror-repeat.',
      );
  validateAnisotropy(value);
  return Object.freeze({ ...value });
}
