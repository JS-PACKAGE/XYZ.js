import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { productionWorkload } from '../dist/src/data/observability.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const parent = join(root, '.vite/production-focus-guard');
await mkdir(parent, { recursive: true });
const directory = await mkdtemp(join(parent, 'run-'));
const exit = await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    [
      '--import',
      fileURLToPath(
        new URL(
          '../tests/fixtures/production-focus-preload.mjs',
          import.meta.url,
        ),
      ),
      'scripts/production-workloads.mjs',
      '--renderer',
      'webgl2',
      '--workloads',
      '2d',
      '--presentation',
      'native-foreground',
      '--output',
      directory,
      '--limit',
      'operations.teardownWallMs=5000',
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        XYZ_PRODUCTION_FOCUS_EVIDENCE: join(directory, 'control.json'),
      },
      stdio: 'inherit',
      timeout: 240000,
    },
  );
  child.once('error', reject);
  child.once('exit', (code, signal) => resolve({ code, signal }));
});
const result = JSON.parse(await readFile(join(directory, '2d.json'), 'utf8'));
assert.equal(
  result.presentation.before?.valid,
  true,
  'Native foreground must be available before exercising the guard.',
);
const control = JSON.parse(
  await readFile(join(directory, 'control.json'), 'utf8'),
);
assert.equal(
  control.error,
  undefined,
  'The real owned-page focus transition must complete.',
);
assert.equal(control.before.focused, true);
assert.equal(control.before.visibility, 'visible');
assert.equal(control.during.focused, false);
assert.equal(control.after.focused, true);
assert.equal(control.after.visibility, 'visible');
assert.equal(exit.signal, null);
assert.equal(exit.code, 1);
assert.equal(result.presentation.focusEmulationEnabled, false);
assert.equal(
  result.presentation.after.valid,
  true,
  'The original native foreground must be restored, not bypassed.',
);
assert.equal(result.presentation.observer.valid, false);
assert.ok(
  result.presentation.observer.interruptedLifecycleEvents > 0,
  'A genuine focus interruption must remain observable after focus returns.',
);
assert.equal(result.gate.functionalStatus, 'FAIL');
assert.equal(result.gate.performanceStatus, 'BLOCKED');
// The interrupted run must retain the original complete measurement boundaries.
assert.equal(
  result.stages.steady.frameIntervalMs.count,
  productionWorkload.measuredFrames,
);
assert.equal(
  result.stages.steady.cpuFrameWorkMs.count,
  productionWorkload.measuredFrames,
);
assert.equal(
  result.stages['asset-loading'].frameIntervalMs.count,
  productionWorkload.loadStageFrames,
);
assert.equal(
  result.stages['asset-loading'].cpuFrameWorkMs.count,
  productionWorkload.loadStageFrames,
);
console.log(
  JSON.stringify(
    {
      status: 'PASS',
      directory,
      control,
      rejectedQualification: result.gate.functionalStatus,
      observer: result.presentation.observer,
    },
    null,
    2,
  ),
);
