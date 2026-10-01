import { AssetError } from '../../assets/src/index.js';
import { assetLimits } from '../../../src/data/assets.js';

/** One mip level exactly as stored in the file, before any supercompression is undone. */
export interface KTX2Level {
  readonly data: Uint8Array;
  /** Size after supercompression is removed; 0 for BasisLZ. */
  readonly uncompressedByteLength: number;
}

/** Parsed KTX 2.0 container; payload views alias the input and are not copied. */
export interface KTX2Container {
  /** `VkFormat` value; 0 (`VK_FORMAT_UNDEFINED`) means a Basis Universal payload. */
  readonly vkFormat: number;
  readonly width: number;
  readonly height: number;
  readonly layerCount: number;
  readonly faceCount: number;
  /** 0 none, 1 BasisLZ, 2 Zstandard, 3 ZLIB. */
  readonly supercompression: number;
  readonly dfd: Uint8Array;
  /** Supercompression global data (the BasisLZ codebooks), empty otherwise. */
  readonly sgd: Uint8Array;
  /** Level 0 (the largest) first. */
  readonly levels: readonly KTX2Level[];
}

/**
 * Converts a container into RGBA8 pixels. XYZ.js bundles no Basis Universal or Zstandard
 * WebAssembly: supply one (for example wrapping basis_transcoder) to load BasisLZ, UASTC or
 * Zstandard payloads. The result must describe the base level in sRGB-or-linear RGBA8 order.
 */
export type KTX2Transcoder = (
  container: KTX2Container,
) => KTX2Image | Promise<KTX2Image>;

export interface KTX2Image {
  readonly width: number;
  readonly height: number;
  /** `width * height * 4` bytes, RGBA, top row first. */
  readonly data: Uint8Array | Uint8ClampedArray;
}

const identifier = [
  0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
];
const VK_R8G8B8_UNORM = 23;
const VK_R8G8B8_SRGB = 29;
const VK_R8G8B8A8_UNORM = 37;
const VK_R8G8B8A8_SRGB = 43;
const headerBytes = 80;
const levelEntryBytes = 24;
const maxLevels = 32;

/** Cheap signature test used to route image bytes before parsing. */
export function isKTX2(bytes: Uint8Array): boolean {
  return (
    bytes.length >= identifier.length &&
    identifier.every((value, i) => bytes[i] === value)
  );
}

function fail(message: string): never {
  throw new AssetError(`Invalid KTX2 container: ${message}`);
}

/** Validates the header, level index and every byte range; throws AssetError on any violation. */
export function parseKTX2(bytes: Uint8Array): KTX2Container {
  if (!isKTX2(bytes)) fail('missing identifier');
  if (bytes.length < headerBytes) fail('truncated header');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u32 = (offset: number): number => view.getUint32(offset, true);
  const u64 = (offset: number): number => {
    const value = view.getBigUint64(offset, true);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) fail('offset is out of range');
    return Number(value);
  };
  const vkFormat = u32(12);
  const width = u32(20);
  const height = u32(24);
  const depth = u32(28);
  const layerCount = u32(32);
  const faceCount = u32(36);
  const levelCount = Math.max(u32(40), 1);
  const supercompression = u32(44);
  if (width === 0) fail('zero width');
  if (depth > 1) fail('3D textures are unsupported');
  if (levelCount > maxLevels) fail('too many levels');
  if (supercompression > 3) fail('unknown supercompression scheme');
  const range = (offset: number, length: number, label: string): Uint8Array => {
    if (offset + length > bytes.length) fail(`${label} is out of bounds`);
    return bytes.subarray(offset, offset + length);
  };
  const dfd = range(u32(48), u32(52), 'data format descriptor');
  const sgd = range(u64(64), u64(72), 'global data');
  if (headerBytes + levelCount * levelEntryBytes > bytes.length)
    fail('truncated level index');
  const levels: KTX2Level[] = [];
  for (let i = 0; i < levelCount; i++) {
    const entry = headerBytes + i * levelEntryBytes;
    levels.push({
      data: range(u64(entry), u64(entry + 8), `level ${i}`),
      uncompressedByteLength: u64(entry + 16),
    });
  }
  return {
    vkFormat,
    width,
    height,
    layerCount,
    faceCount,
    supercompression,
    dfd,
    sgd,
    levels,
  };
}

async function inflate(
  data: Uint8Array,
  expected: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined')
    throw new AssetError(
      'ZLIB supercompressed KTX2 requires DecompressionStream.',
    );
  // KTX2 ZLIB is the RFC 1950 wrapper, which the platform names 'deflate'.
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));
  const out = new Uint8Array(expected);
  const reader = stream.getReader();
  let length = 0;
  try {
    for (;;) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.length > expected)
        fail('ZLIB level is larger than declared');
      out.set(value, length);
      length += value.length;
    }
  } finally {
    reader.releaseLock();
  }
  if (length !== expected) fail('ZLIB level is smaller than declared');
  return out;
}

/**
 * Produces RGBA8 pixels of the base level. Uncompressed 8-bit RGB/RGBA (with no or ZLIB
 * supercompression) is decoded here; everything else (BasisLZ, UASTC, ETC1S, block-compressed GPU
 * formats, Zstandard) needs `transcoder`. Only plain 2D textures are accepted: no arrays, cube
 * maps or 3D, and mip levels beyond the base are ignored.
 */
export async function decodeKTX2(
  bytes: Uint8Array,
  transcoder?: KTX2Transcoder,
  signal?: AbortSignal,
): Promise<KTX2Image> {
  const container = parseKTX2(bytes);
  if (container.layerCount > 1 || container.faceCount > 1)
    fail('array and cube textures are unsupported');
  if (container.height === 0) fail('1D textures are unsupported');
  const { width, height } = container;
  if (
    width > assetLimits.textureDimension ||
    height > assetLimits.textureDimension ||
    width * height > assetLimits.texturePixels
  )
    throw new AssetError('KTX2 image exceeds the texture size budget.');
  const channels =
    container.vkFormat === VK_R8G8B8A8_UNORM ||
    container.vkFormat === VK_R8G8B8A8_SRGB
      ? 4
      : container.vkFormat === VK_R8G8B8_UNORM ||
          container.vkFormat === VK_R8G8B8_SRGB
        ? 3
        : 0;
  const direct =
    channels > 0 &&
    (container.supercompression === 0 || container.supercompression === 3);
  let image: KTX2Image;
  if (direct) {
    const size = width * height * channels;
    const base = container.levels[0]!;
    const raw =
      container.supercompression === 3
        ? await inflate(base.data, size, signal)
        : base.data;
    if (raw.length !== size) fail('level size does not match the image size');
    if (channels === 4) image = { width, height, data: raw.slice() };
    else {
      const rgba = new Uint8Array(width * height * 4);
      for (let i = 0, j = 0; i < size; i += 3, j += 4) {
        rgba[j] = raw[i]!;
        rgba[j + 1] = raw[i + 1]!;
        rgba[j + 2] = raw[i + 2]!;
        rgba[j + 3] = 255;
      }
      image = { width, height, data: rgba };
    }
  } else {
    if (!transcoder)
      throw new AssetError(
        'This KTX2 payload needs GLTFLoadOptions.ktx2Transcoder (BasisLZ, UASTC, Zstandard or a GPU block format).',
      );
    image = await transcoder(container);
    signal?.throwIfAborted();
    if (
      !Number.isInteger(image.width) ||
      !Number.isInteger(image.height) ||
      image.width < 1 ||
      image.height < 1 ||
      image.width > assetLimits.textureDimension ||
      image.height > assetLimits.textureDimension ||
      image.width * image.height > assetLimits.texturePixels ||
      image.data.length !== image.width * image.height * 4
    )
      throw new AssetError('KTX2 transcoder returned an invalid RGBA image.');
  }
  return image;
}
