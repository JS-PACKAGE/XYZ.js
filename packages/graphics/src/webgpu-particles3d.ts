import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
import {
  GPU_PARTICLE_COMMAND_FLOATS,
  GPU_PARTICLE_UNIFORM_FLOATS,
} from '../../../src/data/gpu-particles3d.js';
import { GraphicsError } from './errors.js';
import { ParticleUniforms3D } from './gpu-particles3d-data.js';
import { gpuParticles3DWGSL } from './gpu-particles3d-shaders.js';
import type { FrameStats } from './render-stats.js';

interface ParticleBuffers {
  commands: GPUBuffer;
  uniform: GPUBuffer;
  group: GPUBindGroup;
  version: number;
  seen: number;
  prepared: boolean;
  unown: () => void;
}

/** Native analytic vertex simulation; renderer owns this module per GPUDevice. */
export class WebGPUParticles3D {
  private readonly buffers = new Map<GPUParticleEmitter3D, ParticleBuffers>();
  private readonly uniforms = new ParticleUniforms3D();
  private frame = 0;
  private disposed = false;
  private constructor(
    private readonly device: GPUDevice,
    private readonly layout: GPUBindGroupLayout,
    private readonly pipeline: GPURenderPipeline,
    private readonly hdrPipeline: GPURenderPipeline,
    private readonly stats: FrameStats,
  ) {}

  static async initialize(
    device: GPUDevice,
    format: GPUTextureFormat,
    sampleCount: number,
    stats: FrameStats,
  ): Promise<WebGPUParticles3D> {
    const module = device.createShaderModule({
      label: 'XYZ GPU particles3D analytic vertices',
      code: gpuParticles3DWGSL,
    });
    const compilation = await module.getCompilationInfo();
    const errors = compilation.messages.filter(
      (message) => message.type === 'error',
    );
    if (errors.length)
      throw new GraphicsError(
        `GPU particle shader compilation failed: ${errors.map((message) => message.message).join('; ')}`,
      );
    const layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });
    const blend: GPUBlendComponent = {
      srcFactor: 'one',
      dstFactor: 'one-minus-src-alpha',
    };
    const descriptor: GPURenderPipelineDescriptor = {
      label: 'XYZ GPU particles3D',
      layout: pipelineLayout,
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: GPU_PARTICLE_COMMAND_FLOATS * 4,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32' },
              { shaderLocation: 1, offset: 4, format: 'uint32' },
              { shaderLocation: 2, offset: 16, format: 'float32x4' },
              { shaderLocation: 3, offset: 32, format: 'float32x4' },
              { shaderLocation: 4, offset: 48, format: 'float32x4' },
              { shaderLocation: 5, offset: 64, format: 'float32x4' },
            ],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format, blend: { color: blend, alpha: blend } }],
      },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
      },
      multisample: { count: sampleCount },
    };
    try {
      const pipeline = await device.createRenderPipelineAsync(descriptor);
      descriptor.fragment = {
        module,
        entryPoint: 'fragmentMain',
        targets: [
          { format: 'rgba16float', blend: { color: blend, alpha: blend } },
        ],
      };
      const hdr = await device.createRenderPipelineAsync(descriptor);
      return new WebGPUParticles3D(device, layout, pipeline, hdr, stats);
    } catch (error) {
      throw new GraphicsError(
        `GPU particle pipeline preparation failed: ${String(error)}`,
      );
    }
  }

  get nativeBufferCount(): number {
    return this.buffers.size * 2;
  }

  prepare(emitter: GPUParticleEmitter3D): void {
    if (this.disposed || emitter.destroyed)
      throw new GraphicsError('Cannot prepare destroyed GPU particles.');
    const entry = this.buffers.get(emitter) ?? this.allocate(emitter);
    entry.prepared = true;
    if (entry.version !== emitter.commandVersion) {
      this.device.queue.writeBuffer(
        entry.commands,
        0,
        emitter.commandData.buffer,
        emitter.commandData.byteOffset,
        emitter.commandData.byteLength,
      );
      this.stats.upload(emitter.commandData.byteLength);
      entry.version = emitter.commandVersion;
    }
  }

  /** Main color/depth pass only, never a shadow or weighted accumulation pass. */
  draw(
    pass: GPURenderPassEncoder,
    emitters: Iterable<GPUParticleEmitter3D>,
    camera: Camera3D,
    aspect: number,
    linear = false,
  ): void {
    if (this.disposed)
      throw new GraphicsError('GPU particle backend is destroyed.');
    this.frame++;
    let bound = false;
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
      if (!bound) {
        pass.setPipeline(linear ? this.hdrPipeline : this.pipeline);
        bound = true;
      }
      if (entry.version !== emitter.commandVersion) {
        this.device.queue.writeBuffer(
          entry.commands,
          0,
          emitter.commandData.buffer,
          emitter.commandData.byteOffset,
          emitter.commandData.byteLength,
        );
        this.stats.upload(emitter.commandData.byteLength);
        entry.version = emitter.commandVersion;
      }
      const data = this.uniforms.fill(emitter, camera, aspect, linear);
      this.device.queue.writeBuffer(entry.uniform, 0, data.buffer);
      this.stats.upload(data.byteLength);
      pass.setBindGroup(0, entry.group);
      pass.setVertexBuffer(0, entry.commands);
      const first = Math.min(
        emitter.activeCount,
        emitter.capacity - emitter.commandHead,
      );
      pass.draw(6, first, 0, emitter.commandHead);
      this.stats.draw(6, first);
      const second = emitter.activeCount - first;
      if (second) {
        pass.draw(6, second);
        this.stats.draw(6, second);
      }
    }
    for (const [emitter, entry] of this.buffers)
      if (entry.seen !== this.frame && !entry.prepared) this.release(emitter);
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

  /** Release emitter allocations while keeping the reusable native pipelines. */
  clear(): void {
    for (const emitter of this.buffers.keys()) this.release(emitter);
  }

  /** Device loss discards every native handle; reinitialize against the new device. */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear();
  }
  private allocate(emitter: GPUParticleEmitter3D): ParticleBuffers {
    let commands: GPUBuffer | undefined;
    let uniform: GPUBuffer | undefined;
    try {
      commands = this.device.createBuffer({
        label: 'Particle emission commands',
        size: emitter.commandData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      uniform = this.device.createBuffer({
        label: 'Particle clock/config',
        size: GPU_PARTICLE_UNIFORM_FLOATS * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const group = this.device.createBindGroup({
        layout: this.layout,
        entries: [{ binding: 0, resource: { buffer: uniform } }],
      });
      const unown = emitter.ownNative(() => this.release(emitter));
      const entry: ParticleBuffers = {
        commands,
        uniform,
        group,
        version: -1,
        seen: this.frame,
        prepared: false,
        unown,
      };
      this.buffers.set(emitter, entry);
      return entry;
    } catch (error) {
      commands?.destroy();
      uniform?.destroy();
      throw error;
    }
  }
  private release(emitter: GPUParticleEmitter3D): void {
    const entry = this.buffers.get(emitter);
    if (!entry) return;
    this.buffers.delete(emitter);
    entry.unown();
    entry.commands.destroy();
    entry.uniform.destroy();
  }
}
