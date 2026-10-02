import { Texture } from './texture.js';
export { AssetError, Texture } from './texture.js';
export { NativeTexture2D } from './native-texture.js';
export type { NativeTextureFormat, NativeTextureMip, NativeTextureOptions, } from './native-texture.js';
import type { LoadTask } from './preload/preload-batch.js';
export { PreloadBatch } from './preload/preload-batch.js';
export type { LoadTask, PreloadProgress, PreloadState, } from './preload/preload-batch.js';
export { CanvasTexture2D, TextureView2D } from './texture2d.js';
export type { Texture2DSource, TextureView2DOptions, TextureBorders2D, TextureRect2D, } from './texture2d.js';
export { FontAsset } from './fonts/font-asset.js';
export type { FontAssetOptions } from './fonts/font-asset.js';
export { BitmapFontAsset, BitmapFontLoader } from './fonts/bitmap-font.js';
export type { BitmapGlyph, BitmapKerning, BitmapFontData, } from './fonts/bitmap-font.js';
export { generateBitmapFont } from './fonts/generate-bitmap-font.js';
export type { DynamicBitmapFontOptions } from './fonts/generate-bitmap-font.js';
export { AssetManifest } from './manifest/asset-manifest.js';
export type { ManifestAssetType, ManifestEntry, AssetManifestOptions, ManifestAssetTypes, } from './manifest/asset-manifest.js';
export { loadAssetBundle, parseAssetBundle, selectAssetBundleVariant, } from './asset-bundle.js';
export type { AssetBundleDescriptor, AssetBundleFile, AssetBundleVariant, AssetBundleCapabilities, AssetBundleLoadOptions, } from './asset-bundle.js';
export interface ResourceLoadOptions {
    signal?: AbortSignal;
    maxBytes?: number;
}
export interface AssetLoaderOptions {
    /** RGBA decoded bitmap estimate; does not bound decoder transient memory. */
    decodedTextureBytes?: number;
}
export interface DecodedTextureResidency {
    readonly budgetBytes: number;
    readonly liveBytes: number;
    readonly peakBytes: number;
    readonly entries: number;
    readonly borrowers: number;
    readonly evictions: number;
}
/** A borrower must remove its consumers before releasing this lease. */
export declare class TextureLease {
    readonly texture: Texture;
    private readonly relinquish;
    private disposed;
    constructor(texture: Texture, relinquish: () => void);
    get released(): boolean;
    release(): void;
}
/** One decoded CPU bitmap and one in-flight request per canonical URL. */
export declare class AssetLoader {
    private readonly baseURL?;
    private readonly cache;
    private disposed;
    private readonly requests;
    private readonly decodedBudget;
    private decodedBytes;
    private decodedPeak;
    private evictions;
    private clock;
    constructor(baseURL?: string | undefined, options?: AssetLoaderOptions);
    get residency(): DecodedTextureResidency;
    /** Shared legacy borrowers are pinned until explicit unload/destroy, even after subscriber abort. */
    loadTexture(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<Texture>;
    acquireTexture(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<TextureLease>;
    /** Explicitly ends legacy borrowing; outstanding leases must be released first. */
    unloadTexture(url: string): void;
    private textureURL;
    private removeTexture;
    private textureEntry;
    textureTask(key: string, url: string): LoadTask<Texture>;
    /** Acquires a unique caller-owned image, never a borrowed cache entry. */
    loadTextureOwned(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<Texture>;
    loadBinary(url: string, options?: ResourceLoadOptions): Promise<ArrayBuffer>;
    loadText(url: string, options?: ResourceLoadOptions): Promise<string>;
    loadJSON<T = unknown>(url: string, options?: ResourceLoadOptions): Promise<T>;
    destroy(): void;
    private fetchTexture;
}
