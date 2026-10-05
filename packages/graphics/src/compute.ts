import { computeLimits } from '../../../src/data/gpu-programs.js';
import { GraphicsError } from './errors.js';

export type ComputeScalar = 'f32' | 'u32' | 'i32';
export type ComputeArray = Float32Array | Uint32Array | Int32Array;
export interface ComputeBinding {
  readonly type: ComputeScalar;
  readonly access: 'read' | 'read-write';
}
export interface ComputeProgramOptions {
  /** WGSL declarations defining fn compute(index: vec3u). Storage arrays are buffer0..N at group 0. */
  readonly wgsl: string;
  readonly bindings: readonly ComputeBinding[];
  readonly workgroupSize?: readonly [number, number?, number?];
  readonly label?: string;
}
export interface ComputeDispatchOptions {
  readonly bindings: readonly ComputeBuffer[];
  readonly workgroups: readonly [number, number?, number?];
  readonly signal?: AbortSignal;
}
export interface ComputeReadOptions {
  readonly offset?: number;
  readonly count?: number;
  readonly signal?: AbortSignal;
}
export interface ComputePreparationOptions {
  readonly signal?: AbortSignal;
}

export class ComputeBuffer extends EventTarget {
  readonly type: ComputeScalar;
  readonly length: number;
  readonly label: string;
  private disposed = false;
  constructor(options: {
    type: ComputeScalar;
    length: number;
    label?: string;
  }) {
    super();
    if (!['f32', 'u32', 'i32'].includes(options.type))
      throw new TypeError('Unknown compute scalar type.');
    if (
      !Number.isSafeInteger(options.length) ||
      options.length < 1 ||
      options.length * 4 > computeLimits.bufferBytes
    )
      throw new RangeError(
        'Compute buffer length exceeds the bounded byte budget.',
      );
    this.type = options.type;
    this.length = options.length;
    this.label = options.label ?? 'ComputeBuffer';
  }
  get byteLength(): number {
    return this.length * 4;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  validate(): void {
    if (this.disposed) throw new GraphicsError('ComputeBuffer is destroyed.');
  }
  validateUpload(data: ComputeArray, offset = 0): void {
    this.validate();
    if (
      !(this.type === 'f32'
        ? data instanceof Float32Array
        : this.type === 'u32'
          ? data instanceof Uint32Array
          : data instanceof Int32Array)
    )
      throw new TypeError('Compute upload must match the buffer scalar type.');
    this.range(offset, data.length);
    if (this.type === 'f32')
      for (const value of data)
        if (!Number.isFinite(value))
          throw new RangeError('Compute float inputs must be finite.');
  }
  range(offset: number, count: number): void {
    this.validate();
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(count) ||
      offset < 0 ||
      count < 0 ||
      offset + count > this.length
    )
      throw new RangeError('Compute element range is out of bounds.');
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dispatchEvent(new Event('destroy'));
  }
}

export class ComputeProgram extends EventTarget {
  readonly wgsl: string;
  readonly bindings: readonly ComputeBinding[];
  readonly workgroupSize: readonly [number, number, number];
  readonly label: string;
  private disposed = false;
  constructor(options: ComputeProgramOptions) {
    super();
    if (
      typeof options.wgsl !== 'string' ||
      !options.wgsl.trim() ||
      options.wgsl.length > computeLimits.sourceCharacters
    )
      throw new TypeError('ComputeProgram requires bounded native WGSL.');
    if (
      !options.bindings.length ||
      options.bindings.length > computeLimits.bindings ||
      options.bindings.some(
        (binding) =>
          !['f32', 'u32', 'i32'].includes(binding.type) ||
          !['read', 'read-write'].includes(binding.access),
      )
    )
      throw new TypeError('Compute binding descriptors are invalid.');
    const size = options.workgroupSize ?? [64];
    const xyz: [number, number, number] = [size[0], size[1] ?? 1, size[2] ?? 1];
    if (
      xyz.some(
        (value) =>
          !Number.isSafeInteger(value) ||
          value < 1 ||
          value > computeLimits.workgroupDimension,
      ) ||
      xyz[0] * xyz[1] * xyz[2] > computeLimits.workgroupInvocations
    )
      throw new RangeError('Compute workgroup size exceeds engine limits.');
    this.wgsl = options.wgsl;
    this.bindings = Object.freeze(
      options.bindings.map((binding) => Object.freeze({ ...binding })),
    );
    this.workgroupSize = Object.freeze(xyz);
    this.label = options.label ?? 'ComputeProgram';
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  validate(): void {
    if (this.disposed) throw new GraphicsError('ComputeProgram is destroyed.');
  }
  validateDispatch(
    options: ComputeDispatchOptions,
  ): readonly [number, number, number] {
    this.validate();
    if (options.bindings.length !== this.bindings.length)
      throw new RangeError('Compute binding count mismatch.');
    options.bindings.forEach((buffer, index) => {
      buffer.validate();
      if (buffer.type !== this.bindings[index].type)
        throw new TypeError('Compute binding scalar mismatch.');
    });
    // Aliasing a writable binding would violate WebGPU resource usage validation.
    options.bindings.forEach((buffer, index) => {
      if (
        options.bindings.some(
          (other, otherIndex) =>
            other === buffer &&
            otherIndex !== index &&
            (this.bindings[index].access === 'read-write' ||
              this.bindings[otherIndex].access === 'read-write'),
        )
      )
        throw new GraphicsError('Writable compute bindings must not alias.');
    });
    const count: [number, number, number] = [
      options.workgroups[0],
      options.workgroups[1] ?? 1,
      options.workgroups[2] ?? 1,
    ];
    if (
      count.some(
        (value) =>
          !Number.isSafeInteger(value) ||
          value < 1 ||
          value > computeLimits.dispatchDimension,
      )
    )
      throw new RangeError('Compute dispatch exceeds engine limits.');
    return count;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dispatchEvent(new Event('destroy'));
  }
}

/** Abort stops waiting/submission, not already submitted GPU execution. */
export function gpuOperation<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
  resources: readonly (EventTarget & { readonly destroyed: boolean })[] = [],
): Promise<T> {
  if (!signal && !resources.length) return promise;
  return new Promise<T>((resolve, reject) => {
    const cleanup = (): void => {
      signal?.removeEventListener('abort', abort);
      for (const resource of resources)
        resource.removeEventListener('destroy', destroyed);
    };
    const abort = (): void => {
      cleanup();
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    const destroyed = (): void => {
      cleanup();
      reject(new GraphicsError('GPU descriptor destroyed during operation.'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    for (const resource of resources)
      resource.addEventListener('destroy', destroyed, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
    if (signal?.aborted) abort();
    else if (resources.some((resource) => resource.destroyed)) destroyed();
  });
}
