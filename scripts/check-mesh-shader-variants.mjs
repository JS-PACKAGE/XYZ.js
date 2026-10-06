/* global document -- Playwright report callback */
import assert from 'node:assert/strict';
import console from 'node:console';
import process from 'node:process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import ts from 'typescript';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const aliases = [
  {
    find: '../../src/index.js',
    replacement: resolve(root, 'dist/src/index.js'),
  },
  ...['webgl-feature-shaders', 'mesh-shader-variants'].map((name) => ({
    find: `../../packages/graphics/src/${name}.js`,
    replacement: resolve(root, `dist/packages/graphics/src/${name}.js`),
  })),
];
// The reference loader changes only the test server's shader builders. Materials,
// uniforms, passes and backend resource preparation remain the same shipped code.
const fullReference = {
  name: 'mesh-full-source-reference',
  enforce: 'pre',
  async load(id) {
    const file = id.split('?')[0];
    for (const [name, builders] of [
      [
        'webgl-feature-shaders',
        { buildMeshVertex: 'meshVertex', buildMeshFragment: 'meshFragment' },
      ],
      ['webgpu-mesh-shader', { buildWebGPUMeshShader: 'webgpuMeshShader' }],
    ]) {
      if (file !== resolve(root, `dist/packages/graphics/src/${name}.js`))
        continue;
      let source = await readFile(
        resolve(root, `packages/graphics/src/${name}.ts`),
        'utf8',
      );
      for (const [builder, full] of Object.entries(builders)) {
        const signature = new RegExp(
          `export function ${builder}\\([^)]*\\): string \\{`,
        );
        assert(signature.test(source), `Missing reference builder ${builder}`);
        source = source.replace(
          signature,
          (declaration) => `${declaration}\n return ${full};`,
        );
      }
      return ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText;
    }
  },
};
const servers = await Promise.all(
  [false, true].map((reference, index) =>
    createServer({
      root,
      plugins:
        reference || process.argv.includes('--full-reference-control')
          ? [fullReference]
          : [],
      resolve: { alias: aliases },
      server: { host: '127.0.0.1', port: 5247 + index, strictPort: true },
    }),
  ),
);
const launch = await browserLaunchOptions('chromium');
let browser;
const results = [];
// Source specialization can change the driver's floating-point reassociation.
// This measured exception is restricted to instancing; every other case is exact.
function assertComparison(scenario) {
  const allowance = scenario.name === 'instancing' ? 1 : 0;
  assert.ok(
    scenario.maximumDifference <= allowance,
    `${scenario.name}: maximum byte difference ${scenario.maximumDifference}`,
  );
  assert.ok(
    scenario.differentPixels <=
      Math.floor(scenario.totalPixels * (allowance ? 0.0001 : 0)),
    `${scenario.name}: changed ${scenario.differentPixels}/${scenario.totalPixels} pixels`,
  );
}
assert.throws(() =>
  assertComparison({
    name: 'instancing',
    maximumDifference: 2,
    differentPixels: 1,
    totalPixels: 25600,
  }),
);
assert.throws(() =>
  assertComparison({
    name: 'instancing',
    maximumDifference: 1,
    differentPixels: 3,
    totalPixels: 25600,
  }),
);
assert.throws(() =>
  assertComparison({
    name: 'plain-lights',
    maximumDifference: 1,
    differentPixels: 1,
    totalPixels: 25600,
  }),
);
try {
  for (const server of servers) await server.listen();
  browser = await chromium.launch(launch);
  for (const renderer of ['webgl2', 'webgpu']) {
    const pages = [];
    for (const port of [5247, 5248]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      await page.goto(
        `http://127.0.0.1:${port}/tests/browser/shader-variants.html?renderer=${renderer}`,
      );
      await page.waitForFunction(
        () =>
          document.querySelector('#report')?.getAttribute('data-state') !==
          'running',
        null,
        { timeout: 180000 },
      );
      const result = await page.locator('#report').evaluate((element) => ({
        state: element.getAttribute('data-state'),
        ...JSON.parse(element.textContent),
      }));
      pages.push({ ...result, errors });
      await page.close();
    }
    const [optimized, reference] = pages;
    const comparisons = optimized.scenarios.map((scenario, index) => {
      const before = reference.scenarios[index];
      assert.equal(
        before?.name,
        scenario.name,
        'Reference scenario coverage differs.',
      );
      assert.equal(before.pixels.length, scenario.pixels.length);
      let differentBytes = 0;
      let maximumDifference = 0;
      const changed = new Set();
      for (let i = 0; i < scenario.pixels.length; i++) {
        const delta = Math.abs(scenario.pixels[i] - before.pixels[i]);
        if (delta) {
          differentBytes++;
          changed.add(Math.floor(i / 4));
        }
        maximumDifference = Math.max(maximumDifference, delta);
      }
      return {
        name: scenario.name,
        differentBytes,
        differentPixels: changed.size,
        totalPixels: scenario.pixels.length / 4,
        maximumDifference,
        ...(scenario.changedPixels === undefined
          ? {}
          : { changedPixels: scenario.changedPixels }),
      };
    });
    results.push({
      renderer,
      state: optimized.state,
      error: optimized.error,
      referenceState: reference.state,
      referenceError: reference.error,
      errors: [...optimized.errors, ...reference.errors],
      scenarios: comparisons,
      compilation: optimized.compilation,
    });
  }
  const report = {
    identity: browserIdentity('chromium', browser, launch),
    reference:
      'Shipped ordinary renderer with full shader builders injected only by a separate test-server loader; exact except instancing allows maximum channel delta 1 in at most 0.01% of pixels due to compiler floating-point reassociation',
    results,
  };
  await mkdir(resolve(root, '.vite/shader-variants'), { recursive: true });
  await writeFile(
    resolve(root, '.vite/shader-variants/report.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  for (const result of results) {
    assert.equal(result.state, 'passed', result.error);
    assert.equal(result.referenceState, 'passed', result.referenceError);
    assert.deepEqual(result.errors, []);
    for (const scenario of result.scenarios) assertComparison(scenario);
  }
} finally {
  await browser?.close();
  for (const server of servers) await server.close();
}
