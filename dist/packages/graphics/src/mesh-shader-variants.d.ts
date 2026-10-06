import type { Mesh } from '../../core/src/mesh.js';
import type { Scene } from '../../core/src/scene.js';
import type { TextureMaterial } from '../../core/src/mesh.js';
/** Internal compile-time switches; uniforms and published material shapes stay unchanged. */
export interface MeshShaderFeatures {
    pbr: boolean;
    clearcoat: boolean;
    sheen: boolean;
    transmission: boolean;
    dispersion: boolean;
    anisotropy: boolean;
    iridescence: boolean;
    anisotropyMap: boolean;
    iridescenceMap: boolean;
    iridescenceThicknessMap: boolean;
    subsurface: boolean;
    height: boolean;
    weathering: boolean;
    detail: boolean;
    triplanar: boolean;
    lightmap: boolean;
    bakedIrradiance: boolean;
    bakedLightmap: boolean;
    skinned: boolean;
    instanced: boolean;
    morph: boolean;
    shadows: boolean;
    contactShadows: boolean;
    environment: boolean;
    native: boolean;
}
export declare function meshShaderFeatures(material: TextureMaterial, mesh?: Mesh, scene?: Scene): MeshShaderFeatures;
export declare function meshShaderVariantKey(features: MeshShaderFeatures): string;
/** Extract an authored, balanced shader block. This only composes engine-owned templates. */
export declare function omitShaderBlock(source: string, marker: string): string;
