import { AudioError } from '../errors.js';

export interface AudioVec3 {
  x: number;
  y: number;
  z: number;
}

export type SpatialDistanceModel = 'linear' | 'inverse' | 'exponential';
export type SpatialPanningModel = 'equalpower' | 'HRTF';

export interface SpatialAudioOptions {
  /** World-space emitter position; the listener uses the same right-handed units. */
  position: AudioVec3;
  refDistance?: number;
  maxDistance?: number;
  rolloffFactor?: number;
  distanceModel?: SpatialDistanceModel;
  panningModel?: SpatialPanningModel;
}

const DISTANCE_MODELS: readonly string[] = ['linear', 'inverse', 'exponential'];
const PANNING_MODELS: readonly string[] = ['equalpower', 'HRTF'];

export function checkVec3(value: AudioVec3, name: string): AudioVec3 {
  if (
    !value ||
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  )
    throw new AudioError(`${name} must have finite x, y and z.`);
  return { x: value.x, y: value.y, z: value.z };
}

function positive(value: number, name: string, allowZero = false): void {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0))
    throw new AudioError(
      `${name} must be finite and ${allowZero ? 'nonnegative' : 'positive'}.`,
    );
}

/** Validated once so a bad option cannot leave a half-built PannerNode graph. */
export function checkSpatialOptions(
  options: SpatialAudioOptions,
): Required<SpatialAudioOptions> {
  const spatial = {
    position: checkVec3(options.position, 'Spatial position'),
    refDistance: options.refDistance ?? 1,
    maxDistance: options.maxDistance ?? 10000,
    rolloffFactor: options.rolloffFactor ?? 1,
    distanceModel: options.distanceModel ?? 'inverse',
    panningModel: options.panningModel ?? 'equalpower',
  };
  positive(spatial.refDistance, 'Spatial refDistance');
  positive(spatial.maxDistance, 'Spatial maxDistance');
  positive(spatial.rolloffFactor, 'Spatial rolloffFactor', true);
  if (!DISTANCE_MODELS.includes(spatial.distanceModel))
    throw new AudioError('Unknown spatial distance model.');
  if (!PANNING_MODELS.includes(spatial.panningModel))
    throw new AudioError('Unknown spatial panning model.');
  // linear rolloff is only defined for rolloffFactor <= 1 and maxDistance > refDistance.
  if (spatial.distanceModel === 'linear') {
    if (spatial.rolloffFactor > 1)
      throw new AudioError('Linear spatial rolloffFactor must not exceed 1.');
    if (spatial.maxDistance <= spatial.refDistance)
      throw new AudioError('Spatial maxDistance must exceed refDistance.');
  }
  return spatial;
}

export function applyPannerOptions(
  panner: PannerNode,
  spatial: Required<SpatialAudioOptions>,
): void {
  panner.panningModel = spatial.panningModel;
  panner.distanceModel = spatial.distanceModel;
  panner.refDistance = spatial.refDistance;
  panner.maxDistance = spatial.maxDistance;
  panner.rolloffFactor = spatial.rolloffFactor;
  panner.positionX.value = spatial.position.x;
  panner.positionY.value = spatial.position.y;
  panner.positionZ.value = spatial.position.z;
}

function cross(a: AudioVec3, b: AudioVec3): AudioVec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function lengthSquared(v: AudioVec3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

/**
 * Manager-wide listener. State is retained before audio unlock and replayed onto the
 * native AudioListener once a context exists.
 */
export class AudioListenerState {
  private pos: AudioVec3 = { x: 0, y: 0, z: 0 };
  private fwd: AudioVec3 = { x: 0, y: 0, z: -1 };
  private upward: AudioVec3 = { x: 0, y: 1, z: 0 };
  /** Untouched listeners leave the browser's native defaults alone. */
  private touched = false;

  /** @internal */
  constructor(private readonly context: () => AudioContext | undefined) {}

  get position(): Readonly<AudioVec3> {
    return this.pos;
  }

  get forward(): Readonly<AudioVec3> {
    return this.fwd;
  }

  get up(): Readonly<AudioVec3> {
    return this.upward;
  }

  setPosition(x: number, y: number, z: number): void {
    this.pos = checkVec3({ x, y, z }, 'Listener position');
    this.touched = true;
    this.apply();
  }

  /** Forward and up must be non-zero and not parallel. */
  setOrientation(forward: AudioVec3, up: AudioVec3 = this.upward): void {
    const f = checkVec3(forward, 'Listener forward');
    const u = checkVec3(up, 'Listener up');
    if (lengthSquared(f) === 0 || lengthSquared(u) === 0)
      throw new AudioError('Listener orientation vectors must be non-zero.');
    const normal = cross(f, u);
    if (lengthSquared(normal) <= 1e-12 * lengthSquared(f) * lengthSquared(u))
      throw new AudioError('Listener forward and up must not be parallel.');
    this.fwd = f;
    this.upward = u;
    this.touched = true;
    this.apply();
  }

  /** @internal Replays retained state; called after unlock and on each change. */
  apply(): void {
    const context = this.context();
    if (!this.touched || !context || context.state === 'closed') return;
    const listener = context.listener;
    listener.positionX.value = this.pos.x;
    listener.positionY.value = this.pos.y;
    listener.positionZ.value = this.pos.z;
    listener.forwardX.value = this.fwd.x;
    listener.forwardY.value = this.fwd.y;
    listener.forwardZ.value = this.fwd.z;
    listener.upX.value = this.upward.x;
    listener.upY.value = this.upward.y;
    listener.upZ.value = this.upward.z;
  }
}
