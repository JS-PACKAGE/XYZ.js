const require_rendering2d = require("../../../src/data/rendering2d.cjs");
const require_game_object = require("../../core/src/game-object.cjs");
const require_sprite = require("../../core/src/sprite.cjs");
const require_mesh2d = require("../../core/src/rendering2d/mesh2d.cjs");
const require_isolated_group = require("../../core/src/rendering2d/isolated-group.cjs");
const require_particle_layer2d = require("../../core/src/particles2d/particle-layer2d.cjs");
const require_tile_map = require("../../core/src/maps2d/tile-map.cjs");
const require_isometric_map = require("../../core/src/maps2d/isometric-map.cjs");
//#region dist/packages/graphics/src/render2d-contract.js
var RenderCommandBuffer2D = class RenderCommandBuffer2D {
	items = [];
	pool = [];
	traversal = [];
	collectedCount = 0;
	boundaryMembers = /* @__PURE__ */ new Map();
	memberLists = [];
	clear() {
		for (let e of this.items) {
			let t = e;
			t.object = void 0, t.commands?.clear();
		}
		this.items.length = 0, this.traversal.length = 0, this.collectedCount = 0;
	}
	append(e, t) {
		let n = this.items.length, r = t.worldSpace === `screen`, i = t.worldZIndex, a = this.pool[n];
		a ? (a.kind = e, a.object = t, a.screen = r, a.z = i) : (a = {
			kind: e,
			object: t,
			screen: r,
			z: i
		}, this.pool.push(a));
		let o = a;
		return this.items.push(o), a;
	}
	appendSprite(e) {
		this.append(`sprite`, e);
	}
	appendMesh(e) {
		this.append(`mesh`, e);
	}
	appendParticles(e) {
		this.append(`particles`, e);
	}
	appendLayer(e) {
		let t = this.append(`layer`, e);
		return t.commands ??= new RenderCommandBuffer2D();
	}
	sort() {
		this.items.sort(compareCommands2D);
	}
	collectDetachedObjects(e) {
		this.traversal.length = 0;
		for (let t of e.children) this.traversal.push(t);
		for (let e = 0; e < this.traversal.length; e++) {
			if (this.traversal.length > require_rendering2d.rendering2dLimits.commands) throw RangeError(`Detached target subtree exceeds the traversal budget.`);
			for (let t of this.traversal[e].children) this.traversal.push(t);
		}
		return this.traversal;
	}
	releaseTraversal() {
		this.traversal.length = 0;
	}
	membersOf(e) {
		let t = this.boundaryMembers.get(e);
		return t || (t = this.memberLists.pop() ?? [], this.boundaryMembers.set(e, t)), t;
	}
	releaseBoundaryMembers() {
		for (let e of this.boundaryMembers.values()) e.length = 0, this.memberLists.push(e);
		this.boundaryMembers.clear();
	}
	destroy() {
		this.clear();
		for (let e of this.pool) e.commands?.destroy();
		this.pool.length = 0;
	}
};
function compareCommands2D(e, t) {
	let n = e, r = t;
	return n.screen === r.screen ? n.z - r.z : n.screen ? 1 : -1;
}
function collectRenderCommands2D(e, r, i, a, o) {
	if (a.clear(), !o?.skipCulling) for (let a of e.objects) (a instanceof require_tile_map.TileMap || a instanceof require_isometric_map.IsometricMap) && a.updateCulling(e.camera2D, r, i);
	let s = o?.root;
	try {
		partitionBoundaries2D(s && s.scene !== e ? a.collectDetachedObjects(s) : e.objects, s, a), collectBoundary2D(e, r, i, a, s, o?.skipCulling ?? !1, 0, a);
	} catch (e) {
		throw a.clear(), e;
	} finally {
		a.releaseTraversal(), a.releaseBoundaryMembers();
	}
}
function partitionBoundaries2D(e, t, n) {
	let a, o;
	for (let s of e) {
		if (!(s instanceof require_game_object.GameObject) || s === t) continue;
		let e = !0, c;
		for (let n = s; n; n = n.parent) {
			if (n !== s && n instanceof require_isolated_group.IsolatedGroup2D && (n === t || n.isolationEnabled)) {
				c = n;
				break;
			}
			if (!n.visible || n.opacity <= 0 || n.tint[3] <= 0) {
				e = !1;
				break;
			}
		}
		e && ((!o || c !== a) && (a = c, o = n.membersOf(c)), o.push(s));
	}
}
var c = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};
var l = [];
function collectBoundary2D(t, n, r, u, d, f, p, m) {
	if (p > require_rendering2d.rendering2dLimits.layerDepth) throw RangeError(`Isolated layer nesting exceeds the render budget.`);
	let h = t.camera2D;
	for (let g of m.boundaryMembers.get(d) ?? l) {
		let l = g instanceof require_isolated_group.IsolatedGroup2D && g.isolationEnabled;
		if (l || g instanceof require_sprite.Sprite || g instanceof require_mesh2d.Mesh2D || g instanceof require_particle_layer2d.ParticleLayer2D) {
			if (g instanceof require_sprite.Sprite || g instanceof require_mesh2d.Mesh2D) {
				if (!g.renderEnabled || g.texture.destroyed) continue;
				g.view?.validate();
			}
			if (!f && !(l && g.cacheAsTexture)) {
				let e = g.getWorldBounds(c), t = g.worldSpace === `world`, i = t ? h.zoom : 1, a = e.x * i + (t ? -h.position.x * i + h.renderOffset.x : 0), o = e.y * i + (t ? -h.position.y * i + h.renderOffset.y : 0), s = a + e.width * i, l = o + e.height * i;
				if (s < 0 || l < 0 || a > n || o > r || !Number.isFinite(a + o + s + l)) continue;
			}
			if (++m.collectedCount > require_rendering2d.rendering2dLimits.commands) throw RangeError(`Visible render commands exceed the render budget.`);
			l ? collectBoundary2D(t, n, r, u.appendLayer(g), g, !0, p + 1, m) : g instanceof require_sprite.Sprite ? u.appendSprite(g) : g instanceof require_mesh2d.Mesh2D ? u.appendMesh(g) : g instanceof require_particle_layer2d.ParticleLayer2D && u.appendParticles(g);
		}
	}
	u.sort();
}
//#endregion
exports.RenderCommandBuffer2D = RenderCommandBuffer2D;
exports.collectRenderCommands2D = collectRenderCommands2D;

//# sourceMappingURL=render2d-contract.cjs.map