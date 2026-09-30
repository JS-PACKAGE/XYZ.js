import type { Scene } from '../../core/src/scene.js';
import type { Sprite } from '../../core/src/sprite.js';
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
import {
  collectSprites2D,
  type FrameEffects,
  type RenderSnapshot,
} from './render2d-contract.js';
import {
  SPRITE_BYTES,
  SPRITE_FLOATS,
  writeSpriteInstance,
} from './sprite-instance.js';
import {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
import { spriteWGSL } from './webgpu-2d/shaders.js';
import {
  WebGPU2DEffects,
  GPUSnapshot,
  createSpritePipeline,
  type GPUColorTarget,
} from './webgpu-2d/effects.js';
const transparentColor: GPUColorDict = { r: 0, g: 0, b: 0, a: 0 };

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
  private spriteLayerPipeline: GPURenderPipeline | undefined;
  private effectsPipeline: WebGPU2DEffects | undefined;
  private captureOutput: GPUColorTarget | undefined;
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
        const wasInitialized = this.pipeline !== undefined;
        this.lostError = error;
        this.releaseResources();
        if (wasInitialized) this.onError(error);
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
            code: spriteWGSL(),
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
            const effectsPipeline = new WebGPU2DEffects(
              device,
              format,
              () => this.destroyed || !!this.lostError,
            );
            this.effectsPipeline = effectsPipeline;
            spritePipeline = createSpritePipeline(
              device,
              spriteModule,
              format,
              effectsPipeline.spriteLayout,
            );
            this.spriteLayerPipeline = createSpritePipeline(
              device,
              spriteModule,
              'rgba8unorm',
              effectsPipeline.spriteLayout,
            );
            await effectsPipeline.initialize();
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

  async prepareMaterial(material: Material2D): Promise<void> {
    this.requireDevice();
    if (!(material instanceof Material2D))
      throw new GraphicsError('WebGPU prepareMaterial requires a Material2D.');
    await this.effectsPipeline!.prepare(material);
  }

  async preparePostProcessor(effect: PostProcessor2D): Promise<void> {
    this.requireDevice();
    if (!(effect instanceof PostProcessor2D))
      throw new GraphicsError(
        'WebGPU preparePostProcessor requires a PostProcessor2D.',
      );
    await this.effectsPipeline!.prepare(effect);
  }

  async captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot> {
    this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'WebGPU captureScene cannot nest an active frame.',
      );
    const target = this.effectsPipeline!.target(
      this.canvas!.width,
      this.canvas!.height,
    );
    this.captureOutput = target;
    try {
      this.beginFrame();
      this.render(scene, width, height);
      this.endFrame();
      const snapshot = new GPUSnapshot(this.effectsPipeline!, target);
      this.effectsPipeline!.snapshots.add(snapshot);
      return snapshot;
    } catch (error) {
      this.encoder = undefined;
      target.texture.destroy();
      throw error;
    } finally {
      this.captureOutput = undefined;
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

  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void {
    const device = this.requireDevice();
    const encoder = this.encoder;
    const context = this.context;
    const pipeline = this.pipeline;
    if (!encoder || !context || !pipeline || this.frameRendered)
      throw new GraphicsError(
        'WebGPU render requires an active frame and may be called only once per frame.',
      );
    const canvas = this.canvas!;
    const logicalWidth = width ?? (canvas.clientWidth || canvas.width);
    const logicalHeight = height ?? (canvas.clientHeight || canvas.height);
    if (
      !Number.isFinite(logicalWidth) ||
      !Number.isFinite(logicalHeight) ||
      logicalWidth <= 0 ||
      logicalHeight <= 0
    )
      throw new RangeError(
        'WebGPU rendering requires positive finite logical width and height.',
      );
    const native = this.effectsPipeline!;
    const transition = effects?.transition;
    if (transition?.snapshot) native.snapshot(transition.snapshot);
    const processors = scene?.effects2D;
    const processLayer = !!processors?.length;
    if (processLayer || transition)
      native.settings(logicalWidth, logicalHeight, transition);
    if (scene) {
      this.prepareSprites(scene, device, logicalWidth, logicalHeight);
      for (const sprite of this.sprites)
        if (sprite.material) native.validate(sprite.material);
      if (processors) for (const effect of processors) native.validate(effect);
    } else {
      this.sprites.length = 0;
      this.textureFrame++;
      this.releaseUnusedTextures();
    }
    if (!processLayer) native.releaseLayers();
    if (!transition) native.releaseFrame();
    const incoming = transition
      ? native.frame(canvas.width, canvas.height)
      : undefined;
    const presentationView = this.captureOutput
      ? undefined
      : context.getCurrentTexture().createView();
    const output =
      this.captureOutput?.view ?? incoming?.view ?? presentationView!;
    this.colorAttachment.view = output;
    try {
      const drewMeshes = this.meshPipeline!.render(
        scene,
        encoder,
        output,
        canvas.width,
        canvas.height,
        logicalWidth / logicalHeight,
        defaults.clearColor,
      );
      if (processLayer) {
        if (!drewMeshes) {
          this.colorAttachment.loadOp = 'clear';
          encoder.beginRenderPass(this.renderPassDescriptor).end();
        }
        const layer = native.layers(canvas.width, canvas.height)[0];
        this.colorAttachment.view = layer.view;
        this.colorAttachment.loadOp = 'clear';
        this.colorAttachment.clearValue = transparentColor;
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        if (this.sprites.length) this.drawSprites(pass, true);
        pass.end();
        native.composite(
          encoder,
          native.process(encoder, layer, processors!),
          output,
        );
      } else if (!drewMeshes || !scene || this.sprites.length) {
        this.colorAttachment.loadOp = drewMeshes ? 'load' : 'clear';
        const pass = encoder.beginRenderPass(this.renderPassDescriptor);
        if (scene) {
          pass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
          if (this.sprites.length) this.drawSprites(pass, false);
        } else {
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
      if (transition)
        native.transition(encoder, incoming!, presentationView!, transition);
      this.frameRendered = true;
    } finally {
      this.colorAttachment.view = undefined;
      this.colorAttachment.loadOp = 'clear';
      this.colorAttachment.clearValue = defaults.clearColor;
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
    const changed =
      canvas.width !== pixelWidth || canvas.height !== pixelHeight;
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const side = Math.min(pixelWidth, pixelHeight);
    this.viewportX = (pixelWidth - side) / 2;
    this.viewportY = (pixelHeight - side) / 2;
    this.viewportSide = side;
    this.meshPipeline?.resize(pixelWidth, pixelHeight);
    if (changed) this.effectsPipeline?.resize();
  }

  private prepareSprites(
    scene: Scene,
    device: GPUDevice,
    width: number,
    height: number,
  ): void {
    const sprites = this.sprites;
    collectSprites2D(scene, width, height, sprites);
    this.textureFrame++;
    const count = sprites.length;
    if (count) {
      if (count > this.instanceCapacity) {
        let capacity = Math.max(16, this.instanceCapacity);
        while (capacity < count) capacity *= 2;
        const buffer = device.createBuffer({
          size: capacity * SPRITE_BYTES,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.instanceBuffer?.destroy();
        this.instanceBuffer = buffer;
        this.instances = new Float32Array(capacity * SPRITE_FLOATS);
        this.instanceCapacity = capacity;
      }
      if (!this.viewportBuffer) {
        this.viewportBuffer = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.viewportBindGroup = device.createBindGroup({
          layout: this.effectsPipeline!.spriteViewportLayout,
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
      const data = this.instances;
      for (let i = 0; i < count; i++) {
        const sprite = sprites[i];
        const texture = sprite.texture;
        this.cacheTexture(device, texture).seen = this.textureFrame;
        writeSpriteInstance(sprite, camera, data, i * SPRITE_FLOATS);
      }
      device.queue.writeBuffer(
        this.instanceBuffer!,
        0,
        data.buffer,
        0,
        count * SPRITE_BYTES,
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
        layout: this.effectsPipeline!.spriteTextureLayout,
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

  private drawSprites(pass: GPURenderPassEncoder, layer: boolean): void {
    pass.setBindGroup(0, this.viewportBindGroup!);
    pass.setVertexBuffer(0, this.instanceBuffer!);
    const sprites = this.sprites;
    let previousMaterial: Material2D | undefined;
    for (let first = 0; first < sprites.length;) {
      const texture = sprites[first].texture;
      const material = sprites[first].material;
      let end = first + 1;
      while (
        end < sprites.length &&
        sprites[end].texture === texture &&
        sprites[end].material === material
      )
        end++;
      if (first === 0 || material !== previousMaterial) {
        if (material) {
          const entry = this.effectsPipeline!.material(material);
          pass.setPipeline(layer ? entry.layer : entry.direct);
          pass.setBindGroup(2, entry.bindGroup);
        } else {
          pass.setPipeline(
            layer ? this.spriteLayerPipeline! : this.spritePipeline!,
          );
          pass.setBindGroup(2, this.effectsPipeline!.defaultUniforms);
        }
        previousMaterial = material;
      }
      pass.setBindGroup(1, this.textures.get(texture)!.bindGroup);
      pass.draw(6, end - first, 0, first);
      first = end;
    }
  }

  private releaseResources(): void {
    this.encoder = undefined;
    this.colorAttachment.view = undefined;
    this.submissions.length = 0;
    this.effectsPipeline?.destroy();
    this.effectsPipeline = undefined;
    this.spriteLayerPipeline = undefined;
    this.captureOutput = undefined;
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
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const context = this.context;
    const device = this.device;
    this.releaseResources();
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
