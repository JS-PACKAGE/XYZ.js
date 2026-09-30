import {
  Matrix4,
  Transform3D,
  type Quaternion,
  type Vector3,
} from '../../math/src/index.js';
import { SceneObject } from './scene-object.js';

/** A local transform and its scene-owned descendant hierarchy. */
export class Object3D extends SceneObject {
  readonly transform = new Transform3D();
  readonly worldMatrix = new Matrix4();
  visible = true;
  private ancestor: Object3D | undefined;
  private readonly descendants = new Set<Object3D>();

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
    // Registration preflights the entire subtree before the previous parent changes.
    if (this.scene && child.scene !== this.scene) this.scene.add(child);
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

  /** Recompose mutable local transforms, including every ancestor, without allocations. */
  updateWorldMatrix(): Matrix4 {
    const parentMatrix = this.parent?.updateWorldMatrix();
    const localMatrix = this.transform.updateMatrix();
    if (parentMatrix) this.worldMatrix.copy(parentMatrix).multiply(localMatrix);
    else this.worldMatrix.copy(localMatrix);
    return this.worldMatrix;
  }

  override destroy(): void {
    if (this.destroyed) return;
    const children = [...this.descendants];
    const errors: unknown[] = [];
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
