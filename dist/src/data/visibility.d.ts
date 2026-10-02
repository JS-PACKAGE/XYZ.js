/** Render visibility budgets. Exhaustion submits objects rather than hiding them. */
export declare const visibilityLimits: Readonly<{
    occlusionQueries: 256;
    occlusionFramesInFlight: 3;
    proxyInflation: 0.0001;
    proxyCoordinateInflation: 0.000002;
    minimumQueryPixels: 2;
    screenRadius: 1;
}>;
