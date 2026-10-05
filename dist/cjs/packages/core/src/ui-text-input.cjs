const require_index = require("../../math/src/index.cjs");
const require_sprite = require("./sprite.cjs");
const require_graphics_path2d = require("./graphics2d/graphics-path2d.cjs");
const require_mask2d = require("./rendering2d/mask2d.cjs");
const require_text = require("../../../src/data/text.cjs");
const require_text_graphemes = require("./text-graphemes.cjs");
const require_text_layout = require("./text-layout.cjs");
const require_text2d = require("./text2d.cjs");
const require_graphics2d = require("./graphics2d/graphics2d.cjs");
const require_ui_layout = require("./ui-layout.cjs");
const require_ui = require("../../../src/data/ui.cjs");
//#region dist/packages/core/src/ui-text-input.js
var UITextInput = class UITextInput extends require_ui_layout.UIElement {
	maxLength;
	content;
	start = 0;
	end = 0;
	direction = `none`;
	composing = !1;
	focused = !1;
	native;
	nativeController;
	graphic;
	background;
	selections = [];
	caret;
	measurement;
	measuredText;
	measuredStyle;
	activeAffinity = `downstream`;
	horizontalOffset = 0;
	revision = 0;
	point = new require_index.Vector2();
	dragStart;
	preferenceTextStyle;
	preferenceMinHeight;
	highContrast = !1;
	constructor(e) {
		if (super({
			width: require_ui.uiDefaults.textInputWidth,
			height: require_ui.uiDefaults.textInputHeight,
			padding: require_ui.uiDefaults.textInputPadding,
			...e.layout
		}), this.preferenceTextStyle = {
			fontSize: 18,
			color: `#ffffff`,
			...e.textStyle
		}, this.preferenceMinHeight = e.layout?.minHeight ?? 0, e.maxLength !== void 0 && (!Number.isSafeInteger(e.maxLength) || e.maxLength < 0 || e.maxLength > require_ui.uiLimits.nativeMaxLength)) throw RangeError(`maxLength must be a nonnegative native 32-bit integer.`);
		this.maxLength = e.maxLength, this.content = this.normalize(e.value ?? ``), this.accessibility = {
			role: `textbox`,
			label: e.label ?? ``,
			nativeInput: !0,
			tabIndex: 0,
			disabled: e.disabled ?? !1
		}, this.disabled = e.disabled ?? !1, this.pointerEnabled = !this.disabled, this.interactiveChildren = !1, this.cursor = `text`, this.eventPropagation = `hierarchy`, this.addEventListener(`focus`, () => {
			this.focused = !0, this.root()?.focus.acceptNative(this), this.paintSelection();
		}), this.addEventListener(`blur`, () => {
			this.focused = !1, this.composing = !1, this.dragStart = void 0, this.root()?.focus.blurNative(this), this.paintSelection();
		}), this.addEventListener(`semanticdetach`, () => this.unbindNative()), this.addEventListener(`remove`, () => this.unbindNative()), this.addEventListener(`pointerdown`, (e) => {
			let t = e.detail;
			if (t.button !== 0 || this.effectiveDisabled) return;
			this.root()?.focus.focus(this);
			let n = this.pointerPosition(t.screen);
			this.dragStart = n.index, this.setSelectionRange(n.index, n.index, `none`, n.affinity);
		}), this.addEventListener(`pointermove`, (e) => {
			if (this.dragStart === void 0) return;
			let t = this.pointerPosition(e.detail.screen), n = t.index;
			this.setSelectionRange(Math.min(n, this.dragStart), Math.max(n, this.dragStart), n < this.dragStart ? `backward` : `forward`, t.affinity);
		});
		for (let e of [
			`pointerup`,
			`pointerupoutside`,
			`pointercancel`
		]) this.addEventListener(e, () => {
			this.dragStart = void 0;
		});
	}
	static async create(e = {}) {
		let r = new UITextInput(e);
		try {
			return r.background = r.add(await require_graphics2d.Graphics2D.create([{
				path: new require_graphics_path2d.GraphicsPath2D([{
					op: `rect`,
					x: 0,
					y: 0,
					width: 1,
					height: 1
				}]),
				fill: `#ffffff`
			}])), r.background.anchor.set(0, 0), r.selections.push(r.add(new require_sprite.Sprite({
				texture: r.background.texture,
				anchor: [0, 0],
				zIndex: 1
			}))), r.selections[0].tint = [
				.18,
				.48,
				.8,
				1
			], r.graphic = r.add(await require_text2d.Text2D.create(r.content, {
				fontSize: 18,
				color: `#ffffff`,
				padding: 0,
				...e.textStyle,
				wrapWidth: void 0,
				align: `left`
			})), r.graphic.anchor.set(0, 0), r.graphic.zIndex = 2, r.caret = r.add(new require_sprite.Sprite({
				texture: r.background.texture,
				anchor: [0, 0],
				zIndex: 3
			})), r.caret.tint = [
				.65,
				.9,
				1,
				1
			], r.measurement = new require_text_layout.BrowserTextLayout(), r.updateMeasurement(), r.syncState(), r.paintSelection(), r;
		} catch (e) {
			throw r.destroy(), e;
		}
	}
	root() {
		for (let e = this.parent; e; e = e.parent) if (`focus` in e && `synchronizeInputScope` in e) return e;
	}
	normalize(e) {
		if (typeof e != `string`) throw TypeError(`Text input value must be a string.`);
		let t = e.replace(/[\r\n]/g, ``);
		return this.maxLength === void 0 || t.length <= this.maxLength ? t : t.slice(0, require_text_graphemes.snapGrapheme(require_text_graphemes.graphemeBoundaries(t), this.maxLength, `upstream`));
	}
	get value() {
		return this.content;
	}
	get selectionStart() {
		return this.start;
	}
	get selectionEnd() {
		return this.end;
	}
	get selectionDirection() {
		return this.direction;
	}
	get isComposing() {
		return this.composing;
	}
	async setValue(e) {
		if (this.destroyed) throw Error(`Cannot update destroyed UITextInput.`);
		this.content = this.normalize(e), this.start = Math.min(this.start, this.content.length), this.end = Math.min(this.end, this.content.length), this.native && (this.native.value = this.content, this.native.setSelectionRange(this.start, this.end, this.direction)), await this.refreshText();
	}
	async setTextStyle(e) {
		if (this.destroyed) throw Error(`Cannot update destroyed UITextInput.`);
		await this.graphic?.setStyle({
			...e,
			wrapWidth: void 0,
			align: `left`
		}), !this.destroyed && (this.updateMeasurement(), this.native && this.configureNative(this.native), this.paintSelection());
	}
	async applyPreferences(e) {
		this.destroyed || (await this.setTextStyle({
			...this.preferenceTextStyle,
			fontSize: (this.preferenceTextStyle.fontSize ?? 18) * e.textScale,
			color: e.highContrast ? `#ffffff` : this.preferenceTextStyle.color
		}), !this.destroyed && (this.highContrast = e.highContrast, this.setLayout({ minHeight: Math.max(this.preferenceMinHeight, (this.graphic?.height ?? 0) + this.padding(0) + this.padding(2)) }), this.caret && (this.caret.tint = e.highContrast ? [
			1,
			1,
			0,
			1
		] : [
			.65,
			.9,
			1,
			1
		]), this.stateChanged()));
	}
	async refreshFonts() {
		if (this.destroyed) throw Error(`Cannot update destroyed UITextInput.`);
		await this.graphic?.refreshFonts(), !this.destroyed && (this.measuredStyle = void 0, this.updateMeasurement(), this.paintSelection());
	}
	get selectionGeometry() {
		let e = this.graphic?.layout.lines[0], t = this.direction === `backward` ? this.start : this.end, n = this.measurement?.caret(t, this.activeAffinity) ?? {
			index: 0,
			x: 0,
			affinity: `downstream`
		};
		return Object.freeze({
			caret: Object.freeze({
				...n,
				x: n.x + (e?.x ?? 0)
			}),
			rectangles: Object.freeze((this.measurement?.selection(this.start, this.end) ?? []).map((t) => Object.freeze({
				...t,
				x: t.x + (e?.x ?? 0),
				y: t.y + (e?.baseline ?? 0) - (this.measurement?.baseline ?? 0)
			})))
		});
	}
	updateMeasurement() {
		if (!this.graphic || !this.measurement || this.graphic.text !== this.content) return;
		let e = this.graphic.style;
		if (this.measuredText === this.content && this.measuredStyle === e) return;
		this.measurement.setText(this.content, e);
		let t = this.graphic.layout.lines[0]?.width ?? 0;
		if (Math.abs(this.measurement.width - t) > require_text.textLayoutLimits.metricsEpsilon) throw Error(`Native shaped selection metrics differ from Canvas font metrics; refresh fonts before editing.`);
		this.measuredText = this.content, this.measuredStyle = e;
	}
	configureNative(e) {
		if (!this.graphic) return;
		let t = this.graphic.style;
		e.dir = t.direction, e.lang = t.locale, e.style.font = require_text_layout.textFont(t), e.style.letterSpacing = `${t.letterSpacing}px`, e.style.lineHeight = `${t.lineHeight}px`;
	}
	setSelectionRange(e, t, n = `none`, r = `downstream`) {
		if (this.destroyed) throw Error(`Cannot select destroyed UITextInput.`);
		if (!Number.isInteger(e) || !Number.isInteger(t) || ![
			`forward`,
			`backward`,
			`none`
		].includes(n) || ![`upstream`, `downstream`].includes(r)) throw RangeError(`Invalid selection range.`);
		this.end = Math.max(0, Math.min(t, this.content.length)), this.start = Math.max(0, Math.min(e, this.end)), this.direction = n, this.activeAffinity = r, this.native?.setSelectionRange(this.start, this.end, n), this.paintSelection();
	}
	bindNative(e) {
		if (e === this.native) {
			e.disabled = this.effectiveDisabled;
			return;
		}
		this.unbindNative(), this.native = e, e.value = this.content, this.configureNative(e), this.maxLength !== void 0 && (e.maxLength = this.maxLength), e.disabled = this.effectiveDisabled, e.autocomplete = `off`, e.setSelectionRange(this.start, this.end, this.direction);
		let t = { signal: (this.nativeController = new AbortController()).signal }, selection = () => {
			if (this.native !== e) return;
			let t = this.start !== e.selectionStart || this.end !== e.selectionEnd || this.direction !== e.selectionDirection;
			this.start = e.selectionStart ?? 0, this.end = e.selectionEnd ?? this.start, this.direction = e.selectionDirection ?? `none`, t && (this.activeAffinity = this.direction === `backward` ? `upstream` : `downstream`), this.paintSelection();
		};
		e.addEventListener(`input`, (t) => {
			this.root()?.isLive && !this.effectiveDisabled && (this.content = e.value, selection(), this.refreshText().catch((e) => this.dispatchEvent(new CustomEvent(`error`, { detail: e }))), this.dispatchEvent(new CustomEvent(`input`, { detail: {
				value: this.content,
				isComposing: this.composing,
				originalEvent: t
			} })));
		}, t), e.addEventListener(`change`, (e) => {
			this.root()?.isLive && !this.effectiveDisabled && this.dispatchEvent(new CustomEvent(`change`, { detail: {
				value: this.content,
				originalEvent: e
			} }));
		}, t);
		for (let n of [
			`select`,
			`selectionchange`,
			`keyup`,
			`pointerup`
		]) e.addEventListener(n, selection, t);
		e.ownerDocument.addEventListener(`selectionchange`, () => {
			e.ownerDocument.activeElement === e && selection();
		}, t);
		for (let n of [
			`compositionstart`,
			`compositionupdate`,
			`compositionend`
		]) e.addEventListener(n, (e) => {
			this.root()?.isLive && (this.composing = n !== `compositionend`, selection(), this.dispatchEvent(new CustomEvent(n, { detail: {
				data: e.data,
				originalEvent: e
			} })));
		}, t);
	}
	unbindNative() {
		this.native?.blur(), this.native && this.root()?.focus.blurNative(this), this.nativeController?.abort(), this.nativeController = void 0, this.native = void 0, this.composing = this.focused = !1, this.dragStart = void 0, this.paintSelection();
	}
	async refreshText() {
		let e = ++this.revision;
		await this.graphic?.setText(this.content), !this.destroyed && e === this.revision && (this.updateMeasurement(), this.paintSelection());
	}
	pointerPosition(e) {
		this.toLocal(e, this.point);
		let t = this.graphic?.layout.lines[0]?.x ?? 0, n = this.point.x - this.padding(3) + this.horizontalOffset - t;
		return this.measurement?.hitTest(n) ?? {
			index: 0,
			x: 0,
			affinity: `downstream`
		};
	}
	paintSelection() {
		if (!this.graphic || !this.caret || !this.background) return;
		let e = this.selectionGeometry, t = e.caret.x, n = Math.max(0, this.layoutWidth - this.padding(3) - this.padding(1));
		this.horizontalOffset = Math.max(0, Math.min(this.horizontalOffset, t, Math.max(0, Math.max(this.graphic.width, t + 2) - n))), t - this.horizontalOffset > n - 2 && (this.horizontalOffset = Math.max(0, t - n + 2));
		let r = Math.max(0, (this.layoutHeight - this.graphic.height) / 2);
		for (this.graphic.position.set(this.padding(3) - this.horizontalOffset, r); this.selections.length < e.rectangles.length;) {
			let e = this.add(new require_sprite.Sprite({
				texture: this.background.texture,
				anchor: [0, 0],
				zIndex: 1
			}));
			e.tint = [
				.18,
				.48,
				.8,
				1
			], this.selections.push(e);
		}
		let i = this.graphic.text === this.content;
		for (let t = 0; t < this.selections.length; t++) {
			let n = this.selections[t], a = e.rectangles[t];
			n.visible = !!a && i && this.focused && !this.effectiveDisabled, a && (n.position.set(this.padding(3) + a.x - this.horizontalOffset, r + a.y), n.scale.set(a.width, a.height));
		}
		this.caret.position.set(this.padding(3) + t - this.horizontalOffset, r), this.caret.scale.set(1, this.graphic.height), this.caret.visible = i && this.focused && !this.effectiveDisabled;
	}
	arranged() {
		this.background?.scale.set(this.layoutWidth, this.layoutHeight), this.layoutWidth > 0 && this.layoutHeight > 0 && (this.mask?.rect?.width !== this.layoutWidth || this.mask?.rect?.height !== this.layoutHeight) && (this.mask = require_mask2d.Mask2D.rectangle({
			x: 0,
			y: 0,
			width: this.layoutWidth,
			height: this.layoutHeight
		})), this.paintSelection();
	}
	stateChanged() {
		this.pointerEnabled = !this.effectiveDisabled, this.background && (this.background.tint = this.highContrast ? this.effectiveDisabled ? [
			.12,
			.12,
			.12,
			1
		] : [
			0,
			0,
			0,
			1
		] : this.effectiveDisabled ? [
			.18,
			.19,
			.22,
			1
		] : [
			.16,
			.23,
			.34,
			1
		]), this.accessibility && this.accessibility.disabled !== this.effectiveDisabled && (this.accessibility = {
			...this.accessibility,
			disabled: this.effectiveDisabled
		}), this.native && (this.native.disabled = this.effectiveDisabled), this.paintSelection();
	}
	syncState() {
		this.stateChanged();
	}
	showFocus(e) {
		this.focused = e, this.paintSelection();
	}
	activate() {
		this.root()?.focus.focus(this);
	}
	detachParent() {
		this.unbindNative(), super.detachParent();
	}
	destroy() {
		this.destroyed || (this.unbindNative(), this.measurement?.destroy(), this.measurement = void 0, super.destroy());
	}
};
//#endregion
exports.UITextInput = UITextInput;

//# sourceMappingURL=ui-text-input.cjs.map