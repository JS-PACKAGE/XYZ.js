import { Vector3 } from '../../math/src/index.js';
import { PointLight, SpotLight } from './lights.js';
import type { Scene } from './scene.js';
import type { Mesh } from './mesh.js';
export interface LightSelectionOptions {
    pointLights?: number;
    spotLights?: number;
    /** 'select' keeps highest priority/contribution; 'error' rejects a draw that exceeds its cap. */
    exceedPolicy?: 'select' | 'error';
}
export interface LightSelectionCount {
    pool: number;
    selected: number;
    /** Out of range/cone, black, or zero intensity. */
    culled: number;
    /** Relevant lights omitted by the per-draw cap (not spatially culled). */
    overflow: number;
}
export interface SelectedLights {
    readonly pointLights: readonly PointLight[];
    readonly spotLights: readonly SpotLight[];
}
export interface LightSelectionStats {
    draws: number;
    readonly points: LightSelectionCount;
    readonly spots: LightSelectionCount;
}
/** Reject unbounded pools and invalid mutable inputs before rendering. */
export declare function validateLightPool(scene: Scene): void;
/** One scene-pool validation per update; bounded, allocation-free selection for each draw. */
export declare class SpatialLightSelector implements SelectedLights {
    readonly pointLights: PointLight[];
    readonly spotLights: SpotLight[];
    readonly stats: LightSelectionStats;
    /** Aggregated per-draw work since update; pool is scene count, not a sum over draws. */
    readonly frameStats: LightSelectionStats;
    readonly pointCapacity: number;
    readonly spotCapacity: number;
    readonly exceedPolicy: 'select' | 'error';
    private scene;
    private readonly identities;
    private readonly pointScores;
    private readonly spotScores;
    private readonly sphere;
    private readonly center;
    constructor(options?: LightSelectionOptions);
    update(scene: Scene): void;
    /** Release scene/borrowed light references without destroying caller-owned lights. */
    clear(): void;
    selectMesh(mesh: Mesh): this;
    select(center: Vector3, radius: number): this;
    private selectType;
}
