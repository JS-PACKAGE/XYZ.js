export declare const MAX_POINT_LIGHTS = 8;
export declare const MAX_SPOT_LIGHTS = 8;
/** Shared vec4-aligned light block used by both graphics backends. Offsets are floats. */
export declare const POINT_LIGHT_OFFSET = 12;
export declare const POINT_LIGHT_STRIDE = 8;
export declare const SPOT_LIGHT_OFFSET: number;
export declare const SPOT_LIGHT_STRIDE = 16;
export declare const LIGHTING_FLOAT_COUNT: number;
export declare const renderingLimits: Readonly<{
    pointLights: 8;
    spotLights: 8;
}>;
