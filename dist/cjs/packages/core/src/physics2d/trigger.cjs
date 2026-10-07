const require_collider = require("./collider.cjs");
const require_game_object = require("../game-object.cjs");
//#region dist/packages/core/src/physics2d/trigger.js
var Trigger2D = class extends require_game_object.GameObject {
	remaining;
	accepted = /* @__PURE__ */ new Map();
	constructor(e, n = {}) {
		if (super(), this.remaining = n.repeat ?? 1, this.remaining !== 1 / 0 && (!Number.isInteger(this.remaining) || this.remaining < 0)) throw RangeError(`Trigger repeat must be a nonnegative integer or Infinity.`);
		let r = new require_collider.Collider2D(e.kind, e.radius, e.vertices, { offset: [e.offset.x, e.offset.y] });
		r.sensor = !0, r.category = e.category, r.mask = this.remaining ? e.mask : 0, this.collider = r, this.addEventListener(`collisionstart`, (e) => {
			let t = e.detail.other, r = this.accepted.get(t);
			if (r !== void 0) {
				this.accepted.set(t, r + 1);
				return;
			}
			!this.remaining || t.destroyed || n.filter && !n.filter(t) || this.destroyed || t.destroyed || (this.remaining--, this.accepted.set(t, 1), this.dispatchEvent(new CustomEvent(`triggerenter`, { detail: {
				self: this,
				other: t
			} })), !this.destroyed && !t.destroyed && this.accepted.has(t) && n.onEnter?.(t));
		}), this.addEventListener(`collisionend`, (e) => {
			let t = e.detail.other, n = this.accepted.get(t);
			n !== void 0 && (n > 1 ? this.accepted.set(t, n - 1) : (this.accepted.delete(t), this.dispatchEvent(new CustomEvent(`triggerexit`, { detail: {
				self: this,
				other: t
			} }))));
		});
	}
	get remainingRepeats() {
		return this.remaining;
	}
	onDestroy() {
		this.accepted.clear();
	}
};
//#endregion
exports.Trigger2D = Trigger2D;

//# sourceMappingURL=trigger.cjs.map