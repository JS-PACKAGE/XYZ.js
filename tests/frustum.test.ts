import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Frustum } from '../packages/core/src/frustum.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { InstancedMesh } from '../packages/core/src/instanced-mesh.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import type { BoundingSphere3D } from '../packages/core/src/render-bounds.js';

function material(): TextureMaterial {
  return new TextureMaterial({
    texture: new Texture({
      width: 1,
      height: 1,
      close() {},
    } as unknown as ImageBitmap),
  });
}

function cameraFrustum(): Frustum {
  const camera = new PerspectiveCamera(); // at z=5 looking down -Z, near 0.1, far 100
  return new Frustum().setFromMatrix(camera.updateMatrix(1));
}

describe('Frustum', () => {
  it('accepts spheres inside and rejects spheres beyond each plane', () => {
    const frustum = cameraFrustum();
    expect(frustum.intersectsSphere(0, 0, 0, 0.5)).toBe(true);
    expect(frustum.intersectsSphere(0, 0, 200, 1)).toBe(false); // behind camera
    expect(frustum.intersectsSphere(0, 0, -200, 1)).toBe(false); // past far
    expect(frustum.intersectsSphere(100, 0, 0, 1)).toBe(false); // right
    expect(frustum.intersectsSphere(-100, 0, 0, 1)).toBe(false); // left
    expect(frustum.intersectsSphere(0, 100, 0, 1)).toBe(false); // top
    expect(frustum.intersectsSphere(0, -100, 0, 1)).toBe(false); // bottom
  });

  it('keeps spheres that straddle a plane', () => {
    const frustum = cameraFrustum();
    // Half-width at z=0 (distance 5) is 5*tan(30deg) ≈ 2.887.
    expect(frustum.intersectsSphere(3.4, 0, 0, 1)).toBe(true);
    expect(frustum.intersectsSphere(5, 0, 0, 1)).toBe(false);
  });

  it('keeps boxes touching the volume and invalid boxes, rejecting boxes beyond a plane', () => {
    const frustum = cameraFrustum();
    // Half-width over z -0.1..0.1 is at most about 2.944; boxes span x 2.5 or 3 to 10.
    expect(frustum.intersectsBox(2.5, -1, -0.1, 10, 1, 0.1)).toBe(true);
    expect(frustum.intersectsBox(3, -1, -0.1, 10, 1, 0.1)).toBe(false);
    expect(frustum.intersectsBox(-1, 50, -1, 1, 60, 1)).toBe(false);
    expect(frustum.intersectsBox(-1, -1, 10, 1, 1, 20)).toBe(false);
    expect(frustum.intersectsBox(-1e3, -1e3, -1e3, 1e3, 1e3, 1e3)).toBe(true);
    expect(frustum.intersectsBox(NaN, 50, -1, 1, 60, 1)).toBe(true);
    expect(frustum.intersectsBox(-1, 50, -1, 1, Infinity, 1)).toBe(true);
  });

  it('supports orthographic projections', () => {
    const camera = new OrthographicCamera();
    const frustum = new Frustum().setFromMatrix(camera.updateMatrix(1));
    expect(
      frustum.intersectsSphere(camera.position.x, camera.position.y, 0, 0.1),
    ).toBe(true);
    expect(frustum.intersectsSphere(1e4, 0, 0, 1)).toBe(false);
  });
});

describe('Mesh culling', () => {
  function cube(position: [number, number, number], scale = 1): Mesh {
    return new Mesh({
      geometry: Geometry.cube(1),
      material: material(),
      position,
      scale: [scale, scale, scale],
    });
  }

  it('uses world position and scale', () => {
    const frustum = cameraFrustum();
    expect(cube([0, 0, 0]).isInFrustum(frustum)).toBe(true);
    expect(cube([50, 0, 0]).isInFrustum(frustum)).toBe(false);
    // A large scale brings a far-off object back into view.
    expect(cube([12, 0, 0], 40).isInFrustum(frustum)).toBe(true);
  });

  it('keeps its own bounds when overrides test another mesh mid-query', () => {
    const frustum = cameraFrustum();
    const visible = cube([0, 0, 0]);
    class ProbingCullable extends Mesh {
      protected override get cullable(): boolean {
        return visible.isInFrustum(frustum);
      }
    }
    class ProbingBounds extends Mesh {
      override getWorldBoundingSphere(out: BoundingSphere3D): BoundingSphere3D {
        super.getWorldBoundingSphere(out);
        visible.isInFrustum(frustum);
        return out;
      }
    }
    for (const Probing of [ProbingCullable, ProbingBounds]) {
      const far = new Probing({
        geometry: Geometry.cube(1),
        material: material(),
        position: [50, 0, 0],
      });
      expect(far.isInFrustum(frustum)).toBe(false);
    }
  });

  it('honors the opt-out and culls an offscreen instance aggregate', () => {
    const frustum = cameraFrustum();
    const far = cube([50, 0, 0]);
    far.frustumCulled = false;
    expect(far.isInFrustum(frustum)).toBe(true);
    const instanced = new InstancedMesh({
      geometry: Geometry.cube(1),
      material: material(),
      count: 1,
      position: [50, 0, 0],
    });
    expect(instanced.isInFrustum(frustum)).toBe(false);
  });

  it('refreshes bounds after vertices change', () => {
    const geometry = Geometry.cube(1);
    const before = geometry.boundingSphere.radius;
    for (let i = 0; i < geometry.vertices.length; i += 8)
      geometry.vertices[i] *= 100;
    expect(geometry.boundingSphere.radius).toBe(before); // cached until notified
    geometry.markUpdated();
    expect(geometry.boundingSphere.radius).toBeGreaterThan(before * 10);
  });
});
