import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Decal } from '../packages/core/src/decal.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { Matrix4, Vector3 } from '../packages/math/src/index.js';

const material = (): TextureMaterial =>
  new TextureMaterial({ texture: Object.create(Texture.prototype) as Texture });
const receiver = (geometry = Geometry.quad(4, 4)): Mesh =>
  new Mesh({ geometry, material: material() });

function area(mesh: Mesh): number {
  const v = mesh.geometry.vertices,
    indices = mesh.geometry.indices;
  let sum = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 8,
      b = indices[i + 1] * 8,
      c = indices[i + 2] * 8;
    const ux = v[b] - v[a],
      uy = v[b + 1] - v[a + 1],
      uz = v[b + 2] - v[a + 2];
    const vx = v[c] - v[a],
      vy = v[c + 1] - v[a + 1],
      vz = v[c + 2] - v[a + 2];
    sum +=
      Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }
  return sum;
}

describe('Decal', () => {
  it('clips depth as well as width and height without losing surface area or projected UVs', () => {
    const geometry = new Geometry({
      positions: [-2, 2, -2, 2, 2, 2, 2, -2, 2, -2, -2, -2],
      normals: Array.from({ length: 4 }, () => [
        -Math.SQRT1_2,
        0,
        Math.SQRT1_2,
      ]).flat(),
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      indices: [0, 2, 1, 0, 3, 2],
    });
    const decal = new Decal({
      target: receiver(geometry),
      material: material(),
      position: [0, 0, 0],
      size: [2, 2, 1],
      normalOffset: 0,
    });
    expect(area(decal)).toBeCloseTo(2 * Math.SQRT2, 6);
    const v = decal.geometry.vertices;
    for (let i = 0; i < v.length; i += 8) {
      expect(Math.abs(v[i])).toBeLessThanOrEqual(0.5);
      expect(Math.abs(v[i + 1])).toBeLessThanOrEqual(1);
      expect(v[i + 2]).toBeCloseTo(v[i], 7);
      expect(v[i + 6]).toBeCloseTo(v[i] / 2 + 0.5, 7);
      expect(v[i + 7]).toBeCloseTo(0.5 - v[i + 1] / 2, 7);
    }
  });

  it('retains triangles exactly on projector boundaries with forward winding', () => {
    const decal = new Decal({
      target: receiver(Geometry.quad(2, 2)),
      material: material(),
      position: [0, 0, 0],
      size: [2, 2, 0.2],
      normalOffset: 0,
    });
    expect(area(decal)).toBeCloseTo(4, 7);
    const v = decal.geometry.vertices,
      indices = decal.geometry.indices;
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 8,
        b = indices[i + 1] * 8,
        c = indices[i + 2] * 8;
      expect(
        (v[b] - v[a]) * (v[c + 1] - v[a + 1]) -
          (v[b + 1] - v[a + 1]) * (v[c] - v[a]),
      ).toBeGreaterThan(0);
    }
  });

  it('uses world-sized projection and normal lift under rotated nonuniform parents, then follows movement', () => {
    const parent = new Group();
    parent.position.set(3, -2, 1);
    parent.rotation.setFromEuler(0.3, 0.7, 0.2);
    parent.scale.set(2, 3, 0.5);
    const target = parent.add(receiver());
    target.rotation.setFromEuler(0, 0, 0.4);
    const decal = new Decal({
      target,
      material: material(),
      position: [3, -2, 1],
      rotation: parent.rotation,
      size: [2, 2, 0.1],
      normalOffset: 0.005,
    });
    const projectorInverse = new Matrix4()
      .compose(parent.position, parent.rotation, new Vector3(1, 1, 1))
      .invert();
    const point = new Vector3(),
      before: Vector3[] = [];
    for (let i = 0; i < decal.geometry.vertices.length; i += 8) {
      point.set(
        decal.geometry.vertices[i],
        decal.geometry.vertices[i + 1],
        decal.geometry.vertices[i + 2],
      );
      decal.updateWorldMatrix().transformPoint(point, point);
      before.push(point.clone());
      projectorInverse.transformPoint(point, point);
      expect(point.z).toBeCloseTo(0.005, 5);
      expect(Math.abs(point.x)).toBeLessThan(1.00001);
      expect(Math.abs(point.y)).toBeLessThan(1.00001);
    }
    parent.position.x += 3;
    for (let i = 0; i < before.length; i++) {
      const k = i * 8;
      point.set(
        decal.geometry.vertices[k],
        decal.geometry.vertices[k + 1],
        decal.geometry.vertices[k + 2],
      );
      decal.updateWorldMatrix().transformPoint(point, point);
      expect(point.x).toBeCloseTo(before[i].x + 3, 5);
      expect(point.y).toBeCloseTo(before[i].y, 5);
      expect(point.z).toBeCloseTo(before[i].z, 5);
    }
  });

  it('misses and backface rejection do not attach an invalid decal', () => {
    const target = receiver();
    const options = {
      target,
      material: material(),
      position: [0, 0, 2] as [number, number, number],
      size: [1, 1, 0.1] as [number, number, number],
    };
    expect(() => new Decal(options)).toThrow(RangeError);
    expect(target.children.size).toBe(0);
    expect(
      () =>
        new Decal({
          ...options,
          position: [0, 0, 0],
          rotation: [0, Math.PI, 0],
        }),
    ).toThrow(RangeError);
    expect(target.children.size).toBe(0);
    const back = new Decal({
      ...options,
      position: [0, 0, 0],
      rotation: [0, Math.PI, 0],
      cullBackfaces: false,
    });
    expect(area(back)).toBeCloseTo(1, 6);
  });
});
