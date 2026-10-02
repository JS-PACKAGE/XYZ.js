import { gameplayAssetLimits } from '../../../../src/data/gameplay-assets.js';
import type { AudioPlayOptions } from '../audio-manager.js';
import {
  applyPannerOptions,
  checkSpatialOptions,
  validateVec3,
  type AudioVec3,
  type SpatialAudioOptions,
} from './spatial.js';
import { AudioError } from '../errors.js';

export interface SamplePlayOptions extends AudioPlayOptions {
  volume?: number;
  playbackRate?: number;
  offset?: number;
  /** Routes the playback through a PannerNode positioned in world space. */
  spatial?: SpatialAudioOptions;
  /** Absolute AudioContext time, independent of the Game clock. */
  scheduledStartTime?: number;
  /**
   * Restricts playback to part of the buffer (an audio sprite). `offset` stays an absolute buffer
   * position and defaults to `region.start`; a looping playback loops inside the region.
   */
  region?: { readonly start: number; readonly end: number };
}

export type SamplePlaybackState = 'playing' | 'paused' | 'stopped' | 'ended';

/** BufferSources are one-shot; pause/seek replace them without re-decoding the asset. */
export class SamplePlayback {
  private status: SamplePlaybackState = 'playing';
  private source?: AudioBufferSourceNode;
  private readonly gain: GainNode;
  private readonly panner?: PannerNode;
  private offset: number;
  private startsAt: number;
  private speed: number;
  private level: number;
  readonly loop: boolean;
  private readonly regionStart: number;
  private readonly regionEnd: number;
  private readonly regional: boolean;
  private readonly pauseReasons = new Set<string>();
  private startDelay = 0;

  /** @internal */
  constructor(
    private readonly context: AudioContext,
    private readonly buffer: AudioBuffer,
    bus: GainNode,
    options: SamplePlayOptions,
    private readonly release: (playback: SamplePlayback) => void,
    private readonly activity?: (active: boolean, delay?: number) => void,
  ) {
    const region = options.region;
    this.regional = region !== undefined;
    this.regionStart = region?.start ?? 0;
    this.regionEnd = region?.end ?? buffer.duration;
    if (
      !Number.isFinite(this.regionStart) ||
      !Number.isFinite(this.regionEnd) ||
      this.regionStart < 0 ||
      this.regionStart >= this.regionEnd ||
      this.regionEnd > buffer.duration
    )
      throw new AudioError(
        'Sample region must satisfy 0 <= start < end <= decoded duration.',
      );
    this.offset = options.offset ?? this.regionStart;
    this.startsAt = options.scheduledStartTime ?? context.currentTime;
    this.speed = options.playbackRate ?? 1;
    this.level = options.volume ?? 1;
    this.loop = options.loop ?? false;
    if (!Number.isFinite(this.startsAt) || this.startsAt < 0)
      throw new AudioError(
        'Scheduled start time must be finite and nonnegative.',
      );
    this.checkPosition(this.offset);
    this.checkRate(this.speed);
    this.checkVolume(this.level);
    const spatial = options.spatial && checkSpatialOptions(options.spatial);
    this.startsAt = Math.max(this.startsAt, context.currentTime);
    if (this.loop) this.offset = this.wrap(this.offset);
    this.gain = context.createGain();
    this.gain.gain.value = this.level;
    if (spatial) {
      this.panner = context.createPanner();
      applyPannerOptions(this.panner, spatial);
      this.gain.connect(this.panner);
      this.panner.connect(bus);
    } else this.gain.connect(bus);
    try {
      this.startSource();
      this.activity?.(
        true,
        Math.max(0, this.startsAt - this.context.currentTime),
      );
    } catch (error) {
      this.gain.disconnect();
      this.panner?.disconnect();
      throw error;
    }
  }

  get state(): SamplePlaybackState {
    return this.status;
  }

  get position(): number {
    let position = this.offset;
    if (this.status === 'playing')
      position +=
        Math.max(0, this.context.currentTime - this.startsAt) * this.speed;
    return this.loop ? this.wrap(position) : Math.min(position, this.regionEnd);
  }

  get volume(): number {
    return this.level;
  }

  set volume(value: number) {
    this.checkVolume(value);
    this.level = value;
    this.gain.gain.value = value;
  }

  /** World-space emitter position, or undefined for non-spatial playbacks. */
  get position3D(): Readonly<AudioVec3> | undefined {
    return this.panner
      ? {
          x: this.panner.positionX.value,
          y: this.panner.positionY.value,
          z: this.panner.positionZ.value,
        }
      : undefined;
  }

  set position3D(value: Readonly<AudioVec3>) {
    if (!this.panner)
      throw new AudioError('Playback was not created with spatial options.');
    validateVec3(value, 'Spatial position');
    this.panner.positionX.value = value.x;
    this.panner.positionY.value = value.y;
    this.panner.positionZ.value = value.z;
  }

  get playbackRate(): number {
    return this.speed;
  }

  set playbackRate(value: number) {
    this.checkRate(value);
    this.offset = this.position;
    if (this.context.currentTime >= this.startsAt)
      this.startsAt = this.context.currentTime;
    this.speed = value;
    if (this.source) this.source.playbackRate.value = value;
  }

  pause(reason = 'user'): void {
    if (this.status === 'stopped' || this.status === 'ended') return;
    this.pauseReasons.add(reason);
    if (this.status !== 'playing') return;
    this.offset = this.position;
    this.startDelay = Math.max(0, this.startsAt - this.context.currentTime);
    this.status = 'paused';
    this.clearSource();
    this.activity?.(false);
  }

  resume(reason = 'user'): void {
    if (
      !this.pauseReasons.delete(reason) ||
      this.pauseReasons.size ||
      this.status !== 'paused'
    )
      return;
    this.startsAt = this.context.currentTime + this.startDelay;
    this.status = 'playing';
    try {
      this.startSource();
      this.activity?.(
        true,
        Math.max(0, this.startsAt - this.context.currentTime),
      );
    } catch (error) {
      this.status = 'paused';
      this.pauseReasons.add(reason);
      throw error;
    }
  }

  seek(seconds: number): void {
    this.checkPosition(seconds);
    if (this.status === 'ended' || this.status === 'stopped')
      throw new AudioError('Cannot seek a finished sample playback.');
    const scheduled = Math.max(this.startsAt, this.context.currentTime);
    this.clearSource();
    this.offset = this.loop ? this.wrap(seconds) : seconds;
    this.startsAt = scheduled;
    if (this.status === 'playing') {
      try {
        this.startSource();
      } catch (error) {
        this.status = 'paused';
        this.pauseReasons.add('user');
        this.activity?.(false);
        throw error;
      }
    }
  }

  stop(): void {
    if (this.status === 'stopped' || this.status === 'ended') return;
    this.offset = this.position;
    this.status = 'stopped';
    this.clearSource();
    this.pauseReasons.clear();
    this.activity?.(false);
    this.gain.disconnect();
    this.panner?.disconnect();
    this.release(this);
  }

  private startSource(): void {
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = this.loop;
    if (this.loop && this.regional) {
      source.loopStart = this.regionStart;
      source.loopEnd = this.regionEnd;
    }
    source.playbackRate.value = this.speed;
    source.connect(this.gain);
    this.source = source;
    source.onended = () => {
      if (this.source !== source || this.status !== 'playing') return;
      this.source = undefined;
      this.offset = this.regionEnd;
      this.status = 'ended';
      this.pauseReasons.clear();
      this.activity?.(false);
      source.disconnect();
      this.gain.disconnect();
      this.panner?.disconnect();
      this.release(this);
    };
    try {
      if (this.regional && !this.loop)
        source.start(this.startsAt, this.offset, this.regionEnd - this.offset);
      else source.start(this.startsAt, this.offset);
    } catch (error) {
      this.source = undefined;
      source.onended = null;
      source.disconnect();
      throw error;
    }
  }

  private clearSource(): void {
    const source = this.source;
    if (!source) return;
    this.source = undefined;
    source.onended = null;
    try {
      source.stop();
    } finally {
      source.disconnect();
    }
  }

  /** Folds a position into the playable span; the whole buffer unless a region was given. */
  private wrap(position: number): number {
    const length = this.regionEnd - this.regionStart;
    return this.regionStart + ((position - this.regionStart) % length);
  }

  private checkPosition(value: number): void {
    if (
      !Number.isFinite(value) ||
      value < this.regionStart ||
      value > this.regionEnd
    )
      throw new AudioError(
        this.regional
          ? 'Sample position must be within the sprite region.'
          : 'Sample position must be within the decoded duration.',
      );
  }

  private checkRate(value: number): void {
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      value > gameplayAssetLimits.playbackRate
    )
      throw new AudioError(
        `Sample playback rate must be within (0, ${gameplayAssetLimits.playbackRate}].`,
      );
  }

  private checkVolume(value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new AudioError('Sample volume must be finite and within 0..1.');
  }
}
