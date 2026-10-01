import { Matrix4, Transform3D, type Quaternion, type Vector3 } from '../../math/src/index.js';
import { SceneObject } from './scene-object.js';
import { RigidBody3D } from './physics3d/body.js';
import { Collider3D } from './physics3d/collider.js';
/** A local transform and its scene-owned descendant hierarchy. */
export declare class Object3D extends SceneObject {
    readonly transform: Transform3D;
    readonly worldMatrix: Matrix4;
    visible: boolean;
    private ancestor;
    private readonly descendants;
    private rigidBody;
    private collisionShape;
    private physicsPresentation;
    get body(): RigidBody3D | undefined;
    set body(value: RigidBody3D | undefined);
    get collider(): Collider3D | undefined;
    set collider(value: Collider3D | undefined);
    /** @internal Attachment validation also applies before Scene ownership begins. */
    validatePhysics(): void;
    get position(): Vector3;
    get rotation(): Quaternion;
    get scale(): Vector3;
    get parent(): Object3D | undefined;
    get children(): ReadonlySet<Object3D>;
    get worldVisible(): boolean;
    add<T extends Object3D>(child: T): T;
    remove(child: Object3D): boolean;
    /** @internal Unlinks the hierarchy without changing scene registrations. */
    detachParent(): void;
    /** @internal Publishes a proposed hierarchy and returns an exact registration rollback. */
    setParentForRegistration(nextParent: Object3D | undefined): () => void;
    /** @internal The simulation pose is never temporarily replaced for presentation. */
    capturePhysicsPose(): void;
    /** @internal */
    sealPhysicsPose(): void;
    /** Recompose mutable local transforms, including every ancestor, without allocations. */
    updateWorldMatrix(): Matrix4;
    destroy(): void;
}
