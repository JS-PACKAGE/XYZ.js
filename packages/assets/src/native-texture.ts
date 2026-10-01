import { AssetError, Texture } from './texture.js';
import { assetLimits } from '../../../src/data/assets.js';

// VkFormat and GL internal-format values are stable registry values. sRGB bytes are
// uploaded using their unorm twin: existing XYZ shaders own color-space conversion.
export const nativeTextureFormats = {
  rgba8unorm: [1, 1, 4, 37, 0x8058, ''],
  'rgba8unorm-srgb': [1, 1, 4, 43, 0x8c43, ''],
  'bc1-rgba-unorm': [4, 4, 8, 133, 0x83f1, 'texture-compression-bc'],
  'bc1-rgba-unorm-srgb': [4, 4, 8, 134, 0x8c4d, 'texture-compression-bc'],
  'bc2-rgba-unorm': [4, 4, 16, 135, 0x83f2, 'texture-compression-bc'],
  'bc2-rgba-unorm-srgb': [4, 4, 16, 136, 0x8c4e, 'texture-compression-bc'],
  'bc3-rgba-unorm': [4, 4, 16, 137, 0x83f3, 'texture-compression-bc'],
  'bc3-rgba-unorm-srgb': [4, 4, 16, 138, 0x8c4f, 'texture-compression-bc'],
  'bc4-r-unorm': [4, 4, 8, 139, 0x8dbb, 'texture-compression-bc'],
  'bc4-r-snorm': [4, 4, 8, 140, 0x8dbc, 'texture-compression-bc'],
  'bc5-rg-unorm': [4, 4, 16, 141, 0x8dbd, 'texture-compression-bc'],
  'bc5-rg-snorm': [4, 4, 16, 142, 0x8dbe, 'texture-compression-bc'],
  'bc6h-rgb-ufloat': [4, 4, 16, 143, 0x8e8f, 'texture-compression-bc'],
  'bc6h-rgb-float': [4, 4, 16, 144, 0x8e8e, 'texture-compression-bc'],
  'bc7-rgba-unorm': [4, 4, 16, 145, 0x8e8c, 'texture-compression-bc'],
  'bc7-rgba-unorm-srgb': [4, 4, 16, 146, 0x8e8d, 'texture-compression-bc'],
  'etc2-rgb8unorm': [4, 4, 8, 147, 0x9274, 'texture-compression-etc2'],
  'etc2-rgb8unorm-srgb': [4, 4, 8, 148, 0x9275, 'texture-compression-etc2'],
  'etc2-rgb8a1unorm': [4, 4, 8, 149, 0x9276, 'texture-compression-etc2'],
  'etc2-rgb8a1unorm-srgb': [4, 4, 8, 150, 0x9277, 'texture-compression-etc2'],
  'etc2-rgba8unorm': [4, 4, 16, 151, 0x9278, 'texture-compression-etc2'],
  'etc2-rgba8unorm-srgb': [4, 4, 16, 152, 0x9279, 'texture-compression-etc2'],
  'eac-r11unorm': [4, 4, 8, 153, 0x9270, 'texture-compression-etc2'],
  'eac-r11snorm': [4, 4, 8, 154, 0x9271, 'texture-compression-etc2'],
  'eac-rg11unorm': [4, 4, 16, 155, 0x9272, 'texture-compression-etc2'],
  'eac-rg11snorm': [4, 4, 16, 156, 0x9273, 'texture-compression-etc2'],
  'astc-4x4-unorm': [4, 4, 16, 157, 0x93b0, 'texture-compression-astc'],
  'astc-4x4-unorm-srgb': [4, 4, 16, 158, 0x93d0, 'texture-compression-astc'],
  'astc-5x4-unorm': [5, 4, 16, 159, 0x93b1, 'texture-compression-astc'],
  'astc-5x4-unorm-srgb': [5, 4, 16, 160, 0x93d1, 'texture-compression-astc'],
  'astc-5x5-unorm': [5, 5, 16, 161, 0x93b2, 'texture-compression-astc'],
  'astc-5x5-unorm-srgb': [5, 5, 16, 162, 0x93d2, 'texture-compression-astc'],
  'astc-6x5-unorm': [6, 5, 16, 163, 0x93b3, 'texture-compression-astc'],
  'astc-6x5-unorm-srgb': [6, 5, 16, 164, 0x93d3, 'texture-compression-astc'],
  'astc-6x6-unorm': [6, 6, 16, 165, 0x93b4, 'texture-compression-astc'],
  'astc-6x6-unorm-srgb': [6, 6, 16, 166, 0x93d4, 'texture-compression-astc'],
  'astc-8x5-unorm': [8, 5, 16, 167, 0x93b5, 'texture-compression-astc'],
  'astc-8x5-unorm-srgb': [8, 5, 16, 168, 0x93d5, 'texture-compression-astc'],
  'astc-8x6-unorm': [8, 6, 16, 169, 0x93b6, 'texture-compression-astc'],
  'astc-8x6-unorm-srgb': [8, 6, 16, 170, 0x93d6, 'texture-compression-astc'],
  'astc-8x8-unorm': [8, 8, 16, 171, 0x93b7, 'texture-compression-astc'],
  'astc-8x8-unorm-srgb': [8, 8, 16, 172, 0x93d7, 'texture-compression-astc'],
  'astc-10x5-unorm': [10, 5, 16, 173, 0x93b8, 'texture-compression-astc'],
  'astc-10x5-unorm-srgb': [10, 5, 16, 174, 0x93d8, 'texture-compression-astc'],
  'astc-10x6-unorm': [10, 6, 16, 175, 0x93b9, 'texture-compression-astc'],
  'astc-10x6-unorm-srgb': [10, 6, 16, 176, 0x93d9, 'texture-compression-astc'],
  'astc-10x8-unorm': [10, 8, 16, 177, 0x93ba, 'texture-compression-astc'],
  'astc-10x8-unorm-srgb': [10, 8, 16, 178, 0x93da, 'texture-compression-astc'],
  'astc-10x10-unorm': [10, 10, 16, 179, 0x93bb, 'texture-compression-astc'],
  'astc-10x10-unorm-srgb': [
    10,
    10,
    16,
    180,
    0x93db,
    'texture-compression-astc',
  ],
  'astc-12x10-unorm': [12, 10, 16, 181, 0x93bc, 'texture-compression-astc'],
  'astc-12x10-unorm-srgb': [
    12,
    10,
    16,
    182,
    0x93dc,
    'texture-compression-astc',
  ],
  'astc-12x12-unorm': [12, 12, 16, 183, 0x93bd, 'texture-compression-astc'],
  'astc-12x12-unorm-srgb': [
    12,
    12,
    16,
    184,
    0x93dd,
    'texture-compression-astc',
  ],
} as const;
export type NativeTextureFormat =
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-rg-unorm'
  | 'bc5-rg-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb'
  | 'etc2-rgb8unorm'
  | 'etc2-rgb8unorm-srgb'
  | 'etc2-rgb8a1unorm'
  | 'etc2-rgb8a1unorm-srgb'
  | 'etc2-rgba8unorm'
  | 'etc2-rgba8unorm-srgb'
  | 'eac-r11unorm'
  | 'eac-r11snorm'
  | 'eac-rg11unorm'
  | 'eac-rg11snorm'
  | 'astc-4x4-unorm'
  | 'astc-4x4-unorm-srgb'
  | 'astc-5x4-unorm'
  | 'astc-5x4-unorm-srgb'
  | 'astc-5x5-unorm'
  | 'astc-5x5-unorm-srgb'
  | 'astc-6x5-unorm'
  | 'astc-6x5-unorm-srgb'
  | 'astc-6x6-unorm'
  | 'astc-6x6-unorm-srgb'
  | 'astc-8x5-unorm'
  | 'astc-8x5-unorm-srgb'
  | 'astc-8x6-unorm'
  | 'astc-8x6-unorm-srgb'
  | 'astc-8x8-unorm'
  | 'astc-8x8-unorm-srgb'
  | 'astc-10x5-unorm'
  | 'astc-10x5-unorm-srgb'
  | 'astc-10x6-unorm'
  | 'astc-10x6-unorm-srgb'
  | 'astc-10x8-unorm'
  | 'astc-10x8-unorm-srgb'
  | 'astc-10x10-unorm'
  | 'astc-10x10-unorm-srgb'
  | 'astc-12x10-unorm'
  | 'astc-12x10-unorm-srgb'
  | 'astc-12x12-unorm'
  | 'astc-12x12-unorm-srgb';
export interface NativeTextureMip {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}
export interface NativeTextureOptions {
  readonly format: NativeTextureFormat;
  readonly width: number;
  readonly height: number;
  readonly levels: readonly NativeTextureMip[];
}

export function nativeTextureLayout(
  format: NativeTextureFormat,
  width: number,
  height: number,
): { bytesPerRow: number; rows: number; byteLength: number } {
  if (!Object.hasOwn(nativeTextureFormats, format))
    throw new AssetError(`Unknown native texture format: ${format}`);
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > assetLimits.textureDimension ||
    height > assetLimits.textureDimension
  )
    throw new AssetError(
      'Native texture dimensions exceed their resource budget.',
    );
  const [blockWidth, blockHeight, blockBytes] = nativeTextureFormats[format];
  const bytesPerRow = Math.ceil(width / blockWidth) * blockBytes;
  const rows = Math.ceil(height / blockHeight);
  return { bytesPerRow, rows, byteLength: bytesPerRow * rows };
}

/** Owns a snapshot of every supplied mip, never a decoded-image stand-in. */
export class NativeTexture2D extends Texture {
  declare readonly kind: 'native';
  readonly format: NativeTextureFormat;
  readonly levels: readonly NativeTextureMip[];
  readonly byteLength: number;

  constructor(options: NativeTextureOptions) {
    super({ kind: 'native', width: options.width, height: options.height });
    nativeTextureLayout(options.format, options.width, options.height);
    if (
      !Array.isArray(options.levels) ||
      options.levels.length < 1 ||
      options.levels.length >
        Math.floor(Math.log2(Math.max(options.width, options.height))) + 1
    )
      throw new AssetError(
        'Native texture requires a nonempty, bounded mip chain.',
      );
    let bytes = 0;
    for (let i = 0; i < options.levels.length; i++) {
      const level = options.levels[i]!;
      const width = Math.max(1, Math.floor(options.width / 2 ** i));
      const height = Math.max(1, Math.floor(options.height / 2 ** i));
      const layout = nativeTextureLayout(options.format, width, height);
      if (
        !level ||
        level.width !== width ||
        level.height !== height ||
        !(level.data instanceof Uint8Array) ||
        level.data.byteLength !== layout.byteLength
      )
        throw new AssetError(
          `Native texture mip ${i} does not match its exact block layout.`,
        );
      bytes += layout.byteLength;
    }
    if (bytes > assetLimits.nativeTextureBytes)
      throw new AssetError('Native texture exceeds its byte resource budget.');
    this.format = options.format;
    this.byteLength = bytes;
    this.levels = Object.freeze(
      options.levels.map((level) =>
        Object.freeze({
          width: level.width,
          height: level.height,
          data: level.data.slice(),
        }),
      ),
    );
  }
}
