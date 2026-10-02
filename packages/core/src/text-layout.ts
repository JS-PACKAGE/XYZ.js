import { graphics2dLimits } from '../../../src/data/graphics2d.js';
import { textLayoutLimits } from '../../../src/data/text.js';
import { graphemeBoundaries, snapGrapheme } from './text-graphemes.js';
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
interface Cluster {
  readonly start: number;
  readonly end: number;
  readonly left: number;
  readonly right: number;
  readonly startX: number;
  readonly endX: number;
}

type CaretDocument = Document & {
  caretPositionFromPoint?: (
    x: number,
    y: number,
  ) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

export function textFont(style: NativeTextStyle): string {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}, ${style.fontFallback}`;
}

/** Wait for the requested faces and the browser's fallback layout to settle. */
export async function waitForTextFonts(
  text: string,
  style: NativeTextStyle,
): Promise<void> {
  if (!document.fonts) return;
  await document.fonts.load(textFont(style), text || ' ');
  await document.fonts.ready;
}

/** HTML dir=auto delegates first-strong paragraph resolution to the browser. */
export function paragraphDirection(
  text: string,
  style: NativeTextStyle,
): 'ltr' | 'rtl' {
  if (style.direction !== 'auto') return style.direction;
  const element = document.createElement('span');
  element.dir = 'auto';
  element.lang = style.locale;
  element.setAttribute('aria-hidden', 'true');
  element.style.cssText =
    'all:initial;position:fixed;left:-100000px;white-space:pre;opacity:0;pointer-events:none;unicode-bidi:isolate;';
  element.textContent = text;
  document.body.append(element);
  try {
    return getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
  } finally {
    element.remove();
  }
}

/**
 * An owned, invisible measurement node; never a replacement for canvas pixels.
 * Range uses the same browser shaping/bidi implementation as native editing,
 * including partial ligature advances and discontiguous bidi selections.
 */
export class BrowserTextLayout {
  private readonly element: HTMLSpanElement;
  private readonly node: Text;
  private readonly baselineMarker: HTMLSpanElement;
  private readonly range: Range;
  private boundaries: readonly number[] = [0];
  private clusters: readonly Cluster[] = [];
  private originX = 0;
  private originY = 0;
  private resolvedDirection: 'ltr' | 'rtl' = 'ltr';
  private measuredWidth = 0;
  private measuredBaseline = 0;
  private disposed = false;

  constructor(private readonly owner: Document = document) {
    if (!owner.body || typeof owner.createRange !== 'function')
      throw new Error(
        'A live browser document with Range is required for shaped text geometry.',
      );
    this.element = owner.createElement('span');
    this.element.dataset.xyzTextMeasurement = '';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.style.cssText =
      'all:initial;position:fixed;left:-100000px;top:0;display:inline-block;width:max-content;white-space:pre;opacity:0;pointer-events:none;user-select:none;contain:layout style paint;';
    this.node = owner.createTextNode('');
    this.element.append(this.node);
    this.baselineMarker = owner.createElement('span');
    this.baselineMarker.style.cssText =
      'display:inline-block;width:0;height:0;vertical-align:baseline;';
    this.element.append(this.baselineMarker);
    owner.body.append(this.element);
    this.range = owner.createRange();
  }

  get direction(): 'ltr' | 'rtl' {
    return this.resolvedDirection;
  }
  get width(): number {
    return this.measuredWidth;
  }
  get baseline(): number {
    return this.measuredBaseline;
  }
  get graphemes(): readonly number[] {
    return this.boundaries;
  }

  setText(text: string, style: NativeTextStyle): void {
    if (this.disposed) throw new Error('Cannot measure destroyed text layout.');
    if (text.length > graphics2dLimits.textCodeUnits || /[\r\n]/u.test(text))
      throw new RangeError('Text geometry requires one bounded paragraph.');
    this.node.data = text;
    const css = this.element.style;
    css.font = textFont(style);
    css.fontKerning = 'auto';
    css.fontVariantLigatures = 'normal';
    css.letterSpacing = `${style.letterSpacing}px`;
    css.lineHeight = `${style.lineHeight}px`;
    css.textAlign = 'left';
    css.unicodeBidi = 'isolate';
    this.element.dir = style.direction;
    this.element.lang = style.locale;
    // Inline style must not override HTML dir=auto's first-strong resolution.
    css.removeProperty('direction');
    this.resolvedDirection =
      this.owner.defaultView!.getComputedStyle(this.element).direction === 'rtl'
        ? 'rtl'
        : 'ltr';
    const box = this.element.getBoundingClientRect();
    this.originX = box.left;
    this.originY = box.top;
    this.measuredWidth = box.width;
    this.measuredBaseline =
      this.baselineMarker.getBoundingClientRect().top - this.originY;
    this.boundaries = graphemeBoundaries(text, style.locale);
    const clusters: Cluster[] = [];
    for (let i = 1; i < this.boundaries.length; i++) {
      const start = this.boundaries[i - 1]!,
        end = this.boundaries[i]!;
      this.range.setStart(this.node, start);
      this.range.setEnd(this.node, end);
      const rect = this.range.getBoundingClientRect();
      const left = rect.left - this.originX,
        right = rect.right - this.originX;
      let startX = this.collapsedX(start),
        endX = this.collapsedX(end);
      // A collapsed Range has two possible carets at a bidi boundary. Resolve
      // ambiguity with the browser's own point-to-caret API, not script ranges
      // or a guessed Unicode direction. The node remains completely invisible.
      const startInside =
        startX >= left - textLayoutLimits.geometryEpsilon &&
        startX <= right + textLayoutLimits.geometryEpsilon;
      const endInside =
        endX >= left - textLayoutLimits.geometryEpsilon &&
        endX <= right + textLayoutLimits.geometryEpsilon;
      if (
        right - left > textLayoutLimits.geometryEpsilon &&
        (!startInside ||
          !endInside ||
          Math.abs(startX - endX) < textLayoutLimits.geometryEpsilon)
      ) {
        const leftOffset = this.nativeOffsetAt(left + (right - left) / 4);
        const rightOffset = this.nativeOffsetAt(right - (right - left) / 4);
        if (
          leftOffset === undefined ||
          rightOffset === undefined ||
          leftOffset === rightOffset
        )
          throw new Error(
            'The browser cannot resolve this shaped cluster caret geometry.',
          );
        startX = leftOffset < rightOffset ? left : right;
        endX = leftOffset < rightOffset ? right : left;
      }
      clusters.push({ start, end, left, right, startX, endX });
    }
    this.clusters = clusters;
  }

  private collapsedX(index: number): number {
    this.range.setStart(this.node, index);
    this.range.collapse(true);
    const rect = this.range.getBoundingClientRect();
    // Empty paragraphs have no range boxes at all.
    return rect.height === 0
      ? this.direction === 'rtl'
        ? this.width
        : 0
      : rect.left - this.originX;
  }

  private nativeOffsetAt(x: number): number | undefined {
    const view = this.owner.defaultView;
    if (!view || view.innerWidth <= 0 || view.innerHeight <= 0)
      return undefined;
    const css = this.element.style;
    const previous = {
      left: css.left,
      top: css.top,
      zIndex: css.zIndex,
      pointerEvents: css.pointerEvents,
      userSelect: css.userSelect,
    };
    try {
      const screenX = view.innerWidth / 2;
      css.left = `${screenX - x}px`;
      css.top = '0px';
      css.zIndex = '2147483647';
      css.pointerEvents = 'auto';
      css.userSelect = 'text';
      this.range.selectNodeContents(this.node);
      const box = this.range.getBoundingClientRect();
      const screenY = Math.min(
        view.innerHeight - 1,
        Math.max(0, box.top + box.height / 2),
      );
      const owner = this.owner as CaretDocument;
      const position = owner.caretPositionFromPoint?.(screenX, screenY);
      if (position?.offsetNode === this.node) return position.offset;
      const range = owner.caretRangeFromPoint?.(screenX, screenY);
      return range?.startContainer === this.node
        ? range.startOffset
        : undefined;
    } finally {
      Object.assign(css, previous);
    }
  }

  caret(
    index: number,
    affinity: TextCaretAffinity = 'downstream',
  ): TextCaretPosition {
    if (this.disposed) throw new Error('Cannot query destroyed text layout.');
    const boundary = snapGrapheme(this.boundaries, index, affinity);
    const position = this.boundaries.indexOf(boundary);
    const next = this.clusters[position],
      previous = this.clusters[position - 1];
    const chosen =
      affinity === 'downstream' ? (next ?? previous) : (previous ?? next);
    const x = chosen
      ? chosen.start === boundary
        ? chosen.startX
        : chosen.endX
      : 0;
    return Object.freeze({ index: boundary, x, affinity });
  }

  hitTest(x: number): TextCaretPosition {
    if (this.disposed) throw new Error('Cannot query destroyed text layout.');
    if (!Number.isFinite(x))
      throw new RangeError('Invalid pointer coordinate.');
    let best: TextCaretPosition = { index: 0, x: 0, affinity: 'downstream' };
    let distance = Infinity;
    for (const cluster of this.clusters) {
      const startDistance = Math.abs(x - cluster.startX);
      if (startDistance < distance) {
        distance = startDistance;
        best = {
          index: cluster.start,
          x: cluster.startX,
          affinity: 'downstream',
        };
      }
      const endDistance = Math.abs(x - cluster.endX);
      if (endDistance < distance) {
        distance = endDistance;
        best = { index: cluster.end, x: cluster.endX, affinity: 'upstream' };
      }
    }
    return Object.freeze(best);
  }

  selection(start: number, end: number): readonly TextSelectionRect[] {
    if (this.disposed) throw new Error('Cannot query destroyed text layout.');
    if (start === end) return Object.freeze([]);
    const first = snapGrapheme(
      this.boundaries,
      Math.min(start, end),
      'upstream',
    );
    const last = snapGrapheme(
      this.boundaries,
      Math.max(start, end),
      'downstream',
    );
    this.range.setStart(this.node, first);
    this.range.setEnd(this.node, last);
    const result: TextSelectionRect[] = [];
    for (const rect of this.range.getClientRects()) {
      if (rect.width <= 0) continue;
      result.push(
        Object.freeze({
          x: rect.left - this.originX,
          y: rect.top - this.originY,
          width: rect.width,
          height: rect.height,
        }),
      );
    }
    return Object.freeze(result);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.element.remove();
    this.node.data = '';
    this.clusters = [];
    this.boundaries = [0];
  }
}
