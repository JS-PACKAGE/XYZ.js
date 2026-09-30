import { Transform2D, type Vector2 } from '../../math/src/index.js';
import { SceneObject } from './scene-object.js';
/** Public 2D facade; entities and component registration belong to Scene. */
export declare class GameObject extends SceneObject {
    readonly transform: Transform2D;
    get position(): Vector2;
    set position(value: Vector2);
    get rotation(): number;
    set rotation(value: number);
    get scale(): Vector2;
    set scale(value: Vector2);
}
