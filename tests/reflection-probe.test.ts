import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { EnvironmentMap } from '../packages/core/src/environment.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { ReflectionProbe } from '../packages/core/src/reflection-probe.js';
import {
  fillProbeBlendData,
  fillReflectionProbeWeights,
  selectReflectionProbes,
  validateRenderSettings,
} from '../packages/core/src/render-data.js';
import { Scene } from '../packages/core/src/scene.js';

const environment = (): EnvironmentMap =>
  EnvironmentMap.gradient({
    width: 8,
    zenith: [0, 0, 1],
    horizon: [0, 0, 1],
    ground: [0, 0, 1],
  });
const mesh = (): Mesh =>
  new Mesh({
    geometry: Geometry.quad(),
    material: new TextureMaterial({
      texture: Object.create(Texture.prototype) as Texture,
    }),
  });
function probe(map: EnvironmentMap, x: number): ReflectionProbe {
  return new ReflectionProbe({
    environment: map,
    position: [x, 0, 0],
    min: [-2, -2, -2],
    max: [2, 2, 2],
  });
}

describe('ReflectionProbe', () => {
  it('rejects invalid mutable bounds before drawing and resumes after repair', () => {
    const scene = new Scene(),
      map = environment(),
      local = probe(map, 0);
    scene.reflectionProbes.push(local);
    local.max.x = local.min.x;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
    local.max.x = 2;
    validateRenderSettings(scene);
    local.position.z = 3;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
    scene.destroy();
    map.destroy();
  });
});

describe('Spatial reflection probe blending', () => {
  it('fades continuously at all influence boundaries and retains the environment remainder', () => {
    const scene = new Scene(),
      map = environment(),
      local = probe(map, 0);
    local.blendDistance = 1;
    scene.reflectionProbes.push(local);
    const selected: ReflectionProbe[] = [],
      weights = new Float32Array(5);
    selectReflectionProbes(scene, selected);
    for (const position of [
      [2, 0, 0],
      [-2, 0, 0],
      [0, 2, 0],
      [0, -2, 0],
      [0, 0, 2],
      [0, 0, -2],
    ]) {
      fillReflectionProbeWeights(
        selected,
        position[0],
        position[1],
        position[2],
        weights,
      );
      expect(Array.from(weights)).toEqual([1, 0, 0, 0, 0]);
    }
    fillReflectionProbeWeights(selected, 1.5, 0, 0, weights);
    expect(Array.from(weights)).toEqual([0.5, 0.5, 0, 0, 0]);
    fillReflectionProbeWeights(selected, 1.999, 0, 0, weights);
    expect(weights[1]).toBeGreaterThan(0);
    expect(weights[1]).toBeLessThan(0.00001);
    fillReflectionProbeWeights(selected, 2.001, 0, 0, weights);
    expect(weights[0]).toBe(1);
    expect(weights[1]).toBe(0);
    scene.destroy();
    map.destroy();
  });

  it('normalizes overlap without double attenuation and blends distinct positions on one large mesh', () => {
    const scene = new Scene(),
      map = environment();
    scene.reflectionProbes.push(probe(map, -1), probe(map, 1));
    const selected: ReflectionProbe[] = [],
      weights = new Float32Array(5);
    selectReflectionProbes(scene, selected);
    fillReflectionProbeWeights(selected, 0, 0, 0, weights);
    expect(Array.from(weights)).toEqual([0, 0.5, 0.5, 0, 0]);
    fillReflectionProbeWeights(selected, 1.75, 0, 0, weights);
    expect(weights[0]).toBeCloseTo(0.6875);
    expect(weights[1]).toBeCloseTo(0.15625);
    expect(weights[2]).toBeCloseTo(0.15625);
    expect(weights[0] + weights[1] + weights[2]).toBeCloseTo(1);
    const object = scene.add(mesh());
    object.position.x = 100;
    expect(selectReflectionProbes(scene, selected)).toEqual(
      scene.reflectionProbes,
    );
    scene.destroy();
    map.destroy();
  });

  it('uses four stable active scene probes and clears removed records on buffer reuse', () => {
    const scene = new Scene(),
      map = environment(),
      baseline = environment();
    scene.environment = baseline;
    scene.environmentIntensity = 0.25;
    for (let i = 0; i < 6; i++) scene.reflectionProbes.push(probe(map, 0));
    scene.reflectionProbes[0].enabled = false;
    const selected: ReflectionProbe[] = [],
      data = new Float32Array(264);
    selectReflectionProbes(scene, selected);
    expect(selected).toEqual(scene.reflectionProbes.slice(1, 5));
    selected[0].intensity = 2;
    selected[0].blendDistance = 0.5;
    data.fill(7);
    expect(fillProbeBlendData(scene, data, 4, selected)).toBe(baseline);
    expect(data[4 + 36]).toBe(0.25);
    expect(data[4 + 52 + 36]).toBe(2);
    expect(data[4 + 52 + 43]).toBe(0.5);
    expect(data[0]).toBe(7);
    map.destroy();
    selectReflectionProbes(scene, selected);
    expect(selected).toEqual([]);
    fillProbeBlendData(scene, data, 4, selected);
    expect(Array.from(data.subarray(4 + 52))).toEqual(Array(208).fill(0));
    scene.environment = undefined;
    fillProbeBlendData(scene, data, 4, selected);
    expect(Array.from(data.subarray(4))).toEqual(Array(260).fill(0));
    scene.destroy();
    baseline.destroy();
  });
});
