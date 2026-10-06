import { vegetationDefaults } from '../../../src/data/vegetation.js';
import { NativePBRMaterial } from './native-pbr-material.js';
import type { PBRMaterialOptions } from './pbr-material.js';

export interface VegetationMaterialOptions extends PBRMaterialOptions {
  /** Maximum mesh-local displacement, fixed for the material lifetime. */
  windAmplitude?: number;
  windFrequency?: number;
  windDirection?: readonly [number, number];
  /** Mesh-local height above the root at which full sway is reached. */
  bladeHeight?: number;
  rootHeight?: number;
  phaseScale?: number;
}

const wgsl = `
fn vegetationWind(position:vec3f, normal:vec3f, phase:f32)->XYZVertex {
  let wind=mesh.custom[0]; let shape=mesh.custom[1];
  let h=clamp((position.y-shape.z)/shape.x,0.0,1.0);
  let wave=sin(wind.x*wind.z+phase)*wind.y;
  let direction=mesh.custom[2].xy;
  let derivative=select(0.0,2.0*h/shape.x,position.y>shape.z && position.y<shape.z+shape.x)*wave;
  let displaced=position+vec3f(direction.x,0.0,direction.y)*(wave*h*h);
  let bentNormal=vec3f(normal.x,normal.y-derivative*dot(direction,normal.xz),normal.z);
  return XYZVertex(displaced,normalize(bentNormal));
}
fn xyzDeform(position:vec3f,normal:vec3f,uv:vec2f)->XYZVertex {
  return vegetationWind(position,normal,0.0);
}
fn xyzDeformInstance(position:vec3f,normal:vec3f,uv:vec2f,instance:mat4x4f)->XYZVertex {
  return vegetationWind(position,normal,dot(instance[3].xz,vec2f(0.754877666,0.569840296))*mesh.custom[1].y);
}
fn xyzPhysical(world:vec3f,normal:vec3f,uv:vec2f,surface:XYZPhysical)->XYZPhysical { return surface; }
`;
const glsl = `
XYZVertex vegetationWind(vec3 position,vec3 normal,float phase) {
  vec4 wind=xyzUniforms[0]; vec4 shape=xyzUniforms[1];
  float h=clamp((position.y-shape.z)/shape.x,0.0,1.0);
  float wave=sin(wind.x*wind.z+phase)*wind.y;
  vec2 direction=xyzUniforms[2].xy;
  float derivative=(position.y>shape.z && position.y<shape.z+shape.x ? 2.0*h/shape.x : 0.0)*wave;
  vec3 displaced=position+vec3(direction.x,0.0,direction.y)*(wave*h*h);
  vec3 bentNormal=vec3(normal.x,normal.y-derivative*dot(direction,normal.xz),normal.z);
  return XYZVertex(displaced,normalize(bentNormal));
}
XYZVertex xyzDeform(vec3 position,vec3 normal,vec2 uv) { return vegetationWind(position,normal,0.0); }
XYZVertex xyzDeformInstance(vec3 position,vec3 normal,vec2 uv,mat4 instance) {
  return vegetationWind(position,normal,dot(instance[3].xz,vec2(0.754877666,0.569840296))*xyzUniforms[1].y);
}
XYZPhysical xyzPhysical(vec3 world,vec3 normal,vec2 uv,XYZPhysical surface) { return surface; }
`;

/** Native PBR sway shared by color and shadow passes. Roots stay fixed; maps remain borrowed. */
export class VegetationMaterial extends NativePBRMaterial {
  constructor(options: VegetationMaterialOptions) {
    const amplitude = options.windAmplitude ?? vegetationDefaults.windAmplitude;
    const frequency = options.windFrequency ?? vegetationDefaults.windFrequency;
    const height = options.bladeHeight ?? vegetationDefaults.bladeHeight;
    const root = options.rootHeight ?? 0;
    const phase = options.phaseScale ?? vegetationDefaults.phaseScale;
    const direction = options.windDirection ?? [1, 0];
    for (const value of [
      amplitude,
      frequency,
      height,
      root,
      phase,
      ...direction,
    ])
      if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
        throw new RangeError('Vegetation wind values must fit finite Float32.');
    if (
      amplitude < 0 ||
      frequency < 0 ||
      height <= 0 ||
      Math.fround(height) === 0 ||
      direction.length !== 2
    )
      throw new RangeError(
        'Vegetation requires nonnegative wind and positive blade height.',
      );
    const length = Math.hypot(...direction);
    if (length === 0) throw new RangeError('Wind direction must be nonzero.');
    super({
      ...options,
      wgsl,
      glsl,
      label: 'VegetationMaterial',
      deformationBounds:
        Math.fround(amplitude) *
        Math.hypot(
          Math.fround(direction[0] / length),
          Math.fround(direction[1] / length),
        ),
      shadowCache: 'tracked',
      uniforms: [
        0,
        amplitude,
        frequency,
        0,
        height,
        phase,
        root,
        0,
        direction[0] / length,
        direction[1] / length,
        0,
        0,
      ],
    });
  }

  /** Advance using the application's simulation clock, never wall-clock time. */
  update(timeSeconds: number): void {
    if (this.destroyed) throw new Error('VegetationMaterial is destroyed.');
    if (
      !Number.isFinite(timeSeconds) ||
      !Number.isFinite(Math.fround(timeSeconds))
    )
      throw new RangeError('Vegetation time must fit finite Float32.');
    this.uniforms[0] = timeSeconds;
  }
}
