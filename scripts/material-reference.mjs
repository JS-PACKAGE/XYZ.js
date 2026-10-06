/* global document -- evaluated inside Playwright pages */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import console from 'node:console';
import { comparePixels, parityThresholds } from './pixel-parity.mjs';
import {
  materialReferenceNames,
  materialReferenceRenderers,
  referenceTileSize,
  validateCapture,
  validateGolden,
  summarizeCapture,
  summarizePixels,
  compareSummaries,
  goldenLimitsFor,
  compareReferencePixels,
  referencePixelSelfTest,
} from './material-reference-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const materialReferenceGoldenPath = join(
  root,
  'tests/browser/material-reference-golden.json',
);

async function capture(browser, baseURL, renderer, perturb) {
  const page = await browser.newPage({
    viewport: { width: 128, height: 128 },
    deviceScaleFactor: 1,
  });
  try {
    const url = new URL('/tests/browser/material-reference.html', baseURL);
    url.searchParams.set('renderer', renderer);
    if (perturb) url.searchParams.set('perturb', '1');
    await page.goto(url.href);
    await page.waitForFunction(
      () =>
        ['passed', 'failed'].includes(
          document.querySelector('#report')?.getAttribute('data-state'),
        ),
      undefined,
      { timeout: 180000 },
    );
    const report = JSON.parse(await page.locator('#report').textContent());
    const state = await page.locator('#report').getAttribute('data-state');
    if (state !== 'passed')
      throw new Error(report.error ?? `${renderer} fixture failed.`);
    return validateCapture(report, renderer);
  } finally {
    await page.close();
  }
}

async function savePNGs(directory, report, perturb) {
  for (const scenario of report.scenarios) {
    const png = Buffer.from(
      scenario.png.slice('data:image/png;base64,'.length),
      'base64',
    );
    if (
      !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      throw new Error(
        'Material reference: native proof has invalid PNG signature.',
      );
    await writeFile(
      join(
        directory,
        `${report.renderer}-${scenario.name}${perturb ? '-perturb' : ''}.png`,
      ),
      png,
    );
  }
}

/** Both native backends are required; no capability skip or source-only fallback. */
export async function qualifyMaterialReferences(
  browser,
  baseURL,
  directory,
  { regenerate = false } = {},
) {
  if (typeof regenerate !== 'boolean')
    throw new TypeError('regenerate must be an explicit boolean.');
  await mkdir(directory, { recursive: true });
  const result = {
    thresholds: parityThresholds,
    tileSize: referenceTileSize,
    regenerated: regenerate,
    backends: {},
    peer: [],
    pass: false,
  };
  try {
    const captures = {};
    const generated = {
      version: 1,
      tileSize: referenceTileSize,
      renderers: {},
    };
    for (const renderer of materialReferenceRenderers) {
      const normal = await capture(browser, baseURL, renderer, false);
      await savePNGs(directory, normal, false);
      const negative = await capture(browser, baseURL, renderer, true);
      await savePNGs(directory, negative, true);
      captures[renderer] = { normal, negative };
      generated.renderers[renderer] = summarizeCapture(normal, renderer);
      result.backends[renderer] = {
        scenarios: materialReferenceNames.map((name) => {
          const scene = normal.scenarios.find(
            (scenario) => scenario.name === name,
          );
          const negativeScene = negative.scenarios.find(
            (scenario) => scenario.name === name,
          );
          return {
            name,
            width: scene.width,
            height: scene.height,
            summary: generated.renderers[renderer].find(
              (scenario) => scenario.name === name,
            ),
            repeatSummary: summarizePixels(
              scene.repeat,
              scene.width,
              scene.height,
            ),
            negativeSummary: {
              name,
              ...summarizePixels(
                negativeScene.pixels,
                negativeScene.width,
                negativeScene.height,
              ),
            },
            negativeRepeatSummary: summarizePixels(
              negativeScene.repeat,
              negativeScene.width,
              negativeScene.height,
            ),
            proof: `${renderer}-${name}.png`,
            negativeProof: `${renderer}-${name}-perturb.png`,
          };
        }),
      };
    }
    const goldenLimits = goldenLimitsFor(process.platform);
    const golden = regenerate
      ? validateGolden(generated)
      : validateGolden(
          JSON.parse(await readFile(materialReferenceGoldenPath, 'utf8')),
        );
    for (const renderer of materialReferenceRenderers) {
      const { normal, negative } = captures[renderer];
      const negativeSummaries = summarizeCapture(negative, renderer);
      for (const name of materialReferenceNames) {
        const scene = normal.scenarios.find(
          (scenario) => scenario.name === name,
        );
        const negativeScene = negative.scenarios.find(
          (scenario) => scenario.name === name,
        );
        const summary = generated.renderers[renderer].find(
          (scenario) => scenario.name === name,
        );
        const expected = golden.renderers[renderer].find(
          (scenario) => scenario.name === name,
        );
        const repeatSummary = summarizePixels(
          scene.repeat,
          scene.width,
          scene.height,
        );
        const negativeSummary = negativeSummaries.find(
          (scenario) => scenario.name === name,
        );
        Object.assign(
          result.backends[renderer].scenarios.find(
            (scenario) => scenario.name === name,
          ),
          {
            golden: compareSummaries(summary, expected, goldenLimits),
            repeatGolden: compareSummaries(
              repeatSummary,
              expected,
              goldenLimits,
            ),
            repeat: comparePixels(
              scene.pixels,
              scene.repeat,
              scene.width,
              scene.height,
            ),
            negativeRepeat: comparePixels(
              negativeScene.pixels,
              negativeScene.repeat,
              scene.width,
              scene.height,
            ),
            negative: compareSummaries(negativeSummary, expected, goldenLimits),
          },
        );
      }
      result.backends[renderer].negativeRejected = result.backends[
        renderer
      ].scenarios.some((scene) => !scene.negative.pass);
    }
    for (const name of materialReferenceNames) {
      const left = captures.webgl2.normal.scenarios.find(
        (scenario) => scenario.name === name,
      );
      const right = captures.webgpu.normal.scenarios.find(
        (scenario) => scenario.name === name,
      );
      result.peer.push({
        name,
        ...compareReferencePixels(left, right),
        ...(name === 'procedural-preset-grid'
          ? { negativeControls: referencePixelSelfTest(left) }
          : {}),
      });
    }
    result.pass =
      result.peer.every((scene) => scene.pass) &&
      materialReferenceRenderers.every(
        (renderer) =>
          result.backends[renderer].negativeRejected &&
          result.backends[renderer].scenarios.every(
            (scene) =>
              scene.golden.pass &&
              scene.repeatGolden.pass &&
              scene.repeat.pass &&
              scene.negativeRepeat.pass,
          ),
      );
    if (!result.pass)
      throw new Error(
        'Material reference qualification failed: golden, repeat, peer, or material negative-control mismatch.',
      );
    // Never replace a golden until repeat/peer checks and both real material controls succeeded.
    if (regenerate)
      await writeFile(
        materialReferenceGoldenPath,
        `${JSON.stringify(generated, null, 2)}\n`,
      );
    await writeFile(
      join(directory, 'material-reference.json'),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    return result;
  } catch (error) {
    result.pass = false;
    result.error = String(error);
    await writeFile(
      join(directory, 'material-reference.json'),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    throw error;
  }
}

async function main() {
  let regenerate = false;
  let directory = join(root, '.vite/material-reference');
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--regenerate') regenerate = true;
    else if (args[index] === '--output') {
      const value = args[++index];
      if (!value || value.startsWith('--'))
        throw new Error('--output needs a directory.');
      directory = resolve(root, value);
    } else
      throw new Error(
        `Unknown option ${args[index]}. Use --regenerate or --output DIR.`,
      );
  }
  try {
    await access(join(root, 'dist/src/index.js'));
  } catch {
    throw new Error(
      'Built public entry is missing. Run pnpm build before material reference qualification.',
    );
  }
  const [
    { createServer },
    { chromium: managedChromium },
    { browserLaunchOptions },
  ] = await Promise.all([
    import('vite'),
    import('playwright-core'),
    import('./browser-launch.mjs'),
  ]);
  const server = await createServer({
    root,
    resolve: {
      alias: [
        {
          find: '../../src/index.js',
          replacement: join(root, 'dist/src/index.js'),
        },
        {
          find: '../src/index.js',
          replacement: join(root, 'dist/src/index.js'),
        },
        {
          find: '../../packages/core/src/shadow-atlas.js',
          replacement: join(root, 'dist/packages/core/src/shadow-atlas.js'),
        },
      ],
    },
    server: { host: '127.0.0.1', port: 5213, strictPort: true },
  });
  let browser;
  try {
    await server.listen();
    browser = await managedChromium.launch(
      await browserLaunchOptions('chromium'),
    );
    const report = await qualifyMaterialReferences(
      browser,
      'http://127.0.0.1:5213',
      directory,
      { regenerate },
    );
    console.log(
      JSON.stringify(
        {
          pass: report.pass,
          regenerated: report.regenerated,
          evidence: join(directory, 'material-reference.json'),
          peer: report.peer,
          negativeRejected: Object.fromEntries(
            Object.entries(report.backends).map(([renderer, result]) => [
              renderer,
              result.negativeRejected,
            ]),
          ),
        },
        null,
        2,
      ),
    );
  } finally {
    await browser?.close();
    await server.close();
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
