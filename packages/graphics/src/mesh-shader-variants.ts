import { PBRMaterial } from '../../core/src/pbr-material.js';
import { isNativeMaterial3D } from '../../core/src/native-material3d.js';
import type { Mesh } from '../../core/src/mesh.js';
import type { Scene } from '../../core/src/scene.js';
import type { TextureMaterial } from '../../core/src/mesh.js';
import { SkinnedMesh } from '../../core/src/skinned-mesh.js';

/** Internal compile-time switches; uniforms and published material shapes stay unchanged. */
export interface MeshShaderFeatures {
  pbr: boolean;
  clearcoat: boolean;
  sheen: boolean;
  transmission: boolean;
  dispersion: boolean;
  anisotropy: boolean;
  iridescence: boolean;
  subsurface: boolean;
  height: boolean;
  weathering: boolean;
  detail: boolean;
  triplanar: boolean;
  lightmap: boolean;
  skinned: boolean;
  instanced: boolean;
  morph: boolean;
  shadows: boolean;
  environment: boolean;
  native: boolean;
}

export function meshShaderFeatures(
  material: TextureMaterial,
  mesh?: Mesh,
  scene?: Scene,
): MeshShaderFeatures {
  const pbr = material instanceof PBRMaterial ? material : undefined;
  const finish = pbr?.finish;
  return {
    pbr: !!pbr,
    clearcoat: (pbr?.clearcoat ?? 0) > 0,
    sheen: !!pbr?.sheenColor.some((value) => value > 0),
    transmission: (pbr?.transmission ?? 0) > 0,
    dispersion: (finish?.dispersion ?? 0) > 0,
    anisotropy: (finish?.anisotropy ?? 0) > 0,
    iridescence: (finish?.iridescence ?? 0) > 0,
    subsurface: (finish?.subsurface ?? 0) > 0,
    height: (finish?.heightScale ?? 0) > 0,
    weathering:
      !!finish &&
      finish.wetness + finish.snow + finish.dirt + finish.damage > 0,
    detail: (finish?.detailStrength ?? 0) > 0,
    triplanar: (finish?.triplanar ?? 0) > 0,
    lightmap: !!pbr?.lightmap,
    skinned: mesh instanceof SkinnedMesh,
    instanced: !!mesh && 'count' in mesh,
    morph: !!mesh?.morph,
    shadows: scene ? scene.shadows.enabled : true,
    environment: scene
      ? !!scene.environment || scene.reflectionProbes.length > 0
      : true,
    native: isNativeMaterial3D(material),
  };
}

const featureOrder: readonly (keyof MeshShaderFeatures)[] = [
  'pbr',
  'clearcoat',
  'sheen',
  'transmission',
  'dispersion',
  'anisotropy',
  'iridescence',
  'subsurface',
  'height',
  'weathering',
  'detail',
  'triplanar',
  'lightmap',
  'skinned',
  'instanced',
  'morph',
  'shadows',
  'environment',
  'native',
];

export function meshShaderVariantKey(features: MeshShaderFeatures): string {
  let bits = 0;
  for (let i = 0; i < featureOrder.length; i++) {
    if (features[featureOrder[i]!]) bits |= 1 << i;
  }
  return bits.toString(36);
}

/** Extract an authored, balanced shader block. This only composes engine-owned templates. */
export function omitShaderBlock(source: string, marker: string): string {
  let start = source.indexOf(marker);
  while (start !== -1) {
    const open = source.indexOf('{', start + marker.length);
    const semicolon = source.indexOf(';', start + marker.length);
    if (semicolon !== -1 && (open === -1 || semicolon < open)) {
      source = source.slice(0, start) + source.slice(semicolon + 1);
    } else {
      if (open === -1) throw new Error(`Missing shader block: ${marker}`);
      let depth = 1;
      let end = open + 1;
      while (depth && end < source.length) {
        if (source[end] === '{') depth++;
        if (source[end] === '}') depth--;
        end++;
      }
      if (depth) throw new Error(`Unbalanced shader block: ${marker}`);
      source = source.slice(0, start) + source.slice(end);
    }
    start = source.indexOf(marker);
  }
  return source;
}
