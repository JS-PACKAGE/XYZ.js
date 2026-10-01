import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { EnvironmentMap } from '../packages/core/src/environment.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import {
  ReflectionProbe,
  selectReflectionProbe,
} from '../packages/core/src/reflection-probe.js';
import { validateRenderSettings } from '../packages/core/src/render-data.js';
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
  it('uses world origins, resolves equal-distance overlaps stably and respects inclusive bounds', () => {
    const scene = new Scene(),
      map = environment();
    const first = probe(map, -1),
      second = probe(map, 1);
    scene.reflectionProbes.push(first, second);
    const parent = scene.add(new Group()),
      object = parent.add(mesh());
    expect(selectReflectionProbe(scene, object)).toBe(first);
    parent.position.x = 0.8;
    expect(selectReflectionProbe(scene, object)).toBe(second);
    parent.position.x = 2;
    expect(selectReflectionProbe(scene, object)).toBe(second);
    parent.position.x = 2.0001;
    expect(selectReflectionProbe(scene, object)).toBeUndefined();
    scene.destroy();
    map.destroy();
  });

  it('drops disabled and destroyed maps without retaining a previously selected probe', () => {
    const scene = new Scene(),
      a = environment(),
      b = environment();
    const first = probe(a, 0),
      second = probe(b, 1),
      object = scene.add(mesh());
    scene.reflectionProbes.push(first, second);
    expect(selectReflectionProbe(scene, object)).toBe(first);
    first.enabled = false;
    expect(selectReflectionProbe(scene, object)).toBe(second);
    first.enabled = true;
    a.destroy();
    expect(selectReflectionProbe(scene, object)).toBe(second);
    b.destroy();
    expect(selectReflectionProbe(scene, object)).toBeUndefined();
    scene.destroy();
  });

  it('rejects invalid mutable bounds before drawing and resumes after repair', () => {
    const scene = new Scene(),
      map = environment(),
      local = probe(map, 0);
    scene.reflectionProbes.push(local);
    local.max.x = local.min.x;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
    local.max.x = 2;
    validateRenderSettings(scene);
    expect(selectReflectionProbe(scene, mesh())).toBe(local);
    local.position.z = 3;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
    scene.destroy();
    map.destroy();
  });
});
