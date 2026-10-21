import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { InstancedMesh } from '../packages/core/src/instanced-mesh.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { Scene } from '../packages/core/src/scene.js';
import { PointLight, SpotLight } from '../packages/core/src/lights.js';
import { SpatialLightSelector } from '../packages/core/src/light-selection.js';
import { ShadowAtlas } from '../packages/core/src/shadow-atlas.js';
import { fillLightingData } from '../packages/core/src/render-data.js';
import { Matrix4, Vector3 } from '../packages/math/src/index.js';
import {
  LIGHTING_FLOAT_COUNT,
  LIGHTING_POINT_ID_OFFSET,
  POINT_LIGHT_OFFSET,
  SPOT_LIGHT_OFFSET,
  shadowLimits,
} from '../src/data/rendering.js';
import { lightSelectionLimits } from '../src/data/lights.js';

describe('bounded spatial light selection', () => {
  it('illuminates 24 separated local meshes with their own point and spot lights, not the first scene lights', () => {
    const scene = new Scene();
    const material = new TextureMaterial({
      texture: Object.create(Texture.prototype) as Texture,
    });
    const geometry = Geometry.quad(1, 1);
    for (let i = 0; i < 24; i++) {
      scene.pointLights.push(
        new PointLight({ position: [i * 20, 2, 0], range: 5 }),
      );
      scene.spotLights.push(
        new SpotLight({
          position: [i * 20, 2, 0],
          direction: [0, -1, 0],
          range: 5,
        }),
      );
    }
    const selector = new SpatialLightSelector();
    selector.update(scene);
    const data = new Float32Array(LIGHTING_FLOAT_COUNT);
    for (let i = 0; i < 24; i++) {
      const mesh = new Mesh({ geometry, material, position: [i * 20, 0, 0] });
      selector.selectMesh(mesh);
      expect(selector.pointLights).toEqual([scene.pointLights[i]]);
      expect(selector.spotLights).toEqual([scene.spotLights[i]]);
      fillLightingData(scene, data, selector);
      expect(data[POINT_LIGHT_OFFSET]).toBe(i * 20);
      expect(data[LIGHTING_POINT_ID_OFFSET]).toBe(scene.pointLights[i]!.id);
      expect(data[SPOT_LIGHT_OFFSET + 13]).toBe(scene.spotLights[i]!.id);
      expect(selector.stats.points).toEqual({
        pool: 24,
        selected: 1,
        culled: 23,
        overflow: 0,
      });
    }
    expect(selector.frameStats.points).toEqual({
      pool: 24,
      selected: 24,
      culled: 24 * 23,
      overflow: 0,
    });
  });
  it('selects lights for translated instances and refreshes mutable mesh world transforms', () => {
    const scene = new Scene();
    const light = new PointLight({ position: [100, 0, 0], range: 2 });
    scene.pointLights.push(light);
    const mesh = new InstancedMesh({
      geometry: Geometry.quad(1, 1),
      material: new TextureMaterial({
        texture: Object.create(Texture.prototype) as Texture,
      }),
      count: 1,
    });
    const matrix = new Matrix4();
    matrix.elements[12] = 100;
    mesh.setMatrixAt(0, matrix);
    const selector = new SpatialLightSelector();
    selector.update(scene);
    selector.selectMesh(mesh);
    expect(selector.pointLights).toEqual([light]);
    mesh.transform.position.x = 100;
    selector.selectMesh(mesh);
    expect(selector.pointLights).toEqual([]);
    const data = new Float32Array(LIGHTING_FLOAT_COUNT);
    fillLightingData(scene, data, selector);
    expect(data[8]).toBe(0);
  });

  it('reselects a mesh across presentations whenever its bounds or any light input change', () => {
    const scene = new Scene();
    const a = new PointLight({ position: [0, 1, 0], intensity: 4, range: 10 });
    const b = new PointLight({ position: [1, 1, 0], intensity: 2, range: 10 });
    const spot = new SpotLight({
      position: [0, 3, 0],
      direction: [0, -1, 0],
      range: 10,
    });
    scene.pointLights.push(a, b);
    scene.spotLights.push(spot);
    const mesh = new Mesh({
      geometry: Geometry.quad(1, 1),
      material: new TextureMaterial({
        texture: Object.create(Texture.prototype) as Texture,
      }),
    });
    const selector = new SpatialLightSelector({ pointLights: 1 });
    const frame = (): [unknown[], unknown[], number, number, number] => {
      scene.beginPresentation();
      try {
        selector.update(scene);
        selector.selectMesh(mesh);
        return [
          [...selector.pointLights],
          [...selector.spotLights],
          selector.stats.points.overflow,
          selector.stats.spots.culled,
          selector.frameStats.draws,
        ];
      } finally {
        scene.endPresentation();
      }
    };
    expect(frame()).toEqual([[a], [spot], 1, 0, 1]);
    expect(frame()).toEqual([[a], [spot], 1, 0, 1]);
    a.intensity = 0.1;
    expect(frame()).toEqual([[b], [spot], 1, 0, 1]);
    a.priority = 1;
    expect(frame()).toEqual([[a], [spot], 1, 0, 1]);
    b.color[0] = b.color[1] = b.color[2] = 0;
    expect(frame()).toEqual([[a], [spot], 0, 0, 1]);
    spot.direction.x = 50;
    expect(frame()).toEqual([[a], [], 0, 1, 1]);
    scene.pointLights.reverse();
    expect(frame()).toEqual([[a], [], 0, 1, 1]);
    mesh.position.x = 50;
    expect(frame()).toEqual([[], [], 0, 1, 1]);
  });

  it('bounds overloaded draws by priority, contribution then stable identity independent of pool order', () => {
    const scene = new Scene();
    for (let i = 0; i < 40; i++)
      scene.pointLights.push(new PointLight({ position: [0, 1, 0] }));
    const important = scene.pointLights[39]!;
    important.priority = 1;
    const selector = new SpatialLightSelector();
    selector.update(scene);
    selector.select(new Vector3(), 0);
    const expected = [important, ...scene.pointLights.slice(0, 31)];
    expect(selector.pointLights).toEqual(expected);
    expect(selector.stats.points).toEqual({
      pool: 40,
      selected: 32,
      culled: 0,
      overflow: 8,
    });
    scene.pointLights.reverse();
    selector.update(scene);
    selector.select(new Vector3(), 0);
    expect(selector.pointLights).toEqual(expected);
    const near = new PointLight({ position: [0, 0.5, 0] });
    scene.pointLights.push(near);
    selector.update(scene);
    selector.select(new Vector3(), 0);
    expect(selector.pointLights.slice(0, 2)).toEqual([important, near]);
    const strict = new SpatialLightSelector({
      pointLights: 4,
      exceedPolicy: 'error',
    });
    strict.update(scene);
    expect(() => strict.select(new Vector3(), 0)).toThrow(RangeError);
    expect(strict.stats.points.overflow).toBe(37);
  });

  it('retains cone intersections at sphere edges and unlimited range, but culls disjoint cones and finite ranges', () => {
    const scene = new Scene();
    const cone = new SpotLight({
      direction: [0, 0, -1],
      outerAngle: Math.PI / 8,
    });
    scene.spotLights.push(cone);
    const unlimited = new PointLight({ position: [1000, 0, 0] });
    const cutoff = new PointLight({ position: [1000, 0, 0], range: 1 });
    scene.pointLights.push(unlimited, cutoff);
    const selector = new SpatialLightSelector();
    selector.update(scene);
    selector.select(new Vector3(3, 0, -5), 2);
    expect(selector.spotLights).toEqual([cone]);
    expect(selector.pointLights).toEqual([unlimited]);
    selector.select(new Vector3(3, 0, -5), 0);
    expect(selector.spotLights).toEqual([]);
    selector.select(new Vector3(0, 0, 5), 0);
    expect(selector.spotLights).toEqual([]);
  });

  it('keeps a finite-range light until the sphere surface reaches its range', () => {
    const scene = new Scene();
    const light = new PointLight({ position: [0, 0, 0], range: 5 });
    scene.pointLights.push(light);
    const selector = new SpatialLightSelector();
    selector.update(scene);
    // Nearest surface distance is |center| - radius; the light reaches strictly less than range.
    selector.select(new Vector3(5.999999, 0, 0), 1);
    expect(selector.pointLights).toEqual([light]);
    selector.select(new Vector3(0, 0, -6), 1);
    expect(selector.pointLights).toEqual([]);
    selector.select(new Vector3(3, 4, 0.0000001), 0.0000001 + 1e-12);
    expect(selector.pointLights).toEqual([light]);
    selector.select(new Vector3(0, 400, 0), 395.5);
    expect(selector.pointLights).toEqual([light]);
    expect(selector.stats.points.culled).toBe(0);
    selector.select(new Vector3(0, 400, 0), 394.5);
    expect(selector.stats.points.culled).toBe(1);
  });

  it('selects the same lights and counts inside a presentation as a full scan outside it', () => {
    let seed = 7;
    const random = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
    const scene = new Scene();
    for (let i = 0; i < 90; i++)
      scene.pointLights.push(
        new PointLight({
          position: [random() * 80 - 40, random() * 20, random() * 80 - 40],
          // Unlimited, tiny, typical and oversized ranges exercise every grid path.
          range: i % 15 === 0 ? 0 : i % 11 === 0 ? 200 : 0.5 + random() * 6,
          intensity: i % 23 === 0 ? 0 : 1 + random() * 5,
          priority: i % 7 === 0 ? 1 : 0,
        }),
      );
    for (let i = 0; i < 40; i++)
      scene.spotLights.push(
        new SpotLight({
          position: [random() * 80 - 40, 10, random() * 80 - 40],
          direction: [random() - 0.5, -1, random() - 0.5],
          range: i % 9 === 0 ? 0 : 3 + random() * 8,
          outerAngle: 0.4 + random() * 0.6,
        }),
      );
    const scan = new SpatialLightSelector({ pointLights: 4, spotLights: 2 }),
      grid = new SpatialLightSelector({ pointLights: 4, spotLights: 2 });
    scan.update(scene);
    scene.beginPresentation();
    grid.update(scene);
    const ids = (s: SpatialLightSelector) => [
      s.pointLights.map((l) => l.id),
      s.spotLights.map((l) => l.id),
      { ...s.stats.points },
      { ...s.stats.spots },
    ];
    for (let i = 0; i < 300; i++) {
      const center = new Vector3(
        random() * 100 - 50,
        random() * 24 - 2,
        random() * 100 - 50,
      );
      const radius = i % 50 === 0 ? 500 : random() * (i % 3 ? 2 : 12);
      expect(ids(grid.select(center, radius))).toEqual(
        ids(scan.select(center, radius)),
      );
    }
    scene.endPresentation();
  });

  it('rejects malformed mutable pools and invalid budgets before selection, and clears removed lights', () => {
    const scene = new Scene();
    const light = new PointLight();
    scene.pointLights.push(light);
    const selector = new SpatialLightSelector();
    expect(() => selector.select(new Vector3(), 0)).toThrow();
    expect(() => new SpatialLightSelector({ pointLights: NaN })).toThrow(
      RangeError,
    );
    expect(() => new SpatialLightSelector({ spotLights: 33 })).toThrow(
      RangeError,
    );
    light.priority = NaN;
    expect(() => selector.update(scene)).toThrow(RangeError);
    light.priority = 0;
    scene.pointLights.push(light);
    expect(() => selector.update(scene)).toThrow(RangeError);
    scene.pointLights.pop();
    selector.update(scene);
    expect(() => selector.select(new Vector3(), -1)).toThrow(RangeError);
    expect(() => selector.select(new Vector3(NaN, 0, 0), 0)).toThrow(
      RangeError,
    );
    selector.select(new Vector3(), 0);
    const data = new Float32Array(LIGHTING_FLOAT_COUNT);
    fillLightingData(scene, data, selector);
    scene.pointLights.length = 0;
    selector.update(scene);
    selector.select(new Vector3(), 0);
    fillLightingData(scene, data, selector);
    expect(data[8]).toBe(0);
    expect(data[LIGHTING_POINT_ID_OFFSET]).toBe(0);
    expect(data[POINT_LIGHT_OFFSET + 7]).toBe(0);
    for (let i = 0; i <= lightSelectionLimits.poolPerType; i++)
      scene.pointLights.push(new PointLight());
    expect(() => selector.update(scene)).toThrow(RangeError);
  });

  it('keeps offscreen shadow lights and maps reordered selected identities within a separate 8+8 budget', () => {
    const scene = new Scene();
    scene.shadows.enabled = true;
    for (let i = 0; i < 40; i++) {
      scene.pointLights.push(
        new PointLight({ position: [i, 0, 100], castShadow: true }),
      );
      scene.spotLights.push(
        new SpotLight({ position: [i, 0, 100], castShadow: true }),
      );
    }
    const latePoint = scene.pointLights[39]!,
      lateSpot = scene.spotLights[39]!;
    latePoint.priority = lateSpot.priority = 10;
    const atlas = new ShadowAtlas();
    atlas.update(scene, 1);
    expect(atlas.count).toBe(1 + 8 * 6 + 8);
    expect(atlas.count).toBeLessThanOrEqual(shadowLimits.maps);
    expect(atlas.stats.points).toEqual({
      requested: 40,
      allocated: 8,
      overflow: 32,
    });
    expect(atlas.pointBase(latePoint.id)).toBe(1);
    expect(atlas.spotBase(lateSpot.id)).toBe(49);
    expect(atlas.pointBase(scene.pointLights[38]!.id)).toBe(-1);
    const projected = new Vector3();
    atlas.matrices[atlas.pointBase(latePoint.id) + 4]!.transformPoint(
      new Vector3(39, 0, 101),
      projected,
    );
    expect(projected.x).toBeCloseTo(0);
    expect(projected.y).toBeCloseTo(0);
    expect(projected.z).toBeGreaterThan(0);
    expect(projected.z).toBeLessThan(1);
    const selector = new SpatialLightSelector();
    scene.pointLights.reverse();
    scene.spotLights.reverse();
    selector.update(scene);
    selector.select(new Vector3(39, 0, 100), 1);
    expect(selector.pointLights[0]).toBe(latePoint);
    atlas.update(scene, 1);
    expect(atlas.pointBase(latePoint.id)).toBe(1);
    expect(atlas.spotBase(lateSpot.id)).toBe(49);
    scene.shadows.enabled = false;
    atlas.update(scene, 1);
    expect(atlas.pointBase(latePoint.id)).toBe(-1);
    expect(atlas.spotBase(lateSpot.id)).toBe(-1);
  });
});
