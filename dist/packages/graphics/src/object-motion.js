import{motionBlurDefaults as e}from"../../../src/data/rendering.js";import{Matrix4 as t}from"../../math/src/index.js";import{InstancedMesh as n}from"../../core/src/instanced-mesh.js";import{SkinnedMesh as r}from"../../core/src/skinned-mesh.js";import{isNativeMaterial3D as i}from"../../core/src/native-material3d.js";function writeClipTransform(e,t,n,r){let i=n.elements,a=r.elements,o=i[0],s=i[1],c=i[2],l=i[3],u=i[4],d=i[5],f=i[6],p=i[7],m=i[8],h=i[9],g=i[10],_=i[11],v=i[12],y=i[13],b=i[14],x=i[15];for(let n=0;n<4;n++){let r=n*4,i=a[r],S=a[r+1],C=a[r+2],w=a[r+3];e[t+r]=o*i+u*S+m*C+v*w,e[t+r+1]=s*i+d*S+h*C+y*w,e[t+r+2]=c*i+f*S+g*C+b*w,e[t+r+3]=l*i+p*S+_*C+x*w}}export class ObjectMotionHistory{poses;frame=0;world=new t;instance=new t;draws=[];count=0;build(e,a){a.reprojectionValid||this.invalidate(),this.frame++,this.count=0;for(let o of e){if(o instanceof r||o.morph||i(o.material)||o.material.deformationBounds!==0||o.material.transparent)continue;let e=o instanceof n?o.count:1,s=this.poses?.get(o),c=s?.frame===this.frame-1&&s.geometry===o.renderGeometry&&s.version===o.renderGeometry.version&&s.material===o.material;s||(s={frame:0,geometry:o.renderGeometry,version:o.renderGeometry.version,material:o.material,matrices:[]},(this.poses??=new WeakMap).set(o,s));for(let r=0;r<e;r++){this.world.copy(o.worldMatrix),o instanceof n&&(o.getMatrixAt(r,this.instance),this.world.multiply(this.instance));let e=s.matrices[r];if(c&&e){let t=this.draws[this.count];t||(t={mesh:o,data:new Float32Array(32)},this.draws.push(t)),t.mesh=o,writeClipTransform(t.data,0,a.currentVP,this.world),writeClipTransform(t.data,16,a.previousVP,e),this.count++}e||(s.matrices[r]=e=new t),e.copy(this.world)}s.frame=this.frame,s.geometry=o.renderGeometry,s.version=o.renderGeometry.version,s.material=o.material}return this.draws.length=this.count,this.draws}invalidate(){this.poses=void 0,this.draws.length=0,this.count=0,this.frame=0}}export const objectMotionWGSL=t=>`
struct Pose { current:mat4x4f, previous:mat4x4f };
@group(0) @binding(0) var<uniform> pose:Pose;
@group(0) @binding(1) var opaqueDepth: ${t>1?`texture_depth_multisampled_2d`:`texture_depth_2d`};
struct Vertex { @builtin(position) position:vec4f, @location(0) current:vec4f, @location(1) previous:vec4f };
@vertex fn vertexMain(@location(0) position:vec3f)->Vertex {
 var out:Vertex; out.current=pose.current*vec4f(position,1.0);
 out.previous=pose.previous*vec4f(position,1.0); out.position=out.current;
 return out;
}
@fragment fn fragmentMain(input:Vertex)->@location(0) vec4f {
 var depth=1.0;
 ${t>1?`for(var i=0;i<${t};i++) { depth=min(depth,textureLoad(opaqueDepth,vec2i(input.position.xy),i)); }`:`depth=textureLoad(opaqueDepth,vec2i(input.position.xy),0);`}
 if(abs(depth-input.position.z)>${e.velocityDepthTolerance}) { discard; }
 if(input.previous.w<=0.000001) { return vec4f(0.0); }
 return vec4f((input.current.xy/input.current.w-input.previous.xy/input.previous.w)*vec2f(0.5,-0.5),1.0,0.0);
}`;export const objectMotionGLVertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 position;
uniform mat4 currentClip;
uniform mat4 previousClip;
out vec4 currentPosition;
out vec4 previousPosition;
void main() { currentPosition=currentClip*vec4(position,1.0); previousPosition=previousClip*vec4(position,1.0);
 gl_Position=currentPosition; gl_Position.z=2.0*gl_Position.z-gl_Position.w; }
`;export const objectMotionGLFragment=`#version 300 es
precision highp float;
uniform highp sampler2D opaqueDepth;
in vec4 currentPosition;
in vec4 previousPosition;
out vec4 velocity;
void main() {
 if(abs(texelFetch(opaqueDepth,ivec2(gl_FragCoord.xy),0).r-gl_FragCoord.z)>${e.velocityDepthTolerance}) discard;
 if(previousPosition.w<=.000001) { velocity=vec4(0.0); return; }
 velocity=vec4((currentPosition.xy/currentPosition.w-previousPosition.xy/previousPosition.w)*.5,1.0,0.0); }
`;
//# sourceMappingURL=object-motion.js.map
