const require_math3d = require("../../math/src/math3d.cjs");
const require_rendering_gpu = require("../../../src/data/rendering-gpu.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_instanced_mesh = require("../../core/src/instanced-mesh.cjs");
const require_skinned_mesh = require("../../core/src/skinned-mesh.cjs");
//#region dist/packages/graphics/src/object-motion.js
function writeClipTransform(e, t, n, r) {
	let i = n.elements, a = r.elements, o = i[0], s = i[1], c = i[2], l = i[3], u = i[4], d = i[5], f = i[6], p = i[7], m = i[8], h = i[9], g = i[10], _ = i[11], v = i[12], y = i[13], b = i[14], x = i[15];
	for (let n = 0; n < 4; n++) {
		let r = n * 4, i = a[r], S = a[r + 1], C = a[r + 2], w = a[r + 3];
		e[t + r] = o * i + u * S + m * C + v * w, e[t + r + 1] = s * i + d * S + h * C + y * w, e[t + r + 2] = c * i + f * S + g * C + b * w, e[t + r + 3] = l * i + p * S + _ * C + x * w;
	}
}
var ObjectMotionHistory = class {
	poses;
	frame = 0;
	world = new require_math3d.Matrix4();
	instance = new require_math3d.Matrix4();
	draws = [];
	count = 0;
	build(e, a) {
		a.reprojectionValid || this.invalidate(), this.frame++, this.count = 0;
		for (let o of e) {
			if (o instanceof require_skinned_mesh.SkinnedMesh || o.morph || require_native_material3d.isNativeMaterial3D(o.material) || o.material.deformationBounds !== 0 || o.material.transparent) continue;
			let e = o instanceof require_instanced_mesh.InstancedMesh ? o.count : 1, s = this.poses?.get(o), c = s?.frame === this.frame - 1 && s.geometry === o.renderGeometry && s.version === o.renderGeometry.version && s.material === o.material;
			s || (s = {
				frame: 0,
				geometry: o.renderGeometry,
				version: o.renderGeometry.version,
				material: o.material,
				matrices: []
			}, (this.poses ??= /* @__PURE__ */ new WeakMap()).set(o, s));
			for (let r = 0; r < e; r++) {
				this.world.copy(o.worldMatrix), o instanceof require_instanced_mesh.InstancedMesh && (o.getMatrixAt(r, this.instance), this.world.multiply(this.instance));
				let e = s.matrices[r];
				if (c && e) {
					let t = this.draws[this.count];
					t || (t = {
						mesh: o,
						data: /* @__PURE__ */ new Float32Array(32)
					}, this.draws.push(t)), t.mesh = o, writeClipTransform(t.data, 0, a.currentVP, this.world), writeClipTransform(t.data, 16, a.previousVP, e), this.count++;
				}
				e || (s.matrices[r] = e = new require_math3d.Matrix4()), e.copy(this.world);
			}
			s.frame = this.frame, s.geometry = o.renderGeometry, s.version = o.renderGeometry.version, s.material = o.material;
		}
		return this.draws.length = this.count, this.draws;
	}
	invalidate() {
		this.poses = void 0, this.draws.length = 0, this.count = 0, this.frame = 0;
	}
};
var objectMotionWGSL = (t) => `
@group(0) @binding(0) var opaqueDepth: ${t > 1 ? `texture_depth_multisampled_2d` : `texture_depth_2d`};
struct PoseInput {
 @location(0) position:vec3f,
 @location(1) current0:vec4f, @location(2) current1:vec4f, @location(3) current2:vec4f, @location(4) current3:vec4f,
 @location(5) previous0:vec4f, @location(6) previous1:vec4f, @location(7) previous2:vec4f, @location(8) previous3:vec4f,
};
struct Vertex { @builtin(position) position:vec4f, @location(0) current:vec4f, @location(1) previous:vec4f };
@vertex fn vertexMain(input:PoseInput)->Vertex {
 var out:Vertex; out.current=mat4x4f(input.current0,input.current1,input.current2,input.current3)*vec4f(input.position,1.0);
 out.previous=mat4x4f(input.previous0,input.previous1,input.previous2,input.previous3)*vec4f(input.position,1.0); out.position=out.current;
 return out;
}
@fragment fn fragmentMain(input:Vertex)->@location(0) vec4f {
 var depth=1.0;
 ${t > 1 ? `for(var i=0;i<${t};i++) { depth=min(depth,textureLoad(opaqueDepth,vec2i(input.position.xy),i)); }` : `depth=textureLoad(opaqueDepth,vec2i(input.position.xy),0);`}
 if(abs(depth-input.position.z)>${require_rendering_gpu.motionBlurDefaults.velocityDepthTolerance}) { discard; }
 if(input.previous.w<=0.000001) { return vec4f(0.0); }
 return vec4f((input.current.xy/input.current.w-input.previous.xy/input.previous.w)*vec2f(0.5,-0.5),1.0,0.0);
}`;
var objectMotionGLVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 position;
uniform mat4 clipMatrices[2];
out vec4 currentPosition;
out vec4 previousPosition;
void main() { currentPosition=clipMatrices[0]*vec4(position,1.0); previousPosition=clipMatrices[1]*vec4(position,1.0);
 gl_Position=currentPosition; gl_Position.z=2.0*gl_Position.z-gl_Position.w; }
`;
var objectMotionGLFragment = `#version 300 es
precision highp float;
uniform highp sampler2D opaqueDepth;
in vec4 currentPosition;
in vec4 previousPosition;
out vec4 velocity;
void main() {
 if(abs(texelFetch(opaqueDepth,ivec2(gl_FragCoord.xy),0).r-gl_FragCoord.z)>${require_rendering_gpu.motionBlurDefaults.velocityDepthTolerance}) discard;
 if(previousPosition.w<=.000001) { velocity=vec4(0.0); return; }
 velocity=vec4((currentPosition.xy/currentPosition.w-previousPosition.xy/previousPosition.w)*.5,1.0,0.0); }
`;
//#endregion
exports.ObjectMotionHistory = ObjectMotionHistory;
exports.objectMotionGLFragment = objectMotionGLFragment;
exports.objectMotionGLVertex = objectMotionGLVertex;
exports.objectMotionWGSL = objectMotionWGSL;

//# sourceMappingURL=object-motion.cjs.map