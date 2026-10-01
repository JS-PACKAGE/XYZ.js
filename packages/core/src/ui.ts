import type { Game } from './game.js';
import { GameObject } from './game-object.js';
import { UIElement } from './ui-layout.js';
import type { UILayout } from './ui-layout.js';
import { Text2D } from './text2d.js';
import type { Text2DOptions } from './text2d.js';
import { Sprite } from './sprite.js';
import { Graphics2D } from './graphics2d/graphics2d.js';
import { GraphicsPath2D } from './graphics2d/graphics-path2d.js';
import type { PointerTargetEventDetail } from './gameplay/pointer-router.js';
import type { InputContext } from '../../input/src/index.js';
import { Vector2 } from '../../math/src/index.js';
import { UITextInput } from './ui-text-input.js';
export { UITextInput } from './ui-text-input.js';
export type { UITextInputOptions } from './ui-text-input.js';
import { UIScrollView, UIVirtualList } from './ui-scroll.js';
export { UIScrollView, UIVirtualList } from './ui-scroll.js';
export type {
  UIScrollViewOptions,
  UIVirtualListOptions,
  UIVirtualListKey,
} from './ui-scroll.js';
export { UIElement } from './ui-layout.js';
export type { UILayout, UIDimension } from './ui-layout.js';

export interface UIWidgetOptions {
  readonly layout?: UILayout;
  readonly label?: string;
  readonly textStyle?: Text2DOptions;
  readonly disabled?: boolean;
}
export interface UICheckboxOptions extends UIWidgetOptions {
  readonly checked?: boolean;
}
export interface UISliderOptions extends UIWidgetOptions {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly value?: number;
}
async function square(): Promise<Graphics2D> {
  const graphic = await Graphics2D.create([
    {
      path: new GraphicsPath2D([
        { op: 'rect', x: 0, y: 0, width: 1, height: 1 },
      ]),
      fill: '#ffffff',
    },
  ]);
  graphic.anchor.set(0, 0);
  return graphic;
}
function rootOf(node: GameObject): UIRoot | undefined {
  for (
    let current: GameObject | undefined = node;
    current;
    current = current.parent
  )
    if (current instanceof UIRoot) return current;
  return undefined;
}

export class UILabel extends UIElement {
  protected textGraphic?: Text2D;
  protected constructor(options: UIWidgetOptions) {
    super(options.layout);
  }
  static async create(
    text: string,
    options: UIWidgetOptions = {},
  ): Promise<UILabel> {
    const label = new UILabel(options);
    try {
      await label.createText(text, options);
      return label;
    } catch (error) {
      label.destroy();
      throw error;
    }
  }
  protected async createText(
    text: string,
    options: UIWidgetOptions,
  ): Promise<void> {
    const graphic = await Text2D.create(text, {
      fontSize: 18,
      color: '#ffffff',
      padding: 0,
      ...options.textStyle,
    });
    if (this.destroyed) {
      graphic.destroy();
      return;
    }
    graphic.anchor.set(0, 0);
    this.textGraphic = this.add(graphic);
    this.intrinsicWidth = graphic.width;
    this.intrinsicHeight = graphic.height;
    this.invalidateLayout();
  }
  get text(): string {
    return this.textGraphic?.text ?? '';
  }
  async setText(text: string): Promise<void> {
    if (!this.textGraphic || this.destroyed)
      throw new Error('Cannot update an unavailable UILabel.');
    await this.textGraphic.setText(text);
    if (this.destroyed) return;
    this.intrinsicWidth = this.textGraphic.width;
    this.intrinsicHeight = this.textGraphic.height;
    this.invalidateLayout();
  }
  protected override arranged(): void {
    this.textGraphic?.position.set(this.padding(3), this.padding(0));
  }
}

/** Canvas visuals share the ordinary sprite pipeline on every backend. */
abstract class UIControl extends UIElement {
  protected textGraphic?: Text2D;
  protected background?: Graphics2D;
  private readonly focusEdges: Sprite[] = [];
  private hovered = false;
  private down = false;
  private nativeDown = false;
  private contextDown = false;
  private focused = false;
  private paintedState = -1;
  protected textInset = 0;
  private textRevision = 0;
  protected constructor(role: string, label: string, options: UIWidgetOptions) {
    super({ width: 'auto', height: 40, padding: 10, ...options.layout });
    this.pointerEnabled = true;
    this.interactiveChildren = false;
    this.cursor = 'pointer';
    this.eventPropagation = 'hierarchy';
    this.accessibility = {
      role,
      label,
      tabIndex: 0,
      disabled: options.disabled ?? false,
    };
    this.disabled = options.disabled ?? false;
    this.addEventListener('focus', () => {
      this.focused = true;
      rootOf(this)?.focus.acceptNative(this);
      this.stateChanged();
    });
    this.addEventListener('blur', () => {
      this.focused = this.down = this.nativeDown = this.contextDown = false;
      rootOf(this)?.focus.blurNative(this);
      this.stateChanged();
    });
    this.addEventListener('activate', () => this.activate());
    this.addEventListener('pointerenter', () => {
      this.hovered = true;
      this.stateChanged();
    });
    this.addEventListener('pointerleave', () => {
      this.hovered = false;
      this.stateChanged();
    });
    this.addEventListener('pointerdown', (event) => {
      const detail = (event as CustomEvent<PointerTargetEventDetail>).detail;
      if (!this.canActivate() || detail.button !== 0) return;
      this.down = true;
      rootOf(this)?.focus.focus(this);
      this.pointerValue(detail);
      this.stateChanged();
    });
    this.addEventListener('pointermove', (event) => {
      if (this.down && !this.effectiveDisabled)
        this.pointerValue(
          (event as CustomEvent<PointerTargetEventDetail>).detail,
        );
    });
    for (const type of ['pointerup', 'pointerupoutside', 'pointercancel'])
      this.addEventListener(type, () => {
        this.down = false;
        this.stateChanged();
      });
    this.addEventListener('pointertap', () => {
      if (!(this instanceof UISlider)) this.activate();
    });
    this.addEventListener('remove', () => {
      this.focused =
        this.down =
        this.nativeDown =
        this.contextDown =
        this.hovered =
          false;
      this.stateChanged();
    });
  }
  protected async initializeVisuals(
    text: string,
    options: UIWidgetOptions,
  ): Promise<void> {
    try {
      this.background = this.add(await square());
      for (let i = 0; i < 4; i++) this.focusEdges.push(this.createShape());
      this.textGraphic = this.add(
        await Text2D.create(text, {
          fontSize: 18,
          color: '#ffffff',
          padding: 0,
          ...options.textStyle,
        }),
      );
      this.textGraphic.anchor.set(0, 0);
      this.intrinsicWidth = this.textGraphic.width + this.textInset;
      this.intrinsicHeight = this.textGraphic.height;
      this.paintedState = -1;
      this.stateChanged();
      this.invalidateLayout();
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  protected createShape(): Sprite {
    if (!this.background || this.destroyed)
      throw new Error('UI visual resource is unavailable.');
    return this.add(
      new Sprite({ texture: this.background.texture, anchor: [0, 0] }),
    );
  }
  get text(): string {
    return this.textGraphic?.text ?? '';
  }
  async setText(text: string): Promise<void> {
    if (!this.textGraphic || this.destroyed)
      throw new Error('Cannot update an unavailable UI control.');
    const revision = ++this.textRevision;
    await this.textGraphic.setText(text);
    if (this.destroyed || revision !== this.textRevision) return;
    this.intrinsicWidth = this.textGraphic.width + this.textInset;
    this.intrinsicHeight = this.textGraphic.height;
    if (this.accessibility)
      this.accessibility = { ...this.accessibility, label: text };
    this.invalidateLayout();
  }
  protected override arranged(): void {
    this.background?.scale.set(this.layoutWidth, this.layoutHeight);
    const w = this.layoutWidth,
      h = this.layoutHeight,
      t = Math.min(2, w / 2, h / 2);
    for (let i = 0; i < this.focusEdges.length; i++) {
      const edge = this.focusEdges[i];
      edge.position.set(i === 3 ? w - t : 0, i === 1 ? h - t : 0);
      edge.scale.set(i < 2 ? w : t, i < 2 ? t : h);
    }
    this.textGraphic?.position.set(
      this.padding(3),
      Math.max(0, (h - (this.textGraphic?.height ?? 0)) / 2),
    );
    this.stateChanged();
  }
  protected override stateChanged(): void {
    const disabled = this.effectiveDisabled;
    if (disabled)
      this.down = this.nativeDown = this.contextDown = this.hovered = false;
    const pressed = this.down || this.nativeDown || this.contextDown;
    const state =
      Number(disabled) |
      (Number(pressed) << 1) |
      (Number(this.hovered) << 2) |
      (Number(this.focused) << 3);
    if (state === this.paintedState) return;
    this.paintedState = state;
    this.pointerEnabled = !disabled;
    if (this.accessibility && this.accessibility.disabled !== disabled)
      this.accessibility = { ...this.accessibility, disabled };
    if (this.background)
      this.background.tint = disabled
        ? [0.18, 0.19, 0.22, 1]
        : pressed
          ? [0.12, 0.28, 0.48, 1]
          : this.hovered
            ? [0.24, 0.4, 0.6, 1]
            : [0.16, 0.23, 0.34, 1];
    if (this.textGraphic) this.textGraphic.opacity = disabled ? 0.45 : 1;
    for (const edge of this.focusEdges) {
      edge.visible = this.focused && !disabled;
      edge.tint = [0.35, 0.78, 1, 1];
    }
  }
  /** @internal Synchronizes inherited disabled state without rerasterizing. */
  syncState(): void {
    this.stateChanged();
  }
  /** @internal Detached focus supports deterministic authoring; mounted roots use native focus. */
  showFocus(focused: boolean): void {
    this.focused = focused;
    if (!focused) this.nativeDown = this.contextDown = false;
    this.stateChanged();
  }
  /** @internal Native and polled sources keep independent held states. */
  showPressed(pressed: boolean, source: 'native' | 'context'): void {
    if (source === 'native') this.nativeDown = pressed;
    else this.contextDown = pressed;
    this.stateChanged();
  }
  protected canActivate(): boolean {
    if (this.destroyed || !this.worldVisible || this.effectiveDisabled)
      return false;
    const modal = rootOf(this)?.focus.modal;
    if (!modal) return true;
    if (this === modal) return true;
    for (let node = this.parent; node; node = node.parent)
      if (node === modal) return true;
    return false;
  }
  protected pointerValue(detail: PointerTargetEventDetail): void {
    void detail;
  }
  abstract activate(): void;
}

export class UIButton extends UIControl {
  private constructor(text: string, options: UIWidgetOptions) {
    super('button', options.label ?? text, options);
  }
  static async create(
    text: string,
    options: UIWidgetOptions = {},
  ): Promise<UIButton> {
    const button = new UIButton(text, options);
    await button.initializeVisuals(text, options);
    return button;
  }
  activate(): void {
    if (this.canActivate()) this.dispatchEvent(new CustomEvent('click'));
  }
}

export class UICheckbox extends UIControl {
  private selected = false;
  private mark?: Sprite;
  private box?: Sprite;
  private constructor(text: string, options: UICheckboxOptions) {
    super('checkbox', options.label ?? text, options);
    this.selected = options.checked ?? false;
    this.textInset = 26;
  }
  static async create(
    text: string,
    options: UICheckboxOptions = {},
  ): Promise<UICheckbox> {
    const checkbox = new UICheckbox(text, options);
    try {
      await checkbox.initializeVisuals(text, options);
      checkbox.box = checkbox.createShape();
      checkbox.box.tint = [0.4, 0.48, 0.58, 1];
      checkbox.mark = checkbox.createShape();
      checkbox.mark.tint = [0.35, 0.9, 0.65, 1];
      checkbox.stateChanged();
      return checkbox;
    } catch (error) {
      checkbox.destroy();
      throw error;
    }
  }
  get checked(): boolean {
    return this.selected;
  }
  set checked(value: boolean) {
    if (this.destroyed) throw new Error('Cannot update a destroyed checkbox.');
    if (value === this.selected) return;
    this.selected = value;
    this.stateChanged();
    this.dispatchEvent(new CustomEvent('change', { detail: value }));
  }
  activate(): void {
    if (this.canActivate()) this.checked = !this.checked;
  }
  protected override arranged(): void {
    super.arranged();
    this.textGraphic?.position.set(
      this.padding(3) + 26,
      Math.max(0, (this.layoutHeight - (this.textGraphic?.height ?? 0)) / 2),
    );
    const y = Math.max(0, (this.layoutHeight - 16) / 2);
    this.box?.position.set(this.padding(3), y);
    this.box?.scale.set(16, 16);
    this.mark?.position.set(this.padding(3) + 2, y + 2);
    this.mark?.scale.set(12, 12);
  }
  protected override stateChanged(): void {
    super.stateChanged();
    if (this.mark) {
      this.mark.visible = this.selected;
      this.mark.opacity = this.effectiveDisabled ? 0.45 : 1;
    }
  }
}

export class UISlider extends UIControl {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  private amount: number;
  private track?: Sprite;
  private thumb?: Sprite;
  private readonly point = new Vector2();
  private constructor(label: string, options: UISliderOptions) {
    super('slider', options.label ?? label, {
      ...options,
      layout: { width: 220, height: 64, ...options.layout },
    });
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
    this.step = options.step ?? 0.1;
    if (
      !Number.isFinite(this.min) ||
      !Number.isFinite(this.max) ||
      this.max <= this.min ||
      !Number.isFinite(this.max - this.min) ||
      !Number.isFinite(this.step) ||
      this.step <= 0 ||
      !Number.isFinite((this.max - this.min) / this.step)
    )
      throw new RangeError(
        'Slider requires a finite increasing range and positive step.',
      );
    if (!Number.isFinite(options.value ?? this.min))
      throw new RangeError('Slider value must be finite.');
    this.amount = Math.min(
      this.max,
      Math.max(this.min, options.value ?? this.min),
    );
  }
  static async create(
    label: string,
    options: UISliderOptions = {},
  ): Promise<UISlider> {
    const slider = new UISlider(label, options);
    try {
      await slider.initializeVisuals(label, options);
      slider.track = slider.createShape();
      slider.track.tint = [0.35, 0.43, 0.55, 1];
      slider.thumb = slider.createShape();
      slider.thumb.tint = [0.35, 0.9, 0.65, 1];
      return slider;
    } catch (error) {
      slider.destroy();
      throw error;
    }
  }
  get value(): number {
    return this.amount;
  }
  set value(value: number) {
    if (this.destroyed) throw new Error('Cannot update a destroyed slider.');
    if (!Number.isFinite(value))
      throw new RangeError('Slider value must be finite.');
    const next = Math.min(this.max, Math.max(this.min, value));
    if (next === this.amount) return;
    this.amount = next;
    this.positionThumb();
    this.dispatchEvent(new CustomEvent('change', { detail: next }));
  }
  increment(direction: number): void {
    if (!this.canActivate()) return;
    this.value += direction * this.step;
  }
  activate(): void {
    this.increment(1);
  }
  protected override pointerValue(detail: PointerTargetEventDetail): void {
    this.toLocal(detail.screen, this.point);
    const width = Math.max(
      0,
      this.layoutWidth - this.padding(3) - this.padding(1) - 12,
    );
    if (width <= 0) return;
    const value =
      this.min +
      Math.min(1, Math.max(0, (this.point.x - this.padding(3) - 6) / width)) *
        (this.max - this.min);
    this.value =
      Math.round((value - this.min) / this.step) * this.step + this.min;
  }
  protected override arranged(): void {
    super.arranged();
    this.textGraphic?.position.set(this.padding(3), this.padding(0));
    const width = Math.max(
      0,
      this.layoutWidth - this.padding(3) - this.padding(1) - 12,
    );
    this.track?.position.set(
      this.padding(3) + 6,
      Math.max(0, this.layoutHeight - this.padding(2) - 8),
    );
    this.track?.scale.set(width, 4);
    this.positionThumb();
  }
  private positionThumb(): void {
    const width = Math.max(
      0,
      this.layoutWidth - this.padding(3) - this.padding(1) - 12,
    );
    this.thumb?.position.set(
      this.padding(3) +
        (width * (this.amount - this.min)) / (this.max - this.min),
      Math.max(0, this.layoutHeight - this.padding(2) - 12),
    );
    this.thumb?.scale.set(12, 12);
  }
}

type Focusable = UIButton | UICheckbox | UISlider | UITextInput;
interface ModalEntry {
  container: UIElement;
  previous?: Focusable;
  generation?: number;
}
export class UIFocusManager {
  private current?: Focusable;
  private currentGeneration = 0;
  private requested?: Focusable;
  private requestedGeneration?: number;
  private readonly modals: ModalEntry[] = [];
  constructor(private readonly root: UIRoot) {}
  get focused(): Focusable | undefined {
    return this.current;
  }
  get modal(): UIElement | undefined {
    return this.modals[this.modals.length - 1]?.container;
  }
  private eligible(node: Focusable): boolean {
    if (
      node.destroyed ||
      !node.worldVisible ||
      node.effectiveDisabled ||
      node.layoutWidth <= 0 ||
      node.layoutHeight <= 0
    )
      return false;
    if (
      this.root.scene &&
      (node.scene !== this.root.scene || !this.root.scene.has(node))
    )
      return false;
    for (
      let parent: GameObject | undefined = node;
      parent;
      parent = parent.parent
    )
      if (parent === (this.modal ?? this.root))
        return rootOf(node) === this.root;
    return false;
  }
  private collect(node: GameObject, out: Focusable[]): void {
    if (
      node instanceof UIButton ||
      node instanceof UICheckbox ||
      node instanceof UISlider ||
      node instanceof UITextInput
    )
      if (this.eligible(node)) out.push(node);
    for (const child of node.children) this.collect(child, out);
  }
  focus(node: Focusable | undefined): boolean {
    if (node && (!node.layoutWidth || !node.layoutHeight)) this.root.reflow();
    if (node && !this.eligible(node)) return false;
    if (node) {
      for (let parent = node.parent; parent; parent = parent.parent)
        if (parent instanceof UIScrollView) parent.reveal(node);
      if (this.root.isLive)
        this.root.boundGame?.accessibility.update(this.root.scene);
      this.root.synchronizeSemantics();
    }
    if (this.root.boundGame) {
      if (!node) {
        this.requested = undefined;
        const element =
          this.current &&
          this.root.boundGame.accessibility.element(this.current);
        element?.blur();
        this.acceptNative(undefined);
        return true;
      }
      this.requested = node;
      this.requestedGeneration = node.scene
        ? node.registrationGeneration
        : undefined;
      if (this.root.isLive) this.root.boundGame.accessibility.focus(node);
      return true;
    }
    this.acceptNative(node);
    return true;
  }
  /** @internal Actual semantic focus events are the source of mounted focus visuals. */
  acceptNative(node: Focusable | undefined): void {
    if (node && !this.eligible(node)) {
      this.move(1);
      return;
    }
    if (node === this.requested) this.requested = undefined;
    this.current?.showFocus(false);
    this.current = node;
    this.currentGeneration = node?.registrationGeneration ?? 0;
    this.root.synchronizeInputScope();
    if (node instanceof UITextInput)
      this.root.boundGame?.input.keyboard.reset();
    node?.showFocus(true);
  }
  /** @internal */
  blurNative(node: Focusable): void {
    if (this.current === node) this.acceptNative(undefined);
  }
  /** Focus traversal within one retained row, including nested controls. */
  focusWithin(container: UIElement, direction: number): boolean {
    const nodes: Focusable[] = [];
    this.collect(container, nodes);
    return (
      nodes.length > 0 &&
      this.focus(nodes[direction < 0 ? nodes.length - 1 : 0])
    );
  }
  /** @internal Allows virtual rows to preserve ordinary intra-row traversal. */
  hasAdjacentWithin(
    container: UIElement,
    node: GameObject,
    direction: number,
  ): boolean {
    const nodes: Focusable[] = [];
    this.collect(container, nodes);
    const index = nodes.indexOf(node as Focusable) + (direction < 0 ? -1 : 1);
    return index >= 0 && index < nodes.length;
  }
  move(direction: number): boolean {
    if (this.current) {
      for (let parent = this.current.parent; parent; parent = parent.parent)
        if (
          parent instanceof UIVirtualList &&
          parent.moveFocus(this.current, direction)
        )
          return true;
    }
    const nodes: Focusable[] = [];
    this.collect(this.modal ?? this.root, nodes);
    if (!nodes.length) {
      this.acceptNative(undefined);
      return false;
    }
    const index = this.current ? nodes.indexOf(this.current) : -1;
    const next =
      index < 0
        ? direction < 0
          ? nodes.length - 1
          : 0
        : (index + (direction < 0 ? -1 : 1) + nodes.length) % nodes.length;
    return this.focus(nodes[next]);
  }
  pushModal(container: UIElement): void {
    if (container.destroyed || rootOf(container) !== this.root)
      throw new Error('Modal must belong to this UI root.');
    this.modals.push({
      container,
      previous: this.current,
      generation: this.current?.registrationGeneration,
    });
    this.root.reflow();
    this.root.synchronizeSemantics();
    this.move(1);
  }
  popModal(): void {
    const previous = this.modals.pop();
    if (!previous) return;
    this.root.synchronizeSemantics();
    if (
      previous.previous &&
      previous.previous.registrationGeneration === previous.generation &&
      this.focus(previous.previous)
    )
      return;
    this.focus(undefined);
    this.move(1);
  }
  /** @internal Removes stale ownership before dispatching device actions. */
  synchronize(): void {
    while (
      this.modal &&
      (this.modal.destroyed || rootOf(this.modal) !== this.root)
    )
      this.popModal();
    if (
      this.current &&
      (!this.eligible(this.current) ||
        this.current.registrationGeneration !== this.currentGeneration)
    ) {
      this.acceptNative(undefined);
      if (this.modal) this.move(1);
    }
    const requested = this.requested;
    if (requested) {
      if (
        !this.eligible(requested) ||
        (this.requestedGeneration !== undefined &&
          requested.registrationGeneration !== this.requestedGeneration)
      )
        this.requested = undefined;
      else if (this.root.isLive) {
        this.requestedGeneration = requested.registrationGeneration;
        this.root.boundGame?.accessibility.focus(requested);
      }
    }
  }
  clear(): void {
    this.modals.length = 0;
    this.requested = undefined;
    this.acceptNative(undefined);
  }
}

let rootSequence = 0;
const canvasFocusOwners = new WeakMap<
  HTMLCanvasElement,
  { users: number; previous: string | null; applied: boolean }
>();
/** Explicit Game binding owns input consumption and semantic keyboard scope. */
export class UIRoot extends UIElement {
  readonly focus = new UIFocusManager(this);
  readonly boundGame?: Game;
  private context?: InputContext;
  private readonly nativeScopes = new Map<
    Focusable,
    {
      node: HTMLElement;
      controller: AbortController;
      generation: number;
      value?: number | boolean;
    }
  >();
  private readonly controller = new AbortController();
  private viewportWidth = -1;
  private viewportHeight = -1;
  private mountingGeneration: number | undefined;
  constructor(game?: Game, layout: UILayout = {}) {
    super({ width: 'fill', height: 'fill', ...layout });
    this.boundGame = game;
    this.addEventListener('remove', () => this.releaseBindings());
    if (game) {
      this.context = game.input.contexts.create(`xyz-ui-${++rootSequence}`, {
        priority: 100,
        consume: true,
        bindings: {
          next: [{ button: 'down' }, { axis: 'leftY', direction: 1 }],
          previous: [{ button: 'up' }, { axis: 'leftY', direction: -1 }],
          left: [
            { key: 'ArrowLeft' },
            { button: 'left' },
            { axis: 'leftX', direction: -1 },
          ],
          right: [
            { key: 'ArrowRight' },
            { button: 'right' },
            { axis: 'leftX', direction: 1 },
          ],
          down: [{ key: 'ArrowDown' }],
          up: [{ key: 'ArrowUp' }],
          activate: [{ key: 'Enter' }, { key: 'Space' }, { button: 'a' }],
          __pointerCapture: [{ pointerButton: 0 }],
        },
      });
      const owner = canvasFocusOwners.get(game.canvas);
      if (owner) owner.users++;
      else {
        const applied = game.canvas.tabIndex < 0;
        canvasFocusOwners.set(game.canvas, {
          users: 1,
          previous: game.canvas.getAttribute('tabindex'),
          applied,
        });
        if (applied) game.canvas.tabIndex = 0;
      }
      game.canvas.addEventListener(
        'pointerdown',
        (event) => {
          if (!this.isLive || !event.isPrimary || event.button !== 0) return;
          // Routed widget focus follows in the engine tick; cancel later compatibility mouse focus.
          event.preventDefault();
          game.canvas.focus({ preventScroll: true });
        },
        { signal: this.controller.signal },
      );
      game.canvas.addEventListener(
        'keydown',
        (event) => {
          if (!this.isLive || event.altKey || event.ctrlKey || event.metaKey)
            return;
          if (event.code === 'Tab') {
            event.preventDefault();
            if (!event.repeat) this.focus.move(event.shiftKey ? -1 : 1);
          }
        },
        { signal: this.controller.signal },
      );
      game.canvas.addEventListener(
        'focus',
        () => {
          if (!this.isLive) return;
          if (this.focus.modal) this.focus.move(1);
          else this.focus.focus(undefined);
          this.synchronizeInputScope();
        },
        { signal: this.controller.signal },
      );
    }
  }
  get isLive(): boolean {
    const game = this.boundGame;
    return (
      !this.destroyed &&
      this.worldVisible &&
      !!game &&
      game.state === 'running' &&
      !!this.scene &&
      this.scene === game.scene &&
      this.scene.has(this)
    );
  }
  override reflow(
    width = this.boundGame?.width ?? this.layoutWidth,
    height = this.boundGame?.height ?? this.layoutHeight,
  ): void {
    super.reflow(width, height);
    this.viewportWidth = width;
    this.viewportHeight = height;
  }
  /** @internal Unpublished candidates and unfocused HUDs never consume gameplay actions. */
  synchronizeInputScope(): void {
    if (this.isLive && (this.focus.focused || this.focus.modal))
      this.context?.activate();
    else this.context?.deactivate();
  }
  private handleKey(control: Focusable, event: KeyboardEvent): void {
    if (control instanceof UITextInput && event.code !== 'Tab') return;
    if (
      event.type === 'keyup' &&
      (event.code === 'Enter' || event.code === 'Space')
    ) {
      if (!(control instanceof UITextInput))
        control.showPressed(false, 'native');
      return;
    }
    if (
      !this.isLive ||
      control.registrationGeneration !==
        this.nativeScopes.get(control)?.generation ||
      control.effectiveDisabled ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (event.isComposing || event.keyCode === 229) return;
    if (
      !(control instanceof UITextInput) &&
      (event.code === 'Enter' || event.code === 'Space')
    ) {
      control.showPressed(
        event.type === 'keydown' && !event.shiftKey,
        'native',
      );
      return;
    }
    if (event.type !== 'keydown') return;
    if (event.code === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      this.focus.move(event.shiftKey ? -1 : 1);
    } else if (
      [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.code)
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (control instanceof UISlider) {
        if (event.code === 'Home') control.value = control.min;
        else if (event.code === 'End') control.value = control.max;
        else
          control.increment(
            event.code === 'ArrowLeft' || event.code === 'ArrowDown' ? -1 : 1,
          );
      } else
        this.focus.move(
          event.code === 'ArrowLeft' || event.code === 'ArrowUp' ? -1 : 1,
        );
    }
  }
  private synchronizeNode(node: GameObject): void {
    if (
      node instanceof UIButton ||
      node instanceof UICheckbox ||
      node instanceof UISlider ||
      node instanceof UITextInput
    ) {
      node.syncState();
      const element = this.boundGame?.accessibility.element(node);
      if (node instanceof UITextInput && element?.tagName === 'INPUT')
        node.bindNative(element as HTMLInputElement);
      let scope = this.nativeScopes.get(node);
      if (
        element &&
        (!scope ||
          scope.node !== element ||
          scope.generation !== node.registrationGeneration)
      ) {
        scope?.controller.abort();
        const controller = new AbortController();
        element.addEventListener(
          'keydown',
          (event) => this.handleKey(node, event),
          { signal: controller.signal },
        );
        element.addEventListener(
          'keyup',
          (event) => this.handleKey(node, event),
          { signal: controller.signal },
        );
        scope = {
          node: element,
          controller,
          generation: node.registrationGeneration,
        };
        this.nativeScopes.set(node, scope);
      }
      if (element) {
        const modal = this.focus.modal;
        let inside = !modal;
        for (
          let parent: GameObject | undefined = node;
          parent && !inside;
          parent = parent.parent
        )
          inside = parent === modal;
        const tabIndex = inside && !node.effectiveDisabled ? 0 : -1;
        if (node.accessibility && node.accessibility.tabIndex !== tabIndex)
          node.accessibility = { ...node.accessibility, tabIndex };
        element.tabIndex = tabIndex;
        if (
          node instanceof UICheckbox &&
          scope &&
          scope.value !== node.checked
        ) {
          element.setAttribute('aria-checked', String(node.checked));
          scope.value = node.checked;
        } else if (
          node instanceof UISlider &&
          scope &&
          scope.value !== node.value
        ) {
          if (scope.value === undefined) {
            element.setAttribute('aria-valuemin', String(node.min));
            element.setAttribute('aria-valuemax', String(node.max));
          }
          element.setAttribute('aria-valuenow', String(node.value));
          scope.value = node.value;
        }
      }
    }
    for (const child of node.children) this.synchronizeNode(child);
  }
  /** @internal Modal changes update native traversal immediately, before another browser key event. */
  synchronizeSemantics(): void {
    if (this.isLive) this.synchronizeNode(this);
  }
  override update(): void {
    const game = this.boundGame;
    if (!game || !this.isLive) {
      this.releaseBindings();
      return;
    }
    if (this.mountingGeneration !== this.registrationGeneration) {
      if (this.mountingGeneration !== undefined) this.releaseBindings();
      this.mountingGeneration = this.registrationGeneration;
    }
    if (
      this.inspectLayout() ||
      game.width !== this.viewportWidth ||
      game.height !== this.viewportHeight
    )
      this.reflow();
    for (const [node, scope] of this.nativeScopes)
      if (
        node.destroyed ||
        node.scene !== this.scene ||
        rootOf(node) !== this ||
        node.registrationGeneration !== scope.generation ||
        game.accessibility.element(node) !== scope.node
      ) {
        scope.controller.abort();
        this.nativeScopes.delete(node);
        if (this.focus.focused === node) this.focus.focus(undefined);
      }
    this.synchronizeNode(this);
    this.focus.synchronize();
    this.synchronizeInputScope();
    const context = this.context;
    if (!context?.active) return;
    const current = this.focus.focused;
    if (current instanceof UITextInput) return;
    if (context.wasPressed('next') || context.wasPressed('down')) {
      if (current instanceof UISlider) current.increment(-1);
      else this.focus.move(1);
    } else if (context.wasPressed('previous') || context.wasPressed('up')) {
      if (current instanceof UISlider) current.increment(1);
      else this.focus.move(-1);
    }
    if (context.wasPressed('left')) {
      if (current instanceof UISlider) current.increment(-1);
      else this.focus.move(-1);
    }
    if (context.wasPressed('right')) {
      if (current instanceof UISlider) current.increment(1);
      else this.focus.move(1);
    }
    const activating = this.focus.focused;
    if (activating && !(activating instanceof UITextInput)) {
      activating.showPressed(context.isDown('activate'), 'context');
      if (context.wasPressed('activate')) activating.activate();
    }
  }
  private releaseBindings(): void {
    this.context?.deactivate();
    for (const [control, scope] of this.nativeScopes) {
      if (control instanceof UITextInput) control.unbindNative();
      scope.controller.abort();
    }
    this.nativeScopes.clear();
    this.focus.clear();
  }
  override destroy(): void {
    if (this.destroyed) return;
    this.releaseBindings();
    this.context?.destroy();
    this.controller.abort();
    if (this.boundGame) {
      const canvas = this.boundGame.canvas,
        owner = canvasFocusOwners.get(canvas);
      if (owner && --owner.users === 0) {
        canvasFocusOwners.delete(canvas);
        if (owner.applied && canvas.getAttribute('tabindex') === '0') {
          if (owner.previous === null) canvas.removeAttribute('tabindex');
          else canvas.setAttribute('tabindex', owner.previous);
        }
      }
    }
    super.destroy();
  }
}
