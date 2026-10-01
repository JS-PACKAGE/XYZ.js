import { UIElement } from './ui-layout.js';
import type { UIWidgetOptions, UIRoot } from './ui.js';
import { Text2D } from './text2d.js';
import { Graphics2D } from './graphics2d/graphics2d.js';
import { GraphicsPath2D } from './graphics2d/graphics-path2d.js';
import { Sprite } from './sprite.js';
import { Mask2D } from './rendering2d/mask2d.js';
import { Vector2 } from '../../math/src/index.js';
import type { PointerTargetEventDetail } from './gameplay/pointer-router.js';
import { uiDefaults, uiLimits } from '../../../src/data/ui.js';

export interface UITextInputOptions extends UIWidgetOptions {
  readonly value?: string;
  readonly maxLength?: number;
}

/** Browser editing/IME owns the value; every visible pixel belongs to the canvas. */
export class UITextInput extends UIElement {
  readonly maxLength?: number;
  private content: string;
  private start = 0;
  private end = 0;
  private direction: 'forward' | 'backward' | 'none' = 'none';
  private composing = false;
  private focused = false;
  private native?: HTMLInputElement;
  private nativeController?: AbortController;
  private graphic?: Text2D;
  private background?: Graphics2D;
  private selection?: Sprite;
  private caret?: Sprite;
  private context?: CanvasRenderingContext2D;
  private horizontalOffset = 0;
  private revision = 0;
  private readonly point = new Vector2();
  private dragStart?: number;
  private constructor(options: UITextInputOptions) {
    super({
      width: uiDefaults.textInputWidth,
      height: uiDefaults.textInputHeight,
      padding: uiDefaults.textInputPadding,
      ...options.layout,
    });
    if (
      options.maxLength !== undefined &&
      (!Number.isSafeInteger(options.maxLength) ||
        options.maxLength < 0 ||
        options.maxLength > uiLimits.nativeMaxLength)
    )
      throw new RangeError(
        'maxLength must be a nonnegative native 32-bit integer.',
      );
    this.maxLength = options.maxLength;
    this.content = this.normalize(options.value ?? '');
    this.accessibility = {
      role: 'textbox',
      label: options.label ?? '',
      nativeInput: true,
      tabIndex: 0,
      disabled: options.disabled ?? false,
    };
    this.disabled = options.disabled ?? false;
    this.pointerEnabled = !this.disabled;
    this.interactiveChildren = false;
    this.cursor = 'text';
    this.eventPropagation = 'hierarchy';
    this.addEventListener('focus', () => {
      this.focused = true;
      this.root()?.focus.acceptNative(this);
      this.paintSelection();
    });
    this.addEventListener('blur', () => {
      this.focused = false;
      this.composing = false;
      this.dragStart = undefined;
      this.root()?.focus.blurNative(this);
      this.paintSelection();
    });
    this.addEventListener('semanticdetach', () => this.unbindNative());
    this.addEventListener('remove', () => this.unbindNative());
    this.addEventListener('pointerdown', (event) => {
      const detail = (event as CustomEvent<PointerTargetEventDetail>).detail;
      if (detail.button !== 0 || this.effectiveDisabled) return;
      this.root()?.focus.focus(this);
      const index = this.pointerIndex(detail.screen);
      this.dragStart = index;
      this.setSelectionRange(index, index);
    });
    this.addEventListener('pointermove', (event) => {
      if (this.dragStart === undefined) return;
      const index = this.pointerIndex(
        (event as CustomEvent<PointerTargetEventDetail>).detail.screen,
      );
      this.setSelectionRange(
        Math.min(index, this.dragStart),
        Math.max(index, this.dragStart),
        index < this.dragStart ? 'backward' : 'forward',
      );
    });
    for (const type of ['pointerup', 'pointerupoutside', 'pointercancel'])
      this.addEventListener(type, () => {
        this.dragStart = undefined;
      });
  }
  static async create(options: UITextInputOptions = {}): Promise<UITextInput> {
    const field = new UITextInput(options);
    try {
      field.background = field.add(
        await Graphics2D.create([
          {
            path: new GraphicsPath2D([
              { op: 'rect', x: 0, y: 0, width: 1, height: 1 },
            ]),
            fill: '#ffffff',
          },
        ]),
      );
      field.background.anchor.set(0, 0);
      field.selection = field.add(
        new Sprite({ texture: field.background.texture, anchor: [0, 0] }),
      );
      field.selection.tint = [0.18, 0.48, 0.8, 1];
      field.graphic = field.add(
        await Text2D.create(field.content, {
          fontSize: 18,
          color: '#ffffff',
          padding: 0,
          ...options.textStyle,
          wrapWidth: undefined,
          align: 'left',
        }),
      );
      field.graphic.anchor.set(0, 0);
      field.caret = field.add(
        new Sprite({ texture: field.background.texture, anchor: [0, 0] }),
      );
      field.caret.tint = [0.65, 0.9, 1, 1];
      const context = document.createElement('canvas').getContext('2d');
      if (!context)
        throw new Error('Canvas2D is required for text selection metrics.');
      field.context = context;
      const style = field.graphic.style;
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
      if ('letterSpacing' in context)
        context.letterSpacing = `${style.letterSpacing}px`;
      field.syncState();
      field.paintSelection();
      return field;
    } catch (error) {
      field.destroy();
      throw error;
    }
  }
  private root(): UIRoot | undefined {
    for (let parent = this.parent; parent; parent = parent.parent)
      if ('focus' in parent && 'synchronizeInputScope' in parent)
        return parent as UIRoot;
    return undefined;
  }
  private normalize(value: string): string {
    if (typeof value !== 'string')
      throw new TypeError('Text input value must be a string.');
    const line = value.replace(/[\r\n]/g, '');
    return this.maxLength === undefined ? line : line.slice(0, this.maxLength);
  }
  get value(): string {
    return this.content;
  }
  get selectionStart(): number {
    return this.start;
  }
  get selectionEnd(): number {
    return this.end;
  }
  get selectionDirection(): 'forward' | 'backward' | 'none' {
    return this.direction;
  }
  get isComposing(): boolean {
    return this.composing;
  }
  async setValue(value: string): Promise<void> {
    if (this.destroyed) throw new Error('Cannot update destroyed UITextInput.');
    this.content = this.normalize(value);
    this.start = Math.min(this.start, this.content.length);
    this.end = Math.min(this.end, this.content.length);
    if (this.native) {
      this.native.value = this.content;
      this.native.setSelectionRange(this.start, this.end, this.direction);
    }
    await this.refreshText();
  }
  setSelectionRange(
    start: number,
    end: number,
    direction: 'forward' | 'backward' | 'none' = 'none',
  ): void {
    if (this.destroyed) throw new Error('Cannot select destroyed UITextInput.');
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      !['forward', 'backward', 'none'].includes(direction)
    )
      throw new RangeError('Invalid selection range.');
    this.end = Math.max(0, Math.min(end, this.content.length));
    this.start = Math.max(0, Math.min(start, this.end));
    this.direction = direction;
    this.native?.setSelectionRange(this.start, this.end, direction);
    this.paintSelection();
  }
  /** @internal Called when the live semantic input is published. */
  bindNative(input: HTMLInputElement): void {
    if (input === this.native) {
      input.disabled = this.effectiveDisabled;
      return;
    }
    this.unbindNative();
    this.native = input;
    input.value = this.content;
    if (this.maxLength !== undefined) input.maxLength = this.maxLength;
    input.disabled = this.effectiveDisabled;
    input.autocomplete = 'off';
    input.setSelectionRange(this.start, this.end, this.direction);
    const controller = (this.nativeController = new AbortController());
    const options = { signal: controller.signal };
    const selection = () => {
      if (this.native !== input) return;
      this.start = input.selectionStart ?? 0;
      this.end = input.selectionEnd ?? this.start;
      this.direction = input.selectionDirection ?? 'none';
      this.paintSelection();
    };
    input.addEventListener(
      'input',
      (event) => {
        if (!this.root()?.isLive || this.effectiveDisabled) return;
        this.content = input.value;
        selection();
        void this.refreshText().catch((error: unknown) =>
          this.dispatchEvent(new CustomEvent('error', { detail: error })),
        );
        this.dispatchEvent(
          new CustomEvent('input', {
            detail: {
              value: this.content,
              isComposing: this.composing,
              originalEvent: event,
            },
          }),
        );
      },
      options,
    );
    input.addEventListener(
      'change',
      (event) => {
        if (this.root()?.isLive && !this.effectiveDisabled)
          this.dispatchEvent(
            new CustomEvent('change', {
              detail: { value: this.content, originalEvent: event },
            }),
          );
      },
      options,
    );
    for (const type of ['select', 'selectionchange', 'keyup', 'pointerup'])
      input.addEventListener(type, selection, options);
    input.ownerDocument.addEventListener(
      'selectionchange',
      () => {
        if (input.ownerDocument.activeElement === input) selection();
      },
      options,
    );
    for (const type of [
      'compositionstart',
      'compositionupdate',
      'compositionend',
    ])
      input.addEventListener(
        type,
        (event) => {
          if (!this.root()?.isLive) return;
          this.composing = type !== 'compositionend';
          selection();
          this.dispatchEvent(
            new CustomEvent(type, {
              detail: {
                data: (event as CompositionEvent).data,
                originalEvent: event,
              },
            }),
          );
        },
        options,
      );
  }
  /** @internal Teardown is immediate, including Game.pause before another frame. */
  unbindNative(): void {
    this.native?.blur();
    if (this.native) this.root()?.focus.blurNative(this);
    this.nativeController?.abort();
    this.nativeController = undefined;
    this.native = undefined;
    this.composing = this.focused = false;
    this.dragStart = undefined;
    this.paintSelection();
  }
  private async refreshText(): Promise<void> {
    const revision = ++this.revision;
    await this.graphic?.setText(this.content);
    if (!this.destroyed && revision === this.revision) this.paintSelection();
  }
  private advance(index: number): number {
    return this.context?.measureText(this.content.slice(0, index)).width ?? 0;
  }
  private pointerIndex(screen: Vector2): number {
    this.toLocal(screen, this.point);
    const x = this.point.x - this.padding(3) + this.horizontalOffset;
    let previous = 0;
    for (let i = 0; i < this.content.length;) {
      const next = i + (this.content.codePointAt(i)! > 0xffff ? 2 : 1);
      const width = this.advance(next);
      if (x < (previous + width) / 2) return i;
      previous = width;
      i = next;
    }
    return this.content.length;
  }
  private paintSelection(): void {
    if (!this.graphic || !this.caret || !this.selection) return;
    const left = this.advance(this.start),
      right = this.advance(this.end);
    const active = this.direction === 'backward' ? left : right;
    const available = Math.max(
      0,
      this.layoutWidth - this.padding(3) - this.padding(1),
    );
    this.horizontalOffset = Math.max(
      0,
      Math.min(this.horizontalOffset, active),
    );
    if (active - this.horizontalOffset > available - 2)
      this.horizontalOffset = Math.max(0, active - available + 2);
    const y = Math.max(0, (this.layoutHeight - this.graphic.height) / 2);
    this.graphic.position.set(this.padding(3) - this.horizontalOffset, y);
    this.selection.position.set(
      this.padding(3) + left - this.horizontalOffset,
      y,
    );
    this.selection.scale.set(right - left, this.graphic.height);
    this.selection.visible =
      this.focused && this.start !== this.end && !this.effectiveDisabled;
    this.caret.position.set(
      this.padding(3) + active - this.horizontalOffset,
      y,
    );
    this.caret.scale.set(1, this.graphic.height);
    this.caret.visible = this.focused && !this.effectiveDisabled;
  }
  protected override arranged(): void {
    this.background?.scale.set(this.layoutWidth, this.layoutHeight);
    if (
      this.layoutWidth > 0 &&
      this.layoutHeight > 0 &&
      (this.mask?.rect?.width !== this.layoutWidth ||
        this.mask?.rect?.height !== this.layoutHeight)
    )
      this.mask = Mask2D.rectangle({
        x: 0,
        y: 0,
        width: this.layoutWidth,
        height: this.layoutHeight,
      });
    this.paintSelection();
  }
  protected override stateChanged(): void {
    this.pointerEnabled = !this.effectiveDisabled;
    if (this.background)
      this.background.tint = this.effectiveDisabled
        ? [0.18, 0.19, 0.22, 1]
        : [0.16, 0.23, 0.34, 1];
    if (
      this.accessibility &&
      this.accessibility.disabled !== this.effectiveDisabled
    )
      this.accessibility = {
        ...this.accessibility,
        disabled: this.effectiveDisabled,
      };
    if (this.native) this.native.disabled = this.effectiveDisabled;
    this.paintSelection();
  }
  syncState(): void {
    this.stateChanged();
  }
  showFocus(focused: boolean): void {
    this.focused = focused;
    this.paintSelection();
  }
  activate(): void {
    this.root()?.focus.focus(this);
  }
  override detachParent(): void {
    this.unbindNative();
    super.detachParent();
  }
  override destroy(): void {
    if (this.destroyed) return;
    this.unbindNative();
    super.destroy();
  }
}
