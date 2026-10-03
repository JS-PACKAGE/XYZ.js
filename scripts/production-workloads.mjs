/* global document */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cpus, release } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
import { probeGpuTimestamps } from './gpu-timing-probe.mjs';
import { startSoakObservability } from './soak-observability.mjs';
import {
  launchForegroundBrowser,
  installForegroundObserver,
  inspectForegroundPage,
  readForegroundObserver,
} from './production-foreground.mjs';
import {
  validateProfile,
  evaluateProfile,
  calibrateProfile,
} from './production-profile.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map(),
  limits = [];
const args = process.argv.slice(2);
const usage =
  'Usage: node scripts/production-workloads.mjs [--renderer webgpu|webgl2|canvas2d] [--quality baseline|low|high] [--device native|simulated-low-tier|simulated-low-tier-heavy] [--presentation headless|native-foreground] [--workloads comma,separated] [--profile pinned.json | --calibrate new.json --runs 5] [--output directory] [--port number] [--limit metric.path=max] ...';
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
      '--presentation',
      '--workloads',
      '--profile',
      '--calibrate',
      '--runs',
      '--name',
    ].includes(name) ||
    !value ||
    value.startsWith('--')
  )
    throw new Error(usage);
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
  } else {
    if (options.has(name)) throw new Error(`Duplicate option: ${name}`);
    options.set(name, value);
  }
}
if (options.has('--profile') && options.has('--calibrate'))
  throw new Error('Calibration and certification are separate commands.');
if (options.has('--runs') && !options.has('--calibrate'))
  throw new Error(
    '--runs is calibration-only; failing gates are never retried.',
  );
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
// Preserve the original headless contract unless native macOS presentation is
// explicitly requested. A foreground request never falls back to headless.
const presentationMode = options.get('--presentation') ?? 'headless';
if (!['headless', 'native-foreground'].includes(presentationMode))
  throw new Error('Unknown presentation mode.');
if (presentationMode === 'native-foreground' && process.platform !== 'darwin')
  throw new Error('Native foreground production requires a macOS desktop.');
const available =
  renderer === 'canvas2d'
    ? ['2d', 'dense2d', 'navigation']
    : ['2d', '3d', 'dense2d', 'navigation', 'visibility'];
const workloads = options.has('--workloads')
  ? options.get('--workloads').split(',')
  : available;
if (
  !workloads.length ||
  new Set(workloads).size !== workloads.length ||
  workloads.some((name) => !available.includes(name))
)
  throw new Error('Invalid/duplicate/unsupported workload selection.');
const port = Number(options.get('--port') ?? 5212);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid port.');
const directory = resolve(
  root,
  options.get('--output') ??
    `.vite/production-workloads/${renderer}/${quality}/${device}`,
);
await access(join(root, 'dist/src/index.js'));
const {
  measurementDefaults,
  soakProfiles,
  productionQualityProfiles,
  productionRegressionWorkload,
  productionCalibrationDefaults,
} = await import('../dist/src/data/observability.js');
if (!productionRegressionWorkload || !productionCalibrationDefaults)
  throw new Error(
    'Current emitted engine/data required: run the parent build before this gate.',
  );
const dimensions = productionQualityProfiles[quality];
const calibrating = options.has('--calibrate');
const runs = calibrating
  ? Number(options.get('--runs') ?? productionCalibrationDefaults.defaultRuns)
  : 1;
if (
  !Number.isInteger(runs) ||
  runs < (calibrating ? productionCalibrationDefaults.minimumRuns : 1) ||
  runs > productionCalibrationDefaults.maximumRuns
)
  throw new Error('Calibration requires 3–20 planned runs.');
const profile = options.has('--profile')
  ? validateProfile(
      JSON.parse(
        await readFile(resolve(root, options.get('--profile')), 'utf8'),
      ),
    )
  : null;
if (
  profile &&
  (workloads.some((name) => !profile.bounds[name]) ||
    Object.keys(profile.bounds).some((name) => !workloads.includes(name)))
)
  throw new Error(
    'Gate must exercise exactly the workload matrix pinned by the profile.',
  );
const host = {
  platform: process.platform,
  architecture: process.arch,
  cpuModel: cpus()[0]?.model ?? null,
  osRelease: release(),
};
const engine = {
  entry: 'dist/src/index.js',
  sha256: createHash('sha256')
    .update(await readFile(join(root, 'dist/src/index.js')))
    .digest('hex'),
};
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
      {
        find: '../../src/data/observability.js',
        replacement: join(root, 'dist/src/data/observability.js'),
      },
      {
        find: '../src/data/observability.js',
        replacement: join(root, 'dist/src/data/observability.js'),
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
let closeForegroundBrowser;
let presentationEvidence = {
  mode: presentationMode,
  headless: presentationMode === 'headless',
};
const results = [],
  measurements = [];
let calibrationError;
try {
  await server.listen();
  const launch = await browserLaunchOptions('chromium');
  launch.args = [...(launch.args ?? []), '--mute-audio'];
  if (presentationMode === 'native-foreground') {
    launch.headless = false;
    launch.args.push('--remote-debugging-port=0');
  } else browser = await chromium.launch(launch);
  for (let run = 1; run <= runs; run++) {
    for (const workload of workloads) {
      const prefix = calibrating ? `run-${run}-${workload}` : workload;
      if (presentationMode === 'native-foreground') {
        const launched = await launchForegroundBrowser(chromium, launch);
        browser = launched.browser;
        closeForegroundBrowser = launched.close;
        presentationEvidence = launched.evidence;
      }
      const viewport = {
        width: dimensions.width + 40,
        height: dimensions.height + 200,
      };
      const context =
        presentationMode === 'native-foreground'
          ? browser.contexts()[0]
          : await browser.newContext({ viewport, deviceScaleFactor: 1 });
      let page;
      const presentation = { ...presentationEvidence };
      const pressure = soakProfiles[device],
        errors = [];
      let observations, session;
      try {
        if (presentationMode === 'native-foreground')
          await installForegroundObserver(context);
        page = await context.newPage();
        if (presentationMode === 'native-foreground')
          await page.setViewportSize(viewport);
        page.on('pageerror', (error) => errors.push(String(error)));
        session =
          device !== 'native' || presentationMode === 'native-foreground'
            ? await context.newCDPSession(page)
            : undefined;
        if (presentationMode === 'native-foreground') {
          presentation.focusEmulationEnabled = false;
          presentation.before = await inspectForegroundPage(
            session,
            page,
            presentationEvidence,
            true,
          );
          if (!presentation.before.valid)
            throw new Error(
              'Browser did not become a real native foreground normal window before navigation.',
            );
        }
        if (device !== 'native') {
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
        // Record live native output before Game.destroy clears GPU canvases.
        await page.screenshot({
          path: join(directory, `${prefix}-live.png`),
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
        const result = JSON.parse(await page.locator('#result').textContent());
        if (presentationMode === 'native-foreground') {
          presentation.after = await inspectForegroundPage(
            session,
            page,
            presentationEvidence,
          );
          presentation.observer = await readForegroundObserver(page, result);
          if (!presentation.after.valid || !presentation.observer.valid) {
            const presentationError =
              'Production measurement lost real native foreground, page visibility/focus, or observer coverage.';
            result.error ??= presentationError;
            errors.push(presentationError);
          }
        }
        result.presentation = presentation;
        result.nativeObservations = await observations.stop();
        observations = undefined;
        result.deviceProfile = {
          name: device,
          ...pressure,
          simulated: device !== 'native',
          actualLowTierHardware: false,
          source:
            device !== 'native'
              ? 'CDP CPU throttling + network emulation'
              : 'Native owned host, see browser provenance',
        };
        result.browser = browserIdentity('chromium', browser, launch);
        result.launchArguments = launch.args;
        result.host = host;
        result.engine = engine;
        result.run = run;
        result.errors = errors;
        if (
          renderer === 'webgpu' &&
          result.renderStats?.gpuTiming?.samples === 0
        )
          result.engineFreeTimingBoundary = await probeGpuTimestamps(page);
        result.nativeTimingFailed =
          renderer === 'webgpu' &&
          result.renderStats?.gpuTiming?.samples === 0 &&
          result.engineFreeTimingBoundary?.status !== 'unsupported';
        result.gate = evaluateProfile(
          result,
          profile,
          host,
          productionRegressionWorkload.teardownMaximumMs,
        );
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
        result.gate.checks.push(...checks);
        if (checks.some((check) => check.status === 'FAIL')) {
          result.gate.status = 'FAIL';
          result.gate.failureKind ??= 'performance';
        } else if (
          checks.some((check) => check.status === 'BLOCKED') &&
          result.gate.status !== 'FAIL'
        )
          result.gate.status = 'BLOCKED';
        await page.screenshot({
          path: join(directory, `${prefix}.png`),
          fullPage: false,
        });
        await writeFile(
          join(directory, `${prefix}.json`),
          `${JSON.stringify(result, null, 2)}\n`,
        );
        results.push({ run, workload, presentation, ...result.gate });
        measurements.push(result);
        if (
          calibrating &&
          (result.gate.functionalStatus !== 'PASS' ||
            result.gate.checks.some((check) => check.status !== 'PASS'))
        ) {
          calibrationError =
            'Calibration aborted by functional, lifecycle or explicit operator-limit failure. No retry.';
          break;
        }
      } catch (error) {
        const result = {
          run,
          workload,
          status: 'FAIL',
          functionalStatus: 'FAIL',
          performanceStatus: 'BLOCKED',
          failureKind: 'functional',
          error: String(error),
          errors,
          host,
          engine,
          presentation,
        };
        results.push(result);
        await writeFile(
          join(directory, `${prefix}.json`),
          `${JSON.stringify(result, null, 2)}\n`,
        );
        if (calibrating)
          calibrationError =
            'Calibration aborted by workload/runner failure. No retry.';
      } finally {
        await session?.detach();
        await observations?.stop();
        await context.close();
        if (closeForegroundBrowser) {
          await closeForegroundBrowser();
          closeForegroundBrowser = undefined;
          browser = undefined;
        }
      }
      if (calibrationError) break;
    }
    if (calibrationError) break;
  }
  let calibration;
  if (calibrating && !calibrationError) {
    try {
      calibration = calibrateProfile(
        measurements,
        host,
        productionCalibrationDefaults,
        options.get('--name') ??
          `${host.platform}-${host.architecture}-${renderer}-${quality}-${device}`,
      );
      // A pinned baseline is immutable input: never overwrite an existing reviewed file.
      await writeFile(
        resolve(root, options.get('--calibrate')),
        `${JSON.stringify(calibration, null, 2)}\n`,
        { flag: 'wx' },
      );
    } catch (error) {
      calibrationError = String(error);
    }
  }
  const report = {
    schema: 'xyz-production-report-v2',
    mode: calibrating
      ? 'calibration'
      : profile
        ? 'regression-gate'
        : 'measurement',
    status: calibrating
      ? calibrationError
        ? 'FAIL'
        : 'CALIBRATED_NOT_CERTIFIED'
      : results.every((result) => result.status === 'PASS')
        ? 'PASS'
        : results.some((result) => result.status === 'FAIL')
          ? 'FAIL'
          : 'BLOCKED',
    directory,
    host,
    engine,
    presentation: {
      mode: presentationMode,
      headless: presentationMode === 'headless',
      isolatedBrowserPerWorkload: presentationMode === 'native-foreground',
    },
    plannedRuns: runs,
    workloads,
    results,
    calibration: calibrating
      ? {
          output: options.get('--calibrate'),
          error: calibrationError ?? null,
          certification: false,
        }
      : null,
  };
  await writeFile(
    join(directory, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
  if (calibrating ? !!calibrationError : report.status !== 'PASS')
    process.exitCode = 1;
} finally {
  if (closeForegroundBrowser) await closeForegroundBrowser();
  else await browser?.close();
  await server.close();
}
