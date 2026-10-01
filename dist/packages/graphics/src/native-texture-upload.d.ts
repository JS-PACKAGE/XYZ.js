import { NativeTexture2D } from '../../assets/src/native-texture.js';
import type { NativeTextureFormat } from '../../assets/src/native-texture.js';
export declare const compressionFeatures: readonly GPUFeatureName[];
export declare function webgpuTextureFormats(device: GPUDevice): readonly NativeTextureFormat[];
export declare function validateNativeWebGPU(device: GPUDevice, source: NativeTexture2D): void;
export declare function uploadNativeWebGPU(device: GPUDevice, resource: GPUTexture, source: NativeTexture2D): void;
/** Encoded sRGB payloads follow the same shader conversion as decoded images. */
export declare function nativeUploadFormat(format: NativeTextureFormat): NativeTextureFormat;
export declare function webglTextureFormats(gl: WebGL2RenderingContext): readonly NativeTextureFormat[];
export declare function uploadNativeWebGL(gl: WebGL2RenderingContext, source: NativeTexture2D): void;
