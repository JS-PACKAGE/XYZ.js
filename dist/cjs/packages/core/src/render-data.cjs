const require_math3d = require("../../math/src/math3d.cjs");
const require_render_settings = require("./render-settings.cjs");
const require_lights = require("./lights.cjs");
const require_environment = require("./environment.cjs");
const require_reflection_probe = require("./reflection-probe.cjs");
//#region dist/packages/core/src/render-data.js
function finite(e, t) {
	if (!Number.isFinite(e) || !Number.isFinite(Math.fround(e))) throw RangeError(`${t} must be finite and fit in Float32.`);
}
function nonnegative(e, t) {
	if (finite(e, t), e < 0) throw RangeError(`${t} cannot be negative.`);
}
function vector(e, n) {
	if (!(e instanceof require_math3d.Vector3)) throw TypeError(`${n} must be a Vector3.`);
	finite(e.x, n), finite(e.y, n), finite(e.z, n);
}
function validateRenderSettings(e) {
	if (e.transparency !== `sorted` && e.transparency !== `weighted`) throw RangeError(`Scene transparency must be sorted or weighted.`);
	if (!(e.shadows instanceof require_render_settings.ShadowSettings)) throw TypeError(`Scene shadows must be ShadowSettings.`);
	if (!(e.postProcessing instanceof require_render_settings.PostProcessingSettings)) throw TypeError(`Scene postProcessing must be PostProcessingSettings.`);
	if (e.shadows.validate(), e.postProcessing.validate(), !(e.fog instanceof require_render_settings.FogSettings)) throw TypeError(`Scene fog must be FogSettings.`);
	e.fog.validate();
	for (let [t, n] of [[`environment`, e.environment], [`background`, e.background]]) if (n !== void 0 && !(n instanceof require_environment.EnvironmentMap)) throw TypeError(`Scene ${t} must be an EnvironmentMap.`);
	if (nonnegative(e.environmentIntensity, `Environment intensity`), nonnegative(e.backgroundIntensity, `Background intensity`), !Array.isArray(e.reflectionProbes)) throw TypeError(`Scene reflectionProbes must be an array.`);
	for (let t of e.reflectionProbes) {
		if (!(t instanceof require_reflection_probe.ReflectionProbe)) throw TypeError(`Scene reflectionProbes must contain ReflectionProbe objects.`);
		t.validate();
	}
}
function activeEnvironment(e) {
	return e.environment && !e.environment.destroyed ? e.environment : void 0;
}
function activeBackground(e) {
	return e.background && !e.background.destroyed ? e.background : void 0;
}
function selectReflectionProbes(e, t) {
	t.length = 0;
	for (let n of e.reflectionProbes) if (n.enabled && !n.environment.destroyed && t.push(n), t.length === 4) break;
	return t;
}
function fillProbeBlendData(e, t, n = 0, r) {
	if (!(t instanceof Float32Array) || !Number.isInteger(n) || n < 0 || t.length < n + 260) throw RangeError(`Reflection output requires 260 Float32 values.`);
	if (r && r.length > 4) throw RangeError(`At most four reflection probes can be bound.`);
	t.fill(0, n, n + 260);
	let i = activeEnvironment(e);
	i && (t.set(i.sh, n), t[n + 36] = e.environmentIntensity, t[n + 37] = 1, t[n + 38] = i.mipCount - 1);
	let a = r ?? e.reflectionProbes, o = 0;
	for (let e of a) {
		if (!e.enabled || e.environment.destroyed) continue;
		let r = n + 52 * (o + 1);
		if (t.set(e.environment.sh, r), t[r + 36] = e.intensity, t[r + 37] = 1, t[r + 38] = e.environment.mipCount - 1, t[r + 39] = +!!e.boxProjection, t[r + 40] = e.min.x, t[r + 41] = e.min.y, t[r + 42] = e.min.z, t[r + 43] = e.blendDistance, t[r + 44] = e.max.x, t[r + 45] = e.max.y, t[r + 46] = e.max.z, t[r + 48] = e.position.x, t[r + 49] = e.position.y, t[r + 50] = e.position.z, ++o === 4) break;
	}
	return i;
}
function decodeSRGB(e) {
	return e <= .04045 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4;
}
function fillFogData(e, t) {
	if (!(t instanceof Float32Array) || t.length < 8) throw RangeError(`Fog output requires at least 8 Float32 values.`);
	let n = e.fog, i = e.postProcessing.enabled;
	for (let e = 0; e < 3; e++) t[e] = i ? decodeSRGB(n.color[e]) : n.color[e];
	t[3] = n.enabled ? n.mode === `linear` ? 1 : 2 : 0, t[4] = n.near, t[5] = n.far, t[6] = n.density, t[7] = 0;
}
function fillLightingData(e, t, n) {
	if (!(t instanceof Float32Array) || t.length < 812) throw RangeError(`Lighting output requires at least 812 Float32 values.`);
	let r = n?.pointLights ?? e.pointLights, f = n?.spotLights ?? e.spotLights;
	if (!Array.isArray(r) || !Array.isArray(f)) throw TypeError(`Lighting pointLights and spotLights must be arrays.`);
	let h = r.length, g = f.length;
	if (h > 32 || g > 32) throw RangeError(`A lighting draw supports at most 32 point lights and 32 spot lights; use SpatialLightSelector for larger scene pools.`);
	let _ = e.directionalLight;
	if (vector(_.direction, `Directional light direction`), nonnegative(_.intensity, `Directional light intensity`), nonnegative(e.ambientLight, `Ambient light`), !Array.isArray(_.color) || _.color.length !== 3) throw RangeError(`Directional light color must contain three components.`);
	for (let e = 0; e < 3; e++) nonnegative(_.color[e], `Directional light color component`);
	t[0] = _.direction.x, t[1] = _.direction.y, t[2] = _.direction.z, t[3] = _.intensity, t[4] = _.color[0], t[5] = _.color[1], t[6] = _.color[2], t[7] = e.ambientLight, t[8] = h, t[9] = g, t[10] = 0, t[11] = 0;
	for (let e = 0; e < h; e++) {
		let n = r[e];
		if (!(n instanceof require_lights.PointLight)) throw TypeError(`Scene pointLights must contain PointLight objects.`);
		n.validate(), writePoint(n, t, 12 + e * 8), t[780 + e] = n.id;
	}
	t.fill(0, 12 + h * 8, 268);
	for (let e = 0; e < g; e++) {
		let n = f[e];
		if (!(n instanceof require_lights.SpotLight)) throw TypeError(`Scene spotLights must contain SpotLight objects.`);
		n.validate();
		let r = 268 + e * 16;
		writePoint(n, t, r);
		let i = n.direction, a = i.length();
		t[r + 8] = i.x / a, t[r + 9] = i.y / a, t[r + 10] = i.z / a, t[r + 11] = Math.cos(n.outerAngle), t[r + 12] = Math.cos(n.innerAngle), t[r + 13] = n.id, t[r + 14] = 0, t[r + 15] = 0;
	}
	t.fill(0, 268 + g * 16, 780), t.fill(0, 780 + h, 812);
}
function writePoint(e, t, n) {
	t[n] = e.position.x, t[n + 1] = e.position.y, t[n + 2] = e.position.z, t[n + 3] = e.range, t[n + 4] = e.color[0], t[n + 5] = e.color[1], t[n + 6] = e.color[2], t[n + 7] = e.intensity;
}
function computeShadowMatrix(t, n) {
	if (!(n instanceof require_math3d.Matrix4)) throw TypeError(`Shadow matrix output must be a Matrix4.`);
	let r = t.shadows;
	if (!(r instanceof require_render_settings.ShadowSettings)) throw TypeError(`Scene shadows must be ShadowSettings.`);
	r.validate();
	let i = t.directionalLight.direction;
	vector(i, `Directional light direction`);
	let a = i.length();
	if (a === 0) throw RangeError(`Directional shadow light direction cannot be zero.`);
	let o = i.x / a, s = i.y / a, c = i.z / a, l, u, d;
	Math.abs(s) > .999 ? (l = -s, u = o, d = 0) : (l = c, u = 0, d = -o);
	let f = Math.hypot(l, u, d);
	l /= f, u /= f, d /= f;
	let p = s * d - c * u, m = c * l - o * d, h = o * u - s * l, g = r.target, v = r.far / 2, y = g.x + o * v, b = g.y + s * v, x = g.z + c * v, S = 2 / r.extent, C = 1 / (r.near - r.far), w = n.elements;
	w[0] = S * l, w[1] = S * p, w[2] = C * o, w[3] = 0, w[4] = S * u, w[5] = S * m, w[6] = C * s, w[7] = 0, w[8] = S * d, w[9] = S * h, w[10] = C * c, w[11] = 0, w[12] = -S * (l * y + u * b + d * x), w[13] = -S * (p * y + m * b + h * x), w[14] = C * (r.near - (o * y + s * b + c * x)), w[15] = 1;
	for (let e = 0; e < 16; e++) if (!Number.isFinite(w[e])) throw RangeError(`Shadow projection must fit in Float32.`);
	return n;
}
//#endregion
exports.activeBackground = activeBackground;
exports.activeEnvironment = activeEnvironment;
exports.computeShadowMatrix = computeShadowMatrix;
exports.fillFogData = fillFogData;
exports.fillLightingData = fillLightingData;
exports.fillProbeBlendData = fillProbeBlendData;
exports.selectReflectionProbes = selectReflectionProbes;
exports.validateRenderSettings = validateRenderSettings;

//# sourceMappingURL=render-data.cjs.map