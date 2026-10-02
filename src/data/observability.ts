/** Opt-in query pools stay bounded even when the GPU/readback falls behind. */
export const gpuTimingDefaults = Object.freeze({
  maxInFlight: 4,
  maxInFlightLimit: 32,
  warmupFrames: 120,
  sampleInterval: 1,
});

/** Plateau classification needs sustained, meaningful growth, not a positive slope. */
export const measurementDefaults = Object.freeze({
  tailSamples: 32,
  minimumTrendSamples: 12,
  minimumTrendSeconds: 60,
  plateauAbsoluteBytes: 8 * 1024 * 1024,
  plateauRelativeFraction: 0.05,
  growthBytesPerMinute: 1024 * 1024,
  memorySampleSeconds: 5,
  longDurationSeconds: 3600,
  longTaskMilliseconds: 50,
  traceBufferKiB: 8192,
});

/** These emulate CPU/network pressure; none represents certification on low-tier hardware. */
export const soakProfiles = Object.freeze({
  native: {
    cpuRate: 1,
    latencyMs: 0,
    downloadBytesPerSecond: -1,
    uploadBytesPerSecond: -1,
  },
  'simulated-low-tier': {
    cpuRate: 4,
    latencyMs: 150,
    downloadBytesPerSecond: 200_000,
    uploadBytesPerSecond: 90_000,
  },
  'simulated-low-tier-heavy': {
    cpuRate: 6,
    latencyMs: 300,
    downloadBytesPerSecond: 90_000,
    uploadBytesPerSecond: 45_000,
  },
});

export const soakWorkload = Object.freeze({
  navigationWorkBudget: 512,
  navigationConcurrentSearches: 4,
  routeIntervalSeconds: 2,
  gpuPhaseHistoryFrames: 256,
  networkPayloadBytes: 65536,
  bakeColumns: 16,
  bakeRows: 16,
  bakeCellSize: 20,
});
