import { UIElement } from './ui-layout.js';
import type { UILayout } from './ui-layout.js';
import { GameObject } from './game-object.js';
import { Vector2 } from '../../math/src/index.js';
import { Mask2D } from './rendering2d/mask2d.js';
import type { PointerTargetEventDetail } from './gameplay/pointer-router.js';
import type { UIRoot } from './ui.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';
import { uiDefaults, uiLimits } from '../../../src/data/ui.js';

export interface UIScrollViewOptions {
  readonly layout?: UILayout;
  readonly contentLayout?: UILayout;
  readonly horizontal?: boolean;
  readonly vertical?: boolean;
}
/** Viewport mask is shared by canvas rendering, pointer routing and native semantics. */
export class UIScrollView extends UIElement {
  readonly content: UIElement;
  readonly horizontal: boolean;
  readonly vertical: boolean;
  private x = 0;
  private y = 0;
  private extentWidth = 0;
  private extentHeight = 0;
  private drag?: {
    id: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  };
  private readonly point = new Vector2();
  constructor(options: UIScrollViewOptions = {}) {
    super({
      width: 'fill',
      height: uiDefaults.scrollHeight,
      ...options.layout,
    });
    this.horizontal = options.horizontal ?? false;
    this.vertical = options.vertical ?? true;
    this.content = super.add(
      new UIElement({
        width: 'fill',
        height: 'auto',
        ...options.contentLayout,
      }),
    );
    this.pointerEnabled = true;
    this.eventPropagation = 'hierarchy';
    this.addEventListener('wheel', (event) => {
      const detail = (event as CustomEvent<PointerTargetEventDetail>).detail;
      if (detail.defaultPrevented || this.effectiveDisabled) return;
      const mode =
        (detail.originalEvent as WheelEvent | undefined)?.deltaMode ?? 0;
      const factor =
        mode === 1
          ? uiDefaults.wheelLinePixels
          : mode === 2
            ? this.layoutHeight
            : 1;
      const changed = this.scrollTo(
        this.x + detail.deltaX * factor,
        this.y + detail.deltaY * factor,
      );
      if (changed) detail.preventDefault();
    });
    this.addEventListener(
      'pointerdown',
      (event) => {
        const detail = (event as CustomEvent<PointerTargetEventDetail>).detail;
        // Mouse selection on controls remains native; touch/pen may pan over descendants.
        if (
          this.drag ||
          this.effectiveDisabled ||
          detail.button !== 0 ||
          (detail.target !== this &&
            detail.originalEvent?.type === 'pointerdown' &&
            (detail.originalEvent as PointerEvent).pointerType === 'mouse')
        )
          return;
        this.toLocal(detail.screen, this.point);
        this.drag = {
          id: detail.pointerId,
          x: this.point.x,
          y: this.point.y,
          offsetX: this.x,
          offsetY: this.y,
        };
      },
      { capture: true },
    );
    this.addEventListener(
      'pointermove',
      (event) => {
        const detail = (event as CustomEvent<PointerTargetEventDetail>).detail;
        if (!this.drag || detail.pointerId !== this.drag.id) return;
        this.toLocal(detail.screen, this.point);
        const moved =
          Math.abs(this.drag.x - this.point.x) +
            Math.abs(this.drag.y - this.point.y) >
          uiDefaults.scrollDragThreshold;
        if (moved) {
          this.scrollTo(
            this.drag.offsetX + this.drag.x - this.point.x,
            this.drag.offsetY + this.drag.y - this.point.y,
          );
          detail.preventDefault();
          detail.stopPropagation();
        }
      },
      { capture: true },
    );
    for (const type of [
      'pointerup',
      'pointerupoutside',
      'pointercancel',
      'remove',
    ])
      this.addEventListener(
        type,
        () => {
          this.drag = undefined;
        },
        { capture: true },
      );
  }
  get scrollX(): number {
    return this.x;
  }
  get scrollY(): number {
    return this.y;
  }
  get contentWidth(): number {
    return this.extentWidth;
  }
  get contentHeight(): number {
    return this.extentHeight;
  }
  scrollTo(x: number, y: number): boolean {
    if (this.destroyed)
      throw new Error('Cannot scroll destroyed UIScrollView.');
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new RangeError('Scroll offsets must be finite.');
    const nextX = this.horizontal
      ? Math.min(
          Math.max(0, this.extentWidth - this.layoutWidth),
          Math.max(0, x),
        )
      : 0;
    const nextY = this.vertical
      ? Math.min(
          Math.max(0, this.extentHeight - this.layoutHeight),
          Math.max(0, y),
        )
      : 0;
    if (this.x === nextX && this.y === nextY) return false;
    this.x = nextX;
    this.y = nextY;
    this.content.position.set(-this.x, -this.y);
    this.scrolled();
    this.dispatchEvent(
      new CustomEvent('scroll', { detail: { x: this.x, y: this.y } }),
    );
    return true;
  }
  /** Scrolls a descendant's bounds into this viewport, retaining nested scroll transforms. */
  reveal(node: GameObject): void {
    let descendant = false;
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent === this) {
        descendant = true;
        break;
      }
    if (!descendant || node.destroyed) return;
    const bounds = node.getLocalBounds();
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    for (const [x, y] of [
      [bounds.x, bounds.y],
      [bounds.x + bounds.width, bounds.y],
      [bounds.x, bounds.y + bounds.height],
      [bounds.x + bounds.width, bounds.y + bounds.height],
    ]) {
      node.toWorld(this.point.set(x, y), this.point);
      this.toLocal(this.point, this.point);
      left = Math.min(left, this.point.x);
      top = Math.min(top, this.point.y);
      right = Math.max(right, this.point.x);
      bottom = Math.max(bottom, this.point.y);
    }
    this.scrollTo(
      this.x +
        (left < 0
          ? left
          : right > this.layoutWidth
            ? right - this.layoutWidth
            : 0),
      this.y +
        (top < 0
          ? top
          : bottom > this.layoutHeight
            ? bottom - this.layoutHeight
            : 0),
    );
  }
  protected setExtent(width: number, height: number): void {
    if (
      ![width, height].every(
        (value) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= rendering2dLimits.coordinate,
      )
    )
      throw new RangeError('Scroll content exceeds bounded coordinates.');
    this.extentWidth = width;
    this.extentHeight = height;
    this.scrollTo(this.x, this.y);
    this.content.position.set(-this.x, -this.y);
  }
  protected scrolled(): void {}
  protected override arranged(): void {
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
  }
  protected override arrangeChildren(): boolean {
    this.content.reflow(this.layoutWidth, this.layoutHeight);
    let width = this.content.layoutWidth,
      height = this.content.layoutHeight;
    for (const child of this.content.children) {
      if (!(child instanceof UIElement) || !child.visible || child.destroyed)
        continue;
      width = Math.max(width, child.position.x + child.layoutWidth);
      height = Math.max(height, child.position.y + child.layoutHeight);
    }
    this.setExtent(width, height);
    return true;
  }
}

export type UIVirtualListKey = string | number;
export interface UIVirtualListOptions<T> extends Omit<
  UIScrollViewOptions,
  'contentLayout' | 'horizontal' | 'vertical'
> {
  readonly items: readonly T[];
  readonly rowHeight: number;
  readonly overscan?: number;
  readonly key: (item: T, index: number) => UIVirtualListKey;
  readonly createRow: () => UIElement;
  readonly bindRow: (
    row: UIElement,
    item: T,
    index: number,
    key: UIVirtualListKey,
  ) => void;
  readonly unbindRow?: (row: UIElement, key: UIVirtualListKey) => void;
}
interface Row {
  readonly node: UIElement;
  key: UIVirtualListKey;
  index: number;
}
/** Fixed-height keyed rows: only the viewport, overscan and at most one focused row are retained. */
export class UIVirtualList<T> extends UIScrollView {
  readonly rowHeight: number;
  readonly overscan: number;
  private items: readonly T[] = [];
  private keys: UIVirtualListKey[] = [];
  private readonly indices = new Map<UIVirtualListKey, number>();
  private readonly rows = new Map<UIVirtualListKey, Row>();
  private readonly pool: UIElement[] = [];
  private reconciling = false;
  constructor(private readonly options: UIVirtualListOptions<T>) {
    super({ layout: options.layout });
    if (
      !Number.isFinite(options.rowHeight) ||
      options.rowHeight <= 0 ||
      options.rowHeight > rendering2dLimits.coordinate ||
      !Number.isSafeInteger(options.overscan ?? uiDefaults.virtualOverscan) ||
      (options.overscan ?? uiDefaults.virtualOverscan) < 0 ||
      (options.overscan ?? uiDefaults.virtualOverscan) >
        uiLimits.virtualOverscan
    )
      throw new RangeError(
        'Virtual rows require positive bounded height and nonnegative integer overscan.',
      );
    this.rowHeight = options.rowHeight;
    this.overscan = options.overscan ?? uiDefaults.virtualOverscan;
    this.setItems(options.items);
  }
  private root(): UIRoot | undefined {
    for (let parent = this.parent; parent; parent = parent.parent)
      if ('focus' in parent && 'synchronizeInputScope' in parent)
        return parent as UIRoot;
    return undefined;
  }
  get materializedCount(): number {
    return this.rows.size;
  }
  get pooledCount(): number {
    return this.pool.length;
  }
  row(key: UIVirtualListKey): UIElement | undefined {
    return this.rows.get(key)?.node;
  }
  keyOf(node: GameObject): UIVirtualListKey | undefined {
    for (const row of this.rows.values())
      for (
        let current: GameObject | undefined = node;
        current;
        current = current.parent
      )
        if (current === row.node) return row.key;
    return undefined;
  }
  setItems(items: readonly T[]): void {
    if (this.destroyed)
      throw new Error('Cannot replace destroyed UIVirtualList.');
    if (items.length * this.rowHeight > rendering2dLimits.coordinate)
      throw new RangeError('Virtual list exceeds bounded coordinates.');
    const indices = new Map<UIVirtualListKey, number>();
    const keys = items.map((item, index) => {
      const key = this.options.key(item, index);
      if (
        (typeof key !== 'string' && typeof key !== 'number') ||
        (typeof key === 'number' && !Number.isFinite(key)) ||
        indices.has(key)
      )
        throw new TypeError(
          'Virtual list requires unique finite string/number keys.',
        );
      indices.set(key, index);
      return key;
    });
    const focused = this.root()?.focus.focused;
    const focusedKey = focused ? this.keyOf(focused) : undefined;
    this.items = [...items];
    this.keys = keys;
    this.indices.clear();
    for (const [key, index] of indices) this.indices.set(key, index);
    for (const row of this.rows.values()) {
      const index = this.indices.get(row.key);
      if (index !== undefined) {
        row.index = index;
        this.options.bindRow(row.node, this.items[index], index, row.key);
      }
    }
    this.setExtent(this.layoutWidth, items.length * this.rowHeight);
    this.materialize();
    // Keep the same native focus owner visible at its new keyed position.
    if (
      focused &&
      focusedKey !== undefined &&
      this.indices.has(focusedKey) &&
      this.root()?.focus.focused === focused
    )
      this.reveal(focused);
    this.invalidateLayout();
  }
  /** Reveals and focuses a keyed offscreen row without mounting the intervening rows. */
  focusKey(key: UIVirtualListKey, direction = 1): boolean {
    const index = this.indices.get(key);
    if (index === undefined || this.destroyed || this.effectiveDisabled)
      return false;
    const top = index * this.rowHeight;
    this.scrollTo(
      0,
      top < this.scrollY
        ? top
        : top + this.rowHeight > this.scrollY + this.layoutHeight
          ? top + this.rowHeight - this.layoutHeight
          : this.scrollY,
    );
    this.materialize();
    const row = this.rows.get(key);
    if (!row) return false;
    const root = this.root();
    if (!root) return false;
    return root.focus.focusWithin(row.node, direction);
  }
  /** @internal Moves across unmaterialized row boundaries during root traversal. */
  moveFocus(node: GameObject, direction: number): boolean {
    const key = this.keyOf(node);
    if (key === undefined) return false;
    const row = this.rows.get(key)!;
    const root = this.root();
    if (!root || root.focus.hasAdjacentWithin(row.node, node, direction))
      return false;
    const next = row.index + (direction < 0 ? -1 : 1);
    return next >= 0 && next < this.keys.length
      ? this.focusKey(this.keys[next], direction)
      : false;
  }
  protected override scrolled(): void {
    if (this.rows) this.materialize();
  }
  protected override arrangeChildren(): boolean {
    this.setExtent(this.layoutWidth, this.items.length * this.rowHeight);
    this.materialize(true);
    return true;
  }
  private materialize(forceLayout = false): void {
    if (this.reconciling || this.destroyed) return;
    this.reconciling = true;
    try {
      if (
        Math.ceil(this.layoutHeight / this.rowHeight) + this.overscan * 2 + 2 >
        uiLimits.virtualRows
      )
        throw new RangeError(
          'Virtual viewport exceeds the bounded materialized row budget.',
        );
      const first = Math.max(
        0,
        Math.floor(this.scrollY / this.rowHeight) - this.overscan,
      );
      const last = Math.min(
        this.items.length,
        Math.ceil((this.scrollY + this.layoutHeight) / this.rowHeight) +
          this.overscan,
      );
      const focused = this.root()?.focus.focused;
      for (const [key, row] of this.rows) {
        const index = this.indices.get(key);
        const pinned =
          index !== undefined && focused && this.keyOf(focused) === key;
        if (
          index !== undefined &&
          (pinned || (index >= first && index < last))
        ) {
          row.index = index;
          continue;
        }
        if (focused && this.keyOf(focused) === key)
          this.root()?.focus.focus(undefined);
        this.options.unbindRow?.(row.node, key);
        this.content.remove(row.node);
        this.rows.delete(key);
        this.pool.push(row.node);
      }
      for (let index = first; index < last; index++) {
        const key = this.keys[index];
        if (this.rows.has(key)) continue;
        const node = this.pool.pop() ?? this.options.createRow();
        if (
          !(node instanceof UIElement) ||
          node.destroyed ||
          node.parent ||
          node.scene
        )
          throw new Error('createRow must return a fresh detached UIElement.');
        try {
          this.options.bindRow(node, this.items[index], index, key);
        } catch (error) {
          node.destroy();
          throw error;
        }
        this.rows.set(key, { node, key, index });
        this.content.add(node);
      }
      for (const row of this.rows.values()) {
        if (
          row.node.layout.width !== this.layoutWidth ||
          row.node.layout.height !== this.rowHeight
        )
          row.node.setLayout({
            width: this.layoutWidth,
            height: this.rowHeight,
          });
        if (
          forceLayout ||
          row.node.layoutWidth !== this.layoutWidth ||
          row.node.layoutHeight !== this.rowHeight
        )
          row.node.reflow(this.layoutWidth, this.rowHeight);
        row.node.position.set(0, row.index * this.rowHeight);
      }
      const capacity = Math.max(0, last - first) + 1;
      while (this.rows.size + this.pool.length > capacity)
        this.pool.pop()?.destroy();
    } finally {
      this.reconciling = false;
    }
  }
  override destroy(): void {
    if (this.destroyed) return;
    for (const row of this.rows.values())
      this.options.unbindRow?.(row.node, row.key);
    this.rows.clear();
    for (const node of this.pool) node.destroy();
    this.pool.length = 0;
    super.destroy();
  }
}
