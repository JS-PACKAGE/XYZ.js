export const videoTextureLimits = Object.freeze({
  loadTimeoutMs: 30_000,
  maxLoadTimeoutMs: 120_000,
  decoderQueue: 16,
  decoderChunkBytes: 8 * 1024 * 1024,
  decoderQueuedBytes: 32 * 1024 * 1024,
  mp4Bytes: 128 * 1024 * 1024,
  mp4Samples: 100_000,
  mp4Tracks: 32,
  mp4Depth: 16,
});
