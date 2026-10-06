import { Texture } from '../../assets/src/index.js';
import { AnimationClip } from './animation.js';
import type { GLTFMaterialVariant } from './gltf-variants.js';
import { Object3D } from './object3d.js';
import { type Camera3D } from './orthographic-camera.js';
import { Scene } from './scene.js';
type Entry = Record<string, unknown>;
export interface GLTFExportJSON {
    asset: {
        version: '2.0';
        generator: string;
    };
    scene: number;
    scenes: {
        nodes: number[];
    }[];
    nodes: Entry[];
    meshes: Entry[];
    materials: Entry[];
    textures: Entry[];
    images: Entry[];
    samplers: Entry[];
    skins: Entry[];
    cameras: Entry[];
    animations: Entry[];
    accessors: Entry[];
    bufferViews: Entry[];
    buffers: {
        byteLength: number;
        uri?: string;
    }[];
    extensionsUsed?: string[];
    extensionsRequired?: string[];
    extensions?: Entry;
}
export interface GLTFExportOptions {
    /** External binary filename in the JSON result. Default scene.bin. */
    bufferURI?: string;
    /** Embedded PNG is the default. URL mode requires textureURI for every image. */
    textures?: 'embedded' | 'external';
    textureURI?: (texture: Texture) => string;
    animations?: readonly AnimationClip[];
    variants?: readonly GLTFMaterialVariant[];
    /** Scene exports its camera by default; mesh-array exports require an explicit camera. */
    camera?: Camera3D;
    cameraAspect?: number;
}
export interface GLTFExportResult {
    json: GLTFExportJSON;
    /** One aligned binary buffer, including embedded PNG images. */
    buffers: ArrayBuffer[];
}
export type GLTFExportInput = Scene | Object3D | readonly Object3D[];
/** Export a snapshot, without deforming geometry or changing animation/variant state. */
export declare function exportGLTF(input: GLTFExportInput, options?: GLTFExportOptions): Promise<GLTFExportResult>;
/** GLB 2.0 with padded JSON/BIN chunks. External image URLs remain external. */
export declare function exportGLB(input: GLTFExportInput, options?: GLTFExportOptions): Promise<ArrayBuffer>;
export {};
