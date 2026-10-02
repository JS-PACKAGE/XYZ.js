import { describe, expect, it } from 'vitest';
import { AccessibilityPreferences } from '../packages/core/src/accessibility/preferences.js';

class PreferenceQuery extends EventTarget {
  matches = false;
  change(matches: boolean): void {
    this.matches = matches;
    this.dispatchEvent(new Event('change'));
  }
}

describe('owned accessibility presentation policy', () => {
  it('allows explicit player policy when the host has no media query capability', () => {
    const preferences = new AccessibilityPreferences(
      {} as Pick<Window, 'matchMedia'>,
    );
    preferences.set({ highContrast: true, reducedMotion: true, textScale: 2 });
    expect(preferences.values).toEqual({
      highContrast: true,
      reducedMotion: true,
      textScale: 2,
    });
    expect(
      preferences.transition({ kind: 'fade', duration: 1 }),
    ).toBeUndefined();
    preferences.destroy();
  });
  it('keeps explicit player choices above changing OS preferences and reset follows the current OS value', () => {
    const contrast = new PreferenceQuery(),
      motion = new PreferenceQuery();
    const preferences = new AccessibilityPreferences({
      matchMedia: (query: string) =>
        (query.includes('contrast')
          ? contrast
          : motion) as unknown as MediaQueryList,
    });
    motion.change(true);
    expect(preferences.duration(0.4)).toBe(0);
    preferences.set({ reducedMotion: false, textScale: 2 });
    motion.change(false);
    motion.change(true);
    expect(preferences.values).toEqual({
      textScale: 2,
      highContrast: false,
      reducedMotion: false,
    });
    preferences.reset();
    expect(preferences.values).toEqual({
      textScale: 1,
      highContrast: false,
      reducedMotion: true,
    });
    preferences.destroy();
    motion.change(false);
    expect(preferences.values.reducedMotion).toBe(true);
  });

  it('rejects invalid preference batches without partially applying text scale', () => {
    const preferences = new AccessibilityPreferences(undefined);
    expect(() =>
      preferences.set({
        textScale: 2,
        reducedMotion: 'false' as unknown as boolean,
      }),
    ).toThrow(TypeError);
    expect(preferences.values.textScale).toBe(1);
    expect(() => preferences.set({ textScale: 2.01 })).toThrow(RangeError);
    expect(() => preferences.set({ textScale: NaN })).toThrow(RangeError);
    preferences.set({ textScale: 2, highContrast: true });
    const saved = preferences.export();
    Object.assign(saved, { textScale: 1 });
    expect(preferences.values.textScale).toBe(2);
    preferences.destroy();
  });

  it('finishes decorative tweens and removes transitions without changing essential movement or callbacks', () => {
    const preferences = new AccessibilityPreferences(undefined);
    preferences.set({ reducedMotion: true });
    const target = { x: 0 };
    let completed = 0;
    const tween = preferences.tween(
      target,
      { x: 100 },
      {
        duration: 1,
        delay: 2,
        repeat: Infinity,
        yoyo: true,
        onComplete: () => {
          completed++;
        },
      },
    );
    tween.play();
    tween.update(0);
    expect(target.x).toBe(100);
    expect(completed).toBe(1);
    expect(tween.completed).toBe(true);
    expect(preferences.delta(0.016, true)).toBe(0.016);
    expect(preferences.delta(0.016)).toBe(0);
    expect(
      preferences.transition({ kind: 'slide', duration: 1 }),
    ).toBeUndefined();
    const essential = preferences.tween(
      target,
      { x: 200 },
      { duration: 1 },
      true,
    );
    essential.play();
    essential.update(0.5);
    expect(target.x).toBe(150);
    preferences.destroy();
  });

  it('updates live animation owners only when motion changes and honors disposal', () => {
    const preferences = new AccessibilityPreferences(undefined);
    const events: boolean[] = [];
    const release = preferences.bindMotion((enabled) => {
      events.push(enabled);
    });
    preferences.set({ highContrast: true });
    preferences.set({ reducedMotion: true });
    release();
    preferences.set({ reducedMotion: false });
    expect(events).toEqual([true, false]);
    preferences.destroy();
    expect(() => preferences.bindMotion(() => {})).toThrow();
  });
});
