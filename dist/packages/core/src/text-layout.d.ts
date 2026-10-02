import type { TextCaretAffinity } from './text-graphemes.js';
export type TextDirection = 'ltr' | 'rtl' | 'auto';
export interface NativeTextStyle {
    readonly fontFamily: string;
    readonly fontFallback: string;
    readonly fontSize: number;
    readonly fontWeight: string | number;
    readonly fontStyle: string;
    readonly letterSpacing: number;
    readonly lineHeight: number;
    readonly direction: TextDirection;
    readonly locale: string;
}
export interface TextSelectionRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export interface TextCaretPosition {
    readonly index: number;
    readonly x: number;
    readonly affinity: TextCaretAffinity;
}
export declare function textFont(style: NativeTextStyle): string;
/** Wait for the requested faces and the browser's fallback layout to settle. */
export declare function waitForTextFonts(text: string, style: NativeTextStyle): Promise<void>;
/** HTML dir=auto delegates first-strong paragraph resolution to the browser. */
export declare function paragraphDirection(text: string, style: NativeTextStyle): 'ltr' | 'rtl';
/**
 * An owned, invisible measurement node; never a replacement for canvas pixels.
 * Range uses the same browser shaping/bidi implementation as native editing,
 * including partial ligature advances and discontiguous bidi selections.
 */
export declare class BrowserTextLayout {
    private readonly owner;
    private readonly element;
    private readonly node;
    private readonly baselineMarker;
    private readonly range;
    private boundaries;
    private clusters;
    private originX;
    private originY;
    private resolvedDirection;
    private measuredWidth;
    private measuredBaseline;
    private disposed;
    constructor(owner?: Document);
    get direction(): 'ltr' | 'rtl';
    get width(): number;
    get baseline(): number;
    get graphemes(): readonly number[];
    setText(text: string, style: NativeTextStyle): void;
    private collapsedX;
    private nativeOffsetAt;
    caret(index: number, affinity?: TextCaretAffinity): TextCaretPosition;
    hitTest(x: number): TextCaretPosition;
    selection(start: number, end: number): readonly TextSelectionRect[];
    destroy(): void;
}
