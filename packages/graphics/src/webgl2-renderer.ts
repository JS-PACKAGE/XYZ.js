import type { Scene } from '../../core/src/scene.js';
import { Frustum } from '../../core/src/frustum.js';
import { Mesh } from '../../core/src/mesh.js';
import {
  type Material2D,
  type PostProcessor2D,
  validateEffect2D,
} from '../../core/src/materials2d/material2d.js';
import type { Geometry } from '../../core/src/geometry.js';
import { InstancedMesh } from '../../core/src/instanced-mesh.js';
import {
  PBRMaterial,
  type TextureSamplerOptions,
} from '../../core/src/pbr-material.js';
import {
  activeBackground,
  activeEnvironment,
  computeShadowMatrix,
  fillEnvironmentData,
  fillFogData,
  fillLightingData,
  validateRenderSettings,
} from '../../core/src/render-data.js';
import type { EnvironmentMap } from '../../core/src/environment.js';
import { Matrix4 } from '../../math/src/index.js';
import {
  meshVertex,
  meshFragment,
  shadowFragment,
  postVertex,
  postFragment,
  skyVertex,
  skyFragment,
} from './webgl-feature-shaders.js';
import { type Texture2DSource, Texture } from '../../assets/src/index.js';
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
  FOG_FLOAT_COUNT,
  LIGHTING_FLOAT_COUNT,
} from '../../../src/data/rendering.js';
import { defaults } from '../../../src/data/defaults.js';
import {
  GraphicsError,
  WebGL2ContextLostError,
  WebGL2InitializationError,
} from './errors.js';
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

interface CachedEnvironment {
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
  resource: WebGLTexture;
  seen: number;
  version: number;
  prepared: boolean;
}
interface CachedGeometry {
  vao: WebGLVertexArrayObject;
  vertex: WebGLBuffer;
  index: WebGLBuffer;
  seen: number;
  version: number;
}

interface CachedInstances {
  buffer: WebGLBuffer;
  version: number;
  seen: number;
}

interface RenderTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  depth?: WebGLRenderbuffer;
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
  private readonly environmentData = new Float32Array(ENVIRONMENT_FLOAT_COUNT);
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
  private readonly samplers = new Map<number, WebGLSampler>();
  private readonly shadowMatrix = new Matrix4();
  private shadowTarget: RenderTarget | undefined;
  private postTarget: RenderTarget | undefined;
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

  get capabilities(): GraphicsCapabilities {
    return {
      threeD: true,
      compute: false,
      customShaders: true,
      storageBuffers: false,
      instancing: true,
      maxTextureSize: this.maxTextureSize,
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
      for (const name of [
        'viewProjection',
        'model',
        'instanced',
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
        'shadowMatrix',
        'shadowSettings',
        'image',
        'metallicRoughnessMap',
        'normalMap',
        'occlusionMap',
        'emissiveMap',
        'shadowMap',
        'environment[0]',
        'environmentMap',
        'fog[0]',
      ])
        this.meshUniforms[name] = gl.getUniformLocation(this.meshProgram, name);
      for (const name of [
        'viewProjection',
        'model',
        'instanced',
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
      for (const name of ['image', 'settings', 'aces'])
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
      else this.cacheTexture(source).prepared = true;
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
      this.gl!.deleteTexture(entry.resource);
      this.textures.delete(source);
    }
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
    this.frameRendered = false;
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
      this.endFrame();
      const snapshot = new WebGLSnapshot(target.width, target.height, () => {
        this.snapshots.delete(snapshot);
        this.deleteTarget(target);
      });
      this.snapshots.set(snapshot, target);
      return snapshot;
    } catch (error) {
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
      if (effects?.length) {
        for (const effect of effects) this.requireNative(effect, true);
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
      if (scene) {
        validateRenderSettings(scene);
        fillLightingData(scene, this.lightingData);
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
        if (scene.postProcessing.enabled)
          this.preparePostTarget(canvas.width, canvas.height);
        else if (this.postTarget) {
          this.deleteTarget(this.postTarget);
          this.postTarget = undefined;
        }
      } else this.commands.clear();
      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        scene?.postProcessing.enabled
          ? this.postTarget!.framebuffer
          : (destination?.framebuffer ?? null),
      );
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(
        scene?.postProcessing.enabled
          ? this.decodeColor(defaults.clearColor.r)
          : defaults.clearColor.r,
        scene?.postProcessing.enabled
          ? this.decodeColor(defaults.clearColor.g)
          : defaults.clearColor.g,
        scene?.postProcessing.enabled
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
        if (scene.postProcessing.enabled)
          this.drawPost(scene, destination?.framebuffer ?? null);
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

  endFrame(): void {
    const gl = this.requireGL();
    if (!this.activeFrame || !this.frameRendered)
      throw new GraphicsError('WebGL2 endFrame requires a rendered frame.');
    gl.flush();
    this.activeFrame = false;
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
      this.deleteTarget(this.postTarget);
      this.postTarget = undefined;
    }
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      if (this.frameTarget) this.deleteTarget(this.frameTarget);
      if (this.layerTarget) this.deleteTarget(this.layerTarget);
      if (this.effectTarget) this.deleteTarget(this.effectTarget);
      this.frameTarget = undefined;
      this.layerTarget = undefined;
      this.effectTarget = undefined;
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
  ): void {
    const gl = this.gl!;
    let input = this.layerTarget!;
    let output = this.effectTarget!;
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
      const swap = input;
      input = output;
      output = swap;
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
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
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
    fillEnvironmentData(scene, this.environmentData);
    gl.uniform4fv(uniforms['environment[0]'], this.environmentData);
    fillFogData(scene, this.fogData);
    gl.uniform4fv(uniforms['fog[0]'], this.fogData);
    const environment = activeEnvironment(scene);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindSampler(6, null);
    gl.bindTexture(
      gl.TEXTURE_2D,
      environment ? this.uploadEnvironment(environment).resource : null,
    );
    const camera = scene.camera3D.position;
    gl.uniform3f(uniforms.cameraPosition, camera.x, camera.y, camera.z);
    gl.uniform1i(uniforms.linearOutput, scene.postProcessing.enabled ? 1 : 0);
    gl.uniformMatrix4fv(
      uniforms.shadowMatrix,
      false,
      this.shadowMatrix.elements,
    );
    gl.activeTexture(gl.TEXTURE5);
    gl.bindSampler(5, null);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowTarget?.texture ?? null);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    // Shader-side winding handles mixed mirrored instances in a single draw.
    gl.disable(gl.CULL_FACE);
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
      if (!object.isInFrustum(this.frustum)) continue;
      object.updateDeformation();
      const material = object.material;
      const pbr = material instanceof PBRMaterial;
      gl.uniform1i(uniforms.pbr, pbr ? 1 : 0);
      gl.uniform1i(uniforms.doubleSided, pbr && !material.doubleSided ? 0 : 1);
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
      gl.uniform4f(
        uniforms.shadowSettings,
        scene.shadows.enabled ? 1 : 0,
        object.receiveShadow ? 1 : 0,
        scene.shadows.bias,
        1 / scene.shadows.mapSize,
      );
      this.bindMaterialTexture(
        material.texture,
        0,
        pbr ? material.textureSampler : undefined,
      );
      if (pbr) {
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
    }
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
    const key = min + mag * 2 + u * 4 + v * 12;
    // Texture uploads already use linear/clamp, so no sampler object is needed.
    if (key === 3) return null;
    const existing = this.samplers.get(key);
    if (existing) return existing;
    const gl = this.gl!;
    const sampler = gl.createSampler();
    if (!sampler)
      throw new GraphicsError('WebGL2 could not allocate a material sampler.');
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_MIN_FILTER,
      min ? gl.LINEAR : gl.NEAREST,
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
    this.samplers.set(key, sampler);
    return sampler;
  }

  private drawMesh(
    mesh: Mesh,
    uniforms: Record<string, WebGLUniformLocation | null>,
  ): void {
    const gl = this.gl!;
    const geometry = this.cacheGeometry(mesh.geometry);
    geometry.seen = this.frame;
    gl.uniformMatrix4fv(
      uniforms.model,
      false,
      mesh.updateWorldMatrix().elements,
    );
    gl.bindVertexArray(geometry.vao);
    if (mesh instanceof InstancedMesh) {
      let entry = this.meshInstances.get(mesh);
      if (!entry) {
        const buffer = this.createBuffer(gl);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.matrices, gl.DYNAMIC_DRAW);
        entry = { buffer, version: mesh.version, seen: this.frame };
        this.meshInstances.set(mesh, entry);
      } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer);
        if (entry.version !== mesh.version) {
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.matrices);
          entry.version = mesh.version;
        }
      }
      entry.seen = this.frame;
      for (let column = 0; column < 4; column++) {
        gl.enableVertexAttribArray(3 + column);
        gl.vertexAttribPointer(3 + column, 4, gl.FLOAT, false, 64, column * 16);
        gl.vertexAttribDivisor(3 + column, 1);
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
      gl.uniform1i(uniforms.instanced, 0);
      gl.drawElements(
        gl.TRIANGLES,
        mesh.geometry.indices.length,
        gl.UNSIGNED_INT,
        0,
      );
    }
  }

  private drawShadows(scene: Scene): void {
    const gl = this.gl!;
    const size = scene.shadows.mapSize;
    if (size > this.maxWidth || size > this.maxHeight)
      throw new GraphicsError(
        `WebGL2 shadow map size ${size} exceeds this device's framebuffer limit.`,
      );
    if (!this.shadowTarget || this.shadowTarget.width !== size) {
      if (this.shadowTarget) this.deleteTarget(this.shadowTarget);
      this.shadowTarget = undefined;
      this.shadowTarget = this.createTarget(size, size, true);
    }
    computeShadowMatrix(scene, this.shadowMatrix);
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
    gl.uniformMatrix4fv(
      uniforms.viewProjection,
      false,
      this.shadowMatrix.elements,
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
      object.updateDeformation();
      const material = object.material;
      const pbr = material instanceof PBRMaterial;
      gl.uniform1f(uniforms.alphaCutoff, pbr ? material.alphaCutoff : 0);
      gl.uniform1f(uniforms.opacity, material.opacity);
      gl.uniform1i(uniforms.doubleSided, pbr && !material.doubleSided ? 0 : 1);
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
    }
  }

  private preparePostTarget(width: number, height: number): void {
    if (!this.floatColorBuffer)
      throw new GraphicsError(
        'WebGL2 HDR postprocessing requires EXT_color_buffer_float.',
      );
    if (this.postTarget?.width === width && this.postTarget.height === height)
      return;
    if (this.postTarget) this.deleteTarget(this.postTarget);
    this.postTarget = undefined;
    this.postTarget = this.createTarget(width, height, false);
  }

  private createTarget(
    width: number,
    height: number,
    shadow: boolean,
    format: 'hdr' | 'rgba8' = 'hdr',
    withDepth = true,
  ): RenderTarget {
    const gl = this.gl!;
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    const depth = shadow || !withDepth ? null : gl.createRenderbuffer();
    try {
      if (!framebuffer || !texture || (!shadow && withDepth && !depth))
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
      }
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw new GraphicsError(
          `WebGL2 ${shadow ? 'shadow' : format === 'hdr' ? 'HDR' : 'RGBA8'} framebuffer is incomplete.`,
        );
      return {
        framebuffer,
        texture,
        ...(depth ? { depth } : {}),
        width,
        height,
      };
    } catch (error) {
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      if (texture) gl.deleteTexture(texture);
      if (depth) gl.deleteRenderbuffer(depth);
      throw error;
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
  }

  private deleteTarget(target: RenderTarget): void {
    const gl = this.gl!;
    gl.deleteFramebuffer(target.framebuffer);
    gl.deleteTexture(target.texture);
    if (target.depth) gl.deleteRenderbuffer(target.depth);
  }

  private drawPost(scene: Scene, destination: WebGLFramebuffer | null): void {
    const gl = this.gl!;
    const settings = scene.postProcessing;
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
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
      settings.exposure,
      settings.bloomStrength,
      settings.bloomThreshold,
      settings.bloomRadius,
    );
    gl.uniform1i(
      this.postUniforms.aces,
      settings.toneMapping === 'aces' ? 1 : 0,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
    if (existing?.version === texture.version) return existing;
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
    const resource = existing?.resource ?? gl.createTexture();
    if (!resource)
      throw new GraphicsError('WebGL2 could not allocate a texture.');
    try {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, resource);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        texture.image,
      );
      const error = gl.getError();
      if (error !== gl.NO_ERROR)
        throw new GraphicsError(
          `WebGL2 texture upload failed (GL error 0x${error.toString(16)}).`,
        );
      const entry = existing ?? {
        resource,
        seen: this.frame,
        version: texture.version,
        prepared: false,
      };
      entry.version = texture.version;
      this.textures.set(texture, entry);
      return entry;
    } catch (error) {
      if (!existing) gl.deleteTexture(resource);
      throw error;
    }
  }

  /** Uploads a half-float mip chain once per map; the map itself is immutable. */
  private uploadEnvironment(map: EnvironmentMap): CachedEnvironment {
    const existing = this.environments.get(map);
    if (existing) {
      existing.seen = this.frame;
      return existing;
    }
    const gl = this.gl!;
    const base = map.levelSizes[0];
    if (base.width > this.maxTextureSize || base.height > this.maxTextureSize)
      throw new GraphicsError(
        `WebGL2 environment ${base.width}x${base.height} exceeds its device budget.`,
      );
    const resource = gl.createTexture();
    if (!resource)
      throw new GraphicsError('WebGL2 could not allocate a texture.');
    try {
      gl.activeTexture(gl.TEXTURE0);
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
      }
      const error = gl.getError();
      if (error !== gl.NO_ERROR)
        throw new GraphicsError(
          `WebGL2 environment upload failed (GL error 0x${error.toString(16)}).`,
        );
      const entry = { resource, seen: this.frame };
      this.environments.set(map, entry);
      return entry;
    } catch (error) {
      gl.deleteTexture(resource);
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
      scene.postProcessing.enabled ? 1 : 0,
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

  private cacheGeometry(geometry: Geometry): CachedGeometry {
    const gl = this.gl!;
    const existing = this.geometries.get(geometry);
    if (existing) {
      if (existing.version !== geometry.version) {
        gl.bindVertexArray(existing.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, existing.vertex);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, geometry.vertices);
        existing.version = geometry.version;
      }
      return existing;
    }
    const vao = this.createVAO(gl);
    let vertex: WebGLBuffer | undefined;
    let index: WebGLBuffer | undefined;
    try {
      vertex = this.createBuffer(gl);
      index = this.createBuffer(gl);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
      gl.bindVertexArray(null);
      const entry = {
        vao,
        vertex,
        index,
        seen: this.frame,
        version: geometry.version,
      };
      this.geometries.set(geometry, entry);
      return entry;
    } catch (error) {
      gl.bindVertexArray(null);
      if (index) gl.deleteBuffer(index);
      if (vertex) gl.deleteBuffer(vertex);
      gl.deleteVertexArray(vao);
      throw error;
    }
  }

  private releaseUnused(): void {
    const gl = this.gl!;
    for (const [texture, entry] of this.textures)
      if (texture.destroyed || (!entry.prepared && entry.seen !== this.frame)) {
        gl.deleteTexture(entry.resource);
        this.textures.delete(texture);
      }
    for (const [geometry, entry] of this.geometries)
      if (entry.seen !== this.frame) {
        gl.deleteVertexArray(entry.vao);
        gl.deleteBuffer(entry.vertex);
        gl.deleteBuffer(entry.index);
        this.geometries.delete(geometry);
      }
    for (const [mesh, entry] of this.meshInstances)
      if (entry.seen !== this.frame) {
        gl.deleteBuffer(entry.buffer);
        this.meshInstances.delete(mesh);
      }
    for (const [map, entry] of this.environments)
      if (map.destroyed || entry.seen !== this.frame) {
        gl.deleteTexture(entry.resource);
        this.environments.delete(map);
      }
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
      if (this.compositeProgram) gl.deleteProgram(this.compositeProgram);
      for (const entry of this.textures.values())
        gl.deleteTexture(entry.resource);
      for (const entry of this.geometries.values()) {
        gl.deleteVertexArray(entry.vao);
        gl.deleteBuffer(entry.vertex);
        gl.deleteBuffer(entry.index);
      }
      for (const entry of this.meshInstances.values())
        gl.deleteBuffer(entry.buffer);
      for (const sampler of this.samplers.values()) gl.deleteSampler(sampler);
      if (this.shadowTarget) this.deleteTarget(this.shadowTarget);
      if (this.postTarget) this.deleteTarget(this.postTarget);
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
    this.environments.clear();
    this.samplers.clear();
    this.snapshots.clear();
    this.materials.clear();
    this.processors.clear();
    this.frameTarget = undefined;
    this.layerTarget = undefined;
    this.effectTarget = undefined;
    this.shadowTarget = undefined;
    this.postTarget = undefined;
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
