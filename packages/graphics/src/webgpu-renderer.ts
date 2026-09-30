import type { Scene } from '../../core/src/scene.js';
import { Sprite } from '../../core/src/sprite.js';
import type { Texture } from '../../assets/src/index.js';
import { defaults } from '../../../src/data/defaults.js';
import {
  GraphicsError,
  WebGPUInitializationError,
  WebGPUDeviceLostError,
  WebGPUNotSupportedError,
} from './errors.js';
import type { Renderer } from './index.js';
import { WebGPUMeshPipeline } from './webgpu-mesh-pipeline.js';

const triangleShader = /* wgsl */ `
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
`;

// Each instance is three vec4s: affine axes, translation + natural size, anchor + opacity.
const spriteShader = /* wgsl */ `
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
`;

interface CachedTexture {
  resource: GPUTexture;
  bindGroup: GPUBindGroup;
  seen: number;
}

export class WebGPURenderer implements Renderer {
  readonly backend = 'webgpu' as const;
  readonly capabilities = {
    threeD: true,
    compute: true,
    customShaders: true,
    storageBuffers: true,
    instancing: true,
    maxTextureSize: 0,
  };
  private canvas: HTMLCanvasElement | undefined;
  private context: GPUCanvasContext | undefined;
  private device: GPUDevice | undefined;
  private pipeline: GPURenderPipeline | undefined;
  private spritePipeline: GPURenderPipeline | undefined;
  private meshPipeline: WebGPUMeshPipeline | undefined;
  private viewportBuffer: GPUBuffer | undefined;
  private viewportBindGroup: GPUBindGroup | undefined;
  private spriteSampler: GPUSampler | undefined;
  private instanceBuffer: GPUBuffer | undefined;
  private instanceCapacity = 0;
  private instances = new Float32Array(0);
  private readonly viewportData = new Float32Array(4);
  private readonly sprites: Sprite[] = [];
  private readonly textures = new Map<Texture, CachedTexture>();
  private textureFrame = 0;
  private encoder: GPUCommandEncoder | undefined;
  private readonly colorAttachment: Omit<
    GPURenderPassColorAttachment,
    'view'
  > & { view?: GPUTextureView } = {
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: defaults.clearColor,
  };
  private readonly renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [this.colorAttachment as GPURenderPassColorAttachment],
  };
  private readonly submissions: GPUCommandBuffer[] = [];
  private viewportX = 0;
  private viewportY = 0;
  private viewportSide = 1;
  private frameRendered = false;
  private configured = false;
  private initializing = false;
  private destroyed = false;
  private lostError: WebGPUDeviceLostError | undefined;

  constructor(private readonly onError: (error: Error) => void) {}

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.device || this.initializing) {
      throw new GraphicsError(
        'WebGPU renderer cannot be initialized more than once.',
      );
    }
    this.initializing = true;

    try {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: this browser or security context does not expose navigator.gpu.',
        );
      }
      const adapter = await navigator.gpu.requestAdapter();
      if (this.destroyed)
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      if (!adapter) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: the browser could not provide a GPU adapter.',
        );
      }
      const device = await adapter.requestDevice();
      if (this.destroyed) {
        device.destroy();
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      }
      this.device = device;
      this.capabilities.maxTextureSize = device.limits.maxTextureDimension2D;
      // Install this before any asynchronous shader validation, so initialization-time loss is detected.
      void device.lost.then((info) => {
        if (this.destroyed) return;
        const error = new WebGPUDeviceLostError(
          `WebGPU device lost (${info.reason}): ${info.message || 'the GPU or driver became unavailable'}.`,
        );
        this.lostError = error;
        if (this.pipeline) this.onError(error);
      });
      device.addEventListener(
        'uncapturederror',
        (event: GPUUncapturedErrorEvent) => {
          if (!this.destroyed)
            this.onError(
              new GraphicsError(
                `WebGPU uncaptured error: ${event.error.message}`,
                { cause: event.error },
              ),
            );
        },
      );

      const context = canvas.getContext('webgpu');
      if (!context) {
        throw new WebGPUInitializationError(
          'WebGPU canvas context is unavailable: canvas.getContext("webgpu") returned null.',
        );
      }
      this.context = context;
      this.canvas = canvas;
      this.resize(Math.max(canvas.width, 1), Math.max(canvas.height, 1));
      const format = navigator.gpu.getPreferredCanvasFormat();

      device.pushErrorScope('validation');
      let shaderErrors: string[] = [];
      let pipeline: GPURenderPipeline | undefined;
      let spritePipeline: GPURenderPipeline | undefined;
      let meshPipeline: WebGPUMeshPipeline | undefined;
      let validationError: GPUError | null = null;
      try {
        context.configure({ device, format, alphaMode: 'opaque' });
        this.configured = true;
        const shader = device.createShaderModule({ code: triangleShader });
        const compilation = await shader.getCompilationInfo();
        if (this.destroyed)
          throw new GraphicsError(
            'WebGPU renderer was destroyed during initialization.',
          );
        shaderErrors = compilation.messages
          .filter((message) => message.type === 'error')
          .map(
            (message) =>
              `${message.lineNum}:${message.linePos} ${message.message}`,
          );
        if (shaderErrors.length === 0) {
          pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: shader, entryPoint: 'vertexMain' },
            fragment: {
              module: shader,
              entryPoint: 'fragmentMain',
              targets: [{ format }],
            },
            primitive: { topology: 'triangle-list' },
          });
          const spriteModule = device.createShaderModule({
            code: spriteShader,
          });
          const spriteCompilation = await spriteModule.getCompilationInfo();
          if (this.destroyed)
            throw new GraphicsError(
              'WebGPU renderer was destroyed during initialization.',
            );
          shaderErrors = spriteCompilation.messages
            .filter((message) => message.type === 'error')
            .map(
              (message) =>
                `${message.lineNum}:${message.linePos} ${message.message}`,
            );
          if (shaderErrors.length === 0) {
            spritePipeline = device.createRenderPipeline({
              layout: 'auto',
              vertex: {
                module: spriteModule,
                entryPoint: 'vertexMain',
                buffers: [
                  {
                    arrayStride: 48,
                    stepMode: 'instance',
                    attributes: [
                      { shaderLocation: 0, offset: 0, format: 'float32x4' },
                      { shaderLocation: 1, offset: 16, format: 'float32x4' },
                      { shaderLocation: 2, offset: 32, format: 'float32x4' },
                    ],
                  },
                ],
              },
              fragment: {
                module: spriteModule,
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
            });
            meshPipeline = await WebGPUMeshPipeline.initialize(
              device,
              format,
              () => this.destroyed,
            );
          }
        }
      } finally {
        validationError = await device.popErrorScope();
      }
      if (this.destroyed)
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      if (shaderErrors.length) {
        throw new WebGPUInitializationError(
          `WebGPU shader compilation failed: ${shaderErrors.join('; ')}`,
        );
      }
      if (validationError) {
        throw new WebGPUInitializationError(
          `WebGPU canvas/shader/pipeline validation failed: ${validationError.message}`,
          { cause: validationError },
        );
      }
      if (this.lostError) throw this.lostError;
      this.pipeline = pipeline;
      this.spritePipeline = spritePipeline;
      this.meshPipeline = meshPipeline;
    } catch (error) {
      const destroyed = this.destroyed;
      this.destroy();
      if (destroyed && !(error instanceof GraphicsError))
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
          { cause: error },
        );
      if (error instanceof GraphicsError) throw error;
      throw new WebGPUInitializationError(
        `WebGPU initialization failed while requesting a device or configuring the canvas and triangle pipeline${error instanceof Error ? `: ${error.message}` : '.'}`,
        { cause: error },
      );
    } finally {
      this.initializing = false;
    }
  }

  beginFrame(): void {
    const device = this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'WebGPU beginFrame called before the preceding frame ended.',
      );
    this.encoder = device.createCommandEncoder();
    this.frameRendered = false;
  }

  render(scene?: Scene, width?: number, height?: number): void {
    const device = this.requireDevice();
    const encoder = this.encoder;
    const context = this.context;
    const pipeline = this.pipeline;
    let aspect = 1;
    if (!encoder || !context || !pipeline || this.frameRendered) {
      throw new GraphicsError(
        'WebGPU render requires an active frame and may be called only once per frame.',
      );
    }
    if (scene) {
      const canvas = this.canvas;
      const logicalWidth = width ?? (canvas?.clientWidth || canvas?.width);
      const logicalHeight = height ?? (canvas?.clientHeight || canvas?.height);
      if (
        !logicalWidth ||
        !logicalHeight ||
        !Number.isFinite(logicalWidth) ||
        !Number.isFinite(logicalHeight) ||
        logicalWidth <= 0 ||
        logicalHeight <= 0
      ) {
        throw new RangeError(
          'WebGPU sprite rendering requires positive finite logical width and height.',
        );
      }
      aspect = logicalWidth / logicalHeight;
      this.prepareSprites(scene, device, logicalWidth, logicalHeight);
    } else {
      this.sprites.length = 0;
      this.textureFrame++;
      this.releaseUnusedTextures();
    }
    this.colorAttachment.view = context.getCurrentTexture().createView();
    try {
      const drewMeshes = this.meshPipeline!.render(
        scene,
        encoder,
        this.colorAttachment.view,
        this.canvas!.width,
        this.canvas!.height,
        aspect,
        this.colorAttachment.clearValue!,
      );
      if (!drewMeshes || !scene || this.sprites.length) {
        this.colorAttachment.loadOp = drewMeshes ? 'load' : 'clear';
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        if (scene) {
          // Scene coordinates use logical CSS pixels rather than the DPR-scaled backing size.
          pass.setViewport(0, 0, this.canvas!.width, this.canvas!.height, 0, 1);
          if (this.sprites.length) this.drawSprites(pass);
        } else {
          // Preserve P01's centered square triangle when no Scene is active.
          pass.setViewport(
            this.viewportX,
            this.viewportY,
            this.viewportSide,
            this.viewportSide,
            0,
            1,
          );
          pass.setPipeline(pipeline);
          pass.draw(3);
        }
        pass.end();
      }
      this.frameRendered = true;
    } finally {
      // WebGPU consumes the descriptor during beginRenderPass; do not retain a swapchain view.
      this.colorAttachment.view = undefined;
      this.colorAttachment.loadOp = 'clear';
    }
  }

  endFrame(): void {
    const device = this.requireDevice();
    if (!this.encoder || !this.frameRendered) {
      throw new GraphicsError('WebGPU endFrame requires a rendered frame.');
    }
    const commandBuffer = this.encoder.finish();
    this.encoder = undefined;
    this.submissions.push(commandBuffer);
    try {
      device.queue.submit(this.submissions);
    } finally {
      this.submissions.length = 0;
    }
  }

  resize(width: number, height: number): void {
    if (this.lostError) throw this.lostError;
    const canvas = this.canvas;
    const device = this.device;
    if (!canvas || !device || this.destroyed)
      throw new GraphicsError(
        'WebGPU resize requires an initialized renderer.',
      );
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 0 ||
      height < 0
    ) {
      throw new RangeError(
        'WebGPU canvas pixel width and height must be finite, nonnegative numbers.',
      );
    }
    const pixelWidth = Math.max(1, Math.round(width));
    const pixelHeight = Math.max(1, Math.round(height));
    const limit = device.limits.maxTextureDimension2D;
    if (
      !Number.isSafeInteger(pixelWidth) ||
      !Number.isSafeInteger(pixelHeight) ||
      pixelWidth > limit ||
      pixelHeight > limit
    ) {
      throw new GraphicsError(
        `WebGPU canvas backing size ${pixelWidth}×${pixelHeight} exceeds this device's maximum texture dimension of ${limit} pixels per side. Reduce the canvas size or pixel ratio.`,
      );
    }
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const side = Math.min(pixelWidth, pixelHeight);
    this.viewportX = (pixelWidth - side) / 2;
    this.viewportY = (pixelHeight - side) / 2;
    this.viewportSide = side;
    this.meshPipeline?.resize(pixelWidth, pixelHeight);
  }

  private prepareSprites(
    scene: Scene,
    device: GPUDevice,
    width: number,
    height: number,
  ): void {
    const sprites = this.sprites;
    sprites.length = 0;
    for (const object of scene.objects) {
      if (
        object instanceof Sprite &&
        object.visible &&
        object.opacity > 0 &&
        !object.texture.destroyed
      )
        sprites.push(object);
    }
    // ECMAScript stable sort retains Scene insertion order for equal z-index values.
    sprites.sort((a, b) => a.zIndex - b.zIndex);
    this.textureFrame++;
    const count = sprites.length;
    if (count) {
      if (count > this.instanceCapacity) {
        let capacity = Math.max(16, this.instanceCapacity);
        while (capacity < count) capacity *= 2;
        const buffer = device.createBuffer({
          size: capacity * 48,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.instanceBuffer?.destroy();
        this.instanceBuffer = buffer;
        this.instances = new Float32Array(capacity * 12);
        this.instanceCapacity = capacity;
      }
      if (!this.viewportBuffer) {
        const pipeline = this.spritePipeline!;
        this.viewportBuffer = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.viewportBindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: this.viewportBuffer } }],
        });
        this.spriteSampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge',
        });
      }
      if (this.viewportData[0] !== width || this.viewportData[1] !== height) {
        this.viewportData[0] = width;
        this.viewportData[1] = height;
        device.queue.writeBuffer(this.viewportBuffer, 0, this.viewportData);
      }
      const camera = scene.camera2D;
      const zoom = camera.zoom;
      const cameraX = camera.position.x;
      const cameraY = camera.position.y;
      const data = this.instances;
      for (let i = 0; i < count; i++) {
        const sprite = sprites[i];
        const texture = sprite.texture;
        this.cacheTexture(device, texture).seen = this.textureFrame;
        const matrix = sprite.transform.updateMatrix().elements;
        const offset = i * 12;
        data[offset] = matrix[0] * zoom;
        data[offset + 1] = matrix[1] * zoom;
        data[offset + 2] = matrix[3] * zoom;
        data[offset + 3] = matrix[4] * zoom;
        data[offset + 4] = (matrix[6] - cameraX) * zoom;
        data[offset + 5] = (matrix[7] - cameraY) * zoom;
        data[offset + 6] = texture.width;
        data[offset + 7] = texture.height;
        data[offset + 8] = sprite.anchor.x;
        data[offset + 9] = sprite.anchor.y;
        data[offset + 10] = sprite.opacity;
        data[offset + 11] = 0;
      }
      device.queue.writeBuffer(
        this.instanceBuffer!,
        0,
        data.buffer,
        0,
        count * 48,
      );
    }
    this.releaseUnusedTextures();
  }

  private cacheTexture(device: GPUDevice, texture: Texture): CachedTexture {
    const existing = this.textures.get(texture);
    if (existing) return existing;
    const { width, height } = texture;
    const limit = device.limits.maxTextureDimension2D;
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > limit ||
      height > limit
    ) {
      throw new GraphicsError(
        `WebGPU texture size ${width}×${height} exceeds this device's maximum texture dimension of ${limit} pixels per side.`,
      );
    }
    const resource = device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    try {
      device.queue.copyExternalImageToTexture(
        { source: texture.image },
        { texture: resource, premultipliedAlpha: true },
        [width, height],
      );
      const bindGroup = device.createBindGroup({
        layout: this.spritePipeline!.getBindGroupLayout(1),
        entries: [
          { binding: 0, resource: resource.createView() },
          { binding: 1, resource: this.spriteSampler! },
        ],
      });
      const entry: CachedTexture = {
        resource,
        bindGroup,
        seen: this.textureFrame,
      };
      this.textures.set(texture, entry);
      return entry;
    } catch (error) {
      resource.destroy();
      throw error;
    }
  }

  private releaseUnusedTextures(): void {
    for (const [texture, entry] of this.textures) {
      if (texture.destroyed || entry.seen !== this.textureFrame) {
        entry.resource.destroy();
        this.textures.delete(texture);
      }
    }
  }

  private drawSprites(pass: GPURenderPassEncoder): void {
    pass.setPipeline(this.spritePipeline!);
    pass.setBindGroup(0, this.viewportBindGroup!);
    pass.setVertexBuffer(0, this.instanceBuffer!);
    const sprites = this.sprites;
    for (let first = 0; first < sprites.length;) {
      const texture = sprites[first].texture;
      let end = first + 1;
      while (end < sprites.length && sprites[end].texture === texture) end++;
      pass.setBindGroup(1, this.textures.get(texture)!.bindGroup);
      pass.draw(6, end - first, 0, first);
      first = end;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const context = this.context;
    const device = this.device;
    this.encoder = undefined;
    this.colorAttachment.view = undefined;
    this.submissions.length = 0;
    this.meshPipeline?.destroy();
    this.meshPipeline = undefined;
    this.spritePipeline = undefined;
    this.viewportBuffer?.destroy();
    this.viewportBuffer = undefined;
    this.viewportBindGroup = undefined;
    this.spriteSampler = undefined;
    this.instanceBuffer?.destroy();
    this.instanceBuffer = undefined;
    this.instanceCapacity = 0;
    this.instances = new Float32Array(0);
    this.sprites.length = 0;
    for (const entry of this.textures.values()) entry.resource.destroy();
    this.textures.clear();
    this.pipeline = undefined;
    this.context = undefined;
    this.canvas = undefined;
    this.device = undefined;
    try {
      if (this.configured) context?.unconfigure();
    } finally {
      device?.destroy();
    }
  }

  private requireDevice(): GPUDevice {
    if (this.lostError) throw this.lostError;
    if (this.destroyed || !this.device || !this.pipeline) {
      throw new GraphicsError(
        'WebGPU renderer is not initialized or has already been destroyed.',
      );
    }
    return this.device;
  }
}
