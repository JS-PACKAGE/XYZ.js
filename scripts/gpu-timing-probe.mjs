/* global navigator, GPUBufferUsage, GPUMapMode */
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { chromium } from 'playwright-core';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';

/** No XYZ imports, canvas, renderer or engine query lifecycle. Raw ticks stay decimal strings. */
export async function probeGpuTimestamps(page) {
  return page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter)
      return {
        status: 'unsupported',
        reason: 'No native WebGPU adapter.',
        cases: [],
      };
    const identity = {
      ...adapter.info,
      vendor: adapter.info.vendor,
      architecture: adapter.info.architecture,
      device: adapter.info.device,
      description: adapter.info.description,
      isFallbackAdapter: adapter.info.isFallbackAdapter,
    };
    if (!adapter.features.has('timestamp-query'))
      return {
        status: 'unsupported',
        reason: 'Adapter does not advertise timestamp-query.',
        identity,
        cases: [],
      };
    const device = await adapter.requestDevice({
      requiredFeatures: ['timestamp-query'],
    });
    const errors = [];
    device.addEventListener('uncapturederror', (event) =>
      errors.push(String(event.error)),
    );
    const storage = device.createBuffer({
      size: 256 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    const module = device.createShaderModule({
      code: `@group(0) @binding(0) var<storage, read_write> output: array<u32>;
      @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id: vec3u) {
        var v = id.x + output[id.x];
        for (var i = 0u; i < 8192u; i++) { v = v * 1664525u + 1013904223u; }
        output[id.x] = v;
      }`,
    });
    const pipeline = await device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module, entryPoint: 'main' },
    });
    const group = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: storage } }],
    });
    const cases = [];
    try {
      for (const mode of ['empty-bracket', 'dispatch-pass']) {
        for (const dispatches of [1, 16, 128]) {
          const query = device.createQuerySet({ type: 'timestamp', count: 2 });
          const resolved = device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
          });
          const readback = device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
          });
          device.pushErrorScope('validation');
          try {
            const encoder = device.createCommandEncoder();
            if (mode === 'empty-bracket')
              encoder
                .beginComputePass({
                  timestampWrites: {
                    querySet: query,
                    beginningOfPassWriteIndex: 0,
                  },
                })
                .end();
            const pass = encoder.beginComputePass(
              mode === 'dispatch-pass'
                ? {
                    timestampWrites: {
                      querySet: query,
                      beginningOfPassWriteIndex: 0,
                      endOfPassWriteIndex: 1,
                    },
                  }
                : {},
            );
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, group);
            for (let i = 0; i < dispatches; i++) pass.dispatchWorkgroups(4);
            pass.end();
            if (mode === 'empty-bracket')
              encoder
                .beginComputePass({
                  timestampWrites: { querySet: query, endOfPassWriteIndex: 1 },
                })
                .end();
            encoder.resolveQuerySet(query, 0, 2, resolved, 0);
            encoder.copyBufferToBuffer(resolved, 0, readback, 0, 16);
            device.queue.submit([encoder.finish()]);
            await device.queue.onSubmittedWorkDone();
            await readback.mapAsync(GPUMapMode.READ, 0, 16);
            const ticks = new BigUint64Array(readback.getMappedRange(0, 16));
            const start = ticks[0],
              end = ticks[1],
              delta = end - start;
            cases.push({
              mode,
              dispatches,
              start: String(start),
              end: String(end),
              deltaNanoseconds: String(delta),
              milliseconds:
                delta > 0n && delta <= BigInt(Number.MAX_SAFE_INTEGER)
                  ? Number(delta) / 1e6
                  : null,
            });
            readback.unmap();
          } catch (error) {
            cases.push({
              mode,
              dispatches,
              error: String(error),
              milliseconds: null,
            });
          } finally {
            const error = await device.popErrorScope();
            if (error) errors.push(String(error));
            readback.destroy();
            resolved.destroy();
            query.destroy();
          }
        }
      }
    } finally {
      storage.destroy();
      device.destroy();
    }
    const real = cases.filter((sample) => sample.mode === 'dispatch-pass');
    const valid = real.filter((sample) => sample.milliseconds !== null);
    return {
      status: errors.length
        ? 'error'
        : valid.length
          ? 'available'
          : 'unsupported',
      reason: errors.length
        ? 'Native validation errors; see evidence.'
        : valid.length
          ? null
          : 'Engine-free timestamp-query on real storage-writing compute dispatches returned only zero, reversed, or unreadable timestamps after queue completion. This adapter/browser/driver session cannot supply a positive native duration; no CPU or synthetic fallback.',
      identity,
      cases,
      errors,
      scope:
        'Native compute execution only; excludes queue wait, map latency and presentation. No engine code.',
    };
  });
}

export async function runTimestampProbe(
  output = '.vite/gpu-timing-probe.json',
) {
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.end(
      '<!doctype html><title>Engine-free native timestamp probe</title>',
    );
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  let browser;
  try {
    const launch = await browserLaunchOptions('chromium');
    launch.args = [...(launch.args ?? []), '--mute-audio'];
    browser = await chromium.launch(launch);
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const result = {
      date: new Date().toISOString(),
      browser: browserIdentity('chromium', browser, launch),
      launchArguments: launch.args,
      evidence: await probeGpuTimestamps(page),
    };
    await mkdir(dirname(resolve(output)), { recursive: true });
    await writeFile(resolve(output), `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    await browser?.close();
    await new Promise((done) => server.close(done));
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv.length > 3)
    throw new Error('Usage: node scripts/gpu-timing-probe.mjs [output.json]');
  const result = await runTimestampProbe(process.argv[2]);
  if (result.evidence.status === 'error') process.exitCode = 1;
}
