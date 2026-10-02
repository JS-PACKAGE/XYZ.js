/* global document, window */
import { spawn } from 'node:child_process';
import {
  copyFile,
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import console from 'node:console';
import { setTimeout } from 'node:timers';
import { chromium } from 'playwright-core';
import { createGame } from './create-game.mjs';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
import {
  installSilentSurface,
  pngPixels,
  staticSiteServer,
} from './site-smoke-support.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--output'))
  throw new Error('Usage: node scripts/starter-smoke.mjs [--output directory]');
const output = resolve(root, args[1] ?? '.vite/starter-smoke');
await mkdir(output, { recursive: true });
const workspace = await mkdtemp(join(tmpdir(), 'xyz-starter-gate-'));
const report = {
  scope:
    'Fresh archive, independent installed production starters, owned Chromium; native input and zero-gain audio. No source imports, engine handles, state mutation, clock acceleration or retries.',
  results: [],
};
let browser;

function check(condition, message) {
  if (!condition) throw new Error(message);
}
async function command(args, cwd, log, extraEnv = {}) {
  const chunks = [];
  const child = spawn('npx', ['--yes', 'pnpm@12.6.0', ...args], {
    cwd,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => chunks.push(chunk));
  child.stderr.on('data', (chunk) => chunks.push(chunk));
  const code = await new Promise((accept, reject) => {
    child.once('error', reject);
    child.once('close', accept);
  });
  await writeFile(join(output, log), Buffer.concat(chunks));
  check(code === 0, `pnpm ${args.join(' ')} exited ${code}; see ${log}`);
}
async function mode(page, expected, timeout = 30000) {
  await page.waitForFunction(
    (text) => document.querySelector('#mode')?.textContent === text,
    expected,
    { timeout },
  );
}
async function saved(page) {
  await page.waitForFunction(
    () =>
      ['Checkpoint and settings saved.', '檢查點與設定已儲存。'].includes(
        document.querySelector('#save-status')?.textContent,
      ),
    undefined,
    { timeout: 30000 },
  );
}
async function hold(page, key, milliseconds) {
  await page.locator('#game').focus();
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(milliseconds);
  } finally {
    await page.keyboard.up(key);
  }
}
async function capture(page, kind, stage, row) {
  const png = await page.locator('#game').screenshot();
  await writeFile(join(output, `${kind}-${stage}.png`), png);
  const pixels = pngPixels(png);
  check(
    pixels.distinctRGB > 3 && pixels.visiblePixels > 100,
    `${kind} ${stage}: native canvas has no gameplay pixels`,
  );
  row.screenshots.push({ stage, ...pixels });
  return png;
}
async function audio(page) {
  return page.evaluate(() => window.__xyzSiteSmoke.audioSafety);
}
async function unlock(page, row) {
  await page.locator('#unlock').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#unlock')?.disabled &&
      !document.querySelector('#start')?.disabled,
  );
  const evidence = await audio(page);
  check(
    evidence.nativeContexts === 8 &&
      evidence.zeroGainDestinations === 8 &&
      evidence.gains.every((gain) => gain === 0),
    'Unlock must initialize eight real, silent native audio destinations',
  );
  row.unlocks.push(evidence);
}

try {
  const packed = join(workspace, 'packed');
  await mkdir(packed);
  await command(['pack', '--pack-destination', packed], root, 'pack.log');
  const archives = (await readdir(packed)).filter((name) =>
    name.endsWith('.tgz'),
  );
  check(archives.length === 1, 'Fresh pack must produce exactly one archive');
  const archive = join(packed, archives[0]);
  await copyFile(archive, join(output, archives[0]));
  report.archive = {
    name: archives[0],
    sha256: createHash('sha256')
      .update(await readFile(archive))
      .digest('hex'),
  };
  const launch = await browserLaunchOptions('chromium');
  launch.args = [...(launch.args ?? []), '--mute-audio'];
  browser = await chromium.launch(launch);
  report.browser = browserIdentity('chromium', browser, launch);
  for (const kind of ['2d', '3d']) {
    const row = {
      template: kind,
      status: 'starting',
      screenshots: [],
      unlocks: [],
      errors: [],
      failedRequests: [],
      requests: [],
    };
    report.results.push(row);
    let server, context, page;
    try {
      const game = join(workspace, kind);
      await createGame([game, '--template', kind, '--package', archive]);
      await command(
        ['install', '--ignore-scripts'],
        game,
        `${kind}-install.log`,
      );
      await command(['build'], game, `${kind}-build.log`, {
        GAME_BASE: `/games/${kind}/`,
      });
      await cp(join(game, 'dist'), join(output, `${kind}-deployment`), {
        recursive: true,
      });
      const installed = JSON.parse(
        await readFile(join(game, 'node_modules/xyz.js/package.json'), 'utf8'),
      );
      row.installed = {
        version: installed.version,
        dependency: JSON.parse(
          await readFile(join(game, 'package.json'), 'utf8'),
        ).dependencies['xyz.js'],
      };
      // Serve only deployed files; neither the repository nor node_modules is reachable.
      const deployed = join(workspace, 'deployed', kind);
      await cp(join(game, 'dist'), join(deployed, 'games', kind), {
        recursive: true,
      });
      server = await staticSiteServer(deployed);
      context = await browser.newContext({
        viewport: { width: 1100, height: 1000 },
        deviceScaleFactor: 1,
        locale: 'en-US',
      });
      await context.addInitScript(installSilentSurface);
      page = await context.newPage();
      page.on('pageerror', (error) => row.errors.push(String(error)));
      page.on('console', (message) => {
        if (message.type() === 'error') row.errors.push(message.text());
      });
      page.on('response', (response) => {
        row.requests.push({
          url: response.url(),
          status: response.status(),
          cacheControl: response.headers()['cache-control'],
        });
        if (response.status() >= 400)
          row.failedRequests.push({
            url: response.url(),
            status: response.status(),
          });
      });
      await page.route('**/assets/pixel.png', async (route) => {
        await new Promise((accept) => setTimeout(accept, 500));
        await route.continue();
      });
      const url = `${server.origin}/games/${kind}/?renderer=${kind === '2d' ? 'canvas2d' : 'webgl2'}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await mode(page, 'Loading release assets…');
      check(
        await page.locator('#start').isDisabled(),
        'Loading must not allow gameplay',
      );
      await mode(page, 'Ready — enable sound or choose muted play.');
      check(
        await page.locator('#start').isDisabled(),
        'New game must require a sound decision',
      );
      await unlock(page, row);
      await page.locator('#start').click();
      await mode(page, 'Deliver the crystals!');
      await capture(page, kind, 'play', row);
      // Reach a real crystal with trusted held keys, through the authored arena.
      if (kind === '2d') {
        await hold(page, 'ArrowUp', 1750);
        await hold(page, 'ArrowRight', 390);
      } else {
        await hold(page, 'ArrowLeft', 1500);
        await hold(page, 'ArrowUp', 3000);
      }
      await page.waitForFunction(
        () =>
          /Crystals: [1-5]\/5/.test(
            document.querySelector('#hud')?.textContent ?? '',
          ),
        undefined,
        { timeout: 5000 },
      );
      await page.keyboard.press('Escape');
      await mode(page, 'Paused — checkpoint saved when storage is available.');
      await saved(page);
      row.checkpointHUD = await page.locator('#hud').innerText();
      const frozen = await capture(page, kind, 'paused', row);
      await page.waitForTimeout(350);
      check(
        frozen.equals(await page.locator('#game').screenshot()),
        'Paused native gameplay pixels changed',
      );
      check(
        (await page.locator('#hud').innerText()) === row.checkpointHUD,
        'Pause advanced the gameplay clock',
      );
      await page.locator('#resume').click();
      await mode(page, 'Deliver the crystals!');
      await page.waitForFunction(
        (previous) => document.querySelector('#hud')?.textContent !== previous,
        row.checkpointHUD,
        { timeout: 5000 },
      );
      await page.locator('#pause').click();
      await mode(page, 'Paused — checkpoint saved when storage is available.');
      await saved(page);
      row.checkpointHUD = await page.locator('#hud').innerText();
      await page.locator('#settings').click();
      await mode(page, 'Settings');
      await page.locator('#locale').selectOption('zh-Hant');
      check(
        (await page.locator('#mode').innerText()) === '設定',
        'Settings locale did not change',
      );
      await page.locator('#locale').selectOption('en');
      await page.locator('#volume').focus();
      await page.keyboard.press('Home');
      for (let step = 0; step < 5; step++)
        await page.keyboard.press('ArrowRight');
      row.volume = await page.locator('#volume').inputValue();
      check(
        Number(row.volume) > 0 && Number(row.volume) < 1,
        'Trusted slider input did not set volume',
      );
      await page.locator('#mute').check();
      await page.locator('#locale').selectOption('zh-Hant');
      await page.locator('#close-settings').click();
      await mode(page, '已暫停：儲存空間可用時會保存檢查點。');
      await saved(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await mode(page, '準備完成：啟用音效或選擇靜音遊玩。');
      check(
        await page.locator('#continue').isEnabled(),
        'Persistent checkpoint was not available after reload',
      );
      await page.locator('#settings').click();
      check(
        (await page.locator('#locale').inputValue()) === 'zh-Hant' &&
          (await page.locator('#volume').inputValue()) === row.volume &&
          (await page.locator('#mute').isChecked()),
        'Persistent settings were not restored',
      );
      await page.locator('#locale').selectOption('en');
      await page.locator('#close-settings').click();
      // Reload restores preferences, not a forged audio-unlocked flag.
      await unlock(page, row);
      await page.locator('#continue').click();
      await mode(page, 'Deliver the crystals!');
      check(
        (await page.locator('#hud').innerText()) === row.checkpointHUD,
        'Continue did not restore the authored checkpoint',
      );
      await capture(page, kind, 'continued', row);
      // Exercise results through the real 90-second game clock, not engine hooks.
      await mode(page, 'Run ended. Restart and try again.', 150000);
      await capture(page, kind, 'results', row);
      await page.locator('#restart').click();
      await mode(page, 'Deliver the crystals!');
      check(
        (await page.locator('#hud').innerText()).includes('Crystals: 0/5'),
        'Restart retained previous collectibles',
      );
      await capture(page, kind, 'restarted', row);
      await page.locator('#destroy').click();
      await mode(page, 'Destroyed — reload to play again.');
      await page.waitForFunction(
        () =>
          window.__xyzSiteSmoke.audioSafety.contextStates.every(
            (state) => state === 'closed',
          ),
        undefined,
        { timeout: 15000 },
      );
      row.destroyAudio = await audio(page);
      const diagnostics = await page.evaluate(() => ({
        rejections: window.__xyzSiteSmoke.rejections,
        workers: window.__xyzSiteSmoke.workers,
        gestures: window.__xyzSiteSmoke.gestures,
      }));
      row.diagnostics = diagnostics;
      check(
        !diagnostics.rejections.length &&
          diagnostics.workers.every((worker) => !worker.errors.length),
        'Starter produced unhandled async or worker errors',
      );
      check(
        diagnostics.gestures.some(
          (gesture) => gesture.id === 'unlock' && gesture.trusted,
        ),
        'Unlock was not a trusted browser gesture',
      );
      check(
        !row.errors.length && !row.failedRequests.length,
        'Starter produced browser errors or failed deployment requests',
      );
      await context.close();
      context = undefined;
      page = undefined;
      await server.close();
      server = undefined;
      row.status = 'passed';
    } catch (error) {
      row.status = 'failed';
      row.error = String(error.stack ?? error);
      if (page) {
        row.surface = await page.locator('body').innerText().catch(String);
        await page
          .screenshot({ path: join(output, `${kind}-failure.png`) })
          .catch(() => {});
      }
    } finally {
      await context?.close();
      await server?.close();
      await writeFile(
        join(output, 'results.json'),
        JSON.stringify(report, null, 2) + '\n',
      );
    }
  }
} catch (error) {
  report.error = String(error.stack ?? error);
} finally {
  await browser?.close();
  await rm(workspace, { recursive: true, force: true });
  await writeFile(
    join(output, 'results.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
}
console.log(
  JSON.stringify(
    {
      output,
      results: report.results.map(({ template, status, error }) => ({
        template,
        status,
        error,
      })),
      error: report.error,
    },
    null,
    2,
  ),
);
if (
  report.error ||
  report.results.length !== 2 ||
  report.results.some((row) => row.status !== 'passed')
)
  process.exitCode = 1;
