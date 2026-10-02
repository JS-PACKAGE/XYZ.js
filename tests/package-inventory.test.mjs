import { Buffer } from 'node:buffer';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  approvedPackageFiles,
  inspectApprovedArchive,
  parsePackageTar,
} from '../scripts/package-inventory.mjs';

function entry(
  name,
  content = '',
  { type = '0', link = '', prefix = '' } = {},
) {
  const bytes = Buffer.from(content);
  const header = Buffer.alloc(512);
  const put = (value, start, length) =>
    header.write(value, start, length, 'utf8');
  put(name, 0, 100);
  put('0000644\0', 100, 8);
  put('0000000\0', 108, 8);
  put('0000000\0', 116, 8);
  put(bytes.length.toString(8).padStart(11, '0') + '\0', 124, 12);
  put('00000000000\0', 136, 12);
  header.fill(32, 148, 156);
  put(type, 156, 1);
  put(link, 157, 100);
  put('ustar\0', 257, 6);
  put('00', 263, 2);
  put(prefix, 345, 155);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  put(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8);
  return Buffer.concat([
    header,
    bytes,
    Buffer.alloc((512 - (bytes.length % 512)) % 512),
  ]);
}
function archive(...entries) {
  return Buffer.concat([...entries, Buffer.alloc(1024)]);
}

describe('reviewed package archive boundary', () => {
  it('accepts only packer metadata normalization, not changed package contracts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xyz-package-contract-'));
    const inventory = {
      schema: 1,
      compiledModules: [],
      files: ['package.json'],
    };
    const source = {
      name: 'xyz.js',
      type: 'module',
      packageManager: 'pnpm@12.6.0',
      exports: { '.': './dist/src/index.js' },
      scripts: { build: 'trusted-build' },
    };
    const packed = {
      scripts: source.scripts,
      exports: source.exports,
      type: source.type,
      name: source.name,
    };
    const path = join(root, 'consumer.tgz');
    const pack = (manifest) =>
      writeFile(
        path,
        gzipSync(
          archive(entry('package/package.json', JSON.stringify(manifest))),
        ),
      );
    try {
      await writeFile(join(root, 'package.json'), JSON.stringify(source));
      await pack(packed);
      const approved = await inspectApprovedArchive(path, inventory, root);
      expect(approved.manifest.exports).toEqual(source.exports);
      for (const changed of [
        { ...packed, exports: { '.': './other-entry.js' } },
        { ...packed, scripts: { build: 'unapproved-build' } },
        { ...packed, dependencies: { unexpected: '1.0.0' } },
      ]) {
        await pack(changed);
        await expect(
          inspectApprovedArchive(path, inventory, root),
        ).rejects.toThrow();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it('keeps exact binary content and requires every approved file', () => {
    const bytes = Buffer.from([0, 255, 1, 128]);
    const tar = archive(entry('package/public/pixel.png', bytes));
    const files = parsePackageTar(tar, ['public/pixel.png']);
    expect(files.get('public/pixel.png').content).toEqual(bytes);
    expect(() =>
      parsePackageTar(tar, ['public/pixel.png', 'package.json']),
    ).toThrow('Missing approved archive entry: package.json');
  });
  it.each([
    '/package/package.json',
    'package/../package.json',
    'package/./package.json',
    'package//package.json',
    'package\\package.json',
    'package/C:/package.json',
    'elsewhere/package.json',
  ])('rejects noncanonical or unapproved archive paths: %s', (name) => {
    expect(() =>
      parsePackageTar(archive(entry(name, '{}')), ['package.json']),
    ).toThrow();
  });
  it('validates the ustar prefix as part of the path', () => {
    expect(() =>
      parsePackageTar(
        archive(entry('package.json', '{}', { prefix: '../package' })),
        ['package.json'],
      ),
    ).toThrow('Unsafe archive path');
  });
  it.each(['1', '2', 'x', 'g', 'L', 'K', '3', '6'])(
    'rejects links, extended headers and non-file types: %s',
    (type) => {
      expect(() =>
        parsePackageTar(
          archive(
            entry('package/package.json', '{}', {
              type,
              link: '../../outside',
            }),
          ),
          ['package.json'],
        ),
      ).toThrow('Unsupported archive entry');
    },
  );
  it('rejects an unknown file or directory rather than skipping it', () => {
    expect(() =>
      parsePackageTar(
        archive(
          entry('package/package.json', '{}'),
          entry(
            'package/starters/2d/node_modules/.vite/deps/_metadata.json',
            '{}',
          ),
        ),
        ['package.json'],
      ),
    ).toThrow('Unapproved archive entry');
    expect(() =>
      parsePackageTar(
        archive(
          entry('package/cache/', '', { type: '5' }),
          entry('package/package.json', '{}'),
        ),
        ['package.json'],
      ),
    ).toThrow('Unexpected archive directory');
  });
  it('rejects duplicate canonical entries even when their bytes match', () => {
    expect(() =>
      parsePackageTar(
        archive(
          entry('package/package.json', '{}'),
          entry('package/package.json', '{}'),
        ),
        ['package.json'],
      ),
    ).toThrow('Duplicate archive entry');
    expect(() =>
      parsePackageTar(
        archive(
          entry('package/', '', { type: '5' }),
          entry('package', '', { type: '5' }),
        ),
        [],
      ),
    ).toThrow('Duplicate archive entry');
  });
  it('rejects corrupt checksums, truncated content, incomplete end markers and hidden trailing headers', () => {
    const valid = archive(entry('package/package.json', '{}'));
    const corrupt = Buffer.from(valid);
    corrupt[10] ^= 1;
    expect(() => parsePackageTar(corrupt, ['package.json'])).toThrow(
      'checksum',
    );
    expect(() =>
      parsePackageTar(valid.subarray(0, 513), ['package.json']),
    ).toThrow('Truncated');
    expect(() =>
      parsePackageTar(valid.subarray(0, valid.length - 512), ['package.json']),
    ).toThrow('end marker');
    const hidden = Buffer.concat([valid, entry('package/hidden.js', 'bad')]);
    expect(() => parsePackageTar(hidden, ['package.json'])).toThrow(
      'trailing data',
    );
  });
  it('rejects unsafe reviewed paths and collisions between compiled and fixed entries', () => {
    const inventory = {
      schema: 1,
      compiledModules: ['src/index'],
      files: ['package.json'],
    };
    expect(() =>
      approvedPackageFiles({
        ...inventory,
        files: ['package.json', '../leak'],
      }),
    ).toThrow('Unsafe archive path');
    expect(() =>
      approvedPackageFiles({
        ...inventory,
        files: ['package.json', 'dist/src/index.js'],
      }),
    ).toThrow('Duplicate approved path');
  });
});
