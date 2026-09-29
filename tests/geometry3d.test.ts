import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { BoxGeometry, Geometry } from '../packages/core/src/geometry.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import { Scene } from '../packages/core/src/scene.js';
import { Transform3D, Vector3 } from '../packages/math/src/index.js';

function verifyOutwardTriangles(geometry: Geometry): void {
  const { vertices, indices } = geometry;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 8;
    const b = indices[i + 1] * 8;
    const c = indices[i + 2] * 8;
    const ux = vertices[b] - vertices[a];
    const uy = vertices[b + 1] - vertices[a + 1];
    const uz = vertices[b + 2] - vertices[a + 2];
    const vx = vertices[c] - vertices[a];
    const vy = vertices[c + 1] - vertices[a + 1];
    const vz = vertices[c + 2] - vertices[a + 2];
    const dot =
      (uy * vz - uz * vy) * vertices[a + 3] +
      (uz * vx - ux * vz) * vertices[a + 4] +
      (ux * vy - uy * vx) * vertices[a + 5];
    expect(dot).toBeGreaterThan(0);
  }
}

describe('3D geometry', () => {
  it('copies custom input into interleaved CPU vertices and rejects malformed triangles', () => {
    const data = {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0, 1],
      indices: [0, 1, 2],
    };
    const geometry = new Geometry(data);
    data.positions[0] = 99;
    data.indices[0] = 2;
    expect([...geometry.vertices.slice(0, 8)]).toEqual([
      0, 0, 0, 0, 0, 1, 0, 0,
    ]);
    expect([...geometry.indices]).toEqual([0, 1, 2]);
    expect(
      () => new Geometry({ ...data, normals: [0], indices: [0, 1, 2] }),
    ).toThrow(RangeError);
    expect(() => new Geometry({ ...data, indices: [0, 1, 3] })).toThrow(
      RangeError,
    );
    expect(() => new Geometry({ ...data, indices: [0, 1, 1.5] })).toThrow(
      RangeError,
    );
    expect(
      () =>
        new Geometry({
          ...data,
          positions: [0, NaN, 0, ...data.positions.slice(3)],
        }),
    ).toThrow(RangeError);
  });

  it('builds outward-facing, nondegenerate faces with unit normals and UVs', () => {
    for (const geometry of [
      BoxGeometry.unit(),
      Geometry.sphere(0.5, 12, 8),
      Geometry.plane(),
      Geometry.quad(),
    ]) {
      verifyOutwardTriangles(geometry);
      for (let i = 0; i < geometry.vertices.length; i += 8) {
        const v = geometry.vertices;
        expect(Math.hypot(v[i + 3], v[i + 4], v[i + 5])).toBeCloseTo(1, 5);
        expect(v[i + 6]).toBeGreaterThanOrEqual(0);
        expect(v[i + 6]).toBeLessThanOrEqual(1);
        expect(v[i + 7]).toBeGreaterThanOrEqual(0);
        expect(v[i + 7]).toBeLessThanOrEqual(1);
      }
    }
    expect(() => Geometry.sphere(1, 2, 8)).toThrow(RangeError);
    expect(() => Geometry.quad(0)).toThrow(RangeError);
  });
});

describe('3D camera and scene', () => {
  it('projects near/far boundaries and inverts both camera translation and rotation', () => {
    const camera = new PerspectiveCamera();
    const projectedNear = camera
      .updateMatrix(1)
      .transformPoint(new Vector3(0, 0, 4.9));
    const projectedFar = camera
      .updateMatrix(1)
      .transformPoint(new Vector3(0, 0, -95));
    expect(projectedNear.z).toBeCloseTo(0, 4);
    expect(projectedFar.z).toBeCloseTo(1, 5);
    camera.position.set(1, 2, 3);
    camera.rotation.setFromEuler(0, Math.PI / 2, 0);
    const ahead = camera.updateMatrix(1).transformPoint(new Vector3(-4, 2, 3));
    expect(ahead.x).toBeCloseTo(0, 5);
    expect(ahead.y).toBeCloseTo(0, 5);
    expect(ahead.z).toBeGreaterThan(0);
    expect(ahead.z).toBeLessThan(1);
    expect(() => camera.updateMatrix(0)).toThrow(RangeError);
    camera.fov = Math.PI;
    expect(() => camera.updateMatrix(1)).toThrow(RangeError);
    camera.fov = Math.PI / 3;
    camera.far = camera.near;
    expect(() => camera.updateMatrix(1)).toThrow(RangeError);
  });

  it('registers meshes and transforms without owning shared geometry, material, or texture', () => {
    const image = {
      width: 1,
      height: 1,
      close: () => {},
    } as unknown as ImageBitmap;
    const texture = new Texture(image);
    const material = new TextureMaterial({
      texture,
      color: [0.2, 0.4, 0.6],
      opacity: 0.5,
    });
    expect(() => new TextureMaterial({ texture, opacity: 1.1 })).toThrow(
      RangeError,
    );
    expect(() => new TextureMaterial({ texture, color: [0, NaN, 1] })).toThrow(
      RangeError,
    );
    const mesh = new Mesh({
      geometry: Geometry.quad(),
      material,
      position: [1, 2, -3],
    });
    const scene = new Scene();
    scene.add(mesh);
    const entity = [...scene.world.query(Mesh, Transform3D)][0];
    expect(scene.world.getComponent(entity, Mesh)).toBe(mesh);
    expect(scene.world.getComponent(entity, Transform3D)).toBe(mesh.transform);
    mesh.destroy();
    expect([...scene.world.query(Mesh)]).toEqual([]);
    expect(texture.destroyed).toBe(false);
    scene.destroy();
  });
});
