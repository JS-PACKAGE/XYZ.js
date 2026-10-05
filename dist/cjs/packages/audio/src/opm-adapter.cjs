const require_audio = require("../../../src/data/audio.cjs");
const require_errors = require("./errors.cjs");
const require_spatial = require("./samples/spatial.cjs");
//#region dist/packages/audio/src/opm-adapter.js
var __xyzOriginalModuleURL = require("node:url").pathToFileURL(require("node:path").resolve(__dirname, "../../../../packages/audio/src/opm-adapter.js")).href;
var r = /* @__PURE__ */ new WeakMap();
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
	return r.set(t, {
		...t,
		version: 7
	}), t;
}
function nativeVoice(e) {
	let t = r.get(e);
	return t ? Object.isFrozen(e) ? t : {
		...e,
		version: 7
	} : e;
}
function legacyOPM(e) {
	let n = new Map([...e.voices].map(([e, t]) => [e, engineVoice(t)]));
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
		voices: n,
		loadVoice(t, i) {
			e.loadVoice(t, typeof i == `object` && i && r.has(i) ? nativeVoice(i) : i), n.set(t, engineVoice(e.voices.get(t)));
		},
		start: () => e.start(),
		playNote(r) {
			let i = typeof r.voice == `string` ? n.get(r.voice) : r.voice;
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
async function loadOPM() {
	return (await import(new URL(`../../../vendor/opm/dist/api/index.js`, __xyzOriginalModuleURL).href)).OPM;
}
var OPMAdapter = class {
	output;
	slots = [];
	pendingSlots;
	unlocking;
	destroyed = !1;
	frozen = !1;
	contextList = [];
	constructor(e) {
		this.output = e;
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
		let t = new (await (loadOPM()))();
		return t.loadVoice(`validated`, e), engineVoice(t.voices.get(`validated`));
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
		return this.unlocked ? this.slots[0].opm.context ?? void 0 : void 0;
	}
	unlock() {
		return this.destroyed ? Promise.reject(new require_errors.AudioError(`Audio adapter has been destroyed`)) : this.unlocked ? Promise.resolve() : (this.unlocking ||= this.initialize().finally(() => {
			this.unlocking = void 0;
		}), this.unlocking);
	}
	async initialize() {
		let n = await loadOPM();
		if (this.destroyed) throw new require_errors.AudioError(`Audio adapter has been destroyed`);
		let r = Array.from({ length: require_audio.audioDefaults.voiceCount }, () => ({ opm: new n() }));
		this.pendingSlots = r;
		let i = !1;
		try {
			if (await Promise.all(r.map(async (e) => {
				try {
					if (await e.opm.start(), i || this.destroyed) {
						this.dispose(e);
						return;
					}
					let t = e.opm.context, n = e.opm.node, r = t.createGain();
					e.gain = r, n.disconnect(), n.connect(r), r.connect(t.destination);
				} catch (e) {
					i = !0;
					for (let e of r) this.dispose(e);
					throw e;
				}
			})), this.destroyed) throw new require_errors.AudioError(`Audio adapter has been destroyed`);
			for (let e of r) {
				let t = e.opm.context;
				e.gain.disconnect(), e.gain.connect(this.output?.(t, `sfx`) ?? t.destination);
			}
			if (this.slots = r, this.contextList = Object.freeze(r.map((e) => e.opm.context)), await this.setPaused(this.frozen), this.destroyed) throw new require_errors.AudioError(`Audio adapter has been destroyed`);
		} catch (e) {
			i = !0;
			for (let e of r) this.dispose(e);
			throw this.slots = [], this.contextList = [], e;
		} finally {
			this.pendingSlots = void 0;
		}
	}
	play(e, t, r, i, a, o, s = `sfx`, c) {
		let l = this.getSlot(e);
		l.gain.gain.value = o, l.gain.disconnect(), l.panner?.disconnect(), l.panner = void 0;
		let u = this.output?.(l.opm.context, s) ?? l.opm.context.destination;
		if (c) {
			let e = l.opm.context.createPanner();
			require_spatial.applyPannerOptions(e, c), l.gain.connect(e), e.connect(u), l.panner = e;
		} else l.gain.connect(u);
		l.noteId = l.opm.playNote({
			voice: nativeVoice(t),
			note: r,
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
	destroy() {
		if (!this.destroyed) {
			this.destroyed = !0;
			for (let e of this.slots) this.dispose(e);
			for (let e of this.pendingSlots ?? []) this.dispose(e);
			this.slots = [], this.contextList = [], this.pendingSlots = void 0;
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

//# sourceMappingURL=opm-adapter.cjs.map