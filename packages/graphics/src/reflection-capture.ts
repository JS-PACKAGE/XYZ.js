import { PerspectiveCamera } from '../../core/src/perspective-camera.js';
import {
  EnvironmentMap,
  type CubemapFaces,
} from '../../core/src/environment.js';
import {
  ReflectionProbe,
  type ReflectionProbeCaptureOptions,
} from '../../core/src/reflection-probe.js';
import type { Scene } from '../../core/src/scene.js';
import { reflectionCaptureLimits } from '../../../src/data/rendering.js';
import { GraphicsError } from './errors.js';

export function captureConfiguration(
  probe: ReflectionProbe,
  options: ReflectionProbeCaptureOptions = {},
) {
  probe.validate();
  const size = options.size ?? probe.captureSize;
  const near = options.near ?? 0.1,
    far = options.far ?? 100;
  const maxBytes = options.maxBytes ?? reflectionCaptureLimits.maximumBytes;
  // Six colors + depth + padded GPU readback, plus the live HDR/MSAA scene target.
  const bytes = size * size * 96 + Math.ceil((size * 8) / 256) * 256 * size * 6;
  if (
    !Number.isInteger(size) ||
    size < 2 ||
    size > reflectionCaptureLimits.maximumSize ||
    !Number.isFinite(near) ||
    !Number.isFinite(far) ||
    near <= 0 ||
    far <= near ||
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < bytes
  )
    throw new RangeError(
      'Reflection capture requires size 2..512, 0 < near < far, and sufficient maxBytes.',
    );
  options.signal?.throwIfAborted();
  return { size, near, far, bytes };
}

/** All face encoding is synchronous: no temporarily changed Scene state crosses an await. */
export function encodeProbeFaces(
  scene: Scene,
  probe: ReflectionProbe,
  options: ReflectionProbeCaptureOptions,
  encode: (face: number, camera: PerspectiveCamera) => void,
): void {
  if (scene.destroyed)
    throw new GraphicsError('Cannot capture a destroyed scene.');
  const { near, far } = captureConfiguration(probe, options);
  const camera = new PerspectiveCamera();
  camera.fov = Math.PI / 2;
  camera.near = near;
  camera.far = far;
  camera.position.copy(probe.position);
  const originalCamera = scene.camera3D,
    background = scene.background;
  const settings = scene.postProcessing;
  const graph = scene.renderGraph;
  const enabled = settings.enabled,
    taa = settings.taa,
    ssr = settings.ssr;
  const probes = scene.reflectionProbes.map(
    (entry) => [entry, entry.enabled] as const,
  );
  const objects = (options.exclude ?? []).map(
    (entry) => [entry, entry.visible] as const,
  );
  // Face bases match EnvironmentMap.fromCubemap, including deterministic Y-face roll.
  const h = Math.SQRT1_2;
  const rotations = [
    [0, -h, 0, h],
    [0, h, 0, h],
    [h, 0, 0, h],
    [-h, 0, 0, h],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
  ];
  try {
    scene.camera3D = camera;
    if (options.includeBackground === false) scene.background = undefined;
    settings.enabled = settings.taa = settings.ssr = false;
    scene.renderGraph = undefined;
    for (const [entry] of probes) entry.enabled = false;
    for (const [entry] of objects) entry.visible = false;
    for (let face = 0; face < 6; face++) {
      options.signal?.throwIfAborted();
      const q = rotations[face]!;
      camera.rotation.set(q[0]!, q[1]!, q[2]!, q[3]!);
      camera.updateMatrix(1);
      encode(face, camera);
    }
  } finally {
    scene.camera3D = originalCamera;
    scene.background = background;
    settings.enabled = enabled;
    settings.taa = taa;
    settings.ssr = ssr;
    scene.renderGraph = graph;
    for (const [entry, value] of probes) entry.enabled = value;
    for (const [entry, value] of objects) entry.visible = value;
  }
}

export function halfFloat(value: number): number {
  const sign = value & 0x8000 ? -1 : 1,
    exponent = (value >> 10) & 31,
    mantissa = value & 1023;
  return exponent === 0
    ? sign * mantissa * 2 ** -24
    : exponent === 31
      ? mantissa
        ? NaN
        : sign * Infinity
      : sign * (1 + mantissa / 1024) * 2 ** (exponent - 15);
}
export function capturedEnvironment(
  size: number,
  faces: Float32Array[],
  signal?: AbortSignal,
): EnvironmentMap {
  signal?.throwIfAborted();
  return EnvironmentMap.fromCubemap(size, faces as unknown as CubemapFaces, 4);
}

/** One pending capture and at most one due probe per frame, paced by Scene simulation time. */
export class ProbeCaptureScheduler {
  private readonly next = new WeakMap<ReflectionProbe, number>();
  private pending = false;
  schedule(
    scene: Scene,
    capture: (probe: ReflectionProbe) => Promise<EnvironmentMap>,
    error: (error: unknown) => void,
  ): void {
    if (this.pending || scene.destroyed) return;
    const now = scene.presentationTime;
    for (const probe of scene.reflectionProbes) {
      if (
        !probe.enabled ||
        !probe.dynamic ||
        now < (this.next.get(probe) ?? -Infinity)
      )
        continue;
      this.next.set(probe, now + probe.captureInterval);
      this.pending = true;
      capture(probe)
        .then((map) => {
          if (
            !scene.destroyed &&
            scene.reflectionProbes.includes(probe) &&
            probe.enabled &&
            probe.dynamic
          )
            probe.adoptCapture(map);
          else map.destroy();
        }, error)
        .finally(() => {
          this.pending = false;
        });
      break;
    }
  }
}
