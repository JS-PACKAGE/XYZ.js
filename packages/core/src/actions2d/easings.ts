export type Easing = (progress: number) => number;

function normalized(fn: Easing): Easing {
  return (progress) => {
    if (!Number.isFinite(progress))
      throw new RangeError('Easing progress must be finite.');
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    return fn(progress);
  };
}

const bounceOut = normalized((t) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) {
    t -= 1.5 / d;
    return n * t * t + 0.75;
  }
  if (t < 2.5 / d) {
    t -= 2.25 / d;
    return n * t * t + 0.9375;
  }
  t -= 2.625 / d;
  return n * t * t + 0.984375;
});

/** Normalized time and output; durations are always measured in seconds. */
export const Easings = Object.freeze({
  linear: normalized((t) => t),
  quadIn: normalized((t) => t * t),
  quadOut: normalized((t) => t * (2 - t)),
  quadInOut: normalized((t) =>
    t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  ),
  cubicIn: normalized((t) => t * t * t),
  cubicOut: normalized((t) => 1 - (1 - t) ** 3),
  cubicInOut: normalized((t) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  ),
  sineIn: normalized((t) => 1 - Math.cos((t * Math.PI) / 2)),
  sineOut: normalized((t) => Math.sin((t * Math.PI) / 2)),
  sineInOut: normalized((t) => (1 - Math.cos(Math.PI * t)) / 2),
  bounceOut,
});
