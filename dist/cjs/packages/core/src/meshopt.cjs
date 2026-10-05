const require_texture = require("../../assets/src/texture.cjs");
//#region dist/packages/core/src/meshopt.js
var t = [
	`NONE`,
	`OCTAHEDRAL`,
	`QUATERNION`,
	`EXPONENTIAL`,
	`COLOR`
];
function check(t) {
	if (!t) throw new require_texture.AssetError(`Invalid EXT_meshopt_compression bitstream or layout.`);
}
var unzigzag = (e) => e >>> 1 ^ -(e & 1);
function decodeMeshopt(e, n, r, i, a, o = `NONE`) {
	if (check(Number.isInteger(n) && n > 0), check(Number.isInteger(r) && e.length === n * r), check(typeof o == `string` && t.includes(o)), a === `ATTRIBUTES`) {
		check(r >= 4 && r <= 256 && r % 4 == 0), decodeVertices(e, n, r, i), applyFilter(e, n, r, o);
		return;
	}
	check(o === `NONE` && (r === 2 || r === 4)), a === `TRIANGLES` ? decodeTriangles(e, n, r, i) : a === `INDICES` ? decodeSequence(e, n, r, i) : check(!1);
}
var Cursor = class {
	bytes;
	offset;
	end;
	constructor(e, t, n) {
		this.bytes = e, this.offset = t, this.end = n;
	}
	take(e) {
		let t = this.offset;
		return check(e >= 0 && t + e <= this.end), this.offset = t + e, t;
	}
	byte() {
		return this.bytes[this.take(1)];
	}
	varint() {
		let e = 0;
		for (let t = 0; t <= 28; t += 7) {
			let n = this.byte();
			if (check(t !== 28 || n < 16), e |= (n & 127) << t, n < 128) return e >>> 0;
		}
		return check(!1), 0;
	}
};
var n = [
	[
		0,
		2,
		4,
		8
	],
	[
		0,
		1,
		2,
		4
	],
	[
		1,
		2,
		4,
		8
	]
];
function decodeVertices(e, t, r, i) {
	check(i.length > 0 && (i[0] === 160 || i[0] === 161));
	let a = i[0] & 15, o = a === 0 ? r : r + r / 4, s = Math.max(o, a === 0 ? 32 : 24);
	check(i.length >= 1 + s);
	let c = i.length - o, l = new Cursor(i, 1, i.length - s), u = i.slice(c, c + r), d = a === 0 ? void 0 : i.subarray(c + r), f = Math.min(8192 / r & -16, 256);
	check(f > 0);
	let p = new Uint8Array(f * r);
	for (let o = 0; o < t; o += f) {
		let s = Math.min(f, t - o), c = s + 15 >>> 4, m = c + 3 >>> 2, h = a === 0 ? 0 : l.take(r / 4);
		p.fill(0);
		for (let e = 0; e < r; e++) {
			let t = e * s, r = a === 0 ? 0 : i[h + (e >>> 2)] >>> ((e & 3) << 1) & 3;
			if (r === 2) continue;
			if (r === 3) {
				p.set(i.subarray(l.take(s), l.offset), t);
				continue;
			}
			let o = l.take(m), u = n[a === 0 ? 0 : r + 1];
			for (let e = 0; e < c; e++) {
				let n = u[i[o + (e >>> 2)] >>> ((e & 3) << 1) & 3], r = t + (e << 4);
				if (n === 0) continue;
				if (n === 8) {
					let t = l.take(16);
					for (let n = 0; n < 16 && (e << 4) + n < s; n++) p[r + n] = i[t + n];
					continue;
				}
				let a = l.take(n * 2), c = (1 << n) - 1;
				for (let t = 0; t < 16; t++) {
					let o = t * n, u = n === 1 ? o & 7 : 8 - n - (o & 7), d = i[a + (o >>> 3)] >>> u & c;
					d === c && (d = l.byte()), (e << 4) + t < s && (p[r + t] = d);
				}
			}
		}
		for (let t = 0; t < s; t++) {
			let n = (o + t) * r;
			for (let i = 0; i < r; i += 4) {
				let r = d ? d[i >>> 2] : 0, a = r & 3;
				if (check(a !== 3), a === 0) for (let r = i; r < i + 4; r++) {
					let i = u[r] + unzigzag(p[r * s + t]) & 255;
					e[n + r] = u[r] = i;
				}
				else if (a === 1) for (let r = i; r < i + 4; r += 2) {
					let i = unzigzag(p[r * s + t] | p[(r + 1) * s + t] << 8), a = (u[r] | u[r + 1] << 8) + i & 65535;
					e[n + r] = u[r] = a & 255, e[n + r + 1] = u[r + 1] = a >>> 8;
				}
				else {
					let a = 0, o = 0;
					for (let e = 0; e < 4; e++) a |= p[(i + e) * s + t] << e * 8, o |= u[i + e] << e * 8;
					let c = r >>> 4, l = o ^ (a >>> c | a << 32 - c);
					for (let t = 0; t < 4; t++) e[n + i + t] = u[i + t] = l >>> t * 8 & 255;
				}
			}
		}
	}
	check(l.offset === l.end);
}
function indexWriter(e, t) {
	let n = new DataView(e.buffer, e.byteOffset, e.byteLength);
	return (e, r) => {
		check(r >= 0 && r <= (t === 2 ? 65535 : 4294967295)), t === 2 ? n.setUint16(e * 2, r, !0) : n.setUint32(e * 4, r, !0);
	};
}
function decodeSequence(e, t, n, r) {
	check(r.length >= 5 && r[0] === 209);
	let i = new Cursor(r, 1, r.length - 4), a = [0, 0], o = indexWriter(e, n);
	for (let e = 0; e < t; e++) {
		let t = i.varint(), n = t & 1;
		a[n] = a[n] + unzigzag(t >>> 1) >>> 0, o(e, a[n]);
	}
	check(i.offset === i.end);
}
function decodeTriangles(e, t, n, r) {
	check(t % 3 == 0 && r.length > 0 && r[0] === 225);
	let i = t / 3, a = r.length - 16;
	check(a >= 1 + i);
	let o = new Cursor(r, 1 + i, a), s = /* @__PURE__ */ new Uint32Array(32), c = /* @__PURE__ */ new Uint32Array(16), l = 0, u = 0, d = 0, f = 0, edge = (e) => s[l - 1 - e & 31], vertex = (e) => c[u - 1 - e & 15], pushVertex = (e) => {
		c[u++ & 15] = e;
	}, pushEdge = (e, t) => {
		s[l++ & 31] = e, s[l++ & 31] = t;
	}, explicit = () => f = f + unzigzag(o.varint()) >>> 0, p = indexWriter(e, n);
	for (let e = 0; e < i; e++) {
		let t = r[1 + e], n = t >>> 4, i = t & 15, s, c, l;
		if (n < 15) s = edge(n * 2), c = edge(n * 2 + 1), i === 0 ? (l = d++, pushVertex(l)) : i < 13 ? l = vertex(i) : i === 13 ? (l = f = f - 1 >>> 0, pushVertex(l)) : i === 14 ? (l = f = f + 1 >>> 0, pushVertex(l)) : (l = explicit(), pushVertex(l)), pushEdge(c, l), pushEdge(l, s);
		else {
			let e;
			i < 14 ? e = r[a + i] : (e = o.byte(), e === 0 && (d = 0));
			let t = e >>> 4, n = e & 15;
			i < 14 ? (s = d++, c = t === 0 ? d++ : vertex(t - 1), l = n === 0 ? d++ : vertex(n - 1), pushVertex(s), t === 0 && pushVertex(c), n === 0 && pushVertex(l)) : (s = i === 14 ? d++ : explicit(), c = t === 0 ? d++ : t === 15 ? explicit() : vertex(t - 1), l = n === 0 ? d++ : n === 15 ? explicit() : vertex(n - 1), pushVertex(s), (t === 0 || t === 15) && pushVertex(c), (n === 0 || n === 15) && pushVertex(l)), pushEdge(s, c), pushEdge(c, l), pushEdge(l, s);
		}
		p(e * 3, s), p(e * 3 + 1, c), p(e * 3 + 2, l);
	}
	check(o.offset === o.end);
}
function applyFilter(e, t, n, r) {
	if (r === `NONE`) return;
	let i = new DataView(e.buffer, e.byteOffset, e.byteLength);
	if (r === `EXPONENTIAL`) {
		for (let t = 0; t < e.length; t += 4) {
			let e = i.getInt32(t, !0);
			i.setFloat32(t, (e << 8 >> 8) * 2 ** (e >> 24), !0);
		}
		return;
	}
	check(r === `QUATERNION` ? n === 8 : n === 4 || n === 8);
	let a = n === 8, o = a ? 32767 : 127, s = a ? 2 : 1, get = (e) => a ? i.getInt16(e, !0) : i.getInt8(e), getUnsigned = (e) => a ? i.getUint16(e, !0) : i.getUint8(e), put = (e, t) => {
		a ? i.setInt16(e, Math.round(t), !0) : i.setInt8(e, Math.round(t));
	}, putUnsigned = (e, t) => {
		a ? i.setUint16(e, Math.round(t), !0) : i.setUint8(e, Math.round(t));
	};
	for (let e = 0; e < t; e++) {
		let t = e * n;
		if (r === `OCTAHEDRAL`) {
			let e = get(t + 2 * s);
			check(e !== 0);
			let n = get(t) / e, r = get(t + s) / e, i = 1 - Math.abs(n) - Math.abs(r), a = Math.max(-i, 0);
			n -= n >= 0 ? a : -a, r -= r >= 0 ? a : -a;
			let c = o / Math.hypot(n, r, i);
			put(t, n * c), put(t + s, r * c), put(t + 2 * s, i * c);
		} else if (r === `QUATERNION`) {
			let e = i.getInt16(t + 6, !0), n = e & 3, r = Math.SQRT1_2 / (e | 3), a = i.getInt16(t, !0) * r, o = i.getInt16(t + 2, !0) * r, s = i.getInt16(t + 4, !0) * r, c = Math.sqrt(Math.max(0, 1 - a * a - o * o - s * s));
			i.setInt16(t + (n + 1 & 3) * 2, Math.round(a * 32767), !0), i.setInt16(t + (n + 2 & 3) * 2, Math.round(o * 32767), !0), i.setInt16(t + (n + 3 & 3) * 2, Math.round(s * 32767), !0), i.setInt16(t + n * 2, Math.round(c * 32767), !0);
		} else {
			let e = (1 << n * 2) - 1, r = getUnsigned(t), i = get(t + s), a = get(t + 2 * s), o = getUnsigned(t + 3 * s);
			check(o > 0);
			let c = (1 << 32 - Math.clz32(o)) - 1, l = o & c >>> 1;
			l = l << 1 | l & 1;
			let u = e / c;
			putUnsigned(t, (r + i - a) * u), putUnsigned(t + s, (r + a) * u), putUnsigned(t + 2 * s, (r - i - a) * u), putUnsigned(t + 3 * s, l * u);
		}
	}
}
//#endregion
exports.decodeMeshopt = decodeMeshopt;

//# sourceMappingURL=meshopt.cjs.map