import { Vector3 } from '../../../math/src/math3d.js';
/** Desired velocity, not force; caller owns output and integrates using seconds. */
export declare function steeringSeek(position: Readonly<Vector3>, target: Readonly<Vector3>, speed: number, out: Vector3): Vector3;
export declare function steeringFlee(position: Readonly<Vector3>, threat: Readonly<Vector3>, speed: number, out: Vector3): Vector3;
export declare function steeringArrive(position: Readonly<Vector3>, target: Readonly<Vector3>, speed: number, slowingRadius: number, out: Vector3): Vector3;
/** Deterministic XZ wander; independent state, no Math.random or frame-rate dependent jitter. */
export declare class SteeringWander3D {
    readonly turnRate: number;
    readonly interval: number;
    private state;
    private angle;
    constructor(seed?: number, turnRate?: number, interval?: number);
    private remaining;
    private angularVelocity;
    update(deltaSeconds: number, speed: number, out: Vector3): Vector3;
}
