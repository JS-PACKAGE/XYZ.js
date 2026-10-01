import type {
  AnimationAction,
  AnimationClip,
  AnimationController,
  AnimationLoopMode,
  AnimationMixer,
} from './animation.js';

export type AnimationParameter = number | boolean;
export type AnimationParameters = Readonly<Record<string, AnimationParameter>>;

export interface AnimationStateDefinition {
  clip: AnimationClip;
  /** `true`/omitted repeats, `false` plays once; or a loop mode. */
  loop?: boolean | AnimationLoopMode;
  speed?: number;
}

export interface AnimationTransition {
  /** Source state, or `*` for any state other than the destination. */
  from: string;
  to: string;
  /** Cross-fade seconds; default 0.2. */
  duration?: number;
  /** Must return true for the transition to fire. */
  when?: (parameters: AnimationParameters) => boolean;
  /** Trigger name that must be pending; consumed when the transition fires. */
  trigger?: string;
  /** Fraction (0..1) of the source clip that must have played. */
  exitTime?: number;
}

export interface AnimationStateMachineOptions {
  states: Readonly<Record<string, AnimationStateDefinition>>;
  /** Evaluated in order each update; the first whose conditions all hold fires. */
  transitions?: readonly AnimationTransition[];
  initial: string;
  /** Initial numeric and boolean parameters; a parameter's type is fixed by its initial value. */
  parameters?: Readonly<Record<string, AnimationParameter>>;
  /** Names of one-shot triggers. */
  triggers?: readonly string[];
}

export interface AnimationStateChangeDetail {
  readonly from: string | undefined;
  readonly to: string;
}

const DEFAULT_FADE = 0.2;

function loopMode(loop: AnimationStateDefinition['loop']): AnimationLoopMode {
  if (loop === undefined || loop === true) return 'repeat';
  return loop === false ? 'once' : loop;
}

/**
 * Chooses which clip of an {@link AnimationMixer} plays from named parameters and triggers, and
 * cross-fades between clips on each transition. It registers with the mixer, so the Scene's own
 * `scene.animations` needs no extra update call. Transitions are interruptible: the current
 * state is always the destination of the latest fade.
 */
export class AnimationStateMachine
  extends EventTarget
  implements AnimationController
{
  private currentState: string | undefined;
  private readonly parameterValues: Record<string, AnimationParameter>;
  private readonly pending = new Set<string>();
  private readonly known: ReadonlySet<string>;
  private readonly transitions: readonly AnimationTransition[];
  private readonly detach: () => void;
  private destroyed = false;

  constructor(
    private readonly mixer: AnimationMixer,
    private readonly options: AnimationStateMachineOptions,
  ) {
    super();
    const states = Object.keys(options.states);
    if (!states.length || !(options.initial in options.states))
      throw new RangeError(
        'A state machine needs states and a valid initial state.',
      );
    this.transitions = [...(options.transitions ?? [])];
    for (const [name, state] of Object.entries(options.states)) {
      if (state.speed !== undefined && !Number.isFinite(state.speed))
        throw new RangeError(`State "${name}" speed must be finite.`);
      loopMode(state.loop);
    }
    for (const transition of this.transitions) {
      if (
        transition.to === '*' ||
        !(transition.to in options.states) ||
        (transition.from !== '*' && !(transition.from in options.states))
      )
        throw new RangeError(
          `Transition ${transition.from} -> ${transition.to} names an unknown state.`,
        );
      const fade = transition.duration ?? DEFAULT_FADE;
      if (!Number.isFinite(fade) || fade < 0)
        throw new RangeError(
          'Transition duration must be finite and nonnegative.',
        );
      if (
        transition.exitTime !== undefined &&
        !(transition.exitTime >= 0 && transition.exitTime <= 1)
      )
        throw new RangeError('exitTime must be within 0..1.');
      const unconditional =
        !transition.when &&
        transition.trigger === undefined &&
        transition.exitTime === undefined;
      if (
        unconditional &&
        (transition.from === '*' ||
          loopMode(options.states[transition.from]!.loop) !== 'once')
      )
        throw new RangeError(
          'A transition without a condition needs a non-looping source state to wait for.',
        );
    }
    this.known = new Set(options.triggers ?? []);
    for (const transition of this.transitions)
      if (
        transition.trigger !== undefined &&
        !this.known.has(transition.trigger)
      )
        throw new RangeError(
          `Transition uses undeclared trigger "${transition.trigger}".`,
        );
    this.parameterValues = { ...(options.parameters ?? {}) };
    for (const [name, value] of Object.entries(this.parameterValues))
      if (
        typeof value === 'number'
          ? !Number.isFinite(value)
          : typeof value !== 'boolean'
      )
        throw new RangeError(
          `Parameter "${name}" must be a finite number or boolean.`,
        );
    this.detach = mixer.addController(this);
    this.enter(options.initial, 0);
  }

  get current(): string {
    return this.currentState!;
  }

  /** The action driving the current state. */
  get action(): AnimationAction {
    return this.mixer.clipAction(this.options.states[this.currentState!]!.clip);
  }

  parameter(name: string): AnimationParameter {
    if (!(name in this.parameterValues))
      throw new RangeError(`Unknown parameter "${name}".`);
    return this.parameterValues[name]!;
  }

  /** Only declared parameters can be set, and a parameter keeps the type it was declared with. */
  setParameter(name: string, value: AnimationParameter): void {
    const existing = this.parameter(name);
    if (
      typeof value !== typeof existing ||
      (typeof value === 'number' && !Number.isFinite(value))
    )
      throw new TypeError(
        `Parameter "${name}" must stay a ${typeof existing}.`,
      );
    this.parameterValues[name] = value;
  }

  /** Arms a one-shot trigger; it stays armed until a transition consumes it or it is reset. */
  trigger(name: string): void {
    if (!this.known.has(name))
      throw new RangeError(`Unknown trigger "${name}".`);
    this.pending.add(name);
  }

  resetTrigger(name: string): void {
    this.pending.delete(name);
  }

  /** Jumps to a state regardless of transitions, cross-fading for `duration` seconds. */
  setState(name: string, duration = DEFAULT_FADE): void {
    if (this.destroyed) return;
    if (!(name in this.options.states))
      throw new RangeError(`Unknown state "${name}".`);
    if (!Number.isFinite(duration) || duration < 0)
      throw new RangeError('Fade duration must be finite and nonnegative.');
    this.enter(name, duration);
  }

  /** @internal Called by the mixer before it advances actions. */
  evaluate(): void {
    if (this.destroyed) return;
    const action = this.action;
    for (const transition of this.transitions) {
      if (transition.from !== this.currentState && transition.from !== '*')
        continue;
      if (transition.to === this.currentState) continue;
      if (
        transition.trigger !== undefined &&
        !this.pending.has(transition.trigger)
      )
        continue;
      if (transition.when && !transition.when(this.parameterValues)) continue;
      const unconditional =
        !transition.when &&
        transition.trigger === undefined &&
        transition.exitTime === undefined;
      if (unconditional && action.playing) continue;
      if (
        transition.exitTime !== undefined &&
        action.normalizedTime < transition.exitTime
      )
        continue;
      if (transition.trigger !== undefined)
        this.pending.delete(transition.trigger);
      this.enter(transition.to, transition.duration ?? DEFAULT_FADE);
      return;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detach();
  }

  private enter(name: string, duration: number): void {
    const previous = this.currentState;
    const definition = this.options.states[name]!;
    const next = this.mixer.clipAction(definition.clip);
    next.loopMode = loopMode(definition.loop);
    next.timeScale = definition.speed ?? 1;
    const outgoing =
      previous === undefined
        ? undefined
        : this.mixer.clipAction(this.options.states[previous]!.clip);
    this.currentState = name;
    if (outgoing === next) {
      next.time = 0;
      next.play();
    } else if (outgoing && duration > 0) {
      next.time = 0;
      outgoing.crossFadeTo(next, duration);
    } else {
      outgoing?.stop();
      next.stop().play();
    }
    this.dispatchEvent(
      new CustomEvent<AnimationStateChangeDetail>('statechange', {
        detail: { from: previous, to: name },
      }),
    );
  }
}
