import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { readAuthorization } from './physical-authorization.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = new Map();
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const name = args[i];
  if (
    ![
      '--host',
      '--port',
      '--authorization',
      '--tls-cert',
      '--tls-key',
    ].includes(name)
  )
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
const tlsCert = options.get('--tls-cert'),
  tlsKey = options.get('--tls-key');
if (!!tlsCert !== !!tlsKey)
  throw new Error(
    'Supply both --tls-cert and --tls-key (existing authorized test certificates only).',
  );
const secure = !!tlsCert;
const origin = `${secure ? 'https' : 'http'}://${host.includes(':') ? `[${host}]` : host}:${port}`;
const loopback = ['127.0.0.1', 'localhost', '::1'].includes(host);
if (!loopback)
  await readAuthorization(
    options.get('--authorization'),
    'physical-harness-network',
    origin,
  );
if (!loopback && !secure)
  throw new Error(
    'Owned mobile harness requires existing authorized HTTPS certificates; no forwarding/pairing is performed.',
  );
await access(join(root, 'dist/src/index.js')).catch(() => {
  throw new Error('Built root missing. Run pnpm build before platform-manual.');
});
const execute = promisify(execFile);
const { stdout: commit } = await execute('git', ['rev-parse', 'HEAD'], {
  cwd: root,
});
const packageInfo = JSON.parse(
  await readFile(join(root, 'package.json'), 'utf8'),
);
const source = {
  commit: commit.trim(),
  packageVersion: packageInfo.version,
  builtEntrySha256: createHash('sha256')
    .update(await readFile(join(root, 'dist/src/index.js')))
    .digest('hex'),
};
const server = await createServer({
  root,
  plugins: [
    {
      name: 'xyz-physical-source-identity',
      configureServer(vite) {
        vite.middlewares.use(
          '/__xyz/qualification-source',
          (_request, response) => {
            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Cache-Control', 'no-store');
            response.end(JSON.stringify(source));
          },
        );
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: '../../src/index.js',
        replacement: join(root, 'dist/src/index.js'),
      },
    ],
  },
  server: {
    host,
    port,
    strictPort: true,
    ...(secure
      ? {
          https: { cert: await readFile(tlsCert), key: await readFile(tlsKey) },
        }
      : {}),
  },
});
await server.listen();
console.log(
  `Built-root owned-device collector: ${origin}/tests/browser/platform.html?renderer=canvas2d&physical=1`,
);
console.log(
  'No browser opened. Download operator observations and measured JSON in the page; neither certifies untested devices.',
);
console.log(
  `Representative workloads: ${origin}/benchmarks/production/?workload=2d&renderer=webgpu (use workload=3d for the medium 3D profile).`,
);
console.log(
  'Prepare: node scripts/platform-hardware.mjs --prepare gate evidence.json. Collect independent native captures, bind actual source/session/observations/scenarios and attest; --verify evidence.json requires independent review.json for human-attested physical acceptance. Driver reset, pairing, OS settings and audible sound are never executed.',
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
