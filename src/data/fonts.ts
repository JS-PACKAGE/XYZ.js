/** Distance-field production and Canvas fallback resource policy. */
export const distanceFieldLimits = Object.freeze({
  minimumRange: 1,
  maximumRange: 256,
  rasterDimension: 8192,
  rasterPixels: 16_777_216,
  rasterScale: 64,
  minimumRasterScale: 1 / 8192,
  cachedScales: 2,
});
