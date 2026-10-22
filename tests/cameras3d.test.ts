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

  it('hits the far tip of a stretched, rotated mesh and finds nothing for rays that pass beside it', () => {
    const plank = new Mesh({
      geometry: Geometry.cube(1),
      material: material(),
      scale: [8, 0.2, 0.2],
    });
    plank.rotation.setFromEuler(0, 0, 0.6);
    const raycaster = new Raycaster();
    raycaster.direction.set(0, 0, -1);
    // The plank's axis runs toward (0.825, 0.565); this point lies 3.97 along it, inside the tip.
    raycaster.origin.set(3.3, 2.2, 5);
    const hits = raycaster.intersectObjects([plank]);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].distance).toBeCloseTo(4.9, 4);
    // Beside the plank, and in line with it but beyond the tip.
    raycaster.origin.set(3.3, 5, 5);
    expect(raycaster.intersectObjects([plank])).toEqual([]);
    raycaster.origin.set(5.5, 3.8, 5);
    expect(raycaster.intersectObjects([plank])).toEqual([]);
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

  it('finds every corner hit on quarter-turned and sheared instances under a moved parent', () => {
    // Quarter turns and uniform scales leave conservative bounds no slack, so instances whose
    // bounds were underestimated or misplaced would lose these grazing corner hits.
    const root = new Group();
    root.position.set(60, -45, 80);
    root.rotation.setFromEuler(0, Math.PI / 2, 0);
    root.scale.set(2, 2, 2);
    // An off-center box, so the bounding sphere center itself moves with each instance.
    const offset = [0.3, -0.2, 0.5] as const;
    const cube = Geometry.cube(1);
    const positions: number[] = [],
      normals: number[] = [],
      uvs: number[] = [];
    for (let at = 0; at < cube.vertices.length; at += 8) {
      for (let axis = 0; axis < 3; axis++) {
        positions.push(cube.vertices[at + axis]! + offset[axis]);
        normals.push(cube.vertices[at + 3 + axis]!);
      }
      uvs.push(cube.vertices[at + 6]!, cube.vertices[at + 7]!);
    }
    const geometry = new Geometry({
      positions,
      normals,
      uvs,
      indices: cube.indices,
    });
    const mesh = root.add(
      new InstancedMesh({ geometry, material: material(), count: 12 }),
    );
    const instances: Matrix4[] = [];
    for (let i = 0; i < mesh.count; i++) {
      const tight = i % 2 === 0;
      const matrix = new Matrix4().compose(
        new Vector3((i % 4) * 3 - 4, (i % 3) - 1, Math.floor(i / 4) * 3 - 3),
        tight
          ? new Quaternion().setFromEuler(0, 0, (Math.PI / 2) * (1 + (i % 3)))
          : new Quaternion().setFromEuler(i * 0.7, i * 1.3, i * 0.4),
        tight
          ? new Vector3(
              1.5 + (i % 3) * 0.5,
              1.5 + (i % 3) * 0.5,
              1.5 + (i % 3) * 0.5,
            )
          : new Vector3(0.4 + (i % 3) * 0.6, 1.5 - (i % 2) * 0.9, 0.7),
      );
      if (!tight) {
        const shear = new Matrix4();
        shear.elements[4] = 0.35 * ((i % 3) - 1);
        shear.elements[8] = -0.2;
        matrix.multiply(shear);
      }
      mesh.setMatrixAt(i, matrix);
      // The oracle composes the stored (Float32) matrices, as picking does.
      instances.push(mesh.getMatrixAt(i, new Matrix4()));
    }
    const meshWorld = new Matrix4().copy(mesh.updateWorldMatrix());
    const corner = (instance: number, x: number, y: number, z: number) =>
      new Matrix4()
        .copy(meshWorld)
        .multiply(instances[instance]!)
        .transformPoint(new Vector3(x, y, z));
    // Brute force over every triangle of every composed instance, two-sided.
    const expected = (origin: Vector3, direction: Vector3) => {
      const hits: { instance: number; face: number; distance: number }[] = [];
      const v = geometry.vertices,
        indices = geometry.indices;
      for (let instance = 0; instance < mesh.count; instance++)
        for (let face = 0; face < indices.length / 3; face++) {
          const [a, b, c] = [0, 1, 2].map((k) => {
            const at = indices[face * 3 + k]! * 8;
            return corner(instance, v[at]!, v[at + 1]!, v[at + 2]!);
          });
          const e1 = b!.clone().subtract(a!),
            e2 = c!.clone().subtract(a!);
          const p = direction.clone().cross(e2),
            det = e1.dot(p);
          if (Math.abs(det) < 1e-12) continue;
          const t0 = origin.clone().subtract(a!);
          const u = t0.dot(p) / det,
            q = t0.clone().cross(e1),
            w = direction.dot(q) / det,
            distance = e2.dot(q) / det;
          if (u >= 0 && w >= 0 && u + w <= 1 && distance >= 0)
            hits.push({ instance, face, distance });
        }
      return hits.sort((x, y) => x.distance - y.distance);
    };
    const raycaster = new Raycaster();
    let total = 0;
    for (let i = 0; i < mesh.count; i++)
      for (const [x, y, z] of [
        [0.49, 0.49, 0.49],
        [-0.49, 0.49, -0.49],
        [0.49, -0.49, -0.49],
        [-0.49, -0.49, 0.49],
      ] as const) {
        // A ray through a point just inside a corner, perpendicular to the line from the
        // instance's center: it passes the center at nearly the instance's full extent.
        const target = corner(i, x + offset[0], y + offset[1], z + offset[2]);
        const away = target
          .clone()
          .subtract(corner(i, offset[0], offset[1], offset[2]));
        const direction = away
          .clone()
          .cross(new Vector3(0.3, 1, -0.2))
          .normalize();
        raycaster.origin.copy(target).subtract(direction.clone().scale(60));
        raycaster.direction.copy(direction);
        const hits = raycaster.intersectObjects([root]);
        const truth = expected(raycaster.origin, raycaster.direction);
        expect(truth.some((hit) => hit.instance === i)).toBe(true);
        expect(hits.map((hit) => [hit.instanceId, hit.faceIndex])).toEqual(
          truth.map((hit) => [hit.instance, hit.face]),
        );
        // Grazing hits amplify rounding, so distances agree relatively, not to fixed digits.
        hits.forEach((hit, k) =>
          expect(Math.abs(hit.distance - truth[k]!.distance)).toBeLessThan(
            1e-5 * truth[k]!.distance,
          ),
        );
        total += hits.length;
      }
    expect(total).toBeGreaterThan(mesh.count * 4);
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
