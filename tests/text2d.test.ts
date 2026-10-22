import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Text2D } from '../packages/core/src/text2d.js';
import { CanvasTexture2D, Texture } from '../packages/assets/src/index.js';

function bitmap(width = 24, height = 30): ImageBitmap {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap;
}

/** A fake canvas records the lines drawn into it; drawImage copies a source's lines. */
interface FakeCanvas {
  width: number;
  height: number;
  drawn: string[];
}
let canvases: FakeCanvas[];
let fontLoad: (font: string, text: string) => Promise<unknown>;

beforeEach(() => {
  canvases = [];
  fontLoad = async () => [];
  vi.stubGlobal('document', {
    fonts: {
      load: (font: string, text: string) => fontLoad(font, text),
      ready: Promise.resolve(),
    },
    createElement: () => {
      const canvas: FakeCanvas = { width: 1, height: 1, drawn: [] };
      canvases.push(canvas);
      return Object.assign(canvas, {
        getContext: () => ({
          measureText: (text: string) => ({
            width: text.length * 12,
            actualBoundingBoxLeft: 2,
            actualBoundingBoxRight: text.length * 12 + 3,
            actualBoundingBoxAscent: 22,
            actualBoundingBoxDescent: 8,
          }),
          scale() {},
          fillText(text: string) {
            canvas.drawn.push(text);
          },
          drawImage(source: FakeCanvas) {
            canvas.drawn.push(...source.drawn);
          },
        }),
      });
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

/** Holds font loading, the only asynchronous step of a rasterization. */
function holdFonts(): (() => void)[] {
  const pending: (() => void)[] = [];
  fontLoad = () => new Promise((resolve) => pending.push(() => resolve([])));
  return pending;
}

function drawn(label: Text2D): string[] {
  return ((label.texture as CanvasTexture2D).image as unknown as FakeCanvas)
    .drawn;
}

/** Rasterization canvases are released once copied; only the texture's surface remains. */
function liveCanvases(): FakeCanvas[] {
  return canvases.filter((canvas) => canvas.width > 0);
}

it('includes glyph overhang and descenders in texture dimensions', async () => {
  const label = await Text2D.create('Hi', { fontSize: 24, padding: 2 });
  expect([label.texture.width, label.texture.height]).toEqual([33, 36]);
  label.destroy();
});

it('redraws its one owned texture in place, publishing only the latest text', async () => {
  const label = await Text2D.create('initial');
  const original = label.texture as CanvasTexture2D;
  expect(original).toBeInstanceOf(CanvasTexture2D);
  const pending = holdFonts();
  const first = label.setText('first');
  const second = label.setText('second');
  pending[1]!();
  await second;
  pending[0]!();
  await first;
  expect(label.text).toBe('second');
  expect(label.texture).toBe(original);
  expect(original.destroyed).toBe(false);
  expect(original.version).toBe(1);
  expect(drawn(label)).toEqual(['second']);
  expect(label.texture.width).toBe(81);
  expect(liveCanvases()).toEqual([original.image]);
  label.destroy();
  expect(original.destroyed).toBe(true);
});

it('returning to displayed text cancels a pending change without redrawing', async () => {
  const label = await Text2D.create('old');
  const original = label.texture as CanvasTexture2D;
  const pending = holdFonts();
  const change = label.setText('new');
  await label.setText('old');
  pending[0]!();
  await change;
  expect(label.text).toBe('old');
  expect(label.texture).toBe(original);
  expect(original.version).toBe(0);
  expect(drawn(label)).toEqual(['old']);
  expect(liveCanvases()).toEqual([original.image]);
  label.destroy();
});

it('keeps the displayed texture after a failed update', async () => {
  const label = await Text2D.create('retained');
  const original = label.texture as CanvasTexture2D;
  fontLoad = async () => {
    throw new Error('font load');
  };
  await expect(label.setText('failed')).rejects.toThrow('font load');
  expect(label.text).toBe('retained');
  expect(label.texture).toBe(original);
  expect(original.destroyed).toBe(false);
  expect(original.version).toBe(0);
  label.destroy();
});

it('releases late updates after destroy without destroying a borrowed replacement', async () => {
  const label = await Text2D.create('old');
  const original = label.texture as CanvasTexture2D;
  const shared = new Texture(bitmap());
  label.view = undefined;
  label.texture = shared;
  const pending = holdFonts();
  const late = label.setText('late');
  label.destroy();
  pending[0]!();
  await late;
  expect(original.destroyed).toBe(true);
  expect(shared.destroyed).toBe(false);
  expect(liveCanvases()).toEqual([]);
  await expect(label.setText('no')).rejects.toThrow('destroyed');
  shared.destroy();
});

it('an update replaces a borrowed texture with the owned one', async () => {
  const label = await Text2D.create('old');
  const original = label.texture;
  const shared = new Texture(bitmap());
  label.view = undefined;
  label.texture = shared;
  await label.setText('new');
  expect(label.texture).toBe(original);
  expect(drawn(label)).toEqual(['new']);
  expect(shared.destroyed).toBe(false);
  label.destroy();
  shared.destroy();
});

it('rejects oversized measured text before allocating a texture', async () => {
  await expect(Text2D.create('x'.repeat(1000))).rejects.toThrow(
    'resource budget',
  );
  expect(canvases.every((canvas) => canvas.drawn.length === 0)).toBe(true);
});
