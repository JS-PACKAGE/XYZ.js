import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { gunzipSync } from 'node:zlib';

export function approvedPackageFiles(inventory) {
  if (
    inventory.schema !== 1 ||
    !Array.isArray(inventory.compiledModules) ||
    !Array.isArray(inventory.cjsModules) ||
    !Array.isArray(inventory.files)
  )
    throw new Error('Unsupported reviewed package inventory.');
  const paths = [
    ...inventory.files,
    ...inventory.compiledModules.flatMap((module) =>
      ['.js', '.js.map', '.d.ts'].map((suffix) => `dist/${module}${suffix}`),
    ),
    ...inventory.cjsModules.flatMap((module) =>
      ['.cjs', '.cjs.map'].map((suffix) => `dist/cjs/${module}${suffix}`),
    ),
  ];
  const unique = new Set();
  for (const path of paths) {
    validatePath(path);
    if (unique.has(path)) throw new Error(`Duplicate approved path: ${path}`);
    unique.add(path);
  }
  return [...unique].sort();
}
export function approvedPackagePatterns(inventory) {
  approvedPackageFiles(inventory);
  return [
    ...inventory.files,
    ...inventory.compiledModules.map(
      (module) => `dist/${module}.{js,js.map,d.ts}`,
    ),
    ...inventory.cjsModules.map((module) => `dist/cjs/${module}.{cjs,cjs.map}`),
  ].sort();
}
function hasControlCharacters(value) {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) return true;
  }
  return false;
}
function validatePath(path) {
  if (
    typeof path !== 'string' ||
    !path ||
    path.includes('\\') ||
    hasControlCharacters(path) ||
    path.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error(`Unsafe archive path: ${String(path)}`);
}
function field(header, start, end) {
  const bytes = header.subarray(start, end);
  const zero = bytes.indexOf(0);
  if (zero !== -1 && bytes.subarray(zero).some((byte) => byte !== 0))
    throw new Error('Invalid tar string padding.');
  return bytes.subarray(0, zero === -1 ? bytes.length : zero).toString('utf8');
}
function octal(header, start, end) {
  while (end > start && (header[end - 1] === 0 || header[end - 1] === 32))
    end--;
  const value = header.subarray(start, end).toString('ascii').trim();
  if (!/^[0-7]+$/.test(value)) throw new Error('Invalid tar numeric field.');
  const result = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(result))
    throw new Error('Tar numeric field exceeds safe integer range.');
  return result;
}
export function parsePackageTar(tar, approvedPaths) {
  const approved = new Set(approvedPaths);
  const directories = new Set(['package']);
  for (const path of approved) {
    validatePath(path);
    const parts = `package/${path}`.split('/');
    parts.pop();
    while (parts.length) {
      directories.add(parts.join('/'));
      parts.pop();
    }
  }
  if (tar.length % 512) throw new Error('Truncated tar archive.');
  const files = new Map();
  const seen = new Set();
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      if (
        offset + 1024 > tar.length ||
        tar.subarray(offset).some((byte) => byte !== 0)
      )
        throw new Error('Invalid tar end marker or trailing data.');
      for (const path of approved) {
        if (!files.has(path))
          throw new Error(`Missing approved archive entry: ${path}`);
      }
      return files;
    }
    let checksum = 0;
    for (let index = 0; index < 512; index++)
      checksum += index >= 148 && index < 156 ? 32 : header[index];
    if (checksum !== octal(header, 148, 156))
      throw new Error('Invalid tar header checksum.');
    if (field(header, 257, 263) !== 'ustar')
      throw new Error('Only standard ustar archives are accepted.');
    const prefix = field(header, 345, 500);
    const type = field(header, 156, 157);
    const name = `${prefix ? `${prefix}/` : ''}${field(header, 0, 100)}`;
    const canonical =
      type === '5' && name.endsWith('/') ? name.slice(0, -1) : name;
    validatePath(canonical);
    if (seen.has(canonical))
      throw new Error(`Duplicate archive entry: ${canonical}`);
    seen.add(canonical);
    if (!['', '0', '5'].includes(type) || field(header, 157, 257))
      throw new Error(
        `Unsupported archive entry (links and extended headers are forbidden): ${name}`,
      );
    const size = octal(header, 124, 136);
    const start = offset + 512;
    const end = start + size;
    const next = start + Math.ceil(size / 512) * 512;
    if (next > tar.length || tar.subarray(end, next).some((byte) => byte !== 0))
      throw new Error(`Truncated or invalid tar file padding: ${name}`);
    if (type === '5') {
      if (size || !directories.has(canonical))
        throw new Error(`Unexpected archive directory: ${name}`);
    } else {
      if (!canonical.startsWith('package/'))
        throw new Error(`Missing package/ archive prefix: ${name}`);
      const path = canonical.slice(8);
      if (!approved.has(path))
        throw new Error(`Unapproved archive entry: ${path}`);
      const content = tar.subarray(start, end);
      files.set(path, {
        content,
        sha256: createHash('sha256').update(content).digest('hex'),
        executable: (octal(header, 100, 108) & 0o111) !== 0,
      });
    }
    offset = next;
  }
  throw new Error('Tar archive has no complete end marker.');
}
export async function inspectApprovedArchive(path, inventory, sourceRoot) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 128 * 1024 * 1024)
    throw new Error('Expected a real package archive of at most 128 MiB.');
  const compressed = await readFile(path);
  const files = parsePackageTar(
    gunzipSync(compressed, { maxOutputLength: 256 * 1024 * 1024 }),
    approvedPackageFiles(inventory),
  );
  if (sourceRoot) {
    for (const [path, entry] of files) {
      const source = join(sourceRoot, path);
      // Refuse links in every path component, not only the final file.
      const parts = path.split('/');
      for (let count = 1; count <= parts.length; count++) {
        if (
          (
            await lstat(join(sourceRoot, ...parts.slice(0, count)))
          ).isSymbolicLink()
        )
          throw new Error(
            `Approved package source must not contain symlinks: ${path}`,
          );
      }
      if (!(await lstat(source)).isFile())
        throw new Error(`Approved package source is not a file: ${path}`);
      const sourceBytes = await readFile(source);
      let matches = entry.content.equals(sourceBytes);
      if (path === 'package.json') {
        // pnpm 12 removes packageManager and reorders keys when publishing.
        // Archive-to-archive reproducibility still compares the exact bytes.
        const expected = JSON.parse(sourceBytes.toString('utf8'));
        delete expected.packageManager;
        matches = isDeepStrictEqual(
          JSON.parse(entry.content.toString('utf8')),
          expected,
        );
      }
      if (!matches)
        throw new Error(
          `Archive content differs from approved source: ${path}`,
        );
      if (path.startsWith('dist/vendor/opm/')) {
        const canonical = join(sourceRoot, path.slice(5));
        if (!entry.content.equals(await readFile(canonical)))
          throw new Error(
            `Official OPM bytes differ from canonical vendor: ${path}`,
          );
      }
    }
  }
  const manifest = JSON.parse(
    files.get('package.json').content.toString('utf8'),
  );
  if (manifest.name !== 'xyz.js' || manifest.type !== 'module')
    throw new Error('Archive is not an xyz.js ESM package.');
  for (const path of Object.values(manifest.bin ?? {})) {
    const relative = path.replace(/^\.\//, '');
    if (!files.get(relative)?.executable)
      throw new Error(`Packaged CLI is absent or not executable: ${relative}`);
  }
  return {
    files,
    manifest,
    sha256: createHash('sha256').update(compressed).digest('hex'),
  };
}
