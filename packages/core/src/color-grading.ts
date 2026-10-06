export type ToneMapper = 'none' | 'aces' | 'agx' | 'reinhard' | 'neutral';

export function validatePostNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
    throw new RangeError(`${name} must be finite and fit in Float32.`);
}

/** RGB lattice in .cube order (red changes fastest); uploaded as an RGBA8 strip. */
export class ColorLUT3D {
  readonly strip: Uint8Array;
  constructor(
    readonly size: number,
    values: ArrayLike<number>,
  ) {
    if (!Number.isInteger(size) || size < 16 || size > 64)
      throw new RangeError('LUT size must be an integer in 16..64.');
    if (values.length !== size ** 3 * 3)
      throw new RangeError('LUT must contain size cubed RGB triples.');
    this.strip = new Uint8Array(size ** 3 * 4);
    for (let i = 0; i < size ** 3; i++) {
      for (let c = 0; c < 3; c++) {
        const value = values[i * 3 + c]!;
        if (!Number.isFinite(value) || value < 0 || value > 1)
          throw new RangeError('LUT output components must be in 0..1.');
        // Horizontal blue slices, red within each slice, green in rows.
        const r = i % size,
          g = Math.floor(i / size) % size,
          b = Math.floor(i / size ** 2);
        this.strip[(g * size * size + b * size + r) * 4 + c] = Math.round(
          value * 255,
        );
      }
      const r = i % size,
        g = Math.floor(i / size) % size,
        b = Math.floor(i / size ** 2);
      this.strip[(g * size * size + b * size + r) * 4 + 3] = 255;
    }
  }

  static parseCube(text: string): ColorLUT3D {
    let size = 0;
    const values: number[] = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.split('#')[0]!.trim();
      if (!line || /^TITLE\s/.test(line)) continue;
      const tokens = line.split(/\s+/);
      if (tokens[0] === 'LUT_3D_SIZE') {
        if (size || tokens.length !== 2)
          throw new RangeError('Duplicate or malformed LUT_3D_SIZE.');
        size = Number(tokens[1]);
      } else if (tokens[0] === 'DOMAIN_MIN' || tokens[0] === 'DOMAIN_MAX') {
        const expected = tokens[0] === 'DOMAIN_MIN' ? 0 : 1;
        if (
          tokens.length !== 4 ||
          tokens.slice(1).some((v) => Number(v) !== expected)
        )
          throw new RangeError(
            'Only the normalized 0..1 .cube domain is supported.',
          );
      } else {
        if (tokens.length !== 3)
          throw new RangeError(
            'Unsupported .cube directive or malformed RGB triple.',
          );
        values.push(...tokens.map(Number));
      }
    }
    return new ColorLUT3D(size, values);
  }

  static preset(
    size = 32,
    kind: 'identity' | 'warm' | 'cool' | 'cinematic' = 'identity',
  ): ColorLUT3D {
    if (!['identity', 'warm', 'cool', 'cinematic'].includes(kind))
      throw new RangeError('Unknown LUT preset.');
    if (!Number.isInteger(size) || size < 16 || size > 64)
      throw new RangeError('LUT size must be an integer in 16..64.');
    const values = new Float32Array(size ** 3 * 3);
    for (let b = 0; b < size; b++)
      for (let g = 0; g < size; g++)
        for (let r = 0; r < size; r++) {
          const rgb = [r / (size - 1), g / (size - 1), b / (size - 1)];
          if (kind === 'warm') {
            rgb[0] = Math.min(1, rgb[0]! * 1.08);
            rgb[2] = rgb[2]! * 0.9;
          }
          if (kind === 'cool') {
            rgb[2] = Math.min(1, rgb[2]! * 1.08);
            rgb[0] = rgb[0]! * 0.9;
          }
          if (kind === 'cinematic')
            for (let c = 0; c < 3; c++)
              rgb[c] = Math.max(0, Math.min(1, (rgb[c]! - 0.5) * 1.12 + 0.5));
          values.set(rgb, ((b * size + g) * size + r) * 3);
        }
    return new ColorLUT3D(size, values);
  }
}

export class ColorGradingSettings {
  constructor(
    public lut: ColorLUT3D,
    public strength = 1,
  ) {
    this.validate();
  }
  validate(): void {
    if (!(this.lut instanceof ColorLUT3D))
      throw new TypeError('Color grading requires a ColorLUT3D.');
    validatePostNumber(this.strength, 'Color grading strength');
    if (this.strength < 0 || this.strength > 1)
      throw new RangeError('Color grading strength must be in 0..1.');
  }
}
