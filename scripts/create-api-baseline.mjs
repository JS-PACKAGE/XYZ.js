import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

const root = fileURLToPath(new URL('../', import.meta.url));
const version = '1.12.1';
const sha256 =
  'a0c2b6baf04b8a81db51eae92cd20fd1c79c4822bd2d8e8f84ce30835887c196';
const archive = resolve(
  root,
  process.argv[2] ??
    `.vite/v${version}-release/downloaded/xyz.js-${version}.tgz`,
);
const destination = resolve(
  root,
  process.argv[3] ?? `tests/consumers/declarations-v${version}.json`,
);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (digest(await readFile(archive)) !== sha256)
  throw new Error(
    `Refusing baseline: archive is not the verified official v${version} artifact (${sha256}).`,
  );
const temporary = await mkdtemp(resolve(tmpdir(), 'xyz-api-baseline-'));
try {
  await promisify(execFile)('tar', ['-xzf', archive, '-C', temporary]);
  const packageRoot = resolve(temporary, 'package');
  const metadata = JSON.parse(
    await readFile(resolve(packageRoot, 'package.json'), 'utf8'),
  );
  if (metadata.name !== 'xyz.js' || metadata.version !== version)
    throw new Error(
      'Official package metadata does not match baseline identity.',
    );
  const declarations = {};
  const hashes = {};
  async function collect(directory) {
    for (const entry of (
      await readdir(directory, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (entry.isFile() && entry.name.endsWith('.d.ts')) {
        const key = relative(packageRoot, path).replaceAll('\\', '/');
        const bytes = await readFile(path);
        declarations[key] = bytes.toString('utf8');
        hashes[key] = digest(bytes);
      }
    }
  }
  await collect(resolve(packageRoot, 'dist'));
  const baseline = {
    format: 1,
    version,
    provenance: {
      release: 'https://github.com/YueyuHoshizora/XYZ.js/releases/tag/v1.12.1',
      artifact:
        'https://github.com/YueyuHoshizora/XYZ.js/releases/download/v1.12.1/xyz.js-1.12.1.tgz',
      commit: 'ee0c1a1887b94444b68c3ee4d7c1fb8beb4c457d',
      archiveSha256: sha256,
      declarationSha256: hashes,
    },
    entry: metadata.types.replace(/^\.\//, ''),
    declarations,
  };
  // Creation is explicit and exclusive: the compatibility gate never refreshes history.
  await writeFile(destination, `${JSON.stringify(baseline, null, 2)}\n`, {
    flag: 'wx',
  });
  console.log(
    `Created immutable ${version} declaration baseline: ${destination}`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
