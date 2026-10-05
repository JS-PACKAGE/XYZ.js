export const videoTextureLimits = Object.freeze({
  loadTimeoutMs: 30_000,
  maxLoadTimeoutMs: 120_000,
  decoderQueue: 16,
  decoderChunkBytes: 8 * 1024 * 1024,
  decoderQueuedBytes: 32 * 1024 * 1024,
});
