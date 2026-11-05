const require_tiled_parser = require("../../../assets/src/tiled-parser.cjs");
const require_index = require("../../../math/src/index.cjs");
const require_collider = require("../physics2d/collider.cjs");
const require_game_object = require("../game-object.cjs");
const require_sprite = require("../sprite.cjs");
const require_group2d = require("../gameplay/group2d.cjs");
const require_sprite_sheet = require("../graphics2d/sprite-sheet.cjs");
const require_tiling_sprite2d = require("../graphics2d/tiling-sprite2d.cjs");
const require_tile_map = require("./tile-map.cjs");
const require_frame_animation = require("../gameplay/frame-animation.cjs");
//#region dist/packages/core/src/maps2d/tiled-map.js
var TiledTileMap = class extends require_tile_map.TileMap {
	tileset;
	setTile(e, t, n) {
		super.setTile(e, t, n);
		let i = this.getTile(e, t), a = this.tileSprite(e, t);
		if (!a || (a.animation = void 0, i.frame === void 0)) return;
		let o = typeof i.metadata == `object` && i.metadata !== null && `gid` in i.metadata ? Number(i.metadata.gid) : 0, s = !!(o & 2147483648), c = !!(o & 1073741824), l = !!(o & 536870912);
		a.anchor.set(.5, .5), a.position.set((e + .5) * this.tileWidth, (t + .5) * this.tileHeight), a.rotation = l ? Math.PI / 2 : 0;
		let u = this.sheet.getFrame(i.frame);
		a.scale.set((l ? this.tileHeight : this.tileWidth) / u.width * (l ? c ? -1 : 1 : s ? -1 : 1), (l ? this.tileWidth : this.tileHeight) / u.height * (l ? s ? 1 : -1 : c ? -1 : 1));
		let d = this.tileset?.animations?.get(i.frame);
		d && new require_frame_animation.FrameAnimation(a, d.map((e) => ({
			source: this.sheet.getFrame(e.tileid),
			duration: e.duration / 1e3
		}))).play(), this.cullTile(e, t);
	}
};
var TiledLayerGroup = class extends require_group2d.Group2D {
	layer;
	asset;
	parentPX;
	parentPY;
	imageSprite;
	corner = new require_index.Vector2();
	constructor(e, t, n, r) {
		super(), this.layer = e, this.asset = t, this.parentPX = n, this.parentPY = r;
	}
	updateWorldMatrix() {
		let e = super.updateWorldMatrix(), t = this.scene?.camera2D;
		if (!t) return e;
		let n = e.elements;
		n[6] += (this.parentPX - (this.layer.parallaxX ?? 1)) * (t.position.x - (this.asset.data.parallaxOriginX ?? 0)), n[7] += (this.parentPY - (this.layer.parallaxY ?? 1)) * (t.position.y - (this.asset.data.parallaxOriginY ?? 0));
		let r = this.imageSprite;
		if (r) {
			let i = n[0] * n[4] - n[1] * n[3];
			if (!Number.isFinite(i) || i === 0) return e;
			let a = 1 / 0, o = 1 / 0, s = -1 / 0, c = -1 / 0;
			for (let e = 0; e < 4; e++) {
				t.screenToWorld(this.corner.set(e & 1 ? t.viewportWidth : 0, e & 2 ? t.viewportHeight : 0), this.corner);
				let r = this.corner.x - n[6], l = this.corner.y - n[7], u = (n[4] * r - n[3] * l) / i, d = (n[0] * l - n[1] * r) / i;
				a = Math.min(a, u), s = Math.max(s, u), o = Math.min(o, d), c = Math.max(c, d);
			}
			let l = this.layer.repeatX ? Math.floor(a / r.tileWidth) * r.tileWidth : 0, u = this.layer.repeatY ? Math.floor(o / r.tileHeight) * r.tileHeight : 0;
			r.position.set(l, u), r.resize(this.layer.repeatX ? s - l + r.tileWidth : r.tileWidth, this.layer.repeatY ? c - u + r.tileHeight : r.tileHeight);
		}
		return e;
	}
};
var TiledContent = class extends require_group2d.Group2D {
	asset;
	layers = /* @__PURE__ */ new Map();
	tileMaps = /* @__PURE__ */ new Map();
	constructor(t) {
		if (super(), this.asset = t, t.scope.destroyed) throw new require_tiled_parser.TiledError(`asset`, `resource owner has been released`);
		try {
			let n = new Map(t.data.layers.map((e) => [e.id, e]));
			for (let [r, a] of t.data.layers.entries()) {
				let s = n.get(a.parentId), l = new TiledLayerGroup(a, t, s?.parallaxX ?? 1, s?.parallaxY ?? 1);
				if (l.position.set(a.x, a.y), l.opacity = a.opacity, l.visible = a.visible, l.zIndex = typeof a.properties.depth == `number` ? a.properties.depth : a.type === `group` ? 0 : r, (a.parentId === void 0 ? this : this.layers.get(a.parentId)).add(l), this.layers.set(a.id, l), a.type === `tilelayer`) {
					let e = /* @__PURE__ */ new Map(), n = a.chunks, r = n?.length ? Math.min(...n.map((e) => e.x)) : 0, i = n?.length ? Math.min(...n.map((e) => e.y)) : 0, s = n?.length ? Math.max(...n.map((e) => e.x + e.width)) - r : Math.max(1, t.data.width), c = n?.length ? Math.max(...n.map((e) => e.y + e.height)) - i : Math.max(1, t.data.height);
					for (let n of t.data.tilesets) {
						let a = Array.from({ length: n.tileCount }, (e, t) => ({
							x: n.margin + t % n.columns * (n.tileWidth + n.spacing),
							y: n.margin + Math.floor(t / n.columns) * (n.tileHeight + n.spacing),
							width: n.tileWidth,
							height: n.tileHeight
						})), u = new TiledTileMap({
							columns: s,
							rows: c,
							originColumn: r,
							originRow: i,
							sparse: t.data.infinite === !0,
							tileWidth: t.data.tileWidth,
							tileHeight: t.data.tileHeight,
							sheet: new require_sprite_sheet.SpriteSheet(t.textures.get(n), a)
						});
						u.tileset = n, l.add(u), e.set(n, u);
					}
					if (this.tileMaps.set(a.id, e), n) for (let e of n) for (let t = 0; t < e.data.length; t++) e.data[t] && this.setGid(a.id, e.x + t % e.width, e.y + Math.floor(t / e.width), e.data[t]);
					else for (let e = 0; e < a.data.length; e++) a.data[e] && this.setGid(a.id, e % t.data.width, Math.floor(e / t.data.width), a.data[e]);
				} else if (a.type === `objectgroup`) this.addObjects(l, a);
				else if (a.type === `imagelayer`) {
					let n = t.imageTextures.get(a.id);
					if (!n) throw new require_tiled_parser.TiledError(a.name, `image layer texture is missing`);
					a.repeatX || a.repeatY ? (l.imageSprite = new require_tiling_sprite2d.TilingSprite2D({
						texture: n,
						anchor: [0, 0],
						width: n.width,
						height: n.height
					}), l.add(l.imageSprite)) : l.add(new require_sprite.Sprite({
						texture: n,
						anchor: [0, 0]
					}));
				}
			}
			t.scope.attach(() => this.destroy());
		} catch (e) {
			throw super.destroy(), t.destroy(), e;
		}
	}
	addObjects(e, n) {
		for (let r of n.objects) {
			let n = new require_game_object.GameObject();
			n.position.set(r.x, r.y), n.rotation = r.rotation * Math.PI / 180, n.visible = r.visible, n.collider = r.polygon ? require_collider.Colliders.polygon(r.polygon.map((e) => [e[0], e[1]])) : r.ellipse ? require_collider.Colliders.circle(r.width / 2, { offset: [r.width / 2, r.height / 2] }) : require_collider.Colliders.box(r.width, r.height, { offset: [r.width / 2, r.height / 2] }), n.collider.sensor = r.properties.sensor === !0, e.add(n);
		}
	}
	setGid(t, n, r, i) {
		if (this.destroyed) throw new require_tiled_parser.TiledError(`content`, `cannot edit destroyed content`);
		let a = this.tileMaps.get(t);
		if (!a) throw new require_tiled_parser.TiledError(`layer`, `not a tile layer`);
		if (!Number.isInteger(i) || i < 0 || i > 4294967295 || i & 268435456) throw new require_tiled_parser.TiledError(`gid`, `invalid orthogonal uint32 GID`);
		let o = i & 268435455, s = this.asset.data.tilesets.find((e) => o >= e.firstgid && o < e.firstgid + e.tileCount);
		if (o && !s || !o && i) throw new require_tiled_parser.TiledError(`gid`, `unresolved tile ID`);
		for (let e of a.values()) e.getTile(n, r);
		if (s) {
			let e = s.tiles.get(o - s.firstgid);
			a.get(s).setTile(n, r, {
				frame: o - s.firstgid,
				solid: e?.solid === !0,
				metadata: Object.freeze({
					gid: i,
					properties: e
				})
			});
		}
		for (let [e, t] of a) e !== s && (t.getTile(n, r).frame !== void 0 || t.getTile(n, r).solid) && t.clearTile(n, r);
	}
	destroy() {
		this.destroyed || (super.destroy(), this.asset.destroy());
	}
};
function createTiledContent(e) {
	return new TiledContent(e);
}
//#endregion
exports.TiledContent = TiledContent;
exports.TiledTileMap = TiledTileMap;
exports.createTiledContent = createTiledContent;

//# sourceMappingURL=tiled-map.cjs.map