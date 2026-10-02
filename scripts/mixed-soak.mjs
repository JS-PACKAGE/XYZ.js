/* global document, performance -- Playwright callbacks */
import { access, readFile, readdir, lstat, writeFile } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL, URL, URLSearchParams } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { chromiumLaunchOptions } from './browser-launch.mjs';
import { cpus, release as osRelease, totalmem } from 'node:os';
import { Buffer } from 'node:buffer';
import { startSoakObservability } from './soak-observability.mjs';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { installMixedSoakSurface } from './mixed-soak-surface.mjs';

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
  'preset',
  'profile',
  'memorySample',
  'gpuTiming',
  'frameBudgetMs',
  'parallel',
  'packageArchive',
]);
const options = new Map();
for (let index = 0; index < args.length; index += 2) {
  const name = args[index]?.replace(/^--/, '');
  if (!allowed.has(name) || args[index + 1] === undefined || options.has(name))
    throw new Error(
      'Use --renderer all|webgpu|webgl2|canvas2d --preset smoke|standard|hour --parallel 0|1 --profile native|simulated-low-tier|simulated-low-tier-heavy --duration seconds --cycle seconds --bodies count --warmup frames --seed integer --memorySample seconds --gpuTiming 0|1 --frameBudgetMs milliseconds --port port --output file --consumer extracted-package-directory --packageArchive matching-tgz --timeout seconds.',
    );
  options.set(name, args[index + 1]);
}
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
const { measurementDefaults, soakProfiles, soakWorkload } = await import(
  new URL('./data/observability.js', pathToFileURL(entry))
);
const preset = options.get('preset') ?? 'standard';
if (!['smoke', 'standard', 'hour'].includes(preset))
  throw new Error('--preset must be smoke|standard|hour.');
const profileName = options.get('profile') ?? 'native';
const profile = soakProfiles[profileName];
if (!Object.hasOwn(soakProfiles, profileName))
  throw new Error(
    '--profile must be native|simulated-low-tier|simulated-low-tier-heavy.',
  );
const memorySample = Number(
  options.get('memorySample') ?? measurementDefaults.memorySampleSeconds,
);
if (!Number.isFinite(memorySample) || memorySample < 1 || memorySample > 60)
  throw new Error('--memorySample must be in [1,60] seconds.');
if (options.has('gpuTiming') && !['0', '1'].includes(options.get('gpuTiming')))
  throw new Error('--gpuTiming must be 0|1.');
const parallel = options.get('parallel') === '1';
if (options.has('parallel') && !['0', '1'].includes(options.get('parallel')))
  throw new Error('--parallel must be 0|1.');
const duration = Number(
  options.get('duration') ??
    (preset === 'hour'
      ? measurementDefaults.longDurationSeconds
      : preset === 'smoke'
        ? 30
        : 60),
);
if (!Number.isFinite(duration) || duration < 1 || duration > 604800)
  throw new Error('--duration must be in [1, 604800].');
if (preset === 'hour' && duration < 3600)
  throw new Error(
    '--preset hour requires at least 3600 actual seconds per backend; use smoke for short runs.',
  );
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
const execute = promisify(execFile);
async function treeIdentity(base, names) {
  const files = [];
  const visit = async (name) => {
    const entries = await readdir(join(base, name), { withFileTypes: true });
    for (const item of entries) {
      const child = join(name, item.name);
      if (item.isDirectory()) await visit(child);
      else if (item.isFile()) files.push(child);
      else
        throw new Error(
          `Identity cannot include a nonregular path: ${join(base, child)}`,
        );
    }
  };
  for (const name of names) {
    const metadata = await lstat(join(base, name));
    if (metadata.isDirectory()) await visit(name);
    else if (metadata.isFile()) files.push(name);
    else
      throw new Error(
        `Identity cannot include a nonregular path: ${join(base, name)}`,
      );
  }
  files.sort();
  const hash = createHash('sha256');
  for (const name of files) {
    const bytes = await readFile(join(base, name));
    hash.update(relative(base, join(base, name)).split('\\').join('/'));
    hash.update('\0');
    hash.update(createHash('sha256').update(bytes).digest());
  }
  return {
    sha256: hash.digest('hex'),
    files: files.length,
    algorithm:
      'sorted relative UTF-8 path + NUL + SHA256(file bytes), SHA256 aggregate',
  };
}
const runtimeRoot = dirname(dirname(entry));
const sourceRevision = (
  await execute('git', ['rev-parse', 'HEAD'], { cwd: root })
).stdout.trim();
const sourceInputs = [
  'src',
  'packages',
  'vendor',
  'package.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
];
const harnessInputs = [
  'benchmarks/mixed',
  'benchmarks/measurement.ts',
  'benchmarks/observability.ts',
  'scripts/mixed-soak.mjs',
  'scripts/mixed-soak-surface.mjs',
  'scripts/soak-observability.mjs',
  'scripts/browser-launch.mjs',
];
const identity = {
  sourceRevision,
  sourceTree: await treeIdentity(root, sourceInputs),
  emittedRuntimeTree: await treeIdentity(runtimeRoot, ['.']),
  harnessTree: await treeIdentity(root, harnessInputs),
  packageManifestSha256: createHash('sha256')
    .update(await readFile(join(consumer, 'package.json')))
    .digest('hex'),
  packageArchiveSha256: options.has('packageArchive')
    ? createHash('sha256')
        .update(await readFile(resolve(options.get('packageArchive'))))
        .digest('hex')
    : null,
  packageTree: options.has('consumer')
    ? await treeIdentity(consumer, ['.'])
    : null,
  archiveScope:
    'Optional supplied archive byte SHA256; extracted package tree is independently hashed. The soak does not attest archive-to-directory equivalence.',
  emittedEntry: relative(consumer, entry),
  engineSourceTransforms: false,
  hmr: false,
};
const runStarted = new Date().toISOString();
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
      const launch = await chromiumLaunchOptions();
      browser = await chromium.launch({
        ...launch,
        args: [...launch.args, '--mute-audio'],
      });
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
      cacheDir: join(root, '.vite/mixed-soak-cache', String(process.pid)),
      plugins: [
        {
          name: 'mixed-soak-bounded-network-workload',
          configureServer(vite) {
            const payload = Buffer.alloc(soakWorkload.networkPayloadBytes, 85);
            vite.middlewares.use((request, response, next) => {
              if (
                !new URL(
                  request.url ?? '/',
                  'http://127.0.0.1',
                ).pathname.endsWith('/benchmarks/mixed/network.bin')
              ) {
                next();
                return;
              }
              response.setHeader('Content-Type', 'application/octet-stream');
              response.setHeader('Cache-Control', 'no-store');
              response.end(payload);
            });
          },
        },
        {
          name: 'mixed-soak-built-consumer',
          enforce: 'pre',
          resolveId(source, importer) {
            if (
              importer?.includes('/benchmarks/mixed/') &&
              source === '../../src/index.js'
            )
              return entry;
            const data = source.match(
              /^(?:\.\.\/){1,2}src\/data\/(observability|rendering)\.js$/,
            );
            if (importer?.includes('/benchmarks/') && data)
              return fileURLToPath(
                new URL(`./data/${data[1]}.js`, pathToFileURL(entry)),
              );
          },
        },
      ],
      server: {
        host: '127.0.0.1',
        port,
        strictPort: true,
        hmr: false,
        fs: { allow: [root, consumer] },
      },
    });
    infrastructureStage = 'server listen';
    await server.listen();
  }
  const runBackend = async (backend) => {
    const owned = ownedBrowsers.get(backend);
    if (!owned) return;
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
      if (message.type() === 'error') recordError(message.text());
    };
    page.on('pageerror', onPageError);
    page.on('console', onConsole);
    const query = new URLSearchParams({
      renderer: backend,
      duration: String(duration),
    });
    query.set('profile', profileName);
    if (profileName !== 'native') query.set('network', '1');
    for (const name of [
      'cycle',
      'bodies',
      'warmup',
      'seed',
      'gpuTiming',
      'frameBudgetMs',
    ])
      if (options.has(name)) query.set(name, options.get(name));
    let evidence;
    let collector;
    let measurements = null;
    let profileSession;
    let appliedProfile = null;
    try {
      if (profileName !== 'native') {
        profileSession = await context.newCDPSession(page);
        await profileSession.send('Emulation.setCPUThrottlingRate', {
          rate: profile.cpuRate,
        });
        await profileSession.send('Network.enable');
        await profileSession.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: profile.latencyMs,
          downloadThroughput: profile.downloadBytesPerSecond,
          uploadThroughput: profile.uploadBytesPerSecond,
        });
        appliedProfile = {
          ...profile,
          simulated: true,
          source: 'CDP CPU throttling + network emulation',
          actualLowTierHardware: false,
        };
      } else
        appliedProfile = {
          ...profile,
          simulated: false,
          source: 'no CPU/network emulation',
        };
      await page.addInitScript(() => {
        // Visibility evidence stays bounded for the true one-hour window.
        const events = [];
        globalThis.__xyzVisibilityEvidence = events;
        const record = () => {
          events.push({
            milliseconds: performance.now(),
            state: document.visibilityState,
          });
          if (events.length > 32) events.shift();
        };
        record();
        document.addEventListener('visibilitychange', record);
      });
      await page.addInitScript(installMixedSoakSurface);
      collector = await startSoakObservability(
        browser,
        context,
        page,
        measurementDefaults,
        memorySample,
      );
      await page.bringToFront();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`http://127.0.0.1:${port}/benchmarks/mixed/?${query}`, {
        waitUntil: 'load',
        timeout: 30000,
      });
      await page.locator('#start:not([hidden])').click({ timeout: 30000 });
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
      evidence.data.visibilityEvidence = await page.evaluate(
        () => globalThis.__xyzVisibilityEvidence ?? null,
      );
      if (evidence.state !== 'complete')
        recordError(evidence.data.error ?? 'Benchmark failed.');
      if (evidence.data.backend !== backend && evidence.state === 'complete')
        recordError('Forced backend did not match actual backend.');
      if (
        evidence.state === 'complete' &&
        evidence.data.elapsedSeconds < duration
      )
        recordError(
          'Active integrated scenario did not reach the requested duration.',
        );
      if (
        evidence.state === 'complete' &&
        (evidence.data.integrated?.saveRoundTrips !==
          evidence.data.completedCycles ||
          evidence.data.integrated?.sceneTransitions !==
            evidence.data.completedCycles)
      )
        recordError(
          'A counted cycle omitted actual durable save/restore or Scene transition.',
        );
      if (
        evidence.state === 'complete' &&
        backend !== 'canvas2d' &&
        evidence.data.integrated?.graphicsRecoveries !==
          evidence.data.completedCycles
      )
        recordError(
          'A native counted cycle omitted actual same-backend graphics recovery.',
        );
    } catch (error) {
      recordError(error instanceof Error ? error.message : String(error));
    } finally {
      try {
        measurements = (await collector?.stop()) ?? null;
      } catch (error) {
        recordError(`Metrics cleanup: ${error}`);
      }
      try {
        await profileSession?.detach();
      } catch (error) {
        recordError(`Throttle session cleanup: ${error}`);
      }
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
      measurements,
      appliedProfile,
    });
  };
  if (parallel) await Promise.all(backends.map(runBackend));
  else for (const backend of backends) await runBackend(backend);
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
const identityAfter = {
  sourceTree: await treeIdentity(root, sourceInputs),
  emittedRuntimeTree: await treeIdentity(runtimeRoot, ['.']),
  harnessTree: await treeIdentity(root, harnessInputs),
};
for (const name of Object.keys(identityAfter))
  if (identityAfter[name].sha256 !== identity[name].sha256)
    infrastructureErrors.push(
      `Run identity changed during measurement: ${name}.`,
    );
const report = {
  schema: 'xyz-mixed-soak-driver-v3',
  browser: browserVersions.values().next().value ?? null,
  browserVersions: Object.fromEntries(browserVersions),
  platform: process.platform,
  architecture: process.arch,
  operatingSystemRelease: osRelease(),
  cpu: { model: cpus()[0]?.model ?? null, logicalCores: cpus().length },
  physicalMemoryBytes: totalmem(),
  preset,
  runStarted,
  runFinished: new Date().toISOString(),
  identity,
  identityAfter,
  profile: {
    name: profileName,
    requested: profile,
    simulated: profileName !== 'native',
    actualLowTierHardware: false,
  },
  measurementAvailability:
    'Owned Chromium CDP only; no Safari/iOS/other browser or physical-device certification. Unsupported metrics remain null/status rather than fabricated zero.',
  consumer: options.has('consumer') ? 'extracted-package' : 'built-repository',
  package: { name: manifest.name, version: manifest.version },
  durationSecondsPerBackend: duration,
  backendConcurrency: parallel
    ? 'parallel independently owned browsers, shared host CPU/GPU contention'
    : 'sequential',
  pageLifecycle:
    'independent owned browser/context/page per backend, prepared before Vite',
  audioSafety:
    'Native per-context zero-gain sinks installed before engine scripts; Chromium additionally muted. Trusted click unlock, real decoded native PCM/Scene ownership/pause/resume/closed contexts; no physical audible qualification.',
  infrastructureErrors,
  results,
};
const json = JSON.stringify(report, null, 2);
if (options.has('output'))
  await writeFile(resolve(options.get('output')), `${json}\n`);
console.log(json);
if (infrastructureErrors.length || results.some((result) => !result.passed))
  process.exitCode = 1;
