import type { PostProcessingSettings } from '../../core/src/render-settings.js';
import type { FrameStats } from './render-stats.js';
import { GraphicsError } from './errors.js';
import {
  temporalGLVertex,
  temporalGLFragment,
} from './temporal-post-shaders.js';
import { TemporalPostState, writeTemporalUniforms } from './temporal-post.js';

export interface GLTemporalTarget {
  readonly texture: WebGLTexture;
  readonly framebuffer: WebGLFramebuffer;
  readonly depth?: WebGLTexture;
}

/** Renderer-owned HDR post targets; input depth must be a resolved sampleable depth texture. */
export class WebGLTemporalPipeline {
  private readonly ssrProgram: WebGLProgram;
  private readonly taaProgram: WebGLProgram;
  private readonly uniform: WebGLBuffer;
  private readonly vao: WebGLVertexArrayObject;
  private readonly data = new Float32Array(60);
  private scratch: GLTemporalTarget | undefined;
  private readonly history: GLTemporalTarget[] = [];
  private width = 0;
  private height = 0;
  private index = 0;
  private state: TemporalPostState | undefined;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly stats: FrameStats,
  ) {
    if (!gl.getExtension('EXT_color_buffer_float'))
      throw new GraphicsError(
        'Temporal HDR passes require EXT_color_buffer_float.',
      );
    this.ssrProgram = this.compile(false);
    try {
      this.taaProgram = this.compile(true);
    } catch (error) {
      gl.deleteProgram(this.ssrProgram);
      throw error;
    }
    const uniform = gl.createBuffer(),
      vao = gl.createVertexArray();
    if (!uniform || !vao) {
      gl.deleteBuffer(uniform);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(this.ssrProgram);
      gl.deleteProgram(this.taaProgram);
      throw new GraphicsError('Unable to allocate temporal GL resources.');
    }
    this.uniform = uniform;
    this.vao = vao;
    const previous = gl.getParameter(
      gl.UNIFORM_BUFFER_BINDING,
    ) as WebGLBuffer | null;
    gl.bindBuffer(gl.UNIFORM_BUFFER, uniform);
    gl.bufferData(gl.UNIFORM_BUFFER, 240, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, previous);
  }

  private compile(taa: boolean): WebGLProgram {
    const gl = this.gl;
    const vertex = gl.createShader(gl.VERTEX_SHADER),
      fragment = gl.createShader(gl.FRAGMENT_SHADER),
      program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
      throw new GraphicsError('Unable to allocate temporal GL program.');
    }
    try {
      gl.shaderSource(vertex, temporalGLVertex);
      gl.shaderSource(fragment, temporalGLFragment(taa));
      gl.compileShader(vertex);
      gl.compileShader(fragment);
      if (
        !gl.getShaderParameter(vertex, gl.COMPILE_STATUS) ||
        !gl.getShaderParameter(fragment, gl.COMPILE_STATUS)
      )
        throw new GraphicsError(
          `Temporal shader compilation failed: ${gl.getShaderInfoLog(vertex)} ${gl.getShaderInfoLog(fragment)}`,
        );
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new GraphicsError(
          `Temporal program link failed: ${gl.getProgramInfoLog(program)}`,
        );
      gl.uniformBlockBinding(
        program,
        gl.getUniformBlockIndex(program, 'Settings'),
        0,
      );
      return program;
    } catch (error) {
      gl.deleteProgram(program);
      throw error;
    } finally {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    }
  }

  private ensure(state: TemporalPostState): void {
    if (
      this.width === state.width &&
      this.height === state.height &&
      this.scratch
    ) {
      this.state = state;
      return;
    }
    this.releaseTarget();
    state.invalidate();
    this.state = state;
    this.width = state.width;
    this.height = state.height;
    try {
      this.scratch = this.allocate(false);
      this.history.push(this.allocate(true));
      this.history.push(this.allocate(true));
    } catch (error) {
      this.releaseTarget();
      throw error;
    }
  }

  private allocate(history: boolean): GLTemporalTarget {
    const gl = this.gl;
    const texture = gl.createTexture(),
      framebuffer = gl.createFramebuffer(),
      depth = history ? gl.createTexture() : undefined;
    if (!texture || !framebuffer || (history && !depth)) {
      gl.deleteTexture(texture);
      gl.deleteTexture(depth ?? null);
      gl.deleteFramebuffer(framebuffer);
      throw new GraphicsError('Unable to allocate temporal GL target.');
    }
    const previousTexture = gl.getParameter(
      gl.TEXTURE_BINDING_2D,
    ) as WebGLTexture | null;
    const previousFramebuffer = gl.getParameter(
      gl.DRAW_FRAMEBUFFER_BINDING,
    ) as WebGLFramebuffer | null;
    try {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, this.width, this.height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0,
      );
      if (depth) {
        gl.bindTexture(gl.TEXTURE_2D, depth);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.width, this.height);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(
          gl.DRAW_FRAMEBUFFER,
          gl.COLOR_ATTACHMENT1,
          gl.TEXTURE_2D,
          depth,
          0,
        );
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      } else gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      if (
        gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER) !==
        gl.FRAMEBUFFER_COMPLETE
      )
        throw new GraphicsError('Temporal HDR framebuffer is incomplete.');
      this.stats.target(this.width * this.height * (history ? 12 : 8));
      return depth ? { texture, framebuffer, depth } : { texture, framebuffer };
    } catch (error) {
      gl.deleteTexture(texture);
      gl.deleteTexture(depth ?? null);
      gl.deleteFramebuffer(framebuffer);
      throw error;
    } finally {
      gl.bindTexture(gl.TEXTURE_2D, previousTexture);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, previousFramebuffer);
    }
  }

  applyOpaqueSSR(
    source: WebGLTexture,
    depth: WebGLTexture,
    state: TemporalPostState,
    settings: PostProcessingSettings,
  ): GLTemporalTarget {
    this.ensure(state);
    this.render(source, depth, state, settings, false);
    return this.scratch!;
  }

  applyTAA(
    source: WebGLTexture,
    depth: WebGLTexture,
    state: TemporalPostState,
    settings: PostProcessingSettings,
  ): GLTemporalTarget {
    this.ensure(state);
    this.render(source, depth, state, settings, true);
    const result = this.history[this.index]!;
    this.index = 1 - this.index;
    return result;
  }

  private render(
    source: WebGLTexture,
    depth: WebGLTexture,
    state: TemporalPostState,
    settings: PostProcessingSettings,
    taa: boolean,
  ): void {
    const gl = this.gl,
      target = taa ? this.history[this.index]! : this.scratch!,
      program = taa ? this.taaProgram : this.ssrProgram;
    const oldProgram = gl.getParameter(
        gl.CURRENT_PROGRAM,
      ) as WebGLProgram | null,
      oldVAO = gl.getParameter(
        gl.VERTEX_ARRAY_BINDING,
      ) as WebGLVertexArrayObject | null;
    const oldFramebuffer = gl.getParameter(
        gl.DRAW_FRAMEBUFFER_BINDING,
      ) as WebGLFramebuffer | null,
      oldViewport = gl.getParameter(gl.VIEWPORT) as Int32Array;
    const active = gl.getParameter(gl.ACTIVE_TEXTURE) as number,
      oldBuffer = gl.getParameter(
        gl.UNIFORM_BUFFER_BINDING,
      ) as WebGLBuffer | null;
    const oldIndexedBuffer = gl.getIndexedParameter(
      gl.UNIFORM_BUFFER_BINDING,
      0,
    ) as WebGLBuffer | null;
    const textures: (WebGLTexture | null)[] = [];
    const samplers: (WebGLSampler | null)[] = [];
    const capabilities = [
      gl.DEPTH_TEST,
      gl.BLEND,
      gl.CULL_FACE,
      gl.SCISSOR_TEST,
    ];
    const enabled = capabilities.map((cap) => gl.isEnabled(cap));
    const mask = gl.getParameter(gl.COLOR_WRITEMASK) as boolean[];
    try {
      capabilities.forEach((cap) => gl.disable(cap));
      gl.colorMask(true, true, true, true);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, this.width, this.height);
      gl.useProgram(program);
      gl.bindVertexArray(this.vao);
      writeTemporalUniforms(this.data, state, settings);
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.uniform);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.data);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.uniform);
      this.stats.upload(240);
      const inputs = taa
        ? [
            source,
            depth,
            this.history[1 - this.index]!.texture,
            this.history[1 - this.index]!.depth!,
          ]
        : [source, depth];
      const names = [
        'sourceImage',
        'depthImage',
        'historyImage',
        'historyDepth',
      ];
      for (let i = 0; i < inputs.length; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        textures.push(
          gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null,
        );
        samplers.push(
          gl.getParameter(gl.SAMPLER_BINDING) as WebGLSampler | null,
        );
        gl.bindSampler(i, null);
        gl.bindTexture(gl.TEXTURE_2D, inputs[i]!);
        gl.uniform1i(gl.getUniformLocation(program, names[i]!), i);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } finally {
      for (let i = 0; i < textures.length; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, textures[i]!);
        gl.bindSampler(i, samplers[i]!);
      }
      gl.activeTexture(active);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, oldIndexedBuffer);
      gl.bindBuffer(gl.UNIFORM_BUFFER, oldBuffer);
      gl.useProgram(oldProgram);
      gl.bindVertexArray(oldVAO);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, oldFramebuffer);
      gl.viewport(
        oldViewport[0]!,
        oldViewport[1]!,
        oldViewport[2]!,
        oldViewport[3]!,
      );
      gl.colorMask(mask[0]!, mask[1]!, mask[2]!, mask[3]!);
      capabilities.forEach((cap, i) => {
        if (enabled[i]) gl.enable(cap);
        else gl.disable(cap);
      });
    }
  }

  blit(source: GLTemporalTarget, destination: WebGLFramebuffer): void {
    const gl = this.gl;
    const read = gl.getParameter(
        gl.READ_FRAMEBUFFER_BINDING,
      ) as WebGLFramebuffer | null,
      draw = gl.getParameter(
        gl.DRAW_FRAMEBUFFER_BINDING,
      ) as WebGLFramebuffer | null;
    const scissor = gl.isEnabled(gl.SCISSOR_TEST);
    try {
      gl.disable(gl.SCISSOR_TEST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source.framebuffer);
      gl.readBuffer(gl.COLOR_ATTACHMENT0);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destination);
      gl.blitFramebuffer(
        0,
        0,
        this.width,
        this.height,
        0,
        0,
        this.width,
        this.height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST,
      );
    } finally {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, read);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, draw);
      if (scissor) gl.enable(gl.SCISSOR_TEST);
    }
  }

  resize(width: number, height: number): void {
    if (width !== this.width || height !== this.height) this.releaseTarget();
  }
  releaseTarget(): void {
    this.state?.invalidate();
    this.state = undefined;
    if (this.scratch) {
      this.gl.deleteTexture(this.scratch.texture);
      this.gl.deleteFramebuffer(this.scratch.framebuffer);
      this.stats.target(-this.width * this.height * 8);
    }
    for (const target of this.history) {
      this.gl.deleteTexture(target.texture);
      this.gl.deleteTexture(target.depth ?? null);
      this.gl.deleteFramebuffer(target.framebuffer);
      this.stats.target(-this.width * this.height * 12);
    }
    this.scratch = undefined;
    this.history.length = 0;
    this.width = 0;
    this.height = 0;
    this.index = 0;
  }
  destroy(): void {
    this.releaseTarget();
    this.gl.deleteProgram(this.ssrProgram);
    this.gl.deleteProgram(this.taaProgram);
    this.gl.deleteBuffer(this.uniform);
    this.gl.deleteVertexArray(this.vao);
  }
}
