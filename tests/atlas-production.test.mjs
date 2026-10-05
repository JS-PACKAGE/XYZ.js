import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  packAtlas,
  signedDistanceField,
  multiChannelDistanceField,
} from '../scripts/atlas-production-lib.mjs';

test('packing is deterministic, bounded, and keeps extrusion outside visible rectangles', () => {
  const images = [
    { name: 'b', width: 2, height: 3 },
    { name: 'a', width: 3, height: 2 },
  ];
  const options = { width: 8, height: 8, padding: 1, extrude: 1, maxPages: 2 };
  const pages = packAtlas(images, options);
  assert.deepEqual(pages, packAtlas([...images].reverse(), options));
  assert.equal(pages.length, 2);
  for (const page of pages)
    for (const image of page.items) {
      assert.ok(image.x >= 2 && image.y >= 2);
      assert.ok(image.x + image.width + 2 <= page.width);
      assert.ok(image.y + image.height + 2 <= page.height);
    }
  assert.throws(
    () => packAtlas(images, { ...options, maxPages: 1 }),
    /page count/,
  );
  assert.throws(() => packAtlas([images[0], images[0]], options), /duplicate/);
  assert.throws(
    () => packAtlas([{ name: 'large', width: 8, height: 8 }], options),
    /cannot fit/,
  );
});

test('SDF exact distances agree with brute force on diagonals, interior and empty rasters', () => {
  const width = 7,
    height = 6,
    range = 8,
    alpha = new Uint8Array(width * height);
  for (let y = 1; y < 5; y++)
    for (let x = 1; x < 4; x++) alpha[y * width + x] = 255;
  const rgba = signedDistanceField(alpha, width, height, range);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const inside = alpha[y * width + x] >= 128;
      let nearest = Infinity;
      for (let yy = 0; yy < height; yy++)
        for (let xx = 0; xx < width; xx++)
          if (alpha[yy * width + xx] >= 128 !== inside)
            nearest = Math.min(nearest, Math.hypot(xx - x, yy - y));
      const signed = inside ? nearest - 0.5 : 0.5 - nearest;
      const expected = Math.round(
        Math.max(0, Math.min(1, 0.5 + signed / range)) * 255,
      );
      assert.equal(rgba[(y * width + x) * 4], expected);
    }
  assert.equal(signedDistanceField(new Uint8Array(16), 4, 4, 4)[0], 0);
  assert.throws(() => signedDistanceField(alpha, width, height, NaN), /budget/);
});

test('MSDF carries colored edge distances and preserves square corners and holes', () => {
  const contours = [
    [
      [3, 3],
      [13, 3],
      [13, 13],
      [3, 13],
    ],
    [
      [6, 6],
      [10, 6],
      [10, 10],
      [6, 10],
    ],
  ];
  const rgba = multiChannelDistanceField(contours, 16, 16, 8);
  let different = 0;
  for (let i = 0; i < rgba.length; i += 4)
    if (rgba[i] !== rgba[i + 1] || rgba[i + 1] !== rgba[i + 2]) different++;
  assert.ok(
    different > 30,
    'independent edge channels must not be monochrome copies',
  );
  const median = (x, y) => {
    const i = (y * 16 + x) * 4;
    return [rgba[i], rgba[i + 1], rgba[i + 2]].sort((a, b) => a - b)[1];
  };
  assert.ok(median(4, 4) > 127);
  assert.ok(median(7, 7) < 128);
  assert.ok(median(1, 1) < 128);
  assert.ok(median(12, 12) > 127);
  assert.throws(
    () =>
      multiChannelDistanceField(
        [
          [
            [1, 1],
            [1, 1],
            [2, 2],
          ],
        ],
        4,
        4,
        4,
      ),
    /Degenerate/,
  );
  assert.throws(
    () =>
      multiChannelDistanceField(
        [
          [
            [1, 1],
            [2, NaN],
            [3, 1],
          ],
        ],
        4,
        4,
        4,
      ),
    /vertex/,
  );
});
