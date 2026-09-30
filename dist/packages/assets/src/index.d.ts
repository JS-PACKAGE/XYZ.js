import { XYZError } from '../../graphics/src/errors.js';
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
    constructor(baseURL?: string | undefined);
    loadTexture(url: string): Promise<Texture>;
    destroy(): void;
    private fetchTexture;
}
