import type {
  VisibleInstances,
  RenderVisibilityOptions,
} from '../../core/src/render-visibility.js';
import {
  RenderVisibilityCache,
  RenderVisibilitySet,
} from '../../core/src/render-visibility.js';
import { WebGPUOcclusionBackend } from './webgpu-occlusion.js';
import { WebGPUParticles3D } from './webgpu-particles3d.js';
import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import {
  NativeMaterial3D,
  nativeMaterialSources,
} from '../../core/src/native-material3d.js';
import { nativeMeshWGSL } from './webgpu-mesh-shader.js';
import { beginTimedRenderPass, beginTimedComputePass } from './gpu-timing.js';
import type { Scene } from '../../core/src/scene.js';
import { Frustum } from '../../core/src/frustum.js';
import { DrawSorter, isBlended } from '../../core/src/draw-order.js';
import { Mesh, materialBaseTexture } from '../../core/src/mesh.js';
import { PBRMaterial, pbrTextureSources } from '../../core/src/pbr-material.js';
import type { TextureSamplerOptions } from '../../core/src/texture-sampler.js';
import { InstancedMesh } from '../../core/src/instanced-mesh.js';
import { SkinnedMesh } from '../../core/src/skinned-mesh.js';
import {
  activeBackground,
  activeEnvironment,
  fillProbeBlendData,
  selectReflectionProbes,
  fillFogData,
  fillLightingData,
  validateRenderSettings,
} from '../../core/src/render-data.js';
import type { EnvironmentMap } from '../../core/src/environment.js';
import { ShadowAtlas } from '../../core/src/shadow-atlas.js';
import {
  FOG_FLOAT_COUNT,
  LIGHTING_FLOAT_COUNT,
  nativeMaterial3DLimits,
  MATERIAL_UV_FLOAT_COUNT,
  REFLECTION_FLOAT_COUNT,
} from '../../../src/data/rendering.js';
import { fillMaterialUV } from './material-uv.js';
import { ShadowCache } from './shadow-cache.js';
import { validateNativeMaterialGPU } from './native-material-limits.js';
import { sheenDirectionalAlbedo } from '../../../src/data/sheen.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { Texture2DSource } from '../../assets/src/index.js';
import type { MaterialTexture } from '../../assets/src/texture2d.js';
import { NativeTexture2D } from '../../assets/src/native-texture.js';
import {
  nativeUploadFormat,
  uploadNativeWebGPU,
  validateNativeWebGPU,
} from './native-texture-upload.js';
import { Matrix4 } from '../../math/src/index.js';
import { WebGPUInitializationError, GraphicsError } from './errors.js';
import { webgpuMeshShader } from './webgpu-mesh-shader.js';
import { WebGPUPostPipeline } from './webgpu-post-pipeline.js';
import type { FrameStats } from './render-stats.js';
import { fillOpticalMapSettings } from './optical-maps.js';
import { opticalPackWGSL } from './optical-pack-shaders.js';
import { WebGPUOIT } from './webgpu-oit.js';
import type {
  ReflectionProbe,
  ReflectionProbeCaptureOptions,
} from '../../core/src/reflection-probe.js';
import {
  captureConfiguration,
  encodeProbeFaces,
  halfFloat,
  capturedEnvironment,
} from './reflection-capture.js';
import { packProbeTextures } from './probe-texture-array.js';
import { TemporalPostState } from './temporal-post.js';
import { WebGPUTemporalPipeline } from './webgpu-temporal-pipeline.js';
import type { NativeResidency, ResidencyAllocation } from './residency.js';
const emptyGpuEmitters: readonly GPUParticleEmitter3D[] = [];
const emptyMeshes: readonly Mesh[] = [];
const meshUniformFloats =
  76 +
  REFLECTION_FLOAT_COUNT +
  nativeMaterial3DLimits.uniformFloats +
  4 +
  MATERIAL_UV_FLOAT_COUNT;

interface CachedGeometry {
  allocation: ResidencyAllocation;
  vertex: GPUBuffer;
  index: GPUBuffer;
  /** Per-vertex RGB, or undefined when the geometry has none (a shared white buffer is bound). */
  colors: GPUBuffer | undefined;
  uvs1: GPUBuffer | undefined;
  tangents: GPUBuffer;
  version: number;
  seen: number;
}
interface CachedMesh {
  allocation: ResidencyAllocation;
  textureEpoch: number;
  uniform: GPUBuffer;
  bindGroup: GPUBindGroup;
  materialGroup: GPUBindGroup;
  environment: EnvironmentMap | undefined;
  instance: GPUBuffer;
  instanceVersion: number;
  /** Per-instance RGB, or undefined while the InstancedMesh has no colors. */
  instanceColors: GPUBuffer | undefined;
  instanceColorVersion: number;
  palette: GPUBuffer | undefined;
  influences: GPUBuffer | undefined;
  paletteVersion: number;
  data: Float32Array;
  seen: number;
  sceneBuffer: GPUBuffer;
  sceneGroup?: GPUBindGroup;
  sceneShadow?: GPUTextureView;
  sceneRefraction?: GPUTextureView;
  sceneEnvironment?: GPUTextureView;
  visibleInstance?: GPUBuffer;
  visibleColors?: GPUBuffer;
  visibilityVersion?: number;
  visibilityPayload?: VisibleInstances;
}
interface CachedTexture {
  allocation: ResidencyAllocation;
  resource: GPUTexture;
  view: GPUTextureView;
  seen: number;
  version?: number;
  sourceVersions?: readonly [number, number];
}
interface CachedEnvironment {
  allocation: ResidencyAllocation;
  texture: GPUTexture;
  view: GPUTextureView;
  seen: number;
  group?: GPUBindGroup;
  shadow?: GPUTextureView;
  refraction?: GPUTextureView;
}

/** Persistent 3D resources, native joint palettes and hardware instances. */
export class WebGPUMeshPipeline {
  private readonly geometries = new Map<Geometry, CachedGeometry>();
  private textureEpoch = 0;
  private readonly nativeMaterials = new Map<
    NativeMaterial3D,
    { pipelines: readonly GPURenderPipeline[]; unsubscribe: () => void }
  >();
  private readonly pendingMaterials = new Map<
    NativeMaterial3D,
    Promise<void>
  >();
  private destroyed = false;
  private readonly visibilityCache = new RenderVisibilityCache();
  readonly visibility = new RenderVisibilitySet();
  private readonly visibilityOptions: RenderVisibilityOptions = {};
  private readonly depthTextureVersions = new WeakMap<
    Texture2DSource,
    number
  >();
  private depthRevision = 0;
  private proofWidth = 0;
  private proofHeight = 0;
  private proofMode = -1;
  private readonly gathered = new Set<Mesh>();
  private occlusion: WebGPUOcclusionBackend | undefined;
  private readonly blendedDraw = (mesh: Mesh): boolean => {
    if (mesh.material instanceof PBRMaterial && mesh.material.alphaToCoverage)
      return false;
    return (
      isBlended(mesh) || (this.visibility.entries.get(mesh)?.fade ?? 1) < 1
    );
  };
  private readonly meshes = new Map<Mesh, CachedMesh>();
  private readonly textures = new Map<MaterialTexture, CachedTexture>();
  private readonly premultipliedTextures = new Map<
    MaterialTexture,
    CachedTexture
  >();
  private readonly samplers = new Map<string, GPUSampler>();
  private readonly coveragePipelines = new Map<number, GPURenderPipeline>();
  private readonly draws: Mesh[] = [];
  /** Subset of `draws` inside the camera frustum; shadow casters outside still cast. */
  private readonly visibleDraws: Mesh[] = [];
  private readonly frustum = new Frustum();
  private readonly drawSorter = new DrawSorter();
  readonly stats: FrameStats;
  private readonly sceneData = new Float32Array(20 + LIGHTING_FLOAT_COUNT + 28);
  private readonly fogData = new Float32Array(FOG_FLOAT_COUNT);
  private readonly invViewProjection = new Matrix4();
  private readonly environments = new Map<EnvironmentMap, CachedEnvironment>();
  private readonly dummyEnvironment: GPUTexture;
  private readonly dummyEnvironmentView: GPUTextureView;
  private readonly dummyEnvironmentArrayView: GPUTextureView;
  private readonly selectedProbes: ReflectionProbe[] = [];
  private readonly probeMaps: (EnvironmentMap | undefined)[] = [];
  private probeTexture: GPUTexture | undefined;
  private probeAllocation: ResidencyAllocation | undefined;
  private probeMipCount = 1;
  private readonly temporalState = new TemporalPostState();
  private readonly temporal: WebGPUTemporalPipeline;
  private temporalActive = false;
  private readonly environmentSampler: GPUSampler;
  private environmentView: GPUTextureView;
  private backgroundView: GPUTextureView;
  private readonly lightingData = new Float32Array(LIGHTING_FLOAT_COUNT);
  private readonly atlas = new ShadowAtlas();
  private readonly shadowCache = new ShadowCache();
  private readonly shadowBuffer: GPUBuffer;
  private readonly sheenBuffer: GPUBuffer;
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
  private influenceBuffer: GPUBuffer | undefined;
  private influenceCapacity = 0;
  /** Replaced white buffers wait here until commands that may still bind them are submitted. */
  private readonly retired: GPUBuffer[] = [];
  private sceneBindGroup: GPUBindGroup;
  private shadowSceneBindGroup: GPUBindGroup;
  private skyBindGroup: GPUBindGroup;
  private readonly opticalTextures = new Map<PBRMaterial, CachedTexture>();
  private readonly emptyOptical: GPUTexture;
  private readonly emptyOpticalView: GPUTextureView;
  private refractionTexture: GPUTexture | undefined;
  private refractionView: GPUTextureView | undefined;
  private refractionWidth = 0;
  private refractionHeight = 0;
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
  private readonly oit: WebGPUOIT;
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
    private readonly opticalPackLayout: GPUBindGroupLayout,
    private readonly transmissionPack: GPUComputePipeline,
    private readonly thicknessPack: GPUComputePipeline,
    private readonly pipeline: GPURenderPipeline,
    private readonly hdrPipeline: GPURenderPipeline,
    private readonly oitPipeline: GPURenderPipeline,
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
    private readonly residency: NativeResidency,
    private readonly pipelineRecipes: readonly GPURenderPipelineDescriptor[],
    private readonly particles: WebGPUParticles3D,
    private readonly fadedPipeline: GPURenderPipeline,
    private readonly fadedHdrPipeline: GPURenderPipeline,
  ) {
    this.stats = post.stats;
    this.oit = new WebGPUOIT(device, sampleCount, this.stats);
    this.sceneBuffer = device.createBuffer({
      size: this.sceneData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.shadowBuffer = device.createBuffer({
      size: this.atlas.data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.sheenBuffer = device.createBuffer({
      size: sheenDirectionalAlbedo.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.sheenBuffer, 0, sheenDirectionalAlbedo);
    this.stats.upload(sheenDirectionalAlbedo.byteLength);
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
      mipmapFilter: 'linear',
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
    this.stats.upload(4);
    this.whiteView = this.whiteTexture.createView();
    this.emptyOptical = device.createTexture({
      size: [1, 1, 2],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.emptyOpticalView = this.emptyOptical.createView({
      dimension: '2d-array',
    });
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
    this.dummyEnvironmentArrayView = this.dummyEnvironment.createView({
      dimension: '2d-array',
    });
    this.environmentView = this.dummyEnvironmentArrayView;
    this.temporal = new WebGPUTemporalPipeline(device, sampleCount, this.stats);
    this.backgroundView = this.dummyEnvironmentView;
    this.identityBuffer = device.createBuffer({
      size: 64,
      usage:
        GPUBufferUsage.VERTEX |
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.identityBuffer, 0, new Matrix4().elements);
    this.stats.upload(64);
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
    this.stats.upload(this.whiteCapacity * 16);
    this.sceneBindGroup = this.createSceneGroup(this.emptyShadowView);
    this.shadowSceneBindGroup = this.sceneBindGroup;
    this.skyBindGroup = this.createSceneGroup(
      this.emptyShadowView,
      this.backgroundView,
    );
  }

  static async initialize(
    device: GPUDevice,
    format: GPUTextureFormat,
    isDestroyed: () => boolean,
    sampleCount: number,
    stats: FrameStats,
    residency: NativeResidency,
  ): Promise<WebGPUMeshPipeline> {
    const module = device.createShaderModule({ code: webgpuMeshShader });
    const packModule = device.createShaderModule({ code: opticalPackWGSL });
    const [compilation, packCompilation] = await Promise.all([
      module.getCompilationInfo(),
      packModule.getCompilationInfo(),
    ]);
    if (isDestroyed())
      throw new GraphicsError(
        'WebGPU renderer was destroyed during initialization.',
      );
    const errors = [
      ...compilation.messages,
      ...packCompilation.messages,
    ].filter((message) => message.type === 'error');
    if (errors.length)
      throw new WebGPUInitializationError(
        `WebGPU 3D shader compilation failed: ${errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('; ')}`,
      );
    const opticalPackLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: {} },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            access: 'write-only',
            format: 'rgba8unorm',
            viewDimension: '2d-array',
          },
        },
      ],
    });
    const packLayout = device.createPipelineLayout({
      bindGroupLayouts: [opticalPackLayout],
    });
    const transmissionPack = device.createComputePipeline({
      layout: packLayout,
      compute: { module: packModule, entryPoint: 'transmission' },
    });
    const thicknessPack = device.createComputePipeline({
      layout: packLayout,
      compute: { module: packModule, entryPoint: 'thickness' },
    });
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
          texture: { sampleType: 'float', viewDimension: '2d-array' },
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
        {
          binding: 6,
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
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });
    const materialLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 5,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 6,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 7,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 8,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 9,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        { binding: 10, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 11, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 12, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 13, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 14, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 15, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 16, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 17, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 18, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 19, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 20, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 21, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 22, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 23, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        {
          binding: 24,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { viewDimension: '2d-array' },
        },
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
      {
        arrayStride: 64,
        attributes: [
          { shaderLocation: 9, offset: 0, format: 'uint32x4' },
          { shaderLocation: 10, offset: 16, format: 'float32x4' },
          { shaderLocation: 12, offset: 32, format: 'uint32x4' },
          { shaderLocation: 13, offset: 48, format: 'float32x4' },
        ],
      },
      {
        arrayStride: 8,
        attributes: [{ shaderLocation: 11, offset: 0, format: 'float32x2' }],
      },
      {
        arrayStride: 16,
        attributes: [{ shaderLocation: 14, offset: 0, format: 'float32x4' }],
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
    const pipelineRecipe: GPURenderPipelineDescriptor = {
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
    };
    const pipeline = device.createRenderPipeline(pipelineRecipe);
    const hdrRecipe: GPURenderPipelineDescriptor = {
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
    };
    const hdrPipeline = device.createRenderPipeline(hdrRecipe);
    const additive: GPUBlendComponent = { srcFactor: 'one', dstFactor: 'one' };
    const reveal: GPUBlendComponent = {
      srcFactor: 'zero',
      dstFactor: 'one-minus-src-alpha',
    };
    const oitRecipe: GPURenderPipelineDescriptor = {
      layout,
      vertex: { module, entryPoint: 'vertexMain', buffers },
      fragment: {
        module,
        entryPoint: 'oitFragment',
        targets: [
          {
            format: 'rgba16float',
            blend: { color: additive, alpha: additive },
          },
          { format: 'r8unorm', blend: { color: reveal, alpha: reveal } },
        ],
      },
      primitive: { topology: 'triangle-list' },
      multisample: { count: sampleCount },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less',
      },
    };
    const oitPipeline = device.createRenderPipeline(oitRecipe);
    const shadowRecipe: GPURenderPipelineDescriptor = {
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
    };
    const shadowPipeline = device.createRenderPipeline(shadowRecipe);
    const fadedRecipe: GPURenderPipelineDescriptor = {
      ...pipelineRecipe,
      depthStencil: {
        ...pipelineRecipe.depthStencil!,
        depthWriteEnabled: false,
      },
    };
    const fadedHdrRecipe: GPURenderPipelineDescriptor = {
      ...hdrRecipe,
      depthStencil: { ...hdrRecipe.depthStencil!, depthWriteEnabled: false },
    };
    const fadedPipeline = device.createRenderPipeline(fadedRecipe);
    const fadedHdrPipeline = device.createRenderPipeline(fadedHdrRecipe);
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
      sampleCount,
      stats,
    );
    let particles: WebGPUParticles3D | undefined;
    try {
      particles = await WebGPUParticles3D.initialize(
        device,
        format,
        sampleCount,
        stats,
      );
      return new WebGPUMeshPipeline(
        device,
        opticalPackLayout,
        transmissionPack,
        thicknessPack,
        pipeline,
        hdrPipeline,
        oitPipeline,
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
        residency,
        [
          pipelineRecipe,
          hdrRecipe,
          oitRecipe,
          shadowRecipe,
          fadedRecipe,
          fadedHdrRecipe,
        ],
        particles,
        fadedPipeline,
        fadedHdrPipeline,
      );
    } catch (error) {
      particles?.destroy();
      post.destroy();
      throw error;
    }
  }

  resize(width: number, height: number): void {
    this.oit.resize(width, height);
    this.temporal.resize(width, height);
    if (
      this.depthTexture &&
      (this.depthWidth !== width || this.depthHeight !== height)
    ) {
      this.depthTexture.destroy();
      this.stats.target(
        -this.depthWidth * this.depthHeight * 4 * this.sampleCount,
      );
      this.depthTexture = undefined;
      this.depthView = undefined;
    }
    if (
      this.msaaTexture &&
      (this.msaaWidth !== width || this.msaaHeight !== height)
    ) {
      this.msaaTexture.destroy();
      this.stats.target(
        -this.msaaWidth *
          this.msaaHeight *
          (this.msaaFormat === 'rgba16float' ? 8 : 4) *
          this.sampleCount,
      );
      this.msaaTexture = undefined;
      this.msaaView = undefined;
    }
    if (
      this.refractionTexture &&
      (this.refractionWidth !== width || this.refractionHeight !== height)
    )
      this.releaseRefraction();
    this.post.resize(width, height);
  }

  private ensureRefraction(width: number, height: number): void {
    if (
      this.refractionTexture &&
      this.refractionWidth === width &&
      this.refractionHeight === height
    )
      return;
    this.refractionTexture?.destroy();
    if (this.refractionTexture)
      this.stats.target(-this.refractionWidth * this.refractionHeight * 8);
    this.refractionTexture = undefined;
    this.refractionView = undefined;
    this.refractionTexture = this.device.createTexture({
      size: [width, height],
      format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.stats.target(width * height * 8);
    this.refractionWidth = width;
    this.refractionHeight = height;
    this.refractionView = this.refractionTexture.createView();
    this.sceneBindGroup = this.createSceneGroup(
      this.shadowView ?? this.emptyShadowView,
    );
  }

  private releaseRefraction(): void {
    if (!this.refractionTexture) return;
    this.refractionTexture.destroy();
    this.stats.target(-this.refractionWidth * this.refractionHeight * 8);
    this.refractionTexture = undefined;
    this.refractionView = undefined;
    this.sceneBindGroup = this.createSceneGroup(
      this.shadowView ?? this.emptyShadowView,
    );
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
    viewportHeight = height,
    captureTarget?: GPUTexture,
  ): boolean {
    this.frame++;
    for (const buffer of this.retired) buffer.destroy();
    this.retired.length = 0;
    this.draws.length = 0;
    this.visibleDraws.length = 0;
    try {
      if (!scene?.has3DContent) {
        this.visibilityCache.clear();
        this.visibility.color.length = this.visibility.shadows.length = 0;
        this.visibility.entries.clear();
        this.visibility.occlusionCandidates.length = 0;
        this.gathered.clear();
        this.occlusion?.clear();
        this.post.releaseTarget();
        this.oit.release();
        if (this.depthTexture) {
          this.depthTexture.destroy();
          this.stats.target(
            -this.depthWidth * this.depthHeight * 4 * this.sampleCount,
          );
          this.depthTexture = undefined;
          this.depthView = undefined;
        }
        if (this.msaaTexture) {
          this.msaaTexture.destroy();
          this.stats.target(
            -this.msaaWidth *
              this.msaaHeight *
              (this.msaaFormat === 'rgba16float' ? 8 : 4) *
              this.sampleCount,
          );
          this.msaaTexture = undefined;
          this.msaaView = undefined;
        }
        if (this.shadowTexture) {
          this.shadowTexture.destroy();
          this.stats.target(-this.shadowSize * this.shadowSize * 4);
          this.shadowTexture = undefined;
          this.shadowView = undefined;
          this.sceneBindGroup = this.shadowSceneBindGroup;
        }
        this.releaseRefraction();
        if (
          this.environmentView !== this.dummyEnvironmentArrayView ||
          this.backgroundView !== this.dummyEnvironmentView
        ) {
          this.probeAllocation?.destroy();
          this.environmentView = this.dummyEnvironmentArrayView;
          this.backgroundView = this.dummyEnvironmentView;
          this.shadowSceneBindGroup = this.createSceneGroup(
            this.emptyShadowView,
            this.dummyEnvironmentView,
          );
          this.sceneBindGroup = this.skyBindGroup = this.shadowSceneBindGroup;
        }
        this.temporal.releaseTarget();
        this.temporalState.invalidate();
        return false;
      }
      validateRenderSettings(scene);
      scene.lightSelection.update(scene);
      fillLightingData(scene, this.lightingData, scene.lightSelection);
      this.atlas.update(scene, aspect);
      this.ensureShadow(scene);
      this.ensureEnvironment(scene);
      this.frustum.setFromMatrix(scene.camera3D.updateMatrix(aspect));
      const mode =
        (scene.postProcessing.enabled ? 1 : 0) |
        (scene.transparency === 'weighted' ? 2 : 0);
      if (
        this.proofWidth !== width ||
        this.proofHeight !== height ||
        this.proofMode !== mode
      ) {
        this.proofWidth = width;
        this.proofHeight = height;
        this.proofMode = mode;
        ++this.depthRevision;
      }
      for (const mesh of scene.renderMeshes ?? emptyMeshes) {
        if (!this.occlusion && mesh.occlusionCulled)
          this.occlusion = new WebGPUOcclusionBackend(this.device);
        const texture = materialBaseTexture(mesh.material);
        if (this.depthTextureVersions.get(texture) !== texture.version) {
          this.depthTextureVersions.set(texture, texture.version);
          ++this.depthRevision;
        }
        if (
          mesh.worldVisible &&
          mesh.material instanceof NativeMaterial3D &&
          !mesh.material.transparent
        )
          ++this.depthRevision;
      }
      const options = this.visibilityOptions;
      options.viewportHeight = viewportHeight;
      options.timeSeconds = scene.presentationTime;
      options.occlusion = this.occlusion;
      options.depthRevision = this.depthRevision;
      this.visibilityCache.collect(
        scene,
        scene.camera3D,
        this.frustum,
        this.visibility,
        options,
      );
      this.stats.meshes += this.visibility.meshChecks;
      this.stats.culled +=
        this.visibility.frustumCulled + this.visibility.occlusionCulled;
      let hasTransmission = false,
        weighted = false,
        coverage = false;
      this.gathered.clear();
      for (const object of this.visibility.color) {
        this.visibleDraws.push(object);
        this.gathered.add(object);
        if (
          object.material instanceof PBRMaterial &&
          object.material.alphaToCoverage
        ) {
          if (this.sampleCount < 2)
            throw new GraphicsError(
              'WebGPU alpha-to-coverage requires renderer antialiasing.',
            );
          coverage = true;
        }
        if (scene.transparency === 'weighted' && this.blendedDraw(object))
          weighted = true;
        if (
          object.material instanceof PBRMaterial &&
          object.material.transmission > 0
        )
          hasTransmission = true;
      }
      for (const object of this.visibility.shadows) {
        this.draws.push(object);
        this.gathered.add(object);
      }
      for (const object of this.gathered) {
        if (
          object.material instanceof NativeMaterial3D &&
          (object.material.destroyed ||
            !this.nativeMaterials.has(object.material))
        )
          throw new GraphicsError(
            'NativeMaterial3D must be explicitly prepared before rendering.',
          );
        if (object.material instanceof NativeMaterial3D)
          object.material.validate();
        const geometry = this.cacheGeometry(object.renderGeometry);
        const mesh = this.cacheMesh(object);
        geometry.seen = mesh.seen = this.frame;
        this.updateMesh(scene, object, mesh);
      }
      if (scene.transparency === 'sorted')
        this.drawSorter.sort(
          this.visibleDraws,
          scene.camera3D.position,
          this.blendedDraw,
        );
      if (!weighted) this.oit.release();
      if (scene.shadows.enabled)
        this.renderShadows(encoder, scene, width, height);
      const linear =
        !!captureTarget ||
        scene.postProcessing.enabled ||
        hasTransmission ||
        weighted ||
        coverage;
      this.temporalActive =
        !captureTarget &&
        scene.postProcessing.enabled &&
        (scene.postProcessing.taa || scene.postProcessing.ssr);
      if (this.temporalActive)
        this.temporalState.begin(
          scene,
          scene.camera3D,
          width,
          height,
          scene.postProcessing,
          aspect,
        );
      else {
        this.temporal.releaseTarget();
        this.temporalState.invalidate();
      }
      this.prepareScene(scene, aspect, linear);
      if (!linear) this.post.releaseTarget();
      if (hasTransmission) this.ensureRefraction(width, height);
      else this.releaseRefraction();
      const background = activeBackground(scene);
      if (
        !this.visibleDraws.length &&
        !linear &&
        !background &&
        (scene.gpuParticleEmitters?.size ?? 0) === 0
      )
        return false;
      this.ensureDepth(width, height);
      const target = linear
        ? this.post.target(width, height, this.depthView!)
        : view;
      this.colorAttachment.resolveTarget = undefined;
      if (this.sampleCount > 1) {
        this.colorAttachment.view = this.ensureMultisample(
          linear ? 'rgba16float' : this.format,
          width,
          height,
        );
        this.colorAttachment.resolveTarget = target;
      } else this.colorAttachment.view = target;
      this.colorAttachment.clearValue = linear
        ? this.decodeClear(clearValue)
        : clearValue;
      this.depthAttachment.view = this.depthView;
      const ssr = this.temporalActive && scene.postProcessing.ssr;
      const phases = hasTransmission || ssr ? 2 : 1;
      let opaqueSSR: GPUTexture | undefined;
      for (let phase = 0; phase < phases; phase++) {
        this.colorAttachment.loadOp = phase === 0 ? 'clear' : 'load';
        this.depthAttachment.depthLoadOp = phase === 0 ? 'clear' : 'load';
        this.colorAttachment.storeOp =
          this.sampleCount > 1 && phase === phases - 1 ? 'discard' : 'store';
        const pass = beginTimedRenderPass(encoder, this.renderPassDescriptor);
        try {
          pass.setViewport(0, 0, width, height, 0, 1);
          if (background && phase === 0) {
            pass.setBindGroup(0, this.skyBindGroup);
            pass.setPipeline(linear ? this.skyHdrPipeline : this.skyPipeline);
            pass.draw(3);
          }
          pass.setBindGroup(0, this.sceneBindGroup);
          pass.setPipeline(linear ? this.hdrPipeline : this.pipeline);
          for (const object of this.visibleDraws) {
            if (weighted && this.blendedDraw(object)) continue;
            if (hasTransmission || ssr) {
              const deferred =
                this.blendedDraw(object) ||
                (object.material instanceof PBRMaterial &&
                  object.material.transmission > 0);
              if (deferred !== (phase === 1)) continue;
            }
            pass.setBindGroup(
              0,
              this.reflectionGroup(this.meshes.get(object)!),
            );
            const instanceCount = this.drawMesh(pass, object, linear ? 1 : 0);
            this.stats.draw(object.geometry.indices.length, instanceCount);
          }
          if (phase === phases - 1)
            this.particles.draw(
              pass,
              scene.gpuParticleEmitters ?? emptyGpuEmitters,
              scene.camera3D,
              aspect,
              linear,
            );
        } finally {
          pass.end();
        }
        if (ssr && phase === 0) {
          opaqueSSR = this.temporal.applyOpaqueSSR(
            encoder,
            this.post.colorTexture,
            this.depthView!,
            this.temporalState,
            scene.postProcessing,
          );
          this.temporal.blit(
            encoder,
            opaqueSSR,
            this.colorAttachment.view!,
            this.sampleCount,
          );
        }
        if (hasTransmission && phase === 0) {
          if (ssr && this.sampleCount > 1) {
            encoder.copyTextureToTexture(
              { texture: opaqueSSR! },
              { texture: this.refractionTexture! },
              [width, height],
            );
          } else this.post.copyColor(encoder, this.refractionTexture!);
        }
      }
      this.occlusion?.encode(
        encoder,
        this.depthView!,
        this.temporalActive
          ? this.temporalState.currentVP
          : scene.camera3D.updateMatrix(aspect),
        this.visibility.occlusionCandidates,
        width,
        height,
        this.sampleCount,
      );
      if (weighted) {
        const pass = this.oit.begin(encoder, width, height, this.depthView!);
        try {
          pass.setPipeline(this.oitPipeline);
          for (const object of this.visibleDraws) {
            if (!this.blendedDraw(object)) continue;
            pass.setBindGroup(
              0,
              this.reflectionGroup(this.meshes.get(object)!),
            );
            const instanceCount = this.drawMesh(pass, object, 2);
            this.stats.draw(object.geometry.indices.length, instanceCount);
          }
        } finally {
          pass.end();
        }
        this.oit.resolve(encoder, target);
      }
      if (captureTarget) this.post.copyColor(encoder, captureTarget);
      else if (linear) {
        const source =
          this.temporalActive && scene.postProcessing.taa
            ? this.temporal.applyTAA(
                encoder,
                this.post.colorTexture,
                this.depthView!,
                this.temporalState,
                scene.postProcessing,
              )
            : undefined;
        this.post.render(
          encoder,
          view,
          scene.postProcessing,
          scene.camera3D,
          this.invViewProjection,
          source,
          this.depthView!,
        );
        if (this.temporalActive) this.temporalState.commit();
      }
      return true;
    } catch (error) {
      this.temporalState.invalidate();
      throw error;
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

  private createSceneGroup(
    view: GPUTextureView,
    image = this.refractionView ?? this.dummyEnvironmentView,
    environment = this.environmentView,
    sceneBuffer = this.sceneBuffer,
  ): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.sceneLayout,
      entries: [
        { binding: 0, resource: { buffer: sceneBuffer } },
        { binding: 1, resource: view },
        { binding: 2, resource: environment },
        { binding: 3, resource: this.environmentSampler },
        { binding: 4, resource: image },
        { binding: 5, resource: { buffer: this.shadowBuffer } },
        { binding: 6, resource: { buffer: this.sheenBuffer } },
      ],
    });
  }

  private ensureShadow(scene: Scene): void {
    if (!scene.shadows.enabled) {
      if (this.shadowTexture) {
        this.shadowTexture.destroy();
        this.stats.target(-this.shadowSize * this.shadowSize * 4);
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
    if (this.shadowTexture)
      this.stats.target(-this.shadowSize * this.shadowSize * 4);
    this.shadowTexture = undefined;
    this.shadowView = undefined;
    const texture = this.device.createTexture({
      size: [size, size],
      format: 'depth32float',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.stats.target(size * size * 4);
    try {
      const view = texture.createView();
      this.sceneBindGroup = this.createSceneGroup(view);
      this.shadowTexture = texture;
      this.shadowView = view;
      this.shadowSize = size;
      this.shadowCache.invalidate();
    } catch (error) {
      texture.destroy();
      this.stats.target(-size * size * 4);
      throw error;
    }
  }

  private prepareScene(scene: Scene, aspect: number, linear: boolean): void {
    const data = this.sceneData;
    const matrix = this.temporalActive
      ? this.temporalState.currentVP
      : scene.camera3D.updateMatrix(aspect);
    data.set(matrix.elements, 0);
    data[16] = scene.camera3D.position.x;
    data[17] = scene.camera3D.position.y;
    data[18] = scene.camera3D.position.z;
    data.set(this.lightingData, 20);
    data[30] = linear ? 1 : 0;
    this.invViewProjection.copy(matrix).invert();
    const tail = 20 + LIGHTING_FLOAT_COUNT;
    data.set(this.invViewProjection.elements, tail);
    data[tail + 19] = activeBackground(scene) ? scene.backgroundIntensity : 0;
    fillFogData(scene, this.fogData);
    data.set(this.fogData, tail + 20);
    this.device.queue.writeBuffer(this.sceneBuffer, 0, data);
    this.stats.upload(data.byteLength);
    for (const object of this.visibleDraws) {
      const mesh = this.meshes.get(object)!;
      fillLightingData(
        scene,
        this.lightingData,
        scene.lightSelection.selectMesh(object),
      );
      data.set(this.lightingData, 20);
      data[30] = linear ? 1 : 0;
      this.device.queue.writeBuffer(mesh.sceneBuffer, 0, data);
      this.stats.upload(data.byteLength);
    }
    this.device.queue.writeBuffer(this.shadowBuffer, 0, this.atlas.data);
    this.stats.upload(this.atlas.data.byteLength);
    if (this.atlas.count)
      this.device.queue.writeBuffer(
        this.projectionBuffer,
        0,
        this.atlas.projections,
        0,
        this.atlas.count * 64,
      );
    if (this.atlas.count) this.stats.upload(this.atlas.count * 64 * 4);
  }

  /** Uploads (or reuses) GPU copies of the active maps and rebinds the scene groups on change. */
  private ensureEnvironment(scene: Scene): void {
    const environment = activeEnvironment(scene);
    selectReflectionProbes(scene, this.selectedProbes);
    let changed = !this.probeTexture || this.probeMaps[0] !== environment;
    for (let i = 0; i < 4; i++)
      if (this.probeMaps[i + 1] !== this.selectedProbes[i]?.environment)
        changed = true;
    if (changed) {
      this.probeAllocation?.destroy();
      this.probeMaps.length = 5;
      this.probeMaps[0] = environment;
      for (let i = 0; i < 4; i++)
        this.probeMaps[i + 1] = this.selectedProbes[i]?.environment;
      const packed = packProbeTextures(this.probeMaps);
      const allocation = this.residency.textures.allocate(packed.bytes, () => {
        this.probeTexture?.destroy();
        this.probeTexture = undefined;
      });
      try {
        const texture = this.device.createTexture({
          size: [packed.width, packed.height, 5],
          mipLevelCount: packed.mipCount,
          format: 'rgba16float',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.probeTexture = texture;
        for (let level = 0; level < packed.mipCount; level++) {
          const data = packed.levels[level]!;
          this.device.queue.writeTexture(
            { texture, mipLevel: level },
            data.data,
            { bytesPerRow: data.width * 8, rowsPerImage: data.height },
            [data.width, data.height, 5],
          );
          this.stats.upload(data.data.byteLength);
        }
        allocation.retain();
        this.probeAllocation = allocation;
        this.probeMipCount = packed.mipCount;
        this.environmentView = texture.createView({ dimension: '2d-array' });
      } catch (error) {
        allocation.destroy();
        throw error;
      }
    }
    this.probeAllocation?.touch();
    const background = activeBackground(scene);
    const lightingView = this.environmentView;
    const backgroundView = background
      ? this.uploadEnvironment(background)
      : this.dummyEnvironmentView;
    if (!changed && backgroundView === this.backgroundView) return;
    this.environmentView = lightingView;
    this.backgroundView = backgroundView;
    this.shadowSceneBindGroup = this.createSceneGroup(
      this.emptyShadowView,
      this.dummyEnvironmentView,
    );
    this.sceneBindGroup = this.createSceneGroup(
      this.shadowView ?? this.emptyShadowView,
    );
    this.skyBindGroup = this.createSceneGroup(
      this.emptyShadowView,
      this.backgroundView,
    );
  }

  prepareEnvironment(map: EnvironmentMap): void {
    this.uploadEnvironment(map);
  }

  async captureReflectionProbe(
    scene: Scene,
    probe: ReflectionProbe,
    options: ReflectionProbeCaptureOptions = {},
  ): Promise<EnvironmentMap> {
    if (this.destroyed)
      throw new GraphicsError('Cannot capture on a destroyed renderer.');
    const { size } = captureConfiguration(probe, options);
    const rowBytes = Math.ceil((size * 8) / 256) * 256;
    const texture = this.device.createTexture({
      size: [size, size],
      format: 'rgba16float',
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
    });
    const buffers: GPUBuffer[] = [];
    this.stats.target(size * size * 8 + rowBytes * size * 6);
    try {
      encodeProbeFaces(scene, probe, options, () => {
        const buffer = this.device.createBuffer({
          size: rowBytes * size,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        buffers.push(buffer);
        const encoder = this.device.createCommandEncoder();
        this.render(
          scene,
          encoder,
          this.dummyEnvironmentView,
          size,
          size,
          1,
          { r: 0, g: 0, b: 0, a: 1 },
          size,
          texture,
        );
        encoder.copyTextureToBuffer(
          { texture },
          { buffer, bytesPerRow: rowBytes },
          [size, size],
        );
        // Submit before writing the next camera's uniform buffers.
        this.device.queue.submit([encoder.finish()]);
      });
      const faces: Float32Array[] = [];
      for (const buffer of buffers) {
        options.signal?.throwIfAborted();
        if (options.signal) {
          const signal = options.signal;
          let onAbort: (() => void) | undefined;
          try {
            const aborted = new Promise<never>((_resolve, reject) => {
              onAbort = () =>
                reject(
                  signal.reason ??
                    new DOMException('Capture aborted.', 'AbortError'),
                );
              signal.addEventListener('abort', onAbort, { once: true });
              if (signal.aborted) onAbort();
            });
            await Promise.race([buffer.mapAsync(GPUMapMode.READ), aborted]);
          } finally {
            if (onAbort) signal.removeEventListener('abort', onAbort);
          }
        } else await buffer.mapAsync(GPUMapMode.READ);
        if (this.destroyed || scene.destroyed)
          throw new GraphicsError(
            'Reflection capture was invalidated by renderer loss or scene disposal.',
          );
        const raw = new Uint16Array(buffer.getMappedRange());
        const face = new Float32Array(size * size * 4);
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size * 4; x++)
            face[y * size * 4 + x] = Math.max(
              0,
              halfFloat(raw[(y * rowBytes) / 2 + x]!),
            );
        faces.push(face);
        buffer.unmap();
      }
      return capturedEnvironment(size, faces, options.signal);
    } finally {
      for (const buffer of buffers) buffer.destroy();
      texture.destroy();
      this.stats.target(-size * size * 8 - rowBytes * size * 6);
    }
  }
  invalidateTemporalHistory(): void {
    this.temporalState.invalidate();
  }
  prepareGeometry(geometry: Geometry): ResidencyAllocation {
    return this.cacheGeometry(geometry).allocation;
  }
  unloadGeometry(geometry: Geometry): void {
    this.geometries.get(geometry)?.allocation.destroy();
  }
  async prepareMaterial(material: NativeMaterial3D): Promise<void> {
    material.validate();
    if (this.destroyed)
      throw new GraphicsError('Cannot prepare on a destroyed native renderer.');
    if (this.nativeMaterials.has(material)) return;
    validateNativeMaterialGPU(this.device.limits);
    const pending = this.pendingMaterials.get(material);
    if (pending) return pending;
    const work = (async () => {
      // Pair scopes synchronously: concurrent preparations must not pop each other's scopes.
      this.device.pushErrorScope('validation');
      let module: GPUShaderModule;
      let shaderValidation: Promise<GPUError | null>;
      try {
        module = this.device.createShaderModule({
          label: material.label,
          code: nativeMeshWGSL(material.wgsl),
        });
      } finally {
        shaderValidation = this.device.popErrorScope();
      }
      const [info, shaderError] = await Promise.all([
        module.getCompilationInfo(),
        shaderValidation,
      ]);
      const errors = info.messages.filter(
        (message) => message.type === 'error',
      );
      if (errors.length)
        throw new GraphicsError(
          `${material.label} WGSL compilation failed: ${errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('; ')}`,
        );
      if (shaderError)
        throw new GraphicsError(
          `${material.label} WGSL validation failed: ${shaderError.message}`,
        );
      this.device.pushErrorScope('validation');
      let pipelineWork: Promise<GPURenderPipeline[]>;
      let pipelineValidation: Promise<GPUError | null>;
      try {
        pipelineWork = Promise.all(
          this.pipelineRecipes.map((recipe) =>
            this.device.createRenderPipelineAsync({
              ...recipe,
              label: material.label,
              vertex: { ...recipe.vertex, module },
              fragment: recipe.fragment
                ? { ...recipe.fragment, module }
                : undefined,
              depthStencil: recipe.depthStencil
                ? {
                    ...recipe.depthStencil,
                    depthWriteEnabled:
                      recipe.depthStencil.depthWriteEnabled &&
                      (recipe.depthStencil.format === 'depth32float' ||
                        !material.transparent),
                  }
                : undefined,
            }),
          ),
        );
      } finally {
        pipelineValidation = this.device.popErrorScope();
      }
      const [pipelines, pipelineError] = await Promise.all([
        pipelineWork,
        pipelineValidation,
      ]).catch((error: unknown) => {
        throw new GraphicsError(
          `${material.label} native 3D pipeline preparation failed.`,
          { cause: error },
        );
      });
      if (pipelineError)
        throw new GraphicsError(
          `${material.label} native 3D pipeline validation failed: ${pipelineError.message}`,
        );
      if (material.destroyed || this.destroyed)
        throw new GraphicsError('Native material preparation was invalidated.');
      material.validate();
      this.cacheTexture(materialBaseTexture(material), true);
      for (const texture of nativeMaterialSources(material))
        this.cacheTexture(texture, false);
      const unsubscribe = material.onDestroy(() => {
        this.nativeMaterials.delete(material);
        for (const [object, entry] of this.meshes)
          if (object.material === material) entry.allocation.destroy();
      });
      this.nativeMaterials.set(material, { pipelines, unsubscribe });
    })();
    this.pendingMaterials.set(material, work);
    try {
      await work;
    } finally {
      this.pendingMaterials.delete(material);
    }
  }
  prepareGpuParticles(emitter: GPUParticleEmitter3D): void {
    this.particles.prepare(emitter);
  }
  afterSubmit(): void {
    this.occlusion?.afterSubmit();
  }
  prepareMesh(mesh: Mesh): void {
    mesh.updateRenderDeformation();
    this.cacheGeometry(mesh.renderGeometry);
    this.cacheMesh(mesh);
  }
  unloadTexture(texture: Texture2DSource): void {
    if (texture.kind !== 'image' && texture.kind !== 'native') return;
    this.textures.get(texture)?.allocation.destroy();
    this.premultipliedTextures.get(texture)?.allocation.destroy();
    for (const [material, entry] of this.opticalTextures)
      if (
        pbrTextureSources(material).transmissionTexture === texture ||
        pbrTextureSources(material).thicknessTexture === texture
      )
        entry.allocation.destroy();
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
      const allocation = this.residency.textures.allocate(
        map.levelSizes.reduce(
          (bytes, level) => bytes + level.width * level.height * 8,
          0,
        ),
        () => {
          this.environments.get(map)?.texture.destroy();
          this.environments.delete(map);
        },
      );
      let texture: GPUTexture | undefined;
      try {
        texture = this.device.createTexture({
          size: [base.width, base.height],
          mipLevelCount: map.mipCount,
          format: 'rgba16float',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        for (let level = 0; level < map.mipCount; level++) {
          const size = map.levelSizes[level];
          this.device.queue.writeTexture(
            { texture, mipLevel: level },
            map.levels[level],
            { bytesPerRow: size.width * 8 },
            [size.width, size.height],
          );
          this.stats.upload(map.levels[level].byteLength);
        }
        entry = { texture, allocation, view: texture.createView(), seen: 0 };
      } catch (error) {
        texture?.destroy();
        allocation.destroy();
        throw error;
      }
      this.environments.set(map, entry);
    }
    entry.allocation.touch();
    entry.seen = this.frame;
    return entry.view;
  }

  private reflectionGroup(entry: CachedMesh): GPUBindGroup {
    const view = this.environmentView;
    const shadow = this.shadowView ?? this.emptyShadowView;
    const refraction = this.refractionView ?? this.dummyEnvironmentView;
    if (
      !entry.sceneGroup ||
      entry.sceneEnvironment !== view ||
      entry.sceneShadow !== shadow ||
      entry.sceneRefraction !== refraction
    ) {
      entry.sceneGroup = this.createSceneGroup(
        shadow,
        refraction,
        view,
        entry.sceneBuffer,
      );
      entry.sceneEnvironment = view;
      entry.sceneShadow = shadow;
      entry.sceneRefraction = refraction;
    }
    return entry.sceneGroup;
  }

  private renderShadows(
    encoder: GPUCommandEncoder,
    scene: Scene,
    width: number,
    height: number,
  ): void {
    if (
      !this.shadowCache.needsRender(
        scene,
        this.atlas,
        this.draws,
        this.visibility.entries,
        width,
        height,
      )
    ) {
      this.shadowCache.commit();
      this.stats.shadowCacheHits++;
      return;
    }
    this.stats.shadowPasses++;
    this.shadowAttachment.view = this.shadowView;
    const pass = beginTimedRenderPass(encoder, this.shadowDescriptor);
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
            this.drawMesh(pass, object, 3);
            this.stats.shadowDrawCalls++;
          }
      }
      this.shadowCache.commit();
    } finally {
      pass.end();
      this.shadowAttachment.view = undefined;
    }
  }

  private drawMesh(
    pass: GPURenderPassEncoder,
    object: Mesh,
    variant = 0,
  ): number {
    const geometry = this.geometries.get(object.renderGeometry)!;
    const mesh = this.meshes.get(object)!;
    const custom =
      object.material instanceof NativeMaterial3D
        ? this.nativeMaterials.get(object.material)
        : undefined;
    if (variant < 2 && (this.visibility.entries.get(object)?.fade ?? 1) < 1)
      variant += 4;
    let pipeline = custom
      ? custom.pipelines[variant]
      : variant === 5
        ? this.fadedHdrPipeline
        : variant === 4
          ? this.fadedPipeline
          : variant === 3
            ? this.shadowPipeline
            : variant === 2
              ? this.oitPipeline
              : variant === 1
                ? this.hdrPipeline
                : this.pipeline;
    if (
      variant !== 3 &&
      object.material instanceof PBRMaterial &&
      object.material.alphaToCoverage
    ) {
      if (this.sampleCount < 2)
        throw new GraphicsError(
          'Alpha-to-coverage requires renderer antialiasing.',
        );
      let coveragePipeline = this.coveragePipelines.get(variant);
      if (!coveragePipeline) {
        const recipe = this.pipelineRecipes[variant];
        coveragePipeline = this.device.createRenderPipeline({
          ...recipe,
          fragment: {
            ...recipe.fragment!,
            // 3D always clears opaque alpha; coverage must not attenuate it a second time.
            targets: Array.from(recipe.fragment!.targets, (target) => ({
              ...target!,
              blend: undefined,
              writeMask:
                GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE,
            })),
          },
          multisample: {
            count: this.sampleCount,
            alphaToCoverageEnabled: true,
          },
        });
        this.coveragePipelines.set(variant, coveragePipeline);
      }
      pipeline = coveragePipeline;
    }
    pass.setPipeline(pipeline);
    pass.setBindGroup(1, mesh.bindGroup);
    pass.setBindGroup(2, mesh.materialGroup);
    const packed =
      variant === 3
        ? undefined
        : this.visibility.entries.get(object)?.instances;
    const instances =
      packed?.count ?? (object instanceof InstancedMesh ? object.count : 1);
    pass.setVertexBuffer(0, geometry.vertex);
    pass.setVertexBuffer(1, packed ? mesh.visibleInstance! : mesh.instance);
    pass.setVertexBuffer(
      2,
      packed
        ? packed.colors
          ? mesh.visibleColors!
          : this.white(instances)
        : object instanceof InstancedMesh && object.colors
          ? mesh.instanceColors!
          : this.white(instances),
    );
    pass.setVertexBuffer(
      3,
      geometry.colors ?? this.white(object.geometry.vertices.length / 8),
    );
    pass.setVertexBuffer(
      4,
      mesh.influences ??
        this.defaultInfluences(object.renderGeometry.vertices.length / 8),
    );
    pass.setVertexBuffer(5, geometry.uvs1 ?? geometry.vertex);
    pass.setVertexBuffer(6, geometry.tangents);
    pass.setIndexBuffer(geometry.index, 'uint32');
    pass.drawIndexed(object.geometry.indices.length, instances);
    return instances;
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
    this.stats.upload(capacity * 16);
    this.whiteCapacity = capacity;
    return this.whiteBuffer;
  }

  private defaultInfluences(count: number): GPUBuffer {
    if (this.influenceBuffer && count <= this.influenceCapacity)
      return this.influenceBuffer;
    const capacity = Math.max(count, this.influenceCapacity * 2, 1024);
    if (this.influenceBuffer) this.retired.push(this.influenceBuffer);
    const source = new Float32Array(capacity * 16);
    for (let i = 0; i < capacity; i++) source[i * 16 + 4] = 1;
    this.influenceBuffer = this.device.createBuffer({
      size: source.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.influenceBuffer, 0, source);
    this.stats.upload(source.byteLength);
    this.influenceCapacity = capacity;
    return this.influenceBuffer;
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
    if (this.msaaTexture)
      this.stats.target(
        -this.msaaWidth *
          this.msaaHeight *
          (this.msaaFormat === 'rgba16float' ? 8 : 4) *
          this.sampleCount,
      );
    this.msaaTexture = undefined;
    this.msaaView = undefined;
    this.msaaTexture = this.device.createTexture({
      size: [width, height],
      format,
      sampleCount: this.sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.stats.target(
      width * height * (format === 'rgba16float' ? 8 : 4) * this.sampleCount,
    );
    this.msaaFormat = format;
    this.msaaWidth = width;
    this.msaaHeight = height;
    this.msaaView = this.msaaTexture.createView();
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
    if (this.depthTexture)
      this.stats.target(
        -this.depthWidth * this.depthHeight * 4 * this.sampleCount,
      );
    this.depthTexture = undefined;
    this.depthView = undefined;
    this.depthTexture = this.device.createTexture({
      size: [width, height],
      format: 'depth24plus',
      sampleCount: this.sampleCount,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.stats.target(width * height * 4 * this.sampleCount);
    this.depthWidth = width;
    this.depthHeight = height;
    this.depthView = this.depthTexture.createView();
  }

  private cacheGeometry(geometry: Geometry): CachedGeometry {
    const existing = this.geometries.get(geometry);
    if (existing) {
      existing.allocation.resize(
        geometry.vertices.byteLength +
          geometry.indices.byteLength +
          geometry.tangents.byteLength +
          (geometry.colors?.byteLength ?? 0) +
          (geometry.uvs1?.byteLength ?? 0),
      );
      if (existing.version !== geometry.version) {
        this.device.queue.writeBuffer(existing.vertex, 0, geometry.vertices);
        this.stats.upload(geometry.vertices.byteLength);
        this.syncGeometryColors(existing, geometry);
        this.syncGeometryUV(existing, geometry);
        this.device.queue.writeBuffer(existing.tangents, 0, geometry.tangents);
        this.stats.upload(geometry.tangents.byteLength);
        existing.version = geometry.version;
      }
      return existing;
    }
    const allocation = this.residency.geometry.allocate(
      geometry.vertices.byteLength +
        geometry.indices.byteLength +
        geometry.tangents.byteLength +
        (geometry.colors?.byteLength ?? 0) +
        (geometry.uvs1?.byteLength ?? 0),
      () => {
        const cached = this.geometries.get(geometry);
        if (!cached) return;
        cached.vertex.destroy();
        cached.index.destroy();
        cached.colors?.destroy();
        cached.uvs1?.destroy();
        cached.tangents.destroy();
        this.geometries.delete(geometry);
      },
    );
    let vertex: GPUBuffer | undefined;
    try {
      vertex = this.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      const index = this.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      try {
        const tangents = this.device.createBuffer({
          size: geometry.tangents.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        try {
          this.device.queue.writeBuffer(vertex, 0, geometry.vertices);
          this.stats.upload(geometry.vertices.byteLength);
          this.device.queue.writeBuffer(index, 0, geometry.indices);
          this.stats.upload(geometry.indices.byteLength);
          this.device.queue.writeBuffer(tangents, 0, geometry.tangents);
          this.stats.upload(geometry.tangents.byteLength);
          const entry: CachedGeometry = {
            allocation,
            vertex,
            index,
            colors: undefined,
            uvs1: undefined,
            tangents,
            version: geometry.version,
            seen: this.frame,
          };
          try {
            this.syncGeometryColors(entry, geometry);
            this.syncGeometryUV(entry, geometry);
          } catch (error) {
            entry.colors?.destroy();
            entry.uvs1?.destroy();
            throw error;
          }
          this.geometries.set(geometry, entry);
          return entry;
        } catch (error) {
          tangents.destroy();
          throw error;
        }
      } catch (error) {
        index.destroy();
        throw error;
      }
    } catch (error) {
      vertex?.destroy();
      allocation.destroy();
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
      this.stats.upload(colors.byteLength);
    }
  }

  private syncGeometryUV(entry: CachedGeometry, geometry: Geometry): void {
    const uv = geometry.uvs1;
    if (!uv) {
      entry.uvs1?.destroy();
      entry.uvs1 = undefined;
    } else {
      entry.uvs1 = this.colorBuffer(entry.uvs1, uv);
      this.device.queue.writeBuffer(entry.uvs1, 0, uv);
      this.stats.upload(uv.byteLength);
    }
  }

  private cacheMesh(object: Mesh): CachedMesh {
    const material = object.material;
    const pbr = material instanceof PBRMaterial;
    const sources = pbr ? pbrTextureSources(material) : undefined;
    const native =
      material instanceof NativeMaterial3D
        ? nativeMaterialSources(material)
        : undefined;
    const base = this.cacheTexture(materialBaseTexture(material), !pbr).view;
    const mr = sources?.metallicRoughnessTexture
      ? this.cacheTexture(sources.metallicRoughnessTexture, false).view
      : native && native[0]
        ? this.cacheTexture(native[0], false).view
        : this.whiteView;
    const normal = sources?.normalTexture
      ? this.cacheTexture(sources.normalTexture, false).view
      : native && native[1]
        ? this.cacheTexture(native[1], false).view
        : this.whiteView;
    const ao = sources?.occlusionTexture
      ? this.cacheTexture(sources.occlusionTexture, false).view
      : native && native[2]
        ? this.cacheTexture(native[2], false).view
        : this.whiteView;
    const emissive = sources?.emissiveTexture
      ? this.cacheTexture(sources.emissiveTexture, false).view
      : native && native[3]
        ? this.cacheTexture(native[3], false).view
        : this.whiteView;
    const specular = sources?.specularTexture
      ? this.cacheTexture(sources.specularTexture, false).view
      : this.whiteView;
    const specularColor = sources?.specularColorTexture
      ? this.cacheTexture(sources.specularColorTexture, false).view
      : this.whiteView;
    const clearcoat = sources?.clearcoatTexture
      ? this.cacheTexture(sources.clearcoatTexture, false).view
      : this.whiteView;
    const clearcoatRoughness = sources?.clearcoatRoughnessTexture
      ? this.cacheTexture(sources.clearcoatRoughnessTexture, false).view
      : this.whiteView;
    const clearcoatNormal = sources?.clearcoatNormalTexture
      ? this.cacheTexture(sources.clearcoatNormalTexture, false).view
      : this.whiteView;
    const sheenColor = sources?.sheenColorTexture
      ? this.cacheTexture(sources.sheenColorTexture, false).view
      : this.whiteView;
    const sheenRoughness = sources?.sheenRoughnessTexture
      ? this.cacheTexture(sources.sheenRoughnessTexture, false).view
      : this.whiteView;
    const optical = pbr
      ? this.cacheOpticalMaps(material)
      : this.emptyOpticalView;
    const existing = this.meshes.get(object);
    const skin = object instanceof SkinnedMesh ? object : undefined;
    const skinBytes = skin
      ? skin.jointPalette.byteLength +
        (skin.renderGeometry.vertices.length / 8) * 64
      : 0;
    if (existing) {
      existing.allocation.resize(
        existing.uniform.size +
          existing.sceneBuffer.size +
          (existing.visibleInstance?.size ?? 0) +
          (existing.visibleColors?.size ?? 0) +
          skinBytes +
          (object instanceof InstancedMesh
            ? object.matrices.byteLength +
              Math.max(
                existing.instanceColors?.size ?? 0,
                object.colors?.byteLength ?? 0,
              )
            : 0),
      );
      if (skin && existing.paletteVersion !== skin.paletteVersion) {
        this.device.queue.writeBuffer(existing.palette!, 0, skin.jointPalette);
        this.stats.upload(skin.jointPalette.byteLength);
        existing.paletteVersion = skin.paletteVersion;
      }
      if (existing.textureEpoch === this.textureEpoch) return existing;
    }
    const allocation =
      existing?.allocation ??
      this.residency.geometry.allocate(
        meshUniformFloats * 4 +
          this.sceneData.byteLength +
          skinBytes +
          (object instanceof InstancedMesh
            ? object.matrices.byteLength + (object.colors?.byteLength ?? 0)
            : 0),
        () => {
          const cached = this.meshes.get(object);
          if (!cached) return;
          cached.uniform.destroy();
          cached.sceneBuffer.destroy();
          cached.visibleInstance?.destroy();
          cached.visibleColors?.destroy();
          cached.instanceColors?.destroy();
          cached.palette?.destroy();
          cached.influences?.destroy();
          if (cached.instance !== this.identityBuffer)
            cached.instance.destroy();
          this.meshes.delete(object);
        },
      );
    let uniform = existing?.uniform;
    let instance = existing?.instance ?? this.identityBuffer;
    let instanceColors = existing?.instanceColors;
    let palette = existing?.palette;
    let influences = existing?.influences;
    try {
      uniform ??= this.device.createBuffer({
        size: meshUniformFloats * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      if (!existing && skin) {
        if (
          skin.jointPalette.byteLength >
          this.device.limits.maxStorageBufferBindingSize
        )
          throw new GraphicsError(
            'Skin palette exceeds the WebGPU storage buffer limit.',
          );
        palette = this.device.createBuffer({
          size: skin.jointPalette.byteLength,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        const count = skin.renderGeometry.vertices.length / 8;
        const data = new ArrayBuffer(count * 64);
        const indices = new Uint32Array(data),
          weights = new Float32Array(data);
        for (let vertex = 0; vertex < count; vertex++)
          for (
            let influence = 0;
            influence < skin.influencesPerVertex;
            influence++
          ) {
            const source = vertex * skin.influencesPerVertex + influence;
            const at =
              vertex * 16 + (influence < 4 ? influence : influence + 4);
            indices[at] = skin.jointIndices[source]!;
            weights[at + 4] = skin.weights[source]!;
          }
        influences = this.device.createBuffer({
          size: data.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(palette, 0, skin.jointPalette);
        this.device.queue.writeBuffer(influences, 0, data);
        this.stats.upload(skin.jointPalette.byteLength + data.byteLength);
      }
      if (!existing && object instanceof InstancedMesh) {
        instance = this.device.createBuffer({
          size: object.matrices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(instance, 0, object.matrices);
        this.stats.upload(object.matrices.byteLength);
        if (object.colors) {
          instanceColors = this.colorBuffer(undefined, object.colors);
          this.device.queue.writeBuffer(instanceColors, 0, object.colors);
          this.stats.upload(object.colors.byteLength);
        }
      }
      const bindGroup =
        existing?.bindGroup ??
        this.device.createBindGroup({
          layout: this.meshLayout,
          entries: [
            { binding: 0, resource: { buffer: uniform } },
            {
              binding: 1,
              resource: { buffer: palette ?? this.identityBuffer },
            },
          ],
        });
      const materialGroup = this.device.createBindGroup({
        layout: this.materialLayout,
        entries: [
          { binding: 0, resource: base },
          {
            binding: 1,
            resource: this.cacheSampler(material.textureSampler),
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
          { binding: 10, resource: specular },
          { binding: 11, resource: specularColor },
          {
            binding: 12,
            resource: pbr
              ? this.cacheSampler(material.specularSampler)
              : this.sampler,
          },
          {
            binding: 13,
            resource: pbr
              ? this.cacheSampler(material.specularColorSampler)
              : this.sampler,
          },
          { binding: 14, resource: clearcoat },
          { binding: 15, resource: clearcoatRoughness },
          { binding: 16, resource: clearcoatNormal },
          {
            binding: 17,
            resource: pbr
              ? this.cacheSampler(material.clearcoatSampler)
              : this.sampler,
          },
          {
            binding: 18,
            resource: pbr
              ? this.cacheSampler(material.clearcoatRoughnessSampler)
              : this.sampler,
          },
          {
            binding: 19,
            resource: pbr
              ? this.cacheSampler(material.clearcoatNormalSampler)
              : this.sampler,
          },
          { binding: 20, resource: sheenColor },
          { binding: 21, resource: sheenRoughness },
          {
            binding: 22,
            resource: pbr
              ? this.cacheSampler(material.sheenColorSampler)
              : this.sampler,
          },
          {
            binding: 23,
            resource: pbr
              ? this.cacheSampler(material.sheenRoughnessSampler)
              : this.sampler,
          },
          { binding: 24, resource: optical },
        ],
      });
      const entry: CachedMesh = existing ?? {
        uniform,
        allocation,
        textureEpoch: this.textureEpoch,
        bindGroup,
        materialGroup,
        environment: undefined,
        instance,
        instanceVersion: object instanceof InstancedMesh ? object.version : 0,
        instanceColors,
        instanceColorVersion:
          object instanceof InstancedMesh ? object.colorVersion : 0,
        palette,
        influences,
        paletteVersion: skin?.paletteVersion ?? 0,
        data: new Float32Array(meshUniformFloats),
        sceneBuffer: this.device.createBuffer({
          size: this.sceneData.byteLength,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        }),
        seen: this.frame,
      };
      entry.textureEpoch = this.textureEpoch;
      entry.materialGroup = materialGroup;
      this.meshes.set(object, entry);
      return entry;
    } catch (error) {
      if (!existing) {
        uniform?.destroy();
        instanceColors?.destroy();
        palette?.destroy();
        influences?.destroy();
        if (instance !== this.identityBuffer) instance.destroy();
        allocation.destroy();
      }
      throw error;
    }
  }

  private cacheSampler(options: TextureSamplerOptions | undefined): GPUSampler {
    const minFilter = options?.minFilter ?? 'linear';
    const magFilter = options?.magFilter ?? 'linear';
    const addressModeU = options?.addressModeU ?? 'clamp-to-edge';
    const addressModeV = options?.addressModeV ?? 'clamp-to-edge';
    const mipmapFilter = options?.mipmapFilter ?? 'linear';
    const lodMinClamp = options?.lodMinClamp ?? 0;
    const lodMaxClamp = options?.lodMaxClamp ?? 32;
    const maxAnisotropy = options?.maxAnisotropy ?? 1;
    if (!options) return this.sampler;
    const key = `${minFilter}/${magFilter}/${mipmapFilter}/${addressModeU}/${addressModeV}/${lodMinClamp}/${lodMaxClamp}/${maxAnisotropy}`;
    const existing = this.samplers.get(key);
    if (existing) return existing;
    const sampler = this.device.createSampler({
      minFilter,
      magFilter,
      mipmapFilter,
      lodMinClamp,
      lodMaxClamp,
      maxAnisotropy,
      addressModeU,
      addressModeV,
    });
    this.samplers.set(key, sampler);
    return sampler;
  }

  private cacheOpticalMaps(material: PBRMaterial): GPUTextureView {
    const a = pbrTextureSources(material).transmissionTexture,
      b = pbrTextureSources(material).thicknessTexture;
    if (!a && !b) return this.emptyOpticalView;
    if (a?.destroyed || b?.destroyed)
      throw new GraphicsError('WebGPU optical map has been destroyed.');
    let existing = this.opticalTextures.get(material);
    const sourceVersions = [a?.version ?? -1, b?.version ?? -1] as const;
    if (
      existing?.sourceVersions?.[0] === sourceVersions[0] &&
      existing.sourceVersions[1] === sourceVersions[1]
    ) {
      existing.allocation.touch();
      existing.seen = this.frame;
      return existing.view;
    }
    const side = Math.ceil(
      Math.sqrt(
        Math.max(a ? a.width * a.height : 1, b ? b.width * b.height : 1),
      ),
    );
    if (existing && existing.resource.width !== side) {
      existing.allocation.destroy();
      existing = undefined;
    }
    const allocation =
      existing?.allocation ??
      this.residency.textures.allocate(side * side * 8, () => {
        this.opticalTextures.get(material)?.resource.destroy();
        this.opticalTextures.delete(material);
        this.textureEpoch++;
      });
    let resource: GPUTexture | undefined = existing?.resource;
    try {
      resource ??= this.device.createTexture({
        size: [side, side, 2],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
      });
      const view =
        existing?.view ?? resource.createView({ dimension: '2d-array' });
      const encoder = this.device.createCommandEncoder();
      for (let layer = 0; layer < 2; layer++) {
        const source = layer === 0 ? a : b;
        if (!source) continue;
        const group = this.device.createBindGroup({
          layout: this.opticalPackLayout,
          entries: [
            { binding: 0, resource: this.cacheTexture(source, false).view },
            { binding: 1, resource: view },
          ],
        });
        const pass = beginTimedComputePass(encoder, {});
        pass.setPipeline(
          layer === 0 ? this.transmissionPack : this.thicknessPack,
        );
        pass.setBindGroup(0, group);
        pass.dispatchWorkgroups(Math.ceil(side / 8), Math.ceil(side / 8));
        pass.end();
      }
      this.device.queue.submit([encoder.finish()]);
      this.opticalTextures.set(material, {
        resource,
        allocation,
        view,
        seen: this.frame,
        sourceVersions,
      });
      if (!existing) this.textureEpoch++;
      allocation.touch();
      return view;
    } catch (error) {
      resource?.destroy();
      allocation.destroy();
      throw error;
    }
  }

  private cacheTexture(
    texture: MaterialTexture,
    premultiplied: boolean,
  ): CachedTexture {
    if (texture.destroyed)
      throw new GraphicsError('WebGPU material map has been destroyed.');
    const cache = premultiplied ? this.premultipliedTextures : this.textures;
    const existing = cache.get(texture);
    if (
      existing &&
      existing.resource.width === texture.width &&
      existing.resource.height === texture.height
    ) {
      existing.allocation.touch();
      existing.seen = this.frame;
      if (existing.version !== texture.version) {
        if (texture instanceof NativeTexture2D)
          uploadNativeWebGPU(this.device, existing.resource, texture);
        else
          this.device.queue.copyExternalImageToTexture(
            { source: texture.image },
            { texture: existing.resource, premultipliedAlpha: premultiplied },
            [texture.width, texture.height],
          );
        existing.version = texture.version;
        this.stats.upload(
          texture instanceof NativeTexture2D
            ? texture.byteLength
            : texture.width * texture.height * 4,
        );
      }
      return existing;
    }
    existing?.allocation.destroy();
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
    const native = texture instanceof NativeTexture2D;
    if (native) validateNativeWebGPU(this.device, texture);
    const bytes = native ? texture.byteLength : width * height * 4;
    const allocation = this.residency.textures.allocate(bytes, () => {
      cache.get(texture)?.resource.destroy();
      cache.delete(texture);
      this.textureEpoch++;
    });
    let resource: GPUTexture | undefined;
    try {
      resource = this.device.createTexture({
        size: [width, height],
        mipLevelCount: native ? texture.levels.length : 1,
        format: native ? nativeUploadFormat(texture.format) : 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          (native ? 0 : GPUTextureUsage.RENDER_ATTACHMENT),
      });
      if (native) uploadNativeWebGPU(this.device, resource, texture);
      else
        this.device.queue.copyExternalImageToTexture(
          { source: texture.image },
          { texture: resource, premultipliedAlpha: premultiplied },
          [width, height],
        );
      this.stats.upload(bytes);
      const entry = {
        resource,
        allocation,
        view: resource.createView(),
        seen: this.frame,
        version: texture.version,
      };
      cache.set(texture, entry);
      this.textureEpoch++;
      return entry;
    } catch (error) {
      resource?.destroy();
      allocation.destroy();
      throw error;
    }
  }

  private updateMesh(scene: Scene, object: Mesh, mesh: CachedMesh): void {
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
      data[28] = pbrTextureSources(material).metallicRoughnessTexture ? 1 : 0;
      data[29] = pbrTextureSources(material).normalTexture ? 1 : 0;
      data[30] = pbrTextureSources(material).occlusionTexture ? 1 : 0;
      data[31] = pbrTextureSources(material).emissiveTexture ? 1 : 0;
      data[32] = material.alphaCutoff;
      data[33] = material.doubleSided ? 1 : 0;
      data[36] = material.specularColor[0];
      data[37] = material.specularColor[1];
      data[38] = material.specularColor[2];
      data[39] =
        material.ior === 0 ? 1 : ((material.ior - 1) / (material.ior + 1)) ** 2;
      data[40] = material.specular;
      data[41] = material.ior === 0 ? 1 : 0;
      data[42] = pbrTextureSources(material).specularTexture ? 1 : 0;
      data[43] = pbrTextureSources(material).specularColorTexture ? 1 : 0;
      data[44] = material.clearcoat;
      data[45] = material.clearcoatRoughness;
      data[46] = material.clearcoatNormalScale;
      data[48] = pbrTextureSources(material).clearcoatTexture ? 1 : 0;
      data[49] = pbrTextureSources(material).clearcoatRoughnessTexture ? 1 : 0;
      data[50] = pbrTextureSources(material).clearcoatNormalTexture ? 1 : 0;
      data[52] = material.sheenColor[0];
      data[53] = material.sheenColor[1];
      data[54] = material.sheenColor[2];
      data[55] = material.sheenRoughness;
      data[56] = pbrTextureSources(material).sheenColorTexture ? 1 : 0;
      data[57] = pbrTextureSources(material).sheenRoughnessTexture ? 1 : 0;
      data[58] = material.specularAntiAliasing;
      data[59] = material.alphaToCoverage ? 1 : 0;
      data[60] = material.transmission;
      data[61] = material.thickness;
      data[62] = 1 / material.attenuationDistance;
      data[63] = material.ior;
      data[64] = material.attenuationColor[0];
      data[65] = material.attenuationColor[1];
      data[66] = material.attenuationColor[2];
      fillOpticalMapSettings(
        data,
        68,
        pbrTextureSources(material).transmissionTexture,
        material.transmissionSampler,
      );
      fillOpticalMapSettings(
        data,
        72,
        pbrTextureSources(material).thicknessTexture,
        material.thicknessSampler,
      );
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
    data[47] = object instanceof SkinnedMesh ? 1 : 0;
    data[51] = materialBaseTexture(material).kind === 'native' ? 1 : 0;
    const customOffset = 76 + REFLECTION_FLOAT_COUNT;
    if (material instanceof NativeMaterial3D)
      data.set(material.uniforms, customOffset);
    const visibility = this.visibility.entries.get(object);
    data[customOffset + nativeMaterial3DLimits.uniformFloats] =
      visibility?.fade ?? 1;
    data[customOffset + nativeMaterial3DLimits.uniformFloats + 1] =
      object.renderGeometry.tangentTexCoord;
    data[customOffset + nativeMaterial3DLimits.uniformFloats + 2] =
      object.renderGeometry.tangentConvention === 'gltf' ? -1 : 1;
    fillMaterialUV(
      material,
      object.renderGeometry,
      data,
      customOffset + nativeMaterial3DLimits.uniformFloats + 4,
    );
    const packed = visibility?.instances;
    if (
      packed &&
      (packed !== mesh.visibilityPayload ||
        packed.version !== mesh.visibilityVersion)
    ) {
      mesh.allocation.resize(
        mesh.uniform.size +
          mesh.sceneBuffer.size +
          mesh.instance.size +
          (mesh.instanceColors?.size ?? 0) +
          (mesh.palette?.size ?? 0) +
          (mesh.influences?.size ?? 0) +
          packed.matrices.byteLength +
          (packed.colors?.byteLength ?? 0),
      );
      if (
        !mesh.visibleInstance ||
        mesh.visibleInstance.size < packed.matrices.byteLength
      ) {
        if (mesh.visibleInstance) this.retired.push(mesh.visibleInstance);
        mesh.visibleInstance = this.device.createBuffer({
          size: packed.matrices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
      }
      this.device.queue.writeBuffer(
        mesh.visibleInstance,
        0,
        packed.matrices.buffer,
        packed.matrices.byteOffset,
        packed.count * 16 * 4,
      );
      this.stats.upload(packed.count * 16 * 4);
      if (packed.colors) {
        mesh.visibleColors = this.colorBuffer(
          mesh.visibleColors,
          packed.colors,
        );
        this.device.queue.writeBuffer(
          mesh.visibleColors,
          0,
          packed.colors.buffer,
          packed.colors.byteOffset,
          packed.count * 3 * 4,
        );
        this.stats.upload(packed.count * 3 * 4);
      }
      mesh.visibilityVersion = packed.version;
      mesh.visibilityPayload = packed;
    }
    fillProbeBlendData(scene, data, 76, this.selectedProbes);
    for (let i = 0; i < 5; i++) data[76 + i * 52 + 38] = this.probeMipCount - 1;
    if (
      object instanceof InstancedMesh &&
      mesh.instanceVersion !== object.version
    ) {
      this.device.queue.writeBuffer(mesh.instance, 0, object.matrices);
      this.stats.upload(object.matrices.byteLength);
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
      this.stats.upload(object.colors.byteLength);
      mesh.instanceColorVersion = object.colorVersion;
    }
    this.device.queue.writeBuffer(mesh.uniform, 0, data);
    this.stats.upload(data.byteLength);
  }

  private releaseUnused(): void {
    if (this.residency.geometry.budgetBytes === Infinity) {
      for (const entry of this.geometries.values())
        if (entry.seen !== this.frame && !entry.allocation.references)
          entry.allocation.destroy();
      for (const entry of this.meshes.values())
        if (entry.seen !== this.frame && !entry.allocation.references)
          entry.allocation.destroy();
    }
    for (const [map, entry] of this.environments)
      if (
        map.destroyed ||
        (this.residency.textures.budgetBytes === Infinity &&
          entry.seen !== this.frame &&
          !entry.allocation.references)
      )
        entry.allocation.destroy();
    this.releaseUnusedTextures(this.textures);
    this.releaseUnusedTextures(this.premultipliedTextures);
    for (const [material, entry] of this.opticalTextures)
      if (
        pbrTextureSources(material).transmissionTexture?.destroyed ||
        pbrTextureSources(material).thicknessTexture?.destroyed ||
        (this.residency.textures.budgetBytes === Infinity &&
          entry.seen !== this.frame &&
          !entry.allocation.references)
      )
        entry.allocation.destroy();
  }

  private releaseUnusedTextures(
    cache: Map<MaterialTexture, CachedTexture>,
  ): void {
    for (const [texture, entry] of cache)
      if (
        texture.destroyed ||
        (this.residency.textures.budgetBytes === Infinity &&
          entry.seen !== this.frame &&
          !entry.allocation.references)
      )
        entry.allocation.destroy();
  }

  destroy(): void {
    this.destroyed = true;
    this.probeAllocation?.destroy();
    this.temporal.destroy();
    for (const entry of this.nativeMaterials.values()) entry.unsubscribe();
    this.nativeMaterials.clear();
    this.coveragePipelines.clear();
    this.visibilityCache.clear();
    this.visibility.entries.clear();
    this.gathered.clear();
    this.occlusion?.destroy();
    this.particles.destroy();
    this.oit.release();
    this.post.destroy();
    if (this.depthTexture)
      this.stats.target(
        -this.depthWidth * this.depthHeight * 4 * this.sampleCount,
      );
    if (this.msaaTexture)
      this.stats.target(
        -this.msaaWidth *
          this.msaaHeight *
          (this.msaaFormat === 'rgba16float' ? 8 : 4) *
          this.sampleCount,
      );
    if (this.shadowTexture)
      this.stats.target(-this.shadowSize * this.shadowSize * 4);
    if (this.refractionTexture)
      this.stats.target(-this.refractionWidth * this.refractionHeight * 8);
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
    this.sheenBuffer.destroy();
    this.projectionBuffer.destroy();
    this.whiteTexture.destroy();
    this.emptyShadow.destroy();
    this.refractionTexture?.destroy();
    this.refractionTexture = undefined;
    this.refractionView = undefined;
    this.emptyOptical.destroy();
    for (const entry of this.opticalTextures.values()) entry.resource.destroy();
    this.opticalTextures.clear();
    this.identityBuffer.destroy();
    this.whiteBuffer.destroy();
    this.influenceBuffer?.destroy();
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
      entry.palette?.destroy();
      entry.influences?.destroy();
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
