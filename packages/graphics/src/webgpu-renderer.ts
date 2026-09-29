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
  private frameRendered = false;
  private configured = false;
  private destroyed = false;
  private lostError: WebGPUDeviceLostError | undefined;

  constructor(private readonly onError: (error: Error) => void) {}

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    if (this.destroyed || this.device) {
      throw new GraphicsError(
        'WebGPU renderer cannot be initialized more than once.',
      );
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: this browser or security context does not expose navigator.gpu.',
        );
      }
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        throw new WebGPUNotSupportedError(
          'WebGPU is unavailable: the browser could not provide a GPU adapter.',
        );
      }
      const device = await adapter.requestDevice();
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
      if (canvas.width < 1 || canvas.height < 1)
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
      this.destroy();
      if (error instanceof GraphicsError) throw error;
      throw new WebGPUInitializationError(
        `WebGPU initialization failed while requesting a device or configuring the canvas and triangle pipeline${error instanceof Error ? `: ${error.message}` : '.'}`,
        { cause: error },
      );
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
    const canvas = this.canvas;
    const pipeline = this.pipeline;
    if (!encoder || !context || !canvas || !pipeline || this.frameRendered) {
      throw new GraphicsError(
        'WebGPU render requires an active frame and may be called only once per frame.',
      );
    }
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: defaults.clearColor,
        },
      ],
    });
    // A square viewport keeps the triangle's proportions when the canvas is wide or tall.
    const side = Math.min(canvas.width, canvas.height);
    pass.setViewport(
      (canvas.width - side) / 2,
      (canvas.height - side) / 2,
      side,
      side,
      0,
      1,
    );
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();
    this.frameRendered = true;
  }

  endFrame(): void {
    const device = this.requireDevice();
    if (!this.encoder || !this.frameRendered) {
      throw new GraphicsError('WebGPU endFrame requires a rendered frame.');
    }
    const commandBuffer = this.encoder.finish();
    this.encoder = undefined;
    device.queue.submit([commandBuffer]);
  }

  resize(width: number, height: number): void {
    if (!this.canvas || this.destroyed)
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
    if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
    if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const context = this.context;
    const device = this.device;
    this.encoder = undefined;
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
