import type { Scene } from '../../core/src/scene.js';
import { Frustum } from '../../core/src/frustum.js';
import { DrawSorter, isBlended } from '../../core/src/draw-order.js';
import { Mesh } from '../../core/src/mesh.js';
import {
  type Material2D,
  type PostProcessor2D,
  validateEffect2D,
} from '../../core/src/materials2d/material2d.js';
import type { Geometry } from '../../core/src/geometry.js';
import { InstancedMesh } from '../../core/src/instanced-mesh.js';
import { SkinnedMesh } from '../../core/src/skinned-mesh.js';
import { PBRMaterial } from '../../core/src/pbr-material.js';
import type { TextureSamplerOptions } from '../../core/src/pbr-material.js';
import {
  activeBackground,
  fillReflectionData,
  fillFogData,
  fillLightingData,
  validateRenderSettings,
} from '../../core/src/render-data.js';
import type { EnvironmentMap } from '../../core/src/environment.js';
import { ShadowAtlas } from '../../core/src/shadow-atlas.js';
import { sheenDirectionalAlbedo } from '../../../src/data/sheen.js';
import { Matrix4 } from '../../math/src/index.js';
import { OrthographicCamera } from '../../core/src/orthographic-camera.js';
import {
  meshVertex,
  meshFragment,
  shadowFragment,
  postVertex,
  postFragment,
  skyVertex,
  skyFragment,
} from './webgl-feature-shaders.js';
import { fxaaGLSL } from './fxaa-shaders.js';
import { opticalPackGLSL } from './optical-pack-shaders.js';
import { fillOpticalMapSettings } from './optical-maps.js';
import { Texture } from '../../assets/src/index.js';
import type { Texture2DSource } from '../../assets/src/index.js';
import { NativeTexture2D } from '../../assets/src/native-texture.js';
import type { NativeTextureFormat } from '../../assets/src/native-texture.js';
import {
  uploadNativeWebGL,
  webglTextureFormats,
} from './native-texture-upload.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import { WebGLRender2D } from './webgl2-render2d.js';
import { quadVertex2D, quadFragment2D } from './webgl2-render2d-shaders.js';
import {
  type RenderTexture2D,
  type RenderTextureOptions2D,
} from './render-texture2d.js';
import {
  ENVIRONMENT_FLOAT_COUNT,
  REFLECTION_FLOAT_COUNT,
  FOG_FLOAT_COUNT,
  LIGHTING_FLOAT_COUNT,
} from '../../../src/data/rendering.js';
import { defaults } from '../../../src/data/defaults.js';
import {
  GraphicsError,
  WebGL2ContextLostError,
  WebGL2InitializationError,
} from './errors.js';
import { FrameStats } from './render-stats.js';
import type { GraphicsCapabilities, Renderer } from './index.js';
import {
  collectRenderCommands2D,
  RenderCommandBuffer2D,
  type FrameEffects,
  type RenderSnapshot,
  type TransitionFrame,
} from './render2d-contract.js';
import {
  compositeFragment,
  layerVertex,
  processorFragment,
} from './webgl-2d/shaders.js';

import { oitCompositeGLSL } from './oit-shaders.js';
import { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import { NativeResidency } from './residency.js';
import type {
  ResidencyAllocation,
  ResidencyBudgetOptions,
} from './residency.js';
import { prepareNativeResource, residencyLease } from './preparation.js';
import type {
  PreparationResource,
  PreparedResourceLease,
  ResourcePreparationOptions,
} from './preparation.js';
interface CachedEnvironment {
  allocation: ResidencyAllocation;
  resource: WebGLTexture;
  seen: number;
}

const triangleVertex = `#version 300 es
precision highp float;
out vec3 vColor;
void main() {
  vec2 positions[3] = vec2[3](vec2(0.0, 0.7), vec2(-0.7, -0.6), vec2(0.7, -0.6));
  vec3 colors[3] = vec3[3](vec3(1.0, 0.3, 0.25), vec3(0.25, 0.9, 0.5), vec3(0.3, 0.5, 1.0));
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
  vColor = colors[gl_VertexID];
}`;
const triangleFragment = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 color;
void main() { color = vec4(vColor, 1.0); }`;

interface CachedTexture {
  allocation: ResidencyAllocation;
  resource: WebGLTexture;
  seen: number;
  version: number;
  prepared: boolean;
}
interface CachedGeometry {
  allocation: ResidencyAllocation;
  vao: WebGLVertexArrayObject;
  vertex: WebGLBuffer;
  index: WebGLBuffer;
  /** Per-vertex RGB buffer; undefined when the geometry has none (attribute 8 is constant white). */
  colors: WebGLBuffer | undefined;
  colorBytes: number;
  seen: number;
  version: number;
}

interface CachedInstances {
  allocation: ResidencyAllocation;
  buffer: WebGLBuffer;
  version: number;
  /** Per-instance RGB buffer, created when the InstancedMesh first has colors. */
  colors: WebGLBuffer | undefined;
  colorVersion: number;
  seen: number;
}

interface CachedSkin {
  allocation: ResidencyAllocation;
  indices: WebGLBuffer;
  weights: WebGLBuffer;
  palette: WebGLTexture;
  version: number;
  seen: number;
}

interface RenderTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  depth?: WebGLRenderbuffer;
  depthTexture?: WebGLTexture;
  width: number;
  height: number;
}

interface NativeProgram {
  program: WebGLProgram;
  viewport: WebGLUniformLocation | null;
  uniforms: WebGLUniformLocation | null;
  ready: boolean;
  preparation: Promise<void>;
  onDestroy: () => void;
}

class WebGLSnapshot implements RenderSnapshot {
  readonly backend = 'webgl2' as const;
  private release: (() => void) | undefined;

  constructor(
    readonly width: number,
    readonly height: number,
    release: () => void,
  ) {
    this.release = release;
  }

  get destroyed(): boolean {
    return !this.release;
  }

  destroy(): void {
    const release = this.release;
    this.release = undefined;
    release?.();
  }
}

/** A WebGL2 renderer with renderer-owned, frame-lifetime-cached GPU resources. */
export class WebGL2Renderer implements Renderer {
  readonly backend = 'webgl2' as const;
  private canvas: HTMLCanvasElement | undefined;
  private gl: WebGL2RenderingContext | undefined;
  private triangleProgram: WebGLProgram | undefined;
  private meshProgram: WebGLProgram | undefined;
  private triangleVAO: WebGLVertexArrayObject | undefined;
  private readonly commands = new RenderCommandBuffer2D();
  private readonly textures = new Map<Texture2DSource, CachedTexture>();
  private render2D: WebGLRender2D | undefined;
  private readonly geometries = new Map<Geometry, CachedGeometry>();
  private frame = 0;
  private activeFrame = false;
  private frameRendered = false;
  private destroyed = false;
  private lostError: WebGL2ContextLostError | undefined;
  private readonly frustum = new Frustum();
  private readonly meshDraws: Mesh[] = [];
  private readonly drawSorter = new DrawSorter();
  readonly stats = new FrameStats();
  readonly residency = new NativeResidency();
  private readonly preparedGeometry = new Set<ResidencyAllocation>();
  configureResidency(options: ResidencyBudgetOptions): void {
    if (this.activeFrame)
      throw new GraphicsError(
        'Cannot change residency budgets during an active frame.',
      );
    this.residency.configure(options);
  }
  retainFrameResources(): PreparedResourceLease {
    this.requireGL();
    return residencyLease(this.residency.retainFrameResources());
  }
  async prepareGeometry(source: Geometry | Geometry2D): Promise<void> {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError(
        'Cannot prepare geometry during an active frame.',
      );
    const allocation =
      source instanceof Geometry2D
        ? this.render2D!.prepareGeometry(source)
        : this.cacheGeometry(source).allocation;
    if (!this.preparedGeometry.has(allocation)) {
      allocation.retain();
      this.preparedGeometry.add(allocation);
    }
    this.gl!.flush();
  }
  unloadGeometry(source: Geometry | Geometry2D): void {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError('Cannot unload geometry during an active frame.');
    if (source instanceof Geometry2D) this.render2D!.unloadGeometry(source);
    else this.geometries.get(source)?.allocation.destroy();
    for (const allocation of this.preparedGeometry)
      if (allocation.destroyed) this.preparedGeometry.delete(allocation);
  }
  async prepareResource(
    source: PreparationResource,
    options?: ResourcePreparationOptions,
  ): Promise<PreparedResourceLease> {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError(
        'Cannot prepare resources during an active frame.',
      );
    return prepareNativeResource(
      this.residency,
      source,
      {
        texture: (texture) => {
          if (texture.kind === 'render') this.render2D!.source(texture);
          else this.cacheTexture(texture);
        },
        geometry: (geometry) => {
          if (geometry instanceof Geometry2D)
            this.render2D!.prepareGeometry(geometry);
          else this.cacheGeometry(geometry);
        },
        particles: (layer) => {
          this.render2D!.prepareParticles(layer);
          for (let i = 0; i < layer.activeCount; i++) {
            const source = layer.getSlot(layer.activeSlotAt(i)).texture;
            if (source.kind === 'render') this.render2D!.source(source);
            else this.cacheTexture(source);
          }
        },
        mesh: (mesh) => {
          mesh.updateRenderDeformation();
          this.cacheGeometry(mesh.renderGeometry);
          if (mesh instanceof SkinnedMesh) this.cacheSkin(mesh);
          const material = mesh.material;
          this.cacheTexture(material.texture);
          if (material instanceof PBRMaterial) {
            if (material.metallicRoughnessTexture)
              this.cacheTexture(material.metallicRoughnessTexture);
            if (material.normalTexture)
              this.cacheTexture(material.normalTexture);
            if (material.occlusionTexture)
              this.cacheTexture(material.occlusionTexture);
            if (material.emissiveTexture)
              this.cacheTexture(material.emissiveTexture);
            if (material.specularTexture)
              this.cacheTexture(material.specularTexture);
            if (material.specularColorTexture)
              this.cacheTexture(material.specularColorTexture);
            if (material.clearcoatTexture)
              this.cacheTexture(material.clearcoatTexture);
            if (material.clearcoatRoughnessTexture)
              this.cacheTexture(material.clearcoatRoughnessTexture);
            if (material.clearcoatNormalTexture)
              this.cacheTexture(material.clearcoatNormalTexture);
            if (material.sheenColorTexture)
              this.cacheTexture(material.sheenColorTexture);
            if (material.sheenRoughnessTexture)
              this.cacheTexture(material.sheenRoughnessTexture);
            if (material.transmissionTexture)
              this.cacheTexture(material.transmissionTexture);
            if (material.thicknessTexture)
              this.cacheTexture(material.thicknessTexture);
            this.cacheOpticalMaps(material);
          }
          if (mesh instanceof InstancedMesh) this.cacheInstances(mesh);
        },
        environment: (map) => {
          this.uploadEnvironment(map);
        },
        material: (material) => this.prepareMaterial(material),
        post: (post) => this.preparePostProcessor(post),
        complete: async () => {
          this.requireGL().flush();
        },
      },
      options,
    );
  }
  private readonly targetBytes = new WeakMap<object, number>();
  private maxTextureSize = 0;
  private maxWidth = 0;
  private maxHeight = 0;
  private viewportX = 0;
  private viewportY = 0;
  private viewportSide = 1;
  private shadowProgram: WebGLProgram | undefined;
  private postProgram: WebGLProgram | undefined;
  private skyProgram: WebGLProgram | undefined;
  private skyVAO: WebGLVertexArrayObject | undefined;
  private readonly skyUniforms: Record<string, WebGLUniformLocation | null> =
    {};
  private readonly environments = new Map<EnvironmentMap, CachedEnvironment>();
  private readonly environmentData = new Float32Array(REFLECTION_FLOAT_COUNT);
  private readonly environmentLightingData = this.environmentData.subarray(
    0,
    ENVIRONMENT_FLOAT_COUNT,
  );
  private readonly fogData = new Float32Array(FOG_FLOAT_COUNT);
  private readonly invViewProjection = new Matrix4();
  private readonly meshUniforms: Record<string, WebGLUniformLocation | null> =
    {};
  private readonly shadowUniforms: Record<string, WebGLUniformLocation | null> =
    {};
  private readonly postUniforms: Record<string, WebGLUniformLocation | null> =
    {};
  private readonly lightingData = new Float32Array(LIGHTING_FLOAT_COUNT);
  private readonly tintData = new Float32Array(4);
  private readonly meshInstances = new Map<InstancedMesh, CachedInstances>();
  private readonly meshSkins = new Map<SkinnedMesh, CachedSkin>();
  private readonly samplers = new Map<string, WebGLSampler>();
  private supportedTextureFormats: readonly NativeTextureFormat[] = [];
  private readonly atlas = new ShadowAtlas();
  private shadowBuffer: WebGLBuffer | undefined;
  private sheenBuffer: WebGLBuffer | undefined;
  private readonly opticalTextures = new Map<
    PBRMaterial,
    { resource: WebGLTexture; seen: number; allocation: ResidencyAllocation }
  >();
  private readonly opticalSettings = new Float32Array(8);
  private emptyOptical: WebGLTexture | undefined;
  private opticalPackProgram: WebGLProgram | undefined;
  private opticalPackFramebuffer: WebGLFramebuffer | undefined;
  private opticalPackSide: WebGLUniformLocation | null = null;
  private refractionTarget: RenderTarget | undefined;
  private hasTransmission = false;
  private linear3D = false;
  private weighted = false;
  private oitAccumulation: RenderTarget | undefined;
  private oitRevealage: RenderTarget | undefined;
  private oitProgram: WebGLProgram | undefined;
  private shadowTarget: RenderTarget | undefined;
  private postTarget: RenderTarget | undefined;
  private fxaaProgram: WebGLProgram | undefined;
  private fxaaTarget: RenderTarget | undefined;
  private floatColorBuffer = false;
  private compositeProgram: WebGLProgram | undefined;
  private readonly compositeUniforms: Record<
    string,
    WebGLUniformLocation | null
  > = {};
  private readonly materials = new Map<Material2D, NativeProgram>();
  private readonly processors = new Map<PostProcessor2D, NativeProgram>();
  private readonly snapshots = new Map<WebGLSnapshot, RenderTarget>();
  private frameTarget: RenderTarget | undefined;
  private layerTarget: RenderTarget | undefined;
  private effectTarget: RenderTarget | undefined;
  private sceneTarget: RenderTarget | undefined;

  get capabilities(): GraphicsCapabilities {
    return {
      threeD: true,
      compute: false,
      customShaders: true,
      storageBuffers: false,
      instancing: true,
      maxTextureSize: this.maxTextureSize,
      supportedTextureFormats: this.supportedTextureFormats,
    };
  }

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    if (this.destroyed || this.lostError) return;
    this.lostError = new WebGL2ContextLostError(
      'WebGL2 context lost; the renderer cannot continue.',
    );
    this.destroy();
    this.onError(this.lostError);
  };

  constructor(
    private readonly onError: (error: Error) => void,
    private readonly antialias = true,
  ) {}

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.gl)
      throw new GraphicsError(
        'WebGL2 renderer cannot be initialized more than once.',
      );
    try {
      const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: this.antialias,
        preserveDrawingBuffer: false,
      });
      if (!gl)
        throw new WebGL2InitializationError(
          'WebGL2 canvas context is unavailable: canvas.getContext("webgl2") returned null.',
        );
      this.gl = gl;
      this.canvas = canvas;
      canvas.addEventListener('webglcontextlost', this.onContextLost);
      this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      const renderbufferLimit = gl.getParameter(
        gl.MAX_RENDERBUFFER_SIZE,
      ) as number;
      const viewportLimit = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
      this.maxWidth = Math.min(
        this.maxTextureSize,
        renderbufferLimit,
        viewportLimit[0],
      );
      this.maxHeight = Math.min(
        this.maxTextureSize,
        renderbufferLimit,
        viewportLimit[1],
      );
      this.floatColorBuffer =
        gl.getExtension('EXT_color_buffer_float') !== null;
      this.supportedTextureFormats = webglTextureFormats(gl);
      this.resize(Math.max(canvas.width, 1), Math.max(canvas.height, 1));
      this.triangleProgram = this.createProgram(
        gl,
        triangleVertex,
        triangleFragment,
        'triangle',
      );
      this.meshProgram = this.createProgram(
        gl,
        meshVertex,
        meshFragment,
        'mesh',
      );
      this.shadowProgram = this.createProgram(
        gl,
        meshVertex,
        shadowFragment,
        'shadow',
      );
      this.postProgram = this.createProgram(
        gl,
        postVertex,
        postFragment,
        'postprocessing',
      );
      this.fxaaProgram = this.createProgram(gl, postVertex, fxaaGLSL, 'FXAA');
      gl.useProgram(this.fxaaProgram);
      gl.uniform1i(gl.getUniformLocation(this.fxaaProgram, 'image'), 0);
      this.compositeProgram = this.createProgram(
        gl,
        layerVertex,
        compositeFragment,
        '2D layer and transition composition',
      );
      this.triangleVAO = this.createVAO(gl);
      this.skyProgram = this.createProgram(
        gl,
        skyVertex,
        skyFragment,
        'skybox',
      );
      this.skyVAO = this.createVAO(gl);
      this.render2D = new WebGLRender2D(gl, {
        owner: this,
        stats: this.stats,
        residency: this.residency,
        createTarget: (width, height) =>
          this.createTarget(width, height, false, 'rgba8', false),
        deleteTarget: (target) => this.deleteTarget(target),
        createProgram: (vertex, fragment, label) =>
          this.createProgram(gl, vertex, fragment, label),
        source: (source) => {
          if (source.kind === 'render') return this.render2D!.source(source);
          const entry = this.cacheTexture(source);
          entry.seen = this.frame;
          return entry.resource;
        },
        material: (material) => this.requireNative(material, false).program,
        processor: (processor) => this.requireNative(processor, true).program,
        assertIdle: () => {
          this.requireGL();
          if (this.activeFrame)
            throw new GraphicsError(
              'WebGL2 offscreen APIs cannot run during an active frame.',
            );
        },
        assertAlive: () => {
          this.requireGL();
        },
      });
      this.shadowBuffer = this.createBuffer(gl);
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.shadowBuffer);
      gl.bufferData(
        gl.UNIFORM_BUFFER,
        this.atlas.data.byteLength,
        gl.DYNAMIC_DRAW,
      );
      gl.uniformBlockBinding(
        this.meshProgram,
        gl.getUniformBlockIndex(this.meshProgram, 'ShadowData'),
        0,
      );
      this.sheenBuffer = this.createBuffer(gl);
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.sheenBuffer);
      gl.bufferData(gl.UNIFORM_BUFFER, sheenDirectionalAlbedo, gl.STATIC_DRAW);
      gl.uniformBlockBinding(
        this.meshProgram,
        gl.getUniformBlockIndex(this.meshProgram, 'SheenLookup'),
        1,
      );
      this.opticalPackProgram = this.createProgram(
        gl,
        postVertex,
        opticalPackGLSL,
        'optical packing',
      );
      this.opticalPackFramebuffer = gl.createFramebuffer() ?? undefined;
      this.emptyOptical = gl.createTexture() ?? undefined;
      if (!this.opticalPackFramebuffer || !this.emptyOptical)
        throw new WebGL2InitializationError(
          'WebGL2 optical resource allocation failed.',
        );
      gl.activeTexture(gl.TEXTURE0 + 14);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.emptyOptical);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, 1, 1, 2);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.useProgram(this.opticalPackProgram);
      gl.uniform1i(gl.getUniformLocation(this.opticalPackProgram, 'image'), 0);
      this.opticalPackSide = gl.getUniformLocation(
        this.opticalPackProgram,
        'side',
      );
      for (const name of [
        'viewProjection',
        'model',
        'instanced',
        'skinned',
        'jointPalette',
        'lighting[0]',
        'tint',
        'surface',
        'emission',
        'maps',
        'pbr',
        'alphaMode',
        'doubleSided',
        'linearOutput',
        'cameraPosition',
        'receiveShadow',
        'image',
        'metallicRoughnessMap',
        'normalMap',
        'occlusionMap',
        'emissiveMap',
        'specularMap',
        'specularColorMap',
        'specularColor',
        'specularParams',
        'clearcoat',
        'clearcoatMaps',
        'clearcoatMap',
        'clearcoatRoughnessMap',
        'clearcoatNormalMap',
        'sheen',
        'sheenMaps',
        'sheenColorMap',
        'sheenRoughnessMap',
        'transmission',
        'attenuationColor',
        'transmissionMapSettings',
        'thicknessMapSettings',
        'opticalMaps',
        'opaqueScene',
        'shadowMap',
        'oitPass',
        'environment[0]',
        'environmentMap',
        'probeMin',
        'probeMax',
        'probePosition',
        'probeBoxProjection',
        'fog[0]',
      ])
        this.meshUniforms[name] = gl.getUniformLocation(this.meshProgram, name);
      for (const name of [
        'viewProjection',
        'model',
        'instanced',
        'skinned',
        'jointPalette',
        'image',
        'alphaCutoff',
        'opacity',
        'doubleSided',
        'alphaMode',
      ])
        this.shadowUniforms[name] = gl.getUniformLocation(
          this.shadowProgram,
          name,
        );
      for (const name of ['invViewProjection', 'backgroundMap', 'sky'])
        this.skyUniforms[name] = gl.getUniformLocation(this.skyProgram, name);
      for (const name of [
        'image',
        'settings',
        'aces',
        'depthImage',
        'inverseVP',
        'clip',
        'ssao',
        'dof',
      ])
        this.postUniforms[name] = gl.getUniformLocation(this.postProgram, name);
      for (const name of [
        'image',
        'previousImage',
        'hasPrevious',
        'transitionKind',
        'progress',
        'transitionColor',
        'slideDirection',
      ])
        this.compositeUniforms[name] = gl.getUniformLocation(
          this.compositeProgram,
          name,
        );
      gl.useProgram(this.meshProgram);
      gl.uniform1i(this.meshUniforms.image, 0);
      gl.uniform1i(this.meshUniforms.metallicRoughnessMap, 1);
      gl.uniform1i(this.meshUniforms.normalMap, 2);
      gl.uniform1i(this.meshUniforms.occlusionMap, 3);
      gl.uniform1i(this.meshUniforms.emissiveMap, 4);
      gl.uniform1i(this.meshUniforms.shadowMap, 5);
      gl.uniform1i(this.meshUniforms.environmentMap, 6);
      gl.useProgram(this.skyProgram);
      gl.uniform1i(this.skyUniforms.backgroundMap, 0);
      gl.useProgram(this.shadowProgram);
      gl.uniform1i(this.shadowUniforms.image, 0);
      gl.useProgram(this.postProgram);
      gl.uniform1i(this.postUniforms.image, 0);
      gl.useProgram(this.compositeProgram);
      gl.uniform1i(this.compositeUniforms.image, 0);
      gl.uniform1i(this.compositeUniforms.previousImage, 1);
      gl.useProgram(null);
    } catch (error) {
      this.destroy();
      if (error instanceof GraphicsError) throw error;
      throw new WebGL2InitializationError(
        `WebGL2 initialization failed${error instanceof Error ? `: ${error.message}` : '.'}`,
        { cause: error },
      );
    }
  }

  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D {
    this.requireGL();
    return this.render2D!.createRenderTexture(options);
  }

  async renderToTexture(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options?: { clear?: boolean; bounds?: Rect2D },
  ): Promise<void> {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError(
        'Cannot render offscreen during an active frame.',
      );
    return this.render2D!.renderToTexture(target, content, options);
  }

  async extractPixels(
    target: RenderTexture2D,
    options?: { region?: Rect2D },
  ): Promise<Uint8ClampedArray> {
    this.requireGL();
    return this.render2D!.extractPixels(target, options);
  }

  async generateTexture(
    content: Scene | IsolatedGroup2D,
    options?: { bounds?: Rect2D; resolution?: number },
  ): Promise<Texture> {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError(
        'Cannot generate a texture during an active frame.',
      );
    return this.render2D!.generateTexture(content, options);
  }

  async prepareTextures(sources: readonly Texture2DSource[]): Promise<void> {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError(
        'Cannot prepare textures during an active frame.',
      );
    for (const source of sources) {
      if (source.kind === 'render') this.render2D!.source(source);
      else {
        const entry = this.cacheTexture(source);
        if (!entry.prepared) entry.allocation.retain();
        entry.prepared = true;
      }
    }
    this.gl!.flush();
  }

  unloadTexture(source: Texture2DSource): void {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError('Cannot unload textures during an active frame.');
    if (source.kind === 'render') {
      this.render2D!.source(source);
      throw new GraphicsError(
        'Renderer-owned render targets must be destroyed rather than unloaded.',
      );
    }
    const entry = this.textures.get(source);
    if (entry) {
      entry.allocation.destroy();
    }
    for (const [material, packed] of this.opticalTextures)
      if (
        material.transmissionTexture === source ||
        material.thicknessTexture === source
      )
        packed.allocation.destroy();
  }

  async prepareMaterial(material: Material2D): Promise<void> {
    return this.prepareNative(material, false);
  }

  async preparePostProcessor(effect: PostProcessor2D): Promise<void> {
    return this.prepareNative(effect, true);
  }

  private async prepareNative(
    effect: Material2D | PostProcessor2D,
    post: boolean,
  ): Promise<void> {
    const gl = this.requireGL();
    validateEffect2D(effect);
    const cache = post ? this.processors : this.materials;
    const existing = cache.get(effect);
    if (existing) return existing.preparation;
    const program = this.createProgram(
      gl,
      post ? layerVertex : quadVertex2D,
      post ? processorFragment(effect.glsl) : quadFragment2D(effect.glsl),
      post ? 'native 2D postprocessor' : 'native Sprite material',
    );
    const previousProgram = gl.getParameter(
      gl.CURRENT_PROGRAM,
    ) as WebGLProgram | null;
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'image'), 0);
    gl.useProgram(previousProgram);
    const onDestroy = (): void => {
      if (cache.get(effect) !== entry) return;
      cache.delete(effect);
      gl.deleteProgram(program);
      effect.removeEventListener('destroy', onDestroy);
    };
    const preparation = Promise.resolve()
      .then(() => {
        this.requireGL();
        validateEffect2D(effect);
        if (cache.get(effect) !== entry)
          throw new GraphicsError(
            'WebGL2 native effect preparation was cancelled.',
          );
        entry.ready = true;
      })
      .catch((error: unknown) => {
        onDestroy();
        throw error;
      });
    const entry: NativeProgram = {
      program,
      viewport: gl.getUniformLocation(program, 'viewportSize'),
      uniforms: gl.getUniformLocation(program, 'uniforms[0]'),
      ready: false,
      preparation,
      onDestroy,
    };
    cache.set(effect, entry);
    effect.addEventListener('destroy', onDestroy);
    return preparation;
  }

  private requireNative(
    effect: Material2D | PostProcessor2D,
    post: boolean,
  ): NativeProgram {
    validateEffect2D(effect);
    const entry = (post ? this.processors : this.materials).get(effect);
    if (!entry?.ready)
      throw new GraphicsError(
        `WebGL2 ${post ? 'postprocessor' : 'Sprite material'} must be prepared before rendering.`,
      );
    return entry;
  }

  private validateTransition(transition: TransitionFrame): void {
    if (
      !Number.isFinite(transition.progress) ||
      transition.progress < 0 ||
      transition.progress > 1 ||
      !['fade', 'crossfade', 'slide'].includes(transition.kind) ||
      !['left', 'right', 'up', 'down'].includes(transition.direction) ||
      transition.color.length !== 4 ||
      transition.color.some(
        (value) => !Number.isFinite(value) || value < 0 || value > 1,
      )
    )
      throw new GraphicsError(
        'WebGL2 transition requires normalized progress/color and a valid kind/direction.',
      );
    const snapshot = transition.snapshot;
    if (
      snapshot &&
      (!(snapshot instanceof WebGLSnapshot) ||
        snapshot.destroyed ||
        !this.snapshots.has(snapshot))
    )
      throw new GraphicsError(
        'WebGL2 transition snapshot is destroyed or belongs to another renderer/backend.',
      );
  }

  beginFrame(): void {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError(
        'WebGL2 beginFrame called before the preceding frame ended.',
      );
    this.activeFrame = true;
    this.residency.beginFrame();
    this.frameRendered = false;
    this.stats.begin();
  }

  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void {
    this.requireGL();
    if (!this.activeFrame || this.frameRendered)
      throw new GraphicsError(
        'WebGL2 render requires an active frame and may be called only once per frame.',
      );
    const transition = effects?.transition;
    if (transition) {
      this.validateTransition(transition);
      const canvas = this.canvas!;
      if (!this.frameTarget)
        this.frameTarget = this.createTarget(
          canvas.width,
          canvas.height,
          false,
          'rgba8',
        );
    } else if (this.frameTarget) {
      this.deleteTarget(this.frameTarget);
      this.frameTarget = undefined;
    }
    this.renderFrame(
      scene,
      width,
      height,
      transition ? this.frameTarget : undefined,
      transition,
    );
  }

  async captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot> {
    this.requireGL();
    if (this.activeFrame)
      throw new GraphicsError(
        'WebGL2 cannot capture a scene during an active frame.',
      );
    const canvas = this.canvas!;
    const target = this.createTarget(
      canvas.width,
      canvas.height,
      false,
      'rgba8',
    );
    try {
      this.beginFrame();
      // Redraw into owned storage before yielding; default framebuffer preservation is off.
      this.renderFrame(scene, width, height, target);
      this.endFrame(false);
      const snapshot = new WebGLSnapshot(target.width, target.height, () => {
        this.snapshots.delete(snapshot);
        this.deleteTarget(target);
      });
      this.snapshots.set(snapshot, target);
      return snapshot;
    } catch (error) {
      this.residency.abortFrame();
      this.deleteTarget(target);
      throw error;
    } finally {
      this.activeFrame = false;
      this.frameRendered = false;
    }
  }

  private renderFrame(
    scene: Scene | undefined,
    width: number | undefined,
    height: number | undefined,
    destination?: RenderTarget,
    transition?: TransitionFrame,
  ): void {
    const gl = this.gl!;
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
        'WebGL2 rendering requires positive finite logical width and height.',
      );
    this.frame++;
    try {
      const effects = scene?.effects2D;
      if (!this.layerTarget)
        this.layerTarget = this.createTarget(
          canvas.width,
          canvas.height,
          false,
          'rgba8',
          false,
        );
      const chain3D = scene?.effects3D;
      const process3D = !!chain3D?.length;
      if (effects?.length || process3D) {
        for (const effect of effects ?? []) this.requireNative(effect, true);
        for (const effect of chain3D ?? []) this.requireNative(effect, true);
        if (!this.effectTarget)
          this.effectTarget = this.createTarget(
            canvas.width,
            canvas.height,
            false,
            'rgba8',
            false,
          );
      } else {
        if (this.effectTarget) this.deleteTarget(this.effectTarget);
        this.effectTarget = undefined;
      }
      if (process3D) {
        this.sceneTarget ??= this.createTarget(
          canvas.width,
          canvas.height,
          false,
          'rgba8',
          true,
        );
      } else if (this.sceneTarget) {
        this.deleteTarget(this.sceneTarget);
        this.sceneTarget = undefined;
      }
      // 3D renders here first when an effect chain must see the finished image.
      const sceneFramebuffer = process3D
        ? this.sceneTarget!.framebuffer
        : (destination?.framebuffer ?? null);
      this.hasTransmission = this.linear3D = this.weighted = false;
      if (scene) {
        validateRenderSettings(scene);
        this.collectMeshes(scene, logicalWidth / logicalHeight);
        this.linear3D =
          scene.postProcessing.enabled || this.hasTransmission || this.weighted;
        fillLightingData(scene, this.lightingData);
        this.atlas.update(scene, logicalWidth / logicalHeight);
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.shadowBuffer!);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.atlas.data);
        this.stats.upload(this.atlas.data.byteLength);
        collectRenderCommands2D(
          scene,
          logicalWidth,
          logicalHeight,
          this.commands,
        );
        this.render2D!.preflight(
          this.commands,
          scene,
          logicalWidth,
          logicalHeight,
          Math.max(canvas.width / logicalWidth, canvas.height / logicalHeight),
        );
        if (scene.shadows.enabled) this.drawShadows(scene);
        else if (this.shadowTarget) {
          this.deleteTarget(this.shadowTarget);
          this.shadowTarget = undefined;
        }
        if (this.linear3D) this.preparePostTarget(canvas.width, canvas.height);
        else if (this.postTarget) {
          this.releaseOIT();
          this.deleteTarget(this.postTarget);
          this.postTarget = undefined;
        }
        if (!scene.postProcessing.enabled && this.fxaaTarget) {
          this.deleteTarget(this.fxaaTarget);
          this.fxaaTarget = undefined;
        }
        if (this.hasTransmission)
          this.prepareRefractionTarget(canvas.width, canvas.height);
        else if (this.refractionTarget) {
          this.deleteTarget(this.refractionTarget);
          this.refractionTarget = undefined;
        }
      } else {
        this.commands.clear();
        this.releaseOIT();
        if (this.postTarget) {
          this.deleteTarget(this.postTarget);
          this.postTarget = undefined;
        }
        if (this.fxaaTarget) {
          this.deleteTarget(this.fxaaTarget);
          this.fxaaTarget = undefined;
        }
        if (this.refractionTarget) {
          this.deleteTarget(this.refractionTarget);
          this.refractionTarget = undefined;
        }
      }
      if (this.weighted) this.prepareOIT(canvas.width, canvas.height);
      else this.releaseOIT();
      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        this.linear3D ? this.postTarget!.framebuffer : sceneFramebuffer,
      );
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(
        this.linear3D
          ? this.decodeColor(defaults.clearColor.r)
          : defaults.clearColor.r,
        this.linear3D
          ? this.decodeColor(defaults.clearColor.g)
          : defaults.clearColor.g,
        this.linear3D
          ? this.decodeColor(defaults.clearColor.b)
          : defaults.clearColor.b,
        defaults.clearColor.a,
      );
      gl.depthMask(true);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (scene) {
        this.drawMeshes(scene, logicalWidth / logicalHeight);
        gl.disable(gl.DEPTH_TEST);
        if (this.linear3D) this.drawPost(scene, sceneFramebuffer);
        if (process3D)
          this.drawEffects2D(
            chain3D!,
            logicalWidth,
            logicalHeight,
            destination?.framebuffer ?? null,
            this.sceneTarget!,
            this.effectTarget!,
            true,
          );
        gl.activeTexture(gl.TEXTURE0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.CULL_FACE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.layerTarget!.framebuffer);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.render2D!.draw(
          this.commands,
          scene,
          this.layerTarget!,
          logicalWidth,
          logicalHeight,
        );
        if (effects?.length)
          this.drawEffects2D(
            effects,
            logicalWidth,
            logicalHeight,
            destination?.framebuffer ?? null,
          );
        else
          this.drawComposite(
            this.layerTarget!.texture,
            destination?.framebuffer ?? null,
          );
      } else {
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.viewport(
          this.viewportX,
          this.viewportY,
          this.viewportSide,
          this.viewportSide,
        );
        gl.useProgram(this.triangleProgram!);
        gl.bindVertexArray(this.triangleVAO!);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (transition)
        this.drawComposite(destination!.texture, null, transition);
      this.frameRendered = true;
    } finally {
      this.releaseUnused();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindSampler(0, null);
      gl.bindVertexArray(null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.useProgram(null);
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  endFrame(publishFrame = true): void {
    const gl = this.requireGL();
    if (!this.activeFrame || !this.frameRendered)
      throw new GraphicsError('WebGL2 endFrame requires a rendered frame.');
    gl.flush();
    this.activeFrame = false;
    if (publishFrame) this.residency.endFrame();
    else this.residency.abortFrame();
  }

  resize(width: number, height: number): void {
    if (this.lostError) throw this.lostError;
    const canvas = this.canvas;
    if (!canvas || !this.gl || this.destroyed)
      throw new GraphicsError(
        'WebGL2 resize requires an initialized renderer.',
      );
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 0 ||
      height < 0
    )
      throw new RangeError(
        'WebGL2 canvas pixel width and height must be finite, nonnegative numbers.',
      );
    const pixelWidth = Math.max(1, Math.round(width));
    const pixelHeight = Math.max(1, Math.round(height));
    if (
      !Number.isSafeInteger(pixelWidth) ||
      !Number.isSafeInteger(pixelHeight) ||
      pixelWidth > this.maxWidth ||
      pixelHeight > this.maxHeight
    )
      throw new GraphicsError(
        `WebGL2 canvas backing size ${pixelWidth}×${pixelHeight} exceeds this device's maximum dimensions of ${this.maxWidth}×${this.maxHeight} pixels. Reduce the canvas size or pixel ratio.`,
      );
    if (
      this.postTarget &&
      (this.postTarget.width !== pixelWidth ||
        this.postTarget.height !== pixelHeight)
    ) {
      this.releaseOIT();
      this.deleteTarget(this.postTarget);
      this.postTarget = undefined;
    }
    if (
      this.refractionTarget &&
      (this.refractionTarget.width !== pixelWidth ||
        this.refractionTarget.height !== pixelHeight)
    ) {
      this.deleteTarget(this.refractionTarget);
      this.refractionTarget = undefined;
    }
    if (
      this.fxaaTarget &&
      (this.fxaaTarget.width !== pixelWidth ||
        this.fxaaTarget.height !== pixelHeight)
    ) {
      this.deleteTarget(this.fxaaTarget);
      this.fxaaTarget = undefined;
    }
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      if (this.frameTarget) this.deleteTarget(this.frameTarget);
      if (this.layerTarget) this.deleteTarget(this.layerTarget);
      if (this.effectTarget) this.deleteTarget(this.effectTarget);
      if (this.sceneTarget) this.deleteTarget(this.sceneTarget);
      this.frameTarget = undefined;
      this.layerTarget = undefined;
      this.effectTarget = undefined;
      this.sceneTarget = undefined;
    }
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const side = Math.min(pixelWidth, pixelHeight);
    this.viewportX = (pixelWidth - side) / 2;
    this.viewportY = (pixelHeight - side) / 2;
    this.viewportSide = side;
  }

  private drawEffects2D(
    effects: readonly PostProcessor2D[],
    width: number,
    height: number,
    destination: WebGLFramebuffer | null,
    firstInput: RenderTarget = this.layerTarget!,
    firstOutput: RenderTarget = this.effectTarget!,
    replace = false,
  ): void {
    const gl = this.gl!;
    let input = firstInput;
    let output = firstOutput;
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(this.triangleVAO!);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindSampler(0, null);
    for (const effect of effects) {
      const native = this.processors.get(effect)!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(native.program);
      gl.uniform2f(native.viewport, width, height);
      gl.uniform4fv(native.uniforms, effect.uniforms);
      gl.bindTexture(gl.TEXTURE_2D, input.texture);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.stats.pass2D();
      this.stats.draw2D();
      const swap = input;
      input = output;
      output = swap;
    }
    if (replace) {
      // The chain result replaces the frame; do not blend it over the previous contents.
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    this.drawComposite(input.texture, destination);
  }

  private drawComposite(
    image: WebGLTexture,
    destination: WebGLFramebuffer | null,
    transition?: TransitionFrame,
  ): void {
    const gl = this.gl!;
    const canvas = this.canvas!;
    const uniforms = this.compositeUniforms;
    const previous = transition?.snapshot
      ? this.snapshots.get(transition.snapshot as WebGLSnapshot)!.texture
      : undefined;
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    if (transition) gl.disable(gl.BLEND);
    else {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.useProgram(this.compositeProgram!);
    gl.bindVertexArray(this.triangleVAO!);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindSampler(0, null);
    gl.bindTexture(gl.TEXTURE_2D, image);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindSampler(1, null);
    gl.bindTexture(gl.TEXTURE_2D, previous ?? image);
    gl.uniform1i(uniforms.hasPrevious, previous ? 1 : 0);
    gl.uniform1i(
      uniforms.transitionKind,
      !transition
        ? 0
        : transition.kind === 'fade'
          ? 1
          : transition.kind === 'crossfade'
            ? 2
            : 3,
    );
    gl.uniform1f(uniforms.progress, transition?.progress ?? 0);
    if (transition) {
      const color = transition.color;
      gl.uniform4f(
        uniforms.transitionColor,
        color[0] * color[3],
        color[1] * color[3],
        color[2] * color[3],
        color[3],
      );
      const direction = transition.direction;
      gl.uniform2f(
        uniforms.slideDirection,
        direction === 'left' ? -1 : direction === 'right' ? 1 : 0,
        direction === 'up' ? -1 : direction === 'down' ? 1 : 0,
      );
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.stats.pass2D();
    this.stats.draw2D();
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
  }

  private collectMeshes(scene: Scene, aspect: number): void {
    this.frustum.setFromMatrix(scene.camera3D.updateMatrix(aspect));
    const draws = this.meshDraws;
    draws.length = 0;
    for (const object of scene.objects) {
      if (
        !(object instanceof Mesh) ||
        !object.worldVisible ||
        (object.material.opacity <= 0 &&
          (!(object.material instanceof PBRMaterial) ||
            object.material.alphaMode === 'BLEND')) ||
        object.material.texture.destroyed ||
        object.geometry.indices.length === 0
      )
        continue;
      this.stats.meshes++;
      if (!object.isInFrustum(this.frustum)) {
        this.stats.culled++;
        continue;
      }
      draws.push(object);
      if (
        scene.transparency === 'weighted' &&
        isBlended(object) &&
        (!(object instanceof InstancedMesh) || object.count > 0)
      )
        this.weighted = true;
      if (
        object.material instanceof PBRMaterial &&
        (!(object instanceof InstancedMesh) || object.count > 0)
      ) {
        this.cacheOpticalMaps(object.material);
        if (object.material.transmission > 0) this.hasTransmission = true;
      }
    }
    if (scene.transparency === 'sorted')
      this.drawSorter.sort(draws, scene.camera3D.position);
  }

  private cacheOpticalMaps(material: PBRMaterial): void {
    const a = material.transmissionTexture,
      b = material.thicknessTexture;
    if (!a && !b) return;
    if (a?.destroyed || b?.destroyed)
      throw new GraphicsError('WebGL2 optical map has been destroyed.');
    const existing = this.opticalTextures.get(material);
    if (existing) {
      existing.allocation.touch();
      existing.seen = this.frame;
      return;
    }
    const gl = this.gl!;
    const side = Math.ceil(
      Math.sqrt(
        Math.max(a ? a.width * a.height : 1, b ? b.width * b.height : 1),
      ),
    );
    const allocation = this.residency.textures.allocate(side * side * 8, () => {
      const cached = this.opticalTextures.get(material);
      if (cached) gl.deleteTexture(cached.resource);
      this.opticalTextures.delete(material);
    });
    const resource = gl.createTexture();
    if (!resource) {
      allocation.destroy();
      throw new GraphicsError('WebGL2 optical array allocation failed.');
    }
    try {
      gl.activeTexture(gl.TEXTURE0 + 14);
      gl.bindSampler(14, null);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, resource);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, side, side, 2);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.useProgram(this.opticalPackProgram!);
      gl.uniform1i(this.opticalPackSide, side);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.opticalPackFramebuffer!);
      gl.viewport(0, 0, side, side);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.SCISSOR_TEST);
      gl.bindVertexArray(this.triangleVAO!);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindSampler(0, null);
      for (let layer = 0; layer < 2; layer++) {
        const source = layer === 0 ? a : b;
        if (!source) continue;
        const entry = this.cacheTexture(source);
        entry.seen = this.frame;
        gl.bindTexture(gl.TEXTURE_2D, entry.resource);
        gl.framebufferTextureLayer(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          resource,
          0,
          layer,
        );
        if (
          gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE
        )
          throw new GraphicsError(
            'WebGL2 optical packing framebuffer is incomplete.',
          );
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      this.opticalTextures.set(material, {
        resource,
        allocation,
        seen: this.frame,
      });
    } catch (error) {
      gl.deleteTexture(resource);
      allocation.destroy();
      throw error;
    } finally {
      gl.framebufferTextureLayer(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        null,
        0,
        0,
      );
    }
  }

  private drawMeshes(scene: Scene, aspect: number): void {
    const gl = this.gl!;
    const uniforms = this.meshUniforms;
    const background = activeBackground(scene);
    if (background) this.drawSky(scene, aspect, background);
    gl.useProgram(this.meshProgram!);
    gl.uniformMatrix4fv(
      uniforms.viewProjection,
      false,
      scene.camera3D.updateMatrix(aspect).elements,
    );
    this.frustum.setFromMatrix(scene.camera3D.updateMatrix(aspect));
    gl.uniform4fv(uniforms['lighting[0]'], this.lightingData);
    fillFogData(scene, this.fogData);
    gl.uniform4fv(uniforms['fog[0]'], this.fogData);
    const camera = scene.camera3D.position;
    gl.uniform3f(uniforms.cameraPosition, camera.x, camera.y, camera.z);
    gl.uniform1i(uniforms.linearOutput, this.linear3D ? 1 : 0);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.shadowBuffer!);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, this.sheenBuffer!);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindSampler(5, null);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowTarget?.texture ?? null);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    // Shader-side winding handles mixed mirrored instances in a single draw.
    gl.disable(gl.CULL_FACE);
    gl.activeTexture(gl.TEXTURE0 + 15);
    gl.bindSampler(15, null);
    gl.bindTexture(gl.TEXTURE_2D, this.refractionTarget?.texture ?? null);
    gl.uniform1i(uniforms.opaqueScene, 15);
    gl.uniform1i(uniforms.opticalMaps, 14);
    gl.activeTexture(gl.TEXTURE0 + 14);
    gl.bindSampler(14, null);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.emptyOptical!);
    const draws = this.meshDraws;
    const basePhases = this.hasTransmission ? 2 : 1;
    const phases = basePhases + (this.weighted ? 2 : 0);
    for (let phase = 0; phase < phases; phase++) {
      const oitPass = phase >= basePhases ? phase - basePhases + 1 : 0;
      gl.uniform1i(uniforms.oitPass, oitPass);
      if (oitPass) {
        gl.bindFramebuffer(
          gl.FRAMEBUFFER,
          (oitPass === 1 ? this.oitAccumulation : this.oitRevealage)!
            .framebuffer,
        );
        gl.clearColor(
          oitPass === 1 ? 0 : 1,
          oitPass === 1 ? 0 : 1,
          oitPass === 1 ? 0 : 1,
          oitPass === 1 ? 0 : 1,
        );
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.depthMask(false);
        gl.blendFunc(
          oitPass === 1 ? gl.ONE : gl.ZERO,
          oitPass === 1 ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA,
        );
      }
      for (const object of draws) {
        if (this.weighted && isBlended(object) !== oitPass > 0) continue;
        if (!oitPass && this.hasTransmission) {
          const deferred =
            isBlended(object) ||
            (object.material instanceof PBRMaterial &&
              object.material.transmission > 0);
          if (deferred !== (phase === 1)) continue;
        }
        object.updateRenderDeformation();
        const material = object.material;
        const pbr = material instanceof PBRMaterial;
        if (pbr) {
          const environment = fillReflectionData(
            scene,
            object,
            this.environmentData,
          );
          const data = this.environmentData;
          gl.uniform4fv(
            uniforms['environment[0]'],
            this.environmentLightingData,
          );
          gl.uniform3f(uniforms.probeMin, data[40], data[41], data[42]);
          gl.uniform3f(uniforms.probeMax, data[44], data[45], data[46]);
          gl.uniform3f(uniforms.probePosition, data[48], data[49], data[50]);
          gl.uniform1i(uniforms.probeBoxProjection, data[39] ? 1 : 0);
          gl.activeTexture(gl.TEXTURE6);
          gl.bindSampler(6, null);
          gl.bindTexture(
            gl.TEXTURE_2D,
            environment ? this.uploadEnvironment(environment).resource : null,
          );
        }
        gl.uniform1i(uniforms.pbr, pbr ? 1 : 0);
        gl.uniform1i(
          uniforms.doubleSided,
          pbr && !material.doubleSided ? 0 : 1,
        );
        gl.uniform1i(
          uniforms.alphaMode,
          pbr
            ? material.alphaMode === 'OPAQUE'
              ? 0
              : material.alphaMode === 'MASK'
                ? 1
                : 2
            : 2,
        );
        const tint = this.tintData;
        tint[0] = material.color[0];
        tint[1] = material.color[1];
        tint[2] = material.color[2];
        tint[3] = material.opacity;
        gl.uniform4fv(uniforms.tint, tint);
        gl.uniform1i(uniforms.receiveShadow, object.receiveShadow ? 1 : 0);
        this.bindMaterialTexture(
          material.texture,
          0,
          pbr ? material.textureSampler : undefined,
        );
        if (pbr) {
          gl.uniform4f(
            uniforms.transmission,
            material.transmission,
            material.thickness,
            1 / material.attenuationDistance,
            material.ior,
          );
          gl.uniform3f(
            uniforms.attenuationColor,
            material.attenuationColor[0],
            material.attenuationColor[1],
            material.attenuationColor[2],
          );
          fillOpticalMapSettings(
            this.opticalSettings,
            0,
            material.transmissionTexture,
            material.transmissionSampler,
          );
          fillOpticalMapSettings(
            this.opticalSettings,
            4,
            material.thicknessTexture,
            material.thicknessSampler,
          );
          gl.uniform4f(
            uniforms.transmissionMapSettings,
            this.opticalSettings[0]!,
            this.opticalSettings[1]!,
            this.opticalSettings[2]!,
            this.opticalSettings[3]!,
          );
          gl.uniform4f(
            uniforms.thicknessMapSettings,
            this.opticalSettings[4]!,
            this.opticalSettings[5]!,
            this.opticalSettings[6]!,
            this.opticalSettings[7]!,
          );
          gl.activeTexture(gl.TEXTURE0 + 14);
          gl.bindSampler(14, null);
          gl.bindTexture(
            gl.TEXTURE_2D_ARRAY,
            this.opticalTextures.get(material)?.resource ?? this.emptyOptical!,
          );
          gl.uniform4f(
            uniforms.specularColor,
            material.specularColor[0],
            material.specularColor[1],
            material.specularColor[2],
            material.ior === 0
              ? 1
              : ((material.ior - 1) / (material.ior + 1)) ** 2,
          );
          gl.uniform4f(
            uniforms.specularParams,
            material.specular,
            material.ior === 0 ? 1 : 0,
            material.specularTexture ? 1 : 0,
            material.specularColorTexture ? 1 : 0,
          );
          gl.uniform1i(uniforms.specularMap, 7);
          gl.uniform1i(uniforms.specularColorMap, 8);
          this.bindMaterialTexture(
            material.specularTexture ?? material.texture,
            7,
            material.specularSampler,
          );
          this.bindMaterialTexture(
            material.specularColorTexture ?? material.texture,
            8,
            material.specularColorSampler,
          );
          gl.uniform4f(
            uniforms.clearcoat,
            material.clearcoat,
            material.clearcoatRoughness,
            material.clearcoatNormalScale,
            0,
          );
          gl.uniform4f(
            uniforms.clearcoatMaps,
            material.clearcoatTexture ? 1 : 0,
            material.clearcoatRoughnessTexture ? 1 : 0,
            material.clearcoatNormalTexture ? 1 : 0,
            0,
          );
          gl.uniform1i(uniforms.clearcoatMap, 9);
          gl.uniform1i(uniforms.clearcoatRoughnessMap, 10);
          gl.uniform1i(uniforms.clearcoatNormalMap, 11);
          this.bindMaterialTexture(
            material.clearcoatTexture ?? material.texture,
            9,
            material.clearcoatSampler,
          );
          this.bindMaterialTexture(
            material.clearcoatRoughnessTexture ?? material.texture,
            10,
            material.clearcoatRoughnessSampler,
          );
          this.bindMaterialTexture(
            material.clearcoatNormalTexture ?? material.texture,
            11,
            material.clearcoatNormalSampler,
          );
          gl.uniform4f(
            uniforms.sheen,
            material.sheenColor[0],
            material.sheenColor[1],
            material.sheenColor[2],
            material.sheenRoughness,
          );
          gl.uniform4f(
            uniforms.sheenMaps,
            material.sheenColorTexture ? 1 : 0,
            material.sheenRoughnessTexture ? 1 : 0,
            0,
            0,
          );
          gl.uniform1i(uniforms.sheenColorMap, 12);
          gl.uniform1i(uniforms.sheenRoughnessMap, 13);
          this.bindMaterialTexture(
            material.sheenColorTexture ?? material.texture,
            12,
            material.sheenColorSampler,
          );
          this.bindMaterialTexture(
            material.sheenRoughnessTexture ?? material.texture,
            13,
            material.sheenRoughnessSampler,
          );
          gl.uniform4f(
            uniforms.surface,
            material.metallic,
            material.roughness,
            material.normalScale,
            material.occlusionStrength,
          );
          gl.uniform4f(
            uniforms.emission,
            material.emissive[0],
            material.emissive[1],
            material.emissive[2],
            material.alphaCutoff,
          );
          gl.uniform4i(
            uniforms.maps,
            material.metallicRoughnessTexture ? 1 : 0,
            material.normalTexture ? 1 : 0,
            material.occlusionTexture ? 1 : 0,
            material.emissiveTexture ? 1 : 0,
          );
          this.bindMaterialTexture(
            material.metallicRoughnessTexture ?? material.texture,
            1,
            material.metallicRoughnessSampler,
          );
          this.bindMaterialTexture(
            material.normalTexture ?? material.texture,
            2,
            material.normalSampler,
          );
          this.bindMaterialTexture(
            material.occlusionTexture ?? material.texture,
            3,
            material.occlusionSampler,
          );
          this.bindMaterialTexture(
            material.emissiveTexture ?? material.texture,
            4,
            material.emissiveSampler,
          );
        }
        this.drawMesh(object, uniforms);
        this.stats.draw(
          object.geometry.indices.length,
          object instanceof InstancedMesh ? object.count : 1,
        );
      }
      if (this.hasTransmission && phase === 0) {
        const width = this.postTarget!.width,
          height = this.postTarget!.height;
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.postTarget!.framebuffer);
        gl.bindFramebuffer(
          gl.DRAW_FRAMEBUFFER,
          this.refractionTarget!.framebuffer,
        );
        gl.blitFramebuffer(
          0,
          0,
          width,
          height,
          0,
          0,
          width,
          height,
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.postTarget!.framebuffer);
      }
    }
    if (this.weighted) this.resolveOIT();
    gl.depthMask(true);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    draws.length = 0;
  }

  private bindMaterialTexture(
    texture: Texture,
    unit: number,
    sampler?: TextureSamplerOptions,
  ): void {
    if (texture.destroyed)
      throw new GraphicsError(
        'WebGL2 cannot render a destroyed material texture.',
      );
    const gl = this.gl!;
    gl.bindSampler(unit, sampler ? this.cacheSampler(sampler) : null);
    gl.activeTexture(gl.TEXTURE0 + unit);
    const cached = this.cacheTexture(texture);
    cached.seen = this.frame;
    gl.bindTexture(gl.TEXTURE_2D, cached.resource);
  }

  private cacheSampler(options: TextureSamplerOptions): WebGLSampler | null {
    const min = options.minFilter === 'nearest' ? 0 : 1;
    const mag = options.magFilter === 'nearest' ? 0 : 1;
    const u =
      options.addressModeU === 'repeat'
        ? 1
        : options.addressModeU === 'mirror-repeat'
          ? 2
          : 0;
    const v =
      options.addressModeV === 'repeat'
        ? 1
        : options.addressModeV === 'mirror-repeat'
          ? 2
          : 0;
    const mip = options.mipmapFilter ?? 'linear';
    const lodMin = options.lodMinClamp ?? 0;
    const lodMax = options.lodMaxClamp ?? 32;
    const key = `${min}/${mag}/${mip}/${u}/${v}/${lodMin}/${lodMax}`;
    const existing = this.samplers.get(key);
    if (existing) return existing;
    const gl = this.gl!;
    const sampler = gl.createSampler();
    if (!sampler)
      throw new GraphicsError('WebGL2 could not allocate a material sampler.');
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_MIN_FILTER,
      mip === 'nearest'
        ? min
          ? gl.LINEAR_MIPMAP_NEAREST
          : gl.NEAREST_MIPMAP_NEAREST
        : min
          ? gl.LINEAR_MIPMAP_LINEAR
          : gl.NEAREST_MIPMAP_LINEAR,
    );
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_MAG_FILTER,
      mag ? gl.LINEAR : gl.NEAREST,
    );
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_WRAP_S,
      u === 1 ? gl.REPEAT : u === 2 ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE,
    );
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_WRAP_T,
      v === 1 ? gl.REPEAT : v === 2 ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE,
    );
    gl.samplerParameterf(sampler, gl.TEXTURE_MIN_LOD, lodMin);
    gl.samplerParameterf(sampler, gl.TEXTURE_MAX_LOD, lodMax);
    this.samplers.set(key, sampler);
    return sampler;
  }

  private drawMesh(
    mesh: Mesh,
    uniforms: Record<string, WebGLUniformLocation | null>,
  ): void {
    const gl = this.gl!;
    const geometry = this.cacheGeometry(mesh.renderGeometry);
    geometry.seen = this.frame;
    gl.uniformMatrix4fv(
      uniforms.model,
      false,
      mesh.updateWorldMatrix().elements,
    );
    gl.bindVertexArray(geometry.vao);
    // Generic attribute values are context state, so the white default is set on every draw.
    gl.vertexAttrib3f(7, 1, 1, 1);
    gl.vertexAttrib4f(8, 1, 1, 1, 1);
    const skin = mesh instanceof SkinnedMesh ? this.cacheSkin(mesh) : undefined;
    gl.uniform1i(uniforms.skinned, skin ? 1 : 0);
    if (skin) {
      gl.activeTexture(gl.TEXTURE0 + 16);
      gl.bindTexture(gl.TEXTURE_2D, skin.palette);
      gl.bindSampler(16, null);
      gl.uniform1i(uniforms.jointPalette, 16);
      gl.bindBuffer(gl.ARRAY_BUFFER, skin.indices);
      gl.enableVertexAttribArray(9);
      gl.vertexAttribIPointer(9, 4, gl.UNSIGNED_INT, 16, 0);
      gl.vertexAttribDivisor(9, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, skin.weights);
      gl.enableVertexAttribArray(10);
      gl.vertexAttribPointer(10, 4, gl.FLOAT, false, 16, 0);
      gl.vertexAttribDivisor(10, 0);
    } else {
      gl.disableVertexAttribArray(9);
      gl.disableVertexAttribArray(10);
      gl.vertexAttribI4ui(9, 0, 0, 0, 0);
      gl.vertexAttrib4f(10, 1, 0, 0, 0);
      // Samplers require a complete float-compatible texture even in an untaken branch.
      gl.uniform1i(uniforms.jointPalette, 0);
    }
    if (mesh instanceof InstancedMesh) {
      const entry = this.cacheInstances(mesh);
      gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer);
      for (let column = 0; column < 4; column++) {
        gl.enableVertexAttribArray(3 + column);
        gl.vertexAttribPointer(3 + column, 4, gl.FLOAT, false, 64, column * 16);
        gl.vertexAttribDivisor(3 + column, 1);
      }
      const colors = mesh.colors;
      if (colors) {
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.colors!);
        gl.enableVertexAttribArray(7);
        gl.vertexAttribPointer(7, 3, gl.FLOAT, false, 12, 0);
        gl.vertexAttribDivisor(7, 1);
      } else {
        gl.disableVertexAttribArray(7);
        gl.vertexAttribDivisor(7, 0);
      }
      gl.uniform1i(uniforms.instanced, 1);
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        mesh.geometry.indices.length,
        gl.UNSIGNED_INT,
        0,
        mesh.count,
      );
    } else {
      // Geometry VAOs can be shared by ordinary and instanced meshes.
      for (let column = 0; column < 4; column++) {
        gl.disableVertexAttribArray(3 + column);
        gl.vertexAttribDivisor(3 + column, 0);
      }
      gl.disableVertexAttribArray(7);
      gl.vertexAttribDivisor(7, 0);
      gl.uniform1i(uniforms.instanced, 0);
      gl.drawElements(
        gl.TRIANGLES,
        mesh.geometry.indices.length,
        gl.UNSIGNED_INT,
        0,
      );
    }
  }

  private cacheSkin(mesh: SkinnedMesh): CachedSkin {
    const gl = this.gl!;
    let entry = this.meshSkins.get(mesh);
    if (!entry) {
      if (mesh.joints.length > this.maxTextureSize)
        throw new GraphicsError(
          'Skin palette exceeds the WebGL2 texture height limit.',
        );
      const bytes =
        mesh.jointIndices.byteLength +
        mesh.weights.byteLength +
        mesh.jointPalette.byteLength;
      const allocation = this.residency.geometry.allocate(bytes, () => {
        const cached = this.meshSkins.get(mesh);
        if (!cached) return;
        gl.deleteBuffer(cached.indices);
        gl.deleteBuffer(cached.weights);
        gl.deleteTexture(cached.palette);
        this.meshSkins.delete(mesh);
      });
      let indices: WebGLBuffer | undefined, weights: WebGLBuffer | undefined;
      let palette: WebGLTexture | undefined;
      try {
        indices = this.createBuffer(gl);
        weights = this.createBuffer(gl);
        palette = gl.createTexture() ?? undefined;
        if (!palette)
          throw new GraphicsError('WebGL2 could not allocate a joint palette.');
        gl.bindBuffer(gl.ARRAY_BUFFER, indices);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.jointIndices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, weights);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.weights, gl.STATIC_DRAW);
        gl.activeTexture(gl.TEXTURE0 + 16);
        gl.bindTexture(gl.TEXTURE_2D, palette);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA32F,
          4,
          mesh.joints.length,
          0,
          gl.RGBA,
          gl.FLOAT,
          mesh.jointPalette,
        );
        this.stats.upload(bytes);
        entry = {
          allocation,
          indices,
          weights,
          palette,
          version: mesh.paletteVersion,
          seen: this.frame,
        };
        this.meshSkins.set(mesh, entry);
      } catch (error) {
        if (indices) gl.deleteBuffer(indices);
        if (weights) gl.deleteBuffer(weights);
        if (palette) gl.deleteTexture(palette);
        allocation.destroy();
        throw error;
      }
    } else if (entry.version !== mesh.paletteVersion) {
      gl.activeTexture(gl.TEXTURE0 + 16);
      gl.bindTexture(gl.TEXTURE_2D, entry.palette);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        4,
        mesh.joints.length,
        gl.RGBA,
        gl.FLOAT,
        mesh.jointPalette,
      );
      this.stats.upload(mesh.jointPalette.byteLength);
      entry.version = mesh.paletteVersion;
    }
    entry.allocation.touch();
    entry.seen = this.frame;
    return entry;
  }

  private cacheInstances(mesh: InstancedMesh): CachedInstances {
    const gl = this.gl!;
    let entry = this.meshInstances.get(mesh);
    if (!entry) {
      const allocation = this.residency.geometry.allocate(
        mesh.matrices.byteLength + (mesh.colors?.byteLength ?? 0),
        () => {
          const cached = this.meshInstances.get(mesh);
          if (!cached) return;
          gl.deleteBuffer(cached.buffer);
          if (cached.colors) gl.deleteBuffer(cached.colors);
          this.meshInstances.delete(mesh);
        },
      );
      let buffer: WebGLBuffer;
      try {
        buffer = this.createBuffer(gl);
      } catch (error) {
        allocation.destroy();
        throw error;
      }
      entry = {
        buffer,
        allocation,
        version: -1,
        colors: undefined,
        colorVersion: -1,
        seen: this.frame,
      };
      this.meshInstances.set(mesh, entry);
    }
    entry.allocation.resize(
      mesh.matrices.byteLength + (mesh.colors?.byteLength ?? 0),
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer);
    if (entry.version < 0)
      gl.bufferData(gl.ARRAY_BUFFER, mesh.matrices, gl.DYNAMIC_DRAW);
    else if (entry.version !== mesh.version)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.matrices);
    if (entry.version !== mesh.version)
      this.stats.upload(mesh.matrices.byteLength);
    entry.version = mesh.version;
    const colors = mesh.colors;
    if (colors) {
      if (!entry.colors) entry.colors = this.createBuffer(gl);
      gl.bindBuffer(gl.ARRAY_BUFFER, entry.colors);
      if (entry.colorVersion < 0)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
      else if (entry.colorVersion !== mesh.colorVersion)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, colors);
      if (entry.colorVersion !== mesh.colorVersion)
        this.stats.upload(colors.byteLength);
      entry.colorVersion = mesh.colorVersion;
    } else if (entry.colors) {
      gl.deleteBuffer(entry.colors);
      entry.colors = undefined;
      entry.colorVersion = -1;
    }
    entry.seen = this.frame;
    return entry;
  }

  private drawShadows(scene: Scene): void {
    const gl = this.gl!;
    const size = this.atlas.size;
    if (size > this.maxWidth || size > this.maxHeight)
      throw new GraphicsError(
        `WebGL2 shadow map size ${size} exceeds this device's framebuffer limit.`,
      );
    if (!this.shadowTarget || this.shadowTarget.width !== size) {
      if (this.shadowTarget) this.deleteTarget(this.shadowTarget);
      this.shadowTarget = undefined;
      this.shadowTarget = this.createTarget(size, size, true);
    }
    const uniforms = this.shadowUniforms;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowTarget.framebuffer);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, size, size);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.shadowProgram!);
    gl.enable(gl.SCISSOR_TEST);
    const tileSize = scene.shadows.mapSize;
    for (let tile = 0; tile < this.atlas.count; tile++) {
      const x = (tile % this.atlas.grid) * tileSize;
      const y = Math.floor(tile / this.atlas.grid) * tileSize;
      gl.viewport(x, y, tileSize, tileSize);
      gl.scissor(x, y, tileSize, tileSize);
      gl.uniformMatrix4fv(
        uniforms.viewProjection,
        false,
        this.atlas.matrices[tile]!.elements,
      );
      gl.disable(gl.CULL_FACE);
      for (const object of scene.objects) {
        if (
          !(object instanceof Mesh) ||
          !object.worldVisible ||
          !object.castShadow ||
          (object.material.opacity <= 0 &&
            (!(object.material instanceof PBRMaterial) ||
              object.material.alphaMode === 'BLEND')) ||
          object.material.texture.destroyed ||
          object.geometry.indices.length === 0
        )
          continue;
        object.updateRenderDeformation();
        const material = object.material;
        const pbr = material instanceof PBRMaterial;
        gl.uniform1f(uniforms.alphaCutoff, pbr ? material.alphaCutoff : 0);
        gl.uniform1f(uniforms.opacity, material.opacity);
        gl.uniform1i(
          uniforms.doubleSided,
          pbr && !material.doubleSided ? 0 : 1,
        );
        gl.uniform1i(
          uniforms.alphaMode,
          pbr
            ? material.alphaMode === 'OPAQUE'
              ? 0
              : material.alphaMode === 'MASK'
                ? 1
                : 2
            : 2,
        );
        this.bindMaterialTexture(
          material.texture,
          0,
          pbr ? material.textureSampler : undefined,
        );
        this.drawMesh(object, uniforms);
        this.stats.shadowDrawCalls++;
      }
    }
    gl.disable(gl.SCISSOR_TEST);
  }

  private preparePostTarget(width: number, height: number): void {
    if (!this.floatColorBuffer)
      throw new GraphicsError(
        `WebGL2 ${this.weighted ? 'weighted transparency' : 'HDR rendering'} requires EXT_color_buffer_float.`,
      );
    if (this.postTarget?.width === width && this.postTarget.height === height)
      return;
    this.releaseOIT();
    if (this.postTarget) this.deleteTarget(this.postTarget);
    this.postTarget = undefined;
    this.postTarget = this.createTarget(width, height, false, 'hdr', 'texture');
  }

  private prepareRefractionTarget(width: number, height: number): void {
    if (
      this.refractionTarget?.width === width &&
      this.refractionTarget.height === height
    )
      return;
    if (this.refractionTarget) this.deleteTarget(this.refractionTarget);
    this.refractionTarget = undefined;
    this.refractionTarget = this.createTarget(
      width,
      height,
      false,
      'hdr',
      false,
    );
  }

  private prepareOIT(width: number, height: number): void {
    const gl = this.gl!;
    if (
      this.oitAccumulation?.width === width &&
      this.oitAccumulation.height === height
    )
      return;
    this.releaseOIT();
    try {
      this.oitAccumulation = this.createTarget(
        width,
        height,
        false,
        'hdr',
        false,
      );
      this.oitRevealage = this.createTarget(
        width,
        height,
        false,
        'rgba8',
        false,
      );
      for (const target of [this.oitAccumulation, this.oitRevealage]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.TEXTURE_2D,
          this.postTarget!.depthTexture!,
          0,
        );
        if (
          gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE
        )
          throw new GraphicsError(
            'WebGL2 weighted transparency framebuffer is incomplete.',
          );
      }
      if (!this.oitProgram) {
        this.oitProgram = this.createProgram(
          gl,
          postVertex,
          oitCompositeGLSL,
          'weighted transparency',
        );
        gl.useProgram(this.oitProgram);
        gl.uniform1i(gl.getUniformLocation(this.oitProgram, 'accumulation'), 0);
        gl.uniform1i(gl.getUniformLocation(this.oitProgram, 'revealage'), 1);
      }
    } catch (error) {
      this.releaseOIT();
      throw error;
    }
  }

  private resolveOIT(): void {
    const gl = this.gl!,
      program = this.oitProgram!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.postTarget!.framebuffer);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.bindVertexArray(this.triangleVAO!);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindSampler(0, null);
    gl.bindTexture(gl.TEXTURE_2D, this.oitAccumulation!.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindSampler(1, null);
    gl.bindTexture(gl.TEXTURE_2D, this.oitRevealage!.texture);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  private releaseOIT(): void {
    if (this.oitAccumulation) this.deleteTarget(this.oitAccumulation);
    if (this.oitRevealage) this.deleteTarget(this.oitRevealage);
    this.oitAccumulation = this.oitRevealage = undefined;
  }

  private createTarget(
    width: number,
    height: number,
    shadow: boolean,
    format: 'hdr' | 'rgba8' = 'hdr',
    withDepth: boolean | 'texture' = true,
  ): RenderTarget {
    const gl = this.gl!;
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    const depth =
      shadow || !withDepth || withDepth === 'texture'
        ? null
        : gl.createRenderbuffer();
    const depthTexture =
      !shadow && withDepth === 'texture' ? gl.createTexture() : null;
    try {
      if (
        !framebuffer ||
        !texture ||
        (!shadow && withDepth && !depth && !depthTexture)
      )
        throw new GraphicsError(
          'WebGL2 could not allocate an offscreen render target.',
        );
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const filter = !shadow && format === 'rgba8' ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (shadow) {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.DEPTH_COMPONENT24,
          width,
          height,
          0,
          gl.DEPTH_COMPONENT,
          gl.UNSIGNED_INT,
          null,
        );
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
      } else {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          format === 'hdr' ? gl.RGBA16F : gl.RGBA8,
          width,
          height,
          0,
          gl.RGBA,
          format === 'hdr' ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
          null,
        );
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        if (depth) {
          gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
          gl.renderbufferStorage(
            gl.RENDERBUFFER,
            gl.DEPTH_COMPONENT24,
            width,
            height,
          );
          gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            depth,
          );
        }
        if (depthTexture) {
          gl.bindTexture(gl.TEXTURE_2D, depthTexture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT24,
            width,
            height,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_INT,
            null,
          );
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            depthTexture,
            0,
          );
        }
      }
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw new GraphicsError(
          `WebGL2 ${shadow ? 'shadow' : format === 'hdr' ? 'HDR' : 'RGBA8'} framebuffer is incomplete.`,
        );
      const target: RenderTarget = {
        framebuffer,
        texture,
        ...(depth ? { depth } : {}),
        ...(depthTexture ? { depthTexture } : {}),
        width,
        height,
      };
      const bytes =
        width *
        height *
        ((shadow ? 4 : format === 'hdr' ? 8 : 4) +
          (depth || depthTexture ? 4 : 0));
      this.targetBytes.set(target, bytes);
      this.stats.target(bytes);
      return target;
    } catch (error) {
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      if (texture) gl.deleteTexture(texture);
      if (depth) gl.deleteRenderbuffer(depth);
      if (depthTexture) gl.deleteTexture(depthTexture);
      throw error;
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
  }

  private deleteTarget(target: RenderTarget): void {
    const gl = this.gl!;
    const bytes = this.targetBytes.get(target);
    if (bytes !== undefined) {
      this.stats.target(-bytes);
      this.targetBytes.delete(target);
    }
    gl.deleteFramebuffer(target.framebuffer);
    gl.deleteTexture(target.texture);
    if (target.depth) gl.deleteRenderbuffer(target.depth);
    if (target.depthTexture) gl.deleteTexture(target.depthTexture);
  }

  private drawPost(scene: Scene, destination: WebGLFramebuffer | null): void {
    const gl = this.gl!;
    const settings = scene.postProcessing;
    const enabled = settings.enabled;
    const fxaa = enabled && settings.fxaa;
    if (fxaa) {
      if (
        !this.fxaaTarget ||
        this.fxaaTarget.width !== this.postTarget!.width ||
        this.fxaaTarget.height !== this.postTarget!.height
      ) {
        if (this.fxaaTarget) this.deleteTarget(this.fxaaTarget);
        this.fxaaTarget = undefined;
        this.fxaaTarget = this.createTarget(
          this.postTarget!.width,
          this.postTarget!.height,
          false,
          'rgba8',
          false,
        );
      }
    } else if (this.fxaaTarget) {
      this.deleteTarget(this.fxaaTarget);
      this.fxaaTarget = undefined;
    }
    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      fxaa ? this.fxaaTarget!.framebuffer : destination,
    );
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.postProgram!);
    gl.bindVertexArray(this.triangleVAO!);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindSampler(0, null);
    gl.bindTexture(gl.TEXTURE_2D, this.postTarget!.texture);
    gl.uniform4f(
      this.postUniforms.settings,
      enabled ? settings.exposure : 1,
      enabled ? settings.bloomStrength : 0,
      settings.bloomThreshold,
      settings.bloomRadius,
    );
    gl.uniform1i(
      this.postUniforms.aces,
      enabled && settings.toneMapping === 'aces' ? 1 : 0,
    );
    gl.activeTexture(gl.TEXTURE1);
    gl.bindSampler(1, null);
    gl.bindTexture(gl.TEXTURE_2D, this.postTarget!.depthTexture!);
    gl.uniform1i(this.postUniforms.depthImage, 1);
    this.invViewProjection.copy(scene.camera3D.matrix).invert();
    gl.uniformMatrix4fv(
      this.postUniforms.inverseVP,
      false,
      this.invViewProjection.elements,
    );
    const camera = scene.camera3D;
    const e = camera.matrix.elements;
    gl.uniform4f(
      this.postUniforms.clip,
      camera.near,
      camera.far,
      camera instanceof OrthographicCamera ? 1 : 0,
      Math.hypot(e[1]!, e[5]!, e[9]!),
    );
    gl.uniform4f(
      this.postUniforms.ssao,
      enabled && settings.ssao ? 1 : 0,
      settings.ssaoRadius,
      settings.ssaoStrength,
      settings.ssaoBias,
    );
    gl.uniform4f(
      this.postUniforms.dof,
      enabled && settings.depthOfField ? 1 : 0,
      settings.dofFocusDistance,
      settings.dofFocusRange,
      settings.dofBlurRadius,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (fxaa) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.useProgram(this.fxaaProgram!);
      gl.bindTexture(gl.TEXTURE_2D, this.fxaaTarget!.texture);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  private decodeColor(value: number): number {
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }

  private cacheTexture(texture: Texture2DSource): CachedTexture {
    if (texture.kind === 'render')
      throw new GraphicsError(
        'Render textures are managed by the native 2D target owner.',
      );
    if (texture.destroyed)
      throw new GraphicsError('Cannot upload a destroyed texture.');
    const existing = this.textures.get(texture);
    if (existing?.version === texture.version) {
      existing.allocation.touch();
      return existing;
    }
    const gl = this.gl!;
    const { width, height } = texture;
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > this.maxTextureSize ||
      height > this.maxTextureSize
    )
      throw new GraphicsError(
        `WebGL2 texture size ${width}×${height} exceeds its device budget.`,
      );
    const native = texture instanceof NativeTexture2D;
    if (native && !this.supportedTextureFormats.includes(texture.format))
      throw new GraphicsError(
        `WebGL2 does not support native texture format ${texture.format}.`,
      );
    const bytes = native ? texture.byteLength : width * height * 4;
    const allocation =
      existing?.allocation ??
      this.residency.textures.allocate(bytes, () => {
        const cached = this.textures.get(texture);
        if (cached) gl.deleteTexture(cached.resource);
        this.textures.delete(texture);
      });
    if (existing) allocation.resize(bytes);
    const resource = existing?.resource ?? gl.createTexture();
    if (!resource) {
      allocation.destroy();
      throw new GraphicsError('WebGL2 could not allocate a texture.');
    }
    try {
      gl.bindTexture(gl.TEXTURE_2D, resource);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        native ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAX_LEVEL,
        native ? texture.levels.length - 1 : 0,
      );
      if (native) uploadNativeWebGL(gl, texture);
      else
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          texture.image,
        );
      this.stats.upload(bytes);
      const error = gl.getError();
      if (error !== gl.NO_ERROR)
        throw new GraphicsError(
          `WebGL2 texture upload failed (GL error 0x${error.toString(16)}).`,
        );
      const entry = existing ?? {
        resource,
        allocation,
        seen: this.frame,
        version: texture.version,
        prepared: false,
      };
      entry.version = texture.version;
      this.textures.set(texture, entry);
      return entry;
    } catch (error) {
      if (!existing) gl.deleteTexture(resource);
      if (!existing) allocation.destroy();
      throw error;
    }
  }

  /** Uploads a half-float mip chain once per map; the map itself is immutable. */
  private uploadEnvironment(map: EnvironmentMap): CachedEnvironment {
    const existing = this.environments.get(map);
    if (existing) {
      existing.allocation.touch();
      existing.seen = this.frame;
      return existing;
    }
    const gl = this.gl!;
    const base = map.levelSizes[0];
    if (base.width > this.maxTextureSize || base.height > this.maxTextureSize)
      throw new GraphicsError(
        `WebGL2 environment ${base.width}x${base.height} exceeds its device budget.`,
      );
    const allocation = this.residency.textures.allocate(
      map.levelSizes.reduce(
        (bytes, level) => bytes + level.width * level.height * 8,
        0,
      ),
      () => {
        const cached = this.environments.get(map);
        if (cached) gl.deleteTexture(cached.resource);
        this.environments.delete(map);
      },
    );
    const resource = gl.createTexture();
    if (!resource) {
      allocation.destroy();
      throw new GraphicsError('WebGL2 could not allocate a texture.');
    }
    try {
      gl.bindTexture(gl.TEXTURE_2D, resource);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, map.mipCount - 1);
      for (let level = 0; level < map.mipCount; level++) {
        const size = map.levelSizes[level];
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          gl.RGBA16F,
          size.width,
          size.height,
          0,
          gl.RGBA,
          gl.HALF_FLOAT,
          map.levels[level],
        );
        this.stats.upload(map.levels[level].byteLength);
      }
      const error = gl.getError();
      if (error !== gl.NO_ERROR)
        throw new GraphicsError(
          `WebGL2 environment upload failed (GL error 0x${error.toString(16)}).`,
        );
      const entry = { resource, allocation, seen: this.frame };
      this.environments.set(map, entry);
      return entry;
    } catch (error) {
      gl.deleteTexture(resource);
      allocation.destroy();
      throw error;
    }
  }

  private drawSky(scene: Scene, aspect: number, map: EnvironmentMap): void {
    const gl = this.gl!;
    this.invViewProjection.copy(scene.camera3D.updateMatrix(aspect)).invert();
    gl.useProgram(this.skyProgram!);
    gl.uniformMatrix4fv(
      this.skyUniforms.invViewProjection,
      false,
      this.invViewProjection.elements,
    );
    gl.uniform2f(
      this.skyUniforms.sky,
      scene.backgroundIntensity,
      this.linear3D ? 1 : 0,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindSampler(0, null);
    gl.bindTexture(gl.TEXTURE_2D, this.uploadEnvironment(map).resource);
    // Sky is opaque and never occludes: it neither tests nor writes depth.
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(this.skyVAO!);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  /** Uploads or removes the per-vertex colors; the geometry's VAO must be bound. */
  private syncVertexColors(entry: CachedGeometry, geometry: Geometry): void {
    const gl = this.gl!;
    const colors = geometry.colors;
    if (!colors) {
      if (entry.colors) {
        gl.deleteBuffer(entry.colors);
        entry.colors = undefined;
        entry.colorBytes = 0;
      }
      gl.disableVertexAttribArray(8);
      return;
    }
    if (!entry.colors) entry.colors = this.createBuffer(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, entry.colors);
    if (entry.colorBytes === colors.byteLength)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, colors);
    else {
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
      entry.colorBytes = colors.byteLength;
    }
    this.stats.upload(colors.byteLength);
    gl.enableVertexAttribArray(8);
    gl.vertexAttribPointer(8, 4, gl.FLOAT, false, 16, 0);
  }

  private cacheGeometry(geometry: Geometry): CachedGeometry {
    const gl = this.gl!;
    const existing = this.geometries.get(geometry);
    if (existing) {
      existing.allocation.resize(
        geometry.vertices.byteLength +
          geometry.indices.byteLength +
          (geometry.colors?.byteLength ?? 0),
      );
      if (existing.version !== geometry.version) {
        gl.bindVertexArray(existing.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, existing.vertex);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, geometry.vertices);
        this.stats.upload(geometry.vertices.byteLength);
        this.syncVertexColors(existing, geometry);
        existing.version = geometry.version;
      }
      return existing;
    }
    const allocation = this.residency.geometry.allocate(
      geometry.vertices.byteLength +
        geometry.indices.byteLength +
        (geometry.colors?.byteLength ?? 0),
      () => {
        const cached = this.geometries.get(geometry);
        if (!cached) return;
        gl.deleteVertexArray(cached.vao);
        gl.deleteBuffer(cached.vertex);
        gl.deleteBuffer(cached.index);
        if (cached.colors) gl.deleteBuffer(cached.colors);
        this.geometries.delete(geometry);
      },
    );
    let vao: WebGLVertexArrayObject | undefined;
    let vertex: WebGLBuffer | undefined;
    let index: WebGLBuffer | undefined;
    try {
      vao = this.createVAO(gl);
      vertex = this.createBuffer(gl);
      index = this.createBuffer(gl);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      this.stats.upload(
        geometry.vertices.byteLength + geometry.indices.byteLength,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
      const entry: CachedGeometry = {
        allocation,
        vao,
        vertex,
        index,
        colors: undefined,
        colorBytes: 0,
        seen: this.frame,
        version: geometry.version,
      };
      try {
        this.syncVertexColors(entry, geometry);
      } catch (error) {
        if (entry.colors) gl.deleteBuffer(entry.colors);
        throw error;
      }
      gl.bindVertexArray(null);
      this.geometries.set(geometry, entry);
      return entry;
    } catch (error) {
      gl.bindVertexArray(null);
      if (index) gl.deleteBuffer(index);
      if (vertex) gl.deleteBuffer(vertex);
      if (vao) gl.deleteVertexArray(vao);
      allocation.destroy();
      throw error;
    }
  }

  private releaseUnused(): void {
    for (const [texture, entry] of this.textures)
      if (
        texture.destroyed ||
        (this.residency.textures.budgetBytes === Infinity &&
          entry.seen !== this.frame &&
          !entry.allocation.references)
      )
        entry.allocation.destroy();
    if (this.residency.geometry.budgetBytes === Infinity) {
      for (const entry of this.geometries.values())
        if (entry.seen !== this.frame && !entry.allocation.references)
          entry.allocation.destroy();
      for (const entry of this.meshInstances.values())
        if (entry.seen !== this.frame && !entry.allocation.references)
          entry.allocation.destroy();
      for (const entry of this.meshSkins.values())
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
    for (const [material, entry] of this.opticalTextures)
      if (
        material.transmissionTexture?.destroyed ||
        material.thicknessTexture?.destroyed ||
        (this.residency.textures.budgetBytes === Infinity &&
          entry.seen !== this.frame &&
          !entry.allocation.references)
      )
        entry.allocation.destroy();
  }

  private createBuffer(gl: WebGL2RenderingContext): WebGLBuffer {
    const buffer = gl.createBuffer();
    if (!buffer)
      throw new WebGL2InitializationError(
        'WebGL2 could not allocate a buffer.',
      );
    return buffer;
  }

  private createVAO(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
    const vao = gl.createVertexArray();
    if (!vao)
      throw new WebGL2InitializationError(
        'WebGL2 could not allocate a vertex array.',
      );
    return vao;
  }

  private createProgram(
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string,
    label: string,
  ): WebGLProgram {
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    try {
      for (const [kind, source] of [
        [gl.VERTEX_SHADER, vertexSource],
        [gl.FRAGMENT_SHADER, fragmentSource],
      ] as const) {
        const shader = gl.createShader(kind);
        if (!shader)
          throw new WebGL2InitializationError(
            `WebGL2 ${label} shader allocation failed.`,
          );
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new WebGL2InitializationError(
            `WebGL2 ${label} ${kind === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader compilation failed: ${gl.getShaderInfoLog(shader) || 'unknown error'}`,
          );
      }
      program = gl.createProgram();
      if (!program)
        throw new WebGL2InitializationError(
          `WebGL2 ${label} program allocation failed.`,
        );
      for (const shader of shaders) gl.attachShader(program, shader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new WebGL2InitializationError(
          `WebGL2 ${label} program linking failed: ${gl.getProgramInfoLog(program) || 'unknown error'}`,
        );
      return program;
    } catch (error) {
      if (program) gl.deleteProgram(program);
      throw error;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.canvas?.removeEventListener('webglcontextlost', this.onContextLost);
    const gl = this.gl;
    if (gl) {
      this.residency.clear();
      this.preparedGeometry.clear();
      this.releaseOIT();
      if (this.oitProgram) gl.deleteProgram(this.oitProgram);
      this.oitProgram = undefined;
      this.render2D?.destroy();
      for (const snapshot of this.snapshots.keys()) snapshot.destroy();
      for (const [effect, entry] of this.materials) {
        effect.removeEventListener('destroy', entry.onDestroy);
        gl.deleteProgram(entry.program);
      }
      for (const [effect, entry] of this.processors) {
        effect.removeEventListener('destroy', entry.onDestroy);
        gl.deleteProgram(entry.program);
      }
      if (this.frameTarget) this.deleteTarget(this.frameTarget);
      if (this.layerTarget) this.deleteTarget(this.layerTarget);
      if (this.effectTarget) this.deleteTarget(this.effectTarget);
      if (this.sceneTarget) this.deleteTarget(this.sceneTarget);
      if (this.compositeProgram) gl.deleteProgram(this.compositeProgram);
      for (const entry of this.textures.values())
        gl.deleteTexture(entry.resource);
      for (const entry of this.geometries.values()) {
        gl.deleteVertexArray(entry.vao);
        gl.deleteBuffer(entry.vertex);
        gl.deleteBuffer(entry.index);
        if (entry.colors) gl.deleteBuffer(entry.colors);
      }
      for (const entry of this.meshInstances.values()) {
        gl.deleteBuffer(entry.buffer);
        if (entry.colors) gl.deleteBuffer(entry.colors);
      }
      for (const entry of this.meshSkins.values()) {
        gl.deleteBuffer(entry.indices);
        gl.deleteBuffer(entry.weights);
        gl.deleteTexture(entry.palette);
      }
      for (const sampler of this.samplers.values()) gl.deleteSampler(sampler);
      if (this.shadowTarget) this.deleteTarget(this.shadowTarget);
      if (this.shadowBuffer) gl.deleteBuffer(this.shadowBuffer);
      if (this.sheenBuffer) gl.deleteBuffer(this.sheenBuffer);
      if (this.refractionTarget) this.deleteTarget(this.refractionTarget);
      if (this.emptyOptical) gl.deleteTexture(this.emptyOptical);
      if (this.opticalPackProgram) gl.deleteProgram(this.opticalPackProgram);
      if (this.opticalPackFramebuffer)
        gl.deleteFramebuffer(this.opticalPackFramebuffer);
      for (const entry of this.opticalTextures.values())
        gl.deleteTexture(entry.resource);
      if (this.postTarget) this.deleteTarget(this.postTarget);
      if (this.fxaaTarget) this.deleteTarget(this.fxaaTarget);
      if (this.fxaaProgram) gl.deleteProgram(this.fxaaProgram);
      if (this.shadowProgram) gl.deleteProgram(this.shadowProgram);
      if (this.postProgram) gl.deleteProgram(this.postProgram);
      if (this.triangleVAO) gl.deleteVertexArray(this.triangleVAO);
      if (this.triangleProgram) gl.deleteProgram(this.triangleProgram);
      if (this.meshProgram) gl.deleteProgram(this.meshProgram);
      if (this.skyProgram) gl.deleteProgram(this.skyProgram);
      if (this.skyVAO) gl.deleteVertexArray(this.skyVAO);
      for (const entry of this.environments.values())
        gl.deleteTexture(entry.resource);
    }
    this.textures.clear();
    this.geometries.clear();
    this.meshInstances.clear();
    this.meshSkins.clear();
    this.environments.clear();
    this.samplers.clear();
    this.opticalTextures.clear();
    this.snapshots.clear();
    this.materials.clear();
    this.processors.clear();
    this.frameTarget = undefined;
    this.layerTarget = undefined;
    this.effectTarget = undefined;
    this.sceneTarget = undefined;
    this.shadowTarget = undefined;
    this.postTarget = undefined;
    this.refractionTarget = undefined;
    this.fxaaTarget = undefined;
    this.meshDraws.length = 0;
    this.render2D = undefined;
    this.commands.destroy();
    this.gl = undefined;
    this.canvas = undefined;
    this.activeFrame = false;
  }

  private requireGL(): WebGL2RenderingContext {
    if (this.lostError) throw this.lostError;
    if (this.destroyed || !this.gl || !this.meshProgram)
      throw new GraphicsError(
        'WebGL2 renderer is not initialized or has already been destroyed.',
      );
    return this.gl;
  }
}
