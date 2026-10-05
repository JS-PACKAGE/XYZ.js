const require_graphics2d = require("../../../src/data/graphics2d.cjs");
const require_text = require("../../../src/data/text.cjs");
const require_text_graphemes = require("./text-graphemes.cjs");
//#region dist/packages/core/src/text-layout.js
function textFont(e) {
	return `${e.fontStyle} ${e.fontWeight} ${e.fontSize}px ${e.fontFamily}, ${e.fontFallback}`;
}
async function waitForTextFonts(e, t) {
	document.fonts && (await document.fonts.load(textFont(t), e || ` `), await document.fonts.ready);
}
function paragraphDirection(e, t) {
	if (t.direction !== `auto`) return t.direction;
	let n = document.createElement(`span`);
	n.dir = `auto`, n.lang = t.locale, n.setAttribute(`aria-hidden`, `true`), n.style.cssText = `all:initial;position:fixed;left:-100000px;white-space:pre;opacity:0;pointer-events:none;unicode-bidi:isolate;`, n.textContent = e, document.body.append(n);
	try {
		return getComputedStyle(n).direction === `rtl` ? `rtl` : `ltr`;
	} finally {
		n.remove();
	}
}
var BrowserTextLayout = class {
	owner;
	element;
	node;
	baselineMarker;
	range;
	boundaries = [0];
	clusters = [];
	originX = 0;
	originY = 0;
	resolvedDirection = `ltr`;
	measuredWidth = 0;
	measuredBaseline = 0;
	disposed = !1;
	constructor(e = document) {
		if (this.owner = e, !e.body || typeof e.createRange != `function`) throw Error(`A live browser document with Range is required for shaped text geometry.`);
		this.element = e.createElement(`span`), this.element.dataset.xyzTextMeasurement = ``, this.element.setAttribute(`aria-hidden`, `true`), this.element.style.cssText = `all:initial;position:fixed;left:-100000px;top:0;display:inline-block;width:max-content;white-space:pre;opacity:0;pointer-events:none;user-select:none;contain:layout style paint;`, this.node = e.createTextNode(``), this.element.append(this.node), this.baselineMarker = e.createElement(`span`), this.baselineMarker.style.cssText = `display:inline-block;width:0;height:0;vertical-align:baseline;`, this.element.append(this.baselineMarker), e.body.append(this.element), this.range = e.createRange();
	}
	get direction() {
		return this.resolvedDirection;
	}
	get width() {
		return this.measuredWidth;
	}
	get baseline() {
		return this.measuredBaseline;
	}
	get graphemes() {
		return this.boundaries;
	}
	setText(r, i) {
		if (this.disposed) throw Error(`Cannot measure destroyed text layout.`);
		if (r.length > require_graphics2d.graphics2dLimits.textCodeUnits || /[\r\n]/u.test(r)) throw RangeError(`Text geometry requires one bounded paragraph.`);
		this.node.data = r;
		let a = this.element.style;
		a.font = textFont(i), a.fontKerning = `auto`, a.fontVariantLigatures = `normal`, a.letterSpacing = `${i.letterSpacing}px`, a.lineHeight = `${i.lineHeight}px`, a.textAlign = `left`, a.unicodeBidi = `isolate`, this.element.dir = i.direction, this.element.lang = i.locale, a.removeProperty(`direction`), this.resolvedDirection = this.owner.defaultView.getComputedStyle(this.element).direction === `rtl` ? `rtl` : `ltr`;
		let o = this.element.getBoundingClientRect();
		this.originX = o.left, this.originY = o.top, this.measuredWidth = o.width, this.measuredBaseline = this.baselineMarker.getBoundingClientRect().top - this.originY, this.boundaries = require_text_graphemes.graphemeBoundaries(r, i.locale);
		let s = [];
		for (let e = 1; e < this.boundaries.length; e++) {
			let n = this.boundaries[e - 1], r = this.boundaries[e];
			this.range.setStart(this.node, n), this.range.setEnd(this.node, r);
			let i = this.range.getBoundingClientRect(), a = i.left - this.originX, o = i.right - this.originX, c = this.collapsedX(n), l = this.collapsedX(r), u = c >= a - require_text.textLayoutLimits.geometryEpsilon && c <= o + require_text.textLayoutLimits.geometryEpsilon, d = l >= a - require_text.textLayoutLimits.geometryEpsilon && l <= o + require_text.textLayoutLimits.geometryEpsilon;
			if (o - a > require_text.textLayoutLimits.geometryEpsilon && (!u || !d || Math.abs(c - l) < require_text.textLayoutLimits.geometryEpsilon)) {
				let e = this.nativeOffsetAt(a + (o - a) / 4), t = this.nativeOffsetAt(o - (o - a) / 4);
				if (e === void 0 || t === void 0 || e === t) throw Error(`The browser cannot resolve this shaped cluster caret geometry.`);
				c = e < t ? a : o, l = e < t ? o : a;
			}
			s.push({
				start: n,
				end: r,
				left: a,
				right: o,
				startX: c,
				endX: l
			});
		}
		this.clusters = s;
	}
	collapsedX(e) {
		this.range.setStart(this.node, e), this.range.collapse(!0);
		let t = this.range.getBoundingClientRect();
		return t.height === 0 ? this.direction === `rtl` ? this.width : 0 : t.left - this.originX;
	}
	nativeOffsetAt(e) {
		let t = this.owner.defaultView;
		if (!t || t.innerWidth <= 0 || t.innerHeight <= 0) return;
		let n = this.element.style, r = {
			left: n.left,
			top: n.top,
			zIndex: n.zIndex,
			pointerEvents: n.pointerEvents,
			userSelect: n.userSelect
		};
		try {
			let r = t.innerWidth / 2;
			n.left = `${r - e}px`, n.top = `0px`, n.zIndex = `2147483647`, n.pointerEvents = `auto`, n.userSelect = `text`, this.range.selectNodeContents(this.node);
			let i = this.range.getBoundingClientRect(), a = Math.min(t.innerHeight - 1, Math.max(0, i.top + i.height / 2)), o = this.owner, s = o.caretPositionFromPoint?.(r, a);
			if (s?.offsetNode === this.node) return s.offset;
			let c = o.caretRangeFromPoint?.(r, a);
			return c?.startContainer === this.node ? c.startOffset : void 0;
		} finally {
			Object.assign(n, r);
		}
	}
	caret(e, t = `downstream`) {
		if (this.disposed) throw Error(`Cannot query destroyed text layout.`);
		let n = require_text_graphemes.snapGrapheme(this.boundaries, e, t), i = this.boundaries.indexOf(n), a = this.clusters[i], o = this.clusters[i - 1], s = t === `downstream` ? a ?? o : o ?? a, c = s ? s.start === n ? s.startX : s.endX : 0;
		return Object.freeze({
			index: n,
			x: c,
			affinity: t
		});
	}
	hitTest(e) {
		if (this.disposed) throw Error(`Cannot query destroyed text layout.`);
		if (!Number.isFinite(e)) throw RangeError(`Invalid pointer coordinate.`);
		let t = {
			index: 0,
			x: 0,
			affinity: `downstream`
		}, n = 1 / 0;
		for (let r of this.clusters) {
			let i = Math.abs(e - r.startX);
			i < n && (n = i, t = {
				index: r.start,
				x: r.startX,
				affinity: `downstream`
			});
			let a = Math.abs(e - r.endX);
			a < n && (n = a, t = {
				index: r.end,
				x: r.endX,
				affinity: `upstream`
			});
		}
		return Object.freeze(t);
	}
	selection(e, t) {
		if (this.disposed) throw Error(`Cannot query destroyed text layout.`);
		if (e === t) return Object.freeze([]);
		let n = require_text_graphemes.snapGrapheme(this.boundaries, Math.min(e, t), `upstream`), i = require_text_graphemes.snapGrapheme(this.boundaries, Math.max(e, t), `downstream`);
		this.range.setStart(this.node, n), this.range.setEnd(this.node, i);
		let a = [];
		for (let e of this.range.getClientRects()) e.width <= 0 || a.push(Object.freeze({
			x: e.left - this.originX,
			y: e.top - this.originY,
			width: e.width,
			height: e.height
		}));
		return Object.freeze(a);
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.element.remove(), this.node.data = ``, this.clusters = [], this.boundaries = [0]);
	}
};
//#endregion
exports.BrowserTextLayout = BrowserTextLayout;
exports.paragraphDirection = paragraphDirection;
exports.textFont = textFont;
exports.waitForTextFonts = waitForTextFonts;

//# sourceMappingURL=text-layout.cjs.map