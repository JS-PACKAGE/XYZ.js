import { describe, expect, it, vi } from 'vitest';
import { Geometry } from '../packages/core/src/geometry.js';
import { generateMikkTangents } from '../packages/core/src/geometry-tangents.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { MorphTargets, MorphWeights } from '../packages/core/src/morph.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';
import { Texture } from '../packages/assets/src/texture.js';

function material(): TextureMaterial {
  return new TextureMaterial({
    texture: new Texture({
      width: 1,
      height: 1,
      close: vi.fn(),
    } as unknown as ImageBitmap),
  });
}

function mirroredQuad(): Geometry {
  return new Geometry({
    positions: [-1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [1, 0, 0, 0, 0, 1, 1, 1],
    indices: [0, 2, 1, 0, 3, 2],
  });
}

describe('tangent-space consistency', () => {
  it('generates glTF handedness and preserves mirrored UV orientation', () => {
    const geometry = mirroredQuad();
    expect(geometry.vertices).toHaveLength(32);
    for (let vertex = 0; vertex < 4; vertex++) {
      expect(geometry.tangents[vertex * 4]).toBeCloseTo(-1);
      expect(geometry.tangents[vertex * 4 + 1]).toBeCloseTo(0);
      expect(geometry.tangents[vertex * 4 + 2]).toBeCloseTo(0);
      expect(geometry.tangents[vertex * 4 + 3]).toBe(1);
    }
    const authored = new Geometry({
      positions: geometry.vertices.filter((_, index) => index % 8 < 3),
      normals: geometry.vertices.filter(
        (_, index) => index % 8 >= 3 && index % 8 < 6,
      ),
      uvs: geometry.vertices.filter((_, index) => index % 8 >= 6),
      tangents: [0, 4, 0, -1, 0, 4, 0, -1, 0, 4, 0, -1, 0, 4, 0, -1],
      indices: geometry.indices,
    });
    expect(Array.from(authored.tangents)).toEqual([
      0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1,
    ]);
    expect(
      () =>
        new Geometry({
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
          uvs: [0, 0, 1, 0, 0, 1],
          tangents: [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1],
          indices: [0, 1, 2],
        }),
    ).toThrow(/handedness/);
  });

  it('morphs tangent direction without changing authored handedness', () => {
    const geometry = mirroredQuad();
    const weights = new MorphWeights([0]);
    const mesh = new Mesh({
      geometry,
      material: material(),
      morph: new MorphTargets({
        positions: [new Float32Array(12)],
        tangents: [[1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0]],
        weights,
      }),
    });
    weights.set(0, 1);
    mesh.updateDeformation();
    expect(geometry.tangents[0]).toBeCloseTo(0);
    expect(geometry.tangents[1]).toBeCloseTo(1);
    expect(geometry.tangents[3]).toBe(1);
    weights.set(0, 0);
    mesh.updateDeformation();
    expect(geometry.tangents[0]).toBeCloseTo(-1);
    expect(geometry.tangents[1]).toBeCloseTo(0);
  });

  it('uses forward skin tangents, inverse-transpose normals and reflected handedness', () => {
    const geometry = mirroredQuad();
    const joint = new Object3D();
    joint.scale.set(-2, 1, 1);
    const mesh = new SkinnedMesh({
      geometry,
      material: material(),
      joints: [joint],
      jointIndices: new Uint32Array(16),
      weights: new Float32Array(16).fill(1),
    });
    mesh.updateSkin();
    expect(mesh.geometry.vertices[3]).toBeCloseTo(0);
    expect(mesh.geometry.vertices[5]).toBeCloseTo(1);
    expect(mesh.geometry.tangents[0]).toBeCloseTo(1);
    expect(mesh.geometry.tangents[3]).toBe(-1);
    expect(mesh.renderGeometry.tangents[0]).toBeCloseTo(-1);
  });
  it('keeps forward tangents correct under nonuniform reflected skin scale', () => {
    const geometry = mirroredQuad();
    for (let i = 0; i < 4; i++) {
      geometry.tangents[i * 4] = Math.SQRT1_2;
      geometry.tangents[i * 4 + 1] = Math.SQRT1_2;
      geometry.tangents[i * 4 + 3] = -1;
    }
    const joint = new Object3D();
    joint.scale.set(-2, 1, 1);
    const mesh = new SkinnedMesh({
      geometry,
      material: material(),
      joints: [joint],
      jointIndices: new Uint32Array(16),
      weights: new Float32Array(16).fill(1),
    });
    mesh.updateSkin();
    expect(mesh.geometry.tangents[0]).toBeCloseTo(-2 / Math.sqrt(5));
    expect(mesh.geometry.tangents[1]).toBeCloseTo(1 / Math.sqrt(5));
    expect(mesh.geometry.tangents[3]).toBe(1);
    expect(mesh.geometry.vertices[5]).toBeCloseTo(1);
  });

  it('reprojects tangents for normal-only morphs, including parallel collapse', () => {
    const geometry = mirroredQuad();
    const mesh = new Mesh({
      geometry,
      material: material(),
      morph: new MorphTargets({
        positions: [new Float32Array(12)],
        normals: [[-1, 0, -1, -1, 0, -1, -1, 0, -1, -1, 0, -1]],
        weights: new MorphWeights([1]),
      }),
    });
    mesh.updateDeformation();
    const t = geometry.tangents,
      v = geometry.vertices;
    expect(t[0] * v[3] + t[1] * v[4] + t[2] * v[5]).toBeCloseTo(0);
    expect(Math.hypot(t[0], t[1], t[2])).toBeCloseTo(1);
    expect(t[3]).toBe(1);
  });

  it('produces finite perpendicular frames for zero and nonunit normals', () => {
    for (const normals of [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 7, 0, 0, 7, 0, 0, 7],
    ]) {
      const geometry = new Geometry({
        positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
        normals,
        uvs: [0, 0, 0, 0, 0, 0],
        indices: [0, 1, 2],
      });
      expect(Array.from(geometry.tangents).every(Number.isFinite)).toBe(true);
      expect(Math.hypot(...geometry.tangents.subarray(0, 3))).toBeCloseTo(1);
      expect(geometry.tangents[2]).toBe(0);
    }
  });
  it('uses reference MikkTSpace and the explicit glTF sign conversion', () => {
    const source = mirroredQuad();
    const uv = generateMikkTangents(source);
    const gltf = generateMikkTangents(source, { convention: 'gltf' });
    expect(uv.geometry.tangents[0]).toBe(-1);
    expect(uv.geometry.tangents[3]).toBe(1);
    expect(gltf.geometry.tangents[0]).toBe(-1);
    expect(gltf.geometry.tangents[3]).toBe(-1);
    expect(source.tangents[3]).toBe(1);
  });

  it('splits mirrored tangent seams and preserves every vertex channel', () => {
    const source = new Geometry({
      positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 1, 1, 2, 0],
      uvs1: [0, 0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      colors: [1, 0, 0, 0.2, 0, 1, 0, 0.4, 0, 0, 1, 0.6, 1, 1, 1, 0.8],
      indices: [0, 1, 2, 0, 2, 3],
    });
    const { geometry, sourceVertices } = generateMikkTangents(source);
    expect(geometry.indices[0]).not.toBe(geometry.indices[3]);
    expect(geometry.indices[2]).not.toBe(geometry.indices[4]);
    expect(geometry.tangents[geometry.indices[0] * 4 + 3]).toBe(1);
    expect(geometry.tangents[geometry.indices[3] * 4 + 3]).toBe(-1);
    for (let corner = 0; corner < source.indices.length; corner++) {
      const vertex = geometry.indices[corner],
        original = source.indices[corner];
      expect(sourceVertices[vertex]).toBe(original);
      expect(
        Array.from(geometry.vertices.subarray(vertex * 8, vertex * 8 + 8)),
      ).toEqual(
        Array.from(source.vertices.subarray(original * 8, original * 8 + 8)),
      );
      expect(
        Array.from(geometry.colors!.subarray(vertex * 4, vertex * 4 + 4)),
      ).toEqual(
        Array.from(source.colors!.subarray(original * 4, original * 4 + 4)),
      );
      expect(
        Array.from(geometry.uvs1!.subarray(vertex * 2, vertex * 2 + 2)),
      ).toEqual(
        Array.from(source.uvs1!.subarray(original * 2, original * 2 + 2)),
      );
    }
  });

  it('generates the selected UV1 basis without confusing UV0', () => {
    const source = mirroredQuad();
    const second = new Geometry({
      positions: source.vertices.filter((_, i) => i % 8 < 3),
      normals: source.vertices.filter((_, i) => i % 8 >= 3 && i % 8 < 6),
      uvs: source.vertices.filter((_, i) => i % 8 >= 6),
      uvs1: [0, 0, 1, 0, 1, 1, 0, 1],
      indices: source.indices,
    });
    const result = generateMikkTangents(second, { texCoord: 1 });
    expect(result.geometry.tangentTexCoord).toBe(1);
    expect(result.geometry.tangents[0]).toBe(1);
    expect(generateMikkTangents(second).geometry.tangents[0]).toBe(-1);
    expect(() => generateMikkTangents(source, { texCoord: 1 })).toThrow(
      /UV stream/,
    );
  });
});
