/* global document -- inspected in owned Playwright pages */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium, firefox, webkit } from 'playwright-core';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  const name = process.argv[i],
    value = process.argv[i + 1];
  if (
    !['--browser', '--port', '--output', '--concurrency'].includes(name) ||
    !value
  )
    throw new Error(
      'Use --browser chromium|firefox|webkit --port PORT --output DIR --concurrency N.',
    );
  options.set(name, value);
}
const name = options.get('--browser') ?? 'webkit';
const type = { chromium, firefox, webkit }[name];
if (!type) throw new Error('Use --browser chromium|firefox|webkit.');
const port = Number(options.get('--port') ?? 5251);
const concurrency = Number(options.get('--concurrency') ?? 2);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Port must be in 1..65535.');
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4)
  throw new Error('Concurrency must be in 1..4.');
await access(join(root, 'dist/src/index.js'));
const directory = resolve(
  root,
  options.get('--output') ?? `.vite/audio-native-load/${name}`,
);
await mkdir(directory, { recursive: true });
const launch = await browserLaunchOptions(name);
if (name === 'chromium') launch.args = [...(launch.args ?? []), '--mute-audio'];
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
let ownedBrowser;
const ownedContexts = [];
const results = [];
let startupError;
try {
  await server.listen();
  // A new managed process, never a connection to a user browser or shared tool session.
  ownedBrowser = await type.launch(launch);
  const pages = await Promise.all(
    Array.from({ length: concurrency }, async (_, index) => {
      const context = await ownedBrowser.newContext();
      ownedContexts.push(context);
      const page = await context.newPage();
      const result = { index, pageErrors: [], status: 'starting' };
      results[index] = result;
      page.on('pageerror', (error) =>
        result.pageErrors.push({
          name: error.name,
          message: error.message,
          stack: error.stack,
        }),
      );
      await page.goto(
        `http://127.0.0.1:${port}/tests/browser/audio-load.html`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForFunction(
        () =>
          ['unlock-ready', 'failed'].includes(
            document.querySelector('#report')?.getAttribute('data-state'),
          ),
        undefined,
        { timeout: 30000 },
      );
      if (
        (await page.locator('#report').getAttribute('data-state')) === 'failed'
      ) {
        Object.assign(result, {
          status: 'failed',
          evidence: JSON.parse(await page.locator('#report').innerText()),
        });
      }
      return { page, result };
    }),
  );
  await Promise.all(
    pages.map(async ({ page }) => {
      if (
        (await page.locator('#report').getAttribute('data-state')) === 'failed'
      )
        return;
      await page.locator('#unlock').click();
      await page.waitForFunction(
        () =>
          ['run-ready', 'failed'].includes(
            document.querySelector('#report')?.getAttribute('data-state'),
          ),
        undefined,
        { timeout: 30000 },
      );
    }),
  );
  await Promise.all(
    pages.map(async ({ page, result }) => {
      try {
        if (
          (await page.locator('#report').getAttribute('data-state')) !==
          'failed'
        ) {
          await page.locator('#run').click();
          await page.waitForFunction(
            () =>
              ['passed', 'failed'].includes(
                document.querySelector('#report')?.getAttribute('data-state'),
              ),
            undefined,
            { timeout: 45000 },
          );
        }
        const state = await page.locator('#report').getAttribute('data-state');
        const evidence = JSON.parse(await page.locator('#report').innerText());
        Object.assign(result, { status: state, evidence });
        await page.screenshot({
          path: join(directory, `audio-load-${result.index}.png`),
        });
      } catch (error) {
        result.status = 'failed';
        result.driverError = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
        result.surface = await page
          .locator('#report')
          .innerText()
          .catch((surfaceError) => String(surfaceError));
      } finally {
        await page.close();
      }
    }),
  );
} catch (error) {
  startupError = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
} finally {
  const identity = browserIdentity(name, ownedBrowser, launch);
  await writeFile(
    join(directory, 'results.json'),
    JSON.stringify(
      {
        identity,
        concurrency,
        workload:
          'Eight official contexts per page; parallel samples/streams/OPM; context-local native effects; exact requested-time independent target reference; owned teardown. No retries, no autoplay bypass flags.',
        startupError,
        results,
      },
      null,
      2,
    ),
  );
  for (const context of ownedContexts) await context.close();
  await ownedBrowser?.close();
  await server.close();
}
if (
  startupError ||
  results.length !== concurrency ||
  results.some(
    (result) =>
      result.status !== 'passed' ||
      result.pageErrors.length ||
      result.evidence.errors?.length,
  )
)
  process.exitCode = 1;
console.log(
  JSON.stringify({
    browser: name,
    concurrency,
    output: directory,
    status: process.exitCode ? 'FAIL' : 'PASS',
  }),
);
