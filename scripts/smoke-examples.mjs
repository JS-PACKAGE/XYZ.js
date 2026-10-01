/* global window, document, requestAnimationFrame -- used inside page.evaluate, which runs in the browser */
import { readdir, readFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium, firefox, webkit } from 'playwright-core';

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

async function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  try {
    await access(chromium.executablePath());
    return chromium.executablePath();
  } catch {
    const cache =
      process.env.PLAYWRIGHT_BROWSERS_PATH ||
      (process.platform === 'darwin'
        ? join(homedir(), 'Library/Caches/ms-playwright')
        : join(homedir(), '.cache/ms-playwright'));
    for (const name of (await readdir(cache))
      .filter((name) => name.startsWith('chromium-'))
      .sort()
      .reverse()) {
      for (const suffix of [
        'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-linux/chrome',
        'chrome-linux64/chrome',
        'chrome-win/chrome.exe',
        'chrome-win64/chrome.exe',
      ]) {
        const path = resolve(cache, name, suffix);
        try {
          await access(path);
          return path;
        } catch {
          /* Try the next cache layout. */
        }
      }
    }
    throw new Error(
      'Chromium not found. Install it with npx playwright-core install chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.',
    );
  }
}

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
    if (backends && supported.length && !supported.includes(backends)) continue;
    examples.push({ slug: entry.name, renderer });
  }
}
if (!examples.length) throw new Error('No matching examples/backends.');
const server = await createServer({
  root,
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser;
const results = [];
try {
  await server.listen();
  browser = await browserType.launch({
    headless: true,
    ...(browserName === 'chromium'
      ? {
          executablePath: await chromiumPath(),
          args: [
            '--enable-unsafe-webgpu',
            '--enable-features=Vulkan',
            '--use-angle=metal',
          ],
        }
      : {}),
  });
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
        if (!context) return 'unavailable: 2D readback context';
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
              if (error.name === 'SecurityError')
                resolve('unavailable: cross-origin canvas');
              else reject(error);
            }
          }),
        );
      });
    } catch (error) {
      errors.push(error.message);
    }
    results.push({
      example: slug,
      renderer,
      pixels,
      result: errors.length ? 'FAIL' : 'PASS',
      errors: [...new Set(errors)].join(' | '),
    });
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
console.table(results);
console.log(
  `${results.filter((row) => row.result === 'PASS').length}/${results.length} passed`,
);
if (results.some((row) => row.result === 'FAIL')) process.exitCode = 1;
