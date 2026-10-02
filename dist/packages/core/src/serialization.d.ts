import type { Scene } from './scene.js';
import { GameObject } from './game-object.js';
import { Object3D } from './object3d.js';
import type { SceneObject } from './scene-object.js';
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
    register(id: string, object: SceneObject, state?: Serializable): () => void;
    capture(): SceneSnapshot;
    /** Live, sequential restoration: custom async adapters can partially mutate before failure.
     * Use rebuildContentScene/ContentLoadCoordinator for isolated candidate publication instead. */
    restore(snapshot: SceneSnapshot, policy?: UnknownSnapshotPolicy): Promise<SnapshotRestoreReport>;
}
/** Built-in adapters are explicit; other SceneObjects require caller-authored state. */
export declare function sceneObjectState(object: SceneObject, custom?: Serializable): Serializable;
/** Local TRS/visibility and existing rigid-body state; assets and colliders stay factory-authored. */
export declare function object3DState(object: Object3D, custom?: Serializable): Serializable;
/** Local transform, visibility, opacity, Text2D content and existing body velocity. Custom state is explicit. */
export declare function gameObjectState(object: GameObject, custom?: Serializable): Serializable;
