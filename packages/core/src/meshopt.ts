import { AssetError } from '../../assets/src/index.js';

/** Compressed-buffer layout of EXT_meshopt_compression `mode`. */
export type MeshoptMode = 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';
/** EXT_meshopt_compression `filter`; COLOR is the newest addition of the extension. */
export type MeshoptFilter =
  'NONE' | 'OCTAHEDRAL' | 'QUATERNION' | 'EXPONENTIAL' | 'COLOR';

const filters: readonly string[] = [
  'NONE',
  'OCTAHEDRAL',
  'QUATERNION',
  'EXPONENTIAL',
  'COLOR',
];

function check(condition: boolean): asserts condition {
  if (!condition)
    throw new AssetError(
      'Invalid EXT_meshopt_compression bitstream or layout.',
    );
}
const unzigzag = (value: number): number => (value >>> 1) ^ -(value & 1);

/**
 * Decodes one EXT_meshopt_compression buffer view into `target` (exactly `count * stride` bytes).
 * This is a from-scratch implementation of the meshoptimizer vertex (versions 0 and 1), triangle
 * and index-sequence codecs plus the octahedral, quaternion, exponential and color filters. Every
 * read is bounds-checked against the compressed input and nothing is allocated proportionally to
 * it, so a malicious stream can only fail, not allocate.
 */
export function decodeMeshopt(
  target: Uint8Array,
  count: number,
  stride: number,
  source: Uint8Array,
  mode: unknown,
  filter: unknown = 'NONE',
): void {
  check(Number.isInteger(count) && count > 0);
  check(Number.isInteger(stride) && target.length === count * stride);
  check(typeof filter === 'string' && filters.includes(filter));
  if (mode === 'ATTRIBUTES') {
    check(stride >= 4 && stride <= 256 && stride % 4 === 0);
    decodeVertices(target, count, stride, source);
    applyFilter(target, count, stride, filter as MeshoptFilter);
    return;
  }
  check(filter === 'NONE' && (stride === 2 || stride === 4));
  if (mode === 'TRIANGLES') decodeTriangles(target, count, stride, source);
  else if (mode === 'INDICES') decodeSequence(target, count, stride, source);
  else check(false);
}

/** Forward-only cursor over `bytes[offset..end)`; `take` reserves a span and returns its start. */
class Cursor {
  constructor(
    readonly bytes: Uint8Array,
    public offset: number,
    readonly end: number,
  ) {}
  take(length: number): number {
    const start = this.offset;
    check(length >= 0 && start + length <= this.end);
    this.offset = start + length;
    return start;
  }
  byte(): number {
    return this.bytes[this.take(1)];
  }
  /** LEB128 limited to 32 bits. */
  varint(): number {
    let value = 0;
    for (let shift = 0; shift <= 28; shift += 7) {
      const byte = this.byte();
      check(shift !== 28 || byte < 16);
      value |= (byte & 127) << shift;
      if (byte < 128) return value >>> 0;
    }
    return (check(false), 0);
  }
}

/** Bits per delta for each 2-bit group header, indexed by codec version and control mode. */
const deltaBits = [
  [0, 2, 4, 8],
  [0, 1, 2, 4],
  [1, 2, 4, 8],
] as const;

function decodeVertices(
  out: Uint8Array,
  count: number,
  stride: number,
  input: Uint8Array,
): void {
  check(input.length > 0 && (input[0] === 0xa0 || input[0] === 0xa1));
  const version = input[0] & 15;
  const tail = version === 0 ? stride : stride + stride / 4;
  const padded = Math.max(tail, version === 0 ? 32 : 24);
  check(input.length >= 1 + padded);
  const tailStart = input.length - tail;
  const body = new Cursor(input, 1, input.length - padded);
  // The previous element is carried per byte lane in `previous` across blocks.
  const previous = input.slice(tailStart, tailStart + stride);
  const channels =
    version === 0 ? undefined : input.subarray(tailStart + stride);
  const blockSize = Math.min((0x2000 / stride) & ~15, 256);
  check(blockSize > 0);
  const deltas = new Uint8Array(blockSize * stride);

  for (let first = 0; first < count; first += blockSize) {
    const length = Math.min(blockSize, count - first);
    const groups = (length + 15) >>> 4;
    const headerBytes = (groups + 3) >>> 2;
    const controls = version === 0 ? 0 : body.take(stride / 4);
    deltas.fill(0);

    for (let byte = 0; byte < stride; byte++) {
      const base = byte * length;
      const control =
        version === 0
          ? 0
          : (input[controls + (byte >>> 2)] >>> ((byte & 3) << 1)) & 3;
      if (control === 2) continue;
      if (control === 3) {
        deltas.set(input.subarray(body.take(length), body.offset), base);
        continue;
      }
      const headers = body.take(headerBytes);
      const table = deltaBits[version === 0 ? 0 : control + 1];
      for (let group = 0; group < groups; group++) {
        const bits =
          table[(input[headers + (group >>> 2)] >>> ((group & 3) << 1)) & 3];
        const at = base + (group << 4);
        if (bits === 0) continue;
        if (bits === 8) {
          // Out-of-range lanes of a final partial group are dropped by the slice below.
          const start = body.take(16);
          for (let lane = 0; lane < 16 && (group << 4) + lane < length; lane++)
            deltas[at + lane] = input[start + lane];
          continue;
        }
        const packed = body.take(bits * 2);
        const sentinel = (1 << bits) - 1;
        for (let lane = 0; lane < 16; lane++) {
          const bit = lane * bits;
          // 1-bit fields are packed from the least significant bit, wider ones from the top.
          const shift = bits === 1 ? bit & 7 : 8 - bits - (bit & 7);
          let value = (input[packed + (bit >>> 3)] >>> shift) & sentinel;
          if (value === sentinel) value = body.byte();
          if ((group << 4) + lane < length) deltas[at + lane] = value;
        }
      }
    }

    for (let element = 0; element < length; element++) {
      const row = (first + element) * stride;
      for (let lane = 0; lane < stride; lane += 4) {
        const channel = channels ? channels[lane >>> 2] : 0;
        const kind = channel & 3;
        check(kind !== 3);
        if (kind === 0) {
          for (let byte = lane; byte < lane + 4; byte++) {
            const value =
              (previous[byte] + unzigzag(deltas[byte * length + element])) &
              255;
            out[row + byte] = previous[byte] = value;
          }
        } else if (kind === 1) {
          for (let byte = lane; byte < lane + 4; byte += 2) {
            const delta = unzigzag(
              deltas[byte * length + element] |
                (deltas[(byte + 1) * length + element] << 8),
            );
            const value =
              ((previous[byte] | (previous[byte + 1] << 8)) + delta) & 0xffff;
            out[row + byte] = previous[byte] = value & 255;
            out[row + byte + 1] = previous[byte + 1] = value >>> 8;
          }
        } else {
          let delta = 0;
          let last = 0;
          for (let k = 0; k < 4; k++) {
            delta |= deltas[(lane + k) * length + element] << (k * 8);
            last |= previous[lane + k] << (k * 8);
          }
          const rotate = channel >>> 4;
          const value = last ^ ((delta >>> rotate) | (delta << (32 - rotate)));
          for (let k = 0; k < 4; k++)
            out[row + lane + k] = previous[lane + k] =
              (value >>> (k * 8)) & 255;
        }
      }
    }
  }
  check(body.offset === body.end);
}

function indexWriter(
  target: Uint8Array,
  stride: number,
): (index: number, value: number) => void {
  const view = new DataView(
    target.buffer,
    target.byteOffset,
    target.byteLength,
  );
  return (index, value) => {
    check(value >= 0 && value <= (stride === 2 ? 0xffff : 0xffffffff));
    if (stride === 2) view.setUint16(index * 2, value, true);
    else view.setUint32(index * 4, value, true);
  };
}

function decodeSequence(
  out: Uint8Array,
  count: number,
  stride: number,
  input: Uint8Array,
): void {
  check(input.length >= 5 && input[0] === 0xd1);
  const cursor = new Cursor(input, 1, input.length - 4);
  const last = [0, 0];
  const put = indexWriter(out, stride);
  for (let i = 0; i < count; i++) {
    const code = cursor.varint();
    const lane = code & 1;
    last[lane] = (last[lane] + unzigzag(code >>> 1)) >>> 0;
    put(i, last[lane]);
  }
  check(cursor.offset === cursor.end);
}

function decodeTriangles(
  out: Uint8Array,
  count: number,
  stride: number,
  input: Uint8Array,
): void {
  check(count % 3 === 0 && input.length > 0 && input[0] === 0xe1);
  const triangles = count / 3;
  const auxStart = input.length - 16;
  check(auxStart >= 1 + triangles);
  const data = new Cursor(input, 1 + triangles, auxStart);
  // FIFOs hold the most recent edges (pairs) and vertices; index 0 is the newest entry.
  const edges = new Uint32Array(32);
  const verts = new Uint32Array(16);
  let edgeHead = 0;
  let vertHead = 0;
  let next = 0;
  let last = 0;
  const edge = (n: number): number => edges[(edgeHead - 1 - n) & 31];
  const vertex = (n: number): number => verts[(vertHead - 1 - n) & 15];
  const pushVertex = (v: number): void => {
    verts[vertHead++ & 15] = v;
  };
  const pushEdge = (a: number, b: number): void => {
    edges[edgeHead++ & 31] = a;
    edges[edgeHead++ & 31] = b;
  };
  const explicit = (): number =>
    (last = (last + unzigzag(data.varint())) >>> 0);
  const put = indexWriter(out, stride);

  for (let i = 0; i < triangles; i++) {
    const code = input[1 + i];
    const high = code >>> 4;
    const low = code & 15;
    let a: number;
    let b: number;
    let c: number;
    if (high < 15) {
      a = edge(high * 2);
      b = edge(high * 2 + 1);
      if (low === 0) {
        c = next++;
        pushVertex(c);
      } else if (low < 13) c = vertex(low);
      else if (low === 13) {
        c = last = (last - 1) >>> 0;
        pushVertex(c);
      } else if (low === 14) {
        c = last = (last + 1) >>> 0;
        pushVertex(c);
      } else {
        c = explicit();
        pushVertex(c);
      }
      pushEdge(b, c);
      pushEdge(c, a);
    } else {
      let aux: number;
      if (low < 14) aux = input[auxStart + low];
      else {
        aux = data.byte();
        if (aux === 0) next = 0;
      }
      const z = aux >>> 4;
      const w = aux & 15;
      if (low < 14) {
        a = next++;
        b = z === 0 ? next++ : vertex(z - 1);
        c = w === 0 ? next++ : vertex(w - 1);
        pushVertex(a);
        if (z === 0) pushVertex(b);
        if (w === 0) pushVertex(c);
      } else {
        a = low === 14 ? next++ : explicit();
        b = z === 0 ? next++ : z === 15 ? explicit() : vertex(z - 1);
        c = w === 0 ? next++ : w === 15 ? explicit() : vertex(w - 1);
        pushVertex(a);
        if (z === 0 || z === 15) pushVertex(b);
        if (w === 0 || w === 15) pushVertex(c);
      }
      pushEdge(a, b);
      pushEdge(b, c);
      pushEdge(c, a);
    }
    put(i * 3, a);
    put(i * 3 + 1, b);
    put(i * 3 + 2, c);
  }
  check(data.offset === data.end);
}

function applyFilter(
  bytes: Uint8Array,
  count: number,
  stride: number,
  filter: MeshoptFilter,
): void {
  if (filter === 'NONE') return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (filter === 'EXPONENTIAL') {
    for (let offset = 0; offset < bytes.length; offset += 4) {
      const value = view.getInt32(offset, true);
      view.setFloat32(offset, ((value << 8) >> 8) * 2 ** (value >> 24), true);
    }
    return;
  }
  check(filter === 'QUATERNION' ? stride === 8 : stride === 4 || stride === 8);
  const wide = stride === 8;
  const max = wide ? 32767 : 127;
  const width = wide ? 2 : 1;
  const get = (offset: number): number =>
    wide ? view.getInt16(offset, true) : view.getInt8(offset);
  const getUnsigned = (offset: number): number =>
    wide ? view.getUint16(offset, true) : view.getUint8(offset);
  const put = (offset: number, value: number): void => {
    if (wide) view.setInt16(offset, Math.round(value), true);
    else view.setInt8(offset, Math.round(value));
  };
  const putUnsigned = (offset: number, value: number): void => {
    if (wide) view.setUint16(offset, Math.round(value), true);
    else view.setUint8(offset, Math.round(value));
  };
  for (let element = 0; element < count; element++) {
    const o = element * stride;
    if (filter === 'OCTAHEDRAL') {
      const one = get(o + 2 * width);
      check(one !== 0);
      let x = get(o) / one;
      let y = get(o + width) / one;
      const z = 1 - Math.abs(x) - Math.abs(y);
      const fold = Math.max(-z, 0);
      x -= x >= 0 ? fold : -fold;
      y -= y >= 0 ? fold : -fold;
      const scale = max / Math.hypot(x, y, z);
      put(o, x * scale);
      put(o + width, y * scale);
      put(o + 2 * width, z * scale);
    } else if (filter === 'QUATERNION') {
      const code = view.getInt16(o + 6, true);
      const largest = code & 3;
      const scale = Math.SQRT1_2 / (code | 3);
      const x = view.getInt16(o, true) * scale;
      const y = view.getInt16(o + 2, true) * scale;
      const z = view.getInt16(o + 4, true) * scale;
      const w = Math.sqrt(Math.max(0, 1 - x * x - y * y - z * z));
      view.setInt16(o + ((largest + 1) & 3) * 2, Math.round(x * 32767), true);
      view.setInt16(o + ((largest + 2) & 3) * 2, Math.round(y * 32767), true);
      view.setInt16(o + ((largest + 3) & 3) * 2, Math.round(z * 32767), true);
      view.setInt16(o + largest * 2, Math.round(w * 32767), true);
    } else {
      // COLOR: YCoCg with a variable-width alpha; the top set bit of alpha fixes the scale.
      const full = (1 << (stride * 2)) - 1;
      const luma = getUnsigned(o);
      const co = get(o + width);
      const cg = get(o + 2 * width);
      const alphaCode = getUnsigned(o + 3 * width);
      check(alphaCode > 0);
      const alphaMax = (1 << (32 - Math.clz32(alphaCode))) - 1;
      let alpha = alphaCode & (alphaMax >>> 1);
      alpha = (alpha << 1) | (alpha & 1);
      const factor = full / alphaMax;
      putUnsigned(o, (luma + co - cg) * factor);
      putUnsigned(o + width, (luma + cg) * factor);
      putUnsigned(o + 2 * width, (luma - co - cg) * factor);
      putUnsigned(o + 3 * width, alpha * factor);
    }
  }
}
