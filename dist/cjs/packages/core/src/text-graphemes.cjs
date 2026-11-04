//#region dist/packages/core/src/text-graphemes.js
var e;
var t;
function graphemeBoundaries(n, r) {
	if (typeof Intl.Segmenter != `function`) throw Error(`Intl.Segmenter is required for Unicode grapheme layout.`);
	let i = r || void 0;
	(!e || i !== t) && (e = new Intl.Segmenter(i, { granularity: `grapheme` }), t = i);
	let a = [0];
	for (let t of e.segment(n)) {
		let e = t.index + t.segment.length;
		e !== a[a.length - 1] && a.push(e);
	}
	return Object.freeze(a);
}
function snapGrapheme(e, t, n = `downstream`) {
	if (!Number.isInteger(t) || e.length === 0) throw RangeError(`Invalid text offset or grapheme boundaries.`);
	let r = 0, i = e.length - 1;
	if (t >= e[e.length - 1]) return e[e.length - 1];
	for (; r < i;) {
		let n = r + i >>> 1;
		e[n] < t ? r = n + 1 : i = n;
	}
	let a = e[r];
	return a === t || r === 0 ? a : n === `upstream` ? e[r - 1] : a;
}
//#endregion
exports.graphemeBoundaries = graphemeBoundaries;
exports.snapGrapheme = snapGrapheme;

//# sourceMappingURL=text-graphemes.cjs.map