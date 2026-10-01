import type { Scene } from '../../core/src/scene.js';
import { Frustum } from '../../core/src/frustum.js';
import { DrawSorter } from '../../core/src/draw-order.js';
import { Mesh } from '../../core/src/mesh.js';
import {
  PBRMaterial,
  type TextureSamplerOptions,
} from '../../core/src/pbr-material.js';
import { InstancedMesh } from '../../core/src/instanced-mesh.js';
import {
  activeBackground,
  activeEnvironment,
  fillEnvironmentData,
  fillFogData,
  fillLightingData,
  validateRenderSettings,
} from '../../core/src/render-data.js';
import type { EnvironmentMap } from '../../core/src/environment.js';
import { ShadowAtlas } from '../../core/src/shadow-atlas.js';
import {
  ENVIRONMENT_FLOAT_COUNT,
  FOG_FLOAT_COUNT,
  LIGHTING_FLOAT_COUNT,
} from '../../../src/data/rendering.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { Texture } from '../../assets/src/index.js';
import { Matrix4 } from '../../math/src/index.js';
import { WebGPUInitializationError, GraphicsError } from './errors.js';
import { webgpuMeshShader } from './webgpu-mesh-shader.js';
import { WebGPUPostPipeline } from './webgpu-post-pipeline.js';
import { FrameStats } from './render-stats.js';

interface CachedGeometry {
  vertex: GPUBuffer;
  index: GPUBuffer;
  /** Per-vertex RGB, or undefined when the geometry has none (a shared white buffer is bound). */
  colors: GPUBuffer | undefined;
  version: number;
  seen: number;
}
interface CachedMesh {
  uniform: GPUBuffer;
  bindGroup: GPUBindGroup;
  materialGroup: GPUBindGroup;
  instance: GPUBuffer;
  instanceVersion: number;
  /** Per-instance RGB, or undefined while the InstancedMesh has no colors. */
  instanceColors: GPUBuffer | undefined;
  instanceColorVersion: number;
  data: Float32Array;
  seen: number;
}
interface CachedTexture {
  resource: GPUTexture;
  view: GPUTextureView;
  seen: number;
}
interface CachedEnvironment {
  texture: GPUTexture;
  view: GPUTextureView;
  seen: number;
}

/** Persistent 3D resources, including versioned CPU skinning and hardware instances. */
export class WebGPUMeshPipeline {
  private readonly geometries = new Map<Geometry, CachedGeometry>();
  private readonly meshes = new Map<Mesh, CachedMesh>();
  private readonly textures = new Map<Texture, CachedTexture>();
  private readonly premultipliedTextures = new Map<Texture, CachedTexture>();
  private readonly samplers = new Map<number, GPUSampler>();
  private readonly draws: Mesh[] = [];
  /** Subset of `draws` inside the camera frustum; shadow casters outside still cast. */
  private readonly visibleDraws: Mesh[] = [];
  private readonly frustum = new Frustum();
  private readonly drawSorter = new DrawSorter();
  readonly stats = new FrameStats();
  private readonly sceneData = new Float32Array(288);
  private readonly fogData = new Float32Array(FOG_FLOAT_COUNT);
  private readonly environmentData = new Float32Array(ENVIRONMENT_FLOAT_COUNT);
  private readonly invViewProjection = new Matrix4();
  private readonly environments = new Map<EnvironmentMap, CachedEnvironment>();
  private readonly dummyEnvironment: GPUTexture;
  private readonly dummyEnvironmentView: GPUTextureView;
  private readonly environmentSampler: GPUSampler;
  private environmentView: GPUTextureView;
  private backgroundView: GPUTextureView;
  private readonly lightingData = new Float32Array(LIGHTING_FLOAT_COUNT);
  private readonly atlas = new ShadowAtlas();
  private readonly shadowBuffer: GPUBuffer;
  private readonly projectionBuffer: GPUBuffer;
  private readonly projectionGroup: GPUBindGroup;
  private readonly projectionOffsets = [0];
  private readonly sceneBuffer: GPUBuffer;
  private readonly sampler: GPUSampler;
  private readonly whiteTexture: GPUTexture;
  private readonly whiteView: GPUTextureView;
  private readonly emptyShadow: GPUTexture;
  private readonly emptyShadowView: GPUTextureView;
  private readonly identityBuffer: GPUBuffer;
  /** Linear (1, 1, 1) for every vertex or instance that has no colors of its own. */
  private whiteBuffer: GPUBuffer;
  private whiteCapacity = 0;
  /** Replaced white buffers wait here until commands that may still bind them are submitted. */
  private readonly retired: GPUBuffer[] = [];
  private sceneBindGroup: GPUBindGroup;
  private shadowSceneBindGroup: GPUBindGroup;
  private shadowTexture: GPUTexture | undefined;
  private shadowView: GPUTextureView | undefined;
  private shadowSize = 0;
  private depthTexture: GPUTexture | undefined;
  private depthView: GPUTextureView | undefined;
  private depthWidth = 0;
  private depthHeight = 0;
  private msaaTexture: GPUTexture | undefined;
  private msaaView: GPUTextureView | undefined;
  private msaaFormat: GPUTextureFormat | undefined;
  private msaaWidth = 0;
  private msaaHeight = 0;
  private frame = 0;
  private readonly linearClear = { r: 0, g: 0, b: 0, a: 1 };
  private readonly clearComponents = new Float32Array(4);
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
  private readonly shadowAttachment: Omit<
    GPURenderPassDepthStencilAttachment,
    'view'
  > & { view?: GPUTextureView } = {
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
    depthClearValue: 1,
  };
  private readonly shadowDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [],
    depthStencilAttachment: this
      .shadowAttachment as GPURenderPassDepthStencilAttachment,
  };

  private constructor(
    private readonly device: GPUDevice,
    private readonly pipeline: GPURenderPipeline,
    private readonly hdrPipeline: GPURenderPipeline,
    private readonly shadowPipeline: GPURenderPipeline,
    private readonly skyPipeline: GPURenderPipeline,
    private readonly skyHdrPipeline: GPURenderPipeline,
    private readonly sceneLayout: GPUBindGroupLayout,
    private readonly meshLayout: GPUBindGroupLayout,
    private readonly materialLayout: GPUBindGroupLayout,
    projectionLayout: GPUBindGroupLayout,
    private readonly post: WebGPUPostPipeline,
    private readonly format: GPUTextureFormat,
    private readonly sampleCount: number,
  ) {
    this.sceneBuffer = device.createBuffer({
      size: this.sceneData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.shadowBuffer = device.createBuffer({
      size: this.atlas.data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.projectionBuffer = device.createBuffer({
      size: this.atlas.projections.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.projectionGroup = device.createBindGroup({
      layout: projectionLayout,
      entries: [
        { binding: 0, resource: { buffer: this.projectionBuffer, size: 64 } },
      ],
    });
    this.sampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
    this.whiteTexture = device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
      { texture: this.whiteTexture },
      new Uint8Array([255, 255, 255, 255]),
      {},
      [1, 1],
    );
    this.whiteView = this.whiteTexture.createView();
    // A distinct unused depth view keeps the shadow pass from sampling its own attachment.
    this.emptyShadow = device.createTexture({
      size: [1, 1],
      format: 'depth32float',
      usage: GPUTextureUsage.TEXTURE_BINDING,
    });
    this.emptyShadowView = this.emptyShadow.createView();
    this.environmentSampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge',
    });
    this.dummyEnvironment = device.createTexture({
      size: [1, 1],
      format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING,
    });
    this.dummyEnvironmentView = this.dummyEnvironment.createView();
    this.environmentView = this.dummyEnvironmentView;
    this.backgroundView = this.dummyEnvironmentView;
    this.identityBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.identityBuffer, 0, new Matrix4().elements);
    this.whiteCapacity = 1024;
    this.whiteBuffer = device.createBuffer({
      size: this.whiteCapacity * 16,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.whiteBuffer,
      0,
      new Float32Array(this.whiteCapacity * 4).fill(1),
    );
    this.sceneBindGroup = this.createSceneGroup(this.emptyShadowView);
    this.shadowSceneBindGroup = this.sceneBindGroup;
  }

  static async initialize(
    device: GPUDevice,
    format: GPUTextureFormat,
    isDestroyed: () => boolean,
    sampleCount: number,
  ): Promise<WebGPUMeshPipeline> {
    const module = device.createShaderModule({ code: webgpuMeshShader });
    const compilation = await module.getCompilationInfo();
    if (isDestroyed())
      throw new GraphicsError(
        'WebGPU renderer was destroyed during initialization.',
      );
    const errors = compilation.messages.filter(
      (message) => message.type === 'error',
    );
    if (errors.length)
      throw new WebGPUInitializationError(
        `WebGPU 3D shader compilation failed: ${errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('; ')}`,
      );
    const sceneLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'depth' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        {
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });
    const meshLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });
    const materialLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 6, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 7, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 8, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 9, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });
    const layout = device.createPipelineLayout({
      bindGroupLayouts: [sceneLayout, meshLayout, materialLayout],
    });
    const projectionLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
            hasDynamicOffset: true,
            minBindingSize: 64,
          },
        },
      ],
    });
    const buffers: GPUVertexBufferLayout[] = [
      {
        arrayStride: 32,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x3' },
          { shaderLocation: 1, offset: 12, format: 'float32x3' },
          { shaderLocation: 2, offset: 24, format: 'float32x2' },
        ],
      },
      {
        arrayStride: 64,
        stepMode: 'instance',
        attributes: [
          { shaderLocation: 3, offset: 0, format: 'float32x4' },
          { shaderLocation: 4, offset: 16, format: 'float32x4' },
          { shaderLocation: 5, offset: 32, format: 'float32x4' },
          { shaderLocation: 6, offset: 48, format: 'float32x4' },
        ],
      },
      {
        arrayStride: 12,
        stepMode: 'instance',
        attributes: [{ shaderLocation: 7, offset: 0, format: 'float32x3' }],
      },
      {
        arrayStride: 16,
        attributes: [{ shaderLocation: 8, offset: 0, format: 'float32x4' }],
      },
    ];
    const blend: GPUBlendState = {
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
    };
    const pipeline = device.createRenderPipeline({
      layout,
      vertex: { module, entryPoint: 'vertexMain', buffers },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format, blend }],
      },
      primitive: { topology: 'triangle-list' },
      multisample: { count: sampleCount },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
    const hdrPipeline = device.createRenderPipeline({
      layout,
      vertex: { module, entryPoint: 'vertexMain', buffers },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format: 'rgba16float', blend }],
      },
      primitive: { topology: 'triangle-list' },
      multisample: { count: sampleCount },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
    const shadowPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          sceneLayout,
          meshLayout,
          materialLayout,
          projectionLayout,
        ],
      }),
      vertex: { module, entryPoint: 'shadowVertex', buffers },
      fragment: { module, entryPoint: 'shadowFragment', targets: [] },
      primitive: { topology: 'triangle-list' },
      depthStencil: {
        format: 'depth32float',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
    const skyPipelines = [format, 'rgba16float' as GPUTextureFormat].map(
      (targetFormat) =>
        device.createRenderPipeline({
          layout: device.createPipelineLayout({
            bindGroupLayouts: [sceneLayout],
          }),
          vertex: { module, entryPoint: 'skyVertex' },
          fragment: {
            module,
            entryPoint: 'skyFragment',
            targets: [{ format: targetFormat }],
          },
          primitive: { topology: 'triangle-list' },
          multisample: { count: sampleCount },
          // Same attachment layout as the mesh pass, but sky never tests or writes depth.
          depthStencil: {
            format: 'depth24plus',
            depthWriteEnabled: false,
            depthCompare: 'always',
          },
        }),
    );
    const [skyPipeline, skyHdrPipeline] = skyPipelines;
    const post = await WebGPUPostPipeline.initialize(
      device,
      format,
      isDestroyed,
    );
    try {
      return new WebGPUMeshPipeline(
        device,
        pipeline,
        hdrPipeline,
        shadowPipeline,
        skyPipeline,
        skyHdrPipeline,
        sceneLayout,
        meshLayout,
        materialLayout,
        projectionLayout,
        post,
        format,
        sampleCount,
      );
    } catch (error) {
      post.destroy();
      throw error;
    }
  }

  resize(width: number, height: number): void {
    if (
      this.depthTexture &&
      (this.depthWidth !== width || this.depthHeight !== height)
    ) {
      this.depthTexture.destroy();
      this.depthTexture = undefined;
      this.depthView = undefined;
    }
    this.post.resize(width, height);
  }

  /** Shadows and linear HDR resolution precede the existing sprite overlay. */
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
    for (const buffer of this.retired) buffer.destroy();
    this.retired.length = 0;
    this.stats.begin();
    this.draws.length = 0;
    this.visibleDraws.length = 0;
    try {
      if (!scene) {
        this.post.releaseTarget();
        return false;
      }
      validateRenderSettings(scene);
      fillLightingData(scene, this.lightingData);
      this.atlas.update(scene, aspect);
      this.ensureShadow(scene);
      this.ensureEnvironment(scene);
      this.prepareScene(scene, aspect);
      this.frustum.setFromMatrix(scene.camera3D.updateMatrix(aspect));
      for (const object of scene.objects) {
        if (
          !(object instanceof Mesh) ||
          !object.worldVisible ||
          object.material.texture.destroyed ||
          object.geometry.indices.length === 0 ||
          (object instanceof InstancedMesh && object.count === 0)
        )
          continue;
        if (
          object.material.opacity <= 0 &&
          (!(object.material instanceof PBRMaterial) ||
            object.material.alphaMode === 'BLEND')
        )
          continue;
        const inView = object.isInFrustum(this.frustum);
        this.stats.meshes++;
        if (!inView) this.stats.culled++;
        object.updateDeformation();
        object.updateWorldMatrix();
        const geometry = this.cacheGeometry(object.geometry);
        const mesh = this.cacheMesh(object);
        geometry.seen = mesh.seen = this.frame;
        this.updateMesh(object, mesh);
        this.draws.push(object);
        if (inView) this.visibleDraws.push(object);
      }
      this.drawSorter.sort(this.visibleDraws, scene.camera3D.position);
      if (scene.shadows.enabled) this.renderShadows(encoder);
      const postEnabled = scene.postProcessing.enabled;
      if (!postEnabled) this.post.releaseTarget();
      const background = activeBackground(scene);
      if (!this.draws.length && !postEnabled && !background) return false;
      this.ensureDepth(width, height);
      const target = postEnabled ? this.post.target(width, height) : view;
      if (this.sampleCount > 1) {
        // Multisampled color resolves into the canvas (or HDR target) at pass end.
        this.colorAttachment.view = this.ensureMultisample(
          postEnabled ? 'rgba16float' : this.format,
          width,
          height,
        );
        this.colorAttachment.resolveTarget = target;
        this.colorAttachment.storeOp = 'discard';
      } else {
        this.colorAttachment.view = target;
        this.colorAttachment.storeOp = 'store';
      }
      this.colorAttachment.clearValue = postEnabled
        ? this.decodeClear(clearValue)
        : clearValue;
      this.depthAttachment.view = this.depthView;
      const pass = encoder.beginRenderPass(this.renderPassDescriptor);
      try {
        pass.setViewport(0, 0, width, height, 0, 1);
        pass.setBindGroup(0, this.sceneBindGroup);
        if (background) {
          pass.setPipeline(
            postEnabled ? this.skyHdrPipeline : this.skyPipeline,
          );
          pass.draw(3);
        }
        pass.setPipeline(postEnabled ? this.hdrPipeline : this.pipeline);
        for (const object of this.visibleDraws) {
          this.drawMesh(pass, object);
          this.stats.draw(
            object.geometry.indices.length,
            object instanceof InstancedMesh ? object.count : 1,
          );
        }
      } finally {
        pass.end();
      }
      if (postEnabled) this.post.render(encoder, view, scene.postProcessing);
      return true;
    } finally {
      this.colorAttachment.view = undefined;
      this.colorAttachment.resolveTarget = undefined;
      this.depthAttachment.view = undefined;
      this.shadowAttachment.view = undefined;
      this.draws.length = 0;
      this.visibleDraws.length = 0;
      this.releaseUnused();
    }
  }

  private createSceneGroup(view: GPUTextureView): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.sceneLayout,
      entries: [
        { binding: 0, resource: { buffer: this.sceneBuffer } },
        { binding: 1, resource: view },
        { binding: 2, resource: this.environmentView },
        { binding: 3, resource: this.environmentSampler },
        { binding: 4, resource: this.backgroundView },
        { binding: 5, resource: { buffer: this.shadowBuffer } },
      ],
    });
  }

  private ensureShadow(scene: Scene): void {
    if (!scene.shadows.enabled) {
      if (this.shadowTexture) {
        this.shadowTexture.destroy();
        this.shadowTexture = undefined;
        this.shadowView = undefined;
        this.sceneBindGroup = this.shadowSceneBindGroup;
      }
      return;
    }
    const size = this.atlas.size;
    if (size > this.device.limits.maxTextureDimension2D)
      throw new GraphicsError(
        `WebGPU shadow map size ${size} exceeds this device's texture limit.`,
      );
    if (this.shadowTexture && this.shadowSize === size) return;
    this.shadowTexture?.destroy();
    this.shadowTexture = undefined;
    this.shadowView = undefined;
    const texture = this.device.createTexture({
      size: [size, size],
      format: 'depth32float',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    try {
      const view = texture.createView();
      this.sceneBindGroup = this.createSceneGroup(view);
      this.shadowTexture = texture;
      this.shadowView = view;
      this.shadowSize = size;
    } catch (error) {
      texture.destroy();
      throw error;
    }
  }

  private prepareScene(scene: Scene, aspect: number): void {
    const data = this.sceneData;
    data.set(scene.camera3D.updateMatrix(aspect).elements, 0);
    data[16] = scene.camera3D.position.x;
    data[17] = scene.camera3D.position.y;
    data[18] = scene.camera3D.position.z;
    data.set(this.lightingData, 20);
    data[30] = scene.postProcessing.enabled ? 1 : 0;
    this.invViewProjection.copy(scene.camera3D.updateMatrix(aspect)).invert();
    data.set(this.invViewProjection.elements, 224);
    fillEnvironmentData(scene, this.environmentData);
    data.set(this.environmentData, 240);
    fillFogData(scene, this.fogData);
    data.set(this.fogData, 280);
    this.device.queue.writeBuffer(this.sceneBuffer, 0, data);
    this.device.queue.writeBuffer(this.shadowBuffer, 0, this.atlas.data);
    if (this.atlas.count)
      this.device.queue.writeBuffer(
        this.projectionBuffer,
        0,
        this.atlas.projections,
        0,
        this.atlas.count * 64,
      );
  }

  /** Uploads (or reuses) GPU copies of the active maps and rebinds the scene groups on change. */
  private ensureEnvironment(scene: Scene): void {
    const environment = activeEnvironment(scene);
    const background = activeBackground(scene);
    const lightingView = environment
      ? this.uploadEnvironment(environment)
      : this.dummyEnvironmentView;
    const backgroundView = background
      ? this.uploadEnvironment(background)
      : this.dummyEnvironmentView;
    if (
      lightingView === this.environmentView &&
      backgroundView === this.backgroundView
    )
      return;
    this.environmentView = lightingView;
    this.backgroundView = backgroundView;
    this.shadowSceneBindGroup = this.createSceneGroup(this.emptyShadowView);
    this.sceneBindGroup = this.createSceneGroup(
      this.shadowView ?? this.emptyShadowView,
    );
  }

  private uploadEnvironment(map: EnvironmentMap): GPUTextureView {
    let entry = this.environments.get(map);
    if (!entry) {
      const base = map.levelSizes[0];
      if (
        base.width > this.device.limits.maxTextureDimension2D ||
        base.height > this.device.limits.maxTextureDimension2D
      )
        throw new GraphicsError(
          `WebGPU environment ${base.width}x${base.height} exceeds this device's texture limit.`,
        );
      const texture = this.device.createTexture({
        size: [base.width, base.height],
        mipLevelCount: map.mipCount,
        format: 'rgba16float',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      try {
        for (let level = 0; level < map.mipCount; level++) {
          const size = map.levelSizes[level];
          this.device.queue.writeTexture(
            { texture, mipLevel: level },
            map.levels[level],
            { bytesPerRow: size.width * 8 },
            [size.width, size.height],
          );
        }
        entry = { texture, view: texture.createView(), seen: 0 };
      } catch (error) {
        texture.destroy();
        throw error;
      }
      this.environments.set(map, entry);
    }
    entry.seen = this.frame;
    return entry.view;
  }

  private renderShadows(encoder: GPUCommandEncoder): void {
    this.shadowAttachment.view = this.shadowView;
    const pass = encoder.beginRenderPass(this.shadowDescriptor);
    try {
      pass.setPipeline(this.shadowPipeline);
      pass.setBindGroup(0, this.shadowSceneBindGroup);
      const tileSize = this.atlas.size / this.atlas.grid;
      for (let tile = 0; tile < this.atlas.count; tile++) {
        const x = (tile % this.atlas.grid) * tileSize;
        const y = Math.floor(tile / this.atlas.grid) * tileSize;
        pass.setViewport(x, y, tileSize, tileSize, 0, 1);
        pass.setScissorRect(x, y, tileSize, tileSize);
        this.projectionOffsets[0] = tile * 256;
        pass.setBindGroup(3, this.projectionGroup, this.projectionOffsets);
        for (const object of this.draws)
          if (object.castShadow) {
            this.drawMesh(pass, object);
            this.stats.shadowDrawCalls++;
          }
      }
    } finally {
      pass.end();
      this.shadowAttachment.view = undefined;
    }
  }

  private drawMesh(pass: GPURenderPassEncoder, object: Mesh): void {
    const geometry = this.geometries.get(object.geometry)!;
    const mesh = this.meshes.get(object)!;
    pass.setBindGroup(1, mesh.bindGroup);
    pass.setBindGroup(2, mesh.materialGroup);
    const instances = object instanceof InstancedMesh ? object.count : 1;
    pass.setVertexBuffer(0, geometry.vertex);
    pass.setVertexBuffer(1, mesh.instance);
    pass.setVertexBuffer(2, mesh.instanceColors ?? this.white(instances));
    pass.setVertexBuffer(
      3,
      geometry.colors ?? this.white(object.geometry.vertices.length / 8),
    );
    pass.setIndexBuffer(geometry.index, 'uint32');
    pass.drawIndexed(object.geometry.indices.length, instances);
  }

  /** White RGBA storage also serves the RGB instance layout (every component is one). */
  private white(count: number): GPUBuffer {
    if (count <= this.whiteCapacity) return this.whiteBuffer;
    // Grow geometrically so a scene that adds meshes one at a time does not reallocate each time.
    const capacity = Math.max(count, this.whiteCapacity * 2, 1024);
    this.retired.push(this.whiteBuffer);
    this.whiteBuffer = this.device.createBuffer({
      size: capacity * 16,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(
      this.whiteBuffer,
      0,
      new Float32Array(capacity * 4).fill(1),
    );
    this.whiteCapacity = capacity;
    return this.whiteBuffer;
  }

  /** Creates or refreshes a vertex-step buffer holding `source`, which may change between frames. */
  private colorBuffer(
    current: GPUBuffer | undefined,
    source: Float32Array,
  ): GPUBuffer {
    if (current && current.size === source.byteLength) return current;
    current?.destroy();
    return this.device.createBuffer({
      size: source.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }

  private decodeClear(value: GPUColor): GPUColorDict {
    const components = this.clearComponents;
    if ('r' in value) {
      components[0] = value.r;
      components[1] = value.g;
      components[2] = value.b;
      components[3] = value.a;
    } else {
      let i = 0;
      for (const component of value) components[i++] = component;
    }
    for (let i = 0; i < 3; i++) {
      const v = components[i];
      components[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }
    this.linearClear.r = components[0];
    this.linearClear.g = components[1];
    this.linearClear.b = components[2];
    this.linearClear.a = components[3];
    return this.linearClear;
  }

  private ensureMultisample(
    format: GPUTextureFormat,
    width: number,
    height: number,
  ): GPUTextureView {
    if (
      this.msaaView &&
      this.msaaFormat === format &&
      this.msaaWidth === width &&
      this.msaaHeight === height
    )
      return this.msaaView;
    this.msaaTexture?.destroy();
    this.msaaTexture = this.device.createTexture({
      size: [width, height],
      format,
      sampleCount: this.sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.msaaView = this.msaaTexture.createView();
    this.msaaFormat = format;
    this.msaaWidth = width;
    this.msaaHeight = height;
    return this.msaaView;
  }

  private ensureDepth(width: number, height: number): void {
    if (
      this.depthTexture &&
      this.depthWidth === width &&
      this.depthHeight === height
    )
      return;
    this.depthTexture?.destroy();
    this.depthTexture = this.device.createTexture({
      size: [width, height],
      format: 'depth24plus',
      sampleCount: this.sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthView = this.depthTexture.createView();
    this.depthWidth = width;
    this.depthHeight = height;
  }

  private cacheGeometry(geometry: Geometry): CachedGeometry {
    const existing = this.geometries.get(geometry);
    if (existing) {
      if (existing.version !== geometry.version) {
        this.device.queue.writeBuffer(existing.vertex, 0, geometry.vertices);
        this.syncGeometryColors(existing, geometry);
        existing.version = geometry.version;
      }
      return existing;
    }
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
        const entry: CachedGeometry = {
          vertex,
          index,
          colors: undefined,
          version: geometry.version,
          seen: this.frame,
        };
        try {
          this.syncGeometryColors(entry, geometry);
        } catch (error) {
          entry.colors?.destroy();
          throw error;
        }
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

  private syncGeometryColors(entry: CachedGeometry, geometry: Geometry): void {
    const colors = geometry.colors;
    if (!colors) {
      entry.colors?.destroy();
      entry.colors = undefined;
    } else {
      entry.colors = this.colorBuffer(entry.colors, colors);
      this.device.queue.writeBuffer(entry.colors, 0, colors);
    }
  }

  private cacheMesh(object: Mesh): CachedMesh {
    const material = object.material;
    const pbr = material instanceof PBRMaterial;
    const base = this.cacheTexture(material.texture, !pbr).view;
    const mr =
      pbr && material.metallicRoughnessTexture
        ? this.cacheTexture(material.metallicRoughnessTexture, false).view
        : this.whiteView;
    const normal =
      pbr && material.normalTexture
        ? this.cacheTexture(material.normalTexture, false).view
        : this.whiteView;
    const ao =
      pbr && material.occlusionTexture
        ? this.cacheTexture(material.occlusionTexture, false).view
        : this.whiteView;
    const emissive =
      pbr && material.emissiveTexture
        ? this.cacheTexture(material.emissiveTexture, false).view
        : this.whiteView;
    const existing = this.meshes.get(object);
    if (existing) return existing;
    const uniform = this.device.createBuffer({
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    let instance = this.identityBuffer;
    let instanceColors: GPUBuffer | undefined;
    try {
      if (object instanceof InstancedMesh) {
        instance = this.device.createBuffer({
          size: object.matrices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(instance, 0, object.matrices);
        if (object.colors) {
          instanceColors = this.colorBuffer(undefined, object.colors);
          this.device.queue.writeBuffer(instanceColors, 0, object.colors);
        }
      }
      const bindGroup = this.device.createBindGroup({
        layout: this.meshLayout,
        entries: [{ binding: 0, resource: { buffer: uniform } }],
      });
      const materialGroup = this.device.createBindGroup({
        layout: this.materialLayout,
        entries: [
          { binding: 0, resource: base },
          {
            binding: 1,
            resource: pbr
              ? this.cacheSampler(material.textureSampler)
              : this.sampler,
          },
          { binding: 2, resource: mr },
          { binding: 3, resource: normal },
          { binding: 4, resource: ao },
          { binding: 5, resource: emissive },
          {
            binding: 6,
            resource: pbr
              ? this.cacheSampler(material.metallicRoughnessSampler)
              : this.sampler,
          },
          {
            binding: 7,
            resource: pbr
              ? this.cacheSampler(material.normalSampler)
              : this.sampler,
          },
          {
            binding: 8,
            resource: pbr
              ? this.cacheSampler(material.occlusionSampler)
              : this.sampler,
          },
          {
            binding: 9,
            resource: pbr
              ? this.cacheSampler(material.emissiveSampler)
              : this.sampler,
          },
        ],
      });
      const entry = {
        uniform,
        bindGroup,
        materialGroup,
        instance,
        instanceVersion: object instanceof InstancedMesh ? object.version : 0,
        instanceColors,
        instanceColorVersion:
          object instanceof InstancedMesh ? object.colorVersion : 0,
        data: new Float32Array(36),
        seen: this.frame,
      };
      this.meshes.set(object, entry);
      return entry;
    } catch (error) {
      uniform.destroy();
      instanceColors?.destroy();
      if (instance !== this.identityBuffer) instance.destroy();
      throw error;
    }
  }

  private cacheSampler(options: TextureSamplerOptions | undefined): GPUSampler {
    const minFilter = options?.minFilter ?? 'linear';
    const magFilter = options?.magFilter ?? 'linear';
    const addressModeU = options?.addressModeU ?? 'clamp-to-edge';
    const addressModeV = options?.addressModeV ?? 'clamp-to-edge';
    const key =
      (minFilter === 'nearest' ? 1 : 0) |
      (magFilter === 'nearest' ? 2 : 0) |
      (addressModeU === 'repeat'
        ? 4
        : addressModeU === 'mirror-repeat'
          ? 8
          : 0) |
      (addressModeV === 'repeat'
        ? 16
        : addressModeV === 'mirror-repeat'
          ? 32
          : 0);
    if (key === 0) return this.sampler;
    const existing = this.samplers.get(key);
    if (existing) return existing;
    const sampler = this.device.createSampler({
      minFilter,
      magFilter,
      addressModeU,
      addressModeV,
    });
    this.samplers.set(key, sampler);
    return sampler;
  }

  private cacheTexture(
    texture: Texture,
    premultiplied: boolean,
  ): CachedTexture {
    if (texture.destroyed)
      throw new GraphicsError('WebGPU material map has been destroyed.');
    const cache = premultiplied ? this.premultipliedTextures : this.textures;
    const existing = cache.get(texture);
    if (existing) {
      existing.seen = this.frame;
      return existing;
    }
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
        { texture: resource, premultipliedAlpha: premultiplied },
        [width, height],
      );
      const entry = { resource, view: resource.createView(), seen: this.frame };
      cache.set(texture, entry);
      return entry;
    } catch (error) {
      resource.destroy();
      throw error;
    }
  }

  private updateMesh(object: Mesh, mesh: CachedMesh): void {
    const material = object.material;
    const data = mesh.data;
    data.set(object.worldMatrix.elements, 0);
    data[16] = material.color[0];
    data[17] = material.color[1];
    data[18] = material.color[2];
    data[19] = material.opacity;
    if (material instanceof PBRMaterial) {
      data[20] = 1;
      data[21] = material.metallic;
      data[22] = material.roughness;
      data[23] = material.normalScale;
      data[24] = material.emissive[0];
      data[25] = material.emissive[1];
      data[26] = material.emissive[2];
      data[27] = material.occlusionStrength;
      data[28] = material.metallicRoughnessTexture ? 1 : 0;
      data[29] = material.normalTexture ? 1 : 0;
      data[30] = material.occlusionTexture ? 1 : 0;
      data[31] = material.emissiveTexture ? 1 : 0;
      data[32] = material.alphaCutoff;
      data[33] = material.doubleSided ? 1 : 0;
      data[35] =
        material.alphaMode === 'OPAQUE'
          ? 0
          : material.alphaMode === 'MASK'
            ? 1
            : 2;
    } else {
      data[20] = 0;
      data[32] = 0;
      data[33] = 1;
    }
    data[34] = object.receiveShadow ? 1 : 0;
    if (
      object instanceof InstancedMesh &&
      mesh.instanceVersion !== object.version
    ) {
      this.device.queue.writeBuffer(mesh.instance, 0, object.matrices);
      mesh.instanceVersion = object.version;
    }
    if (
      object instanceof InstancedMesh &&
      object.colors &&
      (mesh.instanceColors === undefined ||
        mesh.instanceColorVersion !== object.colorVersion)
    ) {
      mesh.instanceColors = this.colorBuffer(
        mesh.instanceColors,
        object.colors,
      );
      this.device.queue.writeBuffer(mesh.instanceColors, 0, object.colors);
      mesh.instanceColorVersion = object.colorVersion;
    }
    this.device.queue.writeBuffer(mesh.uniform, 0, data);
  }

  private releaseUnused(): void {
    for (const [geometry, entry] of this.geometries)
      if (entry.seen !== this.frame) {
        entry.vertex.destroy();
        entry.index.destroy();
        entry.colors?.destroy();
        this.geometries.delete(geometry);
      }
    for (const [object, entry] of this.meshes)
      if (entry.seen !== this.frame) {
        entry.uniform.destroy();
        entry.instanceColors?.destroy();
        if (entry.instance !== this.identityBuffer) entry.instance.destroy();
        this.meshes.delete(object);
      }
    for (const [map, entry] of this.environments)
      if (map.destroyed || entry.seen !== this.frame) {
        entry.texture.destroy();
        this.environments.delete(map);
      }
    this.releaseUnusedTextures(this.textures);
    this.releaseUnusedTextures(this.premultipliedTextures);
  }

  private releaseUnusedTextures(cache: Map<Texture, CachedTexture>): void {
    for (const [texture, entry] of cache)
      if (texture.destroyed || entry.seen !== this.frame) {
        entry.resource.destroy();
        cache.delete(texture);
      }
  }

  destroy(): void {
    this.post.destroy();
    this.depthTexture?.destroy();
    this.msaaTexture?.destroy();
    this.msaaTexture = undefined;
    this.msaaView = undefined;
    this.depthTexture = undefined;
    this.depthView = undefined;
    this.shadowTexture?.destroy();
    this.shadowTexture = undefined;
    this.shadowView = undefined;
    this.sceneBuffer.destroy();
    this.shadowBuffer.destroy();
    this.projectionBuffer.destroy();
    this.whiteTexture.destroy();
    this.emptyShadow.destroy();
    this.identityBuffer.destroy();
    this.whiteBuffer.destroy();
    for (const buffer of this.retired.splice(0)) buffer.destroy();
    for (const entry of this.geometries.values()) {
      entry.vertex.destroy();
      entry.index.destroy();
      entry.colors?.destroy();
    }
    this.geometries.clear();
    for (const entry of this.meshes.values()) {
      entry.uniform.destroy();
      entry.instanceColors?.destroy();
      if (entry.instance !== this.identityBuffer) entry.instance.destroy();
    }
    this.meshes.clear();
    for (const entry of this.textures.values()) entry.resource.destroy();
    for (const entry of this.environments.values()) entry.texture.destroy();
    this.environments.clear();
    this.dummyEnvironment.destroy();
    for (const entry of this.premultipliedTextures.values())
      entry.resource.destroy();
    this.textures.clear();
    this.premultipliedTextures.clear();
    this.draws.length = 0;
    this.samplers.clear();
  }
}
