import { Tween, type TweenOptions } from '../tween.js';
import type { TransitionOptions } from '../transitions2d/index.js';
export interface AccessibilityPreferenceValues {
    readonly textScale: number;
    readonly highContrast: boolean;
    readonly reducedMotion: boolean;
}
export type AccessibilityPreferenceOverrides = Partial<AccessibilityPreferenceValues>;
/** Shared preflight for persistence; never installs media listeners or changes policy. */
export declare function validateAccessibilityOverrides(values: unknown): asserts values is AccessibilityPreferenceOverrides;
/** Game-local policy. Essential movement is never paused by a presentation preference. */
export declare class AccessibilityPreferences extends EventTarget {
    private overrides;
    private current;
    private readonly media;
    private readonly motions;
    private disposed;
    private readonly refresh;
    constructor(source?: Pick<Window, 'matchMedia'> | undefined);
    get values(): Readonly<AccessibilityPreferenceValues>;
    set(values: AccessibilityPreferenceOverrides): void;
    /** Replace all overrides in one notification; omitted fields resume OS policy. */
    replace(values: AccessibilityPreferenceOverrides): void;
    /** Removes player overrides; reads current media values without changing OS settings. */
    reset(): void;
    export(): AccessibilityPreferenceOverrides;
    duration(seconds: number, essential?: boolean): number;
    delta(seconds: number, essential?: boolean): number;
    transition(options: TransitionOptions | undefined): TransitionOptions | undefined;
    /** Reduced mode applies the destination immediately, including repeat/yoyo decorations. */
    tween(target: object, values: Readonly<Record<string, number>>, options: TweenOptions, essential?: boolean): Tween;
    /** Owner supplies actual animation/tween stop/resume; releases subscriptions on teardown. */
    bindMotion(apply: (enabled: boolean) => void): () => void;
    destroy(): void;
    private assertLive;
}
