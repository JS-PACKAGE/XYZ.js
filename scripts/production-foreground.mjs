/* global document -- real page lifecycle and production observer callbacks */
import childProcess, { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { performance } from 'node:perf_hooks';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execute = promisify(execFile);

// AppKit/PID proof distinguishes real Chromium foreground from DOM-only focus.
async function nativeForeground(browserPid, activate) {
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
}

export async function launchForegroundBrowser(chromium, launch) {
  if (process.platform !== 'darwin' || launch.headless !== false)
    throw new Error(
      'Native foreground production requires headed Chromium on macOS.',
    );
  // Browser.getBrowserCommandLine requires --enable-automation. Capture the real
  // managed child instead, without adding any scheduling or automation flags.
  const executable = launch.executablePath ?? chromium.executablePath();
  const nativeSpawn = childProcess.spawn;
  let nativeProcess;
  childProcess.spawn = (command, ...args) => {
    const child = nativeSpawn(command, ...args);
    if (command === executable && Array.isArray(args[0]))
      nativeProcess = { pid: child.pid, arguments: [command, ...args[0]] };
    return child;
  };
  syncBuiltinESMExports();
  let owner;
  try {
    owner = await chromium.launch(launch);
  } finally {
    childProcess.spawn = nativeSpawn;
    syncBuiltinESMExports();
  }
  let browser;
  try {
    const profileArgument = nativeProcess?.arguments.find((argument) =>
      argument.startsWith('--user-data-dir='),
    );
    if (!profileArgument || owner.contexts().length !== 0)
      throw new Error('Native browser must have a fresh, unattached profile.');
    const port = Number(
      (
        await readFile(
          join(
            profileArgument.slice('--user-data-dir='.length),
            'DevToolsActivePort',
          ),
          'utf8',
        )
      ).split('\n')[0],
    );
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('Native browser did not expose its ephemeral CDP port.');
    // Focus emulation belongs to each CDP handler. Sending false on a new
    // session cannot release Playwright's original enabled capture handle.
    // noDefaults prevents that handle from ever being installed, but only in
    // the default context; the driver launches a fresh browser for each case.
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, {
      noDefaults: true,
      isLocal: true,
    });
    if (browser.contexts().length !== 1)
      throw new Error(
        'Native browser must expose exactly its default context.',
      );
  } catch (error) {
    try {
      await browser?.close();
    } finally {
      await owner.close();
    }
    throw error;
  }
  const evidence = {
    mode: 'native-foreground',
    headless: false,
    executable,
    nativeProcess,
    collectorSourceUnchanged: true,
    defaultOverrides:
      'Not installed: connectOverCDP noDefaults=true, fresh default context only',
    commandLineSource:
      'Native managed spawn arguments matched to the CDP browser PID',
  };
  let cdp;
  try {
    cdp = await browser.newBrowserCDPSession();
    const [version, processes] = await Promise.all([
      cdp.send('Browser.getVersion'),
      cdp.send('SystemInfo.getProcessInfo'),
    ]);
    evidence.cdpVersion = version;
    evidence.browserPid = processes.processInfo.find(
      (entry) => entry.type === 'browser',
    )?.id;
    evidence.actualHeadless = nativeProcess?.arguments.some((argument) =>
      /^--headless(?:=|$)/.test(argument),
    );
    if (
      evidence.actualHeadless !== false ||
      !Number.isInteger(evidence.browserPid) ||
      nativeProcess?.pid !== evidence.browserPid
    )
      throw new Error(
        'Native launch/CDP did not prove the headed browser mode/PID.',
      );
  } catch (error) {
    // Retain failure evidence for the driver's workload reports; no fallback.
    evidence.error = String(error);
  } finally {
    await cdp?.detach().catch((error) => {
      evidence.error ??= String(error);
    });
  }
  return {
    browser,
    evidence,
    close: async () => {
      try {
        await browser.close();
      } finally {
        await owner.close();
      }
    },
  };
}
export async function installForegroundObserver(context) {
  await context.addInitScript(() => {
    const evidence = {
      source: 'Real production observe RAF callbacks and DOM lifecycle events',
      nativeTimestampUnmodified: true,
      callbackCounterInstrumentation: true,
      observerCallbacks: 0,
      hiddenObserverCallbacks: 0,
      unfocusedObserverCallbacks: 0,
      interruptedLifecycleEvents: 0,
      lifecycle: [],
      lifecycleDropped: 0,
    };
    const nativeRaf = globalThis.requestAnimationFrame.bind(globalThis);
    let observedCallback;
    // Cache one wrapper for the actual production observer, not the engine RAF.
    // Native timestamps/callback order are unchanged; no timing arrays or tracing.
    const observe = (time) => {
      evidence.observerCallbacks++;
      if (document.hidden) evidence.hiddenObserverCallbacks++;
      if (!document.hasFocus()) evidence.unfocusedObserverCallbacks++;
      observedCallback(time);
    };
    globalThis.requestAnimationFrame = (callback) => {
      if (callback.name !== 'observe') return nativeRaf(callback);
      if (observedCallback && observedCallback !== callback)
        throw new Error('Unexpected additional production observe callback.');
      observedCallback = callback;
      return nativeRaf(observe);
    };
    for (const type of ['visibilitychange', 'focus', 'blur']) {
      const target = type === 'visibilitychange' ? document : globalThis;
      target.addEventListener(type, () => {
        const visibility = document.visibilityState;
        const focused = document.hasFocus();
        const state = document
          .querySelector('#result')
          ?.getAttribute('data-state');
        if (
          evidence.observerCallbacks > 0 &&
          !['complete', 'failed'].includes(state) &&
          (visibility !== 'visible' || !focused)
        )
          evidence.interruptedLifecycleEvents++;
        if (evidence.lifecycle.length < 128)
          evidence.lifecycle.push({
            type,
            nowMs: performance.now(),
            visibility,
            focused,
            state,
          });
        else evidence.lifecycleDropped++;
      });
    }
    globalThis.__xyzProductionForeground = evidence;
  });
}

export async function inspectForegroundPage(
  cdp,
  page,
  launchEvidence,
  activate = false,
) {
  if (launchEvidence.error) throw new Error(launchEvidence.error);
  if (activate) await page.bringToFront();
  const window = await cdp.send('Browser.getWindowForTarget');
  const foreground = await nativeForeground(
    launchEvidence.browserPid,
    activate,
  );
  const documentState = await page.evaluate(() => ({
    visibility: document.visibilityState,
    focused: document.hasFocus(),
  }));
  return {
    window,
    foreground,
    documentState,
    valid:
      foreground.matchesBrowser &&
      foreground.applicationActive &&
      window.bounds.windowState === 'normal' &&
      window.bounds.width > 0 &&
      window.bounds.height > 0 &&
      documentState.visibility === 'visible' &&
      documentState.focused,
  };
}

export async function readForegroundObserver(page, result) {
  const evidence = await page.evaluate(
    () => globalThis.__xyzProductionForeground ?? null,
  );
  const minimumCallbacks = Object.values(result.stages ?? {}).reduce(
    (count, stage) => count + (stage.cpuFrameWorkMs?.count ?? 0),
    0,
  );
  return {
    ...evidence,
    minimumCallbacks,
    valid:
      !!evidence &&
      minimumCallbacks > 0 &&
      evidence.observerCallbacks >= minimumCallbacks &&
      evidence.hiddenObserverCallbacks === 0 &&
      evidence.unfocusedObserverCallbacks === 0 &&
      evidence.interruptedLifecycleEvents === 0,
  };
}
