//#region dist/packages/core/src/animation-blend-tree.js
var AnimationBlendTree = class {
	mixer;
	weights;
	parameter = {
		x: 0,
		y: 0
	};
	actions;
	timeScale = 1;
	loopMode;
	playing = !1;
	phase = 0;
	requestedX = 0;
	requestedY = 0;
	x;
	y;
	triangles;
	smoothing;
	dimension;
	unregister;
	destroyed = !1;
	constructor(e, t) {
		if (this.mixer = e, this.dimension = t.dimension, this.smoothing = t.smoothing ?? 0, !Number.isFinite(this.smoothing) || this.smoothing < 0 || t.points.length < 2) throw RangeError(`Blend trees require at least two points and nonnegative smoothing.`);
		this.loopMode = t.loopMode ?? `repeat`, this.x = new Float64Array(t.points.length), this.y = new Float64Array(t.points.length), this.weights = new Float64Array(t.points.length);
		let n = /* @__PURE__ */ new Set(), r = t.points[0].clip.tracks;
		for (let e = 0; e < t.points.length; e++) {
			let i = t.points[e];
			if (n.has(i.clip) || i.clip.duration <= 0 || i.clip.tracks.length !== r.length) throw RangeError(`Blend leaves require distinct positive-duration clips with identical channels.`);
			n.add(i.clip);
			for (let e = 0; e < r.length; e++) if (r[e].target !== i.clip.tracks[e].target || r[e].path !== i.clip.tracks[e].path) throw RangeError(`Blend leaf target/property channels must match.`);
			if (this.x[e] = `value` in i ? i.value : i.x, this.y[e] = `value` in i ? 0 : i.y, !Number.isFinite(this.x[e]) || !Number.isFinite(this.y[e]) || this.dimension === `1d` && e > 0 && this.x[e] <= this.x[e - 1]) throw RangeError(`Blend points must be finite; 1D points must be strictly ordered.`);
		}
		if (this.triangles = t.dimension === `2d` ? t.triangles.map((e) => [...e]) : [], this.dimension === `2d` && !this.triangles.length) throw RangeError(`2D blend trees require explicit triangle topology.`);
		let i = /* @__PURE__ */ new Set();
		for (let [e, t, n] of this.triangles) {
			for (let r of [
				e,
				t,
				n
			]) {
				if (!Number.isInteger(r) || r < 0 || r >= this.x.length) throw RangeError(`Invalid blend triangle index.`);
				i.add(r);
			}
			let r = (this.x[t] - this.x[e]) * (this.y[n] - this.y[e]) - (this.y[t] - this.y[e]) * (this.x[n] - this.x[e]);
			if (!Number.isFinite(r) || Math.abs(r) < 1e-12) throw RangeError(`Blend triangles cannot be degenerate.`);
		}
		if (this.dimension === `2d` && i.size !== this.x.length) throw RangeError(`Every 2D blend point must belong to a triangle.`);
		let a = t.parameter ?? 0;
		this.setParameter(typeof a == `number` ? a : a.x, typeof a == `number` ? 0 : a.y), this.parameter.x = this.requestedX, this.parameter.y = this.requestedY, this.calculateWeights(), this.actions = t.points.map((n) => {
			let r = e.clipAction(n.clip);
			if (r.playing) throw Error(`Blend leaf is already playing.`);
			return r.mask = t.mask, r.setAdditive(void 0), r;
		}), this.unregister = e.addController(this);
	}
	setParameter(e, t = 0) {
		if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError(`Blend parameters must be finite.`);
		return this.requestedX = e, this.requestedY = t, this;
	}
	get normalizedTime() {
		return this.phase <= 1 ? this.phase : 2 - this.phase;
	}
	set normalizedTime(e) {
		if (!Number.isFinite(e) || e < 0 || e > 1) throw RangeError(`Blend normalized time must be in [0, 1].`);
		this.phase = e;
	}
	play() {
		if (this.destroyed) throw Error(`AnimationBlendTree is destroyed.`);
		this.playing = !0;
		for (let e of this.actions) e.play(), this.mixer.raise(e);
		return this;
	}
	pause() {
		this.playing = !1;
		for (let e of this.actions) e.playing = !1;
		return this;
	}
	stop() {
		this.pause(), this.phase = 0;
		for (let e of this.actions) e.stop();
		return this;
	}
	evaluate(e) {
		if (!this.playing || this.destroyed) return;
		let t = !1;
		for (let e = 0; e < this.actions.length; e++) if (this.actions[e].playing) {
			t = !0;
			break;
		}
		if (!t) {
			this.playing = !1;
			return;
		}
		if (!Number.isFinite(this.timeScale)) throw RangeError(`Blend time scale must be finite.`);
		let n = this.smoothing === 0 ? 1 : -Math.expm1(-e / this.smoothing);
		this.parameter.x += (this.requestedX - this.parameter.x) * n, this.parameter.y += (this.requestedY - this.parameter.y) * n, this.calculateWeights();
		let r = 0;
		for (let e = 0; e < this.actions.length; e++) r += this.weights[e] * this.actions[e].clip.duration;
		let i = 0;
		for (let e = 0; e < this.actions.length; e++) {
			let t = this.actions[e];
			i += this.weights[e], t.weight = i > 0 ? this.weights[e] / i : 0, t.loopMode = this.loopMode, t.time = this.phase * t.clip.duration, t.timeScale = this.timeScale * t.clip.duration / r, t.play();
		}
		let a = this.phase + e * this.timeScale / r;
		if (!Number.isFinite(a)) throw RangeError(`Blend time overflow.`);
		if (this.loopMode === `once`) this.phase = Math.max(0, Math.min(1, a)), (this.timeScale >= 0 && a >= 1 || this.timeScale < 0 && a <= 0) && (this.playing = !1);
		else {
			let e = this.loopMode === `pingpong` ? 2 : 1;
			this.phase = (a % e + e) % e;
		}
	}
	calculateWeights() {
		this.weights.fill(0);
		let e = this.parameter.x, t = this.parameter.y;
		if (this.dimension === `1d`) {
			if (e <= this.x[0]) {
				this.weights[0] = 1;
				return;
			}
			let t = this.x.length - 1;
			if (e >= this.x[t]) {
				this.weights[t] = 1;
				return;
			}
			for (let n = 1; n <= t; n++) {
				if (e > this.x[n]) continue;
				let t = (e - this.x[n - 1]) / (this.x[n] - this.x[n - 1]);
				this.weights[n - 1] = 1 - t, this.weights[n] = t;
				return;
			}
		}
		let n = 1 / 0, r = 0, i = 0, a = 0;
		for (let o = 0; o < this.triangles.length; o++) {
			let s = this.triangles[o], c = s[0], l = s[1], u = s[2], d = this.x[l] - this.x[c], f = this.y[l] - this.y[c], p = this.x[u] - this.x[c], m = this.y[u] - this.y[c], h = e - this.x[c], g = t - this.y[c], _ = d * m - f * p, v = (h * m - g * p) / _, y = (d * g - f * h) / _, b = 1 - v - y;
			if (b >= 0 && v >= 0 && y >= 0) {
				this.weights[c] = b, this.weights[l] = v, this.weights[u] = y;
				return;
			}
			for (let o = 0; o < 3; o++) {
				let s = o === 0 ? c : o === 1 ? l : u, d = o === 0 ? l : o === 1 ? u : c, f = this.x[d] - this.x[s], p = this.y[d] - this.y[s], m = Math.max(0, Math.min(1, ((e - this.x[s]) * f + (t - this.y[s]) * p) / (f * f + p * p))), h = Math.hypot(this.x[s] + f * m - e, this.y[s] + p * m - t);
				h < n && (n = h, r = s, i = d, a = m);
			}
		}
		this.weights[r] = 1 - a, this.weights[i] = a;
	}
	destroy() {
		this.destroyed ||= (this.stop(), this.unregister(), !0);
	}
};
//#endregion
exports.AnimationBlendTree = AnimationBlendTree;

//# sourceMappingURL=animation-blend-tree.cjs.map