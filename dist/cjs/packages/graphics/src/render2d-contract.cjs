const require_rendering2d = require("../../../src/data/rendering2d.cjs");
const require_contracts = require("../../core/src/gameplay/contracts.cjs");
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
	clear() {
		for (let e of this.items) {
			let t = e;
			t.object = void 0, t.commands?.clear();
		}
		this.items.length = 0, this.traversal.length = 0, this.collectedCount = 0;
	}
	append(e, t) {
		let n = this.items.length, r = this.pool[n];
		r ? (r.kind = e, r.object = t) : (r = {
			kind: e,
			object: t
		}, this.pool.push(r));
		let i = r;
		return this.items.push(i), r;
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
	destroy() {
		this.clear();
		for (let e of this.pool) e.commands?.destroy();
		this.pool.length = 0;
	}
};
function compareCommands2D(e, t) {
	return require_contracts.compareObjects2D(e.object, t.object);
}
function collectRenderCommands2D(e, r, i, a, o) {
	if (a.clear(), !o?.skipCulling) for (let a of e.objects) (a instanceof require_tile_map.TileMap || a instanceof require_isometric_map.IsometricMap) && a.updateCulling(e.camera2D, r, i);
	try {
		collectBoundary2D(e, r, i, a, o?.root, o?.skipCulling ?? !1, 0, a);
	} catch (e) {
		throw a.clear(), e;
	}
}
var l = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};
function collectBoundary2D(t, n, r, u, d, f, p, m) {
	if (p > require_rendering2d.rendering2dLimits.layerDepth) throw RangeError(`Isolated layer nesting exceeds the render budget.`);
	let h = t.camera2D, g = d && d.scene !== t ? u.collectDetachedObjects(d) : t.objects;
	for (let _ of g) {
		if (!(_ instanceof require_game_object.GameObject) || _ === d) continue;
		let g = !0;
		for (let e = _; e && e !== d; e = e.parent) if (!e.visible || e.opacity <= 0 || e.tint[3] <= 0) {
			g = !1;
			break;
		}
		if (!g) continue;
		let v;
		for (let e = _.parent; e; e = e.parent) if (e instanceof require_isolated_group.IsolatedGroup2D && (e === d || e.isolationEnabled)) {
			v = e;
			break;
		}
		if (v !== d) continue;
		let y = _ instanceof require_isolated_group.IsolatedGroup2D && _.isolationEnabled;
		if (y || _ instanceof require_sprite.Sprite || _ instanceof require_mesh2d.Mesh2D || _ instanceof require_particle_layer2d.ParticleLayer2D) {
			if (_ instanceof require_sprite.Sprite || _ instanceof require_mesh2d.Mesh2D) {
				if (!_.renderEnabled || _.texture.destroyed) continue;
				_.view?.validate();
			}
			if (!f && !(y && _.cacheAsTexture)) {
				let e = _.getWorldBounds(l), t = _.worldSpace === `world`, i = t ? h.zoom : 1, a = e.x * i + (t ? -h.position.x * i + h.renderOffset.x : 0), o = e.y * i + (t ? -h.position.y * i + h.renderOffset.y : 0), s = a + e.width * i, c = o + e.height * i;
				if (s < 0 || c < 0 || a > n || o > r || !Number.isFinite(a + o + s + c)) continue;
			}
			if (++m.collectedCount > require_rendering2d.rendering2dLimits.commands) throw RangeError(`Visible render commands exceed the render budget.`);
			y ? collectBoundary2D(t, n, r, u.appendLayer(_), _, !0, p + 1, m) : _ instanceof require_sprite.Sprite ? u.appendSprite(_) : _ instanceof require_mesh2d.Mesh2D ? u.appendMesh(_) : _ instanceof require_particle_layer2d.ParticleLayer2D && u.appendParticles(_);
		}
	}
	u.sort(), u.releaseTraversal();
}
//#endregion
exports.RenderCommandBuffer2D = RenderCommandBuffer2D;
exports.collectRenderCommands2D = collectRenderCommands2D;

//# sourceMappingURL=render2d-contract.cjs.map