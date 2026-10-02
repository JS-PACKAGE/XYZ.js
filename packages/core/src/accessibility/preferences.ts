import { accessibilityLimits } from '../../../../src/data/accessibility.js';
import { Tween, type TweenOptions } from '../tween.js';
import type { TransitionOptions } from '../transitions2d/index.js';

export interface AccessibilityPreferenceValues {
  readonly textScale: number;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
}
export type AccessibilityPreferenceOverrides =
  Partial<AccessibilityPreferenceValues>;

/** Game-local policy. Essential movement is never paused by a presentation preference. */
export class AccessibilityPreferences extends EventTarget {
  private overrides: AccessibilityPreferenceOverrides = {};
  private current: Readonly<AccessibilityPreferenceValues>;
  private readonly media: readonly MediaQueryList[];
  private readonly motions = new Set<(enabled: boolean) => void>();
  private disposed = false;
  private readonly refresh = (): void => {
    if (this.disposed) return;
    const previous = this.current;
    const next = Object.freeze({
      textScale: this.overrides.textScale ?? 1,
      highContrast:
        this.overrides.highContrast ?? this.media[0]?.matches ?? false,
      reducedMotion:
        this.overrides.reducedMotion ?? this.media[1]?.matches ?? false,
    });
    if (
      previous &&
      previous.textScale === next.textScale &&
      previous.highContrast === next.highContrast &&
      previous.reducedMotion === next.reducedMotion
    )
      return;
    this.current = next;
    if (previous?.reducedMotion !== next.reducedMotion)
      for (const apply of [...this.motions]) apply(!next.reducedMotion);
    this.dispatchEvent(new CustomEvent('change', { detail: next }));
  };
  constructor(
    source: Pick<Window, 'matchMedia'> | undefined = typeof window ===
    'undefined'
      ? undefined
      : window,
  ) {
    super();
    this.media =
      typeof source?.matchMedia === 'function'
        ? [
            source.matchMedia('(prefers-contrast: more)'),
            source.matchMedia('(prefers-reduced-motion: reduce)'),
          ]
        : [];
    this.current = Object.freeze({
      textScale: 1,
      highContrast: this.media[0]?.matches ?? false,
      reducedMotion: this.media[1]?.matches ?? false,
    });
    for (const query of this.media)
      query.addEventListener('change', this.refresh);
  }
  get values(): Readonly<AccessibilityPreferenceValues> {
    return this.current;
  }
  set(values: AccessibilityPreferenceOverrides): void {
    this.assertLive();
    if (!values || typeof values !== 'object' || Array.isArray(values))
      throw new TypeError('Accessibility preferences require an object.');
    for (const key of Object.keys(values)) {
      if (!['textScale', 'highContrast', 'reducedMotion'].includes(key))
        throw new TypeError(`Unknown accessibility preference: ${key}.`);
      const value = values[key as keyof AccessibilityPreferenceValues];
      if (key === 'textScale') {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < accessibilityLimits.minimumTextScale ||
          value > accessibilityLimits.maximumTextScale
        )
          throw new RangeError('Text scale must be between 1 and 2.');
      } else if (typeof value !== 'boolean')
        throw new TypeError(`${key} must be boolean.`);
    }
    this.overrides = { ...this.overrides, ...values };
    this.refresh();
  }
  /** Removes player overrides; reads current media values without changing OS settings. */
  reset(): void {
    this.assertLive();
    this.overrides = {};
    this.refresh();
  }
  export(): AccessibilityPreferenceOverrides {
    return { ...this.overrides };
  }
  duration(seconds: number, essential = false): number {
    if (!Number.isFinite(seconds) || seconds < 0)
      throw new RangeError('Motion duration must be finite and nonnegative.');
    return this.current.reducedMotion && !essential ? 0 : seconds;
  }
  delta(seconds: number, essential = false): number {
    return this.duration(seconds, essential);
  }
  transition(
    options: TransitionOptions | undefined,
  ): TransitionOptions | undefined {
    return this.current.reducedMotion ? undefined : options;
  }
  /** Reduced mode applies the destination immediately, including repeat/yoyo decorations. */
  tween(
    target: object,
    values: Readonly<Record<string, number>>,
    options: TweenOptions,
    essential = false,
  ): Tween {
    const reduced = this.current.reducedMotion && !essential;
    return Tween.to(
      target,
      values,
      reduced
        ? { ...options, duration: 0, delay: 0, repeat: 0, yoyo: false }
        : options,
    );
  }
  /** Owner supplies actual animation/tween stop/resume; releases subscriptions on teardown. */
  bindMotion(apply: (enabled: boolean) => void): () => void {
    this.assertLive();
    apply(!this.current.reducedMotion);
    this.motions.add(apply);
    return () => {
      this.motions.delete(apply);
    };
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const query of this.media)
      query.removeEventListener('change', this.refresh);
    this.motions.clear();
  }
  private assertLive(): void {
    if (this.disposed)
      throw new Error('Accessibility preferences are destroyed.');
  }
}
