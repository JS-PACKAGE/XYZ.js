/** Compressed-buffer layout of EXT_meshopt_compression `mode`. */
export type MeshoptMode = 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';
/** EXT_meshopt_compression `filter`; COLOR is the newest addition of the extension. */
export type MeshoptFilter = 'NONE' | 'OCTAHEDRAL' | 'QUATERNION' | 'EXPONENTIAL' | 'COLOR';
/**
 * Decodes one EXT_meshopt_compression buffer view into `target` (exactly `count * stride` bytes).
 * This is a from-scratch implementation of the meshoptimizer vertex (versions 0 and 1), triangle
 * and index-sequence codecs plus the octahedral, quaternion, exponential and color filters. Every
 * read is bounds-checked against the compressed input and nothing is allocated proportionally to
 * it, so a malicious stream can only fail, not allocate.
 */
export declare function decodeMeshopt(target: Uint8Array, count: number, stride: number, source: Uint8Array, mode: unknown, filter?: unknown): void;
