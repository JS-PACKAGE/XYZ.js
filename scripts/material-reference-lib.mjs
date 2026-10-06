import { comparePixels, parityThresholds } from './pixel-parity.mjs';

export const materialReferenceNames = Object.freeze([
  'roughness-metallic-grid',
  'finish-grid',
  'gltf-sample-like',
  'procedural-preset-grid',
]);
export const materialReferenceRenderers = Object.freeze(['webgl2', 'webgpu']);
export const referenceTileSize = 8;

function requireValue(condition, message) {
  if (!condition) throw new Error(`Material reference: ${message}`);
}
function percentile(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.99) - 1];
}
function intensity(histogram, count, sum) {
  let cumulative = 0;
  for (let value = 0; value < 256; value++) {
    cumulative += histogram[value];
    if (cumulative >= Math.ceil(count * 0.99))
      return { mean: sum / count, p99: value };
  }
  throw new Error('Material reference: empty intensity histogram.');
}
function validateDimensions(width, height) {
  requireValue(width === 128 && height === 128, 'captures must be 128x128.');
}
export function validatePixels(pixels, width, height) {
  validateDimensions(width, height);
  requireValue(
    (Array.isArray(pixels) || ArrayBuffer.isView(pixels)) &&
      pixels.length === width * height * 4,
    'pixel dimensions/buffer lengths disagree.',
  );
  let visible = false;
  for (let index = 0; index < pixels.length; index++) {
    const value = pixels[index];
    requireValue(
      Number.isInteger(value) && value >= 0 && value <= 255,
      'pixel channel must be an unsigned byte.',
    );
    if (index % 4 !== 3 && value > 0) visible = true;
  }
  requireValue(visible, 'zero/unavailable RGB capture.');
}

/** Byte-domain intensity statistics, with row-major 8x8 spatial tiles. */
export function summarizePixels(pixels, width, height) {
  validatePixels(pixels, width, height);
  const channels = [];
  for (let channel = 0; channel < 3; channel++) {
    const histogram = new Uint32Array(256);
    let sum = 0;
    const tileMeans = [],
      tileP99s = [];
    for (let top = 0; top < height; top += referenceTileSize) {
      for (let left = 0; left < width; left += referenceTileSize) {
        const tileHistogram = new Uint32Array(256);
        let tileSum = 0;
        for (let y = top; y < top + referenceTileSize; y++) {
          for (let x = left; x < left + referenceTileSize; x++) {
            const value = pixels[(y * width + x) * 4 + channel];
            histogram[value]++;
            tileHistogram[value]++;
            sum += value;
            tileSum += value;
          }
        }
        const tile = intensity(tileHistogram, referenceTileSize ** 2, tileSum);
        tileMeans.push(tile.mean);
        tileP99s.push(tile.p99);
      }
    }
    channels.push({
      ...intensity(histogram, width * height, sum),
      tileMeans,
      tileP99s,
    });
  }
  return { width, height, channels };
}

export function validateSummary(summary) {
  requireValue(summary && typeof summary === 'object', 'missing summary.');
  validateDimensions(summary.width, summary.height);
  requireValue(
    Array.isArray(summary.channels) && summary.channels.length === 3,
    'summary requires three RGB channels.',
  );
  for (const channel of summary.channels) {
    requireValue(
      channel &&
        Number.isFinite(channel.mean) &&
        channel.mean >= 0 &&
        channel.mean <= 255 &&
        Number.isInteger(channel.p99) &&
        channel.p99 >= 0 &&
        channel.p99 <= 255,
      'invalid channel intensity summary.',
    );
    for (const key of ['tileMeans', 'tileP99s']) {
      requireValue(
        Array.isArray(channel[key]) &&
          channel[key].length === 256 &&
          channel[key].every(
            (value) =>
              Number.isFinite(value) &&
              value >= 0 &&
              value <= 255 &&
              (key !== 'tileP99s' || Number.isInteger(value)),
          ),
        `invalid ${key} summary.`,
      );
    }
    const tileMean =
      channel.tileMeans.reduce((sum, value) => sum + value, 0) / 256;
    requireValue(
      Math.abs(tileMean - channel.mean) < 1e-10,
      'inconsistent mean/tile summary.',
    );
  }
  requireValue(
    summary.channels.some((channel) => channel.mean > 0),
    'zero/unavailable summary.',
  );
  return summary;
}

export function validateScenarioNames(scenarios) {
  requireValue(
    Array.isArray(scenarios) &&
      scenarios.length === materialReferenceNames.length,
    'missing or extra scenarios.',
  );
  const names = scenarios.map((scenario) => scenario?.name);
  requireValue(
    new Set(names).size === names.length &&
      materialReferenceNames.every((name) => names.includes(name)),
    'scenario names disagree.',
  );
}
export function validateCapture(report, renderer) {
  requireValue(
    report && report.renderer === renderer && !report.error,
    report?.error ?? 'renderer unavailable or incorrect.',
  );
  validateScenarioNames(report.scenarios);
  for (const scenario of report.scenarios) {
    validatePixels(scenario.pixels, scenario.width, scenario.height);
    validatePixels(scenario.repeat, scenario.width, scenario.height);
    requireValue(
      typeof scenario.png === 'string' &&
        /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(scenario.png),
      'missing native PNG proof.',
    );
  }
  return report;
}
export function validateGolden(golden) {
  requireValue(
    golden && golden.version === 1 && golden.tileSize === referenceTileSize,
    'unsupported golden schema/version.',
  );
  requireValue(
    golden.renderers &&
      Object.keys(golden.renderers).length === 2 &&
      materialReferenceRenderers.every((renderer) =>
        Object.hasOwn(golden.renderers, renderer),
      ),
    'golden must contain both native backends.',
  );
  for (const renderer of materialReferenceRenderers) {
    validateScenarioNames(golden.renderers[renderer]);
    for (const scenario of golden.renderers[renderer])
      validateSummary(scenario);
  }
  return golden;
}

function deltaStats(actual, expected) {
  const errors = actual.map((value, index) =>
    Math.abs(value - expected[index]),
  );
  return {
    mean: errors.reduce((sum, value) => sum + value, 0) / errors.length,
    p99: percentile(errors),
  };
}
export function compareSummaries(actual, expected) {
  validateSummary(actual);
  validateSummary(expected);
  const channels = actual.channels.map((channel, index) => {
    const golden = expected.channels[index];
    return {
      mean: Math.abs(channel.mean - golden.mean),
      p99: Math.abs(channel.p99 - golden.p99),
      tileMeans: deltaStats(channel.tileMeans, golden.tileMeans),
      tileP99s: deltaStats(channel.tileP99s, golden.tileP99s),
    };
  });
  return {
    channels,
    pass: channels.every(
      (channel) =>
        channel.mean <= parityThresholds.mean &&
        channel.p99 <= parityThresholds.p99 &&
        channel.tileMeans.mean <= parityThresholds.mean &&
        channel.tileMeans.p99 <= parityThresholds.p99 &&
        channel.tileP99s.mean <= parityThresholds.mean &&
        channel.tileP99s.p99 <= parityThresholds.p99,
    ),
  };
}

export function summarizeCapture(report, renderer) {
  validateCapture(report, renderer);
  return materialReferenceNames.map((name) => {
    const scenario = report.scenarios.find(
      (candidate) => candidate.name === name,
    );
    return {
      name,
      ...summarizePixels(scenario.pixels, scenario.width, scenario.height),
    };
  });
}
export function compareReferencePixels(a, b) {
  requireValue(a.name === b.name, 'pixel scenario names disagree.');
  validatePixels(a.pixels, a.width, a.height);
  validatePixels(b.pixels, b.width, b.height);
  const measured = comparePixels(a.pixels, b.pixels, a.width, a.height);
  if (a.name !== 'procedural-preset-grid') return measured;
  let maxChannelDelta = 0,
    changedPixels = 0;
  const changedChannelPixels = [0, 0, 0];
  for (let offset = 0; offset < a.pixels.length; offset += 4) {
    let changed = false;
    for (let channel = 0; channel < 3; channel++) {
      const delta = Math.abs(
        a.pixels[offset + channel] - b.pixels[offset + channel],
      );
      maxChannelDelta = Math.max(maxChannelDelta, delta);
      changed ||= delta !== 0;
      if (delta !== 0) changedChannelPixels[channel]++;
    }
    if (changed) changedPixels++;
  }
  const changedPixelRatio = changedPixels / (a.width * a.height);
  const changedChannelPixelRatios = changedChannelPixels.map(
    (count) => count / (a.width * a.height),
  );
  return {
    ...measured,
    strictPass: measured.pass,
    maxChannelDelta,
    changedPixels,
    changedPixelRatio,
    changedChannelPixels,
    changedChannelPixelRatios,
    allowance: {
      maxChannelDelta: 1,
      maxChangedChannelPixelRatio: 0.002,
      p99: 0,
    },
    pass:
      maxChannelDelta <= 1 &&
      changedChannelPixelRatios.every((ratio) => ratio <= 0.002) &&
      measured.channels.every((channel) => channel.p99 === 0),
  };
}

/** Actual corpus bytes must reject larger deltas, excess sparse errors and flips. */
export function referencePixelSelfTest(scene) {
  requireValue(
    scene.name === 'procedural-preset-grid',
    'sparse control requires procedural corpus.',
  );
  const deltaTwo = Uint8Array.from(scene.pixels);
  deltaTwo[0] += deltaTwo[0] <= 253 ? 2 : -2;
  const excess = Uint8Array.from(scene.pixels);
  const count = Math.floor(scene.width * scene.height * 0.002) + 1;
  for (let pixel = 0; pixel < count; pixel++)
    excess[pixel * 4] += excess[pixel * 4] < 255 ? 1 : -1;
  const flipped = new Uint8Array(scene.pixels.length);
  for (let y = 0; y < scene.height; y++)
    flipped.set(
      scene.pixels.slice(y * scene.width * 4, (y + 1) * scene.width * 4),
      (scene.height - y - 1) * scene.width * 4,
    );
  const controls = {
    deltaTwo: compareReferencePixels(scene, { ...scene, pixels: deltaTwo }),
    excessPixels: compareReferencePixels(scene, { ...scene, pixels: excess }),
    flip: compareReferencePixels(scene, { ...scene, pixels: flipped }),
  };
  requireValue(
    Object.values(controls).every((control) => !control.pass),
    'sparse comparator accepted a negative control.',
  );
  return controls;
}
