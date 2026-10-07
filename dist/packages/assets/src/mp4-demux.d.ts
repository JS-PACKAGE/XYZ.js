export interface MP4DemuxOptions {
    /** Optional stricter budgets; cannot exceed engine limits. */
    maxBytes?: number;
    maxSamples?: number;
    maxTracks?: number;
    maxDepth?: number;
}
export interface MP4DemuxResult {
    config: VideoDecoderConfig;
    chunks: EncodedVideoChunk[];
}
/** Input remains caller-owned; config and WebCodecs chunks own independent copies. */
export declare function demuxMP4(bytes: Uint8Array, options?: MP4DemuxOptions): MP4DemuxResult;
