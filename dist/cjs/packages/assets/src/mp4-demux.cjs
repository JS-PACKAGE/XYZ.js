const require_assets = require("../../../src/data/assets.cjs");
const require_texture = require("./texture.cjs");
const require_video = require("../../../src/data/video.cjs");
//#region dist/packages/assets/src/mp4-demux.js
var r = {
	moov: !0,
	trak: !0,
	mdia: !0,
	minf: !0,
	stbl: !0,
	edts: !0,
	dinf: !0,
	sinf: !0,
	schi: !0
};
function demuxMP4(i, a = {}) {
	let budget = (e, t) => {
		let n = e ?? t;
		if (!Number.isSafeInteger(n) || n < 1 || n > t) throw RangeError(`Invalid MP4 parsing budget.`);
		return n;
	}, o = budget(a.maxBytes, require_video.videoTextureLimits.mp4Bytes), s = budget(a.maxSamples, require_video.videoTextureLimits.mp4Samples), c = budget(a.maxTracks, require_video.videoTextureLimits.mp4Tracks), ee = budget(a.maxDepth, require_video.videoTextureLimits.mp4Depth);
	if (i.byteLength > o) throw RangeError(`MP4 byte budget exceeded.`);
	let l = new DataView(i.buffer, i.byteOffset, i.byteLength), invalid = () => {
		throw RangeError(`Malformed or out-of-bounds MP4 data.`);
	}, unsupported = (t) => {
		throw new require_texture.AssetError(`Unsupported MP4: ${t}.`);
	}, need = (e, t, n) => {
		(!Number.isSafeInteger(e) || !Number.isSafeInteger(t) || e < 0 || t < 0 || e + t > n) && invalid();
	}, u32 = (e) => l.getUint32(e), safe64 = (e) => {
		let t = l.getBigUint64(e);
		return t > BigInt(2 ** 53 - 1) && invalid(), Number(t);
	}, text = (e) => String.fromCharCode(...i.subarray(e, e + 4)), parse = (e, t, n) => {
		if (n > ee) throw RangeError(`MP4 nesting budget exceeded.`);
		let i = [];
		for (; e < t;) {
			need(e, 8, t);
			let a = text(e + 4), o = u32(e), s = 8;
			o === 1 ? (need(e, 16, t), o = safe64(e + 8), s = 16) : o === 0 && (o = t - e), o < s && invalid(), need(e, o, t), [
				`moof`,
				`traf`,
				`mvex`
			].includes(a) && unsupported(`fragmented containers`);
			let c = {
				type: a,
				start: e + s,
				end: e + o,
				children: []
			};
			Object.hasOwn(r, a) && (c.children = parse(c.start, c.end, n + 1)), i.push(c), e += o;
		}
		return i;
	}, one = (e, t) => {
		let n = e.filter((e) => e.type === t);
		return n.length !== 1 && invalid(), n[0];
	}, full = (e, t = 0) => (need(e.start, 4, e.end), (i[e.start] !== t || i[e.start + 1] || i[e.start + 2] || i[e.start + 3]) && unsupported(`${e.type} version/flags`), e.start + 4), table = (e, t) => {
		let n = full(e);
		need(n, 4, e.end);
		let r = u32(n);
		if (r > s) throw RangeError(`MP4 table budget exceeded.`);
		return n + 4 + r * t !== e.end && invalid(), {
			offset: n + 4,
			count: r
		};
	}, u = parse(0, i.length, 1), d = one(u, `ftyp`);
	(d.end - d.start < 8 || (d.end - d.start) % 4) && invalid();
	let te = one(u, `moov`), f = u.filter((e) => e.type === `mdat`);
	f.length || invalid();
	let p = te.children.filter((e) => e.type === `trak`);
	if (p.length > c) throw RangeError(`MP4 track budget exceeded.`);
	let m;
	for (let e of p) {
		let t = one(one(e.children, `mdia`).children, `hdlr`), n = full(t);
		need(n, 8, t.end), text(n + 4) === `vide` && !m && (m = e);
	}
	m || unsupported(`no video track`), m.children.some((e) => e.type === `edts`) && unsupported(`edit lists`);
	let h = one(m.children, `mdia`), g = one(h.children, `mdhd`);
	need(g.start, 4, g.end);
	let _ = i[g.start];
	_ !== 0 && _ !== 1 && unsupported(`mdhd version`), full(g, _), need(g.start, _ === 1 ? 36 : 24, g.end);
	let v = u32(g.start + (_ === 1 ? 20 : 12));
	v || invalid();
	let y = one(one(h.children, `minf`).children, `stbl`);
	y.children.some((e) => [
		`senc`,
		`saiz`,
		`saio`
	].includes(e.type)) && unsupported(`encrypted samples`);
	let b = one(y.children, `stsd`), x = full(b);
	need(x, 4, b.end), u32(x) !== 1 && unsupported(`multiple sample descriptions`);
	let S = parse(x + 4, b.end, 6);
	S.length !== 1 && invalid();
	let C = S[0];
	C.type === `encv` && unsupported(`encrypted video track`), [
		`avc1`,
		`vp09`,
		`av01`
	].includes(C.type) || unsupported(`codec ${C.type}`), need(C.start, 78, C.end), l.getUint16(C.start + 6) !== 1 && unsupported(`external data reference`);
	let w = l.getUint16(C.start + 24), T = l.getUint16(C.start + 26);
	(!w || !T || w > require_assets.assetLimits.textureDimension || T > require_assets.assetLimits.textureDimension || w * T > require_assets.assetLimits.texturePixels) && invalid();
	let ne = parse(C.start + 78, C.end, 7);
	ne.some((e) => e.type === `sinf`) && unsupported(`encrypted video track`);
	let E = one(ne, C.type === `avc1` ? `avcC` : C.type === `vp09` ? `vpcC` : `av1C`), D = i.subarray(E.start, E.end), O, k, pad = (e) => String(e).padStart(2, `0`);
	if (C.type === `avc1`) {
		(D.length < 7 || D[0] !== 1 || (D[4] & 3) == 2) && invalid();
		let e = 6, consume = (t) => {
			for (let n = 0; n < t; n++) {
				need(E.start + e, 2, E.end);
				let t = l.getUint16(E.start + e);
				e += 2, t || invalid(), need(E.start + e, t, E.end), e += t;
			}
		}, t = D[5] & 31;
		t || invalid(), consume(t), need(E.start + e, 1, E.end);
		let n = D[e++];
		n || invalid(), consume(n), O = `avc1.${Array.from(D.subarray(1, 4), (e) => e.toString(16).padStart(2, `0`)).join(``)}`, k = D.slice();
	} else if (C.type === `vp09`) {
		full(E, 1), D.length < 12 && invalid();
		let e = D[4], t = D[5], n = D[6] >> 4;
		(e > 3 || ![
			8,
			10,
			12
		].includes(n) || D.length !== 12 + l.getUint16(E.start + 10)) && invalid(), O = `vp09.${pad(e)}.${pad(t)}.${pad(n)}`;
	} else {
		(D.length < 4 || D[0] !== 129) && invalid();
		let e = D[1] >> 5, t = D[1] & 31, n = !!(D[2] & 64), r = !!(D[2] & 32);
		(e > 2 || r && (!n || e !== 2)) && invalid(), O = `av01.${e}.${pad(t)}${D[2] & 128 ? `H` : `M`}.${r ? `12` : n ? `10` : `08`}`, k = D.slice();
	}
	let re = {
		codec: O,
		codedWidth: w,
		codedHeight: T,
		...k ? { description: k } : {}
	}, A = one(y.children, `stsz`), j = full(A);
	need(j, 8, A.end);
	let M = u32(j), N = u32(j + 4);
	if (!N || N > s) throw RangeError(`MP4 sample budget exceeded.`);
	j + 8 + (M ? 0 : N * 4) !== A.end && invalid();
	let P = new Uint32Array(N);
	for (let e = 0; e < N; e++) P[e] = M || u32(j + 8 + e * 4), (!P[e] || P[e] > require_video.videoTextureLimits.decoderChunkBytes) && invalid();
	let F = table(one(y.children, `stts`), 8), I = new Uint32Array(N), L = 0;
	for (let e = 0; e < F.count; e++) {
		let t = u32(F.offset + e * 8), n = u32(F.offset + e * 8 + 4);
		(!t || !n || L + t > N) && invalid(), I.fill(n, L, L + t), L += t;
	}
	L !== N && invalid();
	let R = new Int32Array(N), z = y.children.filter((e) => e.type === `ctts`);
	if (z.length > 1 && invalid(), z[0]) {
		let e = z[0], t = i[e.start];
		t !== 0 && t !== 1 && unsupported(`ctts version`);
		let n = full(e, t);
		need(n, 4, e.end);
		let r = u32(n);
		(r > s || n + 4 + r * 8 !== e.end) && invalid(), L = 0;
		for (let e = 0; e < r; e++) {
			let r = u32(n + 4 + e * 8), i = t === 1 ? l.getInt32(n + 8 + e * 8) : u32(n + 8 + e * 8);
			(!r || L + r > N || i > 2147483647) && invalid(), R.fill(i, L, L + r), L += r;
		}
		L !== N && invalid();
	}
	let B = new Uint8Array(N), V = y.children.filter((e) => e.type === `stss`);
	if (V.length > 1 && invalid(), !V.length) B.fill(1);
	else {
		let e = table(V[0], 4), t = 0;
		for (let n = 0; n < e.count; n++) {
			let r = u32(e.offset + n * 4);
			(r <= t || r > N) && invalid(), B[r - 1] = 1, t = r;
		}
	}
	let H = y.children.filter((e) => e.type === `stco` || e.type === `co64`);
	H.length !== 1 && invalid();
	let U = H[0], W = U.type === `co64` ? 8 : 4, G = table(U, W), K = table(one(y.children, `stsc`), 12);
	(!K.count || !G.count) && invalid();
	let q = [], J = [];
	for (let e = 0; e < K.count; e++) {
		let t = K.offset + e * 12, n = u32(t), r = u32(t + 4);
		(e === 0 && n !== 1 || n <= (q[e - 1] ?? 0) || n > G.count || !r || r > N || u32(t + 8) !== 1) && invalid(), q.push(n), J.push(r);
	}
	let Y = [], X = new Float64Array(N);
	L = 0;
	let Z = 0;
	for (let e = 0; e < G.count; e++) {
		Z + 1 < q.length && e + 1 === q[Z + 1] && Z++;
		let t = W === 8 ? safe64(G.offset + e * 8) : u32(G.offset + e * 4), n = t, r = J[Z];
		L + r > N && invalid();
		for (let e = 0; e < r; e++) X[L] = t, t += P[L++];
		let i = 0, a = f.length;
		for (; i < a;) {
			let e = i + a >>> 1;
			f[e].start <= n ? i = e + 1 : a = e;
		}
		(i === 0 || t > f[i - 1].end) && invalid(), Y.push({
			offset: n,
			end: t
		});
	}
	L !== N && invalid(), Y.sort((e, t) => e.offset - t.offset);
	for (let e = 1; e < Y.length; e++) Y[e].offset < Y[e - 1].end && invalid();
	typeof EncodedVideoChunk > `u` && unsupported(`WebCodecs EncodedVideoChunk unavailable`);
	let ie = BigInt(v), micros = (e) => {
		let t = Number(e * 1000000n / ie);
		return Number.isSafeInteger(t) || invalid(), t;
	}, ae = [], Q = 0n, $ = 0;
	for (let e = 0; e < N; e++) {
		let t = BigInt(I[e]), n = R[e], r = n === 0 ? $ : micros(Q + BigInt(n)), a = Q + t, o = micros(a), s = o - $;
		s < 1 && invalid();
		let c = X[e];
		ae.push(new EncodedVideoChunk({
			type: B[e] ? `key` : `delta`,
			timestamp: r,
			duration: s,
			data: i.subarray(c, c + P[e])
		})), Q = a, $ = o;
	}
	return {
		config: re,
		chunks: ae
	};
}
//#endregion
exports.demuxMP4 = demuxMP4;

//# sourceMappingURL=mp4-demux.cjs.map