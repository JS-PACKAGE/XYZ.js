import type { Mesh, TextureMaterial } from './mesh.js';

export interface GLTFMaterialVariant {
  readonly name: string;
  /** Meshes whose material is switched by this variant, with the mapped material. */
  readonly mappings: readonly {
    readonly mesh: Mesh;
    readonly material: TextureMaterial;
  }[];
}

/** KHR_materials_variants state of one loaded glTF asset. */
export interface GLTFVariantSupport {
  /** Variant names in document order; empty when the model declares none. */
  readonly variants: readonly GLTFMaterialVariant[];
  /**
   * Assigns one variant's mapped materials; `undefined` restores the defaults.
   * Unmapped meshes keep their default material. Materials stay owned by the asset.
   */
  selectVariant(name: string | undefined): void;
}

const registry = new WeakMap<object, GLTFVariantSupport>();

/** Loader-internal: bind variant state to the asset object it returns. */
export function registerGLTFVariants(
  asset: object,
  support: GLTFVariantSupport,
): void {
  registry.set(asset, support);
}

/** Variant state of an asset returned by GLTFLoader; throws for foreign objects. */
export function gltfVariants(asset: object): GLTFVariantSupport {
  const support = registry.get(asset);
  if (!support)
    throw new TypeError('Object is not an asset returned by GLTFLoader.');
  return support;
}
