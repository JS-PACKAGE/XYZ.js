import { XYZError } from '../../graphics/src/errors.js';
import type { LoadTask } from './preload/preload-batch.js';
export { PreloadBatch } from './preload/preload-batch.js';
export type { LoadTask, PreloadProgress, PreloadState, } from './preload/preload-batch.js';
export interface ResourceLoadOptions {
    signal?: AbortSignal;
    maxBytes?: number;
}
export declare class AssetError extends XYZError {
}
/** Owns its decoded bitmap; destroying a Sprite does not destroy its Texture. */
export declare class Texture {
    readonly image: ImageBitmap;
    readonly width: number;
    readonly height: number;
    private disposed;
    constructor(image: ImageBitmap);
    /** Decode into a separately owned bitmap with straight (not premultiplied) alpha. */
    static fromImage(source: ImageBitmapSource): Promise<Texture>;
    get destroyed(): boolean;
    destroy(): void;
}
/** One decoded CPU bitmap and one in-flight request per canonical URL. */
export declare class AssetLoader {
    private readonly baseURL?;
    private readonly cache;
    private disposed;
    private readonly requests;
    constructor(baseURL?: string | undefined);
    /** Subscriber cancellation leaves the loader-owned shared request/cache intact. */
    loadTexture(url: string, options?: {
        signal?: AbortSignal;
    }): Promise<Texture>;
    textureTask(key: string, url: string): LoadTask<Texture>;
    loadBinary(url: string, options?: ResourceLoadOptions): Promise<ArrayBuffer>;
    loadText(url: string, options?: ResourceLoadOptions): Promise<string>;
    loadJSON<T = unknown>(url: string, options?: ResourceLoadOptions): Promise<T>;
    destroy(): void;
    private fetchTexture;
}
