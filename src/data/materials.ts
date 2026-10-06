export const proceduralMaterialLimits = Object.freeze({
  minSize: 32,
  maxSize: 1024,
  defaultSize: 256,
  defaultSeed: 1,
});

/** Base colors are authored in sRGB; relief is measured in UV units. */
export const proceduralMaterialPresets = Object.freeze({
  wood: Object.freeze({
    dark: [65, 30, 13] as const,
    light: [188, 120, 57] as const,
    roughness: 0.62,
    relief: 0.012,
  }),
  brick: Object.freeze({
    dark: [109, 43, 29] as const,
    light: [195, 98, 65] as const,
    roughness: 0.87,
    relief: 0.025,
  }),
  stone: Object.freeze({
    dark: [66, 72, 73] as const,
    light: [169, 173, 164] as const,
    roughness: 0.88,
    relief: 0.035,
  }),
  metal: Object.freeze({
    dark: [96, 110, 120] as const,
    light: [192, 201, 208] as const,
    roughness: 0.3,
    relief: 0.002,
  }),
  fabric: Object.freeze({
    dark: [23, 46, 69] as const,
    light: [93, 136, 163] as const,
    roughness: 0.93,
    relief: 0.006,
  }),
  marble: Object.freeze({
    dark: [58, 70, 82] as const,
    light: [232, 231, 217] as const,
    roughness: 0.23,
    relief: 0.003,
  }),
  concrete: Object.freeze({
    dark: [78, 80, 82] as const,
    light: [176, 176, 170] as const,
    roughness: 0.78,
    relief: 0.008,
  }),
  tiles: Object.freeze({
    dark: [168, 92, 58] as const,
    light: [236, 214, 186] as const,
    roughness: 0.16,
    relief: 0.012,
  }),
  leather: Object.freeze({
    dark: [62, 28, 16] as const,
    light: [154, 86, 48] as const,
    roughness: 0.55,
    relief: 0.004,
  }),
  sand: Object.freeze({
    dark: [166, 132, 78] as const,
    light: [232, 208, 150] as const,
    roughness: 0.92,
    relief: 0.006,
  }),
  rust: Object.freeze({
    dark: [42, 36, 32] as const,
    light: [176, 72, 28] as const,
    roughness: 0.72,
    relief: 0.015,
  }),
  snow: Object.freeze({
    dark: [186, 198, 208] as const,
    light: [248, 250, 252] as const,
    roughness: 0.28,
    relief: 0.01,
  }),
});

/** One generated UV tile covers this many meters at repeats = 1. */
export const proceduralTileMeters = Object.freeze({
  wood: 0.2,
  brick: 0.24,
  stone: 0.5,
  metal: 0.15,
  fabric: 0.08,
  marble: 0.6,
  concrete: 0.8,
  tiles: 0.3,
  leather: 0.12,
  sand: 0.4,
  rust: 0.2,
  snow: 1,
});

/** Preserve the published normalized finish thickness; native packing uses nanometers. */
export const iridescenceFilmRange = Object.freeze({ minNm: 100, maxNm: 800 });
