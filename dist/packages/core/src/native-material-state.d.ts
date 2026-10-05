export interface NativeShader3DOptions {
    /** Native declarations, without entry points or additional resources. */
    readonly wgsl: string;
    readonly glsl: string;
    readonly uniforms?: ArrayLike<number>;
    readonly label?: string;
    /** Maximum final mesh-local displacement; absent disables bounds culling. */
    readonly deformationBounds?: number;
    /** Tracked hooks must depend only on their inputs, uniforms and borrowed maps. */
    shadowCache?: 'dynamic' | 'tracked';
}
/** Shared validation/lifetime for the basic and physical native material facades. */
export declare class NativeMaterialState {
    private readonly kind;
    readonly wgsl: string;
    readonly glsl: string;
    readonly label: string;
    readonly deformationBounds: number | undefined;
    readonly shadowCache: 'dynamic' | 'tracked';
    readonly uniforms: Float32Array<ArrayBuffer>;
    private readonly listeners;
    private disposed;
    constructor(options: NativeShader3DOptions, kind: string);
    get destroyed(): boolean;
    setUniforms(values: ArrayLike<number>, offset?: number): void;
    validate(): void;
    onDestroy(listener: () => void): () => void;
    destroy(): void;
}
