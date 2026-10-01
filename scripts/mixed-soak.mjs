import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath, URL, URLSearchParams } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { chromiumLaunchOptions } from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const allowed = new Set([
  'renderer',
  'duration',
  'cycle',
  'bodies',
  'warmup',
  'seed',
  'port',
  'output',
  'consumer',
  'timeout',
]);
const options = new Map();
for (let index = 0; index < args.length; index += 2) {
  const name = args[index]?.replace(/^--/, '');
  if (!allowed.has(name) || args[index + 1] === undefined || options.has(name))
    throw new Error(
      'Use --renderer all|webgpu|webgl2|canvas2d --duration seconds --cycle seconds --bodies count --warmup frames --seed integer --port port --output file --consumer extracted-package-directory --timeout seconds.',
    );
  options.set(name, args[index + 1]);
}
const duration = Number(options.get('duration') ?? 60);
if (!Number.isFinite(duration) || duration < 1 || duration > 604800)
  throw new Error('--duration must be in [1, 604800].');
const timeoutSeconds = Number(options.get('timeout') ?? duration + 180);
if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1)
  throw new Error('--timeout must be positive and finite.');
const renderer = options.get('renderer') ?? 'all';
const backends =
  renderer === 'all' ? ['webgpu', 'webgl2', 'canvas2d'] : [renderer];
if (backends.some((value) => !['webgpu', 'webgl2', 'canvas2d'].includes(value)))
  throw new Error(
    '--renderer must be all|webgpu|webgl2|canvas2d. No automatic fallback.',
  );
const port = Number(options.get('port') ?? 5211);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
  throw new Error('--port must be a valid port.');
const consumer = options.has('consumer')
  ? resolve(options.get('consumer'))
  : root;
const manifest = JSON.parse(
  await readFile(join(consumer, 'package.json'), 'utf8'),
);
const entry = resolve(
  consumer,
  manifest.exports?.['.']?.import ?? manifest.main,
);
await access(entry);
let server;
const ownedBrowsers = new Map();
const browserVersions = new Map();
const results = [];
const infrastructureErrors = [];
let infrastructureStage = 'browser setup';
try {
  // Allocate independent native pages before Vite; each backend owns its process.
  for (const backend of backends) {
    let browser;
    let context;
    try {
      browser = await chromium.launch(await chromiumLaunchOptions());
      browserVersions.set(backend, browser.version());
      context = await browser.newContext({ deviceScaleFactor: 1 });
      const page = await context.newPage();
      ownedBrowsers.set(backend, { browser, context, page });
    } catch (error) {
      const errors = [
        `Browser setup: ${error instanceof Error ? error.message : String(error)}`,
      ];
      try {
        await context?.close();
      } catch (cleanupError) {
        errors.push(
          `Context cleanup: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
      try {
        await browser?.close();
      } catch (cleanupError) {
        errors.push(
          `Browser cleanup: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
      results.push({
        requestedBackend: backend,
        passed: false,
        errorCount: errors.length,
        errors,
        evidence: null,
      });
    }
  }
  if (ownedBrowsers.size) {
    infrastructureStage = 'server creation';
    server = await createServer({
      root,
      plugins: [
        {
          name: 'mixed-soak-built-consumer',
          enforce: 'pre',
          resolveId(source, importer) {
            if (
              importer?.endsWith('/benchmarks/mixed/main.ts') &&
              source === '../../src/index.js'
            )
              return entry;
          },
        },
      ],
      server: {
        host: '127.0.0.1',
        port,
        strictPort: true,
        fs: { allow: [root, consumer] },
      },
    });
    infrastructureStage = 'server listen';
    await server.listen();
  }
  for (const backend of backends) {
    const owned = ownedBrowsers.get(backend);
    if (!owned) continue;
    infrastructureStage = `backend ${backend}`;
    const { page, context, browser } = owned;
    const errors = [];
    let errorCount = 0;
    const recordError = (message) => {
      errorCount++;
      if (errors.length < 32) errors.push(message);
    };
    const onPageError = (error) => recordError(error.message);
    const onConsole = (message) => {
      if (
        message.type() === 'error' &&
        !message.location().url.endsWith('/favicon.ico')
      )
        recordError(message.text());
    };
    page.on('pageerror', onPageError);
    page.on('console', onConsole);
    const query = new URLSearchParams({
      renderer: backend,
      duration: String(duration),
    });
    for (const name of ['cycle', 'bodies', 'warmup', 'seed'])
      if (options.has(name)) query.set(name, options.get(name));
    let evidence;
    try {
      await page.bringToFront();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`http://127.0.0.1:${port}/benchmarks/mixed/?${query}`, {
        waitUntil: 'load',
        timeout: 30000,
      });
      await page.waitForFunction(
        () =>
          globalThis.document
            .querySelector('#result')
            ?.getAttribute('data-state'),
        undefined,
        { timeout: timeoutSeconds * 1000 },
      );
      evidence = await page.locator('#result').evaluate((element) => ({
        state: element.dataset.state,
        data: JSON.parse(element.textContent),
      }));
      if (evidence.state !== 'complete')
        recordError(evidence.data.error ?? 'Benchmark failed.');
      if (evidence.data.backend !== backend && evidence.state === 'complete')
        recordError('Forced backend did not match actual backend.');
    } catch (error) {
      recordError(error instanceof Error ? error.message : String(error));
    } finally {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
      try {
        await context.close();
      } catch (error) {
        recordError(
          `Context cleanup: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      try {
        await browser.close();
      } catch (error) {
        recordError(
          `Browser cleanup: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      ownedBrowsers.delete(backend);
    }
    results.push({
      requestedBackend: backend,
      passed: errorCount === 0 && evidence?.state === 'complete',
      errorCount,
      errors,
      evidence: evidence?.data ?? null,
    });
  }
} catch (error) {
  const message = `${infrastructureStage}: ${error instanceof Error ? error.message : String(error)}`;
  infrastructureErrors.push(message);
  for (const backend of backends) {
    if (results.some((result) => result.requestedBackend === backend)) continue;
    results.push({
      requestedBackend: backend,
      passed: false,
      errorCount: 1,
      errors: [message],
      evidence: null,
    });
  }
} finally {
  for (const [backend, { context, browser }] of ownedBrowsers) {
    try {
      await context.close();
    } catch (error) {
      infrastructureErrors.push(
        `${backend} context cleanup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      await browser.close();
    } catch (error) {
      infrastructureErrors.push(
        `${backend} browser cleanup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  try {
    await server?.close();
  } catch (error) {
    infrastructureErrors.push(
      `Server cleanup: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
const report = {
  schema: 'xyz-mixed-soak-driver-v1',
  browser: browserVersions.values().next().value ?? null,
  browserVersions: Object.fromEntries(browserVersions),
  platform: process.platform,
  architecture: process.arch,
  consumer: options.has('consumer') ? 'extracted-package' : 'built-repository',
  package: { name: manifest.name, version: manifest.version },
  durationSecondsPerBackend: duration,
  pageLifecycle:
    'independent owned browser/context/page per backend, prepared before Vite',
  infrastructureErrors,
  results,
};
const json = JSON.stringify(report, null, 2);
if (options.has('output'))
  await writeFile(resolve(options.get('output')), `${json}\n`);
console.log(json);
if (infrastructureErrors.length || results.some((result) => !result.passed))
  process.exitCode = 1;
