/* global document, PerformanceObserver, requestAnimationFrame -- isolated Playwright callbacks */
import console from 'node:console';
import process from 'node:process';
import { URL } from 'node:url';
import { setTimeout, clearTimeout } from 'node:timers';
import { writeFile, mkdir } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
import { startSoakObservability } from './soak-observability.mjs';
import { measurementDefaults } from '../dist/src/data/observability.js';

const directory = new URL('../.vite/raf-host-diagnostic/', import.meta.url);
await mkdir(directory, { recursive: true });
const plan = [
  'off',
  'full',
  'sampling-only',
  'trace-rotation-only',
  'trace-rotation-only',
  'sampling-only',
  'full',
  'off',
];
const durationMs = 15000;
const report = {
  schema: 'collector-perturbation-v1',
  date: new Date().toISOString(),
  scope:
    'Engine-free controlled owned Chromium diagnostic; not production certification or gate retry. Host identity is recorded, not assumed equivalent to other hosts.',
  plan,
  durationMs,
  warmupMs: 2000,
  host: {
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    release: release(),
  },
  settings: measurementDefaults,
  workload: {
    backend: 'webgl2',
    width: 960,
    height: 540,
    drawsPerFrame: 128,
    fixedIntegerIterationsPerFrame: 100000,
  },
  phases: [],
};
const launch = await browserLaunchOptions('chromium');
launch.args = [...(launch.args ?? []), '--mute-audio'];
report.launch = launch;
let browser;
const percentile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)] ?? null;
};
const stats = (values) => ({
  count: values.length,
  mean: values.reduce((a, b) => a + b, 0) / values.length,
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
  p99: percentile(values, 0.99),
  max: values.length ? Math.max(...values) : null,
  over25: values.filter((x) => x > 25).length,
  over50: values.filter((x) => x > 50).length,
});
try {
  browser = await chromium.launch(launch);
  report.browser = browserIdentity('chromium', browser, launch);
  const context = await browser.newContext({
    viewport: { width: 1000, height: 740 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.setContent('<canvas width="960" height="540"></canvas>');
  await page.evaluate(() => {
    const gl = document
      .querySelector('canvas')
      .getContext('webgl2', { antialias: false });
    if (!gl) throw new Error('Native WebGL2 unavailable');
    const shader = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(
      p,
      shader(
        gl.VERTEX_SHADER,
        '#version 300 es\nprecision highp float; uniform vec2 shift; void main(){vec2 v=vec2(float((gl_VertexID+1)%3==0),float(gl_VertexID==2));gl_Position=vec4(v*.08+shift,0.,1.);}',
      ),
    );
    gl.attachShader(
      p,
      shader(
        gl.FRAGMENT_SHADER,
        '#version 300 es\nprecision highp float; out vec4 color; void main(){color=vec4(.1,.6,.9,1.);}',
      ),
    );
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    gl.viewport(0, 0, 960, 540);
    const shift = gl.getUniformLocation(p, 'shift');
    const capacity = 8192;
    let measuring = false,
      stopAt = Infinity,
      previous = 0,
      count = 0,
      accumulator = 1;
    let measurementStart = Infinity,
      measurementEnd = -Infinity,
      initialVisibility = document.visibilityState;
    const longTasks = [],
      visibilityEvents = [];
    const longTaskSupported =
      PerformanceObserver.supportedEntryTypes.includes('longtask');
    if (longTaskSupported) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (
            entry.startTime >= measurementStart &&
            entry.startTime <= measurementEnd
          )
            longTasks.push({
              startTimeMs: entry.startTime,
              durationMs: entry.duration,
              name: entry.name,
            });
        }
      }).observe({ entryTypes: ['longtask'] });
    }
    document.addEventListener('visibilitychange', () => {
      if (measuring)
        visibilityEvents.push({
          atBrowserMs: performance.now(),
          state: document.visibilityState,
        });
    });
    const data = {
      raf: new Float64Array(capacity),
      rafTimestamp: new Float64Array(capacity),
      callback: new Float64Array(capacity),
      callbackEnd: new Float64Array(capacity),
      cpu: new Float64Array(capacity),
      simulation: new Float64Array(capacity),
      submit: new Float64Array(capacity),
    };
    globalThis.__diag = {
      begin(duration) {
        count = 0;
        previous = 0;
        measuring = true;
        const start = performance.now();
        stopAt = start + duration;
        measurementStart = start;
        measurementEnd = Infinity;
        initialVisibility = document.visibilityState;
        longTasks.length = visibilityEvents.length = 0;
        globalThis.__diag.done = false;
        return { start, stopAt };
      },
      done: false,
      snapshot() {
        return {
          done: globalThis.__diag.done,
          measurementStartMs: measurementStart,
          measurementEndMs: measurementEnd,
          frames: count,
          checksum: accumulator,
          glError: gl.getError(),
          visibility: document.visibilityState,
          initialVisibility,
          visibilityEvents: visibilityEvents.slice(),
          longTaskSupported,
          longTasks: longTasks.slice(),
          data: Object.fromEntries(
            Object.entries(data).map(([key, values]) => [
              key,
              Array.from(values.subarray(0, count)),
            ]),
          ),
        };
      },
    };
    const frame = (timestamp) => {
      const start = performance.now();
      let x = accumulator;
      for (let i = 0; i < 100000; i++) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
      }
      accumulator = x;
      const simulationEnd = performance.now();
      gl.clearColor(0.03, 0.03, 0.03, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (let i = 0; i < 128; i++) {
        gl.uniform2f(
          shift,
          (i % 16) / 8 - 1 + Math.sin(timestamp / 1000) * 0.01,
          Math.floor(i / 16) / 4 - 1,
        );
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      const end = performance.now();
      if (measuring) {
        if (previous && count < capacity) {
          data.raf[count] = timestamp - previous;
          data.rafTimestamp[count] = timestamp;
          data.callback[count] = start;
          data.callbackEnd[count] = end;
          data.cpu[count] = end - start;
          data.simulation[count] = simulationEnd - start;
          data.submit[count] = end - simulationEnd;
          count++;
        }
        previous = timestamp;
        if (start >= stopAt) {
          measuring = false;
          measurementEnd = end;
          globalThis.__diag.done = true;
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  const metricsSession = await context.newCDPSession(page);
  await metricsSession.send('Performance.enable');
  const metrics = async () =>
    Object.fromEntries(
      (await metricsSession.send('Performance.getMetrics')).metrics.map((x) => [
        x.name,
        x.value,
      ]),
    );
  for (let index = 0; index < plan.length; index++) {
    const mode = plan[index];
    await page.waitForTimeout(2000);
    const phase = {
      index,
      mode,
      operations: [],
      traceBatches: [],
      native: null,
    };
    const wrapSession = (session, kind) => {
      if (kind === 'browser')
        session.on('Tracing.dataCollected', ({ value }) =>
          phase.traceBatches.push({
            atNodeMs: performance.now(),
            count: value.length,
          }),
        );
      return new Proxy(session, {
        get(target, key) {
          if (key === 'send')
            return async (method, params) => {
              const op = {
                method,
                startNodeMs: performance.now(),
                endNodeMs: null,
                error: null,
              };
              phase.operations.push(op);
              try {
                if (mode === 'sampling-only' && method === 'Tracing.start')
                  throw new Error(
                    'Diagnostic isolation: tracing intentionally unavailable for sampling-only phase.',
                  );
                return await target.send(method, params);
              } catch (error) {
                op.error = String(error);
                throw error;
              } finally {
                op.endNodeMs = performance.now();
              }
            };
          const value = Reflect.get(target, key, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };
    const wrappedBrowser = new Proxy(browser, {
      get(target, key) {
        if (key === 'newBrowserCDPSession')
          return async () =>
            wrapSession(await target.newBrowserCDPSession(), 'browser');
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    const wrappedContext = new Proxy(context, {
      get(target, key) {
        if (key === 'newCDPSession')
          return async (p) =>
            wrapSession(await target.newCDPSession(p), 'page');
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    const wrappedPage = new Proxy(page, {
      get(target, key) {
        if (key === 'evaluate')
          return async (...args) => {
            const op = {
              method: 'collector.page.evaluate',
              startNodeMs: performance.now(),
              endNodeMs: null,
            };
            phase.operations.push(op);
            try {
              return await target.evaluate(...args);
            } finally {
              op.endNodeMs = performance.now();
            }
          };
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    let collector,
      traceSession,
      timer,
      rotating,
      stopped = false;
    const startTrace = async () =>
      traceSession.send('Tracing.start', {
        transferMode: 'ReportEvents',
        traceConfig: {
          recordMode: 'recordContinuously',
          includedCategories: ['devtools.timeline', 'v8'],
          traceBufferSizeInKb: measurementDefaults.traceBufferKiB,
        },
        bufferUsageReportingInterval: 1000,
      });
    const endTrace = async () => {
      const completed = new Promise((resolve) =>
        traceSession.once('Tracing.tracingComplete', resolve),
      );
      await traceSession.send('Tracing.end');
      await completed;
    };
    if (mode === 'full' || mode === 'sampling-only')
      collector = await startSoakObservability(
        wrappedBrowser,
        wrappedContext,
        wrappedPage,
        measurementDefaults,
        1,
      );
    if (mode === 'trace-rotation-only') {
      traceSession = await wrappedBrowser.newBrowserCDPSession();
      await startTrace();
      const schedule = () => {
        if (!stopped)
          timer = setTimeout(() => {
            rotating = endTrace()
              .then(() => (stopped ? undefined : startTrace()))
              .finally(schedule);
          }, 1000);
      };
      schedule();
    }
    const before = await metrics();
    const nodeBefore = performance.now();
    const boundaries = await page.evaluate(
      (ms) => globalThis.__diag.begin(ms),
      durationMs,
    );
    const nodeAfter = performance.now();
    phase.clock = {
      browserStartMs: boundaries.start,
      nodeMidpointMs: (nodeBefore + nodeAfter) / 2,
      midpointUncertaintyMs: (nodeAfter - nodeBefore) / 2,
    };
    await delay(durationMs + 1000);
    phase.frames = await page.evaluate(() => globalThis.__diag.snapshot());
    const after = await metrics();
    phase.performanceMetricDeltaSeconds = Object.fromEntries(
      [
        'TaskDuration',
        'ScriptDuration',
        'LayoutDuration',
        'RecalcStyleDuration',
      ].map((key) => [key, after[key] - before[key]]),
    );
    if (collector) phase.native = await collector.stop();
    if (traceSession) {
      stopped = true;
      clearTimeout(timer);
      await rotating;
      await endTrace();
      await traceSession.detach();
    }
    const offset = phase.clock.nodeMidpointMs - phase.clock.browserStartMs;
    for (const op of phase.operations) {
      op.startBrowserMs = op.startNodeMs - offset;
      op.endBrowserMs = op.endNodeMs - offset;
      op.durationMs = op.endNodeMs - op.startNodeMs;
    }
    for (const batch of phase.traceBatches)
      batch.atBrowserMs = batch.atNodeMs - offset;
    phase.summary = Object.fromEntries(
      ['raf', 'cpu', 'simulation', 'submit'].map((key) => [
        key,
        stats(phase.frames.data[key]),
      ]),
    );
    const rotations = phase.operations.filter(
      (op) => op.method === 'Tracing.end',
    );
    const adjacent = [],
      distant = [];
    for (let frame = 0; frame < phase.frames.frames; frame++) {
      const at = phase.frames.data.callback[frame],
        dt = phase.frames.data.raf[frame];
      const near = rotations.some(
        (op) => op.startBrowserMs <= at + 25 && op.endBrowserMs >= at - dt - 25,
      );
      (near ? adjacent : distant).push(dt);
    }
    phase.rotationCorrelation = {
      criterion:
        'RAF callback interval intersects trace-end command +/-25ms, via node/browser midpoint clock mapping',
      adjacent: stats(adjacent),
      distant: stats(distant),
      traceEndDurationsMs: rotations.map((op) => op.durationMs),
    };
    const drainRestartWindows = [];
    for (let opIndex = 0; opIndex < phase.operations.length; opIndex++) {
      const op = phase.operations[opIndex];
      if (op.method !== 'Tracing.end') continue;
      const restart = phase.operations
        .slice(opIndex + 1)
        .find((next) => next.method === 'Tracing.start');
      if (restart)
        drainRestartWindows.push({
          startBrowserMs: op.startBrowserMs,
          endBrowserMs: restart.endBrowserMs,
          durationMs: restart.endBrowserMs - op.startBrowserMs,
        });
    }
    const drainAdjacent = [],
      drainDistant = [];
    for (let frame = 0; frame < phase.frames.frames; frame++) {
      const at = phase.frames.data.callback[frame],
        dt = phase.frames.data.raf[frame];
      const near = drainRestartWindows.some(
        (window) =>
          window.startBrowserMs <= at + 25 &&
          window.endBrowserMs >= at - dt - 25,
      );
      (near ? drainAdjacent : drainDistant).push(dt);
    }
    phase.drainRestartCorrelation = {
      criterion:
        'RAF interval intersects full trace-end/drain/restart window +/-25ms; final stop without restart excluded',
      windows: drainRestartWindows,
      durationMs: stats(drainRestartWindows.map((window) => window.durationMs)),
      adjacentRafMs: stats(drainAdjacent),
      distantRafMs: stats(drainDistant),
    };
    report.phases.push(phase);
    await writeFile(
      new URL(`phase-${index}-${mode}.json`, directory),
      JSON.stringify(phase, null, 2) + '\n',
    );
    console.log(
      JSON.stringify({
        index,
        mode,
        raf: phase.summary.raf,
        cpu: phase.summary.cpu,
        traceEndMs: phase.rotationCorrelation.traceEndDurationsMs,
        correlation: {
          adjacent: phase.rotationCorrelation.adjacent,
          distant: phase.rotationCorrelation.distant,
        },
      }),
    );
    if (!phase.frames.done)
      throw new Error(
        'Diagnostic phase did not finish its RAF measurement within the fixed observation window.',
      );
  }
  report.pageErrors = pageErrors;
  report.aggregate = Object.fromEntries(
    [...new Set(plan)].map((mode) => {
      const phases = report.phases.filter((p) => p.mode === mode);
      return [
        mode,
        {
          raf: stats(phases.flatMap((p) => p.frames.data.raf)),
          cpu: stats(phases.flatMap((p) => p.frames.data.cpu)),
          phaseIndexes: phases.map((p) => p.index),
        },
      ];
    }),
  );
  report.runtimeComplete = true;
  console.log('RAF_HOST_DIAGNOSTIC_EOF');
} catch (error) {
  report.error = String(error);
  throw error;
} finally {
  await browser?.close();
  await writeFile(
    new URL('report.json', directory),
    JSON.stringify(report, null, 2) + '\n',
  );
}
