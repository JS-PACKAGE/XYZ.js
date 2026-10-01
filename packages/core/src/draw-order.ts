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

/** Reusable state so sorting does not allocate once the pool has grown. */
export class DrawSorter {
  private readonly pool: SortEntry[] = [];
  private readonly active: SortEntry[] = [];

  /**
   * Reorders `draws` in place: opaque meshes keep their relative order first, then
   * blended meshes follow farthest-to-nearest (distance from the camera to each
   * bounding-sphere center; equal distances keep insertion order).
   */
  sort(draws: Mesh[], camera: Vector3): void {
    const active = this.active;
    let kept = 0;
    for (let i = 0; i < draws.length; i++) {
      const mesh = draws[i];
      if (!isBlended(mesh)) {
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
    // Array#sort is stable, so equal distances keep scene insertion order.
    active.sort((a, b) => b.distance - a.distance);
    for (const entry of active) {
      draws[kept++] = entry.mesh!;
      entry.mesh = undefined;
    }
    active.length = 0;
  }
}
