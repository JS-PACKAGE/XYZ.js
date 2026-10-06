import { describe, expect, it } from 'vitest';
import { Scene, VolumetricFogSettings, PostEffectsSettings, setPostEffects, Vector3 } from '../src/index.js';
import { writeVolumetricUniforms } from '../packages/graphics/src/volumetric-post.js';

describe('native volumetric fog', () => {
  it('validates bounds and mutable settings', () => {
    expect(() => new VolumetricFogSettings({ fogSamples: 65 })).toThrow();
    expect(() => new VolumetricFogSettings({ heightFalloff: -1 })).toThrow();
    const fog = new VolumetricFogSettings();
    const post = new PostEffectsSettings({ volumetricFog: fog });
    fog.color[0] = NaN;
    expect(() => post.validate()).toThrow();
  });
  it('projects directional shafts and disables back-facing light', () => {
    const scene = new Scene();
    scene.postProcessing.enabled = true;
    setPostEffects(scene.postProcessing, new PostEffectsSettings({ volumetricFog: new VolumetricFogSettings() }));
    scene.camera3D.updateMatrix(1);
    scene.directionalLight.direction = new Vector3(0, 0, -1);
    const data = new Float32Array(16);
    writeVolumetricUniforms(data, 0, scene);
    expect(data[8]).toBeCloseTo(0.5);
    expect(data[9]).toBeCloseTo(0.5);
    expect(data[10]).toBeGreaterThan(0);
    scene.directionalLight.direction.z = 1;
    writeVolumetricUniforms(data, 0, scene);
    expect(data[10]).toBe(0);
    scene.postProcessing.enabled = false;
    writeVolumetricUniforms(data, 0, scene);
    expect(Array.from(data)).toEqual(Array(16).fill(0));
    scene.destroy();
  });
});
