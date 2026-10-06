import { Texture } from '../../assets/src/index.js';
import { bakedLightingLimits as limits } from '../../../src/data/rendering.js';
import { Geometry } from './geometry.js';
import { Mesh } from './mesh.js';
import { Scene } from './scene.js';
import { EnvironmentMap } from './environment.js';
import { SpotLight } from './lights.js';
import type { PBRMaterialOptions } from './pbr-material.js';
import { BakeBVH, type BakeTriangle } from './bake-bvh.js';

export type BakeVector = readonly [number, number, number];
export interface LightingBakeOptions {
  /** Static opaque occluders/receivers; defaults to scene meshes. */
  meshes?: readonly Mesh[];
  maxTriangles?: number;
  maxRays?: number;
  bias?: number;
  samples?: number;
  aoDistance?: number;
}
export interface LightmapBakeOptions extends LightingBakeOptions {
  size?: number;
  padding?: number;
  /** Generate disjoint per-triangle UV1 charts, or validate and use authored UV1. */
  atlas?: 'generate' | 'uv1';
}
export interface BakedLightmap {
  readonly texture: Texture;
  /** Linear irradiance/pi, RGB, top-row-first; texture is sRGB encoded and clamped to [0,1]. */
  readonly pixels: Float32Array;
  readonly geometries: ReadonlyMap<Mesh, Geometry>;
  readonly materialOptions: Pick<PBRMaterialOptions, 'lightmap' | 'lightmapSampler' | 'finish' | 'textureCoordinates'>;
  readonly rays: number;
  destroy(): void;
}
function integer(value: number, low: number, high: number, name: string): number {
  if (!Number.isInteger(value) || value < low || value > high) throw new RangeError(`${name} outside bounded bake profile.`);
  return value;
}
function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and positive.`);
  return value;
}
function basis(x: number, y: number, z: number, out: Float64Array): void {
  out[0] = 0.282095; out[1] = 0.488603 * y; out[2] = 0.488603 * z; out[3] = 0.488603 * x;
  out[4] = 1.092548 * x * y; out[5] = 1.092548 * y * z; out[6] = 0.315392 * (3 * z * z - 1); out[7] = 1.092548 * x * z; out[8] = 0.546274 * (x * x - y * y);
}
function normalize(n: number[]): void {
  const length = Math.hypot(n[0], n[1], n[2]);
  if (length < 1e-12) throw new RangeError('Bake normal cannot be zero.');
  for (let c = 0; c < 3; c++) n[c] /= length;
}
class Context {
  readonly bvh: BakeBVH;
  readonly samples: number;
  readonly bias: number;
  readonly distance: number;
  readonly meshes: readonly Mesh[];
  private readonly origin = [0, 0, 0];
  private readonly direction = [0, 0, 0];
  constructor(readonly scene: Scene | undefined, options: LightingBakeOptions) {
    this.meshes = options.meshes ?? (scene ? [...scene.objects].filter((o): o is Mesh => o instanceof Mesh) : []);
    if (new Set(this.meshes).size !== this.meshes.length || this.meshes.some(m => !(m instanceof Mesh) || m.destroyed)) throw new TypeError('Bake meshes must be distinct live Mesh objects.');
    this.samples = integer(options.samples ?? limits.samples, 1, limits.maxSamples, 'Samples');
    this.bias = positive(options.bias ?? limits.bias, 'Bias');
    this.distance = positive(options.aoDistance ?? limits.aoDistance, 'AO distance');
    this.bvh = new BakeBVH(this.meshes, integer(options.maxTriangles ?? limits.maxTriangles, 1, limits.maxTriangles, 'Triangles'), integer(options.maxRays ?? limits.maxRays, 1, limits.maxRays, 'Rays'));
    if (scene) {
      if (scene.pointLights.length + scene.spotLights.length > limits.maxLights) throw new RangeError('Bake light budget exceeded.');
      for (const l of [...scene.pointLights, ...scene.spotLights]) l.validate();
      const sun = scene.directionalLight;
      if (!Number.isFinite(sun.intensity) || sun.intensity < 0 || sun.color.some(c => !Number.isFinite(c) || c < 0) || !Number.isFinite(sun.direction.length()) || sun.direction.length() === 0 || !Number.isFinite(scene.ambientLight) || scene.ambientLight < 0) throw new RangeError('Invalid scene bake lighting.');
      if (!Number.isFinite(scene.environmentIntensity) || scene.environmentIntensity < 0) throw new RangeError('Invalid environment bake intensity.');
    }
  }
  direct(p: number[], n: number[], out: number[], ignore?: BakeTriangle): void {
    out.fill(0); const scene = this.scene; if (!scene) return;
    for (let c = 0; c < 3; c++) this.origin[c] = p[c] + n[c] * this.bias;
    const sun = scene.directionalLight, d = this.direction;
    const length = sun.direction.length(); d[0] = sun.direction.x / length; d[1] = sun.direction.y / length; d[2] = sun.direction.z / length;
    const cosine = Math.max(0, n[0] * d[0] + n[1] * d[1] + n[2] * d[2]);
    if (cosine && sun.intensity && !this.bvh.hit(this.origin, d, Infinity, ignore)) for (let c = 0; c < 3; c++) out[c] += cosine * sun.intensity * sun.color[c];
    for (const lights of [scene.pointLights, scene.spotLights]) for (const light of lights) {
      d[0] = light.position.x - p[0]; d[1] = light.position.y - p[1]; d[2] = light.position.z - p[2];
      const distance = Math.hypot(...d); if (distance <= this.bias || (light.range && distance >= light.range)) continue;
      for (let c = 0; c < 3; c++) d[c] /= distance;
      let gain = Math.max(0, n[0] * d[0] + n[1] * d[1] + n[2] * d[2]) * light.intensity / Math.max(distance * distance, 0.01);
      if (light.range) gain *= (1 - (distance / light.range) ** 4) ** 2;
      if (light instanceof SpotLight) {
        const cone = -(d[0] * light.direction.x + d[1] * light.direction.y + d[2] * light.direction.z) / light.direction.length();
        const t = Math.max(0, Math.min(1, (cone - Math.cos(light.outerAngle)) / (Math.cos(light.innerAngle) - Math.cos(light.outerAngle)))); gain *= t * t * (3 - 2 * t);
      }
      if (gain && !this.bvh.hit(this.origin, d, distance - this.bias, ignore)) for (let c = 0; c < 3; c++) out[c] += gain * light.color[c];
    }
  }
  surface(p: number[], n: number[], out: number[], ignore: BakeTriangle): void {
    this.direct(p, n, out, ignore);
    const tangent = Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [0, -n[2], n[1]]; normalize(tangent);
    const bitangent = [n[1] * tangent[2] - n[2] * tangent[1], n[2] * tangent[0] - n[0] * tangent[2], n[0] * tangent[1] - n[1] * tangent[0]];
    const d = [0, 0, 0], origin = p.map((v, c) => v + n[c] * this.bias); let open = 0;
    for (let i = 0; i < this.samples; i++) {
      const r = Math.sqrt((i + 0.5) / this.samples), phi = i * 2.399963229728653;
      for (let c = 0; c < 3; c++) d[c] = tangent[c] * r * Math.cos(phi) + bitangent[c] * r * Math.sin(phi) + n[c] * Math.sqrt(1 - r * r);
      if (!this.bvh.hit(origin, d, this.distance, ignore)) open++;
    }
    const ambient = this.scene?.ambientLight ?? 0;
    for (let c = 0; c < 3; c++) out[c] += ambient * open / this.samples;
  }
}

/** CPU bake, no renderer/GPU access. Caller owns the resulting texture and replacement geometries. */
export async function bakeLightmap(scene: Scene, options: LightmapBakeOptions = {}): Promise<BakedLightmap> {
  const size = integer(options.size ?? limits.size, 4, limits.maxSize, 'Size');
  const padding = integer(options.padding ?? limits.padding, 1, limits.maxPadding, 'Padding');
  const atlas = options.atlas ?? 'generate'; if (atlas !== 'generate' && atlas !== 'uv1') throw new RangeError('Unknown bake atlas mode.');
  const ctx = new Context(scene, options), triangles = ctx.bvh.triangles;
  const columns = Math.ceil(Math.sqrt(triangles.length)), cell = Math.floor(size / Math.max(1, columns));
  if (atlas === 'generate' && triangles.length && cell < padding * 2 + 3) throw new RangeError('Atlas too small for triangle charts and padding.');
  const pixels = new Float32Array(size * size * 3), owner = new Int32Array(size * size).fill(-1);
  const geometries = new Map<Mesh, Geometry>();
  const streams = new Map<Mesh, { positions: number[]; normals: number[]; uvs: number[]; uvs1: number[]; indices: number[]; colors: number[]; tangents: number[] }>();
  const p = [0, 0, 0], n = [0, 0, 0], rgb = [0, 0, 0];
  let rasterSamples = 0;
  for (let t = 0; t < triangles.length; t++) {
    const triangle = triangles[t], g = triangle.mesh.geometry;
    let uv: number[];
    if (atlas === 'uv1') {
      if (!g.uvs1) throw new RangeError('Authored bake requires UV1.');
      uv = triangle.indices.flatMap(i => [g.uvs1![i * 2] * size, g.uvs1![i * 2 + 1] * size]);
      if (uv.some(v => !Number.isFinite(v) || v < padding || v > size - padding)) throw new RangeError('UV1 charts require atlas-edge padding.');
      geometries.set(triangle.mesh, g);
    } else {
      const x = (t % columns) * cell + padding + 0.5, y = Math.floor(t / columns) * cell + padding + 0.5, extent = cell - 2 * padding - 1;
      uv = [x, y, x + extent, y, x, y + extent];
      let stream = streams.get(triangle.mesh);
      if (!stream) { stream = { positions: [], normals: [], uvs: [], uvs1: [], indices: [], colors: [], tangents: [] }; streams.set(triangle.mesh, stream); }
      for (let v = 0; v < 3; v++) {
        const i = triangle.indices[v], base = i * 8;
        stream.indices.push(stream.indices.length);
        for (let c = 0; c < 3; c++) { stream.positions.push(g.vertices[base + c]); stream.normals.push(g.vertices[base + 3 + c]); }
        stream.uvs.push(g.vertices[base + 6], g.vertices[base + 7]); stream.uvs1.push(uv[v * 2] / size, uv[v * 2 + 1] / size);
        if (g.colors) for (let c = 0; c < 4; c++) stream.colors.push(g.colors[i * 4 + c]);
        for (let c = 0; c < 4; c++) stream.tangents.push(g.tangents[i * 4 + c]);
      }
    }
    const det = (uv[3] - uv[5]) * (uv[0] - uv[4]) + (uv[4] - uv[2]) * (uv[1] - uv[5]);
    if (Math.abs(det) < 1e-8) throw new RangeError('Degenerate UV1 triangle.');
    for (let y = Math.max(0, Math.floor(Math.min(uv[1], uv[3], uv[5]))); y < Math.min(size, Math.ceil(Math.max(uv[1], uv[3], uv[5]))); y++) for (let x = Math.max(0, Math.floor(Math.min(uv[0], uv[2], uv[4]))); x < Math.min(size, Math.ceil(Math.max(uv[0], uv[2], uv[4]))); x++) {
      if (++rasterSamples > limits.maxRays) throw new RangeError('Bake raster sample budget exceeded.');
      const a = ((uv[3] - uv[5]) * (x + 0.5 - uv[4]) + (uv[4] - uv[2]) * (y + 0.5 - uv[5])) / det;
      const b = ((uv[5] - uv[1]) * (x + 0.5 - uv[4]) + (uv[0] - uv[4]) * (y + 0.5 - uv[5])) / det, c = 1 - a - b;
      if (a < -1e-7 || b < -1e-7 || c < -1e-7) continue;
      const index = y * size + x;
      if (owner[index] >= 0) {
        if (Math.min(a, b, c) > 1e-7) throw new RangeError('Overlapping UV1 charts.');
        continue;
      }
      for (let k = 0; k < 3; k++) { p[k] = triangle.p[k] * a + triangle.p[k + 3] * b + triangle.p[k + 6] * c; n[k] = triangle.n[k] * a + triangle.n[k + 3] * b + triangle.n[k + 6] * c; }
      normalize(n); ctx.surface(p, n, rgb, triangle); pixels.set(rgb, index * 3); owner[index] = t;
    }
  }
  // Synchronous rings prevent one chart's newly filled pixels from racing into another chart.
  const next = new Int32Array(owner.length);
  for (let ring = 0; ring < padding; ring++) {
    next.set(owner);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const index = y * size + x; if (owner[index] >= 0) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (x + dx < 0 || x + dx >= size || y + dy < 0 || y + dy >= size) continue;
        const source = (y + dy) * size + x + dx;
        if (owner[source] >= 0 && next[index] < 0) { next[index] = owner[source]; for (let c = 0; c < 3; c++) pixels[index * 3 + c] = pixels[source * 3 + c]; }
      }
    }
    owner.set(next);
  }
  for (const [mesh, stream] of streams) geometries.set(mesh, new Geometry({ ...stream, colors: stream.colors.length ? stream.colors : undefined, tangentTexCoord: mesh.geometry.tangentTexCoord, tangentConvention: mesh.geometry.tangentConvention }));
  const bytes = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) { for (let c = 0; c < 3; c++) { const v = Math.min(1, Math.max(0, pixels[i * 3 + c])); bytes[i * 4 + c] = Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); } bytes[i * 4 + 3] = 255; }
  const texture = await Texture.fromImage(new ImageData(bytes, size, size));
  return { texture, pixels, geometries, materialOptions: { lightmap: texture, lightmapSampler: { addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', lodMaxClamp: 0 }, textureCoordinates: { emissive: { texCoord: 1 } }, finish: { lightmapStrength: 1 } }, rays: ctx.bvh.rays, destroy: () => texture.destroy() };
}

export interface IrradianceVolumeBakeOptions extends LightingBakeOptions {
  min: BakeVector;
  max: BakeVector;
  resolution?: readonly [number, number, number];
  order?: 1 | 2;
}
const bands = [1, 2 / 3, 2 / 3, 2 / 3, 0.25, 0.25, 0.25, 0.25, 0.25];
/** Bounded SH irradiance/pi grid. Samples clamp to grid nodes only inside its world-space bounds. */
export class BakedIrradianceVolume {
  readonly min: BakeVector;
  readonly max: BakeVector;
  readonly resolution: readonly [number, number, number];
  readonly order: 1 | 2;
  readonly coefficients: Float32Array;
  private gone = false;
  constructor(options: IrradianceVolumeBakeOptions, coefficients?: ArrayLike<number>) {
    this.min = Object.freeze([...options.min]) as unknown as BakeVector; this.max = Object.freeze([...options.max]) as unknown as BakeVector;
    if (this.min.length !== 3 || this.max.length !== 3) throw new RangeError('Volume bounds need three coordinates.');
    for (let c = 0; c < 3; c++) if (!Number.isFinite(this.min[c]) || !Number.isFinite(this.max[c]) || this.min[c] >= this.max[c]) throw new RangeError('Invalid volume bounds.');
    this.resolution = Object.freeze([...(options.resolution ?? limits.resolution)]) as unknown as readonly [number, number, number];
    if (this.resolution.length !== 3) throw new RangeError('Resolution needs three dimensions.');
    let count = 1; for (const n of this.resolution) count *= integer(n, 2, limits.maxProbes, 'Resolution');
    if (count > limits.maxProbes) throw new RangeError('Probe memory budget exceeded.');
    this.order = options.order ?? 2; if (this.order !== 1 && this.order !== 2) throw new RangeError('SH order must be 1 or 2.');
    const length = count * (this.order === 1 ? 4 : 9) * 3;
    if (coefficients && (coefficients.length !== length || Array.from(coefficients).some(v => !Number.isFinite(v) || !Number.isFinite(Math.fround(v))))) throw new RangeError('Invalid probe coefficients.');
    this.coefficients = coefficients ? Float32Array.from(coefficients) : new Float32Array(length);
  }
  get destroyed(): boolean { return this.gone; }
  destroy(): void { this.gone = true; this.coefficients.fill(0); }
  /** Allocation-free 36-float shader ABI output; false leaves it zero outside the volume. */
  sampleSH(x: number, y: number, z: number, out: Float32Array, offset = 0): boolean {
    if (!Number.isInteger(offset) || offset < 0 || out.length < offset + 36) throw new RangeError('SH output requires 36 floats.');
    out.fill(0, offset, offset + 36);
    if (this.gone || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || x < this.min[0] || x > this.max[0] || y < this.min[1] || y > this.max[1] || z < this.min[2] || z > this.max[2]) return false;
    const [nx, ny, nz] = this.resolution;
    const gx = (x - this.min[0]) / (this.max[0] - this.min[0]) * (nx - 1), gy = (y - this.min[1]) / (this.max[1] - this.min[1]) * (ny - 1), gz = (z - this.min[2]) / (this.max[2] - this.min[2]) * (nz - 1);
    const ix = Math.min(nx - 2, Math.floor(gx)), iy = Math.min(ny - 2, Math.floor(gy)), iz = Math.min(nz - 2, Math.floor(gz));
    const fx = gx - ix, fy = gy - iy, fz = gz - iz, terms = this.order === 1 ? 4 : 9;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const weight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz), base = (((iz + dz) * ny + iy + dy) * nx + ix + dx) * terms * 3;
      for (let k = 0; k < terms; k++) for (let c = 0; c < 3; c++) out[offset + k * 4 + c] += weight * this.coefficients[base + k * 3 + c];
    }
    return true;
  }
}
function half(h: number): number { const exponent = (h >>> 10) & 31, mantissa = h & 1023; return (h & 32768 ? -1 : 1) * (exponent ? (1 + mantissa / 1024) * 2 ** (exponent - 15) : mantissa * 2 ** -24); }
function radiance(map: EnvironmentMap, d: number[], out: number[]): void {
  const u = Math.atan2(d[0], -d[2]) / (2 * Math.PI) + 0.5, v = Math.acos(Math.max(-1, Math.min(1, d[1]))) / Math.PI;
  const sx = u * map.width - 0.5, sy = v * map.height - 0.5, x = Math.floor(sx), y = Math.floor(sy), fx = sx - x, fy = sy - y;
  out.fill(0);
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const index = (Math.min(map.height - 1, Math.max(0, y + dy)) * map.width + ((x + dx) % map.width + map.width) % map.width) * 4;
    for (let c = 0; c < 3; c++) out[c] += half(map.levels[0][index + c]) * (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy);
  }
}
/** Bake EnvironmentMap sky or a scene's occluded sky, direct lights and one diffuse surface bounce. */
export function bakeIrradianceVolume(source: Scene | EnvironmentMap, options: IrradianceVolumeBakeOptions): BakedIrradianceVolume {
  const volume = new BakedIrradianceVolume(options), scene = source instanceof Scene ? source : undefined;
  if (!(source instanceof Scene) && !(source instanceof EnvironmentMap)) throw new TypeError('Probe bake requires Scene or EnvironmentMap.');
  const environment = source instanceof EnvironmentMap ? source : source.environment;
  if (environment?.destroyed) throw new RangeError('Destroyed bake environment.');
  const ctx = new Context(scene, options), [nx, ny, nz] = volume.resolution, terms = volume.order === 1 ? 4 : 9;
  const p = [0, 0, 0], d = [0, 0, 0], rgb = [0, 0, 0], hp = [0, 0, 0], hn = [0, 0, 0], direct = [0, 0, 0], b = new Float64Array(9);
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    p[0] = volume.min[0] + x / (nx - 1) * (volume.max[0] - volume.min[0]); p[1] = volume.min[1] + y / (ny - 1) * (volume.max[1] - volume.min[1]); p[2] = volume.min[2] + z / (nz - 1) * (volume.max[2] - volume.min[2]);
    const base = ((z * ny + y) * nx + x) * terms * 3;
    for (let i = 0; i < ctx.samples; i++) {
      d[1] = 1 - 2 * (i + 0.5) / ctx.samples; const r = Math.sqrt(1 - d[1] * d[1]); d[0] = r * Math.cos(i * 2.399963229728653); d[2] = r * Math.sin(i * 2.399963229728653);
      const hit = ctx.bvh.hit(p, d, Infinity);
      if (hit) {
        for (let c = 0; c < 3; c++) { hp[c] = p[c] + d[c] * hit.distance; hn[c] = hit.triangle.n[c] + hit.triangle.n[c + 3] + hit.triangle.n[c + 6]; }
        normalize(hn); if (hn[0] * d[0] + hn[1] * d[1] + hn[2] * d[2] > 0) for (let c = 0; c < 3; c++) hn[c] *= -1;
        ctx.direct(hp, hn, direct, hit.triangle); for (let c = 0; c < 3; c++) rgb[c] = direct[c] * hit.triangle.mesh.material.color[c];
      } else if (environment) { radiance(environment, d, rgb); for (let c = 0; c < 3; c++) rgb[c] *= scene?.environmentIntensity ?? 1; }
      else rgb.fill(scene?.ambientLight ?? 0);
      basis(d[0], d[1], d[2], b);
      for (let k = 0; k < terms; k++) for (let c = 0; c < 3; c++) volume.coefficients[base + k * 3 + c] += rgb[c] * b[k] * 4 * Math.PI / ctx.samples * bands[k];
    }
    // Analytic delta-light projection avoids missing narrow/direct light sources in sphere samples.
    if (scene) {
      const sun = scene.directionalLight;
      const project = (direction: number[], color: readonly number[], gain: number, far: number): void => {
        if (!gain || ctx.bvh.hit(p, direction, far)) return;
        basis(direction[0], direction[1], direction[2], b);
        for (let k = 0; k < terms; k++) for (let c = 0; c < 3; c++) volume.coefficients[base + k * 3 + c] += color[c] * gain * Math.PI * bands[k] * b[k];
      };
      d[0] = sun.direction.x; d[1] = sun.direction.y; d[2] = sun.direction.z; normalize(d); project(d, sun.color, sun.intensity, Infinity);
      for (const lights of [scene.pointLights, scene.spotLights]) for (const light of lights) {
        d[0] = light.position.x - p[0]; d[1] = light.position.y - p[1]; d[2] = light.position.z - p[2]; const distance = Math.hypot(...d);
        if (distance <= ctx.bias || (light.range && distance >= light.range)) continue; normalize(d);
        let gain = light.intensity / Math.max(0.01, distance * distance); if (light.range) gain *= (1 - (distance / light.range) ** 4) ** 2;
        if (light instanceof SpotLight) { const cone = -(d[0] * light.direction.x + d[1] * light.direction.y + d[2] * light.direction.z) / light.direction.length(); const t = Math.max(0, Math.min(1, (cone - Math.cos(light.outerAngle)) / (Math.cos(light.innerAngle) - Math.cos(light.outerAngle)))); gain *= t * t * (3 - 2 * t); }
        project(d, light.color, gain, distance - ctx.bias);
      }
    }
  }
  if (volume.coefficients.some(v => !Number.isFinite(v))) throw new RangeError('Baked irradiance exceeds Float32 storage.');
  return volume;
}
const bindings = new WeakMap<Mesh, BakedIrradianceVolume>();
export function bindIrradianceVolume(mesh: Mesh, volume: BakedIrradianceVolume | undefined): void {
  if (!(mesh instanceof Mesh) || (volume !== undefined && !(volume instanceof BakedIrradianceVolume))) throw new TypeError('Invalid irradiance binding.');
  if (volume) bindings.set(mesh, volume); else bindings.delete(mesh);
}
export function meshIrradianceVolume(mesh: Mesh): BakedIrradianceVolume | undefined { return bindings.get(mesh); }
/** Internal renderer bridge: 36 SH floats + enabled,0,0,0. No per-draw allocations. */
export function fillMeshIrradiance(mesh: Mesh, out: Float32Array, offset = 0): void {
  if (!Number.isInteger(offset) || offset < 0 || out.length < offset + 40) throw new RangeError('Irradiance output needs 40 floats.');
  out.fill(0, offset, offset + 40); const volume = bindings.get(mesh); if (!volume) return;
  const e = mesh.updateWorldMatrix().elements;
  out[offset + 36] = volume.sampleSH(e[12], e[13], e[14], out, offset) ? 1 : 0;
}
