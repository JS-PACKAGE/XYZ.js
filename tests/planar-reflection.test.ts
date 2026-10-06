import { describe, expect, it } from 'vitest';
import {
  PlanarReflection,
  PlanarReflectionCamera,
} from '../packages/core/src/planar-reflection.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector3 } from '../packages/math/src/index.js';
import { encodePlanarReflection } from '../packages/graphics/src/planar-reflection-capture.js';

function clip(matrix: ArrayLike<number>, point: readonly number[]) {
  return [0, 1, 2, 3].map(
    (row) =>
      matrix[row]! * point[0]! +
      matrix[row + 4]! * point[1]! +
      matrix[row + 8]! * point[2]! +
      matrix[row + 12]!,
  );
}

describe('planar scene reflection', () => {
  it('normalizes planes and enforces resolution and update bounds', () => {
    expect(
      new PlanarReflection({ normal: [0, 2, 0], constant: 4 }).plane,
    ).toEqual([0, 1, 0, 2]);
    for (const options of [
      { normal: [0, 0, 0] as const },
      { size: 513 },
      { size: 1 },
      { updateInterval: 0 },
      { clipBias: -1 },
    ])
      expect(() => new PlanarReflection(options)).toThrow(RangeError);
    const reflection = new PlanarReflection({ updateInterval: 0.1 });
    expect(reflection.beginCapture(1)).toBe(true);
    expect(() => reflection.beginCapture(1)).toThrow('Recursive');
    reflection.endCapture();
    expect(reflection.beginCapture(1.05)).toBe(false);
    expect(reflection.beginCapture(1.1)).toBe(true);
    reflection.endCapture();
    reflection.destroy();
    expect(() => reflection.beginCapture(2)).toThrow('destroyed');
  });

  it('mirrors the camera and actually clips the opposite world half-space on both projection types', () => {
    for (const source of [new PerspectiveCamera(), new OrthographicCamera()]) {
      source.position.set(0, 2, 5);
      source.lookAt(new Vector3(0, 0, 0));
      const reflection = new PlanarReflection({ clipBias: 0 });
      const camera = new PlanarReflectionCamera(source, reflection);
      const matrix = camera.updateMatrix(1).elements;
      expect(camera.position.y).toBe(-2);
      expect(clip(matrix, [0, 1, 0])[2]).toBeGreaterThan(0);
      expect(clip(matrix, [0, -1, 0])[2]).toBeLessThan(0);
      expect(clip(matrix, [0, 0, 0])[2]).toBeCloseTo(0);
      const ordinary = source.updateMatrix(1).elements;
      const reflected = clip(matrix, [0.5, 1, 0]);
      const original = clip(ordinary, [0.5, -1, 0]);
      expect(reflected[0]).toBeCloseTo(-original[0]!);
      expect(reflected[1]).toBeCloseTo(original[1]!);
      expect(reflected[3]).toBeCloseTo(original[3]!);
      expect([...reflection.matrix.elements]).toEqual([...matrix]);
    }
  });

  it('restores borrowed scene state after errors and rejects recursive encoding', () => {
    const scene = new Scene();
    scene.camera3D.position.set(0, 2, 5);
    scene.camera3D.lookAt(new Vector3());
    const original = scene.camera3D;
    scene.postProcessing.enabled =
      scene.postProcessing.taa =
      scene.postProcessing.ssr =
        true;
    const reflection = new PlanarReflection();
    expect(() =>
      encodePlanarReflection(scene, reflection, () => {
        expect(scene.camera3D).not.toBe(original);
        expect(scene.postProcessing.enabled).toBe(false);
        expect(() =>
          encodePlanarReflection(scene, reflection, () => {}),
        ).toThrow('Recursive');
        throw new Error('capture failed');
      }),
    ).toThrow('capture failed');
    expect(scene.camera3D).toBe(original);
    expect(
      scene.postProcessing.enabled &&
        scene.postProcessing.taa &&
        scene.postProcessing.ssr,
    ).toBe(true);
    encodePlanarReflection(scene, reflection, () => {});
    scene.destroy();
    reflection.destroy();
  });
});
