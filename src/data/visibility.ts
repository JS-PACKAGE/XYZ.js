/** Render visibility budgets. Exhaustion submits objects rather than hiding them. */
export const visibilityLimits = Object.freeze({
  occlusionQueries: 256,
  occlusionFramesInFlight: 3,
  proxyInflation: 1e-4,
  proxyCoordinateInflation: 2e-6,
  minimumQueryPixels: 2,
  screenRadius: 1,
});
