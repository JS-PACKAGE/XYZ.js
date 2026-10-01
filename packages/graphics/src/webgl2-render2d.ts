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
import type {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
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
  quadVertex2D,
  quadFragment2D,
  spriteInstanceVertex2D,
  particleVertex2D,
  meshVertex2D,
  meshFragment2D,
  passVertex2D,
  passFragment2D,
  blendFragment2D,
} from './webgl2-render2d-shaders.js';

export interface GLTarget2D {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}
interface Program2D {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}
interface Context2D {
  scene: Scene;
  target: GLTarget2D;
  bounds: Rect2D;
  root?: IsolatedGroup2D;
}
interface Layer2D {
  targets: GLTarget2D[];
  bounds: Rect2D;
  version: number;
  result: GLTarget2D;
}
interface MeshBuffers2D {
  vao: WebGLVertexArrayObject;
  vertex: WebGLBuffer;
  index: WebGLBuffer;
  data: Float32Array;
  version: number;
}
interface ParticleBuffers2D {
  vao: WebGLVertexArrayObject;
  buffer: WebGLBuffer;
  data: Float32Array;
  versions: Float64Array;
  slots: Uint32Array;
  generations: Float64Array;
}
export interface GLRender2DHooks {
  owner: object;
  stats: FrameStats;
  createTarget(width: number, height: number): GLTarget2D;
  deleteTarget(target: GLTarget2D): void;
  createProgram(vertex: string, fragment: string, label: string): WebGLProgram;
  source(source: Texture2DSource): WebGLTexture;
  material(effect: Material2D): WebGLProgram;
  processor(effect: PostProcessor2D): WebGLProgram;
  assertIdle(): void;
  assertAlive(): void;
}

/** Native local command execution, independent from 3D and immutable frame capture. */
export class WebGLRender2D {
  private readonly quad = createTextureQuad2D();
  private readonly sourceQuad = createTextureQuad2D();
  private readonly appearance = new Float32Array(4);
  private readonly matrix = new Matrix3();
  private readonly mapping = new Matrix3();
  private readonly tileMatrix = new Matrix3();
  private readonly inverse = new Matrix3();
  private readonly programs = new Map<WebGLProgram, Program2D>();
  private readonly layers = new Map<IsolatedGroup2D, Layer2D>();
  private readonly targets = new Map<RenderTexture2D, GLTarget2D>();
  private readonly meshes = new Map<Geometry2D, MeshBuffers2D>();
  private readonly particles = new Map<ParticleLayer2D, ParticleBuffers2D>();
  private readonly captureCommands = new RenderCommandBuffer2D();
  private readonly emptyVAO: WebGLVertexArrayObject;
  private readonly quadProgram: Program2D;
  private readonly meshProgram: Program2D;
  private readonly particleProgram: Program2D;
  private readonly passProgram: Program2D;
  private readonly spriteProgram: Program2D;
  private readonly spriteVAO: WebGLVertexArrayObject;
  private readonly spriteBuffer: WebGLBuffer;
  private spriteData = new Float32Array(28 * 64);
  private spriteCapacity = 0;
  private readonly blendProgram: Program2D;
  private readonly matrixRows = new Float32Array(20);
  private readonly dependencies: RenderTexture2D[] = [];
  private readonly samplers = new Map<number, WebGLSampler>();
  private resolution = 1;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private disposed = false;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly hooks: GLRender2DHooks,
  ) {
    const vao = gl.createVertexArray();
    if (!vao)
      throw new GraphicsError('WebGL2 could not allocate the 2D vertex array.');
    this.emptyVAO = vao;
    this.quadProgram = this.register(
      hooks.createProgram(quadVertex2D, quadFragment2D(), '2D quad'),
    );
    this.meshProgram = this.register(
      hooks.createProgram(meshVertex2D, meshFragment2D, 'indexed 2D mesh'),
    );
    this.particleProgram = this.register(
      hooks.createProgram(
        particleVertex2D,
        quadFragment2D(),
        'versioned particle layer',
      ),
    );
    this.spriteProgram = this.register(
      hooks.createProgram(
        spriteInstanceVertex2D,
        quadFragment2D(),
        '2D sprite batch',
      ),
    );
    const spriteVAO = gl.createVertexArray(),
      spriteBuffer = gl.createBuffer();
    if (!spriteVAO || !spriteBuffer) {
      if (spriteVAO) gl.deleteVertexArray(spriteVAO);
      if (spriteBuffer) gl.deleteBuffer(spriteBuffer);
      throw new GraphicsError('WebGL2 sprite batch allocation failed.');
    }
    this.spriteVAO = spriteVAO;
    this.spriteBuffer = spriteBuffer;
    this.bindInstances(spriteVAO, spriteBuffer, 0);
    this.passProgram = this.register(
      hooks.createProgram(
        passVertex2D,
        passFragment2D,
        'local filter and mask',
      ),
    );
    this.blendProgram = this.register(
      hooks.createProgram(
        quadVertex2D,
        blendFragment2D,
        'premultiplied multiply',
      ),
    );
  }

  private register(program: WebGLProgram): Program2D {
    const existing = this.programs.get(program);
    if (existing) return existing;
    const entry = {
      program,
      uniforms: new Map<string, WebGLUniformLocation | null>(),
    };
    this.programs.set(program, entry);
    return entry;
  }
  private uniform(
    program: Program2D,
    name: string,
  ): WebGLUniformLocation | null {
    if (!program.uniforms.has(name))
      program.uniforms.set(
        name,
        this.gl.getUniformLocation(program.program, name),
      );
    return program.uniforms.get(name)!;
  }
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
    for (const effect of scene.effects2D) this.hooks.processor(effect);
    this.validateCommands(commands, 0);
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
  private validateCommands(
    commands: RenderCommandBuffer2D,
    depth: number,
  ): void {
    if (depth > rendering2dLimits.layerDepth)
      throw new RangeError('2D isolation exceeds its depth budget.');
    for (const command of commands.items) {
      const object = command.object;
      if (command.kind === 'layer') {
        const group = command.object;
        this.inverse.copy(group.updateWorldMatrix()).invert();
        const cache = this.layers.get(group);
        const bounds =
          cache && group.cacheAsTexture && cache.version === group.cacheVersion
            ? cache.bounds
            : group.getLocalBounds();
        if (bounds.width > 0 && bounds.height > 0)
          this.validateBounds(bounds, this.resolution);
        if (group.mask?.texture)
          this.validateSource(group.mask.texture, group.mask.view);
        for (const filter of group.filters) {
          if (filter.destroyed)
            throw new GraphicsError('Cannot render a destroyed Filter2D.');
          if (filter instanceof DisplacementFilter2D)
            this.validateSource(filter.texture, filter.view);
        }
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
          if (command.object.material)
            this.hooks.material(command.object.material);
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
      if (object.destroyed)
        throw new GraphicsError('Cannot render a destroyed 2D object.');
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
      this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number,
    );
  }
  draw(
    commands: RenderCommandBuffer2D,
    scene: Scene,
    target: GLTarget2D,
    width: number,
    height: number,
  ): void {
    this.drawCommands(commands, {
      scene,
      target,
      bounds: { x: 0, y: 0, width, height },
    });
    for (const [group, entry] of this.layers)
      if (group.destroyed || !group.cacheAsTexture) {
        for (const target of entry.targets) this.hooks.deleteTarget(target);
        this.layers.delete(group);
      }
    for (const [layer, entry] of this.particles)
      if (layer.destroyed) {
        this.gl.deleteBuffer(entry.buffer);
        this.gl.deleteVertexArray(entry.vao);
        this.particles.delete(layer);
      }
  }
  private bindTarget(context: Context2D): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, context.target.framebuffer);
    gl.viewport(0, 0, context.target.width, context.target.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
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
  private useQuad(
    program: Program2D,
    context: Context2D,
    source: Texture2DSource | GLTarget2D,
    quad: TextureQuad2D,
    transform: Matrix3,
    appearance: Float32Array,
  ): void {
    const gl = this.gl;
    gl.useProgram(program.program);
    gl.bindVertexArray(this.emptyVAO);
    gl.uniformMatrix3fv(
      this.uniform(program, 'transform'),
      false,
      transform.elements,
    );
    gl.uniform2f(
      this.uniform(program, 'viewportSize'),
      context.bounds.width,
      context.bounds.height,
    );
    gl.uniform4fv(this.uniform(program, 'appearance'), appearance);
    gl.uniform4f(
      this.uniform(program, 'localRect'),
      quad.x,
      quad.y,
      quad.width,
      quad.height,
    );
    gl.uniform2f(this.uniform(program, 'uvOrigin'), quad.u0, quad.v0);
    gl.uniform4f(
      this.uniform(program, 'uvBasis'),
      quad.ux,
      quad.vx,
      quad.uy,
      quad.vy,
    );
    const left = Math.min(
      quad.u0,
      quad.u0 + quad.ux,
      quad.u0 + quad.uy,
      quad.u0 + quad.ux + quad.uy,
    );
    const top = Math.min(
      quad.v0,
      quad.v0 + quad.vx,
      quad.v0 + quad.vy,
      quad.v0 + quad.vx + quad.vy,
    );
    gl.uniform4f(
      this.uniform(program, 'sourceBounds'),
      left,
      top,
      Math.abs(quad.ux) + Math.abs(quad.uy),
      Math.abs(quad.vx) + Math.abs(quad.vy),
    );
    gl.uniform1i(this.uniform(program, 'image'), 0);
    gl.uniform1i(
      this.uniform(program, 'renderSource'),
      'kind' in source ? (source.kind === 'render' ? 1 : 0) : 1,
    );
    gl.uniform1i(this.uniform(program, 'tiling'), 0);
    gl.uniform1i(this.uniform(program, 'repeatUV'), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(
      gl.TEXTURE_2D,
      'kind' in source ? this.hooks.source(source) : source.texture,
    );
    gl.bindSampler(0, this.sampler(false, false));
  }
  private sampler(nearestMin: boolean, nearestMag: boolean): WebGLSampler {
    const key = (nearestMin ? 1 : 0) + (nearestMag ? 2 : 0),
      existing = this.samplers.get(key);
    if (existing) return existing;
    const gl = this.gl,
      sampler = gl.createSampler();
    if (!sampler) throw new GraphicsError('WebGL2 sampler allocation failed.');
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_MIN_FILTER,
      nearestMin ? gl.NEAREST : gl.LINEAR,
    );
    gl.samplerParameteri(
      sampler,
      gl.TEXTURE_MAG_FILTER,
      nearestMag ? gl.NEAREST : gl.LINEAR,
    );
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.samplers.set(key, sampler);
    return sampler;
  }
  private drawCommands(
    commands: RenderCommandBuffer2D,
    context: Context2D,
  ): void {
    this.hooks.stats.pass2D();
    const items = commands.items;
    for (let i = 0; i < items.length;) {
      const command = items[i];
      this.bindTarget(context);
      if (
        command.kind === 'sprite' &&
        !command.object.material &&
        !(command.object instanceof TilingSprite2D)
      ) {
        const sprite = command.object;
        let end = i + 1;
        while (end < items.length) {
          const next = items[end];
          if (
            next.kind !== 'sprite' ||
            next.object.material ||
            next.object instanceof TilingSprite2D ||
            next.object.texture !== sprite.texture ||
            (next.object.sampler?.minFilter === 'nearest') !==
              (sprite.sampler?.minFilter === 'nearest') ||
            (next.object.sampler?.magFilter === 'nearest') !==
              (sprite.sampler?.magFilter === 'nearest')
          )
            break;
          end++;
        }
        this.drawSprites(commands, i, end, context);
        i = end;
        continue;
      }
      if (command.kind === 'layer')
        this.drawLayer(command.object, command.commands, context);
      else if (command.kind === 'sprite')
        this.drawSprite(command.object, context);
      else if (command.kind === 'mesh') this.drawMesh(command.object, context);
      else this.drawParticles(command.object, context);
      i++;
    }
  }
  private bindInstances(
    vao: WebGLVertexArrayObject,
    buffer: WebGLBuffer,
    first: number,
  ): void {
    const gl = this.gl;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    for (let i = 0; i < 7; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 112, first * 112 + i * 16);
      gl.vertexAttribDivisor(i, 1);
    }
  }
  private packQuad(data: Float32Array, offset: number, q: TextureQuad2D): void {
    data[offset + 12] = q.x;
    data[offset + 13] = q.y;
    data[offset + 14] = q.width;
    data[offset + 15] = q.height;
    data[offset + 16] = q.u0;
    data[offset + 17] = q.v0;
    data[offset + 20] = q.ux;
    data[offset + 21] = q.vx;
    data[offset + 22] = q.uy;
    data[offset + 23] = q.vy;
    data[offset + 24] = Math.min(
      q.u0,
      q.u0 + q.ux,
      q.u0 + q.uy,
      q.u0 + q.ux + q.uy,
    );
    data[offset + 25] = Math.min(
      q.v0,
      q.v0 + q.vx,
      q.v0 + q.vy,
      q.v0 + q.vx + q.vy,
    );
    data[offset + 26] = Math.abs(q.ux) + Math.abs(q.uy);
    data[offset + 27] = Math.abs(q.vx) + Math.abs(q.vy);
  }
  private spriteMatrix(sprite: Sprite, context: Context2D): Matrix3 {
    this.objectMatrix(sprite, context, this.matrix);
    if (sprite.roundPixels) {
      this.matrix.elements[6] =
        (Math.round(
          (this.matrix.elements[6] * context.target.width) /
            context.bounds.width,
        ) *
          context.bounds.width) /
        context.target.width;
      this.matrix.elements[7] =
        (Math.round(
          (this.matrix.elements[7] * context.target.height) /
            context.bounds.height,
        ) *
          context.bounds.height) /
        context.target.height;
    }
    return this.matrix;
  }
  private drawSprites(
    commands: RenderCommandBuffer2D,
    first: number,
    end: number,
    context: Context2D,
  ): void {
    const gl = this.gl,
      count = end - first;
    if (count * 28 > this.spriteData.length)
      this.spriteData = new Float32Array(
        Math.max(count * 28, this.spriteData.length * 2),
      );
    for (let i = first; i < end; i++) {
      const command = commands.items[i];
      if (command.kind !== 'sprite') continue;
      const sprite = command.object,
        offset = (i - first) * 28,
        e = this.spriteMatrix(sprite, context).elements,
        data = this.spriteData;
      data[offset] = e[0];
      data[offset + 1] = e[1];
      data[offset + 2] = e[3];
      data[offset + 3] = e[4];
      data[offset + 4] = e[6];
      data[offset + 5] = e[7];
      getRelativeAppearance2D(sprite, context.root, this.appearance);
      data.set(this.appearance, offset + 8);
      this.packQuad(data, offset, getSpriteQuad2D(sprite, this.quad));
    }
    const command = commands.items[first];
    if (command.kind !== 'sprite') return;
    const sprite = command.object,
      program = this.spriteProgram;
    gl.useProgram(program.program);
    gl.uniform2f(
      this.uniform(program, 'viewportSize'),
      context.bounds.width,
      context.bounds.height,
    );
    gl.uniform1i(this.uniform(program, 'image'), 0);
    gl.uniform1i(
      this.uniform(program, 'renderSource'),
      sprite.texture.kind === 'render' ? 1 : 0,
    );
    gl.uniform1i(this.uniform(program, 'tiling'), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.hooks.source(sprite.texture));
    gl.bindSampler(
      0,
      this.sampler(
        sprite.sampler?.minFilter === 'nearest',
        sprite.sampler?.magFilter === 'nearest',
      ),
    );
    this.bindInstances(this.spriteVAO, this.spriteBuffer, 0);
    if (this.spriteCapacity < this.spriteData.byteLength) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.spriteData.byteLength,
        gl.DYNAMIC_DRAW,
      );
      this.spriteCapacity = this.spriteData.byteLength;
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.spriteData, 0, count * 28);
    this.hooks.stats.upload(count * 112);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    this.hooks.stats.draw2D(count);
  }
  private drawSprite(sprite: Sprite, context: Context2D): void {
    const gl = this.gl,
      quad = getSpriteQuad2D(sprite, this.quad);
    const program = sprite.material
      ? this.register(this.hooks.material(sprite.material))
      : this.quadProgram;
    this.spriteMatrix(sprite, context);
    getRelativeAppearance2D(sprite, context.root, this.appearance);
    this.useQuad(
      program,
      context,
      sprite.texture,
      quad,
      this.matrix,
      this.appearance,
    );
    gl.bindSampler(
      0,
      this.sampler(
        sprite.sampler?.minFilter === 'nearest',
        sprite.sampler?.magFilter === 'nearest',
      ),
    );
    if (sprite.material)
      gl.uniform4fv(
        this.uniform(program, 'uniforms[0]'),
        sprite.material.uniforms,
      );
    if (sprite instanceof TilingSprite2D) {
      const q = getTextureQuad2D(
        sprite.texture,
        sprite.view,
        sprite.source,
        this.sourceQuad,
      );
      gl.uniform1i(this.uniform(program, 'tiling'), 1);
      gl.uniform4f(
        this.uniform(program, 'tileShape'),
        q.naturalWidth,
        q.naturalHeight,
        0,
        0,
      );
      gl.uniform4f(
        this.uniform(program, 'tileTrim'),
        q.trimX,
        q.trimY,
        q.trimWidth,
        q.trimHeight,
      );
      gl.uniform2f(this.uniform(program, 'uvOrigin'), q.u0, q.v0);
      gl.uniform4f(this.uniform(program, 'uvBasis'), q.ux, q.vx, q.uy, q.vy);
      const e = this.tileMatrix.identity().elements,
        c = Math.cos(sprite.tileRotation),
        s = Math.sin(sprite.tileRotation);
      e[0] = c / sprite.tileScale.x;
      e[1] = -s / sprite.tileScale.y;
      e[3] = s / sprite.tileScale.x;
      e[4] = c / sprite.tileScale.y;
      e[6] =
        (-c * sprite.tilePosition.x - s * sprite.tilePosition.y) /
        sprite.tileScale.x;
      e[7] =
        (s * sprite.tilePosition.x - c * sprite.tilePosition.y) /
        sprite.tileScale.y;
      gl.uniformMatrix3fv(this.uniform(program, 'tileTransform'), false, e);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.hooks.stats.draw2D();
  }
  private drawMesh(mesh: Mesh2D, context: Context2D): void {
    const gl = this.gl,
      geometry = mesh.geometry;
    let entry = this.meshes.get(geometry);
    if (!entry) {
      const vao = gl.createVertexArray(),
        vertex = gl.createBuffer(),
        index = gl.createBuffer();
      if (!vao || !vertex || !index) {
        if (vao) gl.deleteVertexArray(vao);
        if (vertex) gl.deleteBuffer(vertex);
        if (index) gl.deleteBuffer(index);
        throw new GraphicsError('WebGL2 Mesh2D allocation failed.');
      }
      entry = {
        vao,
        vertex,
        index,
        data: new Float32Array(geometry.uvQ.length * 5),
        version: -1,
      };
      this.meshes.set(geometry, entry);
    }
    if (entry.version !== geometry.version) {
      for (let i = 0; i < geometry.uvQ.length; i++) {
        const o = i * 5;
        entry.data[o] = geometry.positions[i * 2];
        entry.data[o + 1] = geometry.positions[i * 2 + 1];
        entry.data[o + 2] = geometry.uvs[i * 2];
        entry.data[o + 3] = geometry.uvs[i * 2 + 1];
        entry.data[o + 4] = geometry.uvQ[i];
      }
      gl.bindVertexArray(entry.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, entry.vertex);
      gl.bufferData(gl.ARRAY_BUFFER, entry.data, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, entry.index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.DYNAMIC_DRAW);
      this.hooks.stats.upload(
        entry.data.byteLength + geometry.indices.byteLength,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
      entry.version = geometry.version;
    }
    getTextureQuad2D(mesh.texture, mesh.view, undefined, this.quad);
    getRelativeAppearance2D(mesh, context.root, this.appearance);
    this.useQuad(
      this.meshProgram,
      context,
      mesh.texture,
      this.quad,
      this.objectMatrix(mesh, context, this.matrix),
      this.appearance,
    );
    gl.uniform1i(
      this.uniform(this.meshProgram, 'repeatUV'),
      'textureMode' in mesh && mesh.textureMode === 'repeat' ? 1 : 0,
    );
    gl.bindVertexArray(entry.vao);
    gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_INT, 0);
    this.hooks.stats.draw2D();
  }
  private drawParticles(layer: ParticleLayer2D, context: Context2D): void {
    const gl = this.gl,
      stride = 28;
    let entry = this.particles.get(layer);
    if (!entry) {
      const vao = gl.createVertexArray(),
        buffer = gl.createBuffer();
      if (!vao || !buffer) {
        if (vao) gl.deleteVertexArray(vao);
        if (buffer) gl.deleteBuffer(buffer);
        throw new GraphicsError('WebGL2 particle allocation failed.');
      }
      entry = {
        vao,
        buffer,
        data: new Float32Array(layer.capacity * stride),
        versions: new Float64Array(layer.capacity * 4).fill(-1),
        slots: new Uint32Array(layer.capacity).fill(0xffffffff),
        generations: new Float64Array(layer.capacity).fill(-1),
      };
      this.particles.set(layer, entry);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, entry.data.byteLength, gl.DYNAMIC_DRAW);
      this.bindInstances(vao, buffer, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer);
    let dirtyFirst = -1,
      dirtyEnd = 0;
    for (let i = 0; i < layer.activeCount; i++) {
      const index = layer.activeSlotAt(i),
        slot = layer.getSlot(index),
        offset = i * stride,
        versions = i * 4,
        data = entry.data,
        moved =
          entry.slots[i] !== index || entry.generations[i] !== slot.generation,
        q = getTextureQuad2D(slot.texture, slot.view, slot.source, this.quad);
      const transformDirty =
        moved ||
        !!(layer.dynamicAttributes & ParticleAttribute2D.Transform) ||
        entry.versions[versions] !== slot.transformVersion;
      const tintDirty =
        moved ||
        !!(layer.dynamicAttributes & ParticleAttribute2D.Tint) ||
        entry.versions[versions + 1] !== slot.tintVersion;
      const sourceDirty =
        moved ||
        !!(
          layer.dynamicAttributes &
          (ParticleAttribute2D.Source | ParticleAttribute2D.Anchor)
        ) ||
        entry.versions[versions + 2] !== slot.sourceVersion ||
        entry.versions[versions + 3] !== slot.anchorVersion ||
        data[offset + 12] !==
          Math.fround(q.x - slot.anchorX * q.naturalWidth) ||
        data[offset + 13] !==
          Math.fround(q.y - slot.anchorY * q.naturalHeight) ||
        data[offset + 14] !== Math.fround(q.width) ||
        data[offset + 15] !== Math.fround(q.height) ||
        data[offset + 16] !== Math.fround(q.u0) ||
        data[offset + 17] !== Math.fround(q.v0) ||
        data[offset + 20] !== Math.fround(q.ux) ||
        data[offset + 21] !== Math.fround(q.vx) ||
        data[offset + 22] !== Math.fround(q.uy) ||
        data[offset + 23] !== Math.fround(q.vy);
      if (transformDirty) {
        data[offset] = slot.a;
        data[offset + 1] = slot.b;
        data[offset + 2] = slot.c;
        data[offset + 3] = slot.d;
        data[offset + 4] = slot.tx;
        data[offset + 5] = slot.ty;
        data[offset + 6] = slot.space === 'world' ? 1 : 0;
        entry.versions[versions] = slot.transformVersion;
      }
      if (tintDirty) {
        data[offset + 8] = slot.tintR;
        data[offset + 9] = slot.tintG;
        data[offset + 10] = slot.tintB;
        data[offset + 11] = slot.tintA;
        entry.versions[versions + 1] = slot.tintVersion;
      }
      if (sourceDirty) {
        this.packQuad(data, offset, q);
        data[offset + 12] = q.x - slot.anchorX * q.naturalWidth;
        data[offset + 13] = q.y - slot.anchorY * q.naturalHeight;
        entry.versions[versions + 2] = slot.sourceVersion;
        entry.versions[versions + 3] = slot.anchorVersion;
      }
      entry.slots[i] = index;
      entry.generations[i] = slot.generation;
      if (transformDirty || tintDirty || sourceDirty) {
        if (dirtyFirst < 0) dirtyFirst = offset;
        dirtyEnd = offset + stride;
      } else if (dirtyFirst >= 0) {
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          dirtyFirst * 4,
          data,
          dirtyFirst,
          dirtyEnd - dirtyFirst,
        );
        this.hooks.stats.upload((dirtyEnd - dirtyFirst) * 4);
        dirtyFirst = -1;
      }
    }
    if (dirtyFirst >= 0) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        dirtyFirst * 4,
        entry.data,
        dirtyFirst,
        dirtyEnd - dirtyFirst,
      );
      this.hooks.stats.upload((dirtyEnd - dirtyFirst) * 4);
    }
    this.objectMatrix(layer, context, this.matrix);
    this.objectMatrix(layer, context, this.mapping, true);
    getRelativeAppearance2D(layer, context.root, this.appearance);
    for (let first = 0; first < layer.activeCount;) {
      const slot = layer.getSlot(layer.activeSlotAt(first));
      let end = first + 1;
      while (
        end < layer.activeCount &&
        layer.getSlot(layer.activeSlotAt(end)).texture === slot.texture
      )
        end++;
      getTextureQuad2D(slot.texture, slot.view, slot.source, this.quad);
      this.useQuad(
        this.particleProgram,
        context,
        slot.texture,
        this.quad,
        this.matrix,
        this.appearance,
      );
      gl.uniformMatrix3fv(
        this.uniform(this.particleProgram, 'worldTransform'),
        false,
        this.mapping.elements,
      );
      this.bindInstances(entry.vao, entry.buffer, first);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, end - first);
      this.hooks.stats.draw2D(end - first);
      first = end;
    }
  }
  private layer(
    group: IsolatedGroup2D,
    commands: RenderCommandBuffer2D,
    scene: Scene,
  ): Layer2D | undefined {
    let entry = this.layers.get(group);
    if (entry && group.cacheAsTexture && entry.version === group.cacheVersion)
      return entry;
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
      const targets: GLTarget2D[] = [];
      try {
        for (let i = 0; i < 3; i++)
          targets.push(this.hooks.createTarget(width, height));
      } catch (error) {
        for (const target of targets) this.hooks.deleteTarget(target);
        throw error;
      }
      if (entry)
        for (const target of entry.targets) this.hooks.deleteTarget(target);
      entry = { targets, bounds, version: -1, result: targets[0] };
      this.layers.set(group, entry);
    }
    entry.bounds = bounds;
    const context: Context2D = {
      scene,
      target: entry.targets[0],
      bounds,
      root: group,
    };
    this.clear(context.target);
    this.drawCommands(commands, context);
    let input = entry.targets[0],
      output = entry.targets[1];
    if (group.mask) {
      this.drawMask(group.mask, entry.targets[2], bounds);
      this.pass(
        input,
        output,
        bounds,
        6,
        undefined,
        entry.targets[2],
        group.mask,
      );
      const swap = input;
      input = output;
      output = swap;
    }
    for (const filter of group.filters) {
      if (filter.kind === 'blur') {
        this.pass(input, output, bounds, 3, filter, undefined, undefined, true);
        const swap = input;
        input = output;
        output = swap;
        this.pass(
          input,
          output,
          bounds,
          3,
          filter,
          undefined,
          undefined,
          false,
        );
      } else
        this.pass(
          input,
          output,
          bounds,
          filter.kind === 'alpha'
            ? 1
            : filter.kind === 'color-matrix'
              ? 2
              : filter.kind === 'noise'
                ? 4
                : 5,
          filter,
        );
      const swap = input;
      input = output;
      output = swap;
    }
    entry.result = input;
    entry.version = group.cacheVersion;
    return entry;
  }
  private clear(target: GLTarget2D): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
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
    source: GLTarget2D,
    bounds: Rect2D,
    transform: Matrix3,
    appearance: Float32Array,
    blend: BlendMode2D,
    context: Context2D,
  ): void {
    const gl = this.gl,
      quad = this.quad;
    quad.x = bounds.x;
    quad.y = bounds.y;
    quad.width = bounds.width;
    quad.height = bounds.height;
    quad.u0 = quad.v0 = quad.vx = quad.uy = 0;
    quad.ux = quad.vy = 1;
    let backdrop: GLTarget2D | undefined;
    if (blend === 'multiply') {
      backdrop = this.hooks.createTarget(
        context.target.width,
        context.target.height,
      );
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, context.target.framebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, backdrop.framebuffer);
      this.hooks.stats.pass2D();
      gl.blitFramebuffer(
        0,
        0,
        context.target.width,
        context.target.height,
        0,
        0,
        context.target.width,
        context.target.height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST,
      );
    }
    try {
      this.bindTarget(context);
      const program = backdrop ? this.blendProgram : this.quadProgram;
      this.hooks.stats.pass2D();
      this.useQuad(program, context, source, quad, transform, appearance);
      if (backdrop) {
        gl.disable(gl.BLEND);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, backdrop.texture);
        gl.bindSampler(1, this.sampler(false, false));
        gl.uniform1i(this.uniform(program, 'backdrop'), 1);
      } else if (blend === 'erase')
        gl.blendFuncSeparate(
          gl.ZERO,
          gl.ONE_MINUS_SRC_ALPHA,
          gl.ZERO,
          gl.ONE_MINUS_SRC_ALPHA,
        );
      else if (blend === 'add')
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      else if (blend === 'screen')
        gl.blendFuncSeparate(
          gl.ONE,
          gl.ONE_MINUS_SRC_COLOR,
          gl.ONE,
          gl.ONE_MINUS_SRC_ALPHA,
        );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.hooks.stats.draw2D();
    } finally {
      if (backdrop) this.hooks.deleteTarget(backdrop);
    }
  }
  private drawMask(mask: Mask2D, target: GLTarget2D, bounds: Rect2D): void {
    const gl = this.gl;
    this.clear(target);
    this.hooks.stats.pass2D();
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
      this.appearance.fill(1);
      gl.disable(gl.BLEND);
      this.useQuad(
        this.quadProgram,
        { scene: undefined as unknown as Scene, target, bounds },
        mask.texture,
        this.quad,
        this.matrix,
        this.appearance,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.hooks.stats.draw2D();
      return;
    }
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    this.hooks.stats.upload(target.width * target.height * 4);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    canvas.width = canvas.height = 0;
  }
  private pass(
    input: GLTarget2D,
    output: GLTarget2D,
    bounds: Rect2D,
    mode: number,
    filter?: Filter2D,
    maskTarget?: GLTarget2D,
    mask?: Mask2D,
    horizontal = true,
  ): void {
    const gl = this.gl,
      program = this.passProgram;
    this.clear(output);
    this.hooks.stats.pass2D();
    gl.disable(gl.BLEND);
    gl.useProgram(program.program);
    gl.bindVertexArray(this.emptyVAO);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input.texture);
    gl.bindSampler(0, this.sampler(false, false));
    gl.uniform1i(this.uniform(program, 'image'), 0);
    gl.uniform1i(this.uniform(program, 'mode'), mode);
    gl.uniform2f(
      this.uniform(program, 'logicalSize'),
      bounds.width,
      bounds.height,
    );
    const u = filter?.uniforms;
    gl.uniform4f(
      this.uniform(program, 'parameters'),
      mode === 3 ? (horizontal ? u![0] : 0) : (u?.[0] ?? 0),
      mode === 3 ? (horizontal ? 0 : u![0]) : (u?.[1] ?? 0),
      mode === 3 ? u![1] * 4 : 0,
      0,
    );
    if (mode === 2) {
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 4; col++)
          this.matrixRows[row * 4 + col] = u![row * 5 + col];
      for (let i = 0; i < 4; i++) this.matrixRows[16 + i] = u![i * 5 + 4];
      gl.uniform4fv(this.uniform(program, 'rows[0]'), this.matrixRows);
    }
    if (filter instanceof DisplacementFilter2D || maskTarget) {
      const source =
        filter instanceof DisplacementFilter2D ? filter.texture : undefined;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(
        gl.TEXTURE_2D,
        source ? this.hooks.source(source) : maskTarget!.texture,
      );
      gl.bindSampler(1, this.sampler(false, false));
      gl.uniform1i(this.uniform(program, 'mapImage'), 1);
      if (source && filter instanceof DisplacementFilter2D) {
        const q = getTextureQuad2D(
          source,
          filter.view,
          undefined,
          this.sourceQuad,
        );
        gl.uniform2f(this.uniform(program, 'mapOrigin'), q.u0, q.v0);
        gl.uniform4f(this.uniform(program, 'mapBasis'), q.ux, q.vx, q.uy, q.vy);
        gl.uniform4f(
          this.uniform(program, 'mapBounds'),
          Math.min(q.u0, q.u0 + q.ux, q.u0 + q.uy),
          Math.min(q.v0, q.v0 + q.vx, q.v0 + q.vy),
          Math.abs(q.ux) + Math.abs(q.uy),
          Math.abs(q.vx) + Math.abs(q.vy),
        );
      } else {
        gl.uniform2f(this.uniform(program, 'mapOrigin'), 0, 0);
        gl.uniform4f(this.uniform(program, 'mapBasis'), 1, 0, 0, 1);
        gl.uniform4f(this.uniform(program, 'mapBounds'), 0, 0, 1, 1);
      }
      gl.uniform1i(
        this.uniform(program, 'mapRender'),
        source ? (source.kind === 'render' ? 1 : 0) : 1,
      );
      gl.uniform1i(
        this.uniform(program, 'mapRed'),
        mask?.channel === 'red' ? 1 : 0,
      );
      gl.uniform1i(this.uniform(program, 'inverseMask'), mask?.inverse ? 1 : 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.hooks.stats.draw2D();
  }

  createRenderTexture(options: RenderTextureOptions2D): RenderTexture2D {
    this.hooks.assertIdle();
    const size = validateRenderTextureSize2D(
      options,
      this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number,
    );
    let resource = this.hooks.createTarget(size.width, size.height);
    this.clear(resource);
    const texture = createOwnedRenderTexture2D(
      this.hooks.owner,
      size,
      (next) => {
        this.hooks.assertIdle();
        const replacement = this.hooks.createTarget(next.width, next.height);
        this.clear(replacement);
        this.hooks.deleteTarget(resource);
        resource = replacement;
        this.targets.set(texture, resource);
      },
      () => {
        this.targets.delete(texture);
        this.hooks.deleteTarget(resource);
      },
    );
    this.targets.set(texture, resource);
    return texture;
  }
  source(texture: RenderTexture2D): WebGLTexture {
    assertRenderTextureOwner2D(texture, this.hooks.owner);
    const target = this.targets.get(texture);
    if (!target)
      throw new GraphicsError('Render texture has no native storage.');
    return target.texture;
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
    this.preflight(
      this.captureCommands,
      scene,
      bounds.width,
      bounds.height,
      target.resolution,
    );
    if (root) {
      if (root.mask?.texture)
        this.validateSource(root.mask.texture, root.mask.view);
      for (const filter of root.filters) {
        if (filter.destroyed)
          throw new GraphicsError('Cannot render a destroyed filter.');
        if (filter instanceof DisplacementFilter2D)
          this.validateSource(filter.texture, filter.view);
      }
    }
    validateRenderTextureDependencies2D(
      target,
      this.dependencies,
      this.hooks.owner,
    );
    const destination = this.targets.get(target)!;
    // Render transactionally: failures leave the published mutable target untouched.
    const staging = this.hooks.createTarget(target.width, target.height);
    try {
      this.clear(staging);
      if (options.clear === false) {
        this.gl.bindFramebuffer(
          this.gl.READ_FRAMEBUFFER,
          destination.framebuffer,
        );
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, staging.framebuffer);
        this.hooks.stats.pass2D();
        this.gl.blitFramebuffer(
          0,
          0,
          target.width,
          target.height,
          0,
          0,
          target.width,
          target.height,
          this.gl.COLOR_BUFFER_BIT,
          this.gl.NEAREST,
        );
      }
      const context: Context2D = {
        scene,
        target: staging,
        bounds,
        ...(root ? { root } : {}),
      };
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
      if (!root && scene.effects2D.length)
        this.drawSceneEffects(scene, staging, bounds);
      this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, staging.framebuffer);
      this.gl.bindFramebuffer(
        this.gl.DRAW_FRAMEBUFFER,
        destination.framebuffer,
      );
      this.hooks.stats.pass2D();
      this.gl.blitFramebuffer(
        0,
        0,
        target.width,
        target.height,
        0,
        0,
        target.width,
        target.height,
        this.gl.COLOR_BUFFER_BIT,
        this.gl.NEAREST,
      );
      target.publish(this.hooks.owner, this.dependencies);
      this.gl.flush();
    } finally {
      this.hooks.deleteTarget(staging);
      this.captureCommands.clear();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.bindVertexArray(null);
    }
  }
  private drawSceneEffects(
    scene: Scene,
    target: GLTarget2D,
    bounds: Rect2D,
  ): void {
    const ping = this.hooks.createTarget(target.width, target.height);
    const gl = this.gl;
    let input = target,
      output = ping;
    try {
      for (const effect of scene.effects2D) {
        const program = this.register(this.hooks.processor(effect));
        this.clear(output);
        this.hooks.stats.pass2D();
        gl.disable(gl.BLEND);
        gl.bindVertexArray(this.emptyVAO);
        gl.useProgram(program.program);
        gl.uniform2f(
          this.uniform(program, 'viewportSize'),
          bounds.width,
          bounds.height,
        );
        gl.uniform4fv(this.uniform(program, 'uniforms[0]'), effect.uniforms);
        gl.uniform1i(this.uniform(program, 'image'), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, input.texture);
        gl.bindSampler(0, this.sampler(false, false));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        this.hooks.stats.draw2D();
        const swap = input;
        input = output;
        output = swap;
      }
      if (input !== target) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, input.framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, target.framebuffer);
        this.hooks.stats.pass2D();
        gl.blitFramebuffer(
          0,
          0,
          target.width,
          target.height,
          0,
          0,
          target.width,
          target.height,
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST,
        );
      }
    } finally {
      this.hooks.deleteTarget(ping);
    }
  }
  async extractPixels(
    target: RenderTexture2D,
    options: { region?: Rect2D } = {},
  ): Promise<Uint8ClampedArray> {
    this.hooks.assertIdle();
    assertRenderTextureOwner2D(target, this.hooks.owner);
    const region = validateRenderTextureRegion2D(target, options.region),
      resource = this.targets.get(target)!,
      gl = this.gl;
    const raw = new Uint8Array(region.width * region.height * 4),
      pixels = new Uint8ClampedArray(raw.length);
    gl.bindFramebuffer(gl.FRAMEBUFFER, resource.framebuffer);
    gl.readPixels(
      region.x,
      target.height - region.y - region.height,
      region.width,
      region.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      raw,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const error = gl.getError();
    if (error !== gl.NO_ERROR)
      throw new GraphicsError(
        `WebGL2 extraction failed (0x${error.toString(16)}).`,
      );
    for (let y = 0; y < region.height; y++)
      for (let x = 0; x < region.width; x++) {
        const from = ((region.height - 1 - y) * region.width + x) * 4,
          to = (y * region.width + x) * 4,
          a = raw[from + 3];
        pixels[to + 3] = a;
        for (let c = 0; c < 3; c++)
          pixels[to + c] = a ? Math.round((raw[from + c] * 255) / a) : 0;
      }
    return pixels;
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
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    for (const texture of this.targets.keys()) texture.destroy();
    for (const entry of this.layers.values())
      for (const target of entry.targets) this.hooks.deleteTarget(target);
    for (const entry of this.meshes.values()) {
      gl.deleteVertexArray(entry.vao);
      gl.deleteBuffer(entry.vertex);
      gl.deleteBuffer(entry.index);
    }
    for (const entry of this.particles.values()) {
      gl.deleteVertexArray(entry.vao);
      gl.deleteBuffer(entry.buffer);
    }
    for (const sampler of this.samplers.values()) gl.deleteSampler(sampler);
    for (const program of [
      this.quadProgram,
      this.spriteProgram,
      this.meshProgram,
      this.particleProgram,
      this.passProgram,
      this.blendProgram,
    ])
      gl.deleteProgram(program.program);
    gl.deleteVertexArray(this.emptyVAO);
    gl.deleteVertexArray(this.spriteVAO);
    gl.deleteBuffer(this.spriteBuffer);
    this.targets.clear();
    this.layers.clear();
    this.meshes.clear();
    this.particles.clear();
    this.samplers.clear();
    this.programs.clear();
    this.captureCommands.destroy();
  }
}
