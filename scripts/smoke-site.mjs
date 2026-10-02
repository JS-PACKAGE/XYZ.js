/* global document, window */
import {
  access,
  readdir,
  readFile,
  mkdir,
  mkdtemp,
  writeFile,
} from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { createRequire } from 'node:module';
import process from 'node:process';
import console from 'node:console';
import { chromium } from 'playwright-core';
import {
  chromiumLaunchOptions,
  browserIdentity,
  probeBackends,
} from './browser-launch.mjs';
import {
  staticSiteServer,
  installSilentSurface,
  surfaceDOM,
  pngPixels,
} from './site-smoke-support.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index],
    value = process.argv[index + 1];
  if (
    !['--site', '--output', '--example', '--renderer', '--timeout'].includes(
      name,
    ) ||
    !value ||
    value.startsWith('--')
  )
    throw new Error(
      'Usage: node scripts/smoke-site.mjs [--site .vite/site] [--output directory] [--example slug] [--renderer auto|canvas2d|webgl2|webgpu] [--timeout milliseconds]',
    );
  options.set(name, value);
}
const timeout = Number(options.get('--timeout') ?? 30000);
if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 180000)
  throw new Error('Timeout must be in 1000..180000 milliseconds.');
const renderer = options.get('--renderer');
if (renderer && !['auto', 'canvas2d', 'webgl2', 'webgpu'].includes(renderer))
  throw new Error('Unknown renderer.');
const site = resolve(root, options.get('--site') ?? '.vite/site');
const outputRoot = resolve(root, options.get('--output') ?? '.vite/site-smoke');
await mkdir(outputRoot, { recursive: true });
const output = await mkdtemp(join(outputRoot, 'run-'));
const results = [],
  catalogue = [],
  linkChecks = [];
let browser, server, launch, capabilities, startupError, toolchain;
let interrupted = false;
const onSignal = () => {
  interrupted = true;
  void browser?.close();
};
process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);

function canonical(pathname) {
  const path = decodeURIComponent(pathname).replace(/\/index\.html$/, '/');
  return path.endsWith('/') ? path : `${path}/`;
}
async function sourceExampleIndexes(directory = join(root, 'examples')) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await sourceExampleIndexes(path)));
    else if (
      entry.isFile() &&
      entry.name === 'index.html' &&
      directory !== join(root, 'examples')
    )
      paths.push(
        `/${relative(root, path)
          .split(process.platform === 'win32' ? '\\' : '/')
          .map(encodeURIComponent)
          .join('/')}`,
      );
  }
  return paths.sort();
}
function filename(path, profile) {
  return `${path.replace(/^\/examples\//, '').replace(/[^a-zA-Z0-9_-]+/g, '_')}-${profile}`;
}
const rejectionPattern =
  /UnsupportedGraphicsError|no\s*3d\s*capability|2d-only|(?:canvas\s*2d|canvas2d)[\s\S]{0,150}(?:unsupported|no 3d|not supported|does not support|does not render|cannot|requires|unavailable)|(?:requires|unsupported|not supported)[\s\S]{0,150}(?:webgpu|webgl2)/i;
function rejectionText(text) {
  return rejectionPattern.test(text);
}
function snapshotText(dom) {
  return JSON.stringify({
    statuses: dom.statuses,
    controls: dom.controls,
    canvases: dom.canvases,
  });
}
async function ownedPage() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
  });
  await context.addInitScript(installSilentSurface);
  const page = await context.newPage();
  page.setDefaultTimeout(timeout);
  page.setDefaultNavigationTimeout(timeout);
  const errors = [],
    warnings = [],
    requests = [],
    responses = [];
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      url.origin !== server.origin
    ) {
      errors.push({
        kind: 'external-request',
        url: url.href,
        message: 'Production smoke permits only the owned static origin.',
      });
      await route.abort('blockedbyclient');
    } else await route.continue();
  });
  page.on('pageerror', (error) =>
    errors.push({
      kind: 'pageerror',
      message: error.message,
      stack: error.stack,
    }),
  );
  page.on('console', (message) => {
    const detail = {
      kind: `console-${message.type()}`,
      message: message.text(),
      location: message.location(),
    };
    if (message.type() === 'error') errors.push(detail);
    else if (message.type() === 'warning') warnings.push(detail);
  });
  page.on('requestfailed', (request) =>
    errors.push({
      kind: 'requestfailed',
      url: request.url(),
      message: request.failure()?.errorText,
      requestId: request.headers()['x-xyz-deployment-request'],
      failedAt: Date.now(),
      method: request.method(),
      type: request.resourceType(),
    }),
  );
  page.on('response', (response) => {
    responses.push({
      url: response.url(),
      status: response.status(),
      type: response.request().resourceType(),
    });
    if (response.status() >= 400)
      errors.push({
        kind: 'http',
        url: response.url(),
        status: response.status(),
      });
  });
  page.on('request', (request) =>
    requests.push({
      url: request.url(),
      type: request.resourceType(),
      method: request.method(),
    }),
  );
  page.on('crash', () =>
    errors.push({ kind: 'crash', message: 'Owned renderer process crashed.' }),
  );
  return { context, page, errors, warnings, requests, responses };
}
async function capture(page, name, row) {
  row.screenshot = join(output, `${name}.png`);
  await page.screenshot({ path: row.screenshot, fullPage: true, timeout });
  row.dom = await surfaceDOM(page);
  row.domFile = join(output, `${name}.dom.json`);
  await writeFile(row.domFile, `${JSON.stringify(row.dom, null, 2)}\n`);
}
async function clickControl(page, locator, label, row, readiness = false) {
  if (!(await locator.count())) return false;
  const control = locator.first();
  if (!(await control.isVisible())) return false;
  if (readiness) await control.waitFor({ state: 'visible' });
  const before = await surfaceDOM(page);
  const semantic =
    (await control.getAttribute('data-xyz-accessibility')) !== null;
  if (semantic) {
    await control.focus();
    await page.keyboard.press('Enter');
  } else await control.click({ timeout });
  await page.waitForTimeout(350);
  if (readiness) {
    await page.waitForFunction(
      (id) => {
        const control = document.getElementById(id);
        const signals = [
          ...document.querySelectorAll('#audio-status,#audio-state,#metrics'),
        ]
          .map((element) => element.textContent)
          .join('\n');
        return (
          !!control?.disabled ||
          /audio unlocked|music playing|OPM music \+ native PCM/i.test(signals)
        );
      },
      await control.getAttribute('id'),
      { timeout },
    );
  }
  const after = await surfaceDOM(page);
  const newClicks = after.gestures.slice(before.gestures.length);
  if (!newClicks.some((gesture) => gesture.trusted))
    throw new Error(
      `${label}: no trusted activation reached the actual document.`,
    );
  const changed = snapshotText(before) !== snapshotText(after);
  row.interactions.push({
    label,
    method: semantic
      ? 'Playwright native keyboard Enter'
      : 'Playwright native click',
    trusted: true,
    visibleDOMChanged: changed,
    before: before.statuses,
    after: after.statuses,
  });
  if (!changed)
    row.limits.push(
      `${label}: trusted activation observed, but no visible state transition; separate targeted lifecycle proof required.`,
    );
  return true;
}
async function waitForSurface(page, expectedRejection) {
  await page.waitForFunction(
    ({ reject, rejectionSource }) => {
      const status = document.querySelector(
        '#status,#boot,#notice,[role="status"]',
      );
      const text = status?.textContent?.trim() ?? '';
      if (reject) {
        const visible = [
          ...document.querySelectorAll(
            '#status,#boot,#notice,[role="status"],#report',
          ),
        ]
          .filter(
            (element) =>
              element.getClientRects().length &&
              document.defaultView.getComputedStyle(element).visibility !==
                'hidden',
          )
          .map((element) => element.textContent)
          .join('\n');
        return new RegExp(rejectionSource, 'i').test(visible);
      }
      const canvas = [...document.querySelectorAll('canvas')].find(
        (element) =>
          element.getClientRects().length && element.width && element.height,
      );
      return (
        !!canvas &&
        !/^(?:loading|initializ|preparing|starting|booting|typed manifest loading)/i.test(
          text,
        )
      );
    },
    { reject: expectedRejection, rejectionSource: rejectionPattern.source },
    { timeout },
  );
}
async function checkLinks(page, dom, owner) {
  const unique = new Set(dom.links.map((link) => link.href));
  for (const href of unique) {
    const url = new URL(href);
    if (
      url.origin !== server.origin ||
      (url.hash && url.pathname === new URL(dom.url).pathname)
    )
      continue;
    url.hash = '';
    if (linkChecks.some((check) => check.url === url.href)) continue;
    const response = await page.request.head(url.href, { timeout });
    const check = {
      owner,
      url: url.href,
      status: response.status(),
      result: response.ok() ? 'PASS' : 'FAIL',
    };
    linkChecks.push(check);
  }
}
async function inspectCatalogue(path, expected) {
  const session = await ownedPage();
  const row = {
    kind: 'catalogue',
    url: `${server.origin}${path}`,
    result: 'FAIL',
    errors: session.errors,
    limits: [],
  };
  try {
    const response = await session.page.goto(row.url, {
      waitUntil: 'networkidle',
    });
    if (!response?.ok())
      throw new Error(`Catalogue navigation returned ${response?.status()}`);
    await session.page.waitForFunction(
      () => document.querySelectorAll('a[href]').length > 0,
    );
    await capture(session.page, path === '/' ? 'root' : 'gallery', row);
    const linked = new Set(
      row.dom.links
        .filter(
          (link) => link.visible && new URL(link.href).origin === server.origin,
        )
        .map((link) => canonical(new URL(link.href).pathname)),
    );
    row.missing = expected.filter((path) => !linked.has(canonical(path)));
    row.expected = expected;
    if (row.missing.length)
      throw new Error(
        `Missing visible example links: ${row.missing.join(', ')}`,
      );
    await checkLinks(session.page, row.dom, row.url);
    if (path === '/examples/') {
      const cards = await session.page.evaluate(() =>
        [...document.querySelectorAll('a[href]')].map((link) => {
          const card = link.closest('li,article,[data-tags],.card');
          const tags = card?.querySelector('.tags');
          return {
            href: link.href,
            tags:
              card?.getAttribute('data-tags') ??
              (tags
                ? [...tags.children].map((tag) => tag.textContent).join(' ')
                : ''),
          };
        }),
      );
      catalogue.push(...cards);
    }
    row.result = session.errors.length ? 'FAIL' : 'PASS';
  } catch (error) {
    row.errors.push({
      kind: 'driver',
      message: String(error),
      stack: error.stack,
    });
    if (!row.dom)
      await capture(
        session.page,
        path === '/' ? 'root-failure' : 'gallery-failure',
        row,
      ).catch((captureError) =>
        row.errors.push({ kind: 'evidence', message: String(captureError) }),
      );
  } finally {
    results.push(row);
    await session.context.close();
  }
}
async function inspectExample(path, profile, expectedRejection) {
  if (interrupted) throw new Error('Interrupted by operator');
  const url = new URL(path, server.origin);
  if (profile !== 'default') url.searchParams.set('renderer', profile);
  const name = filename(path, profile);
  const row = {
    kind: 'example',
    url: url.href,
    sourceIndex: path,
    profile,
    expectedRejection,
    result: 'FAIL',
    interactions: [],
    limits: [
      'Surface/deployment smoke only; nonuniform compositor pixels do not certify every feature, performance, or physical audio output.',
    ],
    errors: [],
    warnings: [],
    pixels: [],
  };
  if (capabilities[profile] && !capabilities[profile].available) {
    row.result = 'BLOCKED';
    row.backendLimit = capabilities[profile].reason;
    results.push(row);
    await writeFile(
      join(output, `${name}.json`),
      `${JSON.stringify(row, null, 2)}\n`,
    );
    return;
  }
  const session = await ownedPage();
  row.errors = session.errors;
  row.warnings = session.warnings;
  row.requests = session.requests;
  row.responses = session.responses;
  try {
    const response = await session.page.goto(url.href, {
      waitUntil: 'domcontentloaded',
    });
    if (!response?.ok())
      throw new Error(`Example navigation returned ${response?.status()}`);
    await waitForSurface(session.page, expectedRejection);
    await session.page.waitForTimeout(650);
    const initial = await surfaceDOM(session.page);
    row.initialDOM = initial;
    if (expectedRejection) {
      const text = initial.statuses
        .filter((status) => status.visible)
        .map((status) => status.text)
        .join('\n');
      if (!rejectionText(text))
        throw new Error(
          'Canvas2D 3D profile did not visibly and explicitly reject unsupported 3D.',
        );
      row.backendLimit = {
        result: 'REJECTED',
        reason: text,
        pixels: 'Not claimed: deliberately unsupported 3D profile.',
      };
      const unexpected = row.errors.filter(
        (error) =>
          !['pageerror', 'console-error'].includes(error.kind) ||
          !rejectionText(error.message),
      );
      row.expectedRejectionErrors = row.errors.filter(
        (error) => !unexpected.includes(error),
      );
      row.errors = unexpected;
    } else {
      // These are the actual HTML controls, never console calls to an application start function.
      for (const selector of ['#start', '#run']) {
        const button = session.page.locator(selector);
        if (
          (await button.count()) &&
          (await button.first().isVisible()) &&
          (await button.first().isEnabled())
        )
          await clickControl(
            session.page,
            button,
            'Start/loading unblock',
            row,
          );
      }
      for (const label of [/^Play muted$/i, /^Start route$/i]) {
        const button = session.page.getByRole('button', { name: label });
        if (
          (await button.count()) &&
          (await button.first().isVisible()) &&
          (await button.first().isEnabled())
        )
          await clickControl(session.page, button, 'Playable flow start', row);
      }
      const canvases = session.page.locator('canvas:visible');
      if (!(await canvases.count()))
        throw new Error(
          'No visible native canvas after direct URL initialization.',
        );
      const deadline = Date.now() + timeout;
      let pending;
      do {
        pending = [];
        row.pixels = [];
        for (let index = 0; index < (await canvases.count()); index++) {
          const canvas = canvases.nth(index),
            screenshot = join(output, `${name}-canvas-${index}.png`);
          const bytes = await canvas.screenshot({ path: screenshot, timeout });
          const pixels = pngPixels(bytes);
          row.pixels.push({ index, screenshot, ...pixels });
          if (!pixels.nonuniform) pending.push(index);
        }
        if (pending.length && Date.now() < deadline)
          await session.page.waitForTimeout(250);
      } while (pending.length && Date.now() < deadline);
      if (pending.length)
        throw new Error(
          `Uniform/blank actual compositor canvas: ${pending.join(', ')}`,
        );
      const observed = await surfaceDOM(session.page);
      row.nativeBackends = [
        ...new Set(observed.canvases.flatMap((canvas) => canvas.contexts)),
      ];
      const requestedContext = {
        canvas2d: '2d',
        webgl2: 'webgl2',
        webgpu: 'webgpu',
      }[profile];
      if (requestedContext && !row.nativeBackends.includes(requestedContext))
        throw new Error(
          `Requested ${profile} but connected canvases observed ${row.nativeBackends.join(', ') || 'none'}`,
        );
      for (const selector of ['#unlock', '#enable', '#audio']) {
        const button = session.page.locator(selector);
        if (!(await button.count()) || !(await button.first().isVisible()))
          continue;
        await clickControl(
          session.page,
          button,
          'Audio unlock under native zero-gain isolation',
          row,
          true,
        );
        break;
      }
      const pause = session.page.locator('#pause');
      if (
        (await pause.count()) &&
        (await pause.first().isVisible()) &&
        (await pause.first().isEnabled())
      ) {
        await clickControl(session.page, pause, 'Pause', row);
        const resume = session.page.locator('#resume');
        if (
          (await resume.count()) &&
          (await resume.first().isVisible()) &&
          (await resume.first().isEnabled())
        )
          await clickControl(session.page, resume, 'Resume', row);
        else if (await pause.first().isEnabled())
          await clickControl(session.page, pause, 'Resume/toggle', row);
      }
      await capture(session.page, name, row);
      await checkLinks(session.page, row.dom, row.url);
      const destroy = session.page.locator('#destroy');
      if (
        (await destroy.count()) &&
        (await destroy.first().isVisible()) &&
        (await destroy.first().isEnabled())
      ) {
        row.destroyedAt = Date.now();
        await clickControl(session.page, destroy, 'Destroy', row);
        row.afterDestroy = await surfaceDOM(session.page);
        row.destroyScreenshot = join(output, `${name}-destroy.png`);
        await session.page.screenshot({
          path: row.destroyScreenshot,
          fullPage: true,
        });
      }
    }
    if (!row.dom) await capture(session.page, name, row);
    const final = await surfaceDOM(session.page);
    row.finalAudioSafety = final.audioSafety;
    row.workers = final.workers;
    const transfers = await session.page.evaluate(async () => {
      await Promise.all(window.__xyzSiteSmoke.fetchHashes);
      return window.__xyzSiteSmoke.fetches;
    });
    row.fetches = transfers;
    row.completedStreamTeardowns = [];
    for (let index = row.errors.length - 1; index >= 0; index--) {
      const failure = row.errors[index];
      if (failure.kind !== 'requestfailed') continue;
      const transfer = transfers.find(
        (entry) => entry.requestId === failure.requestId,
      );
      const hosted = server.requests.filter(
        (entry) => entry.requestId === failure.requestId,
      );
      if (
        failure.message === 'net::ERR_ABORTED' &&
        failure.method === 'GET' &&
        failure.type === 'fetch' &&
        failure.requestId &&
        transfer &&
        transfer.url === failure.url &&
        transfer.status === 200 &&
        (!transfer.abortedAt || transfer.abortedAt > failure.failedAt) &&
        (!transfer.canceledAt || transfer.canceledAt > failure.failedAt) &&
        transfer.completedAt <= failure.failedAt &&
        failure.failedAt < (row.destroyedAt ?? Infinity) &&
        hosted.length === 1 &&
        hosted[0].url ===
          new URL(failure.url).pathname + new URL(failure.url).search &&
        hosted[0].method === 'GET' &&
        hosted[0].status === 200 &&
        hosted[0].finished &&
        !hosted[0].closedBeforeFinish &&
        transfer.bytes === hosted[0].bytes &&
        transfer.sha256 === hosted[0].sha256
      ) {
        row.completedStreamTeardowns.push({
          failure,
          transfer,
          hosted: hosted[0],
        });
        row.errors.splice(index, 1);
      }
    }
    if (!expectedRejection) {
      for (const status of final.statuses) {
        if (
          status.visible &&
          /^(?:error\b|(?:Type|Range|Reference|Syntax|Network|Abort)Error:|initialization failed|failed\b|fatal\b)/i.test(
            status.text?.trim() ?? '',
          )
        )
          row.errors.push({
            kind: 'visible-host-error',
            id: status.id,
            message: status.text,
          });
      }
    }
    for (const worker of final.workers)
      for (const error of worker.errors)
        row.errors.push({ kind: 'worker', url: worker.url, ...error });
    for (const rejection of final.rejections)
      if (!expectedRejection || !rejectionText(rejection))
        row.errors.push({ kind: 'unhandledrejection', message: rejection });
    if (
      final.audioSafety.gains.some((gain) => gain !== 0) ||
      final.audioSafety.nativeContexts !==
        final.audioSafety.zeroGainDestinations
    )
      row.errors.push({
        kind: 'audio-safety',
        message:
          'Native context destination isolation is incomplete or a safety gain is nonzero.',
      });
    row.result = row.errors.length ? 'FAIL' : 'PASS';
  } catch (error) {
    row.errors.push({
      kind: 'driver',
      message: String(error),
      stack: error.stack,
    });
    await capture(session.page, `${name}-failure`, row).catch((captureError) =>
      row.errors.push({ kind: 'evidence', message: String(captureError) }),
    );
  } finally {
    await session.context.close();
    results.push(row);
    await writeFile(
      join(output, `${name}.json`),
      `${JSON.stringify(row, null, 2)}\n`,
    );
    console.log(
      `${row.result} ${row.url}${row.errors.length ? ` — ${row.errors.map((error) => error.message ?? `HTTP ${error.status}: ${error.url}`).join(' | ')}` : ''}`,
    );
  }
}

try {
  await access(join(site, 'index.html'));
  await access(join(site, 'examples/index.html'));
  await access(join(site, 'engine/src/index.js'));
  const expected = await sourceExampleIndexes();
  if (!expected.length)
    throw new Error('No source example index.html files discovered.');
  const require = createRequire(import.meta.url),
    packagePath = require.resolve('playwright-core/package.json');
  const metadata = JSON.parse(await readFile(packagePath, 'utf8'));
  const revisions = JSON.parse(
    await readFile(resolve(packagePath, '../browsers.json'), 'utf8'),
  );
  toolchain = {
    playwright: metadata.version,
    managedBrowserCache:
      process.env.PLAYWRIGHT_BROWSERS_PATH ??
      'Playwright platform-default managed cache',
    executable: chromium.executablePath(),
    chromiumPin: revisions.browsers.find((entry) => entry.name === 'chromium'),
  };
  server = await staticSiteServer(site);
  launch = await chromiumLaunchOptions();
  if (launch.executablePath)
    throw new Error(
      'smoke-site requires the repository-managed Chromium cache; custom executable overrides are not accepted.',
    );
  launch.args = [...new Set([...(launch.args ?? []), '--mute-audio'])];
  // Exactly one new managed process. No connect(), CDP attachment, persistent profile, or user browser.
  browser = await chromium.launch(launch);
  const probe = await ownedPage();
  try {
    await probe.page.goto(`${server.origin}/`);
    capabilities = await probeBackends(probe.page);
  } finally {
    await probe.context.close();
  }
  await inspectCatalogue('/', expected);
  await inspectCatalogue('/examples/', expected);
  for (const path of expected) {
    const slug = decodeURIComponent(
      path.slice('/examples/'.length).replace(/\/index\.html$/, ''),
    );
    if (options.has('--example') && slug !== options.get('--example')) continue;
    const cards = catalogue.filter(
      (card) =>
        new URL(card.href).origin === server.origin &&
        canonical(new URL(card.href).pathname) === canonical(path),
    );
    const profiles = new Set([
      'default',
      ...cards
        .map((card) => new URL(card.href).searchParams.get('renderer'))
        .filter(Boolean),
    ]);
    const threeDOnly = cards.some(
      (card) => /\b3D\b/.test(card.tags) && !/\b2D\b/.test(card.tags),
    );
    if (threeDOnly && profiles.size > 1) profiles.add('canvas2d');
    for (const profile of renderer ? [renderer] : profiles) {
      if (renderer && !profiles.has(renderer)) {
        results.push({
          kind: 'example',
          sourceIndex: path,
          url: `${server.origin}${path}?renderer=${renderer}`,
          profile,
          result: 'BLOCKED',
          backendLimit:
            'Not advertised as a selectable backend by actual gallery DOM; no false support claim.',
        });
        continue;
      }
      await inspectExample(path, profile, threeDOnly && profile === 'canvas2d');
    }
  }
  if (!results.some((row) => row.kind === 'example'))
    throw new Error('No matching example URLs exercised.');
} catch (error) {
  startupError = {
    message: String(error),
    stack: error.stack,
    cause: error.cause ? String(error.cause) : undefined,
  };
} finally {
  const report = {
    scope:
      'Production static deployment and native visible surface only. Every feature needs its separate targeted acceptance proof.',
    site,
    output,
    origin: server?.origin,
    browser: browserIdentity('chromium', browser, launch),
    toolchain,
    launchArguments: launch?.args,
    capabilities,
    audio: {
      launchMuted: launch?.args.includes('--mute-audio') ?? false,
      nativeDestinationIsolation:
        'Private native zero-gain sink for every constructed realtime context; direct HTML media forced muted; routed media remains upstream for native signal evidence.',
      physicalOutputCertification: 'NOT CLAIMED: user prohibits sound',
      phaseSourceIsolatedFixtures: {
        status: 'not-in-site',
        coveredBy: 'separate targeted scripts/audio-native-load.mjs',
        reason:
          'tests/browser/audio-load.html is a source-only fixture, not a deployed example. No fabricated host-phase PASS; visible native reference/report signals must be collected by the separate silent fixture driver.',
      },
    },
    startupError,
    interrupted,
    catalogue: results.filter((row) => row.kind === 'catalogue'),
    results: results.filter((row) => row.kind === 'example'),
    linkChecks,
    serverRequests: server?.requests,
  };
  const failed =
    !!startupError ||
    interrupted ||
    !results.length ||
    results.some((row) => row.result !== 'PASS') ||
    linkChecks.some((check) => check.result !== 'PASS');
  report.result = failed ? 'FAIL' : 'PASS';
  try {
    await writeFile(
      join(output, 'results.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          result: report.result,
          output,
          report: join(output, 'results.json'),
          startupError,
          failingURLs: results
            .filter((row) => row.result !== 'PASS')
            .map((row) => ({
              url: row.url,
              result: row.result,
              errors: row.errors,
              backendLimit: row.backendLimit,
            })),
          failedLinks: linkChecks.filter((check) => check.result !== 'PASS'),
        },
        null,
        2,
      ),
    );
    if (failed) process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
    try {
      await browser?.close();
    } finally {
      await server?.close();
    }
  }
}
