import { createServer } from 'node:http';
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import {
  loadAssetBundle,
  parseAssetBundle,
  selectAssetBundleVariant,
} from '../packages/assets/src/asset-bundle.js';
import { GLTFLoader } from '../packages/core/src/gltf-loader.js';
import { assetRecipe } from '../src/data/asset-recipe.js';

function descriptor(width = 8) {
  return {
    version: 2,
    profile: assetRecipe.bundleProfile,
    files: ['compressed.gltf', 'raster.gltf'].map((path) => ({
      path,
      bytes: 1,
      sha256: '0'.repeat(64),
    })),
    variants: [
      {
        path: 'compressed.gltf',
        nativeTextures: true,
        formats: ['bc7-rgba-unorm'],
        codec: 'draco',
      },
      {
        path: 'raster.gltf',
        nativeTextures: false,
        formats: [],
        codec: 'none',
      },
    ],
    textures: [{ width, height: 8 }],
  };
}

function capabilities(backend) {
  return {
    backend,
    capabilities: {
      threeD: backend !== 'canvas2d',
      maxTextureSize: 8192,
      supportedTextureFormats: ['bc7-rgba-unorm'],
    },
  };
}

describe('asset bundle consumer boundaries', () => {
  it('selects a raster fallback without a decoder, but native Draco when both codec and device support it', () => {
    const bundle = parseAssetBundle(descriptor());
    expect(selectAssetBundleVariant(bundle, capabilities('webgpu')).path).toBe(
      'raster.gltf',
    );
    expect(
      selectAssetBundleVariant(bundle, capabilities('webgpu'), { draco: true })
        .path,
    ).toBe('compressed.gltf');
    expect(() =>
      selectAssetBundleVariant(bundle, capabilities('canvas2d')),
    ).toThrow('does not support');
  });

  it('respects WebGPU compressed base-dimension alignment without imposing that constraint on WebGL2', () => {
    const bundle = parseAssetBundle(descriptor(7));
    expect(
      selectAssetBundleVariant(bundle, capabilities('webgpu'), { draco: true })
        .path,
    ).toBe('raster.gltf');
    expect(
      selectAssetBundleVariant(bundle, capabilities('webgl2'), { draco: true })
        .path,
    ).toBe('compressed.gltf');
  });

  it('rejects traversal and bundles whose only variant requires an optional codec', () => {
    const unsafe = descriptor();
    unsafe.files[0].path = '../compressed.gltf';
    expect(() => parseAssetBundle(unsafe)).toThrow('path');
    const noFallback = descriptor();
    noFallback.variants.pop();
    expect(() => parseAssetBundle(noFallback)).toThrow('raster fallback');
  });

  it('rejects a corrupted selected model rather than silently loading an alternate variant', async () => {
    const model = JSON.stringify({
      asset: { version: '2.0' },
      scenes: [{ nodes: [] }],
      scene: 0,
    });
    const bundle = descriptor();
    bundle.files[1].bytes = Buffer.byteLength(model);
    const server = createServer((request, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(
        request.url === '/manifest.json' ? JSON.stringify(bundle) : model,
      );
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    try {
      const address = server.address();
      if (!address || typeof address === 'string')
        throw new Error('No fixture HTTP address.');
      await expect(
        loadAssetBundle(`http://127.0.0.1:${address.port}/manifest.json`, {
          renderer: capabilities('webgpu'),
          loader: new GLTFLoader(),
        }),
      ).rejects.toThrow('hash mismatch: raster.gltf');
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
