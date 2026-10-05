const require_object3d = require("../object3d.cjs");
const require_objects3d = require("../objects3d.cjs");
const require_physics_profiles = require("../../../../src/data/physics-profiles.cjs");
//#region dist/packages/core/src/physics3d/debug.js
var PhysicsDebugDraw3D = class extends require_object3d.Object3D {
	world;
	options;
	lines = [];
	kinds = [];
	constructor(e, t) {
		super(), this.world = e, this.options = t;
	}
	refresh(e = this.world.debugSnapshot()) {
		if (this.destroyed) throw Error(`PhysicsDebugDraw3D is destroyed.`);
		if (this.parent || this.position.length() !== 0 || this.scale.x !== 1 || this.scale.y !== 1 || this.scale.z !== 1 || this.rotation.x !== 0 || this.rotation.y !== 0 || this.rotation.z !== 0 || this.rotation.w !== 1) throw Error(`PhysicsDebugDraw3D requires an identity root transform.`);
		let r = e.segments;
		if (r.length > require_physics_profiles.physicsProfiles.debug.maxSegments) throw RangeError(`Debug segment bound exceeded.`);
		for (; this.lines.length > r.length;) {
			let e = this.lines.pop();
			this.kinds.pop(), this.remove(e), e.destroy();
		}
		for (let e = 0; e < r.length; e++) {
			let i = r[e], a = this.lines[e];
			if (!a || this.kinds[e] !== i.kind) {
				a && (this.remove(a), a.destroy());
				let r = i.kind === `contact` ? this.options.contactMaterial ?? this.options.colliderMaterial : i.kind === `joint` ? this.options.jointMaterial ?? this.options.colliderMaterial : this.options.colliderMaterial;
				a = new require_objects3d.Line3D([i.from, i.to], {
					material: r,
					width: this.options.width ?? require_physics_profiles.physicsProfiles.debug.width,
					castShadow: !1,
					receiveShadow: !1
				}), this.lines[e] = a, this.kinds[e] = i.kind, this.add(a);
			} else a.setPoint(0, ...i.from), a.setPoint(1, ...i.to);
		}
	}
	destroy() {
		this.destroyed || (super.destroy(), this.lines.length = 0, this.kinds.length = 0);
	}
};
//#endregion
exports.PhysicsDebugDraw3D = PhysicsDebugDraw3D;

//# sourceMappingURL=debug.cjs.map