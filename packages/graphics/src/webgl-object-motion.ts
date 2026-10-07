import type { Mesh } from '../../core/src/mesh.js';
import type { TemporalPostState } from './temporal-post.js';
import type { FrameStats } from './render-stats.js';
import { GraphicsError } from './errors.js';
import {
  ObjectMotionHistory,
  objectMotionGLVertex,
  objectMotionGLFragment,
} from './object-motion.js';

/** Renderer-owned velocity target and program; cached geometry and scene depth are borrowed. */
export class WebGLObjectMotion {
  private readonly history = new ObjectMotionHistory();
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly current: WebGLUniformLocation | null;
  private readonly previous: WebGLUniformLocation | null;
  private readonly depth: WebGLUniformLocation | null;
  private texture?: WebGLTexture;
  private framebuffer?: WebGLFramebuffer;
  private width = 0;
  private height = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly stats: FrameStats,
  ) {
    const vertex = gl.createShader(gl.VERTEX_SHADER),
      fragment = gl.createShader(gl.FRAGMENT_SHADER),
      program = gl.createProgram(),
      vao = gl.createVertexArray();
    if (!vertex || !fragment || !program || !vao) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      throw new GraphicsError('Unable to allocate object motion GL resources.');
    }
    try {
      gl.shaderSource(vertex, objectMotionGLVertex);
      gl.shaderSource(fragment, objectMotionGLFragment);
      gl.compileShader(vertex);
      gl.compileShader(fragment);
      if (
        !gl.getShaderParameter(vertex, gl.COMPILE_STATUS) ||
        !gl.getShaderParameter(fragment, gl.COMPILE_STATUS)
      )
        throw new GraphicsError(
          `Object motion shader compilation failed: ${gl.getShaderInfoLog(vertex)} ${gl.getShaderInfoLog(fragment)}`,
        );
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new GraphicsError(
          `Object motion program link failed: ${gl.getProgramInfoLog(program)}`,
        );
      this.program = program;
      this.vao = vao;
      this.current = gl.getUniformLocation(program, 'currentClip');
      this.previous = gl.getUniformLocation(program, 'previousClip');
      this.depth = gl.getUniformLocation(program, 'opaqueDepth');
    } catch (error) {
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      throw error;
    } finally {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    }
  }

  render(
    meshes: readonly Mesh[],
    state: TemporalPostState,
    depth: WebGLTexture,
    geometry: (mesh: Mesh) => { vertex: WebGLBuffer; index: WebGLBuffer },
  ): WebGLTexture {
    const gl = this.gl;
    this.resize(state.width, state.height);
    if (!this.texture) {
      const texture = gl.createTexture(),
        framebuffer = gl.createFramebuffer();
      if (!texture || !framebuffer) {
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
        throw new GraphicsError('Unable to allocate object motion GL target.');
      }
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA16F,
          state.width,
          state.height,
          0,
          gl.RGBA,
          gl.HALF_FLOAT,
          null,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        if (
          gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE
        )
          throw new GraphicsError(
            'Object motion GL framebuffer is incomplete; float color support is required.',
          );
        this.texture = texture;
        this.framebuffer = framebuffer;
        this.stats.target(state.width * state.height * 8);
      } catch (error) {
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
        throw error;
      }
    }
    const draws = this.history.build(meshes, state);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer!);
    gl.viewport(0, 0, state.width, state.height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);
    gl.colorMask(true, true, true, true);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindSampler(0, null);
    gl.bindTexture(gl.TEXTURE_2D, depth);
    gl.uniform1i(this.depth, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribDivisor(0, 0);
    for (const draw of draws) {
      const cached = geometry(draw.mesh);
      gl.bindBuffer(gl.ARRAY_BUFFER, cached.vertex);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cached.index);
      gl.uniformMatrix4fv(this.current, false, draw.data, 0, 16);
      gl.uniformMatrix4fv(this.previous, false, draw.data, 16, 16);
      gl.drawElements(
        gl.TRIANGLES,
        draw.mesh.renderGeometry.indices.length,
        gl.UNSIGNED_INT,
        0,
      );
      this.stats.draw(draw.mesh.renderGeometry.indices.length, 1);
    }
    gl.bindVertexArray(null);
    return this.texture!;
  }

  resize(width: number, height: number): void {
    if (width !== this.width || height !== this.height) {
      this.releaseTarget();
      this.width = width;
      this.height = height;
    }
  }
  releaseTarget(): void {
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.stats.target(-this.width * this.height * 8);
    }
    if (this.framebuffer) this.gl.deleteFramebuffer(this.framebuffer);
    this.texture = undefined;
    this.framebuffer = undefined;
    this.history.invalidate();
  }
  destroy(): void {
    this.releaseTarget();
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }
}
