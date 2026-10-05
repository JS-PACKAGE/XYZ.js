import type { Scene } from '../../core/src/scene.js';
import {
  materialBaseTexture,
  type Mesh,
  type TextureMaterial,
} from '../../core/src/mesh.js';
import { PBRMaterial } from '../../core/src/pbr-material.js';
import {
  isNativeMaterial3D,
  nativeMaterialSources,
} from '../../core/src/native-material3d.js';
import { InstancedMesh } from '../../core/src/instanced-mesh.js';
import { SkinnedMesh } from '../../core/src/skinned-mesh.js';
import type { Geometry } from '../../core/src/geometry.js';
import type { ShadowAtlas } from '../../core/src/shadow-atlas.js';
import type { RenderVisibilityEntry } from '../../core/src/render-visibility.js';
import {
  SHADOW_FLOAT_COUNT,
  nativeMaterial3DLimits,
} from '../../../src/data/rendering.js';

interface CasterSnapshot {
  geometry: Geometry;
  material: TextureMaterial;
  values: Float64Array;
  seen: number;
}

/** Whole-atlas reuse; a changed caster or light invalidates every tile, never just color visibility. */
export class ShadowCache {
  private scene: Scene | undefined;
  private readonly atlasValues = new Float32Array(SHADOW_FLOAT_COUNT).fill(NaN);
  private readonly casters = new Map<Mesh, CasterSnapshot>();
  private revision = -1;
  private width = 0;
  private height = 0;
  private frame = 0;
  private valid = false;
  private readonly scalarValues = new Float64Array(20);

  invalidate(): void {
    this.valid = false;
  }

  needsRender(
    scene: Scene,
    atlas: ShadowAtlas,
    meshes: readonly Mesh[],
    entries: ReadonlyMap<Mesh, RenderVisibilityEntry>,
    width: number,
    height: number,
  ): boolean {
    let changed = !this.valid || !scene.shadows.cache;
    if (this.scene !== scene) {
      this.casters.clear();
      this.scene = scene;
      changed = true;
    }
    if (
      this.revision !== scene.shadows.revision ||
      this.width !== width ||
      this.height !== height
    )
      changed = true;
    this.revision = scene.shadows.revision;
    this.width = width;
    this.height = height;
    for (let i = 0; i < atlas.data.length; i++) {
      if (!Object.is(this.atlasValues[i], atlas.data[i])) changed = true;
      this.atlasValues[i] = atlas.data[i]!;
    }
    ++this.frame;
    for (const mesh of meshes) {
      const material = mesh.material,
        geometry = mesh.renderGeometry;
      let record = this.casters.get(mesh);
      if (!record) {
        record = {
          geometry,
          material,
          values: new Float64Array(
            37 +
              nativeMaterial3DLimits.uniformFloats +
              nativeMaterial3DLimits.textures,
          ).fill(NaN),
          seen: this.frame,
        };
        this.casters.set(mesh, record);
        changed = true;
      }
      if (record.geometry !== geometry || record.material !== material)
        changed = true;
      record.geometry = geometry;
      record.material = material;
      record.seen = this.frame;
      const values = record.values;
      for (let i = 0; i < 16; i++) {
        if (!Object.is(values[i], mesh.worldMatrix.elements[i])) changed = true;
        values[i] = mesh.worldMatrix.elements[i]!;
      }
      // Read mutable scalar state directly; do not rely on vector/object identity.
      const pbr = material instanceof PBRMaterial;
      const texture = materialBaseTexture(material);
      const base = pbr ? material.textureCoordinates.texture : undefined;
      const next = this.scalarValues;
      next[0] = geometry.version;
      next[1] = texture.version;
      next[2] = texture.destroyed ? 1 : 0;
      next[3] = material.opacity;
      next[4] = mesh instanceof InstancedMesh ? mesh.version : 0;
      next[5] = mesh instanceof SkinnedMesh ? mesh.paletteVersion : 0;
      next[6] = entries.get(mesh)?.fade ?? 1;
      next[7] = pbr ? material.alphaCutoff : 0;
      next[8] = pbr
        ? material.alphaMode === 'OPAQUE'
          ? 0
          : material.alphaMode === 'MASK'
            ? 1
            : 2
        : 2;
      next[9] = pbr && !material.doubleSided ? 0 : 1;
      next[10] = base?.texCoord ?? 0;
      next[11] = base?.transform[0] ?? 1;
      next[12] = base?.transform[1] ?? 0;
      next[13] = base?.transform[2] ?? 0;
      next[14] = base?.transform[3] ?? 1;
      next[15] = base?.transform[4] ?? 0;
      next[16] = material.color[0];
      next[17] = material.color[1];
      next[18] = material.color[2];
      next[19] = mesh instanceof InstancedMesh ? mesh.colorVersion : 0;
      for (let i = 0; i < next.length; i++) {
        if (!Object.is(values[16 + i], next[i])) changed = true;
        values[16 + i] = next[i]!;
      }
      // The remaining transform component and native uniforms/maps share the tail.
      const tail = 36;
      if (!Object.is(values[tail], base?.transform[5] ?? 0)) changed = true;
      values[tail] = base?.transform[5] ?? 0;
      if (isNativeMaterial3D(material)) {
        material.validate();
        if (material.shadowCache !== 'tracked') changed = true;
        for (let i = 0; i < material.uniforms.length; i++) {
          if (!Object.is(values[tail + 1 + i], material.uniforms[i]))
            changed = true;
          values[tail + 1 + i] = material.uniforms[i]!;
        }
        for (let i = 0; i < nativeMaterial3DLimits.textures; i++) {
          const version = nativeMaterialSources(material)[i]?.version ?? -1;
          const at = tail + 1 + nativeMaterial3DLimits.uniformFloats + i;
          if (!Object.is(values[at], version)) changed = true;
          values[at] = version;
        }
      }
    }
    for (const [mesh, record] of this.casters)
      if (record.seen !== this.frame) {
        this.casters.delete(mesh);
        changed = true;
      }
    // A failed encoding/submission must not publish a reusable atlas.
    this.valid = false;
    return changed;
  }

  commit(): void {
    this.valid = true;
  }
}
