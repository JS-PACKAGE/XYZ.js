const require_math3d = require("../../../math/src/math3d.cjs");
const require_spatial = require("./spatial.cjs");
const require_physics3d = require("../../../../src/data/physics3d.cjs");
//#region dist/packages/core/src/physics3d/collider.js
function finite3D(e, t) {
	if (!Number.isFinite(e)) throw RangeError(`${t} must be finite.`);
	return e;
}
function positive3D(e, t) {
	if (finite3D(e, t) <= 0) throw RangeError(`${t} must be positive.`);
	return e;
}
function nonnegative3D(e, t) {
	if (finite3D(e, t) < 0) throw RangeError(`${t} must be nonnegative.`);
	return e;
}
function vector3D(e, t) {
	finite3D(e.x, `${t}.x`), finite3D(e.y, `${t}.y`), finite3D(e.z, `${t}.z`);
}
var Collider3D = class {
	offset;
	sensor;
	category;
	mask;
	constructor(t = {}) {
		let n = t.offset ?? new require_math3d.Vector3();
		vector3D(n, `offset`), this.offset = Object.freeze(new require_math3d.Vector3(n.x, n.y, n.z)), this.sensor = t.sensor ?? !1, this.category = t.category ?? 1, this.mask = t.mask ?? 4294967295;
		for (let e of [this.category, this.mask]) if (!Number.isInteger(e) || e < 0 || e > 4294967295) throw RangeError(`Collision masks must be uint32.`);
	}
};
var SphereCollider3D = class extends Collider3D {
	kind = `sphere`;
	radius;
	constructor(e, t = {}) {
		super(t), this.radius = positive3D(e, `radius`);
	}
};
var BoxCollider3D = class extends Collider3D {
	kind = `box`;
	halfExtents;
	constructor(t, n = {}) {
		super(n), this.halfExtents = Object.freeze(new require_math3d.Vector3(positive3D(t.x, `halfExtents.x`), positive3D(t.y, `halfExtents.y`), positive3D(t.z, `halfExtents.z`)));
	}
};
var CapsuleCollider3D = class extends Collider3D {
	kind = `capsule`;
	radius;
	height;
	constructor(e, t, n = {}) {
		super(n), this.radius = positive3D(e, `radius`), this.height = nonnegative3D(t, `height`);
	}
};
var PlaneCollider3D = class extends Collider3D {
	kind = `plane`;
	normal;
	constructor(t = new require_math3d.Vector3(0, 1, 0), n = {}) {
		super(n), vector3D(t, `normal`), positive3D(t.length(), `normal length`), this.normal = Object.freeze(new require_math3d.Vector3(t.x, t.y, t.z).normalize());
	}
};
var TriangleMeshCollider3D = class extends Collider3D {
	kind = `mesh`;
	positions;
	indices;
	sidedness;
	constructor(e, t, n = {}) {
		if (super(n), !Number.isInteger(e.length) || !Number.isInteger(t.length) || e.length < 9 || e.length % 3 || e.length > require_physics3d.physics3DDefaults.maxMeshTriangles * 9 || t.length < 3 || t.length % 3 || t.length / 3 > require_physics3d.physics3DDefaults.maxMeshTriangles) throw RangeError(`Mesh requires bounded indexed xyz triangles.`);
		let r = Array.from(e), i = Array.from(t);
		for (let e of r) finite3D(e, `mesh position`);
		for (let e of i) if (!Number.isInteger(e) || e < 0 || e >= r.length / 3) throw RangeError(`Mesh index out of range.`);
		for (let e = 0; e < i.length; e += 3) {
			let t = i[e] * 3, n = i[e + 1] * 3, o = i[e + 2] * 3, s = r[n] - r[t], c = r[n + 1] - r[t + 1], l = r[n + 2] - r[t + 2], u = r[o] - r[t], d = r[o + 1] - r[t + 1], f = r[o + 2] - r[t + 2];
			if (finite3D(Math.hypot(c * f - l * d, l * u - s * f, s * d - c * u), `triangle area`) <= require_physics3d.physics3DDefaults.geometryTolerance) throw RangeError(`Degenerate mesh triangle.`);
		}
		if (this.sidedness = n.sidedness ?? `double`, this.sidedness !== `front` && this.sidedness !== `double`) throw RangeError(`Invalid mesh sidedness.`);
		this.positions = Object.freeze(r), this.indices = Object.freeze(i);
	}
};
var Triangle3D = class {
	order;
	a = new require_math3d.Vector3();
	b = new require_math3d.Vector3();
	c = new require_math3d.Vector3();
	normal = new require_math3d.Vector3();
	bounds = new require_spatial.Bounds3D();
	constructor(e) {
		this.order = e;
	}
};
var CompoundCollider3D = class extends Collider3D {
	kind = `compound`;
	children;
	staticOnly;
	constructor(n, r = {}) {
		if (super(r), !n.length || n.length > require_physics3d.physics3DDefaults.maxCompoundChildren) throw RangeError(`Compound child count exceeds profile.`);
		this.children = Object.freeze(n.map((n) => {
			if (!(n.collider instanceof SphereCollider3D || n.collider instanceof BoxCollider3D || n.collider instanceof CapsuleCollider3D || n.collider instanceof TriangleMeshCollider3D)) throw TypeError(`Compound children require finite primitives or static triangle meshes (no nested compounds).`);
			let r = n.position ?? new require_math3d.Vector3(), i = n.rotation ?? new require_math3d.Quaternion(), o = n.scale ?? new require_math3d.Vector3(1, 1, 1);
			if (vector3D(r, `child position`), vector3D(o, `child scale`), finite3D(i.x, `child rotation.x`), finite3D(i.y, `child rotation.y`), finite3D(i.z, `child rotation.z`), finite3D(i.w, `child rotation.w`), positive3D(o.x, `child scale.x`), positive3D(o.y, `child scale.y`), positive3D(o.z, `child scale.z`), Math.abs(Math.hypot(i.x, i.y, i.z, i.w) - 1) > require_physics3d.physics3DDefaults.transformTolerance) throw RangeError(`Child rotation must be a unit quaternion.`);
			let s = new require_math3d.Vector3(r.x, r.y, r.z), c = new require_math3d.Quaternion(i.x, i.y, i.z, i.w), l = new require_math3d.Vector3(o.x, o.y, o.z);
			if ((n.collider.kind === `sphere` || n.collider.kind === `capsule`) && (Math.abs(o.x - o.y) > require_physics3d.physics3DDefaults.transformTolerance * Math.max(o.x, o.y) || Math.abs(o.x - o.z) > require_physics3d.physics3DDefaults.transformTolerance * Math.max(o.x, o.z))) throw RangeError(`Sphere/capsule children require uniform scale.`);
			return Object.freeze({
				collider: n.collider,
				position: Object.freeze(s),
				rotation: Object.freeze(c),
				scale: Object.freeze(l)
			});
		})), this.staticOnly = this.children.some((e) => e.collider.kind === `mesh`);
	}
};
var Shape3D = class Shape3D {
	collider;
	needsVolume;
	center = new require_math3d.Vector3();
	axes = [
		new require_math3d.Vector3(1, 0, 0),
		new require_math3d.Vector3(0, 1, 0),
		new require_math3d.Vector3(0, 0, 1)
	];
	half = new require_math3d.Vector3();
	start = new require_math3d.Vector3();
	end = new require_math3d.Vector3();
	normal = new require_math3d.Vector3();
	bounds = new require_spatial.Bounds3D();
	vertices = Array.from({ length: 8 }, () => new require_math3d.Vector3());
	triangles = [];
	triangleIndex;
	meshIndexed = !1;
	children = [];
	massCenter = new require_math3d.Vector3();
	volume = 0;
	childLocal = [];
	childWorld;
	radius = 0;
	poseMatrix = (/* @__PURE__ */ new Float64Array(16)).fill(NaN);
	revision = 0;
	inertiaRevision = 0;
	worldScale = new require_math3d.Vector3();
	constructor(e, t = !1) {
		if (this.collider = e, this.needsVolume = t, e instanceof TriangleMeshCollider3D) {
			this.triangleIndex = new require_spatial.SpatialIndex3D();
			for (let t = 0; t < e.indices.length / 3; t++) this.triangles.push(new Triangle3D(t));
		}
		if (e instanceof CompoundCollider3D && (this.childWorld = new require_math3d.Matrix4()), e instanceof CompoundCollider3D) for (let t of e.children) this.children.push(new Shape3D(t.collider, !0)), this.childLocal.push(new require_math3d.Matrix4().compose(t.position, t.rotation, t.scale));
	}
	refresh(e) {
		return this.refreshMatrix(e.updateWorldMatrix());
	}
	refreshMatrix(e) {
		let t = e.elements, n = !1, r = !1;
		for (let e = 0; e < 16; e++) this.poseMatrix[e] !== t[e] && (n = !0, e < 12 && (r = !0));
		if (!n) return !1;
		this.poseMatrix[0] = NaN;
		let i = this.axes[0].set(t[0], t[1], t[2]), a = this.axes[1].set(t[4], t[5], t[6]), o = this.axes[2].set(t[8], t[9], t[10]), s = positive3D(i.length(), `world scale.x`), c = positive3D(a.length(), `world scale.y`), l = positive3D(o.length(), `world scale.z`);
		if (this.worldScale.set(s, c, l), i.scale(1 / s), a.scale(1 / c), o.scale(1 / l), Math.abs(i.dot(a)) > 1e-5 || Math.abs(i.dot(o)) > 1e-5 || Math.abs(a.dot(o)) > 1e-5 || i.x * (a.y * o.z - a.z * o.y) - i.y * (a.x * o.z - a.z * o.x) + i.z * (a.x * o.y - a.y * o.x) < .9999) throw RangeError(`3D physics requires positive orthogonal world transforms (no shear/reflection).`);
		let u = this.collider.offset;
		if (this.center.set(t[12] + t[0] * u.x + t[4] * u.y + t[8] * u.z, t[13] + t[1] * u.x + t[5] * u.y + t[9] * u.z, t[14] + t[2] * u.x + t[6] * u.y + t[10] * u.z), !Number.isFinite(this.center.x) || !Number.isFinite(this.center.y) || !Number.isFinite(this.center.z)) throw RangeError(`Transformed collider center must be finite.`);
		if (this.collider instanceof SphereCollider3D || this.collider instanceof CapsuleCollider3D) {
			if (Math.abs(s - c) > 1e-5 * Math.max(s, c) || Math.abs(s - l) > 1e-5 * Math.max(s, l)) throw RangeError(`Sphere/capsule require uniform world scale.`);
			this.radius = this.collider.radius * s;
			let e = this.collider instanceof CapsuleCollider3D ? this.collider.height * c / 2 : 0;
			this.start.set(this.center.x - a.x * e, this.center.y - a.y * e, this.center.z - a.z * e), this.end.set(this.center.x + a.x * e, this.center.y + a.y * e, this.center.z + a.z * e);
		} else if (this.collider instanceof BoxCollider3D) {
			let e = this.collider.halfExtents;
			this.half.set(e.x * s, e.y * c, e.z * l);
			for (let e = 0; e < 8; e++) {
				let t = (e & 1 ? 1 : -1) * this.half.x, n = (e & 2 ? 1 : -1) * this.half.y, r = (e & 4 ? 1 : -1) * this.half.z;
				this.vertices[e].set(this.center.x + i.x * t + a.x * n + o.x * r, this.center.y + i.y * t + a.y * n + o.y * r, this.center.z + i.z * t + a.z * n + o.z * r);
			}
		} else if (this.collider instanceof PlaneCollider3D) {
			let e = this.collider.normal;
			this.normal.set(i.x * e.x / s + a.x * e.y / c + o.x * e.z / l, i.y * e.x / s + a.y * e.y / c + o.y * e.z / l, i.z * e.x / s + a.z * e.y / c + o.z * e.z / l).normalize();
		}
		if (this.collider instanceof TriangleMeshCollider3D) {
			let e = this.triangleIndex, n = this.collider, i = n.positions, a = n.indices;
			for (let e of this.triangles) {
				for (let n = 0; n < 3; n++) {
					let r = n === 0 ? e.a : n === 1 ? e.b : e.c, o = a[e.order * 3 + n] * 3, s = i[o] + u.x, c = i[o + 1] + u.y, l = i[o + 2] + u.z;
					if (r.set(t[12] + t[0] * s + t[4] * c + t[8] * l, t[13] + t[1] * s + t[5] * c + t[9] * l, t[14] + t[2] * s + t[6] * c + t[10] * l), !Number.isFinite(r.x) || !Number.isFinite(r.y) || !Number.isFinite(r.z)) throw RangeError(`Transformed mesh vertices must be finite.`);
				}
				let n = e.b.x - e.a.x, r = e.b.y - e.a.y, o = e.b.z - e.a.z, s = e.c.x - e.a.x, c = e.c.y - e.a.y, l = e.c.z - e.a.z;
				positive3D(Math.hypot(r * l - o * c, o * s - n * l, n * c - r * s), `transformed triangle area`), e.normal.set(r * l - o * c, o * s - n * l, n * c - r * s).normalize(), e.bounds.reset(), e.bounds.add(e.a), e.bounds.add(e.b), e.bounds.add(e.c);
			}
			return this.meshIndexed ? e.refit() : e.rebuild(this.triangles), this.meshIndexed = !0, this.updateBounds(), this.poseMatrix.set(t), ++this.revision, r && ++this.inertiaRevision, !0;
		}
		if (this.collider instanceof CompoundCollider3D) {
			this.volume = 0, this.massCenter.set(0, 0, 0);
			for (let t = 0; t < this.children.length; t++) {
				let n = this.childWorld;
				n.copy(e), n.elements[12] = this.center.x, n.elements[13] = this.center.y, n.elements[14] = this.center.z, n.multiply(this.childLocal[t]);
				let r = this.children[t];
				r.refreshMatrix(n), this.volume += r.volume, this.massCenter.x += r.center.x * r.volume, this.massCenter.y += r.center.y * r.volume, this.massCenter.z += r.center.z * r.volume;
			}
			this.volume > 0 && this.massCenter.scale(1 / this.volume);
		} else if (this.needsVolume && this.collider.kind === `box`) this.volume = 8 * this.half.x * this.half.y * this.half.z;
		else if (this.needsVolume && (this.collider.kind === `sphere` || this.collider.kind === `capsule`)) {
			let e = Math.hypot(this.end.x - this.start.x, this.end.y - this.start.y, this.end.z - this.start.z);
			this.volume = Math.PI * this.radius * this.radius * (e + 4 * this.radius / 3);
		}
		return this.updateBounds(), this.poseMatrix.set(t), ++this.revision, r && ++this.inertiaRevision, !0;
	}
	validateMoving(e) {
		let t = this.collider;
		if (e !== `static`) {
			if (t.kind === `plane` || t.kind === `mesh` || t instanceof CompoundCollider3D && t.staticOnly) throw Error(`Triangle mesh/plane geometry is static only.`);
			if (e === `dynamic` && t instanceof CompoundCollider3D) {
				let e = Math.max(1, this.bounds.max.x - this.bounds.min.x, this.bounds.max.y - this.bounds.min.y, this.bounds.max.z - this.bounds.min.z);
				if (Math.hypot(this.massCenter.x - this.center.x, this.massCenter.y - this.center.y, this.massCenter.z - this.center.z) > require_physics3d.physics3DDefaults.transformTolerance * e) throw RangeError(`Dynamic compound children must be centered on their uniform-density center of mass.`);
			}
		}
	}
	updateBounds() {
		let e = this.bounds;
		if (e.reset(), this.collider.kind === `plane`) e.min.set(-1 / 0, -1 / 0, -1 / 0), e.max.set(1 / 0, 1 / 0, 1 / 0);
		else if (this.collider.kind === `box`) for (let t of this.vertices) e.add(t);
		else if (this.collider.kind === `mesh`) for (let t of this.triangles) e.add(t.bounds.min), e.add(t.bounds.max);
		else if (this.collider.kind === `compound`) for (let t of this.children) e.add(t.bounds.min), e.add(t.bounds.max);
		else e.min.set(Math.min(this.start.x, this.end.x) - this.radius, Math.min(this.start.y, this.end.y) - this.radius, Math.min(this.start.z, this.end.z) - this.radius), e.max.set(Math.max(this.start.x, this.end.x) + this.radius, Math.max(this.start.y, this.end.y) + this.radius, Math.max(this.start.z, this.end.z) + this.radius);
	}
	translate(e, t, n) {
		if (this.poseMatrix[0] = NaN, ++this.revision, this.center.x += e, this.center.y += t, this.center.z += n, this.collider.kind === `box`) for (let r of this.vertices) r.x += e, r.y += t, r.z += n;
		else (this.collider.kind === `sphere` || this.collider.kind === `capsule`) && (this.start.x += e, this.start.y += t, this.start.z += n, this.end.x += e, this.end.y += t, this.end.z += n);
		if (this.collider.kind === `compound`) {
			for (let r of this.children) r.translate(e, t, n);
			this.massCenter.x += e, this.massCenter.y += t, this.massCenter.z += n;
		}
		this.bounds.min.x += e, this.bounds.min.y += t, this.bounds.min.z += n, this.bounds.max.x += e, this.bounds.max.y += t, this.bounds.max.z += n;
	}
};
//#endregion
exports.BoxCollider3D = BoxCollider3D;
exports.CapsuleCollider3D = CapsuleCollider3D;
exports.Collider3D = Collider3D;
exports.CompoundCollider3D = CompoundCollider3D;
exports.PlaneCollider3D = PlaneCollider3D;
exports.Shape3D = Shape3D;
exports.SphereCollider3D = SphereCollider3D;
exports.Triangle3D = Triangle3D;
exports.TriangleMeshCollider3D = TriangleMeshCollider3D;
exports.finite3D = finite3D;
exports.nonnegative3D = nonnegative3D;
exports.positive3D = positive3D;
exports.vector3D = vector3D;

//# sourceMappingURL=collider.cjs.map