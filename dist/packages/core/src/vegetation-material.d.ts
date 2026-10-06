import { NativePBRMaterial } from './native-pbr-material.js';
import type { PBRMaterialOptions } from './pbr-material.js';
export interface VegetationMaterialOptions extends PBRMaterialOptions {
    /** Maximum mesh-local displacement, fixed for the material lifetime. */
    windAmplitude?: number;
    windFrequency?: number;
    windDirection?: readonly [number, number];
    /** Mesh-local height above the root at which full sway is reached. */
    bladeHeight?: number;
    rootHeight?: number;
    phaseScale?: number;
}
/** Native PBR sway shared by color and shadow passes. Roots stay fixed; maps remain borrowed. */
export declare class VegetationMaterial extends NativePBRMaterial {
    constructor(options: VegetationMaterialOptions);
    /** Advance using the application's simulation clock, never wall-clock time. */
    update(timeSeconds: number): void;
}
