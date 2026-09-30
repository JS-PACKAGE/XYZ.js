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

export const renderingLimits = Object.freeze({
  pointLights: MAX_POINT_LIGHTS,
  spotLights: MAX_SPOT_LIGHTS,
});
