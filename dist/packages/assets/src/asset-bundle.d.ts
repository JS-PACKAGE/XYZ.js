import type { NativeTextureFormat } from './native-texture.js';
export interface AssetBundleFile {
    readonly path: string;
    readonly bytes: number;
    readonly sha256: string;
}
export interface AssetBundleVariant {
    readonly path: string;
    readonly nativeTextures: boolean;
    readonly formats: readonly NativeTextureFormat[];
    readonly codec: 'none' | 'draco';
}
export interface AssetBundleDescriptor {
    readonly version: 2;
    readonly profile: string;
    readonly files: readonly AssetBundleFile[];
    readonly variants: readonly AssetBundleVariant[];
    readonly textures: readonly {
        readonly width: number;
        readonly height: number;
    }[];
}
export interface AssetBundleCapabilities {
    readonly backend: 'webgpu' | 'webgl2' | 'canvas2d';
    readonly capabilities: {
        readonly threeD: boolean;
        readonly maxTextureSize: number;
        readonly supportedTextureFormats: readonly NativeTextureFormat[];
    };
}
export interface AssetBundleLoadOptions<O> {
    readonly renderer: AssetBundleCapabilities;
    readonly loader: {
        parse(input: string, baseURL?: string, options?: O): Promise<{
            dispose(): void;
        }>;
    };
    readonly options?: O & {
        readonly dracoDecoder?: unknown;
        readonly signal?: AbortSignal;
        readonly nativeTextures?: boolean;
    };
    /** Optional trusted manifest pin. Descriptor hashes are integrity checks, not signatures. */
    readonly manifestSHA256?: string;
}
export declare function parseAssetBundle(value: unknown): AssetBundleDescriptor;
export declare function selectAssetBundleVariant(descriptor: AssetBundleDescriptor, renderer: AssetBundleCapabilities, codecs?: {
    readonly draco?: boolean;
}): AssetBundleVariant;
/** Verified byte snapshots feed the existing loader; its returned asset retains normal ownership. */
export declare function loadAssetBundle<A extends {
    dispose(): void;
}, O extends {
    signal?: AbortSignal;
    dracoDecoder?: unknown;
    nativeTextures?: boolean;
}>(uri: string, configuration: Omit<AssetBundleLoadOptions<O>, 'loader'> & {
    readonly loader: {
        parse(input: string, baseURL?: string, options?: O): Promise<A>;
    };
}): Promise<A & {
    readonly bundleVariant: AssetBundleVariant;
}>;
