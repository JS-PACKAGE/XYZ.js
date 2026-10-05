#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout, clearTimeout } from 'node:timers';
import console from 'node:console';
import { watchAssetProject } from './asset-project-watch.mjs';

const root = await mkdtemp(join(tmpdir(), 'xyz-watch-smoke-'));
let watcher;
const events = [],
  waiters = new Set();
const next = (status) =>
  new Promise((resolve, reject) => {
    const existing = events.findIndex((event) => event.status === status);
    if (existing >= 0) {
      resolve(events.splice(existing, 1)[0]);
      return;
    }
    const timer = setTimeout(() => {
      waiters.delete(receive);
      reject(new Error(`Timed out waiting for ${status}`));
    }, 60000);
    const receive = (event) => {
      if (event.status !== status) return false;
      clearTimeout(timer);
      waiters.delete(receive);
      resolve(event);
      return true;
    };
    waiters.add(receive);
  });
try {
  const manifest = join(root, 'project.json');
  await writeFile(
    manifest,
    JSON.stringify({
      version: 1,
      entries: [
        { id: 'config', type: 'json', url: 'config.json' },
        {
          id: 'dependent',
          type: 'text',
          url: 'dependent.txt',
          dependsOn: ['config'],
        },
        { id: 'independent', type: 'text', url: 'independent.txt' },
      ],
    }),
  );
  await writeFile(join(root, 'config.json'), '{"value":1}');
  await writeFile(join(root, 'dependent.txt'), 'dependent');
  await writeFile(join(root, 'independent.txt'), 'independent');
  watcher = await watchAssetProject({
    manifest,
    output: join(root, 'generated'),
    onEvent(event) {
      for (const receive of waiters) if (receive(event)) return;
      events.push(event);
    },
  });
  const first = await next('published');
  await writeFile(join(root, 'config.json'), '{"value":2}');
  const second = await next('published');
  assert.notEqual(first.entryHashes.config, second.entryHashes.config);
  assert.notEqual(first.entryHashes.dependent, second.entryHashes.dependent);
  assert.equal(first.entryHashes.independent, second.entryHashes.independent);
  assert.deepEqual(second.affected.sort(), ['config', 'dependent']);
  const pointer = await readFile(join(watcher.output, 'current.json'), 'utf8');
  await writeFile(join(root, 'config.json'), 'not JSON');
  await next('failed');
  assert.equal(
    await readFile(join(watcher.output, 'current.json'), 'utf8'),
    pointer,
  );
  await writeFile(join(root, 'config.json'), '{"value":3}');
  await next('published');
  await watcher.stop();
  await watcher.closed;
  const stopped = await readFile(join(watcher.output, 'current.json'), 'utf8');
  await writeFile(join(root, 'config.json'), '{"value":4}');
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(
    await readFile(join(watcher.output, 'current.json'), 'utf8'),
    stopped,
  );
  console.log(
    'Asset watch smoke passed: selective dependencies, atomic failure retention, recovery, teardown.',
  );
} finally {
  await watcher?.stop();
  await rm(root, { recursive: true, force: true });
}
