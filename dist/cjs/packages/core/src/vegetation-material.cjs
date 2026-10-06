const require_native_pbr_material = require("./native-pbr-material.cjs");
const require_vegetation = require("../../../src/data/vegetation.cjs");
//#region dist/packages/core/src/vegetation-material.js
var VegetationMaterial = class extends require_native_pbr_material.NativePBRMaterial {
	constructor(t) {
		let n = t.windAmplitude ?? require_vegetation.vegetationDefaults.windAmplitude, r = t.windFrequency ?? require_vegetation.vegetationDefaults.windFrequency, i = t.bladeHeight ?? require_vegetation.vegetationDefaults.bladeHeight, a = t.rootHeight ?? 0, o = t.phaseScale ?? require_vegetation.vegetationDefaults.phaseScale, s = t.windDirection ?? [1, 0];
		for (let e of [
			n,
			r,
			i,
			a,
			o,
			...s
		]) if (!Number.isFinite(e) || !Number.isFinite(Math.fround(e))) throw RangeError(`Vegetation wind values must fit finite Float32.`);
		if (n < 0 || r < 0 || i <= 0 || Math.fround(i) === 0 || s.length !== 2) throw RangeError(`Vegetation requires nonnegative wind and positive blade height.`);
		let c = Math.hypot(...s);
		if (c === 0) throw RangeError(`Wind direction must be nonzero.`);
		super({
			...t,
			wgsl: `
fn vegetationWind(position:vec3f, normal:vec3f, phase:f32)->XYZVertex {
  let wind=mesh.custom[0]; let shape=mesh.custom[1];
  let h=clamp((position.y-shape.z)/shape.x,0.0,1.0);
  let wave=sin(wind.x*wind.z+phase)*wind.y;
  let direction=mesh.custom[2].xy;
  let derivative=select(0.0,2.0*h/shape.x,position.y>shape.z && position.y<shape.z+shape.x)*wave;
  let displaced=position+vec3f(direction.x,0.0,direction.y)*(wave*h*h);
  let bentNormal=vec3f(normal.x,normal.y-derivative*dot(direction,normal.xz),normal.z);
  return XYZVertex(displaced,normalize(bentNormal));
}
fn xyzDeform(position:vec3f,normal:vec3f,uv:vec2f)->XYZVertex {
  return vegetationWind(position,normal,0.0);
}
fn xyzDeformInstance(position:vec3f,normal:vec3f,uv:vec2f,instance:mat4x4f)->XYZVertex {
  return vegetationWind(position,normal,dot(instance[3].xz,vec2f(0.754877666,0.569840296))*mesh.custom[1].y);
}
fn xyzPhysical(world:vec3f,normal:vec3f,uv:vec2f,surface:XYZPhysical)->XYZPhysical { return surface; }
`,
			glsl: `
XYZVertex vegetationWind(vec3 position,vec3 normal,float phase) {
  vec4 wind=xyzUniforms[0]; vec4 shape=xyzUniforms[1];
  float h=clamp((position.y-shape.z)/shape.x,0.0,1.0);
  float wave=sin(wind.x*wind.z+phase)*wind.y;
  vec2 direction=xyzUniforms[2].xy;
  float derivative=(position.y>shape.z && position.y<shape.z+shape.x ? 2.0*h/shape.x : 0.0)*wave;
  vec3 displaced=position+vec3(direction.x,0.0,direction.y)*(wave*h*h);
  vec3 bentNormal=vec3(normal.x,normal.y-derivative*dot(direction,normal.xz),normal.z);
  return XYZVertex(displaced,normalize(bentNormal));
}
XYZVertex xyzDeform(vec3 position,vec3 normal,vec2 uv) { return vegetationWind(position,normal,0.0); }
XYZVertex xyzDeformInstance(vec3 position,vec3 normal,vec2 uv,mat4 instance) {
  return vegetationWind(position,normal,dot(instance[3].xz,vec2(0.754877666,0.569840296))*xyzUniforms[1].y);
}
XYZPhysical xyzPhysical(vec3 world,vec3 normal,vec2 uv,XYZPhysical surface) { return surface; }
`,
			label: `VegetationMaterial`,
			deformationBounds: Math.fround(n) * Math.hypot(Math.fround(s[0] / c), Math.fround(s[1] / c)),
			shadowCache: `tracked`,
			uniforms: [
				0,
				n,
				r,
				0,
				i,
				o,
				a,
				0,
				s[0] / c,
				s[1] / c,
				0,
				0
			]
		});
	}
	update(e) {
		if (this.destroyed) throw Error(`VegetationMaterial is destroyed.`);
		if (!Number.isFinite(e) || !Number.isFinite(Math.fround(e))) throw RangeError(`Vegetation time must fit finite Float32.`);
		this.uniforms[0] = e;
	}
};
//#endregion
exports.VegetationMaterial = VegetationMaterial;

//# sourceMappingURL=vegetation-material.cjs.map