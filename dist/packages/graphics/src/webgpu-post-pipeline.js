import{GraphicsError as e,WebGPUInitializationError as t}from"./errors.js";import{fxaaWGSL as n}from"./fxaa-shaders.js";import{depthPostWGSL as r}from"./depth-post-shaders.js";import{OrthographicCamera as i}from"../../core/src/orthographic-camera.js";const postShader=e=>`
struct Settings { values: vec4f, viewport: vec4f, inverseVP: mat4x4f, clip: vec4f, ssao: vec4f, dof: vec4f };
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var<uniform> settings: Settings;
${r(e)}
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));
  return vec4f(positions[index],0.0,1.0);
}
@fragment fn fragmentMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let size = vec2i(textureDimensions(source));
  let pixel = clamp(vec2i(position.xy),vec2i(0),size-vec2i(1));
  let radius = i32(min(floor(settings.viewport.z+0.5),f32(max(size.x,size.y))));
  let sample = focusedSample(pixel);
  var color = sample.rgb/max(sample.a,0.000001)*ambientOcclusion(pixel);
  var bloom = vec3f(0.0);
  if (settings.values.z > 0.0) {
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let offset = vec2i(x,y)*radius;
        let neighbor = textureLoad(source,clamp(pixel+offset,vec2i(0),size-vec2i(1)),0);
        bloom += max(neighbor.rgb/max(neighbor.a,0.000001)-vec3f(settings.values.w),vec3f(0.0));
      }
    }
  }
  color = max((color+bloom*(settings.values.z/9.0))*settings.values.x,vec3f(0.0));
  if (settings.values.y > 0.5) {
    color = clamp((color*(2.51*color+0.03))/(color*(2.43*color+0.59)+0.14),vec3f(0.0),vec3f(1.0));
  }
  color = select(1.055*pow(color,vec3f(1.0/2.4))-0.055,color*12.92,color <= vec3f(0.0031308));
  return vec4f(color*sample.a,sample.a);
}
`;export class WebGPUPostPipeline{device;pipeline;fxaaPipeline;format;stats;texture;view;bindGroup;buffer;fxaaTexture;fxaaView;fxaaGroup;fxaaSampler;width=0;height=0;data=new Float32Array(36);attachment={loadOp:`clear`,storeOp:`store`};descriptor={colorAttachments:[this.attachment]};constructor(e,t,n,r,i){this.device=e,this.pipeline=t,this.fxaaPipeline=n,this.format=r,this.stats=i,this.fxaaSampler=e.createSampler({minFilter:`linear`,magFilter:`linear`})}static async initialize(r,i,a,o,s){let c=r.createShaderModule({code:postShader(o)}),l=r.createShaderModule({code:n}),[u,d]=await Promise.all([c.getCompilationInfo(),l.getCompilationInfo()]);if(a())throw new e(`WebGPU renderer was destroyed during initialization.`);let f=[...u.messages,...d.messages].filter(e=>e.type===`error`);if(f.length)throw new t(`WebGPU post shader compilation failed: ${f.map(e=>`${e.lineNum}:${e.linePos} ${e.message}`).join(`; `)}`);let p=r.createRenderPipeline({layout:`auto`,vertex:{module:c,entryPoint:`vertexMain`},fragment:{module:c,entryPoint:`fragmentMain`,targets:[{format:i}]},primitive:{topology:`triangle-list`}}),m=r.createRenderPipeline({layout:`auto`,vertex:{module:l,entryPoint:`vertexMain`},fragment:{module:l,entryPoint:`fragmentMain`,targets:[{format:i}]},primitive:{topology:`triangle-list`}});return new WebGPUPostPipeline(r,p,m,i,s)}target(e,t,n){if(this.texture&&this.width===e&&this.height===t)return this.view;this.releaseTarget(),this.buffer||=this.device.createBuffer({size:this.data.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let r=this.device.createTexture({size:[e,t],format:`rgba16float`,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC});this.stats.target(e*t*8);try{let i=r.createView();return this.bindGroup=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:i},{binding:1,resource:{buffer:this.buffer}},{binding:2,resource:n}]}),this.texture=r,this.view=i,this.width=e,this.height=t,i}catch(n){throw r.destroy(),this.stats.target(-e*t*8),n}}copyColor(e,t){e.copyTextureToTexture({texture:this.texture},{texture:t},[this.width,this.height])}ensureFxaa(){if(this.fxaaTexture)return;let e=this.device.createTexture({size:[this.width,this.height],format:this.format,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});this.stats.target(this.width*this.height*4);try{let t=e.createView(),n=this.device.createBindGroup({layout:this.fxaaPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:t},{binding:1,resource:this.fxaaSampler}]});this.fxaaTexture=e,this.fxaaView=t,this.fxaaGroup=n}catch(t){throw e.destroy(),this.stats.target(-this.width*this.height*4),t}}releaseFxaa(){this.fxaaTexture?.destroy(),this.fxaaTexture&&this.stats.target(-this.width*this.height*4),this.fxaaTexture=void 0,this.fxaaView=void 0,this.fxaaGroup=void 0}render(e,t,n,r,a){let o=n.enabled,s=o&&n.fxaa;this.data[0]=o?n.exposure:1,this.data[1]=o&&n.toneMapping===`aces`?1:0,this.data[2]=o?n.bloomStrength:0,this.data[3]=n.bloomThreshold,this.data[4]=this.width,this.data[5]=this.height,this.data[6]=n.bloomRadius,this.data.set(a.elements,8),this.data[24]=r.near,this.data[25]=r.far,this.data[26]=+(r instanceof i);let c=r.matrix.elements;this.data[27]=Math.hypot(c[1],c[5],c[9]),this.data[28]=o&&n.ssao?1:0,this.data[29]=n.ssaoRadius,this.data[30]=n.ssaoStrength,this.data[31]=n.ssaoBias,this.data[32]=o&&n.depthOfField?1:0,this.data[33]=n.dofFocusDistance,this.data[34]=n.dofFocusRange,this.data[35]=n.dofBlurRadius,this.device.queue.writeBuffer(this.buffer,0,this.data),this.stats.upload(this.data.byteLength),s?this.ensureFxaa():this.releaseFxaa(),this.attachment.view=s?this.fxaaView:t;try{let n=e.beginRenderPass(this.descriptor);if(n.setPipeline(this.pipeline),n.setBindGroup(0,this.bindGroup),n.draw(3),n.end(),s){this.attachment.view=t;let n=e.beginRenderPass(this.descriptor);n.setPipeline(this.fxaaPipeline),n.setBindGroup(0,this.fxaaGroup),n.draw(3),n.end()}}finally{this.attachment.view=void 0}}resize(e,t){(this.width!==e||this.height!==t)&&this.releaseTarget()}releaseTarget(){this.texture?.destroy(),this.texture&&this.stats.target(-this.width*this.height*8),this.releaseFxaa(),this.texture=void 0,this.view=void 0,this.bindGroup=void 0}destroy(){this.releaseTarget(),this.buffer?.destroy(),this.buffer=void 0}}
//# sourceMappingURL=webgpu-post-pipeline.js.map
