/** Chromium 153 measured repeat noise 0; cross max mean 1/16384, p99 0.
 * Allow sparse one-byte quantization, not axis/color alignment or broad shading error.
 */
export const parityThresholds = Object.freeze({ mean: 0.001, p99: 1 });

/** Byte-domain RGB, top-left origin; never resamples or aligns images. */
export function comparePixels(a, b, width, height, limits = parityThresholds) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    a.length !== width * height * 4 ||
    b.length !== a.length
  )
    throw new RangeError('Pixel dimensions/buffer lengths disagree.');
  const channels = [];
  for (let channel = 0; channel < 3; channel++) {
    const histogram = new Uint32Array(256);
    let sum = 0;
    for (let i = channel; i < a.length; i += 4) {
      if (
        !Number.isInteger(a[i]) ||
        a[i] < 0 ||
        a[i] > 255 ||
        !Number.isInteger(b[i]) ||
        b[i] < 0 ||
        b[i] > 255
      )
        throw new RangeError('Pixel channel must be an unsigned byte.');
      const error = Math.abs(a[i] - b[i]);
      histogram[error]++;
      sum += error;
    }
    let cumulative = 0,
      p99 = 0;
    for (; p99 < 255; p99++) {
      cumulative += histogram[p99];
      if (cumulative >= Math.ceil(width * height * 0.99)) break;
    }
    channels.push({ mean: sum / (width * height), p99 });
  }
  return {
    channels,
    pass: channels.every(
      ({ mean, p99 }) => mean <= limits.mean && p99 <= limits.p99,
    ),
  };
}

export function comparatorSelfTest(pixels, width, height) {
  const flipped = new Uint8Array(pixels.length);
  const wrong = Uint8Array.from(pixels);
  for (let y = 0; y < height; y++)
    flipped.set(
      pixels.slice(y * width * 4, (y + 1) * width * 4),
      (height - y - 1) * width * 4,
    );
  for (let i = 0; i < wrong.length; i += 4) wrong[i] = 255 - wrong[i];
  const flip = comparePixels(pixels, flipped, width, height);
  const colour = comparePixels(pixels, wrong, width, height);
  if (flip.pass || colour.pass)
    throw new Error(
      'Parity comparator failed deliberate flip/wrong-colour self-test.',
    );
  return { flip, colour };
}
