/* global window, document, navigator, requestAnimationFrame, sessionStorage, CompositionEvent, InputEvent -- Playwright callbacks */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import { createServer } from 'vite';
import { chromium, firefox, webkit } from 'playwright-core';
import {
  browserLaunchOptions,
  browserIdentity,
  probeBackends,
} from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const name = args[i];
  if (
    !['--browser', '--renderer', '--mode', '--port', '--output'].includes(name)
  )
    throw new Error(`Unknown option ${name}.`);
  const value = args[++i];
  if (!value || value.startsWith('--'))
    throw new Error(`${name} needs a value.`);
  options.set(name, value);
}
const browserName = options.get('--browser') ?? 'chromium';
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error('Use --browser chromium|firefox|webkit.');
const mode = options.get('--mode') ?? 'desktop-automation';
if (!['desktop-automation', 'mobile-emulation'].includes(mode))
  throw new Error('Use --mode desktop-automation|mobile-emulation.');
const selected = (options.get('--renderer') ?? 'canvas2d,webgl2,webgpu').split(
  ',',
);
if (
  selected.some((name) => !['canvas2d', 'webgl2', 'webgpu'].includes(name)) ||
  new Set(selected).size !== selected.length
)
  throw new Error('Select unique canvas2d,webgl2,webgpu backends.');
const required = new Set(
  options.has('--renderer')
    ? selected
    : browserName === 'chromium'
      ? ['canvas2d', 'webgl2']
      : ['canvas2d'],
);
const port = Number(options.get('--port') ?? 5209);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid port.');
const directory = resolve(
  root,
  options.get('--output') ?? `.vite/platform-browser/${browserName}-${mode}`,
);
await mkdir(directory, { recursive: true });
await access(join(root, 'dist/src/index.js')).catch(() => {
  throw new Error(
    'Built root missing. Run pnpm build before platform-browser.',
  );
});
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
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser;
let launch;
let startupError;
const results = [];
try {
  await server.listen();
  launch = await browserLaunchOptions(browserName);
  browser = await browserType.launch(launch);
  let freezeCapability = null;
  if (browserName === 'chromium') {
    const probe = await browser.newPage();
    const session = await probe.context().newCDPSession(probe);
    try {
      await probe.setContent(
        '<!doctype html><title>Native lifecycle capability</title>',
      );
      await probe.evaluate(() => {
        const state = { ticks: 0, events: [] };
        window.platformFreezeProbe = state;
        const frame = () => {
          state.ticks++;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        for (const type of ['freeze', 'resume'])
          document.addEventListener(type, (event) =>
            state.events.push({
              type,
              trusted: event.isTrusted,
              ticks: state.ticks,
            }),
          );
      });
      await probe.waitForTimeout(100);
      await session.send('Page.setWebLifecycleState', { state: 'frozen' });
      await probe.waitForTimeout(300);
      await session.send('Page.setWebLifecycleState', { state: 'active' });
      await probe.waitForTimeout(100);
      const measured = await probe.evaluate(() => window.platformFreezeProbe);
      const [freeze, resume] = measured.events;
      if (
        measured.events.length !== 0 &&
        (measured.events.length !== 2 ||
          freeze.type !== 'freeze' ||
          resume.type !== 'resume' ||
          !freeze.trusted ||
          !resume.trusted ||
          freeze.ticks !== resume.ticks)
      )
        throw new Error(
          `Native lifecycle capability probe failed: ${JSON.stringify(measured)}`,
        );
      freezeCapability = {
        available: measured.events.length === 2,
        measured,
        reason:
          measured.events.length === 0
            ? 'Native CDP command produced no freeze/resume transition in an independent engine-free page on this browser/host.'
            : null,
      };
    } finally {
      await session.detach();
      await probe.close();
    }
  }
  for (const backend of selected) {
    const context = await browser.newContext({
      viewport:
        mode === 'mobile-emulation'
          ? { width: 430, height: 740 }
          : { width: 900, height: 800 },
      deviceScaleFactor: 1,
      hasTouch: true,
      ...(mode === 'mobile-emulation' && browserName !== 'firefox'
        ? { isMobile: true }
        : {}),
    });
    const page = await context.newPage();
    const result = {
      backend,
      result: 'FAIL',
      errors: [],
      audioResources: [],
      compositionMode: 'synthetic-native-events-not-real-IME',
      pointerMode: 'Playwright-mouse-and-emulated-touch',
      background: {
        result: 'UNSUPPORTED',
        reason:
          'Deterministic OS background/foreground is not exposed uniformly in headless Playwright; native pagehide navigation is checked separately. Use the manual probe for real visibility transitions.',
      },
      frozenLifecycle: {
        result: 'UNSUPPORTED',
        reason:
          'Page.setWebLifecycleState is Chromium CDP only; not an OS background or mobile suspension certification.',
      },
    };
    try {
      await page.goto(`http://127.0.0.1:${port}/tests/browser/probe.html`);
      result.capabilities = await probeBackends(page);
      if (!result.capabilities[backend].available) {
        result.result = required.has(backend) ? 'FAIL' : 'UNSUPPORTED';
        result.unavailable = result.capabilities[backend].reason;
        if (required.has(backend))
          result.errors.push(
            `Explicit/required ${backend} unavailable: ${result.unavailable}`,
          );
        results.push(result);
        continue;
      }
      page.on('pageerror', (error) =>
        result.errors.push(error.stack ?? error.message),
      );
      // Passive evidence only: worklet requests may be outside the page target.
      page.on('response', (response) => {
        if (response.url().includes('/vendor/opm/'))
          result.audioResources.push({
            url: response.url(),
            status: response.status(),
            mime: response.headers()['content-type'],
          });
      });
      page.on('requestfailed', (request) => {
        if (request.url().includes('/vendor/opm/'))
          result.audioResources.push({
            url: request.url(),
            error: request.failure()?.errorText,
          });
      });
      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          !message.location().url.endsWith('/favicon.ico')
        )
          result.errors.push(message.text());
      });
      const url = `http://127.0.0.1:${port}/tests/browser/platform.html?renderer=${backend}`;
      async function ready() {
        await page.waitForFunction(
          () =>
            ['ready', 'failed'].includes(
              document.querySelector('#report')?.getAttribute('data-state'),
            ),
          null,
          { timeout: 60000 },
        );
        const error = await page.evaluate(
          () =>
            window.__xyzPlatform?.report.error ||
            (document.querySelector('#report')?.getAttribute('data-state') ===
            'failed'
              ? document.querySelector('#report').textContent
              : ''),
        );
        if (error) throw new Error(error);
      }
      await page.goto(url);
      await ready();
      const field = page.locator('input[aria-label="Native field"]');
      await field.focus();
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute('aria-label') === 'Native field',
      );
      await page.keyboard.insertText('A🙂אב');
      await page.waitForFunction(
        () => window.__xyzPlatform.report.value === 'A🙂אב',
      );
      const mac = await page.evaluate(() => /Mac/.test(navigator.platform));
      await page.keyboard.press(mac ? 'Meta+ArrowRight' : 'End');
      await page.keyboard.press('Backspace');
      await page.waitForFunction(
        () => window.__xyzPlatform.report.value === 'A🙂א',
      );
      const nativeEdits = await page.evaluate(
        () => window.__xyzPlatform.report.nativeEdits,
      );
      if (
        nativeEdits.length !== 2 ||
        nativeEdits.some((event) => !event.trusted)
      )
        throw new Error(
          `Native trusted editing mismatch: ${JSON.stringify(nativeEdits)}`,
        );
      const compositionStart = await page.evaluate(() => {
        const start = window.__xyzPlatform.report.compositions.length;
        const native = document.querySelector(
          'input[aria-label="Native field"]',
        );
        native.dispatchEvent(
          new CompositionEvent('compositionstart', { data: '' }),
        );
        native.value = 'A🙂א語';
        native.dispatchEvent(
          new CompositionEvent('compositionupdate', { data: '語' }),
        );
        native.dispatchEvent(
          new InputEvent('input', {
            data: '語',
            inputType: 'insertCompositionText',
            isComposing: true,
            bubbles: true,
          }),
        );
        native.dispatchEvent(
          new CompositionEvent('compositionend', { data: '語' }),
        );
        return start;
      });
      await page.waitForFunction(
        () => window.__xyzPlatform.report.value === 'A🙂א語',
      );
      const composition = await page.evaluate(
        (start) => window.__xyzPlatform.report.compositions.slice(start),
        compositionStart,
      );
      if (
        composition.length !== 3 ||
        !composition[0].composing ||
        composition[2].composing ||
        composition.some((event) => event.trusted)
      )
        throw new Error(
          `Native synthetic composition boundary mismatch: ${JSON.stringify(composition)}`,
        );
      const box = await page.locator('#game').boundingBox();
      if (!box) throw new Error('Canvas is not visible.');
      await page.mouse.click(box.x + 120, box.y + 76);
      await page.waitForFunction(
        () => window.__xyzPlatform.report.activations === 1,
      );
      const touchBox = await page.locator('#game').boundingBox();
      if (!touchBox)
        throw new Error('Canvas is not visible after native focus.');
      await page.touchscreen.tap(touchBox.x + 120, touchBox.y + 76);
      await page.waitForFunction(
        () => window.__xyzPlatform.report.activations === 2,
      );
      const pointerTypes = await page.evaluate(
        () => window.__xyzPlatform.report.pointerTypes,
      );
      if (!pointerTypes.includes('mouse') || !pointerTypes.includes('touch'))
        throw new Error(`Missing native pointer paths: ${pointerTypes}`);
      const audioCapability = await page.evaluate(() => ({
        secureContext: globalThis.isSecureContext,
        audioContext: typeof globalThis.AudioContext,
        audioWorkletNode: typeof globalThis.AudioWorkletNode,
      }));
      if (
        process.platform === 'win32' &&
        browserName === 'webkit' &&
        audioCapability.secureContext &&
        audioCapability.audioContext === 'undefined' &&
        audioCapability.audioWorkletNode === 'undefined'
      ) {
        // Explicitly approved platform scope: the pinned Windows WebKit build
        // compiles out WEB_AUDIO. Keep all non-audio platform gates below.
        result.audio = {
          result: 'UNSUPPORTED',
          reason: 'Native Windows WebKit compiles out WebAudio/AudioWorklet.',
          measured: audioCapability,
          source:
            'https://github.com/WebKit/WebKit/blob/4d05d732e5a84f32675bef4cc135a2e7a9269a87/Source/cmake/OptionsWin.cmake',
        };
      } else {
        await page.locator('[aria-label="Unlock audio"]').focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(
          () =>
            window.__xyzPlatform.report.error ||
            (window.__xyzPlatform.report.audioUnlocked &&
              window.__xyzPlatform.report.audioGestureTrusted),
          null,
          { timeout: 30000 },
        );
        const audioReport = await page.evaluate(
          () => window.__xyzPlatform.report,
        );
        if (audioReport.error) throw new Error(audioReport.error);
        if (!audioReport.audioUnlocked || !audioReport.audioGestureTrusted)
          throw new Error('Native trusted audio unlock did not complete.');
        result.audio = { result: 'PASS', measured: audioCapability };
      }
      await page.evaluate(() => window.__xyzPlatform.lifecycle());
      await ready();
      if (freezeCapability?.available) {
        const session = await context.newCDPSession(page);
        try {
          await session.send('Page.setWebLifecycleState', { state: 'frozen' });
          await page.waitForTimeout(300);
        } finally {
          await session.send('Page.setWebLifecycleState', { state: 'active' });
          await session.detach();
        }
        await page.waitForFunction(
          () => window.__xyzPlatform.report.frozenLifecycle.length === 2,
        );
        const events = await page.evaluate(
          () => window.__xyzPlatform.report.frozenLifecycle,
        );
        if (
          events[0].type !== 'freeze' ||
          events[1].type !== 'resume' ||
          !events.every((event) => event.trusted) ||
          events[0].ticks !== events[1].ticks
        )
          throw new Error(
            `Native frozen lifecycle advanced Scene updates: ${JSON.stringify(events)}`,
          );
        await page.waitForFunction(
          (ticks) => window.__xyzPlatform.report.ticks > ticks,
          events[1].ticks,
        );
        result.frozenLifecycle = {
          result: 'PASS',
          mode: 'Chromium-CDP-native-freeze-not-OS-background',
          events,
        };
      }
      if (freezeCapability && !freezeCapability.available)
        result.frozenLifecycle = {
          result: 'UNSUPPORTED',
          reason: freezeCapability.reason,
          probe: freezeCapability.measured,
        };
      const beforeReload = await page.evaluate(() => ({
        ...window.__xyzPlatform.report,
      }));
      if (!beforeReload.lifecycleChecked || beforeReload.error)
        throw new Error(beforeReload.error || 'Lifecycle probe incomplete.');
      const { png, ...measured } = beforeReload;
      const proof = `${backend}-pixels.png`;
      if (!png.startsWith('data:image/png;base64,'))
        throw new Error('Missing native pixel PNG.');
      await writeFile(
        join(directory, proof),
        Buffer.from(png.slice('data:image/png;base64,'.length), 'base64'),
      );
      result.measured = { ...measured, proof };
      await page.evaluate(() => window.__xyzPlatform.save());
      await page.reload();
      await ready();
      await page.waitForFunction(
        () =>
          window.__xyzPlatform.report.restored &&
          window.__xyzPlatform.report.value === 'A🙂א語',
      );
      const hidden = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('xyz-platform-pagehide')),
      );
      const expectedState = hidden?.persisted ? 'running' : 'destroyed';
      if (
        hidden?.state !== expectedState ||
        hidden.sceneDestroyed !== !hidden.persisted
      )
        throw new Error(
          `Native pagehide violated persisted lifetime: ${JSON.stringify(hidden)}`,
        );
      result.pageLifecycle = {
        result: 'PASS',
        nativePagehide: hidden,
        storageReload: 'A🙂א語',
      };
      await page.evaluate(() => window.__xyzPlatform.destroy());
      await page.waitForFunction(
        () =>
          document.querySelector('#report')?.getAttribute('data-state') ===
          'destroyed',
      );
      if (result.errors.length) throw new Error('Uncaught browser error.');
      result.result = 'PASS';
    } catch (error) {
      result.errors.push(error.stack ?? String(error));
      await page
        .screenshot({ path: join(directory, `${backend}-failure.png`) })
        .catch((failure) => result.errors.push(failure.message));
      result.partial = await page
        .locator('#report')
        .textContent({ timeout: 1000 })
        .catch(() => null);
    } finally {
      await context.close();
    }
    results.push(result);
  }
} catch (error) {
  startupError = error.stack ?? String(error);
} finally {
  try {
    await writeFile(
      join(directory, 'results.json'),
      JSON.stringify(
        {
          ...browserIdentity(browserName, browser, launch, mode),
          mobileEmulation:
            mode === 'mobile-emulation'
              ? {
                  viewportAndTouch: true,
                  mobileLayout: browserName !== 'firefox',
                  physicalMobileDevice: false,
                }
              : null,
          launchArgs: launch?.args,
          startupError,
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
console.table(
  results.map(({ backend, result, unavailable }) => ({
    backend,
    result,
    unavailable,
  })),
);
if (startupError) console.error(startupError);
for (const result of results)
  for (const error of result.errors) console.error(error);
console.log(`Measured platform reports: ${directory}`);
if (
  startupError ||
  !results.length ||
  results.some((result) => result.result === 'FAIL')
)
  process.exitCode = 1;
