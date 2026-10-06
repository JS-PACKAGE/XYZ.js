import { describe, expect, it } from 'vitest';
import {
  materialReferenceNames,
  summarizePixels,
  compareSummaries,
  validateSummary,
  validateGolden,
  validateCapture,
  compareReferencePixels,
  referencePixelSelfTest,
} from '../scripts/material-reference-lib.mjs';
import { parityThresholds } from '../scripts/pixel-parity.mjs';

function pixels(value = 32) {
  const result = new Uint8Array(128 * 128 * 4);
  for (let offset = 0; offset < result.length; offset += 4)
    result.set([value, value + 1, value + 2, 255], offset);
  return result;
}
function capture(renderer = 'webgl2') {
  return {
    renderer,
    scenarios: materialReferenceNames.map((name) => ({
      name,
      width: 128,
      height: 128,
      pixels: pixels(),
      repeat: pixels(),
      png: 'data:image/png;base64,iVBORw0KGgo=',
    })),
  };
}
function golden() {
  return {
    version: 1,
    tileSize: 8,
    renderers: Object.fromEntries(
      ['webgl2', 'webgpu'].map((renderer) => [
        renderer,
        materialReferenceNames.map((name) => ({
          name,
          ...summarizePixels(pixels(), 128, 128),
        })),
      ]),
    ),
  };
}

describe('material reference numeric qualification', () => {
  it('records RGB intensity and row-major 8x8 nearest-rank p99 tiles', () => {
    const image = pixels();
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 128; x++) image[(y * 128 + x) * 4] = x;
    const summary = summarizePixels(image, 128, 128);
    expect(summary.channels[0].mean).toBe(63.5);
    expect(summary.channels[0].p99).toBe(126);
    expect(summary.channels[0].tileMeans).toHaveLength(256);
    expect(summary.channels[0].tileMeans.slice(0, 3)).toEqual([
      3.5, 11.5, 19.5,
    ]);
    expect(summary.channels[0].tileP99s.slice(0, 3)).toEqual([7, 15, 23]);
    expect(summary.channels[0].tileMeans[16]).toBe(3.5);
    expect(validateSummary(summary)).toBe(summary);
  });
  it('reports absolute golden errors per channel without weakening peer thresholds', () => {
    expect(parityThresholds).toEqual({ mean: 0.001, p99: 1 });
    const normal = summarizePixels(pixels(), 128, 128);
    expect(compareSummaries(normal, normal).pass).toBe(true);
    const changed = summarizePixels(pixels(36), 128, 128);
    const comparison = compareSummaries(changed, normal);
    expect(comparison.pass).toBe(false);
    expect(comparison.channels[0]).toEqual({
      mean: 4,
      p99: 4,
      tileMeans: { mean: 4, p99: 4 },
      tileP99s: { mean: 4, p99: 4 },
    });
    const a = capture().scenarios[0];
    expect(compareReferencePixels(a, { ...a, pixels: pixels(36) }).pass).toBe(
      false,
    );
    expect(compareReferencePixels(a, a).pass).toBe(true);
  });
  it('bounds only the new procedural corpus to one byte in at most 0.2% pixels per channel', () => {
    const scene = { ...capture().scenarios[0], name: 'procedural-preset-grid' };
    const sparse = pixels();
    for (let pixel = 0; pixel < 32; pixel++) sparse[pixel * 4]++;
    const allowed = compareReferencePixels(scene, { ...scene, pixels: sparse });
    expect(allowed.pass).toBe(true);
    expect(allowed.strictPass).toBe(false);
    expect(allowed.changedPixels).toBe(32);
    const disjoint = pixels();
    for (let channel = 0; channel < 3; channel++)
      for (let pixel = 0; pixel < 32; pixel++)
        disjoint[(channel * 32 + pixel) * 4 + channel]++;
    const union = compareReferencePixels(scene, { ...scene, pixels: disjoint });
    expect(union.pass).toBe(true);
    expect(union.changedPixels).toBe(96);
    expect(union.changedChannelPixels).toEqual([32, 32, 32]);
    expect(
      compareReferencePixels(
        { ...scene, name: 'finish-grid' },
        { ...scene, name: 'finish-grid', pixels: sparse },
      ).pass,
    ).toBe(false);
    sparse[32 * 4]++;
    expect(
      compareReferencePixels(scene, { ...scene, pixels: sparse }).pass,
    ).toBe(false);
    const deltaTwo = pixels();
    deltaTwo[0] += 2;
    expect(
      compareReferencePixels(scene, { ...scene, pixels: deltaTwo }).pass,
    ).toBe(false);
    const asymmetric = pixels();
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 128; x++) asymmetric[(y * 128 + x) * 4] = y;
    const controls = referencePixelSelfTest({ ...scene, pixels: asymmetric });
    expect(Object.values(controls).every((control) => !control.pass)).toBe(
      true,
    );
  });
  it('rejects spatial perturbations even when whole-image intensity statistics match', () => {
    const normal = pixels();
    const perturbed = pixels();
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        normal[(y * 128 + x) * 4] = x < 64 ? 10 : 200;
        perturbed[(y * 128 + x) * 4] = x < 64 ? 200 : 10;
      }
    }
    const comparison = compareSummaries(
      summarizePixels(perturbed, 128, 128),
      summarizePixels(normal, 128, 128),
    );
    expect(comparison.channels[0].mean).toBe(0);
    expect(comparison.channels[0].p99).toBe(0);
    expect(comparison.channels[0].tileMeans).toEqual({ mean: 190, p99: 190 });
    expect(comparison.channels[0].tileP99s).toEqual({ mean: 190, p99: 190 });
    expect(comparison.pass).toBe(false);
  });
  it('rejects zero, unavailable, invalid bytes, and mismatched dimensions', () => {
    expect(() =>
      summarizePixels(new Uint8Array(128 * 128 * 4), 128, 128),
    ).toThrow(/zero\/unavailable/);
    expect(() => summarizePixels(pixels(), 64, 256)).toThrow(/128x128/);
    expect(() => summarizePixels([], 128, 128)).toThrow(/buffer lengths/);
    const malformed = Array.from(pixels());
    malformed[3] = 256;
    expect(() => summarizePixels(malformed, 128, 128)).toThrow(/unsigned byte/);
    expect(() =>
      validateCapture({ ...capture(), error: 'GPU unavailable' }, 'webgl2'),
    ).toThrow(/GPU unavailable/);
    expect(() => validateCapture(capture(), 'webgpu')).toThrow(/renderer/);
    const missing = capture();
    missing.scenarios[0].repeat = [];
    expect(() => validateCapture(missing, 'webgl2')).toThrow(/buffer lengths/);
  });
  it('validates golden backend, dimensions, names, channels and spatial schema', () => {
    const valid = golden();
    expect(validateGolden(valid)).toBe(valid);
    for (const mutate of [
      (value) => {
        value.version = 2;
      },
      (value) => {
        value.tileSize = 16;
      },
      (value) => {
        delete value.renderers.webgpu;
      },
      (value) => {
        value.renderers.webgl2.pop();
      },
      (value) => {
        value.renderers.webgl2[0].name = value.renderers.webgl2[1].name;
      },
      (value) => {
        value.renderers.webgl2[0].name = 'unknown';
      },
      (value) => {
        value.renderers.webgl2[0].width = 64;
      },
      (value) => {
        value.renderers.webgl2[0].channels.pop();
      },
      (value) => {
        value.renderers.webgl2[0].channels[0].p99 = NaN;
      },
      (value) => {
        value.renderers.webgl2[0].channels[0].tileMeans.pop();
      },
      (value) => {
        value.renderers.webgl2[0].channels[0].tileP99s[0] = 1.5;
      },
      (value) => {
        value.renderers.webgl2[0].channels[0].mean += 1;
      },
    ]) {
      const malformed = globalThis.structuredClone(valid);
      mutate(malformed);
      expect(() => validateGolden(malformed)).toThrow(/Material reference/);
    }
    const zero = globalThis.structuredClone(valid);
    for (const channel of zero.renderers.webgl2[0].channels) {
      channel.mean = 0;
      channel.p99 = 0;
      channel.tileMeans.fill(0);
      channel.tileP99s.fill(0);
    }
    expect(() => validateGolden(zero)).toThrow(/zero\/unavailable/);
  });
  it('rejects malformed capture names and missing PNG proof', () => {
    const report = capture();
    expect(validateCapture(report, 'webgl2')).toBe(report);
    report.scenarios[0].name = report.scenarios[1].name;
    expect(() => validateCapture(report, 'webgl2')).toThrow(/names/);
    report.scenarios[0].name = materialReferenceNames[0];
    report.scenarios[0].png = '';
    expect(() => validateCapture(report, 'webgl2')).toThrow(/PNG/);
  });
});
