import { GameObject } from '../game-object.js';
type Point = readonly [number, number];
/** Cap on input size; decomposition is O(n²) per merge pass. */
export declare const maxConcaveVertices = 256;
/**
 * Splits a simple polygon (either winding, collinear vertices allowed) into strictly convex,
 * counterclockwise pieces with at most 32 vertices: ear clipping, then Hertel–Mehlhorn merging
 * of neighbours while they stay convex. Result pieces are not minimal.
 */
export declare function decomposeConvex(vertices: readonly Point[]): [number, number][][];
export interface StaticShapeOptions {
    friction?: number;
    restitution?: number;
    category?: number;
    mask?: number;
}
/**
 * A static, possibly concave polygon: a parent whose children are the convex pieces from
 * {@link decomposeConvex}. Move or scale the parent; dynamic concave bodies are not supported.
 */
export declare class StaticConcave2D extends GameObject {
    readonly pieces: readonly GameObject[];
    constructor(vertices: readonly Point[], options?: StaticShapeOptions);
}
export interface StaticChainOptions extends StaticShapeOptions {
    /** Join the last point back to the first. Default false. */
    closed?: boolean;
    /** Collision thickness of every segment; default 2 world units. */
    thickness?: number;
}
/**
 * Static line strip collision made of thin convex quads, one per segment, each extended by half
 * the thickness at both ends so corners overlap without gaps. The segments are solid, not
 * zero-width edges: bodies thinner than `thickness`, or faster than it per step, can still tunnel
 * unless they use `ccd`.
 */
export declare class StaticChain2D extends GameObject {
    readonly segments: readonly GameObject[];
    constructor(points: readonly Point[], options?: StaticChainOptions);
}
export {};
