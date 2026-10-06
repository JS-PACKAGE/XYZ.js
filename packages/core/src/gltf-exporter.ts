import { AssetError, Texture } from '../../assets/src/index.js';
import { AnimationClip } from './animation.js';
import type { GLTFMaterialVariant } from './gltf-variants.js';
import { Group } from './group.js';
import { Mesh, TextureMaterial } from './mesh.js';
import { MorphWeights, type MorphTargets } from './morph.js';

/** Private bind data of MorphTargets; the published class declaration must stay unchanged (1.x API gate). */
interface MorphBindData {
  readonly base?: Float32Array;
  readonly baseTangents?: Float32Array;
  readonly positions: readonly (Float32Array | undefined)[];
  readonly normals: readonly (Float32Array | undefined)[];
  readonly tangents: readonly (Float32Array | undefined)[];
}
function morphExportSnapshot(targets: MorphTargets) {
  const data = targets as unknown as MorphBindData;
  if (!data.base || !data.baseTangents)
    throw new Error('Cannot export unbound MorphTargets.');
  return {
    vertices: data.base,
    tangents: data.baseTangents,
    targets: data.positions.map((positions, index) => ({
      positions,
      normals: data.normals[index],
      tangents: data.tangents[index],
    })),
  };
}
import { Object3D } from './object3d.js';
import { OrthographicCamera, type Camera3D } from './orthographic-camera.js';
import { PerspectiveCamera } from './perspective-camera.js';
import {
  PBRMaterial,
  pbrTextureSources,
  type MaterialTextureSlot,
  type PBRTextureKey,
} from './pbr-material.js';
import { Scene } from './scene.js';
import { SkinnedMesh } from './skinned-mesh.js';
import type { TextureSamplerOptions } from './texture-sampler.js';

type Entry = Record<string, unknown>;
export interface GLTFExportJSON {
  asset: { version: '2.0'; generator: string };
  scene: number;
  scenes: { nodes: number[] }[];
  nodes: Entry[];
  meshes: Entry[];
  materials: Entry[];
  textures: Entry[];
  images: Entry[];
  samplers: Entry[];
  skins: Entry[];
  cameras: Entry[];
  animations: Entry[];
  accessors: Entry[];
  bufferViews: Entry[];
  buffers: { byteLength: number; uri?: string }[];
  extensionsUsed?: string[];
  extensionsRequired?: string[];
  extensions?: Entry;
}
export interface GLTFExportOptions {
  /** External binary filename in the JSON result. Default scene.bin. */
  bufferURI?: string;
  /** Embedded PNG is the default. URL mode requires textureURI for every image. */
  textures?: 'embedded' | 'external';
  textureURI?: (texture: Texture) => string;
  animations?: readonly AnimationClip[];
  variants?: readonly GLTFMaterialVariant[];
  /** Scene exports its camera by default; mesh-array exports require an explicit camera. */
  camera?: Camera3D;
  cameraAspect?: number;
}
export interface GLTFExportResult {
  json: GLTFExportJSON;
  /** One aligned binary buffer, including embedded PNG images. */
  buffers: ArrayBuffer[];
}
export type GLTFExportInput = Scene | Object3D | readonly Object3D[];

function reject(message: string): never {
  throw new AssetError(`glTF export: ${message}`);
}
function finite(values: ArrayLike<number>, label: string): void {
  for (let i = 0; i < values.length; i++)
    if (!Number.isFinite(values[i]) || !Number.isFinite(Math.fround(values[i])))
      reject(`${label} contains a non-finite Float32 value.`);
}
function pose(
  value: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
  },
  scale = [1, 1, 1],
): Entry {
  const translation = [value.position.x, value.position.y, value.position.z];
  const rotation = [
    value.rotation.x,
    value.rotation.y,
    value.rotation.z,
    value.rotation.w,
  ];
  finite(translation, 'translation');
  finite(rotation, 'rotation');
  finite(scale, 'scale');
  if (Math.abs(Math.hypot(...rotation) - 1) > 1e-5)
    reject('rotation must be a unit quaternion.');
  return { translation, rotation, scale };
}
async function png(texture: Texture): Promise<ArrayBuffer> {
  if (texture.kind !== 'image')
    reject('native/compressed textures require an external image URL.');
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(texture.width, texture.height);
    const context = canvas.getContext('2d');
    if (!context) reject('PNG encoding requires a 2D canvas context.');
    context.drawImage(texture.image, 0, 0);
    return (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer();
  }
  if (typeof document === 'undefined')
    reject('embedded PNG encoding requires a browser canvas.');
  const canvas = document.createElement('canvas');
  canvas.width = texture.width;
  canvas.height = texture.height;
  const context = canvas.getContext('2d');
  if (!context) reject('PNG encoding requires a 2D canvas context.');
  context.drawImage(texture.image, 0, 0);
  const blob = await new Promise<Blob>((resolve, fail) =>
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : fail(new AssetError('PNG encoding failed.')),
      'image/png',
    ),
  );
  return blob.arrayBuffer();
}

/** Export a snapshot, without deforming geometry or changing animation/variant state. */
export async function exportGLTF(
  input: GLTFExportInput,
  options: GLTFExportOptions = {},
): Promise<GLTFExportResult> {
  if (
    options.textures !== undefined &&
    options.textures !== 'embedded' &&
    options.textures !== 'external'
  )
    reject('unknown texture mode.');
  const uri = options.bufferURI ?? 'scene.bin';
  if (typeof uri !== 'string' || !uri.length)
    reject('bufferURI must be nonempty.');
  const json: GLTFExportJSON = {
    asset: { version: '2.0', generator: 'XYZ.js' },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    materials: [],
    textures: [],
    images: [],
    samplers: [],
    skins: [],
    cameras: [],
    animations: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
  };
  const chunks: { offset: number; bytes: Uint8Array }[] = [];
  let byteLength = 0;
  const extensions = new Set<string>();
  function extension(name: string): void {
    extensions.add(name);
  }
  function view(bytes: Uint8Array): number {
    byteLength = Math.ceil(byteLength / 4) * 4;
    const index = json.bufferViews.length;
    json.bufferViews.push({
      buffer: 0,
      byteOffset: byteLength,
      byteLength: bytes.byteLength,
    });
    chunks.push({ offset: byteLength, bytes });
    byteLength += bytes.byteLength;
    return index;
  }
  function accessor(
    values: ArrayLike<number>,
    size: number,
    type: string,
    componentType = 5126,
    bounds = false,
  ): number {
    finite(values, 'accessor');
    if (!values.length || values.length % size)
      reject('invalid accessor length.');
    let data: Float32Array | Uint32Array | Uint16Array;
    if (componentType === 5125 || componentType === 5123) {
      const maximum = componentType === 5123 ? 65535 : 4294967295;
      for (let i = 0; i < values.length; i++)
        if (
          !Number.isInteger(values[i]) ||
          values[i] < 0 ||
          values[i] > maximum
        )
          reject('integer accessor outside its range.');
      data =
        componentType === 5123
          ? Uint16Array.from(values)
          : Uint32Array.from(values);
    } else data = Float32Array.from(values);
    const entry: Entry = {
      bufferView: view(new Uint8Array(data.buffer)),
      componentType,
      count: values.length / size,
      type,
    };
    if (bounds) {
      const min = Array<number>(size).fill(Infinity),
        max = Array<number>(size).fill(-Infinity);
      for (let i = 0; i < data.length; i++) {
        const c = i % size;
        min[c] = Math.min(min[c], data[i]);
        max[c] = Math.max(max[c], data[i]);
      }
      entry.min = min;
      entry.max = max;
    }
    json.accessors.push(entry);
    return json.accessors.length - 1;
  }
  const imageIndices = new Map<Texture, number>();
  async function textureInfo(
    texture: Texture,
    sampler: Readonly<TextureSamplerOptions> | undefined,
    material: PBRMaterial | undefined,
    slot: MaterialTextureSlot,
    hasUV1: boolean,
  ): Promise<Entry> {
    if (texture.destroyed) reject('destroyed texture.');
    let source = imageIndices.get(texture);
    if (source === undefined) {
      source = json.images.length;
      if (options.textures === 'external') {
        const imageURI = options.textureURI?.(texture);
        if (typeof imageURI !== 'string' || !imageURI.length)
          reject('external textures require a nonempty textureURI.');
        json.images.push({ uri: imageURI });
      } else
        json.images.push({
          bufferView: view(new Uint8Array(await png(texture))),
          mimeType: 'image/png',
        });
      imageIndices.set(texture, source);
    }
    if (
      (sampler?.maxAnisotropy ?? 1) !== 1 ||
      (sampler?.lodMinClamp ?? 0) !== 0 ||
      ![0, 32].includes(sampler?.lodMaxClamp ?? 32)
    )
      reject(
        'anisotropy or custom LOD clamps have no glTF sampler representation.',
      );
    const wrap = (mode: TextureSamplerOptions['addressModeU']) =>
      mode === 'repeat' ? 10497 : mode === 'mirror-repeat' ? 33648 : 33071;
    const nearest = sampler?.minFilter === 'nearest';
    const minFilter =
      sampler?.lodMaxClamp === 0
        ? nearest
          ? 9728
          : 9729
        : sampler?.mipmapFilter === 'nearest'
          ? nearest
            ? 9984
            : 9985
          : nearest
            ? 9986
            : 9987;
    const samplerIndex = json.samplers.length;
    json.samplers.push({
      minFilter,
      magFilter: sampler?.magFilter === 'nearest' ? 9728 : 9729,
      wrapS: wrap(sampler?.addressModeU),
      wrapT: wrap(sampler?.addressModeV),
    });
    const index = json.textures.length;
    json.textures.push({ source, sampler: samplerIndex });
    const coordinates = material?.textureCoordinates[slot];
    const info: Entry = { index, texCoord: coordinates?.texCoord ?? 0 };
    if (coordinates?.texCoord === 1 && !hasUV1)
      reject('material selects missing UV1.');
    if (coordinates) {
      const [a, b, c, d, tx, ty] = coordinates.transform;
      if (a !== 1 || b !== 0 || c !== 0 || d !== 1 || tx !== 0 || ty !== 0) {
        const sx = Math.hypot(a, b),
          rotation = sx ? Math.atan2(b, a) : Math.atan2(-c, d);
        const sy = -Math.sin(rotation) * c + Math.cos(rotation) * d;
        if (
          Math.abs(c + Math.sin(rotation) * sy) > 1e-5 ||
          Math.abs(d - Math.cos(rotation) * sy) > 1e-5
        )
          reject('texture transform contains shear.');
        extension('KHR_texture_transform');
        info.extensions = {
          KHR_texture_transform: {
            offset: [tx, ty],
            rotation,
            scale: [sx, sy],
          },
        };
      }
    }
    return info;
  }
  async function materialIndex(
    material: TextureMaterial,
    hasUV1: boolean,
  ): Promise<number> {
    if (
      material.constructor !== TextureMaterial &&
      material.constructor !== PBRMaterial
    )
      reject('native/custom materials are unsupported.');
    if (material.textureSource)
      reject('live texture overrides are unsupported.');
    const pbr = material instanceof PBRMaterial ? material : undefined;
    const base = await textureInfo(
      material.texture,
      material.textureSampler,
      pbr,
      'texture',
      hasUV1,
    );
    const physical: Entry = {
      baseColorFactor: [...material.color, material.opacity],
      baseColorTexture: base,
      metallicFactor: pbr?.metallic ?? 0,
      roughnessFactor: pbr?.roughness ?? 1,
    };
    const entry: Entry = {
      pbrMetallicRoughness: physical,
      alphaMode: pbr?.alphaMode ?? (material.transparent ? 'BLEND' : 'OPAQUE'),
      doubleSided: pbr?.doubleSided ?? true,
    };
    if (pbr) {
      if (
        pbr.lightmap ||
        pbr.specularAntiAliasing ||
        pbr.alphaToCoverage ||
        Object.values(pbrTextureSources(pbr)).some(
          (source) => !(source instanceof Texture),
        )
      )
        reject(
          'lightmaps, renderer coverage/filtering and live maps are unsupported.',
        );
      const f = pbr.finish;
      for (const key of [
        'subsurface',
        'heightScale',
        'wetness',
        'snow',
        'dirt',
        'damage',
        'detailStrength',
        'triplanar',
        'layerBlend',
        'lightmapStrength',
      ] as const)
        if (f[key] !== 0) reject(`finish ${key} is unsupported.`);
      if (f.dispersion && !pbr.transmission)
        reject('dispersion requires transmission.');
      entry.alphaCutoff = pbr.alphaCutoff;
      const strength = Math.max(1, ...pbr.emissive);
      entry.emissiveFactor = pbr.emissive.map((v) => v / strength);
      const ext: Entry = {};
      function add(name: string, value: Entry): Entry {
        extension(name);
        ext[name] = value;
        return value;
      }
      if (strength !== 1)
        add('KHR_materials_emissive_strength', { emissiveStrength: strength });
      add('KHR_materials_ior', { ior: pbr.ior });
      const specular = add('KHR_materials_specular', {
        specularFactor: pbr.specular,
        specularColorFactor: pbr.specularColor,
      });
      const clearcoat = add('KHR_materials_clearcoat', {
        clearcoatFactor: pbr.clearcoat,
        clearcoatRoughnessFactor: pbr.clearcoatRoughness,
      });
      const sheen = add('KHR_materials_sheen', {
        sheenColorFactor: pbr.sheenColor,
        sheenRoughnessFactor: pbr.sheenRoughness,
      });
      const transmission = add('KHR_materials_transmission', {
        transmissionFactor: pbr.transmission,
      });
      const volume = add('KHR_materials_volume', {
        thicknessFactor: pbr.thickness,
        attenuationColor: pbr.attenuationColor,
      });
      if (Number.isFinite(pbr.attenuationDistance))
        volume.attenuationDistance = pbr.attenuationDistance;
      if (f.anisotropy || f.anisotropyRotation)
        add('KHR_materials_anisotropy', {
          anisotropyStrength: f.anisotropy,
          anisotropyRotation: f.anisotropyRotation,
        });
      if (f.iridescence || f.iridescenceIor !== 1.3 || f.iridescenceThickness)
        add('KHR_materials_iridescence', {
          iridescenceFactor: f.iridescence,
          iridescenceIor: f.iridescenceIor,
          iridescenceThicknessMinimum: 100,
          iridescenceThicknessMaximum: 100 + 700 * f.iridescenceThickness,
        });
      if (f.dispersion)
        add('KHR_materials_dispersion', { dispersion: f.dispersion });
      const maps: [
        PBRTextureKey,
        MaterialTextureSlot,
        Entry,
        string,
        Readonly<TextureSamplerOptions> | undefined,
      ][] = [
        [
          'metallicRoughnessTexture',
          'metallicRoughness',
          physical,
          'metallicRoughnessTexture',
          pbr.metallicRoughnessSampler,
        ],
        ['normalTexture', 'normal', entry, 'normalTexture', pbr.normalSampler],
        [
          'occlusionTexture',
          'occlusion',
          entry,
          'occlusionTexture',
          pbr.occlusionSampler,
        ],
        [
          'emissiveTexture',
          'emissive',
          entry,
          'emissiveTexture',
          pbr.emissiveSampler,
        ],
        [
          'specularTexture',
          'specular',
          specular,
          'specularTexture',
          pbr.specularSampler,
        ],
        [
          'specularColorTexture',
          'specularColor',
          specular,
          'specularColorTexture',
          pbr.specularColorSampler,
        ],
        [
          'clearcoatTexture',
          'clearcoat',
          clearcoat,
          'clearcoatTexture',
          pbr.clearcoatSampler,
        ],
        [
          'clearcoatRoughnessTexture',
          'clearcoatRoughness',
          clearcoat,
          'clearcoatRoughnessTexture',
          pbr.clearcoatRoughnessSampler,
        ],
        [
          'clearcoatNormalTexture',
          'clearcoatNormal',
          clearcoat,
          'clearcoatNormalTexture',
          pbr.clearcoatNormalSampler,
        ],
        [
          'sheenColorTexture',
          'sheenColor',
          sheen,
          'sheenColorTexture',
          pbr.sheenColorSampler,
        ],
        [
          'sheenRoughnessTexture',
          'sheenRoughness',
          sheen,
          'sheenRoughnessTexture',
          pbr.sheenRoughnessSampler,
        ],
        [
          'transmissionTexture',
          'transmission',
          transmission,
          'transmissionTexture',
          pbr.transmissionSampler,
        ],
        [
          'thicknessTexture',
          'thickness',
          volume,
          'thicknessTexture',
          pbr.thicknessSampler,
        ],
      ];
      for (const [key, slot, target, name, sampler] of maps) {
        const texture = pbr[key];
        if (texture) {
          const info = await textureInfo(texture, sampler, pbr, slot, hasUV1);
          if (slot === 'normal') info.scale = pbr.normalScale;
          if (slot === 'clearcoatNormal') info.scale = pbr.clearcoatNormalScale;
          if (slot === 'occlusion') info.strength = pbr.occlusionStrength;
          target[name] = info;
        }
      }
      entry.extensions = ext;
    }
    json.materials.push(entry);
    return json.materials.length - 1;
  }
  let roots: readonly Object3D[];
  if (input instanceof Scene) {
    if (input.destroyed) reject('destroyed Scene.');
    const objects = [...input.objects];
    if (objects.some((object) => !(object instanceof Object3D)))
      reject('Scene contains non-3D objects.');
    roots = (objects as Object3D[]).filter((object) => !object.parent);
    if (
      input.pointLights.length ||
      input.spotLights.length ||
      input.environment
    )
      reject('scene lights/environment are unsupported.');
  } else roots = input instanceof Object3D ? [input] : input;
  if (!Array.isArray(roots))
    reject('input must be Scene, Object3D or an array.');
  const nodes = new Map<Object3D, number>();
  const ordered: Object3D[] = [];
  function visit(object: Object3D, depth: number): void {
    if (!(object instanceof Object3D) || object.destroyed)
      reject('invalid/destroyed node.');
    if (depth > 256 || nodes.has(object))
      reject(
        'duplicate nodes, overlapping roots or excessive hierarchy depth.',
      );
    if (
      object.constructor !== Object3D &&
      object.constructor !== Group &&
      object.constructor !== Mesh &&
      object.constructor !== SkinnedMesh
    )
      reject('custom/instanced/procedural node types are unsupported.');
    if (!object.visible || object.body || object.collider)
      reject('hidden nodes and physics attachments are unsupported.');
    nodes.set(object, ordered.length);
    ordered.push(object);
    json.nodes.push(
      pose(object, [object.scale.x, object.scale.y, object.scale.z]),
    );
    for (const child of object.children) visit(child, depth + 1);
  }
  for (const root of roots) {
    if (root.parent)
      reject(
        'export roots must be parentless; export their ancestor to preserve local transforms.',
      );
    visit(root, 0);
    json.scenes[0].nodes.push(nodes.get(root)!);
  }
  const primitives = new Map<Mesh, Entry>();
  const weightNodes = new Map<MorphWeights, number[]>();
  for (const object of ordered) {
    const node = json.nodes[nodes.get(object)!];
    if (object.children.size)
      node.children = [...object.children].map((child) => nodes.get(child)!);
    if (!(object instanceof Mesh)) continue;
    const geometry = object.renderGeometry;
    const snapshot = object.morph && morphExportSnapshot(object.morph);
    const vertices = snapshot?.vertices ?? geometry.vertices;
    const count = vertices.length / 8;
    const stream = (offset: number, size: number) => {
      const data = new Float32Array(count * size);
      for (let i = 0; i < count; i++)
        for (let j = 0; j < size; j++)
          data[i * size + j] = vertices[i * 8 + offset + j];
      return data;
    };
    const attributes: Record<string, number> = {
      POSITION: accessor(stream(0, 3), 3, 'VEC3', 5126, true),
      NORMAL: accessor(stream(3, 3), 3, 'VEC3'),
      TEXCOORD_0: accessor(stream(6, 2), 2, 'VEC2'),
      TANGENT: accessor(snapshot?.tangents ?? geometry.tangents, 4, 'VEC4'),
    };
    if (geometry.uvs1)
      attributes.TEXCOORD_1 = accessor(geometry.uvs1, 2, 'VEC2');
    if (geometry.colors)
      attributes.COLOR_0 = accessor(geometry.colors, 4, 'VEC4');
    for (const index of geometry.indices)
      if (index >= count) reject('geometry index exceeds vertex count.');
    const primitive: Entry = {
      attributes,
      indices: accessor(geometry.indices, 1, 'SCALAR', 5125),
      material: await materialIndex(object.material, !!geometry.uvs1),
      mode: 4,
    };
    primitives.set(object, primitive);
    if (object instanceof SkinnedMesh) {
      if (
        object.joints.length > 65536 ||
        object.joints.some((joint) => !nodes.has(joint))
      )
        reject(
          'skin joints must be included in the exported hierarchy and fit unsigned short.',
        );
      const influences = object.influencesPerVertex;
      for (let set = 0; set < influences / 4; set++) {
        const joints = new Uint16Array(count * 4),
          weights = new Float32Array(count * 4);
        for (let v = 0; v < count; v++)
          for (let c = 0; c < 4; c++) {
            const source = v * influences + set * 4 + c;
            if (object.jointIndices[source] >= object.joints.length)
              reject('skin joint index exceeds joint count.');
            joints[v * 4 + c] = object.jointIndices[source];
            weights[v * 4 + c] = object.weights[source];
          }
        attributes[`JOINTS_${set}`] = accessor(joints, 4, 'VEC4', 5123);
        attributes[`WEIGHTS_${set}`] = accessor(weights, 4, 'VEC4');
      }
      const matrices = new Float32Array(object.joints.length * 16);
      object.inverseBindMatrices.forEach((matrix, index) =>
        matrices.set(matrix.elements, index * 16),
      );
      node.skin = json.skins.length;
      json.skins.push({
        joints: object.joints.map((joint) => nodes.get(joint)!),
        inverseBindMatrices: accessor(matrices, 16, 'MAT4'),
      });
    }
    const mesh: Entry = { primitives: [primitive] };
    if (snapshot && object.morph) {
      primitive.targets = snapshot.targets.map((target) => {
        const result: Entry = {};
        if (target.positions)
          result.POSITION = accessor(target.positions, 3, 'VEC3', 5126, true);
        if (target.normals) result.NORMAL = accessor(target.normals, 3, 'VEC3');
        if (target.tangents)
          result.TANGENT = accessor(target.tangents, 3, 'VEC3');
        if (!Object.keys(result).length)
          result.POSITION = accessor(
            new Float32Array(count * 3),
            3,
            'VEC3',
            5126,
            true,
          );
        return result;
      });
      mesh.weights = Array.from(object.morph.weights.values);
      const targets = weightNodes.get(object.morph.weights) ?? [];
      targets.push(nodes.get(object)!);
      weightNodes.set(object.morph.weights, targets);
    }
    node.mesh = json.meshes.length;
    json.meshes.push(mesh);
  }
  const variants = options.variants ?? [];
  if (variants.length) {
    extension('KHR_materials_variants');
    const names = new Set<string>();
    json.extensions = {
      KHR_materials_variants: {
        variants: variants.map((variant) => {
          if (!variant.name || names.has(variant.name))
            reject('variant names must be unique and nonempty.');
          names.add(variant.name);
          return { name: variant.name };
        }),
      },
    };
    const mappings = new Map<Mesh, Entry[]>();
    for (let v = 0; v < variants.length; v++) {
      const mapped = new Set<Mesh>();
      for (const mapping of variants[v].mappings) {
        if (!primitives.has(mapping.mesh) || mapped.has(mapping.mesh))
          reject('variant mapping references a missing or duplicate mesh.');
        mapped.add(mapping.mesh);
        const entries = mappings.get(mapping.mesh) ?? [];
        entries.push({
          material: await materialIndex(
            mapping.material,
            !!mapping.mesh.renderGeometry.uvs1,
          ),
          variants: [v],
        });
        mappings.set(mapping.mesh, entries);
      }
    }
    for (const [mesh, mapping] of mappings)
      primitives.get(mesh)!.extensions = {
        KHR_materials_variants: { mappings: mapping },
      };
  }
  for (const clip of options.animations ?? []) {
    if (!(clip instanceof AnimationClip))
      reject('animations require AnimationClip.');
    const channels: Entry[] = [],
      samplers: Entry[] = [],
      seen = new Set<string>();
    for (const track of clip.tracks) {
      const targets =
        track.target instanceof MorphWeights
          ? weightNodes.get(track.target)
          : nodes.has(track.target)
            ? [nodes.get(track.target)!]
            : undefined;
      if (!targets?.length)
        reject('animation target is outside the exported hierarchy.');
      const inputAccessor = accessor(track.times, 1, 'SCALAR', 5126, true);
      const output = accessor(
        track.values,
        track.path === 'weights' ? 1 : track.size,
        track.path === 'rotation'
          ? 'VEC4'
          : track.path === 'weights'
            ? 'SCALAR'
            : 'VEC3',
      );
      for (const target of targets) {
        const key = `${target}:${track.path}`;
        if (seen.has(key))
          reject('duplicate animation channels cannot be represented cleanly.');
        seen.add(key);
        channels.push({
          sampler: samplers.length,
          target: { node: target, path: track.path },
        });
        samplers.push({
          input: inputAccessor,
          output,
          interpolation: track.interpolation,
        });
      }
    }
    if (!channels.length) reject('empty animation clips are unsupported.');
    json.animations.push({ name: clip.name, channels, samplers });
  }
  const camera =
    options.camera ?? (input instanceof Scene ? input.camera3D : undefined);
  if (camera) {
    const aspect = options.cameraAspect ?? 1;
    if (
      !Number.isFinite(aspect) ||
      aspect <= 0 ||
      !Number.isFinite(camera.near) ||
      !Number.isFinite(camera.far) ||
      camera.far <= camera.near
    )
      reject('invalid camera range/aspect.');
    let definition: Entry;
    if (camera instanceof PerspectiveCamera) {
      if (
        camera.near <= 0 ||
        !Number.isFinite(camera.fov) ||
        camera.fov <= 0 ||
        camera.fov >= Math.PI
      )
        reject('invalid perspective camera.');
      definition = {
        type: 'perspective',
        perspective: {
          yfov: camera.fov,
          aspectRatio: aspect,
          znear: camera.near,
          zfar: camera.far,
        },
      };
    } else if (camera instanceof OrthographicCamera) {
      if (
        camera.near < 0 ||
        !Number.isFinite(camera.height) ||
        camera.height <= 0 ||
        !Number.isFinite(camera.zoom) ||
        camera.zoom <= 0
      )
        reject('invalid orthographic camera.');
      definition = {
        type: 'orthographic',
        orthographic: {
          xmag: (camera.height * aspect) / (2 * camera.zoom),
          ymag: camera.height / (2 * camera.zoom),
          znear: camera.near,
          zfar: camera.far,
        },
      };
    } else reject('unsupported camera.');
    json.scenes[0].nodes.push(json.nodes.length);
    json.nodes.push({ ...pose(camera), camera: json.cameras.length });
    json.cameras.push(definition);
  }
  byteLength = Math.ceil(byteLength / 4) * 4;
  const buffer = new ArrayBuffer(byteLength),
    bytes = new Uint8Array(buffer);
  for (const chunk of chunks) bytes.set(chunk.bytes, chunk.offset);
  if (byteLength) json.buffers.push({ byteLength, uri });
  if (extensions.size) {
    json.extensionsUsed = [...extensions];
    json.extensionsRequired = [...extensions];
  }
  return { json, buffers: byteLength ? [buffer] : [] };
}

/** GLB 2.0 with padded JSON/BIN chunks. External image URLs remain external. */
export async function exportGLB(
  input: GLTFExportInput,
  options: GLTFExportOptions = {},
): Promise<ArrayBuffer> {
  const result = await exportGLTF(input, options);
  for (const buffer of result.json.buffers) delete buffer.uri;
  const text = new TextEncoder().encode(JSON.stringify(result.json));
  const jsonLength = Math.ceil(text.byteLength / 4) * 4;
  const binary = result.buffers[0];
  const length = 12 + 8 + jsonLength + (binary ? 8 + binary.byteLength : 0);
  if (length > 4294967295) reject('GLB exceeds its 32-bit length limit.');
  const buffer = new ArrayBuffer(length),
    bytes = new Uint8Array(buffer),
    header = new DataView(buffer);
  header.setUint32(0, 0x46546c67, true);
  header.setUint32(4, 2, true);
  header.setUint32(8, length, true);
  header.setUint32(12, jsonLength, true);
  header.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20, 20 + jsonLength);
  bytes.set(text, 20);
  if (binary) {
    const offset = 20 + jsonLength;
    header.setUint32(offset, binary.byteLength, true);
    header.setUint32(offset + 4, 0x004e4942, true);
    bytes.set(new Uint8Array(binary), offset + 8);
  }
  return buffer;
}
