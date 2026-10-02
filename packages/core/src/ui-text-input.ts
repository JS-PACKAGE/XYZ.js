import { UIElement } from './ui-layout.js';
import type { UIWidgetOptions, UIRoot } from './ui.js';
import { Text2D } from './text2d.js';
import type { Text2DOptions, Text2DStyle } from './text2d.js';
import { BrowserTextLayout, textFont } from './text-layout.js';
import type { TextCaretPosition, TextSelectionRect } from './text-layout.js';
import type { TextCaretAffinity } from './text-graphemes.js';
import { graphemeBoundaries, snapGrapheme } from './text-graphemes.js';
import { textLayoutLimits } from '../../../src/data/text.js';
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

export interface UITextInputSelectionGeometry {
  /** Texture-local visual position; index is a UTF-16 grapheme boundary. */
  readonly caret: TextCaretPosition;
  readonly rectangles: readonly TextSelectionRect[];
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
  private readonly selections: Sprite[] = [];
  private caret?: Sprite;
  private measurement?: BrowserTextLayout;
  private measuredText?: string;
  private measuredStyle?: Text2DStyle;
  private activeAffinity: TextCaretAffinity = 'downstream';
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
      const hit = this.pointerPosition(detail.screen);
      this.dragStart = hit.index;
      this.setSelectionRange(hit.index, hit.index, 'none', hit.affinity);
    });
    this.addEventListener('pointermove', (event) => {
      if (this.dragStart === undefined) return;
      const hit = this.pointerPosition(
        (event as CustomEvent<PointerTargetEventDetail>).detail.screen,
      );
      const index = hit.index;
      this.setSelectionRange(
        Math.min(index, this.dragStart),
        Math.max(index, this.dragStart),
        index < this.dragStart ? 'backward' : 'forward',
        hit.affinity,
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
      field.selections.push(
        field.add(
          new Sprite({
            texture: field.background.texture,
            anchor: [0, 0],
            zIndex: 1,
          }),
        ),
      );
      field.selections[0]!.tint = [0.18, 0.48, 0.8, 1];
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
      field.graphic.zIndex = 2;
      field.caret = field.add(
        new Sprite({
          texture: field.background.texture,
          anchor: [0, 0],
          zIndex: 3,
        }),
      );
      field.caret.tint = [0.65, 0.9, 1, 1];
      field.measurement = new BrowserTextLayout();
      field.updateMeasurement();
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
    if (this.maxLength === undefined || line.length <= this.maxLength)
      return line;
    return line.slice(
      0,
      snapGrapheme(graphemeBoundaries(line), this.maxLength, 'upstream'),
    );
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

  async setTextStyle(style: Text2DOptions): Promise<void> {
    if (this.destroyed) throw new Error('Cannot update destroyed UITextInput.');
    await this.graphic?.setStyle({
      ...style,
      wrapWidth: undefined,
      align: 'left',
    });
    if (this.destroyed) return;
    this.updateMeasurement();
    if (this.native) this.configureNative(this.native);
    this.paintSelection();
  }

  async refreshFonts(): Promise<void> {
    if (this.destroyed) throw new Error('Cannot update destroyed UITextInput.');
    await this.graphic?.refreshFonts();
    if (this.destroyed) return;
    this.measuredStyle = undefined;
    this.updateMeasurement();
    this.paintSelection();
  }

  get selectionGeometry(): UITextInputSelectionGeometry {
    const line = this.graphic?.layout.lines[0];
    const active = this.direction === 'backward' ? this.start : this.end;
    const caret = this.measurement?.caret(active, this.activeAffinity) ?? {
      index: 0,
      x: 0,
      affinity: 'downstream' as const,
    };
    return Object.freeze({
      caret: Object.freeze({ ...caret, x: caret.x + (line?.x ?? 0) }),
      rectangles: Object.freeze(
        (this.measurement?.selection(this.start, this.end) ?? []).map((rect) =>
          Object.freeze({
            ...rect,
            x: rect.x + (line?.x ?? 0),
            y:
              rect.y +
              (line?.baseline ?? 0) -
              (this.measurement?.baseline ?? 0),
          }),
        ),
      ),
    });
  }

  private updateMeasurement(): void {
    if (
      !this.graphic ||
      !this.measurement ||
      this.graphic.text !== this.content
    )
      return;
    const style = this.graphic.style;
    if (this.measuredText === this.content && this.measuredStyle === style)
      return;
    this.measurement.setText(this.content, style);
    const width = this.graphic.layout.lines[0]?.width ?? 0;
    if (
      Math.abs(this.measurement.width - width) > textLayoutLimits.metricsEpsilon
    )
      throw new Error(
        'Native shaped selection metrics differ from Canvas font metrics; refresh fonts before editing.',
      );
    this.measuredText = this.content;
    this.measuredStyle = style;
  }

  private configureNative(input: HTMLInputElement): void {
    if (!this.graphic) return;
    const style = this.graphic.style;
    input.dir = style.direction;
    input.lang = style.locale;
    // The native element remains the editing/IME/accessibility surface only.
    input.style.font = textFont(style);
    input.style.letterSpacing = `${style.letterSpacing}px`;
    input.style.lineHeight = `${style.lineHeight}px`;
  }
  setSelectionRange(
    start: number,
    end: number,
    direction: 'forward' | 'backward' | 'none' = 'none',
    affinity: TextCaretAffinity = 'downstream',
  ): void {
    if (this.destroyed) throw new Error('Cannot select destroyed UITextInput.');
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      !['forward', 'backward', 'none'].includes(direction) ||
      !['upstream', 'downstream'].includes(affinity)
    )
      throw new RangeError('Invalid selection range.');
    this.end = Math.max(0, Math.min(end, this.content.length));
    this.start = Math.max(0, Math.min(start, this.end));
    this.direction = direction;
    this.activeAffinity = affinity;
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
    this.configureNative(input);
    if (this.maxLength !== undefined) input.maxLength = this.maxLength;
    input.disabled = this.effectiveDisabled;
    input.autocomplete = 'off';
    input.setSelectionRange(this.start, this.end, this.direction);
    const controller = (this.nativeController = new AbortController());
    const options = { signal: controller.signal };
    const selection = () => {
      if (this.native !== input) return;
      const changed =
        this.start !== input.selectionStart ||
        this.end !== input.selectionEnd ||
        this.direction !== input.selectionDirection;
      this.start = input.selectionStart ?? 0;
      this.end = input.selectionEnd ?? this.start;
      this.direction = input.selectionDirection ?? 'none';
      // Never rewrite native UTF-16 selections during composition. Visual
      // geometry expands/snap clusters without mutating the editing boundary.
      if (changed)
        this.activeAffinity =
          this.direction === 'backward' ? 'upstream' : 'downstream';
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
    if (!this.destroyed && revision === this.revision) {
      this.updateMeasurement();
      this.paintSelection();
    }
  }
  private pointerPosition(screen: Vector2): TextCaretPosition {
    this.toLocal(screen, this.point);
    const origin = this.graphic?.layout.lines[0]?.x ?? 0;
    const x = this.point.x - this.padding(3) + this.horizontalOffset - origin;
    return (
      this.measurement?.hitTest(x) ?? { index: 0, x: 0, affinity: 'downstream' }
    );
  }
  private paintSelection(): void {
    if (!this.graphic || !this.caret || !this.background) return;
    const geometry = this.selectionGeometry;
    const active = geometry.caret.x;
    const available = Math.max(
      0,
      this.layoutWidth - this.padding(3) - this.padding(1),
    );
    this.horizontalOffset = Math.max(
      0,
      Math.min(
        this.horizontalOffset,
        active,
        Math.max(0, Math.max(this.graphic.width, active + 2) - available),
      ),
    );
    if (active - this.horizontalOffset > available - 2)
      this.horizontalOffset = Math.max(0, active - available + 2);
    const y = Math.max(0, (this.layoutHeight - this.graphic.height) / 2);
    this.graphic.position.set(this.padding(3) - this.horizontalOffset, y);
    while (this.selections.length < geometry.rectangles.length) {
      const selection = this.add(
        new Sprite({
          texture: this.background.texture,
          anchor: [0, 0],
          zIndex: 1,
        }),
      );
      selection.tint = [0.18, 0.48, 0.8, 1];
      this.selections.push(selection);
    }
    const current = this.graphic.text === this.content;
    for (let i = 0; i < this.selections.length; i++) {
      const selection = this.selections[i]!,
        rect = geometry.rectangles[i];
      selection.visible =
        !!rect && current && this.focused && !this.effectiveDisabled;
      if (rect) {
        selection.position.set(
          this.padding(3) + rect.x - this.horizontalOffset,
          y + rect.y,
        );
        selection.scale.set(rect.width, rect.height);
      }
    }
    this.caret.position.set(
      this.padding(3) + active - this.horizontalOffset,
      y,
    );
    this.caret.scale.set(1, this.graphic.height);
    this.caret.visible = current && this.focused && !this.effectiveDisabled;
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
    this.measurement?.destroy();
    this.measurement = undefined;
    super.destroy();
  }
}
