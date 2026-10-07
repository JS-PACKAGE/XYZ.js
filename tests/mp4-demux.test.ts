import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demuxMP4 } from '../packages/assets/src/mp4-demux.js';
import { AssetError } from '../packages/assets/src/texture.js';

// Node has no WebCodecs: this transport shim copies bytes like EncodedVideoChunk.
// All container parsing, codec extraction and sample-table logic run unchanged.
class Chunk {
  readonly type: EncodedVideoChunkType;
  readonly timestamp: number;
  readonly duration: number | null;
  readonly byteLength: number;
  private readonly data: Uint8Array;
  constructor(init: EncodedVideoChunkInit) {
    this.type = init.type;
    this.timestamp = init.timestamp;
    this.duration = init.duration ?? null;
    const source = init.data as Uint8Array;
    this.data = source.slice();
    this.byteLength = this.data.length;
  }
  copyTo(destination: Uint8Array): void {
    destination.set(this.data);
  }
}
const cat = (...parts: Uint8Array[]): Uint8Array => {
  const bytes = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
};
const u32 = (...values: number[]): Uint8Array => {
  const bytes = new Uint8Array(values.length * 4),
    view = new DataView(bytes.buffer);
  values.forEach((value, i) => view.setUint32(i * 4, value));
  return bytes;
};
const str = (text: string): Uint8Array => new TextEncoder().encode(text);
const box = (type: string, ...data: Uint8Array[]): Uint8Array => {
  const body = cat(...data);
  return cat(u32(body.length + 8), str(type), body);
};
const full = (type: string, ...data: Uint8Array[]): Uint8Array =>
  box(type, u32(0), ...data);
interface FixtureOptions {
  codec?: string;
  co64?: boolean;
  audio?: boolean;
  secondVideo?: boolean;
  sync?: boolean;
  offset?: number;
  sampleCount?: number;
  ctts?: boolean;
  extra?: Uint8Array;
  constant?: boolean;
  record?: Uint8Array;
}
const fixture = (options: FixtureOptions = {}): Uint8Array => {
  const ftyp = box('ftyp', str('isom'), u32(0), str('isom'));
  const mdat = box('mdat', new Uint8Array([11, 12, 21, 22, 23, 31]));
  const track = (
    audio = false,
    codec = options.codec ?? 'avc1',
  ): Uint8Array => {
    const header = new Uint8Array(78),
      headerView = new DataView(header.buffer);
    headerView.setUint16(6, 1);
    headerView.setUint16(24, 320);
    headerView.setUint16(26, 180);
    const record =
      codec === 'vp09'
        ? box('vpcC', new Uint8Array([1, 0, 0, 0, 0, 10, 0x82, 1, 1, 1, 0, 0]))
        : codec === 'av01'
          ? box('av1C', new Uint8Array([0x81, 4, 0, 0]))
          : box(
              'avcC',
              new Uint8Array([
                1, 66, 0, 30, 0xff, 0xe1, 0, 1, 0x67, 1, 0, 1, 0x68,
              ]),
            );
    const stsd = full(
      'stsd',
      u32(1),
      box(audio ? 'mp4a' : codec, header, options.record ?? record),
    );
    const sizes = options.constant
      ? full('stsz', u32(2, options.sampleCount ?? 3))
      : full('stsz', u32(0, options.sampleCount ?? 3, 2, 3, 1));
    const offset = options.offset ?? ftyp.length + 8;
    const offsets = options.co64
      ? full('co64', u32(2, 0, offset, 0, offset + 5))
      : full('stco', u32(2, offset, offset + 5));
    const stbl = box(
      'stbl',
      stsd,
      sizes,
      full('stts', u32(2, 2, 100, 1, 200)),
      full('stsc', u32(2, 1, 2, 1, 2, 1, 1)),
      offsets,
      ...(options.sync === false ? [] : [full('stss', u32(2, 1, 3))]),
      ...(options.ctts ? [full('ctts', u32(3, 1, 100, 1, 0, 1, 0))] : []),
      ...(options.extra ? [options.extra] : []),
    );
    return box(
      'trak',
      box(
        'mdia',
        full('hdlr', u32(0), str(audio ? 'soun' : 'vide')),
        full('mdhd', u32(0, 0, 1000, 400), new Uint8Array(4)),
        box('minf', stbl),
      ),
    );
  };
  return cat(
    ftyp,
    mdat,
    box(
      'moov',
      ...(options.audio ? [track(true)] : []),
      track(),
      ...(options.secondVideo ? [track(false, 'hvc1')] : []),
    ),
  );
};
const contents = (chunk: EncodedVideoChunk): number[] => {
  const bytes = new Uint8Array(chunk.byteLength);
  chunk.copyTo(bytes);
  return Array.from(bytes);
};
beforeEach(() => vi.stubGlobal('EncodedVideoChunk', Chunk));
afterEach(() => vi.unstubAllGlobals());

describe('bounded MP4 demux', () => {
  it('extracts AVC configuration and ordered sample bytes/timing/keyframes', () => {
    const { config, chunks } = demuxMP4(fixture());
    expect(config.codec).toBe('avc1.42001e');
    expect([config.codedWidth, config.codedHeight]).toEqual([320, 180]);
    expect(Array.from(config.description as Uint8Array)).toEqual([
      1, 66, 0, 30, 255, 225, 0, 1, 103, 1, 0, 1, 104,
    ]);
    expect(chunks.map(contents)).toEqual([[11, 12], [21, 22, 23], [31]]);
    expect(
      chunks.map(({ timestamp, duration, type }) => [
        timestamp,
        duration,
        type,
      ]),
    ).toEqual([
      [0, 100000, 'key'],
      [100000, 100000, 'delta'],
      [200000, 200000, 'key'],
    ]);
  });
  it('supports co64 offsets', () =>
    expect(demuxMP4(fixture({ co64: true })).chunks.map(contents)).toEqual([
      [11, 12],
      [21, 22, 23],
      [31],
    ]));
  it('ignores audio descriptions and selects only first video', () =>
    expect(
      demuxMP4(fixture({ audio: true, secondVideo: true })).config.codec,
    ).toBe('avc1.42001e'));
  it('marks every sample key when stss is absent', () =>
    expect(
      demuxMP4(fixture({ sync: false })).chunks.map((chunk) => chunk.type),
    ).toEqual(['key', 'key', 'key']));
  it('applies composition offsets without reordering decode input', () =>
    expect(
      demuxMP4(fixture({ ctts: true })).chunks.map((chunk) => chunk.timestamp),
    ).toEqual([100000, 100000, 200000]));
  it.each([
    ['vp09', 'vp09.00.10.08'],
    ['av01', 'av01.0.04M.08'],
  ])('extracts %s decoder codec', (codec, expected) =>
    expect(demuxMP4(fixture({ codec })).config.codec).toBe(expected),
  );
  it('copies description and sample ownership independently from caller bytes', () => {
    const bytes = fixture(),
      result = demuxMP4(bytes);
    bytes.fill(0);
    expect(contents(result.chunks[0]!)).toEqual([11, 12]);
    expect((result.config.description as Uint8Array)[0]).toBe(1);
  });
  it.each(['moof', 'traf', 'mvex'])('rejects fragmented %s', (type) =>
    expect(() => demuxMP4(cat(fixture(), box(type)))).toThrow(AssetError),
  );
  it('rejects encrypted sample entries', () =>
    expect(() => demuxMP4(fixture({ codec: 'encv' }))).toThrow(/encrypted/));
  it('rejects encryption sample metadata', () =>
    expect(() => demuxMP4(fixture({ extra: full('senc') }))).toThrow(
      /encrypted/,
    ));
  it('rejects unsupported codecs', () =>
    expect(() => demuxMP4(fixture({ codec: 'hvc1' }))).toThrow(/codec hvc1/));
  it('rejects malformed codec record', () =>
    expect(() =>
      demuxMP4(
        fixture({ record: box('avcC', new Uint8Array([1, 66, 0, 30])) }),
      ),
    ).toThrow(RangeError));
  it('rejects truncated boxes', () =>
    expect(() => demuxMP4(fixture().subarray(0, -1))).toThrow(RangeError));
  it('rejects undersized boxes', () =>
    expect(() => demuxMP4(cat(u32(4), str('ftyp')))).toThrow(RangeError));
  it('rejects samples outside mdat', () =>
    expect(() => demuxMP4(fixture({ offset: 0 }))).toThrow(RangeError));
  it('rejects inconsistent sample count', () =>
    expect(() => demuxMP4(fixture({ sampleCount: 4 }))).toThrow(RangeError));
  it('enforces exact byte boundary', () => {
    const bytes = fixture();
    expect(demuxMP4(bytes, { maxBytes: bytes.length }).chunks).toHaveLength(3);
    expect(() => demuxMP4(bytes, { maxBytes: bytes.length - 1 })).toThrow(
      /byte budget/,
    );
  });
  it('enforces sample and track boundaries', () => {
    expect(
      demuxMP4(fixture({ audio: true }), { maxSamples: 3, maxTracks: 2 })
        .chunks,
    ).toHaveLength(3);
    expect(() => demuxMP4(fixture(), { maxSamples: 2 })).toThrow(
      /sample budget/,
    );
    expect(() => demuxMP4(fixture({ audio: true }), { maxTracks: 1 })).toThrow(
      /track budget/,
    );
  });
  it('enforces sample-entry nesting and rejects nested containers beyond cap', () => {
    expect(demuxMP4(fixture(), { maxDepth: 7 }).chunks).toHaveLength(3);
    expect(() => demuxMP4(fixture(), { maxDepth: 6 })).toThrow(
      /nesting budget/,
    );
    let nested = box('free');
    for (let i = 0; i < 17; i++) nested = box('moov', nested);
    expect(() => demuxMP4(cat(fixture(), nested))).toThrow(/nesting budget/);
  });
  it('rejects unsafe extended box lengths', () =>
    expect(() => demuxMP4(cat(u32(1), str('ftyp'), u32(0x200000, 0)))).toThrow(
      RangeError,
    ));
  it('rejects unavailable WebCodecs explicitly', () => {
    vi.stubGlobal('EncodedVideoChunk', undefined);
    expect(() => demuxMP4(fixture())).toThrow(/WebCodecs/);
  });
  it('rejects invalid or enlarged budgets', () => {
    expect(() => demuxMP4(fixture(), { maxSamples: 100001 })).toThrow(/budget/);
    expect(() => demuxMP4(fixture(), { maxDepth: 0 })).toThrow(/budget/);
  });
});
