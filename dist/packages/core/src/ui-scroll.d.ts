import { UIElement } from './ui-layout.js';
import type { UILayout } from './ui-layout.js';
import { GameObject } from './game-object.js';
export interface UIScrollViewOptions {
    readonly layout?: UILayout;
    readonly contentLayout?: UILayout;
    readonly horizontal?: boolean;
    readonly vertical?: boolean;
}
/** Viewport mask is shared by canvas rendering, pointer routing and native semantics. */
export declare class UIScrollView extends UIElement {
    readonly content: UIElement;
    readonly horizontal: boolean;
    readonly vertical: boolean;
    private x;
    private y;
    private extentWidth;
    private extentHeight;
    private drag?;
    private readonly point;
    constructor(options?: UIScrollViewOptions);
    get scrollX(): number;
    get scrollY(): number;
    get contentWidth(): number;
    get contentHeight(): number;
    scrollTo(x: number, y: number): boolean;
    /** Scrolls a descendant's bounds into this viewport, retaining nested scroll transforms. */
    reveal(node: GameObject): void;
    protected setExtent(width: number, height: number): void;
    protected scrolled(): void;
    protected arranged(): void;
    protected arrangeChildren(): boolean;
}
export type UIVirtualListKey = string | number;
export interface UIVirtualListOptions<T> extends Omit<UIScrollViewOptions, 'contentLayout' | 'horizontal' | 'vertical'> {
    readonly items: readonly T[];
    readonly rowHeight: number;
    readonly overscan?: number;
    readonly key: (item: T, index: number) => UIVirtualListKey;
    readonly createRow: () => UIElement;
    readonly bindRow: (row: UIElement, item: T, index: number, key: UIVirtualListKey) => void;
    readonly unbindRow?: (row: UIElement, key: UIVirtualListKey) => void;
}
/** Fixed-height keyed rows: only the viewport, overscan and at most one focused row are retained. */
export declare class UIVirtualList<T> extends UIScrollView {
    private readonly options;
    readonly rowHeight: number;
    readonly overscan: number;
    private items;
    private keys;
    private readonly indices;
    private readonly rows;
    private readonly pool;
    private reconciling;
    constructor(options: UIVirtualListOptions<T>);
    private root;
    get materializedCount(): number;
    get pooledCount(): number;
    row(key: UIVirtualListKey): UIElement | undefined;
    keyOf(node: GameObject): UIVirtualListKey | undefined;
    setItems(items: readonly T[]): void;
    /** Reveals and focuses a keyed offscreen row without mounting the intervening rows. */
    focusKey(key: UIVirtualListKey, direction?: number): boolean;
    /** @internal Moves across unmaterialized row boundaries during root traversal. */
    moveFocus(node: GameObject, direction: number): boolean;
    protected scrolled(): void;
    protected arrangeChildren(): boolean;
    private materialize;
    destroy(): void;
}
