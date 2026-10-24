import { PBRMaterial } from '../../core/src/pbr-material.js';
import { isNativeMaterial3D } from '../../core/src/native-material3d.js';
import type { Mesh } from '../../core/src/mesh.js';
import type { Scene } from '../../core/src/scene.js';
import type { TextureMaterial } from '../../core/src/mesh.js';
import { SkinnedMesh } from '../../core/src/skinned-mesh.js';
import {
  meshIrradianceVolume,
  isBakedLightmap,
} from '../../core/src/baked-lighting.js';
import { ContactShadows } from '../../core/src/contact-shadows.js';

import { opticalMaterialMaps } from '../../core/src/optical-material-maps.js';
/** Internal compile-time switches; uniforms and published material shapes stay unchanged. */
export interface MeshShaderFeatures {
  pbr: boolean;
  clearcoat: boolean;
  sheen: boolean;
  transmission: boolean;
  dispersion: boolean;
  anisotropy: boolean;
  iridescence: boolean;
  anisotropyMap: boolean;
  iridescenceMap: boolean;
  iridescenceThicknessMap: boolean;
  heightMap: boolean;
  subsurface: boolean;
  height: boolean;
  weathering: boolean;
  detail: boolean;
  triplanar: boolean;
  lightmap: boolean;
  bakedIrradiance: boolean;
  bakedLightmap: boolean;
  skinned: boolean;
  instanced: boolean;
  morph: boolean;
  shadows: boolean;
  contactShadows: boolean;
  environment: boolean;
  native: boolean;
}

export function meshShaderFeatures(
  material: TextureMaterial,
  mesh?: Mesh,
  scene?: Scene,
): MeshShaderFeatures {
  const bits = meshShaderVariantBits(material, mesh, scene);
  return {
    pbr: (bits & BIT.pbr) !== 0,
    clearcoat: (bits & BIT.clearcoat) !== 0,
    sheen: (bits & BIT.sheen) !== 0,
    transmission: (bits & BIT.transmission) !== 0,
    dispersion: (bits & BIT.dispersion) !== 0,
    anisotropy: (bits & BIT.anisotropy) !== 0,
    iridescence: (bits & BIT.iridescence) !== 0,
    anisotropyMap: (bits & BIT.anisotropyMap) !== 0,
    iridescenceMap: (bits & BIT.iridescenceMap) !== 0,
    iridescenceThicknessMap: (bits & BIT.iridescenceThicknessMap) !== 0,
    heightMap: (bits & BIT.heightMap) !== 0,
    subsurface: (bits & BIT.subsurface) !== 0,
    height: (bits & BIT.height) !== 0,
    weathering: (bits & BIT.weathering) !== 0,
    detail: (bits & BIT.detail) !== 0,
    triplanar: (bits & BIT.triplanar) !== 0,
    lightmap: (bits & BIT.lightmap) !== 0,
    bakedIrradiance: (bits & BIT.bakedIrradiance) !== 0,
    bakedLightmap: (bits & BIT.bakedLightmap) !== 0,
    skinned: (bits & BIT.skinned) !== 0,
    instanced: (bits & BIT.instanced) !== 0,
    morph: (bits & BIT.morph) !== 0,
    shadows: (bits & BIT.shadows) !== 0,
    contactShadows: (bits & BIT.contactShadows) !== 0,
    environment: (bits & BIT.environment) !== 0,
    native: (bits & BIT.native) !== 0,
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
  'bakedIrradiance',
  'bakedLightmap',
  'skinned',
  'instanced',
  'morph',
  'shadows',
  'contactShadows',
  'environment',
  'native',
  'anisotropyMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'heightMap',
];
const BIT = Object.fromEntries(
  featureOrder.map((name, index) => [name, 1 << index]),
) as Readonly<Record<keyof MeshShaderFeatures, number>>;

/**
 * Numeric variant key: renderers look programs up per draw, so this builds neither a string
 * nor a features object. `meshShaderFeatures` decodes these bits, keeping one definition.
 */
export function meshShaderVariantBits(
  material: TextureMaterial,
  mesh?: Mesh,
  scene?: Scene,
): number {
  let bits = 0;
  const pbr = material instanceof PBRMaterial ? material : undefined;
  if (pbr) {
    bits |= BIT.pbr;
    if (pbr.clearcoat > 0) bits |= BIT.clearcoat;
    const sheen = pbr.sheenColor;
    for (let i = 0; i < sheen.length; i++)
      if (sheen[i]! > 0) {
        bits |= BIT.sheen;
        break;
      }
    if (pbr.transmission > 0) bits |= BIT.transmission;
    const finish = pbr.finish;
    if (finish) {
      const optical = opticalMaterialMaps(pbr);
      if (finish.dispersion > 0) bits |= BIT.dispersion;
      if (finish.anisotropy > 0) {
        bits |= BIT.anisotropy;
        if (optical.anisotropyTexture) bits |= BIT.anisotropyMap;
      }
      if (finish.iridescence > 0) {
        bits |= BIT.iridescence;
        if (optical.iridescenceTexture) bits |= BIT.iridescenceMap;
        if (optical.iridescenceThicknessTexture)
          bits |= BIT.iridescenceThicknessMap;
      }
      if (finish.subsurface > 0) bits |= BIT.subsurface;
      if (finish.heightScale > 0) bits |= BIT.height;
      if (finish.heightScale > 0 && optical.heightTexture)
        bits |= BIT.heightMap;
      if (finish.wetness + finish.snow + finish.dirt + finish.damage > 0)
        bits |= BIT.weathering;
      if (finish.detailStrength > 0) bits |= BIT.detail;
      if (finish.triplanar > 0) bits |= BIT.triplanar;
    }
    if (pbr.lightmap) {
      bits |= BIT.lightmap;
      if (isBakedLightmap(pbr.lightmap)) bits |= BIT.bakedLightmap;
    }
    if (mesh && meshIrradianceVolume(mesh)) bits |= BIT.bakedIrradiance;
  }
  if (mesh instanceof SkinnedMesh) bits |= BIT.skinned;
  if (mesh && 'count' in mesh) bits |= BIT.instanced;
  if (mesh?.morph) bits |= BIT.morph;
  if (scene ? scene.shadows.enabled : true) bits |= BIT.shadows;
  if (scene && (ContactShadows.get(scene)?.strength ?? 0) > 0)
    bits |= BIT.contactShadows;
  if (scene ? !!scene.environment || scene.reflectionProbes.length > 0 : true)
    bits |= BIT.environment;
  if (isNativeMaterial3D(material)) bits |= BIT.native;
  return bits;
}

export function meshShaderVariantKey(features: MeshShaderFeatures): string {
  return featureBits(features).toString(36);
}

function featureBits(features: MeshShaderFeatures): number {
  let bits = 0;
  for (let i = 0; i < featureOrder.length; i++) {
    if (features[featureOrder[i]!]) bits |= 1 << i;
  }
  return bits;
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
