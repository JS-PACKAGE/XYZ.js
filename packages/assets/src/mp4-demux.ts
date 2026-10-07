import { AssetError } from './texture.js';
import { videoTextureLimits } from '../../../src/data/video.js';
import { assetLimits } from '../../../src/data/assets.js';

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
interface Box {
  type: string;
  start: number;
  end: number;
  children: Box[];
}
const containers: Record<string, true> = {
  moov: true,
  trak: true,
  mdia: true,
  minf: true,
  stbl: true,
  edts: true,
  dinf: true,
  sinf: true,
  schi: true,
};

/** Input remains caller-owned; config and WebCodecs chunks own independent copies. */
export function demuxMP4(
  bytes: Uint8Array,
  options: MP4DemuxOptions = {},
): MP4DemuxResult {
  const budget = (value: number | undefined, cap: number): number => {
    const result = value ?? cap;
    if (!Number.isSafeInteger(result) || result < 1 || result > cap)
      throw new RangeError('Invalid MP4 parsing budget.');
    return result;
  };
  const maxBytes = budget(options.maxBytes, videoTextureLimits.mp4Bytes);
  const maxSamples = budget(options.maxSamples, videoTextureLimits.mp4Samples);
  const maxTracks = budget(options.maxTracks, videoTextureLimits.mp4Tracks);
  const maxDepth = budget(options.maxDepth, videoTextureLimits.mp4Depth);
  if (bytes.byteLength > maxBytes)
    throw new RangeError('MP4 byte budget exceeded.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid: () => never = () => {
    throw new RangeError('Malformed or out-of-bounds MP4 data.');
  };
  const unsupported: (detail: string) => never = (detail) => {
    throw new AssetError(`Unsupported MP4: ${detail}.`);
  };
  const need = (offset: number, length: number, end: number): void => {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      offset + length > end
    )
      invalid();
  };
  const u32 = (offset: number): number => view.getUint32(offset);
  const safe64 = (offset: number): number => {
    const value = view.getBigUint64(offset);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) invalid();
    return Number(value);
  };
  const text = (offset: number): string =>
    String.fromCharCode(...bytes.subarray(offset, offset + 4));
  const parse = (start: number, end: number, depth: number): Box[] => {
    if (depth > maxDepth) throw new RangeError('MP4 nesting budget exceeded.');
    const boxes: Box[] = [];
    while (start < end) {
      need(start, 8, end);
      const type = text(start + 4);
      let size = u32(start),
        header = 8;
      if (size === 1) {
        need(start, 16, end);
        size = safe64(start + 8);
        header = 16;
      } else if (size === 0) size = end - start;
      if (size < header) invalid();
      need(start, size, end);
      if (['moof', 'traf', 'mvex'].includes(type))
        unsupported('fragmented containers');
      const box: Box = {
        type,
        start: start + header,
        end: start + size,
        children: [],
      };
      if (Object.hasOwn(containers, type))
        box.children = parse(box.start, box.end, depth + 1);
      boxes.push(box);
      start += size;
    }
    return boxes;
  };
  const one = (boxes: Box[], type: string): Box => {
    const matches = boxes.filter((box) => box.type === type);
    if (matches.length !== 1) invalid();
    return matches[0]!;
  };
  const full = (box: Box, version = 0): number => {
    need(box.start, 4, box.end);
    if (
      bytes[box.start] !== version ||
      bytes[box.start + 1] ||
      bytes[box.start + 2] ||
      bytes[box.start + 3]
    )
      unsupported(`${box.type} version/flags`);
    return box.start + 4;
  };
  const table = (
    box: Box,
    stride: number,
  ): { offset: number; count: number } => {
    const start = full(box);
    need(start, 4, box.end);
    const count = u32(start);
    if (count > maxSamples) throw new RangeError('MP4 table budget exceeded.');
    if (start + 4 + count * stride !== box.end) invalid();
    return { offset: start + 4, count };
  };
  const roots = parse(0, bytes.length, 1);
  const ftyp = one(roots, 'ftyp');
  if (ftyp.end - ftyp.start < 8 || (ftyp.end - ftyp.start) % 4) invalid();
  const moov = one(roots, 'moov');
  const media = roots.filter((box) => box.type === 'mdat');
  if (!media.length) invalid();
  const tracks = moov.children.filter((box) => box.type === 'trak');
  if (tracks.length > maxTracks)
    throw new RangeError('MP4 track budget exceeded.');
  let selected: Box | undefined;
  for (const track of tracks) {
    const mdia = one(track.children, 'mdia');
    const handler = one(mdia.children, 'hdlr');
    const offset = full(handler);
    need(offset, 8, handler.end);
    if (text(offset + 4) === 'vide' && !selected) selected = track;
  }
  if (!selected) unsupported('no video track');
  if (selected.children.some((box) => box.type === 'edts'))
    unsupported('edit lists');
  const mdia = one(selected.children, 'mdia');
  const mdhd = one(mdia.children, 'mdhd');
  need(mdhd.start, 4, mdhd.end);
  const version = bytes[mdhd.start]!;
  if (version !== 0 && version !== 1) unsupported('mdhd version');
  full(mdhd, version);
  need(mdhd.start, version === 1 ? 36 : 24, mdhd.end);
  const scale = u32(mdhd.start + (version === 1 ? 20 : 12));
  if (!scale) invalid();
  const stbl = one(one(mdia.children, 'minf').children, 'stbl');
  if (stbl.children.some((box) => ['senc', 'saiz', 'saio'].includes(box.type)))
    unsupported('encrypted samples');
  const stsd = one(stbl.children, 'stsd');
  const descriptionStart = full(stsd);
  need(descriptionStart, 4, stsd.end);
  if (u32(descriptionStart) !== 1) unsupported('multiple sample descriptions');
  const entry = parse(descriptionStart + 4, stsd.end, 6);
  if (entry.length !== 1) invalid();
  const sampleEntry = entry[0]!;
  if (sampleEntry.type === 'encv') unsupported('encrypted video track');
  if (!['avc1', 'vp09', 'av01'].includes(sampleEntry.type))
    unsupported(`codec ${sampleEntry.type}`);
  need(sampleEntry.start, 78, sampleEntry.end);
  if (view.getUint16(sampleEntry.start + 6) !== 1)
    unsupported('external data reference');
  const width = view.getUint16(sampleEntry.start + 24),
    height = view.getUint16(sampleEntry.start + 26);
  if (
    !width ||
    !height ||
    width > assetLimits.textureDimension ||
    height > assetLimits.textureDimension ||
    width * height > assetLimits.texturePixels
  )
    invalid();
  const extensions = parse(sampleEntry.start + 78, sampleEntry.end, 7);
  if (extensions.some((box) => box.type === 'sinf'))
    unsupported('encrypted video track');
  const record = one(
    extensions,
    sampleEntry.type === 'avc1'
      ? 'avcC'
      : sampleEntry.type === 'vp09'
        ? 'vpcC'
        : 'av1C',
  );
  const data = bytes.subarray(record.start, record.end);
  let codec: string;
  let description: Uint8Array | undefined;
  const pad = (value: number): string => String(value).padStart(2, '0');
  if (sampleEntry.type === 'avc1') {
    if (data.length < 7 || data[0] !== 1 || (data[4]! & 3) === 2) invalid();
    let cursor = 6;
    const consume = (count: number): void => {
      for (let i = 0; i < count; i++) {
        need(record.start + cursor, 2, record.end);
        const length = view.getUint16(record.start + cursor);
        cursor += 2;
        if (!length) invalid();
        need(record.start + cursor, length, record.end);
        cursor += length;
      }
    };
    const sps = data[5]! & 31;
    if (!sps) invalid();
    consume(sps);
    need(record.start + cursor, 1, record.end);
    const pps = data[cursor++]!;
    if (!pps) invalid();
    consume(pps);
    codec = `avc1.${Array.from(data.subarray(1, 4), (value) => value.toString(16).padStart(2, '0')).join('')}`;
    description = data.slice();
  } else if (sampleEntry.type === 'vp09') {
    full(record, 1);
    if (data.length < 12) invalid();
    const profile = data[4]!,
      level = data[5]!,
      depth = data[6]! >> 4;
    if (
      profile > 3 ||
      ![8, 10, 12].includes(depth) ||
      data.length !== 12 + view.getUint16(record.start + 10)
    )
      invalid();
    codec = `vp09.${pad(profile)}.${pad(level)}.${pad(depth)}`;
    // WebCodecs VP9 uses codec-string configuration, not a vpcC description.
  } else {
    if (data.length < 4 || data[0] !== 0x81) invalid();
    const profile = data[1]! >> 5,
      level = data[1]! & 31;
    const high = (data[2]! & 64) !== 0,
      twelve = (data[2]! & 32) !== 0;
    if (profile > 2 || (twelve && (!high || profile !== 2))) invalid();
    codec = `av01.${profile}.${pad(level)}${data[2]! & 128 ? 'H' : 'M'}.${twelve ? '12' : high ? '10' : '08'}`;
    description = data.slice();
  }
  const config: VideoDecoderConfig = {
    codec,
    codedWidth: width,
    codedHeight: height,
    ...(description ? { description } : {}),
  };
  const stsz = one(stbl.children, 'stsz');
  const sz = full(stsz);
  need(sz, 8, stsz.end);
  const fixedSize = u32(sz),
    count = u32(sz + 4);
  if (!count || count > maxSamples)
    throw new RangeError('MP4 sample budget exceeded.');
  if (sz + 8 + (fixedSize ? 0 : count * 4) !== stsz.end) invalid();
  const sizes = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    sizes[i] = fixedSize || u32(sz + 8 + i * 4);
    if (!sizes[i] || sizes[i]! > videoTextureLimits.decoderChunkBytes)
      invalid();
  }
  const timing = table(one(stbl.children, 'stts'), 8);
  const durations = new Uint32Array(count);
  let sample = 0;
  for (let i = 0; i < timing.count; i++) {
    const n = u32(timing.offset + i * 8),
      delta = u32(timing.offset + i * 8 + 4);
    if (!n || !delta || sample + n > count) invalid();
    durations.fill(delta, sample, sample + n);
    sample += n;
  }
  if (sample !== count) invalid();
  const compositions = new Int32Array(count);
  const ctts = stbl.children.filter((box) => box.type === 'ctts');
  if (ctts.length > 1) invalid();
  if (ctts[0]) {
    const box = ctts[0],
      v = bytes[box.start]!;
    if (v !== 0 && v !== 1) unsupported('ctts version');
    const start = full(box, v);
    need(start, 4, box.end);
    const entries = u32(start);
    if (entries > maxSamples || start + 4 + entries * 8 !== box.end) invalid();
    sample = 0;
    for (let i = 0; i < entries; i++) {
      const n = u32(start + 4 + i * 8),
        offset =
          v === 1 ? view.getInt32(start + 8 + i * 8) : u32(start + 8 + i * 8);
      if (!n || sample + n > count || offset > 0x7fffffff) invalid();
      compositions.fill(offset, sample, sample + n);
      sample += n;
    }
    if (sample !== count) invalid();
  }
  const sync = new Uint8Array(count);
  const stss = stbl.children.filter((box) => box.type === 'stss');
  if (stss.length > 1) invalid();
  if (!stss.length) sync.fill(1);
  else {
    const keys = table(stss[0]!, 4);
    let previous = 0;
    for (let i = 0; i < keys.count; i++) {
      const index = u32(keys.offset + i * 4);
      if (index <= previous || index > count) invalid();
      sync[index - 1] = 1;
      previous = index;
    }
  }
  const offsets = stbl.children.filter(
    (box) => box.type === 'stco' || box.type === 'co64',
  );
  if (offsets.length !== 1) invalid();
  const offsetBox = offsets[0]!,
    stride = offsetBox.type === 'co64' ? 8 : 4;
  const chunksTable = table(offsetBox, stride);
  const mapping = table(one(stbl.children, 'stsc'), 12);
  if (!mapping.count || !chunksTable.count) invalid();
  const first: number[] = [],
    perChunk: number[] = [];
  for (let i = 0; i < mapping.count; i++) {
    const pos = mapping.offset + i * 12,
      chunk = u32(pos),
      n = u32(pos + 4);
    if (
      (i === 0 && chunk !== 1) ||
      chunk <= (first[i - 1] ?? 0) ||
      chunk > chunksTable.count ||
      !n ||
      n > count ||
      u32(pos + 8) !== 1
    )
      invalid();
    first.push(chunk);
    perChunk.push(n);
  }
  const ranges: { offset: number; end: number }[] = [];
  const sampleOffsets = new Float64Array(count);
  sample = 0;
  let mappingIndex = 0;
  for (let i = 0; i < chunksTable.count; i++) {
    if (mappingIndex + 1 < first.length && i + 1 === first[mappingIndex + 1])
      mappingIndex++;
    let offset =
      stride === 8
        ? safe64(chunksTable.offset + i * 8)
        : u32(chunksTable.offset + i * 4);
    const start = offset,
      n = perChunk[mappingIndex]!;
    if (sample + n > count) invalid();
    for (let j = 0; j < n; j++) {
      sampleOffsets[sample] = offset;
      offset += sizes[sample++]!;
    }
    if (!media.some((box) => start >= box.start && offset <= box.end))
      invalid();
    ranges.push({ offset: start, end: offset });
  }
  if (sample !== count) invalid();
  ranges.sort((a, b) => a.offset - b.offset);
  for (let i = 1; i < ranges.length; i++)
    if (ranges[i]!.offset < ranges[i - 1]!.end) invalid();
  if (typeof EncodedVideoChunk === 'undefined')
    unsupported('WebCodecs EncodedVideoChunk unavailable');
  const micros = (ticks: bigint): number => {
    const value = Number((ticks * 1_000_000n) / BigInt(scale));
    if (!Number.isSafeInteger(value)) invalid();
    return value;
  };
  const chunks: EncodedVideoChunk[] = [];
  let time = 0n;
  for (let i = 0; i < count; i++) {
    const delta = BigInt(durations[i]!);
    const timestamp = micros(time + BigInt(compositions[i]!));
    const duration = micros(time + delta) - micros(time);
    if (duration < 1) invalid();
    const offset = sampleOffsets[i]!;
    chunks.push(
      new EncodedVideoChunk({
        type: sync[i] ? 'key' : 'delta',
        timestamp,
        duration,
        data: bytes.subarray(offset, offset + sizes[i]!),
      }),
    );
    time += delta;
  }
  return { config, chunks };
}
