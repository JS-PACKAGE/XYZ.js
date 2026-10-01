import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import { createRequire } from 'node:module';
import { URL } from 'node:url';
import process from 'node:process';
import { chromium } from 'playwright-core';
import { chromiumLaunchOptions } from './browser-launch.mjs';
import { assetRecipe } from '../src/data/asset-recipe.ts';
import { checksum } from './asset-recipe-lib.mjs';
const require = createRequire(import.meta.url);

export async function assetBrowser(mounts) {
  if (process.versions.node !== assetRecipe.node)
    throw new Error(`Asset recipe requires Node ${assetRecipe.node}.`);
  const packagePath = require.resolve('playwright-core/package.json');
  const metadata = JSON.parse(await readFile(packagePath, 'utf8'));
  if (metadata.version !== assetRecipe.playwright)
    throw new Error(
      `Asset recipe requires playwright-core ${assetRecipe.playwright}.`,
    );
  const revisions = JSON.parse(
    await readFile(resolve(packagePath, '../browsers.json'), 'utf8'),
  );
  const pin = revisions.browsers.find((entry) => entry.name === 'chromium');
  if (
    pin.browserVersion !== assetRecipe.chromium ||
    pin.revision !== assetRecipe.chromiumRevision
  )
    throw new Error('Chromium metadata does not match the asset recipe pin.');
  const roots = Object.fromEntries(
    await Promise.all(
      Object.entries(mounts).map(async ([prefix, path]) => [
        prefix,
        await realpath(path),
      ]),
    ),
  );
  const requests = [];
  const server = createServer(async (request, response) => {
    const observation = { url: request.url, method: request.method };
    response.once('finish', () => {
      if (requests.length < assetRecipe.outputFiles)
        requests.push({
          ...observation,
          status: response.statusCode,
        });
    });
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
      if (pathname === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(
          '<!doctype html><meta charset="utf-8"><title>Asset recipe consumer</title><canvas id="game"></canvas><button id="unlock">Unlock audio</button>',
        );
        return;
      }
      if (pathname === '/favicon.ico') {
        response.writeHead(204);
        response.end();
        return;
      }
      const prefix = Object.keys(roots).find((key) =>
        pathname.startsWith(`/${key}/`),
      );
      if (!prefix) throw new Error('Unknown mount.');
      const path = await realpath(
        resolve(roots[prefix], pathname.slice(prefix.length + 2)),
      );
      const rel = relative(roots[prefix], path);
      if (
        rel.startsWith('..') ||
        isAbsolute(rel) ||
        !(await stat(path)).isFile()
      )
        throw new Error('Forbidden file.');
      const type =
        {
          '.js': 'text/javascript',
          '.json': 'application/json',
          '.gltf': 'model/gltf+json',
          '.ktx2': 'image/ktx2',
          '.png': 'image/png',
          '.bin': 'application/octet-stream',
          '.wasm': 'application/wasm',
        }[extname(path)] ?? 'application/octet-stream';
      const payload = await readFile(path);
      observation.bytes = payload.length;
      if (pathname.includes('/vendor/opm/dist/worklet/'))
        observation.sha256 = checksum(payload);
      response.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'no-store',
      });
      response.end(payload);
    } catch (error) {
      observation.error = error.message;
      response.writeHead(404);
      response.end('Not found');
    }
  });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    browser = await chromium.launch(await chromiumLaunchOptions());
    if (browser.version() !== pin.browserVersion)
      throw new Error(
        `Chromium ${browser.version()} does not match pinned ${pin.browserVersion} (revision ${pin.revision}). Install the repository-pinned Chromium; unknown executables are not accepted.`,
      );
    const page = await browser.newPage();
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.goto(origin);
    return {
      page,
      origin,
      requests,
      toolchain: {
        recipe: assetRecipe.version,
        node: assetRecipe.node,
        playwright: metadata.version,
        chromium: pin.browserVersion,
        revision: pin.revision,
        raster: 'chromium-imagebitmap-rgba8-no-colorspace-conversion',
        mip: 'integer-box-v1',
        ktx2: 'rgba8-unorm-v1',
        png: 'zlib-level9-filter0-v1',
      },
      close: async () => {
        try {
          await browser.close();
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      },
    };
  } catch (error) {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
}
