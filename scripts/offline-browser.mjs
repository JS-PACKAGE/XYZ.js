/* global document, navigator, window, MessageChannel, URL, fetch, caches, crypto, Response, localStorage, setTimeout, clearTimeout */
import { cp, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { chromium } from 'playwright-core';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
import { installSilentSurface, pngPixels } from './site-smoke-support.mjs';
import { prepareDeployment, deploymentCSP } from './offline-deployment.mjs';
import { serveDeployment } from './deployment-server.mjs';
const check = (value, message) => {
  if (!value) throw new Error(message);
};
async function mode(page, text) {
  await page.waitForFunction(
    (expected) => document.querySelector('#mode')?.textContent === expected,
    text,
    { timeout: 60000 },
  );
}
async function version(page) {
  return page.evaluate(
    () =>
      new Promise((accept, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(
          () => reject(new Error('No native service-worker status reply')),
          10000,
        );
        channel.port1.onmessage = (event) => {
          clearTimeout(timer);
          accept(event.data.version);
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'xyz-offline-status' },
          [channel.port2],
        );
      }),
  );
}

function observeNativeAudio() {
  const contexts = new WeakMap();
  const state = { modules: [], nodes: [], errors: [] };
  Object.defineProperty(window, '__xyzOfflineAudio', { value: state });
  let nextContext = 0;
  const wrapContext = (Native) =>
    new Proxy(Native, {
      construct(target, args, newTarget) {
        const context = Reflect.construct(target, args, newTarget);
        const id = nextContext++;
        contexts.set(context, id);
        const worklet = context.audioWorklet;
        const addModule = worklet.addModule;
        worklet.addModule = function (...moduleArgs) {
          const entry = {
            context: id,
            url: new URL(moduleArgs[0], window.location.href).href,
            status: 'loading',
          };
          state.modules.push(entry);
          // Observe the native promise, not page-network events: worklet fetches
          // can live outside that target and share an HTTP module response.
          return addModule.apply(this, moduleArgs).then(
            (value) => {
              entry.status = 'loaded';
              return value;
            },
            (error) => {
              entry.status = 'failed';
              entry.error = String(error);
              throw error;
            },
          );
        };
        return context;
      },
    });
  window.AudioContext = wrapContext(window.AudioContext);
  if (window.webkitAudioContext)
    window.webkitAudioContext = wrapContext(window.webkitAudioContext);
  window.AudioWorkletNode = new Proxy(window.AudioWorkletNode, {
    construct(target, args, newTarget) {
      const node = Reflect.construct(target, args, newTarget);
      state.nodes.push({ context: contexts.get(args[0]), name: args[1] });
      node.addEventListener('processorerror', () =>
        state.errors.push(`Native processor failed: ${args[1]}`),
      );
      return node;
    },
  });
}
async function playable(page, template, output, phase, resources) {
  await mode(page, 'Ready — enable sound or choose muted play.');
  await page.locator('#unlock').click();
  await page.waitForFunction(
    () =>
      document.querySelector('#unlock')?.disabled &&
      !document.querySelector('#start')?.disabled,
  );
  const silent = await page.evaluate(() => window.__xyzSiteSmoke.audioSafety);
  check(
    silent.nativeContexts === 8 &&
      silent.zeroGainDestinations === 8 &&
      silent.gains.every((gain) => gain === 0),
    `Native audio destination was not verified physically silent: ${JSON.stringify(silent)}`,
  );
  const nativeAudio = await page.evaluate(() => window.__xyzOfflineAudio);
  const processorURL = new URL(
    './engine/vendor/opm/dist/worklet/processor.js',
    page.url(),
  ).href;
  check(
    nativeAudio.modules.length === 8 &&
      new Set(nativeAudio.modules.map((entry) => entry.context)).size === 8 &&
      nativeAudio.modules.every(
        (entry) => entry.status === 'loaded' && entry.url === processorURL,
      ) &&
      nativeAudio.nodes.length === 8 &&
      nativeAudio.nodes.every(
        (node) =>
          node.name === 'opm-processor' &&
          nativeAudio.modules.some((entry) => entry.context === node.context),
      ) &&
      new Set(nativeAudio.nodes.map((node) => node.context)).size === 8 &&
      !nativeAudio.errors.length,
    `${phase}: all eight native OPM modules/processors did not initialize`,
  );
  const modules = await page.evaluate(async (entries) => {
    const responses = [];
    for (const entry of entries) {
      const url = new URL(entry.path, window.location.href);
      const response = await fetch(url, { cache: 'no-store' });
      const bytes = await response.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      responses.push({
        path: entry.path,
        url: url.href,
        status: response.status,
        mime: response.headers.get('content-type'),
        bytes: bytes.byteLength,
        sha256: Array.from(new Uint8Array(hash), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join(''),
      });
    }
    return responses;
  }, resources);
  check(
    modules.every(
      (entry, index) =>
        entry.status === 200 &&
        /^(?:text|application)\/(?:javascript|ecmascript)/i.test(entry.mime) &&
        entry.bytes === resources[index].bytes &&
        entry.sha256 === resources[index].sha256,
    ),
    `${phase}: native engine modules did not serve manifest bytes with safe MIME`,
  );
  await page.locator('#start').click();
  await mode(page, 'Deliver the crystals!');
  // Ready intentionally pauses the Game; native resume belongs to Start.
  await page.waitForFunction(() =>
    window.__xyzSiteSmoke.audioSafety.contextStates.every(
      (state) => state === 'running',
    ),
  );
  const playingAudio = await page.evaluate(
    () => window.__xyzSiteSmoke.audioSafety,
  );
  check(
    playingAudio.nativeContexts === 8 &&
      playingAudio.zeroGainDestinations === 8 &&
      playingAudio.gains.every((gain) => gain === 0),
    `${phase}: running native audio lost its zero-gain destinations`,
  );
  const before = await page.locator('#game').screenshot();
  await page.locator('#game').focus();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  const after = await page.locator('#game').screenshot();
  const pixels = pngPixels(after);
  check(
    pixels.distinctRGB > 3 &&
      pixels.visiblePixels > 100 &&
      !before.equals(after),
    'Offline game did not render/respond to trusted input',
  );
  await writeFile(join(output, `${template}-${phase}.png`), after);
  const worker = await page.evaluate(async () => {
    const engine = await import(
      new URL('./engine/src/index.js', window.location.href).href
    );
    const pool = engine.createGeometryWorkerPool({ workers: 1 });
    try {
      const heights = new Float32Array([0, 1, 2, 3]);
      const result = await pool.submit(
        engine.heightfieldGeometryJob,
        {
          columns: 2,
          rows: 2,
          width: 2,
          depth: 2,
          heights,
          iterations: 0,
          smoothing: 0,
        },
        { requestBytes: heights.byteLength, transfer: [heights.buffer] },
      ).promise;
      if (
        heights.byteLength !== 0 ||
        result.value.positions[4] !== 1 ||
        result.value.indices.length !== 6
      )
        throw new Error('Native worker returned incorrect geometry');
      return {
        detached: true,
        positions: Array.from(result.value.positions),
        indices: Array.from(result.value.indices),
        timing: result.timing,
      };
    } finally {
      pool.destroy();
    }
  });
  await page.locator('#destroy').click();
  await mode(page, 'Destroyed — reload to play again.');
  await page.waitForFunction(() =>
    window.__xyzSiteSmoke.audioSafety.contextStates.every(
      (state) => state === 'closed',
    ),
  );
  const diagnostics = await page.evaluate(() => ({
    audio: window.__xyzOfflineAudio,
    workers: window.__xyzSiteSmoke.workers,
    rejections: window.__xyzSiteSmoke.rejections,
  }));
  check(
    !diagnostics.audio.errors.length &&
      !diagnostics.rejections.length &&
      diagnostics.workers.length === 1 &&
      diagnostics.workers[0].type === 'module' &&
      diagnostics.workers[0].messages > 0 &&
      !diagnostics.workers[0].errors.length,
    `${phase}: native audio/worker produced an asynchronous failure`,
  );
  return {
    pixels,
    silent,
    playingAudio,
    nativeAudio,
    modules,
    worker,
    diagnostics,
  };
}

/** Input must be the actual opt-in production build from an installed archive. */
export async function verifyOfflineDeployment({
  directory,
  template,
  base = `/games/${template}/`,
  output,
}) {
  check(['2d', '3d'].includes(template), 'Template must be 2d or 3d.');
  const original = JSON.parse(
    await readFile(join(directory, 'offline-manifest.json'), 'utf8'),
  );
  check(
    original.format === 1 && Array.isArray(original.resources),
    'Build with GAME_OFFLINE=1 before running the offline gate.',
  );
  const nativeResources = original.resources.filter(
    (entry) =>
      entry.path.startsWith('engine/vendor/opm/dist/') &&
      /\.[cm]?js$/.test(entry.path),
  );
  check(
    ['api/index.js', 'worklet/processor.js'].every((name) =>
      nativeResources.some(
        (entry) => entry.path === `engine/vendor/opm/dist/${name}`,
      ),
    ),
    'Offline manifest omits the native OPM loader or processor.',
  );
  const workspace = await mkdtemp(join(tmpdir(), 'xyz-offline-gate-'));
  const stage = join(workspace, 'deployment');
  const evidence = resolve(output ?? join(workspace, 'evidence'));
  await mkdir(evidence, { recursive: true });
  await cp(directory, stage, { recursive: true });
  const row = {
    template,
    base,
    version: original.version,
    status: 'starting',
    errors: [],
    csp: [],
    worklets: [],
    responses: [],
    pageWorkletResponses: [],
  };
  let browser,
    context,
    server,
    page,
    broken = false;
  try {
    server = await serveDeployment({
      directory: stage,
      base,
      fault: (name) => broken && name === 'offline-proof.txt',
    });
    const launch = await browserLaunchOptions('chromium');
    launch.args = [...(launch.args ?? []), '--mute-audio'];
    browser = await chromium.launch(launch);
    row.browser = browserIdentity('chromium', browser, launch);
    context = await browser.newContext({
      viewport: { width: 1100, height: 1000 },
      locale: 'en-US',
    });
    await context.addInitScript(installSilentSurface);
    await context.addInitScript(observeNativeAudio);
    const open = async () => {
      const next = await context.newPage();
      next.on('pageerror', (error) => row.errors.push(String(error)));
      next.on('response', (response) => {
        if (response.url().includes('/vendor/opm/dist/worklet/'))
          row.pageWorkletResponses.push({
            url: response.url(),
            status: response.status(),
            mime: response.headers()['content-type'],
          });
      });
      const response = await next.goto(
        `${server.url}?renderer=${template === '2d' ? 'canvas2d' : 'webgl2'}`,
        { waitUntil: 'domcontentloaded' },
      );
      check(
        response.headers()['content-security-policy'] === deploymentCSP,
        'Actual response did not enforce strict CSP.',
      );
      await next.waitForFunction(
        () => !!navigator.serviceWorker.controller,
        undefined,
        { timeout: 120000 },
      );
      return next;
    };
    const waitForWaiting = async () => {
      const registration = await page.evaluateHandle(() =>
        navigator.serviceWorker.getRegistration(),
      );
      try {
        await page.waitForFunction(
          (registration) => !!registration?.waiting,
          registration,
          { timeout: 120000 },
        );
      } finally {
        await registration.dispose();
      }
    };
    const activateAfterClosing = async (expectedVersion) => {
      const observer = await context.newPage();
      try {
        await observer.goto(new URL('/__offline-observer__', server.url).href);
        const registration = await observer.evaluateHandle(
          (scope) => navigator.serviceWorker.getRegistration(scope),
          server.url,
        );
        try {
          // waitForFunction checks truthiness synchronously; a Promise itself
          // is truthy even when its eventual value is false.
          await observer.waitForFunction(
            (registration) =>
              registration?.active?.state === 'activated' &&
              !registration.waiting &&
              !registration.installing,
            registration,
            { timeout: 120000 },
          );
          const activatedVersion = await observer.evaluate(
            (registration) =>
              new Promise((accept, reject) => {
                const channel = new MessageChannel();
                const timer = setTimeout(
                  () => reject(new Error('No activated worker status reply')),
                  10000,
                );
                channel.port1.onmessage = (event) => {
                  clearTimeout(timer);
                  channel.port1.close();
                  accept(event.data.version);
                };
                registration.active.postMessage(
                  { type: 'xyz-offline-status' },
                  [channel.port2],
                );
              }),
            registration,
          );
          check(
            activatedVersion === expectedVersion,
            'Native active worker generation did not match the verified build.',
          );
        } finally {
          await registration.dispose();
        }
      } finally {
        await observer.close();
      }
    };
    page = await open();
    check(
      (await version(page)) === original.version,
      'First installed generation differs from actual build.',
    );
    row.online = await playable(
      page,
      template,
      evidence,
      'online',
      nativeResources,
    );
    row.worklets.push(
      ...row.online.nativeAudio.modules.map((entry) => ({
        ...entry,
        phase: 'online',
      })),
    );
    row.responses.push(
      ...row.online.modules.map((entry) => ({ ...entry, phase: 'online' })),
    );
    row.isolation = await page.evaluate(async () => {
      const scope = new URL('/unrelated-game/', window.location.href).href;
      const name = `xyz-offline:${scope}:isolation-proof`;
      const url = new URL('__isolation__', scope).href;
      await (await caches.open(name)).put(url, new Response('unrelated-cache'));
      localStorage.setItem('__xyz_offline_isolation__', 'unrelated-storage');
      return { name, url };
    });
    row.csp = await page.evaluate(async () => {
      const violations = [];
      document.addEventListener('securitypolicyviolation', (event) =>
        violations.push({
          directive: event.effectiveDirective,
          blockedURI: event.blockedURI,
        }),
      );
      const script = document.createElement('script');
      script.textContent = 'window.__xyzInjectedInline = true';
      document.body.append(script);
      await new Promise((accept) => setTimeout(accept, 100));
      if (
        window.__xyzInjectedInline ||
        !violations.some(
          (event) =>
            event.blockedURI === 'inline' &&
            event.directive === 'script-src-elem',
        )
      )
        throw new Error(
          'Injected inline script was not rejected by response CSP.',
        );
      script.remove();
      return violations;
    });
    await page.close();
    await context.setOffline(true);
    page = await open();
    row.offline = await playable(
      page,
      template,
      evidence,
      'offline-fresh-navigation',
      nativeResources,
    );
    row.worklets.push(
      ...row.offline.nativeAudio.modules.map((entry) => ({
        ...entry,
        phase: 'offline',
      })),
    );
    row.responses.push(
      ...row.offline.modules.map((entry) => ({ ...entry, phase: 'offline' })),
    );
    check(
      (await version(page)) === original.version,
      'Offline navigation mixed cache generations.',
    );
    await context.setOffline(false);
    // A candidate built from changed artifacts must fail atomically. The active
    // page and old generation stay usable even though the origin is incomplete.
    await writeFile(join(stage, 'offline-proof.txt'), 'candidate-generation');
    const candidate = await prepareDeployment(stage, { offline: true });
    row.candidateVersion = candidate.version;
    broken = true;
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    await page.waitForFunction(
      () =>
        document
          .querySelector('[aria-label="Offline deployment"]')
          ?.textContent.includes('failed'),
      undefined,
      { timeout: 120000 },
    );
    check(
      (await version(page)) === original.version,
      'Failed installation replaced the active version.',
    );
    row.failedInstall = await page.evaluate(async () => ({
      text: document.querySelector('[aria-label="Offline deployment"]')
        .textContent,
      caches: await caches.keys(),
      waiting: !!(await navigator.serviceWorker.getRegistration()).waiting,
    }));
    check(
      !row.failedInstall.waiting &&
        row.failedInstall.caches.some((name) =>
          name.endsWith(original.version),
        ) &&
        !row.failedInstall.caches.some((name) =>
          name.endsWith(candidate.version),
        ),
      'Failed candidate cache was retained or old generation was lost.',
    );
    broken = false;
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    await waitForWaiting();
    check(
      (await version(page)) === original.version,
      'Waiting update changed an existing page generation.',
    );
    await page.close();
    await activateAfterClosing(candidate.version);
    page = await open();
    row.activatedVersion = await version(page);
    check(
      row.activatedVersion === candidate.version,
      `Verified candidate did not activate after the old client closed: expected ${candidate.version}, received ${row.activatedVersion}`,
    );
    row.update = {
      version: candidate.version,
      proof: await page.evaluate(() =>
        fetch(new URL('./offline-proof.txt', window.location.href)).then(
          (response) => response.text(),
        ),
      ),
    };
    check(
      row.update.proof === 'candidate-generation',
      'New generation served old resource bytes.',
    );
    // Redeploy the exact prior build: rollback remains an ordinary verified
    // deployment, never skipWaiting or a mixed-generation runtime pointer.
    await cp(directory, stage, { recursive: true });
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    await waitForWaiting();
    await page.close();
    await activateAfterClosing(original.version);
    page = await open();
    check(
      (await version(page)) === original.version,
      'Exact prior-build rollback failed.',
    );
    row.rollback = { version: await version(page) };
    await page
      .getByRole('button', { name: 'Remove offline installation', exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[aria-label="Offline deployment"]')
          ?.textContent.includes('Offline installation removed.'),
      undefined,
      { timeout: 30000 },
    );
    row.cleanup = await page.evaluate(async () => ({
      registered: !!(await navigator.serviceWorker.getRegistration()),
      caches: await caches.keys(),
    }));
    check(
      !row.cleanup.registered &&
        !row.cleanup.caches.some((name) =>
          name.startsWith(`xyz-offline:${server.url}:`),
        ),
      'Explicit offline removal did not clean only the owned scope.',
    );
    row.isolation.afterRemoval = await page.evaluate(
      async ({ name, url }) => ({
        present: await caches.has(name),
        cache: await (
          await caches.open(name)
        )
          .match(url)
          .then((response) => response?.text()),
        storage: localStorage.getItem('__xyz_offline_isolation__'),
      }),
      row.isolation,
    );
    check(
      row.isolation.afterRemoval.present &&
        row.isolation.afterRemoval.cache === 'unrelated-cache' &&
        row.isolation.afterRemoval.storage === 'unrelated-storage',
      'Offline lifecycle removed unrelated origin storage.',
    );
    check(row.errors.length === 0, `Page errors: ${row.errors.join('; ')}`);
    row.status = 'pass';
    return row;
  } catch (error) {
    row.status = 'fail';
    row.failure = String(error);
    throw error;
  } finally {
    await writeFile(
      join(evidence, `${template}-offline-report.json`),
      JSON.stringify(row, null, 2) + '\n',
    );
    await context?.close();
    await browser?.close();
    await server?.close();
    await rm(stage, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2),
    values = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index],
      value = args[index + 1];
    if (
      !['--deployment', '--template', '--base', '--output'].includes(key) ||
      !value ||
      values[key]
    )
      throw new Error(
        'Usage: node scripts/offline-browser.mjs --deployment dist --template 2d|3d [--base /games/2d/] [--output evidence-directory]',
      );
    values[key] = value;
  }
  const result = await verifyOfflineDeployment({
    directory: resolve(values['--deployment']),
    template: values['--template'],
    base: values['--base'],
    output: values['--output'],
  });
  console.log(JSON.stringify(result, null, 2));
}
