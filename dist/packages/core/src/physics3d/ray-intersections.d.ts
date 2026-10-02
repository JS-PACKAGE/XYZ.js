import type { Vector3 } from '../../../math/src/index.js';
import { Shape3D, type Triangle3D } from './collider.js';
type Emit = (distance: number, nx: number, ny: number, nz: number) => void;
/** Analytic boundary intersections, not conservative-advancement contacts. Direction is unit length. */
export declare function rayIntersections3D(shape: Shape3D, origin: Readonly<Vector3>, direction: Readonly<Vector3>, maxDistance: number, emit: Emit, triangle?: Triangle3D): void;
export {};
