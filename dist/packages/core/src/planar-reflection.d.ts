import { CanvasTexture2D } from '../../assets/src/index.js';
import { Matrix4 } from '../../math/src/index.js';
import { PerspectiveCamera } from './perspective-camera.js';
import type { OrthographicCamera } from './orthographic-camera.js';
import type { Object3D } from './object3d.js';
import { NativeMaterial3D } from './native-material3d.js';
import type { TextureMaterialOptions } from './mesh.js';
import { NativePBRMaterial } from './native-pbr-material.js';
import type { PBRMaterialOptions } from './pbr-material.js';
export interface PlanarReflectionOptions {
    /** World plane n.xyz * world + constant = 0; normal need not be unit length. */
    readonly normal?: readonly [number, number, number];
    readonly constant?: number;
    readonly size?: number;
    /** Minimum simulation seconds between successful capture attempts. */
    readonly updateInterval?: number;
    readonly clipBias?: number;
    /** Borrowed reflector meshes must be excluded to avoid feedback. */
    readonly exclude?: readonly Object3D[];
}
/** Mirrored scene capture, with bounded readback and an owned reusable texture. */
export declare class PlanarReflection {
    readonly plane: readonly [number, number, number, number];
    readonly size: number;
    readonly updateInterval: number;
    readonly clipBias: number;
    readonly exclude: readonly Object3D[];
    readonly matrix: Matrix4;
    private map;
    private disposed;
    private pending;
    private next;
    private readonly consumers;
    constructor(options?: PlanarReflectionOptions);
    get destroyed(): boolean;
    /** Undefined until the first successful native capture; caller removes consumers before destroy. */
    get texture(): CanvasTexture2D | undefined;
    /** Internal capture gate. Nested/pending calls reject; calls before the interval return false. */
    beginCapture(time: number): boolean;
    endCapture(): void;
    /** Native backends publish top-left sRGB RGBA8 only after a successful submission/readback. */
    adoptPixels(pixels: Uint8ClampedArray): void;
    /** Projective native surface hook for either backend. Prepare before drawing; exclude its mesh from capture. */
    createMaterial(options: TextureMaterialOptions): NativeMaterial3D;
    /** Add projective linear reflection radiance to PBR emission; reserves the emissive sampler. */
    createPBRMaterial(options: PBRMaterialOptions, strength?: number): NativePBRMaterial;
    destroy(): void;
}
/** Correct-handed mirrored camera: horizontal projection reversal avoids reversed mesh winding. */
export declare class PlanarReflectionCamera extends PerspectiveCamera {
    private readonly source;
    private readonly capture;
    private readonly reflection;
    private readonly inverse;
    constructor(source: PerspectiveCamera | OrthographicCamera, capture: PlanarReflection);
    updateMatrix(aspect: number): Matrix4;
}
