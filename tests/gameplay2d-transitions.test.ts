import { describe, expect, it } from 'vitest';
import { TransitionController } from '../packages/core/src/transitions2d/index.js';

describe('TransitionController completion', () => {
  it('fully presents the incoming scene when an asymptotic easing reaches its duration', () => {
    const transition = new TransitionController({
      kind: 'crossfade',
      duration: 1,
      easing: (progress) => 1 - Math.exp(-3 * progress),
    });
    expect(transition.advance(0.5).progress).toBeCloseTo(1 - Math.exp(-1.5));
    expect(transition.complete).toBe(false);
    expect(transition.advance(0.5).progress).toBe(1);
    expect(transition.complete).toBe(true);
    transition.destroy();
  });
});
