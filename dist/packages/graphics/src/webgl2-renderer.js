import{Mesh as e}from"../../core/src/mesh.js";import{Sprite as t}from"../../core/src/sprite.js";import{defaults as n}from"../../../src/data/defaults.js";import{GraphicsError as r,WebGL2ContextLostError as i,WebGL2InitializationError as a}from"./errors.js";export class WebGL2Renderer{onError;backend=`webgl2`;canvas;gl;triangleProgram;spriteProgram;meshProgram;triangleVAO;spriteVAO;instanceBuffer;instanceCapacity=0;instances=new Float32Array;sprites=[];textures=new Map;geometries=new Map;normalData=new Float32Array(16);lightDirectionData=new Float32Array(4);lightColorData=new Float32Array(4);tintData=new Float32Array(4);frame=0;activeFrame=!1;frameRendered=!1;destroyed=!1;lostError;maxTextureSize=0;maxWidth=0;maxHeight=0;viewportX=0;viewportY=0;viewportSide=1;spriteViewport=null;meshViewProjection=null;meshModel=null;meshNormal=null;meshLightDirection=null;meshLightColor=null;meshTint=null;get capabilities(){return{threeD:!0,compute:!1,customShaders:!0,storageBuffers:!1,instancing:!0,maxTextureSize:this.maxTextureSize}}onContextLost=e=>{e.preventDefault(),!(this.destroyed||this.lostError)&&(this.lostError=new i(`WebGL2 context lost; the renderer cannot continue.`),this.onError(this.lostError))};constructor(e){this.onError=e}async initialize(e){if(this.destroyed||this.gl)throw new r(`WebGL2 renderer cannot be initialized more than once.`);try{let t=e.getContext(`webgl2`,{alpha:!1});if(!t)throw new a(`WebGL2 canvas context is unavailable: canvas.getContext("webgl2") returned null.`);this.gl=t,this.canvas=e,e.addEventListener(`webglcontextlost`,this.onContextLost),this.maxTextureSize=t.getParameter(t.MAX_TEXTURE_SIZE);let n=t.getParameter(t.MAX_RENDERBUFFER_SIZE),r=t.getParameter(t.MAX_VIEWPORT_DIMS);this.maxWidth=Math.min(this.maxTextureSize,n,r[0]),this.maxHeight=Math.min(this.maxTextureSize,n,r[1]),this.resize(Math.max(e.width,1),Math.max(e.height,1)),this.triangleProgram=this.createProgram(t,`#version 300 es
precision highp float;
out vec3 vColor;
void main() {
  vec2 positions[3] = vec2[3](vec2(0.0, 0.7), vec2(-0.7, -0.6), vec2(0.7, -0.6));
  vec3 colors[3] = vec3[3](vec3(1.0, 0.3, 0.25), vec3(0.25, 0.9, 0.5), vec3(0.3, 0.5, 1.0));
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
  vColor = colors[gl_VertexID];
}`,`#version 300 es
precision highp float;
in vec3 vColor;
out vec4 color;
void main() { color = vec4(vColor, 1.0); }`,`triangle`),this.spriteProgram=this.createProgram(t,`#version 300 es
precision highp float;
layout(location=0) in vec4 axes;
layout(location=1) in vec4 offsetSize;
layout(location=2) in vec4 anchorOpacity;
uniform vec2 viewportSize;
out vec2 vUV;
out float vOpacity;
void main() {
  vec2 corners[6] = vec2[6](vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
    vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0));
  vec2 corner = corners[gl_VertexID];
  vec2 local = (corner - anchorOpacity.xy) * offsetSize.zw;
  vec2 world = offsetSize.xy + axes.xy * local.x + axes.zw * local.y;
  gl_Position = vec4(world.x * 2.0 / viewportSize.x - 1.0,
    1.0 - world.y * 2.0 / viewportSize.y, 0.0, 1.0);
  // ImageBitmap uploads ignore UNPACK_FLIP_Y_WEBGL: its first (top) row is at GL v=0.
  vUV = corner;
  vOpacity = anchorOpacity.z;
}`,`#version 300 es
precision highp float;
in vec2 vUV;
in float vOpacity;
uniform sampler2D image;
out vec4 color;
void main() {
  vec4 texel = texture(image, vUV);
  // Texture.fromImage creates straight-alpha ImageBitmaps; their WebGL upload ignores
  // UNPACK_PREMULTIPLY_ALPHA_WEBGL. Blend in premultiplied space like WebGPU.
  color = vec4(texel.rgb * texel.a * vOpacity, texel.a * vOpacity);
}`,`sprite`),this.meshProgram=this.createProgram(t,`#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;
uniform mat4 viewProjection;
uniform mat4 model;
uniform mat4 normalMatrix;
out vec3 vNormal;
out vec2 vUV;
void main() {
  // Camera3D produces WebGPU depth 0..1; map it to OpenGL clip depth -1..1.
  vec4 clip = viewProjection * model * vec4(position, 1.0);
  gl_Position = vec4(clip.xy, clip.z * 2.0 - clip.w, clip.w);
  vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;
  vUV = uv;
}`,`#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUV;
uniform sampler2D image;
uniform vec4 lightDirection;
uniform vec4 lightColorAmbient;
uniform vec4 tint;
out vec4 color;
void main() {
  vec4 texel = texture(image, vUV);
  float light = max(dot(vNormal, lightDirection.xyz), 0.0) /
    max(length(vNormal) * length(lightDirection.xyz), 0.000001);
  vec3 illumination = vec3(max(lightColorAmbient.w, 0.0)) +
    lightColorAmbient.rgb * (light * max(lightDirection.w, 0.0));
  color = vec4(texel.rgb * texel.a * tint.rgb * illumination * tint.a,
    texel.a * tint.a);
}`,`mesh`),this.triangleVAO=this.createVAO(t),this.spriteVAO=this.createVAO(t),this.instanceBuffer=this.createBuffer(t),this.spriteViewport=t.getUniformLocation(this.spriteProgram,`viewportSize`),this.meshViewProjection=t.getUniformLocation(this.meshProgram,`viewProjection`),this.meshModel=t.getUniformLocation(this.meshProgram,`model`),this.meshNormal=t.getUniformLocation(this.meshProgram,`normalMatrix`),this.meshLightDirection=t.getUniformLocation(this.meshProgram,`lightDirection`),this.meshLightColor=t.getUniformLocation(this.meshProgram,`lightColorAmbient`),this.meshTint=t.getUniformLocation(this.meshProgram,`tint`),t.useProgram(this.spriteProgram),t.uniform1i(t.getUniformLocation(this.spriteProgram,`image`),0),t.useProgram(this.meshProgram),t.uniform1i(t.getUniformLocation(this.meshProgram,`image`),0),t.useProgram(null),t.bindVertexArray(this.spriteVAO),t.bindBuffer(t.ARRAY_BUFFER,this.instanceBuffer);for(let e=0;e<3;e++)t.enableVertexAttribArray(e),t.vertexAttribPointer(e,4,t.FLOAT,!1,48,e*16),t.vertexAttribDivisor(e,1);t.bindVertexArray(null),t.bindBuffer(t.ARRAY_BUFFER,null)}catch(e){throw this.destroy(),e instanceof r?e:new a(`WebGL2 initialization failed${e instanceof Error?`: ${e.message}`:`.`}`,{cause:e})}}beginFrame(){if(this.requireGL(),this.activeFrame)throw new r(`WebGL2 beginFrame called before the preceding frame ended.`);this.activeFrame=!0,this.frameRendered=!1}render(e,t,i){let a=this.requireGL(),o=this.canvas;if(!this.activeFrame||this.frameRendered)throw new r(`WebGL2 render requires an active frame and may be called only once per frame.`);let s=1,c=1,l=1;if(e){if(c=t??(o.clientWidth||o.width),l=i??(o.clientHeight||o.height),!Number.isFinite(c)||!Number.isFinite(l)||c<=0||l<=0)throw RangeError(`WebGL2 rendering requires positive finite logical width and height.`);s=c/l}this.frame++;try{e?this.prepareSprites(e):this.sprites.length=0,a.bindFramebuffer(a.FRAMEBUFFER,null),a.disable(a.SCISSOR_TEST),a.viewport(0,0,o.width,o.height),a.clearColor(n.clearColor.r,n.clearColor.g,n.clearColor.b,n.clearColor.a),a.depthMask(!0),a.clearDepth(1),a.clear(a.COLOR_BUFFER_BIT|a.DEPTH_BUFFER_BIT),a.enable(a.BLEND),a.blendFunc(a.ONE,a.ONE_MINUS_SRC_ALPHA),e?(this.drawMeshes(e,s),a.disable(a.DEPTH_TEST),this.sprites.length&&this.drawSprites(c,l)):(a.disable(a.DEPTH_TEST),a.disable(a.BLEND),a.viewport(this.viewportX,this.viewportY,this.viewportSide,this.viewportSide),a.useProgram(this.triangleProgram),a.bindVertexArray(this.triangleVAO),a.drawArrays(a.TRIANGLES,0,3)),this.frameRendered=!0}finally{this.releaseUnused(),a.bindVertexArray(null),a.bindTexture(a.TEXTURE_2D,null)}}endFrame(){let e=this.requireGL();if(!this.activeFrame||!this.frameRendered)throw new r(`WebGL2 endFrame requires a rendered frame.`);e.flush(),this.activeFrame=!1}resize(e,t){if(this.lostError)throw this.lostError;let n=this.canvas;if(!n||!this.gl||this.destroyed)throw new r(`WebGL2 resize requires an initialized renderer.`);if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0)throw RangeError(`WebGL2 canvas pixel width and height must be finite, nonnegative numbers.`);let i=Math.max(1,Math.round(e)),a=Math.max(1,Math.round(t));if(!Number.isSafeInteger(i)||!Number.isSafeInteger(a)||i>this.maxWidth||a>this.maxHeight)throw new r(`WebGL2 canvas backing size ${i}×${a} exceeds this device's maximum dimensions of ${this.maxWidth}×${this.maxHeight} pixels. Reduce the canvas size or pixel ratio.`);n.width!==i&&(n.width=i),n.height!==a&&(n.height=a);let o=Math.min(i,a);this.viewportX=(i-o)/2,this.viewportY=(a-o)/2,this.viewportSide=o}prepareSprites(e){let n=this.sprites;n.length=0;for(let r of e.objects)r instanceof t&&r.visible&&r.opacity>0&&!r.texture.destroyed&&n.push(r);n.sort((e,t)=>e.zIndex-t.zIndex);let r=n.length;if(!r)return;let i=this.gl;if(r>this.instanceCapacity){let e=Math.max(16,this.instanceCapacity);for(;e<r;)e*=2;i.bindBuffer(i.ARRAY_BUFFER,this.instanceBuffer),i.bufferData(i.ARRAY_BUFFER,e*48,i.DYNAMIC_DRAW),this.instances=new Float32Array(e*12),this.instanceCapacity=e}let a=e.camera2D,o=a.zoom,s=this.instances;for(let e=0;e<r;e++){let t=n[e],r=t.texture;this.cacheTexture(r).seen=this.frame;let i=t.transform.updateMatrix().elements,c=e*12;s[c]=i[0]*o,s[c+1]=i[1]*o,s[c+2]=i[3]*o,s[c+3]=i[4]*o,s[c+4]=(i[6]-a.position.x)*o,s[c+5]=(i[7]-a.position.y)*o,s[c+6]=r.width,s[c+7]=r.height,s[c+8]=t.anchor.x,s[c+9]=t.anchor.y,s[c+10]=t.opacity,s[c+11]=0}i.bindBuffer(i.ARRAY_BUFFER,this.instanceBuffer),i.bufferSubData(i.ARRAY_BUFFER,0,s,0,r*12)}drawSprites(e,t){let n=this.gl;n.useProgram(this.spriteProgram),n.uniform2f(this.spriteViewport,e,t),n.bindVertexArray(this.spriteVAO),n.bindBuffer(n.ARRAY_BUFFER,this.instanceBuffer);let r=this.sprites;for(let e=0;e<r.length;){let t=r[e].texture,i=e+1;for(;i<r.length&&r[i].texture===t;)i++;for(let t=0;t<3;t++)n.vertexAttribPointer(t,4,n.FLOAT,!1,48,e*48+t*16);n.bindTexture(n.TEXTURE_2D,this.textures.get(t).resource),n.drawArraysInstanced(n.TRIANGLES,0,6,i-e),e=i}}drawMeshes(t,n){let r=this.gl,i=!1;for(let a of t.objects){if(!(a instanceof e)||!a.visible||a.material.opacity<=0||a.material.texture.destroyed||a.geometry.indices.length===0)continue;if(!i){let e=t.camera3D.updateMatrix(n).elements,a=t.directionalLight,o=this.lightDirectionData;o[0]=a.direction.x,o[1]=a.direction.y,o[2]=a.direction.z,o[3]=a.intensity;let s=this.lightColorData;s[0]=a.color[0],s[1]=a.color[1],s[2]=a.color[2],s[3]=t.ambientLight,r.useProgram(this.meshProgram),r.uniformMatrix4fv(this.meshViewProjection,!1,e),r.uniform4fv(this.meshLightDirection,o),r.uniform4fv(this.meshLightColor,s),r.enable(r.DEPTH_TEST),r.depthFunc(r.LESS),r.depthMask(!0),i=!0}let o=this.cacheGeometry(a.geometry),s=this.cacheTexture(a.material.texture);o.seen=s.seen=this.frame;let c=a.transform.updateMatrix().elements,l=this.normalData,u=c[0],d=c[1],f=c[2],p=c[4],m=c[5],h=c[6],g=c[8],_=c[9],v=c[10],y=m*v-h*_,b=h*g-p*v,x=p*_-m*g,S=u*y+d*b+f*x,C=S===0?0:1/S;l[0]=y*C,l[1]=b*C,l[2]=x*C,l[3]=0,l[4]=(_*f-v*d)*C,l[5]=(v*u-g*f)*C,l[6]=(g*d-_*u)*C,l[7]=0,l[8]=(d*h-f*m)*C,l[9]=(f*p-u*h)*C,l[10]=(u*m-d*p)*C,l[11]=0,l[12]=l[13]=l[14]=0,l[15]=1;let w=this.tintData;w[0]=a.material.color[0],w[1]=a.material.color[1],w[2]=a.material.color[2],w[3]=a.material.opacity,r.uniformMatrix4fv(this.meshModel,!1,c),r.uniformMatrix4fv(this.meshNormal,!1,l),r.uniform4fv(this.meshTint,w),r.bindTexture(r.TEXTURE_2D,s.resource),r.bindVertexArray(o.vao),r.drawElements(r.TRIANGLES,a.geometry.indices.length,r.UNSIGNED_INT,0)}}cacheTexture(e){let t=this.textures.get(e);if(t)return t;let n=this.gl,{width:i,height:a}=e;if(!Number.isSafeInteger(i)||!Number.isSafeInteger(a)||i<1||a<1||i>this.maxTextureSize||a>this.maxTextureSize)throw new r(`WebGL2 texture size ${i}×${a} exceeds this device's maximum texture dimension of ${this.maxTextureSize} pixels per side.`);let o=n.createTexture();if(!o)throw new r(`WebGL2 could not allocate a texture.`);try{n.bindTexture(n.TEXTURE_2D,o),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),n.texImage2D(n.TEXTURE_2D,0,n.RGBA,n.RGBA,n.UNSIGNED_BYTE,e.image);let t=n.getError();if(t!==n.NO_ERROR)throw new r(`WebGL2 texture upload failed (GL error 0x${t.toString(16)}).`);let i={resource:o,seen:this.frame};return this.textures.set(e,i),i}catch(e){throw n.deleteTexture(o),e}}cacheGeometry(e){let t=this.geometries.get(e);if(t)return t;let n=this.gl,r=this.createVAO(n),i,a;try{i=this.createBuffer(n),a=this.createBuffer(n),n.bindVertexArray(r),n.bindBuffer(n.ARRAY_BUFFER,i),n.bufferData(n.ARRAY_BUFFER,e.vertices,n.STATIC_DRAW),n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,a),n.bufferData(n.ELEMENT_ARRAY_BUFFER,e.indices,n.STATIC_DRAW),n.enableVertexAttribArray(0),n.vertexAttribPointer(0,3,n.FLOAT,!1,32,0),n.enableVertexAttribArray(1),n.vertexAttribPointer(1,3,n.FLOAT,!1,32,12),n.enableVertexAttribArray(2),n.vertexAttribPointer(2,2,n.FLOAT,!1,32,24),n.bindVertexArray(null);let t={vao:r,vertex:i,index:a,seen:this.frame};return this.geometries.set(e,t),t}catch(e){throw n.bindVertexArray(null),a&&n.deleteBuffer(a),i&&n.deleteBuffer(i),n.deleteVertexArray(r),e}}releaseUnused(){let e=this.gl;for(let[t,n]of this.textures)(t.destroyed||n.seen!==this.frame)&&(e.deleteTexture(n.resource),this.textures.delete(t));for(let[t,n]of this.geometries)n.seen!==this.frame&&(e.deleteVertexArray(n.vao),e.deleteBuffer(n.vertex),e.deleteBuffer(n.index),this.geometries.delete(t))}createBuffer(e){let t=e.createBuffer();if(!t)throw new a(`WebGL2 could not allocate a buffer.`);return t}createVAO(e){let t=e.createVertexArray();if(!t)throw new a(`WebGL2 could not allocate a vertex array.`);return t}createProgram(e,t,n,r){let i=[],o=null;try{for(let[o,s]of[[e.VERTEX_SHADER,t],[e.FRAGMENT_SHADER,n]]){let t=e.createShader(o);if(!t)throw new a(`WebGL2 ${r} shader allocation failed.`);if(i.push(t),e.shaderSource(t,s),e.compileShader(t),!e.getShaderParameter(t,e.COMPILE_STATUS))throw new a(`WebGL2 ${r} ${o===e.VERTEX_SHADER?`vertex`:`fragment`} shader compilation failed: ${e.getShaderInfoLog(t)||`unknown error`}`)}if(o=e.createProgram(),!o)throw new a(`WebGL2 ${r} program allocation failed.`);for(let t of i)e.attachShader(o,t);if(e.linkProgram(o),!e.getProgramParameter(o,e.LINK_STATUS))throw new a(`WebGL2 ${r} program linking failed: ${e.getProgramInfoLog(o)||`unknown error`}`);return o}catch(t){throw o&&e.deleteProgram(o),t}finally{for(let t of i)e.deleteShader(t)}}destroy(){if(this.destroyed)return;this.destroyed=!0,this.canvas?.removeEventListener(`webglcontextlost`,this.onContextLost);let e=this.gl;if(e){for(let t of this.textures.values())e.deleteTexture(t.resource);for(let t of this.geometries.values())e.deleteVertexArray(t.vao),e.deleteBuffer(t.vertex),e.deleteBuffer(t.index);this.instanceBuffer&&e.deleteBuffer(this.instanceBuffer),this.triangleVAO&&e.deleteVertexArray(this.triangleVAO),this.spriteVAO&&e.deleteVertexArray(this.spriteVAO),this.triangleProgram&&e.deleteProgram(this.triangleProgram),this.spriteProgram&&e.deleteProgram(this.spriteProgram),this.meshProgram&&e.deleteProgram(this.meshProgram)}this.textures.clear(),this.geometries.clear(),this.sprites.length=0,this.gl=void 0,this.canvas=void 0,this.activeFrame=!1}requireGL(){if(this.lostError)throw this.lostError;if(this.destroyed||!this.gl||!this.meshProgram)throw new r(`WebGL2 renderer is not initialized or has already been destroyed.`);return this.gl}}
//# sourceMappingURL=webgl2-renderer.js.map
