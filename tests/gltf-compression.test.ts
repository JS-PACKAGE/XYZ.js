/* eslint-disable @typescript-eslint/no-explicit-any -- tests mutate loosely typed glTF JSON documents */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import type { Mesh } from '../packages/core/src/mesh.js';
import meshopt from './fixtures/meshopt-mesh.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function installImages(): void {
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
    vi.fn(async () => ({ width: 1, height: 1, close: vi.fn() })),
  );
}

const fixture = meshopt as unknown as {
  positions: number[];
  indices: number[];
  compressed: { positions: string; normals: string; indices: string };
};

const bytes = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
const dataUri = (data: Uint8Array): string =>
  `data:application/octet-stream;base64,${btoa(String.fromCharCode(...data))}`;

/** Each triangle rotated so its smallest index comes first; the codec may rotate vertices. */
function canonical(indices: ArrayLike<number>): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const tri = [indices[i]!, indices[i + 1]!, indices[i + 2]!];
    const at = tri.indexOf(Math.min(...tri));
    result.push([tri[at]!, tri[(at + 1) % 3]!, tri[(at + 2) % 3]!]);
  }
  return result;
}

interface Pack {
  positions: Uint8Array;
  normals: Uint8Array;
  indices: Uint8Array;
}
function compressedModel(
  pack: Pack,
  patch: (doc: Record<string, any>) => void = () => {},
) {
  const parts = [pack.positions, pack.normals, pack.indices];
  const offsets: number[] = [];
  let total = 0;
  for (const part of parts) {
    offsets.push(total);
    total += part.length;
  }
  const all = new Uint8Array(total);
  parts.forEach((part, i) => all.set(part, offsets[i]));
  const view = (
    byteLength: number,
    index: number,
    count: number,
    stride: number,
    mode: string,
    byteStride?: number,
  ) => ({
    buffer: 1,
    byteLength,
    ...(byteStride ? { byteStride } : {}),
    extensions: {
      EXT_meshopt_compression: {
        buffer: 0,
        byteOffset: offsets[index],
        byteLength: parts[index]!.length,
        byteStride: stride,
        count,
        mode,
      },
    },
  });
  const document: Record<string, any> = {
    asset: { version: '2.0' },
    extensionsUsed: ['EXT_meshopt_compression'],
    extensionsRequired: ['EXT_meshopt_compression'],
    buffers: [
      { byteLength: total, uri: dataUri(all) },
      {
        byteLength: 5 * 12 * 2 + 18,
        extensions: { EXT_meshopt_compression: { fallback: true } },
      },
    ],
    bufferViews: [
      view(60, 0, 5, 12, 'ATTRIBUTES', 12),
      view(60, 1, 5, 12, 'ATTRIBUTES', 12),
      view(18, 2, 9, 2, 'TRIANGLES'),
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 5, type: 'VEC3' },
      { bufferView: 1, componentType: 5126, count: 5, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, count: 9, type: 'SCALAR' },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2 }] },
    ],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
  patch(document);
  return document;
}
const pack: Pack = {
  positions: bytes(fixture.compressed.positions),
  normals: bytes(fixture.compressed.normals),
  indices: bytes(fixture.compressed.indices),
};
async function load(document: unknown, options = {}) {
  installImages();
  const asset = await new GLTFLoader().parse(
    JSON.stringify(document),
    undefined,
    options,
  );
  const mesh = [...[...asset.scene.children][0]!.children][0] as Mesh;
  return mesh;
}

describe('EXT_meshopt_compression in glTF', () => {
  it('decodes compressed attribute and triangle views, ignoring the fallback buffer', async () => {
    const mesh = await load(compressedModel(pack));
    const vertices = mesh.geometry.vertices;
    // Interleaved layout: position, normal, uv per vertex.
    const stride = vertices.length / 5;
    const positions = Array.from({ length: 5 }, (_, i) =>
      Array.from(vertices.subarray(i * stride, i * stride + 3)),
    );
    expect(positions.flat()).toEqual(fixture.positions);
    expect(canonical(mesh.geometry.indices)).toEqual(
      canonical(fixture.indices),
    );
    expect(Array.from(vertices.subarray(3, 6))).toEqual([0, 0, 1]);
  });

  it('rejects inconsistent or corrupt compressed views', async () => {
    const corrupt = new Uint8Array(pack.positions);
    corrupt[corrupt.length - 40] ^= 0xff;
    const bad: Array<[string, (doc: Record<string, any>) => void]> = [
      [
        'count × stride ≠ byteLength',
        (d) => (d.bufferViews[0].byteLength = 48),
      ],
      ['stride mismatch', (d) => (d.bufferViews[0].byteStride = 16)],
      [
        'source out of range',
        (d) =>
          (d.bufferViews[2].extensions.EXT_meshopt_compression.byteOffset = 1e6),
      ],
      [
        'unknown mode',
        (d) =>
          (d.bufferViews[2].extensions.EXT_meshopt_compression.mode = 'BOGUS'),
      ],
      [
        'source is a fallback',
        (d) => (d.bufferViews[2].extensions.EXT_meshopt_compression.buffer = 1),
      ],
      [
        'uncompressed view on the fallback',
        (d) => delete d.bufferViews[1].extensions,
      ],
    ];
    for (const [, patch] of bad)
      await expect(load(compressedModel(pack, patch))).rejects.toThrow();
    await expect(
      load(
        compressedModel({ ...pack, positions: pack.positions.subarray(0, 30) }),
      ),
    ).rejects.toThrow();
  });
});

function dracoModel(
  required = true,
  patch: (doc: Record<string, any>) => void = () => {},
) {
  const blob = new Uint8Array([0x44, 0x52, 0x41, 0x43, 0x4f, 1, 2, 3]);
  const document: Record<string, any> = {
    asset: { version: '2.0' },
    extensionsUsed: ['KHR_draco_mesh_compression'],
    ...(required ? { extensionsRequired: ['KHR_draco_mesh_compression'] } : {}),
    buffers: [{ byteLength: blob.length, uri: dataUri(blob) }],
    bufferViews: [{ buffer: 0, byteLength: blob.length }],
    accessors: [
      { componentType: 5126, count: 4, type: 'VEC3' },
      { componentType: 5126, count: 4, type: 'VEC3' },
      { componentType: 5123, count: 6, type: 'SCALAR' },
    ],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            extensions: {
              KHR_draco_mesh_compression: {
                bufferView: 0,
                attributes: { POSITION: 7, NORMAL: 3 },
              },
            },
          },
        ],
      },
    ],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
  patch(document);
  return document;
}
const quad = {
  indices: [0, 1, 2, 0, 2, 3],
  attributes: {
    POSITION: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    NORMAL: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  },
};

describe('KHR_draco_mesh_compression through an injected decoder', () => {
  it('passes the compressed view and attribute ids to the decoder and uses its output', async () => {
    const decoder = vi.fn(async () => quad);
    const mesh = await load(dracoModel(), { dracoDecoder: decoder });
    expect(decoder).toHaveBeenCalledTimes(1);
    const request = (
      decoder.mock.calls[0] as unknown as [
        { data: Uint8Array; attributes: unknown },
      ]
    )[0];
    expect(Array.from(request.data)).toEqual([
      0x44, 0x52, 0x41, 0x43, 0x4f, 1, 2, 3,
    ]);
    expect(request.attributes).toEqual({ POSITION: 7, NORMAL: 3 });
    const vertices = mesh.geometry.vertices;
    expect(Array.from(vertices.subarray(16, 19))).toEqual([1, 1, 0]);
    expect(canonical(mesh.geometry.indices)).toEqual(canonical(quad.indices));
  });

  it('refuses a Draco primitive it cannot decode instead of rendering zeros', async () => {
    await expect(load(dracoModel())).rejects.toThrow();
    await expect(load(dracoModel(false))).rejects.toThrow(/dracoDecoder/);
  });

  it('loads uncompressed fallback accessors when no decoder is given and Draco is optional', async () => {
    const positions = new Float32Array(quad.attributes.POSITION);
    const indices = new Uint16Array(quad.indices);
    const data = new Uint8Array(positions.byteLength + indices.byteLength);
    data.set(new Uint8Array(positions.buffer), 0);
    data.set(new Uint8Array(indices.buffer), positions.byteLength);
    const mesh = await load(
      dracoModel(false, (d) => {
        d.buffers = [{ byteLength: data.length, uri: dataUri(data) }];
        d.bufferViews = [
          { buffer: 0, byteLength: 48 },
          { buffer: 0, byteOffset: 48, byteLength: 12 },
        ];
        d.accessors = [
          { bufferView: 0, componentType: 5126, count: 4, type: 'VEC3' },
          { componentType: 5126, count: 4, type: 'VEC3' },
          { bufferView: 1, componentType: 5123, count: 6, type: 'SCALAR' },
        ];
        delete d.meshes[0].primitives[0].attributes.NORMAL;
        d.meshes[0].primitives[0].extensions.KHR_draco_mesh_compression.bufferView = 0;
        d.meshes[0].primitives[0].extensions.KHR_draco_mesh_compression.attributes =
          { POSITION: 0 };
      }),
    );
    expect(Array.from(mesh.geometry.vertices.subarray(16, 19))).toEqual([
      1, 1, 0,
    ]);
  });

  it('rejects decoder output of the wrong size, non-finite values or missing attributes', async () => {
    const options = (patch: (r: any) => void) => ({
      dracoDecoder: () => {
        const result = structuredClone(quad) as any;
        patch(result);
        return result;
      },
    });
    await expect(
      load(
        dracoModel(),
        options((r) => r.attributes.POSITION.pop()),
      ),
    ).rejects.toThrow();
    await expect(
      load(
        dracoModel(),
        options((r) => (r.attributes.NORMAL[2] = Number.NaN)),
      ),
    ).rejects.toThrow();
    await expect(
      load(
        dracoModel(),
        options((r) => delete r.attributes.POSITION),
      ),
    ).rejects.toThrow();
    await expect(
      load(
        dracoModel(),
        options((r) => delete r.indices),
      ),
    ).rejects.toThrow();
    await expect(
      load(
        dracoModel(),
        options((r) => r.indices.push(9)),
      ),
    ).rejects.toThrow();
  });
});
