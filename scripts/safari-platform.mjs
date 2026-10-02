/* global fetch, AbortSignal -- Native Node HTTP client */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer as createPortReservation } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { probeBackends } from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const name = args[i];
  if (!['--renderer', '--port', '--driver-port', '--output'].includes(name))
    throw new Error(`Unknown option ${name}.`);
  const value = args[++i];
  if (!value || value.startsWith('--'))
    throw new Error(`${name} needs a value.`);
  options.set(name, value);
}
if (process.platform !== 'darwin')
  throw new Error(
    'Native Safari requires macOS and authorized Remote Automation; WebKit emulation is not Safari.',
  );
const selected = (options.get('--renderer') ?? 'canvas2d,webgl2,webgpu').split(
  ',',
);
if (
  selected.some((name) => !['canvas2d', 'webgl2', 'webgpu'].includes(name)) ||
  new Set(selected).size !== selected.length
)
  throw new Error('Select unique canvas2d,webgl2,webgpu backends.');
const required = new Set(options.has('--renderer') ? selected : ['canvas2d']);
const port = Number(options.get('--port') ?? 5216);
const driverPort = Number(options.get('--driver-port') ?? 5315);
for (const value of [port, driverPort])
  if (!Number.isInteger(value) || value < 1 || value > 65535)
    throw new Error('Invalid port.');
const directory = resolve(
  root,
  options.get('--output') ?? '.vite/platform-safari',
);
await mkdir(directory, { recursive: true });
await access(join(root, 'dist/src/index.js'));
// Refuse occupied ports: this runner never adopts someone else's driver/session.
const reservation = createPortReservation();
await new Promise((done, fail) => {
  reservation.once('error', fail);
  reservation.listen(driverPort, '127.0.0.1', done);
});
await new Promise((done, fail) =>
  reservation.close((error) => (error ? fail(error) : done())),
);
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
let driver;
let sessionId;
let capabilities;
let driverLog = '';
let startupError;
const results = [];
const driverURL = `http://127.0.0.1:${driverPort}`;
async function command(
  path,
  body,
  method = body === undefined ? 'GET' : 'POST',
) {
  const response = await fetch(driverURL + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(65000),
  });
  const payload = await response.json();
  if (!response.ok || payload.value?.error)
    throw new Error(
      `${payload.value?.error ?? response.status}: ${payload.value?.message ?? JSON.stringify(payload)}`,
    );
  return payload.value;
}
const session = (path, body, method) =>
  command(`/session/${sessionId}${path}`, body, method);
async function execute(script, ...args) {
  const value = await session('/execute/async', {
    script: `const done = arguments[arguments.length - 1]; (async () => { ${script} })().then(done, error => done({__commandError: error.stack || String(error)}));`,
    args,
  });
  if (value?.__commandError) throw new Error(value.__commandError);
  return value;
}
async function ready() {
  return execute(
    `const end = performance.now() + 55000; while (performance.now() < end) { const state = document.querySelector('#report')?.dataset.state; if (state === 'failed') throw new Error(document.querySelector('#report').textContent); if (state === 'ready') return window.__xyzPlatform.report; await new Promise(requestAnimationFrame); } throw new Error('Platform fixture did not become ready.');`,
  );
}
async function expected(expression) {
  return execute(
    `const end = performance.now() + 55000; while (performance.now() < end) { if (window.__xyzPlatform?.report.error) throw new Error(window.__xyzPlatform.report.error); if (${expression}) return true; await new Promise(requestAnimationFrame); } throw new Error('Native Safari condition timed out: ' + ${JSON.stringify(expression)});`,
  );
}
const element = async (selector) =>
  (await session('/element', { using: 'css selector', value: selector }))[
    'element-6066-11e4-a52e-4f735466cecf'
  ];
async function key(value) {
  await session('/actions', {
    actions: [
      {
        type: 'key',
        id: 'keyboard',
        actions: [
          { type: 'keyDown', value },
          { type: 'keyUp', value },
        ],
      },
    ],
  });
}
try {
  await server.listen();
  driver = spawn('/usr/bin/safaridriver', ['--port', String(driverPort)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  driver.on('error', (error) => {
    driverLog = error.message;
  });
  for (const stream of [driver.stdout, driver.stderr])
    stream.on('data', (chunk) => {
      driverLog = (driverLog + chunk).slice(-8192);
    });
  const deadline = performance.now() + 10000;
  let available = false;
  while (performance.now() < deadline) {
    if (driver.exitCode !== null || driverLog.includes('EADDRINUSE'))
      throw new Error(`Owned safaridriver exited: ${driverLog}`);
    try {
      await command('/status');
      available = true;
      break;
    } catch {
      await delay(100);
    }
  }
  if (!available)
    throw new Error(`Owned safaridriver did not start: ${driverLog}`);
  const created = await command('/session', {
    capabilities: { alwaysMatch: { browserName: 'safari' } },
  });
  sessionId = created.sessionId;
  capabilities = created.capabilities;
  assert.equal(capabilities.browserName.toLowerCase(), 'safari');
  assert.equal(capabilities['safari:useSimulator'], false);
  await session('/timeouts', { script: 60000, pageLoad: 60000, implicit: 0 });
  await session('/window/rect', { width: 1000, height: 900 });
  for (const backend of selected) {
    const result = {
      backend,
      result: 'FAIL',
      errors: [],
      compositionMode: 'synthetic-native-events-not-real-IME',
      pointerMode: 'Safari-WebDriver-native-mouse-no-touch-certification',
    };
    try {
      await session('/url', {
        url: `http://127.0.0.1:${port}/tests/browser/probe.html`,
      });
      result.capabilities = await probeBackends({
        evaluate: (fn) => execute(`return (${fn.toString()})();`),
      });
      if (!result.capabilities[backend].available) {
        result.result = required.has(backend) ? 'FAIL' : 'UNSUPPORTED';
        result.unavailable = result.capabilities[backend].reason;
        if (required.has(backend))
          result.errors.push(
            `Explicit ${backend} unavailable: ${result.unavailable}`,
          );
        results.push(result);
        continue;
      }
      await session('/url', {
        url: `http://127.0.0.1:${port}/tests/browser/platform.html?renderer=${backend}`,
      });
      await ready();
      await execute(
        `document.querySelector('input[aria-label="Native field"]').focus();`,
      );
      const input = await element('input[aria-label="Native field"]');
      await session(`/element/${input}/value`, {
        text: 'A🙂אב',
        value: Array.from('A🙂אב'),
      });
      await expected(`window.__xyzPlatform.report.value === 'A🙂אב'`);
      await key('\uE003');
      await expected(`window.__xyzPlatform.report.value === 'A🙂א'`);
      const edits = await execute(
        'return window.__xyzPlatform.report.nativeEdits;',
      );
      assert.ok(
        edits.some((event) => event.trusted && event.value === 'A🙂א'),
        'Native keyboard editing reaches engine text state',
      );
      await execute(
        `const native = document.querySelector('input[aria-label="Native field"]'); native.dispatchEvent(new CompositionEvent('compositionstart', {data:''})); native.value = 'A🙂א語'; native.dispatchEvent(new CompositionEvent('compositionupdate', {data:'語'})); native.dispatchEvent(new InputEvent('input', {data:'語',inputType:'insertCompositionText',isComposing:true,bubbles:true})); native.dispatchEvent(new CompositionEvent('compositionend', {data:'語'}));`,
      );
      await expected(`window.__xyzPlatform.report.value === 'A🙂א語'`);
      const composition = await execute(
        'return window.__xyzPlatform.report.compositions;',
      );
      assert.equal(composition.length, 3);
      assert.ok(
        composition[0].composing &&
          !composition[2].composing &&
          composition.every((event) => !event.trusted),
      );
      const box = await execute(
        'const r=document.querySelector("#game").getBoundingClientRect(); return {x:r.x,y:r.y};',
      );
      await session('/actions', {
        actions: [
          {
            type: 'pointer',
            id: 'mouse',
            parameters: { pointerType: 'mouse' },
            actions: [
              {
                type: 'pointerMove',
                origin: 'viewport',
                x: Math.floor(box.x + 120),
                y: Math.floor(box.y + 76),
              },
              { type: 'pointerDown', button: 0 },
              { type: 'pointerUp', button: 0 },
            ],
          },
        ],
      });
      await expected(
        'window.__xyzPlatform.report.activations === 1 && window.__xyzPlatform.report.pointerTypes.includes("mouse")',
      );
      await execute(
        'document.querySelector(\'[aria-label="Unlock audio"]\').focus();',
      );
      await key('\uE007');
      await expected(
        'window.__xyzPlatform.report.audioUnlocked && window.__xyzPlatform.report.audioGestureTrusted',
      );
      try {
        await session('/window/minimize', {});
        const hidden = await execute(
          'return {state:document.visibilityState,ticks:window.__xyzPlatform.report.ticks};',
        );
        await delay(400);
        const stopped = await execute(
          'return {state:document.visibilityState,ticks:window.__xyzPlatform.report.ticks,events:window.__xyzPlatform.report.visibility};',
        );
        if (hidden.state === 'hidden' && stopped.state === 'hidden') {
          assert.equal(
            stopped.ticks,
            hidden.ticks,
            'Native hidden window stops Game updates',
          );
          assert.ok(
            stopped.events.some(
              (event) =>
                event.state === 'hidden' && event.trusted && event.audioPaused,
            ),
          );
          result.background = {
            result: 'PASS',
            mode: 'native-owned-Safari-window-minimize',
            stopped,
          };
        } else {
          result.background = {
            result: 'UNSUPPORTED',
            reason:
              'Safari automation window minimization did not expose a hidden document.',
            hidden,
            stopped,
          };
        }
      } catch (error) {
        if (!/^(unsupported operation|unknown command):/.test(error.message))
          throw error;
        result.background = { result: 'UNSUPPORTED', reason: error.message };
      } finally {
        await session('/window/rect', { width: 1000, height: 900 });
      }
      await expected('document.visibilityState === "visible"');
      await execute('await window.__xyzPlatform.lifecycle();');
      const measured = await ready();
      assert.equal(measured.lifecycleChecked, true);
      const { png, ...withoutPNG } = measured;
      assert.ok(png.startsWith('data:image/png;base64,'));
      await writeFile(
        join(directory, `${backend}-pixels.png`),
        Buffer.from(png.split(',')[1], 'base64'),
      );
      await execute('window.scrollTo(0,0);');
      await writeFile(
        join(directory, `${backend}-surface.png`),
        Buffer.from(await session('/screenshot'), 'base64'),
      );
      result.measured = withoutPNG;
      await execute('await window.__xyzPlatform.save();');
      await session('/refresh', {});
      await ready();
      await expected(
        `window.__xyzPlatform.report.restored && window.__xyzPlatform.report.value === 'A🙂א語'`,
      );
      result.pagehide = await execute(
        'return JSON.parse(sessionStorage.getItem("xyz-platform-pagehide"));',
      );
      assert.equal(result.pagehide.state, 'destroyed');
      assert.equal(result.pagehide.sceneDestroyed, true);
      await execute(
        'window.__xyzPlatform.destroy(); return window.__xyzPlatform.report.destroyed;',
      );
      result.result = 'PASS';
    } catch (error) {
      result.errors.push(error.stack ?? String(error));
      await session('/screenshot')
        .then((png) =>
          writeFile(
            join(directory, `${backend}-failure.png`),
            Buffer.from(png, 'base64'),
          ),
        )
        .catch(() => {});
    }
    results.push(result);
  }
} catch (error) {
  startupError = error.stack ?? String(error);
} finally {
  if (sessionId)
    await session('', undefined, 'DELETE').catch((error) => {
      startupError = [startupError, error.stack].filter(Boolean).join('\n');
    });
  if (driver && driver.exitCode === null) {
    driver.kill('SIGTERM');
    await Promise.race([
      new Promise((done) => driver.once('exit', done)),
      delay(5000),
    ]);
    if (driver.exitCode === null) driver.kill('SIGKILL');
  }
  await server.close();
  await writeFile(
    join(directory, 'results.json'),
    JSON.stringify(
      {
        mode: 'native-Safari-desktop-WebDriver',
        physicalMobileDeviceCertification: false,
        realOSIMECertification: false,
        hardwareGamepadCertification: false,
        capabilities,
        startupError,
        driverLog,
        results,
      },
      null,
      2,
    ),
  );
}
console.table(results.map(({ backend, result }) => ({ backend, result })));
if (startupError) console.error(startupError);
for (const result of results)
  for (const error of result.errors) console.error(error);
console.log(`Native Safari evidence: ${directory}`);
if (
  startupError ||
  !results.length ||
  results.some((result) => result.result === 'FAIL')
)
  process.exitCode = 1;
