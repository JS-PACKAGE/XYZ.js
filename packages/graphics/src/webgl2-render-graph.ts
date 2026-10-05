import {
  RenderGraph,
  type RenderGraphPass,
  type RenderGraphPreparationOptions,
} from './render-graph.js';
import { graphGLSL, graphIdentityGLSL } from './render-graph-shaders.js';
import { GraphicsError, WebGL2ContextLostError } from './errors.js';

export interface GLGraphTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  depth?: WebGLRenderbuffer;
  width: number;
  height: number;
}
interface Pass {
  program: WebGLProgram;
  images: (WebGLUniformLocation | null)[];
  uniforms: WebGLUniformLocation | null;
  viewport: WebGLUniformLocation | null;
  inputs: GLGraphTarget[];
}
interface Owner {
  passes: Map<RenderGraphPass, Pass>;
  targets: Map<string, GLGraphTarget>;
  release: () => void;
  width: number;
  height: number;
  maxInputs: number;
}
/** Engine-only native graph resources. The public descriptor exposes no GL handles. */
export class WebGL2RenderGraph {
  private readonly owners = new Map<RenderGraph, Owner>();
  private scene: GLGraphTarget | undefined;
  private blit: Pass | undefined;
  private disposed = false;
  private readonly vao: WebGLVertexArrayObject;
  private readonly sampler: WebGLSampler;
  constructor(private readonly gl: WebGL2RenderingContext) {
    const vao = gl.createVertexArray(),
      sampler = gl.createSampler();
    if (!vao || !sampler) {
      if (vao) gl.deleteVertexArray(vao);
      if (sampler) gl.deleteSampler(sampler);
      throw new GraphicsError('Cannot allocate graph fullscreen state.');
    }
    this.vao = vao;
    this.sampler = sampler;
    gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  private live(): void {
    if (this.disposed) throw new GraphicsError('Render graph owner destroyed.');
    if (this.gl.isContextLost())
      throw new WebGL2ContextLostError('Render graph context lost.');
  }
  async prepare(
    graph: RenderGraph,
    options: RenderGraphPreparationOptions = {},
  ): Promise<void> {
    this.live();
    graph.validate();
    options.signal?.throwIfAborted();
    if (this.owners.has(graph)) return;
    const gl = this.gl;
    if (
      graph.targets.some((target) => target.format === 'rgba16float') &&
      !gl.getExtension('EXT_color_buffer_float')
    )
      throw new GraphicsError(
        'rgba16float graph targets require EXT_color_buffer_float.',
      );
    if (
      graph.passes.some(
        (pass) =>
          pass.inputs.length > gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      )
    )
      throw new RangeError('Graph inputs exceed fragment texture units.');
    const passes = new Map<RenderGraphPass, Pass>(),
      targets = new Map<string, GLGraphTarget>();
    const release = (): void => {
      graph.removeEventListener('destroy', release);
      for (const pass of graph.passes)
        pass.effect.removeEventListener('destroy', release);
      for (const pass of passes.values()) gl.deleteProgram(pass.program);
      passes.clear();
      for (const target of targets.values()) this.releaseTarget(target);
      targets.clear();
      this.owners.delete(graph);
    };
    try {
      for (const descriptor of graph.schedule)
        passes.set(
          descriptor,
          this.compile(descriptor.effect.glsl, descriptor.inputs.length),
        );
      if (!this.blit) this.blit = this.compile(graphIdentityGLSL, 1);
      options.signal?.throwIfAborted();
      this.live();
      graph.validate();
      this.owners.set(graph, {
        passes,
        targets,
        release,
        width: 0,
        height: 0,
        maxInputs: Math.max(...graph.passes.map((pass) => pass.inputs.length)),
      });
      graph.addEventListener('destroy', release, { once: true });
      for (const pass of graph.passes)
        pass.effect.addEventListener('destroy', release, { once: true });
    } catch (error) {
      release();
      throw error;
    }
  }
  private compile(source: string, inputCount: number): Pass {
    const gl = this.gl,
      sources = graphGLSL(source, inputCount);
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    try {
      for (const [type, code] of [
        [gl.VERTEX_SHADER, sources.vertex],
        [gl.FRAGMENT_SHADER, sources.fragment],
      ] as const) {
        const shader = gl.createShader(type);
        if (!shader) throw new GraphicsError('Cannot allocate graph shader.');
        shaders.push(shader);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new GraphicsError(
            `Render graph compilation failed: ${gl.getShaderInfoLog(shader)}`,
          );
      }
      program = gl.createProgram();
      if (!program) throw new GraphicsError('Cannot allocate graph program.');
      for (const shader of shaders) gl.attachShader(program, shader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new GraphicsError(
          `Render graph link failed: ${gl.getProgramInfoLog(program)}`,
        );
      return {
        program,
        images: Array.from({ length: inputCount }, (_, index) =>
          gl.getUniformLocation(
            program!,
            index === 0 ? 'image' : `image${index}`,
          ),
        ),
        uniforms: gl.getUniformLocation(program, 'uniforms[0]'),
        viewport: gl.getUniformLocation(program, 'viewportSize'),
        inputs: [],
      };
    } catch (error) {
      if (program) gl.deleteProgram(program);
      throw error;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }
  private target(
    width: number,
    height: number,
    halfFloat: boolean,
    needsDepth = false,
  ): GLGraphTarget {
    const gl = this.gl,
      texture = gl.createTexture(),
      framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) {
      if (texture) gl.deleteTexture(texture);
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      throw new GraphicsError('Cannot allocate graph target.');
    }
    const previousTexture = gl.getParameter(
        gl.TEXTURE_BINDING_2D,
      ) as WebGLTexture | null,
      previousFramebuffer = gl.getParameter(
        gl.DRAW_FRAMEBUFFER_BINDING,
      ) as WebGLFramebuffer | null,
      previousRenderbuffer = gl.getParameter(
        gl.RENDERBUFFER_BINDING,
      ) as WebGLRenderbuffer | null;
    let depth: WebGLRenderbuffer | undefined;
    try {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(
        gl.TEXTURE_2D,
        1,
        halfFloat ? gl.RGBA16F : gl.RGBA8,
        width,
        height,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
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
      if (needsDepth) {
        const buffer = gl.createRenderbuffer();
        if (!buffer)
          throw new GraphicsError('Cannot allocate graph scene depth.');
        depth = buffer;
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(
          gl.RENDERBUFFER,
          gl.DEPTH_COMPONENT24,
          width,
          height,
        );
        gl.framebufferRenderbuffer(
          gl.DRAW_FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER,
          depth,
        );
      }
      if (
        gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER) !==
        gl.FRAMEBUFFER_COMPLETE
      )
        throw new GraphicsError('Render graph framebuffer is incomplete.');
      return { texture, framebuffer, depth, width, height };
    } catch (error) {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      if (depth) gl.deleteRenderbuffer(depth);
      throw error;
    } finally {
      gl.bindTexture(gl.TEXTURE_2D, previousTexture);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, previousFramebuffer);
      gl.bindRenderbuffer(gl.RENDERBUFFER, previousRenderbuffer);
    }
  }
  private releaseTarget(target: GLGraphTarget): void {
    this.gl.deleteTexture(target.texture);
    this.gl.deleteFramebuffer(target.framebuffer);
    if (target.depth) this.gl.deleteRenderbuffer(target.depth);
  }
  /** Normal backend 3D, world-2D and HUD composite into this target before graph evaluation. */
  sceneTarget(
    graph: RenderGraph,
    width: number,
    height: number,
  ): GLGraphTarget {
    this.live();
    graph.validate();
    const owner = this.owners.get(graph);
    if (!owner || !this.blit)
      throw new GraphicsError(
        'Render graph must be prepared before rendering.',
      );
    if (
      owner.width === width &&
      owner.height === height &&
      this.scene?.width === width &&
      this.scene.height === height
    )
      return this.scene;
    const resolutions = graph.resolutions(
      width,
      height,
      this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
    );
    const replacements = new Map<string, GLGraphTarget>();
    let scene: GLGraphTarget | undefined;
    try {
      if (
        !this.scene ||
        this.scene.width !== width ||
        this.scene.height !== height
      )
        scene = this.target(width, height, false, true);
      for (const resolution of resolutions) {
        const previous = owner.targets.get(resolution.target.name);
        if (
          !previous ||
          previous.width !== resolution.width ||
          previous.height !== resolution.height
        )
          replacements.set(
            resolution.target.name,
            this.target(
              resolution.width,
              resolution.height,
              resolution.target.format === 'rgba16float',
            ),
          );
      }
    } catch (error) {
      if (scene) this.releaseTarget(scene);
      for (const target of replacements.values()) this.releaseTarget(target);
      throw error;
    }
    if (scene) {
      if (this.scene) this.releaseTarget(this.scene);
      this.scene = scene;
    }
    for (const [name, target] of replacements) {
      const previous = owner.targets.get(name);
      if (previous) this.releaseTarget(previous);
      owner.targets.set(name, target);
    }
    owner.width = width;
    owner.height = height;
    return this.scene!;
  }
  /** Native fullscreen passes and presentation; restores backend GL state, including sampling bindings. */
  encode(graph: RenderGraph, destination: WebGLFramebuffer | null): void {
    this.live();
    graph.validate();
    const owner = this.owners.get(graph);
    if (
      !owner ||
      !this.scene ||
      !this.blit ||
      owner.targets.size !== graph.targets.length
    )
      throw new GraphicsError('Graph resources are not prepared/resolved.');
    const gl = this.gl;
    const previous = {
      framebuffer: gl.getParameter(
        gl.DRAW_FRAMEBUFFER_BINDING,
      ) as WebGLFramebuffer | null,
      program: gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null,
      vao: gl.getParameter(
        gl.VERTEX_ARRAY_BINDING,
      ) as WebGLVertexArrayObject | null,
      viewport: gl.getParameter(gl.VIEWPORT) as Int32Array,
      active: gl.getParameter(gl.ACTIVE_TEXTURE) as number,
      blend: gl.isEnabled(gl.BLEND),
      depth: gl.isEnabled(gl.DEPTH_TEST),
      cull: gl.isEnabled(gl.CULL_FACE),
      scissor: gl.isEnabled(gl.SCISSOR_TEST),
      colorMask: gl.getParameter(gl.COLOR_WRITEMASK) as boolean[],
    };
    const maxInputs = owner.maxInputs;
    const textures: (WebGLTexture | null)[] = [],
      samplers: (WebGLSampler | null)[] = [];
    for (let index = 0; index < maxInputs; index++) {
      gl.activeTexture(gl.TEXTURE0 + index);
      textures.push(
        gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null,
      );
      samplers.push(gl.getParameter(gl.SAMPLER_BINDING) as WebGLSampler | null);
    }
    try {
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.SCISSOR_TEST);
      gl.colorMask(true, true, true, true);
      gl.bindVertexArray(this.vao);
      for (const descriptor of graph.schedule) {
        const target = owner.targets.get(descriptor.output)!,
          pass = owner.passes.get(descriptor)!;
        for (let index = 0; index < descriptor.inputs.length; index++)
          pass.inputs[index] =
            descriptor.inputs[index] === '$scene'
              ? this.scene!
              : owner.targets.get(descriptor.inputs[index])!;
        this.draw(
          pass,
          target.framebuffer,
          target.width,
          target.height,
          descriptor.effect.uniforms,
        );
      }
      this.blit.inputs[0] = owner.targets.get(graph.output)!;
      this.draw(this.blit, destination, this.scene.width, this.scene.height);
    } finally {
      for (let index = 0; index < maxInputs; index++) {
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, textures[index]);
        gl.bindSampler(index, samplers[index]);
      }
      gl.activeTexture(previous.active);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, previous.framebuffer);
      gl.useProgram(previous.program);
      gl.bindVertexArray(previous.vao);
      gl.viewport(
        ...(previous.viewport as unknown as [number, number, number, number]),
      );
      for (const [capability, enabled] of [
        [gl.BLEND, previous.blend],
        [gl.DEPTH_TEST, previous.depth],
        [gl.CULL_FACE, previous.cull],
        [gl.SCISSOR_TEST, previous.scissor],
      ] as const) {
        if (enabled) gl.enable(capability);
        else gl.disable(capability);
      }
      gl.colorMask(
        ...(previous.colorMask as [boolean, boolean, boolean, boolean]),
      );
    }
  }
  private draw(
    pass: Pass,
    destination: WebGLFramebuffer | null,
    width: number,
    height: number,
    uniforms?: Float32Array,
  ): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destination);
    gl.viewport(0, 0, width, height);
    gl.useProgram(pass.program);
    for (let index = 0; index < pass.inputs.length; index++) {
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, pass.inputs[index].texture);
      gl.bindSampler(index, this.sampler);
      gl.uniform1i(pass.images[index], index);
    }
    if (uniforms) gl.uniform4fv(pass.uniforms, uniforms);
    gl.uniform2f(pass.viewport, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const owner of this.owners.values()) owner.release();
    if (this.scene) {
      this.releaseTarget(this.scene);
      this.scene = undefined;
    }
    if (this.blit) {
      this.gl.deleteProgram(this.blit.program);
      this.blit = undefined;
    }
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteSampler(this.sampler);
  }
}
