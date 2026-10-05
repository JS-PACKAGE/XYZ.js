import { Texture } from '../../assets/src/index.js';
import { PBRMaterial, type PBRMaterialOptions } from './pbr-material.js';
export type ProceduralMaterialKind = 'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble' | 'concrete' | 'tiles' | 'leather' | 'sand' | 'rust' | 'snow';
export interface ProceduralMaterialOptions {
    size?: number;
    seed?: number;
    /** 1 keeps the authored contrast. Finite and at least 0. */
    contrast?: number;
    /** Added to authored roughness, then clamped. Default 0. */
    roughnessBias?: number;
    /** UV repeats of the generated tile. Default 1. */
    repeats?: number;
}
/** UV repeats so one mesh of `meters` uses the preset's physical tile size. */
export declare function proceduralRepeats(kind: ProceduralMaterialKind, meters: number): number;
interface ProceduralTextures {
    readonly baseColor: Texture;
    readonly normal: Texture;
    readonly metallicRoughness: Texture;
    readonly occlusion: Texture;
}
/** Owns four generated maps. Materials, meshes and scenes only borrow them. */
export declare class ProceduralMaterial {
    readonly repeats: number;
    readonly kind: ProceduralMaterialKind;
    readonly textures: Readonly<ProceduralTextures>;
    readonly material: PBRMaterial;
    private disposed;
    private constructor();
    static create(kind: ProceduralMaterialKind, options?: ProceduralMaterialOptions): Promise<ProceduralMaterial>;
    /** Creates an independent material borrowing these maps; overrides never transfer ownership. */
    createMaterial(options?: Partial<PBRMaterialOptions>): PBRMaterial;
    get destroyed(): boolean;
    /** Remove every consumer before releasing this preset's maps. Does not destroy materials. */
    destroy(): void;
}
export {};
