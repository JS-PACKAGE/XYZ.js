import fixture from './fixtures/gltf-uv-eight.gltf?raw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetError } from '../packages/assets/src/index.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import {
  PBRMaterial,
  type MaterialTextureSlot,
} from '../packages/core/src/pbr-material.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';

interface FixtureDocument {
  meshes: { primitives: { attributes: Record<string, number> }[] }[];
  materials: {
    normalTexture: {
      extensions: { KHR_texture_transform: { texCoord: number } };
    };
  }[];
  accessors: { count: number; normalized?: boolean }[];
}
afterEach(() => vi.unstubAllGlobals());
function images() {
  vi.stubGlobal(
    'ImageData',
    class {
      constructor(
        readonly data: Uint8ClampedArray,
        readonly width: number,
        readonly height: number,
      ) {}
    },
  );
  const close = vi.fn();
  const decode = vi.fn(async () => ({ width: 2, height: 2, close }));
  vi.stubGlobal('createImageBitmap', decode);
  return { close, decode };
}
async function load(text = fixture) {
  const asset = await new GLTFLoader().parse(text);
  const mesh = [...[...asset.scene.children][0].children][0] as SkinnedMesh;
  return { asset, mesh, material: mesh.material as PBRMaterial };
}
function coordinate(
  mesh: SkinnedMesh,
  slot: MaterialTextureSlot,
  vertex: number,
): number[] {
  const material = mesh.material as PBRMaterial;
  const coordinates = material.textureCoordinates[slot]!;
  const u =
    coordinates.texCoord === 1
      ? mesh.renderGeometry.uvs1![vertex * 2]
      : mesh.renderGeometry.vertices[vertex * 8 + 6];
  const v =
    coordinates.texCoord === 1
      ? mesh.renderGeometry.uvs1![vertex * 2 + 1]
      : mesh.renderGeometry.vertices[vertex * 8 + 7];
  const [a, b, c, d, tx, ty] = coordinates.transform;
  return [a * u + c * v + tx, b * u + d * v + ty];
}

describe('glTF multiple map coordinates and eight influences', () => {
  it('uses independent base, normal and metal-rough coordinates including transform UV overrides', async () => {
    images();
    const { asset, mesh } = await load();
    try {
      expect(coordinate(mesh, 'texture', 0)).toEqual([0.25, 1]);
      expect(coordinate(mesh, 'metallicRoughness', 0)).toEqual([1, 0.75]);
      const normal = coordinate(mesh, 'normal', 0);
      expect(normal[0]).toBeCloseTo(0.75 * (Math.cos(0.5) - Math.sin(0.5)));
      expect(normal[1]).toBeCloseTo(0.75 * (Math.sin(0.5) + Math.cos(0.5)));
      mesh.updateSkin();
      expect(coordinate(mesh, 'normal', 0)).toEqual(normal);
    } finally {
      asset.dispose();
    }
  });

  it('normalizes all eight influences together and encloses motion from the eighth joint', async () => {
    images();
    const { asset, mesh } = await load();
    try {
      mesh.updateSkin();
      const shift = (0.04 * 168) / 36;
      for (let vertex = 0; vertex < 4; vertex++) {
        const offset = vertex * 8;
        expect(mesh.geometry.vertices[offset]).toBeCloseTo(
          mesh.renderGeometry.vertices[offset] + shift,
          6,
        );
        expect(mesh.geometry.vertices[offset + 3]).toBeCloseTo(0);
        expect(mesh.geometry.vertices[offset + 5]).toBeCloseTo(1);
      }
      mesh.joints[7].position.x += 9;
      mesh.updateSkin();
      const sphere = mesh.boundingSphere;
      for (let vertex = 0; vertex < 4; vertex++) {
        const offset = vertex * 8;
        expect(mesh.geometry.vertices[offset]).toBeCloseTo(
          mesh.renderGeometry.vertices[offset] + shift + 2,
          6,
        );
        expect(
          Math.hypot(
            mesh.geometry.vertices[offset] - sphere.x,
            mesh.geometry.vertices[offset + 1] - sphere.y,
            mesh.geometry.vertices[offset + 2] - sphere.z,
          ),
        ).toBeLessThanOrEqual(sphere.radius);
      }
    } finally {
      asset.dispose();
    }
  });

  it.each([
    [
      'missing UV1',
      (document: FixtureDocument) => {
        delete document.meshes[0].primitives[0].attributes.TEXCOORD_1;
      },
    ],
    [
      'invalid UV set',
      (document: FixtureDocument) => {
        document.materials[0].normalTexture.extensions.KHR_texture_transform.texCoord = 2;
      },
    ],
    [
      'unpaired second influence set',
      (document: FixtureDocument) => {
        delete document.meshes[0].primitives[0].attributes.WEIGHTS_1;
      },
    ],
    [
      'third influence set',
      (document: FixtureDocument) => {
        document.meshes[0].primitives[0].attributes.JOINTS_2 = 4;
      },
    ],
    [
      'invalid joint accessor',
      (document: FixtureDocument) => {
        document.accessors[6].normalized = true;
      },
    ],
    [
      'mismatched weights',
      (document: FixtureDocument) => {
        document.accessors[7].count = 3;
      },
    ],
  ])(
    'rejects %s as an asset error and releases decoded images',
    async (_, change) => {
      const { close, decode } = images(),
        document: FixtureDocument = JSON.parse(fixture);
      change(document);
      await expect(load(JSON.stringify(document))).rejects.toBeInstanceOf(
        AssetError,
      );
      expect(close).toHaveBeenCalledTimes(decode.mock.calls.length);
    },
  );
});
