import { Texture } from '../../assets/src/index.js';
import { PBRMaterial, type PBRMaterialOptions } from './pbr-material.js';
export type ProceduralMaterialKind = 'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble';
export interface ProceduralMaterialOptions {
    size?: number;
    seed?: number;
}
interface ProceduralTextures {
    readonly baseColor: Texture;
    readonly normal: Texture;
    readonly metallicRoughness: Texture;
    readonly occlusion: Texture;
}
/** Owns four generated maps. Materials, meshes and scenes only borrow them. */
export declare class ProceduralMaterial {
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
