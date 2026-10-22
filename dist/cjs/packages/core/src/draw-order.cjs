const require_pbr_material = require("./pbr-material.cjs");
//#region dist/packages/core/src/draw-order.js
function isBlended(t) {
	let n = t.material;
	return n instanceof require_pbr_material.PBRMaterial ? n.alphaMode === `BLEND` : n.transparent;
}
var DrawSorter = class {
	pool = [];
	active = [];
	keys = /* @__PURE__ */ new Float64Array();
	words = /* @__PURE__ */ new Uint32Array();
	bytes = /* @__PURE__ */ new Uint8Array();
	orderA = /* @__PURE__ */ new Uint32Array();
	orderB = /* @__PURE__ */ new Uint32Array();
	counts = /* @__PURE__ */ new Uint32Array(2048);
	sort(e, t, n = isBlended) {
		let r = this.active, i = 0;
		for (let a = 0; a < e.length; a++) {
			let o = e[a];
			if (!n(o)) {
				e[i++] = o;
				continue;
			}
			let s = this.pool[r.length] ??= {
				mesh: void 0,
				distance: 0
			};
			s.mesh = o, s.distance = o.distanceSquaredTo(t.x, t.y, t.z), r.push(s);
		}
		if (r.length === 0) return;
		let a = r.length >= 128 ? this.radixOrder(r) : void 0;
		if (a) {
			for (let t = 0; t < r.length; t++) {
				let n = r[a[t]];
				e[i++] = n.mesh, n.mesh = void 0;
			}
			r.length = 0;
			return;
		}
		r.sort(compareFarthestFirst);
		for (let t of r) e[i++] = t.mesh, t.mesh = void 0;
		r.length = 0;
	}
	radixOrder(e) {
		let t = e.length;
		if (this.keys.length < t) {
			let e = Math.max(t, this.keys.length * 2);
			this.keys = new Float64Array(e), this.words = new Uint32Array(this.keys.buffer), this.bytes = new Uint8Array(this.keys.buffer), this.orderA = new Uint32Array(e), this.orderB = new Uint32Array(e);
		}
		let n = this.keys, r = this.words, i = this.bytes, a = this.counts;
		a.fill(0);
		for (let o = 0; o < t; o++) {
			let t = e[o].distance;
			if (t !== t) return;
			n[o] = t === 0 ? 0 : t, r[o * 2 + 1] >>> 31 || (r[o * 2 + 1] ^= 2147483647, r[o * 2] = ~r[o * 2]);
			for (let e = 0; e < 8; e++) a[e * 256 + i[o * 8 + e]]++;
		}
		let o = this.orderA, s = this.orderB;
		for (let e = 0; e < t; e++) o[e] = e;
		for (let e = 0; e < 8; e++) {
			let n = e * 256;
			if (a[n + i[e]] === t) continue;
			for (let e = 0, t = 0; e < 256; e++) {
				let r = a[n + e];
				a[n + e] = t, t += r;
			}
			for (let r = 0; r < t; r++) {
				let t = o[r];
				s[a[n + i[t * 8 + e]]++] = t;
			}
			let r = o;
			o = s, s = r;
		}
		return o;
	}
};
function compareFarthestFirst(e, t) {
	return t.distance > e.distance ? 1 : t.distance < e.distance ? -1 : 0;
}
//#endregion
exports.DrawSorter = DrawSorter;
exports.isBlended = isBlended;

//# sourceMappingURL=draw-order.cjs.map