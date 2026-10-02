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
  lazyGzipBytes: startupBaseline.gzipBytes,
} as const;
