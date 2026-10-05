/* global document -- used inside page.evaluate, which runs in the browser */
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { browserLaunchOptions } from './browser-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function authorSprite(page, filename, color) {
  const png = await page.evaluate((color) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(4, 4, 24, 24);
    return canvas.toDataURL('image/png').split(',')[1];
  }, color);
  await writeFile(filename, Buffer.from(png, 'base64'));
}

/** Explicit authoring recipe: edit the printed PNG/JSON paths, not application code. */
export async function startAssetHotReload({ port = 5274 } = {}) {
  await mkdir(join(root, '.vite'), { recursive: true });
  const directory = await mkdtemp(join(root, '.vite/asset-hot-reload-'));
  const authored = join(directory, 'authored');
  const output = join(directory, 'published');
  await mkdir(authored);
  const browser = await chromium.launch(await browserLaunchOptions('chromium'));
  try {
    const page = await browser.newPage();
    await authorSprite(page, join(authored, 'sprite.png'), '#ff0000');
  } finally {
    await browser.close();
  }
  const atlas = {
    frames: {
      sprite: {
        frame: { x: 4, y: 4, w: 24, h: 24 },
        rotated: false,
        trimmed: true,
        sourceSize: { w: 32, h: 32 },
        spriteSourceSize: { x: 4, y: 4, w: 24, h: 24 },
      },
    },
    meta: { image: 'sprite.png', size: { w: 32, h: 32 }, scale: 1 },
  };
  await writeFile(join(authored, 'atlas.json'), JSON.stringify(atlas));
  await writeFile(join(authored, 'stable.json'), '{"unchanged":true}');
  await writeFile(
    join(authored, 'project.json'),
    JSON.stringify({
      version: 1,
      entries: [
        { id: 'sprite', type: 'atlas', url: 'atlas.json' },
        { id: 'stable', type: 'json', url: 'stable.json' },
      ],
    }),
  );
  const server = await createServer({
    root,
    configFile: false,
    server: { host: '127.0.0.1', port, strictPort: true },
  });
  await server.listen();
  const events = [];
  let stdout = '',
    stderr = '';
  const watcher = spawn(
    process.execPath,
    [
      join(root, 'scripts/asset-project.mjs'),
      'watch',
      '--manifest',
      join(authored, 'project.json'),
      '--out',
      output,
    ],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  watcher.stdout.on('data', (chunk) => {
    stdout += chunk;
    const lines = stdout.split('\n');
    stdout = lines.pop();
    for (const line of lines) {
      if (line.trim()) events.push(JSON.parse(line));
    }
  });
  watcher.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const exit = once(watcher, 'exit');
  let watcherStopped = false;
  const stopWatcher = async () => {
    if (!watcherStopped) {
      watcherStopped = true;
      watcher.kill('SIGTERM');
    }
    await exit;
  };
  const relative = directory.slice(root.length).replaceAll('\\', '/');
  const url = `http://127.0.0.1:${port}/examples/asset-hot-reload/?assets=${encodeURIComponent(`/${relative}/published/current.json`)}&renderer=canvas2d`;
  return {
    directory,
    authored,
    output,
    events,
    url,
    diagnostics: () => stderr,
    stopWatcher,
    async close() {
      await stopWatcher();
      await server.close();
    },
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const session = await startAssetHotReload();
  console.log(
    JSON.stringify({
      url: session.url,
      authored: session.authored,
      output: session.output,
    }),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
      void session.close();
    });
}
