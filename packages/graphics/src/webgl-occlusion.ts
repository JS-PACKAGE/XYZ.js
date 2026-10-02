import type { Matrix4 } from '../../math/src/index.js';
import type { Mesh } from '../../core/src/mesh.js';
import type {
  OcclusionCandidate,
  OcclusionProofSource,
} from '../../core/src/render-visibility.js';
import { visibilityLimits } from '../../../src/data/visibility.js';
import { GraphicsError } from './errors.js';
import {
  occlusionProxyIndices,
  occlusionProxyVertices,
} from './occlusion-proxy.js';

const vertexSource = `#version 300 es
layout(location=0) in vec3 position;
uniform mat4 viewProjection;
uniform vec3 minimum;
uniform vec3 maximum;
void main() {
  vec4 clip = viewProjection * vec4(mix(minimum, maximum, position), 1.0);
  gl_Position = vec4(clip.xy, clip.z * 2.0 - clip.w, clip.w);
}`;
const fragmentSource = `#version 300 es
precision highp float;
out vec4 color;
void main() { color = vec4(0.0); }`;
interface QuerySlot {
  query: WebGLQuery;
  mesh: Mesh | undefined;
  epoch: number;
  generation: number;
}

/** ANY_SAMPLES_PASSED_CONSERVATIVE over a solid enclosing proxy against real opaque depth. */
export class WebGLOcclusionBackend implements OcclusionProofSource {
  private readonly slots: QuerySlot[] = [];
  private readonly results = new Map<
    Mesh,
    { epoch: number; visible: boolean }
  >();
  private readonly activeMeshes = new Set<Mesh>();
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertex: WebGLBuffer;
  private readonly index: WebGLBuffer;
  private readonly viewProjection: WebGLUniformLocation;
  private readonly minimum: WebGLUniformLocation;
  private readonly maximum: WebGLUniformLocation;
  private readonly matrixData = new Float32Array(16);
  private generation = 0;
  private destroyed = false;

  constructor(private readonly gl: WebGL2RenderingContext) {
    const program = gl.createProgram(),
      vao = gl.createVertexArray(),
      vertex = gl.createBuffer(),
      index = gl.createBuffer();
    if (!program || !vao || !vertex || !index) {
      if (program) gl.deleteProgram(program);
      if (vao) gl.deleteVertexArray(vao);
      if (vertex) gl.deleteBuffer(vertex);
      if (index) gl.deleteBuffer(index);
      throw new GraphicsError('Unable to allocate WebGL occlusion resources.');
    }
    this.program = program;
    this.vao = vao;
    this.vertex = vertex;
    this.index = index;
    const shaders: WebGLShader[] = [];
    try {
      for (const [kind, source] of [
        [gl.VERTEX_SHADER, vertexSource],
        [gl.FRAGMENT_SHADER, fragmentSource],
      ] as const) {
        const shader = gl.createShader(kind);
        if (!shader)
          throw new GraphicsError('Unable to allocate WebGL occlusion shader.');
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new GraphicsError(
            `WebGL occlusion shader failed: ${gl.getShaderInfoLog(shader) ?? 'unknown compiler error'}`,
          );
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new GraphicsError(
          `WebGL occlusion program failed: ${gl.getProgramInfoLog(program) ?? 'unknown linker error'}`,
        );
      const vp = gl.getUniformLocation(program, 'viewProjection');
      const min = gl.getUniformLocation(program, 'minimum'),
        max = gl.getUniformLocation(program, 'maximum');
      if (!vp || !min || !max)
        throw new GraphicsError('WebGL occlusion uniforms are unavailable.');
      this.viewProjection = vp;
      this.minimum = min;
      this.maximum = max;
      const previousVao = gl.getParameter(
        gl.VERTEX_ARRAY_BINDING,
      ) as WebGLVertexArrayObject | null;
      const previousBuffer = gl.getParameter(
        gl.ARRAY_BUFFER_BINDING,
      ) as WebGLBuffer | null;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
      gl.bufferData(gl.ARRAY_BUFFER, occlusionProxyVertices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        occlusionProxyIndices,
        gl.STATIC_DRAW,
      );
      gl.bindVertexArray(previousVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, previousBuffer);
      for (
        let i = 0;
        i <
        visibilityLimits.occlusionQueries *
          visibilityLimits.occlusionFramesInFlight;
        i++
      ) {
        const query = gl.createQuery();
        if (!query)
          throw new GraphicsError('Unable to allocate WebGL occlusion query.');
        this.slots.push({ query, mesh: undefined, epoch: 0, generation: 0 });
      }
    } catch (error) {
      this.destroy();
      throw error;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }

  visible(mesh: Mesh, epoch: number): boolean {
    if (this.destroyed || this.gl.isContextLost()) return true;
    const proof = this.results.get(mesh);
    return !proof || proof.epoch !== epoch || proof.visible;
  }

  /** Poll once before gather; never block on unavailable GPU query results. */
  beginFrame(): void {
    if (!this.destroyed && !this.gl.isContextLost()) this.poll();
  }

  /** Caller keeps the opaque-depth framebuffer/viewport bound; all modified GL state restored. */
  draw(candidates: readonly OcclusionCandidate[], matrix: Matrix4): void {
    const gl = this.gl;
    if (this.destroyed || gl.isContextLost()) return;
    this.poll();
    this.activeMeshes.clear();
    for (const candidate of candidates) this.activeMeshes.add(candidate.mesh);
    for (const mesh of this.results.keys())
      if (!this.activeMeshes.has(mesh) || mesh.destroyed)
        this.results.delete(mesh);
    if (
      !candidates.length ||
      gl.getQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE, gl.CURRENT_QUERY)
    )
      return;
    const oldProgram = gl.getParameter(
      gl.CURRENT_PROGRAM,
    ) as WebGLProgram | null;
    const oldVao = gl.getParameter(
      gl.VERTEX_ARRAY_BINDING,
    ) as WebGLVertexArrayObject | null;
    const oldColor = gl.getParameter(gl.COLOR_WRITEMASK) as boolean[];
    const oldDepthMask = gl.getParameter(gl.DEPTH_WRITEMASK) as boolean;
    const oldDepthFunc = gl.getParameter(gl.DEPTH_FUNC) as number;
    const oldDepth = gl.isEnabled(gl.DEPTH_TEST),
      oldCull = gl.isEnabled(gl.CULL_FACE);
    const oldRasterizerDiscard = gl.isEnabled(gl.RASTERIZER_DISCARD);
    const oldScissor = gl.isEnabled(gl.SCISSOR_TEST),
      oldStencil = gl.isEnabled(gl.STENCIL_TEST);
    const oldOffset = gl.isEnabled(gl.POLYGON_OFFSET_FILL);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.colorMask(false, false, false, false);
    gl.depthMask(false);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    this.matrixData.set(matrix.elements);
    gl.uniformMatrix4fv(this.viewProjection, false, this.matrixData);
    let slotIndex = 0;
    try {
      const count = Math.min(
        candidates.length,
        visibilityLimits.occlusionQueries,
      );
      for (let i = 0; i < count; i++) {
        while (slotIndex < this.slots.length && this.slots[slotIndex]!.mesh)
          slotIndex++;
        const slot = this.slots[slotIndex++];
        if (!slot) break;
        const candidate = candidates[i]!;
        slot.mesh = candidate.mesh;
        slot.epoch = candidate.epoch;
        slot.generation = this.generation;
        gl.uniform3f(
          this.minimum,
          candidate.minX,
          candidate.minY,
          candidate.minZ,
        );
        gl.uniform3f(
          this.maximum,
          candidate.maxX,
          candidate.maxY,
          candidate.maxZ,
        );
        gl.beginQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE, slot.query);
        try {
          gl.drawElements(
            gl.TRIANGLES,
            occlusionProxyIndices.length,
            gl.UNSIGNED_SHORT,
            0,
          );
        } finally {
          gl.endQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE);
        }
      }
    } finally {
      gl.useProgram(oldProgram);
      gl.bindVertexArray(oldVao);
      gl.colorMask(...(oldColor as [boolean, boolean, boolean, boolean]));
      gl.depthMask(oldDepthMask);
      gl.depthFunc(oldDepthFunc);
      if (oldDepth) gl.enable(gl.DEPTH_TEST);
      else gl.disable(gl.DEPTH_TEST);
      if (oldCull) gl.enable(gl.CULL_FACE);
      else gl.disable(gl.CULL_FACE);
      if (oldRasterizerDiscard) gl.enable(gl.RASTERIZER_DISCARD);
      else gl.disable(gl.RASTERIZER_DISCARD);
      if (oldScissor) gl.enable(gl.SCISSOR_TEST);
      else gl.disable(gl.SCISSOR_TEST);
      if (oldStencil) gl.enable(gl.STENCIL_TEST);
      else gl.disable(gl.STENCIL_TEST);
      if (oldOffset) gl.enable(gl.POLYGON_OFFSET_FILL);
      else gl.disable(gl.POLYGON_OFFSET_FILL);
    }
  }

  private poll(): void {
    const gl = this.gl;
    for (const slot of this.slots) {
      const mesh = slot.mesh;
      if (!mesh || !gl.getQueryParameter(slot.query, gl.QUERY_RESULT_AVAILABLE))
        continue;
      const visible = Boolean(
        gl.getQueryParameter(slot.query, gl.QUERY_RESULT),
      );
      if (!mesh.destroyed && slot.generation === this.generation) {
        const previous = this.results.get(mesh);
        if (!previous) this.results.set(mesh, { epoch: slot.epoch, visible });
        else if (previous.epoch <= slot.epoch) {
          previous.epoch = slot.epoch;
          previous.visible = visible;
        }
      }
      slot.mesh = undefined;
    }
  }

  clear(): void {
    ++this.generation;
    this.results.clear();
    this.activeMeshes.clear();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clear();
    for (const slot of this.slots) {
      this.gl.deleteQuery(slot.query);
      slot.mesh = undefined;
    }
    this.slots.length = 0;
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.vertex);
    this.gl.deleteBuffer(this.index);
  }
}
