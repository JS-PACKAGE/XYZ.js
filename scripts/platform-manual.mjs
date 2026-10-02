import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const name = args[i];
  if (!['--host', '--port'].includes(name))
    throw new Error(`Unknown option ${name}.`);
  const value = args[++i];
  if (!value || value.startsWith('--'))
    throw new Error(`${name} needs a value.`);
  options.set(name, value);
}
const host = options.get('--host') ?? '127.0.0.1';
const port = Number(options.get('--port') ?? 5210);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid port.');
await access(join(root, 'dist/src/index.js')).catch(() => {
  throw new Error('Built root missing. Run pnpm build before platform-manual.');
});
const server = await createServer({
  root,
  resolve: {
    alias: [
      {
        find: '../../src/index.js',
        replacement: join(root, 'dist/src/index.js'),
      },
    ],
  },
  server: { host, port, strictPort: true },
});
await server.listen();
console.log(
  `Built-root manual probe: http://${host}:${port}/tests/browser/platform.html?renderer=canvas2d`,
);
console.log(
  'No browser opened. Download operator observations and measured JSON in the page; neither certifies untested devices.',
);
if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1')
  console.warn(
    'Explicit non-loopback host exposes a Vite development server. Use only a trusted test network; mobile secure-context APIs need HTTPS or approved secure port forwarding.',
  );
async function stop() {
  await server.close();
}
process.once('SIGINT', () => {
  void stop();
});
process.once('SIGTERM', () => {
  void stop();
});
