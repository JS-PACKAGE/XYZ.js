/* global document, navigator, window -- used only inside Playwright browser callbacks */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium, firefox, webkit } from 'playwright-core';
import {
  browserLaunchOptions,
  browserIdentity,
  probeBackends,
} from './browser-launch.mjs';
import { attachOwnedGpuCapture } from './windows-chromium-capture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const options = new Map();
for (let index = 0; index < args.length; index++) {
  const name = args[index];
  if (name === '--require-webgpu') options.set(name, true);
  else if (['--browser', '--renderer', '--port', '--output'].includes(name)) {
    const value = args[++index];
    if (!value || value.startsWith('--'))
      throw new Error(`${name} needs a value.`);
    options.set(name, value);
  } else
    throw new Error(
      `Unknown option ${name}. Use --browser chromium|firefox|webkit, --renderer canvas2d,webgl2,webgpu, --require-webgpu, --output DIR, or --port PORT.`,
    );
}
const browserName = options.get('--browser') ?? 'chromium';
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error('Use --browser chromium|firefox|webkit.');
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
const required = new Set(
  explicitlySelected || browserName === 'chromium' ? selected : ['canvas2d'],
);
if (options.has('--require-webgpu')) required.add('webgpu');
const nativeCapture = process.env.XYZ_CHROMIUM_NATIVE_CAPTURE;
if (
  nativeCapture &&
  (nativeCapture !== 'approved-owned-gpu' ||
    process.platform !== 'win32' ||
    process.env.GITHUB_ACTIONS !== 'true' ||
    process.env.RUNNER_ENVIRONMENT !== 'github-hosted' ||
    browserName !== 'chromium' ||
    Boolean(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) ||
    !explicitlySelected ||
    selected.length !== 1 ||
    selected[0] === 'canvas2d')
)
  throw new Error(
    'Owned GPU capture requires an approved Windows GitHub-hosted pinned Chromium diagnostic with one explicit GPU renderer and no executable override.',
  );
const port = Number(options.get('--port') ?? 5207);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Port must be an integer from 1 to 65535.');
const directory = resolve(
  root,
  options.get('--output') ?? `.vite/browser-regression/${browserName}`,
);
await mkdir(directory, { recursive: true });
try {
  await access(join(root, 'dist/src/index.js'));
} catch {
  throw new Error(
    'Built public entry is missing. Run pnpm build before pnpm regression:browser.',
  );
}
let launch;
const server = await createServer({
  root,
  // Exercise the shipped entry/exports, not a different source-only implementation.
  resolve: {
    alias: [
      {
        find: '../../src/index.js',
        replacement: join(root, 'dist/src/index.js'),
      },
      {
        find: '../src/index.js',
        replacement: join(root, 'dist/src/index.js'),
      },
      {
        find: '../../packages/core/src/shadow-atlas.js',
        replacement: join(root, 'dist/packages/core/src/shadow-atlas.js'),
      },
    ],
  },
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser;
const results = [];
let startupError;
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

async function runAuthoring(page, backend, result, awaitState) {
  await page.goto(
    `http://127.0.0.1:${port}/tests/browser/authoring.html?renderer=${backend}`,
    { waitUntil: 'domcontentloaded' },
  );
  await awaitState('ui-ready');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'UI action',
  );
  const box = await page.locator('#game').boundingBox();
  if (!box) throw new Error('Authoring canvas has no visible bounds.');
  await page.mouse.move(box.x + 100, box.y + 30);
  await page.mouse.down();
  await page.waitForFunction(() => window.__xyzP41?.rawDown);
  const captured = await page.evaluate(() => ({
    fires: window.__xyzP41.fires,
    defaults: window.__xyzP41.defaultFires,
  }));
  if (captured.fires !== 0 || captured.defaults !== 0)
    throw new Error(
      `UI pointer leaked gameplay fire: ${JSON.stringify(captured)}`,
    );
  await page.mouse.up();
  await page.waitForFunction(() => window.__xyzP41?.clicks === 1);
  await page.evaluate(() => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');
    window.__p41NativeGamepadPolling =
      typeof navigator.getGamepads === 'function';
    const pad = (index, value) => ({
      id: 'XYZ regression simulated standard gamepad',
      index,
      connected: true,
      mapping: 'standard',
      timestamp: 0,
      axes: [value, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({
        pressed: false,
        touched: false,
        value: 0,
      })),
    });
    window.__p41SimulatedPads = [pad(7, 0), pad(2, 0.8)];
    window.__p41OriginalPadDescriptor = original;
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => window.__p41SimulatedPads,
    });
  });
  await page.waitForFunction(
    () => window.__xyzP41?.pad2 > 0.7 && window.__xyzP41?.pad7 === 0,
  );
  await page.evaluate(() => {
    Object.assign(window.__p41SimulatedPads[0].buttons[0], {
      pressed: true,
      touched: true,
      value: 1,
    });
  });
  await page.waitForFunction(() => window.__xyzP41?.clicks === 2);
  const menuConfirm = await page.evaluate(() => [
    window.__xyzP41.confirms,
    window.__xyzP41.defaultConfirms,
  ]);
  if (menuConfirm.some((value) => value !== 0))
    throw new Error('UI gamepad activation leaked a gameplay confirm.');
  await page.mouse.move(box.x + 340, box.y + 240);
  await page.mouse.down();
  await page.waitForFunction(
    () => window.__xyzP41?.fires === 1 && window.__xyzP41?.confirmValue > 0,
  );
  await page.mouse.up();
  const heldClose = await page.evaluate(() => [
    window.__xyzP41.confirms,
    window.__xyzP41.defaultConfirms,
  ]);
  if (heldClose.some((value) => value !== 0))
    throw new Error('Closing UI manufactured a held gamepad confirm.');
  await page.evaluate(() => {
    Object.assign(window.__p41SimulatedPads[0].buttons[0], {
      pressed: false,
      touched: false,
      value: 0,
    });
  });
  await page.waitForFunction(() => window.__xyzP41?.confirmValue === 0);
  await page.evaluate(() => {
    Object.assign(window.__p41SimulatedPads[0].buttons[0], {
      pressed: true,
      touched: true,
      value: 1,
    });
  });
  await page.waitForFunction(
    () =>
      window.__xyzP41?.confirms === 1 && window.__xyzP41?.defaultConfirms === 1,
  );
  await page.evaluate(() => {
    const original = window.__p41OriginalPadDescriptor;
    if (original) Object.defineProperty(navigator, 'getGamepads', original);
    else delete navigator.getGamepads;
  });
  await page.waitForFunction(() => window.__xyzP41?.confirmValue === 0);
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.__xyzP41?.x > 375);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Tab');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'UI action',
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__xyzP41?.checked);
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(
    () => window.__xyzP41?.gain === 0.25 && window.__xyzP41?.virtual === 0.25,
  );
  await page.touchscreen.tap(box.x + 180, box.y + 140);
  await page.waitForFunction(
    () =>
      window.__xyzP41?.gain >= 0.5 &&
      window.__xyzP41?.virtual >= 0.5 &&
      document.activeElement?.getAttribute('aria-label') === 'Gain',
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => window.__xyzP41?.gain === 0 && window.__xyzP41?.virtual === 0,
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'Modal one',
  );
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__xyzP41?.modalClicks === 1);
  await page.keyboard.press('Tab');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'Modal two',
  );
  await page.keyboard.press('Tab');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'Modal one',
  );
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('aria-label') === 'Open modal',
  );
  await page.mouse.move(box.x + 340, box.y + 240);
  await page.mouse.down();
  await page.waitForFunction(
    () => window.__xyzP41?.fires === 2 && window.__xyzP41?.focused === '',
  );
  await page.mouse.up();
  const proof = `${backend}-authoring-ui.png`;
  await page.screenshot({ path: join(directory, proof) });
  result.authoring = {
    playwrightTouchInjection: true,
    simulatedGamepadSnapshots: true,
    nativeGamepadPolling: await page.evaluate(
      () => window.__p41NativeGamepadPolling,
    ),
    physicalDeviceCertification: false,
    proof,
    probe: await page.evaluate(() => ({ ...window.__xyzP41 })),
  };
  await page.locator('#finish').click();
  await awaitState('complete');
}
try {
  await server.listen();
  launch = await browserLaunchOptions(browserName);
  // Diagnostic-only: log GL calls to find the call preceding the ANGLE D3D11 trap.
  // The formal regression launch flags stay unchanged.
  if (nativeCapture)
    launch = {
      ...launch,
      args: [
        ...(launch.args ?? []),
        '--enable-logging=stderr',
        '--enable-gpu-service-logging',
      ],
    };
  browser = await browserType.launch(launch);
  if (!explicitlySelected && !selected.includes('webgpu'))
    selected.push('webgpu');
  for (const backend of selected) {
    const context = await browser.newContext({
      viewport: { width: 800, height: 700 },
      deviceScaleFactor: 1,
      hasTouch: true,
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
    let gpuCapture;
    try {
      const url = `http://127.0.0.1:${port}/tests/browser/?renderer=${backend}`;
      await page.goto(`http://127.0.0.1:${port}/tests/browser/probe.html`, {
        waitUntil: 'domcontentloaded',
      });
      result.capabilities = await probeBackends(page);
      const capability = result.capabilities[backend];
      if (!capability.available) {
        result.result = required.has(backend) ? 'FAIL' : 'UNSUPPORTED';
        result.unavailable = capability.reason;
        if (required.has(backend))
          errors.push(`Required ${backend} unavailable: ${capability.reason}`);
        results.push(result);
        continue;
      }
      await page.goto(url, { waitUntil: 'networkidle' });
      const awaitState = async (expected) => {
        try {
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
        } catch (cause) {
          const where = await page
            .evaluate(() => {
              const report = document.querySelector('#report');
              return {
                state: report?.getAttribute('data-state'),
                progress: report?.getAttribute('data-progress'),
                step: report?.getAttribute('data-step'),
                phase: report?.getAttribute('data-phase'),
                heartbeat: report?.getAttribute('data-heartbeat'),
                events: report?.getAttribute('data-events'),
              };
            })
            .catch(() => undefined);
          throw new Error(
            `${cause.message} Page position: ${JSON.stringify(where)}`,
            {
              cause,
            },
          );
        }
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
      await runAuthoring(page, backend, result, awaitState);
      if (nativeCapture) {
        gpuCapture = await attachOwnedGpuCapture(browser, root, backend);
        result.nativeCapture = gpuCapture.ready;
      }
      try {
        await page.goto(
          `http://127.0.0.1:${port}/tests/browser/native-profiles.html?renderer=${backend}`,
          { waitUntil: 'domcontentloaded' },
        );
        await awaitState('passed');
      } finally {
        if (gpuCapture) {
          const capture = gpuCapture;
          gpuCapture = undefined;
          await capture.stop();
        }
      }
      if (browserName === 'chromium' && backend !== 'canvas2d') {
        const loss = result.phases
          .flatMap((phase) => phase.scenarios ?? [])
          .find(
            (scenario) =>
              scenario.name === 'real-context-loss-residency-replay',
          );
        if (!loss || loss.skip)
          throw new Error(
            `Required Chromium native loss proof missing: ${loss?.skip ?? 'scenario absent'}`,
          );
      }
      await page.goto(
        `http://127.0.0.1:${port}/tests/browser/tiled-profiles.html?renderer=${backend}`,
        { waitUntil: 'domcontentloaded' },
      );
      await awaitState('interactive');
      await page
        .getByRole('button', { name: 'Pan camera', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Toggle group', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Toggle group', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Edit negative solid', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Pause / resume', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Pause / resume', exact: true })
        .click();
      await page.locator('#finish').click();
      await awaitState('passed');
      await page.goto(
        `http://127.0.0.1:${port}/tests/browser/graphics-quality.html?renderer=${backend}`,
        { waitUntil: 'domcontentloaded' },
      );
      await awaitState('passed');
      if (browserName === 'chromium' && backend !== 'canvas2d') {
        const quality = result.phases.at(-1);
        const loss = quality.scenarios.find(
          (scenario) => scenario.name === 'native-loss-shadow-invalidation',
        );
        if (!loss || loss.metrics.unsupported)
          throw new Error(
            `Required native shadow recovery proof missing: ${loss?.metrics.unsupported ?? 'scenario absent'}`,
          );
      }
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
      try {
        await gpuCapture?.stop();
      } finally {
        await context.close();
      }
    }
    results.push(result);
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
          launchArgs: launch?.args,
          ...(nativeCapture
            ? { diagnosticOnly: true, timingCertification: false }
            : {}),
          ...(startupError ? { error: startupError } : {}),
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
if (startupError) console.error(startupError);
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
if (
  startupError ||
  !results.length ||
  results.some((result) => result.result === 'FAIL')
)
  process.exitCode = 1;
