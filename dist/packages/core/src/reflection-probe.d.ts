import { Vector3 } from '../../math/src/index.js';
import { EnvironmentMap } from './environment.js';
import type { Mesh } from './mesh.js';
export interface ReflectionProbeCaptureOptions {
    size?: number;
    near?: number;
    far?: number;
    includeBackground?: boolean;
    exclude?: readonly Mesh[];
    signal?: AbortSignal;
    /** Upper bound for temporary native color/depth/readback storage. */
    maxBytes?: number;
}
export interface ReflectionProbeOptions {
    environment: EnvironmentMap;
    position: Vector3 | [number, number, number];
    min: Vector3 | [number, number, number];
    max: Vector3 | [number, number, number];
    intensity?: number;
    enabled?: boolean;
    boxProjection?: boolean;
    blendDistance?: number;
    /** Automatically capture at most one due probe per renderer frame. */
    dynamic?: boolean;
    captureInterval?: number;
    captureSize?: number;
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
    blendDistance: number;
    dynamic: boolean;
    captureInterval: number;
    captureSize: number;
    private ownedCapture;
    constructor(options: ReflectionProbeOptions);
    validate(): void;
    contains(x: number, y: number, z: number): boolean;
    /** Adopt an automatic capture; only previously adopted maps are released. */
    adoptCapture(map: EnvironmentMap): void;
    /** Releases automatic captures, never the initially borrowed environment. */
    destroy(): void;
}
