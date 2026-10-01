import { afterEach, describe, expect, it, vi } from 'vitest';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import {
  decodeKTX2,
  isKTX2,
  parseKTX2,
  type KTX2Container,
  type KTX2Image,
} from '../packages/core/src/ktx2.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** zlib-wrapped deflate through the platform CompressionStream. */
async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const identifier = [
  0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
];

interface Options {
  vkFormat?: number;
  width?: number;
  height?: number;
  layers?: number;
  faces?: number;
  supercompression?: number;
  uncompressedLength?: number;
}
/** Builds a single-level KTX2 file around `payload` exactly as the spec lays it out. */
function ktx2(payload: Uint8Array, options: Options = {}): Uint8Array {
  const dfd = new Uint8Array(8);
  const dataOffset = 80 + 24 + dfd.length;
  const bytes = new Uint8Array(dataOffset + payload.length);
  bytes.set(identifier);
  const view = new DataView(bytes.buffer);
  view.setUint32(12, options.vkFormat ?? 37, true);
  view.setUint32(16, 1, true);
  view.setUint32(20, options.width ?? 2, true);
  view.setUint32(24, options.height ?? 1, true);
  view.setUint32(32, options.layers ?? 0, true);
  view.setUint32(36, options.faces ?? 1, true);
  view.setUint32(40, 1, true);
  view.setUint32(44, options.supercompression ?? 0, true);
  view.setUint32(48, 80 + 24, true);
  view.setUint32(52, dfd.length, true);
  view.setBigUint64(80, BigInt(dataOffset), true);
  view.setBigUint64(88, BigInt(payload.length), true);
  view.setBigUint64(
    96,
    BigInt(options.uncompressedLength ?? payload.length),
    true,
  );
  bytes.set(payload, dataOffset);
  return bytes;
}
const rgba = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128]);

describe('KTX2 container', () => {
  it('parses the header, level index and ranges', () => {
    const file = ktx2(rgba);
    expect(isKTX2(file)).toBe(true);
    const container = parseKTX2(file);
    expect(container).toMatchObject({
      vkFormat: 37,
      width: 2,
      height: 1,
      supercompression: 0,
    });
    expect(Array.from(container.levels[0]!.data)).toEqual(Array.from(rgba));
  });

  it('decodes uncompressed RGBA8, RGB8 and ZLIB-supercompressed levels', async () => {
    expect(Array.from((await decodeKTX2(ktx2(rgba))).data)).toEqual(
      Array.from(rgba),
    );
    const rgb = await decodeKTX2(
      ktx2(new Uint8Array([1, 2, 3, 4, 5, 6]), { vkFormat: 23 }),
    );
    expect(Array.from(rgb.data)).toEqual([1, 2, 3, 255, 4, 5, 6, 255]);
    const zipped = await deflate(rgba);
    const image = await decodeKTX2(
      ktx2(zipped, {
        supercompression: 3,
        uncompressedLength: rgba.length,
        vkFormat: 43,
      }),
    );
    expect(Array.from(image.data)).toEqual(Array.from(rgba));
  });

  it('requires a transcoder for Basis payloads and validates what it returns', async () => {
    const basis = ktx2(new Uint8Array(16), {
      vkFormat: 0,
      supercompression: 1,
    });
    await expect(decodeKTX2(basis)).rejects.toThrow(/ktx2Transcoder/);
    const transcoder = vi.fn<(container: KTX2Container) => KTX2Image>(() => ({
      width: 2,
      height: 1,
      data: rgba,
    }));
    expect((await decodeKTX2(basis, transcoder)).data).toBe(rgba);
    expect(transcoder.mock.calls[0]![0]).toMatchObject({
      vkFormat: 0,
      supercompression: 1,
    });
    await expect(
      decodeKTX2(basis, () => ({
        width: 2,
        height: 1,
        data: new Uint8Array(3),
      })),
    ).rejects.toThrow();
    await expect(
      decodeKTX2(basis, () => ({
        width: 99999,
        height: 1,
        data: new Uint8Array(4),
      })),
    ).rejects.toThrow();
  });

  it('rejects malformed, truncated, oversized and unsupported files', async () => {
    const file = ktx2(rgba);
    expect(() => parseKTX2(file.subarray(0, 60))).toThrow();
    expect(() => parseKTX2(file.subarray(0, file.length - 1))).toThrow();
    const wrong = file.slice();
    wrong[0] = 0;
    expect(isKTX2(wrong)).toBe(false);
    expect(() => parseKTX2(wrong)).toThrow();
    await expect(decodeKTX2(ktx2(rgba, { width: 3 }))).rejects.toThrow();
    await expect(decodeKTX2(ktx2(rgba, { faces: 6 }))).rejects.toThrow();
    await expect(decodeKTX2(ktx2(rgba, { layers: 4 }))).rejects.toThrow();
    await expect(
      decodeKTX2(ktx2(rgba, { width: 1 << 20, height: 1 << 20 })),
    ).rejects.toThrow();
    const bomb = await deflate(new Uint8Array(64));
    await expect(
      decodeKTX2(ktx2(bomb, { supercompression: 3, uncompressedLength: 8 })),
    ).rejects.toThrow();
  });
});

describe('KTX2 images in glTF', () => {
  function installImages() {
    vi.stubGlobal(
      'ImageData',
      class {
        constructor(
          readonly data: Uint8ClampedArray,
          readonly width: number,
          readonly height: number,
        ) {}
      },
    );
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async (source: { width: number; height: number }) => ({
        width: source.width,
        height: source.height,
        close: vi.fn(),
      })),
    );
  }
  const uri = (bytes: Uint8Array): string =>
    `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}`;
  function model(
    image: Record<string, unknown>,
    texture: Record<string, unknown>,
    required: string[] = [],
  ) {
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1,
    ]);
    return {
      asset: { version: '2.0' },
      ...(required.length ? { extensionsRequired: required } : {}),
      buffers: [{ byteLength: 60, uri: uri(new Uint8Array(positions.buffer)) }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 0, byteOffset: 36, byteLength: 24 },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' },
      ],
      images: [image],
      textures: [texture],
      materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
      meshes: [
        {
          primitives: [
            { attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 },
          ],
        },
      ],
      nodes: [{ mesh: 0 }],
      scenes: [{ nodes: [0] }],
      scene: 0,
    };
  }
  it('loads an uncompressed KTX2 image by URI without any transcoder', async () => {
    installImages();
    const asset = await new GLTFLoader().parse(
      JSON.stringify(model({ uri: uri(ktx2(rgba)) }, { source: 0 })),
    );
    expect(asset.scene.children).toBeDefined();
    const uploaded = vi.mocked(createImageBitmap).mock.calls.map(
      ([image]) =>
        image as unknown as {
          width: number;
          height: number;
          data: Uint8ClampedArray;
        },
    );
    const found = uploaded.find(
      (image) => image.width === 2 && image.height === 1,
    );
    expect(Array.from(found!.data)).toEqual(Array.from(rgba));
  });

  it('uses the KHR_texture_basisu source only when a transcoder is supplied', async () => {
    installImages();
    const basis = ktx2(new Uint8Array(16), {
      vkFormat: 0,
      supercompression: 1,
      width: 4,
      height: 4,
    });
    const document = model(
      { uri: uri(basis), mimeType: 'image/ktx2' },
      { extensions: { KHR_texture_basisu: { source: 0 } } },
      ['KHR_texture_basisu'],
    );
    await expect(
      new GLTFLoader().parse(JSON.stringify(document)),
    ).rejects.toThrow();
    const transcoder = vi.fn(() => ({
      width: 4,
      height: 4,
      data: new Uint8Array(64),
    }));
    const asset = await new GLTFLoader().parse(
      JSON.stringify(document),
      undefined,
      {
        ktx2Transcoder: transcoder,
      },
    );
    expect(transcoder).toHaveBeenCalledTimes(1);
    expect(asset.scene.children).toBeDefined();
    expect(
      vi
        .mocked(createImageBitmap)
        .mock.calls.some(
          ([image]) => (image as unknown as { width: number }).width === 4,
        ),
    ).toBe(true);
  });
});
