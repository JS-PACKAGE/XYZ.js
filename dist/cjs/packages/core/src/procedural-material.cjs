const require_texture = require("../../assets/src/texture.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_materials = require("../../../src/data/materials.cjs");
const require_procedural_material_maps = require("./procedural-material-maps.cjs");
//#region dist/packages/core/src/procedural-material.js
function proceduralRepeats(e, t) {
	if (!Number.isFinite(t) || t <= 0) throw RangeError(`Procedural surface size must be finite and positive.`);
	return t / require_materials.proceduralTileMeters[e];
}
var a = `wood.brick.stone.metal.fabric.marble.concrete.tiles.leather.sand.rust.snow.asphalt.gravel.cobblestone.bark.moss.mud.granite.slate.terrazzo.denim.burlap.carpet.plaster.terracotta.cork.rubber.carbonfiber.diamondplate.paper.corrugatedcardboard.creasedpaper.layeredpaper.wicker.bamboo.hammeredmetal.galvanized.corrugatedmetal.perforatedmetal.expandedmetal.wiremesh.velvet.terrycloth.boucle.geode.quartz.pyrite.shiplap.glassblock.thatch.charredwood.driftwood.peelingpaint.tiretread.honeycomb.frost.stainedglass.soapstone.butcherblock.wallpaper.embroidery.macrame.brickpaving.steppingstone.woodendeck.cheese.sugarfrosting.candleswax.vinylrecord.graphpaper.notebookpaper.lace.crochet.basketweave.zipper.velcro.button.traintracks.manholecover.speedbump.circuitboard.solarpanel.heattile.pianokeys.drumskin.gongsurface.lensarray.prismtape.fresnel.bandage.pillblister.sutures.trellis.terracottapot.hedgerow.collar.petbed.scratchpost.runningtrack.bouldermat.pooltile.envelope.chalkboard.corkboard.snowdrift.icicle.dewdrops.mooncrater.starfield.nebula.pleats.shoelace.tassel.woksurface.cutlery.choppingboard.faucet.showerhead.bathmat.blinds.curtain.shadecloth.sandstone.travertine.pumice.parquet.mosaic.hexagontiles.knit.corduroy.felt.roofshingles.rooftiles.stucco.lichen.leaflitter.lotusleaf.bananaleaf.fernleaf.endgrain.acousticfoam.closedcellfoam.linoleum.suede.snakeskin.crocodile.herringbone.tweed.seersucker.knurledmetal.engineturned.goldleaf.orangepeel.coconut.watermelon.limestone.breccia.gneiss.plywood.osb.chipboard.wafflecloth.cableknit.quilting.crackleglaze.flutedceramic.encaustictiles.fishscales.tortoiseshell.feathers.reedmat.rope.straw.studdedrubber.groovedrubber.recycledrubber.breadcrust.wafer.chocolate.pretzel.bagel.croissant.butterflywing.beetlewing.spiderweb.cirrus.cumulus.lightning.kelp.seaweed.anemone.candy.marshmallow.nougat.frostedglass.rippledglass.bubbleglass.saddlestitch.tooledleather.patentleather.appleskin.peachskin.grapeskin.broccoli.cabbage.onion.bedsheet.pillow.mattress.tealeaf.matcha.teabag.sanddune.pebblebeach.foamedge.lavaflow.cooledlava.ashfield.stalactite.flowstone.cavefloor.jam.peanutbutter.sprinkles.icecream.popsicle.sorbet.spaghetti.macaroni.lasagna.origami.paperlace.papercut.sunflower.daisy.clover.puzzletile.legobrick.rubberband.haybale.corncrib.fencepost.poolfelt.icesurface.climbingwall.oledpanel.crtscanline.keyboardkey.basketball.tennisball.golfball.boardformedconcrete.ribbedconcrete.splitfaceblock.chainmail.rivetedmetal.weldedmetal.cactus.pinecone.corncob.basalt.scoria.obsidian.malachite.agate.lapislazuli.rice.sesame.coffeebeans.braincoral.starcoral.seasponge.houndstooth.tartan.damask.zebrafur.leopardfur.giraffefur.scallopshell.oystershell.nautilusshell.walnutshell.peanutshell.almondshell.cantaloupe.dragonfruit.kiwiskin.rosepetal.lilypetal.fritillarypetal.birchbark.palmtrunk.sycamorebark.elephanthide.ostrichleather.sharkskin.tactilepaving.roadmarking.draincover.mushroomgills.morel.bracketfungus.pineapple.strawberry.lychee`.split(`.`);
var o = Object.freeze({
	addressModeU: `repeat`,
	addressModeV: `repeat`
});
var ProceduralMaterial = class ProceduralMaterial {
	repeats;
	kind;
	textures;
	material;
	disposed = !1;
	constructor(e, t, n) {
		this.repeats = n, this.kind = e, this.textures = Object.freeze(t), this.material = this.createMaterial();
	}
	static async create(n, r = {}) {
		if (!a.includes(n)) throw RangeError(`Unknown procedural material kind.`);
		if (!r || typeof r != `object` || Array.isArray(r)) throw TypeError(`Procedural material options must be an object.`);
		let o = r.size === void 0 ? require_materials.proceduralMaterialLimits.defaultSize : r.size, s = r.seed === void 0 ? require_materials.proceduralMaterialLimits.defaultSeed : r.seed;
		if (!Number.isInteger(o) || o < require_materials.proceduralMaterialLimits.minSize || o > require_materials.proceduralMaterialLimits.maxSize) throw RangeError(`Procedural material size must be an integer between 32 and 1024.`);
		if (!Number.isInteger(s) || s < 0 || s > 4294967295) throw RangeError(`Procedural material seed must be an unsigned 32-bit integer.`);
		let c = r.contrast ?? 1, l = r.roughnessBias ?? 0, u = r.repeats ?? 1;
		if (!Number.isFinite(c) || c < 0 || !Number.isFinite(l) || l < -1 || l > 1 || !Number.isFinite(u) || u <= 0) throw RangeError(`Procedural contrast must be finite and nonnegative, roughnessBias within -1..1, and repeats finite and positive.`);
		let d = require_procedural_material_maps.generateProceduralMaps(n, o, s, {
			contrast: c,
			roughnessBias: l
		}), f = [];
		try {
			for (let t of [
				d.baseColor,
				d.normal,
				d.metallicRoughness,
				d.occlusion
			]) {
				let n = new ImageData(o, o);
				n.data.set(t), f.push(await require_texture.Texture.fromImage(n));
			}
			return new ProceduralMaterial(n, {
				baseColor: f[0],
				normal: f[1],
				metallicRoughness: f[2],
				occlusion: f[3]
			}, u);
		} catch (e) {
			for (let e of f) e.destroy();
			throw e;
		}
	}
	createMaterial(e = {}) {
		if (this.disposed) throw Error(`Cannot create a material from a destroyed procedural preset.`);
		let t = [this.repeats, this.repeats];
		return new require_pbr_material.PBRMaterial({
			texture: this.textures.baseColor,
			normalTexture: this.textures.normal,
			metallicRoughnessTexture: this.textures.metallicRoughness,
			occlusionTexture: this.textures.occlusion,
			textureCoordinates: this.repeats === 1 ? void 0 : {
				texture: { scale: t },
				metallicRoughness: { scale: t },
				normal: { scale: t },
				occlusion: { scale: t }
			},
			metallic: +(this.kind === `metal` || this.kind === `rust` || this.kind === `diamondplate` || this.kind === `hammeredmetal` || this.kind === `galvanized` || this.kind === `corrugatedmetal` || this.kind === `perforatedmetal` || this.kind === `expandedmetal` || this.kind === `wiremesh` || this.kind === `draincover` || this.kind === `pyrite` || this.kind === `knurledmetal` || this.kind === `engineturned` || this.kind === `goldleaf` || this.kind === `chainmail` || this.kind === `rivetedmetal` || this.kind === `weldedmetal`),
			roughness: 1,
			alphaMode: `OPAQUE`,
			textureSampler: o,
			normalSampler: o,
			metallicRoughnessSampler: o,
			occlusionSampler: o,
			...e
		});
	}
	get destroyed() {
		return this.disposed;
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.textures.baseColor.destroy(), this.textures.normal.destroy(), this.textures.metallicRoughness.destroy(), this.textures.occlusion.destroy());
	}
};
//#endregion
exports.ProceduralMaterial = ProceduralMaterial;
exports.proceduralRepeats = proceduralRepeats;

//# sourceMappingURL=procedural-material.cjs.map