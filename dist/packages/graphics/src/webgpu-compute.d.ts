import { ComputeBuffer, ComputeProgram, type ComputeArray, type ComputeDispatchOptions, type ComputeReadOptions, type ComputePreparationOptions } from './compute.js';
import { GraphicsError } from './errors.js';
/** Internal native owner; never returned through the public renderer facade. */
export declare class WebGPUCompute {
    private readonly device;
    private readonly buffers;
    private readonly programs;
    private readonly staging;
    private residentBytes;
    private stagingBytes;
    private failure;
    private readonly lifetime;
    private rejectLifetime;
    constructor(device: GPUDevice);
    private live;
    private wait;
    private buffer;
    prepare(program: ComputeProgram, options?: ComputePreparationOptions): Promise<void>;
    private compile;
    upload(source: ComputeBuffer, data: ComputeArray, offset?: number): void;
    dispatch(program: ComputeProgram, options: ComputeDispatchOptions): Promise<void>;
    read(source: ComputeBuffer, options?: ComputeReadOptions): Promise<ComputeArray>;
    destroy(error?: GraphicsError): void;
}
