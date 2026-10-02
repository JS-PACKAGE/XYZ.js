/* global document */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
import { probeGpuTimestamps } from './gpu-timing-probe.mjs';
import { startSoakObservability } from './soak-observability.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
const limits = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const name = args[i],
    value = args[++i];
  if (
    ![
      '--renderer',
      '--output',
      '--port',
      '--limit',
      '--quality',
      '--device',
    ].includes(name) ||
    !value ||
    value.startsWith('--')
  )
    throw new Error(
      'Usage: node scripts/production-workloads.mjs [--renderer webgpu|webgl2|canvas2d] [--quality baseline|low|high] [--device native|simulated-low-tier|simulated-low-tier-heavy] [--output directory] [--port number] [--limit metric.path=max] ...',
    );
  if (name === '--limit') {
    const [path, raw, extra] = value.split('=');
    const maximum = Number(raw);
    if (
      !path ||
      raw === undefined ||
      extra !== undefined ||
      !Number.isFinite(maximum) ||
      maximum < 0
    )
      throw new Error('Limit must be metric.path=finite-nonnegative-maximum.');
    limits.push({ path, maximum });
  } else options.set(name, value);
}
const renderer = options.get('--renderer') ?? 'webgpu';
if (!['webgpu', 'webgl2', 'canvas2d'].includes(renderer))
  throw new Error('Unknown renderer.');
const quality = options.get('--quality') ?? 'baseline';
if (!['baseline', 'low', 'high'].includes(quality))
  throw new Error('Unknown quality profile.');
const device = options.get('--device') ?? 'native';
if (
  !['native', 'simulated-low-tier', 'simulated-low-tier-heavy'].includes(device)
)
  throw new Error('Unknown device pressure profile.');
const port = Number(options.get('--port') ?? 5212);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid port.');
const directory = resolve(
  root,
  options.get('--output') ??
    `.vite/production-workloads/${renderer}/${quality}/${device}`,
);
await access(join(root, 'dist/src/index.js'));
const { measurementDefaults, soakProfiles, productionQualityProfiles } =
  await import('../dist/src/data/observability.js');
const dimensions = productionQualityProfiles[quality];
await mkdir(directory, { recursive: true });
const server = await createServer({
  root,
  cacheDir: join(directory, 'vite-cache'),
  resolve: {
    alias: [
      {
        find: '../../src/index.js',
        replacement: join(root, 'dist/src/index.js'),
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
    hmr: false,
    watch: null,
  },
});
let browser;
const results = [];
try {
  await server.listen();
  const launch = await browserLaunchOptions('chromium');
  launch.args = [...(launch.args ?? []), '--mute-audio'];
  browser = await chromium.launch(launch);
  for (const workload of renderer === 'canvas2d' ? ['2d'] : ['2d', '3d']) {
    const context = await browser.newContext({
      viewport: {
        width: dimensions.width + 40,
        height: dimensions.height + 200,
      },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const pressure = soakProfiles[device];
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    let observations;
    let session;
    try {
      session =
        device === 'native' ? undefined : await context.newCDPSession(page);
      if (session) {
        await session.send('Emulation.setCPUThrottlingRate', {
          rate: pressure.cpuRate,
        });
        await session.send('Network.enable');
        await session.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: pressure.latencyMs,
          downloadThroughput: pressure.downloadBytesPerSecond,
          uploadThroughput: pressure.uploadBytesPerSecond,
        });
      }
      await page.goto(
        `http://127.0.0.1:${port}/benchmarks/production/?renderer=${renderer}&workload=${workload}&quality=${quality}`,
        { waitUntil: 'domcontentloaded', timeout: 180000 },
      );
      await page.waitForFunction(
        () =>
          ['measuring', 'complete', 'failed'].includes(
            document.querySelector('#result')?.getAttribute('data-state'),
          ),
        null,
        { timeout: 180000 },
      );
      // Capture live native output before Game.destroy clears GPU canvases.
      await page.screenshot({
        path: join(directory, `${workload}-live.png`),
        fullPage: false,
      });
      observations = await startSoakObservability(
        browser,
        context,
        page,
        measurementDefaults,
        1,
      );
      await page.waitForFunction(
        () =>
          ['complete', 'failed'].includes(
            document.querySelector('#result')?.getAttribute('data-state'),
          ),
        null,
        { timeout: 180000 },
      );
      const measured = await page.locator('#result').textContent();
      const result = JSON.parse(measured);
      result.nativeObservations = await observations.stop();
      observations = undefined;
      result.deviceProfile = {
        name: device,
        ...pressure,
        simulated: device !== 'native',
        actualLowTierHardware: false,
        source: session
          ? 'CDP CPU throttling + network emulation'
          : 'Native owned host, see browser provenance',
      };
      result.browser = browserIdentity('chromium', browser, launch);
      result.launchArguments = launch.args;
      result.errors = errors;
      if (renderer === 'webgpu' && result.renderStats?.gpuTiming?.samples === 0)
        result.engineFreeTimingBoundary = await probeGpuTimestamps(page);
      const checks = limits.map(({ path, maximum }) => {
        const actual = path
          .split('.')
          .reduce((value, key) => value?.[key], result);
        return {
          path,
          actual: actual ?? null,
          maximum,
          status:
            typeof actual !== 'number' || !Number.isFinite(actual)
              ? 'BLOCKED'
              : actual > maximum
                ? 'FAIL'
                : 'PASS',
        };
      });
      const nativeTimingFailed =
        renderer === 'webgpu' &&
        result.renderStats?.gpuTiming?.samples === 0 &&
        result.engineFreeTimingBoundary?.status !== 'unsupported';
      result.gate = {
        status:
          result.result === 'FAIL' ||
          errors.length ||
          nativeTimingFailed ||
          checks.some((check) => check.status === 'FAIL')
            ? 'FAIL'
            : !checks.length ||
                checks.some((check) => check.status === 'BLOCKED')
              ? 'BLOCKED'
              : 'PASS',
        checks,
        reason: nativeTimingFailed
          ? 'Engine-free real dispatch timestamps work but engine recorded no valid timing; integration failed.'
          : !checks.length
            ? 'No operator/device-specific thresholds supplied; measured only, no performance certification.'
            : null,
        scope:
          'Only this owned browser/host session and explicitly supplied thresholds. No emulated low-tier or physical mobile certification.',
      };
      await page.screenshot({
        path: join(directory, `${workload}.png`),
        fullPage: false,
      });
      await writeFile(
        join(directory, `${workload}.json`),
        `${JSON.stringify(result, null, 2)}\n`,
      );
      results.push({ workload, ...result.gate });
    } catch (error) {
      const result = { workload, status: 'FAIL', error: String(error), errors };
      results.push(result);
      await writeFile(
        join(directory, `${workload}.json`),
        `${JSON.stringify(result, null, 2)}\n`,
      );
    } finally {
      await session?.detach();
      await observations?.stop();
      await context.close();
    }
  }
  console.log(JSON.stringify({ directory, results }, null, 2));
  if (results.some((result) => result.status !== 'PASS')) process.exitCode = 1;
} finally {
  await browser?.close();
  await server.close();
}
