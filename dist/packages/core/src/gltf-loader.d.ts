import type { LoadTask } from '../../assets/src/index.js';
import { AnimationClip } from './animation.js';
import { Group } from './group.js';
export interface GLTFAsset {
    readonly scene: Group;
    readonly animations: AnimationClip[];
    dispose(): void;
}
export interface GLTFLoadOptions {
    signal?: AbortSignal;
    /** Extra origins from which model-referenced buffers/images may be fetched; the model's own origin is always allowed. */
    allowedOrigins?: readonly string[];
}
/** Dependency-free glTF 2.0 triangle/TRS/skin loader. Required extensions are rejected. */
export declare class GLTFLoader {
    /** Task results are unique: abort disposes only this acquisition, never a shared asset. */
    task(key: string, uri: string): LoadTask<GLTFAsset>;
    load(uri: string, options?: GLTFLoadOptions): Promise<GLTFAsset>;
    parse(input: ArrayBuffer | string, baseURL?: string, options?: GLTFLoadOptions): Promise<GLTFAsset>;
    private normals;
    private applyMatrix;
}
