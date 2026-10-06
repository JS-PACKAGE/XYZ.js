import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { TextureMaterial } from '../packages/core/src/mesh.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Ribbon3D, Trail3D } from '../packages/core/src/ribbon3d.js';

const material = new TextureMaterial({
  texture: new Texture({ width: 1, height: 1, close() {} } as ImageBitmap),
  transparent: true,
});

describe('Ribbon3D', () => {
  it('generates a flat strip with interpolated age width and colors', () => {
    const ribbon = new Ribbon3D({
      material,
      maxPoints: 4,
      mode: 'flat',
      lifetime: 2,
      curve: [
        { age: 0, width: 2, color: [1, 0, 0, 1] },
        { age: 1, width: 0, color: [0, 0, 1, 0] },
      ],
    });
    ribbon.addPoint(0, 0, 0, 0);
    ribbon.addPoint(2, 0, 0, 1);
    const buffer = ribbon.geometry.vertices;
    ribbon.update(1);
    expect(ribbon.geometry.vertices).toBe(buffer);
    expect(ribbon.pointCount).toBe(2);
    expect(buffer[2]).toBeCloseTo(-0.5);
    expect(buffer[10]).toBeCloseTo(0.5);
    expect(buffer[18]).toBeCloseTo(-1);
    expect([...ribbon.geometry.colors!.slice(0, 4)]).toEqual([
      0.5, 0, 0.5, 0.5,
    ]);
    expect([...ribbon.geometry.colors!.slice(16, 20)]).toEqual([0, 0, 0, 0]);
    expect(ribbon.visible).toBe(true);
    expect(ribbon.geometry.version).toBe(1);
  });
  it('bounds points, degenerates unused triangles and expires oldest samples', () => {
    const ribbon = new Ribbon3D({ material, maxPoints: 3, lifetime: 2 });
    for (let i = 0; i < 5; i++) ribbon.addPoint(i, 0, 0, i);
    expect(ribbon.pointCount).toBe(3);
    ribbon.update(4);
    expect(ribbon.pointCount).toBe(2);
    expect(ribbon.geometry.vertices[0]).toBe(3);
    const unused = ribbon.geometry.vertices.slice(32, 35);
    const last = ribbon.geometry.vertices.slice(24, 27);
    expect(unused[0]).toBe(last[0]);
    ribbon.update(6);
    expect(ribbon.pointCount).toBe(0);
    expect(ribbon.visible).toBe(false);
    expect([...ribbon.geometry.vertices].every(Number.isFinite)).toBe(true);
  });
  it('builds camera facing width perpendicular to the tangent and view', () => {
    const ribbon = new Ribbon3D({ material, maxPoints: 2, lifetime: 10 });
    ribbon.addPoint(0, 0, 0, 0);
    ribbon.addPoint(1, 0, 0, 0);
    ribbon.update(0, [0, 0, 1]);
    expect(ribbon.geometry.vertices[1]).toBeCloseTo(0.5);
    expect(ribbon.geometry.vertices[9]).toBeCloseTo(-0.5);
    expect(() => ribbon.update(0, [0, 0, 0])).toThrow();
    expect(() => ribbon.addPoint(0, 0, 0, -1)).toThrow();
  });
  it('samples ancestor world transforms and resets sampling on clear', () => {
    const parent = new Object3D(),
      target = new Object3D();
    parent.position.set(10, 0, 0);
    parent.add(target);
    const trail = new Trail3D({ material, target, minimumDistance: 1 });
    trail.sample(0);
    target.position.x = 0.5;
    trail.sample(0.1);
    expect(trail.pointCount).toBe(1);
    target.position.x = 2;
    trail.sample(0.2);
    expect(trail.pointCount).toBe(2);
    expect(trail.geometry.vertices[0]).toBeCloseTo(10);
    trail.clear();
    trail.sample(0.3);
    expect(trail.pointCount).toBe(1);
  });
});
