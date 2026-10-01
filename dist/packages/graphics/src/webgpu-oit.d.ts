/** Owns transient weighted accumulation/revealage, sharing the opaque depth attachment. */
export declare class WebGPUOIT {
    private readonly device;
    private readonly samples;
    private readonly textures;
    private width;
    private height;
    private group;
    private readonly colors;
    private readonly composite;
    private readonly layout;
    constructor(device: GPUDevice, samples: number);
    begin(encoder: GPUCommandEncoder, width: number, height: number, depth: GPUTextureView): GPURenderPassEncoder;
    resolve(encoder: GPUCommandEncoder, target: GPUTextureView): void;
    private allocate;
    resize(width: number, height: number): void;
    release(): void;
}
