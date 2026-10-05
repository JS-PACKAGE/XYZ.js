import { beginTimedRenderPass } from './gpu-timing.js';
import {
  Texture,
  type Texture2DSource,
  type TextureView2D,
} from '../../assets/src/index.js';
import type { Scene } from '../../core/src/scene.js';
import type { GameObject } from '../../core/src/game-object.js';
import type { Sprite } from '../../core/src/sprite.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import {
  IsolatedGroup2D,
  type BlendMode2D,
} from '../../core/src/rendering2d/isolated-group.js';
import type { Mesh2D } from '../../core/src/rendering2d/mesh2d.js';
import type { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import type { Mask2D } from '../../core/src/rendering2d/mask2d.js';
import {
  DisplacementFilter2D,
  type Filter2D,
} from '../../core/src/rendering2d/filters2d.js';
import {
  ParticleAttribute2D,
  type ParticleLayer2D,
} from '../../core/src/particles2d/particle-layer2d.js';
import { TilingSprite2D } from '../../core/src/graphics2d/tiling-sprite2d.js';
import { Matrix3 } from '../../math/src/index.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';
import { GraphicsError } from './errors.js';
import type { FrameStats } from './render-stats.js';
import {
  collectRenderCommands2D,
  RenderCommandBuffer2D,
} from './render2d-contract.js';
import {
  createTextureQuad2D,
  getTextureQuad2D,
  getSpriteQuad2D,
  getRelativeAppearance2D,
  QUAD_BYTES,
  QUAD_FLOATS,
  type TextureQuad2D,
} from './sprite-instance.js';
import {
  assertRenderTextureOwner2D,
  createOwnedRenderTexture2D,
  RenderTexture2D,
  validateRenderTextureDependencies2D,
  validateRenderTextureRegion2D,
  validateRenderTextureSize2D,
  type RenderTextureOptions2D,
} from './render-texture2d.js';
import {
  createQuadPipeline,
  premultipliedBlend,
  type GPUColorTarget,
  type WebGPU2DEffects,
} from './webgpu-2d/effects.js';
import {
  localPassWGSL,
  meshWGSL,
  quadWGSL,
} from './webgpu-render2d-shaders.js';
import type { NativeResidency, ResidencyAllocation } from './residency.js';
import { lightingWGSL, packLighting2D } from './lighting2d.js';
import { validateSpriteLighting2D } from '../../core/src/lighting2d.js';
import { getTextureDistanceField } from '../../assets/src/fonts/distance-field.js';

const SLOT_BYTES = 512;
const SLOT_FLOATS = SLOT_BYTES / 4;
const MESH_STRIDE = 20;
type Context2D = {
  scene: Scene;
  target: GPUColorTarget;
  bounds: Rect2D;
  root?: IsolatedGroup2D;
};
interface Layer2D {
  targets: GPUColorTarget[];
  bounds: Rect2D;
  version: number;
  result: GPUColorTarget;
  seen: number;
}
interface MeshBuffers2D {
  allocation: ResidencyAllocation;
  vertex: GPUBuffer;
  index: GPUBuffer;
  data: Float32Array;
  version: number;
  seen: number;
}
interface ParticleBuffers2D {
  allocation: ResidencyAllocation;
  buffer: GPUBuffer;
  data: Float32Array;
  versions: Float64Array;
  slots: Int32Array;
  sourceSizes: Float64Array;
  seen: number;
}
export interface WebGPURender2DHooks {
  owner: object;
  readonly stats: FrameStats;
  residency: NativeResidency;
  /** Uploads or reuses a CPU-backed source; render targets are owned here. */
  upload(source: Exclude<Texture2DSource, RenderTexture2D>): GPUTexture;
  assertIdle(): void;
  assertAlive(): void;
}

const blendStates: Readonly<Record<'add' | 'screen' | 'erase', GPUBlendState>> =
  {
    add: {
      color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
      alpha: {
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
      },
    },
    screen: {
      color: { srcFactor: 'one', dstFactor: 'one-minus-src', operation: 'add' },
      alpha: {
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
      },
    },
    erase: {
      color: {
        srcFactor: 'zero',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
      },
      alpha: {
        srcFactor: 'zero',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
      },
    },
  };

/** Native local command execution, independent from 3D and immutable frame capture. */
export class WebGPURender2D {
  private readonly quad = createTextureQuad2D();
  private readonly sourceQuad = createTextureQuad2D();
  private readonly appearance = new Float32Array(4);
  private readonly matrix = new Matrix3();
  private readonly mapping = new Matrix3();
  private readonly tileMatrix = new Matrix3();
  private readonly inverse = new Matrix3();
  private readonly layers = new Map<IsolatedGroup2D, Layer2D>();
  private readonly targets = new Map<RenderTexture2D, GPUColorTarget>();
  private readonly meshes = new Map<Geometry2D, MeshBuffers2D>();
  private readonly particles = new Map<ParticleLayer2D, ParticleBuffers2D>();
  private readonly captureCommands = new RenderCommandBuffer2D();
  private readonly dependencies: RenderTexture2D[] = [];
  private readonly groups = new WeakMap<
    GPUTexture,
    (GPUBindGroup | undefined)[]
  >();
  private readonly samplers: GPUSampler[] = [];
  private readonly retiredTextures: GPUTexture[] = [];
  private readonly retiredBuffers: GPUBuffer[] = [];
  private readonly scratch = new Float32Array(SLOT_FLOATS);
  private readonly uniformOffsets = [0];
  private readonly passLayout: GPUBindGroupLayout;
  private readonly passPipelineLayout: GPUPipelineLayout;
  private readonly normal: GPURenderPipeline;
  private readonly lighting: GPURenderPipeline;
  private readonly replace: GPURenderPipeline;
  private readonly blends: Readonly<
    Record<'add' | 'screen' | 'erase', GPURenderPipeline>
  >;
  private readonly multiply: GPURenderPipeline;
  private readonly meshPipeline: GPURenderPipeline;
  private readonly passPipeline: GPURenderPipeline;
  private readonly dummy: GPUTexture;
  private uniformBuffer: GPUBuffer;
  private drawGroup: GPUBindGroup;
  private instanceBuffer: GPUBuffer;
  private instanceData = new Float32Array(0);
  private uploadedUniforms = new Float32Array(SLOT_FLOATS).fill(NaN);
  private capacity = 0;
  private required = 0;
  private slot = 0;
  private encoder: GPUCommandEncoder | undefined;
  private pass: GPURenderPassEncoder | undefined;
  private passTarget: GPUColorTarget | undefined;
  private resolution = 1;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private frame = 0;
  private disposed = false;

  private constructor(
    private readonly device: GPUDevice,
    private readonly effects: WebGPU2DEffects,
    private readonly hooks: WebGPURender2DHooks,
    pipelines: {
      normal: GPURenderPipeline;
      lighting: GPURenderPipeline;
      replace: GPURenderPipeline;
      blends: Readonly<Record<'add' | 'screen' | 'erase', GPURenderPipeline>>;
      multiply: GPURenderPipeline;
      mesh: GPURenderPipeline;
      pass: GPURenderPipeline;
      passLayout: GPUBindGroupLayout;
      passPipelineLayout: GPUPipelineLayout;
    },
  ) {
    this.normal = pipelines.normal;
    this.lighting = pipelines.lighting;
    this.replace = pipelines.replace;
    this.blends = pipelines.blends;
    this.multiply = pipelines.multiply;
    this.meshPipeline = pipelines.mesh;
    this.passPipeline = pipelines.pass;
    this.passLayout = pipelines.passLayout;
    this.passPipelineLayout = pipelines.passPipelineLayout;
    this.dummy = device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING,
    });
    this.uniformBuffer = device.createBuffer({
      size: SLOT_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.instanceBuffer = device.createBuffer({
      size: QUAD_BYTES,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.instanceData = new Float32Array(QUAD_FLOATS);
    this.capacity = 1;
    this.drawGroup = this.createDrawGroup();
  }

  static async create(
    device: GPUDevice,
    effects: WebGPU2DEffects,
    hooks: WebGPURender2DHooks,
  ): Promise<WebGPURender2D> {
    const quadModule = await effects.module(quadWGSL(), '2D quad');
    const lightingModule = await effects.module(
      quadWGSL(lightingWGSL),
      '2D normal-map lighting',
    );
    const lightingLayout = device.createPipelineLayout({
      bindGroupLayouts: [
        effects.drawLayout,
        effects.spriteTextureLayout,
        effects.uniformLayout,
        effects.spriteTextureLayout,
      ],
    });
    const multiplyModule = await effects.module(
      quadWGSL(undefined, true),
      '2D multiply layer',
    );
    const meshModule = await effects.module(meshWGSL, '2D mesh');
    const passModule = await effects.module(
      localPassWGSL,
      '2D local filter and mask',
    );
    const passLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
        },
      ],
    });
    const passPipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [effects.drawLayout, passLayout],
    });
    const meshLayout = device.createPipelineLayout({
      bindGroupLayouts: [effects.drawLayout, effects.spriteTextureLayout],
    });
    const mesh = device.createRenderPipeline({
      layout: meshLayout,
      vertex: {
        module: meshModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: MESH_STRIDE,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x3' },
            ],
          },
        ],
      },
      fragment: {
        module: meshModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: 'rgba8unorm', blend: premultipliedBlend }],
      },
      primitive: { topology: 'triangle-list' },
    });
    const pass = device.createRenderPipeline({
      layout: passPipelineLayout,
      vertex: { module: passModule, entryPoint: 'vertexMain' },
      fragment: {
        module: passModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: 'rgba8unorm' }],
      },
      primitive: { topology: 'triangle-list' },
    });
    const layout = effects.quadLayout;
    return new WebGPURender2D(device, effects, hooks, {
      lighting: createQuadPipeline(device, lightingModule, lightingLayout),
      normal: createQuadPipeline(device, quadModule, layout),
      replace: createQuadPipeline(device, quadModule, layout, undefined),
      blends: {
        add: createQuadPipeline(device, quadModule, layout, blendStates.add),
        screen: createQuadPipeline(
          device,
          quadModule,
          layout,
          blendStates.screen,
        ),
        erase: createQuadPipeline(
          device,
          quadModule,
          layout,
          blendStates.erase,
        ),
      },
      multiply: createQuadPipeline(
        device,
        multiplyModule,
        effects.multiplyLayout,
        undefined,
      ),
      mesh,
      pass,
      passLayout,
      passPipelineLayout,
    });
  }

  private createDrawGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.effects.drawLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer, size: SLOT_BYTES },
        },
      ],
    });
  }
  private createTarget(width: number, height: number): GPUColorTarget {
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
        `WebGPU 2D target ${width}×${height} exceeds the ${limit} pixel device limit.`,
      );
    return this.effects.target(width, height, 'rgba8unorm');
  }
  private retire(target: GPUColorTarget): void {
    if (this.disposed) this.effects.destroyTexture(target.texture);
    else this.retiredTextures.push(target.texture);
  }
  /** Call after the frame's command buffers are submitted; destroying earlier would invalidate them. */
  flushRetired(): void {
    for (const texture of this.retiredTextures)
      this.effects.destroyTexture(texture);
    for (const buffer of this.retiredBuffers) buffer.destroy();
    this.retiredTextures.length = 0;
    this.retiredBuffers.length = 0;
    this.effects.flushRetired();
  }
  private bindDraw(pass: GPURenderPassEncoder, slot: number): void {
    this.uniformOffsets[0] = slot * SLOT_BYTES;
    pass.setBindGroup(0, this.drawGroup, this.uniformOffsets);
  }
  private sampler(
    nearestMin: boolean,
    nearestMag: boolean,
    maxAnisotropy = 1,
  ): GPUSampler {
    const key =
      (nearestMin ? 1 : 0) + (nearestMag ? 2 : 0) + 4 * (maxAnisotropy - 1);
    return (this.samplers[key] ??= this.device.createSampler({
      minFilter: nearestMin ? 'nearest' : 'linear',
      magFilter: nearestMag ? 'nearest' : 'linear',
      mipmapFilter: maxAnisotropy > 1 ? 'linear' : 'nearest',
      maxAnisotropy,
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    }));
  }
  private textureOf(source: Texture2DSource): GPUTexture {
    if (source.kind === 'render') {
      assertRenderTextureOwner2D(source, this.hooks.owner);
      const target = this.targets.get(source);
      if (!target)
        throw new GraphicsError('Render texture has no native storage.');
      return target.texture;
    }
    return this.hooks.upload(source);
  }
  private textureGroup(
    texture: GPUTexture,
    nearestMin = false,
    nearestMag = false,
    maxAnisotropy = 1,
  ): GPUBindGroup {
    const key =
      (nearestMin ? 1 : 0) + (nearestMag ? 2 : 0) + 4 * (maxAnisotropy - 1);
    let entries = this.groups.get(texture);
    if (!entries) {
      entries = [];
      this.groups.set(texture, entries);
    }
    return (entries[key] ??= this.device.createBindGroup({
      layout: this.effects.spriteTextureLayout,
      entries: [
        { binding: 0, resource: texture.createView() },
        {
          binding: 1,
          resource: this.sampler(nearestMin, nearestMag, maxAnisotropy),
        },
      ],
    }));
  }

  // ---- validation and capacity ---------------------------------------------------------------------
  preflight(
    commands: RenderCommandBuffer2D,
    scene: Scene,
    width: number,
    height: number,
    resolution: number,
  ): void {
    this.hooks.assertAlive();
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.resolution = resolution;
    this.dependencies.length = 0;
    for (const effect of scene.effects2D) this.effects.validate(effect);
    this.validateCommands(commands, 0);
    this.ensure(this.count(commands));
  }
  private validateSource(source: Texture2DSource, view?: TextureView2D): void {
    if (source.destroyed)
      throw new GraphicsError('Cannot sample a destroyed 2D texture.');
    view?.validate();
    if (source.kind === 'render') {
      assertRenderTextureOwner2D(source, this.hooks.owner);
      if (!this.dependencies.includes(source)) this.dependencies.push(source);
    }
  }
  private validateGroup(group: IsolatedGroup2D): void {
    if (group.mask?.texture)
      this.validateSource(group.mask.texture, group.mask.view);
    for (const filter of group.filters) {
      if (filter.destroyed)
        throw new GraphicsError('Cannot render a destroyed Filter2D.');
      if (filter instanceof DisplacementFilter2D)
        this.validateSource(filter.texture, filter.view);
    }
  }
  private validateCommands(
    commands: RenderCommandBuffer2D,
    depth: number,
  ): void {
    if (depth > rendering2dLimits.layerDepth)
      throw new RangeError('2D isolation exceeds its depth budget.');
    for (const command of commands.items) {
      if (command.object.destroyed)
        throw new GraphicsError('Cannot render a destroyed 2D object.');
      if (command.kind === 'layer') {
        const group = command.object,
          cache = this.layers.get(group);
        this.validateGroup(group);
        const bounds =
          cache && group.cacheAsTexture && cache.version === group.cacheVersion
            ? cache.bounds
            : group.getLocalBounds();
        if (bounds.width > 0 && bounds.height > 0)
          this.validateBounds(bounds, this.resolution);
        this.validateCommands(command.commands, depth + 1);
      } else if (command.kind === 'particles') {
        for (let i = 0; i < command.object.activeCount; i++) {
          const slot = command.object.getSlot(command.object.activeSlotAt(i));
          this.validateSource(slot.texture, slot.view);
          getTextureQuad2D(
            slot.texture,
            slot.view,
            slot.source,
            this.sourceQuad,
          );
        }
      } else {
        this.validateSource(command.object.texture, command.object.view);
        if (command.kind === 'sprite') {
          getSpriteQuad2D(command.object, this.quad);
          validateSpriteLighting2D(command.object);
          if (command.object.material)
            this.effects.validate(command.object.material);
        } else {
          command.object.geometry.validate();
          getTextureQuad2D(
            command.object.texture,
            command.object.view,
            undefined,
            this.quad,
          );
        }
      }
    }
  }
  private validateBounds(bounds: Rect2D, resolution: number): void {
    if (
      ![bounds.x, bounds.y, bounds.width, bounds.height].every(
        Number.isFinite,
      ) ||
      bounds.width <= 0 ||
      bounds.height <= 0
    )
      throw new RangeError('2D target bounds must be finite and positive.');
    validateRenderTextureSize2D(
      { width: bounds.width, height: bounds.height, resolution },
      this.device.limits.maxTextureDimension2D,
    );
  }
  /** Upper bound of uniform slots, which also bounds per-frame quad instances. */
  private count(commands: RenderCommandBuffer2D): number {
    let total = 0;
    for (const command of commands.items) {
      if (command.kind === 'layer')
        total +=
          3 + command.object.filters.length * 2 + this.count(command.commands);
      else total += 1;
    }
    return total + 1;
  }
  private ensure(slots: number): void {
    this.required = slots;
    if (slots <= this.capacity) return;
    let capacity = Math.max(16, this.capacity);
    while (capacity < slots) capacity *= 2;
    this.retiredBuffers.push(this.uniformBuffer, this.instanceBuffer);
    this.uniformBuffer = this.device.createBuffer({
      size: capacity * SLOT_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.instanceBuffer = this.device.createBuffer({
      size: capacity * QUAD_BYTES,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.instanceData = new Float32Array(capacity * QUAD_FLOATS);
    this.uploadedUniforms = new Float32Array(capacity * SLOT_FLOATS).fill(NaN);
    this.drawGroup = this.createDrawGroup();
    this.capacity = capacity;
  }

  // ---- frame recording ---------------------------------------------------------------------------
  draw(
    commands: RenderCommandBuffer2D,
    scene: Scene,
    encoder: GPUCommandEncoder,
    target: GPUColorTarget,
    width: number,
    height: number,
  ): void {
    this.begin(encoder);
    try {
      this.open(target, true);
      this.drawCommands(commands, {
        scene,
        target,
        bounds: { x: 0, y: 0, width, height },
      });
    } finally {
      this.finish();
    }
  }
  private begin(encoder: GPUCommandEncoder): void {
    this.encoder = encoder;
    this.slot = 0;
    this.frame++;
  }
  private finish(): void {
    this.closePass();
    this.encoder = undefined;
    for (const [group, entry] of this.layers)
      if (group.destroyed || entry.seen !== this.frame) {
        for (const target of entry.targets) this.retire(target);
        this.layers.delete(group);
      }
    if (this.hooks.residency.geometry.budgetBytes === Infinity) {
      for (const entry of this.meshes.values())
        if (entry.seen !== this.frame && !entry.allocation.references)
          entry.allocation.destroy();
    }
    for (const [layer, entry] of this.particles)
      if (
        layer.destroyed ||
        (this.hooks.residency.geometry.budgetBytes === Infinity &&
          entry.seen !== this.frame &&
          !entry.allocation.references)
      )
        entry.allocation.destroy();
  }
  private open(target: GPUColorTarget, clear: boolean): GPURenderPassEncoder {
    if (this.pass && this.passTarget === target && !clear) return this.pass;
    this.closePass();
    this.pass = beginTimedRenderPass(this.encoder!, {
      colorAttachments: [
        {
          view: target.view,
          loadOp: clear ? 'clear' : 'load',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
        },
      ],
    });
    this.passTarget = target;
    this.hooks.stats.pass2D();
    return this.pass;
  }
  private closePass(): void {
    this.pass?.end();
    this.pass = undefined;
    this.passTarget = undefined;
  }
  private allocate(): number {
    if (this.slot >= this.capacity)
      throw new GraphicsError('WebGPU 2D draw budget was exceeded.');
    return this.slot++;
  }
  private drawUniforms(
    slot: number,
    context: Context2D,
    local?: Matrix3,
    world?: Matrix3,
    appearance?: Float32Array,
    uv?: TextureQuad2D,
    repeat = false,
    native = false,
    source?: Texture2DSource,
    deferUpload = false,
    maxAnisotropy = 1,
  ): void {
    const s = this.scratch,
      target = context.target,
      bounds = context.bounds;
    s.fill(0);
    s[0] = bounds.width;
    s[1] = bounds.height;
    s[2] = target.width / bounds.width;
    s[3] = target.height / bounds.height;
    const l = local?.elements,
      w = world?.elements;
    s[4] = l?.[0] ?? 1;
    s[5] = l?.[1] ?? 0;
    s[6] = l?.[3] ?? 0;
    s[7] = l?.[4] ?? 1;
    s[8] = l?.[6] ?? 0;
    s[9] = l?.[7] ?? 0;
    s[12] = w?.[0] ?? 1;
    s[13] = w?.[1] ?? 0;
    s[14] = w?.[3] ?? 0;
    s[15] = w?.[4] ?? 1;
    s[16] = w?.[6] ?? 0;
    s[17] = w?.[7] ?? 0;
    s[31] = native ? 1 : 0;
    for (let i = 0; i < 4; i++) s[20 + i] = appearance?.[i] ?? 1;
    if (uv) {
      s[24] = uv.u0;
      s[25] = uv.v0;
      s[26] = uv.ux;
      s[27] = uv.vx;
      s[28] = uv.uy;
      s[29] = uv.vy;
      s[30] = repeat ? 1 : 0;
    }
    const field =
      source instanceof Texture ? getTextureDistanceField(source) : undefined;
    s[80] = field ? (field.type === 'sdf' ? 1 : 2) : 0;
    s[81] = field?.range ?? 0;
    s[82] = maxAnisotropy;
    if (!deferUpload) this.uploadUniforms(slot);
  }
  private uploadUniforms(slot: number): void {
    const offset = slot * SLOT_FLOATS;
    let changed = false;
    for (let i = 0; i < SLOT_FLOATS; i++)
      if (this.uploadedUniforms[offset + i] !== this.scratch[i]) {
        changed = true;
        break;
      }
    if (!changed) return;
    this.uploadedUniforms.set(this.scratch, offset);
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      slot * SLOT_BYTES,
      this.scratch,
    );
    this.hooks.stats.upload(SLOT_BYTES);
  }
  private objectMatrix(
    object: GameObject,
    context: Context2D,
    out: Matrix3,
    worldOnly = false,
  ): Matrix3 {
    const e = out.identity().elements;
    if (context.root) out.copy(context.root.updateWorldMatrix()).invert();
    else if (object.worldSpace === 'world') {
      const camera = context.scene.camera2D;
      e[0] = e[4] = camera.zoom;
      e[6] = -camera.position.x * camera.zoom + camera.renderOffset.x;
      e[7] = -camera.position.y * camera.zoom + camera.renderOffset.y;
    }
    e[6] -= context.bounds.x;
    e[7] -= context.bounds.y;
    if (!worldOnly) out.multiply(object.updateWorldMatrix());
    return out;
  }
  private writeQuad(
    index: number,
    quad: TextureQuad2D,
    matrix: Matrix3 | undefined,
    tint: ArrayLike<number> | undefined,
    anchorX: number,
    anchorY: number,
    world: boolean,
    sprite?: TilingSprite2D,
  ): void {
    const d = this.instanceData,
      o = index * QUAD_FLOATS,
      m = matrix?.elements;
    d[o] = m?.[0] ?? 1;
    d[o + 1] = m?.[1] ?? 0;
    d[o + 2] = m?.[3] ?? 0;
    d[o + 3] = m?.[4] ?? 1;
    d[o + 4] = m?.[6] ?? 0;
    d[o + 5] = m?.[7] ?? 0;
    d[o + 6] = quad.x;
    d[o + 7] = quad.y;
    d[o + 8] = quad.width;
    d[o + 9] = quad.height;
    d[o + 10] = quad.naturalWidth;
    d[o + 11] = quad.naturalHeight;
    d[o + 12] = quad.u0;
    d[o + 13] = quad.v0;
    d[o + 14] = quad.ux;
    d[o + 15] = quad.vx;
    d[o + 16] = quad.uy;
    d[o + 17] = quad.vy;
    d[o + 18] = quad.trimWidth;
    d[o + 19] = quad.trimHeight;
    d[o + 20] = tint?.[0] ?? 1;
    d[o + 21] = tint?.[1] ?? 1;
    d[o + 22] = tint?.[2] ?? 1;
    d[o + 23] = tint?.[3] ?? 1;
    d[o + 24] = d[o + 25] = d[o + 26] = d[o + 27] = 0;
    d[o + 28] = 0;
    d[o + 29] = 0;
    d[o + 30] = world ? 1 : 0;
    d[o + 31] = 0;
    d[o + 32] = quad.trimX;
    d[o + 33] = quad.trimY;
    d[o + 34] = anchorX;
    d[o + 35] = anchorY;
    if (sprite) {
      // Tile origin is relative to the destination rectangle so the shader can work in rectangle space.
      d[o + 24] = sprite.tilePosition.x - quad.x;
      d[o + 25] = sprite.tilePosition.y - quad.y;
      d[o + 26] = sprite.tileScale.x;
      d[o + 27] = sprite.tileScale.y;
      d[o + 28] = sprite.tileRotation;
      d[o + 29] = 1;
    }
  }
  private uploadQuads(first: number, count: number): void {
    this.device.queue.writeBuffer(
      this.instanceBuffer,
      first * QUAD_BYTES,
      this.instanceData,
      first * QUAD_FLOATS,
      count * QUAD_FLOATS,
    );
    this.hooks.stats.upload(count * QUAD_BYTES);
  }
  private drawCommands(
    commands: RenderCommandBuffer2D,
    context: Context2D,
  ): void {
    const items = commands.items;
    for (let i = 0; i < items.length; i++) {
      const command = items[i];
      if (command.kind === 'layer')
        this.drawLayer(command.object, command.commands, context);
      else if (command.kind === 'sprite') {
        const sprite = command.object;
        if (
          sprite.lighting ||
          sprite.material ||
          sprite instanceof TilingSprite2D
        )
          this.drawSprite(sprite, context);
        else {
          const group = this.textureGroup(
            this.textureOf(sprite.texture),
            sprite.sampler?.minFilter === 'nearest',
            sprite.sampler?.magFilter === 'nearest',
            sprite.sampler?.maxAnisotropy ?? 1,
          );
          const first = this.slot;
          this.packSprite(sprite, context, this.allocate(), true);
          while (i + 1 < items.length) {
            const next = items[i + 1];
            if (
              next.kind !== 'sprite' ||
              next.object.material ||
              next.object.lighting ||
              next.object instanceof TilingSprite2D ||
              next.object.worldSpace !== sprite.worldSpace ||
              this.textureGroup(
                this.textureOf(next.object.texture),
                next.object.sampler?.minFilter === 'nearest',
                next.object.sampler?.magFilter === 'nearest',
                next.object.sampler?.maxAnisotropy ?? 1,
              ) !== group
            )
              break;
            i++;
            this.packSprite(next.object, context, this.allocate(), true);
          }
          const count = this.slot - first;
          this.drawUniforms(
            first,
            context,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            false,
            sprite.texture,
            false,
            sprite.sampler?.maxAnisotropy ?? 1,
          );
          this.uploadQuads(first, count);
          const pass = this.open(context.target, false);
          pass.setPipeline(this.normal);
          this.bindDraw(pass, first);
          pass.setBindGroup(1, group);
          pass.setBindGroup(2, this.effects.defaultUniforms);
          pass.setVertexBuffer(0, this.instanceBuffer);
          pass.draw(6, count, 0, first);
          this.hooks.stats.draw2D(count);
        }
      } else if (command.kind === 'mesh')
        this.drawMesh(command.object, context);
      else this.drawParticles(command.object, context);
    }
  }
  private packSprite(
    sprite: Sprite,
    context: Context2D,
    slot: number,
    instanceTint: boolean,
  ): void {
    const quad = getSpriteQuad2D(sprite, this.quad);
    this.objectMatrix(sprite, context, this.matrix);
    if (sprite.roundPixels) {
      const e = this.matrix.elements,
        target = context.target,
        bounds = context.bounds;
      e[6] =
        (Math.round((e[6] * target.width) / bounds.width) * bounds.width) /
        target.width;
      e[7] =
        (Math.round((e[7] * target.height) / bounds.height) * bounds.height) /
        target.height;
    }
    getRelativeAppearance2D(sprite, context.root, this.appearance);
    // Native materials retain their draw-uniform ABI; plain runs put appearance in each instance.
    if (!instanceTint)
      this.drawUniforms(
        slot,
        context,
        undefined,
        undefined,
        this.appearance,
        undefined,
        false,
        sprite.texture.kind === 'native',
        sprite.texture,
        !!sprite.lighting,
        sprite.sampler?.maxAnisotropy ?? 1,
      );
    this.writeQuad(
      slot,
      quad,
      this.matrix,
      instanceTint ? this.appearance : undefined,
      0,
      0,
      false,
      sprite instanceof TilingSprite2D ? sprite : undefined,
    );
    this.instanceData[slot * QUAD_FLOATS + 31] =
      sprite.texture.kind === 'native' ? 2 : 0;
  }
  private drawSprite(sprite: Sprite, context: Context2D): void {
    const slot = this.allocate();
    const prepared = sprite.material
      ? this.effects.material(sprite.material)
      : undefined;
    this.packSprite(sprite, context, slot, false);
    this.uploadQuads(slot, 1);
    if (sprite.lighting) {
      this.objectMatrix(sprite, context, this.mapping, true).invert();
      packLighting2D(
        sprite,
        this.mapping,
        getSpriteQuad2D(sprite, this.quad),
        this.scratch,
      );
      this.uploadUniforms(slot);
    }
    const pass = this.open(context.target, false);
    if (sprite.lighting && sprite.material && !prepared?.lit)
      throw new GraphicsError(
        'A lit Material2D must be prepared before rendering.',
      );
    pass.setPipeline(
      sprite.lighting
        ? (prepared?.lit ?? this.lighting)
        : (prepared?.layer ?? this.normal),
    );
    this.bindDraw(pass, slot);
    pass.setBindGroup(
      1,
      this.textureGroup(
        this.textureOf(sprite.texture),
        sprite.sampler?.minFilter === 'nearest',
        sprite.sampler?.magFilter === 'nearest',
        sprite.sampler?.maxAnisotropy ?? 1,
      ),
    );
    pass.setBindGroup(2, prepared?.bindGroup ?? this.effects.defaultUniforms);
    if (sprite.lighting)
      pass.setBindGroup(
        3,
        this.textureGroup(
          this.textureOf(sprite.normalTexture ?? sprite.texture),
          sprite.sampler?.minFilter === 'nearest',
          sprite.sampler?.magFilter === 'nearest',
          sprite.sampler?.maxAnisotropy ?? 1,
        ),
      );
    pass.setVertexBuffer(0, this.instanceBuffer);
    pass.draw(6, 1, 0, slot);
    this.hooks.stats.draw2D();
  }
  prepareGeometry(geometry: Geometry2D): ResidencyAllocation {
    geometry.validate();
    const count = geometry.uvQ.length;
    let entry = this.meshes.get(geometry);
    if (!entry) {
      const allocation = this.hooks.residency.geometry.allocate(
        count * MESH_STRIDE + geometry.indices.byteLength,
        () => {
          const cached = this.meshes.get(geometry);
          if (!cached) return;
          cached.vertex.destroy();
          cached.index.destroy();
          this.meshes.delete(geometry);
        },
      );
      let vertex: GPUBuffer | undefined, index: GPUBuffer | undefined;
      try {
        vertex = this.device.createBuffer({
          size: count * MESH_STRIDE,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        index = this.device.createBuffer({
          size: geometry.indices.byteLength,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        entry = {
          vertex,
          index,
          allocation,
          data: new Float32Array(count * 5),
          version: -1,
          seen: this.frame,
        };
        this.meshes.set(geometry, entry);
      } catch (error) {
        vertex?.destroy();
        index?.destroy();
        allocation.destroy();
        throw error;
      }
    }
    entry.allocation.touch();
    entry.seen = this.frame;
    if (entry.version !== geometry.version) {
      for (let i = 0; i < count; i++) {
        const o = i * 5,
          q = geometry.uvQ[i];
        entry.data[o] = geometry.positions[i * 2];
        entry.data[o + 1] = geometry.positions[i * 2 + 1];
        entry.data[o + 2] = geometry.uvs[i * 2] * q;
        entry.data[o + 3] = geometry.uvs[i * 2 + 1] * q;
        entry.data[o + 4] = q;
      }
      this.device.queue.writeBuffer(entry.vertex, 0, entry.data);
      this.device.queue.writeBuffer(entry.index, 0, geometry.indices);
      this.hooks.stats.upload(
        entry.data.byteLength + geometry.indices.byteLength,
      );
      entry.version = geometry.version;
    }
    return entry.allocation;
  }
  unloadGeometry(geometry: Geometry2D): void {
    this.meshes.get(geometry)?.allocation.destroy();
  }
  private drawMesh(mesh: Mesh2D, context: Context2D): void {
    const geometry = mesh.geometry;
    this.prepareGeometry(geometry);
    const entry = this.meshes.get(geometry)!;
    const pass = this.open(context.target, false),
      slot = this.allocate();
    getTextureQuad2D(mesh.texture, mesh.view, undefined, this.quad);
    getRelativeAppearance2D(mesh, context.root, this.appearance);
    this.drawUniforms(
      slot,
      context,
      this.objectMatrix(mesh, context, this.matrix),
      undefined,
      this.appearance,
      this.quad,
      'textureMode' in mesh && mesh.textureMode === 'repeat',
      mesh.texture.kind === 'native',
    );
    pass.setPipeline(this.meshPipeline);
    this.bindDraw(pass, slot);
    pass.setBindGroup(1, this.textureGroup(this.textureOf(mesh.texture)));
    pass.setVertexBuffer(0, entry.vertex);
    pass.setIndexBuffer(entry.index, 'uint32');
    pass.drawIndexed(geometry.indices.length);
    this.hooks.stats.draw2D();
  }
  prepareParticles(layer: ParticleLayer2D): ResidencyAllocation {
    if (layer.destroyed)
      throw new GraphicsError('Cannot prepare a destroyed ParticleLayer2D.');
    let entry = this.particles.get(layer);
    if (!entry) {
      const allocation = this.hooks.residency.geometry.allocate(
        layer.capacity * QUAD_BYTES,
        () => {
          this.particles.get(layer)?.buffer.destroy();
          this.particles.delete(layer);
        },
      );
      let buffer: GPUBuffer;
      try {
        buffer = this.device.createBuffer({
          size: layer.capacity * QUAD_BYTES,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
      } catch (error) {
        allocation.destroy();
        throw error;
      }
      entry = {
        buffer,
        allocation,
        data: new Float32Array(layer.capacity * QUAD_FLOATS),
        versions: new Float64Array(layer.capacity * 5).fill(-1),
        slots: new Int32Array(layer.capacity).fill(-1),
        sourceSizes: new Float64Array(layer.capacity * 3),
        seen: this.frame,
      };
      this.particles.set(layer, entry);
    }
    entry.allocation.touch();
    entry.seen = this.frame;
    return entry.allocation;
  }
  private drawParticles(layer: ParticleLayer2D, context: Context2D): void {
    this.prepareParticles(layer);
    const entry = this.particles.get(layer)!;
    const pass = this.open(context.target, false),
      slot = this.allocate(),
      data = entry.data,
      quad = this.quad;
    this.objectMatrix(layer, context, this.matrix);
    this.objectMatrix(layer, context, this.mapping, true);
    getRelativeAppearance2D(layer, context.root, this.appearance);
    this.drawUniforms(
      slot,
      context,
      this.matrix,
      this.mapping,
      this.appearance,
    );
    pass.setPipeline(this.normal);
    this.bindDraw(pass, slot);
    pass.setBindGroup(2, this.effects.defaultUniforms);
    pass.setVertexBuffer(0, entry.buffer);
    let previous: GPUTexture | undefined;
    let runStart = 0;
    let dirtyStart = -1;
    for (let i = 0; i < layer.activeCount; i++) {
      const index = layer.activeSlotAt(i),
        slotData = layer.getSlot(index),
        v = i * 5,
        o = i * QUAD_FLOATS,
        versions = entry.versions;
      const dynamic = layer.dynamicAttributes;
      const size = i * 3;
      const sourceResolution =
        slotData.texture.kind === 'render' ? slotData.texture.resolution : 1;
      const moved =
        entry.slots[i] !== index || versions[v + 4] !== slotData.generation;
      const transform =
        moved ||
        (dynamic & ParticleAttribute2D.Transform) !== 0 ||
        versions[v] !== slotData.transformVersion;
      const tint =
        moved ||
        (dynamic & ParticleAttribute2D.Tint) !== 0 ||
        versions[v + 1] !== slotData.tintVersion;
      const source =
        moved ||
        (dynamic & ParticleAttribute2D.Source) !== 0 ||
        versions[v + 2] !== slotData.sourceVersion ||
        entry.sourceSizes[size] !== slotData.texture.width ||
        entry.sourceSizes[size + 1] !== slotData.texture.height ||
        entry.sourceSizes[size + 2] !== sourceResolution;
      const anchor =
        moved ||
        (dynamic & ParticleAttribute2D.Anchor) !== 0 ||
        versions[v + 3] !== slotData.anchorVersion;
      if (transform || tint || source || anchor) {
        entry.slots[i] = index;
        if (dirtyStart < 0) dirtyStart = i;
        if (transform) {
          data[o] = slotData.a;
          data[o + 1] = slotData.b;
          data[o + 2] = slotData.c;
          data[o + 3] = slotData.d;
          data[o + 4] = slotData.tx;
          data[o + 5] = slotData.ty;
          data[o + 30] = slotData.space === 'world' ? 1 : 0;
          versions[v] = slotData.transformVersion;
        }
        if (source) {
          getTextureQuad2D(
            slotData.texture,
            slotData.view,
            slotData.source,
            quad,
          );
          data[o + 6] = quad.x;
          data[o + 7] = quad.y;
          data[o + 8] = quad.width;
          data[o + 9] = quad.height;
          data[o + 10] = quad.naturalWidth;
          data[o + 11] = quad.naturalHeight;
          data[o + 12] = quad.u0;
          data[o + 13] = quad.v0;
          data[o + 14] = quad.ux;
          data[o + 15] = quad.vx;
          data[o + 16] = quad.uy;
          data[o + 17] = quad.vy;
          data[o + 18] = quad.trimWidth;
          data[o + 19] = quad.trimHeight;
          data[o + 32] = quad.trimX;
          data[o + 31] = slotData.texture.kind === 'native' ? 2 : 0;
          data[o + 33] = quad.trimY;
          versions[v + 2] = slotData.sourceVersion;
          entry.sourceSizes[size] = slotData.texture.width;
          entry.sourceSizes[size + 1] = slotData.texture.height;
          entry.sourceSizes[size + 2] = sourceResolution;
        }
        if (tint) {
          data[o + 20] = slotData.tintR;
          data[o + 21] = slotData.tintG;
          data[o + 22] = slotData.tintB;
          data[o + 23] = slotData.tintA;
          versions[v + 1] = slotData.tintVersion;
        }
        if (anchor) {
          data[o + 34] = slotData.anchorX;
          data[o + 35] = slotData.anchorY;
          versions[v + 3] = slotData.anchorVersion;
        }
        versions[v + 4] = slotData.generation;
      } else if (dirtyStart >= 0) {
        this.uploadParticles(entry, dirtyStart, i - dirtyStart);
        dirtyStart = -1;
      }
      const texture = this.textureOf(slotData.texture);
      if (texture !== previous) {
        if (previous) {
          pass.draw(6, i - runStart, 0, runStart);
          this.hooks.stats.draw2D(i - runStart);
        }
        pass.setBindGroup(1, this.textureGroup(texture));
        previous = texture;
        runStart = i;
      }
    }
    if (dirtyStart >= 0)
      this.uploadParticles(entry, dirtyStart, layer.activeCount - dirtyStart);
    if (previous) {
      pass.draw(6, layer.activeCount - runStart, 0, runStart);
      this.hooks.stats.draw2D(layer.activeCount - runStart);
    }
  }
  private uploadParticles(
    entry: ParticleBuffers2D,
    first: number,
    count: number,
  ): void {
    this.device.queue.writeBuffer(
      entry.buffer,
      first * QUAD_BYTES,
      entry.data,
      first * QUAD_FLOATS,
      count * QUAD_FLOATS,
    );
    this.hooks.stats.upload(count * QUAD_BYTES);
  }

  // ---- isolated groups ---------------------------------------------------------------------------
  private layer(
    group: IsolatedGroup2D,
    commands: RenderCommandBuffer2D,
    scene: Scene,
  ): Layer2D | undefined {
    let entry = this.layers.get(group);
    if (entry && group.cacheAsTexture && entry.version === group.cacheVersion) {
      entry.seen = this.frame;
      return entry;
    }
    const bounds = group.getLocalBounds();
    if (bounds.width <= 0 || bounds.height <= 0) return undefined;
    this.validateBounds(bounds, this.resolution);
    const width = Math.ceil(bounds.width * this.resolution),
      height = Math.ceil(bounds.height * this.resolution);
    if (
      !entry ||
      entry.targets[0].width !== width ||
      entry.targets[0].height !== height
    ) {
      const targets: GPUColorTarget[] = [];
      try {
        for (let i = 0; i < 3; i++)
          targets.push(this.createTarget(width, height));
      } catch (error) {
        for (const target of targets) this.retire(target);
        throw error;
      }
      if (entry) for (const target of entry.targets) this.retire(target);
      entry = {
        targets,
        bounds,
        version: -1,
        result: targets[0],
        seen: this.frame,
      };
      this.layers.set(group, entry);
    }
    entry.bounds = bounds;
    entry.seen = this.frame;
    const context: Context2D = {
      scene,
      target: entry.targets[0],
      bounds,
      root: group,
    };
    // Nested draws must not disturb the parent's open pass ordering: close it, render, and let the caller reopen.
    this.closePass();
    this.open(context.target, true);
    this.drawCommands(commands, context);
    this.closePass();
    let input = entry.targets[0],
      output = entry.targets[1];
    if (group.mask) {
      this.drawMask(group.mask, entry.targets[2], bounds);
      this.filterPass(
        input,
        output,
        bounds,
        5,
        undefined,
        entry.targets[2],
        group.mask,
      );
      [input, output] = [output, input];
    }
    for (const filter of group.filters) {
      if (filter.kind === 'blur') {
        this.filterPass(
          input,
          output,
          bounds,
          2,
          filter,
          undefined,
          undefined,
          true,
        );
        [input, output] = [output, input];
        this.filterPass(
          input,
          output,
          bounds,
          2,
          filter,
          undefined,
          undefined,
          false,
        );
      } else
        this.filterPass(
          input,
          output,
          bounds,
          filter.kind === 'alpha'
            ? 0
            : filter.kind === 'color-matrix'
              ? 1
              : filter.kind === 'noise'
                ? 3
                : 4,
          filter,
        );
      [input, output] = [output, input];
    }
    entry.result = input;
    entry.version = group.cacheVersion;
    return entry;
  }
  private drawLayer(
    group: IsolatedGroup2D,
    commands: RenderCommandBuffer2D,
    context: Context2D,
  ): void {
    const entry = this.layer(group, commands, context.scene);
    if (!entry) return;
    getRelativeAppearance2D(group, context.root, this.appearance);
    this.compositeLayer(
      entry.result,
      entry.bounds,
      this.objectMatrix(group, context, this.matrix),
      this.appearance,
      group.blendMode,
      context,
    );
  }
  private compositeLayer(
    source: GPUColorTarget,
    bounds: Rect2D,
    transform: Matrix3,
    appearance: Float32Array,
    blend: BlendMode2D,
    context: Context2D,
  ): void {
    const quad = this.quad;
    quad.x = bounds.x;
    quad.y = bounds.y;
    quad.width = quad.naturalWidth = quad.trimWidth = bounds.width;
    quad.height = quad.naturalHeight = quad.trimHeight = bounds.height;
    quad.trimX = quad.trimY = quad.u0 = quad.v0 = quad.vx = quad.uy = 0;
    quad.ux = quad.vy = 1;
    quad.resolution = 1;
    let backdrop: GPUColorTarget | undefined;
    if (blend === 'multiply') {
      this.closePass();
      backdrop = this.createTarget(context.target.width, context.target.height);
      this.encoder!.copyTextureToTexture(
        { texture: context.target.texture },
        { texture: backdrop.texture },
        [context.target.width, context.target.height],
      );
      this.retire(backdrop);
    }
    const pass = this.open(context.target, false),
      slot = this.allocate();
    this.drawUniforms(slot, context, undefined, undefined, appearance);
    this.writeQuad(slot, quad, transform, undefined, 0, 0, false);
    this.uploadQuads(slot, 1);
    pass.setPipeline(
      backdrop
        ? this.multiply
        : blend === 'normal'
          ? this.normal
          : this.blends[blend as 'add' | 'screen' | 'erase'],
    );
    this.bindDraw(pass, slot);
    pass.setBindGroup(1, this.textureGroup(source.texture));
    pass.setBindGroup(2, this.effects.defaultUniforms);
    if (backdrop) pass.setBindGroup(3, this.textureGroup(backdrop.texture));
    pass.setVertexBuffer(0, this.instanceBuffer);
    pass.draw(6, 1, 0, slot);
    this.hooks.stats.draw2D();
  }
  private drawMask(mask: Mask2D, target: GPUColorTarget, bounds: Rect2D): void {
    if (mask.texture) {
      getTextureQuad2D(mask.texture, mask.view, undefined, this.quad);
      const e = this.matrix.identity().elements,
        t = mask.transform;
      e[0] = t[0];
      e[1] = t[1];
      e[3] = t[2];
      e[4] = t[3];
      e[6] = t[4] - bounds.x;
      e[7] = t[5] - bounds.y;
      const context: Context2D = {
        scene: undefined as unknown as Scene,
        target,
        bounds,
      };
      this.appearance.fill(1);
      const pass = this.open(target, true),
        slot = this.allocate();
      this.drawUniforms(slot, context, undefined, undefined, this.appearance);
      this.writeQuad(slot, this.quad, this.matrix, undefined, 0, 0, false);
      this.uploadQuads(slot, 1);
      pass.setPipeline(this.replace);
      this.bindDraw(pass, slot);
      pass.setBindGroup(1, this.textureGroup(this.textureOf(mask.texture)));
      pass.setBindGroup(2, this.effects.defaultUniforms);
      pass.setVertexBuffer(0, this.instanceBuffer);
      pass.draw(6, 1, 0, slot);
      this.hooks.stats.draw2D();
      this.closePass();
      return;
    }
    // Geometric masks are exact Path2D coverage rasterized once per isolated render.
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (!context)
      throw new GraphicsError(
        'Native geometric mask rasterization requires Canvas2D.',
      );
    context.setTransform(
      target.width / bounds.width,
      0,
      0,
      target.height / bounds.height,
      (-bounds.x * target.width) / bounds.width,
      (-bounds.y * target.height) / bounds.height,
    );
    context.transform(...mask.transform);
    context.fillStyle = '#fff';
    if (mask.path) context.fill(mask.path.nativePath2D, mask.path.fillRule);
    else {
      const rect = mask.rect!;
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    this.device.queue.copyExternalImageToTexture(
      { source: canvas },
      { texture: target.texture, premultipliedAlpha: true },
      [target.width, target.height],
    );
    this.hooks.stats.upload(target.width * target.height * 4);
    // The upload is queued immediately, so the canvas can be released only after it has been copied.
    void this.device.queue.onSubmittedWorkDone().then(() => {
      canvas.width = canvas.height = 0;
    });
  }
  private filterPass(
    input: GPUColorTarget,
    output: GPUColorTarget,
    bounds: Rect2D,
    mode: number,
    filter?: Filter2D,
    aux?: GPUColorTarget,
    mask?: Mask2D,
    horizontal = true,
  ): void {
    const s = this.scratch,
      u = filter?.uniforms,
      slot = this.allocate();
    s.fill(0);
    s[0] = mode;
    if (mode === 0) s[1] = u![0];
    else if (mode === 1) {
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 4; col++)
          s[4 + row * 4 + col] = u![row * 5 + col];
      for (let i = 0; i < 4; i++) s[20 + i] = u![i * 5 + 4];
    } else if (mode === 2) {
      s[1] = u![0];
      s[2] = u![1] * 4;
      s[4] = horizontal ? 1 / bounds.width : 0;
      s[5] = horizontal ? 0 : 1 / bounds.height;
    } else if (mode === 3) {
      s[1] = u![0];
      s[2] = u![1];
      s[4] = bounds.width;
      s[5] = bounds.height;
    } else if (mode === 4) {
      const displacement = filter as DisplacementFilter2D,
        q = getTextureQuad2D(
          displacement.texture,
          displacement.view,
          undefined,
          this.sourceQuad,
        );
      s[4] = u![0] / bounds.width;
      s[5] = u![1] / bounds.height;
      s[8] = q.u0;
      s[9] = q.v0;
      s[10] = q.ux;
      s[11] = q.vx;
      s[12] = q.uy;
      s[13] = q.vy;
    } else if (mode === 5) {
      s[1] = mask!.inverse ? 1 : 0;
      s[2] = mask!.channel === 'red' ? 1 : 0;
    }
    this.uploadUniforms(slot);
    const auxiliary =
      mode === 4
        ? this.textureOf((filter as DisplacementFilter2D).texture)
        : aux
          ? aux.texture
          : this.dummy;
    const group = this.device.createBindGroup({
      layout: this.passLayout,
      entries: [
        { binding: 0, resource: input.texture.createView() },
        { binding: 1, resource: this.sampler(false, false) },
        { binding: 2, resource: auxiliary.createView() },
      ],
    });
    const pass = this.open(output, true);
    pass.setPipeline(this.passPipeline);
    this.bindDraw(pass, slot);
    pass.setBindGroup(1, group);
    pass.draw(3);
    this.hooks.stats.draw2D();
    this.closePass();
  }

  // ---- explicit targets --------------------------------------------------------------------------
  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D {
    this.hooks.assertIdle();
    const size = validateRenderTextureSize2D(
      options,
      this.device.limits.maxTextureDimension2D,
    );
    let resource = this.createTarget(size.width, size.height);
    const texture = createOwnedRenderTexture2D(
      this.hooks.owner,
      size,
      (next) => {
        this.hooks.assertIdle();
        const replacement = this.createTarget(next.width, next.height);
        this.effects.destroyTexture(resource.texture);
        resource = replacement;
        this.targets.set(texture, resource);
      },
      () => {
        this.targets.delete(texture);
        if (this.encoder) this.retire(resource);
        else this.effects.destroyTexture(resource.texture);
      },
    );
    this.targets.set(texture, resource);
    this.clearTarget(resource);
    return texture;
  }
  private clearTarget(target: GPUColorTarget): void {
    const encoder = this.device.createCommandEncoder();
    encoder
      .beginRenderPass({
        colorAttachments: [
          {
            view: target.view,
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
          },
        ],
      })
      .end();
    this.device.queue.submit([encoder.finish()]);
    this.hooks.stats.pass2D();
  }
  async renderToTexture(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options: { clear?: boolean; bounds?: Rect2D } = {},
  ): Promise<void> {
    this.hooks.assertIdle();
    assertRenderTextureOwner2D(target, this.hooks.owner);
    const root = content instanceof IsolatedGroup2D ? content : undefined,
      scene = root ? root.scene : (content as Scene);
    if (!scene || root?.destroyed)
      throw new GraphicsError('Render content must belong to a live Scene.');
    const bounds =
      options.bounds ??
      (root
        ? root.getLocalBounds()
        : {
            x: 0,
            y: 0,
            width: target.logicalWidth,
            height: target.logicalHeight,
          });
    this.validateBounds(bounds, target.resolution);
    collectRenderCommands2D(
      scene,
      bounds.width,
      bounds.height,
      this.captureCommands,
      { ...(root ? { root } : {}), skipCulling: true },
    );
    let staging: GPUColorTarget | undefined,
      scratch: GPUColorTarget | undefined;
    this.hooks.residency.beginFrame();
    try {
      this.preflight(
        this.captureCommands,
        scene,
        bounds.width,
        bounds.height,
        target.resolution,
      );
      if (root) this.validateGroup(root);
      validateRenderTextureDependencies2D(
        target,
        this.dependencies,
        this.hooks.owner,
      );
      const destination = this.targets.get(target)!;
      this.ensure(this.required + 1);
      const encoder = this.device.createCommandEncoder();
      staging = this.createTarget(target.width, target.height);
      this.begin(encoder);
      try {
        if (options.clear === false)
          encoder.copyTextureToTexture(
            { texture: destination.texture },
            { texture: staging.texture },
            [target.width, target.height],
          );
        const context: Context2D = {
          scene,
          target: staging,
          bounds,
          ...(root ? { root } : {}),
        };
        this.open(staging, options.clear !== false);
        if (root) {
          const entry = this.layer(root, this.captureCommands, scene);
          if (entry) {
            const tint = root.tint;
            this.appearance[0] = tint[0];
            this.appearance[1] = tint[1];
            this.appearance[2] = tint[2];
            this.appearance[3] = tint[3] * root.opacity;
            this.matrix.identity().elements[6] = -bounds.x;
            this.matrix.elements[7] = -bounds.y;
            this.compositeLayer(
              entry.result,
              entry.bounds,
              this.matrix,
              this.appearance,
              root.blendMode,
              context,
            );
          }
        } else this.drawCommands(this.captureCommands, context);
        this.closePass();
      } finally {
        this.finish();
      }
      let result = staging;
      if (!root && scene.effects2D.length) {
        scratch = this.createTarget(target.width, target.height);
        this.effects.settings(bounds.width, bounds.height);
        result = this.effects.process(
          encoder,
          [staging, scratch],
          scene.effects2D,
        );
      }
      encoder.copyTextureToTexture(
        { texture: result.texture },
        { texture: destination.texture },
        [target.width, target.height],
      );
      this.device.queue.submit([encoder.finish()]);
      target.publish(this.hooks.owner, this.dependencies);
    } finally {
      this.hooks.residency.abortFrame();
      if (staging) this.retire(staging);
      if (scratch) this.retire(scratch);
      this.captureCommands.clear();
      void this.device.queue
        .onSubmittedWorkDone()
        .then(() => this.flushRetired());
    }
  }
  async extractPixels(
    target: RenderTexture2D,
    options: { region?: Rect2D } = {},
  ): Promise<Uint8ClampedArray> {
    this.hooks.assertIdle();
    assertRenderTextureOwner2D(target, this.hooks.owner);
    const region = validateRenderTextureRegion2D(target, options.region),
      resource = this.targets.get(target)!;
    const bytesPerRow = Math.ceil((region.width * 4) / 256) * 256;
    const buffer = this.device.createBuffer({
      size: bytesPerRow * region.height,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    try {
      const encoder = this.device.createCommandEncoder();
      encoder.copyTextureToBuffer(
        { texture: resource.texture, origin: [region.x, region.y] },
        { buffer, bytesPerRow },
        [region.width, region.height],
      );
      this.device.queue.submit([encoder.finish()]);
      await buffer.mapAsync(GPUMapMode.READ);
      this.hooks.assertAlive();
      const raw = new Uint8Array(buffer.getMappedRange()),
        pixels = new Uint8ClampedArray(region.width * region.height * 4);
      // Render targets are premultiplied; extraction is straight RGBA like CPU images.
      for (let y = 0; y < region.height; y++)
        for (let x = 0; x < region.width; x++) {
          const from = y * bytesPerRow + x * 4,
            to = (y * region.width + x) * 4,
            a = raw[from + 3];
          pixels[to + 3] = a;
          for (let c = 0; c < 3; c++)
            pixels[to + c] = a ? Math.round((raw[from + c] * 255) / a) : 0;
        }
      buffer.unmap();
      return pixels;
    } finally {
      buffer.destroy();
    }
  }
  async generateTexture(
    content: Scene | IsolatedGroup2D,
    options: { bounds?: Rect2D; resolution?: number } = {},
  ): Promise<Texture> {
    this.hooks.assertIdle();
    const bounds =
      options.bounds ??
      (content instanceof IsolatedGroup2D
        ? content.getLocalBounds()
        : {
            x: 0,
            y: 0,
            width: this.viewportWidth,
            height: this.viewportHeight,
          });
    const target = this.createRenderTexture({
      width: bounds.width,
      height: bounds.height,
      ...(options.resolution === undefined
        ? {}
        : { resolution: options.resolution }),
    });
    try {
      await this.renderToTexture(target, content, { bounds });
      const pixels = await this.extractPixels(target);
      this.hooks.assertAlive();
      const canvas = document.createElement('canvas');
      canvas.width = target.width;
      canvas.height = target.height;
      const context = canvas.getContext('2d');
      if (!context)
        throw new GraphicsError(
          'Texture generation requires Canvas2D image encoding.',
        );
      context.putImageData(
        new ImageData(
          pixels as Uint8ClampedArray<ArrayBuffer>,
          target.width,
          target.height,
        ),
        0,
        0,
      );
      try {
        const result = await Texture.fromImage(canvas);
        if (this.disposed) {
          result.destroy();
          this.hooks.assertAlive();
        }
        return result;
      } finally {
        canvas.width = canvas.height = 0;
      }
    } finally {
      target.destroy();
    }
  }
  source(texture: RenderTexture2D): GPUTexture {
    return this.textureOf(texture);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.closePass();
    for (const entry of this.layers.values())
      for (const target of entry.targets)
        this.effects.destroyTexture(target.texture);
    for (const target of this.targets.keys()) target.destroy();
    for (const entry of this.meshes.values()) {
      entry.vertex.destroy();
      entry.index.destroy();
    }
    for (const entry of this.particles.values()) entry.buffer.destroy();
    this.layers.clear();
    this.targets.clear();
    this.meshes.clear();
    this.particles.clear();
    this.flushRetired();
    this.captureCommands.destroy();
    this.uniformBuffer.destroy();
    this.instanceBuffer.destroy();
    this.dummy.destroy();
  }
}
