import {
  Matrix4,
  Transform3D,
  type Quaternion,
  type Vector3,
} from '../../math/src/index.js';
import { SceneObject } from './scene-object.js';
import { RigidBody3D } from './physics3d/body.js';
import { Collider3D, Shape3D } from './physics3d/collider.js';
import { PhysicsPresentation3D } from './physics-presentation.js';

/** A local transform and its scene-owned descendant hierarchy. */
export class Object3D extends SceneObject {
  readonly transform = new Transform3D();
  readonly worldMatrix = new Matrix4();
  visible = true;
  private ancestor: Object3D | undefined;
  private readonly descendants = new Set<Object3D>();
  private rigidBody: RigidBody3D | undefined;
  private collisionShape: Collider3D | undefined;
  private physicsPresentation: PhysicsPresentation3D | undefined;

  get body(): RigidBody3D | undefined {
    return this.rigidBody;
  }
  set body(value: RigidBody3D | undefined) {
    if (value === this.rigidBody) return;
    if (this.destroyed)
      throw new Error('Cannot change a destroyed Object3D body.');
    if (value && !(value instanceof RigidBody3D))
      throw new TypeError('Invalid RigidBody3D.');
    const previous = this.rigidBody;
    value?.attach(this);
    this.rigidBody = value;
    try {
      this.validatePhysics();
      this.scene?.physics3D.register(this);
    } catch (error) {
      if (this.rigidBody === value) this.rigidBody = previous;
      value?.detach(this);
      throw error;
    }
    if (this.rigidBody !== previous) {
      previous?.detach(this);
      this.physicsPresentation = undefined;
    }
  }
  get collider(): Collider3D | undefined {
    return this.collisionShape;
  }
  set collider(value: Collider3D | undefined) {
    if (value === this.collisionShape) return;
    if (this.destroyed)
      throw new Error('Cannot change a destroyed Object3D collider.');
    if (value && !(value instanceof Collider3D))
      throw new TypeError('Invalid Collider3D.');
    const previous = this.collisionShape;
    this.collisionShape = value;
    try {
      this.validatePhysics();
      this.scene?.physics3D.register(this);
    } catch (error) {
      if (this.collisionShape === value) this.collisionShape = previous;
      throw error;
    }
  }
  /** @internal Attachment validation also applies before Scene ownership begins. */
  validatePhysics(): void {
    const body = this.body,
      collider = this.collider;
    if (body && body.type !== 'static') {
      if (this.parent)
        throw new Error('Dynamic/kinematic bodies require root Object3D.');
      if (collider?.kind === 'plane' || collider?.kind === 'mesh')
        throw new Error('Plane and triangle mesh colliders are static only.');
      if (
        collider &&
        (collider.offset.x !== 0 ||
          collider.offset.y !== 0 ||
          collider.offset.z !== 0)
      )
        throw new Error('Moving collider offsets are unsupported.');
    }
    if (collider) {
      const shape = new Shape3D(collider);
      shape.refresh(this);
      if (body) shape.validateMoving(body.type);
    }
  }

  get position(): Vector3 {
    return this.transform.position;
  }

  get rotation(): Quaternion {
    return this.transform.rotation;
  }

  get scale(): Vector3 {
    return this.transform.scale;
  }

  get parent(): Object3D | undefined {
    return this.ancestor;
  }

  get children(): ReadonlySet<Object3D> {
    return this.descendants;
  }

  get worldVisible(): boolean {
    if (!this.visible || this.destroyed) return false;
    for (let object = this.parent; object; object = object.parent) {
      if (!object.visible || object.destroyed) return false;
    }
    return true;
  }

  add<T extends Object3D>(child: T): T {
    if (this.destroyed || child.destroyed)
      throw new Error('Cannot parent a destroyed Object3D.');
    if ((child as Object3D) === this)
      throw new Error('Object3D hierarchy cannot contain cycles.');
    for (let ancestor = this.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor === child)
        throw new Error('Object3D hierarchy cannot contain cycles.');
    }
    if (child.scene && child.scene !== this.scene)
      throw new Error('Cannot reparent an Object3D across scenes.');
    if (child.parent === this) return child;
    if (child.body && child.body.type !== 'static')
      throw new Error('Dynamic/kinematic bodies require root Object3D.');
    // Validate the proposed world transform before registration or unlinking the old parent.
    const previousParent = child.ancestor;
    child.ancestor = this;
    try {
      const pending = [child as Object3D];
      for (let i = 0; i < pending.length; i++) {
        pending[i].validatePhysics();
        for (const descendant of pending[i].children) pending.push(descendant);
      }
    } finally {
      child.ancestor = previousParent;
    }
    if (this.scene && child.scene !== this.scene) {
      this.scene.addChild(child, this);
      return child;
    }
    child.detachParent();
    child.ancestor = this;
    this.descendants.add(child);
    return child;
  }

  remove(child: Object3D): boolean {
    if (child.parent !== this) return false;
    if (this.scene) this.scene.remove(child);
    else child.detachParent();
    return true;
  }

  /** @internal Unlinks the hierarchy without changing scene registrations. */
  detachParent(): void {
    this.ancestor?.descendants.delete(this);
    this.ancestor = undefined;
  }

  /** @internal Publishes a proposed hierarchy and returns an exact registration rollback. */
  setParentForRegistration(nextParent: Object3D | undefined): () => void {
    const parent = this.ancestor;
    const siblings = parent ? [...parent.descendants] : undefined;
    this.detachParent();
    this.ancestor = nextParent;
    nextParent?.descendants.add(this);
    return () => {
      this.detachParent();
      this.ancestor = parent;
      if (parent && siblings) {
        parent.descendants.clear();
        for (const sibling of siblings) parent.descendants.add(sibling);
      }
    };
  }

  /** @internal The simulation pose is never temporarily replaced for presentation. */
  capturePhysicsPose(): void {
    if (!this.scene?.interpolatePhysics) return;
    (this.physicsPresentation ??= new PhysicsPresentation3D()).capture(
      this.transform,
    );
  }
  /** @internal */
  sealPhysicsPose(): void {
    this.physicsPresentation?.seal(this.transform);
  }
  /** Recompose mutable local transforms, including every ancestor, without allocations. */
  updateWorldMatrix(): Matrix4 {
    const parentMatrix = this.parent?.updateWorldMatrix();
    const scene = this.scene;
    let localMatrix: Matrix4;
    if (
      scene?.presentingPhysics &&
      this.body &&
      this.body.type !== 'static' &&
      !this.body.isSleeping &&
      this.physicsPresentation
    ) {
      const alpha = Math.min(
        1,
        scene.physics3D.interpolationAlpha +
          (scene.fixedInterpolationAlpha * scene.fixedDelta) /
            scene.physics3D.fixedDelta,
      );
      localMatrix = this.physicsPresentation.matrix(this.transform, alpha);
    } else localMatrix = this.transform.updateMatrix();
    if (parentMatrix) this.worldMatrix.copy(parentMatrix).multiply(localMatrix);
    else this.worldMatrix.copy(localMatrix);
    return this.worldMatrix;
  }

  override destroy(): void {
    if (this.destroyed) return;
    const children = [...this.descendants];
    const errors: unknown[] = [];
    this.rigidBody?.detach(this);
    this.rigidBody = undefined;
    this.collisionShape = undefined;
    this.detachParent();
    try {
      super.destroy();
    } catch (error) {
      errors.push(error);
    }
    for (const child of children) {
      if (child.destroyed) continue;
      try {
        child.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Object3D cleanup failed.');
  }
}
