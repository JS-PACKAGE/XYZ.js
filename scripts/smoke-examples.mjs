/* global window, document, requestAnimationFrame -- used inside page.evaluate, which runs in the browser */
import { readdir, readFile, access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium, firefox, webkit } from 'playwright-core';
import { chromiumLaunchOptions } from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
function option(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? fallback : args[index + 1];
}
const browserName = option('browser', 'chromium');
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error('Use --browser chromium|firefox|webkit.');
const port = Number(option('port', '5206'));
const only = option('example', undefined);
const backends = option('renderer', undefined);

const gallery = await readFile(join(root, 'examples/index.ts'), 'utf8');
const metadata = new Map();
for (const match of gallery.matchAll(
  /slug: '([^']+)'[\s\S]*?renderers: (all2d|only3d|\[[^\]]*\])/g,
)) {
  metadata.set(
    match[1],
    match[2] === 'all2d'
      ? ['auto', 'webgpu', 'webgl2', 'canvas2d']
      : match[2] === 'only3d'
        ? ['auto', 'webgpu', 'webgl2']
        : [...match[2].matchAll(/'([^']+)'/g)].map((value) => value[1]),
  );
}
const examples = [];
for (const entry of await readdir(join(root, 'examples'), {
  withFileTypes: true,
})) {
  if (!entry.isDirectory() || (only && entry.name !== only)) continue;
  try {
    await access(join(root, 'examples', entry.name, 'index.html'));
  } catch {
    continue;
  }
  if (!metadata.has(entry.name))
    throw new Error(`Missing gallery backend metadata: ${entry.name}`);
  const supported = metadata.get(entry.name);
  for (const renderer of backends
    ? [backends]
    : supported.length
      ? supported
      : ['default']) {
    if (backends && !supported.includes(backends)) continue;
    examples.push({ slug: entry.name, renderer });
  }
}
if (!examples.length) throw new Error('No matching examples/backends.');
const directory = join(
  root,
  '.vite/example-smoke',
  `${browserName}-${encodeURIComponent(only ?? 'all')}-${encodeURIComponent(backends ?? 'all')}`,
);
await mkdir(directory, { recursive: true });
const server = await createServer({
  root,
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser;
let startupError;
const results = [];
try {
  await server.listen();
  browser = await browserType.launch(
    browserName === 'chromium'
      ? await chromiumLaunchOptions()
      : { headless: true },
  );
  console.log(
    `${browserName} ${browser.version()} · ${process.platform}/${process.arch}`,
  );
  for (const { slug, renderer } of examples) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const errors = [];
    const allow = (text) =>
      renderer === 'canvas2d' &&
      /^Canvas2D has no 3D(?:; 2D \+ audio remain available)?\.?$/.test(text);
    // Browsers request /favicon.ico on their own; the examples do not ship one.
    const favicon = (message) =>
      message.location().url.endsWith('/favicon.ico');
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !allow(message.text()) &&
        !favicon(message)
      )
        errors.push(message.text());
    });
    page.on('pageerror', (error) => {
      if (!allow(error.message)) errors.push(error.message);
    });
    await page.exposeFunction('__smokeRejection', (message) => {
      if (!allow(message)) errors.push(`unhandledrejection: ${message}`);
    });
    await page.addInitScript(() => {
      window.addEventListener('unhandledrejection', (event) => {
        window.__smokeRejection(String(event.reason?.stack ?? event.reason));
      });
    });
    let pixels = 'not read';
    try {
      await page.goto(
        `http://127.0.0.1:${port}/examples/${slug}/?renderer=${renderer === 'default' ? 'auto' : renderer}`,
        { waitUntil: 'networkidle', timeout: 30000 },
      );
      await page
        .locator('canvas')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(1500);
      pixels = await page.evaluate(async () => {
        const source = document.querySelector('canvas');
        if (!source || !source.width || !source.height)
          throw new Error('Canvas has no backing pixels.');
        const copy = document.createElement('canvas');
        copy.width = 64;
        copy.height = 64;
        const context = copy.getContext('2d', { willReadFrequently: true });
        if (!context)
          throw new Error('Pixel readback unavailable: 2D copy context.');
        return await new Promise((resolve, reject) =>
          requestAnimationFrame(() => {
            try {
              context.drawImage(source, 0, 0, 64, 64);
              const bytes = context.getImageData(0, 0, 64, 64).data;
              for (let i = 4; i < bytes.length; i += 4) {
                if (
                  bytes[i] !== bytes[0] ||
                  bytes[i + 1] !== bytes[1] ||
                  bytes[i + 2] !== bytes[2] ||
                  bytes[i + 3] !== bytes[3]
                ) {
                  resolve('non-blank');
                  return;
                }
              }
              reject(new Error('Canvas pixels are uniform/blank.'));
            } catch (error) {
              reject(error);
            }
          }),
        );
      });
    } catch (error) {
      errors.push(error.stack ?? error.message ?? String(error));
    }
    if (errors.length)
      await page
        .screenshot({
          path: join(directory, `${slug}-${renderer}-failure.png`),
        })
        .catch((error) =>
          errors.push(`Failure screenshot unavailable: ${error.message}`),
        );
    results.push({
      example: slug,
      renderer,
      pixels,
      result: errors.length ? 'FAIL' : 'PASS',
      errors: [...new Set(errors)].join(' | '),
    });
    await page.close();
  }
} catch (error) {
  startupError = error.stack ?? error.message ?? String(error);
  if (error.cause)
    startupError += `\nCaused by: ${error.cause.stack ?? error.cause.message ?? String(error.cause)}`;
} finally {
  try {
    await writeFile(
      join(directory, 'results.json'),
      JSON.stringify(
        {
          browser: browser?.version(),
          platform: `${process.platform}/${process.arch}`,
          ...(startupError ? { error: startupError } : {}),
          results,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser?.close();
    await server.close();
  }
}
if (startupError) console.error(startupError);
console.table(results);
console.log(
  `${results.filter((row) => row.result === 'PASS').length}/${results.length} passed`,
);
if (
  startupError ||
  !results.length ||
  results.some((row) => row.result === 'FAIL')
)
  process.exitCode = 1;
