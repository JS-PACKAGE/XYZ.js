import type { EnvironmentMap } from '../../core/src/environment.js';

/** Same native sampler for the global map and four spatial volumes, preserving texture limits. */
export function packProbeTextures(
  maps: readonly (EnvironmentMap | undefined)[],
) {
  const width = Math.max(2, ...maps.map((map) => map?.width ?? 2));
  const height = width / 2;
  const mipCount = Math.max(1, ...maps.map((map) => map?.mipCount ?? 1));
  const levels: { width: number; height: number; data: Uint16Array }[] = [];
  for (let level = 0; level < mipCount; level++) {
    const w = Math.max(1, width >> level),
      h = Math.max(1, height >> level);
    const data = new Uint16Array(w * h * 4 * 5);
    for (let layer = 0; layer < 5; layer++) {
      const map = maps[layer];
      if (!map) continue;
      const sourceLevel =
        mipCount === 1
          ? 0
          : Math.round((level / (mipCount - 1)) * (map.mipCount - 1));
      const source = map.levels[sourceLevel]!,
        size = map.levelSizes[sourceLevel]!;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const sx = Math.min(
            size.width - 1,
            Math.floor(((x + 0.5) * size.width) / w),
          );
          const sy = Math.min(
            size.height - 1,
            Math.floor(((y + 0.5) * size.height) / h),
          );
          const from = (sy * size.width + sx) * 4,
            to = ((layer * h + y) * w + x) * 4;
          for (let channel = 0; channel < 4; channel++)
            data[to + channel] = source[from + channel]!;
        }
    }
    levels.push({ width: w, height: h, data });
  }
  return {
    width,
    height,
    mipCount,
    levels,
    bytes: levels.reduce((sum, level) => sum + level.data.byteLength, 0),
  };
}
