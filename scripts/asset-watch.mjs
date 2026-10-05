#!/usr/bin/env node
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { assetProject } from './asset-project.mjs';

export function assetWatch(args = process.argv.slice(2), options = {}) {
  return assetProject(
    args.length === 1 && args[0] === '--help' ? args : ['watch', ...args],
    options,
  );
}

if (
  process.argv[1] &&
  (await realpath(process.argv[1]).catch(() => undefined)) ===
    (await realpath(fileURLToPath(import.meta.url)))
) {
  const controller = new globalThis.AbortController();
  const interrupt = () =>
    controller.abort(new Error('Asset watcher interrupted.'));
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    await assetWatch(undefined, { signal: controller.signal });
  } catch (error) {
    console.error(
      JSON.stringify({
        status: 'failed',
        file: error.file ?? null,
        location: error.location ?? '/',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
