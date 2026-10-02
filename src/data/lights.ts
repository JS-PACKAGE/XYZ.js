import { MAX_POINT_LIGHTS, MAX_SPOT_LIGHTS } from './rendering.js';

/** Shading work and scene storage bounds; shadow atlas budgets are separate. */
export const lightSelectionLimits = Object.freeze({
  poolPerType: 1024,
  pointLights: MAX_POINT_LIGHTS,
  spotLights: MAX_SPOT_LIGHTS,
});
