import{Sprite as e}from"../../core/src/sprite.js";import{defaults as t}from"../../../src/data/defaults.js";import{GraphicsError as n,WebGPUInitializationError as r,WebGPUDeviceLostError as i,WebGPUNotSupportedError as a}from"./errors.js";import{WebGPUMeshPipeline as o}from"./webgpu-mesh-pipeline.js";export class WebGPURenderer{onError;backend=`webgpu`;capabilities={threeD:!0,compute:!0,customShaders:!0,storageBuffers:!0,instancing:!0,maxTextureSize:0};canvas;context;device;pipeline;spritePipeline;meshPipeline;viewportBuffer;viewportBindGroup;spriteSampler;instanceBuffer;instanceCapacity=0;instances=new Float32Array;viewportData=new Float32Array(4);sprites=[];textures=new Map;textureFrame=0;encoder;colorAttachment={loadOp:`clear`,storeOp:`store`,clearValue:t.clearColor};renderPassDescriptor={colorAttachments:[this.colorAttachment]};submissions=[];viewportX=0;viewportY=0;viewportSide=1;frameRendered=!1;configured=!1;initializing=!1;destroyed=!1;lostError;constructor(e){this.onError=e}async initialize(e){if(this.destroyed||this.device||this.initializing)throw new n(`WebGPU renderer cannot be initialized more than once.`);this.initializing=!0;try{if(typeof navigator>`u`||!navigator.gpu)throw new a(`WebGPU is unavailable: this browser or security context does not expose navigator.gpu.`);let t=await navigator.gpu.requestAdapter();if(this.destroyed)throw new n(`WebGPU renderer was destroyed during initialization.`);if(!t)throw new a(`WebGPU is unavailable: the browser could not provide a GPU adapter.`);let s=await t.requestDevice();if(this.destroyed)throw s.destroy(),new n(`WebGPU renderer was destroyed during initialization.`);this.device=s,this.capabilities.maxTextureSize=s.limits.maxTextureDimension2D,s.lost.then(e=>{if(this.destroyed)return;let t=new i(`WebGPU device lost (${e.reason}): ${e.message||`the GPU or driver became unavailable`}.`);this.lostError=t,this.pipeline&&this.onError(t)}),s.addEventListener(`uncapturederror`,e=>{this.destroyed||this.onError(new n(`WebGPU uncaptured error: ${e.error.message}`,{cause:e.error}))});let c=e.getContext(`webgpu`);if(!c)throw new r(`WebGPU canvas context is unavailable: canvas.getContext("webgpu") returned null.`);this.context=c,this.canvas=e,this.resize(Math.max(e.width,1),Math.max(e.height,1));let l=navigator.gpu.getPreferredCanvasFormat();s.pushErrorScope(`validation`);let u=[],d,f,p,m=null;try{c.configure({device:s,format:l,alphaMode:`opaque`}),this.configured=!0;let e=s.createShaderModule({code:`
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
};

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(0.0, 0.7),
    vec2f(-0.7, -0.6),
    vec2f(0.7, -0.6),
  );
  var colors = array<vec3f, 3>(
    vec3f(1.0, 0.3, 0.25),
    vec3f(0.25, 0.9, 0.5),
    vec3f(0.3, 0.5, 1.0),
  );
  var output: VertexOutput;
  output.position = vec4f(positions[index], 0.0, 1.0);
  output.color = colors[index];
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
`}),t=await e.getCompilationInfo();if(this.destroyed)throw new n(`WebGPU renderer was destroyed during initialization.`);if(u=t.messages.filter(e=>e.type===`error`).map(e=>`${e.lineNum}:${e.linePos} ${e.message}`),u.length===0){d=s.createRenderPipeline({layout:`auto`,vertex:{module:e,entryPoint:`vertexMain`},fragment:{module:e,entryPoint:`fragmentMain`,targets:[{format:l}]},primitive:{topology:`triangle-list`}});let t=s.createShaderModule({code:`
struct Viewport {
  size: vec2f,
};
@group(0) @binding(0) var<uniform> viewport: Viewport;
@group(1) @binding(0) var spriteTexture: texture_2d<f32>;
@group(1) @binding(1) var spriteSampler: sampler;

struct VertexInput {
  @location(0) axes: vec4f,
  @location(1) offsetSize: vec4f,
  @location(2) anchorOpacity: vec4f,
};
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) opacity: f32,
};
@vertex
fn vertexMain(input: VertexInput, @builtin(vertex_index) index: u32) -> VertexOutput {
  let corners = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0),
  );
  let uv = corners[index];
  let local = (uv - input.anchorOpacity.xy) * input.offsetSize.zw;
  let world = input.offsetSize.xy +
    input.axes.xy * local.x + input.axes.zw * local.y;
  var output: VertexOutput;
  output.position = vec4f(world.x * 2.0 / viewport.size.x - 1.0,
                          1.0 - world.y * 2.0 / viewport.size.y, 0.0, 1.0);
  output.uv = uv;
  output.opacity = input.anchorOpacity.z;
  return output;
}
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return textureSample(spriteTexture, spriteSampler, input.uv) * input.opacity;
}
`}),r=await t.getCompilationInfo();if(this.destroyed)throw new n(`WebGPU renderer was destroyed during initialization.`);u=r.messages.filter(e=>e.type===`error`).map(e=>`${e.lineNum}:${e.linePos} ${e.message}`),u.length===0&&(f=s.createRenderPipeline({layout:`auto`,vertex:{module:t,entryPoint:`vertexMain`,buffers:[{arrayStride:48,stepMode:`instance`,attributes:[{shaderLocation:0,offset:0,format:`float32x4`},{shaderLocation:1,offset:16,format:`float32x4`},{shaderLocation:2,offset:32,format:`float32x4`}]}]},fragment:{module:t,entryPoint:`fragmentMain`,targets:[{format:l,blend:{color:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`}}}]},primitive:{topology:`triangle-list`}}),p=await o.initialize(s,l,()=>this.destroyed))}}finally{m=await s.popErrorScope()}if(this.destroyed)throw new n(`WebGPU renderer was destroyed during initialization.`);if(u.length)throw new r(`WebGPU shader compilation failed: ${u.join(`; `)}`);if(m)throw new r(`WebGPU canvas/shader/pipeline validation failed: ${m.message}`,{cause:m});if(this.lostError)throw this.lostError;this.pipeline=d,this.spritePipeline=f,this.meshPipeline=p}catch(e){let t=this.destroyed;throw this.destroy(),t&&!(e instanceof n)?new n(`WebGPU renderer was destroyed during initialization.`,{cause:e}):e instanceof n?e:new r(`WebGPU initialization failed while requesting a device or configuring the canvas and triangle pipeline${e instanceof Error?`: ${e.message}`:`.`}`,{cause:e})}finally{this.initializing=!1}}beginFrame(){let e=this.requireDevice();if(this.encoder)throw new n(`WebGPU beginFrame called before the preceding frame ended.`);this.encoder=e.createCommandEncoder(),this.frameRendered=!1}render(e,t,r){let i=this.requireDevice(),a=this.encoder,o=this.context,s=this.pipeline,c=1;if(!a||!o||!s||this.frameRendered)throw new n(`WebGPU render requires an active frame and may be called only once per frame.`);if(e){let n=this.canvas,a=t??(n?.clientWidth||n?.width),o=r??(n?.clientHeight||n?.height);if(!a||!o||!Number.isFinite(a)||!Number.isFinite(o)||a<=0||o<=0)throw RangeError(`WebGPU sprite rendering requires positive finite logical width and height.`);c=a/o,this.prepareSprites(e,i,a,o)}else this.sprites.length=0,this.textureFrame++,this.releaseUnusedTextures();this.colorAttachment.view=o.getCurrentTexture().createView();try{let t=this.meshPipeline.render(e,a,this.colorAttachment.view,this.canvas.width,this.canvas.height,c,this.colorAttachment.clearValue);if(!t||!e||this.sprites.length){this.colorAttachment.loadOp=t?`load`:`clear`;let n=a.beginRenderPass(this.renderPassDescriptor);e?(n.setViewport(0,0,this.canvas.width,this.canvas.height,0,1),this.sprites.length&&this.drawSprites(n)):(n.setViewport(this.viewportX,this.viewportY,this.viewportSide,this.viewportSide,0,1),n.setPipeline(s),n.draw(3)),n.end()}this.frameRendered=!0}finally{this.colorAttachment.view=void 0,this.colorAttachment.loadOp=`clear`}}endFrame(){let e=this.requireDevice();if(!this.encoder||!this.frameRendered)throw new n(`WebGPU endFrame requires a rendered frame.`);let t=this.encoder.finish();this.encoder=void 0,this.submissions.push(t);try{e.queue.submit(this.submissions)}finally{this.submissions.length=0}}resize(e,t){if(this.lostError)throw this.lostError;let r=this.canvas,i=this.device;if(!r||!i||this.destroyed)throw new n(`WebGPU resize requires an initialized renderer.`);if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0)throw RangeError(`WebGPU canvas pixel width and height must be finite, nonnegative numbers.`);let a=Math.max(1,Math.round(e)),o=Math.max(1,Math.round(t)),s=i.limits.maxTextureDimension2D;if(!Number.isSafeInteger(a)||!Number.isSafeInteger(o)||a>s||o>s)throw new n(`WebGPU canvas backing size ${a}×${o} exceeds this device's maximum texture dimension of ${s} pixels per side. Reduce the canvas size or pixel ratio.`);r.width!==a&&(r.width=a),r.height!==o&&(r.height=o);let c=Math.min(a,o);this.viewportX=(a-c)/2,this.viewportY=(o-c)/2,this.viewportSide=c,this.meshPipeline?.resize(a,o)}prepareSprites(t,n,r,i){let a=this.sprites;a.length=0;for(let n of t.objects)n instanceof e&&n.visible&&n.opacity>0&&!n.texture.destroyed&&a.push(n);a.sort((e,t)=>e.zIndex-t.zIndex),this.textureFrame++;let o=a.length;if(o){if(o>this.instanceCapacity){let e=Math.max(16,this.instanceCapacity);for(;e<o;)e*=2;let t=n.createBuffer({size:e*48,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.instanceBuffer?.destroy(),this.instanceBuffer=t,this.instances=new Float32Array(e*12),this.instanceCapacity=e}if(!this.viewportBuffer){let e=this.spritePipeline;this.viewportBuffer=n.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.viewportBindGroup=n.createBindGroup({layout:e.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.viewportBuffer}}]}),this.spriteSampler=n.createSampler({magFilter:`linear`,minFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`})}(this.viewportData[0]!==r||this.viewportData[1]!==i)&&(this.viewportData[0]=r,this.viewportData[1]=i,n.queue.writeBuffer(this.viewportBuffer,0,this.viewportData));let e=t.camera2D,s=e.zoom,c=e.position.x,l=e.position.y,u=this.instances;for(let e=0;e<o;e++){let t=a[e],r=t.texture;this.cacheTexture(n,r).seen=this.textureFrame;let i=t.transform.updateMatrix().elements,o=e*12;u[o]=i[0]*s,u[o+1]=i[1]*s,u[o+2]=i[3]*s,u[o+3]=i[4]*s,u[o+4]=(i[6]-c)*s,u[o+5]=(i[7]-l)*s,u[o+6]=r.width,u[o+7]=r.height,u[o+8]=t.anchor.x,u[o+9]=t.anchor.y,u[o+10]=t.opacity,u[o+11]=0}n.queue.writeBuffer(this.instanceBuffer,0,u.buffer,0,o*48)}this.releaseUnusedTextures()}cacheTexture(e,t){let r=this.textures.get(t);if(r)return r;let{width:i,height:a}=t,o=e.limits.maxTextureDimension2D;if(!Number.isSafeInteger(i)||!Number.isSafeInteger(a)||i<1||a<1||i>o||a>o)throw new n(`WebGPU texture size ${i}×${a} exceeds this device's maximum texture dimension of ${o} pixels per side.`);let s=e.createTexture({size:[i,a],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});try{e.queue.copyExternalImageToTexture({source:t.image},{texture:s,premultipliedAlpha:!0},[i,a]);let n={resource:s,bindGroup:e.createBindGroup({layout:this.spritePipeline.getBindGroupLayout(1),entries:[{binding:0,resource:s.createView()},{binding:1,resource:this.spriteSampler}]}),seen:this.textureFrame};return this.textures.set(t,n),n}catch(e){throw s.destroy(),e}}releaseUnusedTextures(){for(let[e,t]of this.textures)(e.destroyed||t.seen!==this.textureFrame)&&(t.resource.destroy(),this.textures.delete(e))}drawSprites(e){e.setPipeline(this.spritePipeline),e.setBindGroup(0,this.viewportBindGroup),e.setVertexBuffer(0,this.instanceBuffer);let t=this.sprites;for(let n=0;n<t.length;){let r=t[n].texture,i=n+1;for(;i<t.length&&t[i].texture===r;)i++;e.setBindGroup(1,this.textures.get(r).bindGroup),e.draw(6,i-n,0,n),n=i}}destroy(){if(this.destroyed)return;this.destroyed=!0;let e=this.context,t=this.device;this.encoder=void 0,this.colorAttachment.view=void 0,this.submissions.length=0,this.meshPipeline?.destroy(),this.meshPipeline=void 0,this.spritePipeline=void 0,this.viewportBuffer?.destroy(),this.viewportBuffer=void 0,this.viewportBindGroup=void 0,this.spriteSampler=void 0,this.instanceBuffer?.destroy(),this.instanceBuffer=void 0,this.instanceCapacity=0,this.instances=new Float32Array,this.sprites.length=0;for(let e of this.textures.values())e.resource.destroy();this.textures.clear(),this.pipeline=void 0,this.context=void 0,this.canvas=void 0,this.device=void 0;try{this.configured&&e?.unconfigure()}finally{t?.destroy()}}requireDevice(){if(this.lostError)throw this.lostError;if(this.destroyed||!this.device||!this.pipeline)throw new n(`WebGPU renderer is not initialized or has already been destroyed.`);return this.device}}
//# sourceMappingURL=webgpu-renderer.js.map
