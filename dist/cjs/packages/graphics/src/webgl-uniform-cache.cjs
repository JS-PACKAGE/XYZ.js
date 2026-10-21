//#region dist/packages/graphics/src/webgl-uniform-cache.js
var e = Symbol(`xyz.sentUniformScalar`);
var t = Symbol(`xyz.sentUniformVector`);
var WebGLUniformCache = class {
	uniform4fv(e, n, r) {
		if (!n) return;
		let i = n, a = i[t];
		if (a?.length === r.length) {
			let e = 0;
			for (; e < r.length && same(a[e], r[e]);) e++;
			if (e === r.length) return;
			a.set(r);
		} else i[t] = r.slice();
		e.uniform4fv(n, r);
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