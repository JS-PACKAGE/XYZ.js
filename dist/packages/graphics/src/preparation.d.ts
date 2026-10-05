import type { Texture2DSource } from '../../assets/src/index.js';
import { Geometry } from '../../core/src/geometry.js';
import { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import { Mesh } from '../../core/src/mesh.js';
import { EnvironmentMap } from '../../core/src/environment.js';
import { Material2D, PostProcessor2D } from '../../core/src/materials2d/material2d.js';
import { NativeMaterial3D } from '../../core/src/native-material3d.js';
import { NativePBRMaterial } from '../../core/src/native-pbr-material.js';
import type { NativeResidency, ResidencyAllocation } from './residency.js';
import { ParticleLayer2D } from '../../core/src/particles2d/particle-layer2d.js';
import { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
export type PreparationResource = Texture2DSource | Geometry | Geometry2D | Mesh | ParticleLayer2D | GPUParticleEmitter3D | EnvironmentMap | Material2D | NativeMaterial3D | NativePBRMaterial | PostProcessor2D;
export interface ResourcePreparationOptions {
    readonly signal?: AbortSignal;
}
interface NativePreparationOperations {
    texture(source: Texture2DSource): void;
    geometry(source: Geometry | Geometry2D): void;
    mesh(source: Mesh): void;
    particles(source: ParticleLayer2D): void;
    gpuParticles(source: GPUParticleEmitter3D): Promise<void>;
    environment(source: EnvironmentMap): void;
    material(source: Material2D | NativeMaterial3D | NativePBRMaterial): Promise<void>;
    post(source: PostProcessor2D): Promise<void>;
    complete(): Promise<void>;
}
export interface PreparedResourceLease {
    readonly released: boolean;
    release(): void;
}
export declare function preparationResourceDestroyed(resource: PreparationResource): boolean;
export declare function residencyLease(allocations: readonly ResidencyAllocation[]): PreparedResourceLease;
export declare function prepareNativeResource(residency: NativeResidency, resource: PreparationResource, operations: NativePreparationOperations, options?: ResourcePreparationOptions): Promise<PreparedResourceLease>;
export {};
