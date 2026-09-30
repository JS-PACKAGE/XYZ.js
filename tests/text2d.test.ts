import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Text2D } from '../packages/core/src/text2d.js';
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

it('includes glyph overhang and descenders in texture dimensions', async () => {
  const label = await Text2D.create('Hi', { fontSize: 24, padding: 2 });
  expect([label.texture.width, label.texture.height]).toEqual([33, 36]);
  label.destroy();
});

it('only publishes the latest text and releases out-of-order bitmaps', async () => {
  const label = await Text2D.create('initial');
  const original = label.texture;
  const pending: ((image: ImageBitmap) => void)[] = [];
  vi.stubGlobal(
    'createImageBitmap',
    () => new Promise<ImageBitmap>((resolve) => pending.push(resolve)),
  );
  const first = label.setText('first');
  const second = label.setText('second');
  const newer = bitmap();
  pending[1]!(newer);
  await second;
  const stale = bitmap();
  pending[0]!(stale);
  await first;
  expect(label.text).toBe('second');
  expect((label.texture as Texture).image).toBe(newer);
  expect(original.destroyed).toBe(true);
  expect(stale.close).toHaveBeenCalledOnce();
  expect(newer.close).not.toHaveBeenCalled();
  label.destroy();
  expect(newer.close).toHaveBeenCalledOnce();
});

it('returning to displayed text cancels a pending change without replacing its texture', async () => {
  const label = await Text2D.create('old');
  const original = label.texture;
  let resolve!: (image: ImageBitmap) => void;
  vi.stubGlobal(
    'createImageBitmap',
    () =>
      new Promise<ImageBitmap>((r) => {
        resolve = r;
      }),
  );
  const pending = label.setText('new');
  await label.setText('old');
  const stale = bitmap();
  resolve(stale);
  await pending;
  expect(label.text).toBe('old');
  expect(label.texture).toBe(original);
  expect(original.destroyed).toBe(false);
  expect(stale.close).toHaveBeenCalledOnce();
  label.destroy();
});

it('keeps the displayed texture after a failed update', async () => {
  const label = await Text2D.create('retained');
  const original = label.texture;
  vi.stubGlobal('createImageBitmap', async () => {
    throw new Error('decode');
  });
  await expect(label.setText('failed')).rejects.toThrow('Unable to decode');
  expect(label.text).toBe('retained');
  expect(label.texture).toBe(original);
  expect(original.destroyed).toBe(false);
  label.destroy();
});

it('releases late updates after destroy without destroying a borrowed replacement', async () => {
  const label = await Text2D.create('old');
  const original = label.texture;
  const shared = new Texture(bitmap());
  label.view = undefined;
  label.texture = shared;
  let resolve!: (image: ImageBitmap) => void;
  vi.stubGlobal(
    'createImageBitmap',
    () =>
      new Promise<ImageBitmap>((r) => {
        resolve = r;
      }),
  );
  const pending = label.setText('late');
  label.destroy();
  const late = bitmap();
  resolve(late);
  await pending;
  expect(original.destroyed).toBe(true);
  expect(shared.destroyed).toBe(false);
  expect(late.close).toHaveBeenCalledOnce();
  await expect(label.setText('no')).rejects.toThrow('destroyed');
  shared.destroy();
});

it('rejects oversized measured text before decoding', async () => {
  const decode = vi.fn();
  vi.stubGlobal('createImageBitmap', decode);
  await expect(Text2D.create('x'.repeat(1000))).rejects.toThrow(
    'resource budget',
  );
  expect(decode).not.toHaveBeenCalled();
});
