import { GameObject } from './game-object.js';
import { IsolatedGroup2D } from './rendering2d/isolated-group.js';
import type { Rect2D } from './gameplay/contracts.js';
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
/** Retained screen-space container. Only UIElement children participate in layout. */
export declare class UIElement extends IsolatedGroup2D {
    private spec;
    private unavailable;
    private measuredWidth;
    private measuredHeight;
    private arrangedWidth;
    private arrangedHeight;
    private previousVisible;
    private previousParent;
    protected intrinsicWidth: number;
    protected intrinsicHeight: number;
    protected layoutDirty: boolean;
    constructor(layout?: UILayout);
    get layout(): Readonly<UILayout>;
    get layoutWidth(): number;
    get layoutHeight(): number;
    get disabled(): boolean;
    set disabled(value: boolean);
    get effectiveDisabled(): boolean;
    setVisible(value: boolean): void;
    setLayout(layout: UILayout): void;
    add<T extends GameObject>(child: T): T;
    remove(child: GameObject): boolean;
    detachParent(): void;
    invalidateLayout(): void;
    /** Detects direct GameObject visibility/reparent mutations without allocating frame snapshots. */
    protected inspectLayout(): boolean;
    protected stateChanged(): void;
    protected arranged(): void;
    protected padding(side: number): number;
    private limit;
    private dimension;
    private natural;
    private measure;
    /** Explicit detached layout is useful for authoring and deterministic viewport transitions. */
    reflow(width?: number, height?: number): void;
    private arrange;
    getLocalBounds(out?: Rect2D): Rect2D;
    destroy(): void;
}
