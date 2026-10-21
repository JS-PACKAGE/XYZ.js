import { assetLimits } from './assets.js';

/** Per-resource bounds, not a browser-wide memory guarantee. */
export const rendering2dLimits = Object.freeze({
  targetDimension: assetLimits.textureDimension,
  targetPixels: assetLimits.texturePixels,
  layerDepth: 32,
  commands: 65536,
  /** Distinct (space, summed z) keys ordered by counting sort before a comparison sort. */
  sortBuckets: 16,
  pathCommands: 16384,
  coordinate: 1_000_000,
  meshVertices: 1_000_000,
  meshIndices: 3_000_000,
  particleCapacity: 65536,
  atlasPages: 64,
  atlasFrames: 16384,
  fontGlyphs: 4096,
  fontPages: 64,
  fontBytes: 8 * 1024 * 1024,
  manifestEntries: 4096,
  manifestBundles: 256,
  filterRadius: 128,
  filterQuality: 8,
  resolution: 8,
  /** Canvas2D painted sub-frame/tint snapshots kept for redraw, least recently used out. */
  canvasFrameSnapshots: 256,
  /** Their combined pixels (4 bytes each); a larger single frame repaints a scratch.
   * Also bounds the source pixels read back once per version for tinted copies. */
  canvasFrameSnapshotPixels: 4 * 1024 * 1024,
});
