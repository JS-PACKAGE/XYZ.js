export const audioDefaults = Object.freeze({
  voiceCount: 8,
  lookahead: 0.1,
  tickMs: 25,
  releaseGuard: 0.02,
  gainSmoothing: 0.005,
  effectCrossfade: 0.02,
  effectsPerBus: 16,
  impulseValues: 4 * 48000 * 30,
  impulseSampleRate: 192000,
  duckAttack: 0.02,
  duckRelease: 0.2,
});
