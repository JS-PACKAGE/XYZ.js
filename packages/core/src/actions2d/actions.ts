import type { GameObject } from '../game-object.js';
import { Easings, type Easing } from './easings.js';

export interface ActionOwner
  extends
    EventTarget,
    Pick<
      GameObject,
      'position' | 'scale' | 'rotation' | 'opacity' | 'destroyed'
    > {
  readonly scene?: unknown;
  readonly registrationGeneration?: number;
}

export interface ActionContext {
  readonly owner: ActionOwner;
  active(): boolean;
  step(): void;
}
export interface ActionRuntime {
  done: boolean;
  advance(dt: number, context: ActionContext): number;
}
const instantiate = Symbol('action runtime');
export interface Action {
  /** Minimum elapsed time per run, used to reject non-progressing infinite repeats. */
  readonly duration: number;
  readonly [instantiate]: () => ActionRuntime;
}
export function createRuntime(action: Action): ActionRuntime {
  return action[instantiate]();
}
export function validateTime(value: number, name = 'duration'): void {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${name} must be finite and nonnegative.`);
}
function finite(value: number): number {
  if (!Number.isFinite(value))
    throw new RangeError('Action values must be finite.');
  return value;
}
function descriptor(duration: number, create: () => ActionRuntime): Action {
  return Object.freeze({ duration, [instantiate]: create });
}
function timed(
  duration: number,
  easing: Easing,
  capture: (
    owner: ActionOwner,
    context: ActionContext,
  ) => (progress: number) => void,
): Action {
  validateTime(duration);
  if (typeof easing !== 'function')
    throw new TypeError('Easing must be a function.');
  return descriptor(duration, () => {
    let elapsed = 0;
    let apply: ((progress: number) => void) | undefined;
    return {
      done: false,
      advance(dt, context) {
        context.step();
        if (!context.active()) return 0;
        apply ??= capture(context.owner, context);
        if (!context.active()) return 0;
        const consumed = Math.min(dt, duration - elapsed);
        elapsed += consumed;
        const progress =
          duration === 0 || elapsed === duration
            ? 1
            : easing(elapsed / duration);
        if (!Number.isFinite(progress) || progress < 0 || progress > 1)
          throw new RangeError(
            'Easing output must be finite and between 0 and 1.',
          );
        if (!context.active()) return consumed;
        apply(progress);
        this.done = elapsed === duration;
        return consumed;
      },
    };
  });
}
function position(
  x: number,
  y: number,
  duration: number,
  easing: Easing,
  relative: boolean,
): Action {
  finite(x);
  finite(y);
  return timed(duration, easing, (owner) => {
    const startX = finite(owner.position.x),
      startY = finite(owner.position.y);
    const endX = relative ? finite(startX + x) : x;
    const endY = relative ? finite(startY + y) : y;
    return (t) =>
      owner.position.set(
        startX * (1 - t) + endX * t,
        startY * (1 - t) + endY * t,
      );
  });
}
function sequence(...actions: Action[]): Action {
  const duration = actions.reduce((sum, action) => sum + action.duration, 0);
  return descriptor(duration, () => {
    let index = 0;
    let current: ActionRuntime | undefined;
    return {
      done: false,
      advance(dt, context) {
        context.step();
        let consumed = 0;
        while (index < actions.length && context.active()) {
          current ??= createRuntime(actions[index]);
          consumed += current.advance(dt - consumed, context);
          if (!current.done) return consumed;
          current = undefined;
          index++;
        }
        this.done = index === actions.length;
        return consumed;
      },
    };
  });
}
function repeat(action: Action, count: number): Action {
  if (count !== Infinity && (!Number.isSafeInteger(count) || count < 0))
    throw new RangeError('Repeat count must be a nonnegative safe integer.');
  if (count === Infinity && action.duration === 0)
    throw new RangeError('An infinite repeat must consume time.');
  return descriptor(count === 0 ? 0 : action.duration * count, () => {
    let iteration = 0;
    let current: ActionRuntime | undefined;
    return {
      done: false,
      advance(dt, context) {
        context.step();
        let consumed = 0;
        while (iteration < count && context.active()) {
          current ??= createRuntime(action);
          consumed += current.advance(dt - consumed, context);
          if (!current.done) return consumed;
          current = undefined;
          iteration++;
          if (count === Infinity && consumed === dt) return consumed;
        }
        this.done = iteration === count;
        return consumed;
      },
    };
  });
}

export const Actions = Object.freeze({
  moveTo(
    x: number,
    y: number,
    duration: number,
    easing: Easing = Easings.linear,
  ): Action {
    return position(x, y, duration, easing, false);
  },
  moveBy(
    x: number,
    y: number,
    duration: number,
    easing: Easing = Easings.linear,
  ): Action {
    return position(x, y, duration, easing, true);
  },
  rotateTo(
    angle: number,
    duration: number,
    easing: Easing = Easings.linear,
  ): Action {
    finite(angle);
    return timed(duration, easing, (owner) => {
      const start = finite(owner.rotation);
      return (t) => {
        owner.rotation = start * (1 - t) + angle * t;
      };
    });
  },
  scaleTo(
    x: number,
    y: number,
    duration: number,
    easing: Easing = Easings.linear,
  ): Action {
    finite(x);
    finite(y);
    return timed(duration, easing, (owner) => {
      const startX = finite(owner.scale.x),
        startY = finite(owner.scale.y);
      return (t) =>
        owner.scale.set(startX * (1 - t) + x * t, startY * (1 - t) + y * t);
    });
  },
  fadeTo(
    opacity: number,
    duration: number,
    easing: Easing = Easings.linear,
  ): Action {
    if (finite(opacity) < 0 || opacity > 1)
      throw new RangeError('Opacity must be between 0 and 1.');
    return timed(duration, easing, (owner) => {
      const start = finite(owner.opacity);
      return (t) => {
        owner.opacity = start * (1 - t) + opacity * t;
      };
    });
  },
  tween(
    target: object,
    values: Record<string, number>,
    duration: number,
    easing: Easing = Easings.linear,
  ): Action {
    const keys = Object.keys(values);
    const ends = keys.map((key) => finite(values[key]));
    const object = target as Record<string, unknown>;
    for (const key of keys) {
      if (!(key in object) || typeof object[key] !== 'number')
        throw new TypeError(`Tween property ${key} must already be numeric.`);
      finite(object[key] as number);
    }
    return timed(duration, easing, (_owner, context) => {
      const starts = new Array<number>(keys.length);
      for (let i = 0; i < keys.length && context.active(); i++) {
        const key = keys[i];
        const value = object[key];
        if (!(key in object) || typeof value !== 'number')
          throw new TypeError(`Tween property ${key} must already be numeric.`);
        starts[i] = finite(value);
      }
      return (t) => {
        for (let i = 0; i < keys.length && context.active(); i++)
          object[keys[i]] = starts[i] * (1 - t) + ends[i] * t;
      };
    });
  },
  delay(duration: number): Action {
    return timed(duration, Easings.linear, () => () => {});
  },
  call(callback: (owner: ActionOwner) => void): Action {
    if (typeof callback !== 'function')
      throw new TypeError('Action callback must be a function.');
    return descriptor(0, () => ({
      done: false,
      advance(_dt, context) {
        context.step();
        if (!context.active()) return 0;
        this.done = true;
        callback(context.owner);
        return 0;
      },
    }));
  },
  sequence,
  parallel(...actions: Action[]): Action {
    return descriptor(
      actions.reduce((max, action) => Math.max(max, action.duration), 0),
      () => {
        const children = actions.map(createRuntime);
        return {
          done: false,
          advance(dt, context) {
            context.step();
            let consumed = 0;
            let complete = true;
            for (const child of children) {
              if (!context.active()) return consumed;
              if (!child.done)
                consumed = Math.max(consumed, child.advance(dt, context));
              if (!child.done) complete = false;
            }
            this.done = complete;
            return consumed;
          },
        };
      },
    );
  },
  repeat(action: Action, count: number): Action {
    if (count === Infinity)
      throw new RangeError('Use repeatForever for infinite repetition.');
    return repeat(action, count);
  },
  repeatForever(action: Action): Action {
    return repeat(action, Infinity);
  },
});
