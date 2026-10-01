import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UITextInput,
  UIRoot,
  UIElement,
  UIButton,
} from '../packages/core/src/ui.js';

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

class NativeInput extends EventTarget {
  value = '';
  disabled = false;
  maxLength = -1;
  autocomplete = '';
  selectionStart = 0;
  selectionEnd = 0;
  selectionDirection: 'forward' | 'backward' | 'none' = 'none';
  ownerDocument = Object.assign(new EventTarget(), { activeElement: this });
  setSelectionRange(
    start: number,
    end: number,
    direction: 'forward' | 'backward' | 'none',
  ) {
    this.selectionStart = start;
    this.selectionEnd = end;
    this.selectionDirection = direction;
  }
  blur() {}
}

describe('canvas text input/native editing boundary', () => {
  it('preserves UTF-16 selection, normalizes single-line values and applies maxLength', async () => {
    const field = await UITextInput.create({
      value: 'a😀b\r\nc',
      maxLength: 5,
    });
    expect(field.value).toBe('a😀bc');
    field.setSelectionRange(1, 3, 'backward');
    expect([
      field.selectionStart,
      field.selectionEnd,
      field.selectionDirection,
    ]).toEqual([1, 3, 'backward']);
    await field.setValue('x');
    expect([field.value, field.selectionStart, field.selectionEnd]).toEqual([
      'x',
      1,
      1,
    ]);
    expect(() => field.setSelectionRange(NaN, 1)).toThrow(RangeError);
    field.destroy();
    await expect(field.setValue('late')).rejects.toThrow();
  });
  it('cancels composition and rejects stale native editing after detach/removal', async () => {
    const root = new UIRoot();
    vi.spyOn(root, 'isLive', 'get').mockReturnValue(true);
    const field = root.add(await UITextInput.create({ maxLength: 8 }));
    root.reflow(240, 80);
    const native = new NativeInput();
    field.bindNative(native as unknown as HTMLInputElement);
    native.dispatchEvent(
      Object.assign(new Event('compositionstart'), { data: '' }),
    );
    native.value = '語';
    native.setSelectionRange(1, 1, 'none');
    native.dispatchEvent(new Event('input'));
    expect(field.isComposing).toBe(true);
    native.dispatchEvent(
      Object.assign(new Event('compositionend'), { data: '語' }),
    );
    native.dispatchEvent(new Event('input'));
    expect(field.isComposing).toBe(false);
    native.dispatchEvent(new Event('compositionstart'));
    expect(field.isComposing).toBe(true);
    field.dispatchEvent(new CustomEvent('semanticdetach'));
    native.value = 'late';
    native.dispatchEvent(new Event('input'));
    expect(field.value).toBe('語');
    expect(field.isComposing).toBe(false);
    field.bindNative(native as unknown as HTMLInputElement);
    native.dispatchEvent(new Event('compositionstart'));
    expect(field.isComposing).toBe(true);
    root.remove(field);
    native.value = 'removed';
    native.dispatchEvent(new Event('input'));
    expect(field.value).toBe('語');
    expect(field.isComposing).toBe(false);
    field.destroy();
    root.destroy();
  });
  it('joins ordered root traversal and modal trapping without button activation', async () => {
    const root = new UIRoot();
    const field = root.add(await UITextInput.create({ value: 'name' }));
    const modal = root.add(new UIElement());
    const close = modal.add(await UIButton.create('Close'));
    root.reflow(300, 180);
    root.focus.move(1);
    expect(root.focus.focused).toBe(field);
    root.focus.pushModal(modal);
    expect(root.focus.focused).toBe(close);
    expect(root.focus.focus(field)).toBe(false);
    root.focus.popModal();
    expect(root.focus.focused).toBe(field);
    root.destroy();
    expect(root.focus.focused).toBeUndefined();
  });
});
