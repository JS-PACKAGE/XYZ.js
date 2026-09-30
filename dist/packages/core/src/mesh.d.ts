import { Texture } from '../../assets/src/index.js';
import { Quaternion, Transform3D, type Vector3 } from '../../math/src/index.js';
import { Geometry } from './geometry.js';
import { SceneObject } from './scene-object.js';
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
}
/** 3D scene facade; Geometry and TextureMaterial remain owned by their creators. */
export declare class Mesh extends SceneObject {
    readonly transform: Transform3D;
    readonly geometry: Geometry;
    readonly material: TextureMaterial;
    visible: boolean;
    constructor(options: MeshOptions);
    get position(): Vector3;
    get rotation(): Quaternion;
    get scale(): Vector3;
}
