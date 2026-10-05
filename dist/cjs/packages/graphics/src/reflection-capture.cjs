const require_errors = require("./errors.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_perspective_camera = require("../../core/src/perspective-camera.cjs");
const require_environment = require("../../core/src/environment.cjs");
//#region dist/packages/graphics/src/reflection-capture.js
function captureConfiguration(e, t = {}) {
	e.validate();
	let r = t.size ?? e.captureSize, i = t.near ?? .1, a = t.far ?? 100, o = t.maxBytes ?? require_rendering.reflectionCaptureLimits.maximumBytes, s = r * r * 96 + Math.ceil(r * 8 / 256) * 256 * r * 6;
	if (!Number.isInteger(r) || r < 2 || r > require_rendering.reflectionCaptureLimits.maximumSize || !Number.isFinite(i) || !Number.isFinite(a) || i <= 0 || a <= i || !Number.isSafeInteger(o) || o < s) throw RangeError(`Reflection capture requires size 2..512, 0 < near < far, and sufficient maxBytes.`);
	return t.signal?.throwIfAborted(), {
		size: r,
		near: i,
		far: a,
		bytes: s
	};
}
function encodeProbeFaces(t, n, i, a) {
	if (t.destroyed) throw new require_errors.GraphicsError(`Cannot capture a destroyed scene.`);
	let { near: o, far: s } = captureConfiguration(n, i), c = new require_perspective_camera.PerspectiveCamera();
	c.fov = Math.PI / 2, c.near = o, c.far = s, c.position.copy(n.position);
	let l = t.camera3D, u = t.background, d = t.postProcessing, f = t.renderGraph, p = d.enabled, m = d.taa, h = d.ssr, g = t.reflectionProbes.map((e) => [e, e.enabled]), _ = (i.exclude ?? []).map((e) => [e, e.visible]), v = Math.SQRT1_2, y = [
		[
			0,
			-v,
			0,
			v
		],
		[
			0,
			v,
			0,
			v
		],
		[
			v,
			0,
			0,
			v
		],
		[
			-v,
			0,
			0,
			v
		],
		[
			0,
			1,
			0,
			0
		],
		[
			0,
			0,
			0,
			1
		]
	];
	try {
		t.camera3D = c, i.includeBackground === !1 && (t.background = void 0), d.enabled = d.taa = d.ssr = !1, t.renderGraph = void 0;
		for (let [e] of g) e.enabled = !1;
		for (let [e] of _) e.visible = !1;
		for (let e = 0; e < 6; e++) {
			i.signal?.throwIfAborted();
			let t = y[e];
			c.rotation.set(t[0], t[1], t[2], t[3]), c.updateMatrix(1), a(e, c);
		}
	} finally {
		t.camera3D = l, t.background = u, d.enabled = p, d.taa = m, d.ssr = h, t.renderGraph = f;
		for (let [e, t] of g) e.enabled = t;
		for (let [e, t] of _) e.visible = t;
	}
}
function halfFloat(e) {
	let t = e & 32768 ? -1 : 1, n = e >> 10 & 31, r = e & 1023;
	return n === 0 ? t * r * 2 ** -24 : n === 31 ? r ? NaN : t * (1 / 0) : t * (1 + r / 1024) * 2 ** (n - 15);
}
function capturedEnvironment(e, n, r) {
	return r?.throwIfAborted(), require_environment.EnvironmentMap.fromCubemap(e, n, 4);
}
var ProbeCaptureScheduler = class {
	next = /* @__PURE__ */ new WeakMap();
	pending = !1;
	schedule(e, t, n) {
		if (this.pending || e.destroyed) return;
		let r = e.presentationTime;
		for (let i of e.reflectionProbes) if (!(!i.enabled || !i.dynamic || r < (this.next.get(i) ?? -1 / 0))) {
			this.next.set(i, r + i.captureInterval), this.pending = !0, t(i).then((t) => {
				!e.destroyed && e.reflectionProbes.includes(i) && i.enabled && i.dynamic ? i.adoptCapture(t) : t.destroy();
			}, n).finally(() => {
				this.pending = !1;
			});
			break;
		}
	}
};
//#endregion
exports.ProbeCaptureScheduler = ProbeCaptureScheduler;
exports.captureConfiguration = captureConfiguration;
exports.capturedEnvironment = capturedEnvironment;
exports.encodeProbeFaces = encodeProbeFaces;
exports.halfFloat = halfFloat;

//# sourceMappingURL=reflection-capture.cjs.map