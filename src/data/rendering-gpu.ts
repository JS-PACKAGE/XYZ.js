/** Bounded weights avoid rapidly overflowing half-float accumulation targets. */
export const oitSettings = /* @__PURE__ */ Object.freeze({
  scale: 100,
  minWeight: 0.01,
  maxWeight: 30,
});

/** A lost WebGL2 context not restored within this window becomes a fatal GraphicsError. */
export const graphicsRecoveryLimits = /* @__PURE__ */ Object.freeze({
  restoreTimeoutMs: 10000,
});

export const reflectionCaptureLimits = /* @__PURE__ */ Object.freeze({
  size: 64,
  maximumSize: 512,
  maximumBytes: 64 * 1024 * 1024,
  interval: 1,
});

/** Bound driver program residency and protect the inexpensive default PBR source. */
export const meshShaderVariantLimits = /* @__PURE__ */ Object.freeze({
  maxEntries: 64,
  plainFragmentMaxBytes: 40000,
});
/** Bounded opt-in material anti-aliasing, shared by both native shaders. */
export const materialQuality = /* @__PURE__ */ Object.freeze({
  samples: 4,
  normalVarianceScale: 2,
  maxNormalVariance: 0.18,
  minAlphaFootprint: 1e-4,
  sheenSamples: 32,
});
export const motionBlurDefaults = /* @__PURE__ */ Object.freeze({
  perObject: false,
  velocityDepthTolerance: 0.00001,
  strength: 1,
  samples: 12,
  maximumSamples: 32,
  maxRadius: 32,
  maximumRadius: 64,
});
