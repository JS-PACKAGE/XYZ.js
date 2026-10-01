import { GameObject } from './game-object.js';
import { IsolatedGroup2D } from './rendering2d/isolated-group.js';
import type { Rect2D } from './gameplay/contracts.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';

export type UIDimension = number | 'auto' | 'fill';
export interface UILayout {
  readonly direction?: 'row' | 'column' | 'overlay';
  readonly width?: UIDimension;
  readonly height?: UIDimension;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly gap?: number;
  readonly padding?: number | readonly [number, number, number, number];
  readonly align?: 'start' | 'center' | 'end' | 'stretch';
  readonly justify?: 'start' | 'center' | 'end' | 'space-between';
}
function size(value: number): number {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > rendering2dLimits.coordinate
  )
    throw new RangeError(
      'UI dimensions must be finite, nonnegative and bounded.',
    );
  return value;
}
function snapshot(layout: UILayout): Readonly<UILayout> {
  for (const value of [layout.width, layout.height])
    if (value !== undefined && value !== 'auto' && value !== 'fill')
      size(value);
  for (const value of [
    layout.minWidth,
    layout.maxWidth,
    layout.minHeight,
    layout.maxHeight,
    layout.gap,
  ])
    if (value !== undefined) size(value);
  if (
    (layout.minWidth ?? 0) >
      (layout.maxWidth ?? rendering2dLimits.coordinate) ||
    (layout.minHeight ?? 0) > (layout.maxHeight ?? rendering2dLimits.coordinate)
  )
    throw new RangeError('UI minimum exceeds maximum.');
  if (
    layout.direction !== undefined &&
    !['row', 'column', 'overlay'].includes(layout.direction)
  )
    throw new RangeError('Unknown UI direction.');
  if (
    layout.align !== undefined &&
    !['start', 'center', 'end', 'stretch'].includes(layout.align)
  )
    throw new RangeError('Unknown UI alignment.');
  if (
    layout.justify !== undefined &&
    !['start', 'center', 'end', 'space-between'].includes(layout.justify)
  )
    throw new RangeError('Unknown UI justification.');
  const padding = layout.padding;
  if (typeof padding === 'number') size(padding);
  else if (padding !== undefined) {
    if (padding.length !== 4)
      throw new RangeError('UI padding requires four sides.');
    for (const value of padding) size(value);
  }
  return Object.freeze({
    ...layout,
    padding:
      typeof padding === 'object'
        ? (Object.freeze([...padding]) as readonly [
            number,
            number,
            number,
            number,
          ])
        : padding,
  });
}

/** Retained screen-space container. Only UIElement children participate in layout. */
export class UIElement extends IsolatedGroup2D {
  private spec: Readonly<UILayout>;
  private unavailable = false;
  private measuredWidth = 0;
  private measuredHeight = 0;
  private arrangedWidth = 0;
  private arrangedHeight = 0;
  private previousVisible = true;
  private previousParent: GameObject | undefined;
  protected intrinsicWidth = 0;
  protected intrinsicHeight = 0;
  protected layoutDirty = true;
  constructor(layout: UILayout = {}) {
    super();
    this.space = 'screen';
    this.spec = snapshot(layout);
    this.addEventListener('remove', () => this.invalidateLayout());
  }
  get layout(): Readonly<UILayout> {
    return this.spec;
  }
  get layoutWidth(): number {
    return this.arrangedWidth;
  }
  get layoutHeight(): number {
    return this.arrangedHeight;
  }
  get disabled(): boolean {
    return this.unavailable;
  }
  set disabled(value: boolean) {
    this.unavailable = value;
    this.stateChanged();
    this.invalidateLayout();
  }
  get effectiveDisabled(): boolean {
    if (this.disabled) return true;
    for (let node = this.parent; node; node = node.parent)
      if (node instanceof UIElement && node.disabled) return true;
    return false;
  }
  setVisible(value: boolean): void {
    this.visible = value;
    this.invalidateLayout();
  }
  setLayout(layout: UILayout): void {
    this.spec = snapshot({ ...this.spec, ...layout });
    this.invalidateLayout();
  }
  override add<T extends GameObject>(child: T): T {
    const result = super.add(child);
    this.invalidateLayout();
    return result;
  }
  override remove(child: GameObject): boolean {
    const removed = super.remove(child);
    if (removed) this.invalidateLayout();
    return removed;
  }
  override detachParent(): void {
    if (this.parent instanceof UIElement) this.parent.invalidateLayout();
    super.detachParent();
  }
  invalidateLayout(): void {
    this.layoutDirty = true;
    if (this.parent instanceof UIElement) this.parent.invalidateLayout();
  }
  /** Detects direct GameObject visibility/reparent mutations without allocating frame snapshots. */
  protected inspectLayout(): boolean {
    if (
      this.visible !== this.previousVisible ||
      this.parent !== this.previousParent
    ) {
      this.previousVisible = this.visible;
      this.previousParent = this.parent;
      this.invalidateLayout();
    }
    for (const child of this.children)
      if (child instanceof UIElement && child.inspectLayout())
        this.layoutDirty = true;
    return this.layoutDirty;
  }
  protected stateChanged(): void {}
  protected arranged(): void {}
  protected arrangeChildren(): boolean {
    return false;
  }
  protected padding(side: number): number {
    const padding = this.spec.padding ?? 0;
    return typeof padding === 'number' ? padding : padding[side];
  }
  private limit(value: number, horizontal: boolean): number {
    return Math.min(
      horizontal
        ? (this.spec.maxWidth ?? rendering2dLimits.coordinate)
        : (this.spec.maxHeight ?? rendering2dLimits.coordinate),
      Math.max(
        horizontal ? (this.spec.minWidth ?? 0) : (this.spec.minHeight ?? 0),
        value,
      ),
    );
  }
  private dimension(horizontal: boolean): UIDimension {
    return (horizontal ? this.spec.width : this.spec.height) ?? 'auto';
  }
  private natural(horizontal: boolean): number {
    return horizontal ? this.measuredWidth : this.measuredHeight;
  }
  private measure(): void {
    let width = this.intrinsicWidth,
      height = this.intrinsicHeight,
      count = 0;
    const direction = this.spec.direction ?? 'column';
    for (const child of this.children) {
      if (!(child instanceof UIElement) || !child.visible || child.destroyed)
        continue;
      child.measure();
      if (direction === 'row') {
        width += child.measuredWidth;
        height = Math.max(height, child.measuredHeight);
      } else if (direction === 'column') {
        width = Math.max(width, child.measuredWidth);
        height += child.measuredHeight;
      } else {
        width = Math.max(width, child.measuredWidth);
        height = Math.max(height, child.measuredHeight);
      }
      count++;
    }
    if (direction === 'row')
      width += Math.max(0, count - 1) * (this.spec.gap ?? 0);
    if (direction === 'column')
      height += Math.max(0, count - 1) * (this.spec.gap ?? 0);
    width += this.padding(1) + this.padding(3);
    height += this.padding(0) + this.padding(2);
    this.measuredWidth = this.limit(
      typeof this.spec.width === 'number' ? this.spec.width : width,
      true,
    );
    this.measuredHeight = this.limit(
      typeof this.spec.height === 'number' ? this.spec.height : height,
      false,
    );
  }
  /** Explicit detached layout is useful for authoring and deterministic viewport transitions. */
  reflow(
    width: number = this.layoutWidth,
    height: number = this.layoutHeight,
  ): void {
    size(width);
    size(height);
    this.measure();
    this.arrange(
      typeof this.spec.width === 'number' ? this.spec.width : width,
      typeof this.spec.height === 'number' ? this.spec.height : height,
    );
  }
  private arrange(width: number, height: number): void {
    this.arrangedWidth = this.limit(width, true);
    this.arrangedHeight = this.limit(height, false);
    this.layoutDirty = false;
    this.arranged();
    if (this.arrangeChildren()) return;
    const innerWidth = Math.max(
      0,
      this.arrangedWidth - this.padding(1) - this.padding(3),
    );
    const innerHeight = Math.max(
      0,
      this.arrangedHeight - this.padding(0) - this.padding(2),
    );
    const direction = this.spec.direction ?? 'column';
    const row = direction === 'row',
      overlay = direction === 'overlay';
    const main = row ? innerWidth : innerHeight,
      cross = row ? innerHeight : innerWidth;
    const children: UIElement[] = [];
    for (const child of this.children)
      if (child instanceof UIElement && child.visible && !child.destroyed)
        children.push(child);
    const lengths = children.map((child) => child.natural(row));
    let remaining =
      main - Math.max(0, children.length - 1) * (this.spec.gap ?? 0);
    const fills = new Set<number>();
    for (let i = 0; i < children.length; i++) {
      if (children[i].dimension(row) === 'fill') fills.add(i);
      else remaining -= lengths[i];
    }
    // Minimums take precedence: freezing a maximum on the same pass can overallocate.
    while (fills.size) {
      const share = Math.max(0, remaining / fills.size);
      let constrained = false;
      for (const i of fills) {
        const length = children[i].limit(share, row);
        if (length > share) {
          lengths[i] = length;
          remaining -= length;
          fills.delete(i);
          constrained = true;
        }
      }
      if (constrained) continue;
      for (const i of fills) {
        const length = children[i].limit(share, row);
        if (length < share) {
          lengths[i] = length;
          remaining -= length;
          fills.delete(i);
          constrained = true;
        }
      }
      if (!constrained) {
        for (const i of fills) lengths[i] = share;
        break;
      }
    }
    const used =
      lengths.reduce((sum, value) => sum + value, 0) +
      Math.max(0, children.length - 1) * (this.spec.gap ?? 0);
    const free = Math.max(0, main - used);
    const justify = this.spec.justify ?? 'start';
    let offset = justify === 'center' ? free / 2 : justify === 'end' ? free : 0;
    const gap =
      (this.spec.gap ?? 0) +
      (justify === 'space-between' && children.length > 1
        ? free / (children.length - 1)
        : 0);
    for (let i = 0; i < children.length; i++) {
      const child = children[i],
        align = this.spec.align ?? 'start';
      let childWidth: number, childHeight: number, x: number, y: number;
      if (overlay) {
        childWidth = child.limit(
          child.dimension(true) === 'fill' ||
            (align === 'stretch' && child.dimension(true) === 'auto')
            ? innerWidth
            : child.natural(true),
          true,
        );
        childHeight = child.limit(
          child.dimension(false) === 'fill' ||
            (align === 'stretch' && child.dimension(false) === 'auto')
            ? innerHeight
            : child.natural(false),
          false,
        );
        x =
          align === 'center'
            ? (innerWidth - childWidth) / 2
            : align === 'end'
              ? innerWidth - childWidth
              : 0;
        y =
          justify === 'center'
            ? (innerHeight - childHeight) / 2
            : justify === 'end'
              ? innerHeight - childHeight
              : 0;
      } else {
        const crossLength = child.limit(
          child.dimension(!row) === 'fill' ||
            (align === 'stretch' && child.dimension(!row) === 'auto')
            ? cross
            : child.natural(!row),
          !row,
        );
        const crossOffset =
          align === 'center'
            ? (cross - crossLength) / 2
            : align === 'end'
              ? cross - crossLength
              : 0;
        childWidth = row ? lengths[i] : crossLength;
        childHeight = row ? crossLength : lengths[i];
        x = row ? offset : crossOffset;
        y = row ? crossOffset : offset;
      }
      child.position.set(this.padding(3) + x, this.padding(0) + y);
      child.arrange(childWidth, childHeight);
      offset += lengths[i] + gap;
    }
  }
  override getLocalBounds(
    out: Rect2D = { x: 0, y: 0, width: 0, height: 0 },
  ): Rect2D {
    out.x = out.y = 0;
    out.width = this.layoutWidth;
    out.height = this.layoutHeight;
    return out;
  }
  override destroy(): void {
    if (this.parent instanceof UIElement) this.parent.invalidateLayout();
    super.destroy();
  }
}
