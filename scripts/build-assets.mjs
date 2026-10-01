/* global Blob, createImageBitmap, OffscreenCanvas, atob, location -- browser evaluation */
import {
  access,
  mkdir,
  mkdtemp,
  rename,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import { assetLimits } from '../src/data/assets.ts';
import { modelLimits } from '../src/data/models.ts';
import { assetRecipe } from '../src/data/asset-recipe.ts';
import {
  ingest,
  packBuffers,
  canonical,
  checksum,
  mipChain,
  encodeKTX2,
  encodePNG,
} from './asset-recipe-lib.mjs';
import { assetBrowser } from './asset-recipe-browser.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== '--input' || args[2] !== '--out')
  throw new Error(
    'Usage: node scripts/build-assets.mjs --input path/model.gltf|model.glb --out new/bundle-directory',
  );
const input = resolve(args[1]),
  output = resolve(args[3]);
try {
  await access(output);
  throw new Error(
    'Output must not exist; existing assets are never overwritten.',
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const asset = await ingest(input);
await mkdir(dirname(output), { recursive: true });
const temporary = await mkdtemp(join(dirname(output), '.xyz-assets-'));
let session;
try {
  session = await assetBrowser({
    engine: join(root, 'dist'),
    bundle: temporary,
  });
  const files = [];
  let totalBytes = 0;
  const emit = async (name, bytes) => {
    if (
      totalBytes + bytes.length > assetRecipe.outputBytes ||
      files.length >= assetRecipe.outputFiles
    )
      throw new Error('Asset bundle exceeds output budget.');
    totalBytes += bytes.length;
    await writeFile(join(temporary, name), bytes, { flag: 'wx' });
    files.push({ path: name, bytes: bytes.length, sha256: checksum(bytes) });
  };
  await emit('payload.bin', packBuffers(asset.document, asset.buffers));
  const fallback = globalThis.structuredClone(asset.document),
    imageIndices = new Map(),
    textureRecords = [];
  // Pack only images used by regular texture sources. Optional Basis sources were removed in preflight.
  const used = [
    ...new Set(
      (asset.document.textures ?? []).map((texture) => texture.source),
    ),
  ];
  const nativeImages = [],
    fallbackImages = [];
  for (const index of used) {
    if (!Number.isSafeInteger(index) || !asset.images[index])
      throw new Error('Texture has no regular image source.');
    const image = asset.images[index];
    const raster = await session.page.evaluate(
      async ({ base64, mimeType, limits }) => {
        const bytes = Uint8Array.from(atob(base64), (character) =>
          character.charCodeAt(0),
        );
        const engine = await import('/engine/src/index.js');
        if (engine.isKTX2(bytes)) {
          const container = engine.parseKTX2(bytes);
          if (
            ![23, 29, 37, 43].includes(container.vkFormat) ||
            ![0, 3].includes(container.supercompression)
          )
            throw new Error(
              'Compressed/Basis KTX2 requires a pinned external conversion; no codec is bundled.',
            );
          const image = await engine.decodeKTX2(bytes);
          return {
            width: image.width,
            height: image.height,
            rgba: Array.from(image.data),
          };
        }
        const bitmap = await createImageBitmap(
          new Blob([bytes], { type: mimeType ?? '' }),
          { colorSpaceConversion: 'none', premultiplyAlpha: 'none' },
        );
        try {
          if (
            !bitmap.width ||
            !bitmap.height ||
            bitmap.width > limits.textureDimension ||
            bitmap.height > limits.textureDimension ||
            bitmap.width * bitmap.height > limits.texturePixels
          )
            throw new Error('Image exceeds engine dimensions/pixel budget.');
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(bitmap, 0, 0);
          return {
            width: bitmap.width,
            height: bitmap.height,
            rgba: Array.from(
              context.getImageData(0, 0, bitmap.width, bitmap.height).data,
            ),
          };
        } finally {
          bitmap.close();
        }
      },
      {
        base64: image.bytes.toString('base64'),
        mimeType: image.mimeType,
        limits: assetLimits,
      },
    );
    const levels = mipChain(raster.width, raster.height, raster.rgba);
    const ktx = encodeKTX2(levels),
      png = encodePNG(levels[0]);
    const nativeName = `texture-${checksum(ktx)}.ktx2`,
      fallbackName = `texture-${checksum(png)}.png`;
    if (!files.some((file) => file.path === nativeName))
      await emit(nativeName, ktx);
    if (!files.some((file) => file.path === fallbackName))
      await emit(fallbackName, png);
    imageIndices.set(index, nativeImages.length);
    nativeImages.push({ uri: nativeName, mimeType: 'image/ktx2' });
    fallbackImages.push({ uri: fallbackName, mimeType: 'image/png' });
    textureRecords.push({
      image: nativeImages.length - 1,
      width: raster.width,
      height: raster.height,
      levels: levels.length,
      format: 'rgba8unorm',
      native: nativeName,
      fallback: fallbackName,
    });
  }
  asset.document.images = nativeImages;
  fallback.images = fallbackImages;
  for (const document of [asset.document, fallback])
    for (const texture of document.textures ?? [])
      texture.source = imageIndices.get(texture.source);
  for (const [name, document] of [
    ['model.gltf', asset.document],
    ['fallback.gltf', fallback],
  ]) {
    const bytes = Buffer.from(canonical(document) + '\n');
    if (bytes.length > modelLimits.inputBytes)
      throw new Error('Output glTF exceeds engine input budget.');
    await emit(name, bytes);
  }
  // The packaged parser, not a parallel validator, proves accessor/material/animation compatibility.
  for (const [name, nativeTextures] of [
    ['model.gltf', true],
    ['fallback.gltf', false],
  ])
    await session.page.evaluate(
      async ({ name, nativeTextures }) => {
        const { GLTFLoader } = await import('/engine/src/index.js');
        const asset = await new GLTFLoader().load(
          new URL(`/bundle/${name}`, location.href).href,
          { nativeTextures },
        );
        asset.dispose();
      },
      { name, nativeTextures },
    );
  const manifest = {
    version: 1,
    profile: 'xyz-gltf2-triangles-uv0-rgba8',
    toolchain: session.toolchain,
    codecs: {
      meshopt: 'engine-built-in-decoder-preserve-only',
      draco: 'not-included',
      basis: 'not-included',
      texture: 'uncompressed-rgba8',
    },
    model: {
      url: 'model.gltf',
      options: { nativeTextures: true },
      fallback: 'fallback.gltf',
      fallbackOptions: { nativeTextures: false },
    },
    textures: textureRecords,
    sources: asset.sources,
    files: [...files].sort((a, b) =>
      a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
    ),
  };
  await emit('manifest.json', Buffer.from(canonical(manifest) + '\n'));
  await emit(
    'SHA256SUMS',
    Buffer.from(files.map((file) => `${file.sha256}  ${file.path}\n`).join('')),
  );
  await session.close();
  session = undefined;
  // Exclusive reservation avoids replacing an existing directory even if another build races us.
  await mkdir(output);
  try {
    await rename(temporary, output);
  } catch (error) {
    await rmdir(output);
    throw error;
  }
  console.log(
    JSON.stringify({
      output,
      profile: manifest.profile,
      files: files.length,
      bytes: totalBytes,
      manifest: checksum(Buffer.from(canonical(manifest) + '\n')),
    }),
  );
} finally {
  try {
    if (session) await session.close();
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
