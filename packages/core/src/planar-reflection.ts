import { CanvasTexture2D } from '../../assets/src/texture2d.js';
import { Matrix4 } from '../../math/src/index.js';
import { planarReflectionLimits } from '../../../src/data/rendering.js';
import { PerspectiveCamera } from './perspective-camera.js';
import type { OrthographicCamera } from './orthographic-camera.js';
import type { Object3D } from './object3d.js';
import { NativeMaterial3D } from './native-material3d.js';
import type { TextureMaterialOptions } from './mesh.js';
import { NativePBRMaterial } from './native-pbr-material.js';
import type { PBRMaterialOptions } from './pbr-material.js';

export interface PlanarReflectionOptions {
  /** World plane n.xyz * world + constant = 0; normal need not be unit length. */
  readonly normal?: readonly [number, number, number];
  readonly constant?: number;
  readonly size?: number;
  /** Minimum simulation seconds between successful capture attempts. */
  readonly updateInterval?: number;
  readonly clipBias?: number;
  /** Borrowed reflector meshes must be excluded to avoid feedback. */
  readonly exclude?: readonly Object3D[];
}

/** Mirrored scene capture, with bounded readback and an owned reusable texture. */
export class PlanarReflection {
  readonly plane: readonly [number, number, number, number];
  readonly size: number;
  readonly updateInterval: number;
  readonly clipBias: number;
  readonly exclude: readonly Object3D[];
  readonly matrix = new Matrix4();
  private map: CanvasTexture2D | undefined;
  private disposed = false;
  private pending = false;
  private next = -Infinity;
  private readonly consumers = new Set<NativeMaterial3D | NativePBRMaterial>();

  constructor(options: PlanarReflectionOptions = {}) {
    const n = options.normal ?? [0, 1, 0];
    const constant = options.constant ?? 0;
    const length = Math.hypot(...n);
    this.size = options.size ?? planarReflectionLimits.size;
    this.updateInterval = options.updateInterval ?? planarReflectionLimits.interval;
    this.clipBias = options.clipBias ?? planarReflectionLimits.clipBias;
    if (n.length !== 3 || !Number.isFinite(length) || length === 0 || !Number.isFinite(constant) ||
      !Number.isInteger(this.size) || this.size < 2 || this.size > planarReflectionLimits.maximumSize ||
      !Number.isFinite(this.updateInterval) || this.updateInterval < planarReflectionLimits.minimumInterval ||
      !Number.isFinite(this.clipBias) || this.clipBias < 0 || this.clipBias > 1)
      throw new RangeError('Invalid planar reflection plane, resolution, interval or clip bias.');
    this.plane = Object.freeze([n[0] / length, n[1] / length, n[2] / length, constant / length]);
    this.exclude = Object.freeze([...(options.exclude ?? [])]);
  }
  get destroyed(): boolean { return this.disposed; }
  /** Undefined until the first successful native capture; caller removes consumers before destroy. */
  get texture(): CanvasTexture2D | undefined { return this.map; }
  /** Internal capture gate. Nested/pending calls reject; calls before the interval return false. */
  beginCapture(time: number): boolean {
    if (this.disposed) throw new Error('PlanarReflection is destroyed.');
    if (this.pending) throw new Error('Recursive planar reflection capture.');
    if (!Number.isFinite(time)) throw new RangeError('Capture time must be finite.');
    if (time < this.next) return false;
    this.pending = true;
    this.next = time + this.updateInterval;
    return true;
  }
  endCapture(): void { this.pending = false; }
  /** Native backends publish top-left sRGB RGBA8 only after a successful submission/readback. */
  adoptPixels(pixels: Uint8ClampedArray): void {
    if (this.disposed) return;
    if (pixels.length !== this.size * this.size * 4) throw new RangeError('Incorrect planar capture pixel count.');
    const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(this.size, this.size) : document.createElement('canvas');
    canvas.width = canvas.height = this.size;
    try {
      const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
      if (!context) throw new Error('PlanarReflection requires a 2D canvas for captured texture publication.');
      const image = context.createImageData(this.size, this.size);
      image.data.set(pixels);
      context.putImageData(image, 0, 0);
      if (this.map) this.map.update(canvas);
      else this.map = new CanvasTexture2D(canvas);
      for (const material of this.consumers) material.setUniforms(this.matrix.elements);
    } finally { canvas.width = canvas.height = 0; }
  }
  /** Projective native surface hook for either backend. Prepare before drawing; exclude its mesh from capture. */
  createMaterial(options: TextureMaterialOptions): NativeMaterial3D {
    if (!this.map || this.disposed) throw new Error('Capture the reflection before creating its material.');
    const material = new NativeMaterial3D({
      ...options, textureSources: [this.map], uniforms: this.matrix.elements, deformationBounds: 0,
      wgsl: `fn xyzSurface(world: vec3f, normal: vec3f, uv: vec2f, texel: vec4f) -> vec4f {
        let p = mat4x4f(mesh.custom[0],mesh.custom[1],mesh.custom[2],mesh.custom[3]) * vec4f(world,1.0);
        let coord = vec2f(p.x,-p.y) / max(p.w,0.00001) * 0.5 + 0.5;
        let reflected = textureSample(xyzMap0,xyzSampler0,clamp(coord,vec2f(0.0),vec2f(1.0)));
        return vec4f(reflected.rgb,texel.a);
      }`,
      glsl: `#ifdef XYZ_FRAGMENT
      vec4 xyzSurface(vec3 world, vec3 normal, vec2 uv, vec4 texel) {
        vec4 p = mat4(xyzUniforms[0],xyzUniforms[1],xyzUniforms[2],xyzUniforms[3]) * vec4(world,1.0);
        vec2 coord = vec2(p.x,-p.y) / max(p.w,0.00001) * 0.5 + 0.5;
        return vec4(texture(xyzMap0,clamp(coord,vec2(0.0),vec2(1.0))).rgb,texel.a);
      }
      #endif`,
    });
    this.consumers.add(material);
    material.onDestroy(() => this.consumers.delete(material));
    return material;
  }
  /** Add projective linear reflection radiance to PBR emission; reserves the emissive sampler. */
  createPBRMaterial(options: PBRMaterialOptions, strength = 1): NativePBRMaterial {
    if (!this.map || this.disposed) throw new Error('Capture the reflection before creating its material.');
    if (!Number.isFinite(strength) || strength < 0 || strength > 1)
      throw new RangeError('Planar reflection strength must be 0..1.');
    if (options.emissiveTexture || options.sources?.emissiveTexture || options.lightmap)
      throw new Error('Planar reflection reserves the emissive sampler; emissive maps and lightmaps cannot be combined.');
    const material = new NativePBRMaterial({
      ...options, sources: { ...options.sources, emissiveTexture: this.map },
      uniforms: this.matrix.elements, deformationBounds: 0,
      wgsl: `fn xyzPhysical(world: vec3f, normal: vec3f, uv: vec2f, surface: XYZPhysical) -> XYZPhysical {
        let p = mat4x4f(mesh.custom[0],mesh.custom[1],mesh.custom[2],mesh.custom[3]) * vec4f(world,1.0);
        let coord = clamp(vec2f(p.x,-p.y) / max(p.w,0.00001) * 0.5 + 0.5,vec2f(0.0),vec2f(1.0));
        let radiance = decodeSRGB(textureSample(emissiveMap,emissiveSampler,coord).rgb);
        var result = surface;
        result.emission += radiance * ${strength.toFixed(8)};
        return result;
      }`,
      glsl: `#ifdef XYZ_FRAGMENT
      XYZPhysical xyzPhysical(vec3 world, vec3 normal, vec2 uv, XYZPhysical surface) {
        vec4 p = mat4(xyzUniforms[0],xyzUniforms[1],xyzUniforms[2],xyzUniforms[3]) * vec4(world,1.0);
        vec2 coord = clamp(vec2(p.x,-p.y) / max(p.w,0.00001) * 0.5 + 0.5,vec2(0.0),vec2(1.0));
        surface.emission += decodeSRGB(texture(emissiveMap,coord).rgb) * ${strength.toFixed(8)};
        return surface;
      }
      #endif`,
    });
    this.consumers.add(material);
    material.onDestroy(() => this.consumers.delete(material));
    return material;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.map?.destroy();
    this.consumers.clear();
  }
}

/** Correct-handed mirrored camera: horizontal projection reversal avoids reversed mesh winding. */
export class PlanarReflectionCamera extends PerspectiveCamera {
  private readonly reflection = new Matrix4();
  private readonly inverse = new Matrix4();
  constructor(private readonly source: PerspectiveCamera | OrthographicCamera, private readonly capture: PlanarReflection) {
    super();
    const [x,y,z,d] = capture.plane;
    const e = this.reflection.elements;
    e.set([1-2*x*x,-2*x*y,-2*x*z,0,-2*x*y,1-2*y*y,-2*y*z,0,-2*x*z,-2*y*z,1-2*z*z,0,-2*d*x,-2*d*y,-2*d*z,1]);
    const p = source.position, distance = x*p.x+y*p.y+z*p.z+d;
    this.position.set(p.x-2*distance*x,p.y-2*distance*y,p.z-2*distance*z);
  }
  override updateMatrix(aspect: number): Matrix4 {
    this.matrix.copy(this.source.updateMatrix(aspect)).multiply(this.reflection);
    const e = this.matrix.elements;
    for (let i=0;i<16;i+=4) e[i] = -e[i]!;
    // Keep the source-camera side of the plane, and move clipping slightly into it.
    const plane = this.capture.plane, p = this.source.position;
    const side = plane[0]*p.x+plane[1]*p.y+plane[2]*p.z+plane[3] >= 0 ? 1 : -1;
    const a=side*plane[0], b=side*plane[1], c=side*plane[2], d=side*plane[3]-this.capture.clipBias;
    const inv = this.inverse.copy(this.matrix).invert().elements;
    let denominator = -Infinity;
    for (const x of [-1,1]) for (const y of [-1,1]) {
      const qx=inv[0]!*x+inv[4]!*y+inv[8]!+inv[12]!;
      const qy=inv[1]!*x+inv[5]!*y+inv[9]!+inv[13]!;
      const qz=inv[2]!*x+inv[6]!*y+inv[10]!+inv[14]!;
      const qw=inv[3]!*x+inv[7]!*y+inv[11]!+inv[15]!;
      denominator = Math.max(denominator,a*qx+b*qy+c*qz+d*qw);
    }
    if (!Number.isFinite(denominator) || denominator <= 1e-8) throw new RangeError('Reflection plane does not intersect the camera frustum.');
    // Engine clip space is 0..1 on BOTH backends (GL converts depth in its vertex shader).
    e[2]=a/denominator; e[6]=b/denominator; e[10]=c/denominator; e[14]=d/denominator;
    this.capture.matrix.copy(this.matrix);
    return this.matrix;
  }
}
