import { Group2D } from '../gameplay/group2d.js';
import type { Rect2D } from '../gameplay/contracts.js';
import { Filter2D } from './filters2d.js';
import { Mask2D } from './mask2d.js';

export type BlendMode2D = 'normal' | 'add' | 'multiply' | 'screen' | 'erase';
/** One compositing slot only when explicitly enabled; all descriptors remain borrowed. */
export class IsolatedGroup2D extends Group2D {
  private cached = false;
  private isolated = false;
  private dirtyVersion = 0;
  private clip: Mask2D | undefined;
  private stack: readonly Filter2D[] = Object.freeze([]);
  private blend: BlendMode2D = 'normal';

  get isolate(): boolean {
    return this.isolated;
  }
  set isolate(value: boolean) {
    if (typeof value !== 'boolean')
      throw new TypeError('isolate must be boolean.');
    if (value !== this.isolated) {
      this.isolated = value;
      this.updateCache();
    }
  }
  get cacheAsTexture(): boolean {
    return this.cached;
  }
  set cacheAsTexture(value: boolean) {
    if (typeof value !== 'boolean')
      throw new TypeError('cacheAsTexture must be boolean.');
    if (value !== this.cached) {
      this.cached = value;
      this.updateCache();
    }
  }
  get cacheVersion(): number {
    return this.dirtyVersion;
  }
  updateCache(): void {
    if (this.destroyed)
      throw new Error('Cannot invalidate a destroyed IsolatedGroup2D.');
    this.dirtyVersion++;
  }
  get mask(): Mask2D | undefined {
    return this.clip;
  }
  set mask(value: Mask2D | undefined) {
    if (value && !(value instanceof Mask2D))
      throw new TypeError('Invalid Mask2D.');
    if (this.clip !== value) {
      this.clip = value;
      this.updateCache();
    }
  }
  get filters(): readonly Filter2D[] {
    return this.stack;
  }
  set filters(value: readonly Filter2D[]) {
    if (
      !Array.isArray(value) ||
      value.length > 32 ||
      value.some((filter) => !(filter instanceof Filter2D) || filter.destroyed)
    )
      throw new TypeError(
        'IsolatedGroup2D requires a bounded live Filter2D stack.',
      );
    this.stack = Object.freeze([...value]);
    this.updateCache();
  }
  get blendMode(): BlendMode2D {
    return this.blend;
  }
  set blendMode(value: BlendMode2D) {
    if (!['normal', 'add', 'multiply', 'screen', 'erase'].includes(value))
      throw new RangeError('Unsupported BlendMode2D.');
    if (this.blend !== value) {
      this.blend = value;
      this.updateCache();
    }
  }
  get isolationEnabled(): boolean {
    return (
      this.isolated ||
      this.cached ||
      !!this.clip ||
      this.stack.length > 0 ||
      this.blend !== 'normal'
    );
  }
  get filterPadding(): number {
    return this.stack.reduce((sum, filter) => sum + filter.padding, 0);
  }
  override getLocalBounds(out?: Rect2D): Rect2D {
    const bounds = super.getLocalBounds(out);
    const padding = this.filterPadding;
    if (bounds.width > 0 && bounds.height > 0) {
      bounds.x -= padding;
      bounds.y -= padding;
      bounds.width += padding * 2;
      bounds.height += padding * 2;
    }
    return bounds;
  }
}
