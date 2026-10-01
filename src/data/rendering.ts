export const MAX_POINT_LIGHTS = 8;
export const MAX_SPOT_LIGHTS = 8;

/** Shared vec4-aligned light block used by both graphics backends. Offsets are floats. */
export const POINT_LIGHT_OFFSET = 12;
export const POINT_LIGHT_STRIDE = 8;
export const SPOT_LIGHT_OFFSET =
  POINT_LIGHT_OFFSET + MAX_POINT_LIGHTS * POINT_LIGHT_STRIDE;
export const SPOT_LIGHT_STRIDE = 16;
export const LIGHTING_FLOAT_COUNT =
  SPOT_LIGHT_OFFSET + MAX_SPOT_LIGHTS * SPOT_LIGHT_STRIDE;

/** Environment block: nine SH vec4 followed by intensity/background/mip data. */
export const ENVIRONMENT_FLOAT_COUNT = 40;

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
  maps: 4 + MAX_POINT_LIGHTS * 6 + MAX_SPOT_LIGHTS,
  mapSize: 1024,
  near: 0.1,
  far: 50,
  cascadeDistance: 100,
  cascadeLambda: 0.5,
});

/** Shadow atlas header (8 vec4) and one matrix for every possible tile. */
export const SHADOW_FLOAT_COUNT = 32 + shadowLimits.maps * 16;

export const fxaaDefaults = Object.freeze({
  enabled: false,
  minimumContrast: 0.0312,
  relativeContrast: 0.125,
  directionReduction: 0.125,
  minimumReduction: 1 / 128,
  maximumSpan: 8,
});
