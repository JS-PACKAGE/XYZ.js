/**
 * Decodes a generated lookup table stored as base64 little-endian IEEE float32 bytes.
 * Exact by construction and far smaller to ship than nine-digit decimal literals.
 */
export function decodeFloat32LUT(base64: string): Float32Array {
  const bytes = atob(base64);
  const view = new DataView(new ArrayBuffer(bytes.length));
  for (let i = 0; i < bytes.length; i++) view.setUint8(i, bytes.charCodeAt(i));
  const values = new Float32Array(bytes.length / 4);
  for (let i = 0; i < values.length; i++)
    values[i] = view.getFloat32(i * 4, true);
  return values;
}
