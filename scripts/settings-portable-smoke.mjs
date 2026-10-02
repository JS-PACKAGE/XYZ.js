/* global document, indexedDB, getComputedStyle */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { browserLaunchOptions } from './browser-launch.mjs';
import { installSilentSurface } from './site-smoke-support.mjs';

async function ready(page) {
  await page.waitForFunction(
    () =>
      document.querySelector('#mode')?.textContent ===
      'Ready — enable sound or choose muted play.',
  );
}
async function status(page, id, text) {
  await page.waitForFunction(
    ({ id, text }) => document.getElementById(id)?.textContent === text,
    { id, text },
  );
}
async function download(page, prepare, button) {
  if (prepare) await page.locator('#' + prepare).click();
  await page.waitForFunction(
    (id) => !document.getElementById(id)?.disabled,
    button,
  );
  const downloaded = page.waitForEvent('download');
  await page.locator('#' + button).click();
  const file = await downloaded;
  return readFile(await file.path());
}
async function store(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const opening = indexedDB.open('xyz-saves', 1);
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const transaction = db.transaction('saves', 'readonly');
          const request = transaction.objectStore('saves').getAll();
          let values;
          request.onsuccess = () => {
            values = request.result;
          };
          transaction.oncomplete = () => {
            db.close();
            resolve(values);
          };
          transaction.onabort = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
  );
}
function envelope(data, version = 2) {
  const payload = JSON.stringify({
    version,
    revision: 0,
    data,
    metadata: { savedAt: '2026-10-02T00:00:00.000Z', playTime: 0 },
  });
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++)
    hash = Math.imul(hash ^ payload.charCodeAt(i), 16777619);
  return Buffer.from(
    JSON.stringify({ payload, checksum: (hash >>> 0).toString(16) }),
  );
}

/** Actual production starter UI; independent contexts transfer user-downloaded files.
 * No engine handles/state mutation. IndexedDB inspection is read-only evidence. */
export async function verifyPortableSettings(browser, url, kind, output) {
  await mkdir(output, { recursive: true });
  const contexts = [],
    errors = [];
  const open = async () => {
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1100, height: 1200 },
      acceptDownloads: true,
    });
    contexts.push(context);
    await context.addInitScript(installSilentSurface);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(url);
    await ready(page);
    return page;
  };
  try {
    const source = await open();
    await source.locator('#settings').click();
    await source.locator('#text-scale').focus();
    await source.keyboard.press('Home');
    for (let i = 0; i < 5; i++) await source.keyboard.press('ArrowRight');
    await source.locator('#high-contrast').check();
    await source.locator('#reduced-motion').check();
    await source.locator('#binding-action').selectOption('right');
    await source.locator('#binding-key').focus();
    await source.keyboard.press('KeyL');
    await status(source, 'settings-status', 'Settings saved / 已儲存設定');
    const settings = await download(
      source,
      'prepare-settings',
      'download-settings',
    );
    await source.reload();
    await ready(source);
    await source.locator('#settings').click();
    assert.equal(await source.locator('#text-scale').inputValue(), '1.5');
    assert.equal(await source.locator('#high-contrast').isChecked(), true);
    assert.equal(await source.locator('#reduced-motion').isChecked(), true);
    await source.locator('#binding-action').selectOption('right');
    assert.equal(await source.locator('#binding-key').inputValue(), 'KeyL');
    assert.equal(
      await source
        .locator('main')
        .evaluate((main) => getComputedStyle(main).backgroundColor),
      'rgb(0, 0, 0)',
    );
    await source.screenshot({ path: join(output, `${kind}-settings.png`) });
    await source.locator('#close-settings').click();
    await source.locator('#muted').click();
    await source.locator('#start').click();
    await status(source, 'mode', 'Deliver the crystals!');
    await source.locator('#game').focus();
    const movementStart = await source.locator('#hud').innerText();
    const movementMatch = /^Crystals: \d\/5 · Seconds: (\d+)$/.exec(
      movementStart,
    );
    assert.ok(movementMatch, 'Remapped movement requires a playing HUD');
    const movementSeconds = Number(movementMatch[1]);
    let movement;
    await source.keyboard.down('KeyL');
    try {
      const reached = await source.waitForFunction(
        (startSeconds) => {
          const hud = document.querySelector('#hud')?.textContent ?? '';
          const match = /^Crystals: \d\/5 · Seconds: (\d+)$/.exec(hud);
          if (!match) throw new Error(`Unrecognized remap HUD: ${hud}`);
          const gameplaySeconds = startSeconds - Number(match[1]);
          const mode = document.querySelector('#mode')?.textContent;
          return gameplaySeconds >= 1 || mode !== 'Deliver the crystals!'
            ? { hud, gameplaySeconds, mode }
            : false;
        },
        movementSeconds,
        { timeout: 30000 },
      );
      movement = await reached.jsonValue();
      await reached.dispose();
      assert.equal(movement.mode, 'Deliver the crystals!');
      assert.ok(movement.gameplaySeconds < 5);
    } finally {
      await source.keyboard.up('KeyL');
    }
    await source.keyboard.press('Escape');
    await status(source, 'save-status', 'Checkpoint and settings saved.');
    const checkpoint = await download(
      source,
      'prepare-checkpoint',
      'download-checkpoint',
    );
    const checkpointData = JSON.parse(
      JSON.parse(checkpoint.toString()).payload,
    ).data;
    assert.ok(
      checkpointData.checkpoint.position[0] > (kind === '2d' ? 80 : 0.5),
      'Remapped native movement must change checkpoint position',
    );

    const target = await open();
    await target.locator('#settings').click();
    await target.locator('#import-settings').setInputFiles({
      name: 'settings.json',
      mimeType: 'application/json',
      buffer: settings,
    });
    await status(target, 'settings-status', 'Imported / 已匯入');
    assert.equal(await target.locator('#text-scale').inputValue(), '1.5');
    await target.locator('#binding-action').selectOption('right');
    assert.equal(await target.locator('#binding-key').inputValue(), 'KeyL');
    const beforeSettings = await store(target);
    const invalidSettings = envelope({
      accessibility: { textScale: 2 },
      bindings: { courier: { right: [{ key: 'KeyR' }] } },
    });
    await target.locator('#import-settings').setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: invalidSettings,
    });
    await target.waitForFunction(() =>
      document
        .querySelector('#settings-status')
        ?.textContent?.includes('validation'),
    );
    assert.deepEqual(await store(target), beforeSettings);
    assert.equal(await target.locator('#text-scale').inputValue(), '1.5');
    assert.equal(await target.locator('#binding-key').inputValue(), 'KeyL');
    assert.deepEqual(
      await download(target, null, 'download-rejected'),
      invalidSettings,
    );
    await target.locator('#close-settings').click();
    await target.locator('#import-checkpoint').setInputFiles({
      name: 'checkpoint.json',
      mimeType: 'application/json',
      buffer: checkpoint,
    });
    await status(target, 'file-status', 'Imported / 已匯入');
    const transferred = JSON.parse(
      JSON.parse(
        (
          await download(target, 'prepare-checkpoint', 'download-checkpoint')
        ).toString(),
      ).payload,
    ).data;
    assert.deepEqual(
      transferred,
      checkpointData,
      'Fresh instance must preserve checkpoint exactly',
    );
    const beforeSave = await store(target),
      rejected = Buffer.from('\r\n{broken\r\n');
    await target.locator('#import-checkpoint').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: rejected,
    });
    await target.waitForFunction(() =>
      document.querySelector('#file-status')?.textContent?.includes('invalid'),
    );
    assert.deepEqual(await store(target), beforeSave);
    assert.deepEqual(
      await download(target, null, 'download-rejected'),
      rejected,
    );
    await target.locator('#muted').click();
    await target.locator('#continue').click();
    await status(target, 'mode', 'Deliver the crystals!');
    await target.locator('#pause').click();
    await target.locator('#settings').click();
    await target.locator('#reset-settings').click();
    await status(target, 'settings-status', 'Settings reset / 已重設設定');
    await target.reload();
    await ready(target);
    await target.locator('#settings').click();
    assert.equal(await target.locator('#text-scale').inputValue(), '1');
    await target.locator('#binding-action').selectOption('right');
    assert.equal(
      await target.locator('#binding-key').inputValue(),
      'KeyD, ArrowRight',
    );
    await target.locator('#destroy').click();
    assert.equal(await target.locator('#portable-settings').count(), 0);
    assert.equal(await target.locator('#portable-checkpoint').count(), 0);
    assert.deepEqual(errors, []);
    const result = {
      kind,
      status: 'passed',
      restoredSettings: true,
      nativeRemap: true,
      remappedMovement: {
        key: 'KeyL',
        beforeHUD: movementStart,
        ...movement,
        exportedPosition: checkpointData.checkpoint.position,
      },
      freshTransfer: true,
      invalidSettingsAndSavePreserved: true,
      originalRejectedBytes: true,
      durableReset: true,
      ownedDOMCleanup: true,
      errors,
    };
    await writeFile(
      join(output, `${kind}.json`),
      JSON.stringify(result, null, 2),
    );
    return result;
  } finally {
    for (const context of contexts) await context.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [twoD, threeD, output = '.vite/settings-portable'] =
    process.argv.slice(2);
  if (!twoD || !threeD)
    throw new Error(
      'Usage: node scripts/settings-portable-smoke.mjs <2d-production-url> <3d-production-url> [output]',
    );
  const launch = await browserLaunchOptions('chromium');
  launch.args = [...(launch.args ?? []), '--mute-audio'];
  const browser = await chromium.launch(launch);
  try {
    console.log(await verifyPortableSettings(browser, twoD, '2d', output));
    console.log(await verifyPortableSettings(browser, threeD, '3d', output));
  } finally {
    await browser.close();
  }
}
