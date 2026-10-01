import { Mesh, TextureMaterial, type MeshOptions } from './mesh.js';
export interface DecalOptions {
    target: Mesh;
    material: TextureMaterial;
    /** World-space projector center; local +Z points out of the receiver. */
    position: [number, number, number];
    rotation?: MeshOptions['rotation'];
    /** Projector width, height and depth in world units. */
    size: [number, number, number];
    /** World-space lift along interpolated receiver normals, baked at creation. */
    normalOffset?: number;
    cullBackfaces?: boolean;
    visible?: boolean;
    receiveShadow?: boolean;
}
/** Clips receiver triangles once and attaches the resulting mesh to that receiver. */
export declare class Decal extends Mesh {
    constructor(options: DecalOptions);
}
