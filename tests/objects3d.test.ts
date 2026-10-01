import { afterEach, describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import {
  Billboard,
  Sprite3D,
  Line3D,
  LOD,
  isCameraDependent,
} from '../packages/core/src/objects3d.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector3 } from '../packages/math/src/index.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function material(): TextureMaterial {
  const texture = Object.create(Texture.prototype) as Texture;
  return new TextureMaterial({ texture });
}

/** Rotates +Z by the object's quaternion: the direction a quad's front face points. */
function front(object: Mesh): Vector3 {
  const q = object.rotation;
  return new Vector3(
    2 * (q.x * q.z + q.w * q.y),
    2 * (q.y * q.z - q.w * q.x),
    1 - 2 * (q.x * q.x + q.y * q.y),
  );
}

function unit(v: Vector3): Vector3 {
  return v.clone().scale(1 / v.length());
}

describe('Billboard', () => {
  it('turns its front face toward a perspective camera, spherically or around Y only', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(4, 3, 5);
    const board = new Billboard({ material: material(), position: [0, 0, 0] });
    board.updateForCamera(camera);
    const toCamera = unit(new Vector3(4, 3, 5));
    const f = front(board);
    expect(f.dot(toCamera)).toBeCloseTo(1, 5);

    board.mode = 'cylindrical';
    board.updateForCamera(camera);
    const g = front(board);
    expect(g.y).toBeCloseTo(0, 5);
    expect(g.dot(unit(new Vector3(4, 0, 5)))).toBeCloseTo(1, 5);
  });

  it('faces against the view direction for an orthographic camera and uses world position', () => {
    const ortho = new OrthographicCamera();
    ortho.position.set(10, 0, 0);
    ortho.lookAt(new Vector3(0, 0, 0));
    const group = new Group();
    group.position.set(0, 0, 5);
    const board = new Billboard({ material: material(), position: [0, 1, 0] });
    group.add(board);
    board.updateForCamera(ortho);
    // The camera looks along -X, so the quad's front must point along +X wherever it sits.
    const f = front(board);
    expect(f.x).toBeCloseTo(1, 5);
    expect(Math.abs(f.y) + Math.abs(f.z)).toBeLessThan(1e-5);
  });

  it('rejects invalid size and facing mode', () => {
    expect(() => new Billboard({ material: material(), width: 0 })).toThrow(
      RangeError,
    );
    expect(
      () => new Billboard({ material: material(), mode: 'flat' as never }),
    ).toThrow(RangeError);
  });
});

describe('Sprite3D', () => {
  function texture(): Texture {
    return Object.assign(Object.create(Texture.prototype), {
      width: 8,
      height: 4,
    }) as Texture;
  }

  it('preserves the last valid atlas frame when a frame change fails', () => {
    const sprite = new Sprite3D({
      texture: texture(),
      source: { x: 0, y: 0, width: 4, height: 4 },
    });
    sprite.setSource({ x: 4, y: 0, width: 4, height: 4 });
    expect(() => sprite.setSource({ x: 7, y: 0, width: 4, height: 4 })).toThrow(
      RangeError,
    );
    expect(sprite.source).toEqual({ x: 4, y: 0, width: 4, height: 4 });
  });
});

describe('LOD', () => {
  function lod() {
    const near = new Group();
    const mid = new Group();
    const far = new Group();
    const object = new LOD()
      .addLevel(far, 40)
      .addLevel(near, 0)
      .addLevel(mid, 15);
    return { object, near, mid, far };
  }

  it('shows exactly the level for the camera distance, whatever order they were added', () => {
    const { object, near, mid, far } = lod();
    const camera = new PerspectiveCamera();
    expect(object.levels.map((l) => l.distance)).toEqual([0, 15, 40]);
    const at = (distance: number) => {
      camera.position.set(0, 0, distance);
      object.updateForCamera(camera);
      return [near.visible, mid.visible, far.visible];
    };
    expect(at(3)).toEqual([true, false, false]);
    expect(at(15)).toEqual([false, true, false]);
    expect(at(39.9)).toEqual([false, true, false]);
    expect(at(500)).toEqual([false, false, true]);
    expect(object.level).toBe(2);
  });

  it('uses the LOD world position and holds a level inside the hysteresis band', () => {
    const { object, near, mid } = lod();
    object.position.set(100, 0, 0);
    object.hysteresis = 2;
    const camera = new PerspectiveCamera();
    camera.position.set(100, 0, 14);
    object.updateForCamera(camera);
    expect(near.visible).toBe(true);
    camera.position.set(100, 0, 15.5);
    object.updateForCamera(camera);
    expect(near.visible).toBe(true);
    camera.position.set(100, 0, 17.5);
    object.updateForCamera(camera);
    expect(mid.visible).toBe(true);
    camera.position.set(100, 0, 14);
    object.updateForCamera(camera);
    expect(mid.visible).toBe(true);
    camera.position.set(100, 0, 12);
    object.updateForCamera(camera);
    expect(near.visible).toBe(true);
  });

  it('rejects bad distances and duplicate levels', () => {
    const level = new Group();
    const object = new LOD().addLevel(level, 0);
    expect(() => object.addLevel(new Group(), -1)).toThrow(RangeError);
    expect(() => object.addLevel(new Group(), Number.NaN)).toThrow(RangeError);
    expect(() => object.addLevel(level, 5)).toThrow();
  });
});

describe('Line3D', () => {
  const line = (points: [number, number, number][], options = {}) =>
    new Line3D(points, { material: material(), width: 0.2, ...options });

  it('builds one quad per segment with the requested width perpendicular to the view', () => {
    const l = line([
      [0, 0, 0],
      [4, 0, 0],
      [4, 4, 0],
    ]);
    expect(l.geometry.indices.length).toBe(12);
    const camera = new PerspectiveCamera();
    camera.position.set(0, 0, 10);
    l.updateForCamera(camera);
    const v = l.geometry.vertices;
    // First segment runs along +X, the camera is on +Z, so the ribbon spreads along Y.
    expect(v[1]).toBeCloseTo(0.1);
    expect(v[9]).toBeCloseTo(-0.1);
    expect([v[0], v[2], v[8], v[10]]).toEqual([0, 0, 0, 0]);
    expect(Math.abs(v[16]! - 4)).toBeLessThan(1e-6);
    const normal = [v[3], v[4], v[5]];
    // Normals point from the segment midpoint (2, 0, 0) toward the camera.
    expect(normal[2]).toBeCloseTo(10 / Math.hypot(2, 10), 5);
    // Moving to the other side flips the ribbon rather than leaving it edge-on.
    camera.position.set(0, 0, -10);
    l.updateForCamera(camera);
    expect(v[1]).toBeCloseTo(-0.1);
  });

  it('closes loops, moves points and works under a transformed parent', () => {
    const l = line(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { closed: true },
    );
    expect(l.geometry.indices.length).toBe(18);
    l.setPoint(2, 5, 5, 0);
    expect(l.point(2)).toEqual([5, 5, 0]);
    const group = new Group();
    group.position.set(0, 0, -20);
    group.add(l);
    const camera = new PerspectiveCamera();
    camera.position.set(0, 0, 0);
    l.updateForCamera(camera);
    // In the group's local space the camera sits at z = +20.
    expect(l.geometry.vertices[5]).toBeGreaterThan(0.9);
  });

  it('validates points, width and indices', () => {
    expect(() => line([[0, 0, 0]])).toThrow(RangeError);
    expect(() =>
      line(
        [
          [0, 0, 0],
          [1, 0, 0],
        ],
        { closed: true },
      ),
    ).toThrow(RangeError);
    expect(() =>
      line(
        [
          [0, 0, 0],
          [1, 0, 0],
        ],
        { width: 0 },
      ),
    ).toThrow(RangeError);
    const l = line([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    expect(() => l.setPoint(2, 0, 0, 0)).toThrow(RangeError);
    expect(() => l.setPoint(0, Number.NaN, 0, 0)).toThrow(RangeError);
  });
});

describe('Scene integration', () => {
  it('updates camera-dependent objects once per frame hook and stops after removal or hide', () => {
    const scene = new Scene();
    const board = scene.add(new Billboard({ material: material() }));
    const hidden = scene.add(new Billboard({ material: material() }));
    hidden.visible = false;
    const spy = vi.spyOn(board, 'updateForCamera');
    const hiddenSpy = vi.spyOn(hidden, 'updateForCamera');
    expect(isCameraDependent(board)).toBe(true);
    expect(isCameraDependent(new Group())).toBe(false);
    scene.camera3D.position.set(0, 0, 9);
    scene.advanceAfterUpdate(1 / 60, () => true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toBe(scene.camera3D);
    expect(hiddenSpy).not.toHaveBeenCalled();
    scene.remove(board);
    scene.advanceAfterUpdate(1 / 60, () => true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ticks a LOD that sits under a registered group', () => {
    const scene = new Scene();
    const near = new Group();
    const far = new Group();
    const object = new LOD().addLevel(near, 0).addLevel(far, 30);
    const root = new Group();
    root.add(object);
    scene.add(root);
    scene.camera3D.position.set(0, 0, 50);
    scene.advanceAfterUpdate(1 / 60, () => true);
    expect(far.visible).toBe(true);
    expect(near.visible).toBe(false);
  });
});
