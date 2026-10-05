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
});
