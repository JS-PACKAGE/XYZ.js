import { Texture } from '../../assets/src/index.js';
import { Quaternion } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { Object3D } from './object3d.js';
export interface TextureMaterialOptions {
    texture: Texture;
    color?: [number, number, number];
    opacity?: number;
}
/** References a shared Texture; destroying a Mesh never destroys its material or texture. */
export declare class TextureMaterial {
    readonly texture: Texture;
    readonly color: [number, number, number];
    readonly opacity: number;
    constructor(options: TextureMaterialOptions);
}
export interface MeshOptions {
    geometry: Geometry;
    material: TextureMaterial;
    position?: [number, number, number];
    rotation?: Quaternion | [number, number, number];
    scale?: [number, number, number];
    visible?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
}
/** 3D scene facade; Geometry and TextureMaterial remain owned by their creators. */
export declare class Mesh extends Object3D {
    readonly geometry: Geometry;
    readonly material: TextureMaterial;
    castShadow: boolean;
    receiveShadow: boolean;
    constructor(options: MeshOptions);
}
