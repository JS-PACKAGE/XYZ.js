import { lstat, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

function validateManifest(manifest, files) {
  if (
    manifest.name !== 'xyz.js' ||
    manifest.type !== 'module' ||
    !manifest.version
  )
    throw new Error('Package must be a built xyz.js ESM release.');
  const root = manifest.exports?.['.'];
  if (
    root?.import !== './dist/src/index.js' ||
    root?.types !== './dist/src/index.d.ts'
  )
    throw new Error(
      'Package root must expose dist/src/index.js and dist/src/index.d.ts.',
    );
  for (const path of [
    'dist/src/index.js',
    'dist/src/index.d.ts',
    'dist/packages/audio/src/opm-adapter.js',
    'dist/vendor/opm/dist/api/index.js',
    'dist/vendor/opm/dist/core/index.js',
    'dist/vendor/opm/dist/worklet/processor.js',
  ]) {
    if (!files.has(path))
      throw new Error(
        `Incomplete release package: missing ${path}. Build/pack the release first.`,
      );
  }
}
async function inventory(directory, prefix = '') {
  const result = new Set();
  for (const entry of await readdir(join(directory, prefix), {
    withFileTypes: true,
  })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink())
      throw new Error(`Release dist must not contain symlinks: ${path}`);
    if (entry.isDirectory())
      for (const child of await inventory(directory, path)) result.add(child);
    else if (entry.isFile()) result.add(path);
    else throw new Error(`Release contains unsupported entry: ${path}`);
  }
  return result;
}
export async function inspectPackage(path) {
  const info = await lstat(path);
  if (info.isSymbolicLink())
    throw new Error('Package path must not be a symlink.');
  if (info.isDirectory()) {
    if ((await lstat(join(path, 'dist'))).isSymbolicLink())
      throw new Error('Release dist must be a real directory, not a symlink.');
    const manifest = JSON.parse(
      await readFile(join(path, 'package.json'), 'utf8'),
    );
    const files = new Set(
      [...(await inventory(join(path, 'dist')))].map((file) => `dist/${file}`),
    );
    validateManifest(manifest, files);
    return { directory: true, manifest };
  }
  if (!info.isFile() || !path.endsWith('.tgz'))
    throw new Error(
      'Package must be a .tgz tarball or built package directory.',
    );
  if (info.size > 128 * 1024 * 1024)
    throw new Error('Package archive exceeds 128 MiB.');
  const tar = gunzipSync(await readFile(path), {
    maxOutputLength: 256 * 1024 * 1024,
  });
  const files = new Set();
  let manifest;
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const string = (start, end) =>
      header.subarray(start, end).toString('utf8').split('\0')[0];
    const prefix = string(345, 500);
    const name = `${prefix ? prefix + '/' : ''}${string(0, 100)}`;
    const size = Number.parseInt(string(124, 136).trim(), 8);
    if (
      !Number.isSafeInteger(size) ||
      size < 0 ||
      offset + 512 + size > tar.length
    )
      throw new Error('Invalid package tar header.');
    const type = string(156, 157);
    if (
      name.startsWith('/') ||
      name.split('/').includes('..') ||
      name.includes('\\')
    )
      throw new Error('Unsafe path in package archive.');
    if (!['', '0', '5'].includes(type))
      throw new Error(
        `Unsupported archive entry type ${type}; use a standard npm/pnpm pack tarball without links or extended headers.`,
      );
    if (type !== '5') {
      if (!name.startsWith('package/'))
        throw new Error('Tarball entries must use the package/ prefix.');
      const path = name.slice(8);
      if (files.has(path)) throw new Error(`Duplicate archive entry: ${path}`);
      files.add(path);
      if (path === 'package.json')
        manifest = JSON.parse(
          tar.subarray(offset + 512, offset + 512 + size).toString('utf8'),
        );
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  if (!manifest) throw new Error('Tarball has no package.json.');
  validateManifest(manifest, files);
  return { directory: false, manifest };
}
