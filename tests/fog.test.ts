import { describe, expect, it } from 'vitest';
import {
  fillFogData,
  validateRenderSettings,
} from '../packages/core/src/render-data.js';
import { FogSettings } from '../packages/core/src/render-settings.js';
import { Scene } from '../packages/core/src/scene.js';

describe('FogSettings', () => {
  it('is disabled by default and validates every mutable field', () => {
    const fog = new FogSettings();
    expect(fog.enabled).toBe(false);
    for (const change of [
      () => (fog.mode = 'log' as 'linear'),
      () => (fog.color = [2, 0, 0]),
      () => (fog.color = [0, 0] as unknown as [number, number, number]),
      () => (fog.near = -1),
      () => (fog.density = Number.NaN),
      () => {
        fog.mode = 'linear';
        fog.color = [0.5, 0.5, 0.5];
        fog.near = 10;
        fog.far = 10;
      },
    ]) {
      const candidate = new FogSettings();
      Object.assign(fog, candidate);
      change();
      expect(() => fog.validate()).toThrow();
    }
  });

  it('allows exp2 fog without a far distance ordering', () => {
    const fog = new FogSettings({
      mode: 'exp2',
      near: 5,
      far: 5,
      density: 0.1,
    });
    expect(() => fog.validate()).not.toThrow();
  });

  it('is validated with the rest of the scene render settings', () => {
    const scene = new Scene();
    scene.fog.far = scene.fog.near;
    expect(() => validateRenderSettings(scene)).toThrow(/far/);
  });
});

describe('fillFogData', () => {
  it('packs mode, distances and color', () => {
    const scene = new Scene();
    const out = new Float32Array(8);
    fillFogData(scene, out);
    expect(out[3]).toBe(0);
    scene.fog.enabled = true;
    scene.fog.color = [1, 0.5, 0];
    scene.fog.near = 2;
    scene.fog.far = 20;
    fillFogData(scene, out);
    expect([...out.slice(0, 7)]).toEqual(
      [1, 0.5, 0, 1, 2, 20, 0.02].map((x) => expect.closeTo(x, 5)),
    );
    scene.fog.mode = 'exp2';
    fillFogData(scene, out);
    expect(out[3]).toBe(2);
  });

  it('decodes the display color to linear when post-processing is on', () => {
    const scene = new Scene();
    scene.fog.color = [0.5, 0.5, 0.5];
    const out = new Float32Array(8);
    fillFogData(scene, out);
    expect(out[0]).toBeCloseTo(0.5);
    scene.postProcessing.enabled = true;
    fillFogData(scene, out);
    expect(out[0]).toBeCloseTo(0.214, 3); // sRGB 0.5 -> linear
  });

  it('rejects undersized output', () => {
    expect(() => fillFogData(new Scene(), new Float32Array(4))).toThrow(
      RangeError,
    );
  });
});
