export const MAX_POINT_LIGHTS = 32;
export const MAX_SPOT_LIGHTS = 32;

/** Fixed native shader ABI and bounded authored source size. */
export const nativeMaterial3DLimits = Object.freeze({
  uniformFloats: 64,
  textures: 4,
  sourceCharacters: 65536,
});

/** Stable per-map UV uniform order: two vec4 values per affine coordinate mapping. */
export const materialTextureSlots = Object.freeze([
  'texture',
  'metallicRoughness',
  'normal',
  'occlusion',
  'emissive',
  'specular',
  'specularColor',
  'clearcoat',
  'clearcoatRoughness',
  'clearcoatNormal',
  'sheenColor',
  'sheenRoughness',
  'transmission',
  'thickness',
] as const);
export const MATERIAL_UV_FLOAT_COUNT = materialTextureSlots.length * 8;

/** Shared vec4-aligned light block used by both graphics backends. Offsets are floats. */
export const POINT_LIGHT_OFFSET = 12;
export const POINT_LIGHT_STRIDE = 8;
export const SPOT_LIGHT_OFFSET =
  POINT_LIGHT_OFFSET + MAX_POINT_LIGHTS * POINT_LIGHT_STRIDE;
export const SPOT_LIGHT_STRIDE = 16;
export const LIGHTING_POINT_ID_OFFSET =
  SPOT_LIGHT_OFFSET + MAX_SPOT_LIGHTS * SPOT_LIGHT_STRIDE;
export const LIGHTING_FLOAT_COUNT = LIGHTING_POINT_ID_OFFSET + MAX_POINT_LIGHTS;

/** Environment block: nine SH vec4 followed by intensity/background/mip data. */
export const ENVIRONMENT_FLOAT_COUNT = 40;
/** Global environment plus four spatial probe SH/params/bounds records. */
export const REFLECTION_FLOAT_COUNT = (ENVIRONMENT_FLOAT_COUNT + 12) * 5;

/** Bounded weights avoid rapidly overflowing half-float accumulation targets. */
export const oitSettings = Object.freeze({
  scale: 100,
  minWeight: 0.01,
  maxWeight: 30,
});

export const environmentLimits = Object.freeze({
  /** Equirect width cap; height is width / 2. */
  maxWidth: 2048,
  minHeight: 4,
  maxMips: 7,
  /** Diffuse SH and blurred specular levels are filtered from at most this width. */
  proxyWidth: 64,
});

/** A lost WebGL2 context not restored within this window becomes a fatal GraphicsError. */
export const graphicsRecoveryLimits = Object.freeze({
  restoreTimeoutMs: 10000,
});

export const renderingLimits = Object.freeze({
  pointLights: MAX_POINT_LIGHTS,
  spotLights: MAX_SPOT_LIGHTS,
});

/** Fog block shared by both graphics backends: color.rgb/mode, near/far/density/0. */
export const FOG_FLOAT_COUNT = 8;

export const shadowLimits = Object.freeze({
  cascades: 4,
  pointLights: 8,
  spotLights: 8,
  maps: 4 + 8 * 6 + 8,
  mapSize: 1024,
  near: 0.1,
  far: 50,
  cascadeDistance: 100,
  cascadeLambda: 0.5,
  cascadeBlend: 0.1,
  slopeBias: 1,
  maximumSlopeBias: 0.05,
});

/** Shadow atlas header (12 vec4), matrices, then quality controls (one vec4). */
export const SHADOW_FLOAT_COUNT = 48 + shadowLimits.maps * 16 + 4;

export const fxaaDefaults = Object.freeze({
  enabled: false,
  minimumContrast: 0.0312,
  relativeContrast: 0.125,
  directionReduction: 0.125,
  minimumReduction: 1 / 128,
  maximumSpan: 8,
});

export const depthPostDefaults = Object.freeze({
  ssao: false,
  ssaoRadius: 0.75,
  ssaoStrength: 1,
  ssaoBias: 0.02,
  depthOfField: false,
  dofFocusDistance: 10,
  dofFocusRange: 2,
  dofBlurRadius: 8,
  maximumBlurRadius: 64,
  ssaoDirections: 8,
  ssaoRings: 2,
  dofSamples: 24,
  dofGoldenAngle: 2.399963229728653,
});

/** Screen-space rough transmission uses a bounded nine-tap approximation. */
export const transmissionBlurFraction = 0.04;

/** World-space lift at decal creation; later receiver scaling also scales this baked lift. */
export const decalNormalOffset = 0.001;

/** Bounded temporal/ray-march work and dynamic capture memory. */
export const advancedPostDefaults = Object.freeze({
  taaHistoryWeight: 0.9,
  taaDepthThreshold: 0.01,
  taaCameraCutDistance: 5,
  ssrSteps: 48,
  ssrThickness: 0.2,
  ssrMaxDistance: 30,
  ssrRoughness: 0.15,
  ssrStrength: 1,
  maximumSSRSteps: 128,
});
export const reflectionCaptureLimits = Object.freeze({
  size: 64,
  maximumSize: 512,
  maximumBytes: 64 * 1024 * 1024,
  interval: 1,
});
