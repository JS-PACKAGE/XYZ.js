const require_math3d = require("../../math/src/math3d.cjs");
const require_index = require("../../math/src/index.cjs");
//#region dist/packages/core/src/physics-presentation.js
var PhysicsPresentation2D = class {
	previous = /* @__PURE__ */ new Float64Array(3);
	current = /* @__PURE__ */ new Float64Array(3);
	display = new require_index.Transform2D();
	sealed = !1;
	capture(e) {
		this.previous[0] = e.position.x, this.previous[1] = e.position.y, this.previous[2] = e.rotation, this.sealed = !1;
	}
	seal(e) {
		this.current[0] = e.position.x, this.current[1] = e.position.y, this.current[2] = e.rotation, this.sealed = !0;
	}
	matrix(e, t) {
		let { position: n, rotation: r } = e;
		if (!this.sealed || n.x !== this.current[0] || n.y !== this.current[1] || r !== this.current[2]) return e.updateMatrix();
		this.display.position.set(this.previous[0] + (n.x - this.previous[0]) * t, this.previous[1] + (n.y - this.previous[1]) * t);
		let i = Math.atan2(Math.sin(r - this.previous[2]), Math.cos(r - this.previous[2]));
		return this.display.rotation = this.previous[2] + i * t, this.display.scale.set(e.scale.x, e.scale.y), this.display.pivot.set(e.pivot.x, e.pivot.y), this.display.skew.set(e.skew.x, e.skew.y), this.display.updateMatrix();
	}
};
var PhysicsPresentation3D = class {
	previous = /* @__PURE__ */ new Float64Array(7);
	current = /* @__PURE__ */ new Float64Array(7);
	display = new require_math3d.Transform3D();
	sealed = !1;
	copy(e, t) {
		t[0] = e.position.x, t[1] = e.position.y, t[2] = e.position.z, t[3] = e.rotation.x, t[4] = e.rotation.y, t[5] = e.rotation.z, t[6] = e.rotation.w;
	}
	capture(e) {
		this.copy(e, this.previous), this.sealed = !1;
	}
	seal(e) {
		this.copy(e, this.current), this.sealed = !0;
	}
	matrix(e, t) {
		let n = e.position, r = e.rotation, i = this.current, a = this.previous;
		if (!this.sealed || n.x !== i[0] || n.y !== i[1] || n.z !== i[2] || r.x !== i[3] || r.y !== i[4] || r.z !== i[5] || r.w !== i[6]) return e.updateMatrix();
		this.display.position.set(a[0] + (n.x - a[0]) * t, a[1] + (n.y - a[1]) * t, a[2] + (n.z - a[2]) * t);
		let o = a[3] * r.x + a[4] * r.y + a[5] * r.z + a[6] * r.w, s = o < 0 ? -1 : 1;
		o = Math.min(1, Math.max(0, Math.abs(o)));
		let c = 1 - t, l = t;
		if (o < .9995) {
			let e = Math.acos(o), n = 1 / Math.sin(e);
			c = Math.sin((1 - t) * e) * n, l = Math.sin(t * e) * n;
		}
		return l *= s, this.display.rotation.set(a[3] * c + r.x * l, a[4] * c + r.y * l, a[5] * c + r.z * l, a[6] * c + r.w * l).normalize(), this.display.scale.set(e.scale.x, e.scale.y, e.scale.z), this.display.updateMatrix();
	}
};
//#endregion
exports.PhysicsPresentation2D = PhysicsPresentation2D;
exports.PhysicsPresentation3D = PhysicsPresentation3D;

//# sourceMappingURL=physics-presentation.cjs.map