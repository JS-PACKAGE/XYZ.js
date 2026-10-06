/** Real two-pixel GIF/APNG fixtures: red/red, green/red, red/blue (restore-previous disposal). */
export function animatedGIF(): Uint8Array {
  const bytes = [
    ...new TextEncoder().encode('GIF89a'),
    2,
    0,
    1,
    0,
    0x81,
    0,
    0,
    255,
    0,
    0,
    0,
    255,
    0,
    0,
    0,
    255,
    0,
    0,
    0,
    0x21,
    0xff,
    11,
    ...new TextEncoder().encode('NETSCAPE2.0'),
    3,
    1,
    1,
    0,
    0,
  ];
  const frame = (
    left: number,
    width: number,
    color: number,
    delay: number,
    disposal: number,
  ) => {
    // Clear before every pixel keeps the LZW code size at three bits.
    const codes = [4, color];
    if (width === 2) codes.push(4, color);
    codes.push(5);
    let packed = 0;
    codes.forEach((code, index) => {
      packed |= code << (index * 3);
    });
    const count = Math.ceil((codes.length * 3) / 8);
    bytes.push(
      0x21,
      0xf9,
      4,
      disposal << 2,
      delay,
      0,
      0,
      0,
      0x2c,
      left,
      0,
      0,
      0,
      width,
      0,
      1,
      0,
      0,
      2,
      count,
    );
    for (let i = 0; i < count; i++) bytes.push((packed >>> (i * 8)) & 255);
    bytes.push(0);
  };
  frame(0, 2, 0, 10, 1);
  frame(0, 1, 1, 20, 3);
  frame(1, 1, 2, 30, 1);
  bytes.push(0x3b);
  return new Uint8Array(bytes);
}
function u32(value: number): number[] {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ];
}
function chunk(type: string, data: number[]): number[] {
  const body = [...new TextEncoder().encode(type), ...data];
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return [...u32(data.length), ...body, ...u32((crc ^ 0xffffffff) >>> 0)];
}
function zlib(pixels: number[]): number[] {
  const raw = [0, ...pixels];
  let a = 1,
    b = 0;
  for (const byte of raw) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return [
    0x78,
    0x01,
    1,
    raw.length,
    0,
    ~raw.length & 255,
    255,
    ...raw,
    ...u32(((b << 16) | a) >>> 0),
  ];
}
export function animatedAPNG(): Uint8Array {
  const bytes = [
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    ...chunk('IHDR', [...u32(2), ...u32(1), 8, 6, 0, 0, 0]),
    ...chunk('acTL', [...u32(3), ...u32(2)]),
  ];
  let sequence = 0;
  const frame = (
    left: number,
    width: number,
    pixels: number[],
    delay: number,
    disposal: number,
    first = false,
  ) => {
    bytes.push(
      ...chunk('fcTL', [
        ...u32(sequence++),
        ...u32(width),
        ...u32(1),
        ...u32(left),
        ...u32(0),
        0,
        delay,
        0,
        10,
        disposal,
        0,
      ]),
    );
    bytes.push(
      ...chunk(first ? 'IDAT' : 'fdAT', [
        ...(first ? [] : u32(sequence++)),
        ...zlib(pixels),
      ]),
    );
  };
  frame(0, 2, [255, 0, 0, 255, 255, 0, 0, 255], 1, 0, true);
  frame(0, 1, [0, 255, 0, 255], 2, 2);
  frame(1, 1, [0, 0, 255, 255], 3, 0);
  bytes.push(...chunk('IEND', []));
  return new Uint8Array(bytes);
}
