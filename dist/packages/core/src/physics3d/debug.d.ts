import { Object3D } from '../object3d.js';
import type { TextureMaterial } from '../mesh.js';
import type { PhysicsWorld3D } from './world.js';
import type { PhysicsDebugSnapshot3D } from './debug-geometry.js';
export interface PhysicsDebugDrawOptions3D {
    colliderMaterial: TextureMaterial;
    contactMaterial?: TextureMaterial;
    jointMaterial?: TextureMaterial;
    width?: number;
}
/** Scene-addable native triangle ribbons. Shared materials/textures remain caller-owned.
 * Call refresh after physics. World-space snapshots require this debug root's identity transform. */
export declare class PhysicsDebugDraw3D extends Object3D {
    readonly world: PhysicsWorld3D;
    private readonly options;
    private readonly lines;
    private readonly kinds;
    constructor(world: PhysicsWorld3D, options: PhysicsDebugDrawOptions3D);
    refresh(snapshot?: PhysicsDebugSnapshot3D): void;
    destroy(): void;
}
