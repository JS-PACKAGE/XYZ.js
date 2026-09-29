import { describe, expect, it } from 'vitest';
import { Camera2D } from '../packages/core/src/camera2d.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector2 } from '../packages/math/src/index.js';

describe('Camera2D', () => {
  it('keeps scene camera movement independent', () => {
    const scene = new Scene();
    const second = new Scene();
    scene.camera2D.position.set(10, 20);
    scene.camera2D.zoom = 2;
    expect(scene.camera2D.worldToScreen(new Vector2(15, 25))).toEqual(
      new Vector2(10, 10),
    );
    expect(second.camera2D.worldToScreen(new Vector2(15, 25))).toEqual(
      new Vector2(15, 25),
    );
  });

  it('applies translation and zoom and roundtrips points with aliased output', () => {
    const camera = new Camera2D();
    camera.position.set(10, -4);
    camera.zoom = 2.5;
    const point = new Vector2(14, 2);
    expect(camera.worldToScreen(point, point)).toBe(point);
    expect(point).toEqual(new Vector2(10, 15));
    expect(camera.screenToWorld(point, point)).toBe(point);
    expect(point).toEqual(new Vector2(14, 2));
    expect(camera.screenToWorld(new Vector2(0, 0))).toEqual(
      new Vector2(10, -4),
    );
  });

  it('rejects invalid zoom and viewport sizes without changing state', () => {
    const camera = new Camera2D();
    for (const zoom of [0, -1, NaN, Infinity, -Infinity]) {
      expect(() => {
        camera.zoom = zoom;
      }).toThrow(RangeError);
      expect(camera.zoom).toBe(1);
    }
    camera.resize(640, 360);
    expect(camera.viewportWidth).toBe(640);
    expect(camera.viewportHeight).toBe(360);
    for (const dimension of [NaN, Infinity, -Infinity, -1]) {
      expect(() => camera.resize(dimension, 100)).toThrow(RangeError);
      expect(() => camera.resize(100, dimension)).toThrow(RangeError);
      expect(camera.viewportWidth).toBe(640);
      expect(camera.viewportHeight).toBe(360);
    }
  });
});
