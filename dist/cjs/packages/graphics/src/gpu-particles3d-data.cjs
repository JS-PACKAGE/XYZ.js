const require_math3d = require("../../math/src/math3d.cjs");
//#region dist/packages/graphics/src/gpu-particles3d-data.js
var ParticleUniforms3D = class {
	data = /* @__PURE__ */ new Float32Array(68);
	words = new Uint32Array(this.data.buffer);
	cameraPose = new require_math3d.Matrix4();
	unit = new require_math3d.Vector3(1, 1, 1);
	fill(e, t, n, r) {
		let i = this.data;
		i.set(t.updateMatrix(n).elements, 0), i.set(e.updateWorldMatrix().elements, 16);
		let a = this.cameraPose.compose(t.position, t.rotation, this.unit).elements;
		return i[32] = a[0], i[33] = a[1], i[34] = a[2], i[36] = a[4], i[37] = a[5], i[38] = a[6], i[40] = e.shaderTime, i[41] = e.lifetime, i[42] = +(e.space === `world`), i[43] = +!!r, i.set(e.velocityMin, 44), i.set(e.velocityMax, 48), i.set(e.gravity, 52), i.set(e.startColor, 56), i.set(e.endColor, 60), i[64] = e.startSize, i[65] = e.endSize, this.words[66] = e.seed, i;
	}
};
//#endregion
exports.ParticleUniforms3D = ParticleUniforms3D;

//# sourceMappingURL=gpu-particles3d-data.cjs.map