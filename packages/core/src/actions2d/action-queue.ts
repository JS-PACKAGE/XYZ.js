import { actions2dLimits } from '../../../../src/data/actions2d.js';
import {
  createRuntime,
  validateTime,
  type Action,
  type ActionContext,
  type ActionOwner,
  type ActionRuntime,
} from './actions.js';

export type ActionState = 'queued' | 'running' | 'completed' | 'cancelled';
export interface ActionHandle {
  readonly state: ActionState;
  readonly finished: Promise<'completed' | 'cancelled'>;
  cancel(): void;
}
class Entry implements ActionHandle {
  state: ActionState = 'queued';
  readonly finished: Promise<'completed' | 'cancelled'>;
  readonly settle: (state: 'completed' | 'cancelled') => void;
  runtime?: ActionRuntime;
  next?: Entry;
  constructor(
    readonly action: Action,
    private readonly queue: ActionQueue,
  ) {
    let settle!: (state: 'completed' | 'cancelled') => void;
    this.finished = new Promise((resolve) => {
      settle = resolve;
    });
    this.settle = settle;
  }
  cancel(): void {
    this.queue.cancel(this);
  }
}

/** FIFO local actions. Scene executes these before object updates and physics. */
export class ActionQueue {
  private head?: Entry;
  private tail?: Entry;
  private disposed = false;
  private advancing = false;
  private steps = 0;
  private generation = 0;
  private current?: Entry;
  private frameScene?: unknown;
  private frameRegistration?: number;
  private continuation?: () => boolean;
  private readonly context: ActionContext;
  private readonly onOwnerDestroy = (): void => {
    this.destroy();
  };

  constructor(readonly owner: ActionOwner) {
    this.context = {
      owner,
      active: () =>
        !this.disposed &&
        !owner.destroyed &&
        this.current?.state === 'running' &&
        owner.scene === this.frameScene &&
        owner.registrationGeneration === this.frameRegistration &&
        (!this.continuation || this.continuation()),
      step: () => {
        if (++this.steps > actions2dLimits.stepsPerUpdate)
          throw new RangeError(
            'Action update exceeded its bounded iteration budget.',
          );
      },
    };
    owner.addEventListener('destroy', this.onOwnerDestroy, { once: true });
  }
  run(action: Action): ActionHandle {
    if (this.disposed || this.owner.destroyed)
      throw new Error('Cannot run actions on a destroyed owner or queue.');
    const entry = new Entry(action, this);
    if (this.tail) this.tail.next = entry;
    else this.head = entry;
    this.tail = entry;
    return entry;
  }
  /** @internal Entry settlement is synchronous before user events. */
  cancel(entry: Entry): void {
    if (entry.state === 'completed' || entry.state === 'cancelled') return;
    entry.state = 'cancelled';
    entry.runtime = undefined;
    entry.settle('cancelled');
    this.owner.dispatchEvent(
      new CustomEvent('actioncancel', {
        detail: { action: entry.action, handle: entry },
      }),
    );
  }
  clear(): void {
    // Detach first: cancellation listeners may enqueue a new, independent run.
    this.generation++;
    let entry = this.head;
    this.head = this.tail = undefined;
    while (entry) {
      const next = entry.next;
      entry.next = undefined;
      this.cancel(entry);
      entry = next;
    }
  }
  update(dt: number, canContinue?: () => boolean): void {
    validateTime(dt, 'delta time');
    if (this.disposed || this.owner.destroyed || this.advancing) return;
    this.advancing = true;
    this.steps = 0;
    this.frameScene = this.owner.scene;
    this.frameRegistration = this.owner.registrationGeneration;
    this.continuation = canContinue;
    const boundary = this.tail;
    const generation = this.generation;
    let remaining = dt;
    try {
      while (
        this.head &&
        generation === this.generation &&
        !this.disposed &&
        !this.owner.destroyed &&
        this.owner.scene === this.frameScene &&
        this.owner.registrationGeneration === this.frameRegistration &&
        (!canContinue || canContinue())
      ) {
        const entry = this.head;
        this.context.step();
        this.current = entry;
        if (entry.state === 'queued') {
          entry.state = 'running';
          this.owner.dispatchEvent(
            new CustomEvent('actionstart', {
              detail: { action: entry.action, handle: entry },
            }),
          );
        }
        if (this.context.active()) {
          entry.runtime ??= createRuntime(entry.action);
          remaining -= entry.runtime.advance(remaining, this.context);
          if (this.context.active() && entry.runtime.done) {
            entry.state = 'completed';
            entry.runtime = undefined;
            entry.settle('completed');
            this.owner.dispatchEvent(
              new CustomEvent('actioncomplete', {
                detail: { action: entry.action, handle: entry },
              }),
            );
          }
        }
        if (entry.state === 'running') break;
        // clear() may have replaced the list during an event or callback.
        if (this.head === entry) {
          this.head = entry.next;
          if (this.tail === entry) this.tail = undefined;
          entry.next = undefined;
        }
        if (entry === boundary || !this.head) break;
      }
    } catch (error) {
      if (this.current) this.cancel(this.current);
      throw error;
    } finally {
      this.current = undefined;
      this.continuation = undefined;
      this.advancing = false;
    }
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.owner.removeEventListener('destroy', this.onOwnerDestroy);
    this.clear();
  }
}
