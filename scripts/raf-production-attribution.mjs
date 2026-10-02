/* global document, PerformanceObserver -- isolated diagnostic Playwright callbacks */
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { URL } from 'node:url';
import console from 'node:console';
import { chromium } from 'playwright-core';

// Temporary preload only: the real production driver and workloads remain unchanged.
// Extra tracing and callback interception perturb measurements; never certification.
const directory = new URL(
  '../.vite/raf-production-attribution/',
  import.meta.url,
);
await mkdir(directory, { recursive: true });
const report = {
  schema: 'temporary-production-raf-attribution-v1',
  certification: false,
  perturbed: true,
  pages: [],
  traces: [],
};
const launch = chromium.launch.bind(chromium);
chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const createSession = browser.newBrowserCDPSession.bind(browser);
  browser.newBrowserCDPSession = async (...sessionArgs) => {
    const session = await createSession(...sessionArgs);
    const trace = {
      capacity: 120000,
      seen: 0,
      selected: 0,
      overwritten: 0,
      events: [],
      commands: [],
    };
    report.traces.push(trace);
    session.on('Tracing.dataCollected', ({ value }) => {
      for (const event of value) {
        trace.seen++;
        if (
          event.ph !== 'M' &&
          !/BeginFrame|BeginMainFrame|DrawFrame|SubmitCompositorFrame|Swap|VSync|AnimationFrame|Pipeline|Wait|Deadline|RenderPass/.test(
            event.name,
          )
        )
          continue;
        const slot = trace.selected % trace.capacity;
        if (trace.selected >= trace.capacity) trace.overwritten++;
        trace.events[slot] = event;
        trace.selected++;
      }
    });
    const send = session.send.bind(session);
    session.send = async (method, params) => {
      const command = {
        method,
        startedNodeMs: performance.now(),
        finishedNodeMs: null,
      };
      trace.commands.push(command);
      if (method === 'Tracing.start') {
        params = {
          ...params,
          traceConfig: {
            ...params.traceConfig,
            includedCategories: [
              ...new Set([
                ...params.traceConfig.includedCategories,
                'cc',
                'viz',
                'gpu',
                'benchmark',
                'disabled-by-default-devtools.timeline.frame',
              ]),
            ],
          },
        };
      }
      try {
        return await send(method, params);
      } finally {
        command.finishedNodeMs = performance.now();
      }
    };
    return session;
  };
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...contextArgs) => {
    const context = await newContext(...contextArgs);
    await context.addInitScript(() => {
      const capacity = 8192,
        longTaskCapacity = 256;
      const timestamp = new Float64Array(capacity),
        started = new Float64Array(capacity),
        finished = new Float64Array(capacity),
        labels = new Uint16Array(capacity);
      const names = [],
        nameIds = new Map(),
        longTasks = [];
      let count = 0,
        dropped = 0;
      const nativeRaf = globalThis.requestAnimationFrame.bind(globalThis);
      globalThis.requestAnimationFrame = (callback) => {
        const name = callback.name || '(anonymous)';
        if (!nameIds.has(name)) {
          nameIds.set(name, names.length);
          names.push(name);
        }
        const label = nameIds.get(name);
        return nativeRaf((time) => {
          const start = performance.now();
          try {
            callback(time);
          } finally {
            const end = performance.now();
            if (count < capacity) {
              timestamp[count] = time;
              started[count] = start;
              finished[count] = end;
              labels[count] = label;
              count++;
            } else dropped++;
          }
        });
      };
      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (longTasks.length < longTaskCapacity)
              longTasks.push({
                startTimeMs: entry.startTime,
                durationMs: entry.duration,
              });
          }
        }).observe({ entryTypes: ['longtask'] });
      }
      globalThis.__xyzRafDiagnostic = () => ({
        capacity,
        count,
        dropped,
        names,
        timestamp: Array.from(timestamp.subarray(0, count)),
        started: Array.from(started.subarray(0, count)),
        finished: Array.from(finished.subarray(0, count)),
        labels: Array.from(labels.subarray(0, count)),
        longTasks,
        visibility: document.visibilityState,
        nowMs: performance.now(),
        timeOriginMs: performance.timeOrigin,
      });
    });
    const closeContext = context.close.bind(context);
    context.close = async (...closeArgs) => {
      try {
        for (const page of context.pages()) {
          if (page.isClosed()) continue;
          const cdp = await context.newCDPSession(page);
          await cdp.send('Performance.enable');
          const beforeNodeMs = performance.now();
          const [metrics, frames] = await Promise.all([
            cdp.send('Performance.getMetrics'),
            page.evaluate(() => globalThis.__xyzRafDiagnostic?.()),
          ]);
          const afterNodeMs = performance.now();
          await cdp.detach();
          report.pages.push({
            url: page.url(),
            clock: {
              beforeNodeMs,
              afterNodeMs,
              uncertaintyMs: afterNodeMs - beforeNodeMs,
              cdp: metrics.metrics,
            },
            frames,
          });
        }
      } finally {
        await closeContext(...closeArgs);
      }
    };
    return context;
  };
  const closeBrowser = browser.close.bind(browser);
  browser.close = async (...closeArgs) => {
    try {
      await closeBrowser(...closeArgs);
    } finally {
      for (const trace of report.traces) {
        if (trace.selected > trace.capacity) {
          const next = trace.selected % trace.capacity;
          trace.events = [
            ...trace.events.slice(next),
            ...trace.events.slice(0, next),
          ];
        }
      }
      report.runtimeComplete = true;
      await writeFile(
        new URL('report.json', directory),
        JSON.stringify(report, null, 2) + '\n',
      );
      console.log('RAF_PRODUCTION_ATTRIBUTION_EOF');
    }
  };
  return browser;
};
