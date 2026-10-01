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
  private readonly framePins = new Set<ResidencyAllocation>();
  private readonly lastFrame = new Set<ResidencyAllocation>();
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
        this.framePins.has(allocation) ||
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
    this.lastFrame.clear();
    for (const allocation of this.framePins) this.lastFrame.add(allocation);
    this.framePins.clear();
  }
  abortFrame(): void {
    this.frame = false;
    this.framePins.clear();
  }
  retainFrameResources(): ResidencyAllocation[] {
    const result = [...this.lastFrame];
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
    if (this.frame) this.framePins.add(allocation);
    this.capture?.add(allocation);
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
    this.framePins.delete(allocation);
    this.lastFrame.delete(allocation);
    this.capture?.delete(allocation);
  }
  clear(): void {
    for (const allocation of this.allocations) allocation.destroy();
    this.endFrame();
    this.lastFrame.clear();
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
        !this.framePins.has(allocation) &&
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
          !this.framePins.has(allocation) &&
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
