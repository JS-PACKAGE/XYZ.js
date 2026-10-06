import { PlanarReflectionCamera, type PlanarReflection } from '../../core/src/planar-reflection.js';
import type { Scene } from '../../core/src/scene.js';
/** Encode synchronously: temporary camera/visibility state never survives an await. Backends own readback. */
export declare function encodePlanarReflection(scene: Scene, reflection: PlanarReflection, encode: (camera: PlanarReflectionCamera) => void): void;
