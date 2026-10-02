import { UIElement } from './ui-layout.js';
import type { UIWidgetOptions } from './ui.js';
import type { Text2DOptions } from './text2d.js';
import type { TextCaretPosition, TextSelectionRect } from './text-layout.js';
import type { TextCaretAffinity } from './text-graphemes.js';
import type { AccessibilityPreferenceValues } from './accessibility/preferences.js';
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
export declare class UITextInput extends UIElement {
    readonly maxLength?: number;
    private content;
    private start;
    private end;
    private direction;
    private composing;
    private focused;
    private native?;
    private nativeController?;
    private graphic?;
    private background?;
    private readonly selections;
    private caret?;
    private measurement?;
    private measuredText?;
    private measuredStyle?;
    private activeAffinity;
    private horizontalOffset;
    private revision;
    private readonly point;
    private dragStart?;
    private readonly preferenceTextStyle;
    private readonly preferenceMinHeight;
    private highContrast;
    private constructor();
    static create(options?: UITextInputOptions): Promise<UITextInput>;
    private root;
    private normalize;
    get value(): string;
    get selectionStart(): number;
    get selectionEnd(): number;
    get selectionDirection(): 'forward' | 'backward' | 'none';
    get isComposing(): boolean;
    setValue(value: string): Promise<void>;
    setTextStyle(style: Text2DOptions): Promise<void>;
    applyPreferences(values: AccessibilityPreferenceValues): Promise<void>;
    refreshFonts(): Promise<void>;
    get selectionGeometry(): UITextInputSelectionGeometry;
    private updateMeasurement;
    private configureNative;
    setSelectionRange(start: number, end: number, direction?: 'forward' | 'backward' | 'none', affinity?: TextCaretAffinity): void;
    /** @internal Called when the live semantic input is published. */
    bindNative(input: HTMLInputElement): void;
    /** @internal Teardown is immediate, including Game.pause before another frame. */
    unbindNative(): void;
    private refreshText;
    private pointerPosition;
    private paintSelection;
    protected arranged(): void;
    protected stateChanged(): void;
    syncState(): void;
    showFocus(focused: boolean): void;
    activate(): void;
    detachParent(): void;
    destroy(): void;
}
