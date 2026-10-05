//#region dist/packages/core/src/text-graphemes.js
function graphemeBoundaries(e, t) {
	if (typeof Intl.Segmenter != `function`) throw Error(`Intl.Segmenter is required for Unicode grapheme layout.`);
	let n = [0];
	for (let r of new Intl.Segmenter(t || void 0, { granularity: `grapheme` }).segment(e)) {
		let e = r.index + r.segment.length;
		e !== n[n.length - 1] && n.push(e);
	}
	return Object.freeze(n);
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