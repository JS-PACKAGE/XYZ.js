import type { Mesh } from './mesh.js';
import type { Vector3 } from '../../math/src/index.js';
/** PBR alphaMode is authoritative; legacy textures opt in for image/vertex alpha. */
export declare function isBlended(mesh: Mesh): boolean;
/** Reusable state so sorting does not allocate once the pool has grown. */
export declare class DrawSorter {
    private readonly pool;
    private readonly active;
    /** Radix scratch: one 64-bit key per blended draw, viewed as words and bytes, and orders. */
    private keys;
    private words;
    private bytes;
    private orderA;
    private orderB;
    private readonly counts;
    /**
     * Reorders `draws` in place: opaque meshes keep their relative order first, then
     * blended meshes follow farthest-to-nearest (distance from the camera to each
     * bounding-sphere center; equal distances keep insertion order).
     */
    sort(draws: Mesh[], camera: Vector3, blended?: (mesh: Mesh) => boolean): void;
    /**
     * The stable farthest-first order of `active` as indices, by a byte-wise LSD radix sort of
     * the distances' IEEE bits (little-endian views, as every browser uses). Without NaN the
     * comparator is a strict weak order (only equal distances, including -0 and +0, tie), so
     * this is exactly Array#sort's stable result. NaN compares equal to everything, an
     * inconsistent order, so it returns undefined.
     */
    private radixOrder;
}
