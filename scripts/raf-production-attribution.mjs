/* global document, PerformanceObserver -- isolated diagnostic Playwright callbacks */
import { mkdir, writeFile } from 'node:fs/promises';
import childProcess, { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { syncBuiltinESMExports } from 'node:module';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { URL, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import console from 'node:console';
import { chromium } from 'playwright-core';

// Temporary preload only: the real production driver and workloads remain unchanged.
// Callback interception perturbs measurements; never certification.
const experimentMode = process.env.XYZ_RAF_EXPERIMENT_MODE;
if (!['headless', 'headed'].includes(experimentMode))
  throw new Error('XYZ_RAF_EXPERIMENT_MODE must be headless or headed.');
if (process.platform !== 'darwin')
  throw new Error(
    'This foreground experiment requires a native macOS desktop.',
  );
if (!process.env.XYZ_RAF_DIAGNOSTIC_OUTPUT)
  throw new Error('XYZ_RAF_DIAGNOSTIC_OUTPUT is required.');
const directory = pathToFileURL(
  `${resolve(process.env.XYZ_RAF_DIAGNOSTIC_OUTPUT)}/`,
);
const execute = promisify(execFile);
// AppKit inspects the actual desktop, not document visibility or emulated focus.
const nativeForeground = async (browserPid, activate = false) => {
  const source = `
    ObjC.import('AppKit');
    function run(argv) {
      const pid = Number(argv[0]);
      const application = $.NSRunningApplication.runningApplicationWithProcessIdentifier(pid);
      if (!application) throw new Error('Browser application PID unavailable.');
      let activationAccepted = null;
      if (argv[1] === 'activate') {
        activationAccepted = Boolean(application.activateWithOptions($.NSApplicationActivateIgnoringOtherApps));
        const deadline = Date.now() + 5000;
        while (Number($.NSWorkspace.sharedWorkspace.frontmostApplication.processIdentifier) !== pid && Date.now() < deadline)
          delay(0.05);
      }
      const frontmost = $.NSWorkspace.sharedWorkspace.frontmostApplication;
      return JSON.stringify({
        browserPid: pid,
        activationAccepted,
        applicationActive: Boolean(application.active),
        frontmostPid: Number(frontmost.processIdentifier),
        frontmostName: ObjC.unwrap(frontmost.localizedName),
        frontmostBundleIdentifier: ObjC.unwrap(frontmost.bundleIdentifier) || null,
        matchesBrowser: Number(frontmost.processIdentifier) === pid,
        source: 'native AppKit NSWorkspace.frontmostApplication / NSRunningApplication'
      });
    }
  `;
  const beforeNodeMs = performance.now();
  const { stdout } = await execute(
    '/usr/bin/osascript',
    [
      '-l',
      'JavaScript',
      '-e',
      source,
      String(browserPid),
      activate ? 'activate' : 'inspect',
    ],
    { timeout: 10000, maxBuffer: 65536 },
  );
  return {
    ...JSON.parse(stdout),
    beforeNodeMs,
    afterNodeMs: performance.now(),
  };
};
await mkdir(directory, { recursive: true });
const report = {
  schema: 'temporary-production-raf-mode-run-v1',
  certification: false,
  perturbed: true,
  experimentMode,
  extendedCompositorTracing: false,
  originalProductionCollectorUnchanged: true,
  pages: [],
};
const launch = chromium.launch.bind(chromium);
chromium.launch = async (...args) => {
  const requestedOptions = globalThis.structuredClone(args[0] ?? {});
  if (!args[0]?.executablePath)
    throw new Error(
      'Controlled modes require the same explicit full Chromium executable.',
    );
  // Mutate the driver's launch object so its normal provenance records actual options.
  args[0].headless = experimentMode === 'headless';
  // Browser.getBrowserCommandLine requires --enable-automation, which this pinned
  // launcher does not set. Capture the real spawn arguments without adding flags.
  const nativeSpawn = childProcess.spawn;
  let nativeProcess;
  childProcess.spawn = (command, ...spawnArgs) => {
    const child = nativeSpawn(command, ...spawnArgs);
    if (command === args[0].executablePath && Array.isArray(spawnArgs[0]))
      nativeProcess = {
        pid: child.pid,
        arguments: [command, ...spawnArgs[0]],
      };
    return child;
  };
  syncBuiltinESMExports();
  let browser;
  try {
    browser = await launch(...args);
  } finally {
    childProcess.spawn = nativeSpawn;
    syncBuiltinESMExports();
  }
  report.launch = {
    requestedOptions,
    actualOptions: globalThis.structuredClone(args[0] ?? {}),
    version: browser.version(),
    commandLine: nativeProcess?.arguments,
    commandLineSource:
      'Native spawn arguments, matched to the CDP browser PID.',
    regularManagedHeadlessExecutable: 'chromium-headless-shell',
    note: 'Both experimental modes use full Chromium; neither is the original managed headless-shell gate.',
  };
  const createSession = browser.newBrowserCDPSession.bind(browser);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...contextArgs) => {
    const context = await newContext(...contextArgs);
    report.contextOptions ??= [];
    report.contextOptions.push(
      globalThis.structuredClone(contextArgs[0] ?? {}),
    );
    await context.addInitScript(() => {
      const capacity = 8192,
        longTaskCapacity = 256;
      const timestamp = new Float64Array(capacity),
        started = new Float64Array(capacity),
        finished = new Float64Array(capacity),
        labels = new Uint16Array(capacity);
      const names = [],
        nameIds = new Map(),
        longTasks = [];
      let count = 0,
        dropped = 0;
      const nativeRaf = globalThis.requestAnimationFrame.bind(globalThis);
      const nativeSource = Function.prototype.toString.call(
        globalThis.requestAnimationFrame,
      );
      const lifecycle = [];
      let observerCallbacks = 0,
        hiddenObserverCallbacks = 0,
        unfocusedObserverCallbacks = 0,
        lifecycleDropped = 0;
      for (const type of ['visibilitychange', 'focus', 'blur']) {
        const target = type === 'visibilitychange' ? document : globalThis;
        target.addEventListener(type, () => {
          if (lifecycle.length < 128)
            lifecycle.push({
              type,
              nowMs: performance.now(),
              visibility: document.visibilityState,
              focused: document.hasFocus(),
            });
          else lifecycleDropped++;
        });
      }
      globalThis.requestAnimationFrame = (callback) => {
        const name = callback.name || '(anonymous)';
        if (!nameIds.has(name)) {
          nameIds.set(name, names.length);
          names.push(name);
        }
        const label = nameIds.get(name);
        return nativeRaf((time) => {
          const start = performance.now();
          if (name === 'observe') {
            observerCallbacks++;
            if (document.hidden) hiddenObserverCallbacks++;
            if (!document.hasFocus()) unfocusedObserverCallbacks++;
          }
          try {
            callback(time);
          } finally {
            const end = performance.now();
            if (count < capacity) {
              timestamp[count] = time;
              started[count] = start;
              finished[count] = end;
              labels[count] = label;
              count++;
            } else dropped++;
          }
        });
      };
      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (longTasks.length < longTaskCapacity)
              longTasks.push({
                startTimeMs: entry.startTime,
                durationMs: entry.duration,
              });
          }
        }).observe({ entryTypes: ['longtask'] });
      }
      globalThis.__xyzRafDiagnostic = () => ({
        nativeSource,
        nativeTimestampUnmodified: true,
        observerCallbacks,
        hiddenObserverCallbacks,
        unfocusedObserverCallbacks,
        lifecycle,
        lifecycleDropped,
        capacity,
        count,
        dropped,
        names,
        timestamp: Array.from(timestamp.subarray(0, count)),
        started: Array.from(started.subarray(0, count)),
        finished: Array.from(finished.subarray(0, count)),
        labels: Array.from(labels.subarray(0, count)),
        longTasks,
        visibility: document.visibilityState,
        focused: document.hasFocus(),
        completionState:
          document.querySelector('#result')?.getAttribute('data-state') ?? null,
        viewport: {
          width: globalThis.innerWidth,
          height: globalThis.innerHeight,
          devicePixelRatio: globalThis.devicePixelRatio,
        },
        nowMs: performance.now(),
        timeOriginMs: performance.timeOrigin,
      });
    });
    const newPage = context.newPage.bind(context);
    context.newPage = async (...pageArgs) => {
      const page = await newPage(...pageArgs);
      await page.bringToFront();
      const cdp = await context.newCDPSession(page);
      try {
        const window = await cdp.send('Browser.getWindowForTarget');
        const foreground =
          experimentMode === 'headed'
            ? await nativeForeground(report.launch.browserPid, true)
            : null;
        const documentState = await page.evaluate(() => ({
          visibility: document.visibilityState,
          focused: document.hasFocus(),
        }));
        report.pagesStarted ??= [];
        report.pagesStarted.push({ window, foreground, documentState });
        if (
          experimentMode === 'headed' &&
          (!foreground.matchesBrowser ||
            window.bounds.windowState !== 'normal' ||
            documentState.visibility !== 'visible' ||
            !documentState.focused)
        )
          throw new Error(
            'Headed browser did not become a real native foreground window.',
          );
      } finally {
        await cdp.detach();
      }
      return page;
    };
    const closeContext = context.close.bind(context);
    context.close = async (...closeArgs) => {
      try {
        for (const page of context.pages()) {
          if (page.isClosed()) continue;
          const cdp = await context.newCDPSession(page);
          await cdp.send('Performance.enable');
          const beforeNodeMs = performance.now();
          const [metrics, frames, window, foreground] = await Promise.all([
            cdp.send('Performance.getMetrics'),
            page.evaluate(() => globalThis.__xyzRafDiagnostic?.()),
            cdp.send('Browser.getWindowForTarget'),
            experimentMode === 'headed'
              ? nativeForeground(report.launch.browserPid)
              : null,
          ]);
          const afterNodeMs = performance.now();
          await cdp.detach();
          report.pages.push({
            url: page.url(),
            window,
            foreground,
            clock: {
              beforeNodeMs,
              afterNodeMs,
              uncertaintyMs: afterNodeMs - beforeNodeMs,
              cdp: metrics.metrics,
            },
            frames,
          });
        }
      } finally {
        await closeContext(...closeArgs);
      }
    };
    return context;
  };
  const closeBrowser = browser.close.bind(browser);
  browser.close = async (...closeArgs) => {
    try {
      await closeBrowser(...closeArgs);
    } finally {
      report.runtimeComplete = true;
      await writeFile(
        new URL('report.json', directory),
        JSON.stringify(report, null, 2) + '\n',
      );
      console.log('RAF_PRODUCTION_ATTRIBUTION_EOF');
    }
  };
  let cdp;
  try {
    cdp = await createSession();
    const [version, processes] = await Promise.all([
      cdp.send('Browser.getVersion'),
      cdp.send('SystemInfo.getProcessInfo'),
    ]);
    report.launch.cdpVersion = version;
    report.launch.browserPid = processes.processInfo.find(
      (entry) => entry.type === 'browser',
    )?.id;
    const actualHeadless = nativeProcess?.arguments.some((argument) =>
      /^--headless(?:=|$)/.test(argument),
    );
    if (
      actualHeadless !== (experimentMode === 'headless') ||
      !Number.isInteger(report.launch.browserPid) ||
      nativeProcess?.pid !== report.launch.browserPid
    )
      throw new Error(
        'Native launch/CDP did not prove the requested real browser mode/PID.',
      );
  } catch (error) {
    report.launch.error = String(error);
    await cdp?.detach();
    cdp = undefined;
    await browser.close();
    throw error;
  } finally {
    await cdp?.detach();
  }
  return browser;
};
