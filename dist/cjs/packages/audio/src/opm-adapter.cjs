const require_audio = require("../../../src/data/audio.cjs");
const require_errors = require("./errors.cjs");
const require_opm = require("../../../src/data/opm.cjs");
const require_spatial = require("./samples/spatial.cjs");
//#region dist/packages/audio/src/opm-adapter.js
var __xyzOriginalModuleURL = require("node:url").pathToFileURL(require("node:path").resolve(__dirname, "../../../../packages/audio/src/opm-adapter.js")).href;
var i = /* @__PURE__ */ new WeakMap();
function engineVoice(e) {
	let t = {
		...e,
		version: 1,
		ops: e.ops.map((e) => ({
			...e,
			adsr: { ...e.adsr }
		})),
		lfo: e.lfo ? { ...e.lfo } : void 0
	};
	return i.set(t, {
		...t,
		version: 7
	}), t;
}
function nativeVoice(e) {
	let t = i.get(e);
	return t ? Object.isFrozen(e) ? t : {
		...e,
		version: 7
	} : e;
}
function legacyOPM(e) {
	let t = new Map([...e.voices].map(([e, t]) => [e, engineVoice(t)]));
	return {
		get context() {
			return e.context;
		},
		set context(t) {
			e.context = t;
		},
		get node() {
			return e.node;
		},
		set node(t) {
			e.node = t;
		},
		voices: t,
		loadVoice(n, r) {
			e.loadVoice(n, typeof r == `object` && r && i.has(r) ? nativeVoice(r) : r), t.set(n, engineVoice(e.voices.get(n)));
		},
		start: () => e.start(),
		playNote(r) {
			let i = typeof r.voice == `string` ? t.get(r.voice) : r.voice;
			if (typeof r.voice == `string` && !i) throw new require_errors.AudioError(`Unknown voice: ${r.voice}`);
			return e.playNote({
				...r,
				voice: i ? nativeVoice(i) : void 0
			});
		},
		stop: (t) => {
			e.stop(t);
		},
		close: () => e.close()
	};
}
function resolveOPMModuleURL(e) {
	let t;
	try {
		let n = (typeof document < `u` ? document.baseURI : void 0) ?? (typeof location < `u` ? location.href : void 0);
		t = new URL(e, n);
	} catch (e) {
		throw new require_errors.AudioError(`opmModuleUrl is not a valid URL.`, { cause: e });
	}
	let r = typeof location < `u` && t.origin === location.origin;
	if (t.protocol !== `https:` && !(t.protocol === `http:` && r) || t.username || t.password || t.hash) throw new require_errors.AudioError(`opmModuleUrl must be an HTTPS (or same-origin HTTP) module URL without credentials or a fragment.`);
	return t.href;
}
async function loadOPM(e) {
	let r = await import(e ?? new URL(`../../../vendor/opm/dist/api/index.js`, __xyzOriginalModuleURL).href);
	if (r.VERSION !== require_opm.opmVendor.version || typeof r.OPM != `function`) throw new require_errors.AudioError(`OPM module reports version ${String(r.VERSION)}; XYZ.js requires official OPM.js ${require_opm.opmVendor.version}.`);
	return r.OPM;
}
async function validateWith(e, t) {
	let n = new e();
	return n.loadVoice(`validated`, t), engineVoice(n.voices.get(`validated`));
}
var OPMAdapter = class {
	output;
	slots = [];
	pendingSlots;
	unlocking;
	destroyed = !1;
	frozen = !1;
	contextList = [];
	owned;
	lent;
	moduleUrl;
	constructor(e) {
		this.output = e;
	}
	lendContext(e) {
		this.lent = e;
	}
	useModule(e) {
		this.moduleUrl = e;
	}
	get contexts() {
		return this.contextList;
	}
	async setPaused(e) {
		this.frozen = e, await Promise.all(this.contexts.map((t) => {
			if (!(t.state === `closed` || this.destroyed)) return e ? t.suspend() : t.resume();
		}));
	}
	static async validateVoice(e) {
		return validateWith(await loadOPM(), e);
	}
	async validate(e) {
		return validateWith(await loadOPM(this.moduleUrl), e);
	}
	get unlocked() {
		return !this.destroyed && this.slots.length === require_audio.audioDefaults.voiceCount;
	}
	get now() {
		return performance.now() / 1e3;
	}
	get opm() {
		if (!this.unlocked) return;
		let e = this.slots[0];
		return e.legacy ??= legacyOPM(e.opm);
	}
	get sampleContext() {
		return this.contextList[0];
	}
	unlock() {
		return this.destroyed ? Promise.reject(new require_errors.AudioError(`Audio adapter has been destroyed`)) : this.unlocked ? Promise.resolve() : (this.unlocking ||= this.initialize().finally(() => {
			this.unlocking = void 0;
		}), this.unlocking);
	}
	async initialize() {
		let t = await loadOPM(this.moduleUrl);
		if (this.destroyed) throw new require_errors.AudioError(`Audio adapter has been destroyed`);
		let r = [];
		this.pendingSlots = r;
		let i, a = !1;
		try {
			let o = this.lent?.();
			if (this.lent && (!o || o.state === `closed`)) throw new require_errors.AudioError(`The lent AudioContext is unavailable.`);
			o ||= (i = new AudioContext(), this.owned = i, i);
			let s = o;
			for (let n = 0; n < require_audio.audioDefaults.voiceCount; n++) r.push({ opm: new t({
				context: s,
				destination: null
			}) });
			if (await Promise.all(r.map(async (e) => {
				try {
					if (await e.opm.start(), a || this.destroyed) {
						this.dispose(e);
						return;
					}
					let t = s.createGain();
					e.gain = t, e.opm.node.connect(t);
				} catch (e) {
					a = !0;
					for (let e of r) this.dispose(e);
					throw e;
				}
			})), this.destroyed) throw new require_errors.AudioError(`Audio adapter has been destroyed`);
			for (let e of r) e.gain.connect(this.output?.(s, `sfx`) ?? s.destination);
			if (this.slots = r, this.contextList = Object.freeze([s]), i && await this.setPaused(this.frozen), this.destroyed) throw new require_errors.AudioError(`Audio adapter has been destroyed`);
		} catch (e) {
			a = !0, this.release();
			for (let e of r) this.dispose(e);
			throw e;
		} finally {
			this.pendingSlots = void 0;
		}
	}
	play(e, t, n, i, a, o, s = `sfx`, c) {
		let l = this.getSlot(e);
		l.gain.gain.value = o, l.gain.disconnect(), l.panner?.disconnect(), l.panner = void 0;
		let u = this.output?.(l.opm.context, s) ?? l.opm.context.destination;
		if (c) {
			let e = l.opm.context.createPanner();
			require_spatial.applyPannerOptions(e, c), l.gain.connect(e), e.connect(u), l.panner = e;
		} else l.gain.connect(u);
		l.noteId = l.opm.playNote({
			voice: nativeVoice(t),
			note: n,
			time: i,
			duration: a
		});
	}
	stop(e) {
		let t = this.getSlot(e);
		t.noteId !== void 0 && (t.opm.stop(t.noteId), t.noteId = void 0);
	}
	setPosition(e, t) {
		let n = this.getSlot(e).panner;
		n && (n.positionX.value = t.x, n.positionY.value = t.y, n.positionZ.value = t.z);
	}
	reset(e) {
		let t = this.getSlot(e);
		t.opm.panic(), t.noteId = void 0;
	}
	setGain(e, t) {
		this.getSlot(e).gain.gain.value = t;
	}
	release() {
		for (let e of this.slots) this.dispose(e);
		this.slots = [], this.contextList = [];
		let e = this.owned;
		this.owned = void 0, e && e.state !== `closed` && e.close().catch(() => {});
	}
	destroy() {
		if (!this.destroyed) {
			this.destroyed = !0;
			for (let e of this.pendingSlots ?? []) this.dispose(e);
			this.pendingSlots = void 0, this.release();
		}
	}
	getSlot(e) {
		if (!this.unlocked) throw new require_errors.AudioError(`Unlock audio before playing`);
		if (!Number.isInteger(e) || e < 0 || e >= this.slots.length) throw new require_errors.AudioError(`Invalid audio slot: ${e}`);
		return this.slots[e];
	}
	dispose(e) {
		if (e.opm.dispose().catch(() => {}), e.gain) {
			try {
				e.gain.disconnect();
			} catch {}
			e.gain = void 0;
		}
		e.panner?.disconnect(), e.panner = void 0, e.noteId = void 0;
	}
};
//#endregion
exports.OPMAdapter = OPMAdapter;
exports.resolveOPMModuleURL = resolveOPMModuleURL;

//# sourceMappingURL=opm-adapter.cjs.map