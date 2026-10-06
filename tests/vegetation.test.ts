import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Frustum } from '../packages/core/src/frustum.js';
import { NativePBRMaterial } from '../packages/core/src/native-pbr-material.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import {
  RenderVisibilityCache,
  RenderVisibilitySet,
} from '../packages/core/src/render-visibility.js';
import { Scene } from '../packages/core/src/scene.js';
import { VegetationMaterial } from '../packages/core/src/vegetation-material.js';
import {
  createGrassGeometry,
  scatterVegetation,
} from '../packages/core/src/vegetation.js';
import { nativeMeshGLSL } from '../packages/graphics/src/webgl-feature-shaders.js';
import { nativeMeshWGSL } from '../packages/graphics/src/webgpu-mesh-shader.js';

function options() {
  return {
    geometry: createGrassGeometry(),
    material: new VegetationMaterial({
      texture: new Texture({ width: 1, height: 1, close() {} } as ImageBitmap),
    }),
    bounds: { minX: -1, maxX: 1, minZ: -1, maxZ: 1 },
    count: 50,
    seed: 42,
    tileSize: 2,
    batchSize: 7,
  };
}

describe('vegetation', () => {
  it('uses bounded native PBR wind, stable real instance inputs and shared shadow deformation', () => {
    const { material } = options();
    expect(material).toBeInstanceOf(NativePBRMaterial);
    expect(material.deformationBounds).toBeGreaterThanOrEqual(
      material.uniforms[1]!,
    );
    expect(material.shadowCache).toBe('tracked');
    material.update(12);
    expect(material.uniforms[0]).toBe(12);
    expect(() => material.update(Infinity)).toThrow(RangeError);
    const wgsl = nativeMeshWGSL(material.wgsl, true);
    const glsl = nativeMeshGLSL(material.glsl, 'vertex', true);
    expect(wgsl.match(/xyzDeformInstance\(/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
    expect(glsl.match(/xyzDeformInstance\(/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
    expect(wgsl).toContain('instance[3].xz');
    expect(glsl).toContain('instance[3].xz');
    expect(wgsl).toContain('shadowVertex');
    expect(wgsl).toContain('normal.y-derivative');
    const image = material.texture;
    material.destroy();
    expect(image.destroyed).toBe(false);
  });

  it('scatters deterministically into bounded native batches with matching LOD transforms', () => {
    const setup = options();
    const a = scatterVegetation({
      ...setup,
      lod: [{ distance: 10, geometry: Geometry.cube() }],
    });
    const b = scatterVegetation({
      ...setup,
      lod: [{ distance: 10, geometry: Geometry.cube() }],
    });
    expect(a.acceptedCount).toBe(50);
    expect(a.meshes.map((mesh) => Array.from(mesh.matrices))).toEqual(
      b.meshes.map((mesh) => Array.from(mesh.matrices)),
    );
    expect(
      a.batches.every((batch) => batch.meshes.every((mesh) => mesh.count <= 7)),
    ).toBe(true);
    for (const batch of a.batches)
      expect(batch.meshes[0]!.matrices).toEqual(batch.meshes[1]!.matrices);
    const c = scatterVegetation({ ...setup, seed: 43 });
    expect(c.meshes[0]!.matrices).not.toEqual(a.meshes[0]!.matrices);
  });

  it('applies density maps, height and normalized slope filters before allocating batches', () => {
    const setup = options();
    expect(
      scatterVegetation({
        ...setup,
        densityMap: { width: 1, height: 1, data: [0] },
      }).meshes,
    ).toEqual([]);
    expect(scatterVegetation({ ...setup, density: 0 }).acceptedCount).toBe(0);
    expect(
      scatterVegetation({
        ...setup,
        maxHeight: 1,
        sampleSurface: () => ({ height: 2, normal: [0, 2, 0] }),
      }).acceptedCount,
    ).toBe(0);
    expect(
      scatterVegetation({
        ...setup,
        maxSlope: 0.1,
        sampleSurface: () => ({ height: 0, normal: [1, 1, 0] }),
      }).acceptedCount,
    ).toBe(0);
    expect(
      scatterVegetation({
        ...setup,
        maxSlope: 0.1,
        sampleSurface: () => ({ height: 0.5, normal: [0, 3, 0] }),
      }).acceptedCount,
    ).toBe(50);
    const filtered = scatterVegetation({
      ...setup,
      minHeight: 0,
      sampleSurface: (x) => ({ height: x, normal: [0, 1, 0] }),
    });
    expect(filtered.acceptedCount).toBeGreaterThan(0);
    expect(filtered.acceptedCount).toBeLessThan(50);
    for (const mesh of filtered.meshes)
      for (let i = 0; i < mesh.count; i++)
        expect(mesh.matrices[i * 16 + 13]).toBeGreaterThanOrEqual(0);
  });

  it('feeds distance fade and LOD selection to existing render visibility without a parallel renderer', () => {
    const scene = new Scene();
    const camera = new OrthographicCamera();
    camera.height = 100;
    scene.camera3D = camera;
    const result = scatterVegetation({
      ...options(),
      batchSize: 100,
      fadeStart: 10,
      fadeEnd: 20,
      lod: [{ distance: 12, geometry: Geometry.cube() }],
    });
    scene.add(result.root);
    const cache = new RenderVisibilityCache(),
      out = new RenderVisibilitySet();
    camera.position.set(0, 0, 15);
    cache.collect(
      scene,
      camera,
      new Frustum().setFromMatrix(camera.updateMatrix(1)),
      out,
    );
    const batch = result.batches[0]!;
    expect(batch.level).toBe(1);
    expect(out.entries.get(batch.meshes[1]!)!.fade).toBeCloseTo(0.5);
    expect(out.color).not.toContain(batch.meshes[0]);
    camera.position.z = 30;
    cache.collect(
      scene,
      camera,
      new Frustum().setFromMatrix(camera.updateMatrix(1)),
      out,
    );
    expect(out.color).toEqual([]);
    expect(out.shadows).toEqual([]);
    camera.position.z = 5;
    cache.collect(
      scene,
      camera,
      new Frustum().setFromMatrix(camera.updateMatrix(1)),
      out,
    );
    expect(batch.level).toBe(0);
    expect(out.entries.get(batch.meshes[0]!)!.fade).toBe(1);
  });

  it('creates bendable grass and rejects malformed inputs', () => {
    const grass = createGrassGeometry(0.2, 2, 4);
    expect(grass.vertices.length / 8).toBe(10);
    expect(grass.indices.length).toBe(24);
    expect(() => createGrassGeometry(0, 1)).toThrow(RangeError);
    expect(() => scatterVegetation({ ...options(), count: -1 })).toThrow(
      RangeError,
    );
    expect(() =>
      scatterVegetation({
        ...options(),
        densityMap: { width: 2, height: 1, data: [1] },
      }),
    ).toThrow(RangeError);
    expect(() =>
      scatterVegetation({
        ...options(),
        sampleSurface: () => ({ height: 0, normal: [0, 0, 0] }),
      }),
    ).toThrow(RangeError);
  });
});
