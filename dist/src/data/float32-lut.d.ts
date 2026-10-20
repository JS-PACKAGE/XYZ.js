/**
 * Decodes a generated lookup table stored as base64 little-endian IEEE float32 bytes.
 * Exact by construction and far smaller to ship than nine-digit decimal literals.
 */
export declare function decodeFloat32LUT(base64: string): Float32Array;
