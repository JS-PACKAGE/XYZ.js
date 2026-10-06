import {
  water3DDefaults as defaults,
  water3DWaves,
  water3DNormalWaves,
} from '../../../src/data/water.js';
import type { Texture } from '../../assets/src/index.js';
import { Geometry } from './geometry.js';
import { Mesh, type MeshOptions } from './mesh.js';
import { NativePBRMaterial } from './native-pbr-material.js';
import type { PBRMaterialOptions } from './pbr-material.js';
import { waterGLSL, waterWGSL } from './water3d-shaders.js';

export interface WaterWave3D {
  /** Mesh-local X/Z direction; normalized at construction. */
  readonly direction: readonly [number, number];
  readonly amplitude: number;
  readonly wavelength: number;
  /** Angular phase speed in radians per second (signed). */
  readonly speed?: number;
  readonly phase?: number;
}

export interface WaterFoam3DOptions {
  /** Mesh-local crest height at which foam starts. */
  readonly threshold?: number;
  /** Positive height interval over which foam reaches full strength. */
  readonly fade?: number;
  readonly strength?: number;
}

export interface Water3DOptions extends Omit<
  MeshOptions,
  'geometry' | 'material' | 'morph'
> {
  /** Borrowed base-color texture, typically a solid white texture. */
  readonly texture: Texture;
  readonly width?: number;
  readonly depth?: number;
  /** Grid subdivisions per axis, 1–512; defaults to 64. */
  readonly segments?: number;
  /** Geometry waves; combined wave and normal-wave count must not exceed eight. */
  readonly waves?: readonly WaterWave3D[];
  /** Additional analytic normal ripples, without geometry displacement. */
  readonly normalWaves?: readonly WaterWave3D[];
  readonly foam?: boolean | WaterFoam3DOptions;
  /** Existing PBR factors/maps, including transmission and volume attenuation. */
  readonly materialOptions?: Omit<PBRMaterialOptions, 'texture'>;
}

export interface WaterSurface3D {
  height: number;
  normalX: number;
  normalY: number;
  normalZ: number;
  foam: number;
}

function bounded(
  value: number,
  minimum: number,
  maximum: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum)
    throw new RangeError(`${name} must be finite in [${minimum}, ${maximum}].`);
}

/**
 * Native PBR water on a mesh-local X/Z grid. Environment Fresnel and opaque-scene
 * refraction use the existing renderer; no scene depth texture is exposed for shoreline fade.
 * Call update(deltaSeconds) or setTime(elapsedSeconds) from the scene update.
 * Owns its material; textures remain borrowed. CPU vertices stay undeformed.
 */
export class Water3D extends Mesh {
  declare readonly material: NativePBRMaterial;
  readonly width: number;
  readonly depth: number;
  private readonly phases: Float64Array;
  private readonly speeds: Float64Array;
  private elapsed = 0;

  constructor(options: Water3DOptions) {
    const width = options.width ?? defaults.width;
    const depth = options.depth ?? defaults.depth;
    const segments = options.segments ?? defaults.segments;
    bounded(
      width,
      defaults.minimumLength,
      defaults.maximumLength,
      'Water width',
    );
    bounded(
      depth,
      defaults.minimumLength,
      defaults.maximumLength,
      'Water depth',
    );
    if (
      !Number.isInteger(segments) ||
      segments < 1 ||
      segments > defaults.maxSegments
    )
      throw new RangeError(
        `Water segments must be an integer in [1, ${defaults.maxSegments}].`,
      );
    const waves = options.waves ?? water3DWaves;
    const normalWaves = options.normalWaves ?? water3DNormalWaves;
    const count = waves.length + normalWaves.length;
    if (count > defaults.maxWaves)
      throw new RangeError(
        `Water supports at most ${defaults.maxWaves} combined waves.`,
      );
    const uniforms = new Float32Array(64);
    const phases = new Float64Array(count);
    const speeds = new Float64Array(count);
    uniforms[0] = waves.length;
    uniforms[1] = count;
    uniforms[44] = width;
    uniforms[45] = depth;
    let bound = 0;
    for (let i = 0; i < count; i++) {
      const wave: WaterWave3D =
        i < waves.length ? waves[i] : normalWaves[i - waves.length];
      const speed = wave.speed ?? 1;
      const phase = wave.phase ?? 0;
      bounded(
        wave.amplitude,
        0,
        defaults.maximumAmplitude,
        'Water wave amplitude',
      );
      bounded(
        wave.wavelength,
        defaults.minimumLength,
        defaults.maximumLength,
        'Water wavelength',
      );
      bounded(
        speed,
        -defaults.maximumSpeed,
        defaults.maximumSpeed,
        'Water wave speed',
      );
      if (!Number.isFinite(phase))
        throw new RangeError('Water wave phase must be finite.');
      const dx = wave.direction[0],
        dz = wave.direction[1];
      const length = Math.hypot(dx, dz);
      if (!Number.isFinite(length) || length === 0)
        throw new RangeError(
          'Water wave direction must be finite and nonzero.',
        );
      const k = (2 * Math.PI) / wave.wavelength;
      const offset = 4 + i * 4;
      uniforms[offset] = (dx / length) * k;
      uniforms[offset + 1] = (dz / length) * k;
      uniforms[offset + 2] = wave.amplitude;
      phases[i] = phase % (2 * Math.PI);
      speeds[i] = speed;
      uniforms[36 + i] = phases[i];
      if (i < waves.length) bound += uniforms[offset + 2];
    }
    const foam = options.foam;
    if (
      foam !== undefined &&
      typeof foam !== 'boolean' &&
      (foam === null || typeof foam !== 'object')
    )
      throw new TypeError('Water foam must be a boolean or options object.');
    const foamOptions = typeof foam === 'object' ? foam : undefined;
    const strength = foam ? (foamOptions?.strength ?? 1) : 0;
    const threshold =
      foamOptions?.threshold ?? bound * defaults.foamThresholdFraction;
    const fade =
      foamOptions?.fade ??
      Math.max(bound * defaults.foamFadeFraction, defaults.minimumLength);
    bounded(strength, 0, 1, 'Water foam strength');
    bounded(
      threshold,
      -defaults.maximumAmplitude,
      defaults.maximumAmplitude,
      'Water foam threshold',
    );
    bounded(
      fade,
      defaults.minimumLength,
      defaults.maximumLength,
      'Water foam fade',
    );
    uniforms[2] = strength;
    uniforms[3] = threshold;
    uniforms[46] = fade;
    const vertexCount = (segments + 1) ** 2;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(segments * segments * 6);
    for (let z = 0; z <= segments; z++) {
      for (let x = 0; x <= segments; x++) {
        const i = z * (segments + 1) + x;
        positions[i * 3] = (x / segments - 0.5) * width;
        positions[i * 3 + 2] = (z / segments - 0.5) * depth;
        normals[i * 3 + 1] = 1;
        uvs[i * 2] = x / segments;
        uvs[i * 2 + 1] = z / segments;
        if (x < segments && z < segments) {
          const a = i,
            b = a + 1,
            c = a + segments + 1,
            d = c + 1;
          const offset = (z * segments + x) * 6;
          indices[offset] = a;
          indices[offset + 1] = c;
          indices[offset + 2] = b;
          indices[offset + 3] = b;
          indices[offset + 4] = c;
          indices[offset + 5] = d;
        }
      }
    }
    const geometry = new Geometry({ positions, normals, uvs, indices });
    const material = new NativePBRMaterial({
      color: defaults.color,
      metallic: 0,
      roughness: defaults.roughness,
      ior: defaults.ior,
      transmission: defaults.transmission,
      thickness: defaults.thickness,
      attenuationColor: defaults.attenuationColor,
      attenuationDistance: defaults.attenuationDistance,
      alphaMode: 'OPAQUE',
      ...options.materialOptions,
      texture: options.texture,
      wgsl: waterWGSL,
      glsl: waterGLSL,
      uniforms,
      // Sum uses the actual Float32 amplitudes. Margin covers eight GPU additions.
      deformationBounds: bound * (1 + defaults.boundsMargin),
      shadowCache: 'tracked',
      label: 'Water3D',
    });
    super({ ...options, geometry, material });
    this.width = width;
    this.depth = depth;
    this.phases = phases;
    this.speeds = speeds;
  }

  get time(): number {
    return this.elapsed;
  }

  setTime(seconds: number): void {
    if (this.destroyed || this.material.destroyed)
      throw new Error('Water3D is destroyed.');
    if (!Number.isFinite(seconds))
      throw new RangeError('Water time must be finite.');
    const tau = 2 * Math.PI;
    for (let i = 0; i < this.phases.length; i++) {
      const speed = this.speeds[i];
      // Reduce before multiplying: large finite elapsed times never overflow uniforms.
      const phase =
        speed === 0 ? 0 : (seconds % (tau / Math.abs(speed))) * speed;
      this.material.uniforms[36 + i] = (this.phases[i] + phase) % tau;
    }
    this.elapsed = seconds;
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
      throw new RangeError('Water delta must be finite and nonnegative.');
    this.setTime(this.elapsed + deltaSeconds);
  }

  /** Analytic shader-equivalent local surface; caller supplies reusable output. */
  sampleSurface(x: number, z: number, out: WaterSurface3D): WaterSurface3D {
    if (!Number.isFinite(x) || !Number.isFinite(z))
      throw new RangeError('Water sample coordinates must be finite.');
    if (this.destroyed || this.material.destroyed)
      throw new Error('Water3D is destroyed.');
    const u = this.material.uniforms;
    let height = 0,
      sx = 0,
      sz = 0;
    for (let i = 0; i < u[1]; i++) {
      const offset = 4 + i * 4;
      const angle = u[offset] * x + u[offset + 1] * z + u[36 + i];
      if (i < u[0]) height += u[offset + 2] * Math.sin(angle);
      const slope = u[offset + 2] * Math.cos(angle);
      sx += u[offset] * slope;
      sz += u[offset + 1] * slope;
    }
    const length = Math.hypot(sx, 1, sz);
    out.height = height;
    out.normalX = -sx / length;
    out.normalY = 1 / length;
    out.normalZ = -sz / length;
    const t = Math.min(1, Math.max(0, (height - u[3]) / u[46]));
    out.foam = u[2] * t * t * (3 - 2 * t);
    return out;
  }

  override destroy(): void {
    if (this.destroyed) return;
    try {
      super.destroy();
    } finally {
      this.material.destroy();
    }
  }
}
