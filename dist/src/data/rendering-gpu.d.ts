/** Bounded weights avoid rapidly overflowing half-float accumulation targets. */
export declare const oitSettings: Readonly<{
    scale: 100;
    minWeight: 0.01;
    maxWeight: 30;
}>;
/** A lost WebGL2 context not restored within this window becomes a fatal GraphicsError. */
export declare const graphicsRecoveryLimits: Readonly<{
    restoreTimeoutMs: 10000;
}>;
export declare const reflectionCaptureLimits: Readonly<{
    size: 64;
    maximumSize: 512;
    maximumBytes: number;
    interval: 1;
}>;
/** Bound driver program residency and protect the inexpensive default PBR source. */
export declare const meshShaderVariantLimits: Readonly<{
    maxEntries: 64;
    plainFragmentMaxBytes: 40000;
}>;
/** Bounded opt-in material anti-aliasing, shared by both native shaders. */
export declare const materialQuality: Readonly<{
    samples: 4;
    normalVarianceScale: 2;
    maxNormalVariance: 0.18;
    minAlphaFootprint: 0.0001;
    sheenSamples: 32;
}>;
export declare const motionBlurDefaults: Readonly<{
    perObject: false;
    velocityDepthTolerance: 0.00001;
    strength: 1;
    samples: 12;
    maximumSamples: 32;
    maxRadius: 32;
    maximumRadius: 64;
}>;
