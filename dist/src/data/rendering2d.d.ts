/** Per-resource bounds, not a browser-wide memory guarantee. */
export declare const rendering2dLimits: Readonly<{
    targetDimension: 8192;
    targetPixels: number;
    layerDepth: 32;
    commands: 65536;
    /** Distinct (space, summed z) keys ordered by counting sort before a comparison sort. */
    sortBuckets: 16;
    pathCommands: 16384;
    coordinate: 1000000;
    meshVertices: 1000000;
    meshIndices: 3000000;
    particleCapacity: 65536;
    atlasPages: 64;
    atlasFrames: 16384;
    fontGlyphs: 4096;
    fontPages: 64;
    fontBytes: number;
    manifestEntries: 4096;
    manifestBundles: 256;
    filterRadius: 128;
    filterQuality: 8;
    resolution: 8;
    /** Canvas2D painted sub-frame/tint snapshots kept for redraw, least recently used out. */
    canvasFrameSnapshots: 256;
    /** Their combined pixels (4 bytes each); a larger single frame repaints a scratch.
     * Also bounds the source pixels read back once per version for tinted copies. */
    canvasFrameSnapshotPixels: number;
    /** WebGPU draws with at least this many quad slots upload instances through a mapped
     * staging buffer; below it `queue.writeBuffer` is as cheap. */
    stagedUploadQuads: 64;
    /** Mapped staging buffers WebGPU 2D keeps in flight; with none mapped it writes directly. */
    uploadStagingBuffers: 3;
}>;
