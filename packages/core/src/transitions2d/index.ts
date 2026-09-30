import { Easings, type Easing } from '../actions2d/easings.js';
import type { ColorRGBA } from '../gameplay/contracts.js';
import type {
  RenderSnapshot,
  TransitionFrame,
} from '../../../graphics/src/render2d-contract.js';

export interface TransitionOptions {
  kind: 'fade' | 'crossfade' | 'slide';
  duration: number;
  easing?: Easing;
  color?: ColorRGBA;
  direction?: 'left' | 'right' | 'up' | 'down';
  blockInput?: boolean;
}

/** One visual handoff, owning only its immutable outgoing capture, never either Scene. */
export class TransitionController {
  readonly duration: number;
  readonly blockInput: boolean;
  private readonly easing: Easing;
  private readonly frame: TransitionFrame;
  private elapsed = 0;
  private disposed = false;

  constructor(options: TransitionOptions) {
    if (!options || !['fade', 'crossfade', 'slide'].includes(options.kind))
      throw new RangeError('Unknown transition kind.');
    if (!Number.isFinite(options.duration) || options.duration < 0)
      throw new RangeError(
        'Transition duration must be finite and nonnegative.',
      );
    if (options.easing !== undefined && typeof options.easing !== 'function')
      throw new TypeError('Transition easing must be a function.');
    const direction = options.direction ?? 'left';
    if (!['left', 'right', 'up', 'down'].includes(direction))
      throw new RangeError('Unknown transition direction.');
    const color = options.color ?? [0, 0, 0, 1];
    if (
      color.length !== 4 ||
      color.some((value) => !Number.isFinite(value) || value < 0 || value > 1)
    )
      throw new RangeError(
        'Transition color requires four normalized finite channels.',
      );
    this.duration = options.duration;
    this.blockInput = options.blockInput ?? true;
    this.easing = options.easing ?? Easings.linear;
    this.frame = {
      kind: options.kind,
      progress: this.duration === 0 ? 1 : 0,
      color: Object.freeze([
        color[0],
        color[1],
        color[2],
        color[3],
      ]) as ColorRGBA,
      direction,
    };
  }
  get kind(): TransitionFrame['kind'] {
    return this.frame.kind;
  }
  get progress(): number {
    return this.frame.progress;
  }
  get complete(): boolean {
    return this.elapsed >= this.duration;
  }

  /** @internal Captures are assigned only after version/cancellation checks succeed. */
  attachSnapshot(snapshot: RenderSnapshot): void {
    if (this.disposed || this.frame.snapshot)
      throw new Error('Transition capture is already assigned or disposed.');
    this.frame.snapshot = snapshot;
  }
  advance(dt: number): TransitionFrame {
    if (this.disposed)
      throw new Error('Cannot advance a destroyed transition.');
    if (!Number.isFinite(dt) || dt < 0)
      throw new RangeError('Transition delta must be finite and nonnegative.');
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    const progress = this.complete
      ? 1
      : this.easing(this.elapsed / this.duration);
    if (!Number.isFinite(progress) || progress < 0 || progress > 1)
      throw new RangeError(
        'Transition easing must produce normalized finite progress.',
      );
    this.frame.progress = progress;
    return this.frame;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    const snapshot = this.frame.snapshot;
    this.frame.snapshot = undefined;
    snapshot?.destroy();
  }
}
