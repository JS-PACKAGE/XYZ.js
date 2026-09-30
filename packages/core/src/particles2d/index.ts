import { AssetError, type Texture } from '../../../assets/src/index.js';
import type { Matrix3 } from '../../../math/src/index.js';
import { world2dLimits } from '../../../../src/data/world2d.js';
import { Group2D } from '../gameplay/group2d.js';
import {
  validateSource,
  type ColorRGBA,
  type Rect2D,
} from '../gameplay/contracts.js';
import { Sprite, type SpriteOptions } from '../sprite.js';

export type ParticleNozzle =
  | { kind: 'point' }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'circle'; radius: number };

export interface ParticleEmitterOptions {
  texture: Texture;
  source?: Rect2D;
  capacity: number;
  rate: number;
  lifetime: readonly [number, number];
  speed: readonly [number, number];
  angle: readonly [number, number];
  acceleration?: readonly [number, number];
  /** Logical width and height, not a random range or replacement source size. */
  startSize: readonly [number, number];
  endSize: readonly [number, number];
  startColor: ColorRGBA;
  endColor: ColorRGBA;
  nozzle?: ParticleNozzle;
  seed?: number;
  /** Simulation coordinates; independent of inherited world/screen rendering space. */
  space?: 'local' | 'world';
}

function pair(
  value: readonly [number, number],
  name: string,
  minimum = -Infinity,
): [number, number] {
  if (
    value.length !== 2 ||
    !value.every((n) => Number.isFinite(n) && n >= minimum)
  )
    throw new RangeError(
      `${name} must contain two finite values >= ${minimum}.`,
    );
  return [value[0], value[1]];
}
function range(
  value: readonly [number, number],
  name: string,
  minimum = -Infinity,
): [number, number] {
  const result = pair(value, name, minimum);
  if (result[1] < result[0])
    throw new RangeError(`${name} must be an ordered range.`);
  return result;
}
function color(
  value: ColorRGBA,
  name: string,
): [number, number, number, number] {
  if (
    value.length !== 4 ||
    !value.every((n) => Number.isFinite(n) && n >= 0 && n <= 1)
  )
    throw new RangeError(`${name} must contain four channels between 0 and 1.`);
  return [value[0], value[1], value[2], value[3]];
}

/** Still an ordinary Sprite: only its affine transform has different ownership. */
class ParticleSprite extends Sprite {
  private axisXX = 1;
  private axisXY = 0;
  private axisYX = 0;
  private axisYY = 1;
  // GameObject retains this tuple. Validated interpolation writes it in place instead
  // of invoking the public validating setter (and allocating callbacks) each tick.
  readonly particleColor = this.tint as [number, number, number, number];

  constructor(
    options: SpriteOptions,
    private readonly simulationSpace: 'local' | 'world',
  ) {
    super(options);
    this.renderEnabled = false;
    this.visible = false;
  }

  retainAxes(matrix: Matrix3): void {
    const e = matrix.elements;
    this.axisXX = e[0];
    this.axisXY = e[1];
    this.axisYX = e[3];
    this.axisYY = e[4];
  }

  override updateWorldMatrix(): Matrix3 {
    if (this.simulationSpace === 'local') return super.updateWorldMatrix();
    const e = this.worldMatrix.elements;
    e[0] = this.axisXX * this.scale.x;
    e[1] = this.axisXY * this.scale.x;
    e[2] = 0;
    e[3] = this.axisYX * this.scale.y;
    e[4] = this.axisYY * this.scale.y;
    e[5] = 0;
    e[6] = this.position.x;
    e[7] = this.position.y;
    e[8] = 1;
    return this.worldMatrix;
  }
}

const STRIDE = 8;
const X = 0,
  Y = 1,
  VX = 2,
  VY = 3,
  AX = 4,
  AY = 5,
  AGE = 6,
  LIFE = 7;

/** Bounded CPU simulation with borrowed texture and a fixed ordinary-Sprite pool. */
export class ParticleEmitter extends Group2D {
  private readonly simulationSpace: 'local' | 'world';
  private readonly pool: ParticleSprite[] = [];
  private state: Float64Array;
  private active: Int32Array;
  private free: Int32Array;
  private freeCount: number;
  private count = 0;
  private running = false;
  private fraction = 0;
  private randomState: number;
  private readonly rate: number;
  private readonly lifetime: [number, number];
  private readonly speed: [number, number];
  private readonly angle: [number, number];
  private readonly acceleration: [number, number];
  private readonly startSize: [number, number];
  private readonly endSize: [number, number];
  private readonly startColor: ColorRGBA;
  private readonly endColor: ColorRGBA;
  private readonly nozzle: ParticleNozzle;

  constructor(options: ParticleEmitterOptions) {
    super();
    if (
      !Number.isSafeInteger(options.capacity) ||
      options.capacity < 1 ||
      options.capacity > world2dLimits.particles
    )
      throw new RangeError(
        `capacity must be an integer between 1 and ${world2dLimits.particles}.`,
      );
    if (!Number.isFinite(options.rate) || options.rate < 0)
      throw new RangeError('rate must be finite and nonnegative.');
    this.rate = options.rate;
    this.lifetime = range(options.lifetime, 'lifetime', 0);
    if (this.lifetime[0] === 0)
      throw new RangeError('lifetime must be positive.');
    this.speed = range(options.speed, 'speed', 0);
    this.angle = range(options.angle, 'angle');
    this.acceleration = pair(options.acceleration ?? [0, 0], 'acceleration');
    this.startSize = pair(options.startSize, 'startSize', 0);
    this.endSize = pair(options.endSize, 'endSize', 0);
    this.startColor = color(options.startColor, 'startColor');
    this.endColor = color(options.endColor, 'endColor');
    this.simulationSpace = options.space ?? 'local';
    if (this.simulationSpace !== 'local' && this.simulationSpace !== 'world')
      throw new RangeError('Unknown particle simulation space.');
    const seed = options.seed ?? 0;
    if (!Number.isSafeInteger(seed))
      throw new RangeError('seed must be a safe integer.');
    this.randomState = seed >>> 0;
    const nozzle = options.nozzle ?? { kind: 'point' };
    switch (nozzle.kind) {
      case 'point':
        this.nozzle = { kind: 'point' };
        break;
      case 'rectangle': {
        pair([nozzle.width, nozzle.height], 'rectangle dimensions', 0);
        this.nozzle = {
          kind: 'rectangle',
          width: nozzle.width,
          height: nozzle.height,
        };
        break;
      }
      case 'circle': {
        if (!Number.isFinite(nozzle.radius) || nozzle.radius < 0)
          throw new RangeError('nozzle radius must be finite and nonnegative.');
        this.nozzle = { kind: 'circle', radius: nozzle.radius };
        break;
      }
      default:
        throw new RangeError('Unknown particle nozzle.');
    }
    if (!options.texture || options.texture.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing Texture for particles.',
      );
    if (options.source)
      validateSource(
        options.source,
        options.texture.width,
        options.texture.height,
      );
    this.state = new Float64Array(options.capacity * STRIDE);
    this.active = new Int32Array(options.capacity);
    this.free = new Int32Array(options.capacity);
    this.freeCount = options.capacity;
    for (let i = 0; i < options.capacity; i++) {
      this.pool.push(
        this.add(
          new ParticleSprite(
            { texture: options.texture, source: options.source },
            this.simulationSpace,
          ),
        ),
      );
      this.free[i] = options.capacity - i - 1;
    }
  }

  get activeCount(): number {
    return this.count;
  }
  get emitting(): boolean {
    return this.running;
  }

  start(): void {
    this.assertAlive();
    this.running = true;
  }
  stop(): void {
    this.running = false;
  }

  emit(count: number): void {
    this.assertAlive();
    if (!Number.isSafeInteger(count) || count < 0)
      throw new RangeError(
        'Particle count must be a nonnegative safe integer.',
      );
    const accepted = Math.min(count, this.freeCount);
    if (accepted === 0) return;
    const matrix =
      this.simulationSpace === 'world'
        ? this.updateWorldMatrix()
        : this.worldMatrix;
    for (let i = 0; i < accepted; i++) this.spawn(matrix);
  }

  clear(): void {
    for (let i = 0; i < this.count; i++) {
      const particle = this.pool[this.active[i]];
      particle.renderEnabled = false;
      particle.visible = false;
    }
    this.count = 0;
    this.freeCount = this.pool.length;
    for (let i = 0; i < this.freeCount; i++)
      this.free[i] = this.freeCount - i - 1;
    this.fraction = 0;
  }

  /** @internal Scene invokes this after physics, never through object.update(). */
  updateSimulation(dt: number): void {
    if (this.destroyed) return;
    if (!Number.isFinite(dt) || dt < 0)
      throw new RangeError('Particle delta must be finite and nonnegative.');
    if (dt === 0) return;
    let i = 0;
    while (i < this.count) {
      if (this.advance(this.active[i], dt)) i++;
      else this.retire(i);
    }
    if (!this.running || this.rate === 0) return;
    const previousFraction = this.fraction;
    const total = previousFraction + this.rate * dt;
    const births = Math.floor(total);
    this.fraction = Number.isFinite(total) ? total - births : 0;
    // Never queue overflow or iterate once per requested birth. Even enormous dt
    // consumes at most capacity births; accepted newborns age within this tick.
    const accepted = Math.min(births, this.freeCount);
    if (accepted === 0) return;
    const matrix =
      this.simulationSpace === 'world'
        ? this.updateWorldMatrix()
        : this.worldMatrix;
    for (let j = 0; j < accepted; j++) {
      const slot = this.spawn(matrix);
      const elapsed = Math.max(0, dt - (1 - previousFraction + j) / this.rate);
      if (!this.advance(slot, elapsed)) this.retire(this.count - 1);
    }
  }

  override destroy(): void {
    if (this.destroyed) return;
    this.running = false;
    this.clear();
    try {
      super.destroy();
    } finally {
      this.pool.length = 0;
      this.freeCount = 0;
      this.state = new Float64Array(0);
      this.active = new Int32Array(0);
      this.free = new Int32Array(0);
    }
  }

  private assertAlive(): void {
    if (this.destroyed)
      throw new Error('Cannot emit from a destroyed ParticleEmitter.');
  }

  private random(): number {
    let n = (this.randomState = (this.randomState + 0x6d2b79f5) >>> 0);
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  }
  private sample(range: readonly [number, number]): number {
    return range[0] + (range[1] - range[0]) * this.random();
  }

  private spawn(matrix: Matrix3): number {
    const slot = this.free[--this.freeCount];
    this.active[this.count++] = slot;
    const base = slot * STRIDE;
    const particle = this.pool[slot];
    let x = 0,
      y = 0;
    if (this.nozzle.kind === 'rectangle') {
      x = (this.random() - 0.5) * this.nozzle.width;
      y = (this.random() - 0.5) * this.nozzle.height;
    } else if (this.nozzle.kind === 'circle') {
      const angle = this.random() * Math.PI * 2;
      const radius = Math.sqrt(this.random()) * this.nozzle.radius;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    }
    const speed = this.sample(this.speed);
    const angle = this.sample(this.angle);
    let vx = Math.cos(angle) * speed,
      vy = Math.sin(angle) * speed;
    let ax = this.acceleration[0],
      ay = this.acceleration[1];
    if (this.simulationSpace === 'world') {
      const e = matrix.elements;
      const wx = e[0] * x + e[3] * y + e[6];
      y = e[1] * x + e[4] * y + e[7];
      x = wx;
      const wvx = e[0] * vx + e[3] * vy;
      vy = e[1] * vx + e[4] * vy;
      vx = wvx;
      const wax = e[0] * ax + e[3] * ay;
      ay = e[1] * ax + e[4] * ay;
      ax = wax;
      particle.retainAxes(matrix);
    }
    this.state[base + X] = x;
    this.state[base + Y] = y;
    this.state[base + VX] = vx;
    this.state[base + VY] = vy;
    this.state[base + AX] = ax;
    this.state[base + AY] = ay;
    this.state[base + AGE] = 0;
    this.state[base + LIFE] = this.sample(this.lifetime);
    particle.position.set(x, y);
    particle.rotation = 0;
    particle.opacity = 1;
    particle.visible = true;
    particle.renderEnabled = true;
    this.appearance(particle, 0);
    return slot;
  }

  private advance(slot: number, dt: number): boolean {
    const base = slot * STRIDE;
    const age = this.state[base + AGE] + dt;
    if (age >= this.state[base + LIFE]) return false;
    this.state[base + AGE] = age;
    this.state[base + X] +=
      this.state[base + VX] * dt + this.state[base + AX] * dt * dt * 0.5;
    this.state[base + Y] +=
      this.state[base + VY] * dt + this.state[base + AY] * dt * dt * 0.5;
    this.state[base + VX] += this.state[base + AX] * dt;
    this.state[base + VY] += this.state[base + AY] * dt;
    const particle = this.pool[slot];
    particle.position.set(this.state[base + X], this.state[base + Y]);
    this.appearance(particle, age / this.state[base + LIFE]);
    return true;
  }

  private appearance(particle: ParticleSprite, progress: number): void {
    particle.scale.set(
      (this.startSize[0] + (this.endSize[0] - this.startSize[0]) * progress) /
        particle.width,
      (this.startSize[1] + (this.endSize[1] - this.startSize[1]) * progress) /
        particle.height,
    );
    for (let i = 0; i < 4; i++)
      particle.particleColor[i] =
        this.startColor[i] + (this.endColor[i] - this.startColor[i]) * progress;
  }

  private retire(index: number): void {
    const slot = this.active[index];
    const particle = this.pool[slot];
    particle.visible = false;
    particle.renderEnabled = false;
    this.free[this.freeCount++] = slot;
    this.active[index] = this.active[--this.count];
  }
}
