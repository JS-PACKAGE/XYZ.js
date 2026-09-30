import { AnimationClip } from './animation.js';
import { Group } from './group.js';
export interface GLTFAsset {
    readonly scene: Group;
    readonly animations: AnimationClip[];
    dispose(): void;
}
export interface GLTFLoadOptions {
    signal?: AbortSignal;
}
/** Dependency-free glTF 2.0 triangle/TRS/skin loader. Required extensions are rejected. */
export declare class GLTFLoader {
    load(uri: string, options?: GLTFLoadOptions): Promise<GLTFAsset>;
    parse(input: ArrayBuffer | string, baseURL?: string, options?: GLTFLoadOptions): Promise<GLTFAsset>;
    private normals;
    private applyMatrix;
}
