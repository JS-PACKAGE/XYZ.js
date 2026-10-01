import { Vector3 } from '../../../math/src/index.js';
import { Shape3D, Triangle3D } from './collider.js';
/** @internal Signed separation and B-to-A normal. Reused for solver and conservative advancement. */
export declare class Manifold3D {
    readonly normal: Vector3;
    readonly points: Vector3[];
    readonly normals: Vector3[];
    readonly depths: Float64Array<ArrayBuffer>;
    count: number;
    distance: number;
    add(point: Readonly<Vector3>, depth: number, normal?: Readonly<Vector3>): void;
    flip(): void;
}
/** @internal No mutable global scratch: each world/query owns a narrowphase context. */
export declare class Narrowphase3D {
    private readonly p;
    private readonly q;
    private readonly axis;
    private readonly local;
    private readonly delta;
    private readonly half;
    private readonly breaks;
    private readonly polygonA;
    private readonly polygonB;
    private readonly edgeA0;
    private readonly edgeA1;
    private readonly edgeB0;
    private readonly edgeB1;
    private readonly triangleCandidates;
    private readonly triangleManifold;
    private readonly childManifold;
    private readonly closest;
    private readonly bestP;
    private readonly bestQ;
    private readonly triangleEdge;
    private pointTriangle;
    private roundTriangle;
    private boxTriangle;
    private mesh;
    /** @internal Exact round-triangle distance or conservative OBB-triangle SAT separation. */
    triangle(shape: Shape3D, triangle: Triangle3D, out: Manifold3D): void;
    /** Exact closest points between two finite line segments, including point segments. */
    segment(a: Readonly<Vector3>, b: Readonly<Vector3>, c: Readonly<Vector3>, d: Readonly<Vector3>, p: Vector3, q: Vector3): void;
    /** Segment-to-OBB closest pair via exact piecewise quadratic minimization, not an AABB proxy. */
    private segmentBox;
    private roundRound;
    private plane;
    private radius;
    private face;
    private supportEdge;
    private boxes;
    collide(a: Shape3D, b: Shape3D, out: Manifold3D): void;
}
