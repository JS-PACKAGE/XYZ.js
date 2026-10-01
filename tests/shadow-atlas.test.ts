import { describe, expect, it } from 'vitest';
import { ShadowAtlas } from '../packages/core/src/shadow-atlas.js';
import { Scene } from '../packages/core/src/scene.js';
import { PointLight, SpotLight } from '../packages/core/src/lights.js';
import { Vector3 } from '../packages/math/src/index.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';

const axes = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
] as const;

describe('shadow atlas cameras', () => {
  it('projects every point-light axis onto its own face and respects clipping', () => {
    const scene = new Scene();
    scene.shadows.enabled = true;
    const light = new PointLight({
      position: [2, 3, 4],
      castShadow: true,
      shadowNear: 0.2,
      range: 10,
    });
    scene.pointLights.push(light);
    const atlas = new ShadowAtlas();
    atlas.update(scene, 1);
    expect(atlas.count).toBe(7);
    const projected = new Vector3();
    for (let face = 0; face < 6; face++) {
      const axis = axes[face]!;
      const point = new Vector3(2 + axis[0], 3 + axis[1], 4 + axis[2]);
      atlas.matrices[face + 1]!.transformPoint(point, projected);
      expect(projected.x).toBeCloseTo(0, 5);
      expect(projected.y).toBeCloseTo(0, 5);
      expect(projected.z).toBeGreaterThan(0);
      expect(projected.z).toBeLessThan(1);
      point.set(2 + axis[0] * 20, 3 + axis[1] * 20, 4 + axis[2] * 20);
      atlas.matrices[face + 1]!.transformPoint(point, projected);
      expect(projected.z).toBeGreaterThan(1);
    }
  });

  it('fits the spot cone and rejects shadow cones with a singular projection', () => {
    const scene = new Scene();
    scene.shadows.enabled = true;
    const light = new SpotLight({
      position: [0, 4, 0],
      direction: [0, -1, 0],
      outerAngle: Math.PI / 6,
      castShadow: true,
    });
    scene.spotLights.push(light);
    const atlas = new ShadowAtlas();
    atlas.update(scene, 1);
    const point = new Vector3(0, 0, 0),
      projected = new Vector3();
    atlas.matrices[1]!.transformPoint(point, projected);
    expect(projected.x).toBeCloseTo(0);
    expect(projected.y).toBeCloseTo(0);
    point.set(3, 0, 0);
    atlas.matrices[1]!.transformPoint(point, projected);
    expect(
      Math.max(Math.abs(projected.x), Math.abs(projected.y)),
    ).toBeGreaterThan(1);
    expect(
      () => new SpotLight({ castShadow: true, outerAngle: Math.PI / 2 }),
    ).toThrow(RangeError);
    expect(() => new PointLight({ castShadow: true, range: 0.05 })).toThrow(
      RangeError,
    );
  });

  it('fits camera slices and moves cascades with the camera', () => {
    const scene = new Scene();
    Object.assign(scene.shadows, {
      enabled: true,
      cascades: 4,
      cascadeDistance: 40,
      cascadeLambda: 0,
    });
    scene.camera3D.position.set(0, 0, 5);
    const atlas = new ShadowAtlas();
    atlas.update(scene, 1);
    let previous = scene.camera3D.near;
    for (let cascade = 0; cascade < 4; cascade++) {
      const split = atlas.data[4 + cascade]!;
      expect(split).toBeGreaterThan(previous);
      const center = new Vector3(0, 0, 5 - (previous + split) / 2);
      const projected = new Vector3();
      atlas.matrices[cascade]!.transformPoint(center, projected);
      expect(Math.abs(projected.x)).toBeLessThan(1);
      expect(Math.abs(projected.y)).toBeLessThan(1);
      expect(projected.z).toBeGreaterThan(0);
      expect(projected.z).toBeLessThan(1);
      previous = split;
    }
    expect(previous).toBeCloseTo(40);
    const before = atlas.matrices[0]!.elements.slice();
    scene.camera3D.position.x = 10;
    atlas.update(scene, 1);
    expect(Array.from(atlas.matrices[0]!.elements)).not.toEqual(
      Array.from(before),
    );
    scene.shadows.cascadeDistance = 0.05;
    expect(() => atlas.update(scene, 1)).toThrow(RangeError);
  });

  it('removes shadows without leaving stale light slots', () => {
    const scene = new Scene();
    scene.shadows.enabled = true;
    const point = new PointLight({ castShadow: true });
    const spot = new SpotLight({ castShadow: true });
    scene.pointLights.push(point);
    scene.spotLights.push(spot);
    const atlas = new ShadowAtlas();
    atlas.update(scene, 1);
    expect(atlas.data[16]).toBe(1);
    expect(atlas.data[24]).toBe(7);
    point.castShadow = false;
    scene.spotLights.length = 0;
    atlas.update(scene, 1);
    expect(atlas.count).toBe(1);
    expect(atlas.data[16]).toBe(-1);
    expect(atlas.data[24]).toBe(-1);
    scene.shadows.enabled = false;
    atlas.update(scene, 1);
    expect(atlas.count).toBe(0);
    expect(atlas.size).toBe(0);
    expect(atlas.data[0]).toBe(0);
  });

  it('covers orthographic slice corners with zero camera near depth', () => {
    const scene = new Scene();
    scene.camera3D = new OrthographicCamera();
    scene.camera3D.near = 0;
    scene.camera3D.height = 8;
    Object.assign(scene.shadows, {
      enabled: true,
      cascades: 3,
      cascadeDistance: 30,
    });
    const atlas = new ShadowAtlas(),
      projected = new Vector3();
    atlas.update(scene, 2);
    let near = 0;
    for (let cascade = 0; cascade < 3; cascade++) {
      const far = atlas.data[4 + cascade]!;
      for (const depth of [near, far])
        for (const x of [-8, 8])
          for (const y of [-4, 4]) {
            atlas.matrices[cascade]!.transformPoint(
              new Vector3(x, y, 5 - depth),
              projected,
            );
            expect(Math.abs(projected.x)).toBeLessThanOrEqual(1.001);
            expect(Math.abs(projected.y)).toBeLessThanOrEqual(1.001);
            expect(projected.z).toBeGreaterThanOrEqual(0);
            expect(projected.z).toBeLessThanOrEqual(1);
          }
      near = far;
    }
  });
});
