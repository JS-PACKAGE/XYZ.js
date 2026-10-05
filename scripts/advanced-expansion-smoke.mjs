/* global window -- used inside browser-run callbacks */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';

const output = resolve(process.argv[2] ?? '.vite/advanced-expansion-smoke');
await mkdir(output, { recursive: true });
const server = await createServer({
  configFile: false,
  server: { host: '127.0.0.1', port: 5197, strictPort: true },
  resolve: { alias: { 'xyz.js': resolve('dist/src/index.js') } },
  plugins: [
    {
      name: 'advanced-consumer-fixture',
      configureServer(server) {
        server.middlewares.use('/advanced-smoke', (_req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(
            '<!doctype html><html><body><script type="module">import {runAdvancedExpansion} from "/tests/browser/advanced-expansion.ts"; window.runAdvancedExpansion=runAdvancedExpansion;</script></body></html>',
          );
        });
      },
    },
  ],
});
let browser;
let failed = false;
try {
  await server.listen();
  const launch = await browserLaunchOptions('chromium');
  browser = await chromium.launch(launch);
  for (const backend of ['webgpu', 'webgl2']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    let report;
    try {
      await page.goto('http://127.0.0.1:5197/advanced-smoke');
      await page.waitForFunction(
        () => typeof window.runAdvancedExpansion === 'function',
      );
      report = await page.evaluate(
        (backend) => window.runAdvancedExpansion(backend),
        backend,
      );
      for (const scenario of report.scenarios) {
        if (scenario.png) {
          const path = `${backend}-${scenario.name}.png`;
          await writeFile(
            resolve(output, path),
            Buffer.from(scenario.png.split(',')[1], 'base64'),
          );
          scenario.png = path;
        }
      }
    } catch (error) {
      report = { backend, passed: false, error: error.stack ?? String(error) };
    }
    report.browser = browserIdentity('chromium', browser, launch);
    report.browserErrors = errors;
    if (errors.length) report.passed = false;
    await writeFile(
      resolve(output, `${backend}.json`),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
    failed ||= !report.passed;
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
if (failed) process.exitCode = 1;
