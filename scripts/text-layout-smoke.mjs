/* global window, document, CompositionEvent, InputEvent, createImageBitmap, fetch -- Playwright callbacks */
import { access, mkdir, writeFile } from 'node:fs/promises';
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

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const name = args[i];
  if (!['--browser', '--renderer', '--port', '--output'].includes(name))
    throw new Error(`Unknown option ${name}.`);
  const value = args[++i];
  if (!value || value.startsWith('--'))
    throw new Error(`${name} needs a value.`);
  options.set(name, value);
}
const browserName = options.get('--browser') ?? 'chromium';
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error('Use --browser chromium|firefox|webkit.');
const backend = options.get('--renderer') ?? 'canvas2d';
if (!['canvas2d', 'webgl2', 'webgpu'].includes(backend))
  throw new Error('Use --renderer canvas2d|webgl2|webgpu.');
const port = Number(options.get('--port') ?? 5213);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid port.');
const directory = resolve(
  root,
  options.get('--output') ?? `.vite/text-layout/${browserName}/${backend}`,
);
await mkdir(directory, { recursive: true });
await access(join(root, 'dist/src/index.js')).catch(() => {
  throw new Error(
    'Built root missing. Run pnpm build before text-layout-smoke.',
  );
});
const server = await createServer({
  root,
  cacheDir: join(directory, 'vite-cache'),
  resolve: {
    alias: [
      { find: '../src/index.js', replacement: join(root, 'dist/src/index.js') },
    ],
  },
  server: { host: '127.0.0.1', port, strictPort: true },
});
let browser;
let launch;
const report = {
  result: 'FAIL',
  backend,
  errors: [],
  proofs: [],
  editingMode: 'trusted-Playwright-keyboard-and-mouse',
  compositionMode: 'synthetic-browser-bridge-only-not-real-OS-IME',
};
try {
  await server.listen();
  launch = await browserLaunchOptions(browserName);
  browser = await browserType.launch(launch);
  report.identity = browserIdentity(browserName, browser, launch);
  const page = await browser.newPage({
    viewport: { width: 1000, height: 620 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (error) =>
    report.errors.push(error.stack ?? error.message),
  );
  await page.goto(
    `http://127.0.0.1:${port}/tests/browser/text-layout.html?renderer=${backend}`,
  );
  report.capabilities = await probeBackends(page);
  await page.waitForFunction(() => window.textLayoutSmoke !== undefined, null, {
    timeout: 60000,
  });
  const initial = await page.evaluate(() => ({
    ready: window.textLayoutSmoke.ready,
    failures: window.textLayoutSmoke.failures,
    backend: window.textLayoutSmoke.backend,
    fontReady: window.textLayoutSmoke.fontReady,
    declaredFontLoaded: [...document.fonts].some(
      (face) =>
        face.family.replaceAll('"', '') === 'XYZSmokeAbel' &&
        face.status === 'loaded',
    ),
    caretExpectations: window.textLayoutSmoke.caretExpectations,
    proofCases: window.textLayoutSmoke.proofCases,
  }));
  report.initial = initial;
  if (
    !initial.ready ||
    initial.failures.length ||
    initial.backend !== backend ||
    initial.fontReady !== 'loaded' ||
    !initial.declaredFontLoaded
  )
    throw new Error(`Text fixture failed: ${JSON.stringify(initial)}`);
  const rtl = await page.evaluate(() =>
    window.textLayoutSmoke.showRTLViewportProof(),
  );
  if (
    rtl.expected.width <= 0 ||
    rtl.actual.width < rtl.expected.width * 0.9 ||
    rtl.actual.count < rtl.expected.count * 0.7
  )
    throw new Error(
      `Short RTL paragraph is clipped inside a wider input: ${JSON.stringify(rtl)}`,
    );
  await writeFile(
    join(directory, 'rtl-full-paragraph.png'),
    Buffer.from(rtl.png.slice('data:image/png;base64,'.length), 'base64'),
  );
  report.rtlViewport = { expected: rtl.expected, actual: rtl.actual };
  const captureProof = async (name) => {
    const proof = await page.evaluate(
      (value) =>
        value === 'native-caret'
          ? window.textLayoutSmoke.showCaretProof(2)
          : window.textLayoutSmoke.showProof(value),
      name,
    );
    if (!proof.png.startsWith('data:image/png;base64,'))
      throw new Error('Canvas proof is not PNG.');
    const pixels = await page.evaluate(async (value) => {
      const before = await createImageBitmap(
        await (await fetch(value.beforePng)).blob(),
      );
      const after = await createImageBitmap(
        await (await fetch(value.png)).blob(),
      );
      try {
        const canvas = document.createElement('canvas');
        canvas.width = after.width;
        canvas.height = after.height;
        const context = canvas.getContext('2d');
        context.drawImage(before, 0, 0);
        const first = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(after, 0, 0);
        const second = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        return value.regions.map((region) => {
          // Include every pixel intersecting the region, including fractional one-pixel carets.
          const left = Math.max(
            0,
            Math.floor((region.x * canvas.width) / value.logicalWidth),
          );
          const right = Math.min(
            canvas.width,
            Math.ceil(
              ((region.x + region.width) * canvas.width) / value.logicalWidth,
            ),
          );
          const top = Math.max(
            0,
            Math.floor((region.y * canvas.height) / value.logicalHeight),
          );
          const bottom = Math.min(
            canvas.height,
            Math.ceil(
              ((region.y + region.height) * canvas.height) /
                value.logicalHeight,
            ),
          );
          let changed = 0;
          for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
              const index = (y * canvas.width + x) * 4;
              if (
                Math.max(
                  Math.abs(first[index] - second[index]),
                  Math.abs(first[index + 1] - second[index + 1]),
                  Math.abs(first[index + 2] - second[index + 2]),
                ) > 20
              )
                changed++;
            }
          }
          const area = Math.max(0, right - left) * Math.max(0, bottom - top);
          return {
            region,
            area,
            changed,
            required: Math.max(1, Math.ceil(area * 0.05)),
          };
        });
      } finally {
        before.close();
        after.close();
      }
    }, proof);
    await writeFile(
      join(directory, `${name}-before-canvas.png`),
      Buffer.from(
        proof.beforePng.slice('data:image/png;base64,'.length),
        'base64',
      ),
    );
    await writeFile(
      join(directory, `${name}-canvas.png`),
      Buffer.from(proof.png.slice('data:image/png;base64,'.length), 'base64'),
    );
    await page.screenshot({ path: join(directory, `${name}-page.png`) });
    report.proofs.push({
      name,
      geometry: proof.geometry,
      pixels,
      canvas: `${name}-canvas.png`,
      baseline: `${name}-before-canvas.png`,
      screenshot: `${name}-page.png`,
    });
    if (
      pixels.some(
        (region) => region.area <= 0 || region.changed < region.required,
      )
    )
      throw new Error(
        `Selection was not drawn inside its expected canvas rectangles: ${JSON.stringify(pixels)}`,
      );
  };
  for (const name of ['bidi-disjoint', 'zwj-cluster']) await captureProof(name);
  const pointer = await page.evaluate(() => {
    const smoke = window.textLayoutSmoke;
    const field = smoke.fields[2];
    const proof = smoke.proofCases.find(
      (candidate) => candidate.name === 'zwj-cluster',
    );
    const shape = field.selectionGeometry.rectangles[0];
    const box = field.getWorldBounds();
    const padding = field.layout.padding;
    const left = typeof padding === 'number' ? padding : (padding?.[3] ?? 0);
    const canvas = smoke.game.canvas.getBoundingClientRect();
    return {
      x:
        canvas.left +
        ((box.x + left + shape.x + shape.width / 2) / smoke.game.width) *
          canvas.width,
      y:
        canvas.top +
        ((box.y + box.height / 2) / smoke.game.height) * canvas.height,
      allowed: [proof.start - 2, proof.end + 2],
      original: field.value,
    };
  });
  await page.mouse.click(pointer.x, pointer.y);
  await page.waitForFunction(() => document.activeElement?.tagName === 'INPUT');
  report.pointer = await page.evaluate(() => ({
    start: window.textLayoutSmoke.fields[2].selectionStart,
    end: window.textLayoutSmoke.fields[2].selectionEnd,
    activeLabel: document.activeElement?.getAttribute('aria-label'),
  }));
  if (
    report.pointer.start !== report.pointer.end ||
    !pointer.allowed.includes(report.pointer.start)
  )
    throw new Error(
      `Canvas pointer entered the ZWJ cluster: ${JSON.stringify(report.pointer)}`,
    );
  // macOS End scrolls the document in Firefox; Command+Right is native line-end.
  const lineEndShortcut =
    process.platform === 'darwin' ? 'Meta+ArrowRight' : 'End';
  await page.keyboard.press(lineEndShortcut);
  report.lineEnd = await page.evaluate(() => ({
    nativeStart: document.activeElement.selectionStart,
    nativeEnd: document.activeElement.selectionEnd,
    start: window.textLayoutSmoke.fields[2].selectionStart,
    end: window.textLayoutSmoke.fields[2].selectionEnd,
  }));
  report.lineEnd.shortcut = lineEndShortcut;
  if (
    [
      report.lineEnd.nativeStart,
      report.lineEnd.nativeEnd,
      report.lineEnd.start,
      report.lineEnd.end,
    ].some((index) => index !== pointer.original.length)
  )
    throw new Error(
      `Native line-end selection mismatch: ${JSON.stringify(report.lineEnd)}`,
    );
  await page.keyboard.insertText('語');
  await page.waitForFunction(
    (value) => window.textLayoutSmoke.fields[2].value === value,
    `${pointer.original}語`,
  );
  report.trustedEditing = await page.evaluate(() => ({
    value: window.textLayoutSmoke.fields[2].value,
    events: window.textLayoutSmoke.events.filter(
      (event) => event.type === 'input',
    ),
  }));
  if (!report.trustedEditing.events.some((event) => event.trusted))
    throw new Error('No trusted native input event reached the canvas field.');
  await page.screenshot({
    path: join(directory, 'trusted-editing-cjk-fallback.png'),
  });
  await page.waitForFunction(
    () =>
      window.textLayoutSmoke.fields[2].selectionGeometry.caret.index ===
      window.textLayoutSmoke.fields[2].value.length,
  );
  await captureProof('native-caret');
  const composition = await page.evaluate(() => {
    const input = document.activeElement;
    const field = window.textLayoutSmoke.fields[2];
    input.dispatchEvent(new CompositionEvent('compositionstart', { data: '' }));
    input.value += '候補';
    input.setSelectionRange(input.value.length, input.value.length);
    input.dispatchEvent(
      new InputEvent('input', {
        data: '候補',
        inputType: 'insertCompositionText',
        isComposing: true,
      }),
    );
    const during = {
      composing: field.isComposing,
      value: field.value,
      start: field.selectionStart,
      end: field.selectionEnd,
    };
    input.dispatchEvent(
      new CompositionEvent('compositionend', { data: '候補' }),
    );
    return { during, after: field.isComposing, nativeValue: input.value };
  });
  report.compositionBridge = composition;
  if (
    !composition.during.composing ||
    composition.after ||
    composition.during.value !== composition.nativeValue ||
    composition.during.start !== composition.nativeValue.length ||
    composition.during.end !== composition.nativeValue.length
  )
    throw new Error(
      `Native composition bridge mismatch: ${JSON.stringify(composition)}`,
    );
  await page.waitForFunction(
    () =>
      window.textLayoutSmoke.fields[2].selectionGeometry.caret.index ===
      window.textLayoutSmoke.fields[2].value.length,
  );
  await page.screenshot({ path: join(directory, 'composition-bridge.png') });
  report.cleanup = await page.evaluate(() => {
    window.textLayoutSmoke.dispose();
    return {
      measurements: document.querySelectorAll('[data-xyz-text-measurement]')
        .length,
      nativeInputs: document.querySelectorAll('input').length,
    };
  });
  if (report.cleanup.measurements || report.cleanup.nativeInputs)
    throw new Error(
      `Text measurement/native semantics leaked: ${JSON.stringify(report.cleanup)}`,
    );
  if (report.errors.length) throw new Error('Page errors occurred.');
  report.result = 'PASS';
} catch (error) {
  report.errors.push(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exitCode = 1;
} finally {
  if (!report.identity)
    report.identity = browserIdentity(browserName, browser, launch);
  try {
    await browser?.close();
  } catch (error) {
    report.errors.push(`Browser cleanup: ${String(error)}`);
    report.result = 'FAIL';
    process.exitCode = 1;
  }
  try {
    await server.close();
  } catch (error) {
    report.errors.push(`Server cleanup: ${String(error)}`);
    report.result = 'FAIL';
    process.exitCode = 1;
  }
  await writeFile(
    join(directory, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(
    JSON.stringify({
      result: report.result,
      backend,
      browser: browserName,
      report: join(directory, 'report.json'),
    }),
  );
}
