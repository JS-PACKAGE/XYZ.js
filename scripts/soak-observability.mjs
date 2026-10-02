import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { setTimeout, clearTimeout } from 'node:timers';

const execute = promisify(execFile);

class TailTrend {
  constructor(settings) {
    this.settings = settings;
    this.count = 0;
    this.tail = [];
    this.first = null;
    this.last = null;
    this.minimum = Infinity;
    this.maximum = -Infinity;
    this.meanTime = this.meanValue = this.covariance = this.variance = 0;
  }
  add(seconds, value) {
    if (!Number.isFinite(value)) return;
    this.count++;
    if (this.first === null) this.first = value;
    this.last = value;
    this.minimum = Math.min(this.minimum, value);
    this.maximum = Math.max(this.maximum, value);
    const dx = seconds - this.meanTime;
    const dy = value - this.meanValue;
    this.meanTime += dx / this.count;
    this.meanValue += dy / this.count;
    this.covariance += dx * (value - this.meanValue);
    this.variance += dx * (seconds - this.meanTime);
    this.tail.push({ seconds, value });
    if (this.tail.length > this.settings.tailSamples) this.tail.shift();
  }
  snapshot() {
    const values = this.tail.map((sample) => sample.value);
    const times = this.tail.map((sample) => sample.seconds);
    const count = values.length;
    const duration = count ? times.at(-1) - times[0] : 0;
    const mean = count
      ? values.reduce((sum, value) => sum + value, 0) / count
      : 0;
    const meanTime = count
      ? times.reduce((sum, value) => sum + value, 0) / count
      : 0;
    let covariance = 0;
    let variance = 0;
    for (let index = 0; index < count; index++) {
      covariance += (times[index] - meanTime) * (values[index] - mean);
      variance += (times[index] - meanTime) ** 2;
    }
    const slope = variance ? (covariance / variance) * 60 : null;
    const range = count ? Math.max(...values) - Math.min(...values) : null;
    const tolerance = Math.max(
      this.settings.plateauAbsoluteBytes,
      Math.abs(mean) * this.settings.plateauRelativeFraction,
    );
    const midpoint = Math.floor(count / 2);
    const floorGrowth = midpoint
      ? Math.min(...values.slice(midpoint)) -
        Math.min(...values.slice(0, midpoint))
      : null;
    let classification = 'insufficient-data';
    if (
      count >= this.settings.minimumTrendSamples &&
      duration >= this.settings.minimumTrendSeconds
    ) {
      if (range <= tolerance) classification = 'plateau';
      else if (
        slope > this.settings.growthBytesPerMinute &&
        floorGrowth > tolerance
      )
        classification = 'sustained-growth';
      else classification = 'variable';
    }
    return {
      count: this.count,
      first: this.first,
      last: this.last,
      min: this.count ? this.minimum : null,
      max: this.count ? this.maximum : null,
      wholeRunSlopeBytesPerMinute: this.variance
        ? (this.covariance / this.variance) * 60
        : null,
      retained: count,
      tailDurationSeconds: duration,
      tailSlopeBytesPerMinute: slope,
      tailRangeBytes: range,
      tailFloorGrowthBytes: floorGrowth,
      classification,
      thresholds: {
        minimumSamples: this.settings.minimumTrendSamples,
        minimumSeconds: this.settings.minimumTrendSeconds,
        toleranceBytes: tolerance,
        growthBytesPerMinute: this.settings.growthBytesPerMinute,
      },
      tail: this.tail.slice(),
      note: 'Observational tail trend; positive slope alone is not a leak, and GC/post-GC plateau is not inferred.',
    };
  }
}

/** Browser-wide tracing streams bounded evidence; no synthetic GC or forced collection. */
export async function startSoakObservability(
  browser,
  context,
  page,
  settings,
  sampleSeconds,
) {
  const started = performance.now();
  const errors = [];
  const retainedErrors = (error) => {
    if (errors.length < settings.tailSamples) errors.push(String(error));
  };
  const trends = Object.fromEntries(
    [
      'jsHeapUsedBytes',
      'jsHeapTotalBytes',
      'embedderHeapUsedBytes',
      'backingStorageBytes',
      'rendererRssBytes',
      'rendererVirtualBytes',
      'gpuProcessRssBytes',
    ].map((name) => [name, new TailTrend(settings)]),
  );
  const raw = [];
  const gcTail = [];
  const gcStarts = new Map();
  let sampleCount = 0;
  let gcCount = 0;
  let gcDuration = 0;
  let gcMax = 0;
  let gcOver50 = 0;
  let traceEventCount = 0;
  let unmatchedGcEvents = 0;
  let gcStatus = 'unsupported';
  let heapStatus = 'unsupported';
  let processStatus = 'unsupported';
  let tracing = false;
  let traceWindows = 0;
  let traceSeconds = 0;
  let traceStarted = 0;
  let traceDataLoss = false;
  let traceMaximumBufferUsage = 0;
  let cdp;
  let browserCdp;
  let timer;
  let sampling;
  let stopping = false;
  const completeGc = (event, durationMicroseconds) => {
    if (!Number.isFinite(durationMicroseconds) || durationMicroseconds < 0)
      return;
    const milliseconds = durationMicroseconds / 1000;
    gcCount++;
    gcDuration += milliseconds;
    gcMax = Math.max(gcMax, milliseconds);
    if (milliseconds > settings.longTaskMilliseconds) gcOver50++;
    gcTail.push({
      name: event.name,
      pid: event.pid,
      tid: event.tid,
      timestampMicroseconds: event.ts,
      durationMs: milliseconds,
    });
    if (gcTail.length > settings.tailSamples) gcTail.shift();
  };
  const onTrace = ({ value }) => {
    for (const event of value) {
      traceEventCount++;
      // Top-level timeline GC only: summing nested V8.GC.* slices would double-count pauses.
      if (event.name !== 'MinorGC' && event.name !== 'MajorGC') continue;
      const key = `${event.pid}:${event.tid}:${event.name}`;
      if (event.ph === 'X') completeGc(event, event.dur);
      else if (event.ph === 'B') {
        if (gcStarts.size < settings.tailSamples) gcStarts.set(key, event);
        else unmatchedGcEvents++;
      } else if (event.ph === 'E') {
        const start = gcStarts.get(key);
        if (start) {
          completeGc(start, event.ts - start.ts);
          gcStarts.delete(key);
        } else unmatchedGcEvents++;
      }
    }
  };
  const onBufferUsage = (event) => {
    traceMaximumBufferUsage = Math.max(
      traceMaximumBufferUsage,
      event.percentFull ?? 0,
    );
    if ((event.percentFull ?? 0) >= 1) traceDataLoss = true;
  };
  const beginTrace = async () => {
    await browserCdp.send('Tracing.start', {
      transferMode: 'ReportEvents',
      traceConfig: {
        recordMode: 'recordContinuously',
        includedCategories: ['devtools.timeline', 'v8'],
        traceBufferSizeInKb: settings.traceBufferKiB,
      },
      bufferUsageReportingInterval: 1000,
    });
    tracing = true;
    traceStarted = performance.now();
  };
  const endTrace = async () => {
    if (!tracing) return;
    const ended = performance.now();
    const completed = new Promise((resolve, reject) => {
      const onComplete = (event) => {
        clearTimeout(timeout);
        traceDataLoss ||= event.dataLossOccurred === true;
        resolve();
      };
      const timeout = setTimeout(() => {
        browserCdp.off('Tracing.tracingComplete', onComplete);
        reject(new Error('Tracing completion timed out.'));
      }, 10000);
      browserCdp.once('Tracing.tracingComplete', onComplete);
      browserCdp.send('Tracing.end').catch((error) => {
        clearTimeout(timeout);
        browserCdp.off('Tracing.tracingComplete', onComplete);
        reject(error);
      });
    });
    tracing = false;
    await completed;
    traceWindows++;
    traceSeconds += (ended - traceStarted) / 1000;
    unmatchedGcEvents += gcStarts.size;
    gcStarts.clear();
  };
  try {
    cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    heapStatus = 'available';
  } catch (error) {
    retainedErrors(`Page CDP unavailable: ${error}`);
  }
  try {
    browserCdp = await browser.newBrowserCDPSession();
    browserCdp.on('Tracing.dataCollected', onTrace);
    browserCdp.on('Tracing.bufferUsage', onBufferUsage);
    await beginTrace();
    gcStatus = 'available';
  } catch (error) {
    retainedErrors(`GC trace unavailable: ${error}`);
  }
  const sample = async () => {
    const seconds = (performance.now() - started) / 1000;
    const evidence = {
      seconds,
      heap: null,
      processMemory: null,
      workload: null,
    };
    // ReportEvents drains on end: rotate bounded windows instead of retaining a 1h trace.
    if (tracing) {
      try {
        await endTrace();
        if (!stopping) await beginTrace();
      } catch (error) {
        gcStatus = 'error';
        retainedErrors(`GC trace rotation: ${error}`);
      }
    }
    if (cdp) {
      try {
        const heap = await cdp.send('Runtime.getHeapUsage');
        evidence.heap = {
          usedBytes: heap.usedSize,
          totalBytes: heap.totalSize,
          embedderHeapUsedBytes: heap.embedderHeapUsedSize ?? null,
          backingStorageBytes: heap.backingStorageSize ?? null,
        };
        trends.jsHeapUsedBytes.add(seconds, heap.usedSize);
        trends.jsHeapTotalBytes.add(seconds, heap.totalSize);
        trends.embedderHeapUsedBytes.add(seconds, heap.embedderHeapUsedSize);
        trends.backingStorageBytes.add(seconds, heap.backingStorageSize);
        heapStatus = 'available';
      } catch (error) {
        heapStatus = 'error';
        retainedErrors(`Heap sample: ${error}`);
      }
    }
    if (browserCdp && ['darwin', 'linux'].includes(process.platform)) {
      try {
        const { processInfo } = await browserCdp.send(
          'SystemInfo.getProcessInfo',
        );
        const selected = processInfo.filter(
          (item) => item.type === 'renderer' || item.type === 'GPU',
        );
        if (!selected.length)
          throw new Error('CDP did not identify renderer/GPU processes.');
        const { stdout } = await execute(
          'ps',
          [
            '-o',
            'pid=,rss=,vsz=',
            '-p',
            selected.map((item) => item.id).join(','),
          ],
          { timeout: 5000, maxBuffer: 1024 * 1024 },
        );
        const rows = stdout
          .trim()
          .split('\n')
          .map((line) => line.trim().split(/\s+/).map(Number));
        const observations = selected.map((item) => {
          const row = rows.find((values) => values[0] === item.id);
          return {
            pid: item.id,
            type: item.type,
            rssBytes: row && Number.isFinite(row[1]) ? row[1] * 1024 : null,
            virtualBytes: row && Number.isFinite(row[2]) ? row[2] * 1024 : null,
          };
        });
        evidence.processMemory = observations.slice(0, settings.tailSamples);
        const renderer = observations.filter(
          (item) => item.type === 'renderer' && item.rssBytes !== null,
        );
        const gpu = observations.filter(
          (item) => item.type === 'GPU' && item.rssBytes !== null,
        );
        if (renderer.length) {
          trends.rendererRssBytes.add(
            seconds,
            renderer.reduce((sum, item) => sum + item.rssBytes, 0),
          );
          trends.rendererVirtualBytes.add(
            seconds,
            renderer.reduce((sum, item) => sum + (item.virtualBytes ?? 0), 0),
          );
        }
        if (gpu.length)
          trends.gpuProcessRssBytes.add(
            seconds,
            gpu.reduce((sum, item) => sum + item.rssBytes, 0),
          );
        processStatus = renderer.length ? 'available' : 'unavailable';
      } catch (error) {
        processStatus = 'error';
        retainedErrors(`OS process memory: ${error}`);
      }
    }
    try {
      evidence.workload = await page.evaluate(
        () => globalThis.__xyzSoakObservation ?? null,
      );
    } catch (error) {
      retainedErrors(`Workload association: ${error}`);
    }
    sampleCount++;
    raw.push(evidence);
    if (raw.length > settings.tailSamples) raw.shift();
  };
  // Awaited serial sampling: never accumulates overlapping CDP/OS requests.
  const schedule = () => {
    if (stopping) return;
    timer = setTimeout(() => {
      sampling = sample().catch(retainedErrors).finally(schedule);
    }, sampleSeconds * 1000);
  };
  await sample();
  schedule();
  return {
    async stop() {
      stopping = true;
      clearTimeout(timer);
      await sampling;
      await sample();
      if (tracing) {
        try {
          await endTrace();
        } catch (error) {
          gcStatus = 'error';
          retainedErrors(error);
        }
      }
      browserCdp?.off('Tracing.dataCollected', onTrace);
      browserCdp?.off('Tracing.bufferUsage', onBufferUsage);
      try {
        await cdp?.detach();
      } catch (error) {
        retainedErrors(error);
      }
      try {
        await browserCdp?.detach();
      } catch (error) {
        retainedErrors(error);
      }
      return {
        jsHeap: {
          status: heapStatus,
          source:
            'CDP Runtime.getHeapUsage (target isolate; not engine estimates or whole-process memory)',
        },
        processMemory: {
          status: processStatus,
          source: ['darwin', 'linux'].includes(process.platform)
            ? 'CDP SystemInfo process IDs + OS ps RSS/VSZ KiB'
            : null,
          scope:
            'aggregate renderer processes in an independently owned browser; GPU process RSS is separate, not VRAM',
          sharedPages: false,
        },
        gc: {
          status: gcStatus,
          source:
            'CDP Tracing top-level MinorGC/MajorGC events across owned browser',
          eventCount: gcCount,
          durationMs: gcStatus === 'available' ? gcDuration : null,
          maxDurationMs: gcCount ? gcMax : null,
          eventsOver50Ms: gcOver50,
          traceEventsObserved: traceEventCount,
          unmatchedEvents: unmatchedGcEvents + gcStarts.size,
          traceWindows,
          tracedSeconds: traceSeconds,
          dataLossOccurred: traceDataLoss,
          maximumBufferUsage: traceMaximumBufferUsage,
          traceBufferKiB: settings.traceBufferKiB,
          tail: gcTail,
          note: 'Bounded trace windows include drain/restart gaps and possible recorded data loss. GC event wall durations are not inferred from RAF hitches; parallel/background GC is not equivalent to stop-the-world pauses. Missing event kinds are not proof of no GC.',
        },
        memorySampleSeconds: sampleSeconds,
        sampleCount,
        trends: Object.fromEntries(
          Object.entries(trends).map(([name, trend]) => [
            name,
            trend.snapshot(),
          ]),
        ),
        rawTail: raw,
        errors,
        notes: [
          'No forced GC. Instrumentation overhead is included in the run.',
          'RSS includes native allocations; VSZ is address space, not resident memory. None of these metrics is total GPU VRAM.',
        ],
      };
    },
  };
}
