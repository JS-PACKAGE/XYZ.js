const require_texture = require("../../assets/src/texture.cjs");
const require_worker_jobs = require("../../assets/src/worker-jobs.cjs");
const require_pbr_material = require("./pbr-material.cjs");
const require_materials = require("../../../src/data/materials.cjs");
const require_procedural_material_maps = require("./procedural-material-maps.cjs");
//#region dist/packages/core/src/procedural-material.js
var __xyzOriginalModuleURL = require("node:url").pathToFileURL(require("node:path").resolve(__dirname, "../../../../packages/core/src/procedural-material.js")).href;
function decodeProceduralMaps(e) {
	if (!e || typeof e != `object`) throw TypeError(`A procedural maps response is required.`);
	let n = e, r = n.baseColor?.length, i = Math.sqrt((r ?? 0) / 4);
	if (!Number.isInteger(i) || i < require_materials.proceduralMaterialLimits.minSize || i > require_materials.proceduralMaterialLimits.maxSize || ![
		n.baseColor,
		n.normal,
		n.metallicRoughness,
		n.occlusion
	].every((e) => e instanceof Uint8ClampedArray && e.length === r)) throw RangeError(`Worker procedural maps do not match their size.`);
	return n;
}
var proceduralMapsJob = {
	type: `procedural.maps`,
	decode: decodeProceduralMaps,
	release() {}
};
function proceduralWorkerURL() {
	return new URL(`./workers/procedural-material.worker.js`, __xyzOriginalModuleURL);
}
function createProceduralWorkerPool(e = {}) {
	if (typeof Worker > `u`) throw new require_worker_jobs.WorkerJobError(`unsupported`, `Native module Workers are unavailable.`);
	return new require_worker_jobs.NativeWorkerPool({
		...e,
		moduleURL: proceduralWorkerURL(),
		workerFactory: () => new Worker(new URL(`./workers/procedural-material.worker.js`, __xyzOriginalModuleURL), { type: `module` })
	});
}
var ProceduralMapCache = class {
	maxBytes;
	maxEntries;
	entries = /* @__PURE__ */ new Map();
	pending = /* @__PURE__ */ new Map();
	retained = 0;
	hitCount = 0;
	missCount = 0;
	constructor(e = {}) {
		let n = e.maxBytes ?? require_materials.proceduralMaterialLimits.cacheDefaultBytes, r = e.maxEntries ?? require_materials.proceduralMaterialLimits.cacheDefaultEntries;
		if (!Number.isSafeInteger(n) || n < 0 || n > require_materials.proceduralMaterialLimits.cacheMaxBytes || !Number.isSafeInteger(r) || r < 0 || r > require_materials.proceduralMaterialLimits.cacheMaxEntries) throw RangeError(`Procedural cache maxBytes must be an integer 0..1 GiB and maxEntries 0..4096.`);
		this.maxBytes = n, this.maxEntries = r;
	}
	get size() {
		return this.entries.size;
	}
	get bytes() {
		return this.retained;
	}
	get hits() {
		return this.hitCount;
	}
	get misses() {
		return this.missCount;
	}
	clear() {
		this.entries.clear(), this.retained = 0;
	}
	async acquire(e, t) {
		let n = [
			e.kind,
			e.size,
			e.seed,
			e.contrast,
			e.roughnessBias,
			e.tint?.join(`,`) ?? ``
		].join(`|`), r = this.entries.get(n);
		if (r) return this.hitCount++, this.entries.delete(n), this.entries.set(n, r), r;
		let i = this.pending.get(n);
		if (i) return this.hitCount++, i;
		this.missCount++;
		let a = t();
		this.pending.set(n, a);
		try {
			let e = await a;
			return this.store(n, e), e;
		} finally {
			this.pending.delete(n);
		}
	}
	store(e, t) {
		let n = t.baseColor.byteLength * 4;
		if (!(n > this.maxBytes || this.maxEntries === 0)) {
			this.entries.set(e, t), this.retained += n;
			for (let [e, t] of this.entries) {
				if (this.retained <= this.maxBytes && this.entries.size <= this.maxEntries) break;
				this.entries.delete(e), this.retained -= t.baseColor.byteLength * 4;
			}
		}
	}
};
function proceduralRepeats(e, t) {
	if (!Number.isFinite(t) || t <= 0) throw RangeError(`Procedural surface size must be finite and positive.`);
	return t / require_materials.proceduralTileMeters[e];
}
var s = `wood.brick.stone.metal.fabric.marble.concrete.tiles.leather.sand.rust.snow.asphalt.gravel.cobblestone.bark.moss.mud.granite.slate.terrazzo.denim.burlap.carpet.plaster.terracotta.cork.rubber.carbonfiber.diamondplate.paper.corrugatedcardboard.creasedpaper.layeredpaper.wicker.bamboo.hammeredmetal.galvanized.corrugatedmetal.perforatedmetal.expandedmetal.wiremesh.velvet.terrycloth.boucle.geode.quartz.pyrite.shiplap.glassblock.thatch.charredwood.driftwood.peelingpaint.tiretread.honeycomb.frost.stainedglass.soapstone.butcherblock.wallpaper.embroidery.macrame.brickpaving.steppingstone.woodendeck.cheese.sugarfrosting.candleswax.vinylrecord.graphpaper.notebookpaper.lace.crochet.basketweave.zipper.velcro.button.traintracks.manholecover.speedbump.circuitboard.solarpanel.heattile.pianokeys.drumskin.gongsurface.lensarray.prismtape.fresnel.bandage.pillblister.sutures.trellis.terracottapot.hedgerow.collar.petbed.scratchpost.runningtrack.bouldermat.pooltile.envelope.chalkboard.corkboard.snowdrift.icicle.dewdrops.mooncrater.starfield.nebula.pleats.shoelace.tassel.woksurface.cutlery.choppingboard.faucet.showerhead.bathmat.blinds.curtain.shadecloth.sandstone.travertine.pumice.parquet.mosaic.hexagontiles.knit.corduroy.felt.roofshingles.rooftiles.stucco.lichen.leaflitter.lotusleaf.bananaleaf.fernleaf.endgrain.acousticfoam.closedcellfoam.linoleum.suede.snakeskin.crocodile.herringbone.tweed.seersucker.knurledmetal.engineturned.goldleaf.orangepeel.coconut.watermelon.limestone.breccia.gneiss.plywood.osb.chipboard.wafflecloth.cableknit.quilting.crackleglaze.flutedceramic.encaustictiles.fishscales.tortoiseshell.feathers.reedmat.rope.straw.studdedrubber.groovedrubber.recycledrubber.breadcrust.wafer.chocolate.pretzel.bagel.croissant.butterflywing.beetlewing.spiderweb.cirrus.cumulus.lightning.kelp.seaweed.anemone.candy.marshmallow.nougat.frostedglass.rippledglass.bubbleglass.saddlestitch.tooledleather.patentleather.appleskin.peachskin.grapeskin.broccoli.cabbage.onion.bedsheet.pillow.mattress.tealeaf.matcha.teabag.sanddune.pebblebeach.foamedge.lavaflow.cooledlava.ashfield.stalactite.flowstone.cavefloor.jam.peanutbutter.sprinkles.icecream.popsicle.sorbet.spaghetti.macaroni.lasagna.origami.paperlace.papercut.sunflower.daisy.clover.puzzletile.legobrick.rubberband.haybale.corncrib.fencepost.poolfelt.icesurface.climbingwall.oledpanel.crtscanline.keyboardkey.filmstrip.postagestamp.halftoneprint.radiator.screwhead.chainlink.friedegg.sushirice.chocolatechip.cargomat.dashboardgrain.licenseplate.flowerbed.grassstripe.topiary.confetti.ribbonstreamer.pinatafringe.xylophone.tambourine.castanet.pillcapsule.pilltablet.bathbomb.basketball.tennisball.golfball.boardformedconcrete.ribbedconcrete.splitfaceblock.chainmail.rivetedmetal.weldedmetal.cactus.pinecone.corncob.basalt.scoria.obsidian.malachite.agate.lapislazuli.rice.sesame.coffeebeans.braincoral.starcoral.seasponge.houndstooth.tartan.damask.zebrafur.leopardfur.giraffefur.scallopshell.oystershell.nautilusshell.walnutshell.peanutshell.almondshell.cantaloupe.dragonfruit.kiwiskin.rosepetal.lilypetal.fritillarypetal.birchbark.palmtrunk.sycamorebark.elephanthide.ostrichleather.sharkskin.tactilepaving.roadmarking.draincover.mushroomgills.morel.bracketfungus.pineapple.strawberry.lychee.sandpaper.steelwool.wirebrush.cheesegrater.ovenrack.muffintin.gauze.elasticbandage.icepack.bubblewrap.sequin.pennyround.volleyball.bowlingball.rugbyball.wafflecone.donutglaze.brownie.soapbar.loofah.scrubbypad.orangeflesh.kiwiflesh.avocadoflesh.turquoise.rhodonite.tigereye.tatami.flutedwood.subwaytiles.canewebbing.rammedearth.copperpatina.birdseyemaple.breezeblock.basketweavepavers.ripstop.octagondot.truchettiles.standingseam.damascus.windmillpavers.castiron.porphyry.linen.chippedenamel.perforatedleather.argyle.chevronparquet.ginkgoleaf.pressedtin.sashiko.ashlar.gabion.gingham.mossypavers.bamboocrosscut.moire.oakleaf.rhombille.fossillimestone.seigaihatiles.tuftedleather.louveredmetal.herringbonebrick.shibori.scallopedslate.saltpan.dogbonepavers.palmendgrain.asanoha.lotusseedpod.crowncaps.cofferedconcrete.woodworm.calcadawaves.ikat.slottedwood.hollyleaf.englishbond.rebar.starfruit.diamondrustication.bargello.saffiano.cocoamat.suminagashi.vermiculite.cairotiles.guilloche.seaurchintest.crystallineglaze.shirring.sunburstveneer.rakedgravel.flintwall.frenchknots.artichoke.splitlockwashers.flemishbond.satinweave.lotusroot.cardboardedge.hexnuts.orbicularjasper.acornbarnacles.circularpavers.snowflaketiles.sawblades.pistachios.polkadotfabric.cucumberslices.monsteraleaf.crossstitch.staranise.logcabinparquet.countersunkmetal.trilobitefossil.eyeletcotton.dendriticagate.ravioli.rollerchain.mapleleaf.smocking.quatrefoiltile.okraslice.eggcarton.greekkey.seedbeads`.split(`.`);
var c = Object.freeze({
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
	static async create(n, i = {}) {
		if (!s.includes(n)) throw RangeError(`Unknown procedural material kind.`);
		if (!i || typeof i != `object` || Array.isArray(i)) throw TypeError(`Procedural material options must be an object.`);
		let a = i.size === void 0 ? require_materials.proceduralMaterialLimits.defaultSize : i.size, c = i.seed === void 0 ? require_materials.proceduralMaterialLimits.defaultSeed : i.seed;
		if (!Number.isInteger(a) || a < require_materials.proceduralMaterialLimits.minSize || a > require_materials.proceduralMaterialLimits.maxSize) throw RangeError(`Procedural material size must be an integer between 32 and 1024.`);
		if (!Number.isInteger(c) || c < 0 || c > 4294967295) throw RangeError(`Procedural material seed must be an unsigned 32-bit integer.`);
		let l = i.contrast ?? 1, u = i.roughnessBias ?? 0, d = i.repeats ?? 1;
		if (!Number.isFinite(l) || l < 0 || !Number.isFinite(u) || u < -1 || u > 1 || !Number.isFinite(d) || d <= 0) throw RangeError(`Procedural contrast must be finite and nonnegative, roughnessBias within -1..1, and repeats finite and positive.`);
		let f = i.tint;
		if (f !== void 0 && (!Array.isArray(f) || f.length !== 3 || !f.every((e) => typeof e == `number` && Number.isFinite(e) && e >= 0 && e <= 4))) throw RangeError(`Procedural tint must be three finite multipliers within 0..4.`);
		let p = i.workerPool;
		if (p !== void 0 && !(p instanceof require_worker_jobs.NativeWorkerPool)) throw TypeError(`Procedural workerPool must be a NativeWorkerPool.`);
		let m = i.cache;
		if (m !== void 0 && !(m instanceof ProceduralMapCache)) throw TypeError(`Procedural cache must be a ProceduralMapCache.`);
		let h = {
			kind: n,
			size: a,
			seed: c,
			contrast: l,
			roughnessBias: u,
			...f === void 0 ? {} : { tint: [
				f[0],
				f[1],
				f[2]
			] }
		}, generate = async () => {
			if (p === void 0) return require_procedural_material_maps.generateProceduralMaps(n, a, c, {
				contrast: l,
				roughnessBias: u,
				tint: f
			});
			let e = (await p.submit(proceduralMapsJob, h, { requestBytes: 0 }).promise).value;
			if (e.baseColor.length !== a * a * 4) throw RangeError(`Worker procedural maps do not match their size.`);
			return e;
		}, g = m === void 0 ? await generate() : await m.acquire(h, generate), _ = [];
		try {
			for (let t of [
				g.baseColor,
				g.normal,
				g.metallicRoughness,
				g.occlusion
			]) {
				let n = new ImageData(a, a);
				n.data.set(t), _.push(await require_texture.Texture.fromImage(n));
			}
			return new ProceduralMaterial(n, {
				baseColor: _[0],
				normal: _[1],
				metallicRoughness: _[2],
				occlusion: _[3]
			}, d);
		} catch (e) {
			for (let e of _) e.destroy();
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
			metallic: +(this.kind === `metal` || this.kind === `rust` || this.kind === `copperpatina` || this.kind === `chippedenamel` || this.kind === `gabion` || this.kind === `diamondplate` || this.kind === `hammeredmetal` || this.kind === `galvanized` || this.kind === `corrugatedmetal` || this.kind === `standingseam` || this.kind === `damascus` || this.kind === `castiron` || this.kind === `pressedtin` || this.kind === `louveredmetal` || this.kind === `crowncaps` || this.kind === `rebar` || this.kind === `guilloche` || this.kind === `splitlockwashers` || this.kind === `hexnuts` || this.kind === `sawblades` || this.kind === `countersunkmetal` || this.kind === `rollerchain` || this.kind === `perforatedmetal` || this.kind === `expandedmetal` || this.kind === `wiremesh` || this.kind === `draincover` || this.kind === `pyrite` || this.kind === `knurledmetal` || this.kind === `engineturned` || this.kind === `goldleaf` || this.kind === `chainmail` || this.kind === `rivetedmetal` || this.kind === `weldedmetal`),
			roughness: 1,
			alphaMode: `OPAQUE`,
			textureSampler: c,
			normalSampler: c,
			metallicRoughnessSampler: c,
			occlusionSampler: c,
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
exports.ProceduralMapCache = ProceduralMapCache;
exports.ProceduralMaterial = ProceduralMaterial;
exports.createProceduralWorkerPool = createProceduralWorkerPool;
exports.proceduralMapsJob = proceduralMapsJob;
exports.proceduralRepeats = proceduralRepeats;
exports.proceduralWorkerURL = proceduralWorkerURL;

//# sourceMappingURL=procedural-material.cjs.map