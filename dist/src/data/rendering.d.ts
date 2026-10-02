export declare const MAX_POINT_LIGHTS = 32;
export declare const MAX_SPOT_LIGHTS = 32;
/** Fixed native shader ABI and bounded authored source size. */
export declare const nativeMaterial3DLimits: Readonly<{
    uniformFloats: 64;
    textures: 4;
    sourceCharacters: 65536;
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
/** Mesh-local IBL block adds box bounds and capture position to the environment block. */
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
    /** Diffuse SH and blurred specular levels are filtered from at most this width. */
    proxyWidth: 64;
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
}>;
/** Shadow atlas header (12 vec4) and one matrix for every budgeted tile. */
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
