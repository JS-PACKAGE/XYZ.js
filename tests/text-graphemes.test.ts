import { expect, it } from 'vitest';
import {
  graphemeBoundaries,
  snapGrapheme,
} from '../packages/core/src/text-graphemes.js';

it('keeps extended emoji, combining marks, flags and Indic conjuncts atomic', () => {
  const clusters = ['👨‍👩‍👧‍👦', 'e\u0301', '🇯🇵', '👍🏽', 'क्ष'];
  const text = clusters.join('');
  const expected = [0];
  for (const cluster of clusters)
    expected.push(expected[expected.length - 1]! + cluster.length);
  const boundaries = graphemeBoundaries(text, 'hi');
  expect(boundaries).toEqual(expected);
  for (let i = 1; i < expected.length; i++) {
    const start = expected[i - 1]!,
      end = expected[i]!;
    for (let index = start + 1; index < end; index++) {
      expect(snapGrapheme(boundaries, index, 'upstream')).toBe(start);
      expect(snapGrapheme(boundaries, index, 'downstream')).toBe(end);
    }
  }
});

it('clamps visual offsets without changing valid native UTF-16 boundaries', () => {
  const boundaries = graphemeBoundaries('a😀b');
  expect(snapGrapheme(boundaries, -1)).toBe(0);
  expect(snapGrapheme(boundaries, 100, 'upstream')).toBe(4);
  expect(snapGrapheme(boundaries, 1, 'upstream')).toBe(1);
  expect(snapGrapheme(boundaries, 3)).toBe(3);
  expect(snapGrapheme(graphemeBoundaries(''), 2)).toBe(0);
  expect(() => snapGrapheme(boundaries, NaN)).toThrow(RangeError);
});
