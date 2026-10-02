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

export function validateVec3(value: AudioVec3, name: string): void {
  if (
    !value ||
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  )
    throw new AudioError(`${name} must have finite x, y and z.`);
}

export function checkVec3(value: AudioVec3, name: string): AudioVec3 {
  validateVec3(value, name);
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
  constructor(
    private readonly context: () => AudioContext | undefined,
    private readonly contexts?: () => readonly AudioContext[],
  ) {}

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
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      throw new AudioError('Listener position must have finite x, y and z.');
    this.pos.x = x;
    this.pos.y = y;
    this.pos.z = z;
    this.touched = true;
    this.apply();
  }

  /** Forward and up must be non-zero and not parallel. */
  setOrientation(forward: AudioVec3, up: AudioVec3 = this.upward): void {
    validateVec3(forward, 'Listener forward');
    validateVec3(up, 'Listener up');
    const f = forward,
      u = up;
    if (lengthSquared(f) === 0 || lengthSquared(u) === 0)
      throw new AudioError('Listener orientation vectors must be non-zero.');
    const nx = f.y * u.z - f.z * u.y,
      ny = f.z * u.x - f.x * u.z,
      nz = f.x * u.y - f.y * u.x;
    if (
      nx * nx + ny * ny + nz * nz <=
      1e-12 * lengthSquared(f) * lengthSquared(u)
    )
      throw new AudioError('Listener forward and up must not be parallel.');
    this.fwd.x = f.x;
    this.fwd.y = f.y;
    this.fwd.z = f.z;
    this.upward.x = u.x;
    this.upward.y = u.y;
    this.upward.z = u.z;
    this.touched = true;
    this.apply();
  }

  /** @internal Replays retained state; called after unlock and on each change. */
  apply(): void {
    if (!this.touched) return;
    const contexts = this.contexts?.();
    if (contexts) {
      for (const context of contexts) this.applyTo(context);
    } else {
      const context = this.context();
      if (context) this.applyTo(context);
    }
  }

  private applyTo(context: AudioContext): void {
    if (context.state === 'closed') return;
    const listener = context.listener;
    // Firefox exposes the standard vector setters, but not the listener AudioParams.
    if (listener.positionX) {
      listener.positionX.value = this.pos.x;
      listener.positionY.value = this.pos.y;
      listener.positionZ.value = this.pos.z;
    } else {
      listener.setPosition(this.pos.x, this.pos.y, this.pos.z);
    }
    if (listener.forwardX) {
      listener.forwardX.value = this.fwd.x;
      listener.forwardY.value = this.fwd.y;
      listener.forwardZ.value = this.fwd.z;
      listener.upX.value = this.upward.x;
      listener.upY.value = this.upward.y;
      listener.upZ.value = this.upward.z;
    } else {
      listener.setOrientation(
        this.fwd.x,
        this.fwd.y,
        this.fwd.z,
        this.upward.x,
        this.upward.y,
        this.upward.z,
      );
    }
  }
}
