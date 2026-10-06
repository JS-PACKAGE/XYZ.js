import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Vector3 } from '../packages/math/src/index.js';
import { Terrain3D } from '../packages/core/src/terrain3d.js';
import {
  TerrainSplatMaterial,
  bakeTerrainSplat,
} from '../packages/core/src/terrain-splat.js';
import {
  terrainImageData,
  type TerrainImageData,
} from '../packages/core/src/terrain-data.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { Mesh } from '../packages/core/src/mesh.js';
import { HLOD, LOD } from '../packages/core/src/objects3d.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import type { WorldStreamingLoadContext } from '../packages/core/src/world-streaming.js';
import { nativeMeshGLSL } from '../packages/graphics/src/webgl-feature-shaders.js';
import { nativeMeshWGSL } from '../packages/graphics/src/webgpu-mesh-shader.js';

function image(r: number, g: number, b: number, a = 255): TerrainImageData {
  return { width: 1, height: 1, data: new Uint8ClampedArray([r, g, b, a]) };
}
function material(): PBRMaterial {
  return new PBRMaterial({
    texture: new Texture({ width: 1, height: 1, close() {} } as ImageBitmap),
  });
}
function terrain(): Terrain3D {
  return new Terrain3D({
    heightmap: { width: 3, height: 3, heights: [0, 1, 2, 2, 3, 4, 4, 5, 6] },
    material: material(),
    width: 2,
    depth: 2,
    chunkSize: 1,
    lodDistances: [0, 10],
    skirtDepth: 3,
  });
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Terrain3D CPU heightfield', () => {
  it('samples source triangles and local smooth normals', () => {
    const field = terrain();
    expect(field.heightAt(0, 0)).toBe(3);
    expect(field.heightAt(-0.5, -0.5)).toBe(1.5);
    expect(field.heightAt(2, 0)).toBeUndefined();
    const normal = field.normalAt(0, 0)!;
    expect(normal.x).toBeCloseTo(-1 / Math.sqrt(6));
    expect(normal.y).toBeCloseTo(1 / Math.sqrt(6));
    expect(normal.z).toBeCloseTo(-2 / Math.sqrt(6));
    expect(field.normalAt(3, 0)).toBeUndefined();
    expect(() => field.heightAt(NaN, 0)).toThrow(RangeError);
  });
  it('uses triangle rather than bilinear interpolation for a saddle', () => {
    const field = new Terrain3D({
      heightmap: { width: 2, height: 2, heights: [0, 0, 0, 8] },
      width: 2,
      depth: 2,
      material: material(),
    });
    expect(field.heightAt(0, 0)).toBe(0);
    expect(field.heightAt(0.5, 0.5)).toBe(4);
  });
  it('samples image channels with scale and offset and rejects unavailable texture pixels', () => {
    const field = new Terrain3D({
      heightmap: {
        width: 2,
        height: 2,
        data: [0, 255, 0, 255, 0, 0, 0, 255, 0, 128, 0, 255, 0, 64, 0, 255],
      },
      heightChannel: 1,
      heightScale: 10,
      heightOffset: -2,
      material: material(),
    });
    expect(field.heightAt(-50, -50)).toBe(8);
    expect(field.heightAt(50, -50)).toBe(-2);
    expect(() =>
      terrainImageData(new Texture({ kind: 'native', width: 2, height: 2 })),
    ).toThrow(/decoded/);
  });
  it('reads decoded Texture heights without taking ownership', () => {
    const close = vi.fn(),
      drawImage = vi.fn();
    const pixels = {
      width: 2,
      height: 2,
      data: new Uint8ClampedArray([
        255, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 0, 0, 255,
      ]),
    };
    class CPUCanvas {
      constructor(
        readonly width: number,
        readonly height: number,
      ) {}
      getContext(): object {
        return { drawImage, getImageData: () => pixels };
      }
    }
    vi.stubGlobal('OffscreenCanvas', CPUCanvas);
    const source = new Texture({ width: 2, height: 2, close } as ImageBitmap);
    const field = new Terrain3D({
      heightmap: source,
      heightScale: 5,
      material: material(),
    });
    expect(field.heightAt(-50, -50)).toBe(5);
    expect(drawImage).toHaveBeenCalledOnce();
    field.destroy();
    expect(close).not.toHaveBeenCalled();
  });
  it('builds native LOD branches with skirts, and optional native HLOD proxies', () => {
    const field = terrain();
    expect(field.chunks).toHaveLength(4);
    const lod = field.chunks[0] as LOD;
    expect(lod).toBeInstanceOf(LOD);
    expect(lod.levels).toHaveLength(2);
    const mesh = lod.levels[0]!.object as Mesh;
    expect(mesh.geometry.vertices.length / 8).toBe(8);
    expect(mesh.geometry.indices.length).toBe(30);
    expect(mesh.geometry.vertices[4 * 8 + 1]).toBe(-3);
    const proxy = new Terrain3D({
      heightmap: { width: 2, height: 2, heights: [0, 0, 0, 0] },
      material: material(),
      hlodScreenSize: 100,
    });
    expect(proxy.chunks[0]).toBeInstanceOf(HLOD);
  });
  it('updates all LOD vertex/normal/tangent streams and shared proxy geometry', () => {
    const field = terrain();
    const mesh = (field.chunks[0] as LOD).levels[0]!.object as Mesh;
    const version = mesh.geometry.version;
    field.heights.fill(5);
    field.markUpdated();
    expect(mesh.geometry.version).toBe(version + 1);
    expect(mesh.geometry.vertices[1]).toBe(5);
    expect(mesh.geometry.vertices[4 * 8 + 1]).toBe(2);
    expect(mesh.geometry.vertices[3]).toBeCloseTo(0);
    expect(mesh.geometry.vertices[4]).toBe(1);
    expect(mesh.geometry.vertices[5]).toBeCloseTo(0);
    expect(mesh.geometry.tangents[3]).toBe(-1);
  });
  it('picks the selected visibility branch in world units', () => {
    const field = terrain(),
      camera = new PerspectiveCamera();
    camera.position.set(0, 5, 0);
    for (const chunk of field.chunks) (chunk as LOD).updateForCamera(camera);
    field.position.y = 10;
    const hit = field.raycast(
      new Vector3(0.25, 30, 0.25),
      new Vector3(0, -1, 0),
    );
    expect(hit?.point.y).toBeCloseTo(13.75);
    expect(hit?.distance).toBeCloseTo(16.25);
    field.visible = false;
    expect(
      field.raycast(new Vector3(0, 30, 0), new Vector3(0, -1, 0)),
    ).toBeUndefined();
  });
  it('provides fresh streaming candidates with bounded world placement and borrowed geometry', () => {
    const field = terrain();
    field.position.set(10, 20, 30);
    const cells = field.createStreamingCells('mountain');
    expect(cells[0]!.id).toBe('mountain:0');
    expect(cells[0]!.bounds.min.x).toBe(9);
    const context = {
      signal: new AbortController().signal,
      own: <T>(root: T): T => root,
    } as unknown as WorldStreamingLoadContext;
    const first = cells[0]!.load(context),
      second = cells[0]!.load(context);
    expect(first).not.toBe(second);
    expect(first).not.toBeInstanceOf(Promise);
    if (first instanceof Promise || second instanceof Promise)
      throw new Error('Terrain cells are synchronous.');
    expect(first.root).not.toBe(second.root);
    field.scale.x = 2;
    expect(() => field.createStreamingCells()).toThrow(/translation-only/);
  });
  it('rejects malformed samples and excessive chunk admission before constructing geometry', () => {
    expect(
      () =>
        new Terrain3D({
          heightmap: { width: 2, height: 2, heights: [0, NaN, 0, 0] },
          material: material(),
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new Terrain3D({
          heightmap: { width: 2, height: 2, heights: [0, 0, 0, 0] },
          material: material(),
          lodDistances: [0, 2, 1],
        }),
    ).toThrow(RangeError);
  });
});

describe('bounded PBR terrain splat', () => {
  it('normalizes up to four weights and blends colors in linear space', () => {
    const maps = bakeTerrainSplat({
      size: 2,
      weights: image(255, 255, 0, 0),
      layers: [
        { baseColor: image(255, 0, 0), metallic: 1, roughness: 0.2 },
        { baseColor: image(0, 0, 255), metallic: 0, roughness: 0.8 },
      ],
    });
    expect(maps.baseColor.data[0]).toBe(188);
    expect(maps.baseColor.data[2]).toBe(188);
    expect(maps.metallicRoughness.data[1]).toBe(128);
    expect(maps.metallicRoughness.data[2]).toBe(128);
    const zero = bakeTerrainSplat({
      size: 2,
      weights: image(0, 0, 0, 0),
      layers: [{ baseColor: image(255, 0, 0) }],
    });
    expect(zero.baseColor.data[0]).toBe(255);
    expect(() =>
      bakeTerrainSplat({
        size: 2,
        weights: image(0, 0, 0),
        layers: Array.from({ length: 5 }, () => ({
          baseColor: image(0, 0, 0),
        })),
      }),
    ).toThrow(RangeError);
  });
  it('preserves normal, MR, occlusion and emission maps without extra sampled bindings', () => {
    const maps = bakeTerrainSplat({
      size: 2,
      weights: image(255, 0, 0, 0),
      layers: [
        {
          baseColor: image(255, 255, 255),
          normal: image(128, 128, 255),
          metallicRoughness: image(0, 128, 255),
          occlusion: image(64, 0, 0),
          metallic: 1,
          emissive: image(0, 255, 0),
        },
      ],
    });
    expect(maps.normal.data[2]).toBe(255);
    expect(maps.metallicRoughness.data[0]).toBe(64);
    expect(maps.metallicRoughness.data[1]).toBe(128);
    expect(maps.metallicRoughness.data[2]).toBe(255);
    expect(maps.emissive.data[1]).toBe(255);
  });
  it('owns only baked textures and supplies stage-safe native physical hooks', async () => {
    class CPUImageData {
      constructor(
        readonly data: Uint8ClampedArray,
        readonly width: number,
        readonly height: number,
      ) {}
    }
    const closes: Mock[] = [];
    vi.stubGlobal('ImageData', CPUImageData);
    vi.stubGlobal('createImageBitmap', async (source: CPUImageData) => {
      const close = vi.fn();
      closes.push(close);
      return { width: source.width, height: source.height, close };
    });
    const preset = await TerrainSplatMaterial.create({
      size: 2,
      weights: image(255, 0, 0, 0),
      layers: [{ baseColor: image(100, 120, 140) }],
    });
    expect(preset.textures).toHaveLength(4);
    expect(preset.material.deformationBounds).toBe(0);
    expect(nativeMeshGLSL(preset.material.glsl, 'vertex', true)).toContain(
      '!defined(XYZ_SHADOW)',
    );
    expect(nativeMeshGLSL(preset.material.glsl, 'surface', true)).toContain(
      'surface.occlusion=texture(metallicRoughnessMap,uv).r',
    );
    expect(nativeMeshGLSL(preset.material.glsl, 'shadow', true)).toContain(
      '#define XYZ_SHADOW',
    );
    expect(nativeMeshWGSL(preset.material.wgsl, true)).toContain(
      'textureSample(metallicRoughnessMap,metallicRoughnessSampler,uv).r',
    );
    preset.destroy();
    preset.destroy();
    expect(closes.every((close) => close.mock.calls.length === 1)).toBe(true);
    expect(preset.destroyed).toBe(true);
  });
});
