import {
  ComputeBuffer,
  ComputeProgram,
  gpuOperation,
  type ComputeArray,
  type ComputeDispatchOptions,
  type ComputeReadOptions,
  type ComputePreparationOptions,
} from './compute.js';
import { GraphicsError, WebGPUDeviceLostError } from './errors.js';
import { computeLimits } from '../../../src/data/gpu-programs.js';

/** Internal native owner; never returned through the public renderer facade. */
export class WebGPUCompute {
  private readonly buffers = new Map<
    ComputeBuffer,
    { native: GPUBuffer; release: () => void }
  >();
  private readonly programs = new Map<
    ComputeProgram,
    { ready: Promise<GPUComputePipeline>; release: () => void }
  >();
  private readonly staging = new Set<GPUBuffer>();
  private residentBytes = 0;
  private stagingBytes = 0;
  private failure: Error | undefined;
  private readonly lifetime: Promise<never>;
  private rejectLifetime!: (error: Error) => void;
  constructor(private readonly device: GPUDevice) {
    this.lifetime = new Promise<never>((_, reject) => {
      this.rejectLifetime = reject;
    });
    void this.lifetime.catch(() => {});
    void device.lost.then((info) =>
      this.destroy(
        new WebGPUDeviceLostError(`Compute device lost: ${info.message}`),
      ),
    );
  }
  private live(): void {
    if (this.failure) throw this.failure;
  }
  private wait<T>(
    promise: Promise<T>,
    resources: readonly (ComputeBuffer | ComputeProgram)[],
    signal?: AbortSignal,
  ): Promise<T> {
    return gpuOperation(
      Promise.race([promise, this.lifetime]),
      signal,
      resources,
    );
  }
  private buffer(source: ComputeBuffer): GPUBuffer {
    this.live();
    source.validate();
    const existing = this.buffers.get(source);
    if (existing) return existing.native;
    if (
      source.byteLength > this.device.limits.maxStorageBufferBindingSize ||
      source.byteLength > this.device.limits.maxBufferSize
    )
      throw new RangeError('Compute buffer exceeds device limits.');
    if (
      this.buffers.size >= computeLimits.buffers ||
      this.residentBytes + this.stagingBytes + source.byteLength >
        computeLimits.residentBytes
    )
      throw new RangeError('Compute resident buffer budget exceeded.');
    const native = this.device.createBuffer({
      label: source.label,
      size: source.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST,
    });
    const release = (): void => {
      if (!this.buffers.has(source)) return;
      native.destroy();
      source.removeEventListener('destroy', release);
      this.buffers.delete(source);
      this.residentBytes -= source.byteLength;
    };
    source.addEventListener('destroy', release, { once: true });
    this.buffers.set(source, { native, release });
    this.residentBytes += source.byteLength;
    return native;
  }
  async prepare(
    program: ComputeProgram,
    options: ComputePreparationOptions = {},
  ): Promise<void> {
    this.live();
    program.validate();
    options.signal?.throwIfAborted();
    let record = this.programs.get(program);
    if (!record) {
      if (this.programs.size >= computeLimits.programs)
        throw new RangeError('Compute prepared program budget exceeded.');
      const size = program.workgroupSize,
        limits = this.device.limits;
      if (
        size[0] > limits.maxComputeWorkgroupSizeX ||
        size[1] > limits.maxComputeWorkgroupSizeY ||
        size[2] > limits.maxComputeWorkgroupSizeZ ||
        size[0] * size[1] * size[2] >
          limits.maxComputeInvocationsPerWorkgroup ||
        program.bindings.length > limits.maxStorageBuffersPerShaderStage
      )
        throw new RangeError('Compute program exceeds device limits.');
      const ready = this.compile(program);
      const release = (): void => {
        program.removeEventListener('destroy', release);
        this.programs.delete(program);
      };
      record = { ready, release };
      this.programs.set(program, record);
      program.addEventListener('destroy', release, { once: true });
      void ready.catch(() => {
        if (this.programs.get(program)?.ready === ready) release();
      });
    }
    await this.wait(record.ready, [program], options.signal);
    this.live();
    program.validate();
  }
  private async compile(program: ComputeProgram): Promise<GPUComputePipeline> {
    const declarations = program.bindings
      .map(
        (binding, index) =>
          `@group(0) @binding(${index}) var<storage, ${binding.access === 'read' ? 'read' : 'read_write'}> buffer${index}: array<${binding.type}>;`,
      )
      .join('\n');
    this.device.pushErrorScope('validation');
    let module: GPUShaderModule;
    let validation: Promise<GPUError | null>;
    try {
      module = this.device.createShaderModule({
        label: program.label,
        code: `${declarations}\n${program.wgsl}\n@compute @workgroup_size(${program.workgroupSize.join(',')}) fn main(@builtin(global_invocation_id) index: vec3u) { compute(index); }`,
      });
    } finally {
      validation = this.device.popErrorScope();
    }
    const [info, error] = await Promise.all([
      module.getCompilationInfo(),
      validation,
    ]);
    this.live();
    program.validate();
    const errors = info.messages.filter((message) => message.type === 'error');
    if (errors.length)
      throw new GraphicsError(
        `Compute compilation failed: ${errors.map((message) => `${message.lineNum}:${message.linePos} ${message.message}`).join('; ')}`,
      );
    if (error)
      throw new GraphicsError(
        `Compute shader validation failed: ${error.message}`,
      );
    const layout = this.device.createBindGroupLayout({
      entries: program.bindings.map((binding, index) => ({
        binding: index,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type:
            binding.access === 'read'
              ? ('read-only-storage' as const)
              : ('storage' as const),
        },
      })),
    });
    const pipeline = await this.device.createComputePipelineAsync({
      label: program.label,
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      compute: { module, entryPoint: 'main' },
    });
    this.live();
    program.validate();
    return pipeline;
  }
  upload(source: ComputeBuffer, data: ComputeArray, offset = 0): void {
    this.live();
    source.validateUpload(data, offset);
    if (data.byteLength)
      this.device.queue.writeBuffer(
        this.buffer(source),
        offset * 4,
        data.buffer as ArrayBuffer,
        data.byteOffset,
        data.byteLength,
      );
  }
  async dispatch(
    program: ComputeProgram,
    options: ComputeDispatchOptions,
  ): Promise<void> {
    this.live();
    options.signal?.throwIfAborted();
    const count = program.validateDispatch(options);
    if (
      count.some(
        (value) => value > this.device.limits.maxComputeWorkgroupsPerDimension,
      )
    )
      throw new RangeError('Compute dispatch exceeds device workgroup count.');
    await this.prepare(program, options);
    this.live();
    options.signal?.throwIfAborted();
    program.validateDispatch(options);
    const pipeline = await this.programs.get(program)!.ready;
    this.live();
    options.signal?.throwIfAborted();
    program.validateDispatch(options);
    for (let index = 0; index < options.bindings.length; index++) {
      if (
        program.bindings[index].access === 'read' &&
        !this.buffers.has(options.bindings[index])
      )
        throw new GraphicsError(
          'Compute input has no contents in this device generation; upload or produce it before dispatch.',
        );
    }
    const group = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: options.bindings.map((source, binding) => ({
        binding,
        resource: { buffer: this.buffer(source) },
      })),
    });
    const encoder = this.device.createCommandEncoder({ label: program.label });
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(...count);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
    await this.wait(
      this.device.queue.onSubmittedWorkDone(),
      [program, ...options.bindings],
      options.signal,
    );
    this.live();
    program.validate();
    options.bindings.forEach((source) => source.validate());
  }
  async read(
    source: ComputeBuffer,
    options: ComputeReadOptions = {},
  ): Promise<ComputeArray> {
    this.live();
    options.signal?.throwIfAborted();
    const offset = options.offset ?? 0,
      count = options.count ?? source.length - offset;
    source.range(offset, count);
    const Constructor =
      source.type === 'f32'
        ? Float32Array
        : source.type === 'u32'
          ? Uint32Array
          : Int32Array;
    if (!count) return new Constructor(0);
    const native = this.buffers.get(source)?.native;
    if (!native)
      throw new GraphicsError(
        'Compute buffer has no contents in this device generation; upload or produce it before readback.',
      );
    if (
      this.residentBytes + this.stagingBytes + count * 4 >
      computeLimits.residentBytes
    )
      throw new RangeError('Compute readback staging budget exceeded.');
    const staging = this.device.createBuffer({
      size: count * 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    this.staging.add(staging);
    this.stagingBytes += count * 4;
    try {
      const encoder = this.device.createCommandEncoder();
      encoder.copyBufferToBuffer(native, offset * 4, staging, 0, count * 4);
      this.device.queue.submit([encoder.finish()]);
      await this.wait(
        staging.mapAsync(GPUMapMode.READ),
        [source],
        options.signal,
      );
      this.live();
      source.validate();
      return new Constructor(staging.getMappedRange().slice(0));
    } finally {
      if (this.staging.delete(staging)) this.stagingBytes -= count * 4;
      staging.destroy();
    }
  }
  destroy(error = new GraphicsError('Compute owner destroyed.')): void {
    if (this.failure) return;
    this.failure = error;
    this.rejectLifetime(error);
    for (const record of this.buffers.values()) record.release();
    for (const record of this.programs.values()) record.release();
    for (const buffer of this.staging) buffer.destroy();
    this.staging.clear();
    this.stagingBytes = 0;
  }
}
