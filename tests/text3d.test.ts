import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Text3D } from '../packages/core/src/objects3d.js';
import { TextureMaterial } from '../packages/core/src/mesh.js';
import { Texture } from '../packages/assets/src/index.js';

function bitmap(width = 24, height = 30): ImageBitmap {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap;
}

beforeEach(() => {
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 1,
      height: 1,
      getContext: () => ({
        measureText: (text: string) => ({
          width: text.length * 12,
          actualBoundingBoxLeft: 2,
          actualBoundingBoxRight: text.length * 12 + 3,
          actualBoundingBoxAscent: 22,
          actualBoundingBoxDescent: 8,
        }),
        scale() {},
        fillText() {},
      }),
    }),
  });
  vi.stubGlobal(
    'createImageBitmap',
    async (source: { width: number; height: number }) =>
      bitmap(source.width, source.height),
  );
});
afterEach(() => vi.unstubAllGlobals());

it('uses browser ink bounds, wrapping, alignment and multiline world bounds', async () => {
  const label = await Text3D.create('Hi', {
    fontSize: 24,
    padding: 2,
    height: 1,
  });
  expect(label.layout.width).toBe(33);
  expect(label.layout.height).toBe(36);
  expect(label.scale.y).toBe(1);
  const oldSphere = label.getWorldBoundingSphere({
    x: 0,
    y: 0,
    z: 0,
    radius: 0,
  });
  await label.setText('Hi\nThere');
  expect(label.layout.lines.map((line) => line.text)).toEqual(['Hi', 'There']);
  expect(
    label.layout.lines[1]!.baseline - label.layout.lines[0]!.baseline,
  ).toBe(32);
  expect(
    label.getWorldBoundingSphere({ x: 0, y: 0, z: 0, radius: 0 }).radius,
  ).toBeGreaterThan(oldSphere.radius);
  await label.setStyle({ wrapWidth: 60, align: 'center', lineHeight: 40 });
  await label.setText('Hi There');
  expect(label.layout.lines.length).toBeGreaterThan(1);
  expect(label.layout.lines[0]!.x).toBeGreaterThan(label.style.padding);
  label.destroy();
});

it('publishes latest requested text and style together and closes stale rasters', async () => {
  const label = await Text3D.create('old');
  const original = label.material.texture;
  const pending: ((image: ImageBitmap) => void)[] = [];
  vi.stubGlobal(
    'createImageBitmap',
    () => new Promise<ImageBitmap>((resolve) => pending.push(resolve)),
  );
  const first = label.setText('new');
  const second = label.setStyle({ color: '#00ff00', height: 2 });
  const current = bitmap();
  pending[1]!(current);
  await second;
  const stale = bitmap();
  pending[0]!(stale);
  await first;
  expect(label.text).toBe('new');
  expect(label.style.color).toBe('#00ff00');
  expect(label.style.height).toBe(2);
  expect(label.material.texture.image).toBe(current);
  expect(original.destroyed).toBe(true);
  expect(stale.close).toHaveBeenCalledOnce();
  label.destroy();
  expect(current.close).toHaveBeenCalledOnce();
});

it('preserves displayed texture and bounds on failure and restores requested state', async () => {
  const label = await Text3D.create('old');
  const texture = label.material.texture;
  const scale = [label.scale.x, label.scale.y];
  vi.stubGlobal('createImageBitmap', async () => {
    throw new Error('decode');
  });
  await expect(label.setText('failed')).rejects.toThrow('Unable to decode');
  expect(label.text).toBe('old');
  expect(label.material.texture).toBe(texture);
  expect([label.scale.x, label.scale.y]).toEqual(scale);
  expect(texture.destroyed).toBe(false);
  vi.stubGlobal('createImageBitmap', async () => bitmap());
  await label.setStyle({ color: '#ff0000' });
  expect(label.text).toBe('old');
  label.destroy();
});

it('owns separate textures and retires pending results without destroying borrowed material', async () => {
  const a = await Text3D.create('same');
  const b = await Text3D.create('same');
  const owned = a.material.texture;
  expect(owned).not.toBe(b.material.texture);
  const borrowed = new Texture(bitmap());
  a.material = new TextureMaterial({ texture: borrowed });
  let resolve!: (image: ImageBitmap) => void;
  vi.stubGlobal(
    'createImageBitmap',
    () =>
      new Promise<ImageBitmap>((r) => {
        resolve = r;
      }),
  );
  const update = a.setText('late');
  a.destroy();
  const late = bitmap();
  resolve(late);
  await update;
  expect(owned.destroyed).toBe(true);
  expect(late.close).toHaveBeenCalledOnce();
  expect(borrowed.destroyed).toBe(false);
  expect(b.material.texture.destroyed).toBe(false);
  b.destroy();
  borrowed.destroy();
});

it('returning to displayed text supersedes a pending raster without replacing the display', async () => {
  const label = await Text3D.create('old');
  const texture = label.material.texture;
  let resolve!: (image: ImageBitmap) => void;
  vi.stubGlobal(
    'createImageBitmap',
    () =>
      new Promise<ImageBitmap>((r) => {
        resolve = r;
      }),
  );
  const update = label.setText('new');
  await label.setText('old');
  const stale = bitmap();
  resolve(stale);
  await update;
  expect(label.material.texture).toBe(texture);
  expect(stale.close).toHaveBeenCalledOnce();
  label.destroy();
});
