//#region dist/packages/core/src/color-grading.js
function validatePostNumber(e, t) {
	if (!Number.isFinite(e) || !Number.isFinite(Math.fround(e))) throw RangeError(`${t} must be finite and fit in Float32.`);
}
var ColorLUT3D = class ColorLUT3D {
	size;
	strip;
	constructor(e, t) {
		if (this.size = e, !Number.isInteger(e) || e < 16 || e > 64) throw RangeError(`LUT size must be an integer in 16..64.`);
		if (t.length !== e ** 3 * 3) throw RangeError(`LUT must contain size cubed RGB triples.`);
		this.strip = new Uint8Array(e ** 3 * 4);
		for (let n = 0; n < e ** 3; n++) {
			for (let r = 0; r < 3; r++) {
				let i = t[n * 3 + r];
				if (!Number.isFinite(i) || i < 0 || i > 1) throw RangeError(`LUT output components must be in 0..1.`);
				let a = n % e, o = Math.floor(n / e) % e, s = Math.floor(n / e ** 2);
				this.strip[(o * e * e + s * e + a) * 4 + r] = Math.round(i * 255);
			}
			let r = n % e, i = Math.floor(n / e) % e, a = Math.floor(n / e ** 2);
			this.strip[(i * e * e + a * e + r) * 4 + 3] = 255;
		}
	}
	static parseCube(e) {
		let t = 0, n = [];
		for (let r of e.split(/\r?\n/)) {
			let e = r.split(`#`)[0].trim();
			if (!e || /^TITLE\s/.test(e)) continue;
			let i = e.split(/\s+/);
			if (i[0] === `LUT_3D_SIZE`) {
				if (t || i.length !== 2) throw RangeError(`Duplicate or malformed LUT_3D_SIZE.`);
				t = Number(i[1]);
			} else if (i[0] === `DOMAIN_MIN` || i[0] === `DOMAIN_MAX`) {
				let e = i[0] === `DOMAIN_MIN` ? 0 : 1;
				if (i.length !== 4 || i.slice(1).some((t) => Number(t) !== e)) throw RangeError(`Only the normalized 0..1 .cube domain is supported.`);
			} else {
				if (i.length !== 3) throw RangeError(`Unsupported .cube directive or malformed RGB triple.`);
				n.push(...i.map(Number));
			}
		}
		return new ColorLUT3D(t, n);
	}
	static preset(e = 32, t = `identity`) {
		if (![
			`identity`,
			`warm`,
			`cool`,
			`cinematic`
		].includes(t)) throw RangeError(`Unknown LUT preset.`);
		if (!Number.isInteger(e) || e < 16 || e > 64) throw RangeError(`LUT size must be an integer in 16..64.`);
		let n = new Float32Array(e ** 3 * 3);
		for (let r = 0; r < e; r++) for (let i = 0; i < e; i++) for (let a = 0; a < e; a++) {
			let o = [
				a / (e - 1),
				i / (e - 1),
				r / (e - 1)
			];
			if (t === `warm` && (o[0] = Math.min(1, o[0] * 1.08), o[2] *= .9), t === `cool` && (o[2] = Math.min(1, o[2] * 1.08), o[0] *= .9), t === `cinematic`) for (let e = 0; e < 3; e++) o[e] = Math.max(0, Math.min(1, (o[e] - .5) * 1.12 + .5));
			n.set(o, ((r * e + i) * e + a) * 3);
		}
		return new ColorLUT3D(e, n);
	}
};
var ColorGradingSettings = class {
	lut;
	strength;
	constructor(e, t = 1) {
		this.lut = e, this.strength = t, this.validate();
	}
	validate() {
		if (!(this.lut instanceof ColorLUT3D)) throw TypeError(`Color grading requires a ColorLUT3D.`);
		if (validatePostNumber(this.strength, `Color grading strength`), this.strength < 0 || this.strength > 1) throw RangeError(`Color grading strength must be in 0..1.`);
	}
};
//#endregion
exports.ColorGradingSettings = ColorGradingSettings;
exports.ColorLUT3D = ColorLUT3D;
exports.validatePostNumber = validatePostNumber;

//# sourceMappingURL=color-grading.cjs.map