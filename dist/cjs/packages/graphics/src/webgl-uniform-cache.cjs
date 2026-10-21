//#region dist/packages/graphics/src/webgl-uniform-cache.js
var e = Symbol(`xyz.sentUniformScalar`);
var t = Symbol(`xyz.sentUniformVector`);
var n = Symbol(`xyz.sentUniformShared`);
var WebGLUniformCache = class {
	uniform4fv(e, r, i) {
		if (!r) return;
		let a = r, o = a[t];
		if (o?.length === i.length) {
			let e = 0;
			for (; e < i.length && same(o[e], i[e]);) e++;
			if (e === i.length) return;
			o.set(i);
		} else a[t] = i.slice();
		a[n] = void 0, e.uniform4fv(r, i);
	}
	sharedUniform4fv(e, r, i) {
		if (!r) return;
		let a = r;
		a[n] !== i && (a[n] = i, a[t] = void 0, e.uniform4fv(r, i));
	}
	changed(t, n, r, i, a) {
		let o = t, s = o[e];
		if (!s) o[e] = s = /* @__PURE__ */ new Float64Array(4);
		else if (same(s[0], n) && same(s[1], r) && same(s[2], i) && same(s[3], a)) return !1;
		return s[0] = n, s[1] = r, s[2] = i, s[3] = a, !0;
	}
	uniform1i(e, t, n) {
		t && this.changed(t, n, 0, 0, 0) && e.uniform1i(t, n);
	}
	uniform1f(e, t, n) {
		t && this.changed(t, n, 0, 0, 0) && e.uniform1f(t, n);
	}
	uniform2f(e, t, n, r) {
		t && this.changed(t, n, r, 0, 0) && e.uniform2f(t, n, r);
	}
	uniform3f(e, t, n, r, i) {
		t && this.changed(t, n, r, i, 0) && e.uniform3f(t, n, r, i);
	}
	uniform4f(e, t, n, r, i, a) {
		t && this.changed(t, n, r, i, a) && e.uniform4f(t, n, r, i, a);
	}
};
function same(e, t) {
	return e === t && (e !== 0 || 1 / e == 1 / t);
}
//#endregion
exports.WebGLUniformCache = WebGLUniformCache;

//# sourceMappingURL=webgl-uniform-cache.cjs.map