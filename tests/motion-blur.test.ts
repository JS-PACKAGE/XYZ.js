import { describe, expect, it } from 'vitest';
import {
  MotionBlurSettings,
  PostEffectsSettings,
  PostProcessingSettings,
  PerspectiveCamera,
  Vector3,
  setPostEffects,
} from '../src/index.js';
import { TemporalPostState } from '../packages/graphics/src/temporal-post.js';
import { writeMotionBlurUniforms } from '../packages/graphics/src/motion-blur-post.js';

describe('camera-reprojected bounded motion blur', () => {
  it('validates samples, radius, strength and mutable settings', () => {
    for (const samples of [0, 2.5, 33])
      expect(() => new MotionBlurSettings({ samples })).toThrow();
    expect(() => new MotionBlurSettings({ maxRadius: 65 })).toThrow();
    const blur = new MotionBlurSettings();
    const effects = new PostEffectsSettings({ motionBlur: blur });
    blur.strength = NaN;
    expect(() => effects.validate()).toThrow();
  });
  it('reuses camera history without TAA jitter and invalidates camera cuts', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(0, 0, 4);
    camera.lookAt(new Vector3());
    const settings = new PostProcessingSettings({
      enabled: true,
      taa: false,
      taaCameraCutDistance: 2,
    });
    setPostEffects(
      settings,
      new PostEffectsSettings({ motionBlur: new MotionBlurSettings() }),
    );
    const state = new TemporalPostState();
    const scene = {};
    const data = new Float32Array(20);
    state.begin(scene, camera, 128, 128, settings);
    writeMotionBlurUniforms(data, 0, settings, state);
    expect(data[16]).toBe(0);
    state.commit();
    camera.position.x = 0.1;
    state.begin(scene, camera, 128, 128, settings);
    writeMotionBlurUniforms(data, 0, settings, state);
    expect(data[16]).toBe(1);
    expect(Array.from(state.jitter)).toEqual([0, 0]);
    const current = state.currentVP.transformPoint(
      new Vector3(),
      new Vector3(),
    );
    const previous = state.previousVP.transformPoint(
      new Vector3(),
      new Vector3(),
    );
    expect(Math.abs(current.x - previous.x)).toBeGreaterThan(0.01);
    state.commit();
    camera.position.x = 10;
    state.begin(scene, camera, 128, 128, settings);
    writeMotionBlurUniforms(data, 0, settings, state);
    expect(data[16]).toBe(0);
  });
});
