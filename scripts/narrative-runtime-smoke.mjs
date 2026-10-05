/* global document, requestAnimationFrame -- used inside page.evaluate, which runs in the browser */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import console from 'node:console';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';

const port = Number(process.env.NARRATIVE_SMOKE_PORT ?? 5297);
const server = await createServer({
  server: { host: '127.0.0.1', port, strictPort: true },
});
const directory = '.vite/narrative-runtime';
await mkdir(directory, { recursive: true });
const launch = await browserLaunchOptions('chromium');
let browser, page;
const report = {
  assertions: [],
  errors: [],
  pointerScope:
    'Playwright touchscreen sends active browser touch pointers through the real Game InputManager; not physical hardware evidence.',
};
try {
  await server.listen();
  browser = await chromium.launch(launch);
  report.identity = browserIdentity('chromium', browser, launch);
  page = await browser.newPage({ hasTouch: true });
  await page.exposeFunction('performNarrativeTouch', (x, y) =>
    page.touchscreen.tap(x, y),
  );
  const cdp = await page.context().newCDPSession(page);
  await page.exposeFunction('performNarrativeGesture', async (kind, x, y) => {
    const point = (id, dx, dy) => ({
      id,
      x: x + dx,
      y: y + dy,
      radiusX: 1,
      radiusY: 1,
      force: 1,
    });
    const send = (type, touchPoints) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
    if (kind === 'doubletap') {
      await page.touchscreen.tap(x + 30, y + 30);
      await page.touchscreen.tap(x + 30, y + 30);
      return;
    }
    await send('touchStart', [point(1, 40, 40)]);
    if (kind === 'longpress') await page.waitForTimeout(600);
    else if (kind === 'pair') {
      await send('touchStart', [point(1, 40, 40), point(2, 120, 40)]);
      await send('touchMove', [point(1, 40, 40), point(2, 180, 90)]);
    } else {
      await send('touchMove', [point(1, 80, 40)]);
      await send('touchMove', [point(1, 140, 40)]);
    }
    await send(kind === 'cancel' ? 'touchCancel' : 'touchEnd', []);
  });
  page.on('pageerror', (error) => report.errors.push(error.stack));
  await page.goto(`http://127.0.0.1:${port}/`);
  report.assertions = await page.evaluate(async () => {
    const E = await import('/src/index.ts');
    const assertions = [];
    globalThis.narrativeAssertions = assertions;
    const check = (condition, label) => {
      if (!condition) throw new Error(label);
      assertions.push(label);
    };
    const frames = async (count = 3) => {
      for (let i = 0; i < count; i++)
        await new Promise((resolve) => requestAnimationFrame(resolve));
    };
    const until = async (predicate, label) => {
      for (let i = 0; i < 240; i++) {
        if (predicate()) return;
        await frames(1);
      }
      throw new Error(`Timed out: ${label}`);
    };
    const canvas = document.createElement('canvas');
    canvas.style.touchAction = 'none';
    document.body.replaceChildren(canvas);
    const game = await E.Game.create({
      canvas,
      width: 320,
      height: 160,
      renderer: 'canvas2d',
    });
    const scene = new E.Scene();
    let coins = 0;
    const quests = scene.add(
      new E.QuestSystem(
        [
          {
            id: 'delivery',
            objectives: [{ id: 'parcel', target: 2 }],
            rewards: ['coin'],
          },
          {
            id: 'return',
            prerequisites: ['delivery'],
            objectives: [{ id: 'home', target: 1 }],
            rewards: ['badge'],
          },
        ],
        {
          onReward: (rewards) => {
            coins += rewards.length;
          },
        },
      ),
    );
    let chosen;
    let barrierSignal;
    const events = [];
    const dialogue = scene.add(
      new E.Dialogue(
        {
          id: 'courier',
          start: 'offer',
          nodes: [
            {
              id: 'offer',
              text: 'Accept delivery?',
              choices: [
                {
                  id: 'yes',
                  text: 'Yes',
                  next: 'accepted',
                  events: ['accept'],
                },
                { id: 'no', text: 'No', next: 'declined' },
              ],
            },
            { id: 'accepted', text: 'Bring two parcels.', events: ['chosen'] },
            { id: 'declined', text: 'Goodbye.', events: ['chosen'] },
          ],
        },
        {
          onEvent: (event) => {
            events.push(event);
            if (event === 'accept') quests.accept('delivery');
            if (event === 'chosen') chosen?.();
          },
        },
      ),
    );
    const director = scene.add(
      new E.CutsceneDirector({
        duration: 1,
        tracks: [
          {
            id: 'camera',
            start: 0,
            duration: 1,
            action: E.cutsceneTween(
              E.Tween.to(
                scene.camera2D,
                { 'position.x': 100 },
                { duration: 1 },
              ),
            ),
          },
        ],
        cues: [
          {
            id: 'dialogue',
            at: 0.1,
            run: ({ signal }) => {
              barrierSignal = signal;
              dialogue.start();
              return new Promise((resolve) => {
                chosen = resolve;
              });
            },
          },
        ],
      }),
    );
    try {
      await game.setScene(scene);
      director.play();
      game.start();
      await until(
        () => director.status === 'waiting',
        'scene-owned dialogue barrier',
      );
      check(
        director.time === 0.1 && scene.camera2D.position.x > 0,
        'Real Game frames advance camera and stop at choice barrier',
      );
      director.pause();
      const pausedTime = director.time;
      await frames();
      check(director.time === pausedTime, 'Pause freezes simulation playhead');
      dialogue.choose('yes');
      await frames();
      check(
        director.status === 'paused' &&
          quests.get('delivery').status === 'active',
        'Branch choice activates quest without overriding pause',
      );
      director.resume();
      await until(() => director.time > 0.15, 'resume advancement');
      director.pause();
      director.seek(0.05);
      check(
        Math.abs(scene.camera2D.position.x - 5) < 0.001 &&
          events.length === 2 &&
          barrierSignal.aborted,
        'Backward seek samples camera and aborts cue ownership without replay',
      );
      director.seek(0.8);
      director.resume();
      await until(() => director.status === 'completed', 'cutscene completion');
      check(
        events.length === 2 && scene.camera2D.position.x === 100,
        'Forward seek and completion do not repeat dialogue side effects',
      );
      director.cancel();
      check(
        scene.camera2D.position.x === 0 && director.status === 'cancelled',
        'Cancellation restores borrowed camera state',
      );
      quests.progress('delivery', 'parcel', 2);
      check(
        quests.get('return').status === 'available' && coins === 1,
        'Quest completion unlocks dependent quest and applies reward once',
      );
      const payload = {
        dialogue: dialogue.save(),
        quests: quests.save(),
        coins,
      };
      E.assertJsonValue(payload);
      await game.saves.save('narrative', payload);
      quests.accept('return');
      quests.progress('return', 'home');
      const loaded = await game.saves.load('narrative');
      check(
        loaded.status === 'loaded',
        'SaveManager persists joint narrative payload',
      );
      dialogue.restore(loaded.record.data.dialogue);
      quests.restore(loaded.record.data.quests);
      coins = loaded.record.data.coins;
      check(
        coins === 1 &&
          events.length === 2 &&
          quests.get('return').status === 'available',
        'Restore rolls back state without duplicate rewards or dialogue events',
      );
      const rng = new E.SeededRandom(42);
      const state = rng.state;
      const sequence = [
        rng.next(),
        rng.int(-8, 9),
        rng.choose(['a', 'b', 'c']),
      ];
      rng.restore(state);
      check(
        JSON.stringify(sequence) ===
          JSON.stringify([
            rng.next(),
            rng.int(-8, 9),
            rng.choose(['a', 'b', 'c']),
          ]),
        'Root SeededRandom state restores exact consumer sequence',
      );
      let destroyed = 0;
      const pool = new E.ObjectPool({
        capacity: 1,
        create: () => ({ hp: 10 }),
        reset: (item) => {
          item.hp = 10;
        },
        destroy: () => {
          destroyed++;
        },
      });
      const item = pool.borrow();
      item.hp = 1;
      let exhausted = false;
      try {
        pool.borrow();
      } catch {
        exhausted = true;
      }
      pool.release(item);
      const reused = pool.borrow();
      check(
        exhausted && reused === item && reused.hp === 10,
        'Root ObjectPool enforces bound and resets reused consumer object',
      );
      pool.destroy();
      pool.destroy();
      check(
        destroyed === 1,
        'Pool borrowed objects are destroyed exactly once',
      );
      const gestureEvents = [];
      const off = game.input.gestures.on('tap', (detail) =>
        gestureEvents.push(detail),
      );
      const pointers = [];
      const recordPointer = (event) =>
        pointers.push({
          type: event.type,
          trusted: event.isTrusted,
          pointerType: event.pointerType,
          id: event.pointerId,
        });
      canvas.addEventListener('pointerdown', recordPointer);
      canvas.addEventListener('pointerup', recordPointer);
      const rect = canvas.getBoundingClientRect();
      await globalThis.performNarrativeTouch(rect.left + 20, rect.top + 20);
      await frames();
      off();
      canvas.removeEventListener('pointerdown', recordPointer);
      canvas.removeEventListener('pointerup', recordPointer);
      check(
        gestureEvents.length === 1 &&
          gestureEvents[0].pointerIds.length === 1 &&
          pointers.length === 2 &&
          pointers.every(
            (event) => event.trusted && event.pointerType === 'touch',
          ) &&
          gestureEvents[0].pointerIds[0] === pointers[0].id,
        'Active trusted browser touch pointer stream reaches Game gesture recognizer',
      );
      const recognized = [];
      const stopRecognizing = [
        'tap',
        'doubletap',
        'longpress',
        'swipe',
        'pan',
        'pinch',
        'rotate',
      ].map((type) =>
        game.input.gestures.on(type, (detail) => recognized.push(detail)),
      );
      for (const kind of [
        'doubletap',
        'longpress',
        'swipe',
        'pair',
        'cancel',
      ]) {
        await globalThis.performNarrativeGesture(kind, rect.left, rect.top);
        await frames();
      }
      stopRecognizing.forEach((stop) => stop());
      check(
        [
          'tap',
          'doubletap',
          'longpress',
          'swipe',
          'pan',
          'pinch',
          'rotate',
        ].every((type) => recognized.some((detail) => detail.type === type)),
        `Active CDP touch recognizes all seven public gesture types: ${JSON.stringify(recognized.map((detail) => ({ type: detail.type, phase: detail.phase, velocity: detail.velocity })))}`,
      );
      check(
        recognized.some(
          (detail) => detail.type === 'pan' && detail.phase === 'cancel',
        ) &&
          recognized.some(
            (detail) => detail.type === 'pinch' && detail.phase === 'end',
          ) &&
          recognized.some(
            (detail) => detail.type === 'rotate' && detail.phase === 'end',
          ),
        'Active touch cancel and two-contact release close continuous gestures',
      );
      const pending = scene.add(
        new E.CutsceneDirector({
          duration: 1,
          cues: [
            {
              id: 'hold',
              at: 0,
              run: ({ signal }) => {
                barrierSignal = signal;
                return new Promise(() => {});
              },
            },
          ],
        }),
      );
      pending.play();
      await until(() => pending.status === 'waiting', 'owned pending barrier');
      game.destroy();
      check(
        scene.destroyed &&
          pending.destroyed &&
          barrierSignal.aborted &&
          pending.status === 'cancelled',
        'Game destruction disposes narrative Scene objects and aborts pending UI barrier',
      );
      return assertions;
    } finally {
      game.destroy();
    }
  });
} catch (error) {
  report.errors.push(error.stack);
  if (page)
    report.assertions = await page
      .evaluate(() => globalThis.narrativeAssertions ?? [])
      .catch(() => report.assertions);
} finally {
  await browser?.close();
  await server.close();
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
