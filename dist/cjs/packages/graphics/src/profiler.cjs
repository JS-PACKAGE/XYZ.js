const require_observability = require("../../../src/data/observability.cjs");
//#region dist/packages/graphics/src/profiler.js
var Profiler = class {
	renderer;
	enabled;
	windowFrames;
	hitchMilliseconds;
	samples;
	count = 0;
	cursor = 0;
	frames = 0;
	hitches = 0;
	previousTimestamp;
	start;
	interval = NaN;
	gpuFrame = null;
	constructor(t, n = {}) {
		if (this.renderer = t, this.enabled = n.enabled ?? !1, this.windowFrames = n.windowFrames ?? require_observability.profilerDefaults.windowFrames, this.hitchMilliseconds = n.hitchMilliseconds ?? require_observability.profilerDefaults.hitchMilliseconds, !Number.isSafeInteger(this.windowFrames) || this.windowFrames < 1 || this.windowFrames > require_observability.profilerDefaults.maximumWindowFrames) throw RangeError(`Profiler windowFrames must be an integer from 1 to 65536.`);
		if (!Number.isFinite(this.hitchMilliseconds) || this.hitchMilliseconds <= 0) throw RangeError(`Profiler hitchMilliseconds must be positive and finite.`);
		this.samples = new Float64Array(this.windowFrames * 4), this.samples.fill(NaN), t.profiler = this;
	}
	beginFrame(e) {
		if (!this.enabled) {
			this.suspend();
			return;
		}
		if (!Number.isFinite(e)) throw RangeError(`RAF timestamp must be finite.`);
		this.interval = this.previousTimestamp === void 0 || e < this.previousTimestamp ? NaN : e - this.previousTimestamp, this.previousTimestamp = e, this.start = performance.now();
	}
	endFrame() {
		if (!this.enabled || this.start === void 0) return;
		let e = this.renderer.stats, t = this.cursor * 4;
		this.samples[t] = performance.now() - this.start, this.samples[t + 1] = e.cpuSubmitMs ?? NaN, this.samples[t + 2] = this.interval;
		let n = e.gpuTiming;
		this.samples[t + 3] = n.status === `available` && n.sampledFrame !== this.gpuFrame ? n.milliseconds ?? NaN : NaN, n.status === `available` && (this.gpuFrame = n.sampledFrame), this.interval > this.hitchMilliseconds && this.hitches++, this.cursor = (this.cursor + 1) % this.windowFrames, this.count = Math.min(this.count + 1, this.windowFrames), this.frames++, this.start = void 0;
	}
	suspend() {
		this.previousTimestamp = void 0, this.start = void 0;
	}
	destroy() {
		this.renderer.profiler === this && delete this.renderer.profiler, this.enabled = !1, this.suspend();
	}
	report() {
		let distribution = (e) => {
			let t = [];
			for (let n = 0; n < this.count; n++) {
				let r = this.samples[n * 4 + e];
				Number.isFinite(r) && t.push(r);
			}
			t.sort((e, t) => e - t);
			let quantile = (e) => t.length ? t[Math.max(0, Math.ceil(t.length * e) - 1)] : null;
			return {
				samples: t.length,
				p50: quantile(.5),
				p95: quantile(.95),
				max: quantile(1)
			};
		}, e = this.renderer.stats, t = this.renderer.residency, n = 0, r = 0;
		for (let e = 0; e < this.count; e++) {
			let t = this.samples[e * 4 + 2];
			Number.isFinite(t) && t > 0 && (n += t, r++);
		}
		return {
			frames: this.frames,
			windowFrames: this.count,
			hitches: this.hitches,
			cpuFrameMs: distribution(0),
			cpuSubmitMs: distribution(1),
			rafIntervalMs: distribution(2),
			gpuMs: distribution(3),
			rafFps: r ? r * 1e3 / n : null,
			presentationFps: null,
			gpuFps: null,
			jsAllocations: null,
			gpuTiming: { ...e.gpuTiming },
			latest: {
				drawCalls: e.drawCalls + e.drawCalls2D + e.shadowDrawCalls,
				triangles: e.triangles,
				uploadBytes: e.uploadBytes,
				shadowPasses: e.shadowPasses ?? null,
				textureBytes: t.textures.liveBytes,
				geometryBytes: t.geometry.liveBytes,
				trackedGpuBytes: t.textures.liveBytes + t.geometry.liveBytes + e.renderTargetBytes
			}
		};
	}
	format() {
		let e = this.report(), ms = (e) => e === null ? `unavailable` : `${e.toFixed(2)} ms`;
		return `Profiler: ${e.frames} frames, ${e.hitches} hitches\nCPU frame p50/p95/max: ${ms(e.cpuFrameMs.p50)} / ${ms(e.cpuFrameMs.p95)} / ${ms(e.cpuFrameMs.max)}\nCPU submit p95: ${ms(e.cpuSubmitMs.p95)}; GPU p95: ${ms(e.gpuMs.p95)} (${e.gpuTiming.status})\nRAF cadence: ${e.rafFps?.toFixed(2) ?? `unavailable`} Hz; presentation/GPU FPS and JS allocations: unavailable\nDraws: ${e.latest.drawCalls}; triangles: ${e.latest.triangles}; uploads: ${e.latest.uploadBytes} B; tracked GPU: ${e.latest.trackedGpuBytes} B`;
	}
};
//#endregion
exports.Profiler = Profiler;

//# sourceMappingURL=profiler.cjs.map