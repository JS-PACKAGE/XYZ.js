// Temporary same-host experiment; never a replacement for the required production gate.
import { createReadStream } from 'node:fs';
import { mkdir, open, readFile, realpath, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { cpus, hostname, release } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { setTimeout, clearTimeout } from 'node:timers';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index += 2) {
  const name = argv[index],
    value = argv[index + 1];
  if (
    !['--output', '--port', '--baseline'].includes(name) ||
    !value ||
    value.startsWith('--') ||
    options.has(name)
  )
    throw new Error(
      'Usage: node scripts/raf-production-modes.mjs [--output fresh-directory] [--port number] [--baseline original-gate-directory]',
    );
  options.set(name, value);
}
if (process.platform !== 'darwin')
  throw new Error(
    'Requires the native interactive macOS desktop; no Xvfb/emulated foreground.',
  );
const port = Number(options.get('--port') ?? 5212);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid port.');
const directory = resolve(
  root,
  options.get('--output') ?? '.vite/raf-production-modes',
);
const executable = await realpath(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? chromium.executablePath(),
);
if (/headless[_-]shell/i.test(executable))
  throw new Error(
    'Both modes must use the same full Chromium binary, not headless-shell.',
  );
const hashFile = async (path) => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
};
const sourceFiles = [
  'scripts/production-workloads.mjs',
  'scripts/browser-launch.mjs',
  'scripts/soak-observability.mjs',
  'scripts/raf-production-attribution.mjs',
  'scripts/raf-production-modes.mjs',
  'benchmarks/production/main.ts',
];
const sources = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (path) => [path, await hashFile(join(root, path))]),
  ),
);
const plan = [
  { mode: 'headless', workloads: ['2d', 'navigation'] },
  { mode: 'headed', workloads: ['navigation', '2d'] },
  { mode: 'headed', workloads: ['2d', 'navigation'] },
  { mode: 'headless', workloads: ['navigation', '2d'] },
].map((run, index) => ({ ordinal: index + 1, ...run }));
const report = {
  schema: 'temporary-production-raf-modes-v1',
  certification: false,
  perturbed: true,
  status: 'INCOMPLETE_EXPERIMENT',
  startedAt: new Date().toISOString(),
  host: {
    hostname: hostname(),
    platform: process.platform,
    architecture: process.arch,
    cpuModel: cpus()[0]?.model ?? null,
    osRelease: release(),
  },
  invocation: process.argv,
  provenance: {
    executable,
    executableSha256: await hashFile(executable),
    sources,
    githubRunId: process.env.GITHUB_RUN_ID ?? null,
    githubJob: process.env.GITHUB_JOB ?? null,
    githubSha: process.env.GITHUB_SHA ?? null,
  },
  control: {
    order:
      'ABBA: headless, headed, headed, headless; each mode has both workload orders.',
    plannedRuns: plan,
    renderer: 'webgl2',
    quality: 'baseline',
    device: 'native',
    port,
    unchangedDriver: 'scripts/production-workloads.mjs',
    originalCollectorUnchanged: true,
    extendedCompositorTracing: false,
    profileSupplied: false,
    requiredGateUnchanged: true,
    originalGateManagedExecutable: 'chromium-headless-shell',
    experimentExecutable: 'same full Chromium binary in both modes',
    nativeRaf:
      'Preload wraps callbacks but delegates to the captured native requestAnimationFrame and passes its timestamp unchanged.',
    foreground:
      'Page.bringToFront in both modes; headed additionally activates its exact browser PID using native AppKit before navigation. No activation/polling during measurement.',
    timing:
      'Regular native production timing and unchanged frame counts; no scheduling/frame-rate switches, synthetic timestamps, emulated visibility or relaxed budgets.',
    perRunDeadlineMs: 900000,
    retries: 0,
  },
  limitations: [
    'Uncertified, instrumented diagnostic. Required pinned profile/gate remains authoritative, including any existing FAIL.',
    'Original gate uses managed headless-shell by default. Full Chromium headless is a controlled arm, not a retry or exact reproduction of that gate.',
    'Playwright adds headless-only default switches; complete native spawn command lines, matched to the CDP browser PID, and differences are retained. Exposed screen/GPU provenance may also differ despite identical viewport/workload.',
    'Native desktop foreground is inspected before navigation and after completion; every production observer callback checks real document focus/visibility. This is not continuous OS-level foreground sampling.',
    'Four preplanned serial launches balance order but do not eliminate hosted VM load/time drift. Improvement alone cannot establish App Nap, a headless/Viz mechanism or collector causality.',
    'No additional compositor trace retention. Existing native task-age correlation is not a diagnosis of scheduling lateness: queueing elapsed may include planned timer delays and execution before the trace event.',
  ],
  runs: [],
  comparisons: [],
};
await mkdir(dirname(directory), { recursive: true });
// Refuse stale output instead of quietly reusing or overwriting a previous experiment.
await mkdir(directory);
const save = () =>
  writeFile(
    join(directory, 'report.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
await save();
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const phases = ['warmup', 'steady', 'asset-loading'];
const summarize = (result) => ({
  workload: result.workload,
  result: result.result,
  gate: result.gate ?? null,
  browser: result.browser ?? null,
  launchArguments: result.launchArguments ?? null,
  host: result.host,
  engine: result.engine,
  provenance: result.provenance,
  counts: result.counts,
  regressionSettings: result.regressionSettings,
  deviceProfile: result.deviceProfile,
  semantics: result.semantics,
  stageWallMs: result.stageWallMs,
  stages: result.stages,
  operations: result.operations,
  errors: result.errors ?? [],
  nativeObservationsStatus: result.nativeObservations?.status ?? null,
});
const runChild = async (command, environment, logPath) => {
  const log = await open(logPath, 'wx');
  let child,
    deadline,
    killDeadline,
    timedOut = false;
  try {
    return await new Promise((accept, reject) => {
      child = spawn(process.execPath, command, {
        cwd: root,
        env: environment,
        stdio: ['ignore', log.fd, log.fd],
        detached: true,
      });
      const killGroup = (signal) => {
        try {
          process.kill(-child.pid, signal);
        } catch (error) {
          if (error.code !== 'ESRCH') reject(error);
        }
      };
      child.once('error', reject);
      child.once('close', (code, signal) => {
        if (timedOut) killGroup('SIGKILL');
        accept({ code, signal, timedOut });
      });
      deadline = setTimeout(() => {
        timedOut = true;
        killGroup('SIGTERM');
        killDeadline = setTimeout(() => killGroup('SIGKILL'), 5000);
      }, report.control.perRunDeadlineMs);
    });
  } finally {
    clearTimeout(deadline);
    clearTimeout(killDeadline);
    await log.close();
  }
};
const rawSteady = (frames, result) => {
  if (
    !frames ||
    frames.dropped ||
    frames.lifecycleDropped ||
    !frames.nativeSource.includes('[native code]') ||
    !frames.nativeTimestampUnmodified
  )
    throw new Error(
      'Raw native callback evidence missing, non-native or truncated.',
    );
  const observerLabel = frames.names.indexOf('observe');
  const timestamps = [],
    callbackCpuMs = [];
  for (let index = 0; index < frames.count; index++) {
    if (frames.labels[index] !== observerLabel) continue;
    timestamps.push(frames.timestamp[index]);
    callbackCpuMs.push(frames.finished[index] - frames.started[index]);
  }
  const sampleCounts = phases.map(
    (phase) => result.stages[phase].cpuFrameWorkMs.count,
  );
  if (
    timestamps.length !==
      sampleCounts.reduce((total, count) => total + count, 0) ||
    timestamps.length !== frames.observerCallbacks
  )
    throw new Error(
      'Observer callbacks do not align exactly with real engine phase samples.',
    );
  const [warmup, steady] = sampleCounts;
  const intervalMs = timestamps
    .slice(warmup, warmup + steady)
    .map((timestamp, index) => timestamp - timestamps[warmup + index - 1]);
  const intervals = result.stages.steady.frameIntervalMs;
  const maximum = Math.max(...intervalMs);
  const hitches = intervalMs.filter((interval) => interval > 50).length;
  if (
    intervalMs.some(
      (interval) => !Number.isFinite(interval) || interval <= 0,
    ) ||
    intervals.count !== intervalMs.length ||
    Math.abs(maximum - intervals.max) > 0.000001 ||
    hitches !== intervals.longFramesOver50Ms
  )
    throw new Error(
      'Raw steady intervals disagree with unchanged production timing.',
    );
  const sorted = [...intervalMs].sort((a, b) => a - b);
  return {
    source:
      'native observe callback timestamps; boundaries verified against all real phase CPU counts',
    count: intervalMs.length,
    timestampMs: timestamps.slice(warmup, warmup + steady),
    intervalMs,
    callbackCpuMs: callbackCpuMs.slice(warmup, warmup + steady),
    p95ExactMs: sorted[Math.ceil(sorted.length * 0.95) - 1],
    maxMs: maximum,
    longFramesOver50Ms: hitches,
    hitchFraction: hitches / intervalMs.length,
  };
};
try {
  if (options.has('--baseline')) {
    const baselineDirectory = resolve(root, options.get('--baseline'));
    const baselineReport = await json(join(baselineDirectory, 'report.json'));
    report.originalGateBaseline = {
      directory: baselineDirectory,
      report: baselineReport,
      workloads: await Promise.all(
        ['2d', 'navigation'].map(async (workload) =>
          summarize(await json(join(baselineDirectory, `${workload}.json`))),
        ),
      ),
      note: 'Existing gate artifacts only; no original gate rerun. Host/engine equivalence is checked against experiment results, not assumed. Original gate has no raw callback timestamp capture.',
    };
  }
  for (const planned of plan) {
    const runDirectory = join(directory, `${planned.ordinal}-${planned.mode}`);
    await mkdir(runDirectory);
    const measurementDirectory = join(runDirectory, 'measurement');
    const diagnosticDirectory = join(runDirectory, 'native-raf');
    const command = [
      '--import',
      './scripts/raf-production-attribution.mjs',
      'scripts/production-workloads.mjs',
      '--renderer',
      'webgl2',
      '--quality',
      'baseline',
      '--device',
      'native',
      '--workloads',
      planned.workloads.join(','),
      '--port',
      String(port),
      '--output',
      measurementDirectory,
    ];
    const overrides = {
      PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: executable,
      XYZ_RAF_EXPERIMENT_MODE: planned.mode,
      XYZ_RAF_DIAGNOSTIC_OUTPUT: diagnosticDirectory,
    };
    const run = {
      ...planned,
      directory: runDirectory,
      command: [process.execPath, ...command],
      environmentOverrides: overrides,
      startedAt: new Date().toISOString(),
      valid: false,
      errors: [],
      workloads: [],
    };
    report.runs.push(run);
    await save();
    try {
      run.process = await runChild(
        command,
        { ...process.env, ...overrides },
        join(runDirectory, 'driver.log'),
      );
      const measured = await json(join(measurementDirectory, 'report.json'));
      const raw = await json(join(diagnosticDirectory, 'report.json'));
      run.measurementReport = measured;
      run.launch = raw.launch;
      run.contextOptions = raw.contextOptions;
      run.nativeRafReport = join(diagnosticDirectory, 'report.json');
      if (
        run.process.code !== 1 ||
        run.process.signal ||
        run.process.timedOut ||
        measured.mode !== 'measurement' ||
        measured.status !== 'BLOCKED' ||
        !isDeepStrictEqual(measured.workloads, planned.workloads) ||
        measured.results.length !== 2 ||
        measured.results.some(
          (result) =>
            result.functionalStatus !== 'PASS' ||
            result.performanceStatus !== 'BLOCKED' ||
            result.status !== 'BLOCKED' ||
            result.checks.some((check) => check.status !== 'PASS'),
        )
      )
        throw new Error(
          'Unchanged measurement driver did not finish intact functional/lifecycle workloads.',
        );
      if (
        !raw.runtimeComplete ||
        raw.certification !== false ||
        raw.experimentMode !== planned.mode ||
        raw.extendedCompositorTracing ||
        !raw.originalProductionCollectorUnchanged ||
        raw.pages.length !== 2 ||
        raw.pagesStarted?.length !== 2 ||
        raw.launch.error ||
        raw.contextOptions?.length !== 2 ||
        raw.launch.actualOptions.executablePath !== executable ||
        (await realpath(raw.launch.commandLine[0])) !== executable ||
        raw.launch.actualOptions.headless !== (planned.mode === 'headless') ||
        raw.launch.commandLine.some((argument) =>
          /^--headless(?:=|$)/.test(argument),
        ) !==
          (planned.mode === 'headless')
      )
        throw new Error(
          'Mode/executable/completion provenance is incomplete or inconsistent.',
        );
      for (const [index, workload] of planned.workloads.entries()) {
        const result = await json(
          join(measurementDirectory, `${workload}.json`),
        );
        const page = raw.pages.find(
          (entry) =>
            new URL(entry.url).searchParams.get('workload') === workload,
        );
        const started = raw.pagesStarted[index];
        if (
          result.workload !== workload ||
          result.result !== 'PASS' ||
          result.backend !== 'webgl2' ||
          result.quality !== 'baseline' ||
          result.deviceProfile.name !== 'native' ||
          result.errors.length ||
          result.provenance.visibility !== 'visible' ||
          page?.frames?.completionState !== 'complete' ||
          page.frames.visibility !== 'visible' ||
          page.frames.hiddenObserverCallbacks ||
          page.frames.viewport.width !== result.counts.width + 40 ||
          page.frames.viewport.height !== result.counts.height + 200 ||
          page.frames.viewport.devicePixelRatio !== 1 ||
          result.stages.steady.cpuFrameWorkMs.count <
            result.counts.measuredFrames ||
          result.stages['asset-loading'].cpuFrameWorkMs.count <
            result.counts.loadStageFrames ||
          result.stageWallMs.steady <
            result.regressionSettings.minimumSteadySeconds * 1000 ||
          result.stageWallMs['asset-loading'] <
            result.regressionSettings.minimumLoadingSeconds * 1000
        )
          throw new Error(
            `Incomplete real functional/native-frame evidence: ${workload}`,
          );
        if (
          planned.mode === 'headed' &&
          (!started.foreground?.matchesBrowser ||
            !page.foreground?.matchesBrowser ||
            started.foreground.frontmostPid !== raw.launch.browserPid ||
            page.foreground.frontmostPid !== raw.launch.browserPid ||
            started.window.bounds.windowState !== 'normal' ||
            page.window.bounds.windowState !== 'normal' ||
            !page.frames.focused ||
            page.frames.unfocusedObserverCallbacks)
        )
          throw new Error(
            `Headed workload was not verified native foreground throughout callbacks: ${workload}`,
          );
        run.workloads.push({
          ...summarize(result),
          native: {
            start: started,
            window: page.window,
            foreground: page.foreground,
            visibility: page.frames.visibility,
            focused: page.frames.focused,
            viewport: page.frames.viewport,
            observerCallbacks: page.frames.observerCallbacks,
            hiddenObserverCallbacks: page.frames.hiddenObserverCallbacks,
            unfocusedObserverCallbacks: page.frames.unfocusedObserverCallbacks,
            lifecycle: page.frames.lifecycle,
            nativeSource: page.frames.nativeSource,
          },
          rawSteady: rawSteady(page.frames, result),
        });
      }
      const reference = report.runs[0];
      for (const result of run.workloads) {
        const previous = reference.workloads.find(
          (entry) => entry.workload === result.workload,
        );
        for (const key of [
          'host',
          'engine',
          'counts',
          'regressionSettings',
          'deviceProfile',
        ])
          if (!isDeepStrictEqual(result[key], previous[key]))
            throw new Error(
              `Controlled provenance changed: ${result.workload}.${key}`,
            );
        if (
          result.browser.version !== previous.browser.version ||
          !isDeepStrictEqual(result.provenance.gpu, previous.provenance.gpu)
        )
          throw new Error(`Controlled browser/GPU changed: ${result.workload}`);
      }
      const actualOptions = { ...run.launch.actualOptions };
      const referenceOptions = { ...reference.launch.actualOptions };
      delete actualOptions.headless;
      delete referenceOptions.headless;
      if (!isDeepStrictEqual(actualOptions, referenceOptions))
        throw new Error(
          'Launch options changed beyond the experimental headless flag.',
        );
      if (!isDeepStrictEqual(run.contextOptions, reference.contextOptions))
        throw new Error(
          'Production context/viewport options changed across arms.',
        );
      run.valid = true;
    } catch (error) {
      run.errors.push(String(error));
    }
    run.finishedAt = new Date().toISOString();
    await save();
    // Abort on invalid workload/foreground evidence, never retry a failed arm.
    if (!run.valid) break;
  }
  if (
    report.runs.length === plan.length &&
    report.runs.every((run) => run.valid)
  ) {
    for (const workload of ['2d', 'navigation']) {
      const rows = report.runs.map((run) => ({
        ordinal: run.ordinal,
        mode: run.mode,
        rawSteady: run.workloads.find((entry) => entry.workload === workload)
          .rawSteady,
      }));
      report.comparisons.push({
        workload,
        runs: rows.map(({ rawSteady, ...run }) => ({
          ...run,
          count: rawSteady.count,
          rafP95ExactMs: rawSteady.p95ExactMs,
          rafMaxMs: rawSteady.maxMs,
          hitchesOver50Ms: rawSteady.longFramesOver50Ms,
          hitchFraction: rawSteady.hitchFraction,
        })),
        counterbalancedPairs: [
          [0, 1],
          [3, 2],
        ].map(([headlessIndex, headedIndex]) => ({
          headlessOrdinal: rows[headlessIndex].ordinal,
          headedOrdinal: rows[headedIndex].ordinal,
          headedMinusHeadlessP95Ms:
            rows[headedIndex].rawSteady.p95ExactMs -
            rows[headlessIndex].rawSteady.p95ExactMs,
          headedMinusHeadlessHitchFraction:
            rows[headedIndex].rawSteady.hitchFraction -
            rows[headlessIndex].rawSteady.hitchFraction,
        })),
      });
    }
    report.status = 'EXPERIMENT_COMPLETE_UNCERTIFIED';
  } else report.status = 'INVALID_EXPERIMENT';
  const commandFlags = (run) =>
    run.launch?.commandLine?.filter(
      (argument) =>
        argument.startsWith('--') && !argument.startsWith('--user-data-dir='),
    ) ?? [];
  report.observedCommandLineDifferences = {
    headlessOnly: commandFlags(report.runs[0]).filter(
      (argument) => !commandFlags(report.runs[1] ?? {}).includes(argument),
    ),
    headedOnly: commandFlags(report.runs[1] ?? {}).filter(
      (argument) => !commandFlags(report.runs[0]).includes(argument),
    ),
    ignoredDifference:
      'Temporary per-launch --user-data-dir paths only; complete originals retained.',
  };
  if (report.originalGateBaseline && report.runs[0]?.workloads.length === 2)
    report.originalGateBaseline.sameObservedHostEngineAndWorkload =
      report.originalGateBaseline.workloads.every((baseline) => {
        const experimental = report.runs[0].workloads.find(
          (result) => result.workload === baseline.workload,
        );
        return ['host', 'engine', 'counts', 'regressionSettings'].every((key) =>
          isDeepStrictEqual(baseline[key], experimental[key]),
        );
      });
} catch (error) {
  report.status = 'INVALID_EXPERIMENT';
  report.error = String(error);
} finally {
  report.finishedAt = new Date().toISOString();
  report.completedRuns = report.runs.filter((run) => run.valid).length;
  await save();
}
console.log(
  `${report.status}: ${join(directory, 'report.json')}; not certification.`,
);
if (report.status !== 'EXPERIMENT_COMPLETE_UNCERTIFIED') process.exitCode = 1;
