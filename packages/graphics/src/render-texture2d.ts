import { rendering2dLimits } from '../../../src/data/rendering2d.js';
import { GraphicsError } from './errors.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';

export interface RenderTextureOptions2D {
  width: number;
  height: number;
  resolution?: number;
}
export interface RenderTextureSize2D {
  readonly width: number;
  readonly height: number;
  readonly logicalWidth: number;
  readonly logicalHeight: number;
  readonly resolution: number;
}
interface Ownership {
  owner: object;
  resize: (size: RenderTextureSize2D) => void;
  release: () => void;
  dependencies: Set<RenderTexture2D>;
}
const ownership = new WeakMap<RenderTexture2D, Ownership>();
const construction = Symbol('renderer-owned render texture');

export function validateRenderTextureSize2D(
  options: RenderTextureOptions2D,
  maximum: number = rendering2dLimits.targetDimension,
): RenderTextureSize2D {
  const { width: logicalWidth, height: logicalHeight } = options;
  const resolution = options.resolution ?? 1;
  if (
    ![logicalWidth, logicalHeight, resolution].every(Number.isFinite) ||
    logicalWidth <= 0 ||
    logicalHeight <= 0 ||
    resolution <= 0 ||
    resolution > rendering2dLimits.resolution
  )
    throw new RangeError(
      'Render texture dimensions and resolution must be positive and bounded.',
    );
  const width = Math.ceil(logicalWidth * resolution);
  const height = Math.ceil(logicalHeight * resolution);
  if (
    width > Math.min(maximum, rendering2dLimits.targetDimension) ||
    height > Math.min(maximum, rendering2dLimits.targetDimension) ||
    width * height > rendering2dLimits.targetPixels
  )
    throw new RangeError(
      'Render texture exceeds the dimension or pixel budget.',
    );
  return { width, height, logicalWidth, logicalHeight, resolution };
}

/** Mutable renderer-owned pixels; unlike Texture, this resource has no CPU image. */
export class RenderTexture2D {
  readonly kind = 'render' as const;
  private size: RenderTextureSize2D;
  private disposed = false;
  private revision = 0;

  constructor(token: symbol, size: RenderTextureSize2D) {
    if (token !== construction)
      throw new GraphicsError('Render textures must be created by a Renderer.');
    this.size = size;
  }
  get width(): number {
    return this.size.width;
  }
  get height(): number {
    return this.size.height;
  }
  get logicalWidth(): number {
    return this.size.logicalWidth;
  }
  get logicalHeight(): number {
    return this.size.logicalHeight;
  }
  get resolution(): number {
    return this.size.resolution;
  }
  get version(): number {
    return this.revision;
  }
  get destroyed(): boolean {
    return this.disposed;
  }

  resize(options: RenderTextureOptions2D): void {
    const record = this.requireOwnership();
    const size = validateRenderTextureSize2D({
      ...options,
      resolution: options.resolution ?? this.resolution,
    });
    record.resize(size);
    this.size = size;
    record.dependencies.clear();
    this.revision++;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    const record = ownership.get(this);
    ownership.delete(this);
    record?.dependencies.clear();
    record?.release();
  }
  /** Internal publication occurs only after a successful native render submission. */
  publish(owner: object, dependencies: readonly RenderTexture2D[]): void {
    const record = this.requireOwnership();
    if (record.owner !== owner)
      throw new GraphicsError('Render texture belongs to another renderer.');
    record.dependencies = new Set(dependencies);
    this.revision++;
  }
  private requireOwnership(): Ownership {
    const record = ownership.get(this);
    if (this.disposed || !record)
      throw new GraphicsError('Render texture is destroyed.');
    return record;
  }
}

export function createOwnedRenderTexture2D(
  owner: object,
  size: RenderTextureSize2D,
  resize: Ownership['resize'],
  release: Ownership['release'],
): RenderTexture2D {
  const texture = new RenderTexture2D(construction, size);
  ownership.set(texture, { owner, resize, release, dependencies: new Set() });
  return texture;
}

export function assertRenderTextureOwner2D(
  texture: RenderTexture2D,
  owner: object,
): void {
  if (
    !(texture instanceof RenderTexture2D) ||
    texture.destroyed ||
    ownership.get(texture)?.owner !== owner
  )
    throw new GraphicsError(
      'Render texture is destroyed or belongs to another renderer.',
    );
}

export function validateRenderTextureDependencies2D(
  target: RenderTexture2D,
  dependencies: readonly RenderTexture2D[],
  owner: object,
): void {
  assertRenderTextureOwner2D(target, owner);
  const visited = new Set<RenderTexture2D>();
  const visit = (source: RenderTexture2D, depth: number): void => {
    assertRenderTextureOwner2D(source, owner);
    if (source === target)
      throw new GraphicsError(
        'Render texture sampling creates recursive feedback.',
      );
    if (depth > rendering2dLimits.layerDepth)
      throw new RangeError(
        'Render texture dependency depth exceeds the budget.',
      );
    if (visited.has(source)) return;
    visited.add(source);
    for (const dependency of ownership.get(source)!.dependencies)
      visit(dependency, depth + 1);
  };
  for (const dependency of dependencies) visit(dependency, 0);
}

export function validateRenderTextureRegion2D(
  texture: RenderTexture2D,
  region?: Readonly<Rect2D>,
): Rect2D {
  if (texture.destroyed)
    throw new GraphicsError('Render texture is destroyed.');
  if (!region)
    return { x: 0, y: 0, width: texture.width, height: texture.height };
  if (
    ![region.x, region.y, region.width, region.height].every(Number.isFinite) ||
    region.x < 0 ||
    region.y < 0 ||
    region.width <= 0 ||
    region.height <= 0 ||
    region.x + region.width > texture.logicalWidth ||
    region.y + region.height > texture.logicalHeight
  )
    throw new RangeError(
      'Extraction region must be positive and inside the logical render texture.',
    );
  const x = Math.floor(region.x * texture.resolution);
  const y = Math.floor(region.y * texture.resolution);
  return {
    x,
    y,
    width: Math.ceil((region.x + region.width) * texture.resolution) - x,
    height: Math.ceil((region.y + region.height) * texture.resolution) - y,
  };
}
