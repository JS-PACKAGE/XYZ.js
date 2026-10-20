import { GraphicsError } from './errors.js';

export interface ResidencyBudgetOptions {
  textureBytes?: number;
  geometryBytes?: number;
}
export interface ResidencyStats {
  readonly budgetBytes: number;
  readonly liveBytes: number;
  readonly peakBytes: number;
  readonly entries: number;
  readonly evictions: number;
}
export interface GraphicsResidency {
  readonly textures: ResidencyStats;
  readonly geometry: ResidencyStats;
}

export function validateResidencyBudget(value: number | undefined): number {
  if (value === undefined || value === Infinity) return Infinity;
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(
      'Resource byte budgets must be nonnegative safe integers or Infinity.',
    );
  return value;
}

/** Tracks native cache allocations, not attachments, pipelines or driver memory. */
export class ResidencyPool implements ResidencyStats {
  budgetBytes = Infinity;
  liveBytes = 0;
  peakBytes = 0;
  evictions = 0;
  private readonly allocations = new Set<ResidencyAllocation>();
  private clock = 0;
  private frame = false;
  /**
   * This frame's pins in first-touch order. An allocation is pinned iff its `pinEpoch` is
   * the current `#epoch`, so a touch is one field compare and frames reuse these arrays
   * instead of regrowing a Set. Entries at or past the counts are stale. `#` fields keep
   * the allocation lists (which point back here) out of JSON views of these stats.
   */
  #framePins: ResidencyAllocation[] = [];
  #frameCount = 0;
  /** The previous completed frame's pins; destroyed entries count as removed. */
  #lastFrame: ResidencyAllocation[] = [];
  #lastCount = 0;
  #epoch = 1;
  private capture: Set<ResidencyAllocation> | undefined;
  get entries(): number {
    return this.allocations.size;
  }
  configure(bytes?: number): void {
    const budget = validateResidencyBudget(bytes);
    this.makeRoom(0, budget);
    this.budgetBytes = budget;
  }
  assertBudget(bytes?: number): void {
    const budget = validateResidencyBudget(bytes);
    let protectedBytes = 0;
    for (const allocation of this.allocations)
      if (
        allocation.references ||
        this.pinned(allocation) ||
        this.capture?.has(allocation)
      )
        protectedBytes += allocation.bytes;
    if (protectedBytes > budget)
      throw new GraphicsError(
        'Native resource budget is exhausted by active or retained resources.',
      );
  }
  beginFrame(): void {
    this.frame = true;
  }
  endFrame(): void {
    this.frame = false;
    // Hand the pins over without re-adding every resource; trimming drops stale references.
    const previous = this.#lastFrame;
    this.#framePins.length = this.#frameCount;
    this.#lastFrame = this.#framePins;
    this.#lastCount = this.#frameCount;
    this.#framePins = previous;
    this.#frameCount = 0;
    this.#epoch++;
  }
  abortFrame(): void {
    this.frame = false;
    this.#frameCount = 0;
    this.#epoch++;
  }
  retainFrameResources(): ResidencyAllocation[] {
    const result: ResidencyAllocation[] = [];
    for (let i = 0; i < this.#lastCount; i++) {
      const allocation = this.#lastFrame[i]!;
      if (!allocation.destroyed) result.push(allocation);
    }
    for (const allocation of result) allocation.retain();
    return result;
  }
  beginCapture(): void {
    if (this.capture)
      throw new GraphicsError('Resource preparation cannot be nested.');
    this.capture = new Set();
  }
  endCapture(): ResidencyAllocation[] {
    const result = [...(this.capture ?? [])];
    this.capture = undefined;
    for (const allocation of result) allocation.retain();
    return result;
  }
  allocate(bytes: number, retire: () => void): ResidencyAllocation {
    if (!Number.isSafeInteger(bytes) || bytes < 0)
      throw new GraphicsError('Invalid native resource byte estimate.');
    this.makeRoom(bytes, this.budgetBytes);
    const allocation = new ResidencyAllocation(this, bytes, retire);
    this.allocations.add(allocation);
    this.liveBytes += bytes;
    this.peakBytes = Math.max(this.peakBytes, this.liveBytes);
    this.touch(allocation);
    return allocation;
  }
  touch(allocation: ResidencyAllocation): void {
    if (allocation.destroyed)
      throw new GraphicsError('Native resource was retired.');
    allocation.lastUsed = ++this.clock;
    if (this.frame && allocation.pinEpoch !== this.#epoch) {
      allocation.pinEpoch = this.#epoch;
      if (this.#frameCount < this.#framePins.length)
        this.#framePins[this.#frameCount] = allocation;
      else this.#framePins.push(allocation);
      this.#frameCount++;
    }
    this.capture?.add(allocation);
  }
  private pinned(allocation: ResidencyAllocation): boolean {
    return allocation.pinEpoch === this.#epoch;
  }
  resize(allocation: ResidencyAllocation, bytes: number): void {
    if (!Number.isSafeInteger(bytes) || bytes < 0)
      throw new GraphicsError('Invalid native resource byte estimate.');
    this.touch(allocation);
    if (bytes === allocation.bytes) return;
    this.makeRoom(
      Math.max(0, bytes - allocation.bytes),
      this.budgetBytes,
      allocation,
    );
    this.liveBytes += bytes - allocation.bytes;
    allocation.bytes = bytes;
    this.peakBytes = Math.max(this.peakBytes, this.liveBytes);
  }
  forget(allocation: ResidencyAllocation): void {
    if (!this.allocations.delete(allocation)) return;
    this.liveBytes -= allocation.bytes;
    // Pin lists skip destroyed entries; the stamp alone unpins it.
    allocation.pinEpoch = 0;
    this.capture?.delete(allocation);
  }
  clear(): void {
    for (const allocation of this.allocations) allocation.destroy();
    this.endFrame();
    this.#lastFrame.length = this.#lastCount = 0;
    this.capture = undefined;
  }
  private makeRoom(
    bytes: number,
    budget: number,
    except?: ResidencyAllocation,
  ): void {
    const needed = this.liveBytes + bytes - budget;
    if (needed <= 0) return;
    let available = 0;
    for (const allocation of this.allocations)
      if (
        allocation !== except &&
        !allocation.references &&
        !this.pinned(allocation) &&
        !this.capture?.has(allocation)
      )
        available += allocation.bytes;
    if (available < needed)
      throw new GraphicsError(
        'Native resource budget is exhausted by active or retained resources.',
      );
    while (this.liveBytes + bytes > budget) {
      let oldest: ResidencyAllocation | undefined;
      for (const allocation of this.allocations)
        if (
          allocation !== except &&
          !allocation.references &&
          !this.pinned(allocation) &&
          !this.capture?.has(allocation) &&
          (!oldest || allocation.lastUsed < oldest.lastUsed)
        )
          oldest = allocation;
      oldest!.destroy();
      this.evictions++;
    }
  }
}

export class ResidencyAllocation {
  references = 0;
  lastUsed = 0;
  destroyed = false;
  /** @internal Pool epoch of this allocation's latest in-frame touch. */
  pinEpoch = 0;
  constructor(
    private readonly pool: ResidencyPool,
    public bytes: number,
    private readonly retire: () => void,
  ) {}
  touch(): void {
    this.pool.touch(this);
  }
  retain(): void {
    this.touch();
    this.references++;
  }
  release(): void {
    if (this.references) this.references--;
  }
  resize(bytes: number): void {
    this.pool.resize(this, bytes);
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pool.forget(this);
    this.retire();
  }
}

export class NativeResidency implements GraphicsResidency {
  readonly textures = new ResidencyPool();
  readonly geometry = new ResidencyPool();
  configure(options: ResidencyBudgetOptions): void {
    this.textures.assertBudget(options.textureBytes);
    this.geometry.assertBudget(options.geometryBytes);
    this.textures.configure(options.textureBytes);
    this.geometry.configure(options.geometryBytes);
  }
  beginFrame(): void {
    this.textures.beginFrame();
    this.geometry.beginFrame();
  }
  endFrame(): void {
    this.textures.endFrame();
    this.geometry.endFrame();
  }
  abortFrame(): void {
    this.textures.abortFrame();
    this.geometry.abortFrame();
  }
  beginCapture(): void {
    this.textures.beginCapture();
    this.geometry.beginCapture();
  }
  endCapture(): ResidencyAllocation[] {
    return [...this.textures.endCapture(), ...this.geometry.endCapture()];
  }
  retainFrameResources(): ResidencyAllocation[] {
    return [
      ...this.textures.retainFrameResources(),
      ...this.geometry.retainFrameResources(),
    ];
  }
  clear(): void {
    this.textures.clear();
    this.geometry.clear();
  }
}
