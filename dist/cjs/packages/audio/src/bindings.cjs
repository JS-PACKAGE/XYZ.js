const require_errors = require("./errors.cjs");
//#region dist/packages/audio/src/bindings.js
var AudioTransformBinding = class {
	object;
	target;
	listener;
	release;
	disposed = !1;
	scene;
	position = {
		x: 0,
		y: 0,
		z: 0
	};
	forward = {
		x: 0,
		y: 0,
		z: -1
	};
	up = {
		x: 0,
		y: 1,
		z: 0
	};
	constructor(t, n, r, i) {
		if (this.object = t, this.target = n, this.listener = r, this.release = i, t.destroyed || t.scene?.destroyed) throw new require_errors.AudioError(`Cannot bind a destroyed audio transform.`);
		if (!r && n.position3D === void 0) throw new require_errors.AudioError(`Emitter playback must be created with spatial options.`);
		this.scene = t.scene, t.addEventListener(`destroy`, this.onObjectDestroyed), this.update();
	}
	get destroyed() {
		return this.disposed;
	}
	unbind(e = !0) {
		this.disposed || (this.disposed = !0, this.object.removeEventListener(`destroy`, this.onObjectDestroyed), this.release(this), !this.listener && e && this.target.stop());
	}
	update() {
		if (this.disposed) return;
		if (this.object.destroyed || this.scene?.destroyed) {
			this.unbind();
			return;
		}
		if (!this.listener) {
			let e = this.target.state;
			if (e === `stopped` || e === `ended`) {
				this.unbind(!1);
				return;
			}
		}
		let e = this.object.updateWorldMatrix().elements;
		if (this.position.x = e[12], this.position.y = e[13], this.position.z = e[14], this.listener) {
			let t = this.target;
			t.setPosition(this.position.x, this.position.y, this.position.z), this.forward.x = -e[8], this.forward.y = -e[9], this.forward.z = -e[10], this.up.x = e[4], this.up.y = e[5], this.up.z = e[6];
			let n = Math.hypot(this.forward.x, this.forward.y, this.forward.z), r = Math.hypot(this.up.x, this.up.y, this.up.z);
			if (n > 0 && r > 0) {
				this.forward.x /= n, this.forward.y /= n, this.forward.z /= n, this.up.x /= r, this.up.y /= r, this.up.z /= r;
				let e = this.forward.x * this.up.x + this.forward.y * this.up.y + this.forward.z * this.up.z;
				Math.abs(e) < 1 - 1e-6 && t.setOrientation(this.forward, this.up);
			}
		} else this.target.position3D = this.position;
	}
	onObjectDestroyed = () => {
		this.unbind();
	};
};
//#endregion
exports.AudioTransformBinding = AudioTransformBinding;

//# sourceMappingURL=bindings.cjs.map