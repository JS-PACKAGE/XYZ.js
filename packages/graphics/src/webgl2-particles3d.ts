import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
import {
  GPU_PARTICLE_COMMAND_FLOATS,
  GPU_PARTICLE_UNIFORM_FLOATS,
} from '../../../src/data/gpu-particles3d.js';
import { GraphicsError } from './errors.js';
import { ParticleUniforms3D } from './gpu-particles3d-data.js';
import {
  gpuParticles3DFragmentGLSL,
  gpuParticles3DVertexGLSL,
} from './gpu-particles3d-shaders.js';
import type { FrameStats } from './render-stats.js';

interface ParticleBuffers {
  commands: WebGLBuffer;
  uniform: WebGLBuffer;
  vao: WebGLVertexArrayObject;
  version: number;
  seen: number;
  prepared: boolean;
  unown: () => void;
}

/** GLSL ES 3.00 analytic instanced vertices; no CPU simulation/uploaded positions. */
export class WebGL2Particles3D {
  private readonly buffers = new Map<GPUParticleEmitter3D, ParticleBuffers>();
  private readonly ranges = new Int32Array(4);
  private readonly uniforms = new ParticleUniforms3D();
  private readonly program: WebGLProgram;
  private frame = 0;
  private disposed = false;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly stats: FrameStats,
  ) {
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    try {
      for (const [kind, source] of [
        [gl.VERTEX_SHADER, gpuParticles3DVertexGLSL],
        [gl.FRAGMENT_SHADER, gpuParticles3DFragmentGLSL],
      ] as const) {
        const shader = gl.createShader(kind);
        if (!shader)
          throw new GraphicsError('GPU particle shader allocation failed.');
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new GraphicsError(
            `GPU particle GLSL compilation failed: ${gl.getShaderInfoLog(shader) ?? 'unknown error'}`,
          );
      }
      program = gl.createProgram();
      if (!program)
        throw new GraphicsError('GPU particle program allocation failed.');
      for (const shader of shaders) gl.attachShader(program, shader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new GraphicsError(
          `GPU particle GLSL link failed: ${gl.getProgramInfoLog(program) ?? 'unknown error'}`,
        );
      const block = gl.getUniformBlockIndex(program, 'Uniforms');
      if (block === gl.INVALID_INDEX)
        throw new GraphicsError('GPU particle uniform ABI is unavailable.');
      gl.uniformBlockBinding(program, block, 0);
      this.program = program;
    } catch (error) {
      if (program) {
        gl.deleteProgram(program);
        program = null;
      }
      throw error;
    } finally {
      for (const shader of shaders) {
        if (program) gl.detachShader(program, shader);
        gl.deleteShader(shader);
      }
    }
  }

  get nativeBufferCount(): number {
    return this.buffers.size * 2;
  }

  prepare(emitter: GPUParticleEmitter3D): void {
    const gl = this.gl;
    if (this.disposed || emitter.destroyed || gl.isContextLost())
      throw new GraphicsError('Cannot prepare destroyed/lost GPU particles.');
    const vao = gl.getParameter(
      gl.VERTEX_ARRAY_BINDING,
    ) as WebGLVertexArrayObject | null;
    const array = gl.getParameter(
      gl.ARRAY_BUFFER_BINDING,
    ) as WebGLBuffer | null;
    const uniform = gl.getParameter(
      gl.UNIFORM_BUFFER_BINDING,
    ) as WebGLBuffer | null;
    try {
      const entry = this.buffers.get(emitter) ?? this.allocate(emitter);
      entry.prepared = true;
      if (entry.version !== emitter.commandVersion) {
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.commands);
        this.uploadCommands(entry, emitter);
      }
    } finally {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, array);
      gl.bindBuffer(gl.UNIFORM_BUFFER, uniform);
    }
  }

  /**
   * Draw into the renderer's current color/depth framebuffer, before post/2D. Bindings
   * and enable caps are restored. Fixed-function values are not read back: unlike
   * bindings, each such query is a synchronous GPU-process round trip. The engine only
   * binds whole uniform buffers and only ever leaves LESS depth testing and FUNC_ADD
   * blending in place, which this restores; the caller re-establishes depth writes and
   * blend factors.
   */
  draw(
    emitters: Iterable<GPUParticleEmitter3D>,
    camera: Camera3D,
    aspect: number,
    linear = false,
  ): void {
    if (this.disposed)
      throw new GraphicsError('GPU particle backend is destroyed.');
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.frame++;
    const previous = {
      program: gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null,
      vao: gl.getParameter(
        gl.VERTEX_ARRAY_BINDING,
      ) as WebGLVertexArrayObject | null,
      array: gl.getParameter(gl.ARRAY_BUFFER_BINDING) as WebGLBuffer | null,
      uniform: gl.getParameter(gl.UNIFORM_BUFFER_BINDING) as WebGLBuffer | null,
      uniform0: gl.getIndexedParameter(
        gl.UNIFORM_BUFFER_BINDING,
        0,
      ) as WebGLBuffer | null,
      blend: gl.isEnabled(gl.BLEND),
      depth: gl.isEnabled(gl.DEPTH_TEST),
      cull: gl.isEnabled(gl.CULL_FACE),
    };
    try {
      gl.useProgram(this.program);
      gl.enable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.depthFunc(gl.LEQUAL);
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
      gl.blendFuncSeparate(
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
      );
      for (const emitter of emitters) {
        if (emitter.destroyed) {
          this.release(emitter);
          continue;
        }
        let entry = this.buffers.get(emitter);
        if (emitter.activeCount === 0) {
          if (entry?.prepared) entry.seen = this.frame;
          else this.release(emitter);
          continue;
        }
        if (!emitter.worldVisible) {
          if (entry) entry.seen = this.frame;
          continue;
        }
        entry ??= this.allocate(emitter);
        entry.seen = this.frame;
        gl.bindVertexArray(entry.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, entry.commands);
        if (entry.version !== emitter.commandVersion)
          this.uploadCommands(entry, emitter);
        const data = this.uniforms.fill(emitter, camera, aspect, linear);
        gl.bindBuffer(gl.UNIFORM_BUFFER, entry.uniform);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, entry.uniform);
        this.stats.upload(data.byteLength);
        const first = Math.min(
          emitter.activeCount,
          emitter.capacity - emitter.commandHead,
        );
        this.drawRange(emitter.commandHead, first);
        const second = emitter.activeCount - first;
        if (second) this.drawRange(0, second);
      }
      for (const [emitter, entry] of this.buffers)
        if (entry.seen !== this.frame && !entry.prepared) this.release(emitter);
    } finally {
      gl.useProgram(previous.program);
      gl.bindVertexArray(previous.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, previous.array);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, previous.uniform0);
      gl.bindBuffer(gl.UNIFORM_BUFFER, previous.uniform);
      // Blending stays FUNC_ADD, the only equation the engine uses.
      gl.depthFunc(gl.LESS);
      if (previous.blend) gl.enable(gl.BLEND);
      else gl.disable(gl.BLEND);
      if (previous.depth) gl.enable(gl.DEPTH_TEST);
      else gl.disable(gl.DEPTH_TEST);
      if (previous.cull) gl.enable(gl.CULL_FACE);
      else gl.disable(gl.CULL_FACE);
    }
  }

  /** Retire scene-excluded resources even when no color pass is opened. */
  synchronize(emitters: Iterable<GPUParticleEmitter3D>): void {
    this.frame++;
    for (const emitter of emitters) {
      const entry = this.buffers.get(emitter);
      if (entry && !emitter.destroyed) entry.seen = this.frame;
    }
    for (const [emitter, entry] of this.buffers)
      if (entry.seen !== this.frame) this.release(emitter);
  }

  /** Release emitter allocations while keeping the reusable native program. */
  clear(): void {
    for (const emitter of this.buffers.keys()) this.release(emitter);
  }

  /** Loss/restoration uses a fresh module/program; retained commands rebuild lazily. */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear();
    this.gl.deleteProgram(this.program);
  }
  /** Sends the slots written since this entry's version into the bound ARRAY_BUFFER. */
  private uploadCommands(
    entry: ParticleBuffers,
    emitter: GPUParticleEmitter3D,
  ): void {
    const gl = this.gl,
      data = emitter.commandData;
    const count = emitter.changedCommandRanges(entry.version, this.ranges);
    if (count < 0) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      this.stats.upload(data.byteLength);
    } else
      for (let i = 0; i < count; i++) {
        const first = this.ranges[i * 2]! * GPU_PARTICLE_COMMAND_FLOATS,
          floats = this.ranges[i * 2 + 1]! * GPU_PARTICLE_COMMAND_FLOATS;
        gl.bufferSubData(gl.ARRAY_BUFFER, first * 4, data, first, floats);
        this.stats.upload(floats * 4);
      }
    entry.version = emitter.commandVersion;
  }
  private drawRange(first: number, count: number): void {
    const gl = this.gl;
    const stride = GPU_PARTICLE_COMMAND_FLOATS * 4;
    const offset = first * stride;
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, stride, offset);
    gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, stride, offset + 4);
    for (let column = 0; column < 4; column++)
      gl.vertexAttribPointer(
        column + 2,
        4,
        gl.FLOAT,
        false,
        stride,
        offset + 16 + column * 16,
      );
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    this.stats.draw(6, count);
  }
  private allocate(emitter: GPUParticleEmitter3D): ParticleBuffers {
    const gl = this.gl;
    const commands = gl.createBuffer();
    const uniform = gl.createBuffer();
    const vao = gl.createVertexArray();
    try {
      if (!commands || !uniform || !vao)
        throw new GraphicsError(
          'GPU particle native buffer allocation failed.',
        );
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, commands);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        emitter.commandData.byteLength,
        gl.DYNAMIC_DRAW,
      );
      for (let attribute = 0; attribute < 6; attribute++) {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribDivisor(attribute, 1);
      }
      gl.bindBuffer(gl.UNIFORM_BUFFER, uniform);
      gl.bufferData(
        gl.UNIFORM_BUFFER,
        GPU_PARTICLE_UNIFORM_FLOATS * 4,
        gl.DYNAMIC_DRAW,
      );
      const unown = emitter.ownNative(() => this.release(emitter));
      const entry: ParticleBuffers = {
        commands,
        uniform,
        vao,
        version: -1,
        seen: this.frame,
        prepared: false,
        unown,
      };
      this.buffers.set(emitter, entry);
      return entry;
    } catch (error) {
      gl.deleteBuffer(commands);
      gl.deleteBuffer(uniform);
      gl.deleteVertexArray(vao);
      throw error;
    }
  }
  private release(emitter: GPUParticleEmitter3D): void {
    const entry = this.buffers.get(emitter);
    if (!entry) return;
    this.buffers.delete(emitter);
    entry.unown();
    this.gl.deleteBuffer(entry.commands);
    this.gl.deleteBuffer(entry.uniform);
    this.gl.deleteVertexArray(entry.vao);
  }
}
