import { mkdir, writeFile, readFile, rename, rm, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { setInterval, clearInterval } from 'node:timers';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { scanProject } from './asset-project-lib.mjs';
import { checksum, canonical } from './asset-recipe-lib.mjs';
import { assetRecipe } from './asset-tool-paths.mjs';

/** Bounded polling watches authored paths even after atomic saves, deletion or broken references.
 * Only this newly reserved directory is owned; source files are never written.
 */
export async function watchAssetProject({
  manifest,
  output,
  profile,
  signal,
  intervalMilliseconds = 250,
  retainGenerations = 2,
  onEvent = (event) => console.log(JSON.stringify(event)),
  build = async (...args) =>
    (await import('./asset-project.mjs')).assetProject(...args),
}) {
  if (
    !Number.isInteger(intervalMilliseconds) ||
    intervalMilliseconds < 50 ||
    intervalMilliseconds > 60000
  )
    throw new RangeError('Watch interval must be 50..60000 milliseconds.');
  if (
    !Number.isInteger(retainGenerations) ||
    retainGenerations < 2 ||
    retainGenerations > 32
  )
    throw new RangeError('Retained generations must be 2..32.');
  signal?.throwIfAborted();
  manifest = resolve(manifest);
  output = resolve(output);
  profile = profile && resolve(profile);
  // Exclusive reservation, including current.json: existing user directories are never adopted.
  await mkdir(dirname(output), { recursive: true });
  await mkdir(output);
  let stopped = false,
    scanning = false,
    publishing = false,
    scanWork,
    running,
    pending,
    active,
    previous;
  let sequence = 0,
    observed,
    lastError;
  const generations = [];
  let closeResolve;
  const closed = new Promise((resolveClosed) => {
    closeResolve = resolveClosed;
  });
  const failure = (error) => {
    const message = error.message;
    if (message !== lastError) {
      lastError = message;
      onEvent({
        status: 'failed',
        file: error.file ?? manifest,
        location: error.location ?? '/',
        message,
      });
    }
  };
  const pump = () => {
    if (running || stopped || !pending) return;
    running = (async () => {
      while (pending && !stopped) {
        const job = pending;
        pending = undefined;
        const controller = new globalThis.AbortController();
        active = controller;
        const name = `generation-${++sequence}`;
        const directory = join(output, name);
        const pointer = join(output, `.current-${sequence}.json`);
        try {
          const affected = new Set(
            [...job.project.ids.keys()].filter(
              (id) =>
                job.profileHash !== previous?.profileHash ||
                previous?.project.entryHashes.get(id) !==
                  job.project.entryHashes.get(id) ||
                previous?.project.ids.get(id)?.index !==
                  job.project.ids.get(id).index,
            ),
          );
          await build(
            [
              'build',
              '--manifest',
              manifest,
              '--out',
              directory,
              ...(profile ? ['--profile', profile] : []),
            ],
            {
              signal: controller.signal,
              snapshot: job.project,
              affected,
              previous,
              quiet: true,
            },
          );
          controller.signal.throwIfAborted();
          if (stopped || job.key !== observed)
            throw new Error('Generation superseded.');
          const deployed = JSON.parse(
            await readFile(join(directory, 'project-manifest.json'), 'utf8'),
          );
          await scanWork;
          controller.signal.throwIfAborted();
          if (stopped || job.key !== observed)
            throw new Error('Generation superseded.');
          publishing = true;
          await writeFile(
            pointer,
            canonical({
              version: 1,
              generation: name,
              manifest: `${name}/project-manifest.json`,
              entryHashes: deployed.entryHashes,
            }) + '\n',
            { flag: 'wx' },
          );
          controller.signal.throwIfAborted();
          // Pause observations across the atomic pointer commit; the next scan sees later edits.
          await rename(pointer, join(output, 'current.json'));
          previous = {
            output: directory,
            manifest: deployed,
            project: job.project,
            profileHash: job.profileHash,
          };
          generations.push(directory);
          while (generations.length > retainGenerations)
            await rm(generations.shift(), { recursive: true });
          lastError = undefined;
          onEvent({
            status: 'published',
            generation: name,
            output: directory,
            affected: [...affected],
            entryHashes: deployed.entryHashes,
          });
        } catch (error) {
          // A superseded candidate may have completed its immutable build, but is never the live pointer.
          if (previous?.output !== directory)
            await rm(directory, { recursive: true, force: true });
          await rm(pointer, { force: true });
          if (!controller.signal.aborted && !stopped) failure(error);
        } finally {
          active = undefined;
          publishing = false;
        }
      }
    })().finally(() => {
      running = undefined;
      if (pending && !stopped) pump();
    });
  };
  const scan = async () => {
    if (stopped || scanning || publishing) return;
    scanning = true;
    try {
      const project = await scanProject(manifest, { signal });
      let profileHash = '';
      if (profile) {
        const info = await stat(profile);
        if (!info.isFile() || info.size > assetRecipe.profileBytes)
          throw new Error('Profile exceeds byte budget.');
        profileHash = checksum(await readFile(profile));
      }
      const key = checksum(
        Buffer.from(
          canonical([project.manifest, [...project.entryHashes], profileHash]),
        ),
      );
      if (stopped) return;
      if (key !== observed) {
        observed = key;
        lastError = undefined;
        active?.abort(new Error('Asset generation superseded.'));
        pending = { project, profileHash, key };
        pump();
      }
    } catch (error) {
      if (!stopped) {
        observed = undefined;
        pending = undefined;
        active?.abort(error);
        failure(error);
      }
    } finally {
      scanning = false;
    }
  };
  const startScan = () => {
    if (!scanning && !publishing && !stopped) scanWork = scan();
    return scanWork;
  };
  const timer = setInterval(() => {
    void startScan();
  }, intervalMilliseconds);
  const stop = async () => {
    if (stopped) return closed;
    stopped = true;
    clearInterval(timer);
    pending = undefined;
    active?.abort(new Error('Asset watcher stopped.'));
    signal?.removeEventListener('abort', abort);
    await running;
    await scanWork;
    closeResolve();
    return closed;
  };
  const abort = () => {
    void stop();
  };
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) await stop();
  else await startScan();
  return { output, closed, stop };
}
