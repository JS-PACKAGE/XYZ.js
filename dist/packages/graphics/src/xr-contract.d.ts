import type { XRViewport } from '../../core/src/xr.js';
export type XRRendererBinding = {
    readonly backend: 'webgl2';
    readonly context: WebGL2RenderingContext;
} | {
    readonly backend: 'webgpu';
    readonly device: GPUDevice;
    readonly format: GPUTextureFormat;
};
export type XRRenderTarget = {
    readonly backend: 'webgl2';
    readonly framebuffer: WebGLFramebuffer;
    readonly viewport: XRViewport;
} | {
    readonly backend: 'webgpu';
    readonly texture: GPUTexture;
    readonly viewport: XRViewport;
    readonly imageIndex: number;
};
