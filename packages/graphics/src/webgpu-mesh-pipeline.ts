import type { Scene } from '../../core/src/scene.js';
import { Mesh } from '../../core/src/mesh.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { Texture } from '../../assets/src/index.js';
import { WebGPUInitializationError, GraphicsError } from './errors.js';

const meshShader = /* wgsl */ `
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
`;

interface CachedGeometry {
  vertex: GPUBuffer;
  index: GPUBuffer;
  seen: number;
}
interface CachedMesh {
  uniform: GPUBuffer;
  bindGroup: GPUBindGroup;
  data: Float32Array;
  seen: number;
}
interface CachedTexture {
  resource: GPUTexture;
  bindGroup: GPUBindGroup;
  seen: number;
}

/** Renderer-private resources; Geometry vertex/index data must remain immutable after construction. */
export class WebGPUMeshPipeline {
  private readonly geometries = new Map<Geometry, CachedGeometry>();
  private readonly meshes = new Map<Mesh, CachedMesh>();
  private readonly textures = new Map<Texture, CachedTexture>();
  private readonly sceneData = new Float32Array(24);
  private readonly colorAttachment: Omit<
    GPURenderPassColorAttachment,
    'view'
  > & { view?: GPUTextureView } = {
    loadOp: 'clear',
    storeOp: 'store',
  };
  private readonly depthAttachment: Omit<
    GPURenderPassDepthStencilAttachment,
    'view'
  > & { view?: GPUTextureView } = {
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
    depthClearValue: 1,
  };
  private readonly renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [this.colorAttachment as GPURenderPassColorAttachment],
    depthStencilAttachment: this
      .depthAttachment as GPURenderPassDepthStencilAttachment,
  };
  private sceneBuffer: GPUBuffer | undefined;
  private sceneBindGroup: GPUBindGroup | undefined;
  private sampler: GPUSampler | undefined;
  private depthTexture: GPUTexture | undefined;
  private depthView: GPUTextureView | undefined;
  private depthWidth = 0;
  private depthHeight = 0;
  private frame = 0;

  private constructor(
    private readonly device: GPUDevice,
    private readonly pipeline: GPURenderPipeline,
  ) {}

  static async initialize(
    device: GPUDevice,
    format: GPUTextureFormat,
    isDestroyed: () => boolean,
  ): Promise<WebGPUMeshPipeline> {
    const module = device.createShaderModule({ code: meshShader });
    const compilation = await module.getCompilationInfo();
    if (isDestroyed())
      throw new GraphicsError(
        'WebGPU renderer was destroyed during initialization.',
      );
    const errors = compilation.messages
      .filter((message) => message.type === 'error')
      .map(
        (message) => `${message.lineNum}:${message.linePos} ${message.message}`,
      );
    if (errors.length)
      throw new WebGPUInitializationError(
        `WebGPU 3D shader compilation failed: ${errors.join('; ')}`,
      );
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 32,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
              { shaderLocation: 1, offset: 12, format: 'float32x3' },
              { shaderLocation: 2, offset: 24, format: 'float32x2' },
            ],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
    return new WebGPUMeshPipeline(device, pipeline);
  }

  /** Release depth only on an actual backing-size change; other caches survive resize. */
  resize(width: number, height: number): void {
    if (
      this.depthTexture &&
      (this.depthWidth !== width || this.depthHeight !== height)
    ) {
      this.depthTexture.destroy();
      this.depthTexture = undefined;
      this.depthView = undefined;
    }
  }

  /** Draw visible 3D meshes into a cleared depth pass before the sprite overlay. */
  render(
    scene: Scene | undefined,
    encoder: GPUCommandEncoder,
    view: GPUTextureView,
    width: number,
    height: number,
    aspect: number,
    clearValue: GPUColor,
  ): boolean {
    this.frame++;
    let pass: GPURenderPassEncoder | undefined;
    try {
      if (scene) {
        for (const object of scene.objects) {
          if (
            !(object instanceof Mesh) ||
            !object.visible ||
            object.material.opacity <= 0 ||
            object.material.texture.destroyed ||
            object.geometry.indices.length === 0
          )
            continue;
          if (!pass) {
            this.prepareScene(scene, aspect);
            this.ensureDepth(width, height);
            this.colorAttachment.view = view;
            this.colorAttachment.clearValue = clearValue;
            this.depthAttachment.view = this.depthView;
            pass = encoder.beginRenderPass(this.renderPassDescriptor);
            pass.setViewport(0, 0, width, height, 0, 1);
            pass.setPipeline(this.pipeline);
            pass.setBindGroup(0, this.sceneBindGroup!);
          }
          const geometry = this.cacheGeometry(object.geometry);
          const mesh = this.cacheMesh(object);
          const texture = this.cacheTexture(object.material.texture);
          geometry.seen = mesh.seen = texture.seen = this.frame;
          this.updateMesh(object, mesh);
          pass.setBindGroup(1, mesh.bindGroup);
          pass.setBindGroup(2, texture.bindGroup);
          pass.setVertexBuffer(0, geometry.vertex);
          pass.setIndexBuffer(geometry.index, 'uint32');
          pass.drawIndexed(object.geometry.indices.length);
        }
      }
      return pass !== undefined;
    } finally {
      try {
        pass?.end();
      } finally {
        this.colorAttachment.view = undefined;
        this.depthAttachment.view = undefined;
        this.releaseUnused();
      }
    }
  }

  private prepareScene(scene: Scene, aspect: number): void {
    const device = this.device;
    if (!this.sceneBuffer) {
      const buffer = device.createBuffer({
        size: 96,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      try {
        const bindGroup = device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer } }],
        });
        const sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge',
        });
        this.sceneBuffer = buffer;
        this.sceneBindGroup = bindGroup;
        this.sampler = sampler;
      } catch (error) {
        buffer.destroy();
        throw error;
      }
    }
    const data = this.sceneData;
    data.set(scene.camera3D.updateMatrix(aspect).elements, 0);
    const light = scene.directionalLight;
    data[16] = light.direction.x;
    data[17] = light.direction.y;
    data[18] = light.direction.z;
    data[19] = light.intensity;
    data[20] = light.color[0];
    data[21] = light.color[1];
    data[22] = light.color[2];
    data[23] = scene.ambientLight;
    device.queue.writeBuffer(this.sceneBuffer, 0, data);
  }

  private ensureDepth(width: number, height: number): void {
    if (
      this.depthTexture &&
      this.depthWidth === width &&
      this.depthHeight === height
    )
      return;
    this.depthTexture?.destroy();
    this.depthTexture = undefined;
    this.depthView = undefined;
    this.depthTexture = this.device.createTexture({
      size: [width, height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthView = this.depthTexture.createView();
    this.depthWidth = width;
    this.depthHeight = height;
  }

  private cacheGeometry(geometry: Geometry): CachedGeometry {
    const existing = this.geometries.get(geometry);
    if (existing) return existing;
    const vertex = this.device.createBuffer({
      size: geometry.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    try {
      const index = this.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      try {
        this.device.queue.writeBuffer(vertex, 0, geometry.vertices);
        this.device.queue.writeBuffer(index, 0, geometry.indices);
        const entry = { vertex, index, seen: this.frame };
        this.geometries.set(geometry, entry);
        return entry;
      } catch (error) {
        index.destroy();
        throw error;
      }
    } catch (error) {
      vertex.destroy();
      throw error;
    }
  }

  private cacheMesh(object: Mesh): CachedMesh {
    const existing = this.meshes.get(object);
    if (existing) return existing;
    const uniform = this.device.createBuffer({
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    try {
      const bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(1),
        entries: [{ binding: 0, resource: { buffer: uniform } }],
      });
      const entry = {
        uniform,
        bindGroup,
        data: new Float32Array(36),
        seen: this.frame,
      };
      this.meshes.set(object, entry);
      return entry;
    } catch (error) {
      uniform.destroy();
      throw error;
    }
  }

  private cacheTexture(texture: Texture): CachedTexture {
    const existing = this.textures.get(texture);
    if (existing) return existing;
    const { width, height } = texture;
    const limit = this.device.limits.maxTextureDimension2D;
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > limit ||
      height > limit
    )
      throw new GraphicsError(
        `WebGPU texture size ${width}×${height} exceeds this device's maximum texture dimension of ${limit} pixels per side.`,
      );
    const resource = this.device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    try {
      this.device.queue.copyExternalImageToTexture(
        { source: texture.image },
        { texture: resource, premultipliedAlpha: true },
        [width, height],
      );
      const bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(2),
        entries: [
          { binding: 0, resource: resource.createView() },
          { binding: 1, resource: this.sampler! },
        ],
      });
      const entry = { resource, bindGroup, seen: this.frame };
      this.textures.set(texture, entry);
      return entry;
    } catch (error) {
      resource.destroy();
      throw error;
    }
  }

  private updateMesh(object: Mesh, mesh: CachedMesh): void {
    const model = object.transform.updateMatrix().elements;
    const data = mesh.data;
    data.set(model, 0);
    // Columns of inverse-transpose(model3x3) are the cofactors of model's columns.
    const a0 = model[0],
      a1 = model[1],
      a2 = model[2];
    const b0 = model[4],
      b1 = model[5],
      b2 = model[6];
    const c0 = model[8],
      c1 = model[9],
      c2 = model[10];
    const n0 = b1 * c2 - b2 * c1,
      n1 = b2 * c0 - b0 * c2,
      n2 = b0 * c1 - b1 * c0;
    const det = a0 * n0 + a1 * n1 + a2 * n2;
    const inverseDet = det !== 0 ? 1 / det : 0;
    data[16] = n0 * inverseDet;
    data[17] = n1 * inverseDet;
    data[18] = n2 * inverseDet;
    data[19] = 0;
    data[20] = (c1 * a2 - c2 * a1) * inverseDet;
    data[21] = (c2 * a0 - c0 * a2) * inverseDet;
    data[22] = (c0 * a1 - c1 * a0) * inverseDet;
    data[23] = 0;
    data[24] = (a1 * b2 - a2 * b1) * inverseDet;
    data[25] = (a2 * b0 - a0 * b2) * inverseDet;
    data[26] = (a0 * b1 - a1 * b0) * inverseDet;
    data[27] = 0;
    data[28] = data[29] = data[30] = 0;
    data[31] = 1;
    data[32] = object.material.color[0];
    data[33] = object.material.color[1];
    data[34] = object.material.color[2];
    data[35] = object.material.opacity;
    this.device.queue.writeBuffer(mesh.uniform, 0, data);
  }

  private releaseUnused(): void {
    for (const [geometry, entry] of this.geometries) {
      if (entry.seen !== this.frame) {
        entry.vertex.destroy();
        entry.index.destroy();
        this.geometries.delete(geometry);
      }
    }
    for (const [object, entry] of this.meshes) {
      if (entry.seen !== this.frame) {
        entry.uniform.destroy();
        this.meshes.delete(object);
      }
    }
    for (const [texture, entry] of this.textures) {
      if (texture.destroyed || entry.seen !== this.frame) {
        entry.resource.destroy();
        this.textures.delete(texture);
      }
    }
  }

  destroy(): void {
    this.depthTexture?.destroy();
    this.depthTexture = undefined;
    this.depthView = undefined;
    this.sceneBuffer?.destroy();
    this.sceneBuffer = undefined;
    for (const entry of this.geometries.values()) {
      entry.vertex.destroy();
      entry.index.destroy();
    }
    this.geometries.clear();
    for (const entry of this.meshes.values()) entry.uniform.destroy();
    this.meshes.clear();
    for (const entry of this.textures.values()) entry.resource.destroy();
    this.textures.clear();
  }
}
