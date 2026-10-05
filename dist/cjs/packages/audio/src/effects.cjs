const require_audio = require("../../../src/data/audio.cjs");
const require_errors = require("./errors.cjs");
//#region dist/packages/audio/src/effects.js
function range(e, n, r, i) {
	if (!Number.isFinite(e) || e < n || e > r) throw new require_errors.AudioError(`${i} must be within ${n}..${r}.`);
}
var n = /* @__PURE__ */ new WeakMap();
var PreparedAudioImpulse = class {
	#e = !1;
	sampleRate;
	length;
	numberOfChannels;
	constructor(r) {
		if (this.sampleRate = r.sampleRate, this.length = r.length, this.numberOfChannels = r.numberOfChannels, ![
			1,
			2,
			4
		].includes(this.numberOfChannels)) throw new require_errors.AudioError(`Convolution impulses require 1, 2 or 4 channels.`);
		range(this.sampleRate, 8e3, require_audio.audioDefaults.impulseSampleRate, `Impulse sample rate`), range(this.length, 1, require_audio.audioDefaults.impulseValues / this.numberOfChannels, `Impulse frames`);
		let i = Array.from({ length: this.numberOfChannels }, (e, n) => {
			let i = r.getChannelData(n).slice();
			for (let e of i) if (!Number.isFinite(e)) throw new require_errors.AudioError(`Impulse PCM must be finite.`);
			return i;
		});
		n.set(this, {
			channels: i,
			buffers: /* @__PURE__ */ new WeakMap()
		}), Object.freeze(this);
	}
	get destroyed() {
		return this.#e;
	}
	dispose() {
		this.#e = !0, n.delete(this);
	}
};
function snapshotEffects(n) {
	if (n.length > require_audio.audioDefaults.effectsPerBus) throw new require_errors.AudioError(`Audio effect budget is exhausted.`);
	let r = [
		`lowpass`,
		`highpass`,
		`bandpass`,
		`lowshelf`,
		`highshelf`,
		`peaking`,
		`notch`,
		`allpass`
	];
	return Object.freeze(n.map((n) => {
		switch (n.type) {
			case `biquad`:
				if (!r.includes(n.filter)) throw new require_errors.AudioError(`Unknown biquad filter.`);
				return range(n.frequency, 0, require_audio.audioDefaults.impulseSampleRate / 2, `Filter frequency`), range(n.Q ?? 1, 0, 1e3, `Filter Q`), range(n.gain ?? 0, -40, 40, `Filter gain`), range(n.detune ?? 0, -12e3, 12e3, `Filter detune`), Object.freeze({ ...n });
			case `compressor`: return range(n.threshold ?? -24, -100, 0, `Compressor threshold`), range(n.knee ?? 30, 0, 40, `Compressor knee`), range(n.ratio ?? 12, 1, 20, `Compressor ratio`), range(n.attack ?? .003, 0, 1, `Compressor attack`), range(n.release ?? .25, 0, 1, `Compressor release`), Object.freeze({ ...n });
			case `reverb`:
				if (!(n.impulse instanceof PreparedAudioImpulse) || n.impulse.destroyed) throw new require_errors.AudioError(`Reverb needs a live PreparedAudioImpulse.`);
				return range(n.wet ?? .5, 0, 1, `Reverb wet gain`), Object.freeze({ ...n });
			default: throw new require_errors.AudioError(`Unknown audio effect.`);
		}
	}));
}
function createEffectChain(e, r) {
	let i = [], gain = () => {
		let t = e.createGain();
		return i.push(t), t;
	}, a = gain(), o = a;
	try {
		for (let a of r) if (a.type === `biquad`) {
			let t = e.createBiquadFilter();
			i.push(t), t.type = a.filter, t.frequency.value = Math.min(a.frequency, e.sampleRate / 2), t.Q.value = a.Q ?? 1, t.gain.value = a.gain ?? 0, t.detune.value = a.detune ?? 0, o.connect(t), o = t;
		} else if (a.type === `compressor`) {
			let t = e.createDynamicsCompressor();
			i.push(t), t.threshold.value = a.threshold ?? -24, t.knee.value = a.knee ?? 30, t.ratio.value = a.ratio ?? 12, t.attack.value = a.attack ?? .003, t.release.value = a.release ?? .25, o.connect(t), o = t;
		} else {
			let r = e.createConvolver();
			i.push(r), r.normalize = a.normalize ?? !0;
			let s = n.get(a.impulse);
			if (!s) throw new require_errors.AudioError(`Audio impulse preparation has been disposed.`);
			let c = s.buffers.get(e);
			if (!c) {
				c = e.createBuffer(a.impulse.numberOfChannels, a.impulse.length, a.impulse.sampleRate);
				for (let e = 0; e < s.channels.length; e++) c.copyToChannel(s.channels[e], e);
				s.buffers.set(e, c);
			}
			r.buffer = c;
			let l = gain(), u = gain(), d = gain();
			l.gain.value = 1 - (a.wet ?? .5), u.gain.value = a.wet ?? .5, o.connect(l), l.connect(d), o.connect(r), r.connect(u), u.connect(d), o = d;
		}
		let s = gain();
		return o.connect(s), {
			input: a,
			output: s,
			disconnect: () => {
				for (let e of i) e.disconnect();
			}
		};
	} catch (e) {
		for (let e of i) e.disconnect();
		throw e;
	}
}
//#endregion
exports.PreparedAudioImpulse = PreparedAudioImpulse;
exports.createEffectChain = createEffectChain;
exports.snapshotEffects = snapshotEffects;

//# sourceMappingURL=effects.cjs.map