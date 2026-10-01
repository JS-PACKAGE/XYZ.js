import { Vector3 } from '../../math/src/index.js';
import { EnvironmentMap } from './environment.js';
import type { Mesh } from './mesh.js';
import type { Scene } from './scene.js';
export interface ReflectionProbeOptions {
    environment: EnvironmentMap;
    position: Vector3 | [number, number, number];
    min: Vector3 | [number, number, number];
    max: Vector3 | [number, number, number];
    intensity?: number;
    enabled?: boolean;
    boxProjection?: boolean;
}
/** A borrowed radiance map with world-space influence bounds and parallax-correct reflections. */
export declare class ReflectionProbe {
    environment: EnvironmentMap;
    readonly position: Vector3;
    readonly min: Vector3;
    readonly max: Vector3;
    intensity: number;
    enabled: boolean;
    boxProjection: boolean;
    constructor(options: ReflectionProbeOptions);
    validate(): void;
    contains(x: number, y: number, z: number): boolean;
}
/** Object-origin selection: closest containing capture position wins; equal distances keep Scene order. */
export declare function selectReflectionProbe(scene: Scene, object: Mesh): ReflectionProbe | undefined;
