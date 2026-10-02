import { describe, it, expect } from 'vitest';
import {
  mkdtemp,
  writeFile,
  mkdir,
  symlink,
  rm,
  realpath,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanProject } from '../scripts/asset-project-lib.mjs';

async function fixture(run) {
  const directory = await realpath(
    await mkdtemp(join(tmpdir(), 'xyz-project-test-')),
  );
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
const manifest = (entries, bundles) =>
  JSON.stringify({ version: 1, entries, ...(bundles ? { bundles } : {}) });

describe('asset project reference boundaries', () => {
  it('reports the referring atlas page and JSON location when its image is missing', async () => {
    await fixture(async (directory) => {
      await writeFile(
        join(directory, 'project.json'),
        manifest([{ id: 'atlas', type: 'atlas', url: 'atlas.json' }]),
      );
      await writeFile(
        join(directory, 'atlas.json'),
        JSON.stringify({ frames: {}, meta: { image: 'missing.png' } }),
      );
      await expect(
        scanProject(join(directory, 'project.json')),
      ).rejects.toMatchObject({
        file: join(directory, 'atlas.json'),
        location: '/meta/image',
      });
    });
  });
  it('rejects encoded traversal and symlink escapes without acquiring outside assets', async () => {
    await fixture(async (directory) => {
      const root = join(directory, 'project');
      await mkdir(root);
      await writeFile(join(directory, 'private.bin'), 'not part of project');
      await writeFile(
        join(root, 'project.json'),
        manifest([{ id: 'data', type: 'binary', url: '%2e%2e/private.bin' }]),
      );
      await expect(
        scanProject(join(root, 'project.json')),
      ).rejects.toMatchObject({
        location: '/entries/0/url',
      });
      await symlink(join(directory, 'private.bin'), join(root, 'linked.bin'));
      await writeFile(
        join(root, 'project.json'),
        manifest([{ id: 'data', type: 'binary', url: 'linked.bin' }]),
      );
      await expect(
        scanProject(join(root, 'project.json')),
      ).rejects.toMatchObject({
        location: '/entries/0/url',
      });
    });
  });
  it('rejects a bundle referencing an undeclared asset rather than publishing an incomplete deployment', async () => {
    await fixture(async (directory) => {
      await writeFile(join(directory, 'data.bin'), 'data');
      await writeFile(
        join(directory, 'project.json'),
        manifest([{ id: 'data', type: 'binary', url: 'data.bin' }], {
          scene: ['data', 'missing'],
        }),
      );
      await expect(
        scanProject(join(directory, 'project.json')),
      ).rejects.toMatchObject({
        location: '/bundles/scene/1',
      });
    });
  });
});
