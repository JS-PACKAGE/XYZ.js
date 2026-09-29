import { afterEach, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Primitive2D } from '../packages/core/src/primitive2d.js';
afterEach(() => vi.unstubAllGlobals());
it('disposes its generated texture, not a replacement shared texture', async () => {
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 1,
      height: 1,
      getContext: () => ({ fillRect() {} }),
    }),
  });
  vi.stubGlobal('createImageBitmap', async () => ({
    width: 10,
    height: 10,
    close() {},
  }));
  const primitive = await Primitive2D.rectangle(10, 10, 'red');
  const generated = primitive.texture;
  const shared = new Texture({
    width: 1,
    height: 1,
    close() {},
  } as unknown as ImageBitmap);
  primitive.texture = shared;
  primitive.destroy();
  expect(generated.destroyed).toBe(true);
  expect(shared.destroyed).toBe(false);
  shared.destroy();
});
