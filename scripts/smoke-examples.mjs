/* global window, getComputedStyle -- used inside page.evaluate, which runs in the browser */
import { readdir, readFile, access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium, firefox, webkit } from 'playwright-core';
import {
  browserLaunchOptions,
  browserIdentity,
  probeBackends,
} from './browser-launch.mjs';
import { pngPixels } from './site-smoke-support.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const options = new Map();
for (let index = 0; index < args.length; index++) {
  const name = args[index];
  if (!['--browser', '--port', '--example', '--renderer'].includes(name))
    throw new Error(`Unknown option ${name}.`);
  const value = args[++index];
  if (!value || value.startsWith('--'))
    throw new Error(`${name} needs a value.`);
  options.set(name.slice(2), value);
}
function option(name, fallback) {
  return options.get(name) ?? fallback;
}
const browserName = option('browser', 'chromium');
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error('Use --browser chromium|firefox|webkit.');
const port = Number(option('port', '5206'));
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Port must be an integer from 1 to 65535.');
const only = option('example', undefined);
const backends = option('renderer', undefined);
if (backends && !['auto', 'canvas2d', 'webgl2', 'webgpu'].includes(backends))
  throw new Error('Use --renderer auto|canvas2d|webgl2|webgpu.');
await access(join(root, 'dist/src/index.js')).catch(() => {
  throw new Error(
    'Built root entry missing. Run pnpm build before smoke:examples.',
  );
});

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
    if (backends && !supported.includes(backends))
      throw new Error(
        `${entry.name} does not support explicit renderer ${backends}.`,
      );
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
  resolve: {
    alias: [
      {
        find: '../../src/index.js',
        replacement: join(root, 'dist/src/index.js'),
      },
    ],
  },
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser;
let startupError;
let launch;
let capabilities;
const results = [];
try {
  await server.listen();
  launch = await browserLaunchOptions(browserName);
  browser = await browserType.launch(launch);
  const probe = await browser.newPage();
  try {
    await probe.goto(`http://127.0.0.1:${port}/tests/browser/probe.html`);
    capabilities = await probeBackends(probe);
  } finally {
    await probe.close();
  }
  console.log(
    `${browserName} ${browser.version()} · ${process.platform}/${process.arch}`,
  );
  for (const { slug, renderer } of examples) {
    if (capabilities[renderer] && !capabilities[renderer].available) {
      const mandatory =
        !!backends ||
        renderer === 'canvas2d' ||
        (browserName === 'chromium' && renderer === 'webgl2');
      results.push({
        example: slug,
        renderer,
        result: mandatory ? 'FAIL' : 'UNSUPPORTED',
        pixels: 'not exercised',
        errors: capabilities[renderer].reason,
      });
      continue;
    }
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
      const canvas = page.locator('canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 15000 });
      await canvas.scrollIntoViewIfNeeded();
      const clip = await canvas.evaluate((element) => {
        if (!element.width || !element.height)
          throw new Error('Canvas has no backing pixels.');
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const left =
          parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
        const right =
          parseFloat(style.borderRightWidth) + parseFloat(style.paddingRight);
        const top =
          parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
        const bottom =
          parseFloat(style.borderBottomWidth) + parseFloat(style.paddingBottom);
        return {
          x: box.x + left,
          y: box.y + top,
          width: box.width - left - right,
          height: box.height - top - bottom,
        };
      });
      const deadline = Date.now() + 15000;
      do {
        // Presented pixels remain readable when a paused WebGPU backbuffer does not.
        const png = await page.screenshot({
          clip,
          type: 'png',
          path: join(directory, `${slug}-${renderer}-canvas.png`),
        });
        if (pngPixels(png).nonuniform) {
          pixels = 'non-blank';
          break;
        }
      } while (Date.now() < deadline);
      if (pixels !== 'non-blank')
        throw new Error(
          'Canvas pixels are uniform/blank after initialization timeout.',
        );
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
          ...browserIdentity(browserName, browser, launch),
          capabilities,
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
