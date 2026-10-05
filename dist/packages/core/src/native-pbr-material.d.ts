import { PBRMaterial, type PBRMaterialOptions } from './pbr-material.js';
import { type NativeShader3DOptions } from './native-material-state.js';
export interface NativePBRMaterialOptions extends PBRMaterialOptions, NativeShader3DOptions {
}
/** Native physical-surface hooks; the engine still owns BRDF, passes and bindings. */
export declare class NativePBRMaterial extends PBRMaterial {
    private readonly state;
    readonly label: string;
    readonly uniforms: Float32Array;
    readonly deformationBounds: number | undefined;
    readonly shadowCache: 'dynamic' | 'tracked';
    constructor(options: NativePBRMaterialOptions);
    get wgsl(): string;
    get glsl(): string;
    get destroyed(): boolean;
    setUniforms(values: ArrayLike<number>, offset?: number): void;
    validate(): void;
    onDestroy(listener: () => void): () => void;
    destroy(): void;
}
