import type { Game } from './game.js';
import { GameObject } from './game-object.js';
import { UIElement } from './ui-layout.js';
import type { UILayout } from './ui-layout.js';
import { Text2D } from './text2d.js';
import type { Text2DOptions } from './text2d.js';
import { Sprite } from './sprite.js';
import { Graphics2D } from './graphics2d/graphics2d.js';
import type { PointerTargetEventDetail } from './gameplay/pointer-router.js';
import { UITextInput } from './ui-text-input.js';
export { UITextInput } from './ui-text-input.js';
export type { UITextInputOptions } from './ui-text-input.js';
export { UIScrollView, UIVirtualList } from './ui-scroll.js';
export type { UIScrollViewOptions, UIVirtualListOptions, UIVirtualListKey, } from './ui-scroll.js';
export { UIElement } from './ui-layout.js';
export type { UILayout, UIDimension } from './ui-layout.js';
import type { AccessibilityPreferenceValues } from './accessibility/preferences.js';
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
export declare class UILabel extends UIElement {
    protected textGraphic?: Text2D;
    private readonly preferenceTextStyle;
    protected constructor(options: UIWidgetOptions);
    static create(text: string, options?: UIWidgetOptions): Promise<UILabel>;
    protected createText(text: string, options: UIWidgetOptions): Promise<void>;
    get text(): string;
    setText(text: string): Promise<void>;
    applyPreferences(values: AccessibilityPreferenceValues): Promise<void>;
    protected arranged(): void;
}
/** Canvas visuals share the ordinary sprite pipeline on every backend. */
declare abstract class UIControl extends UIElement {
    protected textGraphic?: Text2D;
    protected background?: Graphics2D;
    private readonly focusEdges;
    private hovered;
    private down;
    private nativeDown;
    private contextDown;
    private focused;
    private paintedState;
    protected textInset: number;
    private textRevision;
    private readonly preferenceTextStyle;
    private readonly preferenceMinHeight;
    private highContrast;
    protected constructor(role: string, label: string, options: UIWidgetOptions);
    protected initializeVisuals(text: string, options: UIWidgetOptions): Promise<void>;
    protected createShape(): Sprite;
    get text(): string;
    setText(text: string): Promise<void>;
    applyPreferences(values: AccessibilityPreferenceValues): Promise<void>;
    protected arranged(): void;
    protected stateChanged(): void;
    /** @internal Synchronizes inherited disabled state without rerasterizing. */
    syncState(): void;
    /** @internal Detached focus supports deterministic authoring; mounted roots use native focus. */
    showFocus(focused: boolean): void;
    /** @internal Native and polled sources keep independent held states. */
    showPressed(pressed: boolean, source: 'native' | 'context'): void;
    protected canActivate(): boolean;
    protected pointerValue(detail: PointerTargetEventDetail): void;
    abstract activate(): void;
}
export declare class UIButton extends UIControl {
    private constructor();
    static create(text: string, options?: UIWidgetOptions): Promise<UIButton>;
    activate(): void;
}
export declare class UICheckbox extends UIControl {
    private selected;
    private mark?;
    private box?;
    private constructor();
    static create(text: string, options?: UICheckboxOptions): Promise<UICheckbox>;
    get checked(): boolean;
    set checked(value: boolean);
    activate(): void;
    protected arranged(): void;
    protected stateChanged(): void;
}
export declare class UISlider extends UIControl {
    readonly min: number;
    readonly max: number;
    readonly step: number;
    private amount;
    private track?;
    private thumb?;
    private readonly point;
    private constructor();
    static create(label: string, options?: UISliderOptions): Promise<UISlider>;
    get value(): number;
    set value(value: number);
    increment(direction: number): void;
    activate(): void;
    protected pointerValue(detail: PointerTargetEventDetail): void;
    protected arranged(): void;
    private positionThumb;
}
type Focusable = UIButton | UICheckbox | UISlider | UITextInput;
export declare class UIFocusManager {
    private readonly root;
    private current?;
    private currentGeneration;
    private requested?;
    private requestedGeneration?;
    private readonly modals;
    constructor(root: UIRoot);
    get focused(): Focusable | undefined;
    get modal(): UIElement | undefined;
    private eligible;
    private collect;
    focus(node: Focusable | undefined): boolean;
    /** @internal Actual semantic focus events are the source of mounted focus visuals. */
    acceptNative(node: Focusable | undefined): void;
    /** @internal */
    blurNative(node: Focusable): void;
    /** Focus traversal within one retained row, including nested controls. */
    focusWithin(container: UIElement, direction: number): boolean;
    /** @internal Allows virtual rows to preserve ordinary intra-row traversal. */
    hasAdjacentWithin(container: UIElement, node: GameObject, direction: number): boolean;
    move(direction: number): boolean;
    pushModal(container: UIElement): void;
    popModal(): void;
    /** @internal Removes stale ownership before dispatching device actions. */
    synchronize(): void;
    clear(): void;
}
/** Explicit Game binding owns input consumption and semantic keyboard scope. */
export declare class UIRoot extends UIElement {
    readonly focus: UIFocusManager;
    readonly boundGame?: Game;
    private context?;
    private readonly nativeScopes;
    private readonly controller;
    private viewportWidth;
    private viewportHeight;
    private mountingGeneration;
    private preferenceRevision;
    private preferenceTask;
    constructor(game?: Game, layout?: UILayout);
    get isLive(): boolean;
    /** Reflows actual canvas text, hit bounds and focus geometry; never scales invisible DOM alone. */
    applyPreferences(values: AccessibilityPreferenceValues): Promise<void>;
    reflow(width?: number, height?: number): void;
    /** @internal Unpublished candidates and unfocused HUDs never consume gameplay actions. */
    synchronizeInputScope(): void;
    private handleKey;
    private synchronizeNode;
    /** @internal Modal changes update native traversal immediately, before another browser key event. */
    synchronizeSemantics(): void;
    update(): void;
    private releaseBindings;
    destroy(): void;
}
