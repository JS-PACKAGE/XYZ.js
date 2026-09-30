import type { Scene } from '../../core/src/scene.js';
/** Renderer-private resources; Geometry vertex/index data must remain immutable after construction. */
export declare class WebGPUMeshPipeline {
    private readonly device;
    private readonly pipeline;
    private readonly geometries;
    private readonly meshes;
    private readonly textures;
    private readonly sceneData;
    private readonly colorAttachment;
    private readonly depthAttachment;
    private readonly renderPassDescriptor;
    private sceneBuffer;
    private sceneBindGroup;
    private sampler;
    private depthTexture;
    private depthView;
    private depthWidth;
    private depthHeight;
    private frame;
    private constructor();
    static initialize(device: GPUDevice, format: GPUTextureFormat, isDestroyed: () => boolean): Promise<WebGPUMeshPipeline>;
    /** Release depth only on an actual backing-size change; other caches survive resize. */
    resize(width: number, height: number): void;
    /** Draw visible 3D meshes into a cleared depth pass before the sprite overlay. */
    render(scene: Scene | undefined, encoder: GPUCommandEncoder, view: GPUTextureView, width: number, height: number, aspect: number, clearValue: GPUColor): boolean;
    private prepareScene;
    private ensureDepth;
    private cacheGeometry;
    private cacheMesh;
    private cacheTexture;
    private updateMesh;
    private releaseUnused;
    destroy(): void;
}
