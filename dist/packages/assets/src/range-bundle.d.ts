import { type AssetBundleDescriptor, type AssetBundleLoadOptions, type AssetBundleVariant } from './asset-bundle.js';
export interface AssetBundleArchiveMember {
    readonly path: string;
    readonly offset: number;
    readonly bytes: number;
}
export interface AssetBundleArchive {
    readonly path: string;
    readonly bytes: number;
    readonly members: readonly AssetBundleArchiveMember[];
}
/** Archive offsets address uncompressed bytes in a plain concatenated archive, not ZIP entries. */
export declare function parseAssetBundleArchive(value: unknown, descriptor: AssetBundleDescriptor): AssetBundleArchive;
/** One load owns this reader: a 200 response is retained once, bounded by archive.bytes. */
export declare class AssetBundleRangeReader {
    private readonly url;
    private readonly archive;
    private readonly signal?;
    private readonly controller;
    private full;
    private readonly members;
    private readonly abort;
    private destroyed;
    constructor(url: string, archive: AssetBundleArchive, signal?: AbortSignal | undefined);
    read(path: string): Promise<ArrayBuffer>;
    private readFull;
    destroy(): void;
}
/** Marks configurations loaded through loadAssetBundleRange; keeps the published loadAssetBundle declaration unchanged. */
export declare const rangeBundleConfigurations: WeakSet<object>;
/** Load verified individual files from a manifest's plain byte-offset archive. */
export declare function loadAssetBundleRange<A extends {
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
