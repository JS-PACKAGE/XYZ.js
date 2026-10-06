import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from './fixtures/gltf-uv-eight.gltf?raw';
import { Texture } from '../packages/assets/src/index.js';
import {
  AnimationClip,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { exportGLB, exportGLTF } from '../packages/core/src/gltf-exporter.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { gltfVariants } from '../packages/core/src/gltf-variants.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { MorphTargets, MorphWeights } from '../packages/core/src/morph.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import {
  opticalMaterialMaps,
  materialTextureCoordinates,
} from '../packages/core/src/optical-material-maps.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import { SkinnedMesh } from '../packages/core/src/skinned-mesh.js';

const pixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const external = { textures: 'external' as const, textureURI: () => pixel };
afterEach(() => vi.unstubAllGlobals());
function images(): Texture {
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
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 1, height: 1, close() {} })),
  );
  return new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);
}
function meshes(root: Object3D): Mesh[] {
  const result: Mesh[] = [];
  if (root instanceof Mesh) result.push(root);
  for (const child of root.children) result.push(...meshes(child));
  return result;
}
function triangle() {
  return new Geometry({
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 1, 0, 0, 1],
    uvs1: [1, 1, 0, 1, 1, 0],
    colors: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    indices: [0, 1, 2],
    tangentConvention: 'gltf',
  });
}

describe('glTF exporter', () => {
  it('round-trips optical maps with independent samplers, transforms and nm bounds', async () => {
    const texture = images();
    const material = new PBRMaterial({
      texture,
      finish: { anisotropy: 0.7, anisotropyRotation: 0.25, iridescence: 0.8 },
      opticalMaps: {
        anisotropyTexture: texture,
        anisotropySampler: {
          magFilter: 'nearest',
          addressModeU: 'mirror-repeat',
        },
        iridescenceTexture: texture,
        iridescenceSampler: {
          minFilter: 'nearest',
          addressModeV: 'clamp-to-edge',
        },
        iridescenceThicknessTexture: texture,
        iridescenceThicknessSampler: { addressModeU: 'clamp-to-edge' },
        iridescenceThicknessMinimum: 75,
        iridescenceThicknessMaximum: 925,
      },
      textureCoordinates: {
        anisotropy: {
          texCoord: 1,
          offset: [0.2, 0.3],
          rotation: 0.4,
          scale: [2, 3],
        },
        iridescence: { offset: [0.7, 0.8], scale: [0.5, 0.6] },
        iridescenceThickness: { texCoord: 1, rotation: -0.3 },
      },
    });
    const mesh = new Mesh({ geometry: triangle(), material });
    const asset = await new GLTFLoader().parse(await exportGLB(mesh, external));
    try {
      const restored = meshes(asset.scene)[0].material as PBRMaterial;
      const maps = opticalMaterialMaps(restored);
      expect(maps.iridescenceThicknessMinimum).toBe(75);
      expect(maps.iridescenceThicknessMaximum).toBe(925);
      for (const slot of [
        'anisotropy',
        'iridescence',
        'iridescenceThickness',
      ] as const) {
        expect(maps[`${slot}Texture`]).toBeDefined();
        expect(maps[`${slot}Sampler`]).toMatchObject(
          opticalMaterialMaps(material)[`${slot}Sampler`]!,
        );
        expect(materialTextureCoordinates(restored)[slot]?.texCoord).toBe(
          materialTextureCoordinates(material)[slot]?.texCoord,
        );
        materialTextureCoordinates(restored)[slot]?.transform.forEach(
          (value, index) => {
            expect(value).toBeCloseTo(
              materialTextureCoordinates(material)[slot]!.transform[index],
            );
          },
        );
      }
      const again = await exportGLTF(
        new Mesh({ geometry: triangle(), material: restored }),
        external,
      );
      const extensions = again.json.materials[0].extensions as Record<
        string,
        Record<string, unknown>
      >;
      expect(extensions.KHR_materials_iridescence).toMatchObject({
        iridescenceThicknessMinimum: 75,
        iridescenceThicknessMaximum: 925,
      });
    } finally {
      asset.dispose();
    }
  });

  it('writes aligned bounded accessors, geometry streams and hierarchical TRS without mutation', async () => {
    const texture = images(),
      root = new Group();
    root.position.set(2, 3, 4);
    const mesh = new Mesh({
      geometry: triangle(),
      material: new TextureMaterial({ texture }),
      scale: [2, 1, 1],
    });
    root.add(mesh);
    const result = await exportGLTF(root, external);
    expect(result.json.nodes[0].children).toEqual([1]);
    expect(result.json.nodes[0].translation).toEqual([2, 3, 4]);
    expect(result.json.buffers[0].uri).toBe('scene.bin');
    for (const view of result.json.bufferViews) {
      expect((view.byteOffset as number) % 4).toBe(0);
      expect(
        (view.byteOffset as number) + (view.byteLength as number),
      ).toBeLessThanOrEqual(result.buffers[0].byteLength);
    }
    const asset = await new GLTFLoader().parse(await exportGLB(root, external));
    try {
      const restored = meshes(asset.scene)[0];
      expect(Array.from(restored.geometry.vertices)).toEqual(
        Array.from(mesh.geometry.vertices),
      );
      expect(restored.geometry.uvs1).toEqual(mesh.geometry.uvs1);
      expect(restored.geometry.colors).toEqual(mesh.geometry.colors);
      expect(restored.geometry.tangents).toEqual(mesh.geometry.tangents);
      expect(restored.geometry.indices).toEqual(mesh.geometry.indices);
      expect(mesh.position.x).toBe(0);
    } finally {
      asset.dispose();
    }
  });

  it('round-trips all eight skin influences and independent map transforms from loader output', async () => {
    images();
    const original = await new GLTFLoader().parse(fixture);
    const restored = await new GLTFLoader().parse(
      await exportGLB(original.scene, external),
    );
    try {
      const a = meshes(original.scene)[0] as SkinnedMesh,
        b = meshes(restored.scene)[0] as SkinnedMesh;
      expect(b.influencesPerVertex).toBe(8);
      expect(b.jointIndices).toEqual(a.jointIndices);
      for (let i = 0; i < a.weights.length; i++)
        expect(b.weights[i]).toBeCloseTo(a.weights[i], 6);
      for (const slot of ['texture', 'normal', 'metallicRoughness'] as const) {
        const before = (a.material as PBRMaterial).textureCoordinates[slot]!;
        const after = (b.material as PBRMaterial).textureCoordinates[slot]!;
        expect(after.texCoord).toBe(before.texCoord);
        after.transform.forEach((value, index) =>
          expect(value).toBeCloseTo(before.transform[index], 6),
        );
      }
    } finally {
      original.dispose();
      restored.dispose();
    }
  });

  it('exports captured morph bases after deformation and STEP/LINEAR/CUBICSPLINE clips', async () => {
    const texture = images(),
      weights = new MorphWeights([0.5]);
    const mesh = new Mesh({
      geometry: triangle(),
      material: new PBRMaterial({ texture }),
      morph: new MorphTargets({
        weights,
        positions: [[0, 0, 1, 0, 0, 1, 0, 0, 1]],
      }),
    });
    mesh.updateDeformation();
    const clips = [
      new AnimationClip('move', [
        new KeyframeTrack(
          mesh,
          'translation',
          [0, 1],
          [0, 0, 0, 1, 2, 3],
          'STEP',
        ),
      ]),
      new AnimationClip('morph', [
        new KeyframeTrack(weights, 'weights', [0, 1], [0, 1]),
      ]),
      new AnimationClip('cubic', [
        new KeyframeTrack(
          mesh,
          'scale',
          [0, 1],
          [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0],
          'CUBICSPLINE',
        ),
      ]),
    ];
    const asset = await new GLTFLoader().parse(
      await exportGLB(mesh, { ...external, animations: clips }),
    );
    try {
      const restored = meshes(asset.scene)[0];
      expect(restored.morph?.weights.get(0)).toBe(0.5);
      expect(
        (restored.morph as unknown as { base: Float32Array }).base[2],
      ).toBe(0);
      restored.updateDeformation();
      expect(restored.geometry.vertices[2]).toBe(0.5);
      expect(
        asset.animations.map((clip) => clip.tracks[0].interpolation),
      ).toEqual(['STEP', 'LINEAR', 'CUBICSPLINE']);
      expect(mesh.geometry.vertices[2]).toBe(0.5);
    } finally {
      asset.dispose();
    }
  });

  it('round-trips PBR extensions, map slots and explicit variants', async () => {
    const texture = images();
    const material = new PBRMaterial({
      texture,
      emissive: [3, 2, 1],
      metallic: 0.7,
      roughness: 0.2,
      ior: 1.7,
      specular: 0.8,
      specularColor: [0.6, 0.7, 0.8],
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
      sheenColor: [0.1, 0.2, 0.3],
      sheenRoughness: 0.4,
      transmission: 0.5,
      thickness: 0.3,
      attenuationDistance: 2,
      finish: {
        anisotropy: 0.4,
        anisotropyRotation: 0.6,
        iridescence: 0.7,
        iridescenceThickness: 0.8,
        dispersion: 0.2,
      },
      specularTexture: texture,
      specularColorTexture: texture,
      clearcoatTexture: texture,
      clearcoatRoughnessTexture: texture,
      clearcoatNormalTexture: texture,
      sheenColorTexture: texture,
      sheenRoughnessTexture: texture,
      transmissionTexture: texture,
      thicknessTexture: texture,
      normalTexture: texture,
      occlusionTexture: texture,
      emissiveTexture: texture,
      metallicRoughnessTexture: texture,
    });
    const mesh = new Mesh({ geometry: triangle(), material });
    const variant = new PBRMaterial({ texture, metallic: 0.1 });
    const asset = await new GLTFLoader().parse(
      await exportGLB(mesh, {
        ...external,
        variants: [
          { name: 'alternate', mappings: [{ mesh, material: variant }] },
        ],
      }),
    );
    try {
      const restored = meshes(asset.scene)[0],
        pbr = restored.material as PBRMaterial;
      expect(pbr.emissive).toEqual(material.emissive);
      for (const key of [
        'ior',
        'specular',
        'clearcoat',
        'sheenRoughness',
        'transmission',
        'thickness',
      ] as const)
        expect(pbr[key]).toBeCloseTo(material[key]);
      expect(pbr.finish.iridescenceThickness).toBeCloseTo(0.8);
      expect(pbr.finish.dispersion).toBeCloseTo(0.2);
      expect(pbr.thicknessTexture).toBeDefined();
      expect(pbr.clearcoatNormalTexture).toBeDefined();
      gltfVariants(asset).selectVariant('alternate');
      expect((restored.material as PBRMaterial).metallic).toBeCloseTo(0.1);
    } finally {
      asset.dispose();
    }
  });

  it('exports perspective and orthographic camera definitions and valid GLB framing', async () => {
    const camera = new OrthographicCamera();
    camera.height = 8;
    camera.zoom = 2;
    const result = await exportGLTF([], { camera, cameraAspect: 2 });
    expect(result.json.cameras[0]).toEqual({
      type: 'orthographic',
      orthographic: { xmag: 4, ymag: 2, znear: 0.1, zfar: 100 },
    });
    const binary = await exportGLB([], { camera: new PerspectiveCamera() });
    const header = new DataView(binary);
    expect(header.getUint32(0, true)).toBe(0x46546c67);
    expect(header.getUint32(8, true)).toBe(binary.byteLength);
    expect(header.getUint32(16, true)).toBe(0x4e4f534a);
    expect(header.getUint32(12, true) % 4).toBe(0);
  });

  it('rejects unsupported or unrepresentable data instead of dropping it', async () => {
    const texture = images(),
      mesh = new Mesh({
        geometry: triangle(),
        material: new PBRMaterial({ texture, finish: { wetness: 0.5 } }),
      });
    await expect(exportGLTF(mesh, external)).rejects.toThrow('wetness');
    const plain = new Mesh({
      geometry: triangle(),
      material: new TextureMaterial({ texture }),
    });
    await expect(exportGLTF(plain, { textures: 'external' })).rejects.toThrow(
      'textureURI',
    );
    plain.visible = false;
    await expect(exportGLTF(plain, external)).rejects.toThrow('hidden');
    plain.visible = true;
    const target = new Object3D();
    await expect(
      exportGLTF(plain, {
        ...external,
        animations: [
          new AnimationClip('outside', [
            new KeyframeTrack(target, 'translation', [0], [0, 0, 0]),
          ]),
        ],
      }),
    ).rejects.toThrow('outside');
    const track = new KeyframeTrack(plain, 'translation', [0], [0, 0, 0]);
    await expect(
      exportGLTF(plain, {
        ...external,
        animations: [new AnimationClip('duplicates', [track, track])],
      }),
    ).rejects.toThrow('duplicate animation');
    await expect(exportGLTF([plain, plain], external)).rejects.toThrow(
      'duplicate nodes',
    );
    await expect(exportGLTF(plain)).rejects.toThrow('browser canvas');
    texture.destroy();
    await expect(exportGLTF(plain, external)).rejects.toThrow(
      'destroyed texture',
    );
  });
});
