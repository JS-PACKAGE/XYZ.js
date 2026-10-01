import type { LoadTask } from '../../assets/src/index.js';
import { Vector3 } from '../../math/src/index.js';
import { AnimationClip } from './animation.js';
import { PointLight, SpotLight } from './lights.js';
import { Group } from './group.js';
import type { KTX2Transcoder, KTX2NativeTranscoder } from './ktx2.js';
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
    /** Preserve GPU payloads and all mips instead of decoding KTX2 images to bitmaps. */
    nativeTextures?: boolean;
    ktx2NativeTranscoder?: KTX2NativeTranscoder;
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
export type DracoDecoder = (request: DracoDecodeRequest) => DracoDecodeResult | Promise<DracoDecodeResult>;
/** Dependency-free glTF 2.0 triangle/TRS/skin loader. Unsupported required extensions are rejected. */
export declare class GLTFLoader {
    /** Task results are unique: abort disposes only this acquisition, never a shared asset. */
    task(key: string, uri: string): LoadTask<GLTFAsset>;
    load(uri: string, options?: GLTFLoadOptions): Promise<GLTFAsset>;
    parse(input: ArrayBuffer | string, baseURL?: string, options?: GLTFLoadOptions): Promise<GLTFAsset>;
    /** Bakes KHR_lights_punctual definitions at each referencing node's world transform. */
    private readLights;
    private normals;
    private applyMatrix;
}
