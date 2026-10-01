import type { Scene } from './scene.js';
import type { GameObject } from './game-object.js';
import { type JsonValue } from './storage.js';
export interface Serializable {
    serialize(): JsonValue;
    restore(data: JsonValue): void | Promise<void>;
}
export type SceneSnapshot = {
    version: 1;
    objects: {
        [id: string]: JsonValue;
    };
};
export declare function isSceneSnapshot(value: JsonValue): value is SceneSnapshot;
export interface SnapshotRestoreReport {
    restored: string[];
    unknown: string[];
    missing: string[];
}
export type UnknownSnapshotPolicy = 'ignore' | 'error';
/** Explicit stable-id registry. Never creates objects, components, assets or scenes. */
export declare class Serializer {
    private readonly scene;
    private readonly entries;
    constructor(scene: Scene);
    register(id: string, object: GameObject, state?: Serializable): () => void;
    capture(): SceneSnapshot;
    restore(snapshot: SceneSnapshot, policy?: UnknownSnapshotPolicy): Promise<SnapshotRestoreReport>;
}
/** Local transform, visibility, opacity, Text2D content and existing body velocity. Custom state is explicit. */
export declare function gameObjectState(object: GameObject, custom?: Serializable): Serializable;
