const require_math3d = require("../../math/src/math3d.cjs");
const require_object3d = require("./object3d.cjs");
const require_render_bounds = require("./render-bounds.cjs");
const require_mesh = require("./mesh.cjs");
const require_orthographic_camera = require("./orthographic-camera.cjs");
const require_instanced_mesh = require("./instanced-mesh.cjs");
//#region dist/packages/core/src/raycaster.js
function nearestFirst(e, t) {
	return e.distance - t.distance;
}
var Raycaster = class {
	origin = new require_math3d.Vector3();
	direction = new require_math3d.Vector3(0, 0, -1);
	near = 0;
	far = 1 / 0;
	inverse = new require_math3d.Matrix4();
	instance = new require_math3d.Matrix4();
	world = new require_math3d.Matrix4();
	localOrigin = new require_math3d.Vector3();
	localDirection = new require_math3d.Vector3();
	visited = /* @__PURE__ */ new Set();
	bounds = {
		x: 0,
		y: 0,
		z: 0,
		radius: 0
	};
	setFromCamera(e, t, n, r) {
		if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError(`Raycaster NDC coordinates must be finite.`);
		return this.inverse.copy(n.updateMatrix(r)).invert(), this.localOrigin.set(e, t, 0), this.inverse.transformPoint(this.localOrigin, this.localOrigin), this.direction.set(e, t, .5), this.inverse.transformPoint(this.direction, this.direction), n instanceof require_orthographic_camera.OrthographicCamera ? (this.direction.subtract(this.localOrigin).normalize(), this.origin.copy(this.localOrigin), this.origin.x -= this.direction.x * n.near, this.origin.y -= this.direction.y * n.near, this.origin.z -= this.direction.z * n.near) : (this.origin.copy(n.position), this.direction.subtract(this.origin).normalize()), this;
	}
	intersectObjects(e, t = !0, n = []) {
		if (!Number.isFinite(this.near) || this.near < 0 || !(this.far >= this.near) || !Number.isFinite(this.origin.x) || !Number.isFinite(this.origin.y) || !Number.isFinite(this.origin.z) || !Number.isFinite(this.direction.x) || !Number.isFinite(this.direction.y) || !Number.isFinite(this.direction.z) || this.direction.length() === 0) throw RangeError(`Raycaster requires a finite origin, nonzero direction and 0 <= near <= far.`);
		this.direction.normalize(), n.length = 0;
		try {
			for (let r of e) r instanceof require_object3d.Object3D && this.intersectObject(r, t, n);
			return n.sort(nearestFirst), n;
		} finally {
			this.visited.clear();
		}
	}
	intersectObject(e, t, i) {
		if (this.visited.has(e) || (this.visited.add(e), e.destroyed || !e.worldVisible)) return;
		if (e instanceof require_mesh.Mesh) {
			e.updateDeformation();
			let t = e.updateWorldMatrix();
			if (e instanceof require_instanced_mesh.InstancedMesh) for (let n = 0; n < e.count; n++) e.getMatrixAt(n, this.instance), this.world.copy(t).multiply(this.instance), this.intersectMesh(e, this.world, i, n);
			else this.intersectMesh(e, t, i);
		}
		let a = t ? e.existingChildren : void 0;
		if (a) for (let e of a) this.intersectObject(e, !0, i);
	}
	intersectMesh(e, n, r, i) {
		let a = n.elements, s = require_render_bounds.transformSphere(e.geometry.boundingSphere, n, this.bounds), c = s.x - this.origin.x, l = s.y - this.origin.y, u = s.z - this.origin.z, d = this.direction, f = l * d.z - u * d.y, p = u * d.x - c * d.z, m = c * d.y - l * d.x, h = s.radius * 1.000001 + 1e-6 * (1 + Math.abs(c) + Math.abs(l) + Math.abs(u));
		if (f * f + p * p + m * m > h * h) return;
		let g = a[0] * (a[5] * a[10] - a[6] * a[9]) - a[4] * (a[1] * a[10] - a[2] * a[9]) + a[8] * (a[1] * a[6] - a[2] * a[5]);
		if (!Number.isFinite(g)) return;
		let _ = g === 0;
		if (_) this.localOrigin.copy(this.origin), this.localDirection.copy(this.direction);
		else {
			this.inverse.copy(n).invert(), this.inverse.transformPoint(this.origin, this.localOrigin);
			let e = this.inverse.elements, t = this.direction;
			this.localDirection.set(e[0] * t.x + e[4] * t.y + e[8] * t.z, e[1] * t.x + e[5] * t.y + e[9] * t.z, e[2] * t.x + e[6] * t.y + e[10] * t.z);
		}
		let v = this.localOrigin.x, y = this.localOrigin.y, b = this.localOrigin.z, x = this.localDirection.x, S = this.localDirection.y, C = this.localDirection.z, { vertices: w, indices: T } = e.geometry;
		for (let n = 0; n < T.length; n += 3) {
			let o = T[n] * 8, s = T[n + 1] * 8, c = T[n + 2] * 8, l = w[o], u = w[o + 1], d = w[o + 2], f = w[s], p = w[s + 1], m = w[s + 2], h = w[c], g = w[c + 1], E = w[c + 2];
			if (_) {
				let e = a[0] * l + a[4] * u + a[8] * d + a[12], t = a[1] * l + a[5] * u + a[9] * d + a[13], n = a[2] * l + a[6] * u + a[10] * d + a[14], r = a[0] * f + a[4] * p + a[8] * m + a[12], i = a[1] * f + a[5] * p + a[9] * m + a[13], o = a[2] * f + a[6] * p + a[10] * m + a[14], s = a[0] * h + a[4] * g + a[8] * E + a[12], c = a[1] * h + a[5] * g + a[9] * E + a[13], _ = a[2] * h + a[6] * g + a[10] * E + a[14];
				l = e, u = t, d = n, f = r, p = i, m = o, h = s, g = c, E = _;
			}
			let D = f - l, O = p - u, k = m - d, A = h - l, j = g - u, M = E - d, N = S * M - C * j, P = C * A - x * M, F = x * j - S * A, I = D * N + O * P + k * F;
			if (I === 0 || !Number.isFinite(I)) continue;
			let L = v - l, R = y - u, z = b - d, B = (L * N + R * P + z * F) / I;
			if (B < -1e-10 || B > 1 + 1e-10) continue;
			let V = R * k - z * O, H = z * D - L * k, U = L * O - R * D, W = (x * V + S * H + C * U) / I;
			if (W < -1e-10 || B + W > 1 + 1e-10) continue;
			let G = (A * V + j * H + M * U) / I;
			if (!Number.isFinite(G) || G < this.near || G > this.far) continue;
			let K = {
				object: e,
				distance: G,
				point: new require_math3d.Vector3(this.origin.x + this.direction.x * G, this.origin.y + this.direction.y * G, this.origin.z + this.direction.z * G),
				faceIndex: n / 3
			};
			i !== void 0 && (K.instanceId = i), r.push(K);
		}
	}
};
//#endregion
exports.Raycaster = Raycaster;

//# sourceMappingURL=raycaster.cjs.map