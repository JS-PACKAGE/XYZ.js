import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UIElement,
  UIRoot,
  UIButton,
  UICheckbox,
  UISlider,
} from '../packages/core/src/ui.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Vector2 } from '../packages/math/src/index.js';

beforeEach(() => {
  vi.stubGlobal(
    'Path2D',
    class {
      rect() {}
    },
  );
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 1,
      height: 1,
      getContext: () => ({
        fillStyle: '#000000',
        measureText: (text: string) => ({
          width: text.length * 10,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: text.length * 10,
          actualBoundingBoxAscent: 18,
          actualBoundingBoxDescent: 4,
        }),
        scale() {},
        setTransform() {},
        fill() {},
        fillText() {},
      }),
    }),
  });
  vi.stubGlobal(
    'createImageBitmap',
    async (source: { width: number; height: number }) => ({
      width: source.width,
      height: source.height,
      close: vi.fn(),
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('retained UI layout boundaries', () => {
  it('redistributes fill space after minimum and maximum constraints with nested padding', () => {
    const root = new UIRoot(undefined, {
      direction: 'column',
      padding: 10,
      gap: 5,
      align: 'stretch',
    });
    const row = root.add(
      new UIElement({ direction: 'row', height: 50, gap: 5, padding: 5 }),
    );
    const minimum = row.add(
      new UIElement({ width: 'fill', minWidth: 80, height: 'fill' }),
    );
    const maximum = row.add(
      new UIElement({ width: 'fill', maxWidth: 30, height: 'fill' }),
    );
    const remainder = root.add(
      new UIElement({ width: 'fill', height: 'fill', minHeight: 20 }),
    );
    root.reflow(135, 200);
    expect([row.layoutWidth, row.layoutHeight]).toEqual([115, 50]);
    expect([minimum.layoutWidth, maximum.layoutWidth]).toEqual([80, 20]);
    expect([
      minimum.position.x,
      maximum.position.x,
      minimum.layoutHeight,
    ]).toEqual([5, 90, 40]);
    expect([remainder.position.y, remainder.layoutHeight]).toEqual([65, 125]);
    root.reflow(245, 150);
    expect([minimum.layoutWidth, maximum.layoutWidth]).toEqual([180, 30]);
    expect(remainder.layoutHeight).toBe(75);
    root.destroy();
  });
  it('measures auto containers, excludes hidden nodes and retains correct overlay alignment', () => {
    const root = new UIRoot(undefined, {
      direction: 'row',
      gap: 8,
      justify: 'space-between',
      align: 'center',
    });
    const automatic = root.add(
      new UIElement({ direction: 'column', padding: [2, 3, 4, 5], gap: 6 }),
    );
    const first = automatic.add(new UIElement({ width: 20, height: 10 }));
    const second = automatic.add(new UIElement({ width: 40, height: 20 }));
    const overlay = root.add(
      new UIElement({
        direction: 'overlay',
        width: 60,
        height: 40,
        align: 'end',
        justify: 'end',
        padding: 5,
      }),
    );
    const floating = overlay.add(new UIElement({ width: 15, height: 10 }));
    root.reflow(200, 100);
    expect([automatic.layoutWidth, automatic.layoutHeight]).toEqual([48, 42]);
    expect([first.position.x, second.position.y]).toEqual([5, 18]);
    expect([
      automatic.position.y,
      overlay.position.x,
      overlay.position.y,
    ]).toEqual([29, 140, 30]);
    expect([floating.position.x, floating.position.y]).toEqual([40, 25]);
    second.setVisible(false);
    root.reflow(200, 100);
    expect([automatic.layoutWidth, automatic.layoutHeight]).toEqual([28, 16]);
    root.destroy();
  });
  it('rejects invalid sizing atomically and keeps minimum overflow explicit', () => {
    const element = new UIElement({ width: 50, minHeight: 30 });
    expect(() => element.setLayout({ minWidth: 80, maxWidth: 20 })).toThrow(
      RangeError,
    );
    element.reflow(100, 10);
    expect([element.layoutWidth, element.layoutHeight]).toEqual([50, 30]);
    expect(() => element.setLayout({ padding: NaN })).toThrow(RangeError);
    expect(element.layout.width).toBe(50);
    element.destroy();
  });
});

describe('UI focus and widget transitions', () => {
  it('cycles ordered eligible nodes, traps modal focus and restores the prior generation', async () => {
    const root = new UIRoot(undefined, { direction: 'column', gap: 4 });
    const first = root.add(await UIButton.create('First'));
    const disabled = root.add(
      await UIButton.create('Disabled', { disabled: true }),
    );
    const hidden = root.add(await UIButton.create('Hidden'));
    hidden.setVisible(false);
    const modal = root.add(new UIElement({ direction: 'column' }));
    const checkbox = modal.add(await UICheckbox.create('Choice'));
    const slider = modal.add(await UISlider.create('Volume'));
    root.reflow(300, 300);
    expect(root.focus.move(1)).toBe(true);
    expect(root.focus.focused).toBe(first);
    root.focus.move(1);
    expect(root.focus.focused).toBe(checkbox);
    root.focus.focus(first);
    root.focus.pushModal(modal);
    expect(root.focus.focused).toBe(checkbox);
    root.focus.move(-1);
    expect(root.focus.focused).toBe(slider);
    expect(root.focus.focus(first)).toBe(false);
    root.focus.popModal();
    expect(root.focus.focused).toBe(first);
    root.focus.pushModal(modal);
    checkbox.disabled = true;
    root.focus.synchronize();
    expect(root.focus.focused).toBe(slider);
    slider.destroy();
    root.focus.synchronize();
    expect(root.focus.focused).toBeUndefined();
    root.focus.popModal();
    expect(root.focus.focused).toBe(first);
    expect(root.focus.focus(disabled)).toBe(false);
    expect(root.focus.focus(hidden)).toBe(false);
    root.destroy();
  });
  it('does not restore removed and re-added focus targets from an old ownership generation', async () => {
    const scene = new Scene();
    const root = scene.add(new UIRoot());
    const first = root.add(await UIButton.create('First'));
    const second = root.add(await UIButton.create('Second'));
    const modal = root.add(new UIElement());
    modal.add(await UIButton.create('Close'));
    root.reflow(300, 300);
    root.focus.focus(first);
    root.focus.pushModal(modal);
    root.remove(first);
    root.add(first);
    root.focus.popModal();
    expect(root.focus.focused).toBe(second);
    scene.destroy();
  });
  it('toggles checkboxes and clamps slider pointer and device increments without disabled activation', async () => {
    const root = new UIRoot(undefined, { direction: 'column' });
    const checkbox = root.add(await UICheckbox.create('Enabled'));
    const slider = root.add(
      await UISlider.create('Level', { min: 10, max: 20, step: 2, value: 12 }),
    );
    const changes: number[] = [];
    slider.addEventListener('change', (event) =>
      changes.push((event as CustomEvent<number>).detail),
    );
    root.reflow(300, 200);
    checkbox.activate();
    expect(checkbox.checked).toBe(true);
    checkbox.disabled = true;
    checkbox.activate();
    expect(checkbox.checked).toBe(true);
    slider.increment(-1);
    slider.increment(-1);
    expect(slider.value).toBe(10);
    slider.dispatchEvent(
      new CustomEvent('pointerdown', {
        detail: { button: 0, screen: slider.toWorld(new Vector2(500, 20)) },
      }),
    );
    expect(slider.value).toBe(20);
    slider.dispatchEvent(
      new CustomEvent('pointermove', {
        detail: { screen: slider.toWorld(new Vector2(-10, 20)) },
      }),
    );
    expect(slider.value).toBe(10);
    slider.dispatchEvent(new CustomEvent('pointercancel'));
    slider.dispatchEvent(
      new CustomEvent('pointermove', {
        detail: { screen: slider.toWorld(new Vector2(500, 20)) },
      }),
    );
    expect(slider.value).toBe(10);
    slider.disabled = true;
    slider.increment(1);
    slider.activate();
    expect(slider.value).toBe(10);
    expect(changes).toEqual([10, 20, 10]);
    expect(() => {
      slider.value = NaN;
    }).toThrow(RangeError);
    root.destroy();
  });
  it('releases owned visuals and pending text rasters on recursive destruction', async () => {
    const root = new UIRoot();
    const checkbox = root.add(await UICheckbox.create('Before'));
    const sprites: Sprite[] = [];
    const collect = (object: GameObject): void => {
      if (object instanceof Sprite) sprites.push(object);
      for (const child of object.children) collect(child);
    };
    collect(root);
    let resolve!: (bitmap: ImageBitmap) => void;
    vi.stubGlobal(
      'createImageBitmap',
      () =>
        new Promise<ImageBitmap>((done) => {
          resolve = done;
        }),
    );
    const pending = checkbox.setText('After');
    root.destroy();
    const close = vi.fn();
    resolve({ width: 50, height: 22, close } as unknown as ImageBitmap);
    await pending;
    expect(checkbox.destroyed).toBe(true);
    expect(
      sprites.every((sprite) => sprite.destroyed && sprite.texture.destroyed),
    ).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    expect(root.focus.focused).toBeUndefined();
  });
});
