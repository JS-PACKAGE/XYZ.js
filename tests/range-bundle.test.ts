import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  AssetBundleRangeReader,
  parseAssetBundleArchive,
} from '../packages/assets/src/range-bundle.js';
import {
  loadAssetBundleRange,
  parseAssetBundle,
} from '../packages/assets/src/asset-bundle.js';
import { assetRecipe } from '../src/data/asset-recipe.js';

const model = new TextEncoder().encode(
  JSON.stringify({
    asset: { version: '2.0' },
    buffers: [{ uri: 'data.bin', byteLength: 4 }],
  }),
);
const data = new Uint8Array([10, 20, 30, 40]);
const archiveBytes = new Uint8Array(model.length + data.length + 8);
archiveBytes.set(model, 4);
archiveBytes.set(data, model.length + 4);
const files = [
  {
    path: 'scene.gltf',
    bytes: model.length,
    sha256: createHash('sha256').update(model).digest('hex'),
  },
  {
    path: 'data.bin',
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  },
];
const manifest = {
  version: 2,
  profile: assetRecipe.bundleProfile,
  files,
  variants: [
    { path: 'scene.gltf', nativeTextures: false, formats: [], codec: 'none' },
  ],
  textures: [],
  archive: {
    path: 'archive.bin',
    bytes: archiveBytes.length,
    members: [
      { path: 'scene.gltf', offset: 4, bytes: model.length },
      { path: 'data.bin', offset: model.length + 4, bytes: 4 },
    ],
  },
};

describe('range bundle archives', () => {
  it.each(['honor', 'ignore', 'unavailable'] as const)(
    'loads verified members when servers %s Range',
    async (mode) => {
      const requests: string[] = [];
      const server = createServer((request, response) => {
        if (request.url === '/manifest.json') {
          response.end(JSON.stringify(manifest));
          return;
        }
        const range = request.headers.range;
        requests.push(range ?? 'full');
        if (mode === 'unavailable' && range) {
          response.writeHead(405);
          response.end();
          return;
        }
        if (mode === 'honor' && range) {
          const [, start, end] = /^bytes=(\d+)-(\d+)$/.exec(range)!;
          response.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${archiveBytes.length}`,
          });
          response.end(archiveBytes.slice(Number(start), Number(end) + 1));
        } else response.end(archiveBytes);
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      );
      try {
        const uri = `http://127.0.0.1:${(server.address() as AddressInfo).port}/manifest.json`;
        let parsed = false;
        const asset = await loadAssetBundleRange(uri, {
          renderer: {
            backend: 'webgl2',
            capabilities: {
              threeD: true,
              maxTextureSize: 8192,
              supportedTextureFormats: [],
            },
          },
          loader: {
            parse: async (input) => {
              const json = JSON.parse(input) as { buffers: { uri: string }[] };
              expect(
                new Uint8Array(
                  await (await fetch(json.buffers[0]!.uri)).arrayBuffer(),
                ),
              ).toEqual(data);
              parsed = true;
              return { dispose() {} };
            },
          },
        });
        expect(parsed).toBe(true);
        expect(asset.bundleVariant.path).toBe('scene.gltf');
        expect(requests).toEqual(
          mode === 'honor'
            ? [
                `bytes=4-${model.length + 3}`,
                `bytes=${model.length + 4}-${model.length + 7}`,
              ]
            : mode === 'ignore'
              ? [`bytes=4-${model.length + 3}`]
              : [`bytes=4-${model.length + 3}`, 'full'],
        );
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      }
    },
  );
  it('rejects overlapping, overflowing or untracked offsets', () => {
    const descriptor = parseAssetBundle(manifest);
    expect(() =>
      parseAssetBundleArchive(
        {
          ...manifest.archive,
          members: [
            manifest.archive.members[0],
            { ...manifest.archive.members[1], offset: 4 },
          ],
        },
        descriptor,
      ),
    ).toThrow('Overlapping');
    expect(() =>
      parseAssetBundleArchive(
        {
          ...manifest.archive,
          members: [
            manifest.archive.members[0],
            { ...manifest.archive.members[1], offset: archiveBytes.length },
          ],
        },
        descriptor,
      ),
    ).toThrow('offset');
    expect(() =>
      parseAssetBundleArchive(
        {
          ...manifest.archive,
          members: [
            manifest.archive.members[0],
            { ...manifest.archive.members[1], path: 'other.bin' },
          ],
        },
        descriptor,
      ),
    ).toThrow('offset');
  });
  it('rejects lying 206 headers and oversized full fallbacks', async () => {
    for (const mode of ['range', 'oversize']) {
      const server = createServer((_request, response) => {
        if (mode === 'range')
          response.writeHead(206, { 'Content-Range': 'bytes 0-3/4' });
        response.end(
          mode === 'range' ? data : new Uint8Array(archiveBytes.length + 1),
        );
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      );
      const reader = new AssetBundleRangeReader(
        `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        parseAssetBundleArchive(manifest.archive, parseAssetBundle(manifest)),
      );
      try {
        await expect(reader.read('scene.gltf')).rejects.toThrow(
          mode === 'range' ? 'Content-Range' : 'exceeds',
        );
      } finally {
        reader.destroy();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  });
  it('cooperatively aborts a pending streamed body and rejects reuse after teardown', async () => {
    let started!: () => void;
    const received = new Promise<void>((resolve) => {
      started = resolve;
    });
    const server = createServer((_request, response) => {
      response.writeHead(200);
      response.write(new Uint8Array([0]));
      started();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const controller = new AbortController();
    const reader = new AssetBundleRangeReader(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      parseAssetBundleArchive(manifest.archive, parseAssetBundle(manifest)),
      controller.signal,
    );
    const reading = reader.read('scene.gltf');
    const rejection = expect(reading).rejects.toThrow();
    await received;
    controller.abort();
    await rejection;
    reader.destroy();
    await expect(reader.read('data.bin')).rejects.toThrow('destroyed');
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
