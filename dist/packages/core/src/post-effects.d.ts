import { PostProcessingSettings } from './render-settings.js';
import { ColorGradingSettings, type ToneMapper } from './color-grading.js';
import { VolumetricFogSettings } from './volumetric-fog.js';
import { LensFlareSettings } from './lens-flare.js';
import { MotionBlurSettings } from './motion-blur.js';
export interface PostEffectsOptions {
    toneMapper?: ToneMapper;
    colorGrading?: ColorGradingSettings;
    volumetricFog?: VolumetricFogSettings;
    lensFlare?: LensFlareSettings;
    motionBlur?: MotionBlurSettings;
}
/** Additive effects without changing published 1.x PostProcessingSettings shapes. */
export declare class PostEffectsSettings {
    toneMapper: ToneMapper | undefined;
    colorGrading: ColorGradingSettings | undefined;
    volumetricFog: VolumetricFogSettings | undefined;
    lensFlare: LensFlareSettings | undefined;
    motionBlur: MotionBlurSettings | undefined;
    constructor(options?: PostEffectsOptions);
    validate(): void;
}
/** Attach or remove optional native effects; the existing enabled flag gates them all. */
export declare function setPostEffects(settings: PostProcessingSettings, value?: PostEffectsSettings): void;
/** Borrow the attached mutable settings; renderers revalidate before use. */
export declare function getPostEffects(settings: PostProcessingSettings): PostEffectsSettings | undefined;
