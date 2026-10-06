import { PostProcessingSettings } from './render-settings.js';
import { ColorGradingSettings, type ToneMapper } from './color-grading.js';
import { VolumetricFogSettings } from './volumetric-fog.js';
import { LensFlareSettings } from './lens-flare.js';

export interface PostEffectsOptions {
  toneMapper?: ToneMapper;
  colorGrading?: ColorGradingSettings;
  volumetricFog?: VolumetricFogSettings;
  lensFlare?: LensFlareSettings;
}

/** Additive effects without changing published 1.x PostProcessingSettings shapes. */
export class PostEffectsSettings {
  toneMapper: ToneMapper | undefined;
  colorGrading: ColorGradingSettings | undefined;
  volumetricFog: VolumetricFogSettings | undefined;
  lensFlare: LensFlareSettings | undefined;
  constructor(options: PostEffectsOptions = {}) {
    this.toneMapper = options.toneMapper;
    this.colorGrading = options.colorGrading;
    this.volumetricFog = options.volumetricFog;
    this.lensFlare = options.lensFlare;
    this.validate();
  }
  validate(): void {
    if (this.toneMapper !== undefined && this.toneMapper !== 'none' && this.toneMapper !== 'aces' && this.toneMapper !== 'agx' && this.toneMapper !== 'reinhard' && this.toneMapper !== 'neutral')
      throw new RangeError('Unknown post tone mapper.');
    if (this.colorGrading !== undefined && !(this.colorGrading instanceof ColorGradingSettings))
      throw new TypeError('Expected ColorGradingSettings.');
    if (this.volumetricFog !== undefined && !(this.volumetricFog instanceof VolumetricFogSettings))
      throw new TypeError('Expected VolumetricFogSettings.');
    this.colorGrading?.validate();
    this.volumetricFog?.validate();
    if (this.lensFlare !== undefined && !(this.lensFlare instanceof LensFlareSettings))
      throw new TypeError('Expected LensFlareSettings.');
    this.lensFlare?.validate();
  }
}

const effects = new WeakMap<PostProcessingSettings, PostEffectsSettings>();

/** Attach or remove optional native effects; the existing enabled flag gates them all. */
export function setPostEffects(settings: PostProcessingSettings, value?: PostEffectsSettings): void {
  if (!(settings instanceof PostProcessingSettings)) throw new TypeError('Expected PostProcessingSettings.');
  if (value === undefined) effects.delete(settings);
  else {
    if (!(value instanceof PostEffectsSettings)) throw new TypeError('Expected PostEffectsSettings.');
    value.validate();
    effects.set(settings, value);
  }
}

/** Borrow the attached mutable settings; renderers revalidate before use. */
export function getPostEffects(settings: PostProcessingSettings): PostEffectsSettings | undefined {
  return effects.get(settings);
}
