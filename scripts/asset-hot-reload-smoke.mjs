/* global window, document -- used inside browser-run callbacks */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import process from 'node:process';
import console from 'node:console';
import { chromium } from 'playwright-core';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
import { authorSprite, startAssetHotReload } from './asset-hot-reload.mjs';

async function until(predicate, label) {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}`);
}
const session = await startAssetHotReload({
  port: Number(process.env.ASSET_HMR_PORT ?? 5275),
});
const launch = await browserLaunchOptions('chromium');
let browser;
let closed = false;
try {
  browser = await chromium.launch(launch);
  const page = await browser.newPage();
  await until(() => {
    const failure = session.events.find((event) => event.status === 'failed');
    if (failure || session.diagnostics())
      throw new Error(
        JSON.stringify({ failure, stderr: session.diagnostics() }),
      );
    return session.events.some((event) => event.status === 'published');
  }, 'initial CLI publication');
  await page.goto(session.url);
  await page.waitForFunction(() =>
    document.querySelector('#status').textContent.includes('published'),
  );
  await page.evaluate(async () => {
    const module = await import('/examples/asset-hot-reload/main.ts');
    window.assetEvidence = {
      module,
      game: module.game,
      scene: module.game.scene,
      sprite: [...module.game.scene.objects][0],
      pool: module.game.resources,
    };
  });
  const pixel = () =>
    page.evaluate(() => [
      ...document
        .querySelector('#game')
        .getContext('2d')
        .getImageData(400, 225, 1, 1).data,
    ]);
  await until(
    async () => (await pixel())[0] === 255,
    'red authored PNG pixels',
  );
  assert.deepEqual(await pixel(), [255, 0, 0, 255]);
  const initialPointer = JSON.parse(
    await readFile(join(session.output, 'current.json'), 'utf8'),
  );
  const initialPNG = await readFile(
    join(session.output, initialPointer.generation, 'sprite.png'),
  );
  await authorSprite(page, join(session.authored, 'sprite.png'), '#00ff00');
  await until(
    () =>
      session.events.filter((event) => event.status === 'published').length ===
      2,
    'incremental CLI publication',
  );
  const nextPointer = JSON.parse(
    await readFile(join(session.output, 'current.json'), 'utf8'),
  );
  assert.notEqual(nextPointer.generation, initialPointer.generation);
  assert.equal(
    nextPointer.entryHashes.stable,
    initialPointer.entryHashes.stable,
  );
  assert.notEqual(
    nextPointer.entryHashes.sprite,
    initialPointer.entryHashes.sprite,
  );
  assert.deepEqual(
    await readFile(
      join(session.output, initialPointer.generation, 'sprite.png'),
    ),
    initialPNG,
  );
  assert.deepEqual(
    session.events.filter((event) => event.status === 'published')[1].affected,
    ['sprite'],
  );
  await until(
    async () => (await pixel())[1] === 255,
    'new generation green pixels',
  );
  assert.deepEqual(await pixel(), [0, 255, 0, 255]);
  assert.deepEqual(
    await page.evaluate(() => {
      const evidence = window.assetEvidence;
      const current = [...evidence.module.game.scene.objects][0];
      const canvas = document.querySelector('#game');
      const data = canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width,
        top = canvas.height,
        right = -1,
        bottom = -1;
      for (let y = 0; y < canvas.height; y++)
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] === 0 && data[i + 1] === 255 && data[i + 2] === 0) {
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
          }
        }
      const result = {
        sameGame: evidence.game === evidence.module.game,
        freshScene: evidence.scene !== evidence.module.game.scene,
        oldSceneDestroyed: evidence.scene.destroyed,
        oldTextureDestroyed: evidence.sprite.texture.destroyed,
        pixels: { width: right - left + 1, height: bottom - top + 1 },
      };
      evidence.liveScene = evidence.module.game.scene;
      evidence.liveTexture = current.texture;
      return result;
    }),
    {
      sameGame: true,
      freshScene: true,
      oldSceneDestroyed: true,
      oldTextureDestroyed: true,
      pixels: { width: 96, height: 96 },
    },
  );

  // Real invalid authored dependency must never advance the atomic current pointer.
  const pointerBytes = await readFile(join(session.output, 'current.json'));
  const atlasBytes = await readFile(join(session.authored, 'atlas.json'));
  await writeFile(join(session.authored, 'atlas.json'), '{invalid');
  await until(
    () => session.events.some((event) => event.status === 'failed'),
    'invalid authoring rejection',
  );
  assert.deepEqual(
    await readFile(join(session.output, 'current.json')),
    pointerBytes,
  );
  assert.deepEqual(await pixel(), [0, 255, 0, 255]);
  await session.stopWatcher();
  await writeFile(join(session.authored, 'atlas.json'), atlasBytes);

  // A bad deployed candidate exercises the browser transaction, not merely CLI validation.
  const invalid = join(session.output, 'generation-999');
  await mkdir(invalid);
  await copyFile(
    join(session.output, nextPointer.generation, 'sprite.png'),
    join(invalid, 'sprite.png'),
  );
  const atlas = JSON.parse(atlasBytes);
  atlas.frames.other = atlas.frames.sprite;
  delete atlas.frames.sprite;
  await writeFile(join(invalid, 'atlas.json'), JSON.stringify(atlas));
  await writeFile(
    join(invalid, 'project-manifest.json'),
    JSON.stringify({
      entries: [{ id: 'sprite', type: 'atlas', url: 'atlas.json' }],
    }),
  );
  await writeFile(
    join(session.output, 'current.json'),
    JSON.stringify({
      version: 1,
      generation: 'generation-999',
      manifest: 'generation-999/project-manifest.json',
    }),
  );
  await page.waitForFunction(() =>
    document
      .querySelector('#status')
      .textContent.includes('Atlas needs the sprite frame'),
  );
  assert.deepEqual(await pixel(), [0, 255, 0, 255]);
  assert.equal(
    await page.evaluate(
      () =>
        window.assetEvidence.liveScene ===
          window.assetEvidence.module.game.scene &&
        !window.assetEvidence.liveTexture.destroyed,
    ),
    true,
  );
  await page.click('#dispose');
  await page.waitForFunction(() =>
    document.querySelector('#status').textContent.includes('Game disposed'),
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      state: window.assetEvidence.game.state,
      sceneDestroyed: window.assetEvidence.liveScene.destroyed,
      textureDestroyed: window.assetEvidence.liveTexture.destroyed,
      poolDestroyed: window.assetEvidence.pool.destroyed,
    })),
    {
      state: 'destroyed',
      sceneDestroyed: true,
      textureDestroyed: true,
      poolDestroyed: true,
    },
  );
  await session.close();
  closed = true;
  assert.equal(session.diagnostics(), '');
  console.log(
    JSON.stringify({
      status: 'passed',
      browser: browserIdentity('chromium', browser, launch),
      generations: [initialPointer.generation, nextPointer.generation],
      pixels: ['red', 'green', 'green after invalid'],
      bounds: [96, 96],
      sameGame: true,
      oldResourcesReleased: true,
      teardown: true,
      events: session.events,
    }),
  );
} finally {
  await browser?.close();
  if (!closed) await session.close();
  await rm(session.directory, { recursive: true, force: true });
}
