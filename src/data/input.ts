export const inputLimits = {
  maxPointerSamples: 256,
  maxActivePointers: 32,
} as const;

/** Default recognition thresholds; distances are logical pixels, times milliseconds. */
export const gestureDefaults = {
  /** Largest travel that still counts as a tap or long press. */
  tapSlop: 10,
  tapMaxMs: 300,
  doubleTapMs: 300,
  doubleTapSlop: 30,
  longPressMs: 500,
  swipeMaxMs: 500,
  swipeMinDistance: 40,
  /** Pixels per second at release. */
  swipeMinVelocity: 300,
  panThreshold: 8,
  /** Relative distance change before a pinch starts. */
  pinchThreshold: 0.05,
  /** Radians of twist before a rotate starts. */
  rotateThreshold: 0.1,
} as const;
