#!/usr/bin/env node
/* global location, AbortController -- isolated browser preflight and Node cancellation */
import {
  mkdir,
  mkdtemp,
  writeFile,
  rename,
  rmdir,
  rm,
  access,
  realpath,
} from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import { setTimeout, clearTimeout } from 'node:timers';
import {
  scanProject,
  ProjectError,
  jsonLocation,
} from './asset-project-lib.mjs';
import { canonical, checksum } from './asset-recipe-lib.mjs';
import { assetBrowser } from './asset-recipe-browser.mjs';
import { buildAssets } from './build-assets.mjs';
import {
  engineDirectory,
  recipeDirectory,
  assetRecipe,
} from './asset-tool-paths.mjs';

export async function assetProject(
  args = process.argv.slice(2),
  { signal } = {},
) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'Usage: xyz-assets preflight|build --manifest project.json [--out new-directory] [--profile trusted-profile.json]',
    );
    return;
  }
  const [command, ...flags] = args;
  if (!['preflight', 'build'].includes(command) || flags.length % 2)
    throw new Error(
      'Usage: xyz-assets preflight|build --manifest project.json [--out new-directory] [--profile trusted-profile.json]',
    );
  const options = new Map();
  for (let i = 0; i < flags.length; i += 2) {
    if (
      !['--manifest', '--out', '--profile'].includes(flags[i]) ||
      options.has(flags[i])
    )
      throw new Error(`Unknown or duplicate option: ${flags[i]}`);
    options.set(flags[i], flags[i + 1]);
  }
  if (
    !options.get('--manifest') ||
    (command === 'build') !== options.has('--out') ||
    (command === 'preflight' && options.has('--profile'))
  )
    throw new Error(
      'preflight requires --manifest; build requires --manifest and --out; --profile is build-only.',
    );
  const project = await scanProject(resolve(options.get('--manifest')), {
    signal,
  });
  const output = options.has('--out')
    ? resolve(options.get('--out'))
    : undefined;
  if (output) {
    try {
      await access(output);
      throw new Error(
        'Output must not exist; existing assets are never overwritten.',
      );
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await mkdir(dirname(output), { recursive: true });
  }
  const staging = await mkdtemp(
    join(output ? dirname(output) : tmpdir(), '.xyz-project-'),
  );
  let session;
  const abort = () => {
    if (session) void session.close().catch(() => {});
  };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    // Browser validation reads a bounded immutable snapshot, never arbitrary user files.
    for (const file of project.files.values()) {
      signal?.throwIfAborted();
      const target = join(staging, file.path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.data, { flag: 'wx' });
    }
    session = await assetBrowser({
      engine: engineDirectory,
      project: staging,
      recipe: recipeDirectory,
    });
    const allowed = new Set(
      [...project.files.keys()].map(
        (path) =>
          new URL(
            `/project/${path.split('/').map(encodeURIComponent).join('/')}`,
            session.origin,
          ).href,
      ),
    );
    await session.page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (
        url.origin === session.origin &&
        (url.pathname.startsWith('/engine/') || allowed.has(url.href))
      )
        await route.continue();
      else await route.abort('accessdenied');
    });
    for (const { entry, file, index } of project.ids.values()) {
      signal?.throwIfAborted();
      // Recipe conversion proves all generated variants through the official loader.
      if (command === 'build' && entry.recipe) continue;
      let timer;
      try {
        const result = await Promise.race([
          session.page.evaluate(
            async ({ entry, path }) => {
              const engine = await import('/engine/src/index.js');
              const url = new URL(`/project/${path}`, location.href).href;
              const loader = new engine.AssetLoader();
              const pool = new engine.ResourcePool(loader);
              let asset;
              try {
                if (entry.type === 'model')
                  asset = await new engine.GLTFLoader().load(
                    url,
                    entry.options ?? {},
                  );
                else if (entry.type === 'map')
                  asset = await engine.loadTiledMap(pool, url);
                else if (entry.type === 'atlas')
                  asset = await new engine.AtlasLoader().load(url);
                else if (entry.type === 'bitmapFont')
                  asset = await new engine.BitmapFontLoader(loader).load(url);
                else if (entry.type === 'font')
                  asset = await engine.FontAsset.load(
                    loader,
                    url,
                    entry.options ?? { family: `xyz-preflight-${entry.id}` },
                  );
                else if (entry.type === 'texture')
                  asset = await loader.loadTextureOwned(url);
                else if (entry.type === 'tileset') {
                  const document = await loader.loadJSON(url);
                  const parsed = engine.parseTiledTileset(
                    document,
                    1,
                    'tileset',
                  );
                  asset = await loader.loadTextureOwned(
                    new URL(parsed.image, url).href,
                  );
                  if (
                    asset.width !== parsed.imageWidth ||
                    asset.height !== parsed.imageHeight
                  )
                    throw new Error(
                      'Decoded tileset image dimensions differ from declaration.',
                    );
                } else if (entry.type === 'json') await loader.loadJSON(url);
                else if (entry.type === 'text') await loader.loadText(url);
                else await loader.loadBinary(url);
                return { ok: true };
              } catch (error) {
                return {
                  ok: false,
                  message: error.message,
                  path: error.path ?? '/',
                };
              } finally {
                if (asset?.dispose) asset.dispose();
                else asset?.destroy();
                pool.destroy();
                loader.destroy();
              }
            },
            {
              entry,
              path: file.path.split('/').map(encodeURIComponent).join('/'),
            },
          ),
          new Promise((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new ProjectError(
                    file.source,
                    '/',
                    'Runtime preflight exceeded finite deadline.',
                  ),
                ),
              assetRecipe.codecTimeoutMilliseconds,
            );
          }),
        ]);
        if (!result.ok)
          throw new ProjectError(
            file.source,
            jsonLocation(result.path),
            result.message,
          );
      } catch (error) {
        signal?.throwIfAborted();
        if (error instanceof ProjectError) throw error;
        throw new ProjectError(
          project.manifestPath,
          `/entries/${index}`,
          error.message,
          { cause: error },
        );
      } finally {
        clearTimeout(timer);
      }
    }
    const toolchain = session.toolchain;
    await session.close();
    session = undefined;
    const manifest = globalThis.structuredClone(project.manifest);
    if (command === 'build') {
      for (const [index, entry] of manifest.entries.entries()) {
        signal?.throwIfAborted();
        if (!entry.recipe) continue;
        const directory = `__xyz/model-${index}`;
        await buildAssets(
          [
            '--input',
            join(staging, project.ids.get(entry.id).file.path),
            '--out',
            join(staging, directory),
            ...(options.has('--profile')
              ? ['--profile', resolve(options.get('--profile'))]
              : []),
          ],
          { signal, quiet: true },
        );
        entry.url = `${directory}/model.gltf`;
        entry.descriptor = `${directory}/manifest.json`;
        entry.options = { ...(entry.options ?? {}), nativeTextures: true };
        delete entry.recipe;
      }
      signal?.throwIfAborted();
      const files = [];
      const { readdir, readFile } = await import('node:fs/promises');
      const inventory = async (directory, base = '') => {
        for (const item of await readdir(directory, { withFileTypes: true })) {
          const path = base + item.name;
          if (item.isDirectory())
            await inventory(join(directory, item.name), `${path}/`);
          else {
            const data = await readFile(join(directory, item.name));
            files.push({ path, bytes: data.length, sha256: checksum(data) });
          }
        }
      };
      await inventory(staging);
      if (
        files.length + 2 > assetRecipe.outputFiles ||
        files.reduce((sum, file) => sum + file.bytes, 0) >
          assetRecipe.outputBytes
      )
        throw new Error('Generated project exceeds output budget.');
      files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
      const deployment = { ...manifest, toolchain, files };
      const data = Buffer.from(canonical(deployment) + '\n');
      const sums =
        files.map((file) => `${file.sha256}  ${file.path}\n`).join('') +
        `${checksum(data)}  project-manifest.json\n`;
      if (
        Buffer.byteLength(sums) +
          data.length +
          files.reduce((sum, file) => sum + file.bytes, 0) >
        assetRecipe.outputBytes
      )
        throw new Error('Generated manifest exceeds output budget.');
      await writeFile(join(staging, 'project-manifest.json'), data, {
        flag: 'wx',
      });
      await writeFile(join(staging, 'SHA256SUMS'), sums, { flag: 'wx' });
      // Exclusive ownership reservation: never replace an existing destination.
      signal?.throwIfAborted();
      await mkdir(output);
      try {
        await rename(staging, output);
      } catch (error) {
        await rmdir(output);
        throw error;
      }
    }
    const report = {
      status: 'passed',
      command,
      entries: manifest.entries.length,
      files: project.files.size,
      output: output ?? null,
      toolchain,
    };
    console.log(JSON.stringify(report));
    return report;
  } finally {
    signal?.removeEventListener('abort', abort);
    try {
      if (session) await session.close();
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
}

// Normalize both paths: native realpath expands Windows 8.3 aliases unlike the ESM loader.
if (
  process.argv[1] &&
  (await realpath(process.argv[1]).catch(() => undefined)) ===
    (await realpath(fileURLToPath(import.meta.url)))
) {
  const controller = new AbortController();
  const interrupt = () =>
    controller.abort(new Error('Asset project interrupted.'));
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    await assetProject(undefined, { signal: controller.signal });
  } catch (error) {
    console.error(
      JSON.stringify({
        status: 'failed',
        file: error.file ?? null,
        location: error.location ?? '/',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
