const require_observability = require("../../../src/data/observability.cjs");
//#region dist/packages/graphics/src/gpu-timing.js
function configureGpuTiming(t, n) {
	let integer = (e, t, n, r) => {
		if (!Number.isSafeInteger(t) || t < n || t > r) throw RangeError(`${e} must be an integer in [${n}, ${r}].`);
		return t;
	};
	return t.maxInFlight = integer(`gpuTiming.maxInFlight`, n.maxInFlight ?? require_observability.gpuTimingDefaults.maxInFlight, 1, require_observability.gpuTimingDefaults.maxInFlightLimit), t.warmupFrames = integer(`gpuTiming.warmupFrames`, n.warmupFrames ?? require_observability.gpuTimingDefaults.warmupFrames, 0, 2 ** 53 - 1), t.sampleInterval = integer(`gpuTiming.sampleInterval`, n.sampleInterval ?? require_observability.gpuTimingDefaults.sampleInterval, 1, 2 ** 53 - 1), n.enabled && t.unavailable(`pending`, `Waiting for warmup and an asynchronous GPU sample.`), n.enabled === !0;
}
var t = /* @__PURE__ */ new WeakMap();
function nativePassDurationNanoseconds(e) {
	if (!e.length || e.length % 2) return null;
	let t = 0n;
	for (let n = 0; n < e.length; n += 2) {
		let r = e[n], i = e[n + 1];
		if (i < r || r === 0n && i === 0n) return null;
		t += i - r;
	}
	return t > 0n && t <= 9007199254740991n ? t : null;
}
function beginTimedRenderPass(e, n) {
	let r = n.timestampWrites, i = t.get(e)?.nextPass();
	i && !r && (n.timestampWrites = i);
	try {
		return e.beginRenderPass(n);
	} finally {
		r ? n.timestampWrites = r : delete n.timestampWrites, i && r && t.get(e)?.conflict();
	}
}
function beginTimedComputePass(e, n) {
	let r = n.timestampWrites, i = t.get(e)?.nextPass();
	i && !r && (n.timestampWrites = i);
	try {
		return e.beginComputePass(n);
	} finally {
		r ? n.timestampWrites = r : delete n.timestampWrites, i && r && t.get(e)?.conflict();
	}
}
var WebGpuTimer = class {
	stats;
	slots = [];
	active;
	encoder;
	destroyed = !1;
	constructor(t, n) {
		this.stats = t, t.source = `webgpu-timestamp-query`, t.scope = `native-pass-sum`;
		let r = require_observability.gpuTimingDefaults.maxTimedPasses * 2;
		for (let i = 0; i < t.maxInFlight; i++) {
			let i, a, o;
			try {
				i = n.createQuerySet({
					type: `timestamp`,
					count: r
				});
				let t = Math.ceil(r * 8 / 256) * 256;
				a = n.createBuffer({
					size: t,
					usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
				}), o = n.createBuffer({
					size: t,
					usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
				});
				let s = i;
				this.slots.push({
					query: i,
					resolve: a,
					readback: o,
					writes: Array.from({ length: require_observability.gpuTimingDefaults.maxTimedPasses }, (e, t) => ({
						querySet: s,
						beginningOfPassWriteIndex: t * 2,
						endOfPassWriteIndex: t * 2 + 1
					})),
					frame: 0,
					passes: 0,
					overflow: !1,
					busy: !1
				});
			} catch (e) {
				throw o?.destroy(), a?.destroy(), i?.destroy(), this.destroy(), t.unavailable(`error`, `GPU timestamp allocation failed: ${String(e)}`), e;
			}
		}
	}
	begin(e, n) {
		if (this.active && this.abort(), this.destroyed || n <= this.stats.warmupFrames || (n - this.stats.warmupFrames - 1) % this.stats.sampleInterval != 0) return;
		let r;
		for (let e of this.slots) if (!e.busy) {
			r = e;
			break;
		}
		if (!r) {
			this.stats.skipped++;
			return;
		}
		r.busy = !0, r.frame = n, r.passes = 0, r.overflow = !1, this.active = r, this.encoder = e, t.set(e, this), this.stats.pending++;
	}
	nextPass() {
		let e = this.active;
		if (e && !e.overflow) {
			if (e.passes >= e.writes.length) {
				e.overflow = !0;
				return;
			}
			return e.writes[e.passes++];
		}
	}
	conflict() {
		this.active && (this.active.overflow = !0);
	}
	detach() {
		this.encoder && t.delete(this.encoder), this.encoder = void 0;
	}
	end(e) {
		let t = this.active;
		if (this.detach(), !t) return;
		if (!t.passes || t.overflow) {
			this.stats.skipped++, this.stats.unavailable(`pending`, t.overflow ? `Native pass timestamp capacity exceeded or descriptor already owns timestamps; no partial duration reported.` : `No timed native render/compute passes in this frame.`), t.busy = !1, this.active = void 0, this.stats.pending--;
			return;
		}
		let n = t.passes * 2;
		e.resolveQuerySet(t.query, 0, n, t.resolve, 0), e.copyBufferToBuffer(t.resolve, 0, t.readback, 0, n * 8);
	}
	submitted() {
		let e = this.active;
		if (this.detach(), this.active = void 0, !e) return;
		let t = e.passes * 16;
		e.readback.mapAsync(GPUMapMode.READ, 0, t).then(() => {
			if (!this.destroyed) try {
				let n = nativePassDurationNanoseconds(new BigUint64Array(e.readback.getMappedRange(0, t)));
				n === null ? (this.stats.invalid++, this.stats.unavailable(`pending`, `Real native pass timestamps were zero, reversed, quantized to zero or outside exact duration range. Run the engine-free timestamp probe for this adapter/browser session; no timing fallback.`)) : this.stats.sample(e.frame, Number(n) / 1e6);
			} finally {
				e.readback.unmap(), e.busy = !1, this.stats.pending--;
			}
		}).catch((t) => {
			this.destroyed || (e.busy && (e.busy = !1, this.stats.pending--), this.stats.invalid++, this.stats.unavailable(`error`, `GPU timestamp readback failed: ${String(t)}`));
		});
	}
	abort() {
		this.detach(), this.active && (this.active.busy = !1, this.active = void 0, this.stats.pending--, this.stats.invalid++);
	}
	destroy(e = !1) {
		if (!this.destroyed) {
			this.destroyed = !0, this.detach(), this.active = void 0;
			for (let e of this.slots) e.readback.destroy(), e.resolve.destroy(), e.query.destroy();
			this.slots.length = 0, this.stats.pending = 0, this.stats.unavailable(e ? `lost` : `disabled`, e ? `WebGPU device was lost.` : `GPU timing resources were destroyed.`);
		}
	}
};
var WebGlTimer = class {
	stats;
	gl;
	extension;
	slots = [];
	active;
	destroyed = !1;
	disjoint = !1;
	constructor(e, t, n) {
		this.stats = e, this.gl = t, this.extension = n, e.source = `webgl2-disjoint-query`, e.scope = `native-command-interval`;
		for (let n = 0; n < e.maxInFlight; n++) {
			let e = t.createQuery();
			if (!e) throw this.destroy(), Error(`Could not allocate GPU timer query.`);
			this.slots.push({
				query: e,
				frame: 0,
				busy: !1
			});
		}
	}
	begin(e) {
		if (this.poll(), this.destroyed || this.disjoint || e <= this.stats.warmupFrames || (e - this.stats.warmupFrames - 1) % this.stats.sampleInterval != 0) return;
		let t;
		for (let e of this.slots) if (!e.busy) {
			t = e;
			break;
		}
		if (!t) {
			this.stats.skipped++;
			return;
		}
		t.busy = !0, t.frame = e, this.active = t, this.stats.pending++, this.gl.beginQuery(this.extension.TIME_ELAPSED_EXT, t.query);
	}
	end() {
		this.active &&= (this.gl.endQuery(this.extension.TIME_ELAPSED_EXT), void 0);
	}
	poll() {
		if (this.destroyed) return;
		let e = !!this.gl.getParameter(this.extension.GPU_DISJOINT_EXT);
		this.disjoint = e, e && (this.stats.unavailable(`disjoint`, `GPU clock became disjoint; outstanding samples were discarded.`), this.stats.invalid++);
		for (let t of this.slots) if (t.busy && t !== this.active && (e || this.gl.getQueryParameter(t.query, this.gl.QUERY_RESULT_AVAILABLE))) {
			if (!e) {
				let e = this.gl.getQueryParameter(t.query, this.gl.QUERY_RESULT);
				this.stats.sample(t.frame, e / 1e6);
			}
			t.busy = !1, this.stats.pending--;
		}
	}
	abort() {
		let e = this.active;
		e && (this.end(), e.busy = !1, this.stats.pending--, this.stats.invalid++);
	}
	destroy(e = !1) {
		if (!this.destroyed) {
			this.destroyed = !0, this.end();
			for (let e of this.slots) this.gl.deleteQuery(e.query);
			this.slots.length = 0, this.stats.pending = 0, this.stats.unavailable(e ? `lost` : `disabled`, e ? `WebGL context was lost.` : `GPU timing resources were destroyed.`);
		}
	}
};
//#endregion
exports.WebGlTimer = WebGlTimer;
exports.WebGpuTimer = WebGpuTimer;
exports.beginTimedComputePass = beginTimedComputePass;
exports.beginTimedRenderPass = beginTimedRenderPass;
exports.configureGpuTiming = configureGpuTiming;
exports.nativePassDurationNanoseconds = nativePassDurationNanoseconds;

//# sourceMappingURL=gpu-timing.cjs.map