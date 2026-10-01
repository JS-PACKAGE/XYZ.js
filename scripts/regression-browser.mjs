/* global document, navigator -- used only inside Playwright browser callbacks */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { chromiumLaunchOptions } from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const options = new Map();
for (let index = 0; index < args.length; index++) {
  const name = args[index];
  if (name === '--require-webgpu') options.set(name, true);
  else if (['--renderer', '--port', '--output'].includes(name)) {
    const value = args[++index];
    if (!value || value.startsWith('--'))
      throw new Error(`${name} needs a value.`);
    options.set(name, value);
  } else
    throw new Error(
      `Unknown option ${name}. Use --renderer canvas2d,webgl2,webgpu, --require-webgpu, --output DIR, or --port PORT.`,
    );
}
const explicitlySelected = options.has('--renderer');
const selected = (options.get('--renderer') ?? 'canvas2d,webgl2').split(',');
if (selected.some((name) => !['canvas2d', 'webgl2', 'webgpu'].includes(name)))
  throw new Error(
    'Renderers must be canvas2d, webgl2, or webgpu (comma separated).',
  );
if (new Set(selected).size !== selected.length)
  throw new Error('Do not select a backend twice.');
if (options.has('--require-webgpu') && !selected.includes('webgpu'))
  selected.push('webgpu');
const required = new Set(selected);
const port = Number(options.get('--port') ?? 5207);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Port must be an integer from 1 to 65535.');
const directory = resolve(
  root,
  options.get('--output') ?? '.vite/browser-regression',
);
await mkdir(directory, { recursive: true });
try {
  await access(join(root, 'dist/src/index.js'));
} catch {
  throw new Error(
    'Built public entry is missing. Run pnpm build before pnpm regression:browser.',
  );
}
const launch = await chromiumLaunchOptions();
const server = await createServer({
  root,
  // Exercise the shipped entry/exports, not a different source-only implementation.
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
const results = [];
async function saveReport(backend, report) {
  const scenarios = [];
  for (const scenario of report.scenarios ?? []) {
    const { png, ...assertions } = scenario;
    if (png) {
      if (!png.startsWith('data:image/png;base64,'))
        throw new Error('Canvas proof is not a PNG.');
      const filename = `${backend}-${scenario.name}.png`;
      await writeFile(
        join(directory, filename),
        Buffer.from(png.slice('data:image/png;base64,'.length), 'base64'),
      );
      assertions.proof = filename;
    }
    scenarios.push(assertions);
  }
  return { ...report, scenarios };
}
try {
  await server.listen();
  browser = await chromium.launch(launch);
  if (!explicitlySelected && !selected.includes('webgpu'))
    selected.push('webgpu');
  for (const backend of selected) {
    const context = await browser.newContext({
      viewport: { width: 800, height: 700 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !message.location().url.endsWith('/favicon.ico')
      )
        errors.push(message.text());
    });
    let result = { backend, result: 'FAIL', errors, phases: [] };
    try {
      const url = `http://127.0.0.1:${port}/tests/browser/?renderer=${backend}`;
      if (backend === 'webgpu') {
        await page.goto(`http://127.0.0.1:${port}/tests/browser/probe.html`, {
          waitUntil: 'domcontentloaded',
        });
        const availability = await page.evaluate(async () => {
          if (!navigator.gpu) return 'navigator.gpu is unavailable';
          try {
            return (await navigator.gpu.requestAdapter())
              ? null
              : 'requestAdapter returned null';
          } catch (error) {
            return String(error);
          }
        });
        if (availability) {
          result = {
            ...result,
            result: required.has(backend) ? 'FAIL' : 'SKIP',
            unavailable: availability,
          };
          if (required.has(backend))
            errors.push(`Required WebGPU unavailable: ${availability}`);
          results.push(result);
          continue;
        }
      }
      await page.goto(url, { waitUntil: 'networkidle' });
      const awaitState = async (expected) => {
        await page.waitForFunction(
          (state) => {
            const report = document.querySelector('#report');
            return (
              report?.getAttribute('data-state') === state ||
              report?.getAttribute('data-state') === 'failed'
            );
          },
          expected,
          { timeout: 60000 },
        );
        const report = JSON.parse(await page.locator('#report').textContent());
        result.phases.push(await saveReport(backend, report));
        if (report.error) throw new Error(report.error);
      };
      await awaitState('complete');
      await page.locator('#save').click();
      await awaitState('saved');
      await page.goto(`${url}&restore=1`, { waitUntil: 'networkidle' });
      await awaitState('loaded');
      await page.locator('#destroy').click();
      await awaitState('destroyed');
      if (errors.length)
        throw new Error('Browser reported uncaught page/console errors.');
      result.result = 'PASS';
    } catch (error) {
      errors.push(error.stack ?? error.message);
      const partial = await page
        .locator('#report')
        .textContent({ timeout: 1000 })
        .catch(() => null);
      if (partial) {
        try {
          result.phases.push(await saveReport(backend, JSON.parse(partial)));
        } catch (reportError) {
          errors.push(
            `Could not persist partial assertions: ${reportError.message}`,
          );
        }
      }
      await page
        .screenshot({ path: join(directory, `${backend}-failure.png`) })
        .catch((screenshotError) =>
          errors.push(`Failure screenshot: ${screenshotError.message}`),
        );
    } finally {
      await context.close();
    }
    results.push(result);
  }
} finally {
  try {
    await writeFile(
      join(directory, 'results.json'),
      JSON.stringify(
        {
          browser: browser?.version(),
          platform: `${process.platform}/${process.arch}`,
          launchArgs: launch.args,
          results,
        },
        null,
        2,
      ),
    );
  } finally {
    try {
      await browser?.close();
    } finally {
      await server.close();
    }
  }
}
for (const result of results) {
  console.log(
    `${result.result} ${result.backend}${result.unavailable ? `: ${result.unavailable}` : ''}`,
  );
  for (const phase of result.phases)
    for (const scenario of phase.scenarios)
      if (scenario.skip)
        console.log(`  SKIP ${scenario.name}: ${scenario.skip}`);
  for (const error of result.errors) console.error(error);
}
console.log(`Assertions and canvas PNG proofs: ${directory}`);
if (results.some((result) => result.result === 'FAIL')) process.exitCode = 1;
