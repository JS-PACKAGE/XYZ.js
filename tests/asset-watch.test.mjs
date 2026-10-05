import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanProject } from '../scripts/asset-project-lib.mjs';
import { watchAssetProject } from '../scripts/asset-project-watch.mjs';

describe('asset dependency fingerprints', () => {
  it('invalidates dependent models, maps, atlases, font pages and ID dependents but not independent entries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xyz-watch-graph-'));
    try {
      await writeFile(
        join(root, 'project.json'),
        JSON.stringify({
          version: 1,
          entries: [
            { id: 'model', type: 'model', url: 'model.gltf' },
            { id: 'map', type: 'map', url: 'map.json' },
            { id: 'atlas', type: 'atlas', url: 'atlas.json' },
            { id: 'font', type: 'bitmapFont', url: 'font.json' },
            {
              id: 'dependent',
              type: 'text',
              url: 'other.txt',
              dependsOn: ['model'],
            },
            { id: 'independent', type: 'text', url: 'other.txt' },
          ],
        }),
      );
      await writeFile(
        join(root, 'model.gltf'),
        JSON.stringify({
          asset: { version: '2.0' },
          images: [{ uri: 'page.png' }],
        }),
      );
      await writeFile(
        join(root, 'map.json'),
        JSON.stringify({ tilesets: [{ source: 'tileset.json' }] }),
      );
      await writeFile(
        join(root, 'tileset.json'),
        JSON.stringify({ image: 'page.png' }),
      );
      await writeFile(
        join(root, 'atlas.json'),
        JSON.stringify({ meta: { image: 'page.png' }, frames: {} }),
      );
      await writeFile(
        join(root, 'font.json'),
        JSON.stringify({
          info: { size: 10 },
          common: { lineHeight: 10, base: 8, scaleW: 16, scaleH: 16, pages: 1 },
          pages: ['page.png'],
          chars: [
            {
              id: 65,
              x: 0,
              y: 0,
              width: 4,
              height: 4,
              xoffset: 0,
              yoffset: 0,
              xadvance: 5,
              page: 0,
            },
          ],
          kernings: [],
        }),
      );
      await writeFile(join(root, 'page.png'), 'first bytes');
      await writeFile(join(root, 'other.txt'), 'unchanged');
      const before = await scanProject(join(root, 'project.json'));
      await writeFile(join(root, 'page.png'), 'second bytes');
      const after = await scanProject(join(root, 'project.json'));
      for (const id of ['model', 'map', 'atlas', 'font', 'dependent'])
        expect(after.entryHashes.get(id)).not.toBe(before.entryHashes.get(id));
      expect(after.entryHashes.get('independent')).toBe(
        before.entryHashes.get('independent'),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it('terminates cyclic ID dependencies and propagates changes through the cycle', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xyz-watch-cycle-'));
    try {
      await writeFile(
        join(root, 'project.json'),
        JSON.stringify({
          version: 1,
          entries: [
            { id: 'a', type: 'text', url: 'a.txt', dependsOn: ['b'] },
            { id: 'b', type: 'text', url: 'b.txt', dependsOn: ['a'] },
          ],
        }),
      );
      await writeFile(join(root, 'a.txt'), 'one');
      await writeFile(join(root, 'b.txt'), 'two');
      const first = await scanProject(join(root, 'project.json'));
      await writeFile(join(root, 'a.txt'), 'changed');
      const next = await scanProject(join(root, 'project.json'));
      expect(next.entryHashes.get('a')).not.toBe(first.entryHashes.get('a'));
      expect(next.entryHashes.get('b')).not.toBe(first.entryHashes.get('b'));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it('refuses existing output directories and leaves authored files untouched', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xyz-watch-owned-'));
    try {
      await writeFile(join(root, 'user.txt'), 'keep');
      await expect(
        watchAssetProject({
          manifest: join(root, 'missing.json'),
          output: root,
        }),
      ).rejects.toThrow();
      expect(
        await import('node:fs/promises').then(({ readFile }) =>
          readFile(join(root, 'user.txt'), 'utf8'),
        ),
      ).toBe('keep');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
