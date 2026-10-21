import { type MeshShaderFeatures } from './mesh-shader-variants.js';
export declare const webgpuMeshShader: string;
/** Source composition keeps disabled physical lobes out of driver compilation. */
export declare function buildWebGPUMeshShader(features?: MeshShaderFeatures): string;
/**
 * Compose native hook declarations, not a shader-language translator. `shader` may be a
 * physical variant from {@link buildWebGPUMeshShader}; it must keep both hook markers.
 */
export declare function nativeMeshWGSL(source: string, physical?: boolean, shader?: string): string;
