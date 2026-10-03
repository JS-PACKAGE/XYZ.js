import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

// Diagnostic only: no browser flags, fixture changes, or timing certification.
export async function attachOwnedGpuCapture(browser, root, backend) {
  const cdp = await browser.newBrowserCDPSession();
  let identity;
  try {
    const [cdpProcesses, version] = await Promise.all([
      cdp.send('SystemInfo.getProcessInfo'),
      cdp.send('Browser.getVersion'),
    ]);
    const require = createRequire(import.meta.url);
    const revisions = JSON.parse(
      await readFile(
        resolve(
          require.resolve('playwright-core/package.json'),
          '../browsers.json',
        ),
        'utf8',
      ),
    );
    const pin = revisions.browsers.find((entry) => entry.name === 'chromium');
    if (version.product.split('/').at(-1) !== pin?.browserVersion)
      throw new Error(
        'Diagnostic Chromium version does not match the Playwright pin.',
      );
    const browsers = cdpProcesses.processInfo.filter(
      (entry) => entry.type === 'browser',
    );
    const gpus = cdpProcesses.processInfo.filter(
      (entry) => entry.type === 'GPU',
    );
    if (browsers.length !== 1 || gpus.length !== 1)
      throw new Error(
        'CDP must identify exactly one owned browser and GPU process.',
      );
    identity = {
      browserPid: browsers[0].id,
      gpuPid: gpus[0].id,
      nodePid: process.pid,
      nodeExecutable: process.execPath,
      browsersRoot: resolve(
        process.env.PLAYWRIGHT_BROWSERS_PATH ||
          resolve(homedir(), 'AppData/Local/ms-playwright'),
      ),
      cdp: cdpProcesses,
      browserVersion: version,
      playwrightPin: pin,
    };
  } finally {
    await cdp.detach();
  }
  const directory = resolve(root, '.vite/windows-host', `owned-gpu-${backend}`);
  // A reused capture directory would make readiness and dump ownership ambiguous.
  await mkdir(directory);
  await writeFile(
    resolve(directory, 'request.json'),
    JSON.stringify(identity, null, 2),
  );
  const monitor = spawn(
    'pwsh',
    [
      '-NoProfile',
      '-File',
      resolve(root, 'scripts/windows-chromium-crash.ps1'),
      '-Phase',
      'monitor',
      '-CaptureDirectory',
      directory,
    ],
    { stdio: 'inherit' },
  );
  let exited = false;
  let outcome;
  const finished = new Promise((resolveExit) => {
    monitor.once('error', (error) => {
      exited = true;
      outcome = { error };
      resolveExit(outcome);
    });
    monitor.once('exit', (code, signal) => {
      exited = true;
      outcome = { code, signal };
      resolveExit(outcome);
    });
  });
  const stop = async () => {
    await writeFile(resolve(directory, 'stop'), 'graceful cancel requested\n');
    const result = await finished;
    if (result.error) throw result.error;
    if (result.code !== 0)
      throw new Error(
        `Owned GPU monitor exited ${result.code} (${result.signal ?? 'no signal'}).`,
      );
  };
  try {
    const deadline = Date.now() + 35000;
    while (true) {
      if (exited)
        throw (
          outcome.error ??
          new Error('Owned GPU monitor exited before readiness.')
        );
      let ready;
      try {
        ready = JSON.parse(
          await readFile(resolve(directory, 'ready.json'), 'utf8'),
        );
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (ready) {
        if (!ready.readyAt || ready.gpu.ProcessId !== identity.gpuPid)
          throw new Error('Owned GPU monitor readiness identity is invalid.');
        return { stop, ready };
      }
      if (Date.now() > deadline)
        throw new Error('Owned GPU monitor readiness deadline exceeded.');
      await delay(100);
    }
  } catch (error) {
    try {
      await stop();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Owned GPU attachment and cleanup failed.',
        { cause: cleanupError },
      );
    }
    throw error;
  }
}
