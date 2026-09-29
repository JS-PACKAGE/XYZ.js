import { Transform2D, type Vector2 } from '../../math/src/index.js';
import { SceneObject } from './scene-object.js';

/** Public 2D facade; entities and component registration belong to Scene. */
export class GameObject extends SceneObject {
  readonly transform = new Transform2D();

  get position(): Vector2 {
    return this.transform.position;
  }

  set position(value: Vector2) {
    this.transform.position.copy(value);
  }

  get rotation(): number {
    return this.transform.rotation;
  }

  set rotation(value: number) {
    this.transform.rotation = value;
  }

  get scale(): Vector2 {
    return this.transform.scale;
  }

  set scale(value: Vector2) {
    this.transform.scale.copy(value);
  }
}
