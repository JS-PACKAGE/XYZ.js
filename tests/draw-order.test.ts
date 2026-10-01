import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { DrawSorter } from '../packages/core/src/draw-order.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { Vector3 } from '../packages/math/src/index.js';

const texture = new Texture({
  width: 1,
  height: 1,
  close() {},
} as unknown as ImageBitmap);

function mesh(
  z: number,
  options: {
    opacity?: number;
    transparent?: boolean;
    alphaMode?: 'OPAQUE' | 'BLEND' | 'MASK';
  } = {},
): Mesh {
  return new Mesh({
    geometry: Geometry.cube(1),
    material:
      options.alphaMode !== undefined
        ? new PBRMaterial({ texture, ...options })
        : new TextureMaterial({ texture, ...options }),
    position: [0, 0, z],
  });
}

const camera = new Vector3(0, 0, 10);

describe('DrawSorter', () => {
  it('draws opaque meshes first in insertion order, then blended far to near', () => {
    const opaqueNear = mesh(8);
    const glassFar = mesh(-20, { opacity: 0.5 });
    const opaqueFar = mesh(-30);
    const glassNear = mesh(5, { opacity: 0.5 });
    const pbrGlassMid = mesh(-5, { alphaMode: 'BLEND' });
    const pbrSolid = mesh(0, { alphaMode: 'OPAQUE' });
    const draws = [
      opaqueNear,
      glassNear,
      glassFar,
      opaqueFar,
      pbrGlassMid,
      pbrSolid,
    ];
    new DrawSorter().sort(draws, camera);
    expect(draws).toEqual([
      opaqueNear,
      opaqueFar,
      pbrSolid,
      glassFar,
      pbrGlassMid,
      glassNear,
    ]);
  });

  it('keeps insertion order for equal distances and leaves all-opaque lists alone', () => {
    const a = mesh(0, { opacity: 0.5 });
    const b = mesh(0, { opacity: 0.5 });
    const list = [a, b];
    const sorter = new DrawSorter();
    sorter.sort(list, camera);
    expect(list).toEqual([a, b]);
    const opaque = [mesh(3), mesh(-3)];
    const copy = [...opaque];
    sorter.sort(opaque, camera);
    expect(opaque).toEqual(copy);
  });

  it('is reusable across frames and does not retain meshes', () => {
    const sorter = new DrawSorter();
    const far = mesh(-10, { opacity: 0.4 });
    const near = mesh(4, { opacity: 0.4 });
    for (let frame = 0; frame < 3; frame++) {
      const draws = [near, far];
      sorter.sort(draws, camera);
      expect(draws).toEqual([far, near]);
    }
    sorter.sort([], camera);
  });

  it('measures from the bounding-sphere center, not the mesh origin', () => {
    // Geometry offset far from its origin: the origin is nearer than the visible center.
    const offset = new Geometry({
      positions: [-1, -1, -40, 1, -1, -40, 0, 1, -40],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0.5, 1],
      indices: [0, 1, 2],
    });
    const distant = new Mesh({
      geometry: offset,
      material: new TextureMaterial({ texture, opacity: 0.5 }),
    });
    const middle = mesh(-10, { opacity: 0.5 });
    const draws = [middle, distant];
    new DrawSorter().sort(draws, camera);
    expect(draws).toEqual([distant, middle]);
  });
});

describe('transparent pass classification', () => {
  it('sorts alpha textures after opaque and masked materials regardless of their opacity factor', () => {
    const image = mesh(-10, { transparent: true });
    const solid = mesh(0, { alphaMode: 'OPAQUE', opacity: 0.2 });
    const cutout = mesh(1, { alphaMode: 'MASK', opacity: 0.2 });
    const glass = mesh(-20, { alphaMode: 'BLEND' });
    const draws = [image, solid, glass, cutout];
    new DrawSorter().sort(draws, camera);
    expect(draws).toEqual([solid, cutout, glass, image]);
  });
});
