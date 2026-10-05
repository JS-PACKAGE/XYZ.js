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
	begin(e, t, n, r, i, a = n / r) {
		if (!Number.isInteger(n) || !Number.isInteger(r) || n < 1 || r < 1) throw RangeError(`Temporal viewport must be positive integer dimensions.`);
		let o = t.position, s = t.rotation, c = `fov` in t ? t.fov : t.height / t.zoom, l = Math.hypot(o.x - this.previousPosition[0], o.y - this.previousPosition[1], o.z - this.previousPosition[2]), u = Math.abs(s.x * this.previousRotation[0] + s.y * this.previousRotation[1] + s.z * this.previousRotation[2] + s.w * this.previousRotation[3]);
		(e !== this.scene || t !== this.camera || n !== this.width || r !== this.height || a !== this.aspect || i.taa !== this.enabled || l > i.taaCameraCutDistance || u < .5 || t.near !== this.near || t.far !== this.far || c !== this.projectionScale) && this.invalidate(), this.scene = e, this.camera = t, this.width = n, this.height = r, this.enabled = i.taa, this.near = t.near, this.far = t.far, this.projectionScale = c, this.aspect = a, this.cameraPosition[0] = o.x, this.cameraPosition[1] = o.y, this.cameraPosition[2] = o.z, this.projection.copy(t.updateMatrix(a)), this.currentVP.copy(this.projection), this.jitter[0] = i.taa ? (halton(this.sample + 1, 2) - .5) * 2 / n : 0, this.jitter[1] = i.taa ? (halton(this.sample + 1, 3) - .5) * 2 / r : 0;
		let d = this.currentVP.elements;
		for (let e = 0; e < 4; e++) {
			let t = e * 4;
			d[t] = d[t] + this.jitter[0] * d[t + 3], d[t + 1] = d[t + 1] + this.jitter[1] * d[t + 3];
		}
		return this.inverseVP.copy(this.currentVP).invert(), this.currentVP;
	}
	commit() {
		if (this.previousVP.copy(this.currentVP), this.previousPosition.set(this.cameraPosition), this.camera) {
			let e = this.camera.rotation;
			this.previousRotation[0] = e.x, this.previousRotation[1] = e.y, this.previousRotation[2] = e.z, this.previousRotation[3] = e.w;
		}
		this.historyValid = this.enabled, this.sample = (this.sample + 1) % 1024;
	}
	invalidate() {
		this.historyValid = !1, this.sample = 0;
	}
};
function writeTemporalUniforms(e, t, n) {
	e.set(t.currentVP.elements, 0), e.set(t.inverseVP.elements, 16), e.set(t.previousVP.elements, 32), e[48] = t.cameraPosition[0], e[49] = t.cameraPosition[1], e[50] = t.cameraPosition[2], e[51] = t.historyValid ? n.taaHistoryWeight : 0, e[52] = n.taaDepthThreshold, e[53] = n.ssrSteps, e[54] = n.ssrThickness, e[55] = n.ssrMaxDistance, e[56] = n.ssrRoughness, e[57] = n.ssrStrength, e[58] = t.width, e[59] = t.height;
}
//#endregion
exports.TemporalPostState = TemporalPostState;
exports.writeTemporalUniforms = writeTemporalUniforms;

//# sourceMappingURL=temporal-post.cjs.map