import { Texture } from './texture.js';
export declare const nativeTextureFormats: {
    readonly rgba8unorm: readonly [1, 1, 4, 37, 32856, ""];
    readonly 'rgba8unorm-srgb': readonly [1, 1, 4, 43, 35907, ""];
    readonly 'bc1-rgba-unorm': readonly [4, 4, 8, 133, 33777, "texture-compression-bc"];
    readonly 'bc1-rgba-unorm-srgb': readonly [4, 4, 8, 134, 35917, "texture-compression-bc"];
    readonly 'bc2-rgba-unorm': readonly [4, 4, 16, 135, 33778, "texture-compression-bc"];
    readonly 'bc2-rgba-unorm-srgb': readonly [4, 4, 16, 136, 35918, "texture-compression-bc"];
    readonly 'bc3-rgba-unorm': readonly [4, 4, 16, 137, 33779, "texture-compression-bc"];
    readonly 'bc3-rgba-unorm-srgb': readonly [4, 4, 16, 138, 35919, "texture-compression-bc"];
    readonly 'bc4-r-unorm': readonly [4, 4, 8, 139, 36283, "texture-compression-bc"];
    readonly 'bc4-r-snorm': readonly [4, 4, 8, 140, 36284, "texture-compression-bc"];
    readonly 'bc5-rg-unorm': readonly [4, 4, 16, 141, 36285, "texture-compression-bc"];
    readonly 'bc5-rg-snorm': readonly [4, 4, 16, 142, 36286, "texture-compression-bc"];
    readonly 'bc6h-rgb-ufloat': readonly [4, 4, 16, 143, 36495, "texture-compression-bc"];
    readonly 'bc6h-rgb-float': readonly [4, 4, 16, 144, 36494, "texture-compression-bc"];
    readonly 'bc7-rgba-unorm': readonly [4, 4, 16, 145, 36492, "texture-compression-bc"];
    readonly 'bc7-rgba-unorm-srgb': readonly [4, 4, 16, 146, 36493, "texture-compression-bc"];
    readonly 'etc2-rgb8unorm': readonly [4, 4, 8, 147, 37492, "texture-compression-etc2"];
    readonly 'etc2-rgb8unorm-srgb': readonly [4, 4, 8, 148, 37493, "texture-compression-etc2"];
    readonly 'etc2-rgb8a1unorm': readonly [4, 4, 8, 149, 37494, "texture-compression-etc2"];
    readonly 'etc2-rgb8a1unorm-srgb': readonly [4, 4, 8, 150, 37495, "texture-compression-etc2"];
    readonly 'etc2-rgba8unorm': readonly [4, 4, 16, 151, 37496, "texture-compression-etc2"];
    readonly 'etc2-rgba8unorm-srgb': readonly [4, 4, 16, 152, 37497, "texture-compression-etc2"];
    readonly 'eac-r11unorm': readonly [4, 4, 8, 153, 37488, "texture-compression-etc2"];
    readonly 'eac-r11snorm': readonly [4, 4, 8, 154, 37489, "texture-compression-etc2"];
    readonly 'eac-rg11unorm': readonly [4, 4, 16, 155, 37490, "texture-compression-etc2"];
    readonly 'eac-rg11snorm': readonly [4, 4, 16, 156, 37491, "texture-compression-etc2"];
    readonly 'astc-4x4-unorm': readonly [4, 4, 16, 157, 37808, "texture-compression-astc"];
    readonly 'astc-4x4-unorm-srgb': readonly [4, 4, 16, 158, 37840, "texture-compression-astc"];
    readonly 'astc-5x4-unorm': readonly [5, 4, 16, 159, 37809, "texture-compression-astc"];
    readonly 'astc-5x4-unorm-srgb': readonly [5, 4, 16, 160, 37841, "texture-compression-astc"];
    readonly 'astc-5x5-unorm': readonly [5, 5, 16, 161, 37810, "texture-compression-astc"];
    readonly 'astc-5x5-unorm-srgb': readonly [5, 5, 16, 162, 37842, "texture-compression-astc"];
    readonly 'astc-6x5-unorm': readonly [6, 5, 16, 163, 37811, "texture-compression-astc"];
    readonly 'astc-6x5-unorm-srgb': readonly [6, 5, 16, 164, 37843, "texture-compression-astc"];
    readonly 'astc-6x6-unorm': readonly [6, 6, 16, 165, 37812, "texture-compression-astc"];
    readonly 'astc-6x6-unorm-srgb': readonly [6, 6, 16, 166, 37844, "texture-compression-astc"];
    readonly 'astc-8x5-unorm': readonly [8, 5, 16, 167, 37813, "texture-compression-astc"];
    readonly 'astc-8x5-unorm-srgb': readonly [8, 5, 16, 168, 37845, "texture-compression-astc"];
    readonly 'astc-8x6-unorm': readonly [8, 6, 16, 169, 37814, "texture-compression-astc"];
    readonly 'astc-8x6-unorm-srgb': readonly [8, 6, 16, 170, 37846, "texture-compression-astc"];
    readonly 'astc-8x8-unorm': readonly [8, 8, 16, 171, 37815, "texture-compression-astc"];
    readonly 'astc-8x8-unorm-srgb': readonly [8, 8, 16, 172, 37847, "texture-compression-astc"];
    readonly 'astc-10x5-unorm': readonly [10, 5, 16, 173, 37816, "texture-compression-astc"];
    readonly 'astc-10x5-unorm-srgb': readonly [10, 5, 16, 174, 37848, "texture-compression-astc"];
    readonly 'astc-10x6-unorm': readonly [10, 6, 16, 175, 37817, "texture-compression-astc"];
    readonly 'astc-10x6-unorm-srgb': readonly [10, 6, 16, 176, 37849, "texture-compression-astc"];
    readonly 'astc-10x8-unorm': readonly [10, 8, 16, 177, 37818, "texture-compression-astc"];
    readonly 'astc-10x8-unorm-srgb': readonly [10, 8, 16, 178, 37850, "texture-compression-astc"];
    readonly 'astc-10x10-unorm': readonly [10, 10, 16, 179, 37819, "texture-compression-astc"];
    readonly 'astc-10x10-unorm-srgb': readonly [10, 10, 16, 180, 37851, "texture-compression-astc"];
    readonly 'astc-12x10-unorm': readonly [12, 10, 16, 181, 37820, "texture-compression-astc"];
    readonly 'astc-12x10-unorm-srgb': readonly [12, 10, 16, 182, 37852, "texture-compression-astc"];
    readonly 'astc-12x12-unorm': readonly [12, 12, 16, 183, 37821, "texture-compression-astc"];
    readonly 'astc-12x12-unorm-srgb': readonly [12, 12, 16, 184, 37853, "texture-compression-astc"];
};
export type NativeTextureFormat = 'rgba8unorm' | 'rgba8unorm-srgb' | 'bc1-rgba-unorm' | 'bc1-rgba-unorm-srgb' | 'bc2-rgba-unorm' | 'bc2-rgba-unorm-srgb' | 'bc3-rgba-unorm' | 'bc3-rgba-unorm-srgb' | 'bc4-r-unorm' | 'bc4-r-snorm' | 'bc5-rg-unorm' | 'bc5-rg-snorm' | 'bc6h-rgb-ufloat' | 'bc6h-rgb-float' | 'bc7-rgba-unorm' | 'bc7-rgba-unorm-srgb' | 'etc2-rgb8unorm' | 'etc2-rgb8unorm-srgb' | 'etc2-rgb8a1unorm' | 'etc2-rgb8a1unorm-srgb' | 'etc2-rgba8unorm' | 'etc2-rgba8unorm-srgb' | 'eac-r11unorm' | 'eac-r11snorm' | 'eac-rg11unorm' | 'eac-rg11snorm' | 'astc-4x4-unorm' | 'astc-4x4-unorm-srgb' | 'astc-5x4-unorm' | 'astc-5x4-unorm-srgb' | 'astc-5x5-unorm' | 'astc-5x5-unorm-srgb' | 'astc-6x5-unorm' | 'astc-6x5-unorm-srgb' | 'astc-6x6-unorm' | 'astc-6x6-unorm-srgb' | 'astc-8x5-unorm' | 'astc-8x5-unorm-srgb' | 'astc-8x6-unorm' | 'astc-8x6-unorm-srgb' | 'astc-8x8-unorm' | 'astc-8x8-unorm-srgb' | 'astc-10x5-unorm' | 'astc-10x5-unorm-srgb' | 'astc-10x6-unorm' | 'astc-10x6-unorm-srgb' | 'astc-10x8-unorm' | 'astc-10x8-unorm-srgb' | 'astc-10x10-unorm' | 'astc-10x10-unorm-srgb' | 'astc-12x10-unorm' | 'astc-12x10-unorm-srgb' | 'astc-12x12-unorm' | 'astc-12x12-unorm-srgb';
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
export declare function nativeTextureLayout(format: NativeTextureFormat, width: number, height: number): {
    bytesPerRow: number;
    rows: number;
    byteLength: number;
};
/** Owns a snapshot of every supplied mip, never a decoded-image stand-in. */
export declare class NativeTexture2D extends Texture {
    readonly kind: 'native';
    readonly format: NativeTextureFormat;
    readonly levels: readonly NativeTextureMip[];
    readonly byteLength: number;
    constructor(options: NativeTextureOptions);
}
