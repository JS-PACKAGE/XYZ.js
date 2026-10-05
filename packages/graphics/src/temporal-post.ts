import { Matrix4 } from '../../math/src/index.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
import type { PostProcessingSettings } from '../../core/src/render-settings.js';

function halton(index: number, base: number): number {
  let result = 0,
    fraction = 1;
  while (index > 0) {
    fraction /= base;
    result += fraction * (index % base);
    index = Math.floor(index / base);
  }
  return result;
}

/** History belongs to one scene, camera, viewport and uninterrupted rendered sequence. */
export class TemporalPostState {
  readonly currentVP = new Matrix4();
  readonly inverseVP = new Matrix4();
  readonly previousVP = new Matrix4();
  readonly cameraPosition = new Float32Array(3);
  readonly jitter = new Float32Array(2);
  historyValid = false;
  width = 0;
  height = 0;
  private scene: object | undefined;
  private camera: Camera3D | undefined;
  private sample = 0;
  private enabled = false;
  private readonly previousPosition = new Float32Array(3);
  private readonly previousRotation = new Float32Array(4);
  private readonly projection = new Matrix4();
  private near = 0;
  private far = 0;
  private projectionScale = 0;
  private aspect = 0;

  begin(
    scene: object,
    camera: Camera3D,
    width: number,
    height: number,
    settings: PostProcessingSettings,
    aspect = width / height,
  ): Matrix4 {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1
    )
      throw new RangeError(
        'Temporal viewport must be positive integer dimensions.',
      );
    const p = camera.position,
      q = camera.rotation;
    const scale = 'fov' in camera ? camera.fov : camera.height / camera.zoom;
    const distance = Math.hypot(
      p.x - this.previousPosition[0]!,
      p.y - this.previousPosition[1]!,
      p.z - this.previousPosition[2]!,
    );
    const rotationDot = Math.abs(
      q.x * this.previousRotation[0]! +
        q.y * this.previousRotation[1]! +
        q.z * this.previousRotation[2]! +
        q.w * this.previousRotation[3]!,
    );
    if (
      scene !== this.scene ||
      camera !== this.camera ||
      width !== this.width ||
      height !== this.height ||
      aspect !== this.aspect ||
      settings.taa !== this.enabled ||
      distance > settings.taaCameraCutDistance ||
      rotationDot < 0.5 ||
      camera.near !== this.near ||
      camera.far !== this.far ||
      scale !== this.projectionScale
    )
      this.invalidate();
    this.scene = scene;
    this.camera = camera;
    this.width = width;
    this.height = height;
    this.enabled = settings.taa;
    this.near = camera.near;
    this.far = camera.far;
    this.projectionScale = scale;
    this.aspect = aspect;
    this.cameraPosition[0] = p.x;
    this.cameraPosition[1] = p.y;
    this.cameraPosition[2] = p.z;
    this.projection.copy(camera.updateMatrix(aspect));
    this.currentVP.copy(this.projection);
    this.jitter[0] = settings.taa
      ? ((halton(this.sample + 1, 2) - 0.5) * 2) / width
      : 0;
    this.jitter[1] = settings.taa
      ? ((halton(this.sample + 1, 3) - 0.5) * 2) / height
      : 0;
    const e = this.currentVP.elements;
    // Left-multiply by clip-space translation: works for perspective and orthographic cameras.
    for (let column = 0; column < 4; column++) {
      const i = column * 4;
      e[i] = e[i]! + this.jitter[0]! * e[i + 3]!;
      e[i + 1] = e[i + 1]! + this.jitter[1]! * e[i + 3]!;
    }
    this.inverseVP.copy(this.currentVP).invert();
    return this.currentVP;
  }

  commit(): void {
    this.previousVP.copy(this.currentVP);
    this.previousPosition.set(this.cameraPosition);
    if (this.camera) {
      const q = this.camera.rotation;
      this.previousRotation[0] = q.x;
      this.previousRotation[1] = q.y;
      this.previousRotation[2] = q.z;
      this.previousRotation[3] = q.w;
    }
    this.historyValid = this.enabled;
    this.sample = (this.sample + 1) % 1024;
  }

  invalidate(): void {
    this.historyValid = false;
    this.sample = 0;
  }
}

/** Shared std140/WGSL layout: three matrices followed by three vec4s. */
export function writeTemporalUniforms(
  data: Float32Array,
  state: TemporalPostState,
  settings: PostProcessingSettings,
): void {
  data.set(state.currentVP.elements, 0);
  data.set(state.inverseVP.elements, 16);
  data.set(state.previousVP.elements, 32);
  data[48] = state.cameraPosition[0]!;
  data[49] = state.cameraPosition[1]!;
  data[50] = state.cameraPosition[2]!;
  data[51] = state.historyValid ? settings.taaHistoryWeight : 0;
  data[52] = settings.taaDepthThreshold;
  data[53] = settings.ssrSteps;
  data[54] = settings.ssrThickness;
  data[55] = settings.ssrMaxDistance;
  data[56] = settings.ssrRoughness;
  data[57] = settings.ssrStrength;
  data[58] = state.width;
  data[59] = state.height;
}
