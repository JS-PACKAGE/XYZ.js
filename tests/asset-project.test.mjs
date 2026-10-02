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
  it.each([
    '../private.bin',
    '%2e%2e/private.bin',
    '%2e%2e%2fprivate.bin',
    '%2e%2e%5cprivate.bin',
  ])('rejects traversal %s without acquiring outside assets', async (url) => {
    await fixture(async (directory) => {
      const root = join(directory, 'project');
      await mkdir(root);
      await writeFile(join(directory, 'private.bin'), 'not part of project');
      await writeFile(
        join(root, 'project.json'),
        manifest([{ id: 'data', type: 'binary', url }]),
      );
      await expect(
        scanProject(join(root, 'project.json')),
      ).rejects.toMatchObject({
        name: 'ProjectError',
        file: join(root, 'project.json'),
        location: '/entries/0/url',
      });
    });
  });
  it('rejects symlink escapes without acquiring outside assets', async () => {
    await fixture(async (directory) => {
      const root = join(directory, 'project');
      await mkdir(root);
      await writeFile(join(directory, 'private.bin'), 'not part of project');
      await symlink(join(directory, 'private.bin'), join(root, 'linked.bin'));
      await writeFile(
        join(root, 'project.json'),
        manifest([{ id: 'data', type: 'binary', url: 'linked.bin' }]),
      );
      await expect(
        scanProject(join(root, 'project.json')),
      ).rejects.toMatchObject({
        name: 'ProjectError',
        file: join(root, 'project.json'),
        location: '/entries/0/url',
      });
    });
  });
  it('rejects traversal from a nested atlas with the referring JSON location', async () => {
    await fixture(async (directory) => {
      const root = join(directory, 'project');
      await mkdir(join(root, 'atlases'), { recursive: true });
      await writeFile(join(directory, 'private.png'), 'not part of project');
      await writeFile(
        join(root, 'project.json'),
        manifest([{ id: 'atlas', type: 'atlas', url: 'atlases/atlas.json' }]),
      );
      await writeFile(
        join(root, 'atlases/atlas.json'),
        JSON.stringify({
          frames: {},
          meta: { image: '%2e%2e/%2e%2e/private.png' },
        }),
      );
      await expect(
        scanProject(join(root, 'project.json')),
      ).rejects.toMatchObject({
        name: 'ProjectError',
        file: join(root, 'atlases/atlas.json'),
        location: '/meta/image',
      });
    });
  });
  it('supports nested assets and parent references that stay inside the project', async () => {
    await fixture(async (directory) => {
      await mkdir(join(directory, 'atlases'));
      await mkdir(join(directory, 'textures'));
      await writeFile(join(directory, 'textures/image.png'), 'image bytes');
      await writeFile(
        join(directory, 'atlases/atlas.json'),
        JSON.stringify({
          frames: {},
          meta: { image: '../textures/image.png' },
        }),
      );
      await symlink(
        join(directory, 'textures/image.png'),
        join(directory, 'linked.png'),
      );
      await writeFile(
        join(directory, 'project.json'),
        manifest([
          { id: 'atlas', type: 'atlas', url: 'atlases/atlas.json' },
          { id: 'alias', type: 'texture', url: 'linked.png' },
        ]),
      );
      const project = await scanProject(join(directory, 'project.json'));
      expect([...project.files.keys()]).toEqual([
        'atlases/atlas.json',
        'textures/image.png',
        'linked.png',
      ]);
      expect(project.files.get('linked.png').data).toEqual(
        project.files.get('textures/image.png').data,
      );
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
