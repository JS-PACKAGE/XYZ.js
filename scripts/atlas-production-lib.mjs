const LIMIT = 4096;
export function packAtlas(inputs, options = {}) {
  const {
    width = 1024,
    height = width,
    padding = 1,
    extrude = 1,
    maxPages = 16,
  } = options;
  if (
    ![width, height, padding, extrude, maxPages].every(Number.isSafeInteger) ||
    width < 1 ||
    height < 1 ||
    width > LIMIT ||
    height > LIMIT ||
    padding < 0 ||
    extrude < 0 ||
    padding > 64 ||
    extrude > 64 ||
    maxPages < 1 ||
    maxPages > 64 ||
    !Array.isArray(inputs) ||
    !inputs.length ||
    inputs.length > 16384
  )
    throw new RangeError('Invalid atlas packing budget.');
  const names = new Set();
  const items = inputs
    .map((item) => {
      if (
        !item ||
        typeof item.name !== 'string' ||
        !item.name ||
        item.name.length > 1024 ||
        names.has(item.name) ||
        ![item.width, item.height].every(
          (v) => Number.isSafeInteger(v) && v > 0 && v <= LIMIT,
        )
      )
        throw new RangeError('Invalid or duplicate atlas image.');
      names.add(item.name);
      return {
        ...item,
        packedWidth: item.width + 2 * (padding + extrude),
        packedHeight: item.height + 2 * (padding + extrude),
      };
    })
    .sort(
      (a, b) =>
        b.packedHeight - a.packedHeight ||
        b.packedWidth - a.packedWidth ||
        (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
    );
  const pages = [];
  for (const item of items) {
    if (item.packedWidth > width || item.packedHeight > height)
      throw new RangeError(`Atlas image cannot fit: ${item.name}`);
    let found;
    for (const page of pages) {
      for (const shelf of page.shelves)
        if (
          item.packedHeight <= shelf.height &&
          shelf.x + item.packedWidth <= width
        ) {
          found = { page, shelf };
          break;
        }
      if (found) break;
      const y = page.shelves.reduce((sum, shelf) => sum + shelf.height, 0);
      if (y + item.packedHeight <= height) {
        const shelf = { x: 0, y, height: item.packedHeight };
        page.shelves.push(shelf);
        found = { page, shelf };
        break;
      }
    }
    if (!found) {
      if (pages.length >= maxPages)
        throw new RangeError('Atlas exceeds maximum page count.');
      const shelf = { x: 0, y: 0, height: item.packedHeight },
        page = { width, height, shelves: [shelf], items: [] };
      pages.push(page);
      found = { page, shelf };
    }
    found.page.items.push({
      ...item,
      x: found.shelf.x + padding + extrude,
      y: found.shelf.y + padding + extrude,
    });
    found.shelf.x += item.packedWidth;
  }
  return pages.map(({ width, height, items }) => ({ width, height, items }));
}

/** Exact squared Euclidean distance transform, separable lower envelopes. */
function edt1(input, output, length) {
  const sites = new Int32Array(length),
    boundaries = new Float64Array(length + 1);
  let k = 0;
  sites[0] = 0;
  boundaries[0] = -Infinity;
  boundaries[1] = Infinity;
  for (let q = 1; q < length; q++) {
    let s;
    do {
      const p = sites[k];
      s = (input[q] + q * q - (input[p] + p * p)) / (2 * (q - p));
      if (s <= boundaries[k]) k--;
      else break;
    } while (k >= 0);
    k++;
    sites[k] = q;
    boundaries[k] = s;
    boundaries[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < length; q++) {
    while (boundaries[k + 1] < q) k++;
    const d = q - sites[k];
    output[q] = d * d + input[sites[k]];
  }
}
export function signedDistanceField(alpha, width, height, range) {
  validateRaster(width, height, range);
  if (alpha.length !== width * height)
    throw new RangeError('Invalid alpha raster.');
  const transform = (inside) => {
    const field = new Float64Array(width * height),
      row = new Float64Array(Math.max(width, height)),
      result = new Float64Array(row.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++)
        row[x] = alpha[y * width + x] >= 128 === inside ? 0 : 1e12;
      edt1(row, result, width);
      field.set(result.subarray(0, width), y * width);
    }
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) row[y] = field[y * width + x];
      edt1(row, result, height);
      for (let y = 0; y < height; y++) field[y * width + x] = result[y];
    }
    return field;
  };
  const toInside = transform(true),
    toOutside = transform(false),
    rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < alpha.length; i++) {
    const d =
      alpha[i] >= 128
        ? Math.sqrt(toOutside[i]) - 0.5
        : 0.5 - Math.sqrt(toInside[i]);
    const v = encode(d, range);
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}
function encode(distance, range) {
  return Math.round(Math.max(0, Math.min(1, 0.5 + distance / range)) * 255);
}
function validateRaster(width, height, range) {
  if (
    ![width, height].every(
      (v) => Number.isSafeInteger(v) && v > 0 && v <= 4096,
    ) ||
    width * height > 4194304 ||
    !Number.isFinite(range) ||
    range < 1 ||
    range > 256
  )
    throw new RangeError('Distance raster exceeds budget.');
}

/** Real RGB edge-colored distance field for owned polygon outlines, even-odd fill. */
export function multiChannelDistanceField(contours, width, height, range) {
  validateRaster(width, height, range);
  if (!Array.isArray(contours) || !contours.length || contours.length > 128)
    throw new RangeError('Invalid outline contours.');
  let count = 0;
  for (const contour of contours) {
    if (!Array.isArray(contour) || contour.length < 3 || contour.length > 4096)
      throw new RangeError('Contours require 3..4096 vertices.');
    for (const point of contour)
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        !point.every((v) => Number.isFinite(v) && Math.abs(v) <= 65536)
      )
        throw new RangeError('Invalid outline vertex.');
    count += contour.length;
  }
  if (count > 2048 || count * width * height > 64000000)
    throw new RangeError('Outline distance work exceeds budget.');
  const edges = [];
  for (const contour of contours) {
    // All contours were preflighted before nesting and geometry analysis.
    const area = contour.reduce((sum, a, i) => {
      const b = contour[(i + 1) % contour.length];
      return sum + a[0] * b[1] - a[1] * b[0];
    }, 0);
    if (Math.abs(area) < 1e-8)
      throw new RangeError('Degenerate outline contour.');
    let nesting = 0;
    const probe = contour[0];
    for (const other of contours)
      if (other !== contour) {
        let contained = false;
        for (let i = 0; i < other.length; i++) {
          const a = other[i],
            b = other[(i + 1) % other.length];
          if (
            a[1] > probe[1] !== b[1] > probe[1] &&
            probe[0] <
              ((b[0] - a[0]) * (probe[1] - a[1])) / (b[1] - a[1]) + a[0]
          )
            contained = !contained;
        }
        if (contained) nesting++;
      }
    const orientation = Math.sign(area) * (nesting % 2 ? -1 : 1);
    for (let i = 0; i < contour.length; i++) {
      const a = contour[i],
        b = contour[(i + 1) % contour.length];
      if (a[0] === b[0] && a[1] === b[1])
        throw new RangeError('Degenerate outline edge.');
      const color = i === contour.length - 1 && i % 3 === 0 ? 1 : i % 3;
      edges.push({
        a,
        b,
        mask: [6, 5, 3][color],
        orientation,
        contour,
        index: i,
      });
    }
  }
  const cross = (a, b, p) =>
    (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  for (let i = 0; i < edges.length; i++)
    for (let j = i + 1; j < edges.length; j++) {
      const first = edges[i],
        second = edges[j];
      if (
        first.contour === second.contour &&
        (j === i + 1 ||
          (first.index === 0 && second.index === first.contour.length - 1))
      )
        continue;
      const { a, b } = first,
        c = second.a,
        d = second.b;
      if (
        Math.max(a[0], b[0]) < Math.min(c[0], d[0]) ||
        Math.max(c[0], d[0]) < Math.min(a[0], b[0]) ||
        Math.max(a[1], b[1]) < Math.min(c[1], d[1]) ||
        Math.max(c[1], d[1]) < Math.min(a[1], b[1])
      )
        continue;
      if (
        cross(a, b, c) * cross(a, b, d) <= 0 &&
        cross(c, d, a) * cross(c, d, b) <= 0
      )
        throw new RangeError(
          'Outline contours must be simple and non-touching.',
        );
    }
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const px = x + 0.5,
        py = y + 0.5,
        nearest = [Infinity, Infinity, Infinity],
        distances = [0, 0, 0];
      for (const { a, b, mask, orientation } of edges) {
        const dx = b[0] - a[0],
          dy = b[1] - a[1],
          length = Math.hypot(dx, dy);
        const projection =
          ((px - a[0]) * dx + (py - a[1]) * dy) / (length * length);
        const t = Math.max(0, Math.min(1, projection));
        const distance = Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
        const perpendicular =
          ((dx * (py - a[1]) - dy * (px - a[0])) / length) * orientation;
        // Endpoint pseudo-distance extends the supporting edge through sharp corners.
        const signed =
          projection < 0 || projection > 1
            ? perpendicular
            : Math.sign(perpendicular || 1) * distance;
        for (let c = 0; c < 3; c++)
          if (mask & (1 << c)) {
            if (
              distance < nearest[c] ||
              (distance === nearest[c] &&
                Math.abs(signed) < Math.abs(distances[c]))
            ) {
              nearest[c] = distance;
              distances[c] = signed;
            }
          }
      }
      const offset = (y * width + x) * 4;
      for (let c = 0; c < 3; c++)
        rgba[offset + c] = encode(distances[c], range);
      rgba[offset + 3] = 255;
    }
  return rgba;
}
