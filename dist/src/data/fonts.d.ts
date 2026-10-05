/** Distance-field production and Canvas fallback resource policy. */
export declare const distanceFieldLimits: Readonly<{
    minimumRange: 1;
    maximumRange: 256;
    rasterDimension: 8192;
    rasterPixels: 16777216;
    rasterScale: 64;
    minimumRasterScale: number;
    cachedScales: 2;
}>;
