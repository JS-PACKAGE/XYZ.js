import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Matrix4, Quaternion, Vector3 } from '../packages/math/src/index.js';
import { Frustum } from '../packages/core/src/frustum.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { InstancedMesh } from '../packages/core/src/instanced-mesh.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { MorphTargets, MorphWeights } from '../packages/core/src/morph.js';
import { HLOD, LOD } from '../packages/core/src/objects3d.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import {
  RenderVisibilityCache,
  RenderVisibilitySet,
} from '../packages/core/src/render-visibility.js';
import { Scene } from '../packages/core/src/scene.js';

function material(): TextureMaterial {
  return new TextureMaterial({
    texture: new Texture({
      width: 1,
      height: 1,
      close() {},
    } as unknown as ImageBitmap),
  });
}
function cube(x = 0): Mesh {
  return new Mesh({
    geometry: Geometry.cube(1),
    material: material(),
    position: [x, 0, 0],
  });
}
function gather(
  scene: Scene,
  cache = new RenderVisibilityCache(),
  out = new RenderVisibilitySet(),
  time = 0,
) {
  const frustum = new Frustum().setFromMatrix(scene.camera3D.updateMatrix(1));
  return cache.collect(scene, scene.camera3D, frustum, out, {
    viewportHeight: 400,
    timeSeconds: time,
  });
}

describe('indexed render visibility', () => {
  it('refreshes raw mutable mesh and ancestor poses without losing offscreen shadow casters', () => {
    const scene = new Scene(),
      group = scene.add(new Group()),
      mesh = group.add(cube());
    const cache = new RenderVisibilityCache(),
      out = new RenderVisibilitySet();
    expect(gather(scene, cache, out).color).toEqual([mesh]);
    group.position.x = 100;
    expect(gather(scene, cache, out).color).toEqual([]);
    expect(out.shadows).toEqual([mesh]);
    expect(out.frustumCulled).toBe(1);
    expect(out.poseChecks).toBe(1);
    mesh.position.x = -100;
    expect(gather(scene, cache, out).color).toEqual([mesh]);
    scene.remove(group);
    expect(gather(scene, cache, out).entries.has(mesh)).toBe(false);
    expect(out.shadows).toEqual([]);
  });

  it('packs only visible instance transforms and their matching colors, preserving full shadow payload', () => {
    const scene = new Scene();
    const mesh = scene.add(
      new InstancedMesh({
        geometry: Geometry.cube(1),
        material: material(),
        count: 3,
      }),
    );
    const transform = new Matrix4(),
      rotation = new Quaternion(),
      scale = new Vector3(1, 1, 1);
    for (let i = 0; i < 3; i++)
      mesh.setMatrixAt(
        i,
        transform.compose(
          new Vector3(i === 1 ? 100 : 0, 0, 0),
          rotation,
          scale,
        ),
      );
    mesh.setColorAt(0, 1, 0, 0);
    mesh.setColorAt(1, 0, 1, 0);
    mesh.setColorAt(2, 0, 0, 1);
    const cache = new RenderVisibilityCache(),
      out = gather(scene, cache);
    const packed = out.entries.get(mesh)!.instances!;
    expect(packed.count).toBe(2);
    expect([...packed.indices.subarray(0, packed.count)]).toEqual([0, 2]);
    expect([...packed.colors!.subarray(0, 6)]).toEqual([1, 0, 0, 0, 0, 1]);
    expect(out.shadows).toEqual([mesh]);
    expect(mesh.matrices[28]).toBe(100);
    const version = packed.version;
    gather(scene, cache, out);
    expect(packed.version).toBe(version);
    mesh.setMatrixAt(1, transform.compose(new Vector3(), rotation, scale));
    gather(scene, cache, out);
    expect([...packed.indices.subarray(0, packed.count)]).toEqual([0, 1, 2]);
    expect(packed.version).toBeGreaterThan(version);
  });

  it('recomputes morph bounds for negative and greater-than-one weights', () => {
    const scene = new Scene(),
      geometry = Geometry.cube(1),
      weights = new MorphWeights([0]);
    const deltas = new Float32Array((geometry.vertices.length / 8) * 3);
    for (let i = 0; i < deltas.length; i += 3) deltas[i] = -50;
    const mesh = scene.add(
      new Mesh({
        geometry,
        material: material(),
        position: [100, 0, 0],
        morph: new MorphTargets({ positions: [deltas], weights }),
      }),
    );
    const cache = new RenderVisibilityCache(),
      out = new RenderVisibilitySet();
    expect(gather(scene, cache, out).color).toEqual([]);
    weights.set(0, 2);
    expect(gather(scene, cache, out).color).toEqual([mesh]);
    weights.set(0, -1);
    expect(gather(scene, cache, out).color).toEqual([]);
  });

  it('keeps unbounded native deformations visible and inflates known displacement for scaled instances', () => {
    class Unbounded extends TextureMaterial {
      override readonly deformationBounds = undefined;
    }
    class Bounded extends TextureMaterial {
      override readonly deformationBounds = 10;
    }
    const scene = new Scene(),
      texture = material().texture;
    const mesh = scene.add(
      new Mesh({
        geometry: Geometry.cube(1),
        material: new Unbounded({ texture }),
        position: [1000, 0, 0],
      }),
    );
    expect(gather(scene).color).toEqual([mesh]);
    const instances = scene.add(
      new InstancedMesh({
        geometry: Geometry.cube(1),
        material: new Bounded({ texture }),
        count: 1,
      }),
    );
    instances.setMatrixAt(
      0,
      new Matrix4().compose(
        new Vector3(100, 0, 0),
        new Quaternion(),
        new Vector3(20, 20, 20),
      ),
    );
    expect(gather(scene).color).toContain(instances);
  });

  it('invalidates late occlusion proofs when camera, occluder, candidates, or membership changes', () => {
    const scene = new Scene(),
      candidate = scene.add(cube());
    candidate.occlusionCulled = true;
    const occluder = scene.add(cube(2)),
      cache = new RenderVisibilityCache(),
      out = new RenderVisibilitySet();
    let provenEpoch = -1;
    const collect = () =>
      cache.collect(
        scene,
        scene.camera3D,
        new Frustum().setFromMatrix(scene.camera3D.updateMatrix(1)),
        out,
        {
          viewportHeight: 400,
          occlusion: { visible: (_mesh, epoch) => epoch !== provenEpoch },
        },
      );
    collect();
    provenEpoch = out.epoch;
    expect(collect().color).not.toContain(candidate);
    expect(out.shadows).toContain(candidate);
    occluder.position.y = 1;
    expect(collect().color).toContain(candidate);
    provenEpoch = out.epoch;
    scene.camera3D.position.x = 0.2;
    expect(collect().color).toContain(candidate);
    provenEpoch = out.epoch;
    candidate.position.x = 0.1;
    expect(collect().color).toContain(candidate);
    provenEpoch = out.epoch;
    scene.remove(occluder);
    expect(collect().color).toContain(candidate);
  });

  it('does not accept occlusion proofs for eye/near-plane intersecting proxies', () => {
    const scene = new Scene(),
      mesh = scene.add(cube());
    mesh.position.z = 4.9;
    mesh.occlusionCulled = true;
    const out = new RenderVisibilityCache().collect(
      scene,
      scene.camera3D,
      new Frustum().setFromMatrix(scene.camera3D.updateMatrix(1)),
      new RenderVisibilitySet(),
      { viewportHeight: 400, occlusion: { visible: () => false } },
    );
    expect(out.color).toContain(mesh);
    expect(out.occlusionCandidates).toEqual([]);
  });
});

describe('screen LOD and HLOD presentation', () => {
  it('uses projected size, hysteresis and interruptible complementary native fade weights', () => {
    const scene = new Scene(),
      camera = new OrthographicCamera();
    camera.height = 10;
    scene.camera3D = camera;
    const near = cube(),
      far = cube(),
      lod = scene.add(new LOD({ crossFadeDuration: 1, hysteresis: 5 }));
    lod.addScreenLevel(near, 70).addScreenLevel(far, 0);
    const cache = new RenderVisibilityCache(),
      out = gather(scene, cache);
    expect(lod.level).toBe(0);
    expect(out.color).toEqual([near]);
    camera.height = 13;
    gather(scene, cache, out, 1);
    expect(lod.level).toBe(1);
    gather(scene, cache, out, 1.5);
    expect(out.entries.get(near)!.fade).toBeCloseTo(0.5);
    expect(out.entries.get(far)!.fade).toBeCloseTo(0.5);
    expect(out.shadows).toEqual(expect.arrayContaining([near, far]));
    camera.height = 10;
    gather(scene, cache, out, 1.5);
    gather(scene, cache, out, 2);
    expect(out.entries.get(near)!.fade).toBeCloseTo(0.75);
    expect(out.entries.get(far)!.fade).toBeCloseTo(0.25);
    gather(scene, cache, out, 2.5);
    expect(out.color).toEqual([near]);
    expect(far.worldVisible).toBe(false);
  });

  it('selects HLOD from child aggregate bounds and retires replacement nodes without destroying borrowed textures', () => {
    const scene = new Scene(),
      camera = new OrthographicCamera();
    camera.height = 10;
    scene.camera3D = camera;
    const left = cube(-2),
      right = cube(2),
      proxy = cube();
    const hlod = scene.add(
      new HLOD({ proxy, children: [left, right], screenSize: 100 }),
    );
    const cache = new RenderVisibilityCache(),
      out = gather(scene, cache);
    expect(hlod.level).toBe(0);
    expect(out.color).toEqual(expect.arrayContaining([left, right]));
    camera.height = 100;
    gather(scene, cache, out);
    expect(hlod.level).toBe(1);
    expect(out.color).toEqual([proxy]);
    const replacement = cube(),
      texture = proxy.material.texture;
    hlod.replaceProxy(replacement);
    gather(scene, cache, out);
    expect(proxy.destroyed).toBe(true);
    expect(texture.destroyed).toBe(false);
    expect(out.entries.has(proxy)).toBe(false);
    expect(out.color).toEqual([replacement]);
    hlod.replaceChildren([cube()]);
    expect(left.destroyed).toBe(true);
    expect(right.destroyed).toBe(true);
    hlod.destroy();
    gather(scene, cache, out);
    expect(replacement.destroyed).toBe(true);
    expect(out.color).toEqual([]);
  });
});

it('keeps Scene insertion order through spatial indexing and remove/re-add between gathers', () => {
  const scene = new Scene(),
    first = scene.add(cube(0.1)),
    second = scene.add(cube(-0.1));
  const cache = new RenderVisibilityCache(),
    out = gather(scene, cache);
  expect(out.color).toEqual([first, second]);
  scene.remove(first);
  scene.add(first);
  expect(gather(scene, cache, out).color).toEqual([second, first]);
});
