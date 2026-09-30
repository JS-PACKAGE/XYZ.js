import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { InstancedMesh } from '../packages/core/src/instanced-mesh.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import { Raycaster, type RaycastHit } from '../packages/core/src/raycaster.js';
import { Scene } from '../packages/core/src/scene.js';
import { SceneObject } from '../packages/core/src/scene-object.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';
import { Matrix4, Quaternion, Vector3 } from '../packages/math/src/index.js';

function triangle(): Geometry {
  return new Geometry({
    positions: [-1, -1, 0, 1, -1, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 1, 0, 0.5, 1],
    indices: [0, 1, 2],
  });
}

function material(): TextureMaterial {
  return new TextureMaterial({
    texture: new Texture({
      width: 1,
      height: 1,
      close() {},
    } as unknown as ImageBitmap),
  });
}

function normal(matrix: Matrix4): Vector3 {
  const origin = matrix.transformPoint(new Vector3());
  return matrix
    .transformPoint(new Vector3(1, 0, 0))
    .subtract(origin)
    .cross(matrix.transformPoint(new Vector3(0, 1, 0)).subtract(origin))
    .normalize();
}

function expectPoint(actual: Vector3, expected: Vector3): void {
  expect(actual.x).toBeCloseTo(expected.x, 4);
  expect(actual.y).toBeCloseTo(expected.y, 4);
  expect(actual.z).toBeCloseTo(expected.z, 4);
}

describe('3D cameras', () => {
  it('aims both projections at an arbitrary target, including vertical directions', () => {
    for (const camera of [new PerspectiveCamera(), new OrthographicCamera()]) {
      camera.position.set(3, 4, 7);
      const target = new Vector3(-2, 1, -3);
      camera.lookAt(target);
      const projected = camera.updateMatrix(1.5).transformPoint(target);
      expect(projected.x).toBeCloseTo(0, 5);
      expect(projected.y).toBeCloseTo(0, 5);
      const raycaster = new Raycaster().setFromCamera(0, 0, camera, 1.5);
      expectPoint(raycaster.origin, camera.position);
      expectPoint(
        raycaster.direction,
        target.clone().subtract(camera.position).normalize(),
      );
      for (const y of [-1, 1]) {
        camera.position.set(0, 0, 0);
        camera.lookAt(new Vector3(0, y * 2, 0));
        const pole = camera
          .updateMatrix(1)
          .transformPoint(new Vector3(0, y * 2, 0));
        expect(pole.x).toBeCloseTo(0, 5);
        expect(pole.y).toBeCloseTo(0, 5);
        expect(
          Math.hypot(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z,
            camera.rotation.w,
          ),
        ).toBeCloseTo(1, 6);
      }
    }
  });

  it('maps orthographic viewport edges and near/far depth independently of distance', () => {
    const camera = new OrthographicCamera();
    camera.position.set(0, 0, 0);
    camera.height = 8;
    camera.zoom = 2;
    camera.near = 1;
    camera.far = 11;
    const matrix = camera.updateMatrix(2);
    expectPoint(
      matrix.transformPoint(new Vector3(4, 2, -1)),
      new Vector3(1, 1, 0),
    );
    expectPoint(
      matrix.transformPoint(new Vector3(4, 2, -11)),
      new Vector3(1, 1, 1),
    );
    const left = new Raycaster().setFromCamera(-0.5, 0.5, camera, 2);
    const right = new Raycaster().setFromCamera(0.5, -0.5, camera, 2);
    expectPoint(left.origin, new Vector3(-2, 1, 0));
    expectPoint(right.origin, new Vector3(2, -1, 0));
    expectPoint(left.direction, right.direction);
    camera.near = 0;
    expect(camera.updateMatrix(2).transformPoint(new Vector3()).z).toBeCloseTo(
      0,
    );
    camera.zoom = 0;
    expect(() => camera.updateMatrix(2)).toThrow(RangeError);
  });

  it('keeps perspective origins shared while NDC offsets change ray direction', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(0, 0, 0);
    camera.fov = Math.PI / 2;
    const ray = new Raycaster().setFromCamera(1, 1, camera, 2);
    expectPoint(ray.origin, camera.position);
    expectPoint(ray.direction, new Vector3(2, 1, -1).normalize());
  });
});

describe('exact 3D picking', () => {
  it('picks a reflected, nonuniformly scaled and rotated child in world units without duplicate flat registrations', () => {
    const parent = new Group();
    parent.position.set(2, 3, -1);
    parent.rotation.setFromEuler(0, 0.45, 0);
    parent.scale.set(2, 0.75, 1.5);
    const mesh = parent.add(
      new Mesh({
        geometry: triangle(),
        material: material(),
        position: [0.3, -0.2, 0.5],
        rotation: [0.3, 0, 0],
        scale: [-1, 2, 0.5],
      }),
    );
    const matrix = mesh.updateWorldMatrix();
    const point = matrix.transformPoint(new Vector3(0, -0.25, 0));
    const camera = new PerspectiveCamera();
    camera.position.copy(point).add(normal(matrix).scale(5));
    camera.lookAt(point);
    const scene = new Scene();
    scene.add(parent);
    class NonMesh extends SceneObject {}
    scene.add(new NonMesh());
    const raycaster = new Raycaster().setFromCamera(0, 0, camera, 1);
    const out: RaycastHit[] = [];
    expect(raycaster.intersectObjects(scene.objects, true, out)).toBe(out);
    expect(out).toHaveLength(1);
    expect(out[0].object).toBe(mesh);
    expect(out[0].faceIndex).toBe(0);
    expect(out[0].distance).toBeCloseTo(5, 4);
    expectPoint(out[0].point, point);
    expect(raycaster.intersectObjects([parent], false)).toEqual([]);
    parent.visible = false;
    expect(raycaster.intersectObjects(scene.objects, true, out)).toEqual([]);
    parent.visible = true;
    mesh.visible = false;
    expect(raycaster.intersectObjects(scene.objects)).toEqual([]);
    scene.destroy();
  });

  it('rejects points inside bounds but outside the triangle and handles planar singular transforms', () => {
    const mesh = new Mesh({
      geometry: triangle(),
      material: material(),
      scale: [2, 2, 0],
    });
    const camera = new OrthographicCamera();
    const raycaster = new Raycaster();
    raycaster.setFromCamera(0.36, 0.32, camera, 1);
    expect(raycaster.intersectObjects([mesh])).toEqual([]);
    raycaster.setFromCamera(0, -0.1, camera, 1);
    const hits = raycaster.intersectObjects([mesh]);
    expect(hits).toHaveLength(1);
    expect(hits[0].distance).toBeCloseTo(5, 5);
    expectPoint(hits[0].point, new Vector3(0, -0.5, 0));
    mesh.scale.x = 0;
    expect(raycaster.intersectObjects([mesh])).toEqual([]);
  });

  it('returns instance IDs and transformed hit positions after composing a hierarchy with each instance', () => {
    const root = new Group();
    root.position.set(1, 2, -2);
    root.rotation.setFromEuler(0, 0.5, 0);
    root.scale.set(2, 1, 3);
    const mesh = root.add(
      new InstancedMesh({
        geometry: triangle(),
        material: material(),
        count: 2,
      }),
    );
    mesh.setMatrixAt(
      0,
      new Matrix4().compose(
        new Vector3(100, 0, 0),
        new Quaternion(),
        new Vector3(1, 1, 1),
      ),
    );
    const instance = new Matrix4().compose(
      new Vector3(1, 0, -1),
      new Quaternion().setFromEuler(0.2, 0.1, 0.3),
      new Vector3(-0.8, 1.2, 0.5),
    );
    mesh.setMatrixAt(1, instance);
    const world = new Matrix4()
      .copy(mesh.updateWorldMatrix())
      .multiply(instance);
    const point = world.transformPoint(new Vector3(0, -0.25, 0));
    const camera = new PerspectiveCamera();
    camera.position.copy(point).add(normal(world).scale(4));
    camera.lookAt(point);
    const hits = new Raycaster()
      .setFromCamera(0, 0, camera, 1)
      .intersectObjects([root, mesh]);
    expect(hits).toHaveLength(1);
    expect(hits[0].object).toBe(mesh);
    expect(hits[0].instanceId).toBe(1);
    expect(hits[0].distance).toBeCloseTo(4, 4);
    expectPoint(hits[0].point, point);
  });

  it('sorts intersections by world distance and honors near/far after instance updates', () => {
    const mesh = new InstancedMesh({
      geometry: triangle(),
      material: material(),
      count: 3,
    });
    for (const [i, z] of [0, -2, 2].entries())
      mesh.setMatrixAt(
        i,
        new Matrix4().compose(
          new Vector3(0, 0, z),
          new Quaternion(),
          new Vector3(1, 1, 2),
        ),
      );
    const raycaster = new Raycaster().setFromCamera(
      0,
      0,
      new PerspectiveCamera(),
      1,
    );
    const out = raycaster.intersectObjects([mesh]);
    expect(out.map((hit) => hit.instanceId)).toEqual([2, 0, 1]);
    expect(out.map((hit) => hit.distance)).toEqual([3, 5, 7]);
    raycaster.near = 4;
    raycaster.far = 6;
    expect(
      raycaster
        .intersectObjects([mesh], true, out)
        .map((hit) => hit.instanceId),
    ).toEqual([0]);
    mesh.setMatrixAt(
      0,
      new Matrix4().compose(
        new Vector3(0, 0, -4),
        new Quaternion(),
        new Vector3(1, 1, 1),
      ),
    );
    expect(raycaster.intersectObjects([mesh], true, out)).toEqual([]);
  });

  it('uses updated skeletal deformation before reading triangles', () => {
    const joint = new Group();
    const mesh = new SkinnedMesh({
      geometry: triangle(),
      material: material(),
      joints: [joint],
      jointIndices: new Uint32Array(12),
      weights: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    });
    const camera = new PerspectiveCamera();
    const raycaster = new Raycaster().setFromCamera(0, 0, camera, 1);
    expect(raycaster.intersectObjects([mesh])[0].distance).toBeCloseTo(5);
    joint.position.z = 2;
    expect(raycaster.intersectObjects([mesh])[0].distance).toBeCloseTo(3);
    joint.position.x = 10;
    expect(raycaster.intersectObjects([mesh])).toEqual([]);
  });
});
