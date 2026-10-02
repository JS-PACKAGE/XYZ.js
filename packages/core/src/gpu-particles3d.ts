import { Object3D } from './object3d.js';
import {
  GPU_PARTICLE_COMMAND_FLOATS,
  gpuParticles3DLimits,
} from '../../../src/data/gpu-particles3d.js';

export type GPUParticleVector3 = readonly [number, number, number];
export type GPUParticleColor = readonly [number, number, number, number];
export interface GPUParticleEmitter3DOptions {
  readonly capacity: number;
  readonly rate?: number;
  /** Fixed seconds per emission command; expiry is exclusive. */
  readonly lifetime?: number;
  readonly seed?: number;
  readonly space?: 'local' | 'world';
  readonly velocityMin?: GPUParticleVector3;
  readonly velocityMax?: GPUParticleVector3;
  readonly gravity?: GPUParticleVector3;
  /** Linear RGB, straight alpha. */
  readonly startColor?: GPUParticleColor;
  readonly endColor?: GPUParticleColor;
  /** Billboard diameters in world units (not pixels). */
  readonly startSize?: number;
  readonly endSize?: number;
}

function scalar(
  value: number,
  name: string,
  low: number,
  high: number,
): number {
  if (!Number.isFinite(value) || value < low || value > high)
    throw new RangeError(`${name} must be finite in [${low}, ${high}].`);
  return value;
}
function tuple<T extends GPUParticleVector3 | GPUParticleColor>(
  value: T,
  length: number,
  name: string,
  low: number,
  high: number,
): T {
  if (value.length !== length)
    throw new RangeError(`${name} requires ${length} components.`);
  for (const component of value) scalar(component, name, low, high);
  return Object.freeze([...value]) as unknown as T;
}

/**
 * A bounded emission-command ring, never a CPU position/velocity pool.
 * Native vertex shaders derive motion and appearance from seed and birth time.
 * Rate admission is chronological drop-new, with no overflow backlog. World
 * commands snapshot the emitter's affine transform; local commands follow it.
 * A moving emitter is sampled at the current Scene tick (not interpolated births).
 */
export class GPUParticleEmitter3D extends Object3D {
  readonly capacity: number;
  readonly rate: number;
  readonly lifetime: number;
  readonly seed: number;
  readonly space: 'local' | 'world';
  readonly velocityMin: GPUParticleVector3;
  readonly velocityMax: GPUParticleVector3;
  readonly gravity: GPUParticleVector3;
  readonly startColor: GPUParticleColor;
  readonly endColor: GPUParticleColor;
  readonly startSize: number;
  readonly endSize: number;
  private commands: Float32Array;
  private commandWords: Uint32Array;
  private births: Float64Array;
  private head = 0;
  private count = 0;
  private clock = 0;
  private epoch = 0;
  private fraction = 0;
  private sequence = 0;
  private running = true;
  private frozen = false;
  private revision = 0;
  private dropped = 0;
  private readonly resourceOwners = new Set<() => void>();

  constructor(options: GPUParticleEmitter3DOptions) {
    super();
    const limits = gpuParticles3DLimits;
    if (!Number.isInteger(options.capacity))
      throw new RangeError('GPU particle capacity must be an integer.');
    this.capacity = scalar(options.capacity, 'capacity', 1, limits.maxCapacity);
    this.rate = scalar(options.rate ?? 0, 'rate', 0, limits.maxRate);
    this.lifetime = scalar(
      options.lifetime ?? 2,
      'lifetime',
      Number.EPSILON,
      limits.maxLifetime,
    );
    const seed = options.seed ?? 1;
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff)
      throw new RangeError(
        'GPU particle seed must be an unsigned 32-bit integer.',
      );
    this.seed = seed;
    this.space = options.space ?? 'local';
    if (this.space !== 'local' && this.space !== 'world')
      throw new RangeError('GPU particle space must be local or world.');
    this.velocityMin = tuple(
      options.velocityMin ?? [0, 1, 0],
      3,
      'velocityMin',
      -limits.maxMagnitude,
      limits.maxMagnitude,
    );
    this.velocityMax = tuple(
      options.velocityMax ?? this.velocityMin,
      3,
      'velocityMax',
      -limits.maxMagnitude,
      limits.maxMagnitude,
    );
    for (let axis = 0; axis < 3; axis++)
      if (this.velocityMax[axis] < this.velocityMin[axis])
        throw new RangeError(
          'velocityMax must be >= velocityMin on every axis.',
        );
    this.gravity = tuple(
      options.gravity ?? [0, -1, 0],
      3,
      'gravity',
      -limits.maxMagnitude,
      limits.maxMagnitude,
    );
    this.startColor = tuple(
      options.startColor ?? [1, 1, 1, 1],
      4,
      'startColor',
      0,
      1,
    );
    this.endColor = tuple(
      options.endColor ?? [1, 1, 1, 0],
      4,
      'endColor',
      0,
      1,
    );
    this.startSize = scalar(
      options.startSize ?? 0.1,
      'startSize',
      0,
      limits.maxMagnitude,
    );
    this.endSize = scalar(
      options.endSize ?? this.startSize,
      'endSize',
      0,
      limits.maxMagnitude,
    );
    this.commands = new Float32Array(
      this.capacity * GPU_PARTICLE_COMMAND_FLOATS,
    );
    this.commandWords = new Uint32Array(this.commands.buffer);
    this.births = new Float64Array(this.capacity);
  }

  get activeCount(): number {
    return this.count;
  }
  get droppedCount(): number {
    return this.dropped;
  }
  get time(): number {
    return this.clock;
  }
  get emitting(): boolean {
    return this.running;
  }
  get paused(): boolean {
    return this.frozen;
  }
  start(): void {
    this.assertAlive();
    this.running = true;
  }
  stop(): void {
    this.running = false;
    this.fraction = 0;
  }
  pause(): void {
    this.assertAlive();
    this.frozen = true;
  }
  resume(): void {
    this.assertAlive();
    this.frozen = false;
  }

  /** Explicit bursts are allowed while stopped/paused; return accepted commands. */
  burst(requested: number): number {
    this.assertAlive();
    if (!Number.isSafeInteger(requested) || requested < 0)
      throw new RangeError(
        'GPU particle burst must be a nonnegative safe integer.',
      );
    const accepted = Math.min(requested, this.capacity - this.count);
    if (accepted) this.updateWorldMatrix();
    for (let i = 0; i < accepted; i++)
      this.admit(this.clock, this.sequence + i);
    this.sequence = (this.sequence + requested) >>> 0;
    this.dropped += requested - accepted;
    return accepted;
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
    this.fraction = 0;
    this.revision++;
    this.releaseNative();
  }

  /** @internal Scene advances once after physics; Game pause never advances it. */
  updateSimulation(delta: number): void {
    if (this.destroyed) return;
    if (!Number.isFinite(delta) || delta < 0)
      throw new RangeError(
        'GPU particle delta must be finite and nonnegative.',
      );
    if (this.frozen || delta === 0) return;
    const end = this.clock + delta;
    if (!Number.isFinite(end) || end > Number.MAX_SAFE_INTEGER)
      throw new RangeError(
        'GPU particle command clock exceeds precise time range.',
      );
    if (this.running && this.rate > 0) {
      const total = this.fraction + delta * this.rate;
      if (!Number.isSafeInteger(Math.floor(total)))
        throw new RangeError(
          'GPU particle rate command count exceeds precise integer range.',
        );
      const requested = Math.floor(total + 1e-10);
      const start = this.clock + (1 - this.fraction) / this.rate;
      this.fraction = Math.max(0, total - requested);
      if (requested) this.updateWorldMatrix();
      let index = 0;
      const period = Math.max(1, Math.ceil(this.lifetime * this.rate - 1e-9));
      while (index < requested) {
        const birth = start + index / this.rate;
        this.expire(birth);
        if (this.count < this.capacity) {
          this.admit(birth, this.sequence + index);
          index++;
        } else {
          // A saturated fixed-lifetime stream repeats its admitted phases every
          // period arrivals. Skip whole cycles only after all old/burst commands
          // have been replaced by this frame's constant-rate stream.
          const oldest = this.births[this.head];
          if (oldest >= start && period >= this.capacity) {
            const cycles = Math.floor((requested - index - 1) / period);
            if (cycles > 0) {
              const shift = (cycles * period) / this.rate;
              for (let j = 0; j < this.count; j++) {
                const slot = (this.head + j) % this.capacity;
                this.births[slot] += shift;
                const base = slot * GPU_PARTICLE_COMMAND_FLOATS;
                this.commands[base] = this.births[slot] - this.epoch;
                this.commandWords[base + 1] =
                  (this.commandWords[base + 1] + cycles * period) >>> 0;
              }
              this.revision++;
              this.dropped += cycles * (period - this.capacity);
              index += cycles * period;
              continue;
            }
          }
          const next = Math.min(
            requested,
            Math.max(
              index + 1,
              Math.ceil((oldest + this.lifetime - start) * this.rate - 1e-9),
            ),
          );
          this.dropped += next - index;
          index = next;
        }
      }
      this.sequence = (this.sequence + requested) >>> 0;
    }
    this.clock = end;
    this.expire(end);
    const epoch =
      Math.floor(end / gpuParticles3DLimits.clockEpochSeconds) *
      gpuParticles3DLimits.clockEpochSeconds;
    if (epoch !== this.epoch) {
      this.epoch = epoch;
      for (let j = 0; j < this.count; j++) {
        const slot = (this.head + j) % this.capacity;
        this.commands[slot * GPU_PARTICLE_COMMAND_FLOATS] =
          this.births[slot] - epoch;
      }
      this.revision++;
    }
  }

  /** @internal Immutable emission metadata consumed by the two native modules. */
  get commandData(): Float32Array {
    return this.commands;
  }
  /** @internal */
  get commandVersion(): number {
    return this.revision;
  }
  /** @internal */
  get commandHead(): number {
    return this.head;
  }
  /** @internal */
  get shaderTime(): number {
    return this.clock - this.epoch;
  }
  /** @internal Native owners release synchronously on clear/destroy/removal. */
  ownNative(release: () => void): () => void {
    this.assertAlive();
    this.resourceOwners.add(release);
    return () => this.resourceOwners.delete(release);
  }

  override detach(scene: Parameters<Object3D['detach']>[0]): void {
    super.detach(scene);
    this.releaseNative();
  }
  protected override onDestroy(): void {
    this.running = false;
    this.clear();
    this.commands = new Float32Array(0);
    this.commandWords = new Uint32Array(0);
    this.births = new Float64Array(0);
  }
  private expire(at: number): void {
    while (this.count && this.births[this.head] + this.lifetime <= at + 1e-10) {
      this.head = (this.head + 1) % this.capacity;
      this.count--;
    }
  }
  private admit(at: number, sequence: number): void {
    const slot = (this.head + this.count) % this.capacity;
    const base = slot * GPU_PARTICLE_COMMAND_FLOATS;
    this.births[slot] = at;
    this.commands[base] = at - this.epoch;
    this.commandWords[base + 1] = sequence >>> 0;
    this.commands.set(this.worldMatrix.elements, base + 4);
    this.count++;
    this.revision++;
  }
  private releaseNative(): void {
    for (const release of this.resourceOwners) release();
    this.resourceOwners.clear();
  }
  private assertAlive(): void {
    if (this.destroyed) throw new Error('GPU particle emitter is destroyed.');
  }
}
