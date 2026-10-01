import { describe, expect, it } from 'vitest';
import { decodeMeshopt } from '../packages/core/src/meshopt.js';
import vectors from './fixtures/meshopt-vectors.js';

interface Vector {
  name: string;
  mode: string;
  filter: string;
  count: number;
  stride: number;
  compressed: string;
  expected: string;
}
const fixture: { vectors: readonly Vector[] } = vectors;
const bytes = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
const find = (name: string): Vector =>
  fixture.vectors.find((v) => v.name === name)!;
const decode = (
  vector: Vector,
  source = bytes(vector.compressed),
): Uint8Array => {
  const out = new Uint8Array(vector.count * vector.stride);
  decodeMeshopt(
    out,
    vector.count,
    vector.stride,
    source,
    vector.mode,
    vector.filter,
  );
  return out;
};

describe('EXT_meshopt_compression decoder against meshoptimizer-encoded vectors', () => {
  for (const vector of fixture.vectors.filter((v) => v.filter !== 'QUATERNION'))
    it(`decodes ${vector.name} exactly`, () => {
      expect(Array.from(decode(vector))).toEqual(
        Array.from(bytes(vector.expected)),
      );
    });

  it('decodes the quaternion filter within one least-significant step of the float32 reference', () => {
    const vector = find('filter-quaternion');
    const actual = new Int16Array(decode(vector).buffer);
    const expected = new Int16Array(bytes(vector.expected).buffer.slice(0));
    const worst = Math.max(
      ...Array.from(actual, (v, i) => Math.abs(v - expected[i]!)),
    );
    expect(actual.length).toBe(vector.count * 4);
    expect(worst).toBeLessThanOrEqual(1);
  });

  it('rejects malformed streams without writing beyond the target', () => {
    const vertex = find('vertex-v1-two-blocks');
    const source = bytes(vertex.compressed);
    expect(() =>
      decode(vertex, source.subarray(0, source.length - 1)),
    ).toThrow();
    expect(() => decode(vertex, source.subarray(0, 40))).toThrow();
    const bad = source.slice();
    bad[0] = 0x00;
    expect(() => decode(vertex, bad)).toThrow();
    const triangles = find('triangles-16');
    const compressed = bytes(triangles.compressed);
    expect(() =>
      decode(triangles, compressed.subarray(0, compressed.length - 2)),
    ).toThrow();
    const extra = new Uint8Array(compressed.length + 1);
    extra.set(compressed);
    expect(() => decode(triangles, extra)).toThrow();
    expect(() =>
      decodeMeshopt(new Uint8Array(4), 1, 4, compressed, 'ATTRIBUTES', 'BOGUS'),
    ).toThrow();
    expect(() =>
      decodeMeshopt(new Uint8Array(6), 1, 6, compressed, 'TRIANGLES'),
    ).toThrow();
  });
});
