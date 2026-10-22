const require_event_observers = require("./event-observers.cjs");
//#region dist/packages/core/src/scene-object.js
var SceneObject = class extends EventTarget {
	owningScene;
	disposed = !1;
	observedEventTypes;
	ownershipGeneration = 0;
	get registrationGeneration() {
		return this.ownershipGeneration;
	}
	addEventListener(n, r, i) {
		super.addEventListener(n, r, i), r && !(typeof i == `object` && i.signal?.aborted) && (this.observedEventTypes || require_event_observers.observeObjectEventTypes(this, this.observedEventTypes = /* @__PURE__ */ new Set()), this.observedEventTypes.add(n), require_event_observers.observeEventType(n), n === `preupdate` && this.owningScene?.trackObjectPasses(this));
	}
	dispatchObjectEvent(e, t) {
		this.observedEventTypes?.has(e) && this.dispatchEvent(new CustomEvent(e, { detail: t }));
	}
	observesUpdate(e) {
		return this.observedEventTypes?.has(e) === !0;
	}
	emitUpdate(e, t) {
		this.observedEventTypes?.has(e) && this.dispatchEvent(new CustomEvent(e, { detail: { dt: t } }));
	}
	get scene() {
		return this.owningScene;
	}
	get destroyed() {
		return this.disposed;
	}
	attach(e) {
		if (this.disposed) throw Error(`Cannot add a destroyed scene object.`);
		if (this.owningScene) throw Error(`Scene object already belongs to a scene.`);
		this.owningScene = e, this.ownershipGeneration++;
	}
	detach(e) {
		this.owningScene === e && (this.owningScene = void 0, this.ownershipGeneration++);
	}
	destroy() {
		if (!this.disposed) {
			this.disposed = !0, this.owningScene?.remove(this);
			try {
				this.onDestroy();
			} finally {
				this.dispatchObjectEvent(`destroy`);
			}
		}
	}
	onDestroy() {}
};
//#endregion
exports.SceneObject = SceneObject;

//# sourceMappingURL=scene-object.cjs.map