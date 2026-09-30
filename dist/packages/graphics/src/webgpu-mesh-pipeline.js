import{Mesh as e}from"../../core/src/mesh.js";import{WebGPUInitializationError as t,GraphicsError as n}from"./errors.js";export class WebGPUMeshPipeline{device;pipeline;geometries=new Map;meshes=new Map;textures=new Map;sceneData=new Float32Array(24);colorAttachment={loadOp:`clear`,storeOp:`store`};depthAttachment={depthLoadOp:`clear`,depthStoreOp:`store`,depthClearValue:1};renderPassDescriptor={colorAttachments:[this.colorAttachment],depthStencilAttachment:this.depthAttachment};sceneBuffer;sceneBindGroup;sampler;depthTexture;depthView;depthWidth=0;depthHeight=0;frame=0;constructor(e,t){this.device=e,this.pipeline=t}static async initialize(e,r,i){let a=e.createShaderModule({code:`
struct SceneUniforms {
  viewProjection: mat4x4f,
  lightDirection: vec4f,
  lightColorAmbient: vec4f,
};
struct MeshUniforms {
  model: mat4x4f,
  normal: mat4x4f,
  tint: vec4f,
};
@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(1) @binding(0) var<uniform> mesh: MeshUniforms;
@group(2) @binding(0) var meshTexture: texture_2d<f32>;
@group(2) @binding(1) var meshSampler: sampler;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
};
@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = scene.viewProjection * mesh.model * vec4f(input.position, 1.0);
  output.normal = (mesh.normal * vec4f(input.normal, 0.0)).xyz;
  output.uv = input.uv;
  return output;
}
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let texel = textureSample(meshTexture, meshSampler, input.uv);
  let normal = input.normal;
  let direction = scene.lightDirection.xyz;
  let light = max(dot(normal, direction), 0.0) /
    max(length(normal) * length(direction), 0.000001);
  let illumination = vec3f(max(scene.lightColorAmbient.w, 0.0)) +
    scene.lightColorAmbient.rgb * (light * max(scene.lightDirection.w, 0.0));
  let opacity = mesh.tint.a;
  // Uploaded texture RGB is already premultiplied; opacity multiplies RGB and A.
  return vec4f(texel.rgb * mesh.tint.rgb * illumination * opacity, texel.a * opacity);
}
`}),o=await a.getCompilationInfo();if(i())throw new n(`WebGPU renderer was destroyed during initialization.`);let s=o.messages.filter(e=>e.type===`error`).map(e=>`${e.lineNum}:${e.linePos} ${e.message}`);if(s.length)throw new t(`WebGPU 3D shader compilation failed: ${s.join(`; `)}`);let c=e.createRenderPipeline({layout:`auto`,vertex:{module:a,entryPoint:`vertexMain`,buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:`float32x3`},{shaderLocation:1,offset:12,format:`float32x3`},{shaderLocation:2,offset:24,format:`float32x2`}]}]},fragment:{module:a,entryPoint:`fragmentMain`,targets:[{format:r,blend:{color:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`}}}]},primitive:{topology:`triangle-list`},depthStencil:{format:`depth24plus`,depthWriteEnabled:!0,depthCompare:`less`}});return new WebGPUMeshPipeline(e,c)}resize(e,t){this.depthTexture&&(this.depthWidth!==e||this.depthHeight!==t)&&(this.depthTexture.destroy(),this.depthTexture=void 0,this.depthView=void 0)}render(t,n,r,i,a,o,s){this.frame++;let c;try{if(t)for(let l of t.objects){if(!(l instanceof e)||!l.visible||l.material.opacity<=0||l.material.texture.destroyed||l.geometry.indices.length===0)continue;c||(this.prepareScene(t,o),this.ensureDepth(i,a),this.colorAttachment.view=r,this.colorAttachment.clearValue=s,this.depthAttachment.view=this.depthView,c=n.beginRenderPass(this.renderPassDescriptor),c.setViewport(0,0,i,a,0,1),c.setPipeline(this.pipeline),c.setBindGroup(0,this.sceneBindGroup));let u=this.cacheGeometry(l.geometry),d=this.cacheMesh(l),f=this.cacheTexture(l.material.texture);u.seen=d.seen=f.seen=this.frame,this.updateMesh(l,d),c.setBindGroup(1,d.bindGroup),c.setBindGroup(2,f.bindGroup),c.setVertexBuffer(0,u.vertex),c.setIndexBuffer(u.index,`uint32`),c.drawIndexed(l.geometry.indices.length)}return c!==void 0}finally{try{c?.end()}finally{this.colorAttachment.view=void 0,this.depthAttachment.view=void 0,this.releaseUnused()}}}prepareScene(e,t){let n=this.device;if(!this.sceneBuffer){let e=n.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});try{let t=n.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}}]}),r=n.createSampler({magFilter:`linear`,minFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`});this.sceneBuffer=e,this.sceneBindGroup=t,this.sampler=r}catch(t){throw e.destroy(),t}}let r=this.sceneData;r.set(e.camera3D.updateMatrix(t).elements,0);let i=e.directionalLight;r[16]=i.direction.x,r[17]=i.direction.y,r[18]=i.direction.z,r[19]=i.intensity,r[20]=i.color[0],r[21]=i.color[1],r[22]=i.color[2],r[23]=e.ambientLight,n.queue.writeBuffer(this.sceneBuffer,0,r)}ensureDepth(e,t){this.depthTexture&&this.depthWidth===e&&this.depthHeight===t||(this.depthTexture?.destroy(),this.depthTexture=void 0,this.depthView=void 0,this.depthTexture=this.device.createTexture({size:[e,t],format:`depth24plus`,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.depthView=this.depthTexture.createView(),this.depthWidth=e,this.depthHeight=t)}cacheGeometry(e){let t=this.geometries.get(e);if(t)return t;let n=this.device.createBuffer({size:e.vertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});try{let t=this.device.createBuffer({size:e.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});try{this.device.queue.writeBuffer(n,0,e.vertices),this.device.queue.writeBuffer(t,0,e.indices);let r={vertex:n,index:t,seen:this.frame};return this.geometries.set(e,r),r}catch(e){throw t.destroy(),e}}catch(e){throw n.destroy(),e}}cacheMesh(e){let t=this.meshes.get(e);if(t)return t;let n=this.device.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});try{let t={uniform:n,bindGroup:this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:{buffer:n}}]}),data:new Float32Array(36),seen:this.frame};return this.meshes.set(e,t),t}catch(e){throw n.destroy(),e}}cacheTexture(e){let t=this.textures.get(e);if(t)return t;let{width:r,height:i}=e,a=this.device.limits.maxTextureDimension2D;if(!Number.isSafeInteger(r)||!Number.isSafeInteger(i)||r<1||i<1||r>a||i>a)throw new n(`WebGPU texture size ${r}×${i} exceeds this device's maximum texture dimension of ${a} pixels per side.`);let o=this.device.createTexture({size:[r,i],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});try{this.device.queue.copyExternalImageToTexture({source:e.image},{texture:o,premultipliedAlpha:!0},[r,i]);let t={resource:o,bindGroup:this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(2),entries:[{binding:0,resource:o.createView()},{binding:1,resource:this.sampler}]}),seen:this.frame};return this.textures.set(e,t),t}catch(e){throw o.destroy(),e}}updateMesh(e,t){let n=e.transform.updateMatrix().elements,r=t.data;r.set(n,0);let i=n[0],a=n[1],o=n[2],s=n[4],c=n[5],l=n[6],u=n[8],d=n[9],f=n[10],p=c*f-l*d,m=l*u-s*f,h=s*d-c*u,g=i*p+a*m+o*h,_=g===0?0:1/g;r[16]=p*_,r[17]=m*_,r[18]=h*_,r[19]=0,r[20]=(d*o-f*a)*_,r[21]=(f*i-u*o)*_,r[22]=(u*a-d*i)*_,r[23]=0,r[24]=(a*l-o*c)*_,r[25]=(o*s-i*l)*_,r[26]=(i*c-a*s)*_,r[27]=0,r[28]=r[29]=r[30]=0,r[31]=1,r[32]=e.material.color[0],r[33]=e.material.color[1],r[34]=e.material.color[2],r[35]=e.material.opacity,this.device.queue.writeBuffer(t.uniform,0,r)}releaseUnused(){for(let[e,t]of this.geometries)t.seen!==this.frame&&(t.vertex.destroy(),t.index.destroy(),this.geometries.delete(e));for(let[e,t]of this.meshes)t.seen!==this.frame&&(t.uniform.destroy(),this.meshes.delete(e));for(let[e,t]of this.textures)(e.destroyed||t.seen!==this.frame)&&(t.resource.destroy(),this.textures.delete(e))}destroy(){this.depthTexture?.destroy(),this.depthTexture=void 0,this.depthView=void 0,this.sceneBuffer?.destroy(),this.sceneBuffer=void 0;for(let e of this.geometries.values())e.vertex.destroy(),e.index.destroy();this.geometries.clear();for(let e of this.meshes.values())e.uniform.destroy();this.meshes.clear();for(let e of this.textures.values())e.resource.destroy();this.textures.clear()}}
//# sourceMappingURL=webgpu-mesh-pipeline.js.map
