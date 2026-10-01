import { Transform2D, Transform3D, type Matrix3, type Matrix4 } from '../../math/src/index.js';
export declare class PhysicsPresentation2D {
    private readonly previous;
    private readonly current;
    private readonly display;
    private sealed;
    capture(transform: Transform2D): void;
    seal(transform: Transform2D): void;
    matrix(transform: Transform2D, alpha: number): Matrix3;
}
export declare class PhysicsPresentation3D {
    private readonly previous;
    private readonly current;
    private readonly display;
    private sealed;
    private copy;
    capture(transform: Transform3D): void;
    seal(transform: Transform3D): void;
    matrix(transform: Transform3D, alpha: number): Matrix4;
}
