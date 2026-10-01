import { UIElement } from './ui-layout.js';
import type { UIWidgetOptions } from './ui.js';
export interface UITextInputOptions extends UIWidgetOptions {
    readonly value?: string;
    readonly maxLength?: number;
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
    private selection?;
    private caret?;
    private context?;
    private horizontalOffset;
    private revision;
    private readonly point;
    private dragStart?;
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
    setSelectionRange(start: number, end: number, direction?: 'forward' | 'backward' | 'none'): void;
    /** @internal Called when the live semantic input is published. */
    bindNative(input: HTMLInputElement): void;
    /** @internal Teardown is immediate, including Game.pause before another frame. */
    unbindNative(): void;
    private refreshText;
    private advance;
    private pointerIndex;
    private paintSelection;
    protected arranged(): void;
    protected stateChanged(): void;
    syncState(): void;
    showFocus(focused: boolean): void;
    activate(): void;
    detachParent(): void;
    destroy(): void;
}
