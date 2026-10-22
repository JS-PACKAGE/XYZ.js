import { PBRMaterial } from './pbr-material.js';
import type { Mesh } from './mesh.js';
import type { Vector3 } from '../../math/src/index.js';

interface SortEntry {
  mesh: Mesh | undefined;
  distance: number;
}

/** PBR alphaMode is authoritative; legacy textures opt in for image/vertex alpha. */
export function isBlended(mesh: Mesh): boolean {
  const material = mesh.material;
  return material instanceof PBRMaterial
    ? material.alphaMode === 'BLEND'
    : material.transparent;
}

/** Below this many blended draws, Array#sort is as fast as the radix sort. */
const RADIX_MINIMUM = 128;

/** Reusable state so sorting does not allocate once the pool has grown. */
export class DrawSorter {
  private readonly pool: SortEntry[] = [];
  private readonly active: SortEntry[] = [];
  /** Radix scratch: one 64-bit key per blended draw, viewed as words and bytes, and orders. */
  private keys = new Float64Array(0);
  private words = new Uint32Array(0);
  private bytes = new Uint8Array(0);
  private orderA = new Uint32Array(0);
  private orderB = new Uint32Array(0);
  private readonly counts = new Uint32Array(8 * 256);

  /**
   * Reorders `draws` in place: opaque meshes keep their relative order first, then
   * blended meshes follow farthest-to-nearest (distance from the camera to each
   * bounding-sphere center; equal distances keep insertion order).
   */
  sort(
    draws: Mesh[],
    camera: Vector3,
    blended: (mesh: Mesh) => boolean = isBlended,
  ): void {
    const active = this.active;
    let kept = 0;
    for (let i = 0; i < draws.length; i++) {
      const mesh = draws[i];
      if (!blended(mesh)) {
        draws[kept++] = mesh;
        continue;
      }
      const entry = (this.pool[active.length] ??= {
        mesh: undefined,
        distance: 0,
      });
      entry.mesh = mesh;
      entry.distance = mesh.distanceSquaredTo(camera.x, camera.y, camera.z);
      active.push(entry);
    }
    if (active.length === 0) return;
    const order =
      active.length >= RADIX_MINIMUM ? this.radixOrder(active) : undefined;
    if (order) {
      for (let i = 0; i < active.length; i++) {
        const entry = active[order[i]!]!;
        draws[kept++] = entry.mesh!;
        entry.mesh = undefined;
      }
      active.length = 0;
      return;
    }
    // Array#sort is stable, so equal distances keep scene insertion order. The
    // comparator returns small integers: a returned double difference is boxed
    // on every comparison. NaN still compares equal, as the difference did.
    active.sort(compareFarthestFirst);
    for (const entry of active) {
      draws[kept++] = entry.mesh!;
      entry.mesh = undefined;
    }
    active.length = 0;
  }

  /**
   * The stable farthest-first order of `active` as indices, by a byte-wise LSD radix sort of
   * the distances' IEEE bits (little-endian views, as every browser uses). Without NaN the
   * comparator is a strict weak order (only equal distances, including -0 and +0, tie), so
   * this is exactly Array#sort's stable result. NaN compares equal to everything, an
   * inconsistent order, so it returns undefined.
   */
  private radixOrder(active: readonly SortEntry[]): Uint32Array | undefined {
    const count = active.length;
    if (this.keys.length < count) {
      const capacity = Math.max(count, this.keys.length * 2);
      this.keys = new Float64Array(capacity);
      this.words = new Uint32Array(this.keys.buffer);
      this.bytes = new Uint8Array(this.keys.buffer);
      this.orderA = new Uint32Array(capacity);
      this.orderB = new Uint32Array(capacity);
    }
    const keys = this.keys,
      words = this.words,
      bytes = this.bytes,
      counts = this.counts;
    counts.fill(0);
    for (let i = 0; i < count; i++) {
      const distance = active[i]!.distance;
      if (distance !== distance) return undefined;
      keys[i] = distance === 0 ? 0 : distance;
      // Descending order as ascending unsigned keys: nonnegatives (sign 0) come first with
      // their magnitude bits inverted, then negatives, whose raw bits already ascend.
      if (!(words[i * 2 + 1]! >>> 31)) {
        words[i * 2 + 1] ^= 0x7fffffff;
        words[i * 2] = ~words[i * 2]!;
      }
      for (let b = 0; b < 8; b++) counts[b * 256 + bytes[i * 8 + b]!]!++;
    }
    let source = this.orderA,
      target = this.orderB;
    for (let i = 0; i < count; i++) source[i] = i;
    for (let b = 0; b < 8; b++) {
      const base = b * 256;
      // A pass where every key has the same byte leaves the order unchanged.
      if (counts[base + bytes[b]!] === count) continue;
      for (let digit = 0, start = 0; digit < 256; digit++) {
        const size = counts[base + digit]!;
        counts[base + digit] = start;
        start += size;
      }
      for (let i = 0; i < count; i++) {
        const index = source[i]!;
        target[counts[base + bytes[index * 8 + b]!]!++] = index;
      }
      const swap = source;
      source = target;
      target = swap;
    }
    return source;
  }
}

function compareFarthestFirst(a: SortEntry, b: SortEntry): number {
  return b.distance > a.distance ? 1 : b.distance < a.distance ? -1 : 0;
}
