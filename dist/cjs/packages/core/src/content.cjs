const require_subscribe_load = require("../../assets/src/preload/subscribe-load.cjs");
const require_game_object = require("./game-object.cjs");
const require_storage = require("./storage.cjs");
const require_object3d = require("./object3d.cjs");
const require_factories = require("./factories.cjs");
const require_scene = require("./scene.cjs");
const require_content = require("../../../src/data/content.cjs");
const require_serialization = require("./serialization.cjs");
//#region dist/packages/core/src/content.js
var ResourceContentScene = class extends require_scene.Scene {
	resources;
	spawnedResources = /* @__PURE__ */ new Set();
	constructor(e) {
		super(), this.resources = e;
	}
	adoptResources(e) {
		this.spawnedResources.add(e);
	}
	releaseResources(e) {
		e.release(), this.spawnedResources.delete(e);
	}
	onDestroy() {
		let e = [];
		try {
			this.resources?.release();
		} catch (t) {
			e.push(t);
		}
		for (let t of this.spawnedResources) try {
			this.releaseResources(t);
		} catch (t) {
			e.push(t);
		}
		if (e.length) throw AggregateError(e, `Content scene resources failed to release.`);
	}
};
var ContentScene = class {
	scene;
	entries;
	definitions;
	owned;
	registry;
	services;
	resources;
	serializer;
	mutating = !1;
	constructor(e, t, n, r, i, a, o) {
		this.scene = e, this.entries = t, this.definitions = n, this.owned = r, this.registry = i, this.services = a, this.resources = o, this.serializer = new require_serialization.Serializer(e);
		for (let [e, n] of t) n.unregister = this.serializer.register(e, n.node, n.state);
	}
	get(e) {
		return this.getById(e);
	}
	getById(e) {
		let t = this.entries.get(e)?.node;
		return t && !t.destroyed && t.scene === this.scene ? t : void 0;
	}
	require(e, t) {
		let n = this.entries.get(e);
		if (!n || n.alias !== void 0 || n.kind !== t || !this.getById(e)) throw Error(`Content node ${e} is not a live ${t}.`);
		return n.node;
	}
	capture() {
		if (this.mutating) throw Error(`Content mutation is in progress.`);
		let e = /* @__PURE__ */ new Map();
		for (let [t, n] of this.entries) this.getById(t) && e.set(n.node, t);
		for (let t of this.scene.objects) if (!e.has(t)) throw Error(`Content capture requires an authored stable ID for every scene object.`);
		for (let [t, n] of this.entries) if (e.has(n.node) && !this.getById(n.rootId)) throw Error(`Content prefab member ${t} has no live factory root.`);
		let t = Object.create(null);
		for (let [n, r] of e) {
			let i = parentOf(n);
			if (i && !e.has(i)) throw Error(`Unregistered content parent for ${r}.`);
			t[r] = i ? e.get(i) : null;
		}
		let n = [];
		for (let [r, i] of this.definitions) {
			if (!e.has(this.entries.get(r).node)) continue;
			let a = {
				id: i.id,
				kind: i.kind,
				options: i.options,
				...i.references ? { references: i.references } : {},
				...i.children ? { children: i.children } : {}
			}, o = Object.entries(i.children ?? {}).filter(([, e]) => !this.getById(e)).map(([e]) => e);
			n.push({
				...a,
				...t[r] === null ? {} : { parent: t[r] },
				...o.length ? { removedChildren: o } : {}
			});
		}
		let r = {
			version: 1,
			content: {
				version: 1,
				nodes: n
			},
			state: this.serializer.capture(),
			parents: t
		};
		return validateContent(this.registry, r.content), boundedJson(r), JSON.parse(JSON.stringify(r));
	}
	async spawn(e, t = {}) {
		if (this.mutating || this.scene.destroyed) throw Error(`Content is unavailable for mutation.`);
		if (t.resourcePool && t.resources && t.resources.pool !== t.resourcePool) throw Error(`Content resource scope belongs to another pool.`);
		this.mutating = !0;
		let n = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Map(), o, s = [
			t.signal,
			this.resources?.signal,
			t.resources?.signal
		].filter((e) => e !== void 0), c = s.length ? AbortSignal.any(s) : new AbortController().signal, l, cancel = () => {
			try {
				require_factories.destroyFactoryNodes(n, !1), o?.release();
			} catch (e) {
				l = e;
			}
		};
		c.addEventListener(`abort`, cancel, { once: !0 });
		try {
			if (c.aborted) throw require_factories.factoryAbortReason(c);
			o = t.resources?.fork() ?? (t.resourcePool ? t.resourcePool.createScope() : this.resources?.fork()), o && this.scene instanceof ResourceContentScene && this.scene.adoptResources(o);
			let r = validateContent(this.registry, {
				version: 1,
				nodes: [...this.definitions.values(), e]
			}), s = r.definition.nodes.find((t) => t.id === e.id);
			await createContentNode(this.registry, s, r.parsedOptions.get(s.id), this.services, c, this.entries, a, n, o);
			let l = a.get(s.id).node, u = s.parent === void 0 ? void 0 : this.getById(s.parent);
			if (s.parent !== void 0 && !u) throw Error(`Content parent is unavailable.`);
			for (let e of Object.values(s.references ?? {})) if (!this.getById(e)) throw Error(`Content reference is unavailable.`);
			if (c.aborted) throw require_factories.factoryAbortReason(c);
			this.scene.add(l), u && attachParent(l, u);
			for (let [e, t] of a) {
				if (this.entries.has(e) || !this.scene.has(t.node) || t.node.destroyed) throw Error(`Dynamic content registration changed ownership.`);
				t.unregister = this.serializer.register(e, t.node, t.state);
			}
			for (let e of n) if (e.destroyed || e.scene !== this.scene) throw Error(`Dynamic prefab registration changed ownership.`);
			if (c.aborted || this.scene.destroyed) throw require_factories.factoryAbortReason(c);
			for (let [e, t] of a) this.entries.set(e, t);
			for (let e of n) this.owned.add(e);
			return this.definitions.set(s.id, s), l;
		} catch (e) {
			for (let e of a.values()) e.unregister?.();
			let t = l === void 0 ? [] : [l];
			try {
				require_factories.destroyFactoryNodes(n, !1);
			} catch (e) {
				t.push(e);
			}
			try {
				o && this.scene instanceof ResourceContentScene ? this.scene.releaseResources(o) : o?.release();
			} catch (e) {
				t.push(e);
			}
			throw t.length ? AggregateError([e, ...t], `Dynamic content creation and cleanup failed.`, { cause: e }) : e;
		} finally {
			this.mutating = !1, c.removeEventListener(`abort`, cancel);
		}
	}
	remove(e) {
		if (this.mutating) throw Error(`Content mutation is in progress.`);
		let t = this.entries.get(e);
		if (!t) return !1;
		let n = /* @__PURE__ */ new Set(), i = [t.node];
		for (let e = 0; e < i.length; e++) {
			let t = i[e];
			if (this.owned.has(t) && !n.has(t)) {
				n.add(t);
				for (let e of childrenOf(t)) i.push(e);
				for (let e of this.entries.values()) e.alias !== void 0 && this.entries.get(e.rootId)?.node === t && i.push(e.node);
			}
		}
		let a = new Set([...this.entries].filter(([, e]) => n.has(e.node)).map(([e]) => e));
		for (let [e, t] of this.definitions) if (!a.has(e) && Object.values(t.references ?? {}).some((e) => a.has(e))) throw Error(`Content ${e} still references a removed ID.`);
		let o = /* @__PURE__ */ new Set();
		for (let e of a) {
			let t = this.entries.get(e)?.resources;
			t && o.add(t);
		}
		this.mutating = !0;
		try {
			for (let e of a) {
				let t = this.entries.get(e);
				if (t.unregister?.(), this.entries.delete(e), t.alias === void 0) this.definitions.delete(e);
				else {
					let e = this.definitions.get(t.rootId);
					e && this.definitions.set(t.rootId, {
						...e,
						removedChildren: [.../* @__PURE__ */ new Set([...e.removedChildren ?? [], t.alias])]
					});
				}
			}
			for (let e of n) this.owned.delete(e);
			let e = [];
			try {
				require_factories.destroyFactoryNodes(n, !1);
			} catch (t) {
				e.push(t);
			}
			for (let t of o) try {
				this.scene instanceof ResourceContentScene ? this.scene.releaseResources(t) : t.release();
			} catch (t) {
				e.push(t);
			}
			if (e.length) throw AggregateError(e, `Content removal cleanup failed.`);
			return !0;
		} finally {
			this.mutating = !1;
		}
	}
	destroy() {
		for (let e of this.entries.values()) e.unregister?.();
		try {
			cleanupContent(this.scene, this.owned);
		} finally {
			this.entries.clear(), this.definitions.clear(), this.owned.clear();
		}
	}
};
function boundedJson(t) {
	let n = [{
		value: t,
		depth: 0
	}], r = 0;
	for (; n.length;) {
		let t = n.pop();
		if (++r > require_content.contentLimits.maxValues || t.depth > require_content.contentLimits.maxDepth) throw RangeError(`Content exceeds JSON value or depth limits.`);
		if (typeof t.value == `string` && t.value.length > require_content.contentLimits.maxStringLength) throw RangeError(`Content strings exceed 4096 characters.`);
		if (t.value === null || typeof t.value != `object`) continue;
		if (Array.isArray(t.value) && t.value.length > require_content.contentLimits.maxNodes) throw RangeError(`Content arrays exceed 4096 entries.`);
		let i = Reflect.ownKeys(t.value);
		if (i.length > require_content.contentLimits.maxNodes + 1) throw RangeError(`Content objects exceed 4096 properties.`);
		for (let a of i) {
			if (typeof a != `string` || a.length > require_content.contentLimits.maxKeyLength) throw RangeError(`Content keys must be strings of at most 128 characters.`);
			if (Array.isArray(t.value) && a === `length`) continue;
			let i = Object.getOwnPropertyDescriptor(t.value, a);
			if (!(`value` in i)) throw TypeError(`Content requires JSON data properties.`);
			if (r + n.length >= require_content.contentLimits.maxValues) throw RangeError(`Content exceeds JSON value limits.`);
			n.push({
				value: i.value,
				depth: t.depth + 1
			});
		}
	}
	require_storage.assertJsonValue(t);
}
function contentOrder(t) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set();
	for (let e of t) {
		for (let t of [e.id, ...Object.values(e.children ?? {})]) {
			if (o.has(t)) throw Error(`Duplicate content ID: ${t}.`);
			o.add(t);
		}
		a.set(e.id, e.id);
		for (let [t, n] of Object.entries(e.children ?? {})) e.removedChildren?.includes(t) || a.set(n, e.id);
		n.set(e.id, e), r.set(e.id, []);
	}
	if (o.size > require_content.contentLimits.maxNodes) throw RangeError(`Content exceeds 4096 stable IDs.`);
	let s = [];
	for (let e of t) {
		let t = /* @__PURE__ */ new Set();
		for (let n of [...Object.values(e.references ?? {}), ...e.parent === void 0 ? [] : [e.parent]]) {
			let e = a.get(n);
			if (!e) throw Error(`Missing content parent or reference: ${n}.`);
			t.add(e);
		}
		i.set(e.id, t.size), t.size || s.push(e);
		for (let n of t) {
			let t = r.get(n);
			if (!t) throw Error(`Missing content parent or reference: ${n}.`);
			t.push(e.id);
		}
	}
	for (let e = 0; e < s.length; e++) for (let t of r.get(s[e].id)) {
		let e = i.get(t) - 1;
		i.set(t, e), e || s.push(n.get(t));
	}
	if (s.length !== t.length) throw Error(`Content parent/reference graph contains a cycle.`);
	return s;
}
function validateContent(t, n) {
	if (boundedJson(n), !n || typeof n != `object` || Array.isArray(n) || n.version !== 1 || !Array.isArray(n.nodes) || Object.keys(n).some((e) => e !== `version` && e !== `nodes`)) throw TypeError(`Invalid content scene definition.`);
	let r = [], i = /* @__PURE__ */ new Map();
	for (let a of n.nodes) {
		if (!a || typeof a != `object` || Array.isArray(a) || Object.keys(a).some((e) => ![
			`id`,
			`kind`,
			`options`,
			`parent`,
			`references`,
			`children`,
			`removedChildren`
		].includes(e))) throw TypeError(`Invalid content node definition.`);
		if (typeof a.id != `string` || !a.id || a.id.length > require_content.contentLimits.maxKeyLength || typeof a.kind != `string` || !t.has(a.kind) || !Object.hasOwn(a, `options`)) throw TypeError(`Content nodes require a bounded ID, known factory and options.`);
		if (a.parent !== void 0 && (typeof a.parent != `string` || !a.parent || a.parent.length > require_content.contentLimits.maxKeyLength)) throw TypeError(`Invalid content parent ID.`);
		let n;
		if (a.references !== void 0) {
			if (!a.references || typeof a.references != `object` || Array.isArray(a.references)) throw TypeError(`Content references require an alias-to-ID object.`);
			n = Object.create(null);
			for (let [t, r] of Object.entries(a.references)) {
				if (!t || typeof r != `string` || !r || r.length > require_content.contentLimits.maxKeyLength) throw TypeError(`Invalid content reference alias or ID.`);
				n[t] = r;
			}
			Object.freeze(n);
		}
		let o;
		if (a.children !== void 0) {
			if (!a.children || typeof a.children != `object` || Array.isArray(a.children)) throw TypeError(`Content children require an alias-to-ID object.`);
			o = Object.create(null);
			for (let [t, n] of Object.entries(a.children)) {
				if (!t || typeof n != `string` || !n || n.length > require_content.contentLimits.maxKeyLength) throw TypeError(`Invalid content child alias or ID.`);
				o[t] = n;
			}
			Object.freeze(o);
		}
		let s;
		if (a.removedChildren !== void 0) {
			if (!Array.isArray(a.removedChildren) || !a.removedChildren.every((e) => typeof e == `string` && o && Object.hasOwn(o, e)) || new Set(a.removedChildren).size !== a.removedChildren.length) throw TypeError(`Removed prefab children require unique declared aliases.`);
			s = Object.freeze([...a.removedChildren]);
		}
		let c = JSON.parse(JSON.stringify(a.options));
		i.set(a.id, t.parse(a.kind, c)), r.push(Object.freeze({
			id: a.id,
			kind: a.kind,
			options: JSON.parse(JSON.stringify(a.options)),
			...a.parent === void 0 ? {} : { parent: a.parent },
			...n ? { references: n } : {},
			...o ? { children: o } : {},
			...s ? { removedChildren: s } : {}
		}));
	}
	let a = contentOrder(r);
	return {
		definition: Object.freeze({
			version: 1,
			nodes: Object.freeze(r)
		}),
		ordered: a,
		parsedOptions: i
	};
}
function parseContentScene(e, t) {
	return validateContent(e, t).definition;
}
async function buildContentScene(e, t, r, a = {}) {
	let o = a.signal ?? new AbortController().signal;
	if (o.aborted) throw require_factories.factoryAbortReason(o);
	let { ordered: s, parsedOptions: c } = validateContent(e, t);
	if (a.resourcePool && a.resources && a.resources.pool !== a.resourcePool) throw Error(`Content resource scope belongs to another pool.`);
	let l = a.resources?.fork() ?? a.resourcePool?.createScope(), u = new ResourceContentScene(l), d, cancel = () => {
		try {
			cleanupContent(u, p);
		} catch (e) {
			d = e;
		}
	};
	o.addEventListener(`abort`, cancel, { once: !0 });
	let f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Set();
	o.aborted && cancel();
	try {
		for (let t of s) await createContentNode(e, t, c.get(t.id), r, o, f, f, p, l?.fork());
		if (o.aborted) throw require_factories.factoryAbortReason(o);
		for (let e of s) require_factories.collectFactoryNodes(f.get(e.id).node, p);
		for (let e of s) e.parent !== void 0 && attachParent(f.get(e.id).node, f.get(e.parent).node);
		for (let e of s) e.parent === void 0 && u.add(f.get(e.id).node);
		for (let e of p) if (e.destroyed || e.scene !== u) throw Error(`Content registration changed object ownership.`);
		for (let e of u.objects) if (!p.has(e)) throw Error(`Content registration introduced an unowned object.`);
		if (o.aborted) throw require_factories.factoryAbortReason(o);
		return new ContentScene(u, f, new Map(s.map((e) => [e.id, e])), p, e, r, l);
	} catch (e) {
		if (d !== void 0) throw AggregateError([e, d], `Content cancellation and cleanup failed.`, { cause: e });
		try {
			cleanupContent(u, p);
		} catch (t) {
			throw AggregateError([e, t], `Content construction and cleanup failed.`, { cause: t });
		}
		throw e;
	} finally {
		o.removeEventListener(`abort`, cancel);
	}
}
async function rebuildContentScene(e, n, r, s = {}) {
	if (boundedJson(n), !n || typeof n != `object` || Array.isArray(n) || n.version !== 1 || Object.keys(n).some((e) => ![
		`version`,
		`content`,
		`state`,
		`parents`
	].includes(e)) || !n.parents || typeof n.parents != `object` || Array.isArray(n.parents) || !n.state || typeof n.state != `object` || Array.isArray(n.state) || n.state.version !== 1 || !n.state.objects || typeof n.state.objects != `object` || Array.isArray(n.state.objects)) throw TypeError(`Invalid content snapshot.`);
	let c = parseContentScene(e, n.content), l = /* @__PURE__ */ new Set();
	for (let e of c.nodes) {
		l.add(e.id);
		for (let [t, n] of Object.entries(e.children ?? {})) e.removedChildren?.includes(t) || l.add(n);
	}
	let u = JSON.parse(JSON.stringify(n.parents)), d = JSON.parse(JSON.stringify(n.state));
	for (let e of [u, d.objects]) if (Object.keys(e).length !== l.size || Object.keys(e).some((e) => !l.has(e))) throw Error(`Content snapshot IDs do not match topology.`);
	let f = [], p = new Set(l);
	for (let [e, t] of Object.entries(u)) if (t !== null && (typeof t != `string` || !l.has(t) || t === e)) throw Error(`Invalid snapshot parent for ${e}.`);
	for (; p.size;) {
		let e = p.size;
		for (let e of p) {
			let t = u[e];
			t !== null && p.has(t) || (f.push(e), p.delete(e));
		}
		if (e === p.size) throw Error(`Snapshot hierarchy contains a cycle.`);
	}
	let m = await buildContentScene(e, c, r, s), h, cancel = () => {
		try {
			m.destroy();
		} catch (e) {
			h = e;
		}
	};
	s.signal?.addEventListener(`abort`, cancel, { once: !0 }), s.signal?.aborted && cancel();
	try {
		if (s.signal?.aborted) throw require_factories.factoryAbortReason(s.signal);
		for (let e of l) {
			let t = m.getById(e);
			(t instanceof require_game_object.GameObject || t instanceof require_object3d.Object3D) && t.detachParent();
		}
		for (let e of f) {
			let t = u[e];
			typeof t == `string` && attachParent(m.getById(e), m.getById(t));
		}
		if (await require_subscribe_load.subscribeLoad(m.serializer.restore(d, `error`), s.signal), s.signal?.aborted) throw require_factories.factoryAbortReason(s.signal);
		if (m.scene.objects.size !== l.size) throw Error(`Content restoration introduced unregistered objects.`);
		for (let e of l) {
			let t = m.getById(e), n = u[e];
			if (!t || parentOf(t) !== (n === null ? void 0 : m.getById(n))) throw Error(`Content restoration changed object ownership or hierarchy.`);
		}
		return m;
	} catch (e) {
		if (h !== void 0) throw AggregateError([e, h], `Content cancellation and cleanup failed.`, { cause: e });
		try {
			m.destroy();
		} catch (t) {
			throw AggregateError([e, t], `Content restoration and cleanup failed.`, { cause: t });
		}
		throw e;
	} finally {
		s.signal?.removeEventListener(`abort`, cancel);
	}
}
async function createContentNode(e, t, a, o, s, c, u, d, f) {
	if (s.aborted) throw require_factories.factoryAbortReason(s);
	let p = /* @__PURE__ */ new Set(), m = await e.createParsed(t.kind, a, o, {
		signal: s,
		id: t.id,
		resources: f,
		onOwn(e) {
			for (let t of e) {
				if (d.has(t) && !p.has(t)) throw Error(`Factory prefabs share an object across content IDs.`);
				p.add(t), d.add(t);
			}
		},
		reference(e) {
			let n = t.references && Object.hasOwn(t.references, e) ? t.references[e] : void 0, r = n === void 0 ? void 0 : c.get(n)?.node;
			if (!r || r.destroyed) throw Error(`Undeclared or unavailable content reference: ${e}.`);
			return r;
		}
	});
	if (s.aborted) throw require_factories.factoryAbortReason(s);
	require_factories.collectFactoryNodes(m, p);
	let h = e.definitions[t.kind], g = h.children?.(m) ?? {};
	if (Object.keys(g).length !== Object.keys(t.children ?? {}).length || Object.keys(g).some((e) => !t.children || !Object.hasOwn(t.children, e))) throw Error(`Prefab stable child aliases do not match authored content metadata.`);
	let _ = /* @__PURE__ */ new Set([m]);
	for (let e of Object.values(g)) {
		if (!p.has(e) || _.has(e)) throw Error(`Prefab metadata must name distinct owned descendants.`);
		_.add(e);
	}
	let v = /* @__PURE__ */ new Set();
	for (let e of t.removedChildren ?? []) {
		let t = [g[e]];
		for (let e = 0; e < t.length; e++) {
			v.add(t[e]);
			for (let n of childrenOf(t[e])) t.push(n);
		}
	}
	for (let [e, n] of Object.entries(g)) if (v.has(n) && !t.removedChildren?.includes(e)) throw Error(`Removed prefab subtrees must mark all descendant aliases.`);
	require_factories.destroyFactoryNodes(v, !1);
	for (let e of v) d.delete(e);
	let y = [[
		t.id,
		m,
		void 0
	]];
	for (let [e, n] of Object.entries(g)) v.has(n) || y.push([
		t.children[e],
		n,
		e
	]);
	for (let [e, n, r] of y) {
		if (c.has(e) || u.has(e)) throw Error(`Duplicate content ID: ${e}.`);
		let i = h.state ? h.state(m, n) : require_serialization.sceneObjectState(n);
		if (!i || typeof i.serialize != `function` || typeof i.restore != `function`) throw TypeError(`Invalid Serializable adapter for ${e}.`);
		u.set(e, {
			kind: t.kind,
			node: n,
			rootId: t.id,
			alias: r,
			state: i,
			...r === void 0 && f ? { resources: f } : {}
		});
	}
}
function parentOf(e) {
	return e instanceof require_game_object.GameObject || e instanceof require_object3d.Object3D ? e.parent : void 0;
}
function childrenOf(e) {
	return e instanceof require_game_object.GameObject || e instanceof require_object3d.Object3D ? e.children : [];
}
function attachParent(e, t) {
	if (e instanceof require_game_object.GameObject && t instanceof require_game_object.GameObject) t.add(e);
	else if (e instanceof require_object3d.Object3D && t instanceof require_object3d.Object3D) t.add(e);
	else throw Error(`Incompatible content parent dimensions.`);
}
function cleanupContent(e, t) {
	let n = [];
	for (let e of t) if (e instanceof require_game_object.GameObject || e instanceof require_object3d.Object3D) for (let n of e.children) t.has(n) || n.detachParent();
	try {
		require_factories.destroyFactoryNodes(t, !1);
	} catch (e) {
		n.push(e);
	}
	for (let r of e.objects) if (!t.has(r)) try {
		e.remove(r);
	} catch (e) {
		n.push(e);
	}
	try {
		e.destroy();
	} catch (e) {
		n.push(e);
	}
	if (n.length) throw AggregateError(n, `Content cleanup failed.`);
}
//#endregion
exports.ContentScene = ContentScene;
exports.buildContentScene = buildContentScene;
exports.parseContentScene = parseContentScene;
exports.rebuildContentScene = rebuildContentScene;

//# sourceMappingURL=content.cjs.map