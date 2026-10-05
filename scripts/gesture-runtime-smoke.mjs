/* global document, Event, requestAnimationFrame, window -- callbacks evaluated in Chromium */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import console from 'node:console';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';

const port = Number(process.env.GESTURE_SMOKE_PORT ?? 5298);
const directory = '.vite/gesture-runtime';
const report = {
  assertions: [],
  errors: [],
  traces: [],
  scope: {
    touch:
      'Trusted Chromium CDP touch input through Game.input; no synthetic PointerEvents or direct recognizer feeding.',
    release:
      'CDP mouseReleased supplies unseen final coordinates through the same real pointer input path; CDP touchEnd has no touch points.',
    blur: 'Explicitly dispatched window blur lifecycle event (not physical focus certification) resets active contacts, not subscriptions. Fresh input remains supported until Game.destroy().',
    physicalDeviceCertification: false,
  },
};
let server, browser, page;
const check = (condition, label) => {
  if (!condition) throw new Error(label);
  report.assertions.push(label);
};
try {
  await mkdir(directory, { recursive: true });
  server = await createServer({
    server: { host: '127.0.0.1', port, strictPort: true },
  });
  await server.listen();
  const launch = await browserLaunchOptions('chromium');
  browser = await chromium.launch(launch);
  report.identity = browserIdentity('chromium', browser, launch);
  page = await browser.newPage({
    hasTouch: true,
    viewport: { width: 640, height: 480 },
  });
  page.on('pageerror', (error) => report.errors.push(error.stack));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.evaluate(async () => {
    const { Game, Scene } = await import('/src/index.ts');
    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:fixed;left:0;top:0;margin:0;border:0;padding:0;width:400px;height:300px;touch-action:none';
    document.body.style.margin = '0';
    document.body.replaceChildren(canvas);
    const game = await Game.create({
      canvas,
      width: 400,
      height: 300,
      renderer: 'canvas2d',
    });
    const events = [],
      pointers = [];
    for (const type of [
      'tap',
      'doubletap',
      'longpress',
      'swipe',
      'pan',
      'pinch',
      'rotate',
    ])
      game.input.gestures.on(type, (detail) => events.push(detail));
    for (const type of [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel',
    ])
      canvas.addEventListener(type, (event) =>
        pointers.push({
          type,
          trusted: event.isTrusted,
          pointerType: event.pointerType,
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        }),
      );
    let blurs = 0;
    window.addEventListener('blur', () => blurs++);
    globalThis.gestureSmoke = {
      game,
      events,
      pointers,
      get blurs() {
        return blurs;
      },
    };
    game.start(new Scene());
  });
  const cdp = await page.context().newCDPSession(page);
  const frames = () =>
    page.evaluate(async () => {
      for (let i = 0; i < 2; i++)
        await new Promise((resolve) => requestAnimationFrame(resolve));
    });
  const point = (id, x, y) => ({ id, x, y, radiusX: 1, radiusY: 1, force: 1 });
  const touch = async (type, touchPoints = []) => {
    await cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
    await frames();
  };
  const snapshot = async (label) => {
    const trace = await page.evaluate(() => {
      const state = globalThis.gestureSmoke;
      return {
        events: state.events.splice(0),
        pointers: state.pointers.splice(0),
        blurs: state.blurs,
      };
    });
    report.traces.push({ label, ...trace });
    return trace;
  };
  const latest = (trace, type, phase) =>
    trace.events
      .filter((event) => event.type === type && event.phase === phase)
      .at(-1);
  const near = (actual, expected) => Math.abs(actual - expected) < 0.02;

  await touch('touchStart', [point(1, 100, 100), point(2, 200, 100)]);
  await touch('touchMove', [point(1, 80, 100), point(2, 220, 100)]);
  const apart = await snapshot('pinch-apart');
  check(
    near(
      latest(apart, 'pinch', 'change')?.scale ??
        latest(apart, 'pinch', 'start')?.scale,
      1.4,
    ),
    'Two native fingers moving apart yield pinch scale 1.4',
  );
  check(
    apart.pointers.filter((event) => event.type === 'pointerdown').length ===
      2 &&
      apart.pointers.every(
        (event) => event.trusted && event.pointerType === 'touch',
      ),
    'CDP pair reaches canvas as two trusted touch pointers',
  );
  await touch('touchMove', [point(1, 110, 100), point(2, 190, 100)]);
  const together = await snapshot('pinch-together');
  check(
    near(latest(together, 'pinch', 'change')?.scale, 0.8),
    'Fingers moving together yield pinch scale 0.8',
  );
  await touch('touchMove', [point(1, 150, 60), point(2, 150, 140)]);
  const clockwise = await snapshot('rotate-clockwise');
  check(
    near(
      clockwise.events.filter((event) => event.type === 'rotate').at(-1)
        ?.rotation,
      Math.PI / 2,
    ),
    'Rotating pair clockwise yields +pi/2 radians',
  );
  await touch('touchMove', [point(1, 110, 100), point(2, 190, 100)]);
  const reverse = await snapshot('rotate-back');
  check(
    near(latest(reverse, 'rotate', 'change')?.rotation, 0),
    'Rotating pair back returns angle to zero',
  );
  await touch('touchEnd');
  const pairEnd = await snapshot('pair-end');
  check(
    !!latest(pairEnd, 'pinch', 'end') &&
      !!latest(pairEnd, 'rotate', 'end') &&
      !pairEnd.events.some(
        (event) => event.type === 'swipe' || event.type === 'tap',
      ),
    'Pair completes pinch/rotate without tap or swipe',
  );

  await touch('touchStart', [point(3, 70, 220)]);
  await touch('touchMove', [point(3, 190, 220)]);
  await touch('touchMove', [point(3, 280, 220)]);
  await touch('touchEnd');
  const swipe = await snapshot('single-swipe');
  check(
    latest(swipe, 'swipe', 'end')?.direction === 'right',
    'Single native touch swipe fires with right direction',
  );

  await touch('touchStart', [point(4, 100, 100), point(5, 200, 100)]);
  await touch('touchMove', [point(4, 100, 100), point(5, 230, 150)]);
  const active = await snapshot('before-cancel');
  check(
    !!latest(active, 'pinch', 'start') && !!latest(active, 'rotate', 'start'),
    'Cancel test has active pinch and rotate',
  );
  await touch('touchCancel');
  const cancelled = await snapshot('touch-cancel');
  check(
    cancelled.pointers.some(
      (event) => event.type === 'pointercancel' && event.trusted,
    ),
    'CDP touchCancel delivers trusted pointercancel',
  );
  check(
    !!latest(cancelled, 'pinch', 'cancel') &&
      !!latest(cancelled, 'rotate', 'cancel') &&
      !cancelled.events.some((event) => event.phase === 'end'),
    'pointercancel cancels pair without completion events',
  );

  // Queue the native down/up together: renderer-frame waits can turn a swipe into a long press.
  await Promise.all([
    cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: 60,
      y: 220,
      button: 'left',
      buttons: 1,
      clickCount: 1,
    }),
    cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: 180,
      y: 220,
      button: 'left',
      buttons: 0,
      clickCount: 1,
    }),
  ]);
  await frames();
  const release = await snapshot('unseen-final-release');
  check(
    release.pointers.some(
      (event) => event.type === 'pointerup' && event.trusted && event.x === 180,
    ) && !release.pointers.some((event) => event.type === 'pointermove'),
    'Native pointerup carries final unseen movement without preceding pointermove',
  );
  check(
    latest(release, 'pan', 'end')?.translation.x === 120 &&
      latest(release, 'swipe', 'end')?.center.x === 180,
    'Final pointerup movement reaches pan completion and swipe payload',
  );

  await touch('touchStart', [point(6, 100, 100), point(7, 200, 100)]);
  await touch('touchMove', [point(6, 100, 100), point(7, 240, 150)]);
  await snapshot('before-blur');
  // Headless tab activation does not reliably emit window blur; exercise the lifecycle handler explicitly.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await snapshot('window-blur');
  check(
    !!latest(blurred, 'pinch', 'cancel') &&
      !!latest(blurred, 'rotate', 'cancel') &&
      !blurred.events.some((event) => event.phase === 'end'),
    'Window blur handler cancels active pair without completion',
  );
  await touch('touchMove', [point(6, 100, 100), point(7, 260, 170)]);
  await touch('touchEnd');
  check(
    (await snapshot('old-contacts-after-blur')).events.length === 0,
    'Old contacts produce no gesture events after blur',
  );
  await touch('touchStart', [point(8, 100, 100), point(9, 200, 100)]);
  await touch('touchMove', [point(8, 100, 100), point(9, 240, 150)]);
  const resumed = await snapshot('fresh-input-after-blur');
  check(
    !!latest(resumed, 'pinch', 'start'),
    'Blur preserves subscriptions for fresh gestures',
  );
  await page.evaluate(() => globalThis.gestureSmoke.game.destroy());
  const destroyed = await snapshot('destroy');
  check(
    !!latest(destroyed, 'pinch', 'cancel') &&
      !!latest(destroyed, 'rotate', 'cancel'),
    'Game.destroy cancels active gestures',
  );
  await touch('touchMove', [point(8, 100, 100), point(9, 270, 180)]);
  await touch('touchEnd');
  await touch('touchStart', [point(10, 100, 100), point(11, 200, 100)]);
  await touch('touchMove', [point(10, 100, 100), point(11, 260, 170)]);
  await touch('touchEnd');
  const afterDestroy = await snapshot('input-after-destroy');
  check(
    afterDestroy.pointers.some(
      (event) => event.type === 'pointerdown' && event.trusted,
    ) && afterDestroy.events.length === 0,
    'Trusted old and fresh input yields no gestures after Game.destroy',
  );
} catch (error) {
  report.errors.push(error.stack ?? String(error));
  if (page) {
    const partial = await page
      .evaluate(() => {
        const state = globalThis.gestureSmoke;
        return state
          ? {
              events: state.events,
              pointers: state.pointers,
              blurs: state.blurs,
            }
          : null;
      })
      .catch(() => null);
    if (partial) report.traces.push({ label: 'failure-partial', ...partial });
  }
} finally {
  try {
    await browser?.close();
  } finally {
    await server?.close();
    await mkdir(directory, { recursive: true });
    await writeFile(
      `${directory}/report.json`,
      JSON.stringify(report, null, 2),
    );
  }
}
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
