import { XYZError } from '../../graphics/src/errors.js';
export declare class AssetError extends XYZError {
}
/** Owns its decoded bitmap; destroying a Sprite does not destroy its Texture. */
export declare class Texture {
    readonly kind: 'image' | 'native';
    readonly version = 0;
    readonly width: number;
    readonly height: number;
    private disposed;
    private readonly bitmap;
    constructor(image: ImageBitmap | {
        readonly kind: 'native';
        readonly width: number;
        readonly height: number;
    });
    get image(): ImageBitmap;
    /** Decode owned, straight-alpha texels without implementation-specific color conversion. */
    static fromImage(source: ImageBitmapSource): Promise<Texture>;
    get destroyed(): boolean;
    destroy(): void;
}
