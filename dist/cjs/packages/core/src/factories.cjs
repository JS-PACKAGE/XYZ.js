const require_scene_object = require("./scene-object.cjs");
const require_game_object = require("./game-object.cjs");
const require_object3d = require("./object3d.cjs");
//#region dist/packages/core/src/factories.js
function defineFactory(e) {
	return Object.freeze({ ...e });
}
var FactoryRegistry = class {
	definitions;
	constructor(e) {
		let t = Object.create(null);
		for (let n of Object.keys(e)) {
			if (!n || n.length > 128) throw RangeError(`Factory names must contain 1–128 characters.`);
			let r = e[n];
			if (!r || typeof r.parse != `function` || typeof r.create != `function`) throw TypeError(`Invalid factory: ${n}.`);
			if (r.children !== void 0 && typeof r.children != `function` || r.state !== void 0 && typeof r.state != `function`) throw TypeError(`Invalid factory metadata: ${n}.`);
			t[n] = Object.freeze({
				parse: r.parse,
				create: r.create,
				...r.children ? { children: r.children } : {},
				...r.state ? { state: r.state } : {}
			});
		}
		this.definitions = Object.freeze(t);
	}
	has(e) {
		return Object.hasOwn(this.definitions, e);
	}
	parse(e, t) {
		if (!this.has(e)) throw Error(`Unknown factory: ${e}.`);
		return this.definitions[e].parse(t);
	}
	async create(e, t, n, r) {
		return this.createParsed(e, this.parse(e, t), n, { signal: r });
	}
	async createParsed(e, t, n, r = {}) {
		if (!this.has(e)) throw Error(`Unknown factory: ${e}.`);
		let i = r.resources?.signal, a = r.signal && i && r.signal !== i ? AbortSignal.any([r.signal, i]) : r.signal ?? i ?? new AbortController().signal;
		if (a.aborted) throw factoryAbortReason(a);
		let o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), c = !1;
		r.resources?.attach(() => destroyFactoryNodes(o));
		let own = (e) => {
			if (c) throw s.has(e) || collectFactoryNodes(e, o), destroyFactoryNodes(o), r.resources?.release(), factoryAbortReason(a);
			if (collectFactoryNodes(e, o), r.onOwn?.(o), s.add(e), a.aborted) throw destroyFactoryNodes(o), factoryAbortReason(a);
			return e;
		}, abort, l = new Promise((e, t) => {
			abort = () => {
				c = !0;
				try {
					destroyFactoryNodes(o), t(factoryAbortReason(a));
				} catch (e) {
					t(AggregateError([factoryAbortReason(a), e], `Factory cancellation and cleanup failed.`));
				}
			}, a.addEventListener(`abort`, abort, { once: !0 });
		}), u = {
			services: n,
			signal: a,
			id: r.id,
			resources: r.resources,
			own,
			reference: r.reference ?? (() => {
				throw Error(`No content references are declared.`);
			})
		}, d = this.definitions[e], f = Promise.resolve().then(() => {
			if (a.aborted) throw factoryAbortReason(a);
			return d.create(t, u);
		}).then((e) => {
			if (own(e), s.size !== 1 || !s.has(e)) throw Error(`A factory must return its only claimed prefab root.`);
			return e;
		});
		try {
			return await Promise.race([f, l]);
		} catch (e) {
			c = !0;
			try {
				destroyFactoryNodes(o), r.resources?.release();
			} catch (t) {
				throw AggregateError([e, t], `Factory creation and cleanup failed.`, { cause: t });
			}
			throw e;
		} finally {
			c = !0, abort && a.removeEventListener(`abort`, abort);
		}
	}
};
function collectFactoryNodes(r, i) {
	if ((r instanceof require_game_object.GameObject || r instanceof require_object3d.Object3D) && r.parent) throw Error(`A factory prefab root must be detached.`);
	let a = [r], o = /* @__PURE__ */ new Set();
	for (let r = 0; r < a.length; r++) {
		let s = a[r];
		if (!(s instanceof require_scene_object.SceneObject) || s.destroyed || s.scene || s.registrationGeneration !== 0) throw Error(`A factory must return fresh, never-scene-owned objects.`);
		if (o.has(s)) throw Error(`Factory prefab contains duplicate identity or a cycle.`);
		if (o.add(s), i.add(s), s instanceof require_game_object.GameObject || s instanceof require_object3d.Object3D) for (let e of s.children) {
			if (e.parent !== s) throw Error(`Factory prefab has inconsistent parent ownership.`);
			a.push(e);
		}
	}
}
function destroyFactoryNodes(n, r = !0) {
	let i = new Set(n);
	for (let n of r ? i : []) if (n instanceof require_game_object.GameObject || n instanceof require_object3d.Object3D) for (let e of n.children) !e.scene && !e.destroyed && e.registrationGeneration === 0 && i.add(e);
	for (let n of i) if (n instanceof require_game_object.GameObject || n instanceof require_object3d.Object3D) {
		n.parent && !i.has(n.parent) && n.detachParent();
		for (let e of n.children) i.has(e) || e.detachParent();
	}
	let a = [];
	for (let e of i) try {
		e.destroy();
	} catch (e) {
		a.push(e);
	}
	if (a.length) throw AggregateError(a, `Factory node cleanup failed.`);
}
function factoryAbortReason(e) {
	return e.reason ?? new DOMException(`Content construction cancelled.`, `AbortError`);
}
//#endregion
exports.FactoryRegistry = FactoryRegistry;
exports.collectFactoryNodes = collectFactoryNodes;
exports.defineFactory = defineFactory;
exports.destroyFactoryNodes = destroyFactoryNodes;
exports.factoryAbortReason = factoryAbortReason;

//# sourceMappingURL=factories.cjs.map