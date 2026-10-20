const require_hypot = require("../../math/src/hypot.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
//#region dist/packages/graphics/src/temporal-post.js
function halton(e, t) {
	let n = 0, r = 1;
	for (; e > 0;) r /= t, n += e % t * r, e = Math.floor(e / t);
	return n;
}
var TemporalPostState = class {
	currentVP = new require_math3d.Matrix4();
	inverseVP = new require_math3d.Matrix4();
	previousVP = new require_math3d.Matrix4();
	cameraPosition = /* @__PURE__ */ new Float32Array(3);
	jitter = /* @__PURE__ */ new Float32Array(2);
	historyValid = !1;
	reprojectionValid = !1;
	width = 0;
	height = 0;
	scene;
	camera;
	sample = 0;
	enabled = !1;
	previousPosition = /* @__PURE__ */ new Float32Array(3);
	previousRotation = /* @__PURE__ */ new Float32Array(4);
	projection = new require_math3d.Matrix4();
	near = 0;
	far = 0;
	projectionScale = 0;
	aspect = 0;
	begin(e, n, r, i, a, o = r / i) {
		if (!Number.isInteger(r) || !Number.isInteger(i) || r < 1 || i < 1) throw RangeError(`Temporal viewport must be positive integer dimensions.`);
		let s = n.position, c = n.rotation, l = `fov` in n ? n.fov : n.height / n.zoom, u = require_hypot.hypot3(s.x - this.previousPosition[0], s.y - this.previousPosition[1], s.z - this.previousPosition[2]), d = Math.abs(c.x * this.previousRotation[0] + c.y * this.previousRotation[1] + c.z * this.previousRotation[2] + c.w * this.previousRotation[3]);
		(e !== this.scene || n !== this.camera || r !== this.width || i !== this.height || o !== this.aspect || a.taa !== this.enabled || u > a.taaCameraCutDistance || d < .5 || n.near !== this.near || n.far !== this.far || l !== this.projectionScale) && this.invalidate(), this.scene = e, this.camera = n, this.width = r, this.height = i, this.enabled = a.taa, this.near = n.near, this.far = n.far, this.projectionScale = l, this.aspect = o, this.cameraPosition[0] = s.x, this.cameraPosition[1] = s.y, this.cameraPosition[2] = s.z, this.projection.copy(n.updateMatrix(o)), this.currentVP.copy(this.projection), this.jitter[0] = a.taa ? (halton(this.sample + 1, 2) - .5) * 2 / r : 0, this.jitter[1] = a.taa ? (halton(this.sample + 1, 3) - .5) * 2 / i : 0;
		let f = this.currentVP.elements;
		for (let e = 0; e < 4; e++) {
			let t = e * 4;
			f[t] = f[t] + this.jitter[0] * f[t + 3], f[t + 1] = f[t + 1] + this.jitter[1] * f[t + 3];
		}
		return this.inverseVP.copy(this.currentVP).invert(), this.currentVP;
	}
	commit() {
		if (this.previousVP.copy(this.currentVP), this.previousPosition.set(this.cameraPosition), this.camera) {
			let e = this.camera.rotation;
			this.previousRotation[0] = e.x, this.previousRotation[1] = e.y, this.previousRotation[2] = e.z, this.previousRotation[3] = e.w;
		}
		this.historyValid = this.enabled, this.reprojectionValid = !0, this.sample = (this.sample + 1) % 1024;
	}
	invalidate() {
		this.historyValid = !1, this.reprojectionValid = !1, this.sample = 0;
	}
};
function writeTemporalUniforms(e, t, n) {
	e.set(t.currentVP.elements, 0), e.set(t.inverseVP.elements, 16), e.set(t.previousVP.elements, 32), e[48] = t.cameraPosition[0], e[49] = t.cameraPosition[1], e[50] = t.cameraPosition[2], e[51] = t.historyValid ? n.taaHistoryWeight : 0, e[52] = n.taaDepthThreshold, e[53] = n.ssrSteps, e[54] = n.ssrThickness, e[55] = n.ssrMaxDistance, e[56] = n.ssrRoughness, e[57] = n.ssrStrength, e[58] = t.width, e[59] = t.height;
}
//#endregion
exports.TemporalPostState = TemporalPostState;
exports.writeTemporalUniforms = writeTemporalUniforms;

//# sourceMappingURL=temporal-post.cjs.map