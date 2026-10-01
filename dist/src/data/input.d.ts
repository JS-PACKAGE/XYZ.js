export declare const inputLimits: {
    readonly maxPointerSamples: 256;
    readonly maxActivePointers: 32;
};
/** Default recognition thresholds; distances are logical pixels, times milliseconds. */
export declare const gestureDefaults: {
    /** Largest travel that still counts as a tap or long press. */
    readonly tapSlop: 10;
    readonly tapMaxMs: 300;
    readonly doubleTapMs: 300;
    readonly doubleTapSlop: 30;
    readonly longPressMs: 500;
    readonly swipeMaxMs: 500;
    readonly swipeMinDistance: 40;
    /** Pixels per second at release. */
    readonly swipeMinVelocity: 300;
    readonly panThreshold: 8;
    /** Relative distance change before a pinch starts. */
    readonly pinchThreshold: 0.05;
    /** Radians of twist before a rotate starts. */
    readonly rotateThreshold: 0.1;
};
