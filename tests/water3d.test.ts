import { describe, expect, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { NativePBRMaterial } from '../packages/core/src/native-pbr-material.js';
import {
  Water3D,
  type WaterSurface3D,
  type WaterWave3D,
} from '../packages/core/src/water3d.js';
import { nativeMeshGLSL } from '../packages/graphics/src/webgl-feature-shaders.js';
import { nativeMeshWGSL } from '../packages/graphics/src/webgpu-mesh-shader.js';

function texture(): Texture {
  return new Texture({ width: 1, height: 1, close() {} } as ImageBitmap);
}
function output(): WaterSurface3D {
  return { height: 0, normalX: 0, normalY: 1, normalZ: 0, foam: 0 };
}
const wave: WaterWave3D = {
  direction: [1, 0],
  amplitude: 0.5,
  wavelength: 2 * Math.PI,
  speed: 1,
};

describe('Water3D', () => {
  it('builds an upward grid and reuses native PBR transmission and Fresnel factors', () => {
    const water = new Water3D({
      texture: texture(),
      width: 4,
      depth: 6,
      segments: 2,
    });
    expect(water.material).toBeInstanceOf(NativePBRMaterial);
    expect(water.geometry.vertices.length).toBe(9 * 8);
    expect(water.geometry.indices.length).toBe(24);
    expect(Array.from(water.geometry.vertices.slice(0, 6))).toEqual([
      -2, 0, -3, 0, 1, 0,
    ]);
    expect(Array.from(water.geometry.indices.slice(0, 6))).toEqual([
      0, 3, 1, 1, 3, 4,
    ]);
    expect(water.material.ior).toBe(1.333);
    expect(water.material.transmission).toBe(0.85);
    expect(water.material.attenuationDistance).toBe(5);
    expect(water.material.shadowCache).toBe('tracked');
    water.visible = false;
    expect(water.visible).toBe(false);
    water.destroy();
  });

  it('samples animated height and derivative normals without mutating CPU vertices', () => {
    const water = new Water3D({
      texture: texture(),
      waves: [wave],
      normalWaves: [],
      segments: 1,
    });
    const version = water.geometry.version;
    const out = output();
    expect(water.sampleSurface(0, 0, out)).toBe(out);
    expect(out.height).toBe(0);
    expect(out.normalX).toBeCloseTo(-0.5 / Math.hypot(0.5, 1));
    water.setTime(Math.PI / 2);
    water.sampleSurface(0, 0, out);
    expect(out.height).toBeCloseTo(0.5);
    expect(out.normalY).toBeCloseTo(1);
    water.update(0.25);
    expect(water.time).toBe(Math.PI / 2 + 0.25);
    expect(water.geometry.version).toBe(version);
    for (let i = 1; i < water.geometry.vertices.length; i += 8)
      expect(water.geometry.vertices[i]).toBe(0);
    water.destroy();
  });

  it('adds animated normal ripples without increasing displacement bounds', () => {
    const water = new Water3D({
      texture: texture(),
      waves: [],
      normalWaves: [wave],
      segments: 1,
    });
    const out = output();
    water.sampleSurface(0, 0, out);
    expect(out.height).toBe(0);
    expect(out.normalX).not.toBe(0);
    expect(water.material.deformationBounds).toBe(0);
    water.setTime(Math.PI / 2);
    water.sampleSurface(0, 0, out);
    expect(out.normalX).toBeCloseTo(0);
    water.destroy();
  });

  it('bounds the sum of Float32 amplitudes across positions, time and transforms', () => {
    const water = new Water3D({ texture: texture(), segments: 1 });
    const out = output();
    const bound = water.material.deformationBounds!;
    expect(bound).toBeGreaterThanOrEqual(Math.fround(0.12) + Math.fround(0.06));
    expect(bound).toBeLessThan(0.181);
    for (let time = 0; time < 30; time++) {
      water.setTime(time * 0.31);
      for (let x = -5; x <= 5; x += 0.3) {
        water.sampleSurface(x, x * 0.7, out);
        expect(Math.abs(out.height)).toBeLessThanOrEqual(bound);
        expect(Math.hypot(out.normalX, out.normalY, out.normalZ)).toBeCloseTo(
          1,
        );
      }
    }
    water.transform.scale.set(2, 2, 2);
    const sphere = water.getWorldBoundingSphere({
      x: 0,
      y: 0,
      z: 0,
      radius: 0,
    });
    expect(sphere.radius).toBeCloseTo(
      2 * (water.boundingSphere.radius + bound),
    );
    water.setTime(Number.MAX_VALUE);
    expect(Array.from(water.material.uniforms).every(Number.isFinite)).toBe(
      true,
    );
    water.destroy();
  });

  it('provides bounded optional crest foam and accepts existing volume controls', () => {
    const water = new Water3D({
      texture: texture(),
      waves: [wave],
      normalWaves: [],
      segments: 1,
      foam: { threshold: 0.2, fade: 0.2, strength: 0.7 },
      materialOptions: {
        transmission: 0.4,
        thickness: 2,
        attenuationDistance: 3,
      },
    });
    const out = output();
    water.setTime(Math.PI / 2);
    water.sampleSurface(0, 0, out);
    expect(out.foam).toBeCloseTo(0.7);
    water.setTime(-Math.PI / 2);
    water.sampleSurface(0, 0, out);
    expect(out.foam).toBe(0);
    expect(water.material.transmission).toBe(0.4);
    expect(water.material.thickness).toBe(2);
    expect(water.material.attenuationDistance).toBe(3);
    water.destroy();
  });

  it('composes both hook languages into native vertex, surface and shadow stages', () => {
    const water = new Water3D({ texture: texture(), segments: 1, foam: true });
    const wgsl = nativeMeshWGSL(water.material.wgsl, true);
    expect(wgsl.match(/fn xyzDeform\s*\(/g)).toHaveLength(1);
    expect(wgsl.match(/fn xyzPhysical\s*\(/g)).toHaveLength(1);
    expect(wgsl).toContain('waterHeight(position.xz)');
    expect(wgsl).toContain('roughTransmission(');
    for (const stage of ['vertex', 'surface', 'shadow'] as const) {
      const glsl = nativeMeshGLSL(water.material.glsl, stage, true);
      expect(glsl).toContain('xyzUniforms[9 + i / 4][i % 4]');
      expect(glsl).toContain('XYZPhysical xyzPhysical(');
    }
    water.destroy();
  });

  it('rejects invalid dimensions, waves, foam and animation updates', () => {
    const image = texture();
    expect(() => new Water3D({ texture: image, width: 0 })).toThrow(RangeError);
    expect(() => new Water3D({ texture: image, segments: 1.5 })).toThrow(
      RangeError,
    );
    expect(
      () => new Water3D({ texture: image, waves: Array(9).fill(wave) }),
    ).toThrow(RangeError);
    expect(
      () =>
        new Water3D({
          texture: image,
          waves: [{ ...wave, direction: [0, 0] }],
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new Water3D({ texture: image, waves: [{ ...wave, wavelength: 0 }] }),
    ).toThrow(RangeError);
    expect(
      () =>
        new Water3D({ texture: image, waves: [{ ...wave, amplitude: -1 }] }),
    ).toThrow(RangeError);
    expect(() => new Water3D({ texture: image, foam: { fade: 0 } })).toThrow(
      RangeError,
    );
    const water = new Water3D({ texture: image, segments: 1 });
    expect(() => water.setTime(Infinity)).toThrow(RangeError);
    expect(() => water.update(-1)).toThrow(RangeError);
    expect(() => water.sampleSurface(NaN, 0, output())).toThrow(RangeError);
    water.destroy();
  });

  it('owns its material but never destroys borrowed textures', () => {
    const image = texture();
    const water = new Water3D({ texture: image, segments: 1 });
    water.destroy();
    water.destroy();
    expect(water.destroyed).toBe(true);
    expect(water.material.destroyed).toBe(true);
    expect(image.destroyed).toBe(false);
    expect(() => water.update(0)).toThrow(/destroyed/);
    expect(() => water.sampleSurface(0, 0, output())).toThrow(/destroyed/);
  });
});
