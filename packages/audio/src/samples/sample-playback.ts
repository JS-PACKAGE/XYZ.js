import { gameplayAssetLimits } from '../../../../src/data/gameplay-assets.js';
import type { AudioPlayOptions } from '../audio-manager.js';
import { AudioError } from '../errors.js';

export interface SamplePlayOptions extends AudioPlayOptions {
  volume?: number;
  playbackRate?: number;
  offset?: number;
  /** Absolute AudioContext time, independent of the Game clock. */
  scheduledStartTime?: number;
}

export type SamplePlaybackState = 'playing' | 'paused' | 'stopped' | 'ended';

/** BufferSources are one-shot; pause/seek replace them without re-decoding the asset. */
export class SamplePlayback {
  private status: SamplePlaybackState = 'playing';
  private source?: AudioBufferSourceNode;
  private readonly gain: GainNode;
  private offset: number;
  private startsAt: number;
  private speed: number;
  private level: number;
  readonly loop: boolean;

  /** @internal */
  constructor(
    private readonly context: AudioContext,
    private readonly buffer: AudioBuffer,
    bus: GainNode,
    options: SamplePlayOptions,
    private readonly release: (playback: SamplePlayback) => void,
  ) {
    this.offset = options.offset ?? 0;
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
    this.startsAt = Math.max(this.startsAt, context.currentTime);
    if (this.loop) this.offset %= buffer.duration;
    this.gain = context.createGain();
    this.gain.gain.value = this.level;
    this.gain.connect(bus);
    try {
      this.startSource();
    } catch (error) {
      this.gain.disconnect();
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
    return this.loop
      ? position % this.buffer.duration
      : Math.min(position, this.buffer.duration);
  }

  get volume(): number {
    return this.level;
  }

  set volume(value: number) {
    this.checkVolume(value);
    this.level = value;
    this.gain.gain.value = value;
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

  pause(): void {
    if (this.status !== 'playing') return;
    this.offset = this.position;
    this.status = 'paused';
    this.clearSource();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.startsAt = this.context.currentTime;
    this.status = 'playing';
    try {
      this.startSource();
    } catch (error) {
      this.status = 'paused';
      throw error;
    }
  }

  seek(seconds: number): void {
    this.checkPosition(seconds);
    if (this.status === 'ended' || this.status === 'stopped')
      throw new AudioError('Cannot seek a finished sample playback.');
    const scheduled = Math.max(this.startsAt, this.context.currentTime);
    this.clearSource();
    this.offset = this.loop ? seconds % this.buffer.duration : seconds;
    this.startsAt = scheduled;
    if (this.status === 'playing') {
      try {
        this.startSource();
      } catch (error) {
        this.status = 'paused';
        throw error;
      }
    }
  }

  stop(): void {
    if (this.status === 'stopped' || this.status === 'ended') return;
    this.offset = this.position;
    this.status = 'stopped';
    this.clearSource();
    this.gain.disconnect();
    this.release(this);
  }

  private startSource(): void {
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = this.loop;
    source.playbackRate.value = this.speed;
    source.connect(this.gain);
    this.source = source;
    source.onended = () => {
      if (this.source !== source || this.status !== 'playing') return;
      this.source = undefined;
      this.offset = this.buffer.duration;
      this.status = 'ended';
      source.disconnect();
      this.gain.disconnect();
      this.release(this);
    };
    try {
      source.start(this.startsAt, this.offset);
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

  private checkPosition(value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > this.buffer.duration)
      throw new AudioError(
        'Sample position must be within the decoded duration.',
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
