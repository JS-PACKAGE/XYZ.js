import type { AnimationMask, AnimationReferencePose } from './animation-pose.js';
import type { AnimationAction, AnimationClip, AnimationController, AnimationLoopMode, AnimationMixer } from './animation.js';
export type AnimationParameter = number | boolean;
export type AnimationParameters = Readonly<Record<string, AnimationParameter>>;
export interface AnimationStateDefinition {
    clip: AnimationClip;
    /** `true`/omitted repeats, `false` plays once; or a loop mode. */
    loop?: boolean | AnimationLoopMode;
    speed?: number;
    mask?: AnimationMask;
    additiveReference?: AnimationReferencePose;
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
/**
 * Chooses which clip of an {@link AnimationMixer} plays from named parameters and triggers, and
 * cross-fades between clips on each transition. It registers with the mixer, so the Scene's own
 * `scene.animations` needs no extra update call. Transitions are interruptible: the current
 * state is always the destination of the latest fade.
 */
export declare class AnimationStateMachine extends EventTarget implements AnimationController {
    private readonly mixer;
    private readonly options;
    private currentState;
    private readonly parameterValues;
    private readonly pending;
    private readonly known;
    private readonly transitions;
    private readonly detach;
    private destroyed;
    constructor(mixer: AnimationMixer, options: AnimationStateMachineOptions);
    get current(): string;
    /** The action driving the current state. */
    get action(): AnimationAction;
    parameter(name: string): AnimationParameter;
    /** Only declared parameters can be set, and a parameter keeps the type it was declared with. */
    setParameter(name: string, value: AnimationParameter): void;
    /** Arms a one-shot trigger; it stays armed until a transition consumes it or it is reset. */
    trigger(name: string): void;
    resetTrigger(name: string): void;
    /** Jumps to a state regardless of transitions, cross-fading for `duration` seconds. */
    setState(name: string, duration?: number): void;
    /** @internal Called by the mixer before it advances actions. */
    evaluate(): void;
    destroy(): void;
    private enter;
}
