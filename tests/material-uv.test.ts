import { describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { TextureMaterial } from '../packages/core/src/mesh.js';
import {
  PBRMaterial,
  type TextureCoordinates,
} from '../packages/core/src/pbr-material.js';
import type { MaterialMappedTextureSlot } from '../packages/core/src/optical-material-maps.js';
import {
  fillMaterialUV,
  packedMaterialUV,
} from '../packages/graphics/src/material-uv.js';
import { mappedMaterialTextureSlots } from '../packages/graphics/src/optical-maps.js';

const FLOATS = mappedMaterialTextureSlots.length * 8;
const withUV1 = { uvs1: new Float32Array(6) };
const withoutUV1 = { uvs1: undefined };

function texture() {
  return new Texture({
    width: 1,
    height: 1,
    close: vi.fn(),
  } as unknown as ImageBitmap);
}

/** Independent std140 layout: identity unless a slot carries coordinates. */
function expected(
  coordinates: Partial<Record<MaterialMappedTextureSlot, TextureCoordinates>>,
): Float32Array {
  const out = new Float32Array(FLOATS);
  mappedMaterialTextureSlots.forEach((slot, i) => {
    const mapping = coordinates[slot];
    out.set(
      mapping
        ? [...mapping.transform, mapping.texCoord, 0]
        : [1, 0, 0, 1, 0, 0, 0, 0],
      i * 8,
    );
  });
  return out;
}

describe('fillMaterialUV', () => {
  it('packs identity, transformed and UV1 slots on every call', () => {
    const plain = new TextureMaterial({ texture: texture() });
    const mapped = new PBRMaterial({
      texture: texture(),
      textureCoordinates: {
        normal: { texCoord: 1, offset: [0.25, 0.5], rotation: 0.3 },
        emissive: { scale: [2, 3] },
      },
    });
    for (let call = 0; call < 2; call++) {
      const out = new Float32Array(FLOATS).fill(9);
      fillMaterialUV(plain, withoutUV1, out);
      expect(out).toEqual(expected({}));
      out.fill(9);
      fillMaterialUV(mapped, withUV1, out);
      expect(out).toEqual(expected(mapped.textureCoordinates));
    }
  });

  it('writes at the offset and keeps the bytes around it', () => {
    const material = new PBRMaterial({
      texture: texture(),
      textureCoordinates: { occlusion: { offset: [0.5, 0.25] } },
    });
    const out = new Float32Array(FLOATS + 8).fill(7);
    fillMaterialUV(material, withoutUV1, out, 4);
    expect(out.subarray(0, 4)).toEqual(new Float32Array(4).fill(7));
    expect(out.subarray(4, 4 + FLOATS)).toEqual(
      expected(material.textureCoordinates),
    );
    expect(out.subarray(4 + FLOATS)).toEqual(new Float32Array(4).fill(7));
    // A destination too short for every slot receives the slots that fit.
    const short = new Float32Array(12).fill(7);
    fillMaterialUV(material, withoutUV1, short);
    expect(short).toEqual(
      expected(material.textureCoordinates).subarray(0, 12),
    );
  });

  it('rejects UV1 slots on geometry without TEXCOORD_1 after a cached call', () => {
    const material = new PBRMaterial({
      texture: texture(),
      textureCoordinates: { clearcoat: { texCoord: 1 } },
    });
    const out = new Float32Array(FLOATS);
    fillMaterialUV(material, withUV1, out);
    out.fill(9);
    expect(() => fillMaterialUV(material, withoutUV1, out)).toThrow(
      'Material clearcoat requires absent TEXCOORD_1.',
    );
    // Slots before the failing one were already packed, as before.
    const clearcoat = mappedMaterialTextureSlots.indexOf('clearcoat') * 8;
    expect(out.subarray(0, clearcoat)).toEqual(
      expected({}).subarray(0, clearcoat),
    );
  });

  it('follows coordinate sets that can still change', () => {
    const transform: [number, number, number, number, number, number] = [
      1, 0, 0, 1, 0, 0,
    ];
    const coordinates = { texture: { texCoord: 0 as const, transform } };
    const material = new PBRMaterial({ texture: texture() });
    // `readonly` is a type-level promise; plain JS can still swap in a mutable set.
    (material as { textureCoordinates: unknown }).textureCoordinates =
      coordinates;
    const out = new Float32Array(FLOATS);
    fillMaterialUV(material, withoutUV1, out);
    expect(out).toEqual(expected(coordinates));
    transform[4] = 0.75;
    fillMaterialUV(material, withoutUV1, out);
    expect(out[4]).toBe(0.75);
    expect(packedMaterialUV(material, withoutUV1)).toBeUndefined();
  });
});

describe('packedMaterialUV', () => {
  it('shares one packed array per immutable coordinate set', () => {
    const material = new PBRMaterial({
      texture: texture(),
      textureCoordinates: { sheenColor: { texCoord: 1, offset: [0.5, 0] } },
    });
    const packed = packedMaterialUV(material, withUV1);
    expect(packed).toEqual(expected(material.textureCoordinates));
    expect(packedMaterialUV(material, withUV1)).toBe(packed);
    // Without TEXCOORD_1 the caller must pack per call, which reports the error.
    expect(packedMaterialUV(material, withoutUV1)).toBeUndefined();
    const plain = packedMaterialUV(
      new TextureMaterial({ texture: texture() }),
      withoutUV1,
    );
    expect(plain).toEqual(expected({}));
    expect(
      packedMaterialUV(new TextureMaterial({ texture: texture() }), withUV1),
    ).toBe(plain);
  });
});
