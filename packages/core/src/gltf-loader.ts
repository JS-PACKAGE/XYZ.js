import { AssetError, Texture } from '../../assets/src/index.js';
import type { LoadTask } from '../../assets/src/index.js';
import { readResponse } from '../../assets/src/read-response.js';
import { Matrix4, Vector3 } from '../../math/src/index.js';
import { modelLimits } from '../../../src/data/models.js';
import { assetLimits } from '../../../src/data/assets.js';
import {
  AnimationClip,
  KeyframeTrack,
  type AnimationPath,
  type Interpolation,
} from './animation.js';
import { Geometry } from './geometry.js';
import { PointLight, SpotLight } from './lights.js';
import { Group } from './group.js';
import { Mesh } from './mesh.js';
import { PBRMaterial, type TextureSamplerOptions } from './pbr-material.js';
import { MorphTargets, MorphWeights } from './morph.js';
import { SkinnedMesh } from './skinned-mesh.js';
import { decodeMeshopt } from './meshopt.js';
import { decodeKTX2, isKTX2, type KTX2Transcoder } from './ktx2.js';

export interface GLTFDirectionalLight {
  /** Unit vector the light travels along (the node's −Z axis in world space). */
  direction: Vector3;
  color: [number, number, number];
  intensity: number;
}
/** KHR_lights_punctual lights baked at the node's world transform when loading. */
export interface GLTFLights {
  point: PointLight[];
  spot: SpotLight[];
  directional: GLTFDirectionalLight[];
}
export interface GLTFAsset {
  readonly scene: Group;
  readonly animations: AnimationClip[];
  /** Raw glTF photometric values; add them to a Scene and scale `intensity` as needed. */
  readonly lights: GLTFLights;
  dispose(): void;
}
export interface GLTFLoadOptions {
  signal?: AbortSignal;
  /** Extra origins from which model-referenced buffers/images may be fetched; the model's own origin is always allowed. */
  allowedOrigins?: readonly string[];
  /**
   * Decoder for KHR_draco_mesh_compression. XYZ.js bundles no Draco WebAssembly: supply one
   * (for example wrapping the official draco3d decoder). Without it a Draco-compressed primitive
   * is accepted only when it also carries uncompressed fallback accessors.
   */
  dracoDecoder?: DracoDecoder;
  /**
   * Transcoder for KHR_texture_basisu and any KTX2 image that is not plain 8-bit RGB(A). XYZ.js
   * bundles no Basis Universal WebAssembly; without a transcoder `KHR_texture_basisu` is not
   * advertised, a texture's regular `source` is used when it has one, and KTX2 images are limited
   * to uncompressed 8-bit RGB(A) with no or ZLIB supercompression.
   */
  ktx2Transcoder?: KTX2Transcoder;
}
/** `attributes` maps glTF semantics to Draco attribute unique ids from the extension. */
export interface DracoDecodeRequest {
  readonly data: Uint8Array;
  readonly attributes: Readonly<Record<string, number>>;
}
/**
 * Values are in the accessor's logical space: dequantized floats for float accessors, normalized
 * floats for normalized integer accessors, plain numbers otherwise. `indices` holds triangle
 * indices and is required when the primitive has an `indices` accessor.
 */
export interface DracoDecodeResult {
  readonly indices?: ArrayLike<number>;
  readonly attributes: Readonly<Record<string, ArrayLike<number>>>;
}
export type DracoDecoder = (
  request: DracoDecodeRequest,
) => DracoDecodeResult | Promise<DracoDecodeResult>;
type RecordData = Record<string, unknown>;
function object(value: unknown, label: string): RecordData {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new AssetError(`${label} must be an object.`);
  return value as RecordData;
}
function integer(
  value: unknown,
  label: string,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > max
  )
    throw new AssetError(`${label} is outside its allowed range.`);
  return value;
}
function number(value: unknown, label: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isFinite(Math.fround(value))
  )
    throw new AssetError(`${label} must be a finite Float32 number.`);
  return value;
}
function vector(value: unknown, size: number, label: string): number[] {
  if (!Array.isArray(value) || value.length !== size)
    throw new AssetError(`${label} must contain ${size} numbers.`);
  return value.map((v) => number(v, label));
}
function list(value: unknown, label: string): RecordData[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > modelLimits.entries)
    throw new AssetError(`${label} exceeds the entry budget.`);
  return value.map((v) => object(v, label));
}
function reference<T>(items: readonly T[], value: unknown, label: string): T {
  const index = integer(value, label);
  if (index >= items.length)
    throw new AssetError(`${label} reference is out of bounds.`);
  return items[index];
}
function url(uri: unknown, base?: string): string {
  if (typeof uri !== 'string')
    throw new AssetError('Asset URI must be a string.');
  try {
    return new URL(
      uri,
      base ?? (typeof document !== 'undefined' ? document.baseURI : undefined),
    ).href;
  } catch (cause) {
    throw new AssetError('Invalid asset URI.', { cause });
  }
}

class DecodeContext {
  fetched = 0;
  decoded = 0;
  readonly textures: Texture[] = [];
  constructor(
    readonly signal: AbortSignal,
    readonly base?: string,
    readonly allowedOrigins: readonly string[] = [],
  ) {}
  reserve(bytes: number): void {
    this.decoded += bytes;
    if (
      !Number.isSafeInteger(this.decoded) ||
      this.decoded > modelLimits.decodedBytes
    )
      throw new AssetError('Model exceeds decoded memory budget.');
  }
  async bytes(
    uri: unknown,
    limit = modelLimits.fetchedBytes,
  ): Promise<ArrayBuffer> {
    this.signal.throwIfAborted();
    const resolved = url(uri, this.base);
    if (resolved.startsWith('data:')) {
      const comma = resolved.indexOf(',');
      if (comma < 0) throw new AssetError('Invalid data URI.');
      const encoded = resolved.slice(comma + 1);
      // The encoded representation is bounded before decoding or allocating bytes.
      if (encoded.length > limit * 4 + 16)
        throw new AssetError('Data URI exceeds byte budget.');
      const base64 = resolved.slice(0, comma).endsWith(';base64');
      let length = base64
        ? Math.floor((encoded.replace(/\s/g, '').length * 3) / 4)
        : 0;
      if (base64) {
        if (encoded.endsWith('==')) length -= 2;
        else if (encoded.endsWith('=')) length--;
      } else {
        for (let i = 0; i < encoded.length; i++) {
          if (encoded[i] === '%') {
            if (!/^[0-9a-f]{2}$/i.test(encoded.slice(i + 1, i + 3)))
              throw new AssetError('Invalid percent-encoded data URI.');
            i += 2;
          }
          length++;
        }
      }
      if (length > limit || this.fetched + length > modelLimits.fetchedBytes)
        throw new AssetError('Model exceeds fetched byte budget.');
      this.fetched += length;
      this.reserve(length);
      if (base64) {
        const payload = atob(encoded);
        return Uint8Array.from(payload, (c) => c.charCodeAt(0)).buffer;
      }
      const bytes = new Uint8Array(length);
      for (let i = 0, j = 0; i < encoded.length; i++, j++) {
        if (encoded[i] === '%') {
          bytes[j] = Number.parseInt(encoded.slice(i + 1, i + 3), 16);
          i += 2;
        } else bytes[j] = encoded.charCodeAt(i);
      }
      return bytes.buffer;
    }
    const response = await fetch(resolved, { signal: this.signal });
    if (!response.ok)
      throw new AssetError(`Model request failed (HTTP ${response.status}).`);
    const blob = await readResponse(
      response,
      Math.min(limit, modelLimits.fetchedBytes - this.fetched),
      this.signal,
    );
    this.fetched += blob.size;
    this.reserve(blob.size);
    return blob.arrayBuffer();
  }
  /** Model-referenced URIs may only be fetched from the model's own origin or an explicit allowlist. */
  resource(uri: unknown, limit?: number): Promise<ArrayBuffer> {
    const resolved = url(uri, this.base);
    if (!/^(data|blob):/.test(resolved)) {
      const origin = new URL(resolved).origin;
      const own = this.base ? new URL(this.base).origin : undefined;
      if (origin !== own && !this.allowedOrigins.includes(origin))
        throw new AssetError(`Model resource origin is not allowed: ${origin}`);
    }
    return this.bytes(resolved, limit);
  }
  async texture(blob: Blob | ImageData): Promise<Texture> {
    this.signal.throwIfAborted();
    const operation = Texture.fromImage(blob);
    let abort!: () => void;
    const cancelled = new Promise<never>((_, reject) => {
      abort = () =>
        reject(this.signal.reason ?? new DOMException('Aborted', 'AbortError'));
      this.signal.addEventListener('abort', abort, { once: true });
      if (this.signal.aborted) abort();
    });
    // A late decode still owns a bitmap even after the caller has stopped awaiting it.
    operation.then(
      (texture) => {
        if (this.signal.aborted) texture.destroy();
      },
      () => {},
    );
    try {
      const texture = await Promise.race([operation, cancelled]);
      this.textures.push(texture);
      this.signal.throwIfAborted();
      this.reserve(texture.width * texture.height * 4);
      return texture;
    } finally {
      this.signal.removeEventListener('abort', abort);
    }
  }
}

interface AccessorData {
  data: Float32Array;
  count: number;
  size: number;
  component: number;
  normalized: boolean;
  type: string;
}
const components: Record<number, number> = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};
const sizes: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};
function scalar(
  view: DataView,
  offset: number,
  component: number,
  normalized: boolean,
): number {
  let result: number;
  switch (component) {
    case 5120:
      result = view.getInt8(offset);
      return normalized ? Math.max(-1, result / 127) : result;
    case 5121:
      result = view.getUint8(offset);
      return normalized ? result / 255 : result;
    case 5122:
      result = view.getInt16(offset, true);
      return normalized ? Math.max(-1, result / 32767) : result;
    case 5123:
      result = view.getUint16(offset, true);
      return normalized ? result / 65535 : result;
    case 5125:
      return view.getUint32(offset, true);
    case 5126:
      return view.getFloat32(offset, true);
    default:
      throw new AssetError('Unsupported accessor component.');
  }
}

/** Extensions this loader implements; any other required extension is rejected. */
const supportedExtensions = new Set([
  'KHR_materials_emissive_strength',
  'KHR_materials_unlit',
  'KHR_texture_transform',
  'KHR_lights_punctual',
  'KHR_mesh_quantization',
  'EXT_meshopt_compression',
]);

/** offset.x, offset.y, rotation, scale.x, scale.y */
type UVTransform = readonly [number, number, number, number, number];
interface TextureSlot {
  texture: Texture;
  sampler: TextureSamplerOptions;
  transform: UVTransform | undefined;
}

/** Dependency-free glTF 2.0 triangle/TRS/skin loader. Unsupported required extensions are rejected. */
export class GLTFLoader {
  /** Task results are unique: abort disposes only this acquisition, never a shared asset. */
  task(key: string, uri: string): LoadTask<GLTFAsset> {
    return {
      key,
      load: async (signal) => {
        const asset = await this.load(uri, { signal });
        const abort = () => asset.dispose();
        if (signal.aborted) {
          asset.dispose();
          signal.throwIfAborted();
        }
        signal.addEventListener('abort', abort, { once: true });
        return asset;
      },
    };
  }

  async load(uri: string, options: GLTFLoadOptions = {}): Promise<GLTFAsset> {
    const resolved = url(uri);
    const context = new DecodeContext(
      options.signal ?? new AbortController().signal,
      resolved,
      options.allowedOrigins,
    );
    const bytes = await context.bytes(resolved, modelLimits.inputBytes);
    return this.parse(bytes, resolved, options);
  }

  async parse(
    input: ArrayBuffer | string,
    baseURL?: string,
    options: GLTFLoadOptions = {},
  ): Promise<GLTFAsset> {
    const context = new DecodeContext(
      options.signal ?? new AbortController().signal,
      baseURL,
      options.allowedOrigins,
    );
    context.signal.throwIfAborted();
    let scene: Group | undefined;
    const nodes: Group[] = [];
    try {
      let json: string, binary: ArrayBuffer | undefined;
      if (typeof input === 'string') {
        if (input.length > modelLimits.inputBytes)
          throw new AssetError('Model input exceeds byte budget.');
        let byteLength = 0;
        for (let i = 0; i < input.length; i++) {
          const code = input.charCodeAt(i);
          if (code < 0x80) byteLength++;
          else if (code < 0x800) byteLength += 2;
          else if (
            code >= 0xd800 &&
            code <= 0xdbff &&
            i + 1 < input.length &&
            input.charCodeAt(i + 1) >= 0xdc00 &&
            input.charCodeAt(i + 1) <= 0xdfff
          ) {
            byteLength += 4;
            i++;
          } else byteLength += 3;
          if (byteLength > modelLimits.inputBytes)
            throw new AssetError('Model input exceeds byte budget.');
        }
        json = input;
        context.fetched = byteLength;
      } else {
        if (input.byteLength > modelLimits.inputBytes)
          throw new AssetError('Model input exceeds byte budget.');
        context.fetched = input.byteLength;
        const header = new DataView(input);
        if (input.byteLength >= 4 && header.getUint32(0, true) === 0x46546c67) {
          if (
            input.byteLength < 20 ||
            header.getUint32(4, true) !== 2 ||
            header.getUint32(8, true) !== input.byteLength
          )
            throw new AssetError('Invalid GLB header.');
          let offset = 12,
            jsonChunk: Uint8Array | undefined,
            chunks = 0;
          while (offset < input.byteLength) {
            if (offset + 8 > input.byteLength)
              throw new AssetError('Truncated GLB chunk.');
            const length = header.getUint32(offset, true),
              type = header.getUint32(offset + 4, true);
            offset += 8;
            if (length % 4 || offset + length > input.byteLength)
              throw new AssetError('Invalid GLB chunk length.');
            if (chunks++ === 0 && type !== 0x4e4f534a)
              throw new AssetError('GLB must begin with JSON.');
            if (type === 0x4e4f534a) {
              if (jsonChunk) throw new AssetError('Duplicate GLB JSON chunk.');
              jsonChunk = new Uint8Array(input, offset, length);
            } else if (type === 0x004e4942) {
              if (binary || chunks !== 2)
                throw new AssetError('Invalid GLB binary chunk.');
              context.reserve(length);
              binary = input.slice(offset, offset + length);
            }
            offset += length;
          }
          if (!jsonChunk) throw new AssetError('Missing GLB JSON.');
          json = new TextDecoder('utf-8', { fatal: true }).decode(jsonChunk);
        } else json = new TextDecoder('utf-8', { fatal: true }).decode(input);
      }
      const document = object(JSON.parse(json), 'glTF');
      const asset = object(document.asset, 'glTF asset');
      if (
        asset.version !== '2.0' ||
        (asset.minVersion !== undefined && asset.minVersion !== '2.0')
      )
        throw new AssetError('Only glTF 2.0 is supported.');
      if (document.extensionsRequired !== undefined) {
        if (!Array.isArray(document.extensionsRequired))
          throw new AssetError('extensionsRequired must be an array.');
        for (const name of document.extensionsRequired)
          if (
            typeof name !== 'string' ||
            !(
              supportedExtensions.has(name) ||
              (name === 'KHR_draco_mesh_compression' && options.dracoDecoder) ||
              (name === 'KHR_texture_basisu' && options.ktx2Transcoder)
            )
          )
            throw new AssetError('Required glTF extensions are unsupported.');
      }
      const bufferDefs = list(document.buffers, 'buffers'),
        viewDefs = list(document.bufferViews, 'bufferViews'),
        accessorDefs = list(document.accessors, 'accessors');
      const nodeDefs = list(document.nodes, 'nodes'),
        meshDefs = list(document.meshes, 'meshes'),
        skinDefs = list(document.skins, 'skins');
      const imageDefs = list(document.images, 'images'),
        textureDefs = list(document.textures, 'textures'),
        materialDefs = list(document.materials, 'materials');
      const animationDefs = list(document.animations, 'animations'),
        sceneDefs = list(document.scenes, 'scenes');
      // EXT_meshopt_compression may mark a buffer as an uncompressed fallback that is never loaded.
      const buffers: (ArrayBuffer | undefined)[] = [];
      for (let i = 0; i < bufferDefs.length; i++) {
        const def = bufferDefs[i],
          length = integer(
            def.byteLength,
            'buffer byteLength',
            modelLimits.decodedBytes,
          );
        const meshopt =
          def.extensions === undefined
            ? undefined
            : object(def.extensions, 'buffer extensions')
                .EXT_meshopt_compression;
        if (meshopt !== undefined) {
          const fallback = object(meshopt, 'meshopt buffer').fallback;
          if (fallback !== undefined && typeof fallback !== 'boolean')
            throw new AssetError('Meshopt fallback must be boolean.');
          if (fallback === true) {
            buffers.push(undefined);
            continue;
          }
        }
        const data =
          def.uri === undefined
            ? i === 0
              ? binary
              : undefined
            : await context.resource(def.uri);
        if (
          !data ||
          data.byteLength < length ||
          (def.uri === undefined && data.byteLength - length > 3)
        )
          throw new AssetError('Buffer length does not match glTF.');
        buffers.push(data);
      }
      const views = viewDefs.map((def) => {
        const offset = integer(def.byteOffset ?? 0, 'bufferView offset'),
          length = integer(
            def.byteLength,
            'bufferView length',
            modelLimits.decodedBytes,
          );
        const stride =
          def.byteStride === undefined
            ? undefined
            : integer(def.byteStride, 'byteStride', 252);
        if (stride !== undefined && (stride < 4 || stride % 4))
          throw new AssetError('Invalid bufferView stride.');
        const compressed =
          def.extensions === undefined
            ? undefined
            : object(def.extensions, 'bufferView extensions')
                .EXT_meshopt_compression;
        if (compressed !== undefined) {
          // The view's own buffer/offset describe the uncompressed fallback and are not read.
          const ext = object(compressed, 'meshopt bufferView');
          const sourceIndex = integer(ext.buffer, 'meshopt buffer');
          const source = reference(buffers, sourceIndex, 'meshopt buffer');
          const sourceLength = integer(
            bufferDefs[sourceIndex].byteLength,
            'meshopt buffer length',
          );
          const start = integer(ext.byteOffset ?? 0, 'meshopt byteOffset'),
            size = integer(ext.byteLength, 'meshopt byteLength'),
            step = integer(ext.byteStride, 'meshopt byteStride', 256),
            count = integer(
              ext.count,
              'meshopt count',
              modelLimits.accessorElements,
            );
          if (
            !source ||
            !count ||
            !step ||
            step * count !== length ||
            (stride !== undefined && stride !== step) ||
            start + size > sourceLength
          )
            throw new AssetError('Invalid meshopt bufferView.');
          context.reserve(length);
          const decoded = new Uint8Array(length);
          decodeMeshopt(
            decoded,
            count,
            step,
            new Uint8Array(source, start, size),
            ext.mode,
            ext.filter,
          );
          return { buffer: decoded.buffer, offset: 0, length, stride };
        }
        const buffer = reference(buffers, def.buffer, 'bufferView buffer');
        if (!buffer)
          throw new AssetError(
            'bufferView references an unloaded fallback buffer.',
          );
        const declared = integer(
          reference(bufferDefs, def.buffer, 'buffer').byteLength,
          'buffer length',
        );
        if (offset + length > declared)
          throw new AssetError('bufferView is out of bounds.');
        return { buffer, offset, length, stride };
      });
      const accessors = new Map<number, AccessorData>();
      const readAccessor = (index: unknown): AccessorData => {
        const id = integer(index, 'accessor index');
        const cached = accessors.get(id);
        if (cached) return cached;
        const def = reference(accessorDefs, id, 'accessor');
        const component = integer(def.componentType, 'componentType'),
          width = Object.hasOwn(components, component)
            ? components[component]
            : undefined;
        const type = typeof def.type === 'string' ? def.type : '',
          size = Object.hasOwn(sizes, type) ? sizes[type] : undefined;
        const count = integer(
          def.count,
          'accessor count',
          modelLimits.accessorElements,
        );
        if (
          !width ||
          !size ||
          count === 0 ||
          count * size > modelLimits.accessorElements
        )
          throw new AssetError('Invalid accessor type or size.');
        if (def.normalized !== undefined && typeof def.normalized !== 'boolean')
          throw new AssetError('Accessor normalized must be boolean.');
        const normalized = def.normalized === true;
        if (normalized && (component === 5125 || component === 5126))
          throw new AssetError('Invalid normalized accessor component.');
        const matrixSize = type.startsWith('MAT') ? Number(type.slice(3)) : 0;
        const columnStride = matrixSize
          ? Math.ceil((matrixSize * width) / 4) * 4
          : 0;
        const packed = matrixSize ? columnStride * matrixSize : width * size;
        const componentOffset = (j: number) =>
          matrixSize
            ? Math.floor(j / matrixSize) * columnStride +
              (j % matrixSize) * width
            : j * width;
        context.reserve(count * size * 4);
        const data = new Float32Array(count * size);
        const offset = integer(def.byteOffset ?? 0, 'accessor offset');
        if (def.bufferView !== undefined) {
          const view = reference(views, def.bufferView, 'accessor bufferView'),
            stride = view.stride ?? packed;
          if (
            offset % width ||
            (view.offset + offset) % width ||
            stride % width ||
            stride < packed ||
            offset + (count - 1) * stride + packed > view.length
          )
            throw new AssetError('Accessor exceeds or misaligns bufferView.');
          const raw = new DataView(view.buffer, view.offset, view.length);
          for (let i = 0; i < count; i++)
            for (let j = 0; j < size; j++)
              data[i * size + j] = scalar(
                raw,
                offset + i * stride + componentOffset(j),
                component,
                normalized,
              );
        } else if (offset !== 0)
          throw new AssetError(
            'Accessor without bufferView cannot have a byte offset.',
          );
        if (def.sparse !== undefined) {
          const sparse = object(def.sparse, 'sparse accessor'),
            amount = integer(sparse.count, 'sparse count', count);
          if (!amount) throw new AssetError('Sparse count must be positive.');
          const indices = object(sparse.indices, 'sparse indices'),
            values = object(sparse.values, 'sparse values');
          const ic = integer(indices.componentType, 'sparse component');
          if (![5121, 5123, 5125].includes(ic))
            throw new AssetError('Invalid sparse index component.');
          const iv = reference(views, indices.bufferView, 'sparse index view'),
            vv = reference(views, values.bufferView, 'sparse value view');
          const io = integer(indices.byteOffset ?? 0, 'sparse index offset'),
            vo = integer(values.byteOffset ?? 0, 'sparse value offset');
          if (
            iv.stride ||
            vv.stride ||
            (iv.offset + io) % components[ic] ||
            (vv.offset + vo) % width ||
            io + amount * components[ic] > iv.length ||
            vo + amount * packed > vv.length
          )
            throw new AssetError(
              'Sparse data exceeds or misaligns bufferView.',
            );
          const ir = new DataView(iv.buffer, iv.offset, iv.length),
            vr = new DataView(vv.buffer, vv.offset, vv.length);
          let previous = -1;
          for (let i = 0; i < amount; i++) {
            const target = scalar(ir, io + i * components[ic], ic, false);
            if (target <= previous || target >= count)
              throw new AssetError(
                'Sparse indices must be ordered and within accessor bounds.',
              );
            previous = target;
            for (let j = 0; j < size; j++)
              data[target * size + j] = scalar(
                vr,
                vo + i * packed + componentOffset(j),
                component,
                normalized,
              );
          }
        }
        for (const value of data)
          if (!Number.isFinite(value))
            throw new AssetError(
              'Accessor values must be finite Float32 numbers.',
            );
        const result = { data, count, size, component, normalized, type };
        accessors.set(id, result);
        return result;
      };
      // KHR_draco_mesh_compression: an injected decoder supplies the vertex data that the
      // primitive's bufferView-less accessors describe; decoded values replace the accessor cache.
      for (const mesh of meshDefs)
        for (const primitive of list(mesh.primitives, 'primitives')) {
          const ext =
            primitive.extensions === undefined
              ? undefined
              : object(primitive.extensions, 'primitive extensions')
                  .KHR_draco_mesh_compression;
          if (ext === undefined) continue;
          const draco = object(ext, 'draco primitive');
          const attributes = object(
            primitive.attributes,
            'primitive attributes',
          );
          const dracoAttributes = object(draco.attributes, 'draco attributes');
          if (!options.dracoDecoder) {
            // Without a decoder only a primitive that carries uncompressed fallback data loads.
            const position = reference(
              accessorDefs,
              attributes.POSITION,
              'POSITION accessor',
            );
            if (position.bufferView === undefined)
              throw new AssetError(
                'Draco-compressed primitive requires GLTFLoadOptions.dracoDecoder.',
              );
            continue;
          }
          const view = reference(views, draco.bufferView, 'draco bufferView');
          const request: Record<string, number> = {};
          for (const [semantic, id] of Object.entries(dracoAttributes)) {
            if (attributes[semantic] === undefined)
              throw new AssetError(
                'Draco attribute is missing from primitive attributes.',
              );
            request[semantic] = integer(id, 'draco attribute id');
          }
          if (request.POSITION === undefined)
            throw new AssetError('Draco primitive requires POSITION.');
          context.signal.throwIfAborted();
          const result = await options.dracoDecoder({
            data: new Uint8Array(view.buffer, view.offset, view.length),
            attributes: Object.freeze({ ...request }),
          });
          context.signal.throwIfAborted();
          const store = (
            id: unknown,
            values: ArrayLike<number> | undefined,
            label: string,
          ): void => {
            const def = reference(accessorDefs, id, `${label} accessor`);
            const component = integer(def.componentType, 'componentType');
            const type = typeof def.type === 'string' ? def.type : '';
            const size = Object.hasOwn(sizes, type) ? sizes[type] : 0;
            const count = integer(
              def.count,
              'accessor count',
              modelLimits.accessorElements,
            );
            if (
              !Object.hasOwn(components, component) ||
              !size ||
              type.startsWith('MAT') ||
              !count ||
              count * size > modelLimits.accessorElements
            )
              throw new AssetError(`Invalid Draco ${label} accessor.`);
            if (!values || values.length !== count * size)
              throw new AssetError(
                `Draco decoder returned the wrong ${label} length.`,
              );
            context.reserve(count * size * 4);
            const data = new Float32Array(count * size);
            for (let i = 0; i < data.length; i++) {
              const value = values[i];
              if (!Number.isFinite(value))
                throw new AssetError(`Draco ${label} values must be finite.`);
              data[i] = value;
            }
            accessors.set(integer(id, 'accessor index'), {
              data,
              count,
              size,
              component,
              normalized: def.normalized === true,
              type,
            });
          };
          for (const semantic of Object.keys(request))
            store(attributes[semantic], result.attributes[semantic], semantic);
          if (primitive.indices !== undefined)
            store(primitive.indices, result.indices, 'indices');
        }
      // Validate even unreferenced accessors, so malformed required binary data cannot hide in an unused scene.
      for (let i = 0; i < accessorDefs.length; i++) readAccessor(i);
      const imageCache = new Map<number, Texture>();
      const readImage = async (index: unknown): Promise<Texture> => {
        const id = integer(index, 'image index'),
          cached = imageCache.get(id);
        if (cached) return cached;
        const def = reference(imageDefs, id, 'image');
        let source: Blob | ImageData;
        let data: Uint8Array;
        const mimeType: unknown = def.mimeType;
        if (def.uri !== undefined) {
          const bytes = await context.resource(
            def.uri,
            assetLimits.textureBytes,
          );
          context.reserve(bytes.byteLength);
          data = new Uint8Array(bytes);
        } else {
          const view = reference(views, def.bufferView, 'image bufferView');
          if (
            mimeType !== 'image/png' &&
            mimeType !== 'image/jpeg' &&
            mimeType !== 'image/ktx2'
          )
            throw new AssetError(
              'Embedded images require PNG, JPEG or KTX2 MIME type.',
            );
          if (view.length > assetLimits.textureBytes)
            throw new AssetError('Embedded image exceeds byte budget.');
          context.reserve(view.length);
          data = new Uint8Array(view.buffer, view.offset, view.length);
        }
        if (mimeType === 'image/ktx2' || isKTX2(data)) {
          const image = await decodeKTX2(
            data,
            options.ktx2Transcoder,
            context.signal,
          );
          source = new ImageData(
            new Uint8ClampedArray(
              image.data.buffer as ArrayBuffer,
              image.data.byteOffset,
              image.data.length,
            ),
            image.width,
            image.height,
          );
        } else
          source = new Blob([data as BlobPart], {
            type: typeof mimeType === 'string' ? mimeType : '',
          });
        const texture = await context.texture(source);
        imageCache.set(id, texture);
        return texture;
      };
      const samplerDefs = list(document.samplers, 'samplers');
      const addressModes: Record<
        number,
        TextureSamplerOptions['addressModeU']
      > = {
        33071: 'clamp-to-edge',
        10497: 'repeat',
        33648: 'mirror-repeat',
      };
      const readTexture = async (
        info: unknown,
      ): Promise<TextureSlot | undefined> => {
        if (info === undefined) return undefined;
        const def = object(info, 'texture info');
        let transform: UVTransform | undefined;
        let texCoord = def.texCoord;
        if (def.extensions !== undefined) {
          const extensions = object(def.extensions, 'texture extensions');
          if (extensions.KHR_texture_transform !== undefined) {
            const t = object(extensions.KHR_texture_transform, 'transform');
            if (t.texCoord !== undefined) texCoord = t.texCoord;
            const offset =
                t.offset === undefined ? [0, 0] : vector(t.offset, 2, 'offset'),
              scale =
                t.scale === undefined ? [1, 1] : vector(t.scale, 2, 'scale'),
              rotation = number(t.rotation ?? 0, 'rotation');
            if (
              offset[0] !== 0 ||
              offset[1] !== 0 ||
              rotation !== 0 ||
              scale[0] !== 1 ||
              scale[1] !== 1
            )
              transform = [offset[0], offset[1], rotation, scale[0], scale[1]];
          }
        }
        if (texCoord !== undefined && texCoord !== 0)
          throw new AssetError('Only TEXCOORD_0 textures are supported.');
        const texture = reference(textureDefs, def.index, 'texture');
        const basisuExtension =
          texture.extensions === undefined
            ? undefined
            : object(texture.extensions, 'texture extensions')
                .KHR_texture_basisu;
        const basisu =
          basisuExtension === undefined
            ? undefined
            : object(basisuExtension, 'KHR_texture_basisu').source;
        const sampler =
          texture.sampler === undefined
            ? {}
            : reference(samplerDefs, texture.sampler, 'sampler');
        // Mipmapped filters (9984–9987) are accepted: images are never mipmapped,
        // so they degrade to the matching nearest/linear base filter.
        const mipmapped: Record<number, number> = {
          9984: 9728,
          9985: 9729,
          9986: 9728,
          9987: 9729,
        };
        const min =
            mipmapped[sampler.minFilter as number] ?? sampler.minFilter ?? 9729,
          mag = sampler.magFilter ?? 9729;
        if (min !== 9728 && min !== 9729)
          throw new AssetError('Invalid glTF minification filter.');
        if (mag !== 9728 && mag !== 9729)
          throw new AssetError('Invalid glTF magnification filter.');
        const wrapS = integer(sampler.wrapS ?? 10497, 'sampler wrapS'),
          wrapT = integer(sampler.wrapT ?? 10497, 'sampler wrapT');
        const addressModeU = addressModes[wrapS],
          addressModeV = addressModes[wrapT];
        if (!addressModeU || !addressModeV)
          throw new AssetError('Invalid glTF sampler wrapping mode.');
        return {
          texture: await readImage(
            basisu !== undefined && options.ktx2Transcoder
              ? basisu
              : (texture.source ?? basisu),
          ),
          sampler: {
            minFilter: min === 9728 ? 'nearest' : 'linear',
            magFilter: mag === 9728 ? 'nearest' : 'linear',
            addressModeU,
            addressModeV,
          },
          transform,
        };
      };
      let white: Texture | undefined;
      const getWhite = async () =>
        (white ??= await context.texture(
          new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1),
        ));
      const materials: PBRMaterial[] = [];
      /** Baked into UV0 of every primitive using the material (parallel to `materials`). */
      const materialTransforms: (UVTransform | undefined)[] = [];
      for (const def of materialDefs) {
        const pbr =
          def.pbrMetallicRoughness === undefined
            ? {}
            : object(def.pbrMetallicRoughness, 'PBR material');
        const factor =
          pbr.baseColorFactor === undefined
            ? [1, 1, 1, 1]
            : vector(pbr.baseColorFactor, 4, 'baseColorFactor');
        const normal =
          def.normalTexture === undefined
            ? undefined
            : object(def.normalTexture, 'normal texture');
        const occlusion =
          def.occlusionTexture === undefined
            ? undefined
            : object(def.occlusionTexture, 'occlusion texture');
        const alphaMode = def.alphaMode ?? 'OPAQUE';
        if (
          alphaMode !== 'OPAQUE' &&
          alphaMode !== 'MASK' &&
          alphaMode !== 'BLEND'
        )
          throw new AssetError('Invalid material alpha mode.');
        if (
          def.doubleSided !== undefined &&
          typeof def.doubleSided !== 'boolean'
        )
          throw new AssetError('doubleSided must be boolean.');
        const extensions =
          def.extensions === undefined
            ? {}
            : object(def.extensions, 'material extensions');
        const unlit = extensions.KHR_materials_unlit !== undefined;
        let strength = 1;
        if (extensions.KHR_materials_emissive_strength !== undefined) {
          const ext = object(
            extensions.KHR_materials_emissive_strength,
            'emissive strength',
          );
          strength = number(ext.emissiveStrength ?? 1, 'emissive strength');
          if (strength < 0)
            throw new AssetError('Emissive strength cannot be negative.');
        }
        const base = await readTexture(pbr.baseColorTexture),
          metallicRoughness = await readTexture(pbr.metallicRoughnessTexture);
        const normalMap = await readTexture(normal),
          occlusionMap = await readTexture(occlusion),
          emissiveMap = await readTexture(def.emissiveTexture);
        // UVs are transformed on the CPU, so every texture slot of a material must agree.
        const slots = [
          base,
          metallicRoughness,
          normalMap,
          occlusionMap,
          emissiveMap,
        ].filter((slot) => slot !== undefined);
        const keys = new Set(slots.map((slot) => slot.transform?.join(',')));
        if (keys.size > 1)
          throw new AssetError(
            'All textures of a material must share the same KHR_texture_transform.',
          );
        materialTransforms.push(slots[0]?.transform);
        const emissiveFactor = (
          def.emissiveFactor === undefined
            ? [0, 0, 0]
            : vector(def.emissiveFactor, 3, 'emissive')
        ).map((value) => value * strength) as [number, number, number];
        if (unlit) {
          // Approximates KHR_materials_unlit: no diffuse response, base color as emission.
          materials.push(
            new PBRMaterial({
              texture: base?.texture ?? (await getWhite()),
              textureSampler: base?.sampler,
              color: [0, 0, 0],
              opacity: factor[3],
              alphaMode,
              metallic: 0,
              roughness: 1,
              emissive: factor.slice(0, 3) as [number, number, number],
              emissiveTexture: base?.texture,
              emissiveSampler: base?.sampler,
              alphaCutoff:
                alphaMode === 'MASK'
                  ? number(def.alphaCutoff ?? 0.5, 'alpha cutoff')
                  : 0,
              doubleSided: def.doubleSided === true,
            }),
          );
          continue;
        }
        materials.push(
          new PBRMaterial({
            texture: base?.texture ?? (await getWhite()),
            textureSampler: base?.sampler,
            color: factor.slice(0, 3) as [number, number, number],
            opacity: factor[3],
            alphaMode,
            metallic: number(pbr.metallicFactor ?? 1, 'metallic'),
            roughness: number(pbr.roughnessFactor ?? 1, 'roughness'),
            emissive: emissiveFactor,
            metallicRoughnessTexture: metallicRoughness?.texture,
            metallicRoughnessSampler: metallicRoughness?.sampler,
            normalTexture: normalMap?.texture,
            normalSampler: normalMap?.sampler,
            normalScale: number(normal?.scale ?? 1, 'normal scale'),
            occlusionTexture: occlusionMap?.texture,
            occlusionSampler: occlusionMap?.sampler,
            occlusionStrength: number(
              occlusion?.strength ?? 1,
              'occlusion strength',
            ),
            emissiveTexture: emissiveMap?.texture,
            emissiveSampler: emissiveMap?.sampler,
            alphaCutoff:
              alphaMode === 'MASK'
                ? number(def.alphaCutoff ?? 0.5, 'alpha cutoff')
                : 0,
            doubleSided: def.doubleSided === true,
          }),
        );
      }
      let fallback: PBRMaterial | undefined;
      const defaultMaterial = async () =>
        (fallback ??= new PBRMaterial({
          texture: await getWhite(),
          metallic: 1,
          roughness: 1,
          doubleSided: false,
          alphaMode: 'OPAQUE',
        }));
      for (let i = 0; i < nodeDefs.length; i++) nodes.push(new Group());
      const parents = new Int32Array(nodes.length).fill(-1);
      for (let i = 0; i < nodes.length; i++) {
        const def = nodeDefs[i],
          node = nodes[i];
        if (def.matrix !== undefined) {
          if (
            def.translation !== undefined ||
            def.rotation !== undefined ||
            def.scale !== undefined
          )
            throw new AssetError('Node cannot specify both matrix and TRS.');
          this.applyMatrix(node, vector(def.matrix, 16, 'node matrix'));
        } else {
          if (def.translation !== undefined) {
            const v = vector(def.translation, 3, 'translation');
            node.position.set(v[0], v[1], v[2]);
          }
          if (def.scale !== undefined) {
            const v = vector(def.scale, 3, 'scale');
            node.scale.set(v[0], v[1], v[2]);
          }
          if (def.rotation !== undefined) {
            const v = vector(def.rotation, 4, 'rotation');
            if (Math.abs(Math.hypot(...v) - 1) > 0.001)
              throw new AssetError('Node quaternion must be unit length.');
            node.rotation.set(v[0], v[1], v[2], v[3]).normalize();
          }
        }
        if (def.children !== undefined) {
          if (
            !Array.isArray(def.children) ||
            def.children.length > modelLimits.entries
          )
            throw new AssetError('Invalid node children.');
          for (const child of def.children) {
            const index = integer(child, 'child index');
            reference(nodes, index, 'child');
            if (parents[index] !== -1 || index === i)
              throw new AssetError('Node has multiple parents or a cycle.');
            parents[index] = i;
          }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        let parent = i,
          depth = 0;
        while (parents[parent] !== -1) {
          parent = parents[parent];
          if (++depth > modelLimits.hierarchyDepth || parent === i)
            throw new AssetError(
              'Node hierarchy has a cycle or exceeds depth budget.',
            );
        }
      }
      for (let i = 0; i < nodes.length; i++)
        if (parents[i] !== -1) nodes[parents[i]].add(nodes[i]);
      const skins = skinDefs.map((def) => {
        if (
          !Array.isArray(def.joints) ||
          !def.joints.length ||
          def.joints.length > modelLimits.joints
        )
          throw new AssetError('Skin exceeds joint budget.');
        const unique = new Set<number>();
        const joints = def.joints.map((id) => {
          const i = integer(id, 'joint');
          if (unique.has(i)) throw new AssetError('Duplicate skin joint.');
          unique.add(i);
          return reference(nodes, i, 'joint');
        });
        if (def.skeleton !== undefined)
          reference(nodes, def.skeleton, 'skeleton');
        let inverseBindMatrices: Matrix4[] | undefined;
        if (def.inverseBindMatrices !== undefined) {
          const accessor = readAccessor(def.inverseBindMatrices);
          if (
            accessor.type !== 'MAT4' ||
            accessor.component !== 5126 ||
            accessor.count < joints.length
          )
            throw new AssetError('Invalid inverse bind matrices.');
          inverseBindMatrices = joints.map((_, i) => {
            const matrix = new Matrix4();
            matrix.elements.set(accessor.data.subarray(i * 16, i * 16 + 16));
            return matrix;
          });
        }
        return { joints, inverseBindMatrices };
      });
      // Deltas are copied into MorphTargets, so their budget is counted twice.
      const readMorph = (
        primitive: RecordData,
        vertexCount: number,
        weights: MorphWeights,
      ): MorphTargets => {
        const targets = list(primitive.targets, 'morph targets');
        context.reserve(targets.length * vertexCount * 6 * 4);
        const read = (accessor: unknown, label: string): Float32Array => {
          const data = readAccessor(accessor);
          if (
            data.type !== 'VEC3' ||
            data.count !== vertexCount ||
            !(data.component === 5126 || data.normalized)
          )
            throw new AssetError(`Morph ${label} requires matching VEC3 data.`);
          return data.data;
        };
        const positions: (Float32Array | undefined)[] = [],
          normals: (Float32Array | undefined)[] = [];
        for (const target of targets) {
          for (const key of Object.keys(target))
            if (key !== 'POSITION' && key !== 'NORMAL' && key !== 'TANGENT')
              throw new AssetError(
                'Morph target attributes other than POSITION, NORMAL and TANGENT are unsupported.',
              );
          positions.push(
            target.POSITION === undefined
              ? undefined
              : read(target.POSITION, 'POSITION'),
          );
          normals.push(
            target.NORMAL === undefined
              ? undefined
              : read(target.NORMAL, 'NORMAL'),
          );
        }
        return new MorphTargets({ positions, normals, weights });
      };
      const nodeWeights = new Map<number, MorphWeights>();
      let totalVertices = 0,
        totalIndices = 0;
      for (let i = 0; i < nodes.length; i++) {
        const def = nodeDefs[i];
        if (def.mesh === undefined) {
          if (def.skin !== undefined)
            throw new AssetError('Skinned node requires mesh.');
          continue;
        }
        const mesh = reference(meshDefs, def.mesh, 'mesh');
        const primitives = list(mesh.primitives, 'primitives');
        if (!primitives.length)
          throw new AssetError('Mesh requires primitives.');
        const skin =
          def.skin === undefined
            ? undefined
            : reference(skins, def.skin, 'skin');
        const targetCounts = new Set(
          primitives.map((p) => list(p.targets, 'morph targets').length),
        );
        if (targetCounts.size !== 1)
          throw new AssetError(
            'All primitives of a mesh must have the same number of morph targets.',
          );
        const targetCount = [...targetCounts][0];
        if (targetCount > modelLimits.morphTargets)
          throw new AssetError('Mesh exceeds the morph target budget.');
        const rawWeights = def.weights ?? mesh.weights;
        if (!targetCount && rawWeights !== undefined)
          throw new AssetError('Morph weights require morph targets.');
        let morphWeights: MorphWeights | undefined;
        if (targetCount) {
          if (
            rawWeights !== undefined &&
            (!Array.isArray(rawWeights) || rawWeights.length !== targetCount)
          )
            throw new AssetError('Morph weights must match the target count.');
          morphWeights = new MorphWeights(
            rawWeights === undefined
              ? new Array<number>(targetCount).fill(0)
              : (rawWeights as unknown[]).map((v) => number(v, 'morph weight')),
          );
          nodeWeights.set(i, morphWeights);
        }
        for (const primitive of primitives) {
          if (primitive.mode !== undefined && primitive.mode !== 4)
            throw new AssetError('Only triangle primitives are supported.');
          const attributes = object(
            primitive.attributes,
            'primitive attributes',
          );
          const position = readAccessor(attributes.POSITION);
          if (position.type !== 'VEC3' || position.component !== 5126)
            throw new AssetError('POSITION requires float VEC3.');
          totalVertices += position.count;
          if (totalVertices > modelLimits.vertices)
            throw new AssetError('Model exceeds vertex budget.');
          const index =
            primitive.indices === undefined
              ? undefined
              : readAccessor(primitive.indices);
          if (
            index &&
            (index.type !== 'SCALAR' ||
              index.normalized ||
              ![5121, 5123, 5125].includes(index.component))
          )
            throw new AssetError('Invalid triangle indices.');
          const indexCount = index?.count ?? position.count;
          totalIndices += indexCount;
          if (
            totalIndices > modelLimits.indices ||
            !indexCount ||
            indexCount % 3
          )
            throw new AssetError('Invalid or excessive triangle indices.');
          if (!index) context.reserve(indexCount * 4);
          const indices =
            index?.data ??
            Float32Array.from({ length: indexCount }, (_, j) => j);
          for (const value of indices)
            if (value >= position.count)
              throw new AssetError('Triangle index is outside positions.');
          const normal =
            attributes.NORMAL === undefined
              ? undefined
              : readAccessor(attributes.NORMAL);
          if (
            normal &&
            (normal.type !== 'VEC3' ||
              normal.component !== 5126 ||
              normal.count !== position.count)
          )
            throw new AssetError('Invalid vertex normals.');
          const uv =
            attributes.TEXCOORD_0 === undefined
              ? undefined
              : readAccessor(attributes.TEXCOORD_0);
          if (
            uv &&
            (uv.type !== 'VEC2' ||
              uv.count !== position.count ||
              !(
                uv.component === 5126 ||
                ([5121, 5123].includes(uv.component) && uv.normalized)
              ))
          )
            throw new AssetError('Invalid UV0 accessor.');
          if (
            attributes.JOINTS_1 !== undefined ||
            attributes.WEIGHTS_1 !== undefined
          )
            throw new AssetError(
              'More than four skin influences are unsupported.',
            );
          if (attributes.COLOR_0 !== undefined)
            throw new AssetError('Vertex colors are unsupported.');
          context.reserve(
            position.count * 8 * 4 +
              indices.length * 4 +
              (normal ? 0 : position.count * 3 * 4) +
              (uv ? 0 : position.count * 2 * 4),
          );
          const materialIndex =
            primitive.material === undefined
              ? undefined
              : integer(primitive.material, 'material');
          const material =
            materialIndex === undefined
              ? await defaultMaterial()
              : reference(materials, materialIndex, 'material');
          let uvData: Float32Array =
            uv?.data ?? new Float32Array(position.count * 2);
          const transform =
            materialIndex === undefined
              ? undefined
              : materialTransforms[materialIndex];
          if (transform) {
            // Accessor data may be shared between primitives, so transform a copy.
            const [ox, oy, rotation, sx, sy] = transform,
              cos = Math.cos(rotation),
              sin = Math.sin(rotation);
            uvData = new Float32Array(uvData.length);
            const source = uv?.data;
            for (let j = 0; j < uvData.length; j += 2) {
              const u = (source?.[j] ?? 0) * sx,
                v = (source?.[j + 1] ?? 0) * sy;
              uvData[j] = ox + cos * u + sin * v;
              uvData[j + 1] = oy - sin * u + cos * v;
            }
          }
          const geometry = new Geometry({
            positions: position.data,
            normals: normal?.data ?? this.normals(position.data, indices),
            uvs: uvData,
            indices,
          });
          const morph = morphWeights
            ? readMorph(primitive, position.count, morphWeights)
            : undefined;
          if (skin) {
            const joint = readAccessor(attributes.JOINTS_0),
              weights = readAccessor(attributes.WEIGHTS_0);
            if (
              joint.type !== 'VEC4' ||
              joint.normalized ||
              ![5121, 5123].includes(joint.component) ||
              joint.count !== position.count ||
              weights.type !== 'VEC4' ||
              weights.count !== position.count ||
              !(
                weights.component === 5126 ||
                ([5121, 5123].includes(weights.component) && weights.normalized)
              )
            )
              throw new AssetError('Invalid skin attributes.');
            context.reserve(
              position.count * 8 * 4 * 3 +
                indices.length * 4 +
                position.count * 4 * 8 +
                skin.joints.length * 16 * 16,
            );
            nodes[i].add(
              new SkinnedMesh({
                geometry,
                material,
                morph,
                ...skin,
                jointIndices: joint.data,
                weights: weights.data,
              }),
            );
          } else nodes[i].add(new Mesh({ geometry, material, morph }));
        }
      }
      const animations = animationDefs.map((def, animationIndex) => {
        const samplers = list(def.samplers, 'animation samplers'),
          channels = list(def.channels, 'animation channels');
        if (!channels.length)
          throw new AssetError('Animation requires channels.');
        const seen = new Set<string>();
        const tracks = channels.map((channel) => {
          const target = object(channel.target, 'animation target'),
            sampler = reference(samplers, channel.sampler, 'animation sampler');
          const node = integer(target.node, 'animation node');
          const path = target.path;
          if (
            path !== 'translation' &&
            path !== 'rotation' &&
            path !== 'scale' &&
            path !== 'weights'
          )
            throw new AssetError(
              'Only transform and morph weights animations are supported.',
            );
          if (
            path !== 'weights' &&
            reference(nodeDefs, node, 'animation node').matrix !== undefined
          )
            throw new AssetError('Matrix nodes cannot be animated.');
          const key = `${node}:${path}`;
          if (seen.has(key))
            throw new AssetError('Duplicate animation target property.');
          seen.add(key);
          const input = readAccessor(sampler.input),
            output = readAccessor(sampler.output);
          const interpolation = sampler.interpolation ?? 'LINEAR';
          if (
            interpolation !== 'LINEAR' &&
            interpolation !== 'STEP' &&
            interpolation !== 'CUBICSPLINE'
          )
            throw new AssetError('Unsupported animation interpolation.');
          if (
            input.type !== 'SCALAR' ||
            input.component !== 5126 ||
            output.component !== 5126 ||
            output.type !==
              (path === 'weights'
                ? 'SCALAR'
                : path === 'rotation'
                  ? 'VEC4'
                  : 'VEC3') ||
            output.count !==
              input.count *
                (interpolation === 'CUBICSPLINE' ? 3 : 1) *
                (path === 'weights' ? (nodeWeights.get(node)?.count ?? 0) : 1)
          )
            throw new AssetError(
              'Animation sampler counts or types do not match.',
            );
          context.reserve(input.data.byteLength + output.data.byteLength);
          const weights = nodeWeights.get(node);
          if (path === 'weights' && !weights)
            throw new AssetError('Weights animation requires morph targets.');
          return new KeyframeTrack(
            path === 'weights'
              ? weights!
              : reference(nodes, node, 'animation node'),
            path as AnimationPath,
            input.data,
            output.data,
            interpolation as Interpolation,
          );
        });
        return new AnimationClip(
          typeof def.name === 'string'
            ? def.name
            : `animation-${animationIndex}`,
          tracks,
        );
      });
      scene = new Group();
      const selected = sceneDefs.length
        ? reference(sceneDefs, document.scene ?? 0, 'scene')
        : undefined;
      const roots =
        selected?.nodes ??
        (selected
          ? []
          : nodes.map((_, i) => i).filter((i) => parents[i] === -1));
      if (!Array.isArray(roots) || roots.length > modelLimits.entries)
        throw new AssetError('Invalid scene roots.');
      const mounted = new Set<number>();
      for (const root of roots) {
        const id = integer(root, 'scene root');
        if (parents[id] !== -1 || mounted.has(id))
          throw new AssetError('Scene roots must be unique parentless nodes.');
        mounted.add(id);
        scene.add(reference(nodes, id, 'scene root'));
      }
      context.signal.throwIfAborted();
      const ownedScene = scene;
      const lights = this.readLights(document, nodeDefs, nodes);
      let disposed = false;
      return {
        scene: ownedScene,
        animations,
        lights,
        dispose: () => {
          if (disposed) return;
          disposed = true;
          const errors: unknown[] = [];
          for (const node of [ownedScene, ...nodes]) {
            try {
              node.destroy();
            } catch (error) {
              errors.push(error);
            }
          }
          for (const texture of context.textures) {
            try {
              texture.destroy();
            } catch (error) {
              errors.push(error);
            }
          }
          if (errors.length)
            throw new AggregateError(errors, 'glTF asset cleanup failed.');
        },
      };
    } catch (cause) {
      for (const node of [scene, ...nodes]) {
        try {
          node?.destroy();
        } catch {
          /* Preserve the parse failure while releasing the remaining assets. */
        }
      }
      for (const texture of context.textures) texture.destroy();
      if (context.signal.aborted)
        throw (
          context.signal.reason ?? new DOMException('Aborted', 'AbortError')
        );
      if (cause instanceof AssetError) throw cause;
      throw new AssetError('Unable to parse glTF model.', { cause });
    }
  }

  /** Bakes KHR_lights_punctual definitions at each referencing node's world transform. */
  private readLights(
    document: RecordData,
    nodeDefs: RecordData[],
    nodes: Group[],
  ): GLTFLights {
    const result: GLTFLights = { point: [], spot: [], directional: [] };
    const root =
      document.extensions === undefined
        ? undefined
        : object(document.extensions, 'extensions').KHR_lights_punctual;
    if (root === undefined) return result;
    const defs = list(object(root, 'KHR_lights_punctual').lights, 'lights');
    for (let i = 0; i < nodes.length; i++) {
      const nodeExtensions = nodeDefs[i].extensions;
      if (nodeExtensions === undefined) continue;
      const reference_ = object(
        nodeExtensions,
        'node extensions',
      ).KHR_lights_punctual;
      if (reference_ === undefined) continue;
      const def = reference(
        defs,
        object(reference_, 'node light').light,
        'light',
      );
      if (
        result.point.length + result.spot.length + result.directional.length >=
        modelLimits.entries
      )
        throw new AssetError('Model exceeds the light budget.');
      const color = (
        def.color === undefined
          ? [1, 1, 1]
          : vector(def.color, 3, 'light color')
      ) as [number, number, number];
      const intensity = number(def.intensity ?? 1, 'light intensity');
      const e = nodes[i].updateWorldMatrix().elements;
      const direction = new Vector3(-e[8], -e[9], -e[10]).normalize();
      if (def.type === 'directional') {
        result.directional.push({ direction, color, intensity });
        continue;
      }
      const position = new Vector3(e[12], e[13], e[14]);
      // glTF range is optional; the engine's zero means unbounded.
      const range = number(def.range ?? 0, 'light range');
      if (def.type === 'point') {
        result.point.push(
          new PointLight({ position, color, intensity, range }),
        );
      } else if (def.type === 'spot') {
        const spot = def.spot === undefined ? {} : object(def.spot, 'spot');
        result.spot.push(
          new SpotLight({
            position,
            direction,
            color,
            intensity,
            range,
            innerAngle: number(spot.innerConeAngle ?? 0, 'inner cone angle'),
            outerAngle: number(
              spot.outerConeAngle ?? Math.PI / 4,
              'outer cone angle',
            ),
          }),
        );
      } else throw new AssetError('Unsupported punctual light type.');
    }
    return result;
  }

  private normals(
    positions: Float32Array,
    indices: Float32Array,
  ): Float32Array {
    const normals = new Float32Array(positions.length);
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3,
        b = indices[i + 1] * 3,
        c = indices[i + 2] * 3;
      const ax = positions[b] - positions[a],
        ay = positions[b + 1] - positions[a + 1],
        az = positions[b + 2] - positions[a + 2];
      const bx = positions[c] - positions[a],
        by = positions[c + 1] - positions[a + 1],
        bz = positions[c + 2] - positions[a + 2];
      const x = ay * bz - az * by,
        y = az * bx - ax * bz,
        z = ax * by - ay * bx;
      for (const offset of [a, b, c]) {
        normals[offset] += x;
        normals[offset + 1] += y;
        normals[offset + 2] += z;
      }
    }
    for (let i = 0; i < normals.length; i += 3) {
      const length =
        Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
      normals[i] /= length;
      normals[i + 1] /= length;
      normals[i + 2] /= length;
    }
    return normals;
  }

  private applyMatrix(node: Group, e: number[]): void {
    if (e[3] !== 0 || e[7] !== 0 || e[11] !== 0 || e[15] !== 1)
      throw new AssetError('Node matrix must be affine TRS.');
    let sx = Math.hypot(e[0], e[1], e[2]);
    const sy = Math.hypot(e[4], e[5], e[6]),
      sz = Math.hypot(e[8], e[9], e[10]);
    const determinant =
      e[0] * (e[5] * e[10] - e[6] * e[9]) -
      e[4] * (e[1] * e[10] - e[2] * e[9]) +
      e[8] * (e[1] * e[6] - e[2] * e[5]);
    if (determinant < 0) sx = -sx;
    const columns = [
      new Vector3(e[0], e[1], e[2]),
      new Vector3(e[4], e[5], e[6]),
      new Vector3(e[8], e[9], e[10]),
    ];
    const scales = [sx, sy, sz];
    const missing: number[] = [];
    for (let i = 0; i < 3; i++) {
      if (scales[i]) columns[i].scale(1 / scales[i]);
      else missing.push(i);
    }
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++) {
        if (
          scales[i] &&
          scales[j] &&
          Math.abs(columns[i].dot(columns[j])) > 0.0001
        )
          throw new AssetError('Node matrix contains shear.');
      }
    // Zero scale erases rotation axes. Complete any surviving axes into an orthonormal basis.
    if (missing.length === 1) {
      const axis = missing[0];
      columns[axis]
        .copy(columns[(axis + 1) % 3])
        .cross(columns[(axis + 2) % 3])
        .normalize();
    } else if (missing.length === 2) {
      const axis = scales.findIndex((scale) => scale !== 0),
        known = columns[axis];
      const helper =
        Math.abs(known.x) < 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
      const next = columns[(axis + 1) % 3];
      next
        .copy(helper)
        .subtract(known.clone().scale(helper.dot(known)))
        .normalize();
      columns[(axis + 2) % 3].copy(known).cross(next).normalize();
    } else if (missing.length === 3) {
      columns[0].set(1, 0, 0);
      columns[1].set(0, 1, 0);
      columns[2].set(0, 0, 1);
    }
    const m00 = columns[0].x,
      m10 = columns[0].y,
      m20 = columns[0].z;
    const m01 = columns[1].x,
      m11 = columns[1].y,
      m21 = columns[1].z;
    const m02 = columns[2].x,
      m12 = columns[2].y,
      m22 = columns[2].z;
    const trace = m00 + m11 + m22;
    let x: number, y: number, z: number, w: number;
    if (trace > 0) {
      const s = Math.sqrt(trace + 1) * 2;
      w = s / 4;
      x = (m21 - m12) / s;
      y = (m02 - m20) / s;
      z = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
      w = (m21 - m12) / s;
      x = s / 4;
      y = (m01 + m10) / s;
      z = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
      w = (m02 - m20) / s;
      x = (m01 + m10) / s;
      y = s / 4;
      z = (m12 + m21) / s;
    } else {
      const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
      w = (m10 - m01) / s;
      x = (m02 + m20) / s;
      y = (m12 + m21) / s;
      z = s / 4;
    }
    node.position.set(e[12], e[13], e[14]);
    node.scale.set(sx, sy, sz);
    node.rotation.set(x, y, z, w).normalize();
  }
}
