import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Graphics2D } from '../packages/core/src/graphics2d/graphics2d.js';
import { GraphicsPath2D } from '../packages/core/src/graphics2d/graphics-path2d.js';
import { CanvasTexture2D, Texture } from '../packages/assets/src/index.js';

/** A fake canvas records fill colours; drawImage copies a source's record. */
interface FakeCanvas {
  width: number;
  height: number;
  drawn: string[];
}
let canvases: FakeCanvas[];

beforeEach(() => {
  canvases = [];
  vi.stubGlobal(
    'Path2D',
    class {
      rect() {}
    },
  );
  vi.stubGlobal('document', {
    createElement: () => {
      const canvas: FakeCanvas = { width: 1, height: 1, drawn: [] };
      canvases.push(canvas);
      const context = {
        fillStyle: '#000000',
        globalAlpha: 1,
        setTransform() {},
        fill() {
          if (context.fillStyle === '#badbad') throw new Error('raster failed');
          canvas.drawn.push(context.fillStyle);
        },
        drawImage(source: FakeCanvas) {
          canvas.drawn.push(...source.drawn);
        },
      };
      return Object.assign(canvas, { getContext: () => context });
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

function square(size: number, fill: string) {
  return [
    {
      path: new GraphicsPath2D([
        { op: 'rect', x: 0, y: 0, width: size, height: size },
      ]),
      fill,
    },
  ];
}

function drawn(graphic: Graphics2D): string[] {
  return ((graphic.texture as CanvasTexture2D).image as unknown as FakeCanvas)
    .drawn;
}

/** Raster canvases are released once copied; only the texture's surface remains drawn.
 * (Instruction validation also creates an undrawn 1x1 colour-parsing canvas.) */
function liveCanvases(): FakeCanvas[] {
  return canvases.filter((canvas) => canvas.width > 0 && canvas.drawn.length);
}

it('redraws its one owned texture in place and releases each raster canvas', async () => {
  const graphic = await Graphics2D.create(square(4, '#ff0000'));
  const owned = graphic.texture as CanvasTexture2D;
  expect(owned).toBeInstanceOf(CanvasTexture2D);
  const update = graphic.setInstructions(square(8, '#00ff00'));
  // The redraw is applied before the returned promise settles.
  expect(drawn(graphic)).toEqual(['#00ff00']);
  await update;
  await graphic.setResolution(2);
  expect(graphic.texture).toBe(owned);
  expect(owned.version).toBe(2);
  expect([owned.width, owned.height]).toEqual([16, 16]);
  expect([graphic.width, graphic.height]).toEqual([8, 8]);
  expect(liveCanvases()).toEqual([owned.image]);
  graphic.destroy();
  expect(owned.destroyed).toBe(true);
});

it('keeps the displayed raster when an update fails and recovers afterwards', async () => {
  const graphic = await Graphics2D.create(square(4, '#ff0000'));
  const owned = graphic.texture as CanvasTexture2D;
  const instructions = graphic.instructions;
  await expect(graphic.setInstructions(square(4, '#badbad'))).rejects.toThrow(
    'raster failed',
  );
  await expect(graphic.setResolution(0)).rejects.toThrow('resolution');
  expect(graphic.instructions).toBe(instructions);
  expect(owned.version).toBe(0);
  // A later update starts from the displayed instructions, not the failed request.
  await graphic.setResolution(2);
  expect(drawn(graphic)).toEqual(['#ff0000']);
  graphic.destroy();
});

it('an update replaces a borrowed texture with the owned one without destroying it', async () => {
  const graphic = await Graphics2D.create(square(4, '#ff0000'));
  const owned = graphic.texture;
  const shared = new Texture({
    width: 4,
    height: 4,
    close: vi.fn(),
  } as unknown as ImageBitmap);
  graphic.view = undefined;
  graphic.texture = shared;
  await graphic.setInstructions(square(4, '#0000ff'));
  expect(graphic.texture).toBe(owned);
  expect(drawn(graphic)).toEqual(['#0000ff']);
  graphic.destroy();
  expect(shared.destroyed).toBe(false);
  shared.destroy();
});

// Last in the file: the released raster it leaves as the module's spare canvas is one of its
// own fakes, which earlier tests would otherwise draw into.
it('draws each update into the canvas that the previous raster released', async () => {
  class Surface {
    private size = [1, 1];
    readonly drawn: string[] = [];
    get width() {
      return this.size[0]!;
    }
    set width(value: number) {
      this.size[0] = value;
      this.drawn.length = 0;
    }
    get height() {
      return this.size[1]!;
    }
    set height(value: number) {
      this.size[1] = value;
      this.drawn.length = 0;
    }
    getContext() {
      const context = {
        fillStyle: '#000000',
        globalAlpha: 1,
        setTransform() {},
        fill: () => this.drawn.push(context.fillStyle),
        drawImage: (source: Surface) => this.drawn.push(...source.drawn),
      };
      return context;
    }
  }
  vi.stubGlobal('HTMLCanvasElement', Surface);
  const created: Surface[] = [];
  vi.stubGlobal('document', {
    createElement: () => {
      const surface = new Surface();
      created.push(surface);
      return surface;
    },
  });
  // Instruction validation also creates one colour-parsing canvas per call.
  const graphic = await Graphics2D.create(square(4, '#ff0000'));
  const first = (graphic.texture as { readonly image: unknown }).image;
  await graphic.setInstructions(square(6, '#00ff00'));
  await graphic.setInstructions(square(8, '#0000ff'));
  expect((graphic.texture as { readonly image: unknown }).image).toBe(first);
  expect(
    (
      (graphic.texture as { readonly image: unknown })
        .image as unknown as Surface
    ).drawn,
  ).toEqual(['#0000ff']);
  expect(created).toHaveLength(5);
  graphic.destroy();
});
