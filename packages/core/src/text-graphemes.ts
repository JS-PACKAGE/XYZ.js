export type TextCaretAffinity = 'upstream' | 'downstream';

let segmenter: Intl.Segmenter | undefined;
let segmenterLocale: string | undefined;

/** Native selection offsets stay UTF-16; only visual navigation snaps to clusters. */
export function graphemeBoundaries(
  text: string,
  locale?: string,
): readonly number[] {
  if (typeof Intl.Segmenter !== 'function')
    throw new Error('Intl.Segmenter is required for Unicode grapheme layout.');
  const requestedLocale = locale || undefined;
  if (!segmenter || requestedLocale !== segmenterLocale) {
    segmenter = new Intl.Segmenter(requestedLocale, {
      granularity: 'grapheme',
    });
    segmenterLocale = requestedLocale;
  }
  const result = [0];
  for (const segment of segmenter.segment(text)) {
    const end = segment.index + segment.segment.length;
    if (end !== result[result.length - 1]) result.push(end);
  }
  return Object.freeze(result);
}

export function snapGrapheme(
  boundaries: readonly number[],
  index: number,
  affinity: TextCaretAffinity = 'downstream',
): number {
  if (!Number.isInteger(index) || boundaries.length === 0)
    throw new RangeError('Invalid text offset or grapheme boundaries.');
  let low = 0,
    high = boundaries.length - 1;
  if (index >= boundaries[boundaries.length - 1]!)
    return boundaries[boundaries.length - 1]!;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (boundaries[middle]! < index) low = middle + 1;
    else high = middle;
  }
  const next = boundaries[low]!;
  if (next === index || low === 0) return next;
  return affinity === 'upstream' ? boundaries[low - 1]! : next;
}
