import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UIElement,
  UIRoot,
  UIButton,
  UIScrollView,
  UIVirtualList,
} from '../packages/core/src/ui.js';
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

describe('retained scroll and keyed virtual rows', () => {
  it('clamps offsets on content shrink and reveals focused descendants through nested viewports', async () => {
    const root = new UIRoot();
    const scroll = root.add(
      new UIScrollView({ layout: { width: 120, height: 60 } }),
    );
    scroll.content.add(new UIElement({ width: 120, height: 100 }));
    const button = scroll.content.add(
      await UIButton.create('Last', { layout: { width: 120, height: 40 } }),
    );
    root.reflow(120, 60);
    scroll.scrollTo(0, 1000);
    expect(scroll.scrollY).toBe(80);
    scroll.scrollTo(0, 0);
    expect(root.focus.focus(button)).toBe(true);
    expect(scroll.scrollY).toBe(80);
    expect(scroll.mask?.containsPoint(new Vector2(10, 61))).toBe(false);
    scroll.content.remove(button);
    button.destroy();
    for (const child of scroll.content.children) child.destroy();
    root.reflow(120, 60);
    expect(scroll.scrollY).toBe(0);
    root.destroy();
  });
  it('materializes only viewport/overscan, reuses detached rows and preserves keyed identity through reorder', () => {
    const created: UIElement[] = [];
    const unbound: number[] = [];
    const bindings = new WeakMap<UIElement, number>();
    const list = new UIVirtualList({
      layout: { width: 100, height: 60 },
      rowHeight: 20,
      overscan: 1,
      items: Array.from({ length: 10000 }, (_, id) => id),
      key: (id) => id,
      createRow: () => {
        const row = new UIElement();
        created.push(row);
        return row;
      },
      bindRow: (row, id) => {
        bindings.set(row, id);
      },
      unbindRow: (_row, key) => {
        unbound.push(key as number);
      },
    });
    list.reflow(100, 60);
    expect(list.materializedCount).toBe(4);
    expect(
      Array.from(list.content.children, (row) =>
        bindings.get(row as UIElement),
      ),
    ).toEqual([0, 1, 2, 3]);
    const stable = list.row(2);
    list.setItems([
      1,
      0,
      2,
      ...Array.from({ length: 9997 }, (_, index) => index + 3),
    ]);
    expect(list.row(2)).toBe(stable);
    list.scrollTo(0, 10000);
    expect(list.materializedCount).toBe(5);
    expect(list.row(2)).toBeUndefined();
    expect(created.length).toBeLessThanOrEqual(5);
    expect(unbound).toContain(2);
    expect(
      Array.from(list.content.children).every(
        (row) => row.parent === list.content,
      ),
    ).toBe(true);
    expect(() => list.setItems([1, 1])).toThrow(TypeError);
    expect(list.contentHeight).toBe(200000);
    list.destroy();
    expect(created.every((row) => row.destroyed)).toBe(true);
  });
  it('focuses an unmounted key, traverses across row windows, retains focused identity and cleans removed focus', async () => {
    const root = new UIRoot();
    const prepared = await Promise.all(
      Array.from({ length: 8 }, () => UIButton.create('Row')),
    );
    const list = root.add(
      new UIVirtualList({
        layout: { width: 100, height: 40 },
        rowHeight: 20,
        overscan: 0,
        items: Array.from({ length: 100 }, (_, id) => id),
        key: (id) => id,
        createRow: () => prepared.pop()!,
        bindRow: (row, id) => {
          row.accessibility = { ...row.accessibility!, label: String(id) };
        },
      }),
    );
    root.reflow(100, 40);
    expect(list.row(90)).toBeUndefined();
    expect(list.focusKey(90)).toBe(true);
    const focused = list.row(90);
    expect(root.focus.focused).toBe(focused);
    expect(list.scrollY).toBe(1780);
    root.focus.move(1);
    expect(root.focus.focused).toBe(list.row(91));
    const held = list.row(91);
    list.setItems(Array.from({ length: 100 }, (_, index) => 99 - index));
    root.reflow(100, 40);
    expect(list.row(91)).toBe(held);
    expect(root.focus.focused).toBe(held);
    expect(list.scrollY).toBe(160);
    expect(held!.position.y - list.scrollY).toBe(0);
    list.scrollTo(0, 0);
    expect(root.focus.focused).toBe(list.row(91));
    expect(list.materializedCount).toBeLessThanOrEqual(3);
    list.setItems([0, 1, 2]);
    expect(root.focus.focused).toBeUndefined();
    root.destroy();
    for (const row of prepared) row.destroy();
  });
  it('wheel scrolling yields to outer viewports at a clamped boundary', () => {
    const scroll = new UIScrollView({ layout: { width: 80, height: 40 } });
    scroll.content.add(new UIElement({ height: 100, width: 80 }));
    scroll.reflow(80, 40);
    const preventDefault = vi.fn();
    scroll.dispatchEvent(
      new CustomEvent('wheel', {
        detail: {
          deltaX: 0,
          deltaY: 30,
          originalEvent: { deltaMode: 0 },
          preventDefault,
        },
      }),
    );
    expect(scroll.scrollY).toBe(30);
    expect(preventDefault).toHaveBeenCalledOnce();
    scroll.scrollTo(0, 60);
    scroll.dispatchEvent(
      new CustomEvent('wheel', {
        detail: { deltaX: 0, deltaY: 30, preventDefault },
      }),
    );
    expect(preventDefault).toHaveBeenCalledOnce();
    scroll.destroy();
  });
});
