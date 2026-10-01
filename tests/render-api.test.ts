import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { InstancedMesh } from '../packages/core/src/instanced-mesh.js';
import { PointLight, SpotLight } from '../packages/core/src/lights.js';
import { TextureMaterial } from '../packages/core/src/mesh.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import {
  computeShadowMatrix,
  fillLightingData,
  validateRenderSettings,
} from '../packages/core/src/render-data.js';
import { Scene } from '../packages/core/src/scene.js';
import { Matrix4, Quaternion, Vector3 } from '../packages/math/src/index.js';
import {
  LIGHTING_FLOAT_COUNT,
  MAX_POINT_LIGHTS,
  MAX_SPOT_LIGHTS,
} from '../src/data/rendering.js';

function texture(): Texture {
  return new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);
}

function expectProjected(
  matrix: Matrix4,
  point: Vector3,
  x: number,
  y: number,
  z: number,
): void {
  const projected = matrix.transformPoint(point);
  expect(projected.x).toBeCloseTo(x, 5);
  expect(projected.y).toBeCloseTo(y, 5);
  expect(projected.z).toBeCloseTo(z, 5);
}

describe('directional shadow projection', () => {
  it('projects the full orthographic extent and near/far planes into shared clip coordinates', () => {
    const scene = new Scene();
    scene.directionalLight.direction.set(0, 0, 4);
    scene.shadows.extent = 8;
    scene.shadows.near = 1;
    scene.shadows.far = 20;
    scene.shadows.target.set(3, -2, 7);
    const matrix = computeShadowMatrix(scene, new Matrix4());
    expectProjected(matrix, new Vector3(3, -2, 16), 0, 0, 0);
    expectProjected(matrix, new Vector3(3, -2, -3), 0, 0, 1);
    expectProjected(matrix, new Vector3(7, 2, 7), 1, 1, 9 / 19);
    expectProjected(matrix, new Vector3(-1, -6, 7), -1, -1, 9 / 19);
  });

  it.each([
    [0, 1, 0],
    [0, -1, 0],
    [1, 2, -3],
  ])('keeps near/far depth correct looking along (%s, %s, %s)', (x, y, z) => {
    const scene = new Scene();
    scene.directionalLight.direction.set(x, y, z);
    scene.shadows.target.set(-4, 3, 2);
    scene.shadows.near = 0.25;
    scene.shadows.far = 12;
    const direction = scene.directionalLight.direction.clone().normalize();
    const eye = scene.shadows.target.clone().add(direction.clone().scale(6));
    const nearPoint = eye.clone().subtract(direction.clone().scale(0.25));
    const farPoint = eye.clone().subtract(direction.clone().scale(12));
    const matrix = computeShadowMatrix(scene, new Matrix4());
    expectProjected(matrix, nearPoint, 0, 0, 0);
    expectProjected(matrix, farPoint, 0, 0, 1);
    scene.directionalLight.direction.set(0, 0, 0);
    expect(() => computeShadowMatrix(scene, matrix)).toThrow(RangeError);
  });
});

describe('render input validation', () => {
  it('rejects extra lights rather than silently dropping illumination', () => {
    const scene = new Scene();
    const data = new Float32Array(LIGHTING_FLOAT_COUNT);
    for (let i = 0; i <= MAX_POINT_LIGHTS; i++)
      scene.pointLights.push(new PointLight());
    expect(() => fillLightingData(scene, data)).toThrow(RangeError);
    scene.pointLights.length = 0;
    for (let i = 0; i <= MAX_SPOT_LIGHTS; i++)
      scene.spotLights.push(new SpotLight());
    expect(() => fillLightingData(scene, data)).toThrow(RangeError);
  });

  it('revalidates light and effect inputs after users mutate them', () => {
    const scene = new Scene();
    const data = new Float32Array(LIGHTING_FLOAT_COUNT);
    const point = new PointLight();
    scene.pointLights.push(point);
    point.range = -1;
    expect(() => fillLightingData(scene, data)).toThrow(RangeError);
    scene.pointLights.length = 0;
    const spot = new SpotLight();
    scene.spotLights.push(spot);
    spot.direction.set(0, 0, 0);
    expect(() => fillLightingData(scene, data)).toThrow(RangeError);
    scene.shadows.mapSize = 0;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
    scene.shadows.mapSize = 1024;
    scene.postProcessing.bloomStrength = Infinity;
    expect(() => validateRenderSettings(scene)).toThrow(RangeError);
  });

  it.each([
    { metallic: -0.1 },
    { roughness: 1.1 },
    { occlusionStrength: NaN },
    { normalScale: Infinity },
    { alphaCutoff: -1 },
    { ior: -1 },
    { ior: 0.99 },
    { ior: Infinity },
    { specular: -0.1 },
    { specular: 1.1 },
    { specularColor: [0, -1, 0] as [number, number, number] },
    { specularColor: [0, Infinity, 0] as [number, number, number] },
    { specularSampler: { minFilter: 'mipmap' as 'linear' } },
    { emissive: [0, -1, 0] as [number, number, number] },
    { textureSampler: { minFilter: 'mipmap' as 'linear' } },
    { normalSampler: { addressModeU: 'invalid' as 'repeat' } },
  ])('rejects invalid PBR factors %j', (options) => {
    expect(() => new PBRMaterial({ texture: texture(), ...options })).toThrow(
      RangeError,
    );
  });
});

describe('instance transform boundaries', () => {
  it('preserves a valid instance when a later singular or non-affine transform is rejected', () => {
    const mesh = new InstancedMesh({
      count: 2,
      geometry: Geometry.quad(),
      material: new TextureMaterial({ texture: texture() }),
    });
    const valid = new Matrix4().compose(
      new Vector3(2, 3, 4),
      new Quaternion(),
      new Vector3(2, 3, 4),
    );
    mesh.setMatrixAt(1, valid);
    const singular = new Matrix4().compose(
      new Vector3(),
      new Quaternion(),
      new Vector3(1, 0, 1),
    );
    expect(() => mesh.setMatrixAt(1, singular)).toThrow(RangeError);
    expect(() =>
      mesh.setMatrixAt(1, new Matrix4().perspective(1, 1, 0.1, 10)),
    ).toThrow(RangeError);
    expect(() => mesh.setMatrixAt(2, valid)).toThrow(RangeError);
    expect(() => mesh.getMatrixAt(-1, new Matrix4())).toThrow(RangeError);
    expect(mesh.version).toBe(1);
    expectProjected(
      mesh.getMatrixAt(1, new Matrix4()),
      new Vector3(1, 1, 1),
      4,
      6,
      8,
    );
    expectProjected(
      mesh.getMatrixAt(0, new Matrix4()),
      new Vector3(1, 1, 1),
      1,
      1,
      1,
    );
  });
});
