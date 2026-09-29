import type { Scene } from '../../core/src/scene.js';
import { Mesh } from '../../core/src/mesh.js';
import { Sprite } from '../../core/src/sprite.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { Texture } from '../../assets/src/index.js';
import { defaults } from '../../../src/data/defaults.js';
import {
  GraphicsError,
  WebGL2ContextLostError,
  WebGL2InitializationError,
} from './errors.js';
import type { GraphicsCapabilities, Renderer } from './index.js';

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

const spriteVertex = `#version 300 es
precision highp float;
layout(location=0) in vec4 axes;
layout(location=1) in vec4 offsetSize;
layout(location=2) in vec4 anchorOpacity;
uniform vec2 viewportSize;
out vec2 vUV;
out float vOpacity;
void main() {
  vec2 corners[6] = vec2[6](vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
    vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0));
  vec2 corner = corners[gl_VertexID];
  vec2 local = (corner - anchorOpacity.xy) * offsetSize.zw;
  vec2 world = offsetSize.xy + axes.xy * local.x + axes.zw * local.y;
  gl_Position = vec4(world.x * 2.0 / viewportSize.x - 1.0,
    1.0 - world.y * 2.0 / viewportSize.y, 0.0, 1.0);
  // ImageBitmap uploads ignore UNPACK_FLIP_Y_WEBGL: its first (top) row is at GL v=0.
  vUV = corner;
  vOpacity = anchorOpacity.z;
}`;
const spriteFragment = `#version 300 es
precision highp float;
in vec2 vUV;
in float vOpacity;
uniform sampler2D image;
out vec4 color;
void main() {
  vec4 texel = texture(image, vUV);
  // Texture.fromImage creates straight-alpha ImageBitmaps; their WebGL upload ignores
  // UNPACK_PREMULTIPLY_ALPHA_WEBGL. Blend in premultiplied space like WebGPU.
  color = vec4(texel.rgb * texel.a * vOpacity, texel.a * vOpacity);
}`;

const meshVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;
uniform mat4 viewProjection;
uniform mat4 model;
uniform mat4 normalMatrix;
out vec3 vNormal;
out vec2 vUV;
void main() {
  // Camera3D produces WebGPU depth 0..1; map it to OpenGL clip depth -1..1.
  vec4 clip = viewProjection * model * vec4(position, 1.0);
  gl_Position = vec4(clip.xy, clip.z * 2.0 - clip.w, clip.w);
  vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;
  vUV = uv;
}`;
const meshFragment = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUV;
uniform sampler2D image;
uniform vec4 lightDirection;
uniform vec4 lightColorAmbient;
uniform vec4 tint;
out vec4 color;
void main() {
  vec4 texel = texture(image, vUV);
  float light = max(dot(vNormal, lightDirection.xyz), 0.0) /
    max(length(vNormal) * length(lightDirection.xyz), 0.000001);
  vec3 illumination = vec3(max(lightColorAmbient.w, 0.0)) +
    lightColorAmbient.rgb * (light * max(lightDirection.w, 0.0));
  color = vec4(texel.rgb * texel.a * tint.rgb * illumination * tint.a,
    texel.a * tint.a);
}`;

interface CachedTexture {
  resource: WebGLTexture;
  seen: number;
}
interface CachedGeometry {
  vao: WebGLVertexArrayObject;
  vertex: WebGLBuffer;
  index: WebGLBuffer;
  seen: number;
}

/** A WebGL2 renderer with renderer-owned, frame-lifetime-cached GPU resources. */
export class WebGL2Renderer implements Renderer {
  readonly backend = 'webgl2' as const;
  private canvas: HTMLCanvasElement | undefined;
  private gl: WebGL2RenderingContext | undefined;
  private triangleProgram: WebGLProgram | undefined;
  private spriteProgram: WebGLProgram | undefined;
  private meshProgram: WebGLProgram | undefined;
  private triangleVAO: WebGLVertexArrayObject | undefined;
  private spriteVAO: WebGLVertexArrayObject | undefined;
  private instanceBuffer: WebGLBuffer | undefined;
  private instanceCapacity = 0;
  private instances = new Float32Array(0);
  private readonly sprites: Sprite[] = [];
  private readonly textures = new Map<Texture, CachedTexture>();
  private readonly geometries = new Map<Geometry, CachedGeometry>();
  private readonly normalData = new Float32Array(16);
  private readonly lightDirectionData = new Float32Array(4);
  private readonly lightColorData = new Float32Array(4);
  private readonly tintData = new Float32Array(4);
  private frame = 0;
  private activeFrame = false;
  private frameRendered = false;
  private destroyed = false;
  private lostError: WebGL2ContextLostError | undefined;
  private maxTextureSize = 0;
  private maxWidth = 0;
  private maxHeight = 0;
  private viewportX = 0;
  private viewportY = 0;
  private viewportSide = 1;
  private spriteViewport: WebGLUniformLocation | null = null;
  private meshViewProjection: WebGLUniformLocation | null = null;
  private meshModel: WebGLUniformLocation | null = null;
  private meshNormal: WebGLUniformLocation | null = null;
  private meshLightDirection: WebGLUniformLocation | null = null;
  private meshLightColor: WebGLUniformLocation | null = null;
  private meshTint: WebGLUniformLocation | null = null;

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
    this.onError(this.lostError);
  };

  constructor(private readonly onError: (error: Error) => void) {}

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.gl)
      throw new GraphicsError(
        'WebGL2 renderer cannot be initialized more than once.',
      );
    try {
      const gl = canvas.getContext('webgl2', { alpha: false });
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
      this.resize(Math.max(canvas.width, 1), Math.max(canvas.height, 1));
      this.triangleProgram = this.createProgram(
        gl,
        triangleVertex,
        triangleFragment,
        'triangle',
      );
      this.spriteProgram = this.createProgram(
        gl,
        spriteVertex,
        spriteFragment,
        'sprite',
      );
      this.meshProgram = this.createProgram(
        gl,
        meshVertex,
        meshFragment,
        'mesh',
      );
      this.triangleVAO = this.createVAO(gl);
      this.spriteVAO = this.createVAO(gl);
      this.instanceBuffer = this.createBuffer(gl);
      this.spriteViewport = gl.getUniformLocation(
        this.spriteProgram,
        'viewportSize',
      );
      this.meshViewProjection = gl.getUniformLocation(
        this.meshProgram,
        'viewProjection',
      );
      this.meshModel = gl.getUniformLocation(this.meshProgram, 'model');
      this.meshNormal = gl.getUniformLocation(this.meshProgram, 'normalMatrix');
      this.meshLightDirection = gl.getUniformLocation(
        this.meshProgram,
        'lightDirection',
      );
      this.meshLightColor = gl.getUniformLocation(
        this.meshProgram,
        'lightColorAmbient',
      );
      this.meshTint = gl.getUniformLocation(this.meshProgram, 'tint');
      gl.useProgram(this.spriteProgram);
      gl.uniform1i(gl.getUniformLocation(this.spriteProgram, 'image'), 0);
      gl.useProgram(this.meshProgram);
      gl.uniform1i(gl.getUniformLocation(this.meshProgram, 'image'), 0);
      gl.useProgram(null);
      gl.bindVertexArray(this.spriteVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      for (let attribute = 0; attribute < 3; attribute++) {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(
          attribute,
          4,
          gl.FLOAT,
          false,
          48,
          attribute * 16,
        );
        gl.vertexAttribDivisor(attribute, 1);
      }
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    } catch (error) {
      this.destroy();
      if (error instanceof GraphicsError) throw error;
      throw new WebGL2InitializationError(
        `WebGL2 initialization failed${error instanceof Error ? `: ${error.message}` : '.'}`,
        { cause: error },
      );
    }
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

  render(scene?: Scene, width?: number, height?: number): void {
    const gl = this.requireGL();
    const canvas = this.canvas!;
    if (!this.activeFrame || this.frameRendered)
      throw new GraphicsError(
        'WebGL2 render requires an active frame and may be called only once per frame.',
      );
    let aspect = 1;
    let logicalWidth = 1;
    let logicalHeight = 1;
    if (scene) {
      logicalWidth = width ?? (canvas.clientWidth || canvas.width);
      logicalHeight = height ?? (canvas.clientHeight || canvas.height);
      if (
        !Number.isFinite(logicalWidth) ||
        !Number.isFinite(logicalHeight) ||
        logicalWidth <= 0 ||
        logicalHeight <= 0
      )
        throw new RangeError(
          'WebGL2 rendering requires positive finite logical width and height.',
        );
      aspect = logicalWidth / logicalHeight;
    }
    this.frame++;
    try {
      if (scene) this.prepareSprites(scene);
      else this.sprites.length = 0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(
        defaults.clearColor.r,
        defaults.clearColor.g,
        defaults.clearColor.b,
        defaults.clearColor.a,
      );
      gl.depthMask(true);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (scene) {
        this.drawMeshes(scene, aspect);
        gl.disable(gl.DEPTH_TEST);
        if (this.sprites.length) this.drawSprites(logicalWidth, logicalHeight);
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
      this.frameRendered = true;
    } finally {
      this.releaseUnused();
      gl.bindVertexArray(null);
      gl.bindTexture(gl.TEXTURE_2D, null);
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
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const side = Math.min(pixelWidth, pixelHeight);
    this.viewportX = (pixelWidth - side) / 2;
    this.viewportY = (pixelHeight - side) / 2;
    this.viewportSide = side;
  }

  private prepareSprites(scene: Scene): void {
    const sprites = this.sprites;
    sprites.length = 0;
    for (const object of scene.objects)
      if (
        object instanceof Sprite &&
        object.visible &&
        object.opacity > 0 &&
        !object.texture.destroyed
      )
        sprites.push(object);
    sprites.sort((a, b) => a.zIndex - b.zIndex);
    const count = sprites.length;
    if (!count) return;
    const gl = this.gl!;
    if (count > this.instanceCapacity) {
      let capacity = Math.max(16, this.instanceCapacity);
      while (capacity < count) capacity *= 2;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer!);
      gl.bufferData(gl.ARRAY_BUFFER, capacity * 48, gl.DYNAMIC_DRAW);
      this.instances = new Float32Array(capacity * 12);
      this.instanceCapacity = capacity;
    }
    const camera = scene.camera2D;
    const zoom = camera.zoom;
    const data = this.instances;
    for (let i = 0; i < count; i++) {
      const sprite = sprites[i];
      const texture = sprite.texture;
      this.cacheTexture(texture).seen = this.frame;
      const matrix = sprite.transform.updateMatrix().elements;
      const offset = i * 12;
      data[offset] = matrix[0] * zoom;
      data[offset + 1] = matrix[1] * zoom;
      data[offset + 2] = matrix[3] * zoom;
      data[offset + 3] = matrix[4] * zoom;
      data[offset + 4] = (matrix[6] - camera.position.x) * zoom;
      data[offset + 5] = (matrix[7] - camera.position.y) * zoom;
      data[offset + 6] = texture.width;
      data[offset + 7] = texture.height;
      data[offset + 8] = sprite.anchor.x;
      data[offset + 9] = sprite.anchor.y;
      data[offset + 10] = sprite.opacity;
      data[offset + 11] = 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer!);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * 12);
  }

  private drawSprites(width: number, height: number): void {
    const gl = this.gl!;
    gl.useProgram(this.spriteProgram!);
    gl.uniform2f(this.spriteViewport, width, height);
    gl.bindVertexArray(this.spriteVAO!);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer!);
    const sprites = this.sprites;
    for (let first = 0; first < sprites.length;) {
      const texture = sprites[first].texture;
      let end = first + 1;
      while (end < sprites.length && sprites[end].texture === texture) end++;
      for (let attribute = 0; attribute < 3; attribute++)
        gl.vertexAttribPointer(
          attribute,
          4,
          gl.FLOAT,
          false,
          48,
          first * 48 + attribute * 16,
        );
      gl.bindTexture(gl.TEXTURE_2D, this.textures.get(texture)!.resource);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, end - first);
      first = end;
    }
  }

  private drawMeshes(scene: Scene, aspect: number): void {
    const gl = this.gl!;
    let prepared = false;
    for (const object of scene.objects) {
      if (
        !(object instanceof Mesh) ||
        !object.visible ||
        object.material.opacity <= 0 ||
        object.material.texture.destroyed ||
        object.geometry.indices.length === 0
      )
        continue;
      if (!prepared) {
        const projection = scene.camera3D.updateMatrix(aspect).elements;
        const light = scene.directionalLight;
        const direction = this.lightDirectionData;
        direction[0] = light.direction.x;
        direction[1] = light.direction.y;
        direction[2] = light.direction.z;
        direction[3] = light.intensity;
        const color = this.lightColorData;
        color[0] = light.color[0];
        color[1] = light.color[1];
        color[2] = light.color[2];
        color[3] = scene.ambientLight;
        gl.useProgram(this.meshProgram!);
        gl.uniformMatrix4fv(this.meshViewProjection, false, projection);
        gl.uniform4fv(this.meshLightDirection, direction);
        gl.uniform4fv(this.meshLightColor, color);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.depthMask(true);
        prepared = true;
      }
      const geometry = this.cacheGeometry(object.geometry);
      const texture = this.cacheTexture(object.material.texture);
      geometry.seen = texture.seen = this.frame;
      const model = object.transform.updateMatrix().elements;
      const normal = this.normalData;
      // Columns of inverse-transpose(model3x3), matching the WebGPU mesh pipeline.
      const a0 = model[0],
        a1 = model[1],
        a2 = model[2];
      const b0 = model[4],
        b1 = model[5],
        b2 = model[6];
      const c0 = model[8],
        c1 = model[9],
        c2 = model[10];
      const n0 = b1 * c2 - b2 * c1;
      const n1 = b2 * c0 - b0 * c2;
      const n2 = b0 * c1 - b1 * c0;
      const det = a0 * n0 + a1 * n1 + a2 * n2;
      const inverseDet = det !== 0 ? 1 / det : 0;
      normal[0] = n0 * inverseDet;
      normal[1] = n1 * inverseDet;
      normal[2] = n2 * inverseDet;
      normal[3] = 0;
      normal[4] = (c1 * a2 - c2 * a1) * inverseDet;
      normal[5] = (c2 * a0 - c0 * a2) * inverseDet;
      normal[6] = (c0 * a1 - c1 * a0) * inverseDet;
      normal[7] = 0;
      normal[8] = (a1 * b2 - a2 * b1) * inverseDet;
      normal[9] = (a2 * b0 - a0 * b2) * inverseDet;
      normal[10] = (a0 * b1 - a1 * b0) * inverseDet;
      normal[11] = 0;
      normal[12] = normal[13] = normal[14] = 0;
      normal[15] = 1;
      const tint = this.tintData;
      tint[0] = object.material.color[0];
      tint[1] = object.material.color[1];
      tint[2] = object.material.color[2];
      tint[3] = object.material.opacity;
      gl.uniformMatrix4fv(this.meshModel, false, model);
      gl.uniformMatrix4fv(this.meshNormal, false, normal);
      gl.uniform4fv(this.meshTint, tint);
      gl.bindTexture(gl.TEXTURE_2D, texture.resource);
      gl.bindVertexArray(geometry.vao);
      gl.drawElements(
        gl.TRIANGLES,
        object.geometry.indices.length,
        gl.UNSIGNED_INT,
        0,
      );
    }
  }

  private cacheTexture(texture: Texture): CachedTexture {
    const existing = this.textures.get(texture);
    if (existing) return existing;
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
        `WebGL2 texture size ${width}×${height} exceeds this device's maximum texture dimension of ${this.maxTextureSize} pixels per side.`,
      );
    const resource = gl.createTexture();
    if (!resource)
      throw new GraphicsError('WebGL2 could not allocate a texture.');
    try {
      gl.bindTexture(gl.TEXTURE_2D, resource);
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
      const entry = { resource, seen: this.frame };
      this.textures.set(texture, entry);
      return entry;
    } catch (error) {
      gl.deleteTexture(resource);
      throw error;
    }
  }

  private cacheGeometry(geometry: Geometry): CachedGeometry {
    const existing = this.geometries.get(geometry);
    if (existing) return existing;
    const gl = this.gl!;
    const vao = this.createVAO(gl);
    let vertex: WebGLBuffer | undefined;
    let index: WebGLBuffer | undefined;
    try {
      vertex = this.createBuffer(gl);
      index = this.createBuffer(gl);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
      gl.bindVertexArray(null);
      const entry = { vao, vertex, index, seen: this.frame };
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
      if (texture.destroyed || entry.seen !== this.frame) {
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
      for (const entry of this.textures.values())
        gl.deleteTexture(entry.resource);
      for (const entry of this.geometries.values()) {
        gl.deleteVertexArray(entry.vao);
        gl.deleteBuffer(entry.vertex);
        gl.deleteBuffer(entry.index);
      }
      if (this.instanceBuffer) gl.deleteBuffer(this.instanceBuffer);
      if (this.triangleVAO) gl.deleteVertexArray(this.triangleVAO);
      if (this.spriteVAO) gl.deleteVertexArray(this.spriteVAO);
      if (this.triangleProgram) gl.deleteProgram(this.triangleProgram);
      if (this.spriteProgram) gl.deleteProgram(this.spriteProgram);
      if (this.meshProgram) gl.deleteProgram(this.meshProgram);
    }
    this.textures.clear();
    this.geometries.clear();
    this.sprites.length = 0;
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
