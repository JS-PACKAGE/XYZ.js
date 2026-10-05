//#region dist/packages/core/src/lighting2d.js
var MAX_LIGHTS_2D = require("../../../src/data/lighting2d.cjs").lighting2dLimits.lightsPerSprite;
var Light2D = class {
	position;
	height;
	radius;
	intensity;
	color;
	space;
	enabled = !0;
	constructor(e = {}) {
		this.position = [...e.position ?? [0, 0]], this.height = e.height ?? 64, this.radius = e.radius ?? 256, this.intensity = e.intensity ?? 1, this.color = [...e.color ?? [
			1,
			1,
			1
		]], this.space = e.space ?? `world`, this.validate();
	}
	validate() {
		if (this.position.length !== 2 || this.color.length !== 3 || !this.position.every(Number.isFinite) || !this.color.every(Number.isFinite) || !Number.isFinite(this.height) || !Number.isFinite(this.radius) || !Number.isFinite(this.intensity) || this.height < 0 || this.radius <= 0 || this.intensity < 0 || this.color.some((e) => e < 0) || this.space !== `world` && this.space !== `screen`) throw RangeError(`Light2D requires finite coordinates, positive radius and nonnegative height/intensity/color.`);
	}
};
var Lighting2D = class {
	lights;
	ambient;
	constructor(e = {}) {
		this.lights = [...e.lights ?? []], this.ambient = [...e.ambient ?? [
			.1,
			.1,
			.1
		]], this.validate();
	}
	validate() {
		if (this.lights.length > MAX_LIGHTS_2D) throw RangeError(`Lighting2D supports at most ${MAX_LIGHTS_2D} lights per sprite.`);
		if (this.ambient.length !== 3 || !this.ambient.every((e) => Number.isFinite(e) && e >= 0)) throw RangeError(`Lighting2D ambient must contain three finite nonnegative components.`);
		for (let e of this.lights) {
			if (!(e instanceof Light2D)) throw TypeError(`Lighting2D lights must be Light2D instances.`);
			e.validate();
		}
	}
};
function validateSpriteLighting2D(e) {
	if (!e.lighting) {
		if (e.normalTexture) throw RangeError(`Sprite.normalTexture requires Sprite.lighting.`);
		return;
	}
	if (!(e.lighting instanceof Lighting2D)) throw TypeError(`Sprite.lighting must be Lighting2D.`);
	e.lighting.validate();
	let t = e.normalTexture;
	if (t && (t.destroyed || t.kind !== `image` && t.kind !== `canvas`)) throw RangeError(`Normal maps must be live CPU-backed Texture2DSource objects.`);
	if (t && (t.width !== e.texture.width || t.height !== e.texture.height)) throw RangeError(`Normal map must match the albedo atlas dimensions and frame layout.`);
	if (e.material) throw RangeError(`Lighting2D cannot be combined with a custom Material2D.`);
}
//#endregion
exports.Light2D = Light2D;
exports.Lighting2D = Lighting2D;
exports.MAX_LIGHTS_2D = MAX_LIGHTS_2D;
exports.validateSpriteLighting2D = validateSpriteLighting2D;

//# sourceMappingURL=lighting2d.cjs.map