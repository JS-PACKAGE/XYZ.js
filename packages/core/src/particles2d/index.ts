import {
  AssetError,
  type Texture2DSource,
  type TextureView2D,
} from '../../../assets/src/index.js';
import type { Matrix3 } from '../../../math/src/index.js';
import { world2dLimits } from '../../../../src/data/world2d.js';
import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import { Group2D } from '../gameplay/group2d.js';
import {
  validateSource,
  type ColorRGBA,
  type Rect2D,
} from '../gameplay/contracts.js';
import { Sprite, type SpriteOptions } from '../sprite.js';
import {
  ParticleLayer2D,
  type ParticleOptions2D,
  type ParticleSource2D,
  type ParticleTransform2D,
} from './particle-layer2d.js';
export { ParticleLayer2D, ParticleAttribute2D } from './particle-layer2d.js';
export type {
  ParticleLayer2DOptions,
  ParticleOptions2D,
  ParticleSource2D,
  ParticleTransform2D,
  ParticleSlot2D,
} from './particle-layer2d.js';

export type ParticleNozzle =
  | { kind: 'point' }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'circle'; radius: number };

export interface ParticleEmitterOptions {
  texture?: Texture2DSource;
  view?: TextureView2D;
  /** Empty detached layer attached as a child; otherwise use the ordinary Sprite pool. */
  target?: ParticleLayer2D;
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
  // The transform's own vectors, held here so the per-tick update skips the getter chain.
  readonly place = this.position;
  readonly extent = this.scale;

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
    const e = this.worldMatrix.elements,
      scale = this.extent,
      position = this.place;
    e[0] = this.axisXX * scale.x;
    e[1] = this.axisXY * scale.x;
    e[2] = 0;
    e[3] = this.axisYX * scale.y;
    e[4] = this.axisYY * scale.y;
    e[5] = 0;
    e[6] = position.x;
    e[7] = position.y;
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

/** Bounded CPU simulation with a borrowed source and a fixed Sprite or layer pool. */
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
  private spriteWidth = 1;
  private spriteHeight = 1;
  /** The source `writeTargetAppearance` last measured and its size; cleared every tick. */
  private sizeTexture: Texture2DSource | undefined;
  private sizeView: ParticleSource2D['view'];
  private sizeSource: ParticleSource2D['source'];
  private sizeWidth = 1;
  private sizeHeight = 1;
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
  private readonly target: ParticleLayer2D | undefined;
  private readonly capacity: number;
  private readonly targetSlots: Int32Array;
  private readonly targetGenerations: Float64Array;
  private readonly birthAxes: Float64Array;
  private readonly birthOptions: ParticleOptions2D & {
    texture: Texture2DSource;
  };
  private readonly particleTransform: ParticleTransform2D = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: 0,
    ty: 0,
  };
  private readonly particleTint: [number, number, number, number] = [
    1, 1, 1, 1,
  ];

  constructor(options: ParticleEmitterOptions) {
    super();
    const capacityLimit = options.target
      ? rendering2dLimits.particleCapacity
      : world2dLimits.particles;
    if (
      !Number.isSafeInteger(options.capacity) ||
      options.capacity < 1 ||
      options.capacity > capacityLimit
    )
      throw new RangeError(
        `capacity must be an integer between 1 and ${capacityLimit}.`,
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
    const texture = options.texture ?? options.view?.source;
    if (!texture || texture.destroyed)
      throw new AssetError(
        'Cannot use a destroyed or missing Texture for particles.',
      );
    if (options.view && (options.view.source !== texture || options.source))
      throw new RangeError(
        'Particle view conflicts with texture or source rectangle.',
      );
    options.view?.validate();
    if (options.source)
      validateSource(options.source, texture.width, texture.height);
    if (
      options.target &&
      (options.target.destroyed ||
        options.target.parent ||
        options.target.scene ||
        options.target.activeCount ||
        options.target.capacity !== options.capacity)
    )
      throw new RangeError(
        'Particle target must be an empty detached layer with matching capacity.',
      );
    this.capacity = options.capacity;
    this.target = options.target;
    this.targetSlots = new Int32Array(this.target ? options.capacity : 0).fill(
      -1,
    );
    this.targetGenerations = new Float64Array(
      this.target ? options.capacity : 0,
    );
    this.birthAxes = new Float64Array(
      this.target && this.simulationSpace === 'world'
        ? options.capacity * 4
        : 0,
    );
    this.birthOptions = Object.freeze({
      texture,
      view: options.view,
      source: options.source ? Object.freeze({ ...options.source }) : undefined,
      transform: this.particleTransform,
      tint: this.particleTint,
    });
    this.state = new Float64Array(options.capacity * STRIDE);
    this.active = new Int32Array(options.capacity);
    this.free = new Int32Array(options.capacity);
    this.freeCount = options.capacity;
    for (let i = 0; i < options.capacity; i++) {
      if (!this.target)
        this.pool.push(
          this.add(
            new ParticleSprite(
              { texture, view: options.view, source: options.source },
              this.simulationSpace,
            ),
          ),
        );
      this.free[i] = options.capacity - i - 1;
    }
    if (this.target) this.add(this.target);
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
    const accepted = Math.min(
      count,
      this.freeCount,
      this.target?.availableCount ?? this.capacity,
    );
    if (accepted === 0) return;
    this.validateBirthSource();
    this.refreshSpriteSize();
    const matrix =
      this.simulationSpace === 'world'
        ? this.updateWorldMatrix()
        : this.worldMatrix;
    for (let i = 0; i < accepted; i++) this.spawn(matrix);
  }

  clear(): void {
    for (let i = 0; i < this.count; i++) {
      const slot = this.active[i];
      if (this.target) this.releaseTargetSlot(slot);
      else {
        const particle = this.pool[slot];
        particle.renderEnabled = false;
        particle.visible = false;
      }
    }
    this.count = 0;
    this.freeCount = this.destroyed ? 0 : this.capacity;
    for (let i = 0; i < this.freeCount; i++)
      this.free[i] = this.freeCount - i - 1;
    this.fraction = 0;
  }

  /** @internal Scene invokes this after physics, never through object.update(). */
  updateSimulation(dt: number): void {
    if (this.destroyed) return;
    if (this.target?.destroyed) {
      this.running = false;
      this.clear();
      return;
    }
    if (!Number.isFinite(dt) || dt < 0)
      throw new RangeError('Particle delta must be finite and nonnegative.');
    if (dt === 0) return;
    this.refreshSpriteSize();
    if (this.target) {
      let i = 0;
      while (i < this.count) {
        if (this.advance(this.active[i], dt)) i++;
        else this.retire(i);
      }
    } else this.advanceSprites(dt);
    if (!this.running || this.rate === 0) return;
    const previousFraction = this.fraction;
    const total = previousFraction + this.rate * dt;
    const births = Math.floor(total);
    this.fraction = Number.isFinite(total) ? total - births : 0;
    // Never queue overflow or iterate once per requested birth. Even enormous dt
    // consumes at most capacity births; accepted newborns age within this tick.
    const accepted = Math.min(
      births,
      this.freeCount,
      this.target?.availableCount ?? this.capacity,
    );
    if (accepted === 0) return;
    this.validateBirthSource();
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

  /**
   * `advance` for every active pool Sprite with the emitter's constants held in locals; the
   * expressions (and so every float result) are those of `advance` and `appearance`.
   */
  private advanceSprites(dt: number): void {
    const state = this.state,
      active = this.active,
      pool = this.pool;
    const startWidth = this.startSize[0],
      startHeight = this.startSize[1];
    const widthSpan = this.endSize[0] - startWidth,
      heightSpan = this.endSize[1] - startHeight;
    const width = this.spriteWidth,
      height = this.spriteHeight;
    const red = this.startColor[0],
      green = this.startColor[1],
      blue = this.startColor[2],
      alpha = this.startColor[3];
    const redSpan = this.endColor[0] - red,
      greenSpan = this.endColor[1] - green,
      blueSpan = this.endColor[2] - blue,
      alphaSpan = this.endColor[3] - alpha;
    let i = 0;
    while (i < this.count) {
      const slot = active[i];
      const base = slot * STRIDE;
      const age = state[base + AGE] + dt;
      const life = state[base + LIFE];
      if (age >= life) {
        this.retire(i);
        continue;
      }
      state[base + AGE] = age;
      const ax = state[base + AX],
        ay = state[base + AY];
      const x = (state[base + X] += state[base + VX] * dt + ax * dt * dt * 0.5);
      const y = (state[base + Y] += state[base + VY] * dt + ay * dt * dt * 0.5);
      state[base + VX] += ax * dt;
      state[base + VY] += ay * dt;
      const particle = pool[slot];
      particle.place.set(x, y);
      const progress = age / life;
      particle.extent.set(
        (startWidth + widthSpan * progress) / width,
        (startHeight + heightSpan * progress) / height,
      );
      const color = particle.particleColor;
      color[0] = red + redSpan * progress;
      color[1] = green + greenSpan * progress;
      color[2] = blue + blueSpan * progress;
      color[3] = alpha + alphaSpan * progress;
      i++;
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

  private validateBirthSource(): void {
    const source = this.birthOptions;
    if (source.texture.destroyed)
      throw new AssetError('Cannot emit from a destroyed particle source.');
    source.view?.validate();
    if (source.source)
      validateSource(
        source.source,
        source.texture.width,
        source.texture.height,
      );
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
    const slot = this.free[this.freeCount - 1];
    const base = slot * STRIDE;
    const particle = this.pool[slot];
    const randomState = this.randomState;
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
      if (this.target) {
        const axis = slot * 4;
        this.birthAxes[axis] = e[0];
        this.birthAxes[axis + 1] = e[1];
        this.birthAxes[axis + 2] = e[3];
        this.birthAxes[axis + 3] = e[4];
      } else particle.retainAxes(matrix);
    }
    const lifetime = this.sample(this.lifetime);
    if (this.target) {
      this.writeTargetAppearance(slot, 0, x, y, this.birthOptions);
      let targetSlot: number;
      try {
        targetSlot = this.target.addParticle(this.birthOptions);
      } catch (error) {
        this.randomState = randomState;
        throw error;
      }
      if (targetSlot < 0) {
        this.randomState = randomState;
        throw new Error('Particle target capacity changed during emission.');
      }
      this.targetSlots[slot] = targetSlot;
      this.targetGenerations[slot] = this.target.getSlot(targetSlot).generation;
    }
    this.freeCount--;
    this.active[this.count++] = slot;
    this.state[base + X] = x;
    this.state[base + Y] = y;
    this.state[base + VX] = vx;
    this.state[base + VY] = vy;
    this.state[base + AX] = ax;
    this.state[base + AY] = ay;
    this.state[base + AGE] = 0;
    this.state[base + LIFE] = lifetime;
    if (!this.target) {
      particle.place.set(x, y);
      particle.rotation = 0;
      particle.opacity = 1;
      particle.visible = true;
      particle.renderEnabled = true;
      this.appearance(particle, 0);
    }
    return slot;
  }

  private advance(slot: number, dt: number): boolean {
    if (this.target && !this.hasTargetSlot(slot)) return false;
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
    if (this.target) this.targetAppearance(slot, age / this.state[base + LIFE]);
    else {
      const particle = this.pool[slot];
      particle.place.set(this.state[base + X], this.state[base + Y]);
      this.appearance(particle, age / this.state[base + LIFE]);
    }
    return true;
  }

  /** Every pool Sprite borrows the emitter's own source, so its size is one per-tick value. */
  private refreshSpriteSize(): void {
    // Sizes may change between ticks, so the per-slot size memo never outlives one.
    this.sizeTexture = undefined;
    const particle = this.birthOptions;
    this.spriteWidth =
      particle.view?.width ??
      particle.source?.width ??
      (particle.texture.kind === 'render'
        ? particle.texture.logicalWidth
        : particle.texture.width);
    this.spriteHeight =
      particle.view?.height ??
      particle.source?.height ??
      (particle.texture.kind === 'render'
        ? particle.texture.logicalHeight
        : particle.texture.height);
  }

  private appearance(particle: ParticleSprite, progress: number): void {
    particle.extent.set(
      (this.startSize[0] + (this.endSize[0] - this.startSize[0]) * progress) /
        this.spriteWidth,
      (this.startSize[1] + (this.endSize[1] - this.startSize[1]) * progress) /
        this.spriteHeight,
    );
    const color = particle.particleColor;
    for (let i = 0; i < 4; i++)
      color[i] =
        this.startColor[i] + (this.endColor[i] - this.startColor[i]) * progress;
  }

  private hasTargetSlot(slot: number): boolean {
    const targetSlot = this.targetSlots[slot];
    return (
      !!this.target &&
      !this.target.destroyed &&
      this.target.hasSlot(targetSlot) &&
      this.target.liveSlot(targetSlot).generation ===
        this.targetGenerations[slot]
    );
  }
  private releaseTargetSlot(slot: number): void {
    if (this.hasTargetSlot(slot))
      this.target!.removeSlot(this.targetSlots[slot]);
    this.targetSlots[slot] = -1;
  }
  /** Only `advance` calls this, right after `hasTargetSlot` confirmed the slot live. */
  private targetAppearance(slot: number, progress: number): void {
    const target = this.target!;
    const index = this.targetSlots[slot];
    this.writeTargetAppearance(
      slot,
      progress,
      this.state[slot * STRIDE + X],
      this.state[slot * STRIDE + Y],
      target.liveSlot(index),
    );
    target.setLiveAppearance(index, this.particleTransform, this.particleTint);
  }
  private writeTargetAppearance(
    slot: number,
    progress: number,
    x: number,
    y: number,
    particle: ParticleSource2D & { texture: Texture2DSource },
  ): void {
    // Particles of a tick nearly always share one source, so its size is read once.
    const texture = particle.texture,
      view = particle.view,
      source = particle.source;
    if (
      texture !== this.sizeTexture ||
      view !== this.sizeView ||
      source !== this.sizeSource
    ) {
      this.sizeWidth =
        view?.width ??
        source?.width ??
        (texture.kind === 'render' ? texture.logicalWidth : texture.width);
      this.sizeHeight =
        view?.height ??
        source?.height ??
        (texture.kind === 'render' ? texture.logicalHeight : texture.height);
      this.sizeTexture = texture;
      this.sizeView = view;
      this.sizeSource = source;
    }
    const startSize = this.startSize,
      endSize = this.endSize;
    const sx =
      (startSize[0] + (endSize[0] - startSize[0]) * progress) / this.sizeWidth;
    const sy =
      (startSize[1] + (endSize[1] - startSize[1]) * progress) / this.sizeHeight;
    const transform = this.particleTransform;
    if (this.simulationSpace === 'world') {
      const axis = slot * 4,
        axes = this.birthAxes;
      transform.a = axes[axis] * sx;
      transform.b = axes[axis + 1] * sx;
      transform.c = axes[axis + 2] * sy;
      transform.d = axes[axis + 3] * sy;
      transform.space = 'world';
    } else {
      transform.a = sx;
      transform.b = 0;
      transform.c = 0;
      transform.d = sy;
      transform.space = 'local';
    }
    transform.tx = x;
    transform.ty = y;
    const start = this.startColor,
      end = this.endColor,
      tint = this.particleTint;
    tint[0] = start[0] + (end[0] - start[0]) * progress;
    tint[1] = start[1] + (end[1] - start[1]) * progress;
    tint[2] = start[2] + (end[2] - start[2]) * progress;
    tint[3] = start[3] + (end[3] - start[3]) * progress;
  }

  private retire(index: number): void {
    const slot = this.active[index];
    if (this.target) this.releaseTargetSlot(slot);
    else {
      const particle = this.pool[slot];
      particle.visible = false;
      particle.renderEnabled = false;
    }
    this.free[this.freeCount++] = slot;
    this.active[index] = this.active[--this.count];
  }
}
