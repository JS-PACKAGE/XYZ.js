import { defaults } from '../../../src/data/defaults.js';
import {
  GraphicsError,
  WebGPUInitializationError,
  WebGPUDeviceLostError,
  WebGPUNotSupportedError,
} from './errors.js';
import type { Renderer } from './index.js';

const triangleShader = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
};

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(0.0, 0.7),
    vec2f(-0.7, -0.6),
    vec2f(0.7, -0.6),
  );
  var colors = array<vec3f, 3>(
    vec3f(1.0, 0.3, 0.25),
    vec3f(0.25, 0.9, 0.5),
    vec3f(0.3, 0.5, 1.0),
  );
  var output: VertexOutput;
  output.position = vec4f(positions[index], 0.0, 1.0);
  output.color = colors[index];
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}
`;

export class WebGPURenderer implements Renderer {
  readonly backend = 'webgpu' as const;
  private canvas: HTMLCanvasElement | undefined;
  private context: GPUCanvasContext | undefined;
  private device: GPUDevice | undefined;
  private pipeline: GPURenderPipeline | undefined;
  private encoder: GPUCommandEncoder | undefined;
  private readonly colorAttachment: Omit<
    GPURenderPassColorAttachment,
    'view'
  > & { view?: GPUTextureView } = {
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: defaults.clearColor,
  };
  private readonly renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [this.colorAttachment as GPURenderPassColorAttachment],
  };
  private readonly submissions: GPUCommandBuffer[] = [];
  private viewportX = 0;
  private viewportY = 0;
  private viewportSide = 1;
  private frameRendered = false;
  private configured = false;
  private initializing = false;
  private destroyed = false;
  private lostError: WebGPUDeviceLostError | undefined;

  constructor(private readonly onError: (error: Error) => void) {}

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.device || this.initializing) {
      throw new GraphicsError(
        'WebGPU renderer cannot be initialized more than once.',
      );
    }
    this.initializing = true;

    try {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: this browser or security context does not expose navigator.gpu.',
        );
      }
      const adapter = await navigator.gpu.requestAdapter();
      if (this.destroyed)
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      if (!adapter) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: the browser could not provide a GPU adapter.',
        );
      }
      const device = await adapter.requestDevice();
      if (this.destroyed) {
        device.destroy();
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      }
      this.device = device;
      // Install this before any asynchronous shader validation, so initialization-time loss is detected.
      void device.lost.then((info) => {
        if (this.destroyed) return;
        const error = new WebGPUDeviceLostError(
          `WebGPU device lost (${info.reason}): ${info.message || 'the GPU or driver became unavailable'}.`,
        );
        this.lostError = error;
        if (this.pipeline) this.onError(error);
      });
      device.addEventListener(
        'uncapturederror',
        (event: GPUUncapturedErrorEvent) => {
          if (!this.destroyed)
            this.onError(
              new GraphicsError(
                `WebGPU uncaptured error: ${event.error.message}`,
                { cause: event.error },
              ),
            );
        },
      );

      const context = canvas.getContext('webgpu');
      if (!context) {
        throw new WebGPUInitializationError(
          'WebGPU canvas context is unavailable: canvas.getContext("webgpu") returned null.',
        );
      }
      this.context = context;
      this.canvas = canvas;
      this.resize(Math.max(canvas.width, 1), Math.max(canvas.height, 1));
      const format = navigator.gpu.getPreferredCanvasFormat();

      device.pushErrorScope('validation');
      let shaderErrors: string[] = [];
      let pipeline: GPURenderPipeline | undefined;
      let validationError: GPUError | null = null;
      try {
        context.configure({ device, format, alphaMode: 'opaque' });
        this.configured = true;
        const shader = device.createShaderModule({ code: triangleShader });
        const compilation = await shader.getCompilationInfo();
        if (this.destroyed)
          throw new GraphicsError(
            'WebGPU renderer was destroyed during initialization.',
          );
        shaderErrors = compilation.messages
          .filter((message) => message.type === 'error')
          .map(
            (message) =>
              `${message.lineNum}:${message.linePos} ${message.message}`,
          );
        if (shaderErrors.length === 0) {
          pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: shader, entryPoint: 'vertexMain' },
            fragment: {
              module: shader,
              entryPoint: 'fragmentMain',
              targets: [{ format }],
            },
            primitive: { topology: 'triangle-list' },
          });
        }
      } finally {
        validationError = await device.popErrorScope();
      }
      if (this.destroyed)
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
        );
      if (shaderErrors.length) {
        throw new WebGPUInitializationError(
          `WebGPU triangle shader compilation failed: ${shaderErrors.join('; ')}`,
        );
      }
      if (validationError) {
        throw new WebGPUInitializationError(
          `WebGPU canvas/shader/pipeline validation failed: ${validationError.message}`,
          { cause: validationError },
        );
      }
      if (this.lostError) throw this.lostError;
      this.pipeline = pipeline;
    } catch (error) {
      const destroyed = this.destroyed;
      this.destroy();
      if (destroyed && !(error instanceof GraphicsError))
        throw new GraphicsError(
          'WebGPU renderer was destroyed during initialization.',
          { cause: error },
        );
      if (error instanceof GraphicsError) throw error;
      throw new WebGPUInitializationError(
        `WebGPU initialization failed while requesting a device or configuring the canvas and triangle pipeline${error instanceof Error ? `: ${error.message}` : '.'}`,
        { cause: error },
      );
    } finally {
      this.initializing = false;
    }
  }

  beginFrame(): void {
    const device = this.requireDevice();
    if (this.encoder)
      throw new GraphicsError(
        'WebGPU beginFrame called before the preceding frame ended.',
      );
    this.encoder = device.createCommandEncoder();
    this.frameRendered = false;
  }

  render(): void {
    this.requireDevice();
    const encoder = this.encoder;
    const context = this.context;
    const pipeline = this.pipeline;
    if (!encoder || !context || !pipeline || this.frameRendered) {
      throw new GraphicsError(
        'WebGPU render requires an active frame and may be called only once per frame.',
      );
    }
    this.colorAttachment.view = context.getCurrentTexture().createView();
    try {
      const pass = encoder.beginRenderPass(this.renderPassDescriptor);
      // The canvas backing size changes through resize(), not per frame.
      pass.setViewport(
        this.viewportX,
        this.viewportY,
        this.viewportSide,
        this.viewportSide,
        0,
        1,
      );
      pass.setPipeline(pipeline);
      pass.draw(3);
      pass.end();
      this.frameRendered = true;
    } finally {
      // WebGPU consumes the descriptor during beginRenderPass; do not retain a swapchain view.
      this.colorAttachment.view = undefined;
    }
  }

  endFrame(): void {
    const device = this.requireDevice();
    if (!this.encoder || !this.frameRendered) {
      throw new GraphicsError('WebGPU endFrame requires a rendered frame.');
    }
    const commandBuffer = this.encoder.finish();
    this.encoder = undefined;
    this.submissions.push(commandBuffer);
    try {
      device.queue.submit(this.submissions);
    } finally {
      this.submissions.length = 0;
    }
  }

  resize(width: number, height: number): void {
    const canvas = this.canvas;
    const device = this.device;
    if (!canvas || !device || this.destroyed)
      throw new GraphicsError(
        'WebGPU resize requires an initialized renderer.',
      );
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 0 ||
      height < 0
    ) {
      throw new RangeError(
        'WebGPU canvas pixel width and height must be finite, nonnegative numbers.',
      );
    }
    const pixelWidth = Math.max(1, Math.round(width));
    const pixelHeight = Math.max(1, Math.round(height));
    const limit = device.limits.maxTextureDimension2D;
    if (
      !Number.isSafeInteger(pixelWidth) ||
      !Number.isSafeInteger(pixelHeight) ||
      pixelWidth > limit ||
      pixelHeight > limit
    ) {
      throw new GraphicsError(
        `WebGPU canvas backing size ${pixelWidth}×${pixelHeight} exceeds this device's maximum texture dimension of ${limit} pixels per side. Reduce the canvas size or pixel ratio.`,
      );
    }
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const side = Math.min(pixelWidth, pixelHeight);
    this.viewportX = (pixelWidth - side) / 2;
    this.viewportY = (pixelHeight - side) / 2;
    this.viewportSide = side;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const context = this.context;
    const device = this.device;
    this.encoder = undefined;
    this.colorAttachment.view = undefined;
    this.submissions.length = 0;
    this.pipeline = undefined;
    this.context = undefined;
    this.canvas = undefined;
    this.device = undefined;
    try {
      if (this.configured) context?.unconfigure();
    } finally {
      device?.destroy();
    }
  }

  private requireDevice(): GPUDevice {
    if (this.lostError) throw this.lostError;
    if (this.destroyed || !this.device || !this.pipeline) {
      throw new GraphicsError(
        'WebGPU renderer is not initialized or has already been destroyed.',
      );
    }
    return this.device;
  }
}
