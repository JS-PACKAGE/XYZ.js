#!/usr/bin/env node
/* global Blob, createImageBitmap, OffscreenCanvas, atob, location, window -- browser evaluation */
import {
  access,
  mkdir,
  mkdtemp,
  rename,
  rm,
  rmdir,
  writeFile,
  realpath,
} from 'node:fs/promises';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import {
  assetLimits,
  modelLimits,
  assetRecipe,
  engineDirectory,
  recipeDirectory,
} from './asset-tool-paths.mjs';
import { setTimeout, clearTimeout } from 'node:timers';
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
import {
  externalCodecs,
  loadRecipeProfile,
  platformFormats,
} from './asset-recipe-codecs.mjs';

export async function buildAssets(
  args = process.argv.slice(2),
  { signal, quiet = false } = {},
) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'Usage: xyz-build-assets --input model.gltf|model.glb --out new-directory [--profile trusted-profile.json]',
    );
    return;
  }
  signal?.throwIfAborted();
  if (
    (args.length !== 4 && args.length !== 6) ||
    args[0] !== '--input' ||
    args[2] !== '--out' ||
    (args.length === 6 && args[4] !== '--profile')
  )
    throw new Error(
      'Usage: node scripts/build-assets.mjs --input path/model.gltf|model.glb --out new/bundle-directory [--profile trusted-profile.json]',
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
  const profilePath = args.length === 6 ? resolve(args[5]) : undefined;
  const profile = await loadRecipeProfile(profilePath);
  await mkdir(dirname(output), { recursive: true });
  const temporary = await mkdtemp(join(dirname(output), '.xyz-assets-'));
  let session;
  const abort = () => {
    if (session) void session.close().catch(() => {});
  };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const codecs = await externalCodecs(profile, profilePath, temporary);
    const asset = await ingest(input, codecs);
    let dracoDocument;
    if (profile.draco) {
      await codecs.encodeDraco(asset);
      dracoDocument = globalThis.structuredClone(asset.document);
      for (const mesh of asset.document.meshes ?? [])
        for (const primitive of mesh.primitives ?? [])
          delete primitive.extensions?.KHR_draco_mesh_compression;
      asset.document.extensionsUsed = (
        asset.document.extensionsUsed ?? []
      ).filter((n) => n !== 'KHR_draco_mesh_compression');
      asset.document.extensionsRequired = (
        asset.document.extensionsRequired ?? []
      ).filter((n) => n !== 'KHR_draco_mesh_compression');
    }
    session = await assetBrowser({
      engine: engineDirectory,
      bundle: temporary,
      recipe: recipeDirectory,
      ...(codecs.dracoPaths
        ? {
            decoder: dirname(codecs.dracoPaths.decoder),
            decoderWasm: dirname(codecs.dracoPaths.decoderWasm),
          }
        : {}),
    });
    signal?.throwIfAborted();
    const evaluate = async (fn, argument) => {
      let timer;
      try {
        return await Promise.race([
          session.page.evaluate(fn, argument),
          new Promise((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new Error(
                    'Asset browser preflight exceeded its finite deadline.',
                  ),
                ),
              assetRecipe.codecTimeoutMilliseconds,
            );
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    };
    if (codecs.dracoPaths)
      await evaluate(
        async ({ script, wasm }) => {
          const { createDracoBrowserDecoder } =
            await import('/recipe/asset-recipe-browser-codecs.mjs');
          window.recipeDracoDecoder = await createDracoBrowserDecoder(
            script,
            wasm,
          );
        },
        {
          script: `/decoder/${basename(codecs.dracoPaths.decoder)}`,
          wasm: `/decoderWasm/${basename(codecs.dracoPaths.decoderWasm)}`,
        },
      );
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
    if (dracoDocument) packBuffers(dracoDocument, asset.buffers);
    const fallback = globalThis.structuredClone(asset.document),
      imageIndices = new Map(),
      textureRecords = [];
    const variantImages = Object.fromEntries(
      profile.formats.map((format) => [format, []]),
    );
    const variantModels = [];
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
      let image = asset.images[index];
      if (
        image.mimeType === 'image/ktx2' ||
        image.bytes.subarray(0, 4).equals(Buffer.from([171, 75, 84, 88]))
      ) {
        const vk = image.bytes.length >= 48 ? image.bytes.readUInt32LE(12) : -1;
        const compression =
          image.bytes.length >= 48 ? image.bytes.readUInt32LE(44) : -1;
        if (![23, 29, 37, 43].includes(vk) || ![0, 3].includes(compression))
          image = {
            bytes: await codecs.decodeBasis(image.bytes),
            mimeType: 'image/png',
          };
      }
      const raster = await evaluate(
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
            const context = canvas.getContext('2d', {
              willReadFrequently: true,
            });
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
      const semantics =
        profile.textures[String(index)] ?? profile.defaultTexture;
      if (!semantics)
        throw new Error(
          `Image ${index} requires explicit texture semantics in --profile.`,
        );
      const levels = mipChain(
        raster.width,
        raster.height,
        raster.rgba,
        semantics,
      );
      const compressed = await codecs.encodeTexture(levels, semantics);
      const variants = {};
      for (const format of profile.formats) {
        const bytes = compressed.variants[format];
        const name = `texture-${checksum(bytes)}.ktx2`;
        if (!files.some((file) => file.path === name)) await emit(name, bytes);
        variantImages[format].push({ uri: name, mimeType: 'image/ktx2' });
        variants[format] = {
          path: name,
          format: platformFormats[format].format,
        };
      }
      let basisName;
      if (compressed.basis) {
        basisName = `texture-${checksum(compressed.basis)}.ktx2`;
        if (!files.some((file) => file.path === basisName))
          await emit(basisName, compressed.basis);
      }
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
        semantics,
        variants,
        ...(basisName ? { basis: basisName } : {}),
        fallback: fallbackName,
      });
    }
    asset.document.images = nativeImages;
    fallback.images = fallbackImages;
    for (const document of [asset.document, fallback])
      for (const texture of document.textures ?? [])
        texture.source = imageIndices.get(texture.source);
    const documents = [
      {
        name: 'model.gltf',
        document: asset.document,
        nativeTextures: true,
        formats: ['rgba8unorm'],
        codec: 'none',
      },
      {
        name: 'fallback.gltf',
        document: fallback,
        nativeTextures: false,
        formats: [],
        codec: 'none',
      },
    ];
    for (const format of profile.formats) {
      const document = globalThis.structuredClone(asset.document);
      document.images = variantImages[format];
      documents.unshift({
        name: `model-${format}.gltf`,
        document,
        nativeTextures: true,
        formats: [platformFormats[format].format],
        codec: 'none',
      });
    }
    if (dracoDocument) {
      for (const variant of [...documents]) {
        const document = globalThis.structuredClone(dracoDocument);
        document.images = variant.document.images;
        for (const texture of document.textures ?? [])
          texture.source = imageIndices.get(texture.source);
        documents.unshift({
          ...variant,
          name: variant.name.replace('.gltf', '-draco.gltf'),
          document,
          codec: 'draco',
        });
      }
    }
    for (const variant of documents) {
      const bytes = Buffer.from(canonical(variant.document) + '\n');
      if (bytes.length > modelLimits.inputBytes)
        throw new Error('Output glTF exceeds engine input budget.');
      await emit(variant.name, bytes);
      variantModels.push({
        path: variant.name,
        nativeTextures: variant.nativeTextures,
        formats: variant.formats,
        codec: variant.codec,
      });
    }
    // The packaged parser, not a parallel validator, proves accessor/material/animation compatibility.
    for (const { name, nativeTextures } of documents)
      await evaluate(
        async ({ name, nativeTextures }) => {
          const { GLTFLoader } = await import('/engine/src/index.js');
          const asset = await new GLTFLoader().load(
            new URL(`/bundle/${name}`, location.href).href,
            { nativeTextures, dracoDecoder: window.recipeDracoDecoder },
          );
          asset.dispose();
        },
        { name, nativeTextures },
      );
    const manifest = {
      version: assetRecipe.version,
      profile: assetRecipe.bundleProfile,
      toolchain: { ...session.toolchain, external: codecs.tools },
      codecs: {
        meshopt: 'engine-built-in-decoder-preserve-only',
        draco: codecs.tools.draco ? 'official-draco3d-1.5.7' : 'not-configured',
        basis: codecs.basis ? 'official-basis-2.50-uastc' : 'not-configured',
        texture: profile.formats,
      },
      model: {
        url: 'model.gltf',
        options: { nativeTextures: true },
        fallback: 'fallback.gltf',
        fallbackOptions: { nativeTextures: false },
      },
      variants: variantModels,
      textures: textureRecords,
      sources: asset.sources,
      files: [...files].sort((a, b) =>
        a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
      ),
    };
    await emit('manifest.json', Buffer.from(canonical(manifest) + '\n'));
    await emit(
      'SHA256SUMS',
      Buffer.from(
        files.map((file) => `${file.sha256}  ${file.path}\n`).join(''),
      ),
    );
    await session.close();
    session = undefined;
    // Exclusive reservation avoids replacing an existing directory even if another build races us.
    signal?.throwIfAborted();
    await mkdir(output);
    try {
      await rename(temporary, output);
    } catch (error) {
      await rmdir(output);
      throw error;
    }
    if (!quiet)
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
    signal?.removeEventListener('abort', abort);
    try {
      if (session) await session.close();
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
}

if (
  process.argv[1] &&
  (await realpath(process.argv[1]).catch(() => undefined)) ===
    fileURLToPath(import.meta.url)
)
  await buildAssets();
