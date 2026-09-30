import {
  AssetError,
  type Texture2DSource,
  type TextureView2D,
} from '../../../assets/src/index.js';
import { Matrix3 } from '../../../math/src/index.js';
import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import { GameObject } from '../game-object.js';
import {
  validateSource,
  type ColorRGBA,
  type Rect2D,
} from '../gameplay/contracts.js';

/** Fields submitted every active frame; other fields upload only after a setter. */
export const ParticleAttribute2D = Object.freeze({
  Transform: 1,
  Tint: 2,
  Source: 4,
  Anchor: 8,
  All: 15,
});

export interface ParticleTransform2D {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
  /** World coordinates retain birth axes instead of following the layer. */
  space?: 'local' | 'world';
}

export interface ParticleSource2D {
  texture?: Texture2DSource;
  view?: TextureView2D;
  source?: Readonly<Rect2D>;
}

export interface ParticleOptions2D extends ParticleSource2D {
  transform?: ParticleTransform2D;
  tint?: ColorRGBA;
  anchor?: readonly [number, number];
}

export interface ParticleLayer2DOptions extends ParticleSource2D {
  capacity: number;
  dynamicAttributes?: number;
}

/** Stable borrowed read-only record. No mutable arrays are exposed. */
export interface ParticleSlot2D {
  /** Activation identity; source setters do not change this value. */
  readonly generation: number;
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly tx: number;
  readonly ty: number;
  readonly space: 'local' | 'world';
  readonly tintR: number;
  readonly tintG: number;
  readonly tintB: number;
  readonly tintA: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly texture: Texture2DSource;
  readonly view: TextureView2D | undefined;
  readonly source: Readonly<Rect2D> | undefined;
  readonly transformVersion: number;
  readonly tintVersion: number;
  readonly sourceVersion: number;
  readonly anchorVersion: number;
}

const identity: ParticleTransform2D = Object.freeze({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  tx: 0,
  ty: 0,
});
const white: ColorRGBA = Object.freeze([1, 1, 1, 1]);
const center: readonly [number, number] = Object.freeze([0.5, 0.5]);

class Slot implements ParticleSlot2D {
  #values = new Float64Array([1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0.5, 0.5]);
  #space: 'local' | 'world' = 'local';
  #texture!: Texture2DSource;
  #view: TextureView2D | undefined;
  #source: Readonly<Rect2D> | undefined;
  #transformVersion = 0;
  #generation = 0;
  #tintVersion = 0;
  #sourceVersion = 0;
  #anchorVersion = 0;
  get a(): number {
    return this.#values[0];
  }
  get b(): number {
    return this.#values[1];
  }
  get c(): number {
    return this.#values[2];
  }
  get d(): number {
    return this.#values[3];
  }
  get tx(): number {
    return this.#values[4];
  }
  get ty(): number {
    return this.#values[5];
  }
  get tintR(): number {
    return this.#values[6];
  }
  get tintG(): number {
    return this.#values[7];
  }
  get tintB(): number {
    return this.#values[8];
  }
  get tintA(): number {
    return this.#values[9];
  }
  get anchorX(): number {
    return this.#values[10];
  }
  get anchorY(): number {
    return this.#values[11];
  }
  get space(): 'local' | 'world' {
    return this.#space;
  }
  get texture(): Texture2DSource {
    return this.#texture;
  }
  get view(): TextureView2D | undefined {
    return this.#view;
  }
  get source(): Readonly<Rect2D> | undefined {
    return this.#source;
  }
  get transformVersion(): number {
    return this.#transformVersion;
  }
  get generation(): number {
    return this.#generation;
  }
  get tintVersion(): number {
    return this.#tintVersion;
  }
  get sourceVersion(): number {
    return this.#sourceVersion;
  }
  get anchorVersion(): number {
    return this.#anchorVersion;
  }
  activate(): void {
    this.#generation++;
  }
  transform(value: ParticleTransform2D): void {
    this.#values[0] = value.a;
    this.#values[1] = value.b;
    this.#values[2] = value.c;
    this.#values[3] = value.d;
    this.#values[4] = value.tx;
    this.#values[5] = value.ty;
    this.#space = value.space ?? 'local';
    this.#transformVersion++;
  }
  tint(value: ColorRGBA): void {
    for (let i = 0; i < 4; i++) this.#values[6 + i] = value[i];
    this.#tintVersion++;
  }
  anchor(value: readonly [number, number]): void {
    this.#values[10] = value[0];
    this.#values[11] = value[1];
    this.#anchorVersion++;
  }
  setSource(
    texture: Texture2DSource,
    view: TextureView2D | undefined,
    source: Readonly<Rect2D> | undefined,
  ): void {
    this.#texture = texture;
    this.#view = view;
    this.#source = source;
    this.#sourceVersion++;
  }
  release(): void {
    // Inactive slots must not keep borrowers alive; the pool itself stays fixed.
    this.#texture = undefined as unknown as Texture2DSource;
    this.#view = undefined;
    this.#source = undefined;
  }
}

function bounded(value: number): boolean {
  return (
    Number.isFinite(value) && Math.abs(value) <= rendering2dLimits.coordinate
  );
}
function validateTransform(value: ParticleTransform2D): void {
  if (
    !bounded(value.a) ||
    !bounded(value.b) ||
    !bounded(value.c) ||
    !bounded(value.d) ||
    !bounded(value.tx) ||
    !bounded(value.ty)
  )
    throw new RangeError(
      'Particle affine transform exceeds its finite coordinate budget.',
    );
  if (
    value.space !== undefined &&
    value.space !== 'local' &&
    value.space !== 'world'
  )
    throw new RangeError('Unknown particle transform space.');
}
function validateTint(value: ColorRGBA): void {
  if (value.length !== 4)
    throw new RangeError(
      'Particle tint must contain four channels between 0 and 1.',
    );
  for (let i = 0; i < 4; i++)
    if (!Number.isFinite(value[i]) || value[i] < 0 || value[i] > 1)
      throw new RangeError(
        'Particle tint must contain four channels between 0 and 1.',
      );
}
function validateAnchor(value: readonly [number, number]): void {
  if (value.length !== 2 || !bounded(value[0]) || !bounded(value[1]))
    throw new RangeError(
      'Particle anchor exceeds its finite coordinate budget.',
    );
}

function validateParticleSource(
  value: ParticleSource2D & { texture: Texture2DSource },
): void {
  if (value.texture.destroyed)
    throw new AssetError('Particle texture is destroyed.');
  value.view?.validate();
  if (value.source)
    validateSource(value.source, value.texture.width, value.texture.height);
  const width =
    value.view?.width ??
    value.source?.width ??
    (value.texture.kind === 'render'
      ? value.texture.logicalWidth
      : value.texture.width);
  const height =
    value.view?.height ??
    value.source?.height ??
    (value.texture.kind === 'render'
      ? value.texture.logicalHeight
      : value.texture.height);
  if (!bounded(width) || !bounded(height) || width <= 0 || height <= 0)
    throw new RangeError(
      'Particle source dimensions exceed their positive finite budget.',
    );
}
function checkedSource(
  value: ParticleSource2D,
): ParticleSource2D & { texture: Texture2DSource } {
  const texture = value.texture ?? value.view?.source;
  if (!texture || texture.destroyed)
    throw new AssetError('Particle texture is missing or destroyed.');
  if (value.view && (value.view.source !== texture || value.source))
    throw new RangeError(
      'Particle view conflicts with texture or source rectangle.',
    );
  const source =
    value.texture &&
    Object.isFrozen(value) &&
    (!value.source || Object.isFrozen(value.source))
      ? (value as ParticleSource2D & { texture: Texture2DSource })
      : {
          texture,
          view: value.view,
          source: value.source ? Object.freeze({ ...value.source }) : undefined,
        };
  validateParticleSource(source);
  return source;
}

/** A bounded insertion-ordered draw layer; full capacity refuses new particles. */
export class ParticleLayer2D extends GameObject {
  readonly capacity: number;
  readonly dynamicAttributes: number;
  renderEnabled = true;
  private readonly slots: Slot[] = [];
  private readonly active: Int32Array;
  private readonly free: Int32Array;
  private count = 0;
  private freeCount: number;
  private readonly occupied: Uint8Array;
  private readonly defaultSource: ParticleSource2D | undefined;
  private topologyVersion = 0;
  private readonly inverse = new Matrix3();

  constructor(options: ParticleLayer2DOptions) {
    super();
    if (
      !Number.isSafeInteger(options.capacity) ||
      options.capacity < 1 ||
      options.capacity > rendering2dLimits.particleCapacity
    )
      throw new RangeError(
        `capacity must be an integer between 1 and ${rendering2dLimits.particleCapacity}.`,
      );
    const mask =
      options.dynamicAttributes ??
      ParticleAttribute2D.Transform | ParticleAttribute2D.Tint;
    if (
      !Number.isSafeInteger(mask) ||
      mask < 0 ||
      mask > ParticleAttribute2D.All
    )
      throw new RangeError('Unknown particle dynamic attribute mask.');
    this.capacity = options.capacity;
    this.dynamicAttributes = mask;
    this.occupied = new Uint8Array(this.capacity);
    this.active = new Int32Array(this.capacity);
    this.free = new Int32Array(this.capacity);
    this.freeCount = this.capacity;
    if (options.texture || options.view || options.source)
      this.defaultSource = checkedSource(options);
    for (let i = 0; i < this.capacity; i++) {
      const slot = new Slot();
      Object.freeze(slot);
      this.slots.push(slot);
      this.free[i] = this.capacity - i - 1;
    }
  }
  get activeCount(): number {
    return this.count;
  }
  get version(): number {
    return this.topologyVersion;
  }
  get availableCount(): number {
    return this.freeCount;
  }
  activeSlotAt(index: number): number {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.count)
      throw new RangeError('Invalid active particle index.');
    return this.active[index];
  }
  hasSlot(index: number): boolean {
    return (
      Number.isSafeInteger(index) &&
      index >= 0 &&
      index < this.capacity &&
      this.occupied[index] === 1
    );
  }
  getSlot(index: number): ParticleSlot2D {
    return this.requireSlot(index);
  }
  addParticle(options: ParticleOptions2D = {}): number {
    this.assertAlive();
    const source =
      options.texture || options.view || options.source
        ? checkedSource(options)
        : (this.defaultSource as
            (ParticleSource2D & { texture: Texture2DSource }) | undefined);
    if (!source) throw new AssetError('Particle texture is missing.');
    validateParticleSource(source);
    const transform = options.transform ?? identity;
    const tint = options.tint ?? white;
    const anchor = options.anchor ?? source.view?.defaultAnchor ?? center;
    validateTransform(transform);
    validateTint(tint);
    validateAnchor(anchor);
    if (this.freeCount === 0) return -1;
    const index = this.free[--this.freeCount];
    const slot = this.slots[index];
    slot.setSource(source.texture, source.view, source.source);
    slot.transform(transform);
    slot.tint(tint);
    slot.anchor(anchor);
    slot.activate();
    this.occupied[index] = 1;
    this.active[this.count++] = index;
    this.topologyVersion++;
    return index;
  }
  removeSlot(index: number): void {
    this.requireSlot(index);
    const position = this.active.indexOf(index, 0);
    this.active.copyWithin(position, position + 1, this.count);
    this.active[--this.count] = 0;
    this.occupied[index] = 0;
    this.slots[index].release();
    this.free[this.freeCount++] = index;
    this.topologyVersion++;
  }
  clear(): void {
    this.occupied.fill(0);
    for (let i = 0; i < this.count; i++) this.slots[this.active[i]].release();
    this.active.fill(0);
    this.count = 0;
    this.freeCount = this.destroyed ? 0 : this.capacity;
    for (let i = 0; i < this.freeCount; i++)
      this.free[i] = this.capacity - i - 1;
    this.topologyVersion++;
  }
  setTransform(index: number, value: ParticleTransform2D): void {
    const slot = this.requireSlot(index);
    validateTransform(value);
    slot.transform(value);
  }
  setTint(index: number, value: ColorRGBA): void {
    const slot = this.requireSlot(index);
    validateTint(value);
    slot.tint(value);
  }
  setAnchor(index: number, value: readonly [number, number]): void {
    const slot = this.requireSlot(index);
    validateAnchor(value);
    slot.anchor(value);
  }
  setSource(index: number, value: ParticleSource2D): void {
    const slot = this.requireSlot(index);
    const source = checkedSource(value);
    slot.setSource(source.texture, source.view, source.source);
  }
  /** Renderer helper: writes final world affine without allocating a matrix. */
  getSlotWorldMatrix(index: number, out: Matrix3): Matrix3 {
    const slot = this.requireSlot(index);
    if (slot.space === 'local')
      return out
        .copy(this.updateWorldMatrix())
        .multiply(this.slotMatrix(index));
    out.copy(this.slotMatrix(index));
    return out;
  }
  private readonly affine = new Matrix3();
  private slotMatrix(index: number): Matrix3 {
    const slot = this.slots[index];
    const e = this.affine.elements;
    e[0] = slot.a;
    e[1] = slot.b;
    e[2] = 0;
    e[3] = slot.c;
    e[4] = slot.d;
    e[5] = 0;
    e[6] = slot.tx;
    e[7] = slot.ty;
    e[8] = 1;
    return this.affine;
  }
  override getLocalBounds(
    out: Rect2D = { x: 0, y: 0, width: 0, height: 0 },
  ): Rect2D {
    return this.collectBounds(out, true);
  }
  override getWorldBounds(
    out: Rect2D = { x: 0, y: 0, width: 0, height: 0 },
  ): Rect2D {
    return this.collectBounds(out, false);
  }
  private readonly boundsMatrix = new Matrix3();
  private collectBounds(out: Rect2D, local: boolean): Rect2D {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    let inverseReady = false;
    for (let i = 0; i < this.count; i++) {
      const index = this.active[i];
      const slot = this.slots[index];
      validateParticleSource(slot);
      const width =
        slot.view?.width ??
        slot.source?.width ??
        (slot.texture.kind === 'render'
          ? slot.texture.logicalWidth
          : slot.texture.width);
      const height =
        slot.view?.height ??
        slot.source?.height ??
        (slot.texture.kind === 'render'
          ? slot.texture.logicalHeight
          : slot.texture.height);
      let matrix: Matrix3;
      if (local && slot.space === 'local')
        matrix = this.boundsMatrix.copy(this.slotMatrix(index));
      else if (local) {
        if (!inverseReady) {
          this.inverse.copy(this.updateWorldMatrix()).invert();
          inverseReady = true;
        }
        matrix = this.boundsMatrix
          .copy(this.inverse)
          .multiply(this.getSlotWorldMatrix(index, this.worldAffine));
      } else matrix = this.getSlotWorldMatrix(index, this.boundsMatrix);
      const e = matrix.elements;
      for (let corner = 0; corner < 4; corner++) {
        const x = ((corner & 1 ? 1 : 0) - slot.anchorX) * width;
        const y = ((corner & 2 ? 1 : 0) - slot.anchorY) * height;
        const px = e[0] * x + e[3] * y + e[6];
        const py = e[1] * x + e[4] * y + e[7];
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        if (!Number.isFinite(px) || !Number.isFinite(py))
          throw new RangeError('Particle bounds must remain finite.');
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    }
    out.x = minX === Infinity ? 0 : minX;
    out.y = minY === Infinity ? 0 : minY;
    out.width = minX === Infinity ? 0 : maxX - minX;
    out.height = minY === Infinity ? 0 : maxY - minY;
    return out;
  }
  private readonly worldAffine = new Matrix3();
  private assertAlive(): void {
    if (this.destroyed)
      throw new Error('Cannot change a destroyed ParticleLayer2D.');
  }
  private requireSlot(index: number): Slot {
    this.assertAlive();
    if (!this.hasSlot(index))
      throw new RangeError('Invalid or inactive particle slot.');
    return this.slots[index];
  }
  override destroy(): void {
    if (this.destroyed) return;
    this.clear();
    try {
      super.destroy();
    } finally {
      this.freeCount = 0;
      this.slots.length = 0;
    }
  }
}
