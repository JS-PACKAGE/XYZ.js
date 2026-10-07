export declare const MAX_POINT_LIGHTS = 32;
export declare const MAX_SPOT_LIGHTS = 32;
/** CPU static-lighting work/storage quotas; caller requests can only lower hard caps. */
export declare const bakedLightingLimits: Readonly<{
    size: 128;
    maxSize: 1024;
    padding: 2;
    maxPadding: 16;
    samples: 32;
    maxSamples: 512;
    maxTriangles: 65536;
    maxRays: 8000000;
    maxLights: 256;
    bias: 0.001;
    aoDistance: 2;
    resolution: readonly [4, 4, 4];
    maxProbes: 4096;
}>;
/** Fixed native shader ABI and bounded authored source size. */
export declare const nativeMaterial3DLimits: Readonly<{
    uniformFloats: 64;
    textures: 4;
    sourceCharacters: 65536;
}>;
/** Bounded opt-in material anti-aliasing, shared by both native shaders. */
export declare const materialQuality: Readonly<{
    samples: 4;
    normalVarianceScale: 2;
    maxNormalVariance: 0.18;
    minAlphaFootprint: 0.0001;
    sheenSamples: 32;
}>;
/** Stable per-map UV uniform order: two vec4 values per affine coordinate mapping. */
export declare const materialTextureSlots: readonly ["texture", "metallicRoughness", "normal", "occlusion", "emissive", "specular", "specularColor", "clearcoat", "clearcoatRoughness", "clearcoatNormal", "sheenColor", "sheenRoughness", "transmission", "thickness"];
export declare const MATERIAL_UV_FLOAT_COUNT: number;
/** Shared vec4-aligned light block used by both graphics backends. Offsets are floats. */
export declare const POINT_LIGHT_OFFSET = 12;
export declare const POINT_LIGHT_STRIDE = 8;
export declare const SPOT_LIGHT_OFFSET: number;
export declare const SPOT_LIGHT_STRIDE = 16;
export declare const LIGHTING_POINT_ID_OFFSET: number;
export declare const LIGHTING_FLOAT_COUNT: number;
/** Environment block: nine SH vec4 followed by intensity/background/mip data. */
export declare const ENVIRONMENT_FLOAT_COUNT = 40;
/** Global environment plus four spatial probe SH/params/bounds records. */
export declare const REFLECTION_FLOAT_COUNT: number;
/** Bounded weights avoid rapidly overflowing half-float accumulation targets. */
export declare const oitSettings: Readonly<{
    scale: 100;
    minWeight: 0.01;
    maxWeight: 30;
}>;
export declare const environmentLimits: Readonly<{
    /** Equirect width cap; height is width / 2. */
    maxWidth: 2048;
    minHeight: 4;
    maxMips: 7;
    /** Area-averaged diffuse SH proxy, independent of specular filtering. */
    proxyWidth: 64;
    /** Deterministic GGX ray budget and maximum filtered output width. */
    prefilterSamples: 128;
    prefilterWidth: 256;
}>;
/** A lost WebGL2 context not restored within this window becomes a fatal GraphicsError. */
export declare const graphicsRecoveryLimits: Readonly<{
    restoreTimeoutMs: 10000;
}>;
export declare const renderingLimits: Readonly<{
    pointLights: 32;
    spotLights: 32;
}>;
/** Fog block shared by both graphics backends: color.rgb/mode, near/far/density/0. */
export declare const FOG_FLOAT_COUNT = 8;
export declare const shadowLimits: Readonly<{
    cascades: 4;
    pointLights: 8;
    spotLights: 8;
    maps: number;
    mapSize: 1024;
    near: 0.1;
    far: 50;
    cascadeDistance: 100;
    cascadeLambda: 0.5;
    cascadeBlend: 0.1;
    slopeBias: 1;
    maximumSlopeBias: 0.05;
}>;
/** Shadow atlas header (12 vec4), matrices, then quality controls (one vec4). */
export declare const SHADOW_FLOAT_COUNT: number;
export declare const fxaaDefaults: Readonly<{
    enabled: false;
    minimumContrast: 0.0312;
    relativeContrast: 0.125;
    directionReduction: 0.125;
    minimumReduction: number;
    maximumSpan: 8;
}>;
export declare const depthPostDefaults: Readonly<{
    ssao: false;
    ssaoRadius: 0.75;
    ssaoStrength: 1;
    ssaoBias: 0.02;
    depthOfField: false;
    dofFocusDistance: 10;
    dofFocusRange: 2;
    dofBlurRadius: 8;
    maximumBlurRadius: 64;
    ssaoDirections: 8;
    ssaoRings: 2;
    dofSamples: 24;
    dofGoldenAngle: 2.399963229728653;
}>;
/** Screen-space rough transmission uses a bounded nine-tap approximation. */
export declare const transmissionBlurFraction = 0.04;
/** World-space lift at decal creation; later receiver scaling also scales this baked lift. */
export declare const decalNormalOffset = 0.001;
/** Bounded temporal/ray-march work and dynamic capture memory. */
export declare const advancedPostDefaults: Readonly<{
    taaHistoryWeight: 0.9;
    taaDepthThreshold: 0.01;
    taaCameraCutDistance: 5;
    ssrSteps: 48;
    ssrThickness: 0.2;
    ssrMaxDistance: 30;
    ssrRoughness: 0.15;
    ssrStrength: 1;
    maximumSSRSteps: 128;
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
/** Bound single-view scene readback and automatic caller-driven update pacing. */
export declare const planarReflectionLimits: Readonly<{
    size: 128;
    maximumSize: 512;
    interval: 0.1;
    minimumInterval: number;
    clipBias: 0.001;
}>;
export declare const volumetricPostDefaults: Readonly<{
    density: 0.025;
    heightFalloff: 0.15;
    maxDistance: 200;
    shaftStrength: 0.25;
    fogSamples: 16;
    shaftSamples: 32;
    maximumSamples: 64;
}>;
export declare const lensFlareDefaults: Readonly<{
    strength: 0.15;
    threshold: 1;
    ghosts: 4;
    maximumGhosts: 8;
    spacing: 0.5;
    haloRadius: 0.3;
    haloWidth: 0.15;
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
