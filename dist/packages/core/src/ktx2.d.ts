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
export type KTX2Transcoder = (container: KTX2Container) => KTX2Image | Promise<KTX2Image>;
export interface KTX2Image {
    readonly width: number;
    readonly height: number;
    /** `width * height * 4` bytes, RGBA, top row first. */
    readonly data: Uint8Array | Uint8ClampedArray;
}
/** Cheap signature test used to route image bytes before parsing. */
export declare function isKTX2(bytes: Uint8Array): boolean;
/** Validates the header, level index and every byte range; throws AssetError on any violation. */
export declare function parseKTX2(bytes: Uint8Array): KTX2Container;
/**
 * Produces RGBA8 pixels of the base level. Uncompressed 8-bit RGB/RGBA (with no or ZLIB
 * supercompression) is decoded here; everything else (BasisLZ, UASTC, ETC1S, block-compressed GPU
 * formats, Zstandard) needs `transcoder`. Only plain 2D textures are accepted: no arrays, cube
 * maps or 3D, and mip levels beyond the base are ignored.
 */
export declare function decodeKTX2(bytes: Uint8Array, transcoder?: KTX2Transcoder, signal?: AbortSignal): Promise<KTX2Image>;
