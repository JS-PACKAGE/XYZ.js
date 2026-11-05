//#region dist/packages/ecs/src/world.js
var World = class {
	nextEntity = 1;
	entities = /* @__PURE__ */ new Set();
	components = /* @__PURE__ */ new Map();
	systems = [];
	systemEntries = /* @__PURE__ */ new Map();
	updating = !1;
	inactiveSystems = 0;
	disposed = !1;
	revision = 0;
	createEntity() {
		this.assertAlive();
		let e = this.nextEntity++;
		return this.entities.add(e), this.revision++, e;
	}
	hasEntity(e) {
		return this.entities.has(e);
	}
	removeEntity(e) {
		if (this.assertAlive(), !this.entities.delete(e)) return !1;
		this.revision++;
		for (let t of this.components.values()) t.delete(e);
		return !0;
	}
	addComponent(e, t, n) {
		if (this.assertAlive(), !this.entities.has(e)) throw RangeError(`Entity does not exist.`);
		let r = this.components.get(t);
		return r || (r = /* @__PURE__ */ new Map(), this.components.set(t, r)), r.set(e, n), this.revision++, n;
	}
	getComponent(e, t) {
		return this.components.get(t)?.get(e);
	}
	*query(...e) {
		let t = [];
		for (let n of e) {
			let e = this.components.get(n);
			if (!e) return;
			t.push(e);
		}
		let n = t.length, r;
		for (let e of t) (!r || e.size < r.size) && (r = e);
		let i = 0;
		if (r && r.size * 2 < this.entities.size) {
			let e = [], n = !0;
			for (let i of r.keys()) this.entities.has(i) && hasAll(t, i) && (e.length && i < e[e.length - 1] && (n = !1), e.push(i));
			n || e.sort((e, t) => e - t);
			let a = this.revision;
			for (let t = 0; t < e.length && this.revision === a; t++) i = e[t], yield i;
			if (this.revision === a) return;
		}
		for (let e of this.entities) {
			if (e <= i) continue;
			let r = !0;
			for (let i = 0; i < n; i++) if (!t[i].has(e)) {
				r = !1;
				break;
			}
			r && (yield e);
		}
	}
	hasComponent(e, t) {
		return this.components.get(t)?.has(e) ?? !1;
	}
	removeComponent(e, t) {
		this.assertAlive();
		let n = this.components.get(t)?.delete(e) ?? !1;
		return n && this.revision++, n;
	}
	addSystem(e) {
		if (this.assertAlive(), this.systemEntries.has(e)) throw Error(`System is already registered.`);
		try {
			e.initialize?.(this);
		} catch (t) {
			try {
				e.destroy?.(this);
			} catch (e) {
				throw AggregateError([t, e], `System initialization and cleanup failed.`, { cause: e });
			}
			throw t;
		}
		let t = {
			system: e,
			active: !0,
			next: void 0
		};
		this.systems.push(t);
		let n = this.systemEntries.get(e);
		if (n) {
			for (; n.next;) n = n.next;
			n.next = t;
		} else this.systemEntries.set(e, t);
	}
	removeSystem(e) {
		this.assertAlive();
		let t = this.systemEntries.get(e);
		return t ? (t.active = !1, t.next ? this.systemEntries.set(e, t.next) : this.systemEntries.delete(e), t.next = void 0, this.inactiveSystems++, !this.updating && this.inactiveSystems * 2 >= this.systems.length && this.compactSystems(), e.destroy?.(this), !0) : !1;
	}
	update(e) {
		if (this.assertAlive(), this.updating) throw Error(`World update cannot be reentered.`);
		this.updating = !0;
		let t = this.systems.length;
		try {
			for (let n = 0; n < t; n++) {
				let t = this.systems[n];
				t?.active && t.system.update(this, e);
			}
		} finally {
			this.updating = !1, this.compactSystems();
		}
	}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0;
		let e = [];
		for (let t = this.systems.length - 1; t >= 0; t--) {
			let n = this.systems[t];
			if (n.active) {
				n.active = !1;
				try {
					n.system.destroy?.(this);
				} catch (t) {
					e.push(t);
				}
			}
		}
		if (this.systems.length = 0, this.systemEntries.clear(), this.components.clear(), this.entities.clear(), e.length) throw AggregateError(e, `World system cleanup failed.`);
	}
	compactSystems() {
		if (this.inactiveSystems === 0) return;
		let e = 0;
		for (let t = 0; t < this.systems.length; t++) {
			let n = this.systems[t];
			n.active && (this.systems[e++] = n);
		}
		this.systems.length = e, this.inactiveSystems = 0;
	}
	assertAlive() {
		if (this.disposed) throw Error(`World has been destroyed.`);
	}
};
function hasAll(e, t) {
	for (let n = 0; n < e.length; n++) if (!e[n].has(t)) return !1;
	return !0;
}
//#endregion
exports.World = World;

//# sourceMappingURL=world.cjs.map