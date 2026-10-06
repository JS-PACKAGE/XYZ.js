import { describe, expect, it } from 'vitest';
import {
  LensFlareSettings,
  PostEffectsSettings,
  PostProcessingSettings,
  setPostEffects,
  getPostEffects,
} from '../src/index.js';

describe('bounded lens flare settings', () => {
  it('rejects unbounded and nonfinite kernels', () => {
    for (const ghosts of [0, 1.5, 9, Infinity])
      expect(() => new LensFlareSettings({ ghosts })).toThrow();
    expect(() => new LensFlareSettings({ haloWidth: 0 })).toThrow();
    expect(() => new LensFlareSettings({ threshold: NaN })).toThrow();
  });
  it('attaches isolated mutable native effects without changing legacy settings', () => {
    const settings = new PostProcessingSettings();
    const before = Object.keys(settings);
    const flare = new LensFlareSettings();
    const effects = new PostEffectsSettings({ lensFlare: flare });
    setPostEffects(settings, effects);
    expect(getPostEffects(settings)).toBe(effects);
    expect(Object.keys(settings)).toEqual(before);
    flare.ghosts = 100;
    expect(() => effects.validate()).toThrow();
    setPostEffects(settings);
    expect(getPostEffects(settings)).toBeUndefined();
  });
});
