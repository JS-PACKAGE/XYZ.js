/** Historical small Canvas2D Game + Scene + Sprite consumer before backend isolation. */
export const startupBaseline = {
  minifiedBytes: 841577,
  gzipBytes: 214169,
} as const;

/** Absolute regression ceilings, not a promised percentage or runtime performance target. */
export const startupBudgets = {
  mathMinifiedBytes: 4096,
  canvasInitialMinifiedBytes: startupBaseline.minifiedBytes - 1,
  canvasInitialGzipBytes: startupBaseline.gzipBytes - 1,
  canvasStartupMinifiedBytes: startupBaseline.minifiedBytes - 1,
  canvasStartupGzipBytes: startupBaseline.gzipBytes - 1,
  lazyMinifiedBytes: startupBaseline.minifiedBytes,
  /**
   * Deferred chunks load only after startup. Their gzip size outgrew the historical
   * baseline (221664 bytes, mostly shader template literals), so this ceiling was raised
   * by owner decision to 220 KiB; the startup ceilings above still track the baseline.
   */
  lazyGzipBytes: 225280,
} as const;
