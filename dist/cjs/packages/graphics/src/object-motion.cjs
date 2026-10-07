const require_math3d = require("../../math/src/math3d.cjs");
const require_rendering = require("../../../src/data/rendering.cjs");
const require_native_material3d = require("../../core/src/native-material3d.cjs");
const require_instanced_mesh = require("../../core/src/instanced-mesh.cjs");
const require_skinned_mesh = require("../../core/src/skinned-mesh.cjs");
//#region dist/packages/graphics/src/object-motion.js
var ObjectMotionHistory = class {
	poses = /* @__PURE__ */ new WeakMap();
	frame = 0;
	world = new require_math3d.Matrix4();
	instance = new require_math3d.Matrix4();
	clip = new require_math3d.Matrix4();
	draws = [];
	count = 0;
	build(e, a) {
		a.reprojectionValid || this.invalidate(), this.frame++, this.count = 0;
		for (let o of e) {
			if (o instanceof require_skinned_mesh.SkinnedMesh || o.morph || require_native_material3d.isNativeMaterial3D(o.material) || o.material.deformationBounds !== 0 || o.material.transparent) continue;
			let e = o instanceof require_instanced_mesh.InstancedMesh ? o.count : 1, s = this.poses.get(o), c = s?.frame === this.frame - 1 && s.geometry === o.renderGeometry && s.version === o.renderGeometry.version && s.material === o.material;
			s || (s = {
				frame: 0,
				geometry: o.renderGeometry,
				version: o.renderGeometry.version,
				material: o.material,
				matrices: []
			}, this.poses.set(o, s));
			for (let r = 0; r < e; r++) {
				this.world.copy(o.worldMatrix), o instanceof require_instanced_mesh.InstancedMesh && (o.getMatrixAt(r, this.instance), this.world.multiply(this.instance));
				let e = s.matrices[r];
				if (c && e) {
					let t = this.draws[this.count];
					t || (t = {
						mesh: o,
						data: /* @__PURE__ */ new Float32Array(32)
					}, this.draws.push(t)), t.mesh = o, t.data.set(this.clip.copy(a.currentVP).multiply(this.world).elements, 0), t.data.set(this.clip.copy(a.previousVP).multiply(e).elements, 16), this.count++;
				}
				e || (s.matrices[r] = e = new require_math3d.Matrix4()), e.copy(this.world);
			}
			s.frame = this.frame, s.geometry = o.renderGeometry, s.version = o.renderGeometry.version, s.material = o.material;
		}
		return this.draws.length = this.count, this.draws;
	}
	invalidate() {
		this.poses = /* @__PURE__ */ new WeakMap(), this.draws.length = 0, this.count = 0, this.frame = 0;
	}
};
var objectMotionWGSL = (t) => `
struct Pose { current:mat4x4f, previous:mat4x4f };
@group(0) @binding(0) var<uniform> pose:Pose;
@group(0) @binding(1) var opaqueDepth: ${t > 1 ? `texture_depth_multisampled_2d` : `texture_depth_2d`};
struct Vertex { @builtin(position) position:vec4f, @location(0) current:vec4f, @location(1) previous:vec4f };
@vertex fn vertexMain(@location(0) position:vec3f)->Vertex {
 var out:Vertex; out.current=pose.current*vec4f(position,1.0);
 out.previous=pose.previous*vec4f(position,1.0); out.position=out.current;
 return out;
}
@fragment fn fragmentMain(input:Vertex)->@location(0) vec4f {
 var depth=1.0;
 ${t > 1 ? `for(var i=0;i<${t};i++) { depth=min(depth,textureLoad(opaqueDepth,vec2i(input.position.xy),i)); }` : `depth=textureLoad(opaqueDepth,vec2i(input.position.xy),0);`}
 if(abs(depth-input.position.z)>${require_rendering.motionBlurDefaults.velocityDepthTolerance}) { discard; }
 if(input.previous.w<=0.000001) { return vec4f(0.0); }
 return vec4f((input.current.xy/input.current.w-input.previous.xy/input.previous.w)*vec2f(0.5,-0.5),1.0,0.0);
}`;
var objectMotionGLVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 position;
uniform mat4 currentClip;
uniform mat4 previousClip;
out vec4 currentPosition;
out vec4 previousPosition;
void main() { currentPosition=currentClip*vec4(position,1.0); previousPosition=previousClip*vec4(position,1.0);
 gl_Position=currentPosition; gl_Position.z=2.0*gl_Position.z-gl_Position.w; }
`;
var objectMotionGLFragment = `#version 300 es
precision highp float;
uniform highp sampler2D opaqueDepth;
in vec4 currentPosition;
in vec4 previousPosition;
out vec4 velocity;
void main() {
 if(abs(texelFetch(opaqueDepth,ivec2(gl_FragCoord.xy),0).r-gl_FragCoord.z)>${require_rendering.motionBlurDefaults.velocityDepthTolerance}) discard;
 if(previousPosition.w<=.000001) { velocity=vec4(0.0); return; }
 velocity=vec4((currentPosition.xy/currentPosition.w-previousPosition.xy/previousPosition.w)*.5,1.0,0.0); }
`;
//#endregion
exports.ObjectMotionHistory = ObjectMotionHistory;
exports.objectMotionGLFragment = objectMotionGLFragment;
exports.objectMotionGLVertex = objectMotionGLVertex;
exports.objectMotionWGSL = objectMotionWGSL;

//# sourceMappingURL=object-motion.cjs.map