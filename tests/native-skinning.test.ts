import { describe, expect, it } from 'vitest';
import { NativeTexture2D } from '../packages/assets/src/native-texture.js';
import { Frustum } from '../packages/core/src/frustum.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { TextureMaterial } from '../packages/core/src/mesh.js';
import { MorphTargets, MorphWeights } from '../packages/core/src/morph.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { Raycaster } from '../packages/core/src/raycaster.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';
import { Matrix4 } from '../packages/math/src/index.js';

function material(): TextureMaterial {
  return new TextureMaterial({
    texture: new NativeTexture2D({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      levels: [
        { width: 1, height: 1, data: new Uint8Array([255, 255, 255, 255]) },
      ],
    }),
  });
}

function skin(joints: Group[], morph?: MorphTargets): SkinnedMesh {
  const geometry = Geometry.quad(1, 1);
  const indices = new Uint32Array(16),
    weights = new Float32Array(16);
  for (let vertex = 0; vertex < 4; vertex++)
    for (let influence = 0; influence < 4; influence++) {
      indices[vertex * 4 + influence] = influence % joints.length;
      weights[vertex * 4 + influence] = influence + 1;
    }
  return new SkinnedMesh({
    geometry,
    material: material(),
    joints,
    jointIndices: indices,
    weights,
    morph,
  });
}

describe('native skin streams and exact CPU queries', () => {
  it('accepts an eight-influence vertex whose weight is entirely in the second set', () => {
    const joints = Array.from({ length: 8 }, () => new Group());
    joints[7].position.x = 9;
    const geometry = Geometry.quad(1, 1);
    const indices = new Uint32Array(32),
      weights = new Float32Array(32);
    for (let vertex = 0; vertex < 4; vertex++) {
      for (let influence = 0; influence < 8; influence++)
        indices[vertex * 8 + influence] = influence;
      weights[vertex * 8 + 7] = 0.75;
    }
    const mesh = new SkinnedMesh({
      geometry,
      material: material(),
      joints,
      jointIndices: indices,
      weights,
      influencesPerVertex: 8,
    });
    try {
      mesh.updateSkin();
      for (let vertex = 0; vertex < 4; vertex++)
        expect(mesh.geometry.vertices[vertex * 8]).toBeCloseTo(
          geometry.vertices[vertex * 8] + 9,
        );
      weights.fill(0);
      expect(
        () =>
          new SkinnedMesh({
            geometry,
            material: mesh.material,
            joints,
            jointIndices: indices,
            weights,
            influencesPerVertex: 8,
          }),
      ).toThrow(/positive total/);
      weights[7] = 1;
      indices[7] = 8;
      expect(
        () =>
          new SkinnedMesh({
            geometry,
            material: mesh.material,
            joints,
            jointIndices: indices,
            weights,
            influencesPerVertex: 8,
          }),
      ).toThrow(/invalid/);
    } finally {
      mesh.material.texture.destroy();
    }
  });

  it('moves into the frustum before culling without deforming the bind stream or CPU mirror', () => {
    const joint = new Group(),
      mesh = skin([joint]);
    const camera = new OrthographicCamera();
    camera.height = 4;
    const frustum = new Frustum().setFromMatrix(camera.updateMatrix(1));
    joint.position.x = 20;
    expect(mesh.isInFrustum(frustum)).toBe(false);
    const bindVersion = mesh.renderGeometry.version,
      mirrorVersion = mesh.geometry.version;
    const bind = mesh.renderGeometry.vertices.slice();
    joint.position.x = 0;
    expect(mesh.isInFrustum(frustum)).toBe(true);
    expect(mesh.renderGeometry.vertices).toEqual(bind);
    expect(mesh.renderGeometry.version).toBe(bindVersion);
    expect(mesh.geometry.version).toBe(mirrorVersion);
    joint.position.x = 1;
    const ray = new Raycaster();
    ray.origin.set(1, 0, 5);
    const hit = ray.intersectObjects([mesh])[0];
    expect(hit.point.x).toBeCloseTo(1);
    expect(hit.distance).toBeCloseTo(5);
    expect(mesh.geometry.vertices[0]).toBeCloseTo(0.5);
    expect(mesh.renderGeometry.vertices[0]).toBeCloseTo(-0.5);
    mesh.material.texture.destroy();
  });

  it('conservatively encloses four-influence skinning after signed morphs and nonuniform joint transforms', () => {
    const joints = Array.from({ length: 4 }, () => new Group());
    joints[0].position.set(-4, 1, 0);
    joints[1].position.set(3, -2, 1);
    joints[2].scale.set(-2, 0.5, 3);
    joints[3].rotation.setFromEuler(0.2, 0.4, 0.7);
    const weights = new MorphWeights([-2]);
    const mesh = skin(
      joints,
      new MorphTargets({
        positions: [[0, 0, 1, 0, 1, 2, 1, 0, -1, 0, -1, 0.5]],
        weights,
      }),
    );
    mesh.updateRenderDeformation();
    const sphere = mesh.boundingSphere;
    mesh.updateSkin();
    for (let vertex = 0; vertex < 4; vertex++) {
      const offset = vertex * 8,
        vertices = mesh.geometry.vertices;
      const distance = Math.hypot(
        vertices[offset] - sphere.x,
        vertices[offset + 1] - sphere.y,
        vertices[offset + 2] - sphere.z,
      );
      expect(distance).toBeLessThanOrEqual(sphere.radius);
      expect(
        Math.hypot(
          vertices[offset + 3],
          vertices[offset + 4],
          vertices[offset + 5],
        ),
      ).toBeCloseTo(1);
    }
    expect(mesh.renderGeometry.vertices[2]).toBe(-2);
    const paletteVersion = mesh.paletteVersion;
    weights.set(0, 3);
    mesh.updateSkin();
    expect(mesh.renderGeometry.vertices[2]).toBe(3);
    expect(mesh.paletteVersion).toBe(paletteVersion);
    const next = mesh.boundingSphere;
    for (let vertex = 0; vertex < 4; vertex++) {
      const offset = vertex * 8,
        vertices = mesh.geometry.vertices;
      expect(
        Math.hypot(
          vertices[offset] - next.x,
          vertices[offset + 1] - next.y,
          vertices[offset + 2] - next.z,
        ),
      ).toBeLessThanOrEqual(next.radius);
    }
    mesh.material.texture.destroy();
  });

  it('keeps explicit skin queries mesh-local with inverse bind matrices and stale pick invalidation', () => {
    const joint = new Group(),
      mesh = skin([joint]);
    const inverse = mesh.inverseBindMatrices[0] as Matrix4;
    inverse.elements[12] = -2;
    mesh.position.x = 3;
    joint.position.x = 6;
    mesh.updateSkin();
    expect(mesh.geometry.vertices[0]).toBeCloseTo(0.5);
    const ray = new Raycaster();
    ray.origin.set(4, 0, 5);
    expect(ray.intersectObjects([mesh])[0].point.x).toBeCloseTo(4);
    joint.position.x = 10;
    expect(ray.intersectObjects([mesh])).toEqual([]);
    ray.origin.x = 8;
    expect(ray.intersectObjects([mesh])[0].point.x).toBeCloseTo(8);
    mesh.material.texture.destroy();
  });
});
