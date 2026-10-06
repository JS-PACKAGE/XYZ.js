import { describe, expect, it } from 'vitest';
import { ColorLUT3D, ColorGradingSettings, PostEffectsSettings } from '../src/index.js';

describe('3D color grading', () => {
  it('lays red-fast .cube data into horizontal blue slices', () => {
    const lut = ColorLUT3D.preset(16);
    const pixel = (15 * 16 * 16 + 7 * 16 + 3) * 4;
    expect(Array.from(lut.strip.slice(pixel, pixel + 4))).toEqual([51, 255, 119, 255]);
  });
  it('parses normalized .cube and rejects truncated or unsupported inputs', () => {
    const values = Array.from({ length: 16 ** 3 }, () => '0.2 0.4 0.6').join('\n');
    const lut = ColorLUT3D.parseCube(`TITLE "fixture"\nLUT_3D_SIZE 16\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n${values}`);
    expect(Array.from(lut.strip.slice(0, 4))).toEqual([51, 102, 153, 255]);
    expect(() => ColorLUT3D.parseCube('LUT_3D_SIZE 16\n0 0 0')).toThrow();
    expect(() => ColorLUT3D.parseCube('LUT_1D_SIZE 16')).toThrow();
    expect(() => ColorLUT3D.preset(15)).toThrow();
  });
  it('validates mutable grading and tonemapping settings', () => {
    const grading = new ColorGradingSettings(ColorLUT3D.preset());
    const post = new PostEffectsSettings({ colorGrading: grading, toneMapper: 'agx' });
    grading.strength = NaN;
    expect(() => post.validate()).toThrow();
  });
});
